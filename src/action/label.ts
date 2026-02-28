import * as core from '@actions/core'

import type { GitHubClient, Context } from '../context/index.js'
import { getIssueApiContext } from '../context/index.js'
import { normalizeStringList } from '../utils/index.js'

import { LabelActionConfig } from './types.js'

export async function run(
  octokit: GitHubClient,
  ctx: Context,
  action: LabelActionConfig
): Promise<void> {
  if (!action) return

  const addList = normalizeStringList(action.add)
  const removeList = normalizeStringList(action.remove)
  const apiCtx = getIssueApiContext(ctx)

  if (action.remove_all) {
    core.debug(`[action:label] remove_all`)

    await octokit.rest.issues.removeAllLabels({
      ...apiCtx
    })
  } else if (removeList.length > 0) {
    for (const name of removeList) {
      core.debug(`[action:label] remove=${name}`)

      await octokit.rest.issues.removeLabel({
        ...apiCtx,
        name
      })
    }
  }

  if (addList.length > 0) {
    core.debug(`[action:label] add=${addList.join(',')}`)

    await octokit.rest.issues.addLabels({
      ...apiCtx,
      labels: addList
    })
  }
}
