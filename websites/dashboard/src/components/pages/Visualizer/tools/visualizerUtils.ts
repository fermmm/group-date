import _ from "lodash";

export interface GremlinElement<T = Record<string, number | string | boolean>> {
   label: string;
   id: string | number;
   from?: string;
   to?: string;
   properties: T;
   [k: string]: any;
}

export interface NodeLabelInfo {
   type: string;
   field: string;
}

const selectRandomField = (obj: Record<string, number | string | boolean>) => {
   let result;
   // Set the first key as the result just in case
   for (result in obj) break;

   // Try to find a key "name" because it's probably the better option
   for (let key in obj) {
      if (key.toLocaleLowerCase() === "name") {
         result = key;
      }
   }

   // If the key name is not found maybe we can find a key where part of the name includes "name"
   if (result.toLocaleLowerCase() !== "name") {
      for (let key in obj) {
         if (key.toLowerCase().includes("name")) {
            result = key;
         }
      }
   }

   return result;
};

export const getDiffNodes = (newList: GremlinElement[], oldList: GremlinElement[]) => {
   return _.differenceBy(newList, oldList, node => node.id);
};

export const getDiffEdges = (newList: GremlinElement[], oldList: GremlinElement[]) => {
   return _.differenceBy(newList, oldList, edge => `${edge.from},${edge.to}`);
};

export const extractEdgesAndNodes = (
   nodeList: GremlinElement[],
   oldNodeLabels: NodeLabelInfo[] = []
) => {
   let edges: any = [];
   const nodes: any = [];
   const nodeLabels = [...oldNodeLabels];

   const nodeLabelMap = _.mapValues(_.keyBy(nodeLabels, "type"), "field");

   _.forEach(nodeList, node => {
      const type = node.label;
      // if (!nodeLabelMap[type]) {
      const field = selectRandomField(node.properties);
      const nodeLabel = { type, field };
      nodeLabels.push(nodeLabel);
      nodeLabelMap[type] = field;
      // }
      const labelField = nodeLabelMap[type];
      const label = labelField in node.properties ? node.properties[labelField] : type;
      nodes.push({
         id: node.id,
         label: String(label),
         group: node.label,
         properties: node.properties,
         type
      });

      edges = edges.concat(
         _.map(node.edges, edge => ({
            ...edge,
            type: edge.label,
            arrows: { to: { enabled: true, scaleFactor: 0.5 } }
         }))
      );
   });

   return { edges, nodes, nodeLabels };
};

export const findNodeById = (nodeList: GremlinElement[], id: string) => {
   return _.find(nodeList, node => node.id === id);
};

export const stringifyObjectValues = (obj: GremlinElement) => {
   _.forOwn(obj, (value, key) => {
      if (!_.isString(value)) {
         obj[key] = JSON.stringify(value);
      }
   });
};
