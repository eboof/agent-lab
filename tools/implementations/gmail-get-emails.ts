// tools/implementations/gmail-get-emails.ts
// Gmail: Fetch latest N emails
// v20250902

import type { ToolDefinition } from "../tool-types.ts";
import fs from "fs";
import path from "path";
import { google } from "googleapis";

const TOKEN_PATH = path.resolve("./server/secrets/google-token.json"); // refresh token saved here
const SCOPES = ["https://www.googleapis.com/auth/gmail.readonly"];

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

export const GmailGetEmailsTool: ToolDefinition = {
  id: "gmail-get-emails",
  name: "Gmail: Get Emails",
  description: "Fetches the latest N emails from your Gmail inbox",
  params: [
    {
      name: "count",
      type: "number",
      required: false,
      description: "Number of emails to fetch (default 5, max 50)",
    },
    {
      name: "max_results",
      type: "number", 
      required: false,
      description: "Alias for count parameter",
    },
  ],

  async call({ count = 5, max_results }) {
    const finalCount = max_results || count;
    if (finalCount < 1 || finalCount > 50) {
      throw new Error("count must be between 1 and 50");
    }

    try {
      const gmail = await getGmailClient();
      const res = await gmail.users.messages.list({
        userId: "me",
        maxResults: finalCount,
        q: "in:inbox", // Only get emails from inbox
      });

      console.log(`📧 Gmail API returned ${res.data.messages?.length || 0} messages (requested ${finalCount})`);
      
      if (!res.data.messages) return { emails: [] };

      const emails = [];
      for (const msg of res.data.messages) {
        const full = await gmail.users.messages.get({
          userId: "me",
          id: msg.id!,
        });

        const headers = full.data.payload?.headers || [];
        const subject = headers.find((h) => h.name === "Subject")?.value || "";
        const from = headers.find((h) => h.name === "From")?.value || "";
        const snippet = full.data.snippet || "";

        emails.push({ id: msg.id, from, subject, snippet });
      }

      console.log(`📧 Successfully processed ${emails.length} emails from Gmail API`);
      return { emails };
    } catch (err: any) {
      throw new Error(`Gmail API error: ${err.message}`);
    }
  },
};