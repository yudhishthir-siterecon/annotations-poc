import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import Map from 'ol/Map';
import View from 'ol/View';
import TileLayer from 'ol/layer/Tile';
import OSM from 'ol/source/OSM';
import { fromLonLat } from 'ol/proj';
import Overlay from 'ol/Overlay';
import NoteOverlay from './NoteOverlay';
import 'ol/ol.css';
import './styles.css';
import ol from 'ol';

const MapComponent: React.FC = () => {
  const [map, setMap] = useState<Map | null>(null);
  const [overlays, setOverlays] = useState<Overlay[]>([]);
  const [activeOverlay, setActiveOverlay] = useState<Overlay | null>(null);

  useEffect(() => {
    const initialMap = new Map({
      target: 'map',
      layers: [
        new TileLayer({
          source: new OSM(),
        }),
      ],
      view: new View({
        center: fromLonLat([0, 0]),
        zoom: 2,
      }),
    });

    initialMap.on('click', (event) => {
      const target = event.originalEvent.target as HTMLElement;
      if (target.closest('.note-overlay-container')) {
        return;
      }
      const coordinates = event.coordinate as [number, number];
      addNoteOverlay(initialMap, coordinates);
    });

    setMap(initialMap);
  }, []);

  useEffect(() => {
    console.log("setting interactions to []");
    map?.setProperties({interactions: []});
  }, [map])

  const addNoteOverlay = (map: Map, coordinates: [number, number]) => {
    const overlayContainer = document.createElement('div');
    overlayContainer.className = 'note-overlay-container';

    const overlay = new Overlay({
      element: overlayContainer,
      positioning: 'center-center',
      stopEvent: false,
      position: coordinates,
    });

    setOverlays((prev) => [...prev, overlay]);
    setActiveOverlay(overlay);

    if (map) {
      map.addOverlay(overlay);
    }

    ReactDOM.render(
      <NoteOverlay
        overlay={overlay}
        isActive={overlay === activeOverlay}
        setActiveOverlay={setActiveOverlay}
        map={map}
      />,
      overlayContainer
    );
  };

  useEffect(() => {
    overlays.forEach((overlay) => {
      const element = overlay.getElement();
      if (element) {
        ReactDOM.render(
          <NoteOverlay
            overlay={overlay}
            isActive={overlay === activeOverlay}
            setActiveOverlay={setActiveOverlay}
            map={map!}
          />,
          element
        );
      }
    });
  }, [activeOverlay, overlays, map]);

  return <div id="map" style={{ width: '100%', height: '100vh' }}></div>;
};

export default MapComponent;
