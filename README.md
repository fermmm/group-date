# Poly server

> This project uses: **Node.js + Koa.js + TypeScript + "Tinkerpop3 Gremlin" for the database.**
>
> You need to be an experience developer and know how to code in these technologies to modify the project. To create your own version without modifications you don't need to know how to code but you may need to have a programmer to guide you and someone who knows how to deploy a server project to Amazon or other provider.

It's recommended to run the database in a managed database compatible with gremlin like AWS Neptune and run the app logic in something like AWS Elastic Beanstalk.
Also Azure is working in similar compatible products: Azure App Engine + Cosmos DB.

You can also use a hosting provider for the code and another company hosting the database, but that may have a speed cost. [Here](http://tinkerpop.apache.org/providers.html) there is a list of all database hosting providers that supports Gremlin queries

You can also run everything in the same machine using any provider like Digital Ocean, that is easy and cheap at the beginning but when you have many users it's much more expensive.

# Table of contents

<!--ts-->

-  [Installing the project on your computer or server](readme/installing.md)
-  [Running the project and the different modes and commands](readme/running.md)
   -  [Development mode](readme/running.md#development-mode)
   -  [Running tests](readme/running.md#running-tests)
   -  [Formatting the code with Prettier](readme/running.md#formatting-the-code-with-prettier)
   -  [Production mode: All in one](readme/running.md#production-mode-all-in-one)
   -  [Production mode: Logic only](readme/running.md#production-mode-logic-only-no-database)
   -  [Production mode: Database only](readme/running.md#production-mode-database-only-no-logic)
   -  [About PM2](readme/running.md#about-pm2)
-  [Dashboard](readme/dashboard.md)
-  [Deploying to AWS](readme/deploying-aws.md)
-  [Deploying to Azure](readme/deploying-azure.md)
-  [Deploying to Digital Ocean or similar](readme/deploying-do.md)
-  [Setup HTTPS](readme/setup-https.md)
-  [If you cannot commit to git read this](readme/git-hooks.md)

<!--te-->
