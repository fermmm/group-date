// tslint:disable-next-line: no-var-requires
require("dotenv").config();
import "./common-tools/ts-tools/globals";
import { backupIsEnabled, makeSimpleBackup } from "./common-tools/database-tools/backups";

/**
 * This file is executed by when running "npm run backup" and makes a backup to the latest.xml file
 * then finishes the process.
 */
(async () => {
   if (backupIsEnabled()) {
      await makeSimpleBackup();
      console.log("Database backup done.");
   } else {
      console.log("Backup not done because it's not enabled.");
   }
   process.exit();
})();
