'use client';

import React, { useState, useEffect, useRef } from 'react';
import type { ModuleMeta, TableOfContentsItem } from '@/lib/modules';
import TableOfContents from '@/components/TableOfContents';

interface Props {
  slug: string;
  meta: ModuleMeta;
  initialHtml: string;
  toc: TableOfContentsItem[];
}

type StickyColor = 'amber' | 'emerald' | 'blue' | 'purple';

const colorThemes: Record<StickyColor, { bg: string; border: string; header: string; text: string }> = {
  amber: {
    bg: 'bg-amber-950/95',
    border: 'border-amber-600',
    header: 'bg-amber-900/90 text-amber-100',
    text: 'text-amber-100'
  },
  emerald: {
    bg: 'bg-emerald-950/95',
    border: 'border-emerald-600',
    header: 'bg-emerald-900/90 text-emerald-100',
    text: 'text-emerald-100'
  },
  blue: {
    bg: 'bg-blue-950/95',
    border: 'border-blue-600',
    header: 'bg-blue-900/90 text-blue-100',
    text: 'text-blue-100'
  },
  purple: {
    bg: 'bg-purple-950/95',
    border: 'border-purple-600',
    header: 'bg-purple-900/90 text-purple-100',
    text: 'text-purple-100'
  }
};

export default function InteractiveReader({ slug, meta, initialHtml, toc }: Props) {
  const contentRef = useRef<HTMLDivElement>(null);

  // Storage keys
  const editStorageKey = `js_masterclass_edit_${slug}`;
  const notesStorageKey = `js_masterclass_notes_${slug}`;
  const stickyStorageKey = `js_masterclass_sticky_${slug}`;
  const stickyPosKey = `js_masterclass_sticky_pos`;

  // Document states
  const [customHtml, setCustomHtml] = useState<string | null>(() => {
    if (typeof window === 'undefined') return null;
    try {
      return localStorage.getItem(`js_masterclass_edit_${slug}`);
    } catch {
      return null;
    }
  });
  const [isEditMode, setIsEditMode] = useState(false);

  // Derived content
  const htmlContent = customHtml ?? initialHtml;
  const hasCustomEdits = customHtml !== null;

  // Notes drawer state (NO BLUR, side-by-side reading & writing)
  const [isNotesOpen, setIsNotesOpen] = useState(false);
  const [moduleNotes, setModuleNotes] = useState<string>(() => {
    if (typeof window === 'undefined') return '';
    try {
      return localStorage.getItem(`js_masterclass_notes_${slug}`) || '';
    } catch {
      return '';
    }
  });

  // Draggable Sticky note state
  const [isStickyOpen, setIsStickyOpen] = useState(false);
  const [stickyText, setStickyText] = useState<string>(() => {
    if (typeof window === 'undefined') return '';
    try {
      return localStorage.getItem(`js_masterclass_sticky_${slug}`) || '';
    } catch {
      return '';
    }
  });
  const [isStickyMinimized, setIsStickyMinimized] = useState(false);
  const [stickyColor, setStickyColor] = useState<StickyColor>('amber');
  const [stickyPos, setStickyPos] = useState<{ x: number; y: number }>(() => {
    if (typeof window === 'undefined') return { x: 320, y: 100 };
    try {
      const saved = localStorage.getItem('js_masterclass_sticky_pos');
      if (saved) return JSON.parse(saved);
      return { x: Math.max(20, window.innerWidth - 650), y: 100 };
    } catch {
      return { x: 320, y: 100 };
    }
  });

  // Dragging refs
  const isDraggingRef = useRef(false);
  const dragOffsetRef = useRef({ x: 0, y: 0 });

  // Text selection highlight popup state
  const [selectionPopup, setSelectionPopup] = useState<{ x: number; y: number } | null>(null);

  // Handle Dragging Sticky Note
  const handleStickyHeaderMouseDown = (e: React.MouseEvent) => {
    isDraggingRef.current = true;
    dragOffsetRef.current = {
      x: e.clientX - stickyPos.x,
      y: e.clientY - stickyPos.y
    };
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDraggingRef.current) return;
      const newX = Math.max(10, Math.min(window.innerWidth - 300, e.clientX - dragOffsetRef.current.x));
      const newY = Math.max(10, Math.min(window.innerHeight - 80, e.clientY - dragOffsetRef.current.y));
      setStickyPos({ x: newX, y: newY });
    };

    const handleMouseUp = () => {
      if (isDraggingRef.current) {
        isDraggingRef.current = false;
        try {
          localStorage.setItem(stickyPosKey, JSON.stringify(stickyPos));
        } catch {
          // Ignore
        }
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [stickyPos, stickyPosKey]);

  // Save notes
  const handleNotesChange = (text: string) => {
    setModuleNotes(text);
    try {
      localStorage.setItem(notesStorageKey, text);
    } catch {
      // Ignore
    }
  };

  // Save sticky text
  const handleStickyChange = (text: string) => {
    setStickyText(text);
    try {
      localStorage.setItem(stickyStorageKey, text);
    } catch {
      // Ignore
    }
  };

  // Save edited document HTML
  const saveDocumentEdits = () => {
    if (contentRef.current) {
      const currentHtml = contentRef.current.innerHTML;
      setCustomHtml(currentHtml);
      try {
        localStorage.setItem(editStorageKey, currentHtml);
      } catch {
        // Ignore
      }
      setIsEditMode(false);
    }
  };

  // Reset document to official original
  const resetDocumentEdits = () => {
    if (window.confirm('Reset this document to the original textbook? Any custom text edits will be removed.')) {
      try {
        localStorage.removeItem(editStorageKey);
      } catch {
        // Ignore
      }
      setCustomHtml(null);
      setIsEditMode(false);
    }
  };

  const savedRangeRef = useRef<Range | null>(null);

  // Detect text selection for highlight popup
  const handleMouseUp = () => {
    const sel = window.getSelection();
    if (!sel || sel.isCollapsed || sel.toString().trim().length === 0) {
      setSelectionPopup(null);
      savedRangeRef.current = null;
      return;
    }

    try {
      const range = sel.getRangeAt(0);
      savedRangeRef.current = range.cloneRange();
      const rect = range.getBoundingClientRect();
      if (rect.width > 0 && rect.height > 0) {
        setSelectionPopup({
          x: rect.left + rect.width / 2,
          y: Math.max(10, rect.top - 45)
        });
      }
    } catch {
      setSelectionPopup(null);
      savedRangeRef.current = null;
    }
  };

  // Apply highlight color to current selection
  const applyHighlight = (color: string) => {
    const range = savedRangeRef.current ?? (window.getSelection()?.rangeCount ? window.getSelection()!.getRangeAt(0) : null);
    if (!range) return;

    try {
      const span = document.createElement('mark');
      span.style.backgroundColor = color;
      span.style.color = '#000000';
      span.style.padding = '1px 3px';
      span.style.borderRadius = '3px';
      span.className = 'custom-highlight';

      const fragment = range.extractContents();
      span.appendChild(fragment);
      range.insertNode(span);

      if (contentRef.current) {
        const updated = contentRef.current.innerHTML;
        setCustomHtml(updated);
        localStorage.setItem(editStorageKey, updated);
      }
    } catch {
      // Fallback
    }

    window.getSelection()?.removeAllRanges();
    savedRangeRef.current = null;
    setSelectionPopup(null);
  };

  const removeHighlight = () => {
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0) return;

    try {
      const node = sel.anchorNode?.parentElement;
      if (node && node.tagName.toLowerCase() === 'mark') {
        const parent = node.parentNode;
        while (node.firstChild) {
          parent?.insertBefore(node.firstChild, node);
        }
        parent?.removeChild(node);

        if (contentRef.current) {
          const updated = contentRef.current.innerHTML;
          setCustomHtml(updated);
          localStorage.setItem(editStorageKey, updated);
        }
      }
    } catch {
      // Ignore
    }
    setSelectionPopup(null);
  };

  const exportNotes = () => {
    const blob = new Blob([moduleNotes], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${slug}-notes.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const theme = colorThemes[stickyColor];

  return (
    <div className="w-full min-h-screen lg:pr-72 relative" onMouseUp={handleMouseUp}>
      {/* Floating Highlight Toolbar */}
      {selectionPopup && (
        <div
          style={{ top: `${selectionPopup.y}px`, left: `${selectionPopup.x}px` }}
          onMouseDown={(e) => {
            e.preventDefault();
            e.stopPropagation();
          }}
          onMouseUp={(e) => e.stopPropagation()}
          className="fixed -translate-x-1/2 z-50 bg-slate-900 border border-slate-700 rounded-md shadow-xl px-2 py-1 flex items-center space-x-1.5 text-xs animate-in fade-in"
        >
          <span className="text-[10px] text-slate-400 font-semibold mr-1">Highlight:</span>
          <button
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => applyHighlight('#fde047')}
            className="w-5 h-5 rounded-full bg-yellow-300 hover:scale-110 transition-transform border border-yellow-500"
            title="Yellow highlight"
          />
          <button
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => applyHighlight('#86efac')}
            className="w-5 h-5 rounded-full bg-emerald-300 hover:scale-110 transition-transform border border-emerald-500"
            title="Green highlight"
          />
          <button
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => applyHighlight('#93c5fd')}
            className="w-5 h-5 rounded-full bg-blue-300 hover:scale-110 transition-transform border border-blue-500"
            title="Blue highlight"
          />
          <button
            onMouseDown={(e) => e.preventDefault()}
            onClick={removeHighlight}
            className="text-[10px] text-slate-400 hover:text-white px-1.5 py-0.5 rounded bg-slate-800 hover:bg-slate-700 ml-1"
            title="Remove highlight"
          >
            Clear
          </button>
        </div>
      )}

      {/* Main Reading Container */}
      <div className="max-w-4xl mx-auto px-4 sm:px-8 py-8 min-w-0">
        {/* Module Header */}
        <div className="border-b border-slate-800 pb-5 mb-6">
          <div className="flex items-center justify-between gap-3 mb-3">
            <div className="text-xs font-mono text-blue-400 font-bold">
              Module {meta.number} / {meta.badge}
            </div>

            {hasCustomEdits && !isEditMode && (
              <button
                onClick={resetDocumentEdits}
                className="px-2 py-1 rounded text-[11px] text-slate-500 hover:text-rose-400 bg-slate-900 border border-slate-800 hover:border-rose-900/50 transition-colors"
                title="Reset to official textbook original"
              >
                Reset to Original
              </button>
            )}
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight mb-2">
            {meta.title}
          </h1>
          <p className="text-slate-400 text-xs sm:text-sm leading-relaxed">
            {meta.subtitle}
          </p>
        </div>

        {/* Edit Mode Notification Banner */}
        {isEditMode && (
          <div className="bg-blue-950/80 border border-blue-700 text-blue-200 text-xs px-4 py-2.5 rounded mb-6 flex items-center justify-between sticky top-4 z-20 shadow-lg">
            <span>
              <strong>Edit Mode Active:</strong> Click anywhere in the text below to edit or type custom notes directly in the textbook.
            </span>
            <div className="flex items-center space-x-2 shrink-0 ml-3">
              <button
                onClick={saveDocumentEdits}
                className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded font-semibold text-xs"
              >
                Save Edits
              </button>
              <button
                onClick={() => setIsEditMode(false)}
                className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded text-xs border border-slate-700"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Rendered & Editable Markdown Body */}
        <div
          ref={contentRef}
          contentEditable={isEditMode}
          suppressContentEditableWarning={true}
          className={`markdown-body ${
            isEditMode ? 'ring-2 ring-blue-500/50 p-4 rounded bg-slate-900/40 outline-none' : ''
          }`}
          dangerouslySetInnerHTML={{ __html: htmlContent }}
        />
      </div>

      {/* Permanently Fixed Right Table of Contents with Integrated Action Tools */}
      <TableOfContents
        toc={toc}
        onToggleNotes={() => setIsNotesOpen(!isNotesOpen)}
        isNotesOpen={isNotesOpen}
        onToggleSticky={() => setIsStickyOpen(!isStickyOpen)}
        isStickyOpen={isStickyOpen}
        onToggleEdit={() => (isEditMode ? saveDocumentEdits() : setIsEditMode(true))}
        isEditMode={isEditMode}
      />

      {/* Draggable Sticky Note Widget */}
      {isStickyOpen && (
        <div
          style={{ top: `${stickyPos.y}px`, left: `${stickyPos.x}px` }}
          className={`fixed z-40 w-72 ${theme.bg} border-2 ${theme.border} rounded-lg shadow-2xl overflow-hidden flex flex-col`}
        >
          {/* Draggable Header */}
          <div
            onMouseDown={handleStickyHeaderMouseDown}
            className={`${theme.header} px-3 py-2 flex items-center justify-between text-xs font-bold border-b border-white/10 cursor-grab active:cursor-grabbing select-none`}
            title="Click and drag to move anywhere on your screen"
          >
            <div className="flex items-center space-x-1.5">
              <span>&#10022;</span>
              <span className="tracking-wide">Sticky Note</span>
              <span className="text-[10px] opacity-60 font-normal">(Drag me)</span>
            </div>
            <div className="flex items-center space-x-1.5">
              {/* Color switcher pills */}
              <button
                onClick={() => setStickyColor('amber')}
                className="w-3 h-3 rounded-full bg-amber-400 border border-white/40"
                title="Amber theme"
              />
              <button
                onClick={() => setStickyColor('emerald')}
                className="w-3 h-3 rounded-full bg-emerald-400 border border-white/40"
                title="Emerald theme"
              />
              <button
                onClick={() => setStickyColor('blue')}
                className="w-3 h-3 rounded-full bg-blue-400 border border-white/40"
                title="Blue theme"
              />
              <button
                onClick={() => setStickyColor('purple')}
                className="w-3 h-3 rounded-full bg-purple-400 border border-white/40"
                title="Purple theme"
              />

              <button
                onClick={() => setIsStickyMinimized(!isStickyMinimized)}
                className="hover:text-white px-1 font-mono text-xs"
                title={isStickyMinimized ? 'Expand' : 'Minimize'}
              >
                {isStickyMinimized ? '+' : '-'}
              </button>
              <button
                onClick={() => setIsStickyOpen(false)}
                className="hover:text-white px-1 font-mono text-xs font-bold"
                title="Close sticky note"
              >
                x
              </button>
            </div>
          </div>

          {/* Sticky Textarea */}
          {!isStickyMinimized && (
            <textarea
              value={stickyText}
              onChange={(e) => handleStickyChange(e.target.value)}
              placeholder="Jot down quick reminders, scratch calculations, questions to re-check..."
              className={`w-full h-44 p-3 bg-transparent ${theme.text} text-xs placeholder-white/40 resize-none focus:outline-none font-mono leading-relaxed`}
            />
          )}
        </div>
      )}

      {/* Docked Notes Panel (Zero backdrop blur - side-by-side reading!) */}
      {isNotesOpen && (
        <div className="fixed top-0 right-0 h-screen w-80 sm:w-96 bg-slate-900 border-l border-slate-700 shadow-2xl z-40 flex flex-col p-4 animate-in slide-in-from-right duration-150">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-3">
            <div>
              <h3 className="text-sm font-bold text-white tracking-tight flex items-center space-x-1.5">
                <span>&#9998;</span>
                <span>Module Notes</span>
              </h3>
              <span className="text-[11px] text-slate-400">
                Module {meta.number}: {meta.title.slice(0, 24)}...
              </span>
            </div>
            <button
              onClick={() => setIsNotesOpen(false)}
              className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white text-xs font-semibold border border-slate-700"
              title="Close notes panel"
            >
              Close
            </button>
          </div>

          <textarea
            value={moduleNotes}
            onChange={(e) => handleNotesChange(e.target.value)}
            placeholder="Type your notes while reading the document on the left. No blur, auto-saved continuously..."
            className="flex-1 w-full bg-slate-950 border border-slate-800 rounded p-3 text-xs text-slate-200 placeholder-slate-500 resize-none focus:outline-none focus:border-blue-500 font-mono leading-relaxed"
          />

          <div className="flex items-center justify-between pt-3 border-t border-slate-800 mt-3 text-xs">
            <span className="text-slate-500 font-mono">{moduleNotes.length} chars</span>
            <div className="flex items-center space-x-2">
              <button
                onClick={exportNotes}
                className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700"
                title="Export notes as .txt file"
              >
                Export .txt
              </button>
              <button
                onClick={() => handleNotesChange('')}
                className="px-2 py-1 text-slate-500 hover:text-rose-400 text-xs"
                title="Clear all notes"
              >
                Clear
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
