import logbooks from '../../data/logbooks'
import './Logbook.css'

const CONTENT_WIDTH = 56
const BORDER_WIDTH = CONTENT_WIDTH + 4  // 2 border chars + 2 spaces each side

function wrapText(text, maxWidth) {
  const lines = []
  // Honor explicit paragraph breaks: split on newlines first, then wrap each segment
  const paragraphs = text.split(/\r?\n/)

  paragraphs.forEach((paragraph, pIdx) => {
    if (paragraph.length === 0) {
      lines.push('')
    } else {
      const words = paragraph.split(' ').filter(w => w.length > 0)
      let currentLine = ''
      for (const word of words) {
        // Hard-wrap any single word that exceeds the width so it never overflows the border
        if (word.length > maxWidth) {
          if (currentLine.length > 0) {
            lines.push(currentLine)
            currentLine = ''
          }
          for (let i = 0; i < word.length; i += maxWidth) {
            const chunk = word.slice(i, i + maxWidth)
            if (chunk.length === maxWidth) lines.push(chunk)
            else currentLine = chunk
          }
          continue
        }
        if (currentLine.length === 0) {
          currentLine = word
        } else if (currentLine.length + 1 + word.length <= maxWidth) {
          currentLine += ' ' + word
        } else {
          lines.push(currentLine)
          currentLine = word
        }
      }
      if (currentLine.length > 0) {
        lines.push(currentLine)
      }
    }
    // Don't add trailing blank for the last paragraph (caller controls spacing)
    if (pIdx < paragraphs.length - 1 && paragraph.length > 0) {
      // Newlines in source already produced empty paragraphs; nothing to add here
    }
  })

  return lines
}

// Visible length, ignoring control chars that don't render as columns
function visibleLength(text) {
  // Strip CR/LF if any leak through (defensive — wrapText should have handled them)
  return text.replace(/[\r\n]/g, '').length
}

function padLine(text) {
  const cleaned = text.replace(/[\r\n]/g, '')
  return cleaned + ' '.repeat(Math.max(0, CONTENT_WIDTH - visibleLength(cleaned)))
}

export default function Logbook({ logbookId, page, onNextPage, onPrevPage, onClose }) {
  const logbook = logbooks[logbookId]
  if (!logbook) return null

  const totalPages = logbook.pages.length
  const clampedPage = Math.max(0, Math.min(page, totalPages - 1))
  const currentPage = logbook.pages[clampedPage]

  const hr = '\u2550'.repeat(BORDER_WIDTH)
  const TL = '\u2554', TR = '\u2557', BL = '\u255A', BR = '\u255D'
  const VL = '\u2551'
  const ML = '\u2560', MR = '\u2563'

  const titleLine = logbook.title
  const pageNum = `Page ${clampedPage + 1}/${totalPages}`
  const headerPadding = CONTENT_WIDTH - titleLine.length - pageNum.length
  const headerText = titleLine + ' '.repeat(Math.max(1, headerPadding)) + pageNum

  const bodyLines = []
  // Page title
  bodyLines.push(currentPage.title.toUpperCase())
  bodyLines.push('\u2500'.repeat(Math.min(currentPage.title.length + 2, CONTENT_WIDTH)))
  bodyLines.push('')

  // Page body — wrap to content width
  const wrapped = wrapText(currentPage.body, CONTENT_WIDTH)
  bodyLines.push(...wrapped)

  // Navigation footer
  const prevHint = clampedPage > 0 ? '\u2190 prev' : '      '
  const nextHint = clampedPage < totalPages - 1 ? 'next \u2192' : '      '
  const navPadding = CONTENT_WIDTH - prevHint.length - nextHint.length
  const navLine = prevHint + ' '.repeat(Math.max(1, navPadding)) + nextHint

  const closeLine = '[ESC or Q to close]'
  const closePadding = Math.floor((CONTENT_WIDTH - closeLine.length) / 2)
  const closeText = ' '.repeat(closePadding) + closeLine

  // Build the full frame
  const frameLines = []
  frameLines.push(`${TL}${hr}${TR}`)
  frameLines.push(`${VL}  ${padLine(headerText)}  ${VL}`)
  frameLines.push(`${ML}${hr}${MR}`)
  frameLines.push(`${VL}  ${padLine('')}  ${VL}`)

  for (const line of bodyLines) {
    frameLines.push(`${VL}  ${padLine(line)}  ${VL}`)
  }

  // Add some padding at the bottom
  for (let i = bodyLines.length; i < 14; i++) {
    frameLines.push(`${VL}  ${padLine('')}  ${VL}`)
  }

  frameLines.push(`${VL}  ${padLine('')}  ${VL}`)
  frameLines.push(`${ML}${hr}${MR}`)
  frameLines.push(`${VL}  ${padLine(navLine)}  ${VL}`)
  frameLines.push(`${VL}  ${padLine(closeText)}  ${VL}`)
  frameLines.push(`${BL}${hr}${BR}`)

  return (
    <div className="logbook-overlay" onClick={onClose}>
      <div className="logbook" onClick={(e) => e.stopPropagation()}>
        <pre className="logbook__content">
          {frameLines.join('\n')}
        </pre>
      </div>
    </div>
  )
}
