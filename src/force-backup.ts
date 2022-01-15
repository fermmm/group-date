// tslint:disable-next-line: no-var-requires
require("dotenv").config();
import "./common-tools/ts-tools/globals";
import { backupIsEnabled, CURRENT_DB_EXPORT_PATH } from "./common-tools/database-tools/backups";
import { exportDatabaseContentToFile } from "./common-tools/database-tools/database-manager";

/**
 * This file is executed by when running "npm run backup" and makes a backup to the latest.xml file
 * then finishes the process.
 */
(async () => {
   if (backupIsEnabled()) {
      await exportDatabaseContentToFile(CURRENT_DB_EXPORT_PATH);
      console.log("Database backup done.");
   } else {
      console.log("Backup not done because it's not enabled.");
   }
   process.exit();
})();
