'use client';

import React, { useState, useEffect } from 'react';

export default function ScrollToTop() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const mainEl = document.getElementById('main-content');
    if (!mainEl) return;

    const handleScroll = () => {
      if (mainEl.scrollTop > 350) {
        setVisible(true);
      } else {
        setVisible(false);
      }
    };

    mainEl.addEventListener('scroll', handleScroll);
    return () => mainEl.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    const mainEl = document.getElementById('main-content');
    if (mainEl) {
      mainEl.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  if (!visible) return null;

  return (
    <button
      onClick={scrollToTop}
      aria-label="Scroll to top"
      className="fixed bottom-6 right-8 z-50 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-600 px-3.5 py-2 rounded-full shadow-lg text-xs font-semibold flex items-center space-x-1.5 transition-all hover:border-blue-500 hover:text-white"
    >
      <span>&uarr;</span>
      <span>Top</span>
    </button>
  );
}

