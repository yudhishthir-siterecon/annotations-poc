import React, { useEffect, useRef, useState, useCallback } from 'react';
import 'ol/ol.css';
import { Map, View } from 'ol';
import { Tile as TileLayer, Vector as VectorLayer } from 'ol/layer';
import { OSM, Vector as VectorSource } from 'ol/source';
import { Point } from 'ol/geom';
import { Feature } from 'ol';
import { Style, Fill, Text } from 'ol/style';
import { fromLonLat } from 'ol/proj';
import Overlay from 'ol/Overlay';

const MapComponent: React.FC = () => {
  const mapRef = useRef<HTMLDivElement>(null);
  const vectorSource = new VectorSource();
  const [selectedFeature, setSelectedFeature] = useState<Feature | null>(null);
  const [inputValue, setInputValue] = useState('');
  const [fontSize, setFontSize] = useState('16px');
  const [fontFamily, setFontFamily] = useState('sans-serif');
  const [fontColor, setFontColor] = useState('#ffffff');
  const [backgroundColor, setBackgroundColor] = useState('#a83299');
  const [rotation, setRotation] = useState(0); // Angle in degrees

  const createLabelStyle = useCallback(
    (text: string, fontSize: string, fontFamily: string, fontColor: string, backgroundColor: string, rotation: number) =>
      new Style({
        text: new Text({
          font: `${fontSize} ${fontFamily}`,
          text,
          fill: new Fill({
            color: fontColor,
          }),
          backgroundFill: new Fill({
            color: backgroundColor,
          }),
          padding: [2, 2, 2, 2],
          rotation: rotation * (Math.PI / 180), // Convert to radians
        }),
      }),
    []
  );

  const updateFeatureStyle = useCallback(
    (feature: Feature) => {
      feature.setStyle(createLabelStyle(inputValue, fontSize, fontFamily, fontColor, backgroundColor, rotation));
      feature.set('text', inputValue);
      feature.set('rotation', rotation);
    },
    [inputValue, fontSize, fontFamily, fontColor, backgroundColor, rotation, createLabelStyle]
  );

  useEffect(() => {
    const map = new Map({
      target: mapRef.current!,
      layers: [
        new TileLayer({
          source: new OSM(),
        }),
        new VectorLayer({
          source: vectorSource,
        }),
      ],
      view: new View({
        center: fromLonLat([-98.5795, 39.8283]),
        zoom: 4,
      }),
    });

    const overlay = new Overlay({
      element: document.getElementById('popup')!,
      positioning: 'bottom-center',
      stopEvent: false,
    });
    map.addOverlay(overlay);

    const handleMapClick = (event: any) => {
      const feature = map.forEachFeatureAtPixel(event.pixel, (feature) => feature as Feature);
      if (feature) {
        setSelectedFeature(feature);
        const coordinate = (feature.getGeometry() as Point).getCoordinates();
        if (coordinate) {
          overlay.setPosition(coordinate);
        }
        setInputValue(feature.get('text') || '');
        const style = feature.getStyle() as Style;
        if (style) {
          const textStyle = style.getText() as Text;
          if (textStyle) {
            const font = textStyle.getFont();
            if (font) {
              const [size, ...familyParts] = font.split(' ');
              const family = familyParts.join(' ');
              setFontSize(size);
              setFontFamily(family);
            }
            const fill = textStyle.getFill();
            if (fill) {
              setFontColor(fill.getColor() as string);
            }
            const backgroundFill = textStyle.getBackgroundFill();
            if (backgroundFill) {
              setBackgroundColor(backgroundFill.getColor() as string);
            }
            const rotation = textStyle.getRotation();
            if (rotation !== undefined) {
              setRotation(rotation * (180 / Math.PI)); // Convert to degrees
            } else {
              setRotation(0);
            }
          }
        }
      } else {
        const coordinate = event.coordinate;
        const newFeature = new Feature({
          geometry: new Point(coordinate),
          text: '',
        });
        newFeature.setStyle(createLabelStyle('', fontSize, fontFamily, fontColor, backgroundColor, 0));
        vectorSource.addFeature(newFeature);
        setSelectedFeature(newFeature);
        setInputValue('');
        setFontSize('16px');
        setFontFamily('sans-serif');
        setFontColor('#ffffff');
        setBackgroundColor('#a83299');
        setRotation(0);
        overlay.setPosition(coordinate);
      }
    };

    map.on('click', handleMapClick);

    return () => {
      map.setTarget(undefined);
    };
  }, [createLabelStyle]);

  useEffect(() => {
    if (selectedFeature) {
      updateFeatureStyle(selectedFeature);
    }
  }, [inputValue, fontSize, fontFamily, fontColor, backgroundColor, rotation, selectedFeature, updateFeatureStyle]);

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(event.target.value);
  };

  const handleFontSizeChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setFontSize(event.target.value);
  };

  const handleFontFamilyChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setFontFamily(event.target.value);
  };

  const handleFontColorChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setFontColor(event.target.value);
  };

  const handleBackgroundColorChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setBackgroundColor(event.target.value);
  };

  const handleRotationChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRotation(parseFloat(event.target.value));
  };

  return (
    <div>
      <div ref={mapRef} className="map" style={{ width: '100vw', height: '100vh' }}></div>
      {selectedFeature && (
        <div id="popup" className="popup">
          <input type="text" value={inputValue} onChange={handleInputChange} placeholder="Text" />
          <input type="text" value={fontSize} onChange={handleFontSizeChange} placeholder="Font Size" />
          <input type="text" value={fontFamily} onChange={handleFontFamilyChange} placeholder="Font Family" />
          <input type="color" value={fontColor} onChange={handleFontColorChange} placeholder="Font Color" />
          <input type="color" value={backgroundColor} onChange={handleBackgroundColorChange} placeholder="Background Color" />
          <input type="number" value={rotation} onChange={handleRotationChange} placeholder="Rotation Angle (degrees)" />
        </div>
      )}
      <style>
        {`
          .map {
            width: 100vw;
            height: 100vh;
            position: relative;
          }
          .popup {
            position: absolute;
            top: 10px;
            right: 10px;
            background: white;
            padding: 10px;
            border: 1px solid black;
            border-radius: 3px;
            z-index: 1000;
          }
          .popup input {
            display: block;
            margin: 5px 0;
          }
        `}
      </style>
    </div>
  );
};

export default MapComponent;
