"use client";

import { useState } from "react";

interface CaseItem {
  crn: string;
  case_title: string;
  parties: string;
  filing_date: string;
  case_type: string;
  case_status: string;
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

interface ClientAttachmentFormProps {
  cases: CaseItem[];
  existingClients: ExistingClient[];
  onAttachmentsChange: (attachments: ClientAttachment[]) => void;
}

export default function ClientAttachmentForm({
  cases,
  existingClients,
  onAttachmentsChange,
}: ClientAttachmentFormProps) {
  const [attachments, setAttachments] = useState<Record<string, ClientAttachment>>(
    cases.reduce((acc, caseItem) => {
      acc[caseItem.crn] = {
        crn: caseItem.crn,
        action: "create",
      };
      return acc;
    }, {} as Record<string, ClientAttachment>)
  );

  const updateAttachment = (crn: string, updates: Partial<ClientAttachment>) => {
    const newAttachments = {
      ...attachments,
      [crn]: {
        ...attachments[crn],
        ...updates,
      },
    };
    setAttachments(newAttachments);
    onAttachmentsChange(Object.values(newAttachments));
  };

  if (cases.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="font-semibold text-gray-900 mb-2">Client Association</h3>
        <p className="text-sm text-gray-500 mb-4">
          For each selected case, choose to create a new client or attach to an existing one.
        </p>
      </div>

      {cases.map((caseItem) => {
        const attachment = attachments[caseItem.crn];
        return (
          <div key={caseItem.crn} className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="mb-4">
              <h4 className="font-medium text-gray-900">{caseItem.case_title}</h4>
              <p className="text-xs text-gray-500 mt-1 font-mono">{caseItem.crn}</p>
              <p className="text-xs text-gray-500">{caseItem.parties}</p>
            </div>

            <div className="space-y-4">
              <div className="flex gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name={`action-${caseItem.crn}`}
                    value="create"
                    checked={attachment.action === "create"}
                    onChange={() => updateAttachment(caseItem.crn, { action: "create", client_id: undefined })}
                    className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-2 focus:ring-blue-500"
                  />
                  <span className="text-sm font-medium text-gray-700">Create New Client</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name={`action-${caseItem.crn}`}
                    value="attach"
                    checked={attachment.action === "attach"}
                    onChange={() =>
                      updateAttachment(caseItem.crn, {
                        action: "attach",
                        client_name: undefined,
                        client_whatsapp: undefined,
                      })
                    }
                    className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-2 focus:ring-blue-500"
                  />
                  <span className="text-sm font-medium text-gray-700">Attach to Existing</span>
                </label>
              </div>

              {attachment.action === "create" && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pl-6 border-l-2 border-blue-200">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Client Name *
                    </label>
                    <input
                      type="text"
                      value={attachment.client_name || ""}
                      onChange={(e) => updateAttachment(caseItem.crn, { client_name: e.target.value })}
                      placeholder="e.g. Rajesh Sharma"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Client WhatsApp *
                    </label>
                    <input
                      type="text"
                      value={attachment.client_whatsapp || ""}
                      onChange={(e) => updateAttachment(caseItem.crn, { client_whatsapp: e.target.value })}
                      placeholder="e.g. +919876543210"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                  </div>
                </div>
              )}

              {attachment.action === "attach" && (
                <div className="pl-6 border-l-2 border-blue-200">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Select Existing Client *
                  </label>
                  <select
                    value={attachment.client_id || ""}
                    onChange={(e) => updateAttachment(caseItem.crn, { client_id: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  >
                    <option value="">-- Select a Client --</option>
                    {existingClients.map((client) => (
                      <option key={client.id} value={client.id}>
                        {client.client_name} - {client.case_title}
                      </option>
                    ))}
                  </select>
                  {existingClients.length === 0 && (
                    <p className="text-xs text-gray-500 mt-1">
                      No existing clients found. Please create a new client.
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
