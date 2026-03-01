import * as core from '@actions/core'

import type { GitHubClient, Context } from '../context/index.js'
import { getIssueApiContext } from '../context/index.js'
import { normalizeStringList } from '../utils/index.js'
import { ReactActionConfig, ReactionContent } from './types.js'
import { getIssueCommentApiContext } from '../context/parser.js'

function normalizeReactions(
  value: ReactionContent | ReactionContent[] | undefined
): ReactionContent[] {
  return normalizeStringList(
    value as string | string[],
    true
  ) as ReactionContent[]
}

async function addReactions(
  octokit: GitHubClient,
  ctx: Context,
  content: ReactionContent
): Promise<void> {
  if (ctx.event === 'issue_comment') {
    const apiCtx = getIssueCommentApiContext(ctx)
    core.debug(`[action:react:add] target=comment#${apiCtx.comment_id}`)
    await octokit.rest.reactions.createForIssueComment({
      ...apiCtx,
      content
    })
  } else {
    const apiCtx = getIssueApiContext(ctx)
    core.debug(`[action:react:add] target=issue#${apiCtx.issue_number}`)
    await octokit.rest.reactions.createForIssue({
      ...apiCtx,
      content
    })
  }
}

async function removeReactions(
  octokit: GitHubClient,
  ctx: Context,
  content?: ReactionContent
): Promise<void> {
  if (ctx.event === 'issue_comment') {
    const apiCtx = getIssueCommentApiContext(ctx)

    const existing = await octokit.rest.reactions.listForIssueComment({
      ...apiCtx,
      content,
      per_page: 100
    })

    for (const reaction of existing.data) {
      if (reaction.user?.id !== ctx.bot_id) {
        continue
      }

      core.debug(
        `[action:react:remove] target=comment#${apiCtx.comment_id}.${reaction.id}`
      )

      await octokit.rest.reactions.deleteForIssueComment({
        ...apiCtx,
        reaction_id: reaction.id
      })
    }
  } else {
    const apiCtx = getIssueApiContext(ctx)
    const existing = await octokit.rest.reactions.listForIssue({
      ...apiCtx,
      content,
      per_page: 100
    })

    for (const reaction of existing.data) {
      if (reaction.user?.id !== ctx.bot_id) {
        continue
      }

      core.debug(
        `[action:react:remove] target=issue#${apiCtx.issue_number}.${reaction.id}`
      )

      await octokit.rest.reactions.deleteForIssue({
        ...apiCtx,
        reaction_id: reaction.id
      })
    }
  }
}

export async function run(
  octokit: GitHubClient,
  ctx: Context,
  config: ReactActionConfig
): Promise<void> {
  if (!config) return

  const addList = normalizeReactions(config.add)
  const removeList = normalizeReactions(config.remove)

  if (config.remove_all) {
    core.debug('[action:react] remove all reactions')
    await removeReactions(octokit, ctx)
  } else {
    for (const content of removeList) {
      await removeReactions(octokit, ctx, content)
    }
  }

  for (const content of addList) {
    await addReactions(octokit, ctx, content)
  }
}
