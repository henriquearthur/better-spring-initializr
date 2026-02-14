import { FlaskConical, WandSparkles } from 'lucide-react'

import { ThemeToggle } from '../theme/theme-toggle'

export function WorkspaceHeader() {
  return (
    <header className="flex items-center justify-between border-b bg-[var(--card)] px-5 py-3">
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
        <div className="flex items-center gap-2 rounded-full border px-3 py-1 text-xs text-[var(--muted-foreground)]">
          <WandSparkles className="h-3.5 w-3.5" />
          Phase 1 shell
        </div>
        <ThemeToggle />
      </div>
    </header>
  )
}
