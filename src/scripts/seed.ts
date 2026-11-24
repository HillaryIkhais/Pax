/* ------------------------------------------------------------------ */
/* Seed the Carrier Sandbox database with demo PNRs.                  */
/* Run: npx tsx src/scripts/seed.ts                                   */
/* ------------------------------------------------------------------ */

import { db, sqlite } from "@/lib/db/client";
import { pnrs, contactSsrs } from "@/lib/db/schema";
import { SEED_PNRS, SEED_SSRS, FALSE_SAVE_SEED, FALSE_SAVE_SSRS } from "@/lib/db/seed";

async function main() {
  sqlite.exec("DELETE FROM contact_ssrs");
  sqlite.exec("DELETE FROM pnrs");

  const now = Date.now();

  const allPnrs = [...SEED_PNRS, FALSE_SAVE_SEED];
  const allSsrs = [...SEED_SSRS, ...FALSE_SAVE_SSRS];

  for (const pnr of allPnrs) {
    const [inserted] = await db.insert(pnrs).values(pnr).returning();
    const pnrId = inserted.id;
    const related = allSsrs.filter((s) => s.pnr === pnr.pnr);
    for (const s of related) {
      const { pnr: _pnr, ...ssr } = s;
      await db.insert(contactSsrs).values({ ...ssr, pnrId, observedAt: now });
    }
  }

  console.log("Seeded PNRs:");
  for (const p of allPnrs) {
    console.log("  ", p.pnr, p.surname, p.airline);
  }
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
