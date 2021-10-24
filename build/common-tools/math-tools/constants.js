"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.YEAR_IN_SECONDS = exports.ONE_MONTH_IN_SECONDS = exports.WEEK_IN_SECONDS = exports.DAY_IN_SECONDS = exports.HOUR_IN_SECONDS = exports.GPS_TO_KM = exports.KM_TO_GPS = void 0;
/**
 * Multiply a GPS (lat, lon) value by this const to convert it to kilometers.
 * Divide a Km distance number by this const to convert it back to GPS units.
 */
exports.KM_TO_GPS = 0.0096252;
/**
 * Multiply a Km distance value by this const to convert it to GPS units (lat, lon).
 * Divide a GPS units distance by this const to convert it back to Km.
 */
exports.GPS_TO_KM = 103.893945;
exports.HOUR_IN_SECONDS = 3600;
exports.DAY_IN_SECONDS = exports.HOUR_IN_SECONDS * 24;
exports.WEEK_IN_SECONDS = exports.DAY_IN_SECONDS * 7;
exports.ONE_MONTH_IN_SECONDS = exports.DAY_IN_SECONDS * 31;
exports.YEAR_IN_SECONDS = exports.DAY_IN_SECONDS * 365;
//# sourceMappingURL=constants.js.map