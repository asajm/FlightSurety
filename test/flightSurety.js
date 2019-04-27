
var Test = require('../config/testConfig.js');
var BigNumber = require('bignumber.js');

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

    });

    it('(airline) Only existing airline may register a new airline until there are at least 4 airlines registered', async () => {

        console.log('airlines count %s', await config.flightSuretyData.countAirlines.call());
        console.log('registered airlines count %s', await config.flightSuretyData.countRegisteredAirlines.call());

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
    });

    it('(airline) Registration of 5th and subsequent airlines requires multi-party consensus of 50% of registered airlines', async () => {

        console.log('airlines count %s', await config.flightSuretyData.countAirlines.call());
        console.log('registered airlines count %s', await config.flightSuretyData.countRegisteredAirlines.call());
        // ARRANGE
        let airline2 = accounts[2];
        let airline3 = accounts[3];
        let airline4 = accounts[4];
        let airline5 = accounts[5];

        console.log('airlines count %s', await config.flightSuretyApp.getAirlinesCount.call());
        console.log('votes count: %s', await config.flightSuretyApp.getVotersCount.call(airline5));

        // ACT
        try {
            await config.flightSuretyApp.registerAirline(airline5, { from: airline2 });
            await config.flightSuretyApp.registerAirline(airline5, { from: airline3 });
        }
        catch (e) {
            console.log(e);
        }

        console.log('airlines count %s', await config.flightSuretyApp.getAirlinesCount.call());
        console.log('votes count: %s', await config.flightSuretyApp.getVotersCount.call(airline5));

        let result = await config.flightSuretyData.isRegisteredAirline.call(airline5);

        assert.equal(result, true, "The airline was not registered while multi-party consensus exceed 50%");
    });

    it('(airline) cannot register an Airline using registerAirline() if it is not funded', async () => {

        // ARRANGE
        let newAirline = accounts[2];

        // ACT
        try {
            await config.flightSuretyApp.registerAirline(newAirline, { from: config.firstAirline });
        }
        catch (e) {

        }
        let result = await config.flightSuretyData.isAirline.call(newAirline);

        // ASSERT
        assert.equal(result, false, "Airline should not be able to register another airline if it hasn't provided funding");

    });
});
