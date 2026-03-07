"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface Client {
  id: string;
  client_name: string;
  client_whatsapp: string;
  case_title: string;
  court_name: string;
  updated_at: string;
}

interface LatestHearing {
  next_hearing_date: string | null;
  purpose_of_hearing: string | null;
}

export default function CasesListPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [latestHearings, setLatestHearings] = useState<Record<string, LatestHearing>>({});
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetch("/api/cases")
      .then((res) => res.json())
      .then(async (data) => {
        const list: Client[] = data.clients || [];
        setClients(list);

        const map: Record<string, LatestHearing> = {};
        await Promise.all(
          list.map(async (c) => {
            try {
              const res = await fetch(`/api/cases/${c.id}`);
              const d = await res.json();
              if (d.latestHearing) {
                map[c.id] = {
                  next_hearing_date: d.latestHearing.next_hearing_date,
                  purpose_of_hearing: d.latestHearing.purpose_of_hearing,
                };
              }
            } catch { /* skip */ }
          })
        );
        setLatestHearings(map);
      })
      .finally(() => setLoading(false));
  }, []);

  const today = new Date().toISOString().split("T")[0];

  const filteredClients = clients.filter(
    (c) =>
      c.client_name.toLowerCase().includes(search.toLowerCase()) ||
      c.case_title.toLowerCase().includes(search.toLowerCase()) ||
      c.court_name.toLowerCase().includes(search.toLowerCase())
  );

  function isUpcoming(clientId: string): boolean {
    const h = latestHearings[clientId];
    if (!h?.next_hearing_date) return false;
    const diff = (new Date(h.next_hearing_date).getTime() - new Date(today).getTime()) / (1000 * 60 * 60 * 24);
    return diff >= 0 && diff <= 7;
  }

  async function handleDelete(id: string, name: string) {
    if (!confirm(`Delete client "${name}" and all their hearing records? This cannot be undone.`)) return;

    const res = await fetch(`/api/cases/${id}`, { method: "DELETE" });
    if (res.ok) {
      setClients((prev) => prev.filter((c) => c.id !== id));
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-gray-900">All Clients</h2>
          <p className="text-sm text-gray-500">{clients.length} client(s) total</p>
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <input
            type="text"
            placeholder="Search clients..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 sm:w-64 px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <Link
            href="/dashboard/add-case"
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors whitespace-nowrap"
          >
            + Add Client
          </Link>
        </div>
      </div>

      {filteredClients.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border border-gray-200">
          <p className="text-gray-500">
            {search ? "No clients match your search." : "No clients yet."}
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Client</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Case Title</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600 hidden md:table-cell">Court</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Next Hearing</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600 hidden lg:table-cell">Purpose</th>
                  <th className="text-right px-4 py-3 font-medium text-gray-600">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredClients.map((c) => {
                  const h = latestHearings[c.id];
                  return (
                    <tr key={c.id} className={`hover:bg-gray-50 ${isUpcoming(c.id) ? "bg-amber-50/50" : ""}`}>
                      <td className="px-4 py-3">
                        <div>
                          <p className="font-medium text-gray-900">{c.client_name}</p>
                          <p className="text-xs text-gray-400">{c.client_whatsapp}</p>
                        </div>
                      </td>
                      <td className="px-4 py-3 font-medium text-gray-900">{c.case_title}</td>
                      <td className="px-4 py-3 text-gray-600 hidden md:table-cell">{c.court_name}</td>
                      <td className="px-4 py-3">
                        {h?.next_hearing_date ? (
                          <span
                            className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                              isUpcoming(c.id)
                                ? "bg-amber-100 text-amber-700"
                                : "bg-gray-100 text-gray-600"
                            }`}
                          >
                            {h.next_hearing_date}
                          </span>
                        ) : (
                          <span className="text-gray-400 text-xs">No hearings yet</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-gray-600 hidden lg:table-cell max-w-[200px] truncate">
                        {h?.purpose_of_hearing || "—"}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Link
                            href={`/dashboard/edit-case/${c.id}`}
                            className="px-3 py-1.5 text-xs font-medium text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-md transition-colors"
                          >
                            View / Update
                          </Link>
                          <button
                            onClick={() => handleDelete(c.id, c.client_name)}
                            className="px-3 py-1.5 text-xs font-medium text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100 rounded-md transition-colors"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
