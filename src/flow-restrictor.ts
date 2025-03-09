/*!
 - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  Copyright (C) 2020 jeffy-g <hirotom1107@gmail.com>
  Released under the MIT license
  https://opensource.org/licenses/mit-license.php
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
type TFlowableLockWithTimeStamp = IFlowableLock & {
    last?: number;
};
type TLockRecordKey = string | number;

/**
 * @typedef {import("./index").IFlowableLock & { last?: number }} TFlowableLockWithTimeStamp
 * @typedef {string | number} TLockRecordKey
 */


// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
//                       class or namespace exports.
// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/**
 * Flow Restriction
 */
export namespace restrictor {

    const { MiniSemaphore: MS } = c;
    /**
     * @internal
     */
    const internalLock = new MS(1);
    /**
     * @type {Record<TLockRecordKey, TFlowableLockWithTimeStamp>}
     */
    let locks: Record<TLockRecordKey, TFlowableLockWithTimeStamp> = Object.create(null);
    /**
     * 
     * @param {TLockRecordKey} key 
     * @param {number} restriction 
     * @throws when different restriction
     */
    const get = async (key: TLockRecordKey, restriction: number) => {
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

    /**
     * get the semaphore associated with the value of `key`
     * 
     *   + ⚠️ The object to be retrieved with `key` must already be created with `multi` ore `one`
     * 
     * @param {TLockRecordKey} key 
     * @returns `IFlowableLock` instance or `undefined`
     */
    export const getLockByKey = async (key: TLockRecordKey) => {
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
     * @param {number} timeSpan specify unit as seconds
     * @param {true} [debug] enable debug
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
        /** @type {string[]} */
        let eliminatedKeys: string[];

        !timeSpan && /* istanbul ignore next */(timeSpan = 1); // avoid implicit bug
        timeSpan *= 1000;
        if (debug) {
            // @ts-ignore
            eliminatedKeys = [];
        }

        for (let i = 0, end = keys.length; i < end;) {
            const key = keys[i++];
            const s = currentLocks[key];
            if (s.last && Date.now() - s.last >= timeSpan) {
                eliminatedCount++;
                if (debug) {
                    // @ts-ignore
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
                // @ts-ignore
                `eliminated: [\n${eliminatedKeys!.join(",\n")}\n]` +
                "\n" +
                `lived: [\n${Object.keys(newLocks).join(",\n")}\n]`
            );
        }

        return eliminatedCount;
    };

    /**
     * Allocate a semaphore for each `key`, and limit the number of shares with the value of `restriction`
     * 
     * @template {any} T
     * @param {TLockRecordKey} key number or string as tag
     * @param {number} restriction number of process restriction
     * @param {() => Promise<T>} pb the process body
     */
    export async function multi<T>(key: TLockRecordKey, restriction: number, pb: () => Promise<T>) {
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
     * @template {any} T
     * @param {TLockRecordKey} key number or string as tag
     * @param {() => Promise<T>} pb the process body
     */
    export async function one<T>(key: TLockRecordKey, pb: () => Promise<T>) {
        return multi(key, 1, pb);
    }
}
