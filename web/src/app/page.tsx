import React from 'react';
import Link from 'next/link';
import { MODULES, JS_MODULES, TS_MODULES, REACT_MODULES } from '@/lib/modules';
import TracksCatalog from '@/components/TracksCatalog';
import Logo from '@/components/Logo';

// Revalidate and cache for 5 hours (18,000 seconds)
export const revalidate = 18000;

export default function HomePage() {
  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10 w-full space-y-12">
      {/* Platform Hero Banner */}
      <div className="border-b border-slate-800 pb-8">
        <div className="flex items-center space-x-3.5 mb-3">
          <Logo size={44} className="shrink-0" />
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-cyan-400">
                DevMastery
              </span>
              <span className="text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded border border-slate-700">
                Systems & Full-Stack Platform
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-white tracking-tight mt-0.5">
              Full-Stack & Systems Masterclass Platform
            </h1>
          </div>
        </div>
        <p className="text-slate-400 text-sm max-w-3xl leading-relaxed mb-6">
          Rigorous, zero-fluff engineering curriculums built from official specifications and runtime internals. From ECMAScript memory and V8 JIT pipelines to React 19 Fiber architecture, Concurrency Lanes, RSC streaming, and TypeScript 5.x compiler type lattice.
        </p>

        {/* Quick Launch Actions */}
        <div className="flex flex-wrap gap-3">
          <Link
            href="/tracks/react"
            className="inline-flex items-center justify-center px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold rounded transition-colors shadow-sm"
          >
            React 19 Architecture Track (7 Modules) &rarr;
          </Link>
          <Link
            href="/tracks/typescript"
            className="inline-flex items-center justify-center px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded transition-colors shadow-sm"
          >
            TypeScript Masterclass Track (13 Modules) &rarr;
          </Link>
          <Link
            href="/tracks/javascript"
            className="inline-flex items-center justify-center px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded border border-slate-700 transition-colors"
          >
            JavaScript Runtime Track (21 Modules) &rarr;
          </Link>
          <Link
            href="/practice"
            className="inline-flex items-center justify-center px-4 py-2 bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-semibold rounded border border-slate-800 transition-colors"
          >
            Algorithm Practice Hub (70 Problems)
          </Link>
          <Link
            href="/interview"
            className="inline-flex items-center justify-center px-4 py-2 bg-blue-950/80 hover:bg-blue-900/80 text-blue-300 text-xs font-semibold rounded border border-blue-800/80 transition-colors"
          >
            Interview Arena (All Stacks) &rarr;
          </Link>
        </div>
      </div>

      {/* Platform Metrics Bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-lg">
          <div className="text-xs text-slate-500 font-medium">React 19 Architecture</div>
          <div className="text-2xl font-bold text-white mt-1">{REACT_MODULES.length} Modules</div>
          <div className="text-[11px] text-cyan-400 mt-1">Fiber & Concurrency Live</div>
        </div>
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-lg">
          <div className="text-xs text-slate-500 font-medium">TypeScript Masterclass</div>
          <div className="text-2xl font-bold text-white mt-1">{TS_MODULES.length} Modules</div>
          <div className="text-[11px] text-blue-400 mt-1">TS 5.x Systems Live</div>
        </div>
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-lg">
          <div className="text-xs text-slate-500 font-medium">JavaScript Curriculum</div>
          <div className="text-2xl font-bold text-white mt-1">{JS_MODULES.length} Modules</div>
          <div className="text-[11px] text-emerald-400 mt-1">100% Complete & Live</div>
        </div>
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-lg">
          <div className="text-xs text-slate-500 font-medium">Practice Algorithms</div>
          <div className="text-2xl font-bold text-white mt-1">70 Questions</div>
          <div className="text-[11px] text-amber-400 mt-1">Dual-solution analysis</div>
        </div>
      </div>

      {/* Technology Tracks Catalog Section */}
      <div>
        <div className="flex items-center justify-between mb-4 border-b border-slate-800/80 pb-3">
          <div>
            <h2 className="text-lg font-bold text-white tracking-tight">
              Technology Tracks & Curriculum Directory
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Select a learning track to explore comprehensive textbooks, architecture guides, and roadmaps.
            </p>
          </div>
        </div>

        <TracksCatalog />
      </div>

      {/* Active React Masterclass Spotlight */}
      <div className="border-t border-slate-800 pt-10">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-6">
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-mono text-xs text-cyan-400 font-bold uppercase tracking-wider">
                ACTIVE TEXTBOOK SERIES · REACT 19 ARCHITECTURE
              </span>
              <span className="text-[10px] bg-cyan-950 text-cyan-300 px-2 py-0.5 rounded border border-cyan-800 font-medium">
                {REACT_MODULES.length} Modules Live
              </span>
            </div>
            <h2 className="text-xl font-bold text-white tracking-tight mt-1">
              React 19 Internals, Concurrency & Architecture (All {REACT_MODULES.length} Modules)
            </h2>
            <p className="text-xs text-slate-400 mt-1 max-w-3xl leading-relaxed">
              From Fiber node pointers and 31-bit Lane bitmasks to mounting/updating dispatcher linked lists, RSC Flight streaming protocol, and React Compiler reactive memoization scopes.
            </p>
          </div>
          <Link
            href="/tracks/react"
            className="text-xs text-cyan-400 hover:text-cyan-300 font-semibold shrink-0"
          >
            Explore React Track &rarr;
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {REACT_MODULES.map((m) => (
            <Link
              key={m.slug}
              href={`/modules/${m.slug}`}
              className="group relative block bg-slate-900/90 hover:bg-slate-800/90 border border-slate-800 hover:border-cyan-500/60 p-4 rounded-xl transition-all duration-200 shadow-sm hover:shadow-xl hover:shadow-cyan-500/10 hover:-translate-y-1 active:scale-[0.98] active:translate-y-0 cursor-pointer overflow-hidden ring-1 ring-transparent hover:ring-cyan-500/30"
            >
              {/* Top Accent Gradient Line on Hover & Click */}
              <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-cyan-500 to-blue-500 opacity-0 group-hover:opacity-100 group-active:opacity-100 transition-opacity" />

              <div className="flex items-center justify-between mb-2">
                <span className="font-mono text-xs text-cyan-400 font-bold group-hover:text-cyan-300">
                  {m.number}
                </span>
                <span className="text-[10px] bg-slate-800 group-hover:bg-slate-700 text-slate-300 px-2 py-0.5 rounded border border-slate-700 transition-colors">
                  {m.badge}
                </span>
              </div>
              <h3 className="text-sm font-bold text-white group-hover:text-cyan-200 transition-colors mb-1 line-clamp-1">
                {m.title}
              </h3>
              <p className="text-xs text-slate-400 group-hover:text-slate-300 line-clamp-2 leading-relaxed transition-colors">
                {m.subtitle}
              </p>
              <div className="mt-3.5 text-[11px] text-slate-500 flex items-center justify-between border-t border-slate-800/80 pt-2.5 font-mono">
                <span className="group-hover:text-slate-400 transition-colors">~{m.estimatedSections} sections</span>
                <span className="text-cyan-400 font-sans font-semibold group-hover:translate-x-1.5 transition-transform flex items-center space-x-1">
                  <span>Open Module</span>
                  <span className="text-xs font-bold">&rarr;</span>
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Active TypeScript Masterclass Spotlight */}
      <div className="border-t border-slate-800 pt-10">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-6">
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-mono text-xs text-blue-400 font-bold uppercase tracking-wider">
                ACTIVE TEXTBOOK SERIES · TS 5.x SYSTEMS
              </span>
              <span className="text-[10px] bg-blue-950 text-blue-300 px-2 py-0.5 rounded border border-blue-800 font-medium">
                13 Modules Live
              </span>
            </div>
            <h2 className="text-xl font-bold text-white tracking-tight mt-1">
              TypeScript Systems, Type-Level Engineering & Architecture (All {TS_MODULES.length} Modules)
            </h2>
            <p className="text-xs text-slate-400 mt-1 max-w-3xl leading-relaxed">
              From set-theoretic type lattice foundations and generics variance to TC39 Stage 3 decorators, custom compiler AST transformers, isolated declarations, and monorepo library packaging.
            </p>
          </div>
          <Link
            href="/tracks/typescript"
            className="text-xs text-blue-400 hover:text-blue-300 font-semibold shrink-0"
          >
            Explore TypeScript Track &rarr;
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {TS_MODULES.map((m) => (
            <Link
              key={m.slug}
              href={`/modules/${m.slug}`}
              className="group relative block bg-slate-900/90 hover:bg-slate-800/90 border border-slate-800 hover:border-blue-500/60 p-4 rounded-xl transition-all duration-200 shadow-sm hover:shadow-xl hover:shadow-blue-500/10 hover:-translate-y-1 active:scale-[0.98] active:translate-y-0 cursor-pointer overflow-hidden ring-1 ring-transparent hover:ring-blue-500/30"
            >
              {/* Top Accent Gradient Line on Hover & Click */}
              <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-blue-500 to-cyan-400 opacity-0 group-hover:opacity-100 group-active:opacity-100 transition-opacity" />

              <div className="flex items-center justify-between mb-2">
                <span className="font-mono text-xs text-blue-400 font-bold group-hover:text-cyan-300">
                  {m.number}
                </span>
                <span className="text-[10px] bg-slate-800 group-hover:bg-slate-700 text-slate-300 px-2 py-0.5 rounded border border-slate-700 transition-colors">
                  {m.badge}
                </span>
              </div>
              <h3 className="text-sm font-bold text-white group-hover:text-blue-200 transition-colors mb-1 line-clamp-1">
                {m.title}
              </h3>
              <p className="text-xs text-slate-400 group-hover:text-slate-300 line-clamp-2 leading-relaxed transition-colors">
                {m.subtitle}
              </p>
              <div className="mt-3.5 text-[11px] text-slate-500 flex items-center justify-between border-t border-slate-800/80 pt-2.5 font-mono">
                <span className="group-hover:text-slate-400 transition-colors">~{m.estimatedSections} sections</span>
                <span className="text-blue-400 font-sans font-semibold group-hover:translate-x-1.5 transition-transform flex items-center space-x-1">
                  <span>Open Module</span>
                  <span className="text-xs font-bold">&rarr;</span>
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Active JavaScript Curriculum Spotlight */}
      <div className="border-t border-slate-800 pt-10">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-6">
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-mono text-xs text-amber-400 font-bold uppercase tracking-wider">
                ACTIVE TEXTBOOK SERIES · ECMASCRIPT & V8
              </span>
              <span className="text-[10px] bg-emerald-950 text-emerald-400 px-2 py-0.5 rounded border border-emerald-800 font-medium">
                {JS_MODULES.length} Modules Live
              </span>
            </div>
            <h2 className="text-xl font-bold text-white tracking-tight mt-1">
              JavaScript Core & Runtime Internals (All {JS_MODULES.length} Modules)
            </h2>
            <p className="text-xs text-slate-400 mt-1 max-w-3xl leading-relaxed">
              Master the execution stack, lexical environments, closures in heap memory, V8 hidden classes, prototype chains, and concurrency pipelines.
            </p>
          </div>
          <Link
            href="/tracks/javascript"
            className="text-xs text-blue-400 hover:text-blue-300 font-semibold shrink-0"
          >
            Explore JavaScript Track &rarr;
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {JS_MODULES.map((m) => (
            <Link
              key={m.slug}
              href={`/modules/${m.slug}`}
              className="group relative block bg-slate-900/90 hover:bg-slate-800/90 border border-slate-800 hover:border-cyan-500/60 p-4 rounded-xl transition-all duration-200 shadow-sm hover:shadow-xl hover:shadow-cyan-500/10 hover:-translate-y-1 active:scale-[0.98] active:translate-y-0 cursor-pointer overflow-hidden ring-1 ring-transparent hover:ring-cyan-500/30"
            >
              {/* Top Accent Gradient Line on Hover & Click */}
              <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-cyan-500 to-indigo-500 opacity-0 group-hover:opacity-100 group-active:opacity-100 transition-opacity" />

              <div className="flex items-center justify-between mb-2">
                <span className="font-mono text-xs text-cyan-400 font-bold group-hover:text-cyan-300">
                  MODULE {m.number}
                </span>
                <span className="text-[10px] bg-slate-800 group-hover:bg-slate-700 text-slate-300 px-2 py-0.5 rounded border border-slate-700 transition-colors">
                  {m.badge}
                </span>
              </div>
              <h3 className="text-sm font-bold text-white group-hover:text-cyan-200 transition-colors mb-1 line-clamp-1">
                {m.title}
              </h3>
              <p className="text-xs text-slate-400 group-hover:text-slate-300 line-clamp-2 leading-relaxed transition-colors">
                {m.subtitle}
              </p>
              <div className="mt-3.5 text-[11px] text-slate-500 flex items-center justify-between border-t border-slate-800/80 pt-2.5 font-mono">
                <span className="group-hover:text-slate-400 transition-colors">~{m.estimatedSections} sections</span>
                <span className="text-cyan-400 font-sans font-semibold group-hover:translate-x-1.5 transition-transform flex items-center space-x-1">
                  <span>Open Module</span>
                  <span className="text-xs font-bold">&rarr;</span>
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Practice Hub Spotlight Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-lg p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div>
          <div className="text-xs font-mono text-blue-400 font-bold uppercase mb-1">
            PROBLEM-SOLVING ARENA
          </div>
          <h2 className="text-lg font-bold text-white mb-2">
            Practice Hub: 70 Graded Algorithms with Dual Solutions
          </h2>
          <p className="text-xs text-slate-400 max-w-2xl leading-relaxed">
            Every question features comprehensive problem breakdowns, constraints, step-by-step logic, and two complete implementations:
            <strong> Solution 1 (Idiomatic with built-in methods)</strong> vs <strong>Solution 2 (From-scratch without methods using pointers/loops)</strong>.
          </p>
          <div className="flex flex-wrap gap-2 mt-3">
            <span className="text-xs px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-mono">
              23 String Problems
            </span>
            <span className="text-xs px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-mono">
              27 Array Problems
            </span>
            <span className="text-xs px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-mono">
              20 Object Problems
            </span>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-2 shrink-0">
          <Link
            href="/practice?category=strings"
            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded text-xs font-semibold text-center transition-colors shadow-sm"
          >
            Launch Practice Hub
          </Link>
          <Link
            href="/practice?category=arrays"
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded text-xs font-semibold text-center transition-colors"
          >
            Array Algorithms
          </Link>
        </div>
      </div>
    </div>
  );
}
