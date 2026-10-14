import React, { useState } from 'react'
import {
  Sparkles,
  Loader2,
  Copy,
  Check,
  RefreshCw,
  AlertCircle,
  AlertTriangle,
  Zap,
  Droplets,
  HeartPulse,
  CheckCircle2,
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { fetchAISummary } from '@/services/api'

/**
 * Maps impact strings to appropriate contextual lucide icons.
 *
 * @param {string} text
 */
function getImpactIcon(text = '') {
  const lower = text.toLowerCase()
  if (lower.includes('health') || lower.includes('mortality') || lower.includes('cardio') || lower.includes('vector')) {
    return HeartPulse
  }
  if (lower.includes('energy') || lower.includes('grid') || lower.includes('power') || lower.includes('transformer')) {
    return Zap
  }
  if (lower.includes('water') || lower.includes('flood') || lower.includes('drainage') || lower.includes('inundat')) {
    return Droplets
  }
  return AlertCircle
}

/**
 * AISummary Component
 * Triggers and renders an executive climate intelligence briefing
 * powered by Groq Cloud (Llama 3.3 70B) or the Deterministic Climate Intelligence Engine.
 *
 * @param {Object} props
 * @param {Object|null} props.data - Active hazard dataset
 * @param {'heatwave'|'rainfall'} [props.hazardType='heatwave']
 * @param {{ name: string, country: string, lat: number, lon: number }} props.selectedCity
 * @param {{ start: number, end: number }} props.yearRange
 * @param {boolean} [props.analysisLoading=false]
 * @param {string} [props.className='']
 */
export default function AISummary({
  data,
  hazardType = 'heatwave',
  selectedCity,
  yearRange,
  analysisLoading = false,
  className = '',
}) {
  const [summaryData, setSummaryData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [copied, setCopied] = useState(false)

  const handleGenerate = async () => {
    if (!data || analysisLoading) return

    setLoading(true)
    setError(null)

    const totalEvents =
      data.total_events != null
        ? data.total_events
        : Array.isArray(data.events)
        ? data.events.length
        : 0

    const payload = {
      hazard_type: hazardType,
      start_year: yearRange.start,
      end_year: yearRange.end,
      total_events: totalEvents,
      city_name: `${selectedCity.name}, ${selectedCity.country}`,
      insights: Array.isArray(data.insights) ? data.insights : [],
      stats: {
        yearly_counts: data.yearly_counts || {},
        threshold: data.threshold || null,
      },
    }

    try {
      const response = await fetchAISummary(payload)
      setSummaryData(response)
    } catch (err) {
      setError(err?.message || 'Failed to generate climate intelligence briefing.')
    } finally {
      setLoading(false)
    }
  }

  const handleCopy = async () => {
    if (!summaryData) return

    const lines = [
      `# Executive Climate Risk Briefing: ${selectedCity.name}, ${selectedCity.country}`,
      `Observation Period: ${yearRange.start}–${yearRange.end} | Hazard: ${hazardType.toUpperCase()}`,
      `Assessed Risk Level: ${summaryData.risk_level || 'Elevated'}`,
      `Source: ${summaryData.source || 'Climate Intelligence Engine'}`,
      '',
      `## Executive Synopsis`,
      summaryData.summary || '',
      '',
      `## Sectoral & Urban Vulnerabilities`,
      ...(summaryData.impacts || []).map((i) => `- ${i}`),
      '',
      `## Municipal Adaptation & Resilience Recommendations`,
      ...(summaryData.recommendations || []).map((r) => `- [ ] ${r}`),
    ]

    try {
      await navigator.clipboard.writeText(lines.join('\n'))
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      setCopied(false)
    }
  }

  const hasData = Boolean(data && (data.events || data.yearly_counts))

  return (
    <Card className={`border-border/60 bg-card/80 backdrop-blur-sm relative overflow-hidden flex flex-col ${className}`}>
      {/* Decorative ambient background glow */}
      <div className="absolute top-0 right-0 w-44 h-44 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

      <CardHeader className="pb-3 border-b border-border/30">
        <div className="flex items-start justify-between gap-3">
          <div>
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-purple-400" />
              Executive AI Climate Briefing
            </CardTitle>
            <CardDescription className="text-xs mt-1">
              Multi-pillar risk synthesis, sectoral impacts, and municipal adaptation strategy.
            </CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-3.5 pb-4 space-y-3.5 flex-1 flex flex-col justify-between">
        {/* Loading state during synthesis generation */}
        {loading && (
          <div className="p-4 rounded-xl border border-purple-500/30 bg-purple-500/[0.04] space-y-3 animate-pulse">
            <div className="flex items-center gap-2 text-xs text-purple-300 font-medium">
              <Loader2 className="w-4 h-4 animate-spin text-purple-400 shrink-0" />
              <span>Synthesizing multi-decadal meteorological data & policy recommendations...</span>
            </div>
            <div className="space-y-2 pt-1">
              <div className="h-3.5 bg-purple-400/20 rounded w-full" />
              <div className="h-3.5 bg-purple-400/20 rounded w-5/6" />
              <div className="h-3.5 bg-purple-400/20 rounded w-4/6" />
            </div>
          </div>
        )}

        {/* Error state */}
        {!loading && error && (
          <div className="p-3.5 rounded-xl border border-rose-500/30 bg-rose-500/10 text-xs text-rose-300 space-y-2">
            <div className="flex items-center gap-2 font-medium">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>Synthesis Failed</span>
            </div>
            <p className="text-[11px] opacity-90">{error}</p>
            <Button
              variant="outline"
              size="sm"
              onClick={handleGenerate}
              className="h-7 text-xs border-rose-500/40 hover:bg-rose-500/20 text-rose-200 mt-1 cursor-pointer"
            >
              Retry Generation
            </Button>
          </div>
        )}

        {/* Active generated summary display */}
        {!loading && !error && summaryData && (
          <div className="space-y-3.5 flex-1 flex flex-col justify-between">
            {/* Executive Synopsis Box */}
            <div className="p-3.5 rounded-xl border border-purple-500/30 bg-purple-500/[0.03] space-y-2 relative">
              <p className="text-xs sm:text-[13px] leading-relaxed text-foreground/95 font-normal">
                {summaryData.summary}
              </p>
            </div>

            {/* Sectoral Vulnerability Assessment (Impacts) */}
            {Array.isArray(summaryData.impacts) && summaryData.impacts.length > 0 && (
              <div className="space-y-1.5">
                <span className="text-[11px] font-semibold tracking-wider text-muted-foreground uppercase flex items-center gap-1.5">
                  <AlertTriangle className="w-3 h-3 text-amber-400" />
                  Key Urban Vulnerabilities
                </span>
                <div className="grid grid-cols-1 gap-1.5">
                  {summaryData.impacts.map((impact, idx) => {
                    const ImpactIcon = getImpactIcon(impact)
                    return (
                      <div
                        key={idx}
                        className="p-2.5 rounded-lg border border-border/40 bg-muted/15 flex items-start gap-2.5 text-xs text-foreground/90"
                      >
                        <ImpactIcon className="w-3.5 h-3.5 text-primary shrink-0 mt-0.5" />
                        <span className="leading-snug">{impact}</span>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Municipal Adaptation Blueprint (Recommendations) */}
            {Array.isArray(summaryData.recommendations) && summaryData.recommendations.length > 0 && (
              <div className="space-y-1.5">
                <span className="text-[11px] font-semibold tracking-wider text-muted-foreground uppercase flex items-center gap-1.5">
                  <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                  Municipal Resilience Blueprint
                </span>
                <div className="grid grid-cols-1 gap-1.5">
                  {summaryData.recommendations.map((rec, idx) => (
                    <div
                      key={idx}
                      className="p-2.5 rounded-lg border border-emerald-500/20 bg-emerald-500/[0.03] flex items-start gap-2.5 text-xs text-foreground/90"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                      <span className="leading-snug">{rec}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Actions Toolbar */}
            <div className="flex items-center justify-between gap-2 pt-2 border-t border-border/30">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleCopy}
                className="h-7 text-xs text-muted-foreground hover:text-foreground gap-1.5 px-2 cursor-pointer"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-emerald-400">Briefing Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy Full Briefing</span>
                  </>
                )}
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={handleGenerate}
                disabled={analysisLoading}
                className="h-7 text-xs gap-1.5 border-purple-500/30 hover:bg-purple-500/10 hover:text-purple-300 cursor-pointer"
              >
                <RefreshCw className="w-3 h-3 text-purple-400" />
                <span>Regenerate</span>
              </Button>
            </div>
          </div>
        )}

        {/* Initial Idle / Pre-generation State */}
        {!loading && !error && !summaryData && (
          <div className="space-y-4 flex-1 flex flex-col justify-between">
            <div className="p-3.5 rounded-xl border border-border/40 bg-muted/15 space-y-2.5">
              <p className="text-xs leading-relaxed text-muted-foreground">
                Synthesize multi-decadal frequency trajectories, extreme severity runs, and municipal vulnerability assessments into an actionable briefing.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 text-[11px] text-muted-foreground/80">
                <span className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-purple-400 inline-block" />
                  Multi-pillar risk synthesis
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 inline-block" />
                  Infrastructure & health impacts
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block" />
                  Actionable resilience blueprint
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 inline-block" />
                  Climatological evaluation
                </span>
              </div>
            </div>

            <Button
              onClick={handleGenerate}
              disabled={!hasData || analysisLoading}
              className="w-full text-xs font-semibold gap-2 bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-600 hover:from-purple-500 hover:to-indigo-500 text-white shadow-md shadow-purple-500/20 cursor-pointer"
              id="generate-ai-summary-btn"
            >
              <Sparkles className="w-3.5 h-3.5 text-purple-200" />
              <span>Generate Executive Climate Briefing</span>
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
