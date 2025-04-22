import React, { useEffect, useState } from "react";
import { MapContainer, TileLayer, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet.heat";
import "leaflet/dist/leaflet.css";

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
  const [status, setStatus] = useState("loading"); // "loading", "ok", or "error"
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      const query = `
        {
          data {
            boat_id
            latitude
            longitude
            temperature
          }
        }
      `;
      try {
        const response = await fetch(`${process.env.REACT_APP_API_URL}/graphql/boat_data`, {

          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ query }),
        });
        const result = await response.json();
        const points = result.data.data
          .filter((b) => b.latitude && b.longitude && b.temperature)
          .map((b) => [parseFloat(b.latitude), parseFloat(b.longitude), parseFloat(b.temperature)]);
        
        setHeatData(points);
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

      <MapContainer
        center={[37.87, -122.26]}
        zoom={13}
        style={{ height: "80vh", width: "100%" }}
      >
        <TileLayer
          attribution="&copy; OpenStreetMap contributors"
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <HeatmapLayer data={heatData} />
      </MapContainer>
    </div>
  );
};

export default HeatmapWindow;
