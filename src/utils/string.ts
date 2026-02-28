export function previewString(text: string, max = 80): string {
  return text.length <= max ? text : `${text.slice(0, max)}…`
}

export function normalizeStringList(
  input?: string | string[],
  unique = false
): string[] {
  if (!input) return []
  const list = Array.isArray(input) ? input : [input]
  return unique
    ? Array.from(new Set(list.filter(Boolean)))
    : list.filter(Boolean)
}
