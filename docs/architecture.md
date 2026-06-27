# Architecture Notes

## Principles

- Keep the architecture simple for cohesive product development.
- Keep business and consumer experiences separate at the frontend while sharing backend engines and data.
- Avoid cross-feature coupling unless the integration is shared UI, routing/session infrastructure, or shared DB access.
- Do not create mocks, fake endpoints, or duplicate datasets.
- Make the seeded database the shared integration contract for all features.

## Backend Flow

1. Route receives request.
2. Controller validates input, coordinates logic, and prepares response.
3. Repository performs Prisma queries only.
4. Model files define domain entities and shapes.

## Shared Data Layer

- `datasets/` stores reusable raw event datasets.
- `scenarios/` stores deterministic scenario metadata and dataset pointers.
- `prisma/seeds/` stores seed import scaffolding and graph generation entrypoints.
- Shared ingestion, graph, detection, risk, and investigation services support both product experiences.

## Frontend Flow

1. Page composes feature UI.
2. Components stay presentational when possible.
3. API layer calls backend endpoints.
4. Types document request and response contracts.

## Product Split

- Frontend business experience lives in `frontend/src/features/business/`.
- Frontend consumer experience lives in `frontend/src/features/consumer/`.
- Frontend routing, role storage, and shared API helpers live in `frontend/src/core/`.
- Backend shared capabilities live in `backend/src/features/shared/`.
- Backend business presentation routes live in `backend/src/features/business/`.

## TODO

- Add validation strategy.
- Expand consumer verification once the lightweight flow is approved.
- Add feature-specific prompt templates in `backend/src/features/shared/investigate/prompts`.
- Finalize relational links in Prisma once ingestion rules are stable.
