// server/utils/api-error.ts
// Shared error handler for consistent API responses

import express from "express";

export function handleApiError(res: express.Response, err: any, statusCode: number = 400) {
  console.error("❌ API error:", err);
  
  // Redact sensitive information from logs
  const safeMessage = err.message || "Unknown error";
  const redactedMessage = safeMessage
    .replace(/password[=:]\s*[^\s,}]+/gi, "password=***")
    .replace(/token[=:]\s*[^\s,}]+/gi, "token=***")
    .replace(/key[=:]\s*[^\s,}]+/gi, "key=***");
  
  res.status(statusCode).json({ 
    error: redactedMessage,
    timestamp: new Date().toISOString()
  });
}

export function handleApiSuccess(res: express.Response, data: any) {
  res.json({
    ...data,
    timestamp: new Date().toISOString()
  });
}