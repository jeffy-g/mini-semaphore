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
 * object implementation of `IFlowableLock`
 * 
 *   + constructs a semaphore object limited at `capacity`
 * 
 * @param {number} capacity limitation of concurrent async by `capacity`
 * @date 2020/2/7
 * @version 1.0
 */
export const create = (capacity: number) => {
    return /** @satisfies {core.TFlowableLock} */({
        capacity,
        limit: capacity,
        q: new Deque(capacity),
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
         * @param {number} restriction
         */
        setRestriction(restriction: number) {
            this.limit = this.capacity = restriction;
        },
        get pending() {
            return this.q.length;
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
    return /** @satisfies {core.TFlowableLockWithAbort} */({
        capacity,
        limit: capacity,
        q: new Deque(capacity),
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
         * @param {number} restriction
         */
        setRestriction(restriction: number) {
            this.limit = this.capacity = restriction;
        },
        get pending() {
            return this.q.length;
        },
        /**
         * @template {any} T
         * @param {() => Promise<T>} process 
         * @returns {Promise<T>}
         */
        async flow<T>(process: () => Promise<T>): Promise<T> {
            await aa(this);
            try {
                return await process();
            } finally {
                ra(this);
            }
        },
        /**
         * @throws {AggregateError} description
         */
        abort() {
            const dq = this.q;
            let resolver: core.TResolver | undefined;
            const reason: core.IProcessAbortedError = {
                message: "Process Aborted"
            };
            while (resolver = dq.shift()) {
                resolver.reject(reason);
            }
            this.capacity = this.limit;
        }
    }) satisfies core.TFlowableLockWithAbort;
};
