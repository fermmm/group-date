import * as AWS from "aws-sdk";
import * as fs from "fs";
import { tryToGetErrorMessage } from "../httpRequest/tools/tryToGetErrorMessage";

const s3 = new AWS.S3({
   accessKeyId: process.env.AWS_ACCESS_KEY_ID,
   secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
});

/**
 * @param localFilePath File name in the server's local file system. Example: "uploads/graph.xml"
 * @param s3TargetPath Full path of the destination file, including folders and file name. Example 1: "myFile.png" Example 2: "my-sub-folder/my-file.png"
 */
export async function uploadFileToS3(params: {
   localFilePath: string;
   s3TargetPath: string;
   contentType?: S3ContentType;
   allowPublicRead?: boolean;
}) {
   const { localFilePath, s3TargetPath, contentType, allowPublicRead } = params;

   const file = await fs.promises.readFile(localFilePath);

   const s3params: AWS.S3.PutObjectRequest = {
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

export interface UploadToS3Response {
   success: boolean;
   path?: string;
   error?: NodeJS.ErrnoException;
}

export type S3ContentType = "text/csv" | "image/jpeg" | "application/octet-stream";

export async function readFileContentFromS3(filePath: string): Promise<string> {
   const s3params: AWS.S3.PutObjectRequest = {
      Bucket: process.env.AWS_BUCKET_NAME,
      Key: filePath,
   };

   let response: AWS.S3.GetObjectOutput;

   try {
      response = await s3.getObject(s3params).promise();
      return response.Body.toString();
   } catch (error) {
      throw tryToGetErrorMessage(error);
   }
}

export async function downloadS3FileToDisk(s3FilePath: string, diskFilePath: string): Promise<void> {
   const s3params: AWS.S3.GetObjectRequest = {
      Bucket: process.env.AWS_BUCKET_NAME,
      Key: s3FilePath,
   };

   let response: AWS.S3.GetObjectOutput;

   try {
      response = await s3.getObject(s3params).promise();
      await fs.promises.writeFile(diskFilePath, response.Body.toString());
   } catch (error) {
      throw tryToGetErrorMessage("saveS3FileToDisk: " + error);
   }
}

export async function deleteFileFromS3(filePath: string): Promise<string> {
   const s3params: AWS.S3.PutObjectRequest = {
      Bucket: process.env.AWS_BUCKET_NAME,
      Key: filePath,
   };

   let response: AWS.S3.DeleteObjectOutput;

   try {
      response = await s3.deleteObject(s3params).promise();
   } catch (e) {
      throw tryToGetErrorMessage(e);
   }

   try {
      return "AWS delete object response:\n" + JSON.stringify(response);
   } catch (e) {
      return response.toString();
   }
}

export async function deleteFilesFromS3(filePaths: string[]): Promise<string> {
   let response = "";

   for (const filePath of filePaths) {
      response += (await deleteFileFromS3(filePath)) + "\n";
   }

   return response;
}
