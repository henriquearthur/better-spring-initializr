import { FlaskConical, Github } from 'lucide-react'

import { ThemeToggle } from '../theme/theme-toggle'

export function WorkspaceHeader() {
  return (
    <header className="flex items-center justify-between px-5 py-3">
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-500">
          <FlaskConical className="h-5 w-5" />
        </div>
        <div>
          <p className="text-sm font-semibold tracking-wide">Better Spring Initializr</p>
          <p className="text-xs text-[var(--muted-foreground)]">
            Configure your workspace and preview output in real time.
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <a
          href="https://github.com/henriquearthur/better-spring-initializr"
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-2 rounded-full border bg-[var(--background)] px-3 py-1.5 text-xs font-medium text-[var(--foreground)] transition hover:bg-[var(--muted)]"
          title="View source on GitHub"
        >
          <Github className="h-3.5 w-3.5" />
          GitHub
        </a>
        <ThemeToggle />
      </div>
    </header>
  )
}
