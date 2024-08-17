require('@nomiclabs/hardhat-waffle');
require('dotenv').config();

// npx hardhat run scripts/deploy.js --network sepolia

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: '0.8.24',
  networks: {
    sepolia: {
      url: process.env.API_URL,
      accounts: [process.env.PRIVATE_KEY],
    },
  },
};
