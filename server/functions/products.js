const AWS = require("aws-sdk");
const dynamo = new AWS.DynamoDB.DocumentClient({
  region: "us-east-1",
});

const dev = process.env.NODE_ENV !== "production";

exports.getHandler = (event, context, callback) => {
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
      callback(dev ? new Error(err) : new Error());
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

exports.putHandler = (event, context, callback) => {
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
        product_id: parseInt(productId, 10),
        created_at: now,
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

exports.deleteHandler = (event, context, callback) => {
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
