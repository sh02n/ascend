# Import Feature

## Purpose

The Import feature turns an uploaded CSV dataset or demo dataset into a standardized Investigation Dataset that can be consumed by Detect. The pipeline is dataset-agnostic: it profiles source data, validates quality, infers dataset intelligence with rule-based analysis, suggests field mappings, and transforms mapped rows into a canonical output contract.

## Architecture

Frontend Import page:

- `frontend/src/features/business/scenario/pages/ImportPage.tsx`
- Reusable Import UI cards live in `frontend/src/features/business/scenario/components/import/`
- API helpers live in `frontend/src/features/business/scenario/api/import.api.ts`

Backend Import feature:

- Routes: `backend/src/features/import/routes/import.routes.ts`
- Controller: `backend/src/features/import/controllers/import.controller.ts`
- Repository: `backend/src/features/import/repositories/import.repository.ts`
- Services: `backend/src/features/import/services/`
- Types: `backend/src/features/import/types/index.ts`

The controller validates requests and coordinates services. Services own parsing, profiling, validation, analysis, mapping, and transformation. The repository owns Prisma writes only, with fallback records so the shared import flow remains usable before migrations are applied.

## API Endpoints

- `POST /api/import/session` creates an import session.
- `POST /api/import/upload` accepts uploaded CSV bytes or demo dataset metadata.
- `POST /api/import/profile` parses CSV headers and sample rows.
- `POST /api/import/validate` calculates row, column, missing, duplicate, empty-cell, and quality metrics.
- `POST /api/import/analyse` runs rule-based dataset intelligence.
- `POST /api/import/map` suggests mappings and stores user overrides.
- `POST /api/import/transform` creates the standardized Investigation Dataset.
- `GET /api/import/status/:sessionId` returns pipeline status and completed steps.

All endpoints return predictable JSON:

```json
{
  "message": "Human readable status",
  "data": {}
}
```

Validation errors return:

```json
{
  "message": "What the user or caller needs to fix"
}
```

## Data Flow

1. Create an import session.
2. Upload a CSV or choose the demo dataset.
3. Profile the dataset to detect headers, rows, columns, and preview records.
4. Validate the dataset and calculate quality metrics.
5. Analyse column names and sample values to infer dataset type and entities.
6. Generate field mappings and allow user overrides.
7. Transform mapped fields into an Investigation Dataset.
8. Export the transformed dataset as CSV when needed.

## Detect Consumption Contract

Detect should consume the response from `POST /api/import/transform`.

Use:

- `data.records[].values` for canonical mapped fields.
- `data.records[].metadata.original_values` for source-row traceability.
- `data.mappedFields` to know which canonical fields are available.
- `data.export.csvContent` for CSV export.

Missing mapped fields are returned as `null`. The transformer does not fabricate source values.

Example record:

```json
{
  "values": {
    "customer_id": "c-001",
    "product_id": "p-001",
    "rating": "5",
    "timestamp": null
  },
  "metadata": {
    "source_row_index": "1",
    "original_values": {
      "raw_customer_column": "c-001"
    }
  }
}
```
