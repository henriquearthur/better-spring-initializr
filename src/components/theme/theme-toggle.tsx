import { MoonStar, Sun } from 'lucide-react'

import { useTheme } from './theme-provider'

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()
  const isDark = theme === 'dark'

  return (
    <button
      type="button"
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
      className="btn btn-secondary h-8 rounded-full px-3 text-xs"
      aria-label="Toggle theme"
      title="Toggle theme"
    >
      {isDark ? <Sun className="h-3.5 w-3.5" /> : <MoonStar className="h-3.5 w-3.5" />}
      {isDark ? 'Light' : 'Dark'} mode
    </button>
  )
}
