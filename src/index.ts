export {
    TVoidFunction,
    IFlowableLock, ISimplifiedLock, TFlowableLock
} from "./core";
export { MiniSemaphore } from "./class";
export { create } from "./object";
export { Deque } from "./deque";
export { restrictor } from "./flow-restrictor";
// DEVNOTE: export * as ns Syntax - since ts v3.8
// export * as restrictor from "./flow-restrictor";
