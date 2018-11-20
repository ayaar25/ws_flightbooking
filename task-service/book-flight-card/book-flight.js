const { Client, logger } = require('camunda-external-task-client-js');

// configuration for the Client:
//  - 'baseUrl': url to the Process Engine
//  - 'logger': utility to automatically log important events
const config = { baseUrl: 'http://localhost:8080/engine-rest', use: logger };

// create a Client instance with custom configuration
const client = new Client(config);

// subscribe to the topic: 'book-flight-card'
client.subscribe('book-flight-card', async function({ task, taskService }) {
  // Put your business logic here

  // Get a process variable
  const amount = task.variables.get('passanger.email');
  const item = task.variables.get('schedule.scheduleid');

  console.log(`Charging credit card with an amount of $${amount} for the '${item}'...`);

  // Complete the task
  await taskService.complete(task);
});
