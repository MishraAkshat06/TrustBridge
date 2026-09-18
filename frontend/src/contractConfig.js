export const CONTRACT_ADDRESS = "YOUR_CONTRACT_ADDRESS_HERE"; // Update after deployment in Remix

export const CONTRACT_ABI = [
  "function MIN_GOAL() view returns (uint256)",
  "function HARD_CAP() view returns (uint256)",
  "function creator() view returns (address)",
  "function verifier() view returns (address)",
  "function totalRaised() view returns (uint256)",
  "function milestoneApproved() view returns (bool)",
  "function creatorWithdrawn() view returns (bool)",
  "function contributions(address) view returns (uint256)",
  "function contribute() payable",
  "function approveMilestone()",
  "function requestRefund()",
  "function creatorWithdraw()",
  "event Contribution(address indexed contributor, uint256 amount, uint256 totalRaised)",
  "event Refund(address indexed contributor, uint256 amount)",
  "event MilestoneReleased(address indexed verifier, uint256 totalFunds)"
];
