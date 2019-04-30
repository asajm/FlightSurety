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

flightSuretyApp.events.FlightStatusInfo({
    fromBlock: 0
}, function (error, event) {
    if (error) console.log(error)
    console.log('### FlightStatusInfo ###')
    // console.log(event)
});

flightSuretyApp.events.OracleReport({
    fromBlock: 0
}, function (error, event) {
    if (error) console.log(error)
    console.log('### OracleReport ###')
    // console.log(event)
});

flightSuretyApp.events.OracleRequest({
    fromBlock: 0
}, function (error, event) {
    if (error) console.log(error)
    console.log('### OracleRequest ###')
    let requestDetails = {
        index: event.returnValues.index,
        airline: event.returnValues.airline,
        flight: event.returnValues.flight,
        timestamp: event.returnValues.timestamp,
        statusCode: Math.floor(Math.random() * 5) * 10
    }
    console.log(requestDetails);
});


(async () => {
    try {
        let accounts = await web3.eth.getAccounts()
        let oracles = [];
        let fee = await flightSuretyApp.methods.REGISTRATION_FEE().call({ from: accounts[0] })
        await flightSuretyData.methods.approveContractApp(config.appAddress).call({ from: accounts[0] })

        if(accounts.length < 30) throw 'there have to be 30 accounts = 20 (oracles) + 10 (airlines)'
        let oracleAccounts = accounts.slice(10, accounts.length)

        await Promise.all(oracleAccounts.map(async (account) => {
            await flightSuretyApp.methods.registerOracle().send({ from: account, value: fee, gas: 9999999 })
            let indexes = await flightSuretyApp.methods.getMyIndexes().call({ from: account })
            let oracle = {
                address: account,
                indexes: indexes
            }
            oracles.push(oracle)
            console.log(oracle.indexes)
        }))
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


