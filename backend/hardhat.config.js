require('dotenv').config();
require("@nomicfoundation/hardhat-toolbox");

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: "0.8.28",
  networks: {
    mumbai: {
      url: process.env.RPC_URL, // Should be a Mumbai testnet endpoint
      accounts: [process.env.PRIVATE_KEY]
    },
    polygon: {
      url: process.env.POLYGON_RPC_URL, // Mainnet endpoint
      accounts: [process.env.PRIVATE_KEY]
    },
    celo: {
      url: process.env.CELO_RPC_URL, // Alfajores testnet endpoint
      accounts: [process.env.PRIVATE_KEY]
    },
    celoMainnet: {
      url: process.env.CELO_MAINNET_RPC_URL, // Celo mainnet endpoint
      accounts: [process.env.PRIVATE_KEY]
    }
  }
};
