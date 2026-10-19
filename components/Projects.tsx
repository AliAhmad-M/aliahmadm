'use client';

import { useState } from 'react';
import { projectCategories } from '@/data/projects';

const ArrowIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M7 17L17 7M17 7H7M17 7V17" />
  </svg>
);

export default function Projects() {
  const [activeTab, setActiveTab] = useState('game-dev');

  return (
    <>
      <div className="project-tabs">
        {Object.entries(projectCategories).map(([key, category]) => (
          <button
            key={key}
            className={`tab-btn ${activeTab === key ? 'active' : ''}`}
            onClick={() => setActiveTab(key)}
          >
            {/* @ts-ignore */}
            {category.label}
          </button>
        ))}
      </div>

      <div className="projects-list">
        {/* @ts-ignore */}
        {projectCategories[activeTab].projects.map((project) => (
          <article className="project-card" key={`${activeTab}-${project.name}`}>
            <div className="project-meta">
              <span className="project-number">PROJECT {project.number}</span>
              <h3 className="project-name">{project.name}</h3>
              <p className="project-desc">{project.desc}</p>
              <div className="project-stack">
                {/* @ts-ignore */}
                {project.stack.map((tech) => (
                  <span className="stack-tag" key={tech}>{tech}</span>
                ))}
              </div>

              <div className="project-links">
                {project.link !== '#' && (
                  <a href={project.link} target="_blank" rel="noopener noreferrer" className="project-link">
                    View on GitHub <ArrowIcon />
                  </a>
                )}
                {project.site && (
                  <a href={project.site} target="_blank" rel="noopener noreferrer" className="project-link live-link">
                    Live Site
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                      <polyline points="15 3 21 3 21 9" />
                      <line x1="10" y1="14" x2="21" y2="3" />
                    </svg>
                  </a>
                )}
              </div>
            </div>

            <div className="project-features">
              <h4>Key Features</h4>
              <ul className="feature-list">
                {/* @ts-ignore */}
                {project.features.map((feature) => (
                  <li key={feature}>{feature}</li>
                ))}
              </ul>
            </div>
          </article>
        ))}
      </div>
    </>
  );
}