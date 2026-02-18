export type MetadataStatus =
  | { type: 'loading' }
  | { type: 'error'; message?: string }
  | { type: 'ready' }

type DependencyBrowserStatusProps = {
  status: MetadataStatus
}

export function DependencyBrowserStatus({ status }: DependencyBrowserStatusProps) {
  if (status.type !== 'error') {
    return null
  }

  return (
    <div className="mt-3 rounded-lg border border-red-400/80 bg-red-100 px-3 py-2 text-xs text-red-950 dark:border-red-400/30 dark:bg-red-400/10 dark:text-red-100">
      {status.message ?? 'Dependency metadata is unavailable. Dependency selection is disabled.'}
    </div>
  )
}
