import type { InvestigationCluster } from "../types/index.js";

export function buildInvestigationPrompt(cluster: InvestigationCluster) {
  return [
    {
      role: "system" as const,
      content:
        "You are a marketplace trust and safety investigator. Return valid JSON only. Use only the cluster JSON provided. Do not invent facts. If evidence is missing, list it under missingEvidence instead of pretending it exists.",
    },
    {
      role: "user" as const,
      content: `Generate a concise, demo-friendly fraud investigation report for an Amazon review-ring scenario.

Focus only on facts present in the cluster JSON. For the current mock cluster, relevant themes may include fake review rings, review bursts, rating inflation, limited reviewer history, review text similarity, and suspicious reviewer-to-ASIN concentration.

Guardrails:
- Do not mention payouts, bank accounts, payment fraud, or seller-collusion unless explicitly present in the cluster JSON.
- Every evidence item must be grounded in the cluster JSON.
- Keep descriptions short and useful for an investigator dashboard.
- Return JSON only. Do not wrap it in markdown.

Return this exact JSON shape:
{
  "id": "AMZ-INV-2026-0091",
  "generatedAt": "ISO_TIMESTAMP",
  "executiveSummary": "string",
  "evidence": [
    {
      "title": "string",
      "severity": "LOW | MEDIUM | HIGH",
      "description": "string",
      "source": "string"
    }
  ],
  "fraudPattern": {
    "name": "string",
    "confidence": 0.92,
    "explanation": "string",
    "supportingPoints": ["string"]
  },
  "falsePositiveConsiderations": [
    {
      "title": "string",
      "likelihood": "LOW | MEDIUM | HIGH",
      "explanation": "string"
    }
  ],
  "missingEvidence": [
    {
      "title": "string",
      "priority": "LOW | MEDIUM | HIGH",
      "reason": "string"
    }
  ],
  "recommendation": {
    "action": "string",
    "priority": "LOW | MEDIUM | HIGH",
    "rationale": "string",
    "nextSteps": ["string"]
  },
  "timelineNarrative": [
    {
      "title": "string",
      "time": "string",
      "description": "string"
    }
  ],
  "suggestedQuestions": ["string"]
}

Cluster JSON:
${JSON.stringify(cluster, null, 2)}`,
    },
  ];
}
