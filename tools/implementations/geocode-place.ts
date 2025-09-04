// geocode-place.ts
// Tool: Convert plain language place names into latitude/longitude
// Uses OpenStreetMap's Nominatim API (free, no key required)

import type { ToolDefinition } from "../tool-types.ts";
import fetch from "node-fetch";

export const GeocodePlaceTool: ToolDefinition = {
  id: "geocode-place",
  name: "🗺️ Geocode Place",
  description: "Convert place names (city, address, landmark) into latitude and longitude",
  params: [
    { name: "place", type: "string", required: true, description: "Place name or address (e.g., Brisbane, Eiffel Tower)" }
  ],

  async call({ place }) {
    if (!place) throw new Error("Missing required param: place");

    // Fallback coordinates for common cities (in case API is rate limited)
    const knownPlaces: Record<string, {latitude: number, longitude: number, display_name: string}> = {
      "brisbane": { latitude: -27.4689, longitude: 153.0234, display_name: "Brisbane, Queensland, Australia" },
      "sydney": { latitude: -33.8688, longitude: 151.2093, display_name: "Sydney, New South Wales, Australia" },
      "melbourne": { latitude: -37.8136, longitude: 144.9631, display_name: "Melbourne, Victoria, Australia" },
      "mexico city": { latitude: 19.4326, longitude: -99.1332, display_name: "Mexico City, Mexico" },
      "new york": { latitude: 40.7128, longitude: -74.0060, display_name: "New York City, NY, USA" },
      "london": { latitude: 51.5074, longitude: -0.1278, display_name: "London, England, UK" },
      "tokyo": { latitude: 35.6762, longitude: 139.6503, display_name: "Tokyo, Japan" },
      "paris": { latitude: 48.8566, longitude: 2.3522, display_name: "Paris, France" }
    };

    const placeKey = place.toLowerCase().trim();
    
    // Try fallback first
    if (knownPlaces[placeKey]) {
      const coords = knownPlaces[placeKey];
      return {
        place: coords.display_name,
        latitude: coords.latitude,
        longitude: coords.longitude,
        source: "fallback"
      };
    }

    // Try API if fallback doesn't have it
    try {
      const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(place)}&limit=1`;
      
      // Retry with backoff for transient 403/429 errors
      for (let attempt = 0; attempt < 3; attempt++) {
        const res = await fetch(url, {
          headers: { 
            "User-Agent": "Agent-Lab/1.0 (rob@jalwax.com)",
            "Accept": "application/json"
          }
        });

        if (res.ok) {
          const data = await res.json();
          if (!Array.isArray(data) || data.length === 0) {
            const suggestions = Object.keys(knownPlaces).slice(0, 5).join(", ");
            throw new Error(`No results found for "${place}". Try: ${suggestions}`);
          }

          const best = data[0];
          return {
            place: best.display_name,
            latitude: parseFloat(best.lat),
            longitude: parseFloat(best.lon),
            source: "nominatim"
          };
        }
        
        // Wait before retry (1s, 2s, 3s)
        if (attempt < 2) {
          await new Promise(r => setTimeout(r, 1000 * (attempt + 1)));
        }
      }

      // If all retries failed, suggest known places
      const suggestions = Object.keys(knownPlaces).slice(0, 5).join(", ");
      throw new Error(`Geocoding API unavailable after retries. Try: ${suggestions}`);
    } catch (err: any) {
      throw new Error(`GeocodePlaceTool error: ${err.message}`);
    }
  }
};