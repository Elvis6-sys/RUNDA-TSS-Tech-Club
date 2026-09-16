import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

export default function MediaCarousel() {
  const [images, setImages] = useState<string[]>([]);

  useEffect(() => {
    fetch('/api/media')
      .then((res) => res.json())
      .then((data: string[]) => setImages(data))
      .catch(() => setImages([]));
  }, []);

  if (images.length === 0) return null;

  return (
    <div className="overflow-x-auto whitespace-nowrap py-4">
      <div className="flex gap-4">
        {images.map((src, idx) => (
          <motion.img
            key={idx}
            src={src}
            alt="TSS Media"
            className="w-64 h-40 object-cover rounded-xl cursor-pointer hover:scale-105 transition-transform"
            whileHover={{ scale: 1.05 }}
          />
        ))}
      </div>
    </div>
  );
}
