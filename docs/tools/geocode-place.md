# 🗺️ Geocode Place Tool

## Overview
Converts plain-language place names or addresses into latitude/longitude coordinates.  
Uses OpenStreetMap's free Nominatim API (no API key required).

## Parameters
- **place** *(string, required)*  
  The name or address of the location.  
  Examples: `"Brisbane"`, `"Eiffel Tower"`, `"1600 Amphitheatre Parkway, Mountain View"`

## Example Usage
```json
{
  "place": "Brisbane"
}
```

## Example Output
```json
{
  "place": "Brisbane City, Queensland, Australia",
  "latitude": -27.4689682,
  "longitude": 153.0234991
}
```

## Notes
- Returns the best match for the query.
- Latitude and longitude can be passed directly into the 🌤️ Weather Tool.
- Rate limited: ~1 request/second. For heavy use, consider caching.
- User-Agent header required by Nominatim — already set in this tool.

## Tool Chain Example
Perfect companion to the Weather Tool:
1. **Geocode Place**: `"Brisbane"` → lat/lng coordinates
2. **Weather**: Use those coordinates → current weather data

This enables natural language weather queries!