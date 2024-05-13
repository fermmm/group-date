## Tutorial to upload to Azure App Engine + Cosmos DB (incomplete)

> :warning: :warning: :warning: Only use Azure Cosmos DB to host the database if they implemented Gremlin bytecode see [this thread](https://github.com/Azure/azure-cosmos-dotnet-v2/issues/439). At the moment of writing this they didn't implement it yet. Not implementing this feature means that this project does not work with Cosmos DB. Also means you need to write the queries in a specific way that only works on their servers, making the code incompatible with other hosting providers, community tools and libraries.

1. At the root of this project rename `.env.example` file to `.env` and fill the variables of that file with the information from [this tutorial](https://docs.microsoft.com/en-us/azure/cosmos-db/create-graph-nodejs#update-your-connection-string) that you need to follow to create the database.
2. Download and install Visual Studio Code from the official page: https://code.visualstudio.com/
3. Install `Azure Tools` extension for Visual Studio Code and upload the project following the instructions provided by the extension.
