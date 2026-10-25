'use client';

import Image from 'next/image';
import { useState } from 'react';

type Props = {
  src?: string;
  alt: string;
  priority?: boolean;
  sizes?: string;
};

export default function BlogCover({ src, alt, priority, sizes }: Props) {
  const [errored, setErrored] = useState(false);
  const [loaded, setLoaded] = useState(false);

  // If no source or if it fails, permanently show fallback
  if (!src || errored) {
    return (
      <div className="blog-cover-fallback">
        <span className="blog-cover-fallback-mark">[?]</span>
        <span className="blog-cover-fallback-text">{alt}</span>
      </div>
    );
  }

  return (
    <>
      {/* Show fallback placeholder while loading */}
      {!loaded && (
        <div className="blog-cover-fallback">
          <span className="blog-cover-fallback-mark">[?]</span>
          <span className="blog-cover-fallback-text">{alt}</span>
        </div>
      )}

      {/* Render the image, fade it in when loaded */}
      <Image
        src={src}
        alt={alt}
        fill
        priority={priority}
        sizes={sizes}
        style={{ 
          objectFit: 'contain',
          opacity: loaded ? 1 : 0, 
          transition: 'opacity 0.4s ease-in-out'
        }}
        onLoad={() => setLoaded(true)}
        onError={() => setErrored(true)}
      />
    </>
  );
}