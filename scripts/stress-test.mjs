/*!
 - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  Copyright (C) 2023 jeffy-g <hirotom1107@gmail.com>
  Released under the MIT license
  https://opensource.org/licenses/mit-license.php
 - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
*/
import * as semaphore from "../dist/esm/index.mjs";
import * as tinyProgress from "./tiny-progress.js";
import tinargs from "tin-args";


/**
 * @typedef {ReturnType<typeof semaphore.create>} IFlow ok
 * @typedef {object} TStressContext stress test parameters
 * @prop {number} max task count
 * @prop {number} wait_low wait low value
 * @prop {number} wait_high wait high value
 */

const RESTRICT = 10;
/** @type {TStressContext} */
const DEFAULT_CONTEXT = {
    max: 1_000,
    wait_high: 200,
    wait_low: 5
};

/** @type {(ms: number) => Promise<void>} */
const delay = (ms) => new Promise(r => setTimeout(r, ms));
const rndDelayTime = (low = 10, limit = 1000) => {
    return (Math.random() * limit + low) | 0;
};


/**
 * @param {IFlow} s
 * @param {TStressContext} context see {@link TStressContext}
 * @param {(s: IFlow, total: number) => void} [cb] report stress test result
 */
export async function stressTest(s, context, cb) {

    /** @type {number} */
    let counter;
    /** @type {number} */
    let accIndex;
    const msgEmitter = () => {
        return `Stress test | executed task: ${(counter + "").padStart(3)}, pending task: ${(s.pending + "").padEnd(5)}`;
    };
    const EXPLAIN = `After waiting between ${context.wait_low} and ${context.wait_high}ms, increment the element of \`toucher\` and observe how it is accessed.`;

    const restriction = s.limit;
    const promises = [];
    const toucher = Array(restriction).fill(0);
    const progress = tinyProgress.create(30, msgEmitter);

    counter = accIndex = 0;
    progress.newLine();
    // progress.run();
    for (; counter < context.max;) {
        promises[counter++] = s.flow(async () => {
            await delay(rndDelayTime(context.wait_low, context.wait_high));
            // DEVNOTE: 2024/12/10 - 
            //   
            toucher[accIndex++ % restriction]++;
        }, false);
        progress.renderAsync();
        await delay(1);
    }

    await Promise.all(promises);

    progress.stop();
    progress.deadline();

    const total = toucher.reduce((sum, element) => sum + element, 0);
    console.log(`${EXPLAIN}\n[${toucher}] => total: ${total}`);

    cb && cb(s, total);
}

if (tinargs().x) {
    // node ./scripts/stress-test.mjs -x
    stressTest(
        semaphore.create(RESTRICT), DEFAULT_CONTEXT
    );
}
