const { Client, logger } = require('camunda-external-task-client-js');
const { Variables } = require('camunda-external-task-client-js');
const http = require('http');
const request = require('request');

const config = { baseUrl: 'http://localhost:8080/engine-rest', use: logger };

const client = new Client(config);



/* * * * * * * * * * * * * * * * * * * *
 *  Book Flight Service 
 * 
 * * * * * * * * * * * * * * * * * * * *
 */

client.subscribe('book-flight-card', function({ task, taskService }) {
  console.log(`

    ***********************
    [TASK SERVICE EXECUTED]
    `);
  var valid =  false;
  var price =  0;

  
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
        ticket_price = schedule_data.pricefirst;
      } else if (flightclass == "2") {
        seats_amount = schedule_data.seatsbusiness;
        ticket_price = schedule_data.pricebusiness;
      } else if (flightclass == "3") {
        seats_amount = schedule_data.seatseconomy;
        ticket_price = schedule_data.priceeconomy;
      }

      if (seats_amount > 0) {
        if (flightclass == "1") {
          schedule_data.seatsfirst -= 1;
        } else if (flightclass == "2") {
          schedule_data.seatsbusiness -= 1;
        } else if (flightclass == "3") {
          schedule_data.seatseconomy -= 1;
        }

        req_json = {
          seatsfirst: schedule_data.seatsfirst,
          seatsbusiness: schedule_data.seatsbusiness,
          seatseconomy: schedule_data.seatseconomy
        }

        const options = {  
                url: 'http://localhost:8000/schedules/'+scheduleid,
                method: 'PUT',
                json: req_json
            };

        request(options, (err, res, body) => {
          let json = body;
          console.log("json");
          console.log(json);
          if (!err) {
            var valid = true;
            var price = ticket_price; 
          } else {
          }
        });

      }
    });

  });

  const isBookingValidVar = new Variables().set("isBookingValid", true);
  const ticketPriceVar = new Variables().set("ticket_price", 1000);
  valid = isBookingValidVar.get("isBookingValid");
  price = ticketPriceVar.get("ticket_price");
  console.log(`is_booking_valid: ${valid}; ticket_price: ${price}`);
  taskService.complete(task, isBookingValidVar, ticketPriceVar);
});


/* * * * * * * * * * * * * * * * * * * *
 *  Send Payment Information Service 
 * 
 * * * * * * * * * * * * * * * * * * * *
 */

client.subscribe('send-payment-card', async ({ task, taskService }) => {
  const booking_id = task.variables.get('booking_id');
  const ticket_price = task.variables.get('ticket_price');
  
  // const options = {  
  //             url: 'http://localhost:8000/schedules/'+scheduleid,
  //             method: 'PUT',
  //             json: req_json
  //         };

  // request(options, (err, res, body) => {
  //     let json = body;
  //     console.log(json);
  //     if (!err) {
  //       valid = true;
  //     }
  // });
  
  console.log(`send-refund, booking_id : ${booking_id}, ${ticket_price}`);
  taskService.complete(task); 
})


/* * * * * * * * * * * * * * * * * * * *
 *  Validate Payment Service 
 * 
 * * * * * * * * * * * * * * * * * * * *
 */

client.subscribe('validate-payment-card', async function({ task, taskService }) {
  const is_valid = task.variables.get('isBookingValid');
  const is_payment_valid = new Variables().set("isPaymentValid", true);

  if (is_valid) {
    console.log('valid');
  } else {
    console.log('invalid');
  }

  await taskService.complete(task, is_payment_valid);
}); 