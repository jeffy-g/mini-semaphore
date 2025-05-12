/*!
 - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  Copyright (C) 2023 jeffy-g <hirotom1107@gmail.com>
  Released under the MIT license
  https://opensource.org/licenses/mit-license.php
 - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
*/
// @ts-ignore avoid ts-jest semantic error
import { stressTest } from "../scripts/stress-test.mjs";
import { moduleIds } from "./constants";
// @ts-ignore avoid ts-jest semantic error
import type { TStressContext } from "../scripts/stress-test.mjs";
import type { create as FNcreate } from "../src/";


const stressContext: TStressContext = {
  max: 500,
  maxDelay: 200,
  minDelay: 20
};

moduleIds.forEach(eachModule);


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
        await stressTest(
          create(10), stressContext,
          // @ts-ignore avoid ts-jest semantic error
          (s, total) => {
            expect(s.pending).toBe(0);
            expect(total).toBe(stressContext.max);
          }
        );
      }, 180 * 1000);
    });
  });
}
