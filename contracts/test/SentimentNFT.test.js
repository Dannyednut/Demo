const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("SentimentNFT", function () {
  let SentimentNFT, sentimentNFT, owner, addr1, addr2;

  beforeEach(async function () {
    [owner, addr1, addr2] = await ethers.getSigners();
    SentimentNFT = await ethers.getContractFactory("SentimentNFT");
    sentimentNFT = await SentimentNFT.deploy();
    await sentimentNFT.deployed();
    
    // Set owner as oracle
    await sentimentNFT.setSentimentOracle(owner.address);
  });

  describe("Deployment", function () {
    it("Should set the right owner", async function () {
      expect(await sentimentNFT.owner()).to.equal(owner.address);
    });

    it("Should set initial sentiment to 500", async function () {
      expect(await sentimentNFT.currentSentiment()).to.equal(500);
    });
  });

  describe("Sentiment Management", function () {
    it("Should allow oracle to update sentiment", async function () {
      await sentimentNFT.updateSentiment(800);
      expect(await sentimentNFT.currentSentiment()).to.equal(800);
    });

    it("Should emit SentimentUpdated event", async function () {
      await expect(sentimentNFT.updateSentiment(750))
        .to.emit(sentimentNFT, "SentimentUpdated")
        .withArgs(750);
    });

    it("Should reject sentiment > 1000", async function () {
      await expect(sentimentNFT.updateSentiment(1001))
        .to.be.revertedWith("Sentiment must be <= 1000");
    });
  });

  describe("Pricing", function () {
    it("Should calculate correct price for neutral sentiment", async function () {
      await sentimentNFT.updateSentiment(500);
      const price = await sentimentNFT.getCurrentMintPrice();
      // Expected: (0.01 + 0.245) * 1.5 = 0.3825 ETH
      expect(price).to.be.closeTo(ethers.utils.parseEther("0.3825"), ethers.utils.parseEther("0.001"));
    });

    it("Should calculate higher price for bullish sentiment", async function () {
      await sentimentNFT.updateSentiment(900);
      const price = await sentimentNFT.getCurrentMintPrice();
      // Should be significantly higher than neutral
      const neutralPrice = ethers.utils.parseEther("0.3825");
      expect(price).to.be.above(neutralPrice);
    });
  });

  describe("Rarity Tiers", function () {
    it("Should return Common for low sentiment", async function () {
      expect(await sentimentNFT.getRarityTier(300)).to.equal(0); // Common
    });

    it("Should return Legendary for high sentiment", async function () {
      expect(await sentimentNFT.getRarityTier(900)).to.equal(3); // Legendary
    });
  });

  describe("NFT Minting", function () {
    it("Should mint NFT with correct payment", async function () {
      const price = await sentimentNFT.getCurrentMintPrice();
      
      await expect(sentimentNFT.connect(addr1).mintNFT(
        addr1.address,
        "ipfs://test-uri",
        '{"trait_type":"Sentiment","value":"Neutral"}',
        { value: price }
      )).to.emit(sentimentNFT, "NFTMinted");
      
      expect(await sentimentNFT.balanceOf(addr1.address)).to.equal(1);
    });

    it("Should reject insufficient payment", async function () {
      const price = await sentimentNFT.getCurrentMintPrice();
      const insufficientPayment = price.div(2);
      
      await expect(sentimentNFT.connect(addr1).mintNFT(
        addr1.address,
        "ipfs://test-uri",
        '{"trait_type":"Sentiment","value":"Neutral"}',
        { value: insufficientPayment }
      )).to.be.revertedWith("Insufficient payment");
    });

    it("Should refund excess payment", async function () {
      const price = await sentimentNFT.getCurrentMintPrice();
      const excessPayment = price.mul(2);
      
      const balanceBefore = await addr1.getBalance();
      const tx = await sentimentNFT.connect(addr1).mintNFT(
        addr1.address,
        "ipfs://test-uri",
        '{"trait_type":"Sentiment","value":"Neutral"}',
        { value: excessPayment }
      );
      const receipt = await tx.wait();
      const balanceAfter = await addr1.getBalance();
      
      const gasUsed = receipt.gasUsed.mul(receipt.effectiveGasPrice);
      const actualCost = balanceBefore.sub(balanceAfter);
      
      // Should have paid only the mint price + gas
      expect(actualCost).to.be.closeTo(price.add(gasUsed), ethers.utils.parseEther("0.001"));
    });
  });

  describe("NFT Evolution", function () {
    beforeEach(async function () {
      // Mint an NFT first
      const price = await sentimentNFT.getCurrentMintPrice();
      await sentimentNFT.connect(addr1).mintNFT(
        addr1.address,
        "ipfs://test-uri",
        '{"trait_type":"Sentiment","value":"Neutral"}',
        { value: price }
      );
    });

    it("Should update NFT sentiment when market sentiment changes", async function () {
      await sentimentNFT.updateSentiment(800);
      
      const nftData = await sentimentNFT.getNFTData(1);
      expect(nftData.currentSentiment).to.equal(800);
    });

    it("Should emit NFTEvolved event when rarity changes", async function () {
      // Change sentiment from 500 (Rare) to 900 (Legendary)
      await expect(sentimentNFT.updateSentiment(900))
        .to.emit(sentimentNFT, "NFTEvolved")
        .withArgs(1, 900, 3); // tokenId=1, sentiment=900, rarity=Legendary
    });

    it("Should track sentiment evolution correctly", async function () {
      await sentimentNFT.updateSentiment(800);
      
      const evolution = await sentimentNFT.getSentimentEvolution(1);
      expect(evolution.originalSentiment).to.equal(500);
      expect(evolution.currentSentimentValue).to.equal(800);
      expect(evolution.sentimentChange).to.equal(300);
    });
  });

  describe("Access Control", function () {
    it("Should only allow owner to set oracle", async function () {
      await expect(sentimentNFT.connect(addr1).setSentimentOracle(addr1.address))
        .to.be.revertedWith("Ownable: caller is not the owner");
    });

    it("Should only allow oracle to update sentiment", async function () {
      await expect(sentimentNFT.connect(addr1).updateSentiment(600))
        .to.be.revertedWith("Not authorized oracle");
    });

    it("Should allow owner to withdraw funds", async function () {
      // Mint an NFT to add funds to contract
      const price = await sentimentNFT.getCurrentMintPrice();
      await sentimentNFT.connect(addr1).mintNFT(
        addr1.address,
        "ipfs://test-uri",
        '{"trait_type":"Sentiment","value":"Neutral"}',
        { value: price }
      );

      const balanceBefore = await owner.getBalance();
      await sentimentNFT.withdraw();
      const balanceAfter = await owner.getBalance();
      
      expect(balanceAfter).to.be.above(balanceBefore);
    });
  });
});