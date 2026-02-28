import * as core from '@actions/core'

import type { Context } from '../context/index.js'
import { MemberCondition } from './types.js'

export function evaluate(condition: MemberCondition, ctx: Context): boolean {
  const authorAssociation = (ctx.author_association ?? '').toUpperCase()
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
