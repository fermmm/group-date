# Tutorial to upload to AWS Elastic Beanstalk + AWS Neptune

1. Register on AWS with a normal root user (not IAM roles, it's more complicated and you can do that later) then open a Elastic Beanstalk service and then an AWS Neptune service, all in the same AWS Region.

2. Install `eb` (Elastic Beanstalk client), you can use the [official instructions](https://docs.aws.amazon.com/elasticbeanstalk/latest/dg/eb-cli3-install.html). After finishing you should have the `eb` command in your console.

3. Get the access keys required to make automatic changes. To do that follow [this guide](https://docs.aws.amazon.com/general/latest/gr/aws-sec-cred-types.html#access-keys-and-secret-access-keys)

4. Initialize the configuration of `eb` following [this guide](https://docs.aws.amazon.com/elasticbeanstalk/latest/dg/eb-cli3-configuration.html). When you see the prompt `Do you want to continue with CodeCommit` answer `Yes`, follow the required steps, you can use the default values and when asks for a user and password use the ones you were using for AWS website (you must type the password, pasting seems to not work).

5. Execute this command: `eb codesource local`

6. From this step we will enable the connection between Beanstalk and Neptune, looks like it should be enabled by default but it's not. Open the "VPC Management Console", you can use [this link](https://console.aws.amazon.com/vpc/).

7. On the left navigation panel go to Security Groups then click "Create Security Group", in the name field enter "All open" or whatever you want. In the "Inbound rules" panel click "Add rule", for the type set "All TCP" on the Source field set "Anywhere-IPv4" then click "Create security group" on the bottom

8. Go to the "Neptune Console" [you can use this link](https://console.aws.amazon.com/neptune/home), select your database cluster and click "Modify"

9. Under "VPC security group" add the security group you just created (in step 7)

10.   Click "Continue" on the bottom > select "Immediately" > click "Modify"

11.   In the Neptune dashboard click on the database name, you should see 2 endpoints one of type "Writer" and one of type "Reader", copy the endpoint name of the writer, something that should look like: `database-1.cluster-abc123.us-east-1.neptune.amazonaws.com`. Paste the address on the .env file on the `DATABASE_URL` variable, add `wss://` at the beginning and `:8080/gremlin` at the end, like in the comment of that variable.
      It should look like this: `DATABASE_URL = wss://database-1.cluster-abc123.us-east-1.neptune.amazonaws.com:8182/gremlin`. Save the file.

12.   To upload the app or a new version run: `eb deploy`.

## Enable a new computer to upload changes to the server

1. Follow steps 2 and 4 of the previous guide. That is all.

## Connecting using SSH

Connecting with SSH can be useful to troubleshoot some issues since accessing resources from inside AWS servers will have less security obstacles than accessing them from your local computer.

1. Setup SSH by running: `eb ssh --setup`. If this is the first computer where you are making this setup then when you see the prompt `Select a keyPair.` select the option "[ Create new KeyPair ]". If this is not the first computer that you are making this setup then you should have the keyPair files in the .ssh folder before executing this step, see step 2. Then execute this step again selecting the keyPair file names you have when prompted.

2. In your `user_home_dir/.ssh` folder you are going to find 2 files: `aws-eb` and `aws-eb.pub`. Store them in a safe place. All the computers you want to be able to connect using SSH should have these files in the .ssh folder.

3. Connect using ssh to the server running: `eb ssh`

### Troubleshooting

If connection to the database cannot be established there could be a problem related with Amazon security, specifically with: "Virtual Private Cloud (VPC)" and "Security Groups" [see this page](https://docs.aws.amazon.com/neptune/latest/userguide/security-vpc-setup.html)

To check if the database connection is working between EC2 (Beanstalk) and Neptune connect using SSH and then follow [these instructions](https://docs.amazonaws.cn/en_us/neptune/latest/userguide/access-graph-gremlin-rest.html). The curl command should return something.

## Migrating database content from Gremlin Server to AWS Neptune

When using gremlin server the database content is saved as GraphML (xml) in the database-backups folder. If you want to migrate that into Neptune this repo includes a converter from GraphML to CSV (The format Neptune can import), is [this python script they did](https://github.com/awslabs/amazon-neptune-tools/tree/master/graphml2csv) with an issue fixed.
With these steps you will convert a GraphML file and upload it to Neptune:

1. You need Python 2 or Python 3 installed in your system, to check if it's installed run the command:

   `python --version`

2. Give execution permissions to the python script:

   `chmod +x vendor/graphml2csv/graphml2csv.py`

3. To generate a CSV from **database-backups/current.xml** run this command:

   `./vendor/graphml2csv/graphml2csv.py -i database-backups/latest.xml`

   This will generate 2 CSV files in the database-backups folder, one containing the vertices and one containing the edges.
