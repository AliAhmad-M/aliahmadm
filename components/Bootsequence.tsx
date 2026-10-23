'use client';

import { useEffect, useState } from 'react';

const LINES = [
  'NOVA ][',
  '',
  'NOVA-DOS VERSION 3.3   (C) 2026 ALI AHMAD',
  'MEMORY CHECK............OK',
  'MOUNTING DISK 1,D1......OK',
  'LOADING PORTFOLIO.DAT...',
  '',
  ']RUN PORTFOLIO',
];

export default function BootSequence() {
  const [shown, setShown] = useState(0);
  const [done, setDone] = useState(false);

  useEffect(() => {
    try {
      if (sessionStorage.getItem('booted')) {
        setDone(true);
        return;
      }
    } catch {}

    const finish = () => {
      try {
        sessionStorage.setItem('booted', '1');
      } catch {}
      setDone(true);
    };

    const tick = setInterval(() => {
      setShown((n) => {
        if (n >= LINES.length) {
          clearInterval(tick);
          setTimeout(finish, 500);
          return n;
        }
        return n + 1;
      });
    }, 330);

    window.addEventListener('keydown', finish);

    return () => {
      clearInterval(tick);
      window.removeEventListener('keydown', finish);
    };
  }, []);

  if (done) return null;

  return (
    <div className="boot" onClick={() => setDone(true)}>
      {LINES.slice(0, shown).map((line, i) => (
        <div className="boot-line" key={i}>
          {line}
        </div>
      ))}
      <span className="cursor"></span>
      <div className="boot-hint">CLICK OR PRESS ANY KEY TO SKIP</div>
    </div>
  );
}