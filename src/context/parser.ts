import { context } from '@actions/github'

import type { Context, GitHubIssueApiContext } from './types.js'

export function getContext(): Context {
  const owner = context.repo.owner
  const repo = context.repo.repo

  if (
    context.eventName !== 'issues' &&
    context.eventName !== 'issue_comment' &&
    context.eventName !== 'pull_request'
  ) {
    throw new Error(
      `Unexpected event: ${context.eventName}, this action only supports issues, issue_comment, and pull_request events.`
    )
  }

  const event = context.eventName

  const issue_number =
    event === 'pull_request'
      ? context.payload.pull_request?.number
      : context.payload.issue?.number
  if (!issue_number) {
    throw new Error('Context missing issue or pull request number')
  }

  const title =
    event === 'pull_request'
      ? (context.payload.pull_request?.title ?? '')
      : (context.payload.issue?.title ?? '')
  const body =
    event === 'pull_request'
      ? (context.payload.pull_request?.body ?? '')
      : event === 'issue_comment'
        ? (context.payload.comment?.body ?? '')
        : (context.payload.issue?.body ?? '')
  const issue_author =
    event === 'pull_request'
      ? (context.payload.pull_request?.user?.login ?? '')
      : (context.payload.issue?.user?.login ?? '')
  const comment_author =
    event === 'issue_comment'
      ? (context.payload.comment?.user?.login ?? '')
      : undefined
  const author_association =
    event === 'issue_comment'
      ? (context.payload.comment?.author_association ?? '')
      : event === 'pull_request'
        ? (context.payload.pull_request?.author_association ?? '')
        : (context.payload.issue?.author_association ?? '')
  const state =
    event === 'pull_request'
      ? ((context.payload.pull_request?.state as Context['state']) ?? 'open')
      : ((context.payload.issue?.state as Context['state']) ?? 'open')

  return {
    owner,
    repo,
    event,
    issue_number,
    title,
    body,
    state,
    issue_author,
    comment_author,
    author_association
  }
}

export function getIssueApiContext(ctx: Context): GitHubIssueApiContext {
  return {
    owner: ctx.owner,
    repo: ctx.repo,
    issue_number: ctx.issue_number
  }
}
