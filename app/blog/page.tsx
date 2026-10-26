
import './blog.css';

import Link from 'next/link';
import { Suspense } from 'react';

import { blogs } from '@/data/blog';
import BlogFilters from '@/components/blog/BlogFilters';

export const metadata = {
  title: 'Blog - Ali Ahmad',
  description: 'Technical notes on the projects that I have worked on.',
};

function SectionHeader({
  label,
  title,
}: {
  label: string;
  title: string;
}) {
  return (
    <div className="section-header">
      <div>
        <p className="section-label">{label}</p>
        <h2 className="section-title">{title}</h2>
      </div>
      <div className="section-line" />
    </div>
  );
}

export default function BlogPage() {
  return (
    <main className="blog-page">
      <section>
        <div className="container">
          <Link href="/" className="post-back">
            return to home
          </Link>

          <SectionHeader
            label="06 / Blog"
            title="Notes & Experiments"
          />

          <p className="blog-intro">
            Posts about things I&apos;m building, breaking, or
            reading, mostly an excuse to think in public. I write
            about my experiences and go over the thought process
            on my projects.
          </p>
        </div>
      </section>

      <section className="blog-list-section">
        <div className="container">
          <Suspense fallback={<p>Loading...</p>}>
            <BlogFilters posts={blogs} />
          </Suspense>
        </div>
      </section>
    </main>
  );
}
