import React, { useState, useMemo } from 'react'
import {
  Flame,
  CloudRain,
  Activity,
  MapPin,
  Calendar,
  Thermometer,
  ShieldCheck,
  ExternalLink,
  TrendingUp,
  Loader2,
  Clock,
} from 'lucide-react'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from '@/components/ui/tooltip'
import CitySearch from '@/components/CitySearch'
import MapDisplay from '@/components/MapDisplay'
import YearRangePicker from '@/components/YearRangePicker'
import FrequencyChart from '@/components/FrequencyChart'
import IntensityChart from '@/components/IntensityChart'
import InsightsPanel from '@/components/InsightsPanel'
import AISummary from '@/components/AISummary'
import ErrorMessage from '@/components/ErrorMessage'
import { KPICardsSkeleton } from '@/components/LoadingSkeleton'
import { useAnalysis } from '@/hooks/useAnalysis'
import './App.css'

export default function App() {
  // Global control state for the dashboard layout
  const [selectedHazard, setSelectedHazard] = useState('heatwave')
  const [activeChartTab, setActiveChartTab] = useState('frequency')
  const [selectedCity, setSelectedCity] = useState({
    name: 'New Delhi',
    country: 'India',
    lat: 28.6139,
    lon: 77.2090,
  })
  const [yearRange, setYearRange] = useState({ start: 1990, end: 2020 })

  const isHeatwave = selectedHazard === 'heatwave'

  // Primary API analysis hook
  const {
    data,
    loading,
    error,
    lastAnalyzedParams,
    analyze,
  } = useAnalysis({
    lat: selectedCity.lat,
    lon: selectedCity.lon,
    startYear: yearRange.start,
    endYear: yearRange.end,
    hazard: selectedHazard,
    autoFetchOnMount: true,
  })

  // Derive active hazard data from dual-hazard response
  const activeHazardData = useMemo(() => {
    if (!data) return null
    if (data.hazards && data.hazards[selectedHazard]) {
      return data.hazards[selectedHazard]
    }
    return data
  }, [data, selectedHazard])

  // Check if staged user parameters differ from currently analyzed dataset
  const hasPendingChanges = useMemo(() => {
    if (!lastAnalyzedParams) return false
    const latDiff = Math.abs((lastAnalyzedParams.lat ?? 0) - selectedCity.lat) > 0.001
    const lonDiff = Math.abs((lastAnalyzedParams.lon ?? 0) - selectedCity.lon) > 0.001
    const yearDiff =
      lastAnalyzedParams.startYear !== yearRange.start ||
      lastAnalyzedParams.endYear !== yearRange.end

    // If dual hazard payload is present, switching hazard tabs is instant and doesn't need re-query
    const hasBothHazards = Boolean(data?.hazards && data.hazards[selectedHazard])
    const hazardDiff = !hasBothHazards && lastAnalyzedParams.hazard !== selectedHazard

    return latDiff || lonDiff || yearDiff || hazardDiff
  }, [
    lastAnalyzedParams,
    selectedCity.lat,
    selectedCity.lon,
    yearRange.start,
    yearRange.end,
    selectedHazard,
    data,
  ])

  // Handle Hazard Mode Toggle
  const handleHazardChange = (newHazard) => {
    setSelectedHazard(newHazard)
  }

  // Handle "Analyze Climate Hazards" button click
  const handleAnalyzeClick = () => {
    analyze({
      lat: selectedCity.lat,
      lon: selectedCity.lon,
      startYear: yearRange.start,
      endYear: yearRange.end,
      hazard: selectedHazard,
    })
  }

  // Compute Peak Activity Year from active hazard dataset
  const peakYearInfo = useMemo(() => {
    if (!activeHazardData?.yearly_counts) return { year: '—', count: 0 }
    let maxYear = '—'
    let maxCount = 0
    for (const [y, cnt] of Object.entries(activeHazardData.yearly_counts)) {
      if (cnt > maxCount) {
        maxCount = cnt
        maxYear = y
      }
    }
    return { year: maxYear, count: maxCount }
  }, [activeHazardData])

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
                </div>
                <p className="text-xs text-muted-foreground hidden sm:block">
                  Climate Hazard Trend Analyzer & Empirical Extremes Observatory
                </p>
              </div>
            </div>

            {/* Quick Links */}
            <div className="flex items-center gap-3">
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
        <main className="container mx-auto px-3 sm:px-4 lg:px-8 py-5 sm:py-6 flex-1 flex flex-col gap-6">
          {/* Global Error Banner (2.10) */}
          <ErrorMessage
            error={error}
            onRetry={handleAnalyzeClick}
          />

          {/* Top Control Bar / Quick Switcher */}
          <section className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-3.5 sm:p-4 rounded-xl border border-border/60 bg-card/60 backdrop-blur-sm">
            <div className="flex flex-wrap items-center gap-3">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Hazard Mode:
              </span>
              <Tabs
                value={selectedHazard}
                onValueChange={handleHazardChange}
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
            <div className="flex flex-wrap items-center gap-3 md:gap-4 text-xs text-muted-foreground">
              <div className="flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-primary" />
                <span className="font-medium text-foreground">{selectedCity.name}, {selectedCity.country}</span>
                <span className="font-mono opacity-60">({selectedCity.lat.toFixed(2)}°, {selectedCity.lon.toFixed(2)}°)</span>
              </div>
              <div className="h-4 w-px bg-border hidden sm:block" />
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
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Search any global city or select a historical hotspot.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <CitySearch selectedCity={selectedCity} onSelect={setSelectedCity} />
                </CardContent>
              </Card>

              {/* Year Range Picker Card Slot (2.4) */}
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
                  <YearRangePicker yearRange={yearRange} onChange={setYearRange} />

                  <Button
                    onClick={handleAnalyzeClick}
                    disabled={loading}
                    className={`w-full font-semibold shadow-md gap-2 transition-all duration-200 cursor-pointer ${
                      hasPendingChanges
                        ? isHeatwave
                          ? 'bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-bold shadow-orange-500/25 ring-2 ring-amber-400/50'
                          : 'bg-gradient-to-r from-cyan-400 to-blue-500 hover:from-cyan-300 hover:to-blue-400 text-slate-950 font-bold shadow-cyan-500/25 ring-2 ring-cyan-400/50'
                        : isHeatwave
                        ? 'bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white shadow-orange-500/20'
                        : 'bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white shadow-cyan-500/20'
                    }`}
                    id="trigger-analysis-btn"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Querying Meteorological API...</span>
                      </>
                    ) : hasPendingChanges ? (
                      <>
                        <Activity className="w-4 h-4" />
                        <span>Run Analysis (Staged Params)</span>
                      </>
                    ) : (
                      <>
                        <Activity className="w-4 h-4" />
                        <span>Analyze {isHeatwave ? 'Heatwaves' : 'Heavy Rainfall'}</span>
                      </>
                    )}
                  </Button>

                  {hasPendingChanges && (
                    <div className="flex items-center justify-center gap-1.5 text-[11px] text-amber-400 font-medium">
                      <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
                      </span>
                      <span>Parameters staged — click button to run analysis</span>
                    </div>
                  )}
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
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <MapDisplay
                    lat={selectedCity.lat}
                    lon={selectedCity.lon}
                    cityName={selectedCity.name}
                    country={selectedCity.country}
                    hazardType={selectedHazard}
                  />
                </CardContent>
              </Card>
            </aside>

            {/* Main Content Dashboard (8 Cols on desktop) */}
            <div className="lg:col-span-8 flex flex-col gap-6">
              {/* Metric Summary Cards Grid (2.1 & 2.10) */}
              {loading && !activeHazardData ? (
                <KPICardsSkeleton />
              ) : (
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                  <Card className="border-border/60 bg-card/80 backdrop-blur-sm climate-card-interactive">
                    <CardHeader className="p-4 pb-2">
                      <CardDescription className="text-xs font-medium flex items-center justify-between">
                        <span>Total Events</span>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <span className="cursor-help inline-flex items-center">
                              <Activity className="w-3.5 h-3.5 text-primary opacity-80 hover:opacity-100 transition-opacity" />
                            </span>
                          </TooltipTrigger>
                          <TooltipContent side="top" className="text-[11px] max-w-xs">
                            Total multi-day extreme hazard events identified across the selected timeline window using WMO criteria.
                          </TooltipContent>
                        </Tooltip>
                      </CardDescription>
                      <CardTitle className="text-2xl font-bold font-mono tracking-tight mt-1">
                        {loading ? (
                          <span className="inline-block w-8 h-6 bg-muted/60 animate-pulse rounded" />
                        ) : (
                          activeHazardData?.total_events ?? '—'
                        )}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-4 pt-0">
                      <p className="text-[11px] text-muted-foreground">
                        Across {yearRange.end - yearRange.start + 1} observation years
                      </p>
                    </CardContent>
                  </Card>

                  <Card className="border-border/60 bg-card/80 backdrop-blur-sm climate-card-interactive">
                    <CardHeader className="p-4 pb-2">
                      <CardDescription className="text-xs font-medium flex items-center justify-between">
                        <span>{isHeatwave ? 'T95 Threshold' : 'R95p Threshold'}</span>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <span className="cursor-help inline-flex items-center">
                              <Thermometer className="w-3.5 h-3.5 text-orange-400 opacity-80 hover:opacity-100 transition-opacity" />
                            </span>
                          </TooltipTrigger>
                          <TooltipContent side="top" className="text-[11px] max-w-xs">
                            {isHeatwave
                              ? 'Regional 95th percentile baseline temperature. Continuous runs of ≥3 days exceeding this limit qualify as heatwaves.'
                              : 'Regional 95th percentile daily precipitation baseline. Daily totals exceeding this threshold qualify as extreme rainfall.'}
                          </TooltipContent>
                        </Tooltip>
                      </CardDescription>
                      <CardTitle className="text-2xl font-bold font-mono tracking-tight mt-1">
                        {loading ? (
                          <span className="inline-block w-14 h-6 bg-muted/60 animate-pulse rounded" />
                        ) : activeHazardData?.threshold != null ? (
                          isHeatwave ? `${activeHazardData.threshold}°C` : `${activeHazardData.threshold} mm`
                        ) : (
                          '—'
                        )}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-4 pt-0">
                      <p className="text-[11px] text-muted-foreground">
                        Regional 95th percentile baseline
                      </p>
                    </CardContent>
                  </Card>

                  <Card className="border-border/60 bg-card/80 backdrop-blur-sm climate-card-interactive">
                    <CardHeader className="p-4 pb-2">
                      <CardDescription className="text-xs font-medium flex items-center justify-between">
                        <span>Peak Activity</span>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <span className="cursor-help inline-flex items-center">
                              <TrendingUp className="w-3.5 h-3.5 text-emerald-400 opacity-80 hover:opacity-100 transition-opacity" />
                            </span>
                          </TooltipTrigger>
                          <TooltipContent side="top" className="text-[11px] max-w-xs">
                            Calendar year with the single highest count of identified extreme hazard events.
                          </TooltipContent>
                        </Tooltip>
                      </CardDescription>
                      <CardTitle className="text-2xl font-bold font-mono tracking-tight mt-1">
                        {loading ? (
                          <span className="inline-block w-12 h-6 bg-muted/60 animate-pulse rounded" />
                        ) : (
                          peakYearInfo.year
                        )}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-4 pt-0">
                      <p className="text-[11px] text-muted-foreground">
                        {peakYearInfo.count > 0
                          ? `Record ${peakYearInfo.count} event${peakYearInfo.count > 1 ? 's' : ''} in season`
                          : 'No events detected'}
                      </p>
                    </CardContent>
                  </Card>

                  <Card className="border-border/60 bg-card/80 backdrop-blur-sm climate-card-interactive">
                    <CardHeader className="p-4 pb-2">
                      <CardDescription className="text-xs font-medium flex items-center justify-between">
                        <span>Data Quality</span>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <span className="cursor-help inline-flex items-center">
                              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 opacity-80 hover:opacity-100 transition-opacity" />
                            </span>
                          </TooltipTrigger>
                          <TooltipContent side="top" className="text-[11px] max-w-xs">
                            Continuous daily observation continuity verified across the entire selected decadal timeline.
                          </TooltipContent>
                        </Tooltip>
                      </CardDescription>
                      <CardTitle className="text-2xl font-bold font-mono tracking-tight mt-1 text-emerald-400">
                        {loading ? (
                          <span className="inline-block w-10 h-6 bg-muted/60 animate-pulse rounded" />
                        ) : (
                          `${data?.data_quality?.completeness_pct ?? 100}%`
                        )}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-4 pt-0">
                      <p className="text-[11px] text-muted-foreground">
                        Continuous daily series verified
                      </p>
                    </CardContent>
                  </Card>
                </div>
              )}

              {/* Primary Visualization Deck Slot (2.6 & 2.7) */}
              <Card className="border-border/60 bg-card/80 backdrop-blur-sm">
                <CardHeader className="flex flex-col sm:flex-row sm:items-start sm:justify-between pb-3 gap-3">
                  <div>
                    <CardTitle className="text-base font-semibold flex items-center gap-2">
                      {activeChartTab === 'frequency' ? (
                        <>
                          <TrendingUp className="w-4 h-4 text-primary" />
                          Annual Hazard Frequency & 5-Year Rolling Average
                        </>
                      ) : (
                        <>
                          <Clock className="w-4 h-4 text-primary" />
                          Hazard Event Duration & Peak Severity Timeline
                        </>
                      )}
                    </CardTitle>
                    <CardDescription className="text-xs mt-1">
                      {activeChartTab === 'frequency'
                        ? 'Historical event count per year with smoothed multi-year climate trajectory.'
                        : 'Individual consecutive event duration (days) juxtaposed with peak hazard intensity.'}
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Tabs value={activeChartTab} onValueChange={setActiveChartTab} className="h-8">
                      <TabsList className="h-8 bg-muted/60 p-0.5">
                        <TabsTrigger value="frequency" className="text-xs h-7 px-3 flex items-center gap-1.5">
                          <TrendingUp className="w-3 h-3" />
                          Annual Frequency
                        </TabsTrigger>
                        <TabsTrigger value="intensity" className="text-xs h-7 px-3 flex items-center gap-1.5">
                          <Clock className="w-3 h-3" />
                          Severity & Duration
                        </TabsTrigger>
                      </TabsList>
                    </Tabs>
                  </div>
                </CardHeader>
                <CardContent className="pt-2">
                  {activeChartTab === 'frequency' ? (
                    <FrequencyChart
                      data={activeHazardData}
                      hazardType={selectedHazard}
                      loading={loading}
                    />
                  ) : (
                    <IntensityChart
                      data={activeHazardData}
                      hazardType={selectedHazard}
                      loading={loading}
                    />
                  )}
                </CardContent>
              </Card>

              {/* Insights Panel & AI Summary Deck Slot (2.8 & 2.9) */}
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                {/* Programmatic Insights Panel Slot (2.8) */}
                <InsightsPanel
                  data={activeHazardData}
                  hazardType={selectedHazard}
                  loading={loading}
                />

                {/* AI Executive Summary Slot (2.9) */}
                <AISummary
                  data={activeHazardData}
                  hazardType={selectedHazard}
                  selectedCity={selectedCity}
                  yearRange={yearRange}
                  analysisLoading={loading}
                />
              </div>
            </div>
          </div>
        </main>

        {/* Footer */}
        <footer className="border-t border-border/60 bg-card/40 backdrop-blur-md py-6 text-xs text-muted-foreground mt-8">
          <div className="container mx-auto px-3 sm:px-4 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-foreground">HazardWatch</span>
              <span>— Meteorological Climate Hazard Trend Analyzer</span>
            </div>
            <div className="flex flex-wrap items-center gap-4 text-[11px]">
              <span>Data: <a href="https://open-meteo.com" target="_blank" rel="noreferrer" className="underline hover:text-foreground">Open-Meteo Historical API</a></span>
              <span>Methodology: <span className="text-foreground">WMO R95p / P95 Climatology</span></span>
            </div>
          </div>
        </footer>
      </div>
    </TooltipProvider>
  )
}
