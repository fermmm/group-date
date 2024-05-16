import * as Chance from "chance";
import MockDate from "mockdate";

/**
 * There should be only one instance of chance for all the app, otherwise when re creating
 * the instance the same random numbers gets created again leading to problems.
 */
export const chance = new Chance(666);

/**
 * Advances current time by a milliseconds amount, so when Date.now() is called instead of
 * returning the real time it returns the time we set. Useful to simulate time passing in tests.
 * Use resetTime() to go back to system default time.
 */
export function changeCurrentTimeBy(offsetMs: number) {
   const currentTimeAsMs = Date.now();
   const adjustedTimeAsMs = currentTimeAsMs + offsetMs;
   const adjustedDateObj = new Date(adjustedTimeAsMs);
   MockDate.set(adjustedDateObj);
}

/**
 * Restores the changes made by changeCurrentTimeBy()
 */
export function resetTime() {
   MockDate.reset();
}
