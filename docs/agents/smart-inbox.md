# 📥 Smart Inbox Agent

Intelligent email management agent that analyzes Gmail messages, classifies content, applies appropriate labels, and helps maintain an organized inbox.

## Overview

The Smart Inbox Agent uses AI to automatically analyze your Gmail inbox and help you stay organized. It fetches recent emails, classifies them by importance and type, applies appropriate labels, and provides actionable recommendations.

## Features

- **📊 Inbox Analysis**: Analyzes email content, sender patterns, and context
- **🏷️ Smart Labeling**: Automatically applies IMPORTANT, STARRED, or PROMOTIONS labels
- **🗑️ Spam Detection**: Identifies and offers to delete obvious spam/promotional emails
- **📋 Summary Reports**: Provides clear summaries of inbox status and recommendations
- **🔒 Safety First**: Always confirms before deleting emails, errs on side of caution

## Tools Used

- `gmail-get-emails` - Fetch recent emails from inbox
- `gmail-label-email` - Apply or remove labels from messages
- `gmail-delete-email` - Move spam/unwanted messages to trash
- `gmail-send-email` - Send replies or follow-up emails if needed

## Input Parameters

- `count` (number, required): Number of recent emails to analyze
  - Default: 10
  - Maximum: 25
  - Minimum: 1

## Usage Example

### Input
```json
{
  "count": 15
}
```

### Expected Output
```
📬 INBOX ANALYSIS (15 emails processed)

🔴 IMPORTANT (3 emails):
- "Project Deadline Update" from manager@company.com
- "Contract Review Required" from legal@vendor.com  
- "Meeting Rescheduled" from colleague@company.com

⭐ STARRED (2 emails):
- "Purchase Receipt #12345" from store@retailer.com
- "Account Verification" from support@service.com

📢 PROMOTIONS (8 emails):
- Various newsletters and marketing emails

🗑️ SPAM DETECTED (2 emails):
- Suspicious phishing attempts (will ask before deleting)

RECOMMENDATIONS:
✅ Applied IMPORTANT label to 3 work-related emails
✅ Applied STARRED label to 2 receipts/confirmations
✅ Applied PROMOTIONS label to 8 marketing emails
⚠️  Found 2 potential spam emails - confirm deletion?

Your inbox is now better organized! Focus on the 3 important emails.
```

## Classification Logic

### IMPORTANT
- Work-related emails from colleagues/managers
- Personal correspondence from known contacts
- Urgent notifications from services you use
- Time-sensitive requests or updates

### STARRED
- Receipts and purchase confirmations
- Account registrations and verifications
- License keys and important credentials
- Travel confirmations and tickets

### PROMOTIONS
- Marketing emails from retailers
- Newsletter subscriptions
- Deal alerts and promotional offers
- Social media notifications

### SPAM (Delete Candidates)
- Obvious phishing attempts
- Suspicious unknown senders
- Malformed or nonsensical content
- Known spam patterns

## Safety Features

- **Confirmation Required**: Always asks before deleting emails
- **Conservative Approach**: When uncertain, labels instead of deleting
- **Detailed Reasoning**: Explains why each email was classified
- **Email Previews**: Shows subject and sender for transparency
- **Undo Friendly**: Uses Gmail labels that can be easily reversed

## Prerequisites

1. **Gmail OAuth Setup**: Complete Google authentication via `/api/google/auth`
2. **Gmail Scopes**: Requires `gmail.readonly` and `gmail.modify` permissions
3. **Active Gmail Account**: Must have emails in inbox to analyze

## Error Handling

- Handles OAuth token expiration gracefully
- Provides clear error messages for API failures
- Falls back to read-only mode if modification fails
- Validates input parameters (count limits)

## Tips for Best Results

1. **Start Small**: Begin with 5-10 emails to see how it classifies
2. **Review Results**: Check the agent's reasoning before accepting recommendations  
3. **Customize Labels**: Gmail labels mentioned must exist in your account
4. **Regular Use**: Run periodically to maintain inbox organization
5. **Backup Important**: Always keep important emails; agent errs on side of caution

## Use Cases

- **Daily Inbox Cleanup**: Run each morning to organize overnight emails
- **Vacation Catch-up**: Process large backlogs after time away
- **Spam Management**: Identify and clean up unwanted promotional emails
- **Priority Focus**: Surface important emails that need attention
- **Bulk Organization**: Apply consistent labeling across many emails

## Integration

Available in:
- **Agent Library**: Browse and run existing Smart Inbox agent
- **Build Agent**: Customize prompts and parameters
- **Run Agents**: Execute with custom email counts
- **API**: Integrate with external workflows via `/api/agents/run/smart-inbox`