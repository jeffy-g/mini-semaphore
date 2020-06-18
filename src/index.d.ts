/**
 * ### Implementation restricted to FIFO
 *
 * this class is based on https://github.com/petkaantonov/deque/blob/master/js/deque.js
 * Released under the MIT License: https://github.com/petkaantonov/deque/blob/master/LICENSE
 */
export declare class Deque<T extends any> {
    /**
     * capacity
     * @type {number}
     */
    _c: number;
    /**
     * current length (size
     * @type {number}
     */
    _l: number;
    /**
     * current front position
     * @type {number}
     */
    _f: number;
    /**
     * @type {T[]}
     */
    _a: T[];
    /**
     * default capacity `16`
     * @param ic initial capacity
     */
    constructor(ic?: number);
    /**
     * @param s subject
     */
    push(s: T): number;
    shift(): T | undefined;
    clear(): void;
    get length(): number;
}

/**
 * basic of simplified lock interface
 */
export interface ISimplifiedLock {
    /**
     *  acquire the process rights
     *
     * @param lazy Whether the privilege acquisition process is deffer. default `true`
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
     */
    limit: number;
    /**
     * capacity
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
export declare type TFlowableLock<T = TVoidFunction> = IFlowableLock & {
    /**
     * pending
     */
    readonly q: Deque<T>;
};
export declare type TVoidFunction = () => void;
export declare const acquire: (dis: TFlowableLock<TVoidFunction>, lazy?: boolean) => Promise<void>;
export declare const release: (dis: TFlowableLock<TVoidFunction>) => void;


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
export declare class MiniSemaphore implements TFlowableLock {
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
    q: Deque<TVoidFunction>;
    /**
     * constructs a semaphore instance limited at `capacity`
     *
     * @param capacity limitation of concurrent async by `capacity`
     */
    constructor(capacity: number);
    /**
     * If there is enough capacity, execute the `resolve` immediately
     *
     * If not, put it in a queue and wait for the currently pending process to execute `release`
     */
    acquire(lazy?: boolean): Promise<void>;
    release(): void;
    setRestriction(restriction: number): void;
    get pending(): number;
    /**
     * automatic acquire/release
     * @param process
     */
    flow<T>(process: () => Promise<T>, lazy?: boolean): Promise<T>;
}

/**
 * object implementation of `IFlowableLock`
 *
 *   + constructs a semaphore object limited at `capacity`
 *
 * @param capacity limitation of concurrent async by `capacity`
 * @date 2020/2/7
 * @version 1.0
 */
export declare const create: (capacity: number) => IFlowableLock;

declare namespace fr {
    /**
     * Eliminate unused instances for the `timeSpan` seconds
     * 
     * @param timeSpan specify unit as seconds
     * @returns {number} purged count
     * @todo restriction by mini semaphore
     */
    const cleanup: (timeSpan: number, debug?: true | undefined) => Promise<number>;
    /**
     * get the semaphore associated with the value of `key`
     *
     *   + ⚠️ The object to be retrieved with `key` must already be created with `multi` ore `one`
     *
     * @param key
     * @returns `IFlowableLock` instance or `undefined`
     */
    export const getLockByKey: (key: string | number) => Promise<IFlowableLock>;
    /**
     * Allocate a semaphore for each `key`, and limit the number of shares with the value of `restriction`
     *
     * @param key number or string as tag
     * @param restriction number of process restriction
     * @param pb the process body
     */
    export function multi<T>(key: string | number, restriction: number, pb: () => Promise<T>): Promise<T>;
    /**
     * synonym of `multi(key, 1, pb)`
     *
     *  + use case
     *    * Avoid concurrent requests to the same url
     *
     * @param key number or string as tag
     * @param pb the process body
     */
    export function one<T>(key: string | number, pb: () => Promise<T>): Promise<T>;
}
export declare const restrictor: typeof fr;
