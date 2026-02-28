import * as core from '@actions/core'

import type { GitHubContext } from '../octokit.js'
import { MemberCondition } from './types.js'

export function evaluate(
  condition: MemberCondition,
  ctx: GitHubContext
): boolean {
  const authorAssociation = (
    ctx.payload.comment?.author_association ??
    ctx.payload.issue?.author_association ??
    ''
  ).toUpperCase()
  const isMember = ['MEMBER', 'OWNER', 'COLLABORATOR'].includes(
    authorAssociation
  )
  const result =
    condition.member === 'include'
      ? true
      : condition.member === 'exclude'
        ? !isMember
        : condition.member === 'only'
          ? isMember
          : false

  core.debug(
    `[condition:member] mode=${condition.member} association=${authorAssociation || 'UNKNOWN'} isMember=${isMember} matched=${result}`
  )

  return result
}
