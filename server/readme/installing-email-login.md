# Tutorial to install email login

Email login (traditional user and password login) is required to use testing accounts, these type of accounts are required by Google Play so they can test the app. Also it's a type of login preferred by some users. This type of login requires sending emails, sending emails is not simple, the emails can be sent by the server using a SMTP client, but that kind of emails ends up in the spam folder. The most secure emails are the ones sent by API services, this is not free but very cheap, specially Amazon SES (The only one supported by this server). This tutorial covers registering in Amazon and doing all the required steps to have Amazon SES up and running and email login working.

## Setup AWS

1. Create an AWS account and always use the root account (not the IAM user) since that is not supported in this tutorial.

2. If you don't have the AWS access keys setup in the .env file follow the **Programmatic access** part of [this tutorial](https://docs.aws.amazon.com/general/latest/gr/aws-sec-cred-types.html). Paste the credentials in the .env file, the variables you must set are: **AWS_ACCESS_KEY_ID**, **AWS_SECRET_ACCESS_KEY** and **AWS_REGION**, see the comments in the .env for more information.

3. You must have an email address that will appear as the sender of the emails sent by Amazon SES. Can be any email address, like a gmail address but it must be verified by Amazon. To verify the address follow [this tutorial](https://docs.aws.amazon.com/ses/latest/dg/creating-identities.html#verify-email-addresses-procedure). You only need to follow the steps under **Creating an email address identity** and **Verifying an email address**. When you finish set the variable **EMAIL_SENDER** in the .env file with the email you validated.

4. In the SES [account dashboard](https://console.aws.amazon.com/sesv2) you should see a button that says "Request production access". Click on that button and select **Transactional**, in the description paste the following: 

``` 
How do you plan to build or acquire your mailing list?

   It's a social network app, emails will only be sent to users that want to login using thier email address and only transactional emails will be sent, specifically: email confirmation link and password reset, no other emails will be sent.

How do you plan to handle bounces and complaints?

   Bounces will not be handled and we have another email address for complaints.

How can recipients opt out of receiving email from you?

   The emails are only transactional so they will receive an email only when they request for it.

How did you choose the sending rate or sending quota that you specified in this request?

   Only transactional emails will be sent.
```

follow the rest of the steps to get the production access. This is required to avoid a security limit that Amazon has to prevent spammers to use their service. This takes some time to get approved, in the meantime you can only send emails to validated email addresses, in other words you can only send an email to the same account you validated as the sender, you can test if everything works by entering the dashboard, under tech ops you can test with the email send testing form, use the email address you verified in the text field and then click on "send test email" and you should see the email in your inbox. 

If you have everything set in the .env now the client should have a button to login using email.