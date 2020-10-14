# Polyamory group dating app server

This is the server code for a group dating app, it's similar to Tinder but in this case when many people likes each other forming a group this enables a group chat so users can organize a group date. This is useful to experiment what polyamory enables, it's the most polyamory dating app possible. Only group dating with a minimum of 3 members is supported in the code, no couple dating supported.

> This project uses: **Node.js + Koa.js + TypeScript + "Tinkerpop3 Gremlin" for the database.**
>
> You need to be an experience developer and know how to code in these technologies to modify the project. To create your own version of the project you don't need to know how to code but you may need to have a programmer to guide you.

You can run all in local for development or host it on a hosting provider that supports Node.js and a graph database hosting that supports Gremlin queries, for example: AWS Elastic Beanstalk + AWS Neptune (recommended) or Azure App Engine + Cosmos DB.

You can also use a hosting provider for the code and another company hosting the database, here is a list of database hosting providers that supports Gremlin queries:
http://tinkerpop.apache.org/providers.html

## Tutorial to upload to AWS Elastic Beanstalk + AWS Neptune (recommended)

1. Follow [this tutorial](https://medium.com/@sommershurbaji/deploying-a-docker-container-to-aws-with-elastic-beanstalk-28adfd6e7e95) to upload the code:

## Tutorial to upload to Azure App Engine + Cosmos DB

> :warning: :warning: :warning: Only use Azure Cosmos DB to host the database if they implemented Gremlin bytecode see [this thread](https://feedback.azure.com/forums/263030-azure-cosmos-db/suggestions/33632779-support-gremlin-bytecode-to-enable-the-fluent-api?page=1&per_page=20). At the moment of writing this they didn't implement it yet. Not implementing this feature means that this project does not work with Cosmos DB. Also means you need to write the queries in a specific way that only works on thier servers, making the code incompatible with other hosting providers and community tools and libraries.

1. At the root of this project rename `.env.example` file to `.env` and fill the variables of that file with the information from [this tutorial](https://docs.microsoft.com/en-us/azure/cosmos-db/create-graph-nodejs#update-your-connection-string) that you need to follow to create the database.
2. Download and install Visual Studio Code from the official page: https://code.visualstudio.com/
3. Install `Azure Tools` extension for Visual Studio Code and upload the project following the instructions provided by the extension.

## Tutorial to install the project on your local computer (in case you are going to modify the project)

1. Make sure the full path to this repo does not contain any spaces because that breaks gremlin database (the database that runs in local for development).

2. Make sure you have Java installed, at least version 8 (or 1.8). It's required to run gremlin database. To verify that Java is installed or which version you have, run the command `java -version`. If you don't have it, install the [latest Java Development Kit (JDK) from Oracle](https://www.oracle.com/technetwork/java/javase/downloads/jdk8-downloads-2133151.html) or [OpenJDK](https://openjdk.java.net/)

3. Make sure you have Node.js installed at least version 8.10.0, if you don't have it download from nodejs.org or using NVM (Node Version Manager)

4. Duplicate the file `.env.example` and rename it: `.env`

5. Run: `npm install`

6. **Optional**: To install a database visualizer application to use in local development run: `npm run install-visualizer`

That's all.
To run the project keep reading.

## Running the project in local (in case you are going to modify the project)

Linux / MacOS: Start a local development server with automatic restart

```
npm run dev
```

Windows: Start a local development server with automatic restart

```
npm run dev-win
```

**Optional**: Database visualizer application (see installation step 6 if it's not installed):

```
npm run visualizer
```

Then run a query like `g.V()`

## Other commands

Build the project:

```
npm run build
```

Run the tests (optionally with coverage or in watch mode):

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

The project contains a simple GitHub Action Workflow which uses the Docker images to build and run various tests on the image. You can extend it to release and deploy the application.
