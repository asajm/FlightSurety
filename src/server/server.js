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

let oracles = [];

let setOracles = async () => {
    console.log('## setOracles: START')
    console.log('## setOracles: 1')
    let accounts = await web3.eth.getAccounts()
    console.log('## setOracles: 2')
    let fee = await flightSuretyApp.methods.REGISTRATION_FEE().call({ from: accounts[0] })
    console.log('## setOracles: 3')
    await flightSuretyData.methods.approveContractApp(config.appAddress).call({ from: accounts[0] })

    if (accounts.length < 30) throw 'there have to be 30 accounts = 20 (oracles) + 10 (airlines)'
    let oracleAccounts = accounts.slice(10, accounts.length)

    console.log('## setOracles: 4')
    oracleAccounts.map(async (account) => {
        try {
            await flightSuretyApp.methods.registerOracle().send({ from: account, value: fee, gas: 99999999 })
            // flightSuretyApp.methods.registerOracle().send({ from: account, value: fee, gas: 99999999 })
            //     .on('transactionHash', (hash) => {
            //         console.log('transactionHash')
            //     })
            //     .on('confirmation', (confirmationNumber, receipt) => {
            //         console.log('confirmation')
            //     })
            //     .on('receipt', (receipt) => {
            //         console.log('receipt')
            //     })
            //     .on('error', console.error)
            let indexes = await flightSuretyApp.methods.getMyIndexes().call({ from: account })
            let oracle = {
                address: account,
                indexes: indexes
            }
            oracles.push(oracle)
            console.log(oracle.indexes)
        } catch (error) {
            console.log(error)
        }
    })
    console.log('## setOracles: 5')
    console.log('## setOracles: END')
}

let setEvents = async () => {
    console.log('## setEvents: START')
    flightSuretyApp.events.FlightStatusInfo({
        fromBlock: 0
    }, function (error, event) {
        if (error) console.log(error)
        console.log('### Flight Status Info ###')
        // console.log(event)
        let res = {
            airline: event.returnValues.airline,
            flight: event.returnValues.flight,
            timestamp: event.returnValues.timestamp,
            statusCode: event.returnValues.status
        }
        console.log('-- details --')
        console.log(res)
    });

    flightSuretyApp.events.OracleReport({
        fromBlock: 0
    }, function (error, event) {
        if (error) console.log(error)
        console.log('\n### Oracle (Report) ###')
        let res = {
            airline: event.returnValues.airline,
            flight: event.returnValues.flight,
            timestamp: event.returnValues.timestamp,
            statusCode: event.returnValues.status
        }
        console.log('-- details --')
        console.log(res)
    });

    flightSuretyApp.events.OracleRequest({
        fromBlock: 0
    }, function (error, event) {
        if (error) console.log(error)
        console.log('\n### Oracle Request ###')
        let req = {
            index: event.returnValues.index,
            airline: event.returnValues.airline,
            flight: event.returnValues.flight,
            timestamp: event.returnValues.timestamp,
            statusCode: Math.floor(Math.random() * 5) * 10
        }
        console.log('-- details --')
        console.log(req)
        oracles.map(async (oracle) => {
            if (oracle.indexes.includes(req.index)) {
                console.log('\t%s : start submission', oracle.address)
                try {
                    await flightSuretyApp.methods
                        .submitOracleResponse(req.index, req.airline, req.flight, req.timestamp, req.statusCode)
                        .send({ from: oracle.address, gas: 9999999 })
                } catch (error) { }
                console.log('\t%s : end submission', oracle.address)
            }
        })
    });
    console.log('## setOracles: END')
}

(async () => {
    await setOracles()
    await setEvents()
})()


const app = express();
app.get('/api', (req, res) => {
    res.send({
        message: 'An API for use with your Dapp!'
    })
})

export default app;


