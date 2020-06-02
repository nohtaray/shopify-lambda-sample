const AWS = require("aws-sdk");
const dynamo = new AWS.DynamoDB.DocumentClient({
  region: "us-east-1",
});

exports.handler = (event, context, callback) => {
  console.log("event:", event);
  const queryParams = {
    TableName: "pre_order_products",
    KeyConditionExpression: "#key = :str",
    ExpressionAttributeNames: {
      "#key": "shop",
    },
    ExpressionAttributeValues: {
      ":str": event.pathParameters.shop,
    },
  };

  dynamo.query(queryParams, (err, data) => {
    if (err) {
      console.log("error:", err);
      callback(new Error());
      return;
    }
    const productIds = data.Items.map((item) => item.product_id);
    const response = {
      statusCode: 200,
      body: JSON.stringify({
        message: "OK",
        data: productIds,
      }),
    };
    callback(null, response);
  });
};
