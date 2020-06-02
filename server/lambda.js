"use strict";
const awsServerlessExpress = require("aws-serverless-express");
const app = require("./server");
const server = awsServerlessExpress.createServer(app.callback());

exports.handler = (event, context) => {
  console.log(`EVENT: ${JSON.stringify(event)}`);
  awsServerlessExpress.proxy(server, event, context);
};
