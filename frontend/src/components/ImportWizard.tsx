"use client";

import { useState, useCallback } from "react";
import { UploadStep } from "./UploadStep";
import { PreviewStep } from "./PreviewStep";
import { ProcessingStep } from "./ProcessingStep";
import { ResultsStep } from "./ResultsStep";

type Step = "upload" | "preview" | "processing" | "results";

interface PreviewData {
  headers: string[];
  rows: Record<string, string>[];
  total_rows: number;
}

interface ImportResult {
  success: Record<string, string>[];
  skipped: { original_data: Record<string, string>; reason: string }[];
  total_imported: number;
  total_skipped: number;
}

const STEP_LABELS: { key: Step; label: string; number: number }[] = [
  { key: "upload", label: "Upload", number: 1 },
  { key: "preview", label: "Preview", number: 2 },
  { key: "processing", label: "Processing", number: 3 },
  { key: "results", label: "Results", number: 4 },
];

export function ImportWizard() {
  const [step, setStep] = useState<Step>("upload");
  const [file, setFile] = useState<File | null>(null);
  const [previewData, setPreviewData] = useState<PreviewData | null>(null);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);

  const currentIndex = STEP_LABELS.findIndex((s) => s.key === step);

  const handleReset = useCallback(() => {
    setStep("upload");
    setFile(null);
    setPreviewData(null);
    setImportResult(null);
  }, []);

  return (
    <div className="space-y-8">
      {/* Step indicator */}
      <nav className="mx-auto max-w-2xl" aria-label="Import progress">
        <ol className="flex items-center justify-between">
          {STEP_LABELS.map((s, i) => {
            const isActive = i === currentIndex;
            const isComplete = i < currentIndex;
            return (
              <li key={s.key} className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <span
                    className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold transition-all duration-300 ${
                      isActive
                        ? "bg-primary text-primary-foreground shadow-lg shadow-indigo-500/25"
                        : isComplete
                          ? "bg-indigo-500/20 text-indigo-400"
                          : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {isComplete ? (
                      <svg
                        className="h-4 w-4"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2.5}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                    ) : (
                      s.number
                    )}
                  </span>
                  <span
                    className={`hidden text-sm font-medium sm:block ${
                      isActive
                        ? "text-foreground"
                        : isComplete
                          ? "text-indigo-400"
                          : "text-muted-foreground"
                    }`}
                  >
                    {s.label}
                  </span>
                </div>
                {i < STEP_LABELS.length - 1 && (
                  <div
                    className={`mx-2 hidden h-px w-12 sm:block lg:w-20 ${
                      isComplete ? "bg-indigo-500/40" : "bg-border"
                    }`}
                  />
                )}
              </li>
            );
          })}
        </ol>
      </nav>

      {/* Step content */}
      <div className="step-enter" key={step}>
        {step === "upload" && (
          <UploadStep
            file={file}
            onFileSelect={setFile}
            onContinue={() => setStep("preview")}
          />
        )}
        {step === "preview" && previewData && (
          <PreviewStep
            data={previewData}
            fileName={file?.name ?? ""}
            onConfirm={() => setStep("processing")}
            onBack={handleReset}
          />
        )}
        {step === "preview" && !previewData && file && (
          <PreviewStep
            data={null}
            fileName={file.name}
            file={file}
            onDataLoaded={setPreviewData}
            onConfirm={() => setStep("processing")}
            onBack={handleReset}
          />
        )}
        {step === "processing" && previewData && (
          <ProcessingStep
            headers={previewData.headers}
            rows={previewData.rows}
            onComplete={(result) => {
              setImportResult(result);
              setStep("results");
            }}
            onError={handleReset}
          />
        )}
        {step === "results" && importResult && (
          <ResultsStep result={importResult} onImportAnother={handleReset} />
        )}
      </div>
    </div>
  );
}
