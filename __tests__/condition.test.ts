import { createContext } from '../__fixtures__/github.js'
import { evaluateConditions } from '../src/condition/index.js'
import type { ConditionGroup } from '../src/condition/types.js'

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

  it('matches event_type against normalized event name', () => {
    const issueCtx = createContext({ comment: null })
    const commentCtx = createContext({ event: 'issue_comment' })
    const prCtx = createContext({ event: 'pull_request' })

    expect(evaluateConditions([{ event_type: 'issues' }], issueCtx)).toBe(true)
    expect(
      evaluateConditions([{ event_type: 'issue_comment' }], commentCtx)
    ).toBe(true)
    expect(evaluateConditions([{ event_type: 'pull_request' }], prCtx)).toBe(
      true
    )
    expect(evaluateConditions([{ event_type: 'issues' }], commentCtx)).toBe(
      false
    )
  })

  it('matches state against issue and pull request state', () => {
    const openIssueCtx = createContext({
      issue: { state: 'open' },
      comment: null
    })
    const closedIssueCtx = createContext({
      issue: { state: 'closed' },
      comment: null
    })
    const prCtx = createContext({
      event: 'pull_request',
      issue: { state: 'closed' }
    })

    expect(evaluateConditions([{ state: 'open' }], openIssueCtx)).toBe(true)
    expect(evaluateConditions([{ state: 'open' }], closedIssueCtx)).toBe(false)
    expect(evaluateConditions([{ state: 'closed' }], prCtx)).toBe(true)
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
