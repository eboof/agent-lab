# 🌐 API Caller Tool

## Overview
A generic tool for making GET or POST requests to any public API.  
Great for quick integrations and testing new endpoints without writing custom code.

## Parameters
- **url** *(string, required)*  
  Full API endpoint (e.g., `https://api.example.com/data`).

- **method** *(select: GET | POST, default=GET)*  
  HTTP method to use.

- **headers** *(string, JSON)*  
  Optional request headers, provided as a JSON object.  
  Example: `{"Authorization": "Bearer TOKEN"}`

- **body** *(string, JSON)*  
  Optional request body for POST requests.  
  Example: `{"symbol": "TSLA"}`

## Example Usage

### GET request
```json
{
  "url": "https://api.coindesk.com/v1/bpi/currentprice.json",
  "method": "GET"
}
```

### POST request
```json
{
  "url": "https://httpbin.org/post",
  "method": "POST",
  "headers": "{\"Content-Type\":\"application/json\"}",
  "body": "{\"hello\":\"world\"}"
}
```

## Output
- Returns parsed JSON if available.
- Falls back to `{ "raw": "<response text>" }` if response isn't JSON.

## Notes
- Best for lightweight, ad-hoc API calls.
- For production use, consider wrapping a dedicated tool for that API.