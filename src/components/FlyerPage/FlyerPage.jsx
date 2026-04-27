import { useState, useMemo, useCallback } from 'react'
import calPolyMajors from '../../data/calPolyMajors'
import './FlyerPage.css'

export default function FlyerPage() {
  const [major, setMajor] = useState('')
  const [questions, setQuestions] = useState('')
  const [contact, setContact] = useState('')
  const [status, setStatus] = useState({ kind: 'idle', msg: '' })
  const [submitting, setSubmitting] = useState(false)

  const majorOptions = useMemo(
    () => calPolyMajors.map((m) => `${m.code} — ${m.name}`),
    []
  )

  const handleSubmit = useCallback(
    async (e) => {
      e.preventDefault()
      if (submitting) return

      // All fields are optional, but require at least one to avoid empty noise
      if (!major.trim() && !questions.trim() && !contact.trim()) {
        setStatus({
          kind: 'err',
          msg: 'Please fill in at least one field before transmitting.',
        })
        return
      }

      setSubmitting(true)
      setStatus({ kind: 'idle', msg: '' })

      try {
        const res = await fetch('/api/flyer/submit', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            major: major.trim().slice(0, 200),
            questions: questions.trim().slice(0, 4000),
            contact: contact.trim().slice(0, 500),
          }),
        })

        if (!res.ok) {
          const body = await res.json().catch(() => ({}))
          throw new Error(body.error || `HTTP ${res.status}`)
        }

        setStatus({
          kind: 'ok',
          msg: '> TRANSMISSION RECEIVED. See you Thursday on the lawn.',
        })
        setMajor('')
        setQuestions('')
        setContact('')
      } catch (err) {
        setStatus({
          kind: 'err',
          msg: `Transmission failed: ${err.message}. Try again, or just show up Thursday.`,
        })
      } finally {
        setSubmitting(false)
      }
    },
    [major, questions, contact, submitting]
  )

  return (
    <div className="flyer">
      <div className="flyer__inner">
        <header className="flyer__header">
          <h1 className="flyer__name">INTEREST FORM</h1>
          <div className="flyer__rule" aria-hidden="true">
            ════════════════════════════════
          </div>
          <p className="flyer__tagline">let's talk about AI</p>
        </header>

        <section className="flyer__message">
          <p>Hi! I'm Alex Herman and I care a lot about the future.</p>
          <p>
            I have been following developments in AI closely over the past
            three years, and I have seen AI come from something that could
            barely write a paragraph, to something that could help me design
            the flyer you just saw.
          </p>
          <p>
            Despite the many technological advancements I see it enabling,
            I see multiple very dangerous futures just around the corner.
            The risks of <strong>rogue AI</strong>,{' '}
            <strong>gradual disempowerment</strong>, and{' '}
            <strong>malicious use</strong> for things like chemical weapons
            are <strong>VERY REAL</strong>, and I do not intend to sit by
            while the people in power do nothing — bought out by corporations
            set to make billions removing hundreds of thousands of workers
            from their companies.
          </p>
          <p>
            If you too are worried about AI, your job, or our shared future
            as humans of this earth, I look forward to seeing you{' '}
            <strong>this Thursday</strong>. I will be sitting on the lawn
            with research papers and drinks.
          </p>
          <p>I hope to see you there!</p>
        </section>

        <div className="flyer__meta">
          <span className="flyer__meta-line">
            <span className="flyer__meta-label">when </span>· Thursday
          </span>
          <span className="flyer__meta-line">
            <span className="flyer__meta-label">where</span> · the lawn
          </span>
          <span className="flyer__meta-line">
            <span className="flyer__meta-label">what </span>· papers, drinks,
            real talk
          </span>
        </div>

        <form className="flyer__form" onSubmit={handleSubmit} noValidate>
          <h2 className="flyer__form-title">
            <span className="flyer__cursor">&gt;</span> leave a message
          </h2>

          <div className="flyer__field">
            <label className="flyer__label" htmlFor="flyer-major">
              Major <span className="flyer__optional">(optional)</span>
            </label>
            <input
              id="flyer-major"
              className="flyer__input"
              type="text"
              list="cal-poly-majors"
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="characters"
              spellCheck={false}
              placeholder="CSC, CPE, ME ..."
              value={major}
              onChange={(e) => setMajor(e.target.value)}
              maxLength={200}
              inputMode="text"
            />
            <datalist id="cal-poly-majors">
              {majorOptions.map((opt) => (
                <option key={opt} value={opt} />
              ))}
            </datalist>
            <p className="flyer__hint">
              Type a Cal Poly code or pick from the list.
            </p>
          </div>

          <div className="flyer__field">
            <label className="flyer__label" htmlFor="flyer-questions">
              Questions for me{' '}
              <span className="flyer__optional">(optional)</span>
            </label>
            <textarea
              id="flyer-questions"
              className="flyer__textarea"
              placeholder="Anything you want me to research and bring a paper on..."
              value={questions}
              onChange={(e) => setQuestions(e.target.value)}
              maxLength={4000}
              rows={5}
            />
            <p className="flyer__hint">
              I'll bring a good paper for us to talk about.
            </p>
          </div>

          <div className="flyer__field">
            <label className="flyer__label" htmlFor="flyer-contact">
              Email, Discord, or phone{' '}
              <span className="flyer__optional">(optional)</span>
            </label>
            <input
              id="flyer-contact"
              className="flyer__input"
              type="text"
              autoComplete="off"
              spellCheck={false}
              placeholder="alex@example.com  ·  @handle  ·  555-..."
              value={contact}
              onChange={(e) => setContact(e.target.value)}
              maxLength={500}
              inputMode="email"
            />
            <p className="flyer__hint">
              Subtle, unobtrusive notes about future events. Nothing else.
            </p>
          </div>

          <button
            type="submit"
            className="flyer__submit"
            disabled={submitting}
          >
            {submitting ? 'transmitting…' : '[ transmit ]'}
          </button>

          {status.kind !== 'idle' && (
            <div
              className={`flyer__status flyer__status--${status.kind}`}
              role={status.kind === 'err' ? 'alert' : 'status'}
            >
              {status.msg}
            </div>
          )}
        </form>

        <p className="flyer__footer">
          alexherman.xyz · &nbsp;<a href="/">[ home ]</a>
        </p>
      </div>
    </div>
  )
}
