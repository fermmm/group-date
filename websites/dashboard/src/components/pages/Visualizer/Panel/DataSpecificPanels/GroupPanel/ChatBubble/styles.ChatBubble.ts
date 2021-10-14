import styled from "styled-components";

export const ChatBubbleContainer = styled("div").withConfig({
   shouldForwardProp: p => !["color"].includes(p)
})<{ color: string }>`
   padding: 10px 20px;
   border-radius: 20px;
   background: ${({ color }) => color};
`;

export const NameLabel = styled("div")`
   font-size: 15px;
   font-weight: 600;
   margin-bottom: 5px;
`;

export const TextLabel = styled("div")`
   padding-left: 15px;
`;
