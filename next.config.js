const { parsed: localEnv } = require("dotenv").config();
const withCSS = require("@zeit/next-css");
const withTypescript = require("@zeit/next-typescript");

const webpack = require("webpack");
const apiKey = JSON.stringify(process.env.SHOPIFY_API_KEY);

module.exports = withCSS(
  withTypescript({
    webpack: (config) => {
      const env = { API_KEY: apiKey };
      config.plugins.push(new webpack.DefinePlugin(env));
      return config;
    },
  })
);
