/*
   TODO: Ver como se usa .ENV aca y usar eso por que este archivo no lo va a tomar el 
   compilador en esta ruta y no da ponerlo en otro lado
*/

var config = {}

config.endpoint = "wss://DATABASE_ACCOUNT_NAME.gremlin.cosmosdb.azure.com:443/gremlin";
config.primaryKey = "PRIMARYKEY";
config.database = "GRAPHDATABASE"
config.collection = "GRAPHCOLLECTION"

module.exports = config;
