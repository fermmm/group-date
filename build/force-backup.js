"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// tslint:disable-next-line: no-var-requires
require("dotenv").config();
require("./common-tools/ts-tools/globals");
const backups_1 = require("./common-tools/database-tools/backups");
/**
 * This file is executed by when running "npm run backup" and makes a backup to the latest.xml file
 * then finishes the process.
 */
(async () => {
    if (backups_1.backupIsEnabled()) {
        await backups_1.makeSimpleBackup();
        console.log("Database backup done.");
    }
    else {
        console.log("Backup not done because it's not enabled.");
    }
    process.exit();
})();
//# sourceMappingURL=force-backup.js.map