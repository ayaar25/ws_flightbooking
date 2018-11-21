const { Client, logger } = require('camunda-external-task-client-js')
const https = require('https');

const config = {
    baseUrl: 'http://localhost:8080/engine-rest',
    use: logger
}

const client = new Client(config)

client.subscribe('calculate-refund', async ({ task, taskService }) => {
    const booking_id = task.variables.get('booking_id')

    request('http://localhost:8000/bookings/'+booking_id, { json: true }, (err, res, body) => {
        if (err) { return console.log(err); }
        
        console.log(`all is well`);
        booking_data = body.data;
        scheduleid = booking_data.scheduleid;

        flightclass = booking_data.flightclass;
    });

    console.log(`Your refund is 5000 and your id is ${booking_id}`);

    // Complete the task
    // await taskService.complete(task);
    return {
        moneyValue: 50000
    }
})

client.subscribe('reject-cancelation', async ({ task, taskService }) => {
    const booking_id = task.variables.get('booking_id')
    console.log(`Your cancelation rejected, booking id ${booking_id} is not valid`);

    // Complete the task
    // await taskService.complete(task);
    // return {
    //     variables: {
    //         isValid: false
    //     }
    // }
})