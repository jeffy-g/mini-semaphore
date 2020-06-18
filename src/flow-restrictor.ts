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
const { MiniSemaphore: MS } = c;

/**
 * @internal
 */
const internalLock = new MS(1);
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
const get = async (key: string | number, restriction: number) => {
    // acquire internal lock
    await internalLock.acquire(false);

    let lock = locks[key];
    if (!lock) {
        locks[key] = lock = new MS(restriction);
    }
    if (lock.limit !== restriction) {
        // release internal lock
        internalLock.release();
        throw new ReferenceError(
            `Cannot get object with different restriction: key: '${key}', lock.limit: ${lock.limit} <-> restriction: ${restriction},`
        );
    }

    // release internal lock
    internalLock.release();
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
    export const getLockByKey = async (key: string | number) => {
        // acquire internal lock
        await internalLock.acquire(false);
        const l = locks[key];
        // release internal lock
        internalLock.release();
        return l;
    };

    /**
     * Eliminate unused instances for the `timeSpan` seconds
     * 
     * @param timeSpan specify unit as seconds
     * @returns {Promise<number>} eliminated count
     * @date 2020/6/19
     */
    export const cleanup = async (timeSpan: number, debug?: true): Promise<number> => {

        // acquire internal lock
        await internalLock.acquire(false);

        const currentLocks = locks;
        const newLocks: typeof locks = Object.create(null);
        const keys = Object.keys(currentLocks);
        let eliminatedCount = 0;
        let eliminatedKeys: string[];

        !timeSpan && (timeSpan = 1); // avoid implicit bug
        timeSpan *= 1000;
        if (debug) {
            eliminatedKeys = [];
        }

        for (let i = 0, end = keys.length; i < end;) {
            const key = keys[i++];
            const s = currentLocks[key];
            if (s.last && Date.now() - s.last >= timeSpan) {
                eliminatedCount++;
                if (debug) {
                    eliminatedKeys!.push(key);
                }
                continue;
            }
            newLocks[key] = s;
        }

        // update lock registry
        locks = newLocks;

        // release internal lock
        internalLock.release();

        if (debug) {
            console.log(
                `purged: [\n${eliminatedKeys!.join(",\n")}\n]` +
                "\n" +
                `lived:  [\n${Object.keys(newLocks).join(",\n")}\n]`
            );
        }

        return eliminatedCount;
    };

    /**
     * Allocate a semaphore for each `key`, and limit the number of shares with the value of `restriction`
     * 
     * @param key number or string as tag
     * @param restriction number of process restriction
     * @param pb the process body
     */
    export async function multi<T>(key: string | number, restriction: number, pb: () => Promise<T>) {
        const s = await get(key, restriction);
        const result = s.flow(pb);
        s.last = Date.now();
        return result;
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
        return multi(key, 1, pb);
    }
}
