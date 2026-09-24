'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { TECHNOLOGY_TRACKS } from '@/lib/tracks';

type CategoryFilter = 'all' | 'languages' | 'frameworks' | 'databases';

export default function TracksCatalog() {
  const [activeCategory, setActiveCategory] = useState<CategoryFilter>('all');

  const filteredTracks = TECHNOLOGY_TRACKS.filter((track) => {
    if (activeCategory === 'all') return true;
    return track.category === activeCategory;
  });

  return (
    <div>
      {/* Category Filter Pills */}
      <div className="flex flex-wrap items-center gap-2 mb-6">
        <span className="text-xs text-slate-400 font-semibold mr-1">Filter Tracks:</span>
        {(
          [
            { key: 'all', label: 'All Technologies' },
            { key: 'languages', label: 'Languages & Runtime (JS / TS)' },
            { key: 'frameworks', label: 'Architecture & Frameworks (React / NestJS)' },
            { key: 'databases', label: 'Databases & In-Memory (PostgreSQL / Redis)' }
          ] as const
        ).map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveCategory(tab.key)}
            className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
              activeCategory === tab.key
                ? 'bg-blue-600 text-white'
                : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tracks Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredTracks.map((track) => {
          const isJavaScript = track.id === 'javascript';

          return (
            <div
              key={track.id}
              className="bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-lg p-5 flex flex-col justify-between transition-all group"
            >
              <div>
                {/* Header Tag & Status */}
                <div className="flex items-center justify-between gap-2 mb-3">
                  <span className="font-mono text-[11px] text-blue-400 font-bold uppercase tracking-wider">
                    {track.shortName}
                  </span>
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded border font-medium ${
                      track.status === 'active'
                        ? 'bg-emerald-950/80 text-emerald-400 border-emerald-800/80'
                        : 'bg-amber-950/80 text-amber-300 border-amber-800/80'
                    }`}
                  >
                    {track.status === 'active' ? 'Live · 9 Modules' : 'Roadmap In Progress'}
                  </span>
                </div>

                {/* Track Title */}
                <h3 className="text-base font-bold text-white group-hover:text-blue-400 transition-colors mb-2">
                  <Link href={`/tracks/${track.id}`}>
                    {track.name}
                  </Link>
                </h3>

                {/* Description */}
                <p className="text-xs text-slate-400 leading-relaxed mb-4 line-clamp-3">
                  {track.description}
                </p>

                {/* Key Topic Chips */}
                <div className="flex flex-wrap gap-1.5 mb-4">
                  {track.topics.slice(0, 4).map((topic) => (
                    <span
                      key={topic}
                      className="text-[10.5px] px-2 py-0.5 rounded bg-slate-950/70 border border-slate-800/90 text-slate-300 font-mono"
                    >
                      {topic}
                    </span>
                  ))}
                  {track.topics.length > 4 && (
                    <span className="text-[10.5px] px-1.5 py-0.5 text-slate-500 font-mono">
                      +{track.topics.length - 4} more
                    </span>
                  )}
                </div>
              </div>

              {/* Bottom Actions */}
              <div className="pt-3 border-t border-slate-800 flex items-center justify-between text-xs">
                <span className="text-slate-500 font-mono text-[11px]">
                  {track.syllabus.length} Chapters
                </span>

                <div className="flex items-center space-x-2">
                  <Link
                    href={`/tracks/${track.id}`}
                    className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors text-[11px] font-medium"
                  >
                    Syllabus
                  </Link>
                  <Link
                    href={`/tracks/${track.id}`}
                    className={`px-2.5 py-1 rounded transition-colors text-[11px] font-semibold ${
                      isJavaScript
                        ? 'bg-blue-600 hover:bg-blue-500 text-white'
                        : 'bg-slate-850 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-700'
                    }`}
                  >
                    {isJavaScript ? 'Open Track \u2192' : 'Preview \u2192'}
                  </Link>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
