import { MoonStar, Sun } from 'lucide-react'

import { useTheme } from './theme-provider'

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()
  const isDark = theme === 'dark'

  return (
    <button
      type="button"
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
      className="inline-flex items-center gap-2 rounded-full border bg-[var(--background)] px-3 py-1.5 text-xs font-medium text-[var(--foreground)] transition hover:bg-[var(--muted)]"
      aria-label="Toggle theme"
      title="Toggle theme"
    >
      {isDark ? <Sun className="h-3.5 w-3.5" /> : <MoonStar className="h-3.5 w-3.5" />}
      {isDark ? 'Light' : 'Dark'} mode
    </button>
  )
}
