# Ascend Hackathon

Initial repository architecture for a feature-first hackathon project using React, Vite, Tailwind CSS, Cytoscape.js, Express, Prisma, PostgreSQL (Neon), and the OpenAI API.

## Architecture

- Feature-first + MVC
- Route -> Controller -> Repository -> Model
- Controllers own request handling, orchestration, business logic, and OpenAI calls
- Repositories own Prisma queries only
- Models define entities
- Shared TypeScript interfaces live in feature `types/` folders and `frontend/src/shared/types`
- Shared deterministic data lives in `datasets/`, `scenarios/`, and `prisma/seeds/`
- No `services/`
- No `mock/`

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

1. Person 1 owns dataset files in `datasets/`, scenario metadata in `scenarios/`, and Prisma seed helpers in `prisma/seeds/`.
2. `POST /api/scenario/load` is the ingestion entrypoint.
3. Scenario loading writes shared data into PostgreSQL.
4. Detection, investigation, and dashboard features read from the same DB instead of local mocks.

## Seed Workflow

```bash
npm run prisma:seed
```

See [docs/startup.md](/Users/arjunaravapalli/Ascend%20Hackathon/ascend/docs/startup.md) and [docs/architecture.md](/Users/arjunaravapalli/Ascend%20Hackathon/ascend/docs/architecture.md) for the parallel-development setup.

## Workspace Ownership

- Person 1: `scenario`
- Person 2: `detect`
- Person 3: `investigate`
- Person 4: `dashboard`

Each developer can work mostly inside their own feature folders on both frontend and backend, while sharing one deterministic dataset system and one DB contract.
