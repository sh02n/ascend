import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { storeActiveBusinessSession } from "../../../../core/session-flow/businessSession";
import { BusinessWorkflowTabs } from "../../session/BusinessWorkflowTabs";
import { DatasetUploadCard } from "../components/import/DatasetUploadCard";
import { ImportHeader } from "../components/import/ImportHeader";
import { SectorCard } from "../components/import/SectorCard";

export function ImportPage() {
  const navigate = useNavigate();
  const [sessionId, setSessionId] = useState<string | null>(null);

  return (
    <section className="space-y-6">
      <BusinessWorkflowTabs active="import" sessionId={sessionId} />
      <ImportHeader />

      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-4">
          <h3 className="text-base font-semibold text-ink">Investigation Domain</h3>
          <p className="mt-1 text-sm text-slate-500">
            Marketplace sessions support reviews, products, sellers, customers, and transaction activity.
          </p>
        </div>
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <SectorCard
            name="Marketplace"
            description="Reviews, products, sellers, customers, and marketplace activity."
            active
          />
          <SectorCard name="Banking" description="Accounts, transactions, merchants, and payment activity." disabled />
          <SectorCard name="Healthcare" description="Claims, providers, patients, procedures, and encounters." disabled />
          <SectorCard name="Insurance" description="Policies, claims, payments, adjusters, and beneficiaries." disabled />
        </div>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-4">
          <h3 className="text-base font-semibold text-ink">Import CSV</h3>
          <p className="mt-1 text-sm text-slate-500">
            Upload a CSV to create the investigation session. Fraud detection starts only after you continue.
          </p>
        </div>
        <DatasetUploadCard
          onSessionCreated={(nextSessionId) => {
            setSessionId(nextSessionId);
            storeActiveBusinessSession(nextSessionId);
          }}
        />
      </section>

      {sessionId ? (
        <section className="rounded-lg border border-teal-200 bg-teal-50 p-5 shadow-sm">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-semibold text-teal-800">Import complete</p>
              <p className="mt-1 text-sm text-slate-600">Session {sessionId} is ready for fraud detection.</p>
            </div>
            <button
              type="button"
              onClick={() => navigate(`/detect/${sessionId}`)}
              className="rounded-md bg-teal-700 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-800"
            >
              Next: Fraud Detection
            </button>
          </div>
        </section>
      ) : null}
    </section>
  );
}
