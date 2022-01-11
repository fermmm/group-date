"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.uploadFileToS3 = void 0;
const AWS = require("aws-sdk");
const fs = require("fs");
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
//# sourceMappingURL=s3-tools.js.map