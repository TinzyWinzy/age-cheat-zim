const { ethers } = require('ethers');
const { createVerifiableCredentialJwt } = require('did-jwt-vc');
require('dotenv').config();

// --- Issuer Setup ---
// The issuer is the "sports authority" signing the credentials.
const issuerPrivateKey = process.env.ISSUER_PRIVATE_KEY;
if (!issuerPrivateKey || !issuerPrivateKey.startsWith('0x')) {
  throw new Error("ISSUER_PRIVATE_KEY is not set correctly in the .env file. It must be a 0x-prefixed hex string.");
}
const issuerWallet = new ethers.Wallet(issuerPrivateKey);

// The issuer object now contains the DID and the signer, as expected by did-jwt
const didIssuer = {
  did: `did:ethr:${issuerWallet.address}`,
  signer: issuerWallet.signMessage.bind(issuerWallet),
  alg: 'ES256K'
};

/**
 * Generates a new Ethereum wallet for an athlete.
 * The public address becomes their DID, and the private key gives them control.
 * @returns {object} An object containing the athlete's DID and their private key.
 */
const generateAthleteIdentity = () => {
  const athleteWallet = ethers.Wallet.createRandom();
  const did = `did:ethr:${athleteWallet.address}`;
  console.log(`Generated new Athlete DID: ${did}`);
  return {
    did,
    privateKey: athleteWallet.privateKey,
  };
};

/**
 * Creates a signed Verifiable Credential (VC) as a JWT.
 * @param {object} payload - The claims about the athlete.
 * @param {string} subjectDid - The DID of the credential's subject (the athlete).
 * @returns {Promise<string>} A signed JWT representing the Verifiable Credential.
 */
const createAthleteVC = async (payload, subjectDid) => {
  const vcPayload = {
    sub: subjectDid, // The subject of the VC is the athlete's DID
    nbf: Math.floor(Date.now() / 1000), // Not Before time
    vc: {
      '@context': ['https://www.w3.org/2018/credentials/v1'],
      type: ['VerifiableCredential', 'SportsCredential'],
      credentialSubject: payload,
    },
  };

  console.log('Creating Verifiable Credential with payload:', vcPayload);
  const vcJwt = await createVerifiableCredentialJwt(vcPayload, didIssuer);
  console.log('Signed VC JWT created.');
  return vcJwt;
};

module.exports = {
  generateAthleteIdentity,
  createAthleteVC,
  didIssuer, // Exporting for potential verification use later
}; 