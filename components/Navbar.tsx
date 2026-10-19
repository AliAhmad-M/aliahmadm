'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <nav className={scrolled ? 'scrolled' : ''}>
      <div className="container">
        <Link href="/" className="logo">
          <span className="logo-icon">AA</span>
          Ali Ahmad
        </Link>
        <ul className="nav-links">
          <li><a href="#about">About</a></li>
          <li><a href="#education">Education</a></li>
          <li><a href="#projects">Work</a></li>
          <li><a href="#skills">Skills</a></li>
        </ul>
        <a href="#contact" className="nav-cta">Get in Touch</a>
      </div>
    </nav>
  );
}