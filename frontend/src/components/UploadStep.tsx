"use client";

import { useCallback } from "react";
import { useDropzone } from "react-dropzone";

interface UploadStepProps {
  file: File | null;
  onFileSelect: (file: File) => void;
  onContinue: () => void;
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function UploadStep({ file, onFileSelect, onContinue }: UploadStepProps) {
  const onDrop = useCallback(
    (accepted: File[]) => {
      if (accepted.length > 0) {
        onFileSelect(accepted[0]);
      }
    },
    [onFileSelect],
  );

  const { getRootProps, getInputProps, isDragActive, isDragReject } =
    useDropzone({
      onDrop,
      accept: { "text/csv": [".csv"] },
      maxFiles: 1,
      multiple: false,
    });

  return (
    <div className="mx-auto max-w-xl">
      <div
        {...getRootProps()}
        className={`group relative cursor-pointer rounded-2xl border-2 border-dashed p-12 text-center transition-all duration-300 ${
          isDragReject
            ? "border-red-500/50 bg-red-500/5"
            : isDragActive
              ? "border-indigo-500 bg-indigo-500/10 shadow-lg shadow-indigo-500/10"
              : file
                ? "border-indigo-500/40 bg-indigo-500/5"
                : "border-border bg-card hover:border-indigo-500/40 hover:bg-indigo-500/5"
        }`}
      >
        <input {...getInputProps()} id="csv-file-input" />

        {/* Upload icon */}
        <div
          className={`mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl transition-all duration-300 ${
            file
              ? "bg-indigo-500/20 text-indigo-400"
              : "bg-muted text-muted-foreground group-hover:bg-indigo-500/20 group-hover:text-indigo-400"
          }`}
        >
          {file ? (
            <svg
              className="h-8 w-8"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          ) : (
            <svg
              className="h-8 w-8"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5"
              />
            </svg>
          )}
        </div>

        {file ? (
          <div>
            <p className="text-lg font-semibold text-foreground">{file.name}</p>
            <p className="mt-1 text-sm text-muted-foreground">
              {formatFileSize(file.size)}
            </p>
            <p className="mt-3 text-xs text-indigo-400">
              Click or drag to replace
            </p>
          </div>
        ) : (
          <div>
            <p className="text-lg font-semibold text-foreground">
              {isDragActive
                ? "Drop your CSV here"
                : "Drag & drop your CSV file"}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              or click to browse your files
            </p>
            <p className="mt-3 text-xs text-muted-foreground">
              Only .csv files supported • Max 10 MB
            </p>
          </div>
        )}
      </div>

      {/* Continue button */}
      <button
        id="continue-to-preview"
        onClick={onContinue}
        disabled={!file}
        className="mt-6 w-full rounded-xl bg-primary px-6 py-3.5 text-sm font-semibold text-primary-foreground shadow-lg shadow-indigo-500/20 transition-all duration-200 hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-40 disabled:shadow-none"
      >
        Continue to Preview
      </button>
    </div>
  );
}
