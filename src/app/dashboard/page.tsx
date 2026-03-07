"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface Client {
  id: string;
  client_name: string;
  case_title: string;
  court_name: string;
  updated_at: string;
}

interface HearingInfo {
  next_hearing_date: string | null;
  purpose_of_hearing: string | null;
}

export default function DashboardPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [latestHearings, setLatestHearings] = useState<Record<string, HearingInfo>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/cases")
      .then((res) => res.json())
      .then(async (data) => {
        const clientList: Client[] = data.clients || [];
        setClients(clientList);

        // Fetch latest hearing for each client
        const hearingMap: Record<string, HearingInfo> = {};
        await Promise.all(
          clientList.map(async (c) => {
            try {
              const res = await fetch(`/api/cases/${c.id}`);
              const d = await res.json();
              if (d.latestHearing) {
                hearingMap[c.id] = {
                  next_hearing_date: d.latestHearing.next_hearing_date,
                  purpose_of_hearing: d.latestHearing.purpose_of_hearing,
                };
              }
            } catch { /* skip */ }
          })
        );
        setLatestHearings(hearingMap);
      })
      .finally(() => setLoading(false));
  }, []);

  const today = new Date().toISOString().split("T")[0];

  const upcomingClients = clients.filter((c) => {
    const h = latestHearings[c.id];
    return h?.next_hearing_date && h.next_hearing_date >= today;
  });

  const urgentClients = upcomingClients.filter((c) => {
    const h = latestHearings[c.id];
    if (!h?.next_hearing_date) return false;
    const diff = (new Date(h.next_hearing_date).getTime() - new Date(today).getTime()) / (1000 * 60 * 60 * 24);
    return diff <= 3;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard label="Total Clients" value={clients.length} color="blue" />
        <StatCard label="Upcoming Hearings" value={upcomingClients.length} color="emerald" />
        <StatCard label="Urgent (≤3 days)" value={urgentClients.length} color="red" />
      </div>

      {/* Quick actions */}
      <div className="flex gap-3">
        <Link
          href="/dashboard/add-case"
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          Add New Client
        </Link>
        <Link
          href="/dashboard/cases"
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-white hover:bg-gray-50 text-gray-700 text-sm font-medium rounded-lg border border-gray-300 transition-colors"
        >
          View All Clients
        </Link>
      </div>

      {/* Urgent hearings */}
      {urgentClients.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-5">
          <h3 className="text-red-800 font-semibold mb-3 flex items-center gap-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
            Urgent: Hearings Within 3 Days
          </h3>
          <div className="space-y-2">
            {urgentClients.map((c) => {
              const h = latestHearings[c.id];
              return (
                <Link
                  key={c.id}
                  href={`/dashboard/edit-case/${c.id}`}
                  className="block bg-white rounded-lg p-3 border border-red-100 hover:border-red-300 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-900">{c.case_title}</p>
                      <p className="text-sm text-gray-500">{c.client_name} — {c.court_name}</p>
                    </div>
                    <span className="text-sm font-medium text-red-600 bg-red-100 px-2.5 py-1 rounded-full">
                      {h?.next_hearing_date}
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {/* Upcoming hearings */}
      {upcomingClients.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-200">
            <h3 className="font-semibold text-gray-900">Upcoming Hearings</h3>
          </div>
          <div className="divide-y divide-gray-100">
            {upcomingClients.slice(0, 10).map((c) => {
              const h = latestHearings[c.id];
              return (
                <Link
                  key={c.id}
                  href={`/dashboard/edit-case/${c.id}`}
                  className="flex items-center justify-between px-5 py-3 hover:bg-gray-50 transition-colors"
                >
                  <div>
                    <p className="font-medium text-gray-900 text-sm">{c.case_title}</p>
                    <p className="text-xs text-gray-500">{c.client_name} — {c.court_name}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-700">{h?.next_hearing_date}</p>
                    <p className="text-xs text-gray-500">{h?.purpose_of_hearing || ""}</p>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {clients.length === 0 && (
        <div className="text-center py-16 bg-white rounded-xl border border-gray-200">
          <svg className="w-12 h-12 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
          </svg>
          <p className="text-gray-500 mb-4">No clients yet. Start by adding your first client.</p>
          <Link
            href="/dashboard/add-case"
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
          >
            Add New Client
          </Link>
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value, color }: { label: string; value: number; color: string }) {
  const colorMap: Record<string, string> = {
    blue: "bg-blue-50 text-blue-700 border-blue-200",
    emerald: "bg-emerald-50 text-emerald-700 border-emerald-200",
    red: "bg-red-50 text-red-700 border-red-200",
  };

  return (
    <div className={`rounded-xl border p-5 ${colorMap[color]}`}>
      <p className="text-2xl font-bold">{value}</p>
      <p className="text-sm opacity-75">{label}</p>
    </div>
  );
}
