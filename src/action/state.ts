import * as core from '@actions/core'

import type { GitHubClient, GitHubContext } from '../octokit.js'
import { getIssueContext } from '../octokit.js'

import { StateActionConfig } from './types.js'

export async function run(
  octokit: GitHubClient,
  ctx: GitHubContext,
  config: StateActionConfig
): Promise<void> {
  if (!config) return

  const { owner, repo, issueNumber } = getIssueContext(ctx)

  const state = config.reason === 'reopened' ? 'open' : 'closed'
  const reason = config.reason

  core.debug(
    `[action:state] issue=${owner}/${repo}#${issueNumber} state=${state} reason=${reason}`
  )

  await octokit.rest.issues.update({
    owner,
    repo,
    issue_number: issueNumber,
    state,
    state_reason: reason
  })
}
