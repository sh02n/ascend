# Startup Guide

## Prerequisites

- Node.js 20+
- npm 10+
- Neon PostgreSQL connection string
- OpenAI API key

## Setup

1. Install dependencies from the repository root:

```bash
npm install
```

2. Create the backend environment file:

```bash
cp backend/.env.example backend/.env
```

3. Fill in:

- `DATABASE_URL`
- `OPENAI_API_KEY`
- `CLIENT_ORIGIN`

4. Generate Prisma client:

```bash
npm run prisma:generate
```

5. Seed a scenario dataset:

```bash
npm run prisma:seed
```

6. Start development servers:

```bash
npm run dev
```

## Expected Local URLs

- Frontend: `http://localhost:5173`
- Backend: `http://localhost:3001`

## TODO

- Add Prisma migrations once the relational model is finalized.
- Wire `POST /api/scenario/load` to the seed import flow.
- Replace placeholder seed TODOs with real ingestion logic.
