import { Navigate, Route, Routes } from "react-router-dom";
import { AppLayout } from "../layouts/AppLayout";
import { ScenarioPage } from "../features/scenario/pages/ScenarioPage";
import { ImportPage } from "../features/scenario/pages/ImportPage";
import { DetectPage } from "../features/detect/pages/DetectPage";
import { InvestigatePage } from "../features/investigate/pages/InvestigatePage";
import { DashboardPage } from "../features/dashboard/pages/DashboardPage";
import { ReportPage } from "../features/dashboard/pages/ReportPage";

export function AppRouter() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route path="/" element={<Navigate to="/scenario" replace />} />
        <Route path="/scenario" element={<ScenarioPage />} />
        <Route path="/import" element={<ImportPage />} />
        <Route path="/detect" element={<DetectPage />} />
        <Route path="/investigate" element={<InvestigatePage />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/reports/:reportId" element={<ReportPage />} />
      </Route>
    </Routes>
  );
}
