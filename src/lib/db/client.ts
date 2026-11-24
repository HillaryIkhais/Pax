import { drizzle } from "drizzle-orm/better-sqlite3";
import Database from "better-sqlite3";
import * as schema from "./schema";
import path from "node:path";
import fs from "node:fs";

const DB_DIR = path.join(process.cwd(), "data");
const DB_PATH = path.join(DB_DIR, "paxreach.sqlite");

if (!fs.existsSync(DB_DIR)) {
  fs.mkdirSync(DB_DIR, { recursive: true });
}

const sqlite = new Database(DB_PATH);
sqlite.pragma("journal_mode = WAL");
sqlite.pragma("foreign_keys = ON");

export const db = drizzle(sqlite, { schema });

export { sqlite };

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
    `CREATE TABLE IF NOT EXISTS pnrs (
      id TEXT PRIMARY KEY,
      pnr TEXT NOT NULL UNIQUE,
      surname TEXT NOT NULL,
      airline TEXT NOT NULL,
      flight_date TEXT,
      source_record_id TEXT,
      raw_payload TEXT,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    )`,
    `CREATE TABLE IF NOT EXISTS contact_ssrs (
      id TEXT PRIMARY KEY,
      pnr_id TEXT NOT NULL REFERENCES pnrs(id),
      type TEXT NOT NULL,
      passenger_ref TEXT NOT NULL,
      segment_ref TEXT,
      value TEXT,
      source_record_id TEXT,
      raw_source_text TEXT NOT NULL,
      observed_at INTEGER NOT NULL
    )`,
    `CREATE TABLE IF NOT EXISTS verified_contacts (
      id TEXT PRIMARY KEY,
      session_id TEXT NOT NULL,
      passenger_ref TEXT NOT NULL,
      email TEXT,
      phone TEXT,
      declined INTEGER NOT NULL DEFAULT 0,
      email_verified INTEGER NOT NULL DEFAULT 0,
      phone_verified INTEGER NOT NULL DEFAULT 0,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    )`,
    `CREATE TABLE IF NOT EXISTS audit_results (
      id TEXT PRIMARY KEY,
      session_id TEXT NOT NULL,
      pnr TEXT NOT NULL,
      surname TEXT NOT NULL,
      overall TEXT NOT NULL,
      raw_ssrs TEXT NOT NULL,
      passengers TEXT NOT NULL,
      created_at INTEGER NOT NULL
    )`,
    `CREATE TABLE IF NOT EXISTS repairs (
      id TEXT PRIMARY KEY,
      session_id TEXT NOT NULL,
      pnr TEXT NOT NULL,
      passenger_ref TEXT NOT NULL,
      ssr_type TEXT NOT NULL,
      value TEXT,
      approved INTEGER NOT NULL DEFAULT 0,
      persisted INTEGER NOT NULL DEFAULT 0,
      before_digest TEXT,
      after_digest TEXT,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
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
