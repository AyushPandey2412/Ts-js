# Module 02: Primitives, Type Coercion & Equality Mechanics

> **Learning Invariant**: In JavaScript, values are dynamically typed, while variables are simply untyped bindings. Coercion is not magic or "random"; it is governed by deterministic ECMAScript abstract operations (`ToPrimitive`, `ToBoolean`, `ToNumber`, `ToString`). Understand these rules, and you will never fall into the `==` trap or suffer parsing security vulnerabilities.

---

## 1. The Genesis: Why Does JavaScript Have Implicit Coercion?

In 1995, JavaScript was designed for non-programmers writing small snippets inside HTML (such as validating a form or reading a text field value). In HTML forms, **every user input is a string**.
If a developer checked:
```javascript
if (inputBox.value == 0) { ... }
```
A strictly typed language would immediately crash or reject the comparison because `"0"` (string) is not `0` (number).
To prevent scripts from crashing on early websites, Brendan Eich designed JavaScript with **lenient automatic type conversion (coercion)**.

While this made simple scripts work without type-casting, it created deep footguns for enterprise backend systems. In modern software engineering, we must understand the exact underlying conversion algorithms to prevent subtle bugs, authentication bypasses, and data corruption.

---

## 2. The 7 Primitive Types in Memory

JavaScript has **7 primitive types**. Everything else is an **Object** (including Arrays, Functions, Dates, and Buffers).

| Primitive Type | Description | Stack Storage | Example |
|---|---|---|---|
| `string` | UTF-16 code units (immutable sequence of characters) | Direct / Pointer to string pool | `"file.pdf"` |
| `number` | Double-precision 64-bit IEEE 754 floating point | 8 bytes directly on stack | `42`, `3.1415`, `NaN`, `Infinity` |
| `bigint` | Arbitrary precision integers (prevents integer overflow) | Heap-allocated reference | `9007199254740995n` |
| `boolean` | Logical truth value | 1 byte on stack | `true`, `false` |
| `undefined` | Variable declared but never assigned a value | Sentinel value on stack | `undefined` |
| `null` | Intentional absence of any object value | Sentinel value on stack | `null` |
| `symbol` | Unique and immutable token used as object keys | Unique registry reference | `Symbol("fileId")` |

### The Historical Bug: `typeof null === "object"`
In the original 1995 V8 predecessor, values were stored with a **type tag** in the bottom 1–3 bits of their memory word. 
* The type tag for an object was `000`.
* `null` was represented as the null pointer (`0x00` in C), meaning all its bits were zeroes.
* When `typeof` inspected `null`, it read the `000` tag and returned `"object"`.

This bug cannot be fixed in JavaScript today because doing so would break millions of existing websites that rely on this legacy behavior.
```javascript
// The correct way to check strictly for null:
function isStrictNull(val) {
  return val === null;
}
```

### Auto-Boxing (Primitive Wrappers)
Primitives are not objects—they have no methods. Yet this works:
```javascript
const name = "report.pdf";
console.log(name.toUpperCase()); // "REPORT.PDF"
```
**How it works under the hood**:
When you invoke a method on a primitive string, number, or boolean, the JavaScript engine temporarily **auto-boxes** it into an ephemeral wrapper object:
1. `new String("report.pdf")` is created in memory.
2. The `.toUpperCase()` method is called on that wrapper object.
3. The result is returned, and the temporary wrapper object is immediately discarded for garbage collection.

---

## 3. ECMAScript Abstract Operations (How Coercion Actually Works)

Coercion is driven by internal engine specifications known as **Abstract Operations**. You cannot call these directly, but the engine runs them whenever types collide.

### 3.1 `ToBoolean`
Converts any value to `true` or `false`.
There are only **8 falsy values** in JavaScript. Memorize them:

```text
1. false
2. 0
3. -0
4. 0n (BigInt zero)
5. "" (empty string)
6. null
7. undefined
8. NaN
```

**Everything else is truthy!** This includes:
* `[]` (empty array is truthy!)
* `{}` (empty object is truthy!)
* `"0"` (string with zero is truthy!)
* `"false"` (string with false is truthy!)

### 3.2 `ToNumber`
Converts a value to a numeric representation:
* `undefined` → `NaN`
* `null` → `0` *(A major source of bugs!)*
* `true` → `1`, `false` → `0`
* `""` (empty string) → `0` *(Another major source of bugs!)*
* `"  123  "` → `123`
* `"abc"` → `NaN`

### 3.3 `ToPrimitive(input, [PreferredType])`
When an Object or Array needs to be coerced into a primitive (e.g. `[1, 2] + 3`), the engine invokes `ToPrimitive`:
1. If `PreferredType` is `string`:
   * Calls `.toString()`. If that returns a primitive, use it.
   * Otherwise, calls `.valueOf()`. If that returns a primitive, use it.
   * If neither returns a primitive, throws `TypeError`.
2. If `PreferredType` is `number`:
   * Calls `.valueOf()`. If that returns a primitive, use it.
   * Otherwise, calls `.toString()`. If that returns a primitive, use it.
   * If neither returns a primitive, throws `TypeError`.

```javascript
const fileMetadata = {
  size: 2048,
  valueOf() { return this.size; },
  toString() { return "File (2048 bytes)"; }
};

console.log(fileMetadata + 100); // 2148 (Used valueOf because + prefers number)
console.log(`Uploaded: ${fileMetadata}`); // "Uploaded: File (2048 bytes)" (Template literal prefers string)
```

---

## 4. Equality Comparison Algorithms: `==` vs `===` vs `Object.is`

JavaScript has three distinct equality comparison tiers.

```text
┌───────────────────────────┬───────────────────────────┬───────────────────────────┐
│ Abstract Equality (==)    │ Strict Equality (===)     │ SameValue (Object.is)     │
├───────────────────────────┼───────────────────────────┼───────────────────────────┤
│ Allows coercion           │ Disallows coercion        │ Exact bitwise equality    │
│ "42" == 42  --> true      │ "42" === 42 --> false     │ NaN is NaN  --> true      │
│ null == undefined -> true │ null === undefined-> false│ -0 is +0    --> false     │
│ 0 == ""     --> true      │ 0 === ""    --> false     │ 0 is ""     --> false     │
└───────────────────────────┴───────────────────────────┴───────────────────────────┘
```

### The Strict Equality Algorithm (`===`)
1. If `Type(x)` is different from `Type(y)`, return `false`.
2. If `Type(x)` is `Number`:
   * If `x` is `NaN`, return `false` (`NaN === NaN` is **always false**).
   * If `y` is `NaN`, return `false`.
   * If `x` is `+0` and `y` is `-0`, return `true`.
3. If `x` and `y` are Objects, return `true` **only if they reference the exact same address in memory**. Otherwise, return `false`.

### The `Object.is()` Method
Introduced in ES6 for exact bitwise equality:
```javascript
// Strict equality quirks:
console.log(NaN === NaN); // false
console.log(+0 === -0);   // true

// Object.is fixes both:
console.log(Object.is(NaN, NaN)); // true
console.log(Object.is(+0, -0));   // false
```
*Note: `Array.prototype.includes` and `Set` use **SameValueZero**, which treats `NaN === NaN` as `true`, but `+0 === -0` as `true`.*

---

## 5. Rich Code Anatomy: Tracing Coercion Line-by-Line

```javascript
// Function simulating parsing a pagination query string from Fastify HTTP request
function getPaginationLimit(rawLimit, defaultLimit = 20) {
  // Line 1: We receive rawLimit, which could be undefined, a number, or a string from URL
  
  // Line 2: The classic novice mistake
  // If rawLimit is 0 (valid limit meaning 0 files), 0 is falsy, so it incorrectly falls back to defaultLimit!
  const naiveLimit = rawLimit || defaultLimit; 

  // Line 3: Coercion check using unary plus
  // If rawLimit is "", +"" becomes 0!
  const coercedNumber = +rawLimit;

  // Line 4: The robust engineering approach
  // First check if rawLimit is explicitly provided (not null or undefined)
  if (rawLimit !== undefined && rawLimit !== null) {
    const parsed = Number(rawLimit);
    
    // Check if the parsed result is a valid non-negative integer
    if (!Number.isNaN(parsed) && Number.isInteger(parsed) && parsed >= 0) {
      return parsed;
    }
  }

  return defaultLimit;
}
```

### Detailed Trace:
* Call: `getPaginationLimit(0)`
  * `naiveLimit`: `0 || 20` → `0` is falsy → returns `20` **(BUG: User asked for 0, got 20)**.
  * Line 4 check: `0 !== undefined && 0 !== null` is `true`. `Number(0)` is `0`. Valid integer `>= 0` → returns `0` **(Correct)**.
* Call: `getPaginationLimit("")`
  * `coercedNumber`: `+""` evaluates to `0` **(Trap: empty string becomes zero!)**.
  * Line 4 check: `Number("")` is `0`, but in our schema we can check `String(rawLimit).trim() !== ""`.

---

## 6. Syntax Deconstruction

### 1. The Double Bang (`!!value`)
```javascript
const hasPermission = !!userRole;
```
#### 🔍 Syntax Deconstruction:
* **What it does**: Explicitly converts any value to its boolean primitive equivalent (`true` or `false`).
* *How it works*: 
  1. The first `!` converts `userRole` to a boolean according to `ToBoolean` rules and **inverts** it. (e.g. `"admin"` → `false`).
  2. The second `!` inverts it back (e.g. `false` → `true`).
* *Why use it*: Safer and cleaner than writing `Boolean(userRole)` or ternary `userRole ? true : false`.

### 2. BigInt Literals (`n` suffix)
```javascript
// 2GB file size in bytes is well within normal numbers:
const smallFile = 2 * 1024 * 1024 * 1024; // 2147483648

// But tracking multi-terabyte enterprise storage pools exceeds Number.MAX_SAFE_INTEGER (9,007,199,254,740,991)
const storagePoolBytes = 9007199254740995n; // Suffix 'n' declares a BigInt primitive
```
#### 🔍 Syntax Deconstruction:
* **What it means**: `n` tells V8 to allocate arbitrary-precision integer storage on the Heap instead of a 64-bit float.
* *The strict rule*: You **cannot mix** `BigInt` and `Number` without explicit conversion:
  ```javascript
  // THROWS TypeError: Cannot mix BigInt and other types, use explicit conversions
  const total = storagePoolBytes + 100; 

  // CORRECT:
  const total = storagePoolBytes + 100n;
  ```

---

## 7. Real-World Production Case Study: HTTP Query Security Hole

In Fastify, URL query parameters arrive as strings. Imagine an authorization check on a file-sharing route:

```javascript
// URL: /files/share?fileId=101&isPublic=false
const { fileId, isPublic } = request.query;

// BUG: In JavaScript, any non-empty string is TRUTHY!
if (isPublic) {
  // Even though the query string sent "false", Boolean("false") === TRUE!
  publishFileToPublicWorld(fileId); // CRITICAL SECURITY BREACH!
}
```

### The Root Cause:
`"false"` is a string of length 5. According to the `ToBoolean` specification, only `""` (empty string) is falsy. Every other string is `true`.

### The Fix:
```javascript
// Explicit string comparison or Zod schema validation
const isPublicBoolean = isPublic === "true";
```

---

## 8. Senior Traps & Footguns

### Trap 1: The Infamous `[] == ![]` is `true`
Why does this evaluate to `true`? Here is the exact engine step-by-step trace:
1. `![]` is evaluated first. `[]` is truthy, so `![]` becomes `false`. Expression is now: `[] == false`.
2. Rule: If comparing an Object to a Boolean, coerce the Boolean with `ToNumber(false)` → `0`. Expression is now: `[] == 0`.
3. Rule: If comparing an Object to a Number, coerce Object with `ToPrimitive([])`.
   * `[].valueOf()` returns `[]` (not primitive).
   * `[].toString()` returns `""` (empty string). Expression is now: `"" == 0`.
4. Rule: If comparing String to Number, coerce String with `ToNumber("")` → `0`. Expression is now: `0 == 0`.
5. `0 == 0` is `true`!

*Moral*: Never use `==`. Always use `===`.

### Trap 2: IEEE 754 Floating Point Math in File Sizing
```javascript
console.log(0.1 + 0.2 === 0.3); // false! (0.30000000000000004)
```
* **Why**: Numbers are stored in binary base-2. Decimal `0.1` and `0.2` cannot be represented cleanly in binary fractions (just like $1/3$ cannot be cleanly written in decimal $0.3333...$).
* **Fix**: In file systems and financial systems, **always store quantities as integers** (e.g., store file sizes in raw integer **bytes**, never fractional megabytes; store money in **cents**, never decimal dollars).
* If floating-point comparison is mandatory, use `Number.EPSILON`:
  ```javascript
  const areEqual = Math.abs((0.1 + 0.2) - 0.3) < Number.EPSILON; // true
  ```

---

## 9. Active Engineering Challenge (Write It Yourself)

Create a test file `test-module-02.js` and write the solution yourself.

### Challenge: Strict Storage Config Sanitizer
**Requirements**:
Write a function `sanitizeUploadOptions(rawOptions)` that takes an untrusted options object and sanitizes its properties into strictly typed values without relying on external libraries.

The raw options object can have:
```javascript
{
  maxRetries: unknown,   // Expect integer >= 0. If missing or invalid, default to 3.
  allowPublic: unknown,  // Can be boolean true/false, or strings "true"/"false". Default to false.
  chunkSizeBytes: unknown // Expect integer bytes >= 1024. If invalid, default to 5242880 (5MB).
}
```

### Strict Rules:
1. Strings like `"0"` for `maxRetries` must correctly parse to number `0`. (Do not let `0` fall back to `3`).
2. Strings like `"false"` or `"0"` for `allowPublic` must parse to boolean `false`.
3. `null`, `undefined`, empty string `""`, or arrays `[]` passed into `maxRetries` must **NOT** become `0`; they must be rejected and fall back to default `3`.
4. Must return a clean object with strictly validated types.

### Test Assertions to Verify:
```javascript
// Test 1: String booleans and zero retries
const r1 = sanitizeUploadOptions({ maxRetries: "0", allowPublic: "false", chunkSizeBytes: "1048576" });
console.log("Test 1 Max Retries (must be 0):", r1.maxRetries === 0);
console.log("Test 1 Allow Public (must be false):", r1.allowPublic === false);
console.log("Test 1 Chunk Size (must be 1048576):", r1.chunkSizeBytes === 1048576);

// Test 2: Invalid values falling back to defaults
const r2 = sanitizeUploadOptions({ maxRetries: "", allowPublic: "invalid", chunkSizeBytes: 500 });
console.log("Test 2 Max Retries default (must be 3):", r2.maxRetries === 3);
console.log("Test 2 Allow Public default (must be false):", r2.allowPublic === false);
console.log("Test 2 Chunk Size default (must be 5242880):", r2.chunkSizeBytes === 5242880);

// Test 3: Array coercion trap
const r3 = sanitizeUploadOptions({ maxRetries: [] });
console.log("Test 3 Trap (must be 3, not 0):", r3.maxRetries === 3);
```

When you finish writing your implementation, share it in chat for review!
