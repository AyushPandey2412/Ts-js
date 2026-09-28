'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { MODULES, type ModuleMeta } from '@/lib/modules-meta';
import { notesMarked, convertToMasterclassFormat } from '@/lib/notes-converter';

export interface SavedNote {
  id: string;
  title: string;
  content: string;
  moduleSlug: string;
  updatedAt: number;
}

const STORAGE_KEY = 'masterclass_notes_studio_v1';

const STARTER_NOTE: SavedNote = {
  id: 'starter-1',
  title: 'V8 Engine Memory Architecture & Event Loop Notes',
  moduleSlug: '01-engine-memory-execution-context',
  updatedAt: Date.now(),
  content: `# V8 Engine Memory Architecture & Event Loop Notes

> **Target Module:** \`01-engine-memory-execution-context\`  
> **Engineering Level:** Staff Systems Architect  
> **Last Updated:** Today  
> **Status:** Verified Active Notes

---

## 01. Mental Model & First Principles

> [!IMPORTANT]
> The JavaScript Call Stack is single-threaded, but libuv provides an asynchronous background threadpool (default 4 threads) for heavy file I/O, DNS resolution, and crypto operations.

JavaScript execution in V8 relies on three distinct memory spaces:
1. **Stack Memory:** Fast, contiguous memory storing execution context frames, primitive values, and heap pointers.
2. **Young Generation Heap:** Short-lived objects collected via high-speed Scavenge (semi-space copy).
3. **Old Generation Heap:** Long-lived objects surviving multiple Scavenge rounds, managed by Mark-Sweep-Compact.

---

## 02. Syntax & Implementation Breakdown

\`\`\`javascript
import { Buffer } from 'node:buffer';

export function demonstrateMicrotaskPriority() {
  console.log('1. Synchronous Stack Frame');

  setTimeout(() => {
    console.log('4. Macrotask Timer Phase (libuv loop)');
  }, 0);

  Promise.resolve().then(() => {
    console.log('2. Microtask Reaction Queue');
  });

  queueMicrotask(() => {
    console.log('3. Secondary Microtask Queue');
  });
}
\`\`\`

---

## 03. Production Best Practices & Architectural Tradeoffs

| Practice | Verdict | Engineering Rationale & V8 Impact |
|---|---|---|
| Initialize Object Properties in Constructor | **DO** | Ensures consistent Hidden Class (Map) shape transitions across allocations. |
| The \`delete\` Operator | **DON'T** | Forces V8 into slow dictionary mode (hash table lookups), de-optimizing inline caches. |
| TypedArray Memory Pools | **DO** | Bypasses garbage collector scanning and eliminates memory fragmentation. |

---

## 04. Senior Engineering Interview Challenge

<details>
<summary>Click to Reveal Deep Dive Explanation & Solution</summary>

### V8 Hidden Class Shape Divergence

When two instances of an object are created with properties assigned in different orders:
- \`objA = { x: 1, y: 2 }\` -> Transitions: \`Root -> Map1(x) -> Map2(x, y)\`
- \`objB = { y: 2, x: 1 }\` -> Transitions: \`Root -> Map3(y) -> Map4(y, x)\`

Even though \`objA\` and \`objB\` have identical properties, they possess **different hidden classes**, causing polymorphic inline cache misses in hot loops!

</details>

---

## 05. Verification Checklist

- [x] Verified against ECMAScript ECMA-262 execution specifications.
- [x] Zero-copy memory pooling applied to all high-throughput network streams.
- [x] Constant-time comparisons applied for authentication tokens.
`
};

export default function NotesStudioClient() {
  const [notes, setNotes] = useState<SavedNote[]>([]);
  const [activeNoteId, setActiveNoteId] = useState<string>('starter-1');
  const [title, setTitle] = useState<string>('');
  const [content, setContent] = useState<string>('');
  const [moduleSlug, setModuleSlug] = useState<string>('01-engine-memory-execution-context');
  
  // UI States
  const [viewMode, setViewMode] = useState<'editor' | 'preview' | 'split'>('split');
  const [isLibraryOpen, setIsLibraryOpen] = useState(true);
  const [searchFilter, setSearchFilter] = useState('');
  const [selectedModuleFilter, setSelectedModuleFilter] = useState('all');
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isAppending, setIsAppending] = useState(false);
  const [showAppendConfirm, setShowAppendConfirm] = useState(false);

  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Responsive default layout on mobile
  useEffect(() => {
    if (typeof window !== 'undefined' && window.innerWidth < 768) {
      setIsLibraryOpen(false);
      setViewMode('editor');
    }
  }, []);

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setNotes(parsed);
          const first = parsed[0];
          setActiveNoteId(first.id);
          setTitle(first.title);
          setContent(first.content);
          setModuleSlug(first.moduleSlug || '');
          return;
        }
      }
    } catch {
      // ignore
    }

    // Default starter note
    setNotes([STARTER_NOTE]);
    setActiveNoteId(STARTER_NOTE.id);
    setTitle(STARTER_NOTE.title);
    setContent(STARTER_NOTE.content);
    setModuleSlug(STARTER_NOTE.moduleSlug);
  }, []);

  // Show auto-dismissing toast
  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Auto-save active note changes to state & localStorage
  const saveCurrentNote = (newTitle?: string, newContent?: string, newModuleSlug?: string) => {
    const updatedTitle = newTitle !== undefined ? newTitle : title;
    const updatedContent = newContent !== undefined ? newContent : content;
    const updatedModule = newModuleSlug !== undefined ? newModuleSlug : moduleSlug;

    setNotes((prevNotes) => {
      const updated = prevNotes.map((n) => {
        if (n.id === activeNoteId) {
          return {
            ...n,
            title: updatedTitle,
            content: updatedContent,
            moduleSlug: updatedModule,
            updatedAt: Date.now(),
          };
        }
        return n;
      });
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      } catch {
        // ignore
      }
      return updated;
    });
  };

  // Switch active note
  const handleSelectNote = (note: SavedNote) => {
    saveCurrentNote(); // save current before switching
    setActiveNoteId(note.id);
    setTitle(note.title);
    setContent(note.content);
    setModuleSlug(note.moduleSlug || '');
  };

  // Create new blank note
  const handleCreateNewNote = () => {
    saveCurrentNote();
    const newId = 'note-' + Date.now();
    const newNote: SavedNote = {
      id: newId,
      title: 'Untitled Engineering Note',
      content: '# Untitled Engineering Note\n\n> Write your core observations and architectural concepts here...\n',
      moduleSlug: moduleSlug || '01-engine-memory-execution-context',
      updatedAt: Date.now(),
    };
    const updated = [newNote, ...notes];
    setNotes(updated);
    setActiveNoteId(newId);
    setTitle(newNote.title);
    setContent(newNote.content);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch {
      // ignore
    }
    triggerToast('Created new note!');
  };

  // Delete note
  const handleDeleteNote = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (notes.length <= 1) {
      triggerToast('Cannot delete the last remaining note.');
      return;
    }
    const filtered = notes.filter((n) => n.id !== id);
    setNotes(filtered);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
    } catch {
      // ignore
    }
    if (activeNoteId === id) {
      const nextNote = filtered[0];
      setActiveNoteId(nextNote.id);
      setTitle(nextNote.title);
      setContent(nextNote.content);
      setModuleSlug(nextNote.moduleSlug || '');
    }
    triggerToast('Note deleted.');
  };

  // Convert to Masterclass Format
  const handleConvertToMasterclass = () => {
    const selectedMeta = MODULES.find((m) => m.slug === moduleSlug);
    const converted = convertToMasterclassFormat(content, title, selectedMeta?.title);
    setContent(converted);
    saveCurrentNote(title, converted, moduleSlug);
    triggerToast('Converted to Masterclass Engineering Module format! 🚀');
  };

  // Move / Append directly to Module Markdown File on Disk
  const handleAppendToModuleFile = async () => {
    if (!moduleSlug) {
      triggerToast('Please select a target module first.');
      return;
    }
    setIsAppending(true);
    try {
      const res = await fetch('/api/notes/append', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          moduleSlug,
          noteTitle: title,
          noteContent: content,
        }),
      });
      const data = await res.json();
      if (data.success) {
        triggerToast(`🎉 ${data.message}`);
        setShowAppendConfirm(false);
      } else {
        triggerToast(`Error: ${data.error || 'Failed to append note.'}`);
      }
    } catch (err) {
      triggerToast(`Network error: ${err instanceof Error ? err.message : 'Unknown'}`);
    } finally {
      setIsAppending(false);
    }
  };

  // Insert helper for toolbar
  const insertText = (before: string, after: string = '', defaultText: string = '') => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const currentText = textarea.value;

    const selected = currentText.substring(start, end) || defaultText;
    const replacement = before + selected + after;

    const newContent = currentText.substring(0, start) + replacement + currentText.substring(end);
    setContent(newContent);
    saveCurrentNote(title, newContent, moduleSlug);

    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + before.length, start + before.length + selected.length);
    }, 10);
  };

  // Word & Reading statistics
  const wordCount = content.trim().split(/\s+/).filter(Boolean).length;
  const charCount = content.length;
  const readingTimeMin = Math.max(1, Math.ceil(wordCount / 200));

  // Export handlers
  const handleDownloadMarkdown = () => {
    const blob = new Blob([content], { type: 'text/markdown;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${title.toLowerCase().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-') || 'note'}.md`;
    link.click();
    URL.revokeObjectURL(url);
    triggerToast('Downloaded Markdown file!');
  };

  const handleCopyMarkdown = () => {
    navigator.clipboard.writeText(content);
    triggerToast('Copied raw Markdown to clipboard!');
  };

  // Filtered notes list
  const filteredNotes = notes.filter((n) => {
    const matchesSearch =
      n.title.toLowerCase().includes(searchFilter.toLowerCase()) ||
      n.content.toLowerCase().includes(searchFilter.toLowerCase());
    const matchesModule = selectedModuleFilter === 'all' || n.moduleSlug === selectedModuleFilter;
    return matchesSearch && matchesModule;
  });

  // Rendered HTML for preview
  const renderedPreviewHtml = notesMarked.parse(content || '*No content to preview*') as string;

  return (
    <div className="flex h-[calc(100vh-3.5rem)] md:h-screen w-full overflow-hidden bg-slate-950 text-slate-100 font-sans">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 px-4 py-2.5 bg-blue-600 text-white rounded-lg shadow-xl text-xs font-semibold flex items-center space-x-2 border border-blue-400/40 animate-in fade-in slide-in-from-bottom-2">
          <span>⚡</span>
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Append to Module Modal Dialog */}
      {showAppendConfirm && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-lg bg-blue-600/20 text-blue-400 flex items-center justify-center text-xl font-bold">
                📥
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Append to Module File</h3>
                <p className="text-xs text-slate-400">Permanently inject this note into the module on disk</p>
              </div>
            </div>

            <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 text-xs space-y-1">
              <div className="text-slate-400">Target Module:</div>
              <div className="font-semibold text-blue-400">
                {MODULES.find((m) => m.slug === moduleSlug)?.title || moduleSlug}
              </div>
              <div className="text-slate-500 font-mono text-[11px] pt-1">
                File: {MODULES.find((m) => m.slug === moduleSlug)?.fileName}
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              This action will append your formatted note under a dedicated <code className="text-blue-300">## 📝 Personal Study Notes</code> section at the bottom of the module&apos;s Markdown file.
            </p>

            <div className="flex justify-end space-x-2 pt-2">
              <button
                onClick={() => setShowAppendConfirm(false)}
                className="px-4 py-2 rounded text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                disabled={isAppending}
              >
                Cancel
              </button>
              <button
                onClick={handleAppendToModuleFile}
                disabled={isAppending}
                className="px-4 py-2 rounded text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white transition-colors flex items-center space-x-1.5 shadow-md"
              >
                {isAppending ? (
                  <>
                    <span className="animate-spin text-sm">⏳</span>
                    <span>Appending...</span>
                  </>
                ) : (
                  <>
                    <span>Confirm & Append</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Mobile backdrop for notes library */}
      {isLibraryOpen && (
        <div
          onClick={() => setIsLibraryOpen(false)}
          className="fixed inset-0 bg-black/60 z-25 md:hidden backdrop-blur-xs"
        />
      )}

      {/* Left Sidebar: Notes Library & Module Manager */}
      <aside
        className={`${
          isLibraryOpen
            ? 'w-80 max-md:fixed max-md:inset-y-0 max-md:left-0 max-md:z-30 max-md:w-72 max-md:shadow-2xl'
            : 'w-0'
        } transition-all duration-200 ease-in-out border-r border-slate-800 bg-slate-900 flex flex-col shrink-0 overflow-hidden z-20`}
      >
        {/* Library Header */}
        <div className="p-3.5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="w-6 h-6 rounded bg-blue-600/30 text-blue-400 border border-blue-500/40 flex items-center justify-center text-xs font-bold font-mono">
              📝
            </span>
            <span className="text-xs font-bold uppercase tracking-wider text-slate-300">Notes Studio</span>
          </div>
          <button
            onClick={handleCreateNewNote}
            className="flex items-center space-x-1 px-2.5 py-1 bg-blue-600 hover:bg-blue-500 text-white rounded text-xs font-semibold shadow-xs transition-colors"
            title="Create New Note"
          >
            <span>+</span>
            <span>New Note</span>
          </button>
        </div>

        {/* Filter & Search Bar */}
        <div className="p-2.5 border-b border-slate-800 space-y-2">
          <input
            type="text"
            placeholder="Search notes..."
            value={searchFilter}
            onChange={(e) => setSearchFilter(e.target.value)}
            className="w-full px-2.5 py-1.5 bg-slate-950 border border-slate-700/80 rounded text-xs text-slate-200 placeholder-slate-500 focus:outline-hidden focus:border-blue-500"
          />

          <select
            value={selectedModuleFilter}
            onChange={(e) => setSelectedModuleFilter(e.target.value)}
            className="w-full px-2 py-1.5 bg-slate-950 border border-slate-700/80 rounded text-[11px] text-slate-300 focus:outline-hidden focus:border-blue-500"
          >
            <option value="all">Filter: All Modules ({notes.length})</option>
            {MODULES.map((m) => (
              <option key={m.slug} value={m.slug}>
                Mod {m.number}: {m.title.slice(0, 32)}...
              </option>
            ))}
          </select>
        </div>

        {/* Notes Cards List */}
        <div className="flex-1 overflow-y-auto p-2 space-y-1.5">
          {filteredNotes.length === 0 ? (
            <div className="p-6 text-center text-xs text-slate-500">
              No matching notes found. Click &quot;+ New Note&quot; to begin.
            </div>
          ) : (
            filteredNotes.map((note) => {
              const isActive = note.id === activeNoteId;
              const assignedModule = MODULES.find((m) => m.slug === note.moduleSlug);

              return (
                <div
                  key={note.id}
                  onClick={() => handleSelectNote(note)}
                  className={`p-3 rounded-lg border cursor-pointer transition-all ${
                    isActive
                      ? 'bg-blue-950/40 border-blue-500/80 text-white shadow-sm'
                      : 'bg-slate-950/40 border-slate-800/80 hover:bg-slate-800/50 text-slate-300 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <h4 className="text-xs font-semibold truncate pr-2">{note.title || 'Untitled Note'}</h4>
                    <button
                      onClick={(e) => handleDeleteNote(note.id, e)}
                      className="text-slate-500 hover:text-rose-400 p-0.5 rounded transition-colors"
                      title="Delete Note"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>

                  <div className="flex items-center justify-between mt-2 text-[10px]">
                    <span className="px-1.5 py-0.5 rounded bg-slate-800 text-blue-300 font-mono border border-slate-700/60 truncate max-w-[140px]">
                      {assignedModule ? `Mod ${assignedModule.number}` : 'Unassigned'}
                    </span>
                    <span className="text-slate-500">
                      {new Date(note.updatedAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer info */}
        <div className="p-2 border-t border-slate-800 text-[10px] text-slate-500 text-center font-mono">
          {notes.length} Personal Engineering Notes
        </div>
      </aside>

      {/* Main Studio Area */}
      <main className="flex-1 flex flex-col h-full overflow-hidden bg-slate-950">
        {/* Top Header Bar: Title, Module Selector, Actions */}
        <header className="px-4 py-2.5 border-b border-slate-800 bg-slate-900/90 flex flex-wrap items-center justify-between gap-3 shrink-0">
          {/* Toggle Library Drawer + Note Title */}
          <div className="flex items-center space-x-3 flex-1 min-w-[280px]">
            <button
              onClick={() => setIsLibraryOpen(!isLibraryOpen)}
              className="p-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs transition-colors shrink-0"
              title={isLibraryOpen ? 'Collapse library' : 'Expand library'}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" />
              </svg>
            </button>

            <input
              type="text"
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                saveCurrentNote(e.target.value, content, moduleSlug);
              }}
              placeholder="Enter note title..."
              className="flex-1 px-3 py-1 bg-slate-950/80 border border-slate-700/80 rounded-md text-sm font-bold text-white focus:outline-hidden focus:border-blue-500 truncate"
            />
          </div>

          {/* Module Assignment Dropdown */}
          <div className="flex items-center space-x-2">
            <span className="text-xs text-slate-400 font-medium hidden sm:inline">Module:</span>
            <select
              value={moduleSlug}
              onChange={(e) => {
                setModuleSlug(e.target.value);
                saveCurrentNote(title, content, e.target.value);
                triggerToast('Assigned to module!');
              }}
              className="px-2.5 py-1.5 bg-slate-950 border border-slate-700/80 rounded text-xs text-blue-300 font-semibold focus:outline-hidden focus:border-blue-500 max-w-[190px] sm:max-w-[240px] truncate"
            >
              {MODULES.map((m) => (
                <option key={m.slug} value={m.slug}>
                  Mod {m.number}: {m.title}
                </option>
              ))}
            </select>
          </div>

          {/* Primary Action Buttons */}
          <div className="flex items-center space-x-2">
            {/* Convert to Masterclass Format */}
            <button
              onClick={handleConvertToMasterclass}
              className="px-3 py-1.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded text-xs font-semibold shadow-xs flex items-center space-x-1.5 transition-all"
              title="Transform into high-rigor Masterclass layout"
            >
              <span>✨</span>
              <span className="hidden md:inline">Convert to Masterclass</span>
              <span className="md:hidden">Format</span>
            </button>

            {/* Append / Move to Module .md on Disk */}
            <button
              onClick={() => setShowAppendConfirm(true)}
              className="px-3 py-1.5 bg-emerald-600/90 hover:bg-emerald-500 text-white rounded text-xs font-semibold shadow-xs flex items-center space-x-1.5 transition-colors border border-emerald-500/50"
              title="Append this note into the actual .md file on disk"
            >
              <span>📥</span>
              <span className="hidden lg:inline">Move to Module (.md)</span>
              <span className="lg:hidden">Append</span>
            </button>

            {/* Export Dropdown */}
            <div className="relative group">
              <button
                className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded text-xs font-medium border border-slate-700 flex items-center space-x-1"
                title="Export Options"
              >
                <span>Export</span>
                <span className="text-[10px]">▼</span>
              </button>
              <div className="absolute right-0 top-full mt-1 hidden group-hover:block w-48 bg-slate-900 border border-slate-700 rounded-lg shadow-2xl py-1 z-30">
                <button
                  onClick={handleDownloadMarkdown}
                  className="w-full text-left px-3 py-1.5 text-xs text-slate-300 hover:bg-slate-800 hover:text-white flex items-center space-x-2"
                >
                  <span>💾</span>
                  <span>Download as .md</span>
                </button>
                <button
                  onClick={handleCopyMarkdown}
                  className="w-full text-left px-3 py-1.5 text-xs text-slate-300 hover:bg-slate-800 hover:text-white flex items-center space-x-2"
                >
                  <span>📋</span>
                  <span>Copy Markdown</span>
                </button>
              </div>
            </div>

            {/* View Mode Switcher Pills */}
            <div className="flex rounded-md bg-slate-950 p-0.5 border border-slate-800">
              <button
                onClick={() => setViewMode('editor')}
                className={`px-2 py-1 text-[11px] rounded font-medium transition-colors ${
                  viewMode === 'editor' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                Edit
              </button>
              <button
                onClick={() => setViewMode('split')}
                className={`px-2 py-1 text-[11px] rounded font-medium transition-colors hidden sm:block ${
                  viewMode === 'split' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                Split
              </button>
              <button
                onClick={() => setViewMode('preview')}
                className={`px-2 py-1 text-[11px] rounded font-medium transition-colors ${
                  viewMode === 'preview' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                Preview
              </button>
            </div>
          </div>
        </header>

        {/* Word-like Ribbon Toolbar */}
        <div className="px-3 py-1.5 border-b border-slate-800 bg-slate-900/60 flex items-center gap-1 shrink-0 text-slate-300 text-xs overflow-x-auto flex-nowrap scrollbar-none">
          {/* Headings */}
          <div className="flex items-center space-x-0.5 pr-2 border-r border-slate-800">
            <button
              onClick={() => insertText('# ', '\n', 'Heading 1')}
              className="px-2 py-1 rounded hover:bg-slate-800 font-bold hover:text-white"
              title="Heading 1"
            >
              H1
            </button>
            <button
              onClick={() => insertText('## ', '\n', 'Heading 2')}
              className="px-2 py-1 rounded hover:bg-slate-800 font-semibold hover:text-white"
              title="Heading 2"
            >
              H2
            </button>
            <button
              onClick={() => insertText('### ', '\n', 'Heading 3')}
              className="px-2 py-1 rounded hover:bg-slate-800 font-medium hover:text-white"
              title="Heading 3"
            >
              H3
            </button>
          </div>

          {/* Typography Inline */}
          <div className="flex items-center space-x-0.5 px-2 border-r border-slate-800">
            <button
              onClick={() => insertText('**', '**', 'bold text')}
              className="w-7 h-7 rounded hover:bg-slate-800 font-bold flex items-center justify-center hover:text-white"
              title="Bold (Ctrl+B)"
            >
              B
            </button>
            <button
              onClick={() => insertText('*', '*', 'italic text')}
              className="w-7 h-7 rounded hover:bg-slate-800 italic flex items-center justify-center hover:text-white"
              title="Italic (Ctrl+I)"
            >
              I
            </button>
            <button
              onClick={() => insertText('~~', '~~', 'strikethrough text')}
              className="w-7 h-7 rounded hover:bg-slate-800 line-through flex items-center justify-center hover:text-white"
              title="Strikethrough"
            >
              S
            </button>
            <button
              onClick={() => insertText('`', '`', 'inlineCode()')}
              className="px-1.5 h-7 rounded hover:bg-slate-800 font-mono text-[11px] flex items-center justify-center text-blue-300"
              title="Inline Code"
            >
              &lt;/&gt;
            </button>
          </div>

          {/* Lists & Tasks */}
          <div className="flex items-center space-x-0.5 px-2 border-r border-slate-800">
            <button
              onClick={() => insertText('- ', '\n', 'List item')}
              className="px-2 py-1 rounded hover:bg-slate-800 flex items-center hover:text-white"
              title="Bullet List"
            >
              • List
            </button>
            <button
              onClick={() => insertText('1. ', '\n', 'Numbered item')}
              className="px-2 py-1 rounded hover:bg-slate-800 flex items-center hover:text-white"
              title="Numbered List"
            >
              1. List
            </button>
            <button
              onClick={() => insertText('- [ ] ', '\n', 'Task item')}
              className="px-2 py-1 rounded hover:bg-slate-800 flex items-center hover:text-white"
              title="Task Checklist"
            >
              ☑ Task
            </button>
          </div>

          {/* Masterclass Components: Code Block, Alerts, Interview Card, Table */}
          <div className="flex items-center space-x-1 px-2 border-r border-slate-800">
            {/* Code Block */}
            <button
              onClick={() => insertText('```javascript\n', '\n```\n', '// Code snippet here\nconst result = true;')}
              className="px-2 py-1 rounded hover:bg-slate-800 text-amber-300 font-mono text-[11px] flex items-center space-x-1"
              title="Insert Code Block"
            >
              <span>💻</span>
              <span>Code Block</span>
            </button>

            {/* Alert Callouts Dropdown */}
            <div className="relative group">
              <button
                className="px-2 py-1 rounded hover:bg-slate-800 text-blue-300 text-xs flex items-center space-x-1"
                title="Insert Alert Box"
              >
                <span>ℹ️</span>
                <span>Alert</span>
                <span className="text-[9px]">▼</span>
              </button>
              <div className="absolute left-0 top-full mt-1 hidden group-hover:block w-40 bg-slate-900 border border-slate-700 rounded-lg shadow-2xl py-1 z-30">
                <button
                  onClick={() => insertText('> [!NOTE]\n> ', '\n', 'Background context and architectural explanation.')}
                  className="w-full text-left px-3 py-1.5 text-xs text-blue-300 hover:bg-slate-800 flex items-center space-x-1.5"
                >
                  <span>ℹ️</span>
                  <span>Note (Blue)</span>
                </button>
                <button
                  onClick={() => insertText('> [!TIP]\n> ', '\n', 'High-performance senior tip or optimization.')}
                  className="w-full text-left px-3 py-1.5 text-xs text-emerald-300 hover:bg-slate-800 flex items-center space-x-1.5"
                >
                  <span>💡</span>
                  <span>Pro Tip (Green)</span>
                </button>
                <button
                  onClick={() => insertText('> [!IMPORTANT]\n> ', '\n', 'Critical requirement or language guarantee.')}
                  className="w-full text-left px-3 py-1.5 text-xs text-purple-300 hover:bg-slate-800 flex items-center space-x-1.5"
                >
                  <span>⚡</span>
                  <span>Important (Purple)</span>
                </button>
                <button
                  onClick={() => insertText('> [!WARNING]\n> ', '\n', 'Production pitfall or memory hazard.')}
                  className="w-full text-left px-3 py-1.5 text-xs text-amber-300 hover:bg-slate-800 flex items-center space-x-1.5"
                >
                  <span>⚠️</span>
                  <span>Warning (Amber)</span>
                </button>
                <button
                  onClick={() => insertText('> [!CAUTION]\n> ', '\n', 'Security flaw or breaking change.')}
                  className="w-full text-left px-3 py-1.5 text-xs text-rose-300 hover:bg-slate-800 flex items-center space-x-1.5"
                >
                  <span>🛑</span>
                  <span>Caution (Red)</span>
                </button>
              </div>
            </div>

            {/* Collapsible Interview Card */}
            <button
              onClick={() => insertText('<details>\n<summary>Click to Reveal Solution & Trace</summary>\n\n', '\n\n</details>\n', '### Deep Dive Breakdown\n- Detailed trace and complexity analysis.')}
              className="px-2 py-1 rounded hover:bg-slate-800 text-purple-300 text-xs flex items-center space-x-1"
              title="Insert Collapsible Interview Card"
            >
              <span>🎯</span>
              <span>Interview Card</span>
            </button>

            {/* Table */}
            <button
              onClick={() => insertText('| Concept | Purpose | Tradeoff |\n|---|---|---|\n| Item A | Primary use | Low RAM |\n| Item B | Secondary | Fast speed |\n')}
              className="px-2 py-1 rounded hover:bg-slate-800 text-slate-300 text-xs flex items-center space-x-1"
              title="Insert Markdown Table"
            >
              <span>📊</span>
              <span>Table</span>
            </button>

            {/* Mermaid Diagram */}
            <button
              onClick={() => insertText('```mermaid\nflowchart TD\n  Client["Client Request"] --> Gateway["API Gateway"]\n  Gateway --> Service["Core Service"]\n```\n')}
              className="px-2 py-1 rounded hover:bg-slate-800 text-cyan-300 text-xs flex items-center space-x-1"
              title="Insert Mermaid Flowchart"
            >
              <span>📐</span>
              <span>Diagram</span>
            </button>
          </div>

          {/* Quote & Divider */}
          <div className="flex items-center space-x-1 pl-2">
            <button
              onClick={() => insertText('> ', '\n', 'Blockquote citation')}
              className="px-2 py-1 rounded hover:bg-slate-800 hover:text-white"
              title="Blockquote"
            >
              &ldquo; Quote
            </button>
            <button
              onClick={() => insertText('\n---\n\n')}
              className="px-2 py-1 rounded hover:bg-slate-800 hover:text-white"
              title="Horizontal Divider"
            >
              ― Divider
            </button>
          </div>
        </div>

        {/* Editor & Preview Workspace Container */}
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
          {/* Editor Pane */}
          {(viewMode === 'editor' || viewMode === 'split') && (
            <div className={`flex flex-col h-full ${viewMode === 'split' ? 'w-full md:w-1/2 border-b md:border-b-0 md:border-r border-slate-800' : 'w-full'}`}>
              <div className="px-4 py-1.5 bg-slate-900/40 border-b border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400 font-mono">
                <span className="flex items-center space-x-1.5">
                  <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
                  <span>Markdown / Word Editor</span>
                </span>
                <span>Type directly or paste notes</span>
              </div>
              <textarea
                ref={textareaRef}
                value={content}
                onChange={(e) => {
                  setContent(e.target.value);
                  saveCurrentNote(title, e.target.value, moduleSlug);
                }}
                placeholder="Start typing your engineering notes or paste text to convert..."
                className="flex-1 w-full p-4 sm:p-6 bg-slate-950 text-slate-100 font-mono text-sm leading-relaxed resize-none focus:outline-hidden overflow-y-auto"
                spellCheck={false}
              />
            </div>
          )}

          {/* Masterclass Preview Pane */}
          {(viewMode === 'preview' || viewMode === 'split') && (
            <div className={`flex flex-col h-full bg-slate-900/30 overflow-hidden ${viewMode === 'split' ? 'w-full md:w-1/2' : 'w-full'}`}>
              <div className="px-4 py-1.5 bg-slate-900/60 border-b border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400 font-mono">
                <span className="flex items-center space-x-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                  <span>Masterclass Formatted Live Preview</span>
                </span>
                <span className="text-[10px] text-slate-500">Official Theme Styles</span>
              </div>

              <div className="flex-1 p-6 sm:p-8 overflow-y-auto markdown-body">
                {/* Rendered HTML */}
                <div
                  dangerouslySetInnerHTML={{ __html: renderedPreviewHtml }}
                  className="prose prose-invert max-w-none"
                />
              </div>
            </div>
          )}
        </div>

        {/* Word Processor Bottom Status Bar */}
        <footer className="px-4 py-1.5 border-t border-slate-800 bg-slate-900/90 flex flex-wrap items-center justify-between text-[11px] text-slate-400 font-mono shrink-0">
          <div className="flex items-center space-x-4">
            <span>Words: <strong className="text-white">{wordCount}</strong></span>
            <span>Characters: <strong className="text-white">{charCount}</strong></span>
            <span>Read Time: <strong className="text-blue-300">~{readingTimeMin} min</strong></span>
          </div>

          <div className="flex items-center space-x-4">
            <span className="flex items-center space-x-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
              <span className="text-slate-400">Auto-saved to Local Storage</span>
            </span>
            <Link
              href={moduleSlug ? `/modules/${moduleSlug}` : '/'}
              className="text-blue-400 hover:text-blue-300 underline font-medium"
            >
              View Target Module →
            </Link>
          </div>
        </footer>
      </main>
    </div>
  );
}
