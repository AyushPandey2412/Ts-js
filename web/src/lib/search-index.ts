import fs from 'node:fs';
import path from 'node:path';
import { MODULES } from './modules';
import { TECHNOLOGY_TRACKS } from './tracks';

export interface SearchItem {
  id: string;
  title: string;
  moduleTitle: string;
  moduleNumber: string;
  url: string;
  category: 'track' | 'module' | 'section' | 'practice';
  description?: string;
}

const DOCS_DIR = 'C:\\Users\\ayush\\OneDrive\\Desktop\\js-learning';

export function getSearchIndex(): SearchItem[] {
  const items: SearchItem[] = [];

  // 1. Index All Technology Tracks
  for (const track of TECHNOLOGY_TRACKS) {
    items.push({
      id: `track-${track.id}`,
      title: `${track.shortName}: ${track.name}`,
      moduleTitle: 'Learning Track',
      moduleNumber: track.shortName.toUpperCase(),
      url: `/tracks/${track.id}`,
      category: 'track',
      description: track.tagline
    });

    // Index track syllabus topics
    for (const topic of track.syllabus) {
      items.push({
        id: `topic-${track.id}-${topic.title.replace(/\s+/g, '-').toLowerCase()}`,
        title: `${track.shortName} / ${topic.title}`,
        moduleTitle: track.name,
        moduleNumber: 'Syllabus',
        url: `/tracks/${track.id}`,
        category: 'section',
        description: topic.description
      });
    }

    // Index key mastery domains / keywords
    for (const keyword of track.topics) {
      items.push({
        id: `domain-${track.id}-${keyword.replace(/\s+/g, '-').toLowerCase()}`,
        title: `${track.shortName}: ${keyword}`,
        moduleTitle: track.name,
        moduleNumber: 'Topic',
        url: `/tracks/${track.id}`,
        category: 'section',
        description: `Mastery domain in ${track.name}`
      });
    }
  }

  // 2. Index All Active JavaScript Curriculum Modules
  for (const m of MODULES) {
    items.push({
      id: m.slug,
      title: `JS Module ${m.number}: ${m.title}`,
      moduleTitle: m.title,
      moduleNumber: `Module ${m.number}`,
      url: `/modules/${m.slug}`,
      category: 'module',
      description: m.subtitle
    });

    // Extract level 1 and 2 headings from file
    const filePath = path.join(DOCS_DIR, m.fileName);
    if (fs.existsSync(filePath)) {
      try {
        const content = fs.readFileSync(filePath, 'utf8');
        const headingRegex = /^(#{1,3})\s+(.+)$/gm;
        let match;
        while ((match = headingRegex.exec(content)) !== null) {
          const text = match[2].trim().replace(/\*\*/g, '').replace(/`/g, '');
          const id = text
            .toLowerCase()
            .replace(/[^\w\s-]/g, '')
            .trim()
            .replace(/\s+/g, '-');

          if (text.length > 3 && !text.includes('Roadmap') && !text.includes('Beginner')) {
            items.push({
              id: `${m.slug}-${id}`,
              title: text,
              moduleTitle: m.title,
              moduleNumber: `Module ${m.number}`,
              url: `/modules/${m.slug}#${id}`,
              category: 'section'
            });
          }
        }
      } catch {
        // Skip unreadable files
      }
    }
  }

  // 3. Index Practice Problem Categories & Algorithmic Hub
  items.push(
    {
      id: 'practice-strings',
      title: 'String Algorithms (23 Problems with Dual Solutions)',
      moduleTitle: 'Practice Hub',
      moduleNumber: 'Practice',
      url: '/practice?category=strings',
      category: 'practice',
      description: 'Palindromes, anagrams, compression, matching, tokenization, with/without built-in methods.'
    },
    {
      id: 'practice-arrays',
      title: 'Array Algorithms (27 Problems with Dual Solutions)',
      moduleTitle: 'Practice Hub',
      moduleNumber: 'Practice',
      url: '/practice?category=arrays',
      category: 'practice',
      description: 'Two pointers, sliding window, deduplication, chunking, flattening, rotation, Kadane.'
    },
    {
      id: 'practice-objects',
      title: 'Object Algorithms & Operations (20 Problems)',
      moduleTitle: 'Practice Hub',
      moduleNumber: 'Practice',
      url: '/practice?category=objects',
      category: 'practice',
      description: 'Deep clone, flatten, key invert, diff, pick, omit, circular reference detection.'
    },
    // 4. Index Interview Arena
    {
      id: 'interview-hub',
      title: 'Senior & Staff Engineering Interview Arena',
      moduleTitle: 'Interview Hub',
      moduleNumber: 'Interview',
      url: '/interview',
      category: 'track',
      description: 'Technical evaluation workspace for JavaScript, TypeScript, React, NestJS, PostgreSQL, Redis, and System Design with notes and sticky tools.'
    }
  );

  return items;
}
