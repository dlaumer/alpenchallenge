import { observer } from "mobx-react-lite";
import styled from "styled-components";
import mapStore from "../store/MapStore";

const Button = styled.button`
  background: ${(props) => (props.active ? "green" : "red")};
  color: white;
  padding: 10px 15px;
  border: none;
  cursor: pointer;
  border-radius: 5px;
  margin: 10px;
`;

const LayerToggle = observer(() => {
  return (
    <Button active={mapStore.layerVisible} onClick={() => mapStore.toggleLayer()}>
      {mapStore.layerVisible ? "Hide Layer" : "Show Layer"}
    </Button>
  );
});

export default LayerToggle;
