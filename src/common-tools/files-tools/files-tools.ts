import * as appRoot from "app-root-path";
import * as fs from "fs";
import * as path from "path";
import * as archiver from "archiver";

/**
 * Creates a folder. The path is relative to the root of the project. If the folder already exists does nothing.
 * If the folder is nested inside other folders that also doesn't exist it creates all of them.
 * If the path contains a part with a file at the end it ignores the file part, so it can be used to make sure
 * a file is ready to be created because all folders are in place.
 */
export function createFolder(path: string) {
   path = removeFilePartInPath(path);

   if (fileOrFolderExists(path)) {
      return;
   }

   fs.mkdirSync(appRoot.path + `/${path}`, { recursive: true });
}

export function deleteFolder(folderPath: string) {
   if (!fileOrFolderExists(folderPath)) {
      return;
   }

   fs.rmSync(appRoot.path + `/${folderPath}`, { recursive: true, force: true });
}

export async function deleteFile(filePath: string) {
   await fs.promises.unlink(filePath);
}

/**
 * Copies a file. The destination file will be created or overwritten.
 * The path is relative to the root of the project.
 */
export function copyFile(source: string, destination: string) {
   createFolder(destination);
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
   createFolder(path);
   return fs.writeFileSync(appRoot.path + `/${path}`, data, { encoding });
}

export async function createZipFileFromDirectory(source: string, out: string) {
   createFolder(out);
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

/**
 * Removes the file part of the path string
 */
export function removeFilePartInPath(filePath: string) {
   if (!filePath.includes(".")) {
      return filePath;
   }

   const pathAsArray = filePath.substring(0, filePath.lastIndexOf(".")).split("/");
   pathAsArray.pop();
   return pathAsArray.join("/");
}

/**
 * Returns the list of file names in the given directory.
 */
export function readFolder(folderPath: string): string[] {
   return fs.readdirSync(appRoot.path + `/${folderPath}`);
}
