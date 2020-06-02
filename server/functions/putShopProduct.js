const AWS = require("aws-sdk");
const dynamo = new AWS.DynamoDB.DocumentClient({
  region: "us-east-1",
});

exports.handler = (event, context, callback) => {
  console.log("event:", event);
  // TODO: validation
  const shop = event.pathParameters.shop;
  const productId = event.pathParameters.product_id;
  const now = Math.floor(Date.now() / 1000);
  dynamo.put(
    {
      TableName: "pre_order_products",
      Item: {
        shop,
        product_id: productId,
        created_at: now,
      },
    },
    (err, data) => {
      if (err) {
        console.log("error:", err);
        callback(new Error());
        return;
      }
      const response = {
        statusCode: 200,
        body: JSON.stringify({
          message: "OK",
          data: { shop, product_id: productId },
        }),
      };
      callback(null, response);
    }
  );
};
