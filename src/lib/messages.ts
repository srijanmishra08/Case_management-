/**
 * Shared message generation utilities.
 * These functions are safe for both client and server use (no Node.js dependencies).
 */

/**
 * Generate a professional case update message.
 */
export function generateCaseUpdateMessage(params: {
  case_title: string;
  court_name: string;
  previous_hearing_date: string | null;
  next_hearing_date: string | null;
  purpose_of_hearing: string | null;
  special_notes: string | null;
  firm_name: string;
}): string {
  const lines = [
    `📋 *CASE STATUS UPDATE*`,
    ``,
    `*Case:* ${params.case_title}`,
    `*Court:* ${params.court_name}`,
    ``,
    `*Previous Hearing:* ${params.previous_hearing_date || "N/A"}`,
    `*Next Hearing:* ${params.next_hearing_date || "N/A"}`,
    ``,
    `*Purpose:* ${params.purpose_of_hearing || "N/A"}`,
  ];

  if (params.special_notes) {
    lines.push(`*Notes:* ${params.special_notes}`);
  }

  lines.push(``, `Regards,`, `*${params.firm_name}*`);

  return lines.join("\n");
}

/**
 * Generate a hearing reminder message.
 */
export function generateReminderMessage(params: {
  case_title: string;
  court_name: string;
  next_hearing_date: string;
  purpose_of_hearing: string | null;
}): string {
  return [
    `⚠️ *REMINDER: Hearing Tomorrow*`,
    ``,
    `*Case:* ${params.case_title}`,
    `*Court:* ${params.court_name}`,
    `*Next Hearing:* ${params.next_hearing_date}`,
    `*Purpose:* ${params.purpose_of_hearing || "N/A"}`,
  ].join("\n");
}
