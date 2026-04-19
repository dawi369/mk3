import {
  HUB_BOOTSTRAP_FRONT_MONTHS_ON_STARTUP,
  HUB_BOOTSTRAP_SNAPSHOTS_ON_STARTUP,
  HUB_ENABLE_SCHEDULED_JOBS,
} from "@/config/env.js";
import { dailyClearJob } from "@/jobs/clear_daily.js";
import { frontMonthJob } from "@/jobs/front_month_job.js";
import { monthlySubscriptionJob } from "@/jobs/refresh_subscriptions.js";
import { snapshotJob } from "@/jobs/snapshot_job.js";
import { redisStore } from "@/server/data/redis_store.js";
import type { MassiveWSClient } from "@/server/api/massive/ws_client.js";

const EASTERN_TIME_ZONE = "America/New_York";

export interface JobRuntimeOptions {
  enableScheduledJobs: boolean;
  bootstrapFrontMonthsOnStartup: boolean;
  bootstrapSnapshotsOnStartup: boolean;
  now?: () => number;
}

interface DailyJobState {
  lastRunTime: number | null;
  lastSuccess: boolean;
}

function getDefaultJobRuntimeOptions(): JobRuntimeOptions {
  return {
    enableScheduledJobs: HUB_ENABLE_SCHEDULED_JOBS,
    bootstrapFrontMonthsOnStartup: HUB_BOOTSTRAP_FRONT_MONTHS_ON_STARTUP,
    bootstrapSnapshotsOnStartup: HUB_BOOTSTRAP_SNAPSHOTS_ON_STARTUP,
  };
}

export function getEasternDateKey(timestampMs: number): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: EASTERN_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(timestampMs);
}

export function shouldBootstrapDailyJob(
  state: DailyJobState,
  nowMs = Date.now(),
): boolean {
  if (!state.lastSuccess) return true;
  if (!state.lastRunTime) return true;

  return getEasternDateKey(state.lastRunTime) !== getEasternDateKey(nowMs);
}

export async function initializeJobRuntime(
  wsClient: MassiveWSClient,
  options: JobRuntimeOptions = getDefaultJobRuntimeOptions(),
): Promise<void> {
  monthlySubscriptionJob.attachClient(wsClient);

  await Promise.all([
    dailyClearJob.loadStatus(),
    monthlySubscriptionJob.loadStatus(),
    frontMonthJob.loadStatus(),
    snapshotJob.loadStatus(),
  ]);

  const nowMs = options.now?.() ?? Date.now();

  if (options.bootstrapSnapshotsOnStartup) {
    const snapshots = await redisStore.getAllSnapshots();
    const hasSnapshots = Object.keys(snapshots).length > 0;
    const snapshotStatus = snapshotJob.getStatus();

    if (!hasSnapshots || shouldBootstrapDailyJob(snapshotStatus, nowMs)) {
      console.log("[JobRuntime] Bootstrapping snapshot cache on startup");
      await snapshotJob.runRefresh();
    }
  }

  if (options.bootstrapFrontMonthsOnStartup) {
    const frontMonthCache = frontMonthJob.getCache();
    const frontMonthStatus = frontMonthJob.getStatus();
    const shouldBootstrapFrontMonths =
      !frontMonthCache ||
      shouldBootstrapDailyJob(
        {
          lastRunTime: frontMonthCache.lastUpdated,
          lastSuccess: frontMonthStatus.lastSuccess,
        },
        nowMs,
      );

    if (shouldBootstrapFrontMonths) {
      console.log("[JobRuntime] Bootstrapping front-month cache on startup");
      await frontMonthJob.runRefresh();
    }
  }

  if (!options.enableScheduledJobs) {
    console.log("[JobRuntime] Scheduled jobs disabled by config");
    return;
  }

  dailyClearJob.schedule();
  monthlySubscriptionJob.schedule(wsClient);
  snapshotJob.schedule();
  frontMonthJob.schedule();
  console.log("[JobRuntime] Scheduled recurring maintenance jobs");
}

export function stopJobRuntime(): void {
  dailyClearJob.stopSchedule();
  monthlySubscriptionJob.stopSchedule();
  snapshotJob.stopSchedule();
  frontMonthJob.stopSchedule();
}
