import './blog.css';

import Link from 'next/link';

import { blogs } from '@/data/blog';
import BlogCover from '@/components/blog/BlogCover';

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

export const metadata = {
  title: 'Blog - Ali Ahmad',
  description: 'Technical notes on the projects that I have worked on.',
};

export default function BlogPage() {
  return (
    <main className="blog-page">
      <section>
        <div className="container">
          <Link href="/" className="post-back">
            return to home
          </Link>

          <SectionHeader label="06 / Blog" title="Notes & Experiments" />
          <p className="blog-intro">
            Posts about things I&apos;m building, breaking, or
            reading, mostly an excuse to think in public. I write 
            about my experiences and go over the thought process on my projects.
          </p>
        </div>
      </section>

      <section className="blog-list-section">
        <div className="container">
          <div className="blog-grid">
            {blogs.map((post) => (
              <Link
                key={post.slug}
                href={`/blog/${post.slug}`}
                className="blog-card"
              >
                <div className="blog-card-cover">
                    <BlogCover
                        src={post.cover}
                        alt={post.title}
                    />
                </div>
                <div className="blog-card-body">
                  <h2 className="blog-card-title">{post.title}</h2>
                  <p className="blog-card-excerpt">{post.excerpt}</p>
                  <div className="blog-card-tags">
                    {post.tags.map((tag) => (
                      <span className="blog-tag" key={tag}>
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}