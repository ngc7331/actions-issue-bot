import { readFile } from 'node:fs/promises'
import path from 'node:path'
import YAML from 'yaml'

import { ConfigFile, RuleConfig } from './types.js'
import type {
  AndCondition,
  Condition,
  ConditionGroup,
  EventTypeCondition,
  MemberCondition,
  MemberMode,
  OrCondition,
  NotCondition,
  RegexCondition,
  RegexTitleCondition,
  StateCondition
} from '../condition/types.js'
import { MEMBER_MODES } from '../condition/types.js'
import type { ContextEvent, ContextState } from '../context/types.js'
import { CONTEXT_EVENTS, CONTEXT_STATES } from '../context/types.js'

export async function parseConfig(filePath: string): Promise<ConfigFile> {
  const cwd = process.cwd()
  const resolvedPath = path.isAbsolute(filePath)
    ? filePath
    : path.join(cwd, filePath)

  const fileRaw = await readFile(resolvedPath, 'utf8')
  const parsed = YAML.parse(fileRaw) as unknown

  if (!parsed || typeof parsed !== 'object' || !('rules' in parsed)) {
    throw new Error('Configuration file is empty or invalid')
  }

  const config = normalizeConfig(parsed)

  validateConfig(config)

  return config
}

function normalizeConfig(input: unknown): ConfigFile {
  const raw = input as Record<string, unknown>
  const rulesRaw = (raw.rules ?? {}) as Record<string, unknown>
  const rules: Record<string, RuleConfig> = {}

  for (const [name, value] of Object.entries(rulesRaw)) {
    if (!value || typeof value !== 'object') continue
    const rule = value as RuleConfig
    rules[name] = {
      condition: rule.condition,
      action: rule.action
    }
  }

  return {
    rules,
    global: raw.global as ConfigFile['global']
  }
}

function validateConfig(config: ConfigFile): void {
  if (config.global) {
    validateConditionGroup('global', config.global)
  }

  for (const [ruleName, rule] of Object.entries(config.rules)) {
    if (!rule.condition) {
      throw new Error(`Rule "${ruleName}" is missing a condition block.`)
    }

    if (typeof rule.action !== 'object') {
      throw new Error(`Action for rule "${ruleName}" must be an object.`)
    }

    validateConditionGroup(ruleName, rule.condition)
  }
}

const validEventTypes = new Set<ContextEvent>(CONTEXT_EVENTS)
const validStates = new Set<ContextState>(CONTEXT_STATES)
const validMemberModes = new Set<MemberMode>(MEMBER_MODES)

function validateConditionGroup(
  name: string,
  conditions: ConditionGroup
): void {
  if (!conditions) return
  if (!Array.isArray(conditions)) {
    throw new Error(`Condition block "${name}" must be an array.`)
  }

  for (const condition of conditions) {
    if (!condition || typeof condition !== 'object') {
      throw new Error(`Condition in "${name}" must be an object.`)
    }

    const keys = Object.keys(condition)
    if (keys.length !== 1) {
      throw new Error(
        `Condition in "${name}" must have exactly one key; received: ${keys.join(', ') || 'none'}.`
      )
    }

    const key = keys[0] as keyof Condition

    switch (key) {
      case 'regex': {
        if (typeof (condition as RegexCondition).regex !== 'string') {
          throw new Error(`regex condition in "${name}" must be a string.`)
        }
        break
      }
      case 'regex_title': {
        if (
          typeof (condition as RegexTitleCondition).regex_title !== 'string'
        ) {
          throw new Error(
            `regex_title condition in "${name}" must be a string.`
          )
        }
        break
      }
      case 'event_type': {
        const value = (condition as EventTypeCondition).event_type
        if (!validEventTypes.has(value)) {
          throw new Error(
            `Invalid event_type value "${value}" in ${name}; expected one of ${CONTEXT_EVENTS.join(', ')}.`
          )
        }
        break
      }
      case 'state': {
        const value = (condition as StateCondition).state
        if (!validStates.has(value)) {
          throw new Error(
            `Invalid state value "${value}" in ${name}; expected one of ${CONTEXT_STATES.join(', ')}.`
          )
        }
        break
      }
      case 'member': {
        const value = (condition as MemberCondition).member
        if (!validMemberModes.has(value)) {
          throw new Error(
            `Invalid member value "${value}" in ${name}; expected one of ${MEMBER_MODES.join(', ')}.`
          )
        }
        break
      }
      case 'and':
      case 'or': {
        const nested = (condition as AndCondition | OrCondition)[
          key
        ] as ConditionGroup
        validateConditionGroup(`${name}.${key}`, nested)
        break
      }
      case 'not': {
        const nested = (condition as NotCondition).not as Condition

        if (!nested || typeof nested !== 'object') {
          throw new Error(`not condition in "${name}" must be an object.`)
        }

        const nestedKeys = Object.keys(nested)
        if (nestedKeys.length !== 1) {
          throw new Error(
            `not condition in "${name}" must wrap exactly one condition; received: ${nestedKeys.join(', ') || 'none'}.`
          )
        }

        validateConditionGroup(`${name}.not`, [nested])
        break
      }
      default:
        throw new Error(`Unknown condition key "${key}" in ${name}.`)
    }
  }
}
