const { expect } = require("chai");
const { ethers } = require("hardhat");
require("dotenv").config();

// ====== USER: Set your deployed contract address here ======
const CONTRACT_ADDRESS = process.env.ATHLETE_CREDENTIAL_ADDRESS || ""; // e.g. "0x..."
// ==========================================================

// ====== USER: Set your testnet private key in .env ========
// CELO_TESTNET_PRIVATE_KEY=0x...
// ==========================================================

let contract, owner, other;

describe("AthleteCredential (Celo Testnet Integration)", function () {
  this.timeout(60000); // Celo testnet can be slow

  before(async () => {
    if (!process.env.CELO_TESTNET_PRIVATE_KEY) {
      throw new Error("Set CELO_TESTNET_PRIVATE_KEY in your .env file");
    }
    if (!CONTRACT_ADDRESS) {
      throw new Error("Set ATHLETE_CREDENTIAL_ADDRESS in your .env or in this file");
    }
    // Connect to Celo testnet
    const provider = new ethers.JsonRpcProvider("https://alfajores-forno.celo-testnet.org");
    owner = new ethers.Wallet(process.env.CELO_TESTNET_PRIVATE_KEY, provider);
    // Use a random wallet for 'other' (for negative tests)
    other = ethers.Wallet.createRandom().connect(provider);
    // Get contract ABI
    const abi = require("../contracts/AthleteCredential.json").abi;
    contract = new ethers.Contract(CONTRACT_ADDRESS, abi, owner);
  });

  let mintedTokenId;

  it("should mint a credential", async function () {
    const did = "did:example:test1";
    const vcIpfsHash = "QmTestHash1";
    const biometricHash = ethers.encodeBytes32String("biohash1");
    const tokenURI = "ipfs://QmTestMeta1";
    const tx = await contract.mintCredential(owner.address, did, vcIpfsHash, biometricHash, tokenURI);
    const receipt = await tx.wait();
    // Find the CredentialMinted event
    const event = receipt.logs.map(log => contract.interface.parseLog(log)).find(e => e.name === "CredentialMinted");
    expect(event).to.exist;
    mintedTokenId = event.args.tokenId;
    expect(mintedTokenId).to.exist;
  });

  it("should return correct credential data", async function () {
    const cred = await contract.getCredential(mintedTokenId);
    expect(cred.did).to.equal("did:example:test1");
    expect(cred.vcIpfsHash).to.equal("QmTestHash1");
    expect(ethers.decodeBytes32String(cred.biometricHash)).to.equal("biohash1");
    // Status should be 0 (Active) by default
    expect(cred.status).to.equal(0);
  });

  it("should revoke a credential", async function () {
    const reason = "Test revocation";
    const tx = await contract.revokeCredential(mintedTokenId, reason);
    const receipt = await tx.wait();
    // Find the CredentialRevoked event
    const event = receipt.logs.map(log => contract.interface.parseLog(log)).find(e => e.name === "CredentialRevoked");
    expect(event).to.exist;
    expect(event.args.tokenId).to.equal(mintedTokenId);
    expect(event.args.reason).to.equal(reason);
    // Check status
    const cred = await contract.getCredential(mintedTokenId);
    expect(cred.status).to.not.equal(0); // Should not be Active
    expect(cred.revokeReason).to.equal(reason);
  });

  it("should not allow double revocation", async function () {
    await expect(contract.revokeCredential(mintedTokenId, "Again")).to.be.reverted;
  });

  it("should allow status change", async function () {
    // Mint a new credential for this test
    const did = "did:example:test2";
    const vcIpfsHash = "QmTestHash2";
    const biometricHash = ethers.encodeBytes32String("biohash2");
    const tokenURI = "ipfs://QmTestMeta2";
    const tx = await contract.mintCredential(owner.address, did, vcIpfsHash, biometricHash, tokenURI);
    const receipt = await tx.wait();
    const event = receipt.logs.map(log => contract.interface.parseLog(log)).find(e => e.name === "CredentialMinted");
    const tokenId = event.args.tokenId;
    // Change status
    const statusFlagged = 2; // Example: 2 = Flagged
    const reason = "Flagged for review";
    const tx2 = await contract.setStatus(tokenId, statusFlagged, reason);
    await tx2.wait();
    const cred = await contract.getCredential(tokenId);
    expect(cred.status).to.equal(statusFlagged);
    expect(cred.revokeReason).to.equal(reason);
  });

  it("should return correct owner and tokenURI", async function () {
    // Use the last minted token
    const total = await contract.totalSupply();
    const tokenId = total;
    const ownerAddr = await contract.ownerOf(tokenId);
    expect(ownerAddr).to.equal(owner.address);
    const uri = await contract.tokenURI(tokenId);
    expect(uri).to.be.a("string").and.to.include("ipfs://");
  });

  it("should revert on unauthorized status change", async function () {
    // Try to change status as 'other' wallet
    const did = "did:example:test3";
    const vcIpfsHash = "QmTestHash3";
    const biometricHash = ethers.encodeBytes32String("biohash3");
    const tokenURI = "ipfs://QmTestMeta3";
    const tx = await contract.mintCredential(owner.address, did, vcIpfsHash, biometricHash, tokenURI);
    const receipt = await tx.wait();
    const event = receipt.logs.map(log => contract.interface.parseLog(log)).find(e => e.name === "CredentialMinted");
    const tokenId = event.args.tokenId;
    const contractOther = contract.connect(other);
    await expect(contractOther.setStatus(tokenId, 2, "Malicious")).to.be.reverted;
  });

  it("should revert on querying non-existent token", async function () {
    const fakeId = 999999;
    await expect(contract.getCredential(fakeId)).to.be.reverted;
  });
}); 