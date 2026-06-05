import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { createClient, updateClientCRN, getClientByCRN } from "@/lib/db";
import { v4 as uuidv4 } from "uuid";

interface ImportCaseItem {
  crn: string;
  court_code: string;
  case_title: string;
  case_details: {
    parties: string;
    filing_date: string;
    case_type: string;
    case_status: string;
    petitioner?: string;
    respondent?: string;
  };
  client_id?: string;
  client_name?: string;
  client_whatsapp?: string;
}

// POST /api/ecase/import — import multiple cases from eCase
export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { cases } = body as { cases: ImportCaseItem[] };

    if (!cases || !Array.isArray(cases) || cases.length === 0) {
      return NextResponse.json({ error: "Cases array is required" }, { status: 400 });
    }

    let imported = 0;
    let created = 0;
    let updated = 0;
    const errors: string[] = [];

    for (const caseItem of cases) {
      try {
        const { crn, court_code, case_title, case_details, client_id, client_name, client_whatsapp } = caseItem;

        // Validate required fields
        if (!crn || !court_code || !case_title) {
          errors.push(`Missing required fields for case: ${crn || "unknown"}`);
          continue;
        }

        // Check if CRN already exists for this user
        const existingClient = await getClientByCRN(crn, user.id);
        if (existingClient) {
          errors.push(`Case with CRN ${crn} already imported`);
          continue;
        }

        const ecaseMetadata = {
          parties: case_details.parties,
          filing_date: case_details.filing_date,
          case_type: case_details.case_type,
          case_status: case_details.case_status,
          petitioner: case_details.petitioner,
          respondent: case_details.respondent,
        };

        if (client_id) {
          // Update existing client with CRN
          await updateClientCRN(client_id, crn, court_code, ecaseMetadata);
          updated++;
        } else {
          // Create new client
          if (!client_name || !client_whatsapp) {
            errors.push(`Client name and WhatsApp required for new client (CRN: ${crn})`);
            continue;
          }

          await createClient({
            id: uuidv4(),
            user_id: user.id,
            client_name,
            client_whatsapp,
            case_title,
            court_name: `Court ${court_code}`,
            crn,
            ecase_court_code: court_code,
            import_source: "ecase",
            ecase_metadata: ecaseMetadata,
          });
          created++;
        }

        imported++;
      } catch (error) {
        console.error(`Error importing case ${caseItem.crn}:`, error);
        errors.push(`Failed to import case ${caseItem.crn}`);
      }
    }

    return NextResponse.json({
      success: true,
      imported,
      created,
      updated,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error) {
    console.error("Import cases error:", error);
    return NextResponse.json({ error: "Failed to import cases" }, { status: 500 });
  }
}
