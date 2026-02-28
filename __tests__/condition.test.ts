import { evaluateConditions } from '../src/condition/index.js'
import type { ConditionGroup } from '../src/condition/types.js'
import type { Context } from '../src/context/index.js'

function createContext(options?: {
  event?: Context['event']
  issue?: Partial<
    Pick<
      Context,
      'issue_number' | 'title' | 'body' | 'issue_author' | 'author_association'
    >
  >
  comment?: {
    body?: string
    author?: string
    author_association?: string
  } | null
}): Context {
  const event =
    options?.event ??
    (options?.comment && options.comment !== null ? 'issue_comment' : 'issues')

  const issue_number = options?.issue?.issue_number ?? 101
  const title = options?.issue?.title ?? 'Bug: failure occurs'
  const issueBody = options?.issue?.body ?? 'This issue fails with an error'
  const issue_author = options?.issue?.issue_author ?? 'alice'
  const issueAuthorAssociation = options?.issue?.author_association ?? 'MEMBER'

  const comment =
    options?.comment === null || event !== 'issue_comment'
      ? undefined
      : {
          body: 'Encountered a bug in production',
          author: 'bob',
          author_association: 'NONE',
          ...options?.comment
        }

  const body = event === 'issue_comment' ? (comment?.body ?? '') : issueBody
  const author_association =
    event === 'issue_comment'
      ? (comment?.author_association ?? '')
      : issueAuthorAssociation

  return {
    owner: 'octo',
    repo: 'hello',
    event,
    issue_number,
    title,
    body,
    issue_author,
    comment_author: comment?.author,
    author_association
  }
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
    const commentCtx = createContext({ event: 'issue_comment' })

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
