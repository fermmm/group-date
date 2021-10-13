import React, { FC, useState } from "react";
import { DataSet } from "vis-network/standalone";
import { visualizerGet } from "../../../api/server/visualizer";
import Graph from "./Graph/Graph";
import {
   extractEdgesAndNodes,
   getDiffEdges,
   getDiffNodes,
   GremlinElement,
   NodeLabelInfo
} from "./tools/visualizerUtils";
import { SearchPartContainer, VisualizerContainer } from "./styles.Visualizer";
import Header from "./Header/Header";
import Panel from "./Panel/Panel";

const Visualizer: FC = () => {
   const [loading, setLoading] = useState(false);
   const [allNodes, setAllNodes] = useState<GremlinElement[]>([]);
   const [allEdges, setAllEdges] = useState<GremlinElement[]>([]);
   const [nodeLabelsToShow, setNodeLabelsToShow] = useState<NodeLabelInfo[]>([]);
   const [nodeHolder] = useState(new DataSet([]));
   const [edgeHolder] = useState(new DataSet([]));
   const [nodeIdSelected, setNodeIdSelected] = useState<string | number>();
   const [edgeIdSelected, setEdgeIdSelected] = useState<string | number>();

   const handleSendQuery = async (query: string, nodeLimit: number, reset: boolean = true) => {
      setLoading(true);
      const result = await visualizerGet({ query, nodeLimit });
      const { nodes, edges, nodeLabels = [] } = extractEdgesAndNodes(result, nodeLabelsToShow);

      // Add new nodes
      if (reset) {
         setAllNodes([...nodes]);
         nodeHolder.clear();
         nodeHolder.add(nodes);
      } else {
         const onlyNewNodes = getDiffNodes(nodes, allNodes);
         setAllNodes([...allNodes, ...onlyNewNodes]);
         nodeHolder.add(onlyNewNodes);
      }

      // Add new edges
      if (reset) {
         setAllEdges([...edges]);
         edgeHolder.clear();
         edgeHolder.add(edges);
      } else {
         const onlyNewEdges = getDiffEdges(edges, allEdges);
         setAllEdges([...allEdges, ...onlyNewEdges]);
         edgeHolder.add(onlyNewEdges);
      }

      // Update node labels
      setNodeLabelsToShow(nodeLabels);

      setLoading(false);
   };

   return (
      <VisualizerContainer>
         <SearchPartContainer>
            <Header loading={loading} onSearch={handleSendQuery} />
            <Graph
               nodesHolder={nodeHolder}
               edgesHolder={edgeHolder}
               onNodeSelect={setNodeIdSelected}
               onEdgeSelect={setEdgeIdSelected}
            />
         </SearchPartContainer>
         <Panel
            allEdges={allEdges}
            allNodes={allNodes}
            nodeIdSelected={nodeIdSelected}
            edgeIdSelected={edgeIdSelected}
         />
      </VisualizerContainer>
   );
};

export default Visualizer;
