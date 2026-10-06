import { useMemo } from 'react'
import { renderMap } from './mapLayout'
import './MapPanel.css'

export default function MapPanel({ isOpen, map, onClose }) {
  const ascii = useMemo(() => renderMap(map), [map])
  return (
    <div className={`map-panel ${isOpen ? 'map-panel--open' : ''}`}>
      <div className="map-panel__header">
        <span>MAP</span>
        <button className="map-panel__close" onClick={onClose}>[ESC]</button>
      </div>
      <div className="map-panel__content">
        <pre className="map-panel__ascii">{ascii}</pre>
        <div className="map-panel__legend">
          <span>[<span className="map-room--current">{'█'}</span>] You are here</span>
          <span>[{'░'}] Visited</span>
          <span>[?] Unknown</span>
        </div>
      </div>
    </div>
  )
}
