import type { getOctokit } from '@actions/github'

export type GitHubClient = ReturnType<typeof getOctokit>

export type ContextEvent = 'issues' | 'issue_comment' | 'pull_request'

export interface Context {
  owner: string
  repo: string
  event: ContextEvent
  issue_number: number // despite the name, this can be a pull request number as well since GitHub treats PRs as issues
  title: string
  body: string
  issue_author: string
  comment_author?: string
  author_association: string
}

export interface GitHubIssueApiContext {
  owner: string
  repo: string
  issue_number: number
}
