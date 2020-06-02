const AWS = require("aws-sdk");
const dynamo = new AWS.DynamoDB.DocumentClient({
  region: "us-east-1",
});

exports.handler = (event, context, callback) => {
  const params = {
    TableName: "pre_order_products",
    KeyConditionExpression: "#key = :str",
    ExpressionAttributeNames: {
      "#key": "shop",
    },
    ExpressionAttributeValues: {
      ":str": "thonthon-store",
    },
  };

  console.log("event:", event);
  dynamo.query(params, function (err, data) {
    console.log("dynamo_data:", data);
    console.log("dynamo_err:", err);
    context.done(null, data);
  });
};
