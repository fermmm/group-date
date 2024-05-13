// tslint:disable-next-line: no-var-requires
require("dotenv").config();
import "./common-tools/ts-tools/globals";
import { waitForDatabase } from "./common-tools/database-tools/database-manager";
import { initializeDatabaseBackups } from "./common-tools/database-tools/backups";

/**
 * This file is executed by node when running "npm run database-only" which
 * only runs the database related code (backups) and not the rest.
 * Useful if you want to start the database in it's own instance and the
 * application logic in another instance.
 */
(async () => {
   await waitForDatabase();
   await initializeDatabaseBackups();
})();
