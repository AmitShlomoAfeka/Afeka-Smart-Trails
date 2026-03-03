'use client';
import { MapContainer, TileLayer, Marker, Popup, GeoJSON } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet-defaulticon-compatibility/dist/leaflet-defaulticon-compatibility.css';
import 'leaflet-defaulticon-compatibility';

import { useEffect } from 'react';

const MapCenterer = ({ routeData }) => {
    const map = require('react-leaflet').useMap();
    useEffect(() => {
        if (routeData && routeData.features && routeData.features[0] && routeData.features[0].geometry.coordinates.length > 0) {
            const firstCoord = routeData.features[0].geometry.coordinates[0];
            // OSRM provides [longitude, latitude], Leaflet expects [latitude, longitude]
            map.flyTo([firstCoord[1], firstCoord[0]], 11);
        }
    }, [routeData, map]);
    return null;
};

const Map = ({ routeData }) => {
    // Default center before route data loads
    const defaultCenter = [32.0853, 34.7818];

    return (
        <MapContainer center={defaultCenter} zoom={7} scrollWheelZoom={true} style={{ height: "100%", width: "100%" }}>
            <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            {routeData && <MapCenterer routeData={routeData} />}
            {routeData && (
                <GeoJSON
                    key={JSON.stringify(routeData)}
                    data={routeData}
                    style={{ color: '#2563eb', weight: 4 }}
                />
            )}
        </MapContainer>
    );
};

export default Map;
