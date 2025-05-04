import React, { useState } from "react";
import styled from "styled-components";
import mapStore from "../store/mapStore";

// Replace this with your actual import or global access to riders_info
import { riders_info } from "../constants/riders_info_1000";

const Container = styled.div`
  position: absolute;
  top: 50px;
  left: 10px;
  width: 280px;
  z-index: 200;
`;

const Input = styled.input`
  width: 100%;
  padding: 12px 10px;
  border-radius: 8px;
  border: 1px solid #ccc;
  font-size: 14px;
  outline: none;
`;

const Dropdown = styled.ul`
  margin: 0;
  padding: 0;
  list-style: none;
  background: white;
  border: 1px solid #ccc;
  border-top: none;
  max-height: 200px;
  overflow-y: auto;
  border-radius: 0 0 8px 8px;
`;

const Option = styled.li`
  padding: 8px 10px;
  cursor: pointer;

  &:hover {
    background: #f0f0f0;
  }
`;

const RiderSearch = () => {
  const [query, setQuery] = useState("");
  const [focused, setFocused] = useState(false);

  const matches = query.length > 0
    ? Object.entries(riders_info).filter(([id, r]) => {
        const fullName = `${r.FirstName} ${r.LastName}`.toLowerCase();
        return (
          fullName.includes(query.toLowerCase()) ||
          r.Nationality?.toLowerCase().includes(query.toLowerCase())
        );
      })
    : [];

  const selectRider = (riderId) => {
    mapStore.setRiderSelected(riderId);
    mapStore.setPopupVisible(true);
    setQuery("");
  };

  return (
    <Container>
      <Input
        type="text"
        placeholder="Search rider by name or country"
        value={query}
        onChange={e => setQuery(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setTimeout(() => setFocused(false), 200)}
      />
      {focused && matches.length > 0 && (
        <Dropdown>
          {matches.slice(0, 10).map(([id, r]) => (
            <Option key={id} onClick={() => selectRider(id)}>
              {r.FirstName} {r.LastName} — {r.Nationality}
            </Option>
          ))}
        </Dropdown>
      )}
    </Container>
  );
};

export default RiderSearch;
