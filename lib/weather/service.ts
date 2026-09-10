export interface LocationWeather {
  temperature: number
  condition: string
  description: string
  precipitationMm: number
  windSpeedKmh: number
  humidity: number
  isMonsoonAlert: boolean
  isFoggy: boolean
  weatherRiskScore: number // 0 to 40 impact
  advisory: string
}

// Weather code translation for standard WMO / OpenWeather codes
function parseWeatherCode(code: number): { condition: string; description: string; isMonsoon: boolean; isFoggy: boolean } {
  if (code >= 200 && code <= 232) {
    return { condition: 'Thunderstorm', description: 'Severe monsoon thunderstorm & lightning', isMonsoon: true, isFoggy: false }
  }
  if (code >= 500 && code <= 531) {
    return { condition: 'Heavy Rain', description: 'Continuous monsoonal rainfall on mountain sector', isMonsoon: true, isFoggy: false }
  }
  if (code >= 600 && code <= 622) {
    return { condition: 'Snow / Sleet', description: 'High altitude snow & icy mountain road surface', isMonsoon: false, isFoggy: true }
  }
  if (code >= 700 && code <= 781) {
    return { condition: 'Dense Fog', description: 'Dense mountain fog reducing visibility below 30m', isMonsoon: false, isFoggy: true }
  }
  if (code === 800) {
    return { condition: 'Clear', description: 'Clear skies, dry road surfaces', isMonsoon: false, isFoggy: false }
  }
  return { condition: 'Overcast / Cloudy', description: 'Overcast skies with mild moisture', isMonsoon: false, isFoggy: false }
}

export async function fetchLiveWeather(lat: number, lng: number): Promise<LocationWeather> {
  const apiKey = process.env.NEXT_PUBLIC_OPENWEATHER_API_KEY || '6cca58c73a857a06601beba0fee275fd'

  // 1. Try OpenWeatherMap
  try {
    const owmUrl = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lng}&appid=${apiKey}&units=metric`
    const res = await fetch(owmUrl, { next: { revalidate: 300 } })
    if (res.ok) {
      const data = await res.json()
      const temp = Math.round(data.main?.temp ?? 24)
      const humidity = Math.round(data.main?.humidity ?? 65)
      const windKmh = Math.round((data.wind?.speed ?? 3) * 3.6)
      const rainMm = data.rain?.['1h'] ?? data.rain?.['3h'] ?? 0
      const weatherId = data.weather?.[0]?.id ?? 800
      const parsed = parseWeatherCode(weatherId)

      let riskScore = 5
      let advisory = 'Normal road conditions. Pavement dry.'

      if (parsed.isMonsoon || rainMm > 4) {
        riskScore = 28
        advisory = 'Active rainfall advisory: Slow down on hairpin turns, watch for surface runoff.'
      } else if (parsed.isFoggy) {
        riskScore = 22
        advisory = 'Fog advisory: Use low-beam fog lights, maintain safe stopping distance.'
      } else if (temp < 8) {
        riskScore = 18
        advisory = 'Cold mountain temperature: Potential morning frost on high elevation bridges.'
      }

      return {
        temperature: temp,
        condition: parsed.condition,
        description: data.weather?.[0]?.description || parsed.description,
        precipitationMm: Number(rainMm.toFixed(1)),
        windSpeedKmh: windKmh,
        humidity,
        isMonsoonAlert: parsed.isMonsoon || rainMm > 4,
        isFoggy: parsed.isFoggy,
        weatherRiskScore: riskScore,
        advisory,
      }
    }
  } catch (err) {
    console.warn('[WeatherService] OpenWeatherMap request failed, trying fallback:', err)
  }

  // 2. High-precision Open-Meteo fallback for real-time live data in Northeast India
  try {
    const meteoUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current=temperature_2m,relative_humidity_2m,precipitation,rain,weather_code,wind_speed_10m`
    const res = await fetch(meteoUrl, { next: { revalidate: 300 } })
    if (res.ok) {
      const data = await res.json()
      const current = data.current
      const temp = Math.round(current.temperature_2m ?? 23)
      const humidity = Math.round(current.relative_humidity_2m ?? 70)
      const windKmh = Math.round(current.wind_speed_10m ?? 8)
      const rainMm = current.precipitation ?? current.rain ?? 0
      const code = current.weather_code ?? 0

      const isRain = code >= 50 || rainMm > 1
      const isFog = code === 45 || code === 48
      const isThunder = code >= 95

      let condition = 'Partly Cloudy'
      let desc = 'Mild weather, good visibility across corridor.'
      let riskScore = 4
      let advisory = 'Optimal road conditions. No weather hazards detected.'

      if (isThunder || rainMm > 6) {
        condition = 'Thunderstorm / Heavy Rain'
        desc = 'High-intensity monsoon precipitation in sector.'
        riskScore = 30
        advisory = 'Heavy rain alert: High risk of localized mudslides on cut slopes.'
      } else if (isRain) {
        condition = 'Light to Moderate Rain'
        desc = 'Wet asphalt, reduced tire friction.'
        riskScore = 16
        advisory = 'Wet pavement: Reduce vehicle speed by 20% on mountain descents.'
      } else if (isFog) {
        condition = 'Mountain Fog'
        desc = 'Dense valley fog reducing visibility.'
        riskScore = 20
        advisory = 'Low visibility alert: Drive with caution through valley crossings.'
      }

      return {
        temperature: temp,
        condition,
        description: desc,
        precipitationMm: Number(rainMm.toFixed(1)),
        windSpeedKmh: windKmh,
        humidity,
        isMonsoonAlert: isRain || isThunder,
        isFoggy: isFog,
        weatherRiskScore: riskScore,
        advisory,
      }
    }
  } catch (err) {
    console.warn('[WeatherService] Open-Meteo fallback request failed:', err)
  }

  // 3. Sensible default if completely offline
  return {
    temperature: 24,
    condition: 'Partly Cloudy',
    description: 'Dry asphalt, good corridor visibility',
    precipitationMm: 0,
    windSpeedKmh: 10,
    humidity: 65,
    isMonsoonAlert: false,
    isFoggy: false,
    weatherRiskScore: 5,
    advisory: 'Standard highway conditions across Northeast sector.',
  }
}
