const hre = require("hardhat");

async function main() {
  // Deploy the contract
  const TeamCardNFT = await hre.ethers.getContractFactory("TeamCardNFT");
  const teamCardNFT = await TeamCardNFT.deploy();
  await teamCardNFT.deployed();
  console.log("TeamCardNFT deployed to:", teamCardNFT.address);

  // Mint a test card to the first account
  const [owner] = await hre.ethers.getSigners();
  // Replace this with your actual IPFS metadata URI
  const sampleTokenURI = "ipfs://QmSampleMetadataHash";
  const tx = await teamCardNFT.mintCard(owner.address, sampleTokenURI);
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