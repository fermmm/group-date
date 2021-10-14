import React, { FC, useEffect, useState } from "react";
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
import useUserChangesUrlWatcher, {
   getUrlParameter,
   setUrlParameter
} from "../../../common-tools/browser/url-tools";

export type OnSearchFunc = (props: {
   query: string;
   nodeLimit?: number;
   reset?: boolean;
   saveOnUrl?: boolean;
}) => void;

const Visualizer: FC = () => {
   const [loading, setLoading] = useState(false);
   const [allNodes, setAllNodes] = useState<GremlinElement[]>([]);
   const [allEdges, setAllEdges] = useState<GremlinElement[]>([]);
   const [nodeLabelsToShow, setNodeLabelsToShow] = useState<NodeLabelInfo[]>([]);
   const [nodeHolder] = useState(new DataSet([]));
   const [edgeHolder] = useState(new DataSet([]));
   const [nodeIdSelected, setNodeIdSelected] = useState<string | number>();
   const [edgeIdSelected, setEdgeIdSelected] = useState<string | number>();

   const sendQueryFromUrlParams = () => {
      const queryFromUrlParams = getUrlParameter("visualizer-search");
      if (queryFromUrlParams != null) {
         handleSendQuery({ query: queryFromUrlParams, saveOnUrl: false });
      }
   };

   useUserChangesUrlWatcher(sendQueryFromUrlParams);
   useEffect(sendQueryFromUrlParams, []);

   const handleSendQuery: OnSearchFunc = async props => {
      const { query, nodeLimit = 150, reset = true, saveOnUrl = true } = props;

      setLoading(true);
      const result = await visualizerGet({ query, nodeLimit });
      const { nodes, edges, nodeLabels = [] } = extractEdgesAndNodes(result, nodeLabelsToShow);

      // Saving the current query on the url makes possible to go back and open new window without losing state.
      if (saveOnUrl) {
         setUrlParameter({ key: "visualizer-search", value: query });
      }

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
            onSearch={handleSendQuery}
         />
      </VisualizerContainer>
   );
};

export default Visualizer;
