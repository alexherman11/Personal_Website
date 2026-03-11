import logbooks from '../../data/logbooks'
import './Logbook.css'

const CONTENT_WIDTH = 56
const BORDER_WIDTH = CONTENT_WIDTH + 4  // 2 border chars + 2 spaces each side

function wrapText(text, maxWidth) {
  const words = text.split(' ')
  const lines = []
  let currentLine = ''

  for (const word of words) {
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

  return lines
}

function padLine(text) {
  return text + ' '.repeat(Math.max(0, CONTENT_WIDTH - text.length))
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
