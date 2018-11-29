const { Client, logger, Variables } = require('camunda-external-task-client-js')
const request = require('request')
const cfg = require('./config').config
const config = { baseUrl: cfg.baseUrl, use: logger }
const bookingUrl = cfg.baseEntityUrl + cfg.entityUrls.bookings
const scheduleUrl = cfg.baseEntityUrl + cfg.entityUrls.schedules

const client = new Client(config)

client.subscribe('send-refund', async ({ task, taskService }) => {
    const isvalid = task.variables.get('isValid')
    const bookingid = task.variables.get('booking_id')
    console.log(`send-refund, booking_id : ${bookingid}`)
    const refund = task.variables.get('refund')
    console.log(`Your refund : ${refund}`)

    request({
        url: bookingUrl + "/" + bookingid,
        method: 'DELETE'
    }, (err, res, body) => {
        let json = body.data
    })
})

client.subscribe('validate-booking', async ({ task, taskService }) => {
    const bookingid = task.variables.get('booking_id')
    console.log(`validate, booking_id : ${bookingid}`)
    const dataVar = new Variables()

    request({
        url: bookingUrl + "/" + bookingid,
        method: 'GET',
        json: true
    }, (err, res, body) => {
        dataVar.set('isValid', res.statusCode == 200)
        console.log('Booking valid?', res.statusCode == 200)
        taskService.complete(task, dataVar)
    })

    
})

client.subscribe('calculate-refund', async ({ task, taskService }) => {
    const bookingid = task.variables.get('booking_id')
    console.log(`calculate, booking_id : ${bookingid}`)
    const dataVar = new Variables()

    request(bookingUrl + "/" + bookingid, { json: true }, (err, res, body) => {
        if (err) { return console.log(err) }

        booking_data = body.data
        console.log(booking_data)
        
        scheduleid = booking_data.scheduleid
        numberofseats = booking_data.numberofseats
        flightclass = booking_data.flightclass.name
        
        request(scheduleUrl + "/" + scheduleid, { json: true }, (err, res, body) => {
            if (err) { return console.log(err) }
            var refund = 0
            schedule_data = body.data
            if (flightclass == 'first') {
                refund = schedule_data.pricefirst * numberofseats
                data = {
                    "seatsfirst": schedule_data.seatsfirst + numberofseats
                }
            } else if (flightclass == 'business') {
                refund = schedule_data.pricebusiness * numberofseats
                data = {
                    "seatsbusiness": schedule_data.seatsbusiness + numberofseats
                }
            } else if (flightclass == 'economy') {
                refund = schedule_data.priceeconomy * numberofseats
                data = {
                    "seatseconomy": schedule_data.seatseconomy + numberofseats
                }
            }

            request({
                url: scheduleUrl + "/" + scheduleid,
                method: 'PUT',
                json: data
            }, (err, res, body) => {
                let json = body.data
                console.log(json)
            })

            dataVar.setAll({
                "refund": refund
            })

            taskService.complete(task, dataVar)
        })

    })
    
})