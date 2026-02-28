import type { getOctokit } from '@actions/github'

export type GitHubClient = ReturnType<typeof getOctokit>

export const CONTEXT_EVENTS = [
  'issues',
  'issue_comment',
  'pull_request'
] as const
export type ContextEvent = (typeof CONTEXT_EVENTS)[number]

export const CONTEXT_STATES = ['open', 'closed'] as const
export type ContextState = (typeof CONTEXT_STATES)[number]

export interface Context {
  owner: string
  repo: string
  event: ContextEvent
  issue_number: number // despite the name, this can be a pull request number as well since GitHub treats PRs as issues
  title: string
  body: string
  state: ContextState
  issue_author: string
  comment_author?: string
  author_association: string
}

export interface GitHubIssueApiContext {
  owner: string
  repo: string
  issue_number: number
}
