import type { Context } from './types.js'

export function applyTemplateVariables(template: string, ctx: Context): string {
  return template
    .replaceAll('{{ issue.author }}', ctx.issue_author ?? '')
    .replaceAll(
      '{{ comment.author }}',
      (ctx.comment_author || ctx.issue_author) ?? ''
    )
}
