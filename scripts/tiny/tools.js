#!/usr/bin/env node
/*!
 - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  Copyright (C) 2019 jeffy-g <hirotom1107@gmail.com>
  Released under the MIT license
  https://opensource.org/licenses/mit-license.php
 - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
*/
// @ts-check
/**
 * @typedef {(matchs: string, ...args: any[]) => string} TStringReplacer
 */

const fs = require("fs");
/* utilities module by own. */
const utils = require("./utils");

/**
 * @typedef TToolArgs
 * @prop {string | string[]} basePath
 * @prop {string[]} targets
 * @prop {string} suffix
 * @prop {string} major
 * @prop {string} minor
 * @prop {string} patch
 * @prop {string[]} extras
 * @prop {string} dest
 * @prop {string} cmd
 * @prop {string} ext for `cjbm` replace extension. default is `js`
 * @prop {RegExp} test
 * @prop {RegExp} regex
 * @prop {boolean} rmc4ts
 * 
 * @prop {string} webpack - actual webpack source path
 * @prop {string} umd - actual umd source path
 * 
 * @prop {string[]} pkgJsons - version command
 * 
 * @prop {string} help want help? form - "-help <cmd name>"
 */

/**
 * @type {TToolArgs & ReturnType<typeof utils.getExtraArgs>}
 */
const params = utils.getExtraArgs();
!utils.CI && console.log(params);



/**
 * @typedef TProcessSourcesOpt
 * @prop {string} [base]
 * @prop {string[]} [bases] Array of search directory paths, overriding "base"
 * @prop {RegExp} [test]
 * @prop {string[]} [targets]
 * @prop {string} [suffix]
 */
/**
 * 
 * @param {string} taskName 
 * @param {(source: string) => string} process 
 * @param {TProcessSourcesOpt} [opt] 
 */
function processSources(
    taskName,
    process, {
        base = "./build", bases,
        test = /\.js$/,
        suffix = "",
        targets,
    } = {}
) {

    /** @type {string[]} */
    let sourceFiles;
    if (!targets && (bases || base)) {
        sourceFiles = [];
        const re = params.test || test;
        const visitDirectry = (/** @type {string} */ dir) => {
            utils.walkDirSync(dir, dirent => {
                if (dirent.isFile() && re.test(dirent.name)) {
                    sourceFiles.push(`${dir}/${dirent.name}`);
                }
            });
        };
        if (Array.isArray(bases)) {
            bases.forEach(base => visitDirectry(base));
        } else {
            visitDirectry(base);
        }
    } else {
        sourceFiles = params.targets || targets;
        if (sourceFiles.length && params.basePath) {
            const basePath = Array.isArray(params.basePath)? params.basePath[0]: params.basePath;
            utils.prependStringTo(sourceFiles, basePath, "/");
        }
    }

    console.time(taskName);
    for (const sourceFile of sourceFiles) {
        if (fs.existsSync(sourceFile)) {
            // (err: any, data: string) => void
            utils.readTextUTF8(sourceFile, (err, data) => {
                if (err) {
                    console.log(err);
                    return;
                }
                const ret = process(data);
                const outputName = sourceFile.replace(/(?=\.js$)/, suffix);
                if (/** @type {any} */(ret) instanceof Promise) {
                    ret.then((/** @type {string} */data) => {
                        utils.writeTextUTF8(data, outputName);
                    });
                } else {
                    utils.writeTextUTF8(ret, outputName);
                }
            });
        } else {
            console.warn(`file: "${sourceFile}" is not exists`);
        }
    }
    console.timeEnd(taskName);
}

/**
 * @typedef {{
 *    fn: () => void;
 *    help: string;
 * }} TJSToolEntry
 */
/**
 * @typedef TRecordWebpackSizeArgs
 * @prop {string} dest - record path
 * @prop {string} webpack - webpacked source path. default `./dist/webpack/index.js`
 * @prop {string} umd - webpacked umd source path. default `./dist/umd/index.js`
 * 
 * @typedef TCJBMArgs currentlly support `js` only
 * @prop {string | string[]} basePath - source scan path
 */

 
/**
 * @type {Record<string, TJSToolEntry>}
 */
const ToolFunctions = {

    /** (r)ecord(W)ebpack(S)ize */
    // jstool -cmd rws [-webpack lib/webpack.js -dest "./dev-extras/webpack-size.json"]
    rws: {
        fn: () => {
            const thisPackage = utils.readJson("./package.json");
            const recordPath = params.dest || "./logs/webpack-size.json";
            const sizeRecord = fs.existsSync(recordPath)? utils.readJson(recordPath): {};
            const versionStr = thisPackage.version;
    
            const entry = {};
            let sourcePath = params.webpack || "./dist/webpack/index.js";
            if (fs.existsSync(sourcePath)) {
                entry.webpack = fs.statSync(sourcePath).size;
            }
            sourcePath = params.umd || "./dist/umd/index.js";
            if (fs.existsSync(sourcePath)) {
                entry.umd = fs.statSync(sourcePath).size;
            }
    
            if (Object.keys(entry).length) {
                sizeRecord[versionStr] = entry;
                !utils.CI && console.log(sizeRecord);
                utils.writeTextUTF8(
                    JSON.stringify(sizeRecord, null, 2), recordPath, () => {
                        console.log("[%s] is updated", recordPath);
                    }
                );
            }
        },
        help: `(r)ecord(W)ebpack(S)ize
  ex - jstool -cmd rws [-webpack lib/webpack.js -dest "./dev-extras/webpack-size.json"]
  note:
    webpack - if not specified then apply "./dist/webpack/index.js"
    dest - if not specified then apply "./dev-extras/webpack-size.json"`
    },

    //
    // (C)onvert (J)S to (B)rowser (M)odule
    // basePath <js source base directory>
    // jstool -cmd cjbm -basePath extra-tests/mini-semaphore [-targets "['core.js', 'object.js']"]
    // 
     cjbm: {
        fn: () => {
            /** ### regex summary
             * ```perl
             * (?:import|export)    # comments
             * \s+
             * (?:
             *   "(?=[.\/]+)|       # character ["] \x22 e.g - import "../global/index"
             *   (?:
             *     [\w_]+\s+from\s|                      # default import, e.g - import fs from "./file";
             *     (?:[\w_]+\s*,\s*)?\{[^}]+\}\s+from\s+|  # e.g - import View, { TitiledSphereMesh } from "./view";
             *     \*\s+as\s+[\w_]+\s+from\s+|           # e.g - export * as OO from "./rateLimiter";
             *     \*\s+from\s+                          # e.g - export * from "./rateLimiter";
             *   )"(?=[.\/]+)       # Positive Lookahead (./|../|../../) ...
             * )
             * (?!.*(?:\.(?:c|m)?js)).+                  # Negative Lookahead not(/\.(?:c|m)?js/)
             * (?="\s*;?)
             * ```
             */
            const reImportExportDetection =
                /(?:import|export)\s+(?:"(?=[.\/]+)|(?:[\w_]+\s+from\s|(?:[\w_]+\s*,\s*)?\{[^}]+\}\s+from\s+|\*\s+as\s+[\w_]+\s+from\s+|\*\s+from\s+)"(?=[.\/]+))(?!.*(?:\.(?:c|m)?js)).+(?="\s*;?)/gm;
            const bases = Array.isArray(params.basePath)? params.basePath: [params.basePath];
            const ext = params.ext || "js";
            const replacer = (/** @type {string} */ $0) => {
                if ($0[$0.length - 1] === "/") {
                    return `${$0}index.${ext}`;
                }
                return `${$0}.${ext}`;
            };
            // const bs = Array.isArray(params.basePath)? params.basePath[0]: params.basePath;
            processSources(
                "[(C)onvert (J)S to (B)rowser (M)odule]", (data) => {
                    return data.replace(reImportExportDetection, replacer);
                }, {
                    bases
                    // base: bs || ""
                }
            );
        },
        help: `(C)onvert (J)S to (B)rowser (M)odule
  ex - jstool -cmd cjbm -basePath "./dist/esm,extra-tests/mini-semaphore" [-targets "['core.js', 'object.js']"]
  note:
    basePath - can be "<path>,<path>,..." (array type arg)
    targets - must be array type arg, "['<path>', '<path>',...]" or "<path>,<path>,..."`
    },

    // jstool -cmd cmtTrick -targets "['core.js', 'object.js']" [-basePath extra-tests/mini-semaphore]
    cmtTrick: {
        fn: () => {
            processSources(
                "[comment trick toggle]", (data) => {
                    return data.replace(/\/+(?=\*\s?(the-comment-toggle-trick|https:\/\/coderwall))/g, $0 => {
                        const slashes = $0.length === 2? "/": "//";
                        console.log("the-comment-toggle-trick: %s", /*enableBefore*/slashes.length === 2 ? "-->enable before<--, mute after": "mute before, -->enable after<--");
                        return slashes;
                    });
                }, {
                    base: "",
                    targets: params.targets
                }
            );
        },
        help: `jstool -cmd cmtTrick -targets "['core.js', 'object.js']" -basePath extra-tests/mini-semaphore
  note:
    targets - must be array type arg, "['<path>', '<path>',...]" or "<path>,<path>,..."`
    },

    // jstool -cmd version -extras "test/web/index.html,"
    version: {
        fn: () => {
            let {
                major, minor/*, patch*/,
                pkgJsons = ["./package.json"]
            } = params;
            /** @type {string} */
            let nextVersion;
            utils.fireReplace(/"version": "(\d+)\.(\d+)\.(\d+)(-\w+)?"/, /** @type {TStringReplacer} */($0, $1, $2, $3, tag) => {
                /** @type {string | number} */
                let _major = $1;
                /** @type {string | number} */
                let _minor = $2;
                /** @type {string | number} */
                let _patch = $3;
                if (major) {
                    _minor = 0;
                    _major = +_major + 1;
                }
                else if (minor) {
                    _minor = +_minor + 1;
                }
                if (major || minor) {
                    _patch = 0;
                } else {
                    _patch = +_patch + 1;
                }
                nextVersion = `${_major}.${_minor}.${_patch}${tag? tag: ""}`;
                return `"version": "${nextVersion}"`;
            }, pkgJsons);
    
            const paths = Array.isArray(params.extras)? params.extras: typeof params.extras === "string"? [params.extras]: [];
            if (paths.length) {
                utils.fireReplace(/v(\d+\.\d+\.\d+)(-\w+)?/g, /** @type {TStringReplacer} */($0, $1, $2) => {
                    if ($1) {
                        return "v" + nextVersion; // + ($2? $2: "");
                    }
                    return $0;
                }, paths);
            }
            // @ts-ignore 
            console.log("version updated: %s", nextVersion);
        },
        help: `jstool -cmd version [-major | -minor] [-pkgJsons "./package.json,../package.json"] [-extras "test/web/index.html"]
  bump top level package.json version(can specify "package.json" paths by \`pkgJsons\` option if need), specify patch version is unnecessary.
  note:
    extras - can be "<path>,<path>,..." (array type arg)`
    },

    // rmc version 3.x
    /**
     * NOTE: keep comment that start with "/&#42;" when "&#42;/" end mark appears in same line.
     * 
     *   + if start with "/&#42;-" remove it
     */
    rmc: {
        fn: () => {

            const rmc = require("./rm-cmts-lkg");
            // DEVNOTE: 2020/5/2 - rm-cstyle-cmts dev (with scan event listener)
            if (rmc.setListener && params.rmc4ts) {
                rmc.setListener(({ event, fragment }) => {
                    if (event === /*ScannerEvent.MultiLineComment*/1) {
                        return /^\/\*(\*|!)\s|^\/\*(?!-).+\*\/$/.test(fragment);
                    }
                    // DEVNOTE: this detection is rmc default
                    // else if (event === /*ScannerEvent.SingleLineComment*/0) {
                    //     return /(?:\/\/\/?\s+@ts-\w+|\/\/\/\s*<reference)/.test(fragment);
                    // }
                    // else if (event === /*ScannerEvent.ES6Template*/2) {
                    //     ;
                    // }
                    return false;
                });
            }
            const targets = params.targets;
            const basePaths = Array.isArray(params.basePath)? params.basePath: [params.basePath];
            processSources(
                "rm-cstyle-cmts", data => {
                    /*
                    const after = rmc(data);
                    // purge typescript v3.9.x extra statement
                    return after.replace(/\s(exports\.\w+\s=\s)+void 0;/m, "");
                    /*/
                    return rmc(data);
                    //*/
                }, {
                    bases: basePaths,
                    targets,
                    suffix: params.suffix,
                    test: params.test || /\.js$/
                }
            );
        },
        help: `jstool -cmd rmc -basePath ./dist [-rmc4ts]
  note: basePath - can be "<path>,<path>,..." (array type arg)
        rmc4ts - for typescript source.
          keep comment that start with "/*" when "*/" end mark appears in same line.
          if start with "/*-" remove it`
    },

    // jstool -cmd stripWebpack -regex \"%npm_package_defs_regex%\""
    stripWebpack: {
        fn: () => {
            const re = params.regex || /!function\s*\((.)\)([^]+)(?=\(.\.restrictor\s*\|\|)/;
            if (re) {
                processSources(
                    "[stripWebpack]", data => {
                        const result = data.replace(re, ($0, $1, $2) => {
                            console.log("[stripWebpack] hit!");
                            return `(${$1}=>${$2})`;
                        });
                        return result;
                    }, {
                        base: "",
                        targets: ["./dist/umd/index.js", "./dist/webpack/index.js", "./dist/webpack-esm/index.mjs"]
                    }
                );
            }
        },
        help: `jstool -cmd stripWebpack [-regex "%npm_package_defs_regex%"]
  note: regex - unused
`
    }
};

/**
 * @param {TJSToolEntry} entry 
 * @returns {entry is TJSToolEntry}
 */
function isJSToolEntry(entry) {
    if (typeof entry !== "object") return false;
    return typeof entry.fn === "function" && typeof entry.help === "string";
}
/**
 * @param {string} cmd 
 * @returns {void}
 */
function printHelp(cmd) {
    const entry = ToolFunctions[cmd];
    console.log(`"${cmd}" help: ${entry.help}`);
}

if (params.cmd) {
    const entry = ToolFunctions[params.cmd];
    isJSToolEntry(entry) && entry.fn();
} else if (params.help) {
    const cmdName = params.help;
    if (typeof cmdName === "string") {
        printHelp(cmdName);
    } else {
        console.log("invalid arg, help form is '-help <cmd name>'");
    }
} else {
    const commands = Object.keys(ToolFunctions);
    console.log(`
Usage: node jstool -cmd <command name>
 - - - - available commands:`
    );
    for (const cmd of commands) {
        printHelp(cmd);
    }
}
