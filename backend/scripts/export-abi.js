const fs = require('fs');
const path = require('path');

// Path to the Hardhat artifacts directory
const artifactsPath = path.join(__dirname, '../artifacts/contracts/TeamCardNFT.sol/AthleteCredential.json');
const outputPath = path.join(__dirname, '../contracts/AthleteCredential.json');

if (!fs.existsSync(artifactsPath)) {
  console.error('AthleteCredential.json not found in artifacts. Please compile your contracts with Hardhat first.');
  process.exit(1);
}

const artifact = JSON.parse(fs.readFileSync(artifactsPath, 'utf8'));
const abi = artifact.abi;
const contractData = { abi };

fs.writeFileSync(outputPath, JSON.stringify(contractData, null, 2));
console.log('Exported ABI to', outputPath); 