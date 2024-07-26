import React, { useState, useEffect, useRef } from 'react';
import { Map, Overlay } from 'ol';

interface NoteOverlayProps {
  overlay: Overlay;
  isActive: boolean;
  setActiveOverlay: (overlay: Overlay) => void;
  map: Map;
}

const NoteOverlay: React.FC<NoteOverlayProps> = ({ overlay, isActive, setActiveOverlay, map }) => {
  const [note, setNote] = useState<string>('');
  const [size, setSize] = useState<{ width: number; height: number }>({ width: 200, height: 100 });
  const [rotation, setRotation] = useState<number>(0);
  const [storedInteractions, setStoredInteractions] = useState<any[]>([]);

  const overlayRef = useRef<HTMLDivElement>(null);

  const handleMouseDown = (e: React.MouseEvent, corner: string) => {
    e.stopPropagation();
    e.preventDefault();
    setActiveOverlay(overlay);
    disableMapInteractions();

    const startX = e.clientX;
    const startY = e.clientY;
    const startWidth = size.width;
    const startHeight = size.height;

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const newWidth = startWidth + (moveEvent.clientX - startX);
      const newHeight = startHeight + (moveEvent.clientY - startY);

      setSize({
        width: newWidth > 50 ? newWidth : 50,
        height: newHeight > 50 ? newHeight : 50,
      });
    };

    const handleMouseUp = () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      enableMapInteractions();
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  const handleRotateMouseDown = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setActiveOverlay(overlay);
    disableMapInteractions();

    const centerX = overlayRef.current!.offsetLeft + size.width / 2;
    const centerY = overlayRef.current!.offsetTop + size.height / 2;

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const dx = moveEvent.clientX - centerX;
      const dy = moveEvent.clientY - centerY;
      const angle = Math.atan2(dy, dx);
      const degree = angle * (180 / Math.PI);

      setRotation(degree);
    };

    const handleMouseUp = () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      enableMapInteractions();
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  const disableMapInteractions = () => {
    const interactions = map.getInteractions().getArray().slice();
    setStoredInteractions(interactions);
    // map.setProperties({ interactions: [] });
  };

  const enableMapInteractions = () => {
    // map.setProperties({ interactions: [] });
  };

  useEffect(() => {
    const element = overlayRef.current;
    if (element) {
      element.style.width = `${size.width}px`;
      element.style.height = `${size.height}px`;
      element.style.transform = `rotate(${rotation}deg)`;
    }
  }, [size, rotation]);

  return (
    <div
      ref={overlayRef}
      className={`note ${isActive ? 'active' : ''}`}
      onMouseDown={(e) => {
        e.stopPropagation();
        setActiveOverlay(overlay);
      }}
      style={{
        width: `${size.width}px`,
        height: `${size.height}px`,
        transform: `rotate(${rotation}deg)`,
      }}
    >
      <textarea
        value={note}
        onChange={(e) => setNote(e.target.value)}
        placeholder="Add your note here..."
        style={{ width: '100%', height: '100%', resize: 'none', border: 'none', outline: 'none' }}
        onClick={(e) => e.stopPropagation()}
      ></textarea>
      <div className="resize-dots">
        <div className="resize-dot top-left" onMouseDown={(e) => handleMouseDown(e, 'top-left')}></div>
        <div className="resize-dot top-right" onMouseDown={(e) => handleMouseDown(e, 'top-right')}></div>
        <div className="resize-dot bottom-left" onMouseDown={(e) => handleMouseDown(e, 'bottom-left')}></div>
        <div className="resize-dot bottom-right" onMouseDown={(e) => handleMouseDown(e, 'bottom-right')}></div>
      </div>
      <div className="rotate-handle" onMouseDown={handleRotateMouseDown}></div>
    </div>
  );
};

export default NoteOverlay;
