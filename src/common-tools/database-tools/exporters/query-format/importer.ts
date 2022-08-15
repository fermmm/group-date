import * as path from "path";
import { tryToGetErrorMessage } from "../../../httpRequest/tools/tryToGetErrorMessage";
import { sendQueryAsString } from "../../database-manager";

/**
 * Loads database content provided in a file that contains queries separated by a line break.
 */
export async function importDatabaseContentFromQueryFile(props: {
   fileContent: string;
   fileNameForLogs?: string;
}) {
   const { fileContent, fileNameForLogs } = props;
   let responseText = "";
   let successfulQueries = 0;
   let failedQueries = 0;

   if (fileNameForLogs != null) {
      responseText += `\n\nFile: ${path.basename(fileNameForLogs)}\n`;
   }

   const queries = fileContent.split(/\r\n|\r|\n/g).filter(query => query.trim().length > 0);
   for (const query of queries) {
      try {
         await sendQueryAsString(query);
         successfulQueries++;
      } catch (e) {
         const error = tryToGetErrorMessage(e);
         responseText += error + "\n";
         failedQueries++;
      }
   }

   responseText += `Finished. Successful queries: ${successfulQueries}. Failed queries: ${failedQueries}`;

   return responseText;
}
