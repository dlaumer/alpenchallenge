// src/components/InfoPage.jsx
import React from 'react';
import styled from 'styled-components';
import { observer } from 'mobx-react-lite';
import uiStore from "../store/uiStore";

const Overlay = styled.div`
  position: fixed;
  top: 10%;
  bottom: 10%;
  left: 15%;
  right: 15%;
  background-color: white;
  border-radius: 16px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
  z-index: 20000;
  display: flex;
  flex-direction: column;
  overflow: hidden;

  /* prettier scrollbar */
  &::-webkit-scrollbar {
    width: 8px;
  }
  &::-webkit-scrollbar-track {
    background: #f1f1f1;
    border-radius: 4px;
  }
  &::-webkit-scrollbar-thumb {
    background: #ccc;
    border-radius: 4px;
  }
  &::-webkit-scrollbar-thumb:hover {
    background: #888;
  }
`;

const HeaderBar = styled.div`
  flex: 0 0 auto;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 24px;
  border-bottom: 1px solid #e0e0e0;
  border-top-left-radius: 16px;
  border-top-right-radius: 16px;
  background-color: white;
`;

const Title = styled.h3`
  margin: 0;
  font-size: 1.25rem;
`;

const CloseButton = styled.button`
  background: transparent;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  z-index: 10;
`;

const Content = styled.div`
  flex: 1 1 auto;
  overflow-y: auto;
  padding: 16px 24px;

  h2 {
    margin-top: 1.5em;
    margin-bottom: 0.5em;
  }
  p {
    margin: 0.75em 0;
    line-height: 1.6;
  }
  address {
    font-style: normal;
    margin: 0.75em 0;
  }
  a {
    color: inherit;
    text-decoration: underline;
  }
`;

const InfoPage = observer(() => {
  if (!uiStore.isInfoPanelOpen) return null;
  return (
    <Overlay>
      <HeaderBar>
        <Title>About us</Title>
        <CloseButton onClick={() => uiStore.setInfoPanel(false)} aria-label="Close">×</CloseButton>
      </HeaderBar>
      <Content>
        <h2>🚴‍♂️ Unsere Story – Von Afrika zur Alpen Challenge</h2>
        <p>
          Die Tour d’Afrique ist eines der längsten Radrennen der Welt über 12 000 Kilometer von Kairo bis Kapstadt und absolvierte Christian Sailer erfolgreich als erster Schweizer Sieger im Jahr 2012. Für Freunde und Familie zuhause in der Schweiz war dieses Abenteuer weit weg und konnte nur über Blogeinträge und Social Media aus der Ferne mitverfolgt werden.
        </p>
        <p>
          Als passionierter Geoinformatik-Spezialist wollte Christian schon damals mehr. Statt blosser Text-Beiträge sollten ansprechende Karten und Visualisierungen die Erlebnisse greifbarer machen und das Mitfiebern vereinfachen.
        </p>
        <p>
          So entstand die erste Idee, Fahrten und Stories live auf einer Karte darzustellen – eine Vision, die ihn bis heute begleitet.
        </p>
        <p>
          Heute, über zehn Jahre später, hatte das Live Rider Tracking längst seinen Durchbruch gefeiert. 2013 setzte die Firma Tractalis GmbH zuerst in den USA beim legendären Race Across America, dann in der Schweiz bei der Tortour und vielen weiteren Events in ganz Europa ihre Tracking-Lösung ein. Als ab 2016 schliesslich auch die Tour de France und andere französische Profirennen auf Live-Tracking setzten, war klar: Diese Technologie war im Radsport und allgemein Distanzsport nicht mehr wegzudenken.
        </p>
        <p>
          2024 kam für Christian eine neue Dringlichkeit hinzu: die Rad-Weltmeisterschaften in Zürich. Zürich verfügte sowohl als Stadt wie auch als Kanton schon länger über enorm viele und enorm gute offene Geodaten, um schöne Webanwendungen zu entwickeln. Christian sah die Chance, zusammen mit diesen Daten ein innovatives 3D-Live-Tracking-System, massgeschneidert für die Rad WM zu entwickeln. Er bot dem OK der Rad WM an, ein solches System zu entwickeln – ein Live-Tracking in einer virtuellen 3D-Welt, wie es bisher noch niemand gesehen hatte an einem Profiradrennen.
        </p>
        <p>
          Das OK lehnte jedoch ein solches Angebot ab und der Rest der traurigen Geschichte ist ja allgemein bekannt. Der tragische Tod der jungen Rennfahrerin Muriel Furrer, über den The Athletic (New York Times, 21.12.2024) berichtete, löste weit über die Schweiz hinaus eine Diskussion über Sicherheit und Transparenz im Radsport aus – und machte die Notwendigkeit für Live-Ortung deutlich. Das OK gestand im Nachhinein dann auch, dass die Live-Tracking-Lösung „eine perfekte Lösung“ gewesen wäre (Watson, 08.11.2024).
        </p>

        <h2>🗺️ Das Produkt – LiveTrac3D</h2>
        <p>
          LiveTrac3D ist ein browserbasiertes Geovisualisierungs-Dashboard, das User erlaubt, geografische Informationen wie die Fahrten einzelner Riders, Streckenposten und viele Kontextdaten intuitiv zu visualisieren, zu analysieren und mit anderen zu teilen.
        </p>
        <p>
          Ziel von LiveTrac3D ist es, die Rennstrecke als dreidimensionalen Digital Twin darzustellen – mit Luftbild, Geländemodell, Live-Positionen der Fahrer, Orientierungspunkten wie Gebäuden und Vegetation sowie Pins zu Webcams, Wetterdaten und vielem mehr. Selbst das aktuelle Wetter wird realitätsnah simuliert.
        </p>
        <p>
          LiveTrac3D dient nicht nur dem Staff und Remote-Usern als Live-Verfolgung während des Rennens, sondern Fahrerinnen und Fahrer können die virtuelle Strecke auch im Voraus als Rennvorbereitung befliegen und kritische Stellen auskundschaften. Dank der Replay-Funktion ermöglicht die Lösung vor allem auch im Nachhinein eine detaillierte Rennanalyse.
        </p>
        <p>
          Die realistische Wetterdarstellung und die Möglichkeit, zwischen verschiedenen Basiskarten zu wechseln, machen das Erlebnis dabei noch authentischer.
        </p>
        <p>
          <strong>Technischer Hinweis:</strong><br />
          LiveTrac3D befindet sich in der Endphase als Proof of Concept. Der erste Einsatz erfolgt bei der Alpen Challenge 2025, gemeinsam mit der ACTYVO AG, welche über das kostenlose Actyvo App (actyvo.app) die Standortdaten erfasst.
        </p>

        <h2>👥 Über uns</h2>
        <p>
          <strong>Christian Sailer</strong> – Gründer von LiveTrac3D<br />
          Radfahrer, Tour d’Afrique-Sieger, Rennfahrer und Geoinformatiker mit einer klaren Vision: Erlebnisse sichtbar machen, Sicherheit erhöhen und den Radsport digital vernetzen.
        </p>
        <p>
          <strong>Daniel Laumer</strong> – Entwickler von LiveTrac3D<br />
          Daniel bringt Christians Vision in den Browser. Er entwickelt smarte 3D-Technologien und sorgt dafür, dass LiveTrac3D schlank, stabil und intuitiv funktioniert.
        </p>

        <h2>📞 Kontakt</h2>
        <address>
          Für eine persönliche Live-Demo oder weitere Fragen:<br />
          sailer smartTRIP<br />
          Christian Sailer<br />
          Neue Dorfstrasse 20a<br />
          CH-8135 Langnau<br />
          📧 <a href="mailto:c.sailer@gmx.ch">c.sailer@gmx.ch</a><br />
          📞 <a href="tel:+41763304050">+41 76 330 40 50</a><br />
          CHE-328.379.713<br />
          <a href="https://smarttrip.ch" target="_blank" rel="noopener">smarttrip.ch</a>
        </address>
      </Content>
    </Overlay>
  );
});

export default InfoPage;
