# Ascend

Ascend is a shared fraud platform built with React, Vite, Tailwind CSS, Cytoscape.js, Express, Prisma, PostgreSQL (Neon), and the OpenAI API.

## Architecture

- Product-based frontend + shared/backend feature architecture
- Route -> Controller -> Repository -> Model
- Controllers own request handling, orchestration, business logic, and OpenAI calls
- Repositories own Prisma queries only
- Models define entities
- Shared TypeScript interfaces live in feature `types/` folders and `frontend/src/shared/types`
- Shared deterministic data lives in `datasets/`, `scenarios/`, and `prisma/seeds/`

## Project Structure

```text
/
  frontend/
  backend/
  prisma/
  scenarios/
  datasets/
  docs/
```

## Quick Start

1. Install dependencies:

```bash
npm install
```

2. Create environment files:

```bash
cp backend/.env.example backend/.env
```

3. Update `backend/.env` with Neon and OpenAI credentials.

4. Generate Prisma client:

```bash
npm run prisma:generate
```

5. Start both apps:

```bash
npm run dev
```

## Shared Data Flow

1. `POST /api/scenario/load` is the ingestion entrypoint for the business flow.
2. Scenario loading writes shared data into PostgreSQL.
3. Detection, investigation, and dashboard features read from the same DB and shared fraud engine outputs.
4. Consumer verification will reuse the same shared backend building blocks with a lighter presentation layer.

## Seed Workflow

```bash
npm run prisma:seed
```

See [docs/startup.md](/Users/gavar/projects/ascend/ascend/docs/startup.md), [docs/architecture.md](/Users/gavar/projects/ascend/ascend/docs/architecture.md), and [docs/product-architecture-migration.md](/Users/gavar/projects/ascend/ascend/docs/product-architecture-migration.md) for setup and migration details.
