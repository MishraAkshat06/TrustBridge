import { ethers } from "ethers";
import fs from "fs";

async function main() {
  console.log("=================================================================");
  console.log("   TrustBridge Phase 9: End-to-End Live Verification Suite       ");
  console.log("=================================================================\n");

  const rpc = "https://sepolia.infura.io/v3/afb2b386de5d4cbd9036fa43056f3e9b";
  const contractAddress = "0x7c49bCc4A869480Bf3BAd72acf826667066c58d2";
  const provider = new ethers.JsonRpcProvider(rpc);

  const report = {
    timestamp: new Date().toISOString(),
    network: "Ethereum Sepolia",
    chainId: 11155111,
    contractAddress,
    checks: []
  };

  // Check 1: Live Contract Existence & Bytecode
  console.log("[1/6] Verifying on-chain contract bytecode on Sepolia...");
  const code = await provider.getCode(contractAddress);
  const hasCode = code && code.length > 2;
  console.log(`      Contract bytecode size: ${(code.length - 2) / 2} bytes`);
  report.checks.push({
    step: 1,
    name: "On-Chain Bytecode Verification",
    status: hasCode ? "PASS" : "FAIL",
    detail: `Bytecode length: ${(code.length - 2) / 2} bytes`
  });

  // Check 2: Contract State & Parameters
  console.log("[2/6] Querying contract constants and live parameters...");
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
  const contract = new ethers.Contract(contractAddress, abi, provider);

  const [minGoal, hardCap, creator, verifier, state, totalRaised, totalWithdrawn, mIdx] = await Promise.all([
    contract.minGoal(),
    contract.hardCap(),
    contract.creator(),
    contract.verifier(),
    contract.state(),
    contract.totalRaised(),
    contract.totalWithdrawn(),
    contract.currentMilestoneIndex()
  ]);

  const minGoalEth = ethers.formatEther(minGoal);
  const hardCapEth = ethers.formatEther(hardCap);
  const raisedEth = ethers.formatEther(totalRaised);
  const withdrawnEth = ethers.formatEther(totalWithdrawn);

  console.log(`      minGoal: ${minGoalEth} ETH (expected 10.0 ETH)`);
  console.log(`      hardCap: ${hardCapEth} ETH (expected 20.0 ETH)`);
  console.log(`      creator: ${creator}`);
  console.log(`      verifier: ${verifier}`);
  console.log(`      state: ${state} (ACTIVE)`);
  console.log(`      totalRaised: ${raisedEth} ETH`);
  console.log(`      totalWithdrawn: ${withdrawnEth} ETH`);

  const paramsValid = minGoalEth === "10.0" && hardCapEth === "20.0" && Number(state) === 0;
  report.checks.push({
    step: 2,
    name: "Contract Parameters & Rules",
    status: paramsValid ? "PASS" : "FAIL",
    detail: `minGoal=${minGoalEth} ETH, hardCap=${hardCapEth} ETH, state=${state}`
  });

  // Check 3: 4-Tranche Milestone Verification
  console.log("[3/6] Verifying 4-tranche sequential milestone schedule...");
  let totalBps = 0;
  const milestones = [];
  for (let i = 0; i < 4; i++) {
    const m = await contract.getMilestone(i);
    const bps = Number(m.trancheBps);
    totalBps += bps;
    milestones.push({ index: i + 1, title: m.title, bps, pct: bps / 100 });
  }
  console.log(`      Total BPS: ${totalBps} / 10000 (100%)`);
  const bpsValid = totalBps === 10000 && milestones.length === 4;
  report.checks.push({
    step: 3,
    name: "4-Tranche Milestone Invariant",
    status: bpsValid ? "PASS" : "FAIL",
    detail: `4 tranches summing to ${totalBps} BPS`
  });

  // Check 4: Historical Transactions on Sepolia
  console.log("[4/6] Verifying Phase 4 deployment & Phase 5 contribution transactions...");
  const deployTx = "0xb79ff43f84190653504b230d0f75389f9fc2172286473a4620025caf1f6d7c4e";
  const contribTx = "0xcffdd3ccb9165d105b4d4f8aa0f5ac23b6903a022329885fd8d0f5da4f0c41dd";

  const [deployReceipt, contribReceipt] = await Promise.all([
    provider.getTransactionReceipt(deployTx),
    provider.getTransactionReceipt(contribTx)
  ]);

  const deployOk = deployReceipt && deployReceipt.status === 1;
  const contribOk = contribReceipt && contribReceipt.status === 1;

  console.log(`      Deploy Tx (${deployTx.slice(0, 10)}...): ${deployOk ? `CONFIRMED (Block ${deployReceipt.blockNumber})` : "FAILED"}`);
  console.log(`      Contrib Tx (${contribTx.slice(0, 10)}...): ${contribOk ? `CONFIRMED (Block ${contribReceipt.blockNumber}, Gas: ${contribReceipt.gasUsed})` : "FAILED"}`);

  report.checks.push({
    step: 4,
    name: "Live Sepolia Receipts Verification",
    status: (deployOk && contribOk) ? "PASS" : "FAIL",
    detail: `Deploy Block: ${deployReceipt?.blockNumber}, Contrib Block: ${contribReceipt?.blockNumber}`
  });

  // Check 5: Frontend Configuration Consistency
  console.log("[5/6] Verifying frontend and database address consistency...");
  const frontendEnv = fs.readFileSync("frontend/.env.local", "utf8");
  const contractConfig = fs.readFileSync("frontend/src/contractConfig.js", "utf8");
  const seedData = fs.readFileSync("backend/seed_data.py", "utf8");

  const frontendEnvHasAddr = frontendEnv.includes(contractAddress);
  const contractConfigHasAddr = contractConfig.includes(contractAddress);
  const seedDataHasAddr = seedData.includes(contractAddress);

  console.log(`      frontend/.env.local has address: ${frontendEnvHasAddr}`);
  console.log(`      frontend/src/contractConfig.js has address: ${contractConfigHasAddr}`);
  console.log(`      backend/seed_data.py has address: ${seedDataHasAddr}`);

  const configConsistent = frontendEnvHasAddr && contractConfigHasAddr && seedDataHasAddr;
  report.checks.push({
    step: 5,
    name: "Full-Stack Address Synchronization",
    status: configConsistent ? "PASS" : "FAIL",
    detail: "Frontend, backend seed data, and .env.local strictly synchronized"
  });

  // Check 6: Summary & Export
  console.log("[6/6] Finalizing verification summary...");
  const allPassed = report.checks.every(c => c.status === "PASS");
  report.summary = allPassed ? "ALL_SYSTEMS_OPERATIONAL" : "DEFECTS_FOUND";

  fs.writeFileSync("deployments/phase9_e2e_verification.json", JSON.stringify(report, null, 2));
  console.log("\n=================================================================");
  console.log(`   Verification Result: ${report.summary}`);
  console.log("   Report saved to: deployments/phase9_e2e_verification.json");
  console.log("=================================================================\n");
}

main().catch(console.error);
