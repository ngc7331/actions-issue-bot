import type { GitHubClient, GitHubContext } from '../octokit.js'

import type { Action } from './types.js'
import { run as runComment } from './comment.js'
import { run as runLabel } from './label.js'
import { run as runAssign } from './assign.js'
import { run as runState } from './state.js'

export async function runActions(
  octokit: GitHubClient,
  actions: Action | undefined,
  ctx: GitHubContext
): Promise<void> {
  if (!actions) return

  const tasks: Array<Promise<unknown>> = []

  if (actions.comment) {
    tasks.push(runComment(octokit, ctx, actions.comment))
  }

  if (actions.label) {
    tasks.push(runLabel(octokit, ctx, actions.label))
  }

  if (actions.assign) {
    tasks.push(runAssign(octokit, ctx, actions.assign))
  }

  if (actions.state) {
    tasks.push(runState(octokit, ctx, actions.state))
  }

  await Promise.all(tasks)
}
