import React, { Suspense } from 'react';
import { getAllPracticeProblems } from '@/lib/practice-data';
import PracticeClient from './PracticeClient';

export default function PracticePage() {
  const data = getAllPracticeProblems();

  return (
    <Suspense fallback={<div className="p-8 text-slate-400 text-sm">Loading practice problems...</div>}>
      <PracticeClient initialData={data} />
    </Suspense>
  );
}
