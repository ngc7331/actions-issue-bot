import * as core from '@actions/core'

import type { GitHubClient, GitHubContext } from '../octokit.js'
import { getIssueContext } from '../octokit.js'
import { normalizeStringList } from '../utils/index.js'

import { LabelActionConfig } from './types.js'

export async function run(
  octokit: GitHubClient,
  ctx: GitHubContext,
  action: LabelActionConfig
): Promise<void> {
  if (!action) return

  const addList = normalizeStringList(action.add)
  const removeList = normalizeStringList(action.remove)
  const { owner, repo, issueNumber } = getIssueContext(ctx)

  if (action.remove_all) {
    core.debug(`[action:label] remove_all`)

    await octokit.rest.issues.removeAllLabels({
      owner,
      repo,
      issue_number: issueNumber
    })
  } else if (removeList.length > 0) {
    for (const name of removeList) {
      core.debug(`[action:label] remove=${name}`)

      await octokit.rest.issues.removeLabel({
        owner,
        repo,
        issue_number: issueNumber,
        name
      })
    }
  }

  if (addList.length > 0) {
    core.debug(`[action:label] add=${addList.join(',')}`)

    await octokit.rest.issues.addLabels({
      owner,
      repo,
      issue_number: issueNumber,
      labels: addList
    })
  }
}
