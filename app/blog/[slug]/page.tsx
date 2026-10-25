import '../blog.css';

import Link from 'next/link';
import { notFound } from 'next/navigation';

import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

import { blogs, getBlogBySlug } from '@/data/blog';
import BlogCover from '@/components/blog/BlogCover';

export const instant = false;

type Params = { slug: string };

export function generateStaticParams() {
  return blogs.map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}) {
  const { slug } = await params;
  const post = getBlogBySlug(slug);
  if (!post) return { title: 'Post not found' };
  return {
    title: `${post.title} - Ali Ahmad`,
    description: post.excerpt,
  };
}

export default async function BlogPostPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { slug } = await params;
  const post = getBlogBySlug(slug);
  if (!post) notFound();

  return (
    <main className="post-page">
      <div className="container">
        <Link href="/blog" className="post-back">
          back to all blogs
        </Link>
        <div className="post-meta">
          <div className="blog-card-tags">
            {post.tags.map((tag) => (
              <span className="blog-tag" key={tag}>
                {tag}
              </span>
            ))}
          </div>
        </div>

        <h1 className="post-title">{post.title}</h1>

        <div className="post-cover">
          <BlogCover
            src={post.cover}
            alt={post.title}
          />
        </div>

        <article className="post-body">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>
            {post.markdown}
          </ReactMarkdown>
        </article>
      </div>
    </main>
  );
}