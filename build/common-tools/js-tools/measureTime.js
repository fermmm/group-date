"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.finishMeasureTime = exports.measureTime = void 0;
const measures = {};
/**
 * Measures execution time. This function requires that you pass a measurement id to be used
 * later to finish the measurement. Call finishMeasureTime to finish the measurement.
 * When finishing measurement onFinishMeasurement callback will be executed passing the
 * resulting time, or you can use the returned time of onFinishMeasurement.
 *
 * @param measurementId Create a unique id to be used later to finish the time measurement
 * @param settings More options to configure the measurement
 */
function measureTime(measurementId, settings) {
    var _a;
    const currentMeasurement = measures[measurementId];
    if ((currentMeasurement === null || currentMeasurement === void 0 ? void 0 : currentMeasurement.finished) === false) {
        return;
    }
    if (((_a = currentMeasurement === null || currentMeasurement === void 0 ? void 0 : currentMeasurement.settings) === null || _a === void 0 ? void 0 : _a.executeMeasurementOnlyOnce) === true &&
        (currentMeasurement === null || currentMeasurement === void 0 ? void 0 : currentMeasurement.lastMeasurement) != null) {
        return;
    }
    let timeoutId = undefined;
    if ((settings === null || settings === void 0 ? void 0 : settings.maxTimeOfMeasurementMs) != null) {
        timeoutId = setTimeout(() => {
            finishMeasureTime(measurementId);
        }, settings.maxTimeOfMeasurementMs);
    }
    measures[measurementId] = {
        settings,
        measurementId,
        finished: false,
        startTime: new Date().getTime(),
        timeoutId,
    };
}
exports.measureTime = measureTime;
/**
 * Finishes the measurement and the onFinishMeasurement will be called. Also this function returns the time elapsed too.
 */
function finishMeasureTime(measurementId) {
    var _a, _b;
    const currentMeasurement = measures[measurementId];
    if (currentMeasurement == null) {
        return;
    }
    if (currentMeasurement.finished) {
        return;
    }
    const timeElapsed = new Date().getTime() - currentMeasurement.startTime;
    if (currentMeasurement.timeoutId != null) {
        clearTimeout(currentMeasurement.timeoutId);
    }
    measures[measurementId] = {
        ...currentMeasurement,
        finished: true,
        lastMeasurement: timeElapsed,
    };
    (_b = (_a = currentMeasurement.settings) === null || _a === void 0 ? void 0 : _a.onFinishMeasurement) === null || _b === void 0 ? void 0 : _b.call(_a, timeElapsed, measurementId);
    return timeElapsed;
}
exports.finishMeasureTime = finishMeasureTime;
//# sourceMappingURL=measureTime.js.map