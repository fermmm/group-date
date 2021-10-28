import * as appRoot from "app-root-path";
import * as fs from "fs";
import * as path from "path";
import * as archiver from "archiver";

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

export function deleteFolder(folderName: string) {
   if (!fileOrFolderExists(folderName)) {
      return;
   }

   fs.rmSync(appRoot.path + `/${folderName}`, { recursive: true, force: true });
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

export function getFileContent(path: string, encoding: BufferEncoding = "utf8") {
   return fs.readFileSync(appRoot.path + `/${path}`, { encoding });
}

export function writeFile(path: string, data: string, encoding: BufferEncoding = "utf8") {
   return fs.writeFileSync(appRoot.path + `/${path}`, data, { encoding });
}

export async function createZipFileFromDirectory(source: string, out: string) {
   const archive = archiver("zip", { zlib: { level: 9 } });
   const stream = fs.createWriteStream(out);

   return new Promise<void>((resolve, reject) => {
      archive
         .directory(source, false)
         .on("error", err => reject(err))
         .pipe(stream);

      stream.on("close", () => resolve());
      archive.finalize();
   });
}
