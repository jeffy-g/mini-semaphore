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
export {
    TVoidFunction, IFlowableLock, ISimplifiedLock,
} from "./core";


// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
//                            constants, types
// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const a = core.acquire;
const r = core.release;


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
