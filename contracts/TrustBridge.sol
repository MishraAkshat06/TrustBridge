// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title TrustBridge
 * @notice Production Phase 2 Crowdfunding Escrow Contract.
 * @dev Enforces 10 ETH minGoal, 20 ETH hardCap, 4-tranche payout, 1-retry milestone review, and pull-payment security.
 */
contract TrustBridge {
    // ------------------------------------------------------------------------
    // Types & Enums
    // ------------------------------------------------------------------------

    enum CampaignState {
        ACTIVE,
        FUNDED,
        IN_PROGRESS,
        COMPLETED,
        FAILED,
        REFUNDABLE
    }

    enum MilestoneState {
        PENDING,
        SUBMITTED,
        UNDER_REVIEW,
        APPROVED,
        REJECTED
    }

    struct Milestone {
        string title;
        string evidenceIpfsHash;
        uint256 trancheBps; // Basis points (2000 = 20%, 2500 = 25%, 3000 = 30%)
        MilestoneState state;
        uint8 submissionAttempts; // Max 2 (1 initial + 1 retry grace period)
        bool trancheClaimed;
    }

    // ------------------------------------------------------------------------
    // State Variables
    // ------------------------------------------------------------------------

    uint256 public constant minGoal = 10 ether;
    uint256 public constant hardCap = 20 ether;
    uint256 public constant TOTAL_BPS = 10000;

    address public immutable creator;
    address public immutable verifier;
    uint256 public immutable campaignDeadline;

    uint256 public totalRaised;
    uint256 public totalWithdrawn;
    CampaignState public state;

    Milestone[4] public milestones;
    uint8 public currentMilestoneIndex; // 0..3

    mapping(address => uint256) public contributions;
    mapping(address => bool) private _reentrancyLock;

    // ------------------------------------------------------------------------
    // Events
    // ------------------------------------------------------------------------

    event ContributionReceived(address indexed contributor, uint256 amount, uint256 totalRaised);
    event ExcessRefundIssued(address indexed contributor, uint256 amount);
    event CampaignFunded(uint256 totalRaised);
    event CampaignFailed(uint256 totalRaised);
    event MilestoneSubmitted(uint8 indexed index, string evidenceIpfsHash, uint8 attempt);
    event MilestoneApproved(uint8 indexed index, uint256 trancheAmount);
    event MilestoneRejected(uint8 indexed index, uint8 attempt, bool finalRejection);
    event TrancheWithdrawn(address indexed creator, uint8 indexed index, uint256 amount);
    event ContributorRefundIssued(address indexed contributor, uint256 amount);

    // ------------------------------------------------------------------------
    // Modifiers
    // ------------------------------------------------------------------------

    modifier onlyCreator() {
        require(msg.sender == creator, "Only creator permitted");
        _;
    }

    modifier onlyVerifier() {
        require(msg.sender == verifier, "Only verifier permitted");
        _;
    }

    modifier nonReentrant() {
        require(!_reentrancyLock[msg.sender], "Reentrancy guard triggered");
        _reentrancyLock[msg.sender] = true;
        _;
        _reentrancyLock[msg.sender] = false;
    }

    // ------------------------------------------------------------------------
    // Constructor
    // ------------------------------------------------------------------------

    constructor(
        address _verifier,
        uint256 durationSeconds,
        string memory m1Title,
        string memory m2Title,
        string memory m3Title,
        string memory m4Title
    ) {
        require(_verifier != address(0), "Invalid verifier");
        require(durationSeconds > 0, "Invalid duration");

        creator = msg.sender;
        verifier = _verifier;
        campaignDeadline = block.timestamp + durationSeconds;
        state = CampaignState.ACTIVE;

        // Tranche schedule: 20%, 25%, 25%, 30%
        milestones[0] = Milestone(m1Title, "", 2000, MilestoneState.PENDING, 0, false);
        milestones[1] = Milestone(m2Title, "", 2500, MilestoneState.PENDING, 0, false);
        milestones[2] = Milestone(m3Title, "", 2500, MilestoneState.PENDING, 0, false);
        milestones[3] = Milestone(m4Title, "", 3000, MilestoneState.PENDING, 0, false);
    }

    // ------------------------------------------------------------------------
    // Contribution Logic
    // ------------------------------------------------------------------------

    function contribute() external payable nonReentrant {
        require(state == CampaignState.ACTIVE, "Campaign not active");
        require(block.timestamp <= campaignDeadline, "Campaign deadline passed");
        require(msg.value > 0, "Amount must be > 0");
        require(totalRaised < hardCap, "Hard cap reached");

        uint256 remainingCap = hardCap - totalRaised;
        uint256 acceptedAmount = msg.value > remainingCap ? remainingCap : msg.value;
        uint256 excessAmount = msg.value - acceptedAmount;

        totalRaised += acceptedAmount;
        contributions[msg.sender] += acceptedAmount;

        emit ContributionReceived(msg.sender, acceptedAmount, totalRaised);

        if (excessAmount > 0) {
            emit ExcessRefundIssued(msg.sender, excessAmount);
            (bool refundOk, ) = payable(msg.sender).call{value: excessAmount}("");
            require(refundOk, "Excess refund transfer failed");
        }

        if (totalRaised == hardCap) {
            _markFunded();
        }
    }

    function finalizeFunding() external {
        require(state == CampaignState.ACTIVE, "Campaign not in active state");
        require(block.timestamp > campaignDeadline || totalRaised == hardCap, "Funding still ongoing");

        if (totalRaised >= minGoal) {
            _markFunded();
        } else {
            state = CampaignState.FAILED;
            emit CampaignFailed(totalRaised);
        }
    }

    function _markFunded() internal {
        state = CampaignState.FUNDED;
        emit CampaignFunded(totalRaised);
        // Tranche 1 (20% upfront) unlocks upon reaching FUNDED
        milestones[0].state = MilestoneState.APPROVED;
        state = CampaignState.IN_PROGRESS;
    }

    // ------------------------------------------------------------------------
    // Milestone Lifecycle & Grace Period
    // ------------------------------------------------------------------------

    function submitMilestoneEvidence(string calldata ipfsHash) external onlyCreator {
        require(state == CampaignState.IN_PROGRESS, "Campaign not in progress");
        uint8 idx = currentMilestoneIndex;
        require(idx < 4, "All milestones completed");

        Milestone storage m = milestones[idx];
        require(
            m.state == MilestoneState.PENDING || m.state == MilestoneState.REJECTED,
            "Invalid milestone state for submission"
        );
        require(m.submissionAttempts < 2, "Grace period exceeded");
        require(bytes(ipfsHash).length > 0, "Empty evidence hash");

        m.submissionAttempts += 1;
        m.evidenceIpfsHash = ipfsHash;
        m.state = MilestoneState.UNDER_REVIEW;

        emit MilestoneSubmitted(idx, ipfsHash, m.submissionAttempts);
    }

    function approveMilestone(uint8 milestoneIndex) external onlyVerifier {
        require(state == CampaignState.IN_PROGRESS, "Campaign not in progress");
        require(milestoneIndex == currentMilestoneIndex, "Not active milestone");

        Milestone storage m = milestones[milestoneIndex];
        require(m.state == MilestoneState.UNDER_REVIEW, "Milestone not under review");

        m.state = MilestoneState.APPROVED;
        uint256 trancheAmount = (totalRaised * m.trancheBps) / TOTAL_BPS;
        emit MilestoneApproved(milestoneIndex, trancheAmount);

        if (currentMilestoneIndex == 3) {
            state = CampaignState.COMPLETED;
        } else {
            currentMilestoneIndex += 1;
        }
    }

    function rejectMilestone(uint8 milestoneIndex) external onlyVerifier {
        require(state == CampaignState.IN_PROGRESS, "Campaign not in progress");
        require(milestoneIndex == currentMilestoneIndex, "Not active milestone");

        Milestone storage m = milestones[milestoneIndex];
        require(m.state == MilestoneState.UNDER_REVIEW, "Milestone not under review");

        m.state = MilestoneState.REJECTED;

        if (m.submissionAttempts >= 2) {
            state = CampaignState.REFUNDABLE;
            emit MilestoneRejected(milestoneIndex, m.submissionAttempts, true);
        } else {
            emit MilestoneRejected(milestoneIndex, m.submissionAttempts, false);
        }
    }

    // ------------------------------------------------------------------------
    // Pull-Payment Withdrawals & Refunds
    // ------------------------------------------------------------------------

    function withdrawTranche(uint8 milestoneIndex) external onlyCreator nonReentrant {
        require(milestoneIndex < 4, "Invalid milestone index");
        Milestone storage m = milestones[milestoneIndex];
        require(m.state == MilestoneState.APPROVED, "Tranche not approved");
        require(!m.trancheClaimed, "Tranche already withdrawn");

        m.trancheClaimed = true;
        uint256 amount = (totalRaised * m.trancheBps) / TOTAL_BPS;
        totalWithdrawn += amount;

        emit TrancheWithdrawn(creator, milestoneIndex, amount);

        (bool success, ) = payable(creator).call{value: amount}("");
        require(success, "Creator withdrawal transfer failed");
    }

    function claimRefund() external nonReentrant {
        require(
            state == CampaignState.FAILED || state == CampaignState.REFUNDABLE,
            "Refunds not eligible"
        );
        uint256 contribution = contributions[msg.sender];
        require(contribution > 0, "No contribution to refund");

        contributions[msg.sender] = 0;

        uint256 refundAmount;
        if (state == CampaignState.FAILED) {
            refundAmount = contribution;
        } else {
            uint256 remainingEscrow = address(this).balance;
            uint256 totalRemainingContributions = totalRaised - totalWithdrawn;
            refundAmount = (contribution * remainingEscrow) / totalRemainingContributions;
        }

        require(refundAmount > 0, "Calculated refund is 0");
        emit ContributorRefundIssued(msg.sender, refundAmount);

        (bool success, ) = payable(msg.sender).call{value: refundAmount}("");
        require(success, "Refund transfer failed");
    }

    // ------------------------------------------------------------------------
    // Getters & Fallbacks
    // ------------------------------------------------------------------------

    function getMilestone(uint8 index) external view returns (
        string memory title,
        string memory evidenceIpfsHash,
        uint256 trancheBps,
        MilestoneState milestoneState,
        uint8 submissionAttempts,
        bool trancheClaimed
    ) {
        require(index < 4, "Invalid index");
        Milestone storage m = milestones[index];
        return (
            m.title,
            m.evidenceIpfsHash,
            m.trancheBps,
            m.state,
            m.submissionAttempts,
            m.trancheClaimed
        );
    }

    receive() external payable {
        revert("Use contribute() function");
    }
}
