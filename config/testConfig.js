
var FlightSuretyApp = artifacts.require("FlightSuretyApp");
var FlightSuretyData = artifacts.require("FlightSuretyData");
var BigNumber = require('bignumber.js');

var Config = async function(accounts) {

    // These test addresses are useful when you need to add
    // multiple users in test scripts
    // let testAddresses = [
        // "0x17b186e5a5151d51042b37bd57fafd3570d89eaa",
        // "0xc5e15862a278611611b51e192d375cb4e44e7686",
        // "0x76b0e0970cfebf8bb73a0418743fb749d8198cbf",
        // "0xf69b00eed4254e3b20c4c9bd14a5c9ee4916cf2f",
        // "0x9684cca4eea8f031c957bb4c16fc095f642bb385",
        // "0xc2fd4a0503e4a6e4ad2301fc1969679b90b35a90",
        // "0xd424da5d978fc38fdee8c641b971e9aa1b065c46",
        // "0x4485b57c828761292f3ccc3b8e15f848a622cf5a",
        // "0x871a4ea4224b1836d3db3b160c97b4773f5fb0c7",
        // "0x0cac19c8a3cb3aa2fbd147b4dc51f08b68190c1c"
    // ];

    let testAddresses = accounts;

    let owner = accounts[0];
    let firstAirline = accounts[1];

    let flightSuretyData = await FlightSuretyData.new(firstAirline);
    let flightSuretyApp = await FlightSuretyApp.new(flightSuretyData.address);

    console.log('owner: %s', owner)
    console.log('firstAirline: %s', firstAirline)
    console.log('contractData: %s', flightSuretyData.address)
    console.log('contractApp: %s', flightSuretyApp.address)

    return {
        owner: owner,
        firstAirline: firstAirline,
        weiMultiple: (new BigNumber(10)).pow(18),
        testAddresses: testAddresses,
        flightSuretyData: flightSuretyData,
        flightSuretyApp: flightSuretyApp
    }
}

module.exports = {
    Config: Config
};