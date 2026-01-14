import React, { useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix default marker icons (Leaflet bug with bundlers)
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Custom icons
const patientIcon = new L.Icon({
  iconUrl: 'data:image/svg+xml;base64,' + btoa(`
    <svg width="32" height="32" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
      <circle cx="16" cy="16" r="12" fill="#ef4444" stroke="#fff" stroke-width="2"/>
      <circle cx="16" cy="16" r="4" fill="#fff"/>
    </svg>
  `),
  iconSize: [32, 32],
  iconAnchor: [16, 16],
  popupAnchor: [0, -16]
});

const droneIcon = new L.Icon({
  iconUrl: 'data:image/svg+xml;base64,' + btoa(`
    <svg width="32" height="32" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
      <circle cx="16" cy="16" r="12" fill="#10b981" stroke="#fff" stroke-width="2"/>
      <path d="M16 8 L20 16 L16 14 L12 16 Z" fill="#fff"/>
    </svg>
  `),
  iconSize: [32, 32],
  iconAnchor: [16, 16],
  popupAnchor: [0, -16]
});

// Component to recenter map when patient location changes
function RecenterMap({ center }) {
  const map = useMap();
  
  useEffect(() => {
    if (center) {
      map.setView(center, map.getZoom());
    }
  }, [center, map]);
  
  return null;
}

export default function LiveLocationMap({ patientLocation, droneLocation, showDrone, className }) {
  // Default center (Delhi) if no location yet
  const defaultCenter = [28.6139, 77.2090];
  const center = patientLocation ? [patientLocation.lat, patientLocation.lng] : defaultCenter;

  return (
    <div className={`relative ${className}`}>
      <MapContainer
        center={center}
        zoom={16}
        style={{ height: '100%', width: '100%', borderRadius: '12px' }}
        zoomControl={false}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        />
        
        <RecenterMap center={center} />

        {/* Patient Marker */}
        {patientLocation && (
          <Marker 
            position={[patientLocation.lat, patientLocation.lng]} 
            icon={patientIcon}
          >
            <Popup>
              <div className="text-center">
                <strong className="text-red-600">Patient Location</strong><br />
                <span className="text-xs text-gray-600">
                  {patientLocation.lat.toFixed(6)}, {patientLocation.lng.toFixed(6)}
                </span>
              </div>
            </Popup>
          </Marker>
        )}

        {/* Drone Marker */}
        {showDrone && droneLocation && (
          <Marker 
            position={[droneLocation.lat, droneLocation.lng]} 
            icon={droneIcon}
          >
            <Popup>
              <div className="text-center">
                <strong className="text-emerald-600">Drone En Route</strong><br />
                <span className="text-xs text-gray-600">
                  {droneLocation.lat.toFixed(6)}, {droneLocation.lng.toFixed(6)}
                </span>
              </div>
            </Popup>
          </Marker>
        )}
      </MapContainer>

      {/* Tactical Overlay */}
      <div className="absolute top-3 left-3 z-[1000] text-[9px] font-mono text-zinc-600 tracking-widest bg-black/60 px-2 py-1 rounded backdrop-blur-sm border border-white/10 pointer-events-none">
        LIVE GPS TRACKING
      </div>

      {showDrone && (
        <div className="absolute top-3 right-3 z-[1000] text-[9px] font-mono text-emerald-400 bg-emerald-900/60 px-2 py-1 rounded border border-emerald-500/30 pointer-events-none backdrop-blur-sm">
          DRONE ACTIVE
        </div>
      )}
    </div>
  );
}
