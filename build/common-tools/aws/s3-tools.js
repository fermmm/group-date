"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteFilesFromS3 = exports.deleteFileFromS3 = exports.downloadS3FileToDisk = exports.readFileContentFromS3 = exports.uploadFileToS3 = void 0;
const AWS = require("aws-sdk");
const fs = require("fs");
const tryToGetErrorMessage_1 = require("../httpRequest/tools/tryToGetErrorMessage");
const s3 = new AWS.S3({
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
});
/**
 * @param localFilePath File name in the server's local file system. Example: "uploads/graph.xml"
 * @param s3TargetPath Full path of the destination file, including folders and file name. Example 1: "myFile.png" Example 2: "my-sub-folder/my-file.png"
 */
async function uploadFileToS3(params) {
    const { localFilePath, s3TargetPath, contentType, allowPublicRead } = params;
    const file = await fs.promises.readFile(localFilePath);
    const s3params = {
        Bucket: process.env.AWS_BUCKET_NAME,
        Key: s3TargetPath,
        Body: file,
    };
    if (allowPublicRead) {
        s3params.ACL = "public-read";
    }
    if (contentType) {
        s3params.ContentType = contentType;
    }
    const s3Response = await s3.upload(s3params).promise();
    // To get the full path that includes the bucket address use data.Location
    return s3Response.Key;
}
exports.uploadFileToS3 = uploadFileToS3;
async function readFileContentFromS3(filePath) {
    const s3params = {
        Bucket: process.env.AWS_BUCKET_NAME,
        Key: filePath,
    };
    let response;
    try {
        response = await s3.getObject(s3params).promise();
        return response.Body.toString();
    }
    catch (error) {
        throw (0, tryToGetErrorMessage_1.tryToGetErrorMessage)(error);
    }
}
exports.readFileContentFromS3 = readFileContentFromS3;
async function downloadS3FileToDisk(s3FilePath, diskFilePath) {
    const s3params = {
        Bucket: process.env.AWS_BUCKET_NAME,
        Key: s3FilePath,
    };
    let response;
    try {
        response = await s3.getObject(s3params).promise();
        await fs.promises.writeFile(diskFilePath, response.Body.toString());
    }
    catch (error) {
        throw (0, tryToGetErrorMessage_1.tryToGetErrorMessage)("saveS3FileToDisk: " + error);
    }
}
exports.downloadS3FileToDisk = downloadS3FileToDisk;
async function deleteFileFromS3(filePath) {
    const s3params = {
        Bucket: process.env.AWS_BUCKET_NAME,
        Key: filePath,
    };
    let response;
    try {
        response = await s3.deleteObject(s3params).promise();
    }
    catch (e) {
        throw (0, tryToGetErrorMessage_1.tryToGetErrorMessage)(e);
    }
    try {
        return "AWS delete object response:\n" + JSON.stringify(response);
    }
    catch (e) {
        return response.toString();
    }
}
exports.deleteFileFromS3 = deleteFileFromS3;
async function deleteFilesFromS3(filePaths) {
    let response = "";
    for (const filePath of filePaths) {
        response += (await deleteFileFromS3(filePath)) + "\n";
    }
    return response;
}
exports.deleteFilesFromS3 = deleteFilesFromS3;
//# sourceMappingURL=s3-tools.js.map