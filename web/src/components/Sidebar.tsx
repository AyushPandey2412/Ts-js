'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import SearchModal from './SearchModal';
import type { SearchItem } from '@/lib/search-index';
import { TECHNOLOGY_TRACKS } from '@/lib/tracks';

interface SidebarProps {
  searchIndex?: SearchItem[];
}

export default function Sidebar({ searchIndex = [] }: SidebarProps) {
  const pathname = usePathname();

  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  // Global Ctrl+K / Cmd+K listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsSearchOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <>
      {/* Global Search Dialog Modal */}
      <SearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        searchIndex={searchIndex}
      />

      {/* Mobile Top Header */}
      <div className="md:hidden flex items-center justify-between px-4 py-3 bg-slate-900 border-b border-slate-800 sticky top-0 z-40">
        <button
          onClick={() => setIsMobileOpen(!isMobileOpen)}
          className="flex items-center space-x-2 px-2.5 py-1.5 rounded bg-slate-800 text-slate-200 text-xs font-semibold border border-slate-700 hover:bg-slate-700"
          aria-label="Toggle menu"
        >
          <svg className="w-4 h-4 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
          <span>Menu</span>
        </button>
        <Link href="/" className="flex items-center space-x-2">
          <div className="w-6 h-6 rounded bg-blue-600 text-white font-black text-[10px] flex items-center justify-center font-mono">
            ENG
          </div>
          <span className="text-xs font-bold text-white tracking-tight">Engineering Academy</span>
        </Link>
        <button
          onClick={() => setIsSearchOpen(true)}
          className="p-1.5 rounded bg-slate-800 text-slate-300 border border-slate-700"
          aria-label="Search"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </button>
      </div>

      {/* Mobile Backdrop Overlay */}
      {isMobileOpen && (
        <div
          onClick={() => setIsMobileOpen(false)}
          className="fixed inset-0 bg-black/60 z-40 md:hidden backdrop-blur-sm"
        />
      )}

      {/* Main Sidebar */}
      <aside
        className={`bg-slate-900 border-r border-slate-800 flex flex-col h-screen sticky top-0 shrink-0 z-50 transition-all duration-200 ease-in-out
          ${isCollapsed ? 'w-16' : 'w-72'}
          ${isMobileOpen ? 'fixed inset-y-0 left-0 translate-x-0 w-72' : 'max-md:-translate-x-full max-md:fixed max-md:inset-y-0 max-md:left-0'}
        `}
      >
        {/* Modern Brand Logo & Collapse Button */}
        <div className="p-3 border-b border-slate-800 flex items-center justify-between">
          {!isCollapsed ? (
            <Link
              href="/"
              onClick={() => setIsMobileOpen(false)}
              className="flex items-center space-x-2.5 truncate group mr-2"
            >
              <div className="w-8 h-8 rounded bg-blue-600 text-white font-black text-xs flex items-center justify-center tracking-tighter shadow-sm font-mono shrink-0 select-none group-hover:scale-105 transition-transform">
                ENG
              </div>
              <div className="truncate">
                <div className="text-[9.5px] uppercase tracking-wider text-blue-400 font-bold font-mono">
                  Masterclass
                </div>
                <div className="text-sm font-bold text-white tracking-tight leading-none group-hover:text-blue-400 transition-colors">
                  Engineering Academy
                </div>
              </div>
            </Link>
          ) : (
            <Link
              href="/"
              onClick={() => setIsMobileOpen(false)}
              className="w-8 h-8 rounded bg-blue-600 text-white font-black text-xs flex items-center justify-center tracking-tighter shadow-sm font-mono shrink-0 mx-auto select-none"
              title="Engineering Academy Home"
            >
              ENG
            </Link>
          )}

          {/* SVG Collapse Arrow */}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white border border-slate-700 text-xs transition-colors shrink-0"
            title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {isCollapsed ? (
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
              </svg>
            ) : (
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
              </svg>
            )}
          </button>
        </div>

        {/* Global Search Button */}
        {!isCollapsed && (
          <div className="p-3 border-b border-slate-800/80">
            <button
              onClick={() => setIsSearchOpen(true)}
              className="w-full flex items-center justify-between px-3 py-2 bg-slate-800 hover:bg-slate-750 border border-slate-700/80 rounded text-xs text-slate-400 hover:text-slate-200 transition-colors shadow-xs"
            >
              <div className="flex items-center space-x-2">
                <svg className="w-3.5 h-3.5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <span>Search all tracks...</span>
              </div>
              <kbd className="text-[10px] bg-slate-900 px-1.5 py-0.5 rounded text-slate-400 border border-slate-700 font-mono">
                Ctrl+K
              </kbd>
            </button>
          </div>
        )}

        {/* Navigation Content */}
        <div className="flex-1 overflow-y-auto p-2 space-y-4">
          {/* Tech Stacks Overview Section */}
          <div>
            {!isCollapsed ? (
              <div className="flex items-center justify-between px-2 mb-2">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                  Tech Stacks (6)
                </span>
                <Link href="/" className="text-[10px] text-blue-400 hover:text-blue-300 font-medium">
                  Directory
                </Link>
              </div>
            ) : (
              <div className="text-[9px] font-bold text-center text-slate-500 uppercase tracking-tighter mb-1.5">
                STACKS
              </div>
            )}

            <div className="space-y-1">
              {TECHNOLOGY_TRACKS.map((t) => {
                const isActive =
                  pathname === `/tracks/${t.id}` ||
                  (t.id === 'javascript' && pathname.startsWith('/modules/'));

                return (
                  <Link
                    key={t.id}
                    href={`/tracks/${t.id}`}
                    onClick={() => setIsMobileOpen(false)}
                    className={`flex items-center justify-between px-2.5 py-2 rounded text-xs transition-colors ${
                      isActive
                        ? 'bg-slate-800 text-blue-400 font-semibold border-l-2 border-blue-500'
                        : 'text-slate-300 hover:bg-slate-800/60 hover:text-white'
                    }`}
                    title={t.name}
                  >
                    {!isCollapsed ? (
                      <>
                        <span className="font-medium truncate">{t.shortName}</span>
                        <span
                          className={`text-[9.5px] px-1.5 py-0.2 rounded font-mono ${
                            t.status === 'active'
                              ? 'bg-emerald-950 text-emerald-400 border border-emerald-800/60'
                              : 'bg-slate-800 text-slate-500'
                          }`}
                        >
                          {t.status === 'active' ? '9 Mods' : 'Roadmap'}
                        </span>
                      </>
                    ) : (
                      <span className="mx-auto font-mono text-[10px] text-slate-400 hover:text-white">
                        {t.shortName.slice(0, 2).toUpperCase()}
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Practice & Problems Section */}
          <div className="pt-3 border-t border-slate-800/60">
            {!isCollapsed ? (
              <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 px-2 mb-2">
                Practice & Problems (70)
              </div>
            ) : (
              <div className="text-[9px] font-bold text-center text-slate-500 uppercase tracking-tighter mb-1.5">
                Quiz
              </div>
            )}

            <div className="space-y-1">
              <Link
                href="/practice"
                onClick={() => setIsMobileOpen(false)}
                className={`flex items-center justify-between px-2.5 py-2 rounded text-xs transition-colors ${
                  pathname === '/practice'
                    ? 'bg-blue-600 text-white font-semibold'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
                title="All Practice Problems (70)"
              >
                {!isCollapsed ? (
                  <>
                    <span className="font-medium">Practice Hub</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-blue-400 font-mono">
                      70
                    </span>
                  </>
                ) : (
                  <span className="mx-auto font-mono text-[11px] font-bold">ALL</span>
                )}
              </Link>

              <Link
                href="/practice?category=strings"
                onClick={() => setIsMobileOpen(false)}
                className="flex items-center justify-between px-2.5 py-1.5 rounded text-xs text-slate-400 hover:bg-slate-800/60 hover:text-slate-200 transition-colors"
                title="String Algorithms (23 Problems)"
              >
                {!isCollapsed ? (
                  <>
                    <span className="pl-1">Strings (23 Qs)</span>
                    <span className="text-[10px] text-slate-500 font-mono">Dual Sol</span>
                  </>
                ) : (
                  <span className="mx-auto text-[10px] font-mono text-slate-400">STR</span>
                )}
              </Link>

              <Link
                href="/practice?category=arrays"
                onClick={() => setIsMobileOpen(false)}
                className="flex items-center justify-between px-2.5 py-1.5 rounded text-xs text-slate-400 hover:bg-slate-800/60 hover:text-slate-200 transition-colors"
                title="Array Algorithms (27 Problems)"
              >
                {!isCollapsed ? (
                  <>
                    <span className="pl-1">Arrays (27 Qs)</span>
                    <span className="text-[10px] text-slate-500 font-mono">Dual Sol</span>
                  </>
                ) : (
                  <span className="mx-auto text-[10px] font-mono text-slate-400">ARR</span>
                )}
              </Link>

              <Link
                href="/practice?category=objects"
                onClick={() => setIsMobileOpen(false)}
                className="flex items-center justify-between px-2.5 py-1.5 rounded text-xs text-slate-400 hover:bg-slate-800/60 hover:text-slate-200 transition-colors"
                title="Object Exercises (20 Problems)"
              >
                {!isCollapsed ? (
                  <>
                    <span className="pl-1">Objects (20 Qs)</span>
                    <span className="text-[10px] text-slate-500 font-mono">Exercises</span>
                  </>
                ) : (
                  <span className="mx-auto text-[10px] font-mono text-slate-400">OBJ</span>
                )}
              </Link>
            </div>
          </div>

          {/* Interview Arena Section */}
          <div className="pt-3 border-t border-slate-800/60">
            {!isCollapsed ? (
              <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 px-2 mb-2">
                Interview Prep
              </div>
            ) : (
              <div className="text-[9px] font-bold text-center text-slate-500 uppercase tracking-tighter mb-1.5">
                PREP
              </div>
            )}

            <Link
              href="/interview"
              onClick={() => setIsMobileOpen(false)}
              className={`flex items-center justify-between px-2.5 py-2 rounded text-xs transition-colors ${
                pathname === '/interview'
                  ? 'bg-blue-600 text-white font-semibold'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
              title="Senior & Staff Engineering Interview Arena"
            >
              {!isCollapsed ? (
                <>
                  <div className="flex items-center space-x-1.5 truncate">
                    <span className="font-medium truncate">Interview Arena</span>
                  </div>
                  <span className="text-[9.5px] px-1.5 py-0.2 rounded font-mono bg-blue-950 text-blue-300 border border-blue-800/60">
                    All Stacks
                  </span>
                </>
              ) : (
                <span className="mx-auto font-mono text-[11px] font-bold text-blue-400">
                  INT
                </span>
              )}
            </Link>
          </div>
        </div>

        {/* Footer info */}
        {!isCollapsed && (
          <div className="p-2.5 border-t border-slate-800 text-[10px] text-slate-500 text-center font-mono">
            6 Stacks • 70 Problems • Interview Arena
          </div>
        )}
      </aside>
    </>
  );
}
