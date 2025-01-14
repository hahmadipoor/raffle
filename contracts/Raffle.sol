// SPDX-License-Identifier: SEE LICENSE IN LICENSE
pragma solidity 0.8.7;

import "@chainlink/contracts/src/v0.8/interfaces/VRFCoordinatorV2Interface.sol";
import "@chainlink/contracts/src/v0.8/interfaces/AutomationCompatibleInterface.sol";
import "@chainlink/contracts/src/v0.8/VRFConsumerBaseV2.sol";
import "hardhat/console.sol";

/* Errors **/
error Raffle__UpkeepNoNeeded(uint256 currentBalance, uint256 numPlayers, uint256 raffleState);
error Raffle__TransferFailed();
error Raffle__SendMoreToEnterRaffle();
error Raffle__RaffleNotOpen();

/**
 * @title A sample Raffle Contract 
 * @author Hossein Ahamdipoor
 * @notice This contract is for creating a smaple Raffle
 * @dev This implements the ChainL
 */
contract Raffle is VRFConsumerBaseV2, AutomationCompatibleInterface {

    /* Type declaration */ 
    enum RaffleState{
        OPEN, 
        CALCULATING
    }
    /**  State Variables */
    //Chainlink VRF Variables
    VRFCoordinatorV2Interface private immutable i_vrfCoordinator;
    uint64 private immutable i_subscriptionId;
    bytes32 private immutable i_gasLane;
    uint32 private immutable i_callbackGasLimit;
    uint16 private constant REQUEST_CONFIRMTION=3;
    uint32 private constant NUM_WORDS=1;

    //Lottery Variables
    uint256 private immutable i_interval;
    uint256 private immutable i_enteranceFee;
    uint256 private s_lastTimeStamp;
    address payable s_recentWinner;
    address payable[] s_players;
    RaffleState private s_raffleState;

    /*Events */
    event RequestedRaffleWinner(uint256 indexed requestId);
    event RaffleEnter(address indexed player);
    event WinnerPicked(address indexed player);

    constructor(address vrfCoordinatorV2, uint64 subscriptionId, bytes32 gasLane, uint256 interval, uint256 entranceFee, uint32 callbackGasLimit ) 
        VRFConsumerBaseV2(vrfCoordinatorV2){
        i_vrfCoordinator=VRFCoordinatorV2Interface(vrfCoordinatorV2);
        i_subscriptionId=subscriptionId;
        i_gasLane=gasLane;
        ////////
        i_interval=interval;
        i_enteranceFee=entranceFee;
        s_raffleState=RaffleState.OPEN;
        s_lastTimeStamp=block.timestamp;
        i_callbackGasLimit=callbackGasLimit;
    }


    function enterRaffle()public payable{
        if(msg.value<i_enteranceFee){
            revert Raffle__SendMoreToEnterRaffle();
        }
        if(s_raffleState !=RaffleState.OPEN){
            revert Raffle__RaffleNotOpen();
        }
        s_players.push(payable(msg.sender));
        emit RaffleEnter(msg.sender);
    }

    function checkUpkeep(bytes memory /*checkData */)  public view override returns (bool upkeepNeeded, bytes memory /*performData */) {
        bool isOpen=s_raffleState==RaffleState.OPEN;
        bool timePassed=((block.timestamp-s_lastTimeStamp)>i_interval);
        bool hasPlayers=s_players.length >0;
        bool hasBalance = address(this).balance>0;
        upkeepNeeded =(timePassed && isOpen && hasBalance && hasPlayers);
        return (upkeepNeeded, "0x0");
    }

    function performUpkeep (bytes calldata /*performData*/) external override {
        (bool upkeepNeeded, )=checkUpkeep("");
        if(!upkeepNeeded){
            revert Raffle__UpkeepNoNeeded(address(this).balance, s_players.length, uint256(s_raffleState));
        }
        s_raffleState=RaffleState.CALCULATING;
        uint256 requestId=i_vrfCoordinator.requestRandomWords(i_gasLane, i_subscriptionId, REQUEST_CONFIRMTION, i_callbackGasLimit, NUM_WORDS);
        emit RequestedRaffleWinner(requestId);
    }

    function requestRandomWinner() external {
        uint256 requestId=i_vrfCoordinator.requestRandomWords(i_gasLane, i_subscriptionId, REQUEST_CONFIRMTION, i_callbackGasLimit, NUM_WORDS);
        emit RequestedRaffleWinner(requestId);
    }

    function fulfillRandomWords(uint256 requestId, uint256[] memory randomWords) internal override{
        uint256 indexOfWinner=randomWords[0] % s_players.length;
        address payable recentWinner=s_players[indexOfWinner];
        s_recentWinner=recentWinner;
        (bool success, )=recentWinner.call{value:address(this).balance}("");
        if(!success){
            revert Raffle__TransferFailed();
        }
        emit WinnerPicked(recentWinner);
    }

    function getRaffleState() public view returns (RaffleState){
        return s_raffleState;
    }

    function getNumWords() public pure returns (uint256){
            return NUM_WORDS;
    }

    function getRequestConfirmations() public pure returns (uint256){
        return REQUEST_CONFIRMTION;       
    }

    function getRecentWinner() public view returns (address){
        return s_recentWinner;
    }

    function getPlayer(uint256 index) public view returns (address){
        return s_players[index];
    }

    function getInterval() public view returns (uint256){
        return i_interval;
    }

    function getEntranceFee() public view returns (uint256){
        return i_enteranceFee;
    }

    function getNumberOfPlayers() public view returns(uint256){
        return s_players.length;
    }

}


