// @ts-check
// webpack config for ts file.

const path = require("path");
const webpack = require("webpack");
// using "terser-webpack-plugin"
const TerserPlugin = require("terser-webpack-plugin");
const progress = require("./scripts/tiny/progress/");


/** 
 * @typedef {webpack.Configuration} WebpackConfigration
 * @typedef {{ beautify?: true; forceSourceMap?: true }} TExtraOptions
 */
/** @type {import("terser").MinifyOptions} */
const terserOptions = {
    sourceMap: true,
    mangle: true,
    format: {
        comments: false,
        beautify: true,
        indent_level: 1,
        // ecma: 9,
        max_line_len: 800,
        quote_style: 3
    }
};
/** @type {import("typescript").CompilerOptions} */
const tsCompilerOptions = {
    removeComments: true
};

/**
 * @param {WebpackConfigration["target"]} target 
 * @param {WebpackConfigration["output"]} output
 * @param {WebpackConfigration["mode"]} [mode] 
 * @param {TExtraOptions} [extraOpt] see {@link TExtraOptions}
 * @return {WebpackConfigration}
 * @version 2.0
 * @date 2022/3/20 - update jsdoc, added new parameter `extraOpt`
 */
const createWebpackConfig = (target, output, mode = "production", extraOpt = {}) =>  {

    /** @type {ConstructorParameters<typeof TerserPlugin>[0]} */
    const terserOpt = {
        // Enable parallelization. Default number of concurrent runs: os.cpus().length - 1.
        parallel: true,
        terserOptions
    };
    const {
        beautify,
        forceSourceMap,
    } = extraOpt;
    terserOptions.format.beautify = beautify;

    /**
     * @type {WebpackConfigration["module"]}
     */
    const module = {
        rules: [
            {
                test: /\.ts$/,
                loader: "ts-loader",
                exclude: /node_modules/,
                options: {
                    configFile: path.resolve(__dirname, "./tsconfig.json"), // DEVNOTE: 2022/03/24 - OK, works with tsconfig.json
                    compilerOptions: tsCompilerOptions,
                    // DEVNOTE: cannot use `transpileOnly` option because some problem of typescript enum
                    // transpileOnly: true
                }
            }
        ]
    };
    /**
     * @type {WebpackConfigration["entry"]}
     */
     const entry = {
        index: "./src/index.ts"
    };

    /**
     * @type {WebpackConfigration["externals"]}
     */
    const externals = [];
    const outputModule = /** @type {webpack.LibraryOptions} */(output.library).type === "module";

    return {
        name: `${target}-${mode}`,
        // "production", "development", "none"
        mode,
        // "web", "node"
        target,
        // entry point
        entry,
        // output config.
        output,
        module,
        externals,
        // DEVNOTE:  for library type: 'module'
        // However this feature is still experimental and not fully supported yet, so make sure to enable experiments.outputModule beforehand. In addition
        experiments: {
            outputModule
        },
        resolve: {
            extensions: [".ts"]
        },
        devtool: (forceSourceMap || mode === "development")? "source-map": false, // "source-map" -> need this for complete sourcemap.
    
        plugins: [
            new webpack.ProgressPlugin(
                progress.createWebpackProgressPluginHandler(/*`./logs/${utils.dateStringForFile()}-webpack.log`*/)
            ),
        ],
        optimization: {
            minimizer: [
                new TerserPlugin(terserOpt)
            ]
        },
        profile: true,
        cache: true,
        recordsPath: path.join(__dirname, `./logs/webpack-module-ids_${target}.json`),
    };
};

const debug = false;
/**
 * @type {true | undefined}
 */
const useSourceMap = void 0;

module.exports = [
    createWebpackConfig(
        /* target */ "web",
        /* output */ {
            path: `${__dirname}/dist/umd/`,
            filename: "[name].js",
            library: {
              name: "MiniSema",
              type: "umd"
            },
            // DEVNOTE: 2020/10/13
            //  From webpack v5, if "globalObject" is omitted, it seems that `self` is output, so I decided to explicitly specify "globalThis".
            //  This is a workaround for the problem that test stops at error
            globalObject: "globalThis"
        },
        debug && "development" || void 0,
        {
            beautify: debug || void 0,
            forceSourceMap: useSourceMap
        }
    ),
    createWebpackConfig(
        /* target */ "node",
        /* output */ {
            path: `${__dirname}/dist/webpack/`,
            filename: "[name].js",
            library: {
                type: "commonjs2"
            },
            // chunkFormat: "commonjs"
        },
        debug && "development" || void 0,
        {
            beautify: debug || void 0,
            forceSourceMap: useSourceMap
        }
    ),
    createWebpackConfig(
        // DEVNOTE: 2022/02/10 es2020 is output chunks
        /* target */ "es2019",
        /* output */ {
            path: `${__dirname}/dist/webpack-esm/`,
            filename: "[name].mjs",
            library: {
                type: "module"
            },
            chunkFormat: "module"
        },
        debug && "development" || void 0,
        {
            beautify: debug || void 0,
            forceSourceMap: useSourceMap
        }
    ),
];
