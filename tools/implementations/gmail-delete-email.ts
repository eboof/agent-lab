// tools/implementations/gmail-delete-email.ts
// Gmail: Move a message to trash
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

export const GmailDeleteEmailTool: ToolDefinition = {
  id: "gmail-delete-email",
  name: "Gmail: Delete Email",
  description: "Move a Gmail message to trash",
  params: [
    {
      name: "messageId",
      type: "string",
      required: false,
      description: "Gmail message ID to delete",
    },
    {
      name: "id", 
      type: "string",
      required: false,
      description: "Gmail message ID to delete (alias for messageId)",
    },
  ],

  async call({ messageId, id }) {
    const emailId = messageId || id;
    if (!emailId) {
      throw new Error("Missing required param: messageId or id");
    }

    try {
      const gmail = await getGmailClient();
      
      await gmail.users.messages.trash({
        userId: "me",
        id: emailId,
      });

      return {
        success: true,
        messageId: emailId,
        action: "moved to trash",
      };
    } catch (err: any) {
      throw new Error(`Gmail API error: ${err.message}`);
    }
  },
};