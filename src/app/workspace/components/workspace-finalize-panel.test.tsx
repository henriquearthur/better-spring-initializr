import { renderToString } from 'react-dom/server'
import { describe, expect, it } from 'vitest'

import { DEFAULT_AGENTS_MD_PREFERENCES } from '@/features/ai-extras/model/ai-extras'
import { DEFAULT_PROJECT_CONFIG } from '@/shared/lib/project-config'

import { getBuildToolLabel,WorkspaceFinalizePanel } from './workspace-finalize-panel'

describe('WorkspaceFinalizePanel', () => {
  it('renders finalize panel with primary actions and contextual metadata', () => {
    const html = renderToString(
      <WorkspaceFinalizePanel
        config={DEFAULT_PROJECT_CONFIG}
        selectedDependencyIds={['web']}
        selectedAiExtraIds={[]}
        agentsMdPreferences={DEFAULT_AGENTS_MD_PREFERENCES}
        aiExtrasTarget="agents"
        createShareUrl={() => 'https://example.test/?share=abc'}
        onPublish={() => undefined}
      />,
    )

    expect(html).toContain('Finalize &amp; Share')
    expect(html).toContain('Ship your project in one final step')
    expect(html).toContain('Download ZIP')
    expect(html).toContain('Copy Share Link')
    expect(html).toContain('Publish to GitHub')
    expect(html).toContain('com.example.demo')
    expect(html).toContain('JAVA / Maven')
  })

  it('hides publish action when no publish callback is provided', () => {
    const html = renderToString(
      <WorkspaceFinalizePanel
        config={DEFAULT_PROJECT_CONFIG}
        selectedDependencyIds={[]}
        selectedAiExtraIds={[]}
        agentsMdPreferences={DEFAULT_AGENTS_MD_PREFERENCES}
        aiExtrasTarget="agents"
        createShareUrl={() => 'https://example.test/?share=abc'}
      />,
    )

    expect(html).not.toContain('Publish to GitHub')
  })

  it('renders copy action disabled when share URL is unavailable', () => {
    const html = renderToString(
      <WorkspaceFinalizePanel
        config={DEFAULT_PROJECT_CONFIG}
        selectedDependencyIds={[]}
        selectedAiExtraIds={[]}
        agentsMdPreferences={DEFAULT_AGENTS_MD_PREFERENCES}
        aiExtrasTarget="agents"
        createShareUrl={() => ''}
        onPublish={() => undefined}
      />,
    )

    expect(html).toMatch(/<button[^>]*disabled=""[^>]*>.*Copy Share Link<\/button>/s)
  })

  it('maps build tool labels for contextual metadata', () => {
    expect(getBuildToolLabel('maven-project')).toBe('Maven')
    expect(getBuildToolLabel('gradle-project')).toBe('Gradle')
  })
})
