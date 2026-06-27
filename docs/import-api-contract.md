# Import to Detect API Contract

## POST /api/import/transform

Transforms an uploaded, validated, analysed, and mapped dataset into a generic Investigation Dataset for the Detect module.

### Request

```json
{
  "sessionId": "import_session_id",
  "datasetId": "uploaded_dataset_id"
}
```

### Response

```json
{
  "message": "Investigation dataset generated",
  "data": {
    "sessionId": "import_session_id",
    "datasetId": "uploaded_dataset_id",
    "investigationDatasetId": "investigation_uploaded_dataset_id",
    "datasetName": "source.csv",
    "recordCount": 100,
    "mappedFields": ["customer_id", "product_id", "rating", "timestamp"],
    "mappingVersion": "mapping-2026-06-27T00:00:00.000Z",
    "transformationStatus": "ready_for_investigation",
    "outputFormat": "json_csv",
    "records": [
      {
        "values": {
          "customer_id": "c-001",
          "product_id": "p-001",
          "rating": "5",
          "timestamp": "2024-01-01"
        },
        "metadata": {
          "source_row_index": "1",
          "original_values": {
            "raw_customer_column": "c-001"
          }
        }
      }
    ],
    "export": {
      "filename": "source_investigation_dataset.csv",
      "mimeType": "text/csv",
      "csvContent": "customer_id,product_id,rating,timestamp,metadata\n..."
    },
    "generatedAt": "2026-06-27T00:00:00.000Z"
  }
}
```

### Detect Module Contract

- Read canonical fields from `data.records[].values`.
- Missing mapped fields are returned as `null`.
- Original source row values are preserved in `data.records[].metadata.original_values`.
- `data.mappedFields` is the list of canonical fields available for this dataset.
- `data.export.csvContent` provides the same transformed records as CSV.

## GET /api/import/status/:sessionId

Returns import pipeline status and completed transformation steps for a session.
