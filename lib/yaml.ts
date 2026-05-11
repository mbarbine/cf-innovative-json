function scalar(value: unknown): string {
  if (value === null) return 'null'
  if (typeof value === 'number' || typeof value === 'boolean') return String(value)
  const text = String(value)
  if (/^[A-Za-z0-9_./:-]+$/.test(text)) return text
  return JSON.stringify(text)
}

export function toYaml(value: unknown, indent = 0): string {
  const pad = ' '.repeat(indent)

  if (Array.isArray(value)) {
    if (value.length === 0) return '[]'
    return value.map((item) => {
      if (item && typeof item === 'object') {
        return `${pad}- ${toYaml(item, indent + 2).trimStart()}`
      }
      return `${pad}- ${scalar(item)}`
    }).join('\n')
  }

  if (value && typeof value === 'object') {
    const entries = Object.entries(value as Record<string, unknown>)
    if (entries.length === 0) return '{}'

    return entries.map(([key, item]) => {
      if (item && typeof item === 'object') {
        const rendered = toYaml(item, indent + 2)
        if (Array.isArray(item) && item.length > 0) return `${pad}${key}:\n${rendered}`
        return `${pad}${key}:\n${rendered}`
      }
      return `${pad}${key}: ${scalar(item)}`
    }).join('\n')
  }

  return `${pad}${scalar(value)}`
}
