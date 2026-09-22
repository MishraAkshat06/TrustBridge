import hardhat from "hardhat";
import fs from "fs";
import path from "path";
const { ethers, network } = hardhat;

async function main() {
  console.log("=================================================");
  console.log(`Starting TrustBridge Deployment on ${network.name}`);
  console.log("=================================================");

  const [deployer] = await ethers.getSigners();
  if (!deployer) {
    throw new Error("No deployer signer available. Set PRIVATE_KEY in environment.");
  }

  const deployerAddress = await deployer.getAddress();
  const balance = await ethers.provider.getBalance(deployerAddress);
  console.log(`Deployer Address: ${deployerAddress}`);
  console.log(`Deployer Balance: ${ethers.formatEther(balance)} ETH`);

  if (balance === 0n) {
    throw new Error("Deployer account has 0 ETH. Please fund with Sepolia testnet ETH.");
  }

  // Constructor arguments validation
  const verifierAddress = process.env.VERIFIER_ADDRESS || deployerAddress; // Can be specified or deployer in testnet
  const durationSeconds = parseInt(process.env.CAMPAIGN_DURATION || "2592000", 10); // 30 days
  const m1Title = "Architecture & Prototype Specification";
  const m2Title = "Testnet Launch & Contract Audits";
  const m3Title = "Security Verification & Zero-Leakage ML";
  const m4Title = "Production Readiness & System Handover";

  console.log("\nValidating constructor arguments...");
  if (!ethers.isAddress(verifierAddress) || verifierAddress === ethers.ZeroAddress) {
    throw new Error(`Invalid verifier address: ${verifierAddress}`);
  }
  if (!durationSeconds || durationSeconds <= 0) {
    throw new Error(`Invalid duration: ${durationSeconds}`);
  }
  if (!m1Title || !m2Title || !m3Title || !m4Title) {
    throw new Error("Milestone titles must be non-empty");
  }
  console.log("Constructor arguments valid:");
  console.log(`  Verifier: ${verifierAddress}`);
  console.log(`  Duration: ${durationSeconds} seconds (${durationSeconds / 86400} days)`);
  console.log(`  Milestones: [1: "${m1Title}", 2: "${m2Title}", 3: "${m3Title}", 4: "${m4Title}"]`);

  console.log("\nBroadcasting deployment transaction...");
  const TrustBridge = await ethers.getContractFactory("TrustBridge");
  const contract = await TrustBridge.deploy(
    verifierAddress,
    durationSeconds,
    m1Title,
    m2Title,
    m3Title,
    m4Title
  );

  console.log(`Transaction submitted. Hash: ${contract.deploymentTransaction().hash}`);
  console.log("Waiting for block confirmation...");
  await contract.waitForDeployment();

  const contractAddress = await contract.getAddress();
  const txReceipt = await contract.deploymentTransaction().wait(2);
  const blockNumber = txReceipt.blockNumber;

  console.log("\n✓ Contract successfully deployed!");
  console.log(`  Contract Address: ${contractAddress}`);
  console.log(`  Block Number:     ${blockNumber}`);
  console.log(`  Gas Used:         ${txReceipt.gasUsed.toString()}`);

  // Create deployment record
  const deploymentRecord = {
    network: network.name,
    chainId: (await ethers.provider.getNetwork()).chainId.toString(),
    address: contractAddress,
    transactionHash: contract.deploymentTransaction().hash,
    blockNumber: blockNumber,
    deployer: deployerAddress,
    constructorArguments: [
      verifierAddress,
      durationSeconds,
      m1Title,
      m2Title,
      m3Title,
      m4Title
    ],
    timestamp: new Date().toISOString()
  };

  const deploymentsDir = path.join(process.cwd(), "deployments");
  if (!fs.existsSync(deploymentsDir)) {
    fs.mkdirSync(deploymentsDir, { recursive: true });
  }

  const recordPath = path.join(deploymentsDir, `${network.name}.json`);
  fs.writeFileSync(recordPath, JSON.stringify(deploymentRecord, null, 2));
  console.log(`✓ Deployment record saved to: ${recordPath}`);

  // Update frontend/.env.local with VITE_CONTRACT_ADDRESS
  const frontendEnvPath = path.join(process.cwd(), "frontend", ".env.local");
  let frontendEnv = "";
  if (fs.existsSync(frontendEnvPath)) {
    frontendEnv = fs.readFileSync(frontendEnvPath, "utf-8");
  }
  // Replace or add VITE_CONTRACT_ADDRESS
  if (frontendEnv.includes("VITE_CONTRACT_ADDRESS=")) {
    frontendEnv = frontendEnv.replace(/VITE_CONTRACT_ADDRESS=.*\n?/, `VITE_CONTRACT_ADDRESS=${contractAddress}\n`);
  } else {
    frontendEnv += `\nVITE_CONTRACT_ADDRESS=${contractAddress}\n`;
  }
  fs.writeFileSync(frontendEnvPath, frontendEnv.trim() + "\n");
  console.log(`✓ Updated frontend/.env.local with VITE_CONTRACT_ADDRESS=${contractAddress}`);

  if (process.env.ETHERSCAN_API_KEY) {
    console.log("\nAttempting automated Etherscan source verification...");
    try {
      await hardhat.run("verify:verify", {
        address: contractAddress,
        constructorArguments: deploymentRecord.constructorArguments,
      });
      console.log("✓ Contract successfully verified on Etherscan!");
    } catch (verifyErr) {
      console.log("Etherscan verification note:", verifyErr.message);
    }
  }

  return deploymentRecord;
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("\nDeployment failed:", err);
    process.exit(1);
  });
