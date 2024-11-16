const {assert, expect} =require("chai");
const {ethers}=require("hardhat");
const { getProvider,getAccountOtherThanDeployer, getSigner } = require("../scripts/utils");
const raffleJson=require("../artifacts/contracts/Raffle.sol/Raffle.json");
const fs = require('fs');

describe("Raffle Unit Test", function (){
    let x=5;
    let provider;
    let signer;
    let player;
    let deployer;
    let raffle;
    let raffleContract;
    let raffleEntranceFee;
    let interval="30";

    beforeEach(async()=>{
        
        provider=getProvider(hre.network.name);
        deployer=await getSigner(provider);
        player=await getAccountOtherThanDeployer(provider);
        raffleContractAddress=fs.readFileSync(require.resolve('../scripts/constants/raffleContractAddress.txt'),'utf8');
        raffle=new ethers.Contract(raffleContractAddress, raffleJson.abi, deployer);
    });

    describe("Constructor", function (){
        it("initializes the raffle correctly", async function (){
            const raffleState=await raffle.getRaffleState();
            const interval=await raffle.getInterval();
            assert.equal(raffleState.toString(),"0");
            assert.equal(interval.toString(),"30");
        });
    });

    describe("enterRaffle", function (){

        it("reverts when the user doesn't pay enough", async function (){{
            await expect(raffle.enterRaffle({value:0})).to.be.revertedWithCustomError(raffle,"Raffle__SendMoreToEnterRaffle");
        }});
        
        it("records players when they enter",async function (){
            await raffle.enterRaffle({value:ethers.parseEther("0.01")});
            const firstPlayer=await raffle.getPlayer(0);
            assert.equal(firstPlayer, deployer.address);
        });

        it("emit even on user entrance", async function (){

            await expect(raffle.enterRaffle({value:ethers.parseEther("0.01")})).to.emit(raffle, "RaffleEnter").withArgs(deployer.address);
        });

        it("doesn't allow enterance when raffle is in calculating state", async function (){
            await raffle.enterRaffle({value: ethers.parseEther("0.01")});
            await hre.network.provider.send("evm_increaseTime", [Number(interval)+1]);
            await hre.network.provider.send("evm_mine",[]);
            await raffle.performUpkeep("0x");
            await expect(raffle.enterRaffle({value:ethers.parseEther("0.01")})).to.be.revertedWithCustomError(raffle,"Raffle__RaffleNotOpen");
            await hre.network.provider.send("hardhat_reset");
        });
    });

    // describe("fulfillRandomWords", function () {
    //     it("works with live Chainlink Keepers and Chainlink VRF, we get a random winner", async function () {
    //               const startingTimeStamp = await raffle.getLastTimeStamp()
    //               const accounts = await ethers.getSigners()

    //               await new Promise(async (resolve, reject) => {
    //                   raffle.once("WinnerPicked", async () => {
    //                       console.log("WinnerPicked event fired!")
    //                       try {
    //                           // add our asserts here
    //                           const recentWinner = await raffle.getRecentWinner()
    //                           const raffleState = await raffle.getRaffleState()
    //                           const winnerEndingBalance = await accounts[0].getBalance()
    //                           const endingTimeStamp = await raffle.getLastTimeStamp()

    //                           await expect(raffle.getPlayer(0)).to.be.reverted
    //                           assert.equal(recentWinner.toString(), accounts[0].address)
    //                           assert.equal(raffleState, 0)
    //                           assert.equal(
    //                               winnerEndingBalance.toString(),
    //                               winnerStartingBalance.add(raffleEntranceFee).toString()
    //                           )
    //                           assert(endingTimeStamp > startingTimeStamp)
    //                           resolve()
    //                       } catch (error) {
    //                           console.log(error)
    //                           reject(error)
    //                       }
    //                   })
    //                   // Then entering the raffle
    //                   console.log("Entering Raffle...")
    //                   const tx = await raffle.enterRaffle({ value: raffleEntranceFee })
    //                   await tx.wait(1)
    //                   console.log("Ok, time to wait...")
    //                   const winnerStartingBalance = await accounts[0].getBalance()

    //                   // and this code WONT complete until our listener has finished listening!
    //               })  
    //     })
    // })
})
