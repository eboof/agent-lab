// server/api/google.ts
// v20250902 — Google OAuth router

import express from "express";
import fs from "fs";
import path from "path";
import { google } from "googleapis";

const router = express.Router();
const TOKEN_PATH = path.resolve("./server/secrets/google-token.json");

const SCOPES = [
  "https://www.googleapis.com/auth/gmail.readonly",
  "https://www.googleapis.com/auth/gmail.modify",
  "https://www.googleapis.com/auth/drive.file",
  "https://www.googleapis.com/auth/spreadsheets",
  "https://www.googleapis.com/auth/calendar",
];

function getOAuthClient() {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const redirectUri = process.env.GOOGLE_REDIRECT_URI;

  if (!clientId || !clientSecret || !redirectUri) {
    throw new Error("Missing GOOGLE_CLIENT_ID/SECRET/REDIRECT_URI in .env");
  }

  return new google.auth.OAuth2(clientId, clientSecret, redirectUri);
}

// Start OAuth flow
router.get("/auth", (req, res) => {
  try {
    const oAuth2Client = getOAuthClient();
    const authUrl = oAuth2Client.generateAuthUrl({
      access_type: "offline",
      scope: SCOPES,
      prompt: "consent",
    });
    res.redirect(authUrl);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Callback from Google
router.get("/callback", async (req, res) => {
  const code = req.query.code as string;
  if (!code) return res.status(400).send("Missing ?code param");

  try {
    const oAuth2Client = getOAuthClient();
    const { tokens } = await oAuth2Client.getToken(code);
    oAuth2Client.setCredentials(tokens);

    // Save refresh token to secrets
    fs.mkdirSync(path.dirname(TOKEN_PATH), { recursive: true });
    fs.writeFileSync(TOKEN_PATH, JSON.stringify(tokens, null, 2));

    res.send("✅ Authentication successful! Token saved.");
  } catch (err: any) {
    console.error("OAuth callback error:", err);
    res.status(500).send("OAuth failed: " + err.message);
  }
});

// Status check endpoint
router.get("/status", (req, res) => {
  try {
    const hasToken = fs.existsSync(TOKEN_PATH);
    let tokenInfo = null;
    
    if (hasToken) {
      const tokenData = JSON.parse(fs.readFileSync(TOKEN_PATH, "utf-8"));
      tokenInfo = {
        hasAccessToken: !!tokenData.access_token,
        hasRefreshToken: !!tokenData.refresh_token,
        expiryDate: tokenData.expiry_date || null,
        scopes: SCOPES
      };
    }

    res.json({
      authenticated: hasToken,
      tokenPath: TOKEN_PATH,
      tokenInfo,
      authUrl: "/api/google/auth"
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;