import styled from "styled-components";
import { observer } from "mobx-react-lite";

const Panel = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  width: 250px;
  height: 100vh;
  background: #f4f4f4;
  box-shadow: 2px 0 5px rgba(0, 0, 0, 0.2);
  padding: 20px;
  box-sizing: border-box;
`;

const SidePanel = observer(() => {
  return (
    <Panel>
      <h3>Menu</h3>
      <p>Hier wären verschiedene Menuelemente</p>
    </Panel>
  );
});

export default SidePanel;
