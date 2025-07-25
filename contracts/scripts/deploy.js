const { ethers } = require("hardhat");

async function main() {
  const [deployer] = await ethers.getSigners();

  console.log("Deploying contracts with the account:", deployer.address);
  console.log("Account balance:", (await deployer.getBalance()).toString());

  // Deploy SentimentNFT contract
  const SentimentNFT = await ethers.getContractFactory("SentimentNFT");
  const sentimentNFT = await SentimentNFT.deploy();

  await sentimentNFT.deployed();

  console.log("SentimentNFT deployed to:", sentimentNFT.address);
  
  // Set the deployer as the initial sentiment oracle
  await sentimentNFT.setSentimentOracle(deployer.address);
  console.log("Sentiment oracle set to:", deployer.address);
  
  // Set initial sentiment to neutral (500 = 0.5)
  await sentimentNFT.updateSentiment(500);
  console.log("Initial sentiment set to 500 (neutral)");

  // Save deployment info
  const deploymentInfo = {
    network: hre.network.name,
    contractAddress: sentimentNFT.address,
    deployer: deployer.address,
    blockNumber: await ethers.provider.getBlockNumber(),
    timestamp: Date.now()
  };

  console.log("\nDeployment Summary:");
  console.log("==================");
  console.log(`Network: ${deploymentInfo.network}`);
  console.log(`Contract Address: ${deploymentInfo.contractAddress}`);
  console.log(`Deployer: ${deploymentInfo.deployer}`);
  console.log(`Block Number: ${deploymentInfo.blockNumber}`);
  
  return deploymentInfo;
}

main()
  .then((deploymentInfo) => {
    console.log("\n✅ Deployment completed successfully!");
    console.log("Copy this contract address to your frontend:", deploymentInfo.contractAddress);
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  });