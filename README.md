# Engineering Masterclass Platform & JavaScript Curriculum

A full-stack, multi-track software engineering masterclass platform built with **Next.js 16 (App Router)**, **TypeScript**, **Tailwind CSS**, and **Turbopack**, accompanied by a deep-dive textbook curriculum covering V8 internals, memory architecture, execution contexts, and distributed systems.

---

## 🚀 Features

- **Multi-Stack Engineering Tracks**:
  - JavaScript Core & V8 Runtime Internals
  - TypeScript & Type Systems Architecture
  - React Internals (Fiber Reconciler, Priority Lanes, RSC)
  - NestJS & Enterprise Backend Microservices
  - PostgreSQL & Database Storage Internals (MVCC, WAL, B-Trees)
  - Redis In-Memory Reactor & Distributed Caching
  - High-Scale System Design & Distributed Transactions (Saga)
- **Interactive Interview Hub (`/interview`)**:
  - Structured Staff/Principal interview question cards.
  - Plain-English breakdown for every technical question.
  - Interactive **Keyword Decoder**: Click any tag to expand plain-English concept definitions.
  - Dedicated **Type Your Answer** workspace with live character/word counters and `localStorage` auto-saving.
  - Side-by-side **Compare Both** mode to evaluate your draft against the official Staff model answers.
  - Live progress bar tracking mastered questions and answered status.
- **Master Curriculum Textbook Reader (`/modules/[slug]`)**:
  - Interactive markdown reader with syntax-highlighted code blocks and 1-click copy.
  - Hierarchical Table of Contents with scrollspy progress.
  - In-place document editing and persistent personal notes drawer.
  - Draggable, floating sticky notes widget.
  - Text selection toolbar with durable multi-color highlighting.
- **Practice Arena (`/practice`)**:
  - 70 algorithm challenges spanning Strings, Arrays, and Objects.
  - Dual-solution architecture: Junior brute-force vs Senior optimized approach with time/space complexity analysis.
- **Global Cross-Stack Search (`⌘K` / `Ctrl+K`)**:
  - Instant fuzzy search across all 6 technology tracks, 9 curriculum textbooks, hundreds of section headings, and practice challenges.

---

## 📂 Project Structure

```
js-learning/
├── 00-QUEUE-AND-INDEX.md                  # Curriculum Roadmap & Module Index
├── 01-ENGINE-MEMORY-EXECUTION-CONTEXT.md  # Module 01: V8 JIT, Memory Layout, Call Stack
├── 02-PRIMITIVES-COERCION-AND-EQUALITY.md # Module 02: Types, Coercion, Equality
├── 03-OPERATORS-AND-CONTROL-FLOW.md       # Module 03: Control Flow & Operators
├── 04-FUNCTIONS-AND-EXECUTION-MODEL.md    # Module 04: Closures, Lexical Scope, 'this'
├── 05-STRINGS-AND-TEXT-PROCESSING.md      # Module 05: Strings, UTF-16, Surrogates
├── 06-ARRAYS-AND-COLLECTIONS.md           # Module 06: Arrays, Sets, Maps, Memory
├── 07-OBJECTS-MEMORY-AND-CLONING.md       # Module 07: Shapes, Descriptors, Cloning
├── JavaScript_Async_Programming_Complete.md # Async, Microtasks, libuv, Promises
└── web/                                   # Next.js 16 Web Application
    ├── src/
    │   ├── app/
    │   │   ├── interview/                 # Interview Hub & Answer Workspace
    │   │   ├── modules/                   # Dynamic Textbook Reader
    │   │   ├── practice/                  # Algorithm Practice Hub
    │   │   ├── tracks/                    # Multi-Stack Syllabus Pages
    │   │   └── page.tsx                   # Masterclass Home Portal
    │   ├── components/                    # UI Components, Readers & Modals
    │   └── lib/                           # Tracks, Modules, and Search Index
    └── package.json
```

---

## 🛠️ Getting Started

### Prerequisites
- Node.js 18+ (Node.js 20+ recommended)
- npm or yarn

### Installation & Run
```bash
# Navigate to web application
cd web

# Install dependencies
npm install

# Start development server
npm run dev

# Open http://localhost:3000 in your browser
```

### Production Build
```bash
cd web
npm run build
npm run start
```
