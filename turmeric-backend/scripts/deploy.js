const hre = require("hardhat");

async function main() {
  const [deployer] = await hre.ethers.getSigners();

  console.log("Deploying with account:", deployer.address);

  const TurmericSupplyChain = await hre.ethers.getContractFactory("TurmericSupplyChain");
  const contract = await TurmericSupplyChain.deploy(deployer.address); // admin

  // Get the deployed contract address
  const address = await contract.getAddress();

  console.log("TurmericSupplyChain deployed to:", address);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
