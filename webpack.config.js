/// <reference path="./scripts/tiny/basic-types.d.ts"/>

// @ts-check
// webpack config for ts file.
const webpack = require("webpack");
// using "terser-webpack-plugin"
const TerserPlugin = require("terser-webpack-plugin");
const progress = require("./scripts/tiny/progress/");

/**
 * @typedef {import("terser").MinifyOptions} MinifyOptions
 */

/** @type {RequireThese<MinifyOptions, "format">} */
const terserOptions = {
    sourceMap: true,
    mangle: true,
    format: {
        comments: false,
        // beautify: true,
        indent_level: 1,
        // ecma: 9,
        max_line_len: 800,
        quote_style: 3
    }
};
/** @type {ConstructorParameters<typeof TerserPlugin>[0]} */
// @ts-ignore TS2322: minify option required
const terserOpt = {
    // Enable parallelization. Default number of concurrent runs: os.cpus().length - 1.
    parallel: true,
    terserOptions
};
/** @type {import("typescript").CompilerOptions} */
const tsCompilerOptions = {
    removeComments: true
};

/** 
 * @typedef {webpack.Configuration} WebpackConfigration
 * @typedef {Required<WebpackConfigration>} FixWebpackConfigration
 * @typedef {{
 *   forceSourceMap?: true;
 * }} TExtraOptions
 */
/**
 * @param {FixWebpackConfigration["target"]} target 
 * @param {FixWebpackConfigration["output"]} output
 * @param {FixWebpackConfigration["mode"]} [mode] 
 * @param {TExtraOptions} [extraOpt] see {@link TExtraOptions}
 * @return {WebpackConfigration}
 * @version 2.0
 * @date 2022/3/20 - update jsdoc, added new parameter `extraOpt`
 */
const createWebpackConfig = (target, output, mode = "production", extraOpt = {}) =>  {

    const {
        // beautify,
        forceSourceMap,
    } = extraOpt;
    // DEVNOTE: `beautify` is deperecated, Not implemented anymore
    // terserOptions.format.beautify = beautify;

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
                    configFile: `${__dirname}/tsconfig.json`,
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
    const mainName = `${target}@${/** @type {webpack.LibraryOptions} */(output.library).type}`;

    return {
        name: `${mainName}-${mode}`,
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
        recordsPath: `${__dirname}/logs/webpack-module-ids_${mainName}.json`
    };
};


/**
 * @typedef {Parameters<typeof createWebpackConfig>} TConfigParameters
 * @typedef {[TConfigParameters[0], TConfigParameters[1]]} TPrimaryParameters
 */
/**
 * @type {(TPrimaryParameters)[]}
 */
 const configParameters = [
    [
        "web", /* target, can be omitted as default is 'web' */ 
        {      /* output */
            path: "dist/umd/",
            library: {
                name: "MiniSema",
                type: "umd"
            },
            // chunkFormat: "array-push",
            globalObject: "globalThis"
        }
    ], [
        "node", /* target */
        {       /* output */
            path: "dist/webpack/",
            library: {
                type: "commonjs2"
            },
            chunkFormat: "commonjs"
        }
    ], [
        // DEVNOTE: 2022/02/10 es2020 is output chunks
        "es2019", /* target */
        {       /* output */
            path: "dist/webpack-esm",
            library: {
                type: "module"
            },
            chunkFormat: "module"
        }
    ]
];

const debug = false;
/** @type {WebpackConfigration["mode"]} */
const mode = debug && "development" || void 0;
/** @type {TExtraOptions} */
const extraOpt = {
    // beautify: debug || void 0,
    // forceSourceMap: true
};
module.exports = configParameters.map(config => {
    const [
        target, output
    ] = config;
    if (!output.filename) {
        output.filename = "[name].js";
    }
    output.path = `${__dirname}/${output.path}`;
    return createWebpackConfig(target, output, mode, extraOpt);
});
