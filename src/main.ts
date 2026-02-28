import * as core from '@actions/core'
import { context, getOctokit } from '@actions/github'
import { parseConfig } from './config/index.js'
import { evaluateConditions } from './condition/index.js'
import { runActions } from './action/index.js'

export async function run(): Promise<void> {
  try {
    const configPath = core.getInput('config') || '.github/issue-bot.yaml'
    const token = core.getInput('token') || process.env.GITHUB_TOKEN

    if (!token) {
      throw new Error(
        'A GitHub token is required (set input "token" or GITHUB_TOKEN).'
      )
    }

    const octokit = getOctokit(token)
    const config = await parseConfig(configPath)

    const issue = context.payload.issue

    if (!issue) {
      core.info(
        'No issue payload detected; this action only handles issue and issue_comment events.'
      )
      return
    }

    for (const [ruleName, rule] of Object.entries(config.rules ?? {})) {
      core.info(`Evaluating rule: ${ruleName}`)
      const matched = evaluateConditions(rule.condition, context)
      core.info(`Rule ${ruleName} matched=${matched}`)
      if (!matched) continue

      await runActions(octokit, rule.action, context)
    }
  } catch (error) {
    if (error instanceof Error) core.setFailed(error.message)
  }
}
