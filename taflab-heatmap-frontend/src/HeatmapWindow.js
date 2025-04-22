import React, { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet.heat";
import "leaflet/dist/leaflet.css";

// 🛥️ Custom boat icon
const boatIcon = new L.Icon({
  iconUrl: "/boat.png", 
  iconSize: [30, 30],
  iconAnchor: [15, 15],
});

const HeatmapLayer = ({ data }) => {
  const map = useMap();

  useEffect(() => {
    if (data.length > 0) {
      const heat = L.heatLayer(data, {
        radius: 40,
        blur: 30,
        maxZoom: 10,
      }).addTo(map);

      return () => {
        map.removeLayer(heat);
      };
    }
  }, [data, map]);

  return null;
};

const HeatmapWindow = () => {
  const [heatData, setHeatData] = useState([]);
  const [boatMarkers, setBoatMarkers] = useState([]);
  const [status, setStatus] = useState("loading");
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      const query = `
        {
          data {
            boat_id
            data_latitude
            data_longitude
            data_temperature
            timestamp
          }
        }
      `;
      try {
        const response = await fetch("http://127.0.0.1:5000/graphql/boat_data", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ query }),
        });
        const result = await response.json();
        const entries = result.data.data;

        // 🌡️ For heatmap
        const heat = entries
          .filter((b) => b.data_latitude && b.data_longitude && b.data_temperature)
          .map((b) => [
            parseFloat(b.data_latitude),
            parseFloat(b.data_longitude),
            parseFloat(b.data_temperature),
          ]);
        setHeatData(heat);

        // 🚤 For marker: get latest point per boat
        const latestByBoat = {};
        for (const entry of entries) {
          const boatId = entry.boat_id;
          if (!latestByBoat[boatId] || new Date(entry.timestamp) > new Date(latestByBoat[boatId].timestamp)) {
            latestByBoat[boatId] = entry;
          }
        }

        const markers = Object.values(latestByBoat)
          .filter((b) => b.data_latitude && b.data_longitude)
          .map((b) => ({
            boat_id: b.boat_id,
            lat: parseFloat(b.data_latitude),
            lon: parseFloat(b.data_longitude),
            temp: b.data_temperature,
          }));

        setBoatMarkers(markers);
        setStatus("ok");
      } catch (err) {
        console.error("Error fetching heatmap data:", err);
        setStatus("error");
        setError(err.message);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 10000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div>
      <div style={{ padding: "10px", background: "#eee" }}>
        {status === "loading" && <p>⏳ Loading boat data...</p>}
        {status === "ok" && <p>✅ Fetched {heatData.length} boat data points.</p>}
        {status === "error" && (
          <p style={{ color: "red" }}>❌ Failed to fetch data: {error}</p>
        )}
      </div>

      <MapContainer center={[37.87, -122.26]} zoom={13} style={{ height: "80vh", width: "100%" }}>
        <TileLayer
          attribution="&copy; OpenStreetMap contributors"
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <HeatmapLayer data={heatData} />

        {boatMarkers.map((b, idx) => (
          <Marker key={idx} position={[b.lat, b.lon]} icon={boatIcon}>
            <Popup>
              <strong>{b.boat_id}</strong>
              <br />
              Temp: {b.temp}°C
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
};

export default HeatmapWindow;
