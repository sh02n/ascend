import type { ProductRole } from "../auth/roles";

export const navigationLinksByRole: Record<ProductRole, Array<{ to: string; label: string }>> = {
  business: [
    { to: "/import", label: "Import" },
    { to: "/scenario", label: "Start" },
  ],
  consumer: [{ to: "/verify", label: "Verify" }],
};
