import { useState, useCallback } from 'react'
import projects from '../../data/projects'
import './PortfolioPage.css'

const BIO = "I'm a passionate, skilled, conscious human being. I love working with language models. I care deeply about improving education, building community and protecting the world from the bad guys. I make art, food, and coding projects in my free time. Currently I'm working on a social media app called Agora."

export default function PortfolioPage({ onBack, onMenuSelect }) {
  const [expandedId, setExpandedId] = useState(null)

  const toggleProject = useCallback((id) => {
    onMenuSelect?.()
    setExpandedId(prev => prev === id ? null : id)
  }, [onMenuSelect])

  const handleBack = useCallback(() => {
    onMenuSelect?.()
    onBack()
  }, [onBack, onMenuSelect])

  return (
    <div className="portfolio">
      <div className="portfolio__container">

        {/* Back */}
        <button className="portfolio__back" onClick={handleBack}>
          &larr; Back
        </button>

        {/* Header */}
        <header className="portfolio__header">
          <h1 className="portfolio__name">ALEX HERMAN</h1>
          <div className="portfolio__rule" aria-hidden="true">
            ════════════════════════════════════════
          </div>
          <p className="portfolio__bio">{BIO}</p>
        </header>

        {/* Contact */}
        <div className="portfolio__contact">
          <span className="portfolio__contact-label" aria-hidden="true">&gt;</span>
          <span>SLO, CA</span>
          <span className="portfolio__sep">·</span>
          <a href="https://github.com/alexherman11" target="_blank" rel="noopener noreferrer">
            GitHub
          </a>
          <span className="portfolio__sep">·</span>
          <a href="https://linkedin.com/in/alex-herman04" target="_blank" rel="noopener noreferrer">
            LinkedIn
          </a>
          <span className="portfolio__sep">·</span>
          <a href="mailto:1wheelalex@gmail.com">
            1wheelalex@gmail.com
          </a>
        </div>

        {/* Projects */}
        <section className="portfolio__projects">
          <div className="portfolio__section-divider" aria-hidden="true">
            ┌── Projects ──────────────────────────┐
          </div>

          {projects.map(project => {
            const isExpanded = expandedId === project.id
            return (
              <div
                key={project.id}
                className={`project-card ${isExpanded ? 'project-card--expanded' : ''}`}
                role="button"
                tabIndex={0}
                onClick={() => toggleProject(project.id)}
                onKeyDown={e => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault()
                    toggleProject(project.id)
                  }
                }}
                aria-expanded={isExpanded}
                aria-label={project.name}
              >
                <div className="project-card__header">
                  <span className="project-card__prefix" aria-hidden="true">├──</span>
                  <h3 className="project-card__name">{project.name}</h3>
                  <span className="project-card__toggle" aria-hidden="true">
                    {isExpanded ? '▾' : '▸'}
                  </span>
                </div>
                <p className="project-card__tagline">{project.tagline}</p>

                {isExpanded && (
                  <div className="project-card__details">
                    <p className="project-card__description">{project.description}</p>
                    <div className="project-card__meta">
                      <span className="project-card__meta-item">
                        <span className="project-card__meta-label">Status:</span> {project.status}
                      </span>
                      <span className="project-card__meta-item">
                        <span className="project-card__meta-label">Role:</span> {project.role}
                      </span>
                    </div>
                    {project.links.length > 0 && (
                      <div className="project-card__links">
                        {project.links.map((link, i) => (
                          <a
                            key={i}
                            href={link.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="project-card__link"
                            onClick={e => e.stopPropagation()}
                          >
                            &gt; {link.label}
                          </a>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })}

          <div className="portfolio__section-divider" aria-hidden="true">
            └───────────────────────────────────────┘
          </div>
        </section>

        {/* Footer */}
        <footer className="portfolio__footer">
          <a
            href="/pdf/Resume%20(current).pdf"
            target="_blank"
            rel="noopener noreferrer"
            className="portfolio__resume-link"
            onClick={e => e.stopPropagation()}
          >
            &gt; Download Resume (PDF)
          </a>
          <p className="portfolio__email">1wheelalex@gmail.com</p>
        </footer>

      </div>
    </div>
  )
}
