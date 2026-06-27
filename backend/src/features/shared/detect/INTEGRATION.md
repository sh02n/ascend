# Fraud Detection Integration

Person-2 exposes the fraud detection engine through three stable APIs.

## Endpoints

`GET /api/signals/:clusterId`

Primary investigation endpoint for Person-3. Use this to fetch the full detector output, risk score, reasoning context, and timeline.

`GET /api/risk/:clusterId`

Quick risk lookup for a cluster.

`GET /api/clusters`

Dashboard list for Person-4. Results are sorted highest risk first.

## Cluster ID

Current development data exposes `cluster_001`.

## Signal Response

```json
{
  "cluster": {
    "id": "cluster_001",
    "risk": {
      "score": 0,
      "level": "LOW",
      "breakdown": {
        "sharedResource": 0,
        "reviewRing": 0,
        "refundAbuse": 0,
        "temporalBurst": 0,
        "denseCluster": 0
      }
    }
  },
  "summary": {
    "buyers": 21207,
    "sellers": 0,
    "orders": 0,
    "reviews": 21214,
    "refunds": 0
  },
  "detections": {
    "sharedResource": false,
    "reviewRing": false,
    "refundAbuse": false,
    "temporalBurst": false,
    "denseCluster": false
  },
  "reasoningContext": {
    "sharedResource": {
      "detected": false,
      "score": 0,
      "confidence": 0,
      "summary": "No shared payment methods, devices or IPs found",
      "metrics": {},
      "evidence": []
    }
  },
  "timeline": [
    {
      "time": "17:25",
      "event": "Review Created"
    }
  ]
}
```

## Person-3

Call `GET /api/signals/cluster_001` and use `reasoningContext` plus `timeline` directly for investigation generation.

## Person-4

Call `GET /api/clusters` for dashboard list data, then use `GET /api/risk/:clusterId` for lightweight score refreshes.

## Demo Mode

Set `DEMO_MODE=true` on the backend to force cached dataset reads for faster repeated calls. Set `VITE_DEMO_MODE=true` on the frontend to show the demo mode badge.
