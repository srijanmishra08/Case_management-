// WhatsApp messaging via Meta Cloud API (official, no sandbox, free up to 1,000 conversations/month)
// Docs: https://developers.facebook.com/docs/whatsapp/cloud-api/messages/text-messages
// Required env vars:
//   WHATSAPP_ACCESS_TOKEN     — Permanent token from your Meta System User
//   WHATSAPP_PHONE_NUMBER_ID  — Phone Number ID from Meta Developer Console

export { generateCaseUpdateMessage, generateReminderMessage } from "./messages";

const GRAPH_API_VERSION = "v22.0";

/**
 * Send a WhatsApp message via Meta WhatsApp Cloud API.
 * @param phoneNumber - Client phone number (e.g. "7879722663", "+919876543210")
 * @param message - The message body to send
 */
export async function sendWhatsAppMessage(
  phoneNumber: string,
  message: string
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;

  if (!accessToken || !phoneNumberId) {
    console.warn("WhatsApp credentials not configured. Message not sent.");
    return { success: false, error: "WhatsApp credentials not configured" };
  }

  // Normalize to digits-only E.164 (Meta API expects no '+' prefix)
  let normalized = phoneNumber.replace(/[\s\-()]/g, "");
  if (normalized.startsWith("whatsapp:")) {
    normalized = normalized.replace("whatsapp:", "");
  }
  if (normalized.startsWith("+")) {
    normalized = normalized.slice(1);
  }
  // If 10-digit Indian number with no country code, prefix 91
  if (normalized.length === 10 && !normalized.startsWith("91")) {
    normalized = `91${normalized}`;
  }

  const url = `https://graph.facebook.com/${GRAPH_API_VERSION}/${phoneNumberId}/messages`;

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        to: normalized,
        type: "text",
        text: { body: message },
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      const errMsg =
        (data as { error?: { message?: string } })?.error?.message ||
        `HTTP ${response.status}`;
      console.error("WhatsApp API error:", errMsg);
      return { success: false, error: errMsg };
    }

    const messageId = (data as { messages?: { id: string }[] })?.messages?.[0]?.id;
    console.log(`WhatsApp message sent: ${messageId}`);
    return { success: true, messageId };
  } catch (error: unknown) {
    const errMsg = error instanceof Error ? error.message : "Unknown error";
    console.error("Failed to send WhatsApp message:", errMsg);
    return { success: false, error: errMsg };
  }
}


