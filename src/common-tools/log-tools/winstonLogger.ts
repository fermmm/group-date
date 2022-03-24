/**
 * This returns a profiler variable where you have to call done() to log the time:
 * const profiler = logTimeToFileFn("file");
 * ...
 * profiler.done({ message: 'Task was done in' });
 */
export function _logTimeToFile(file: keyof typeof LOG_FILES) {
   if (process.env.GENERATE_LOGS !== "true") {
      return {
         done: (info?: any) => true,
      };
   }

   return LOG_FILES[file].startTimer();
}
