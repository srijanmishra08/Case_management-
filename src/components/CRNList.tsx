"use client";

interface CaseListItem {
  crn: string;
  case_title: string;
  parties: string;
  filing_date: string;
  case_type: string;
  case_status: string;
  alreadyImported?: boolean;
}

interface CRNListProps {
  cases: CaseListItem[];
  selectedCRNs: string[];
  onSelectionChange: (crns: string[]) => void;
}

export default function CRNList({ cases, selectedCRNs, onSelectionChange }: CRNListProps) {
  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      const availableCRNs = cases.filter((c) => !c.alreadyImported).map((c) => c.crn);
      onSelectionChange(availableCRNs);
    } else {
      onSelectionChange([]);
    }
  };

  const handleSelectOne = (crn: string, checked: boolean) => {
    if (checked) {
      onSelectionChange([...selectedCRNs, crn]);
    } else {
      onSelectionChange(selectedCRNs.filter((c) => c !== crn));
    }
  };

  const allSelected = cases.length > 0 && selectedCRNs.length === cases.filter((c) => !c.alreadyImported).length;

  if (cases.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
        <p className="text-gray-500 text-sm">No cases found for this court.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
        <h3 className="font-semibold text-gray-900">Available Cases</h3>
        <p className="text-xs text-gray-500 mt-0.5">{cases.length} case(s) found</p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              <th className="text-left px-4 py-3 font-medium text-gray-600 w-12">
                <input
                  type="checkbox"
                  checked={allSelected}
                  onChange={handleSelectAll}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                />
              </th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">CRN</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Case Title</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600 hidden md:table-cell">Parties</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600 hidden lg:table-cell">Filing Date</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600 hidden xl:table-cell">Case Type</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {cases.map((caseItem) => (
              <tr
                key={caseItem.crn}
                className={`hover:bg-gray-50 ${caseItem.alreadyImported ? "opacity-50 bg-gray-50" : ""}`}
              >
                <td className="px-4 py-3">
                  {caseItem.alreadyImported ? (
                    <span className="text-xs text-gray-400">Imported</span>
                  ) : (
                    <input
                      type="checkbox"
                      checked={selectedCRNs.includes(caseItem.crn)}
                      onChange={(e) => handleSelectOne(caseItem.crn, e.target.checked)}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                    />
                  )}
                </td>
                <td className="px-4 py-3 font-mono text-xs text-gray-900">{caseItem.crn}</td>
                <td className="px-4 py-3 font-medium text-gray-900">{caseItem.case_title}</td>
                <td className="px-4 py-3 text-gray-600 hidden md:table-cell">{caseItem.parties}</td>
                <td className="px-4 py-3 text-gray-600 hidden lg:table-cell">{caseItem.filing_date}</td>
                <td className="px-4 py-3 text-gray-600 hidden xl:table-cell">{caseItem.case_type}</td>
                <td className="px-4 py-3">
                  <span
                    className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                      caseItem.case_status === "Listed"
                        ? "bg-blue-100 text-blue-700"
                        : "bg-gray-100 text-gray-600"
                    }`}
                  >
                    {caseItem.case_status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {selectedCRNs.length > 0 && (
        <div className="px-6 py-3 bg-blue-50 border-t border-blue-200">
          <p className="text-sm text-blue-700 font-medium">
            {selectedCRNs.length} case(s) selected for import
          </p>
        </div>
      )}
    </div>
  );
}
