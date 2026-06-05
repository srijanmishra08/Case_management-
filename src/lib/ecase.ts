// eCase API Client Library
// TODO: Replace mock data with real eCase API integration when credentials are available

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

// Mock courts data - TODO: Replace with real API call
export async function fetchCourts(): Promise<Court[]> {
  // Simulating API delay
  await new Promise((resolve) => setTimeout(resolve, 500));

  return [
    {
      code: "DHC",
      name: "Delhi High Court",
      location: "New Delhi",
      type: "High Court",
    },
    {
      code: "BHC",
      name: "Bombay High Court",
      location: "Mumbai",
      type: "High Court",
    },
    {
      code: "KHC",
      name: "Karnataka High Court",
      location: "Bangalore",
      type: "High Court",
    },
    {
      code: "MHC",
      name: "Madras High Court",
      location: "Chennai",
      type: "High Court",
    },
    {
      code: "TDIS01",
      name: "Tis Hazari District Court",
      location: "Delhi",
      type: "District Court",
    },
    {
      code: "DDIS02",
      name: "Dwarka District Court",
      location: "Delhi",
      type: "District Court",
    },
    {
      code: "KDIS01",
      name: "Karkardooma District Court",
      location: "Delhi",
      type: "District Court",
    },
    {
      code: "ROHINI01",
      name: "Rohini District Court",
      location: "Delhi",
      type: "District Court",
    },
  ];
}

// Mock cases by court - TODO: Replace with real API call
export async function fetchCasesByCourt(courtCode: string): Promise<CaseListItem[]> {
  // Simulating API delay
  await new Promise((resolve) => setTimeout(resolve, 800));

  // Generate mock data based on court code
  const mockCases: Record<string, CaseListItem[]> = {
    DHC: [
      {
        crn: "DHC/2024/12345",
        case_title: "Sharma vs Union of India",
        parties: "Rajesh Sharma vs Union of India",
        filing_date: "2024-01-15",
        case_type: "Civil Writ Petition",
        case_status: "Pending",
      },
      {
        crn: "DHC/2024/12346",
        case_title: "Kumar vs State of Delhi",
        parties: "Amit Kumar vs State of Delhi",
        filing_date: "2024-02-10",
        case_type: "Criminal Appeal",
        case_status: "Listed",
      },
      {
        crn: "DHC/2024/12347",
        case_title: "Singh vs Municipal Corporation",
        parties: "Harpreet Singh vs Municipal Corporation of Delhi",
        filing_date: "2024-03-05",
        case_type: "Public Interest Litigation",
        case_status: "Pending",
      },
    ],
    BHC: [
      {
        crn: "BHC/2024/45678",
        case_title: "Patel vs Maharashtra Govt",
        parties: "Vijay Patel vs State of Maharashtra",
        filing_date: "2024-01-20",
        case_type: "Civil Writ Petition",
        case_status: "Pending",
      },
      {
        crn: "BHC/2024/45679",
        case_title: "Desai vs BMC",
        parties: "Ravi Desai vs Brihanmumbai Municipal Corporation",
        filing_date: "2024-02-15",
        case_type: "Civil Appeal",
        case_status: "Listed",
      },
    ],
    KHC: [
      {
        crn: "KHC/2024/78901",
        case_title: "Reddy vs Karnataka State",
        parties: "Venkat Reddy vs State of Karnataka",
        filing_date: "2024-01-25",
        case_type: "Criminal Writ Petition",
        case_status: "Pending",
      },
      {
        crn: "KHC/2024/78902",
        case_title: "Rao vs BBMP",
        parties: "Suresh Rao vs Bruhat Bengaluru Mahanagara Palike",
        filing_date: "2024-03-10",
        case_type: "Civil Suit",
        case_status: "Listed",
      },
    ],
    MHC: [
      {
        crn: "MHC/2024/34567",
        case_title: "Iyer vs Tamil Nadu Govt",
        parties: "Ramesh Iyer vs State of Tamil Nadu",
        filing_date: "2024-02-05",
        case_type: "Civil Writ Petition",
        case_status: "Pending",
      },
    ],
    TDIS01: [
      {
        crn: "TDIS01/2024/11111",
        case_title: "Gupta vs Verma",
        parties: "Ashok Gupta vs Ramesh Verma",
        filing_date: "2024-01-10",
        case_type: "Civil Suit",
        case_status: "Pending",
      },
      {
        crn: "TDIS01/2024/11112",
        case_title: "State vs Kapoor",
        parties: "State of Delhi vs Sunil Kapoor",
        filing_date: "2024-02-20",
        case_type: "Criminal Case",
        case_status: "Listed",
      },
    ],
    DDIS02: [
      {
        crn: "DDIS02/2024/22222",
        case_title: "Mishra vs Builder Co",
        parties: "Rakesh Mishra vs ABC Builders Pvt Ltd",
        filing_date: "2024-01-30",
        case_type: "Consumer Dispute",
        case_status: "Pending",
      },
    ],
    KDIS01: [
      {
        crn: "KDIS01/2024/33333",
        case_title: "Agarwal vs Society",
        parties: "Neha Agarwal vs DDA Housing Society",
        filing_date: "2024-02-25",
        case_type: "Property Dispute",
        case_status: "Listed",
      },
    ],
    ROHINI01: [
      {
        crn: "ROHINI01/2024/44444",
        case_title: "Chopra vs Insurance Co",
        parties: "Rajiv Chopra vs Life Insurance Corporation",
        filing_date: "2024-03-01",
        case_type: "Insurance Claim",
        case_status: "Pending",
      },
    ],
  };

  return mockCases[courtCode] || [];
}

// Mock case details - TODO: Replace with real API call
export async function fetchCaseDetails(crn: string): Promise<CaseDetails | null> {
  // Simulating API delay
  await new Promise((resolve) => setTimeout(resolve, 500));

  // Extract court code from CRN (simplified)
  const courtCode = crn.split("/")[0];

  // Mock detailed case data
  const mockDetails: Record<string, CaseDetails> = {
    "DHC/2024/12345": {
      crn: "DHC/2024/12345",
      case_title: "Sharma vs Union of India",
      parties: "Rajesh Sharma vs Union of India",
      petitioner: "Rajesh Sharma",
      respondent: "Union of India",
      filing_date: "2024-01-15",
      case_type: "Civil Writ Petition",
      case_status: "Pending",
      court_code: "DHC",
      court_name: "Delhi High Court",
      judge_name: "Justice A.K. Sharma",
      next_hearing_date: "2024-12-15",
      case_summary: "Petition filed challenging the constitutional validity of certain provisions.",
    },
    "DHC/2024/12346": {
      crn: "DHC/2024/12346",
      case_title: "Kumar vs State of Delhi",
      parties: "Amit Kumar vs State of Delhi",
      petitioner: "Amit Kumar",
      respondent: "State of Delhi",
      filing_date: "2024-02-10",
      case_type: "Criminal Appeal",
      case_status: "Listed",
      court_code: "DHC",
      court_name: "Delhi High Court",
      judge_name: "Justice B.S. Patel",
      next_hearing_date: "2024-12-20",
      case_summary: "Appeal against conviction in a criminal case.",
    },
  };

  // Return mock data or generate generic data
  if (mockDetails[crn]) {
    return mockDetails[crn];
  }

  // Generate generic details for other CRNs
  return {
    crn,
    case_title: "Case Details",
    parties: "Party A vs Party B",
    petitioner: "Party A",
    respondent: "Party B",
    filing_date: "2024-01-01",
    case_type: "General",
    case_status: "Pending",
    court_code: courtCode,
    court_name: `Court ${courtCode}`,
  };
}
