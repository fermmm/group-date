"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.chance = void 0;
const Chance = require("chance");
/**
 * There should be only one instance of chance for all the app, otherwise when re creating
 * the instance the same random numbers gets created again leading to problems.
 */
exports.chance = new Chance(666);
//# sourceMappingURL=generalTools.js.map