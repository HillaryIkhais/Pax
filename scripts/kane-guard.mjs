/* ------------------------------------------------------------------ */
/* PAX — Kane PreToolUse guard                                   */
/*                                                                     */
/* Denies writes to test flows and sealed evidence recordings.         */
/* The cheapest way to turn red into green is to weaken the test,      */
/* so that route is closed first.                                      */
/*                                                                     */
/* Usage: node scripts/kane-guard.mjs <file-path>                      */
/* Exits 0 if the write is allowed, 1 if denied.                       */
/* ------------------------------------------------------------------ */

import * as fs from "node:fs";
import * as path from "node:path";

const PROTECTED_PATTERNS = [
  /^tests\/kane\/.*\.test\.md$/,
  /^tests\/kane\/.*\.md$/,
  /^\.testmuai\/evidence\/.*$/,
  /^scripts\/kane-hook\.mjs$/,
  /^scripts\/kane-guard\.mjs$/,
];

const filePath = process.argv[2];

if (!filePath) {
  console.error("Usage: node scripts/kane-guard.mjs <file-path>");
  process.exit(1);
}

const normalized = filePath.replace(/\\/g, "/");

for (const pattern of PROTECTED_PATTERNS) {
  if (pattern.test(normalized)) {
    console.error(`[kane-guard] DENIED: ${filePath}`);
    console.error("[kane-guard] Test flows and evidence recordings are protected.");
    console.error("[kane-guard] Do not weaken tests to turn red into green.");
    process.exit(1);
  }
}

console.log(`[kane-guard] ALLOWED: ${filePath}`);
process.exit(0);
