pragma solidity ^0.4.25;

import "../node_modules/openzeppelin-solidity/contracts/math/SafeMath.sol";

contract FlightSuretyData {
    using SafeMath for uint256;

    /********************************************************************************************/
    /*                                       DATA VARIABLES                                     */
    /********************************************************************************************/

    struct Airline {
        bool isExisted;
        bool isRegistered;
    }

    address private contractOwner;                                      // Account used to deploy contract
    bool private operational = true;                                    // Blocks all state changes throughout the contract if false
    mapping(address => Airline) private airlines;
    uint256 public countAirlines = 0;
    uint256 public countRegisteredAirlines = 0;

    /********************************************************************************************/
    /*                                       EVENT DEFINITIONS                                  */
    /********************************************************************************************/


    /**
    * @dev Constructor
    *      The deploying account becomes contractOwner
    */
    constructor(address airline) public {
        contractOwner = msg.sender;
        _addAirline(airline, true);
    }

    /********************************************************************************************/
    /*                                       FUNCTION MODIFIERS                                 */
    /********************************************************************************************/

    // Modifiers help avoid duplication of code. They are typically used to validate something
    // before a function is allowed to be executed.

    /**
    * @dev Modifier that requires the "operational" boolean variable to be "true"
    *      This is used on all state changing functions to pause the contract in
    *      the event there is an issue that needs to be fixed
    */
    modifier requireIsOperational() {
        require(operational, "Contract is currently not operational");
        _;  // All modifiers require an "_" which indicates where the function body will be added
    }

    /**
    * @dev Modifier that requires the "ContractOwner" account to be the function caller
    */
    modifier requireContractOwner() {
        require(msg.sender == contractOwner, "Caller is not contract owner");
        _;
    }

    modifier requireNotRegisteredAirline(address airline) {
        require(isRegisteredAirline(airline) == false, "the airline is already registered!");
        _;
    }

    /********************************************************************************************/
    /*                                       UTILITY FUNCTIONS                                  */
    /********************************************************************************************/

    /**
    * @dev Get operating status of contract
    *
    * @return A bool that is the current operating status
    */
    function isOperational() public view returns(bool) {
        return operational;
    }

    function isRegisteredAirline(address airline) public view returns(bool) {
        return airlines[airline].isRegistered;
    }
    function isAirline(address airline) public view returns(bool) {
        return airlines[airline].isExisted;
    }

    /**
    * @dev Sets contract operations on/off
    *
    * When operational mode is disabled, all write transactions except for this one will fail
    */
    function setOperatingStatus(bool mode) external requireContractOwner {
        operational = mode;
    }

    function setTestingMode(bool mode) external requireContractOwner requireIsOperational{
        operational = mode;
    }

    function getAirlinesCounts() public view returns(uint256) {
        return countAirlines;
    }



    /********************************************************************************************/
    /*                                     SMART CONTRACT FUNCTIONS                             */
    /********************************************************************************************/

   /**
    * @dev Add an airline to the registration queue
    *      Can only be called from FlightSuretyApp contract
    *
    */
    function registerAirline(address airline, bool isRegistered) external requireNotRegisteredAirline(airline) {
        _addAirline(airline, isRegistered);
    }

    function _addAirline(address airline, bool isRegistered) private {
        if (airlines[airline].isRegistered == false && isRegistered == true) { countRegisteredAirlines = countRegisteredAirlines.add(1); }
        if (airlines[airline].isExisted == false) { countAirlines = countAirlines.add(1); }
        airlines[airline] = Airline(true, isRegistered);
    }

    // function _dropAirline(address airline) private {
    //     if (airlines[airline].isRegistered == true) { countRegisteredAirlines = countRegisteredAirlines.sub(1); }
    //     countAirlines = countAirlines.sub(1);
    //     delete airlines[airline];
    // }


   /**
    * @dev Buy insurance for a flight
    *
    */
    function buy() external payable {

    }

    /**
     *  @dev Credits payouts to insurees
    */
    function creditInsurees() external {
    }


    /**
     *  @dev Transfers eligible payout funds to insuree
     *
    */
    function pay() external {
    }

   /**
    * @dev Initial funding for the insurance. Unless there are too many delayed flights
    *      resulting in insurance payouts, the contract should be self-sustaining
    *
    */
    function fund() public payable {
    }

    function getFlightKey(address airline, string flight, uint256 timestamp) external returns(bytes32) {
        return keccak256(abi.encodePacked(airline, flight, timestamp));
    }

    /**
    * @dev Fallback function for funding smart contract.
    *
    */
    function() external payable {
        fund();
    }
}

