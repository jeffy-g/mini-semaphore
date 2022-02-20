// @ts-check
// webpack config for ts file.

const path = require("path");
const webpack = require("webpack");
// using "terser-webpack-plugin"
const TerserPlugin = require("terser-webpack-plugin");
const utils = require("./scripts/utils");


const terserOptions = {
    sourceMap: true,
    mangle: true,
    output: {
        comments: false,
        beautify: true,
        indent_level: 1,
        // ecma: 9,
        max_line_len: 800,
        /**
        @example
        export enum OutputQuoteStyle {
            PreferDouble = 0,
            AlwaysSingle = 1,
            AlwaysDouble = 2,
            AlwaysOriginal = 3
        }
         */
        quote_style: 3
    }
};

/** @typedef {import("webpack").Configuration} WebpackConfigration */
/**
 * @param {WebpackConfigration["target"]} target 
 * @param {WebpackConfigration["output"]} output 
 * @param {WebpackConfigration["mode"]} mode 
 * @return {WebpackConfigration}
 */
const createWebpackConfig = (target, output, mode = "production") =>  {
    return {
        // "production", "development", "none"
        mode,
        // "web", "node"
        target,
        // entry point
        entry: {
            index: "./src/index.ts"
        },
        // output config.
        output,

        module: {
            rules: [
                {
                    test: /\.ts$/,
                    loader: "ts-loader",
                    exclude: /node_modules/,
                    options: {
                        configFile: "src/tsconfig.json"
                    }
                }
            ]
        },
        resolve: {
            extensions: [".ts"]
        },
        devtool: "cheap-source-map", // "source-map" -> need this for complete sourcemap.
    
        plugins: [
            new webpack.ProgressPlugin(
                utils.createWebpackProgressPluginHandler(/*`./logs/${utils.dateStringForFile()}-webpack.log`*/)
            ),
        ],
        optimization: {
            minimizer: [
                new TerserPlugin({
                    // Enable parallelization. Default number of concurrent runs: os.cpus().length - 1.
                    parallel: true,
                    // cache: true,
                    // NOTE: The sourceMap setting of uglify in webpack v4,
                    // It must be set with option of UglifyJsPlugin instance.
                    // sourceMap: true,
                    terserOptions
                })
            ]
        },
        profile: true,
        cache: true,
        recordsPath: path.join(__dirname, "./logs/webpack-module-ids.json"),
    };
};

module.exports = [
    createWebpackConfig(
        /* target */ "web",
        /* output */ {
            path: `${__dirname}/dist/umd/`,
            filename: "[name].js",
            library: "MiniSema",
            // https://webpack.js.org/configuration/output/#outputlibrarytarget
            libraryTarget: "umd" // or "var"
        }
    ),
    createWebpackConfig(
        /* target */ "node",
        /* output */ {
            path: `${__dirname}/dist/webpack/`,
            filename: "[name].js",
            libraryTarget: "commonjs2"
        }
    ),
];
