// src/scheduler.js
import cron from "node-cron";
import config from "./config.js";
import { fetchAllPosts } from "./fetcher.js";

let nextRunTime = null;

export function startScheduler() {
  if (!cron.validate(config.CRON_SCHEDULE)) {
    console.error(`[SCHEDULER] Invalid cron: "${config.CRON_SCHEDULE}"`);
    return;
  }

  cron.schedule(config.CRON_SCHEDULE, async () => {
    console.log("[SCHEDULER] Running scheduled fetch...");
    try {
      await fetchAllPosts();
    } catch (err) {
      console.error("[SCHEDULER] Error:", err.message);
    }
    computeNextRun();
  });

  computeNextRun();
  console.log(`[SCHEDULER] Auto-fetch scheduled (${config.CRON_SCHEDULE}) — next: ${nextRunTime?.toLocaleString()}`);
}

function computeNextRun() {
  const parts = config.CRON_SCHEDULE.split(" ");
  if (parts.length < 2) return;

  const minute   = parseInt(parts[0]);
  const hourPart = parts[1];
  const now      = new Date();
  const next     = new Date(now);
  next.setSeconds(0);
  next.setMilliseconds(0);

  if (hourPart.startsWith("*/")) {
    // e.g. "*/3" = every N hours
    const interval = parseInt(hourPart.slice(2));
    const currentHour = now.getHours();
    const hoursUntilNext = interval - (currentHour % interval);
    next.setHours(currentHour + hoursUntilNext, minute, 0, 0);
  } else {
    const hour = parseInt(hourPart);
    next.setHours(hour, minute, 0, 0);
    if (next <= now) next.setDate(next.getDate() + 1);
  }

  nextRunTime = next;
}

export function getNextRunTime() {
  return nextRunTime?.toISOString() ?? null;
}