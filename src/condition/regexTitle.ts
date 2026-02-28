import * as core from '@actions/core'

import type { GitHubContext } from '../octokit.js'
import { previewString } from '../utils/index.js'
import { RegexTitleCondition } from './types.js'

export function evaluate(
  condition: RegexTitleCondition,
  ctx: GitHubContext
): boolean {
  // skip if not triggered by an issue
  if (ctx.eventName !== 'issues') {
    core.debug('[condition:regex_title] skipped: event is not "issues"')
    return false
  }

  const pattern = new RegExp(condition.regex_title)
  const title = ctx.payload.issue?.title ?? ''
  const matched = pattern.test(title)
  core.debug(
    `[condition:regex_title] pattern="${condition.regex_title}" title="${previewString(title)}" matched=${matched}`
  )
  return matched
}
