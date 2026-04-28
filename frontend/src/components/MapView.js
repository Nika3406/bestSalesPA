import React from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix default marker icon issue (VERY IMPORTANT for Leaflet)
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
  iconUrl:
    'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
  shadowUrl:
    'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
});

// City centers
const cityCoords = {
  Philadelphia: [39.9526, -75.1652],
  Pittsburgh: [40.4406, -79.9959],
  Allentown: [40.6084, -75.4902],
  Erie: [42.1292, -80.0851],
  Reading: [40.3356, -75.9269],
  Scranton: [41.4089, -75.6624],
  Lancaster: [40.0379, -76.3055],
  Harrisburg: [40.2732, -76.8867],
};

// Fake listings per city (this is your “dataset”)
const generateListings = (city) => {
  const base = cityCoords[city] || [40.5, -75.5];

  return Array.from({ length: 8 }).map((_, i) => ({
    id: i,
    lat: base[0] + (Math.random() - 0.5) * 0.05,
    lng: base[1] + (Math.random() - 0.5) * 0.05,
    price: Math.floor(180000 + Math.random() * 400000),
    beds: Math.floor(2 + Math.random() * 4),
    baths: (1 + Math.random() * 2).toFixed(1),
    sqft: Math.floor(1000 + Math.random() * 2000),
  }));
};

export default function MapView({ city }) {
  const center = cityCoords[city] || [40.5, -75.5];
  const listings = generateListings(city);

  return (
    <div style={{ height: '350px', borderRadius: '16px', overflow: 'hidden' }}>
      <MapContainer center={center} zoom={12} style={{ height: '100%' }}>

        <TileLayer
          attribution='&copy; OpenStreetMap contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* CITY CENTER MARKER */}
        <Marker position={center}>
          <Popup>
            <strong>{city}</strong>
            <br />
            City Center
          </Popup>
        </Marker>

        {/* LISTING PINS */}
        {listings.map((home) => (
          <Marker key={home.id} position={[home.lat, home.lng]}>
            <Popup>
              <div style={{ minWidth: '150px' }}>
                <strong>${home.price.toLocaleString()}</strong>
                <br />
                {home.beds} bd • {home.baths} ba
                <br />
                {home.sqft} sqft
              </div>
            </Popup>
          </Marker>
        ))}

      </MapContainer>
    </div>
  );
}