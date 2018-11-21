const { Client, logger } = require('camunda-external-task-client-js');
const http = require('http');
const request = require('request');

// configuration for the Client:
//  - 'baseUrl': url to the Process Engine
//  - 'logger': utility to automatically log important events
const config = { baseUrl: 'http://localhost:8080/engine-rest', use: logger };

// create a Client instance with custom configuration
const client = new Client(config);

// subscribe to the topic: 'book-flight-card'
client.subscribe('charge-card', async function({ task, taskService }) {
  // Put your business logic here

  // Get a process variable
  const booking_id = task.variables.get('booking_id');

  console.log(`receive bookings request`);

  request('http://localhost:8000/bookings/'+booking_id, { json: true }, (err, res, body) => {
    if (err) { return console.log(err); }
    
    booking_data = body.data;
    scheduleid = booking_data.scheduleid;

    flightclass = booking_data.flightclass;

    // Check if seat is available
    request('http://localhost:8000/schedules/'+scheduleid, { json: true }, (err, res, body) => {
      if (err) { return console.log(err); }
      scheduledata = body.data;

      if (flightclass == "first") {
        seats_amount = scheduledata.seatsfirst;
      } else if (flightclass == "business") {
        seats_amount = scheduledata.seatsbusiness;
      } else if (flightclass == "economy") {
        seats_amount = scheduledata.seatseconomy;
      }

      if (seats_amount > 0) {
        if (flightclass == "first") {
          scheduledata.seatsfirst -= 1;
        } else if (flightclass == "business") {
          scheduledata.seatsbusiness -= 1;
        } else if (flightclass == "economy") {
          scheduledata.seatseconomy -= 1;
        }

        req_json = {
          "seatsfirst":scheduledata.seatsfirst,
          "seatsbusiness":scheduledata.seatsbusiness,
          "seatseconomy":scheduledata.seatseconomy
        }

        // request('http://localhost:8000/schedules/'+scheduleid+'');
        request({ url: 'http://localhost:8000/schedules/'+scheduleid, method: 'PUT', json: req_json}, callback);
      }
    });

  }); 
  
  // Complete the task
  await taskService.complete(task);
});