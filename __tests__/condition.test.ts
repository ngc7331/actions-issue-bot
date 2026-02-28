import { evaluateConditions } from '../src/condition/index.js'
import type { ConditionGroup } from '../src/condition/types.js'
import type { GitHubContext } from '../src/octokit.js'

function createContext(options?: {
  eventName?: string
  issue?: Partial<NonNullable<GitHubContext['payload']['issue']>>
  comment?: Partial<NonNullable<GitHubContext['payload']['comment']>> | null
}): GitHubContext {
  const issue = {
    number: 101,
    title: 'Bug: failure occurs',
    body: 'This issue fails with an error',
    user: { login: 'alice' },
    author_association: 'MEMBER',
    ...(options?.issue ?? {})
  }

  const payload: GitHubContext['payload'] = { issue }

  if (options?.comment !== null) {
    payload.comment = {
      id: 123,
      body: 'Encountered a bug in production',
      user: { login: 'bob' },
      author_association: 'NONE',
      ...(options?.comment ?? {})
    }
  }

  return {
    eventName: options?.eventName ?? 'issues',
    repo: { owner: 'octo', repo: 'hello' },
    payload
  } as GitHubContext
}

describe('condition evaluation', () => {
  it('matches regex against issue body or comment body', () => {
    const ctxWithIssue = createContext({ comment: null })
    const ctxWithComment = createContext({
      comment: { body: 'New error happened' }
    })

    expect(evaluateConditions([{ regex: 'error' }], ctxWithIssue)).toBe(true)
    expect(evaluateConditions([{ regex: 'error' }], ctxWithComment)).toBe(true)
  })

  it('matches regex_title only for issue events', () => {
    const issuesCtx = createContext({ issue: { title: 'feat: add API' } })
    const commentCtx = createContext({ eventName: 'issue_comment' })

    expect(evaluateConditions([{ regex_title: '^feat' }], issuesCtx)).toBe(true)
    expect(evaluateConditions([{ regex_title: '^feat' }], commentCtx)).toBe(
      false
    )
  })

  it('evaluates member modes for repository authorship', () => {
    const memberCtx = createContext({
      comment: { author_association: 'MEMBER' }
    })
    const outsiderCtx = createContext({
      comment: { author_association: 'NONE' }
    })

    expect(evaluateConditions([{ member: 'include' }], memberCtx)).toBe(true)
    expect(evaluateConditions([{ member: 'exclude' }], memberCtx)).toBe(false)
    expect(evaluateConditions([{ member: 'only' }], outsiderCtx)).toBe(false)
  })

  it('honors logical and/or groupings', () => {
    const matchBothCtx = createContext({
      comment: { body: 'a critical bug', author_association: 'NONE' }
    })
    const matchBodyCtx = createContext({
      comment: {
        body: 'this bug looks fine to me',
        author_association: 'MEMBER'
      }
    })
    const matchAuthorCtx = createContext({
      comment: { body: 'all good', author_association: 'NONE' }
    })
    const noMatchCtx = createContext({
      comment: { body: 'all good', author_association: 'MEMBER' }
    })

    const andGroup: ConditionGroup = [
      { and: [{ regex: 'bug' }, { member: 'exclude' }] }
    ]

    const orGroup: ConditionGroup = [
      { or: [{ regex: 'bug' }, { member: 'exclude' }] }
    ]

    expect(evaluateConditions(andGroup, matchBothCtx)).toBe(true)
    expect(evaluateConditions(andGroup, matchBodyCtx)).toBe(false)
    expect(evaluateConditions(andGroup, matchAuthorCtx)).toBe(false)
    expect(evaluateConditions(andGroup, noMatchCtx)).toBe(false)

    expect(evaluateConditions(orGroup, matchBothCtx)).toBe(true)
    expect(evaluateConditions(orGroup, matchBodyCtx)).toBe(true)
    expect(evaluateConditions(orGroup, matchAuthorCtx)).toBe(true)
    expect(evaluateConditions(orGroup, noMatchCtx)).toBe(false)
  })
})
