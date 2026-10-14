import React, { useState } from 'react'
import { ChevronRight, Clock, AlertCircle } from 'lucide-react'
import { Slider } from '@/components/ui/slider'
import { Input } from '@/components/ui/input'
import './YearRangePicker.css'

const MIN_ALLOWED_YEAR = 1950
const MAX_ALLOWED_YEAR = 2025

const DECADE_PRESETS = [
  { label: '1990–2020', start: 1990, end: 2020, tag: 'WMO Standard (31y)' },
  { label: '2000–2024', start: 2000, end: 2024, tag: 'Recent Warming (25y)' },
  { label: '1980–2010', start: 1980, end: 2010, tag: 'Baseline Normal (31y)' },
  { label: '1950–2024', start: 1950, end: 2024, tag: 'Full Historical (75y)' },
]

export default function YearRangePicker({
  yearRange = { start: 1990, end: 2020 },
  onChange,
}) {
  const [startInput, setStartInput] = useState(String(yearRange.start))
  const [endInput, setEndInput] = useState(String(yearRange.end))
  const [validationError, setValidationError] = useState(null)

  // Handle Dual-Thumb Slider Change
  const handleSliderChange = ([newStart, newEnd]) => {
    if (newStart < newEnd) {
      setValidationError(null)
      setStartInput(String(newStart))
      setEndInput(String(newEnd))
      onChange({ start: newStart, end: newEnd })
    }
  }

  // Handle Direct Numeric Input Commits
  const commitInputs = (newStartStr, newEndStr) => {
    const s = parseInt(newStartStr, 10)
    const e = parseInt(newEndStr, 10)

    if (isNaN(s) || isNaN(e)) {
      setValidationError('Please enter valid numeric 4-digit years.')
      return
    }

    if (s < MIN_ALLOWED_YEAR || s > MAX_ALLOWED_YEAR) {
      setValidationError(`Start year must be between ${MIN_ALLOWED_YEAR} and ${MAX_ALLOWED_YEAR}.`)
      return
    }

    if (e < MIN_ALLOWED_YEAR || e > MAX_ALLOWED_YEAR) {
      setValidationError(`End year must be between ${MIN_ALLOWED_YEAR} and ${MAX_ALLOWED_YEAR}.`)
      return
    }

    if (s >= e) {
      setValidationError('Start year must be strictly earlier than end year.')
      return
    }

    setValidationError(null)
    onChange({ start: s, end: e })
  }

  const handleStartBlur = () => {
    commitInputs(startInput, endInput)
  }

  const handleEndBlur = () => {
    commitInputs(startInput, endInput)
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      commitInputs(startInput, endInput)
    }
  }

  const totalYears = yearRange.end - yearRange.start + 1

  return (
    <div className="space-y-4">
      {/* Dual Number Input Boxes */}
      <div className="grid grid-cols-11 items-center gap-2">
        <div className="col-span-5 p-2 rounded-lg border border-border/80 bg-muted/20 text-center year-picker-card">
          <label
            htmlFor="start-year-input"
            className="text-[10px] uppercase text-muted-foreground font-semibold block mb-1"
          >
            Start Year
          </label>
          <Input
            id="start-year-input"
            type="number"
            min={MIN_ALLOWED_YEAR}
            max={MAX_ALLOWED_YEAR - 1}
            value={startInput}
            onChange={(e) => setStartInput(e.target.value)}
            onBlur={handleStartBlur}
            onKeyDown={handleKeyDown}
            className="h-8 text-center font-mono font-bold text-base bg-background/60 border-border/60"
          />
        </div>

        <div className="col-span-1 flex items-center justify-center text-muted-foreground">
          <ChevronRight className="w-4 h-4" />
        </div>

        <div className="col-span-5 p-2 rounded-lg border border-border/80 bg-muted/20 text-center year-picker-card">
          <label
            htmlFor="end-year-input"
            className="text-[10px] uppercase text-muted-foreground font-semibold block mb-1"
          >
            End Year
          </label>
          <Input
            id="end-year-input"
            type="number"
            min={MIN_ALLOWED_YEAR + 1}
            max={MAX_ALLOWED_YEAR}
            value={endInput}
            onChange={(e) => setEndInput(e.target.value)}
            onBlur={handleEndBlur}
            onKeyDown={handleKeyDown}
            className="h-8 text-center font-mono font-bold text-base bg-background/60 border-border/60"
          />
        </div>
      </div>

      {/* Validation Alert */}
      {validationError && (
        <div className="p-2.5 rounded-md border border-rose-500/30 bg-rose-500/10 text-[11px] text-rose-300 flex items-center gap-2">
          <AlertCircle className="w-3.5 h-3.5 shrink-0 text-rose-400" />
          <span>{validationError}</span>
        </div>
      )}

      {/* Dual-Thumb Range Slider */}
      <div className="space-y-2 pt-1">
        <div className="flex items-center justify-between text-[11px] text-muted-foreground">
          <span className="font-mono">{MIN_ALLOWED_YEAR}</span>
          <span className="font-medium text-foreground flex items-center gap-1">
            <Clock className="w-3 h-3 text-primary" />
            <span className="font-bold font-mono text-primary">{totalYears}</span> Years Selected
          </span>
          <span className="font-mono">{MAX_ALLOWED_YEAR}</span>
        </div>

        <Slider
          min={MIN_ALLOWED_YEAR}
          max={MAX_ALLOWED_YEAR}
          step={1}
          value={[yearRange.start, yearRange.end]}
          onValueChange={handleSliderChange}
          className="py-1 cursor-pointer"
        />
      </div>

      {/* Quick Decade Presets */}
      <div className="space-y-1.5 pt-1">
        <p className="text-[11px] font-medium text-muted-foreground">Standard Climatology Presets:</p>
        <div className="grid grid-cols-2 gap-1.5">
          {DECADE_PRESETS.map((preset) => {
            const isSelected =
              yearRange.start === preset.start && yearRange.end === preset.end
            return (
              <button
                key={preset.label}
                type="button"
                onClick={() => {
                  setStartInput(String(preset.start))
                  setEndInput(String(preset.end))
                  setValidationError(null)
                  onChange({ start: preset.start, end: preset.end })
                }}
                className={`text-left p-2 rounded-md border text-xs transition-all ${
                  isSelected
                    ? 'bg-primary/20 border-primary text-primary font-medium shadow-sm'
                    : 'border-border/60 bg-muted/30 hover:bg-muted text-muted-foreground hover:text-foreground'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono font-bold">{preset.label}</span>
                </div>
                <p className="text-[10px] text-muted-foreground mt-0.5 truncate">{preset.tag}</p>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
