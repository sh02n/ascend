import { useMemo, useState } from "react";
import { mapImportedDataset, type FieldMappingSuggestion } from "../../api/import.api";

const canonicalTargets = [
  "customer_id",
  "product_id",
  "review_id",
  "review_text",
  "rating",
  "timestamp",
  "transaction_id",
  "account_id",
  "amount",
  "claim_id",
  "policy_id",
  "patient_id",
  "provider_id",
  "status",
  "entity_id",
  "notes",
];

type FieldMappingCardProps = {
  datasetId: string;
  mappings: FieldMappingSuggestion[];
};

function mappingStatus(status: FieldMappingSuggestion["status"]) {
  return status === "user_modified" ? "User modified" : "Auto mapped";
}

export function FieldMappingCard({ datasetId, mappings }: FieldMappingCardProps) {
  const [editableMappings, setEditableMappings] = useState(mappings);
  const [saveStatus, setSaveStatus] = useState<string | null>(null);
  const options = useMemo(() => {
    const currentTargets = editableMappings.map((mapping) => mapping.targetField);
    return [...new Set([...canonicalTargets, ...currentTargets])].sort();
  }, [editableMappings]);

  async function persistOverrides(nextMappings = editableMappings) {
    const overrides = nextMappings
      .filter((mapping) => mapping.status === "user_modified")
      .map((mapping) => ({ sourceField: mapping.sourceField, targetField: mapping.targetField }));

    if (overrides.length === 0) {
      return;
    }

    setSaveStatus("Saving mapping overrides...");
    try {
      await mapImportedDataset(datasetId, overrides);
      setSaveStatus("Mapping overrides saved");
    } catch {
      setSaveStatus("Mapping overrides could not be saved. Please try again.");
    }
  }

  if (editableMappings.length === 0) {
    return (
      <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm text-slate-500">
        No source fields were available for mapping.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
        <datalist id="canonical-field-options">
          {options.map((option) => (
            <option key={option} value={option} />
          ))}
        </datalist>
        <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase tracking-[0.12em] text-slate-500">
            <tr>
              <th className="px-4 py-3 font-semibold">Source Field</th>
              <th className="px-4 py-3 font-semibold">Mapping</th>
              <th className="px-4 py-3 font-semibold">AI Confidence</th>
              <th className="px-4 py-3 font-semibold">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {editableMappings.map((mapping) => (
              <tr key={mapping.sourceField}>
                <td className="whitespace-nowrap px-4 py-3 font-medium text-ink">{mapping.sourceField}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <span className="text-slate-400" aria-hidden="true">to</span>
                    <label className="sr-only" htmlFor={`mapping-${mapping.sourceField}`}>
                      Mapping target for {mapping.sourceField}
                    </label>
                    <input
                      id={`mapping-${mapping.sourceField}`}
                      list="canonical-field-options"
                      value={mapping.targetField}
                      className="w-56 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100"
                      onBlur={() => void persistOverrides()}
                      onChange={(event) => {
                        const nextMappings = editableMappings.map((item) =>
                          item.sourceField === mapping.sourceField
                            ? { ...item, targetField: event.target.value, status: "user_modified" as const }
                            : item,
                        );
                        setEditableMappings(nextMappings);
                      }}
                    />
                  </div>
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-slate-600">{mapping.confidence}%</td>
                <td className="whitespace-nowrap px-4 py-3">
                  <span
                    className={`rounded-md border px-2.5 py-1 text-xs font-medium ${
                      mapping.status === "user_modified"
                        ? "border-amber-200 bg-amber-50 text-amber-700"
                        : "border-teal-200 bg-teal-50 text-teal-700"
                    }`}
                  >
                    {mappingStatus(mapping.status)}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {saveStatus ? <p className="text-xs font-medium text-slate-500">{saveStatus}</p> : null}
    </div>
  );
}
