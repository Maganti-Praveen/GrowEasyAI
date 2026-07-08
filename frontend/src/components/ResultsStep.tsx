"use client";

import { useState, useMemo } from "react";

interface ImportResult {
  success: Record<string, string>[];
  skipped: { original_data: Record<string, string>; reason: string }[];
  total_imported: number;
  total_skipped: number;
}

interface ResultsStepProps {
  result: ImportResult;
  onImportAnother: () => void;
}

const CRM_COLUMNS = [
  "name",
  "email",
  "country_code",
  "mobile_without_country_code",
  "company",
  "city",
  "state",
  "country",
  "lead_owner",
  "crm_status",
  "data_source",
  "crm_note",
  "possession_time",
  "created_at",
];

function downloadCSV(data: Record<string, string>[], filename: string) {
  if (data.length === 0) return;

  const headers = Object.keys(data[0]);
  const csvRows = [
    headers.map((h) => `"${h}"`).join(","),
    ...data.map((row) =>
      headers
        .map((h) => {
          const val = (row[h] ?? "").toString().replace(/"/g, '""');
          return `"${val}"`;
        })
        .join(","),
    ),
  ];

  const blob = new Blob([csvRows.join("\n")], {
    type: "text/csv;charset=utf-8;",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

export function ResultsStep({ result, onImportAnother }: ResultsStepProps) {
  const [activeTab, setActiveTab] = useState<"imported" | "skipped">(
    "imported",
  );

  const total = result.total_imported + result.total_skipped;
  const importRate =
    total > 0 ? Math.round((result.total_imported / total) * 100) : 0;

  const skippedColumns = useMemo(() => {
    if (result.skipped.length === 0) return [];
    const allKeys = new Set<string>();
    result.skipped.forEach((s) => {
      Object.keys(s.original_data || {}).forEach((k) => allKeys.add(k));
    });
    return Array.from(allKeys);
  }, [result.skipped]);

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      {/* Summary cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-border bg-card p-5">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Total Uploaded
          </p>
          <p className="mt-1 text-3xl font-bold text-foreground">{total}</p>
        </div>
        <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-5">
          <p className="text-xs font-medium uppercase tracking-wider text-emerald-400">
            Successfully Imported
          </p>
          <p className="mt-1 text-3xl font-bold text-emerald-400">
            {result.total_imported}
          </p>
          <p className="mt-0.5 text-xs text-emerald-400/60">
            {importRate}% success rate
          </p>
        </div>
        <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-5">
          <p className="text-xs font-medium uppercase tracking-wider text-amber-400">
            Skipped
          </p>
          <p className="mt-1 text-3xl font-bold text-amber-400">
            {result.total_skipped}
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 rounded-xl bg-muted p-1">
        <button
          id="tab-imported"
          onClick={() => setActiveTab("imported")}
          className={`flex-1 rounded-lg px-4 py-2.5 text-sm font-medium transition-all ${
            activeTab === "imported"
              ? "bg-card text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          Imported ({result.total_imported})
        </button>
        <button
          id="tab-skipped"
          onClick={() => setActiveTab("skipped")}
          className={`flex-1 rounded-lg px-4 py-2.5 text-sm font-medium transition-all ${
            activeTab === "skipped"
              ? "bg-card text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          Skipped ({result.total_skipped})
        </button>
      </div>

      {/* Table */}
      <div
        className="custom-scrollbar overflow-auto rounded-xl border border-border bg-card"
        style={{ maxHeight: "420px" }}
      >
        {activeTab === "imported" ? (
          result.success.length > 0 ? (
            <table className="w-full text-sm">
              <thead className="sticky top-0 z-10 bg-muted/90 backdrop-blur-sm">
                <tr>
                  <th className="whitespace-nowrap px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    #
                  </th>
                  {CRM_COLUMNS.map((col) => (
                    <th
                      key={col}
                      className="whitespace-nowrap px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground"
                    >
                      {col.replace(/_/g, " ")}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {result.success.map((row, i) => (
                  <tr key={i} className="transition-colors hover:bg-muted/40">
                    <td className="whitespace-nowrap px-4 py-2.5 text-xs text-muted-foreground">
                      {i + 1}
                    </td>
                    {CRM_COLUMNS.map((col) => (
                      <td
                        key={col}
                        className="max-w-[200px] truncate whitespace-nowrap px-4 py-2.5 text-foreground"
                        title={row[col] || ""}
                      >
                        {col === "crm_status" && row[col] ? (
                          <StatusBadge status={row[col]} />
                        ) : (
                          row[col] || (
                            <span className="text-muted-foreground/40">—</span>
                          )
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <EmptyState message="No records were imported" />
          )
        ) : result.skipped.length > 0 ? (
          <table className="w-full text-sm">
            <thead className="sticky top-0 z-10 bg-muted/90 backdrop-blur-sm">
              <tr>
                <th className="whitespace-nowrap px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  #
                </th>
                <th className="whitespace-nowrap px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-amber-400">
                  Skip Reason
                </th>
                {skippedColumns.map((col) => (
                  <th
                    key={col}
                    className="whitespace-nowrap px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground"
                  >
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {result.skipped.map((item, i) => (
                <tr key={i} className="transition-colors hover:bg-muted/40">
                  <td className="whitespace-nowrap px-4 py-2.5 text-xs text-muted-foreground">
                    {i + 1}
                  </td>
                  <td className="whitespace-nowrap px-4 py-2.5 text-xs text-amber-400">
                    {item.reason}
                  </td>
                  {skippedColumns.map((col) => (
                    <td
                      key={col}
                      className="max-w-[200px] truncate whitespace-nowrap px-4 py-2.5 text-foreground"
                      title={item.original_data?.[col] || ""}
                    >
                      {item.original_data?.[col] || (
                        <span className="text-muted-foreground/40">—</span>
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <EmptyState message="No records were skipped — all data was imported!" />
        )}
      </div>

      {/* Actions */}
      <div className="flex flex-wrap gap-3">
        <button
          id="download-results-csv"
          onClick={() => downloadCSV(result.success, "groweasy_import_results.csv")}
          disabled={result.success.length === 0}
          className="rounded-xl border border-border bg-card px-6 py-3 text-sm font-semibold text-foreground transition-all hover:bg-muted disabled:opacity-40"
        >
          ↓ Download Results as CSV
        </button>
        <button
          id="import-another-file"
          onClick={onImportAnother}
          className="rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-lg shadow-indigo-500/20 transition-all hover:brightness-110"
        >
          Import Another File
        </button>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    GOOD_LEAD_FOLLOW_UP:
      "bg-blue-500/15 text-blue-400 border-blue-500/20",
    DID_NOT_CONNECT:
      "bg-yellow-500/15 text-yellow-400 border-yellow-500/20",
    BAD_LEAD: "bg-red-500/15 text-red-400 border-red-500/20",
    SALE_DONE:
      "bg-emerald-500/15 text-emerald-400 border-emerald-500/20",
  };

  return (
    <span
      className={`inline-block rounded-md border px-2 py-0.5 text-xs font-medium ${
        styles[status] || "bg-muted text-muted-foreground border-border"
      }`}
    >
      {status.replace(/_/g, " ")}
    </span>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="py-16 text-center">
      <p className="text-sm text-muted-foreground">{message}</p>
    </div>
  );
}
