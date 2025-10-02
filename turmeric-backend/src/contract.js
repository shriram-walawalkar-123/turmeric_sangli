require("dotenv").config();
const { ethers } = require("ethers");
const abi = require("../TurmericSupplyChain.json");

// ethers v6 style provider
const DEFAULT_RPC_URL = "http://127.0.0.1:8545";
const normalizeRpcUrl = (value) => {
  if (!value || typeof value !== "string") return DEFAULT_RPC_URL;
  const trimmed = value.trim();
  if (/your_rpc_url_here/i.test(trimmed)) return DEFAULT_RPC_URL;
  if (!/^https?:\/\//.test(trimmed)) return DEFAULT_RPC_URL;
  return trimmed;
};

const provider = new ethers.JsonRpcProvider(normalizeRpcUrl(process.env.RPC_URL));
let signer = null;

const isValidPrivateKey = (value) => {
  if (!value || typeof value !== "string") return false;
  const trimmed = value.trim();
  // Must be 0x-prefixed 32-byte hex string
  return /^0x[0-9a-fA-F]{64}$/.test(trimmed);
};

if (isValidPrivateKey(process.env.PRIVATE_KEY)) {
  signer = new ethers.Wallet(process.env.PRIVATE_KEY.trim(), provider);
}

const normalizeAddress = (value) => {
  try {
    return ethers.getAddress(value);
  } catch (_e) {
    return ethers.ZeroAddress;
  }
};

const contract = new ethers.Contract(
  normalizeAddress(process.env.CONTRACT_ADDRESS),
  abi,
  signer ?? provider
);

module.exports = { contract, ethers, signer, provider };
