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
    badge: 'Language Foundations'
  },
  {
    id: '03',
    slug: '03-operators-and-control-flow',
    number: '03',
    title: 'Operators & Control Flow Mechanics',
    subtitle: 'Short-Circuiting, Nullish Coalescing, Optional Chaining, Bitwise Operators & Switch Optimization',
    fileName: '03-OPERATORS-AND-CONTROL-FLOW.md',
    estimatedSections: 15,
    badge: 'Language Foundations'
  },
  {
    id: '04',
    slug: '04-functions-and-execution-model',
    number: '04',
    title: 'Functions & Execution Model',
    subtitle: 'Function Declarations vs Expressions, Arrow Functions, Arguments Object, Rest/Spread, Currying',
    fileName: '04-FUNCTIONS-AND-EXECUTION-MODEL.md',
    estimatedSections: 18,
    badge: 'Functional Architecture'
  },
  {
    id: '05',
    slug: '05-strings-and-text-processing',
    number: '05',
    title: 'Strings, Unicode & Text Processing',
    subtitle: 'UTF-16 Code Units, Surrogate Pairs, Normalization (NFC/NFD), Tagged Templates, RegExp & 23 Algorithms',
    fileName: '05-STRINGS-AND-TEXT-PROCESSING.md',
    estimatedSections: 25,
    badge: 'Data Structures & Algorithms'
  },
  {
    id: '06',
    slug: '06-arrays-and-collections',
    number: '06',
    title: 'Arrays, TypedArrays, Map & Set',
    subtitle: 'V8 Elements Kinds (PACKED vs HOLEY), Iterators, Map/Set Hash Tables, WeakMap & 27 Algorithms',
    fileName: '06-ARROWS-AND-COLLECTIONS.md',
    estimatedSections: 28,
    badge: 'Data Structures & Algorithms'
  },
  {
    id: '07',
    slug: '07-objects-memory-and-cloning',
    number: '07',
    title: 'Objects, Memory & Deep Cloning',
    subtitle: 'V8 Hidden Classes, Property Descriptors, Object.freeze, Structured Clone & Prototype Pollution Defense',
    fileName: '07-OBJECTS-MEMORY-AND-CLONING.md',
    estimatedSections: 22,
    badge: 'Memory & OOP'
  },
  {
    id: '08',
    slug: '08-prototypes-and-inheritance',
    number: '08',
    title: 'Prototypes & Prototypal Inheritance',
    subtitle: '[[Prototype]] Chain, Object.create(), __proto__ mechanics, Class Desugaring & Polymorphism',
    fileName: '08-PROTOTYPES-AND-INHERITANCE.md',
    estimatedSections: 20,
    badge: 'Memory & OOP'
  },
  {
    id: '09',
    slug: '09-the-this-keyword-and-bindings',
    number: '09',
    title: 'The `this` Keyword & Execution Bindings',
    subtitle: 'Default, Implicit, Explicit (call/apply/bind), New, and Lexical Arrow Bindings in V8 Contexts',
    fileName: '09-THE-THIS-KEYWORD-AND-BINDINGS.md',
    estimatedSections: 18,
    badge: 'Core Runtime'
  },
  {
    id: '10',
    slug: '10-closures-and-lexical-scope',
    number: '10',
    title: 'Closures, Lexical Scope & Encapsulation',
    subtitle: 'Environment Records, Scope Chains, Garbage Collection Retention & Encapsulation Patterns',
    fileName: '10-CLOSURES-AND-LEXICAL-SCOPE.md',
    estimatedSections: 18,
    badge: 'Core Runtime'
  },
  {
    id: '11',
    slug: '11-classes-and-oop-patterns',
    number: '11',
    title: 'Classes, Private Fields & OOP Patterns',
    subtitle: 'Class Syntax Desugaring, Private Fields (#), Static Blocks, Subclassing, Mixins & SOLID Design',
    fileName: '11-CLASSES-AND-OOP-PATTERNS.md',
    estimatedSections: 18,
    badge: 'Object-Oriented Design'
  },
  {
    id: '12',
    slug: '12-regular-expressions-and-symbols',
    number: '12',
    title: 'Regular Expressions & Well-Known Symbols',
    subtitle: 'V8 Irregexp Engine, ReDoS Defense, Well-Known Symbols & Metaprogramming Protocols',
    fileName: '12-REGULAR-EXPRESSIONS-AND-SYMBOLS.md',
    estimatedSections: 16,
    badge: 'Metaprogramming'
  },
  {
    id: '13',
    slug: '13-error-handling-and-debugging',
    number: '13',
    title: 'Error Handling, Call Stacks & Production Debugging',
    subtitle: 'V8 Stack Unwinding, try/catch/finally Invariants, Custom Error Hierarchies & Telemetry',
    fileName: '13-ERROR-HANDLING-AND-DEBUGGING.md',
    estimatedSections: 16,
    badge: 'Production Engineering'
  },
  {
    id: '14-16',
    slug: 'javascript-async-programming-complete',
    number: '14–16',
    title: 'Asynchronous Programming Complete Masterclass',
    subtitle: 'Event Loop, Microtasks, Promises, Async/Await, AbortController, Concurrency Pools & Web Workers',
    fileName: 'JavaScript_Async_Programming_Complete.md',
    estimatedSections: 172,
    badge: 'Advanced Concurrency'
  },
  {
    id: '17',
    slug: '17-modules-and-code-organization',
    number: '17',
    title: 'Modules, Dependency Graphs & Code Organization',
    subtitle: 'IIFE, CommonJS Wrapper, ESM 3-Phase Lifecycle, Live Bindings, Top-Level Await & Dual-Package Hazard',
    fileName: '17-MODULES-AND-CODE-ORGANIZATION.md',
    estimatedSections: 16,
    badge: 'Architecture & Bundling'
  },
  {
    id: '18',
    slug: '18-nodejs-process-and-filesystem',
    number: '18',
    title: 'Node.js Process Architecture, Signals & Secure Filesystem',
    subtitle: 'libuv Threadpool, POSIX Signals, fs/promises, Atomic Writes & Directory Traversal Defense',
    fileName: '18-NODEJS-PROCESS-AND-FILESYSTEM.md',
    estimatedSections: 15,
    badge: 'Runtime & Filesystem'
  },
  {
    id: '19',
    slug: '19-binary-data-and-buffers',
    number: '19',
    title: 'Binary Data, ArrayBuffers, TypedArrays & Node.js Buffers',
    subtitle: 'Memory Layout, DataView, Endianness, Slab Allocator, Atomics & Zero-Copy Binary Protocols',
    fileName: '19-BINARY-DATA-AND-BUFFERS.md',
    estimatedSections: 15,
    badge: 'Systems & Binary'
  },
  {
    id: '21',
    slug: '21-crypto-hashing-and-integrity',
    number: '21',
    title: 'Cryptography, Hashing & Data Integrity',
    subtitle: 'node:crypto, Web Crypto API, OpenSSL, SHA-256, HMAC, AES-256-GCM, Timing Defense & Ed25519',
    fileName: '21-CRYPTO-HASHING-AND-INTEGRITY.md',
    estimatedSections: 15,
    badge: 'Security & Cryptography'
  }
];
