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

export type Action = CommentAction & LabelAction & AssignAction & StateAction
