## Installing the project on your computer or server

> This project can be run in any OS but all the instructions of this readme only supports a Unix based OS (like Linux or MacOS).
> If you want to install on MS Windows you should use a compatibility layer with Linux like the "Linux Bash Shell" of Windows 10.

1. Make sure the full path to this repo does not contain any spaces because that breaks gremlin database (the database that runs in local).

2. Make sure you have Java installed (JDK or OpenJDK), at least version 8 (or 1.8 it's the same). It's required to run gremlin database. To verify that Java is installed or which version you have, run the command `java -version`. If you don't have it, in an Ubuntu compatible OS you can install it with `sudo apt install default-jdk`. [In MacOS you can instal it with Brew](https://devqa.io/brew-install-java/).

3. Make sure you have Node.js at least version 14, to verify run `node -v`. If it's not installed you should follow these steps:

   1. Make sure you have curl installed on your system: `sudo apt update && sudo apt install curl -y`
   2. Install nvm (Node Version Manager) for current logged user: `curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.38.0/install.sh | bash`
   3. Refresh system environment to have nvm command available, in Debian based systems: `source ~/.profile`, in CentOS, Fedora and Redhat systems: `source ~/.bashrc`
   4. Install latest Node.js version: `nvm install lts/*`
   5. Set the Node.js version just installed as the permanent to use: `nvm alias default node`

4. Duplicate the file `.env.example` and rename it: `.env`. In Unix you can use this command: `cp .env.example .env`. If you are in a server you may need to change the IMAGES_HOST variable in the .env file replacing localhost with the server public address.

5. Repeat the previous step in the dashboard subfolder

6. **Optional**: To enable the dashboard (an admin page of the server) open the /websites/dashboard/.env file you created in the previous step and complete the missing variable `REACT_APP_FACEBOOK_APP_ID` with the App ID of your Facebook app, this is required because the login in the dashboard and in the mobile app works with Facebook, for both you need to create one Facebook app in the Facebook developer panel ([more info here](https://developers.facebook.com/docs/development/)). If you are installing on a production server you'll also need a domain configured to serve the dashboard in https, otherwise the login in the dashboard will throw a security error, this is a Facebook requirement.

7. Run: `npm install`

8. **Optional**: To install a database visualizer application to use in local development run: `npm run install-visualizer`

That's all.
