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
 * @file minimal implementation of semaphore (object implementation
 * @author jeffy-g hirotom1107@gmail.com
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
// const f = core.flow;

// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
//                       class or namespace exports.
// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/**
 * object implementation of `IFlowableLock`
 * 
 *   + constructs a semaphore object limited at `capacity`
 * 
 * @param capacity limitation of concurrent async by `capacity`
 * @date 2020/2/7
 * @version 1.0
 */
export const create = (capacity: number) => {
    return {
        capacity,
        limit: capacity,
        q: new Deque(capacity),
        acquire(lazy?: boolean) {
            return a(this, lazy);
        },
        release() {
            r(this);
        },
        setRestriction(restriction: number) {
            this.limit = this.capacity = restriction;
        },
        get pending() {
            return this.q.length;
        },
        async flow<T>(process: () => Promise<T>, lazy?: boolean): Promise<T> {
            // return f(this, process, lazy);
            await a(this, lazy);
            try {
                return await process();
            } finally {
                r(this);
            }
            // await this.acquire();
            // try {
            //     // DEVNOTE: Since we use the `await` keyword here,
            //     //  - we simply return a Promise object in the process function on the user side
            //     return await process();
            // } finally {
            //     this.release();
            // }
        }
    } as core.TFlowableLock as core.IFlowableLock;
};
