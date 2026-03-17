// WhatsApp messaging via Meta Cloud API (official, no sandbox, free up to 1,000 conversations/month)
// Docs: https://developers.facebook.com/docs/whatsapp/cloud-api/messages/text-messages
//
// Required env vars:
//   WHATSAPP_ACCESS_TOKEN        — Permanent token from your Meta System User
//   WHATSAPP_PHONE_NUMBER_ID     — Phone Number ID from Meta Developer Console
//
// For business-initiated (outbound) messages, Meta REQUIRES approved templates.
// Free-form text only works when the recipient has messaged you first (24-hour window).
//
// Template to create in Meta Business Manager → WhatsApp Manager → Message Templates:
//   Name:     case_update
//   Category: UTILITY
//   Language: English (en_US)
//   Body:     Hi {{1}}, here is an update on your case *{{2}}* at *{{3}}*.\n\nPrevious Hearing: {{4}}\nNext Hearing: {{5}}\nPurpose: {{6}}\n\n{{7}}\nRegards, {{8}}
//
// Variables map: 1=client_name, 2=case_title, 3=court_name,
//               4=previous_hearing_date, 5=next_hearing_date,
//               6=purpose_of_hearing, 7=special_notes, 8=firm_name

export { generateCaseUpdateMessage, generateReminderMessage } from "./messages";

const GRAPH_API_VERSION = "v22.0";

/** Normalize a phone number to digits-only E.164 (no '+'), defaulting to +91. */
function normalizePhone(phoneNumber: string): string {
  let n = phoneNumber.replace(/[\s\-()]/g, "");
  if (n.startsWith("whatsapp:")) n = n.replace("whatsapp:", "");
  if (n.startsWith("+")) n = n.slice(1);
  if (n.length === 10 && !n.startsWith("91")) n = `91${n}`;
  return n;
}

type ApiResult = { success: boolean; messageId?: string; error?: string };

async function callMessagesApi(
  phoneNumberId: string,
  accessToken: string,
  body: Record<string, unknown>
): Promise<ApiResult> {
  const url = `https://graph.facebook.com/${GRAPH_API_VERSION}/${phoneNumberId}/messages`;
  const response = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
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
}

/**
 * Send a case update via the approved "case_update" template.
 * Falls back to free-form text (works only within a 24-hour session window).
 */
export async function sendWhatsAppMessage(
  phoneNumber: string,
  message: string,
  templateParams?: {
    clientName: string;
    caseTitle: string;
    courtName: string;
    previousHearingDate: string;
    nextHearingDate: string;
    purposeOfHearing: string;
    specialNotes: string;
    firmName: string;
  }
): Promise<ApiResult> {
  const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;

  if (!accessToken || !phoneNumberId) {
    console.warn("WhatsApp credentials not configured. Message not sent.");
    return { success: false, error: "WhatsApp credentials not configured" };
  }

  const to = normalizePhone(phoneNumber);

  // Prefer template message (works for all outbound notifications)
  if (templateParams) {
    const {
      clientName, caseTitle, courtName,
      previousHearingDate, nextHearingDate,
      purposeOfHearing, specialNotes, firmName,
    } = templateParams;

    return callMessagesApi(phoneNumberId, accessToken, {
      messaging_product: "whatsapp",
      to,
      type: "template",
      template: {
        name: "case_update",
        language: { code: "en_US" },
        components: [
          {
            type: "body",
            parameters: [
              { type: "text", text: clientName },
              { type: "text", text: caseTitle },
              { type: "text", text: courtName },
              { type: "text", text: previousHearingDate || "N/A" },
              { type: "text", text: nextHearingDate || "N/A" },
              { type: "text", text: purposeOfHearing || "N/A" },
              { type: "text", text: specialNotes || "" },
              { type: "text", text: firmName },
            ],
          },
        ],
      },
    });
  }

  // Fallback: free-form text (only delivered if recipient messaged you within 24h)
  return callMessagesApi(phoneNumberId, accessToken, {
    messaging_product: "whatsapp",
    to,
    type: "text",
    text: { body: message },
  });
}


