"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { generateCaseUpdateMessage } from "@/lib/messages";

interface ClientInfo {
  id: string;
  client_name: string;
  client_whatsapp: string;
  case_title: string;
  court_name: string;
}

interface Hearing {
  id: string;
  hearing_date: string;
  next_hearing_date: string | null;
  purpose_of_hearing: string | null;
  special_notes: string | null;
  created_at: string;
}

interface UserInfo {
  firm_name: string;
}

export default function ClientDetailPage() {
  const router = useRouter();
  const params = useParams();
  const clientId = params.id as string;

  const [client, setClient] = useState<ClientInfo | null>(null);
  const [hearings, setHearings] = useState<Hearing[]>([]);
  const [user, setUser] = useState<UserInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Hearing form
  const [hearingForm, setHearingForm] = useState({
    hearing_date: "",
    next_hearing_date: "",
    purpose_of_hearing: "",
    special_notes: "",
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // WhatsApp preview
  const [previewMessage, setPreviewMessage] = useState<string | null>(null);

  // Edit client mode
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    client_name: "",
    client_whatsapp: "",
    case_title: "",
    court_name: "",
  });

  useEffect(() => {
    Promise.all([
      fetch(`/api/cases/${clientId}`).then((r) => r.json()),
      fetch("/api/auth/me").then((r) => r.json()),
    ])
      .then(([caseData, userData]) => {
        if (caseData.client) {
          setClient(caseData.client);
          setEditForm({
            client_name: caseData.client.client_name,
            client_whatsapp: caseData.client.client_whatsapp,
            case_title: caseData.client.case_title,
            court_name: caseData.client.court_name,
          });
        }
        if (caseData.hearings) setHearings(caseData.hearings);
        if (userData.user) setUser(userData.user);
      })
      .catch(() => setError("Failed to load client"))
      .finally(() => setLoading(false));
  }, [clientId]);

  async function handleSaveHearing(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSaved(false);
    setSaving(true);

    try {
      const res = await fetch(`/api/cases/${clientId}/hearings`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(hearingForm),
      });

      if (!res.ok) {
        const err = await res.json();
        setError(err.error || "Failed to save hearing");
        return;
      }

      const data = await res.json();
      setHearings((prev) => [data.hearing, ...prev]);
      setSaved(true);

      // Generate WhatsApp preview
      const msg = generateCaseUpdateMessage({
        case_title: client!.case_title,
        court_name: client!.court_name,
        previous_hearing_date: hearingForm.hearing_date || null,
        next_hearing_date: hearingForm.next_hearing_date || null,
        purpose_of_hearing: hearingForm.purpose_of_hearing || null,
        special_notes: hearingForm.special_notes || null,
        firm_name: user?.firm_name || "Law Office",
      });
      setPreviewMessage(msg);

      // Reset form
      setHearingForm({ hearing_date: "", next_hearing_date: "", purpose_of_hearing: "", special_notes: "" });
    } catch {
      setError("Network error saving hearing");
    } finally {
      setSaving(false);
    }
  }

  function buildWhatsAppLink() {
    if (!previewMessage || !client) return "#";
    const phone = client.client_whatsapp.replace(/\D/g, "");
    return `https://wa.me/${phone}?text=${encodeURIComponent(previewMessage)}`;
  }

  async function handleUpdateClient(e: React.FormEvent) {
    e.preventDefault();
    try {
      const res = await fetch(`/api/cases/${clientId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editForm),
      });
      if (res.ok) {
        const data = await res.json();
        setClient(data.client);
        setEditing(false);
      }
    } catch {
      setError("Failed to update client");
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!client) {
    return <div className="text-center py-20 text-gray-500">Client not found.</div>;
  }

  return (
    <div className="max-w-4xl space-y-6">
      {/* Client Info Header */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        {editing ? (
          <form onSubmit={handleUpdateClient} className="space-y-4">
            <h3 className="font-semibold text-gray-900 mb-3">Edit Client Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input name="client_name" value={editForm.client_name} onChange={(e) => setEditForm((p) => ({ ...p, client_name: e.target.value }))} className="px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900" placeholder="Client Name" required />
              <input name="client_whatsapp" value={editForm.client_whatsapp} onChange={(e) => setEditForm((p) => ({ ...p, client_whatsapp: e.target.value }))} className="px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900" placeholder="WhatsApp Number" required />
              <input name="case_title" value={editForm.case_title} onChange={(e) => setEditForm((p) => ({ ...p, case_title: e.target.value }))} className="px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900" placeholder="Case Title" required />
              <input name="court_name" value={editForm.court_name} onChange={(e) => setEditForm((p) => ({ ...p, court_name: e.target.value }))} className="px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900" placeholder="Court Name" required />
            </div>
            <div className="flex gap-2">
              <button type="submit" className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg">Save</button>
              <button type="button" onClick={() => setEditing(false)} className="px-4 py-2 text-gray-600 hover:text-gray-800 text-sm">Cancel</button>
            </div>
          </form>
        ) : (
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-xl font-bold text-gray-900">{client.client_name}</h2>
              <p className="text-sm text-gray-500 mt-1">{client.client_whatsapp}</p>
              <div className="flex items-center gap-4 mt-3">
                <span className="inline-flex items-center gap-1.5 text-sm text-gray-700">
                  <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
                  {client.case_title}
                </span>
                <span className="inline-flex items-center gap-1.5 text-sm text-gray-700">
                  <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 14v3m4-3v3m4-3v3M3 21h18M3 10h18M3 7l9-4 9 4" /></svg>
                  {client.court_name}
                </span>
              </div>
            </div>
            <button
              onClick={() => setEditing(true)}
              className="px-3 py-1.5 text-xs font-medium text-gray-600 hover:text-gray-800 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
            >
              Edit Info
            </button>
          </div>
        )}
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">{error}</div>
      )}

      {/* Add Hearing Update Form */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 bg-blue-50">
          <h3 className="font-semibold text-blue-900">Add Hearing Update</h3>
          <p className="text-xs text-blue-700 mt-0.5">Fill in the hearing details and save. A WhatsApp preview will appear automatically.</p>
        </div>
        <form onSubmit={handleSaveHearing} className="p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Hearing Date *</label>
              <input
                type="date"
                value={hearingForm.hearing_date}
                onChange={(e) => setHearingForm((p) => ({ ...p, hearing_date: e.target.value }))}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Next Hearing Date</label>
              <input
                type="date"
                value={hearingForm.next_hearing_date}
                onChange={(e) => setHearingForm((p) => ({ ...p, next_hearing_date: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Purpose of Hearing</label>
            <textarea
              value={hearingForm.purpose_of_hearing}
              onChange={(e) => setHearingForm((p) => ({ ...p, purpose_of_hearing: e.target.value }))}
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              placeholder="e.g. Arguments on bail application"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Special Notes</label>
            <textarea
              value={hearingForm.special_notes}
              onChange={(e) => setHearingForm((p) => ({ ...p, special_notes: e.target.value }))}
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              placeholder="Any special instructions or notes"
            />
          </div>
          <div className="flex items-center gap-3">
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white text-sm font-medium rounded-lg transition-colors"
            >
              {saving ? "Saving..." : "Save Hearing & Preview WhatsApp"}
            </button>
            {saved && !previewMessage && (
              <span className="text-sm text-green-600 font-medium">Hearing saved!</span>
            )}
          </div>
        </form>
      </div>

      {/* WhatsApp Preview */}
      {previewMessage && (
        <div className="bg-white rounded-xl border-2 border-green-200 overflow-hidden shadow-lg">
          <div className="px-6 py-4 bg-green-50 border-b border-green-200 flex items-center gap-2">
            <svg className="w-5 h-5 text-green-600" viewBox="0 0 24 24" fill="currentColor">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
            </svg>
            <h3 className="font-semibold text-green-800">Preview Message to {client.client_name}</h3>
          </div>
          <div className="p-6">
            <div className="bg-green-50/50 rounded-lg p-4 mb-4 font-mono text-sm text-gray-800 whitespace-pre-wrap border border-green-100">
              {previewMessage}
            </div>
            <div className="flex items-center gap-3">
              <a
                href={buildWhatsAppLink()}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-lg transition-colors"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                </svg>
                Open WhatsApp
              </a>
              <button
                onClick={() => setPreviewMessage(null)}
                className="px-4 py-2.5 text-gray-600 hover:text-gray-800 text-sm font-medium transition-colors"
              >
                Dismiss
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Hearing History */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="font-semibold text-gray-900">Hearing History</h3>
          <p className="text-xs text-gray-500 mt-0.5">{hearings.length} update(s) recorded</p>
        </div>
        {hearings.length === 0 ? (
          <div className="p-8 text-center text-gray-400 text-sm">
            No hearing updates yet. Add the first one above.
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {hearings.map((h, idx) => (
              <div key={h.id} className={`px-6 py-4 ${idx === 0 ? "bg-blue-50/30" : ""}`}>
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-semibold text-gray-900">
                        Hearing: {h.hearing_date}
                      </span>
                      {h.next_hearing_date && (
                        <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                          Next: {h.next_hearing_date}
                        </span>
                      )}
                      {idx === 0 && (
                        <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                          Latest
                        </span>
                      )}
                    </div>
                    {h.purpose_of_hearing && (
                      <p className="text-sm text-gray-600"><span className="font-medium">Purpose:</span> {h.purpose_of_hearing}</p>
                    )}
                    {h.special_notes && (
                      <p className="text-sm text-gray-500"><span className="font-medium">Notes:</span> {h.special_notes}</p>
                    )}
                  </div>
                  <span className="text-xs text-gray-400 whitespace-nowrap ml-4">
                    {new Date(h.created_at).toLocaleDateString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Back link */}
      <button
        onClick={() => router.push("/dashboard/cases")}
        className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
      >
        ← Back to All Clients
      </button>
    </div>
  );
}
