import OpenAI from "openai";
import { env } from "../../../../config/env.js";
import { buildExplanationPrompt } from "../prompts/explanationPrompt.js";
import type { AiInvestigationReport, InvestigationCluster } from "../types/index.js";

export async function generateOpenAiExplanation(
  question: string,
  cluster: InvestigationCluster,
  investigation: AiInvestigationReport,
): Promise<string> {
  if (!env.OPENAI_API_KEY) {
    throw new Error("OPENAI_API_KEY is missing.");
  }

  const client = new OpenAI({ apiKey: env.OPENAI_API_KEY });
  const completion = await client.chat.completions.create({
    model: "gpt-4o-mini",
    messages: buildExplanationPrompt(question, cluster, investigation),
    temperature: 0.2,
    max_tokens: 180,
  });

  const answer = completion.choices[0]?.message?.content?.trim();

  if (!answer) {
    throw new Error("OpenAI returned an empty explanation response.");
  }

  return answer;
}
