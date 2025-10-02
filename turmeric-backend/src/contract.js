require("dotenv").config();
const { ethers } = require("ethers");
const abi = require("../abi/TurmericSupplyChain.json"); // ABI from Hardhat or Remix

const provider = new ethers.providers.JsonRpcProvider(process.env.RPC_URL);
let signer = null;

if (process.env.PRIVATE_KEY) {
  signer = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
}

const contract = signer
  ? new ethers.Contract(process.env.CONTRACT_ADDRESS, abi, signer)
  : new ethers.Contract(process.env.CONTRACT_ADDRESS, abi, provider);

module.exports = { contract, ethers, signer };
