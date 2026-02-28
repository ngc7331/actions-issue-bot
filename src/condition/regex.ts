import * as core from '@actions/core'

import type { Context } from '../context/index.js'
import { previewString } from '../utils/index.js'
import { RegexCondition } from './types.js'

export function evaluate(
  condition: RegexCondition,
  ctx: Context
): boolean {
  const pattern = new RegExp(condition.regex)

  const body = ctx.body

  const result = pattern.test(body)
  core.debug(
    `[condition:regex] pattern="${condition.regex}" source="${previewString(body)}" matched=${result}`
  )
  return result
}
