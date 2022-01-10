"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.nodesToJson = exports.makeQueryForVisualizer = void 0;
function makeQueryForVisualizer(query, nodeLimit) {
    const nodeLimitQuery = !isNaN(nodeLimit) && Number(nodeLimit) > 0 ? `.limit(${nodeLimit})` : "";
    query = `${query}${nodeLimitQuery}.dedup().as('node').project('id', 'label', 'properties', 'edges').by(__.id()).by(__.label()).by(__.valueMap().by(__.unfold())).by(__.outE().project('id', 'from', 'to', 'label', 'properties').by(__.id()).by(__.select('node').id()).by(__.inV().id()).by(__.label()).by(__.valueMap().by(__.unfold())).fold())`;
    return query;
}
exports.makeQueryForVisualizer = makeQueryForVisualizer;
function nodesToJson(nodeList) {
    return nodeList.map(node => ({
        id: node.get("id"),
        label: node.get("label"),
        properties: mapToObj(node.get("properties")),
        edges: edgesToJson(node.get("edges")),
    }));
}
exports.nodesToJson = nodesToJson;
function mapToObj(inputMap) {
    let obj = {};
    inputMap.forEach((value, key) => {
        obj[key] = value;
    });
    return obj;
}
function edgesToJson(edgeList) {
    return edgeList.map(edge => ({
        id: typeof edge.get("id") !== "string" ? JSON.stringify(edge.get("id")) : edge.get("id"),
        from: edge.get("from"),
        to: edge.get("to"),
        label: edge.get("label"),
        properties: mapToObj(edge.get("properties")),
    }));
}
//# sourceMappingURL=visualizer-proxy-tools.js.map