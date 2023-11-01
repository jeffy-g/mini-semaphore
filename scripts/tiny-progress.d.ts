/*!
 - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  Copyright (C) 2023 jeffy-g <hirotom1107@gmail.com>
  Released under the MIT license
  https://opensource.org/licenses/mit-license.php
 - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
*/
import * as progress from "./tiny/progress/";
/**
 * @param {number} [fps]
 * @param {() => string} [messageEmiter]
 */
export function create(fps?: number, messageEmiter?: () => string): ReturnType<typeof progress.createProgressObject>;
