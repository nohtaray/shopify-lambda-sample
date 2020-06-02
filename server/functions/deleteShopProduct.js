const AWS = require("aws-sdk");
const dynamo = new AWS.DynamoDB.DocumentClient({
  region: "us-east-1",
});

const dev = process.env.NODE_ENV !== "production";

exports.handler = (event, context, callback) => {
  console.log("event:", event);
  const shop = event.pathParameters.shop;
  const productId = event.pathParameters.product_id;
  dynamo.delete(
    {
      TableName: "pre_order_products",
      Key: {
        shop,
        product_id: parseInt(productId, 10),
      },
    },
    (err, data) => {
      if (err) {
        console.log("error:", err);
        callback(dev ? new Error(err) : new Error());
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
