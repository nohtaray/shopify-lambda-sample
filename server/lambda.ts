import * as awsServerlessExpress from "aws-serverless-express";
import app from "./server";
const server = awsServerlessExpress.createServer(app.callback());

exports.handler = (event, context) => {
  console.log(`EVENT: ${JSON.stringify(event)}`);
  awsServerlessExpress.proxy(server, event, context);
};
