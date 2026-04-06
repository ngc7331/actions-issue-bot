import { jest } from '@jest/globals'
import { createOctokitMock } from '../__fixtures__/github.js'

type MockContext = {
  repo: { owner: string; repo: string }
  ref?: string
  eventName: string
  payload: Record<string, unknown>
}

const mockContext: MockContext = {
  repo: { owner: 'octo', repo: 'hello' },
  eventName: 'issues',
  payload: {}
}

jest.unstable_mockModule('@actions/github', () => ({
  context: mockContext
}))

const { getContext, getIssueApiContext } =
  await import('../src/context/index.js')

describe('context parser', () => {
  beforeEach(() => {
    mockContext.repo = { owner: 'octo', repo: 'hello' }
    mockContext.eventName = 'issues'
    mockContext.ref = 'refs/heads/main'
    mockContext.payload = {}
  })

  it('parses issues events', async () => {
    mockContext.payload = {
      issue: {
        number: 42,
        title: 'Bug report',
        body: 'Fails on startup',
        state: 'open',
        user: { login: 'alice' },
        author_association: 'MEMBER'
      }
    }

    const octokit = createOctokitMock()
    const ctx = await getContext(octokit)

    expect(ctx).toEqual({
      bot_id: 12345,
      owner: 'octo',
      repo: 'hello',
      ref: 'refs/heads/main',
      event: 'issues',
      issue_number: 42,
      comment_id: undefined,
      title: 'Bug report',
      body: 'Fails on startup',
      state: 'open',
      issue_author: 'alice',
      comment_author: '',
      author_association: 'MEMBER'
    })
  })

  it('uses comment body for issue_comment events', async () => {
    mockContext.eventName = 'issue_comment'
    mockContext.payload = {
      issue: {
        number: 7,
        title: 'Bug report',
        body: 'Original body',
        state: 'open',
        user: { login: 'alice' },
        author_association: 'MEMBER'
      },
      comment: {
        body: 'Comment body wins',
        user: { login: 'bob' },
        author_association: 'NONE'
      }
    }

    const octokit = createOctokitMock()
    const ctx = await getContext(octokit)

    expect(ctx.body).toBe('Comment body wins')
    expect(ctx.comment_author).toBe('bob')
    expect(ctx.author_association).toBe('NONE')
    expect(ctx.state).toBe('open')
  })

  it('parses pull_request events', async () => {
    mockContext.eventName = 'pull_request'
    mockContext.payload = {
      pull_request: {
        number: 5,
        title: 'PR title',
        body: 'PR body',
        state: 'closed',
        head: { ref: 'feature-branch' },
        user: { login: 'carol' },
        author_association: 'CONTRIBUTOR'
      }
    }

    const octokit = createOctokitMock()
    const ctx = await getContext(octokit)

    expect(ctx.event).toBe('pull_request')
    expect(ctx.body).toBe('PR body')
    expect(ctx.state).toBe('closed')
    expect(ctx.ref).toBe('refs/heads/main')
    expect(ctx.issue_author).toBe('carol')
    expect(ctx.author_association).toBe('CONTRIBUTOR')
    expect(ctx.comment_author).toBe('')
  })

  it('throws on unsupported events', async () => {
    mockContext.eventName = 'push'
    mockContext.payload = {}

    const octokit = createOctokitMock()
    await expect(getContext(octokit)).rejects.toThrow('Unexpected event: push')
  })

  it('throws when issue number is missing', async () => {
    mockContext.eventName = 'issues'
    mockContext.payload = { issue: { title: 'No number' } }

    const octokit = createOctokitMock()
    await expect(getContext(octokit)).rejects.toThrow(
      'Context missing issue or pull request number'
    )
  })

  it('creates issue api context mapping', async () => {
    mockContext.payload = {
      issue: {
        number: 99,
        title: 'x',
        body: 'y',
        user: { login: 'alice' },
        author_association: 'MEMBER'
      }
    }

    const octokit = createOctokitMock()
    const ctx = await getContext(octokit)
    const apiCtx = getIssueApiContext(ctx)

    expect(apiCtx).toEqual({ owner: 'octo', repo: 'hello', issue_number: 99 })
  })
})
