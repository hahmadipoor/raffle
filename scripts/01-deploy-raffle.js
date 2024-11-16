const { ethers } = require("hardhat");
const { getSigner, getProvider } = require("./utils");
const fs = require('fs');
const vrfCoordinatorV2Json=require("../artifacts/@chainlink/contracts/src/v0.8/mocks/VRFCoordinatorV2Mock.sol/VRFCoordinatorV2Mock.json");


const main=async ()=>{

    const FUND_AMOUNT=ethers.parseEther("1");
    let vrfCoordinatorV2Address, subscriptionId, vrfCoordinatorV2Mock; 
    const gasLane= "0x474e34a077df58807dbe9c96d3c009b23b3c6d0cce433e59bbf5b34f823bc56c"; // 30 gwei
    const keepersUpdateInterval= "30";
    const raffleEntranceFee= ethers.parseEther("0.01"); // 0.01 ETH
    const callbackGasLimit= "500000"; // 500,000 gas
    const provider=getProvider(hre.network.name);
    const deployer=await getSigner(provider);

    if(hre.network.name=="localhost"){

        vrfCoordinatorV2Address=fs.readFileSync(__dirname+'/constants/vrfCoordinatorAddress.txt', 'utf8');
        vrfCoordinatorV2Mock=new ethers.Contract(vrfCoordinatorV2Address, vrfCoordinatorV2Json.abi, deployer);
        const tx=await vrfCoordinatorV2Mock.createSubscription();// When we create a subscription on the vrfCoordinatorV2Mock contract it emits an event; the event can be seen in the transaction receipt
        const txReciept=await tx.wait(1);
        const [subId, owner]=txReciept.logs[0].args;
        subscriptionId=subId;
        await vrfCoordinatorV2Mock.fundSubscription(subId, FUND_AMOUNT);        
    }else if(hre.network.name=="sepolia"){

        vrfCoordinatorV2Address="0x9DdfaCa8183c41ad55329BdeeD9F6A8d53168B1B"
        subscriptionId="8336";
    }

    const RaffleFactory = (await ethers.getContractFactory("Raffle")).connect(deployer); 
    const raffleContract = await RaffleFactory.deploy(
        vrfCoordinatorV2Address,
        subscriptionId,
        gasLane, 
        keepersUpdateInterval,
        raffleEntranceFee, 
        callbackGasLimit
    );    
    const txDeployReceipt = await raffleContract.deploymentTransaction().wait(1);
    await vrfCoordinatorV2Mock.addConsumer(
        subscriptionId,
        txDeployReceipt.contractAddress
    )
    return txDeployReceipt;
}

main()
    .then((txDeployReceipt)=>{
        console.log("Deployed successfully, contract Address: ", txDeployReceipt.contractAddress);
        fs.writeFileSync(__dirname +'/constants/raffleContractAddress.txt', txDeployReceipt.contractAddress);
    })
    .catch((error)=>{
        console.log(error);        
    });
