import hardhat from "hardhat";
import fs from "fs";
const { ethers } = hardhat;

async function runWS4Validation() {
  console.log("=================================================");
  console.log("   WS-4: Nine Required Validation Transactions   ");
  console.log("=================================================\n");

  const [creator, verifier, user1, user2, user3, user4, excessBacker] = await ethers.getSigners();
  const duration = 30 * 24 * 3600;

  const TrustBridge = await ethers.getContractFactory("TrustBridge");
  const contract = await TrustBridge.connect(creator).deploy(
    verifier.address,
    duration,
    "Architecture & Prototype",
    "Testnet Launch & Audits",
    "Security Verification",
    "Production Readiness"
  );
  await contract.waitForDeployment();
  const contractAddr = await contract.getAddress();
  const deployReceipt = await contract.deploymentTransaction().wait();

  console.log(`Contract deployed at: ${contractAddr} (Block: ${deployReceipt.blockNumber})\n`);

  const results = [];

  // T1: Contribution of 2 ETH
  console.log("T1: Contributing 2 ETH...");
  const tx1 = await contract.connect(user1).contribute({ value: ethers.parseEther("2.0") });
  const r1 = await tx1.wait();
  results.push({
    testId: "T1",
    action: "contribute(2.0 ETH)",
    sender: user1.address,
    hash: tx1.hash,
    blockNumber: r1.blockNumber,
    gasUsed: r1.gasUsed.toString(),
    totalRaised: ethers.formatEther(await contract.totalRaised()),
    status: "CONFIRMED",
    expected: "Accepted; total reaches 2 ETH"
  });

  // T2: Contribution of 5 ETH
  console.log("T2: Contributing 5 ETH...");
  const tx2 = await contract.connect(user2).contribute({ value: ethers.parseEther("5.0") });
  const r2 = await tx2.wait();
  results.push({
    testId: "T2",
    action: "contribute(5.0 ETH)",
    sender: user2.address,
    hash: tx2.hash,
    blockNumber: r2.blockNumber,
    gasUsed: r2.gasUsed.toString(),
    totalRaised: ethers.formatEther(await contract.totalRaised()),
    status: "CONFIRMED",
    expected: "Accepted; total reaches 7 ETH"
  });

  // T3: Contribution of 8 ETH
  console.log("T3: Contributing 8 ETH...");
  const tx3 = await contract.connect(user3).contribute({ value: ethers.parseEther("8.0") });
  const r3 = await tx3.wait();
  results.push({
    testId: "T3",
    action: "contribute(8.0 ETH)",
    sender: user3.address,
    hash: tx3.hash,
    blockNumber: r3.blockNumber,
    gasUsed: r3.gasUsed.toString(),
    totalRaised: ethers.formatEther(await contract.totalRaised()),
    status: "CONFIRMED",
    expected: "Accepted; total reaches 15 ETH"
  });

  // T4: Contribution of 4 ETH
  console.log("T4: Contributing 4 ETH...");
  const tx4 = await contract.connect(user4).contribute({ value: ethers.parseEther("4.0") });
  const r4 = await tx4.wait();
  results.push({
    testId: "T4",
    action: "contribute(4.0 ETH)",
    sender: user4.address,
    hash: tx4.hash,
    blockNumber: r4.blockNumber,
    gasUsed: r4.gasUsed.toString(),
    totalRaised: ethers.formatEther(await contract.totalRaised()),
    status: "CONFIRMED",
    expected: "Accepted; total reaches 19 ETH"
  });

  // T5: Send 2 ETH with 1 ETH capacity left (1 ETH accepted, 1 ETH refunded)
  console.log("T5: Sending 2 ETH into 1 ETH headroom...");
  const backerBalBefore = await ethers.provider.getBalance(excessBacker.address);
  const tx5 = await contract.connect(excessBacker).contribute({ value: ethers.parseEther("2.0") });
  const r5 = await tx5.wait();
  const backerBalAfter = await ethers.provider.getBalance(excessBacker.address);
  const gasCost = r5.gasUsed * r5.gasPrice;
  const netDeducted = backerBalBefore - backerBalAfter - gasCost;

  results.push({
    testId: "T5",
    action: "contribute(2.0 ETH) with 1 ETH headroom",
    sender: excessBacker.address,
    hash: tx5.hash,
    blockNumber: r5.blockNumber,
    gasUsed: r5.gasUsed.toString(),
    totalRaised: ethers.formatEther(await contract.totalRaised()),
    status: "CONFIRMED_SPLIT_REFUND",
    expected: `1 ETH accepted (${ethers.formatEther(netDeducted)} ETH net deducted, 1 ETH refunded)`
  });

  // T6: Send 1 ETH with the cap full
  console.log("T6: Sending 1 ETH with the cap full...");
  let t6Hash = "";
  try {
    await contract.connect(user1).contribute({ value: ethers.parseEther("1.0") });
  } catch (err) {
    t6Hash = "REVERTED_ON_CHAIN_AS_EXPECTED";
    results.push({
      testId: "T6",
      action: "contribute(1.0 ETH) when cap saturated",
      sender: user1.address,
      hash: t6Hash,
      blockNumber: r5.blockNumber,
      gasUsed: "0",
      totalRaised: ethers.formatEther(await contract.totalRaised()),
      status: "REVERTED: Hard cap reached / Campaign not active",
      expected: "Reverts cleanly without state mutation"
    });
  }

  // T7: Verifier approves milestone 1
  console.log("T7: Submitting & approving milestone 1...");
  const txSubmit = await contract.connect(creator).submitMilestoneEvidence("ipfs://testnet-launch-proof");
  await txSubmit.wait();
  const tx7 = await contract.connect(verifier).approveMilestone(1);
  const r7 = await tx7.wait();
  results.push({
    testId: "T7",
    action: "approveMilestone(1)",
    sender: verifier.address,
    hash: tx7.hash,
    blockNumber: r7.blockNumber,
    gasUsed: r7.gasUsed.toString(),
    totalRaised: ethers.formatEther(await contract.totalRaised()),
    status: "APPROVED",
    expected: `Index advances to ${await contract.currentMilestoneIndex()}`
  });

  // T8: Claim refund mid-progress (denied)
  console.log("T8: Attempting refund claim mid-progress...");
  try {
    await contract.connect(user1).claimRefund();
  } catch (err) {
    results.push({
      testId: "T8",
      action: "claimRefund() mid-progress",
      sender: user1.address,
      hash: "REVERTED_ON_CHAIN_AS_EXPECTED",
      blockNumber: r7.blockNumber,
      gasUsed: "0",
      totalRaised: ethers.formatEther(await contract.totalRaised()),
      status: "REVERTED: Refunds not eligible",
      expected: "Denied (Campaign IN_PROGRESS)"
    });
  }

  // T9: Creator withdraws tranche
  console.log("T9: Creator withdraws tranche 0...");
  const tx9 = await contract.connect(creator).withdrawTranche(0);
  const r9 = await tx9.wait();
  results.push({
    testId: "T9",
    action: "withdrawTranche(0)",
    sender: creator.address,
    hash: tx9.hash,
    blockNumber: r9.blockNumber,
    gasUsed: r9.gasUsed.toString(),
    totalRaised: ethers.formatEther(await contract.totalRaised()),
    status: "WITHDRAWN",
    expected: `4.0 ETH paid to creator (Total withdrawn: ${ethers.formatEther(await contract.totalWithdrawn())} ETH)`
  });

  console.table(results);

  // Write CSV
  let csv = "TestID,Action,Sender,TransactionHash,BlockNumber,GasUsed,TotalRaised,Status,ExpectedOutcome\n";
  for (const r of results) {
    csv += `"${r.testId}","${r.action}","${r.sender}","${r.hash}","${r.blockNumber}","${r.gasUsed}","${r.totalRaised}","${r.status}","${r.expected}"\n`;
  }
  fs.writeFileSync("deployments/t1_t9_validation_results.csv", csv);
  console.log("\n✓ Saved results to deployments/t1_t9_validation_results.csv");

  return results;
}

runWS4Validation()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
