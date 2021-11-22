import React, { FC, useEffect, useRef, useState } from "react";
import { DataSet } from "vis-network/standalone";
import { visualizerGet } from "../../../api/server/visualizer";
import Graph from "./Graph/Graph";
import {
   extractEdgesAndNodes,
   getDiffEdges,
   getDiffNodes,
   GremlinElement,
   NodeLabelInfo,
} from "./tools/visualizerUtils";
import { SearchPartContainer, VisualizerContainer } from "./styles.Visualizer";
import Header from "./Header/Header";
import Panel from "./Panel/Panel";
import useUserChangesUrlWatcher, {
   getUrlParameter,
   setUrlParameter,
} from "../../../common-tools/browser/url-tools";

export type OnSearchFunc = (props: {
   query: string;
   nodeLimit?: number;
   reset?: boolean;
   saveOnUrl?: boolean;
   visualize?: boolean;
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
   const [selectedElementType, setSelectedElementType] = useState<"edge" | "node">();
   const queryFromUrlParams = getUrlParameter("visualizer-search");
   const lastQuery = useRef<string>();
   const lastNodeLimit = useRef<number>();

   const sendQueryFromUrlParams = () => {
      if (queryFromUrlParams != null) {
         handleSendQuery({ query: queryFromUrlParams, saveOnUrl: false });
      }
   };

   // Effect to send the query at the url params at mount
   useEffect(sendQueryFromUrlParams, []);

   // This sends the query from the url params when the user presses back button on the browser
   useUserChangesUrlWatcher(sendQueryFromUrlParams);

   // Effect to select the first node if nothing is selected after search results arrive
   useEffect(() => {
      if (nodeIdSelected == null && edgeIdSelected == null && allNodes?.length > 0) {
         handleSelectNode(allNodes[0].id);
      }
   }, [allNodes]);

   const handleSendQuery: OnSearchFunc = async props => {
      const { query, nodeLimit = 150, reset = true, saveOnUrl = true, visualize = true } = props;

      setLoading(true);

      const result = await visualizerGet({ query, nodeLimit });

      if (!visualize) {
         setLoading(false);
         return;
      }

      lastQuery.current = query;
      lastNodeLimit.current = nodeLimit;
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

   const handleSelectNode = (nodeId: string | number | undefined) => {
      setNodeIdSelected(nodeId);
      setSelectedElementType("node");
   };
   const handleSelectEdge = (edgeId: string | number | undefined) => {
      setEdgeIdSelected(edgeId);
      setSelectedElementType("edge");
   };

   const handleNextClick = () => {
      if (selectedElementType === "node") {
         const index = allNodes.findIndex(node => node.id === nodeIdSelected);
         const nextIndex = index === allNodes.length - 1 ? 0 : index + 1;
         const nextElementId = allNodes[nextIndex].id;
         handleSelectNode(nextElementId);
      } else {
         const index = allEdges.findIndex(edge => edge.id === edgeIdSelected);
         const nextIndex = index === allEdges.length - 1 ? 0 : index + 1;
         const nextElementId = allEdges[nextIndex].id;
         handleSelectEdge(nextElementId);
      }
   };

   const handlePrevClick = () => {
      if (selectedElementType === "node") {
         const index = allNodes.findIndex(node => node.id === nodeIdSelected);
         const prevIndex = index === 0 ? allNodes.length - 1 : index - 1;
         const prevElementId = allNodes[prevIndex].id;
         handleSelectNode(prevElementId);
      } else {
         const index = allEdges.findIndex(edge => edge.id === edgeIdSelected);
         const prevIndex = index === 0 ? allEdges.length - 1 : index - 1;
         const prevElementId = allEdges[prevIndex].id;
         handleSelectEdge(prevElementId);
      }
   };

   const handleRefresh = async () => {
      setLoading(true);
      const result = await visualizerGet({ query: lastQuery.current, nodeLimit: lastNodeLimit.current });
      setLoading(false);
      const { nodes, edges } = extractEdgesAndNodes(result, nodeLabelsToShow);
      setAllNodes(nodes);
      setAllEdges(edges);
   };

   return (
      <VisualizerContainer>
         <SearchPartContainer>
            <Header defaultSearchInputValue={queryFromUrlParams} loading={loading} onSearch={handleSendQuery} />
            <Graph
               nodesHolder={nodeHolder}
               edgesHolder={edgeHolder}
               nodeIdSelected={nodeIdSelected}
               edgeIdSelected={edgeIdSelected}
               onNodeSelect={handleSelectNode}
               onEdgeSelect={handleSelectEdge}
            />
         </SearchPartContainer>
         <Panel
            allEdges={allEdges}
            allNodes={allNodes}
            nodeIdSelected={nodeIdSelected}
            edgeIdSelected={edgeIdSelected}
            onSearch={handleSendQuery}
            onNextClick={handleNextClick}
            onPrevClick={handlePrevClick}
            onRefresh={handleRefresh}
         />
      </VisualizerContainer>
   );
};

export default Visualizer;
