const { Client, logger } = require('camunda-external-task-client-js')
const http = require('http');
const request = require('request');

const config = {
    baseUrl: 'http://localhost:8080/engine-rest',
    use: logger
}

const client = new Client(config)

client.subscribe('reject-cancelation', async ({ task, taskService }) => {
    const bookingId = task.variables.get('booking_id')
    console.log(`reject, booking_id : ${bookingId}`)
    // return {
    //     variables: {
    //         isValid: true
    //     }
    // }
})

client.subscribe('calculate-refund', async ({ task, taskService }) => {
    const bookingId = task.variables.get('booking_id')
    console.log(`calculate, booking_id : ${bookingId}`)

    request('http://localhost:8000/bookings/'+bookingId, { json: true }, (err, res, body) => {
        if (err) { return console.log(err); }

        booking_data = body.data;
        scheduleid = booking_data.scheduleid;
        numberofseats = booking_data.numberofseats;
        flightclass = booking_data.flightclass;

        console.log(`scheduleid:, ${scheduleid}`);
        request('http://localhost:8000/schedules/'+scheduleid, { json: true }, (err, res, body) => {
            if (err) { return console.log(err); }

            schedule_data = body.data;
            if (flightclass == 1) {
                refund = schedule_data.pricefirst * numberofseats;
                data = {
                    "seatsfirst": schedule_data.seatsfirst + numberofseats
                }
            } else if (flightclass == 2) {
                refund = schedule_data.pricebusiness * numberofseats;
                data = {
                    "seatsbusiness": schedule_data.seatsbusiness + numberofseats
                }
            } else {
                refund = schedule_data.priceeconomy * numberofseats;
                data = {
                    "seatseconomy": schedule_data.seatseconomy + numberofseats
                }
            }

            console.log(refund);
            console.log(data);

            const options = {  
                url: 'http://localhost:8000/schedules/'+scheduleid,
                method: 'PUT',
                json: data
            };

            request(options, (err, res, body) => {
                let json = body;
                console.log(json);
            });
            return data;
        });

        const options = {  
            url: 'http://localhost:8000/bookings/'+bookingId,
            method: 'DELETE',
        };

        request(options, (err, res, body) => {
            let json = body;
            console.log(json);
        });


    }); 
})