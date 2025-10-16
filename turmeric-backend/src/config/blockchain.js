const { ethers } = require("ethers");
const path = require("path");
const fs = require("fs");

let cached = { provider: null, wallet: null, contract: null };

function getProvider() {
  if (cached.provider) return cached.provider;
  cached.provider = new ethers.JsonRpcProvider(process.env.RPC_URL || "http://127.0.0.1:8545");
  return cached.provider;
}

function getWallet() {
  if (cached.wallet) return cached.wallet;
  const pk = process.env.PRIVATE_KEY;
  if (!pk) throw new Error("PRIVATE_KEY not set in environment");
  cached.wallet = new ethers.Wallet(pk, getProvider());
  return cached.wallet;
}

function getContract() {
  if (cached.contract) return cached.contract;

  const address = process.env.CONTRACT_ADDRESS;
  if (!address) throw new Error("CONTRACT_ADDRESS not set in environment");

  const abiPath = path.resolve(__dirname, "TurmericSupplyChain.json"); // JSON is now next to this file
  if (!fs.existsSync(abiPath)) throw new Error(`Contract JSON not found at ${abiPath}`);

  const json = JSON.parse(fs.readFileSync(abiPath, "utf8"));
  cached.contract = new ethers.Contract(address, json.abi, getWallet());
  return cached.contract;
}

module.exports = { getProvider, getWallet, getContract };
