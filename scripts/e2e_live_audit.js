import { ethers } from "ethers";

async function main() {
  const rpc = "https://sepolia.infura.io/v3/afb2b386de5d4cbd9036fa43056f3e9b";
  const address = "0x7c49bCc4A869480Bf3BAd72acf826667066c58d2";
  const provider = new ethers.JsonRpcProvider(rpc);

  const abi = [
    "function minGoal() view returns (uint256)",
    "function hardCap() view returns (uint256)",
    "function creator() view returns (address)",
    "function verifier() view returns (address)",
    "function state() view returns (uint8)",
    "function totalRaised() view returns (uint256)",
    "function totalWithdrawn() view returns (uint256)",
    "function currentMilestoneIndex() view returns (uint8)",
    "function getMilestone(uint8 index) view returns (string title, string evidenceIpfsHash, uint256 trancheBps, uint8 milestoneState, uint8 submissionAttempts, bool trancheClaimed)",
    "function contributions(address) view returns (uint256)"
  ];

  const contract = new ethers.Contract(address, abi, provider);

  console.log("=== Sepolia Live On-Chain State Inspection ===");
  console.log("Contract:", address);
  console.log("Network: Ethereum Sepolia (Chain ID: 11155111)");
  
  const balance = await provider.getBalance(address);
  console.log("Live Contract Balance:", ethers.formatEther(balance), "ETH");
  console.log("Total Raised:", ethers.formatEther(await contract.totalRaised()), "ETH");
  console.log("Total Withdrawn:", ethers.formatEther(await contract.totalWithdrawn()), "ETH");
  console.log("State (0=ACTIVE, 1=FUNDED, 2=IN_PROGRESS, 3=COMPLETED, 4=FAILED, 5=REFUNDABLE):", Number(await contract.state()));
  console.log("Current Milestone Index:", Number(await contract.currentMilestoneIndex()));

  console.log("\n--- Milestones ---");
  const stateLabels = ["PENDING", "UNDER_REVIEW", "APPROVED", "REJECTED"];
  for (let i = 0; i < 4; i++) {
    const m = await contract.getMilestone(i);
    console.log(`[Tranche ${i + 1}] "${m.title}"`);
    console.log(`  Share: ${Number(m.trancheBps) / 100}% (${m.trancheBps.toString()} bps)`);
    console.log(`  State: ${stateLabels[Number(m.milestoneState)] || m.milestoneState}`);
    console.log(`  Attempts: ${m.submissionAttempts.toString()}`);
    console.log(`  Claimed: ${m.trancheClaimed}`);
    console.log(`  Evidence IPFS: "${m.evidenceIpfsHash}"`);
  }

  const deployer = "0xEf7A83468D2152718465D9143E3615ab9189D5f9";
  const contrib = await contract.contributions(deployer);
  console.log(`\nDeployer (${deployer}) Contribution:`, ethers.formatEther(contrib), "ETH");
}

main().catch(console.error);
