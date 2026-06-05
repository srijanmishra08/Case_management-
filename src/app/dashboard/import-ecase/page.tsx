"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import CourtSelector from "@/components/CourtSelector";
import CRNList from "@/components/CRNList";
import ClientAttachmentForm from "@/components/ClientAttachmentForm";

interface CaseListItem {
  crn: string;
  case_title: string;
  parties: string;
  filing_date: string;
  case_type: string;
  case_status: string;
  alreadyImported?: boolean;
}

interface ExistingClient {
  id: string;
  client_name: string;
  case_title: string;
}

interface ClientAttachment {
  crn: string;
  action: "create" | "attach";
  client_id?: string;
  client_name?: string;
  client_whatsapp?: string;
}

export default function ImportECasePage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [selectedCourt, setSelectedCourt] = useState("");
  const [cases, setCases] = useState<CaseListItem[]>([]);
  const [selectedCRNs, setSelectedCRNs] = useState<string[]>([]);
  const [existingClients, setExistingClients] = useState<ExistingClient[]>([]);
  const [clientAttachments, setClientAttachments] = useState<ClientAttachment[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    // Fetch existing clients
    fetch("/api/cases")
      .then((res) => res.json())
      .then((data) => {
        const clients = data.clients || [];
        setExistingClients(
          clients.map((c: { id: string; client_name: string; case_title: string }) => ({
            id: c.id,
            client_name: c.client_name,
            case_title: c.case_title,
          }))
        );
      })
      .catch((err) => {
        console.error("Failed to fetch existing clients:", err);
      });
  }, []);

  const handleCourtChange = (courtCode: string) => {
    setSelectedCourt(courtCode);
    setCases([]);
    setSelectedCRNs([]);
    setStep(2);
  };

  const handleFetchCases = async () => {
    if (!selectedCourt) return;

    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/ecase/cases", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ court_code: selectedCourt }),
      });

      if (!res.ok) {
        const err = await res.json();
        setError(err.error || "Failed to fetch cases");
        return;
      }

      const data = await res.json();

      // Check which cases are already imported
      const casesWithImportStatus = await Promise.all(
        (data.cases || []).map(async (caseItem: CaseListItem) => {
          // Check if CRN exists in existing clients
          const alreadyImported = existingClients.some((client) => {
            // We'll do a simple check here - in production you'd check via API
            return false; // For now, assume none are imported
          });
          return { ...caseItem, alreadyImported };
        })
      );

      setCases(casesWithImportStatus);
      setStep(3);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleProceedToAttachment = () => {
    if (selectedCRNs.length === 0) {
      setError("Please select at least one case to import");
      return;
    }
    setStep(4);
  };

  const handleImport = async () => {
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      // Validate attachments
      const importData = selectedCRNs.map((crn) => {
        const caseItem = cases.find((c) => c.crn === crn);
        const attachment = clientAttachments.find((a) => a.crn === crn);

        if (!caseItem || !attachment) {
          throw new Error(`Missing data for CRN: ${crn}`);
        }

        if (attachment.action === "create") {
          if (!attachment.client_name || !attachment.client_whatsapp) {
            throw new Error(`Client name and WhatsApp required for ${crn}`);
          }
        } else if (attachment.action === "attach") {
          if (!attachment.client_id) {
            throw new Error(`Please select an existing client for ${crn}`);
          }
        }

        return {
          crn,
          court_code: selectedCourt,
          case_title: caseItem.case_title,
          case_details: {
            parties: caseItem.parties,
            filing_date: caseItem.filing_date,
            case_type: caseItem.case_type,
            case_status: caseItem.case_status,
          },
          client_id: attachment.action === "attach" ? attachment.client_id : undefined,
          client_name: attachment.action === "create" ? attachment.client_name : undefined,
          client_whatsapp: attachment.action === "create" ? attachment.client_whatsapp : undefined,
        };
      });

      const res = await fetch("/api/ecase/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cases: importData }),
      });

      if (!res.ok) {
        const err = await res.json();
        setError(err.error || "Failed to import cases");
        return;
      }

      const result = await res.json();

      if (result.errors && result.errors.length > 0) {
        setError(`Imported ${result.imported} cases with some errors: ${result.errors.join(", ")}`);
      } else {
        setSuccess(
          `Successfully imported ${result.imported} case(s)! Created ${result.created} new client(s), updated ${result.updated} existing client(s).`
        );
      }

      setStep(5);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to import cases");
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setStep(1);
    setSelectedCourt("");
    setCases([]);
    setSelectedCRNs([]);
    setClientAttachments([]);
    setError("");
    setSuccess("");
  };

  const selectedCases = cases.filter((c) => selectedCRNs.includes(c.crn));

  return (
    <div className="max-w-5xl space-y-6">
      <div className="mb-6">
        <h2 className="text-xl font-bold text-gray-900">Import Cases from eCase</h2>
        <p className="text-sm text-gray-500 mt-1">
          Import case details from the eCase system and associate them with your clients.
        </p>
      </div>

      {/* Progress Indicator */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                step >= 1 ? "bg-blue-600 text-white" : "bg-gray-200 text-gray-500"
              }`}
            >
              1
            </div>
            <span className={`text-sm font-medium ${step >= 1 ? "text-gray-900" : "text-gray-500"}`}>
              Select Court
            </span>
          </div>
          <div className="flex-1 h-0.5 bg-gray-200 mx-4"></div>
          <div className="flex items-center gap-2">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                step >= 3 ? "bg-blue-600 text-white" : "bg-gray-200 text-gray-500"
              }`}
            >
              2
            </div>
            <span className={`text-sm font-medium ${step >= 3 ? "text-gray-900" : "text-gray-500"}`}>
              Select Cases
            </span>
          </div>
          <div className="flex-1 h-0.5 bg-gray-200 mx-4"></div>
          <div className="flex items-center gap-2">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                step >= 4 ? "bg-blue-600 text-white" : "bg-gray-200 text-gray-500"
              }`}
            >
              3
            </div>
            <span className={`text-sm font-medium ${step >= 4 ? "text-gray-900" : "text-gray-500"}`}>
              Associate Clients
            </span>
          </div>
          <div className="flex-1 h-0.5 bg-gray-200 mx-4"></div>
          <div className="flex items-center gap-2">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                step >= 5 ? "bg-green-600 text-white" : "bg-gray-200 text-gray-500"
              }`}
            >
              4
            </div>
            <span className={`text-sm font-medium ${step >= 5 ? "text-gray-900" : "text-gray-500"}`}>
              Complete
            </span>
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
          {error}
        </div>
      )}

      {/* Success Message */}
      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm">
          {success}
        </div>
      )}

      {/* Step 1: Court Selection */}
      {step === 1 && <CourtSelector selectedCourt={selectedCourt} onCourtChange={handleCourtChange} />}

      {/* Step 2: Fetch Cases Button */}
      {step === 2 && (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <p className="text-sm text-gray-600 mb-4">
            Court selected: <span className="font-medium text-gray-900">{selectedCourt}</span>
          </p>
          <button
            onClick={handleFetchCases}
            disabled={loading}
            className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white text-sm font-medium rounded-lg transition-colors"
          >
            {loading ? "Fetching Cases..." : "Fetch Cases"}
          </button>
        </div>
      )}

      {/* Step 3: Case Selection */}
      {step === 3 && (
        <>
          <CRNList cases={cases} selectedCRNs={selectedCRNs} onSelectionChange={setSelectedCRNs} />
          {selectedCRNs.length > 0 && (
            <div className="flex gap-3">
              <button
                onClick={handleProceedToAttachment}
                className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
              >
                Proceed to Client Association →
              </button>
              <button
                onClick={handleReset}
                className="px-6 py-2.5 bg-white hover:bg-gray-50 text-gray-700 text-sm font-medium rounded-lg border border-gray-300 transition-colors"
              >
                Start Over
              </button>
            </div>
          )}
        </>
      )}

      {/* Step 4: Client Association */}
      {step === 4 && (
        <>
          <ClientAttachmentForm
            cases={selectedCases}
            existingClients={existingClients}
            onAttachmentsChange={setClientAttachments}
          />
          <div className="flex gap-3">
            <button
              onClick={handleImport}
              disabled={loading || clientAttachments.length === 0}
              className="px-6 py-2.5 bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white text-sm font-medium rounded-lg transition-colors"
            >
              {loading ? "Importing..." : "Import Cases"}
            </button>
            <button
              onClick={() => setStep(3)}
              disabled={loading}
              className="px-6 py-2.5 bg-white hover:bg-gray-50 text-gray-700 text-sm font-medium rounded-lg border border-gray-300 transition-colors"
            >
              ← Back to Case Selection
            </button>
          </div>
        </>
      )}

      {/* Step 5: Success */}
      {step === 5 && success && (
        <div className="bg-white rounded-xl border border-gray-200 p-8 text-center space-y-4">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h3 className="text-xl font-bold text-gray-900">Import Successful!</h3>
          <p className="text-gray-600">{success}</p>
          <div className="flex gap-3 justify-center">
            <button
              onClick={() => router.push("/dashboard/cases")}
              className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
            >
              View All Cases
            </button>
            <button
              onClick={handleReset}
              className="px-6 py-2.5 bg-white hover:bg-gray-50 text-gray-700 text-sm font-medium rounded-lg border border-gray-300 transition-colors"
            >
              Import More Cases
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
