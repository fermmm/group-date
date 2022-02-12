import { humanizeUnixTimeStamp } from "../../../../common-tools/strings/humanizeUnixTime";

export function useReadabilityImprovements(log: string): string {
   if (!log) {
      return log;
   }

   try {
      if (typeof log !== "string") {
         log = JSON.stringify(log);
      }

      let logLines = log.split("\n");
      console.log(logLines.length);

      logLines = logLines.map(logLine => {
         if (logLine.length === 0) {
            return "";
         }

         const scapedLine = logLine.replace(/\\"/g, "'");
         let parsedLine = JSON.parse(scapedLine);

         delete parsedLine.level;

         if (parsedLine.message) {
            parsedLine.message = parsedLine.message.replaceAll("'", '"');
            try {
               parsedLine.message = JSON.parse(parsedLine.message);
            } catch (e) {}
         }

         if (parsedLine.timestamp) {
            parsedLine.timestamp = humanizeUnixTimeStamp(Number(parsedLine.timestamp));
            // Move timestamp prop to the beginning of the object
            parsedLine = { timestamp: parsedLine.timestamp, ...parsedLine };
         }

         return JSON.stringify(parsedLine);
      });

      return logLines.join("\n");
   } catch (error) {
      return log;
   }
}
