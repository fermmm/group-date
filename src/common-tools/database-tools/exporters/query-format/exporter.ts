import { g, __ } from "../../database-manager";

export async function exportNodes() {
   let result = "";
   const queryResult = (await g.V().valueMap(true).by(__.unfold()).toList()) as any;

   queryResult.forEach(node => {
      let id: string | number;
      let label: string;
      let properties: Object = {};

      node.forEach((value, key) => {
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

export async function exportEdges() {
   let result = "";

   const queryResult = (await g
      .E()
      .project("edge", "inV", "outV")
      .by(__.valueMap(true).by(__.unfold()))
      .by(__.inV().id())
      .by(__.outV().id())
      .toList()) as any;

   queryResult.forEach(edge => {
      let id: string | number;
      let label: string;
      let properties: Object = {};
      let inV: string | number;
      let outV: string | number;

      edge.forEach((value, key) => {
         if (key === "inV") {
            inV = value;
         }
         if (key === "outV") {
            outV = value;
         }
         if (key === "edge") {
            value.forEach((edgeValue, edgeKey) => {
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

function fromNodeInfoToQueryLine(nodeId: string | number, nodeLabel: string, nodeProperties: Object) {
   let result = `g.addV("${nodeLabel}").property(id, ${typeof nodeId === "string" ? `"${nodeId}"` : nodeId})`;
   Object.keys(nodeProperties).forEach(key => {
      result += `.property("${key}", ${
         typeof nodeProperties[key] === "string" ? `"${nodeProperties[key]}"` : nodeProperties[key]
      })`;
   });
   return result;
}

function fromEdgeInfoToQueryLine(
   edgeId: string | number,
   edgeLabel: string,
   edgeProperties: Object,
   inV: string | number,
   outV: string | number,
) {
   let result = `g.V(${typeof inV === "string" ? `"${inV}"` : inV}).as("a")`;
   result += `.V(${typeof outV === "string" ? `"${outV}"` : outV}).as("b")`;
   // TODO: Esto puede estar invertido, checkear bien
   result += `.addE("${edgeLabel}").from("a").to("b")`;
   result += `.property(id, ${typeof edgeId === "string" ? `"${edgeId}"` : edgeId})`;
   Object.keys(edgeProperties).forEach(key => {
      result += `.property("${key}", ${
         typeof edgeProperties[key] === "string" ? `"${edgeProperties[key]}"` : edgeProperties[key]
      })`;
   });
   return result;
}
