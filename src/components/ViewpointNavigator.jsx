// src/components/ViewpointNavigator.jsx
import React, { useState, useEffect } from 'react';
import styled, { css } from 'styled-components';
import { observer } from 'mobx-react-lite';
import mapStore from '../store/mapStore';

const ITEM_HEIGHT = 32;    // px
const ITEM_MARGIN = 8;     // px between items
const V_PADDING = 16;      // top & bottom padding on the List
const LINE_WIDTH = 4;      // px
const CIRCLE_SIZE = 12;    // px

const Container = styled.div`
  position: absolute;
  top: 50px;
  right: 20px;
  z-index: 1000;
  width: 150px;
`;

const List = styled.ul`
  position: relative;
  margin: 0;
  padding: ${V_PADDING}px 0;
  list-style: none;
`;

const Line = styled.div`
  position: absolute;
  top: ${(V_PADDING + ITEM_HEIGHT) / 2}px;
  bottom: ${V_PADDING + ITEM_HEIGHT / 2}px;
  right: 22px;          /* center of line is at right:16px + 2px */
  width: ${LINE_WIDTH}px;
  background: red;
  border-radius: 2px;
  z-index: 2;           /* above the pills */
`;

const Item = styled.li`
  display: flex;
  justify-content: space-between;
  align-items: center;
  height: ${ITEM_HEIGHT}px;
  background: #f8f8f8;
  border-radius: ${ITEM_HEIGHT / 2}px;
  padding: 0 16px;
  margin-bottom: ${ITEM_MARGIN}px;
  cursor: pointer;
  user-select: none;
  z-index: 1;           /* below the line */

  &:last-child {
    margin-bottom: 0;
  }
  &:hover span {
    text-decoration: underline;
  }
      box-shadow: 0 2px 6px rgba(0, 0, 0, 0.4);

`;

const Label = styled.span`
  font-size: 14px;
  color: #000;
  font-weight: 500;
`;

const Dot = styled.div`
  position: absolute;
  right: 16px;          /* matches Item padding-right */
  width: ${CIRCLE_SIZE}px;
  height: ${CIRCLE_SIZE}px;
  border-radius: 50%;
  z-index: 3;           /* above the line */
  transition: transform 0.2s;
background-color: ${p => (p.$active ? 'rgb(255, 135, 135)' : 'white')};
  border: 2px solid red;

  &:hover {
    transform: scale(${p => (p.$active ? 1.3 : 1.1)});
  }
`;

const ViewpointNavigator = observer(() => {
    const { view } = mapStore;
    const [activeId, setActiveId] = useState(null);

    const viewpoints = [
        {
            id: 'start', name: 'Start',
            camera: {
                position: [
                    9.57973462,
                    46.64500634,
                    2472.82919
                ],
                heading: 343.46,
                tilt: 75.41
            }
        },
        {
            id: 'albula', name: 'Albulapass',
            camera: {
                position: [
                    9.87428509,
                    46.57606770,
                    3476.74794
                ],
                heading: 286.97,
                tilt: 69.50
            }
        },
        {
            id: 'julier', name: 'Julierpass',
            camera: {
                position: [
                    9.76618461,
                    46.46536589,
                    3421.15112
                ],
                heading: 284.34,
                tilt: 68.75
            }
        },
        {
            id: 'savognin', name: 'Savognin',
            camera: {
                position: [
                    9.61408759,
                    46.57836911,
                    1593.65402
                ],
                heading: 328.64,
                tilt: 82.80
            }
        },
        {
            id: 'maloja', name: 'Malojapass',
            camera: {
                position: [
                    9.67258795,
                    46.38615633,
                    2280.33604
                ],
                heading: 46.70,
                tilt: 81.71
            }
        },
        {
            id: 'spluegen', name: 'Splügenpass',
            camera: {
                position: [
                    9.28120299,
                    46.54469367,
                    4404.65276
                ],
                heading: 142.62,
                tilt: 73.81
            }
        },
        {
            id: 'thusis', name: 'Thusis',
            camera:
            {
                position: [
                    9.42313066,
                    46.70304823,
                    1332.80161
                ],
                heading: 115.95,
                tilt: 80.22
            }
        },
        {
            id: 'finish', name: 'Finish',
            camera: {
                position: [
                    9.57973462,
                    46.64500634,
                    2472.82919
                ],
                heading: 343.46,
                tilt: 75.41
            }
        },

    ];
    // clear active on manual interaction
    useEffect(() => {
        if (!view?.watch) return;
        const h = view.watch('interacting', flag => {
            if (flag) setActiveId(null);
        });
        return () => h?.remove?.();
    }, [view]);

    const goTo = vp => {
        if (!view || !vp.camera) return;
        view.goTo(vp.camera).then(() => setActiveId(vp.id));
    };

    return (
        <Container>
            <List>
                <Line />
                {viewpoints.map(vp => (
                    <Item key={vp.id} onClick={() => goTo(vp)}>
                        <Label>{vp.name}</Label>
                    </Item>
                ))}
            </List>

            {viewpoints.map((vp, i) => {
                // compute vertical center for each dot:
                const top =
                    (V_PADDING +             // list padding
                        ITEM_HEIGHT) / 2 +         // to first dot center
                    i * (ITEM_HEIGHT + ITEM_MARGIN);

                return (
                    <Dot
                        key={vp.id}
                        $active={vp.id === activeId}
                        style={{ top }}
                        onClick={() => goTo(vp)}
                    />
                );
            })}
        </Container>
    );
});

export default ViewpointNavigator;
