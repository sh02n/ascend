import type { AiInvestigationReport, InvestigationCluster } from "../types/index.js";

export function buildExplanationPrompt(
  question: string,
  cluster: InvestigationCluster,
  investigation: AiInvestigationReport,
) {
  return [
    {
      role: "system" as const,
      content:
        "You are a marketplace trust and safety investigation assistant. Answer directly in 2-5 concise sentences. Use only the provided cluster and investigation data. Do not invent IP, device, payment, payout, or bank details unless they are present. Mention uncertainty when evidence is missing. Do not say mock. Avoid generic chatbot disclaimers.",
    },
    {
      role: "user" as const,
      content: `Answer this investigator question:
${question}

Cluster JSON:
${JSON.stringify(cluster, null, 2)}

Investigation JSON:
${JSON.stringify(investigation, null, 2)}`,
    },
  ];
}
