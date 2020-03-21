import * as appRoot from 'app-root-path';
import * as fs from 'fs';

export function createFolderOnRoot(folderName: string) {
   if (!fs.existsSync(appRoot.path + `/${folderName}`)) {
      fs.mkdirSync(appRoot.path + `/${folderName}`);
   }
}
