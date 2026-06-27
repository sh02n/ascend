import { getStoredToken } from "../session/authSession";

import { clearStoredSession, setAuthNotice } from "../session/authSession";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:3001/api";

export async function apiClient<T>(path: string, init?: RequestInit): Promise<T> {
  const headers = new Headers(init?.headers);
  const token = getStoredToken();

  if (
    !headers.has("Content-Type") &&
    init?.body !== undefined &&
    !(init.body instanceof FormData) &&
    !(init.body instanceof Blob) &&
    !(init.body instanceof ArrayBuffer)
  ) {
    headers.set("Content-Type", "application/json");
  }

  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers,
  });

  if (
    response.status === 401 &&
    path !== "/auth/login" &&
    path !== "/auth/signup" &&
    path !== "/auth/demo-login"
  ) {
    clearStoredSession();
    setAuthNotice("Your session expired. Please sign in again.");
    window.dispatchEvent(new Event("ascend:auth-expired"));
  }

  if (!response.ok) {
    let message = `Request failed with status ${response.status}`;

    try {
      const payload = (await response.json()) as { message?: string };
      if (payload.message) {
        message = payload.message;
      }
    } catch {
      // Ignore JSON parse failures for non-JSON error bodies.
    }

    throw new Error(message);
  }

  return response.json() as Promise<T>;
}
