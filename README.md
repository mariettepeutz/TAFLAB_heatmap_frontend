# TAFLAB Heatmap Frontend

> **Heads‑up (oracle‑version branch)**   This branch is **work‑in‑progress**. It focuses on wiring the React front‑end to the Oracle Autonomous DB exposed by [`TAFBackend`](https://github.com/Berkeley-TAFLab/TAFBackend/tree/graphql). Expect partial functionality while we flesh out the GraphQL queries and pagination. Contributions welcome!

A lightweight React + Leaflet application that visualises live **wave height, wind, and other sensor metrics** streamed from the TAFLab autonomous sailing boats.

---

## Table of Contents

1. [Features](#features)
2. [Demo](#demo)
3. [Architecture](#architecture)
4. [Getting Started](#getting-started)
5. [Configuration](#configuration)
6. [Data Contract](#data-contract)
7. [Branch Strategy](#branch-strategy)
8. [Contributing](#contributing)
9. [Roadmap](#roadmap)
10. [License](#license)

---

## Features

| 🌊 | Live heat‑map of wave heights (Leaflet.heat) |
| -- | -------------------------------------------- |
| ⛵  | Per‑boat markers with custom boat icon       |
| 🕰 | Time‑slider to scrub historic telemetry      |
| 🔌 | Pluggable data back‑end (REST, GraphQL, CSV) |
| ⚙️ | Zero‑config local start; Docker‑ready build  |

---

## Demo

```bash
# 1 – clone & install
$ git clone https://github.com/mariettepeutz/TAFLAB_heatmap_frontend.git
$ cd TAFLAB_heatmap_frontend/taflab-heatmap-frontend
$ npm install   # or pnpm / yarn

# 2 – start Vite dev server (http://localhost:5173)
$ npm run dev
```

If you have a running **telemetry back‑end** (see below), the heat‑map will populate automatically. For quick local testing we now default to \`\` (27 Apr 2025 test run) bundled in the repo, so you can explore the UI with zero external dependencies.

---

## Architecture

```text
┌────────────┐          ┌──────────────┐
│  Boats     │  MQTT   │  TAFLab API  │  REST/GraphQL
└────────────┘  ───▶───┤  (Flask)     │
                      └─────┬────────┘
                            │ JSON / CSV
                            ▼
                     taﬂab‑heatmap‑frontend (React + Leaflet)
```

* **React + Vite** for hot‑reload development.
* **Leaflet** to render the map; **leaflet.heat** for the heat layer.
* **Papa Parse** to parse CSV fall‑back files in browser.
* **Vite proxy** forwards `/api/**` to the remote or local Flask server.

---

## Getting Started

### Prerequisites

* Node >= 18
* npm (comes with Node) — or **pnpm**/Yarn
* Optionally Docker (see below)

### Installation

```bash
npm install
```

### Running locally with your Flask API

1. Make sure your **Flask** back‑end is running (default `http://localhost:5000`).
2. Copy `.env.example` → `.env.local` and set `VITE_API_URL=http://localhost:5000/api`.
3. Start the dev server: `npm run dev` (Vite injects the `VITE_` vars at build time).

### Running against the bundled sample data

No env vars are needed; the app will fall back to `/waves.csv`.

### Production build

```bash
npm run build
npm run preview   # serve dist folder locally
```

### Docker (optional)

```bash
docker build -t taflab/heatmap-frontend .
# serve on port 8080
docker run -it --rm -p 8080:80 taflab/heatmap-frontend
```

---

## Configuration

| Variable              | Default                     | Description                                                                                                                                                           |
| --------------------- | --------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `VITE_API_URL`        | `http://localhost:5000/api` | Base URL of **your Flask** telemetry API. The `VITE_` prefix is *only* so Vite exposes the variable to the browser; it does **not** mean the API itself runs on Vite. |
| `VITE_DEFAULT_CENTER` | `37.8754,-122.2534`         | Initial map centre (lat,lng).                                                                                                                                         |
| `VITE_DEFAULT_ZOOM`   | `13`                        | Initial zoom level.                                                                                                                                                   |

Create a `.env.local` file to override any of these at runtime.

---

## Data Contract

The front‑end expects **JSON** records in the shape:

```jsonc
{
  "boat_id": "string",
  "timestamp": "2025-05-08T15:42:21Z", // ISO‑8601 UTC
  "latitude": 37.875,
  "longitude": -122.253,
  "wave_height": 0.42
}
```

*The CSV fallback uses the same column names.*

---

## Oracle GraphQL Back‑End

In production we pull live rows from an **Oracle Autonomous Database** exposed through the [`TAFBackend`](https://github.com/Berkeley-TAFLab/TAFBackend/tree/graphql) GraphQL API. A simple cURL example that fetches the 100 most‑recent measurements:

```bash
curl -X POST https://<oracle‑host>/graphql \
  -H "Content-Type: application/json" \
  -d '{"query":"{ waves(limit: 100, order_by: {timestamp: desc}) { boat_id timestamp latitude longitude wave_height } }"}' \
  | jq '.data.waves'
```

To switch the React app from the local CSV to the Oracle back‑end, set these in \`\`:

```env
VITE_API_URL=https://<oracle‑host>/graphql  # GraphQL endpoint
VITE_API_MODE=graphql                       # front‑end picks correct fetcher
```

The `waves.csv` file remains as a lightweight fallback for offline demos.

---

## Branch Strategy

* \`\` – stable releases, auto‑deployed.
* \`\` – default integration branch.
* **feature/**\* – short‑lived branches merged via PR.

CI (GitHub Actions) runs lint, test, and build on every PR. Deployments to OCI / Vercel happen from `main`.

---

## Contributing

1. Fork the repo and create your feature branch (`git checkout -b feature/MyFeature`).
2. Run `npm run lint` and `npm test` before committing.
3. Submit a PR with a clear description of your changes.

Issue templates and a full **Code of Conduct** live in `.github/`.

---

## License

MIT © 2025 TAFLab / Mariëtte Peutz
