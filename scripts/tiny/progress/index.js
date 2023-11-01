/*!
 - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  Copyright (C) 2020 jeffy-g <hirotom1107@gmail.com>
  Released under the MIT license
  https://opensource.org/licenses/mit-license.php
 - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
*/
const lib = require("../common");
const {
    checkENV,
    wppHandlerV5,
    wppHandlerV4,
    isWebpackV5later
} = require("./progress-extras");


/**
 * 
 * @param {string[]} frames progress frame.
 * @param {{ fmt: string, payload?: Record<string, string> }} [formatOpt] 
 * ```
 * " {frameName} [{tick}]: {msg}" // etc
 * ```
 */
const createProgressSync = (frames, formatOpt) => {
    const fsize =  frames.length;
    let index = 0;
    /** @type {string} */
    let fmt;
    /** @type {Record<string, string>} */
    let payload;
    /** @type {string[]} */
    let keys;
    if (formatOpt) {
        fmt = formatOpt.fmt;
        // FIXME: 2023/10/27 - which use payload?
        payload = formatOpt.payload || {};
        keys = Object.keys(payload);
    }
    /**
     * @param {string} tick 
     * @param {string} msg 
     */
    const formater = (tick, msg) => {
        if (fmt) {
            let content = fmt;
            for (let i = 0, end = keys.length; i < end;) {
                const key = keys[i++];
                content = content.replace("{"+ key +"}", payload[key]);
            }
            return content.replace("{tick}", tick).replace("{msg}", msg);
        }
        return `[${tick}]: ${msg}`;
    };
    // let prev = "";
    return /**@type {(msg: string, done?: boolean) => void}*/ (msg, done = false) => {
        const tick = done? "-done-": frames[(index++) % fsize];
        const line = msg? formater(tick, msg): "";
        if (line) {
            // if (prev !== line) {
            //     renderLine(line);
            //     prev = line;
            // }
            lib.renderLine(line);
        } else {
            lib.renderLine();
        }
        // !line && (renderLine(), 1) || renderLine(line);
    };
};

/**
 * @typedef {{ fmt: string, payload?: Record<string, string> }} TProgressFormatOptions
 */
/**
 * 
 * @param {string[]} frames progress frame.
 * @param {TProgressFormatOptions} formatOpt 
 * ```
 * " {frameName} [{tick}]: {msg}" // etc
 * ```
 * @param {() => string} callback
 */
const createProgressObject = (frames, formatOpt, callback) => {

    let done = false;
    const render = () => {
        progress(callback(), done);
    };

    let progress = createProgressSync(frames, formatOpt);
    /** @type {ReturnType<typeof setInterval> | undefined} */
    let timer;
    let ms = 33;

    // progressObject
    return {
        /**
         * @param {string[]} [newFrames] 
         * @param {TProgressFormatOptions} [newOpt] 
         */
        updateOptions(newFrames, newOpt) {
            if (Array.isArray(newFrames) && typeof newFrames[0] === "string") {
                frames = newFrames;
            }
            if (typeof newOpt === "object" && newOpt.fmt) {
                formatOpt = newOpt;
            }
            done = false;
            progress = createProgressSync(frames, formatOpt);
        },
        /**
         * which means progress done
         */
        deadline() { done = true, render(); },
        /**
         * adjust to next line
         */
        newLine() { console.log(); },
        /**
         * change the fps rate
         * 
         * @param {number} fps 
         */
        setFPS(fps) {
            ms = (1000 / fps) | 0;
            if (timer) {
                clearInterval(timer);
                timer = setInterval(render, ms);
            }
        },
        /**
         * run timer (30fps)
         */
        run() {
            lib.cursor(false);
            done = false;
            if (timer) { return; }
            timer = setInterval(render, ms);
        },
        /**
         * stop timer
         */
        stop() {
            done = true;
            clearInterval(timer);
            timer = void 0;
            lib.cursor(true);
        }
    };
};

/**
 * create async progress
 * 
 * @param {number} timeSpanMS controll rotator cycle speed (ms). (maybe about...
 * @param {string[]} frames progress frame.
 */
const createProgress = (timeSpanMS, frames) => {
    // let index = 0;
    // return /**@type {(text: string) => void}*/ text => {
    //     const line = text === void 0? "" : `[${frames[index++ % frames.length]}]: ${text}`;
    //     !line && (progress(), 1) || process.nextTick(progress, line);
    // }
    const { performance } = require("perf_hooks");

    let index = 0;
    const fsize =  frames.length;
    let x = performance.now();
    return /**@type {(text: string) => void}*/ text => {
        const x2 = performance.now();
        const line = text === void 0? "" : `[${frames[index % fsize]}]: ${text}`;
        if ((x2 - x) > timeSpanMS) {
            index++;
        }
        x = x2;
        !line && (lib.renderLine(), 1) || process.nextTick(lib.renderLine, line);
    }
};


/**
 * see https://webpack.js.org/plugins/progress-plugin/
 * 
 * @param {string} [logFilePath] can be undefined
 * @param {boolean} [disableRenderLine]
 * @version 2.0 detect webpack version(v4 or v5)
 * @version 2.1 detect gitpod process
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
    /** @type {((msg?: string) => void) | undefined} */
    const renderer = process.env.CI? renderDot: lib.renderLine;

    // (percentage: number, msg: string, moduleProgress?: string, activeModules?: string, moduleName?: string) => void
    /** @type {TWebpackProgressHandler} */
    let wppHandler; {
        const shorttenProgress = (/** @type {number} */pct) => {
            renderer(formatPercentage(pct));
            pct === 1 && (console.log(), dotted = 0);
        };
        if (logFilePath !== void 0) {
            const wppLogger = lib.createLogStreamAndResolvePath(logFilePath);
            /** @type {((p: number) => void) | undefined} */
            let writeCallback;

            if (!disableRenderLine) {
                writeCallback = shorttenProgress;
            }
            wppHandler = (percentage, message, ...args) => {
                wppLogger.write(`${formatPercentage(percentage)}, ${message}: ${args}\n`, () => {
                    writeCallback && writeCallback(percentage);
                });
                percentage === 1 && wppLogger.end();
            };
        } else {
            if (disableRenderLine) {
                // DEVNOTE: 2022/02/16 ignore CI process
                wppHandler = () => {};
            } else {
                const processType = checkENV();
                if (processType === "ci") {
                    wppHandler = renderDot;
                } else {
                    if (processType === "gitpod") {
                        wppHandler = shorttenProgress;
                    } else {
                        wppHandler = isWebpackV5later()? wppHandlerV5: wppHandlerV4;
                    }
                }
            }
        }
    }

    return wppHandler;
}

module.exports = {
    createProgress,
    createProgressSync,
    createProgressObject,

    createWebpackProgressPluginHandler
};
