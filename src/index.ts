/*!
 - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  Copyright (C) 2020 jeffy-g <hirotom1107@gmail.com>
  Released under the MIT license
  https://opensource.org/licenses/mit-license.php
 - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
*/

export type {
    TVoidFunction,
    IFlowableLock, ISimplifiedLock, TFlowableLock
} from "./core";
export { MiniSemaphore } from "./class";
export { create } from "./object";
export { Deque } from "./deque";
export { restrictor } from "./flow-restrictor";
export const version = "v1.3.11";
// DEVNOTE: export * as ns Syntax - since ts v3.8
// export * as restrictor from "./flow-restrictor";
