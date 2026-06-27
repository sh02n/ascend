# Architecture Notes

## Principles

- Keep the architecture simple for fast hackathon development.
- Keep merge conflicts low by isolating work inside feature folders.
- Avoid cross-feature coupling unless the integration is shared UI or shared DB access.
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
- Person 1 owns ingestion and scenario setup.
- Persons 2 to 4 read from shared DB tables only.

## Frontend Flow

1. Page composes feature UI.
2. Components stay presentational when possible.
3. API layer calls backend endpoints.
4. Types document request and response contracts.

## Ownership Split

- Person 1: `datasets/`, `scenarios/`, `prisma/seeds/`, scenario routes
- Person 2: detection feature, DB readers for clusters/signals/risk
- Person 3: investigation feature, DB readers for clusters/signals/risk outputs
- Person 4: dashboard feature, DB readers for graph/investigation/report outputs

## TODO

- Add validation strategy.
- Add auth if needed.
- Add feature-specific prompt templates in `backend/src/features/investigate/prompts`.
- Finalize relational links in Prisma once the team agrees on ingestion rules.
