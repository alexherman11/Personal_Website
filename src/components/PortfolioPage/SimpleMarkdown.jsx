/**
 * Lightweight markdown renderer for project descriptions.
 * Supports: #### headings, **bold**, - bullet lists, paragraphs.
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
      !lines[i].trimStart().startsWith('- ')
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

/** Renders **bold** spans within text */
function InlineMarkdown({ text }) {
  const parts = text.split(/(\*\*[^*]+\*\*)/)
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={i}>{part.slice(2, -2)}</strong>
    }
    return <span key={i}>{part}</span>
  })
}
