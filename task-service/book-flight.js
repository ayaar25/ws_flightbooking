const { Client, logger, Variables } = require('camunda-external-task-client-js')
const http = require('http')
const request = require('request')
const cfg = require('./config').config
const config = { baseUrl: cfg.baseUrl, use: logger }
const bookingUrl = cfg.baseEntityUrl + cfg.entityUrls.bookings
const scheduleUrl = cfg.baseEntityUrl + cfg.entityUrls.schedules
const transactionUrl = cfg.baseEntityUrl + cfg.entityUrls.transactions
const msgUrl = cfg.baseUrl + '/message'
console.log(msgUrl)
const client = new Client(config)
const soap = require('soap')
const urlPayment = 'http://167.205.35.211:8080/easypay/PaymentService?wsdl'


/* * * * * * * * * * * * * * * * * * * *
 *  Book Flight Service 
 * 
 * * * * * * * * * * * * * * * * * * * *
 */

client.subscribe('book-flight-card', function({ task, taskService }) {
  const booking_id = task.variables.get('booking_id')
  const dataVar = new Variables()

  request(bookingUrl + "/" + booking_id, { json: true }, (err, res, body) => {
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
    } else {
      var booking_data = body.data
      var scheduleid = booking_data.scheduleid
      var flightclass = booking_data.flightclass.name
      var numberofseats = booking_data.numberofseats

      request(scheduleUrl + "/" + scheduleid, { json: true }, (err, res, body) => {
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
              url: scheduleUrl + "/" + scheduleid,
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

  request({  
    url: transactionUrl + "/",
    method: 'POST',
    json: {
      'bookingid': booking_id,
      'paymentstate': 'waiting_payment',
      'totalpayment': totalPayment
    }
  }, (err, res, body) => {
    if (err) { return console.log(err) }
    console.log(body.data.totalpayment)
    console.log('Payment successfully sent!')
    var args = {
      paymentMethodId: 'ovo',
      amount: totalPayment
    }
    callPaymentService(urlPayment, args, body.data.transactionid, {task, taskService})
    return
  })
  
})

callPaymentService = function (url, args, transactionId, { task, taskService }) {
  const dataVar = new Variables()
  soap.createClient(url, function (err, client) {
    client.beginPayment(args, function (err, result) {
      // console.log(result.return)
      var args2 = {
        paymentId: result.return,
        lastEventId: 0
      }
      client.getPaymentEvents(args2, function (err, result) {
        // console.log(result)
        var paymentEventId = 0
        result.return.events.forEach(event => {
          if (event.attributes.type == 'OPEN_URL') {
            console.log('Please open', event.attributes.urlToOpen)
            paymentEventId = event.attributes.paymentEventId
            console.log('Payment event id', paymentEventId)
          }
        })
        var polling = setInterval(() => {
          client.getPaymentEvents(args2, function (err, result) {
            // console.log(result)
            console.log('waiting...')
            result.return.events.forEach(event => {
              if (event.attributes.type == 'SUCCESS') {
                console.log('Success payment with event id', paymentEventId, 'from transaction id', transactionId)
                taskService.complete(task).then(() => {
                  var args3 = {
                    "messageName": "payment_proof",
                    "processInstanceId": task.processInstanceId,
                    "processVariables": {
                      "transactionId": {
                        "value": transactionId,
                        "type": "long"
                      },
                      "paymentEventId": {
                        "value": paymentEventId,
                        "type": "long"
                      }
                    }
                  }
                  request({
                    url: msgUrl,
                    method: 'POST',
                    json: args3
                  }, (err, res, body) => {
                    console.log(res.statusCode)
                    console.log(err)
                    console.log(body)
                    console.log('Success receive payment with id', transactionId)
                  })
                })
                clearInterval(polling)
                return
              } else if (event.attributes.type == 'FAILURE') {
                console.log('Payment with id', paymentEventId, 'failure because', event.attributes.reason)
                taskService.complete(task).then(() => {
                  var args3 = {
                    "messageName": "payment_proof",
                    "processInstanceId": task.processInstanceId,
                    "processVariables": {
                      "transactionId": {
                        "value": transactionId,
                        "type": "long"
                      },
                      "paymentEventId": {
                        "value": -1,
                        "type": "long"
                      }
                    }
                  }
                  request({
                    url: msgUrl,
                    method: 'POST',
                    json: args3
                  }, (err, res, body) => {
                    console.log('Fail id', transactionId)
                  })
                })
                clearInterval(polling)
                return
              }
            })
          })
        }, 2500)

      })
    })

  })
}


/* * * * * * * * * * * * * * * * * * * *
 *  Validate Payment Service 
 * 
 * * * * * * * * * * * * * * * * * * * *
 */

client.subscribe('validate-payment-card', async function({ task, taskService }) {
  const transactionid = task.variables.get('transactionId')
  const paymentEventId = task.variables.get('paymentEventId')
  const totalpayment = task.variables.get('totalPayment')
  const dataVar = new Variables()

  console.log("RERE", transactionid, paymentEventId)

  request({
    url: transactionUrl + "/" + transactionid,
    method: 'GET',
    json: true
  }, (err, res, body) => {
    if (err) { return console.log(err) }
    if(res.statusCode != 200){
      dataVar.setAll({
        "isBookingValid": false,
        "isPaymentValid": false,
        "totalPayment": 0
      })
      console.log('Booking not valid!')
      taskService.complete(task, dataVar)
      return
    } else {
      // totalpayment_expected = body.data.totalpayment

      request({
        url: transactionUrl + "/" + transactionid,
        method: 'PUT',
        json: {
          "paymentstate": paymentEventId != 1 ? 'paid' : 'paid_not_valid'
        }
      }, (err, res, body) => {
        if (err) { return console.log(err) }
        console.log(body)
      })

      dataVar.setAll({
        isPaymentValid: paymentEventId != -1
      })
      taskService.complete(task, dataVar)
      return
    }
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
  taskService.complete(task)
  return
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
  taskService.complete(task)
  return
})