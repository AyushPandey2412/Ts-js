import React from 'react';
import type { Metadata } from 'next';
import InterviewClient from './InterviewClient';

export const metadata: Metadata = {
  title: 'Engineering Interview Preparation Arena — JavaScript, TypeScript, React, Systems',
  description: 'Interactive senior and staff engineering interview preparation workspace with docked notes, floating sticky note, and inline document editing.',
};

export default function InterviewPage() {
  return <InterviewClient />;
}

