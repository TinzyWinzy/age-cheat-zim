const pinataSDK = require('@pinata/sdk');
const { Readable } = require('stream');
require('dotenv').config();

const pinataApiKey = process.env.PINATA_API_KEY;
const pinataApiSecret = process.env.PINATA_API_SECRET;

if (!pinataApiKey || !pinataApiSecret) {
  throw new Error('Pinata credentials are not set correctly in the backend/.env file.');
}

const pinata = new pinataSDK(pinataApiKey, pinataApiSecret);

const uploadToIPFS = async (files) => {
  console.log('Uploading files to Pinata IPFS...');

  // Convert buffer to readable stream for the SDK
  const birthCertificateStream = Readable.from(files.birthCertificate[0].buffer);
  const selfieStream = Readable.from(files.selfie[0].buffer);
  
  // Pinata options can include a name for the file
  const birthCertificateOptions = {
    pinataMetadata: { name: files.birthCertificate[0].originalname },
  };
  const selfieOptions = {
    pinataMetadata: { name: files.selfie[0].originalname },
  };

  // Upload files to Pinata
  const birthCertificateResult = await pinata.pinFileToIPFS(birthCertificateStream, birthCertificateOptions);
  const selfieResult = await pinata.pinFileToIPFS(selfieStream, selfieOptions);

  // Create and pin a metadata JSON file linking to the documents
  const metadata = {
    name: "Athlete Verifiable Credential Documents",
    description: "Contains the source documents for age verification.",
    birthCertificate: `ipfs://${birthCertificateResult.IpfsHash}`,
    selfie: `ipfs://${selfieResult.IpfsHash}`,
  };
  
  const metadataResult = await pinata.pinJSONToIPFS(metadata);

  // Return all relevant hashes
  return {
    metadataHash: metadataResult.IpfsHash,
    selfieHash: selfieResult.IpfsHash,
    birthCertificateHash: birthCertificateResult.IpfsHash
  };
};

// Upload Team Card NFT metadata JSON to IPFS
const uploadTeamCardMetadataToIPFS = async (metadata) => {
  const result = await pinata.pinJSONToIPFS(metadata);
  return result.IpfsHash;
};

module.exports = { uploadToIPFS, uploadTeamCardMetadataToIPFS }; 