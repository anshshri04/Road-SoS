import React, { useState, useMemo } from "react";
import { 
  Compass, Navigation, ShieldCheck, MapPin, AlertTriangle, 
  Flame, Crosshair, HelpCircle, Layers, CheckCircle2 
} from "lucide-react";
import { Pothole, SOSAlert } from "../types";

interface InteractiveMapProps {
  potholes: Pothole[];
  alerts: SOSAlert[];
  userLat: number;
  userLng: number;
  userCity: string; // Passed to dynamically coordinate geography
  onMapClickReportPothole: (lat: number, lng: number) => void;
  activeSearchType: "Hospital" | "Petrol Pump" | "Service Station" | null;
  setActiveSearchType: (type: "Hospital" | "Petrol Pump" | "Service Station" | null) => void;
  selectedDestination: string | null;
  setSelectedDestination: (dest: string | null) => void;
  isOffline: boolean;
  gpsAccuracyText: string;
}

export default function InteractiveMap({
  potholes,
  alerts,
  userLat,
  userLng,
  userCity = "Lucknow",
  onMapClickReportPothole,
  activeSearchType,
  setActiveSearchType,
  selectedDestination,
  setSelectedDestination,
  isOffline,
  gpsAccuracyText
}: InteractiveMapProps) {
  // Map zoom style simulation: "standard", "detailed", "terrain"
  const [mapZoom, setMapZoom] = useState<"standard" | "detailed" | "terrain">("standard");
  const [hoveredMarker, setHoveredMarker] = useState<{ x: number; y: number; title: string, desc: string } | null>(null);

  // Dynamic Geographic Calibration Engine based on the active driver's city choice
  const calibration = useMemo(() => {
    const cityClean = userCity.trim().toLowerCase();
    
    // Default calibration values for Lucknow Gomti Nagar - Hazratganj region
    let latMin = 26.81;
    let latMax = 26.89;
    let lngMin = 80.90;
    let lngMax = 80.99;
    
    let pois = [
      { id: "poi-hos1", type: "Hospital", title: "SGPGI Emergency Hospital Lucknow", lat: 26.8375, lng: 80.9320, phone: "+91-522-2668004", distance: "1.4 km", rating: "4.7 ★" },
      { id: "poi-hos2", type: "Hospital", title: "Sahara MultiSpeciality Gomti Trauma", lat: 26.8620, lng: 80.9650, phone: "+91-522-6780001", distance: "2.1 km", rating: "4.5 ★" },
      { id: "poi-hos3", type: "Hospital", title: "Civil Hospital Trauma Wing Hazratganj", lat: 26.8490, lng: 80.9410, phone: "+91-522-2220141", distance: "2.8 km", rating: "4.8 ★" },
      
      { id: "poi-pet1", type: "Petrol Pump", title: "Hazratganj BPCL Premium Fuel Station", lat: 26.8450, lng: 80.9440, hours: "Open 24 hrs", distance: "0.8 km", rating: "4.2 ★" },
      { id: "poi-pet2", type: "Petrol Pump", title: "HP Gomti Nagar Auto Filling Station", lat: 26.8580, lng: 80.9570, hours: "Open 24 hrs", distance: "1.6 km", rating: "4.3 ★" },
      { id: "poi-pet3", type: "Petrol Pump", title: "Indian Oil Lucknow Cantt Fuel Depot", lat: 26.8280, lng: 80.9150, hours: "Closed after 11 PM", distance: "2.3 km", rating: "4.1 ★" },
      
      { id: "poi-srv1", type: "Service Station", title: "Maruti Gomti Authorized Towing", lat: 26.8520, lng: 80.9620, services: "Towing, Jumpstart, Tyre patch", distance: "1.9 km", rating: "4.6 ★" },
      { id: "poi-srv2", type: "Service Station", title: "Hazratganj Crane Recovery & Flatbed Depot", lat: 26.8410, lng: 80.9350, services: "Heavy flatbed crane support", distance: "2.5 km", rating: "4.9 ★" }
    ];

    if (cityClean.includes("delhi") || cityClean.includes("noida") || cityClean.includes("ncr") || cityClean.includes("gurugram")) {
      latMin = 28.51;
      latMax = 28.59;
      lngMin = 77.31;
      lngMax = 77.41;
      pois = [
        { id: "poi-hos1", type: "Hospital", title: "Fortis emergency Hospital Noida", lat: 28.5412, lng: 77.3780, phone: "+91-120-6622222", distance: "1.4 km", rating: "4.7 ★" },
        { id: "poi-hos2", type: "Hospital", title: "Metro MultiSpeciality Trauma Center", lat: 28.5280, lng: 77.3980, phone: "+91-120-4300000", distance: "2.1 km", rating: "4.5 ★" },
        { id: "poi-hos3", type: "Hospital", title: "Max Emergency Care Okhla Link", lat: 28.5520, lng: 77.3450, phone: "+91-120-2211444", distance: "2.9 km", rating: "4.8 ★" },
        
        { id: "poi-pet1", type: "Petrol Pump", title: "Indian Oil Sector 62 Refill Center", lat: 28.5380, lng: 77.3910, hours: "Open 24 hrs", distance: "0.8 km", rating: "4.2 ★" },
        { id: "poi-pet2", type: "Petrol Pump", title: "HP Supercharge Fuel Station Sector 18", lat: 28.5290, lng: 77.3610, hours: "Open 24 hrs", distance: "1.6 km", rating: "4.3 ★" },
        { id: "poi-pet3", type: "Petrol Pump", title: "Bharat Petroleum DND Auto Energy", lat: 28.5580, lng: 77.3120, hours: "Open 24 hrs", distance: "2.3 km", rating: "4.1 ★" },
        
        { id: "poi-srv1", type: "Service Station", title: "Maruti Authorized Road Assist & Tow", lat: 28.5320, lng: 77.3730, services: "Towing, Battery, Mechanical", distance: "1.9 km", rating: "4.6 ★" },
        { id: "poi-srv2", type: "Service Station", title: "Apex Premium Auto Towing Hub", lat: 28.5480, lng: 77.4060, services: "Flatbed towing, Crane", distance: "2.5 km", rating: "4.9 ★" }
      ];
    } else if (cityClean.includes("mumbai") || cityClean.includes("navi") || cityClean.includes("bandra") || cityClean.includes("pune")) {
      latMin = 19.01;
      latMax = 19.09;
      lngMin = 72.80;
      lngMax = 72.90;
      pois = [
        { id: "poi-hos1", type: "Hospital", title: "Lilavati Trauma Emergency Bandra", lat: 19.0412, lng: 72.8280, phone: "+91-22-26442644", distance: "1.2 km", rating: "4.8 ★" },
        { id: "poi-hos2", type: "Hospital", title: "KEM Public Emergency Hospital Unit", lat: 19.0180, lng: 72.8480, phone: "+91-22-24107000", distance: "2.3 km", rating: "4.4 ★" },
        { id: "poi-hos3", type: "Hospital", title: "Hinduja Emergency Trauma Center", lat: 19.0320, lng: 72.8350, phone: "+91-22-24452222", distance: "1.9 km", rating: "4.7 ★" },
        
        { id: "poi-pet1", type: "Petrol Pump", title: "BPCL Bandra Kurla Auto Refill", lat: 19.0550, lng: 72.8680, hours: "Open 24 hrs", distance: "0.9 km", rating: "4.5 ★" },
        { id: "poi-pet2", type: "Petrol Pump", title: "HP Junction Fuel Pump Worli Sea Link", lat: 19.0250, lng: 72.8180, hours: "Open 24 hrs", distance: "1.4 km", rating: "4.3 ★" },
        
        { id: "poi-srv1", type: "Service Station", title: "Mumbai Highway Mechanical Rescue", lat: 19.0480, lng: 72.8560, services: "Towing, Crane, Battery", distance: "2.0 km", rating: "4.7 ★" }
      ];
    } else if (cityClean.includes("bengaluru") || cityClean.includes("bangalore") || cityClean.includes("mysore")) {
      latMin = 12.91;
      latMax = 12.99;
      lngMin = 77.52;
      lngMax = 77.62;
      pois = [
        { id: "poi-hos1", type: "Hospital", title: "Manipal Emergency Trauma HAL Road", lat: 12.9512, lng: 77.5950, phone: "+91-80-25024444", distance: "1.5 km", rating: "4.8 ★" },
        { id: "poi-hos2", type: "Hospital", title: "Apollo Bannerghatta Emergency Care", lat: 12.9180, lng: 77.5850, phone: "+91-80-26304050", distance: "2.2 km", rating: "4.6 ★" },
        
        { id: "poi-pet1", type: "Petrol Pump", title: "BPCL Indiranagar Smart Fuels", lat: 12.9650, lng: 77.5820, hours: "Open 24 hrs", distance: "1.1 km", rating: "4.4 ★" },
        { id: "poi-pet2", type: "Petrol Pump", title: "HP MG Road City Refill Point", lat: 12.9450, lng: 77.5450, hours: "Closed after 11 PM", distance: "1.7 km", rating: "4.2 ★" },
        
        { id: "srv-1", type: "Service Station", title: "Bengaluru Flatbed Towing & Crane Tech", lat: 12.9320, lng: 77.5350, services: "Engine, Towing, Crane Assist", distance: "2.5 km", rating: "4.8 ★" }
      ];
    } else {
      // Direct programmatic adaptation loop if the city is not explicitly prebaked
      latMin = userLat - 0.04;
      latMax = userLat + 0.04;
      lngMin = userLng - 0.05;
      lngMax = userLng + 0.05;
      pois = [
        { id: "poi-hos1", type: "Hospital", title: `${userCity} Emergency Trauma Hospital`, lat: userLat + 0.005, lng: userLng - 0.012, phone: "+91-99999 10810", distance: "1.2 km", rating: "4.6 ★" },
        { id: "poi-pet1", type: "Petrol Pump", title: `${userCity} Premium Auto Fuels (24h)`, lat: userLat - 0.008, lng: userLng + 0.015, hours: "Open 24 hrs", distance: "0.9 km", rating: "4.3 ★" },
        { id: "poi-srv1", type: "Service Station", title: `${userCity} Mechanical Towing Guild`, lat: userLat + 0.012, lng: userLng + 0.008, services: "Full Recovery Towing, Mechanical Repair", distance: "1.5 km", rating: "4.7 ★" }
      ];
    }

    return { latMin, latMax, lngMin, lngMax, pois };
  }, [userCity, userLat, userLng]);

  const mapWidth = 800;
  const mapHeight = 500;

  // Coordinate Conversion Engine project Lat/Lng inside the SVG viewport safely
  const getCoords = (lat: number, lng: number) => {
    const { latMin, latMax, lngMin, lngMax } = calibration;
    
    // Safety boundaries to prevent coordinate leak overflows
    const clampedLng = Math.min(lngMax, Math.max(lngMin, lng));
    const clampedLat = Math.min(latMax, Math.max(latMin, lat));

    const x = ((clampedLng - lngMin) / (lngMax - lngMin)) * mapWidth;
    const y = mapHeight - (((clampedLat - latMin) / (latMax - latMin)) * mapHeight);
    
    return { x, y };
  };

  const userCoords = getCoords(userLat, userLng);

  // SVG representation of major local highway roads centered in the calibration region
  const roads = useMemo(() => {
    const { latMin, latMax, lngMin, lngMax } = calibration;
    const midLat = (latMin + latMax) / 2;
    const midLng = (lngMin + lngMax) / 2;

    return [
      [getCoords(latMin + 0.01, lngMin + 0.015), getCoords(midLat, midLng), getCoords(latMax - 0.01, lngMax - 0.015)], // Arterial Highway Bypass
      [getCoords(latMax - 0.015, lngMin + 0.01), getCoords(midLat + 0.005, midLng - 0.005), getCoords(latMin + 0.01, lngMax - 0.01)], // Linking Sector Express Road
      [getCoords(midLat - 0.015, lngMin + 0.005), getCoords(midLat, midLng), getCoords(midLat + 0.015, lngMax - 0.005)] // Metro Transit Corridor
    ];
  }, [calibration]);

  const activeDestinationCoords = useMemo(() => {
    if (!selectedDestination) return null;
    const match = calibration.pois.find(p => p.title === selectedDestination);
    if (match) return getCoords(match.lat, match.lng);
    const potholeMatch = potholes.find(pot => pot.title === selectedDestination);
    if (potholeMatch) return getCoords(potholeMatch.lat, potholeMatch.lng);
    return null;
  }, [selectedDestination, calibration.pois, potholes]);

  // Click on the map to place/record custom coordinates
  const handleSvgClick = (e: React.MouseEvent<SVGSVGElement>) => {
    const svg = e.currentTarget;
    const rect = svg.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const { latMin, latMax, lngMin, lngMax } = calibration;

    const clickLng = lngMin + (x / mapWidth) * (lngMax - lngMin);
    const clickLat = latMin + ((mapHeight - y) / mapHeight) * (latMax - latMin);

    onMapClickReportPothole(clickLat, clickLng);
  };

  return (
    <div id="interactive-map-root" className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl relative">
      {/* Map Control Header */}
      <div className="bg-slate-950 p-4 border-b border-slate-800 flex flex-wrap gap-2 items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-rose-500/10 rounded-lg text-rose-500 border border-rose-500/20">
            <Compass className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
              Live Safe Companion Radar — <span className="text-rose-400 font-mono tracking-tight font-extrabold uppercase">{userCity}</span>
              {isOffline ? (
                <span className="text-xs bg-amber-500/10 border border-amber-500/20 text-amber-500 px-2 py-0.5 rounded-full font-mono font-medium">
                  Offline Cache active
                </span>
              ) : (
                <span className="text-xs bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full font-mono font-medium animate-pulse">
                  GPS Active
                </span>
              )}
            </h3>
            <p className="text-xs text-slate-400 font-mono">
              GPS Lock {gpsAccuracyText}
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          <button 
            onClick={() => setMapZoom(prev => prev === "standard" ? "detailed" : prev === "detailed" ? "terrain" : "standard")}
            className="px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-xs text-slate-200 hover:bg-slate-700 transition font-mono flex items-center gap-1.5"
            id="map-view-style"
          >
            <Layers className="w-3.5 h-3.5" />
            Style: {mapZoom.toUpperCase()}
          </button>
          
          <button 
            onClick={() => {
              setActiveSearchType(null);
              setSelectedDestination(null);
            }}
            className="px-3 py-1.5 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 rounded-lg text-xs text-rose-400 transition font-mono"
            id="clear-nav-route"
          >
            Clear Route
          </button>
        </div>
      </div>

      {/* Map visualization canvas viewport */}
      <div className="relative overflow-hidden bg-slate-950 h-[380px] sm:h-[450px] cursor-crosshair">
        {/* SVG Drawing Layer */}
        <svg 
          viewBox={`0 0 ${mapWidth} ${mapHeight}`} 
          className="w-full h-full object-cover select-none"
          onClick={handleSvgClick}
        >
          {/* Map Grid Pattern background */}
          <defs>
            <pattern id="city-radar-grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#1e293b" strokeWidth="0.5" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill={mapZoom === "terrain" ? "#0f172a" : "#020617"} />
          <rect width="100%" height="100%" fill="url(#city-radar-grid)" />

          {/* District boundary outline rings for visual safety tracking grids */}
          <circle cx="400" cy="250" r="230" fill="none" stroke="#1e293b" strokeWidth="1" strokeDasharray="5 5" />
          <circle cx="400" cy="250" r="140" fill="none" stroke="#101726" strokeWidth="1" strokeDasharray="3 3" />

          {/* Highway bypass lines */}
          {roads.map((road, index) => {
            const pathData = road.map((pt, i) => `${i === 0 ? 'M' : 'L'} ${pt.x} ${pt.y}`).join(' ');
            return (
              <g key={index}>
                {/* Under-glow backline */}
                <path 
                  d={pathData} 
                  fill="none" 
                  stroke={mapZoom === "terrain" ? "#334155" : "#1e293b"} 
                  strokeWidth="8" 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                />
                {/* Center highway dotted line */}
                <path 
                  d={pathData} 
                  fill="none" 
                  stroke="#475569" 
                  strokeWidth="1.5" 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeDasharray="4 4" 
                />
              </g>
            );
          })}

          {/* Active Navigation Path Line Routing */}
          {activeDestinationCoords && (
            <g>
              <line 
                x1={userCoords.x} 
                y1={userCoords.y} 
                x2={activeDestinationCoords.x} 
                y2={activeDestinationCoords.y} 
                stroke="#06b6d4" 
                strokeWidth="6" 
                strokeLinecap="round"
                className="opacity-25 animate-pulse"
              />
              <line 
                x1={userCoords.x} 
                y1={userCoords.y} 
                x2={activeDestinationCoords.x} 
                y2={activeDestinationCoords.y} 
                stroke="#06b6d4" 
                strokeWidth="2.5" 
                strokeLinecap="round"
                strokeDasharray="6 6"
              />
            </g>
          )}

          {/* Render Points of Interest calibrated dynamically */}
          {calibration.pois.map((poi) => {
            const { x, y } = getCoords(poi.lat, poi.lng);
            const isMatch = activeSearchType === poi.type;
            const isTargeted = selectedDestination === poi.title;
            
            let filterColor = "text-slate-500 fill-slate-900 border-slate-700";
            let markerColor = "#475569";
            if (poi.type === "Hospital") {
              filterColor = "text-rose-400";
              markerColor = "#f43f5e";
            } else if (poi.type === "Petrol Pump") {
              filterColor = "text-amber-400";
              markerColor = "#f59e0b";
            } else if (poi.type === "Service Station") {
              filterColor = "text-sky-400";
              markerColor = "#38bdf8";
            }

            return (
              <g 
                key={poi.id}
                className={`transition-all duration-300 cursor-pointer ${isMatch || isTargeted ? "scale-125 opacity-100" : "opacity-70 hover:opacity-100"}`}
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedDestination(poi.title);
                  setActiveSearchType(poi.type as any);
                }}
                onMouseEnter={() => setHoveredMarker({
                  x, 
                  y, 
                  title: poi.title, 
                  desc: `${poi.type === "Hospital" ? "📞 Emergency contact: " + poi.phone : poi.type === "Petrol Pump" ? "⛽ Availability: " + poi.hours : "🛠️ Services: " + poi.services} | 📍 Distance: ${poi.distance}` 
                })}
                onMouseLeave={() => setHoveredMarker(null)}
              >
                {(isMatch || isTargeted) && (
                  <circle cx={x} cy={y} r="18" fill="none" stroke={markerColor} strokeWidth="2" className="animate-ping opacity-35" />
                )}
                
                {/* Marker Bullet */}
                <circle cx={x} cy={y} r="8" fill="#0f172a" stroke={markerColor} strokeWidth="3" />
                {poi.type === "Hospital" && (
                  <path d={`M ${x - 3} ${y} L ${x + 3} ${y} M ${x} ${y - 3} L ${x} ${y + 3}`} stroke="#ffffff" strokeWidth="2.5" />
                )}
                {poi.type === "Petrol Pump" && (
                  <circle cx={x} cy={y} r="2.5" fill="#ffffff" />
                )}
                {poi.type === "Service Station" && (
                  <path d={`M ${x-2} ${y-2} L ${x+2} ${y+2}`} stroke="#ffffff" strokeWidth="2" />
                )}

                {/* Micro Label on visual activation */}
                {(isMatch || isTargeted) && (
                  <g className="translate-y-[-14]">
                    <rect x={x - 45} y={y - 25} width="90" height="15" rx="3" fill="#020617" stroke={markerColor} strokeWidth="1" />
                    <text x={x} y={y - 15} textAnchor="middle" fill="#f1f5f9" fontSize="8" fontWeight="bold">
                      {poi.title.substring(0, 14)}
                    </text>
                  </g>
                )}
              </g>
            );
          })}

          {/* Render Active Pothole Alert coordinates reported in DB */}
          {potholes
            .filter((pot) => pot.city.toLowerCase() === userCity.toLowerCase() || pot.city === "" || pot.city == null)
            .map((pot) => {
              const { x, y } = getCoords(pot.lat, pot.lng);
              const isTargeted = selectedDestination === pot.title;
              const size = pot.severity === "Critical" ? 11 : pot.severity === "High" ? 9 : 7;
              const color = pot.severity === "Critical" ? "#ef4444" : pot.severity === "High" ? "#f97316" : "#eab308";

              return (
                <g
                  key={pot.id}
                  className="cursor-pointer hover:scale-125 transition"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedDestination(pot.title);
                  }}
                  onMouseEnter={() => setHoveredMarker({ x, y, title: pot.title, desc: `⚠️ Hazard Severity: ${pot.severity} | reported by: ${pot.reportedBy}` })}
                  onMouseLeave={() => setHoveredMarker(null)}
                >
                  {(pot.severity === "Critical" || pot.severity === "High" || isTargeted) && (
                    <circle cx={x} cy={y} r="20" fill="none" stroke={color} strokeWidth="1" className="animate-ping opacity-40 duration-[3000ms]" />
                  )}
                  
                  {/* Warning obstacle triangle */}
                  <polygon points={`${x},${y - size} ${x - size},${y + size} ${x + size},${y + size}`} fill={color} stroke="#020617" strokeWidth="1.5" />
                  <circle cx={x} cy={y + size/2} r="1" fill="#ffffff" />
                  
                  {isTargeted && (
                    <g className="translate-y-[-16]">
                      <rect x={x - 50} y={y - 25} width="100" height="15" rx="3" fill="#450a0a" stroke="#ef4444" strokeWidth="1" />
                      <text x={x} y={y - 15} textAnchor="middle" fill="#fee2e2" fontSize="8" fontWeight="bold">
                        HAZARD LOCKED
                      </text>
                    </g>
                  )}
                </g>
              );
            })}

          {/* Render Active SOS Distress targets */}
          {alerts
            .filter((al) => (al.city.toLowerCase() === userCity.toLowerCase() || al.city == null) && al.status !== "Resolved")
            .map((al) => {
              const { x, y } = getCoords(al.lat, al.lng);
              return (
                <g
                  key={al.id}
                  className="scale-110 cursor-pointer"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedDestination(al.message);
                  }}
                  onMouseEnter={() => setHoveredMarker({ x, y, title: `🚨 Emergency SOS: ${al.type}`, desc: `${al.message} | Crew Dispatch Call: ${al.phone}` })}
                  onMouseLeave={() => setHoveredMarker(null)}
                >
                  <circle cx={x} cy={y} r="25" fill="none" stroke="#f43f5e" strokeWidth="1.5" className="animate-ping" />
                  <circle cx={x} cy={y} r="8" fill="#f43f5e" stroke="#ffffff" strokeWidth="2" />
                  <text x={x} y={y-15} textAnchor="middle" fill="#f43f5e" fontSize="9" fontWeight="extrabold" className="font-mono bg-slate-950 px-1 rounded border border-slate-800">
                    SOS LIVE
                  </text>
                </g>
              );
            })}

          {/* Dynamic User Vehicle Live positioning arrow */}
          <g className="transition-all duration-700">
            <circle cx={userCoords.x} cy={userCoords.y} r="35" fill="none" stroke="#06b6d4" strokeWidth="0.5" className="opacity-25" />
            <circle cx={userCoords.x} cy={userCoords.y} r="16" fill="none" stroke="#06b6d4" strokeWidth="1.5" className="opacity-40 animate-ping" />
            
            {/* Nav arrow and center anchor node */}
            <circle cx={userCoords.x} cy={userCoords.y} r="7" fill="#06b6d4" stroke="#ffffff" strokeWidth="2.5" />
            <polygon points={`${userCoords.x},${userCoords.y - 12} ${userCoords.x - 6},${userCoords.y + 6} ${userCoords.x},${userCoords.y + 2} ${userCoords.x + 6},${userCoords.y + 6}`} fill="#06b6d4" />
          </g>

          {/* Dynamic India scale and GPS watermark inside vector illustration */}
          <text x="25" y="475" fill="#475569" fontSize="10" fontFamily="Courier" fontWeight="semibold">
            {userCity.toUpperCase()} RADAR COMPASS SCALE: 0 ------ 2.5 KM 
          </text>
        </svg>

        {/* Floating Info Overlay inside vector page map */}
        <div className="absolute bottom-4 left-4 bg-slate-1000/95 backdrop-blur-md border border-slate-800/80 p-3 rounded-xl shadow-lg flex flex-col gap-1 max-w-[220px] z-10 text-slate-200">
          <span className="text-[10px] uppercase tracking-wider font-bold text-cyan-400 font-mono">
            Click Map to Alert Drivers
          </span>
          <p className="text-[11px] leading-tight text-slate-400">
            Tap anywhere to instantly test, place, and dispatch pothole markers or alerts in the {userCity} zone.
          </p>
        </div>

        {/* Right compass dashboard indicator */}
        <div className="absolute right-4 top-4 bg-slate-950/90 border border-slate-800 p-3 rounded-xl flex flex-col items-center justify-center z-10 select-none">
          <Navigation className="w-4 h-4 text-cyan-400 transform rotate-45 animate-bounce mb-1" />
          <span className="text-[10px] font-bold text-slate-300 font-mono">GPS COMPASS</span>
          <span className="text-[9px] text-slate-500 font-mono">SIMULATED OK</span>
        </div>
      </div>

      {/* Map Control Footer */}
      <div className="bg-slate-900 p-3 border-t border-slate-800 flex flex-wrap gap-4 items-center justify-between text-xs text-slate-300 font-mono">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse"></span>
          <span>{userCity} Active Alerts: <strong>{potholes.filter(p => p.city.toLowerCase() === userCity.toLowerCase()).length} Potholes Radar</strong></span>
        </div>

        {selectedDestination && (
          <div className="flex items-center gap-2 bg-cyan-950/40 border border-cyan-800/30 px-3 py-1 rounded-full text-[11px] text-cyan-400">
            <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
            <span className="truncate max-w-[240px]">Live Routing: <strong>{selectedDestination}</strong></span>
          </div>
        )}

        <div className="flex items-center gap-1 text-slate-400">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          <span>Active Highway Security Companion Engine</span>
        </div>
      </div>
    </div>
  );
}
