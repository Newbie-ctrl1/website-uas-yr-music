'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Music2 } from 'lucide-react';

export default function ImageWithFallback({
  src,
  alt,
  fallbackSrc = null,
  ...props
}) {
  const [error, setError] = useState(false);

  if (error || !src) {
    return (
      <div 
        className={`bg-gray-200 flex items-center justify-center ${props.className || ''}`}
        style={{ width: props.width, height: props.height }}
      >
        <Music2 
          size={props.width ? Math.min(props.width, props.height) / 2 : 24} 
          className="text-gray-400"
        />
      </div>
    );
  }

  return (
    <Image
      {...props}
      src={src}
      alt={alt}
      onError={() => setError(true)}
    />
  );
} 