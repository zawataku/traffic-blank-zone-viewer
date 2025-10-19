"use client";
import { MapContainer, TileLayer, Circle, Tooltip, GeoJSON } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { LatLngExpression, Layer } from "leaflet";
import { FeatureCollection, Feature, Geometry } from "geojson";

export interface Stop {
    stop_name: string;
    stop_lat: number;
    stop_lon: number;
}

interface MeshFeatureProperties {
    meshCode: string;
    population: number;
}

interface MapProps {
    stops: Stop[];
    meshData: FeatureCollection<Geometry, MeshFeatureProperties> | null;
    onClearStops: () => void;
}

// メッシュの色
const getColor = (population: number) => {
    return population > 500 ? '#800026' :
        population > 200 ? '#BD0026' :
            population > 100 ? '#E31A1C' :
                population > 50 ? '#FC4E2A' :
                    population > 20 ? '#FD8D3C' :
                        population > 10 ? '#FEB24C' :
                            population > 0 ? '#FED976' :
                                '#FFEDA0';
};

const ClearButton = ({ onClearStops }: { onClearStops: () => void }) => {
    const onClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
        e.preventDefault();
        e.stopPropagation();
        onClearStops();
    };

    return (
        <div className="leaflet-top leaflet-right">
            <div className="leaflet-control leaflet-bar">
                <a href="#" onClick={onClick} title="バス停をクリア" role="button" style={{ width: '30px', height: '30px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem' }}>
                    🗑️
                </a>
            </div>
        </div>
    );
};


const Map = ({ stops, meshData, onClearStops }: MapProps) => {
    const initialPosition: LatLngExpression = [36.698, 137.213]; // 富山駅周辺

    const style = (feature?: Feature<Geometry, MeshFeatureProperties>) => {
        const population = feature?.properties?.population || 0;
        return {
            fillColor: getColor(population),
            weight: 0.5,
            opacity: 1,
            color: 'white',
            fillOpacity: 0.7
        };
    };

    const onEachFeature = (feature: Feature<Geometry, MeshFeatureProperties>, layer: Layer) => {
        if (feature.properties && typeof feature.properties.population === 'number') {
            layer.bindTooltip(`人口: ${feature.properties.population.toLocaleString()}人`);
        }
    };

    return (
        <MapContainer
            center={initialPosition}
            zoom={12}
            style={{ height: "100%", width: "100%" }}
        >
            <TileLayer
                url="https://cyberjapandata.gsi.go.jp/xyz/pale/{z}/{x}/{y}.png"
                attribution='&copy; <a href="https://maps.gsi.go.jp/development/ichiran.html">国土地理院 | 淡色地図</a>'
            />

            {meshData && (
                <GeoJSON
                    key={JSON.stringify(meshData)}
                    data={meshData}
                    style={style}
                    onEachFeature={onEachFeature}
                />
            )}

            {stops.map((stop, index) => (
                <Circle
                    key={`stop-${index}`}
                    center={[stop.stop_lat, stop.stop_lon]}
                    radius={300}
                    pathOptions={{ color: "#3B82F6", fillColor: "#3B82F6", fillOpacity: 0.2, weight: 1 }}
                >
                    <Tooltip>{stop.stop_name}</Tooltip>
                </Circle>
            ))}

            {stops.length > 0 && <ClearButton onClearStops={onClearStops} />}
        </MapContainer>
    );
};

export default Map;