const { Client, logger } = require('camunda-external-task-client-js');
const { Variables } = require('camunda-external-task-client-js');
const http = require('http');
const request = require('request');

// configuration for the Client:
//  - 'baseUrl': url to the Process Engine
//  - 'logger': utility to automatically log important events
const config = { baseUrl: 'http://localhost:8080/engine-rest', use: logger };

// create a Client instance with custom configuration
const client = new Client(config);

// subscribe to the topic: 'book-flight-card'
client.subscribe('book-flight-card', async function({ task, taskService }) {
  // Put your business logic here

  // Get a process variable
  const booking_id = task.variables.get('booking_id');

  console.log('receive bookings request');
  console.log('booking_id: ' + booking_id);

  request('http://localhost:8000/bookings/'+booking_id, { json: true }, (err, res, body) => {
    if (err) { return console.log(err); }
    
    var booking_data = body.data;
    var scheduleid = booking_data.scheduleid;

    var flightclass = booking_data.flightclass;

    console.log('scheduleid: ' + scheduleid);
    console.log('flightclass: ' + flightclass);
    // Check if seat is available
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
      console.log('seats_amount: ');

      if (seats_amount > 0) {
        if (flightclass == "first") {
          schedule_data.seatsfirst -= 1;
        } else if (flightclass == "business") {
          schedule_data.seatsbusiness -= 1;
        } else if (flightclass == "economy") {
          schedule_data.seatseconomy -= 1;
        }

        req_json = {
          "seatsfirst":schedule_data.seatsfirst,
          "seatsbusiness":schedule_data.seatsbusiness,
          "seatseconomy":schedule_data.seatseconomy
        }
        console.log(req_json);

        // request('http://localhost:8000/schedules/'+scheduleid+'');
        request.put('http://localhost:8000/schedules/'+scheduleid).form(req_json);
      }
    });

  }); 
  
  // Complete the task
  await taskService.complete(task);
});