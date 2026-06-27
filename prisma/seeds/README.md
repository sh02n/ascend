# Prisma Seeds

This folder owns deterministic seed import scaffolding.

## Ownership

- Person 1 owns these files.
- Other feature teams consume the seeded DB only.

## Flow

1. Read scenario metadata from `scenarios/`
2. Load raw JSON data from `datasets/`
3. Insert entities into relational tables
4. Generate graph nodes and graph edges

## TODO

- Replace placeholders with Prisma transactions.
- Add per-scenario mapping helpers if the schemas diverge.
