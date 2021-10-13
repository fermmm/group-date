import React, { FC, useEffect, useState } from "react";
import { GremlinElement } from "../tools/visualizerUtils";
import GenericPropertiesTable, {
   PropsGenericPropertiesTable
} from "./DataSpecificPanels/GenericPropertiesTable/GenericPropertiesTable";
import UserPanel from "./DataSpecificPanels/UserPanel/UserPanel";
import { NodeElementTitle, PanelCard, PanelContainer } from "./styles.Panel";

interface PropsPanel {
   allNodes: GremlinElement[];
   allEdges: GremlinElement[];
   nodeIdSelected: string | number;
   edgeIdSelected: string | number;
}

const Panel: FC<PropsPanel> = props => {
   const { allNodes, allEdges, nodeIdSelected, edgeIdSelected } = props;
   const [elementToShow, setElementToShow] = useState<GremlinElement>();

   useEffect(() => {
      setElementToShow(allNodes.find(node => node.id === nodeIdSelected));
   }, [nodeIdSelected]);

   useEffect(() => {
      setElementToShow(allEdges.find(edge => edge.id === edgeIdSelected));
   }, [edgeIdSelected]);

   let Panel: React.FC<PropsGenericPropertiesTable>;
   switch (elementToShow?.type ?? "") {
      case "user":
         Panel = UserPanel;
         break;

      default:
         Panel = GenericPropertiesTable;
         break;
   }

   return (
      <PanelContainer>
         <PanelCard>
            {elementToShow != null && (
               <>
                  <NodeElementTitle>{elementToShow.type}</NodeElementTitle>
                  <Panel properties={elementToShow.properties} />
               </>
            )}
         </PanelCard>
      </PanelContainer>
   );
};

export default Panel;
