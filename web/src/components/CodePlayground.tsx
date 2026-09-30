'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { getDefaultSnippet } from '@/lib/code-snippets';

export type DockPosition = 'right' | 'bottom' | 'embedded' | 'fullscreen';

interface CodePlaygroundProps {
  slug: string;
  moduleTitle: string;
  dockPosition?: DockPosition;
  onDockChange?: (position: DockPosition) => void;
  isOpen?: boolean;
  onClose?: () => void;
  isMobile?: boolean;
}

interface ConsoleOutputItem {
  id: string;
  type: 'log' | 'info' | 'warn' | 'error' | 'return' | 'table';
  messages: any[];
  timestamp: string;
}

export default function CodePlayground({
  slug,
  moduleTitle,
  dockPosition = 'right',
  onDockChange,
  isOpen = true,
  onClose,
  isMobile = false,
}: CodePlaygroundProps) {
  const isTs = slug.startsWith('ts-');
  const defaultSnippet = getDefaultSnippet(slug, moduleTitle);
  const storageKey = `devmastery_code_${slug}`;

  // Editor states
  const [code, setCode] = useState<string>(() => {
    if (typeof window === 'undefined') return defaultSnippet.code;
    try {
      const saved = localStorage.getItem(storageKey);
      return saved !== null ? saved : defaultSnippet.code;
    } catch {
      return defaultSnippet.code;
    }
  });

  const [isDirty, setIsDirty] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [output, setOutput] = useState<ConsoleOutputItem[]>([]);
  const [executionTime, setExecutionTime] = useState<number | null>(null);

  // Mobile sub-tab: 'editor' vs 'terminal'
  const [mobileTab, setMobileTab] = useState<'editor' | 'terminal'>('editor');

  const editorRef = useRef<HTMLTextAreaElement>(null);
  const terminalEndRef = useRef<HTMLDivElement>(null);

  // Sync isDirty
  useEffect(() => {
    setIsDirty(code !== defaultSnippet.code);
  }, [code, defaultSnippet.code]);

  // Auto-scroll terminal on new outputs
  useEffect(() => {
    if (terminalEndRef.current) {
      terminalEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [output]);

  // Code persistence
  const handleCodeChange = (newCode: string) => {
    setCode(newCode);
    try {
      localStorage.setItem(storageKey, newCode);
    } catch {
      // Ignore quota errors
    }
  };

  const handleReset = () => {
    if (window.confirm('Reset code to the original module template? Your current edits will be cleared.')) {
      setCode(defaultSnippet.code);
      try {
        localStorage.removeItem(storageKey);
      } catch {
        // Ignore
      }
      setOutput([]);
      setExecutionTime(null);
    }
  };

  // Safe TypeScript type stripper for in-browser JavaScript runtime
  const transpileTypeScriptToJavaScript = (tsCode: string): string => {
    let js = tsCode;

    // 1. Remove single-line type-only declarations
    js = js.replace(/declare\s+const\s+[^;]+;/g, '');
    js = js.replace(/declare\s+function\s+[^;]+;/g, '');
    js = js.replace(/declare\s+class\s+[^;]+;/g, '');

    // 2. Remove interfaces and multi-line types
    js = js.replace(/interface\s+[A-Za-z0-9_<>,\s\n\r]+?\{[\s\S]*?\}/g, '');
    js = js.replace(/type\s+[A-Za-z0-9_<>,\s\n\r]+?\s*=\s*[\s\S]*?;/g, '');

    // 3. Remove "as const", "as Type", "<const T>"
    js = js.replace(/\s+as\s+const\b/g, '');
    js = js.replace(/\s+as\s+[A-Za-z0-9_<>[\]|&,.\s]+/g, '');
    js = js.replace(/<const\s+[A-Za-z0-9_]+(\s+extends\s+[^>]+)?>/g, '');

    // 4. Remove function generic parameters: function fn<T>(...) -> function fn(...)
    js = js.replace(/function\s*([A-Za-z0-9_]+)?\s*<[A-Za-z0-9_,\s\n\r=]+>\s*\(/g, 'function $1(');
    js = js.replace(/<[A-Za-z0-9_,\s\n\r=]+>\s*\(/g, '(');

    // 5. Remove access modifiers: private, public, protected, readonly (preserve ECMAScript #private)
    js = js.replace(/\b(public|private|protected|readonly)\s+(?=[A-Za-z0-9_])/g, '');

    // 6. Remove parameter properties in constructors
    js = js.replace(/constructor\s*\(\s*(public|private|protected|readonly)\s+/g, 'constructor(');

    // 7. Remove variable and parameter type annotations: ": Type"
    js = js.replace(/\)\s*:\s*[A-Za-z0-9_<>[\]|&,\s\n\r]+\s*=>/g, ') =>');
    js = js.replace(/\)\s*:\s*[A-Za-z0-9_<>[\]|&,\s\n\r]+\s*\{/g, ') {');
    js = js.replace(/(\(|,)\s*([A-Za-z0-9_$]+)\s*:\s*[A-Za-z0-9_<>[\]|&,.\s]+(?=[,)])/g, '$1 $2');
    js = js.replace(/\b(const|let|var)\s+([A-Za-z0-9_$]+)\s*:\s*[A-Za-z0-9_<>[\]|&,.\s]+(?=\s*=)/g, '$1 $2');

    return js;
  };

  // Safe formatting of values for the terminal
  const formatConsoleValue = (val: any): string => {
    if (val === undefined) return 'undefined';
    if (val === null) return 'null';
    if (typeof val === 'string') return val;
    if (typeof val === 'function') return `[Function: ${val.name || 'anonymous'}]`;
    if (typeof val === 'symbol') return val.toString();
    if (typeof val === 'bigint') return `${val}n`;
    if (val instanceof Error) return `${val.name}: ${val.message}\n${val.stack || ''}`;
    if (val instanceof Set) return `Set(${val.size}) { ${Array.from(val).map(formatConsoleValue).join(', ')} }`;
    if (val instanceof Map) return `Map(${val.size}) { ${Array.from(val.entries()).map(([k, v]) => `${formatConsoleValue(k)} => ${formatConsoleValue(v)}`).join(', ')} }`;

    try {
      return JSON.stringify(val, null, 2);
    } catch {
      return String(val);
    }
  };

  // Code Execution Engine
  const executeCode = useCallback(async () => {
    setIsRunning(true);
    const newLogs: ConsoleOutputItem[] = [];
    const startTime = performance.now();

    const pushItem = (type: ConsoleOutputItem['type'], ...args: any[]) => {
      newLogs.push({
        id: Math.random().toString(36).substring(2, 9),
        type,
        messages: args.map(formatConsoleValue),
        timestamp: new Date().toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })
      });
      setOutput([...newLogs]);
    };

    // Custom console interceptor
    const customConsole = {
      log: (...args: any[]) => pushItem('log', ...args),
      info: (...args: any[]) => pushItem('info', ...args),
      warn: (...args: any[]) => pushItem('warn', ...args),
      error: (...args: any[]) => pushItem('error', ...args),
      dir: (arg: any) => pushItem('log', arg),
      table: (data: any) => pushItem('table', data),
      clear: () => setOutput([])
    };

    try {
      const runnableJs = isTs ? transpileTypeScriptToJavaScript(code) : code;
      const wrappedCode = `
        return (async (console) => {
          "use strict";
          ${runnableJs}
        })(customConsole);
      `;

      const runnerFn = new Function('customConsole', wrappedCode);
      const evalResult = await runnerFn(customConsole);

      if (evalResult !== undefined) {
        pushItem('return', `↳ ${formatConsoleValue(evalResult)}`);
      }

      const duration = Number((performance.now() - startTime).toFixed(1));
      setExecutionTime(duration);

      // On mobile, automatically show the terminal tab on run so user sees results
      if (isMobile) {
        setMobileTab('terminal');
      }
    } catch (err: any) {
      pushItem('error', `Execution Error: ${err.message || String(err)}`);
      if (err.stack) {
        pushItem('error', err.stack);
      }
      if (isMobile) {
        setMobileTab('terminal');
      }
    } finally {
      setIsRunning(false);
    }
  }, [code, isTs, isMobile]);

  // Handle keyboard shortcut: Ctrl+Enter or Cmd+Enter to run
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        executeCode();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [executeCode]);

  // Code editor keyboard enhancements
  const handleEditorKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    const textarea = e.currentTarget;
    const { selectionStart, selectionEnd, value } = textarea;

    if (e.key === 'Tab') {
      e.preventDefault();
      const updated = value.substring(0, selectionStart) + '  ' + value.substring(selectionEnd);
      handleCodeChange(updated);
      setTimeout(() => {
        textarea.selectionStart = textarea.selectionEnd = selectionStart + 2;
      }, 0);
      return;
    }

    if (e.key === 'Enter') {
      const lineBefore = value.substring(0, selectionStart).split('\n').pop() || '';
      const match = lineBefore.match(/^(\s+)/);
      const indent = match ? match[1] : '';
      const extraIndent = /[{(\[]\s*$/.test(lineBefore) ? '  ' : '';

      if (indent || extraIndent) {
        e.preventDefault();
        const totalIndent = indent + extraIndent;
        const updated = value.substring(0, selectionStart) + '\n' + totalIndent + value.substring(selectionEnd);
        handleCodeChange(updated);
        setTimeout(() => {
          textarea.selectionStart = textarea.selectionEnd = selectionStart + 1 + totalIndent.length;
        }, 0);
      }
    }
  };

  const lineCount = Math.max(1, code.split('\n').length);
  const lineNumbers = Array.from({ length: lineCount }, (_, i) => i + 1);

  if (!isOpen) return null;

  const isFullscreen = dockPosition === 'fullscreen';

  // Dynamic container styling based on dock position
  let containerClasses = 'flex flex-col bg-[#1e1e1e] text-slate-200 overflow-hidden';
  if (isFullscreen) {
    containerClasses += ' fixed inset-0 z-50 w-screen h-screen';
  } else if (dockPosition === 'embedded') {
    containerClasses += ' w-full rounded-xl border border-slate-700 shadow-2xl h-[520px] md:h-[560px] my-6';
  } else if (dockPosition === 'bottom') {
    containerClasses += ' w-full h-full border-t-2 border-blue-500/60 shadow-2xl';
  } else {
    // Default 'right' split
    containerClasses += ' w-full h-full border-l border-slate-700 shadow-2xl';
  }

  // Determine split direction:
  // If docked right and screen is narrow or split, stack Editor top / Terminal bottom for readability.
  // If docked bottom, embedded, or fullscreen, split Editor left / Terminal right.
  const isStackedSplit = dockPosition === 'right';

  return (
    <div className={containerClasses}>
      {/* VS Code Titlebar & Window Controls */}
      <div className="bg-[#252526] px-3 py-2 border-b border-[#333333] flex items-center justify-between select-none shrink-0 gap-2">
        <div className="flex items-center space-x-2 truncate">
          {/* File Tab Pill */}
          <div className="flex items-center space-x-2 bg-[#1e1e1e] border-t-2 border-blue-500 px-3 py-1 rounded-t text-xs font-mono text-white shadow-xs">
            <span
              className={`text-[10px] font-bold px-1 rounded ${
                isTs ? 'bg-blue-600/90 text-white' : 'bg-amber-500/90 text-slate-900'
              }`}
            >
              {isTs ? 'TS' : 'JS'}
            </span>
            <span className="font-semibold">{isTs ? 'main.ts' : 'main.js'}</span>
            {isDirty && <span className="w-1.5 h-1.5 rounded-full bg-blue-400" title="Unsaved changes" />}
          </div>

          <span className="text-[11px] text-slate-400 hidden xl:inline truncate">
            — <strong className="text-white">VS Code Sandbox</strong>
          </span>
        </div>

        {/* Center Mobile Tabs (Only on small screens) */}
        <div className="flex md:hidden items-center bg-[#181818] p-0.5 rounded border border-[#333333]">
          <button
            onClick={() => setMobileTab('editor')}
            className={`px-2 py-0.5 rounded text-[11px] font-mono transition-colors ${
              mobileTab === 'editor'
                ? 'bg-blue-600 text-white font-bold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Code
          </button>
          <button
            onClick={() => setMobileTab('terminal')}
            className={`px-2 py-0.5 rounded text-[11px] font-mono transition-colors flex items-center space-x-1 ${
              mobileTab === 'terminal'
                ? 'bg-blue-600 text-white font-bold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <span>Console</span>
            {output.length > 0 && (
              <span className="text-[9px] bg-slate-700 px-1 rounded">{output.length}</span>
            )}
          </button>
        </div>

        {/* Action Controls & Dock Switcher */}
        <div className="flex items-center space-x-1.5 shrink-0">
          {/* Run Code Button */}
          <button
            onClick={executeCode}
            disabled={isRunning}
            className="flex items-center space-x-1.5 px-3 py-1 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 disabled:opacity-50 text-white rounded text-xs font-bold transition-all shadow-sm active:scale-95 cursor-pointer ring-1 ring-emerald-400/50"
            title="Execute code (Ctrl + Enter)"
          >
            <span>{isRunning ? '⏳' : '▶'}</span>
            <span className="hidden sm:inline">Run</span>
            <kbd className="hidden lg:inline text-[9px] bg-emerald-800/80 px-1 py-0.2 rounded font-mono text-emerald-200">
              Ctrl+↵
            </kbd>
          </button>

          {/* Reset Code */}
          <button
            onClick={handleReset}
            className="px-2 py-1 bg-[#2d2d2d] hover:bg-[#3d3d3d] text-slate-300 hover:text-white rounded text-xs transition-colors border border-slate-700"
            title="Reset code template"
          >
            Reset
          </button>

          {/* Clear Console */}
          <button
            onClick={() => setOutput([])}
            className="px-2 py-1 bg-[#2d2d2d] hover:bg-[#3d3d3d] text-slate-300 hover:text-white rounded text-xs transition-colors border border-slate-700 hidden sm:inline-block"
            title="Clear console output"
          >
            Clear
          </button>

          {/* Desktop Dock Position Switcher (Chrome DevTools / VS Code style) */}
          {onDockChange && (
            <div className="hidden md:flex items-center bg-[#181818] p-0.5 rounded border border-[#333333] space-x-0.5">
              <button
                onClick={() => onDockChange('right')}
                className={`px-1.5 py-0.5 rounded text-[10.5px] font-mono transition-colors ${
                  dockPosition === 'right'
                    ? 'bg-blue-600 text-white font-bold'
                    : 'text-slate-400 hover:text-white hover:bg-[#2d2d2d]'
                }`}
                title="Split Right: Read on Left, Code on Right"
              >
                ◧ Right
              </button>
              <button
                onClick={() => onDockChange('bottom')}
                className={`px-1.5 py-0.5 rounded text-[10.5px] font-mono transition-colors ${
                  dockPosition === 'bottom'
                    ? 'bg-blue-600 text-white font-bold'
                    : 'text-slate-400 hover:text-white hover:bg-[#2d2d2d]'
                }`}
                title="Dock Bottom: Read on Top, Code on Bottom"
              >
                ⬒ Bottom
              </button>
              <button
                onClick={() => onDockChange('embedded')}
                className={`px-1.5 py-0.5 rounded text-[10.5px] font-mono transition-colors ${
                  dockPosition === 'embedded'
                    ? 'bg-blue-600 text-white font-bold'
                    : 'text-slate-400 hover:text-white hover:bg-[#2d2d2d]'
                }`}
                title="Inline in Textbook"
              >
                ⊟ Inline
              </button>
              <button
                onClick={() => onDockChange(isFullscreen ? 'right' : 'fullscreen')}
                className={`px-1.5 py-0.5 rounded text-[10.5px] font-mono transition-colors ${
                  isFullscreen
                    ? 'bg-blue-600 text-white font-bold'
                    : 'text-slate-400 hover:text-white hover:bg-[#2d2d2d]'
                }`}
                title="Toggle Fullscreen IDE"
              >
                {isFullscreen ? '⤡ Exit' : '⤢ Full'}
              </button>
            </div>
          )}

          {/* Close button if provided */}
          {onClose && (
            <button
              onClick={onClose}
              className="p-1 px-2 rounded bg-[#2d2d2d] hover:bg-rose-900/80 text-slate-400 hover:text-white text-xs font-bold border border-slate-700 transition-colors"
              title="Close code runner"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Editor & Console Split Workspace */}
      <div
        className={`flex-1 flex overflow-hidden min-h-0 ${
          isStackedSplit ? 'flex-col' : 'flex-col md:flex-row'
        }`}
      >
        {/* Editor Area */}
        <div
          className={`flex flex-col bg-[#1e1e1e] overflow-hidden min-h-0 ${
            // On mobile: toggle between editor and terminal
            mobileTab !== 'editor' ? 'hidden md:flex' : 'flex'
          } ${
            isStackedSplit
              ? 'flex-1 border-b border-[#333333]'
              : 'flex-1 border-b md:border-b-0 md:border-r border-[#333333]'
          }`}
        >
          <div className="flex-1 flex overflow-hidden min-h-0">
            {/* Line Numbers Gutter */}
            <div className="w-10 sm:w-12 bg-[#1e1e1e] text-[#858585] text-right pr-2 sm:pr-3 select-none font-mono text-xs pt-3 leading-6 border-r border-[#2d2d2d]/60 shrink-0 overflow-hidden">
              {lineNumbers.map((num) => (
                <div key={num}>{num}</div>
              ))}
            </div>

            {/* Code Textarea with VS Code Font & Indentation */}
            <textarea
              ref={editorRef}
              value={code}
              onChange={(e) => handleCodeChange(e.target.value)}
              onKeyDown={handleEditorKeyDown}
              spellCheck={false}
              autoCapitalize="none"
              autoComplete="off"
              className="flex-1 h-full p-3 bg-transparent text-[#d4d4d4] font-mono text-xs sm:text-sm leading-6 resize-none focus:outline-none placeholder-slate-600 whitespace-pre overflow-y-auto selection:bg-[#264f78]"
              placeholder="Type your code here..."
            />
          </div>
        </div>

        {/* Integrated VS Code Debug Console / Terminal */}
        <div
          className={`flex flex-col bg-[#181818] overflow-hidden min-h-0 ${
            // On mobile: toggle between editor and terminal
            mobileTab !== 'terminal' ? 'hidden md:flex' : 'flex'
          } ${
            isStackedSplit
              ? 'h-48 md:h-56'
              : 'w-full md:w-[45%]'
          }`}
        >
          {/* Console Header Bar */}
          <div className="bg-[#202020] px-3 py-1.5 border-b border-[#2d2d2d] flex items-center justify-between text-xs font-mono text-slate-400 select-none shrink-0">
            <div className="flex items-center space-x-2">
              <span className="text-[11px] font-bold text-white uppercase tracking-wider">
                TERMINAL / OUTPUT
              </span>
              <span className="text-[10px] bg-slate-800 px-1.5 py-0.2 rounded text-slate-300">
                {output.length} logs
              </span>
            </div>

            <div className="flex items-center space-x-2 text-[10px]">
              {executionTime !== null && (
                <span className="text-emerald-400 font-semibold">
                  ⚡ {executionTime}ms
                </span>
              )}
              {isRunning && (
                <span className="text-amber-400 animate-pulse font-semibold">
                  ● Running...
                </span>
              )}
            </div>
          </div>

          {/* Console Output Body */}
          <div className="flex-1 overflow-y-auto p-3 font-mono text-xs space-y-1.5 leading-relaxed selection:bg-[#264f78] min-h-0">
            {output.length === 0 ? (
              <div className="text-slate-500 text-xs italic py-6 text-center">
                Press <kbd className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700 font-sans">Run</kbd> or <kbd className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700 font-sans">Ctrl + Enter</kbd> to evaluate code.
              </div>
            ) : (
              output.map((item) => {
                let badgeColor = 'text-slate-400';
                let contentClass = 'text-slate-200';

                if (item.type === 'error') {
                  badgeColor = 'text-rose-400';
                  contentClass = 'text-rose-300 bg-rose-950/20 p-1.5 rounded border border-rose-900/40';
                } else if (item.type === 'warn') {
                  badgeColor = 'text-amber-400';
                  contentClass = 'text-amber-200';
                } else if (item.type === 'return') {
                  badgeColor = 'text-cyan-400';
                  contentClass = 'text-cyan-300 font-semibold';
                } else if (item.type === 'table') {
                  badgeColor = 'text-purple-400';
                  contentClass = 'text-purple-200';
                }

                return (
                  <div key={item.id} className="flex items-start space-x-2">
                    <span className="text-[10px] text-slate-600 select-none shrink-0 pt-0.5">
                      {item.timestamp}
                    </span>
                    <span className={`text-[10px] uppercase font-bold shrink-0 pt-0.5 ${badgeColor}`}>
                      [{item.type}]
                    </span>
                    <div className={`flex-1 whitespace-pre-wrap break-all ${contentClass}`}>
                      {item.messages.join(' ')}
                    </div>
                  </div>
                );
              })
            )}
            <div ref={terminalEndRef} />
          </div>
        </div>
      </div>

      {/* VS Code Bottom Status Bar */}
      <div className="bg-[#007acc] px-3 py-1 flex items-center justify-between text-[11px] text-white font-mono select-none shrink-0">
        <div className="flex items-center space-x-3">
          <span className="font-bold flex items-center space-x-1">
            <span>⚡</span>
            <span>DevMastery V8 Sandbox</span>
          </span>
          <span className="opacity-80 hidden sm:inline">UTF-8</span>
          <span className="opacity-80">{isTs ? 'TypeScript 5.x' : 'ECMAScript 2024'}</span>
        </div>

        <div className="flex items-center space-x-3">
          <span>Lines: {lineCount}</span>
          <span className="opacity-80 hidden sm:inline">Spaces: 2</span>
          <span>{isDirty ? '● Unsaved' : '✓ Saved'}</span>
        </div>
      </div>
    </div>
  );
}
