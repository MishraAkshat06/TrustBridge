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
    "function currentMilestoneIndex() view returns (uint8)"
  ];

  const contract = new ethers.Contract(address, abi, provider);

  console.log("Checking live contract at:", address);
  console.log("minGoal:", ethers.formatEther(await contract.minGoal()), "ETH");
  console.log("hardCap:", ethers.formatEther(await contract.hardCap()), "ETH");
  console.log("creator:", await contract.creator());
  console.log("verifier:", await contract.verifier());
  console.log("state:", await contract.state(), "(0: ACTIVE)");
  console.log("totalRaised:", ethers.formatEther(await contract.totalRaised()), "ETH");
  console.log("currentMilestoneIndex:", await contract.currentMilestoneIndex());
}

main().catch(console.error);
