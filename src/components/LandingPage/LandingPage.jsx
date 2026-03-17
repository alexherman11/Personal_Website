import { useCallback, useEffect, useRef } from 'react'
import './LandingPage.css'

export default function LandingPage({ onChoosePortfolio, onChooseGame, onMenuSelect }) {
  const portfolioRef = useRef(null)
  const gameRef = useRef(null)

  const handlePortfolio = useCallback(() => {
    onMenuSelect?.()
    onChoosePortfolio()
  }, [onChoosePortfolio, onMenuSelect])

  const handleGame = useCallback(() => {
    onMenuSelect?.()
    onChooseGame()
  }, [onChooseGame, onMenuSelect])

  // Arrow key navigation between the two cards
  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
        e.preventDefault()
        const active = document.activeElement
        if (active === portfolioRef.current) {
          gameRef.current?.focus()
        } else {
          portfolioRef.current?.focus()
        }
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  useEffect(() => {
    portfolioRef.current?.focus()
  }, [])

  return (
    <div className="landing">
      <div className="landing__inner">
        <header className="landing__header">
          <h1 className="landing__name">ALEX HERMAN</h1>
          <div className="landing__rule" aria-hidden="true">
            ┌──────────────────────────────────┐
          </div>
          <p className="landing__tagline">
            Engineer · Builder · Explorer
          </p>
        </header>

        <div className="landing__cards">
          <button
            ref={portfolioRef}
            className="landing__card"
            onClick={handlePortfolio}
            aria-label="View My Portfolio"
          >
            <span className="landing__card-border-top" aria-hidden="true">┌───────────────────────────┐</span>
            <div className="landing__card-body">
              <h2 className="landing__card-title">&gt; Portfolio</h2>
              <p className="landing__card-desc">
                Projects, skills, and how to reach me.
              </p>
            </div>
            <span className="landing__card-border-bot" aria-hidden="true">└───────────────────────────┘</span>
          </button>

          <button
            ref={gameRef}
            className="landing__card"
            onClick={handleGame}
            aria-label="Enter The Depths"
          >
            <span className="landing__card-border-top" aria-hidden="true">┌───────────────────────────┐</span>
            <div className="landing__card-body">
              <h2 className="landing__card-title">&gt; The Depths</h2>
              <p className="landing__card-desc">
                Play a text adventure and discover who I really am.
              </p>
            </div>
            <span className="landing__card-border-bot" aria-hidden="true">└───────────────────────────┘</span>
          </button>
        </div>
      </div>
    </div>
  )
}
