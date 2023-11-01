/*!
 - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  Copyright (C) 2023 jeffy-g <hirotom1107@gmail.com>
  Released under the MIT license
  https://opensource.org/licenses/mit-license.php
 - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
*/
import tinyProgress from "../scripts/tiny-progress";

import type {
  TFlowableLock,
  create as FNcreate,
} from "../src/";


const MAX = 500;
const delay = (ms: number) => new Promise<void>(r => setTimeout(r, ms));
const rndDelayTime = (low = 10, limit = 1000) => {
  return (Math.random() * limit + low) | 0;
};

async function stressTest(s: TFlowableLock) {
  let counter!: number;
  const msgEmitter = () => {
    return `Stress test | executed task: ${(counter + "").padStart(3)}, pending task: ${(s.pending + "").padEnd(5)}`;
  };

  const promises: Promise<void>[] = [];
  const progress = tinyProgress.create(30, msgEmitter);

  counter = 0;
  s.setRestriction(12);

  progress.newLine();
  progress.run();
  for (; counter < MAX;) {
    promises[counter++] = s.flow(async () => {
        await delay(rndDelayTime(5, 250));
    }, false);
    await delay(1);
  }
  await Promise.all(promises);
  progress.stop();
  progress.deadline();

  expect(s.pending).toBe(0);
}


eachModule("../src/");
eachModule("../dist/");
eachModule("../dist/umd/");
eachModule("../dist/webpack/");
eachModule("../dist/esm/index.mjs");
eachModule("../dist/webpack-esm/index.mjs");

function eachModule(path: string) {

  let create: typeof FNcreate;
  beforeAll(async () => {
    const mod = await import(path);
    ({
      create,
      // DEVNOTE: 2023/11/01 - `cjs` module are wrap to `default`
    } = mod.default || mod);
  });

  describe(`concurrency: module=[${path}]`, function () {
    describe("mini semaphore", function () {
      it("mini-semaphore stress test\n\
      execute many tasks that require processing time at random times(in ms) to check reliability. (object)", async () => {
        // tight acquire - Note the value of "s.pending"
        await stressTest(create(0) as TFlowableLock);
      }, 180 * 1000);
    });
  });
}
