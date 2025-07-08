const { ethers } = require("ethers");

function getValidPolygonAddressFromDID(did) {
  const address = did.replace('did:ethr:', '');
  if (!ethers.utils.isAddress(address)) {
    throw new Error(`Invalid Polygon address extracted from DID: ${did}`);
  }
  return address;
}

module.exports = { getValidPolygonAddressFromDID }; 