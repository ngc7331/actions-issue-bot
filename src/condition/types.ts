export type Condition =
  | RegexCondition
  | RegexTitleCondition
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
