// eCase API Client Library — eCourts India Partner API (ecourtsindia.com)
// Docs: https://ecourtsindia.com/api/docs
// Base URL: https://webapi.ecourtsindia.com

const ECASE_API_BASE_URL =
  process.env.ECASE_API_BASE_URL || "https://webapi.ecourtsindia.com";
const ECASE_API_KEY = process.env.ECASE_API_KEY || "";

function ecaseHeaders(): HeadersInit {
  return {
    Authorization: `Bearer ${ECASE_API_KEY}`,
    "Content-Type": "application/json",
    Accept: "application/json",
  };
}

async function ecaseFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const url = `${ECASE_API_BASE_URL}${path}`;
  const res = await fetch(url, {
    ...init,
    headers: {
      ...ecaseHeaders(),
      ...(init?.headers ?? {}),
    },
  });

  if (!res.ok) {
    const text = await res.text().catch(() => res.statusText);
    throw new Error(`eCourts API error ${res.status}: ${text}`);
  }

  const json = await res.json();
  // All API responses are wrapped: { data: ..., meta: ... }
  return (json.data ?? json) as T;
}

export interface Court {
  code: string;
  name: string;
  location: string;
  type: string;
}

export interface CaseListItem {
  crn: string;
  case_title: string;
  parties: string;
  filing_date: string;
  case_type: string;
  case_status: string;
}

export interface CaseDetails {
  crn: string;
  case_title: string;
  parties: string;
  petitioner: string;
  respondent: string;
  filing_date: string;
  case_type: string;
  case_status: string;
  court_code: string;
  court_name: string;
  judge_name?: string;
  next_hearing_date?: string;
  case_summary?: string;
}

// ── Enum response shape ───────────────────────────────────────────────────────
interface EnumEntry {
  code: string;
  description: string;
}

interface EnumsData {
  // Real shape: { enums: { courtCode: [...] } }
  enums?: { courtCode?: EnumEntry[]; [key: string]: unknown };
  // Fallback in case shape changes
  courtCode?: EnumEntry[];
  [key: string]: unknown;
}

// ── Search response shape ─────────────────────────────────────────────────────
interface SearchResult {
  cnr: string;
  caseType?: string;
  caseStatus?: string;
  filingDate?: string;
  petitioners?: string[];
  respondents?: string[];
  courtCode?: string;
  judges?: string[];
  nextHearingDate?: string;
}

interface SearchData {
  results: SearchResult[];
  totalHits?: number;
}

// ── Case detail response shape ────────────────────────────────────────────────
interface CourtCaseData {
  cnr: string;
  caseType?: string;
  caseTypeRaw?: string;
  caseStatus?: string;
  filingDate?: string;
  petitioners?: string[];
  respondents?: string[];
  courtCode?: string;
  courtName?: string;
  judges?: string[];
  nextHearingDate?: string;
  purpose?: string;
  descriptions?: {
    enumLookup?: {
      courtCode?: Record<string, string>;
      caseType?: Record<string, string>;
      caseStatus?: Record<string, string>;
    };
  };
}

interface CaseDetailData {
  courtCaseData: CourtCaseData;
}

// ─────────────────────────────────────────────────────────────────────────────

/**
 * Fetch available courts using the live enum endpoint.
 * GET /api/partner/enums?types=courtCode  (no credits charged)
 */
export async function fetchCourts(): Promise<Court[]> {
  const data = await ecaseFetch<EnumsData>("/api/partner/enums?types=courtCode");

  // Real response: { data: { enums: { courtCode: [...] } } }
  // After unwrapping data envelope: { enums: { courtCode: [...] } }
  const entries: EnumEntry[] = data.enums?.courtCode ?? data.courtCode ?? [];

  return entries.map((e) => {
    // Derive a rough location/type from the court code prefix
    // High court codes: DLHC, HCBM, MHCA, TNHC … contain "HC"
    // NCLT codes start with NCLT; NCLAT start with NCLAT
    // Everything else is District Court
    const isHighCourt = /HC/i.test(e.code);
    const isNCLT = /^NCLT/i.test(e.code);
    const isNCLAT = /^NCLAT/i.test(e.code);
    const type = isNCLAT
      ? "NCLAT"
      : isNCLT
      ? "NCLT"
      : isHighCourt
      ? "High Court"
      : "District Court";

    return {
      code: e.code,
      name: e.description,
      location: "",
      type,
    };
  });
}

/**
 * Search cases for a specific court using the Case Search endpoint.
 * GET /api/partner/search?courtCodes={code}&pageSize=50
 * (credits charged per request)
 */
export async function fetchCasesByCourt(courtCode: string): Promise<CaseListItem[]> {
  const params = new URLSearchParams({
    courtCodes: courtCode,
    pageSize: "50",
    sortBy: "filingDate",
    sortOrder: "desc",
  });

  const data = await ecaseFetch<SearchData>(
    `/api/partner/search?${params.toString()}`
  );

  return (data.results ?? []).map((r) => {
    const petitioner = r.petitioners?.[0] ?? "";
    const respondent = r.respondents?.[0] ?? "";
    return {
      crn: r.cnr,
      case_title:
        petitioner && respondent ? `${petitioner} vs ${respondent}` : r.cnr,
      parties:
        petitioner && respondent ? `${petitioner} vs ${respondent}` : "",
      filing_date: r.filingDate ?? "",
      case_type: r.caseType ?? "",
      case_status: r.caseStatus ?? "",
    };
  });
}

/**
 * Fetch full case details by CNR.
 * GET /api/partner/case/{cnr}
 * (credits charged per request)
 */
export async function fetchCaseDetails(cnr: string): Promise<CaseDetails | null> {
  try {
    const data = await ecaseFetch<CaseDetailData>(
      `/api/partner/case/${encodeURIComponent(cnr)}`
    );

    const c = data.courtCaseData;
    const lookup = c.descriptions?.enumLookup ?? {};

    const petitioner = c.petitioners?.[0] ?? "";
    const respondent = c.respondents?.[0] ?? "";
    const courtName =
      (c.courtCode ? lookup.courtCode?.[c.courtCode] : undefined) ??
      c.courtName ??
      "";

    return {
      crn: c.cnr ?? cnr,
      case_title:
        petitioner && respondent
          ? `${petitioner} vs ${respondent}`
          : c.cnr ?? cnr,
      parties:
        petitioner && respondent ? `${petitioner} vs ${respondent}` : "",
      petitioner,
      respondent,
      filing_date: c.filingDate ?? "",
      case_type:
        (c.caseType ? lookup.caseType?.[c.caseType] : undefined) ??
        c.caseTypeRaw ??
        c.caseType ??
        "",
      case_status:
        (c.caseStatus ? lookup.caseStatus?.[c.caseStatus] : undefined) ??
        c.caseStatus ??
        "",
      court_code: c.courtCode ?? "",
      court_name: courtName,
      judge_name: c.judges?.[0],
      next_hearing_date: c.nextHearingDate,
      case_summary: c.purpose,
    };
  } catch (err) {
    console.error("fetchCaseDetails error:", err);
    return null;
  }
}
