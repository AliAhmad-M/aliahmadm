'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import './Navbar.css';

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
          ./Ali-Ahmad
        </Link>
        <ul className="nav-links">
          <li><Link href="/#about">About</Link></li>
          <li><Link href="/#education">Education</Link></li>
          <li><Link href="/#projects">Work</Link></li>
          <li><Link href="/#skills">Skills</Link></li>
          <li><Link href="/blog">Blog</Link></li>
        </ul>
        <Link href="/#contact" className="nav-cta">Get in Touch</Link>
      </div>
    </nav>
  );
}