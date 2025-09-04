# 📈 Crypto Price Tool (CoinGecko)

## Overview
Fetches real-time cryptocurrency prices using the free CoinGecko API.  
Great for financial agents, trading bots, or dashboards.

## Parameters
- **coin** *(string, required)*  
  The cryptocurrency ID (e.g., `bitcoin`, `ethereum`, `dogecoin`).  
  Full list available: [CoinGecko API /coins/list](https://api.coingecko.com/api/v3/coins/list)

- **currency** *(string, optional, default=usd)*  
  The target currency (e.g., `usd`, `eur`, `aud`).

## Example Usage
```json
{
  "coin": "bitcoin",
  "currency": "usd"
}
```

## Output

Example response:
```json
{
  "bitcoin": {
    "usd": 63452
  }
}
```

## Notes
- The API is public and free, but has rate limits (~50 calls/min).
- Best for spot checks, portfolio summaries, and simple dashboards.