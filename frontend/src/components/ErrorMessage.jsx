import React from 'react'
import {
  AlertTriangle,
  WifiOff,
  ServerCrash,
  RefreshCw,
  X,
  Clock,
} from 'lucide-react'
import { Button } from '@/components/ui/button'

/**
 * Categorizes an error message into actionable contextual details.
 *
 * @param {string} errorText
 */
function classifyError(errorText = '') {
  const lower = String(errorText).toLowerCase()

  if (lower.includes('connect') || lower.includes('failed to fetch') || lower.includes('network') || lower.includes('offline')) {
    return {
      type: 'Network Connectivity',
      title: 'Backend Unreachable',
      advice: 'Unable to communicate with the HazardWatch FastAPI backend on http://localhost:8000. Verify the server is running.',
      Icon: WifiOff,
      borderClass: 'border-rose-500/40 bg-rose-500/10 text-rose-300',
    }
  }

  if (lower.includes('rate limit') || lower.includes('429') || lower.includes('too many requests')) {
    return {
      type: 'Rate Limited',
      title: 'API Request Throttled',
      advice: 'The upstream meteorological data API rate limit was temporarily reached. Please wait a few seconds before retrying.',
      Icon: Clock,
      borderClass: 'border-amber-500/40 bg-amber-500/10 text-amber-300',
    }
  }

  if (lower.includes('500') || lower.includes('internal server error')) {
    return {
      type: 'Server Error',
      title: 'Backend Internal Error',
      advice: 'An unexpected exception occurred during data processing or aggregation. Check backend terminal logs for stacktrace.',
      Icon: ServerCrash,
      borderClass: 'border-rose-500/40 bg-rose-500/10 text-rose-300',
    }
  }

  return {
    type: 'Analysis Error',
    title: 'Query Processing Failed',
    advice: errorText || 'An error occurred while evaluating meteorological parameters. Verify your selected city coordinates and timeline.',
    Icon: AlertTriangle,
    borderClass: 'border-rose-500/40 bg-rose-500/10 text-rose-300',
  }
}

/**
 * ErrorMessage Component
 * Displays an observatory-themed, categorized alert banner with troubleshooting advice and 1-click retry.
 *
 * @param {Object} props
 * @param {string|null} props.error - Error string
 * @param {() => void} [props.onRetry] - Callback to trigger retry
 * @param {() => void} [props.onDismiss] - Optional callback to clear error
 * @param {string} [props.className='']
 */
export default function ErrorMessage({
  error,
  onRetry,
  onDismiss,
  className = '',
}) {
  if (!error) return null

  const { type, title, advice, Icon, borderClass } = classifyError(error)

  return (
    <div
      role="alert"
      className={`p-4 rounded-xl border backdrop-blur-sm shadow-lg animate-in fade-in slide-in-from-top-2 duration-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${borderClass} ${className}`}
    >
      <div className="flex items-start gap-3">
        <div className="w-8 h-8 rounded-lg bg-background/50 border border-current/20 flex items-center justify-center shrink-0 mt-0.5">
          <Icon className="w-4 h-4 text-current" />
        </div>

        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-xs text-foreground tracking-tight">
              {title}
            </span>
            <span className="text-[10px] font-mono py-0.5 px-1.5 rounded border border-current/30 text-current">
              {type}
            </span>
          </div>
          <p className="text-xs leading-relaxed opacity-90 max-w-2xl">
            {advice}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
        {onRetry && (
          <Button
            variant="outline"
            size="sm"
            onClick={onRetry}
            className="h-8 text-xs font-semibold gap-1.5 border-current/30 hover:bg-current/10 text-current cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Retry Query</span>
          </Button>
        )}

        {onDismiss && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onDismiss}
            className="h-8 w-8 p-0 text-current hover:bg-current/10 rounded-lg cursor-pointer"
            title="Dismiss error"
          >
            <X className="w-4 h-4" />
          </Button>
        )}
      </div>
    </div>
  )
}
