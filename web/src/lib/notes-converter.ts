import { Marked } from 'marked';
import hljs from 'highlight.js';

// Configure client-safe marked parser
export const notesMarked = new Marked({
  gfm: true,
  breaks: true,
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
      else if (rawLang === 'python' || rawLang === 'py') lang = 'python';
      else if (rawLang === 'sql') lang = 'sql';
      else if (rawLang && hljs.getLanguage(rawLang)) lang = rawLang;

      let highlighted = code;
      try {
        highlighted = hljs.highlight(code, { language: lang }).value;
      } catch {
        highlighted = hljs.highlightAuto(code).value;
      }

      const displayLang = (rawLang || 'text').toUpperCase();
      return `
<div class="code-block-container my-4">
  <div class="code-block-header flex items-center justify-between px-3 py-1.5 bg-slate-900 border-b border-slate-800">
    <span class="code-block-badge font-mono text-[11px] font-bold text-slate-400">${displayLang}</span>
    <button class="copy-code-btn text-[10px] text-slate-400 hover:text-white px-2 py-0.5 rounded bg-slate-800 border border-slate-700 hover:bg-slate-700 transition-colors" onclick="navigator.clipboard.writeText(this.closest('.code-block-container').querySelector('code').innerText); this.innerText='Copied!'; setTimeout(() => this.innerText='Copy', 2000)">Copy</button>
  </div>
  <pre class="p-3 overflow-x-auto text-xs bg-slate-950/70"><code class="hljs ${lang}">${highlighted}</code></pre>
</div>`;
    },
    blockquote(token) {
      const text = typeof token === 'object' && token && 'text' in token ? (token as { text: string }).text : String(token);
      
      // Parse GitHub style alerts: [!NOTE], [!TIP], [!IMPORTANT], [!WARNING], [!CAUTION]
      const alertMatch = text.match(/^\s*\[!(NOTE|TIP|IMPORTANT|WARNING|CAUTION)\]\s*([\s\S]*)$/i);
      if (alertMatch) {
        const type = alertMatch[1].toUpperCase();
        const content = alertMatch[2];

        const alertStyles: Record<string, { border: string; bg: string; text: string; icon: string; title: string }> = {
          NOTE: {
            border: 'border-blue-500',
            bg: 'bg-blue-950/40',
            text: 'text-blue-200',
            icon: 'ℹ️',
            title: 'NOTE'
          },
          TIP: {
            border: 'border-emerald-500',
            bg: 'bg-emerald-950/40',
            text: 'text-emerald-200',
            icon: '💡',
            title: 'PRO TIP'
          },
          IMPORTANT: {
            border: 'border-purple-500',
            bg: 'bg-purple-950/40',
            text: 'text-purple-200',
            icon: '⚡',
            title: 'CRITICAL ARCHITECTURE'
          },
          WARNING: {
            border: 'border-amber-500',
            bg: 'bg-amber-950/40',
            text: 'text-amber-200',
            icon: '⚠️',
            title: 'PRODUCTION WARNING'
          },
          CAUTION: {
            border: 'border-rose-500',
            bg: 'bg-rose-950/40',
            text: 'text-rose-200',
            icon: '🛑',
            title: 'HIGH RISK / SECURITY'
          }
        };

        const config = alertStyles[type] || alertStyles.NOTE;

        return `
<div class="my-4 border-l-4 ${config.border} ${config.bg} p-4 rounded-r-lg shadow-sm">
  <div class="flex items-center space-x-2 font-bold text-xs ${config.text} uppercase tracking-wider mb-1">
    <span>${config.icon}</span>
    <span>${config.title}</span>
  </div>
  <div class="text-sm text-slate-300 leading-relaxed">${content}</div>
</div>`;
      }

      return `<blockquote class="border-l-4 border-blue-500 bg-slate-800/60 p-3 my-4 rounded-r text-slate-300 italic">${text}</blockquote>`;
    }
  }
});

/**
 * Transforms raw text / quick notes into a formal Masterclass Engineering Module format.
 */
export function convertToMasterclassFormat(rawText: string, title: string, moduleName?: string): string {
  const cleanTitle = title.trim() || 'Core Engineering Concept & Deep Dive';
  const cleanModule = moduleName || 'General Engineering Architecture';
  const dateStr = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

  // If already formatted, avoid double wrapping
  if (rawText.includes('# Masterclass Study Guide:')) {
    return rawText;
  }

  return `# ${cleanTitle}

> **Target Module:** \`${cleanModule}\`  
> **Engineering Level:** Senior / Production Architect  
> **Last Updated:** ${dateStr}  
> **Status:** Verified Active Notes

---

## 01. Mental Model & First Principles

> [!NOTE]
> Establishing an unshakeable mental model before writing production code.

${rawText.trim() || 'Document your core thesis and mental models here.'}

---

## 02. Syntax Deconstruction & Core Mechanics

\`\`\`javascript
// Production implementation & type contracts
export function solution() {
  // Your implementation details here
  return true;
}
\`\`\`

---

## 03. Production Best Practices & Architectural Tradeoffs

| Practice | Verdict | Engineering Rationale & V8 / Kernel Impact |
|---|---|---|
| Zero-Copy Typed Memory | **DO** | Bypasses V8 Garbage Collector overhead and eliminates memory fragmentation. |
| Unbounded In-Memory Buffers | **DON'T** | Leaks RAM under heavy sustained streaming and triggers OS Out-Of-Memory termination. |

---

## 04. Senior Engineering Interview Challenge

<details>
<summary>Click to Reveal Deep Dive Explanation & Solution</summary>

### Architectural Breakdown

- **Time Complexity:** $O(1)$ amortized memory operations.
- **Space Complexity:** $O(N)$ contiguous byte backing store.
- **Engine Invariant:** Preserves hidden class shapes and avoids dictionary mode transitions.

</details>

---

## 05. Verification Checklist

- [ ] All edge cases handled (empty payloads, negative numbers, overflow boundaries).
- [ ] Memory leaks and dangling references eliminated.
- [ ] Constant-time operations used where cryptographic or security tokens are involved.
`;
}
