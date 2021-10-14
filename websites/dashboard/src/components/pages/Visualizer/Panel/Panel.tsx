import React, { FC, useEffect, useState } from "react";
import { GremlinElement } from "../tools/visualizerUtils";
import { OnSearchFunc } from "../Visualizer";
import GenericPropertiesTable, {
   PropsGenericPropertiesTable
} from "./DataSpecificPanels/GenericPropertiesTable/GenericPropertiesTable";
import GroupPanel from "./DataSpecificPanels/GroupPanel/GroupPanel";
import TagsPanel from "./DataSpecificPanels/TagsPanel/TagsPanel";
import UserPanel from "./DataSpecificPanels/UserPanel/UserPanel";
import { NodeElementTitle, PanelCard, PanelContainer } from "./styles.Panel";

interface PropsPanel {
   allNodes: GremlinElement[];
   allEdges: GremlinElement[];
   nodeIdSelected: string | number;
   edgeIdSelected: string | number;
   onSearch: OnSearchFunc;
}

const Panel: FC<PropsPanel> = props => {
   const { allNodes, allEdges, nodeIdSelected, edgeIdSelected, onSearch } = props;
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

      case "group":
         Panel = GroupPanel;
         break;

      case "tag":
         Panel = TagsPanel;
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
                  <Panel properties={elementToShow.properties} onSearch={onSearch} />
               </>
            )}
         </PanelCard>
      </PanelContainer>
   );
};

export default Panel;
