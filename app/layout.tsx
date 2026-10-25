import './globals.css';

import Navbar from '@/components/Navbar';
import BootSequence from '@/components/Bootsequence';

export const metadata = {
  title: 'Ali Ahmad | Software Developer',
  description: 'Portfolio of Ali Ahmad',
};

export default function RootLayout({ children }: LayoutProps<'/'>) {
  return (
    <html lang="en">
      <body>
        <div className="app">
          <BootSequence />
          <div className="grid-bg"></div>
          <div className="glow-orb primary"></div>
          <div className="glow-orb secondary"></div>

          <Navbar />

          {children}

          <footer>
            <div className="container">
              <p>
                Designed &amp; Built by{' '}
                <span className="accent">Ali Ahmad</span>
              </p>
              <p>2026</p>
            </div>
          </footer>
        </div>
      </body>
    </html>
  );
}