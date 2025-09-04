# 🏷️ Gmail Label Email Tool

Apply or remove labels from a Gmail message.

## Parameters
- `messageId` (string, required): Gmail message ID to modify
- `addLabels` (string, optional): Comma-separated labels to add (e.g., 'STARRED,IMPORTANT')
- `removeLabels` (string, optional): Comma-separated labels to remove (e.g., 'UNREAD,INBOX')

## Example Usage
```json
{
  "messageId": "186c9e0d7e8f4a32",
  "addLabels": "STARRED,IMPORTANT",
  "removeLabels": "UNREAD"
}
```

## Example Output
```json
{
  "success": true,
  "messageId": "186c9e0d7e8f4a32",
  "labelIds": ["STARRED", "IMPORTANT", "INBOX"],
  "addedLabels": ["STARRED", "IMPORTANT"],
  "removedLabels": ["UNREAD"]
}
```

## Requirements
- Google OAuth2 must be configured
- Gmail modify scope required
- Valid message ID from Gmail

## Common Labels
- `INBOX` - In inbox
- `STARRED` - Starred messages
- `IMPORTANT` - Important marker
- `UNREAD` - Unread messages
- `SENT` - Sent messages
- `DRAFT` - Draft messages
- `TRASH` - Trashed messages

## Notes
- Use message ID from gmail-get-emails tool
- Can add and remove labels in same operation
- Custom labels work if they exist in Gmail account