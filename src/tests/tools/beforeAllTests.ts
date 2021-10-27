// tslint:disable-next-line: no-var-requires
require("dotenv").config();

process.env.PERFORM_DATABASE_BACKUPS = "false";
process.env.RESTORE_DATABASE_ON_INIT = "false";
process.env.GENERATE_LOGS = "false";

import { waitForDatabase } from "../../common-tools/database-tools/database-manager";
import { creteAppAuthoredTags } from "../../components/tags/models";
import { createGenders } from "../../components/user/models";

/**
 * The tests are not going to run before this async function completes
 */
export default async () => {
   /**
    * These are the initialization functions from index.ts that needs to be executed on the tests
    */
   await waitForDatabase();
   await creteAppAuthoredTags();
   await createGenders();
};
