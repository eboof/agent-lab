# 📥 Gmail Get Emails Tool

Fetches the latest N emails from your Gmail inbox.

## Parameters
- `count` (number, optional): Number of emails to fetch. Default = 5. Limit = 50.

## Example
```json
{
  "count": 10
}
```

## Output
```json
{
  "emails": [
    {
      "id": "186c9e0d7e8f4a32",
      "from": "GitHub <noreply@github.com>",
      "subject": "[eboof/agent-lab] New issue created",
      "snippet": "You have a new issue..."
    }
  ]
}
```

## Requirements
- Google OAuth2 must be configured (`.env` with `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_REDIRECT_URI`)
- Run `/api/google/auth` once to generate `server/secrets/google-token.json`

## Notes
- Only reads emails (Gmail readonly scope)
- Returns email snippet (first ~150 characters)
- Requires active OAuth token refresh

✅ Once OAuth2 is working, this tool should **list your latest Gmail messages** inside the Playground or via API.