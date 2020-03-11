/*!
 - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
    <one line to give the program's name and a brief idea of what it does.>
    Copyright (C) 2017 jeffy-g hirotom1107@gmail.com

    This program is free software: you can redistribute it and/or modify
    it under the terms of the GNU Affero General Public License as
    published by the Free Software Foundation, either version 3 of the
    License, or (at your option) any later version.

    This program is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU Affero General Public License for more details.

    You should have received a copy of the GNU Affero General Public License
    along with this program.  If not, see <https://www.gnu.org/licenses/>.
 - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - 
*/
// @ts-check

// NOTE: fs-extra are bit slower.
const fs = require("fs");
// const util = require('util');
const path = require("path");
// for clearLine...
const readline = require("readline");

/**
 * @typedef {string | string[] | boolean | RegExp} TExtraArgsValue
 */

/** getExtraArgs default config.  */
const ArgsConfig = {
    startIndex: 2,
    prefix: "-",
};
/**
 * get arguments helper.  
 * extra params must be start with "-".  
 * ```shell
 * # e.g
 * node <script path> -minify -target es6 -setA -font serif
 * ```
 * if param value not specified -tag after then set value is "true".
 * 
 * @param {Partial<typeof ArgsConfig>} [args_config]
 * @type {<T, K extends keyof T>(config: Partial<typeof ArgsConfig>) => { [key in K]: T[key] }}
 */
function getExtraArgs(args_config, debug = false) {
    // debug log, if need.
    debug && console.log("process.argv: ", process.argv);

    args_config = args_config || {};
    args_config = Object.assign(ArgsConfig, args_config);

    const varIndex = args_config.prefix.length;
    const extra_index = args_config.startIndex;
    /** @type {ReturnType<typeof getExtraArgs>} */
    const params = {};

    if (process.argv.length > extra_index) {
        const args = process.argv;
        for (let index = extra_index; index < args.length;) {
            const opt = args[index++];
            if (opt && opt.startsWith(args_config.prefix)) {
                /** @type {TExtraArgsValue} */
                let value = args[index];
                if (value === void 0 || value.startsWith(args_config.prefix)) {
                    value = true;
                } else {
                    // DEVNOTE: now possible to process array parameters. -> gulp pug --electron --dests "['../eve-cerebral-app.bitbucket.io', './src']"
                    // DEVNOTE: 2020/2/28 - support regex parameter -> node ./scripts/tools -cmd rmc -basePath ./dist -test '/.js$/'
                    if (/\[.+\]/.test(value) || /^\/[^/]+\/[gimuy]{0,5}/.test(value)) {
                        value = eval(value);
                    }
                    index++;
                }
                params[opt.substring(varIndex)] = value;
            }
        }
    }
    // @ts-ignore 
    return params;
}

function checkParentDirectory(dest) {
    const parent = path.dirname(dest);
    if (!fs.existsSync(parent)) {
        fs.mkdirSync(parent);
    }
}
/**
 * 
 * @param {string} logPath 
 */
function createLogStreamAndResolvePath(logPath) {
    checkParentDirectory(logPath);
    return fs.createWriteStream(logPath);
}

/**
 * write text content to dest path.  
 * when not exists parent directory, creat it.
 * 
 * @param {string|NodeJS.ReadableStream|Buffer} content text? content.
 * @param {string} dest content output path
 * @param {() => void} [callback] the callback function
 */
function writeTextUTF8(content, dest, callback = null) {
    // need dest parent dir check.
    checkParentDirectory(dest);

    const ws = fs.createWriteStream(dest);
    ws.on("error", function(err) {
        console.log("WriteStream.error evnet!", arguments);
    })
    .on("close", function(/*no args*/) {
        // DEVNOTE: this event never occurs when WriteStream.write returned `true`
        console.log("[close] %s, stream closed", dest);
        callback && callback();
    });

    if (content instanceof Buffer) {
        content = content.toString();
    }

    if (typeof content === "string") {
        const success = ws.write(content);
        console.log("writeTextUTF8: write: %s,", dest, success);
        if (!success) {
            ws.once("drain", function () {
                console.log("[drain] file written: %s,", dest, ws.bytesWritten);
                ws.end(); // -> call close()
            });
        }
        else {
            // process.nextTick(callback);
            callback && callback();
        }
    }
    else if ("readable" in content) { // Readable stream?
        content.pipe(ws);
    }
}

/**
 * 
 * @param {string} from file path.
 * @param {(err: any, data: string) => void} [callback] 
 */
function readTextUTF8(from, callback) {
    if (typeof callback === "function") {
        fs.readFile(from, "utf8", callback);
    } else {
        return fs.readFileSync(from, "utf8");
    }
}

/**
 * 
 * @param {string} path
 * @param {(dirent: import("fs").Dirent) => void} handler 
 */
function walkDirSync(path, handler) {
    fs.readdirSync(path, { withFileTypes: true }).forEach(dirent => {
        handler(dirent);
    });
}

/**
 * use process.stderr stream
 * 
 * @param {string} [msg] if empty string or undefined then only clear line and move cursor to head.
 */
// dir <number>
//   -1: to the left from cursor
//    1: to the right from cursor
//    0: the entire line
// 
function renderLine(msg) {
    const output = process.stderr;
    // clear the current line
    readline.cursorTo(output, 0, null);
    // write the message.
    msg && output.write(msg);
    readline.clearLine(output, 1);
}

/**
 * see https://webpack.js.org/plugins/progress-plugin/
 * 
 * @param {string} [logFilePath] can be undefined
 * @param {boolean} disableRenderLine 
 */
function createWebpackProgressPluginHandler(logFilePath, disableRenderLine = false) {

    const formatPercentage = (/** @type {number} */pct) => {
        return `processing ${(pct * 100).toFixed(4)}%`;
    };

    let dotted = 0;
    const renderDot = () => {
        process.stderr.write(".");
        // FIXME: first renderDot line length is not 100
        dotted++;
        if (dotted % 100 === 0) {
            process.stderr.write("\n");
        }
    };

    // (percentage: number, msg: string, moduleProgress?: string, activeModules?: string, moduleName?: string) => void
    /** @type {(percentage: number, message: string, ...args: string[]) => void} */
    let wpp_handler; {

        /** @type {string} */
        let progressMessage;
        /** @type {((msg?: string) => void) | undefined} */
        const renderer = process.env.CI? renderDot: renderLine;
        const cwd =  process.cwd(); // or path.resolve();

        if (logFilePath !== void 0) {
            const wpp_logger = createLogStreamAndResolvePath(logFilePath);
            /** @type {((p: number) => void) | undefined} */
            let writeCallback = void 0;

            if (!disableRenderLine) {
                writeCallback = (/** @type {number} */percentage) => {
                    renderer(progressMessage);
                    percentage === 1 && (console.log(), dotted = 0);
                };
            }
            wpp_handler = (percentage, message, ...args) => {
                progressMessage = formatPercentage(percentage);
                wpp_logger.write(`${progressMessage}, ${message}: ${args}\n`, () => {
                    writeCallback && writeCallback(percentage);
                });
                percentage === 1 && wpp_logger.end();
            };
        } else {
            wpp_handler = !disableRenderLine? (percentage, message, ...args) => {
                let [modules, actives, path = ""] = args;
                if (message) {
                    const x = path.lastIndexOf(cwd) + 1;
                    x > 0 && (path = path.substring(x + cwd.length));
                } else { // which means all processing done
                    message = "- done -";
                }
                renderer(
                    formatPercentage(percentage) + " | " + message + ` [${modules}, ${actives}] ${path}`
                );
                percentage === 1 && (console.log(), dotted = 0);
            }: () => {
                
            };
        }
    }

    return wpp_handler;
}
/**
 * logger for browserify
 * 
 * @param {string} logFilePath log output path name.
 */
function createBrowserifyFileEventLogger(logFilePath) {

    const log = createLogStreamAndResolvePath(logFilePath);
    /**
     * write browserify file event data.
     * 
     * @type {(counter: number, message: string, ...args: string[]) => void} */
    const logger = (counter, message, ...args) => {
        if (counter === void 0) {
            log.end();
            return;
        }
        const progressMessage = `resolve - ${counter}`;
        log.write(`${progressMessage}, ${message}: ${args}\n`, () => {
            renderLine(progressMessage);
        });
    };
    return logger;
}


module.exports = {
    getExtraArgs,
    writeTextUTF8,
    readTextUTF8,
    walkDirSync,
    renderLine,
    createWebpackProgressPluginHandler,
    createBrowserifyFileEventLogger,
};
