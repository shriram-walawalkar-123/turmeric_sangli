const { ethers } = require("ethers");
const contractJson = require("../artifacts/contracts/TurmericSupplyChain.sol/TurmericSupplyChain.json");

// Connect to local Hardhat node
const provider = new ethers.JsonRpcProvider("http://127.0.0.1:8545");

// Use the first account as signer
const signer = new ethers.Wallet(
  "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80",
  provider
);

// Replace with deployed contract address
const contractAddress = "0x5FbDB2315678afecb367f032d93F642f64180aa3";

const contract = new ethers.Contract(contractAddress, contractJson.abi, signer);

async function ensureFarmerRole() {
  const FARMER_ROLE = await contract.FARMER_ROLE();

  // Check if signer already has the role
  const hasRole = await contract.hasRole(FARMER_ROLE, signer.address);
  if (!hasRole) {
    console.log("Granting FARMER_ROLE to signer...");
    const tx = await contract.grantRole(FARMER_ROLE, signer.address);
    await tx.wait();
    console.log("FARMER_ROLE granted!");
  } else {
    console.log("Signer already has FARMER_ROLE");
  }
}

// Immediately grant role when module is required
ensureFarmerRole().catch(console.error);

module.exports = contract;
