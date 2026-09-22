import hardhat from "hardhat";
import fs from "fs";
const { ethers } = hardhat;

async function runGasBenchmark() {
  console.log("=================================================");
  console.log("      TrustBridge EVM Gas Benchmark & Telemetry   ");
  console.log("=================================================\n");

  const [creator, verifier, contributor1, contributor2, contributor3] = await ethers.getSigners();
  const duration = 30 * 24 * 3600;

  const TrustBridge = await ethers.getContractFactory("TrustBridge");

  // 1. Deploy
  const deployTx = await TrustBridge.connect(creator).deploy(
    verifier.address,
    duration,
    "Milestone 1",
    "Milestone 2",
    "Milestone 3",
    "Milestone 4"
  );
  const deployReceipt = await deployTx.deploymentTransaction().wait();
  const gasDeploy = deployReceipt.gasUsed;

  const contract = deployTx;

  // 2. Contribute (Standard, no excess)
  const txContribute = await contract.connect(contributor1).contribute({ value: ethers.parseEther("5.0") });
  const rContribute = await txContribute.wait();
  const gasContribute = rContribute.gasUsed;

  // 3. Contribute (Additional to reach 19 ETH)
  await (await contract.connect(contributor2).contribute({ value: ethers.parseEther("14.0") })).wait();

  // 4. Contribute with Excess Refund (2 ETH into 1 ETH headroom -> 1 ETH accepted, 1 ETH refunded)
  const txContributeExcess = await contract.connect(contributor3).contribute({ value: ethers.parseEther("2.0") });
  const rContributeExcess = await txContributeExcess.wait();
  const gasContributeExcess = rContributeExcess.gasUsed;

  // Now campaign is at 20 ETH (IN_PROGRESS, milestone 0 auto-approved)

  // 5. Withdraw Tranche (Tranche 0 - 20% = 4 ETH)
  const txWithdraw = await contract.connect(creator).withdrawTranche(0);
  const rWithdraw = await txWithdraw.wait();
  const gasWithdraw = rWithdraw.gasUsed;

  // 6. Submit Milestone Evidence
  const txSubmit = await contract.connect(creator).submitMilestoneEvidence("ipfs://evidence-sample");
  const rSubmit = await txSubmit.wait();
  const gasSubmit = rSubmit.gasUsed;

  // 7. Approve Milestone
  const txApprove = await contract.connect(verifier).approveMilestone(1);
  const rApprove = await txApprove.wait();
  const gasApprove = rApprove.gasUsed;

  // Measure Reject on another instance
  const contract2 = await TrustBridge.connect(creator).deploy(
    verifier.address,
    duration,
    "M1", "M2", "M3", "M4"
  );
  await contract2.waitForDeployment();
  await (await contract2.connect(contributor1).contribute({ value: ethers.parseEther("20.0") })).wait();
  await (await contract2.connect(creator).submitMilestoneEvidence("ipfs://evidence-reject")).wait();
  const txReject = await contract2.connect(verifier).rejectMilestone(1);
  const rReject = await txReject.wait();
  const gasReject = rReject.gasUsed;

  // 8. Claim Refund (FAILED State)
  const contractFailed = await TrustBridge.connect(creator).deploy(
    verifier.address,
    10, // 10 seconds
    "M1", "M2", "M3", "M4"
  );
  await contractFailed.waitForDeployment();
  await (await contractFailed.connect(contributor1).contribute({ value: ethers.parseEther("5.0") })).wait();
  await ethers.provider.send("evm_increaseTime", [15]);
  await ethers.provider.send("evm_mine");
  await (await contractFailed.finalizeFunding()).wait();

  const txRefundFailed = await contractFailed.connect(contributor1).claimRefund();
  const rRefundFailed = await txRefundFailed.wait();
  const gasRefundFailed = rRefundFailed.gasUsed;

  // 9. Claim Refund (REFUNDABLE State)
  // reject attempt 2 on contract2
  await (await contract2.connect(creator).submitMilestoneEvidence("ipfs://evidence-reject-2")).wait();
  await (await contract2.connect(verifier).rejectMilestone(1)).wait(); // now REFUNDABLE
  const txRefundRefundable = await contract2.connect(contributor1).claimRefund();
  const rRefundRefundable = await txRefundRefundable.wait();
  const gasRefundRefundable = rRefundRefundable.gasUsed;

  const gasTable = [
    { operation: "Contract Deployment", gasUsed: gasDeploy.toString(), notes: "Initializes immutable constants and 4 milestone structs" },
    { operation: "contribute() [Standard]", gasUsed: gasContribute.toString(), notes: "Under-cap deposit, updates balance and totalRaised" },
    { operation: "contribute() [With Excess Split]", gasUsed: gasContributeExcess.toString(), notes: "Calculates clamp headroom, triggers in-block refund" },
    { operation: "submitMilestoneEvidence()", gasUsed: gasSubmit.toString(), notes: "Stores IPFS hash, transitions milestone to UNDER_REVIEW" },
    { operation: "approveMilestone()", gasUsed: gasApprove.toString(), notes: "Advances currentMilestoneIndex, unlocks tranche" },
    { operation: "rejectMilestone()", gasUsed: gasReject.toString(), notes: "Marks milestone REJECTED, tracks attempt counter" },
    { operation: "withdrawTranche()", gasUsed: gasWithdraw.toString(), notes: "Pull-payment ETH transfer to creator" },
    { operation: "claimRefund() [FAILED]", gasUsed: gasRefundFailed.toString(), notes: "100% principal pull-payment refund" },
    { operation: "claimRefund() [REFUNDABLE]", gasUsed: gasRefundRefundable.toString(), notes: "Equal-per-wei pro-rata pull-payment refund" }
  ];

  console.table(gasTable);

  const reportPath = "deployments/gas_measurements.json";
  fs.writeFileSync(reportPath, JSON.stringify(gasTable, null, 2));
  console.log(`\n✓ Gas measurements saved to ${reportPath}`);

  return gasTable;
}

runGasBenchmark()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
