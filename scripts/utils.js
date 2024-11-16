const { ethers } = require("hardhat");
require("dotenv").config();
const hre=require("hardhat");

const getProvider=(networkName)=>{
    const rpc_url=networkName=="localhost" 
                ? "http://localhost:8545"
                :networkName=="sepolia"
                ?`https://sepolia.infura.io/v3/${process.env.INFURA_PROJECT_ID}`
                :"";
    const provider = new ethers.JsonRpcProvider(rpc_url);
    return provider;
}

const getSigner=async (provider)=>{
    networkName=hre.network.name;
    let privateKey = networkName=="localhost"?"":process.env.PRIVATE_KEY;
    let wallet = networkName=="localhost"? "":new ethers.Wallet(privateKey, provider);
    // wallet includes an object that includes the address of the account that's associated to this private key
    //local node should be running for the following line to work
    signer = networkName=="localhost"? (await ethers.getSigners())[0]: wallet;   
    return signer
}

const getAccountOtherThanDeployer=async (provider)=>{
    
    let privateKey = networkName=="localhost"?"":process.env.PRIVATE_KEY2;
    let wallet = networkName=="localhost"? "":new ethers.Wallet(privateKey, provider);
    signer = networkName=="localhost"? (await ethers.getSigners())[1]: wallet;   
    return signer
}

module.exports={
    getProvider,
    getSigner,
    getAccountOtherThanDeployer
}