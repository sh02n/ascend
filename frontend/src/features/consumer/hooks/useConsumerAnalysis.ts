import { useEffect, useState } from "react";
import { completeAnalysisTimer } from "../../../core/analytics/analytics";
import { getConsumerAnalysis as fetchConsumerAnalysis } from "../api/consumer.api";
import type { ConsumerAnalysis } from "../types";

interface UseConsumerAnalysisState {
  analysis: ConsumerAnalysis | null;
  errorMessage: string | null;
  isLoading: boolean;
}

export function useConsumerAnalysis(analysisId: string | null) {
  const [state, setState] = useState<UseConsumerAnalysisState>({
    analysis: null,
    errorMessage: null,
    isLoading: Boolean(analysisId),
  });

  useEffect(() => {
    if (!analysisId) {
      setState({
        analysis: null,
        errorMessage: null,
        isLoading: false,
      });
      return;
    }

    const activeAnalysisId = analysisId;
    setState({
      analysis: null,
      errorMessage: null,
      isLoading: true,
    });

    let cancelled = false;

    async function loadAnalysis() {
      try {
        const analysis = await fetchConsumerAnalysis(activeAnalysisId);

        if (cancelled) {
          return;
        }

        completeAnalysisTimer(activeAnalysisId);
        setState({
          analysis,
          errorMessage: null,
          isLoading: false,
        });
      } catch (error) {
        if (cancelled) {
          return;
        }

        setState({
          analysis: null,
          errorMessage: error instanceof Error ? error.message : "Unable to load this analysis.",
          isLoading: false,
        });
      }
    }

    void loadAnalysis();

    return () => {
      cancelled = true;
    };
  }, [analysisId]);

  return state;
}
