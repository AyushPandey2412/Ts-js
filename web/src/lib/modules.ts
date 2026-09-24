import fs from 'node:fs';
import path from 'node:path';
import { Marked } from 'marked';
import hljs from 'highlight.js';

export interface ModuleMeta {
  id: string;
  slug: string;
  number: string;
  title: string;
  subtitle: string;
  fileName: string;
  estimatedSections: number;
  badge: string;
}

export const MODULES: ModuleMeta[] = [
  {
    id: '00',
    slug: '00-queue-and-index',
    number: '00',
    title: 'Curriculum Queue & Index',
    subtitle: 'Master Curriculum Overview, Guiding Principles & Progress Tracking',
    fileName: '00-QUEUE-AND-INDEX.md',
    estimatedSections: 20,
    badge: 'Roadmap'
  },
  {
    id: '01',
    slug: '01-engine-memory-execution-context',
    number: '01',
    title: 'Engine, Memory & Execution Context',
    subtitle: 'V8 Engine Architecture, Memory Stack vs Heap, Call Stack, Scope Chains & TDZ',
    fileName: '01-ENGINE-MEMORY-EXECUTION-CONTEXT.md',
    estimatedSections: 15,
    badge: 'Core Engine'
  },
  {
    id: '02',
    slug: '02-primitives-coercion-and-equality',
    number: '02',
    title: 'Primitives, Coercion & Equality',
    subtitle: '7 Primitives, Stack Allocation, Implicit & Explicit Coercion, Equality Comparison Algorithms',
    fileName: '02-PRIMITIVES-COERCION-AND-EQUALITY.md',
    estimatedSections: 16,
    badge: 'Types & Memory'
  },
  {
    id: '03',
    slug: '03-operators-and-control-flow',
    number: '03',
    title: 'Operators & Control Flow',
    subtitle: 'Short-circuit Logic, Nullish Coalescing, Optional Chaining, Loops & Control Mechanics',
    fileName: '03-OPERATORS-AND-CONTROL-FLOW.md',
    estimatedSections: 14,
    badge: 'Control Flow'
  },
  {
    id: '04',
    slug: '04-functions-and-execution-model',
    number: '04',
    title: 'Functions & Execution Model',
    subtitle: 'Declarations vs Expressions vs Arrows, Lexical this, Closures, Higher-Order Functions',
    fileName: '04-FUNCTIONS-AND-EXECUTION-MODEL.md',
    estimatedSections: 22,
    badge: 'Functions'
  },
  {
    id: '05',
    slug: '05-strings-and-text-processing',
    number: '05',
    title: 'Strings & Text Processing',
    subtitle: 'UTF-16 Mechanics, Immutability, All String Methods & 23 Graded Algorithms with Dual Solutions',
    fileName: '05-STRINGS-AND-TEXT-PROCESSING.md',
    estimatedSections: 35,
    badge: 'Strings & Algorithms'
  },
  {
    id: '06',
    slug: '06-arrays-and-collections',
    number: '06',
    title: 'Arrays & Collections',
    subtitle: 'Contiguous vs Holey Elements, Mutation vs Immutability, HOF Internals, TypedArrays, Sets & Maps',
    fileName: '06-ARRAYS-AND-COLLECTIONS.md',
    estimatedSections: 40,
    badge: 'Data Structures'
  },
  {
    id: '07',
    slug: '07-objects-memory-and-cloning',
    number: '07',
    title: 'Objects, Memory & Cloning',
    subtitle: '131-Section Masterclass: Property Descriptors, Prototype Chains, V8 Shapes, structuredClone & Security',
    fileName: '07-OBJECTS-MEMORY-AND-CLONING.md',
    estimatedSections: 131,
    badge: 'Deep Dive'
  },
  {
    id: '08',
    slug: '08-scopes-and-closures',
    number: '08',
    title: 'Scopes & Closures',
    subtitle: 'Lexical Environments, Scope Chains, V8 Heap Context Allocation, Stale Closures & Token Buckets',
    fileName: '08-SCOPES-AND-CLOSURES.md',
    estimatedSections: 18,
    badge: 'Memory & Scope'
  },
  {
    id: '09',
    slug: '09-the-this-keyword-and-bindings',
    number: '09',
    title: 'The this Keyword & Bindings',
    subtitle: '4 Binding Rules, Lexical Arrow this, Reference Records, Polyfills, Fluent Builders & Active Record',
    fileName: '09-THE-THIS-KEYWORD-AND-BINDINGS.md',
    estimatedSections: 18,
    badge: 'Execution Model'
  },
  {
    id: '10',
    slug: '10-prototypes-and-inheritance',
    number: '10',
    title: 'Prototypes, Prototypal Inheritance & Delegation',
    subtitle: '[[Prototype]], Chain Traversal, Shadowing, ES5 Inheritance, V8 ValidityCells & Prototype Pollution Defense',
    fileName: '10-PROTOTYPES-AND-INHERITANCE.md',
    estimatedSections: 18,
    badge: 'Object Mechanics'
  },
  {
    id: '11',
    slug: '11-classes-and-oop-patterns',
    number: '11',
    title: 'Classes, OOP Patterns & Private Encapsulation',
    subtitle: 'ES6 Desugaring, #private Fields, Dual-Linkage Inheritance, V8 Shapes & Enterprise Patterns',
    fileName: '11-CLASSES-AND-OOP-PATTERNS.md',
    estimatedSections: 18,
    badge: 'OOP Architecture'
  },
  {
    id: 'async',
    slug: 'javascript-async-programming-complete',
    number: '14-16',
    title: 'Asynchronous Programming Complete',
    subtitle: '172-Section Textbook: Event Loop, Tasks/Microtasks, Promises, Concurrency Pools, Workers & Streams',
    fileName: 'JavaScript_Async_Programming_Complete.md',
    estimatedSections: 172,
    badge: 'Senior Masterclass'
  }
];

// Configure marked with highlight.js and heading ids
const marked = new Marked({
  gfm: true,
  breaks: false,
  renderer: {
    heading(token) {
      const text = typeof token === 'object' && token && 'text' in token ? (token as { text: string }).text : String(token);
      const depth = typeof token === 'object' && token && 'depth' in token ? (token as { depth: number }).depth : 2;
      const cleanText = String(text)
        .replace(/<[^>]*>/g, '')
        .replace(/\*\*/g, '')
        .replace(/`/g, '')
        .trim();
      const id = cleanText
        .toLowerCase()
        .replace(/[^\w\s-]/g, '')
        .replace(/\s+/g, '-');
      return `<h${depth} id="${id}" class="scroll-mt-16">${text}</h${depth}>\n`;
    },
    code(token) {
      const code = typeof token === 'object' ? token.text : token;
      let rawLang = (typeof token === 'object' ? token.lang : '') || '';
      rawLang = rawLang.trim().toLowerCase();

      let lang = 'plaintext';
      if (rawLang === 'js' || rawLang === 'javascript') lang = 'javascript';
      else if (rawLang === 'ts' || rawLang === 'typescript') lang = 'typescript';
      else if (rawLang === 'json') lang = 'json';
      else if (rawLang === 'bash' || rawLang === 'sh') lang = 'bash';
      else if (rawLang === 'html') lang = 'xml';
      else if (rawLang && hljs.getLanguage(rawLang)) lang = rawLang;

      let highlighted = code;
      try {
        highlighted = hljs.highlight(code, { language: lang }).value;
      } catch {
        highlighted = hljs.highlightAuto(code).value;
      }

      const displayLang = (rawLang || 'text').toUpperCase();
      return `
<div class="code-block-container">
  <div class="code-block-header flex items-center justify-between">
    <span class="code-block-badge">${displayLang}</span>
    <button class="copy-code-btn" onclick="navigator.clipboard.writeText(this.closest('.code-block-container').querySelector('code').innerText); this.innerText='Copied!'; setTimeout(() => this.innerText='Copy', 2000)">Copy</button>
  </div>
  <pre><code class="hljs ${lang}">${highlighted}</code></pre>
</div>`;
    }
  }
});

const DOCS_DIR = process.env.DOCS_DIR || path.resolve(process.cwd(), '..');

export function getModuleBySlug(slug: string): ModuleMeta | undefined {
  return MODULES.find((m) => m.slug === slug);
}

export interface TableOfContentsItem {
  id: string;
  text: string;
  level: number;
}

export function getModuleContent(slug: string): { meta: ModuleMeta; html: string; toc: TableOfContentsItem[] } | null {
  const meta = getModuleBySlug(slug);
  if (!meta) return null;

  const fullPath = path.join(DOCS_DIR, meta.fileName);
  if (!fs.existsSync(fullPath)) {
    return null;
  }

  const rawMarkdown = fs.readFileSync(fullPath, 'utf8');

  // Extract table of contents headings
  const toc: TableOfContentsItem[] = [];
  const headingRegex = /^(#{1,3})\s+(.+)$/gm;
  let match;
  while ((match = headingRegex.exec(rawMarkdown)) !== null) {
    const level = match[1].length;
    const text = match[2].trim().replace(/\*\*/g, '').replace(/`/g, '');
    const id = text
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-');
    toc.push({ id, text, level });
  }

  const html = marked.parse(rawMarkdown) as string;

  return {
    meta,
    html,
    toc
  };
}

