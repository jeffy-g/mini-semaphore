export {
    TVoidFunction,
    IFlowableLock, ISimplifiedLock, TFlowableLock
} from "./core";
export { MiniSemaphore } from "./class";
export { create } from "./object";
import * as fr from "./flow-restrictor";
export const restrictor = fr;
// DEVNOTE: export * as ns Syntax - since ts v3.8
// export * as restrictor from "./flow-restrictor";
