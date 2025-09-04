# 🗑️ Gmail Delete Email Tool

Move a Gmail message to trash.

## Parameters
- `messageId` (string, required): Gmail message ID to delete

## Example Usage
```json
{
  "messageId": "186c9e0d7e8f4a32"
}
```

## Example Output
```json
{
  "success": true,
  "messageId": "186c9e0d7e8f4a32",
  "action": "moved to trash"
}
```

## Requirements
- Google OAuth2 must be configured
- Gmail modify scope required
- Valid message ID from Gmail

## Notes
- Moves message to Trash folder (not permanently deleted)
- Message can be restored from Trash in Gmail
- Use message ID from gmail-get-emails tool
- Irreversible via API (must restore manually in Gmail)