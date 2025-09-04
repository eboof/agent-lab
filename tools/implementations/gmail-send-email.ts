// tools/implementations/gmail-send-email.ts
// Gmail: Send an email via Gmail API
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

function createRawMessage(to: string, subject: string, body?: string, html?: string): string {
  const headers = [
    `To: ${to}`,
    `Subject: ${subject}`,
    'MIME-Version: 1.0',
  ];

  let messageBody = '';
  
  if (html && body) {
    // Multipart email with both text and HTML
    const boundary = 'boundary_' + Math.random().toString(36).substr(2, 9);
    headers.push(`Content-Type: multipart/alternative; boundary="${boundary}"`);
    
    messageBody = [
      `--${boundary}`,
      'Content-Type: text/plain; charset=utf-8',
      '',
      body,
      '',
      `--${boundary}`,
      'Content-Type: text/html; charset=utf-8',
      '',
      html,
      '',
      `--${boundary}--`
    ].join('\r\n');
  } else if (html) {
    // HTML only
    headers.push('Content-Type: text/html; charset=utf-8');
    messageBody = html;
  } else {
    // Plain text only
    headers.push('Content-Type: text/plain; charset=utf-8');
    messageBody = body || '';
  }

  const rawMessage = headers.join('\r\n') + '\r\n\r\n' + messageBody;
  return Buffer.from(rawMessage).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

export const GmailSendEmailTool: ToolDefinition = {
  id: "gmail-send-email",
  name: "Gmail: Send Email",
  description: "Send an email via Gmail API",
  params: [
    {
      name: "to",
      type: "string",
      required: true,
      description: "Recipient email address",
    },
    {
      name: "subject",
      type: "string",
      required: true,
      description: "Email subject line",
    },
    {
      name: "body",
      type: "string",
      required: false,
      description: "Plain text email body",
    },
    {
      name: "html",
      type: "string",
      required: false,
      description: "HTML email body (optional, alternative to plain text)",
    },
  ],

  async call({ to, subject, body, html }) {
    if (!to) {
      throw new Error("Missing required param: to");
    }
    if (!subject) {
      throw new Error("Missing required param: subject");
    }
    if (!body && !html) {
      throw new Error("Must provide either body or html content");
    }

    try {
      const gmail = await getGmailClient();
      
      const raw = createRawMessage(to, subject, body, html);
      
      const result = await gmail.users.messages.send({
        userId: "me",
        requestBody: {
          raw,
        },
      });

      return {
        success: true,
        id: result.data.id,
        to,
        subject,
        threadId: result.data.threadId,
      };
    } catch (err: any) {
      throw new Error(`Gmail API error: ${err.message}`);
    }
  },
};