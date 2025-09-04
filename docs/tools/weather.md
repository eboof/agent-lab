# 🌤️ Weather Tool (Open-Meteo)

## Overview
Fetches current weather data from the free [Open-Meteo API](https://open-meteo.com).  
Lightweight, no API key required.

## Parameters
- **latitude** *(number, required)*  
  Latitude of the location (e.g., `-27.47` for Brisbane).

- **longitude** *(number, required)*  
  Longitude of the location (e.g., `153.03` for Brisbane).

## Example Usage
```json
{
  "latitude": -27.47,
  "longitude": 153.03
}
```

## Output

Example response:
```json
{
  "temperature": 25.3,
  "windspeed": 14.5,
  "winddirection": 120,
  "weathercode": 2,
  "time": "2025-09-02T14:00"
}
```

## Notes
- Data is near real-time and reliable for global locations.
- Extendable for forecasts with additional query parameters.