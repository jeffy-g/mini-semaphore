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
 * @file minimal implementation of semaphore (core
 * @author jeffy-g hirotom1107@gmail.com
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
export type TFlowableLock<T = TVoidFunction> = IFlowableLock & {
    /**
     * pending
     */
    readonly q: Deque<T>;
    // readonly q: TVoidFunction[];
};

export type TVoidFunction = () => void;

// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
//                       class or namespace exports.
// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const box = (z: TFlowableLock, r: TVoidFunction) => {
    if (z.capacity > 0) {
        z.capacity--, r();
    }
    else {
        z.q.push(r);
    }
};
export const acquire = (dis: TFlowableLock, lazy = true) => {
    // return !lazy? aqtight(dis): aqlazy(dis);
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
// export const acquire = (dis: TFlowableLock, lazy = true) => {
//     // return !lazy? aqtight(dis): aqlazy(dis);
//     return new Promise<void>(resolve => {
//         // DEVNOTE: In the following code, you may not be able to get the effect of
//         //   switching with the `lazy` flag (when tight processing is required
//         const box = () => {
//             if (dis.capacity > 0) {
//                 dis.capacity--, resolve();
//             }
//             else {
//                 dis.q.push(resolve);
//             }
//         };
//         // DEVNOTE: Deque object resize event is less likely to occur if overdue by timeout
//         //   - however, this is not the case if the process takes hundreds of ms
//         if (!lazy) {
//             box();
//         } else {
//             setTimeout(box, 4);
//         }
//         // // setTimeout(() => {
//         // //     if (dis.capacity > 0) {
//         // //         dis.capacity--, resolve();
//         // //     }
//         // //     else {
//         // //         dis.q.push(resolve);
//         // //     }
//         // // }, 4);
//         // if (dis.capacity > 0) {
//         //     dis.capacity--, resolve();
//         // }
//         // else {
//         //     dis.q.push(resolve);
//         // }
//     });
// };
export const release = (dis: TFlowableLock) => {
    dis.capacity++;
    if (dis.q.length) {
        // DEVNOTE: Will never reach `THROW`
        dis.capacity -= 1, (dis.q.shift() || THROW)();
    }
    if (dis.capacity > dis.limit) {
        console.warn("inconsistent release!");
        dis.capacity = dis.limit;
    }
};
// export const flow = async <T>(dis: TFlowableLock, process: () => Promise<T>, lazy?: boolean) => {
//     await acquire(dis, lazy);
//     try {
//         return await process();
//     } finally {
//         release(dis);
//     }
// };
