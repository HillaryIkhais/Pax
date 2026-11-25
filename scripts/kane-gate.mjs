/* ------------------------------------------------------------------ */
/* PAX — Kane Stop gate                                          */
/*                                                                     */
/* Blocks agent completion until all Kane verification flows pass.     */
/* Runs all flows in a real Chrome browser. Exits 0 only if all pass,  */
/* exits 2 if any flow fails (involuntary gate).                       */
/*                                                                     */
/* Usage: node scripts/kane-gate.mjs                                   */
/* ------------------------------------------------------------------ */

import { runAllFlows } from "./kane-hook.mjs";

async function main() {
  const { results, allPassed } = await runAllFlows();
  for (const r of results) {
    const status = r.passed ? "PASS" : "FAIL";
    console.log(`[kane-gate] ${r.flow}: ${status} (exit ${r.exitCode})`);
    if (!r.passed && r.failure) {
      console.log(`[kane-gate]   ${r.failure.reason}`);
      console.log(`[kane-gate]   Evidence: .testmuai/evidence/${r.flow}/latest.json`);
    }
  }
  if (allPassed) {
    console.log("[kane-gate] All flows green. Gate releases.");
    process.exit(0);
  } else {
    console.log("[kane-gate] Some flows red. Gate blocks completion.");
    process.exit(2);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(2);
});
