import * as AWS from "aws-sdk";
import * as fs from "fs";

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

// TODO: Terminar. Hay que hacer algo para que solo un admin pueda leer la ruta de los archivos
export async function readFileContentFromS3(params: { filePath: string }): Promise<string> {
   return "";
}
