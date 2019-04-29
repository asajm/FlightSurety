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
        bool isFunded;
        uint256 balance;
    }

    struct Passenger {
        uint256 balance;                                                // withdaow funds
        mapping(string => uint256) flights;                             // paid insurance per flight
    }

    struct Flight {
        bool isRegistered;
        uint8 statusCode;
        address airline;
        address[] passengers;
    }

    struct ContractApp {
        address requester;
        bool isRegistered;
        bool isAuthorized;
    }

    address public iTxOriginRegister;
    address public iMsgSenderRegister;
    address public iTxOriginAprover;
    address public iMsgSenderAprover;
    bool public iContractAppIsRegistered;
    bool public iContractAppIsAuthorized;


    address private contractOwner;                                      // Account used to deploy contract
    bool private operational = true;                                    // Blocks all state changes throughout the contract if false
    mapping(address => Airline) private airlines;
    mapping(address => Passenger) private passengers;
    mapping(string => Flight) private flights;
    mapping(address => ContractApp) private contractApps;

    uint256 public countAirlines = 0;
    uint256 public countRegisteredAirlines = 0;

    /********************************************************************************************/
    /*                                       EVENT DEFINITIONS                                  */
    /********************************************************************************************/
//

    /**
    * @dev Constructor
    *      The deploying account becomes contractOwner
    */
    constructor(address airline) public payable {
        contractOwner = msg.sender;
        _addAirline(airline, true);
    }
//

    /********************************************************************************************/
    /*                                       FUNCTION MODIFIERS                                 */
    /********************************************************************************************/
//
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

    modifier requireRegisteredAirline(address airline) {
        require(airlines[airline].isRegistered == true, "the airline is not registered yet!");
        _;
    }

    modifier requireAuthorizedAirline(address airline) {
        require(airlines[airline].isRegistered == true && airlines[airline].isFunded == true, "the airline is not authorized yet!");
        _;
    }

    modifier requireNotRegisteredAirline(address airline) {
        require(airlines[airline].isRegistered == false, "the airline is already registered!");
        _;
    }

    modifier requireRegisteredFlight(string flight) {
        require(flights[flight].isRegistered == true, "the flight is not registered yet!");
        _;
    }

    // Contract Account
    modifier requireCA() {
        require(msg.sender != tx.origin, "the function can be called by only contractor account");
        _;
    }

    // Externally Owned Accounts
    modifier requireEOA() {
        require(msg.sender == tx.origin, "the function can be called by only externally owned account");
        _;
    }

    modifier requireAuthorizedContractApp() {
        require(contractApps[msg.sender].isAuthorized, "the contractApp is not authorized!");
        _;
    }

    // modifier requirePassengerHasFlight(address passenger, string flight) {
    //     bool success = false;
    //     for (uint i = 0; i < passengers[passenger].flights.length; i++) {
    //         if (passengers[passenger].flights[i] == flight) {
    //             success = true;
    //             break;
    //         }
    //     }
    //     require(success, "the passenger does not has the flight!");
    //     _;
    // }
//

    /********************************************************************************************/
    /*                                       UTILITY FUNCTIONS                                  */
    /********************************************************************************************/
//
    /**
    * @dev Get operating status of contract
    *
    * @return A bool that is the current operating status
    */
    function isOperational() public view returns(bool) {
        return operational;
    }


    function isAirline(address airline) public view returns(bool) {
        return airlines[airline].isExisted;
    }

    function isRegisteredAirline(address airline) public view returns(bool) {
        return airlines[airline].isRegistered;
    }

    function isFundedAirline(address airline) public view returns(bool) {
        return airlines[airline].isFunded;
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

    function getMyFlightInsurance(string flight) public returns(uint256) {
        return passengers[tx.origin].flights[flight];
    }

    function getMyMyInsuranceBalance() public returns(uint256) {
        return passengers[tx.origin].balance;
    }
//
    /********************************************************************************************/
    /*                                     SMART CONTRACT FUNCTIONS                             */
    /********************************************************************************************/
//
   /**
    * @dev Add an airline to the registration queue
    *      Can only be called from FlightSuretyApp contract
    *
    */
    function registerAirline(address airline, bool isRegistered) external
                            requireIsOperational
                            requireAuthorizedAirline(tx.origin)
                            requireNotRegisteredAirline(airline) {
        _addAirline(airline, isRegistered);
    }

    function _addAirline(address airline, bool isRegistered) private {
        if (airlines[airline].isRegistered == false && isRegistered == true) { countRegisteredAirlines = countRegisteredAirlines.add(1); }
        if (airlines[airline].isExisted == false) { countAirlines = countAirlines.add(1); }
        airlines[airline] = Airline(true, isRegistered, false, 0);
    }

    function fundAirline(address airline, bool isFunded) public payable
                            requireRegisteredAirline(airline) {
        airlines[airline].balance = airlines[airline].balance.add(msg.value);
        airlines[airline].isFunded = isFunded;
    }
//
    function registerFlight(string flight, uint8 statusCode) external
                            requireIsOperational
                            requireAuthorizedAirline(tx.origin) {
        flights[flight] = Flight(true, statusCode, tx.origin, new address[](0));
    }

    function purchaseFlightInsurance(string flight) public payable
                            requireIsOperational
                            requireRegisteredFlight(flight) {
        passengers[tx.origin].flights[flight] = msg.value;
        flights[flight].passengers.push(tx.origin);
    }

    function registerContractApp() external
                            requireIsOperational
                            requireCA {
        contractApps[msg.sender] = ContractApp(tx.origin, true, false);
    }

    function approveContractApp(address contractApp) external
                            requireIsOperational
                            requireContractOwner
                             {
        contractApps[contractApp].isAuthorized = true;
    }
//
   /**
    * @dev Buy insurance for a flight
    *
    */
    // function buy(address passenger) external payable {
    //     passengers[passenger].balance = passengers[passenger].balance.add(msg.value);
    // }

    /**
     *  @dev Credits payouts to insurees
     *  percentage like 1%, 150% .. etc
    */
    function creditInsurees(address airline, string flight, uint256 percentage) external
                            requireIsOperational
                            requireAuthorizedContractApp
                            requireAuthorizedAirline(airline)
                            requireRegisteredFlight(flight) {
        require(percentage >= 1 && percentage <= 200, 'the (%) has to be between 1% and 200%');
        for (uint i = 0; i < flights[flight].passengers.length; i++) {
            address passenger = flights[flight].passengers[i];
            passengers[passenger].balance = passengers[passenger].flights[flight].mul(percentage).div(100);
        }
    }


    /**
     *  @dev Transfers eligible payout funds to insuree
     *
    */
    function withdrawFunds() external payable
                            requireIsOperational
                            requireAuthorizedContractApp {
        require(passengers[tx.origin].balance > 0, 'it is imposible to withdraw funs, the balance is ZERO.');
        uint256 balance = passengers[tx.origin].balance;
        passengers[tx.origin].balance = passengers[tx.origin].balance.sub(balance);
        tx.origin.transfer(balance);
    }

   /**
    * @dev Initial funding for the insurance. Unless there are too many delayed flights
    *      resulting in insurance payouts, the contract should be self-sustaining
    *
    */
    function fund() public payable {}

    function getFlightKey(address airline, bytes32 flight, uint256 timestamp) external returns(bytes32) {
        return keccak256(abi.encodePacked(airline, flight, timestamp));
    }

    /**
    * @dev Fallback function for funding smart contract.
    *
    */
    function() external payable { fund(); }
//
}

