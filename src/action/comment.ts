import * as core from '@actions/core'

import type { GitHubClient, Context } from '../context/index.js'
import { getIssueApiContext } from '../context/index.js'
import { previewString } from '../utils/index.js'

import { CommentActionConfig } from './types.js'

function applyTemplate(
  template: string,
  issueAuthor?: string,
  commentAuthor?: string
): string {
  return template
    .replaceAll('{{ issue.author }}', issueAuthor ?? '')
    .replaceAll('{{ comment.author }}', (commentAuthor || issueAuthor) ?? '')
}

export async function run(
  octokit: GitHubClient,
  ctx: Context,
  config: CommentActionConfig
): Promise<void> {
  const apiCtx = getIssueApiContext(ctx)
  const message = config.message

  const body = applyTemplate(message, ctx.issue_author, ctx.comment_author)

  core.debug(`[action:comment] comment ${previewString(body)}`)

  await octokit.rest.issues.createComment({
    ...apiCtx,
    body
  })
}
