export type ImportPipelineStage = {
  label: string;
  status: "active" | "inactive";
};

export type ImportPipelineSection = {
  title: string;
  description: string;
  state: "expanded" | "locked";
  skeleton: "upload" | "table" | "metrics" | "analysis" | "mapping" | "ready";
};
