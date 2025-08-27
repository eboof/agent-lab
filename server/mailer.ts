import nodemailer from "nodemailer";
import { config } from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

// Load .env from project root regardless of where this is called from
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
config({ path: path.resolve(__dirname, "../.env") });

// Create reusable transporter
const transporter = nodemailer.createTransport({
  host: "mail.guardedhost.com",
  port: 587, // STARTTLS
  secure: false, // must be false for port 587
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
  tls: {
    rejectUnauthorized: false, // helps with some shared hosts
  },
});

// Send mail function
export async function sendMail(to: string, subject: string, html: string) {
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    throw new Error("SMTP credentials not configured. Set SMTP_USER and SMTP_PASS environment variables.");
  }

  try {
    const info = await transporter.sendMail({
      from: `"Stocks Bot" <${process.env.SMTP_USER}>`,
      to,
      subject,
      html,
    });

    console.log("📧 Email successfully sent!");
    console.log(`   → From: ${process.env.SMTP_USER}`);
    console.log(`   → To: ${to}`);
    console.log(`   → Subject: ${subject}`);
    console.log(`   → Message ID: ${info.messageId}`);

    if (info.response) {
      console.log(`   → Server response: ${info.response}`);
    }

    return info;
  } catch (err) {
    console.error("❌ Failed to send mail:", err);
    throw err;
  }
}
