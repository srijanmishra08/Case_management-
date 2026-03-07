import twilio from "twilio";

export { generateCaseUpdateMessage, generateReminderMessage } from "./messages";

const accountSid = process.env.TWILIO_ACCOUNT_SID!;
const authToken = process.env.TWILIO_AUTH_TOKEN!;
const fromWhatsApp = process.env.TWILIO_WHATSAPP_NUMBER!; // e.g. "whatsapp:+14155238886"

/**
 * Send a WhatsApp message via Twilio.
 * @param phoneNumber - Client phone number in E.164 format (e.g. "+919876543210")
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

    const to = phoneNumber.startsWith("whatsapp:")
      ? phoneNumber
      : `whatsapp:${phoneNumber}`;

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


