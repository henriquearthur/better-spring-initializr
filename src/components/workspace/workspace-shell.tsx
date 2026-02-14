import { WorkspaceHeader } from './workspace-header'

export function WorkspaceShell() {
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
