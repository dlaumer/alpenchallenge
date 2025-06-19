import { createGlobalStyle } from "styled-components";

const GlobalStyles = createGlobalStyle`
  body {
    margin: 0 !important;
    font-family: Arial, sans-serif;
  }
    /* make everything in the bottom-right stack vertically */
.esri-ui-bottom-right {
  display: flex !important;
  flex-direction: column !important;
  align-items: flex-end;        /* keep them flush to the right edge */
  gap: 8px;                     /* space between widgets */
}
  @media (max-width: 768px) {
   .esri-ui-bottom-right.esri-ui-corner {
    bottom: 90px !important;
  }
}
`;

export default GlobalStyles;
