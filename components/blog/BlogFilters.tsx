
'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';

import BlogCover from '@/components/blog/BlogCover';
import { blogs } from '@/data/blog';

type BlogPost = (typeof blogs)[number];

export default function BlogFilters({
  posts,
}: {
  posts: BlogPost[];
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [isOpen, setIsOpen] = useState(false);
  const filterRef = useRef<HTMLDivElement>(null);

  const selectedTags = searchParams.getAll('tag');

  const allTags = Array.from(
    new Set(posts.flatMap((post) => post.tags))
  ).sort((a, b) => a.localeCompare(b));

  const filteredPosts =
    selectedTags.length === 0
      ? posts
      : posts.filter((post) =>
          selectedTags.some((tag) => post.tags.includes(tag))
        );

  useEffect(() => {
    function handlePointerDown(event: PointerEvent) {
      if (
        filterRef.current &&
        !filterRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    }

    document.addEventListener('pointerdown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  function updateTags(tags: string[]) {
    const params = new URLSearchParams(searchParams.toString());
    params.delete('tag');

    tags.forEach((tag) => params.append('tag', tag));

    const query = params.toString();

    router.push(query ? `${pathname}?${query}` : pathname, {
      scroll: false,
    });
  }

  function toggleTag(tag: string) {
    const nextTags = selectedTags.includes(tag)
      ? selectedTags.filter((item) => item !== tag)
      : [...selectedTags, tag];

    updateTags(nextTags);
  }

  function clearFilters() {
    updateTags([]);
  }

  return (
    <>
      <div className="blog-toolbar">
        <div className="blog-filter-wrapper" ref={filterRef}>
          <button
            type="button"
            className={`blog-filter-trigger${isOpen ? ' is-open' : ''}${
              selectedTags.length > 0 ? ' has-filters' : ''
            }`}
            onClick={() => setIsOpen((open) => !open)}
            aria-expanded={isOpen}
            aria-controls="blog-filter-panel"
            aria-label={
              selectedTags.length > 0
                ? `Filter posts, ${selectedTags.length} active`
                : 'Filter posts by tag'
            }
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.7"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M4 7h16" />
              <path d="M7 12h10" />
              <path d="M10 17h4" />
            </svg>

            <span>Filter</span>

            {selectedTags.length > 0 && (
              <span className="blog-filter-badge">
                {selectedTags.length}
              </span>
            )}
          </button>

          {isOpen && (
            <div
              id="blog-filter-panel"
              className="blog-filter-panel"
            >
              <div className="blog-filter-panel-header">
                <div>
                  <h3>Filter by tag</h3>
                  <p>Select one or more topics</p>
                </div>

                {selectedTags.length > 0 && (
                  <button
                    type="button"
                    className="blog-clear-filters"
                    onClick={clearFilters}
                  >
                    Clear
                  </button>
                )}
              </div>

              <div className="blog-tag-filter-options">
                {allTags.map((tag) => {
                  const active = selectedTags.includes(tag);

                  return (
                    <button
                      key={tag}
                      type="button"
                      className={`blog-tag-filter${
                        active ? ' active' : ''
                      }`}
                      aria-pressed={active}
                      onClick={() => toggleTag(tag)}
                    >
                      {tag}
                    </button>
                  );
                })}
              </div>

              <div className="blog-filter-panel-footer">
                <span>
                  {filteredPosts.length}{' '}
                  {filteredPosts.length === 1 ? 'post' : 'posts'}
                </span>

                <button
                  type="button"
                  className="blog-filter-done"
                  onClick={() => setIsOpen(false)}
                >
                  Done
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="blog-grid">
        {filteredPosts.map((post) => (
          <Link
            key={post.slug}
            href={`/blog/${post.slug}`}
            className="blog-card"
          >
            <div className="blog-card-cover">
              <BlogCover src={post.cover} alt={post.title} />
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

      {filteredPosts.length === 0 && (
        <p className="blog-no-results">
          No posts match these tags. Try removing a filter.
        </p>
      )}
    </>
  );
}
