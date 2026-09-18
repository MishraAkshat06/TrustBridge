// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title TrustBridgePOC
 * @notice Proof-of-concept crowdfunding contract for TrustBridge Phase 1.
 * @dev Enforces 10 ETH minGoal, 20 ETH hardCap, excess refunds, milestone verification, and creator withdrawals.
 */
contract TrustBridgePOC {
    // ------------------------------------------------------------------------
    // State Variables
    // ------------------------------------------------------------------------

    /// @notice Minimum funding goal required for milestone approval (10 ETH)
    uint256 public constant minGoal = 10 ether;

    /// @notice Maximum funding limit allowed (20 ETH)
    uint256 public constant hardCap = 20 ether;

    /// @notice Total ETH successfully accepted by contract
    uint256 public totalRaised;

    /// @notice Timestamp when funding period ends
    uint256 public immutable campaignDeadline;

    /// @notice Address of campaign creator / contract deployer
    address public immutable creator;

    /// @notice Status flag set when verifier approves milestone
    bool public milestoneReached;

    /// @notice Track contributions per address
    mapping(address => uint256) public contributions;

    // ------------------------------------------------------------------------
    // Events
    // ------------------------------------------------------------------------

    /// @notice Emitted on accepted ETH contribution
    event Contribution(address indexed contributor, uint256 amount, uint256 totalRaised);

    /// @notice Emitted when contributor reclaims funds
    event Refund(address indexed contributor, uint256 amount);

    /// @notice Emitted when milestone is approved
    event MilestoneApproved(address indexed verifier);

    // ------------------------------------------------------------------------
    // Modifiers
    // ------------------------------------------------------------------------

    modifier onlyCreator() {
        require(msg.sender == creator, "Only creator allowed");
        _;
    }

    // ------------------------------------------------------------------------
    // Constructor
    // ------------------------------------------------------------------------

    /**
     * @notice Deploy contract with duration in seconds.
     * @param durationSeconds Duration of funding campaign in seconds.
     */
    constructor(uint256 durationSeconds) {
        creator = msg.sender;
        campaignDeadline = block.timestamp + durationSeconds;
    }

    // ------------------------------------------------------------------------
    // Core Functions
    // ------------------------------------------------------------------------

    /**
     * @notice Accept ETH up to hardCap. Refund excess ETH to msg.sender.
     */
    function contribute() external payable {
        require(totalRaised < hardCap, "Hard cap reached");
        require(msg.value > 0, "Contribution must be > 0");

        uint256 remainingCapacity = hardCap - totalRaised;
        uint256 acceptedAmount = msg.value > remainingCapacity ? remainingCapacity : msg.value;
        uint256 excessAmount = msg.value - acceptedAmount;

        totalRaised += acceptedAmount;
        contributions[msg.sender] += acceptedAmount;

        emit Contribution(msg.sender, acceptedAmount, totalRaised);

        if (excessAmount > 0) {
            (bool refundSuccess, ) = payable(msg.sender).call{value: excessAmount}("");
            require(refundSuccess, "Excess refund failed");
        }
    }

    /**
     * @notice Approve milestone. Requires totalRaised >= minGoal.
     */
    function approveMilestone() external {
        require(totalRaised >= minGoal, "Min goal not met");
        require(!milestoneReached, "Milestone already reached");

        milestoneReached = true;
        emit MilestoneApproved(msg.sender);
    }

    /**
     * @notice Request refund if milestoneReached == false.
     */
    function requestRefund() external {
        require(!milestoneReached, "Milestone approved: no refund");
        uint256 refundAmount = contributions[msg.sender];
        require(refundAmount > 0, "No contribution to refund");

        contributions[msg.sender] = 0;
        totalRaised -= refundAmount;

        emit Refund(msg.sender, refundAmount);

        (bool success, ) = payable(msg.sender).call{value: refundAmount}("");
        require(success, "Refund transfer failed");
    }

    /**
     * @notice Creator withdraws balance if milestoneReached == true.
     */
    function creatorWithdraw() external onlyCreator {
        require(milestoneReached, "Milestone not reached");
        uint256 balance = address(this).balance;
        require(balance > 0, "No balance to withdraw");

        (bool success, ) = payable(creator).call{value: balance}("");
        require(success, "Creator withdrawal failed");
    }

    /// @dev Fallback to accept ETH via contribute()
    receive() external payable {
        contribute();
    }
}
