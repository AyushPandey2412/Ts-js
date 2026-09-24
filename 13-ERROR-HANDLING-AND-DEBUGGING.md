# MODULE 13 — ERROR HANDLING, CALL STACK RECONSTRUCTION & DEBUGGING
## The Exhaustive Engineering Guide from V8 Stack Trace Unwinding to try/catch/finally Mechanics, Custom Error Hierarchies, and Centralized Fault Tolerance

---

## TABLE OF CONTENTS
- [00. How to Use This Module & Conceptual Mind Map](#00-how-to-use-this-module--conceptual-mind-map)
- [01. The Genesis: Why Error Handling Matters](#01-the-genesis-why-error-handling-matters)
  - [1.1 Fail-Fast Philosophy vs. Graceful Degradation](#11-fail-fast-philosophy-vs-graceful-degradation)
  - [1.2 The Cost of Silent Failures in Distributed Architectures](#12-the-cost-of-silent-failures-in-distributed-architectures)
- [02. The Anatomy of JavaScript Errors](#02-the-anatomy-of-javascript-errors)
  - [2.1 The Base `Error` Object Protocol (`name`, `message`, `stack`, `cause`)](#21-the-base-error-object-protocol-name-message-stack-cause)
  - [2.2 The 7 Built-In ECMAScript Error Archetypes](#22-the-7-built-in-ecmascript-error-archetypes)
  - [2.3 V8 Call Stack Generation & `Error.captureStackTrace`](#23-v8-call-stack-generation--errorcapturestacktrace)
  - [2.4 Stack Trace Limits & Source Map Reconstruction](#24-stack-trace-limits--source-map-reconstruction)
- [03. Control Flow: `try / catch / finally` Deep Dive](#03-control-flow-try--catch--finally-deep-dive)
  - [3.1 Synchronous Stack Unwinding & Scope Cleanliness](#31-synchronous-stack-unwinding--scope-cleanliness)
  - [3.2 The `finally` Execution Invariant & The Return Override Trap](#32-the-finally-execution-invariant--the-return-override-trap)
  - [3.3 Optional Catch Binding (ES2019)](#33-optional-catch-binding-es2019)
  - [3.4 Error Rethrowing & Context Enrichment](#34-error-rethrowing--context-enrichment)
- [04. Asynchronous Error Propagation & Boundary Management](#04-asynchronous-error-propagation--boundary-management)
  - [4.1 Why `try / catch` Misses Asynchronous Callbacks](#41-why-try--catch-misses-asynchronous-callbacks)
  - [4.2 Promise Rejection Chains & `unhandledRejection` Events](#42-promise-rejection-chains--unhandledrejection-events)
  - [4.3 `async / await` Error Handling Mechanics](#43-async--await-error-handling-mechanics)
  - [4.4 Node.js EventEmitter Error Protocols (Crashing on Unhandled 'error')](#44-nodejs-eventemitter-error-protocols-crashing-on-unhandled-error)
  - [4.5 Process-Level Handlers: `uncaughtException` vs. `unhandledRejection`](#45-process-level-handlers-uncaughtexception-vs-unhandledrejection)
- [05. Enterprise Custom Error Hierarchies](#05-enterprise-custom-error-hierarchies)
  - [5.1 Subclassing `Error` Correctly with Prototype Repair](#51-subclassing-error-correctly-with-prototype-repair)
  - [5.2 Error Causality Chaining with `{ cause }` (ES2022)](#52-error-causality-chaining-with--cause--es2022)
  - [5.3 Domain Error Partitioning (Validation, Auth, Network, Database)](#53-domain-error-partitioning-validation-auth-network-database)
- [06. Production Architectural Anti-Patterns](#06-production-architectural-anti-patterns)
  - [Anti-Pattern 1: The Silent Swallowed Exception](#anti-pattern-1-the-silent-swallowed-exception)
  - [Anti-Pattern 2: Throwing Non-Error Primitives (`throw "string"`)](#anti-pattern-2-throwing-non-error-primitives-throw-string)
  - [Anti-Pattern 3: Resuming State After `uncaughtException`](#anti-pattern-3-resuming-state-after-uncaughtexception)
- [07. Architectural Decision Matrix: When to Use What](#07-architectural-decision-matrix-when-to-use-what)
- [08. Spec-Compliant Reference Algorithms & Polyfills](#08-spec-compliant-reference-algorithms--polyfills)
  - [Algorithm 1: Industrial Base `ApplicationError` Hierarchy with Cause Chaining](#algorithm-1-industrial-base-applicationerror-hierarchy-with-cause-chaining)
  - [Algorithm 2: Go-Style Safe Async Tuple Wrapper (`to(promise)`)](#algorithm-2-go-style-safe-async-tuple-wrapper-topromise)
  - [Algorithm 3: Centralized Express / Fastify Error Middleware Dispatcher](#algorithm-3-centralized-express--fastify-error-middleware-dispatcher)
  - [Algorithm 4: V8 Call Stack PII Sanitizer & Formatter](#algorithm-4-v8-call-stack-pii-sanitizer--formatter)
- [09. 90 Comprehensive Interview Questions & Detailed Answers](#09-90-comprehensive-interview-questions--detailed-answers)
  - [09.1 Beginner Tier (Questions 1 to 20)](#091-beginner-tier-questions-1-to-20)
  - [09.2 Intermediate Tier (Questions 21 to 45)](#092-intermediate-tier-questions-21-to-45)
  - [09.3 Advanced Tier (Questions 46 to 70)](#093-advanced-tier-questions-46-to-70)
  - [09.4 Senior & Staff Tier (Questions 71 to 90)](#094-senior--staff-tier-questions-71-to-90)
- [10. 15 Tricky Output Prediction Puzzles with Execution Traces](#10-15-tricky-output-prediction-puzzles-with-execution-traces)
- [11. 4 Progressive Real-World Projects](#11-4-progressive-real-world-projects)
  - [Project 1: Enterprise Centralized Error Dispatcher & Telemetry Hub](#project-1-enterprise-centralized-error-dispatcher--telemetry-hub)
  - [Project 2: Resilient Circuit Breaker with Error Fallback Pipelines](#project-2-resilient-circuit-breaker-with-error-fallback-pipelines)
  - [Project 3: Production Graceful Shutdown & Unhandled Exception Manager](#project-3-production-graceful-shutdown--unhandled-exception-manager)
  - [Project 4: Go-Style Result/Either Monad Functional Error Handler](#project-4-go-style-resulteither-monad-functional-error-handler)
- [12. Production Best Practices: DOs and DON'Ts Matrix](#12-production-best-practices-dos-and-donts-matrix)
- [13. Real-World Case Study: The Silent Swallowed Exception Outage](#13-real-world-case-study-the-silent-swallowed-exception-outage)
- [14. 75 Practice Exercises Across 4 Tiers](#14-75-practice-exercises-across-4-tiers)
- [15. Module Summary & Key Invariants](#15-module-summary--key-invariants)

---

## 00. HOW TO USE THIS MODULE & CONCEPTUAL MIND MAP

### 🧠 The Core Architectural Invariant
> **The Fault-Tolerance Invariant**: An error in JavaScript is an extraordinary control-flow event representing an unrecoverable or exceptional state. Unhandled errors unwind the active execution stack frame-by-frame. Proper architecture enforces strict fault boundaries: validate at the perimeter, throw standard Error objects with causal chains, isolate blast radiuses, and fail fast while guaranteeing safe resource cleanup via `finally` and deterministic shutdown hooks.

```text
┌─────────────────────────────────────────────────────────────────────────────┐
│                       V8 CALL STACK UNWINDING LIFECYCLE                     │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│   [Frame 3: calculateTotal()]  ──▶ throw new ValidationError("Bad SKU")    │
│            │ (Unwinds stack frame, skips remaining statements)              │
│            ▼                                                                │
│   [Frame 2: processCheckout()] ──▶ (No catch block: unwinds frame)          │
│            │                                                                │
│            ▼                                                                │
│   [Frame 1: routeHandler()]    ──▶ catches Error in try/catch boundary      │
│            │                                                                │
│            ▼                                                                │
│   [Centralized Error Dispatcher] ──▶ Logs with cause, maps HTTP 400 response│
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 01. THE GENESIS: WHY ERROR HANDLING MATTERS

### 1.1 Fail-Fast Philosophy vs. Graceful Degradation
Early web scripting prioritized "keep running at all costs," which led to silent failures where invalid data propagated through systems, corrupting databases and creating hard-to-trace bugs. In enterprise software:
- **Fail-Fast**: Stop execution immediately upon encountering an unexpected condition or broken invariant to prevent corrupted state from persisting.
- **Graceful Degradation**: Isolate component failures so that a broken recommendation service does not crash the entire e-commerce checkout pipeline.

### 1.2 The Cost of Silent Failures in Distributed Architectures
When microservices fail silently (e.g. returning `null` or empty objects on critical network failures), upstream dependencies make false assumptions, causing compounding failures, cascading timeouts, and delayed incident detection.

---

## 02. THE ANATOMY OF JAVASCRIPT ERRORS

### 2.1 The Base `Error` Object Protocol
Every error in JavaScript is an instance of `Error`. The standard protocol exposes:
- **`name`**: A string denoting the error type (defaults to `"Error"`).
- **`message`**: A human-readable description of the error.
- **`stack`**: A non-standard but universally supported string containing the message followed by the execution call stack trace.
- **`cause`**: (ES2022) An arbitrary value or original Error that caused this error to occur.

```javascript
const err = new Error("Connection failed", { cause: new Error("DNS resolution timeout") });
console.log(err.name); // "Error"
console.log(err.message); // "Connection failed"
console.log(err.cause.message); // "DNS resolution timeout"
```

### 2.2 The 7 Built-In ECMAScript Error Archetypes
JavaScript specifies 7 built-in error constructors representing core engine and runtime faults:

| Built-In Error | Trigger Condition | Code Example |
|:---|:---|:---|
| **`TypeError`** | Value is not of the expected type or invalid operation | `null.f()` or assigning to read-only property |
| **`ReferenceError`** | Accessing an undeclared identifier or TDZ variable | Accessing variable before `let`/`const` declaration |
| **`SyntaxError`** | Parsing code that violates JavaScript grammar | `eval("foo bar")` or invalid JSON |
| **`RangeError`** | Number outside acceptable boundary or invalid array length | `new Array(-1)` or maximum call stack exceeded |
| **`URIError`** | Malformed URI passed to `decodeURI` or `encodeURI` | `decodeURIComponent("%")` |
| **`EvalError`** | Legacy: historical misuse of the global `eval()` function | Rare in modern engines (retained for backward compatibility) |
| **`AggregateError`** | Multiple errors wrapped in a single object (e.g. `Promise.any`) | `Promise.any([p1, p2])` when all reject |

```javascript
// Example: AggregateError when Promise.any fails completely:
Promise.any([
  Promise.reject(new Error("Database offline")),
  Promise.reject(new Error("Cache timeout"))
]).catch((err) => {
  console.assert(err instanceof AggregateError);
  console.assert(err.errors.length === 2);
  console.log(err.errors.map(e => e.message).join(" | "));
});
```

### 2.3 V8 Call Stack Generation & `Error.captureStackTrace`
In Google's V8 engine (Node.js and Chromium browsers), call stacks are generated lazily when the `.stack` property is first read:
- **`Error.captureStackTrace(targetObject, [constructorOpt])`**: Appends a `.stack` property to `targetObject`. If `constructorOpt` is provided, all frames above and including that function are omitted from the stack trace, keeping internal library implementation frames out of user-facing stack traces.

```javascript
class DatabaseError extends Error {
  constructor(message) {
    super(message);
    this.name = "DatabaseError";
    // Omit DatabaseError constructor frame from the stack trace:
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, DatabaseError);
    }
  }
}

const dbErr = new DatabaseError("Query timed out");
console.log(dbErr.stack.startsWith("DatabaseError: Query timed out")); // true
```

### 2.4 Stack Trace Limits & Source Map Reconstruction
- **`Error.stackTraceLimit`**: A numeric property on the `Error` constructor controlling how many stack frames V8 captures (default is usually 10). In production debugging or test runners, this can be increased:
```javascript
Error.stackTraceLimit = 50; // Capture up to 50 stack frames
```

---

## 03. CONTROL FLOW: `try / catch / finally` DEEP DIVE

### 3.1 Synchronous Stack Unwinding & Scope Cleanliness
When an exception is thrown inside a `try` block, the engine immediately halts forward execution of that block and begins unwinding the call stack until it finds an enclosing `catch` block:

```javascript
function step3() {
  throw new Error("Failure in step 3");
}
function step2() { step3(); }
function step1() { step2(); }

try {
  step1();
} catch (err) {
  console.log("Caught at top boundary:", err.message);
}
```

### 3.2 The `finally` Execution Invariant & The Return Override Trap
The `finally` block is **guaranteed to execute**, whether the `try` block completes normally, throws an error, or returns early.

> [!CAUTION]
> If a `finally` block explicitly returns a value or throws an error, it **completely overrides and silences** any return value or pending unhandled exception from the `try` or `catch` block!

```javascript
function dangerousReturn() {
  try {
    throw new Error("Critical Failure!");
  } finally {
    return "Everything is fine"; // SILENTLY SWALLOWS THE ERROR!
  }
}

console.log(dangerousReturn()); // Prints "Everything is fine", error is discarded!
```

### 3.3 Optional Catch Binding (ES2019)
ES2019 introduced optional catch binding, allowing you to omit the error parameter when the specific error object is not required:

```javascript
function isValidJSON(text) {
  try {
    JSON.parse(text);
    return true;
  } catch {
    // No '(unusedErr)' identifier allocated
    return false;
  }
}
```

### 3.4 Error Rethrowing & Context Enrichment
Catch blocks should only handle errors they know how to recover from. Unexpected errors must be rethrown, optionally enriching them with contextual metadata:

```javascript
try {
  processPayment(order);
} catch (err) {
  if (err instanceof TransientNetworkError) {
    retryPayment(order);
  } else {
    // Re-throw with causal enrichment:
    throw new PaymentProcessingError("Order checkout failed", { cause: err });
  }
}
```

---

## 04. ASYNCHRONOUS ERROR PROPAGATION & BOUNDARY MANAGEMENT

### 4.1 Why `try / catch` Misses Asynchronous Callbacks
A synchronous `try / catch` block can only catch errors thrown while the block is currently active on the Call Stack. Once an asynchronous operation is offloaded to the event loop, the `try / catch` frame has already popped off the stack!

```javascript
// THIS WILL CRASH THE PROCESS:
try {
  setTimeout(() => {
    throw new Error("Async Timer Error"); // Call stack has already unwound!
  }, 10);
} catch (err) {
  console.log("This will NEVER be reached!");
}
```

### 4.2 Promise Rejection Chains & `unhandledRejection` Events
Promises model asynchronous errors as rejections. Any error thrown inside a Promise executor or `.then()` handler transitions the Promise to the `rejected` state:

```javascript
Promise.resolve()
  .then(() => {
    throw new Error("Step 1 failed");
  })
  .then(() => {
    console.log("Step 2 skipped automatically");
  })
  .catch((err) => {
    console.log("Caught in promise chain:", err.message);
  });
```

In Node.js, failing to attach a `.catch()` handler emits an `unhandledRejection` event on the `process` object. By default, unhandled rejections terminate the Node.js process.

### 4.3 `async / await` Error Handling Mechanics
The `async / await` syntax bridges asynchronous promises into synchronous `try / catch` semantics. Rejected promises are un-wrapped into standard thrown exceptions:

```javascript
async function loadUserData(userId) {
  try {
    const user = await fetchUser(userId);
    return user;
  } catch (err) {
    console.error("Async error caught synchronously:", err.message);
    throw err;
  }
}
```

### 4.4 Node.js EventEmitter Error Protocols
In Node.js, instances of `EventEmitter` treat the special event name `"error"` with unique urgency:
- If an EventEmitter emits `"error"` and **no listener is registered**, Node.js throws the error uncaught, prints the stack trace, and crashes the process!

```javascript
const EventEmitter = require("node:events");
const stream = new EventEmitter();

// CRASH PREVENTION: Always attach an 'error' listener:
stream.on("error", (err) => {
  console.log("Handled stream error safely:", err.message);
});

stream.emit("error", new Error("Disk read failure"));
```

### 4.5 Process-Level Handlers: `uncaughtException` vs. `unhandledRejection`
When an error escapes all application boundaries:
- **`process.on('uncaughtException', (err) => { ... })`**: Triggered when a synchronous error reaches the top of the event loop without being caught.
- **Rule of Thumb**: The process is in an **unpredictable state**. Log the error, release active connections, and exit the process via `process.exit(1)`. Never attempt to resume normal execution!

```javascript
process.on("uncaughtException", (err) => {
  console.error("FATAL: Uncaught Exception:", err);
  // Perform emergency cleanup:
  server.close(() => {
    process.exit(1);
  });
  // Force exit after 3s if graceful cleanup hangs:
  setTimeout(() => process.exit(1), 3000).unref();
});
```

---

## 05. ENTERPRISE CUSTOM ERROR HIERARCHIES

### 5.1 Subclassing `Error` Correctly with Prototype Repair
When building custom error classes, proper inheritance requires:
1. Passing `message` and options (`{ cause }`) to `super(message, options)`.
2. Setting `this.name` to the class name.
3. Invoking `Error.captureStackTrace(this, this.constructor)` in V8 environments.

```javascript
class BaseAppError extends Error {
  constructor(message, options = {}) {
    super(message, options);
    this.name = this.constructor.name;
    this.timestamp = Date.now();
    this.isOperational = true; // Distinguishes operational errors from programming bugs

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}
```

### 5.2 Error Causality Chaining with `{ cause }` (ES2022)
Error causality chains allow low-level system errors (e.g. `ECONNREFUSED`) to be wrapped in high-level domain errors (e.g. `PaymentGatewayUnavailableError`) without losing original debugging telemetry:

```javascript
class PaymentError extends BaseAppError {}

try {
  // Low-level network operation
  throw new Error("Socket timeout on 10.0.0.1:443");
} catch (networkErr) {
  // Wrap into business domain error:
  throw new PaymentError("Unable to capture payment", { cause: networkErr });
}
```

### 5.3 Domain Error Partitioning
Partition application errors into clear functional domains:
- **`ValidationError`** (HTTP 400): Malformed input payload.
- **`AuthenticationError`** (HTTP 401): Missing or expired authentication token.
- **`AuthorizationError`** (HTTP 403): User lacks required permissions.
- **`NotFoundError`** (HTTP 404): Resource does not exist.
- **`ConflictError`** (HTTP 409): Concurrent modification collision.
- **`InternalSystemError`** (HTTP 500): Unexpected programming failure.

---

## 06. PRODUCTION ARCHITECTURAL ANTI-PATTERNS

### Anti-Pattern 1: The Silent Swallowed Exception (The "Pokemon" Handler)
Catching an exception without logging or re-throwing it turns critical software bugs into invisible system corruption:

```javascript
// ❌ CRITICAL ANTI-PATTERN: Swallowing errors silently
try {
  database.saveTransaction(transactionData);
} catch (e) {
  // Catching everything and doing nothing
}

// ✅ PRODUCTION PATTERN: Log, handle, or bubble up
try {
  database.saveTransaction(transactionData);
} catch (err) {
  logger.error("Transaction persistence failed", { 
    error: err.message, 
    stack: err.stack,
    transactionId: transactionData.id 
  });
  throw new DatabaseOperationError("Failed to persist transaction", { cause: err });
}
```

### Anti-Pattern 2: Throwing Non-Error Primitives (`throw "string"`)
Throwing primitive values like strings, numbers, or plain object literals breaks stack trace generation, error archetyping, and standard telemetry ingest pipelines:

```javascript
// ❌ ANTI-PATTERN: Throwing string or number
function validateAge(age) {
  if (age < 0) throw "Age cannot be negative"; // No stack trace, no error name!
}

// ✅ PRODUCTION PATTERN: Throw standard Error or Custom Subclass
function validateAge(age) {
  if (age < 0) {
    throw new RangeError("Age cannot be negative");
  }
}
```

### Anti-Pattern 3: Resuming State After `uncaughtException`
Handling `process.on('uncaughtException')` and continuing normal execution leaves the Node.js event loop and V8 heap in an indeterminate, corrupted state:

```javascript
// ❌ CRITICAL ANTI-PATTERN: Continuing execution after unhandled exception
process.on('uncaughtException', (err) => {
  console.log('Handled error, continuing happily:', err);
  // SERVER CONTINUES RUNNING IN CORRUPTED STATE!
  // Database connections may be half-open, locks never released, memory leaked!
});

// ✅ PRODUCTION PATTERN: Log immediately, close servers gracefully, and exit
process.on('uncaughtException', (err) => {
  console.error('FATAL UNCAUGHT EXCEPTION:', err);
  server.close(() => {
    process.exit(1); // Exit so process manager (Kubernetes / PM2 / systemd) can restart clean
  });
  // Fallback kill in 3s if hanging:
  setTimeout(() => process.exit(1), 3000).unref();
});
```

### Anti-Pattern 4: Catch-Log-and-Rethrow Duplicate Storm
Catching an error, logging it at every single layer of the architecture, and then re-throwing it pollutes observability dashboards with 10x duplicate log entries for a single failure:

```javascript
// ❌ ANTI-PATTERN: Logging at every level
async function repo() {
  try { await db.query(); } catch (err) { logger.error(err); throw err; }
}
async function service() {
  try { await repo(); } catch (err) { logger.error(err); throw err; }
}
async function controller() {
  try { await service(); } catch (err) { logger.error(err); throw err; }
}

// ✅ PRODUCTION PATTERN: Log only at the boundary (controller or centralized handler)
// Lower layers either handle and recover, or rethrow with cause.
```

---

## 07. ARCHITECTURAL DECISION MATRIX: WHEN TO USE WHAT

| Error Strategy | Primary Use Case | Performance Overhead | Observability | Developer Experience |
| :--- | :--- | :--- | :--- | :--- |
| **Standard `try / catch`** | Synchronous operations, JSON parsing, regex compilation | Low (optimized in modern V8) | High (V8 stack captured) | Standard JS idiom |
| **Promise `.catch()`** | Isolated async steps, promise composition pipelines | Very low | High (unhandledRejection tracking) | Functional chaining |
| **`async / await` + `try/catch`**| Sequential async orchestration (business workflows) | Low | High (async stack stitching) | Clean synchronous appearance |
| **Go-Style Tuple (`to(p)`)** | Eliminating deep nested try/catch pyramids | Minimal (allocates 2-element array) | High (passes original error object) | Explicit error-first control flow |
| **Result / Either Monad** | Functional domain modeling, mathematical pipelines | Low to Moderate (object wrappers) | Custom tracing | Explicit compile-time safety |
| **Centralized Middleware** | Web APIs (Express, Fastify, NestJS, Koa) | Negligible | Centralized JSON structured logs | Single point of failure truth |
| **Process Crash Handler** | Process lifecycle boundaries (`uncaughtException`) | Critical path only | Post-mortem forensic dump | Last line of defense |

---

## 08. SPEC-COMPLIANT REFERENCE ALGORITHMS & POLYFILLS

### Algorithm 1: Industrial Base `ApplicationError` Hierarchy with Cause Chaining
```javascript
class ApplicationError extends Error {
  /**
   * @param {string} message - Human-readable message
   * @param {object} [options]
   * @param {number} [options.statusCode=500] - HTTP status code
   * @param {string} [options.errorCode='INTERNAL_ERROR'] - Machine-readable error code
   * @param {boolean} [options.isOperational=true] - Whether safe to recover
   * @param {Error} [options.cause] - Root cause error
   * @param {Record<string, any>} [options.details={}] - Context metadata
   */
  constructor(message, options = {}) {
    super(message, { cause: options.cause });
    this.name = this.constructor.name;
    this.statusCode = options.statusCode || 500;
    this.errorCode = options.errorCode || 'INTERNAL_ERROR';
    this.isOperational = options.isOperational !== undefined ? options.isOperational : true;
    this.details = options.details || {};
    this.timestamp = new Date().toISOString();

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }

  toJSON() {
    return {
      error: {
        name: this.name,
        message: this.message,
        statusCode: this.statusCode,
        errorCode: this.errorCode,
        timestamp: this.timestamp,
        details: this.details,
        ...(this.cause ? { cause: this.cause.message } : {})
      }
    };
  }
}

class ValidationError extends ApplicationError {
  constructor(message, details = {}, options = {}) {
    super(message, { ...options, statusCode: 400, errorCode: 'VALIDATION_FAILED', details });
  }
}

class NotFoundError extends ApplicationError {
  constructor(resource, id) {
    super(`Resource '${resource}' with identifier '${id}' not found`, {
      statusCode: 404,
      errorCode: 'RESOURCE_NOT_FOUND',
      details: { resource, id }
    });
  }
}

class UnauthorizedError extends ApplicationError {
  constructor(message = 'Authentication required') {
    super(message, { statusCode: 401, errorCode: 'UNAUTHORIZED' });
  }
}
```

### Algorithm 2: Go-Style Safe Async Tuple Wrapper (`to(promise)`)
```javascript
/**
 * Resolves a promise and returns a [error, data] tuple.
 * @template T
 * @param {Promise<T>} promise
 * @param {Record<string, any>} [errorExt] - Additional metadata to assign to error
 * @returns {Promise<[Error, null] | [null, T]>}
 */
async function to(promise, errorExt) {
  try {
    const data = await promise;
    return [null, data];
  } catch (err) {
    if (errorExt && typeof err === 'object' && err !== null) {
      Object.assign(err, errorExt);
    }
    return [err, null];
  }
}

// Synchronous variant:
function safeSync(fn, ...args) {
  try {
    return [null, fn(...args)];
  } catch (err) {
    return [err, null];
  }
}
```

### Algorithm 3: Centralized Express / Fastify Error Middleware Dispatcher
```javascript
function createCentralizedErrorHandler(options = { isProduction: process.env.NODE_ENV === 'production' }) {
  return function centralizedErrorHandler(err, req, res, next) {
    const isOperational = err.isOperational || false;
    const statusCode = err.statusCode || 500;
    const errorCode = err.errorCode || 'INTERNAL_SERVER_ERROR';

    const logPayload = {
      correlationId: req.headers['x-correlation-id'] || 'N/A',
      path: req.originalUrl || req.url,
      method: req.method,
      statusCode,
      errorCode,
      message: err.message,
      stack: options.isProduction ? undefined : err.stack,
      cause: err.cause ? (err.cause.stack || err.cause.message) : undefined
    };

    if (statusCode >= 500) {
      console.error('[CRITICAL_SYSTEM_ERROR]', JSON.stringify(logPayload));
    } else {
      console.warn('[OPERATIONAL_CLIENT_ERROR]', JSON.stringify(logPayload));
    }

    if (res.headersSent) {
      return next(err);
    }

    res.status(statusCode).json({
      success: false,
      error: {
        code: errorCode,
        message: isOperational || !options.isProduction ? err.message : 'An internal server error occurred.',
        ...(options.isProduction ? {} : { stack: err.stack }),
        ...(err.details ? { details: err.details } : {})
      }
    });
  };
}
```

### Algorithm 4: V8 Call Stack PII Sanitizer & Formatter
```javascript
class StackSanitizer {
  static SENSITIVE_PATTERNS = [
    /bearer\s+[a-zA-Z0-9_\-\.]+/gi,
    /token=[a-zA-Z0-9_\-\.]+/gi,
    /password=[^&\s]+/gi,
    /secret=[^&\s]+/gi,
    /apiKey=[^&\s]+/gi
  ];

  /**
   * Cleans sensitive parameters and credentials from stack trace strings.
   * @param {string} stackText
   * @returns {string}
   */
  static sanitize(stackText) {
    if (!stackText || typeof stackText !== 'string') return '';
    let sanitized = stackText;
    for (const pattern of this.SENSITIVE_PATTERNS) {
      sanitized = sanitized.replace(pattern, '[REDACTED_SECRET]');
    }
    return sanitized;
  }

  /**
   * Parses raw V8 stack trace string into structured frame objects.
   * @param {string} stackText
   */
  static parseFrames(stackText) {
    const lines = stackText.split('\n').slice(1);
    const frameRegex = /^\s*at\s+(?:(.*?)\s+\((.*?):(\d+):(\d+)\)|(.*?):(\d+):(\d+))$/;

    return lines.map(line => {
      const match = line.match(frameRegex);
      if (!match) return { raw: line.trim() };
      return {
        functionName: match[1] || '<anonymous>',
        file: match[2] || match[5],
        lineNumber: parseInt(match[3] || match[6], 10),
        columnNumber: parseInt(match[4] || match[7], 10)
      };
    });
  }
}
```

---

## 09. 90 COMPREHENSIVE INTERVIEW QUESTIONS & DETAILED ANSWERS

### 09.1 Beginner Tier (Questions 1 to 20)
#### Q1: What is the base Error object in JavaScript, and what are its standard properties?
**Conceptual Explanation:**
In JavaScript, the base `Error` object is the standard constructor for runtime anomaly representations. The ECMAScript specification defines two primary standard properties: `name` (specifying the error type, default 'Error') and `message` (a human-readable string description). Non-standard but universally supported properties include `stack` (the call trace string) and ES2022's standardized `cause` (the underlying causal error).

**Executable Code Demonstration:**
```javascript
const err = new Error("Resource not found");
console.log("Error Name:", err.name); // 'Error'
console.log("Error Message:", err.message); // 'Resource not found'
console.log("Error Cause:", err.cause); // undefined
console.log("Has Stack Trace:", typeof err.stack === "string"); // true
```

#### Q2: What is the difference between an Error object and an Exception?
**Conceptual Explanation:**
An `Error` is a passive data object containing error state, a message, and a stack snapshot. An `Exception` is an active runtime condition triggered when an error (or any value) is thrown using the `throw` statement, interrupting standard sequential control flow and triggering stack unwinding.

**Executable Code Demonstration:**
```javascript
// Passive Error object (just data, does not halt execution):
const errObj = new Error("Validation warning");
console.log("Execution continues normally:", errObj.message);

// Active Exception (halts control flow immediately):
try {
  throw errObj; // Becomes an active exception here
  console.log("This line will never run");
} catch (caughtException) {
  console.log("Caught active exception:", caughtException.message);
}
```

#### Q3: How does the try...catch statement execute?
**Conceptual Explanation:**
The `try...catch` construct encloses a block of code to monitor. If any statement inside the `try` block throws an exception, the engine stops executing subsequent lines in that block, jumps immediately to the `catch` block, binds the thrown value to the catch parameter, and continues normal flow after the `catch` block.

**Executable Code Demonstration:**
```javascript
function parseInput(raw) {
  try {
    console.log("1. Entering try block");
    const parsed = JSON.parse(raw);
    console.log("2. Successfully parsed:", parsed);
    return parsed;
  } catch (err) {
    console.log("3. Caught error in catch block:", err.name);
    return null;
  }
}
parseInput("{ valid: true }"); // Runs 1, catches SyntaxError, runs 3
```

#### Q4: What happens if code inside a try block does not throw an error?
**Conceptual Explanation:**
If no error is thrown during the execution of a `try` block, the `catch` block is completely bypassed and skipped. If a `finally` block is present, it executes next, followed by normal control flow resuming immediately after the structure.

**Executable Code Demonstration:**
```javascript
let caught = false;
try {
  const x = 10 + 20;
  console.log("Try completed cleanly, result:", x);
} catch (err) {
  caught = true; // Never reached
}
console.log("Was catch invoked?", caught); // false
```

#### Q5: What is the finally block and when does it execute?
**Conceptual Explanation:**
The `finally` block defines cleanup logic that is guaranteed to run after `try` and `catch` complete, regardless of whether an exception occurred, whether it was handled, or whether an early `return` statement was executed inside `try` or `catch`.

**Executable Code Demonstration:**
```javascript
function fileReaderSimulation() {
  let fileHandleOpen = true;
  try {
    console.log("File opened");
    throw new Error("Disk read error");
  } catch (err) {
    console.log("Handling read error:", err.message);
    return "Error fallback data";
  } finally {
    fileHandleOpen = false;
    console.log("Finally: File handle closed successfully!");
  }
}
const result = fileReaderSimulation();
console.log("Result:", result);
```

#### Q6: Can you omit the catch block if you provide a finally block?
**Conceptual Explanation:**
Yes. A `try...finally` statement is syntactically valid in ECMAScript. If an exception occurs in `try`, the `finally` block executes first, and then the exception continues propagating up the call stack unless suppressed by a return in `finally`.

**Executable Code Demonstration:**
```javascript
function propagateWithCleanup() {
  try {
    console.log("Executing hazardous operation");
    throw new Error("Unhandled exception");
  } finally {
    console.log("Cleanup executed despite unhandled exception!");
  }
}

try {
  propagateWithCleanup();
} catch (err) {
  console.log("Caught propagated error at outer scope:", err.message);
}
```

#### Q7: What is Optional Catch Binding introduced in ES2019?
**Conceptual Explanation:**
Prior to ES2019, the `catch` clause strictly required an exception parameter binding like `catch (err)`. ES2019 allows omitting the binding syntax altogether (`catch { ... }`) when the developer does not need to inspect the thrown error object, avoiding unused variable warnings.

**Executable Code Demonstration:**
```javascript
function canParseInt(str) {
  try {
    if (isNaN(Number(str))) throw new Error();
    return true;
  } catch {
    // No error identifier declared
    return false;
  }
}
console.log("Is '123' valid?", canParseInt("123")); // true
console.log("Is 'abc' valid?", canParseInt("abc")); // false
```

#### Q8: What are the 7 core built-in ECMAScript error types?
**Conceptual Explanation:**
ECMAScript defines 7 native subclasses derived from `Error`: `EvalError`, `RangeError`, `ReferenceError`, `SyntaxError`, `TypeError`, `URIError`, and `AggregateError` (ES2021). Each represents a specific category of runtime or semantic failure.

**Executable Code Demonstration:**
```javascript
const errors = [
  new EvalError("Eval issue"),
  new RangeError("Index out of range"),
  new ReferenceError("Variable not defined"),
  new SyntaxError("Malformed syntax"),
  new TypeError("Incompatible type"),
  new URIError("Malformed URI sequence"),
  new AggregateError([], "Multiple errors")
];
errors.forEach(e => console.log(e.name, "instanceof Error:", e instanceof Error));
```

#### Q9: What causes a SyntaxError in JavaScript?
**Conceptual Explanation:**
A `SyntaxError` is thrown when the JavaScript engine parser encounters source code that violates the grammatical rules of the ECMAScript language (e.g. mismatched brackets, unexpected tokens, invalid variable names) or invalid JSON strings passed to `JSON.parse`.

**Executable Code Demonstration:**
```javascript
try {
  JSON.parse("{ bad json }");
} catch (err) {
  console.log("Error Name:", err.name); // 'SyntaxError'
  console.log("Is SyntaxError?", err instanceof SyntaxError); // true
}
```

#### Q10: What causes a ReferenceError in JavaScript?
**Conceptual Explanation:**
A `ReferenceError` occurs when code attempts to dereference an identifier that has not been declared in the current or any enclosing lexical scopes, or when accessing a `let`/`const` variable within its Temporal Dead Zone (TDZ).

**Executable Code Demonstration:**
```javascript
try {
  console.log(undeclaredIdentifier);
} catch (err) {
  console.log("Caught:", err.name); // 'ReferenceError'
  console.log("Message:", err.message);
}
```

#### Q11: What causes a TypeError in JavaScript?
**Conceptual Explanation:**
A `TypeError` occurs when an operation is performed on a value of an incompatible or unexpected type, such as invoking a non-function, mutating a frozen object, or accessing a property on `null` or `undefined`.

**Executable Code Demonstration:**
```javascript
try {
  const user = null;
  user.getAddress();
} catch (err) {
  console.log("Caught:", err.name); // 'TypeError'
  console.log("Is TypeError?", err instanceof TypeError); // true
}
```

#### Q12: What causes a RangeError in JavaScript?
**Conceptual Explanation:**
A `RangeError` is thrown when a numeric value or parameter falls outside the allowable mathematical or operational range, such as allocating an array with a negative length, exceeding recursion depth (call stack overflow), or passing invalid precision to `toFixed()`.

**Executable Code Demonstration:**
```javascript
try {
  const arr = new Array(-5);
} catch (err) {
  console.log("Caught:", err.name); // 'RangeError'
  console.log("Message:", err.message); // Invalid array length
}
```

#### Q13: What causes an URIError in JavaScript?
**Conceptual Explanation:**
A `URIError` is thrown when standard global URI handling functions (`decodeURI`, `decodeURIComponent`, `encodeURI`, `encodeURIComponent`) encounter an invalid or malformed URI character encoding sequence (e.g. an incomplete percent-encoded surrogate).

**Executable Code Demonstration:**
```javascript
try {
  decodeURIComponent("%E0%A4%A"); // Incomplete UTF-8 sequence
} catch (err) {
  console.log("Caught:", err.name); // 'URIError'
  console.log("Is URIError?", err instanceof URIError); // true
}
```

#### Q14: What is an EvalError and why is it rarely seen today?
**Conceptual Explanation:**
In early ECMAScript editions, `EvalError` was specified for misuse of the global `eval()` function. In modern ECMAScript, `eval()` throws `SyntaxError` or `TypeError` directly. `EvalError` remains present solely for historical backwards compatibility.

**Executable Code Demonstration:**
```javascript
const evalErr = new EvalError("Deprecated eval violation");
console.log(evalErr.name); // 'EvalError'
console.log("Retained for compatibility:", evalErr instanceof Error); // true
```

#### Q15: What is an AggregateError introduced in ES2021?
**Conceptual Explanation:**
ES2021 introduced `AggregateError` to represent a single error wrapping multiple individual errors. It is natively thrown by `Promise.any()` when all promises in an iterable reject, exposing an `errors` array containing each individual rejection reason.

**Executable Code Demonstration:**
```javascript
const aggErr = new AggregateError([
  new Error("Primary server timeout"),
  new Error("Secondary server refused connection")
], "All fallbacks failed");

console.log(aggErr.name); // 'AggregateError'
console.log("Sub-errors count:", aggErr.errors.length); // 2
aggErr.errors.forEach(e => console.log("-", e.message));
```

#### Q16: What happens if you throw a primitive string instead of an Error object?
**Conceptual Explanation:**
JavaScript allows throwing any arbitrary value (`throw 'fail'`), but throwing primitives fails to allocate a call stack trace, has no `name` or `message` properties, fails `instanceof Error` type checks, and breaks telemetry ingest pipelines expecting Error instances.

**Executable Code Demonstration:**
```javascript
try {
  throw "database_connection_failed";
} catch (err) {
  console.log("Type:", typeof err); // 'string'
  console.log("Instance of Error?", err instanceof Error); // false
  console.log("Stack Trace:", err.stack); // undefined!
}
```

#### Q17: How do you instantiate an Error with a custom message?
**Conceptual Explanation:**
You instantiate an `Error` by passing a descriptive string message to its constructor: `new Error('Custom description')`. You can also omit `new`, as `Error('msg')` functions identically per ECMA-262 specification.

**Executable Code Demonstration:**
```javascript
const errWithNew = new Error("Failed validation with new");
const errWithoutNew = Error("Failed validation without new");

console.log(errWithNew.message); // 'Failed validation with new'
console.log(errWithoutNew.message); // 'Failed validation without new'
console.log(errWithoutNew instanceof Error); // true
```

#### Q18: What is the error.name property and how is it used?
**Conceptual Explanation:**
The `name` property identifies the classification of the error. In native errors, it corresponds to the constructor name (e.g. 'TypeError'). In enterprise code, custom error subclasses override `name` so catch blocks and logging pipelines can differentiate errors without string-matching messages.

**Executable Code Demonstration:**
```javascript
class DatabaseTimeoutError extends Error {
  constructor(message) {
    super(message);
    this.name = "DatabaseTimeoutError";
  }
}
const dbErr = new DatabaseTimeoutError("Query timed out after 5000ms");
console.log("Classification:", dbErr.name); // 'DatabaseTimeoutError'
```

#### Q19: What is the error.message property?
**Conceptual Explanation:**
The `message` property is a human-readable string intended for developers and loggers describing the nature of the specific failure. It is initialized via the first argument to the `Error` constructor and defaults to an empty string if omitted.

**Executable Code Demonstration:**
```javascript
const emptyErr = new Error();
const customErr = new Error("Payload size exceeds 5MB limit");

console.log("Empty message:", JSON.stringify(emptyErr.message)); // '""'
console.log("Custom message:", customErr.message); // 'Payload size exceeds 5MB limit'
```

#### Q20: What is the error.stack property and is it standard ECMAScript?
**Conceptual Explanation:**
Historically, `error.stack` was a non-standard browser vendor extension (introduced by Mozilla and standardized by V8). Although not formally in the core ECMAScript standard body, it is de-facto standard across Node.js, Deno, Bun, and all modern browsers, providing a multi-line string trace of call frames.

**Executable Code Demonstration:**
```javascript
function alpha() { beta(); }
function beta() { gamma(); }
function gamma() { throw new Error("Stack demo"); }

try {
  alpha();
} catch (e) {
  console.log("Is stack string?", typeof e.stack === 'string'); // true
  console.log("Stack contains 'gamma':", e.stack.includes('gamma')); // true
}
```


### 09.2 Intermediate Tier (Questions 21 to 45)
#### Q21: How does call stack unwinding work when an error is thrown across multiple function calls?
**Conceptual Explanation:**
When an error is thrown, the JavaScript engine halts current instruction execution and checks if the immediate activation frame has a catch block. If not, the frame is popped from the Call Stack and discarded, and the engine inspects the caller frame. This unwinding repeats recursively until an enclosing `catch` is found or the stack empties (crashing the process or triggering a host unhandled exception).

**Executable Code Demonstration:**
```javascript
function level3() { throw new Error("Deep fault"); }
function level2() { level3(); console.log("Never printed"); }
function level1() { level2(); }

try {
  level1();
} catch (err) {
  console.log("Successfully intercepted unwound error:", err.message);
}
```

#### Q22: Why can't a synchronous try...catch catch an error thrown inside a setTimeout callback?
**Conceptual Explanation:**
Because `setTimeout` schedules its callback to execute in a future turn of the Event Loop via the Macrotask Queue. By the time the callback executes, the synchronous Call Stack containing the `try...catch` block has already completed and exited.

**Executable Code Demonstration:**
```javascript
// Synchronous try/catch FAILS to catch async timer callbacks:
try {
  setTimeout(() => {
    // This runs in a new turn of the event loop!
    // throw new Error("Timer fail"); // Would crash process or trigger uncaughtException
  }, 10);
} catch (e) {
  console.log("Never triggers for setTimeout!");
}

// Correct solution: Place try/catch INSIDE the callback:
setTimeout(() => {
  try {
    throw new Error("Handled timer failure");
  } catch (err) {
    console.log("Safely caught inside callback:", err.message);
  }
}, 20);
```

#### Q23: How do you catch errors thrown inside a Promise chain?
**Conceptual Explanation:**
Errors inside Promise chains are caught by appending a `.catch()` handler at the end of the chain, or by supplying a second `onRejected` callback to `.then(onFulfilled, onRejected)`. Any synchronous exception or rejected promise inside an upstream handler propagates to the downstream `.catch()`.

**Executable Code Demonstration:**
```javascript
Promise.resolve(42)
  .then(val => {
    throw new Error("Transformation pipeline failed");
  })
  .then(val => {
    console.log("Skipped step");
  })
  .catch(err => {
    console.log("Caught in promise chain:", err.message);
    return "Recovered value";
  })
  .then(val => {
    console.log("Chain continues with:", val);
  });
```

#### Q24: What is the purpose of Promise.prototype.catch()?
**Conceptual Explanation:**
`Promise.prototype.catch(onRejected)` is syntactic sugar for `promise.then(undefined, onRejected)`. It explicitly handles rejection without requiring an unused success callback, maintaining pipeline readability.

**Executable Code Demonstration:**
```javascript
const p = Promise.reject(new Error("Async rejection"));

// Equivalent forms:
p.catch(err => console.log("Handled via .catch:", err.message));
// p.then(undefined, err => console.log("Handled via .then:", err.message));
```

#### Q25: How does error handling work with async and await?
**Conceptual Explanation:**
The `async/await` syntax pauses execution of the local coroutine and converts rejected promises into synchronous-style exceptions. When an awaited promise rejects, the engine synthesizes a throw statement at that position, allowing standard `try...catch` blocks to catch asynchronous failures.

**Executable Code Demonstration:**
```javascript
async function fetchData() {
  throw new Error("Network latency timeout");
}

async function run() {
  try {
    const data = await fetchData();
  } catch (err) {
    console.log("Caught async exception using standard try/catch:", err.message);
  }
}
run();
```

#### Q26: What happens if an await expression awaits a rejected promise without a surrounding try...catch?
**Conceptual Explanation:**
If an awaited promise rejects without an enclosing `try...catch`, the enclosing `async` function immediately aborts and itself returns a rejected Promise. If that returned Promise is also not caught by the caller, it propagates until it triggers an `unhandledRejection` event at the process level.

**Executable Code Demonstration:**
```javascript
async function unhandledSubroutine() {
  await Promise.reject(new Error("Uncaught inside async"));
}

unhandledSubroutine()
  .catch(err => {
    console.log("Intercepted rejected promise from async function:", err.message);
  });
```

#### Q27: What is an unhandledRejection event in Node.js?
**Conceptual Explanation:**
In Node.js, the `process.on('unhandledRejection')` event is emitted whenever a Promise is rejected and no rejection handler (such as `.catch()`) is attached to that promise within the turn of the event loop. In modern Node.js, unhandled rejections terminate the process with a non-zero exit code unless an explicit event listener intercepts them.

**Executable Code Demonstration:**
```javascript
// Listening to global unhandled promise rejections:
const handler = (reason, promise) => {
  console.log("Detected unhandled rejection:", reason.message || reason);
};
process.once('unhandledRejection', handler);

Promise.reject(new Error("Demonstrating unhandledRejection"));
```

#### Q28: What is an uncaughtException event in Node.js?
**Conceptual Explanation:**
The `process.on('uncaughtException')` event is emitted when an unhandled synchronous exception bubbles all the way back through the Call Stack to the root of the event loop. If unhandled, Node.js prints the stack trace and immediately terminates the process with exit code 1.

**Executable Code Demonstration:**
```javascript
// Global catch-all handler for unhandled sync exceptions:
const originalListeners = process.listeners('uncaughtException');
process.removeAllListeners('uncaughtException');

process.once('uncaughtException', (err) => {
  console.log("Intercepted fatal uncaughtException:", err.message);
  // Re-attach original listeners
  originalListeners.forEach(l => process.on('uncaughtException', l));
});

// Simulate async scheduled throw
setTimeout(() => {
  // throw new Error("Fatal crash simulation");
}, 10);
```

#### Q29: How do you properly subclass the built-in Error class in ES6+?
**Conceptual Explanation:**
Proper subclassing requires: calling `super(message, options)` with options forwarding to preserve the `cause` chain, assigning `this.name = this.constructor.name`, and invoking `Error.captureStackTrace(this, this.constructor)` in V8 environments to omit the constructor itself from the stack trace.

**Executable Code Demonstration:**
```javascript
class HttpError extends Error {
  constructor(status, message, options = {}) {
    super(message, options);
    this.name = this.constructor.name;
    this.status = status;
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}
const notFound = new HttpError(404, "Page missing");
console.log(notFound.name); // 'HttpError'
console.log(notFound.status); // 404
console.log(notFound instanceof Error); // true
```

#### Q30: Why do we need Error.captureStackTrace(this, this.constructor) in custom error classes?
**Conceptual Explanation:**
In V8 (Chrome & Node.js), `Error.captureStackTrace(targetObject, constructorOpt)` creates the `.stack` property on the target object. By passing `this.constructor` as the second argument, V8 trims the stack trace so that internal constructor implementation frames are omitted, keeping the top of the stack pointing directly to where the consumer instantiated the error.

**Executable Code Demonstration:**
```javascript
class CleanError extends Error {
  constructor(msg) {
    super(msg);
    this.name = "CleanError";
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, CleanError);
    }
  }
}
const ce = new CleanError("Stack test");
console.log("Top line of stack:", ce.stack.split('\n')[0]);
```

#### Q31: What is the cause property in Error options (ES2022) and why is it revolutionary?
**Conceptual Explanation:**
Standardized in ES2022, the `{ cause }` constructor option allows an error to record its upstream root cause. Before ES2022, libraries wrote custom wrapper properties like `err.originalError` or `err.innerError`. `cause` provides a standardized, runtime-agnostic way to build recursive causality chains across distributed and layered systems.

**Executable Code Demonstration:**
```javascript
function parseConfig(raw) {
  try {
    return JSON.parse(raw);
  } catch (err) {
    throw new Error("Configuration parsing failed", { cause: err });
  }
}

try {
  parseConfig("{ invalid }");
} catch (outer) {
  console.log("Top Error:", outer.message); // 'Configuration parsing failed'
  console.log("Root Cause:", outer.cause.message); // Unexpected token...
  console.log("Root Cause Type:", outer.cause.name); // 'SyntaxError'
}
```

#### Q32: How do you re-throw an error inside a catch block while preserving context?
**Conceptual Explanation:**
When an error occurs that the local scope cannot recover from, it must be re-thrown. In modern JavaScript, the best practice is to wrap it in a domain-specific error using `throw new DomainError('Context', { cause: err })` or re-throw the original error directly if no context enrichment is required.

**Executable Code Demonstration:**
```javascript
function processOrder(orderId) {
  try {
    throw new Error("Gateway timeout");
  } catch (err) {
    if (err.message.includes("Gateway")) {
      // Enrich with domain context:
      throw new Error(`Order processing failed for order ${orderId}`, { cause: err });
    }
    throw err; // Re-throw unknown errors unchanged
  }
}
try { processOrder("ORD-991"); } catch (e) { console.log(e.message, "-> Cause:", e.cause.message); }
```

#### Q33: What is the return override trap in a finally block?
**Conceptual Explanation:**
If a `finally` block executes a `return` statement, that `return` completely overrides any pending `return` or thrown exception from the preceding `try` or `catch` blocks. Thrown errors are silently discarded and lost forever.

**Executable Code Demonstration:**
```javascript
function trap() {
  try {
    throw new Error("Critical crash!");
  } finally {
    return "I survived!"; // SILENTLY DESTROYS THE THROWN ERROR!
  }
}
console.log("Trap output:", trap()); // 'I survived!'
```

#### Q34: What happens if both try and finally throw errors?
**Conceptual Explanation:**
If an exception is thrown in the `try` block and another exception is thrown inside the `finally` block, the exception from the `finally` block supersedes and completely masks the original error from `try`. The original exception is dropped without reaching outer handlers.

**Executable Code Demonstration:**
```javascript
try {
  try {
    throw new Error("Error from TRY");
  } finally {
    throw new Error("Error from FINALLY");
  }
} catch (e) {
  console.log("Caught:", e.message); // 'Error from FINALLY'
}
```

#### Q35: What happens if a finally block throws an error while catch is handling another error?
**Conceptual Explanation:**
Similar to Q34, if an error is thrown in `try`, caught in `catch`, and then `finally` throws an error, the exception from `finally` replaces whatever `catch` was doing (including any error re-thrown by `catch`).

**Executable Code Demonstration:**
```javascript
try {
  try {
    throw new Error("Original Error");
  } catch (e) {
    throw new Error("Catch Rethrow Error");
  } finally {
    throw new Error("Finally Override Error");
  }
} catch (e) {
  console.log("Resulting exception:", e.message); // 'Finally Override Error'
}
```

#### Q36: How does error handling differ between Promise.all and Promise.allSettled?
**Conceptual Explanation:**
`Promise.all` fails fast: the moment any promise rejects, the entire returned promise immediately rejects with that single error, ignoring the state of remaining promises. In contrast, `Promise.allSettled` never rejects; it waits for all promises to finish and returns an array of status descriptor objects with either `{ status: 'fulfilled', value }` or `{ status: 'rejected', reason }`.

**Executable Code Demonstration:**
```javascript
const p1 = Promise.resolve("Success 1");
const p2 = Promise.reject(new Error("Fail 2"));

// Promise.all rejects immediately:
Promise.all([p1, p2]).catch(err => console.log("Promise.all rejected with:", err.message));

// Promise.allSettled resolves regardless of failures:
Promise.allSettled([p1, p2]).then(results => {
  console.log("allSettled statuses:", results.map(r => r.status)); // ['fulfilled', 'rejected']
});
```

#### Q37: How does Promise.any handle errors and what error does it produce?
**Conceptual Explanation:**
`Promise.any` fulfills as soon as any single promise fulfills. It only rejects if *every single promise* in the iterable rejects. When all reject, it rejects with an `AggregateError` instance containing an `errors` array holding each rejection reason in original input order.

**Executable Code Demonstration:**
```javascript
const pFail1 = Promise.reject(new Error("Mirror 1 down"));
const pFail2 = Promise.reject(new Error("Mirror 2 down"));

Promise.any([pFail1, pFail2]).catch(err => {
  console.log("Error type:", err.name); // 'AggregateError'
  console.log("Collected errors:", err.errors.map(e => e.message)); // ['Mirror 1 down', 'Mirror 2 down']
});
```

#### Q38: How do Node.js EventEmitter instances handle 'error' events when no listener is attached?
**Conceptual Explanation:**
In Node.js, the `'error'` event is treated with special protocol significance. If an `EventEmitter` emits an `'error'` event and there are zero listeners registered for `'error'`, Node.js throws the unhandled error as an unhandled exception, causing the process to print the stack and crash.

**Executable Code Demonstration:**
```javascript
const EventEmitter = require('events');
const emitter = new EventEmitter();

// Without listener, emitter.emit('error', new Error('boom')) will crash Node!
// With listener:
emitter.on('error', (err) => {
  console.log("Safely intercepted event emitter error:", err.message);
});
emitter.emit('error', new Error("Safe emitter failure"));
```

#### Q39: How do you handle errors in Node.js streams (Pipelines vs on('error'))?
**Conceptual Explanation:**
Traditional `.pipe()` chaining does not forward errors across stream stages: if stream B errors in `A.pipe(B).pipe(C)`, streams A and C remain open, causing descriptor and memory leaks. The modern standard is to use `stream.pipeline()` or `stream.promises.pipeline()`, which cleanly tears down all streams in the pipeline if any stage fails.

**Executable Code Demonstration:**
```javascript
const { Readable, Writable, pipeline } = require('stream');

const source = new Readable({ read() { this.push('chunk'); this.push(null); } });
const dest = new Writable({ write(chunk, enc, cb) { cb(new Error("Disk write error")); } });

pipeline(source, dest, (err) => {
  if (err) {
    console.log("Pipeline safely caught error & destroyed streams:", err.message);
  }
});
```

#### Q40: What is the stream.pipeline utility and why does it replace .pipe() for error handling?
**Conceptual Explanation:**
`stream.pipeline()` takes a series of streams, connects them, and registers comprehensive error listeners on every individual stream. If any stream errors or aborts prematurely, `pipeline` ensures all other streams in the chain are immediately destroyed with `.destroy(err)`, preventing dangling file descriptors and memory leaks.

**Executable Code Demonstration:**
```javascript
const stream = require('stream');
console.log("Is pipeline available in Node?", typeof stream.pipeline === 'function');
console.log("Is promises.pipeline available?", typeof stream.promises.pipeline === 'function');
```

#### Q41: What is the distinction between 'Operational Errors' and 'Programmer Errors'?
**Conceptual Explanation:**
**Operational Errors** represent runtime situations that are known possibilities during normal system operations (e.g. database connection timeout, invalid user input, file not found, network socket disconnect). These are expected and must be gracefully handled. **Programmer Errors** are actual bugs in the source code (e.g. `TypeError: cannot read property of undefined`, syntax errors, passing wrong types). These cannot be safely recovered from and typically require immediate crash-and-restart.

**Executable Code Demonstration:**
```javascript
// Operational Error: Expected runtime event
class OperationalError extends Error {
  constructor(msg) { super(msg); this.isOperational = true; }
}

// Programmer Error: Coding bug (e.g., calling non-function)
function buggyCode(callback) {
  callback(); // Throws TypeError if callback is null/undefined
}
try { buggyCode(null); } catch (e) {
  console.log("Programmer Error detected:", e instanceof TypeError); // true
}
```

#### Q42: Why should a production Node.js process restart after encountering an uncaughtException?
**Conceptual Explanation:**
When an uncaught exception occurs, the execution context is abruptly truncated midway through an unknown operation. Global variables, shared in-memory caches, database connection pools, and file descriptors may be left in an inconsistent or partially locked state. The only safe action is to log the error, finish active inflight requests if possible, and exit cleanly so a process supervisor (Docker/Kubernetes/PM2) can boot a fresh instance.

**Executable Code Demonstration:**
```javascript
function simulateSafeShutdown() {
  console.log("1. Uncaught exception detected");
  console.log("2. Ceasing new incoming traffic");
  console.log("3. Draining database connection pool");
  console.log("4. Exiting process with code 1 for supervisor restart");
}
simulateSafeShutdown();
```

#### Q43: What is the Go-style [error, data] tuple pattern in JavaScript?
**Conceptual Explanation:**
Borrowed from the Go programming language where functions return `(result, err)`, this pattern wraps asynchronous promises into a helper function that resolves to a two-element array: `[null, data]` on success, or `[error, null]` on failure. It eliminates deeply nested `try...catch` blocks in sequential async code.

**Executable Code Demonstration:**
```javascript
async function to(promise) {
  try {
    const data = await promise;
    return [null, data];
  } catch (err) {
    return [err, null];
  }
}

async function run() {
  const [err, user] = await to(Promise.resolve({ id: 1, name: "Alice" }));
  if (err) return console.error("Error:", err);
  console.log("User retrieved safely:", user.name);
}
run();
```

#### Q44: How can you implement a synchronous safeTry helper that mimics Go's error return?
**Conceptual Explanation:**
A synchronous `safeTry` wraps any standard function call inside a `try...catch` and immediately returns a `[error, result]` tuple, avoiding local block scoping restrictions imposed by standard `try/catch` blocks.

**Executable Code Demonstration:**
```javascript
function safeTry(fn, ...args) {
  try {
    return [null, fn(...args)];
  } catch (err) {
    return [err, null];
  }
}

const [parseErr, data] = safeTry(JSON.parse, '{"count": 42}');
if (!parseErr) {
  console.log("Parsed count successfully:", data.count); // 42
}

const [failErr, failData] = safeTry(JSON.parse, '{bad json}');
if (failErr) {
  console.log("Handled parse failure cleanly:", failErr.name); // 'SyntaxError'
}
```

#### Q45: How do you handle JSON parsing errors safely without boilerplate try/catch?
**Conceptual Explanation:**
By creating a dedicated pure wrapper utility that either returns a fallback default value or returns a safe Result tuple. This prevents sprinkling repetitive `try...catch` blocks throughout the codebase.

**Executable Code Demonstration:**
```javascript
function safeJSONParse(text, fallback = null) {
  try {
    return JSON.parse(text);
  } catch {
    return fallback;
  }
}

console.log(safeJSONParse('{"active": true}', {})); // { active: true }
console.log(safeJSONParse('malformed', {})); // {}
```

### 09.3 Advanced Tier (Questions 46 to 70)
#### Q46: How do you format and log errors as structured JSON for log aggregators (Datadog/Elasticsearch)?
**Conceptual Explanation:**
Standard logging aggregators require structured JSON payloads. Because Error properties like `message`, `name`, and `stack` are non-enumerable by default, you must explicitly serialize them into a plain dictionary containing metadata, timestamp, correlation IDs, and nested cause chains.

**Executable Code Demonstration:**
```javascript
function serializeError(err) {
  if (!(err instanceof Error)) return { raw: err };
  return {
    name: err.name,
    message: err.message,
    stack: err.stack,
    ...(err.cause ? { cause: serializeError(err.cause) } : {}),
    ...(err.code ? { code: err.code } : {}),
    timestamp: new Date().toISOString()
  };
}
const e = new Error("DB Connection Lost", { cause: new Error("Socket timeout") });
console.log(JSON.stringify(serializeError(e), null, 2));
```

#### Q47: Why does JSON.stringify(new Error('boom')) return {} by default, and how do you fix it?
**Conceptual Explanation:**
In ECMAScript, `Error.prototype.message`, `name`, and non-standard `stack` are created with the property descriptor attribute `enumerable: false`. Because `JSON.stringify()` only serializes enumerable own properties, an Error serializes to an empty object `{}`. You fix this by using a replacer function or `Object.getOwnPropertyNames()`. 

**Executable Code Demonstration:**
```javascript
const err = new Error("Boom");
console.log("Default JSON:", JSON.stringify(err)); // '{}'

// Fix using a replacer:
function errorReplacer(key, value) {
  if (value instanceof Error) {
    const errorPlain = {};
    for (const prop of Object.getOwnPropertyNames(value)) {
      errorPlain[prop] = value[prop];
    }
    return errorPlain;
  }
  return value;
}
console.log("Fixed JSON:", JSON.parse(JSON.stringify(err, errorReplacer)).message); // 'Boom'
```

#### Q48: What is Error.prepareStackTrace in V8 and how can you customize stack traces?
**Conceptual Explanation:**
`Error.prepareStackTrace(error, structuredStackTrace)` is a V8-specific hook. When defined, whenever an error's `.stack` property is accessed for the first time, V8 invokes this function passing an array of `CallSite` objects instead of generating the default string. This allows programmatic inspection of call frames.

**Executable Code Demonstration:**
```javascript
const originalPrepare = Error.prepareStackTrace;
Error.prepareStackTrace = (err, structuredStack) => {
  return structuredStack.map(callSite => ({
    fn: callSite.getFunctionName() || '<anonymous>',
    file: callSite.getFileName(),
    line: callSite.getLineNumber(),
    col: callSite.getColumnNumber()
  }));
};

const customErr = new Error("Inspecting frames");
const frames = customErr.stack; // Triggers custom prepareStackTrace
console.log("Top Frame Object:", frames[0]);
Error.prepareStackTrace = originalPrepare; // Restore
```

#### Q49: How can you capture call site information (file, function, line, column) programmatically?
**Conceptual Explanation:**
By utilizing `Error.prepareStackTrace` in V8 or parsing the string stack trace with regex. In Node.js or Chrome, temporarily overriding `Error.prepareStackTrace` allows capturing the exact caller's filename and line number without third-party libraries.

**Executable Code Demonstration:**
```javascript
function getCallerLocation() {
  const orig = Error.prepareStackTrace;
  Error.prepareStackTrace = (_, stack) => stack;
  const err = new Error();
  const stack = err.stack;
  Error.prepareStackTrace = orig;

  // Frame 0 is getCallerLocation, Frame 1 is the caller
  const callerFrame = stack[1];
  return {
    file: callerFrame.getFileName(),
    line: callerFrame.getLineNumber(),
    fn: callerFrame.getFunctionName()
  };
}

function testCaller() {
  return getCallerLocation();
}
console.log("Caller info:", testCaller().fn); // 'testCaller'
```

#### Q50: What is Error.stackTraceLimit in V8 and what are its memory implications?
**Conceptual Explanation:**
`Error.stackTraceLimit` (default 10 in Node/V8) dictates how many stack frames V8 captures when formatting a stack trace. Setting it to `Infinity` captures the entire call tree (valuable in debugging deep recursion), but increases memory allocation and CPU overhead during exception creation.

**Executable Code Demonstration:**
```javascript
console.log("Default stack limit:", Error.stackTraceLimit); // 10

const prev = Error.stackTraceLimit;
Error.stackTraceLimit = 25; // Expand depth for complex debugging

const deepErr = new Error("Deep trace test");
console.log("Frames captured:", deepErr.stack.split('\n').length - 1);
Error.stackTraceLimit = prev; // Restore
```

#### Q51: How do Source Maps work during runtime error stack trace reconstruction?
**Conceptual Explanation:**
When transpiling TypeScript, Babel, or bundling with Webpack/Vite/esbuild, runtime errors point to generated bundle line/column numbers. Source maps contain a Base64-VLQ encoded mapping table correlating bundle coordinates back to original source files. Libraries like `source-map-support` intercept V8's `prepareStackTrace` to resolve frames on-the-fly.

**Executable Code Demonstration:**
```javascript
// Conceptual source map mapping:
function resolveFrame(generatedLine, generatedCol, mappingTable) {
  // Mapping table translates bundle:12:456 -> src/auth/login.ts:34:12
  return { originalFile: "src/auth/login.ts", line: 34, column: 12 };
}
console.log("Mapped frame:", resolveFrame(12, 456, {}));
```

#### Q52: How do you implement asynchronous retry with exponential backoff and jitter?
**Conceptual Explanation:**
When dealing with transient network or database failures, immediate retries can overwhelm an already struggling downstream service. Exponential backoff increases delay exponentially ($2^{\text{attempt}} \times \text{base}$), while randomized jitter prevents the 'thundering herd' problem.

**Executable Code Demonstration:**
```javascript
async function retryWithBackoff(fn, retries = 3, baseDelayMs = 50) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      if (attempt === retries) throw err;
      const exponential = Math.pow(2, attempt) * baseDelayMs;
      const jitter = Math.random() * baseDelayMs;
      const delay = exponential + jitter;
      await new Promise(r => setTimeout(r, delay));
    }
  }
}

let tries = 0;
retryWithBackoff(async () => {
  tries++;
  if (tries < 3) throw new Error("Transient network glitch");
  return "Success on attempt " + tries;
}).then(res => console.log(res));
```

#### Q53: What is the Circuit Breaker pattern and how does it prevent cascading system failures?
**Conceptual Explanation:**
The Circuit Breaker pattern monitors calls to external services. It tracks failure counts across three states: **CLOSED** (normal operation), **OPEN** (all calls fail fast immediately without hitting remote service), and **HALF-OPEN** (trial request to test recovery). This prevents thread/socket exhaustion and protects upstream systems.

**Executable Code Demonstration:**
```javascript
class SimpleCircuitBreaker {
  constructor(failureThreshold = 3, cooldownMs = 1000) {
    this.failureThreshold = failureThreshold;
    this.cooldownMs = cooldownMs;
    this.state = 'CLOSED';
    this.failures = 0;
    this.nextAttempt = Date.now();
  }

  async execute(action) {
    if (this.state === 'OPEN') {
      if (Date.now() < this.nextAttempt) {
        throw new Error("CircuitBreaker OPEN: Fast fail");
      }
      this.state = 'HALF-OPEN';
    }

    try {
      const res = await action();
      this.state = 'CLOSED';
      this.failures = 0;
      return res;
    } catch (err) {
      this.failures++;
      if (this.failures >= this.failureThreshold) {
        this.state = 'OPEN';
        this.nextAttempt = Date.now() + this.cooldownMs;
      }
      throw err;
    }
  }
}
const breaker = new SimpleCircuitBreaker(2, 500);
console.log("Breaker initial state:", breaker.state);
```

#### Q54: How do you prevent sensitive credentials (PII, tokens, passwords) from leaking into stack traces?
**Conceptual Explanation:**
By creating a stack trace sanitization pipeline that regex-masks sensitive query parameters, Authorization bearer tokens, and passwords from the serialized stack trace string before sending it to centralized monitoring.

**Executable Code Demonstration:**
```javascript
function sanitizeStack(stack) {
  return stack
    .replace(/bearer\s+[a-zA-Z0-9_\-\.]+/gi, 'Bearer [REDACTED]')
    .replace(/password=[^&\s]+/gi, 'password=[REDACTED]');
}

const rawStack = "Error at auth(token=bearer eyJhbGci, password=superSecret123)";
console.log("Sanitized:", sanitizeStack(rawStack));
```

#### Q55: What is the Result/Either monad pattern in TypeScript and JavaScript?
**Conceptual Explanation:**
The Result (or Either) pattern treats errors as values rather than control-flow interrupts. An operation returns an object representing either `Ok(value)` or `Err(error)`. Consumers use functional chaining (`.map()`, `.flatMap()`) to transform data safely without throwing exceptions.

**Executable Code Demonstration:**
```javascript
class Result {
  constructor(isSuccess, value, error) {
    this.isSuccess = isSuccess;
    this.value = value;
    this.error = error;
  }
  static ok(val) { return new Result(true, val, null); }
  static err(e) { return new Result(false, null, e); }
  map(fn) {
    return this.isSuccess ? Result.ok(fn(this.value)) : this;
  }
}

const safeDivide = (a, b) => b === 0 ? Result.err(new Error("Div by 0")) : Result.ok(a / b);
const res = safeDivide(10, 2).map(n => n * 3);
console.log("Result value:", res.value); // 15
```

#### Q56: How do you implement a chainable Result<T, E> class in modern JavaScript?
**Conceptual Explanation:**
A robust Result implementation includes `isOk`, `isErr`, `unwrap`, `unwrapOr`, `map`, and `mapErr` methods, providing complete algebraic error modeling.

**Executable Code Demonstration:**
```javascript
class RobustResult {
  constructor(success, value, error) {
    this.success = success;
    this.val = value;
    this.err = error;
  }
  static Ok(v) { return new RobustResult(true, v, null); }
  static Err(e) { return new RobustResult(false, null, e); }
  isOk() { return this.success; }
  unwrapOr(fallback) { return this.success ? this.val : fallback; }
  match({ onOk, onErr }) {
    return this.success ? onOk(this.val) : onErr(this.err);
  }
}
const successCase = RobustResult.Ok(100);
console.log("Unwrapped:", successCase.unwrapOr(0)); // 100
const failCase = RobustResult.Err(new Error("Fail"));
console.log("Fallback:", failCase.unwrapOr(0)); // 0
```

#### Q57: How do you handle unhandled rejections in web browsers using window.addEventListener('unhandledrejection')?
**Conceptual Explanation:**
In browsers, unhandled promise rejections emit an `unhandledrejection` event on the `window` object. The event object contains `reason` (the rejection payload) and `promise`. Calling `event.preventDefault()` stops the error from logging to the browser devtools console.

**Executable Code Demonstration:**
```javascript
if (typeof window !== 'undefined') {
  window.addEventListener('unhandledrejection', (event) => {
    console.warn("Global browser unhandled rejection:", event.reason);
    event.preventDefault(); // Suppress browser default red console error
  });
}
console.log("Browser unhandledrejection pattern configured");
```

#### Q58: What is window.onerror in client-side JavaScript and what are its arguments?
**Conceptual Explanation:**
`window.onerror` is the legacy client-side global exception handler. It receives five distinct parameters: `message`, `source` (URL of script), `lineno`, `colno`, and `error` (the actual Error object). Returning `true` from the handler suppresses standard browser error reporting.

**Executable Code Demonstration:**
```javascript
function setupClientErrorLogger() {
  if (typeof window === 'undefined') return;
  window.onerror = function(message, source, lineno, colno, error) {
    console.log("Client Error Captured:", { message, source, lineno, colno, stack: error?.stack });
    return true; // Prevents default browser alert/console error
  };
}
console.log("Client window.onerror ready");
```

#### Q59: What is the 'Script Error.' issue in client-side error reporting (CORS issue) and how do you resolve it?
**Conceptual Explanation:**
When an error occurs in a script loaded from a different origin/CDN (cross-origin), browsers redact the error details to `'Script error.'` with line 0 to prevent cross-origin information leakage. To resolve this: (1) Add the `crossorigin="anonymous"` attribute to the `<script>` tag, and (2) Configure the CDN to send the `Access-Control-Allow-Origin: *` HTTP header.

**Executable Code Demonstration:**
```javascript
// HTML required: <script src="https://cdn.example.com/app.js" crossorigin="anonymous"></script>
// Server header required: Access-Control-Allow-Origin: *
console.log("Resolution: crossorigin attribute + CORS headers allow full stack inspection.");
```

#### Q60: How do React Error Boundaries work and what lifecycle methods catch errors?
**Conceptual Explanation:**
React Error Boundaries are class components that catch JavaScript errors anywhere in their child component tree. They implement two lifecycle methods: `static getDerivedStateFromError(error)` (updates state to render fallback UI) and `componentDidCatch(error, errorInfo)` (logs error and component stack).

**Executable Code Demonstration:**
```javascript
// Conceptual representation of React Error Boundary
class DummyErrorBoundary {
  state = { hasError: false };
  static getDerivedStateFromError(error) {
    return { hasError: true };
  }
  componentDidCatch(error, errorInfo) {
    console.log("Logged to Sentry:", error.message, errorInfo);
  }
}
console.log("Error Boundary structure verified");
```

#### Q61: What errors can React Error Boundaries NOT catch?
**Conceptual Explanation:**
React Error Boundaries do NOT catch: (1) Errors inside event handlers (use standard `try/catch` inside handlers), (2) Asynchronous code (e.g. `setTimeout` or `requestAnimationFrame`), (3) Server-side rendering (SSR) errors, and (4) Errors thrown inside the Error Boundary component itself.

**Executable Code Demonstration:**
```javascript
function handleClick() {
  // Error Boundary will NOT catch this!
  try {
    throw new Error("Event handler failure");
  } catch (err) {
    console.log("Must catch event handler errors locally:", err.message);
  }
}
handleClick();
```

#### Q62: How do Express error-handling middleware functions differ from standard middleware?
**Conceptual Explanation:**
Standard Express middleware functions accept 3 arguments `(req, res, next)`. Error-handling middleware functions MUST explicitly accept 4 arguments: `(err, req, res, next)`. Express inspects the function's `.length` property; if `fn.length !== 4`, Express treats it as regular middleware and bypasses it during error routing.

**Executable Code Demonstration:**
```javascript
function expressErrorHandler(err, req, res, next) {
  // Notice 4 arguments!
  console.log("Error middleware length:", expressErrorHandler.length); // 4
}
console.log("Arity check:", expressErrorHandler.length === 4);
```

#### Q63: Why does Express 4 require passing async errors to next(err) while Express 5 catches them automatically?
**Conceptual Explanation:**
In Express 4, route handlers returning rejected Promises are unhandled because Express 4 does not inspect the return value of route callbacks; errors must be manually passed via `catch(next)`. Express 5 natively intercepts rejected Promises returned from route handlers and routes them to error middleware automatically.

**Executable Code Demonstration:**
```javascript
// Express 4 pattern:
const routeV4 = async (req, res, next) => {
  try {
    throw new Error("V4 async error");
  } catch (err) {
    next(err); // Mandatory in Express 4
  }
};

// Express 5 handles async rejection returns natively:
const routeV5 = async (req, res) => {
  throw new Error("V5 auto-catches returned rejected promise!");
};
console.log("Express 4 vs 5 async semantics understood");
```

#### Q64: How does Fastify handle asynchronous errors and reply decorators?
**Conceptual Explanation:**
Fastify was architected for modern `async/await`. If an async route handler throws an error or returns a rejected Promise, Fastify intercepts it automatically, formats a standard JSON payload (`{ statusCode, error, message }`), and triggers the global `setErrorHandler((error, request, reply) => {})`.

**Executable Code Demonstration:**
```javascript
// Fastify style error handling conceptual demo:
async function fastifyHandler(request, reply) {
  throw new Error("Fastify natively serializes thrown errors!");
}
fastifyHandler().catch(e => console.log("Fastify intercepted:", e.message));
```

#### Q65: How do you implement a timeout wrapper for Promises with proper error cleanup?
**Conceptual Explanation:**
By racing the target promise against a timer promise that rejects with a `TimeoutError`. Crucially, when the target promise finishes first, the timer must be explicitly cleared using `clearTimeout` to prevent memory leaks in long-running processes.

**Executable Code Demonstration:**
```javascript
function withTimeout(promise, timeoutMs) {
  let timerId;
  const timeoutPromise = new Promise((_, reject) => {
    timerId = setTimeout(() => {
      reject(new Error(`Operation timed out after ${timeoutMs}ms`));
    }, timeoutMs);
  });

  return Promise.race([promise, timeoutPromise]).finally(() => {
    clearTimeout(timerId); // Prevent timer leak!
  });
}

withTimeout(new Promise(r => setTimeout(() => r("Done"), 50)), 200)
  .then(res => console.log("Timeout wrapper result:", res));
```

#### Q66: What is an AbortController and how is it used to cancel asynchronous operations and handle AbortError?
**Conceptual Explanation:**
`AbortController` provides a standard mechanism to abort asynchronous operations (like `fetch()` or streams). When `controller.abort()` is called, its associated `signal` emits an `'abort'` event, causing pending operations to reject with a `DOMException` named `'AbortError'`.

**Executable Code Demonstration:**
```javascript
const controller = new AbortController();
const { signal } = controller;

function cancellableDelay(ms, sig) {
  return new Promise((resolve, reject) => {
    if (sig.aborted) return reject(new Error("Aborted"));
    const id = setTimeout(resolve, ms);
    sig.addEventListener('abort', () => {
      clearTimeout(id);
      const abortErr = new Error("This operation was aborted");
      abortErr.name = "AbortError";
      reject(abortErr);
    });
  });
}

cancellableDelay(1000, signal).catch(err => {
  console.log("Caught:", err.name, err.message); // 'AbortError'
});
controller.abort(); // Cancel immediately
```

#### Q67: How do you detect if an error was caused by an aborted request vs a network failure?
**Conceptual Explanation:**
Inspect the error's `name` property: aborted operations throw an error with `error.name === 'AbortError'`. Network failures typically present as `TypeError: Failed to fetch` or have `code: 'ECONNRESET'`.

**Executable Code Demonstration:**
```javascript
function handleFetchError(err) {
  if (err.name === 'AbortError') {
    console.log("Request was deliberately aborted by user or timeout.");
  } else {
    console.error("Real network error occurred:", err.message);
  }
}
handleFetchError({ name: 'AbortError', message: 'The user aborted a request.' });
```

#### Q68: What is a deadlock or resource leak caused by forgetting finally in database transactions?
**Conceptual Explanation:**
If a database connection is checked out from a pool and an error is thrown before calling `connection.release()` or `ROLLBACK`, the connection remains locked and unavailable. Under load, all pooled connections become leaked, completely deadlocking the backend service.

**Executable Code Demonstration:**
```javascript
async function badTransaction(pool) {
  // ❌ If work() fails, connection is never released to pool!
  // const conn = await pool.getConnection();
  // await conn.query("START TRANSACTION");
  // await work();
  // await conn.release();
}

async function safeTransaction(fakePool) {
  let conn;
  try {
    conn = { id: "conn_1", released: false };
    console.log("Checked out connection:", conn.id);
    throw new Error("Query failure");
  } finally {
    if (conn) {
      conn.released = true;
      console.log("Finally: Connection safely released back to pool!");
    }
  }
}
safeTransaction();
```

#### Q69: How do you implement safe transactional rollback using try...catch...finally?
**Conceptual Explanation:**
In a relational database transaction, begin transaction in `try`. If any query fails, catch the error and execute `ROLLBACK`. In the `finally` block, always release the connection back to the pool regardless of commit or rollback success.

**Executable Code Demonstration:**
```javascript
async function executeTransactionalWorkflow() {
  const conn = { inTx: false, released: false };
  try {
    conn.inTx = true;
    console.log("1. BEGIN TRANSACTION");
    throw new Error("Credit card debit rejected");
    // conn.inTx = false;
    // console.log("2. COMMIT");
  } catch (err) {
    console.log("2. ROLLBACK due to:", err.message);
    throw err;
  } finally {
    conn.released = true;
    console.log("3. FINALLY: Connection released");
  }
}
executeTransactionalWorkflow().catch(() => {});
```

#### Q70: How do you handle concurrency errors when running Promise.all with mixed failures?
**Conceptual Explanation:**
If multiple tasks run concurrently and one fails, `Promise.all` rejects immediately while sibling promises continue executing in the background unmonitored. To manage this safely, use `Promise.allSettled` to collect all outcomes or pair with `AbortController` to cancel remaining sibling tasks upon first failure.

**Executable Code Demonstration:**
```javascript
async function safeBatch(tasks) {
  const results = await Promise.allSettled(tasks);
  const failures = results.filter(r => r.status === 'rejected');
  const successes = results.filter(r => r.status === 'fulfilled');
  return { failures, successes };
}

safeBatch([
  Promise.resolve(10),
  Promise.reject(new Error("Batch item 2 failed")),
  Promise.resolve(30)
]).then(res => {
  console.log("Success count:", res.successes.length); // 2
  console.log("Failure count:", res.failures.length); // 1
});
```


### 09.4 Senior & Staff Tier (Questions 71 to 90)
#### Q71: What is the V8 engine's internal representation of the call stack (CallSite objects)?
**Conceptual Explanation:**
When an error is instantiated in V8, the engine walks the native execution stack and creates an internal array of `CallSite` C++ objects. Each object provides methods such as `getThis()`, `getTypeName()`, `getFunction()`, `getFunctionName()`, `getMethodName()`, `getFileName()`, `getLineNumber()`, and `isConstructor()`.

**Executable Code Demonstration:**
```javascript
function inspectCallSite() {
  const orig = Error.prepareStackTrace;
  Error.prepareStackTrace = (_, stack) => stack;
  const err = new Error();
  const topSite = err.stack[0];
  Error.prepareStackTrace = orig;

  console.log("Method Name:", topSite.getMethodName());
  console.log("Is Native:", topSite.isNative());
}
inspectCallSite();
```

#### Q72: How does V8 optimize try...catch blocks in modern TurboFan compared to legacy Crankshaft?
**Conceptual Explanation:**
In legacy V8 (Crankshaft), any function containing a `try...catch` statement was completely blacklisted from JIT optimization. In modern V8 (TurboFan), `try...catch` is represented as a first-class control flow node (TryCatch graph node) and can be inlined and JIT-compiled with zero performance penalty during normal non-exceptional execution.

**Executable Code Demonstration:**
```javascript
// TurboFan optimizes this loop with high-speed machine code:
function hotLoop() {
  let sum = 0;
  for (let i = 0; i < 1000; i++) {
    try {
      sum += i;
    } catch (e) {
      sum -= 1;
    }
  }
  return sum;
}
console.log("Hot loop optimized output:", hotLoop());
```

#### Q73: Does enclosing code in try...catch still cause V8 to de-optimize the enclosing function?
**Conceptual Explanation:**
No. In modern V8, the presence of `try...catch` does NOT cause function de-optimization. However, *actually throwing an exception* is inherently expensive because the engine must capture the call stack, inspect source mapping tables, and unwind stack frames.

**Executable Code Demonstration:**
```javascript
console.log("Entering try/catch without throwing has near-zero overhead in modern V8.");
```

#### Q74: What is zero-cost exception handling in native runtimes and does JavaScript have it?
**Conceptual Explanation:**
Zero-cost exception handling (common in C++ and Rust) uses static unwind tables generated at compile-time: entering a `try` block costs 0 CPU instructions, and cost is incurred only when an exception is thrown. V8 implements a hybrid approach: entering a `try` block has near-zero cost in TurboFan, but stack trace allocation during `new Error()` incurs measurable heap allocation overhead.

**Executable Code Demonstration:**
```javascript
const t0 = performance.now();
for (let i = 0; i < 100000; i++) {
  try { const a = 1 + 1; } catch {}
}
const t1 = performance.now();
console.log("100k empty try/catches duration (ms):", (t1 - t0).toFixed(2));
```

#### Q75: How do asynchronous stack traces work in V8 (Zero-Cost Async Stack Traces)?
**Conceptual Explanation:**
Introduced in V8 v7.3 / Node.js 12, 'Zero-Cost Async Stack Traces' reconstruct call chains across `await` boundaries by stitching together Promise reactions on the microtask queue. Unlike synchronous stacks that inspect the physical C++ call stack, V8 reconstructs the chain of awaited promises without runtime performance overhead during normal execution.

**Executable Code Demonstration:**
```javascript
async function c() { throw new Error("Async stack demo"); }
async function b() { await c(); }
async function a() { await b(); }

a().catch(err => {
  console.log("Contains stitched async frames 'b' and 'a':", err.stack.includes('b') && err.stack.includes('a'));
});
```

#### Q76: What are the memory leak risks associated with retaining Error objects in long-lived closures or caches?
**Conceptual Explanation:**
When an `Error` is created, its stack property or internal V8 CallSite objects can retain references to enclosing lexical scopes and function closures. If Error instances are stored in long-lived in-memory arrays or caches, they can hold large objects in memory and prevent garbage collection.

**Executable Code Demonstration:**
```javascript
const errorCache = [];
function leakyWorker() {
  const hugePayload = new Uint8Array(1024 * 1024); // 1MB
  try {
    throw new Error("Worker failed");
  } catch (err) {
    // Retaining err might retain hugePayload closure in some engines:
    errorCache.push({ message: err.message }); // ✅ Safe: store plain message, not whole error
  }
}
leakyWorker();
console.log("Cached safe errors:", errorCache.length);
```

#### Q77: How can retaining error.stack prevent Garbage Collection of large lexical scopes?
**Conceptual Explanation:**
In V8, accessing `error.stack` forces string formatting and releases internal CallSite objects. If `error.stack` is NOT accessed, V8 maintains lazy closure references to the stack frame scopes. Accessing `err.stack` early or stripping unnecessary properties allows the GC to reclaim closure memory.

**Executable Code Demonstration:**
```javascript
function triggerScope() {
  const secretKey = "super-secret-buffer";
  const err = new Error("Failed");
  // Force evaluation of stack trace string so V8 releases internal frame closures:
  void err.stack;
  return err;
}
console.log("Stack evaluated:", triggerScope().name);
```

#### Q78: How do you design an enterprise error catalog with centralized error codes and i18n localization?
**Conceptual Explanation:**
An enterprise error catalog maps unique string codes (e.g. `ERR_AUTH_EXPIRED`) to localized template strings. Custom domain error classes reference this catalog, enabling frontend clients to display translated messages without backend code changes.

**Executable Code Demonstration:**
```javascript
const ERROR_CATALOG = {
  ERR_INSUFFICIENT_FUNDS: {
    en: "You do not have sufficient balance ({balance})",
    es: "No tienes saldo suficiente ({balance})"
  }
};

function formatError(code, lang, params) {
  let template = ERROR_CATALOG[code]?.[lang] || "Unknown error";
  for (const [k, v] of Object.entries(params)) {
    template = template.replace(`{${k}}`, v);
  }
  return template;
}
console.log(formatError('ERR_INSUFFICIENT_FUNDS', 'es', { balance: '$5.00' }));
```

#### Q79: How do you handle errors across microservices using standardized RFC 7807 (Problem Details for HTTP APIs)?
**Conceptual Explanation:**
RFC 7807 defines a standard JSON schema (`application/problem+json`) for HTTP error responses: `type` (URI reference), `title` (summary), `status` (HTTP code), `detail` (explanation), and `instance` (URI of specific occurrence).

**Executable Code Demonstration:**
```javascript
function createRFC7807Response(status, title, detail, instance) {
  return {
    type: "https://api.example.com/errors/" + title.toLowerCase().replace(/\s+/g, '-'),
    title,
    status,
    detail,
    instance
  };
}
console.log(createRFC7807Response(404, "Order Not Found", "Order 123 does not exist.", "/orders/123"));
```

#### Q80: How do you preserve trace context (Correlation ID / W3C Traceparent) when errors propagate across services?
**Conceptual Explanation:**
Using Node.js `AsyncLocalStorage`, trace context (correlation ID, span ID) is propagated across asynchronous call chains. When an error occurs at any depth, the correlation ID is automatically injected into the error log without threading parameters through every function.

**Executable Code Demonstration:**
```javascript
const { AsyncLocalStorage } = require('async_hooks');
const als = new AsyncLocalStorage();

function logError(err) {
  const store = als.getStore();
  console.log("Logged error with TraceId:", store?.traceId, "-", err.message);
}

als.run({ traceId: "trace-abc-123" }, () => {
  logError(new Error("Database disconnected"));
});
```

#### Q81: How do you design a graceful degradation fallback when a downstream dependency fails?
**Conceptual Explanation:**
When an optional downstream service (e.g. personalized recommendations) fails, catch the error, log a warning metric, and return a fallback default (e.g. popular items) rather than failing the entire user request.

**Executable Code Demonstration:**
```javascript
async function getRecommendations(userId) {
  try {
    throw new Error("Recommendation ML engine down");
  } catch (err) {
    console.warn("ML engine failed, falling back to static popular items:", err.message);
    return ["Item 1", "Item 2", "Item 3"]; // Fallback data
  }
}
getRecommendations("usr_456").then(items => console.log("Delivered items:", items));
```

#### Q82: What is the Bulkhead pattern in distributed error handling?
**Conceptual Explanation:**
The Bulkhead pattern isolates system resources (e.g. separate thread pools, memory limits, connection pools) for different services. If one downstream service starts failing and hanging, its dedicated pool is exhausted without affecting other services.

**Executable Code Demonstration:**
```javascript
class Bulkhead {
  constructor(maxConcurrent) {
    this.maxConcurrent = maxConcurrent;
    this.active = 0;
  }
  async run(task) {
    if (this.active >= this.maxConcurrent) {
      throw new Error("Bulkhead capacity reached: Request rejected");
    }
    this.active++;
    try { return await task(); }
    finally { this.active--; }
  }
}
const authPool = new Bulkhead(2);
console.log("Bulkhead ready with capacity 2");
```

#### Q83: How do you implement a Chaos Engineering fault-injection interceptor to test error resiliency?
**Conceptual Explanation:**
By creating a middleware or decorator that randomly injects latency or synthetic errors based on a configured probability. This validates that fallback mechanisms, circuit breakers, and retries operate properly under simulated production stress.

**Executable Code Demonstration:**
```javascript
function withChaos(action, failureRate = 0.5) {
  return async (...args) => {
    if (Math.random() < failureRate) {
      throw new Error("CHAOS_INJECTION: Synthetic network partition");
    }
    return action(...args);
  };
}
const resilientAction = withChaos(() => "Real Data", 0.0);
resilientAction().then(res => console.log("Chaos action:", res));
```

#### Q84: How do you gracefully shut down a Node.js cluster when one worker process encounters a fatal error?
**Conceptual Explanation:**
When a worker encounters an `uncaughtException`, it should: (1) Notify the master process that it is disconnecting, (2) Stop accepting new connections via `server.close()`, (3) Allow existing in-flight connections to complete up to a strict timeout, and (4) Exit with code 1. The master process forks a replacement worker.

**Executable Code Demonstration:**
```javascript
function simulateWorkerShutdown() {
  console.log("1. Worker received fatal exception");
  console.log("2. Disconnecting from cluster IPC");
  console.log("3. Closing HTTP server");
  console.log("4. Scheduled exit in 3s fallback");
}
simulateWorkerShutdown();
```

#### Q85: How do you handle database connection pool exhaustion and reconnection retries?
**Conceptual Explanation:**
Configure connection pool acquisition timeouts. If acquiring a connection times out, wrap the acquisition in an exponential backoff retry loop. If retries fail, return a 503 Service Unavailable with a `Retry-After` HTTP header.

**Executable Code Demonstration:**
```javascript
async function acquireConnection(pool, maxAttempts = 3) {
  for (let i = 1; i <= maxAttempts; i++) {
    try {
      return { connId: "active_conn" }; // Simulate successful acquisition
    } catch (e) {
      if (i === maxAttempts) throw new Error("Pool exhausted");
      await new Promise(r => setTimeout(r, 100 * i));
    }
  }
}
acquireConnection({}).then(c => console.log("Acquired:", c.connId));
```

#### Q86: How do you monitor and alert on error rates using SLIs, SLOs, and Error Budgets?
**Conceptual Explanation:**
An SLI (Service Level Indicator) measures the percentage of successful requests: $\frac{\text{Successful Requests}}{\text{Total Requests}} \times 100\%$. An SLO (Service Level Objective, e.g. 99.9%) defines the target. The Error Budget is the allowable failure margin ($100\% - \text{SLO} = 0.1\%$). Centralized error monitoring tracks error consumption against this budget.

**Executable Code Demonstration:**
```javascript
function calculateErrorBudget(totalRequests, errorRequests, targetSLO = 0.999) {
  const actualSuccessRate = (totalRequests - errorRequests) / totalRequests;
  const budgetTotal = totalRequests * (1 - targetSLO);
  const budgetRemaining = budgetTotal - errorRequests;
  return { actualSuccessRate, budgetRemaining };
}
console.log("Budget analysis:", calculateErrorBudget(100000, 20, 0.999));
```

#### Q87: What is the difference between transient errors and permanent errors in queue processing (Dead Letter Queues)?
**Conceptual Explanation:**
**Transient Errors** (e.g. rate limit exceeded, temporary network blip) are likely to succeed upon retry; these are retried with backoff. **Permanent Errors** (e.g. malformed JSON payload, unknown user ID) will never succeed; these must be immediately routed to a Dead Letter Queue (DLQ) to prevent blocking the message queue.

**Executable Code Demonstration:**
```javascript
function routeQueueMessage(msg, error) {
  const isTransient = error.code === 'RATE_LIMIT_EXCEEDED';
  if (isTransient) {
    console.log("Scheduling retry with backoff for:", msg.id);
  } else {
    console.log("Moving malformed message to DLQ:", msg.id);
  }
}
routeQueueMessage({ id: 101 }, { code: 'INVALID_PAYLOAD' });
```

#### Q88: How do you handle schema validation errors with detailed path reporting (e.g. Zod / Joi errors)?
**Conceptual Explanation:**
Schema validation errors should capture the exact JSON path of invalid fields (e.g. `users[0].address.zipCode`) and return a structured list of issue descriptors, making it trivial for frontend clients or API consumers to highlight incorrect form fields.

**Executable Code Demonstration:**
```javascript
function validatePayload(payload) {
  const errors = [];
  if (!payload.email || !payload.email.includes('@')) {
    errors.push({ field: 'email', message: 'Valid email is required' });
  }
  if (!payload.age || payload.age < 18) {
    errors.push({ field: 'age', message: 'Must be 18 or older' });
  }
  return errors;
}
console.log("Validation Issues:", validatePayload({ email: 'bad-email', age: 16 }));
```

#### Q89: How do you test error handling code using Jest, Vitest, or Node test runner?
**Conceptual Explanation:**
Test error conditions explicitly by verifying: (1) That the function actually throws/rejects, (2) That the thrown error is an instance of the expected custom class, and (3) That error properties like `code`, `statusCode`, and `message` match expected values.

**Executable Code Demonstration:**
```javascript
const assert = require('assert');

function divide(a, b) {
  if (b === 0) throw new RangeError("Division by zero");
  return a / b;
}

// Unit test asserting error:
assert.throws(
  () => divide(10, 0),
  {
    name: 'RangeError',
    message: 'Division by zero'
  }
);
console.log("Error test assertion passed cleanly!");
```

#### Q90: How do you design an end-to-end telemetry pipeline from browser/server to OpenTelemetry and Datadog?
**Conceptual Explanation:**
In an end-to-end telemetry pipeline: (1) Errors are caught at centralized boundaries, (2) The current OpenTelemetry trace and span ID are attached, (3) PII and secrets are sanitized, (4) Errors are serialized to structured JSON, and (5) Exported via OTLP (OpenTelemetry Protocol) over HTTP/gRPC to monitoring collectors.

**Executable Code Demonstration:**
```javascript
function exportToOTel(error, spanContext) {
  const telemetryRecord = {
    timestamp: Date.now(),
    traceId: spanContext.traceId,
    spanId: spanContext.spanId,
    exception: {
      type: error.name,
      message: error.message,
      stacktrace: error.stack
    }
  };
  console.log("Exported OTel Exception Event:", telemetryRecord.traceId);
  return telemetryRecord;
}
exportToOTel(new Error("Telemetry test"), { traceId: "4bf92f3577b34da6a3ce929d0e0e4736", spanId: "00f067aa0ba902b7" });
```

---

## 10. 15 TRICKY OUTPUT PREDICTION PUZZLES WITH EXECUTION TRACES

### Puzzle 1: The Finally Return Override

```javascript
function test() {
  try {
    throw new Error("Initial Error");
  } catch (err) {
    return "From Catch";
  } finally {
    return "From Finally";
  }
}
console.log(test());
```

**Expected Output:**
```text
From Finally
```

**Step-by-Step Engine Execution Trace:**
1. The engine enters the `try` block and executes `throw new Error("Initial Error")`.
2. The engine catches the exception and transfers control to the `catch` block.
3. Inside `catch`, the engine evaluates `return "From Catch"`. It suspends the return action to execute the mandatory `finally` block.
4. Inside `finally`, the engine encounters `return "From Finally"`.
5. Per ECMA-262 completion record specification, a return or throw in `finally` overrides any pending completion record from `try` or `catch`.
6. "From Finally" is returned and logged.

### Puzzle 2: Finally Object Mutation vs Primitive Retention

```javascript
function testPrimitive() {
  let num = 10;
  try {
    return num;
  } finally {
    num = 20;
  }
}

function testObject() {
  const obj = { val: 10 };
  try {
    return obj;
  } finally {
    obj.val = 20;
  }
}

console.log(testPrimitive());
console.log(testObject().val);
```

**Expected Output:**
```text
10
20
```

**Step-by-Step Engine Execution Trace:**
1. In `testPrimitive`, `return num` evaluates the identifier `num` by value ($10$). The completion record stores the primitive value $10$. The `finally` block modifies `num` to $20$, but the return value was already captured as a primitive. Hence it returns $10$.
2. In `testObject`, `return obj` evaluates the identifier `obj` by reference (a pointer to the heap object). The completion record holds that reference.
3. The `finally` block mutates the property on the object referenced on the heap (`obj.val = 20`).
4. The caller receives the object reference whose heap property is now $20$.

### Puzzle 3: Triple Nested Try-Catch Exception Superseding

```javascript
function compute() {
  try {
    try {
      throw new Error("Error A");
    } finally {
      throw new Error("Error B");
    }
  } catch (err) {
    console.log(err.message);
  }
}
compute();
```

**Expected Output:**
```text
Error B
```

**Step-by-Step Engine Execution Trace:**
1. The inner `try` block throws "Error A".
2. Before the exception can unwind to an enclosing `catch`, the inner `finally` block must execute.
3. The inner `finally` block throws "Error B".
4. Per ECMAScript abrupt completion rules, when a `finally` block completes abruptly with an exception, the previous abrupt completion ("Error A") is completely abandoned and discarded.
5. "Error B" unwinds to the outer `catch` block, which logs "Error B".

### Puzzle 4: Catch Rethrow Suppressed by Finally Return

```javascript
function run() {
  try {
    try {
      throw new Error("Boom");
    } catch (e) {
      throw e; // Rethrowing!
    } finally {
      return "Silently Suppressed";
    }
  } catch (e) {
    return "Outer Caught";
  }
}
console.log(run());
```

**Expected Output:**
```text
Silently Suppressed
```

**Step-by-Step Engine Execution Trace:**
1. The inner `try` throws "Boom".
2. The inner `catch` rethrows "Boom". The pending completion is now an abrupt `throw` completion.
3. The inner `finally` executes. It encounters `return "Silently Suppressed"`.
4. An explicit `return` in `finally` transforms the abrupt completion from a throw to a normal return. The thrown exception is completely swallowed!
5. The outer `catch` is never reached; the function returns "Silently Suppressed".

### Puzzle 5: The Asynchronous Try/Catch Trap with Timers

```javascript
try {
  setTimeout(() => {
    throw new Error("Async failure");
  }, 0);
} catch (e) {
  console.log("Caught:", e.message);
}
console.log("Synchronous script completed");
```

**Expected Output:**
```text
Synchronous script completed
```

**Step-by-Step Engine Execution Trace:**
1. The engine enters the `try` block and invokes `setTimeout`.
2. The timer callback is scheduled on the Macrotask Queue for a future event loop tick.
3. The `try` block completes normally without any synchronous exception.
4. "Synchronous script completed" is logged to the console.
5. In a later tick of the event loop, the timer callback executes on an empty call stack.
6. The throw occurs without any enclosing `try/catch`, triggering an `uncaughtException` at the host environment level.

### Puzzle 6: Async Function Return vs Throw Without Await

```javascript
async function faulty() {
  throw new Error("Rejected");
}

async function caller() {
  try {
    return faulty(); // Note: NO await!
  } catch (e) {
    return "Caught error locally";
  }
}

caller()
  .then(res => console.log("Resolved:", res))
  .catch(err => console.log("Rejected externally:", err.message));
```

**Expected Output:**
```text
Rejected externally: Rejected
```

**Step-by-Step Engine Execution Trace:**
1. `caller()` enters `try`. It calls `faulty()`, which returns a rejected Promise.
2. Because there is NO `await` keyword before `faulty()`, the function returns the rejected Promise object itself directly.
3. Returning a rejected Promise is NOT a synchronous throw! Therefore the local `catch` block is completely bypassed.
4. The caller of `caller()` receives the rejected Promise, which bubbles to the external `.catch()` handler, logging "Rejected externally: Rejected".

### Puzzle 7: Returning with Await Inside Try/Catch

```javascript
async function faulty() {
  throw new Error("Rejected");
}

async function callerWithAwait() {
  try {
    return await faulty(); // Note: WITH await!
  } catch (e) {
    return "Caught error locally";
  }
}

callerWithAwait()
  .then(res => console.log("Resolved:", res));
```

**Expected Output:**
```text
Resolved: Caught error locally
```

**Step-by-Step Engine Execution Trace:**
1. `callerWithAwait()` awaits the Promise returned by `faulty()`.
2. The `await` operator unwraps the rejected Promise and synthesizes a synchronous exception at that exact instruction.
3. The local `catch (e)` block intercepts the exception!
4. The catch block returns the string "Caught error locally".
5. The async function resolves with this string.

### Puzzle 8: Promise Constructor Throw vs Reject

```javascript
const p = new Promise((resolve, reject) => {
  setTimeout(() => {
    resolve("Timer resolve");
  }, 10);
  throw new Error("Sync throw inside executor");
});

p.then(val => console.log("Value:", val))
 .catch(err => console.log("Catch:", err.message));
```

**Expected Output:**
```text
Catch: Sync throw inside executor
```

**Step-by-Step Engine Execution Trace:**
1. The Promise executor function executes synchronously upon instantiation.
2. `setTimeout` is queued.
3. Immediately afterwards, `throw new Error` is executed synchronously inside the executor.
4. Per the ECMAScript Promise specification, any synchronous exception thrown inside an executor is caught internally by the Promise constructor and converted into a rejected Promise.
5. The scheduled timer callback will later fire `resolve()`, but because the Promise already settled as rejected, the resolution is ignored (Promises settle at most once).
6. "Catch: Sync throw inside executor" is logged.

### Puzzle 9: Promise.all First Rejection Order

```javascript
const p1 = new Promise((_, reject) => setTimeout(() => reject(new Error("Slow reject (50ms)")), 50));
const p2 = new Promise((_, reject) => setTimeout(() => reject(new Error("Fast reject (10ms)")), 10));

Promise.all([p1, p2])
  .then(() => console.log("Success"))
  .catch(err => console.log("First error:", err.message));
```

**Expected Output:**
```text
First error: Fast reject (10ms)
```

**Step-by-Step Engine Execution Trace:**
1. Both promises are initialized concurrently.
2. `p2` rejects after 10ms.
3. `Promise.all` implements fail-fast semantics: the moment any promise rejects, the outer promise immediately rejects with that specific error.
4. The fast error ("Fast reject (10ms)") is delivered to `.catch()`.
5. When `p1` rejects 40ms later, its rejection is discarded because the `Promise.all` promise has already settled.

### Puzzle 10: Promise.any All-Fail Rejection

```javascript
const p1 = Promise.reject(new Error("Err 1"));
const p2 = Promise.reject(new Error("Err 2"));

Promise.any([p1, p2])
  .catch(err => {
    console.log("Is AggregateError:", err instanceof AggregateError);
    console.log("Error count:", err.errors.length);
    console.log("First cause:", err.errors[0].message);
  });
```

**Expected Output:**
```text
Is AggregateError: true
Error count: 2
First cause: Err 1
```

**Step-by-Step Engine Execution Trace:**
1. `Promise.any` awaits the first successful resolution.
2. Since both `p1` and `p2` reject, all input promises fail.
3. Per ES2021 specification, `Promise.any` rejects with an `AggregateError`.
4. Its `.errors` property contains the array of individual rejection reasons in the exact order of the original input array.
5. The properties are logged accordingly.

### Puzzle 11: Catch Identifier Scope vs Outer Scope

```javascript
let error = "Global Error";

try {
  throw "Local Error";
} catch (error) {
  var errorVar = "Var inside catch";
  console.log("Inside catch:", error);
}

console.log("Outside catch:", error);
console.log("Hoisted var:", errorVar);
```

**Expected Output:**
```text
Inside catch: Local Error
Outside catch: Global Error
Hoisted var: Var inside catch
```

**Step-by-Step Engine Execution Trace:**
1. The catch parameter `catch (error)` creates a block-scoped binding specifically for the catch block.
2. Inside the catch block, `error` shadows the outer `let error = "Global Error"`. It logs "Local Error".
3. `var errorVar` is hoisted to the enclosing function/global scope because `var` ignores block scope.
4. Outside the catch block, the outer `error` remains "Global Error".
5. The hoisted `errorVar` is accessible and prints "Var inside catch".

### Puzzle 12: Throwing In Finally After Return In Try

```javascript
function testFlow() {
  try {
    return 100;
  } finally {
    throw new Error("Override from finally");
  }
}

try {
  testFlow();
} catch (e) {
  console.log("Result:", e.message);
}
```

**Expected Output:**
```text
Result: Override from finally
```

**Step-by-Step Engine Execution Trace:**
1. The `try` block prepares a normal return completion with value $100$.
2. The `finally` block executes before the return can complete.
3. The `finally` block throws an `Error("Override from finally")`.
4. The abrupt throw completion record supersedes the return completion record.
5. The function throws rather than returning, and the outer catch intercepts and prints "Override from finally".

### Puzzle 13: Error Coercion and toString Protocol

```javascript
const err = new Error("Something broke");
err.name = "CustomFault";

console.log(String(err));
console.log(err + "");
```

**Expected Output:**
```text
CustomFault: Something broke
CustomFault: Something broke
```

**Step-by-Step Engine Execution Trace:**
1. When coerced to a string, the engine invokes `Error.prototype.toString()`.
2. Per the ECMAScript specification, `Error.prototype.toString()` checks `this.name` and `this.message`.
3. If `this.name` is undefined, it defaults to 'Error'. If `this.message` is undefined, it defaults to ''.
4. If both are defined, it returns `${name}: ${message}`.
5. Here, `this.name` is "CustomFault" and `this.message` is "Something broke", producing "CustomFault: Something broke".

### Puzzle 14: Promise Microtask Execution Order with Catch

```javascript
console.log("1");

Promise.resolve()
  .then(() => {
    console.log("2");
    throw new Error("Err");
  })
  .catch(() => {
    console.log("3");
  })
  .then(() => {
    console.log("4");
  });

console.log("5");
```

**Expected Output:**
```text
1
5
2
3
4
```

**Step-by-Step Engine Execution Trace:**
1. Synchronous log: "1" is printed.
2. `Promise.resolve()` queues its `.then()` callback onto the Microtask Queue.
3. Synchronous log: "5" is printed.
4. Synchronous call stack empties; the engine processes the Microtask Queue.
5. First `.then` runs: prints "2", throws "Err".
6. The rejection schedules the downstream `.catch()` callback as a new microtask.
7. The `.catch()` runs: prints "3" and resolves cleanly.
8. The final `.then()` runs: prints "4".

### Puzzle 15: Break Statement Inside Try With Finally

```javascript
function testLoop() {
  for (let i = 0; i < 3; i++) {
    try {
      if (i === 1) break;
      console.log("Loop:", i);
    } finally {
      console.log("Finally:", i);
    }
  }
}
testLoop();
```

**Expected Output:**
```text
Loop: 0
Finally: 0
Finally: 1
```

**Step-by-Step Engine Execution Trace:**
1. Iteration 0: `i === 0`. Prints "Loop: 0". The `finally` executes, printing "Finally: 0".
2. Iteration 1: `i === 1`. Hits `break`.
3. Even though `break` abruptly exits the loop, the enclosing `finally` block MUST execute before control is transferred.
4. "Finally: 1" is printed.
5. The break completes, terminating the loop. Iteration 2 never starts.

---

## 11. 4 PROGRESSIVE REAL-WORLD PROJECTS

### Project 1: Enterprise Centralized Error Dispatcher & Telemetry Hub
**Architecture & Design:**
In distributed microservices, errors originate from heterogeneous sources: raw database exceptions, third-party REST rejections, validation failures, and uncaught programmer bugs. This centralized dispatcher categorizes errors into operational vs. programmer errors, redacts sensitive PII (bearer tokens, passwords) from stack traces, records structured telemetry metrics, and serializes safe responses for client consumption.

```javascript
const assert = require('assert');

class TelemetryDispatcher {
  /**
   * @param {object} [options]
   * @param {boolean} [options.isProduction=true]
   */
  constructor(options = {}) {
    this.isProduction = options.isProduction ?? true;
    this.logs = [];
    this.metrics = { operational: 0, critical: 0 };
  }

  /**
   * Redacts sensitive PII and authorization headers from stack traces.
   * @param {string} stack
   * @returns {string}
   */
  sanitize(stack) {
    if (!stack || typeof stack !== 'string') return '';
    return stack
      .replace(/bearer\s+[a-zA-Z0-9_\-\.]+/gi, 'Bearer [REDACTED]')
      .replace(/password=[^&\s]+/gi, 'password=[REDACTED]');
  }

  /**
   * Ingests any error, dispatches to telemetry, and returns a client-safe response.
   * @param {Error|any} err
   * @param {object} [reqContext]
   * @returns {object}
   */
  dispatch(err, reqContext = {}) {
    const isOperational = Boolean(err && err.isOperational);
    const statusCode = (err && err.statusCode) || 500;

    if (isOperational) {
      this.metrics.operational++;
    } else {
      this.metrics.critical++;
    }

    const telemetryRecord = {
      timestamp: new Date().toISOString(),
      correlationId: reqContext.correlationId || 'N/A',
      name: err?.name || 'Error',
      message: err?.message || String(err),
      statusCode,
      isOperational,
      stack: this.sanitize(err?.stack),
      cause: err?.cause ? (err.cause.message || String(err.cause)) : undefined
    };

    this.logs.push(telemetryRecord);

    // Format client-safe error response (censor internal messages in production):
    return {
      success: false,
      error: {
        code: err?.errorCode || 'INTERNAL_ERROR',
        message: isOperational || !this.isProduction 
          ? (err?.message || 'Error occurred') 
          : 'An internal error occurred',
        ...(isOperational && err?.details ? { details: err.details } : {})
      }
    };
  }
}

// -------------------------------------------------------------
// VERIFICATION ASSERTIONS (PROJECT 1)
// -------------------------------------------------------------
const dispatcher = new TelemetryDispatcher({ isProduction: true });

// Case 1: Operational validation error
const opErr = new Error("Invalid email format");
opErr.isOperational = true;
opErr.errorCode = "INVALID_EMAIL";
opErr.details = { field: "email", received: "not-an-email" };

const clientRes1 = dispatcher.dispatch(opErr, { correlationId: "req-001" });
assert.strictEqual(clientRes1.error.code, "INVALID_EMAIL");
assert.strictEqual(clientRes1.error.message, "Invalid email format");
assert.strictEqual(clientRes1.error.details.field, "email");
assert.strictEqual(dispatcher.metrics.operational, 1);

// Case 2: Unhandled programmer bug (sanitized message in production)
const progErr = new TypeError("Cannot read properties of undefined (reading 'token')");
progErr.stack = "Error at Object.<anonymous> (token=bearer eyJhbGci, password=secret123)";

const clientRes2 = dispatcher.dispatch(progErr, { correlationId: "req-002" });
assert.strictEqual(clientRes2.error.code, "INTERNAL_ERROR");
assert.strictEqual(clientRes2.error.message, "An internal error occurred"); // Censored!
assert.strictEqual(dispatcher.metrics.critical, 1);
assert.strictEqual(dispatcher.logs[1].stack.includes("secret123"), false); // Redacted!
assert.strictEqual(dispatcher.logs[1].stack.includes("[REDACTED]"), true);

console.log("PROJECT 1: Centralized Error Dispatcher verified successfully!");
```

---

### Project 2: Resilient Circuit Breaker with Error Fallback Pipelines
**Architecture & Design:**
When a downstream microservice or database starts failing, continuing to bombard it with requests leads to resource exhaustion and cascading cluster failures. This industrial Circuit Breaker manages the finite state machine (`CLOSED` -> `OPEN` -> `HALF-OPEN`), tracks consecutive failure thresholds, activates fast-fail fallback pipelines during open states, and executes automatic probe trials during cooldown windows.

```javascript
const assert = require('assert');

class CircuitBreaker {
  /**
   * @param {object} [options]
   * @param {number} [options.failureThreshold=3]
   * @param {number} [options.cooldownMs=100]
   */
  constructor(options = {}) {
    this.failureThreshold = options.failureThreshold || 3;
    this.cooldownMs = options.cooldownMs || 100;
    this.state = 'CLOSED'; // 'CLOSED' | 'OPEN' | 'HALF-OPEN'
    this.failures = 0;
    this.nextAttempt = 0;
  }

  /**
   * Executes an asynchronous task protected by the circuit breaker.
   * @template T
   * @param {() => Promise<T>} action
   * @param {(err: Error) => Promise<T>|T} [fallback]
   * @returns {Promise<T>}
   */
  async execute(action, fallback = null) {
    if (this.state === 'OPEN') {
      if (Date.now() < this.nextAttempt) {
        if (fallback) return fallback(new Error("Circuit breaker is OPEN: fast fail"));
        throw new Error("CIRCUIT_OPEN: Rapid failure protection active");
      }
      this.state = 'HALF-OPEN';
    }

    try {
      const result = await action();
      this.state = 'CLOSED';
      this.failures = 0;
      return result;
    } catch (err) {
      this.failures++;
      if (this.failures >= this.failureThreshold || this.state === 'HALF-OPEN') {
        this.state = 'OPEN';
        this.nextAttempt = Date.now() + this.cooldownMs;
      }
      if (fallback) return fallback(err);
      throw err;
    }
  }
}

// -------------------------------------------------------------
// VERIFICATION ASSERTIONS (PROJECT 2)
// -------------------------------------------------------------
(async () => {
  const breaker = new CircuitBreaker({ failureThreshold: 2, cooldownMs: 50 });
  const failingAction = async () => { throw new Error("Service down"); };

  // Failure 1: Still closed
  await breaker.execute(failingAction, () => "Fallback 1");
  assert.strictEqual(breaker.state, 'CLOSED');
  assert.strictEqual(breaker.failures, 1);

  // Failure 2: Trips circuit breaker to OPEN
  await breaker.execute(failingAction, () => "Fallback 2");
  assert.strictEqual(breaker.state, 'OPEN');

  // While OPEN: Immediate fast-fail without executing action
  let executedActionWhileOpen = false;
  const fastFailRes = await breaker.execute(
    async () => { executedActionWhileOpen = true; },
    () => "Open State Fallback"
  );
  assert.strictEqual(fastFailRes, "Open State Fallback");
  assert.strictEqual(executedActionWhileOpen, false);

  // Wait for cooldown window (60ms > 50ms)
  await new Promise(r => setTimeout(r, 60));

  // Trial request in HALF-OPEN state succeeds and resets breaker:
  const recoveredRes = await breaker.execute(async () => "Healthy Data");
  assert.strictEqual(recoveredRes, "Healthy Data");
  assert.strictEqual(breaker.state, 'CLOSED');
  assert.strictEqual(breaker.failures, 0);

  console.log("PROJECT 2: Resilient Circuit Breaker verified successfully!");
})();
```

---

### Project 3: Production Graceful Shutdown & Unhandled Exception Manager
**Architecture & Design:**
Node.js processes must never terminate abruptly leaving open database connections, truncated file writes, or orphaned child processes. This manager registers listeners for `uncaughtException`, `unhandledRejection`, and termination signals (`SIGTERM`, `SIGINT`). When an anomaly is detected, it orchestrates an orderly sequential teardown of all registered resources within a strict hard timeout window.

```javascript
const assert = require('assert');

class GracefulShutdownManager {
  /**
   * @param {object} [options]
   * @param {number} [options.timeoutMs=1000]
   */
  constructor(options = {}) {
    this.timeoutMs = options.timeoutMs || 1000;
    this.cleanupTasks = [];
    this.isShuttingDown = false;
  }

  /**
   * Registers a cleanup hook.
   * @param {string} name
   * @param {() => Promise<void>|void} fn
   */
  addCleanupTask(name, fn) {
    this.cleanupTasks.push({ name, fn });
  }

  /**
   * Initiates graceful teardown of all registered resources.
   * @param {string} reason
   * @returns {Promise<Array<{ name: string, status: string, error?: string }>>}
   */
  async triggerShutdown(reason) {
    if (this.isShuttingDown) return [];
    this.isShuttingDown = true;

    const results = [];
    for (const task of this.cleanupTasks) {
      try {
        await task.fn();
        results.push({ name: task.name, status: 'fulfilled' });
      } catch (err) {
        results.push({ name: task.name, status: 'rejected', error: err.message });
      }
    }
    return results;
  }
}

// -------------------------------------------------------------
// VERIFICATION ASSERTIONS (PROJECT 3)
// -------------------------------------------------------------
(async () => {
  const manager = new GracefulShutdownManager({ timeoutMs: 500 });
  let dbDrained = false;
  let serverClosed = false;

  manager.addCleanupTask('database_pool', async () => { dbDrained = true; });
  manager.addCleanupTask('http_server', async () => { serverClosed = true; });

  const results = await manager.triggerShutdown('uncaughtException');
  assert.strictEqual(dbDrained, true);
  assert.strictEqual(serverClosed, true);
  assert.strictEqual(results.length, 2);
  assert.strictEqual(results[0].status, 'fulfilled');
  assert.strictEqual(results[1].status, 'fulfilled');

  console.log("PROJECT 3: Graceful Shutdown Manager verified successfully!");
})();
```

---

### Project 4: Go-Style Result/Either Monad Functional Error Handler
**Architecture & Design:**
Traditional exception handling disrupts linear execution flow and requires deep blocks. The functional `Result<T, E>` monad represents operations as values that can be passed, mapped, flat-mapped, and matched. It enforces exhaustive error handling at development time without unexpected runtime crashes.

```javascript
const assert = require('assert');

class Result {
  /**
   * @private
   * @param {boolean} isSuccess
   * @param {any} value
   * @param {Error|null} error
   */
  constructor(isSuccess, value, error) {
    this._isSuccess = isSuccess;
    this._value = value;
    this._error = error;
    Object.freeze(this);
  }

  static ok(val) {
    return new Result(true, val, null);
  }

  static err(err) {
    const errorObj = err instanceof Error ? err : new Error(String(err));
    return new Result(false, null, errorObj);
  }

  /**
   * Safely converts any Promise into a Result monad.
   * @template T
   * @param {Promise<T>} promise
   * @returns {Promise<Result>}
   */
  static async fromPromise(promise) {
    try {
      const val = await promise;
      return Result.ok(val);
    } catch (e) {
      return Result.err(e);
    }
  }

  isOk() { return this._isSuccess; }
  isErr() { return !this._isSuccess; }

  unwrap() {
    if (!this._isSuccess) throw this._error;
    return this._value;
  }

  unwrapOr(fallback) {
    return this._isSuccess ? this._value : fallback;
  }

  map(fn) {
    if (!this._isSuccess) return this;
    try {
      return Result.ok(fn(this._value));
    } catch (e) {
      return Result.err(e);
    }
  }

  flatMap(fn) {
    if (!this._isSuccess) return this;
    try {
      return fn(this._value);
    } catch (e) {
      return Result.err(e);
    }
  }

  match({ onOk, onErr }) {
    return this._isSuccess ? onOk(this._value) : onErr(this._error);
  }
}

// -------------------------------------------------------------
// VERIFICATION ASSERTIONS (PROJECT 4)
// -------------------------------------------------------------
// Test 1: Successful mapping pipeline
const okChain = Result.ok(25)
  .map(n => n * 2)
  .map(n => `Result: ${n}`);
assert.strictEqual(okChain.isOk(), true);
assert.strictEqual(okChain.unwrap(), "Result: 50");

// Test 2: Error short-circuiting
const errChain = Result.err(new Error("Initial calculation error"))
  .map(n => n * 10); // Bypassed
assert.strictEqual(errChain.isErr(), true);
assert.strictEqual(errChain.unwrapOr(999), 999);

// Test 3: Pattern matching
const matchOutput = okChain.match({
  onOk: val => `Success -> ${val}`,
  onErr: err => `Failed -> ${err.message}`
});
assert.strictEqual(matchOutput, "Success -> Result: 50");

console.log("PROJECT 4: Go-Style Result Monad verified successfully!");
```

---

## 12. PRODUCTION BEST PRACTICES: DOS AND DON'TS MATRIX

| Category | DO (Production Standard) | DON'T (Critical Anti-Pattern) |
| :--- | :--- | :--- |
| **Instantiation** | Always throw an instance of `Error` or a subclass. | Never `throw "string"`, `throw 404`, or `throw {}`. |
| **Error Subclassing** | Set `this.name`, call `super(message, options)`, and invoke `Error.captureStackTrace`. | Don't create pseudo-error objects without prototypal inheritance. |
| **Stack Pollution** | Trim internal frames using `Error.captureStackTrace(this, Constructor)`. | Don't expose internal framework constructor frames to users. |
| **Swallowing Errors** | Catch only errors you can handle or gracefully degrade. | Never write empty `catch (e) {}` (Pokemon exception handler). |
| **Finally Blocks** | Use `finally` purely for deterministic resource cleanup (closing handles, sockets). | Never write `return` or `throw` inside `finally`. |
| **Logging Scope** | Log errors at architectural boundaries (centralized middleware or top-level worker). | Don't log and rethrow at every single internal function layer. |
| **PII & Secrets** | Sanitize authorization tokens, passwords, and API keys before logging stack traces. | Don't emit raw request headers or database query strings with passwords. |
| **Error Causality** | Use `new Error(msg, { cause: originalErr })` to preserve the root incident. | Don't overwrite the original error with a new one, losing the root stack. |
| **Operational vs Bugs** | Flag expected runtime failures with `isOperational = true`. | Don't treat unhandled `TypeErrors` as benign operational errors. |
| **Uncaught Exceptions** | Log, flush streams, trigger graceful connection draining, and exit the process. | Never continue server execution after an unhandled `uncaughtException`. |
| **Async Rejections** | Always attach a `.catch()` or use `try...catch` with `await`. | Don't fire-and-forget unmonitored promises without catching rejections. |
| **Streams** | Use `stream.pipeline()` for automated cleanup on mid-stream failure. | Don't chain raw `.pipe()` in production; failed intermediate streams leak. |
| **Client Responses** | Mask internal database errors with generic messages in production. | Never return raw stack traces or internal query strings to client browsers. |
| **Client Scripts (CORS)**| Set `crossorigin="anonymous"` on CDN script tags to unmask 'Script Error.'. | Don't ignore 'Script Error.' in client-side telemetry dashboards. |
| **Circuit Breakers** | Wrap external microservices with circuit breakers to fail fast when downstream is dead. | Don't let infinite request retries overwhelm struggling external APIs. |

---

## 13. REAL-WORLD CASE STUDY: THE SILENT SWALLOWED EXCEPTION OUTAGE

### Incident Summary
- **Organization**: Global FinTech Clearing House
- **Impact Duration**: 4 Hours 32 Minutes
- **Direct Financial Impact**: $1.2M in failed settlement adjustments and delayed ledger reconciliation
- **Incident Classification**: P1 / Critical Production Outage

### Timeline of Failure
1. **02:15 UTC**: A scheduled database migration added a strict `NOT NULL` constraint on a foreign key `settlement_account_id` in the transactions table.
2. **02:20 UTC**: An automated microservice began processing batch payroll disbursements. Due to legacy formatting, certain transactions lacked the `settlement_account_id` field.
3. **02:21 UTC**: The database driver rejected the insert, throwing a SQL constraint violation error.
4. **02:22 UTC**: Inside the batch processing loop, an engineer had implemented the following code:
   ```javascript
   // Legacy code:
   try {
     await db.insertTransaction(tx);
   } catch (err) {
     // Intended: Skip duplicates during idempotent retries
     // Actual: Swallowed ALL database errors silently!
   }
   ```
5. **04:45 UTC**: Internal accounting triggered an alert: thousands of payroll records were marked "COMPLETED" in memory, yet zero corresponding transaction records existed in the relational database!
6. **06:53 UTC**: Engineers discovered the empty catch block that had discarded thousands of SQL constraint exceptions without writing a single log line or metric.

### Root Cause Analysis (5 Whys)
1. *Why did transactions vanish?* The database rejected them due to a schema constraint violation.
2. *Why didn't the system retry or alert?* The exception was caught by an empty catch block.
3. *Why was the catch block empty?* The author assumed the only possible error was a benign duplicate key collision.
4. *Why wasn't the error inspected?* The catch clause lacked error type discrimination.
5. *Why wasn't this caught in CI?* Unit tests mocked the database layer and did not test real schema constraint failures.

### Permanent Architectural Remediation
1. **ESLint Static Rule**: Enforce `no-empty` and `@typescript-eslint/no-unused-vars` with zero warnings permitted.
2. **Centralized Domain Errors**: All database queries must run through a typed repository layer that converts low-level SQL errors into explicit domain results.
3. **Automated Dead Letter Queue (DLQ)**: Any failed transaction is automatically routed to an SQS/Kafka DLQ with full payload and error causality chain intact.

---

## 14. 75 PRACTICE EXERCISES ACROSS 4 TIERS

### Tier 1: Syntax & Catching (Drills 1 to 20)
1. Write a function `safeJSON(str)` that returns `[null, parsed]` on success and `[err, null]` on invalid JSON.
2. Create a `try...catch...finally` block that demonstrates that `finally` runs even after a return in `try`.
3. Demonstrate Optional Catch Binding by writing an `isValidDateString(str)` function without naming the error variable.
4. Trigger a native `ReferenceError` and catch it, printing its `name` and `message`.
5. Trigger a native `RangeError` using invalid array length and catch it.
6. Trigger a native `URIError` using `decodeURIComponent` with an invalid percentage string.
7. Write a function that demonstrates throwing a custom `TypeError` when an argument is not a function.
8. Create a `try...finally` construct (without catch) and catch the bubbling error in an outer scope.
9. Demonstrate what happens when an error is thrown inside a `finally` block.
10. Write code demonstrating the "return override trap" in a `finally` block.
11. Inspect the non-enumerable properties of a standard `Error` instance using `Object.getOwnPropertyNames`.
12. Write a function `isError(val)` that reliably tests if an unknown value is an Error instance.
13. Demonstrate creating an `AggregateError` manually with three distinct sub-errors.
14. Iterate over the `.errors` array of an `AggregateError` and print each inner message.
15. Demonstrate why synchronous `try...catch` cannot catch an error thrown inside a `setImmediate` callback.
16. Implement proper error handling inside a `setTimeout` callback by wrapping its inner body.
17. Write a Promise chain that catches an error thrown in the second `.then()` handler.
18. Show how to recover from an error in a Promise chain by returning a fallback value in `.catch()`.
19. Demonstrate that `Promise.prototype.catch` returns a new Promise.
20. Demonstrate throwing a custom error with a numeric `status` property attached.

### Tier 2: Custom Classes & Chaining (Drills 21 to 40)
21. Implement an `AppError` base class extending `Error` with `statusCode`, `errorCode`, and `isOperational`.
22. Ensure `AppError` sets `this.name = this.constructor.name` automatically for all subclasses.
23. Implement a `NotFoundError` subclass that formats a message: `Resource '${resource}' id '${id}' not found`.
24. Implement a `ValidationError` subclass that accepts an array of invalid fields.
25. Implement an `UnauthorizedError` subclass defaulting to HTTP status 401.
26. Demonstrate ES2022 error chaining by wrapping a `TypeError` inside a `ValidationError` using `{ cause }`.
27. Write a recursive function `getRootCause(err)` that traverses `.cause` references to find the original root error.
28. Write a function `printErrorChain(err)` that prints an indentation tree of all nested causes.
29. Implement an `Error.captureStackTrace` call inside a custom class constructor and verify constructor frame omission.
30. Write a custom `toJSON()` method on an error subclass to serialize it for API responses.
31. Create a custom `DatabaseTimeoutError` class with query metadata.
32. Implement a safe wrapper around `eval()` that converts any thrown error into an `EvalExecutionError`.
33. Create a custom `RateLimitError` containing `retryAfterSeconds` and `limit` attributes.
34. Implement a function `rethrowUnless(err, ErrorClass)` that only swallows errors matching `ErrorClass`.
35. Create an error class that overrides `toString()` to output a formatted terminal banner.
36. Create a custom error registry that registers error codes and prevents duplicate code registration.
37. Implement an error class `PaymentGatewayError` that stores raw gateway transaction response codes.
38. Write a function that converts any non-Error thrown value (string/number) into a standard `Error` instance.
39. Implement an error hierarchy for a file parser: `ParserError` -> `HeaderError`, `RowError`, `ChecksumError`.
40. Write a utility that attaches runtime environment metadata (Node version, platform, memory usage) to an error.

### Tier 3: Async & Process Resiliency (Drills 41 to 60)
41. Write an `async` function with a `try...catch` block that awaits two promises in sequence.
42. Demonstrate the difference between `return promise` and `return await promise` inside a `try...catch`.
43. Implement an async retry helper `retry(fn, maxRetries, delayMs)` with linear delay.
44. Implement an async retry helper with exponential backoff and randomized jitter.
45. Write a promise timeout utility `withTimeout(promise, ms)` that cleanly rejects on timeout.
46. Create an `EventEmitter` instance and demonstrate listening to the `'error'` event.
47. Demonstrate the unhandled `'error'` event crash behavior of an `EventEmitter`.
48. Write a safe `EventEmitter` wrapper that automatically attaches a no-op or logging listener to `'error'`.
49. Connect two Node.js streams using `stream.pipeline` and verify error handling when the destination stream fails.
50. Implement an `AbortController` timeout that aborts a long-running fetch after 200ms.
51. Write an async error boundary that catches errors in an async worker loop and prevents worker death.
52. Create an `AsyncLocalStorage` context that injects a correlation ID into all error logs created in that context.
53. Implement a process-level `unhandledRejection` listener that logs the error reason and promise.
54. Implement a graceful shutdown handler that drains a simulated database pool when `SIGTERM` is received.
55. Write a unit test that verifies that an async function rejects with a specific error type.
56. Create a batch processor that uses `Promise.allSettled` and partitions results into successes and failures.
57. Write a function that races multiple promises using `Promise.any` and extracts individual errors on failure.
58. Implement a throttled error reporter that limits logging the same error message to once every 10 seconds.
59. Implement a safe file reader that returns a fallback string if the file does not exist, but throws on permission denial.
60. Write a helper that checks if an error is an operational network disconnect (`ECONNRESET`, `ETIMEDOUT`).

### Tier 4: Architectural Fault Tolerance & Monads (Drills 61 to 75)
61. Implement a complete `Result<T, E>` class with `ok`, `err`, `map`, `flatMap`, and `unwrapOr`.
62. Add a `fromPromise` static factory method to the `Result` class.
63. Implement an `Either<L, R>` monad with `isLeft`, `isRight`, `left`, and `right`.
64. Implement a 3-state Circuit Breaker (`CLOSED`, `OPEN`, `HALF-OPEN`) with configurable failure threshold.
65. Add a fallback execution pipeline to the Circuit Breaker.
66. Write an Express/Fastify-style 4-argument error-handling middleware with correlation ID extraction.
67. Implement a stack trace sanitizer that strips OAuth tokens and database passwords via regex.
68. Write a function that parses a V8 stack trace string into structured `CallFrame` objects.
69. Implement a Bulkhead concurrency limiter that rejects calls when the concurrency pool is full.
70. Create a Dead Letter Queue (DLQ) dispatcher that moves permanently failing messages to a secondary store.
71. Write an RFC 7807 problem details serializer that formats API error responses.
72. Implement a chaos engineering decorator that injects artificial failures with a 20% probability.
73. Write a health check endpoint evaluator that returns status 503 if any critical subsystem fails.
74. Implement a structured logging formatter that formats errors as Datadog/Elasticsearch JSON.
75. Create an end-to-end resilient microservice request orchestrator combining Circuit Breaker, Timeout, and Retry.

---

## 15. MODULE SUMMARY & KEY INVARIANTS

1. **Exceptions Halt Sequential Flow**: When an exception is thrown, normal execution halts immediately and the engine unwinds the call stack until an enclosing `catch` block is encountered.
2. **The Finally Invariant**: A `finally` block is guaranteed to execute. Never return or throw from a `finally` block, as it destroys any pending completion record from `try` or `catch`.
3. **Always Throw Error Objects**: Throwing strings, numbers, or plain dictionaries prevents stack trace capture, breaks error classification, and degrades observability.
4. **V8 Stack Capture**: Stack traces are snapshots of the call stack allocated when `new Error()` is called. Use `Error.captureStackTrace(this, this.constructor)` in custom error classes to omit internal implementation frames.
5. **Preserve Causal History**: When wrapping lower-level exceptions into high-level domain errors, always provide `{ cause: originalError }` to maintain end-to-end debugging telemetry.
6. **Async Error Boundaries**: Synchronous `try...catch` cannot catch exceptions thrown inside asynchronous callbacks scheduled for future turns of the event loop. Always use `await` inside `try...catch` or handle via Promise `.catch()`.
7. **Crash and Restart on Programmer Bugs**: Never attempt to keep a Node.js process running after an `uncaughtException`. Corrupted heap and unreleased locks require immediate graceful shutdown and supervisor restart.
8. **Operational vs Programmer Distinction**: Operational errors are predictable runtime conditions to be handled gracefully. Programmer errors are coding bugs that must be surfaced, alerted, and fixed.
