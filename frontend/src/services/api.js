/**
 * HazardWatch API Service Layer
 * Interfaces with FastAPI backend for hazard analysis, AI executive summaries, and health checks.
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'


/**
 * Fetches climate hazard trend analysis from the backend.
 * Pipeline: checks MongoDB cache -> fetches Open-Meteo -> runs data quality -> runs detection -> returns trends.
 *
 * @param {Object} params
 * @param {number} params.lat - Latitude (-90 to 90)
 * @param {number} params.lon - Longitude (-180 to 180)
 * @param {number} params.startYear - Starting year (1950 to 2025)
 * @param {number} params.endYear - Ending year (1950 to 2025)
 * @param {'heatwave' | 'rainfall'} [params.hazard='heatwave'] - Hazard type to analyze
 * @returns {Promise<Object>} AnalyzeResponse payload
 */
export async function fetchAnalysis({
  lat,
  lon,
  startYear = 1990,
  endYear = 2020,
  hazard = 'heatwave',
}) {
  const query = new URLSearchParams({
    lat: String(lat),
    lon: String(lon),
    start_year: String(startYear),
    end_year: String(endYear),
    hazard: String(hazard),
  })

  const url = `${API_BASE_URL}/api/analyze?${query.toString()}`

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
      },
    })

    const payload = await response.json()

    if (!response.ok) {
      const errorMsg =
        payload?.detail ||
        (Array.isArray(payload?.details) ? payload.details.join(', ') : null) ||
        `Backend returned error (${response.status}: ${response.statusText})`
      throw new Error(errorMsg)
    }

    return payload
  } catch (err) {
    if (err.name === 'TypeError' && err.message.includes('fetch')) {
      throw new Error(
        `Unable to connect to HazardWatch backend at ${API_BASE_URL}. Ensure the FastAPI server is running.`
      )
    }
    throw err
  }
}

/**
 * Requests an AI-generated executive summary from Google Gemini via backend.
 *
 * @param {Object} payload
 * @param {string} payload.hazard_type
 * @param {number} payload.start_year
 * @param {number} payload.end_year
 * @param {number} payload.total_events
 * @param {string} [payload.city_name]
 * @param {string[]} [payload.insights]
 * @param {Object} [payload.stats]
 * @returns {Promise<{ summary: string, source: string, is_ai_generated: boolean }>}
 */
export async function fetchAISummary(payload) {
  const url = `${API_BASE_URL}/api/ai-summary`

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify(payload),
    })

    const data = await response.json()

    if (!response.ok) {
      throw new Error(data?.detail || 'Failed to generate AI summary.')
    }

    return data
  } catch (err) {
    if (err.name === 'TypeError' && err.message.includes('fetch')) {
      throw new Error(
        `Cannot reach AI summary service at ${API_BASE_URL}. Backend server may be offline.`
      )
    }
    throw err
  }
}
