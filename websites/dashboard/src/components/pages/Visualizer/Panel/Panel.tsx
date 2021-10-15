import { IconButton } from "@mui/material";
import React, { FC, useEffect, useState } from "react";
import { VscChevronLeft, VscChevronRight } from "react-icons/vsc";
import { useKeyPress } from "../../../../common-tools/browser/useKeyPress";
import { GremlinElement } from "../tools/visualizerUtils";
import { OnSearchFunc } from "../Visualizer";
import GenericPropertiesTable, {
   PropsGenericPropertiesTable
} from "./DataSpecificPanels/GenericPropertiesTable/GenericPropertiesTable";
import GroupPanel from "./DataSpecificPanels/GroupPanel/GroupPanel";
import TagsPanel from "./DataSpecificPanels/TagsPanel/TagsPanel";
import UserPanel from "./DataSpecificPanels/UserPanel/UserPanel";
import {
   NavigationButtonsContainer,
   NodeElementTitle,
   PanelCard,
   PanelContainer
} from "./styles.Panel";

interface PropsPanel {
   allNodes: GremlinElement[];
   allEdges: GremlinElement[];
   nodeIdSelected: string | number | undefined;
   edgeIdSelected: string | number | undefined;
   onSearch: OnSearchFunc;
   onNextClick: () => void;
   onPrevClick: () => void;
}

const Panel: FC<PropsPanel> = props => {
   const {
      allNodes,
      allEdges,
      nodeIdSelected,
      edgeIdSelected,
      onSearch,
      onNextClick,
      onPrevClick
   } = props;
   const [elementToShow, setElementToShow] = useState<GremlinElement>();
   const leftKeyPressed = useKeyPress("ArrowLeft");
   const rightKeyPressed = useKeyPress("ArrowRight");

   useEffect(() => {
      setElementToShow(allNodes.find(node => node.id === nodeIdSelected));
   }, [nodeIdSelected]);

   useEffect(() => {
      setElementToShow(allEdges.find(edge => edge.id === edgeIdSelected));
   }, [edgeIdSelected]);

   useEffect(() => {
      if (leftKeyPressed && elementToShow != null) {
         onPrevClick();
      }
   }, [leftKeyPressed]);

   useEffect(() => {
      if (rightKeyPressed && elementToShow != null) {
         onNextClick();
      }
   }, [rightKeyPressed]);

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
                  <NavigationButtonsContainer>
                     <IconButton onClick={onPrevClick}>
                        <VscChevronLeft />
                     </IconButton>
                     <IconButton onClick={onNextClick}>
                        <VscChevronRight />
                     </IconButton>
                  </NavigationButtonsContainer>
                  <NodeElementTitle>{elementToShow.type}</NodeElementTitle>
                  <Panel properties={elementToShow.properties} onSearch={onSearch} />
               </>
            )}
         </PanelCard>
      </PanelContainer>
   );
};

export default Panel;
