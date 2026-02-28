import { createContext, createOctokitMock } from '../__fixtures__/github.js'
import { runActions } from '../src/action/index.js'
import { run as runAssign } from '../src/action/assign.js'
import { run as runComment } from '../src/action/comment.js'
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

  it('runs all configured actions via runActions', async () => {
    const octokit = createOctokitMock()
    const ctx = createContext()

    const actions: Action = {
      comment: { message: 'auto-reply' },
      label: { add: 'triage' },
      assign: { add: 'owner' },
      state: { reason: 'reopened' }
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
