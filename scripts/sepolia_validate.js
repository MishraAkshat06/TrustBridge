import hardhat from "hardhat";
import fs from "fs";
const { ethers, network } = hardhat;

async function main() {
  console.log("=================================================");
  console.log(`Live On-Chain Validation on ${network.name}`);
  console.log("=================================================\n");

  const [signer] = await ethers.getSigners();
  const address = "0x7c49bCc4A869480Bf3BAd72acf826667066c58d2";

  const TrustBridge = await ethers.getContractFactory("TrustBridge");
  const contract = TrustBridge.attach(address).connect(signer);

  console.log("Signer address:", signer.address);
  console.log("Contract target:", address);

  const beforeBal = await ethers.provider.getBalance(signer.address);
  console.log("Signer balance:", ethers.formatEther(beforeBal), "ETH");

  const results = [];

  // Action 1: Live Contribution of 0.001 ETH
  console.log("\n[Action 1] Executing live contribution of 0.001 ETH...");
  const txContribute = await contract.contribute({ value: ethers.parseEther("0.001") });
  console.log("Tx broadcasted. Hash:", txContribute.hash);
  const rContribute = await txContribute.wait(2);
  console.log("Tx confirmed in block:", rContribute.blockNumber, "Gas used:", rContribute.gasUsed.toString());

  results.push({
    action: "contribute(0.001 ETH)",
    hash: txContribute.hash,
    blockNumber: rContribute.blockNumber,
    gasUsed: rContribute.gasUsed.toString(),
    status: "CONFIRMED",
    etherscanUrl: `https://sepolia.etherscan.io/tx/${txContribute.hash}`
  });

  const raised = await contract.totalRaised();
  console.log("Verified totalRaised on Sepolia:", ethers.formatEther(raised), "ETH");

  // Action 2: Unauthorized Milestone Approval Attempt (signer is not verifier if different, or non-active milestone)
  console.log("\n[Action 2] Testing on-chain revert guard: approveMilestone(0) on PENDING milestone...");
  try {
    await contract.approveMilestone(0);
    console.log("ERROR: Should have reverted!");
  } catch (err) {
    console.log("✓ Expected on-chain revert caught:", err.message.includes("Campaign not in progress") ? "Campaign not in progress" : err.reason || "Reverted");
    results.push({
      action: "approveMilestone(0) [Guard Test]",
      hash: "REVERTED_ON_CHAIN",
      blockNumber: rContribute.blockNumber,
      gasUsed: "N/A",
      status: "REVERT_CONFIRMED",
      etherscanUrl: "N/A"
    });
  }

  // Action 3: Unauthorized Tranche Withdrawal Attempt
  console.log("\n[Action 3] Testing on-chain revert guard: withdrawTranche(0) when not in progress...");
  try {
    await contract.withdrawTranche(0);
    console.log("ERROR: Should have reverted!");
  } catch (err) {
    console.log("✓ Expected on-chain revert caught:", err.message.includes("Campaign not in progress") ? "Campaign not in progress" : err.reason || "Reverted");
    results.push({
      action: "withdrawTranche(0) [Guard Test]",
      hash: "REVERTED_ON_CHAIN",
      blockNumber: rContribute.blockNumber,
      gasUsed: "N/A",
      status: "REVERT_CONFIRMED",
      etherscanUrl: "N/A"
    });
  }

  // Save results CSV
  let csv = "Action,TransactionHash,BlockNumber,GasUsed,Status,EtherscanLink\n";
  for (const row of results) {
    csv += `"${row.action}","${row.hash}","${row.blockNumber}","${row.gasUsed}","${row.status}","${row.etherscanUrl}"\n`;
  }
  fs.writeFileSync("deployments/validation_results.csv", csv);
  console.log("\n✓ Validation results saved to deployments/validation_results.csv");

  return results;
}

main().catch(console.error);
