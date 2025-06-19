import React, { useState } from "react";
import { observer } from "mobx-react-lite";
import styled from "styled-components";
import riderStore from "../store/riderStore";
import mapStore from "../store/mapStore";
import { riders_info } from "../constants/riders_info_1000";
import { getTranslation } from "../utils/getTranslation";
import { countryMeta } from "../constants/countryMeta";

const Container = styled.div`
  position: absolute;
  top: 50px;
  left: 10px;
  width: 280px;
  z-index: 20000;
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

const Flag = styled.img`
  width: 24px;
  height: 16px;
  border-radius: 2px;
  margin-right: 8px;
  flex-shrink: 0;
`;

const RiderSearch = observer(() => {
  const [query, setQuery] = useState("");
  const [focused, setFocused] = useState(false);
  const q = query.toLowerCase();

  // Get only the rider IDs currently present in replayData
  const replayIds = Object.keys(riderStore.replayData);

  // When focused, show all or filtered riders
  const filteredIds = focused
    ? replayIds.filter(id => {
      if (!q) return true;
      const info = riders_info[id];
      const fullName = info ? `${info.FirstName} ${info.LastName}`.toLowerCase() : "";
      const country = info?.Nationality?.toLowerCase() || "";
      return (
        id.toLowerCase().includes(q) ||
        fullName.includes(q) ||
        country.includes(q)
      );
    })
    : [];

  const matches = filteredIds.map(id => {
    const info = riders_info[id];
    return info
      ? { id, ...info, isInfo: true }
      : { id, isInfo: false };
  });

  const selectRider = riderId => {
    mapStore.setRiderSelected(riderId);
    mapStore.setPopupVisible(true);
    setQuery("");
  };

  return (
    <Container>
      <Input
        type="text"
        placeholder={getTranslation("searchRiderByNameOrCountry")}
        value={query}
        onChange={e => setQuery(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setTimeout(() => setFocused(false), 200)}
      />
      {focused && matches.length > 0 && (
        <Dropdown>
          {matches.map(match => (
            <Option key={match.id} onClick={() => selectRider(match.id)}>
              <div style={{ display: "flex", alignItems: "center" }}>
                {match.isInfo && countryMeta[match.Nationality?.toUpperCase()] && (
                  <Flag
                    src={countryMeta[match.Nationality.toUpperCase()].flag}
                    alt={match.Nationality}
                  />
                )}
                <span>
                  {match.isInfo
                    ? `${match.FirstName} ${match.LastName}`
                    : match.id}
                </span>
              </div>
            </Option>
          ))}
        </Dropdown>
      )}
    </Container>
  );
});

export default RiderSearch;
