'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import type { TableOfContentsItem } from '@/lib/modules';

interface Props {
  toc: TableOfContentsItem[];
  onToggleNotes?: () => void;
  isNotesOpen?: boolean;
  onToggleSticky?: () => void;
  isStickyOpen?: boolean;
  onToggleEdit?: () => void;
  isEditMode?: boolean;
  onTogglePlayground?: () => void;
  isPlaygroundOpen?: boolean;
}

export default function TableOfContents({
  toc,
  onToggleNotes,
  isNotesOpen = false,
  onToggleSticky,
  isStickyOpen = false,
  onToggleEdit,
  isEditMode = false,
  onTogglePlayground,
  isPlaygroundOpen = false,
}: Props) {
  const [filter, setFilter] = useState('');
  const [activeId, setActiveId] = useState<string>('');
  const [isMobileTocOpen, setIsMobileTocOpen] = useState(false);

  const filteredToc = toc.filter(
    (item) =>
      item.level <= 2 &&
      item.text.toLowerCase().includes(filter.toLowerCase())
  );

  // Active section scroll spy
  useEffect(() => {
    const mainEl = document.getElementById('main-content');
    if (!mainEl || toc.length === 0) return;

    const handleScroll = () => {
      const headingElements = toc
        .map((item) => document.getElementById(item.id))
        .filter(Boolean) as HTMLElement[];

      const mainTop = mainEl.getBoundingClientRect().top;

      let currentActive = '';
      for (const el of headingElements) {
        const rect = el.getBoundingClientRect();
        if (rect.top - mainTop <= 120) {
          currentActive = el.id;
        } else {
          break;
        }
      }

      if (currentActive) {
        setActiveId(currentActive);
      }
    };

    mainEl.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();

    return () => mainEl.removeEventListener('scroll', handleScroll);
  }, [toc]);

  const scrollToHeading = (e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
    e.preventDefault();
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      setActiveId(id);
      window.history.pushState(null, '', `#${id}`);
    } else {
      const fallback = document.querySelector(`[id*="${id}"]`);
      if (fallback) {
        fallback.scrollIntoView({ behavior: 'smooth', block: 'start' });
        setActiveId(fallback.id);
        window.history.pushState(null, '', `#${fallback.id}`);
      }
    }
    setIsMobileTocOpen(false);
  };

  return (
    <>
      {/* Mobile Floating Action Dock (Visible only on < lg screens) */}
      <div className="lg:hidden fixed bottom-5 right-4 z-40 flex items-center space-x-1.5 bg-slate-900/95 border border-slate-700 px-3 py-1.5 rounded-full shadow-2xl backdrop-blur-md text-xs">
        {toc.length > 0 && (
          <button
            onClick={() => setIsMobileTocOpen(!isMobileTocOpen)}
            className={`px-2.5 py-1 rounded-full text-[11px] font-semibold border transition-colors ${
              isMobileTocOpen ? 'bg-indigo-600 text-white border-indigo-500' : 'bg-slate-800 text-slate-300 border-slate-700'
            }`}
          >
            📑 TOC
          </button>
        )}
        {onToggleNotes && (
          <button
            onClick={onToggleNotes}
            className={`px-2.5 py-1 rounded-full text-[11px] font-semibold border transition-colors ${
              isNotesOpen ? 'bg-blue-600 text-white border-blue-500' : 'bg-slate-800 text-slate-300 border-slate-700'
            }`}
          >
            Notes
          </button>
        )}
        {onToggleSticky && (
          <button
            onClick={onToggleSticky}
            className={`px-2.5 py-1 rounded-full text-[11px] font-semibold border transition-colors ${
              isStickyOpen ? 'bg-amber-600 text-white border-amber-500' : 'bg-slate-800 text-slate-300 border-slate-700'
            }`}
          >
            Sticky
          </button>
        )}
        {onToggleEdit && (
          <button
            onClick={onToggleEdit}
            className={`px-2.5 py-1 rounded-full text-[11px] font-semibold border transition-colors ${
              isEditMode ? 'bg-emerald-600 text-white border-emerald-500' : 'bg-slate-800 text-slate-300 border-slate-700'
            }`}
          >
            Edit
          </button>
        )}
      </div>

      {/* Mobile Table of Contents Modal Bottom Drawer */}
      {isMobileTocOpen && (
        <>
          <div
            onClick={() => setIsMobileTocOpen(false)}
            className="fixed inset-0 bg-black/60 z-40 lg:hidden backdrop-blur-xs"
          />
          <div className="fixed inset-x-0 bottom-0 max-h-[75vh] bg-slate-900 border-t border-slate-700 rounded-t-2xl shadow-2xl z-50 flex flex-col lg:hidden animate-in slide-in-from-bottom duration-200">
            <div className="p-4 border-b border-slate-800 shrink-0">
              <div className="flex items-center justify-between mb-2">
                <span className="font-bold text-slate-200 text-xs uppercase tracking-wider">
                  Table of Contents ({filteredToc.length})
                </span>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => {
                      const main = document.getElementById('main-content');
                      if (main) main.scrollTo({ top: 0, behavior: 'smooth' });
                      setIsMobileTocOpen(false);
                    }}
                    className="text-[11px] text-slate-300 bg-slate-800 px-2 py-0.5 rounded border border-slate-700"
                  >
                    &uarr; Top
                  </button>
                  <button
                    onClick={() => setIsMobileTocOpen(false)}
                    className="text-slate-400 hover:text-white px-2 py-0.5 rounded bg-slate-800 border border-slate-700 text-xs font-bold"
                  >
                    ✕
                  </button>
                </div>
              </div>
              <input
                type="text"
                placeholder="Filter chapters..."
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500"
              />
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-1">
              {filteredToc.map((item, idx) => {
                const isActive = activeId === item.id;
                return (
                  <a
                    key={idx}
                    href={`#${item.id}`}
                    onClick={(e) => scrollToHeading(e, item.id)}
                    className={`block py-2 transition-colors truncate rounded px-2.5 text-xs ${
                      isActive
                        ? 'text-blue-400 bg-slate-800 font-bold border-l-2 border-blue-500'
                        : 'text-slate-300 hover:bg-slate-800/60'
                    } ${item.level === 2 ? 'pl-4 text-[11.5px]' : 'font-semibold'}`}
                  >
                    {item.text}
                  </a>
                );
              })}
            </div>
          </div>
        </>
      )}

      {/* Permanently Fixed Right Sidebar */}
      <aside className="w-64 lg:w-72 hidden lg:flex flex-col fixed top-0 right-0 h-screen bg-slate-900 border-l border-slate-800 text-xs z-30 shrink-0">
        {/* Fixed Header of TOC */}
        <div className="p-3 border-b border-slate-800 shrink-0 bg-slate-900">
          {/* Quick Study Action Tools Pinned at Top of Right Sidebar */}
          {(onToggleNotes || onToggleSticky || onToggleEdit || onTogglePlayground) && (
            <div className="grid grid-cols-5 gap-1 mb-3">
              {onTogglePlayground && (
                <button
                  onClick={onTogglePlayground}
                  className={`px-1 py-1 rounded text-[10px] font-medium border text-center transition-colors flex items-center justify-center space-x-0.5 ${
                    isPlaygroundOpen
                      ? 'bg-emerald-600 border-emerald-500 text-white font-semibold shadow-xs'
                      : 'bg-emerald-950/60 border-emerald-800/80 text-emerald-400 hover:text-white hover:bg-emerald-900/60'
                  }`}
                  title="Open VS Code Playground & Code Runner"
                >
                  <span>▶ Run</span>
                </button>
              )}
              {onToggleNotes && (
                <button
                  onClick={onToggleNotes}
                  className={`px-1 py-1 rounded text-[10px] font-medium border text-center transition-colors ${
                    isNotesOpen
                      ? 'bg-blue-600 border-blue-500 text-white font-semibold shadow-xs'
                      : 'bg-slate-800 border-slate-700 text-slate-300 hover:text-white hover:bg-slate-750'
                  }`}
                  title="Open side-by-side study notes"
                >
                  Notes
                </button>
              )}
              {onToggleSticky && (
                <button
                  onClick={onToggleSticky}
                  className={`px-1 py-1 rounded text-[10px] font-medium border text-center transition-colors ${
                    isStickyOpen
                      ? 'bg-amber-600 border-amber-500 text-white font-semibold shadow-xs'
                      : 'bg-slate-800 border-slate-700 text-slate-300 hover:text-white hover:bg-slate-750'
                  }`}
                  title="Toggle draggable sticky note"
                >
                  Sticky
                </button>
              )}
              {onToggleEdit && (
                <button
                  onClick={onToggleEdit}
                  className={`px-1 py-1 rounded text-[10px] font-medium border text-center transition-colors ${
                    isEditMode
                      ? 'bg-emerald-600 border-emerald-500 text-white font-semibold shadow-xs'
                      : 'bg-slate-800 border-slate-700 text-slate-300 hover:text-white hover:bg-slate-750'
                  }`}
                  title="Enable inline document editing"
                >
                  {isEditMode ? 'Save' : 'Edit'}
                </button>
              )}
              <Link
                href="/notes"
                className="px-1 py-1 rounded text-[10px] font-medium border border-purple-800/80 bg-purple-950/40 text-purple-300 hover:bg-purple-900/60 hover:text-white text-center transition-colors flex items-center justify-center space-x-0.5"
                title="Open Global Notes Studio"
              >
                <span>Studio</span>
              </Link>
            </div>
          )}

          <div className="flex items-center justify-between mb-2">
            <div className="font-semibold text-slate-300 uppercase tracking-wider text-[10.5px]">
              On This Page
            </div>
            <button
              onClick={() => {
                const main = document.getElementById('main-content');
                if (main) main.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="text-[10px] text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 px-2 py-0.5 rounded border border-slate-700 transition-colors"
              title="Scroll to top of document"
            >
              &uarr; Top
            </button>
          </div>

          <input
            type="text"
            placeholder="Filter sections..."
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500"
          />
        </div>

        {/* Scrollable list of headings */}
        <div className="flex-1 overflow-y-auto p-3 space-y-0.5">
          {filteredToc.map((item, idx) => {
            const isActive = activeId === item.id;
            return (
              <a
                key={idx}
                href={`#${item.id}`}
                onClick={(e) => scrollToHeading(e, item.id)}
                className={`block py-1 transition-colors truncate cursor-pointer rounded px-1.5 ${
                  isActive
                    ? 'text-blue-400 bg-slate-800/90 font-semibold border-l-2 border-blue-500 pl-2'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                } ${item.level === 2 ? 'text-[11.5px] ml-1' : 'font-medium text-xs'}`}
                title={item.text}
              >
                {item.text}
              </a>
            );
          })}
        </div>
      </aside>
    </>
  );
}
