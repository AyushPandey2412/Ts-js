import React from 'react';
import type { Metadata } from 'next';
import NotesStudioClient from './NotesStudioClient';

export const metadata: Metadata = {
  title: 'Global Notes Studio | Masterclass Engineering Platform',
  description: 'Full-page rich word processor, Masterclass note converter, and module notes manager.',
};

export default function NotesPage() {
  return <NotesStudioClient />;
}
