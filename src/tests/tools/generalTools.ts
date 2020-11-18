import * as Chance from "chance";

/**
 * There should be only one instance of chance for all the app, otherwise when re creating
 * the instance the same random numbers gets created again leading to problems.
 */
export const chance = new Chance(666);
