/**
 * Lightweight markdown renderer for project descriptions.
 * Supports: #### headings, **bold**, [links](url), - bullet lists,
 * ``` fenced blocks (code and ASCII diagrams, shown verbatim), paragraphs.
 */
export default function SimpleMarkdown({ text }) {
  if (!text) return null

  const blocks = []
  const lines = text.split('\n')
  let i = 0
  let blockKey = 0

  while (i < lines.length) {
    const line = lines[i]

    // Skip empty lines
    if (line.trim() === '') {
      i++
      continue
    }

    // ``` fenced block: kept verbatim, whitespace and all
    if (line.trimStart().startsWith('```')) {
      const body = []
      i++
      while (i < lines.length && !lines[i].trimStart().startsWith('```')) {
        body.push(lines[i])
        i++
      }
      i++ // closing fence
      blocks.push({ type: 'pre', content: body.join('\n'), key: `pre-${blockKey++}` })
      continue
    }

    // #### Heading
    if (line.startsWith('#### ')) {
      blocks.push({ type: 'h4', content: line.slice(5).trim(), key: `h-${blockKey++}` })
      i++
      continue
    }

    // Bullet list: collect consecutive - lines
    if (line.trimStart().startsWith('- ')) {
      const items = []
      while (i < lines.length && lines[i].trimStart().startsWith('- ')) {
        items.push(lines[i].trimStart().slice(2))
        i++
      }
      blocks.push({ type: 'ul', items, key: `ul-${blockKey++}` })
      continue
    }

    // Paragraph: collect consecutive non-empty, non-special lines
    const paraLines = []
    while (
      i < lines.length &&
      lines[i].trim() !== '' &&
      !lines[i].startsWith('#### ') &&
      !lines[i].trimStart().startsWith('- ') &&
      !lines[i].trimStart().startsWith('```')
    ) {
      paraLines.push(lines[i])
      i++
    }
    if (paraLines.length > 0) {
      blocks.push({ type: 'p', content: paraLines.join(' '), key: `p-${blockKey++}` })
    }
  }

  return (
    <div className="simple-md">
      {blocks.map((block) => {
        if (block.type === 'h4') {
          return <h4 key={block.key} className="simple-md__h4">{block.content}</h4>
        }
        if (block.type === 'pre') {
          return (
            <pre key={block.key} className="simple-md__pre" onClick={e => e.stopPropagation()}>
              {block.content}
            </pre>
          )
        }
        if (block.type === 'ul') {
          return (
            <ul key={block.key} className="simple-md__ul">
              {block.items.map((item, j) => (
                <li key={j} className="simple-md__li">
                  <InlineMarkdown text={item} />
                </li>
              ))}
            </ul>
          )
        }
        return (
          <p key={block.key} className="simple-md__p">
            <InlineMarkdown text={block.content} />
          </p>
        )
      })}
    </div>
  )
}

/** Renders **bold** spans and [text](url) links within text */
function InlineMarkdown({ text }) {
  const parts = text.split(/(\*\*[^*]+\*\*|\[[^\]]+\]\([^)\s]+\))/)
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={i}>{part.slice(2, -2)}</strong>
    }
    const link = /^\[([^\]]+)\]\(([^)\s]+)\)$/.exec(part)
    if (link) {
      const external = /^https?:/.test(link[2])
      return (
        <a
          key={i}
          href={link[2]}
          className="simple-md__a"
          {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
          onClick={e => e.stopPropagation()}
        >
          {link[1]}
        </a>
      )
    }
    return <span key={i}>{part}</span>
  })
}
