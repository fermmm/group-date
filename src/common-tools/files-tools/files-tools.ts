import * as appRoot from "app-root-path";
import * as fs from "fs";
import * as path from "path";

/**
 * Creates a folder. The path is relative to the root of the project. If the folder already exists does nothing.
 * If the folder is nested inside other folders that also doesn't exist it creates all of them.
 */
export function createFolder(folderName: string) {
   if (fileOrFolderExists(folderName)) {
      return;
   }

   fs.mkdirSync(appRoot.path + `/${folderName}`, { recursive: true });
}

/**
 * Copies a file. The destination file will be created or overwritten.
 * The path is relative to the root of the project.
 */
export function copyFile(source: string, destination: string) {
   createFolder(path.dirname(destination));
   fs.copyFile(appRoot.path + `/${source}`, appRoot.path + `/${destination}`, err => {
      if (err) throw err;
   });
}

/**
 * Synchronously tests whether or not the given path exists by checking with the file system.
 */
export function fileOrFolderExists(path: string): boolean {
   return fs.existsSync(appRoot.path + `/${path}`);
}
