import nodemailer from "nodemailer";
import { config } from "dotenv";
config();

// Create reusable transporter
const transporter = nodemailer.createTransport({
  host: "mail.guardedhost.com",
  port: 587, // STARTTLS
  secure: false, // must be false for port 587
  auth: {
    user: process.env.SMTP_USER || "stocks@jalwax.com",
    pass: process.env.SMTP_PASS || "TryThis$One", // ⚠️ move to .env for safety
  },
  tls: {
    rejectUnauthorized: false, // helps with some shared hosts
  },
});

// Send mail function
export async function sendMail(to: string, subject: string, html: string) {
  try {
    const info = await transporter.sendMail({
      from: `"Stocks Bot" <stocks@jalwax.com>`,
      to,
      subject,
      html,
    });

    console.log("📧 Email successfully sent!");
    console.log(`   → From: stocks@jalwax.com`);
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
