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
 * @typedef {semaphore.IFlowableLock} IFlow
 * @typedef TStressContext stress test parameters
 * @prop {number} max task count
 * @prop {number} maxDelay wait high value
 * @prop {number} minDelay wait low value
 */

const MAX_CONCURRENT_TASKS = 10;
/**
 * Default configuration context for the `stressTest`.
 * 
 * @type {TStressContext}
 */
const DEFAULT_CONTEXT = {
    /** 
     * The maximum value used within the `stressTest`. 
     * This can represent various limits depending on the scenario.
     */
    max: 1_000,
    /** 
     * The maximum delay time in milliseconds. 
     * Indicates the longest time the task should wait.
     */
    maxDelay: 250,
    /** 
     * The minimum delay time in milliseconds. 
     * Indicates the shortest time the task  should wait.
     */
    minDelay: 10
};

/** @type {(ms: number) => Promise<void>} */
const delay = (ms) => new Promise(r => setTimeout(r, ms));
/* ctt
const rndDelayTime = (low = 10, limit = 1000) => {
    return (Math.random() * limit + low) | 0;
};
/*/
const rndDelayTime = (low = 10, limit = 170) => {
    return Math.max(Math.random() * limit | 0, low);
};
//*/


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
        return `Stress test | executed task: ${String(counter).padStart(3)}, pending task: ${String(s.pending).padEnd(5)}`;
    };
    const EXPLAIN = `\n\nAfter waiting between ${context.minDelay} and ${context.maxDelay}ms, increment the element of \`accessCounts\` and observe how it is accessed.`;

    const restriction = s.limit;
    const promises = [];
    const accessCounts = Array(restriction).fill(0);
    const progress = tinyProgress.create(30, msgEmitter);

    counter = accIndex = 0;
    progress.newLine();
    for (; counter < context.max;) {
        promises[counter++] = s.flow(async () => {
            await delay(rndDelayTime(context.minDelay, context.maxDelay));
            // DEVNOTE: 2025/5/10
            // Increment the count for the current index in the `accessCounts` array.
            // The index is determined using a modulo operation to ensure it wraps around
            // within the bounds of the `restriction` value. This simulates access to a
            // limited number of resources in a round-robin fashion.
            accessCounts[accIndex++ % restriction]++;
        }, false);
        progress.renderAsync();
        await delay(1);
    }

    progress.run();
    await Promise.all(promises);

    progress.stop();
    progress.deadline();

    const total = accessCounts.reduce((sum, element) => sum + element, 0);
    console.log(`${EXPLAIN}\n[${accessCounts}] => total: ${total}`);

    cb && cb(s, total);
}

if (tinargs().x) {
    // node ./scripts/stress-test.mjs -x
    stressTest(
        semaphore.createWithAbort(MAX_CONCURRENT_TASKS), DEFAULT_CONTEXT
    );
}
