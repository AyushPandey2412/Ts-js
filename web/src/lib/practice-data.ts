import fs from 'node:fs';
import path from 'node:path';
import { Marked } from 'marked';
import hljs from 'highlight.js';

export interface PracticeProblem {
  id: number;
  category: 'strings' | 'arrays' | 'objects';
  title: string;
  difficulty: string;
  htmlContent: string;
}

const marked = new Marked({
  gfm: true,
  breaks: false,
  renderer: {
    code(token) {
      const code = typeof token === 'object' ? token.text : token;
      let rawLang = (typeof token === 'object' ? token.lang : '') || '';
      rawLang = rawLang.trim().toLowerCase();

      let lang = 'plaintext';
      if (rawLang === 'js' || rawLang === 'javascript') lang = 'javascript';
      else if (rawLang === 'json') lang = 'json';
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

const DOCS_DIR = 'C:\\Users\\ayush\\OneDrive\\Desktop\\js-learning';

export function getBeginnerStringProblems(): PracticeProblem[] {
  const filePath = path.join(DOCS_DIR, '05-STRINGS-AND-TEXT-PROCESSING.md');
  if (!fs.existsSync(filePath)) return [];

  const content = fs.readFileSync(filePath, 'utf8');
  const startMarker = '## 26. String Algorithms — Beginner (1 to 23)';
  const endMarker = '## 27. String Algorithms — Intermediate (24 to 49)';

  const startIndex = content.indexOf(startMarker);
  const endIndex = content.indexOf(endMarker);

  if (startIndex === -1 || endIndex === -1) return [];

  const sec26Text = content.slice(startIndex, endIndex);
  const problemRegex = /### Problem\s+(\d+):\s+([^(]+)\s*\(([^)]+)\)/g;
  const problems: PracticeProblem[] = [];

  const matches: { id: number; title: string; difficulty: string; index: number }[] = [];
  let m;
  while ((m = problemRegex.exec(sec26Text)) !== null) {
    matches.push({
      id: parseInt(m[1], 10),
      title: m[2].trim(),
      difficulty: m[3].trim(),
      index: m.index
    });
  }

  for (let i = 0; i < matches.length; i++) {
    const current = matches[i];
    const next = matches[i + 1];
    const chunk = next
      ? sec26Text.slice(current.index, next.index)
      : sec26Text.slice(current.index);

    const htmlContent = marked.parse(chunk) as string;

    problems.push({
      id: current.id,
      category: 'strings',
      title: current.title,
      difficulty: current.difficulty,
      htmlContent
    });
  }

  return problems;
}

export function getBeginnerArrayProblems(): PracticeProblem[] {
  const filePath = path.join(DOCS_DIR, '06-ARRAYS-AND-COLLECTIONS.md');
  if (!fs.existsSync(filePath)) return [];

  const content = fs.readFileSync(filePath, 'utf8');
  const startMarker = '### Part 1: Beginner Array Algorithms (1 – 27)';
  const endMarker = '### Part 2: Intermediate Array Algorithms';

  const startIndex = content.indexOf(startMarker);
  const endIndex = content.indexOf(endMarker);
  if (startIndex === -1 || endIndex === -1) return [];

  const text = content.slice(startIndex, endIndex);
  const arrRegex = /#### (\d+)\.\s+([^\n]+)\n\* \*\*Problem\*\*:\s+([^\n]+)\n([\s\S]*?)(?=#### \d+\.|$)/g;

  const problems: PracticeProblem[] = [];
  let match;
  while ((match = arrRegex.exec(text)) !== null) {
    const id = parseInt(match[1], 10);
    const title = match[2].trim();
    const problemDesc = match[3].trim();
    const solutionSnippet = match[4].trim();

    // Construct clean Markdown with collapsible solution toggle
    const markdown = `
#### Problem Description
${problemDesc}

<details>
<summary><b>Click to Reveal Solution & Complexity</b></summary>

#### Solution Implementation
${solutionSnippet}
</details>
`;

    const htmlContent = marked.parse(markdown) as string;
    problems.push({
      id,
      category: 'arrays',
      title,
      difficulty: 'Easy',
      htmlContent
    });
  }

  return problems;
}

export function getBeginnerObjectProblems(): PracticeProblem[] {
  const filePath = path.join(DOCS_DIR, '07-OBJECTS-MEMORY-AND-CLONING.md');
  if (!fs.existsSync(filePath)) return [];

  const content = fs.readFileSync(filePath, 'utf8');
  const startMarker = '## Level 1 — Beginner Exercises (1 to 20)';
  const endMarker = '## Level 2 — Intermediate Exercises';

  const startIndex = content.indexOf(startMarker);
  const endIndex = content.indexOf(endMarker);
  if (startIndex === -1 || endIndex === -1) return [];

  const text = content.slice(startIndex, endIndex);
  const objRegex = /\*\*(\d+)\.\s+([^*]+)\*\*:\s+([^\n]+)\n([\s\S]*?)(?=\*\*\d+\.|$)/g;

  const problems: PracticeProblem[] = [];
  let match;
  while ((match = objRegex.exec(text)) !== null) {
    const id = parseInt(match[1], 10);
    const title = match[2].trim();
    const problemDesc = match[3].trim();
    const solutionSnippet = match[4].trim();

    const markdown = `
#### Problem Description
${problemDesc}

<details>
<summary><b>Click to Reveal Solution & Code</b></summary>

#### Solution Implementation
${solutionSnippet}
</details>
`;

    const htmlContent = marked.parse(markdown) as string;
    problems.push({
      id,
      category: 'objects',
      title,
      difficulty: 'Beginner',
      htmlContent
    });
  }

  return problems;
}

export function getAllPracticeProblems() {
  return {
    strings: getBeginnerStringProblems(),
    arrays: getBeginnerArrayProblems(),
    objects: getBeginnerObjectProblems()
  };
}
