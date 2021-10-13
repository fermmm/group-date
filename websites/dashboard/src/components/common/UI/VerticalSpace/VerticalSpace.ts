import styled from "styled-components";

export const VerticalSpace = styled("div").withConfig({
   shouldForwardProp: p => !["height"].includes(p)
})<{ height: number }>`
   height: ${({ height }) => height}px;
`;
