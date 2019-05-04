import FlightSuretyApp from '../../build/contracts/FlightSuretyApp.json';
import FlightSuretyData from '../../build/contracts/FlightSuretyData.json';
import Config from './config.json';
import Web3 from 'web3';

export default class Contract {
    constructor(network, callback) {
        console.log('## constructor ##')

        let config = Config[network];
        this.web3 = new Web3(new Web3.providers.HttpProvider(config.url));
        this.flightSuretyData = new this.web3.eth.Contract(FlightSuretyData.abi, config.appAddress);
        this.flightSuretyApp = new this.web3.eth.Contract(FlightSuretyApp.abi, config.appAddress);
        this.owner = null;
        this.firstAirline = null;
        this.airlines = [];
        this.passengers = [];
        this.flights = [
            {
                airline: 'SAUDIA',
                path: 'JED-MED',
                flight: 'SV1458'
            },
            {
                airline: 'SAUDIA',
                path: 'JED-LHR',
                flight: 'SV115'
            },
            {
                airline: 'SAUDIA',
                path: 'JED-CDG',
                flight: 'SV127'
            }
        ]
        this.initialize(callback);
    }

    initialize(callback) {
        console.log('## initialize ##')
        console.log(this)
        let self = this
        this.web3.eth.getAccounts((error, accts) => {
            this.owner = accts[0];
            this.firstAirline = accts[1];

            let counter = 1;

            while (this.airlines.length < 5) {
                this.airlines.push(accts[counter++]);
            }

            while (this.passengers.length < 5) {
                this.passengers.push(accts[counter++]);
            }
            self.fundFirstAirline((error, result) => {
                self.registerFlightsFirstAirline(0, callback)
            })
        });
    }

    isOperational(callback) {
        console.log('## isOperational ##')
        let self = this;
        self.flightSuretyApp.methods
            .isOperational()
            .call({ from: self.owner }, callback);
    }

    fetchFlightStatus(flight, callback) {
        console.log('## fetchFlightStatus ##')
        let self = this;
        let payload = {
            airline: self.airlines[0],
            flight: flight,
            timestamp: Math.floor(Date.now() / 1000)
        }
        self.flightSuretyApp.methods
            .fetchFlightStatus(payload.airline, payload.flight, payload.timestamp)
            .send({ from: self.owner }, (error, result) => {
                callback(error, payload);
            });
    }

    fundFirstAirline(callback) {
        console.log('## fundFirstAirline ##')
        let self = this;
        self.flightSuretyApp.methods
            .fundAirline()
            .send({ from: self.firstAirline, value: web3.toWei(2, 'ether') }, (error, result) => {
                if (error) {
                    console.log('\t-- fundFirstAirline: ERROR --')
                    console.log(error)
                    callback(error, false)
                } else {
                    console.log('\t-- fundFirstAirline: DONE --')
                    callback(false, result)
                }
            });
    }

    registerFlightsFirstAirline(index, callback) {
        console.log('## registerFlightsFirstAirline ##')
        let self = this;
        if (index >= self.flights.length) callback(true, 'the index is grater than the length of flights')
        console.log(index)
        self.flightSuretyApp.methods
            .registerFlight(self.flights[index].flight)
            .send({ from: self.firstAirline }, (error, result) => {
                console.log('ERROR:-\n%s', error)
                console.log('RESULT:-\n%s', result)
                index += 1
                if (error) {
                    console.log('\t-- registerFlightsFirstAirline: registerFlight ERROR --')
                    error = '<< there is an issue happend during register flight >>\n' + error
                    callback(error, false)
                }

                if (index == self.flights.length) {
                    console.log('\t-- registerFlightsFirstAirline: registerFlight DONE --')
                    callback(false, result)
                } else {
                    console.log('\t-- registerFlightsFirstAirline: registerFlight NEXT --')
                    self.registerFlightsFirstAirline(index, callback)
                }
            })

    }


    purchaseFlightInsurance(flight, callback) {
        console.log('## purchaseFlightInsurance ##')
        let self = this
        self.flightSuretyApp.methods
            .purchaseFlightInsurance(flight)
            .send({ from: self.passengers[0], value: web3.toWei(1, 'ether'), gas: 999999 }, (error, result) => {
                callback(error, result)
            })
    }

    getFlights(callback) {
        console.log('## getFlights ##')
        callback(this.flights)
    }
}