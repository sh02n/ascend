import { lazy, Suspense } from "react";
import { Navigate, Outlet, Route, Routes, useLocation } from "react-router-dom";
import { useAuth } from "../../features/auth/hooks/useAuth";
import { AppLayout } from "../../shared/layouts/AppLayout";
import { RouteAnalytics } from "../analytics/RouteAnalytics";
import { RoleOnboardingPage } from "../auth/RoleOnboardingPage";
import type { ProductRole } from "../auth/roles";
import { getDefaultPathForRole } from "../session/roleSession";
const LoginPage = lazy(() => import("../../features/auth/pages/LoginPage").then((module) => ({ default: module.LoginPage })));
const SignupPage = lazy(() => import("../../features/auth/pages/SignupPage").then((module) => ({ default: module.SignupPage })));
const ScenarioPage = lazy(() =>
  import("../../features/business/scenario/pages/ScenarioPage").then((module) => ({ default: module.ScenarioPage })),
);
const ImportPage = lazy(() =>
  import("../../features/business/scenario/pages/ImportPage").then((module) => ({ default: module.ImportPage })),
);
const DetectPage = lazy(() =>
  import("../../features/business/detect/pages/DetectPage").then((module) => ({ default: module.DetectPage })),
);
const InvestigatePage = lazy(() =>
  import("../../features/business/investigate/pages/InvestigatePage").then((module) => ({ default: module.InvestigatePage })),
);
const DashboardPage = lazy(() =>
  import("../../features/business/dashboard/pages/DashboardPage").then((module) => ({ default: module.DashboardPage })),
);
const ReportPage = lazy(() =>
  import("../../features/business/dashboard/pages/ReportPage").then((module) => ({ default: module.ReportPage })),
);
const VerifyPage = lazy(() =>
  import("../../features/consumer/verify/VerifyPage").then((module) => ({ default: module.VerifyPage })),
);
const AnalysisPage = lazy(() =>
  import("../../features/consumer/analysis/AnalysisPage").then((module) => ({ default: module.AnalysisPage })),
);
const InsightsPage = lazy(() =>
  import("../../features/consumer/insights/InsightsPage").then((module) => ({ default: module.InsightsPage })),
);

function FullScreenLoader() {
  return (
    <section className="flex min-h-screen items-center justify-center bg-slate-100 px-6">
      <div className="rounded-3xl border border-slate-200 bg-white px-6 py-5 text-sm font-medium text-slate-600 shadow-sm">
        Loading Ascend...
      </div>
    </section>
  );
}

function HomeRedirect() {
  const { isAuthenticated, isLoading, user } = useAuth();

  if (isLoading) {
    return <FullScreenLoader />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <Navigate to={user?.role ? getDefaultPathForRole(user.role) : "/onboarding"} replace />;
}

function GuestOnlyRoute() {
  const { isAuthenticated, isLoading, user } = useAuth();

  if (isLoading) {
    return <FullScreenLoader />;
  }

  if (isAuthenticated) {
    return <Navigate to={user?.role ? getDefaultPathForRole(user.role) : "/onboarding"} replace />;
  }

  return <Outlet />;
}

function AuthGate() {
  const location = useLocation();
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <FullScreenLoader />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  return <Outlet />;
}

function RoleGate({ requiredRole }: { requiredRole: ProductRole }) {
  const location = useLocation();
  const { user } = useAuth();

  if (!user?.role) {
    return <Navigate to="/onboarding" replace state={{ from: location.pathname, reason: "missing-role" }} />;
  }

  if (user.role !== requiredRole) {
    return <Navigate to={getDefaultPathForRole(user.role)} replace />;
  }

  return <Outlet />;
}

export function AppRouter() {
  return (
    <Suspense fallback={<FullScreenLoader />}>
      <RouteAnalytics />
      <Routes>
        <Route element={<GuestOnlyRoute />}>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />
        </Route>

        <Route element={<AuthGate />}>
          <Route path="/onboarding" element={<RoleOnboardingPage />} />
          <Route element={<AppLayout />}>
            <Route path="/" element={<HomeRedirect />} />

            <Route element={<RoleGate requiredRole="business" />}>
              <Route path="/scenario" element={<ScenarioPage />} />
              <Route path="/import" element={<ImportPage />} />
              <Route path="/detect" element={<Navigate to="/import" replace />} />
              <Route path="/detect/:sessionId" element={<DetectPage />} />
              <Route path="/investigate" element={<Navigate to="/import" replace />} />
              <Route path="/investigate/:sessionId" element={<InvestigatePage />} />
              <Route path="/dashboard" element={<Navigate to="/import" replace />} />
              <Route path="/dashboard/:sessionId" element={<DashboardPage />} />
              <Route path="/reports/:reportId" element={<ReportPage />} />
            </Route>

            <Route element={<RoleGate requiredRole="consumer" />}>
              <Route path="/verify" element={<VerifyPage />} />
              <Route path="/analysis" element={<Navigate to="/verify" replace />} />
              <Route path="/analysis/:sessionId" element={<AnalysisPage />} />
              <Route path="/insights" element={<Navigate to="/verify" replace />} />
              <Route path="/insights/:sessionId" element={<InsightsPage />} />
            </Route>
          </Route>
        </Route>

        <Route path="*" element={<HomeRedirect />} />
      </Routes>
    </Suspense>
  );
}
