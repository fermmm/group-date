/**
 * Multiply a GPS (lat, lon) value by this const to convert it to kilometers.
 * Divide a Km distance number by this const to convert it back to GPS units.
 */
export const KM_TO_GPS: number = 0.0096252;

/**
 * Multiply a Km distance value by this const to convert it to GPS units (lat, lon).
 * Divide a GPS units distance by this const to convert it back to Km.
 */
export const GPS_TO_KM: number = 103.893945;

export const HOUR_IN_SECONDS: number = 3600;
export const DAY_IN_SECONDS: number = HOUR_IN_SECONDS * 24;
export const WEEK_IN_SECONDS: number = DAY_IN_SECONDS * 7;
export const ONE_MONTH_IN_SECONDS: number = DAY_IN_SECONDS * 31;
export const YEAR_IN_SECONDS: number = DAY_IN_SECONDS * 365;
