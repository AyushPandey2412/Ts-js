import React from 'react';
import Link from 'next/link';
import { MODULES } from '@/lib/modules';
import TracksCatalog from '@/components/TracksCatalog';

export default function HomePage() {
  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10 w-full space-y-12">
      {/* Platform Hero Banner */}
      <div className="border-b border-slate-800 pb-8">
        <div className="flex items-center space-x-2 mb-2">
          <span className="text-xs font-mono font-bold uppercase tracking-wider text-blue-400">
            ENGINEERING CURRICULUM PLATFORM
          </span>
          <span className="text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded border border-slate-700">
            Multi-Track Academy
          </span>
        </div>

        <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight mb-3">
          Full-Stack & Systems Masterclass Platform
        </h1>
        <p className="text-slate-400 text-sm max-w-3xl leading-relaxed mb-6">
          Rigorous, zero-fluff engineering curriculums built from official specifications and runtime internals. From ECMAScript memory and V8 JIT pipelines to PostgreSQL MVCC, Redis data structures, NestJS microservices, and React Fiber architecture.
        </p>

        {/* Quick Launch Actions */}
        <div className="flex flex-wrap gap-3">
          <Link
            href="/tracks/javascript"
            className="inline-flex items-center justify-center px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded transition-colors shadow-sm"
          >
            JavaScript Curriculum Track &rarr;
          </Link>
          <Link
            href="/practice"
            className="inline-flex items-center justify-center px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded border border-slate-700 transition-colors"
          >
            Algorithm Practice Hub (70 Problems)
          </Link>
          <Link
            href="/interview"
            className="inline-flex items-center justify-center px-4 py-2 bg-blue-950/80 hover:bg-blue-900/80 text-blue-300 text-xs font-semibold rounded border border-blue-800/80 transition-colors"
          >
            Interview Arena (All Stacks) &rarr;
          </Link>
          <Link
            href="/tracks/postgres"
            className="inline-flex items-center justify-center px-4 py-2 bg-slate-900 hover:bg-slate-850 text-slate-300 text-xs font-semibold rounded border border-slate-800 transition-colors"
          >
            PostgreSQL Internals Roadmap &rarr;
          </Link>
        </div>
      </div>

      {/* Platform Metrics Bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-lg">
          <div className="text-xs text-slate-500 font-medium">Engineering Tracks</div>
          <div className="text-2xl font-bold text-white mt-1">6 Stacks</div>
          <div className="text-[11px] text-blue-400 mt-1">JS, TS, React, Nest, Postgres, Redis</div>
        </div>
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-lg">
          <div className="text-xs text-slate-500 font-medium">JavaScript Curriculum</div>
          <div className="text-2xl font-bold text-white mt-1">{MODULES.length} Modules</div>
          <div className="text-[11px] text-emerald-400 mt-1">100% Complete & Live</div>
        </div>
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-lg">
          <div className="text-xs text-slate-500 font-medium">Textbook Sections</div>
          <div className="text-2xl font-bold text-white mt-1">500+ Sections</div>
          <div className="text-[11px] text-slate-400 mt-1">In-depth runtime mechanics</div>
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

      {/* Active JavaScript Curriculum Spotlight */}
      <div className="border-t border-slate-800 pt-10">
        <div className="flex items-center justify-between mb-6">
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-mono text-xs text-amber-400 font-bold uppercase">
                ACTIVE TEXTBOOK SERIES
              </span>
              <span className="text-[10px] bg-emerald-950 text-emerald-400 px-2 py-0.2 rounded border border-emerald-800 font-medium">
                Complete
              </span>
            </div>
            <h2 className="text-lg font-bold text-white tracking-tight mt-1">
              JavaScript Core & Runtime Internals (All {MODULES.length} Modules)
            </h2>
          </div>
          <Link
            href="/tracks/javascript"
            className="text-xs text-blue-400 hover:text-blue-300 font-semibold"
          >
            Explore JavaScript Track &rarr;
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {MODULES.map((m) => (
            <Link
              key={m.slug}
              href={`/modules/${m.slug}`}
              className="group block bg-slate-900 hover:bg-slate-850 border border-slate-800 hover:border-slate-700 p-4 rounded-lg transition-all"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="font-mono text-xs text-blue-400 font-bold">
                  MODULE {m.number}
                </span>
                <span className="text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded border border-slate-700">
                  {m.badge}
                </span>
              </div>
              <h3 className="text-sm font-bold text-white group-hover:text-blue-400 transition-colors mb-1">
                {m.title}
              </h3>
              <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                {m.subtitle}
              </p>
              <div className="mt-3 text-[11px] text-slate-500 flex items-center justify-between border-t border-slate-800/80 pt-2 font-mono">
                <span>~{m.estimatedSections} sections</span>
                <span className="group-hover:translate-x-0.5 transition-transform text-slate-400 font-sans">
                  Read &rarr;
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
