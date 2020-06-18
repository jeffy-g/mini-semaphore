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
 * @author jeffy-g <hirotom1107@gmail.com>
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
//                            constants, types
// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/**
 * @internal
 * @date 2020/6/18
 */
interface IFlowableLockWithTimeStamp extends IFlowableLock {
    last?: number;
}


// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
//                       class or namespace exports.
// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const { MiniSemaphore: MS } = c;
/**
 * 
 */
let locks: Record<string | number, IFlowableLockWithTimeStamp> = Object.create(null);
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
     * Eliminate unused instances for the `timeSpan` seconds
     * 
     * @param timeSpan specify unit as seconds
     * @returns {number} purged count
     * @todo restriction by mini semaphore
     */
    export const cleanup = (timeSpan: number, debug?: true): number => {
        const currentLocks = locks;
        const newLocks: typeof locks = Object.create(null);
        const keys = Object.keys(currentLocks);
        let purgeCount = 0;
        let purgedKeys: string[];

        timeSpan *= 1000;
        if (debug) {
            purgedKeys = [];
        }

        for (let i = 0, end = keys.length; i < end;) {
            const key = keys[i++];
            const s = currentLocks[key];
            if (s.last && Date.now() - s.last >= timeSpan) {
                purgeCount++;
                if (debug) {
                    purgedKeys!.push(key);
                }
                continue;
            }
            newLocks[key] = s;
        }

        // update lock registry
        locks = newLocks;

        if (debug) {
            console.log(
                `purged: [\n${purgedKeys!.join(",\n")}\n]` +
                "\n" +
                `lived:  [\n${Object.keys(newLocks).join(",\n")}\n]`
            );
        }

        return purgeCount;
    };

    /**
     * @param key 
     * @param restriction 
     * @param pb 
     */
    const fire = async <T>(key: string | number, restriction: number, pb: () => Promise<T>) => {
        const s = get(key, restriction);
        const result = s.flow(pb);
        s.last = Date.now();
        return result;
    };
    /**
     * Allocate a semaphore for each `key`, and limit the number of shares with the value of `restriction`
     * 
     * @param key number or string as tag
     * @param restriction number of process restriction
     * @param pb the process body
     */
    export async function multi<T>(key: string | number, restriction: number, pb: () => Promise<T>) {
        // return get(key, restriction).flow(pb);
        return fire(key, restriction, pb);
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
        // return get(key, 1).flow(pb);
        return fire(key, 1, pb);
    }
}
