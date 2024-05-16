"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.resetTime = exports.changeCurrentTimeBy = exports.chance = void 0;
const Chance = require("chance");
const mockdate_1 = require("mockdate");
/**
 * There should be only one instance of chance for all the app, otherwise when re creating
 * the instance the same random numbers gets created again leading to problems.
 */
exports.chance = new Chance(666);
/**
 * Advances current time by a milliseconds amount, so when Date.now() is called instead of
 * returning the real time it returns the time we set. Useful to simulate time passing in tests.
 * Use resetTime() to go back to system default time.
 */
function changeCurrentTimeBy(offsetMs) {
    const currentTimeAsMs = Date.now();
    const adjustedTimeAsMs = currentTimeAsMs + offsetMs;
    const adjustedDateObj = new Date(adjustedTimeAsMs);
    mockdate_1.default.set(adjustedDateObj);
}
exports.changeCurrentTimeBy = changeCurrentTimeBy;
/**
 * Restores the changes made by changeCurrentTimeBy()
 */
function resetTime() {
    mockdate_1.default.reset();
}
exports.resetTime = resetTime;
//# sourceMappingURL=generalTools.js.map