import * as core from '@actions/core'

import type { Context } from '../context/index.js'
import { AndCondition, Condition } from './types.js'

export function evaluate(
  condition: AndCondition,
  ctx: Context,
  evaluator: (condition: Condition, ctx: Context) => boolean
): boolean {
  const result = condition.and.every((entry) => evaluator(entry, ctx))
  core.debug(`[condition:and] count=${condition.and.length} matched=${result}`)
  return result
}
