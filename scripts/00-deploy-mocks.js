const { network } = require("hardhat")
const { getProvider, getSigner } = require("./utils")
const fs = require('fs');
const BASE_FEE = "250000000000000000" // 0.25 is this the premium in LINK?
const GAS_PRICE_LINK = 1e9 // link per gas, is this the gas lane? // 0.000000001 LINK per gas

const main= async () => { 
    
    if (network.name="localhost") {
        console.log("Local network detected! Deploying mocks...")
        const provider=getProvider();
        const deployer=await getSigner(provider); 
        const VRFCordinatorFactory = (await ethers.getContractFactory("VRFCoordinatorV2Mock")).connect(deployer);
        const vrfCordinatorFactory = await VRFCordinatorFactory.deploy(
            BASE_FEE,
            GAS_PRICE_LINK
        );
        const txDeployReceipt = await vrfCordinatorFactory.deploymentTransaction().wait(1);
        return txDeployReceipt;
    }
    return "";
}

main()
.then((txDeployReceipt)=>{
    console.log("Mocks Deployed!")
    console.log("contract address: ", txDeployReceipt.contractAddress);   
    fs.writeFileSync(__dirname +'/constants/vrfCoordinatorAddress.txt', txDeployReceipt.contractAddress);
    console.log("----------------------------------------------------------");
})
.catch((error)=>{
    console.log(error);    
});