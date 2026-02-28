import * as core from '@actions/core'

import type { Context } from '../context/index.js'
import { Condition, OrCondition } from './types.js'

export function evaluate(
  condition: OrCondition,
  ctx: Context,
  evaluator: (condition: Condition, ctx: Context) => boolean
): boolean {
  const result = condition.or.some((entry) => evaluator(entry, ctx))
  core.debug(`[condition:or] count=${condition.or.length} matched=${result}`)
  return result
}
