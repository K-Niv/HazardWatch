import React, { useState } from 'react'
import {
  Flame,
  CloudRain,
  Activity,
  Sparkles,
  MapPin,
  Calendar,
  Thermometer,
  ShieldCheck,
  Database,
  ExternalLink,
  ChevronRight,
  TrendingUp,
  Info
} from 'lucide-react'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { TooltipProvider } from '@/components/ui/tooltip'
import './App.css'

export default function App() {
  // Global control state for the dashboard layout
  const [selectedHazard, setSelectedHazard] = useState('heatwave')
  const [selectedCity, setSelectedCity] = useState({
    name: 'New Delhi',
    country: 'India',
    lat: 28.6139,
    lon: 77.2090
  })
  const [yearRange] = useState({ start: 1990, end: 2020 })
  const [serverOnline] = useState(true)

  const isHeatwave = selectedHazard === 'heatwave'

  return (
    <TooltipProvider>
      <div className="min-h-screen bg-background text-foreground flex flex-col hazard-grid-bg">
        {/* Navigation / Header */}
        <header className="sticky top-0 z-50 w-full border-b border-border/60 bg-background/80 backdrop-blur-md">
          <div className="container mx-auto px-4 lg:px-8 h-16 flex items-center justify-between">
            {/* Logo & Brand */}
            <div className="flex items-center gap-3">
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors shadow-lg ${
                  isHeatwave
                    ? 'bg-gradient-to-tr from-amber-600 to-orange-500 shadow-orange-500/20'
                    : 'bg-gradient-to-tr from-blue-600 to-cyan-500 shadow-cyan-500/20'
                }`}
              >
                {isHeatwave ? (
                  <Flame className="w-5 h-5 text-white" />
                ) : (
                  <CloudRain className="w-5 h-5 text-white" />
                )}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-xl font-bold tracking-tight bg-gradient-to-r from-foreground via-foreground/90 to-muted-foreground bg-clip-text text-transparent">
                    HazardWatch
                  </h1>
                  <Badge variant="outline" className="text-xs font-mono py-0.5 border-primary/30 text-primary">
                    v0.1.0
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground hidden sm:block">
                  Climate Hazard Trend Analyzer & Empirical Extremes Observatory
                </p>
              </div>
            </div>

            {/* Status & Quick Links */}
            <div className="flex items-center gap-3">
              <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full border border-border/80 bg-muted/40 text-xs">
                <span className="relative flex h-2 w-2">
                  <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${serverOnline ? 'bg-emerald-400' : 'bg-rose-400'}`}></span>
                  <span className={`relative inline-flex rounded-full h-2 w-2 ${serverOnline ? 'bg-emerald-500' : 'bg-rose-500'}`}></span>
                </span>
                <span className="text-muted-foreground">Backend & Atlas:</span>
                <span className={`font-medium ${serverOnline ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {serverOnline ? 'Connected' : 'Offline'}
                </span>
              </div>

              <Badge
                variant="secondary"
                className="hidden lg:inline-flex items-center gap-1.5 py-1 px-2.5 text-xs text-muted-foreground"
              >
                <Database className="w-3 h-3 text-cyan-400" />
                <span>Open-Meteo ERA5 / Atlas Cache</span>
              </Badge>

              <a
                href="https://github.com/K-Niv/HazardWatch"
                target="_blank"
                rel="noreferrer"
                id="github-repo-link"
                className="inline-flex items-center justify-center rounded-lg border border-border/60 bg-card hover:bg-muted/60 h-9 w-9 text-muted-foreground hover:text-foreground transition-colors"
                title="View GitHub Repository"
              >
                <ExternalLink className="w-4 h-4" />
              </a>
            </div>
          </div>
        </header>

        {/* Main Application Container */}
        <main className="container mx-auto px-4 lg:px-8 py-6 flex-1 flex flex-col gap-6">
          {/* Top Control Bar / Quick Switcher */}
          <section className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 p-4 rounded-xl border border-border/60 bg-card/60 backdrop-blur-sm">
            <div className="flex flex-wrap items-center gap-3">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Hazard Mode:
              </span>
              <Tabs
                value={selectedHazard}
                onValueChange={setSelectedHazard}
                className="w-auto"
              >
                <TabsList className="bg-muted/80 p-1">
                  <TabsTrigger
                    value="heatwave"
                    className="flex items-center gap-1.5 data-[state=active]:bg-orange-600 data-[state=active]:text-white transition-all"
                  >
                    <Flame className="w-3.5 h-3.5" />
                    <span>Heatwaves</span>
                  </TabsTrigger>
                  <TabsTrigger
                    value="rainfall"
                    className="flex items-center gap-1.5 data-[state=active]:bg-cyan-600 data-[state=active]:text-white transition-all"
                  >
                    <CloudRain className="w-3.5 h-3.5" />
                    <span>Heavy Rainfall</span>
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </div>

            {/* Current Target Location & Range Summary */}
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <div className="flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-primary" />
                <span className="font-medium text-foreground">{selectedCity.name}, {selectedCity.country}</span>
                <span className="font-mono opacity-60">({selectedCity.lat.toFixed(2)}°, {selectedCity.lon.toFixed(2)}°)</span>
              </div>
              <div className="h-4 w-px bg-border" />
              <div className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-primary" />
                <span className="font-mono font-medium text-foreground">{yearRange.start} – {yearRange.end}</span>
              </div>
            </div>
          </section>

          {/* Layout Grid: Sidebar Controls (Left) + Main Dashboard Workspace (Right) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Sidebar Column: Search, Parameters, Map (4 Cols on desktop) */}
            <aside className="lg:col-span-4 flex flex-col gap-6">
              {/* City Search & Geocoding Card Slot (2.2) */}
              <Card id="city-search-panel" className="border-border/60 bg-card/80 backdrop-blur-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-semibold flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-primary" />
                      Target Location
                    </span>
                    <Badge variant="secondary" className="text-[10px] font-mono">
                      Geocoding
                    </Badge>
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Search any global city or select a historical hotspot.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* City Search Input Placeholder (Implemented in Commit 2.2) */}
                  <div className="relative">
                    <div className="flex h-10 w-full rounded-md border border-input bg-muted/30 px-3 py-2 text-sm text-muted-foreground items-center gap-2">
                      <MapPin className="w-4 h-4 text-muted-foreground" />
                      <span>Search global cities...</span>
                    </div>
                  </div>

                  {/* Preset Hotspot Badges */}
                  <div className="space-y-1.5">
                    <p className="text-[11px] font-medium text-muted-foreground">Quick Presets:</p>
                    <div className="flex flex-wrap gap-1.5">
                      {[
                        { name: 'New Delhi', country: 'India', lat: 28.61, lon: 77.20 },
                        { name: 'Phoenix', country: 'USA', lat: 33.44, lon: -112.07 },
                        { name: 'London', country: 'UK', lat: 51.50, lon: -0.12 },
                        { name: 'Tokyo', country: 'Japan', lat: 35.67, lon: 139.65 },
                      ].map((city) => (
                        <button
                          key={city.name}
                          type="button"
                          onClick={() => setSelectedCity(city)}
                          className={`text-xs px-2.5 py-1 rounded-md border transition-colors ${
                            selectedCity.name === city.name
                              ? 'bg-primary/20 border-primary text-primary font-medium'
                              : 'border-border/60 bg-muted/40 hover:bg-muted text-muted-foreground hover:text-foreground'
                          }`}
                        >
                          {city.name}
                        </button>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Year Range Picker Card Slot (2.5) */}
              <Card id="year-range-panel" className="border-border/60 bg-card/80 backdrop-blur-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-semibold flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-primary" />
                      Timeline Window
                    </span>
                    <span className="font-mono text-xs text-primary font-bold">
                      {yearRange.end - yearRange.start + 1} Years
                    </span>
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Choose historical multi-decadal observation bounds (1950–2025).
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Slider & Year Controls (Implemented in Commit 2.5) */}
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex-1 p-2.5 rounded-lg border border-border/60 bg-muted/30 text-center">
                      <p className="text-[10px] uppercase text-muted-foreground font-semibold">Start Year</p>
                      <p className="text-base font-bold font-mono text-foreground">{yearRange.start}</p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-muted-foreground" />
                    <div className="flex-1 p-2.5 rounded-lg border border-border/60 bg-muted/30 text-center">
                      <p className="text-[10px] uppercase text-muted-foreground font-semibold">End Year</p>
                      <p className="text-base font-bold font-mono text-foreground">{yearRange.end}</p>
                    </div>
                  </div>

                  <Button className="w-full font-semibold shadow-md gap-2" id="trigger-analysis-btn">
                    <Activity className="w-4 h-4" />
                    Analyze Climate Hazards
                  </Button>
                </CardContent>
              </Card>

              {/* Map Preview Container Slot (2.3) */}
              <Card id="map-preview-panel" className="border-border/60 bg-card/80 backdrop-blur-sm overflow-hidden">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-semibold flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-primary" />
                      Geographic Pin
                    </span>
                    <Badge variant="outline" className="text-[10px]">
                      Leaflet / OSM
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="h-44 w-full bg-muted/20 border-t border-border/40 relative flex items-center justify-center">
                    {/* Placeholder container where MapDisplay component will mount in Commit 2.3 */}
                    <div className="text-center p-4">
                      <div className="w-8 h-8 rounded-full bg-primary/20 text-primary mx-auto flex items-center justify-center mb-2 animate-bounce">
                        <MapPin className="w-4 h-4" />
                      </div>
                      <p className="text-xs font-medium text-foreground">{selectedCity.name}, {selectedCity.country}</p>
                      <p className="text-[11px] font-mono text-muted-foreground">
                        {selectedCity.lat.toFixed(4)}° N, {selectedCity.lon.toFixed(4)}° E
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </aside>

            {/* Main Content Dashboard (8 Cols on desktop) */}
            <div className="lg:col-span-8 flex flex-col gap-6">
              {/* Metric Summary Cards Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card className="border-border/60 bg-card/80 backdrop-blur-sm">
                  <CardHeader className="p-4 pb-2">
                    <CardDescription className="text-xs font-medium flex items-center justify-between">
                      <span>Total Events</span>
                      <Activity className="w-3.5 h-3.5 text-primary" />
                    </CardDescription>
                    <CardTitle className="text-2xl font-bold font-mono tracking-tight mt-1">
                      7
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-4 pt-0">
                    <p className="text-[11px] text-muted-foreground">
                      Across {yearRange.end - yearRange.start + 1} observation years
                    </p>
                  </CardContent>
                </Card>

                <Card className="border-border/60 bg-card/80 backdrop-blur-sm">
                  <CardHeader className="p-4 pb-2">
                    <CardDescription className="text-xs font-medium flex items-center justify-between">
                      <span>{isHeatwave ? 'T95 Threshold' : 'R95p Threshold'}</span>
                      <Thermometer className="w-3.5 h-3.5 text-orange-400" />
                    </CardDescription>
                    <CardTitle className="text-2xl font-bold font-mono tracking-tight mt-1">
                      {isHeatwave ? '41.5°C' : '48.2 mm'}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-4 pt-0">
                    <p className="text-[11px] text-muted-foreground">
                      Regional 95th percentile baseline
                    </p>
                  </CardContent>
                </Card>

                <Card className="border-border/60 bg-card/80 backdrop-blur-sm">
                  <CardHeader className="p-4 pb-2">
                    <CardDescription className="text-xs font-medium flex items-center justify-between">
                      <span>Peak Activity</span>
                      <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
                    </CardDescription>
                    <CardTitle className="text-2xl font-bold font-mono tracking-tight mt-1">
                      2019
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-4 pt-0">
                    <p className="text-[11px] text-muted-foreground">
                      Record 3 events in single season
                    </p>
                  </CardContent>
                </Card>

                <Card className="border-border/60 bg-card/80 backdrop-blur-sm">
                  <CardHeader className="p-4 pb-2">
                    <CardDescription className="text-xs font-medium flex items-center justify-between">
                      <span>Data Quality</span>
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                    </CardDescription>
                    <CardTitle className="text-2xl font-bold font-mono tracking-tight mt-1 text-emerald-400">
                      100%
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-4 pt-0">
                    <p className="text-[11px] text-muted-foreground">
                      Continuous daily series verified
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Primary Visualization Deck Slot (2.7 & 2.8) */}
              <Card className="border-border/60 bg-card/80 backdrop-blur-sm">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <div>
                    <CardTitle className="text-base font-semibold flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-primary" />
                      Annual Hazard Frequency & 5-Year Rolling Average
                    </CardTitle>
                    <CardDescription className="text-xs mt-1">
                      Historical event count per year with smoothed multi-year climate trajectory.
                    </CardDescription>
                  </div>
                  <Badge variant="outline" className="text-xs font-mono">
                    Chart.js
                  </Badge>
                </CardHeader>
                <CardContent className="pt-4">
                  {/* Chart Container Placeholder (Implemented in Commit 2.7) */}
                  <div className="h-64 rounded-lg border border-border/40 bg-muted/20 flex flex-col items-center justify-center text-center p-6">
                    <Activity className="w-8 h-8 text-muted-foreground mb-2 animate-pulse" />
                    <p className="text-sm font-medium text-foreground">
                      Frequency Chart Ready for Data
                    </p>
                    <p className="text-xs text-muted-foreground max-w-sm mt-1">
                      Will render annual counts and 5-year rolling trendlines upon executing API query.
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Insights Panel & AI Summary Deck Slot (2.9 & 2.10) */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Programmatic Insights Panel Slot */}
                <Card className="border-border/60 bg-card/80 backdrop-blur-sm">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-semibold flex items-center justify-between">
                      <span className="flex items-center gap-2">
                        <Activity className="w-4 h-4 text-primary" />
                        Programmatic Insights
                      </span>
                      <Badge variant="secondary" className="text-[10px]">
                        Rule Engine
                      </Badge>
                    </CardTitle>
                    <CardDescription className="text-xs">
                      Statistical conclusions generated directly from time series data.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-2.5">
                    <div className="p-3 rounded-lg border border-border/40 bg-muted/20 text-xs text-muted-foreground flex items-start gap-2.5">
                      <Info className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                      <span>A total of 7 heatwave events occurred between 1990 and 2020.</span>
                    </div>
                    <div className="p-3 rounded-lg border border-border/40 bg-muted/20 text-xs text-muted-foreground flex items-start gap-2.5">
                      <TrendingUp className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                      <span>Peak heatwave activity was recorded in 2019 with 3 distinct events.</span>
                    </div>
                    <div className="p-3 rounded-lg border border-border/40 bg-muted/20 text-xs text-muted-foreground flex items-start gap-2.5">
                      <Thermometer className="w-4 h-4 text-orange-400 shrink-0 mt-0.5" />
                      <span>The hottest event peaked at 45.2°C, persisting for 5 consecutive days.</span>
                    </div>
                  </CardContent>
                </Card>

                {/* AI Executive Summary Slot */}
                <Card className="border-border/60 bg-card/80 backdrop-blur-sm relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-2xl pointer-events-none" />
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-semibold flex items-center justify-between">
                      <span className="flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-purple-400" />
                        Executive AI Synthesis
                      </span>
                      <Badge variant="outline" className="text-[10px] border-purple-500/40 text-purple-300">
                        Gemini Flash Lite
                      </Badge>
                    </CardTitle>
                    <CardDescription className="text-xs">
                      Natural language summary synthesizing findings for stakeholders.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <p className="text-xs leading-relaxed text-muted-foreground">
                      Between 1990 and 2020 in New Delhi, 7 severe heatwave events were documented with peak thermal intensity concentrating in 2019, reflecting escalating urban heat extremes.
                    </p>
                    <Button variant="outline" size="sm" className="w-full text-xs gap-1.5 border-purple-500/30 hover:bg-purple-500/10 hover:text-purple-300">
                      <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                      Generate AI Summary
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </main>

        {/* Footer */}
        <footer className="border-t border-border/60 bg-card/40 backdrop-blur-md py-6 text-xs text-muted-foreground mt-8">
          <div className="container mx-auto px-4 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-foreground">HazardWatch</span>
              <span>— Meteorological Climate Hazard Trend Analyzer</span>
            </div>
            <div className="flex flex-wrap items-center gap-4 text-[11px]">
              <span>Data: <a href="https://open-meteo.com" target="_blank" rel="noreferrer" className="underline hover:text-foreground">Open-Meteo Historical API</a></span>
              <span>Methodology: <span className="text-foreground">WMO R95p / P95 Climatology</span></span>
              <span>Cache: <span className="text-foreground">MongoDB Atlas</span></span>
            </div>
          </div>
        </footer>
      </div>
    </TooltipProvider>
  )
}
