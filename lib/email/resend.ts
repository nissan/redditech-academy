import { Resend } from "resend";

export interface EmailPayload {
  to: string;
  subject: string;
  text: string;
  html?: string;
}

export interface EmailResult {
  sent: boolean;
  devFallback?: boolean;
  payload?: EmailPayload;
}

export async function sendEmail(payload: EmailPayload): Promise<EmailResult> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM || "Redditech Academy <academy@reddi.tech>";

  if (!apiKey || process.env.NODE_ENV === "test") {
    if (process.env.NODE_ENV !== "production") {
      console.log("[dev-email]", { ...payload, from });
      return { sent: false, devFallback: true, payload };
    }
    throw new Error("RESEND_API_KEY is required to send email in production");
  }

  const resend = new Resend(apiKey);
  const { error } = await resend.emails.send({ from, ...payload });
  if (error) {
    const message = typeof error === "object" && "message" in error ? String(error.message) : "Resend email send failed";
    throw new Error(message);
  }
  return { sent: true };
}
