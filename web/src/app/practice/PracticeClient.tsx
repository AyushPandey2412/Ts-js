'use client';

import React, { useState, useEffect, useCallback, useTransition } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';

interface PracticeProblem {
  id: number;
  category: 'strings' | 'arrays' | 'objects';
  title: string;
  difficulty: string;
  htmlContent: string;
}

interface PracticeClientProps {
  initialData: {
    strings: PracticeProblem[];
    arrays: PracticeProblem[];
    objects: PracticeProblem[];
  };
}

export default function PracticeClient({ initialData }: PracticeClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();

  const categoryParam = searchParams.get('category');
  const category: 'strings' | 'arrays' | 'objects' =
    categoryParam === 'strings' || categoryParam === 'arrays' || categoryParam === 'objects'
      ? categoryParam
      : 'strings';

  const qParam = parseInt(searchParams.get('q') || '1', 10);
  const currentIndex = !isNaN(qParam) && qParam >= 1 ? qParam - 1 : 0;

  const [solvedMap, setSolvedMap] = useState<Record<string, boolean>>(() => {
    if (typeof window === 'undefined') return {};
    try {
      const stored = localStorage.getItem('js_masterclass_solved_problems');
      return stored ? JSON.parse(stored) : {};
    } catch {
      return {};
    }
  });

  const currentList = initialData[category] || [];
  const currentProblem = currentList[currentIndex] || currentList[0];

  const problemKey = currentProblem ? `${category}_${currentProblem.id}` : '';
  const isCurrentSolved = Boolean(solvedMap[problemKey]);

  // Toggle solved status
  const toggleSolved = () => {
    if (!problemKey) return;
    const nextMap = { ...solvedMap, [problemKey]: !isCurrentSolved };
    setSolvedMap(nextMap);
    try {
      localStorage.setItem('js_masterclass_solved_problems', JSON.stringify(nextMap));
    } catch {
      // Ignore storage errors
    }
  };

  const handleSelectIndex = useCallback((idx: number) => {
    startTransition(() => {
      router.replace(`/practice?category=${category}&q=${idx + 1}`, { scroll: false });
    });
    const mainEl = document.getElementById('main-content');
    if (mainEl) mainEl.scrollTo({ top: 0, behavior: 'smooth' });
  }, [category, router]);

  const handleCategoryChange = (newCat: 'strings' | 'arrays' | 'objects') => {
    startTransition(() => {
      router.replace(`/practice?category=${newCat}&q=1`, { scroll: false });
    });
    const mainEl = document.getElementById('main-content');
    if (mainEl) mainEl.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleNext = useCallback(() => {
    if (currentIndex < currentList.length - 1) {
      handleSelectIndex(currentIndex + 1);
    }
  }, [currentIndex, currentList.length, handleSelectIndex]);

  const handlePrev = useCallback(() => {
    if (currentIndex > 0) {
      handleSelectIndex(currentIndex - 1);
    }
  }, [currentIndex, handleSelectIndex]);

  // Keyboard navigation: ArrowLeft for previous, ArrowRight for next
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Do not trigger if typing in an input
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement).tagName)) return;

      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        handlePrev();
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        handleNext();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleNext, handlePrev]);

  // Count solved for current category
  const solvedCount = currentList.filter((p) => solvedMap[`${category}_${p.id}`]).length;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-8 w-full">
      {/* Top Breadcrumb & Title */}
      <div className="border-b border-slate-800 pb-5 mb-6">
        <div className="flex items-center space-x-2 text-xs font-mono text-blue-400 font-bold mb-2">
          <Link href="/" className="hover:underline">
            Home
          </Link>
          <span>/</span>
          <span>Practice Hub</span>
          <span>/</span>
          <span className="capitalize text-slate-300">{category}</span>
        </div>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <h1 className="text-xl sm:text-2xl md:text-3xl font-extrabold text-white tracking-tight">
            JavaScript Practice Questions
          </h1>
          <div className="text-xs bg-slate-900 border border-slate-800 px-3 py-1 rounded text-slate-300 font-mono w-fit">
            Solved: <span className="text-emerald-400 font-bold">{solvedCount}</span> / {currentList.length}
          </div>
        </div>
        <p className="text-slate-400 text-xs sm:text-sm mt-1">
          Solve questions one at a time. Work through it first, then reveal the solution. Use arrow keys <kbd className="bg-slate-800 px-1 py-0.5 rounded text-[11px] border border-slate-700">&larr;</kbd> and <kbd className="bg-slate-800 px-1 py-0.5 rounded text-[11px] border border-slate-700">&rarr;</kbd> to navigate.
        </p>

        {/* Category Switcher Tabs */}
        <div className="flex flex-wrap gap-2 mt-4">
          <button
            onClick={() => handleCategoryChange('strings')}
            className={`px-3 py-1.5 rounded text-xs font-semibold transition-colors ${
              category === 'strings'
                ? 'bg-blue-600 text-white'
                : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            Strings ({initialData.strings.length})
          </button>
          <button
            onClick={() => handleCategoryChange('arrays')}
            className={`px-3 py-1.5 rounded text-xs font-semibold transition-colors ${
              category === 'arrays'
                ? 'bg-blue-600 text-white'
                : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            Arrays ({initialData.arrays.length})
          </button>
          <button
            onClick={() => handleCategoryChange('objects')}
            className={`px-3 py-1.5 rounded text-xs font-semibold transition-colors ${
              category === 'objects'
                ? 'bg-blue-600 text-white'
                : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            Objects ({initialData.objects.length})
          </button>
        </div>
      </div>

      {/* Pagination & Problem Selector Bar */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-lg p-3 sm:p-4 mb-6">
        <div className="flex items-center justify-between mb-3 text-xs">
          <div className="font-semibold text-slate-300">
            Question {currentIndex + 1} of {currentList.length}
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={handlePrev}
              disabled={currentIndex === 0}
              className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:hover:bg-slate-800 text-slate-200 text-xs font-medium border border-slate-700 transition-colors"
            >
              &larr; Prev
            </button>
            <button
              onClick={handleNext}
              disabled={currentIndex === currentList.length - 1}
              className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:hover:bg-slate-800 text-slate-200 text-xs font-medium border border-slate-700 transition-colors"
            >
              Next &rarr;
            </button>
          </div>
        </div>

        {/* Numbered Jump Pills */}
        <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto pr-1">
          {currentList.map((p, idx) => {
            const isSolved = Boolean(solvedMap[`${category}_${p.id}`]);
            const isCurrent = currentIndex === idx;
            return (
              <button
                key={p.id}
                onClick={() => handleSelectIndex(idx)}
                className={`relative w-7 h-7 rounded text-xs font-mono font-medium transition-colors flex items-center justify-center ${
                  isCurrent
                    ? 'bg-blue-600 text-white font-bold ring-2 ring-blue-400'
                    : isSolved
                    ? 'bg-emerald-950/70 text-emerald-300 border border-emerald-800'
                    : 'bg-slate-800/80 text-slate-400 hover:bg-slate-700 hover:text-white border border-slate-700/60'
                }`}
                title={`Question ${p.id}: ${p.title} ${isSolved ? '(Solved)' : ''}`}
              >
                {p.id}
                {isSolved && !isCurrent && (
                  <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full bg-emerald-400" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Active Question in Focus */}
      {currentProblem ? (
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-5 sm:p-7 md:p-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-4 border-b border-slate-800 mb-6 gap-3">
            <div className="flex items-center space-x-3">
              <span className="font-mono text-xs px-2.5 py-1 rounded bg-blue-950 border border-blue-800 text-blue-400 font-bold shrink-0">
                Question {currentProblem.id}
              </span>
              <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight m-0">
                {currentProblem.title}
              </h2>
            </div>
            <div className="flex items-center space-x-2 shrink-0">
              {/* Mark as Solved Button */}
              <button
                onClick={toggleSolved}
                className={`px-3 py-1 rounded text-xs font-medium border transition-colors flex items-center space-x-1.5 ${
                  isCurrentSolved
                    ? 'bg-emerald-950/80 border-emerald-700 text-emerald-300 hover:bg-emerald-900'
                    : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-slate-200'
                }`}
              >
                <span>{isCurrentSolved ? '&#10003; Solved' : 'Mark Solved'}</span>
              </button>
              <span className="text-xs px-2.5 py-1 rounded bg-slate-800 text-emerald-400 font-medium border border-slate-700">
                {currentProblem.difficulty}
              </span>
            </div>
          </div>

          {/* Question Body */}
          <div
            className="markdown-body"
            dangerouslySetInnerHTML={{ __html: currentProblem.htmlContent }}
          />

          {/* Bottom Next / Prev Controls */}
          <div className="flex items-center justify-between border-t border-slate-800 pt-6 mt-8">
            <button
              onClick={handlePrev}
              disabled={currentIndex === 0}
              className="px-3.5 sm:px-4 py-2 rounded bg-slate-800 hover:bg-slate-700 disabled:opacity-30 disabled:hover:bg-slate-800 text-slate-200 text-xs font-semibold border border-slate-700 transition-colors"
            >
              &larr; Prev Question
            </button>
            <span className="text-xs text-slate-500 font-mono">
              {currentIndex + 1} / {currentList.length}
            </span>
            <button
              onClick={handleNext}
              disabled={currentIndex === currentList.length - 1}
              className="px-3.5 sm:px-4 py-2 rounded bg-blue-600 hover:bg-blue-500 disabled:opacity-30 disabled:hover:bg-blue-600 text-white text-xs font-semibold transition-colors"
            >
              Next Question &rarr;
            </button>
          </div>
        </div>
      ) : (
        <div className="text-center py-12 text-slate-500 text-sm">
          No questions found in this category.
        </div>
      )}
    </div>
  );
}
