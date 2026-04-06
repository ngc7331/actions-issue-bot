import * as core from '@actions/core'

import type { GitHubClient, Context } from '../context/index.js'
import { getIssueApiContext, applyTemplateVariables } from '../context/index.js'
import { previewString } from '../utils/index.js'

import { CommentActionConfig } from './types.js'

export async function run(
  octokit: GitHubClient,
  ctx: Context,
  config: CommentActionConfig
): Promise<void> {
  const apiCtx = getIssueApiContext(ctx)
  const message = config.message

  const body = applyTemplateVariables(message, ctx)

  core.debug(`[action:comment] comment ${previewString(body)}`)

  await octokit.rest.issues.createComment({
    ...apiCtx,
    body
  })
}
