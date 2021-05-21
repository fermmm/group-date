// tslint:disable-next-line: no-var-requires
require("dotenv").config();

process.env.PERFORM_DATABASE_BACKUPS = "false";
process.env.GENERATE_LOGS = "false";

import { waitForDatabase } from "../../common-tools/database-tools/database-manager";
import { creteAppAuthoredTags } from "../../components/tags/models";

/**
 * The tests are not going to run before this async function completes
 */
export default async () => {
   await waitForDatabase();
   await creteAppAuthoredTags();
};
