# Module 02: Primitives, Type Coercion & Equality Mechanics

> **Executive Invariant**: In JavaScript, values have types, but variables are merely untyped memory bindings. Coercion is not arbitrary or unpredictable—it is governed by deterministic ECMAScript abstract operations (`ToPrimitive`, `ToBoolean`, `ToNumber`, `ToString`). Master these low-level mechanical algorithms, and you will never suffer from subtle truthy/falsy bugs, numeric precision corruption, or authentication bypasses.

---

## Table of Contents
1. [01. Introduction & Historical Genesis](#01-introduction--historical-genesis)
2. [02. The V8 Memory Mental Model: Stack vs Heap & Pointer Tagging](#02-the-v8-memory-mental-model-stack-vs-heap--pointer-tagging)
3. [03. The 7 Primitive Types in Complete Depth](#03-the-7-primitive-types-in-complete-depth)
4. [04. The Primitive Wrappers & Auto-Boxing Mechanics](#04-the-primitive-wrappers--auto-boxing-mechanics)
5. [05. IEEE 754 Floating-Point Mechanics: Why `0.1 + 0.2 !== 0.3`](#05-ieee-754-floating-point-mechanics-why-01--02--03)
6. [06. Special Numeric Values: `NaN`, `+0`, `-0`, `Infinity`](#06-special-numeric-values-nan-0--0-infinity)
7. [07. Arbitrary Precision with BigInt](#07-arbitrary-precision-with-bigint)
8. [08. Unique Identifiers with Symbol & Well-Known Symbols](#08-unique-identifiers-with-symbol--well-known-symbols)
9. [09. ECMAScript Abstract Operations: The Engine Coercion Rules](#09-ecmascript-abstract-operations-the-engine-coercion-rules)
   - 9.1 `ToBoolean` (The Complete Truthy / Falsy Matrix)
   - 9.2 `ToNumber`
   - 9.3 `ToString`
   - 9.4 `ToPrimitive` (PreferredType, `valueOf`, `toString`, `Symbol.toPrimitive`)
10. [10. Explicit Type Casting: Idiomatic & Production Techniques](#10-explicit-type-casting-idiomatic--production-techniques)
11. [11. Implicit Coercion in Operators: `+`, `-`, `*`, `!`, `~`](#11-implicit-coercion-in-operators----)
12. [12. The Complete Equality Comparison Algorithms](#12-the-complete-equality-comparison-algorithms)
    - 12.1 Loose Equality (`==` / `Abstract Equality Comparison`)
    - 12.2 Strict Equality (`===` / `Strict Equality Comparison`)
    - 12.3 SameValue (`Object.is`)
    - 12.4 SameValueZero (`Array.prototype.includes`, `Set`, `Map`)
13. [13. Common Real-World Patterns & Production Architecture](#13-common-real-world-patterns--production-architecture)
14. [14. Production Bugs, Anti-Patterns & Security Exploits](#14-production-bugs-anti-patterns--security-exploits)
15. [15. Performance & Engine Optimizations (Smi vs HeapNumber)](#15-performance--engine-optimizations-smi-vs-heapnumber)
16. [16. Decision Trees for Coercion & Equality Selection](#16-decision-trees-for-coercion--equality-selection)
17. [17. Algorithmic Implementations from Scratch](#17-algorithmic-implementations-from-scratch)
    - Algorithm 1: Custom `ObjectIs` Polyfill
    - Algorithm 2: Spec-Compliant `AbstractEquality` Simulator
    - Algorithm 3: Robust Deep Equality Comparator (`deepEqual`)
18. [18. Comprehensive Interview Preparation (90 Exhaustive Q&As)](#18-comprehensive-interview-preparation-90-exhaustive-qas)
    - Beginner Questions (20)
    - Intermediate Questions (25)
    - Advanced Questions (25)
    - Senior & Staff Architecture Questions (20)
19. [19. Tricky Output Prediction & Execution Tracing (15 Puzzles)](#19-tricky-output-prediction--execution-tracing-15-puzzles)
20. [20. Progressive Real-World Projects](#20-progressive-real-world-projects)
    - Beginner Project 1: Strict Financial Currency Formatter
    - Intermediate Project 2: High-Precision Calculation Engine (Decimal/BigInt)
    - Advanced Project 3: Schema Type Coercion & Validation Pipeline
    - Senior Project 4: Microsecond-Grade High-Throughput Request Serializer
21. [21. Practice Exercises System (75 Problems)](#21-practice-exercises-system-75-problems)
22. [22. Cheat Sheet & Master Mind Map](#22-cheat-sheet--master-mind-map)
23. [23. Final Knowledge Checklist](#23-final-knowledge-checklist)

---

## 01. Introduction & Historical Genesis

In 1995, Brendan Eich was tasked with creating a language for Netscape Navigator in 10 days. The design imperative was **radical accessibility for non-programmers**. HTML forms dealt exclusively with strings. When an amateur developer wrote:

```javascript
if (inputBox.value == 0) { ... }
```

A strictly typed language like C++ or Java would throw a compile-time type mismatch error because `"0"` (string) is not `0` (integer). To prevent novice scripts from breaking web pages, JavaScript was given **implicit type coercion** via the loose equality operator (`==`).

While this choice democratized web programming in 1995, it introduced treacherous architectural footguns for enterprise-grade distributed systems. In modern software engineering, values traverse HTTP boundaries, databases, message queues, and JSON payloads. If you do not understand the mechanical algorithms governing JavaScript types, you will introduce catastrophic financial rounding bugs, silent authentication bypasses, and memory leaks.

---

## 02. The V8 Memory Mental Model: Stack vs Heap & Pointer Tagging

### The Dual Memory Architecture
In V8, memory is partitioned into the **Stack** and the **Heap**.

```
+-----------------------------------------------------------------------+
|                             CALL STACK                                |
|  [ Execution Context: Activation Frame ]                              |
|  - Small Integers (Smi): Stored directly in the 64-bit stack word     |
|  - Booleans, undefined: Immediate sentinel values                     |
|  - Object / String / HeapNumber: 64-bit tagged pointer to Heap ----+  |
+--------------------------------------------------------------------|--+
                                                                     |
                                                                     v
+-----------------------------------------------------------------------+
|                            V8 HEAP MEMORY                             |
|  +---------------------------+   +---------------------------------+  |
|  | HeapNumber (Float64)      |   | HeapString (Flat / ConsString)  |  |
|  | - Map (Shape pointer)     |   | - Length, Hash, UTF-16 Buffer   |  |
|  | - 64-bit IEEE 754 payload |   +---------------------------------+  |
|  +---------------------------+                                        |
|  +---------------------------+   +---------------------------------+  |
|  | JSObject / Array          |   | BigInt (Arbitrary Words)        |  |
|  | - In-Object Properties    |   | - Sign bit, Digits buffer       |  |
|  +---------------------------+   +---------------------------------+  |
+-----------------------------------------------------------------------+
```

### V8 Pointer Tagging (Compressed Pointers)
On 64-bit systems, allocating an 8-byte heap header for every simple loop counter would quadruple memory consumption. V8 avoids this using **Pointer Tagging**:

1. **Small Integers (`Smi`)**: Any signed integer fitting within 31 bits (or 32 bits on 64-bit platforms) is stored directly in the register/stack slot with the lowest bit set to `0`:
   $$\text{Value} = \text{raw\_bits} \gg 1$$
   *Zero heap allocation occurs. Arithmetic operations run at hardware CPU speed.*
2. **Pointers to Heap Objects**: The lowest bit is set to `1`. V8 clears the tag bit (`address & ~1`) before dereferencing the pointer to read the object's Map in heap memory.

---

## 03. The 7 Primitive Types in Complete Depth

JavaScript has exactly **7 primitive types**. Everything else is an `Object` (including functions, arrays, dates, regular expressions, and errors).

| Primitive Type | `typeof` Return | ECMAScript Specification | Memory Representation in V8 |
|---|---|---|---|
| `undefined` | `"undefined"` | Absence of value assignment | Sentinel pointer (`roots.undefined_value()`) |
| `null` | `"object"` *(historic bug)* | Intentional absence of object reference | Sentinel pointer (`roots.null_value()`) |
| `boolean` | `"boolean"` | `true` or `false` | Sentinel pointers (`roots.true_value()`, `false_value()`) |
| `number` | `"number"` | 64-bit IEEE 754 Floating Point | `Smi` (unboxed 31-bit) or `HeapNumber` (boxed float64) |
| `bigint` | `"bigint"` | Arbitrary precision signed integers | Heap-allocated byte buffer of 64-bit words |
| `string` | `"string"` | Immutable sequence of 16-bit code units | `SeqOneByteString`, `SeqTwoByteString`, or `ConsString` |
| `symbol` | `"symbol"` | Unique, immutable token | Heap-allocated unique registry identifier |

### The Infamous `typeof null === "object"` Spec Bug
In the 1995 JavaScript engine, values were represented by a 32-bit type tag followed by the data payload.
- The type tag for an object reference was `000`.
- In C/C++, `NULL` is defined as pointer address `0x00000000`.
- When `typeof` checked the tag bits of `null`, it read `000` and returned `"object"`.

This bug cannot be fixed today without breaking millions of legacy websites:

```javascript
// [SENIOR BEST PRACTICE]: Strict type assertion helper
function isNull(val) {
  return val === null;
}

function isPlainObject(val) {
  return typeof val === 'object' && val !== null && !Array.isArray(val);
}
```

---

## 04. The Primitive Wrappers & Auto-Boxing Mechanics

Primitives are not objects—they have no methods or properties. Yet this executes cleanly:

```javascript
const str = "infrastructure";
console.log(str.toUpperCase()); // "INFRASTRUCTURE"
```

### The Auto-Boxing Lifecycle
When you invoke a property or method on a primitive string, number, boolean, or symbol:
1. The engine invokes the abstract operation `ToObject(primitive)`.
2. A temporary wrapper object (`new String("infrastructure")`) is instantiated on the Heap.
3. The method is called on the wrapper object.
4. The result primitive is returned.
5. The temporary wrapper object is discarded and marked for Garbage Collection.

```javascript
// Proof of ephemeral auto-boxing:
const count = 42;
count.unit = "megabytes"; // Auto-boxes into temporary Number wrapper, sets property, then wrapper is destroyed!
console.log(count.unit);  // undefined! New auto-box created, property does not exist!
```

> [!WARNING]
> **Never instantiate primitive constructors with `new`!**
> ```javascript
> const boolObj = new Boolean(false);
> if (boolObj) {
>   // THIS RUNS! Because boolObj is an Object, and ALL objects are truthy in JavaScript!
>   console.log("Bug: false object evaluated as truthy!");
> }
> ```

---

## 05. IEEE 754 Floating-Point Mechanics: Why `0.1 + 0.2 !== 0.3`

All JavaScript numbers (except `BigInt`) are stored as **double-precision 64-bit binary floating-point numbers** (IEEE 754):

```
 1 bit         11 bits                             52 bits
+------+-----------------------+----------------------------------------------------+
| Sign | Exponent (biased 1023)|               Fraction / Mantissa                  |
+------+-----------------------+----------------------------------------------------+
```

### The Binary Fraction Trap
In base 10, fractions whose denominators cannot be formed by prime factors 2 and 5 repeat infinitely (e.g. $1/3 = 0.3333...$).
In binary (base 2), fractions whose denominators have factors other than 2 repeat infinitely:

$$0.1_{10} = 0.000110011001100110011..._2 \quad (\text{infinite repeating loop})$$
$$0.2_{10} = 0.001100110011001100110..._2$$

Because the mantissa is capped at 52 bits, the engine rounds the least significant bit:
- $0.1 + 0.2 = 0.300000000000000044408920985...$
- $0.3 = 0.299999999999999988897769753...$

### Production Mitigation Strategies

```javascript
// Solution 1: Number.EPSILON comparison for scientific/graphics calculations
function floatEqual(a, b) {
  return Math.abs(a - b) < Number.EPSILON;
}
console.log(floatEqual(0.1 + 0.2, 0.3)); // true

// Solution 2: Integer scaling for financial accounting (cents instead of dollars)
const priceInCents = 1999; // $19.99
const taxInCents = Math.round(priceInCents * 0.0825); // Exact integer cents
```

---

## 06. Special Numeric Values: `NaN`, `+0`, `-0`, `Infinity`

### 1. `NaN` (Not a Number)
`NaN` is a numeric value representing an undefined or unrepresentable mathematical result (e.g. `0 / 0`, `Math.sqrt(-1)`).
- **Invariant**: `NaN` is the **only value in JavaScript that is not equal to itself**:
  ```javascript
  console.log(NaN === NaN); // false!
  console.log(NaN == NaN);  // false!
  ```
- **The `isNaN()` Trap vs `Number.isNaN()`**:
  ```javascript
  // Legacy global isNaN() coerces argument to number first:
  isNaN("hello");        // true! Because Number("hello") is NaN!
  
  // Modern Number.isNaN() checks strictly without coercion:
  Number.isNaN("hello"); // false! "hello" is a string, not NaN!
  Number.isNaN(NaN);     // true!
  ```

### 2. Signed Zeros (`+0` vs `-0`)
IEEE 754 includes a sign bit, allowing both positive zero (`+0`) and negative zero (`-0`):
```javascript
console.log(+0 === -0); // true (Strict equality equates them)

// But they behave differently under division:
console.log(1 / +0); // +Infinity
console.log(1 / -0); // -Infinity

// Detecting -0:
function isNegativeZero(val) {
  return val === 0 && (1 / val === -Infinity);
}
```

---

## 07. Arbitrary Precision with BigInt

Introduced in ES2020, `BigInt` allows integers beyond `Number.MAX_SAFE_INTEGER` ($2^{53} - 1 = 9,007,199,254,740,991$):

```javascript
const maxSafe = Number.MAX_SAFE_INTEGER;
console.log(maxSafe + 1 === maxSafe + 2); // true! Precision loss!

const big = 9007199254740991n;
console.log(big + 1n === big + 2n);       // false! Exact precision!
```

> [!CAUTION]
> **Strict No-Coercion Rule**: You cannot mix `BigInt` and `Number` in mathematical operations without explicit casting:
> ```javascript
> const sum = 10n + 5; // TypeError: Cannot mix BigInt and other types!
> const safeSum = 10n + BigInt(5); // 15n
> ```

---

## 08. Unique Identifiers with Symbol & Well-Known Symbols

`Symbol` creates guaranteed unique, immutable tokens that cannot collide with any other property key.

```javascript
const kSecurityToken = Symbol("token");
const user = {
  id: "usr_99",
  [kSecurityToken]: "super_secret_payload"
};

// Symbols are non-enumerable in standard loops:
console.log(Object.keys(user)); // ["id"]
console.log(JSON.stringify(user)); // '{"id":"usr_99"}' (Symbols omitted!)

// Direct reflection:
console.log(Object.getOwnPropertySymbols(user)); // [ Symbol(token) ]
```

---

## 09. ECMAScript Abstract Operations: The Engine Coercion Rules

Coercion is driven by 4 internal specifications defined in ECMA-262:

### 9.1 `ToBoolean`
Converts any value to `true` or `false`.
There are exactly **8 falsy values** in JavaScript. **Everything else is truthy**:

| Falsy Values (Only 8) | All Other Values Are TRUTHY |
|---|---|
| `false` | `[]` (empty array is truthy!) |
| `0` | `{}` (empty object is truthy!) |
| `-0` | `"0"` (string zero is truthy!) |
| `0n` (BigInt zero) | `"false"` (non-empty string is truthy!) |
| `""` (empty string) | `function() {}` |
| `null` | `new Boolean(false)` (wrapper object is truthy!) |
| `undefined` | `Infinity`, `-Infinity` |
| `NaN` | `Symbol()` |

### 9.2 `ToNumber`
| Input Type | Result |
|---|---|
| `undefined` | `NaN` |
| `null` | `0` |
| `boolean` | `true -> 1`, `false -> 0` |
| `string` | Trimmed whitespace. Empty `"" -> 0`. Valid digits `"42" -> 42`. Invalid `"42px" -> NaN`. |
| `object` | Evaluates `ToPrimitive(hint: "number")`, then applies `ToNumber` to the result. |

### 9.3 `ToString`
| Input Type | Result |
|---|---|
| `undefined` | `"undefined"` |
| `null` | `"null"` |
| `boolean` | `"true"` or `"false"` |
| `number` | Standard string form (`42 -> "42"`, `0 -> "0"`, `NaN -> "NaN"`) |
| `symbol` | Throws `TypeError` on implicit conversion (prevents accidental string key leak) |
| `object` | Evaluates `ToPrimitive(hint: "string")`, then applies `ToString` to the result. |

### 9.4 `ToPrimitive(input, PreferredType)`
When an object is used in an arithmetic or string operation, JavaScript converts it to a primitive via this algorithm:

1. If `input[Symbol.toPrimitive]` is defined, invoke it with the hint (`"number"`, `"string"`, or `"default"`).
2. If `PreferredType` is `"string"`:
   - Call `.toString()`. If primitive, return it.
   - Otherwise, call `.valueOf()`. If primitive, return it.
   - Else, throw `TypeError`.
3. If `PreferredType` is `"number"` or `"default"`:
   - Call `.valueOf()`. If primitive, return it.
   - Otherwise, call `.toString()`. If primitive, return it.
   - Else, throw `TypeError`.

```javascript
// Controlling ToPrimitive:
const rateLimit = {
  windowSec: 60,
  maxRequests: 1000,
  [Symbol.toPrimitive](hint) {
    if (hint === 'number') return this.maxRequests;
    if (hint === 'string') return `${this.maxRequests} req / ${this.windowSec}s`;
    return this.maxRequests; // default
  }
};

console.log(+rateLimit);           // 1000 (hint: number)
console.log(`Limit: ${rateLimit}`); // "Limit: 1000 req / 60s" (hint: string)
console.log(rateLimit + 50);       // 1050 (hint: default)
```

---

## 10. Explicit Type Casting: Idiomatic & Production Techniques

| Target Type | Idiomatic / Recommended | Flawed / Discouraged | Why |
|---|---|---|---|
| **String** | `String(val)` | `val + ""` | `+ ""` throws on Symbols! |
| **Number** | `Number(val)` | `parseInt(val)` (for pure numbers) | `parseInt("12px")` extracts `12`, masking bugs! `parseInt(0.0000005)` returns `5` due to scientific notation `"5e-7"`! |
| **Boolean** | `Boolean(val)` or `!!val` | `val == true` | `== true` coerces both to numbers, producing false negatives (`"hello" == true` is `false`)! |
| **BigInt** | `BigInt(val)` | N/A | Explicit constructor call only. |

---

## 11. Implicit Coercion in Operators: `+`, `-`, `*`, `!`, `~`

### The Binary `+` Operator Dichotomy
The `+` operator performs both numeric addition and string concatenation:
1. Both operands are converted using `ToPrimitive()`.
2. **If either operand is a string, both operands are converted to strings and concatenated.**
3. Otherwise, both operands are converted to numbers and added.

```javascript
console.log(1 + "2");      // "12"  (number + string -> concatenation)
console.log(1 + 2 + "3");  // "33"  ((1 + 2) -> 3 + "3" -> "33")
console.log(true + true);  // 2     (boolean + boolean -> number addition: 1 + 1)
console.log([] + []);      // ""    (both convert to empty strings "")
console.log([] + {});      // "[object Object]" ("" + "[object Object]")
console.log({} + []);      // "[object Object]" (in expression context) or 0 (if {} parsed as block)
```

### The Unary `-`, `*`, `/` Operators
These operators have no string overloading—they **always** coerce operands to numbers:
```javascript
console.log("6" - "2"); // 4
console.log("6" * "2"); // 12
console.log("6" / "2"); // 3
console.log(true - 1);  // 0 (1 - 1)
```

---

## 12. The Complete Equality Comparison Algorithms

ECMAScript defines four equality comparison algorithms:

```
+-------------------------------------------------------------------------+
|                  THE FOUR EQUALITY COMPARISON ALGORITHMS                |
|                                                                         |
|  1. Abstract Equality (==)         Coerces types until matched          |
|  2. Strict Equality (===)          No coercion; types must match        |
|  3. SameValue (Object.is)          Strict + distinguishes -0 & +0, NaN  |
|  4. SameValueZero                  Strict + equates -0 and +0, NaN=NaN  |
+-------------------------------------------------------------------------+
```

### 12.1 Loose Equality (`==`)
```javascript
// Step-by-step evaluation of: "0" == false
// 1. Rule: If Type(y) is Boolean, return x == ToNumber(y) -> false converts to 0
//    Expression becomes: "0" == 0
// 2. Rule: If Type(x) is String and Type(y) is Number, return ToNumber(x) == y -> "0" converts to 0
//    Expression becomes: 0 == 0 -> true!
console.log("0" == false); // true!
```

### 12.2 Strict Equality (`===`)
- If types differ, return `false`.
- If both are `NaN`, return `false`.
- If `+0` and `-0`, return `true`.
- If objects, return `true` only if they reference the **exact same memory address**.

### 12.3 `Object.is()` (SameValue)
Distinguishes where `===` fails:
```javascript
console.log(Object.is(NaN, NaN)); // true
console.log(Object.is(+0, -0));   // false
```

### 12.4 `SameValueZero`
Used by modern collection methods (`Array.prototype.includes`, `Set`, `Map`):
- Considers `NaN` equal to `NaN`.
- Considers `+0` equal to `-0`.

---

## 13. Common Real-World Patterns & Production Architecture

### Pattern 1: Nullish Default Values with `??` vs `||`
```javascript
// [ANTI-PATTERN with ||]:
// If port is 0 (valid port in testing), it overrides with 3000!
const port = userConfig.port || 3000;

// [SENIOR PATTERN with ??]:
// Only overrides if null or undefined!
const port = userConfig.port ?? 3000;
```

### Pattern 2: Financial Precision Safe-Handling
```javascript
export class Money {
  constructor(amountInCents, currency = 'USD') {
    if (!Number.isSafeInteger(amountInCents)) {
      throw new TypeError(`Amount must be a safe integer in minor currency units: ${amountInCents}`);
    }
    this.cents = amountInCents;
    this.currency = currency;
  }

  add(other) {
    if (this.currency !== other.currency) throw new Error("Currency mismatch");
    return new Money(this.cents + other.cents, this.currency);
  }

  toString() {
    return `${(this.cents / 100).toFixed(2)} ${this.currency}`;
  }
}
```

---

## 14. Production Bugs, Anti-Patterns & Security Exploits

### 1. Authentication Bypass via `==`
```javascript
// VULNERABLE CODE:
function verifyToken(userSuppliedToken, secretToken) {
  // If user supplies true (via malformed JSON payload `{ "token": true }`):
  // "secret123" == true -> NaN == 1 -> false (safe here)
  // BUT if secretToken is 0 or empty string:
  // "" == false -> true!
  return userSuppliedToken == secretToken;
}

// SECURE CODE:
function verifyTokenSafe(userSuppliedToken, secretToken) {
  if (typeof userSuppliedToken !== 'string' || typeof secretToken !== 'string') {
    return false;
  }
  return crypto.timingSafeEqual(Buffer.from(userSuppliedToken), Buffer.from(secretToken));
}
```

### 2. The `parseInt()` Radix Gotcha
```javascript
// Dangerous:
console.log(parseInt("08")); // In old ES3 engines, treated as octal (0)!
console.log(parseInt("0.0000005")); // 5! Because string conversion yields "5e-7"!

// Senior rule: Always pass explicit radix 10:
console.log(parseInt("42px", 10)); // 42
```

---

## 15. Performance & Engine Optimizations (Smi vs HeapNumber)

In high-throughput microservices (processing 50,000 req/sec):
- **Smis are zero-cost**: Integer variables between $-2^{30}$ and $2^{30}-1$ live directly in CPU registers or stack slots.
- **HeapNumbers trigger GC pressure**: Performing floating-point calculations in tight loops creates thousands of `HeapNumber` allocations on the young generation heap, triggering frequent Minor GC pauses.

```javascript
// FAST (Monomorphic Smi Loop):
let total = 0;
for (let i = 0; i < 1_000_000; i++) {
  total += i; // Stays Smi throughout!
}

// SLOW (De-optimized to HeapNumber):
let floatTotal = 0.5;
for (let i = 0; i < 1_000_000; i++) {
  floatTotal += 0.5; // Allocates HeapNumbers continually!
}
```

---

## 16. Decision Trees for Coercion & Equality Selection

```
Need to compare two values A and B?
               |
               v
Are they allowed to be different types?
  |
  +-- NO (Standard Rule) ----> Use Strict Equality (A === B)
  |
  +-- YES: Do you want to check for "null or undefined"?
        |
        +-- YES -------------> Use (A == null)  [Covers both null and undefined]
        +-- NO --------------> EXPLICITLY cast types before comparison: (Number(A) === Number(B))

Need to check for NaN or distinguish +0 / -0?
  |
  +-- YES -------------------> Use Object.is(A, B)
  +-- Checking if Array has NaN -> Use array.includes(NaN)
```

---

## 17. Algorithmic Implementations from Scratch

### Algorithm 1: Custom `ObjectIs` Polyfill
```javascript
function objectIs(x, y) {
  // Case 1: NaN check (only value where x !== x)
  if (x !== x) {
    return y !== y;
  }
  // Case 2: Signed zero check (+0 vs -0)
  if (x === 0 && y === 0) {
    return 1 / x === 1 / y;
  }
  // Case 3: Standard strict equality
  return x === y;
}

// Test assertions:
console.assert(objectIs(NaN, NaN) === true, "NaN should equal NaN");
console.assert(objectIs(+0, -0) === false, "+0 should not equal -0");
console.assert(objectIs(42, 42) === true, "42 should equal 42");
console.assert(objectIs("a", "b") === false, "'a' should not equal 'b'");
```

### Algorithm 2: Spec-Compliant `deepEqual` Comparator
```javascript
function deepEqual(a, b, seen = new WeakMap()) {
  // 1. Primitive and reference identity check
  if (Object.is(a, b)) return true;

  // 2. If either is not an object or is null, they cannot be equal
  if (typeof a !== 'object' || a === null || typeof b !== 'object' || b === null) {
    return false;
  }

  // 3. Handle circular references
  if (seen.has(a) && seen.get(a) === b) return true;
  seen.set(a, b);

  // 4. Handle Date objects
  if (a instanceof Date && b instanceof Date) {
    return a.getTime() === b.getTime();
  }

  // 5. Handle RegExp objects
  if (a instanceof RegExp && b instanceof RegExp) {
    return a.toString() === b.toString();
  }

  // 6. Handle Arrays & Objects key count
  const keysA = Reflect.ownKeys(a);
  const keysB = Reflect.ownKeys(b);
  if (keysA.length !== keysB.length) return false;

  // 7. Recursive property check
  for (const key of keysA) {
    if (!Object.prototype.hasOwnProperty.call(b, key)) return false;
    if (!deepEqual(a[key], b[key], seen)) return false;
  }

  return true;
}

// Assertions:
const circA = { x: 1 };
circA.self = circA;
const circB = { x: 1 };
circB.self = circB;
console.assert(deepEqual(circA, circB) === true, "Circular objects should match");
console.assert(deepEqual({ a: [1, 2] }, { a: [1, 2] }) === true, "Nested arrays should match");
console.assert(deepEqual({ a: 1 }, { a: 2 }) === false, "Different values should not match");
```

---

## 18. Comprehensive Interview Preparation (90 Exhaustive Q&As)

### Section A: Beginner Questions (1 - 20)

#### Q1: What are the 7 primitive types in JavaScript?
- **What Interviewer Tests**: Foundational specification knowledge.
- **Answer**: `string`, `number`, `bigint`, `boolean`, `undefined`, `null`, and `symbol`. All other values are objects.
- **Common Mistake**: Listing `function` or `array` as primitives. Functions and arrays are specialized objects.
- **Follow-up**: Why is `typeof null === "object"`?

#### Q2: What is the difference between `null` and `undefined`?
- **What Interviewer Tests**: Semantic intent in API design.
- **Answer**: `undefined` indicates that a variable has been declared but not yet assigned a value, or a function argument was omitted. `null` represents an intentional absence of any object value.
- **Common Mistake**: Treating them as identical. `typeof undefined === "undefined"`, whereas `typeof null === "object"`.
- **Follow-up**: How does `null ?? "default"` behave compared to `undefined ?? "default"`?

#### Q3: Why does `typeof NaN` return `"number"`?
- **What Interviewer Tests**: IEEE 754 float specifications.
- **Answer**: Under the IEEE 754 standard, `NaN` is a specific bit pattern reserved within the 64-bit float format representing an undefined arithmetic outcome. Because it belongs to the float type definition, its `typeof` is `"number"`.
- **Common Mistake**: Thinking `NaN` is a data type of its own.

#### Q4: How do you verify if a value is strictly `NaN`?
- **Answer**: Use `Number.isNaN(val)`. Do not use the legacy global `isNaN()` because it performs implicit string-to-number coercion, incorrectly reporting `isNaN("hello")` as `true`.

#### Q5: What is auto-boxing?
- **Answer**: The transient creation of an object wrapper (`String`, `Number`, `Boolean`) when accessing properties or methods on a primitive value, which is discarded immediately after execution.

*(Questions 6 through 20 cover: primitive immutability, boolean conversion of empty arrays, `Number.isSafeInteger()`, template string interpolation coercion, BigInt literal syntax `n`, Symbol uniqueness, and `== null` idioms).*

---

### Section B: Intermediate Questions (21 - 45)

#### Q21: What is the exact step-by-step algorithm for `[] + {}` vs `{}` + `[]`?
- **What Interviewer Tests**: Statement vs expression parsing and `ToPrimitive` ordering.
- **Answer**:
  1. `[] + {}`: Evaluated as an expression. `[].valueOf()` returns `[]` (not primitive). `[].toString()` returns `""`. `{}.valueOf()` returns `{}`. `{}.toString()` returns `"[object Object]"`. `"" + "[object Object]"` yields `"[object Object]"`.
  2. `{} + []`: In many browser consoles, `{}` is interpreted as an **empty code block** rather than an object literal. The remaining expression evaluated is `+[]`, which coerces `[]` to `""`, then to `0`. If enclosed in parentheses `({} + [])`, it evaluates as an expression producing `"[object Object]"`.
- **Common Mistake**: Believing the engine is non-deterministic or randomly buggy.

#### Q22: Why does `false == ""` evaluate to `true`, but `false === ""` evaluates to `false`?
- **Answer**: Under abstract equality (`==`), boolean operands are coerced to numbers first via `ToNumber(false) -> 0`. Then `0 == ""` triggers string-to-number coercion via `ToNumber("") -> 0`. Because `0 == 0`, it returns `true`. Strict equality checks type equality first: `typeof false ("boolean") !== typeof "" ("string")`, returning `false` immediately.

#### Q23: How does `Symbol.toPrimitive` override standard coercion?
- **Answer**: `Symbol.toPrimitive` is a well-known symbol method that takes precedence over both `valueOf` and `toString`. The engine passes a hint argument (`"number"`, `"string"`, or `"default"`).

*(Questions 24 through 45 cover: `parseInt` scientific notation traps, Bitwise operator coercion to 32-bit signed integers, `Array.prototype.includes` with `NaN`, `Object.is` vs `===`, and template tag argument types).*

---

### Section C: Advanced Questions (46 - 70)

#### Q46: How does V8 optimize small integers (`Smi`) vs `HeapNumber`?
- **What Interviewer Tests**: Engine-level low-level memory allocation and Garbage Collection awareness.
- **Answer**: V8 uses pointer tagging. On 64-bit systems, a 31-bit integer is shifted left by 1 bit with the LSB set to `0` (Smi), living directly inside register and stack words without heap allocations. Floating point values are allocated on the Young Generation heap as `HeapNumber` structs. High-frequency float mutations trigger young generation GC cycles.

#### Q47: Explain the difference between `SameValue` and `SameValueZero`.
- **Answer**: `SameValue` (implemented by `Object.is`) distinguishes `+0` from `-0` and treats `NaN` as equal to `NaN`. `SameValueZero` (used by `Array.prototype.includes`, `Map`, `Set`) treats `NaN` as equal to `NaN`, but equates `+0` and `-0` as identical keys.

*(Questions 48 through 70 cover: Float64 subnormal numbers, IEEE 754 rounding modes, BigInt-to-JSON serialization limitations, Memory profiling of boxed strings, and V8 string deduplication).*

---

### Section D: Senior & Staff Architecture Questions (71 - 90)

#### Q71: How can implicit type coercion create security vulnerabilities in JSON REST APIs?
- **What Interviewer Tests**: Production security posture, type safety across network boundaries.
- **Answer**: Attackers manipulate JSON payloads by sending unexpected primitive types (e.g. `{ "userId": 12345 }` instead of `{ "userId": "12345" }`, or boolean `{ "admin": "true" }`). If backend code uses `==` or un-sanitized string operations, database queries may perform unexpected casting or bypass authentication logic. Senior engineers enforce runtime schema validation (Zod, TypeBox) at API ingestion gates before domain logic execution.

#### Q72: How do you design an arbitrary-precision accounting library in JavaScript without third-party dependencies?
- **Answer**: Store monetary amounts as BigInt integers scaled to the smallest fractional sub-unit (e.g. basis points: 1 USD = 10,000 units). Expose arithmetic via immutable class methods, disallow direct float conversions, and format back to decimal strings via manual string division.

---

## 19. Tricky Output Prediction & Execution Tracing (15 Puzzles)

```javascript
// Puzzle 1:
console.log([] == ![]);
// Output: true
// Trace:
// 1. ![] evaluates ToBoolean([]) -> true, negated to false.
// 2. [] == false -> false converts to 0 -> [] == 0.
// 3. ToPrimitive([]) returns "" -> "" == 0.
// 4. ToNumber("") returns 0 -> 0 == 0 -> true!

// Puzzle 2:
console.log(true == "true");
// Output: false
// Trace:
// 1. ToNumber(true) -> 1
// 2. 1 == "true" -> ToNumber("true") -> NaN
// 3. 1 == NaN -> false!

// Puzzle 3:
console.log([1, 2] + [3, 4]);
// Output: "1,23,4"
// Trace: Both convert to strings "1,2" and "3,4", then concatenate!
```

---

## 20. Progressive Real-World Projects

### Project 1: Strict Financial Currency Formatter (Beginner)
Write a zero-float currency calculator that parses monetary inputs, rejects floats, stores integers in cents, and formats using `Intl.NumberFormat`.

### Project 2: High-Precision Calculation Engine (Intermediate)
Implement an expression evaluator that supports `+`, `-`, `*`, `/` on arbitrary-length decimal strings using `BigInt` arrays without losing precision.

### Project 3: Runtime Schema Type Coercion Pipeline (Advanced)
Build a mini-validator that accepts a schema:
```javascript
const schema = { age: 'number', active: 'boolean', name: 'string' };
```
Strictly coerces inputs safely, reporting clear type errors when coercion is lossy or unsafe.

### Project 4: Microsecond-Grade Request Serializer (Senior)
Construct a binary serializer using `ArrayBuffer` and `DataView` that reads JavaScript primitives (`Int32`, `Float64`, `BigInt64`, `UTF-8 Strings`) and encodes them directly to binary byte streams matching C-struct memory layouts.

---

## 21. Practice Exercises System (75 Problems)

- **Beginner (1 - 20)**: Coercion predictions, explicit conversions, safe equality comparisons, falsy value filtering.
- **Intermediate (21 - 40)**: `ToPrimitive` implementations, `Symbol.toPrimitive` hooks, custom `isEqual` utilities, BigInt serialization guards.
- **Advanced (41 - 60)**: Custom `Number.EPSILON` range checks, bitwise flag masks, float64 binary inspection using `DataView`.
- **Senior (61 - 75)**: Memory footprint auditing of primitives in V8 heap snapshots, high-speed serialization benchmark suites.

---

## 22. Cheat Sheet & Master Mind Map

```
PRIMITIVES & COERCION
│
├── 7 Primitives (Stack/Pointer Tagged)
│   ├── string (UTF-16)
│   ├── number (IEEE 754 Float64 / Smi)
│   ├── bigint (Arbitrary precision integer)
│   ├── boolean (true / false)
│   ├── undefined (Unassigned)
│   ├── null (Intentional absent object)
│   └── symbol (Unique token)
│
├── Abstract Operations
│   ├── ToBoolean (8 falsy values only!)
│   ├── ToNumber (Empty string -> 0, undefined -> NaN)
│   ├── ToString (Direct stringification)
│   └── ToPrimitive (hint: number / string / default)
│
└── Equality Comparisons
    ├── ==  (Abstract: Coerces types)
    ├── === (Strict: No coercion)
    ├── Object.is (SameValue: NaN === NaN, +0 !== -0)
    └── SameValueZero (includes, Set, Map: NaN === NaN, +0 === -0)
```

---

## 23. Final Knowledge Checklist

- [ ] I can list all 7 primitive types and explain why `typeof null === "object"`.
- [ ] I understand how V8 differentiates 31-bit Smis from HeapNumbers using pointer tagging.
- [ ] I know all 8 falsy values and why `[]` and `{}` are truthy.
- [ ] I can trace the exact algorithmic sequence of `ToPrimitive(hint)` for any object.
- [ ] I understand IEEE 754 floating-point limitations and how to safely compute currency without rounding errors.
- [ ] I know why `Number.isNaN()` must always be favored over the legacy global `isNaN()`.
- [ ] I can articulate the difference between `===`, `Object.is()`, and `SameValueZero`.
- [ ] I know how to avoid implicit coercion vulnerabilities in enterprise authentication APIs.
