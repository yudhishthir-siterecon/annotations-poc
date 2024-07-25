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
import { Select, Input, Button, Slider } from 'antd';
import './MapComponent.css'; // For custom styling

const { Option } = Select;

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

const MapComponent: React.FC = () => {
  const mapRef = useRef<HTMLDivElement>(null);
  const [fontSize, setFontSize] = useState('16px');
  const [fontStyle, setFontStyle] = useState('sans-serif');
  const [textColor, setTextColor] = useState('#000000');
  const [labelText, setLabelText] = useState('Your Label');
  const [currentPosition, setCurrentPosition] = useState<[number, number] | null>(null);
  const [editingFeature, setEditingFeature] = useState<Feature<Point> | null>(null);
  const [interactionType, setInteractionType] = useState('None');
  
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

      let draw: Draw | null = null; // Global variable for draw interaction

      const addInteraction = () => {
        if (draw) {
          map.removeInteraction(draw);
          map.getTargetElement().style.cursor = ''; // Reset cursor
        }
        if (interactionType === 'LineString') {
          draw = new Draw({
            source: source,
            type: 'LineString',
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
          map.getTargetElement().style.cursor = 'crosshair'; // Change cursor to crosshair when drawing
        }
      };

      map.on('singleclick', (evt) => {
        if (interactionType === 'Label') {
          const [x, y] = evt.coordinate as [number, number];
          setCurrentPosition([x, y]);
          setEditingFeature(null);
        } else if (interactionType === 'None') {
          const features = map.getFeaturesAtPixel(evt.pixel);
          const feature = features ? features[0] : null;
          if (feature && feature.getGeometry() instanceof Point) {
            const labelFeature = feature as Feature<Point>;
            setEditingFeature(labelFeature);
            setLabelText(labelFeature.get('text') || '');
            setFontSize(labelFeature.get('fontSize') || '16px');
            setFontStyle(labelFeature.get('fontStyle') || 'sans-serif');
            setTextColor(labelFeature.get('textColor') || '#000000');
          }
        }
      });

      addInteraction();

      return () => {
        map.setTarget(undefined);
      };
    }
  }, [interactionType]);

  const addLabel = () => {
    if (currentPosition && !editingFeature) {
      const labelFeature = new Feature({
        geometry: new Point(currentPosition),
        text: labelText,
        fontSize: fontSize,
        fontStyle: fontStyle,
        textColor: textColor,
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
    } else if (editingFeature) {
      editingFeature.set('text', labelText);
      editingFeature.set('fontSize', fontSize);
      editingFeature.set('fontStyle', fontStyle);
      editingFeature.set('textColor', textColor);
      editingFeature.setStyle(
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
    }

    setCurrentPosition(null);
    setEditingFeature(null);
  };

  const deleteLabel = () => {
    if (editingFeature) {
      source.removeFeature(editingFeature);
    }
    setEditingFeature(null);
  };

  const clearLabels = () => {
    source.clear();
  };

  return (
    <div className="map-container">
      <div className="sidebar">
        <Select
          defaultValue="None"
          style={{ width: '100%' }}
          onChange={(value) => setInteractionType(value)}
        >
          <Option value="None">None</Option>
          <Option value="LineString">Draw Line</Option>
          <Option value="Label">Add Label</Option>
        </Select>
        <Button onClick={clearLabels} style={{ width: '100%', marginTop: 10 }}>
          Clear Labels
        </Button>
        <div style={{ marginTop: 20 }}>
          <label>Font Size:</label>
          <Slider
            min={8}
            max={72}
            value={parseInt(fontSize, 10)}
            onChange={(value) => setFontSize(`${value}px`)}
          />
        </div>
        <div style={{ marginTop: 20 }}>
          <label>Font Style:</label>
          <Select value={fontStyle} style={{ width: '100%' }} onChange={(value) => setFontStyle(value)}>
            <Option value="sans-serif">Sans-serif</Option>
            <Option value="serif">Serif</Option>
            <Option value="monospace">Monospace</Option>
          </Select>
        </div>
        <div style={{ marginTop: 20 }}>
          <label>Text Color:</label>
          <Input
            type="color"
            value={textColor}
            onChange={(e) => setTextColor(e.target.value)}
          />
        </div>
        <div style={{ marginTop: 20 }}>
          <Button onClick={deleteLabel} danger style={{ width: '100%' }}>
            Delete Label
          </Button>
        </div>
      </div>
      <div ref={mapRef} className="map" />
      {currentPosition && (
        <div
          contentEditable
          suppressContentEditableWarning
          className="editable-label"
          style={{
            left: `${currentPosition[0]}px`,
            top: `${currentPosition[1]}px`,
            fontSize: fontSize,
            fontFamily: fontStyle,
            color: textColor,
          }}
          onInput={(e) => setLabelText((e.target as HTMLDivElement).innerText)}
          onBlur={addLabel}
        >
          {labelText}
        </div>
      )}
    </div>
  );
};

export default MapComponent;
