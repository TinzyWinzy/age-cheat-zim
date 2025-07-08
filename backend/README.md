# AgeTrust Zimbabwe Backend

## Blockchain Network Standard

This backend is standardized to use **Polygon mainnet** for all blockchain operations. All DIDs and addresses must be valid Polygon addresses (hex format, no ENS). ENS and Ethereum mainnet/testnet are not supported.

### DID Format
- All DIDs must be of the form `did:ethr:0x...` where `0x...` is a valid Polygon address.

### Address Validation
- All addresses are validated using `ethers.utils.isAddress` before use.
- Any invalid address will result in a clear error and will not be used in contract calls.

### Provider Configuration
- The backend uses `process.env.RPC_URL` for the Polygon endpoint.
- Set your Polygon RPC URL (e.g., QuickNode, Alchemy, Infura for Polygon) in your environment variables.

### No ENS Support
- ENS names are not supported. Only use hex addresses.

### Deployment
- All smart contract deployments and interactions are on Polygon mainnet (or Mumbai testnet for development).

# Sample Hardhat Project

This project demonstrates a basic Hardhat use case. It comes with a sample contract, a test for that contract, and a Hardhat Ignition module that deploys that contract.

Try running some of the following tasks:

```shell
npx hardhat help
npx hardhat test
REPORT_GAS=true npx hardhat test
npx hardhat node
npx hardhat ignition deploy ./ignition/modules/Lock.js
```
