import { renderToString } from 'react-dom/server'
import { describe, expect, it } from 'vitest'

import { DEFAULT_AGENTS_MD_PREFERENCES } from '@/lib/ai-extras'
import { DEFAULT_PROJECT_CONFIG } from '@/lib/project-config'

import {
  GitHubPublishDialog,
  getActiveFlowStep,
  getRepositoryNameError,
  getStepState,
} from './github-publish-dialog'

describe('GitHubPublishDialog', () => {
  it('renders publish header, stepper, and loading state shell', () => {
    const html = renderToString(
      <GitHubPublishDialog
        open
        onClose={() => undefined}
        config={DEFAULT_PROJECT_CONFIG}
        selectedDependencyIds={[]}
        selectedAiExtraIds={[]}
        agentsMdPreferences={DEFAULT_AGENTS_MD_PREFERENCES}
        aiExtrasTarget="agents"
      />,
    )

    expect(html).toContain('Finalize &amp; Share')
    expect(html).toContain('Publish to GitHub')
    expect(html).toContain('Connect')
    expect(html).toContain('Configure')
    expect(html).toContain('Publish')
    expect(html).toContain('Checking GitHub connection...')
  })

  it('validates repository names for configure phase', () => {
    expect(getRepositoryNameError('')).toBe('Repository name is required.')
    expect(getRepositoryNameError('invalid name')).toBe(
      'Use letters, numbers, dots, dashes, or underscores.',
    )
    expect(getRepositoryNameError('.hidden')).toBe(
      'Use letters, numbers, dots, dashes, or underscores.',
    )
    expect(getRepositoryNameError('demo-service')).toBeNull()
  })

  it('maps dialog phases into active flow steps', () => {
    expect(getActiveFlowStep('connect')).toBe('connect')
    expect(getActiveFlowStep('configure')).toBe('configure')
    expect(getActiveFlowStep('loading')).toBe('publish')
    expect(getActiveFlowStep('pushing')).toBe('publish')
    expect(getActiveFlowStep('done')).toBe('publish')
  })

  it('derives stepper state for connect, configure, and done phases', () => {
    expect(getStepState('connect', 'connect', 'connect')).toBe('current')
    expect(getStepState('configure', 'configure', 'configure')).toBe('current')
    expect(getStepState('connect', 'configure', 'configure')).toBe('complete')
    expect(getStepState('publish', 'publish', 'done')).toBe('complete')
    expect(getStepState('publish', 'configure', 'configure')).toBe('pending')
  })
})
