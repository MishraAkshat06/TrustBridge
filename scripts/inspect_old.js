import hardhat from "hardhat";
const { ethers } = hardhat;

async function inspectOld() {
  const provider = new ethers.JsonRpcProvider("https://ethereum-sepolia-rpc.publicnode.com");
  const address = "0x1b44F3514812d835EB1BDB0acB33d3fA3351Ee43";
  
  // Try calling basic getters
  const TrustBridge = await ethers.getContractFactory("TrustBridge");
  const contract = TrustBridge.attach(address).connect(provider);

  try {
    const minGoal = await contract.minGoal();
    console.log("minGoal:", ethers.formatEther(minGoal));
    const hardCap = await contract.hardCap();
    console.log("hardCap:", ethers.formatEther(hardCap));
    const creator = await contract.creator();
    console.log("creator:", creator);
    const verifier = await contract.verifier();
    console.log("verifier:", verifier);
    const state = await contract.state();
    console.log("state:", state);
  } catch (err) {
    console.log("Call error:", err.message);
  }
}
inspectOld();
