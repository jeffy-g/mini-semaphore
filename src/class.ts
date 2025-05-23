/*!
 - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  Copyright (C) 2020 jeffy-g <hirotom1107@gmail.com>
  Released under the MIT license
  https://opensource.org/licenses/mit-license.php
 - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
*/
/**
 * @file minimal implementation of semaphore (class implementation
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

// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
//                       class or namespace exports.
// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/**
 * #### Mini Semaphore
 * 
 *   + minimal implementation of semaphore
 *
 * @example
 * import { MiniSemaphore } from "mini-semaphore";
 * 
 * const s = new MiniSemaphore(10);
 * async function fetchTypeData(type_id) {
 *   await s.acquire();
 *   try {
 *       return fetch(`https://esi.evetech.net/latest/universe/types/${type_id}/`);
 *   } finally {
 *       s.release();
 *   }
 * }
 * 
 * //
 * // or automatic acquire/release
 * //
 * async function fetchTypeData(type_id) {
 *   return s.flow(async () => fetch(`https://esi.evetech.net/latest/universe/types/${type_id}/`));
 * }
 *
 * @date 2020/2/7
 * @version 1.0
 */
export class MiniSemaphore implements core.TFlowableLock {
    /**
     * spare capacity
     */
    capacity: number;
    /**
     * limitation
     */
    limit: number;
    /**
     * queue of Promise's `resolve`
     */
    q: Deque<core.TVoidFunction>;

    /**
     * constructs a semaphore instance limited at `capacity`
     * 
     * @param {number} capacity limitation of concurrent async by `capacity`
     */
    constructor(capacity: number) {
        /** @type {number} */
        this.limit = this.capacity = capacity;
        /** @type {Deque<() => void>} */
        this.q = new Deque(capacity);
    }
    /**
     * If there is enough capacity, execute the `resolve` immediately
     * 
     * If not, put it in a queue and wait for the currently pending process to execute `release`
     * 
     * @param {boolean=} lazy
     */
    acquire(lazy?: boolean): Promise<void> {
        return a(this, lazy);
    }
    release() {
        r(this);
    }
    /**
     * @param {number} restriction
     */
    setRestriction(restriction: number) {
        this.limit = this.capacity = restriction;
    }
    get pending() {
        return this.q.length;
    }
    /**
     * automatic acquire/release
     * 
     * @template {any} T description
     * @param {() => Promise<T>} process
     * @param {boolean=} lazy
     */
    async flow<T>(process: () => Promise<T>, lazy?: boolean): Promise<T> {
        await a(this, lazy);
        try {
            return await process();
        } finally {
            r(this);
        }
    }
}
