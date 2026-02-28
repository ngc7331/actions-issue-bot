import * as core from '@actions/core'

import type { Context } from '../context/index.js'
import type { EventTypeCondition } from './types.js'

export function evaluate(condition: EventTypeCondition, ctx: Context): boolean {
  const actual = ctx.event
  const expected = condition.event_type
  const matched = actual === expected

  core.debug(
    `[condition:event_type] expected=${expected} actual=${actual} matched=${matched}`
  )

  return matched
}
