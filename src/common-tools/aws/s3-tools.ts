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
export async function uploadFileToS3(params: { fileName: string; targetPath: string }) {
   const { fileName, targetPath } = params;

   let resolve: (value: UploadToS3Response) => void;
   const resultPromise = new Promise<UploadToS3Response>((res, rej) => {
      resolve = res;
   });

   fs.readFile(fileName, (err, data) => {
      if (err) {
         resolve({ success: false, error: err });
         return;
      }

      const params = {
         Bucket: process.env.AWS_BUCKET_NAME,
         Key: targetPath,
         Body: JSON.stringify(data, null, 2),
      };

      s3.upload(params, (s3Err: Error, data: AWS.S3.ManagedUpload.SendData) => {
         if (s3Err) {
            resolve({ success: false, error: s3Err });
            return;
         }

         // To get the full path that includes the bucket address use data.Location
         resolve({ success: true, path: data.Key });
      });
   });

   return resultPromise;
}

export interface UploadToS3Response {
   success: boolean;
   path?: string;
   error?: NodeJS.ErrnoException;
}
