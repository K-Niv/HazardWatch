import React, { useState, useEffect, useRef } from 'react'
import { Search, MapPin, Loader2, X, Globe, Navigation } from 'lucide-react'
import { Input } from '@/components/ui/input'
import './CitySearch.css'

const PRESET_CITIES = [
  { name: 'New Delhi', country: 'India', admin1: 'Delhi', lat: 28.6139, lon: 77.2090 },
  { name: 'Phoenix', country: 'United States', admin1: 'Arizona', lat: 33.4484, lon: -112.0740 },
  { name: 'London', country: 'United Kingdom', admin1: 'England', lat: 51.5074, lon: -0.1278 },
  { name: 'Tokyo', country: 'Japan', admin1: 'Tokyo', lat: 35.6762, lon: 139.6503 },
]

export default function CitySearch({ selectedCity, onSelect }) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [isOpen, setIsOpen] = useState(false)
  const [highlightedIndex, setHighlightedIndex] = useState(-1)
  const [errorMessage, setErrorMessage] = useState(null)

  const containerRef = useRef(null)
  const inputRef = useRef(null)

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleInputChange = (e) => {
    const val = e.target.value
    setQuery(val)
    if (val.trim().length < 2) {
      setResults([])
      setIsLoading(false)
      setErrorMessage(null)
      setIsOpen(false)
    } else {
      setIsOpen(true)
    }
  }

  // Debounced search via Open-Meteo Geocoding API
  useEffect(() => {
    const trimmed = query.trim()
    if (trimmed.length < 2) {
      return
    }

    const abortController = new AbortController()

    const timer = setTimeout(async () => {
      setIsLoading(true)
      setErrorMessage(null)
      try {
        const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(
          trimmed
        )}&count=6&language=en&format=json`

        const response = await fetch(url, { signal: abortController.signal })
        if (!response.ok) {
          throw new Error('Geocoding service unavailable')
        }

        const data = await response.json()
        const rawResults = data.results || []

        const parsed = rawResults.map((item) => ({
          id: item.id,
          name: item.name,
          country: item.country || '',
          countryCode: item.country_code || '',
          admin1: item.admin1 || '',
          lat: item.latitude,
          lon: item.longitude,
          population: item.population || null,
        }))

        setResults(parsed)
        setIsOpen(true)
        setHighlightedIndex(-1)
      } catch (err) {
        if (err.name !== 'AbortError') {
          setErrorMessage('Unable to fetch locations. Please try again.')
          setResults([])
        }
      } finally {
        setIsLoading(false)
      }
    }, 300)

    return () => {
      clearTimeout(timer)
      abortController.abort()
    }
  }, [query])

  const handleSelectCity = (city) => {
    onSelect({
      name: city.name,
      country: city.country,
      admin1: city.admin1,
      lat: city.lat,
      lon: city.lon,
    })
    setQuery('')
    setIsOpen(false)
    setResults([])
    setHighlightedIndex(-1)
  }

  const handleKeyDown = (e) => {
    if (!isOpen || results.length === 0) {
      if (e.key === 'ArrowDown' && results.length > 0) {
        setIsOpen(true)
      }
      return
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setHighlightedIndex((prev) => (prev < results.length - 1 ? prev + 1 : 0))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : results.length - 1))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      if (highlightedIndex >= 0 && highlightedIndex < results.length) {
        handleSelectCity(results[highlightedIndex])
      }
    } else if (e.key === 'Escape') {
      setIsOpen(false)
      setHighlightedIndex(-1)
    }
  }

  const handleClear = () => {
    setQuery('')
    setResults([])
    setIsOpen(false)
    inputRef.current?.focus()
  }

  return (
    <div ref={containerRef} className="space-y-3 relative">
      {/* Search Bar Input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
        <Input
          ref={inputRef}
          type="text"
          id="city-search-input"
          placeholder="Search global city or coordinates..."
          value={query}
          onChange={handleInputChange}
          onFocus={() => {
            if (results.length > 0) setIsOpen(true)
          }}
          onKeyDown={handleKeyDown}
          className="pl-9 pr-9 h-10 bg-muted/40 border-border/80 focus-visible:ring-primary text-sm"
          autoComplete="off"
        />
        {isLoading ? (
          <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground animate-spin" />
        ) : query ? (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors p-0.5"
            title="Clear search"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        ) : null}
      </div>

      {/* Autocomplete Dropdown */}
      {isOpen && (
        <div
          id="city-search-results"
          className="city-search-dropdown absolute z-50 left-0 right-0 top-[44px] mt-1 rounded-lg border border-border/80 bg-popover/95 text-popover-foreground shadow-2xl backdrop-blur-md overflow-hidden"
        >
          {errorMessage && (
            <div className="p-3 text-xs text-rose-400 bg-rose-500/10 border-b border-rose-500/20">
              {errorMessage}
            </div>
          )}

          {results.length > 0 ? (
            <ul className="max-h-60 overflow-y-auto divide-y divide-border/40 py-1" role="listbox">
              {results.map((city, idx) => {
                const isHighlighted = idx === highlightedIndex
                return (
                  <li
                    key={`${city.id}-${idx}`}
                    role="option"
                    aria-selected={isHighlighted}
                    onMouseEnter={() => setHighlightedIndex(idx)}
                    onClick={() => handleSelectCity(city)}
                    className={`px-3 py-2.5 cursor-pointer text-xs flex items-center justify-between transition-colors ${
                      isHighlighted ? 'bg-primary/15 text-foreground' : 'hover:bg-muted/50 text-muted-foreground'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0 pr-2">
                      <div className="w-6 h-6 rounded-md bg-muted/60 flex items-center justify-center shrink-0 text-primary">
                        <MapPin className="w-3.5 h-3.5" />
                      </div>
                      <div className="truncate">
                        <p className="font-semibold text-foreground text-xs truncate">
                          {city.name}
                          {city.admin1 ? (
                            <span className="font-normal text-muted-foreground text-[11px] ml-1.5">
                              {city.admin1}
                            </span>
                          ) : null}
                        </p>
                        <p className="text-[11px] text-muted-foreground truncate flex items-center gap-1.5">
                          <span>{city.country}</span>
                          <span className="opacity-40">•</span>
                          <span className="font-mono text-[10px]">
                            {city.lat.toFixed(2)}°, {city.lon.toFixed(2)}°
                          </span>
                        </p>
                      </div>
                    </div>

                    {city.countryCode && (
                      <span className="text-[10px] font-mono text-muted-foreground uppercase px-1.5 py-0.5 rounded border border-border/80 shrink-0">
                        {city.countryCode}
                      </span>
                    )}
                  </li>
                )
              })}
            </ul>
          ) : query.trim().length >= 2 && !isLoading ? (
            <div className="p-4 text-center text-xs text-muted-foreground">
              <Globe className="w-6 h-6 mx-auto mb-1 text-muted-foreground/60" />
              <span>No cities found matching &quot;{query}&quot;</span>
            </div>
          ) : null}
        </div>
      )}

      {/* Selected Location Pill */}
      {selectedCity && (
        <div className="p-2.5 rounded-lg border border-primary/30 bg-primary/10 flex items-center justify-between">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-7 h-7 rounded-md bg-primary/20 text-primary flex items-center justify-center shrink-0">
              <Navigation className="w-3.5 h-3.5" />
            </div>
            <div className="truncate">
              <p className="text-xs font-semibold text-foreground truncate">
                {selectedCity.name}
                {selectedCity.country ? `, ${selectedCity.country}` : ''}
              </p>
              <p className="text-[10px] font-mono text-muted-foreground">
                {selectedCity.lat.toFixed(4)}° N, {selectedCity.lon.toFixed(4)}° E
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Quick Presets */}
      <div className="space-y-1.5 pt-1">
        <p className="text-[11px] font-medium text-muted-foreground">Quick Presets:</p>
        <div className="flex flex-wrap gap-1.5">
          {PRESET_CITIES.map((city) => {
            const isSelected =
              selectedCity?.name === city.name &&
              Math.abs(selectedCity.lat - city.lat) < 0.05
            return (
              <button
                key={city.name}
                type="button"
                onClick={() => handleSelectCity(city)}
                className={`text-xs px-2.5 py-1 rounded-md border transition-all ${
                  isSelected
                    ? 'bg-primary/20 border-primary text-primary font-medium shadow-sm'
                    : 'border-border/60 bg-muted/30 hover:bg-muted text-muted-foreground hover:text-foreground'
                }`}
              >
                {city.name}
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
