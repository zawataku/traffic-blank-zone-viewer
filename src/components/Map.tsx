"use client";
import { MapContainer, TileLayer, Circle, Tooltip } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { LatLngExpression } from "leaflet";

export interface Stop {
    stop_name: string;
    stop_lat: number;
    stop_lon: number;
}

interface MapProps {
    stops: Stop[];
}

const Map = ({ stops }: MapProps) => {
    const initialPosition: LatLngExpression = [36.698, 137.213];

    return (
        <MapContainer
            center={initialPosition}
            zoom={13}
            style={{ height: "100%", width: "100%" }}
        >
            <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            />

            {stops.map((stop, index) => (
                <Circle
                    key={index}
                    center={[stop.stop_lat, stop.stop_lon]}
                    radius={300} // 半径
                    pathOptions={{ color: "blue", fillColor: "blue", fillOpacity: 0.2 }}
                >
                    <Tooltip>{stop.stop_name}</Tooltip>
                </Circle>
            ))}
        </MapContainer>
    );
};

export default Map;