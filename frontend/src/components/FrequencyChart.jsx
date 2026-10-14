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
import { Flame, CloudRain, Calendar } from 'lucide-react'

// Register Chart.js primitives once
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
 * FrequencyChart component
 * Visualizes annual hazard frequency (bars) alongside a 5-year rolling average trendline (line).
 *
 * @param {Object} props
 * @param {Object|null} props.data - AnalyzeResponse payload from backend
 * @param {'heatwave'|'rainfall'} [props.hazardType='heatwave']
 * @param {boolean} [props.loading=false]
 * @param {string} [props.className='']
 */
export default function FrequencyChart({
  data,
  hazardType = 'heatwave',
  loading = false,
  className = '',
}) {
  const isHeatwave = hazardType === 'heatwave'

  // Extract time series arrays
  const { labels, barValues, lineValues, peakYear, maxCount, averagePerYear } = useMemo(() => {
    if (!data?.yearly_counts) {
      return {
        labels: [],
        barValues: [],
        lineValues: [],
        peakYear: null,
        maxCount: 0,
        averagePerYear: 0,
      }
    }

    const sortedYears = Object.keys(data.yearly_counts).sort((a, b) => Number(a) - Number(b))
    const counts = sortedYears.map((y) => data.yearly_counts[y] ?? 0)
    const rolling = sortedYears.map((y) => data.rolling_avg?.[y] ?? 0)

    let peak = null
    let max = 0
    let sum = 0

    sortedYears.forEach((y, i) => {
      const c = counts[i]
      sum += c
      if (c > max) {
        max = c
        peak = y
      }
    })

    const avg = sortedYears.length > 0 ? (sum / sortedYears.length).toFixed(2) : '0.00'

    return {
      labels: sortedYears,
      barValues: counts,
      lineValues: rolling,
      peakYear: peak,
      maxCount: max,
      averagePerYear: avg,
    }
  }, [data])

  // Chart.js Dataset payload
  const chartData = useMemo(() => {
    const datasets = [
      {
        type: 'bar',
        label: isHeatwave ? 'Annual Heatwaves' : 'Annual Rainfall Events',
        data: barValues,
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
        borderSkipped: false,
        order: 2,
      },
    ]

    // Only render 5-year rolling average line if timeline has at least 5 years
    if (labels.length >= 5 && lineValues.length > 0) {
      datasets.unshift({
        type: 'line',
        label: '5-Year Rolling Average',
        data: lineValues,
        borderColor: isHeatwave ? '#f59e0b' : '#38bdf8', // amber-500 : sky-400
        backgroundColor: isHeatwave
          ? 'rgba(245, 158, 11, 0.12)'
          : 'rgba(56, 189, 248, 0.12)',
        borderWidth: 2.5,
        tension: 0.35,
        fill: true,
        pointRadius: labels.length > 45 ? 0 : 3,
        pointHoverRadius: 6,
        pointBackgroundColor: isHeatwave ? '#fbbf24' : '#38bdf8',
        pointBorderColor: '#090d16',
        pointBorderWidth: 2,
        order: 1,
      })
    }

    return {
      labels,
      datasets,
    }
  }, [labels, barValues, lineValues, isHeatwave])

  // Chart.js responsive options
  const chartOptions = useMemo(() => {
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
            title: (items) => `Timeline Year: ${items[0]?.label}`,
            label: (context) => {
              const val = context.raw
              if (context.dataset.type === 'line') {
                return ` 5-Yr Rolling Avg: ${Number(val).toFixed(2)} events/yr`
              }
              return ` Annual Count: ${val} event${val === 1 ? '' : 's'}`
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
            maxRotation: 0,
            autoSkip: true,
            maxTicksLimit: labels.length > 50 ? 12 : 16,
          },
          border: {
            color: 'rgba(255, 255, 255, 0.08)',
          },
        },
        y: {
          beginAtZero: true,
          grid: {
            color: 'rgba(255, 255, 255, 0.05)',
          },
          ticks: {
            precision: 0,
            color: '#94a3b8',
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
            text: 'Annual Events',
            color: 'rgba(148, 163, 184, 0.65)',
            font: {
              family: 'Geist, sans-serif',
              size: 10,
              weight: 500,
            },
          },
        },
      },
    }
  }, [labels.length])

  // Render Skeleton while fetching
  if (loading) {
    return (
      <div className={`space-y-4 ${className}`}>
        {/* Header metrics skeleton */}
        <div className="flex items-center justify-between gap-4 pb-2 border-b border-border/40">
          <div className="h-4 w-48 bg-muted/40 rounded animate-pulse" />
          <div className="flex gap-2">
            <div className="h-5 w-20 bg-muted/40 rounded-full animate-pulse" />
            <div className="h-5 w-24 bg-muted/40 rounded-full animate-pulse" />
          </div>
        </div>

        {/* Simulated chart bars skeleton */}
        <div className="h-72 rounded-xl border border-border/40 bg-muted/10 p-6 flex flex-col justify-end">
          <div className="flex items-end justify-between gap-2 h-48 w-full pt-6">
            {[40, 65, 25, 80, 50, 95, 30, 70, 85, 45, 60, 90, 35, 75].map((h, i) => (
              <div
                key={i}
                className="flex-1 bg-gradient-to-t from-muted/40 to-muted/20 rounded-t animate-pulse transition-all"
                style={{ height: `${h}%`, animationDelay: `${i * 60}ms` }}
              />
            ))}
          </div>
          <div className="h-4 w-full bg-muted/30 rounded mt-4 animate-pulse" />
        </div>
      </div>
    )
  }

  // Render empty state if no dataset loaded yet
  if (!data || labels.length === 0) {
    return (
      <div className={`h-72 rounded-xl border border-border/40 bg-muted/10 flex flex-col items-center justify-center text-center p-6 ${className}`}>
        <div className="w-12 h-12 rounded-2xl bg-muted/30 flex items-center justify-center mb-3">
          <Calendar className="w-6 h-6 text-muted-foreground" />
        </div>
        <p className="text-sm font-semibold text-foreground">
          No Historical Observations Loaded
        </p>
        <p className="text-xs text-muted-foreground max-w-sm mt-1">
          Select target coordinates and observation years, then click &quot;Analyze Climate Hazards&quot; to render the decadal trendline.
        </p>
      </div>
    )
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Top summary strip within chart card */}
      <div className="flex flex-wrap items-center justify-between gap-2 pb-1 border-b border-border/30 text-xs">
        <div className="flex items-center gap-2">
          {isHeatwave ? (
            <Flame className="w-4 h-4 text-orange-400" />
          ) : (
            <CloudRain className="w-4 h-4 text-cyan-400" />
          )}
          <span className="font-medium text-foreground">
            {labels[0]} – {labels[labels.length - 1]} Time Series
          </span>
          <span className="text-muted-foreground font-mono">({labels.length} Years)</span>
        </div>

        <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground font-mono">
          {labels.length < 5 && (
            <span className="text-[11px] text-muted-foreground/80">
              5-Yr Trendline Omitted (&lt; 5 yrs)
            </span>
          )}
          {peakYear && (
            <span className="text-amber-400 font-medium">
              Peak: {peakYear} ({maxCount} events)
            </span>
          )}
          <span>
            Avg: <strong className="text-foreground">{averagePerYear}</strong> / yr
          </span>
        </div>
      </div>

      {/* Primary Chart Canvas */}
      <div className="h-72 w-full relative">
        <Chart type="bar" data={chartData} options={chartOptions} />
      </div>
    </div>
  )
}
