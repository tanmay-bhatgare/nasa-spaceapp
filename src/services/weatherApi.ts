/**
 * Weather API Service using Open-Meteo API
 * https://open-meteo.com/
 */

export interface WeatherHistoricalParams {
  latitude: number
  longitude: number
  startDate: string // Format: YYYY-MM-DD
  endDate: string // Format: YYYY-MM-DD
  variables?: string[] // Weather variables to fetch
}

export interface WeatherDataPoint {
  date: string
  temperature_2m_max?: number
  temperature_2m_min?: number
  temperature_2m_mean?: number
  precipitation_sum?: number
  rain_sum?: number
  snowfall_sum?: number
  precipitation_hours?: number
  windspeed_10m_max?: number
  windgusts_10m_max?: number
  winddirection_10m_dominant?: number
  shortwave_radiation_sum?: number
  et0_fao_evapotranspiration?: number
}

export interface WeatherHistoricalResponse {
  latitude: number
  longitude: number
  elevation: number
  timezone: string
  timezone_abbreviation: string
  daily: {
    time: string[]
    temperature_2m_max?: number[]
    temperature_2m_min?: number[]
    temperature_2m_mean?: number[]
    precipitation_sum?: number[]
    rain_sum?: number[]
    snowfall_sum?: number[]
    precipitation_hours?: number[]
    windspeed_10m_max?: number[]
    windgusts_10m_max?: number[]
    winddirection_10m_dominant?: number[]
    shortwave_radiation_sum?: number[]
    et0_fao_evapotranspiration?: number[]
  }
  daily_units: Record<string, string>
}

export interface WeatherProbabilityData {
  month: string
  probability: number
  avgTemperature?: number
  avgPrecipitation?: number
  avgWindSpeed?: number
}

export interface WeatherForecastResponse {
  latitude: number
  longitude: number
  elevation: number
  timezone: string
  timezone_abbreviation: string
  daily: {
    time: string[]
    temperature_2m_max?: number[]
    temperature_2m_min?: number[]
    precipitation_sum?: number[]
    rain_sum?: number[]
    snowfall_sum?: number[]
    precipitation_probability_max?: number[]
    windspeed_10m_max?: number[]
    windgusts_10m_max?: number[]
    winddirection_10m_dominant?: number[]
  }
  daily_units: Record<string, string>
}

export interface CombinedWeatherData {
  historical: WeatherHistoricalResponse
  forecast: WeatherForecastResponse | null
  combinedMonthlyData: WeatherProbabilityData[]
  overallProbability: number
}

// Open-Meteo API base URLs
const HISTORICAL_API_URL = 'https://archive-api.open-meteo.com/v1/archive'
const FORECAST_API_URL = 'https://api.open-meteo.com/v1/forecast'

/**
 * Map user-friendly variable names to Open-Meteo API parameters
 */
const variableMapping: Record<string, string> = {
  temperature: 'temperature_2m_max,temperature_2m_min,temperature_2m_mean',
  precipitation: 'precipitation_sum,rain_sum,snowfall_sum,precipitation_hours',
  wind: 'windspeed_10m_max,windgusts_10m_max,winddirection_10m_dominant',
  'air quality': 'shortwave_radiation_sum',
  humidity: 'precipitation_hours',
  'cloud cover': 'shortwave_radiation_sum',
  visibility: 'shortwave_radiation_sum'
}

const forecastVariableMapping: Record<string, string> = {
  temperature: 'temperature_2m_max,temperature_2m_min',
  precipitation: 'precipitation_sum,rain_sum,snowfall_sum,precipitation_probability_max',
  wind: 'windspeed_10m_max,windgusts_10m_max,winddirection_10m_dominant',
  'air quality': 'uv_index_max',
  humidity: 'precipitation_probability_max',
  'cloud cover': 'precipitation_probability_max',
  visibility: 'precipitation_probability_max'
}

/**
 * Fetch historical weather data from Open-Meteo API
 */
export async function fetchHistoricalWeatherData(
  params: WeatherHistoricalParams
): Promise<WeatherHistoricalResponse> {
  const { latitude, longitude, startDate, endDate, variables = [] } = params

  // Map selected variables to API parameters
  const dailyParams = variables.length > 0
    ? variables.map(v => variableMapping[v.toLowerCase()] || '').filter(Boolean).join(',')
    : 'temperature_2m_max,temperature_2m_min,precipitation_sum,windspeed_10m_max'

  const url = new URL(HISTORICAL_API_URL)
  url.searchParams.append('latitude', latitude.toString())
  url.searchParams.append('longitude', longitude.toString())
  url.searchParams.append('start_date', startDate)
  url.searchParams.append('end_date', endDate)
  url.searchParams.append('daily', dailyParams)
  url.searchParams.append('timezone', 'auto')

  console.log(`🌍 Historical API URL: ${url.toString()}`)

  try {
    const response = await fetch(url.toString())
    
    if (!response.ok) {
      const errorText = await response.text()
      console.error(`❌ Historical API error: ${response.status} ${response.statusText}`)
      console.error(`Response: ${errorText}`)
      throw new Error(`Weather API error: ${response.status} ${response.statusText}`)
    }

    const data: WeatherHistoricalResponse = await response.json()
    console.log(`✅ Historical API success: ${data.daily?.time?.length || 0} days received`)
    return data
  } catch (error) {
    console.error('❌ Error fetching historical weather data:', error)
    throw error
  }
}

/**
 * Fetch future weather forecast from Open-Meteo API
 * Returns 16-day forecast data
 */
export async function fetchWeatherForecast(
  latitude: number,
  longitude: number,
  variables: string[] = []
): Promise<WeatherForecastResponse> {
  // Map selected variables to API parameters
  const dailyParams = variables.length > 0
    ? variables.map(v => forecastVariableMapping[v.toLowerCase()] || '').filter(Boolean).join(',')
    : 'temperature_2m_max,temperature_2m_min,precipitation_sum,precipitation_probability_max,windspeed_10m_max'

  const url = new URL(FORECAST_API_URL)
  url.searchParams.append('latitude', latitude.toString())
  url.searchParams.append('longitude', longitude.toString())
  url.searchParams.append('daily', dailyParams)
  url.searchParams.append('timezone', 'auto')
  url.searchParams.append('forecast_days', '16') // Get 16 days of forecast

  console.log(`🔮 Forecast API URL: ${url.toString()}`)

  try {
    const response = await fetch(url.toString())
    
    if (!response.ok) {
      const errorText = await response.text()
      console.error(`❌ Forecast API error: ${response.status} ${response.statusText}`)
      console.error(`Response: ${errorText}`)
      throw new Error(`Forecast API error: ${response.status} ${response.statusText}`)
    }

    const data: WeatherForecastResponse = await response.json()
    console.log(`✅ Forecast API success: ${data.daily?.time?.length || 0} days received`)
    return data
  } catch (error) {
    console.error('❌ Error fetching weather forecast:', error)
    throw error
  }
}

/**
 * Calculate weather probability based on historical data
 * Analyzes past years for the same time period to determine likelihood of adverse conditions
 */
export function calculateWeatherProbability(
  weatherData: WeatherHistoricalResponse,
  selectedDate: Date,
  variables: string[]
): { probability: number; monthlyData: WeatherProbabilityData[] } {
  const { daily } = weatherData

  if (!daily || !daily.time || daily.time.length === 0) {
    console.warn('⚠️ No daily data available in weather response')
    return {
      probability: 50,
      monthlyData: generateDefaultMonthlyData()
    }
  }

  console.log(`📈 Processing ${daily.time.length} days of historical data`)

  // Group data by month
  const monthlyStats: Record<string, {
    temperatures: number[]
    precipitation: number[]
    windSpeeds: number[]
  }> = {}

  daily.time.forEach((date, index) => {
    const dateObj = new Date(date)
    const monthKey = dateObj.toLocaleString('default', { month: 'short' })

    if (!monthlyStats[monthKey]) {
      monthlyStats[monthKey] = {
        temperatures: [],
        precipitation: [],
        windSpeeds: []
      }
    }

    if (daily.temperature_2m_max?.[index] !== undefined) {
      monthlyStats[monthKey].temperatures.push(daily.temperature_2m_max[index])
    }
    if (daily.precipitation_sum?.[index] !== undefined) {
      monthlyStats[monthKey].precipitation.push(daily.precipitation_sum[index])
    }
    if (daily.windspeed_10m_max?.[index] !== undefined) {
      monthlyStats[monthKey].windSpeeds.push(daily.windspeed_10m_max[index])
    }
  })

  console.log(`📊 Monthly stats collected for: ${Object.keys(monthlyStats).join(', ')}`)

  // Calculate probability for each month
  const monthlyData: WeatherProbabilityData[] = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
  ].map(month => {
    const stats = monthlyStats[month]
    
    if (!stats) {
      return {
        month,
        probability: 50,
        avgTemperature: 0,
        avgPrecipitation: 0,
        avgWindSpeed: 0
      }
    }

    console.log(`📅 ${month}: ${stats.temperatures.length} temp readings, ${stats.precipitation.length} precip readings, ${stats.windSpeeds.length} wind readings`)

    // Calculate averages
    const avgTemp = stats.temperatures.length > 0
      ? stats.temperatures.reduce((a, b) => a + b, 0) / stats.temperatures.length
      : 0

    const avgPrecip = stats.precipitation.length > 0
      ? stats.precipitation.reduce((a, b) => a + b, 0) / stats.precipitation.length
      : 0

    const avgWind = stats.windSpeeds.length > 0
      ? stats.windSpeeds.reduce((a, b) => a + b, 0) / stats.windSpeeds.length
      : 0

    // Calculate adverse weather probability based on thresholds
    let adverseCount = 0
    let totalCount = 0

    // Use the maximum length across all data arrays to ensure we check all days
    const maxLength = Math.max(
      stats.temperatures.length,
      stats.precipitation.length,
      stats.windSpeeds.length
    )

    for (let i = 0; i < maxLength; i++) {
      const temp = stats.temperatures[i]
      const precip = stats.precipitation[i]
      const wind = stats.windSpeeds[i]

      // Only count days where we have at least some data
      if (temp !== undefined || precip !== undefined || wind !== undefined) {
        totalCount++
        
        // Count as adverse if:
        // - High precipitation (>5mm for rain, >10mm for heavy rain)
        // - Extreme temperatures (<5°C or >32°C for outdoor activities)
        // - High wind speeds (>25 km/h)
        let isAdverse = false
        
        if (precip !== undefined && precip > 5) isAdverse = true
        if (temp !== undefined && (temp < 5 || temp > 32)) isAdverse = true
        if (wind !== undefined && wind > 25) isAdverse = true
        
        if (isAdverse) {
          adverseCount++
        }
      }
    }

    const probability = totalCount > 0 ? Math.round((adverseCount / totalCount) * 100) : 50
    const clampedProbability = Math.min(Math.max(probability, 5), 95)

    console.log(`   ${month}: ${adverseCount}/${totalCount} adverse days = ${clampedProbability}% probability`)

    return {
      month,
      probability: clampedProbability, // Clamp between 5-95%
      avgTemperature: Math.round(avgTemp * 10) / 10,
      avgPrecipitation: Math.round(avgPrecip * 10) / 10,
      avgWindSpeed: Math.round(avgWind * 10) / 10
    }
  })

  // Get probability for selected month
  const selectedMonth = selectedDate.toLocaleString('default', { month: 'short' })
  const selectedMonthData = monthlyData.find(d => d.month === selectedMonth)
  const probability = selectedMonthData?.probability || 50

  console.log(`🎯 Final probability for ${selectedMonth}: ${probability}%`)

  return {
    probability,
    monthlyData
  }
}

/**
 * Generate default monthly data when no historical data is available
 */
function generateDefaultMonthlyData(): WeatherProbabilityData[] {
  return [
    { month: 'Jan', probability: 45, avgTemperature: 5, avgPrecipitation: 50, avgWindSpeed: 15 },
    { month: 'Feb', probability: 42, avgTemperature: 7, avgPrecipitation: 45, avgWindSpeed: 16 },
    { month: 'Mar', probability: 38, avgTemperature: 12, avgPrecipitation: 40, avgWindSpeed: 18 },
    { month: 'Apr', probability: 35, avgTemperature: 17, avgPrecipitation: 35, avgWindSpeed: 17 },
    { month: 'May', probability: 30, avgTemperature: 22, avgPrecipitation: 30, avgWindSpeed: 15 },
    { month: 'Jun', probability: 25, avgTemperature: 27, avgPrecipitation: 20, avgWindSpeed: 12 },
    { month: 'Jul', probability: 22, avgTemperature: 30, avgPrecipitation: 15, avgWindSpeed: 10 },
    { month: 'Aug', probability: 24, avgTemperature: 29, avgPrecipitation: 18, avgWindSpeed: 11 },
    { month: 'Sep', probability: 28, avgTemperature: 24, avgPrecipitation: 25, avgWindSpeed: 13 },
    { month: 'Oct', probability: 35, avgTemperature: 18, avgPrecipitation: 35, avgWindSpeed: 15 },
    { month: 'Nov', probability: 40, avgTemperature: 11, avgPrecipitation: 45, avgWindSpeed: 16 },
    { month: 'Dec', probability: 43, avgTemperature: 6, avgPrecipitation: 48, avgWindSpeed: 17 }
  ]
}

/**
 * Combine forecast data into monthly probability adjustments
 */
function integrateForecastData(
  monthlyData: WeatherProbabilityData[],
  forecastData: WeatherForecastResponse,
  selectedDate: Date
): WeatherProbabilityData[] {
  if (!forecastData.daily || !forecastData.daily.time) {
    return monthlyData
  }

  // Group forecast data by month
  const forecastByMonth: Record<string, {
    temperatures: number[]
    precipitation: number[]
    windSpeeds: number[]
    precipProb: number[]
  }> = {}

  forecastData.daily.time.forEach((date, index) => {
    const dateObj = new Date(date)
    const monthKey = dateObj.toLocaleString('default', { month: 'short' })

    if (!forecastByMonth[monthKey]) {
      forecastByMonth[monthKey] = {
        temperatures: [],
        precipitation: [],
        windSpeeds: [],
        precipProb: []
      }
    }

    if (forecastData.daily.temperature_2m_max?.[index] !== undefined) {
      forecastByMonth[monthKey].temperatures.push(forecastData.daily.temperature_2m_max[index])
    }
    if (forecastData.daily.precipitation_sum?.[index] !== undefined) {
      forecastByMonth[monthKey].precipitation.push(forecastData.daily.precipitation_sum[index])
    }
    if (forecastData.daily.windspeed_10m_max?.[index] !== undefined) {
      forecastByMonth[monthKey].windSpeeds.push(forecastData.daily.windspeed_10m_max[index])
    }
    if (forecastData.daily.precipitation_probability_max?.[index] !== undefined) {
      forecastByMonth[monthKey].precipProb.push(forecastData.daily.precipitation_probability_max[index])
    }
  })

  // Enhance monthly data with forecast
  return monthlyData.map(monthData => {
    const forecastMonth = forecastByMonth[monthData.month]
    
    if (!forecastMonth) {
      return monthData
    }

    // Calculate forecast-based adverse probability
    let adverseCount = 0
    let totalCount = 0

    // Use the maximum length to check all forecast days
    const maxLength = Math.max(
      forecastMonth.temperatures.length,
      forecastMonth.precipitation.length,
      forecastMonth.windSpeeds.length,
      forecastMonth.precipProb.length
    )

    for (let i = 0; i < maxLength; i++) {
      const temp = forecastMonth.temperatures[i]
      const precip = forecastMonth.precipitation[i]
      const wind = forecastMonth.windSpeeds[i]
      const precipProbability = forecastMonth.precipProb[i]

      // Only count days where we have data
      if (temp !== undefined || precip !== undefined || wind !== undefined || precipProbability !== undefined) {
        totalCount++
        
        let isAdverse = false
        
        // More sensitive thresholds for forecast (outdoor activity focused)
        if (precip !== undefined && precip > 5) isAdverse = true
        if (temp !== undefined && (temp < 5 || temp > 32)) isAdverse = true
        if (wind !== undefined && wind > 25) isAdverse = true
        if (precipProbability !== undefined && precipProbability > 60) isAdverse = true
        
        if (isAdverse) {
          adverseCount++
        }
      }
    }

    const forecastProbability = totalCount > 0 ? (adverseCount / totalCount) * 100 : 0

    // Blend historical (70%) and forecast (30%) probabilities
    const blendedProbability = Math.round(
      (monthData.probability * 0.7) + (forecastProbability * 0.3)
    )

    return {
      ...monthData,
      probability: Math.min(Math.max(blendedProbability, 5), 95)
    }
  })
}

/**
 * Fetch weather data for a specific date range and calculate probabilities
 * Combines both historical and forecast data for comprehensive analysis
 */
export async function getWeatherProbabilityAnalysis(
  latitude: number,
  longitude: number,
  selectedDate: Date,
  variables: string[]
): Promise<{
  probability: number
  monthlyData: WeatherProbabilityData[]
  historicalData: WeatherHistoricalResponse
  forecastData: WeatherForecastResponse | null
  dataSource: 'combined' | 'historical' | 'default'
}> {
  // Fetch last 10 years of data for better analysis
  // Note: Archive API only has data up to 5-7 days ago, not today
  const today = new Date()
  const currentYear = today.getFullYear()
  const startYear = currentYear - 10
  
  // End date should be 7 days ago to ensure archive API has the data
  const archiveEndDate = new Date(today)
  archiveEndDate.setDate(archiveEndDate.getDate() - 7)
  
  // Fetch all 12 months for the past 10 years for comprehensive analysis
  const startDateStr = `${startYear}-01-01`
  const endDateStr = archiveEndDate.toISOString().split('T')[0]

  console.log(`🔍 Fetching weather data for coordinates: (${latitude}, ${longitude})`)
  console.log(`📅 Date range: ${startDateStr} to ${endDateStr}`)
  console.log(`📊 Variables: ${variables.join(', ') || 'default'}`)
  console.log(`⚠️  Using archive end date (7 days ago) to ensure data availability`)

  try {
    // Fetch both historical and forecast data in parallel
    const [historicalData, forecastData] = await Promise.allSettled([
      fetchHistoricalWeatherData({
        latitude,
        longitude,
        startDate: startDateStr,
        endDate: endDateStr,
        variables
      }),
      fetchWeatherForecast(latitude, longitude, variables)
    ])

    console.log(`📡 Historical API: ${historicalData.status}`)
    console.log(`📡 Forecast API: ${forecastData.status}`)

    const historical = historicalData.status === 'fulfilled' ? historicalData.value : null
    const forecast = forecastData.status === 'fulfilled' ? forecastData.value : null

    if (!historical) {
      console.error('❌ Historical data fetch failed - USING DEFAULT DATA')
      if (historicalData.status === 'rejected') {
        console.error('Error details:', historicalData.reason)
        console.error('This usually means:')
        console.error('  1. Network/CORS issue')
        console.error('  2. Invalid coordinates')
        console.error('  3. API rate limit reached')
        console.error('  4. Date range outside archive availability')
      }
      console.warn('⚠️  Returning hardcoded default data as fallback')
      return {
        probability: 50,
        monthlyData: generateDefaultMonthlyData(),
        historicalData: {
          latitude,
          longitude,
          elevation: 0,
          timezone: 'UTC',
          timezone_abbreviation: 'UTC',
          daily: { time: [] },
          daily_units: {}
        },
        forecastData: forecast,
        dataSource: 'default'
      }
    }

    const historicalDaysCount = historical.daily.time?.length || 0
    console.log(`✅ Historical data received: ${historicalDaysCount} days`)
    
    if (historicalDaysCount === 0) {
      console.error('❌ Historical data has 0 days - API returned empty dataset!')
      console.error('Response structure:', JSON.stringify(historical, null, 2).substring(0, 500))
      return {
        probability: 50,
        monthlyData: generateDefaultMonthlyData(),
        historicalData: historical,
        forecastData: forecast,
        dataSource: 'default'
      }
    }
    
    if (forecast) {
      console.log(`✅ Forecast data received: ${forecast.daily.time?.length || 0} days`)
    }

    // Calculate probability from historical data
    const { probability, monthlyData } = calculateWeatherProbability(
      historical,
      selectedDate,
      variables
    )

    console.log(`📊 Calculated probability for ${selectedDate.toLocaleString('default', { month: 'short' })}: ${probability}%`)

    // Integrate forecast data if available
    const enhancedMonthlyData = forecast 
      ? integrateForecastData(monthlyData, forecast, selectedDate)
      : monthlyData

    // Recalculate probability for selected month after enhancement
    const selectedMonthStr = selectedDate.toLocaleString('default', { month: 'short' })
    const selectedMonthData = enhancedMonthlyData.find(d => d.month === selectedMonthStr)
    const finalProbability = selectedMonthData?.probability || probability

    console.log(`🎉 SUCCESS! Returning real data:`)
    console.log(`   - Final probability: ${finalProbability}%`)
    console.log(`   - Data source: ${forecast ? 'combined' : 'historical'}`)
    console.log(`   - Monthly data points: ${enhancedMonthlyData.length}`)

    // Safety check - if we somehow still have 50%, warn about it
    if (finalProbability === 50 && probability === 50) {
      console.warn('⚠️  WARNING: Probability is exactly 50% - this might be a calculation issue!')
    }

    return {
      probability: finalProbability,
      monthlyData: enhancedMonthlyData,
      historicalData: historical,
      forecastData: forecast,
      dataSource: forecast ? 'combined' : 'historical'
    }
  } catch (error) {
    console.error('❌ CRITICAL ERROR in weather probability analysis:', error)
    console.error('Stack trace:', error instanceof Error ? error.stack : 'No stack trace')
    // Return default data if API fails
    return {
      probability: 50,
      monthlyData: generateDefaultMonthlyData(),
      historicalData: {
        latitude,
        longitude,
        elevation: 0,
        timezone: 'UTC',
        timezone_abbreviation: 'UTC',
        daily: { time: [] },
        daily_units: {}
      },
      forecastData: null,
      dataSource: 'default'
    }
  }
}
