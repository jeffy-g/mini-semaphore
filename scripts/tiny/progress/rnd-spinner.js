/*!
 - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  Copyright (C) 2020 jeffy-g <hirotom1107@gmail.com>
  Released under the MIT license
  https://opensource.org/licenses/mit-license.php
 - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
*/
/**
 * @file random spinner
 * @author jeffy-g <hirotom1107@gmail.com>
 * @version 1.0
 * @requires spinners.json
 */
/**
 * @param {any[]} array 
 */
const randomIndex = (array) => {
    return Math.floor(Math.random() * array.length);
};

/**
 * @typedef {import("./spinners")} TSpinners
 * @typedef {keyof TSpinners} TSpinnersName
 */
/**
 * @type {TSpinners}
 */
const spinners = require("./spinners.json");
/**
 * @type {TSpinnersName[]}
 */
// @ts-ignore
const frameNames = Object.keys(spinners);

const MAX_PAD = frameNames.reduce((acc, sn) => {
    return Math.max(acc, sn.length);
}, 0);
const MIN_PAD = frameNames.reduce((acc, sn) => {
    return Math.max(acc, sn.length);
}, MAX_PAD);

const getRandomFrame = () => {
    /** @type {TSpinnersName} */
    const name = frameNames[randomIndex(frameNames)];//.frames;
    return {
        name,
        frames: spinners[name].frames
    };
};

module.exports = {
    getRandomFrame,
    MAX_PAD,
    MIN_PAD,
};
