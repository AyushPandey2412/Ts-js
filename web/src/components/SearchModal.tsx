'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import type { SearchItem } from '@/lib/search-index';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  searchIndex: SearchItem[];
}

type FilterCategory = 'all' | 'track' | 'module' | 'practice';

export default function SearchModal({ isOpen, onClose, searchIndex }: Props) {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<FilterCategory>('all');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => inputRef.current?.focus(), 50);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  const handleClose = () => {
    setQuery('');
    setActiveCategory('all');
    setSelectedIndex(0);
    onClose();
  };

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return searchIndex
      .filter((item) => {
        // Category filtering
        if (activeCategory === 'track' && item.category !== 'track') return false;
        if (activeCategory === 'module' && item.category !== 'module' && item.category !== 'section') return false;
        if (activeCategory === 'practice' && item.category !== 'practice') return false;

        // Query filtering
        if (!q) return true;

        const titleMatch = item.title.toLowerCase().includes(q);
        const moduleMatch = item.moduleTitle.toLowerCase().includes(q);
        const descMatch = item.description?.toLowerCase().includes(q);
        const idMatch = item.id.toLowerCase().includes(q);

        return titleMatch || moduleMatch || descMatch || idMatch;
      })
      .slice(0, 12);
  }, [searchIndex, query, activeCategory]);

  const handleSelect = (item: SearchItem) => {
    handleClose();
    router.push(item.url);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev < filtered.length - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : Math.max(0, filtered.length - 1)));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filtered[selectedIndex]) {
        handleSelect(filtered[selectedIndex]);
      }
    } else if (e.key === 'Escape') {
      handleClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div
      onClick={handleClose}
      className="fixed inset-0 bg-black/75 z-50 flex items-start justify-center pt-16 sm:pt-20 px-4 backdrop-blur-xs animate-in fade-in duration-150"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-2xl bg-slate-900 border border-slate-700 rounded-lg shadow-2xl overflow-hidden flex flex-col text-slate-100"
      >
        {/* Search Input Bar */}
        <div className="flex items-center px-4 py-3.5 border-b border-slate-800 bg-slate-950/80">
          <svg className="w-4 h-4 text-slate-400 mr-3 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            onKeyDown={handleKeyDown}
            placeholder="Search all engineering tracks, modules, algorithms, topics... (e.g. postgres, redis, async, closures)"
            className="w-full bg-transparent text-sm text-slate-100 placeholder-slate-500 focus:outline-none"
          />
          <kbd className="hidden sm:inline-block text-[10px] text-slate-400 bg-slate-800 px-1.5 py-0.5 rounded border border-slate-700 font-mono">
            ESC
          </kbd>
        </div>

        {/* Category Filters Bar */}
        <div className="flex items-center space-x-1.5 px-4 py-2 border-b border-slate-800/80 bg-slate-950/40 text-xs">
          <span className="text-[11px] text-slate-500 mr-1">Filter:</span>
          {(
            [
              { key: 'all', label: 'All Results' },
              { key: 'track', label: 'Tech Tracks' },
              { key: 'module', label: 'Curriculum' },
              { key: 'practice', label: 'Practice Problems' }
            ] as const
          ).map((tab) => (
            <button
              key={tab.key}
              onClick={() => {
                setActiveCategory(tab.key);
                setSelectedIndex(0);
              }}
              className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors ${
                activeCategory === tab.key
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
          <span className="ml-auto text-[11px] text-slate-500 font-mono">
            {filtered.length} matches
          </span>
        </div>

        {/* Results List */}
        <div className="max-h-96 overflow-y-auto p-2 space-y-1">
          {filtered.length > 0 ? (
            filtered.map((item, idx) => {
              const isSelected = selectedIndex === idx;

              // Badge styling per category
              let badgeBg = 'bg-slate-800 text-slate-300';
              if (item.category === 'track') badgeBg = 'bg-purple-950 text-purple-300 border border-purple-800/60';
              if (item.category === 'module') badgeBg = 'bg-blue-950 text-blue-300 border border-blue-800/60';
              if (item.category === 'practice') badgeBg = 'bg-emerald-950 text-emerald-300 border border-emerald-800/60';

              return (
                <div
                  key={item.id}
                  onClick={() => handleSelect(item)}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  className={`px-3 py-2.5 rounded text-xs cursor-pointer flex flex-col gap-1 transition-colors ${
                    isSelected
                      ? 'bg-blue-600 text-white'
                      : 'hover:bg-slate-800/80 text-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2 truncate">
                      <span
                        className={`text-[9.5px] font-mono px-1.5 py-0.2 rounded uppercase font-semibold shrink-0 ${
                          isSelected ? 'bg-blue-700 text-white' : badgeBg
                        }`}
                      >
                        {item.category.toUpperCase()}
                      </span>
                      <span className="font-semibold truncate">{item.title}</span>
                    </div>
                    <span
                      className={`text-[10px] shrink-0 font-mono ml-2 ${
                        isSelected ? 'text-blue-100' : 'text-slate-400'
                      }`}
                    >
                      {item.moduleNumber}
                    </span>
                  </div>

                  {item.description && (
                    <p
                      className={`text-[11px] line-clamp-1 pl-1 ${
                        isSelected ? 'text-blue-100/90' : 'text-slate-400'
                      }`}
                    >
                      {item.description}
                    </p>
                  )}
                </div>
              );
            })
          ) : (
            <div className="text-center py-10 text-xs text-slate-500">
              No matching results found for &quot;{query}&quot;
            </div>
          )}
        </div>

        {/* Footer shortcuts */}
        <div className="px-4 py-2 border-t border-slate-800 bg-slate-950/60 text-[11px] text-slate-500 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span>
              Navigate: <kbd className="font-mono bg-slate-800 px-1 py-0.5 rounded">&uarr;</kbd>{' '}
              <kbd className="font-mono bg-slate-800 px-1 py-0.5 rounded">&darr;</kbd>
            </span>
            <span>
              Select: <kbd className="font-mono bg-slate-800 px-1 py-0.5 rounded">&crarr;</kbd>
            </span>
          </div>
          <span>Multi-Stack Global Search</span>
        </div>
      </div>
    </div>
  );
}
