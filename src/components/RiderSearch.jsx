import React, { useState } from "react";
import styled from "styled-components";
import mapStore from "../store/mapStore";
import riderStore from '../store/riderStore';
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
  z-index: 2000;
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
  const q = query.toLowerCase();

  // 1) Filter static info
  const infoMatches = q.length > 0
    ? Object.entries(riders_info)
        .filter(([id, r]) => {
          const fullName = `${r.FirstName} ${r.LastName}`.toLowerCase();
          return (
            fullName.includes(q) ||
            r.Nationality?.toLowerCase().includes(q)
          );
        })
        .map(([id, r]) => ({ id, ...r, isInfo: true }))
    : [];

  // 2) Filter live store by riderId only
  const storeMatches = q.length > 0
    ? Object.keys(riderStore.riders)
        .filter(id => id.toLowerCase().includes(q))
        .map(id => ({ id, isInfo: false }))
    : [];

  // Combine them (you may also dedupe if needed)
  const matches = [...infoMatches, ...storeMatches];

  const selectRider = riderId => {
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
          {matches.slice(0, 10).map(match => (
            <Option key={match.id} onClick={() => selectRider(match.id)}>
              {match.isInfo
                ? `${match.FirstName} ${match.LastName} — ${match.Nationality}`
                : match.id
              }
            </Option>
          ))}
        </Dropdown>
      )}
    </Container>
  );
};

export default RiderSearch;
