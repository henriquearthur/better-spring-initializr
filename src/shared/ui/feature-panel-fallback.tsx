export function FeaturePanelFallback({ label }: { label: string }) {
  return (
    <div className="rounded-xl border bg-[var(--card)] px-3 py-2 text-xs text-[var(--muted-foreground)]">
      {label}
    </div>
  )
}
