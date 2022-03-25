import { humanizeUnixTimeStamp } from "../../../../common-tools/strings/humanizeUnixTime";

export function useReadabilityImprovements(log: string, separator: string): string {
   if (!log) {
      return log;
   }

   try {
      if (typeof log !== "string") {
         log = JSON.stringify(log);
      }

      let logLines = log.split(separator);

      logLines = logLines.map(logLine => {
         if (logLine.length === 0) {
            return "";
         }

         const scapedLine = logLine.replace(/\\"/g, "'");
         let parsedLine = JSON.parse(scapedLine);

         if (!parsedLine.timestamp || !parsedLine.content) {
            return scapedLine;
         }

         return `${humanizeUnixTimeStamp(Number(parsedLine.timestamp))}   ${JSON.stringify(
            parsedLine.content,
         )}`;
      });

      return logLines.join(separator);
   } catch (error) {
      return log;
   }
}
