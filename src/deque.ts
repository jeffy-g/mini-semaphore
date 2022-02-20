
/**
 * arrayMove
 * 
 * @param src 
 * @param si 
 * @param dst 
 * @param di 
 * @param len 
 */
const am = (
    src: any[], si: number,
    dst: any[], di: number,
    len: number
) => {
    /* istanbul ignore next */
    for (let j = 0; j < len; ++j) {
        dst[j + di] = src[j + si];
        src[j + si] = void 0;
    }
};
/**
 * pow2AtLeast
 * @param n 
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
 * @param n 
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
 */
export class Deque<T extends any> {

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
    constructor(ic?: number) {
        this._c = gc(ic);
        this._l = 0;
        this._f = 0;
        this._a = [];
    }

    /**
     * @param s subject
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
        this._a[f] = void 0 as unknown as T;
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
 * @param n expected capacity
 */
const rt = <T>(dis: Deque<T>, n: number) => {
    // old capacity
    const oc = dis._c;
    dis._c = n;
    const f = dis._f;
    const l = dis._l;
    if (f + l > oc) {
        // move items count
        /* istanbul ignore next */
        const mc = (f + l) & (oc - 1);
        /* istanbul ignore next */
        am(dis._a, 0, dis._a, oc, mc);
    }
};
