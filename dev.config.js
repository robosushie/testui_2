/*jshint esversion: 6 */
"use strict";

const path = require("path");
const webpack = require("webpack");
const pluginCli = require("oci-plugin-cli");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const WebpackShellPlugin = require("webpack-shell-plugin");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const ForkTsCheckerWebpackPlugin = require("fork-ts-checker-webpack-plugin");
const TsconfigPathsPlugin = require("tsconfig-paths-webpack-plugin");
const CopyWebpackPlugin = require("copy-webpack-plugin");
const BundleAnalyzerPlugin = require("webpack-bundle-analyzer").BundleAnalyzerPlugin;
const pluginConstants = require("./webpack.plugin.constants");

// Get passed env args
const argv = require("yargs").argv;

const env = argv.env || {};

// Globals used during various builds.
const mode = pluginCli.WEBPACK_MODES.DEVELOPMENT;
const isAnalyze = !!env.analyze;
const ASSET_URL_PREFIX = pluginCli.getDevelopmentAssetUrl(pluginConstants.LOCAL_PORT);

// Get plugin command with args/flags as string
const pluginCliCmd = (...cliArgs) => ["oci-plugin-cli", ...cliArgs.filter(a => !!a)].join(" ");

console.log(`
===================================
Starting...

Mode: ${mode}
Analyze Build: ${isAnalyze}
===================================
`);

const extractLess = new MiniCssExtractPlugin({
  filename: "css/[name].css"
});

module.exports = {
  mode: mode, // In the event they omitted it let's ensure it's set properly.
  entry: {
    main: ["./src/main.tsx"]
  },
  output: {
    path: path.resolve(__dirname, "build"),
    filename: "js/[name].js",
    // Your webpack build will be namespaced to `webpackJsonp${LIBRARY_NAME}`
    library: pluginConstants.PLUGIN_NAME,
    libraryTarget: "umd"
  },
  devtool: "inline-source-map",
  devServer: {
    hot: true,
    host: "0.0.0.0",
    inline: true,
    contentBase: path.resolve(__dirname, "build"),
    port: pluginConstants.LOCAL_PORT,
    https: process.env.DOCKERIZED ? false : pluginCli.getCerts(),
    headers: {
      "Access-Control-Allow-Origin": "*"
    },
    disableHostCheck: true
  },
  module: {
    rules: [
      // Lint all typescript prior to compiling and fail the build on errors
      {
        test: /\.tsx?$/,
        enforce: "pre",
        exclude: /(node_modules)/,
        use: [
          { loader: "cache-loader" },
          {
            loader: "tslint-loader",
            options: {
              typeCheck: false,
              emitErrors: true
            }
          }
        ]
      },
      // Handle typescript compiling
      {
        test: /\.tsx?$/,
        use: [
          { loader: "cache-loader" },
          {
            loader: "ts-loader",
            options: {
              happyPackMode: true
            }
          }
        ]
      },
      // Handle less compiling and minification
      {
        test: /\.(less|css)$/,
        use: [MiniCssExtractPlugin.loader, "css-loader", "less-loader"]
      },
      // File loaders for static assets.
      {
        test: /\.(png|jpg)$/,
        loader: `file-loader?publicPath=${ASSET_URL_PREFIX}&name=img/[name].[ext]`
      },
      {
        test: /\.(eot|woff|woff2|ttf|svg)$/,
        loader: `file-loader?publicPath=${ASSET_URL_PREFIX}&name=fonts/[name].[ext]`
      }
    ]
  },
  optimization: {
    namedModules: true,
    splitChunks: {
      chunks: "all",
      automaticNameDelimiter: "-"
    },
    minimize: false
  },
  performance: { maxEntrypointSize: 3000000, maxAssetSize: 3000000 },
  plugins: [
    new ForkTsCheckerWebpackPlugin({ checkSyntacticErrors: true, async: false }),
    isAnalyze ? new BundleAnalyzerPlugin() : () => {},
    new webpack.ExtendedAPIPlugin(),
    // Copy the plugin-name template to the build and fill in the template
    new HtmlWebpackPlugin({
      filename: "index.tpl.html",
      template: "src/assets/index.tpl.html",
      containerId: pluginConstants.CONTAINER_ID
    }),
    new CopyWebpackPlugin([{ to: "favicon.ico", from: "src/assets/favicon.ico" }]),
    // Extract Less for compilation
    extractLess,
    new WebpackShellPlugin({
      onBuildEnd: [
        pluginCliCmd("open", !env.open && "--dont-open", env.region && `--region ${env.region}`)
      ]
    }),
    new webpack.HotModuleReplacementPlugin(),
    new webpack.EnvironmentPlugin({
      NON_PROD_ENDPOINT: "http://localhost:24000/20190101",
      OVERRIDE_TELEMETRY_NAMESPACE: 'oci_datascience_dev',
      OVERRIDE_JOBRUN_TELEMETRY_NAMESPACE: "oci_datascience_jobrun_dev",
      OVERRIDE_MD_TELEMETRY_NAMESPACE: 'oci_datascience_pre_modeldeploy',
      OVERRIDE_PIPELINE_RUN_TELEMETRY_NAMESPACE: "oci_datascience_pipelinerun_dev"
    })
  ],
  resolve: {
    plugins: [new TsconfigPathsPlugin()],
    extensions: [
      ".ts",
      ".tsx",
      ".js",
      ".jsx",
      ".scss",
      ".sass",
      ".less",
      ".png",
      ".woff",
      ".woff2",
      ".eot",
      ".ttf",
      ".svg",
      ".ico"
    ],
    modules: ["src", "node_modules"]
  }
};
