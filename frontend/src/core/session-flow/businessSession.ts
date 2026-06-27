const ACTIVE_BUSINESS_SESSION_KEY = "ascend.business.session";

export function storeActiveBusinessSession(sessionId: string) {
  if (typeof window === "undefined") return;
  window.sessionStorage.setItem(ACTIVE_BUSINESS_SESSION_KEY, sessionId);
}

export function getActiveBusinessSession() {
  if (typeof window === "undefined") return null;
  return window.sessionStorage.getItem(ACTIVE_BUSINESS_SESSION_KEY);
}

export function clearActiveBusinessSession() {
  if (typeof window === "undefined") return;
  window.sessionStorage.removeItem(ACTIVE_BUSINESS_SESSION_KEY);
}
