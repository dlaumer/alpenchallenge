// src/components/FollowedRider.jsx
import React, { useState } from 'react';
import styled from 'styled-components';
import { X } from 'lucide-react';

const Container = styled.div`
  position: absolute;
  top: 80px;
  left: 50%;
  transform: translateX(-50%);
  background: white;
  border-radius: 24px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.15);
  display: flex;
  align-items: center;
  padding: 8px 16px;
  z-index: 200;
`;

const Badge = styled.div`
  background: #e74c3c;
  color: white;
  font-size: 12px;
  font-weight: bold;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 12px;
`;

const Info = styled.div`
  display: flex;
  flex-direction: column;
  margin-right: 24px;
`;

const Label = styled.span`
  font-size: 12px;
  color: #555;
`;

const Name = styled.span`
  font-size: 14px;
  font-weight: 600;
  color: #222;
`;

const ModeWrapper = styled.div`
  display: flex;
  flex-direction: column;
  margin-right: 24px;
`;

const ModeLabel = styled.span`
  font-size: 12px;
  color: #555;
  margin-bottom: 4px;
`;

const ModeButtons = styled.div`
  display: flex;
  border: 1px solid #ddd;
  border-radius: 8px;
  overflow: hidden;
`;

const ModeButton = styled.button`
  flex: 1;
  background: ${({ active }) => active ? '#e74c3c' : 'transparent'};
  color: ${({ active }) => active ? 'white' : '#e74c3c'};
  border: none;
  padding: 6px 12px;
  font-size: 12px;
  cursor: pointer;
  &:first-child { border-right: 1px solid #ddd; }
`;

const CloseButton = styled.button`
  background: transparent;
  border: none;
  padding: 4px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const FollowedRider = ({
  riderName,
  riderIndex = 1,
  initialMode = 'fly',
  onModeChange,
  onClose
}) => {
  const [mode, setMode] = useState(initialMode);
  const formattedIndex = String(riderIndex).padStart(2, '0');

  const handleModeClick = (newMode) => {
    setMode(newMode);
    if (onModeChange) onModeChange(newMode);
  };

  return (
    <Container>
      <Badge>{formattedIndex}</Badge>
      <Info>
        <Label>You follow</Label>
        <Name>{riderName}</Name>
      </Info>
      <ModeWrapper>
        <ModeLabel>Follow mode</ModeLabel>
        <ModeButtons>
          <ModeButton
            active={mode === 'fly'}
            onClick={() => handleModeClick('fly')}
          >
            Fly
          </ModeButton>
          <ModeButton
            active={mode === 'ride'}
            onClick={() => handleModeClick('ride')}
          >
            Ride
          </ModeButton>
        </ModeButtons>
      </ModeWrapper>
      <CloseButton onClick={onClose} aria-label="Stop following">
        <X size={16} color="#333" />
      </CloseButton>
    </Container>
  );
};

export default FollowedRider;
