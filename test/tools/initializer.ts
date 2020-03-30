import '../../src';
import { waitForDatabase } from '../../src/common-tools/database-tools/database-manager';

export default async () => {
   await waitForDatabase(true);
   return Promise.resolve();
};
