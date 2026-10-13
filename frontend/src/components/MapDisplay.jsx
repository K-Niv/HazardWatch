import React, { useEffect, useMemo } from 'react'
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet'
import L from 'leaflet'
import { MapPin, Navigation } from 'lucide-react'
import './MapDisplay.css'

// Helper component to smoothly pan/fly when coordinates change
function MapCenterController({ center }) {
  const map = useMap()

  useEffect(() => {
    if (center && typeof center[0] === 'number' && typeof center[1] === 'number') {
      map.flyTo(center, 9, { duration: 1.2, easeLinearity: 0.25 })
    }
  }, [center, map])

  return null
}

export default function MapDisplay({
  lat = 28.6139,
  lon = 77.2090,
  cityName = 'New Delhi',
  country = 'India',
  hazardType = 'heatwave',
}) {
  const isHeatwave = hazardType === 'heatwave'
  const position = useMemo(() => [lat, lon], [lat, lon])

  // Custom vector beacon pin to avoid missing PNG asset issues and provide glowing climate styling
  const customIcon = useMemo(() => {
    const pulseBg = isHeatwave ? 'rgba(249, 115, 22, 0.45)' : 'rgba(6, 182, 212, 0.45)'
    const coreBg = isHeatwave ? '#ea580c' : '#0891b2'
    const iconSvg = isHeatwave
      ? `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/></svg>`
      : `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242"/><path d="M16 14v6"/><path d="M8 14v6"/><path d="M12 16v6"/></svg>`

    return L.divIcon({
      className: 'map-beacon-pin',
      html: `
        <div style="position: relative; width: 32px; height: 32px; display: flex; align-items: center; justify-content: center;">
          <div class="beacon-pulse" style="background-color: ${pulseBg};"></div>
          <div style="width: 26px; height: 26px; border-radius: 50%; background-color: ${coreBg}; border: 2px solid white; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 14px rgba(0,0,0,0.6); z-index: 10;">
            ${iconSvg}
          </div>
        </div>
      `,
      iconSize: [32, 32],
      iconAnchor: [16, 16],
      popupAnchor: [0, -18],
    })
  }, [isHeatwave])

  return (
    <div className="relative w-full h-52 rounded-b-lg overflow-hidden border-t border-border/40">
      <MapContainer
        center={position}
        zoom={9}
        scrollWheelZoom={false}
        attributionControl={false}
        className="w-full h-full z-10 dark-osm-map"
      >
        {/* OpenStreetMap public tiles with CSS dark observatory filter (zero API keys required) */}
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          subdomains={['a', 'b', 'c']}
          maxZoom={19}
        />

        <MapCenterController center={position} />

        <Marker position={position} icon={customIcon}>
          <Popup className="custom-dark-popup">
            <div className="p-1 text-center">
              <div className="flex items-center justify-center gap-1.5 font-semibold text-xs text-white">
                <MapPin className="w-3 h-3 text-cyan-400" />
                <span>{cityName}</span>
              </div>
              {country ? (
                <p className="text-[11px] text-gray-300 mt-0.5">{country}</p>
              ) : null}
              <p className="text-[10px] font-mono text-gray-400 mt-1">
                {lat.toFixed(4)}°, {lon.toFixed(4)}°
              </p>
            </div>
          </Popup>
        </Marker>
      </MapContainer>

      {/* Floating Coordinate Pill */}
      <div className="absolute bottom-2 left-2 z-20 pointer-events-none">
        <div className="px-2.5 py-1 rounded-md bg-background/85 backdrop-blur-md border border-border/80 text-[10px] font-mono text-muted-foreground flex items-center gap-1.5 shadow-md">
          <Navigation className="w-3 h-3 text-primary shrink-0" />
          <span>{lat.toFixed(2)}° N, {lon.toFixed(2)}° E</span>
        </div>
      </div>
    </div>
  )
}
