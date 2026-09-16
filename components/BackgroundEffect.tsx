"use client";

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface ImageItem {
  src: string;
  alt: string;
}

export default function BackgroundEffect({ duration = 30, floatAmplitude = 20 }: { duration?: number; floatAmplitude?: number }) {
  const [images, setImages] = useState<ImageItem[]>([]);

  useEffect(() => {
    fetch('/api/media')
      .then((res) => res.json())
      .then((data: string[]) => {
        const items = data.map((url) => ({ src: url, alt: 'TSS Image' }));
        setImages(items);
      })
      .catch(() => setImages([]));
  }, []);

  const rotation = {
    animate: { rotate: 360 },
    transition: { repeat: Infinity, duration, ease: 'linear' },
  };

  const floating = {
    y: [0, -floatAmplitude, 0],
    transition: { repeat: Infinity, duration: duration / 2, ease: 'easeInOut' },
  };

  return (
    <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
      <AnimatePresence>
        {images.map((img, idx) => (
          <motion.img
            key={idx}
            src={img.src}
            alt={img.alt}
            className="absolute w-[300px] h-[300px] object-cover opacity-20"
            style={{
              top: `${Math.random() * 80}%`,
              left: `${Math.random() * 80}%`,
              filter: 'blur(30px)',
            }}
            {...rotation}
            {...floating}
          />
        ))}
      </AnimatePresence>
    </div>
  );
}
