# Tutorial to upload to AWS Elastic Beanstalk + AWS Neptune

## Setup AWS

1. First complete all the steps on [Installing the project on your computer or server](./installing.md). Then register on AWS with a normal root user (not IAM roles, it's more complicated and you can do that later) then open a Elastic Beanstalk service and then an AWS Neptune service, all in the same AWS Region.

2. Install `eb` (Elastic Beanstalk client), you can use the [official instructions](https://docs.aws.amazon.com/elasticbeanstalk/latest/dg/eb-cli3-install.html). After finishing you should have the `eb` command in your console.

3. Get the access keys required to make automatic changes. To do that follow [this guide](https://docs.aws.amazon.com/general/latest/gr/aws-sec-cred-types.html#access-keys-and-secret-access-keys). Add the keys in the .env file in the corresponding variables: `AWS_ACCESS_KEY_ID` and `AWS_SECRET_ACCESS_KEY`.

4. Open the [S3 Management Console](https://s3.console.aws.amazon.com/s3/home) and copy the name of the bucket, something that looks like: **elasticbeanstalk-us-east-1-123456789**, then go to the .env file and paste it as the value of **AWS_BUCKET_NAME** and also **IMAGES_HOST**, for **IMAGES_HOST** add **https://** at the beginning and **.s3.amazonaws.com/images** at the end, it should look like this: **`https://elasticbeanstalk-us-east-1-123456789.s3.amazonaws.com/images`**

5. In the .env file set **USING_AWS** to **true** and set **AWS_REGION** with the region you are using, something that looks like this: **us-east-1**

6. Initialize the configuration of `eb` following [this guide](https://docs.aws.amazon.com/elasticbeanstalk/latest/dg/eb-cli3-configuration.html). When you see the prompt `Do you want to continue with CodeCommit` answer `Yes`, follow the required steps, you can use the default values and when asks for a user and password use the ones you were using for AWS website (you must type the password, pasting seems to not work).

7. Execute this command: `eb codesource local`

8. From this step we will enable the connection between Beanstalk and Neptune, looks like it should be enabled by default but it's not. Open the "VPC Management Console", you can use [this link](https://console.aws.amazon.com/vpc/).

9. On the left navigation panel go to Security Groups then click "Create Security Group", in the name field enter "All open" or whatever you want. In the "Inbound rules" panel click "Add rule", for the type set "All TCP" on the Source field set "Anywhere-IPv4" then click "Create security group" on the bottom

10.   Go to the "Neptune Console" [you can use this link](https://console.aws.amazon.com/neptune/home), select your database cluster and click "Modify"

11.   Under "VPC security group" add the security group you just created (in step 7)

12.   Click "Continue" on the bottom > select "Immediately" > click "Modify"

13.   In the Neptune dashboard click on the database name, you should see 2 endpoints one of type "Writer" and one of type "Reader", copy the endpoint name of the writer, something that should look like: `database-1.cluster-abc123.us-east-1.neptune.amazonaws.com`. Paste the address on the .env file on the `DATABASE_URL` variable, add `wss://` at the beginning and `:8080/gremlin` at the end, like in the comment of that variable.
      It should look like this: `DATABASE_URL = wss://database-1.cluster-abc123.us-east-1.neptune.amazonaws.com:8182/gremlin`. Save the file.

14.   Now you are ready to upload the application to the server just run:
      `npm run deploy`

      Use that command also to upload new versions.
      What that command do: Builds the js files and uploads all the files of the project folder to the EC2 instance(s) and executes the install command there. If you want to make changes in the run command you can edit the `Procfile` file.

15.   After the upload finishes you should have something when navigating on the public url. Also you have to add it in the .env. To get the public url go to the [Elastic Beanstalk Dashboard](https://console.aws.amazon.com/elasticbeanstalk/home), you may need to click on your environment name and then on top you should see the url, something like this: **abcd1234.us-east-1.elasticbeanstalk.com**. Paste that url on the .env file in the `SERVER_URL` variable, read the comment on top of that variable to know the correct format you have to use there.

## Setup a new computer to upload changes to AWS

Following the previous steps also configures the computer to upload the changes, these steps are required to configure a second computer.

1. Follow steps 2 and 6 of the previous guide.
2. Copy the .env file from the computer you already configured into the new one.

## Upload changes to AWS

To upload a new version run: `npm run deploy`.

## Connecting using SSH

Follow these steps when you need it: for example if you are troubleshooting an issue you may find this useful since accessing resources from inside AWS servers will have less security obstacles than accessing them from your local computer.

1. Setup SSH by running: `eb ssh --setup`. If this is the first computer where you are making this setup then when you see the prompt `Select a keyPair.` select the option "[ Create new KeyPair ]". If this is not the first computer that you are making this setup then you should have the keyPair files in the .ssh folder before executing this step, see step 2. Then execute this step again selecting the keyPair file names you have when prompted.

2. In your `user_home_dir/.ssh` folder you are going to find 2 files: `aws-eb` and `aws-eb.pub`. Store them in a safe place. All the computers you want to be able to connect using SSH should have these files in the .ssh folder.

3. Connect using ssh to the server running: `eb ssh`

## Troubleshooting

If connection to the database cannot be established there could be a problem related with Amazon security, specifically with: "Virtual Private Cloud (VPC)" and "Security Groups" [see this page](https://docs.aws.amazon.com/neptune/latest/userguide/security-vpc-setup.html)

To check if the database connection is working between EC2 (Beanstalk) and Neptune connect using SSH and then follow [these instructions](https://docs.amazonaws.cn/en_us/neptune/latest/userguide/access-graph-gremlin-rest.html). The curl command should return something. 

## Importing and exporting database content

Neptune already has a backup system but it's limited if you don't pay. You can still save and load the contents of the database for free to do backups, localhost testing or troubleshooting. This tutorial covers the initial setup to be able to use this feature.

Also when you setup this an automatic backup system starts working, every day you should see scheduled backups in a folder in the S3.


### Setup AWS to enable database import and export:

1. You need to setup the admin dashboard if you didn't already, follow the [dashboard setup steps](./dashboard.md) on this documentation.

2. Login to AWS with the root user and follow [these steps](https://docs.aws.amazon.com/neptune/latest/userguide/bulk-load-tutorial-IAM.html) to allow Neptune to access the S3 Bucket where the CSV files will be located later (it's required by AWS to store the files there before loading them).
   There is a missing detail in these steps: Under the title **"Creating the Amazon S3 VPC Endpoint"** there is a step that says: **"Choose the Service Name com.amazonaws.region.s3"**, when you search for that you may find 2 services with that name, select the one of type **"Gateway"**.

3. Open the [IAM Roles list](https://console.aws.amazon.com/iamv2/home#/roles) and click the IAM role you created in the previous step, then copy the role ARN, looks like this: **"arn:aws:iam::123456789012:role/NeptuneLoadFromS3"**, open the .env file and paste as the value of **AWS_CSV_IAM_ROLE_ARN**.

4. Save the .env file and run `npm run deploy` to send the .env changes to the server.

### Importing database content

1. Enter on the dashboard and go to the **Tech Operations** section, click on the `Load Database Backup` button, if you are loading a database content format that has multiple files you can do a multiple selection but you need to select all the nodes files first and then press the `Load Database Backup` again and select all the edges files.

   That is all, the backup should be loaded into the database. It's important to know that it will not replace or delete any existing information so you may need to delete all the database information before starting this import process.

### Exporting database content

1. Go to the dasboard and click on the `Export database content` button. The first time may take several minutes becase it has to download a big jar file

### Exported data formats

The database importing and exporting experience includes files in 3 different data formats:

**XML**

   Also called GraphML. This is the format exported when you run localhost (gremlin-server) and click the export button.

   Support:

   - **Import in localhost**: Yes
   - **Export in localhost**: Yes
   - **Import in Neptune**: Yes
   - **Export in Neptune**: No

**GREMLIN**

   This is 1 of the 2 formats contained in a .zip file that is downloaded when you click on the export button when running on AWS.
   
   This is a format that consists of files with a series of gremlin queries to load all the data into the database. These files are created using a converter tool from CSV format.

   Support:

   - **Import in localhost**: Yes
   - **Export in localhost**: No
   - **Import in Neptune**: Yes
   - **Export in Neptune**: Yes

**CSV**

   This is 1 of the 2 formats contained in a .zip file that is downloaded when you click on the export button when running on AWS.

   This is the format that Neptune officially uses to import and export the database.

   Support:

   - **Import in localhost**: No
   - **Export in localhost**: No
   - **Import in Neptune**: Yes
   - **Export in Neptune**: Yes
