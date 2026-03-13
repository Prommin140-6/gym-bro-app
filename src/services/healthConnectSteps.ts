import {
  getSdkStatus,
  initialize,
  requestPermission,
  readRecords,
  SdkAvailabilityStatus,
} from "react-native-health-connect";

const STEPS_RECORD_TYPE = "Steps" as const;

let isReady = false;
let initPromise: Promise<void> | null = null;
const stepsCache = new Map<string, number>();

const toDayKey = (date: Date) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
};

const getDayRange = (key: string) => {
  const [year, month, day] = key.split("-").map(Number);
  const start = new Date(year, month - 1, day, 0, 0, 0, 0);
  const end = new Date(year, month - 1, day, 23, 59, 59, 999);
  return {
    startTime: start.toISOString(),
    endTime: end.toISOString(),
  };
};

async function ensureReady(): Promise<void> {
  if (isReady) return;
  if (initPromise) {
    return initPromise;
  }

  initPromise = (async () => {
    const sdkStatus = await getSdkStatus();
    if (sdkStatus !== SdkAvailabilityStatus.SDK_AVAILABLE) {
      throw new Error("Health Connect not available");
    }

    const initialized = await initialize();
    if (!initialized) {
      throw new Error("Unable to initialize Health Connect");
    }

    const granted = await requestPermission([
      { accessType: "read", recordType: STEPS_RECORD_TYPE },
    ]);

    const hasStepsPermission = granted.some(
      (p) => p.recordType === STEPS_RECORD_TYPE && p.accessType === "read",
    );

    if (!hasStepsPermission) {
      throw new Error("Permission denied for steps");
    }

    isReady = true;
  })();

  try {
    await initPromise;
  } finally {
    initPromise = null;
  }
}

export async function readStepsForDate(
  key: string,
  options?: { forceRefresh?: boolean },
): Promise<number> {
  const resolvedKey = key;
  if (!options?.forceRefresh) {
    const cached = stepsCache.get(resolvedKey);
    if (cached != null) return cached;
  }

  await ensureReady();

  const range = getDayRange(resolvedKey);
  const result = await readRecords(STEPS_RECORD_TYPE, {
    timeRangeFilter: {
      operator: "between",
      startTime: range.startTime,
      endTime: range.endTime,
    },
  });

  const total = result.records.reduce((sum, r) => sum + (r.count ?? 0), 0);
  stepsCache.set(resolvedKey, total);
  return total;
}

export function clearStepsCache() {
  stepsCache.clear();
}

export function clearStepsCacheForDate(key: string) {
  stepsCache.delete(key);
}

export { toDayKey };
