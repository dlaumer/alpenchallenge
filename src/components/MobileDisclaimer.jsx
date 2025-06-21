// src/components/MobileDisclaimer.jsx
import React, { useState, useEffect } from "react";
import styled from "styled-components";
import { getTranslation } from "../utils/getTranslation";

const Overlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(0, 0, 0, 0.75);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 20000;
`;

const MessageBox = styled.div`
  background: #fff;
  padding: 24px;
  border-radius: 8px;
  width: 80vw;
  text-align: center;
  box-shadow: 0 4px 12px rgba(0,0,0,0.3);
`;

const Text = styled.p`
  margin: 0 0 16px;
  font-size: 1rem;
  color: #333;
`;

const CloseButton = styled.button`
  padding: 8px 16px;
  background: #e1003b;
  color: #fff;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.9rem;

  &:hover {
    opacity: 0.9;
  }
`;

const MobileDisclaimer = () => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // you can tweak the width threshold or use a UA sniff if you prefer
    if (window.innerWidth <= 768) {
      setVisible(true);
    }
  }, []);

  if (!visible) return null;

  return (
    <Overlay>
      <MessageBox>
        <Text>
          {getTranslation("mobileDisclaimer")}        
          </Text>
        <CloseButton onClick={() => setVisible(false)}>
          OK
        </CloseButton>
      </MessageBox>
    </Overlay>
  );
};

export default MobileDisclaimer;
