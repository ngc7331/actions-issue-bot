import * as core from '@actions/core'

import type { GitHubContext } from '../octokit.js'
import { Condition, OrCondition } from './types.js'

export function evaluate(
  condition: OrCondition,
  ctx: GitHubContext,
  evaluator: (condition: Condition, ctx: GitHubContext) => boolean
): boolean {
  const result = condition.or.some((entry) => evaluator(entry, ctx))
  core.debug(`[condition:or] count=${condition.or.length} matched=${result}`)
  return result
}
