const measures: Record<string, Measure & { measurementId: string }> = {};

/**
 * Measures execution time. This function requires that you pass a measurement id to be used
 * later to finish the measurement. Call finishMeasureTime to finish the measurement.
 * When finishing measurement onFinishMeasurement callback will be executed passing the
 * resulting time, or you can use the returned time of onFinishMeasurement.
 *
 * @param measurementId Create a unique id to be used later to finish the time measurement
 * @param settings More options to configure the measurement
 */
export function measureTime(measurementId: string, settings: MeasureTimeSettings) {
   const currentMeasurement = measures[measurementId];

   if (currentMeasurement?.finished === false) {
      return;
   }

   if (
      currentMeasurement?.props?.executeMeasurementOnlyOnce === true &&
      currentMeasurement?.lastMeasurement != null
   ) {
      return;
   }

   let timeoutId = undefined;
   if (settings?.maxTimeOfMeasurementMs != null) {
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

/**
 * Finishes the measurement and the onFinishMeasurement will be called. Also this function returns the time elapsed too.
 */
export function finishMeasureTime(measurementId: string) {
   const currentMeasurement = measures[measurementId];

   if (currentMeasurement == null) {
      return;
   }

   if (currentMeasurement.finished) {
      return;
   }

   const timeElapsed = new Date().getTime() - currentMeasurement.startTime;

   if (currentMeasurement.timeoutId != null) {
      clearTimeout(currentMeasurement.timeoutId as any);
   }

   measures[measurementId] = {
      ...currentMeasurement,
      finished: true,
      lastMeasurement: timeElapsed,
   };

   currentMeasurement.props?.onFinishMeasurement?.(timeElapsed, measurementId);

   return timeElapsed;
}

export interface MeasureTimeSettings {
   /* This callback is one way to get the measured time */
   onFinishMeasurement?: (measuredTimeMs: number, measurementId: string) => void;
   /* After this time passes the measurement callback is executed and the measurement finishes */
   maxTimeOfMeasurementMs?: number;
   /* Execute measurement only once per session */
   executeMeasurementOnlyOnce?: boolean;
}

interface Measure {
   props: MeasureTimeSettings;
   finished: boolean;
   startTime: number;
   lastMeasurement?: number;
   timeoutId: number | undefined;
}
