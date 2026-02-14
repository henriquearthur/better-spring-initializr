import { WorkspaceHeader } from './workspace-header'
import { useInitializrMetadata } from '@/hooks/use-initializr-metadata'

export function WorkspaceShell() {
  const metadataQuery = useInitializrMetadata()

  const metadataStatusCard = renderMetadataStatus(metadataQuery)

  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)]">
      <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-64 bg-gradient-to-b from-emerald-500/12 to-transparent" />

      <div className="mx-auto flex min-h-screen w-full max-w-[1600px] flex-col px-4 py-4 sm:px-6">
        <div className="overflow-hidden rounded-2xl border bg-[var(--card)] shadow-[0_12px_40px_-20px_rgba(16,24,40,0.55)]">
          <WorkspaceHeader />

          <main className="grid min-h-[calc(100vh-8rem)] grid-cols-1 gap-4 p-4 lg:grid-cols-[320px_minmax(0,1fr)]">
            <aside className="rounded-xl border bg-[var(--background)] p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-[var(--muted-foreground)]">
                Configuration Panel
              </p>
              <div className="mt-4 space-y-3">
                <div className="rounded-lg border bg-[var(--card)] px-3 py-2 text-sm">
                  Project metadata inputs will live here.
                </div>
                <div className="rounded-lg border bg-[var(--card)] px-3 py-2 text-sm">
                  Build settings and dependencies will be added in next plans.
                </div>
                {metadataStatusCard}
              </div>
            </aside>

            <section className="rounded-xl border bg-[var(--background)] p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-[var(--muted-foreground)]">
                Main Preview
              </p>
              <div className="mt-4 flex h-[360px] items-center justify-center rounded-xl border border-dashed text-sm text-[var(--muted-foreground)] md:h-[520px]">
                File tree and content preview region.
              </div>
            </section>
          </main>
        </div>
      </div>
    </div>
  )
}

function renderMetadataStatus(
  metadataQuery: ReturnType<typeof useInitializrMetadata>,
) {
  if (metadataQuery.isLoading) {
    return (
      <div className="rounded-lg border border-amber-300/70 bg-amber-50/70 px-3 py-2 text-sm text-amber-900 dark:border-amber-400/30 dark:bg-amber-400/10 dark:text-amber-100">
        Loading Spring metadata from BFF proxy...
      </div>
    )
  }

  if (metadataQuery.isError) {
    return (
      <div className="rounded-lg border border-red-300/70 bg-red-50/70 px-3 py-2 text-sm text-red-900 dark:border-red-400/30 dark:bg-red-400/10 dark:text-red-100">
        Unable to load metadata right now. Please refresh in a moment.
      </div>
    )
  }

  if (!metadataQuery.data || !metadataQuery.data.ok) {
    return (
      <div className="rounded-lg border border-red-300/70 bg-red-50/70 px-3 py-2 text-sm text-red-900 dark:border-red-400/30 dark:bg-red-400/10 dark:text-red-100">
        {metadataQuery.data?.error.message ??
          'Metadata did not return successfully.'}
      </div>
    )
  }

  return (
    <div className="rounded-lg border border-emerald-300/70 bg-emerald-50/70 px-3 py-2 text-sm text-emerald-900 dark:border-emerald-400/30 dark:bg-emerald-400/10 dark:text-emerald-100">
      <p className="font-medium">Spring metadata ready</p>
      <p className="mt-1 text-xs opacity-90">
        Dependencies: {metadataQuery.data.metadata.dependencies.length} · Java:{' '}
        {metadataQuery.data.metadata.javaVersions.length} · Boot:{' '}
        {metadataQuery.data.metadata.springBootVersions.length}
      </p>
      <p className="mt-1 text-xs opacity-90">
        Source: {metadataQuery.data.source} · Cache: {metadataQuery.data.cache.status}
      </p>
    </div>
  )
}
