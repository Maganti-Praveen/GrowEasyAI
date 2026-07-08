import { ImportWizard } from "@/components/ImportWizard";

export default function Home() {
  return (
    <main className="min-h-screen bg-background">
      {/* Ambient glow effects */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 h-96 w-96 rounded-full bg-indigo-500/10 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 h-96 w-96 rounded-full bg-violet-500/8 blur-3xl" />
      </div>

      <div className="relative z-10 mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Header */}
        <header className="mb-10 text-center">
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-indigo-500/20 bg-indigo-500/10 px-4 py-1.5 text-xs font-medium text-indigo-400">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-indigo-400 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-indigo-500" />
            </span>
            AI-Powered Import
          </div>
          <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
            GrowEasy{" "}
            <span className="bg-gradient-to-r from-indigo-400 via-violet-400 to-purple-400 bg-clip-text text-transparent">
              CRM Importer
            </span>
          </h1>
          <p className="mx-auto mt-3 max-w-2xl text-base text-muted-foreground">
            Upload any CSV — Facebook Leads, Google Ads, real estate exports —
            and let AI intelligently map your data to the GrowEasy CRM format.
          </p>
        </header>

        {/* Main wizard */}
        <ImportWizard />
      </div>
    </main>
  );
}
