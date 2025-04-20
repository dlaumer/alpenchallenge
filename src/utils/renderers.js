import bluePinSymbol from "../assets/symbols/webcam.svg";
import emergencySymbol from "../assets/symbols/emergency.svg";
import realTimeSymbol from "../assets/symbols/realTimeResults.svg";
import poiSymbol from "../assets/symbols/poi.svg";
import adSymbol from "../assets/symbols/ads.svg";
import weatherSymbol from "../assets/symbols/weather.svg";

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
