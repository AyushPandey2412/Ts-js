import React from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { TECHNOLOGY_TRACKS, getTrackById } from '@/lib/tracks';

interface Props {
  params: Promise<{ trackId: string }>;
}

// Revalidate and cache for 5 hours (18,000 seconds)
export const revalidate = 18000;

export async function generateStaticParams() {
  return TECHNOLOGY_TRACKS.map((t) => ({
    trackId: t.id,
  }));
}

export default async function TrackPage({ params }: Props) {
  const { trackId } = await params;
  const track = getTrackById(trackId);

  if (!track) {
    notFound();
  }

  const isJavaScript = track.id === 'javascript';

  return (
    <div className="max-w-5xl mx-auto px-6 py-10 w-full">
      {/* Breadcrumb / Back Link */}
      <div className="mb-6 flex items-center space-x-2 text-xs text-slate-500">
        <Link href="/" className="hover:text-slate-300 transition-colors">
          Home
        </Link>
        <span>/</span>
        <span className="text-slate-300 font-medium">Tracks</span>
        <span>/</span>
        <span className="text-blue-400 font-medium font-mono">{track.shortName}</span>
      </div>

      {/* Track Hero Banner */}
      <div className="border-b border-slate-800 pb-8 mb-8">
        <div className="flex items-center space-x-2 mb-3">
          <span className="text-xs font-mono font-bold uppercase tracking-wider text-blue-400">
            {track.category} TRACK
          </span>
          <span className="text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded border border-slate-700">
            {track.badge}
          </span>
          {track.status === 'active' ? (
            <span className="text-[10px] bg-emerald-950/80 text-emerald-400 px-2 py-0.5 rounded border border-emerald-800/80 font-semibold">
              Live & Complete
            </span>
          ) : (
            <span className="text-[10px] bg-amber-950/80 text-amber-300 px-2 py-0.5 rounded border border-amber-800/80 font-semibold">
              Curriculum In Progress
            </span>
          )}
        </div>

        <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight mb-3">
          {track.name}
        </h1>
        <p className="text-slate-400 text-sm max-w-3xl leading-relaxed">
          {track.description}
        </p>

        {/* Quick Launch Buttons */}
        <div className="flex flex-wrap gap-3 mt-6">
          {isJavaScript ? (
            <>
              <Link
                href="/modules/00-queue-and-index"
                className="inline-flex items-center justify-center px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded transition-colors shadow-sm"
              >
                Curriculum Queue & Index &rarr;
              </Link>
              <Link
                href="/modules/01-engine-memory-execution-context"
                className="inline-flex items-center justify-center px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded border border-slate-700 transition-colors"
              >
                Start Chapter 01: Engine & Memory
              </Link>
              <Link
                href="/practice"
                className="inline-flex items-center justify-center px-4 py-2 bg-slate-850 hover:bg-slate-800 text-slate-300 text-xs font-semibold rounded border border-slate-800 transition-colors"
              >
                Practice Hub (70 Algorithms)
              </Link>
            </>
          ) : track.id === 'typescript' ? (
            <>
              <Link
                href="/modules/ts-00-queue-and-index"
                className="inline-flex items-center justify-center px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded transition-colors shadow-sm"
              >
                Curriculum Queue & Index &rarr;
              </Link>
              <Link
                href="/modules/ts-01-type-architecture-and-structural-subtyping"
                className="inline-flex items-center justify-center px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded border border-slate-700 transition-colors"
              >
                Start Chapter 01: Type Architecture & Structural Subtyping
              </Link>
              <Link
                href="/tracks/javascript"
                className="inline-flex items-center justify-center px-4 py-2 bg-slate-900 hover:bg-slate-800 text-blue-400 text-xs font-semibold rounded border border-slate-800 transition-colors"
              >
                JavaScript Runtime Track &rarr;
              </Link>
            </>
          ) : track.id === 'react' ? (
            <>
              <Link
                href="/modules/react-00-queue-and-index"
                className="inline-flex items-center justify-center px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold rounded transition-colors shadow-sm"
              >
                Curriculum Queue & Index &rarr;
              </Link>
              <Link
                href="/modules/react-01-virtual-dom-and-fiber-architecture"
                className="inline-flex items-center justify-center px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded border border-slate-700 transition-colors"
              >
                Start Chapter 01: Virtual DOM vs Fiber Architecture
              </Link>
              <Link
                href="/tracks/typescript"
                className="inline-flex items-center justify-center px-4 py-2 bg-slate-900 hover:bg-slate-800 text-cyan-400 text-xs font-semibold rounded border border-slate-800 transition-colors"
              >
                TypeScript Track &rarr;
              </Link>
            </>
          ) : (
            <>
              <div className="px-4 py-2 bg-slate-800/80 text-slate-300 text-xs font-semibold rounded border border-slate-700">
                Roadmap Active — Modules Releasing Soon
              </div>
              <Link
                href="/tracks/javascript"
                className="inline-flex items-center justify-center px-4 py-2 bg-slate-900 hover:bg-slate-800 text-blue-400 text-xs font-semibold rounded border border-slate-800 transition-colors"
              >
                Study Active JavaScript Track &rarr;
              </Link>
            </>
          )}
        </div>

      </div>

      {/* Core Topics Pills */}
      <div className="mb-10">
        <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
          Key Mastery Domains
        </h2>
        <div className="flex flex-wrap gap-2">
          {track.topics.map((t) => (
            <span
              key={t}
              className="text-xs px-2.5 py-1 rounded bg-slate-900 border border-slate-800 text-slate-300 font-mono"
            >
              {t}
            </span>
          ))}
        </div>
      </div>

      {/* Syllabus / Module Breakdown */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-bold text-white tracking-tight">
            Curriculum Syllabus & Roadmap
          </h2>
          <span className="text-xs text-slate-500">
            {track.syllabus.length} Chapters Planned
          </span>
        </div>

        <div className="space-y-3">
          {track.syllabus.map((s, idx) => {
            let badgeClass = 'bg-slate-800 text-slate-400 border-slate-700';
            let badgeText = 'Planned';
            if (s.status === 'available') {
              badgeClass = 'bg-emerald-950/80 text-emerald-400 border-emerald-800/80';
              badgeText = 'Available';
            } else if (s.status === 'in-progress') {
              badgeClass = 'bg-amber-950/80 text-amber-300 border-amber-800/80';
              badgeText = 'Writing in progress';
            }

            if (s.slug) {
              return (
                <Link
                  key={s.title}
                  href={`/modules/${s.slug}`}
                  className="group relative block bg-slate-900/80 hover:bg-slate-800/90 border border-slate-800 hover:border-cyan-500/60 p-4.5 rounded-xl transition-all duration-200 shadow-sm hover:shadow-xl hover:shadow-cyan-500/10 hover:-translate-y-0.5 active:scale-[0.985] active:translate-y-0 cursor-pointer ring-1 ring-transparent hover:ring-cyan-500/30 overflow-hidden"
                >
                  {/* Top accent bar on hover */}
                  <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-cyan-500 to-indigo-500 opacity-0 group-hover:opacity-100 group-active:opacity-100 transition-opacity" />

                  <div className="flex items-center justify-between mb-2">
                    <span className="font-mono text-xs text-cyan-400 font-bold group-hover:text-cyan-300">
                      CHAPTER {String(idx).padStart(2, '0')}
                    </span>
                    <span className={`text-[10px] px-2 py-0.5 rounded border font-medium ${badgeClass}`}>
                      {badgeText}
                    </span>
                  </div>
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h3 className="text-sm sm:text-base font-bold text-slate-100 group-hover:text-cyan-200 transition-colors mb-1.5">
                        {s.title}
                      </h3>
                      <p className="text-xs text-slate-400 group-hover:text-slate-300 leading-relaxed transition-colors">
                        {s.description}
                      </p>
                    </div>
                    <div className="shrink-0 flex items-center justify-center w-8 h-8 rounded-full bg-slate-800 group-hover:bg-cyan-600 text-slate-400 group-hover:text-white transition-all group-hover:translate-x-1 shadow-sm mt-1">
                      <span className="text-sm font-bold">&rarr;</span>
                    </div>
                  </div>
                </Link>
              );
            }

            return (
              <div
                key={s.title}
                className="bg-slate-900/60 border border-slate-800 p-4 rounded"
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="font-mono text-xs text-slate-400 font-bold">
                    CHAPTER {String(idx + 1).padStart(2, '0')}
                  </span>
                  <span className={`text-[10px] px-2 py-0.5 rounded border font-medium ${badgeClass}`}>
                    {badgeText}
                  </span>
                </div>
                <h3 className="text-sm font-bold text-slate-200 mb-1">
                  {s.title}
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  {s.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
