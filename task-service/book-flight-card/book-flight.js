const { Client, logger } = require('camunda-external-task-client-js');
const { Variables } = require('camunda-external-task-client-js');
const http = require('http');
const request = require('request');

const config = { baseUrl: 'http://localhost:8080/engine-rest', use: logger };

const client = new Client(config);
const localVariables = new Variables();

client.subscribe('book-flight-card', async function({ task, taskService }) {

  const booking_id = task.variables.get('booking_id');

  request('http://localhost:8000/bookings/'+booking_id, { json: true }, (err, res, body) => {
    if (err) { return console.log(err); }
    
    var booking_data = body.data;
    var scheduleid = booking_data.scheduleid;

    var flightclass = booking_data.flightclass;

    request('http://localhost:8000/schedules/'+scheduleid, { json: true }, (err, res, body) => {
      if (err) { return console.log(err); }
      var schedule_data = body.data;

      if (flightclass == "1") {
        seats_amount = schedule_data.seatsfirst;
      } else if (flightclass == "2") {
        seats_amount = schedule_data.seatsbusiness;
      } else if (flightclass == "3") {
        seats_amount = schedule_data.seatseconomy;
      }
      console.log('seats_amount: ' + seats_amount);

      if (seats_amount > 0) {
        if (flightclass == "1") {
          schedule_data.seatsfirst -= 1;
        } else if (flightclass == "2") {
          schedule_data.seatsbusiness -= 1;
        } else if (flightclass == "3") {
          schedule_data.seatseconomy -= 1;
        }

        req_json = {
          seatsfirst:schedule_data.seatsfirst,
          seatsbusiness:schedule_data.seatsbusiness,
          seatseconomy:schedule_data.seatseconomy
        }
        console.log(req_json);


        const options = {  
                url: 'http://localhost:8000/schedules/'+scheduleid,
                method: 'PUT',
                json: req_json
            };

        request(options, (err, res, body) => {
            let json = body;
            console.log(json);
        });

        localVariables.set("isBookingValid", true);
      }
    });

  }); 

});