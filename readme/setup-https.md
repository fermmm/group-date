## Setup HTTPS

First you should have a domain working with the hosting of this server.
Certbot will generate and renew the SSL certificate and key needed to enable https requests.
Also it will add a cron job in the OS to renew the certificates.

1. Go to the [certbot instructions website](https://certbot.eff.org/instructions)
2. On "My HTTP website is running" select "None of the above"
3. Then select the operative system of the computer that is going to run this server
4. Follow all the instructions there
5. When finishing you should see 2 paths certificate and key
6. Paste the paths on the .env on the variables `HTTPS_CERTIFICATE_PATH` and `HTTPS_KEY_PATH`
7. In the .env file set `HTTPS_PORT_ENABLED` to true
8. With the following command a scheduled task is added to the OS to keep certificates renewed, also the command includes other hook commands to execute during renewal to stop and start the server because it needs port 80 for a moment to validate domain, so run one of these commands:
   If you are using the root user:
   `certbot renew --pre-hook "bash -c '. ~/.bashrc; pm2 stop poly'" --post-hook "bash -c '. ~/.bashrc; pm2 start poly'"`

   If you are using another user (replace USER the 2 times):
   `certbot renew --pre-hook "sudo -u USER bash -c '. ~/.bashrc; pm2 stop poly'" --post-hook "sudo -u USER bash -c '. ~/.bashrc; pm2 start poly'"`
