import * as assert from "assert";
import { performance } from "perf_hooks";
import fetch from "node-fetch";

import {
    TFlowableLock, MiniSemaphore, create,
    restrictor
} from "../src/"; // or "../dist/webpack/"

// import {
//     TFlowableLock, MiniSemaphore, create,
//     Deque,
//     restrictor
// } from "../dist/webpack/";


const WAIT = 5;
const delay = (ms: number) => new Promise<void>(r => setTimeout(r, ms));
const URL = "https://www.w3.org/2008/site/images/header-link.gif";

const basicTest = async (s: TFlowableLock, lazy: boolean) => {
    // change restriction
    s.setRestriction(2);
    const promises: Promise<void>[] = [];
    const backet: number[] = [];
    const SIZE = 100;
    let count = 0;
    // first test
    const st = performance.now();
    for (let i = 0; i < SIZE;) {
        // DEVNOTE: 
        promises[i++] = s.flow(async () => {
            const p = s.pending;
            if (p === 98) {
                const tspent = performance.now() - st;
                console.log("s.pending => %s, tspent: %s", p, tspent);
            }
            backet.push(++count);
        }, lazy);
    }
    // assert.equal(s.pending, 98);
    console.log("basicTest::[after-for(lazy: %s)] s.pending => %s", lazy, s.pending);
    count += 10;
    // At this point, the count value by the `flow` process should not be done yet
    expect(count).toEqual(10);
    expect(s.pending).toEqual(lazy? 0: 98);
    expect(backet.length).toEqual(0);

    await Promise.all(promises);

    expect(backet.length).toEqual(SIZE);

    // second test
    let running = 0;
    let ran = 0;
    const task = async () => {
        assert(running <= 1);
        running++;
        await delay(WAIT);
        assert(running <= 2);
        running--;
        ran++;
        return true;
    };
    const truthies = await Promise.all([1,2,3,4,5].map(() => s.flow(task)));
    assert(truthies.every(b => b === true));
    assert.equal(ran, 5);
};

type TSignal = (arg?: any) => void;

// let rqResult: string[];
describe("concurrency", function() {
    describe("mini semaphore", function() {

        it("limits concurrency (object)", async function() {
            // tight acquire - Note the value of "s.pending"
            await basicTest(create(0) as TFlowableLock, false);
        });

        it("limits concurrency (class)", async function() {
            // lazy acquire - Note the value of "s.pending"
            await basicTest(new MiniSemaphore(100), true);
        });

        it("acquire.then.release and flow test", async function() {
            const s = new MiniSemaphore(10);
            const SIZE = 1e3;
            const array = Array<any>(SIZE).fill(1);
            let total = 0;
            const promises: Promise<any>[] = [];
            // acquire.then.release
            for (let i = 0, end = array.length; i < end;) {
                const n = array[i];
                promises[i++] =  s.acquire().then(() => total += n).then(() => s.release());
            }
            await Promise.all(promises);
            assert.equal(total, SIZE);
            // flow
            promises.length = 0;
            for (let i = 0, end = array.length; i < end;) {
                const n = array[i];
                promises[i++] = s.flow(async () => total += n);
            }
            await Promise.all(promises);
            assert.equal(total, SIZE << 1);
        });

        it("use recovers from thrown exception", async function() {
            const s = new MiniSemaphore(2);
            let running = 0;
            let ran = 0;
            let erred = 0;
            let e: Error;
            const task = (i: number) => async () => {
                assert(running <= 1);
                running++;
                await delay(WAIT);
                assert(running <= 2);
                running--;
                if (i === 2) {
                    throw new Error("bogus");
                }
                ran++;
            };

            const start = performance.now();
            await s.flow(task(1));
            try {
                await s.flow(task(2));
            } catch (err) {
                erred++;
                e = err;
            }
            await s.flow(task(3));
            await s.flow(task(4));
            await s.flow(task(5));
            const tspent = performance.now() - start;
            console.log("tspen:", tspent);

            assert.equal(ran, 4);
            assert.equal(erred, 1);

            assert.equal(e!.message, "bogus");
            assert.equal(s.capacity, 2);
        });

        it("Executing catch individually with `flow` method degrades performance", async function() {
            // this.timeout(45);
            const s = new MiniSemaphore(2);
            let running = 0;
            let ran = 0;
            let e: string | Error | undefined;
            const task = (i: number) => async () => {
                // console.log(i);
                assert(running <= 1);
                running++;
                await delay(5);
                assert(running <= 2);
                running--;
                if (i === 2) {
                    throw new Error("2!");
                }
                ran++;
            };

            const start = performance.now();
            await Promise.all(
                [1,2,3,4,5].map(
                    i => s.flow(task(i)).catch(reason => e = reason)
                )
            ).catch(() => e = "apple pie");
            const tspent = performance.now() - start;
            // console.log("tspen:", tspent);

            await delay((tspent | 0) + 10);
            if (e instanceof Error) {
                assert.equal(e.message, "2!");
            }
            else if (typeof e === "string") {
                assert.equal(e, "apple pie");
            }

            // expect(foo).to.be.a('string');
            assert.equal(ran, 4);
            assert.equal(s.capacity, 2);
            console.log("which catched?:", e);
        });

        it("Illegal call to `release` method (The warning message 'inconsistent release!' is logged, but the object continues to work without breaking)", async function() {
            const s = new MiniSemaphore(10);
            await s.acquire();
            await delay(WAIT);
            s.release();
            s.release();
            s.release();
            assert.equal(s.capacity, 10);
        });

        it("flow restrictor test (with http request)", async function() {
            const SIZE = 10;
            const array = [] as string[];
            const promises: Promise<void>[] = [];
            let index = 0;
            const pbody = async (suffix: string) => {
                const ret = await fetch(URL).then(res => res.text());
                // ret.substring(0, 6) -> "GIF89a"
                array.push(ret[0] + suffix + index++);
            };
            // acquire.then.release
            for (let i = 0; i < SIZE;) {
                promises[i] = restrictor.multi("ping", 2, async () => {
                    await pbody("-");
                });
                // DEVNOTE: This function returns only created objects
                const pinger = restrictor.getLockByKey("ping");
                promises[i + 1] = pinger.flow( async () => {
                    await delay(20);
                    await pbody("-");
                });
                promises[i + 2] = restrictor.one("ping2", async () => {
                    await pbody("2-");
                });
                i += 3;
            }
            await Promise.all(promises);
            assert.equal(array.length % 3, 0);
            array.forEach((token, i) => {
                expect(+token.split("-")[1]).toBe(i);
                expect(token).toMatch(/G2?-\d+/);
                // expect(token.split("-")[1]).toMatch(/\d+/);
            });
            console.log("array: ", array);

            restrictor.one("keep", () => Promise.resolve());
            expect(
                restrictor.cleanup(1, true)
            ).not.toBe(0);
        });
        // it.each(array)("result tokens", (token) => {
        //     expect(token.split("-")[1]).toMatch(/\d+/);
        // });

        it("flow restrictor test (Cannot get lock object with different restriction, with http request)", async function() {

            let text: string | undefined;
            try {
                await restrictor.one("ping3", async () => {
                    text = await fetch(URL).then(res => res.text());
                });
            } catch (e) {
                console.warn(e);
            }
            // @ts-ignore 
            assert.equal(text[0], "G");    // gif
            // assert.equal(text[2], "N"); // png

            // getLockByKey
            text = "";
            let error: Error | null = null;
            try {
                const s = restrictor.getLockByKey("pping");
                await s.flow(async () => {
                    text = await fetch(URL).then(res => res.text());
                });
            } catch (e) {
                console.warn(e);
                error = e;
            }
            assert(error instanceof TypeError);
            assert.equal(text, "");

            // different restriction
            error = null;
            try {
                await restrictor.multi("ping3", 7, async () => {
                    text = await fetch(URL).then(res => res.text());
                });
            } catch (e) {
                console.warn(e);
                error = e;
            }
            assert.equal(text, "");
            assert(error instanceof ReferenceError);
        });

    });

    describe("single restriction (mutex", function() {
        it("tasks do not overlap", function(done: TSignal) {
            const m = new MiniSemaphore(1);
            let task1running = false;
            let task2running = false;
            let task1ran = false;
            let task2ran = false;
            Promise.all([
                m.acquire().then(() => {
                    task1running = true;
                    task1ran = true;
                    return delay(WAIT).then(() => {
                        assert(!task2running);
                        task1running = false;
                        m.release();
                    });
                }),
                m.acquire().then(() => {
                    assert(!task1running);
                    task2running = true;
                    task2ran = true;
                    return delay(WAIT).then(() => {
                        task2running = false;
                        m.release();
                    });
                })
            ])
            .then(() => {
                assert(!task1running);
                assert(!task2running);
                assert(task1ran);
                assert(task2ran);
                done();
            })
            .catch(done);
        });
        it("double lock deadlocks", function(done: TSignal) {
            const m = create(1);
            m.acquire()
            .then(() => m.acquire())
            .then(() => assert(false))
            .catch(done);
            delay(WAIT)
            .then(done);
        });
        it("double release ok", function(done: TSignal) {
            const m = create(1);
            m.acquire().
                then(() => m.release()).
                then(() => m.release());
            m.acquire().
                then(() => done());
        });
    });

});
