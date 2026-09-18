export const CONTRACT_ADDRESS = "0x1b44F3514812d835EB1BDB0acB33d3fA3351Ee43";

export const CONTRACT_ABI = [
  "function minGoal() view returns (uint256)",
  "function hardCap() view returns (uint256)",
  "function TOTAL_BPS() view returns (uint256)",
  "function creator() view returns (address)",
  "function verifier() view returns (address)",
  "function campaignDeadline() view returns (uint256)",
  "function totalRaised() view returns (uint256)",
  "function totalWithdrawn() view returns (uint256)",
  "function state() view returns (uint8)",
  "function currentMilestoneIndex() view returns (uint8)",
  "function milestones(uint256) view returns (string title, string evidenceIpfsHash, uint256 trancheBps, uint8 state, uint8 submissionAttempts, bool trancheClaimed)",
  "function contributions(address) view returns (uint256)",
  "function contribute() payable",
  "function finalizeFunding()",
  "function submitMilestoneEvidence(string evidenceIpfsHash)",
  "function approveMilestone(uint8 milestoneIndex)",
  "function rejectMilestone(uint8 milestoneIndex)",
  "function withdrawTranche(uint8 milestoneIndex)",
  "function claimRefund()",
  "function getMilestone(uint8 index) view returns (string title, string evidenceIpfsHash, uint256 trancheBps, uint8 milestoneState, uint8 submissionAttempts, bool trancheClaimed)",
  "event ContributionReceived(address indexed contributor, uint256 amount, uint256 totalRaised)",
  "event ExcessRefundIssued(address indexed contributor, uint256 amount)",
  "event CampaignFunded(uint256 totalRaised)",
  "event CampaignFailed(uint256 totalRaised)",
  "event MilestoneSubmitted(uint8 indexed index, string evidenceIpfsHash, uint8 attempt)",
  "event MilestoneApproved(uint8 indexed index, uint256 trancheAmount)",
  "event MilestoneRejected(uint8 indexed index, uint8 attempt, bool finalRejection)",
  "event TrancheWithdrawn(address indexed creator, uint8 indexed index, uint256 amount)",
  "event ContributorRefundIssued(address indexed contributor, uint256 amount)"
];

