import { readFile } from 'node:fs/promises'
import path from 'node:path'
import YAML from 'yaml'

import { ConfigFile, RuleConfig } from './types.js'

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
