const { Client, logger, Variables } = require('camunda-external-task-client-js')
const http = require('http')
const request = require('request')

const config = { baseUrl: 'http://localhost:8080/engine-rest', use: logger }

const client = new Client(config)



/* * * * * * * * * * * * * * * * * * * *
 *  Book Flight Service 
 * 
 * * * * * * * * * * * * * * * * * * * *
 */

client.subscribe('book-flight-card', function({ task, taskService }) {
  console.log(`

    ***********************
    [TASK SERVICE EXECUTED]
    `)

  
  const booking_id = task.variables.get('booking_id')

  request('http://localhost:8000/bookings/'+booking_id, { json: true }, (err, res, body) => {
    if (err) { return console.log(err) }
    
    var valid =  false
    var price =  0
    var booking_data = body.data
    var scheduleid = booking_data.scheduleid
    var flightclass = booking_data.flightclass
    var numberofseats = booking_data.numberofseats

    request('http://localhost:8000/schedules/'+scheduleid, { json: true }, (err, res, body) => {
      if (err) { return console.log(err) }
      
      var schedule_data = body.data
      
      if (flightclass == 1) {
        seats_amount = schedule_data.seatsfirst
        ticket_price = schedule_data.pricefirst
      } else if (flightclass == 2) {
        seats_amount = schedule_data.seatsbusiness
        ticket_price = schedule_data.pricebusiness
      } else if (flightclass == 3) {
        seats_amount = schedule_data.seatseconomy
        ticket_price = schedule_data.priceeconomy
      }

      if (seats_amount < numberofseats) {
        const isBookingValidVar = new Variables().set("isBookingValid", false)
        const isPaymentValidVar = new Variables().set("isPaymentValid", false)
        const ticketPriceVar = new Variables().set("ticket_price", 0)
        console.log("booking can be created, all seats taken")
        return
      }
      
      if (flightclass == 1) {
        schedule_data.seatsfirst -= numberofseats
      } else if (flightclass == 2) {
        schedule_data.seatsbusiness -= numberofseats
      } else if (flightclass == 3) {
        schedule_data.seatseconomy -= numberofseats
      }

      req_json = {
        "seatsfirst": schedule_data.seatsfirst,
        "seatsbusiness": schedule_data.seatsbusiness,
        "seatseconomy": schedule_data.seatseconomy
      }

      const options = {  
        url: 'http://localhost:8000/schedules/'+scheduleid,
        method: 'PUT',
        json: req_json
      }

      request(options, (err, res, body) => {
        if (err) { return console.log(err) }

        let json = body
        console.log("json")
        console.log(json)
      })

      const dataVar = new Variables()
      dataVar.setAll({
        "isBookingValid": true,
        "isPaymentValid": false,
        "ticket_price": ticket_price
      })
  
      taskService.complete(task, dataVar)          
    })

  })

})


/* * * * * * * * * * * * * * * * * * * *
 *  Send Payment Information Service 
 * 
 * * * * * * * * * * * * * * * * * * * *
 */

client.subscribe('send-payment-card', async ({ task, taskService }) => {
  const booking_id = task.variables.get('booking_id')
  const ticket_price = task.variables.get('ticket_price')
  
  req_json = {
    'bookingid': booking_id,
    'paymentstate': 'waiting_payment',
    'totalpayment': ticket_price
  }

  //Create Transaction
  const options = {  
      url: 'http://localhost:8000/transactions/',
      method: 'POST',
      json: req_json
  }

  request(options, (err, res, body) => {
    if (err) { return console.log(err) }
    console.log(body)
  })

  // console.log(`booking-id : ${booking_id}`)
  // console.log(`ticket-price : ${ticket_price}`)
  // console.log(`payment-state :`, req_json.paymentstate.name)
  taskService.complete(task) 
})


/* * * * * * * * * * * * * * * * * * * *
 *  Validate Payment Service 
 * 
 * * * * * * * * * * * * * * * * * * * *
 */

client.subscribe('validate-payment-card', async function({ task, taskService }) {
  const booking_id = task.variables.get('booking_id')
  const totalpayment = task.variables.get('totalPayment')
  const isPaymentValidVar = task.variables.get('isPaymentValidVar')

  //seharusnya menyamakan jumlah yang dibayar dengan yang harus dibayar, klo ga bayar kursinya balik lg

  req_json = {
    "paymentstate":'not_paid' //not paid
  }

  const options = {  
    url: 'http://localhost:8000/transactions/'+booking_id,
    method: 'GET',
    json: true
  }

  request(options, (err, res, body) => {
    if (err) { return console.log(err) }
    let transactions_data = body.data
    console.log(transactions_data)
    ticket_price = transactions_data.totalpayment

    if (totalpayment == ticket_price) {
      console.log("payment-state: paid")
      paymentstate = 'paid' //payment valid
    } else {
      console.log("payment-state: payment not valid")
      paymentstate = 'paid_not_valid' //payment not valid
    }

    req_json = {
      "paymentstate" : paymentstate
    }

    // update payment state
    const options = {
      url: 'http://localhost:8000/transactions/'+booking_id,
      method: 'PUT',
      json: req_json
    }

    request(options, (err, res, body) => {
      if (err) { return console.log(err) }
      let json = body
      console.log(json)
    })

    isPaymentValidVar.set("isPaymentValid", totalpayment == ticket_price)
    paymentvalid = isPaymentValidVar.get('isPaymentValid')
    console.log(`payment-valid: ${paymentvalid}`)
    taskService.complete(tas, ispaymentvalid)
  })
}) 


/* * * * * * * * * * * * * * * * * * * *
 *  Send Abort Service 
 * 
 * * * * * * * * * * * * * * * * * * * *
 */
client.subscribe('send-abort-card', async ({ task, taskService }) => {
  const bookingid = task.variables.get('booking_id')
  const isBookingValidVar = task.variables.get('isBookingValid')
  const isPaymentValidVar = task.variables.get('isPaymentValid')
  console.log(`booking_id : ${bookingid}`)
  if (!isBookingValidVar && !isPaymentValidVar) {
    console.log("Booking cant be created")
  } else {
    console.log("Payment not valid")
  }
})


/* * * * * * * * * * * * * * * * * * * *
 *  Send Booking-Transaction Service 
 * 
 * * * * * * * * * * * * * * * * * * * *
 */
client.subscribe('send-booking-transaction-card', async ({ task, taskService }) => {
  const bookingid = task.variables.get('booking_id')
  console.log(`booking-id: ${bookingid}`)
  console.log("Booking succesfully created")
})
