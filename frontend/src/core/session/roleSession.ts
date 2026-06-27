import type { ProductRole } from "../auth/roles";
import { ROLE_STORAGE_KEY, getStoredUser, storeRole as persistRole } from "./authSession";

export function getStoredRole(): ProductRole | null {
  const storedUserRole = getStoredUser()?.role;

  if (storedUserRole === "business" || storedUserRole === "consumer") {
    return storedUserRole;
  }

  if (typeof window === "undefined") {
    return null;
  }

  const value = window.localStorage.getItem(ROLE_STORAGE_KEY);

  return value === "business" || value === "consumer" ? value : null;
}

export function storeRole(role: ProductRole) {
  persistRole(role);
}

export function getDefaultPathForRole(role: ProductRole) {
  return role === "business" ? "/import" : "/verify";
}
