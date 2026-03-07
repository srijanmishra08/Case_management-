import twilio from "twilio";

export { generateCaseUpdateMessage, generateReminderMessage } from "./messages";

const accountSid = process.env.TWILIO_ACCOUNT_SID!;
const authToken = process.env.TWILIO_AUTH_TOKEN!;
const fromWhatsApp = process.env.TWILIO_WHATSAPP_NUMBER!; // e.g. "whatsapp:+14155238886"

/**
 * Send a WhatsApp message via Twilio.
 * @param phoneNumber - Client phone number (e.g. "7879722663", "+919876543210")
 * @param message - The message body to send
 */
export async function sendWhatsAppMessage(
  phoneNumber: string,
  message: string
): Promise<{ success: boolean; sid?: string; error?: string }> {
  try {
    if (!accountSid || !authToken || !fromWhatsApp) {
      console.warn("Twilio credentials not configured. Message not sent.");
      return { success: false, error: "Twilio credentials not configured" };
    }

    const client = twilio(accountSid, authToken);

    // Normalize phone number to E.164 format
    let normalized = phoneNumber.replace(/[\s\-()]/g, "");
    if (normalized.startsWith("whatsapp:")) {
      normalized = normalized.replace("whatsapp:", "");
    }
    // If no country code, assume India (+91)
    if (!normalized.startsWith("+")) {
      if (normalized.startsWith("91") && normalized.length === 12) {
        normalized = `+${normalized}`;
      } else {
        normalized = `+91${normalized}`;
      }
    }

    const to = `whatsapp:${normalized}`;

    const from = fromWhatsApp.startsWith("whatsapp:")
      ? fromWhatsApp
      : `whatsapp:${fromWhatsApp}`;

    const result = await client.messages.create({
      body: message,
      from,
      to,
    });

    console.log(`WhatsApp message sent: ${result.sid}`);
    return { success: true, sid: result.sid };
  } catch (error: unknown) {
    const errMsg = error instanceof Error ? error.message : "Unknown error";
    console.error("Failed to send WhatsApp message:", errMsg);
    return { success: false, error: errMsg };
  }
}


