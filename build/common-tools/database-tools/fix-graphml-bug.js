"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.fixGraphMlBug = void 0;
const xml2js_1 = require("xml2js");
const files_tools_1 = require("../files-tools/files-tools");
/**
 * For some reason TinkerGraph database saves the edges with duplicated
 * ids, so when the backup is loaded it throws errors and loads a
 * corrupted version of the database. This fix loops through all the
 * edges in the xml and modifies their id to make them unique.
 */
function fixGraphMlBug(filePath) {
    const fileContantes = files_tools_1.getFileContent(filePath);
    xml2js_1.parseString(fileContantes, (err, result) => {
        var _a, _b, _c;
        const edges = (_c = (_b = (_a = result === null || result === void 0 ? void 0 : result.graphml) === null || _a === void 0 ? void 0 : _a.graph) === null || _b === void 0 ? void 0 : _b[0]) === null || _c === void 0 ? void 0 : _c.edge;
        if (edges == null) {
            return;
        }
        const newEdges = edges.map((edge, i) => {
            var _a;
            const newEdge = { ...edge };
            if (((_a = newEdge.$) === null || _a === void 0 ? void 0 : _a.id) == null) {
                return newEdge;
            }
            newEdge.$.id = i;
            return newEdge;
        });
        result.graphml.graph[0].edge = newEdges;
        var builder = new xml2js_1.Builder();
        var xml = builder.buildObject(result);
        files_tools_1.writeFile(filePath, xml);
    });
}
exports.fixGraphMlBug = fixGraphMlBug;
//# sourceMappingURL=fix-graphml-bug.js.map