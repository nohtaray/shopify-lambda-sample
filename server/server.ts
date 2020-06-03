import "@babel/polyfill";
import dotenv from "dotenv";
import "isomorphic-fetch";
import createShopifyAuth, { verifyRequest } from "@shopify/koa-shopify-auth";
import graphQLProxy, { ApiVersion } from "@shopify/koa-shopify-graphql-proxy";
import Koa from "koa";
import next from "next";
import Router from "koa-router";
import session from "koa-session";
import * as handlers from "./handlers/index";
import * as productsApi from "./api/products";

dotenv.config();
const {
  SHOPIFY_API_SECRET = "",
  SHOPIFY_API_KEY = "",
  SCOPES = "",
  IN_LAMBDA = false,
} = process.env;

const port = parseInt(process.env.PORT || "8081", 10) || 8081;
const dev = process.env.NODE_ENV !== "production";
const app = next({ dev: dev && !IN_LAMBDA });
const handle = app.getRequestHandler();

function defineApiRoutes(router) {
  router.get("/api/:shop/products", async (ctx) => {
    const shop = ctx.params.shop;
    const result = await productsApi.getProducts(ctx, shop);
    // TODO: 共通化
    // https://docs.aws.amazon.com/apigateway/latest/developerguide/set-up-lambda-proxy-integrations.html#api-gateway-simple-proxy-for-lambda-output-format
    ctx.body = {
      statusCode: 200,
      body: {
        message: "OK",
        data: result,
      },
    };
  });

  router.post("/api/products/:productId/put", verifyRequest(), async (ctx) => {
    // 認証が通っていればセッションに shop が入る
    // https://shopify.dev/tutorials/get-and-store-the-shop-origin#getting-and-storing-the-shop-origin
    const shop = ctx.session.shop;
    const productId = parseInt(ctx.params.productId, 10);
    const result = await productsApi.putProduct(ctx, shop, productId);
    ctx.body = {
      statusCode: 200,
      body: {
        message: "OK",
        data: result,
      },
    };
  });

  router.post(
    "/api/products/:productId/delete",
    verifyRequest(),
    async (ctx) => {
      const shop = ctx.session.shop;
      const productId = parseInt(ctx.params.productId, 10);
      const result = await productsApi.deleteProduct(ctx, shop, productId);
      ctx.body = {
        statusCode: 200,
        body: {
          message: "OK",
          data: result,
        },
      };
    }
  );
}

function createServer() {
  const server = new Koa();
  const router = new Router();
  server.proxy = true;

  server.use(
    session(
      {
        sameSite: "none",
        secure: true,
      },
      server
    )
  );
  server.keys = [SHOPIFY_API_SECRET];
  server.use(
    createShopifyAuth({
      apiKey: SHOPIFY_API_KEY,
      secret: SHOPIFY_API_SECRET,
      scopes: [SCOPES],

      async afterAuth(ctx) {
        if (ctx.session == null) return;
        //Auth token and shop available in session
        //Redirect to shop upon auth
        const { shop, accessToken } = ctx.session;
        ctx.cookies.set("shopOrigin", shop, {
          httpOnly: false,
          secure: true,
          sameSite: "none",
        });
        ctx.redirect("/");
      },
    })
  );
  server.use(
    graphQLProxy({
      version: ApiVersion.October19,
    })
  );

  defineApiRoutes(router);

  router.get("*", verifyRequest(), async (ctx) => {
    await handle(ctx.req, ctx.res);
    ctx.respond = false;
    ctx.res.statusCode = 200;
  });
  server.use(router.allowedMethods());
  server.use(router.routes());
  return server;
}

// https://github.com/vercel/next.js/issues/1406#issuecomment-315517536
const server = createServer();
if (!IN_LAMBDA) {
  app.prepare().then(() => {
    server.listen(port, () => {
      console.log(`> Ready on http://localhost:${port}`);
    });
  });
}
export default server;
