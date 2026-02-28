import { ContextEvent, ContextState } from '../context/types.js'

export type Condition =
  | RegexCondition
  | RegexTitleCondition
  | EventTypeCondition
  | StateCondition
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

export interface StateCondition {
  state: ContextState
}

export const MEMBER_MODES = ['include', 'exclude', 'only'] as const
export type MemberMode = (typeof MEMBER_MODES)[number]

export interface MemberCondition {
  member: MemberMode
}

export interface AndCondition {
  and: ConditionGroup
}

export interface OrCondition {
  or: ConditionGroup
}
