/*!
 - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  Copyright (C) 2020 jeffy-g <hirotom1107@gmail.com>
  Released under the MIT license
  https://opensource.org/licenses/mit-license.php
 - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
*/
export type * from "./core";
export { MiniSemaphore } from "./class";
export { create, createWithAbort } from "./object";
export { Deque } from "./deque";
export { restrictor } from "./flow-restrictor";
export const version = "v1.4.1";
