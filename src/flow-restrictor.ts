/*
! - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  The MIT License (MIT)

  Copyright (C) 2020 jeffy-g hirotom1107@gmail.com

  Permission is hereby granted, free of charge, to any person obtaining a copy
  of this software and associated documentation files (the "Software"), to deal
  in the Software without restriction, including without limitation the rights
  to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
  copies of the Software, and to permit persons to whom the Software is
  furnished to do so, subject to the following conditions:

  The above copyright notice and this permission notice shall be included in
  all copies or substantial portions of the Software.

  THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
  IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
  FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
  AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
  LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
  OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
  THE SOFTWARE.
 - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
*/
/**
 * @file Utility module using `MiniSemaphore`
 * @author jeffy-g hirotom1107@gmail.com
 * @version 1.0
 */
// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
//                                imports.
// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
import * as c from "./class";
import {
    IFlowableLock
} from "./class";

// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
//                       class or namespace exports.
// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const { MiniSemaphore: MS } = c;
/**
 * 
 */
const locks: Record<string | number, IFlowableLock> = {};
/**
 * 
 * @param key 
 * @param restriction 
 * @throws when different restriction
 */
const get = (key: string | number, restriction: number) => {
    let lock = locks[key];
    if (!lock) {
        locks[key] = lock = new MS(restriction);
    }
    if (lock.limit !== restriction) {
        throw new ReferenceError(
            `Cannot get object with different restriction: key: '${key}', lock.limit: ${lock.limit} <-> restriction: ${restriction},`
        );
    }
    return lock;
};

export namespace restrictor {
    /**
     * get the semaphore associated with the value of `key`
     * 
     *   + ⚠️ The object to be retrieved with `key` must already be created with `multi` ore `one`
     * 
     * @param key 
     * @returns `IFlowableLock` instance or `undefined`
     */
    export const getLockByKey = (key: string | number) => locks[key];
    /**
     * Allocate a semaphore for each `key`, and limit the number of shares with the value of `restriction`
     * 
     * @param key number or string as tag
     * @param restriction number of process restriction
     * @param pb the process body
     */
    export async function multi<T>(key: string | number, restriction: number, pb: () => Promise<T>) {
        return get(key, restriction).flow(pb);
        // const s = get(key, restriction);
        // await s.acquire();
        // try {
        //     return await pb();
        // } finally {
        //     s.release();
        // }
    }
    /**
     * synonym of `multi(key, 1, pb)`
     * 
     *  + use case
     *    * Avoid concurrent requests to the same url
     * 
     * @param key number or string as tag
     * @param pb the process body
     */
    export async function one<T>(key: string | number, pb: () => Promise<T>) {
        return get(key, 1).flow(pb);
    }
}

// export class FlowRestrictor {
//     /**
//      * 
//      */
//     private locks: Record<string | number, IFlowableLock> = {};
//     // constructor() {}
//     /**
//      * 
//      * @param key 
//      * @param restriction 
//      */
//     private get(key: string | number, restriction: number) {
//         let lock = this.locks[key];
//         if (!lock) {
//             this.locks[key] = lock = new MS(restriction);
//         }
//         return lock;
//     }
//     /**
//      * Allocate a semaphore for each `key`, and limit the number of shares with the value of` restriction`
//      * 
//      * @param key number or string as tag
//      * @param restriction number of process restriction
//      * @param pb the process body
//      */
//     async multi<T>(key: string | number, restriction: number, pb: () => Promise<T>) {
//         return this.get(key, restriction).flow(pb);
//     }
//     /**
//      * synonym of `multi(key, 1, pb)`
//      * 
//      *  + use case
//      *    * Avoid concurrent requests to the same url
//      * 
//      * @param key number or string as tag
//      * @param pb the process body
//      */
//     async one<T>(key: string | number, pb: () => Promise<T>) {
//         return this.multi(key, 1, pb);
//     }
// }
