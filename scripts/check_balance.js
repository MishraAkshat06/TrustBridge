import { ethers } from "ethers";

async function main() {
  const rpc = process.env.SEPOLIA_RPC_URL || "https://sepolia.infura.io/v3/afb2b386de5d4cbd9036fa43056f3e9b";
  const pk = process.env.PRIVATE_KEY;
  if (!pk) {
    throw new Error("No PRIVATE_KEY provided");
  }
  const provider = new ethers.JsonRpcProvider(rpc);
  const wallet = new ethers.Wallet(pk, provider);
  console.log("Deployer Address:", wallet.address);
  const balance = await provider.getBalance(wallet.address);
  console.log("Sepolia Balance:", ethers.formatEther(balance), "ETH");
}

main().catch(console.error);
