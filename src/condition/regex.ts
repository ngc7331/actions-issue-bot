import * as core from '@actions/core'

import type { GitHubContext } from '../octokit.js'
import { previewString } from '../utils/index.js'
import { RegexCondition } from './types.js'

export function evaluate(
  condition: RegexCondition,
  ctx: GitHubContext
): boolean {
  const pattern = new RegExp(condition.regex)
  const issueBody = ctx.payload.issue?.body ?? null
  const commentBody = ctx.payload.comment?.body ?? null
  const sources = [issueBody, commentBody].filter(Boolean) as string[]

  const matched = sources.some((text) => {
    const result = pattern.test(text)
    core.debug(
      `[condition:regex] pattern="${condition.regex}" source="${previewString(text)}" matched=${result}`
    )
    return result
  })

  if (!sources.length) {
    core.debug('[condition:regex] no sources to evaluate')
  }

  return matched
}
