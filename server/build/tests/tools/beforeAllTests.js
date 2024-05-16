"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.initAppForTests = void 0;
// tslint:disable-next-line: no-var-requires
require("dotenv").config();
require("../../common-tools/ts-tools/globals");
process.env.PERFORM_DATABASE_BACKUPS = "false";
process.env.RESTORE_DATABASE_ON_INIT = "false";
process.env.GENERATE_LOGS = "false";
const database_manager_1 = require("../../common-tools/database-tools/database-manager");
const models_1 = require("../../components/tags/models");
const models_2 = require("../../components/user/models");
const initAppForTests = async () => {
    /**
     * These are the initialization functions from index.ts that needs to be executed on the tests
     */
    await (0, database_manager_1.waitForDatabase)();
    await (0, models_1.createAppAuthoredTags)();
    await (0, models_2.createGenders)();
};
exports.initAppForTests = initAppForTests;
//# sourceMappingURL=beforeAllTests.js.map