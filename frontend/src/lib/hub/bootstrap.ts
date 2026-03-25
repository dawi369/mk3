import type { HubBootstrapData } from "@/types/hub.types";
import type { SessionData, SnapshotData } from "@/types/redis.types";

interface LoadHubBootstrapOptions {
  baseUrl: string;
  curveSymbols: string[];
  fetcher?: typeof fetch;
  signal?: AbortSignal;
}

async function fetchJson<T>(
  fetcher: typeof fetch,
  url: string,
  signal?: AbortSignal,
): Promise<T | null> {
  try {
    const response = await fetcher(url, { signal });
    if (!response.ok) {
      return null;
    }
    return (await response.json()) as T;
  } catch {
    return null;
  }
}

export async function loadHubBootstrap({
  baseUrl,
  curveSymbols,
  fetcher = fetch,
  signal,
}: LoadHubBootstrapOptions): Promise<HubBootstrapData> {
  const [symbolsPayload, snapshotsPayload, sessionsPayload] = await Promise.all([
    fetchJson<{ symbols?: string[] } | string[]>(
      fetcher,
      `${baseUrl}/symbols`,
      signal,
    ),
    fetchJson<{ snapshots?: Record<string, SnapshotData> }>(
      fetcher,
      `${baseUrl}/snapshots`,
      signal,
    ),
    fetchJson<{ sessions?: Record<string, SessionData> }>(
      fetcher,
      `${baseUrl}/sessions`,
      signal,
    ),
  ]);

  const frontSymbols = Array.isArray(symbolsPayload)
    ? symbolsPayload
    : Array.isArray(symbolsPayload?.symbols)
      ? symbolsPayload.symbols
      : [];

  return {
    frontSymbols,
    curveSymbols,
    snapshots: snapshotsPayload?.snapshots ?? {},
    sessions: sessionsPayload?.sessions ?? {},
  };
}

export async function loadHubSnapshots(
  baseUrl: string,
  fetcher: typeof fetch = fetch,
  signal?: AbortSignal,
): Promise<Record<string, SnapshotData>> {
  const payload = await fetchJson<{ snapshots?: Record<string, SnapshotData> }>(
    fetcher,
    `${baseUrl}/snapshots`,
    signal,
  );
  return payload?.snapshots ?? {};
}

export async function loadHubSessions(
  baseUrl: string,
  fetcher: typeof fetch = fetch,
  signal?: AbortSignal,
): Promise<Record<string, SessionData>> {
  const payload = await fetchJson<{ sessions?: Record<string, SessionData> }>(
    fetcher,
    `${baseUrl}/sessions`,
    signal,
  );
  return payload?.sessions ?? {};
}
