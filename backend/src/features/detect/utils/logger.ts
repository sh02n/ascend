type DetectLogStatus = "start" | "success" | "warning" | "error";

interface DetectLogContext {
  durationMs?: number;
  [key: string]: string | number | boolean | undefined;
}

export function detectLog(status: DetectLogStatus, message: string, context: DetectLogContext = {}) {
  const timestamp = new Date().toISOString();
  const contextText = Object.entries(context)
    .filter(([, value]) => value !== undefined)
    .map(([key, value]) => `${key}=${value}`)
    .join(" ");

  console.log(`[Detect] ${timestamp} ${status} ${message}${contextText ? ` ${contextText}` : ""}`);
}

export function nowMs() {
  return Date.now();
}

export function durationSince(startedAt: number) {
  return Date.now() - startedAt;
}
