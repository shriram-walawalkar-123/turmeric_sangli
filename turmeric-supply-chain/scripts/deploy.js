const hre = require("hardhat");

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying contract with account:", deployer.address);

  const TurmericSupplyChain = await hre.ethers.getContractFactory("TurmericSupplyChain");
  const contract = await TurmericSupplyChain.deploy(deployer.address); // admin address

  await contract.waitForDeployment();
  console.log("Contract deployed to:", await contract.getAddress());
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
