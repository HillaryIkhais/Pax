import { drizzle } from "drizzle-orm/better-sqlite3";
import Database from "better-sqlite3";
import { migrate } from "drizzle-orm/better-sqlite3/migrator";
import * as schema from "./schema";
import path from "node:path";
import fs from "node:fs";

const DB_DIR = path.join(process.cwd(), "data");
const DB_PATH = path.join(DB_DIR, "cashcase.sqlite");

// Ensure data directory exists
if (!fs.existsSync(DB_DIR)) {
  fs.mkdirSync(DB_DIR, { recursive: true });
}

// Open a single shared SQLite connection (better-sqlite3 is synchronous)
const sqlite = new Database(DB_PATH);
sqlite.pragma("journal_mode = WAL");
sqlite.pragma("foreign_keys = ON");

export const db = drizzle(sqlite, { schema });

export type DatabaseClient = ReturnType<typeof drizzle> & { schema: typeof schema };

/* ------------------------------------------------------------------ */
/* Migrations                                                         */
/* ------------------------------------------------------------------ */

let hasRunMigrations = false;

export function runMigrations() {
  if (hasRunMigrations) return;
  const migrationsFolder = path.join(process.cwd(), "drizzle");
  try {
    migrate(db, { migrationsFolder });
  } catch {
    // Migrations folder may not exist yet; tables are created on first use below.
  }
  hasRunMigrations = true;
}

/* ------------------------------------------------------------------ */
/* Ensure tables exist (simple fallback for local/demo reproducibility) */
/* ------------------------------------------------------------------ */

function tableExists(name: string): boolean {
  const row = sqlite
    .prepare("SELECT 1 FROM sqlite_master WHERE type='table' AND name=?")
    .get(name) as { "1": number } | undefined;
  return !!row;
}

export function ensureTables() {
  const stmts = [
    `CREATE TABLE IF NOT EXISTS cases (
      id TEXT PRIMARY KEY,
      created_at INTEGER NOT NULL DEFAULT (strftime('%s','now')*1000),
      updated_at INTEGER NOT NULL DEFAULT (strftime('%s','now')*1000),
      atm_type TEXT NOT NULL,
      bank_name TEXT NOT NULL,
      transaction_date_time TEXT NOT NULL,
      timezone TEXT NOT NULL DEFAULT 'Africa/Lagos',
      amount_debited REAL NOT NULL,
      amount_dispensed REAL NOT NULL DEFAULT 0,
      atm_location TEXT NOT NULL,
      atm_operator TEXT,
      terminal_id TEXT,
      transaction_reference TEXT,
      bank_complaint_reference TEXT,
      ccms_reference TEXT,
      evidence_alert_url TEXT,
      evidence_receipt_url TEXT,
      evidence_hash TEXT,
      evidence_version INTEGER NOT NULL DEFAULT 1,
      status TEXT NOT NULL DEFAULT 'DRAFT',
      demo_clock_override INTEGER
    )`,
    `CREATE TABLE IF NOT EXISTS evidence_versions (
      id TEXT PRIMARY KEY,
      case_id TEXT NOT NULL REFERENCES cases(id),
      version INTEGER NOT NULL,
      field TEXT NOT NULL,
      source_url TEXT NOT NULL,
      hash TEXT NOT NULL,
      size INTEGER NOT NULL,
      page TEXT,
      region TEXT,
      extracted_value TEXT,
      created_at INTEGER NOT NULL DEFAULT (strftime('%s','now')*1000)
    )`,
    `CREATE TABLE IF NOT EXISTS state_transitions (
      id TEXT PRIMARY KEY,
      case_id TEXT NOT NULL REFERENCES cases(id),
      from_status TEXT NOT NULL,
      to_status TEXT NOT NULL,
      reason TEXT,
      actor TEXT NOT NULL DEFAULT 'system',
      created_at INTEGER NOT NULL DEFAULT (strftime('%s','now')*1000)
    )`,
    `CREATE TABLE IF NOT EXISTS __drizzle_migrations (
      uuid TEXT PRIMARY KEY,
      created_at INTEGER NOT NULL DEFAULT (strftime('%s','now')*1000)
    )`,
  ];
  for (const sql of stmts) {
    sqlite.exec(sql);
  }
}

ensureTables();

export { sqlite };
