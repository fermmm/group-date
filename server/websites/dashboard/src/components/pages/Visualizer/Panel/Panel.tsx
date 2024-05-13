import { IconButton } from "@mui/material";
import React, { FC, useEffect, useRef, useState } from "react";
import { VscChevronLeft, VscChevronRight, VscMultipleWindows } from "react-icons/vsc";
import { databaseQueryRequest } from "../../../../api/server/techOps";
import { useKeyPress } from "../../../../common-tools/browser/useKeyPress";
import { Tooltip } from "../../../common/UI/Tooltip/Tooltip";
import { openQueryInNewTab } from "../tools/openQueryInNewTab";
import { GremlinElement } from "../tools/visualizerUtils";
import { OnSearchFunc } from "../Visualizer";
import EdgePanel from "./DataSpecificPanels/EdgePanel/EdgePanel";
import GenericPanel, { PropsGenericPropertiesTable } from "./DataSpecificPanels/GenericPanel/GenericPanel";
import GroupPanel from "./DataSpecificPanels/GroupPanel/GroupPanel";
import TagsPanel from "./DataSpecificPanels/TagsPanel/TagsPanel";
import UserPanel from "./DataSpecificPanels/UserPanel/UserPanel";
import { NavigationButtonsContainer, NodeElementTitle, PanelCard, PanelContainer } from "./styles.Panel";

interface PropsPanel {
   allNodes: GremlinElement[];
   allEdges: GremlinElement[];
   nodeIdSelected: string | number | undefined;
   edgeIdSelected: string | number | undefined;
   onSearch: OnSearchFunc;
   onNextClick: () => void;
   onPrevClick: () => void;
   onRefresh: () => void;
}

const Panel: FC<PropsPanel> = props => {
   const { allNodes, allEdges, nodeIdSelected, edgeIdSelected, onSearch, onNextClick, onPrevClick, onRefresh } =
      props;

   const [elementToShow, setElementToShow] = useState<GremlinElement>();
   const [elementToShowIsNode, setElementToShowIsNode] = useState<boolean>();
   const leftKeyPressed = useKeyPress("ArrowLeft", { withShift: true });
   const rightKeyPressed = useKeyPress("ArrowRight", { withShift: true });
   const scrollContainerRef = useRef<HTMLDivElement>(null);

   useEffect(() => {
      setElementToShow(allNodes.find(node => node.id === nodeIdSelected));
      setElementToShowIsNode(true);
   }, [nodeIdSelected]);

   useEffect(() => {
      setElementToShow(allEdges.find(edge => edge.id === edgeIdSelected));
      setElementToShowIsNode(false);
   }, [edgeIdSelected]);

   /**
    * This effect refreshes the panel content when allNodes or allEdges changes. When
    * those props changes setElementToShow needs to be called again to get the new
    * info of the selected element.
    */
   useEffect(() => {
      let selectedElementUpdated: GremlinElement<Record<string, string | number | boolean>>;

      if (elementToShowIsNode) {
         selectedElementUpdated = allNodes.find(node => node.id === nodeIdSelected);
      } else {
         selectedElementUpdated = allEdges.find(edge => edge.id === edgeIdSelected);
      }

      setElementToShow(selectedElementUpdated);
   }, [allNodes, allEdges, elementToShowIsNode]);

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

   useEffect(() => {
      scrollContainerRef.current.scrollTo({ top: 0 });
   }, [nodeIdSelected]);

   const handleOpenInNewTab = () => {
      openQueryInNewTab(`g.V(${elementToShow.id})`);
   };

   const handlePropEdit = async (propName: string, propValue: string | number | boolean, isVertex: boolean) => {
      const typedPropValue = typeof propValue === "string" ? `'${propValue}'` : propValue;
      const typedVertexId =
         typeof elementToShow.id === "string" ? `'${elementToShow.id}'` : `${elementToShow.id}L`;

      let query = `g.V(${typedVertexId})`;

      if (isVertex) {
         query = query + `.property(single, "${propName}", ${typedPropValue})`;
      } else {
         query = query + `.property("${propName}", ${typedPropValue})`;
      }

      await databaseQueryRequest({ query, nodeLimit: 1 });
      props.onRefresh();
   };

   let PanelToUse: React.FC<PropsGenericPropertiesTable>;
   switch (elementToShow?.type ?? "") {
      case "user":
         PanelToUse = UserPanel;
         break;

      case "group":
         PanelToUse = GroupPanel;
         break;

      case "tag":
         PanelToUse = TagsPanel;
         break;

      default:
         PanelToUse = GenericPanel;
         break;
   }

   if (elementToShow?.from != null) {
      PanelToUse = EdgePanel;
   }

   return (
      <PanelContainer>
         <PanelCard ref={scrollContainerRef}>
            {elementToShow != null && (
               <>
                  <NavigationButtonsContainer>
                     {elementToShowIsNode && (
                        <Tooltip text={"Open element in new tab"} placement="bottom">
                           <IconButton onClick={handleOpenInNewTab}>
                              <VscMultipleWindows />
                           </IconButton>
                        </Tooltip>
                     )}
                     <Tooltip text={"Previous element. Shortcut: Shift + Left cursor key"} placement="bottom">
                        <IconButton onClick={onPrevClick}>
                           <VscChevronLeft />
                        </IconButton>
                     </Tooltip>
                     <Tooltip text={"Next element. Shortcut: Shift + Right cursor key"} placement="bottom">
                        <IconButton onClick={onNextClick}>
                           <VscChevronRight />
                        </IconButton>
                     </Tooltip>
                  </NavigationButtonsContainer>
                  <NodeElementTitle>{elementToShow.type}</NodeElementTitle>
                  <PanelToUse
                     properties={elementToShow.properties}
                     id={elementToShow.id}
                     label={elementToShow.label}
                     onSearch={onSearch}
                     isVertex={elementToShowIsNode}
                     onRefresh={onRefresh}
                     onPropEdit={handlePropEdit}
                  />
               </>
            )}
         </PanelCard>
      </PanelContainer>
   );
};

export default Panel;
