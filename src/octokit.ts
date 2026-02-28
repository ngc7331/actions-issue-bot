import { context, getOctokit } from '@actions/github'

export type GitHubClient = ReturnType<typeof getOctokit>
export type GitHubContext = typeof context

export interface IssueContext {
  owner: string
  repo: string
  issueNumber: number
}

export function getIssueContext(ctx: GitHubContext): IssueContext {
  const issueNumber = ctx.payload.issue?.number
  if (!issueNumber) {
    throw new Error('Issue context missing issue number')
  }

  return {
    owner: ctx.repo.owner,
    repo: ctx.repo.repo,
    issueNumber
  }
}
