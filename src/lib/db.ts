import Database from "better-sqlite3";
import path from "path";

const DB_PATH = path.join(process.cwd(), "data", "cases.db");

let db: Database.Database | null = null;

export function getDb(): Database.Database {
  if (!db) {
    const fs = require("fs");
    const dir = path.dirname(DB_PATH);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    db = new Database(DB_PATH);
    db.pragma("journal_mode = WAL");
    db.pragma("foreign_keys = ON");
    initializeDatabase(db);
  }
  return db;
}

function initializeDatabase(db: Database.Database) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      name TEXT NOT NULL,
      firm_name TEXT DEFAULT 'Law Office',
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS clients (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      client_name TEXT NOT NULL,
      client_whatsapp TEXT NOT NULL,
      case_title TEXT NOT NULL,
      court_name TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS hearings (
      id TEXT PRIMARY KEY,
      client_id TEXT NOT NULL,
      hearing_date TEXT NOT NULL,
      next_hearing_date TEXT,
      purpose_of_hearing TEXT,
      special_notes TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_clients_user_id ON clients(user_id);
    CREATE INDEX IF NOT EXISTS idx_hearings_client_id ON hearings(client_id);
    CREATE INDEX IF NOT EXISTS idx_hearings_next_date ON hearings(next_hearing_date);
  `);
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

export function createClient(data: Omit<ClientRecord, "created_at" | "updated_at">): ClientRecord {
  const db = getDb();
  db.prepare(`
    INSERT INTO clients (id, user_id, client_name, client_whatsapp, case_title, court_name)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(data.id, data.user_id, data.client_name, data.client_whatsapp, data.case_title, data.court_name);
  return getClientById(data.id)!;
}

export function updateClient(
  id: string,
  data: Partial<Pick<ClientRecord, "client_name" | "client_whatsapp" | "case_title" | "court_name">>
): ClientRecord | null {
  const db = getDb();
  const fields: string[] = [];
  const values: unknown[] = [];

  for (const [key, value] of Object.entries(data)) {
    if (value !== undefined) {
      fields.push(`${key} = ?`);
      values.push(value);
    }
  }
  if (fields.length === 0) return getClientById(id);

  fields.push("updated_at = datetime('now')");
  values.push(id);
  db.prepare(`UPDATE clients SET ${fields.join(", ")} WHERE id = ?`).run(...values);
  return getClientById(id);
}

export function getClientById(id: string): ClientRecord | null {
  const db = getDb();
  return (db.prepare("SELECT * FROM clients WHERE id = ?").get(id) as ClientRecord) || null;
}

export function getClientsByUserId(userId: string): ClientRecord[] {
  const db = getDb();
  return db.prepare("SELECT * FROM clients WHERE user_id = ? ORDER BY updated_at DESC").all(userId) as ClientRecord[];
}

export function deleteClient(id: string): void {
  const db = getDb();
  db.prepare("DELETE FROM clients WHERE id = ?").run(id);
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

export function createHearing(data: Omit<HearingRecord, "created_at">): HearingRecord {
  const db = getDb();
  db.prepare(`
    INSERT INTO hearings (id, client_id, hearing_date, next_hearing_date, purpose_of_hearing, special_notes)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(data.id, data.client_id, data.hearing_date, data.next_hearing_date, data.purpose_of_hearing, data.special_notes);

  // Update client's updated_at timestamp
  db.prepare("UPDATE clients SET updated_at = datetime('now') WHERE id = ?").run(data.client_id);

  return getHearingById(data.id)!;
}

export function getHearingById(id: string): HearingRecord | null {
  const db = getDb();
  return (db.prepare("SELECT * FROM hearings WHERE id = ?").get(id) as HearingRecord) || null;
}

export function getHearingsByClientId(clientId: string): HearingRecord[] {
  const db = getDb();
  return db.prepare("SELECT * FROM hearings WHERE client_id = ? ORDER BY created_at DESC").all(clientId) as HearingRecord[];
}

export function getLatestHearingByClientId(clientId: string): HearingRecord | null {
  const db = getDb();
  return (db.prepare("SELECT * FROM hearings WHERE client_id = ? ORDER BY created_at DESC LIMIT 1").get(clientId) as HearingRecord) || null;
}

export function deleteHearing(id: string): void {
  const db = getDb();
  db.prepare("DELETE FROM hearings WHERE id = ?").run(id);
}

/** Get all hearings across all clients where next_hearing_date matches the given date */
export function getHearingsWithUpcomingDate(dateStr: string): (HearingRecord & { client_name: string; client_whatsapp: string; case_title: string; court_name: string })[] {
  const db = getDb();
  return db.prepare(`
    SELECT h.*, c.client_name, c.client_whatsapp, c.case_title, c.court_name
    FROM hearings h
    JOIN clients c ON h.client_id = c.id
    WHERE h.next_hearing_date = ?
  `).all(dateStr) as (HearingRecord & { client_name: string; client_whatsapp: string; case_title: string; court_name: string })[];
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

export function createUser(data: Omit<UserRecord, "created_at">): UserRecord {
  const db = getDb();
  db.prepare(
    "INSERT INTO users (id, email, password_hash, name, firm_name) VALUES (?, ?, ?, ?, ?)"
  ).run(data.id, data.email, data.password_hash, data.name, data.firm_name);
  return getUserById(data.id)!;
}

export function getUserByEmail(email: string): UserRecord | null {
  const db = getDb();
  return (db.prepare("SELECT * FROM users WHERE email = ?").get(email) as UserRecord) || null;
}

export function getUserById(id: string): UserRecord | null {
  const db = getDb();
  return (db.prepare("SELECT * FROM users WHERE id = ?").get(id) as UserRecord) || null;
}
