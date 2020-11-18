import "../..";
import { waitForDatabase } from "../../common-tools/database-tools/database-manager";

export default async () => {
   await waitForDatabase(true);
   return Promise.resolve();
};
