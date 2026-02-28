import { ConditionGroup } from '../condition/types.js'
import { Action } from '../action/types.js'

export interface RuleConfig {
  condition?: ConditionGroup
  action?: Action
}

export interface ConfigFile {
  rules: Record<string, RuleConfig>
  global?: ConditionGroup
}
