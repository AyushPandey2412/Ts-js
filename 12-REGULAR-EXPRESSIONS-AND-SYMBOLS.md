# MODULE 12 — REGULAR EXPRESSIONS, SYMBOLS & METAPROGRAMMING
## The Exhaustive Engineering Guide from V8 Irregexp Bytecode to Catastrophic Backtracking (ReDoS) Defense, Well-Known Symbols, and Metaprogramming Protocols

---

## TABLE OF CONTENTS
- [00. How to Use This Module & Conceptual Mind Map](#00-how-to-use-this-module--conceptual-mind-map)
- [01. The Genesis: Text Processing & Unique Identifiers](#01-the-genesis-text-processing--unique-identifiers)
  - [1.1 The Limitations of String Manipulation & Fragile Splitting](#11-the-limitations-of-string-manipulation--fragile-splitting)
  - [1.2 The Property Name Collision Crisis & The Need for Symbols](#12-the-property-name-collision-crisis--the-need-for-symbols)
- [02. Regular Expressions: Syntax, Engine Mechanics & Flags](#02-regular-expressions-syntax-engine-mechanics--flags)
  - [2.1 The Complete Suite of ECMAScript RegExp Flags (`g`, `i`, `m`, `s`, `u`, `y`, `d`, `v`)](#21-the-complete-suite-of-ecmascript-regexp-flags-g-i-m-s-u-y-d-v)
  - [2.2 Character Classes, Negations, Boundaries & Unicode Property Escapes](#22-character-classes-negations-boundaries--unicode-property-escapes)
  - [2.3 Quantifiers: Greedy vs. Lazy (Reluctant) vs. Possessive Emulation](#23-quantifiers-greedy-vs-lazy-reluctant-vs-possessive-emulation)
  - [2.4 Grouping & Captures: Capturing, Non-Capturing & Named Capture Groups](#24-grouping--captures-capturing-non-capturing--named-capture-groups)
  - [2.5 Assertions: Lookahead & Lookbehind (Positive & Negative)](#25-assertions-lookahead--lookbehind-positive--negative)
  - [2.6 String vs. RegExp API Protocols (`test`, `exec`, `match`, `matchAll`, `search`, `replace`, `replaceAll`, `split`)](#26-string-vs-regexp-api-protocols-test-exec-match-matchall-search-replace-replaceall-split)
  - [2.7 The `lastIndex` Mutation Trap on Global & Sticky RegExps](#27-the-lastindex-mutation-trap-on-global--sticky-regexps)
- [03. V8 Irregexp Engine Internals & Catastrophic Backtracking (ReDoS)](#03-v8-irregexp-engine-internals--catastrophic-backtracking-redos)
  - [3.1 How V8 Irregexp Compiles Patterns to Native Machine Code](#31-how-v8-irregexp-compiles-patterns-to-native-machine-code)
  - [3.2 The Mechanics of Catastrophic Backtracking (NFA State Explosion)](#32-the-mechanics-of-catastrophic-backtracking-nfa-state-explosion)
  - [3.3 Auditing Patterns for Vulnerabilities & ReDoS Hardening](#33-auditing-patterns-for-vulnerabilities--redos-hardening)
- [04. The Symbol Primitive & Global Symbol Registry](#04-the-symbol-primitive--global-symbol-registry)
  - [4.1 Symbol Creation, Description & Immutability](#41-symbol-creation-description--immutability)
  - [4.2 Local Symbols vs. The Global Symbol Registry (`Symbol.for` / `Symbol.keyFor`)](#42-local-symbols-vs-the-global-symbol-registry-symbolfor--symbolkeyfor)
  - [4.3 Property Reflection: `getOwnPropertySymbols()` vs. `Reflect.ownKeys()` vs. `Object.keys()`](#43-property-reflection-getownpropertysymbols-vs-reflectownkeys-vs-objectkeys)
- [05. Well-Known Symbols & Engine Metaprogramming Hooks](#05-well-known-symbols--engine-metaprogramming-hooks)
  - [5.1 `Symbol.iterator` & `Symbol.asyncIterator` Protocols](#51-symboliterator--symbolasynciterator-protocols)
  - [5.2 `Symbol.toPrimitive`: Mastering Type Coercion Hints](#52-symboltoprimitive-mastering-type-coercion-hints)
  - [5.3 `Symbol.toStringTag`: Customizing Object Representation](#53-symboltostringtag-customizing-object-representation)
  - [5.4 `Symbol.hasInstance`: Customizing the `instanceof` Protocol](#54-symbolhasinstance-customizing-the-instanceof-protocol)
  - [5.5 `Symbol.species`: Controlling Derived Object Constructors](#55-symbolspecies-controlling-derived-object-constructors)
  - [5.6 `Symbol.isConcatSpreadable` & Array Flattening Control](#56-symbolisconcatspreadable--array-flattening-control)
  - [5.7 Custom RegExp Match Protocols (`Symbol.match`, `replace`, `search`, `split`)](#57-custom-regexp-match-protocols-symbolmatch-replace-search-split)
- [06. Production Architectural Anti-Patterns](#06-production-architectural-anti-patterns)
  - [Anti-Pattern 1: Concurrent Sharing of Global / Sticky Regex Instances](#anti-pattern-1-concurrent-sharing-of-global--sticky-regex-instances)
  - [Anti-Pattern 2: Unescaped Dynamic User Input in `new RegExp()`](#anti-pattern-2-unescaped-dynamic-user-input-in-new-regexp)
- [07. Architectural Decision Matrix: When to Use What](#07-architectural-decision-matrix-when-to-use-what)
- [08. Spec-Compliant Reference Algorithms & Polyfills](#08-spec-compliant-reference-algorithms--polyfills)
  - [Algorithm 1: Catastrophic Backtracking ReDoS Detector & Guard](#algorithm-1-catastrophic-backtracking-redos-detector--guard)
  - [Algorithm 2: Spec-Compliant Safe RegExp Escape Utility (`escapeRegExp`)](#algorithm-2-spec-compliant-safe-regexp-escape-utility-escaperegexp)
  - [Algorithm 3: Metaprogrammed Iterable Collection with `Symbol.iterator`](#algorithm-3-metaprogrammed-iterable-collection-with-symboliterator)
  - [Algorithm 4: Industrial Type Coercion Protocol with `Symbol.toPrimitive`](#algorithm-4-industrial-type-coercion-protocol-with-symboltoprimitive)
- [09. 90 Comprehensive Interview Questions & Detailed Answers](#09-90-comprehensive-interview-questions--detailed-answers)
  - [09.1 Beginner Tier (Questions 1 to 20)](#091-beginner-tier-questions-1-to-20)
  - [09.2 Intermediate Tier (Questions 21 to 45)](#092-intermediate-tier-questions-21-to-45)
  - [09.3 Advanced Tier (Questions 46 to 70)](#093-advanced-tier-questions-46-to-70)
  - [09.4 Senior & Staff Tier (Questions 71 to 90)](#094-senior--staff-tier-questions-71-to-90)
- [10. 15 Tricky Output Prediction Puzzles with Execution Traces](#10-15-tricky-output-prediction-puzzles-with-execution-traces)
- [11. 4 Progressive Real-World Projects](#11-4-progressive-real-world-projects)
  - [Project 1: Enterprise Log Parser & Anomaly Detection Engine](#project-1-enterprise-log-parser--anomaly-detection-engine)
  - [Project 2: ReDoS-Resilient Markdown Tokenizer & Lexer](#project-2-redos-resilient-markdown-tokenizer--lexer)
  - [Project 3: Metaprogrammed Domain Entity with Well-Known Symbols](#project-3-metaprogrammed-domain-entity-with-well-known-symbols)
  - [Project 4: High-Performance PII & Sensitive Data Redaction Engine](#project-4-high-performance-pii--sensitive-data-redaction-engine)
- [12. Production Best Practices: DOs and DON'Ts Matrix](#12-production-best-practices-dos-and-donts-matrix)
- [13. Real-World Case Study: The Cloudflare 2019 Global ReDoS Outage](#13-real-world-case-study-the-cloudflare-2019-global-redos-outage)
- [14. 75 Practice Exercises Across 4 Tiers](#14-75-practice-exercises-across-4-tiers)
- [15. Module Summary & Key Invariants](#15-module-summary--key-invariants)

---

## 00. HOW TO USE THIS MODULE & CONCEPTUAL MIND MAP

### 🧠 The Core Architectural Invariant
> **The Dual Metaprogramming Invariant**: JavaScript provides two orthogonal systems for low-level metaprogramming and pattern dispatch:
> 1. **V8 Irregexp Engine**: Compiles regular expressions into native bytecode and specialized assembly to execute text pattern recognition, subject to non-deterministic finite automaton (NFA) backtracking constraints.
> 2. **Symbols & Well-Known Engine Protocols**: Symbols are unique, immutable primitive identifiers that prevent property collisions and serve as internal engine dispatch hooks (`Symbol.iterator`, `Symbol.toPrimitive`, `Symbol.hasInstance`) enabling developers to override fundamental JavaScript runtime behaviors.

```text
┌─────────────────────────────────────────────────────────────────────────────┐
│                 REGEXP & SYMBOLS ENGINE ARCHITECTURE                        │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│   Source Pattern /expr/flags ───▶ V8 Irregexp ───▶ Bytecode / JIT Machine   │
│                                                     (State Machine & NFA)   │
│                                                                             │
│   Symbol("unique") ───────────────▶ Immutable Primitive Identifier         │
│   Symbol.for("globalKey") ────────▶ Global Symbol Registry Slot            │
│   Symbol.<wellKnownHook> ─────────▶ Overrides Runtime Behavior             │
│                                     (Iteration, Coercion, Instance Checks)  │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 01. THE GENESIS: TEXT PROCESSING & UNIQUE IDENTIFIERS

### 1.1 The Limitations of String Manipulation & Fragile Splitting
Early JavaScript text processing was limited to crude methods like `indexOf`, `slice`, and `split`. Handling non-trivial data formats—such as dates, emails, structured logs, and tokens—resulted in fragile, unmaintainable code vulnerable to slight delimiter changes. Regular Expressions introduced formal regular grammar parsing based on Non-deterministic Finite Automata (NFA).

### 1.2 The Property Name Collision Crisis & The Need for Symbols
Prior to ES6, object property keys were strictly strings. When third-party libraries augmented objects or prototypes (e.g. adding metadata to DOM elements or caching state on instances), name collisions were inevitable:
```javascript
// The Pre-ES6 Name Collision Danger:
// Library A:
element._internalState = { active: true };
// Library B (Collides and silently clobbers Library A's state!):
element._internalState = "PENDING";
```
ECMAScript 2015 introduced **Symbol** as the 7th primitive type: unique, immutable, and guaranteed never to clash with any other property key, string or symbol.

---

## 02. REGULAR EXPRESSIONS: SYNTAX, ENGINE MECHANICS & FLAGS

### 2.1 The Complete Suite of ECMAScript RegExp Flags
RegExp flags configure the parsing and matching semantics of the regular expression engine:

| Flag | Name | Semantic Behavior |
|:---|:---|:---|
| `g` | **Global** | Finds all matches rather than stopping at the first match. Mutates `lastIndex`. |
| `i` | **Ignore Case** | Performs case-insensitive matching across Unicode or ASCII ranges. |
| `m` | **Multiline** | Treats `^` and `$` as start and end of individual lines, not just the whole string. |
| `s` | **DotAll** | Allows the dot (`.`) character to match newline characters (`\n`, `\r`). |
| `u` | **Unicode** | Treats the pattern as a sequence of Unicode code points (handles surrogate pairs). |
| `v` | **Unicode Sets** | ES2024 upgrade to `u`: enables set subtraction, intersection, and string properties. |
| `y` | **Sticky** | Matches strictly at the current `lastIndex` position without advancing forward. |
| `d` | **Has Indices** | Generates an `indices` array containing start/end slice positions for all groups. |

```javascript
// Example: Using 'd' (Has Indices) to extract exact slice offsets:
const regex = /(?<word>[A-Z][a-z]+)/d;
const match = regex.exec("Server Status: Active");
console.log(match.indices.groups.word); // [15, 21] -> string.slice(15, 21) === "Active"
```

### 2.2 Character Classes, Negations, Boundaries & Unicode Property Escapes
- **Character Classes**: `[abc]` matches any single character; `[^abc]` matches any character except `a`, `b`, or `c`.
- **Predefined Classes**: `\d` (digits), `\D` (non-digits), `\w` (word chars), `\W` (non-word), `\s` (whitespace), `\S` (non-whitespace).
- **Word Boundaries**: `\b` asserts an ASCII word boundary (transition between `\w` and `\W`); `\B` asserts a non-boundary.
- **Unicode Property Escapes (`\p{...}`)**: Enabled with the `u` or `v` flag, allows matching characters by Unicode script, general category, or binary property:
```javascript
const emojiRegex = /\p{Emoji}/u;
console.log(emojiRegex.test("🚀")); // true
const greekRegex = /\p{Script=Greek}+/u;
console.log(greekRegex.test("αρετη")); // true
```

### 2.3 Quantifiers: Greedy vs. Lazy (Reluctant) vs. Possessive Emulation
- **Greedy (`*`, `+`, `?`, `{n,m}`)**: Matches as many characters as possible, backtracking one by one if downstream patterns fail.
- **Lazy (`*?`, `+?`, `??`, `{n,m}?`)**: Matches as few characters as possible, expanding one by one as demanded by downstream patterns.
- **Possessive Emulation**: Standard JavaScript lacks native possessive quantifiers (`*+`), but they can be emulated using lookahead with atomic-like capture group backreferences: `(?=(a+))\1`.

### 2.4 Grouping & Captures: Capturing, Non-Capturing & Named Capture Groups
- **Capturing Groups (`(...)`)**: Stores captured sub-strings in numeric slots (`match[1]`, `match[2]`).
- **Non-Capturing Groups (`(?:...)`)**: Groups sub-patterns for quantifier application without allocating capture memory.
- **Named Capture Groups (`(?<name>...)`)**: Stores captured sub-strings in the `match.groups` dictionary:
```javascript
const dateRegex = /(?<year>\d{4})-(?<month>\d{2})-(?<day>\d{2})/;
const result = dateRegex.exec("2026-09-24");
console.log(result.groups.year); // "2026"
console.log(result.groups.month); // "09"
```

### 2.5 Assertions: Lookahead & Lookbehind
Lookarounds are zero-width assertions that check the surrounding text without consuming characters:
- **Positive Lookahead (`(?=...)`)**: Asserts that the following characters match pattern.
- **Negative Lookahead (`(?!...)`)**: Asserts that the following characters do NOT match pattern.
- **Positive Lookbehind (`(?<=...)`)**: Asserts that the preceding characters match pattern.
- **Negative Lookbehind (`(?<!...)`)**: Asserts that the preceding characters do NOT match pattern.

```javascript
// Match currency amounts preceded by '$' without including the '$' symbol:
const priceRegex = /(?<=\$)\d+(?:\.\d{2})?/;
console.log(priceRegex.exec("The price is $49.99")[0]); // "49.99"
```

### 2.6 String vs. RegExp API Protocols
- **`RegExp.prototype.test(str)`**: Returns boolean. Updates `lastIndex` if `g` or `y` flag is set.
- **`RegExp.prototype.exec(str)`**: Returns match array or `null`. Core engine workhorse.
- **`String.prototype.match(regex)`**: If non-global, delegates to `regex.exec()`. If global, returns array of all match strings (discarding capture groups).
- **`String.prototype.matchAll(regex)`**: Returns an iterator yielding full match arrays for every match (requires `g` flag).
- **`String.prototype.replace(regex, replacer)`**: Replaces matches with substitution string or callback function.

### 2.7 The `lastIndex` Mutation Trap on Global & Sticky RegExps
When a regular expression has the `g` (global) or `y` (sticky) flag, it maintains state across invocations in its mutable `lastIndex` property:

```javascript
const re = /abc/g;
console.log(re.test("abc")); // true (lastIndex is now 3)
console.log(re.test("abc")); // false! (starts searching from index 3, fails, resets lastIndex to 0)
console.log(re.test("abc")); // true! (starts searching from 0 again)
```

> [!CAUTION]
> In concurrent environments (Node.js servers, async request handlers), sharing a global RegExp instance across requests creates catastrophic race conditions where Request A's `lastIndex` causes Request B to fail matching! Always reset `re.lastIndex = 0` or create fresh regex instances per call.



---

## 03. V8 IRREGEXP ENGINE INTERNALS & CATASTROPHIC BACKTRACKING (REDOS)

### 3.1 How V8 Irregexp Compiles Patterns to Native Machine Code
Google V8 processes regular expressions through its specialized **Irregexp engine**:
1. **Parsing Phase**: The pattern string is parsed into an abstract syntax tree (AST) of RegExp nodes.
2. **Bytecode Generation**: Irregexp transforms the AST into specialized bytecode (instructions like `CHECK_CHAR`, `ADVANCE`, `BACKTRACK`).
3. **Native JIT Compilation**: For hot regular expressions, Irregexp compiles the bytecode directly into native host machine code (x86/ARM assembly).
4. **Execution**: The generated assembly executes directly on the CPU, achieving near-C-level execution speeds for linear patterns.

```text
┌─────────────────────────────────────────────────────────────────────────────┐
│                    V8 IRREGEXP COMPILATION PIPELINE                         │
├─────────────────────────────────────────────────────────────────────────────┤
│  Pattern: /^[a-z0-9_-]+@[a-z0-9.-]+\.[a-z]{2,6}$/i                          │
│                                                                             │
│  1. Lexer & Parser ────────▶ AST Representation                             │
│  2. Bytecode Generator ────▶ Irregexp Bytecode (CHECK_CHAR, ADVANCE)        │
│  3. Native JIT Compiler ───▶ Specialized Assembly (x86-64 / ARM64)         │
│  4. Execution ─────────────▶ Direct Register Matching & Bitmask Lookups     │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 3.2 The Mechanics of Catastrophic Backtracking (NFA State Explosion)
JavaScript's RegExp engine utilizes a **backtracking Non-deterministic Finite Automaton (NFA)**.
When a pattern contains nested or overlapping quantifiers:
```regex
^(a+)+$
```
For an input like `"aaaaaaaaaaaaaaaaaaaa!"` (where the trailing `!` causes the overall match to fail), the engine must test every possible combination of how the inner and outer `+` quantifiers can divide the 20 `a`'s.

For an input of length $N$:
- The number of execution backtracking states is $2^N$ (exponential $O(2^N)$ time complexity).
- For $N = 30$, the engine attempts over **1,000,000,000 backtracking steps**, completely pegging the Node.js event loop at 100% CPU and blocking all server requests! This vulnerability is termed **Regular Expression Denial of Service (ReDoS)**.

```text
┌────────────────────────────────────────────────────────────────────────┐
│                   CATASTROPHIC BACKTRACKING VISUALIZATION              │
├────────────────────────────────────────────────────────────────────────┤
│  Pattern: /(a+)+$/                                                     │
│  Input:   "aaaaaaaaaaaaaaaaaaaaX"                                      │
│                                                                        │
│  Attempt 1:  [aaaaaaaaaaaaaaaaaaaa] -> misses 'X' -> backtrack         │
│  Attempt 2:  [aaaaaaaaaaaaaaaaaaa][a] -> misses 'X' -> backtrack       │
│  Attempt 3:  [aaaaaaaaaaaaaaaaaa][aa] -> misses 'X' -> backtrack       │
│  Attempt 4:  [aaaaaaaaaaaaaaaaaa][a][a] -> misses 'X' -> backtrack     │
│  ...                                                                   │
│  Total Steps: 2^20 = 1,048,576 operations for just 20 characters!      │
└────────────────────────────────────────────────────────────────────────┘
```

### 3.3 Auditing Patterns for Vulnerabilities & ReDoS Hardening
To prevent ReDoS in production systems:
1. **Eliminate Nested Quantifiers**: Avoid constructs like `(x+)*`, `(a|b+)+`, or `([a-z]+)*`.
2. **Anchor Boundaries Strictly**: Always anchor user input tests with `^` and `$`.
3. **Use Atomic Groups or Emulated Possessive Quantifiers**: Prevent the engine from backtracking into completed match groups:

```javascript
// Vulnerable to ReDoS on "aaaaaaaaaaaaaaaaaaaa!":
const evilRegex = /^(a+)+$/;

// Safe (Flattened linear quantifier):
const safeRegex = /^a+$/;
```



---

## 04. THE SYMBOL PRIMITIVE & GLOBAL SYMBOL REGISTRY

### 4.1 Symbol Creation, Description & Immutability
A Symbol is an immutable, unique primitive value created via the `Symbol()` factory function:

```javascript
const sym1 = Symbol("transactionId");
const sym2 = Symbol("transactionId");

console.assert(sym1 !== sym2, "Symbols are strictly unique even with identical descriptions");
console.assert(typeof sym1 === "symbol", "Typeof is 'symbol'");
console.assert(sym1.description === "transactionId", "Description is accessible");

// Attempting to invoke Symbol with 'new' throws a TypeError:
// new Symbol(); // TypeError: Symbol is not a constructor
```

Symbols cannot be implicitly coerced to numbers or strings:
```javascript
// sym1 + "abc"; // TypeError: Cannot convert a Symbol value to a string
// +sym1;        // TypeError: Cannot convert a Symbol value to a number
String(sym1);    // "Symbol(transactionId)" - Explicit string conversion allowed
Boolean(sym1);   // true - Always truthy
```

### 4.2 Local Symbols vs. The Global Symbol Registry
- **Local Symbols (`Symbol(key)`)**: Unique to the local memory scope. Every call creates a fresh, distinct symbol.
- **Global Symbol Registry (`Symbol.for(key)`)**: A runtime-wide shared symbol registry. If a symbol with `key` exists in the registry, it returns that symbol; otherwise, it creates and registers a new global symbol.
- **`Symbol.keyFor(sym)`**: Retrieves the registered string key for a global symbol, or `undefined` if the symbol is local.

```javascript
const g1 = Symbol.for("app.metrics.counter");
const g2 = Symbol.for("app.metrics.counter");

console.assert(g1 === g2, "Global symbols sharing a key are identical references");
console.assert(Symbol.keyFor(g1) === "app.metrics.counter", "Retrieves registered key");

const localSym = Symbol("localKey");
console.assert(Symbol.keyFor(localSym) === undefined, "Local symbols return undefined in keyFor()");
```

### 4.3 Property Reflection: How Symbols Interact with Objects
Symbols used as object property keys are non-enumerable in standard object traversal APIs:
- `Object.keys(obj)`: Omits Symbol keys.
- `Object.values(obj)` & `Object.entries(obj)`: Omit Symbol keys.
- `for...in` loop: Omits Symbol keys.
- `JSON.stringify(obj)`: Omits Symbol keys and symbol values completely.
- `Object.getOwnPropertyNames(obj)`: Returns only string keys.
- `Object.getOwnPropertySymbols(obj)`: Returns **only** symbol keys.
- `Reflect.ownKeys(obj)`: Returns **all** keys: integer indices, string keys, and symbol keys.

```javascript
const ID = Symbol("id");
const record = {
  name: "Production Cluster",
  [ID]: "node_cluster_01"
};

console.log(Object.keys(record)); // ['name']
console.log(Object.getOwnPropertySymbols(record)); // [ Symbol(id) ]
console.log(Reflect.ownKeys(record)); // [ 'name', Symbol(id) ]
console.log(JSON.stringify(record)); // '{"name":"Production Cluster"}'
```

---

## 05. WELL-KNOWN SYMBOLS & ENGINE METAPROGRAMMING HOOKS

Well-known symbols are built-in Symbol constants exposed on the `Symbol` constructor that act as internal protocol hooks allowing developers to redefine fundamental language operations.

### 5.1 `Symbol.iterator` & `Symbol.asyncIterator` Protocols
Defining `[Symbol.iterator]()` on an object fulfills the Iterable contract, enabling the object to be consumed by `for...of` loops, the spread operator (`[...iterable]`), and `Array.from()`:

```javascript
class NumberRange {
  #from;
  #to;
  constructor(from, to) {
    this.#from = from;
    this.#to = to;
  }

  *[Symbol.iterator]() {
    for (let i = this.#from; i <= this.#to; i++) {
      yield i;
    }
  }
}

const range = new NumberRange(1, 4);
console.assert([...range].join(",") === "1,2,3,4", "Spread operator works via Symbol.iterator");
```

### 5.2 `Symbol.toPrimitive`: Mastering Type Coercion Hints
The `Symbol.toPrimitive` method overrides the abstract `ToPrimitive` engine operation, receiving a hint argument: `"number"`, `"string"`, or `"default"`:

```javascript
class MonetaryAmount {
  #cents;
  #currency;
  constructor(cents, currency = "USD") {
    this.#cents = cents;
    this.#currency = currency;
  }

  [Symbol.toPrimitive](hint) {
    switch (hint) {
      case "number":
        return this.#cents / 100;
      case "string":
        return `${this.#cents / 100} ${this.#currency}`;
      default: // e.g. for '+' operator
        return this.#cents / 100;
    }
  }
}

const amount = new MonetaryAmount(2500, "USD");
console.assert(+amount === 25, "Unary + triggers 'number' hint");
console.assert(`Total: ${amount}` === "Total: 25 USD", "Template literal triggers 'string' hint");
console.assert(amount + 10 === 35, "Addition triggers 'default' hint");
```

### 5.3 `Symbol.toStringTag`: Customizing Object Representation
Overrides the tag returned by `Object.prototype.toString.call(obj)`:

```javascript
class TelemetryPacket {
  get [Symbol.toStringTag]() {
    return "TelemetryPacket";
  }
}

const packet = new TelemetryPacket();
console.assert(
  Object.prototype.toString.call(packet) === "[object TelemetryPacket]",
  "Symbol.toStringTag customizes Object.prototype.toString"
);
```

### 5.4 `Symbol.hasInstance`: Customizing the `instanceof` Protocol
Allows any constructor or plain object to customize how the `instanceof` operator evaluates against it:

```javascript
const EvenNumber = {
  [Symbol.hasInstance](val) {
    return typeof val === "number" && Number.isInteger(val) && val % 2 === 0;
  }
};

console.assert((4 instanceof EvenNumber) === true, "4 is an EvenNumber");
console.assert((7 instanceof EvenNumber) === false, "7 is not an EvenNumber");
```

### 5.5 `Symbol.species`: Controlling Derived Object Constructors
Allows subclassed built-in objects (like `Array`) to return instances of the base constructor during chaining methods (`map`, `filter`, `slice`):

```javascript
class PowerArray extends Array {
  static get [Symbol.species]() {
    return Array; // Return standard Array instead of PowerArray
  }
}

const pArr = new PowerArray(1, 2, 3);
const mapped = pArr.map(x => x * 2);
console.assert(mapped instanceof Array === true);
console.assert(mapped instanceof PowerArray === false, "Symbol.species resets constructor to Array");
```

### 5.6 `Symbol.isConcatSpreadable` & Array Flattening Control
Controls whether an array or array-like object is flattened when passed to `Array.prototype.concat`:

```javascript
const arr1 = [1, 2];
const arr2 = [3, 4];
arr2[Symbol.isConcatSpreadable] = false;

const combined = arr1.concat(arr2);
console.assert(combined.length === 3, "arr2 was not flattened");
console.assert(Array.isArray(combined[2]), "Nested array retained");
```

### 5.7 Custom RegExp Match Protocols (`Symbol.match`, `replace`, `search`, `split`)
Any object implementing `[Symbol.match](string)`, `[Symbol.replace](string, replacer)`, etc., can be passed directly to string methods in place of a RegExp:

```javascript
const CustomMatcher = {
  [Symbol.match](target) {
    return target.includes("CRITICAL") ? ["CRITICAL_FOUND"] : null;
  }
};

console.assert("System ALERT: CRITICAL error".match(CustomMatcher)[0] === "CRITICAL_FOUND");
```



---

## 06. PRODUCTION ARCHITECTURAL ANTI-PATTERNS

### Anti-Pattern 1: Concurrent Sharing of Global / Sticky Regex Instances
Sharing a global RegExp instance across multiple async operations causes state leakage via `lastIndex`:

```javascript
// DANGEROUS ANTI-PATTERN:
const emailRegex = /^[\w.-]+@[\w.-]+\.\w+$/g; // Notice 'g' flag!

async function validateUser(user) {
  // If two requests call this concurrently, lastIndex is shared and mutated:
  return emailRegex.test(user.email); 
}

// SAFE FIX: Avoid 'g' on test, or instantiate locally:
function validateUserSafe(user) {
  return /^[\w.-]+@[\w.-]+\.\w+$/.test(user.email);
}
```

### Anti-Pattern 2: Unescaped Dynamic User Input in `new RegExp()`
Constructing a regex directly from user input without escaping regex special characters opens the door to ReDoS and syntax errors:

```javascript
// VULNERABLE:
function searchItems(query, items) {
  const re = new RegExp(query, "i"); // If query is "(a+)+$", server hangs!
  return items.filter(item => re.test(item.name));
}
```

---

## 07. ARCHITECTURAL DECISION MATRIX: WHEN TO USE WHAT

| Tool | Best Use Case | Performance | Complexity | ReDoS Risk |
|:---|:---|:---|:---|:---|
| **`String#includes` / `indexOf`** | Exact substring matches, simple prefix/suffix checks | Extremely Fast ($O(N)$) | Lowest | None |
| **Regular Expressions** | Form validation, token extraction, pattern-based search | Fast (Compiled Irregexp) | Moderate | High (if unhardened) |
| **Parser Combinators (Lexer/AST)** | Complex grammars (Markdown, SQL, JSON, custom DSLs) | Linear / Predictable | Higher | Zero |
| **`Symbol` Properties** | Private metadata, library hooks, non-colliding keys | Instant ($O(1)$) | Low | None |

---

## 08. SPEC-COMPLIANT REFERENCE ALGORITHMS & POLYFILLS

### Algorithm 1: Catastrophic Backtracking ReDoS Detector & Guard
Wraps regex execution with an execution deadline guard, preventing ReDoS attacks from freezing the Node.js event loop.

```javascript
function safeRegExpTest(regex, input, timeoutMs = 100) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error(`ReDoS Guard: RegExp timed out after ${timeoutMs}ms`));
    }, timeoutMs);

    try {
      const result = regex.test(input);
      clearTimeout(timer);
      resolve(result);
    } catch (err) {
      clearTimeout(timer);
      reject(err);
    }
  });
}

// Verification:
(async () => {
  const safeRegex = /^a+$/;
  const isMatch = await safeRegExpTest(safeRegex, "aaaaaaaaaa");
  console.assert(isMatch === true, "Safe regex evaluates normally");
})();
```

### Algorithm 2: Spec-Compliant Safe RegExp Escape Utility (`escapeRegExp`)
Escapes all 14 special RegExp characters so user input can be safely injected into `new RegExp()`.

```javascript
function escapeRegExp(string) {
  if (typeof string !== "string") {
    throw new TypeError("escapeRegExp expected a string argument");
  }
  const bs = String.fromCharCode(92);
  const specials = new Set(["-", "[", "]", "/", "{", "}", "(", ")", "*", "+", "?", ".", bs, "^", "$", "|"]);
  return string
    .split("")
    .map((ch) => (specials.has(ch) ? bs + ch : ch))
    .join("");
}

// Verification:
const untrustedInput = "user.name[0]+test$";
const escaped = escapeRegExp(untrustedInput);
const safeRe = new RegExp(escaped);
console.assert(safeRe.test("user.name[0]+test$") === true, "Literal match works");
console.assert(safeRe.test("userXname[0]+test$") === false, "Does not treat dot as wildcard");
```

### Algorithm 3: Metaprogrammed Iterable Collection with `Symbol.iterator`
Implements an iterable collection yielding elements using custom cursor logic conforming to the ECMAScript Iterator Protocol.

```javascript
class PriorityQueue {
  #items = [];

  enqueue(item, priority) {
    this.#items.push({ item, priority });
    this.#items.sort((a, b) => b.priority - a.priority); // Highest priority first
    return this;
  }

  *[Symbol.iterator]() {
    for (const entry of this.#items) {
      yield entry.item;
    }
  }

  get length() {
    return this.#items.length;
  }
}

// Verification:
const pq = new PriorityQueue();
pq.enqueue("Low Priority Task", 1)
  .enqueue("Critical Patch", 10)
  .enqueue("Feature Request", 5);

const order = [...pq];
console.assert(order[0] === "Critical Patch", "Highest priority yielded first");
console.assert(order[1] === "Feature Request", "Second priority yielded second");
console.assert(order[2] === "Low Priority Task", "Lowest priority yielded last");
```

### Algorithm 4: Industrial Type Coercion Protocol with `Symbol.toPrimitive`
Implements a strict type coercion protocol managing integer amounts and formatting without implicit numeric bugs.

```javascript
class ByteSize {
  #bytes;
  constructor(bytes) {
    if (typeof bytes !== "number" || bytes < 0) {
      throw new TypeError("Bytes must be a non-negative number");
    }
    this.#bytes = bytes;
  }

  [Symbol.toPrimitive](hint) {
    if (hint === "string") {
      if (this.#bytes >= 1024 * 1024) return (this.#bytes / (1024 * 1024)).toFixed(2) + " MB";
      if (this.#bytes >= 1024) return (this.#bytes / 1024).toFixed(2) + " KB";
      return this.#bytes + " Bytes";
    }
    // Default and number: return raw bytes integer
    return this.#bytes;
  }

  get [Symbol.toStringTag]() {
    return "ByteSize";
  }
}

// Verification:
const size = new ByteSize(2048);
console.assert(+size === 2048, "Number coercion yields raw bytes");
console.assert(String(size) === "2.00 KB", "String coercion yields formatted string");
console.assert(size + 512 === 2560, "Default coercion behaves numerically");
console.assert(Object.prototype.toString.call(size) === "[object ByteSize]", "Custom toStringTag applied");
```



---

## 09. 90 COMPREHENSIVE INTERVIEW QUESTIONS & DETAILED ANSWERS

### 09.1 Beginner Tier (Questions 1 to 20)

#### 1. What is a Regular Expression in JavaScript?
**Answer**: A Regular Expression (RegExp) is an object describing a pattern of characters used for string searching, validation, pattern extraction, and replacement algorithms.
```javascript
const pattern = /javascript/i;
console.log(pattern.test("I love JavaScript")); // true
```

#### 2. How do you create a regular expression in JavaScript (literal vs constructor)?
**Answer**: You can create regular expressions via literal notation (compiled once at parse time) or via the `RegExp` constructor function (compiled dynamically at runtime).
```javascript
// Literal notation (static):
const staticRe = /cat/i;

// Constructor notation (dynamic with escaping):
const term = "dog";
const dynamicRe = new RegExp(term, "i");
console.log(dynamicRe.test("Hot dog")); // true
```

#### 3. What is the `g` flag in a RegExp?
**Answer**: The global flag (`g`) instructs the engine to find all matches across the input string rather than stopping after the first match, maintaining search state via `lastIndex`.
```javascript
const str = "fee fi fo fum";
console.log(str.match(/f\w+/g)); // ['fee', 'fi', 'fo', 'fum']
```

#### 4. What is the `i` flag in a RegExp?
**Answer**: The ignore-case flag (`i`) performs case-insensitive matching across uppercase and lowercase character ranges.
```javascript
const re = /apple/i;
console.log(re.test("ApPlE")); // true
```

#### 5. What is the `m` flag in a RegExp?
**Answer**: The multiline flag (`m`) alters the behavior of anchors `^` and `$` so that they match the start and end of individual lines (`\n`, `\r`), rather than solely the start and end of the entire string.
```javascript
const text = "first\nsecond\nthird";
console.log(text.match(/^second/m) !== null); // true
```

#### 6. What does the `.` (dot) character match in a regular expression?
**Answer**: The dot matches any single character except line terminators (`\n`, `\r`, `\u2028`, `\u2029`).
```javascript
console.log(/a.c/.test("abc")); // true
console.log(/a.c/.test("a\nc")); // false (newline excluded)
```

#### 7. What is the `s` (dotAll) flag in a RegExp?
**Answer**: The dotAll flag (`s`) enables the dot (`.`) character to match ANY character without exception, including line terminators.
```javascript
console.log(/a.c/s.test("a\nc")); // true (matches across newline)
```

#### 8. What is a character class (e.g., `[abc]`)?
**Answer**: A bracketed set matching any single character contained within the brackets.
```javascript
const vowels = /[aeiou]/;
console.log(vowels.test("sky")); // false
console.log(vowels.test("orange")); // true
```

#### 9. What does `[^abc]` mean in a regular expression?
**Answer**: A negated character class that matches any single character NOT present in the specified set.
```javascript
const nonDigit = /[^0-9]/;
console.log(nonDigit.test("7")); // false
console.log(nonDigit.test("A")); // true
```

#### 10. What is the difference between `\d` and `\D`?
**Answer**: `\d` matches any digit character (`[0-9]`), whereas `\D` matches any non-digit character (`[^0-9]`).
```javascript
console.log(/\d/.test("9")); // true
console.log(/\D/.test("9")); // false
console.log(/\D/.test("X")); // true
```

#### 11. What is the difference between `\w` and `\W`?
**Answer**: `\w` matches any alphanumeric ASCII word character including underscores (`[a-zA-Z0-9_]`). `\W` matches any non-word character (`[^a-zA-Z0-9_]`).
```javascript
console.log(/\w/.test("user_1")); // true
console.log(/\W/.test("@")); // true
```

#### 12. What is the difference between `\s` and `\S`?
**Answer**: `\s` matches any whitespace character (space, tab, newline, carriage return). `\S` matches any non-whitespace character.
```javascript
console.log(/\s/.test(" ")); // true
console.log(/\S/.test("A")); // true
```

#### 13. What does the `^` anchor assert in a regular expression?
**Answer**: Asserts that the match must occur at the beginning of the string (or beginning of a line if `m` is active). It consumes no characters.
```javascript
console.log(/^http/.test("http://localhost")); // true
console.log(/^http/.test("secure:http")); // false
```

#### 14. What does the `$` anchor assert in a regular expression?
**Answer**: Asserts that the match must occur at the end of the string (or end of a line if `m` is active).
```javascript
console.log(/\.json$/.test("config.json")); // true
console.log(/\.json$/.test("config.json.bak")); // false
```

#### 15. What is the difference between `*` and `+` quantifiers?
**Answer**: `*` matches zero or more occurrences ($0 \le N$), while `+` matches one or more occurrences ($1 \le N$).
```javascript
console.log(/a*/.test("")); // true (0 occurrences is valid)
console.log(/a+/.test("")); // false (requires at least 1)
```

#### 16. What does the `?` quantifier do?
**Answer**: Makes the preceding token optional by matching zero or one occurrence ($0 \le N \le 1$).
```javascript
const re = /https?/;
console.log(re.test("http")); // true
console.log(re.test("https")); // true
```

#### 17. What does `test()` return on a RegExp?
**Answer**: A boolean value: `true` if the pattern matches anywhere in the target string, `false` otherwise.
```javascript
console.log(/\d{3}/.test("Order 452")); // true
```

#### 18. What does `exec()` return on a RegExp?
**Answer**: An Array containing the full match text, captured groups, `index`, and `input` properties if a match is found; returns `null` if no match is found.
```javascript
const match = /(\w+): (\d+)/.exec("Age: 25");
console.log(match[0]); // "Age: 25"
console.log(match[1]); // "Age"
console.log(match[2]); // "25"
```

#### 19. What is a Symbol in JavaScript?
**Answer**: A Symbol is an immutable, unique primitive data type introduced in ES6, used primarily as collision-proof object property keys.
```javascript
const s1 = Symbol("key");
const s2 = Symbol("key");
console.log(s1 === s2); // false (always unique)
```

#### 20. How do you create a Symbol and what is its primitive type?
**Answer**: By invoking the factory function `Symbol([description])`. Its `typeof` operator returns `"symbol"`. Calling `new Symbol()` throws a `TypeError`.
```javascript
const sym = Symbol("meta");
console.log(typeof sym); // "symbol"
try { new Symbol(); } catch (e) { console.log(e.name); } // "TypeError"
```

---

### 09.2 Intermediate Tier (Questions 21 to 45)

#### 21. What is the difference between greedy and lazy quantifiers?
**Answer**: A greedy quantifier matches as much text as possible and backtracks if necessary. A lazy (reluctant) quantifier matches as little text as possible, expanding only as required by downstream match tokens.
```javascript
const html = "<b>bold</b><i>italic</i>";
console.log(html.match(/<.*>/)[0]); // "<b>bold</b><i>italic</i>" (greedy)
console.log(html.match(/<.*?>/)[0]); // "<b>" (lazy)
```

#### 22. How do you make a quantifier lazy in JavaScript?
**Answer**: By appending a question mark (`?`) directly after the quantifier: `*?`, `+?`, `??`, `{n,m}?`.
```javascript
const text = "1000";
console.log(text.match(/\d+?/)[0]); // "1"
```

#### 23. What is a capturing group `(...)` vs non-capturing group `(?:...)`?
**Answer**: A capturing group saves matched sub-strings into indexed results and backreferences. A non-capturing group groups tokens for quantifiers without allocating capture memory.
```javascript
const capt = /(\d+)-(\d+)/.exec("2026-09");
console.log(capt[1], capt[2]); // "2026", "09"

const nonCapt = /(?:https|http):\/\/(\w+)/.exec("https://api");
console.log(nonCapt[1]); // "api" (protocol was not captured)
```

#### 24. What is a named capture group (`(?<name>...)`)?
**Answer**: A capture group assigned an explicit identifier. Captured values are stored in the `match.groups` dictionary keyed by that name.
```javascript
const re = /(?<year>\d{4})-(?<month>\d{2})/;
const m = re.exec("2026-09");
console.log(m.groups.year); // "2026"
```

#### 25. How do you access named capture groups from an `exec()` result?
**Answer**: Via the `groups` property on the result array:
```javascript
const re = /(?<area>\d{3})-(?<num>\d{4})/;
const res = re.exec("555-1234");
console.log(res.groups.area, res.groups.num); // "555" "1234"
```

#### 26. What is the `d` (hasIndices) flag in ES2022?
**Answer**: Causes the match result to include an `indices` array containing the `[start, end]` slice offsets for the entire match and all individual groups.
```javascript
const re = /(?<id>\d+)/d;
const res = re.exec("Order #42");
console.log(res.indices.groups.id); // [7, 9] -> "Order #42".slice(7, 9) === "42"
```

#### 27. What is a positive lookahead (`(?=...)`)?
**Answer**: A zero-width assertion verifying that the specified pattern follows immediately, without including those characters in the matched string.
```javascript
const re = /\d+(?= USD)/;
console.log(re.exec("Cost: 100 USD")[0]); // "100" (USD not consumed)
```

#### 28. What is a negative lookahead (`(?!...)`)?
**Answer**: A zero-width assertion verifying that the specified pattern does NOT follow immediately.
```javascript
const re = /\d+(?! USD)/;
console.log(re.test("100 EUR")); // true
```

#### 29. What is a positive lookbehind (`(?<=...)`)?
**Answer**: A zero-width assertion verifying that the specified pattern precedes immediately, without including it in the match.
```javascript
const re = /(?<=\$)\d+/;
console.log(re.exec("Price: $99")[0]); // "99" ($ not consumed)
```

#### 30. What is a negative lookbehind (`(?<!...)`)?
**Answer**: A zero-width assertion verifying that the specified pattern does NOT precede immediately.
```javascript
const re = /(?<!\$)\b\d+\b/;
console.log(re.exec("Count: 50 items")[0]); // "50"
```

#### 31. What is the `y` (sticky) flag in a RegExp?
**Answer**: Constrains the search to match strictly at the current `lastIndex` offset, without scanning forward through subsequent characters.
```javascript
const re = /\d+/y;
re.lastIndex = 3;
console.log(re.test("ABC123XYZ")); // true (matches starting at index 3)
```

#### 32. What is the `u` (unicode) flag and why is it necessary for emojis and astral plane characters?
**Answer**: Enables full Unicode surrogate pair handling. Without `u`, astral plane characters (like emojis) are treated as two separate 16-bit code units, causing character classes like `.` to split them.
```javascript
console.log(/^.$/.test("🚀")); // false (surrogate pair has length 2)
console.log(/^.$/u.test("🚀")); // true (treated as single code point)
```

#### 33. What is the `v` (unicodeSets) flag in ES2024?
**Answer**: An upgrade to the `u` flag that enables set operations (subtraction `--`, intersection `&&`), properties of strings, and better support for complex emojis.
```javascript
// Match Greek characters except uppercase letters:
// Supported in modern V8 runtimes:
const re = /[[\p{Script=Greek}]--[\p{Uppercase}]]/v;
console.log(re.test("α")); // true
```

#### 34. What is the `lastIndex` property on a regular expression?
**Answer**: An integer property indicating the character offset at which the next match attempt will start. It is updated during `test()` and `exec()` when the `g` or `y` flag is active.
```javascript
const re = /hi/g;
re.test("hi hi");
console.log(re.lastIndex); // 2
```

#### 35. When does `lastIndex` get updated and when does it reset to 0?
**Answer**: It updates to the index following the match after a successful match. If a match attempt fails, it automatically resets to 0.
```javascript
const re = /a/g;
re.exec("a"); // lastIndex becomes 1
re.exec("a"); // null (fails), lastIndex resets to 0
console.log(re.lastIndex); // 0
```

#### 36. Why can calling `regex.test()` in a loop with the `g` flag yield alternating results?
**Answer**: Because `lastIndex` advances on the first match. The second call starts searching from that advanced index (failing and resetting to 0). The third call searches from 0 again (succeeding).
```javascript
const re = /cat/g;
console.log(re.test("cat")); // true (lastIndex = 3)
console.log(re.test("cat")); // false (searches from index 3, fails, resets to 0)
console.log(re.test("cat")); // true (searches from 0 again)
```

#### 37. What is the difference between `String#match()` and `RegExp#exec()`?
**Answer**: Without the `g` flag, `match()` returns the same array as `exec()`. With the `g` flag, `match()` returns an array of all matched strings, discarding capture groups.
```javascript
const str = "2026-09";
console.log(str.match(/(\d+)/)); // ['2026', '2026', index: 0, ...]
console.log(str.match(/(\d+)/g)); // ['2026', '09'] (no groups!)
```

#### 38. What does `String#matchAll()` return and why does it require the `g` flag?
**Answer**: It returns an iterator yielding full match objects (with groups and indices) for every match in the string. If the RegExp lacks `g`, it throws a `TypeError`.
```javascript
const str = "A1 B2";
for (const match of str.matchAll(/([A-Z])(\d)/g)) {
  console.log(match[1], match[2]); // "A" "1", then "B" "2"
}
```

#### 39. What is the difference between `Symbol("foo")` and `Symbol.for("foo")`?
**Answer**: `Symbol("foo")` creates a brand new unique local symbol every time. `Symbol.for("foo")` accesses the runtime Global Symbol Registry, returning the shared symbol for that key.
```javascript
console.log(Symbol("x") === Symbol("x")); // false
console.log(Symbol.for("x") === Symbol.for("x")); // true
```

#### 40. What is `Symbol.keyFor()` and what does it return for local symbols?
**Answer**: It returns the string key for a global symbol registered via `Symbol.for()`. For local symbols created via `Symbol()`, it returns `undefined`.
```javascript
const g = Symbol.for("app.token");
const l = Symbol("app.token");
console.log(Symbol.keyFor(g)); // "app.token"
console.log(Symbol.keyFor(l)); // undefined
```

#### 41. Can you convert a Symbol to a string implicitly (`sym + ""`)?
**Answer**: No. Implicit string concatenation with a Symbol throws a `TypeError`. Explicit conversion via `String(sym)` is required.
```javascript
const s = Symbol("tag");
try {
  const bad = s + ""; // TypeError!
} catch (e) {
  console.log(e.name); // "TypeError"
}
console.log(String(s)); // "Symbol(tag)"
```

#### 42. Does `Object.keys()` return Symbol properties?
**Answer**: No. `Object.keys()` returns only enumerable string properties.
```javascript
const s = Symbol("id");
const obj = { name: "Alex", [s]: 101 };
console.log(Object.keys(obj)); // ['name']
```

#### 43. How do you retrieve all Symbol properties of an object?
**Answer**: Using `Object.getOwnPropertySymbols(obj)`.
```javascript
const s = Symbol("meta");
const obj = { [s]: "data" };
console.log(Object.getOwnPropertySymbols(obj)); // [ Symbol(meta) ]
```

#### 44. Does `JSON.stringify()` include Symbol keys or Symbol values?
**Answer**: No. `JSON.stringify()` completely ignores Symbol-keyed properties and omits values that are Symbols.
```javascript
const s = Symbol("secret");
const obj = { user: "Bob", [s]: "hidden", token: Symbol("t") };
console.log(JSON.stringify(obj)); // '{"user":"Bob"}'
```

#### 45. What is `Reflect.ownKeys()` and how does it handle Symbols?
**Answer**: `Reflect.ownKeys()` returns an array of ALL own property keys of an object: integer indices, string keys, and Symbol keys.
```javascript
const sym = Symbol("secret");
const obj = { id: 1, [sym]: true };
console.log(Reflect.ownKeys(obj)); // ['id', Symbol(secret)]
```



---

### 09.3 Advanced Tier (Questions 46 to 70)

#### 46. What is Catastrophic Backtracking in Regular Expressions?
**Answer**: A pathological state occurring in backtracking regex engines when a non-matching string causes the engine to evaluate an exponential number of permutations, exhausting CPU cycles and freezing the event loop.
```javascript
// Dangerous pattern: nested quantifiers
const evil = /(a+)+$/;
const start = Date.now();
// Input fails at the trailing '!':
evil.test("aaaaaaaaaaaaaaaaaaaaaaa!"); 
console.log("Elapsed ms:", Date.now() - start); // Takes noticeably longer as input grows!
```

#### 47. What causes Catastrophic Backtracking mathematically?
**Answer**: Nested or overlapping quantifiers (such as `(a+)+` or `(a|a)+`) evaluated against an input of length $N$ where multiple paths can divide the characters, producing an exponential $O(2^N)$ state explosion.
```javascript
// Flattening nested quantifiers eliminates the exponential branching:
const safe = /^a+$/;
console.log(safe.test("aaaaaaaaaaaaaaaaaaaaaaa!")); // false (instant linear check)
```

#### 48. What is a Regular Expression Denial of Service (ReDoS) attack?
**Answer**: An algorithmic complexity denial-of-service attack where an attacker submits a crafted string that triggers catastrophic backtracking on a vulnerable server regex, freezing CPU resources.
```javascript
// Web server endpoint vulnerable to ReDoS:
function validateEmail(input) {
  // Vulnerable regex with overlapping groups:
  return /^([a-zA-Z0-9_.-]+)+@([a-zA-Z0-9_.-]+)+$/.test(input);
}
```

#### 49. How does V8's Irregexp engine compile regular expressions?
**Answer**: Irregexp translates RegExp ASTs into an intermediate bytecode, analyzes it for optimization opportunities, and for frequently called regexes, JIT-compiles it directly into native x86/ARM machine code.
```javascript
// Hot regexes compiled to native machine instructions by Irregexp:
const re = /\d{3}-\d{2}-\d{4}/;
for (let i = 0; i < 10000; i++) {
  re.test("123-45-6789");
}
```

#### 50. What is the difference between an NFA and a DFA engine?
**Answer**: A DFA (Deterministic Finite Automaton) matches in guaranteed linear time $O(N)$ with no backtracking, but cannot support backreferences or lookarounds. An NFA (Non-deterministic Finite Automaton) supports full backtracking, capturing groups, and lookarounds, but is vulnerable to exponential backtracking.
```javascript
// JavaScript's NFA engine supports backreferences:
const re = /(w+) \1/;
console.log(re.test("hello hello")); // true
```

#### 51. Can JavaScript regular expressions possess possessive quantifiers?
**Answer**: No. JavaScript does not have native possessive quantifiers (`*+`, `++`), which lock matching characters and forbid backtracking.
```javascript
// Emulated possessive quantifier using lookahead and backreference:
// (?=(a+))\\1 matches 'a+' greedily without allowing backtracking into it
const emulatedPossessive = /^(?=(a+))\1$/;
console.log(emulatedPossessive.test("aaaa")); // true
```

#### 52. How do you emulate possessive quantifiers or atomic groups in JavaScript?
**Answer**: Using positive lookahead with a capturing group and an immediate backreference: `(?=(pattern))\\1`. Once the lookahead matches, the engine cannot backtrack into it.
```javascript
// Prevents ReDoS by treating the match atomically:
const atomicGroup = /^(?=([a-z]+))\1$/;
console.log(atomicGroup.test("abcdef")); // true
```

#### 53. What is the risk of constructing a RegExp from unsanitized user input?
**Answer**: It exposes the application to ReDoS attacks, unexpected regex syntax errors, or unintended pattern leakage.
```javascript
const userInput = "[unclosed";
try {
  new RegExp(userInput);
} catch (e) {
  console.log(e.name); // "SyntaxError: Invalid regular expression"
}
```

#### 54. How do you safely escape user input for dynamic regular expressions?
**Answer**: By escaping all 14 regex metacharacters (`\ ^ $ * + ? . ( ) | { } [ ]`) before passing the string to `new RegExp()`.
```javascript
function safeEscape(str) {
  const bs = String.fromCharCode(92);
  const metachars = new Set(["-", "[", "]", "/", "{", "}", "(", ")", "*", "+", "?", ".", bs, "^", "$", "|"]);
  return str.split("").map(c => metachars.has(c) ? bs + c : c).join("");
}
const query = "user.name[0]";
const safeRe = new RegExp(safeEscape(query));
console.log(safeRe.test("user.name[0]")); // true
```

#### 55. What is a Well-Known Symbol in JavaScript?
**Answer**: A built-in, globally shared Symbol constant defined as a static property on `Symbol` (such as `Symbol.iterator`) that acts as an engine protocol hook to customize language semantics.
```javascript
console.log(typeof Symbol.iterator); // "symbol"
console.log(typeof Symbol.toPrimitive); // "symbol"
```

#### 56. How does `Symbol.iterator` work and how do you make a plain object iterable?
**Answer**: The engine looks for a method keyed by `Symbol.iterator` that returns an Iterator object. Implementing a generator method `*[Symbol.iterator]() { ... }` on the object fulfills this contract.
```javascript
const collection = {
  items: ["A", "B", "C"],
  *[Symbol.iterator]() {
    yield* this.items;
  }
};
console.log([...collection]); // ['A', 'B', 'C']
```

#### 57. What is the difference between `Symbol.iterator` and `Symbol.asyncIterator`?
**Answer**: `Symbol.iterator` powers synchronous iteration (`for...of`, spread `...`). `Symbol.asyncIterator` powers asynchronous iteration (`for await...of`), where `next()` returns a Promise resolving to `{ value, done }`.
```javascript
const asyncStream = {
  async *[Symbol.asyncIterator]() {
    yield 1;
    yield 2;
  }
};
(async () => {
  for await (const val of asyncStream) {
    console.log(val); // 1, then 2
  }
})();
```

#### 58. How does `Symbol.toPrimitive` override standard type coercion?
**Answer**: It intercepts the abstract `ToPrimitive` operation. If present on an object, it is called with a coercion hint (`"number"`, `"string"`, or `"default"`), completely bypassing `valueOf()` and `toString()`.
```javascript
const score = {
  val: 50,
  [Symbol.toPrimitive](hint) {
    return hint === "string" ? `${this.val} pts` : this.val;
  }
};
console.log(+score); // 50 (number hint)
console.log(String(score)); // "50 pts" (string hint)
```

#### 59. What are the three hints passed to `Symbol.toPrimitive`?
**Answer**: `"number"` (for arithmetic or unary +), `"string"` (for string operations or template literals), and `"default"` (for operators like binary `+` or `==`).
```javascript
const obj = {
  [Symbol.toPrimitive](hint) {
    return hint;
  }
};
console.log(+obj); // "number"
console.log(`${obj}`); // "string"
console.log(obj + ""); // "default"
```

#### 60. In what order are `Symbol.toPrimitive`, `valueOf`, and `toString` evaluated?
**Answer**: If `[Symbol.toPrimitive]` exists, it is called first. Otherwise, for a number hint, `valueOf()` is tried then `toString()`. For a string hint, `toString()` is tried then `valueOf()`.
```javascript
const order = {
  valueOf() { return "valueOf"; },
  toString() { return "toString"; }
};
console.log(+order); // NaN (calls valueOf -> "valueOf" -> NaN)
console.log(String(order)); // "toString" (calls toString)
```

#### 61. What does `Symbol.toStringTag` do?
**Answer**: A string-valued property that customizes the class tag displayed by `Object.prototype.toString.call(obj)` (e.g. `[object CustomTag]`).
```javascript
class Validator {
  get [Symbol.toStringTag]() {
    return "SchemaValidator";
  }
}
console.log(Object.prototype.toString.call(new Validator())); // "[object SchemaValidator]"
```

#### 62. What is the default `Symbol.toStringTag` of plain objects, Arrays, and Functions?
**Answer**: Plain objects, Arrays, and Functions have `undefined` as their own `Symbol.toStringTag`; the engine formats them using internal exotic tags.
```javascript
console.log(Object.prototype.toString.call({})); // "[object Object]"
console.log(Object.prototype.toString.call([])); // "[object Array]"
console.log(Object.prototype.toString.call(Promise.resolve())); // "[object Promise]"
```

#### 63. How does `Symbol.hasInstance` customize the `instanceof` operator?
**Answer**: The expression `inst instanceof Cls` invokes `Cls[Symbol.hasInstance](inst)`. Any constructor or object can define this method to override prototype chain checks.
```javascript
class IntegerRange {
  static [Symbol.hasInstance](val) {
    return typeof val === "number" && Number.isInteger(val) && val >= 0;
  }
}
console.log(42 instanceof IntegerRange); // true
console.log(-5 instanceof IntegerRange); // false
```

#### 64. What is `Symbol.species` and why was it introduced?
**Answer**: It is a static accessor property allowing subclasses of built-in classes (like `Array`, `Promise`, `RegExp`) to specify the constructor function used by derived methods when constructing new instances.
```javascript
class MyArray extends Array {
  static get [Symbol.species]() {
    return Array;
  }
}
const sub = new MyArray(1, 2, 3);
const mapped = sub.map(x => x * 2);
console.log(mapped instanceof Array, mapped instanceof MyArray); // true false
```

#### 65. How do you use `Symbol.species` to force derived array methods to return base Array instances?
**Answer**:
```javascript
class CleanArray extends Array {
  static get [Symbol.species]() {
    return Array;
  }
}
const ca = new CleanArray(10, 20);
console.log(ca.filter(x => x > 5) instanceof CleanArray); // false (returns base Array)
```

#### 66. What is `Symbol.isConcatSpreadable` and how does it affect `Array.prototype.concat`?
**Answer**: A boolean property configuring whether an array or array-like object is flattened into individual elements when passed to `concat()`. Setting it to `false` on an array forces it to be included as a nested element.
```javascript
const arr1 = [1, 2];
const arr2 = [3, 4];
arr2[Symbol.isConcatSpreadable] = false;
console.log(arr1.concat(arr2)); // [1, 2, [3, 4]]
```

#### 67. What are `Symbol.match`, `Symbol.replace`, `Symbol.search`, and `Symbol.split`?
**Answer**: Engine hooks called by the corresponding `String.prototype` methods, allowing custom matcher objects to replace regular expressions.
```javascript
const customSearcher = {
  [Symbol.search](str) {
    return str.indexOf("TARGET");
  }
};
console.log("FIND THE TARGET HERE".search(customSearcher)); // 9
```

#### 68. How do you build a custom string pattern matcher object using `Symbol.match`?
**Answer**: Define an object with a `[Symbol.match](str)` method returning an array or null:
```javascript
const prefixMatcher = {
  [Symbol.match](target) {
    return target.startsWith("AUTH_") ? ["AUTH_TOKEN"] : null;
  }
};
console.log("AUTH_12345".match(prefixMatcher)); // ['AUTH_TOKEN']
```

#### 69. Can a Symbol be used as a WeakMap key?
**Answer**: Yes! As of ECMAScript 2023, unique non-registered Symbols can be used as keys in `WeakMap` and elements in `WeakSet`.
```javascript
const wm = new WeakMap();
const sym = Symbol("meta");
wm.set(sym, { active: true });
console.log(wm.get(sym)); // { active: true }
```

#### 70. What is the difference between private `#fields` and Symbol properties?
**Answer**: `#fields` are hard-private, enforced by the V8 runtime and inaccessible to all reflection APIs. Symbols are soft-private: non-enumerable in `Object.keys()`, but fully discoverable via `Object.getOwnPropertySymbols()` and `Reflect.ownKeys()`.
```javascript
class Entity {
  #privateField = "secret";
  [Symbol("symKey")] = "visibleViaReflection";
}
const e = new Entity();
console.log(Object.getOwnPropertySymbols(e).length); // 1 (Symbol revealed)
```

---

### 09.4 Senior & Staff Tier (Questions 71 to 90)

#### 71. How do you detect and prevent ReDoS in production CI/CD pipelines?
**Answer**: Run automated static analysis tools (like `eslint-plugin-regexp` or `safe-regex`) in CI to flag patterns with overlapping quantifiers.
```javascript
// ESLint configuration example:
// "plugins": ["regexp"],
// "rules": { "regexp/no-super-linear-backtracking": "error" }
```

#### 72. How did the 2019 Cloudflare ReDoS incident bring down 50% of the internet?
**Answer**: Cloudflare deployed a WAF rule containing unanchored overlapping wildcards `[\s\S]*?[\s\S]*?\w` that caused catastrophic backtracking on non-matching payloads, pegging CPU at 100% across all global edge servers.
```javascript
// Anatomy of the failure:
const brokenWafRegex = /(?:.*=.*["')\]])/;
```

#### 73. How does V8's Irregexp optimize character classes using bit vectors?
**Answer**: For ASCII character ranges (`[a-zA-Z0-9]`), Irregexp creates a bitmask table. A character check compiles down to an array index lookup and bitwise AND operation (`mask & (1 << charCode)`), resolving in a single CPU cycle.
```javascript
// Compiled to bitmask check by Irregexp:
const isAlphaNumeric = /[a-zA-Z0-9]/;
console.log(isAlphaNumeric.test("A")); // Single-cycle bitmask test
```

#### 74. What is the memory footprint of compiled Irregexp native machine code?
**Answer**: Compiled Irregexp machine code resides in V8's code space on the heap (typically 2 KB to 64 KB per compiled regex). Dynamically creating thousands of distinct regexes can trigger excessive code memory pressure.
```javascript
// Memory-optimized: Reuse pre-compiled static regex instances:
const RE_NUMBER = /^\d+$/;
```

#### 75. How do you safely run untrusted regular expressions in Node.js?
**Answer**: Run the regex matching inside an isolated Node.js `Worker` thread with a strict deadline timeout. If the worker fails to return within 50ms, terminate the worker thread.
```javascript
// Deadline pattern:
function timeoutGuard(promise, ms = 50) {
  const timeout = new Promise((_, reject) => 
    setTimeout(() => reject(new Error("Timeout")), ms)
  );
  return Promise.race([promise, timeout]);
}
```

#### 76. What is the Worker thread approach for isolated RegExp execution?
**Answer**: Spawn a dedicated background worker, post the pattern and target text, await a message within a `Promise.race` against a timer, and kill the worker if it exceeds the SLA.
```javascript
// worker_threads pattern:
// const { Worker } = require('node:worker_threads');
// const worker = new Worker('./regex_runner.js', { workerData: { pattern, input } });
```

#### 77. How do you implement a streaming regex parser for multi-gigabyte log files?
**Answer**: Read the file via Node.js `fs.createReadStream` with a chunk buffer. Maintain a sliding window of unparsed bytes that rolls over chunk boundaries, matching line patterns with sticky (`y`) regexes.
```javascript
function processChunk(chunk, regex) {
  let match;
  while ((match = regex.exec(chunk)) !== null) {
    // Process match
  }
}
```

#### 78. How do you build a tokenizing lexer for a custom programming language using sticky (`y`) regexes?
**Answer**: Combine all token patterns into sticky regexes. Set `lastIndex` to the current scan position. In a loop, test regexes at `lastIndex`, advance `lastIndex` by match length, and emit token objects.
```javascript
const tokenPattern = /(?<num>\d+)|(?<ident>[a-zA-Z_]\w*)|(?<op>[+\-*\/])/y;
tokenPattern.lastIndex = 0;
const match = tokenPattern.exec("count + 5");
console.log(match.groups.ident); // "count"
```

#### 79. How do Well-Known Symbols enable protocol-based programming in TypeScript/JavaScript?
**Answer**: They decouple consumers from concrete implementations. A consumer requires only that an object conform to a protocol (e.g. implementing `[Symbol.iterator]` or `[Symbol.dispose]`), enabling polymorphic duck typing.
```javascript
function serialize(obj) {
  if (typeof obj[Symbol.toPrimitive] === "function") {
    return obj[Symbol.toPrimitive]("string");
  }
  return String(obj);
}
```

#### 80. How do you implement the Dispose pattern using `Symbol.dispose` and `Symbol.asyncDispose` (ES2023)?
**Answer**: Attach `[Symbol.dispose]()` or `[Symbol.asyncDispose]()` to resources (database pools, file handles). When combined with the `using` or `await using` statement, the runtime guarantees deterministic cleanup.
```javascript
class ResourceHandle {
  #closed = false;
  [Symbol.dispose]() {
    this.#closed = true;
    console.log("Resource closed cleanly");
  }
}
// using handle = new ResourceHandle(); // Closed automatically on scope exit
```

#### 81. What is the `using` declaration and how does it relate to `Symbol.dispose`?
**Answer**: An explicit resource management statement: `using handle = openResource();`. When the block ends (normally or via throw), `handle[Symbol.dispose]()` is automatically called.
```javascript
// Syntactic form in modern TS / JS:
// {
//   using connection = db.connect();
//   connection.query();
// } // connection[Symbol.dispose]() invoked here!
```

#### 82. How do you build a cross-realm singleton using `Symbol.for()`?
**Answer**: Store the singleton instance on the global object using a Symbol registered in the Global Symbol Registry (`Symbol.for("app.singleton.instance")`).
```javascript
const SINGLETON_KEY = Symbol.for("app.telemetry.singleton");
if (!globalThis[SINGLETON_KEY]) {
  globalThis[SINGLETON_KEY] = { active: true };
}
const service = globalThis[SINGLETON_KEY];
```

#### 83. Why are Symbols immune to Prototype Pollution attacks?
**Answer**: Prototype pollution exploits key traversals such as `obj["__proto__"]` or `obj["constructor"]`. JSON parsing produces only string keys, making it impossible for malicious JSON payloads to inject Symbol properties into prototypes.
```javascript
const SAFE_STORE = Symbol("safe");
const target = {};
target[SAFE_STORE] = "immune_to_json_payloads";
```

#### 84. How do you design an extensible plugin architecture where plugins expose capabilities via Symbols?
**Answer**: Define an exported dictionary of capability Symbols. Plugins implement methods keyed by these Symbols. The host checks `if (plugin[CAN_EXPORT]) ...` without risk of method name collision.
```javascript
const PLUGIN_RUN = Symbol("plugin.run");
const myPlugin = {
  [PLUGIN_RUN]() { return "Plugin executed"; }
};
console.log(myPlugin[PLUGIN_RUN]()); // "Plugin executed"
```

#### 85. What are the performance implications of accessing Symbol-keyed properties vs String-keyed properties?
**Answer**: Access performance in V8 is virtually identical. Symbol properties are tracked in the object's Hidden Class transition tree just like string properties, achieving monomorphic Inline Cache optimization.
```javascript
const SYM = Symbol("perf");
const obj = { [SYM]: 100 };
// TurboFan inlines obj[SYM] via Inline Cache:
console.log(obj[SYM]); // 100
```

#### 86. How does V8 allocate Hidden Classes for objects containing Symbol properties?
**Answer**: V8 transitions the Hidden Class (Map) to record the Symbol descriptor offset, maintaining a distinct transition pointer in the class's descriptor array.
```javascript
const s = Symbol("shape");
const o1 = { [s]: 1 };
const o2 = { [s]: 2 }; // Shares identical Hidden Class (Map) with o1
```

#### 87. Can a Symbol property be non-enumerable, non-writable, or non-configurable?
**Answer**: Yes. Symbol properties have full Property Descriptors configured via `Object.defineProperty()`.
```javascript
const s = Symbol("locked");
const obj = {};
Object.defineProperty(obj, s, {
  value: 42,
  writable: false,
  enumerable: false,
  configurable: false
});
console.log(obj[s]); // 42
```

#### 88. How do you clone an object preserving its Symbol properties and descriptors?
**Answer**: Using `Object.getOwnPropertyDescriptors` and `Object.defineProperties`:
```javascript
function cloneWithSymbols(source) {
  const clone = Object.create(Object.getPrototypeOf(source));
  const descriptors = Object.getOwnPropertyDescriptors(source);
  Object.defineProperties(clone, descriptors);
  return clone;
}
const s = Symbol("key");
const orig = { [s]: "val" };
const cloned = cloneWithSymbols(orig);
console.log(cloned[s]); // "val"
```

#### 89. How do you implement a finite state machine using Symbols as state tokens?
**Answer**: Represent every discrete state and event as a unique Symbol. Use a `Map` keyed by state symbols to define transitions, guaranteeing zero accidental string typo bugs.
```javascript
const IDLE = Symbol("IDLE");
const BUSY = Symbol("BUSY");
const transitions = new Map([[IDLE, BUSY]]);
console.log(transitions.get(IDLE) === BUSY); // true
```

#### 90. What is the core philosophical rule of metaprogramming in modern JavaScript?
**Answer**: **Use metaprogramming to establish clean architectural protocols, never to obscure runtime flow**. Prefer Well-Known Symbols to customize standard engine behaviors (iteration, type coercion, resource cleanup), and guard Regular Expressions against non-linear backtracking to maintain rock-solid system reliability.
```javascript
// Clean protocol definition:
class SafeStream {
  *[Symbol.iterator]() { yield 1; }
  get [Symbol.toStringTag]() { return "SafeStream"; }
}
```



---

## 10. 15 TRICKY OUTPUT PREDICTION PUZZLES WITH EXECUTION TRACES

### Puzzle 1: Global RegExp lastIndex Alternating Test Trap
```javascript
const re = /foo/g;
console.log(re.test("foo"));
console.log(re.test("foo"));
console.log(re.test("foo"));
```
**Output**:
```text
true
false
true
```
**Execution Trace**:
1. First call: `re.test("foo")` finds a match at index 0. It sets `re.lastIndex = 3` and returns `true`.
2. Second call: `re.test("foo")` begins searching from `re.lastIndex` (3). It finds no match after index 3, resets `re.lastIndex = 0`, and returns `false`.
3. Third call: With `re.lastIndex` reset to 0, it searches from the beginning, matches again, and returns `true`.

---

### Puzzle 2: String Split with Capturing Parentheses
```javascript
const str = "apple1banana2orange";
const res1 = str.split(/\d/);
const res2 = str.split(/(\d)/);
console.log(res1.length, res2.length);
```
**Output**:
```text
3 5
```
**Execution Trace**:
1. `str.split(/\d/)`: Non-capturing delimiter splits `str` into 3 segments: `["apple", "banana", "orange"]` (length 3).
2. `str.split(/(\d)/)`: When the separator contains capturing parentheses, the captured separators are spliced into the returned array: `["apple", "1", "banana", "2", "orange"]` (length 5).

---

### Puzzle 3: Lookbehind Zero-Width Assertion
```javascript
const regex = /(?<=\$)\d+/;
const match = regex.exec("Order cost: $150 total");
console.log(match[0], match.index);
```
**Output**:
```text
150 13
```
**Execution Trace**:
1. `(?<=\$)` asserts that the digits are immediately preceded by a dollar sign `$`.
2. The lookbehind is a zero-width assertion: it matches the position between `$` and `1`, without consuming the `$`.
3. `match[0]` captures strictly `"150"`.
4. The start index of `"150"` in the string is 13.

---

### Puzzle 4: Lazy Quantifier Trailing Backtracking
```javascript
const text = "<div><span>Hello</span></div>";
const greedy = text.match(/<.*>/)[0];
const lazy = text.match(/<.*?>/)[0];
console.log(greedy.length, lazy.length);
```
**Output**:
```text
29 5
```
**Execution Trace**:
1. `/<.*>/` is greedy: it consumes up to the final `>` in the entire string (`<div><span>Hello</span></div>`, 29 chars).
2. `/<.*?>/` is lazy: it stops at the very first `>` encountered (`<div>`, 5 chars).

---

### Puzzle 5: Symbol Uniqueness Comparison
```javascript
const s1 = Symbol("token");
const s2 = Symbol("token");
const s3 = Symbol.for("token");
const s4 = Symbol.for("token");

console.log(s1 === s2, s3 === s4);
```
**Output**:
```text
false true
```
**Execution Trace**:
1. `Symbol("token")` creates a brand new unique symbol every time. `s1 === s2` is `false`.
2. `Symbol.for("token")` registers and retrieves a shared global symbol from the Global Symbol Registry. `s3 === s4` is `true`.

---

### Puzzle 6: Symbol.keyFor on Local vs Global Symbols
```javascript
const local = Symbol("alpha");
const globalSym = Symbol.for("beta");

console.log(Symbol.keyFor(local), Symbol.keyFor(globalSym));
```
**Output**:
```text
undefined beta
```
**Execution Trace**:
1. `Symbol.keyFor()` inspects the Global Symbol Registry.
2. `local` was not registered with `Symbol.for()`, so it returns `undefined`.
3. `globalSym` is in the registry, returning `"beta"`.

---

### Puzzle 7: Symbol.toPrimitive Priority
```javascript
const item = {
  valueOf() { return 10; },
  toString() { return "item"; },
  [Symbol.toPrimitive](hint) {
    return hint === "number" ? 100 : 200;
  }
};

console.log(+item, item + 5);
```
**Output**:
```text
100 205
```
**Execution Trace**:
1. `+item` invokes `ToPrimitive` with hint `"number"`. `[Symbol.toPrimitive]` takes precedence over `valueOf`, returning `100`.
2. `item + 5` invokes `ToPrimitive` with hint `"default"`. `[Symbol.toPrimitive]` returns `200`. `200 + 5 = 205`.

---

### Puzzle 8: Symbol.toStringTag Custom Tag
```javascript
class CloudStorage {
  get [Symbol.toStringTag]() {
    return "S3Bucket";
  }
}

const bucket = new CloudStorage();
console.log(Object.prototype.toString.call(bucket));
```
**Output**:
```text
[object S3Bucket]
```
**Execution Trace**:
1. `Object.prototype.toString.call()` checks for the `Symbol.toStringTag` property on the target object.
2. It reads `"S3Bucket"` and formats the tag as `"[object S3Bucket]"`.

---

### Puzzle 9: Object Reflection with Symbols
```javascript
const sym = Symbol("secret");
const obj = {
  name: "Service",
  [sym]: 42
};

console.log(Object.keys(obj).length, Object.getOwnPropertySymbols(obj).length);
```
**Output**:
```text
1 1
```
**Execution Trace**:
1. `Object.keys(obj)` returns only string keys: `['name']` (length 1).
2. `Object.getOwnPropertySymbols(obj)` returns only symbol keys: `[Symbol(secret)]` (length 1).

---

### Puzzle 10: JSON.stringify with Symbols
```javascript
const id = Symbol("id");
const data = {
  user: "Alice",
  [id]: 12345,
  role: Symbol("ADMIN")
};

console.log(JSON.stringify(data));
```
**Output**:
```text
{"user":"Alice"}
```
**Execution Trace**:
1. `JSON.stringify()` omits Symbol-keyed properties entirely (`[id]: 12345` is ignored).
2. For properties whose values are Symbols (`role: Symbol("ADMIN")`), it omits the property from the output object.
3. Only `{"user":"Alice"}` is serialized.

---

### Puzzle 11: Symbol.hasInstance Customization
```javascript
const OddNumber = {
  [Symbol.hasInstance](val) {
    return typeof val === "number" && val % 2 !== 0;
  }
};

console.log(3 instanceof OddNumber, 4 instanceof OddNumber);
```
**Output**:
```text
true false
```
**Execution Trace**:
1. The expression `3 instanceof OddNumber` invokes `OddNumber[Symbol.hasInstance](3)`.
2. Since 3 is an odd number, it evaluates to `true`. 4 evaluates to `false`.

---

### Puzzle 12: String replace with Capture Replacer
```javascript
const raw = "2026-09";
const formatted = raw.replace(/(\d{4})-(\d{2})/, (match, year, month) => {
  return `${month}/${year}`;
});
console.log(formatted);
```
**Output**:
```text
09/2026
```
**Execution Trace**:
1. The regex captures `(\d{4})` as group 1 (`"2026"`) and `(\d{2})` as group 2 (`"09"`).
2. The replacer function receives `(match, p1, p2)`, returning `"09/2026"`.

---

### Puzzle 13: Sticky Flag y lastIndex Strictness
```javascript
const text = "abc123xyz";
const stickyRe = /\d+/y;

stickyRe.lastIndex = 2;
console.log(stickyRe.test(text)); // index 2 is 'c'

stickyRe.lastIndex = 3;
console.log(stickyRe.test(text)); // index 3 is '1'
```
**Output**:
```text
false
true
```
**Execution Trace**:
1. With the `y` flag, the match must occur strictly at `lastIndex`.
2. At `lastIndex = 2`, character is `"c"` (not a digit), match fails, and `lastIndex` resets to 0.
3. Setting `lastIndex = 3` points to `"1"` (digit), match succeeds.

---

### Puzzle 14: Symbol.isConcatSpreadable Set to False
```javascript
const arr1 = [1, 2];
const arr2 = [3, 4];
arr2[Symbol.isConcatSpreadable] = false;

const res = arr1.concat(arr2);
console.log(res.length, Array.isArray(res[2]));
```
**Output**:
```text
3 true
```
**Execution Trace**:
1. Standard arrays have `Symbol.isConcatSpreadable` effectively true by default.
2. Explicitly setting `arr2[Symbol.isConcatSpreadable] = false` prevents flattening.
3. `arr2` is inserted into the result as a single element: `[1, 2, [3, 4]]`.

---

### Puzzle 15: DotAll Flag with Multiline Newlines
```javascript
const multiline = "line1\nline2";
const reWithoutS = /line1.line2/;
const reWithS = /line1.line2/s;

console.log(reWithoutS.test(multiline), reWithS.test(multiline));
```
**Output**:
```text
false true
```
**Execution Trace**:
1. By default, `.` does not match newline characters (`\n`). `reWithoutS` fails.
2. With the `s` (dotAll) flag, `.` matches `\n`, so `reWithS` succeeds.



---

## 11. 4 PROGRESSIVE REAL-WORLD PROJECTS

### Project 1: Enterprise Log Parser & Anomaly Detection Engine

#### Architectural Blueprint
```text
┌────────────────────────────────────────────────────────────────────────┐
│                   ENTERPRISE LOG PARSER & ANOMALY DETECTOR             │
├────────────────────────────────────────────────────────────────────────┤
│  Log Input: Standard Common/Combined log format strings                │
│  Named Capture RegExp: Extracts timestamp, level, status, message      │
│  Anomaly Detector: Categorizes 5xx errors & spikes in latency          │
│  Metrics Collector: Aggregates error rates per service component       │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
                                    ▼
       ┌─────────────────────────────────────────────────────────┐
       │ Extracted Data: { timestamp, level, code, duration, msg }│
       └─────────────────────────────────────────────────────────┘
```

#### Production Implementation
```javascript
/**
 * Industrial-Grade Log Parser & Anomaly Detection Engine
 */
class LogParserEngine {
  // Named capture groups with strictly bounded quantifiers to avoid ReDoS:
  static #logPattern = /^\[(?<timestamp>\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z)\]\s+(?<level>INFO|WARN|ERROR|FATAL)\s+\[(?<service>[a-zA-Z0-9_-]{1,64})\]\s+(?<code>\d{3})\s+(?<duration>\d+)ms\s+-\s+(?<message>.+)$/;

  #records = [];
  #anomalies = [];

  parseLine(line) {
    if (typeof line !== "string") return null;
    const match = LogParserEngine.#logPattern.exec(line.trim());
    if (!match || !match.groups) return null;

    const record = {
      timestamp: match.groups.timestamp,
      level: match.groups.level,
      service: match.groups.service,
      statusCode: parseInt(match.groups.code, 10),
      durationMs: parseInt(match.groups.duration, 10),
      message: match.groups.message
    };

    this.#records.push(record);

    // Anomaly checks (5xx status or latency > 500ms):
    if (record.statusCode >= 500 || record.durationMs > 500) {
      this.#anomalies.push(record);
    }

    return record;
  }

  get totalParsed() {
    return this.#records.length;
  }

  get anomalyCount() {
    return this.#anomalies.length;
  }

  getAnomalies() {
    return [...this.#anomalies];
  }
}

// Verification Suite:
const parser = new LogParserEngine();
const line1 = "[2026-09-24T18:30:00.123Z] INFO [auth-service] 200 45ms - Token verified successfully";
const line2 = "[2026-09-24T18:30:01.456Z] ERROR [payment-gateway] 503 620ms - Downstream timeout communicating with bank";

const r1 = parser.parseLine(line1);
console.assert(r1.service === "auth-service" && r1.statusCode === 200, "Line 1 parsed successfully");
console.assert(r1.durationMs === 45, "Duration parsed accurately");

const r2 = parser.parseLine(line2);
console.assert(r2.level === "ERROR" && r2.statusCode === 503, "Line 2 parsed successfully");

console.assert(parser.totalParsed === 2, "Total parsed count is 2");
console.assert(parser.anomalyCount === 1, "Detected exactly 1 anomaly (503 status + >500ms duration)");
```

---

### Project 2: ReDoS-Resilient Markdown Tokenizer & Lexer

#### Architectural Blueprint
```text
┌────────────────────────────────────────────────────────────────────────┐
│                   ReDoS-RESILIENT MARKDOWN LEXER                       │
├────────────────────────────────────────────────────────────────────────┤
│  Input String: Raw markdown document                                   │
│  Sticky Tokenizer (/.../y): Strictly linear scan without backtracking  │
│  Token Hierarchy: Headers, Bold, Italic, Code, Text                    │
│  Guaranteed Performance: $O(N)$ execution time bound                   │
└────────────────────────────────────────────────────────────────────────┘
```

#### Production Implementation
```javascript
/**
 * Linear-Time ReDoS-Resilient Markdown Lexer
 */
class MarkdownLexer {
  tokenize(markdown) {
    const tokens = [];
    const tick = String.fromCharCode(96);
    const nl = String.fromCharCode(10);
    const cr = String.fromCharCode(13);
    const lines = markdown.split(nl).map(l => l.replaceAll(cr, ""));

    for (let lineIndex = 0; lineIndex < lines.length; lineIndex++) {
      let line = lines[lineIndex];
      if (line.startsWith("#")) {
        let hCount = 0;
        while (hCount < line.length && line[hCount] === "#") hCount++;
        if (hCount >= 1 && hCount <= 6 && line[hCount] === " ") {
          tokens.push({
            type: "HEADER",
            level: hCount,
            value: line.slice(hCount + 1).trim()
          });
          continue;
        }
      }

      let cursor = 0;
      while (cursor < line.length) {
        if (line.slice(cursor, cursor + 2) === "**") {
          const end = line.indexOf("**", cursor + 2);
          if (end !== -1) {
            tokens.push({
              type: "BOLD",
              value: line.slice(cursor + 2, end)
            });
            cursor = end + 2;
            continue;
          }
        }

        if (line[cursor] === tick) {
          const end = line.indexOf(tick, cursor + 1);
          if (end !== -1) {
            tokens.push({
              type: "CODE",
              value: line.slice(cursor + 1, end)
            });
            cursor = end + 1;
            continue;
          }
        }

        const bPos = line.indexOf("**", cursor);
        const cPos = line.indexOf(tick, cursor);
        const nextSpecial = Math.min(
          bPos === -1 ? Infinity : bPos,
          cPos === -1 ? Infinity : cPos
        );

        const textSlice = nextSpecial === Infinity ? line.slice(cursor) : line.slice(cursor, nextSpecial);
        if (textSlice.trim()) {
          tokens.push({ type: "TEXT", value: textSlice.trim() });
        }
        cursor = nextSpecial === Infinity ? line.length : nextSpecial;
      }
    }

    return tokens;
  }
}

// Verification Suite:
const lexer = new MarkdownLexer();
const tick = String.fromCharCode(96);
const nl = String.fromCharCode(10);
const sample = ["# Hello", "**Bold text** and " + tick + "code snippet" + tick].join(nl);
const tokens = lexer.tokenize(sample);

console.assert(tokens.some(t => t.type === "HEADER" && t.value === "Hello"), "Header token recognized");
console.assert(tokens.some(t => t.type === "BOLD" && t.value === "Bold text"), "Bold token recognized");
console.assert(tokens.some(t => t.type === "CODE" && t.value === "code snippet"), "Code token recognized");
```

---

### Project 3: Metaprogrammed Domain Entity with Well-Known Symbols

#### Architectural Blueprint
```text
┌────────────────────────────────────────────────────────────────────────┐
│               METAPROGRAMMED INVENTORY REPOSITORY MODEL                │
├────────────────────────────────────────────────────────────────────────┤
│  Symbol.iterator: Allows direct for..of iteration over active items   │
│  Symbol.toPrimitive: Formats summary on string, total value on number  │
│  Symbol.toStringTag: Returns '[object InventoryCatalog]'               │
│  Symbol.hasInstance: Checks if target conforms to Inventory item shape │
└────────────────────────────────────────────────────────────────────────┘
```

#### Production Implementation
```javascript
/**
 * Metaprogrammed Inventory Catalog Engine
 */
class InventoryCatalog {
  #items = new Map();

  addItem(sku, name, priceCents) {
    this.#items.set(sku, { sku, name, priceCents });
    return this;
  }

  *[Symbol.iterator]() {
    for (const item of this.#items.values()) {
      yield item;
    }
  }

  [Symbol.toPrimitive](hint) {
    if (hint === "number") {
      let total = 0;
      for (const item of this.#items.values()) {
        total += item.priceCents;
      }
      return total / 100;
    }
    if (hint === "string") {
      return `InventoryCatalog: ${this.#items.size} distinct SKUs`;
    }
    return this.#items.size;
  }

  get [Symbol.toStringTag]() {
    return "InventoryCatalog";
  }

  static [Symbol.hasInstance](instance) {
    return (
      typeof instance === "object" &&
      instance !== null &&
      typeof instance.sku === "string" &&
      typeof instance.priceCents === "number"
    );
  }
}

// Verification Suite:
const catalog = new InventoryCatalog();
catalog
  .addItem("SKU-1", "Mechanical Keyboard", 12000)
  .addItem("SKU-2", "Wireless Mouse", 6000);

// 1. Symbol.iterator verification:
const skus = [];
for (const item of catalog) {
  skus.push(item.sku);
}
console.assert(skus.join(",") === "SKU-1,SKU-2", "Iterator yields catalog items");

// 2. Symbol.toPrimitive verification:
console.assert(+catalog === 180, "Number coercion sums dollar amount ($180.00)");
console.assert(String(catalog) === "InventoryCatalog: 2 distinct SKUs", "String coercion formats description");

// 3. Symbol.toStringTag verification:
console.assert(Object.prototype.toString.call(catalog) === "[object InventoryCatalog]");

// 4. Symbol.hasInstance verification:
const validItem = { sku: "SKU-3", priceCents: 2500 };
const invalidItem = { name: "Missing SKU" };
console.assert((validItem instanceof InventoryCatalog) === true, "Duck-typed item satisfies hasInstance");
console.assert((invalidItem instanceof InventoryCatalog) === false, "Incomplete item rejected by hasInstance");
```

---

### Project 4: High-Performance PII & Sensitive Data Redaction Engine

#### Architectural Blueprint
```text
┌────────────────────────────────────────────────────────────────────────┐
│                   ENTERPRISE SENSITIVE DATA REDACTOR                   │
├────────────────────────────────────────────────────────────────────────┤
│  Pattern Catalog: Social Security, Credit Cards, Emails, API Keys      │
│  Masking Rules: Partial obfuscation (e.g. ****-****-****-1234)        │
│  Safe Replacers: Uses replacer functions with capture group mapping    │
│  Audit Telemetry: Counts redacted instances without logging raw values │
└────────────────────────────────────────────────────────────────────────┘
```

#### Production Implementation
```javascript
/**
 * Sensitive Data Redaction Engine
 */
class SensitiveDataRedactor {
  #redactionCounts = new Map();

  static #patterns = [
    {
      name: "CREDIT_CARD",
      regex: /\b(?:\d{4}[ -]?){3}(\d{4})\b/g,
      mask: (_, last4) => `****-****-****-${last4}`
    },
    {
      name: "SSN",
      regex: /\b\d{3}-\d{2}-(\d{4})\b/g,
      mask: (_, last4) => `***-**-${last4}`
    },
    {
      name: "EMAIL",
      regex: /\b([a-zA-Z0-9_.+-])[a-zA-Z0-9_.+-]*@([a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+)\b/g,
      mask: (_, firstChar, domain) => `${firstChar}***@${domain}`
    }
  ];

  redact(text) {
    if (typeof text !== "string") return text;
    let sanitized = text;

    for (const rule of SensitiveDataRedactor.#patterns) {
      sanitized = sanitized.replace(rule.regex, (...args) => {
        const currentCount = this.#redactionCounts.get(rule.name) || 0;
        this.#redactionCounts.set(rule.name, currentCount + 1);
        return rule.mask(args[0], args[1], args[2]);
      });
    }

    return sanitized;
  }

  getRedactionCount(type) {
    return this.#redactionCounts.get(type) || 0;
  }
}

// Verification Suite:
const redactor = new SensitiveDataRedactor();
const input = "Customer john.smith@enterprise.com with SSN 123-45-6789 paid using card 4111-2222-3333-9876";
const output = redactor.redact(input);

console.assert(output.includes("j***@enterprise.com"), "Email masked properly");
console.assert(output.includes("***-**-6789"), "SSN masked properly");
console.assert(output.includes("****-****-****-9876"), "Credit card masked properly");
console.assert(!output.includes("123-45"), "Raw SSN removed");
console.assert(!output.includes("4111-2222"), "Raw credit card removed");
console.assert(redactor.getRedactionCount("CREDIT_CARD") === 1, "Counted 1 credit card redaction");
console.assert(redactor.getRedactionCount("SSN") === 1, "Counted 1 SSN redaction");
```



---

## 12. PRODUCTION BEST PRACTICES: DOS AND DON'TS MATRIX

| Rule # | DO / DON'T | Bad Code | Good Code | Why & Architectural Impact |
|:---|:---|:---|:---|:---|
| **1** | **DON'T** reuse global RegExp instances across requests | `const re = /api/g; function check(url) { return re.test(url); }` | `function check(url) { return /api/.test(url); }` | The `g` flag mutates `lastIndex`, causing concurrent requests to interleave and return false negatives. |
| **2** | **DO** escape user inputs before creating dynamic regexes | `new RegExp(userInput);` | `new RegExp(escapeRegExp(userInput));` | Unescaped metacharacters cause runtime syntax errors and expose services to catastrophic ReDoS attacks. |
| **3** | **DON'T** use nested quantifiers | `/^(a+)+$/` | `/^a+$/` | Nested quantifiers cause exponential $O(2^N)$ backtracking on non-matching strings, freezing the Node.js event loop. |
| **4** | **DO** use non-capturing groups when captures aren't needed | `/(https\|http):\/\//` | `/(?:https\|http):\/\//` | Non-capturing groups avoid allocating temporary capture group memory arrays during execution. |
| **5** | **DO** use named capture groups for self-documenting code | `const [_, yr, mo] = date.match(/(\d{4})-(\d{2})/);` | `const { groups: { yr, mo } } = date.match(/(?<yr>\d{4})-(?<mo>\d{2})/);` | Named capture groups prevent brittle positional indexing bugs when regexes are refactored. |
| **6** | **DON'T** use `new Symbol()` | `const s = new Symbol();` | `const s = Symbol();` | `Symbol` is a primitive factory function; calling it with `new` throws a `TypeError`. |
| **7** | **DO** use `Symbol.for()` for cross-module or cross-realm sharing | `const KEY = Symbol("myAppKey");` | `const KEY = Symbol.for("myAppKey");` | Only symbols in the Global Symbol Registry are shared across iframes, worker threads, and module boundaries. |
| **8** | **DO** use `Symbol.toPrimitive` over legacy `valueOf` / `toString` | `obj.valueOf = fn; obj.toString = fn;` | `obj[Symbol.toPrimitive] = fn;` | `Symbol.toPrimitive` receives the exact engine coercion hint (`"number"`, `"string"`, `"default"`) in a unified API. |
| **9** | **DON'T** assume Symbols are completely hidden or private | Relying on Symbols for hard cryptographic privacy | Use `#private` fields for hard runtime privacy | Symbols can be discovered and extracted via `Object.getOwnPropertySymbols()` and `Reflect.ownKeys()`. |
| **10** | **DO** use the `s` (dotAll) flag when matching multiline text | `/[\s\S]*/` | `/.* /s` | The `s` flag clearly expresses intent that `.` should match newlines without obscure character class hacks. |
| **11** | **DO** use `String#matchAll` instead of repetitive `RegExp#exec` loops | `let m; while ((m = re.exec(str))) { ... }` | `for (const m of str.matchAll(re)) { ... }` | `matchAll` provides a clean iterator yielding match objects with capture groups and offsets. |
| **12** | **DON'T** convert Symbols implicitly to strings | `"ID: " + sym` | `"ID: " + String(sym)` or `"ID: " + sym.description` | Implicit Symbol-to-string coercion throws a `TypeError` in JavaScript. |
| **13** | **DO** use sticky (`y`) regexes for linear token parsing | Slicing strings repeatedly with `str.slice(i).match(...)` | `re.lastIndex = i; re.exec(str);` | Sticky regexes avoid copying substring buffers, dramatically accelerating tokenizer performance. |
| **14** | **DO** audit third-party regexes with ReDoS checkers in CI | Blindly copying complex regexes from StackOverflow | Run `eslint-plugin-regexp` or static ReDoS analysis | Prevents zero-day denial of service vulnerabilities in production web applications. |
| **15** | **DO** customize `Symbol.toStringTag` on domain classes | Leaving default `[object Object]` output | `get [Symbol.toStringTag]() { return "UserEntity"; }` | Custom tags improve debuggability in APM monitoring tools, logs, and Node.js inspection. |

---

## 13. REAL-WORLD CASE STUDY: THE CLOUDFLARE 2019 GLOBAL REDOS OUTAGE

### Incident Context
On July 2, 2019, Cloudflare suffered a catastrophic 27-minute global outage that caused over 50% of all worldwide HTTP traffic passing through their network to fail with 502 Bad Gateway errors.

### The Vulnerable Rule
Cloudflare engineers deployed an updated Web Application Firewall (WAF) managed rule to detect Cross-Site Scripting (XSS) attacks. The rule included the following regular expression:

```regex
(?:(?:"|'|]|}|\)|[\s\S]*?[\s\S]*?\w)[\s\S]*=[\s\S]*["')\]])
```

Notice the nested repetition:
```regex
[\s\S]*?[\s\S]*?\w
```
Two unanchored, overlapping `[\s\S]*` wildcards preceding a word character and an `=` operator.

### The Mechanism of Collapse
When an HTTP request containing a non-matching payload arrived at Cloudflare's edge servers running Google's V8 (or PCRE regex engine), the engine attempted millions of permutations to determine how the two wildcards could divide the input text.
- CPU usage spiked to **100% across all CPU cores** in every Cloudflare edge point of presence (PoP) worldwide.
- The Nginx worker threads became completely starved of CPU cycles, unable to accept or route any incoming network traffic.

### Enterprise Remediation & Lessons
1. **Never Deploy Unanchored Double Wildcards**: Patterns must have disjoint character sets or atomic constraints.
2. **Execution Timeouts**: All regex engines evaluating untrusted or dynamic patterns must enforce an execution deadline (e.g. 5ms).
3. **CI/CD Static Analysis**: Automated checkers must evaluate regex time complexity before configuration rules reach production edge networks.

---

## 14. 75 PRACTICE EXERCISES ACROSS 4 TIERS

### Tier 1: Fundamentals of RegExp & Symbols (Exercises 1 to 20)
1. Write a regular expression that checks if a string is a valid hexadecimal color (e.g. `#FFF` or `#123456`).
2. Test if a string contains only numeric digits using `/^\d+$/`.
3. Extract all vowels from a string using `String#match` with a global regex.
4. Replace all occurrences of multiple consecutive spaces with a single space.
5. Create a Symbol with the description `"sessionId"` and inspect its `description` property.
6. Verify that two symbols created with the same description are not equal (`Symbol("a") !== Symbol("a")`).
7. Create an object with a Symbol property key and access it using bracket notation.
8. Show that `Object.keys()` ignores Symbol-keyed properties.
9. Retrieve all Symbol property keys of an object using `Object.getOwnPropertySymbols()`.
10. Demonstrate that attempting to concatenate a Symbol with a string (`sym + "test"`) throws a `TypeError`.
11. Explicitly convert a Symbol to a string using `String(sym)`.
12. Check if a string begins with `"https://"` using a regular expression with the `^` anchor.
13. Check if a string ends with `".json"` using a regular expression with the `$` anchor.
14. Use the `i` flag to match the word `"javascript"` regardless of case.
15. Use the `m` flag to match lines starting with `"#" ` in a multiline string.
16. Write a regex that matches any 4-letter word bounded by `\b` word boundaries.
17. Use the `s` flag to match everything between `/*` and `*/` across multiple lines.
18. Test a string with `re.test()` and verify the boolean result.
19. Execute a regex with `re.exec()` and extract the `index` property of the match.
20. Check whether `typeof Symbol() === "symbol"`.

### Tier 2: Flags, Groups, Lookarounds & Symbol Registries (Exercises 21 to 40)
21. Write a regex that extracts domain names from email addresses using a capturing group.
22. Refactor the previous regex to use a named capture group `(?<domain>[\w.-]+)`.
23. Demonstrate the difference between a capturing group `(\d+)` and a non-capturing group `(?:\d+)` in `exec()` output.
24. Use positive lookahead `(?=\d{4})` to match words immediately followed by a 4-digit year.
25. Use negative lookahead `(?!\.git)` to match paths that do not contain `.git`.
26. Use positive lookbehind `(?<=@)[a-z]+` to match the company name directly after the `@` symbol in an email.
27. Use negative lookbehind `(?<!\\)"` to match unescaped quotation marks.
28. Demonstrate the `lastIndex` behavior of a global RegExp by calling `test()` twice on the same string.
29. Reset `lastIndex = 0` after a match and verify consistent matching behavior.
30. Use `String#matchAll` to extract all numbers from a string with their respective indices.
31. Use the `d` flag (hasIndices) to extract exact start and end offsets of a match.
32. Demonstrate how the `y` (sticky) flag fails if the match is not located at `lastIndex`.
33. Use the `u` flag to match an emoji character without splitting its surrogate pairs.
34. Register a symbol in the Global Symbol Registry using `Symbol.for("app.id")`.
35. Retrieve the same symbol from the Global Symbol Registry and verify strict identity equality (`===`).
36. Use `Symbol.keyFor()` to retrieve the key of a registered global symbol.
37. Confirm that `Symbol.keyFor()` returns `undefined` when passed a local symbol created via `Symbol()`.
38. Serialize an object with Symbol keys using `JSON.stringify()` and observe the omission.
39. Retrieve all own keys (strings and Symbols) using `Reflect.ownKeys()`.
40. Implement a regex replacer function that doubles all numbers found in a text string.

### Tier 3: Well-Known Symbols & Metaprogramming (Exercises 41 to 60)
41. Implement `[Symbol.iterator]()` on a custom class `LinkedList` to make it iterable with `for...of`.
42. Implement a generator method `*[Symbol.iterator]()` on an object that yields fibonacci numbers up to $N$.
43. Implement `[Symbol.toPrimitive](hint)` on a class `Temperature` that returns numbers for numeric coercion and Celsius strings for string coercion.
44. Verify that unary plus (`+`) triggers the `"number"` hint on your `Temperature` class.
45. Verify that template literals (``${temp}``) trigger the `"string"` hint on your `Temperature` class.
46. Implement `get [Symbol.toStringTag]()` on a custom class and verify `Object.prototype.toString.call(inst)`.
47. Implement `[Symbol.hasInstance]()` on an object to validate whether a number is prime.
48. Subclass `Array` to create `MyArray` and override `static get [Symbol.species]()` to return `Array`.
49. Set `Symbol.isConcatSpreadable = false` on an array and verify that `concat` does not flatten it.
50. Create a custom matcher object implementing `[Symbol.match]()` and pass it to `String#match`.
51. Create a custom replacer object implementing `[Symbol.replace]()` and pass it to `String#replace`.
52. Create a custom splitter object implementing `[Symbol.split]()` and pass it to `String#split`.
53. Implement an asynchronous iterable using `[Symbol.asyncIterator]()` that yields items with a delay.
54. Consume the async iterable using `for await (const item of asyncIterable)`.
55. Store private state on an object using a non-exported Symbol key to achieve soft encapsulation.
56. Create a property descriptor on a Symbol property that sets `enumerable: false` and `writable: false`.
57. Copy an object along with all its Symbol properties using `Object.assign()`.
58. Write a function `cloneAllDescriptors(obj)` using `Object.getOwnPropertyDescriptors` to clone both String and Symbol properties.
59. Use a Symbol as a key in a `WeakMap` (ES2023 feature).
60. Show that global symbols created via `Symbol.for` cannot be used as WeakMap keys.

### Tier 4: Senior Architecture, Engine Internals & Security Hardening (Exercises 61 to 75)
61. Write a utility function `escapeRegExp(str)` that escapes all 14 regex metacharacters.
62. Benchmark the execution time of `/a+/test("a".repeat(1000))` vs `/a*?/test("a".repeat(1000))`.
63. Write a regex containing catastrophic backtracking (e.g. `/^(a+)+$/`) and measure the execution time on `"a".repeat(25) + "!"`.
64. Implement a safe regex wrapper `safeTest(re, str, timeoutMs)` that guards against ReDoS using `Promise.race` or a worker.
65. Build an isolated Worker thread runner in Node.js that executes regular expressions in a separate thread.
66. Implement a tokenizer for a simple math arithmetic expression (`3 + 4 * (2 - 1)`) using sticky (`y`) regexes.
67. Build a PII scrubber that finds and redacts email addresses, phone numbers, and credit cards from logs.
68. Design an extensible plugin system where plugins register lifecycle hooks using Well-Known Symbols.
69. Implement the Dispose pattern on a custom database connection using `[Symbol.dispose]()` (ES2023).
70. Use the `using` keyword with your disposable connection object to assert deterministic cleanup.
71. Build an in-memory Key-Value store that uses Symbols to prevent user-supplied keys from causing Prototype Pollution.
72. Implement a cross-realm singleton service that retrieves its shared state from `globalThis[Symbol.for("app.state")]`.
73. Measure the V8 memory impact of compiling 10,000 unique dynamic regular expressions using `process.memoryUsage()`.
74. Implement a finite state machine where states and transitions are typed using unique Symbols.
75. Write an automated linter rule or script that scans source code for regular expressions containing nested quantifiers.

---

## 15. MODULE SUMMARY & KEY INVARIANTS

1. **V8 Irregexp JIT Engine**: Regular expressions are not interpreted line-by-line; V8 translates them into specialized bytecode and native machine code. Stateful flags (`g`, `y`) store state in mutable `lastIndex`, which must never be shared across concurrent operations.
2. **Catastrophic Backtracking (ReDoS)**: Nested or overlapping quantifiers evaluated on non-matching inputs produce exponential $O(2^N)$ backtracking that blocks the single-threaded Node.js event loop. Defend against ReDoS by eliminating nested repetitions and strictly sanitizing dynamic input via `escapeRegExp`.
3. **The Symbol Primitive**: Unique, immutable primitives designed as non-colliding object property keys. Symbols are non-enumerable in `Object.keys()` and ignored by `JSON.stringify()`, but accessible via `Object.getOwnPropertySymbols()` and `Reflect.ownKeys()`.
4. **Local vs Global Symbols**: `Symbol("k")` creates an unforgeable, private local symbol. `Symbol.for("k")` registers and shares a common symbol across the entire runtime process, including iframes, workers, and module boundaries.
5. **Well-Known Symbols (Metaprogramming Protocols)**: Standardized language hooks that allow developers to override fundamental runtime mechanics:
   - `Symbol.iterator` / `Symbol.asyncIterator`: Synchronous and asynchronous iteration.
   - `Symbol.toPrimitive`: Dynamic type coercion hints (`"number"`, `"string"`, `"default"`).
   - `Symbol.toStringTag`: Custom object representation in `Object.prototype.toString`.
   - `Symbol.hasInstance`: Overriding `instanceof` evaluation.
   - `Symbol.dispose` / `Symbol.asyncDispose`: Deterministic explicit resource management with `using`.
