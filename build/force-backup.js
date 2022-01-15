"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// tslint:disable-next-line: no-var-requires
require("dotenv").config();
require("./common-tools/ts-tools/globals");
const backups_1 = require("./common-tools/database-tools/backups");
const database_manager_1 = require("./common-tools/database-tools/database-manager");
/**
 * This file is executed by when running "npm run backup" and makes a backup to the latest.xml file
 * then finishes the process.
 */
(async () => {
    if ((0, backups_1.backupIsEnabled)()) {
        await (0, database_manager_1.exportDatabaseContentToFile)(backups_1.CURRENT_DB_EXPORT_PATH);
        console.log("Database backup done.");
    }
    else {
        console.log("Backup not done because it's not enabled.");
    }
    process.exit();
})();
//# sourceMappingURL=force-backup.js.map