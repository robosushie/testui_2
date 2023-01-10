/*jshint esversion: 6 */
"use strict";

const path = require("path");
const webpack = require("webpack");
const pluginCli = require("oci-plugin-cli");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const UglifyJsPlugin = require("uglifyjs-webpack-plugin");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const ForkTsCheckerWebpackPlugin = require("fork-ts-checker-webpack-plugin");
const TsconfigPathsPlugin = require("tsconfig-paths-webpack-plugin");
const BundleAnalyzerPlugin = require("webpack-bundle-analyzer").BundleAnalyzerPlugin;
const pluginConstants = require("./webpack.plugin.constants");

// Get passed env args
const argv = require("yargs").argv;

const env = argv.env || {};

// Globals used during various builds.
const VERSION = JSON.stringify(require("./package.json").version).replace(/\"/g, "");
const isAnalyze = !!env.analyze;
const ASSET_URL_PREFIX = pluginCli.getProductionAssetUrl(pluginConstants.PLUGIN_NAME, VERSION);
const HASH_SUFFIX = process.env["HASH_FILE"] === "true" ? ".[hash]" : "";
const CONTENT_HASH_SUFFIX = process.env["HASH_FILE"] === "true" ? ".[contenthash]" : "";

console.log(`
===================================
Building...

Mode: ${pluginCli.WEBPACK_MODES.PRODUCTION}
Analyze Build: ${isAnalyze}
===================================
`);

const extractLess = new MiniCssExtractPlugin({
  filename: `css/[name]${HASH_SUFFIX}.css`
});

module.exports = {
  mode: pluginCli.WEBPACK_MODES.PRODUCTION,
  entry: {
    main: ["./src/main.tsx"]
  },
  output: {
    path: path.resolve(__dirname, "build"),
    filename: `js/[name]${CONTENT_HASH_SUFFIX}.js`,
    // Your webpack build will be namespaced to `webpackJsonp${LIBRARY_NAME}`
    library: pluginConstants.PLUGIN_NAME,
    libraryTarget: "umd"
  },
  devtool: "source-map",
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
        loader: `file-loader?publicPath=${ASSET_URL_PREFIX}&name=img/[name]${HASH_SUFFIX}.[ext]`
      },
      {
        test: /\.(eot|woff|woff2|ttf|svg)$/,
        loader: `file-loader?publicPath=${ASSET_URL_PREFIX}&name=fonts/[name]${HASH_SUFFIX}.[ext]`
      }
    ]
  },
  optimization: {
    splitChunks: {
      chunks: "all",
      automaticNameDelimiter: "-"
    },
    // Uglify when it's a production build
    minimize: true,
    minimizer: [
      new UglifyJsPlugin({
        cache: true,
        parallel: true,
        sourceMap: false,
        uglifyOptions: {
          compress: {
            unused: false
          },
          output: {
            comments: false
          }
        }
      })
    ]
  },
  performance: { maxEntrypointSize: 3000000, maxAssetSize: 3000000 },
  plugins: [
    new ForkTsCheckerWebpackPlugin({
      checkSyntacticErrors: true,
      async: false
    }),
    isAnalyze ? new BundleAnalyzerPlugin() : () => {},
    new webpack.NamedModulesPlugin(),
    // Copy the plugin-name template to the build and fill in the template
    new HtmlWebpackPlugin({
      filename: "index.tpl.html",
      template: "src/assets/index.tpl.html",
      cdnUrl: ASSET_URL_PREFIX,
      containerId: pluginConstants.CONTAINER_ID,
      minify: true
    }),
// Extract Less for compilation
    extractLess,
    new pluginCli.PluginManifestWebpackPlugin()
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
