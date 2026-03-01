import * as core from '@actions/core'

import type { Context } from '../context/index.js'
import type { Condition, NotCondition } from './types.js'

export function evaluate(
  condition: NotCondition,
  ctx: Context,
  evaluateCondition: (condition: Condition, ctx: Context) => boolean
): boolean {
  const matched = !evaluateCondition(condition.not, ctx)

  core.debug(`[condition:not] matched=${matched}`)

  return matched
}
