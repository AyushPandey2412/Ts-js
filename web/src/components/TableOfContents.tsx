'use client';

import React, { useState, useEffect } from 'react';
import type { TableOfContentsItem } from '@/lib/modules';

interface Props {
  toc: TableOfContentsItem[];
  onToggleNotes?: () => void;
  isNotesOpen?: boolean;
  onToggleSticky?: () => void;
  isStickyOpen?: boolean;
  onToggleEdit?: () => void;
  isEditMode?: boolean;
}

export default function TableOfContents({
  toc,
  onToggleNotes,
  isNotesOpen = false,
  onToggleSticky,
  isStickyOpen = false,
  onToggleEdit,
  isEditMode = false,
}: Props) {
  const [filter, setFilter] = useState('');
  const [activeId, setActiveId] = useState<string>('');

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
  };

  return (
    <>
      {/* Mobile Floating Action Dock (Visible only on < lg screens) */}
      <div className="lg:hidden fixed bottom-6 right-20 z-40 flex items-center space-x-1.5 bg-slate-900/95 border border-slate-700 px-2 py-1.5 rounded-full shadow-xl backdrop-blur-xs text-xs">
        {onToggleNotes && (
          <button
            onClick={onToggleNotes}
            className={`px-2 py-1 rounded-full text-[11px] font-semibold border ${
              isNotesOpen ? 'bg-blue-600 text-white border-blue-500' : 'bg-slate-800 text-slate-300 border-slate-700'
            }`}
          >
            Notes
          </button>
        )}
        {onToggleSticky && (
          <button
            onClick={onToggleSticky}
            className={`px-2 py-1 rounded-full text-[11px] font-semibold border ${
              isStickyOpen ? 'bg-amber-600 text-white border-amber-500' : 'bg-slate-800 text-slate-300 border-slate-700'
            }`}
          >
            Sticky
          </button>
        )}
        {onToggleEdit && (
          <button
            onClick={onToggleEdit}
            className={`px-2 py-1 rounded-full text-[11px] font-semibold border ${
              isEditMode ? 'bg-emerald-600 text-white border-emerald-500' : 'bg-slate-800 text-slate-300 border-slate-700'
            }`}
          >
            Edit
          </button>
        )}
      </div>

      {/* Permanently Fixed Right Sidebar */}
      <aside className="w-64 lg:w-72 hidden lg:flex flex-col fixed top-0 right-0 h-screen bg-slate-900 border-l border-slate-800 text-xs z-30 shrink-0">
        {/* Fixed Header of TOC */}
        <div className="p-3 border-b border-slate-800 shrink-0 bg-slate-900">
          {/* Quick Study Action Tools Pinned at Top of Right Sidebar */}
          {(onToggleNotes || onToggleSticky || onToggleEdit) && (
            <div className="grid grid-cols-3 gap-1.5 mb-3">
              {onToggleNotes && (
                <button
                  onClick={onToggleNotes}
                  className={`px-1.5 py-1 rounded text-[11px] font-medium border text-center transition-colors ${
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
                  className={`px-1.5 py-1 rounded text-[11px] font-medium border text-center transition-colors ${
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
                  className={`px-1.5 py-1 rounded text-[11px] font-medium border text-center transition-colors ${
                    isEditMode
                      ? 'bg-emerald-600 border-emerald-500 text-white font-semibold shadow-xs'
                      : 'bg-slate-800 border-slate-700 text-slate-300 hover:text-white hover:bg-slate-750'
                  }`}
                  title="Enable inline document editing"
                >
                  {isEditMode ? 'Save' : 'Edit Doc'}
                </button>
              )}
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
