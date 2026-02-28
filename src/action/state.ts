import * as core from '@actions/core'

import type { GitHubClient, Context } from '../context/index.js'
import { getIssueApiContext } from '../context/index.js'

import { StateActionConfig } from './types.js'

export async function run(
  octokit: GitHubClient,
  ctx: Context,
  config: StateActionConfig
): Promise<void> {
  if (!config) return

  const apiCtx = getIssueApiContext(ctx)

  const state = config.reason === 'reopened' ? 'open' : 'closed'
  const state_reason = config.reason

  core.debug(
    `[action:state] set state=${state} reason=${state_reason}`
  )

  await octokit.rest.issues.update({
    ...apiCtx,
    state,
    state_reason
  })
}
