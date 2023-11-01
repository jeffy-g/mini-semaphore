/*!
 - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  Copyright (C) 2023 jeffy-g <hirotom1107@gmail.com>
  Released under the MIT license
  https://opensource.org/licenses/mit-license.php
 - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
*/
/** [usage]
> node -i
let t = require("./extras/progress-sample");
let p = t.create();
p.run();
p.stop();
p = t.create();
p.run();
p.stop();
*/

const p = require("./tiny/progress/");
const rndSpinners = require("./tiny/progress/rnd-spinner");

let fired = 0;
let pending = 0;

/** @type {() => { fired: number; pending: number; errors?: number; }} */
const cb = () => {
    return {
        fired: ++fired, pending: ++pending
    };
};

let tag = "progress test";

/**
 * progress callback
 * @type {() => string}
 */
const pcb = () => {
    if (cb) {
        const { fired, pending, errors } = cb();
        return `${tag} | error: ${(errors + "").padEnd(3)} | send: ${(fired + "").padStart(3)}, pending: ${(pending + "").padEnd(5)}`;
    } else {
        // error
        return "- - error - -";
    }
};

/** @type {ReturnType<typeof p.createProgressObject>} */
let progress;

/**
 * @param {number} [fps]
 * @param {() => string} [messageEmiter]
 */
const create = (fps = 30, messageEmiter) => {
    const spinner = rndSpinners.getRandomFrame();
    // const pong = rndSpinners.pong;
    !messageEmiter && (messageEmiter = pcb);
    progress = p.createProgressObject(
        spinner.frames, { fmt: "{tick} - {frameName} - {msg}", payload: { frameName: spinner.name }}, messageEmiter
    );
    progress.setFPS(fps);
    return progress;
};

module.exports = {
    create
};
