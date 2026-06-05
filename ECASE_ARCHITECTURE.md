# eCase Integration Architecture

## System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         User Interface                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Dashboard Page              Import eCase Page                   │
│  ├── Import Button           ├── Step 1: CourtSelector          │
│                              ├── Step 2: Fetch Cases Button      │
│  Cases List Page             ├── Step 3: CRNList                │
│  ├── CRN Column              ├── Step 4: ClientAttachmentForm   │
│  ├── Import Source Badge     └── Step 5: Success Message        │
│                                                                  │
│  Edit Case Page                                                  │
│  ├── CRN Display                                                 │
│  ├── Court Code Display                                          │
│  └── Import Source Badge                                         │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      API Routes (Next.js)                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  GET  /api/ecase/courts                                          │
│       └── Returns list of available courts                       │
│                                                                  │
│  POST /api/ecase/cases                                           │
│       └── Returns cases for a specific court                     │
│                                                                  │
│  POST /api/ecase/import                                          │
│       └── Imports selected cases and creates/updates clients     │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Business Logic Layer                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  lib/ecase.ts                    lib/db.ts                       │
│  ├── fetchCourts()               ├── createClient()             │
│  ├── fetchCasesByCourt()         ├── updateClientCRN()          │
│  └── fetchCaseDetails()          ├── getClientByCRN()           │
│      (Mock data for now)         └── getAllClientsWithCRN()     │
│                                                                  │
│  lib/auth.ts                                                     │
│  └── getCurrentUser()                                            │
│      (JWT authentication)                                        │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                       Database Layer                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  PostgreSQL (Supabase)                                           │
│                                                                  │
│  clients table:                                                  │
│  ├── id (PK)                                                     │
│  ├── user_id (FK)                                                │
│  ├── client_name                                                 │
│  ├── client_whatsapp                                             │
│  ├── case_title                                                  │
│  ├── court_name                                                  │
│  ├── crn                        ← NEW: eCase CRN                 │
│  ├── ecase_court_code           ← NEW: Court code                │
│  ├── import_source              ← NEW: 'manual' or 'ecase'       │
│  ├── ecase_metadata (JSONB)     ← NEW: Additional metadata       │
│  ├── created_at                                                  │
│  └── updated_at                                                  │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

## Data Flow: Import Process

```
1. User Flow
   ┌──────────────────────────────────────────────────┐
   │ User navigates to /dashboard/import-ecase        │
   └────────────────────┬─────────────────────────────┘
                        ▼
   ┌──────────────────────────────────────────────────┐
   │ CourtSelector fetches courts from API            │
   │ GET /api/ecase/courts → lib/ecase.ts            │
   └────────────────────┬─────────────────────────────┘
                        ▼
   ┌──────────────────────────────────────────────────┐
   │ User selects court (e.g., "DHC")                 │
   └────────────────────┬─────────────────────────────┘
                        ▼
   ┌──────────────────────────────────────────────────┐
   │ Clicks "Fetch Cases" button                      │
   │ POST /api/ecase/cases {court_code: "DHC"}       │
   │ → lib/ecase.fetchCasesByCourt("DHC")            │
   └────────────────────┬─────────────────────────────┘
                        ▼
   ┌──────────────────────────────────────────────────┐
   │ CRNList displays cases with checkboxes           │
   │ User selects cases to import                     │
   └────────────────────┬─────────────────────────────┘
                        ▼
   ┌──────────────────────────────────────────────────┐
   │ ClientAttachmentForm shows for each case         │
   │ User chooses: Create New or Attach Existing      │
   └────────────────────┬─────────────────────────────┘
                        ▼
   ┌──────────────────────────────────────────────────┐
   │ Clicks "Import Cases" button                     │
   │ POST /api/ecase/import {cases: [...]}           │
   └────────────────────┬─────────────────────────────┘
                        ▼
   ┌──────────────────────────────────────────────────┐
   │ For each case:                                   │
   │ ├── Check if CRN already exists                  │
   │ ├── Create new client OR update existing         │
   │ └── Store eCase metadata                         │
   └────────────────────┬─────────────────────────────┘
                        ▼
   ┌──────────────────────────────────────────────────┐
   │ Success! Display summary                         │
   │ └── "N cases imported, M created, P updated"     │
   └────────────────────┬─────────────────────────────┘
                        ▼
   ┌──────────────────────────────────────────────────┐
   │ User can:                                        │
   │ ├── View All Cases                               │
   │ └── Import More Cases                            │
   └──────────────────────────────────────────────────┘
```

## Component Hierarchy

```
/dashboard/import-ecase
└── ImportECasePage
    ├── Progress Indicator (Steps 1-4)
    ├── Error/Success Messages
    └── Conditional Rendering:
        ├── Step 1: CourtSelector
        │   ├── Fetches courts on mount
        │   └── Dropdown select
        │
        ├── Step 2: Fetch Button
        │   └── Triggers case fetch
        │
        ├── Step 3: CRNList
        │   ├── Checkbox for each case
        │   ├── Select All checkbox
        │   └── Already imported indicator
        │
        ├── Step 4: ClientAttachmentForm
        │   └── For each selected case:
        │       ├── Radio: Create New
        │       │   ├── Client Name input
        │       │   └── WhatsApp input
        │       │
        │       └── Radio: Attach Existing
        │           └── Client dropdown
        │
        └── Step 5: Success Screen
            ├── Success icon
            ├── Summary message
            └── Action buttons
```

## Key Features

### 1. Multi-Step Workflow
- Clear progress indication
- Back navigation support
- State management between steps

### 2. Data Validation
- Client-side validation in forms
- Server-side validation in API routes
- Database constraint checking

### 3. Error Handling
- User-friendly error messages
- Graceful degradation
- Partial success reporting

### 4. Security
- JWT authentication on all routes
- User-scoped data access
- Input sanitization

### 5. User Experience
- Loading states
- Success feedback
- Responsive design
- Accessible forms

## Integration with Existing System

### Dashboard Navigation
- New sidebar item: "Import from eCase"
- New quick action button
- Consistent styling

### Cases Display
- CRN column in table
- Import source badges
- Filtered search includes CRN

### Case Details
- CRN displayed prominently
- Court code shown
- eCase metadata accessible
- Import source indicated

## Mock Data Structure

### Courts
```typescript
{
  code: "DHC",
  name: "Delhi High Court",
  location: "New Delhi",
  type: "High Court"
}
```

### Cases
```typescript
{
  crn: "DHC/2024/12345",
  case_title: "Sharma vs Union of India",
  parties: "Rajesh Sharma vs Union of India",
  filing_date: "2024-01-15",
  case_type: "Civil Writ Petition",
  case_status: "Pending"
}
```

### Case Metadata (stored in JSONB)
```typescript
{
  parties: string,
  filing_date: string,
  case_type: string,
  case_status: string,
  petitioner?: string,
  respondent?: string
}
```

## Future API Integration

When real eCase API is available:

1. Update `src/lib/ecase.ts`
2. Replace mock functions with actual API calls
3. Add API credentials to `.env`
4. Update error handling for API failures
5. Add retry logic and rate limiting
6. Implement webhook listeners for updates

Example:
```typescript
// Future implementation
export async function fetchCourts(): Promise<Court[]> {
  const response = await fetch(`${ECASE_API_URL}/courts`, {
    headers: {
      'Authorization': `Bearer ${ECASE_API_KEY}`,
      'Content-Type': 'application/json'
    }
  });
  return response.json();
}
```
