import { useState } from "react";
import type { DatasetAnalysis, DatasetProfile, FieldMappingResult, ValidationReport } from "../api/import.api";
import { DatasetHealthCard } from "../components/import/DatasetHealthCard";
import { DatasetIntelligenceCard } from "../components/import/DatasetIntelligenceCard";
import { DatasetPreviewCard } from "../components/import/DatasetPreviewCard";
import { DatasetUploadCard } from "../components/import/DatasetUploadCard";
import { FieldMappingCard } from "../components/import/FieldMappingCard";
import { ImportHeader } from "../components/import/ImportHeader";
import { InvestigationReadyCard } from "../components/import/InvestigationReadyCard";
import { ImportProgress } from "../components/import/ImportProgress";
import { ImportSectionCard } from "../components/import/ImportSectionCard";
import { SectorCard } from "../components/import/SectorCard";
import { TransformationLog, type TransformationLogEntry } from "../components/import/TransformationLog";
import type { ImportPipelineStage } from "../components/import/importPipelineTypes";

const pipelineStages: ImportPipelineStage[] = [
  { label: "Upload Dataset", status: "active" },
  { label: "Preview Dataset", status: "inactive" },
  { label: "Data Quality", status: "inactive" },
  { label: "AI Analysis & Mapping", status: "inactive" },
  { label: "Investigation Ready", status: "inactive" },
];

export function ImportPage() {
  const [profile, setProfile] = useState<DatasetProfile | null>(null);
  const [validation, setValidation] = useState<ValidationReport | null>(null);
  const [analysis, setAnalysis] = useState<DatasetAnalysis | null>(null);
  const [mapping, setMapping] = useState<FieldMappingResult | null>(null);
  const [logEntries, setLogEntries] = useState<TransformationLogEntry[]>([]);
  const [sessionId, setSessionId] = useState<string | null>(null);

  return (
    <section className="space-y-6">
      <ImportHeader />
      <ImportProgress stages={pipelineStages} />

      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-4">
          <h3 className="text-base font-semibold text-ink">Sector Selection</h3>
          <p className="mt-1 text-sm text-slate-500">
            Select the investigation domain for this import session.
          </p>
        </div>
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <SectorCard
            name="Marketplace"
            description="Reviews, products, sellers, customers, and marketplace activity."
            active
          />
          <SectorCard
            name="Banking"
            description="Accounts, transactions, merchants, and payment activity."
            disabled
          />
          <SectorCard
            name="Healthcare"
            description="Claims, providers, patients, procedures, and encounters."
            disabled
          />
          <SectorCard
            name="Insurance"
            description="Policies, claims, payments, adjusters, and beneficiaries."
            disabled
          />
        </div>
      </section>

      <ImportSectionCard
        title="Dataset Upload"
        description="Upload a CSV dataset, or use the curated Marketplace demo dataset."
        state="expanded"
        skeleton="upload"
      >
        <DatasetUploadCard
          onPipelineComplete={(result) => {
            setSessionId(result.upload.sessionId);
            setProfile(result.profile);
            setValidation(result.validation);
            setAnalysis(result.analysis);
            setMapping(result.mapping);
            setLogEntries(result.log);
          }}
        />
      </ImportSectionCard>

      <ImportSectionCard
        title="Dataset Preview"
        description="Review incoming columns, sample rows, and basic dataset structure."
        state={profile ? "expanded" : "locked"}
        skeleton="table"
      >
        {profile ? <DatasetPreviewCard profile={profile} /> : undefined}
      </ImportSectionCard>

      <ImportSectionCard
        title="Dataset Health"
        description="Inspect file readiness, missing values, duplicates, and validation status."
        state={validation ? "expanded" : "locked"}
        skeleton="metrics"
      >
        {validation ? <DatasetHealthCard report={validation} /> : undefined}
      </ImportSectionCard>

      <ImportSectionCard
        title="Dataset Intelligence"
        description="Understand the dataset type, confidence, entities, and investigation fit."
        state={analysis ? "expanded" : "locked"}
        skeleton="analysis"
      >
        {analysis ? <DatasetIntelligenceCard analysis={analysis} /> : undefined}
      </ImportSectionCard>

      <ImportSectionCard
        title="Field Mapping"
        description="Review and edit suggested canonical mappings for each source field."
        state={mapping ? "expanded" : "locked"}
        skeleton="mapping"
      >
        {mapping ? <FieldMappingCard datasetId={mapping.datasetId} mappings={mapping.mappings} /> : undefined}
      </ImportSectionCard>

      <ImportSectionCard
        title="Investigation Ready"
        description="Generate a standardized investigation dataset for downstream detection."
        state={sessionId && profile && validation && analysis && mapping ? "expanded" : "locked"}
        skeleton="ready"
      >
        {sessionId && profile && validation && analysis && mapping ? (
          <InvestigationReadyCard
            sessionId={sessionId}
            profile={profile}
            validation={validation}
            analysis={analysis}
            mapping={mapping}
            onGenerated={(dataset) => {
              setLogEntries((current) => [
                ...current,
                {
                  label: "Investigation dataset generated",
                  timestamp: new Intl.DateTimeFormat(undefined, {
                    hour: "2-digit",
                    minute: "2-digit",
                    second: "2-digit",
                  }).format(new Date()),
                },
              ]);
            }}
          />
        ) : undefined}
      </ImportSectionCard>

      <ImportSectionCard
        title="Transformation Log"
        description="Track completed import pipeline steps and validation milestones."
        state={logEntries.length > 0 ? "expanded" : "locked"}
        skeleton="analysis"
      >
        {logEntries.length > 0 ? <TransformationLog entries={logEntries} /> : undefined}
      </ImportSectionCard>
    </section>
  );
}






