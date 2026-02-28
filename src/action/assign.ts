import * as core from '@actions/core'

import type { GitHubClient, GitHubContext } from '../octokit.js'
import { getIssueContext } from '../octokit.js'
import { normalizeStringList } from '../utils/index.js'

import { AssignActionConfig } from './types.js'

export async function run(
  octokit: GitHubClient,
  ctx: GitHubContext,
  action: AssignActionConfig
): Promise<void> {
  if (!action) return

  const { owner, repo, issueNumber } = getIssueContext(ctx)

  const addList = normalizeStringList(action.add)
  const removeList = normalizeStringList(action.remove)

  if (action.remove_all) {
    const currentList = await octokit.rest.issues
      .listAssignees({
        owner,
        repo,
        issue_number: issueNumber
      })
      .then((response) => response.data.map((user) => user.login))

    if (currentList.length > 0) {
      core.debug(
        `[action:assign] remove_all assignees=${currentList.join(',')}`
      )

      await octokit.rest.issues.removeAssignees({
        owner,
        repo,
        issue_number: issueNumber,
        assignees: currentList
      })
    }
  } else if (removeList.length > 0) {
    core.debug(`[action:assign] remove assignees=${removeList.join(',')}`)

    await octokit.rest.issues.removeAssignees({
      owner,
      repo,
      issue_number: issueNumber,
      assignees: removeList
    })
  }

  if (addList.length > 0) {
    core.debug(`[action:assign] add assignees=${addList.join(',')}`)

    await octokit.rest.issues.addAssignees({
      owner,
      repo,
      issue_number: issueNumber,
      assignees: addList
    })
  }
}
