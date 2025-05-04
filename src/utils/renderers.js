import bluePinSymbol from "../assets/symbols/webcam.svg";
import emergencySymbol from "../assets/symbols/emergency.svg";
import realTimeSymbol from "../assets/symbols/realTimeResults.svg";
import poiSymbol from "../assets/symbols/poi.svg";
import adSymbol from "../assets/symbols/ads.svg";
import weatherSymbol from "../assets/symbols/weather.svg";


import bluePinSymbol from "../assets/blue-pin-symbol.svg";
import redPinSymbol from "../assets/red-pin-symbol.svg";
import yellowPinSymbol from "../assets/yellow-pin-symbol.svg";

import PointSymbol3D from "@arcgis/core/symbols/PointSymbol3D";
import IconSymbol3DLayer from "@arcgis/core/symbols/IconSymbol3DLayer";

import LineCallout3D from "@arcgis/core/symbols/callouts/LineCallout3D";
import Symbol3DVerticalOffset from "@arcgis/core/symbols/support/Symbol3DVerticalOffset";
import UniqueValueRenderer from "@arcgis/core/renderers/UniqueValueRenderer";
import SimpleRenderer from "@arcgis/core/renderers/SimpleRenderer";


export const createSymbol = (icon, size) => (
  new PointSymbol3D({
    callout: new LineCallout3D({
      color: "white",
      size: 1
    }),
    symbolLayers: [
      new IconSymbol3DLayer({
        resource: {
          href: icon, // adjust path if needed
        },
        size: size, // adjust size if needed
        anchor: "relative",
        anchorPosition: { x: 0, y: 0.25 },
      })
    ],
    verticalOffset: new Symbol3DVerticalOffset({
      maxWorldLength: 50 + size,
      minWorldLength: size/4,
      screenLength: 10
    })
  })
);

// build the renderer
export const favoriteLayerRenderer = new UniqueValueRenderer({
  field: "symbolisation",
  defaultSymbol: createSymbol(bluePinSymbol, 45),  // fallback if no match
  uniqueValueInfos: [
    {
      value: "none",
      symbol: createSymbol(bluePinSymbol, 45)       // blue
    },
    {
      value: "favorite",
      symbol: createSymbol(yellowPinSymbol, 45)       // yellow
    },
    {
      value: "selected",
      symbol: createSymbol(redPinSymbol, 45)       // dark red
    }
  ]
});

// build the renderer
export const latestSimulationRenderer = new SimpleRenderer({
  symbol: createSymbol(bluePinSymbol, 15),  // fallback if no match
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

export const pointTypeRenderer = {
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
