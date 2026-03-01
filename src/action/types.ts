export interface CommentActionConfig {
  message: string
}

export interface CommentAction {
  comment?: CommentActionConfig
}

export interface LabelActionConfig {
  add?: string | string[]
  remove?: string | string[]
  remove_all?: boolean
}

export interface LabelAction {
  label?: LabelActionConfig
}

export interface AssignActionConfig {
  add?: string | string[]
  remove?: string | string[]
  remove_all?: boolean
}

export interface AssignAction {
  assign?: AssignActionConfig
}

export interface StateActionConfig {
  reason: 'completed' | 'not_planned' | 'reopened'
}

export interface StateAction {
  state?: StateActionConfig
}

export const REACTION_CONTENTS = [
  '+1',
  '-1',
  'laugh',
  'confused',
  'heart',
  'hooray',
  'rocket',
  'eyes'
] as const

export type ReactionContent = (typeof REACTION_CONTENTS)[number]

export interface ReactActionConfig {
  add?: ReactionContent | ReactionContent[]
  remove?: ReactionContent | ReactionContent[]
  remove_all?: boolean
}

export interface ReactAction {
  react?: ReactActionConfig
}

export type Action = CommentAction &
  LabelAction &
  AssignAction &
  StateAction &
  ReactAction
