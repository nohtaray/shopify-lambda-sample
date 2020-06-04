const dev = process.env.NODE_ENV !== "production";
const XRayWrapper = dev
  ? require("aws-xray-sdk-core").captureAWS
  : (sdk) => sdk;
const AWS = XRayWrapper(require("aws-sdk"));
const dynamo = new AWS.DynamoDB.DocumentClient({
  region: "us-east-1",
});
import Koa from "koa";

export const getProducts = (ctx: Koa.Context, shop: string) => {
  return new Promise((resolve, reject) => {
    const queryParams = {
      TableName: "pre_order_products",
      KeyConditionExpression: "#key = :str",
      ExpressionAttributeNames: {
        "#key": "shop",
      },
      ExpressionAttributeValues: {
        ":str": shop,
      },
    };
    dynamo.query(queryParams, (err, data) => {
      if (err) {
        console.log("error:", err);
        reject(dev ? new Error(err) : new Error());
        return;
      }
      const productIds = data.Items.map((item) => item.product_id);
      resolve(productIds);
    });
  });
};

export const putProduct = async (
  ctx: Koa.Context,
  shop: string,
  productId: number
) => {
  return new Promise((resolve, reject) => {
    const now = Math.floor(Date.now() / 1000);
    const putParams = {
      TableName: "pre_order_products",
      Item: {
        shop,
        product_id: productId,
        created_at: now,
      },
    };
    dynamo.put(putParams, (err, data) => {
      if (err) {
        console.log("error:", err);
        reject(dev ? new Error(err) : new Error());
        return;
      }
      resolve({ shop, product_id: productId });
    });
  });
};

export const deleteProduct = async (
  ctx: Koa.Context,
  shop: string,
  productId: number
) => {
  return new Promise((resolve, reject) => {
    const deleteParams = {
      TableName: "pre_order_products",
      Key: {
        shop,
        product_id: productId,
      },
    };
    dynamo.delete(deleteParams, (err, data) => {
      if (err) {
        console.log("error:", err);
        reject(dev ? new Error(err) : new Error());
        return;
      }
      resolve({ shop, product_id: productId });
    });
  });
};
