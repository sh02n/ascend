import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { trackPageLoad } from "./analytics";

export function RouteAnalytics() {
  const location = useLocation();

  useEffect(() => {
    trackPageLoad(location.pathname);
  }, [location.pathname]);

  return null;
}
