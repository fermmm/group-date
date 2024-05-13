## Installing the project on your computer or server

> This project can be run in any OS but all the instructions of this readme only supports a Unix based OS (like Linux or MacOS).
> If you want to install on MS Windows you should use a compatibility layer with Linux like the "Linux Bash Shell" of Windows 10.

1. Make sure the full path to this repo does not contain any spaces because that breaks gremlin database (the database that runs in local).

2. Make sure you have Java installed (JDK or OpenJDK), at least version 8 (or 1.8 it's the same). It's required to run gremlin database. To verify that Java is installed or which version you have, run the command `java -version`. If you don't have it, in an Ubuntu compatible OS you can install it with `sudo apt install default-jdk`. [In MacOS you can instal it with Brew](https://devqa.io/brew-install-java/).

3. Make sure you have Node.js at least version 14, to verify run `node -v`. If it's not installed you should follow these steps:

   1. Make sure you have curl installed on your system: ```sudo apt update && sudo apt install curl -y```
   2. Install Volta (It's a Node Version Manager): ```curl https://get.volta.sh | bash```
   3. Close the console or the ssh session and reopen it to have the ```volta``` command available
   4. Install a default Node.js and Yarn version: ```volta install node```
   5. Now run ```node --version``` and you should see the version of the node installed

4. Duplicate the file `.env.example` and rename it: `.env`. In Unix you can use this command: `cp .env.example .env`. Also do it on the **/websites/dashboard** folder.

5. **Optional**: To enable the dashboard (an admin page of the server) follow the [dashboard setup steps](./dashboard.md).

6. Run: `npm install pm2@latest -g`

7. If you are going to do code changes on the machine run: `npm install`

That's all for installing.
