pragma solidity ^0.4.25;

// It's important to avoid vulnerabilities due to numeric overflow bugs
// OpenZeppelin's SafeMath library, when used correctly, protects agains such bugs
// More info: https://www.nccgroup.trust/us/about-us/newsroom-and-events/blog/2018/november/smart-contract-insecurity-bad-arithmetic/

import "../node_modules/openzeppelin-solidity/contracts/math/SafeMath.sol";
import './FlightSuretyData.sol';

/************************************************** */
/* FlightSurety Smart Contract                      */
/************************************************** */
contract FlightSuretyApp {
    using SafeMath for uint256; // Allow SafeMath functions to be called for all uint256 types (similar to "prototype" in Javascript)

    /********************************************************************************************/
    /*                                       DATA VARIABLES                                     */
    /********************************************************************************************/

    // Flight status codees
    uint8 private constant STATUS_CODE_UNKNOWN = 0;
    uint8 private constant STATUS_CODE_ON_TIME = 10;
    uint8 private constant STATUS_CODE_LATE_AIRLINE = 20;
    uint8 private constant STATUS_CODE_LATE_WEATHER = 30;
    uint8 private constant STATUS_CODE_LATE_TECHNICAL = 40;
    uint8 private constant STATUS_CODE_LATE_OTHER = 50;

    uint8 private constant LIMIT_DIRECT_AIRLINE_REGISTRATION = 4;
    uint256 private constant FEE_AUTHORIZED_AIRLINE = 2 ether;
    uint256 private constant FEE_PASSENGER_INCURANCE = 1 ether;

    address private contractOwner;          // Account used to deploy contract

    uint256 public iBalance;
    mapping(string => uint256) iFlights;
    address public iTxOrigin;
    address public iMsgSender;

    struct Vote {
        uint256 count;
        mapping(address => bool) voters;
    }

    mapping(address => Vote) private votes;

    FlightSuretyData flightSuretyData;


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
         // Modify to call data contract's status
        require(isOperational(), "Contract is currently not operational");
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
        require(flightSuretyData.isRegisteredAirline(airline) == true, "the airline is not a registered airline");
        _;
    }

    modifier requireNotRegisteredAirline(address airline) {
        require(flightSuretyData.isRegisteredAirline(airline) == false, "The airline is already registered!");
        _;
    }

    modifier requireOneRegistrationAction(address airline) {
        require(votes[airline].voters[msg.sender] == false, "Caller was already voted for this airline!");
        _;
    }

    modifier requireFundedAirline(address airline) {
        require(flightSuretyData.isFundedAirline(airline) == true, "The airline is not funded enough yet!");
        _;
    }

     modifier requirePaidEnough() {
        require(msg.value >= FEE_AUTHORIZED_AIRLINE, "The funding is not enough!");
        _;
    }

    modifier requireMeetInsuranceFee() {
        emit valuesFlightInsuranceSubmitted(msg.value, FEE_PASSENGER_INCURANCE);
        require(msg.value <= FEE_PASSENGER_INCURANCE, "The funding exceeds the limit (up to 1 ether)!");
        _;
    }
//

    /********************************************************************************************/
    /*                                       CONSTRUCTOR                                        */
    /********************************************************************************************/
//

    event airlineRegisteringFromApp(address doer, address airline);
    event airlineFundingFromApp(address airline, uint256 amount);
    event flightRegisteringFromApp(address airline, string flight, uint8 status);
    event flightInsurancePurchaseingFromApp(address passenger, string flight);
    event valuesFlightInsuranceSubmitted(uint256 sendValue, uint256 requiredValue);

    /**
    * @dev Contract constructor
    *
    */
    constructor(address dataContract) public payable{
        contractOwner = msg.sender;
        flightSuretyData = FlightSuretyData(dataContract);
        flightSuretyData.registerContractApp();
    }
//

    /********************************************************************************************/
    /*                                       UTILITY FUNCTIONS                                  */
    /********************************************************************************************/
//
    function isOperational() public returns(bool) {
        return flightSuretyData.isOperational();  // Modify to call data contract's status
    }

    function _isApprovedAirline(address airline) private returns(bool) {
        uint256 countVoters = votes[airline].count;
        uint256 countAirlines = flightSuretyData.getAirlinesCounts();
        uint256 countNotVoters = countAirlines.sub(countVoters);

        if (countVoters > countNotVoters) { return true; }
        return false;
    }

    function getVotersCount(address airline) public returns (uint256) {
        return votes[airline].count;
    }

    function getAirlinesCount() public returns (uint256) {
        return flightSuretyData.getAirlinesCounts();
    }
//

    /********************************************************************************************/
    /*                                     SMART CONTRACT FUNCTIONS                             */
    /********************************************************************************************/
//

    function owner() external view returns(address) {
        return contractOwner;
    }

   /**
    * @dev Add an airline to the registration queue
    *
    */
    function registerAirline(address airline)
                            external
                            requireIsOperational
                            requireRegisteredAirline(msg.sender)
                            requireNotRegisteredAirline(airline)
                            requireOneRegistrationAction(airline)
                            requireFundedAirline(msg.sender)
                            returns(bool) {
        emit airlineRegisteringFromApp(tx.origin, airline);

        uint256 count = flightSuretyData.getAirlinesCounts();
        bool isRegistered = false;
        if (count < LIMIT_DIRECT_AIRLINE_REGISTRATION) { isRegistered = true; }
        else {
            Vote vote = votes[airline];
            vote.count = vote.count.add(1);
            vote.voters[msg.sender] = true;
            votes[airline] = vote;
            if (_isApprovedAirline(airline)) { isRegistered = true; }
        }
        flightSuretyData.registerAirline(airline, isRegistered);
        return isRegistered;
    }

    function fundAirline() external payable
                        requireIsOperational
                        requireRegisteredAirline(msg.sender)
                        requirePaidEnough {
        emit airlineFundingFromApp(tx.origin, msg.value);

        flightSuretyData.fundAirline.value(msg.value)(msg.sender, true);
    }
//
   /**
    * @dev Register a future flight for insuring.
    *
    */
    function registerFlight(string flight) external requireIsOperational {
        emit flightRegisteringFromApp(tx.origin, flight, STATUS_CODE_ON_TIME);

        flightSuretyData.registerFlight(flight, STATUS_CODE_ON_TIME);
    }

    function purchaseFlightInsurance(string flight) external payable
                            requireIsOperational
                            requireMeetInsuranceFee {
        emit flightInsurancePurchaseingFromApp(tx.origin, flight);
        flightSuretyData.purchaseFlightInsurance.value(msg.value)(flight);
    }

    function withdrawFunds() external payable requireIsOperational {
        flightSuretyData.withdrawFunds();
    }
//
    function callProcessFlightStatus(address airline, string flight, uint8 statusCode) public {
        processFlightStatus(airline, flight, statusCode);
    }
//
   /**
    * @dev Called after oracle has updated flight status
    *
    */
    function processFlightStatus(address airline, string memory flight, uint8 statusCode) internal {
        require(statusCode == STATUS_CODE_LATE_AIRLINE, 'the status of flight is not late by airline.');
        flightSuretyData.creditInsurees(airline, flight, 150);
    }


    // Generate a request for oracles to fetch flight information
    function fetchFlightStatus(address airline, string flight, uint256 timestamp) external {
        uint8 index = getRandomIndex(msg.sender);

        // Generate a unique key for storing the request
        bytes32 key = keccak256(abi.encodePacked(index, airline, flight, timestamp));
        oracleResponses[key] = ResponseInfo({
                                                requester: msg.sender,
                                                isOpen: true
                                            });

        emit OracleRequest(index, airline, flight, timestamp);
    }
//

// region ORACLE MANAGEMENT

    // Incremented to add pseudo-randomness at various points
    uint8 private nonce = 0;

    // Fee to be paid when registering oracle
    uint256 public constant REGISTRATION_FEE = 1 ether;

    // Number of oracles that must respond for valid status
    uint256 private constant MIN_RESPONSES = 3;


    struct Oracle {
        bool isRegistered;
        uint8[3] indexes;
    }

    // Track all registered oracles
    mapping(address => Oracle) private oracles;

    // Model for responses from oracles
    struct ResponseInfo {
        address requester;                              // Account that requested status
        bool isOpen;                                    // If open, oracle responses are accepted
        mapping(uint8 => address[]) responses;          // Mapping key is the status code reported
                                                        // This lets us group responses and identify
                                                        // the response that majority of the oracles
    }

    // Track all oracle responses
    // Key = hash(index, flight, timestamp)
    mapping(bytes32 => ResponseInfo) private oracleResponses;

    // Event fired each time an oracle submits a response
    event FlightStatusInfo(address airline, string flight, uint256 timestamp, uint8 status);

    event OracleReport(address airline, string flight, uint256 timestamp, uint8 status);

    // Event fired when flight status request is submitted
    // Oracles track this and if they have a matching index
    // they fetch data and submit a response
    event OracleRequest(uint8 index, address airline, string flight, uint256 timestamp);


    // Register an oracle with the contract
    function registerOracle() external payable {
        // Require registration fee
        require(msg.value >= REGISTRATION_FEE, "Registration fee is required");

        uint8[3] memory indexes = generateIndexes(msg.sender);

        oracles[msg.sender] = Oracle({
                                        isRegistered: true,
                                        indexes: indexes
                                    });
    }

    function getMyIndexes() view external returns(uint8[3]) {
        require(oracles[msg.sender].isRegistered, "Not registered as an oracle");

        return oracles[msg.sender].indexes;
    }




    // Called by oracle when a response is available to an outstanding request
    // For the response to be accepted, there must be a pending request that is open
    // and matches one of the three Indexes randomly assigned to the oracle at the
    // time of registration (i.e. uninvited oracles are not welcome)
    function submitOracleResponse( uint8 index, address airline, string flight, uint256 timestamp, uint8 statusCode) external {
        require((oracles[msg.sender].indexes[0] == index) || (oracles[msg.sender].indexes[1] == index) || (oracles[msg.sender].indexes[2] == index), "Index does not match oracle request");


        bytes32 key = keccak256(abi.encodePacked(index, airline, flight, timestamp));
        require(oracleResponses[key].isOpen, "Flight or timestamp do not match oracle request");

        oracleResponses[key].responses[statusCode].push(msg.sender);

        // Information isn't considered verified until at least MIN_RESPONSES
        // oracles respond with the *** same *** information
        emit OracleReport(airline, flight, timestamp, statusCode);
        if (oracleResponses[key].responses[statusCode].length >= MIN_RESPONSES) {

            emit FlightStatusInfo(airline, flight, timestamp, statusCode);

            // Handle flight status as appropriate
            // processFlightStatus(airline, flight, timestamp, statusCode);
            processFlightStatus(airline, flight, statusCode);
        }
    }


    function getFlightKey( address airline, string flight, uint256 timestamp) internal
                        returns(bytes32) {
        return keccak256(abi.encodePacked(airline, flight, timestamp));
    }

    // Returns array of three non-duplicating integers from 0-9
    function generateIndexes( address account) internal returns(uint8[3]) {
        uint8[3] memory indexes;
        indexes[0] = getRandomIndex(account);

        indexes[1] = indexes[0];
        while(indexes[1] == indexes[0]) {
            indexes[1] = getRandomIndex(account);
        }

        indexes[2] = indexes[1];
        while((indexes[2] == indexes[0]) || (indexes[2] == indexes[1])) {
            indexes[2] = getRandomIndex(account);
        }

        return indexes;
    }

    // Returns array of three non-duplicating integers from 0-9
    function getRandomIndex( address account) internal returns (uint8) {
        uint8 maxValue = 10;

        // Pseudo random number...the incrementing nonce adds variation
        uint8 random = uint8(uint256(keccak256(abi.encodePacked(blockhash(block.number - nonce++), account))) % maxValue);

        if (nonce > 250) {
            nonce = 0;  // Can only fetch blockhashes for last 256 blocks so we adapt
        }

        return random;
    }

// endregion

}


// contract FlightSuretyData {
//     function isOperational() public view returns(bool);
//     function registerAirline(address airline, bool isRegistered) external;
//     function getFlightKey(address airline, string flight, uint256 timestamp) external;
//     function getAirlinesCounts() public view returns(uint256);
//     function isRegisteredAirline(address airline) public view returns(bool);
//     function isExistedAirline(address airline) public view returns(bool);
//     function fundAirline(address airline, bool isFunded) public payable returns(uint256);
//     function isFundedAirline(address airline) public view returns(bool);
// }