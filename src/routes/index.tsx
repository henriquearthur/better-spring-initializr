import { createFileRoute } from '@tanstack/react-router'
import { WorkspacePage } from '@/app/workspace/workspace-page'

export const Route = createFileRoute('/')({ component: App })

function App() {
  return <WorkspacePage />
}
