import { headers } from "next/headers";

type RateLimitOptions = {
  key: string;
  max: number;
  windowMs: number;
};

type RateLimitRecord = {
  count: number;
  resetAt: number;
};

const rateLimitStore = new Map<string, RateLimitRecord>();

function getClientIp(headerStore: Headers): string {
  const forwardedFor = headerStore.get("x-forwarded-for");
  if (forwardedFor) {
    return forwardedFor.split(",")[0]?.trim() || "unknown";
  }

  return (
    headerStore.get("cf-connecting-ip") ||
    headerStore.get("x-real-ip") ||
    "unknown"
  );
}

function cleanupExpiredRateLimits(now: number) {
  for (const [key, entry] of rateLimitStore.entries()) {
    if (entry.resetAt <= now) {
      rateLimitStore.delete(key);
    }
  }
}

export async function enforceRateLimit(options: RateLimitOptions) {
  const headerStore = await headers();
  const ip = getClientIp(headerStore);
  const now = Date.now();
  cleanupExpiredRateLimits(now);

  const bucketKey = `${options.key}:${ip}`;
  const existing = rateLimitStore.get(bucketKey);

  if (!existing || existing.resetAt <= now) {
    rateLimitStore.set(bucketKey, {
      count: 1,
      resetAt: now + options.windowMs,
    });
    return;
  }

  if (existing.count >= options.max) {
    throw new Error("rate_limit_exceeded");
  }

  existing.count += 1;
  rateLimitStore.set(bucketKey, existing);
}

export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}
