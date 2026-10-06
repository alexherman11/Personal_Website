import { useEffect, useRef, useState } from 'react'
import './Editor.css'

// Overlay editor for @edit: a plain textarea in the CRT style.
// Ctrl/Cmd+Enter saves, Esc cancels.
export default function Editor({ editor, onSave, onCancel }) {
  const [text, setText] = useState(editor.text || '')
  const ref = useRef(null)

  useEffect(() => { setText(editor.text || ''); setTimeout(() => ref.current?.focus(), 50) }, [editor])

  const onKey = (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') { e.preventDefault(); onSave(text) }
    else if (e.key === 'Escape') { e.preventDefault(); onCancel() }
    else if (e.key === 'Tab') {
      e.preventDefault()
      const el = e.target
      const s = el.selectionStart, en = el.selectionEnd
      const next = text.slice(0, s) + '  ' + text.slice(en)
      setText(next)
      requestAnimationFrame(() => { el.selectionStart = el.selectionEnd = s + 2 })
    }
    e.stopPropagation()
  }

  const lines = text.split('\n').length
  return (
    <div className="editor-overlay" onMouseDown={(e) => { if (e.target === e.currentTarget) onCancel() }}>
      <div className="editor" onKeyDown={onKey}>
        <div className="editor__header">
          <span className="editor__title">@edit {editor.title}</span>
          <span className="editor__meta">{lines} line{lines === 1 ? '' : 's'}</span>
        </div>
        {editor.hint && <div className="editor__hint">{editor.hint}</div>}
        <textarea
          ref={ref}
          className="editor__textarea"
          value={text}
          onChange={(e) => setText(e.target.value)}
          spellCheck={false}
          autoComplete="off"
          wrap="off"
        />
        <div className="editor__footer">
          <button className="editor__btn" onClick={() => onSave(text)}>[ Save  Ctrl+Enter ]</button>
          <button className="editor__btn editor__btn--dim" onClick={onCancel}>[ Cancel  Esc ]</button>
        </div>
      </div>
    </div>
  )
}
