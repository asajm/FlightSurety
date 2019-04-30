import FlightSuretyApp from '../../build/contracts/FlightSuretyApp.json';
import FlightSuretyData from '../../build/contracts/FlightSuretyData.json';
import Config from './config.json';
import Web3 from 'web3';
import express from 'express';
import { CONNREFUSED } from 'dns';

let config = Config['localhost'];
let web3 = new Web3(new Web3.providers.WebsocketProvider(config.url.replace('http', 'ws')));
web3.eth.defaultAccount = web3.eth.accounts[0];
let flightSuretyData = new web3.eth.Contract(FlightSuretyData.abi, config.dataAddress);
let flightSuretyApp = new web3.eth.Contract(FlightSuretyApp.abi, config.appAddress, flightSuretyData.address);

// const Test = require('../config/testConfig.js');

const STATUS_CODE_UNKNOWN = 0;
const STATUS_CODE_ON_TIME = 10;
const STATUS_CODE_LATE_AIRLINE = 20;
const STATUS_CODE_LATE_WEATHER = 30;
const STATUS_CODE_LATE_TECHNICAL = 40;
const STATUS_CODE_LATE_OTHER = 50;

flightSuretyApp.events.FlightStatusInfo({
    fromBlock: 0
}, function (error, event) {
    if (error) console.log(error)
    console.log('###\tFlightStatusInfo\t###')
    // console.log(event)
});

flightSuretyApp.events.OracleReport({
    fromBlock: 0
}, function (error, event) {
    if (error) console.log(error)
    console.log('###\tOracleReport\t###')
    // console.log(event)
});

flightSuretyApp.events.OracleRequest({
    fromBlock: 0
}, function (error, event) {
    if (error) console.log(error)
    console.log('###\tOracleRequest\t###')
    // console.log(event)
});


(async () => {
    try {
        let accounts = await web3.eth.getAccounts()
        let oracles = [];
        let fee = await flightSuretyApp.methods.REGISTRATION_FEE().call({ from: accounts[0] })
        await flightSuretyData.methods.approveContractApp(config.appAddress).call({from: accounts[0]})

        accounts.forEach( async(account) => {
            await flightSuretyApp.methods.registerOracle().send({ from: account, value: fee, gas: 9999999 })
            let indexes = await flightSuretyApp.methods.getMyIndexes().call({ from: account })
            let oracle = {
                address: account,
                indexes: indexes
            }
            oracles.push(oracle)
            console.log(oracle)
        })
    } catch (error) {
        console.log(error)
    }
})()


const app = express();
app.get('/api', (req, res) => {

    res.send({
        message: 'An API for use with your Dapp!'
    })
})

export default app;


