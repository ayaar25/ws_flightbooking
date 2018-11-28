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
  const booking_id = task.variables.get('booking_id')
  const dataVar = new Variables()

  request('http://localhost:8000/bookings/' + booking_id, { json: true }, (err, res, body) => {
    if (err) { return console.log(err) }
    if (res.statusCode != 200){
      console.log('Status code', res.statusCode)
      dataVar.setAll({
        "isBookingValid": false,
        "isPaymentValid": false,
        "totalPayment": 0
      })
      console.log('Booking not valid!')
      taskService.complete(task, dataVar)
      return
    } else {
      var booking_data = body.data
      var scheduleid = booking_data.scheduleid
      var flightclass = booking_data.flightclass.name
      var numberofseats = booking_data.numberofseats

      request('http://localhost:8000/schedules/' + scheduleid, { json: true }, (err, res, body) => {
        if (err) { return console.log(err) }
        if (res.statusCode != 200) {
          dataVar.setAll({
            "isBookingValid": false,
            "isPaymentValid": false,
            "totalPayment": 0
          })
          console.log('Booking not valid!')
          taskService.complete(task, dataVar)
        } else {
          var schedule_data = body.data

          if (flightclass == 'first') {
            seats_amount = schedule_data.seatsfirst
            totalPayment = schedule_data.pricefirst * numberofseats
            schedule_data.seatsfirst -= numberofseats
          } else if (flightclass == 'business') {
            seats_amount = schedule_data.seatsbusiness
            totalPayment = schedule_data.pricebusiness * numberofseats
            schedule_data.seatsbusiness -= numberofseats
          } else if (flightclass == 'economy') {
            seats_amount = schedule_data.seatseconomy
            totalPayment = schedule_data.priceeconomy * numberofseats
            schedule_data.seatseconomy -= numberofseats
          }

          if (seats_amount < numberofseats) {
            dataVar.setAll({
              "isBookingValid": false,
              "isPaymentValid": false,
              "totalPayment": 0
            })
            console.log('Booking not valid!')
            console.log("All seats taken")
            taskService.complete(task, dataVar)
          } else {
            request({
              url: 'http://localhost:8000/schedules/' + scheduleid,
              method: 'PUT',
              json: {
                "seatsfirst": schedule_data.seatsfirst,
                "seatsbusiness": schedule_data.seatsbusiness,
                "seatseconomy": schedule_data.seatseconomy
              }
            }, (err, res, body) => {
              if (err) { return console.log(err) }
              if (res.statusCode != 200) {
                dataVar.setAll({
                  "isBookingValid": false,
                  "isPaymentValid": false,
                  "totalPayment": 0
                })
                console.log('Booking not valid!')
                taskService.complete(task, dataVar)
              } else {
                dataVar.setAll({
                  "isBookingValid": true,
                  "isPaymentValid": false,
                  "totalPayment": totalPayment
                })

                console.log('Booking valid!')
                taskService.complete(task, dataVar)
              }
            })
          }
        }
      })
    }
  })
})


/* * * * * * * * * * * * * * * * * * * *
 *  Send Payment Information Service 
 * 
 * * * * * * * * * * * * * * * * * * * *
 */

client.subscribe('send-payment-card', async ({ task, taskService }) => {
  const booking_id = task.variables.get('booking_id')
  const totalPayment = task.variables.get('totalPayment')
  const dataVar = new Variables()

  request({  
    url: 'http://localhost:8000/transactions/',
    method: 'POST',
    json: {
      'bookingid': booking_id,
      'paymentstate': 'waiting_payment',
      'totalpayment': totalPayment
    }
  }, (err, res, body) => {
    if (err) { return console.log(err) }
    console.log(body.data.totalpayment)
    dataVar.setAll({
      "transactionId": body.data.transactionid
    })
    console.log('Payment successfully sent!')
    taskService.complete(task, dataVar)
  })
  
})


/* * * * * * * * * * * * * * * * * * * *
 *  Validate Payment Service 
 * 
 * * * * * * * * * * * * * * * * * * * *
 */

client.subscribe('validate-payment-card', async function({ task, taskService }) {
  const transactionid = task.variables.get('transactionId')
  const totalpayment = task.variables.get('totalPayment')

  request({
    url: 'http://localhost:8000/transactions/' + transactionid,
    method: 'GET',
    json: true
  }, (err, res, body) => {
    if (err) { return console.log(err) }
    totalpayment_expected = body.data.totalpayment

    request({
      url: 'http://localhost:8000/transactions/' + transactionid,
      method: 'PUT',
      json: {
        "paymentstate": totalpayment == totalpayment_expected ? 'paid' : 'paid_not_valid'
      }
    }, (err, res, body) => {
      if (err) { return console.log(err) }
      let json = body
      console.log(json)
    })

    const dataVar = new Variables()
    dataVar.setAll({
      isPaymentValid: true
    })
    taskService.complete(task, dataVar)
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
    console.log("Booking can\'t be created")
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