/*!
 - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  Copyright (C) 2023 jeffy-g <hirotom1107@gmail.com>
  Released under the MIT license
  https://opensource.org/licenses/mit-license.php
 - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
*/
const semaphore = require("../dist/");
const tinyProgress = require("../scripts/tiny-progress");

const delay = (/** @type {number | undefined} */ ms) => new Promise(r => setTimeout(r, ms));
const rndDelayTime = (low = 10, limit = 1000) => {
  return (Math.random() * limit + low) | 0;
};
const MAX = 5_000;


/**
 * @param {ReturnType<semaphore.create>} s
 */
async function stressTest(s) {
    let counter;
    const msgEmitter = () => {
        return `Stress test | counter: ${(counter + "").padStart(3)}, pending: ${(s.pending + "").padEnd(5)}`;
    };
    const promises = [];
    const progress = tinyProgress.create(30, msgEmitter);

    counter = 0;
    s.setRestriction(17);

    progress.newLine();
    progress.run();
    for (; counter < MAX;) {
        promises[counter++] = s.flow(async () => {
            await delay(rndDelayTime(5, 500));
        }, false);
        await delay(2);
    }
    await Promise.all(promises);
    progress.stop();
    progress.deadline();
    // expect(s.pending).toBe(0);
}

// node ./scripts/stress-test.js
stressTest(
    semaphore.create(0)
);
