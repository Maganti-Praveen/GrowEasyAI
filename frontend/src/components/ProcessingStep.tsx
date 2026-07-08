"use client";

import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

interface ImportResult {
  success: Record<string, string>[];
  skipped: { original_data: Record<string, string>; reason: string }[];
  total_imported: number;
  total_skipped: number;
}

interface BatchLog {
  batch: number;
  extracted: number;
  skipped: number;
}

interface ProcessingStepProps {
  headers: string[];
  rows: Record<string, string>[];
  onComplete: (result: ImportResult) => void;
  onError: () => void;
}

export function ProcessingStep({
  headers,
  rows,
  onComplete,
  onError,
}: ProcessingStepProps) {
  const [currentBatch, setCurrentBatch] = useState(0);
  const [totalBatches, setTotalBatches] = useState(0);
  const [status, setStatus] = useState("Connecting to AI service...");
  const [batchLogs, setBatchLogs] = useState<BatchLog[]>([]);
  const [isConnecting, setIsConnecting] = useState(true);
  const hasStarted = useRef(false);

  useEffect(() => {
    if (hasStarted.current) return;
    hasStarted.current = true;

    const runImport = async () => {
      try {
        const res = await fetch(`${API_URL}/api/import`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ headers, rows }),
        });

        if (!res.ok) {
          const err = await res.json().catch(() => ({ error: "Import failed" }));
          throw new Error(err.error || "Import failed");
        }

        if (!res.body) {
          throw new Error("Streaming not supported");
        }

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() || "";

          for (const line of lines) {
            if (!line.trim()) continue;

            try {
              const msg = JSON.parse(line);

              if (msg.type === "progress") {
                setIsConnecting(false);
                setCurrentBatch(msg.batch);
                setTotalBatches(msg.total);
                setStatus(
                  `Processing batch ${msg.batch} of ${msg.total} • ${rows.length} records`,
                );
                setBatchLogs((prev) => [
                  ...prev,
                  {
                    batch: msg.batch,
                    extracted: msg.batchExtracted ?? 0,
                    skipped: msg.batchSkipped ?? 0,
                  },
                ]);
              } else if (msg.type === "done") {
                onComplete(msg.result);
                return;
              } else if (msg.type === "error") {
                throw new Error(msg.error);
              }
            } catch {
              // Skip malformed lines
            }
          }
        }

        // Process remaining buffer
        if (buffer.trim()) {
          try {
            const msg = JSON.parse(buffer);
            if (msg.type === "done") {
              onComplete(msg.result);
              return;
            }
          } catch {
            // ignore
          }
        }

        throw new Error("Stream ended without results");
      } catch (err) {
        toast.error(
          err instanceof Error ? err.message : "Import failed",
        );
        onError();
      }
    };

    runImport();
  }, [headers, rows, onComplete, onError]);

  const progress =
    totalBatches > 0 ? Math.round((currentBatch / totalBatches) * 100) : 0;

  return (
    <div className="mx-auto max-w-lg py-16 text-center">
      {/* Animated AI orb with pulse */}
      <div className="orb-pulse mx-auto mb-8 flex h-24 w-24 items-center justify-center rounded-3xl bg-gradient-to-br from-indigo-500/20 to-violet-500/20 backdrop-blur-sm">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 shadow-lg shadow-indigo-500/30">
          <svg
            className="h-8 w-8 text-white"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.5}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456z"
            />
          </svg>
        </div>
      </div>

      <h2 className="text-xl font-bold text-foreground">
        AI is mapping your leads...
      </h2>
      <p className="mt-2 text-sm text-muted-foreground">{status}</p>

      {/* Progress section */}
      <div className="mx-auto mt-6 max-w-sm">
        {/* Shimmer skeleton bar while connecting */}
        {isConnecting && (
          <div className="h-2.5 overflow-hidden rounded-full bg-muted">
            <div className="shimmer-bar h-full w-1/3 rounded-full bg-gradient-to-r from-transparent via-indigo-500/40 to-transparent" />
          </div>
        )}

        {/* Real progress bar after first batch arrives */}
        {!isConnecting && totalBatches > 0 && (
          <>
            <div className="mb-2 flex items-center justify-between text-xs text-muted-foreground">
              <span>
                Batch {currentBatch} of {totalBatches}
              </span>
              <span>{progress}%</span>
            </div>
            <div className="h-2.5 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-violet-500 transition-all duration-700 ease-out"
                style={{ width: `${progress}%` }}
              />
            </div>
          </>
        )}

        {/* Batch completion logs */}
        {batchLogs.length > 0 && (
          <div className="mt-4 space-y-1.5">
            {batchLogs.map((log) => (
              <div
                key={log.batch}
                className="step-enter flex items-center gap-2 text-xs"
              >
                <span className="text-emerald-400">✓</span>
                <span className="text-muted-foreground">
                  Batch {log.batch} complete —{" "}
                  <span className="text-emerald-400">
                    {log.extracted} extracted
                  </span>
                  {log.skipped > 0 && (
                    <span className="text-amber-400">
                      , {log.skipped} skipped
                    </span>
                  )}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      <p className="mt-8 text-xs text-muted-foreground/60">
        {rows.length} records • Do not close this page
      </p>
    </div>
  );
}
