import type { ProductRole } from "../auth/roles";

export type AuthUser = {
  id: string;
  email: string;
  name: string;
  role: ProductRole | null;
  createdAt: string;
  updatedAt: string;
};

export const TOKEN_STORAGE_KEY = "ascend.token";
export const USER_STORAGE_KEY = "ascend.user";
export const ROLE_STORAGE_KEY = "ascend.role";
const AUTH_NOTICE_STORAGE_KEY = "ascend.auth.notice";
const DEMO_AUTOLOGIN_DISABLED_KEY = "ascend.demo.autologin.disabled";

export function getStoredToken() {
  if (typeof window === "undefined") {
    return null;
  }

  return window.localStorage.getItem(TOKEN_STORAGE_KEY);
}

export function getStoredUser(): AuthUser | null {
  if (typeof window === "undefined") {
    return null;
  }

  const value = window.localStorage.getItem(USER_STORAGE_KEY);

  if (!value) {
    return null;
  }

  try {
    return JSON.parse(value) as AuthUser;
  } catch {
    clearStoredSession();
    return null;
  }
}

export function storeRole(role: ProductRole) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(ROLE_STORAGE_KEY, role);
}

export function storeAuthSession(token: string, user: AuthUser) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(TOKEN_STORAGE_KEY, token);
  window.localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));

  if (user.role) {
    storeRole(user.role);
  } else {
    window.localStorage.removeItem(ROLE_STORAGE_KEY);
  }

  window.sessionStorage.removeItem(DEMO_AUTOLOGIN_DISABLED_KEY);
}

export function updateStoredUser(user: AuthUser) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));

  if (user.role) {
    storeRole(user.role);
  } else {
    window.localStorage.removeItem(ROLE_STORAGE_KEY);
  }
}

export function setAuthNotice(message: string) {
  if (typeof window === "undefined") {
    return;
  }

  window.sessionStorage.setItem(AUTH_NOTICE_STORAGE_KEY, message);
}

export function consumeAuthNotice() {
  if (typeof window === "undefined") {
    return null;
  }

  const message = window.sessionStorage.getItem(AUTH_NOTICE_STORAGE_KEY);

  if (message) {
    window.sessionStorage.removeItem(AUTH_NOTICE_STORAGE_KEY);
  }

  return message;
}

export function disableDemoAutoLogin() {
  if (typeof window === "undefined") {
    return;
  }

  window.sessionStorage.setItem(DEMO_AUTOLOGIN_DISABLED_KEY, "true");
}

export function isDemoAutoLoginDisabled() {
  if (typeof window === "undefined") {
    return false;
  }

  return window.sessionStorage.getItem(DEMO_AUTOLOGIN_DISABLED_KEY) === "true";
}

export function clearStoredSession() {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.removeItem(TOKEN_STORAGE_KEY);
  window.localStorage.removeItem(USER_STORAGE_KEY);
  window.localStorage.removeItem(ROLE_STORAGE_KEY);
}
