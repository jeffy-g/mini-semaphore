/*!
 - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  Copyright (C) 2020 jeffy-g <hirotom1107@gmail.com>
  Released under the MIT license
  https://opensource.org/licenses/mit-license.php
 - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
*/
export type TProgressFormatOptions = {
    fmt: string;
    payload?: Record<string, string>;
};
/**
 * create async progress
 *
 * @param {number} timeSpanMS controll rotator cycle speed (ms). (maybe about...
 * @param {string[]} frames progress frame.
 */
export function createProgress(timeSpanMS: number, frames: string[]): (text: string) => void;
/**
 *
 * @param {string[]} frames progress frame.
 * @param {{ fmt: string, payload?: Record<string, string> }} [formatOpt]
 * ```
 * " {frameName} [{tick}]: {msg}" // etc
 * ```
 */
export function createProgressSync(frames: string[], formatOpt?: {
    fmt: string;
    payload?: Record<string, string>;
}): (msg: string, done?: boolean) => void;

/**
 *
 * @param {string[]} frames progress frame.
 * @param {TProgressFormatOptions} formatOpt
 * ```
 * " {frameName} [{tick}]: {msg}" // etc
 * ```
 * @param {() => string} callback
 */
export function createProgressObject(frames: string[], formatOpt: TProgressFormatOptions, callback: () => string): {
    /**
     * @param {string[]} [newFrames]
     * @param {TProgressFormatOptions} [newOpt]
     */
    updateOptions(newFrames?: string[], newOpt?: TProgressFormatOptions): void;
    /**
     * which means progress done
     */
    deadline(): void;
    /**
     * adjust to next line
     */
    newLine(): void;
    /**
     * change the fps rate
     *
     * @param {number} fps
     */
    setFPS(fps: number): void;
    /**
     * run timer (30fps)
     */
    run(): void;
    /**
     * stop timer
     */
    stop(): void;
};

declare global {
    type TWebpackProgressHandler = (percentage: number, message: string, ...args: string[]) => void;
}
/**
 * see https://webpack.js.org/plugins/progress-plugin/
 *
 * @param {string} [logFilePath] can be undefined
 * @param {boolean} [disableRenderLine]
 */
export function createWebpackProgressPluginHandler(logFilePath?: string, disableRenderLine?: boolean): (percentage: number, message: string, ...args: string[]) => void;
