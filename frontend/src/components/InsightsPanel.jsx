import React, { useState } from 'react'
import {
  Activity,
  Flame,
  CloudRain,
  TrendingUp,
  TrendingDown,
  Calendar,
  Award,
  Minus,
  Copy,
  Check,
  Info,
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

/**
 * Classifies an insight sentence into a themed category with bespoke icon and color tokens.
 *
 * @param {string} text
 * @param {'heatwave'|'rainfall'} hazardType
 */
function classifyInsight(text, hazardType) {
  const lower = text.toLowerCase()
  const isHeatwave = hazardType === 'heatwave'

  if (
    lower.includes('hottest') ||
    lower.includes('peaked') ||
    lower.includes('intense downpour') ||
    lower.includes('highest single-event') ||
    lower.includes('persisted for')
  ) {
    return {
      category: 'Extreme Severity',
      Icon: isHeatwave ? Flame : CloudRain,
      iconClass: isHeatwave ? 'text-orange-400' : 'text-cyan-400',
      borderClass: isHeatwave
        ? 'border-orange-500/20 hover:border-orange-500/40 bg-orange-500/[0.03]'
        : 'border-cyan-500/20 hover:border-cyan-500/40 bg-cyan-500/[0.03]',
    }
  }

  if (
    lower.includes('increased') ||
    lower.includes('elevated activity') ||
    lower.includes('emerged in the latter half') ||
    lower.includes('higher than the long-term')
  ) {
    return {
      category: 'Accelerating Trend',
      Icon: TrendingUp,
      iconClass: 'text-rose-400',
      borderClass: 'border-rose-500/20 hover:border-rose-500/40 bg-rose-500/[0.03]',
    }
  }

  if (lower.includes('decreased') || lower.includes('lower activity')) {
    return {
      category: 'Decelerating Trend',
      Icon: TrendingDown,
      iconClass: 'text-emerald-400',
      borderClass: 'border-emerald-500/20 hover:border-emerald-500/40 bg-emerald-500/[0.03]',
    }
  }

  if (lower.includes('most active year') || lower.includes('record')) {
    return {
      category: 'Record Outlier',
      Icon: Award,
      iconClass: 'text-amber-400',
      borderClass: 'border-amber-500/20 hover:border-amber-500/40 bg-amber-500/[0.03]',
    }
  }

  if (lower.includes('stable') || lower.includes('relatively stable')) {
    return {
      category: 'Equilibrium',
      Icon: Minus,
      iconClass: 'text-blue-400',
      borderClass: 'border-blue-500/20 hover:border-blue-500/40 bg-blue-500/[0.03]',
    }
  }

  // Baseline Climatological Window
  return {
    category: 'Baseline Climatology',
    Icon: Calendar,
    iconClass: 'text-primary',
    borderClass: 'border-border/40 hover:border-border/80 bg-muted/15',
  }
}

/**
 * InsightsPanel Component
 * Presents deterministic meteorological conclusions computed by the backend trends engine.
 *
 * @param {Object} props
 * @param {Object|null} props.data - Active hazard dataset containing `insights: string[]`
 * @param {'heatwave'|'rainfall'} [props.hazardType='heatwave']
 * @param {boolean} [props.loading=false]
 * @param {string} [props.className='']
 */
export default function InsightsPanel({
  data,
  hazardType = 'heatwave',
  loading = false,
  className = '',
}) {
  const [copied, setCopied] = useState(false)
  const rawInsights = data?.insights || []

  const handleCopyAll = async () => {
    if (rawInsights.length === 0) return
    const formatted = rawInsights.map((insight, idx) => `${idx + 1}. ${insight}`).join('\n')
    try {
      await navigator.clipboard.writeText(formatted)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Fallback if clipboard API is restricted
      setCopied(false)
    }
  }

  return (
    <Card className={`border-border/60 bg-card/80 backdrop-blur-sm flex flex-col ${className}`}>
      <CardHeader className="pb-3 border-b border-border/30">
        <div className="flex items-start justify-between gap-3">
          <div>
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Activity className="w-4 h-4 text-primary" />
              Programmatic Insights
            </CardTitle>
            <CardDescription className="text-xs mt-1">
              Deterministic statistical conclusions derived from multi-decadal time series.
            </CardDescription>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {rawInsights.length > 0 && !loading && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleCopyAll}
                className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground gap-1"
                title="Copy all findings"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-[11px] text-emerald-400">Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span className="text-[11px] hidden sm:inline">Copy</span>
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-3.5 pb-4 space-y-2.5 flex-1">
        {loading ? (
          <div className="space-y-2.5">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="p-3 rounded-lg border border-border/30 bg-muted/15 flex items-start gap-3 animate-pulse"
              >
                <div className="w-7 h-7 rounded-md bg-muted/40 shrink-0" />
                <div className="flex-1 space-y-2 pt-0.5">
                  <div className="h-3 w-28 bg-muted/40 rounded" />
                  <div className="h-3.5 w-full bg-muted/30 rounded" />
                </div>
              </div>
            ))}
          </div>
        ) : rawInsights.length > 0 ? (
          <div className="space-y-2.5">
            {rawInsights.map((insight, idx) => {
              const { category, Icon, iconClass, borderClass } = classifyInsight(
                insight,
                hazardType
              )

              return (
                <div
                  key={idx}
                  className={`p-3 rounded-xl border transition-all duration-200 flex items-start gap-3 ${borderClass}`}
                >
                  <div className="w-7 h-7 rounded-lg bg-background/60 border border-border/40 flex items-center justify-center shrink-0 mt-0.5 shadow-sm">
                    <Icon className={`w-4 h-4 ${iconClass}`} />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`text-[11px] font-semibold tracking-wide uppercase ${iconClass}`}>
                        {category}
                      </span>
                    </div>
                    <p className="text-xs leading-relaxed text-foreground/90 font-normal">
                      {insight}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <div className="h-44 rounded-xl border border-dashed border-border/60 bg-muted/10 flex flex-col items-center justify-center text-center p-6">
            <div className="w-10 h-10 rounded-xl bg-muted/20 flex items-center justify-center mb-2.5">
              <Info className="w-5 h-5 text-muted-foreground" />
            </div>
            <p className="text-xs font-semibold text-foreground">
              Awaiting Meteorological Computation
            </p>
            <p className="text-[11px] text-muted-foreground max-w-xs mt-1">
              Select a city and timeline, then trigger the query to generate empirical insights.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
