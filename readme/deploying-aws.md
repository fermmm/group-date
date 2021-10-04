## Tutorial to upload to AWS Elastic Beanstalk + AWS Neptune

1. Register on AWS and open a Elastic Beanstalk service and then an AWS Neptune service, all in the same AWS Region.

2. Install `eb` (Elastic Beanstalk client), you can use the [official instructions](https://docs.aws.amazon.com/elasticbeanstalk/latest/dg/eb-cli3-install.html). After finishing you should have the `eb` command in your console.

3. Get the access keys required to make automatic changes. To do that follow [this guide](https://docs.aws.amazon.com/general/latest/gr/aws-sec-cred-types.html#access-keys-and-secret-access-keys)

4. Initialize the configuration of `eb` following [this guide](https://docs.aws.amazon.com/elasticbeanstalk/latest/dg/eb-cli3-configuration.html). When you see the prompt `Do you want to continue with CodeCommit` answer `Yes`, follow the required steps, you can use the default values and when asks for a user and password use the ones you were using for AWS website (you must type the password, pasting seems to not work).

5.

6. To upload the app and a new version of it, make a commit and then run: `eb deploy`.

Acomodar:

If connection to the database cannot be established there could be a problem related with Amazon security, specifically with: "Virtual Private Cloud (VPC)" and "Security Groups" [see this page](https://docs.aws.amazon.com/neptune/latest/userguide/security-vpc-setup.html)

// Pingear la base desde ssh
yum install nmap
nmap -Pn -p 8182 my-db.xxxxxxxxxxx.us-east-1.neptune.amazonaws.com

// Con esto se terminaron los problemas con codeCommit, lo desactiva parece
eb codesource local

// Seria mejor para testear la db:
g.inject(0)

### Enable a new computer to upload changes to the server

1. Follow steps 2 and 4 of the previous guide. That is all.

### Connecting using SSH

Connecting with SSH can be useful to troubleshoot some issues since accessing resources from inside AWS servers will have less security obstacles than accessing them from your local computer.

1. Setup SSH by running: `eb ssh --setup`. When prompts to select a keyPair select the option "[ Create new KeyPair ]"

2. Connect using ssh to the server running: `eb ssh`
