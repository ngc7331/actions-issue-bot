import { ContextEvent } from '../context/types.js'

export type Condition =
  | RegexCondition
  | RegexTitleCondition
  | EventTypeCondition
  | MemberCondition
  | AndCondition
  | OrCondition

export type ConditionGroup = Condition[]

export interface RegexCondition {
  regex: string
}

export interface RegexTitleCondition {
  regex_title: string
}

export interface EventTypeCondition {
  event_type: ContextEvent
}

export type MemberMode = 'include' | 'exclude' | 'only'

export interface MemberCondition {
  member: MemberMode
}

export interface AndCondition {
  and: ConditionGroup
}

export interface OrCondition {
  or: ConditionGroup
}
