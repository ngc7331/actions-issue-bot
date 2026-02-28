import type { Context } from '../context/index.js'

import { Condition, ConditionGroup } from './types.js'
import { evaluate as evaluateRegex } from './regex.js'
import { evaluate as evaluateRegexTitle } from './regexTitle.js'
import { evaluate as evaluateMember } from './member.js'
import { evaluate as evaluateAnd } from './and.js'
import { evaluate as evaluateOr } from './or.js'

export function evaluateConditions(
  conditions: ConditionGroup | undefined,
  ctx: Context
): boolean {
  if (!conditions || conditions.length === 0) return true
  return conditions.every((condition) => evaluateCondition(condition, ctx))
}

function evaluateCondition(condition: Condition, ctx: Context): boolean {
  if ('regex' in condition) {
    return evaluateRegex(condition, ctx)
  }

  if ('regex_title' in condition) {
    return evaluateRegexTitle(condition, ctx)
  }

  if ('member' in condition) {
    return evaluateMember(condition, ctx)
  }

  if ('and' in condition) {
    return evaluateAnd(condition, ctx, evaluateCondition)
  }

  if ('or' in condition) {
    return evaluateOr(condition, ctx, evaluateCondition)
  }

  return false
}
