"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.exportEdges = exports.exportNodes = void 0;
const database_manager_1 = require("../../database-manager");
async function exportNodes() {
    let result = "";
    const queryResult = (await database_manager_1.g.V().valueMap(true).by(database_manager_1.__.unfold()).toList());
    queryResult.forEach(node => {
        let id;
        let label;
        let properties = {};
        node.forEach((value, key) => {
            if (value == null) {
                return;
            }
            if (typeof key === "object") {
                if (key.elementName === "label") {
                    label = value;
                }
                if (key.elementName === "id") {
                    id = value;
                }
            }
            if (typeof key === "string") {
                properties[key] = value;
            }
        });
        result += fromNodeInfoToQueryLine(id, label, properties) + ";\n";
    });
    return result;
}
exports.exportNodes = exportNodes;
async function exportEdges() {
    let result = "";
    const queryResult = (await database_manager_1.g
        .E()
        .project("edge", "inV", "outV")
        .by(database_manager_1.__.valueMap(true).by(database_manager_1.__.unfold()))
        .by(database_manager_1.__.inV().id())
        .by(database_manager_1.__.outV().id())
        .toList());
    queryResult.forEach(edge => {
        let id;
        let label;
        let properties = {};
        let inV;
        let outV;
        edge.forEach((value, key) => {
            if (key === "inV") {
                inV = value;
            }
            if (key === "outV") {
                outV = value;
            }
            if (key === "edge") {
                value.forEach((edgeValue, edgeKey) => {
                    if (edgeValue == null) {
                        return;
                    }
                    if (typeof edgeKey === "object") {
                        if (edgeKey.elementName === "label") {
                            label = edgeValue;
                        }
                        if (edgeKey.elementName === "id") {
                            id = edgeValue;
                        }
                    }
                    if (typeof edgeKey === "string") {
                        properties[edgeKey] = edgeValue;
                    }
                });
            }
        });
        result += fromEdgeInfoToQueryLine(id, label, properties, inV, outV) + ";\n";
    });
    return result;
}
exports.exportEdges = exportEdges;
/**
 * With the info of a node, returns a query line that when is executed it adds the same node to the database.
 */
function fromNodeInfoToQueryLine(nodeId, nodeLabel, nodeProperties) {
    let result = `g.addV("${nodeLabel}").property(id, ${typeof nodeId === "string" ? `"${nodeId}"` : nodeId})`;
    Object.keys(nodeProperties).forEach(key => {
        result += `.property("${key}", ${typeof nodeProperties[key] === "string" ? `"${nodeProperties[key]}"` : nodeProperties[key]})`;
    });
    return result;
}
/**
 * With the info of an edge, returns a query line that when is executed it adds the same edge to the database, the
 * nodes should already be added otherwise the returned query will do nothing.
 */
function fromEdgeInfoToQueryLine(edgeId, edgeLabel, edgeProperties, inV, outV) {
    let result = `g.V(${typeof outV === "string" ? `"${outV}"` : outV}).as("a")`;
    result += `.V(${typeof inV === "string" ? `"${inV}"` : inV}).as("b")`;
    result += `.addE("${edgeLabel}").from("a").to("b")`;
    result += `.property(id, ${typeof edgeId === "string" ? `"${edgeId}"` : edgeId})`;
    Object.keys(edgeProperties).forEach(key => {
        result += `.property("${key}", ${typeof edgeProperties[key] === "string" ? `"${edgeProperties[key]}"` : edgeProperties[key]})`;
    });
    return result;
}
//# sourceMappingURL=exporter.js.map