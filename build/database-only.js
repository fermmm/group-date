"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// tslint:disable-next-line: no-var-requires
require("dotenv").config();
require("./common-tools/ts-tools/globals");
const database_manager_1 = require("./common-tools/database-tools/database-manager");
const backups_1 = require("./common-tools/database-tools/backups");
/**
 * This file is executed by node when running "npm run database-only" which
 * only runs the database related code (backups) and not the rest.
 * Useful if you want to start the database in it's own instance and the
 * application logic in another instance.
 */
(async () => {
    await (0, database_manager_1.waitForDatabase)();
    await (0, backups_1.initializeDatabaseBackups)();
})();
//# sourceMappingURL=database-only.js.map