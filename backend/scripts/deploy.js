const hre = require("hardhat");
const { ethers } = hre;

async function main() {
  // Deploy the contract
  const AthleteCredential = await ethers.getContractFactory("AthleteCredential");
  const athleteCredential = await AthleteCredential.deploy();
  console.log("AthleteCredential deployed to:", athleteCredential.target);

  // Mint a test card to the first account
  const [owner] = await ethers.getSigners();
  // Replace this with your actual IPFS metadata URI
  const sampleTokenURI = "ipfs://QmSampleMetadataHash";
  const sampleDid = "did:example:123";
  const sampleVcIpfsHash = "QmExampleHash";
  const sampleBiometricHash = ethers.encodeBytes32String("biohash");
  const tx = await athleteCredential.mintCredential(owner.address, sampleDid, sampleVcIpfsHash, sampleBiometricHash, sampleTokenURI);
  const receipt = await tx.wait();
  // Get the tokenId from the event or just use 1 for the first mint
  const tokenId = 1;
  console.log(`Minted Team Card NFT with tokenId ${tokenId} to ${owner.address}`);
  console.log(`Token URI: ${sampleTokenURI}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
}); 