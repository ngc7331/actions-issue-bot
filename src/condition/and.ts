import * as core from '@actions/core'

import type { GitHubContext } from '../octokit.js'
import { AndCondition, Condition } from './types.js'

export function evaluate(
  condition: AndCondition,
  ctx: GitHubContext,
  evaluator: (condition: Condition, ctx: GitHubContext) => boolean
): boolean {
  const result = condition.and.every((entry) => evaluator(entry, ctx))
  core.debug(`[condition:and] count=${condition.and.length} matched=${result}`)
  return result
}
