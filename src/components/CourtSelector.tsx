"use client";

import { useEffect, useState } from "react";

interface Court {
  code: string;
  name: string;
  location: string;
  type: string;
}

interface CourtSelectorProps {
  selectedCourt: string;
  onCourtChange: (courtCode: string) => void;
}

export default function CourtSelector({ selectedCourt, onCourtChange }: CourtSelectorProps) {
  const [courts, setCourts] = useState<Court[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/ecase/courts")
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch courts");
        return res.json();
      })
      .then((data) => {
        setCourts(data.courts || []);
      })
      .catch((err) => {
        setError(err.message || "Failed to load courts");
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <p className="text-sm text-gray-500">Loading courts...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-xl p-6">
        <p className="text-sm text-red-700">{error}</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <label className="block text-sm font-medium text-gray-700 mb-2">
        Select Court *
      </label>
      <select
        value={selectedCourt}
        onChange={(e) => onCourtChange(e.target.value)}
        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
      >
        <option value="">-- Select a Court --</option>
        {courts.map((court) => (
          <option key={court.code} value={court.code}>
            {court.name} - {court.location} ({court.type})
          </option>
        ))}
      </select>
      {selectedCourt && (
        <p className="mt-2 text-xs text-gray-500">
          Selected: {courts.find((c) => c.code === selectedCourt)?.name}
        </p>
      )}
    </div>
  );
}
