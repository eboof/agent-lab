Awesome 👍 — here’s the Yahoo Finance Tool Guide ready to drop into your repo at:

/docs/tools/yahoo-finance.md


⸻

📘 Yahoo Finance Tool Guide

Tool ID: yahoo-finance
Name: Yahoo Finance API
Description: Fetch stock quotes and chart data from Yahoo Finance.

⸻

🔧 Input Parameters

Name	Type	Required	Description
symbol	string	✅ Yes	Ticker symbol (e.g. AAPL, TSLA, VAS.AX).
module	string	❌ No	Type of data to fetch. Options: quote (default) or chart.
range	string	❌ No	For chart: time range (e.g. 1d, 5d, 1y). Default = 5d.
interval	string	❌ No	For chart: interval between points (e.g. 1m, 1d, 1wk). Default = 1d.


⸻

📤 Output Schema

Quote Mode (module = quote)

{
  "symbol": "TSLA",
  "shortName": "Tesla, Inc.",
  "currency": "USD",
  "price": 211.42,
  "change": -2.34,
  "percentChange": -1.10,
  "marketTime": "2025-08-29T20:00:00Z",
  "exchange": "NasdaqGS"
}

Chart Mode (module = chart)

{
  "symbol": "TSLA",
  "range": "5d",
  "interval": "1d",
  "timestamps": [1693507200, 1693593600, ...],
  "closes": [210.23, 213.50, ...]
}


⸻

🧪 Example Usages

1. Get Current Quote

Input:

{ "symbol": "TSLA", "module": "quote" }

Output:

{
  "symbol": "TSLA",
  "shortName": "Tesla, Inc.",
  "currency": "USD",
  "price": 211.42,
  "change": -2.34,
  "percentChange": -1.10,
  "marketTime": "2025-08-29T20:00:00Z",
  "exchange": "NasdaqGS"
}


⸻

2. Get 5-Day Chart

Input:

{ "symbol": "TSLA", "module": "chart", "range": "5d", "interval": "1d" }

Output (simplified):

{
  "symbol": "TSLA",
  "range": "5d",
  "interval": "1d",
  "timestamps": [1693507200, 1693593600],
  "closes": [210.23, 213.50]
}


⸻

⚠️ Error Cases
	•	Missing required param:

{ "error": "Missing required param: symbol" }

	•	Unsupported module:

{ "error": "Unsupported module: fundamentals" }

	•	API failure (network, invalid symbol, etc.):

{ "error": "Yahoo Finance API error: ..." }


⸻

✅ Place this guide in docs/tools/yahoo-finance.md.
Now Claude (or anyone editing tools) can quickly check what params to enter, what output to expect, and how to debug errors.

