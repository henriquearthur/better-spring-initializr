import { createFileRoute } from '@tanstack/react-router'
import { WorkspaceShell } from '../components/workspace/workspace-shell'

export const Route = createFileRoute('/')({ component: App })

function App() {
  return <WorkspaceShell />
}
