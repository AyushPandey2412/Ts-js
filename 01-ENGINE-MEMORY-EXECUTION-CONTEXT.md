# Module 01: The JavaScript Engine, Memory Architecture & Execution Context

> **Learning Invariant**: Code in JavaScript does not run in a vacuum. It executes inside an **Execution Context** managed by the **Call Stack**, while allocating data across the **Stack** and the **Heap**. Master how memory is allocated during the *Creation Phase* before a single line of code executes, and you will never be surprised by `undefined`, hoisting, the Temporal Dead Zone, or production memory leaks again.

---

## Master Table of Contents

- [1. The Genesis: Why JavaScript Behave This Way](#1-the-genesis-why-javascript-behaves-this-way)
  - [1.1 The 1995 Invariants & The 10-Day Constraint](#11-the-1995-invariants--the-10-day-constraint)
  - [1.2 Interpreted vs Compiled vs Just-In-Time (JIT) Compilation](#12-interpreted-vs-compiled-vs-just-in-time-jit-compilation)
  - [1.3 The V8 Execution Pipeline: Parser, Ignition, and TurboFan](#13-the-v8-execution-pipeline-parser-ignition-and-turbofan)
  - [1.4 De-optimization (Bailouts) & Shape Divergence](#14-de-optimization-bailouts--shape-divergence)
- [2. Hardware Memory Architecture: Call Stack vs Memory Heap](#2-hardware-memory-architecture-call-stack-vs-memory-heap)
  - [2.1 Operating System Process Layout](#21-operating-system-process-layout)
  - [2.2 The Call Stack: Stack Frames & Activation Records](#22-the-call-stack-stack-frames--activation-records)
  - [2.3 Maximum Call Stack Size & Stack Overflow Mechanics](#23-maximum-call-stack-size--stack-overflow-mechanics)
  - [2.4 The Memory Heap: Dynamic Allocation & Pointer References](#24-the-memory-heap-dynamic-allocation--pointer-references)
  - [2.5 V8 Pointer Tagging: Smi (Small Integer) vs HeapObject](#25-v8-pointer-tagging-smi-small-integer-vs-heapobject)
- [3. The Execution Context Architecture](#3-the-execution-context-architecture)
  - [3.1 Execution Context Internal Anatomy](#31-execution-context-internal-anatomy)
  - [3.2 The Global Execution Context (GEC) Across Runtimes](#32-the-global-execution-context-gec-across-runtimes)
  - [3.3 The Invisible Node.js CommonJS Module Wrapper](#33-the-invisible-nodejs-commonjs-module-wrapper)
  - [3.4 Function Execution Contexts (FEC) & Dynamic Allocation](#34-function-execution-contexts-fec--dynamic-allocation)
  - [3.5 Eval Execution Context & Strict Mode Safety](#35-eval-execution-context--strict-mode-safety)
- [4. The Two Phases of Every Execution Context](#4-the-two-phases-of-every-execution-context)
  - [4.1 Phase 1: The Creation Phase (Memory Allocation)](#41-phase-1-the-creation-phase-memory-allocation)
  - [4.2 Phase 2: The Execution Phase (Statement Evaluation)](#42-phase-2-the-execution-phase-statement-evaluation)
  - [4.3 VariableEnvironment vs LexicalEnvironment Components](#43-variableenvironment-vs-lexicalenvironment-components)
  - [4.4 Declarative vs Object Environment Records](#44-declarative-vs-object-environment-records)
- [5. Hoisting Mechanics & The Temporal Dead Zone (TDZ)](#5-hoisting-mechanics--the-temporal-dead-zone-tdz)
  - [5.1 The Hoisting Spectrum: var, let, const, function, and class](#51-the-hoisting-spectrum-var-let-const-function-and-class)
  - [5.2 Function Declarations vs Expressions vs Arrow Functions](#52-function-declarations-vs-expressions-vs-arrow-functions)
  - [5.3 The Temporal Dead Zone (TDZ) Specification Semantics](#53-the-temporal-dead-zone-tdz-specification-semantics)
  - [5.4 The Scope Shadowing Proof of TDZ](#54-the-scope-shadowing-proof-of-tdz)
  - [5.5 Class Hoisting & Subclass Constructor TDZ](#55-class-hoisting--subclass-constructor-tdz)
- [6. Lexical Scoping & The Scope Chain](#6-lexical-scoping--the-scope-chain)
  - [6.1 Lexical (Static) Scope vs Dynamic Scope](#61-lexical-static-scope-vs-dynamic-scope)
  - [6.2 The OuterEnv Pointer & Scope Chain Traversal](#62-the-outerenv-pointer--scope-chain-traversal)
  - [6.3 Block Scope & Nested Lexical Environments](#63-block-scope--nested-lexical-environments)
  - [6.4 Why eval and with Degrade Engine Optimizations](#64-why-eval-and-with-degrade-engine-optimizations)
- [7. The this Binding Architecture](#7-the-this-binding-architecture)
  - [7.1 The Four Rules of this Resolution](#71-the-four-rules-of-this-resolution)
  - [7.2 Explicit Binding: call, apply, and bind](#72-explicit-binding-call-apply-and-bind)
  - [7.3 Arrow Functions and Lexical this](#73-arrow-functions-and-lexical-this)
  - [7.4 Strict Mode Impacts on this](#74-strict-mode-impacts-on-this)
- [8. V8 Garbage Collection & Memory Management](#8-v8-garbage-collection--memory-management)
  - [8.1 The Generational Hypothesis](#81-the-generational-hypothesis)
  - [8.2 V8 Heap Memory Spaces Layout](#82-v8-heap-memory-spaces-layout)
  - [8.3 Minor GC: Scavenge Cheney Copying Algorithm](#83-minor-gc-scavenge-cheney-copying-algorithm)
  - [8.4 Major GC: Mark-Sweep-Compact & Idle-Time Compaction](#84-major-gc-mark-sweep-compact--idle-time-compaction)
  - [8.5 Write Barriers & The Remembered Set](#85-write-barriers--the-remembered-set)
- [9. Production Memory Leaks & Heap Diagnostics](#9-production-memory-leaks--heap-diagnostics)
  - [9.1 Accidental Globals & Uncleared Timers](#91-accidental-globals--uncleared-timers)
  - [9.2 Retained Closures & Hidden Retainers](#92-retained-closures--hidden-retainers)
  - [9.3 Detached DOM Trees in Node/SSR and Browsers](#93-detached-dom-trees-in-nodessr-and-browsers)
  - [9.4 Profiling Memory Leaks with Node.js inspect & Chrome DevTools](#94-profiling-memory-leaks-with-nodejs-inspect--chrome-devtools)
- [10. Senior Production DOs and DON'Ts Matrix](#10-senior-production-dos-and-donts-matrix)
- [11. Senior Engineering Interview Questions & Proofs](#11-senior-engineering-interview-questions--proofs)
- [12. Active Engineering Challenges](#12-active-engineering-challenges)
  - [Challenge 1: The Trampoline Stack Overflow Runner](#challenge-1-the-trampoline-stack-overflow-runner)
  - [Challenge 2: Deep Immutable Metadata Cloner with Prototype Guard](#challenge-2-deep-immutable-metadata-cloner-with-prototype-guard)
  - [Challenge 3: Closure Memory Leak Detector with FinalizationRegistry](#challenge-3-closure-memory-leak-detector-with-finalizationregistry)

---

## 1. The Genesis: Why JavaScript Behaves This Way

### 1.1 The 1995 Invariants & The 10-Day Constraint

In May 1995, Brendan Eich developed Mocha (later named LiveScript, then JavaScript) for Netscape Navigator 2.0 in roughly 10 days. Three non-negotiable architectural constraints shaped JavaScript's fundamental design:

1. **Lightweight & Embedded in the Web Browser**: No heavy multi-pass compiler or separate compilation step like C, C++, or Java. The code had to be served as raw ASCII text and executed immediately.
2. **Accessible to Non-Programmers**: Lenient error handling and dynamic typing. Early web pages could not afford to crash or refuse to display if a minor syntax or type issue occurred.
3. **Single-Threaded Event Loop**: Operating systems in the mid-1990s suffered frequent deadlocks and race conditions when developers handled raw multi-threading. A single-threaded runtime with an event-driven queue eliminated thread synchronization locks entirely.

To make the language feel "forgiving" and avoid compilation errors when functions appeared later in a script, JavaScript allowed developers to invoke functions before their lexical definition in the source text. 

To achieve this without a full multi-pass ahead-of-time compiler, the engine had to **parse and allocate declarations before executing the statements**. This mechanical requirement birthed the permanent **two-phase lifecycle** of JavaScript:

- **Phase 1: The Creation (Memory Allocation) Phase**
- **Phase 2: The Execution (Statement Evaluation) Phase**

### 1.2 Interpreted vs Compiled vs Just-In-Time (JIT) Compilation

A common misconception is that JavaScript is an "interpreted language." While early JavaScript engines (like SpiderMonkey in Netscape 2.0) were pure bytecode interpreters, modern production runtimes (Google V8, Mozilla SpiderMonkey, Apple JavaScriptCore) are high-performance **Just-In-Time (JIT) compilers**.

| Execution Model | Compilation Phase | Execution Speed | Optimization Capability |
| :--- | :--- | :--- | :--- |
| **Pure Interpreter** | None (Walks AST or Bytecode line-by-line) | Slow (50x-100x slower than C) | None |
| **Ahead-Of-Time (AOT)** | Compile to machine code before execution | Maximum native speed | Static optimization only |
| **Modern JIT Compiler** | Compiles bytecode immediately, compiles hot paths to machine code at runtime | Near native speed (within 1.5x-2x of C++) | Dynamic profiling based on real runtime types |

### 1.3 The V8 Execution Pipeline: Parser, Ignition, and TurboFan

Google's **V8 engine** (which powers Google Chrome, Node.js, Deno, and Electron) executes JavaScript through a three-stage JIT pipeline:

```text
  [ Raw Source Text ]
          │
          ▼
   [ Stream Parser ] ────► Syntax Errors & Grammar Verification (Early Errors)
          │
          ▼
  [ AST (Abstract Syntax Tree) ]
          │
          ▼
   [ Ignition (Interpreter) ] ────► Generates Compact Bytecode (Starts execution in ms)
          │
     Type Feedback
      (Profiler)
          │
          ▼
   [ TurboFan (Optimizing Compiler) ] ────► Hot Code compiled to Optimized Machine Code
          ▲
          │ (De-optimization / Bailout on Shape Divergence)
          └───────────────────────────────
```

1. **Parser & Lexer**: Converts the raw UTF-16 stream into tokens, then builds an **Abstract Syntax Tree (AST)**. Syntax errors (e.g. invalid tokens, misplaced keywords) are thrown here *before* any runtime evaluation begins.
2. **Ignition (Bytecode Interpreter)**: Emits compact bytecode from the AST. Bytecode starts executing in single-digit milliseconds with low memory overhead. As functions execute, Ignition records runtime **type feedback vectors** (e.g., whether a function always receives integers or objects of a specific shape).
3. **TurboFan (Optimizing Compiler)**: When a function becomes "hot" (called thousands of times), TurboFan takes the bytecode and type feedback, makes speculative assumptions (e.g. "argument `x` is always a 31-bit integer"), and compiles the function directly into optimized machine code.

### 1.4 De-optimization (Bailouts) & Shape Divergence

TurboFan's optimizations are speculative. If a function compiled with the assumption that `add(a, b)` always receives integers suddenly receives a string `add("hello", 5)`, TurboFan's machine code cannot safely execute. 

The CPU bails out, triggers a **de-optimization (deopt)**, discards the native machine code, and transitions execution back to Ignition bytecode. Frequent deopts cause performance degradation ("JIT churning").

---

## 2. Hardware Memory Architecture: Call Stack vs Memory Heap

### 2.1 Operating System Process Layout

When a Node.js process starts or a browser tab opens, the OS assigns it a virtual address space divided into distinct segments:

```text
  ┌────────────────────────────────────────────────────────┐  High Memory Addresses
  │  Call Stack (LIFO: Stack Frames, Activation Records)   │  ▼ Grows downward
  ├────────────────────────────────────────────────────────┤
  │                       Free Space                       │
  ├────────────────────────────────────────────────────────┤
  │  Memory Heap (Dynamic Objects, Closures, Buffers)      │  ▲ Grows upward
  ├────────────────────────────────────────────────────────┤
  │  Data Segment (Constants, Static Data, Smi Literals)   │
  ├────────────────────────────────────────────────────────┤
  │  Text / Code Segment (V8 Binary & Compiled Machine Code│  Low Memory Addresses
  └────────────────────────────────────────────────────────┘
```

### 2.2 The Call Stack: Stack Frames & Activation Records

The **Call Stack** is a fixed-size, contiguous memory region managed directly by the CPU using the stack pointer (`RSP` on x86-64).

Every time a function is called, the engine pushes a new **Stack Frame (Activation Record)** onto the top of the stack:

```text
         CALL STACK (Fast, LIFO)                      MEMORY HEAP (Dynamic, Flexible)
  ┌────────────────────────────────────────┐       ┌─────────────────────────────────┐
  │ [Stack Frame: calculateTotal(items)]   │       │  0x00A1F0:                      │
  │   - returnAddress: 0x7FFF12A0          │       │  [ { id: 1, price: 50 },        │
  │   - framePointer: 0x7FFF4020           │       │    { id: 2, price: 75 } ]       │
  │   - taxRate: 0.15 (Smi / Primitive)    │       │                                 │
  │   - itemsRef: 0x00A1F0 ────────────────┼──────►│  0x00B4C8:                      │
  ├────────────────────────────────────────┤       │  { name: "Order #101" }         │
  │ [Stack Frame: processOrder()]          │       └─────────────────────────────────┘
  │   - orderId: 101                       │
  │   - orderRef: 0x00B4C8 ────────────────┼───────┘
  ├────────────────────────────────────────┤
  │ [Stack Frame: Global Execution Context]│
  │   - version: 1.0                       │
  └────────────────────────────────────────┘
```

#### What Lives on the Call Stack:
1. **Primitive Values**: Small numbers (`Smi`), booleans, `null`, `undefined`, and Symbol keys.
2. **References / Pointers**: Memory addresses (e.g. `0x00A1F0`) that point to heap objects.
3. **Execution Control**: Return addresses, previous base frame pointers (`RBP`), and saved register states.

### 2.3 Maximum Call Stack Size & Stack Overflow Mechanics

Because the Call Stack is allocated as a fixed contiguous block by the OS, it has a strict size limit. In Node.js (V8 on 64-bit platforms), the default stack size is typically **984 KB** (roughly 10,000 to 12,000 nested function frames).

When recursive calls exceed this boundary, V8 terminates with a fatal exception:

```javascript
// Demonstration of Stack Overflow
function recursiveBomb(depth = 0) {
  try {
    return recursiveBomb(depth + 1);
  } catch (err) {
    console.error(`Stack collapsed at depth: ${depth}`);
    console.error(err); // RangeError: Maximum call stack size exceeded
  }
}
recursiveBomb();
```

### 2.4 The Memory Heap: Dynamic Allocation & Pointer References

The **Memory Heap** is an unstructured pool of memory used to store reference types that cannot fit into fixed stack frames because their size is dynamic, unbounded, or long-lived.

#### What Lives on the Memory Heap:
- Objects (`{}`), Arrays (`[]`), Functions, Dates, RegExps.
- Buffer instances, `TypedArray` memory blocks, `Map`, `Set`, `WeakMap`.
- Heap-allocated strings (strings longer than 12-16 characters or non-interned strings).
- `BigInt` (can store arbitrary thousands of digits).
- Boxed primitives (`new Number()`, `new Boolean()`).

### 2.5 V8 Pointer Tagging: Smi (Small Integer) vs HeapObject

A critical V8 performance optimization is **Pointer Tagging**. On 64-bit architectures, pointers to heap memory are 8-byte aligned, meaning their lowest 3 bits are always `000`.

V8 exploits this hardware property by using the lowest bit to differentiate between numbers and heap pointers:

```text
64-bit Pointer Tagging Layout:

Smi (Small Integer):
┌───────────────────────────────────────────────┬───┐
│               31-bit or 32-bit Integer Value  │ 0 │  <-- Lowest bit = 0: Immediate Integer
└───────────────────────────────────────────────┴───┘

HeapObject Pointer:
┌───────────────────────────────────────────────┬───┐
│               63-bit Heap Memory Address      │ 1 │  <-- Lowest bit = 1: Dereference Heap Address
└───────────────────────────────────────────────┴───┘
```

- **Smi (Small Integer)**: Integers within `-2^31` to `2^31 - 1` are stored **directly inside the variable container** on the stack with zero heap allocation overhead.
- **HeapObject**: If the value is a string, object, array, or 64-bit floating point number, V8 sets the lowest bit to `1`. When reading the object, V8 clears the tag bit (`address & ~1`) to recover the real memory address on the heap.

---

## 3. The Execution Context Architecture

### 3.1 Execution Context Internal Anatomy

An **Execution Context (EC)** is a formal specification construct created by the JavaScript engine to evaluate and execute code. Every Execution Context contains three essential components:

```text
┌────────────────────────────────────────────────────────────────────────┐
│                      EXECUTION CONTEXT ANATOMY                         │
├────────────────────────────────────────────────────────────────────────┤
│ 1. VariableEnvironment                                                 │
│    - EnvironmentRecord (Stores 'var' variables, function declarations) │
│                                                                        │
│ 2. LexicalEnvironment                                                  │
│    - EnvironmentRecord (Stores 'let', 'const', 'class' declarations)   │
│    - OuterEnv Pointer  (Points to Parent Lexical Environment)          │
│                                                                        │
│ 3. ThisBinding                                                         │
│    - Holds the evaluated value of 'this' for the current context       │
└────────────────────────────────────────────────────────────────────────┘
```

### 3.2 The Global Execution Context (GEC) Across Runtimes

When your script loads, the engine automatically initializes the **Global Execution Context (GEC)** before any code is invoked. The GEC is unique:
- It is created exactly **once** per thread/worker.
- It sits permanently at the very bottom of the Call Stack until the process terminates.
- Its `OuterEnv` pointer is `null`.

#### Platform Differences in the Global Object:
- **Browsers**: The global object is `window`. Top-level `var` variables create enumerable properties on `window`.
- **Node.js**: The global object is `global`. Top-level variables in CommonJS files do **not** attach to `global` because of the invisible module wrapper.
- **Web Workers**: The global object is `self`.
- **Universal (ES2020+)**: `globalThis` is standardized to point to the correct global object across all environments.

### 3.3 The Invisible Node.js CommonJS Module Wrapper

When Node.js runs a CommonJS file (`.js`), it does not execute the code in the global scope. Instead, it reads the file text and wraps it inside an invisible function:

```javascript
// Node.js internal wrapper applied to every CommonJS file:
(function (exports, require, module, __filename, __dirname) {
  // YOUR ACTUAL SOURCE CODE IS EVALUATED HERE
  var databaseName = "production_db";
  console.log(global.databaseName); // undefined! (databaseName is scoped to this function)
});
```

Because your code is executed inside this function wrapper:
1. `__filename` and `__dirname` are local arguments to the wrapper, not global variables.
2. `var` variables declared at the top of your file are scoped to this wrapper function and do **not** pollute `global`.
3. `module.exports` and `exports` are passed into the function to capture exported properties.

### 3.4 Function Execution Contexts (FEC) & Dynamic Allocation

Every single time a function is invoked (`foo()`), the engine creates a brand new **Function Execution Context (FEC)** and pushes it onto the Call Stack.

When the function executes a `return` statement or reaches its closing brace, its context is popped off the Call Stack. Stack-allocated primitives are immediately reclaimed. However, any heap objects referenced by closures remain alive on the heap.

### 3.5 Eval Execution Context & Strict Mode Safety

Code executed via `eval("...")` creates an **Eval Execution Context**. In non-strict mode ("sloppy mode"), `eval()` injects variables directly into the calling scope:

```javascript
function dangerous() {
  eval("var injected = 42;");
  console.log(injected); // 42! (polluted local environment)
}
dangerous();
```

In `"use strict";` mode, `eval()` creates its own isolated Lexical Environment, preventing variables from leaking into the enclosing function.

---

## 4. The Two Phases of Every Execution Context

Whenever an Execution Context is instantiated, it executes in two distinct, sequential phases:

```text
   Script Invocation / Function Call
                  │
                  ▼
   ┌──────────────────────────────────────────────────────────┐
   │        PHASE 1: CREATION PHASE (Memory Allocation)        │
   │  - Allocate variable identifiers                         │
   │  - Function declarations: Hoist complete body             │
   │  - 'var': Initialize to 'undefined'                      │
   │  - 'let' & 'const': Register in uninitialized TDZ state  │
   │  - Establish [[OuterEnv]] scope pointer                  │
   │  - Determine 'this' binding                              │
   └──────────────────────────────────────────────────────────┘
                  │
                  ▼
   ┌──────────────────────────────────────────────────────────┐
   │        PHASE 2: EXECUTION PHASE (Statement Running)       │
   │  - Execute code line by line from top to bottom          │
   │  - Perform value assignments (x = 10)                    │
   │  - Invoke functions (creates new child FEC on Stack)     │
   │  - Evaluate expressions & return values                  │
   └──────────────────────────────────────────────────────────┘
```

### 4.1 Phase 1: The Creation Phase (Memory Allocation)

Before line 1 runs, the engine scans the code to prepare the `EnvironmentRecord`:

1. **Function Declarations**: The identifier is allocated in memory, and the **entire function body is compiled and assigned immediately**.
2. **`var` Declarations**: The variable name is allocated in memory and bound to the primitive value `undefined`.
3. **`let` and `const` Declarations**: The variable name is registered in the declarative environment record, but **remains in an uninitialized state**. Accessing it before initialization throws a `ReferenceError`.
4. **Scope Chain Binding**: The context's `[[OuterEnv]]` reference is set to the Lexical Environment where the function was *lexically defined* (author-time closure link).
5. **`this` Resolution**: The value of `this` is computed based on how the function was called.

### 4.2 Phase 2: The Execution Phase (Statement Evaluation)

The engine reads and evaluates the statements line-by-line:
- Variable assignments (`x = 50`) write the value into the allocated slot.
- Function calls push new stack frames onto the Call Stack.
- When an identifier is read, the engine searches the current environment record; if missing, it walks the `[[OuterEnv]]` chain.

### 4.3 VariableEnvironment vs LexicalEnvironment Components

In the ECMAScript specification:
- **`VariableEnvironment`**: Holds bindings declared using legacy `var` statements and `function` declarations. These bindings are scoped to the function or global level.
- **`LexicalEnvironment`**: Holds block-scoped bindings declared using `let`, `const`, and `class`. When entering a block statement (`if`, `for`, `{}`), a new `LexicalEnvironment` is created while keeping the same `VariableEnvironment`.

### 4.4 Declarative vs Object Environment Records

1. **Declarative Environment Record**: Directly stores identifier-to-value bindings in memory (used for functions, `let`, `const`, module scopes). High-performance, direct slot access.
2. **Object Environment Record**: Binds identifiers to properties on an underlying JavaScript object (used for the global scope in browsers where `var a = 1` sets `window.a = 1`, and the `with` statement).

---

## 5. Hoisting Mechanics & The Temporal Dead Zone (TDZ)

### 5.1 The Hoisting Spectrum: var, let, const, function, and class

**Hoisting** is the term used to describe JavaScript's behavior of reserving memory for declarations during Phase 1 (Creation Phase) before Phase 2 executes.

| Declaration Type | Phase 1 (Creation Phase Allocation) | Phase 2 Access Before Line | Re-declaration Allowed? |
| :--- | :--- | :--- | :--- |
| `function foo() {}` | Fully allocated with compiled body | **Callable immediately** | Yes (overwrites) |
| `var x = 10;` | Allocated with value `undefined` | Returns `undefined` (No crash) | Yes |
| `let y = 20;` | Registered, **Uninitialized (TDZ)** | Throws `ReferenceError` | No (SyntaxError) |
| `const z = 30;` | Registered, **Uninitialized (TDZ)** | Throws `ReferenceError` | No (SyntaxError) |
| `class User {}` | Registered, **Uninitialized (TDZ)** | Throws `ReferenceError` | No (SyntaxError) |

### 5.2 Function Declarations vs Expressions vs Arrow Functions

```javascript
// 1. Function Declaration (Hoisted completely)
console.log(typeof getTax); // "function"
console.log(getTax(100));   // 15

function getTax(amount) {
  return amount * 0.15;
}

// 2. Function Expression with 'var' (Variable hoisted as undefined)
console.log(typeof calculateDiscount); // "undefined"
try {
  calculateDiscount(100); // TypeError: calculateDiscount is not a function!
} catch (err) {
  console.error(err.message);
}

var calculateDiscount = function(amount) {
  return amount * 0.10;
};

// 3. Arrow Function with 'const' (In TDZ until executed)
try {
  calculateShipping(50); // ReferenceError: Cannot access 'calculateShipping' before initialization
} catch (err) {
  console.error(err.message);
}

const calculateShipping = (weight) => weight * 2.5;
```

### 5.3 The Temporal Dead Zone (TDZ) Specification Semantics

The **Temporal Dead Zone (TDZ)** is the temporal span from the start of a block's execution context until the variable's declaration statement is evaluated.

```text
┌────────────────────────────────────────────────────────┐
│ { // Block Scope Begins                                │
│   // <----- TEMPORAL DEAD ZONE (TDZ) FOR 'rate'        │
│   // Memory is allocated for 'rate', but uninitialized │
│                                                        │
│   console.log(rate); // Throws ReferenceError!         │
│   // <-------------------------------------------------│
│   let rate = 0.05; // Initialization line (TDZ ends)   │
│                                                        │
│   console.log(rate); // 0.05 (Safe to access)          │
│ }                                                      │
└────────────────────────────────────────────────────────┘
```

> [!IMPORTANT]
> The TDZ is **temporal** (based on time of execution), not **spatial** (based on position in the file). A function written above the declaration can access the variable safely *if* the function is invoked *after* the declaration line runs.

```javascript
// Temporal Proof:
function readValue() {
  console.log(count); // Safe! Because readValue() is called AFTER count is initialized
}

let count = 42; // count is initialized here
readValue();    // Logs: 42
```

### 5.4 The Scope Shadowing Proof of TDZ

A classic junior developer misconception is believing that `let` and `const` are "not hoisted at all." 

The following snippet mathematically disproves that hypothesis via **lexical shadowing**:

```javascript
let token = "GLOBAL_TOKEN";

function verifyAccess() {
  // If 'token' were NOT hoisted, this line would walk up the scope chain 
  // and log "GLOBAL_TOKEN".
  //
  // INSTEAD, IT THROWS:
  // ReferenceError: Cannot access 'token' before initialization
  console.log(token);

  let token = "LOCAL_TOKEN"; // The local declaration HOISTED and shadowed the outer scope!
}

verifyAccess();
```

*Proof*: If `let token` was not hoisted during Phase 1, the engine would have resolved `token` to the global `"GLOBAL_TOKEN"`. Because it threw a `ReferenceError`, the engine *must* have hoisted the local `token` during Phase 1, creating a local TDZ that masked the outer identifier.

### 5.5 Class Hoisting & Subclass Constructor TDZ

Classes in JavaScript are **not** hoisted like functions; they behave like `let`:

```javascript
try {
  new Order(); // ReferenceError: Cannot access 'Order' before initialization
} catch (err) {
  console.error(err.message);
}

class Order {
  constructor(id) {
    this.id = id;
  }
}
```

Furthermore, inside a subclass constructor, the `this` binding lives in a TDZ until `super()` is executed:

```javascript
class SpecialOrder extends Order {
  constructor(id, priority) {
    // console.log(this); // ReferenceError: Must call super constructor in derived class before accessing 'this'
    super(id);
    this.priority = priority; // Safe after super()
  }
}
```

---

## 6. Lexical Scoping & The Scope Chain

### 6.1 Lexical (Static) Scope vs Dynamic Scope

JavaScript uses **Lexical Scoping** (also called **Static Scoping**). 

The scope of an identifier is determined by its **physical location in the source code at author-time**, not by how or where the function is called at runtime:

```javascript
const userRole = "guest";

function authorize() {
  console.log(userRole);
}

function adminContext() {
  const userRole = "admin";
  authorize(); // What does this print?
}

adminContext(); // Prints: "guest" (Resolved by author-time lexical nesting, NOT call site!)
```

### 6.2 The OuterEnv Pointer & Scope Chain Traversal

Every Lexical Environment contains an internal link: `[[OuterEnv]]`. When a variable is accessed:
1. The engine checks the current local `EnvironmentRecord`.
2. If the identifier is not found, the engine dereferences `[[OuterEnv]]` to check the parent environment.
3. This process repeats recursively until it reaches the Global Environment (`[[OuterEnv]] === null`).
4. If not found in the Global Environment, the engine throws a `ReferenceError`.

```text
  [ Local FEC: format() ] ──[[OuterEnv]]──► [ Parent FEC: render() ] ──[[OuterEnv]]──► [ Global Context ]
            │                                        │                                         │
       currency? (Found: "$")                   theme? (Found: "dark")                    appName? (Found: "App")
```

### 6.3 Block Scope & Nested Lexical Environments

Before ES6, JavaScript only had **Global Scope** and **Function Scope**. Blocks (`if`, `for`, `while`) did not create new scopes for `var`.

ES6 introduced **Block Scoping** for `let` and `const`. Whenever the engine enters a block `{ ... }`, it creates a lightweight child `LexicalEnvironment`:

```javascript
function processItems(items) {
  var count = 0; // Function-scoped

  if (items.length > 0) {
    let batchId = "batch_01"; // Block-scoped to this 'if'
    const timestamp = Date.now(); // Block-scoped to this 'if'
    var status = "processing"; // Leaks out of 'if' into processItems() function scope!
  }

  console.log(status); // "processing" (var leaked!)
  // console.log(batchId); // ReferenceError: batchId is not defined (Protected!)
}
```

### 6.4 Why eval and with Degrade Engine Optimizations

The `with` statement and non-strict `eval()` dynamically alter the scope chain at runtime:

```javascript
function deoptimize(obj) {
  with (obj) {
    console.log(a); // Is 'a' a property of obj, or a local variable, or a global variable?
  }
}
```

Because the engine cannot know ahead of time what properties `obj` contains, TurboFan **cannot inline variable lookups into fixed stack offsets**. The entire function drops back into slow runtime dictionary lookups.

---

## 7. The this Binding Architecture

### 7.1 The Four Rules of this Resolution

Unlike lexical scope (which is author-time static), `this` is **runtime-bound based on the call site (how the function is called)**:

| Rule | Call Syntax | `this` Value in Non-Strict | `this` Value in `"use strict";` |
| :--- | :--- | :--- | :--- |
| **1. Default Binding** | `foo()` standalone | `window` / `global` | `undefined` |
| **2. Implicit Binding** | `obj.foo()` | `obj` (the context object) | `obj` |
| **3. Explicit Binding** | `foo.call(ctx)`, `apply`, `bind` | `ctx` (coerced to object) | `ctx` (primitive preserved) |
| **4. `new` Binding** | `new Foo()` | Brand new allocated object | Brand new allocated object |

```javascript
"use strict";

function showThis() {
  console.log(this);
}

// 1. Default Binding
showThis(); // undefined (in strict mode)

// 2. Implicit Binding
const account = {
  id: 101,
  getThis: showThis
};
account.getThis(); // account { id: 101, getThis: [Function] }

// Lost Implicit Binding Trap (Junior Pitfall)
const detached = account.getThis;
detached(); // undefined! (Call site is standalone!)
```

### 7.2 Explicit Binding: call, apply, and bind

- `call(thisArg, arg1, arg2, ...)`: Invokes immediately with arguments provided individually.
- `apply(thisArg, [arg1, arg2, ...])`: Invokes immediately with arguments provided as an array or array-like tuple.
- `bind(thisArg, arg1, ...)`: Returns a new **hard-bound function** with `this` permanently locked.

```javascript
const service = { name: "BillingService" };

function logMessage(level, message) {
  console.log(`[${this.name}] [${level}]: ${message}`);
}

logMessage.call(service, "INFO", "Server started"); // [BillingService] [INFO]: Server started
logMessage.apply(service, ["WARN", "High memory"]); // [BillingService] [WARN]: High memory

const boundLogger = logMessage.bind(service, "ERROR");
boundLogger("Database disconnected"); // [BillingService] [ERROR]: Database disconnected
```

### 7.3 Arrow Functions and Lexical this

Arrow functions **do not have their own `this` binding**. 

In the ECMAScript specification, arrow functions have an internal flag `[[ThisMode]]: lexical`. They resolve `this` exactly like a regular variable—by looking up the `[[OuterEnv]]` chain:

```javascript
const dashboard = {
  name: "Analytics",
  metrics: [10, 20, 30],
  
  // Standard function has its own 'this' (bound to dashboard)
  loadMetrics: function() {
    // Arrow function captures 'this' from loadMetrics lexically:
    return this.metrics.map((val) => `${this.name}: ${val}`);
  }
};

console.log(dashboard.loadMetrics()); // ["Analytics: 10", "Analytics: 20", "Analytics: 30"]
```

> [!WARNING]
> Never use arrow functions as object methods if you need `this` to point to the object. The arrow function will capture the outer module/global `this` instead.

### 7.4 Strict Mode Impacts on this

In non-strict mode, if you pass `null` or `undefined` to `call()`, `apply()`, or `bind()`, the engine automatically replaces it with the global object (`window` or `global`), and primitive numbers/strings are wrapped in objects (`new Number(5)`). 

In `"use strict";`, primitives and `null`/`undefined` are passed through untouched.

---

## 8. V8 Garbage Collection & Memory Management

### 8.1 The Generational Hypothesis

The V8 Garbage Collector is designed around the empirical observation known as the **Generational Hypothesis**:

> **The Generational Hypothesis**: Most objects die very young (over 80% are deallocated shortly after creation, e.g. temporary loop variables, function return payloads, intermediate string concatenations).

Based on this law, V8 divides the Memory Heap into two major spaces:
1. **Young Generation (New Space)**: Fast allocation, frequent small collections.
2. **Old Generation (Old Space)**: Long-lived objects, infrequent large collections.

### 8.2 V8 Heap Memory Spaces Layout

```text
┌────────────────────────────────────────────────────────────────────────┐
│                          V8 HEAP MEMORY SPACES                         │
├────────────────────────────────────────────────────────────────────────┤
│ 1. New Space (Young Generation: 1MB to 64MB)                           │
│    ├── Semi-space: "From Space" (Active allocation pool)               │
│    └── Semi-space: "To Space"   (Survivor destination during Scavenge) │
│                                                                        │
│ 2. Old Space (Old Generation: 1.4GB+)                                  │
│    ├── Old Pointer Space (Objects containing references to others)     │
│    └── Old Data Space    (Raw payloads: strings, floats, byte arrays)  │
│                                                                        │
│ 3. Large Object Space                                                  │
│    └── Objects exceeding single-page allocation size (Never moved)     │
│                                                                        │
│ 4. Code Space (JIT-compiled machine code instructions)                 │
│ 5. Map Space  (Hidden classes and shape descriptors)                   │
└────────────────────────────────────────────────────────────────────────┘
```

### 8.3 Minor GC: Scavenge Cheney Copying Algorithm

The **Young Generation** uses **Cheney's Copying Algorithm (Scavenger)**:

1. New objects are allocated sequentially in the active **"From" semi-space**.
2. When "From" space fills up, Minor GC triggers a stop-the-world pause (typically < 1ms).
3. The GC starts from root references (stack pointers, global variables) and copies all live (reachable) objects into the contiguous **"To" semi-space**.
4. Dead objects are left behind. The memory for "From" space is cleared in bulk simply by swapping the roles of "From" and "To".

#### Promotion to Old Space:
An object is **promoted (evacuated)** from New Space to Old Space if:
1. It has already survived one Scavenge cycle; OR
2. The "To" semi-space exceeds **25% capacity** during evacuation (to prevent memory exhaustion).

### 8.4 Major GC: Mark-Sweep-Compact & Idle-Time Compaction

When the **Old Space** reaches dynamically calculated exhaustion thresholds, V8 initiates a **Major GC (Mark-Sweep-Compact)**:

1. **Marking (Tri-color algorithm)**:
   - *White*: Unvisited object (candidate for collection).
   - *Grey*: Visited, but its referenced children have not been checked yet.
   - *Black*: Visited and all children scanned.
   - V8 uses **Incremental Marking** (interleaving small 1ms marking slices with JS execution) and **Concurrent Marking** on worker threads to eliminate long pauses.
2. **Sweeping**: Traverses memory pages and records addresses of white (dead) objects in "free lists".
3. **Compacting**: Slides surviving objects together to defragment memory pages, updating all pointer references.

### 8.5 Write Barriers & The Remembered Set

If an object in the Old Space points to a newly allocated object in the Young Space:

```text
[ Old Space Object ] ───────pointer──────► [ New Space Object ]
```

When Minor GC runs, it must not mistakenly collect the New Space object! 

Scanning the entire 1.4GB Old Space during a 1ms minor collection would defeat the purpose. V8 solves this using **Write Barriers**: whenever a pointer write (`obj.ref = newObj`) occurs, V8 records the reference in a table called the **Remembered Set (Store Buffer)**. The Scavenger only scans the Remembered Set instead of the entire Old Heap!

---

## 9. Production Memory Leaks & Heap Diagnostics

### 9.1 Accidental Globals & Uncleared Timers

In non-strict mode, assigning to an undeclared variable creates a root reference on the global object that is never collected:

```javascript
function trackRequest(req) {
  // Missing 'let' or 'const': attached permanently to global / window!
  cachedPayload = { data: req.body, timestamp: Date.now() };
}
```

Similarly, `setInterval` callbacks retain references to all variables in their lexical scope as long as the interval is running:

```javascript
function startHeartbeat() {
  const hugeBuffer = Buffer.alloc(10 * 1024 * 1024); // 10MB
  
  // Leaks 10MB permanently if clearInterval() is never called!
  setInterval(() => {
    console.log(`Heartbeat at ${Date.now()}`);
  }, 1000);
}
```

### 9.2 Retained Closures & Hidden Retainers

A notorious V8 memory leak occurs when multiple closures share the same parent Lexical Environment:

```javascript
let leakRunner = null;

function produceLeak() {
  const hugePayload = new Array(1000000).fill("payload_chunk");
  const previousRunner = leakRunner;

  // Closure 1: Retains hugePayload
  function unused() {
    if (previousRunner) console.log(hugePayload.length);
  }

  // Closure 2: Does not explicitly use hugePayload, BUT shares the same Lexical Environment!
  leakRunner = function() {
    if (previousRunner) console.log("tick");
  };
}

// Every invocation chains a new un-collectible 1MB array to 'leakRunner'!
setInterval(produceLeak, 100);
```

### 9.3 Detached DOM Trees in Node/SSR and Browsers

A **Detached DOM Tree** occurs when a DOM node is removed from the document tree, but a JavaScript variable or event listener still retains a memory reference to it. The browser cannot free the node or any of its children.

In Node.js Server-Side Rendering (SSR) with tools like JSDOM or Cheerio, storing parsed HTML elements in global caches produces severe memory leaks.

### 9.4 Profiling Memory Leaks with Node.js inspect & Chrome DevTools

#### Step 1: Start Node with the Inspector Enabled
```bash
node --inspect index.js
```

#### Step 2: Connect via Chrome
1. Open Google Chrome and navigate to `chrome://inspect`.
2. Click **Open dedicated DevTools for Node**.
3. Go to the **Memory** tab.

#### Step 3: Take Three Heap Snapshots (The 3-Snapshot Technique)
1. **Snapshot 1**: Baseline before workload.
2. **Snapshot 2**: Under heavy workload.
3. **Snapshot 3**: After workload completes and Garbage Collection is forced.
4. Select **Snapshot 3**, switch the view dropdown from **Summary** to **Comparison**, and select **Snapshot 1**.
5. Sort by **# Delta** or **Size Delta**. Any objects with a positive Delta that should have been collected indicate your exact memory leak retainers!

---

## 10. Senior Production DOs and DON'Ts Matrix

| Rule # | DO | DON'T | Architectural Rationale |
| :---: | :--- | :--- | :--- |
| **01** | **DO** use `const` by default, and `let` only for explicit reassignments. | **DON'T** use `var` in modern production code. | `var` lacks block scoping, creates accidental globals, and causes silent hoisting bugs. |
| **02** | **DO** always enable `"use strict";` or use ES Modules (`type: "module"`). | **DON'T** write code in sloppy mode. | Sloppy mode masks silent errors, leaks global variables, and forces dynamic `this`. |
| **03** | **DO** use `structuredClone()` for deep object replication. | **DON'T** use shallow spread `{ ...obj }` when deep cloning is required. | Shallow copies duplicate pointers; mutating nested properties corrupts the original state. |
| **04** | **DO** initialize object properties in identical order in constructors. | **DON'T** dynamically add properties in arbitrary order across instances. | Different property insertion orders trigger V8 shape divergence, de-optimizing monomorphic ICs. |
| **05** | **DO** assign `null` or `undefined` to clear a property. | **DON'T** use the `delete` operator on objects in performance-critical code. | `delete` forces V8 to drop the object into slow dictionary mode, discarding hidden classes. |
| **06** | **DO** convert deep recursive directory walkers to iterative loops. | **DON'T** rely on raw unbounded recursion for arbitrary folder depths. | Recursion blows the fixed ~10,000-frame Call Stack limit (`Maximum call stack size exceeded`). |
| **07** | **DO** explicitly remove event listeners and clear intervals on teardown. | **DON'T** assume unreferenced DOM listeners or intervals are collected. | Active timers and listeners retain closures indefinitely, causing steady heap growth. |
| **08** | **DO** use `WeakMap` or `WeakSet` for object-keyed metadata caches. | **DON'T** use standard `Map` for caching object references without eviction. | Standard `Map` keys are strong references that prevent GC collection even after original objects die. |
| **09** | **DO** use Arrow functions for inline callbacks that need lexical `this`. | **DON'T** use Arrow functions as prototype methods or object methods. | Arrow functions have no own `this`; they bind to the outer lexical context, breaking method dispatch. |
| **10** | **DO** use `queueMicrotask()` when deferring work before DOM paint. | **DON'T** invoke `process.nextTick()` recursively without micro-yielding. | Recursive `nextTick()` completely starves the libuv event loop from processing I/O and timers. |
| **11** | **DO** audit circular dependencies in bundled code. | **DON'T** rely on undefined behavior during module initialization cycles. | Circular ES module imports cause variables to be read inside their TDZ, throwing `ReferenceError`. |
| **12** | **DO** allocate large fixed-size buffers using `Buffer.allocUnsafe` carefully. | **DON'T** store gigabytes of binary chunks in standard JavaScript arrays. | Arrays allocate dynamic heap objects; native Buffers allocate in external C++ memory slabs. |
| **13** | **DO** take Heap Snapshots using `node --inspect` to verify GC cleanup. | **DON'T** rely on guess-and-check restarts (`pm2 restart`) to hide memory leaks. | Leaks inevitably crash pods under high concurrent load or during traffic spikes. |
| **14** | **DO** nullify references to large payload buffers after processing. | **DON'T** keep global arrays accumulating raw payloads. | Nullifying clears the heap pointer, allowing the Minor GC Scavenger to reclaim memory early. |
| **15** | **DO** use `Object.freeze()` in dev/test assertions to enforce immutability. | **DON'T** assume `const` provides runtime immutability. | `const` only locks the stack pointer address; the heap object payload remains completely mutable. |

---

## 11. Senior Engineering Interview Questions & Proofs

### Q1: Does JavaScript allocate primitive numbers on the Stack or the Heap?
**Senior Answer**: 
It depends on the number's value and the engine's pointer tagging implementation. In V8 on 64-bit systems, 31-bit or 32-bit signed integers are **Smi (Small Integers)**. They are stored directly inside the 64-bit variable pointer container on the Call Stack by setting the lowest tag bit to `0`, requiring **zero heap allocation**. Floating point numbers (doubles), large integers outside the Smi range, and `BigInt` are allocated on the **Memory Heap** as `HeapNumber` or `BigInt` objects.

### Q2: What is the exact difference between the Creation Phase and Execution Phase?
**Senior Answer**: 
During the Creation Phase, the engine scans the code, sets up the `LexicalEnvironment` and `VariableEnvironment`, determines `this`, and links `[[OuterEnv]]`. Function declarations are fully stored in memory with their bodies; `var` variables are allocated and initialized to `undefined`; `let` and `const` variables are registered in an uninitialized state (entering the TDZ). In the Execution Phase, the engine evaluates code line-by-line, performs variable assignments, runs mathematical operations, and pushes/pops stack frames for function invocations.

### Q3: Why does `console.log(a)` throw a `ReferenceError` when `let a = 5` is declared later, but `var a = 5` logs `undefined`?
**Senior Answer**: 
Both declarations are hoisted during Phase 1. However, the ECMAScript specification dictates that `var` bindings are immediately initialized with the value `undefined` upon creation. In contrast, `let` and `const` declarations remain uninitialized in the **Temporal Dead Zone (TDZ)**. Any read or write access to an uninitialized binding throws an uncatchable early `ReferenceError` per ECMAScript specification section 14.3.1.

### Q4: How does V8 optimize property access using Hidden Classes and Inline Caching?
**Senior Answer**: 
Because JavaScript is dynamically typed, objects do not have fixed C-like struct layouts. V8 creates hidden classes (**Maps/Shapes**) behind the scenes that record property names and their physical memory offsets. When a function accesses `obj.x`, V8 uses an **Inline Cache (IC)** to store the shape of the object and the memory offset of `x`. If subsequent calls pass objects with the identical hidden class, access is **monomorphic** (a single machine instruction offset lookup). If properties are added in different orders or deleted, shape divergence turns the access **polymorphic** or **megamorphic**, forcing slow hash-table lookups.

### Q5: How does Node.js prevent top-level variables from polluting the global scope?
**Senior Answer**: 
Node.js wraps every CommonJS module file inside an invisible outer wrapper function: `(function(exports, require, module, __filename, __dirname) { ... })`. Any `var` or `function` declared at the top of the file becomes a local variable within that wrapper function's Execution Context. In browsers without ES modules, top-level scripts run directly in the Global Execution Context, causing top-level `var` to attach to `window`.

---

## 12. Active Engineering Challenges

### Challenge 1: The Trampoline Stack Overflow Runner

#### Problem Statement:
Deep recursive algorithms in JavaScript crash with `RangeError: Maximum call stack size exceeded` when depth exceeds ~10,000 frames. Implement a generic `trampoline(fn)` runner that converts recursive tail-calls into iterative loops, allowing 1,000,000 recursive cycles with $O(1)$ Call Stack memory overhead.

#### Starter Code & Verification Suite (`test-challenge-1.js`):
```javascript
const assert = require("node:assert/strict");

/**
 * Generic Trampoline Runner
 * @param {Function} fn 
 * @returns {Function}
 */
function trampoline(fn) {
  return function (...args) {
    let result = fn(...args);
    // While the function returns another thunk (function), keep calling iteratively!
    while (typeof result === "function") {
      result = result();
    }
    return result;
  };
}

// Tail-recursive factorial that returns a thunk
function recursiveSum(n, acc = 0) {
  if (n <= 0) return acc;
  return () => recursiveSum(n - 1, acc + n);
}

// Verification:
const safeSum = trampoline(recursiveSum);

console.log("Testing 100,000 recursive frames without Stack Overflow...");
const result = safeSum(100000);
assert.equal(result, 5000050000, "Trampoline calculation mismatch!");

console.log("Testing 500,000 recursive frames...");
const largeResult = safeSum(500000);
assert.equal(largeResult, 125000250000, "Large trampoline calculation mismatch!");

console.log("✅ Challenge 1 Passed: 500,000 iterations executed with O(1) Stack Frames!");
```

---

### Challenge 2: Deep Immutable Metadata Cloner with Prototype Guard

#### Problem Statement:
Write a production-grade function `createSafeSnapshot(source, overrides)`:
1. Performs a complete deep copy of `source`.
2. Protects against **Prototype Pollution**: if `overrides` contains `__proto__`, `constructor`, or `prototype` keys, it must throw an `Error("Prototype pollution attempt detected")`.
3. If `overrides` attempts to modify a protected `id` field, throw `Error("Cannot mutate immutable identifier")`.
4. Mutating nested properties on the returned snapshot must never mutate `source`.

#### Starter Code & Verification Suite (`test-challenge-2.js`):
```javascript
const assert = require("node:assert/strict");

function createSafeSnapshot(source, overrides = {}) {
  // 1. Prototype pollution guard
  const dangerousKeys = ["__proto__", "constructor", "prototype"];
  for (const key of dangerousKeys) {
    if (Object.prototype.hasOwnProperty.call(overrides, key)) {
      throw new Error("Prototype pollution attempt detected");
    }
  }

  // 2. Identifier immutability guard
  if ("id" in overrides && overrides.id !== source.id) {
    throw new Error("Cannot mutate immutable identifier");
  }

  // 3. Deep cloning
  const snapshot = structuredClone(source);

  // 4. Merge overrides safely
  return Object.assign(snapshot, overrides);
}

// Verification Suite:
const original = {
  id: "doc-9901",
  title: "V8 Internals",
  metadata: {
    author: "Ayush",
    tags: ["v8", "memory", "engine"]
  }
};

// Test 1: Immutability of source
const clone = createSafeSnapshot(original, { title: "V8 Internals Final" });
clone.metadata.tags.push("verified");

assert.equal(original.metadata.tags.length, 3, "Original tags array was polluted!");
assert.equal(clone.metadata.tags.length, 4, "Clone was not updated!");
assert.equal(clone.title, "V8 Internals Final");
assert.equal(original.title, "V8 Internals");

// Test 2: Protected ID
assert.throws(
  () => createSafeSnapshot(original, { id: "doc-0000" }),
  /Cannot mutate immutable identifier/
);

// Test 3: Prototype Pollution Defense
assert.throws(
  () => createSafeSnapshot(original, JSON.parse('{"__proto__": {"admin": true}}')),
  /Prototype pollution attempt detected/
);

console.log("✅ Challenge 2 Passed: Deep Cloner with Prototype Guard fully verified!");
```

---

### Challenge 3: Closure Memory Leak Detector with FinalizationRegistry

#### Problem Statement:
Write a memory diagnostic utility using ES2021 `FinalizationRegistry` and `WeakRef` to prove whether an object was successfully collected by V8 Garbage Collection or retained by an uncleared closure.

#### Starter Code & Verification Suite (`test-challenge-3.js`):
```javascript
// Run with: node --expose-gc test-challenge-3.js
const assert = require("node:assert/strict");

let wasCleanedUp = false;

const registry = new FinalizationRegistry((heldValue) => {
  console.log(`[GC]: Object "${heldValue}" has been collected by V8.`);
  wasCleanedUp = true;
});

function allocateTemporaryPayload() {
  let tempObject = { data: new Array(100000).fill("payload") };
  
  // Register object with FinalizationRegistry
  registry.register(tempObject, "TemporaryPayload");
  
  // Return a closure that does NOT retain tempObject
  return function getTimestamp() {
    return Date.now();
  };
}

const safeCallback = allocateTemporaryPayload();

// Verify that forcing Garbage Collection collects the object
if (typeof global.gc === "function") {
  global.gc();
  setTimeout(() => {
    assert.equal(wasCleanedUp, true, "Memory leak: Object was not reclaimed by GC!");
    console.log("✅ Challenge 3 Passed: Zero-leak closure verified by FinalizationRegistry!");
  }, 100);
} else {
  console.log("Run with 'node --expose-gc test-challenge-3.js' to trigger forced GC test.");
}
```
