/*!
 - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  Copyright (C) 2020 jeffy-g <hirotom1107@gmail.com>
  Released under the MIT license
  https://opensource.org/licenses/mit-license.php
 - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
*/
/**
 * @file minimal implementation of semaphore (core
 * @author jeffy-g <hirotom1107@gmail.com>
 * @version 1.0
 */
// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
//                                imports.
// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
import { Deque } from "./deque";
import { THROW } from "./extras";


// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
//                            constants, types
// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/**
 * basic of simplified lock interface
 */
export interface ISimplifiedLock {
    /**
     *  acquire the process rights
     * 
     * @param {boolean} lazy Whether the privilege acquisition process is deffer. default `true`
     */
    acquire(lazy?: boolean): Promise<void>;
    /**
     *  release the pending of one
     */
    release(): void;
    /**
     * Change sharing restrictions to the value of `restriction`
     * @param {number} restriction 
     */
    setRestriction(restriction: number): void;
    /**
     * Get the number of currently pending processes
     * @type {number}
     */
    readonly pending: number;
    /**
     * limitation
     * @type {number}
     */
    limit: number;
    /**
     * capacity
     * @type {number}
     */
    capacity: number;
}
/**
 * extention of `ISimplifiedLock` interface
 */
export interface IFlowableLock extends ISimplifiedLock {
    /**
     * combination of acquire/release
     * 
     *   + acquire/release is automatic
     * 
     * @param lazy Whether the privilege acquisition process is deffer. default `true`
     */
    flow<T>(f: () => Promise<T>, lazy?: boolean): Promise<T>;
}
/**
 * internal type for `createMiniSemaphore`
 */
export type TFlowableLock<T = TVoidFunction> = IFlowableLock & {
    /**
     * pending
     */
    readonly q: Deque<T>;
};

export type TVoidFunction = () => void;

/**
 * @typedef {import("./index").TVoidFunction} TVoidFunction
 * @typedef {import("./index").Deque<TVoidFunction>} Deque
 * @typedef {import("./index").ISimplifiedLock} ISimplifiedLock
 * @typedef {import("./index").TFlowableLock} TFlowableLock
 * @typedef {import("./index").IFlowableLock} IFlowableLock
 */

// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
//                       class or namespace exports.
// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/**
 * 
 * @param {TFlowableLock} z 
 * @param {TVoidFunction} r 
 */
const box = (z: TFlowableLock, r: TVoidFunction) => {
    if (z.capacity > 0) {
        z.capacity--, r();
    }
    else {
        z.q.push(r);
    }
};
/**
 * 
 * @param {TFlowableLock} dis 
 * @param {boolean} [lazy] default: true
 * @returns {Promise<void>}
 */
export const acquire = (dis: TFlowableLock, lazy = true) => {
    return new Promise<void>(r => {
        // DEVNOTE: Deque object resize event is less likely to occur if overdue by timeout
        //   - however, this is not the case if the process takes hundreds of ms
        if (!lazy) {
            box(dis, r);
        } else {
            setTimeout(() => box(dis, r), 4);
        }
    });
};

/**
 * @param {TFlowableLock} dis
 * @returns {void}
 */
export const release = (dis: TFlowableLock) => {
    /** @type {Deque} */
    let dq: Deque<TVoidFunction>;
    if ((dq = dis.q).length) {
        // DEVNOTE: Will never reach `THROW`
        (dq.shift() || /* istanbul ignore next */THROW)();
    } else {
        dis.capacity++;
    }
    if (dis.capacity > dis.limit) {
        console.warn("inconsistent release!");
        dis.capacity = dis.limit;
    }
};
