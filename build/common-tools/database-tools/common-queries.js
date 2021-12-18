"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.databaseIsEmpty = exports.queryToCreateVerticesFromObjects = exports.valueMap = void 0;
const data_conversion_tools_1 = require("./data-conversion-tools");
const database_manager_1 = require("./database-manager");
function valueMap(traversal) {
    return traversal.valueMap().by(database_manager_1.__.unfold());
}
exports.valueMap = valueMap;
/**
 * Given a list of objects, creates vertices with the same properties. Be aware this is done all in the
 * same query and Gremlin has a limit on the query size, if the query never responds you need to divide
 * the list of objects in chunks and call this multiple times.
 * Also be aware that the properties of the first object will be created, properties from following objects
 * that are not present in the first one will be ignored.
 *
 * @param objects The objects list to create vertices from them.
 * @param label The label of the vertices
 * @param duplicationAvoidanceProperty Property name usually the id, if a vertex already exists with the same value on this property then the vertex will not be created
 * @param serializeProperties Serialize all properties to types that are compatible with Gremlin. default = true
 */
function queryToCreateVerticesFromObjects(props) {
    let { objects, label, duplicationAvoidanceProperty, serializeProperties = true, currentTraversal } = props;
    if (currentTraversal == null) {
        currentTraversal = database_manager_1.g;
    }
    let objectsReadyForDB;
    objectsReadyForDB = !serializeProperties ? objects : objects.map(o => data_conversion_tools_1.serializeAllValuesIfNeeded(o));
    let creationTraversal = database_manager_1.__.addV(label);
    Object.keys(objectsReadyForDB[0]).forEach(
    // For some reason the cardinality doesn't work here (probably a gremlin bug) but it does not matter because its a new vertex
    key => (creationTraversal = creationTraversal.property(/*cardinality.single,*/ key, database_manager_1.__.select(key))));
    if (duplicationAvoidanceProperty == null) {
        return currentTraversal.inject(objectsReadyForDB).unfold().map(creationTraversal);
    }
    else {
        return currentTraversal
            .inject([])
            .as("nothing")
            .inject(objectsReadyForDB)
            .unfold()
            .map(database_manager_1.__.as("data")
            .select(duplicationAvoidanceProperty)
            .as("dap")
            .select("data")
            .choose(database_manager_1.__.V()
            .hasLabel(label)
            .has(duplicationAvoidanceProperty, database_manager_1.__.where(database_manager_1.P.eq("dap"))), database_manager_1.__.select("nothing"), creationTraversal))
            .unfold();
    }
}
exports.queryToCreateVerticesFromObjects = queryToCreateVerticesFromObjects;
async function databaseIsEmpty() {
    return (await database_manager_1.g.V().limit(1).toList()).length === 0 && (await database_manager_1.g.E().limit(1).toList()).length === 0;
}
exports.databaseIsEmpty = databaseIsEmpty;
//# sourceMappingURL=common-queries.js.map