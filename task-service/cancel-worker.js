const { Client, logger, Variables } = require('camunda-external-task-client-js')
const http = require('http');
const request = require('request');

const config = {
    baseUrl: 'http://localhost:8080/engine-rest',
    use: logger
}

const client = new Client(config)

client.subscribe('send-refund', async ({ task, taskService }) => {
    const isvalid = task.variables.get('isValid');
    const bookingid = task.variables.get('booking_id');
    console.log(`send-refund, booking_id : ${bookingid}`);
    const refund = task.variables.get('refund');
    console.log(`Your refund : ${refund}`);
    const options = {
        url: 'http://localhost:8000/bookings/' + bookingid,
        method: 'DELETE'
    };

    request(options, (err, res, body) => {
        let json = body.data;
    });
})

client.subscribe('validate-booking', async ({ task, taskService }) => {
    const bookingid = task.variables.get('booking_id');
    console.log(`validate, booking_id : ${bookingid}`);

    const options = {  
        url: 'http://localhost:8000/bookings/'+bookingid,
        method: 'GET',
        json:true
    };

    request(options, (err, res, body) => {
        const dataVar = new Variables()
        dataVar.set('isValid', res.statusCode == 200)
        console.log('Booking valid?', res.statusCode == 200)
        taskService.complete(task, dataVar);
    });

    
})

client.subscribe('calculate-refund', async ({ task, taskService }) => {
    const bookingid = task.variables.get('booking_id');
    console.log(`calculate, booking_id : ${bookingid}`);

    request('http://localhost:8000/bookings/'+bookingid, { json: true }, (err, res, body) => {
        if (err) { return console.log(err); }

        booking_data = body.data;
        console.log(booking_data)
        
        scheduleid = booking_data.scheduleid;
        numberofseats = booking_data.numberofseats;
        flightclass = booking_data.flightclass;
        
        request('http://localhost:8000/schedules/'+scheduleid, { json: true }, (err, res, body) => {
            if (err) { return console.log(err); }
            var refund = 0;
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

            const options = {  
                url: 'http://localhost:8000/schedules/'+scheduleid,
                method: 'PUT',
                json: data
            };

            request(options, (err, res, body) => {
                let json = body.data;
                console.log(json);
            });

            const sendRefund = new Variables().set("refund", refund);

            taskService.complete(task, sendRefund);
        });

    });
    
})