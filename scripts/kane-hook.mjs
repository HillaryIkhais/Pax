/* ------------------------------------------------------------------ */
/* PAXREACH — Involuntary Kane CLI hook                               */
/*                                                                     */
/* Fires Kane CLI in a real Chrome browser on every save to app files. */
/* On failure, injects the failure into agent context and saves        */
/* sealed evidence. On pass, updates the last-green state.             */
/*                                                                     */
/* This is the Closed Loop: agent builds → Kane verifies → agent       */
/* re-prompts based on Kane's failure → Kane re-verifies.              */
/* Involuntary: the runtime fires it on every save, not at the         */
/* model's discretion.                                                 */
/* ------------------------------------------------------------------ */

import { spawn } from "node:child_process";
import * as fs from "node:fs";
import * as path from "node:path";
import * as chokidar from "chokidar";

const APP_URL = process.env.PAXREACH_URL || "http://localhost:3000";
const KANE = "kane-cli";
const EVIDENCE_DIR = path.join(process.cwd(), ".testmuai", "evidence");
const HOOK_STATE_DIR = path.join(process.cwd(), ".testmuai", "hook-state");
const TEST_GLOBS = ["src/app/**", "src/lib/**", "tests/kane/**"];
const IGNORE_GLOBS = ["**/node_modules/**", "**/.next/**", "**/.testmuai/evidence/**"];

fs.mkdirSync(EVIDENCE_DIR, { recursive: true });
fs.mkdirSync(HOOK_STATE_DIR, { recursive: true });

const FLOWS = [
  { name: "agency-only", file: "tests/kane/01-agency-only.test.md" },
  { name: "misassigned", file: "tests/kane/03-misassigned.test.md" },
  { name: "declined", file: "tests/kane/04-declined.test.md" },
  { name: "already-correct", file: "tests/kane/05-already-correct.test.md" },
  { name: "false-save", file: "tests/kane/02-false-save.test.md" },
];

/* ------------------------------------------------------------------ */
/* Run one Kane flow and return parsed result                         */
/* ------------------------------------------------------------------ */

function runKaneFlow(flow) {
  return new Promise((resolve) => {
    const started = Date.now();
    const stdoutChunks = [];
    const stderrChunks = [];

    const child = spawn(
      KANE,
      [
        "run",
        fs.readFileSync(flow.file, "utf8"),
        "--url",
        APP_URL,
        "--agent",
        "--final-validation",
        "on",
        "--mode",
        "action",
        "--headless",
      ],
      { env: { ...process.env, NEXT_PUBLIC_FALSE_SAVE_PNR: "FS7777" } }
    );

    let stdout = "";
    let stderr = "";

    child.stdout.on("data", (d) => { stdout += d.toString(); stdoutChunks.push(d); });
    child.stderr.on("data", (d) => { stderr += d.toString(); stderrChunks.push(d); });

    child.on("close", (code) => {
      const result = parseKaneResult(stdout, code, started, flow);
      saveEvidence(flow.name, result);
      resolve(result);
    });
  });
}

function parseKaneResult(stdout, exitCode, started, flow) {
  const lines = stdout.split("\n").filter(Boolean);
  const events = [];
  let pass = null;
  let finalValidation = null;
  let failureStep = null;
  let failureReason = null;

  for (const line of lines) {
    try {
      const ev = JSON.parse(line);
      events.push(ev);
      if (ev.step !== undefined) {
        if (ev.status === "failed") {
          failureStep = ev.step;
          failureReason = ev.remark;
        }
      }
      if (ev.type === "run_end" || ev.status !== undefined && ev.step === undefined) {
        pass = ev.pass ?? ev.ok ?? pass;
        finalValidation = ev.finalValidation ?? ev.final_validation ?? finalValidation;
        failureReason = ev.reason ?? failureReason;
      }
    } catch {
      // non-JSON lines (progress UI to stderr, etc.)
    }
  }

  const failed = exitCode !== 0 || pass === false || finalValidation === false;

  return {
    flow: flow.name,
    file: flow.file,
    exitCode,
    passed: !failed,
    pass,
    finalValidation,
    failureStep,
    failureReason,
    failure: failed ? { exitCode, reason: failureReason, step: failureStep } : null,
    events,
    durationMs: Date.now() - started,
    timestamp: new Date().toISOString(),
  };
}

/* ------------------------------------------------------------------ */
/* Save sealed evidence pack                                          */
/* ------------------------------------------------------------------ */

function saveEvidence(flowName, result) {
  const dir = path.join(EVIDENCE_DIR, flowName);
  fs.mkdirSync(dir, { recursive: true });
  const ts = new Date().toISOString().replace(/[:.]/g, "-");
  fs.writeFileSync(path.join(dir, `run-${ts}.json`), JSON.stringify(result, null, 2));

  /* Also save a "latest" symlink-equivalent */
  fs.writeFileSync(path.join(dir, "latest.json"), JSON.stringify(result, null, 2));

  /* Update hook state: last result per flow */
  const stateFile = path.join(HOOK_STATE_DIR, "last-results.json");
  let state = {};
  if (fs.existsSync(stateFile)) {
    try { state = JSON.parse(fs.readFileSync(stateFile, "utf8")); } catch {}
  }
  state[flowName] = {
    passed: result.passed,
    exitCode: result.exitCode,
    timestamp: result.timestamp,
    durationMs: result.durationMs,
  };
  fs.writeFileSync(stateFile, JSON.stringify(state, null, 2));
}

/* ------------------------------------------------------------------ */
/* Run all flows and return overall result                            */
/* ------------------------------------------------------------------ */

export async function runAllFlows() {
  const results = [];
  let allPassed = true;

  for (const flow of FLOWS) {
    const result = await runKaneFlow(flow);
    results.push(result);
    if (!result.passed) allPassed = false;
  }

  return { results, allPassed };
}

/* ------------------------------------------------------------------ */
/* Watch mode: fire Kane on every save                                */
/* ------------------------------------------------------------------ */

function startWatch() {
  console.log("[kane-hook] Watch mode active. Firing Kane on saves to:", TEST_GLOBS.join(", "));

  const watcher = chokidar.watch(TEST_GLOBS, {
    ignored: IGNORE_GLOBS,
    persistent: true,
    ignoreInitial: true,
  });

  let debounceTimer = null;

  watcher.on("change", (filePath) => {
    console.log(`[kane-hook] File changed: ${filePath}`);
    if (debounceTimer) clearTimeout(debounceTimer);
    debounceTimer = setTimeout(async () => {
      console.log("[kane-hook] Running Kane verification flows...");
      const { results, allPassed } = await runAllFlows();
      for (const r of results) {
        const status = r.passed ? "PASS" : "FAIL";
        console.log(`[kane-hook] ${r.flow}: ${status} (exit ${r.exitCode})`);
        if (!r.passed && r.failure) {
          console.log(`[kane-hook]   Failure: ${r.failure.reason}`);
          console.log(`[kane-hook]   Evidence: .testmuai/evidence/${r.flow}/latest.json`);
        }
      }
      if (allPassed) {
        console.log("[kane-hook] All flows green. Gate would release.");
      } else {
        console.log("[kane-hook] Some flows red. Gate blocks completion.");
      }
    }, 1500);
  });

  return watcher;
}

/* ------------------------------------------------------------------ */
/* Gate mode: run all flows, exit 0 only if all pass                  */
/* ------------------------------------------------------------------ */

async function gateMode() {
  const { results, allPassed } = await runAllFlows();
  for (const r of results) {
    const status = r.passed ? "PASS" : "FAIL";
    console.log(`[kane-gate] ${r.flow}: ${status} (exit ${r.exitCode})`);
    if (!r.passed && r.failure) {
      console.log(`[kane-gate]   ${r.failure.reason}`);
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

/* ------------------------------------------------------------------ */
/* CLI entry                                                          */
/* ------------------------------------------------------------------ */

const command = process.argv[2];

async function main() {
  if (command === "watch") {
    const watcher = startWatch();
    console.log("[kane-hook] Watch running. Press Ctrl+C to stop.");
    process.on("SIGINT", () => { watcher.close(); process.exit(0); });
  } else if (command === "gate") {
    await gateMode();
  } else if (command === "run") {
    const { results, allPassed } = await runAllFlows();
    console.log(JSON.stringify({ results, allPassed }, null, 2));
    process.exit(allPassed ? 0 : 1);
  } else {
    console.error("Usage: node scripts/kane-hook.mjs <watch|gate|run>");
    process.exit(1);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(2);
});
