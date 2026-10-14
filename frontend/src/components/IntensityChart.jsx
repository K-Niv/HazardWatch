import React, { useMemo } from 'react'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  BarController,
  LineController,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js'
import { Chart } from 'react-chartjs-2'
import { CloudRain, Flame, ShieldAlert } from 'lucide-react'

// Ensure Chart.js primitives are registered
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  BarController,
  LineController,
  Title,
  Tooltip,
  Legend,
  Filler
)

/**
 * IntensityChart component
 * Visualizes individual hazard event durations (days, right axis) alongside peak intensities (°C / mm, left axis).
 *
 * @param {Object} props
 * @param {Object|null} props.data - Active hazard dataset (AnalyzeResponse or HazardDetail)
 * @param {'heatwave'|'rainfall'} [props.hazardType='heatwave']
 * @param {boolean} [props.loading=false]
 * @param {string} [props.className='']
 */
export default function IntensityChart({
  data,
  hazardType = 'heatwave',
  loading = false,
  className = '',
}) {
  const isHeatwave = hazardType === 'heatwave'

  // Extract chronological events and compute peak metrics
  const {
    labels,
    intensityValues,
    durationValues,
    eventsList,
    maxDurationEvent,
    maxIntensityEvent,
    avgDuration,
  } = useMemo(() => {
    const rawEvents = data?.events || []
    if (!Array.isArray(rawEvents) || rawEvents.length === 0) {
      return {
        labels: [],
        intensityValues: [],
        durationValues: [],
        eventsList: [],
        maxDurationEvent: null,
        maxIntensityEvent: null,
        avgDuration: 0,
      }
    }

    // Sort events chronologically by start date
    const sorted = [...rawEvents].sort((a, b) =>
      String(a.start_date).localeCompare(String(b.start_date))
    )

    let maxDur = 0
    let maxDurEvt = null
    let maxInt = 0
    let maxIntEvt = null
    let totalDur = 0

    const lbls = []
    const intensities = []
    const durations = []

    sorted.forEach((e) => {
      const dur = Number(e.duration ?? 1)
      totalDur += dur
      if (dur > maxDur) {
        maxDur = dur
        maxDurEvt = e
      }

      const peakVal = isHeatwave
        ? Number(e.peak_temp ?? 0)
        : Number(e.peak_daily_mm ?? 0)

      if (peakVal > maxInt) {
        maxInt = peakVal
        maxIntEvt = e
      }

      // Format clean readable label: e.g. "1998-05-24" -> "May '98"
      let labelStr = e.start_date || 'Event'
      try {
        const parts = e.start_date.split('-')
        if (parts.length === 3) {
          const yearShort = parts[0].slice(2)
          const monthNum = parseInt(parts[1], 10)
          const monthNames = [
            'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
            'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
          ]
          const monthStr = monthNames[monthNum - 1] || parts[1]
          labelStr = `${monthStr} '${yearShort}`
        }
      } catch {
        labelStr = e.start_date
      }

      lbls.push(labelStr)
      intensities.push(peakVal)
      durations.push(dur)
    })

    const avgDur = sorted.length > 0 ? (totalDur / sorted.length).toFixed(1) : '0'

    return {
      labels: lbls,
      intensityValues: intensities,
      durationValues: durations,
      eventsList: sorted,
      maxDurationEvent: maxDurEvt,
      maxIntensityEvent: maxIntEvt,
      avgDuration: avgDur,
    }
  }, [data?.events, isHeatwave])

  // Threshold reference baseline
  const thresholdVal = Number(data?.threshold ?? 0)

  // Chart datasets
  const chartData = useMemo(() => {
    return {
      labels,
      datasets: [
        {
          type: 'bar',
          label: isHeatwave ? 'Peak Daily Max Temp (°C)' : 'Peak Daily Downpour (mm)',
          data: intensityValues,
          yAxisID: 'y',
          backgroundColor: isHeatwave
            ? 'rgba(234, 88, 12, 0.65)' // orange-600
            : 'rgba(6, 182, 212, 0.65)', // cyan-500
          hoverBackgroundColor: isHeatwave
            ? 'rgba(249, 115, 22, 0.95)'
            : 'rgba(34, 211, 238, 0.95)',
          borderColor: isHeatwave
            ? 'rgba(251, 146, 60, 0.9)'
            : 'rgba(34, 211, 238, 0.9)',
          borderWidth: 1,
          borderRadius: 4,
          order: 2,
        },
        {
          type: 'line',
          label: 'Event Duration (Days)',
          data: durationValues,
          yAxisID: 'y1',
          borderColor: isHeatwave ? '#fbbf24' : '#38bdf8', // amber-400 : sky-400
          backgroundColor: isHeatwave
            ? 'rgba(251, 191, 36, 0.15)'
            : 'rgba(56, 189, 248, 0.15)',
          borderWidth: 2.5,
          tension: 0.25,
          fill: false,
          pointRadius: labels.length > 30 ? 3 : 5,
          pointHoverRadius: 7,
          pointBackgroundColor: isHeatwave ? '#fbbf24' : '#38bdf8',
          pointBorderColor: '#090d16',
          pointBorderWidth: 2,
          order: 1,
        },
      ],
    }
  }, [labels, intensityValues, durationValues, isHeatwave])

  // Dual-Axis Chart Options
  const chartOptions = useMemo(() => {
    const minIntensity = intensityValues.length > 0 ? Math.min(...intensityValues) : 0
    // For heatwaves, set y-axis minimum slightly below threshold or lowest peak for contrast
    const yMin = isHeatwave
      ? Math.max(0, Math.floor(Math.min(minIntensity, thresholdVal > 0 ? thresholdVal : minIntensity) - 2))
      : 0

    return {
      responsive: true,
      maintainAspectRatio: false,
      animation: {
        duration: 500,
        easing: 'easeOutQuart',
      },
      interaction: {
        mode: 'index',
        intersect: false,
      },
      plugins: {
        legend: {
          display: true,
          position: 'top',
          align: 'end',
          labels: {
            color: '#94a3b8',
            boxWidth: 10,
            boxHeight: 10,
            usePointStyle: true,
            pointStyle: 'circle',
            padding: 16,
            font: {
              family: 'Geist, sans-serif',
              size: 11,
              weight: 500,
            },
          },
        },
        tooltip: {
          enabled: true,
          backgroundColor: 'rgba(15, 23, 42, 0.94)',
          titleColor: '#f8fafc',
          bodyColor: '#cbd5e1',
          borderColor: 'rgba(255, 255, 255, 0.12)',
          borderWidth: 1,
          cornerRadius: 8,
          padding: 12,
          boxPadding: 4,
          usePointStyle: true,
          titleFont: {
            family: 'Geist, sans-serif',
            size: 12,
            weight: '600',
          },
          bodyFont: {
            family: 'Geist, sans-serif',
            size: 11,
          },
          callbacks: {
            title: (items) => {
              const idx = items[0]?.dataIndex ?? 0
              const evt = eventsList[idx]
              if (!evt) return items[0]?.label ?? 'Hazard Event'
              return `${evt.start_date} to ${evt.end_date}`
            },
            label: (context) => {
              const val = context.raw
              if (context.dataset.yAxisID === 'y1') {
                return ` Duration: ${val} consecutive day${val === 1 ? '' : 's'}`
              }
              const unit = isHeatwave ? '°C' : ' mm/day'
              return ` Peak Intensity: ${Number(val).toFixed(1)}${unit}`
            },
            afterBody: (items) => {
              const idx = items[0]?.dataIndex ?? 0
              const evt = eventsList[idx]
              if (!evt) return []
              const extraLines = []
              if (isHeatwave && evt.avg_temp != null) {
                extraLines.push(` Mean Temp: ${Number(evt.avg_temp).toFixed(1)}°C`)
              }
              if (!isHeatwave && evt.total_mm != null) {
                extraLines.push(` Total Event Rain: ${Number(evt.total_mm).toFixed(1)} mm`)
              }
              return extraLines
            },
          },
        },
      },
      scales: {
        x: {
          grid: {
            color: 'rgba(255, 255, 255, 0.04)',
            tickLength: 6,
          },
          ticks: {
            color: '#94a3b8',
            font: {
              family: 'Geist, sans-serif',
              size: 10,
            },
            maxRotation: 45,
            minRotation: 0,
            autoSkip: true,
            maxTicksLimit: labels.length > 30 ? 12 : 20,
          },
          border: {
            color: 'rgba(255, 255, 255, 0.08)',
          },
        },
        y: {
          type: 'linear',
          position: 'left',
          min: yMin,
          grid: {
            color: 'rgba(255, 255, 255, 0.05)',
          },
          ticks: {
            color: isHeatwave ? '#fb923c' : '#22d3ee',
            font: {
              family: 'Geist, sans-serif',
              size: 10,
            },
          },
          border: {
            color: 'rgba(255, 255, 255, 0.08)',
          },
          title: {
            display: true,
            text: isHeatwave ? 'Peak Temp (°C)' : 'Peak Daily (mm)',
            color: isHeatwave ? 'rgba(251, 146, 60, 0.75)' : 'rgba(34, 211, 238, 0.75)',
            font: {
              family: 'Geist, sans-serif',
              size: 10,
              weight: 500,
            },
          },
        },
        y1: {
          type: 'linear',
          position: 'right',
          beginAtZero: true,
          grid: {
            drawOnChartArea: false, // Don't draw overlapping horizontal grid lines
          },
          ticks: {
            precision: 0,
            color: isHeatwave ? '#fbbf24' : '#38bdf8',
            font: {
              family: 'Geist, sans-serif',
              size: 10,
            },
            stepSize: 1,
          },
          border: {
            color: 'rgba(255, 255, 255, 0.08)',
          },
          title: {
            display: true,
            text: 'Duration (Days)',
            color: isHeatwave ? 'rgba(251, 191, 36, 0.75)' : 'rgba(56, 189, 248, 0.75)',
            font: {
              family: 'Geist, sans-serif',
              size: 10,
              weight: 500,
            },
          },
        },
      },
    }
  }, [labels.length, intensityValues, thresholdVal, eventsList, isHeatwave])

  // Loading skeleton state
  if (loading) {
    return (
      <div className={`space-y-4 ${className}`}>
        <div className="flex items-center justify-between gap-4 pb-2 border-b border-border/40">
          <div className="h-4 w-44 bg-muted/40 rounded animate-pulse" />
          <div className="flex gap-2">
            <div className="h-5 w-24 bg-muted/40 rounded-full animate-pulse" />
            <div className="h-5 w-28 bg-muted/40 rounded-full animate-pulse" />
          </div>
        </div>

        <div className="h-72 rounded-xl border border-border/40 bg-muted/10 p-6 flex flex-col justify-end">
          <div className="flex items-end justify-between gap-3 h-48 w-full pt-6">
            {[55, 80, 45, 95, 60, 75, 40, 85].map((h, i) => (
              <div
                key={i}
                className="flex-1 bg-gradient-to-t from-muted/40 to-muted/20 rounded-t animate-pulse transition-all"
                style={{ height: `${h}%`, animationDelay: `${i * 70}ms` }}
              />
            ))}
          </div>
          <div className="h-4 w-full bg-muted/30 rounded mt-4 animate-pulse" />
        </div>
      </div>
    )
  }

  // Empty state if no events detected
  if (!data || eventsList.length === 0) {
    return (
      <div className={`h-72 rounded-xl border border-border/40 bg-muted/10 flex flex-col items-center justify-center text-center p-6 ${className}`}>
        <div className="w-12 h-12 rounded-2xl bg-muted/30 flex items-center justify-center mb-3">
          <ShieldAlert className="w-6 h-6 text-muted-foreground" />
        </div>
        <p className="text-sm font-semibold text-foreground">
          No Extreme Hazard Events Identified
        </p>
        <p className="text-xs text-muted-foreground max-w-sm mt-1">
          No {isHeatwave ? 'heatwave runs (≥3 consecutive days above T95)' : 'severe precipitation events'} were detected for the chosen location and time window.
        </p>
      </div>
    )
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Top summary strip within chart */}
      <div className="flex flex-wrap items-center justify-between gap-2 pb-1 border-b border-border/30 text-xs">
        <div className="flex items-center gap-2">
          {isHeatwave ? (
            <Flame className="w-4 h-4 text-orange-400" />
          ) : (
            <CloudRain className="w-4 h-4 text-cyan-400" />
          )}
          <span className="font-medium text-foreground">
            {eventsList.length} Detected {isHeatwave ? 'Heatwave' : 'Rainfall'} Event{eventsList.length === 1 ? '' : 's'}
          </span>
          <span className="text-muted-foreground font-mono">
            (Chronological Distribution)
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground font-mono">
          {maxIntensityEvent && (
            <span className="text-orange-400 font-medium">
              Peak: {isHeatwave ? `${maxIntensityEvent.peak_temp}°C` : `${maxIntensityEvent.peak_daily_mm} mm/d`}
            </span>
          )}

          {maxDurationEvent && (
            <span className="text-amber-400 font-medium">
              Longest: {maxDurationEvent.duration}d
            </span>
          )}

          <span>
            Avg Duration: <strong className="text-foreground">{avgDuration}d</strong>
          </span>
        </div>
      </div>

      {/* Dual-Axis Chart Canvas */}
      <div className="h-72 w-full relative">
        <Chart type="bar" data={chartData} options={chartOptions} />
      </div>
    </div>
  )
}
