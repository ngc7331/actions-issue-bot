import { jest } from '@jest/globals'

import type { GitHubClient, Context } from '../src/context/index.js'

type ContextOverrides = {
  event?: Context['event']
  issue?: Partial<
    Pick<
      Context,
      | 'issue_number'
      | 'title'
      | 'body'
      | 'issue_author'
      | 'author_association'
      | 'state'
    >
  >
  comment?: {
    body?: string
    author?: string
    author_association?: string
  } | null
}

export function createOctokitMock(): GitHubClient {
  const rest = {
    issues: {
      createComment: jest
        .fn<() => Promise<void>>()
        .mockResolvedValue(undefined),
      addLabels: jest.fn<() => Promise<void>>().mockResolvedValue(undefined),
      removeLabel: jest.fn<() => Promise<void>>().mockResolvedValue(undefined),
      removeAllLabels: jest
        .fn<() => Promise<void>>()
        .mockResolvedValue(undefined),
      listAssignees: jest
        .fn<() => Promise<{ data: Array<{ login: string }> }>>()
        .mockResolvedValue({
          data: [{ login: 'alice' }, { login: 'bob' }]
        }),
      removeAssignees: jest
        .fn<() => Promise<void>>()
        .mockResolvedValue(undefined),
      addAssignees: jest.fn<() => Promise<void>>().mockResolvedValue(undefined),
      update: jest.fn<() => Promise<void>>().mockResolvedValue(undefined)
    }
  }

  return { rest } as unknown as GitHubClient
}

export function createContext(overrides?: ContextOverrides): Context {
  const hasComment =
    overrides?.comment !== null && overrides?.comment !== undefined
  const event = overrides?.event ?? (hasComment ? 'issue_comment' : 'issues')

  const issue_number = overrides?.issue?.issue_number ?? 7
  const title = overrides?.issue?.title ?? 'Bug in deployment'
  const issueBody = overrides?.issue?.body ?? 'This issue fails with an error'
  const issue_author = overrides?.issue?.issue_author ?? 'octocat'
  const issue_author_association =
    overrides?.issue?.author_association ?? 'MEMBER'
  const state = overrides?.issue?.state ?? 'open'

  const comment =
    overrides?.comment === null || event !== 'issue_comment'
      ? undefined
      : {
          body: 'I hit the same bug',
          author: 'triager',
          author_association: 'NONE',
          ...overrides?.comment
        }

  const body = event === 'issue_comment' ? (comment?.body ?? '') : issueBody
  const author_association =
    event === 'issue_comment'
      ? (comment?.author_association ?? '')
      : issue_author_association

  return {
    owner: 'octo',
    repo: 'hello',
    event,
    issue_number,
    title,
    body,
    state,
    issue_author,
    comment_author: comment?.author,
    author_association
  }
}
