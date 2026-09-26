import fs from 'node:fs';
import path from 'node:path';
import { Marked } from 'marked';
import hljs from 'highlight.js';
import { MODULES, type ModuleMeta } from './modules-meta';

export { MODULES, type ModuleMeta } from './modules-meta';

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
