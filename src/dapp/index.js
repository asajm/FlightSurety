
import DOM from './dom';
import Contract from './contract';
import './flightsurety.css';


(async () => {

    let result = null;

    let contract = new Contract('localhost', (error, result) => {

        contract.getFlights((flights) => {
            console.log('<< registerFlightsFirstAirline >>')
            console.log('ERROR:-\n%s', error)
            console.log('RESULT:-\n%s', result)


            console.log(flights)
            flights.map((flight) => {
                displayFlights('Flights', 'flights to be purchased insurances', flight)
                let id = flight.flight

                // DOM.elid(id).addEventListener('click', () => {

                //     contract.testPayable(id, (error, result) => {
                //         console.log('ERROR:-\n%s', error)
                //         console.log('RESULT:-\n%s', result)
                //     })
                // })
                DOM.elid(id).addEventListener('click', () => {
                    contract.purchaseFlightInsurance(id, (error, result) => {
                        console.log('ERROR:-\n%s', error)
                        console.log('RESULT:-\n%s', result)
                    })
                })
            })
        })

        // Read transaction
        contract.isOperational((error, result) => {
            console.log(error, result);
            display('display-wrapper', 'Operational Status', 'Check if contract is operational', [{ label: 'Operational Status', error: error, value: result }]);
        });


        // User-submitted transaction
        DOM.elid('submit-oracle').addEventListener('click', () => {
            let flight = DOM.elid('flight-number').value;
            // Write transaction
            contract.fetchFlightStatus(flight, (error, result) => {
                display('display-wrapper', 'Oracles', 'Trigger oracles', [{ label: 'Fetch Flight Status', error: error, value: result.flight + ' ' + result.timestamp }]);
            });
        })
    });
})();


function display(elid, title, description, results) {
    let displayDiv = DOM.elid(elid);
    let section = DOM.section();
    section.appendChild(DOM.h2(title));
    section.appendChild(DOM.h5(description));
    results.map((result) => {
        let row = section.appendChild(DOM.div({ className: 'row' }));
        row.appendChild(DOM.div({ className: 'col-sm-4 field' }, result.label));
        row.appendChild(DOM.div({ className: 'col-sm-8 field-value' }, result.error ? String(result.error) : String(result.value)));
        section.appendChild(row);
    })
    displayDiv.append(section);
}

function displayFlights(title, description, result) {
    let displayDiv = DOM.elid('display-flights');
    let section = DOM.section();
    section.appendChild(DOM.h2(title));
    section.appendChild(DOM.h5(description));

    let row = section.appendChild(DOM.div({ className: 'row' }));
    let text = result.airline + ': ' + result.path + ' (' + result.flight + ')'
    row.appendChild(DOM.div({ className: 'col-sm-4 field' }, text));
    row.appendChild(DOM.button({ className: 'btn btn-primary', id: result.flight }, 'Purchase Insurance'));
    section.appendChild(row);

    displayDiv.append(section);
}







