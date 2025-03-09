
/**
 * arrayMove
 * 
 * @param {unknown[]} src
 * @param {number} si source index
 * @param {unknown[]} dst
 * @param {number} di dest index
 * @param {number} len move count
 */
const am = /* istanbul ignore next */(
    src: any[], si: number,
    dst: any[], di: number,
    len: number
) => {
    for (let j = 0; j < len; ++j) {
        dst[j + di] = src[j + si];
        src[j + si] = void 0;
    }
};
/**
 * pow2AtLeast
 * @param {number} n 
 */
const p2l = (n: number) => {
    n = n >>> 0;
    n = n - 1;
    n = n | (n >> 1);
    n = n | (n >> 2);
    n = n | (n >> 4);
    n = n | (n >> 8);
    n = n | (n >> 16);
    return n + 1;
};
/**
 * getCapacity
 * @param {number=} n 
 */
const gc = (n?: number) => {
    // @ts-ignore typescript cannot allow (undefined | 0) expression
    return p2l(Math.min(Math.max(16, n | 0), 1073741824));
};

/**
 * ### Implementation restricted to FIFO
 * 
 * this class is based on https://github.com/petkaantonov/deque/blob/master/js/deque.js  
 * Released under the MIT License: https://github.com/petkaantonov/deque/blob/master/LICENSE
 * 
 * @template {any} T
 */
export class Deque<T extends any> {

    _c: number;
    _l: number;
    _f: number;
    _a: T[];

    /**
     * default capacity `16`
     * @param {number=} ic initial capacity
     */
    constructor(ic?: number) {
        /**
         * capacity
         * @type {number}
         */
        this._c = gc(ic);
        /**
         * current length (size
         * @type {number}
         */
        this._l = 0;
        /**
         * current front position
         * @type {number}
         */
        this._f = 0;
        /**
         * @type {T[]}
         */
        this._a = [];
    }

    /**
     * @param {T} s subject
     */
    push(s: T): void {
        const l = this._l;

        /* https://coderwall.com/p/zbc2zw/the-comment-toggle-trick
        cc(this, l + 1);
        /*/
        if (this._c < l + 1) {
            rt(this, gc(this._c * 1.5 + 16));
        }
        //*/
        const i = (this._f + l) & (this._c - 1);
        this._a[i] = s;
        this._l = l + 1;
        // return l + 1;
    }

    // pop() {
    //     const length = this._length;
    //     if (length === 0) {
    //         return void 0;
    //     }
    //     const i = (this._front + length - 1) & (this._capacity - 1);
    //     const ret = this.arr[i];
    //     this.arr[i] = void 0;
    //     this._length = length - 1;

    //     return ret;
    // }

    shift() {
        const l = this._l;
        /* istanbul ignore if */
        if (l === 0) {
            return void 0;
        }
        const f = this._f;
        const r = this._a[f];
        this._a[f] = /** @type {T} */(void 0) as T;
        this._f = (f + 1) & (this._c - 1);
        this._l = l - 1;

        return r;
    }

    // // this._a.forEach(n => n && console.log(n));
    // /* istanbul ignore next */
    // clear() {
    //     const l = this._l;
    //     const f = this._f;
    //     const c = this._c;
    //     const a = this._a;
    //     for (let j = 0; j < l; ++j) {
    //         a[(f + j) & (c - 1)] = void 0 as unknown as T;
    //     }
    //     this._l = 0;
    //     this._f = 0;
    // }

    get length(): number {
        return this._l;
    }
}

// export namespace Deque {
//     export const MAX_CAPACITY = (1 << 30) | 0;
//     export const MIN_CAPACITY = 16;
// }

// /**
//  * check capacity
//  * 
//  * @param size 
//  */
// const cc = <T>(dis: Deque<T>, size: number) => {
//     if (dis._c < size) {
//         rt(dis, gc(dis._c * 1.5 + 16));
//     }
// };
/**
 * resize to
 * 
 * @template {any} T
 * @param {Deque<T>} dis
 * @param {number} n expected capacity
 */
const rt = <T>(dis: Deque<T>, n: number) => {
    // old capacity
    const oc = dis._c;
    dis._c = n;
    //* ctt
    const lastIndex = dis._f + dis._l;
    /* istanbul ignore next */
    if (lastIndex > oc) {
        // move items count
        const mc = (lastIndex) & (oc - 1);
        am(dis._a, 0, dis._a, oc, mc);
    }
    /*/
    const f = dis._f;
    const l = dis._l;
    // istanbul ignore next
    if (f + l > oc) {
        // move items count
        const mc = (f + l) & (oc - 1);
        am(dis._a, 0, dis._a, oc, mc);
    }
    //*/
};
