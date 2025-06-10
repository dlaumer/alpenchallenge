import webcamSymbol from "../assets/symbols/webcam.svg";
import emergencySymbol from "../assets/symbols/emergency.svg";
import realTimeSymbol from "../assets/symbols/realTimeResults.svg";
import poiSymbol from "../assets/symbols/poi.svg";
import adSymbol from "../assets/symbols/ads.svg";
import weatherSymbol from "../assets/symbols/weather.svg";


import bluePinSymbol from "../assets/pins/blue-pin-symbol.svg";
import bluePinSymbol_selected from "../assets/pins/blue-pin-symbol_selected.svg";

import greyPinSymbol from "../assets/pins/grey-pin-symbol.svg";
import greyPinSymbol_selected from "../assets/pins/grey-pin-symbol_selected.svg";

import lightBluePinSymbol from "../assets/pins/lightBlue-pin-symbol.svg";
import lightBluePinSymbol_selected from "../assets/pins/lightBlue-pin-symbol_selected.svg";

import redPinSymbol from "../assets/pins/red-pin-symbol.svg";
import redPinSymbol_selected from "../assets/pins/red-pin-symbol_selected.svg";

import yellowPinSymbol from "../assets/pins/yellow-pin-symbol.svg";
import yellowPinSymbol_selected from "../assets/pins/yellow-pin-symbol_selected.svg";


import PointSymbol3D from "@arcgis/core/symbols/PointSymbol3D";
import IconSymbol3DLayer from "@arcgis/core/symbols/IconSymbol3DLayer";

import LineCallout3D from "@arcgis/core/symbols/callouts/LineCallout3D";
import Symbol3DVerticalOffset from "@arcgis/core/symbols/support/Symbol3DVerticalOffset";
import UniqueValueRenderer from "@arcgis/core/renderers/UniqueValueRenderer";
import SimpleRenderer from "@arcgis/core/renderers/SimpleRenderer";

import Color from "@arcgis/core/Color.js";
import ObjectSymbol3DLayer from "@arcgis/core/symbols/ObjectSymbol3DLayer.js";

export const createSymbolSimple = (color) => (
  new PointSymbol3D({
    callout: new LineCallout3D({
      color: new Color([255, 255, 255, 1]),
      size: 1
    }),
    symbolLayers: [

      new ObjectSymbol3DLayer({
        anchor: "bottom",
        anchorPosition: {
          x: 0,
          y: 0,
          z: 0
        },
        castShadows: false,
        depth: 1,
        heading: 0,
        height: 1,
        material: {
          color: color
        },
        resource: {
          primitive: "sphere",
        },
        roll: 0,
        tilt: 0,
        width: 1
      }),

    ],
    verticalOffset: new Symbol3DVerticalOffset({
      maxWorldLength: 100,
      minWorldLength: 2,
      screenLength: 1
    })
  })
);



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
      maxWorldLength: size*size/5,
      minWorldLength: 5,
      screenLength: size
    })
  })
);


// build the renderer
export const streamLayerRenderer = new UniqueValueRenderer({
  field: "symbolisation",
  defaultSymbol: createSymbol(lightBluePinSymbol, 30),  // fallback if no match
  uniqueValueInfos: [
    {
      value: "favorite",
      symbol: createSymbol(bluePinSymbol, 45),     // blue
    },
    {
      value: "inactive",
      symbol: createSymbol(greyPinSymbol, 30),     // transparent
    },
    {
      value: "staff",
      symbol: createSymbol(yellowPinSymbol, 45),     // yellow
    },
     {
      value: "_selected",
      symbol: createSymbol(lightBluePinSymbol_selected, 45), // blue selected
    },
    {
      value: "favorite_selected",
      symbol: createSymbol(bluePinSymbol_selected, 45), // blue selected
    },
    {
      value: "inactive_selected",
      symbol: createSymbol(greyPinSymbol_selected, 30), // transparent selected
    },
    {
      value: "staff_selected",
      symbol: createSymbol(yellowPinSymbol_selected, 45), // yellow selected
    }
  ]
});

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
      symbol: createSymbol(bluePinSymbol, 45)       // blue
    },
    {
      value: "selected",
      symbol: createSymbol(redPinSymbol, 45)       // dark red
    },
    {
      value: "staff",
      symbol: createSymbol(yellowPinSymbol, 45)       // dark red
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
      symbol: makeSymbol(webcamSymbol)
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