/** @type import('hardhat/config').HardhatUserConfig */
require("dotenv").config();
require("@nomicfoundation/hardhat-toolbox");

module.exports = {
  solidity: "0.8.7",
  networks:{
    localhost:{
      url:"http://localhost:8545"
    },
    sepolia:{
      url:`https://sepolia.infura.io/v3/${process.env.INFURA_PROJECT_ID}`,
      accounts:[process.env.PRIVATE_KEY]
    },
  },
  etherscan:{
    apiKey:"KKYV3J3AI653CQDVTT1V7YJDFTMHX6H1PC"
  },
  sourcify: {
    enabled: true
  }
};
