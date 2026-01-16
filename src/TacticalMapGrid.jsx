import React, { useState, useEffect, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Navigation, AlertCircle, Activity, Target } from 'lucide-react';

// Fix Leaflet default icon issue
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

/**
 * HAVERSINE DISTANCE FORMULA
 * ===========================
 * Calculates the great-circle distance between two points on Earth's surface.
 * This is the industry standard for geographic distance calculation.
 * 
 * Formula:
 * d = 2R × asin(√(sin²((lat2−lat1)/2) + cos(lat1) × cos(lat2) × sin²((lon2−lon1)/2)))
 * 
 * Where:
 * - R = 6371 km (Earth's mean radius)
 * - lat, lon are in radians
 * - Returns distance in kilometers
 * 
 * Why Haversine?
 * - Accounts for Earth's curvature (spherical model)
 * - Accurate for short and long distances
 * - Industry standard (Google Maps, Uber, Zomato, etc.)
 * - More accurate than Euclidean distance for geographic coordinates
 * 
 * @param {number} lat1 - First point latitude (degrees)
 * @param {number} lon1 - First point longitude (degrees)
 * @param {number} lat2 - Second point latitude (degrees)
 * @param {number} lon2 - Second point longitude (degrees)
 * @returns {number} Distance in kilometers
 */
const calculateHaversineDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Earth's radius in kilometers
  
  // Convert degrees to radians
  const toRadians = (degrees) => degrees * (Math.PI / 180);
  
  const φ1 = toRadians(lat1);
  const φ2 = toRadians(lat2);
  const Δφ = toRadians(lat2 - lat1);
  const Δλ = toRadians(lon2 - lon1);
  
  // Haversine formula
  const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  
  const c = 2 * Math.asin(Math.sqrt(a));
  
  const distance = R * c;
  
  return distance; // Returns kilometers
};

/**
 * PRIORITY SCORE CALCULATION
 * ===========================
 * Determines which patient the drone should prioritize.
 * 
 * Formula: priorityScore = severity × 1.5 − distanceInKm
 * 
 * Logic:
 * - Higher severity = Higher priority (critical patients first)
 * - Longer distance = Lower priority (time-sensitive emergencies)
 * - Multiplier 1.5 gives severity more weight than distance
 * 
 * Example:
 * - Patient A: severity=9, distance=2km → score = 9×1.5 - 2 = 11.5
 * - Patient B: severity=6, distance=0.5km → score = 6×1.5 - 0.5 = 8.5
 * - Drone goes to Patient A (higher score)
 * 
 * This simulates real emergency triage decision-making.
 */
const calculatePriorityScore = (severity, distanceKm) => {
  return severity * 1.5 - distanceKm;
};

/**
 * Generate accurate geographic offset for mock patients
 * Returns offset in degrees that equals specified distance in meters
 */
const generateGeoOffset = (baseLatitude, distanceMeters) => {
  // 1 degree latitude ≈ 111 km
  const latOffset = (distanceMeters / 1000) / 111;
  
  // 1 degree longitude varies by latitude: 111km × cos(latitude)
  const lngOffset = (distanceMeters / 1000) / (111 * Math.cos(baseLatitude * Math.PI / 180));
  
  return { latOffset, lngOffset };
};

/**
 * Generate Zomato-style irregular path
 * Creates a curved, organic-looking route between drone and patient
 */
const generateIrregularPath = (dronePos, patientPos) => {
  const path = [dronePos];
  
  const latDiff = patientPos.lat - dronePos.lat;
  const lngDiff = patientPos.lng - dronePos.lng;
  
  // Add 3 intermediate jittered points for curved effect
  for (let i = 1; i <= 3; i++) {
    const ratio = i / 4;
    const jitterLat = (Math.random() - 0.5) * 0.001; // Reduced jitter for smoother curves
    const jitterLng = (Math.random() - 0.5) * 0.001;
    
    path.push({
      lat: dronePos.lat + latDiff * ratio + jitterLat,
      lng: dronePos.lng + lngDiff * ratio + jitterLng
    });
  }
  
  path.push(patientPos);
  return path;
};

/**
 * Generate nearby patient coordinates within 300-800m radius
 * These represent potential emergency cases in the surrounding area
 */
const generateNearbyPatients = (primaryPatient, count = 3) => {
  const nearbyPatients = [];
  const minDistanceMeters = 300; // 300 meters
  const maxDistanceMeters = 800; // 800 meters
  
  // Predefined severity levels for realistic emergency scenarios
  const severityLevels = [7, 4, 2]; // HIGH, MODERATE, LOW
  
  for (let i = 0; i < count; i++) {
    // Random distance within range (in meters)
    const distance = minDistanceMeters + Math.random() * (maxDistanceMeters - minDistanceMeters);
    
    // Random angle for circular distribution
    const angle = Math.random() * 2 * Math.PI;
    
    // Calculate geographic offset
    const { latOffset, lngOffset } = generateGeoOffset(primaryPatient.latitude, distance);
    
    // Apply angle to offset
    const finalLatOffset = latOffset * Math.cos(angle);
    const finalLngOffset = lngOffset * Math.sin(angle);
    
    const severity = severityLevels[i] || Math.floor(Math.random() * 10) + 1;
    const lat = primaryPatient.latitude + finalLatOffset;
    const lng = primaryPatient.longitude + finalLngOffset;
    
    nearbyPatients.push({
      id: `PATIENT_P${i + 2}`, // P2, P3, P4 (P1 is primary)
      latitude: lat,
      longitude: lng,
      severity: severity,
      label: severity >= 8 ? 'CRITICAL' : severity >= 6 ? 'HIGH' : severity >= 4 ? 'MODERATE' : 'LOW'
    });
  }
  
  return nearbyPatients;
};

/**
 * SHARED TILE LAYER (PERFORMANCE OPTIMIZATION)
 * Using a memoized tile layer component to avoid recreation on every render
 */
const DarkTileLayer = React.memo(() => (
  <TileLayer
    url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
    attribution='&copy; <a href="https://carto.com/">CARTO</a>'
  />
));

/**
 * Single Tactical Map Component (OPTIMIZED)
 * Memoized to prevent unnecessary re-renders
 */
const TacticalMap = React.memo(({ patient, drone, isSelected, onClick, rank }) => {
  // Calculate distance using Haversine
  const distance = useMemo(() => 
    calculateHaversineDistance(drone.latitude, drone.longitude, patient.latitude, patient.longitude),
    [drone.latitude, drone.longitude, patient.latitude, patient.longitude]
  );
  
  // Calculate priority score
  const priorityScore = useMemo(() => 
    calculatePriorityScore(patient.severity, distance),
    [patient.severity, distance]
  );
  
  // Generate irregular path if selected
  const routePath = useMemo(() => {
    if (!isSelected) return [];
    return generateIrregularPath(
      { lat: drone.latitude, lng: drone.longitude },
      { lat: patient.latitude, lng: patient.longitude }
    ).map(p => [p.lat, p.lng]);
  }, [isSelected, drone.latitude, drone.longitude, patient.latitude, patient.longitude]);
  
  // Severity color mapping
  const getSeverityColor = (severity) => {
    if (severity >= 8) return { bg: '#EF4444', text: 'text-red-500', ring: 'ring-red-500' }; // Red - CRITICAL
    if (severity >= 6) return { bg: '#F97316', text: 'text-orange-500', ring: 'ring-orange-500' }; // Orange - HIGH
    if (severity >= 4) return { bg: '#EAB308', text: 'text-yellow-500', ring: 'ring-yellow-500' }; // Yellow - MODERATE
    return { bg: '#10B981', text: 'text-emerald-500', ring: 'ring-emerald-500' }; // Green - LOW
  };
  
  const severityColor = getSeverityColor(patient.severity);
  
  // Custom drone icon (memoized)
  const droneIcon = useMemo(() => new L.DivIcon({
    html: `
      <div style="transform: rotate(-45deg);">
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="12" cy="12" r="8" fill="#10B981" stroke="#fff" stroke-width="2"/>
          <path d="M12 6L12 12L16 12" stroke="#fff" stroke-width="2" stroke-linecap="round"/>
        </svg>
      </div>
    `,
    className: 'drone-marker',
    iconSize: [28, 28],
    iconAnchor: [14, 14]
  }), []);
  
  // Custom patient icon (memoized)
  const patientIcon = useMemo(() => new L.DivIcon({
    html: `
      <div style="
        width: 24px;
        height: 24px;
        background: ${severityColor.bg};
        border: 3px solid white;
        border-radius: 50%;
        box-shadow: 0 0 15px ${severityColor.bg};
        animation: pulse 2s infinite;
      "></div>
    `,
    className: 'patient-marker',
    iconSize: [24, 24],
    iconAnchor: [12, 12]
  }), [severityColor.bg]);
  
  return (
    <div 
      className={`relative rounded-lg overflow-hidden border-2 transition-all cursor-pointer group ${
        isSelected 
          ? 'border-blue-500 shadow-[0_0_20px_rgba(59,130,246,0.6)] scale-[1.02]' 
          : 'border-zinc-700 hover:border-zinc-600'
      }`}
      onClick={onClick}
    >
      {/* Rank Badge */}
      {rank && (
        <div className={`absolute top-2 left-2 z-[1001] ${
          rank === 1 ? 'bg-yellow-500 text-black' : 'bg-zinc-800 text-zinc-300'
        } rounded-md font-mono text-[9px] font-bold px-2 py-1 border border-white/20`}>
          <div>P{rank}</div>
          <div className="text-[8px] opacity-80">{patient.latitude.toFixed(2)}, {patient.longitude.toFixed(2)}</div>
        </div>
      )}
      
      {/* Map */}
      <MapContainer
        center={[patient.latitude, patient.longitude]}
        zoom={15}
        style={{ height: '100%', width: '100%' }}
        zoomControl={false}
        attributionControl={false}
        dragging={true}
        scrollWheelZoom={false}
        doubleClickZoom={false}
        touchZoom={false}
        preferCanvas={true} // PERFORMANCE: Use canvas rendering
      >
        <DarkTileLayer />
        
        {/* Drone Marker */}
        <Marker position={[drone.latitude, drone.longitude]} icon={droneIcon}>
          <Popup>
            <div className="text-xs font-mono">
              <strong className="text-emerald-500">DRONE_01</strong><br/>
              Battery: {drone.battery}%<br/>
              Altitude: {drone.altitude}m<br/>
              Status: {drone.status}
            </div>
          </Popup>
        </Marker>
        
        {/* Patient Marker */}
        <Marker position={[patient.latitude, patient.longitude]} icon={patientIcon}>
          <Popup>
            <div className="text-xs font-mono">
              <strong className={severityColor.text}>{patient.id}</strong><br/>
              Severity: {patient.severity}/10<br/>
              Status: {patient.label}<br/>
              Distance: {distance.toFixed(2)} km
            </div>
          </Popup>
        </Marker>
        
        {/* Route Line - Active gets solid animation, others get faded dashed */}
        {routePath.length > 0 && (
          <Polyline
            positions={routePath}
            pathOptions={{
              color: '#3B82F6',
              weight: isSelected ? 4 : 2,
              opacity: isSelected ? 0.9 : 0.3,
              dashArray: isSelected ? null : '6 8',
              lineCap: 'round',
              lineJoin: 'round'
            }}
          />
        )}
      </MapContainer>
      
      {/* Severity Badge (Top Right) */}
      <div className="absolute top-2 right-2 z-[1001] bg-black/90 backdrop-blur-sm rounded-lg p-2 border-2" style={{ borderColor: severityColor.bg }}>
        <div className="text-center">
          <div 
            className="text-xs font-black uppercase tracking-wider"
            style={{ color: severityColor.bg }}
          >
            {patient.label}
          </div>
          <div className="text-white font-mono text-[10px] mt-0.5">
            {patient.severity}/10
          </div>
        </div>
      </div>
      
      {/* Info Card (Bottom) */}
      <div className="absolute bottom-0 left-0 right-0 bg-black/90 backdrop-blur-sm p-2 border-t border-white/10">
        <div className="flex items-center justify-between mb-1">
          <span className="text-[9px] font-mono text-zinc-400">
            {patient.latitude.toFixed(4)}, {patient.longitude.toFixed(4)}
          </span>
          <span className="text-[9px] text-zinc-400 font-mono">
            {distance.toFixed(2)} km
          </span>
        </div>
        
        <div className="flex items-center justify-between">
          <span className="text-[9px] text-zinc-500 uppercase">Priority Score:</span>
          <span className={`font-bold text-sm ${isSelected ? 'text-blue-400' : 'text-white'}`}>
            {priorityScore.toFixed(2)}
          </span>
        </div>
      </div>
      
      {/* Selection Indicator */}
      {isSelected && (
        <div className="absolute inset-0 pointer-events-none border-4 border-blue-500 rounded-lg animate-pulse"></div>
      )}
    </div>
  );
});

TacticalMap.displayName = 'TacticalMap';

/**
 * Priority Ranking Panel
 * Shows sorted list of all patients by priority score
 */
const PriorityRankingPanel = React.memo(({ patients, drone, selectedId }) => {
  const rankedPatients = useMemo(() => {
    return patients
      .map(patient => {
        const distance = calculateHaversineDistance(
          drone.latitude, drone.longitude,
          patient.latitude, patient.longitude
        );
        const priority = calculatePriorityScore(patient.severity, distance);
        return { ...patient, distance, priority };
      })
      .sort((a, b) => b.priority - a.priority);
  }, [patients, drone]);
  
  const getSeverityColor = (severity) => {
    if (severity >= 8) return 'text-red-500';
    if (severity >= 6) return 'text-orange-500';
    if (severity >= 4) return 'text-yellow-500';
    return 'text-emerald-500';
  };
  
  return (
    <div className="bg-[#111625] border border-zinc-800 rounded-lg p-3 mb-3">
      <div className="flex items-center gap-2 mb-3">
        <Target className="w-4 h-4 text-blue-500" />
        <span className="text-[10px] font-bold text-zinc-300 uppercase tracking-wider">
          Priority Order
        </span>
      </div>
      
      <div className="space-y-2">
        {rankedPatients.map((patient, index) => (
          <div
            key={patient.id}
            className={`flex items-center justify-between p-2 rounded ${
              patient.id === selectedId
                ? 'bg-blue-500/20 border border-blue-500/50'
                : 'bg-zinc-900/50 border border-zinc-800'
            }`}
          >
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <span className={`text-xs font-bold flex-shrink-0 ${
                index === 0 ? 'text-yellow-400' : 'text-zinc-500'
              }`}>
                #{index + 1}
              </span>
              <span className="text-[9px] font-mono text-zinc-400 truncate">
                {patient.latitude.toFixed(2)}, {patient.longitude.toFixed(2)}
              </span>
              <span className={`text-[9px] font-bold uppercase flex-shrink-0 ${getSeverityColor(patient.severity)}`}>
                {patient.label}
              </span>
            </div>
            <span className={`text-xs font-bold flex-shrink-0 ${
              patient.id === selectedId ? 'text-blue-400' : 'text-white'
            }`}>
              {patient.priority.toFixed(1)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
});

PriorityRankingPanel.displayName = 'PriorityRankingPanel';

/**
 * Main Tactical Map Grid Component
 * Shows 4 maps: 1 primary SOS + 3 nearby patients
 * OPTIMIZED for performance and interactivity
 */
const TacticalMapGrid = ({ realPatient, drone }) => {
  const [nearbyPatients, setNearbyPatients] = useState([]);
  const [selectedPatientId, setSelectedPatientId] = useState(null);
  
  // Generate nearby patients on mount or when primary patient changes
  useEffect(() => {
    if (realPatient) {
      const nearby = generateNearbyPatients(realPatient, 3);
      setNearbyPatients(nearby);
    }
  }, [realPatient?.latitude, realPatient?.longitude]);
  
  // Combine all patients - PRIMARY + NEARBY
  const allPatients = useMemo(() => {
    if (!realPatient) return nearbyPatients;
    return [
      {
        id: 'PATIENT_P1', // Primary patient
        latitude: realPatient.latitude,
        longitude: realPatient.longitude,
        severity: realPatient.severity || 9,
        label: realPatient.label || 'CRITICAL'
      },
      ...nearbyPatients
    ];
  }, [realPatient, nearbyPatients]);
  
  // Calculate rankings
  const patientRankings = useMemo(() => {
    if (allPatients.length === 0 || !drone) return {};
    
    const ranked = allPatients
      .map(patient => {
        const distance = calculateHaversineDistance(
          drone.latitude, drone.longitude,
          patient.latitude, patient.longitude
        );
        const priority = calculatePriorityScore(patient.severity, distance);
        return { id: patient.id, priority };
      })
      .sort((a, b) => b.priority - a.priority);
    
    const rankings = {};
    ranked.forEach((item, index) => {
      rankings[item.id] = index + 1;
    });
    
    return rankings;
  }, [allPatients, drone]);
  
  // Auto-select highest priority patient
  useEffect(() => {
    if (allPatients.length === 0 || !drone) return;
    
    let highestPriority = -Infinity;
    let selectedId = null;
    
    allPatients.forEach(patient => {
      const distance = calculateHaversineDistance(
        drone.latitude, drone.longitude,
        patient.latitude, patient.longitude
      );
      const priority = calculatePriorityScore(patient.severity, distance);
      
      if (priority > highestPriority) {
        highestPriority = priority;
        selectedId = patient.id;
      }
    });
    
    setSelectedPatientId(selectedId);
  }, [allPatients, drone]);
  
  const handleRegenerate = () => {
    if (realPatient) {
      const nearby = generateNearbyPatients(realPatient, 3);
      setNearbyPatients(nearby);
    }
  };
  
  if (!realPatient || !drone) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-[#111625] rounded-xl border border-zinc-800">
        <div className="text-center text-zinc-500">
          <Activity className="w-8 h-8 mx-auto mb-2 opacity-40" />
          <p className="text-xs">Awaiting SOS Signal</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="w-full h-full flex flex-col">
      {/* Priority Ranking Panel */}
      <PriorityRankingPanel 
        patients={allPatients}
        drone={drone}
        selectedId={selectedPatientId}
      />
      
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
          <span className="text-[10px] font-bold text-zinc-300 uppercase tracking-wider">
            Tactical Situation Map
          </span>
        </div>
        <button 
          onClick={handleRegenerate}
          className="text-[9px] px-2 py-1 bg-zinc-800 hover:bg-zinc-700 rounded border border-zinc-700 text-zinc-400 transition-colors font-mono"
        >
          Recalculate Coordinates
        </button>
      </div>
      
      {/* 2×2 Grid of Maps */}
      <div className="grid grid-cols-2 gap-3 flex-1">
        {allPatients.map((patient) => (
          <TacticalMap
            key={patient.id}
            patient={patient}
            drone={drone}
            isSelected={selectedPatientId === patient.id}
            onClick={() => setSelectedPatientId(patient.id)}
            rank={patientRankings[patient.id]}
          />
        ))}
      </div>
      
      <style>{`
        @keyframes pulse {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.1); opacity: 0.8; }
        }
      `}</style>
    </div>
  );
};

export default React.memo(TacticalMapGrid);
