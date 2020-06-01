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

const awsServerlessExpressMiddleware = require("aws-serverless-express/middleware");

dotenv.config();
const port = parseInt(process.env.PORT, 10) || 8081;
const dev = process.env.NODE_ENV !== "production";
const app = next({
  dev,
});
const handle = app.getRequestHandler();
const { SHOPIFY_API_SECRET, SHOPIFY_API_KEY, SCOPES } = process.env;

function createServer() {
  const server = new Koa();
  server.proxy = true;
  const router = new Router();
  // server.use(awsServerlessExpressMiddleware.eventContext());
  // // FIXME: https://github.com/awslabs/aws-serverless-express#getting-the-api-gateway-event-object
  // router.get('/', (req, res)=>{
  //   res.json(req.apiGateway.event);
  // });
  // server.use(router.allowedMethods());
  // server.use(router.routes());
  // return server;

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
  // router.prefix("/dev");
  router.get(
    "*",
    verifyRequest({ authRoute: "/auth", fallbackRoute: "/auth" }),
    async (ctx) => {
      await handle(ctx.req, ctx.res);
      ctx.respond = false;
      ctx.res.statusCode = 200;
    }
  );
  server.use(router.allowedMethods());
  server.use(router.routes());
  return server;
}

// https://github.com/vercel/next.js/issues/1406#issuecomment-315517536
// if (process.env.IN_LAMBDA) {
if (true) {
  module.exports = createServer();
} else {
  app.prepare().then(() => {
    const server = createServer();
    server.listen(port, () => {
      console.log(`> Ready on http://localhost:${port}`);
    });
  });
}
