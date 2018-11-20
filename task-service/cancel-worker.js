const { Client, logger } = require('camunda-external-task-client-js')

const config = {
    baseUrl: 'http://localhost:8080/engine-rest',
    use: logger
}

const client = new Client(config)

client.subscribe('validate-booking-number', async ({ task, taskService }) => {
    const bookingId = task.variables.get('bookingId')
    return {
        variables: {
            isValid: true
        }
    }
})

client.subscribe('calculate-refund', async ({ task, taskService }) => {
    const bookingId = task.variables.get('bookingId')
    return {
        variables: {
            moneyValue: 50000
        }
    }
})