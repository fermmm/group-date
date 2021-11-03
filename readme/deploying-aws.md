# Tutorial to upload to AWS Elastic Beanstalk + AWS Neptune

## Setup AWS

1. First complete all the steps on [Installing the project on your computer or server](./installing.md). Then register on AWS with a normal root user (not IAM roles, it's more complicated and you can do that later) then open a Elastic Beanstalk service and then an AWS Neptune service, all in the same AWS Region.

2. Install `eb` (Elastic Beanstalk client), you can use the [official instructions](https://docs.aws.amazon.com/elasticbeanstalk/latest/dg/eb-cli3-install.html). After finishing you should have the `eb` command in your console.

3. Get the access keys required to make automatic changes. To do that follow [this guide](https://docs.aws.amazon.com/general/latest/gr/aws-sec-cred-types.html#access-keys-and-secret-access-keys). Add the keys in the .env file in the corresponding variables: `AWS_ACCESS_KEY_ID` and `AWS_SECRET_ACCESS_KEY`.

4. Open the [S3 Management Console](https://s3.console.aws.amazon.com/s3/home) and copy the name of the bucket, something that looks like: **elasticbeanstalk-us-east-1-123456789**, then go to the .env file and paste it as the value of **AWS_BUCKET_NAME** and also **IMAGES_HOST**, for **IMAGES_HOST** add **https://** at the beginning and **.s3.amazonaws.com/images** at the end, it should look like this: **`https://elasticbeanstalk-us-east-1-123456789.s3.amazonaws.com/images`**

5. In the .env file set **USING_AWS** to **true**

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

15.   After the upload finishes you should have something on the public url. To get the public url go to the [Elastic Beanstalk Dashboard](https://console.aws.amazon.com/elasticbeanstalk/home), you may need to click on your environment name and then on top you should see the url, something like this: **abcd1234.us-east-1.elasticbeanstalk.com**

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

## Importing a database backup

Neptune already has a backup system but it's limited if you don't pay. So there is another alternative backup loading and saving system I did. Using that you can load a database content file in 2 supported formats XML (GraphML) or the official CSV. If you want to load a backup saved in XML format you will need an extra step for converting that into CSV, this project includes [this](https://github.com/awslabs/amazon-neptune-tools/tree/master/graphml2csv) python script to do that conversion, the version in this repo it's a little improved.

### Setup AWS to enable database import:

1. Login to AWS with the root user and follow [these steps](https://docs.aws.amazon.com/neptune/latest/userguide/bulk-load-tutorial-IAM.html) to allow Neptune to access the S3 Bucket where the CSV files will be located later (it's required by AWS to store the files there before loading them).
   There is a missing detail in these steps: Under the title **"Creating the Amazon S3 VPC Endpoint"** there is a step that says: **"Choose the Service Name com.amazonaws.region.s3"**, when you search for that you may find 2 services with that name, select the one of type **"Gateway"**.

2. Open the [IAM Roles list](https://console.aws.amazon.com/iamv2/home#/roles) and click the IAM role you created in the previous step, then copy the role ARN, looks like this: **"arn:aws:iam::123456789012:role/NeptuneLoadFromS3"**, open the .env file and paste as the value of **AWS_CSV_IAM_ROLE_ARN**.

3. In the .env file there are some values to set:

   **AWS_REGION**: You must complete that value with the region you are using, something that looks like: us-east-1

   **ADMIN_USER**: Here you have to create a user name that will be used later, can be anything. If you already have this value set there is no need to change it.

   **ADMIN_PASSWORD**: Here you have to create a password, with a minimum of 6 characters. If you already have this value set there is no need to change it.

4. Save the .env file and run `npm run deploy` to send the .env changes to the server.

Now follow the next section to enable your computer to make the migration.

### Setup your PC:

You can skip these steps if you will never load a backup in XML format.

1. You need Python 2 or Python 3 installed in your system, to check if it's installed run the command:

   `python --version`

2. Give execution permissions to the python script:

   `chmod +x vendor/graphml2csv/graphml2csv.py`

### Make the import:

1. You can skip this step if your backup file is already CSV format. To convert XML to CSV located for example at **database-backups/latest.xml** run this command:

   `./vendor/graphml2csv/graphml2csv.py -i database-backups/latest.xml`

   This will generate 2 CSV files in the same folder, one containing the vertices and one containing the edges (this is how CSV backup works, with 2 files).

2. Open the Dashboard of the server **[public_url]/dashboard** for the public url see the last step of the [Setup AWS](#setup-aws) in this same readme file. Login with whatever you wrote on the **ADMIN_USER** and **ADMIN_PASSWORD** in the .env file.

3. Go to the Tech Operations sections and click on the `Load Database Backup` button, then select both CSV files holding shift.

   That is all, the backup should be loaded into the database. It's important to know that it will not replace or delete any existing information in the database.

## Exporting a database backup

### Setup AWS to enable database export:

1. Go to the dasboard and click on the `Export database content` button. The first time may take several minutes becase it has to download a big jat file

1.[Borrar]  Go to the [EC2 Mangement Console](https://console.aws.amazon.com/ec2/v2/home) in the left panel click on "Instances", you probably have only one instance, click on the instance name, there you will see the `Subnet ID` remember it or paste it somewhere, you will use it later.

2. [Borrar] Open [these instructions](https://docs.aws.amazon.com/neptune/latest/userguide/machine-learning-data-export-service.html), follow the instructions but on step 3 fill the form with the following:
   
   **Subnet1 and Subnet2**: Use the Subnet ID you copied from the previous step. 
   
   **EnableIAM**: I recommend to set it to `false` for now since adds more tasks to do and it's not supported in this instructions. 
   
   After the steps with numbers you see a title **Enable access to Neptune from Neptune-Export** that is not required to follow, if you completed the steps with numbers that is all.

In Stack failure options select Preserve successfully provisioned resources