# Poly server

> This project uses: **Node.js + Koa.js + TypeScript + "Tinkerpop3 Gremlin" for the database.**
>
> You need to be an experience developer and know how to code in these technologies to modify the project. To create your own version of the project you don't need to know how to code but you may need to have a programmer to guide you.

You can run all in local for development or host it on a hosting provider that let's you install anything and run any command in an Ubuntu or other Linux distro like you can do with Digital Ocean. This is the easiest and cheapest and it's recommended at the beginning.
When you have many users and you need to scale the computing power it's recommended to migrate the database to a managed database compatible with gremlin like AWS Neptune and run the app logic in something like AWS Elastic Beanstalk, also you may need a CDN.
Also Azure has products for that like: Azure App Engine + Cosmos DB.

You can also use a hosting provider for the code and another company hosting the database, but that may have a speed cost. Here is a list of all database hosting providers that supports Gremlin queries:
http://tinkerpop.apache.org/providers.html

## Installing the project on your computer or server

> This project can be run in any OS but all the instructions of this readme only supports a Unix based OS (like Linux or MacOS).
> If you want to install on MS Windows you should use a compatibility layer with Linux like the "Linux Bash Shell" of Windows 10.

1. Make sure the full path to this repo does not contain any spaces because that breaks gremlin database (the database that runs in local).

2. Make sure you have Java installed (JDK or OpenJDK), at least version 8 (or 1.8 it's the same). It's required to run gremlin database. To verify that Java is installed or which version you have, run the command `java -version`. If you don't have it, in an Ubuntu compatible OS you can install it with `sudo apt install default-jdk`. [In MacOS you can instal it with Brew](https://devqa.io/brew-install-java/).

3. Make sure you have Node.js installed at least version 14, to verify run `node -v`. If you don't have it download from nodejs.org or better: [using NVM (Node Version Manager)](https://tecadmin.net/install-nodejs-with-nvm/)

4. Duplicate the file `.env.example` and rename it: `.env`. In Unix you can use this command: `cp .env.example .env`. If you are in a server you may need to change the IMAGES_HOST variable in the .env file replacing localhost with the server public address.

5. Repeat the previous step in the dashboard subfolder

6. **Optional**: To enable the dashboard (an admin page of the server) open the /websites/dashboard/.env file you created in the previous step and complete the missing variable `REACT_APP_FACEBOOK_APP_ID` with the App ID of your Facebook app, this is required because the login in the dashboard and in the mobile app works with Facebook, for both you need to create one Facebook app in the Facebook developer panel ([more info here](https://developers.facebook.com/docs/development/)). If you are installing on a production server you'll also need a domain configured to serve the dashboard in https, otherwise the login in the dashboard will throw a security error, this is a Facebook requirement.

7. Run: `npm install`

8. **Optional**: To install a database visualizer application to use in local development run: `npm run install-visualizer`

That's all.
To run the project keep reading.

## Running the project on your computer or server

> There are many commands to start the server, use the one that you need depending if you need to make code changes or you are running in production with a specific infrastructure.

### If you want to make code changes first run

```
npm run dev
```

This runs the server with error reporting and automatic restart when the code changes. Also database information is not permanent between restarts (when pressing Ctrl + C), this is recommended to force user registration to be well debugged.

```
npm run dev-persistent
```

The same than `npm run dev` but in this case the database information is persistent (all backup logic enabled)

### To run the server in production

```
npm start
```

This runs everything, the database and the application logic. The database has a schedule of backups every day, week and month, also makes a backup when the applications exits and when application starts restores the backup if any. The database is memory only, so making backups in files is the way to not lose the information.

### To stop the server in production

```
npm run stop
```

If you want the server to be updated to the latest changes call this command and then `npm start` again.
This command makes a backup of the database before closing (otherwise latest database data is lost).
Also call this when restarting or turning off the server so there is no database information lost.

### **Optional**: Database visualizer application (see installation step 8 if it's not installed):

```
npm run visualizer
```

Then run a query like `g.V()`

## Other commands

### Run the project without database (for production):

```
npm run no-database
```

This is useful when you want to run the database in another server or you have a managed database service like AWS Neptune so you don't need to run the database. You need to change the .env file for this setup.

### Only run the database (for production):

```
npm run database-only
```

This is useful if you want to run the database in one server and the application logic in another one. This command starts the database and a node.js application that schedules database backups every day, week, month and at exit (same than npm start). Could be an alternative to a managed database service.

### Run the tests (optionally with coverage or in watch mode):

```
npm run test
npm run test:coverage
npm run test:watch
```

### Format the code with Prettier (required for commits):

```
npm run format
```

### Lint the code with TSLint:

```
npm run lint
```

### About PM2:

The production (for final users) commands works with PM2, which is a wrapper of node that converts the process into a deamon process (a process that will not close when closing terminal). You can manage and view information about processes with the `pm2` command, see thier [documentation](https://pm2.keymetrics.io/docs/usage/pm2-doc-single-page/).

## Tutorial to upload to AWS Elastic Beanstalk + AWS Neptune (incomplete)

1. Follow [this tutorial](https://medium.com/@sommershurbaji/deploying-a-docker-container-to-aws-with-elastic-beanstalk-28adfd6e7e95) to upload the code:

## Tutorial to upload to Azure App Engine + Cosmos DB (incomplete)

> :warning: :warning: :warning: Only use Azure Cosmos DB to host the database if they implemented Gremlin bytecode see [this thread](https://feedback.azure.com/forums/263030-azure-cosmos-db/suggestions/33632779-support-gremlin-bytecode-to-enable-the-fluent-api?page=1&per_page=20). At the moment of writing this they didn't implement it yet. Not implementing this feature means that this project does not work with Cosmos DB. Also means you need to write the queries in a specific way that only works on thier servers, making the code incompatible with other hosting providers and community tools and libraries.

1. At the root of this project rename `.env.example` file to `.env` and fill the variables of that file with the information from [this tutorial](https://docs.microsoft.com/en-us/azure/cosmos-db/create-graph-nodejs#update-your-connection-string) that you need to follow to create the database.
2. Download and install Visual Studio Code from the official page: https://code.visualstudio.com/
3. Install `Azure Tools` extension for Visual Studio Code and upload the project following the instructions provided by the extension.

## Tutorial to upload to a server like Digital Ocean

1. Follow the instructions on [Installing the project on your computer or server](###installing-the-project-on-your-computer-or-server)
2. In the .env file change the port to 80 (also in the application client .env and in the dasboard/.env)
3. You need to be root to run a process in the port 80, if you are not then run these 2 commands:

   `sudo apt-get install libcap2-bin`

   `` sudo setcap 'cap_net_bind_service=+ep' `which node`  ``

   You may need to run them again in the future if you update node.

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
8. Run this: `certbot renew --pre-hook "pm2 stop poly" --post-hook "pm2 start poly"`

## Git hooks

The project contains a pre-commit git hook which checks the code with Prettier and a pre-push hook for checking TSLint. You can disable these hooks by adding `--no-verify` flag to your `git commit` or `git push` command.

## Docker

You can build the project as a Docker image with a standard `docker build` command. The commands below let you quickly build and run on port 80:

```
docker build -t node-ts:latest .
docker run --rm -it -p 80:8080 --pid=host node-ts:latest
```

The server should be available under your Docker machine address, for example:

```
http://localhost/
```

The container will be removed when you press `Ctrl+C`.

## Actions

The project contains a simple GitHub Action Workflow which uses the Docker images to build and run various tests on the image. You can extend it to release and deploy the application.
