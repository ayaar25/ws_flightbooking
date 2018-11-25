const { Client, logger } = require('camunda-external-task-client-js');
const { Variables } = require('camunda-external-task-client-js');
const http = require('http');
const request = require('request');

const config = { baseUrl: 'http://localhost:8080/engine-rest', use: logger };

const client = new Client(config);

client.subscribe('validate-payment-card', async function({ task, taskService }) {
  const isvalid = task.variables.get('isBookingValid');

  if (isvalid) {
    console.log('valid');
  } else {
    console.log('invalid');
  }

  await taskService.complete(task);
});