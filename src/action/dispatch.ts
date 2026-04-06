import * as core from '@actions/core'

import type { GitHubClient, Context } from '../context/index.js'
import { applyTemplateVariables } from '../context/index.js'

import { DispatchActionConfig } from './types.js'

function renderWorkflowInputs(
  inputs: Record<string, string> | undefined,
  ctx: Context
): Record<string, string> | undefined {
  if (!inputs) return undefined

  const rendered: Record<string, string> = {}

  for (const [key, value] of Object.entries(inputs)) {
    rendered[key] = applyTemplateVariables(value, ctx)
  }

  return Object.keys(rendered).length > 0 ? rendered : undefined
}

export async function run(
  octokit: GitHubClient,
  ctx: Context,
  config: DispatchActionConfig
): Promise<void> {
  if (!config) return

  const workflow = applyTemplateVariables(config.name, ctx).trim()
  if (!workflow) {
    throw new Error('dispatch.name must be a non-empty string.')
  }

  const ref = config.ref
    ? applyTemplateVariables(config.ref, ctx).trim() || undefined
    : ctx.ref?.trim() || undefined

  if (!ref) {
    throw new Error('dispatch.ref is required from config.ref or context.ref.')
  }

  const inputs = renderWorkflowInputs(config.inputs, ctx)

  core.debug(
    `[action:dispatch] workflow=${workflow}${ref ? ` ref=${ref}` : ''}${inputs ? ` inputs=${Object.keys(inputs).join(',')}` : ''}`
  )

  const dispatchRequest = {
    owner: ctx.owner,
    repo: ctx.repo,
    workflow_id: workflow,
    ref,
    ...(inputs ? { inputs } : {})
  } as Parameters<typeof octokit.rest.actions.createWorkflowDispatch>[0]

  await octokit.rest.actions.createWorkflowDispatch(dispatchRequest)
}
