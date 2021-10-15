import React, { FC, useEffect, useRef, useState } from "react";
import { DataSet, Network } from "vis-network/standalone";
import { GraphContainer } from "./styles.Graph";

interface PropsGraph {
   nodesHolder: DataSet<any, "id">;
   edgesHolder: DataSet<any, "id">;
   nodeIdSelected: string | number | undefined;
   edgeIdSelected: string | number | undefined;
   onNodeSelect: (nodeId: string | number | null) => void;
   onEdgeSelect: (edgeId: string | number | null) => void;
}

const Graph: FC<PropsGraph> = props => {
   const {
      nodesHolder,
      edgesHolder,
      nodeIdSelected,
      edgeIdSelected,
      onNodeSelect,
      onEdgeSelect
   } = props;
   const graphContainerRef = useRef<HTMLDivElement>(null);
   const [network, setNetwork] = useState<Network>();

   const graphOptions = {
      interaction: {
         selectConnectedEdges: false
      },
      physics: {
         forceAtlas2Based: {
            gravitationalConstant: -26,
            centralGravity: 0.005,
            springLength: 230,
            springConstant: 0.18,
            avoidOverlap: 1.5
         },
         maxVelocity: 40,
         solver: "forceAtlas2Based",
         timestep: 0.35,
         stabilization: {
            enabled: true,
            iterations: 50,
            updateInterval: 25
         }
      },
      nodes: {
         shape: "dot",
         size: 20,
         borderWidth: 1,
         font: {
            color: "white",
            size: 13
         }
      },
      edges: {
         width: 2,
         font: {
            size: 12
         },
         smooth: {
            enabled: true,
            type: "dynamic",
            roundness: 1
         }
      }
   };

   useEffect(() => {
      if (graphContainerRef.current == null) {
         return;
      }

      const network = new Network(
         graphContainerRef.current,
         { nodes: nodesHolder, edges: edgesHolder },
         graphOptions
      );
      setNetwork(network);

      network.on("selectNode", params => {
         const nodeId: string | number =
            params.nodes && params.nodes.length > 0 ? params.nodes[0] : null;
         onNodeSelect(nodeId);
      });

      network.on("selectEdge", params => {
         const edgeId: string | number =
            params.edges && params.edges.length === 1 ? params.edges[0] : null;
         if (edgeId !== null) {
            onEdgeSelect(edgeId);
         }
      });

      network.on("deselectNode", () => {
         onNodeSelect(null);
      });

      network.on("deselectEdge", () => {
         onEdgeSelect(null);
      });
   }, [graphContainerRef]);

   useEffect(() => {
      if (nodeIdSelected == null || network == null) {
         return;
      }
      network.selectNodes([nodeIdSelected]);
   }, [nodeIdSelected]);

   useEffect(() => {
      if (edgeIdSelected == null || network == null) {
         return;
      }
      // There is a bug with this line, seems to be something internal of vis-network
      // network.selectEdges([edgeIdSelected]);
   }, [edgeIdSelected]);

   return <GraphContainer ref={graphContainerRef}>Graph</GraphContainer>;
};

export default React.memo(Graph);
