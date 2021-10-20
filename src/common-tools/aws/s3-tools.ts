import * as AWS from "aws-sdk";
import * as fs from "fs";

const s3 = new AWS.S3({
   accessKeyId: process.env.AWS_ACCESS_KEY_ID,
   secretAccessKey: process.env.AWS_SECRET_KEY,
});

/**
 * @param fileName File name in the uploads folder
 * @param targetPath Example 1: "myFile.png" Example 2: "my-sub-folder/my-file.png"
 */
export function uploadFileToS3(params: { fileName: string; targetPath: string }) {
   const { fileName, targetPath } = params;

   fs.readFile(fileName, (err, data) => {
      if (err) throw err;
      const params = {
         Bucket: process.env.AWS_BUCKET_NAME,
         Key: targetPath,
         Body: JSON.stringify(data, null, 2),
      };
      s3.upload(params, (s3Err: Error, data: AWS.S3.ManagedUpload.SendData) => {
         if (s3Err) throw s3Err;
         console.log(`File uploaded successfully at ${data.Location}`);
      });
   });
}
