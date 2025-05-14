/*!
 - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  Copyright (C) 2020 jeffy-g <hirotom1107@gmail.com>
  Released under the MIT license
  https://opensource.org/licenses/mit-license.php
 - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
*/
/**
 * @file minimal implementation of semaphore (object implementation
 * @author jeffy-g <hirotom1107@gmail.com>
 * @version 1.0
 */
// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
//                                imports.
// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
import * as core from "./core";
import { Deque } from "./deque";
export type * from "./core";


// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
//                            constants, types
// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const a = core.acquire;
const r = core.release;
const aa = core.acquireWithAbort;
const ra = core.releaseWithAbort;


// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
//                       class or namespace exports.
// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/**
 * @template {core.IFlowableLock & { q: Deque<unknown>}} T
 * @param {number} capacity
 * @returns 
 */
const createBase = <T extends core.IFlowableLock & { q: Deque<unknown>}>(capacity: number) => {
    return /** @type {T} */({
        capacity,
        limit: capacity,
        q: new Deque(capacity),
        /**
         * @param {number} restriction
         */
        setRestriction(restriction: number) {
            this.limit = this.capacity = restriction;
        },
        // DEVNOTE: 2025/5/12
        // The `get pending()` accessor was removed from `createBase` to resolve an issue
        // where the `this` context in the accessor was incorrectly bound after spreading
        // the `createBase` object into the final semaphore object. This caused `this.q`
        // to be undefined or reference the wrong object, leading to unexpected behavior
        // in the `pending` property.
        //
        // By excluding `get pending()` from `createBase` and defining it directly in the
        // final object, the `this` context is correctly bound to the intended semaphore
        // instance. This ensures that `this.q` references the correct `Deque` instance.
        // get pending() {
        //     return this.q.length;
        // },
    }) as T;
};
/**
 * object implementation of `IFlowableLock`
 * 
 *   + constructs a semaphore object limited at `capacity`
 * 
 * @param {number} capacity limitation of concurrent async by `capacity`
 * @date 2020/2/7
 * @version 1.0
 */
export const create = (capacity: number) => {
    /** @type {core.TFlowableLock} */
    const base: core.TFlowableLock = createBase(capacity);
    return /** @satisfies {core.TFlowableLock} */({
        ...base,
        get pending() {
            return this.q.length;
        },
        /**
         * 
         * @param {boolean} [lazy]
         * @returns {Promise<void>}
         */
        acquire(lazy?: boolean): Promise<void> {
            return a(this, lazy);
        },
        release() {
            r(this);
        },
        /**
         * @template {any} T
         * @param {() => Promise<T>} process 
         * @param {boolean} [lazy] 
         * @returns {Promise<T>}
         */
        async flow<T>(process: () => Promise<T>, lazy?: boolean): Promise<T> {
            await a(this, lazy);
            try {
                return await process();
            } finally {
                r(this);
            }
        }
    }) satisfies core.TFlowableLock;
};
/**
 * object implementation of `TFlowableLockWithAbort`
 * 
 *   + constructs a semaphore object limited at `capacity`
 * 
 * @param {number} capacity limitation of concurrent async by `capacity`
 * @date 2025/5/12
 * @version 1.4
 */
export const createWithAbort = (capacity: number) => {
    /** @type {core.TFlowableLockWithAbort} */
    const base: core.TFlowableLockWithAbort = createBase(capacity);
    const abortListeners: core.TAbortListener[] = [];
    return /** @satisfies {core.TFlowableLockWithAbort} */({
        ...base,
        get pending() {
            return this.q.length;
        },
        /**
         * @returns {Promise<void>}
         */
        acquire(): Promise<void> {
            return aa(this);
        },
        release() {
            ra(this);
        },
        /**
         * @template {any} T
         * @param {() => Promise<T>} process 
         * @returns {Promise<T>}
         */
        async flow<T>(process: () => Promise<T>): Promise<T> {
            let result: T | undefined;
            try {
                await aa(this);
                result = await process();
                ra(this);
            } finally {
                return result as T;
            }
        },
        /**
         * @throws {AggregateError} description
         */
        abort() {
            const reason: core.IProcessAbortedError = {
                message: "Process Aborted"
            };
            abortListeners.forEach(listener => listener(reason));

            const dq = this.q;
            let resolver: core.TResolver | undefined;
            while (resolver = dq.shift()) {
                resolver.reject(reason);
            }
            this.capacity = this.limit;
        },
        /**
         * Registers an event listener for the "abort" event.
         * @param {core.TAbortListener} listener
         */
        onAbort(listener: core.TAbortListener) {
            if (!abortListeners.includes(listener)) {
                abortListeners.push(listener);
            }
        },
        /**
         * Removes an event listener for the "abort" event.
         * @param {core.TAbortListener} listener
         */
        offAbort(listener: core.TAbortListener) {
            const idx = abortListeners.findIndex(ls => listener === ls);
            if (idx !== -1) {
                /*return */abortListeners.splice(idx, 1);
            }
        }
    }) satisfies core.TFlowableLockWithAbort;
};
