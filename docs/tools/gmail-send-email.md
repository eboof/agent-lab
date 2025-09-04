# ✉️ Gmail Send Email Tool

Send an email via Gmail API.

## Parameters
- `to` (string, required): Recipient email address
- `subject` (string, required): Email subject line
- `body` (string, optional): Plain text email body
- `html` (string, optional): HTML email body (alternative to plain text)

## Example Usage

### Plain Text Email
```json
{
  "to": "recipient@example.com",
  "subject": "Hello from Agent-Lab",
  "body": "This is a plain text email sent via Gmail API."
}
```

### HTML Email
```json
{
  "to": "recipient@example.com",
  "subject": "Rich Email",
  "html": "<h1>Hello!</h1><p>This is an <strong>HTML</strong> email.</p>"
}
```

### Multipart Email (both text and HTML)
```json
{
  "to": "recipient@example.com",
  "subject": "Multipart Email",
  "body": "This is the plain text version.",
  "html": "<p>This is the <em>HTML</em> version.</p>"
}
```

## Example Output
```json
{
  "success": true,
  "id": "186c9e0d7e8f4a32",
  "to": "recipient@example.com",
  "subject": "Hello from Agent-Lab",
  "threadId": "186c9e0d7e8f4a32"
}
```

## Requirements
- Google OAuth2 must be configured
- Gmail send scope required
- Must provide either `body` or `html` content

## Notes
- Emails sent from your authenticated Gmail account
- Supports both plain text and HTML formats
- Can send multipart emails with both text and HTML versions
- Returns Gmail message ID for tracking