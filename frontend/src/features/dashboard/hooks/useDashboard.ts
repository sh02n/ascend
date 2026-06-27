import { useEffect, useState } from "react";
import { getDashboard } from "../api/dashboard.api";
import type { DashboardSummary } from "../types";

type DashboardState =
  | { status: "loading"; data: null; error: null }
  | { status: "ready"; data: DashboardSummary; error: null }
  | { status: "error"; data: null; error: string };

export function useDashboard() {
  const [state, setState] = useState<DashboardState>({
    status: "loading",
    data: null,
    error: null,
  });

  useEffect(() => {
    let isMounted = true;

    getDashboard()
      .then((data) => {
        if (isMounted) {
          setState({ status: "ready", data, error: null });
        }
      })
      .catch((error: unknown) => {
        if (isMounted) {
          setState({
            status: "error",
            data: null,
            error: error instanceof Error ? error.message : "Unable to load dashboard.",
          });
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  return state;
}
