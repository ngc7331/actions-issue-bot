import * as core from '@actions/core'

import type { GitHubClient, GitHubContext } from '../octokit.js'
import { getIssueContext } from '../octokit.js'
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
  ctx: GitHubContext,
  config: CommentActionConfig
): Promise<void> {
  const { owner, repo, issueNumber } = getIssueContext(ctx)
  const message = config.message

  const body = applyTemplate(
    message,
    ctx.payload.issue?.user?.login,
    ctx.payload.comment?.user?.login
  )

  core.debug(`[action:comment] comment ${previewString(body)}`)

  await octokit.rest.issues.createComment({
    owner,
    repo,
    issue_number: issueNumber,
    body
  })
}
