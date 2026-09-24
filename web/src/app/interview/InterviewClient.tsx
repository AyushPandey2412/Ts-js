'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import Link from 'next/link';

export type TechCategory = 'javascript' | 'typescript' | 'react' | 'nest' | 'postgres' | 'redis' | 'system-design';

export interface KeywordConcept {
  term: string;
  explanation: string;
}

interface DomainQuestion {
  id: string;
  category: TechCategory;
  categoryLabel: string;
  domainName: string;
  badge: string;
  tags: string[];
  prompt: string;
  plainEnglish: string;
  keyConcepts: KeywordConcept[];
  talkingPoints: string[];
  keyTradeoff: string;
}

interface InterviewTrack {
  id: TechCategory;
  name: string;
  shortName: string;
  badge: string;
  level: string;
  overview: string;
  accentColor: string;
  questions: DomainQuestion[];
}

const INTERVIEW_TRACKS: Record<TechCategory, InterviewTrack> = {
  javascript: {
    id: 'javascript',
    name: 'JavaScript & V8 Runtime Internals',
    shortName: 'JavaScript',
    badge: 'Core Engine',
    level: 'Senior to Principal',
    accentColor: 'amber',
    overview: 'Targeted architectural questions evaluating V8 memory heap layout, scavenger/mark-sweep-compact generational GC, lexical scope chain, event loop task queues, and hidden class shape transitions.',
    questions: [
      {
        id: 'js-memory-gc',
        category: 'javascript',
        categoryLabel: 'JavaScript Engine',
        domainName: 'Memory Heap Allocation & V8 Generational Garbage Collection',
        badge: 'Memory Management',
        tags: ['Young vs Old Space', 'Cheney Copying Algorithm', 'Scavenge Minor GC', 'Promotion Thresholds'],
        prompt: 'How does the V8 engine partition heap memory between New Space and Old Space, and under what exact mechanical conditions does an allocation get promoted to Old Space?',
        plainEnglish: 'How does V8 divide RAM between short-lived temporary variables and permanent objects, and what determines when an object gets promoted to the permanent Old Space?',
        keyConcepts: [
          { term: 'Young vs Old Space', explanation: 'V8 divides heap RAM into Young Space (for newly created short-lived objects) and Old Space (for long-surviving data).' },
          { term: 'Scavenger GC', explanation: 'A lightning-fast cleanup (<1ms) that only inspects Young Space and cleans up temporary variables.' },
          { term: 'Cheney Copying Algorithm', explanation: 'Copies surviving live objects into a clean memory block and wipes out all dead objects in a single fast sweep.' },
          { term: 'Promotion Threshold', explanation: 'Objects that survive multiple minor GC sweeps get moved into the permanent Old Space.' }
        ],
        talkingPoints: [
          'V8 splits memory into New Space (1–64MB) and Old Space (~1.4GB+). New allocations occur in the "From" semi-space of the Young Generation.',
          'Minor GC (Scavenger) runs Cheney\'s copying algorithm: surviving live objects are copied to the "To" semi-space while dead objects are discarded in bulk.',
          'Promotion rule: If an object has already survived one Scavenge cycle, or if the "To" space becomes more than 25% full during evacuation, it is promoted directly to the Old Space.',
          'Major GC runs three phases: Incremental Marking (interleaved with JavaScript execution to prevent long UI pauses), Concurrent Sweeping, and Lazy Compaction to defragment memory.'
        ],
        keyTradeoff: 'Frequent minor collections yield short sub-millisecond pauses, but excessive object promotion degrades Old Space and eventually forces expensive Major GC stop-the-world compaction.'
      },
      {
        id: 'js-async-libuv',
        category: 'javascript',
        categoryLabel: 'JavaScript Engine',
        domainName: 'Event Loop Prioritization & Microtask Queue Mechanics',
        badge: 'Event Loop & Concurrency',
        tags: ['Microtasks vs Macrotasks', 'libuv Phases', 'process.nextTick', 'Starvation Risks'],
        prompt: 'Detail the exact sequence of execution when a Promise resolves inside a process.nextTick vs setTimeout(0) vs setImmediate() in Node.js, and how microtask starvation occurs.',
        plainEnglish: 'In what exact priority order does Node.js run Promises, setTimeout, and process.nextTick, and how can an endless microtask loop freeze your entire server?',
        keyConcepts: [
          { term: 'Microtasks vs Macrotasks', explanation: 'Microtasks (Promises) run immediately after current JavaScript code finishes, before any timer or I/O macrotask.' },
          { term: 'process.nextTick', explanation: 'A special Node.js queue that runs before all other microtasks, even before Promise .then callbacks.' },
          { term: 'libuv Event Loop', explanation: 'The background C engine in Node.js coordinating timers, network calls, and file I/O across distinct phases.' },
          { term: 'Microtask Starvation', explanation: 'If microtasks repeatedly trigger new microtasks, the event loop can never transition to timers or I/O, freezing the process.' }
        ],
        talkingPoints: [
          'In Node.js, process.nextTick is not part of libuv; it lives in the NextTickQueue managed directly by the V8/Node bridge.',
          'Priority order after current call stack empties: NextTickQueue -> Other Microtasks (Promise reactions) -> libuv Phase Macrotask (Timers -> Poll -> Check).',
          'Recursive process.nextTick() calls starve the event loop entirely because libuv can never transition to the next phase until the NextTickQueue is completely exhausted.',
          'setImmediate executes during libuv\'s "Check" phase (immediately following the Poll phase), while setTimeout(0) evaluates in the "Timers" phase.'
        ],
        keyTradeoff: 'queueMicrotask() provides clean async ordering before UI repaints, but infinite microtask loops freeze all DOM rendering and macrotask dispatch.'
      },
      {
        id: 'js-shapes-ic',
        category: 'javascript',
        categoryLabel: 'JavaScript Engine',
        domainName: 'Hidden Classes (Shapes), Inline Caching & Prototype Chains',
        badge: 'V8 JIT Optimization',
        tags: ['Hidden Classes (Maps)', 'Inline Caches (ICs)', 'Shape Divergence', 'Delete Operator Gotcha'],
        prompt: 'Why does deleting an object property or instantiating objects with properties in different order degrade V8 performance from monomorphic fast properties to slow dictionary mode?',
        plainEnglish: 'Why does deleting an object property (`delete user.age`) or declaring properties in a different order make your code run significantly slower in V8?',
        keyConcepts: [
          { term: 'Hidden Classes (Shapes)', explanation: 'V8\'s internal blueprints that track where each property lives in memory so it doesn\'t have to look them up like a slow hash table.' },
          { term: 'Inline Caching (ICs)', explanation: 'A 1-CPU-cycle shortcut: V8 remembers the memory location of properties from previous calls so property access is near-instant.' },
          { term: 'Shape Divergence', explanation: 'Writing { a: 1, b: 2 } and { b: 2, a: 1 } creates two different internal blueprints, which confuses the cache and slows down code.' },
          { term: 'delete Operator Gotcha', explanation: 'Using the `delete` keyword destroys the blueprint and forces V8 into slow "dictionary mode" (a generic hash table).' }
        ],
        talkingPoints: [
          'V8 assigns a hidden class (Shape/Map) describing property offsets. Adding property `a` then `b` transitions Map0 -> Map1 -> Map2.',
          'Instantiating `obj1 = { a, b }` vs `obj2 = { b, a }` creates two distinct shape transition branches (shape divergence), turning inline caches polymorphic.',
          'Using the `delete` operator alters the property descriptor and forces V8 to drop the object into slow dictionary mode (hash table lookup instead of fixed memory offset).',
          'Best practice: Set properties to `null` or `undefined` rather than using `delete`, and always initialize properties in consistent constructor order.'
        ],
        keyTradeoff: 'Fast in-object properties offer near C-struct field access speed, but require strict shape consistency across all instances.'
      }
    ]
  },
  typescript: {
    id: 'typescript',
    name: 'TypeScript & Type Systems Architecture',
    shortName: 'TypeScript',
    badge: 'Static Analysis',
    level: 'Senior to Staff',
    accentColor: 'blue',
    overview: 'High-order type engineering, distributive conditional types, template literal pattern matching, nominal branding, covariance/contravariance, and compiler transformer pipelines.',
    questions: [
      {
        id: 'ts-conditionals-infer',
        category: 'typescript',
        categoryLabel: 'TypeScript Type System',
        domainName: 'Type-Level Programming: Distributive Conditionals & `infer`',
        badge: 'Advanced Type System',
        tags: ['Distributive Conditionals', 'infer Keyword', 'Recursive Types', 'Pattern Matching'],
        prompt: 'Implement a recursive `DeepReadonly<T>` and `Flatten<T>` utility that handles nested objects, arrays, and primitive leaf nodes, and explain distributive conditional mechanics.',
        plainEnglish: 'How do you write types that inspect, unwrap, and transform deeply nested objects or arrays at compile time using pattern matching?',
        keyConcepts: [
          { term: 'Distributive Conditionals', explanation: 'Conditional types automatically split across union types (e.g. T extends any evaluates each union member individually).' },
          { term: 'infer Keyword', explanation: 'Declares a placeholder variable inside a type condition to capture and extract an inner type (like unwrapping a Promise).' },
          { term: 'Recursive Types', explanation: 'Types that reference themselves to traverse deeply nested objects or arrays of arbitrary depth.' },
          { term: 'DeepReadonly', explanation: 'A utility type that recursively marks every property and nested sub-property as immutable.' }
        ],
        talkingPoints: [
          'Conditional types distribute over union types if the checked type parameter is "naked" (i.e. `T extends any ? F<T> : never`). Wrapping `[T] extends [any]` disables distribution.',
          'The `infer` keyword declares an inferred type variable inside the `extends` clause, allowing runtime-like pattern matching at compile time.',
          'Deep recursion requires guarding against built-in prototypes (Function, Date, RegExp) to prevent infinite compile-time expansion.',
          'TypeScript compiler imposes a recursion depth limit (1000 stack frames); tail-call optimization patterns using accumulator tuples bypass depth ceilings.'
        ],
        keyTradeoff: 'Extreme type-level programming produces rock-solid zero-runtime contracts, but excessively complex recursive types severely increase `tsc` build times.'
      },
      {
        id: 'ts-variance-nominal',
        category: 'typescript',
        categoryLabel: 'TypeScript Type System',
        domainName: 'Subtyping, Variance & Nominal Branding for Security',
        badge: 'Architecture & Security',
        tags: ['Nominal Branding', 'Covariance vs Contravariance', 'strictFunctionTypes', 'Type Narrowing'],
        prompt: 'Explain covariance and contravariance in TypeScript method signatures versus property function signatures with strictFunctionTypes enabled, and demonstrate nominal branding.',
        plainEnglish: 'How does TypeScript decide if one function type can safely substitute for another, and how do you prevent passing a raw string where a secure UserId is required?',
        keyConcepts: [
          { term: 'Covariance', explanation: 'Subtypes can replace supertypes in return values (e.g. returning a Dog is valid if Animal is expected).' },
          { term: 'Contravariance', explanation: 'Function argument types reverse subtyping order: an accepting function must accept the broader supertype.' },
          { term: 'Nominal Branding', explanation: 'Adding a unique hidden tag (brand) to a primitive like string so you cannot accidentally pass an email where a UserId is required.' },
          { term: 'strictFunctionTypes', explanation: 'A TypeScript compiler flag that enforces correct mathematical safety for function parameter types.' }
        ],
        talkingPoints: [
          'Covariance: Subtype can be used where supertype is expected (`Dog` -> `Animal`). Return types are always covariant.',
          'Contravariance: Reversal of subtyping order. Function parameter types must be contravariant when `strictFunctionTypes` is enabled.',
          'Method shorthand syntax `method(x: T): void` remains bivariant for historical compatibility, while property arrow functions `method: (x: T) => void` are strictly contravariant.',
          'Nominal branding uses a unique symbol or phantom property: `type UserId = string & { readonly __brand: unique symbol }` preventing accidental assignment of raw strings.'
        ],
        keyTradeoff: 'Property functions guarantee strict type safety, but consume slightly more memory per instance compared to prototype methods.'
      }
    ]
  },
  react: {
    id: 'react',
    name: 'React Internals & Frontend Architecture',
    shortName: 'React',
    badge: 'UI Framework',
    level: 'Senior Specialist',
    accentColor: 'cyan',
    overview: 'Fiber architecture, 2-phase render/commit cycle, concurrent priority lanes, hook circular linked lists, synthetic event delegation, and streaming SSR with React Server Components.',
    questions: [
      {
        id: 'react-fiber-lanes',
        category: 'react',
        categoryLabel: 'React Internals',
        domainName: 'Fiber Tree Architecture & Concurrent Priority Lanes',
        badge: 'Scheduler & Reconciler',
        tags: ['Fiber Node Pointers', 'Lanes Bitmask', 'MessageChannel Slicing', 'Time Slicing'],
        prompt: 'Describe step-by-step how React interrupts a low-priority transition render when an urgent user input event occurs in Concurrent Mode.',
        plainEnglish: 'How does React pause an expensive background component render when a user suddenly clicks or types, so the screen never feels laggy?',
        keyConcepts: [
          { term: 'Fiber Node', explanation: 'React’s internal lightweight component representation that allows work to be paused, resumed, or discarded.' },
          { term: 'Priority Lanes', explanation: 'A bitmask ranking system where user typing and clicks get high priority, while background fetches get low priority.' },
          { term: 'Time Slicing', explanation: 'Breaking down large renders into small 5-millisecond slices so the browser main thread stays responsive.' },
          { term: 'WorkInProgress Tree', explanation: 'A draft copy of the UI tree that React calculates off-screen before committing changes to the real DOM.' }
        ],
        talkingPoints: [
          'Each React element is converted into a Fiber node with pointers: `child`, `sibling`, and `return`. This converts the recursive call stack into a resume-able linked list.',
          'React\'s scheduler uses a `while (workInProgress !== null && !shouldYield())` work loop driven by `MessageChannel` micro-yields to the browser every 5ms.',
          'When an urgent keystroke occurs, scheduler dispatches a higher priority Lane (e.g. `SyncLane` or `InputContinuousLane`).',
          'React discards the current unfinished `workInProgress` tree, calculates the urgent update, commits it to the DOM, and subsequently restarts or resumes the lower-priority TransitionLane.'
        ],
        keyTradeoff: 'Concurrent Mode keeps the main thread responsive during expensive renders, but requires state mutations to be completely pure and idempotent.'
      },
      {
        id: 'react-hooks-rsc',
        category: 'react',
        categoryLabel: 'React Internals',
        domainName: 'Hook Internal Storage & React Server Components (RSC)',
        badge: 'State & Streaming',
        tags: ['fiber.memoizedState', 'Circular Linked Lists', 'RSC Flight Wire Format', 'Streaming SSR'],
        prompt: 'Why does React throw an error if hooks are called conditionally, and how is state serialized across the RSC server-client flight boundary?',
        plainEnglish: 'Why must React hooks always be called in the exact same order without if-statements, and how do React Server Components render without sending JS to the browser?',
        keyConcepts: [
          { term: 'fiber.memoizedState', explanation: 'A linked list where React stores each hook’s value in the exact order the hooks were executed.' },
          { term: 'Rule of Hooks', explanation: 'Because hooks are identified by call position (index), an if-statement skips an index and gives all subsequent hooks the wrong state.' },
          { term: 'RSC Flight Format', explanation: 'A lightweight streaming JSON-like format that transmits component tree data without transmitting component JS code.' },
          { term: 'Streaming SSR', explanation: 'Sending initial HTML instantly and streaming in slower server-rendered database components as their promises finish.' }
        ],
        talkingPoints: [
          'Hooks have no names; React identifies them solely by positional index in a singly linked list stored on `fiber.memoizedState`.',
          'Conditional hook execution shifts the linked list pointer, causing subsequent hooks to read the wrong state or dispatcher callback.',
          'React Server Components never execute on the client. The server renders components into a JSON-like stream (Flight format) describing virtual DOM nodes, props, and client bundle chunk references.',
          'Suspense boundaries allow streaming HTML chunks immediately while asynchronous database promises resolve in the background on the server.'
        ],
        keyTradeoff: 'RSC eliminates client bundle size for data fetching dependencies, but requires careful serialization of props across the server-client boundary.'
      }
    ]
  },
  nest: {
    id: 'nest',
    name: 'NestJS & Enterprise Backend Systems',
    shortName: 'NestJS',
    badge: 'Enterprise Backend',
    level: 'Senior Backend',
    accentColor: 'rose',
    overview: 'Inversion of Control (IoC) containers, circular dependency resolution, lifecycle interceptor pipelines, microservice transport layers (Kafka, RabbitMQ, gRPC), and CQRS command/query decoupling.',
    questions: [
      {
        id: 'nest-ioc-scopes',
        category: 'nest',
        categoryLabel: 'NestJS Backend',
        domainName: 'IoC Container, Injection Scopes & Circular Dependencies',
        badge: 'Dependency Injection',
        tags: ['DEFAULT vs REQUEST Scope', 'Reflect-Metadata', 'forwardRef()', 'Memory Leaks'],
        prompt: 'What is the performance implication of using REQUEST-scoped providers across high-throughput endpoints in NestJS, and how does the DI container handle them?',
        plainEnglish: 'What happens when you create a new service instance for every incoming HTTP request instead of sharing one singleton, and how does it hurt server speed?',
        keyConcepts: [
          { term: 'DEFAULT Scope', explanation: 'A singleton created once when the server boots and shared by all requests (maximum speed, minimum RAM).' },
          { term: 'REQUEST Scope', explanation: 'Creates a brand new service copy on every single HTTP request, causing high memory churn under heavy traffic.' },
          { term: 'Reflect-Metadata', explanation: 'TypeScript runtime metadata that allows NestJS to inspect constructor arguments and automatically inject dependencies.' },
          { term: 'forwardRef()', explanation: 'A helper function that resolves circular dependency deadlocks between two services that import each other.' }
        ],
        talkingPoints: [
          'DEFAULT scope instances are instantiated once at bootstrap and shared across all incoming requests (O(1) memory and zero per-request overhead).',
          'REQUEST scope forces the IoC container to create a dedicated DI subtree for every HTTP request. If a database service is REQUEST-scoped, every controller and service depending on it also becomes REQUEST-scoped.',
          'In high-throughput environments (10,000+ req/sec), REQUEST scope triggers substantial Garbage Collection churn and latency spikes.',
          'Circular dependencies between modules require `forwardRef(() => OtherModule)` to defer resolution until both modules are registered in the metadata graph.'
        ],
        keyTradeoff: 'REQUEST scope isolates contextual user metadata cleanly, but singleton scope with explicit context passing offers vastly superior throughput.'
      },
      {
        id: 'nest-microservices-cqrs',
        category: 'nest',
        categoryLabel: 'NestJS Backend',
        domainName: 'Microservice Transports (gRPC, Kafka) & CQRS Event Sourcing',
        badge: 'Microservices & CQRS',
        tags: ['gRPC & Protobuf', 'Kafka Event Pattern', 'Idempotent Consumers', 'CQRS Buses'],
        prompt: 'How do you design a fault-tolerant event-driven pipeline between NestJS microservices with idempotency and dead-letter queues?',
        plainEnglish: 'How do you design a reliable communication pipeline between microservices using Kafka or gRPC that never drops messages and handles duplicate requests safely?',
        keyConcepts: [
          { term: 'gRPC & Protobuf', explanation: 'A high-speed binary protocol over HTTP/2 that is 5-10x faster and lighter than JSON REST APIs.' },
          { term: 'Idempotency', explanation: 'A design ensuring that processing the exact same event twice (e.g. charging a payment) does not execute twice.' },
          { term: 'Dead Letter Queue (DLQ)', explanation: 'A holding queue for messages that repeatedly failed, allowing the main system to keep running while developers debug.' },
          { term: 'CQRS', explanation: 'Separating read queries from write commands into different models for better performance and scalability.' }
        ],
        talkingPoints: [
          'NestJS microservices abstract transports via `@MessagePattern` (RPC request-response) and `@EventPattern` (fire-and-forget asynchronous events).',
          'gRPC uses HTTP/2 multiplexing and Protobuf binary serialization, offering 5-10x throughput over traditional JSON HTTP REST.',
          'Idempotency strategy: Interceptors record incoming `idempotency-key` in Redis with SETNX and TTL before executing command handlers.',
          'Dead Letter Queue (DLQ): Consumers wrap processing in try-catch; failed records publish to a DLQ topic with retry count backoff before alerting.'
        ],
        keyTradeoff: 'Event-driven microservices decouple scale, but introduce eventual consistency and require distributed tracing (OpenTelemetry).'
      }
    ]
  },
  postgres: {
    id: 'postgres',
    name: 'PostgreSQL & Database Internals',
    shortName: 'PostgreSQL',
    badge: 'Storage & ACID',
    level: 'Systems & Data',
    accentColor: 'indigo',
    overview: 'Relational storage mechanics, 8KB page structure, Write-Ahead Logging (WAL), Multi-Version Concurrency Control (MVCC), B-Tree & GIN index mechanics, and EXPLAIN ANALYZE execution cost models.',
    questions: [
      {
        id: 'pg-storage-mvcc',
        category: 'postgres',
        categoryLabel: 'PostgreSQL Database',
        domainName: '8KB Disk Pages, MVCC Concurrency & Vacuuming',
        badge: 'Storage & MVCC',
        tags: ['8KB Page Layout', 'xmin / xmax Visibility', 'HOT Optimization', 'Autovacuum Tuning'],
        prompt: 'How does PostgreSQL resolve read consistency without read-locks using transaction snapshots, and how does HOT (Heap-Only Tuples) optimization reduce index write amplification?',
        plainEnglish: 'How does PostgreSQL let people read data without locking tables while someone else is writing, and why do updates secretly create new row copies?',
        keyConcepts: [
          { term: '8KB Disk Pages', explanation: 'The standard fixed-size blocks of disk and RAM where PostgreSQL stores and reads table rows.' },
          { term: 'MVCC', explanation: 'Multi-Version Concurrency: instead of overwriting rows, updates create new row versions so readers never wait on writers.' },
          { term: 'HOT (Heap-Only Tuples)', explanation: 'A smart optimization that updates a row in the same 8KB disk page without needing to update any index trees.' },
          { term: 'Autovacuum', explanation: 'A background janitor process that cleans up dead row versions and frees disk space for new data.' }
        ],
        talkingPoints: [
          'Postgres tables are collections of 8KB disk pages. New rows are written as tuples, and updates insert a new tuple version with the old tuple\'s `xmax` set to the updating transaction ID.',
          'Snapshot isolation checks whether `xmin` is committed and was completed before the snapshot was taken, guaranteeing lock-free non-blocking reads.',
          'HOT Optimization: If an UPDATE does not alter any indexed column and there is free space on the current 8KB page, Postgres chains the new tuple directly from the old line pointer without updating index trees.',
          'Autovacuum scans pages, frees dead tuple space, and freezes ancient transaction IDs to prevent transaction wraparound failure (2 billion transaction ceiling).'
        ],
        keyTradeoff: 'MVCC allows readers to never block writers, but creates dead tuples that require constant background autovacuum maintenance.'
      },
      {
        id: 'pg-indexing-cost',
        category: 'postgres',
        categoryLabel: 'PostgreSQL Database',
        domainName: 'B-Tree & GIN Index Mechanics, EXPLAIN Cost Estimations',
        badge: 'Query Optimization',
        tags: ['B-Tree Structure', 'GIN for JSONB', 'Bitmap Index Scans', 'work_mem Hash Joins'],
        prompt: 'When does the PostgreSQL planner choose a Bitmap Index Scan over an Index Scan, and what role does work_mem play in Hash Joins?',
        plainEnglish: 'When does PostgreSQL choose a Bitmap Index Scan over a standard Index Scan, and what happens when your query needs more RAM than work_mem provides?',
        keyConcepts: [
          { term: 'B-Tree Index', explanation: 'A self-balancing tree that finds rows in O(log N) time, perfect for equality (=) and range (<, >) queries.' },
          { term: 'Bitmap Index Scan', explanation: 'Finds matching row addresses in the index first, sorts them physically, and reads disk sequentially to avoid slow random jumps.' },
          { term: 'work_mem', explanation: 'The RAM allocated for sorting and joins per query. If exceeded, Postgres spills data to slow temporary files on disk.' },
          { term: 'EXPLAIN ANALYZE', explanation: 'The SQL command that runs a query and prints the planner’s estimated cost vs actual elapsed execution time.' }
        ],
        talkingPoints: [
          'Index Scan reads the index and fetches corresponding heap pages one by one; if matching rows are scattered across many random disk pages, random I/O cost exceeds sequential I/O.',
          'Bitmap Index Scan creates a memory bitmap of matching physical page numbers in the index, sorts them physically, and reads disk pages sequentially.',
          'Hash Joins build an in-memory hash table of the inner table using `work_mem`. If the hash table exceeds `work_mem`, Postgres spills partitions to disk (multi-batch hash join), causing drastic performance degradation.',
          'EXPLAIN ANALYZE provides both planner estimation cost `cost=X..Y` and actual elapsed time `actual time=A..B` with cache buffer hits.'
        ],
        keyTradeoff: 'Additional indexes accelerate SELECT queries, but amplify disk write latency on every INSERT, UPDATE, and DELETE.'
      }
    ]
  },
  redis: {
    id: 'redis',
    name: 'Redis & Distributed Caching Internals',
    shortName: 'Redis',
    badge: 'In-Memory',
    level: 'Systems & Cache',
    accentColor: 'red',
    overview: 'In-memory single-threaded reactor pattern, memory-efficient data structures (SDS, SkipLists, QuickLists), eviction policies (LRU/LFU), RDB/AOF persistence, Redis Streams, and distributed locking algorithms.',
    questions: [
      {
        id: 'redis-memory-datastructs',
        category: 'redis',
        categoryLabel: 'Redis In-Memory',
        domainName: 'Memory Architecture, Reactor Loop & Internal Data Structures',
        badge: 'Memory & Speed',
        tags: ['ae.c Reactor Loop', 'SDS Memory Efficiency', 'SkipList vs Red-Black', 'Approximated LRU/LFU'],
        prompt: 'Why does Redis Sorted Set use a SkipList instead of a balanced Red-Black tree, and how does the single-threaded reactor pattern avoid lock contention?',
        plainEnglish: 'Why does Redis Sorted Set use a SkipList instead of a balanced tree, and how does running on a single thread achieve over 100,000 requests per second?',
        keyConcepts: [
          { term: 'Single-Threaded Reactor', explanation: 'Uses an event loop (epoll) to handle thousands of connections without locks, thread pauses, or race conditions.' },
          { term: 'SkipList', explanation: 'A multi-level linked list with fast express tracks that enables quick O(log N) searches and easy range scans.' },
          { term: 'SDS (Simple Dynamic String)', explanation: 'Redis’s smart C string wrapper that caches string length to eliminate buffer overflows and enable O(1) length checks.' },
          { term: 'Approximated LRU', explanation: 'Samples 5 random keys to evict the oldest instead of maintaining a slow global linked list of millions of keys.' }
        ],
        talkingPoints: [
          'Redis executes commands single-threaded using an event-driven reactor loop (`epoll` on Linux), completely eliminating mutex locking, context switching, and race conditions on in-memory operations.',
          'Sorted Sets (`ZSET`) combine a hash table (O(1) score lookup) and a SkipList (O(log N) range queries `ZRANGEBYSCORE`).',
          'SkipLists are chosen over Red-Black trees because range scans are trivial (traversing forward pointers at level 0), concurrent rebalancing is simpler, and memory overhead is tunable via probability p=0.25.',
          'Memory eviction: When `maxmemory` is reached, Redis samples N random keys (default 5) and evicts the one with the oldest idle time (approximated LRU) to avoid maintaining a global linked list.'
        ],
        keyTradeoff: 'Single-threaded architecture guarantees sub-millisecond atomic operations, but long-running commands (e.g. KEYS * or slow Lua scripts) block all other client connections.'
      },
      {
        id: 'redis-persistence-locks',
        category: 'redis',
        categoryLabel: 'Redis In-Memory',
        domainName: 'RDB / AOF Durability, Streams & Redlock Distributed Locks',
        badge: 'Distributed Systems',
        tags: ['Redlock Algorithm', 'AOF fsync=everysec', 'Redis Streams vs Pub/Sub', 'Copy-on-Write fork()'],
        prompt: 'Why is simple `SET key val NX PX 30000` insufficient in a distributed multi-master cluster without the Redlock algorithm?',
        plainEnglish: 'Why is setting a single Redis key not safe enough for distributed locks across multiple servers, and how does the Redlock algorithm solve it?',
        keyConcepts: [
          { term: 'Distributed Lock', explanation: 'A shared lock across multiple servers ensuring only one server processes a critical job at a time.' },
          { term: 'Redlock Algorithm', explanation: 'Acquires locks across 5 independent Redis master nodes so that if one crashes, the lock remains safe and reliable.' },
          { term: 'Atomic Release (Lua)', explanation: 'Using a Lua script to ensure a worker only releases the lock if it still owns its unique token (preventing accidental unlocks).' },
          { term: 'AOF Persistence', explanation: 'Appends every write command to a disk log so at most 1 second of data is lost during an unexpected power cut.' }
        ],
        talkingPoints: [
          'In standard Redis replication, writes are asynchronous. If a client acquires a lock on master and master crashes before replicating to replica, the new master allows another client to acquire the same lock.',
          'Redlock algorithm acquires locks across N independent masters (typically 5) using unique random values and short timeouts. Lock is acquired only if a majority (N/2 + 1) nodes respond affirmatively within the validity window.',
          'Releasing a lock must be done atomically via Lua script checking if the current value matches the client\'s random identifier, preventing a slow client from releasing another client\'s newly acquired lock.',
          'Redis Streams provide durable append-only logs with acknowledged message processing (`XACK`), unlike Pub/Sub which drops messages if a subscriber is offline.'
        ],
        keyTradeoff: 'AOF with `appendfsync everysec` provides excellent durability with minimal overhead, losing at most 1 second of data during power failure.'
      }
    ]
  },
  'system-design': {
    id: 'system-design',
    name: 'Distributed Systems & System Design',
    shortName: 'System Design',
    badge: 'Distributed Systems',
    level: 'Staff to Principal',
    accentColor: 'emerald',
    overview: 'Architectural patterns for high-scale systems: CAP/PACELC theorems, consistent hashing, rate limiting algorithms, write-back caching, event-driven choreography vs orchestration, and distributed transactions (Saga).',
    questions: [
      {
        id: 'sys-scaling-hashing',
        category: 'system-design',
        categoryLabel: 'System Design',
        domainName: 'Consistent Hashing, Sharding & Distributed Rate Limiters',
        badge: 'Scalability',
        tags: ['Consistent Hashing Ring', 'Virtual Nodes (vnodes)', 'Sliding Window Counter', '500k req/sec Limiter'],
        prompt: 'Design a distributed rate limiter that handles 500,000 requests/sec with minimal Redis roundtrips, zero race conditions, and graceful degradation during network partitions.',
        plainEnglish: 'How do you build a rate limiter that handles 500,000 requests per second across many servers without overloading your database or dropping valid users?',
        keyConcepts: [
          { term: 'Consistent Hashing', explanation: 'Maps servers and keys to a circle so adding or removing a server only relocates a small slice of keys.' },
          { term: 'Virtual Nodes (vnodes)', explanation: 'Assigning multiple virtual positions to each physical server on the circle to balance traffic evenly without hot spots.' },
          { term: 'Sliding Window Counter', explanation: 'A rate-limiting algorithm that counts requests across sliding time windows for smooth, accurate traffic limits.' },
          { term: 'Local Token Buffers', explanation: 'Allowing servers to approve requests locally in memory and sync with Redis in batches, avoiding 500,000 network calls.' }
        ],
        talkingPoints: [
          'Consistent hashing maps servers and keys to a 360-degree hash ring. Adding or removing a server only relocates K/N keys rather than invalidating the entire cluster.',
          'Virtual nodes (e.g. 100-250 vnodes per physical node) distribute key ranges evenly, avoiding hot spots and skew.',
          'Distributed Rate Limiting uses a Redis Sliding Window Counter implemented via a Redis Sorted Set or a composite Token Bucket evaluated inside an atomic Lua script.',
          'For 500k req/sec, local in-memory token buffers (batching sync every 100ms) prevent network saturation on Redis clusters.'
        ],
        keyTradeoff: 'Virtual nodes ensure uniform load balancing, but require slightly more memory to maintain ring lookup tables.'
      },
      {
        id: 'sys-consistency-saga',
        category: 'system-design',
        categoryLabel: 'System Design',
        domainName: 'Distributed Transactions: Saga Pattern vs Two-Phase Commit',
        badge: 'Transactions & Reliability',
        tags: ['Saga Choreography vs Orchestrator', 'Two-Phase Commit Bottlenecks', 'Transactional Outbox', 'Eventual Consistency'],
        prompt: 'How do you guarantee atomic multi-service business transactions across payments, inventory, and order fulfillment using the Saga pattern without distributed deadlocks?',
        plainEnglish: 'When an order spans payment, inventory, and delivery services, how do you rollback if one step fails without freezing or locking databases?',
        keyConcepts: [
          { term: 'Saga Pattern', explanation: 'Splits a large multi-service transaction into small local steps, each with an automated rollback step if a later step fails.' },
          { term: 'Compensating Transactions', explanation: 'Undo actions (like refunding a credit card or restocking an item) triggered automatically when a failure occurs.' },
          { term: 'Two-Phase Commit (2PC) Trap', explanation: 'Old-school locking across all databases that causes major latency and freezes the system if any single node stalls.' },
          { term: 'Transactional Outbox', explanation: 'Writing business data and outgoing messages in the same database transaction to guarantee messages never get lost.' }
        ],
        talkingPoints: [
          'Two-Phase Commit (2PC) holds locks across all participating databases until the coordinator confirms commit, creating catastrophic latency and blocking availability if the coordinator fails.',
          'The Saga Pattern decomposes a distributed transaction into a sequence of local transactions. Each transaction updates its local database and publishes an event or message.',
          'If a step fails (e.g. payment declined), the Saga executes compensating transactions in reverse order to rollback previous operations cleanly.',
          'Transactional Outbox Pattern: Services write business data AND outgoing events in the SAME local database transaction. A CDC (Change Data Capture) process or polling worker publishes to Kafka with zero message loss.'
        ],
        keyTradeoff: 'Saga provides high availability and partition tolerance, but trades away immediate consistency (ACID) in favor of eventual consistency (BASE).'
      }
    ]
  }
};

type StickyColor = 'amber' | 'emerald' | 'blue' | 'purple';

const colorThemes: Record<StickyColor, { bg: string; border: string; header: string; text: string }> = {
  amber: {
    bg: 'bg-amber-950/95',
    border: 'border-amber-600',
    header: 'bg-amber-900/90 text-amber-100',
    text: 'text-amber-100'
  },
  emerald: {
    bg: 'bg-emerald-950/95',
    border: 'border-emerald-600',
    header: 'bg-emerald-900/90 text-emerald-100',
    text: 'text-emerald-100'
  },
  blue: {
    bg: 'bg-blue-950/95',
    border: 'border-blue-600',
    header: 'bg-blue-900/90 text-blue-100',
    text: 'text-blue-100'
  },
  purple: {
    bg: 'bg-purple-950/95',
    border: 'border-purple-600',
    header: 'bg-purple-900/90 text-purple-100',
    text: 'text-purple-100'
  }
};

type CardTab = 'collapsed' | 'explain' | 'type' | 'compare';

export default function InterviewClient() {
  const [activeCategory, setActiveCategory] = useState<TechCategory>('javascript');
  const track = INTERVIEW_TRACKS[activeCategory];

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [filterMode, setFilterMode] = useState<'all' | 'unanswered' | 'answered' | 'mastered'>('all');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [activeTabs, setActiveTabs] = useState<Record<string, CardTab>>({});

  // Plain-English Keyword Definitions Accordion State (open question 1 & 3 by default)
  const [showConcepts, setShowConcepts] = useState<Record<string, boolean>>({
    'js-memory-gc': true,
    'js-shapes-ic': true
  });

  const toggleConcepts = (questionId: string) => {
    setShowConcepts((prev) => ({ ...prev, [questionId]: !prev[questionId] }));
  };

  // User Written Answers (persisted to localStorage)
  const [userAnswers, setUserAnswers] = useState<Record<string, string>>(() => {
    if (typeof window === 'undefined') return {};
    try {
      const saved = localStorage.getItem('js_interview_user_answers');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  const [saveStatus, setSaveStatus] = useState<Record<string, boolean>>({});

  const handleUserAnswerChange = (questionId: string, text: string) => {
    setUserAnswers((prev) => {
      const next = { ...prev, [questionId]: text };
      try {
        localStorage.setItem('js_interview_user_answers', JSON.stringify(next));
      } catch {
        // Ignore
      }
      return next;
    });

    // Flash saved confirmation briefly
    setSaveStatus((prev) => ({ ...prev, [questionId]: true }));
    setTimeout(() => {
      setSaveStatus((prev) => ({ ...prev, [questionId]: false }));
    }, 1500);
  };

  // Mastered questions map
  const [masteredMap, setMasteredMap] = useState<Record<string, boolean>>(() => {
    if (typeof window === 'undefined') return {};
    try {
      const saved = localStorage.getItem('js_interview_mastered_map');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  const toggleMastered = (questionId: string) => {
    setMasteredMap((prev) => {
      const next = { ...prev, [questionId]: !prev[questionId] };
      try {
        localStorage.setItem('js_interview_mastered_map', JSON.stringify(next));
      } catch {
        // Ignore
      }
      return next;
    });
  };

  // Personal Toolkit: Notes Drawer
  const [isNotesOpen, setIsNotesOpen] = useState(false);
  const [notesText, setNotesText] = useState<string>(() => {
    if (typeof window === 'undefined') return '';
    try {
      return localStorage.getItem(`js_interview_notes_${activeCategory}`) || '';
    } catch {
      return '';
    }
  });

  const handleNotesChange = (text: string) => {
    setNotesText(text);
    try {
      localStorage.setItem(`js_interview_notes_${activeCategory}`, text);
    } catch {
      // Ignore
    }
  };

  const exportNotes = () => {
    const blob = new Blob([notesText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${activeCategory}-interview-notes.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Personal Toolkit: Draggable Sticky Note
  const [isStickyOpen, setIsStickyOpen] = useState(false);
  const [stickyText, setStickyText] = useState<string>(() => {
    if (typeof window === 'undefined') return '';
    try {
      return localStorage.getItem(`js_interview_sticky_${activeCategory}`) || '';
    } catch {
      return '';
    }
  });
  const [isStickyMinimized, setIsStickyMinimized] = useState(false);
  const [stickyColor, setStickyColor] = useState<StickyColor>('amber');
  const [stickyPos, setStickyPos] = useState<{ x: number; y: number }>(() => {
    if (typeof window === 'undefined') return { x: 300, y: 120 };
    try {
      const saved = localStorage.getItem('js_interview_sticky_pos');
      if (saved) return JSON.parse(saved);
      return { x: Math.max(20, window.innerWidth - 650), y: 120 };
    } catch {
      return { x: 300, y: 120 };
    }
  });

  const isDraggingRef = useRef(false);
  const dragOffsetRef = useRef({ x: 0, y: 0 });

  const handleStickyHeaderMouseDown = (e: React.MouseEvent) => {
    isDraggingRef.current = true;
    dragOffsetRef.current = {
      x: e.clientX - stickyPos.x,
      y: e.clientY - stickyPos.y
    };
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDraggingRef.current) return;
      const newX = Math.max(10, Math.min(window.innerWidth - 300, e.clientX - dragOffsetRef.current.x));
      const newY = Math.max(10, Math.min(window.innerHeight - 80, e.clientY - dragOffsetRef.current.y));
      setStickyPos({ x: newX, y: newY });
    };

    const handleMouseUp = () => {
      if (isDraggingRef.current) {
        isDraggingRef.current = false;
        try {
          localStorage.setItem('js_interview_sticky_pos', JSON.stringify(stickyPos));
        } catch {
          // Ignore
        }
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [stickyPos]);

  // Personal Toolkit: Highlighting
  const savedRangeRef = useRef<Range | null>(null);
  const [selectionPopup, setSelectionPopup] = useState<{ x: number; y: number } | null>(null);

  const handleMouseUp = () => {
    const sel = window.getSelection();
    if (!sel || sel.isCollapsed || sel.toString().trim().length === 0) {
      setSelectionPopup(null);
      savedRangeRef.current = null;
      return;
    }

    try {
      const range = sel.getRangeAt(0);
      savedRangeRef.current = range.cloneRange();
      const rect = range.getBoundingClientRect();
      if (rect.width > 0 && rect.height > 0) {
        setSelectionPopup({
          x: rect.left + rect.width / 2,
          y: Math.max(10, rect.top - 45)
        });
      }
    } catch {
      setSelectionPopup(null);
      savedRangeRef.current = null;
    }
  };

  const applyHighlight = (color: string) => {
    const range = savedRangeRef.current ?? (window.getSelection()?.rangeCount ? window.getSelection()!.getRangeAt(0) : null);
    if (!range) return;

    try {
      const span = document.createElement('mark');
      span.style.backgroundColor = color;
      span.style.color = '#000000';
      span.style.padding = '1px 4px';
      span.style.borderRadius = '3px';
      span.className = 'custom-highlight font-medium';

      const fragment = range.extractContents();
      span.appendChild(fragment);
      range.insertNode(span);
    } catch {
      // Fallback
    }

    window.getSelection()?.removeAllRanges();
    savedRangeRef.current = null;
    setSelectionPopup(null);
  };

  const removeHighlight = () => {
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0) return;

    try {
      const node = sel.anchorNode?.parentElement;
      if (node && node.tagName.toLowerCase() === 'mark') {
        const parent = node.parentNode;
        while (node.firstChild) {
          parent?.insertBefore(node.firstChild, node);
        }
        parent?.removeChild(node);
      }
    } catch {
      // Ignore
    }
    setSelectionPopup(null);
  };

  // Copy helper
  const handleCopyPrompt = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1800);
  };

  // Category switch
  const handleCategorySwitch = (cat: TechCategory) => {
    setActiveCategory(cat);
    setSearchQuery('');
    try {
      const savedNotes = localStorage.getItem(`js_interview_notes_${cat}`) || '';
      setNotesText(savedNotes);

      const savedSticky = localStorage.getItem(`js_interview_sticky_${cat}`) || '';
      setStickyText(savedSticky);
    } catch {
      // Ignore
    }
  };

  // Filtered Questions
  const filteredQuestions = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return track.questions.filter((item) => {
      // Text search
      if (q) {
        const promptMatch = item.prompt.toLowerCase().includes(q);
        const plainMatch = item.plainEnglish?.toLowerCase().includes(q);
        const domainMatch = item.domainName.toLowerCase().includes(q);
        const tagsMatch = item.tags.some((t) => t.toLowerCase().includes(q));
        const conceptMatch = item.keyConcepts?.some(
          (c) => c.term.toLowerCase().includes(q) || c.explanation.toLowerCase().includes(q)
        );
        if (!promptMatch && !plainMatch && !domainMatch && !tagsMatch && !conceptMatch) return false;
      }

      // Status filter
      const isAnswered = Boolean(userAnswers[item.id]?.trim());
      const isMastered = Boolean(masteredMap[item.id]);

      if (filterMode === 'answered' && !isAnswered) return false;
      if (filterMode === 'unanswered' && isAnswered) return false;
      if (filterMode === 'mastered' && !isMastered) return false;

      return true;
    });
  }, [track.questions, searchQuery, filterMode, userAnswers, masteredMap]);

  // Overall Stats
  const totalInTrack = track.questions.length;
  const answeredInTrack = track.questions.filter((q) => Boolean(userAnswers[q.id]?.trim())).length;
  const masteredInTrack = track.questions.filter((q) => Boolean(masteredMap[q.id])).length;

  const theme = colorThemes[stickyColor];

  return (
    <div className="w-full min-h-screen relative flex" onMouseUp={handleMouseUp}>
      {/* Floating Highlight Toolbar */}
      {selectionPopup && (
        <div
          style={{ top: `${selectionPopup.y}px`, left: `${selectionPopup.x}px` }}
          onMouseDown={(e) => {
            e.preventDefault();
            e.stopPropagation();
          }}
          onMouseUp={(e) => e.stopPropagation()}
          className="fixed -translate-x-1/2 z-50 bg-slate-900 border border-slate-700 rounded-lg shadow-2xl px-2.5 py-1.5 flex items-center space-x-2 text-xs animate-in fade-in"
        >
          <span className="text-[10px] text-slate-400 font-semibold mr-1">Highlight:</span>
          <button
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => applyHighlight('#fde047')}
            className="w-5 h-5 rounded-full bg-yellow-300 hover:scale-115 transition-transform border border-yellow-500 shadow-sm"
            title="Yellow highlight"
          />
          <button
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => applyHighlight('#86efac')}
            className="w-5 h-5 rounded-full bg-emerald-300 hover:scale-115 transition-transform border border-emerald-500 shadow-sm"
            title="Green highlight"
          />
          <button
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => applyHighlight('#93c5fd')}
            className="w-5 h-5 rounded-full bg-blue-300 hover:scale-115 transition-transform border border-blue-500 shadow-sm"
            title="Blue highlight"
          />
          <button
            onMouseDown={(e) => e.preventDefault()}
            onClick={removeHighlight}
            className="text-[10.5px] text-slate-400 hover:text-white px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 ml-1 border border-slate-700 transition-colors"
            title="Remove highlight"
          >
            Clear
          </button>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 max-w-5xl mx-auto px-4 sm:px-8 py-8 min-w-0 pr-16 sm:pr-20 space-y-6">
        {/* Breadcrumb */}
        <div className="flex items-center space-x-2 text-xs text-slate-500">
          <Link href="/" className="hover:text-slate-300 transition-colors">
            Home
          </Link>
          <span>/</span>
          <span className="text-slate-300 font-medium">Interview Arena</span>
          <span>/</span>
          <span className="text-blue-400 font-medium font-mono">{track.shortName}</span>
        </div>

        {/* Clean Header & Track Progress */}
        <div className="border-b border-slate-800 pb-5">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-2">
            <div className="flex items-center space-x-2">
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-blue-400">
                TECHNICAL INTERVIEW ARENA
              </span>
              <span className="text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded border border-slate-700 font-mono">
                {track.badge}
              </span>
              <span className="text-[10px] bg-blue-950/80 text-blue-300 px-2 py-0.5 rounded border border-blue-800/80 font-semibold font-mono">
                {track.level}
              </span>
            </div>

            <div className="flex items-center space-x-3 text-xs font-mono">
              <span className="text-slate-400">
                Answered: <strong className="text-white">{answeredInTrack}/{totalInTrack}</strong>
              </span>
              <span className="text-slate-400">
                Mastered: <strong className="text-emerald-400">{masteredInTrack}/{totalInTrack}</strong>
              </span>
            </div>
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight mb-2">
            {track.name}
          </h1>
          <p className="text-slate-400 text-xs sm:text-sm leading-relaxed max-w-3xl mb-4">
            Practice answering real senior and staff-level interview questions. Type your own response in the answer workspace, save your thoughts, and compare directly with the official architectural model answers.
          </p>

          {/* Quick Mastery & Practice Progress Bar */}
          <div className="w-full bg-slate-900 border border-slate-800 rounded-lg p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center space-x-3 flex-1">
              <span className="text-xs font-mono text-slate-300 font-semibold">
                Progress:
              </span>
              <div className="flex-1 max-w-xs bg-slate-950 rounded-full h-2.5 overflow-hidden border border-slate-800">
                <div
                  className="bg-emerald-500 h-full transition-all duration-300"
                  style={{ width: `${totalInTrack > 0 ? (masteredInTrack / totalInTrack) * 100 : 0}%` }}
                />
              </div>
              <span className="text-[11px] font-mono text-emerald-400 font-bold">
                {Math.round(totalInTrack > 0 ? (masteredInTrack / totalInTrack) * 100 : 0)}% Mastered
              </span>
            </div>

            <div className="text-[11px] text-slate-400 font-mono">
              Type your answer below & check the box when confident
            </div>
          </div>
        </div>

        {/* Tech Stack Switcher Tabs */}
        <div className="flex flex-wrap items-center gap-1.5 p-1.5 bg-slate-900 border border-slate-800 rounded-lg">
          {(
            [
              { id: 'javascript', label: 'JavaScript' },
              { id: 'typescript', label: 'TypeScript' },
              { id: 'react', label: 'React' },
              { id: 'nest', label: 'NestJS' },
              { id: 'postgres', label: 'PostgreSQL' },
              { id: 'redis', label: 'Redis' },
              { id: 'system-design', label: 'System Design' }
            ] as const
          ).map((tab) => (
            <button
              key={tab.id}
              onClick={() => handleCategorySwitch(tab.id)}
              className={`px-3 py-1.5 rounded text-xs font-semibold transition-colors ${
                activeCategory === tab.id
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search & Filter Controls */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          {/* Search Input */}
          <div className="flex-1 flex items-center bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs">
            <svg className="w-4 h-4 text-slate-400 mr-2 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={`Search ${track.shortName} questions, tags, or topics (e.g. GC, MVCC, SkipList, Fiber)...`}
              className="w-full bg-transparent text-slate-200 placeholder-slate-500 focus:outline-none"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="text-[11px] text-slate-500 hover:text-slate-300 ml-2 font-mono"
              >
                Clear
              </button>
            )}
          </div>

          {/* Status Filter Buttons */}
          <div className="flex items-center space-x-1 bg-slate-900 border border-slate-800 p-1 rounded-lg text-xs">
            {(
              [
                { id: 'all', label: 'All' },
                { id: 'unanswered', label: 'Unanswered' },
                { id: 'answered', label: 'Answered' },
                { id: 'mastered', label: 'Mastered' }
              ] as const
            ).map((btn) => (
              <button
                key={btn.id}
                onClick={() => setFilterMode(btn.id)}
                className={`px-2.5 py-1 rounded text-[11.5px] font-medium transition-colors ${
                  filterMode === btn.id
                    ? 'bg-slate-800 text-white font-semibold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {btn.label}
              </button>
            ))}
          </div>
        </div>

        {/* Questions List */}
        <div className="space-y-6 pt-2">
          {filteredQuestions.length > 0 ? (
            filteredQuestions.map((q, idx) => {
              const isMastered = Boolean(masteredMap[q.id]);
              const currentTab: CardTab = activeTabs[q.id] || 'collapsed';
              const answerText = userAnswers[q.id] || '';
              const hasAnswered = Boolean(answerText.trim());
              const isSaved = Boolean(saveStatus[q.id]);

              return (
                <div
                  key={q.id}
                  className={`bg-slate-900/90 border rounded-xl shadow-sm transition-all overflow-hidden ${
                    isMastered
                      ? 'border-emerald-800/80 ring-1 ring-emerald-500/20'
                      : 'border-slate-800 hover:border-slate-700'
                  }`}
                >
                  {/* Card Header Bar */}
                  <div className="p-5 pb-3 border-b border-slate-800/80 bg-slate-950/40">
                    <div className="flex flex-wrap items-center justify-between gap-3 mb-2.5">
                      <div className="flex items-center space-x-2">
                        <span className="font-mono text-xs px-2 py-0.5 rounded bg-blue-950 text-blue-400 font-bold border border-blue-900/60">
                          QUESTION {String(idx + 1).padStart(2, '0')}
                        </span>
                        <span className="text-[10.5px] font-mono text-slate-400">
                          {q.domainName}
                        </span>
                      </div>

                      {/* Status Badges & Controls */}
                      <div className="flex items-center space-x-2">
                        {hasAnswered ? (
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-950/80 text-blue-300 border border-blue-800/60">
                            Answered ({answerText.trim().split(/\s+/).length} words)
                          </span>
                        ) : (
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-400">
                            Not Yet Answered
                          </span>
                        )}

                        <button
                          onClick={() => handleCopyPrompt(q.id, q.prompt)}
                          className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-[11px] font-medium border border-slate-700 transition-colors"
                          title="Copy interview question"
                        >
                          {copiedId === q.id ? 'Copied!' : 'Copy'}
                        </button>

                        <label className="flex items-center space-x-1.5 px-2 py-1 rounded bg-slate-800/80 border border-slate-700/80 cursor-pointer select-none text-[11px] text-slate-300 hover:bg-slate-800 transition-colors">
                          <input
                            type="checkbox"
                            checked={isMastered}
                            onChange={() => toggleMastered(q.id)}
                            className="w-3.5 h-3.5 rounded bg-slate-950 border-slate-700 text-emerald-500 focus:ring-0 focus:ring-offset-0 cursor-pointer"
                          />
                          <span className={isMastered ? 'text-emerald-400 font-semibold' : ''}>
                            {isMastered ? 'Mastered' : 'Mark Mastered'}
                          </span>
                        </label>
                      </div>
                    </div>

                    {/* Prominent Question Text */}
                    <h2 className="text-base sm:text-lg font-bold text-white tracking-tight leading-relaxed mb-3">
                      &quot;{q.prompt}&quot;
                    </h2>

                    {/* In Plain English Breakdown */}
                    {q.plainEnglish && (
                      <div className="mb-3.5 p-3 rounded-lg bg-blue-950/25 border border-blue-900/40 text-xs">
                        <div className="flex items-center space-x-1.5 text-blue-400 font-semibold mb-1">
                          <svg className="w-3.5 h-3.5 text-blue-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <span className="font-mono text-[11px] uppercase tracking-wider">In Simple Words:</span>
                        </div>
                        <p className="text-slate-300 leading-relaxed font-sans text-xs sm:text-[13px]">
                          {q.plainEnglish}
                        </p>
                      </div>
                    )}

                    {/* Key Technical Concepts Decoded */}
                    <div className="space-y-2">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="text-[11px] font-mono text-slate-400">
                          Keywords in this question:
                        </span>
                        {q.keyConcepts && q.keyConcepts.length > 0 && (
                          <button
                            onClick={() => toggleConcepts(q.id)}
                            className="text-[11px] text-sky-400 hover:text-sky-300 font-medium transition-colors flex items-center space-x-1"
                          >
                            <span>{showConcepts[q.id] ? 'Hide keyword meanings ▲' : '💡 What do these keywords mean? ▼'}</span>
                          </button>
                        )}
                      </div>

                      {/* Clean Keyword Badges (Clicking any tag shows answer & explanation) */}
                      <div className="flex flex-wrap gap-1.5">
                        {q.keyConcepts && q.keyConcepts.length > 0 ? (
                          q.keyConcepts.map((item) => (
                            <button
                              key={item.term}
                              onClick={() => {
                                setActiveTabs((prev) => ({ ...prev, [q.id]: 'explain' }));
                                setShowConcepts((prev) => ({ ...prev, [q.id]: true }));
                              }}
                              className="text-[11px] px-2.5 py-1 rounded-md bg-slate-900 border border-slate-800 text-sky-300 hover:border-sky-600/60 hover:text-white font-mono transition-colors text-left flex items-center space-x-1 cursor-pointer"
                              title={`Click to show answer and explain ${item.term}`}
                            >
                              <span>#{item.term}</span>
                              <span className="text-[10px] text-slate-500 hover:text-slate-300">↗</span>
                            </button>
                          ))
                        ) : (
                          q.tags.map((tag) => (
                            <button
                              key={tag}
                              onClick={() => {
                                setActiveTabs((prev) => ({ ...prev, [q.id]: 'explain' }));
                              }}
                              className="text-[10px] px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200 font-mono transition-colors cursor-pointer"
                            >
                              {tag}
                            </button>
                          ))
                        )}
                      </div>

                      {/* Decoded Plain-English Keyword Definitions */}
                      {showConcepts[q.id] && q.keyConcepts && q.keyConcepts.length > 0 && (
                        <div className="mt-2.5 p-3 rounded-lg bg-slate-950/80 border border-slate-800/80 space-y-2 animate-in fade-in duration-150">
                          <div className="text-[10.5px] font-mono text-slate-400 uppercase tracking-wider border-b border-slate-800/80 pb-1">
                            Plain English Meaning of Each Keyword:
                          </div>
                          <div className="grid grid-cols-1 gap-2 pt-0.5">
                            {q.keyConcepts.map((item) => (
                              <div key={item.term} className="text-xs flex flex-col sm:flex-row sm:items-start gap-1 sm:gap-2">
                                <span className="font-mono text-sky-400 font-semibold shrink-0 bg-slate-900 px-2 py-0.5 rounded border border-slate-800 text-[11px] self-start">
                                  {item.term}:
                                </span>
                                <span className="text-slate-300 text-[12px] leading-relaxed">
                                  {item.explanation}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Collapsible Action Bar (Answer typing box hidden by default, opens on click) */}
                  <div className="px-5 py-3 border-t border-slate-800/80 bg-slate-950/40 flex flex-wrap items-center justify-between gap-3 text-xs">
                    <div className="flex flex-wrap items-center gap-2">
                      {/* Action 1: Explain & Show Answer */}
                      <button
                        onClick={() =>
                          setActiveTabs((prev) => ({
                            ...prev,
                            [q.id]: currentTab === 'explain' ? 'collapsed' : 'explain'
                          }))
                        }
                        className={`px-3.5 py-1.5 rounded-lg font-semibold text-xs transition-colors flex items-center space-x-1.5 cursor-pointer ${
                          currentTab === 'explain'
                            ? 'bg-emerald-600 text-white shadow-sm'
                            : 'bg-emerald-950/70 hover:bg-emerald-900 text-emerald-300 border border-emerald-800/60'
                        }`}
                      >
                        <span>💡 {currentTab === 'explain' ? 'Hide Answer & Explanation ▲' : 'Show Answer & Explanation'}</span>
                      </button>

                      {/* Action 2: Type Your Answer (Hidden by default, opens on click) */}
                      <button
                        onClick={() =>
                          setActiveTabs((prev) => ({
                            ...prev,
                            [q.id]: currentTab === 'type' ? 'collapsed' : 'type'
                          }))
                        }
                        className={`px-3.5 py-1.5 rounded-lg font-semibold text-xs transition-colors flex items-center space-x-1.5 cursor-pointer ${
                          currentTab === 'type'
                            ? 'bg-blue-600 text-white shadow-sm'
                            : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700'
                        }`}
                      >
                        <span>✍️ {currentTab === 'type' ? 'Hide Typing Box ▲' : hasAnswered ? 'Edit Your Answer' : 'Type Your Answer'}</span>
                        {hasAnswered && currentTab !== 'type' && (
                          <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                        )}
                      </button>

                      {/* Action 3: Compare Both (only if user has typed an answer) */}
                      {hasAnswered && (
                        <button
                          onClick={() =>
                            setActiveTabs((prev) => ({
                              ...prev,
                              [q.id]: currentTab === 'compare' ? 'collapsed' : 'compare'
                            }))
                          }
                          className={`px-3 py-1.5 rounded-lg font-medium text-xs transition-colors cursor-pointer ${
                            currentTab === 'compare'
                              ? 'bg-purple-600 text-white shadow-sm'
                              : 'bg-slate-900 hover:bg-slate-800 text-purple-300 border border-purple-900/50'
                          }`}
                        >
                          <span>↔ Compare Both</span>
                        </button>
                      )}
                    </div>

                    <div className="text-[11px] font-mono text-slate-500">
                      {hasAnswered
                        ? `Answer saved (${answerText.trim().split(/\s+/).length} words)`
                        : 'Click above to view answer or type'}
                    </div>
                  </div>

                  {/* Expandable Workspace (Only shown when Explain, Type, or Compare is clicked) */}
                  {currentTab !== 'collapsed' && (
                    <div className="p-5 border-t border-slate-800/60 bg-slate-950/20">
                      {/* TAB: Explain / Model Answer */}
                      {currentTab === 'explain' && (
                        <div className="space-y-4 animate-in fade-in duration-150">
                          <div className="space-y-2.5">
                            <div className="flex items-center justify-between text-xs font-mono">
                              <span className="font-bold text-emerald-400 uppercase tracking-wider">
                                Principal / Staff Talking Points:
                              </span>
                              <span className="text-slate-500 text-[10.5px]">Evaluation Rubric</span>
                            </div>
                            <div className="space-y-2">
                              {q.talkingPoints.map((point, pIdx) => (
                                <div
                                  key={pIdx}
                                  className="flex items-start space-x-2.5 p-3 rounded-lg bg-slate-950/60 border border-slate-800/80 text-xs sm:text-sm text-slate-300 leading-relaxed"
                                >
                                  <span className="text-emerald-400 font-bold select-none mt-0.5">&bull;</span>
                                  <span>{point}</span>
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* Trade-off Callout Box */}
                          <div className="bg-amber-950/20 border border-amber-900/40 rounded-lg p-3.5 space-y-1">
                            <div className="text-[11px] font-mono font-bold text-amber-400 uppercase">
                              Key Architectural Trade-Off (Expected in Senior Rounds):
                            </div>
                            <p className="text-xs text-slate-300 leading-relaxed">
                              {q.keyTradeoff}
                            </p>
                          </div>

                          {/* Practice CTA */}
                          <div className="pt-2 flex items-center justify-between border-t border-slate-800/60">
                            <span className="text-xs text-slate-400">
                              Want to practice explaining this in your own words?
                            </span>
                            <button
                              onClick={() => setActiveTabs((prev) => ({ ...prev, [q.id]: 'type' }))}
                              className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs transition-colors flex items-center space-x-1 cursor-pointer"
                            >
                              <span>✍️ {hasAnswered ? 'Edit Your Answer' : 'Type Your Answer Now'} &rarr;</span>
                            </button>
                          </div>
                        </div>
                      )}

                      {/* TAB: Type Your Response */}
                      {currentTab === 'type' && (
                        <div className="space-y-3 animate-in fade-in duration-150">
                          <div className="flex items-center justify-between text-xs text-slate-400">
                            <label className="font-semibold text-slate-300 flex items-center space-x-2">
                              <span>Type Your Interview Response:</span>
                              {isSaved && (
                                <span className="text-[10px] text-emerald-400 font-mono animate-in fade-in">
                                  Auto-saved
                                </span>
                              )}
                            </label>
                            <span className="font-mono text-[11px]">
                              {answerText.length} chars | {answerText.trim() ? answerText.trim().split(/\s+/).length : 0} words
                            </span>
                          </div>

                          <textarea
                            value={answerText}
                            onChange={(e) => handleUserAnswerChange(q.id, e.target.value)}
                            placeholder="Structure your answer like an interview: 1. Core concept / mental model, 2. Mechanical explanation, 3. Production trade-off or edge case..."
                            rows={6}
                            className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3.5 text-xs sm:text-sm text-slate-200 placeholder-slate-500 font-mono leading-relaxed focus:outline-none focus:border-blue-500 resize-y"
                          />

                          <div className="flex flex-wrap items-center justify-between gap-2 pt-1 text-xs">
                            <div className="text-slate-500 text-[11px]">
                              Tip: Your answer is auto-saved as you type. Check the model answer when ready to self-grade.
                            </div>

                            <div className="flex items-center space-x-2">
                              <button
                                onClick={() => setActiveTabs((prev) => ({ ...prev, [q.id]: 'explain' }))}
                                className="px-3 py-1.5 rounded bg-emerald-950 hover:bg-emerald-900 text-emerald-300 font-semibold border border-emerald-800/80 transition-colors cursor-pointer"
                              >
                                View Model Answer &rarr;
                              </button>
                              {answerText && (
                                <>
                                  <button
                                    onClick={() => setActiveTabs((prev) => ({ ...prev, [q.id]: 'compare' }))}
                                    className="px-3 py-1.5 rounded bg-purple-950 hover:bg-purple-900 text-purple-300 font-semibold border border-purple-800/80 transition-colors cursor-pointer"
                                  >
                                    Compare Both &rarr;
                                  </button>
                                  <button
                                    onClick={() => handleUserAnswerChange(q.id, '')}
                                    className="px-2 py-1.5 text-slate-500 hover:text-rose-400 text-xs transition-colors cursor-pointer"
                                    title="Clear answer"
                                  >
                                    Clear
                                  </button>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      )}

                      {/* TAB: Compare Both (Side-by-Side) */}
                      {currentTab === 'compare' && (
                        <div className="space-y-4 animate-in fade-in duration-150">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Left: User Answer */}
                            <div className="space-y-2">
                              <div className="flex items-center justify-between text-xs text-slate-400">
                                <span className="font-semibold text-blue-400 font-mono uppercase">
                                  Your Answer:
                                </span>
                                <span className="font-mono text-[11px]">
                                  {answerText.trim() ? `${answerText.trim().split(/\s+/).length} words` : 'Empty'}
                                </span>
                              </div>
                              <div className="w-full min-h-[180px] bg-slate-950 border border-slate-800 rounded-lg p-3.5 text-xs text-slate-200 font-mono whitespace-pre-wrap leading-relaxed">
                                {answerText || (
                                  <span className="text-slate-500 italic">
                                    You haven&apos;t typed an answer yet. Click &quot;Type Your Answer&quot; to write your response.
                                  </span>
                                )}
                              </div>
                            </div>

                            {/* Right: Model Talking Points */}
                            <div className="space-y-2">
                              <span className="text-xs font-semibold text-emerald-400 font-mono uppercase">
                                Official Model Talking Points:
                              </span>
                              <div className="space-y-1.5 max-h-80 overflow-y-auto pr-1">
                                {q.talkingPoints.map((point, pIdx) => (
                                  <div
                                    key={pIdx}
                                    className="flex items-start space-x-2 p-2.5 rounded bg-slate-950/60 border border-slate-800 text-xs text-slate-300 leading-relaxed"
                                  >
                                    <span className="text-emerald-400 font-bold select-none">&bull;</span>
                                    <span>{point}</span>
                                  </div>
                                ))}
                                <div className="bg-amber-950/30 border border-amber-900/40 p-2.5 rounded text-[11.5px] text-slate-300 mt-2">
                                  <strong className="text-amber-400 font-mono uppercase block text-[10px] mb-0.5">
                                    Crucial Trade-off:
                                  </strong>
                                  {q.keyTradeoff}
                                </div>
                              </div>
                            </div>
                          </div>

                          <div className="pt-2 flex justify-end">
                            <button
                              onClick={() => setActiveTabs((prev) => ({ ...prev, [q.id]: 'type' }))}
                              className="px-3 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 transition-colors cursor-pointer"
                            >
                              Edit Your Answer &rarr;
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })
          ) : (
            <div className="text-center py-16 bg-slate-900/40 border border-slate-800 rounded-xl space-y-2">
              <div className="text-sm font-semibold text-slate-300">
                No matching questions found
              </div>
              <p className="text-xs text-slate-500">
                Try clearing your search query or switching your filter from &quot;{filterMode}&quot; to &quot;All&quot;.
              </p>
              <button
                onClick={() => {
                  setSearchQuery('');
                  setFilterMode('all');
                }}
                className="mt-3 px-3 py-1.5 rounded bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold"
              >
                Reset Filters
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Permanently Pinned Right Toolbar */}
      <div className="fixed top-20 right-4 z-30 flex flex-col space-y-2 select-none">
        <button
          onClick={() => setIsNotesOpen(!isNotesOpen)}
          className={`p-2.5 rounded-lg border text-xs font-semibold shadow-xl transition-all flex items-center justify-center ${
            isNotesOpen
              ? 'bg-blue-600 text-white border-blue-500'
              : 'bg-slate-900 text-slate-300 border-slate-700 hover:bg-slate-800 hover:text-white'
          }`}
          title="Open Notes Drawer (Side-by-side reading & writing)"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
        </button>

        <button
          onClick={() => setIsStickyOpen(!isStickyOpen)}
          className={`p-2.5 rounded-lg border text-xs font-semibold shadow-xl transition-all flex items-center justify-center ${
            isStickyOpen
              ? 'bg-amber-600 text-white border-amber-500'
              : 'bg-slate-900 text-slate-300 border-slate-700 hover:bg-slate-800 hover:text-white'
          }`}
          title="Toggle Floating Sticky Note (Draggable anywhere)"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        </button>
      </div>

      {/* Floating Draggable Sticky Note Widget */}
      {isStickyOpen && (
        <div
          style={{ top: `${stickyPos.y}px`, left: `${stickyPos.x}px` }}
          className={`fixed z-40 w-72 ${theme.bg} border-2 ${theme.border} rounded-lg shadow-2xl overflow-hidden flex flex-col`}
        >
          {/* Draggable Header */}
          <div
            onMouseDown={handleStickyHeaderMouseDown}
            className={`${theme.header} px-3 py-2 flex items-center justify-between text-xs font-bold border-b border-white/10 cursor-grab active:cursor-grabbing select-none`}
            title="Click and drag to move anywhere on your screen"
          >
            <div className="flex items-center space-x-1.5">
              <span>&#10022;</span>
              <span className="tracking-wide">Sticky Note</span>
              <span className="text-[10px] opacity-60 font-normal">(Drag me)</span>
            </div>
            <div className="flex items-center space-x-1.5">
              <button
                onClick={() => setStickyColor('amber')}
                className="w-3 h-3 rounded-full bg-amber-400 border border-white/40"
                title="Amber theme"
              />
              <button
                onClick={() => setStickyColor('emerald')}
                className="w-3 h-3 rounded-full bg-emerald-400 border border-white/40"
                title="Emerald theme"
              />
              <button
                onClick={() => setStickyColor('blue')}
                className="w-3 h-3 rounded-full bg-blue-400 border border-white/40"
                title="Blue theme"
              />
              <button
                onClick={() => setStickyColor('purple')}
                className="w-3 h-3 rounded-full bg-purple-400 border border-white/40"
                title="Purple theme"
              />

              <button
                onClick={() => setIsStickyMinimized(!isStickyMinimized)}
                className="hover:text-white px-1 font-mono text-xs"
                title={isStickyMinimized ? 'Expand' : 'Minimize'}
              >
                {isStickyMinimized ? '+' : '-'}
              </button>
              <button
                onClick={() => setIsStickyOpen(false)}
                className="hover:text-white px-1 font-mono text-xs font-bold"
                title="Close sticky note"
              >
                x
              </button>
            </div>
          </div>

          {/* Sticky Textarea */}
          {!isStickyMinimized && (
            <textarea
              value={stickyText}
              onChange={(e) => {
                setStickyText(e.target.value);
                try {
                  localStorage.setItem(`js_interview_sticky_${activeCategory}`, e.target.value);
                } catch {
                  // Ignore
                }
              }}
              placeholder="Jot down quick reminders, scratch calculations, questions to re-check..."
              className={`w-full h-44 p-3 bg-transparent ${theme.text} text-xs placeholder-white/40 resize-none focus:outline-none font-mono leading-relaxed`}
            />
          )}
        </div>
      )}

      {/* Docked Notes Panel (Zero backdrop blur - side-by-side reading!) */}
      {isNotesOpen && (
        <div className="fixed top-0 right-0 h-screen w-80 sm:w-96 bg-slate-900 border-l border-slate-700 shadow-2xl z-40 flex flex-col p-4 animate-in slide-in-from-right duration-150">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-3">
            <div>
              <h3 className="text-sm font-bold text-white tracking-tight flex items-center space-x-1.5">
                <span>&#9998;</span>
                <span>Interview Notes</span>
              </h3>
              <span className="text-[11px] text-blue-400 font-mono uppercase">
                {activeCategory} Track
              </span>
            </div>
            <button
              onClick={() => setIsNotesOpen(false)}
              className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white text-xs font-semibold border border-slate-700"
              title="Close notes panel"
            >
              Close
            </button>
          </div>

          <textarea
            value={notesText}
            onChange={(e) => handleNotesChange(e.target.value)}
            placeholder={`Type your interview preparation notes for ${activeCategory} here. Auto-saved continuously with zero backdrop blur...`}
            className="flex-1 w-full bg-slate-950 border border-slate-800 rounded p-3 text-xs text-slate-200 placeholder-slate-500 resize-none focus:outline-none focus:border-blue-500 font-mono leading-relaxed"
          />

          <div className="flex items-center justify-between pt-3 border-t border-slate-800 mt-3 text-xs">
            <span className="text-slate-500 font-mono">{notesText.length} chars</span>
            <div className="flex items-center space-x-2">
              <button
                onClick={exportNotes}
                className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700"
                title="Export notes as .txt file"
              >
                Export .txt
              </button>
              <button
                onClick={() => handleNotesChange('')}
                className="px-2 py-1 text-slate-500 hover:text-rose-400 text-xs"
                title="Clear all notes"
              >
                Clear
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
