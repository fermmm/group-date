"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.removeFilePartInPath = exports.createZipFileFromDirectory = exports.writeFile = exports.getFileContent = exports.fileOrFolderExists = exports.copyFile = exports.deleteFile = exports.deleteFolder = exports.createFolder = void 0;
const appRoot = require("app-root-path");
const fs = require("fs");
const archiver = require("archiver");
/**
 * Creates a folder. The path is relative to the root of the project. If the folder already exists does nothing.
 * If the folder is nested inside other folders that also doesn't exist it creates all of them.
 * If the path contains a part with a file at the end it ignores the file part, so it can be used to make sure
 * a file is ready to be created because all folders are in place.
 */
function createFolder(path) {
    path = removeFilePartInPath(path);
    if (fileOrFolderExists(path)) {
        return;
    }
    fs.mkdirSync(appRoot.path + `/${path}`, { recursive: true });
}
exports.createFolder = createFolder;
function deleteFolder(folderPath) {
    if (!fileOrFolderExists(folderPath)) {
        return;
    }
    fs.rmSync(appRoot.path + `/${folderPath}`, { recursive: true, force: true });
}
exports.deleteFolder = deleteFolder;
async function deleteFile(filePath) {
    await fs.promises.unlink(filePath);
}
exports.deleteFile = deleteFile;
/**
 * Copies a file. The destination file will be created or overwritten.
 * The path is relative to the root of the project.
 */
function copyFile(source, destination) {
    createFolder(destination);
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
    createFolder(path);
    return fs.writeFileSync(appRoot.path + `/${path}`, data, { encoding });
}
exports.writeFile = writeFile;
async function createZipFileFromDirectory(source, out) {
    createFolder(out);
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
/**
 * Removes the file part of the path string
 */
function removeFilePartInPath(filePath) {
    if (!filePath.includes(".")) {
        return filePath;
    }
    const pathAsArray = filePath.substring(0, filePath.lastIndexOf(".")).split("/");
    pathAsArray.pop();
    return pathAsArray.join("/");
}
exports.removeFilePartInPath = removeFilePartInPath;
//# sourceMappingURL=files-tools.js.map