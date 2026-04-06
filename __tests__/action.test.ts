import { createContext, createOctokitMock } from '../__fixtures__/github.js'
import { runActions } from '../src/action/index.js'
import { run as runAssign } from '../src/action/assign.js'
import { run as runComment } from '../src/action/comment.js'
import { run as runDispatch } from '../src/action/dispatch.js'
import { run as runLabel } from '../src/action/label.js'
import { run as runState } from '../src/action/state.js'
import type { Action } from '../src/action/types.js'

describe('action runners', () => {
  it('renders comment templates with issue/comment authors', async () => {
    const octokit = createOctokitMock()
    const ctx = createContext({ comment: { body: 'I hit the same bug' } })

    await runComment(octokit, ctx, {
      message: 'Ping {{ issue.author }} from {{ comment.author }}'
    })

    expect(octokit.rest.issues.createComment).toHaveBeenCalledWith({
      owner: 'octo',
      repo: 'hello',
      issue_number: 7,
      body: 'Ping octocat from triager'
    })
  })

  it('falls back to issue author when no comment exists', async () => {
    const octokit = createOctokitMock()
    const ctx = createContext({ comment: null })

    await runComment(octokit, ctx, {
      message: 'Hello {{ comment.author }}'
    })

    expect(octokit.rest.issues.createComment).toHaveBeenCalledWith({
      owner: 'octo',
      repo: 'hello',
      issue_number: 7,
      body: 'Hello octocat'
    })
  })

  it('adds and removes labels according to config', async () => {
    const octokit = createOctokitMock()
    const ctx = createContext({ comment: null })

    await runLabel(octokit, ctx, {
      remove: 'old-label',
      add: ['bug', 'triage']
    })

    expect(octokit.rest.issues.removeLabel).toHaveBeenCalledWith({
      owner: 'octo',
      repo: 'hello',
      issue_number: 7,
      name: 'old-label'
    })
    expect(octokit.rest.issues.addLabels).toHaveBeenCalledWith({
      owner: 'octo',
      repo: 'hello',
      issue_number: 7,
      labels: ['bug', 'triage']
    })
  })

  it('supports clearing labels before adding new ones', async () => {
    const octokit = createOctokitMock()
    const ctx = createContext({ comment: null })

    await runLabel(octokit, ctx, {
      remove_all: true,
      add: 'ready'
    })

    expect(octokit.rest.issues.removeAllLabels).toHaveBeenCalledTimes(1)
    expect(octokit.rest.issues.addLabels).toHaveBeenCalledWith({
      owner: 'octo',
      repo: 'hello',
      issue_number: 7,
      labels: ['ready']
    })
  })

  it('handles removing all assignees before assigning new ones', async () => {
    const octokit = createOctokitMock()
    const ctx = createContext({ comment: null })

    await runAssign(octokit, ctx, {
      remove_all: true,
      add: ['maintainer']
    })

    expect(octokit.rest.issues.listAssignees).toHaveBeenCalledTimes(1)
    expect(octokit.rest.issues.removeAssignees).toHaveBeenCalledWith({
      owner: 'octo',
      repo: 'hello',
      issue_number: 7,
      assignees: ['alice', 'bob']
    })
    expect(octokit.rest.issues.addAssignees).toHaveBeenCalledWith({
      owner: 'octo',
      repo: 'hello',
      issue_number: 7,
      assignees: ['maintainer']
    })
  })

  it('removes specific assignees without adding new ones', async () => {
    const octokit = createOctokitMock()
    const ctx = createContext({ comment: null })

    await runAssign(octokit, ctx, {
      remove: ['bob']
    })

    expect(octokit.rest.issues.removeAssignees).toHaveBeenCalledWith({
      owner: 'octo',
      repo: 'hello',
      issue_number: 7,
      assignees: ['bob']
    })
    expect(octokit.rest.issues.addAssignees).not.toHaveBeenCalled()
  })

  it('sets state based on reason', async () => {
    const octokit = createOctokitMock()
    const ctx = createContext({ comment: null })

    await runState(octokit, ctx, { reason: 'completed' })

    expect(octokit.rest.issues.update).toHaveBeenCalledWith({
      owner: 'octo',
      repo: 'hello',
      issue_number: 7,
      state: 'closed',
      state_reason: 'completed'
    })
  })

  it('early-returns when state config is missing', async () => {
    const octokit = createOctokitMock()
    const ctx = createContext({ comment: null })

    await runState(
      octokit,
      ctx,
      undefined as unknown as Parameters<typeof runState>[2]
    )

    expect(octokit.rest.issues.update).not.toHaveBeenCalled()
  })

  it('dispatches workflow with name only using context ref', async () => {
    const octokit = createOctokitMock()
    const ctx = createContext({ comment: null })

    await runDispatch(octokit, ctx, {
      name: 'triage.yml'
    })

    expect(octokit.rest.actions.createWorkflowDispatch).toHaveBeenCalledWith({
      owner: 'octo',
      repo: 'hello',
      workflow_id: 'triage.yml',
      ref: 'refs/heads/main'
    })
  })

  it('dispatches workflow with ref and inputs', async () => {
    const octokit = createOctokitMock()
    const ctx = createContext({ comment: null })

    await runDispatch(octokit, ctx, {
      name: 'triage.yml',
      ref: 'refs/heads/main',
      inputs: {
        issue: '7',
        is_member: 'true',
        note: 'hello'
      }
    })

    expect(octokit.rest.actions.createWorkflowDispatch).toHaveBeenCalledWith({
      owner: 'octo',
      repo: 'hello',
      workflow_id: 'triage.yml',
      ref: 'refs/heads/main',
      inputs: {
        issue: '7',
        is_member: 'true',
        note: 'hello'
      }
    })
  })

  it('renders dispatch templates in name, ref and inputs', async () => {
    const octokit = createOctokitMock()
    const ctx = createContext({
      comment: {
        author: 'triager'
      }
    })

    await runDispatch(octokit, ctx, {
      name: 'run-{{ issue.author }}.yml',
      ref: 'refs/heads/{{ comment.author }}',
      inputs: {
        issue_author: '{{ issue.author }}',
        comment_author: '{{ comment.author }}',
        static_value: 'plain',
        retry: '2'
      }
    })

    expect(octokit.rest.actions.createWorkflowDispatch).toHaveBeenCalledWith({
      owner: 'octo',
      repo: 'hello',
      workflow_id: 'run-octocat.yml',
      ref: 'refs/heads/triager',
      inputs: {
        issue_author: 'octocat',
        comment_author: 'triager',
        static_value: 'plain',
        retry: '2'
      }
    })
  })

  it('throws when dispatch name is empty', async () => {
    const octokit = createOctokitMock()
    const ctx = createContext({ comment: null })

    await expect(
      runDispatch(octokit, ctx, {
        name: '   '
      })
    ).rejects.toThrow('dispatch.name must be a non-empty string.')
  })

  it('runs all configured actions via runActions', async () => {
    const octokit = createOctokitMock()
    const ctx = createContext()

    const actions: Action = {
      comment: { message: 'auto-reply' },
      label: { add: 'triage' },
      assign: { add: 'owner' },
      state: { reason: 'reopened' },
      dispatch: {
        name: 'triage.yml',
        inputs: {
          rule: 'default'
        }
      }
    }

    await runActions(octokit, actions, ctx)

    expect(octokit.rest.issues.createComment).toHaveBeenCalled()
    expect(octokit.rest.issues.addLabels).toHaveBeenCalled()
    expect(octokit.rest.issues.addAssignees).toHaveBeenCalled()
    expect(octokit.rest.issues.update).toHaveBeenCalledWith({
      owner: 'octo',
      repo: 'hello',
      issue_number: 7,
      state: 'open',
      state_reason: 'reopened'
    })
    expect(octokit.rest.actions.createWorkflowDispatch).toHaveBeenCalledWith({
      owner: 'octo',
      repo: 'hello',
      workflow_id: 'triage.yml',
      ref: 'refs/heads/main',
      inputs: {
        rule: 'default'
      }
    })
  })

  it('returns when label config is missing', async () => {
    const octokit = createOctokitMock()
    const ctx = createContext({ comment: null })

    await runLabel(
      octokit,
      ctx,
      undefined as unknown as Parameters<typeof runLabel>[2]
    )

    expect(octokit.rest.issues.addLabels).not.toHaveBeenCalled()
  })
})
