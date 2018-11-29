var soap = require('soap')
var url = 'http://167.205.35.211:8080/easypay/PaymentService?wsdl'
var args = {
    paymentMethodId: 'ovo',
    amount: 100000
}
var args2 = {
    paymentId: 'aa302f93-83c2-4e22-b58a-49d844ca8b9a',
    lastEventId: 0
}
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
                        if (event.attributes.type == 'SUCCESS'){
                            console.log('Success payment with id', paymentEventId)
                            clearInterval(polling)
                        } else if (event.attributes.type == 'FAILURE'){
                            console.log('Failure')
                            clearInterval(polling)
                        }
                    })
                })
            }, 2500)

        })
    })

})