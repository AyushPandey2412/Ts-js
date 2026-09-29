'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { getDefaultSnippet, type CodeSnippet } from '@/lib/code-snippets';

interface CodePlaygroundProps {
  slug: string;
  moduleTitle: string;
  isOpen: boolean;
  onClose: () => void;
}

interface ConsoleOutputItem {
  id: string;
  type: 'log' | 'info' | 'warn' | 'error' | 'return' | 'table';
  messages: any[];
  timestamp: string;
}

export default function CodePlayground({ slug, moduleTitle, isOpen, onClose }: CodePlaygroundProps) {
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
  const [activeTab, setActiveTab] = useState<'editor' | 'split'>('split');
  const [viewMode, setViewMode] = useState<'docked' | 'fullscreen'>('docked');

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
    // Be careful with object literal properties, ternary operators, and string colons
    // Remove return type annotations: "): Type {" -> ") {"
    js = js.replace(/\)\s*:\s*[A-Za-z0-9_<>[\]|&,\s\n\r]+\s*=>/g, ') =>');
    js = js.replace(/\)\s*:\s*[A-Za-z0-9_<>[\]|&,\s\n\r]+\s*\{/g, ') {');

    // Remove parameter types: (a: string, b: number) -> (a, b)
    js = js.replace(/(\(|,)\s*([A-Za-z0-9_$]+)\s*:\s*[A-Za-z0-9_<>[\]|&,.\s]+(?=[,)])/g, '$1 $2');

    // Remove variable types: const x: number = 5 -> const x = 5
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
      // 1. Transpile TS if applicable
      const runnableJs = isTs ? transpileTypeScriptToJavaScript(code) : code;

      // 2. Wrap in async context to support top-level await & return values
      const wrappedCode = `
        return (async (console) => {
          "use strict";
          ${runnableJs}
        })(customConsole);
      `;

      // 3. Execute
      const runnerFn = new Function('customConsole', wrappedCode);
      const evalResult = await runnerFn(customConsole);

      if (evalResult !== undefined) {
        pushItem('return', `↳ ${formatConsoleValue(evalResult)}`);
      }

      const duration = Number((performance.now() - startTime).toFixed(1));
      setExecutionTime(duration);
    } catch (err: any) {
      pushItem('error', `Execution Error: ${err.message || String(err)}`);
      if (err.stack) {
        pushItem('error', err.stack);
      }
    } finally {
      setIsRunning(false);
    }
  }, [code, isTs]);

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

  // Code editor keyboard enhancements (Tab key & auto-indent)
  const handleEditorKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    const textarea = e.currentTarget;
    const { selectionStart, selectionEnd, value } = textarea;

    // Tab key: insert 2 spaces
    if (e.key === 'Tab') {
      e.preventDefault();
      const updated = value.substring(0, selectionStart) + '  ' + value.substring(selectionEnd);
      handleCodeChange(updated);
      setTimeout(() => {
        textarea.selectionStart = textarea.selectionEnd = selectionStart + 2;
      }, 0);
      return;
    }

    // Auto-indent on Enter
    if (e.key === 'Enter') {
      const lineBefore = value.substring(0, selectionStart).split('\n').pop() || '';
      const match = lineBefore.match(/^(\s+)/);
      const indent = match ? match[1] : '';

      // Extra indent if line ends with { or ( or [
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

  // Generate line numbers
  const lineCount = Math.max(1, code.split('\n').length);
  const lineNumbers = Array.from({ length: lineCount }, (_, i) => i + 1);

  if (!isOpen) return null;

  return (
    <div
      className={`fixed z-50 transition-all duration-200 shadow-2xl flex flex-col border border-slate-700 bg-[#1e1e1e] text-slate-200 ${
        viewMode === 'fullscreen'
          ? 'inset-0 w-screen h-screen'
          : 'bottom-0 left-0 right-0 md:left-72 h-[68vh] md:h-[62vh] rounded-t-xl'
      }`}
    >
      {/* VS Code Titlebar & Window Controls */}
      <div className="bg-[#252526] px-3 py-2 border-b border-[#333333] flex items-center justify-between select-none">
        <div className="flex items-center space-x-2 truncate">
          {/* File Tab pill */}
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

          <span className="text-[11px] text-slate-400 hidden sm:inline truncate">
            — DevMastery VS Code Sandbox: <span className="text-slate-300 font-medium">{moduleTitle}</span>
          </span>
        </div>

        {/* Action Controls */}
        <div className="flex items-center space-x-1.5">
          {/* Run Code Button */}
          <button
            onClick={executeCode}
            disabled={isRunning}
            className="flex items-center space-x-1.5 px-3 py-1 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 disabled:opacity-50 text-white rounded text-xs font-bold transition-all shadow-sm active:scale-95 cursor-pointer"
            title="Execute code (Ctrl + Enter)"
          >
            <span>{isRunning ? '⏳' : '▶'}</span>
            <span>Run</span>
            <kbd className="hidden md:inline text-[9px] bg-emerald-800/80 px-1 py-0.2 rounded font-mono text-emerald-200">
              Ctrl+↵
            </kbd>
          </button>

          {/* Reset Code */}
          <button
            onClick={handleReset}
            className="px-2 py-1 bg-[#2d2d2d] hover:bg-[#3d3d3d] text-slate-300 hover:text-white rounded text-xs transition-colors border border-slate-700"
            title="Reset to module code template"
          >
            Reset
          </button>

          {/* Clear Console */}
          <button
            onClick={() => setOutput([])}
            className="px-2 py-1 bg-[#2d2d2d] hover:bg-[#3d3d3d] text-slate-300 hover:text-white rounded text-xs transition-colors border border-slate-700"
            title="Clear console output"
          >
            Clear Log
          </button>

          {/* View Mode Toggle (Docked vs Fullscreen) */}
          <button
            onClick={() => setViewMode(viewMode === 'docked' ? 'fullscreen' : 'docked')}
            className="p-1 rounded bg-[#2d2d2d] hover:bg-[#3d3d3d] text-slate-400 hover:text-white text-xs border border-slate-700 transition-colors"
            title={viewMode === 'docked' ? 'Expand to Fullscreen IDE' : 'Dock to bottom'}
          >
            {viewMode === 'docked' ? '⤢' : '⤡'}
          </button>

          {/* Close Playground */}
          <button
            onClick={onClose}
            className="p-1 px-2 rounded bg-[#2d2d2d] hover:bg-rose-900/80 text-slate-400 hover:text-white text-xs font-bold border border-slate-700 transition-colors"
            title="Close playground"
          >
            ✕
          </button>
        </div>
      </div>

      {/* Editor & Console Split Workspace */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
        {/* Left Side: VS Code Editor */}
        <div className="flex-1 flex flex-col border-b md:border-b-0 md:border-r border-[#333333] overflow-hidden bg-[#1e1e1e]">
          <div className="flex-1 flex overflow-hidden">
            {/* Line Numbers Gutter */}
            <div className="w-12 bg-[#1e1e1e] text-[#858585] text-right pr-3 select-none font-mono text-xs pt-3 leading-6 border-r border-[#2d2d2d]/60 shrink-0">
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

        {/* Right Side / Bottom: Integrated VS Code Debug Console */}
        <div className="w-full md:w-[42%] flex flex-col bg-[#181818] overflow-hidden">
          {/* Console Header Bar */}
          <div className="bg-[#202020] px-3 py-1.5 border-b border-[#2d2d2d] flex items-center justify-between text-xs font-mono text-slate-400 select-none">
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
                <span className="text-emerald-400">
                  ⚡ {executionTime}ms
                </span>
              )}
              {isRunning && (
                <span className="text-amber-400 animate-pulse">
                  ● Running...
                </span>
              )}
            </div>
          </div>

          {/* Console Output Body */}
          <div className="flex-1 overflow-y-auto p-3 font-mono text-xs space-y-1.5 leading-relaxed selection:bg-[#264f78]">
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
      <div className="bg-[#007acc] px-3 py-1 flex items-center justify-between text-[11px] text-white font-mono select-none">
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
