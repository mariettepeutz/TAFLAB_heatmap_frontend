import React, { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet.heat";
import "leaflet/dist/leaflet.css";
import boatIconImg from "./assets/boat.png";
import Papa from "papaparse";

const boatIcon = new L.Icon({
  iconUrl: boatIconImg,
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
  const [sliderTime, setSliderTime] = useState(0);
  const [availableTimes, setAvailableTimes] = useState([]);

  useEffect(() => {
    Papa.parse("/waves.csv", {
      download: true,
      header: true,
      complete: (results) => {
        const parsedData = results.data.filter(
          (d) => d.latitude && d.longitude && d.wave_height && d.timestamp
        );

        const groupedByTime = {};

        parsedData.forEach((row) => {
          if (!groupedByTime[row.timestamp]) groupedByTime[row.timestamp] = [];
          groupedByTime[row.timestamp].push(row);
        });

        const sortedTimes = Object.keys(groupedByTime).sort();
        setAvailableTimes(sortedTimes);
        setSliderTime(sortedTimes[0]);

        // initial display
        const firstSlice = groupedByTime[sortedTimes[0]];
        const heat = firstSlice.map((b) => [
          parseFloat(b.latitude),
          parseFloat(b.longitude),
          parseFloat(b.wave_height || 0),
        ]);
        const boats = firstSlice.map((b) => ({
          lat: parseFloat(b.latitude),
          lng: parseFloat(b.longitude),
          boat_id: b.boat_id,
        }));

        setHeatData(heat);
        setBoatMarkers(boats);
        setStatus("ok");
      },
      error: (err) => {
        setError(err.message);
        setStatus("error");
      },
    });
  }, []);

  useEffect(() => {
    if (!sliderTime || availableTimes.length === 0) return;
    Papa.parse("/waves.csv", {
      download: true,
      header: true,
      complete: (results) => {
        const parsedData = results.data.filter(
          (d) =>
            d.latitude &&
            d.longitude &&
            d.wave_height &&
            d.timestamp === sliderTime
        );

        const heat = parsedData.map((b) => [
          parseFloat(b.latitude),
          parseFloat(b.longitude),
          parseFloat(b.wave_height || 0),
        ]);
        const boats = parsedData.map((b) => ({
          lat: parseFloat(b.latitude),
          lng: parseFloat(b.longitude),
          boat_id: b.boat_id,
        }));

        setHeatData(heat);
        setBoatMarkers(boats);
      },
    });
  }, [sliderTime]);

  return (
    <div>
      <div style={{ padding: "10px", background: "#eee" }}>
        {status === "loading" && <p>⏳ Loading boat data...</p>}
        {status === "ok" && (
          <p>
            ✅ Displaying {boatMarkers.length} boats at {sliderTime}
          </p>
        )}
        {status === "error" && (
          <p style={{ color: "red" }}>❌ Failed to fetch data: {error}</p>
        )}
        {availableTimes.length > 0 && (
          <input
            type="range"
            min={0}
            max={availableTimes.length - 1}
            value={availableTimes.indexOf(sliderTime)}
            onChange={(e) => setSliderTime(availableTimes[e.target.value])}
            style={{ width: "100%" }}
          />
        )}
      </div>

      <MapContainer
        center={[37.8754, -122.2534]}   // Mudd Building
        zoom={13}
        style={{ height: "80vh", width: "100%" }}
      >
        <TileLayer
          attribution="&copy; OpenStreetMap contributors"
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <HeatmapLayer data={heatData} />
        {boatMarkers.map((b, i) => (
          <Marker key={i} position={[b.lat, b.lng]} icon={boatIcon} />
        ))}
      </MapContainer>

      <div
        style={{
          position: "absolute",
          bottom: 20,
          right: 20,
          background: "white",
          padding: "5px 10px",
          border: "1px solid #ccc",
          borderRadius: "5px",
        }}
      >
        <p style={{ margin: 0, fontWeight: "bold" }}>Wave Height (m)</p>
        <div style={{ display: "flex", height: "10px", marginTop: "4px" }}>
          {["#0000ff", "#00ffff", "#00ff00", "#ffff00", "#ff0000"].map(
            (color, i) => (
              <div
                key={i}
                style={{ flex: 1, backgroundColor: color }}
              ></div>
            )
          )}
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: "10px" }}>
          <span>0</span>
          <span>Low</span>
          <span>Med</span>
          <span>High</span>
          <span>10+</span>
        </div>
      </div>
    </div>
  );
};

export default HeatmapWindow;
