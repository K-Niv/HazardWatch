# 🌍 HazardWatch — Climate Hazard Trend Analyzer

A full-stack web application that analyzes historical weather data and visualizes long-term trends in climate hazards (heatwaves and heavy rainfall) for any region worldwide.

Built as part of the Full-Stack Developer Case Study for Dygnify Ventures.

---

## 🚀 Overview

HazardWatch allows users to:
1. **Search & Select Any Region:** Geocoding search across global cities with visual pin confirmation on an interactive map.
2. **Analyze Multiple Climate Hazards:**
   - **Heatwaves (Default):** Detects consecutive extreme heat events using regional historical 95th-percentile thresholds.
   - **Heavy Rainfall:** Identifies prolonged and extreme precipitation events.
3. **Flexible Time Horizons:** Analyze trends over customizable historical windows (e.g., 1990–2020).
4. **Interactive Visualizations:** Frequency, duration, and intensity time-series charts with rolling averages.
5. **Dual-Layer Insights:**
   - **Programmatic Insights:** Statistically grounded trends, percentage changes, and peak event records.
   - **AI-Powered Summary:** On-demand synthesis powered by Groq Cloud (Llama 3.3 70B).

---

## 🏗️ Architecture

```
┌───────────────────────────────────────────────┐
│              Frontend (React + Vite)          │
│   - Leaflet Map & City Geocoding Search       │
│   - Hazard Type & Year Range Controls         │
│   - Chart.js Trend Visualizations             │
│   - Programmatic & AI Summary Insights        │
└───────────────────────┬───────────────────────┘
                        │ HTTP / REST
┌───────────────────────▼───────────────────────┐
│              Backend (FastAPI)                │
│   - Ingestion & Caching Layer                 │
│   - Climate Hazard Detection Engine           │
│   - Statistical Trend Analysis Module         │
│   - Rate Limiting & Input Validation          │
└───────────┬───────────────────────┬───────────┘
            │                       │
┌───────────▼───────────┐ ┌─────────▼───────────┐
│ Open-Meteo Weather API│ │  MongoDB (Cache/DB) │
└───────────────────────┘ └─────────────────────┘
```

---

## 🛠️ Tech Stack

- **Frontend:** React 18 / 19, Vite, Leaflet (`react-leaflet`), Chart.js (`react-chartjs-2`), Vanilla CSS
- **Backend:** Python 3.11+, FastAPI, Uvicorn, Pydantic, HTTPX, NumPy, SlowAPI
- **Database:** MongoDB (via MongoDB Atlas or local instance)
- **External APIs:**
  - [Open-Meteo Historical Weather API](https://open-meteo.com/en/docs/historical-weather-api) (Free, no API key required)
  - [Open-Meteo Geocoding API](https://open-meteo.com/en/docs/geocoding-api) (Global city search)
  - [Groq Cloud API](https://console.groq.com/) (Ultra-fast Llama 3.3 70B natural language synthesis)

---

## 🌡️ Hazard Logic & Climate Definitions

### 1. Heatwave Detection (Default)
- **Baseline:** Calculated over the selected historical window for the chosen location.
- **Threshold:** Regional 95th percentile of daily maximum temperatures ($T_{max}$).
- **Event Definition:** 3 or more consecutive days with daily $T_{max} \ge \text{P95}$.
- **Metrics Tracked:** Total event count per year, average duration (days), peak temperature recorded (°C).

### 2. Heavy Rainfall Detection
- **Threshold:** Daily precipitation exceeding regional 95th percentile or single-day extreme threshold ($> 50\text{ mm}$).
- **Event Definition:** 3+ consecutive days of elevated precipitation or severe single-day rainfall anomalies.
- **Metrics Tracked:** Event count per year, cumulative rainfall per event, maximum single-day intensity.

---

## ⚙️ Local Development Setup

### Prerequisites
- Python 3.10+
- Node.js 18+ and npm
- MongoDB URI (local or MongoDB Atlas connection string)

### 1. Backend Setup

```bash
cd backend

# Create and activate virtual environment
python -m venv venv
# On Windows:
venv\Scripts\activate
# On Linux/macOS:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Create .env from template
cp .env.example .env

# Run FastAPI dev server
uvicorn main:app --reload --port 8000
```
API documentation will be accessible at: `http://localhost:8000/docs`

### 2. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Create .env from template
cp .env.example .env

# Start Vite dev server
npm run dev
```
Web app will be running at: `http://localhost:5173`

---

## 🧭 Assumptions

1. **Weather Data Resolution:** Daily aggregate records ($T_{max}$, precipitation sum) provide statistically robust baselines for multi-decadal hazard detection while optimizing API payload size.
2. **Point-Based Spatial Queries:** City-level lat/lon coordinates serve as accurate local proxies for regional climate trends without gridded spatial interpolation overhead.
3. **Caching Strategy:** Historical weather observations are immutable for past dates; caching query payloads in MongoDB minimizes external API roundtrips and respects rate limits.

---

## 🤖 AI Tools Usage Disclosure

In alignment with the case study guidelines, this project uses an **AI-assisted development workflow** (human-driven architecture and core logic, assisted by AI for syntax, configuration, and documentation):
- **Tools Used:** Antigravity AI Assistant
- **What AI Assisted With:** Initial project layout generation, config templates, and documentation outlines.
- **What Was Hand-Crafted:** Climate hazard detection algorithms, statistical trend logic, API contract decisions, and data validation rules.

---

## 📄 License
MIT
