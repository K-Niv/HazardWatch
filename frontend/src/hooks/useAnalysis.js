import { useState, useEffect, useCallback } from 'react'
import { fetchAnalysis } from '@/services/api'

/**
 * Custom React hook for HazardWatch data lifecycle.
 * Manages initial data loading, explicit analysis triggers, and dataset state.
 *
 * @param {Object} initialParams
 * @param {number} initialParams.lat
 * @param {number} initialParams.lon
 * @param {number} initialParams.startYear
 * @param {number} initialParams.endYear
 * @param {'heatwave' | 'rainfall'} initialParams.hazard
 * @param {boolean} [initialParams.autoFetchOnMount=true]
 */
export function useAnalysis({
  lat,
  lon,
  startYear,
  endYear,
  hazard,
  autoFetchOnMount = true,
}) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [lastAnalyzedParams, setLastAnalyzedParams] = useState(null)

  // 1. Analysis execute function triggered by user action (e.g. "Analyze Climate Hazards" button)
  const executeAnalysis = useCallback(
    async (overrideParams = {}) => {
      const activeLat = overrideParams.lat ?? lat
      const activeLon = overrideParams.lon ?? lon
      const activeStart = overrideParams.startYear ?? startYear
      const activeEnd = overrideParams.endYear ?? endYear
      const activeHazard = overrideParams.hazard ?? hazard

      if (activeStart >= activeEnd) {
        setError('Start year must be strictly earlier than end year.')
        return null
      }

      setLoading(true)
      setError(null)

      try {
        const result = await fetchAnalysis({
          lat: activeLat,
          lon: activeLon,
          startYear: activeStart,
          endYear: activeEnd,
          hazard: activeHazard,
        })

        setData(result)
        setLastAnalyzedParams({
          lat: activeLat,
          lon: activeLon,
          startYear: activeStart,
          endYear: activeEnd,
          hazard: activeHazard,
        })
        return result
      } catch (err) {
        const errMsg = err.message || 'An unexpected error occurred during analysis.'
        setError(errMsg)
        return null
      } finally {
        setLoading(false)
      }
    },
    [lat, lon, startYear, endYear, hazard]
  )

  // 2. Initial data fetch on mount only (runs strictly once when app loads)
  useEffect(() => {
    if (!autoFetchOnMount || lat == null || lon == null) return

    let isSubscribed = true
    setLoading(true)
    setError(null)

    fetchAnalysis({
      lat,
      lon,
      startYear,
      endYear,
      hazard,
    })
      .then((result) => {
        if (isSubscribed) {
          setData(result)
          setLastAnalyzedParams({
            lat,
            lon,
            startYear,
            endYear,
            hazard,
          })
        }
      })
      .catch((err) => {
        if (isSubscribed) {
          setError(err.message || 'An unexpected error occurred during analysis.')
        }
      })
      .finally(() => {
        if (isSubscribed) {
          setLoading(false)
        }
      })

    return () => {
      isSubscribed = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return {
    data,
    loading,
    error,
    lastAnalyzedParams,
    analyze: executeAnalysis,
  }
}
