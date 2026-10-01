# MODULE REACT-00 — REACT INTERNALS & ARCHITECTURE MASTERCLASS
## Complete Curriculum Queue, Fiber Mental Models & Engineering Roadmap

---

# 00. HOW TO USE THIS MASTERCLASS

### What is React Under the Hood?
React is not just a UI library; it is a **declarative tree reconciliation and cooperative scheduling runtime**. When you call `setState` or dispatch an action, React does not immediately touch the browser DOM. Instead, it computes a new graph of lightweight JavaScript records (**Fiber nodes**), performs an incremental tree diff using a priority bitmask system (**Lanes**), yields execution to the browser to maintain a smooth 60/120fps frame rate, and finally commits DOM mutations in a single synchronous pass.

```text
┌────────────────────────────────────────────────────────────────────────┐
│                   THE REACT 19 RUNTIME ARCHITECTURE                    │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
       ┌────────────────────────────┼────────────────────────────┐
       ▼                            ▼                            ▼
┌──────────────┐             ┌──────────────┐             ┌──────────────┐
│ RENDER PHASE │             │ SCHEDULER    │             │ COMMIT PHASE │
│ Cooperative, │────────────►│ Work Loop,   │────────────►│ Synchronous, │
│ Interruptible│             │ Priority     │             │ DOM Mutation │
│ Fiber Diff   │             │ Lanes        │             │ LayoutEffects│
└──────────────┘             └──────────────┘             └──────────────┘
       ▲                                                         │
       │                    DOUBLE BUFFERING                     │
       └─────────────────────────────────────────────────────────┘
            current (On Screen)  ◄───►  workInProgress (Off Screen)
```

---

# 01. THE 7 CORE PILLARS OF REACT INTERNALS

This curriculum is structured into 7 foundational masterclass modules:

### Module REACT-00: Curriculum Queue & Architecture Index (Current Module)
- Core architectural philosophy: Pull vs Push systems.
- The 3-phase runtime lifecycle: Scheduler, Reconciler, Renderer.
- Double-buffering memory model: `current` vs `workInProgress` trees.
- How React compares to SolidJS (signals), Svelte (compile-time reactivity), and Vue (fine-grained proxy reactivity).

### Module REACT-01: Virtual DOM vs Fiber Architecture
- Why the legacy Stack Reconciler (React 15) failed on complex UIs: recursion that blocked the main thread.
- Fiber Node anatomy: `tag`, `key`, `type`, `stateNode`, `child`, `sibling`, `return`, `alternate`.
- The Singly-Linked List traversal algorithm replacing tree recursion.
- Memory lifecycle: how Fiber nodes are reused across renders to minimize garbage collection pauses.

### Module REACT-02: Work Loop, Concurrency & Priority Lanes
- The Cooperative Multitasking Work Loop: `workLoopConcurrent` vs `workLoopSync`.
- Time-slicing with `MessageChannel` and `shouldYieldToHost()`.
- Priority Lanes bitmask arithmetic: `SyncLane`, `InputContinuousLane`, `DefaultLane`, `IdleLane`.
- Interruptible rendering, transition lifecycles, and `useTransition` / `useDeferredValue` mechanics.

### Module REACT-03: Hooks Internals & Execution Model
- How functional components maintain persistent state across renders without classes.
- Fiber hook storage: the `fiber.memoizedState` circular singly-linked list.
- Step-by-step mechanics of `useState`, `useReducer`, `useEffect`, `useLayoutEffect`, `useRef`, and `useMemo`.
- Why Hook Rules exist (no conditional hooks, call order invariants) and stale closure prevention.

### Module REACT-04: Synthetic Events & State Management
- React's Synthetic Event System: root-level event delegation, capturing/bubbling dispatch loop.
- Automatic batching across promises, timeouts, and native event handlers (React 18+).
- State updater queue architecture: `updateQueue.shared.pending` circular buffer.
- Subscribing to external stores safely without tearing via `useSyncExternalStore`.

### Module REACT-05: React Server Components (RSC) & Streaming SSR
- The fundamental divide: Client Components vs Server Components.
- The React Flight protocol: streaming JSON-like wire format and chunked token parsing.
- Streaming SSR with `renderToPipeableStream` and progressive HTML hydration.
- Server Actions, RPC boundaries, and zero-bundle-size server dependencies.

### Module REACT-06: Compiler Optimization & Production Profiling
- The React Compiler (Forget): automatic memoization graph generation and AST transformation.
- Manual memoization pitfalls: `React.memo`, `useMemo`, `useCallback` cache overhead.
- List reconciliation algorithm: the index-as-key antipattern, element key hashing, and node placement flags.
- Advanced performance profiling: DevTools Flamegraphs, Ranked views, Commit duration metrics, and windowing.

---

# 02. CURRICULUM PROGRESSION ROADMAP

```text
┌────────────────────────────────────────────────────────────────────────┐
│                        CORE RUNTIME FOUNDATIONS                        │
│   REACT-00 (Architecture) ──► REACT-01 (Fiber Tree) ──► REACT-02 (Lanes)│
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                      STATE & EXECUTION MECHANICS                       │
│           REACT-03 (Hooks Internals) ──► REACT-04 (Synthetic Events)    │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                     MODERN PRODUCTION ARCHITECTURE                     │
│         REACT-05 (Server Components & RSC) ──► REACT-06 (Compiler)     │
└────────────────────────────────────────────────────────────────────────┘
```

---

# 03. HOW TO STUDY THIS TRACK

1. **Read Sequentially**: Each chapter builds directly on the data structures introduced in the previous chapter. For example, understanding Hooks (Module 03) requires understanding the Fiber node (Module 01) and Work Loop (Module 02).
2. **Trace the Memory Pointers**: Pay close attention to pointer manipulations (`child`, `sibling`, `return`, `memoizedState`). React is fundamentally an exercise in pointer traversal.
3. **Use the Exercises**: Every module contains output prediction puzzles, debugging drills, and implementation challenges with separated hints and solutions.
