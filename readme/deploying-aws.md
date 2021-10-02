## Tutorial to upload to AWS Elastic Beanstalk + AWS Neptune

1. Register on AWS and open a Elastic Beanstalk service and AWS Neptune service.

2. Install `eb` (Elastic Beanstalk client), you can use the [official instructions](https://docs.aws.amazon.com/elasticbeanstalk/latest/dg/eb-cli3-install.html). After finishing you should have the `eb` command in your console.

3. Get the access keys required to make automatic changes. To do that follow [this guide](https://docs.aws.amazon.com/general/latest/gr/aws-sec-cred-types.html#access-keys-and-secret-access-keys)

4. Initialize the configuration of `eb` following [this guide](https://docs.aws.amazon.com/elasticbeanstalk/latest/dg/eb-cli3-configuration.html). When you see the prompt `Do you want to continue with CodeCommit` answer `Yes`, follow the required steps, you can use the default values and when asks for a user and password use the ones you were using for AWS website.

5. To upload the app and a new version of it, make a commit and then run: `eb deploy`.

## Enable a new computer to upload changes to the server

1. Follow step 2 of the previous guide. That is all.

## Connecting using SSH

Connecting with SSH can be useful to troubleshoot issues since everything done from there will have less security abstacles.

1. Setup SSH by running: `eb ssh --setup`.
2. Connect using ssh to the server running: `eb ssh`
