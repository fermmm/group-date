# Server for a group dating app

This project uses Node + Express + TypeScript for the API and "Tinkerpop3 Gremlin" for the database .

You can run all in local for developing or host it on a hosting provider that supports Node.js and Gremlin, for example: AWS Elastic Beanstalk + AWS Neptune (recommended) or Azure App Engine + Cosmos DB. Both AWS and Azure are free on the begginning (except for Neptune).
Or you can use a hosting provider for the code and another hosting provider company for the database, here is a list of compatible database hosting providers:
http://tinkerpop.apache.org/providers.html

## Uploading to AWS Elastic Beanstalk + AWS Neptune (recommended)
1. Follow [this tutorial](https://medium.com/@sommershurbaji/deploying-a-docker-container-to-aws-with-elastic-beanstalk-28adfd6e7e95) to upload the code:


## Uploading to Azure App Engine + Cosmos DB
> :warning: :warning: :warning: Only use Azure Cosmos DB to host the database if they implemented Gremlin bytecode see [this thread](https://feedback.azure.com/forums/263030-azure-cosmos-db/suggestions/33632779-support-gremlin-bytecode-to-enable-the-fluent-api?page=1&per_page=20). At the moment of writing this they didn't implement it yet. Not implementing this feature means that this project does not work with Cosmos DB. Also means you need to write the queries in a specific way that only works on thier servers, making the code incompatible with other hosting providers and community tools and libraries.

1. At the root of this project rename ``.env.example`` file to ``.env`` and fill the variables of that file with the information from [this tutorial](https://docs.microsoft.com/en-us/azure/cosmos-db/create-graph-nodejs#update-your-connection-string) that you need to follow to create the database. 
2. Download and install Visual Studio Code from the official page: https://code.visualstudio.com/
3. Install ``Azure Tools`` extension for Visual Studio Code and upload the project following the instructions provided by the extension.

## Installing on your local computer (in case you are going to modify the project)

1. Make sure you have Node.js installed at least version 8.10.0, if you don't have it download from nodejs.org or using NVM (Node Version Manager)

2. For running the Gremlin database make sure you have Java installed, at least version 8. 
To verify that Java is installed and the version, run the command ```java –version```
If you do not have it, install the [latest Java Development Kit (JDK) from Oracle](https://www.oracle.com/technetwork/java/javase/downloads/jdk8-downloads-2133151.html) or  [OpenJDK](https://openjdk.java.net/)

3. Go to: http://tinkerpop.apache.org/ and download Gremlin Server

4. Unzip gremlin server into the permanent location you want like ``/home/(user)/`` in Linux/MacOS or ``C:/Program Files`` in Windows.

5. Notice that there is a ``/bin`` folder in the downloaded gremlin server, we are going to add that folder into the PATH environment variables.

   In Ubuntu open ``/home/(user)/.bashrc`` in MacOS open or create ``/home/(user)/.bash_profile``
   
6. Add the following line at the end of the opened file replacing the example path to your correct bin folder path:

   ```export PATH=/home/(user)/gremlin-server/bin/:$PATH```
   
   Save and restart the console and if you see some text instructions when running ```gremlin-server.sh``` on the console, then you are done with this step, If not then search on the web how to add environment variables to PATH (for your OS) and add (gremlin server folder)/bin to it.

   In Windows you must search on the web "how to add a folder to environment variables" for your version of windows and add (gremlin server folder)/bin to it.
   If you run gremlin-server.bat in the console and see some text instructions you are done with this step.

6. **Optional**: If you want to use the gremlin console download it from http://tinkerpop.apache.org/ and repeat step 5 with the gremlin console /bin folder to install it.

7. **Optional** If you want to use Visual Studio Code you can optionally follow this:

Configure default build and test tasks by pasting this into `.vscode/tasks.json`:

```json
{
  "version": "2.0.0",
  "tasks": [
    {
      "label": "Start",
      "type": "npm",
      "script": "dev",
      "group": {
        "kind": "build",
        "isDefault": true
      }
    },
    {
      "label": "Test",
      "type": "npm",
      "script": "test:watch",
      "group": {
        "kind": "test",
        "isDefault": true
      }
    }
  ]
}
```

Configure the debugger to attach to a running Node process by pasting this into `.vscode/launch.json`:

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "type": "node",
      "request": "attach",
      "name": "Attach to Node",
      "address": "localhost",
      "port": 5858,
      "restart": true,
      "protocol": "inspector"
    }
  ]
}
```

## Running the project in local (in case you are going to modify the project)

Start the database (Linux / MacOS only) 

```
gremlin-server.sh start
```

Start the database (Windows only) 

```
gremlin-server.bat start
```

Start a local development server with automatic restart:

```
npm run dev
```

## Other commands

Build the project:

```
npm run build
```

Test the project (optionally with coverage or in watch mode):

```
npm run test
npm run test:coverage
npm run test:watch
```

Format the code with Prettier (required for commits):

```
npm run format
```

Lint the code with TSLint:

```
npm run lint
```

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

The project contains a simple GitHub Action Workflow which uses the Docker images to build and run various tests on the image. You can extend it to release and deploy your applications.
