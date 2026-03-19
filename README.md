# Legal Case Management

A web application for lawyers to manage cases and automatically send WhatsApp case updates to clients via Twilio.

## Features

- **Dashboard** — Overview of all cases with urgent hearing highlights
- **Case Management** — Add, edit, update, and delete cases
- **WhatsApp Notifications** — Auto-generate and send professional case update messages to clients
- **Message Preview** — Preview the WhatsApp message before sending to prevent accidental messages
- **Hearing Reminders** — Daily cron job sends reminders for hearings happening the next day
- **Authentication** — Simple email/password login system

## Tech Stack

| Layer      | Technology                      |
| ---------- | ------------------------------- |
| Frontend   | Next.js 15 (App Router) + TailwindCSS |
| Backend    | Next.js API Routes              |
| Database   | SQLite (via better-sqlite3)     |
| Messaging  | Twilio WhatsApp API             |
| Deployment | Vercel                          |

## Getting Started

### 1. Clone and Install

```bash
git clone <your-repo-url>
cd case_management
npm install
```

### 2. Configure Environment Variables

Copy the example env file and fill in your values:

```bash
cp .env.example .env.local
```

Edit `.env.local`:

```env
# Twilio (get from https://console.twilio.com)
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_WHATSAPP_NUMBER=whatsapp:+14155238886

# Auth
JWT_SECRET=generate-a-long-random-string-here

# Cron protection
CRON_SECRET=another-random-secret

# Lawyer's number for receiving reminders
LAWYER_WHATSAPP_NUMBER=whatsapp:+91XXXXXXXXXX
```

### 3. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) and register a new account.

## Twilio WhatsApp Setup

1. Sign up at [twilio.com](https://www.twilio.com/)
2. Go to **Messaging → Try it out → Send a WhatsApp message**
3. Follow the sandbox setup instructions (send the join code from your WhatsApp)
4. Copy your Account SID, Auth Token, and sandbox number to `.env.local`
5. For production, apply for a Twilio WhatsApp Business Profile

> **Note:** In sandbox mode, clients must first send the join message to your Twilio sandbox number before they can receive messages.

## Workflow

1. **Lawyer logs in** to the dashboard
2. **Adds a case** with client name, WhatsApp number, case details, and hearing dates
3. **Updates a hearing** — clicks "Update Hearing" on any case
4. **Previews the message** — after saving, a WhatsApp message preview appears
5. **Sends via WhatsApp** — clicks "Send WhatsApp" to deliver the update to the client

Everything after clicking "Save" is automatic — preview is generated, one click to send.

## Deployment to Vercel

### 1. Push to GitHub

```bash
git add -A
git commit -m "Initial commit"
git push origin main
```

### 2. Import to Vercel

1. Go to [vercel.com/new](https://vercel.com/new)
2. Import your GitHub repository
3. Add all environment variables from `.env.local` in the Vercel dashboard
4. Deploy

### 3. Database Note

SQLite works on Vercel with serverless functions but **data does not persist across deployments** since Vercel uses ephemeral containers. For production, consider:

- **Turso** (SQLite-compatible, edge-hosted) — drop-in replacement
- **Supabase** (PostgreSQL) — swap `better-sqlite3` for `@supabase/supabase-js`
- **PlanetScale** (MySQL) — use `@planetscale/database`

### 4. Cron Job

The `vercel.json` configures a daily cron at 7:00 AM UTC hitting `/api/reminder-cron`. This checks for hearings scheduled for the next day and sends WhatsApp reminders to the lawyer.

Set `CRON_SECRET` in Vercel environment variables to secure the endpoint.

## Project Structure

```
src/
├── app/
│   ├── api/
│   │   ├── auth/
│   │   │   ├── login/route.ts
│   │   │   ├── logout/route.ts
│   │   │   ├── register/route.ts
│   │   │   └── me/route.ts
│   │   ├── cases/
│   │   │   ├── route.ts            # GET (list), POST (create)
│   │   │   └── [id]/route.ts       # GET, PUT, DELETE
│   │   ├── send-whatsapp/route.ts
│   │   └── reminder-cron/route.ts
│   ├── dashboard/
│   │   ├── layout.tsx              # Sidebar + auth guard
│   │   ├── page.tsx                # Dashboard home
│   │   ├── cases/page.tsx          # All cases table
│   │   ├── add-case/page.tsx       # New case form
│   │   └── edit-case/[id]/page.tsx # Edit/update hearing
│   ├── login/page.tsx
│   └── page.tsx                    # Redirects to /dashboard
├── components/
│   └── CaseForm.tsx                # Shared form with preview
├── lib/
│   ├── auth.ts                     # JWT + bcrypt auth
│   ├── db.ts                       # SQLite schema + CRUD
│   ├── messages.ts                 # Message templates (client-safe)
│   └── twilio.ts                   # Twilio WhatsApp sender
└── middleware.ts                   # Auth redirect middleware
```

## Database Schema

```sql
CREATE TABLE users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  name TEXT NOT NULL,
  firm_name TEXT DEFAULT 'Law Office',
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE cases (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  client_name TEXT NOT NULL,
  client_whatsapp TEXT NOT NULL,
  case_title TEXT NOT NULL,
  court_name TEXT NOT NULL,
  previous_hearing_date TEXT,
  next_hearing_date TEXT,
  purpose_of_hearing TEXT,
  special_notes TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (user_id) REFERENCES users(id)
);
```

## License

MIT
