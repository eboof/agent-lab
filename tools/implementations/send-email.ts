// tools/implementations/send-email.ts
// v20250901 – Send Email Tool (uses server/mailer.ts)

import type { ToolDefinition } from "../tool-types.ts";
import { sendMail } from "../../server/mailer.ts";

export const SendEmailTool: ToolDefinition = {
  id: "send-email",
  name: "Send Email", 
  description: "Send an email via configured SMTP server",
  params: [
    { name: "to", type: "string", required: true, description: "Recipient email address (comma-separated list supported)" },
    { name: "subject", type: "string", required: true, description: "Subject line of the email" },
    { name: "body", type: "string", required: true, description: "The plain-text body of the email" },
    { name: "html", type: "string", required: false, description: "Optional HTML version of the email body (takes priority if provided)" },
    { name: "from", type: "string", required: false, description: "Custom 'from' address. Defaults to SMTP configured address if omitted" },
    { name: "cc", type: "string", required: false, description: "Comma-separated CC addresses" },
    { name: "bcc", type: "string", required: false, description: "Comma-separated BCC addresses" }
  ],

  async call({ to, subject, body, html, from, cc, bcc }) {
    if (!to || !subject || !body) {
      throw new Error("Missing required parameters: to, subject, body");
    }

    try {
      // Use enhanced sendMail function
      const info = await sendMail(to, subject, html || body, { from, cc, bcc });
      return {
        success: true,
        to,
        subject,
        from: from || process.env.SMTP_FROM || process.env.SMTP_USER,
        cc: cc || undefined,
        bcc: bcc || undefined,
        messageId: info.messageId,
        response: info.response,
      };
    } catch (err: any) {
      throw new Error(`Send Email failed: ${err.message}`);
    }
  }
};
