/* ------------------------------------------------------------------ */
/* Local test clock / time-travel switch                              */
/*                                                                     */
/* Lets the demo move forward 24 hours (CCMS upload) and 14 days       */
/* (CBN escalation window) without waiting. All timestamps are stored  */
/* in UTC; display is WAT (UTC+1). Calculations are DST-independent    */
/* because they operate on epoch milliseconds.                         */
/* ------------------------------------------------------------------ */

let overrideMs: number | null = null;

/* Set the demo clock to a fixed epoch-ms value. null = real time. */
export function setDemoClock(ms: number | null): void {
  overrideMs = ms;
}

export function getDemoClock(): number | null {
  return overrideMs;
}

/* Advance the clock by a number of days (positive or negative). */
export function advanceDemoClock(days: number): void {
  const current = overrideMs ?? Date.now();
  overrideMs = current + days * 24 * 60 * 60 * 1000;
}

/* Reset to real time. */
export function resetDemoClock(): void {
  overrideMs = null;
}

/* Effective now: demo clock override wins, else real time. */
export function nowMs(): number {
  return overrideMs ?? Date.now();
}

/* Format a timestamp in WAT (UTC+1) for display. */
export function formatWAT(ms: number): string {
  return new Date(ms).toLocaleString("en-NG", {
    timeZone: "Africa/Lagos",
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/* ISO UTC string for storage/logs. */
export function toUTC(ms: number): string {
  return new Date(ms).toISOString();
}
