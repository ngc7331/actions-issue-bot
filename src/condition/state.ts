import * as core from '@actions/core'

import type { Context } from '../context/index.js'
import type { StateCondition } from './types.js'

export function evaluate(condition: StateCondition, ctx: Context): boolean {
  const actual = ctx.state
  const expected = condition.state
  const matched = actual === expected

  core.debug(
    `[condition:state] expected=${expected} actual=${actual} matched=${matched}`
  )

  return matched
}
