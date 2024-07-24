import React, { useEffect, useRef, useState } from 'react';
import 'ol/ol.css';
import { Map, View } from 'ol';
import { Tile as TileLayer, Vector as VectorLayer } from 'ol/layer';
import { OSM, Vector as VectorSource } from 'ol/source';
import { Draw } from 'ol/interaction';
import { fromLonLat } from 'ol/proj';
import { Style, Stroke, Fill, Text } from 'ol/style';
import { Feature } from 'ol';
import { Point } from 'ol/geom';
import { Modal, Select, Input } from 'antd';

// Setup the base layer
const raster = new TileLayer({
  source: new OSM(),
});

// Setup vector source and layer
const source = new VectorSource({
  wrapX: false,
});

const vector = new VectorLayer({
  source: source,
  style: new Style({
    stroke: new Stroke({
      color: '#ff6633',
      width: 6, // Wider stroke
      lineCap: 'round',
      lineJoin: 'round',
    }),
    fill: new Fill({
      color: 'rgba(255, 102, 51, 0.2)', // Light fill color with transparency for polygons
    }),
  }),
});
const { Option } = Select;

const MapComponent: React.FC = () => {
  const mapRef = useRef<HTMLDivElement>(null);
  const [modalIsOpen, setModalIsOpen] = useState(false);
  const [fontSize, setFontSize] = useState('16px');
  const [fontStyle, setFontStyle] = useState('sans-serif');
  const [textColor, setTextColor] = useState('#000000');
  const [labelText, setLabelText] = useState('Your Label');
  const [currentPosition, setCurrentPosition] = useState<[number, number] | null>(null);

  useEffect(() => {
    if (mapRef.current) {
      const map = new Map({
        target: mapRef.current,
        layers: [raster, vector],
        view: new View({
          center: fromLonLat([-100.0, 40.0]), // Center on USA
          zoom: 4,
        }),
      });

      let draw: Draw; // Global variable for draw interaction

      const typeSelect = document.getElementById('type') as HTMLSelectElement;

      const addInteraction = () => {
        const value = typeSelect.value;
        if (value !== 'None') {
          draw = new Draw({
            source: source,
            type: value as 'LineString', // Only LineString is selected
            freehand: true,
            style: new Style({
              stroke: new Stroke({
                color: '#ff0000', // Red color for drawing
                width: 6, // Wider stroke
                lineCap: 'round',
                lineJoin: 'round',
              }),
              fill: new Fill({
                color: 'rgba(255, 102, 51, 0.2)', // Light fill color with transparency for polygons
              }),
            }),
          });
          map.addInteraction(draw);

          // Change cursor to '+' when drawing
          map.getTargetElement().style.cursor = 'crosshair';
        }
      };

      typeSelect.onchange = () => {
        map.removeInteraction(draw);
        addInteraction();
      };

      addInteraction();

      map.on('singleclick', (evt) => {
        const [x, y] = evt.coordinate as [number, number];
        setCurrentPosition([x, y]);
        setModalIsOpen(true);
      });

      return () => {
        map.setTarget(undefined);
      };
    }
  }, []);

  const addLabel = () => {
    if (currentPosition) {
      const labelFeature = new Feature({
        geometry: new Point(currentPosition),
      });

      labelFeature.setStyle(
        new Style({
          text: new Text({
            font: `${fontSize} ${fontStyle}`,
            text: labelText,
            fill: new Fill({
              color: textColor,
            }),
            backgroundFill: new Fill({
              color: 'rgba(255, 255, 255, 0.7)',
            }),
            padding: [5, 5, 5, 5],
            textAlign: 'center',
          }),
        })
      );

      source.addFeature(labelFeature);
    }

    setModalIsOpen(false);
    setCurrentPosition(null);
  };

  return (
    <div>
      <select id="type">
        <option value="LineString">LineString</option>
        <option value="None">None</option>
      </select>
      <div ref={mapRef} style={{ width: '100%', height: '100vh' }}></div>

      <Modal
        title="Label Settings"
        visible={modalIsOpen}
        onOk={addLabel}
        onCancel={() => setModalIsOpen(false)}
      >
        <div>
          <label>
            Font Size:
            <Input
              type="text"
              value={fontSize}
              onChange={(e) => setFontSize(e.target.value)}
            />
          </label>
        </div>
        <div>
          <label>
            Font Style:
            <Select value={fontStyle} onChange={(value) => setFontStyle(value)}>
              <Option value="sans-serif">Sans-serif</Option>
              <Option value="serif">Serif</Option>
              <Option value="monospace">Monospace</Option>
            </Select>
          </label>
        </div>
        <div>
          <label>
            Text Color:
            <Input
              type="color"
              value={textColor}
              onChange={(e) => setTextColor(e.target.value)}
            />
          </label>
        </div>
        <div>
          <label>
            Label Text:
            <Input
              type="text"
              value={labelText}
              onChange={(e) => setLabelText(e.target.value)}
            />
          </label>
        </div>
      </Modal>
    </div>
  );
};

export default MapComponent;
