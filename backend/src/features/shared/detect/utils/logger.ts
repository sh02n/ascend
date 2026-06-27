type DetectLogStatus = "start" | "success" | "warning" | "error";

interface DetectLogContext {
  durationMs?: number;
  [key: string]: string | number | boolean | undefined;
}

export function detectLog(status: DetectLogStatus, message: string, context: DetectLogContext = {}) {
  void status;
  void message;
  void context;
}

export function nowMs() {
  return Date.now();
}

export function durationSince(startedAt: number) {
  return Date.now() - startedAt;
}
