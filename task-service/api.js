var express = require('express')
var app = express()
var bodyParser = require('body-parser')
const request = require('request')
const cfg = require('./config').config

app.use(bodyParser.urlencoded({ extended: true }))
app.use(bodyParser.json())

var port = process.env.PORT || 8090
var router = express.Router()

var cache = {}

router.get('/', function (req, res) {
    res.json({ message: 'Api v0.1' });
})
router.route('/book')
    .post(function (req, res) {
        bookId = req.body.bookId
        console.log(bookId)
        request({
            url: cfg.baseUrl + "/process-definition/key/flight-booking-v3/start",
            method: 'POST',
            json: {
                "variables": {
                    "booking_id": {
                        "value": bookId,
                        "type": "long"
                    }
                }
            }
        }, (err, res2, body) => {
            cache[body.id] = {
                'urlPayment': '',
                'paymentStatus': 'not_paid'
            }
            res.json({
                "taskId": body.id
            })
        })
    })

router.route('/invoke')
    .post(function (req, res) {
        taskId = req.body.taskId
        urlPayment = req.body.urlPayment
        cache[taskId]['urlPayment'] = urlPayment
        res.json({})
    })

router.route('/book/:taskId')
    .get(function (req, res) {
        taskId = req.params.taskId
        try{
            res.json({
                "urlPayment": cache[taskId]['urlPayment'],
                "paymentStatus": cache[taskId]['paymentStatus']
            })
        } catch {
            res.json({})
        }
        
    })

router.route('/invoke2')
    .post(function (req, res) {
        taskId = req.body.taskId
        cache[taskId]['urlPayment'] = ''
        cache[taskId]['paymentStatus'] = 'paid'
        res.json({})
    })

router.route('/cancel')
    .post(function (req, res) {
        bookId = req.body.bookId
        console.log(bookId)
        request({
            url: cfg.baseUrl + "/process-definition/key/cancel-booking/start",
            method: 'POST',
            json: {
                "variables": {
                    "booking_id": {
                        "value": bookId,
                        "type": "long"
                    }
                }
            }
        }, (err, res2, body) => {
            res.json({
                "taskId": body.id
            })
        })
    })

app.use('/api', router)
app.listen(port)
console.log('Listening on ' + port)