export interface SyllabusTopic {
  title: string;
  description: string;
  sectionsCount?: number;
  status: 'available' | 'in-progress' | 'planned';
  slug?: string;
}

export interface TechnologyTrack {
  id: string;
  name: string;
  shortName: string;
  category: 'languages' | 'frameworks' | 'databases' | 'systems';
  status: 'active' | 'in-progress' | 'planned';
  tagline: string;
  description: string;
  badge: string;
  accentColor: string;
  topics: string[];
  modulesCount: number;
  practiceCount?: number;
  syllabus: SyllabusTopic[];
}

export const TECHNOLOGY_TRACKS: TechnologyTrack[] = [
  {
    id: 'javascript',
    name: 'JavaScript Core & V8 Runtime',
    shortName: 'JavaScript',
    category: 'languages',
    status: 'active',
    tagline: 'Deep dive into ECMAScript specifications, memory architecture, and V8 internals.',
    description: 'Master the runtime mechanics of modern JavaScript: Call Stack, Heap Memory, Execution Contexts, Garbage Collection, Closures, Event Loop, Asynchronous pipelines, and algorithmic problem-solving.',
    badge: '16 Modules · 70 Problems',
    accentColor: 'amber',
    topics: [
      'Call Stack & Heap',
      'Execution Context',
      'V8 Engine & Shapes',
      'Closures & Scope Chain',
      'Event Loop & Microtasks',
      'Prototypes & Cloning',
      'Strings & Unicode',
      'Arrays & Collections',
      'Promises & Concurrency'
    ],
    modulesCount: 16,
    practiceCount: 70,
    syllabus: [
      {
        title: '00: Curriculum Queue & Index',
        description: 'Complete curriculum architecture, mental models, and deep learning strategies.',
        sectionsCount: 15,
        status: 'available',
        slug: '00-queue-and-index'
      },
      {
        title: '01: Engine, Memory & Execution Context',
        description: 'V8 JIT compilation, Call Stack, Memory Heap, Lexical Environments, and hoisting mechanics.',
        sectionsCount: 38,
        status: 'available',
        slug: '01-engine-memory-execution-context'
      },
      {
        title: '02: Primitives, Coercion & Equality',
        description: 'ECMAScript type conversion tables, Object.is, ToPrimitive symbol dispatch, and edge cases.',
        sectionsCount: 32,
        status: 'available',
        slug: '02-primitives-coercion-and-equality'
      },
      {
        title: '03: Operators & Control Flow',
        description: 'Bitwise mechanics, short-circuit evaluation, switch jump tables, and loop optimization.',
        sectionsCount: 28,
        status: 'available',
        slug: '03-operators-and-control-flow'
      },
      {
        title: '04: Functions & Execution Model',
        description: 'First-class citizens, closures, IIFEs, Arrow functions, binding rules (call, apply, bind).',
        sectionsCount: 45,
        status: 'available',
        slug: '04-functions-and-execution-model'
      },
      {
        title: '05: Strings & Text Processing',
        description: 'UTF-16 surrogate pairs, Unicode normalization, zero-mutation algorithms, and 23 practice problems.',
        sectionsCount: 52,
        status: 'available',
        slug: '05-strings-and-text-processing'
      },
      {
        title: '06: Arrays & Collections',
        description: 'Packed vs Holey arrays in V8, Map/Set hash mechanics, and 27 dual-solution algorithms.',
        sectionsCount: 65,
        status: 'available',
        slug: '06-arrays-and-collections'
      },
      {
        title: '07: Objects, Memory & Cloning',
        description: '131 sections: Property descriptors, hidden classes, WeakMap, structuredClone, and deep cloning.',
        sectionsCount: 131,
        status: 'available',
        slug: '07-objects-memory-and-cloning'
      },
      {
        title: '08: Scopes & Closures',
        description: 'Lexical Environments, Scope Chains, V8 Heap Context Allocation, Stale Closures & Token Buckets.',
        sectionsCount: 18,
        status: 'available',
        slug: '08-scopes-and-closures'
      },
      {
        title: '09: The this Keyword & Bindings',
        description: '4 Binding Rules, Lexical Arrow this, Reference Records, Polyfills, Fluent Builders & Active Record.',
        sectionsCount: 18,
        status: 'available',
        slug: '09-the-this-keyword-and-bindings'
      },
      {
        title: '10: Prototypes & Inheritance',
        description: '[[Prototype]], Chain Traversal, Shadowing, ES5 Inheritance, V8 ValidityCells & Prototype Pollution Defense.',
        sectionsCount: 18,
        status: 'available',
        slug: '10-prototypes-and-inheritance'
      },
      {
        title: '11: Classes & OOP Patterns',
        description: 'ES6 Desugaring, #private Fields, Dual-Linkage Inheritance, V8 Shapes & Enterprise Patterns.',
        sectionsCount: 18,
        status: 'available',
        slug: '11-classes-and-oop-patterns'
      },
      {
        title: '12: Regular Expressions & Symbols',
        description: 'V8 Irregexp Internals, ReDoS Defense, Well-Known Symbols & Metaprogramming Protocols.',
        sectionsCount: 16,
        status: 'available',
        slug: '12-regular-expressions-and-symbols'
      },
      {
        title: '13: Error Handling & Debugging',
        description: 'V8 Stack Unwinding, try/catch/finally Invariants, Custom Error Hierarchies & Telemetry.',
        sectionsCount: 16,
        status: 'available',
        slug: '13-error-handling-and-debugging'
      },
      {
        title: '14-16: Asynchronous Programming Complete',
        description: '172 sections: Microtask queue, Promise state machine, concurrency pools, web workers, and streams.',
        sectionsCount: 172,
        status: 'available',
        slug: 'javascript-async-programming-complete'
      },
      {
        title: '17: Modules & Code Organization',
        description: 'IIFE, CommonJS Wrapper, ESM 3-Phase Lifecycle, Live Bindings, Top-Level Await & Dual-Package Hazard.',
        sectionsCount: 16,
        status: 'available',
        slug: '17-modules-and-code-organization'
      }
    ]
  },
  {
    id: 'typescript',
    name: 'TypeScript & Type Systems',
    shortName: 'TypeScript',
    category: 'languages',
    status: 'in-progress',
    tagline: 'Type-level programming, compiler architecture, and strict static analysis.',
    description: 'From nominal vs structural type systems to advanced conditional types, template literal types, mapped types, distributive conditionals, and TypeScript Compiler API AST transformation.',
    badge: 'Curriculum In Progress',
    accentColor: 'blue',
    topics: [
      'Structural Type Systems',
      'Generics & Constraints',
      'Conditional Types',
      'Template Literal Types',
      'Mapped Types & Key Remapping',
      'Type-Level Gymnastics',
      'Branded Nominal Types',
      'Compiler API & AST',
      'tsconfig Best Practices'
    ],
    modulesCount: 8,
    syllabus: [
      {
        title: '01: Type Architecture & Structural Subtyping',
        description: 'Set theory in TypeScript: `unknown` vs `any` vs `never`, bottom types, and variance.',
        status: 'in-progress'
      },
      {
        title: '02: Generics & High-Order Type Operators',
        description: 'Generic constraints, inference (`infer`), and recursive type definitions.',
        status: 'planned'
      },
      {
        title: '03: Advanced Conditional & Mapped Types',
        description: 'Distributive conditional types, key remapping with `as`, and deep immutable types.',
        status: 'planned'
      },
      {
        title: '04: Template Literal Types & String Manipulation',
        description: 'Building type-safe route parsers, schema validators, and event buses at compile-time.',
        status: 'planned'
      },
      {
        title: '05: Compiler API, Transformers & AST',
        description: 'Writing custom TypeScript compiler plugins and automated code migration AST scripts.',
        status: 'planned'
      }
    ]
  },
  {
    id: 'react',
    name: 'React Internals & Architecture',
    shortName: 'React',
    category: 'frameworks',
    status: 'in-progress',
    tagline: 'Fiber reconciler, concurrent scheduler, and modern frontend architecture.',
    description: 'Understand how React works under the hood: Fiber node trees, lanes concurrency model, work loop, priority scheduling, hook state storage via linked lists, and React Server Components (RSC).',
    badge: 'Curriculum In Progress',
    accentColor: 'cyan',
    topics: [
      'Fiber Tree Architecture',
      'Concurrent Mode & Lanes',
      'Work Loop & Scheduling',
      'Hooks Linked List Internals',
      'Reconciliation Algorithm',
      'React Server Components (RSC)',
      'State Management Patterns',
      'Synthetic Event System',
      'Performance Profiling'
    ],
    modulesCount: 7,
    syllabus: [
      {
        title: '01: Virtual DOM vs Fiber Architecture',
        description: 'Stack reconciler limitations, 2-phase render/commit model, and Fiber node pointers.',
        status: 'in-progress'
      },
      {
        title: '02: The React Work Loop & Priority Lanes',
        description: 'MessageChannel time-slicing, cooperative multitasking, and transition interrupts.',
        status: 'planned'
      },
      {
        title: '03: Hooks Internals & Execution Model',
        description: 'How useState and useEffect maintain state across renders via circular linked lists.',
        status: 'planned'
      },
      {
        title: '04: Server Components (RSC) Architecture',
        description: 'Wire format serialization, flight client, streaming SSR, and zero-bundle-size components.',
        status: 'planned'
      },
      {
        title: '05: High-Performance Architecture',
        description: 'Compiler optimizations, memoization strategies, virtualization, and web worker offloading.',
        status: 'planned'
      }
    ]
  },
  {
    id: 'nest',
    name: 'NestJS & Enterprise Backend',
    shortName: 'NestJS',
    category: 'frameworks',
    status: 'in-progress',
    tagline: 'IoC containers, modular microservices, CQRS, and scalable API architecture.',
    description: 'Architecting scalable server-side applications with Node.js and TypeScript: Dependency Injection containers, middleware pipelines, guards/interceptors, microservice transports (RabbitMQ, Kafka, gRPC), and CQRS.',
    badge: 'Curriculum In Progress',
    accentColor: 'rose',
    topics: [
      'IoC & Dependency Injection',
      'Modular Architecture',
      'Execution Pipeline',
      'Guards, Interceptors & Filters',
      'Microservices (Kafka, RabbitMQ)',
      'gRPC & Protocol Buffers',
      'CQRS & Event Sourcing',
      'Prisma & TypeORM Integration',
      'Enterprise Authentication'
    ],
    modulesCount: 7,
    syllabus: [
      {
        title: '01: IoC Container & Injection Scopes',
        description: 'Reflect-metadata, default vs request vs transient scopes, and circular dependency resolution.',
        status: 'in-progress'
      },
      {
        title: '02: The Request Lifecycle Pipeline',
        description: 'Execution sequence: Middleware -> Guards -> Interceptors -> Pipes -> Controller -> Interceptors -> Filters.',
        status: 'planned'
      },
      {
        title: '03: Microservice Architectures & Transports',
        description: 'Hybrid applications with Kafka, RabbitMQ, Redis Pub/Sub, and high-throughput gRPC services.',
        status: 'planned'
      },
      {
        title: '04: CQRS, Event Sourcing & Domain-Driven Design',
        description: 'Command handlers, query buses, event stores, and read/write projection decoupling.',
        status: 'planned'
      }
    ]
  },
  {
    id: 'postgres',
    name: 'PostgreSQL & Database Internals',
    shortName: 'PostgreSQL',
    category: 'databases',
    status: 'in-progress',
    tagline: 'Storage engines, B-Tree indexes, MVCC, query planners, and ACID transactions.',
    description: 'Master enterprise relational databases: Heap tables, page layout, WAL (Write-Ahead Logging), MVCC isolation levels, EXPLAIN ANALYZE cost estimations, GIN/BRIN indexes, connection pooling, and sharding.',
    badge: 'Curriculum In Progress',
    accentColor: 'indigo',
    topics: [
      'Page Layout & Heap Files',
      'B-Tree, GIN & BRIN Indexes',
      'Write-Ahead Logging (WAL)',
      'MVCC & Transaction Isolation',
      'Query Optimizer & Cost Models',
      'Locks, Deadlocks & Advisory Locks',
      'Partitioning & Sharding',
      'Connection Pooling (PgBouncer)',
      'VACUUM & Autovacuum Tuning'
    ],
    modulesCount: 8,
    syllabus: [
      {
        title: '01: Storage Engine & Disk Page Architecture',
        description: '8KB page structure, item pointers, tuple headers, and TOAST storage for oversized attributes.',
        status: 'in-progress'
      },
      {
        title: '02: Indexing Mechanics: B-Tree, GIN & BRIN',
        description: 'Index scans vs Bitmap index scans, composite index order, covering indexes, and full-text search.',
        status: 'planned'
      },
      {
        title: '03: MVCC, Concurrency & Transaction Isolation',
        description: 'xmin/xmax visibility checks, snapshot isolation, dirty reads prevention, and serializable snapshot isolation (SSI).',
        status: 'planned'
      },
      {
        title: '04: Query Planner & Execution Engine',
        description: 'Reading EXPLAIN (ANALYZE, BUFFERS), sequential scans vs index scans, hash joins vs nested loops.',
        status: 'planned'
      },
      {
        title: '05: High-Availability, Replication & Partitioning',
        description: 'Streaming replication, WAL archiving, declarative table partitioning, and connection pool scaling.',
        status: 'planned'
      }
    ]
  },
  {
    id: 'redis',
    name: 'Redis & Distributed In-Memory Systems',
    shortName: 'Redis',
    category: 'databases',
    status: 'in-progress',
    tagline: 'In-memory data structures, eviction algorithms, persistence, and distributed coordination.',
    description: 'Deep dive into high-performance caching and distributed data structures: SDS strings, SkipLists, Radix trees, RDB/AOF persistence, Redis Streams, Pub/Sub, Redlock distributed locking algorithm, and cluster re-sharding.',
    badge: 'Curriculum In Progress',
    accentColor: 'red',
    topics: [
      'Single-Threaded Event Loop',
      'Internal Data Structures',
      'Eviction Policies (LRU, LFU)',
      'RDB & AOF Persistence',
      'Redis Streams & Consumer Groups',
      'Distributed Locks (Redlock)',
      'Pub/Sub & Event Brokering',
      'Redis Sentinel & Failover',
      'Cluster Mode & Hash Slots'
    ],
    modulesCount: 6,
    syllabus: [
      {
        title: '01: Memory Internals & Single-Threaded Architecture',
        description: 'AE event loop model, non-blocking I/O multiplexing, and SDS (Simple Dynamic String) memory efficiency.',
        status: 'in-progress'
      },
      {
        title: '02: Primitive & Advanced Data Structures',
        description: 'Hashes (ziplists/dict), Sorted Sets (skiplists), Bitmaps, HyperLogLog, and Geospatial indexes.',
        status: 'planned'
      },
      {
        title: '03: Persistence & Durability Mechanics',
        description: 'RDB point-in-time snapshots, AOF append-only logs with fsync policies, and AOF rewrite optimization.',
        status: 'planned'
      },
      {
        title: '04: Distributed Systems with Redis',
        description: 'Redis Streams consumer groups, pub/sub scalability, and building robust distributed locks with Lua scripts.',
        status: 'planned'
      },
      {
        title: '05: Clustering, High Availability & Sentinel',
        description: '16384 hash slots, cluster failover gossip protocol, and read-replica distribution.',
        status: 'planned'
      }
    ]
  }
];

export function getTrackById(id: string): TechnologyTrack | undefined {
  return TECHNOLOGY_TRACKS.find((t) => t.id === id);
}

