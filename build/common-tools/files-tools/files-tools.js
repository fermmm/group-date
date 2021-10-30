"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createZipFileFromDirectory = exports.writeFile = exports.getFileContent = exports.fileOrFolderExists = exports.copyFile = exports.deleteFolder = exports.createFolder = void 0;
const appRoot = require("app-root-path");
const fs = require("fs");
const path = require("path");
const archiver = require("archiver");
/**
 * Creates a folder. The path is relative to the root of the project. If the folder already exists does nothing.
 * If the folder is nested inside other folders that also doesn't exist it creates all of them.
 */
function createFolder(folderName) {
    if (fileOrFolderExists(folderName)) {
        return;
    }
    fs.mkdirSync(appRoot.path + `/${folderName}`, { recursive: true });
}
exports.createFolder = createFolder;
function deleteFolder(folderName) {
    if (!fileOrFolderExists(folderName)) {
        return;
    }
    fs.rmSync(appRoot.path + `/${folderName}`, { recursive: true, force: true });
}
exports.deleteFolder = deleteFolder;
/**
 * Copies a file. The destination file will be created or overwritten.
 * The path is relative to the root of the project.
 */
function copyFile(source, destination) {
    createFolder(path.dirname(destination));
    fs.copyFile(appRoot.path + `/${source}`, appRoot.path + `/${destination}`, err => {
        if (err)
            throw err;
    });
}
exports.copyFile = copyFile;
/**
 * Synchronously tests whether or not the given path exists by checking with the file system.
 */
function fileOrFolderExists(path) {
    return fs.existsSync(appRoot.path + `/${path}`);
}
exports.fileOrFolderExists = fileOrFolderExists;
function getFileContent(path, encoding = "utf8") {
    return fs.readFileSync(appRoot.path + `/${path}`, { encoding });
}
exports.getFileContent = getFileContent;
function writeFile(path, data, encoding = "utf8") {
    return fs.writeFileSync(appRoot.path + `/${path}`, data, { encoding });
}
exports.writeFile = writeFile;
async function createZipFileFromDirectory(source, out) {
    const archive = archiver("zip", { zlib: { level: 9 } });
    const stream = fs.createWriteStream(out);
    return new Promise((resolve, reject) => {
        archive
            .directory(source, false)
            .on("error", err => reject(err))
            .pipe(stream);
        stream.on("close", () => resolve());
        archive.finalize();
    });
}
exports.createZipFileFromDirectory = createZipFileFromDirectory;
//# sourceMappingURL=files-tools.js.map