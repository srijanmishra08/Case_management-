import { NextRequest, NextResponse } from "next/server";
import { getHearingsWithUpcomingDate } from "@/lib/db";
import { sendWhatsAppMessage, generateReminderMessage } from "@/lib/twilio";

/**
 * GET /api/reminder-cron
 * 
 * Called daily by Vercel Cron. Finds cases with hearings tomorrow
 * and sends reminder WhatsApp messages to the lawyer.
 * 
 * Protected by CRON_SECRET to prevent unauthorized access.
 */
export async function GET(req: NextRequest) {
  // Verify cron secret
  const authHeader = req.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Get tomorrow's date in YYYY-MM-DD format
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split("T")[0];

    const cases = await getHearingsWithUpcomingDate(tomorrowStr);

    if (cases.length === 0) {
      return NextResponse.json({ message: "No hearings tomorrow", count: 0 });
    }

    const lawyerWhatsApp = process.env.LAWYER_WHATSAPP_NUMBER;
    const results: { hearingId: string; success: boolean; error?: string }[] = [];

    for (const c of cases) {
      const message = generateReminderMessage({
        case_title: c.case_title,
        court_name: c.court_name,
        next_hearing_date: c.next_hearing_date!,
        purpose_of_hearing: c.purpose_of_hearing,
      });

      if (lawyerWhatsApp) {
        const result = await sendWhatsAppMessage(lawyerWhatsApp, message);
        results.push({
          hearingId: c.id,
          success: result.success,
          error: result.error,
        });
      } else {
        console.log(`[Reminder] ${message}`);
        results.push({ hearingId: c.id, success: true });
      }
    }

    return NextResponse.json({
      message: `Processed ${cases.length} reminder(s)`,
      count: cases.length,
      results,
    });
  } catch (error) {
    console.error("Reminder cron error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
