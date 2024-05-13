"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.fromAgeToBirthDate = exports.fromBirthDateToAge = void 0;
const moment = require("moment");
const constants_1 = require("./constants");
function fromBirthDateToAge(birthDate) {
    return Math.floor((moment().unix() - birthDate) / constants_1.YEAR_IN_SECONDS);
}
exports.fromBirthDateToAge = fromBirthDateToAge;
function fromAgeToBirthDate(age) {
    return moment()
        .year(moment().year() - age - 1)
        .unix();
}
exports.fromAgeToBirthDate = fromAgeToBirthDate;
//# sourceMappingURL=date-tools.js.map