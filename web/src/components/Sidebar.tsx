'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import SearchModal from './SearchModal';
import Logo from './Logo';
import type { SearchItem } from '@/lib/search-index';
import { TECHNOLOGY_TRACKS } from '@/lib/tracks';
import { JS_MODULES, TS_MODULES, REACT_MODULES } from '@/lib/modules-meta';

interface SidebarProps {
  searchIndex?: SearchItem[];
}

export default function Sidebar({ searchIndex = [] }: SidebarProps) {
  const pathname = usePathname();

  const isReactRoute = pathname.startsWith('/modules/react-') || pathname === '/tracks/react';
  const isTsRoute = pathname.startsWith('/modules/ts-') || pathname === '/tracks/typescript';
  const isJsRoute = (pathname.startsWith('/modules/') && !pathname.startsWith('/modules/ts-') && !pathname.startsWith('/modules/react-')) || pathname === '/tracks/javascript';

  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isReactOpen, setIsReactOpen] = useState(isReactRoute);
  const [isTsOpen, setIsTsOpen] = useState(isTsRoute);
  const [isJsOpen, setIsJsOpen] = useState(isJsRoute);

  useEffect(() => {
    if (isReactRoute) setIsReactOpen(true);
    if (isTsRoute) setIsTsOpen(true);
    if (isJsRoute) setIsJsOpen(true);
  }, [pathname, isReactRoute, isTsRoute, isJsRoute]);

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

  // Auto-close mobile sidebar when path changes
  useEffect(() => {
    setIsMobileOpen(false);
  }, [pathname]);

  return (
    <>
      {/* Global Search Dialog Modal */}
      <SearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        searchIndex={searchIndex}
      />

      {/* Mobile Top Header */}
      <div className="md:hidden flex items-center justify-between px-4 py-3 bg-slate-900 border-b border-slate-800 sticky top-0 z-40 w-full shrink-0">
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
          <Logo size={24} className="shrink-0" />
          <span className="text-xs font-bold text-white tracking-tight">DevMastery</span>
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
              <Logo size={32} className="shrink-0 group-hover:scale-105 transition-transform" />
              <div className="truncate">
                <div className="text-[9.5px] uppercase tracking-wider text-cyan-400 font-bold font-mono">
                  Full-Stack & Systems
                </div>
                <div className="text-sm font-bold text-white tracking-tight leading-none group-hover:text-cyan-400 transition-colors">
                  DevMastery
                </div>
              </div>
            </Link>
          ) : (
            <Link
              href="/"
              onClick={() => setIsMobileOpen(false)}
              className="mx-auto select-none"
              title="DevMastery Home"
            >
              <Logo size={28} className="hover:scale-105 transition-transform" />
            </Link>
          )}

          <div className="flex items-center space-x-1 shrink-0">
            {/* SVG Collapse Arrow (desktop only) */}
            <button
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="hidden md:flex p-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white border border-slate-700 text-xs transition-colors shrink-0 items-center justify-center"
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

            {/* Mobile Close Button (touch drawer only) */}
            <button
              onClick={() => setIsMobileOpen(false)}
              className="md:hidden p-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white border border-slate-700 text-xs transition-colors shrink-0 flex items-center justify-center"
              title="Close menu"
              aria-label="Close menu"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
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
                  (t.id === 'javascript' && isJsRoute) ||
                  (t.id === 'typescript' && isTsRoute);

                return (
                  <Link
                    key={t.id}
                    href={`/tracks/${t.id}`}
                    onClick={() => setIsMobileOpen(false)}
                    className={`flex items-center justify-between px-2.5 py-2 rounded text-xs transition-all active:scale-[0.97] cursor-pointer ${
                      isActive
                        ? 'bg-slate-800 text-cyan-400 font-semibold border-l-2 border-cyan-500 shadow-sm'
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
                          {t.status === 'active' ? `${t.modulesCount} Mods` : 'Roadmap'}
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

          {/* Collapsible TypeScript Track Modules (13) */}
          {!isCollapsed ? (
            <div className="pt-3 border-t border-slate-800/60">
              <button
                onClick={() => setIsTsOpen(!isTsOpen)}
                className="w-full flex items-center justify-between px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-slate-400 hover:text-slate-200 transition-colors"
              >
                <div className="flex items-center space-x-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-400"></span>
                  <span>TypeScript Track ({TS_MODULES.length})</span>
                </div>
                <span className="text-slate-500 font-mono text-xs font-bold">{isTsOpen ? '−' : '+'}</span>
              </button>

              {isTsOpen && (
                <div className="mt-1 space-y-0.5 max-h-48 overflow-y-auto pr-1">
                  {TS_MODULES.map((m) => {
                    const isCurrent = pathname === `/modules/${m.slug}`;
                    return (
                      <Link
                        key={m.slug}
                        href={`/modules/${m.slug}`}
                        onClick={() => setIsMobileOpen(false)}
                        className={`flex items-center justify-between px-2 py-1.5 rounded text-[11px] transition-all active:scale-[0.98] ${
                          isCurrent
                            ? 'bg-blue-600/20 text-blue-300 font-semibold border-l-2 border-blue-400'
                            : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'
                        }`}
                        title={m.title}
                      >
                        <span className="font-mono text-[9.5px] text-blue-400 font-medium shrink-0 mr-1.5">
                          {m.number}
                        </span>
                        <span className="truncate flex-1">{m.title}</span>
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          ) : (
            <div className="pt-2 border-t border-slate-800/60 flex flex-col items-center">
              <Link
                href="/tracks/typescript"
                className={`w-9 h-6 flex items-center justify-center rounded text-[10px] font-mono font-bold transition-all ${
                  isTsRoute ? 'bg-blue-600 text-white' : 'text-blue-400 hover:bg-slate-800'
                }`}
                title="TypeScript Track (13 Modules)"
              >
                TS
              </Link>
            </div>
          )}

          {/* Collapsible React Track Modules (7) */}
          {!isCollapsed ? (
            <div className="pt-3 border-t border-slate-800/60">
              <button
                onClick={() => setIsReactOpen(!isReactOpen)}
                className="w-full flex items-center justify-between px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-slate-400 hover:text-slate-200 transition-colors"
              >
                <div className="flex items-center space-x-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-400"></span>
                  <span>React Track ({REACT_MODULES.length})</span>
                </div>
                <span className="text-slate-500 font-mono text-xs font-bold">{isReactOpen ? '−' : '+'}</span>
              </button>

              {isReactOpen && (
                <div className="mt-1 space-y-0.5 max-h-48 overflow-y-auto pr-1">
                  {REACT_MODULES.map((m) => {
                    const isCurrent = pathname === `/modules/${m.slug}`;
                    return (
                      <Link
                        key={m.slug}
                        href={`/modules/${m.slug}`}
                        onClick={() => setIsMobileOpen(false)}
                        className={`flex items-center justify-between px-2 py-1.5 rounded text-[11px] transition-all active:scale-[0.98] ${
                          isCurrent
                            ? 'bg-cyan-600/20 text-cyan-300 font-semibold border-l-2 border-cyan-400'
                            : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'
                        }`}
                        title={m.title}
                      >
                        <span className="font-mono text-[9.5px] text-cyan-400 font-medium shrink-0 mr-1.5">
                          {m.number}
                        </span>
                        <span className="truncate flex-1">{m.title}</span>
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          ) : (
            <div className="pt-2 border-t border-slate-800/60 flex flex-col items-center">
              <Link
                href="/tracks/react"
                className={`w-9 h-6 flex items-center justify-center rounded text-[10px] font-mono font-bold transition-all ${
                  isReactRoute ? 'bg-cyan-600 text-white' : 'text-cyan-400 hover:bg-slate-800'
                }`}
                title="React Track (7 Modules)"
              >
                RE
              </Link>
            </div>
          )}

          {/* Collapsible JavaScript Track Modules (21) */}
          {!isCollapsed ? (
            <div className="pt-3 border-t border-slate-800/60">
              <button
                onClick={() => setIsJsOpen(!isJsOpen)}
                className="w-full flex items-center justify-between px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-slate-400 hover:text-slate-200 transition-colors"
              >
                <div className="flex items-center space-x-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
                  <span>JavaScript Track ({JS_MODULES.length})</span>
                </div>
                <span className="text-slate-500 font-mono text-xs font-bold">{isJsOpen ? '−' : '+'}</span>
              </button>

              {isJsOpen && (
                <div className="mt-1 space-y-0.5 max-h-48 overflow-y-auto pr-1">
                  {JS_MODULES.map((m) => {
                    const isCurrent = pathname === `/modules/${m.slug}`;
                    return (
                      <Link
                        key={m.slug}
                        href={`/modules/${m.slug}`}
                        onClick={() => setIsMobileOpen(false)}
                        className={`flex items-center justify-between px-2 py-1.5 rounded text-[11px] transition-all active:scale-[0.98] ${
                          isCurrent
                            ? 'bg-amber-600/20 text-amber-300 font-semibold border-l-2 border-amber-400'
                            : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'
                        }`}
                        title={m.title}
                      >
                        <span className="font-mono text-[9.5px] text-amber-400 font-medium shrink-0 mr-1.5">
                          {m.number}
                        </span>
                        <span className="truncate flex-1">{m.title}</span>
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          ) : (
            <div className="pt-2 flex flex-col items-center">
              <Link
                href="/tracks/javascript"
                className={`w-9 h-6 flex items-center justify-center rounded text-[10px] font-mono font-bold transition-all ${
                  isJsRoute ? 'bg-amber-600 text-white' : 'text-amber-400 hover:bg-slate-800'
                }`}
                title="JavaScript Track (21 Modules)"
              >
                JS
              </Link>
            </div>
          )}

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
                className={`flex items-center justify-between px-2.5 py-2 rounded text-xs transition-all active:scale-[0.97] cursor-pointer ${
                  pathname === '/practice'
                    ? 'bg-blue-600 text-white font-semibold shadow-sm'
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
                className="flex items-center justify-between px-2.5 py-1.5 rounded text-xs text-slate-400 hover:bg-slate-800/60 hover:text-slate-200 transition-all active:scale-[0.97] cursor-pointer"
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
                className="flex items-center justify-between px-2.5 py-1.5 rounded text-xs text-slate-400 hover:bg-slate-800/60 hover:text-slate-200 transition-all active:scale-[0.97] cursor-pointer"
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
                className="flex items-center justify-between px-2.5 py-1.5 rounded text-xs text-slate-400 hover:bg-slate-800/60 hover:text-slate-200 transition-all active:scale-[0.97] cursor-pointer"
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

          {/* Notes Studio Section */}
          <div className="pt-3 border-t border-slate-800/60">
            {!isCollapsed ? (
              <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 px-2 mb-2">
                Engineering Studio
              </div>
            ) : (
              <div className="text-[9px] font-bold text-center text-slate-500 uppercase tracking-tighter mb-1.5">
                STUDIO
              </div>
            )}

            <Link
              href="/notes"
              onClick={() => setIsMobileOpen(false)}
              className={`flex items-center justify-between px-2.5 py-2 rounded text-xs transition-all active:scale-[0.97] cursor-pointer ${
                pathname === '/notes'
                  ? 'bg-blue-600 text-white font-semibold shadow-sm'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
              title="Global Notes Studio & Masterclass Converter"
            >
              {!isCollapsed ? (
                <>
                  <div className="flex items-center space-x-2 truncate">
                    <span>📝</span>
                    <span className="font-medium truncate">Notes Studio</span>
                  </div>
                  <span className="text-[9.5px] px-1.5 py-0.5 rounded font-mono bg-emerald-950 text-emerald-300 border border-emerald-800/60 font-semibold">
                    Word + MD
                  </span>
                </>
              ) : (
                <span className="mx-auto font-mono text-[11px] font-bold text-emerald-400">
                  NOTE
                </span>
              )}
            </Link>
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
              className={`flex items-center justify-between px-2.5 py-2 rounded text-xs transition-all active:scale-[0.97] cursor-pointer ${
                pathname === '/interview'
                  ? 'bg-blue-600 text-white font-semibold shadow-sm'
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
