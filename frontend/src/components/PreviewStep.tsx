"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { toast } from "sonner";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "";

interface PreviewStepProps {
  data: PreviewData | null;
  fileName: string;
  file?: File;
  onDataLoaded?: (data: PreviewData) => void;
  onConfirm: () => void;
  onBack: () => void;
}

interface PreviewData {
  headers: string[];
  rows: Record<string, string>[];
  total_rows: number;
}

export function PreviewStep({
  data,
  fileName,
  file,
  onDataLoaded,
  onConfirm,
  onBack,
}: PreviewStepProps) {
  const [loading, setLoading] = useState(!data);
  const [previewData, setPreviewData] = useState<PreviewData | null>(data);
  const containerRef = useRef<HTMLDivElement>(null);
  const hasFetched = useRef(false);

  const fetchPreview = useCallback(async () => {
    if (!file || hasFetched.current) return;
    hasFetched.current = true;

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch(`${API_URL}/api/preview`, {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to parse CSV");
      }

      const result: PreviewData = await res.json();
      setPreviewData(result);
      onDataLoaded?.(result);
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to load preview",
      );
      onBack();
    } finally {
      setLoading(false);
    }
  }, [file, onDataLoaded, onBack]);

  useEffect(() => {
    if (!data && file) {
      fetchPreview();
    }
  }, [data, file, fetchPreview]);

  if (loading) {
    return (
      <div className="mx-auto max-w-xl py-20 text-center">
        <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
        <p className="text-sm text-muted-foreground">Parsing your CSV...</p>
      </div>
    );
  }

  if (!previewData) return null;

  const { headers, rows, total_rows } = previewData;

  return (
    <div className="mx-auto max-w-6xl space-y-5">
      {/* Info bar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-semibold text-foreground">
            Preview: {fileName}
          </h2>
          <span className="rounded-full bg-indigo-500/15 px-3 py-1 text-xs font-medium text-indigo-400">
            {total_rows} rows • {headers.length} columns
          </span>
        </div>
        <button
          id="upload-different-file"
          onClick={onBack}
          className="text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          ← Upload Different File
        </button>
      </div>

      {/* Table container with virtualization */}
      <div
        ref={containerRef}
        className="custom-scrollbar overflow-auto rounded-xl border border-border bg-card"
        style={{ maxHeight: "480px" }}
      >
        <table className="w-full text-sm">
          <thead className="sticky top-0 z-10 bg-muted/90 backdrop-blur-sm">
            <tr>
              <th className="whitespace-nowrap px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                #
              </th>
              {headers.map((header) => (
                <th
                  key={header}
                  className="whitespace-nowrap px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground"
                >
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {rows.map((row, i) => (
              <tr
                key={i}
                className="transition-colors hover:bg-muted/40"
              >
                <td className="whitespace-nowrap px-4 py-2.5 text-xs text-muted-foreground">
                  {i + 1}
                </td>
                {headers.map((header) => (
                  <td
                    key={header}
                    className="max-w-[240px] truncate whitespace-nowrap px-4 py-2.5 text-foreground"
                    title={row[header] || ""}
                  >
                    {row[header] || (
                      <span className="text-muted-foreground/40">—</span>
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        <button
          id="confirm-import"
          onClick={onConfirm}
          className="flex-1 rounded-xl bg-primary px-6 py-3.5 text-sm font-semibold text-primary-foreground shadow-lg shadow-indigo-500/20 transition-all duration-200 hover:brightness-110"
        >
          Confirm &amp; Import with AI
        </button>
      </div>
    </div>
  );
}
