# Product Architecture Migration

## Summary

This migration converts the project from team-owned hackathon slices into a product-based architecture with:

- `frontend/src/core/` for routing, session, auth scaffolding, and API plumbing
- `frontend/src/features/business/` for the existing business workflow
- `frontend/src/features/consumer/` for scaffold-only consumer placeholders
- `backend/src/features/shared/` for shared ingestion, graph, detection, risk, and investigation logic
- `backend/src/features/business/` for business-specific backend presentation routes

## New Folder Tree

```text
frontend/src/
  core/
    api/
    auth/
    routing/
    session/
  features/
    business/
      dashboard/
      detect/
      investigate/
      mock/
      scenario/
    consumer/
      analysis/
      insights/
      verify/
  shared/
    components/
    layouts/
    types/
    ui/

backend/src/features/
  business/
    dashboard/
  consumer/
  shared/
    detect/
    import/
    investigate/
    scenario/
```

## Moved Files

- Frontend business flows moved from `frontend/src/features/{scenario,detect,investigate,dashboard}` to `frontend/src/features/business/...`
- Frontend investigation mocks moved to `frontend/src/features/business/mock/`
- Frontend routing moved from `frontend/src/router/AppRouter.tsx` to `frontend/src/core/routing/AppRouter.tsx`
- Frontend API client moved from `frontend/src/shared/lib/apiClient.ts` to `frontend/src/core/api/apiClient.ts`
- Frontend investigation shared types moved from `frontend/src/types/investigation.ts` to `frontend/src/shared/types/investigation.ts`
- Frontend layout moved from `frontend/src/layouts/AppLayout.tsx` to `frontend/src/shared/layouts/AppLayout.tsx`
- Backend dashboard moved from `backend/src/features/dashboard/` to `backend/src/features/business/dashboard/`
- Backend scenario, import, detect, and investigate moved under `backend/src/features/shared/`

## Routing Changes

- `/` now redirects to `/onboarding` when no role is stored
- Role choice is persisted in `localStorage` under `ascend.role`
- Stored `business` role routes to `/scenario`
- Stored `consumer` role routes to `/verify`
- Existing business paths remain available:
  - `/scenario`
  - `/import`
  - `/detect`
  - `/investigate`
  - `/dashboard`
  - `/reports/:reportId`
- Consumer paths are scaffolded only:
  - `/verify`
  - `/analysis`
  - `/insights`

## Migration Notes

- Public backend API paths were preserved under `/api`
- Existing business functionality was kept in place and re-pointed through the new folder structure
- Consumer pages are placeholders only; no consumer engine behavior was added
- The shared fraud engine path is represented by backend shared folders so business and future consumer outputs can reuse the same data pipeline
- Relative backend imports were updated after the folder moves, and both frontend and backend builds pass after the restructure
