import * as AWS from "aws-sdk";
import * as fs from "fs";

const s3 = new AWS.S3({
   accessKeyId: process.env.AWS_ACCESS_KEY_ID,
   secretAccessKey: process.env.AWS_SECRET_KEY,
});

/**
 * @param fileName File name in the uploads folder
 * @param targetPath Full path of the destination file, including folders and file name. Example 1: "myFile.png" Example 2: "my-sub-folder/my-file.png"
 */
export async function uploadFileToS3(params: {
   fileName: string;
   targetPath: string;
   contentType?: S3ContentType;
   allowPublicRead?: boolean;
}) {
   const { fileName, targetPath, contentType, allowPublicRead } = params;

   const file = await fs.promises.readFile(fileName);

   const s3params: AWS.S3.PutObjectRequest = {
      Bucket: process.env.AWS_BUCKET_NAME,
      Key: targetPath,
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

export interface UploadToS3Response {
   success: boolean;
   path?: string;
   error?: NodeJS.ErrnoException;
}

export type S3ContentType = "text/csv" | "image/jpeg" | "application/octet-stream";
