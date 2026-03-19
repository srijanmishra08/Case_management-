import { sql } from "@vercel/postgres";

// ===== Database Initialization =====

let initialized = false;

export async function ensureDbInitialized(): Promise<void> {
  if (initialized) return;

  await sql`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      name TEXT NOT NULL,
      firm_name TEXT DEFAULT 'Law Office',
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS clients (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id),
      client_name TEXT NOT NULL,
      client_whatsapp TEXT NOT NULL,
      case_title TEXT NOT NULL,
      court_name TEXT NOT NULL,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS hearings (
      id TEXT PRIMARY KEY,
      client_id TEXT NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
      hearing_date TEXT NOT NULL,
      next_hearing_date TEXT,
      purpose_of_hearing TEXT,
      special_notes TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `;

  // Indexes (CREATE INDEX IF NOT EXISTS is supported in Postgres)
  await sql`CREATE INDEX IF NOT EXISTS idx_clients_user_id ON clients(user_id)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_hearings_client_id ON hearings(client_id)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_hearings_next_date ON hearings(next_hearing_date)`;

  initialized = true;
}

// ===== Client Operations =====

export interface ClientRecord {
  id: string;
  user_id: string;
  client_name: string;
  client_whatsapp: string;
  case_title: string;
  court_name: string;
  created_at: string;
  updated_at: string;
}

export async function createClient(data: Omit<ClientRecord, "created_at" | "updated_at">): Promise<ClientRecord> {
  await ensureDbInitialized();
  const { rows } = await sql`
    INSERT INTO clients (id, user_id, client_name, client_whatsapp, case_title, court_name)
    VALUES (${data.id}, ${data.user_id}, ${data.client_name}, ${data.client_whatsapp}, ${data.case_title}, ${data.court_name})
    RETURNING *
  `;
  return rows[0] as ClientRecord;
}

export async function updateClient(
  id: string,
  data: Partial<Pick<ClientRecord, "client_name" | "client_whatsapp" | "case_title" | "court_name">>
): Promise<ClientRecord | null> {
  await ensureDbInitialized();

  // Build update dynamically — but Vercel Postgres uses tagged templates,
  // so we do conditional full-column update (safe since we pass current values for unchanged fields)
  const current = await getClientById(id);
  if (!current) return null;

  const client_name = data.client_name ?? current.client_name;
  const client_whatsapp = data.client_whatsapp ?? current.client_whatsapp;
  const case_title = data.case_title ?? current.case_title;
  const court_name = data.court_name ?? current.court_name;

  const { rows } = await sql`
    UPDATE clients
    SET client_name = ${client_name},
        client_whatsapp = ${client_whatsapp},
        case_title = ${case_title},
        court_name = ${court_name},
        updated_at = NOW()
    WHERE id = ${id}
    RETURNING *
  `;
  return (rows[0] as ClientRecord) || null;
}

export async function getClientById(id: string): Promise<ClientRecord | null> {
  await ensureDbInitialized();
  const { rows } = await sql`SELECT * FROM clients WHERE id = ${id}`;
  return (rows[0] as ClientRecord) || null;
}

export async function getClientsByUserId(userId: string): Promise<ClientRecord[]> {
  await ensureDbInitialized();
  const { rows } = await sql`SELECT * FROM clients WHERE user_id = ${userId} ORDER BY updated_at DESC`;
  return rows as ClientRecord[];
}

export async function deleteClient(id: string): Promise<void> {
  await ensureDbInitialized();
  await sql`DELETE FROM clients WHERE id = ${id}`;
}

// ===== Hearing Operations =====

export interface HearingRecord {
  id: string;
  client_id: string;
  hearing_date: string;
  next_hearing_date: string | null;
  purpose_of_hearing: string | null;
  special_notes: string | null;
  created_at: string;
}

export async function createHearing(data: Omit<HearingRecord, "created_at">): Promise<HearingRecord> {
  await ensureDbInitialized();
  const { rows } = await sql`
    INSERT INTO hearings (id, client_id, hearing_date, next_hearing_date, purpose_of_hearing, special_notes)
    VALUES (${data.id}, ${data.client_id}, ${data.hearing_date}, ${data.next_hearing_date}, ${data.purpose_of_hearing}, ${data.special_notes})
    RETURNING *
  `;

  // Update client's updated_at timestamp
  await sql`UPDATE clients SET updated_at = NOW() WHERE id = ${data.client_id}`;

  return rows[0] as HearingRecord;
}

export async function getHearingById(id: string): Promise<HearingRecord | null> {
  await ensureDbInitialized();
  const { rows } = await sql`SELECT * FROM hearings WHERE id = ${id}`;
  return (rows[0] as HearingRecord) || null;
}

export async function getHearingsByClientId(clientId: string): Promise<HearingRecord[]> {
  await ensureDbInitialized();
  const { rows } = await sql`SELECT * FROM hearings WHERE client_id = ${clientId} ORDER BY created_at DESC`;
  return rows as HearingRecord[];
}

export async function getLatestHearingByClientId(clientId: string): Promise<HearingRecord | null> {
  await ensureDbInitialized();
  const { rows } = await sql`SELECT * FROM hearings WHERE client_id = ${clientId} ORDER BY created_at DESC LIMIT 1`;
  return (rows[0] as HearingRecord) || null;
}

export async function deleteHearing(id: string): Promise<void> {
  await ensureDbInitialized();
  await sql`DELETE FROM hearings WHERE id = ${id}`;
}

/** Get all hearings across all clients where next_hearing_date matches the given date */
export async function getHearingsWithUpcomingDate(
  dateStr: string
): Promise<(HearingRecord & { client_name: string; client_whatsapp: string; case_title: string; court_name: string })[]> {
  await ensureDbInitialized();
  const { rows } = await sql`
    SELECT h.*, c.client_name, c.client_whatsapp, c.case_title, c.court_name
    FROM hearings h
    JOIN clients c ON h.client_id = c.id
    WHERE h.next_hearing_date = ${dateStr}
  `;
  return rows as (HearingRecord & { client_name: string; client_whatsapp: string; case_title: string; court_name: string })[];
}

// ===== User Operations =====

export interface UserRecord {
  id: string;
  email: string;
  password_hash: string;
  name: string;
  firm_name: string;
  created_at: string;
}

export async function createUser(data: Omit<UserRecord, "created_at">): Promise<UserRecord> {
  await ensureDbInitialized();
  const { rows } = await sql`
    INSERT INTO users (id, email, password_hash, name, firm_name)
    VALUES (${data.id}, ${data.email}, ${data.password_hash}, ${data.name}, ${data.firm_name})
    RETURNING *
  `;
  return rows[0] as UserRecord;
}

export async function getUserByEmail(email: string): Promise<UserRecord | null> {
  await ensureDbInitialized();
  const { rows } = await sql`SELECT * FROM users WHERE email = ${email}`;
  return (rows[0] as UserRecord) || null;
}

export async function getUserById(id: string): Promise<UserRecord | null> {
  await ensureDbInitialized();
  const { rows } = await sql`SELECT * FROM users WHERE id = ${id}`;
  return (rows[0] as UserRecord) || null;
}
