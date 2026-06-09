// eCase API Client Library — eCourts India Partner API

const ECASE_API_BASE_URL =
  process.env.ECASE_API_BASE_URL || "https://api.ecourts.gov.in/partner/v1";
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

  return res.json() as Promise<T>;
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

// --- API response shapes (normalised below) ---

interface ApiCourt {
  court_code?: string;
  code?: string;
  court_name?: string;
  name?: string;
  state?: string;
  district?: string;
  location?: string;
  court_type?: string;
  type?: string;
}

interface ApiCaseListItem {
  crn?: string;
  case_no?: string;
  case_title?: string;
  title?: string;
  parties?: string;
  petitioner?: string;
  respondent?: string;
  filing_date?: string;
  date_of_filing?: string;
  case_type?: string;
  type_of_case?: string;
  case_status?: string;
  status?: string;
}

interface ApiCaseDetails extends ApiCaseListItem {
  court_code?: string;
  court_name?: string;
  judge_name?: string;
  next_hearing_date?: string;
  next_date?: string;
  case_summary?: string;
  summary?: string;
}

function normaliseCourt(c: ApiCourt): Court {
  return {
    code: c.court_code ?? c.code ?? "",
    name: c.court_name ?? c.name ?? "",
    location: c.location ?? c.district ?? c.state ?? "",
    type: c.court_type ?? c.type ?? "",
  };
}

function normaliseCaseList(c: ApiCaseListItem): CaseListItem {
  const petitioner = c.petitioner ?? "";
  const respondent = c.respondent ?? "";
  return {
    crn: c.crn ?? c.case_no ?? "",
    case_title: c.case_title ?? c.title ?? (petitioner && respondent ? `${petitioner} vs ${respondent}` : ""),
    parties: c.parties ?? (petitioner && respondent ? `${petitioner} vs ${respondent}` : ""),
    filing_date: c.filing_date ?? c.date_of_filing ?? "",
    case_type: c.case_type ?? c.type_of_case ?? "",
    case_status: c.case_status ?? c.status ?? "",
  };
}

function normaliseCaseDetails(c: ApiCaseDetails, crn: string): CaseDetails {
  const base = normaliseCaseList(c);
  return {
    ...base,
    crn: base.crn || crn,
    petitioner: c.petitioner ?? "",
    respondent: c.respondent ?? "",
    court_code: c.court_code ?? "",
    court_name: c.court_name ?? "",
    judge_name: c.judge_name,
    next_hearing_date: c.next_hearing_date ?? c.next_date,
    case_summary: c.case_summary ?? c.summary,
  };
}

// GET /courts
export async function fetchCourts(): Promise<Court[]> {
  const data = await ecaseFetch<{ courts: ApiCourt[] } | ApiCourt[]>("/courts");
  const raw = Array.isArray(data) ? data : (data as { courts: ApiCourt[] }).courts ?? [];
  return raw.map(normaliseCourt);
}

// GET /courts/:court_code/cases
export async function fetchCasesByCourt(courtCode: string): Promise<CaseListItem[]> {
  const data = await ecaseFetch<{ cases: ApiCaseListItem[] } | ApiCaseListItem[]>(
    `/courts/${encodeURIComponent(courtCode)}/cases`
  );
  const raw = Array.isArray(data) ? data : (data as { cases: ApiCaseListItem[] }).cases ?? [];
  return raw.map(normaliseCaseList);
}

// GET /cases/:crn
export async function fetchCaseDetails(crn: string): Promise<CaseDetails | null> {
  try {
    const data = await ecaseFetch<{ case: ApiCaseDetails } | ApiCaseDetails>(
      `/cases/${encodeURIComponent(crn)}`
    );
    const raw: ApiCaseDetails =
      "case" in (data as object)
        ? (data as { case: ApiCaseDetails }).case
        : (data as ApiCaseDetails);
    return normaliseCaseDetails(raw, crn);
  } catch (err) {
    console.error("fetchCaseDetails error:", err);
    return null;
  }
}
