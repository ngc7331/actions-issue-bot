import { jest } from '@jest/globals'

type MockContext = {
  repo: { owner: string; repo: string }
  eventName: string
  payload: Record<string, unknown>
}

const mockContext: MockContext = {
  repo: { owner: 'octo', repo: 'hello' },
  eventName: 'issues',
  payload: {}
}

jest.unstable_mockModule('@actions/github', () => ({
  context: mockContext,
  getOctokit: jest.fn()
}))

const { getContext, getIssueApiContext } =
  await import('../src/context/index.js')

describe('context parser', () => {
  beforeEach(() => {
    mockContext.repo = { owner: 'octo', repo: 'hello' }
    mockContext.eventName = 'issues'
    mockContext.payload = {}
  })

  it('parses issues events', () => {
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

    const ctx = getContext()

    expect(ctx).toEqual({
      owner: 'octo',
      repo: 'hello',
      event: 'issues',
      issue_number: 42,
      title: 'Bug report',
      body: 'Fails on startup',
      state: 'open',
      issue_author: 'alice',
      comment_author: undefined,
      author_association: 'MEMBER'
    })
  })

  it('uses comment body for issue_comment events', () => {
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

    const ctx = getContext()

    expect(ctx.body).toBe('Comment body wins')
    expect(ctx.comment_author).toBe('bob')
    expect(ctx.author_association).toBe('NONE')
    expect(ctx.state).toBe('open')
  })

  it('parses pull_request events', () => {
    mockContext.eventName = 'pull_request'
    mockContext.payload = {
      pull_request: {
        number: 5,
        title: 'PR title',
        body: 'PR body',
        state: 'closed',
        user: { login: 'carol' },
        author_association: 'CONTRIBUTOR'
      }
    }

    const ctx = getContext()

    expect(ctx.event).toBe('pull_request')
    expect(ctx.body).toBe('PR body')
    expect(ctx.state).toBe('closed')
    expect(ctx.issue_author).toBe('carol')
    expect(ctx.author_association).toBe('CONTRIBUTOR')
    expect(ctx.comment_author).toBeUndefined()
  })

  it('throws on unsupported events', () => {
    mockContext.eventName = 'push'
    mockContext.payload = {}

    expect(() => getContext()).toThrow('Unexpected event: push')
  })

  it('throws when issue number is missing', () => {
    mockContext.eventName = 'issues'
    mockContext.payload = { issue: { title: 'No number' } }

    expect(() => getContext()).toThrow(
      'Context missing issue or pull request number'
    )
  })

  it('creates issue api context mapping', () => {
    mockContext.payload = {
      issue: {
        number: 99,
        title: 'x',
        body: 'y',
        user: { login: 'alice' },
        author_association: 'MEMBER'
      }
    }

    const ctx = getContext()
    const apiCtx = getIssueApiContext(ctx)

    expect(apiCtx).toEqual({ owner: 'octo', repo: 'hello', issue_number: 99 })
  })
})
