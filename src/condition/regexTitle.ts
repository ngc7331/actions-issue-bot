import * as core from '@actions/core'

import type { Context } from '../context/index.js'
import { previewString } from '../utils/index.js'
import { RegexTitleCondition } from './types.js'

export function evaluate(
  condition: RegexTitleCondition,
  ctx: Context
): boolean {
  const pattern = new RegExp(condition.regex_title)
  const title = ctx.title
  const matched = pattern.test(title)
  core.debug(
    `[condition:regex_title] pattern="${condition.regex_title}" title="${previewString(title)}" matched=${matched}`
  )
  return matched
}
