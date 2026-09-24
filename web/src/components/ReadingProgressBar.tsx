'use client';

import React, { useState, useEffect } from 'react';

export default function ReadingProgressBar() {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const mainEl = document.getElementById('main-content');
    if (!mainEl) return;

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = mainEl;
      const totalScroll = scrollHeight - clientHeight;
      if (totalScroll <= 0) {
        setProgress(0);
        return;
      }
      const currentProgress = (scrollTop / totalScroll) * 100;
      setProgress(Math.min(100, Math.max(0, currentProgress)));
    };

    mainEl.addEventListener('scroll', handleScroll, { passive: true });
    return () => mainEl.removeEventListener('scroll', handleScroll);
  }, []);

  if (progress <= 0) return null;

  return (
    <div className="fixed top-0 left-0 right-0 h-[2.5px] z-50 pointer-events-none bg-transparent">
      <div
        className="h-full bg-blue-500 transition-all duration-75 ease-out shadow-[0_0_8px_rgba(59,130,246,0.6)]"
        style={{ width: `${progress}%` }}
      />
    </div>
  );
}

