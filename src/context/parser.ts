import { context } from '@actions/github'

import type {
  Context,
  GitHubClient,
  GitHubIssueApiContext,
  GitHubIssueCommentApiContext
} from './types.js'

// From https://api.github.com/users/github-actions%5Bbot%5D
const GITHUB_ACTIONS_BOT_ID = 41898282

export async function getContext(octokit: GitHubClient): Promise<Context> {
  // get bot login from api
  const bot_id = await octokit.rest.users
    .getAuthenticated()
    .then((res) => res.data.id)
    .catch(() => GITHUB_ACTIONS_BOT_ID)

  const owner = context.repo.owner
  const repo = context.repo.repo
  const ref = context.ref

  let issue_number: number | undefined
  let title: string | undefined
  let body: string | undefined
  let issue_author: string | undefined
  let comment_author: string | undefined
  let author_association: string | undefined
  let comment_id: number | undefined
  let state: string | undefined

  switch (context.eventName) {
    case 'issues':
      issue_number = context.payload.issue?.number
      title = context.payload.issue?.title
      body = context.payload.issue?.body
      issue_author = context.payload.issue?.user?.login
      author_association = context.payload.issue?.author_association
      state = context.payload.issue?.state
      break
    case 'issue_comment':
      issue_number = context.payload.issue?.number
      title = context.payload.issue?.title
      body = context.payload.comment?.body
      issue_author = context.payload.issue?.user?.login
      comment_author = context.payload.comment?.user?.login
      author_association = context.payload.comment?.author_association
      comment_id = context.payload.comment?.id
      state = context.payload.issue?.state
      break
    case 'pull_request':
      issue_number = context.payload.pull_request?.number
      title = context.payload.pull_request?.title
      body = context.payload.pull_request?.body
      issue_author = context.payload.pull_request?.user?.login
      author_association = context.payload.pull_request?.author_association
      state = context.payload.pull_request?.state
      break
    default:
      throw new Error(
        `Unexpected event: ${context.eventName}, this action only supports issues, issue_comment, and pull_request events.`
      )
  }
  const event = context.eventName

  if (!issue_number) {
    throw new Error('Context missing issue or pull request number')
  }

  return {
    bot_id,
    owner,
    repo,
    ref,
    event,
    issue_number,
    comment_id,
    title: title ?? '',
    body: body ?? '',
    state: (state as Context['state']) ?? 'open',
    issue_author: issue_author ?? '',
    comment_author: comment_author ?? '',
    author_association: author_association ?? ''
  }
}

export function getIssueApiContext(ctx: Context): GitHubIssueApiContext {
  return {
    owner: ctx.owner,
    repo: ctx.repo,
    issue_number: ctx.issue_number
  }
}

export function getIssueCommentApiContext(
  ctx: Context
): GitHubIssueCommentApiContext {
  if (!ctx.comment_id) {
    throw new Error('Context missing comment_id for issue_comment event')
  }
  return {
    owner: ctx.owner,
    repo: ctx.repo,
    comment_id: ctx.comment_id
  }
}
