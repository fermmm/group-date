"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getRandomInt = exports.generateNumberId = exports.roundDecimals = exports.replaceNaNInfinity = exports.minutesToMilliseconds = exports.hoursToMilliseconds = void 0;
function hoursToMilliseconds(hours) {
    return hours * 60 * 60 * 1000;
}
exports.hoursToMilliseconds = hoursToMilliseconds;
function minutesToMilliseconds(hours) {
    return hours * 60 * 1000;
}
exports.minutesToMilliseconds = minutesToMilliseconds;
/**
 * If the number provided is NaN or Infinity replaces it with another value provided in the second parameter
 */
function replaceNaNInfinity(numberToCheck, replaceBy) {
    if (!Number.isFinite(numberToCheck) || Number.isNaN(numberToCheck)) {
        return replaceBy;
    }
    return numberToCheck;
}
exports.replaceNaNInfinity = replaceNaNInfinity;
/**
 * Executes a Math.round() that affects only the decimals, for example:
 *
 * input: 0.12 returns: 0.10
 * input: 5.68 returns: 5.70
 *
 */
function roundDecimals(value) {
    return Math.round(value * 10) / 10;
}
exports.roundDecimals = roundDecimals;
let generateNumberIdLast = 0;
/**
 * Generates a consecutive number with random decimals, so in case of server restarting the number is
 * still not the same
 */
function generateNumberId() {
    return generateNumberIdLast++ + Math.random();
}
exports.generateNumberId = generateNumberId;
/**
 * Returns a random integer between min (inclusive) and max (inclusive).
 * The value is no lower than min (or the next integer greater than min
 * if min isn't an integer) and no greater than max (or the next integer
 * lower than max if max isn't an integer).
 * Using Math.round() will give you a non-uniform distribution!
 */
function getRandomInt(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1)) + min;
}
exports.getRandomInt = getRandomInt;
//# sourceMappingURL=general.js.map