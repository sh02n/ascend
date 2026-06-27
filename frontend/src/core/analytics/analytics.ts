const ANALYTICS_KEY = "ascend.analytics";
const ANALYSIS_TIMER_PREFIX = "ascend.analysisTimer.";

interface AnalyticsState {
  pageLoads: Record<string, number>;
  verificationCount: number;
  lastAnalysisDurationMs: number | null;
  analysisDurationsMs: number[];
}

function canUseStorage() {
  return typeof window !== "undefined";
}

function getDefaultState(): AnalyticsState {
  return {
    pageLoads: {},
    verificationCount: 0,
    lastAnalysisDurationMs: null,
    analysisDurationsMs: [],
  };
}

function readAnalyticsState() {
  if (!canUseStorage()) {
    return getDefaultState();
  }

  const rawValue = window.localStorage.getItem(ANALYTICS_KEY);

  if (!rawValue) {
    return getDefaultState();
  }

  try {
    return {
      ...getDefaultState(),
      ...(JSON.parse(rawValue) as Partial<AnalyticsState>),
    };
  } catch {
    return getDefaultState();
  }
}

function writeAnalyticsState(updater: (current: AnalyticsState) => AnalyticsState) {
  if (!canUseStorage()) {
    return;
  }

  const nextState = updater(readAnalyticsState());
  window.localStorage.setItem(ANALYTICS_KEY, JSON.stringify(nextState));
}

export function trackPageLoad(pathname: string) {
  writeAnalyticsState((current) => ({
    ...current,
    pageLoads: {
      ...current.pageLoads,
      [pathname]: (current.pageLoads[pathname] ?? 0) + 1,
    },
  }));
}

export function incrementVerificationCount() {
  writeAnalyticsState((current) => ({
    ...current,
    verificationCount: current.verificationCount + 1,
  }));
}

export function startAnalysisTimer(analysisId: string) {
  if (!canUseStorage()) {
    return;
  }

  window.sessionStorage.setItem(`${ANALYSIS_TIMER_PREFIX}${analysisId}`, String(Date.now()));
}

export function completeAnalysisTimer(analysisId: string) {
  if (!canUseStorage()) {
    return null;
  }

  const key = `${ANALYSIS_TIMER_PREFIX}${analysisId}`;
  const startedAt = window.sessionStorage.getItem(key);

  if (!startedAt) {
    return null;
  }

  window.sessionStorage.removeItem(key);
  const durationMs = Math.max(0, Date.now() - Number(startedAt));

  writeAnalyticsState((current) => ({
    ...current,
    lastAnalysisDurationMs: durationMs,
    analysisDurationsMs: [...current.analysisDurationsMs, durationMs].slice(-20),
  }));

  return durationMs;
}
