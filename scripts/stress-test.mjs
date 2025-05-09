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
 * @typedef {ReturnType<typeof semaphore.create>} IFlow
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
    maxDelay: 170,
    /** 
     * The minimum delay time in milliseconds. 
     * Indicates the shortest time the task  should wait.
     */
    minDelay: 5
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
    const EXPLAIN = `\n\nAfter waiting between ${context.minDelay} and ${context.maxDelay}ms, increment the element of \`toucher\` and observe how it is accessed.`;

    const restriction = s.limit;
    const promises = [];
    const toucher = Array(restriction).fill(0);
    const progress = tinyProgress.create(30, msgEmitter);

    counter = accIndex = 0;
    progress.newLine();
    for (; counter < context.max;) {
        promises[counter++] = s.flow(async () => {
            await delay(rndDelayTime(context.minDelay, context.maxDelay));
            // DEVNOTE: 2025/5/10
            // Increment the count for the current index in the `toucher` array.
            // The index is determined using a modulo operation to ensure it wraps around
            // within the bounds of the `restriction` value. This simulates access to a
            // limited number of resources in a round-robin fashion.
            toucher[accIndex++ % restriction]++;
        }, false);
        progress.renderAsync();
        await delay(1);
    }

    progress.run();
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
        semaphore.create(MAX_CONCURRENT_TASKS), DEFAULT_CONTEXT
    );
}
