// tools/implementations/gmail-label-email.ts
// Gmail: Apply or remove labels from a message
// v20250902

import type { ToolDefinition } from "../tool-types.ts";
import fs from "fs";
import path from "path";
import { google } from "googleapis";

const TOKEN_PATH = path.resolve("./server/secrets/google-token.json");

async function getGmailClient() {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const redirectUri = process.env.GOOGLE_REDIRECT_URI;

  if (!clientId || !clientSecret || !redirectUri) {
    throw new Error("Missing Google OAuth credentials in .env");
  }

  const { OAuth2 } = google.auth;
  const oAuth2Client = new OAuth2(clientId, clientSecret, redirectUri);

  if (!fs.existsSync(TOKEN_PATH)) {
    throw new Error("No saved token.json found. Run /api/google/auth first.");
  }

  const token = JSON.parse(fs.readFileSync(TOKEN_PATH, "utf-8"));
  oAuth2Client.setCredentials(token);
  return google.gmail({ version: "v1", auth: oAuth2Client });
}

export const GmailLabelEmailTool: ToolDefinition = {
  id: "gmail-label-email",
  name: "Gmail: Label Email",
  description: "Apply or remove labels from a Gmail message",
  params: [
    {
      name: "messageId",
      type: "string",
      required: false,
      description: "Gmail message ID to modify",
    },
    {
      name: "id",
      type: "string", 
      required: false,
      description: "Gmail message ID to modify (alias for messageId)",
    },
    {
      name: "addLabels",
      type: "string",
      required: false,
      description: "Comma-separated labels to add (e.g., 'STARRED,IMPORTANT')",
    },
    {
      name: "label",
      type: "string",
      required: false,
      description: "Single label to add (shortcut for addLabels)",
    },
    {
      name: "removeLabels",
      type: "string",
      required: false,
      description: "Comma-separated labels to remove (e.g., 'UNREAD,INBOX')",
    },
  ],

  async call({ messageId, id, addLabels, label, removeLabels }) {
    const emailId = messageId || id;
    if (!emailId) {
      throw new Error("Missing required param: messageId or id");
    }
    
    // Handle single label parameter as addLabels
    const labelsToAdd = addLabels || label;

    try {
      const gmail = await getGmailClient();
      
      const addLabelIds = labelsToAdd ? labelsToAdd.split(',').map(l => l.trim()) : [];
      const removeLabelIds = removeLabels ? removeLabels.split(',').map(l => l.trim()) : [];

      // When adding any label, also mark as read and remove from inbox
      if (addLabelIds.length > 0) {
        removeLabelIds.push('UNREAD', 'INBOX');
      }

      // Remove duplicates
      const uniqueRemoveLabels = [...new Set(removeLabelIds)];

      const result = await gmail.users.messages.modify({
        userId: "me",
        id: emailId,
        requestBody: {
          addLabelIds,
          removeLabelIds: uniqueRemoveLabels,
        },
      });

      return {
        success: true,
        messageId: emailId,
        labelIds: result.data.labelIds || [],
        addedLabels: addLabelIds,
        removedLabels: uniqueRemoveLabels,
        markedAsRead: addLabelIds.length > 0,
        removedFromInbox: addLabelIds.length > 0,
      };
    } catch (err: any) {
      // Provide more helpful error for invalid labels
      if (err.message && err.message.includes('Invalid label')) {
        throw new Error(`Gmail API error: Invalid label '${labelsToAdd}'. Valid labels include: STARRED, IMPORTANT, CATEGORY_PROMOTIONS, CATEGORY_SOCIAL, CATEGORY_UPDATES, SPAM, UNREAD, INBOX`);
      }
      throw new Error(`Gmail API error: ${err.message}`);
    }
  },
};