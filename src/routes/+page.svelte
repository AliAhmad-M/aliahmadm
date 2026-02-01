<script>
	import { onMount } from 'svelte';
	
	let scrolled = $state(false);
	
	onMount(() => {
		const handleScroll = () => {
			scrolled = window.scrollY > 50;
		};
		window.addEventListener('scroll', handleScroll);
		return () => window.removeEventListener('scroll', handleScroll);
	});
	
	const projects = [
		{
			number: '01',
			name: 'Star Platinum Engine',
			desc: 'A high-performance 2D game engine built from scratch in C++, featuring a custom ECS architecture with a strong focus on optimizing time complexities',
			stack: ['C++17', 'SDL2', 'ECS', 'Linear Algebra'],
			features: [
				'Entity Component System using paginated sparse sets',
				'O(1) entity-component operations',
				'O(n) sprite rendering and sorting',
				'O(n + m) sweep-and-prune collision detection',
				'Animations, tilemaps, cameras, collisions, physics, etc.',
			],
			link: 'https://github.com/AliAhmad-M/StarPlatinumEngine'
		},
		{
            number: '02',
                name: 'Kites Blogs Platform',
                desc: 'A modern, full-stack blog and discussion platform with secure authentication, markdown support, and responsive design built as a web technologies university project.',
                stack: ['SvelteKit', 'TypeScript', 'MongoDB', 'Prisma'],
                features: [
                    'Email-based auth with session management',
                    'Password hashing & secure sessions',
                    'Sveltekit for frontend and routing',
                    'MongoDB with Prisma ORM for database',
                    'Markdown-based content creation',
                    'Fully responsive interface'
                ],
                link: 'https://github.com/AliAhmad-M/Kites',
                site: 'https://kites-forums.vercel.app'
		},
		{
			number: '03',
			name: '2D Physics Engine',
			desc: 'A physics simulation engine implementing rigid body dynamics, collision detection algorithms, and impulse-based physics solving for both linear and angular forces',
			stack: ['C#', 'Raylib', 'OOP', 'Linear Algebra'],
			features: [
				'Rigid body dynamics with rotation',
				'SAT collision detection',
				'Impulse-based response system',
				'Real-time visualization'
			],
			link: 'https://github.com/AliAhmad-M/Raylib-Physics-Engine'
		}
	];
	
	const skills = {
		'Languages': ['C/C++', 'C#', 'Python', 'TypeScript', 'JavaScript', 'SQL', 'Java'],
		'Frontend': ['SvelteKit', 'React', 'HTML/CSS', 'Node.js'],
		'Backend': ['MongoDB', 'Prisma', 'Express.js', 'ASP.NET', 'Flask'],
		'Game Dev': ['Godot', 'Unity', 'SDL2', 'OpenGL',  'Raylib'],
		'Dev Tools': ['Git', 'Bash', 'VS Code', 'JetBrains', 'Linux'],
		'ML/Data': ['NumPy', 'pandas', 'Matplotlib', 'Scikit-Learn', 'YOLO']
	};
</script>

<div class="app">
	<div class="grid-bg"></div>
	<div class="glow-orb primary"></div>
	<div class="glow-orb secondary"></div>
	
	<nav class:scrolled>
		<div class="container">
			<a href="/" class="logo">
				<span class="logo-icon">AA</span>
				Ali Ahmad
			</a>
			<ul class="nav-links">
				<li><a href="#about">About</a></li>
				<li><a href="#education">Education</a></li>
				<li><a href="#projects">Work</a></li>
				<li><a href="#skills">Skills</a></li>
			</ul>
			<a href="#contact" class="nav-cta">Get in Touch</a>
		</div>
	</nav>
	
	<section class="hero">
		<div class="container">
			<div class="hero-content">	
				<h1 class="hero-name">
					<span class="gradient">Ali Ahmad</span>
				</h1>
				
				<p class="hero-title">
					Software Engineer crafting <strong>game engines</strong>, 
					<strong>web applications</strong>, and performant systems.
				</p>
				
				<div class="hero-actions">
					<a href="#projects" class="btn btn-primary">
						View My Work
						<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
							<path d="M7 17L17 7M17 7H7M17 7V17"/>
						</svg>
					</a>
					<a href="https://github.com/AliAhmad-M" target="_blank" rel="noopener" class="btn btn-secondary">
						<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
							<path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/>
						</svg>
						Visit My GitHub
					</a>
				</div>
				
				<div class="hero-metrics">
					<div class="metric">
						<span class="metric-value">3.81<span>/4.00</span></span>
						<span class="metric-label">CGPA at NUST</span>
					</div>
					<div class="metric">
						<span class="metric-value">3<span>+</span></span>
						<span class="metric-label">Major Projects</span>
					</div>
					<div class="metric">
						<span class="metric-value">7<span>+</span></span>
						<span class="metric-label">Languages</span>
					</div>
				</div>
			</div>
		</div>
	</section>
	
	<section id="about">
		<div class="container">
			<div class="section-header">
				<div>
					<p class="section-label">01 / About</p>
					<h2 class="section-title">Building at the<br/>intersection of systems<br/>and creativity</h2>
				</div>
				<div class="section-line"></div>
			</div>
			
			<div class="about-content">
				<div class="about-text">
					<p>
						I'm a <strong>student of Computer Science at NUST, H-12</strong> with a strong passion for 
						understanding how programs work at a fundamental level.
					</p>
					<p> 
						Whether it be implementing <span class="highlight">game engines</span> 
						from scratch, creating <span class="highlight">full-stack web apps</span> or even developing
						projects in <span class="highlight">assembly language</span>, I always look for new ways to 
						challenge myself 
					</p>
					<p>
						My journey started with game development, where I later discovered the joy of building 
						<strong>engines and tools</strong> rather than just using them. My time in university led
						me to expand my knowledge in other fields, mainly full stack web development 
					</p>
					<p>
						As I mentioned earlier, I'm interested in challenging myself with fun and difficult projects 
						to expand my experience and knowledge
					</p>
				</div>
				
				<div class="about-visual">
					<div class="terminal">
						<div class="terminal-header">
							<span class="terminal-dot red"></span>
							<span class="terminal-dot yellow"></span>
							<span class="terminal-dot green"></span>
							<span class="terminal-title">~/ali-ahmad</span>
						</div>
						<div class="terminal-body">
							<div class="terminal-line">
								<span class="line-prompt">$</span>
								<span class="line-content"><span class="cmd">whoami</span></span>
							</div>
							<div class="terminal-line">
								<span class="line-prompt"></span>
								<span class="line-content">Software Developer & CS Student</span>
							</div>
							<br>
							<div class="terminal-line">
								<span class="line-prompt">$</span>
								<span class="line-content"><span class="cmd">cat</span> <span class="string">interests.txt</span></span>
							</div>
							<div class="terminal-line">
								<span class="line-prompt"></span>
								<span class="line-content">Game Development, Physics Simulations</span>
							</div>
							<div class="terminal-line">
								<span class="line-prompt"></span>
								<span class="line-content">Full-Stack Web, Computer Graphics, ML</span>
							</div>
							<br>
							<div class="terminal-line">
								<span class="line-prompt">$</span>
								<span class="line-content"><span class="cmd">echo</span> <span class="string">$STATUS</span></span>
							</div>
							<div class="terminal-line">
								<span class="line-prompt"></span>
								<span class="line-content" style="color: var(--accent);">Ready to develop</span>
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	</section>
	
	<section id="education">
		<div class="container">
			<div class="section-header">
				<div>
					<p class="section-label">02 / Education</p>
					<h2 class="section-title">Academic Background</h2>
				</div>
				<div class="section-line"></div>
			</div>
			
			<div class="education-timeline">
				<div class="edu-item">
					<span class="edu-date">Sep 2023 - May 2027</span>
					<h3 class="edu-degree">Bachelor of Science in Computer Science</h3>
					<p class="edu-school">National University of Sciences and Technology (NUST)</p>
					<p class="edu-location">Islamabad, Pakistan | CGPA: 3.81/4.00</p>
				</div>
				
				<div class="edu-item">
					<span class="edu-date">Sep 2018 - Jun 2023</span>
					<h3 class="edu-degree">Cambridge International Education O/A Levels</h3>
					<p class="edu-school">Bloomfield Hall School</p>
					<p class="edu-location">Bahawalpur, Pakistan</p>
				</div>
			</div>
		</div>
	</section>
	
	<section id="projects">
		<div class="container">
			<div class="section-header">
				<div>
					<p class="section-label">03 / Work</p>
					<h2 class="section-title">My Top Projects</h2>
				</div>
				<div class="section-line"></div>
			</div>
			
			<div class="projects-list">
				{#each projects as project}
					<article class="project-card">
						<div class="project-meta">
							<span class="project-number">PROJECT {project.number}</span>
							<h3 class="project-name">{project.name}</h3>
							<p class="project-desc">{project.desc}</p>
							<div class="project-stack">
								{#each project.stack as tech}
									<span class="stack-tag">{tech}</span>
								{/each}
							</div>
							<a href={project.link} target="_blank" rel="noopener" class="project-link">
								View on GitHub
								<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
									<path d="M7 17L17 7M17 7H7M17 7V17"/>
								</svg>
							</a>

                            {#if project.site}
                                <a href={project.site} target="_blank" rel="noopener" class="project-link live-link">
                                    Live Site
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                        <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
                                        <polyline points="15 3 21 3 21 9"></polyline>
                                        <line x1="10" y1="14" x2="21" y2="3"></line>
                                    </svg>
                                </a>
                            {/if}
						</div>
						<div class="project-features">
							<h4>Key Features</h4>
							<ul class="feature-list">
								{#each project.features as feature}
									<li>{feature}</li>
								{/each}
							</ul>
						</div>
					</article>
				{/each}
			</div>
		</div>
	</section>
	
	<section id="skills">
		<div class="container">
			<div class="section-header">
				<div>
					<p class="section-label">04 / Skills</p>
					<h2 class="section-title">Technologies & Tools</h2>
				</div>
				<div class="section-line"></div>
			</div>
			
			<div class="skills-container">
				{#each Object.entries(skills) as [category, items]}
					<div class="skill-group">
						<h3>{category}</h3>
						<div class="skill-tags">
							{#each items as skill}
								<span class="skill-tag">{skill}</span>
							{/each}
						</div>
					</div>
				{/each}
			</div>
		</div>
	</section>
	
	<section id="contact">
		<div class="container">
			<div class="section-header">
				<div>
					<p class="section-label">05 / Contact</p>
					<h2 class="section-title">Let's Connect</h2>
				</div>
				<div class="section-line"></div>
			</div>
			
			<div class="contact-wrapper">
				<p>
					I'm always interested in hearing about new opportunities, 
					collaborations, or just chatting about technology in general.
				</p>
				
				<a href="mailto:aliahmadbhs@gmail.com" class="contact-email">
					aliahmadbhs@gmail.com
				</a>
				
				<div class="contact-links">
					<a href="https://linkedin.com/in/aliahmadm" target="_blank" rel="noopener" class="contact-link">
						<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
							<path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
						</svg>
						LinkedIn
					</a>
					<a href="tel:+92-306-016-7493" class="contact-link">
						<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
							<path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 16.92z"/>
						</svg>
						Phone
					</a>
				</div>
			</div>
		</div>
	</section>
	
	<footer>
		<div class="container">
			<p>Designed & Built by <span class="accent">Ali Ahmad</span></p>
			<p>2026</p>
		</div>
	</footer>
</div>
