"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// tslint:disable-next-line: no-var-requires
require("dotenv").config();
process.env.PERFORM_DATABASE_BACKUPS = "false";
process.env.RESTORE_DATABASE_ON_INIT = "false";
process.env.GENERATE_LOGS = "false";
const database_manager_1 = require("../../common-tools/database-tools/database-manager");
const models_1 = require("../../components/tags/models");
const models_2 = require("../../components/user/models");
/**
 * The tests are not going to run before this async function completes
 */
exports.default = async () => {
    /**
     * These are the initialization functions from index.ts that needs to be executed on the tests
     */
    await (0, database_manager_1.waitForDatabase)();
    await (0, models_1.creteAppAuthoredTags)();
    await (0, models_2.createGenders)();
};
//# sourceMappingURL=beforeAllTests.js.map