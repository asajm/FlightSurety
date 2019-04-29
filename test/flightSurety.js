
var Test = require('../config/testConfig.js');
var BigNumber = require('bignumber.js');
var Web3 = require('web3');
const web3 = new Web3(new Web3.providers.HttpProvider('http://127.0.0.1:7545/'));

contract('Flight Surety Tests', async (accounts) => {

    var config;
    before('setup contract', async () => {
        config = await Test.Config(accounts);
        // await config.flightSuretyData.authorizeCaller(config.flightSuretyApp.address);
    });

    /****************************************************************************************/
    /* Operations and Settings                                                              */
    /****************************************************************************************/

    it(`(multiparty) has correct initial isOperational() value`, async function () {
        // Get operating status
        let status = await config.flightSuretyData.isOperational.call();
        assert.equal(status, true, "Incorrect initial operating status value");

        // await printAccountsStatus(config, accounts)
    });

    it(`(multiparty) can block access to setOperatingStatus() for non-Contract Owner account`, async function () {

        // Ensure that access is denied for non-Contract Owner account
        let accessDenied = false;
        try {
            await config.flightSuretyData.setOperatingStatus(false, { from: config.testAddresses[2] });
        }
        catch (e) {
            accessDenied = true;
        }
        assert.equal(accessDenied, true, "Access not restricted to Contract Owner");

        // await printAccountsStatus(config, accounts)
    });

    it(`(multiparty) can allow access to setOperatingStatus() for Contract Owner account`, async function () {

        // Ensure that access is allowed for Contract Owner account
        let accessDenied = false;
        try {
            await config.flightSuretyData.setOperatingStatus(false);
        }
        catch (e) {
            accessDenied = true;
        }
        assert.equal(accessDenied, false, "Access not restricted to Contract Owner");

        // await printAccountsStatus(config, accounts)
    });

    it(`(multiparty) can block access to functions using requireIsOperational when operating status is false`, async function () {

        await config.flightSuretyData.setOperatingStatus(false);

        let reverted = false;
        try {
            await config.flightSuretyData.setTestingMode(true);
        }
        catch (e) {
            reverted = true;
        }
        assert.equal(reverted, true, "Access not blocked for requireIsOperational");

        // Set it back for other tests to work
        await config.flightSuretyData.setOperatingStatus(true);

        // await printAccountsStatus(config, accounts)
    });

    it(`(airline) has ablity to fund the fee`, async function () {
        try {
            await config.flightSuretyApp.fundAirline({from: config.firstAirline, value: web3.utils.toWei('2','ether')});
        }
        catch (e) {}

        assert.equal(await config.flightSuretyData.isFundedAirline.call(config.firstAirline), true,
            "Register airline cound is not funded while it did"
        );
        // await printAccountsStatus(config, accounts)
    });

    it('(airline) Only existing airline may register a new airline until there are at least 4 airlines registered', async () => {

        // ARRANGE
        let airline2 = accounts[2];
        let airline3 = accounts[3];
        let airline4 = accounts[4];
        let airline5 = accounts[5];
        let airline6 = accounts[6];

        // ACT
        try {
            await config.flightSuretyApp.registerAirline(airline2, { from: config.firstAirline });
            await config.flightSuretyApp.registerAirline(airline3, { from: config.firstAirline });
            await config.flightSuretyApp.registerAirline(airline4, { from: config.firstAirline });
            await config.flightSuretyApp.registerAirline(airline5, { from: config.firstAirline });
            await config.flightSuretyApp.registerAirline(airline6, { from: airline5 });
        }
        catch (e) {}

        // ASSERT
        assert.equal(await config.flightSuretyData.isRegisteredAirline.call(airline2), true,
            "Registered airline could not register another airline while count of registered airlines <= 4"
        );
        assert.equal(await config.flightSuretyData.isRegisteredAirline.call(airline3), true,
            "Registered airline could not register another airline while count of registered airlines <= 4"
        );
        assert.equal(await config.flightSuretyData.isRegisteredAirline.call(airline4), true,
            "Registered airline could not register another airline while count of registered airlines <= 4"
        );
        assert.equal(await config.flightSuretyData.isRegisteredAirline.call(airline5), false,
            "Registered airline could register another airline while count of registered airlines > 4"
        );
        assert.equal(await config.flightSuretyData.isAirline.call(airline5), true,
            "Registered airline could not add another airline"
        );
        assert.equal(await config.flightSuretyData.isAirline.call(airline6), false,
            "Non-registered airline could add another airline"
        );
        // await printAccountsStatus(config, accounts)
    });

    it('(airline) Registration of 5th and subsequent airlines requires multi-party consensus of 50% of registered airlines', async () => {
        // ARRANGE
        let airline2 = accounts[2];
        let airline3 = accounts[3];
        let airline5 = accounts[5];

        // ACT
        try {
            await config.flightSuretyApp.fundAirline({from: airline2, value: web3.utils.toWei('2','ether')})
            await config.flightSuretyApp.fundAirline({from: airline3, value: web3.utils.toWei('2','ether')})
            await config.flightSuretyApp.registerAirline(airline5, { from: airline2 });
            await config.flightSuretyApp.registerAirline(airline5, { from: airline3 });
        }
        catch (e) {}

        assert.equal(await config.flightSuretyData.isRegisteredAirline.call(airline5), true,
            "The airline was not registered while multi-party consensus exceed 50%"
        );
        // await printAccountsStatus(config, accounts)
    });

    it('(airline) cannot register an Airline using registerAirline() if it is not funded', async () => {

        let airline2 = accounts[2];     // registered and funded airline
        let airline4 = accounts[4];     // registered but not funded airline
        let airline6 = accounts[6];     // new airline (not added nor registered)
        let airline7 = accounts[7];     // new airline (not added nor registered)

        try {
            await config.flightSuretyApp.registerAirline(airline6, { from: airline2 });
            await config.flightSuretyApp.registerAirline(airline7, { from: airline4 });
        }
        catch (e) {}

        assert.equal(await config.flightSuretyData.isAirline.call(airline6), true,
            "Airline should be able to add another airline if it has provided funding"
        );

        assert.equal(await config.flightSuretyData.isAirline.call(airline7), false,
            "Airline should not be able to add another airline if it hasn't provided funding"
        );
        // await printAccountsStatus(config, accounts)
    });

    it('(passenger) may pay up to 1 ether for purchasing flight insurance.', async () => {
        let airline = accounts[3];
        let passenger = accounts[7];
        var flight = "SV123";

        assert.equal(await config.flightSuretyData.getMyFlightInsurance.call(flight, { from: passenger }), 0,
            "the passenger has not to have a flight"
        );

        try {
            await config.flightSuretyApp.registerFlight(flight, { from: airline });
            await config.flightSuretyApp.purchaseFlightInsurance(flight, { from: passenger, value: web3.utils.toWei('1','ether')});
        }
        catch (e) {console.log(e)}

        assert.equal(await config.flightSuretyData.getMyFlightInsurance.call(flight, { from: passenger }), web3.utils.toWei('1','ether'),
            "the passenger has to have a flight"
        );

        // await printAccountsStatus(config, accounts)
    });

    it('(passenger) if flight is delayed due to airline fault, passenger receives credit of 1.5X the amount they paid.', async () => {
        let airline = accounts[3];
        let passenger = accounts[7];
        var flight = "SV123";

        assert.equal(await config.flightSuretyData.getMyMyInsuranceBalance.call({ from: passenger }), 0,
            "the passenger has no balance to be able to withdraw it"
        );

        try {
            await config.flightSuretyApp.callProcessFlightStatus(airline, flight, 20);
        }
        catch (e) {console.log(e)}
        assert.equal(await config.flightSuretyData.getMyMyInsuranceBalance.call({ from: passenger }), 1500000000000000000,
            "the passenger did not receive any fund due to delayed flight"
        );
        // await printAccountsStatus(config, accounts)
    });

    it('(passenger) can withdraw any funds owed to them as a result of receiving credit for insurance payout.', async () => {
        let passenger = accounts[7];

        assert.equal(await config.flightSuretyData.getMyMyInsuranceBalance.call({ from: passenger }) > 0, true,
            "the passenger has no balance to be able to withdraw it"
        );

        try {
            await config.flightSuretyApp.withdrawFunds({ from: passenger });
        }
        catch (e) {console.log(e)}

        assert.equal(await config.flightSuretyData.getMyMyInsuranceBalance.call({ from: passenger }), 0,
            "the passenger balance did not change after withrawing it"
        );
        // await printAccountsStatus(config, accounts)
    });
});


var printAccountsStatus = async function(config, accounts) {
    try {
        console.log('account[1]:\texsited( %s ),\tregistered( %s ),\tfunded( %s )',
            await config.flightSuretyData.isAirline.call(accounts[1]),
            await config.flightSuretyData.isRegisteredAirline.call(accounts[1]),
            await config.flightSuretyData.isFundedAirline.call(accounts[1])
        );
        console.log('account[2]:\texsited( %s ),\tregistered( %s ),\tfunded( %s )',
            await config.flightSuretyData.isAirline.call(accounts[2]),
            await config.flightSuretyData.isRegisteredAirline.call(accounts[2]),
            await config.flightSuretyData.isFundedAirline.call(accounts[2])
        );
        console.log('account[3]:\texsited( %s ),\tregistered( %s ),\tfunded( %s )',
            await config.flightSuretyData.isAirline.call(accounts[3]),
            await config.flightSuretyData.isRegisteredAirline.call(accounts[3]),
            await config.flightSuretyData.isFundedAirline.call(accounts[3])
        );
        console.log('account[4]:\texsited( %s ),\tregistered( %s ),\tfunded( %s )',
            await config.flightSuretyData.isAirline.call(accounts[4]),
            await config.flightSuretyData.isRegisteredAirline.call(accounts[4]),
            await config.flightSuretyData.isFundedAirline.call(accounts[4])
        );
        console.log('account[5]:\texsited( %s ),\tregistered( %s ),\tfunded( %s )',
            await config.flightSuretyData.isAirline.call(accounts[5]),
            await config.flightSuretyData.isRegisteredAirline.call(accounts[5]),
            await config.flightSuretyData.isFundedAirline.call(accounts[5])
        );
        console.log('account[6]:\texsited( %s ),\tregistered( %s ),\tfunded( %s )',
            await config.flightSuretyData.isAirline.call(accounts[6]),
            await config.flightSuretyData.isRegisteredAirline.call(accounts[6]),
            await config.flightSuretyData.isFundedAirline.call(accounts[6])
        );
        console.log('account[7]:\texsited( %s ),\tregistered( %s ),\tfunded( %s )',
            await config.flightSuretyData.isAirline.call(accounts[7]),
            await config.flightSuretyData.isRegisteredAirline.call(accounts[7]),
            await config.flightSuretyData.isFundedAirline.call(accounts[7])
        );
        console.log('account[8]:\texsited( %s ),\tregistered( %s ),\tfunded( %s )',
            await config.flightSuretyData.isAirline.call(accounts[8]),
            await config.flightSuretyData.isRegisteredAirline.call(accounts[8]),
            await config.flightSuretyData.isFundedAirline.call(accounts[8])
        );
        console.log('account[9]:\texsited( %s ),\tregistered( %s ),\tfunded( %s )',
            await config.flightSuretyData.isAirline.call(accounts[9]),
            await config.flightSuretyData.isRegisteredAirline.call(accounts[9]),
            await config.flightSuretyData.isFundedAirline.call(accounts[9])
        );
    }
    catch (e) {}
}
