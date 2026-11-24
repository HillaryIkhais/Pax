/* ------------------------------------------------------------------ */
/* PAXREACH — Kane CLI verification script                            */
/*                                                                     */
/* Runs Kane CLI in a real Chrome browser against the PAXREACH app     */
/* and Carrier Sandbox. Drives the closed loop:                        */
/*   Kane retrieves booking → inspects contact state → applies        */
/*   approved correction → reloads booking → verifies persistence.    */
/*                                                                     */
/* On the deliberate false-save PNR, Kane must return failure because  */
/* the contact is absent after reload.                                 */
/*                                                                     */
/* Uses documented Kane options only: --agent (NDJSON),                */
/* --variables-file, --final-validation on, --mode action.             */
/* ------------------------------------------------------------------ */

import { spawn } from "node:child_process";
import * as fs from "node:fs";
import * as path from "node:path";

const KANE = "kane-cli"; // resolved via PATH (npm global bin)
const APP_URL = process.env.PAXREACH_URL || "http://localhost:3000";
const EVIDENCE_DIR = path.join(process.cwd(), ".testmuai", "evidence");
const VARS_FILE = path.join(process.cwd(), ".testmuai", "variables", "paxreach-demo.json");

fs.mkdirSync(EVIDENCE_DIR, { recursive: true });
fs.mkdirSync(path.dirname(VARS_FILE), { recursive: true });

/* ------------------------------------------------------------------ */
/* Write the variables file for the demo scenario                     */
/* ------------------------------------------------------------------ */

function writeVariables(scenario) {
  const vars = {
    pnr: scenario.pnr,
    surname: scenario.surname,
    airline: scenario.airline || "MockAir",
    passenger_ref: scenario.passengerRef || "P1",
    email: scenario.email || "",
    phone: scenario.phone || "",
    expected_email: scenario.expectedEmail || "",
    expected_phone: scenario.expectedPhone || "",
    url: APP_URL,
  };
  fs.writeFileSync(VARS_FILE, JSON.stringify(vars, null, 2));
  return vars;
}

/* ------------------------------------------------------------------ */
/* Run one Kane flow                                                  */
/* ------------------------------------------------------------------ */

function runKane(objective, { variablesFile = VARS_FILE } = {}) {
  return new Promise((resolve) => {
    const started = Date.now();
    const chunks = [];
    const errChunks = [];

    const child = spawn(
      KANE,
      [
        "run",
        objective,
        "--url",
        APP_URL,
        "--variables-file",
        variablesFile,
        "--agent",
        "--final-validation",
        "on",
        "--mode",
        "action",
        "--headless",
      ],
      { env: { ...process.env } }
    );

    let stdout = "";
    let stderr = "";

    child.stdout.on("data", (d) => {
      stdout += d.toString();
      chunks.push(d);
    });
    child.stderr.on("data", (d) => {
      stderr += d.toString();
      errChunks.push(d);
    });

    child.on("close", (code) => {
      const evidencePath = path.join(
        EVIDENCE_DIR,
        `kane-${started}.json`
      );
      fs.writeFileSync(
        evidencePath,
        JSON.stringify(
          {
            objective,
            exitCode: code,
            durationMs: Date.now() - started,
            variablesFile,
            stdout,
            stderr,
            capturedAt: new Date().toISOString(),
          },
          null,
          2
        )
      );
      resolve({ code, stdout, stderr, evidencePath });
    });
  });
}

/* ------------------------------------------------------------------ */
/* Parse Kane NDJSON / stdout for pass/fail and final conditions      */
/* ------------------------------------------------------------------ */

function parseKaneResult(stdout) {
  const lines = stdout.split("\n").filter(Boolean);
  const events = [];
  let pass = null;
  let finalValidation = null;

  for (const line of lines) {
    try {
      const ev = JSON.parse(line);
      events.push(ev);
      if (ev.type === "result" || ev.type === "run_result") {
        pass = ev.pass ?? ev.ok ?? pass;
        finalValidation = ev.finalValidation ?? ev.final_validation ?? finalValidation;
      }
      if (ev.type === "final_validation") {
        finalValidation = ev.passed ?? ev.ok ?? finalValidation;
      }
    } catch {
      // not every line is JSON (stream_start, recording_state, etc.)
    }
  }

  // Kane exit code is the source of truth for pass/fail; parse as backup.
  return { events, pass, finalValidation };
}

/* ------------------------------------------------------------------ */
/* Scenarios                                                          */
/* ------------------------------------------------------------------ */

const SCENARIOS = {
  agencyOnly: {
    pnr: "AX1234",
    surname: "OKONKWO",
    passengerRef: "P1",
    email: "chima.okonkwo@example.com",
    phone: "+2348012345678",
    expectedEmail: "chima.okonkwo@example.com",
    expectedPhone: "+2348012345678",
  },
  misassigned: {
    pnr: "BY5678",
    surname: "ADEBAYO",
    passengerRef: "P2",
    email: "bola@example.com",
    phone: "+2348098765432",
    expectedEmail: "bola@example.com",
    expectedPhone: "+2348098765432",
  },
  declined: {
    pnr: "CZ9012",
    surname: "IBRAHIM",
    passengerRef: "P1",
  },
  alreadyCorrect: {
    pnr: "DX3456",
    surname: "SANUSI",
    passengerRef: "P1",
    email: "halima.sanusi@example.com",
    phone: "+2348098765432",
    expectedEmail: "halima.sanusi@example.com",
    expectedPhone: "+2348098765432",
  },
  falseSave: {
    pnr: "FS7777",
    surname: "FALSE",
    passengerRef: "P1",
    email: "new@example.com",
    phone: "+2348000000001",
  },
};

/* ------------------------------------------------------------------ */
/* Main                                                               */
/* ------------------------------------------------------------------ */

async function main() {
  const scenarioName = process.argv[2] || "agencyOnly";
  const scenario = SCENARIOS[scenarioName];
  if (!scenario) {
    console.error(
      `Unknown scenario "${scenarioName}". Options: ${Object.keys(SCENARIOS).join(", ")}`
    );
    process.exit(2);
  }

  const vars = writeVariables(scenario);
  console.log(`\n=== PAXREACH Kane verification: ${scenarioName} ===`);
  console.log(`PNR ${vars.pnr} · ${vars.surname} · passenger ${vars.passenger_ref}`);
  console.log(`App URL: ${APP_URL}`);
  console.log(`Variables: ${VARS_FILE}\n`);

  const objective = buildObjective(scenario, vars);

  const result = await runKane(objective);
  const parsed = parseKaneResult(result.stdout);

  console.log(`Kane exit code: ${result.code}`);
  console.log(`Parsed pass: ${parsed.pass}`);
  console.log(`Final validation: ${parsed.finalValidation}`);
  console.log(`Evidence saved: ${result.evidencePath}`);

  /* Print a compact summary of NDJSON events relevant to the outcome */
  const relevant = parsed.events.filter(
    (e) =>
      e.type === "result" ||
      e.type === "run_result" ||
      e.type === "final_validation" ||
      (e.type === "assertion" && e.passed === false)
  );
  if (relevant.length) {
    console.log("\nRelevant events:");
    for (const ev of relevant) {
      console.log("  -", JSON.stringify(ev).slice(0, 300));
    }
  }

  /* Decision: nonzero exit OR explicit fail => verification failed   */
  const failed = result.code !== 0 || parsed.pass === false || parsed.finalValidation === false;

  if (failed) {
    console.log("\n>>> VERIFICATION FAILED <<<");
    if (scenarioName === "falseSave") {
      console.log(
        "Expected: Kane caught the false-save bug (contact absent after reload)."
      );
    }
    process.exit(1);
  }

  console.log("\n>>> VERIFICATION PASSED <<<");
  process.exit(0);
}

function buildObjective(scenario, vars) {
  const contactBits = scenario.email || scenario.phone
    ? `the passenger's verified contact (email: ${scenario.email ?? "none"}, phone: ${scenario.phone ?? "none"})`
    : "the passenger declined contact sharing";

  return [
    `Open the PAXREACH app at ${APP_URL}.`,
    `Retrieve booking ${vars.pnr} for surname ${vars.surname} in the Carrier Sandbox.`,
    `Read the contact SSRs (CTCE email, CTCM mobile, CTCR declined) for passenger ${scenario.passengerRef}.`,
    `Compare the observed contact against ${contactBits}.`,
    scenario.email || scenario.phone
      ? `Show the exact discrepancy and a proposed correction. Require explicit approval before writing.`
      : `Confirm the passenger declined (CTCR) and do not write any contact.`,
    `Apply only the approved correction through the UI.`,
    `Reload the booking in a fresh page (independent read-back).`,
    `Verify the persisted contact fields match ${scenario.expectedEmail || scenario.expectedPhone || "the declined decision"} ` +
      `and the correct passenger association.`,
    `Do not accept a green "Saved" toast as proof.`,
    `Return failure if the contact is absent or mismatched after reload (false-save detection).`,
  ].join(" ");
}

main().catch((e) => {
  console.error(e);
  process.exit(2);
});
