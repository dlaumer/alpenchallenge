import bluePinSymbol from "../assets/symbols/webcam.svg";
import emergencySymbol from "../assets/symbols/emergency.svg";
import realTimeSymbol from "../assets/symbols/realTimeResults.svg";
import poiSymbol from "../assets/symbols/poi.svg";
import adSymbol from "../assets/symbols/ads.svg";
import weatherSymbol from "../assets/symbols/weather.svg";

import PointSymbol3D from "@arcgis/core/symbols/PointSymbol3D";
import ObjectSymbol3DLayer from "@arcgis/core/symbols/ObjectSymbol3DLayer";

import LineCallout3D from "@arcgis/core/symbols/callouts/LineCallout3D";
import Symbol3DVerticalOffset from "@arcgis/core/symbols/support/Symbol3DVerticalOffset";
import UniqueValueRenderer from "@arcgis/core/renderers/UniqueValueRenderer";
import SimpleRenderer from "@arcgis/core/renderers/SimpleRenderer";

// factory to build your sphere + cylinder combo with a given color
const createSymbol = (color) => (
  new PointSymbol3D({
    callout: new LineCallout3D({
      color: [0, 0, 0, 1],
      size: 1
    }),
    symbolLayers: [
      new ObjectSymbol3DLayer({
        anchor: "bottom",
        resource: { primitive: "sphere" },
        width: 15,
        height: 10,
        depth: 10,
        material: { color },
        castShadows: false
      })
    ],
    verticalOffset: new Symbol3DVerticalOffset({
      maxWorldLength: 100,
      minWorldLength: 0,
      screenLength: 0
    })
  })
);

// build the renderer
export const streamLayerRenderer = new UniqueValueRenderer({
  field: "symbolisation",
  defaultSymbol: createSymbol("#2575b0"),  // fallback if no match
  uniqueValueInfos: [
    {
      value: "none",
      symbol: createSymbol("#2575b0")       // blue
    },
    {
      value: "favorite",
      symbol: createSymbol("#FCD53F")       // yellow
    },
    {
      value: "selected",
      symbol: createSymbol("#8B0000")       // dark red
    }
  ]
});


// build the renderer
export const streamLayerRenderer2 = new SimpleRenderer({
  symbol: createSymbol("#2575b0"),  // fallback if no match
});

function makeSymbol(url) {
  return {
    type: "point-3d",
    symbolLayers: [
      {
        type: "icon",
        resource: { href: url },
        size: 20,
        anchor: "relative",
        anchorPosition: { x: 0, y: 0.25 }
      }
    ],
    verticalOffset: {
      screenLength: 30,
      maxWorldLength: 100,
      minWorldLength: 30
    },
    callout: {
      type: "line",
      color: "white",
      size: 1
    }
  };
}

export const specialPointsTypeRenderer = {
  type: "unique-value",
  field: "pointType",
  uniqueValueInfos: [
    {
      value: "webcam",
      label: "Webcams",
      symbol: makeSymbol(bluePinSymbol)
    },
    {
      value: "emergency",
      label: "Emergency",
      symbol: makeSymbol(emergencySymbol)
    },
    {
      value: "realTimeResults",
      label: "Real Time Results",
      symbol: makeSymbol(realTimeSymbol)
    },
    {
      value: "poi",
      label: "Points of Interest",
      symbol: makeSymbol(poiSymbol)
    },
    {
      value: "ads",
      label: "Advertisements",
      symbol: makeSymbol(adSymbol)
    },
    {
      value: "weather",
      label: "Weather",
      symbol: makeSymbol(weatherSymbol)
    }
  ]
};
