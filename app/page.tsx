import Navbar from '@/components/Navbar';
import Projects from '@/components/Projects';
import { skills } from '@/data/projects';

// @ts-ignore
function SectionHeader({ label, title }) {
  return (
    <div className="section-header">
      <div>
        <p className="section-label">{label}</p>
        <h2 className="section-title">{title}</h2>
      </div>
      <div className="section-line"></div>
    </div>
  );
}

export default function Home() {
  return (
    <div className="app">
      <div className="grid-bg"></div>
      <div className="glow-orb primary"></div>
      <div className="glow-orb secondary"></div>

      <Navbar />

      <section className="hero">
        <div className="container">
          <div className="hero-content">
            <h1 className="hero-name">
              <span className="gradient">Ali Ahmad</span>
            </h1>

            <p className="hero-title">
              I enjoy making software and solving difficult technical problems. This portfolio shows my work, the decisions behind it and the results.
            </p>

            <div className="hero-actions">
              <a href="#projects" className="btn btn-primary">
                View My Work
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M7 17L17 7M17 7H7M17 7V17" />
                </svg>
              </a>
              <a href="https://github.com/AliAhmad-M" target="_blank" rel="noopener noreferrer" className="btn btn-secondary">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
                </svg>
                Visit My GitHub
              </a>
            </div>

            <div className="hero-metrics">
              <div className="metric">
                <span className="metric-value">3.78<span>/4.00</span></span>
                <span className="metric-label">CGPA at NUST</span>
              </div>
              <div className="metric">
                <span className="metric-value">11</span>
                <span className="metric-label">Major Projects</span>
              </div>
              <div className="metric">
                <span className="metric-value">7</span>
                <span className="metric-label">Programming Languages</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="about">
        <div className="container">
          <SectionHeader label="01 / About" title="Solving problems with creativity" />

          <div className="about-content">
            <div className="about-text">
              <p>
                I&apos;m a <strong>student of Computer Science at the National University of Sciences and Technology (NUST) H-12, Islamabad</strong> with a strong passion for programming.
              </p>
              <p>
                I've worked across multiple fields including full-stack web development, artificial intelligence and game development including developing custom game engines from scratch.
              </p>
              <p>
                I enjoy challenging myself by solving tough problems to improve my skills. Every project is an opportunity to learn something new and push my boundaries.
              </p>
            </div>

            <div className="about-visual">
              <div className="terminal">
                <div className="terminal-header">
                  <span className="terminal-dot red"></span>
                  <span className="terminal-dot yellow"></span>
                  <span className="terminal-dot green"></span>
                  <span className="terminal-title">~/ali-ahmad</span>
                </div>
                <div className="terminal-body">
                  <div className="terminal-line">
                    <span className="line-prompt">$</span>
                    <span className="line-content"><span className="cmd">whoami</span></span>
                  </div>
                  <div className="terminal-line">
                    <span className="line-prompt"></span>
                    <span className="line-content">Software developer, computer scientist</span>
                  </div>
                  <br />
                  <div className="terminal-line">
                    <span className="line-prompt">$</span>
                    <span className="line-content"><span className="cmd">cat</span> <span className="string">interests.txt</span></span>
                  </div>
                  <div className="terminal-line">
                    <span className="line-prompt"></span>
                    <span className="line-content">Full-stack web development, AI, gamedev</span>
                  </div>
                  <br />
                  <div className="terminal-line">
                    <span className="line-prompt">$</span>
                    <span className="line-content"><span className="cmd">echo</span> <span className="string">$STATUS</span></span>
                  </div>
                  <div className="terminal-line">
                    <span className="line-prompt"></span>
                    <span className="line-content" style={{ color: 'var(--accent)' }}>Ready to develop</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="education">
        <div className="container">
          <SectionHeader label="02 / Education" title="Academic Background" />

          <div className="education-timeline">
            <div className="edu-item">
              <span className="edu-date">Sep 2023 - May 2027</span>
              <h3 className="edu-degree">Bachelor of Science in Computer Science</h3>
              <p className="edu-school">National University of Sciences and Technology (NUST)</p>
              <p className="edu-location">Islamabad, Pakistan | CGPA: 3.78/4.00</p>
            </div>

            <div className="edu-item">
              <span className="edu-date">Sep 2018 - Jun 2023</span>
              <h3 className="edu-degree">Cambridge International Education O/A Levels</h3>
              <p className="edu-school">Bloomfield Hall School</p>
              <p className="edu-location">Bahawalpur, Pakistan</p>
            </div>
          </div>
        </div>
      </section>

      <section id="projects">
        <div className="container">
          <SectionHeader label="03 / Work" title="My Top Projects" />
          <Projects />
        </div>
      </section>

      <section id="skills">
        <div className="container">
          <SectionHeader label="04 / Skills" title="Technologies & Tools" />

          <div className="skills-container">
            {Object.entries(skills).map(([category, items]) => (
              <div className="skill-group" key={category}>
                <h3>{category}</h3>
                <div className="skill-tags">
                  {items.map((skill) => (
                    <span className="skill-tag" key={skill}>{skill}</span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="contact">
        <div className="container">
          <SectionHeader label="05 / Contact" title="Let's Connect" />

          <div className="contact-wrapper">
            <p>
              I&apos;m always interested in hearing about new opportunities,
              collaborations, or just chatting about technology in general.
            </p>

            <a href="mailto:aliahmadbhs@gmail.com" className="contact-email">
              aliahmadbhs@gmail.com
            </a>

            <div className="contact-links">
              <a href="https://linkedin.com/in/aliahmadm" target="_blank" rel="noopener noreferrer" className="contact-link">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                </svg>
                LinkedIn
              </a>
              <a href="tel:+92-306-016-7493" className="contact-link">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 16.92z" />
                </svg>
                Phone #
              </a>
            </div>
          </div>
        </div>
      </section>

      <footer>
        <div className="container">
          <p>Designed &amp; Built by <span className="accent">Ali Ahmad</span></p>
          <p>2026</p>
        </div>
      </footer>
    </div>
  );
}