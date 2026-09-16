const LINK = /\[([^\]]+)\]\(([^)\s]+)\)/g

const SAFE_SCHEME = /^(https?:|mailto:)/i

function safeUrl(url: string): string {
  const candidate = url.trim().replace(/"/g, '&#34;')
  if (/^\/\//.test(candidate)) {
    return '#'
  }
  if (/^[a-z][a-z0-9+.-]*:/i.test(candidate) && !SAFE_SCHEME.test(candidate)) {
    return '#'
  }
  return candidate
}

function inline(text: string): string {
  return text
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*([^*\n]+)\*/g, '<em>$1</em>')
    .replace(LINK, (_match, label: string, href: string) => `<a href="${safeUrl(href)}">${label}</a>`)
}

export function renderMarkdown(md: string): string {
  const escaped = md.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  const out: string[] = []
  let inList = false

  const closeList = () => {
    if (inList) {
      out.push('</ul>')
      inList = false
    }
  }

  for (const rawLine of escaped.split('\n')) {
    const line = rawLine.trimEnd()
    const heading = line.match(/^(#{1,3})\s+(.*)$/)
    if (heading) {
      closeList()
      const level = heading[1].length
      out.push(`<h${level}>${inline(heading[2])}</h${level}>`)
      continue
    }
    const bullet = line.match(/^[-*]\s+(.*)$/)
    if (bullet) {
      if (!inList) {
        out.push('<ul>')
        inList = true
      }
      out.push(`<li>${inline(bullet[1])}</li>`)
      continue
    }
    if (line === '') {
      closeList()
      continue
    }
    closeList()
    out.push(`<p>${inline(line)}</p>`)
  }
  closeList()
  return out.join('\n')
}
