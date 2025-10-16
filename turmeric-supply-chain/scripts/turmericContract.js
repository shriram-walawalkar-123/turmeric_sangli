const { ethers } = require("ethers");
const contractJson = require("../artifacts/contracts/TurmericSupplyChain.sol/TurmericSupplyChain.json");

// Connect to local Hardhat node
const provider = new ethers.JsonRpcProvider("http://127.0.0.1:8545");

// Use the first account as signer
const signer = new ethers.Wallet("0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80", provider);


// Replace with deployed contract address
const contractAddress = "0x5FbDB2315678afecb367f032d93F642f64180aa3";

const contract = new ethers.Contract(contractAddress, contractJson.abi, signer);

module.exports = contract;
