
var Test = require('../config/testConfig.js');
var BigNumber = require('bignumber.js');
var Web3 = require('web3');
const web3 = new Web3(new Web3.providers.HttpProvider('http://127.0.0.1:8545/'));

contract('Flight Surety Tests', async (accounts) => {

    var config;
    before('setup contract', async () => {
        config = await Test.Config(accounts);
        // await config.flightSuretyData.authorizeCaller(config.flightSuretyApp.address);
    });

    /****************************************************************************************/
    /* Operations and Settings                                                              */
    /****************************************************************************************/

    it('(passenger) may pay up to 1 ether for purchasing flight insurance.', async () => {
        let airline = accounts[3];
        let passenger = accounts[7];
        var flight = "SV123";
        config.flightSuretyApp.allEvents((error, event) => {
            console.log(event)
        })

        console.log(await config.flightSuretyData.getMyFlightInsurance.call(flight, { from: passenger }))

        try {
            await config.flightSuretyApp.fundAirline({from: config.firstAirline, value: web3.utils.toWei('2','ether')});
            await config.flightSuretyApp.registerFlight(flight, { from: config.firstAirline });
            await config.flightSuretyApp.purchaseFlightInsurance(flight, { from: passenger, value: web3.utils.toWei('1','ether')});
        }
        catch (e) {console.log(e)}

        console.log(await config.flightSuretyData.getMyFlightInsurance.call(flight, { from: passenger }))

        assert.equal(await config.flightSuretyData.getMyFlightInsurance.call(flight, { from: passenger }), web3.utils.toWei('1','ether'),
            "the passenger has to have a flight"
        );

        // await printAccountsStatus(config, accounts)
    });

    it('(passenger) may pay up to 1 ether for purchasing flight insurance.', (done) => {

        config.flightSuretyApp.allEvents((error, event) => {
            console.log('ahmed')
            console.log(error)
            console.log(event)
            done()
        })
    });
});