import { createFileRoute } from '@tanstack/react-router'

import { WorkspaceShell } from '@/components/workspace/workspace-shell'

export const Route = createFileRoute('/api/github/oauth/callback')({
  component: GitHubOAuthCallbackRoute,
})

function GitHubOAuthCallbackRoute() {
  return <WorkspaceShell />
}
