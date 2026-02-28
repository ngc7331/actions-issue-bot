import * as core from '@actions/core'

import type { GitHubClient, Context } from '../context/index.js'
import { getIssueApiContext } from '../context/index.js'
import { normalizeStringList } from '../utils/index.js'

import { AssignActionConfig } from './types.js'

export async function run(
  octokit: GitHubClient,
  ctx: Context,
  action: AssignActionConfig
): Promise<void> {
  if (!action) return

  const apiCtx = getIssueApiContext(ctx)

  const addList = normalizeStringList(action.add)
  const removeList = normalizeStringList(action.remove)

  if (action.remove_all) {
    const currentList = await octokit.rest.issues
      .listAssignees({
        ...apiCtx
      })
      .then((response) => response.data.map((user) => user.login))

    if (currentList.length > 0) {
      core.debug(
        `[action:assign] remove_all assignees=${currentList.join(',')}`
      )

      await octokit.rest.issues.removeAssignees({
        ...apiCtx,
        assignees: currentList
      })
    }
  } else if (removeList.length > 0) {
    core.debug(`[action:assign] remove assignees=${removeList.join(',')}`)

    await octokit.rest.issues.removeAssignees({
      ...apiCtx,
      assignees: removeList
    })
  }

  if (addList.length > 0) {
    core.debug(`[action:assign] add assignees=${addList.join(',')}`)

    await octokit.rest.issues.addAssignees({
      ...apiCtx,
      assignees: addList
    })
  }
}
