# JavaScript Complete Guide + DSA Mapping

> Covers everything: Core Language, ES6+, Advanced Concepts, and a full DSA mapping — with practical examples and interview-ready insights.

---

## Table of Contents

### Part 1 — Complete JavaScript Notes

1. [What is JavaScript?](#1-what-is-javascript)
2. [Variables — var, let, const](#2-variables--var-let-const)
3. [Data Types](#3-data-types)
4. [Type Coercion](#4-type-coercion)
5. [Operators](#5-operators)
6. [Control Flow](#6-control-flow)
7. [Loops](#7-loops)
8. [Functions](#8-functions)
9. [Arrays](#9-arrays)
10. [Strings](#10-strings)
11. [Objects](#11-objects)
12. [ES6+ Features](#12-es6-features)
13. [Map & Set](#13-map--set)
14. [Recursion](#14-recursion)
15. [Error Handling](#15-error-handling)
16. [Closures](#16-closures)
17. [Promises & Async/Await](#17-promises--asyncawait)
18. [Event Loop](#18-event-loop)
19. [Prototypes & Prototype Chain](#19-prototypes--prototype-chain)
20. [The `this` Keyword](#20-the-this-keyword)
21. [Destructuring](#21-destructuring)
22. [Spread & Rest](#22-spread--rest)
23. [Modules](#23-modules)

### Part 2 — JavaScript for DSA

24. [JavaScript Needed for DSA](#part-2--javascript-needed-for-dsa)

---

# Part 1 — Complete JavaScript Notes

---

## 1. What is JavaScript?

### Explanation

JavaScript is a **high-level, interpreted, dynamically typed** programming language. Originally designed to run in browsers, it now runs everywhere — servers (Node.js), mobile apps, desktop apps, and more.

**Key characteristics:**
- **Interpreted** → code runs line by line, no separate compilation step
- **Dynamically typed** → variable types are determined at runtime, not compile time
- **Single-threaded** → one operation at a time, but async patterns handle concurrency
- **Prototype-based OOP** → objects inherit directly from other objects
- **First-class functions** → functions are values; they can be passed, returned, and stored

**JavaScript's execution environments:**
- **Browser** → manipulates DOM, handles user events, communicates with servers
- **Node.js** → server-side JavaScript, file system, networking, CLI tools

### Examples

```javascript
// Example 1 — basic JavaScript execution
console.log("Hello, World!"); // → Hello, World!

// Example 2 — dynamic typing in action
let value = 42;         // number
value = "forty-two";   // now a string — no error
value = true;          // now a boolean — no error

// Example 3 — functions as values (first-class)
function greet(fn) {
  fn("Alice");
}

greet(name => console.log(`Hello, ${name}`)); // → Hello, Alice
```

### Key Points

- JS runs in a **call stack** (synchronous) + **event loop** (async)
- `undefined` is the default value of uninitialized variables
- `null` is an intentional absence of value — you set it explicitly
- JS is **case-sensitive** → `myVar` ≠ `myvar`

### Common Mistakes

```javascript
// Mistake — assuming JS is compiled like C/Java
// JS errors often surface only at runtime

// Mistake — confusing undefined vs null
let x;           // undefined — not yet assigned
let y = null;    // null — intentionally empty
```

### Extra Notes

- JavaScript follows the **ECMAScript (ES)** specification. ES6 (2015) was a landmark update.
- Engines: V8 (Chrome/Node), SpiderMonkey (Firefox), JavaScriptCore (Safari)
- JS is the only language that runs natively in all browsers

---

## 2. Variables — var, let, const

### Explanation

JavaScript has three variable declaration keywords, each with different **scoping**, **hoisting**, and **reassignment** rules.

| Keyword | Scope | Hoisting | Reassignable | Redeclarable |
|---------|-------|----------|--------------|--------------|
| `var` | Function | Yes (initialized as `undefined`) | Yes | Yes |
| `let` | Block | Yes (TDZ — not initialized) | Yes | No |
| `const` | Block | Yes (TDZ — not initialized) | No | No |

**Temporal Dead Zone (TDZ):** The period between the start of a block and the point where `let`/`const` is declared. Accessing the variable in this zone throws a `ReferenceError`.

### Examples

```javascript
// Example 1 — var hoisting (dangerous behavior)
console.log(x); // undefined — hoisted but not initialized
var x = 5;
console.log(x); // 5

// Example 2 — let/const in TDZ
console.log(y); // ReferenceError: Cannot access 'y' before initialization
let y = 10;

// Example 3 — var vs let scoping
function scopeDemo() {
  if (true) {
    var a = "var";   // function-scoped → leaks out of if block
    let b = "let";   // block-scoped → stays inside if block
  }
  console.log(a); // "var" — accessible
  console.log(b); // ReferenceError — not accessible
}

// Example 4 — const with objects
const person = { name: "Alice" };
person.name = "Bob";  // ALLOWED — mutating the object
person = {};          // TypeError — cannot reassign the binding
```

### Key Points

- **Always prefer `const`** — use `let` only when you need to reassign
- **Never use `var`** in modern JavaScript — its function scope causes subtle bugs
- `const` does not mean the value is immutable — it means the **binding** cannot be reassigned
- `let` and `const` are both block-scoped — a block is anything wrapped in `{}`

### Common Mistakes

```javascript
// Mistake 1 — relying on var hoisting
console.log(count); // undefined (not an error — but often a bug)
var count = 0;

// Mistake 2 — thinking const makes objects immutable
const arr = [1, 2, 3];
arr.push(4);    // OK — arr is still [1, 2, 3, 4]
arr = [5, 6];   // TypeError

// Mistake 3 — var in loops
for (var i = 0; i < 3; i++) {
  setTimeout(() => console.log(i), 100); // logs 3, 3, 3 — not 0, 1, 2!
}
// Fix: use let
for (let i = 0; i < 3; i++) {
  setTimeout(() => console.log(i), 100); // logs 0, 1, 2
}
```

### Extra Notes

- The `var` + `setTimeout` bug is a classic interview question — always think about closure + scope
- Declaring variables without any keyword creates **global variables** (extremely bad practice)
- `const` is evaluated at compile time for primitive values — it's a performance hint to engines

---

## 3. Data Types

### Explanation

JavaScript has **8 data types** divided into two categories:

**Primitive Types** (stored by value, immutable):
1. `number` — integers and floats (one type)
2. `string` — text
3. `boolean` — `true` / `false`
4. `undefined` — variable declared but not assigned
5. `null` — intentional absence of value
6. `bigint` — integers larger than `2^53 - 1`
7. `symbol` — unique, immutable identifiers

**Reference Types** (stored by reference):
8. `object` — includes plain objects, arrays, functions, dates, etc.

### Examples

```javascript
// Example 1 — primitives
let num = 42;
let float = 3.14;
let str = "hello";
let bool = true;
let nothing = undefined;
let empty = null;
let big = 9007199254740993n; // BigInt
let sym = Symbol("id");       // Symbol

// Example 2 — typeof operator
console.log(typeof 42);         // "number"
console.log(typeof "hello");    // "string"
console.log(typeof true);       // "boolean"
console.log(typeof undefined);  // "undefined"
console.log(typeof null);       // "object" ← famous bug in JS!
console.log(typeof {});         // "object"
console.log(typeof []);         // "object" ← arrays are objects!
console.log(typeof function(){}); // "function"
console.log(typeof 42n);        // "bigint"
console.log(typeof Symbol());   // "symbol"

// Example 3 — pass by value vs pass by reference
let a = 10;
let b = a;  // copy of value
b = 20;
console.log(a); // 10 — unchanged

let obj1 = { x: 1 };
let obj2 = obj1; // copy of reference
obj2.x = 99;
console.log(obj1.x); // 99 — both point to same object!
```

### Key Points

- `typeof null === "object"` is a **historical bug** — null is not an object
- Arrays are objects → `typeof [] === "object"`; use `Array.isArray()` to check for arrays
- Primitives are **immutable** — string methods return new strings, they don't modify the original
- Objects are **mutable** and passed by reference

### Common Mistakes

```javascript
// Mistake 1 — checking for null with typeof
typeof null === "object" // true — misleading!
// Correct way:
value === null

// Mistake 2 — NaN comparison
let result = NaN;
result === NaN;        // false — NaN is not equal to itself
Number.isNaN(result);  // true — correct way

// Mistake 3 — thinking strings are mutable
let s = "hello";
s[0] = "H";       // silently fails — strings are immutable
console.log(s);   // "hello" — unchanged
```

### Extra Notes

- `Number.MAX_SAFE_INTEGER` is `2^53 - 1`. Above this, use `BigInt`
- Symbols are used as unique property keys (common in library code to avoid naming collisions)
- `NaN` stands for "Not a Number" — it's of type `number`, which is ironic

---

## 4. Type Coercion

### Explanation

JavaScript **automatically converts** values from one type to another when operators or functions expect a certain type. This is called **implicit coercion**. You can also do **explicit coercion** manually.

Understanding coercion is critical for avoiding subtle bugs and is a frequent interview topic.

### Examples

```javascript
// Example 1 — implicit coercion with + (string concatenation wins)
console.log(1 + "2");    // "12" — number coerced to string
console.log("5" - 2);   // 3 — string coerced to number (only + triggers string coercion)
console.log("5" * "2"); // 10
console.log("5" - "2"); // 3
console.log(true + 1);  // 2 — true coerces to 1
console.log(false + 1); // 1 — false coerces to 0
console.log(null + 1);  // 1 — null coerces to 0
console.log(undefined + 1); // NaN

// Example 2 — loose equality (==) coercion
console.log(0 == false);     // true — false becomes 0
console.log("" == false);    // true — both become 0
console.log(null == undefined); // true — special rule
console.log(null == 0);      // false — null only equals undefined
console.log("1" == 1);       // true — string becomes number

// Example 3 — explicit coercion
Number("42");       // 42
Number("");         // 0
Number(null);       // 0
Number(undefined);  // NaN
Number(true);       // 1
Number(false);      // 0

String(42);         // "42"
String(null);       // "null"
String(undefined);  // "undefined"

Boolean(0);         // false
Boolean("");        // false
Boolean(null);      // false
Boolean(undefined); // false
Boolean(NaN);       // false
Boolean("hello");   // true
Boolean({});        // true — empty object is truthy!
Boolean([]);        // true — empty array is truthy!
```

### Key Points

**Falsy values** (coerce to `false` in boolean context):
- `0`, `-0`, `0n` (BigInt zero)
- `""` (empty string)
- `null`
- `undefined`
- `NaN`

**Everything else is truthy** — including `"0"`, `"false"`, `[]`, `{}`

**`==` vs `===`:**
- `==` allows type coercion (loose equality)
- `===` does NOT coerce (strict equality)
- **Always use `===`** unless you specifically need coercion

### Common Mistakes

```javascript
// Mistake 1 — trusting == for comparisons
if ([] == false) { ... }  // true! [] coerces to "" coerces to 0 coerces to false

// Mistake 2 — adding arrays/objects
[] + []   // "" — arrays coerce to strings
[] + {}   // "[object Object]"
{} + []   // 0 — {} parsed as empty block, +[] is 0

// Mistake 3 — falsy gotchas
if (0)     { /* never runs */ }
if ("")    { /* never runs */ }
if ([])    { /* RUNS — empty array is truthy! */ }
if ({})    { /* RUNS — empty object is truthy! */ }
```

### Extra Notes

- The `+` operator is overloaded: if either operand is a string, it concatenates
- Template literals `${}` call `.toString()` — implicit coercion to string
- Interview tip: always explain `==` vs `===` when asked about JavaScript types

---

## 5. Operators

### Explanation

Operators perform operations on values (operands). JavaScript has many categories of operators.

### Examples

```javascript
// Example 1 — Arithmetic operators
let x = 10, y = 3;
x + y   // 13
x - y   // 7
x * y   // 30
x / y   // 3.3333...
x % y   // 1 (remainder)
x ** y  // 1000 (exponentiation — ES2016)
x++     // returns 10, then increments to 11
++x     // increments first, then returns

// Example 2 — Comparison operators
5 > 3    // true
5 >= 5   // true
5 < 3    // false
5 == "5" // true (coercion)
5 === "5"// false (strict)
5 != "5" // false (coercion)
5 !== "5"// true (strict)

// Example 3 — Logical operators
true && false  // false
true || false  // true
!true          // false

// Short-circuit evaluation
const name = null;
const display = name || "Guest"; // "Guest" — name is falsy
const admin = { level: 3 };
const level = admin && admin.level; // 3 — admin is truthy, returns second operand

// Example 4 — Nullish coalescing (??) — ES2020
const val = null ?? "default"; // "default" — only null/undefined trigger fallback
const zero = 0 ?? "default";   // 0 — 0 is NOT null/undefined

// Example 5 — Optional chaining (?.) — ES2020
const user = { address: { city: "Paris" } };
user?.address?.city       // "Paris"
user?.phone?.number       // undefined — no error!
user.phone.number         // TypeError — phone is undefined

// Example 6 — Ternary operator
const age = 20;
const status = age >= 18 ? "adult" : "minor"; // "adult"

// Example 7 — Bitwise operators (important for DSA!)
5 & 3   // 1  (AND)
5 | 3   // 7  (OR)
5 ^ 3   // 6  (XOR)
~5      // -6 (NOT — flips bits)
5 << 1  // 10 (left shift — multiply by 2)
5 >> 1  // 2  (right shift — divide by 2)
```

### Key Points

- `&&` and `||` return one of their operands, not necessarily a boolean
- `??` (nullish coalescing) only falls back on `null`/`undefined` — safer than `||`
- `?.` (optional chaining) prevents TypeError when accessing deep properties
- Bitwise operators convert numbers to 32-bit integers — useful in DSA for optimization

### Common Mistakes

```javascript
// Mistake 1 — using || where ?? is needed
const count = 0;
const display = count || 10; // 10 — WRONG, 0 is a valid value
const display2 = count ?? 10; // 0 — correct

// Mistake 2 — forgetting && short-circuits
const obj = null;
const val = obj && obj.value; // undefined — safe, no error
```

---

## 6. Control Flow

### Explanation

Control flow structures determine the **order of execution** in a program based on conditions.

### Examples

```javascript
// Example 1 — if / else if / else
const score = 85;

if (score >= 90) {
  console.log("A");
} else if (score >= 80) {
  console.log("B");
} else if (score >= 70) {
  console.log("C");
} else {
  console.log("F");
}
// → B

// Example 2 — switch statement
const day = "Monday";

switch (day) {
  case "Monday":
  case "Tuesday":
  case "Wednesday":
  case "Thursday":
  case "Friday":
    console.log("Weekday");
    break;
  case "Saturday":
  case "Sunday":
    console.log("Weekend");
    break;
  default:
    console.log("Unknown");
}

// Example 3 — switch with return (in function — no break needed)
function getDayType(day) {
  switch (day) {
    case "Saturday":
    case "Sunday":
      return "Weekend";
    default:
      return "Weekday";
  }
}

// Example 4 — guard clauses (prefer early returns over deep nesting)
// BAD — deeply nested
function processOrder(order) {
  if (order) {
    if (order.items) {
      if (order.items.length > 0) {
        // process
      }
    }
  }
}

// GOOD — guard clauses
function processOrder(order) {
  if (!order) return;
  if (!order.items) return;
  if (order.items.length === 0) return;
  // process — main logic here
}
```

### Key Points

- `switch` uses **strict equality** (`===`) for case comparison
- Always include `break` in switch cases — omitting it causes **fall-through** (sometimes intentional)
- Prefer guard clauses (early returns) over deeply nested if/else blocks
- `switch` is typically faster than long `if/else if` chains for many discrete values

### Common Mistakes

```javascript
// Mistake — forgetting break in switch (unintentional fall-through)
switch (value) {
  case 1:
    console.log("one"); // no break!
  case 2:
    console.log("two"); // this also runs when value is 1!
  case 3:
    console.log("three");
    break;
}
```

---

## 7. Loops

### Explanation

Loops repeat code blocks. JavaScript provides several loop types, each suited to different scenarios.

### Examples

```javascript
// Example 1 — classic for loop
for (let i = 0; i < 5; i++) {
  console.log(i); // 0 1 2 3 4
}

// Reverse loop
for (let i = 4; i >= 0; i--) {
  console.log(i); // 4 3 2 1 0
}

// Example 2 — while loop (use when you don't know iterations upfront)
let count = 0;
while (count < 3) {
  console.log(count); // 0 1 2
  count++;
}

// Example 3 — do...while (runs at least once)
let x = 10;
do {
  console.log(x); // 10 — runs once even though condition fails
  x++;
} while (x < 5);

// Example 4 — for...of (iterate values of iterable: array, string, Map, Set)
const fruits = ["apple", "banana", "cherry"];
for (const fruit of fruits) {
  console.log(fruit);
}

// With index using entries()
for (const [index, fruit] of fruits.entries()) {
  console.log(`${index}: ${fruit}`);
}

// Iterating a string
for (const char of "hello") {
  console.log(char); // h e l l o
}

// Example 5 — for...in (iterate keys of an object — use with caution)
const person = { name: "Alice", age: 30, city: "Paris" };
for (const key in person) {
  console.log(`${key}: ${person[key]}`);
}

// Example 6 — loop control
for (let i = 0; i < 10; i++) {
  if (i === 3) continue; // skip 3
  if (i === 7) break;    // stop at 7
  console.log(i); // 0 1 2 4 5 6
}

// Example 7 — labeled break (for nested loops)
outer: for (let i = 0; i < 3; i++) {
  for (let j = 0; j < 3; j++) {
    if (j === 1) break outer; // exits both loops
    console.log(i, j);
  }
}
```

### Key Points

- **`for`** → when you know the number of iterations
- **`while`** → when condition-driven (unknown iterations)
- **`do...while`** → when you need at least one execution
- **`for...of`** → iterating values of iterables (preferred for arrays)
- **`for...in`** → iterating keys of objects (avoid on arrays — may include inherited keys)

### Common Mistakes

```javascript
// Mistake 1 — using for...in on arrays
const arr = [10, 20, 30];
for (const i in arr) {
  console.log(i); // "0", "1", "2" — gives string keys, not values!
}
// Use for...of instead

// Mistake 2 — infinite loop
let i = 0;
while (i < 5) {
  console.log(i);
  // forgot i++ — infinite loop!
}

// Mistake 3 — off-by-one error
for (let i = 0; i <= arr.length; i++) { // should be i < arr.length
  console.log(arr[i]); // last iteration gives undefined
}
```

### Extra Notes

- `forEach`, `map`, `filter`, `reduce` are array methods that loop — covered in Arrays section
- `for...of` can iterate any **iterable** (arrays, strings, Sets, Maps, generators)
- In DSA problems, knowing when to use nested loops vs single-pass algorithms matters greatly

---

## 8. Functions

### Explanation

Functions are **first-class citizens** in JavaScript — they can be assigned to variables, passed as arguments, and returned from other functions. This enables powerful patterns like callbacks, higher-order functions, and closures.

### Examples

```javascript
// Example 1 — function declaration (hoisted)
console.log(add(2, 3)); // 5 — works before declaration due to hoisting

function add(a, b) {
  return a + b;
}

// Example 2 — function expression (not hoisted)
const multiply = function(a, b) {
  return a * b;
};
// multiply is a variable holding a function

// Example 3 — arrow functions (ES6)
const subtract = (a, b) => a - b;          // single expression — implicit return
const square = x => x * x;                  // single param — no parens needed
const greet = () => console.log("Hello");   // no params

const divide = (a, b) => {
  if (b === 0) throw new Error("Division by zero");
  return a / b;
};

// Example 4 — default parameters
function greetUser(name = "Guest", greeting = "Hello") {
  return `${greeting}, ${name}!`;
}
greetUser();              // "Hello, Guest!"
greetUser("Alice");       // "Hello, Alice!"
greetUser("Bob", "Hi");   // "Hi, Bob!"

// Example 5 — rest parameters (collect remaining args into array)
function sum(...numbers) {
  return numbers.reduce((total, n) => total + n, 0);
}
sum(1, 2, 3, 4, 5); // 15

// Example 6 — higher-order functions (take/return functions)
function applyOperation(a, b, operation) {
  return operation(a, b);
}
applyOperation(10, 5, (a, b) => a + b); // 15
applyOperation(10, 5, (a, b) => a * b); // 50

// Returning a function
function createMultiplier(factor) {
  return function(number) {
    return number * factor;
  };
}
const double = createMultiplier(2);
const triple = createMultiplier(3);
double(5);  // 10
triple(5);  // 15

// Example 7 — IIFE (Immediately Invoked Function Expression)
const result = (function() {
  const secret = 42;
  return secret * 2;
})();
console.log(result); // 84
// secret is not accessible outside
```

### Key Points

- **Function declarations** are hoisted — you can call them before they appear in code
- **Function expressions** and **arrow functions** are NOT hoisted
- Arrow functions do NOT have their own `this` — they inherit `this` from the enclosing scope
- Arrow functions also lack `arguments` object
- Functions without a `return` statement return `undefined`

### Common Mistakes

```javascript
// Mistake 1 — arrow function returning object literal
const getObj = () => { name: "Alice" }; // returns undefined! {} is a block
const getObj2 = () => ({ name: "Alice" }); // correct — wrap in parens

// Mistake 2 — forgetting return
const double = x => {
  x * 2;  // MISSING return — returns undefined
};

// Mistake 3 — using arrow function as method (this issue)
const obj = {
  name: "Alice",
  greet: () => {
    console.log(this.name); // undefined — arrow functions don't have own 'this'
  }
};
// Use regular function for methods:
const obj2 = {
  name: "Alice",
  greet() {
    console.log(this.name); // "Alice"
  }
};
```

### Extra Notes

- **Callbacks** are functions passed to other functions to be called later
- **Pure functions** always return the same output for the same input and have no side effects
- Pure functions are easier to test and reason about — prefer them

---

## 9. Arrays

### Explanation

Arrays are **ordered, zero-indexed** collections that can hold any mix of types. In JavaScript, arrays are actually objects — `Array.isArray()` is the reliable way to detect them.

This section is critical — most DSA problems revolve around array manipulation.

### Examples

```javascript
// === CREATION ===
const arr1 = [1, 2, 3, 4, 5];
const arr2 = new Array(5);          // [empty × 5] — 5 empty slots
const arr3 = new Array(1, 2, 3);    // [1, 2, 3]
const arr4 = Array.from("hello");   // ['h','e','l','l','o']
const arr5 = Array.from({length: 5}, (_, i) => i); // [0,1,2,3,4]
const arr6 = Array.of(1, 2, 3);     // [1,2,3]

// === ACCESSING ===
const fruits = ["apple", "banana", "cherry"];
fruits[0];       // "apple"
fruits[2];       // "cherry"
fruits[-1];      // undefined (JS doesn't support negative indices)
fruits.at(-1);   // "cherry" — ES2022 .at() supports negative indices
fruits.at(-2);   // "banana"
fruits.length;   // 3

// === MUTATING METHODS (modify original array) ===

// push / pop — add/remove from END
fruits.push("date");         // returns new length (4)
fruits.pop();                // returns removed element "date"

// unshift / shift — add/remove from START (slower — reindexes)
fruits.unshift("avocado");   // returns new length
fruits.shift();              // returns removed element "avocado"

// splice — add/remove anywhere
// splice(startIndex, deleteCount, ...itemsToInsert)
fruits.splice(1, 0, "blueberry");     // insert at index 1
fruits.splice(1, 1);                   // remove 1 element at index 1
fruits.splice(1, 1, "mango", "kiwi"); // replace 1 element with 2

// sort — sorts in place (mutates!)
const nums = [3, 1, 4, 1, 5, 9];
nums.sort();                        // [1, 1, 3, 4, 5, 9] — lexicographic by default
nums.sort((a, b) => a - b);         // ascending
nums.sort((a, b) => b - a);         // descending

// reverse — reverses in place
nums.reverse();

// fill — fill with a value
new Array(5).fill(0);       // [0,0,0,0,0]
[1,2,3,4,5].fill(0, 2, 4); // [1,2,0,0,5]

// copyWithin
[1,2,3,4,5].copyWithin(0, 3); // [4,5,3,4,5] — copies from index 3 to index 0

// === NON-MUTATING METHODS (return new array) ===

// slice — extract portion
const original = [1, 2, 3, 4, 5];
original.slice(1, 3);  // [2, 3] — from index 1 up to (not including) 3
original.slice(2);     // [3, 4, 5]
original.slice(-2);    // [4, 5]

// concat — merge arrays
[1, 2].concat([3, 4], [5, 6]); // [1, 2, 3, 4, 5, 6]

// flat — flatten nested arrays
[1, [2, [3, [4]]]].flat();      // [1, 2, [3, [4]]] — 1 level deep
[1, [2, [3, [4]]]].flat(2);     // [1, 2, 3, [4]]
[1, [2, [3, [4]]]].flat(Infinity); // [1, 2, 3, 4] — fully flat

// flatMap — map then flat 1 level
[1, 2, 3].flatMap(x => [x, x * 2]); // [1,2,2,4,3,6]

// === ITERATION METHODS ===

const numbers = [1, 2, 3, 4, 5];

// forEach — execute function for each element (no return value)
numbers.forEach((num, index) => {
  console.log(`${index}: ${num}`);
});

// map — transform each element → returns new array
const doubled = numbers.map(n => n * 2); // [2,4,6,8,10]

// filter — keep elements that pass test → returns new array
const evens = numbers.filter(n => n % 2 === 0); // [2,4]

// reduce — accumulate into single value
const sum = numbers.reduce((acc, n) => acc + n, 0); // 15
const product = numbers.reduce((acc, n) => acc * n, 1); // 120

// reduceRight — same but right-to-left
[1,2,3,4].reduceRight((acc, n) => acc + n, 0); // 10

// find — first matching element (or undefined)
const firstEven = numbers.find(n => n % 2 === 0); // 2

// findIndex — index of first match (or -1)
numbers.findIndex(n => n % 2 === 0); // 1

// findLast / findLastIndex — ES2023
numbers.findLast(n => n % 2 === 0); // 4

// some — true if at least one passes
numbers.some(n => n > 4); // true

// every — true if all pass
numbers.every(n => n > 0); // true

// includes — checks if value exists
numbers.includes(3); // true

// indexOf / lastIndexOf
numbers.indexOf(3);     // 2
numbers.lastIndexOf(3); // 2

// === SEARCH & CONVERSION ===

// join — array to string
["a", "b", "c"].join("-"); // "a-b-c"
["a", "b", "c"].join("");  // "abc"

// toString
[1,2,3].toString(); // "1,2,3"

// keys / values / entries — iterators
for (const [i, v] of [10, 20, 30].entries()) {
  console.log(i, v); // 0 10, 1 20, 2 30
}

// === SPREAD WITH ARRAYS ===
const a = [1, 2, 3];
const b = [4, 5, 6];
const combined = [...a, ...b]; // [1,2,3,4,5,6]
const copy = [...a];           // shallow copy
```

### Key Points

- `sort()` with no comparator converts elements to **strings** — `[10, 9, 100].sort()` → `[10, 100, 9]`
- Always provide a comparator for numeric sorting: `.sort((a, b) => a - b)`
- `indexOf` uses strict equality — won't find `NaN` (use `findIndex` with `Number.isNaN`)
- `slice` is non-destructive — great for making copies
- `splice` mutates the original — be careful

### Common Mistakes

```javascript
// Mistake 1 — sorting numbers without comparator
[10, 9, 100, 1].sort(); // [1, 10, 100, 9] — wrong!
[10, 9, 100, 1].sort((a, b) => a - b); // [1, 9, 10, 100] — correct

// Mistake 2 — shallow copy issues
const original = [[1,2], [3,4]];
const copy = [...original]; // shallow copy
copy[0].push(99);
console.log(original[0]); // [1, 2, 99] — inner arrays are still shared!

// Deep copy:
const deepCopy = JSON.parse(JSON.stringify(original));

// Mistake 3 — forEach returns undefined
const result = [1,2,3].forEach(n => n * 2);
console.log(result); // undefined — use .map() instead

// Mistake 4 — mutating array during iteration
const arr = [1, 2, 3, 4, 5];
arr.forEach((item, i) => {
  if (item % 2 === 0) arr.splice(i, 1); // BUG — skips elements
});
```

### Extra Notes

- Time complexities: `push`/`pop` → O(1), `shift`/`unshift`/`splice` → O(n) (reindexing), `indexOf` → O(n)
- For performance-critical code, avoid `shift`/`unshift` on large arrays — use a pointer instead
- `structuredClone(arr)` is the modern way to deep clone (ES2022)
- Two-pointer, sliding window, prefix sums — all DSA patterns built on array fundamentals

---

## 10. Strings

### Explanation

Strings are **immutable sequences of UTF-16 code units**. All string methods return new strings — they never modify the original.

### Examples

```javascript
// === CREATION ===
const s1 = "double quotes";
const s2 = 'single quotes';
const s3 = `template literal`;

// Template literals — embed expressions
const name = "Alice";
const age = 30;
const msg = `My name is ${name} and I am ${age} years old.`;

// Multi-line string
const multiLine = `Line 1
Line 2
Line 3`;

// === PROPERTIES ===
"hello".length; // 5

// === ACCESS ===
const str = "JavaScript";
str[0];        // "J"
str.at(-1);    // "t" — ES2022, negative index
str.charAt(0); // "J"

// === SEARCHING ===
"hello world".indexOf("world");      // 6
"hello world".lastIndexOf("l");      // 9
"hello world".includes("hello");     // true
"hello world".startsWith("hello");   // true
"hello world".endsWith("world");     // true
"hello".search(/e/);                 // 1 (regex search)

// === EXTRACTING ===
"JavaScript".slice(0, 4);    // "Java"
"JavaScript".slice(-6);      // "Script"
"JavaScript".substring(0, 4);// "Java" — similar to slice, no negative indices
"JavaScript".substr(4, 6);   // "Script" — deprecated, avoid

// === MODIFYING (returns new string) ===
"hello".toUpperCase();    // "HELLO"
"HELLO".toLowerCase();    // "hello"
"  hello  ".trim();       // "hello"
"  hello  ".trimStart();  // "hello  "
"  hello  ".trimEnd();    // "  hello"

"hello".replace("l", "r");     // "herlo" — replaces first match
"hello".replaceAll("l", "r");  // "herro" — replaces all

"ha".repeat(3);          // "hahaha"
"5".padStart(4, "0");    // "0005"
"5".padEnd(4, "0");      // "5000"

// === SPLITTING ===
"a,b,c".split(",");      // ["a", "b", "c"]
"hello".split("");       // ["h","e","l","l","o"]
"hello".split("", 3);    // ["h","e","l"] — limit

// === REGEX WITH STRINGS ===
"hello123".match(/\d+/);         // ["123"]
"hello123world456".match(/\d+/g);// ["123", "456"] — global flag
"hello".replace(/l/g, "r");      // "herro"

// === STRING <-> NUMBER ===
parseInt("42px");        // 42 — parses leading integer
parseInt("3.14");        // 3
parseFloat("3.14abc");   // 3.14
Number("42");            // 42
+"42";                   // 42 — unary plus shorthand
String(42);              // "42"
(42).toString();         // "42"
(255).toString(16);      // "ff" — hex
(8).toString(2);         // "1000" — binary

// === USEFUL PATTERNS ===
// Reverse a string
const reversed = "hello".split("").reverse().join(""); // "olleh"

// Check palindrome
function isPalindrome(s) {
  const clean = s.toLowerCase().replace(/[^a-z0-9]/g, "");
  return clean === clean.split("").reverse().join("");
}

// Count character frequency
function charFreq(s) {
  const freq = {};
  for (const ch of s) {
    freq[ch] = (freq[ch] || 0) + 1;
  }
  return freq;
}
```

### Key Points

- Strings are **immutable** — all methods return new strings
- String comparison uses **lexicographic (alphabetical) order** — `"b" > "a"` is true
- `for...of` correctly iterates Unicode characters (important for emoji/non-ASCII strings)
- Template literals can span multiple lines and embed any expression

### Common Mistakes

```javascript
// Mistake 1 — trying to mutate a string
let s = "hello";
s[0] = "H"; // silently fails — strings are immutable
s = "H" + s.slice(1); // correct way

// Mistake 2 — comparing strings and numbers
"10" > "9"; // false! "1" < "9" lexicographically
10 > 9;     // true

// Mistake 3 — split without knowing Unicode
"😀😁".split(""); // may not split cleanly — use Array.from instead
Array.from("😀😁"); // ["😀", "😁"] — correct

// Mistake 4 — indexOf returning 0 being falsy
const pos = "hello".indexOf("h");
if (pos) { // 0 is falsy — this block won't run!
  console.log("found");
}
// Correct:
if (pos !== -1) { ... }
```

---

## 11. Objects

### Explanation

Objects are **unordered collections of key-value pairs**. Keys are strings (or Symbols), values can be anything. Objects are the foundation of JavaScript — almost everything is an object.

### Examples

```javascript
// === CREATION ===
// Object literal (most common)
const person = {
  name: "Alice",
  age: 30,
  "full name": "Alice Smith", // key with spaces — use quotes
  greet() {                   // method shorthand (ES6)
    return `Hi, I'm ${this.name}`;
  }
};

// Constructor function
function Person(name, age) {
  this.name = name;
  this.age = age;
}
const p = new Person("Bob", 25);

// Object.create()
const animal = { breathe() { return "breathing"; } };
const dog = Object.create(animal);
dog.bark = () => "woof";

// === ACCESSING ===
person.name;           // dot notation
person["full name"];   // bracket notation (required for special chars / variables)
const key = "age";
person[key];           // 30 — dynamic key access

// === MODIFYING ===
person.email = "alice@example.com"; // add property
person.age = 31;                    // modify
delete person.email;                // remove

// === CHECKING EXISTENCE ===
"name" in person;              // true — checks own + inherited
person.hasOwnProperty("name"); // true — own properties only
Object.hasOwn(person, "name"); // true — modern version (ES2022)

// === OBJECT METHODS ===
const obj = { a: 1, b: 2, c: 3 };

Object.keys(obj);    // ["a", "b", "c"]
Object.values(obj);  // [1, 2, 3]
Object.entries(obj); // [["a",1], ["b",2], ["c",3]]

// Iterating
for (const [key, value] of Object.entries(obj)) {
  console.log(`${key} = ${value}`);
}

// Object.fromEntries — inverse of entries
Object.fromEntries([["a", 1], ["b", 2]]); // {a: 1, b: 2}

// Convert Map to Object
const map = new Map([["x", 10], ["y", 20]]);
Object.fromEntries(map); // {x: 10, y: 20}

// === COPYING & MERGING ===

// Shallow copy
const copy1 = Object.assign({}, obj);
const copy2 = { ...obj }; // spread — preferred

// Merging
const merged = { ...obj, d: 4, a: 99 }; // later keys override earlier

// Deep clone (modern)
const deepCopy = structuredClone(obj);

// === OBJECT FREEZING / SEALING ===
const frozen = Object.freeze({ x: 1, y: 2 });
frozen.x = 99; // silently fails (throws in strict mode)
frozen.z = 3;  // silently fails

const sealed = Object.seal({ x: 1 });
sealed.x = 99; // OK — can modify existing
sealed.y = 2;  // silently fails — can't add new

// === COMPUTED PROPERTY NAMES (ES6) ===
const prefix = "user";
const dynamicObj = {
  [`${prefix}_name`]: "Alice",
  [`${prefix}_age`]: 30
};
// { user_name: "Alice", user_age: 30 }

// === PROPERTY SHORTHAND (ES6) ===
const name = "Alice";
const age = 30;
const user = { name, age }; // { name: "Alice", age: 30 }
```

### Key Points

- Objects are **passed by reference** — modifying a copied reference modifies the original
- `Object.assign` and spread (`...`) do **shallow** copies only
- Order of keys: integer-like keys first (sorted numerically), then string keys in insertion order
- `for...in` iterates ALL enumerable keys including inherited ones — use `hasOwnProperty` check

### Common Mistakes

```javascript
// Mistake 1 — shallow copy issue
const original = { nested: { value: 1 } };
const copy = { ...original };
copy.nested.value = 99;
console.log(original.nested.value); // 99 — shared reference!

// Mistake 2 — in vs hasOwnProperty
const obj = Object.create({ inherited: true });
obj.own = true;
"inherited" in obj;              // true
obj.hasOwnProperty("inherited"); // false

// Mistake 3 — object as Map (key problems)
const map = {};
map[[1, 2]] = "value";         // key is "[1,2]" (string)
map[{}] = "a";
map[{}] = "b";                 // both keys are "[object Object]" — collision!
// Use Map for non-string keys
```

---

## 12. ES6+ Features

### Explanation

ES6 (2015) dramatically modernized JavaScript. The following features are now standard and essential.

### Examples

```javascript
// === 1. DESTRUCTURING ===

// Array destructuring
const [first, second, ...rest] = [1, 2, 3, 4, 5];
// first=1, second=2, rest=[3,4,5]

// Swap variables
let a = 1, b = 2;
[a, b] = [b, a]; // a=2, b=1

// Object destructuring
const { name, age, city = "Unknown" } = { name: "Alice", age: 30 };
// city defaults to "Unknown"

// Rename while destructuring
const { name: personName, age: personAge } = person;

// Nested destructuring
const { address: { city, zip } } = { address: { city: "Paris", zip: "75001" } };

// Function parameter destructuring
function display({ name, age = 0 }) {
  return `${name} is ${age}`;
}

// === 2. SPREAD OPERATOR ===
const arr1 = [1, 2, 3];
const arr2 = [4, 5, 6];
const combined = [...arr1, ...arr2]; // [1,2,3,4,5,6]

const obj1 = { a: 1 };
const obj2 = { b: 2 };
const merged = { ...obj1, ...obj2 }; // {a:1, b:2}

// Clone
const arrCopy = [...arr1];
const objCopy = { ...obj1 };

// Pass array as args
Math.max(...[3, 1, 4, 1, 5]); // 5

// === 3. REST PARAMETERS ===
function sum(first, ...rest) {
  return rest.reduce((acc, n) => acc + n, first);
}
sum(1, 2, 3, 4); // 10

// === 4. TEMPLATE LITERALS ===
const name2 = "World";
`Hello, ${name2}!`; // "Hello, World!"
`${2 + 2} is four`; // "4 is four"
`${true ? "yes" : "no"}`; // "yes"

// Tagged template literals
function tag(strings, ...values) {
  return strings.reduce((result, str, i) => {
    return result + str + (values[i] || "");
  }, "");
}
tag`Hello ${"Alice"} and ${"Bob"}`; // "Hello Alice and Bob"

// === 5. SHORT-HAND PROPERTIES & METHODS ===
const x = 1, y = 2;
const point = { x, y }; // { x: 1, y: 2 }

const obj = {
  greet() { return "hello"; },  // method shorthand
  get value() { return this._v; },
  set value(v) { this._v = v; }
};

// === 6. OPTIONAL CHAINING (?.) ===
const user = { profile: { name: "Alice" } };
user?.profile?.name;       // "Alice"
user?.address?.city;       // undefined — no error
user?.getAge?.();          // undefined if getAge doesn't exist
arr?.[0];                  // safe array access

// === 7. NULLISH COALESCING (??) ===
null ?? "default";      // "default"
undefined ?? "default"; // "default"
0 ?? "default";         // 0
"" ?? "default";        // ""
false ?? "default";     // false

// === 8. LOGICAL ASSIGNMENT OPERATORS (ES2021) ===
let a2 = null;
a2 ??= "default"; // a2 = "default" (assign if nullish)

let b2 = 0;
b2 ||= 10; // b2 = 10 (assign if falsy)

let c2 = 5;
c2 &&= 20; // c2 = 20 (assign if truthy)

// === 9. ENHANCED FOR...OF ===
// Works with any iterable
for (const char of "hello") { }
for (const [key, val] of new Map()) { }
for (const item of new Set()) { }

// === 10. CLASSES (ES6) ===
class Animal {
  #name; // private field (ES2022)

  constructor(name) {
    this.#name = name;
  }

  get name() { return this.#name; }

  speak() {
    return `${this.#name} makes a sound`;
  }

  static create(name) {
    return new Animal(name);
  }
}

class Dog extends Animal {
  constructor(name, breed) {
    super(name);
    this.breed = breed;
  }

  speak() {
    return `${this.name} barks!`;
  }
}

// === 11. GENERATORS ===
function* range(start, end, step = 1) {
  for (let i = start; i < end; i += step) {
    yield i;
  }
}

for (const n of range(0, 10, 2)) {
  console.log(n); // 0 2 4 6 8
}

// === 12. SYMBOL ===
const id = Symbol("id");
const obj3 = { [id]: 123, name: "Alice" };
obj3[id]; // 123 — Symbol key not visible in for...in

// Well-known symbols
class MyArray {
  [Symbol.iterator]() {
    // custom iteration
  }
}
```

### Key Points

- Destructuring works on any iterable (left side) or object (right side)
- Spread creates shallow copies
- Optional chaining short-circuits — returns `undefined` if any part is null/undefined
- Private class fields (`#field`) are truly private — not accessible outside the class

---

## 13. Map & Set

### Explanation

**Map** is a key-value store where **any type** can be a key (unlike plain objects which only allow strings/Symbols).

**Set** is a collection of **unique values** — duplicates are automatically removed.

### Examples

```javascript
// === MAP ===
const map = new Map();

// Set entries
map.set("name", "Alice");
map.set(42, "the answer");
map.set({ id: 1 }, "object key"); // object as key — this works!
map.set(true, "boolean key");

// Get entries
map.get("name");  // "Alice"
map.get(42);      // "the answer"
map.has("name");  // true
map.size;         // 4

// Delete
map.delete("name");
map.clear(); // remove all

// Iteration (maintains insertion order)
const scores = new Map([
  ["Alice", 95],
  ["Bob", 87],
  ["Charlie", 92]
]);

for (const [name, score] of scores) {
  console.log(`${name}: ${score}`);
}

scores.keys();   // iterator of keys
scores.values(); // iterator of values
scores.entries();// iterator of [key, value] pairs

// Convert to array
[...scores.keys()];    // ["Alice", "Bob", "Charlie"]
[...scores.values()];  // [95, 87, 92]
[...scores];           // [["Alice",95],["Bob",87],["Charlie",92]]

// Map vs Object — when to use Map:
// - Non-string keys needed
// - Frequent additions/deletions (Map is optimized)
// - Need to know the size easily (map.size vs Object.keys(obj).length)
// - Need ordered iteration

// Frequency counter with Map
function charFrequency(str) {
  const freq = new Map();
  for (const char of str) {
    freq.set(char, (freq.get(char) || 0) + 1);
  }
  return freq;
}

// === SET ===
const set = new Set();

set.add(1);
set.add(2);
set.add(2); // duplicate — ignored
set.add("hello");
set.add({ id: 1 }); // objects compared by reference — this is NEW

set.has(1);    // true
set.has(2);    // true
set.size;      // 4
set.delete(1);

// Iteration
const fruits = new Set(["apple", "banana", "apple", "cherry"]);
for (const fruit of fruits) {
  console.log(fruit); // apple, banana, cherry (deduplicated)
}

// Remove duplicates from array
const arr = [1, 2, 2, 3, 3, 4];
const unique = [...new Set(arr)]; // [1, 2, 3, 4]

// Set operations
const setA = new Set([1, 2, 3, 4]);
const setB = new Set([3, 4, 5, 6]);

// Union
const union = new Set([...setA, ...setB]); // {1,2,3,4,5,6}

// Intersection
const intersection = new Set([...setA].filter(x => setB.has(x))); // {3,4}

// Difference
const difference = new Set([...setA].filter(x => !setB.has(x))); // {1,2}

// === WEAKMAP & WEAKSET ===
// Keys must be objects, not strongly referenced — allows garbage collection
const weakMap = new WeakMap();
let obj = { id: 1 };
weakMap.set(obj, "metadata");
obj = null; // obj can be garbage collected — weakMap won't prevent it
```

### Key Points

- `Map` maintains **insertion order** — predictable iteration
- `Set` values are unique — uses same-value-zero equality (similar to ===, but `NaN === NaN` in Set)
- `Map.get` returns `undefined` for missing keys — unlike objects which may return `undefined` or inherited values
- `WeakMap`/`WeakSet` hold weak references — good for caching without memory leaks

### Common Mistakes

```javascript
// Mistake 1 — object keys in Map
const map = new Map();
const key1 = { id: 1 };
const key2 = { id: 1 }; // different reference!
map.set(key1, "first");
map.set(key2, "second"); // different entry — key1 !== key2

// Mistake 2 — Set with objects
const set = new Set();
set.add({ id: 1 });
set.add({ id: 1 }); // Two different objects — both added!
set.size; // 2

// Mistake 3 — trying to use map[key] instead of map.get(key)
const map2 = new Map();
map2.set("a", 1);
map2["a"];      // undefined — this accesses Map as a regular object
map2.get("a");  // 1 — correct
```

---

## 14. Recursion

### Explanation

Recursion is when a function **calls itself** to solve a smaller subproblem. Every recursive function needs:
1. **Base case** — the stopping condition (prevents infinite recursion)
2. **Recursive case** — calls itself with a smaller/simpler input

Mental model: Trust that your function correctly solves smaller inputs. Write the current step, then delegate the rest.

### Examples

```javascript
// Example 1 — factorial
function factorial(n) {
  if (n <= 1) return 1;        // base case
  return n * factorial(n - 1); // recursive case
}
factorial(5); // 120

// Example 2 — fibonacci
function fib(n) {
  if (n <= 1) return n;          // base case
  return fib(n - 1) + fib(n - 2); // recursive case
}
// Very slow — O(2^n) — each call spawns two more
// Fix: memoization
function fibMemo(n, memo = {}) {
  if (n in memo) return memo[n];
  if (n <= 1) return n;
  memo[n] = fibMemo(n - 1, memo) + fibMemo(n - 2, memo);
  return memo[n];
}
fibMemo(50); // fast!

// Example 3 — sum of array
function sumArray(arr) {
  if (arr.length === 0) return 0;
  return arr[0] + sumArray(arr.slice(1));
}
sumArray([1, 2, 3, 4, 5]); // 15

// Example 4 — flatten nested array
function flatten(arr) {
  const result = [];
  for (const item of arr) {
    if (Array.isArray(item)) {
      result.push(...flatten(item)); // recurse on nested arrays
    } else {
      result.push(item);
    }
  }
  return result;
}
flatten([1, [2, [3, [4]]], 5]); // [1, 2, 3, 4, 5]

// Example 5 — binary search (recursive)
function binarySearch(arr, target, left = 0, right = arr.length - 1) {
  if (left > right) return -1; // base case — not found
  const mid = Math.floor((left + right) / 2);
  if (arr[mid] === target) return mid;
  if (arr[mid] < target) return binarySearch(arr, target, mid + 1, right);
  return binarySearch(arr, target, left, mid - 1);
}

// Example 6 — tree traversal
function inorder(node) {
  if (!node) return []; // base case
  return [...inorder(node.left), node.val, ...inorder(node.right)];
}

// Example 7 — tail recursion (optimization)
// Not optimized in V8, but good to know
function factTail(n, acc = 1) {
  if (n <= 1) return acc;
  return factTail(n - 1, n * acc); // tail call
}
```

### Key Points

- Every recursive call should move **toward the base case**
- Stack depth is limited (~10,000 frames in most engines) — deep recursion can cause stack overflow
- **Memoization** transforms exponential recursion to linear time
- Recursion is natural for: trees, graphs, divide-and-conquer, backtracking

### Common Mistakes

```javascript
// Mistake 1 — missing base case
function countdown(n) {
  console.log(n);
  countdown(n - 1); // never stops — stack overflow!
}

// Mistake 2 — base case unreachable
function sum(n) {
  if (n === 0) return 0;
  return n + sum(n - 1);
}
sum(-1); // infinite — never hits 0 going negative
// Fix: if (n <= 0) return 0;

// Mistake 3 — not reducing the problem
function badRecursion(arr) {
  return arr[0] + badRecursion(arr); // arr doesn't change — infinite!
}
```

---

## 15. Error Handling

### Explanation

JavaScript uses **exceptions** for error handling. `try/catch/finally` is the primary mechanism.

### Examples

```javascript
// Example 1 — try/catch/finally
function divide(a, b) {
  if (b === 0) throw new Error("Division by zero");
  return a / b;
}

try {
  const result = divide(10, 0);
  console.log(result);
} catch (error) {
  console.log(`Error: ${error.message}`); // Error: Division by zero
} finally {
  console.log("Always runs"); // runs regardless
}

// Example 2 — custom error types
class ValidationError extends Error {
  constructor(message, field) {
    super(message);
    this.name = "ValidationError";
    this.field = field;
  }
}

class NetworkError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.name = "NetworkError";
    this.statusCode = statusCode;
  }
}

function validateAge(age) {
  if (typeof age !== "number") throw new ValidationError("Age must be a number", "age");
  if (age < 0 || age > 150) throw new ValidationError("Age out of range", "age");
  return true;
}

try {
  validateAge("thirty");
} catch (error) {
  if (error instanceof ValidationError) {
    console.log(`Validation failed on field '${error.field}': ${error.message}`);
  } else {
    throw error; // re-throw unexpected errors
  }
}

// Example 3 — error types
new Error("generic");
new TypeError("wrong type");
new RangeError("value out of range");
new ReferenceError("variable not defined");
new SyntaxError("invalid syntax");

// Example 4 — async error handling
async function fetchData(url) {
  try {
    const response = await fetch(url);
    if (!response.ok) throw new NetworkError("Request failed", response.status);
    return await response.json();
  } catch (error) {
    if (error instanceof NetworkError) {
      console.log(`Network error ${error.statusCode}: ${error.message}`);
    }
    throw error;
  }
}
```

### Key Points

- `throw` can throw any value, but throwing `Error` instances is best practice
- `error.message` — the message, `error.name` — the type, `error.stack` — the stack trace
- `finally` runs even if `catch` throws — useful for cleanup (closing files, releasing locks)
- Re-throwing errors you can't handle is good practice — don't swallow errors silently

---

## 16. Closures

### Explanation

A **closure** is a function that **remembers the variables from its outer scope** even after the outer function has finished executing. Every function in JavaScript creates a closure.

Mental model: A function carries a "backpack" of all variables that were in scope when it was defined — even after the defining scope is gone.

### Examples

```javascript
// Example 1 — basic closure
function makeCounter() {
  let count = 0; // this variable is "closed over"

  return {
    increment() { count++; },
    decrement() { count--; },
    getCount() { return count; }
  };
}

const counter = makeCounter();
counter.increment();
counter.increment();
counter.increment();
counter.decrement();
counter.getCount(); // 2
// count is not accessible directly — it's private!

// Example 2 — factory function (closure for encapsulation)
function createMultiplier(factor) {
  return function(number) {
    return number * factor; // factor is captured from outer scope
  };
}

const double = createMultiplier(2);
const triple = createMultiplier(3);
double(5);  // 10
triple(5);  // 15
// Each closure has its own 'factor'

// Example 3 — closure in loops (classic interview question)
// BAD — var shares one scope
for (var i = 0; i < 3; i++) {
  setTimeout(() => console.log(i), 1000); // 3, 3, 3 — all see same i
}

// FIX 1 — use let (block scope creates new binding per iteration)
for (let i = 0; i < 3; i++) {
  setTimeout(() => console.log(i), 1000); // 0, 1, 2
}

// FIX 2 — IIFE closure (pre-ES6)
for (var i = 0; i < 3; i++) {
  (function(j) {
    setTimeout(() => console.log(j), 1000); // 0, 1, 2
  })(i);
}

// Example 4 — memoization using closure
function memoize(fn) {
  const cache = {}; // closed over

  return function(...args) {
    const key = JSON.stringify(args);
    if (key in cache) {
      console.log("Cache hit");
      return cache[key];
    }
    cache[key] = fn(...args);
    return cache[key];
  };
}

const memoFib = memoize(function fib(n) {
  if (n <= 1) return n;
  return memoFib(n - 1) + memoFib(n - 2);
});

// Example 5 — module pattern (closure for privacy)
const BankAccount = (function() {
  let balance = 0; // private — not accessible from outside

  return {
    deposit(amount) { balance += amount; },
    withdraw(amount) {
      if (amount > balance) throw new Error("Insufficient funds");
      balance -= amount;
    },
    getBalance() { return balance; }
  };
})();
```

### Key Points

- Closures enable **data privacy** — variables are hidden from the global scope
- Each closure has its own copy of closed-over variables
- Closures can cause **memory leaks** if not managed carefully (holding large objects in scope)
- Closures are the foundation of: modules, factories, memoization, callbacks, event handlers

### Common Mistakes

```javascript
// Mistake — assuming closures copy values (they capture references!)
function createFunctions() {
  const funcs = [];
  let x = 0;
  for (let i = 0; i < 3; i++) {
    funcs.push(() => i); // each captures its own i (let)
  }
  return funcs;
}
createFunctions().map(f => f()); // [0, 1, 2]

// With var — same reference
function createFunctionsVar() {
  const funcs = [];
  for (var i = 0; i < 3; i++) {
    funcs.push(() => i);
  }
  return funcs;
}
createFunctionsVar().map(f => f()); // [3, 3, 3]
```

---

## 17. Promises & Async/Await

### Explanation

JavaScript is single-threaded, but handles async operations (network requests, timers, file I/O) through **Promises** and the **event loop**. Promises represent a future value — something that hasn't arrived yet.

**Promise states:**
- `pending` → initial state
- `fulfilled` → operation succeeded (has a value)
- `rejected` → operation failed (has a reason/error)

### Examples

```javascript
// Example 1 — creating a Promise
const myPromise = new Promise((resolve, reject) => {
  const success = true;
  if (success) {
    resolve("Data loaded!"); // fulfills the promise
  } else {
    reject(new Error("Loading failed")); // rejects the promise
  }
});

// Example 2 — consuming Promises with .then/.catch/.finally
myPromise
  .then(data => {
    console.log(data); // "Data loaded!"
    return data.length; // pass value to next .then
  })
  .then(length => console.log(length)) // 12
  .catch(error => console.error(error.message))
  .finally(() => console.log("Done"));

// Example 3 — simulating async operation
function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function fetchUser(id) {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (id > 0) resolve({ id, name: "Alice" });
      else reject(new Error("Invalid ID"));
    }, 1000);
  });
}

// Example 4 — async/await (cleaner syntax for Promises)
async function loadUser(id) {
  try {
    const user = await fetchUser(id); // pauses execution until Promise resolves
    console.log(user); // { id: 1, name: "Alice" }
    return user;
  } catch (error) {
    console.error("Error:", error.message);
  }
}

// Example 5 — Promise combinators
const p1 = fetchUser(1);
const p2 = fetchUser(2);
const p3 = fetchUser(3);

// Promise.all — wait for ALL to resolve (fails fast if any reject)
const [u1, u2, u3] = await Promise.all([p1, p2, p3]);

// Promise.allSettled — wait for ALL to settle (resolve or reject)
const results = await Promise.allSettled([p1, p2, p3]);
results.forEach(result => {
  if (result.status === "fulfilled") console.log(result.value);
  else console.log(result.reason);
});

// Promise.race — first one to settle (resolve OR reject) wins
const fastest = await Promise.race([p1, p2, p3]);

// Promise.any — first to RESOLVE wins (ignores rejections unless all reject)
const first = await Promise.any([p1, p2, p3]);

// Example 6 — sequential vs parallel async
// Sequential (slow — waits for each)
async function sequential() {
  const u1 = await fetchUser(1); // wait
  const u2 = await fetchUser(2); // wait again
  return [u1, u2];
}

// Parallel (fast — both start immediately)
async function parallel() {
  const [u1, u2] = await Promise.all([fetchUser(1), fetchUser(2)]);
  return [u1, u2];
}

// Example 7 — async iteration
async function processItems(items) {
  for (const item of items) {
    await processItem(item); // sequential processing with await in loop
  }
}

// Parallel processing
async function processAllItems(items) {
  await Promise.all(items.map(item => processItem(item)));
}
```

### Key Points

- `async` functions always return a Promise — even if you return a plain value
- `await` pauses the async function but does NOT block the main thread
- Forgetting `await` is a common bug — the promise is returned, not the value
- Use `Promise.all` for parallel independent operations
- Use sequential `await` only when operations depend on each other

### Common Mistakes

```javascript
// Mistake 1 — forgetting await
async function getUser() {
  const user = fetchUser(1); // forgot await — user is a Promise, not the data!
  console.log(user.name); // undefined
}

// Mistake 2 — error handling in async functions
async function bad() {
  const data = await fetch("invalid-url"); // throws — unhandled!
}
// Fix: wrap in try/catch or chain .catch()

// Mistake 3 — sequential when parallel is possible
const a = await expensiveOp1(); // 1 second
const b = await expensiveOp2(); // another 1 second — 2 seconds total
// Better:
const [a2, b2] = await Promise.all([expensiveOp1(), expensiveOp2()]); // 1 second
```

---

## 18. Event Loop

### Explanation

JavaScript is **single-threaded** — it has one call stack. Yet it handles async operations gracefully. The **event loop** is the mechanism that makes this possible.

**Components:**
- **Call Stack** — where synchronous code executes (LIFO)
- **Web APIs** — provided by browser/Node (setTimeout, fetch, etc.) — run outside the JS engine
- **Callback Queue (Macrotask Queue)** — holds callbacks from Web APIs (setTimeout, setInterval)
- **Microtask Queue** — holds Promise callbacks (`.then`, `catch`) and `queueMicrotask`

**Order of execution:**
1. Execute all synchronous code (call stack empties)
2. Execute ALL microtasks (until queue is empty)
3. Execute ONE macrotask from the callback queue
4. Execute ALL microtasks again
5. Repeat

### Examples

```javascript
// Example 1 — demonstrating execution order
console.log("1 - sync start");

setTimeout(() => console.log("4 - macrotask (setTimeout)"), 0);

Promise.resolve()
  .then(() => console.log("3 - microtask (Promise)"));

console.log("2 - sync end");

// Output order:
// 1 - sync start
// 2 - sync end
// 3 - microtask (Promise) ← microtasks run before macrotasks
// 4 - macrotask (setTimeout)

// Example 2 — multiple microtasks
console.log("sync 1");
Promise.resolve().then(() => {
  console.log("microtask 1");
  Promise.resolve().then(() => console.log("microtask 2")); // added during microtask
});
setTimeout(() => console.log("macrotask"), 0);
console.log("sync 2");

// Output:
// sync 1
// sync 2
// microtask 1
// microtask 2  ← added microtask runs before macrotask
// macrotask

// Example 3 — why setTimeout(fn, 0) doesn't mean "immediately"
console.log("start");
setTimeout(() => console.log("timeout"), 0); // queued as macrotask
console.log("end");
// start → end → timeout (not "immediately"!)
```

### Key Points

- **Microtasks** (Promises) always execute before macrotasks (setTimeout)
- `setTimeout(fn, 0)` does NOT mean synchronous — it's queued as a macrotask
- Blocking the call stack (heavy synchronous computation) freezes the UI
- `async/await` uses the microtask queue under the hood

---

## 19. Prototypes & Prototype Chain

### Explanation

Every JavaScript object has an internal link to another object called its **prototype**. When you access a property, JavaScript looks at the object first, then walks up the **prototype chain** until it finds it or reaches `null`.

### Examples

```javascript
// Example 1 — prototype chain
const animal = {
  breathe() { return `${this.name} breathes`; }
};

const dog = Object.create(animal); // dog's prototype is animal
dog.name = "Rex";
dog.bark = function() { return "Woof!"; };

dog.bark();    // "Woof!" — own method
dog.breathe(); // "Rex breathes" — inherited from animal prototype

// Prototype chain: dog → animal → Object.prototype → null

// Example 2 — constructor functions and prototype
function Person(name) {
  this.name = name;
}

// Add to prototype — shared by all instances
Person.prototype.greet = function() {
  return `Hi, I'm ${this.name}`;
};

const alice = new Person("Alice");
const bob = new Person("Bob");

alice.greet(); // "Hi, I'm Alice"
bob.greet();   // "Hi, I'm Bob"
// greet is not duplicated for each instance — shared via prototype

// Example 3 — class syntax is syntax sugar over prototypes
class Animal {
  constructor(name) {
    this.name = name;
  }
  breathe() { return `${this.name} breathes`; }
}

class Dog extends Animal {
  bark() { return "Woof!"; }
}

const rex = new Dog("Rex");
rex.bark();    // "Woof!"
rex.breathe(); // "Rex breathes" — from Animal.prototype

// Prototype chain: rex → Dog.prototype → Animal.prototype → Object.prototype → null

// Example 4 — checking prototype
Object.getPrototypeOf(rex) === Dog.prototype; // true
rex instanceof Dog;    // true
rex instanceof Animal; // true
```

### Key Points

- `__proto__` is the informal way to access prototype (don't use in production — use `Object.getPrototypeOf`)
- Properties on the prototype are **shared** — modifying them affects all instances
- Properties on the instance **shadow** prototype properties
- `hasOwnProperty` distinguishes own from inherited properties

---

## 20. The `this` Keyword

### Explanation

`this` refers to the **execution context** — the object that a function is called on. Its value is determined at **call time**, not definition time (except arrow functions).

### Examples

```javascript
// Example 1 — global context
console.log(this); // browser: window, Node: {}

// Example 2 — method context
const obj = {
  name: "Alice",
  greet() {
    console.log(this.name); // "Alice" — this is the obj
  }
};
obj.greet(); // "Alice"

// But: detaching the method loses context!
const fn = obj.greet;
fn(); // undefined (strict mode) or global (sloppy mode)

// Example 3 — explicit binding
function greet(greeting) {
  return `${greeting}, ${this.name}`;
}

const person = { name: "Bob" };

greet.call(person, "Hello");    // "Hello, Bob" — immediately invokes
greet.apply(person, ["Hi"]);    // "Hi, Bob" — same but args as array
const boundGreet = greet.bind(person); // creates new function with fixed this
boundGreet("Hey");              // "Hey, Bob"

// Example 4 — arrow functions (no own this)
const counter = {
  count: 0,
  start() {
    setInterval(() => {
      this.count++; // 'this' is counter — arrow inherits from start()
      console.log(this.count);
    }, 1000);
  }
};

// If setInterval used a regular function, 'this' would be window/global

// Example 5 — class context
class Timer {
  constructor() {
    this.seconds = 0;
  }

  start() {
    setInterval(() => {
      this.seconds++; // arrow — 'this' is the Timer instance
    }, 1000);
  }
}
```

### Key Points

- **Method call** → `this` is the object before the dot
- **Regular function call** → `this` is `undefined` (strict) or global (sloppy)
- **Arrow function** → `this` is lexically inherited from enclosing scope
- **`new` call** → `this` is the newly created object
- **`call`/`apply`/`bind`** → explicitly set `this`

---

## 21. Destructuring

### Explanation

Destructuring is syntax to **unpack values** from arrays or properties from objects into variables.

### Examples

```javascript
// === ARRAY DESTRUCTURING ===
const [a, b, c] = [1, 2, 3];

// Skip elements
const [, second, , fourth] = [1, 2, 3, 4]; // second=2, fourth=4

// Default values
const [x = 0, y = 0] = [1]; // x=1, y=0

// Rest
const [first, ...rest] = [1, 2, 3, 4]; // first=1, rest=[2,3,4]

// Swap
let p = 1, q = 2;
[p, q] = [q, p]; // p=2, q=1

// Nested
const [[r, s], [t, u]] = [[1, 2], [3, 4]];

// === OBJECT DESTRUCTURING ===
const { name, age } = { name: "Alice", age: 30, city: "Paris" };

// Rename
const { name: fullName } = { name: "Alice" }; // fullName = "Alice"

// Default
const { role = "user" } = { name: "Alice" }; // role = "user"

// Nested
const { address: { city, zip } } = { address: { city: "Paris", zip: "75001" } };

// Rename + default nested
const { address: { country = "France" } = {} } = {};

// === FUNCTION PARAMETER DESTRUCTURING ===
function displayUser({ name, age = 0, role = "user" }) {
  console.log(`${name} (${role}), age ${age}`);
}

displayUser({ name: "Alice", age: 30 });         // Alice (user), age 30
displayUser({ name: "Bob", role: "admin" });     // Bob (admin), age 0

// Destructuring in loops
const users = [{ name: "Alice", age: 30 }, { name: "Bob", age: 25 }];
for (const { name, age } of users) {
  console.log(`${name}: ${age}`);
}
```

---

## 22. Spread & Rest

### Explanation

**Spread** (`...`) expands an iterable into individual elements.
**Rest** (`...`) collects multiple elements into an array.

Same syntax — different context.

### Examples

```javascript
// === SPREAD ===

// Spread in arrays
const arr1 = [1, 2, 3];
const arr2 = [4, 5, 6];
const combined = [...arr1, 0, ...arr2]; // [1,2,3,0,4,5,6]

// Spread in objects
const obj1 = { a: 1, b: 2 };
const obj2 = { c: 3 };
const merged = { ...obj1, ...obj2, d: 4 }; // {a:1,b:2,c:3,d:4}

// Spread for function args
function sum(a, b, c) { return a + b + c; }
const nums = [1, 2, 3];
sum(...nums); // 6

// Clone
const arrClone = [...arr1]; // shallow clone
const objClone = { ...obj1 };

// String to array
[..."hello"]; // ['h','e','l','l','o']

// === REST ===

// Rest in function params
function sum2(first, second, ...rest) {
  return first + second + rest.reduce((a, b) => a + b, 0);
}
sum2(1, 2, 3, 4, 5); // 15

// Rest in destructuring
const [head, ...tail] = [1, 2, 3, 4];
// head=1, tail=[2,3,4]

const { a, ...remaining } = { a: 1, b: 2, c: 3 };
// a=1, remaining={b:2, c:3}
```

---

## 23. Modules

### Explanation

Modules allow splitting code into separate files with explicit imports and exports. This enables encapsulation and reusability.

### Examples

```javascript
// === NAMED EXPORTS ===
// math.js
export const PI = 3.14159;
export function add(a, b) { return a + b; }
export function subtract(a, b) { return a - b; }

// main.js
import { add, subtract, PI } from "./math.js";
import { add as sum } from "./math.js"; // alias

// === DEFAULT EXPORT ===
// user.js
export default class User {
  constructor(name) { this.name = name; }
}

// main.js
import User from "./user.js"; // name doesn't have to match
import MyUser from "./user.js"; // any name works for default

// === IMPORT ALL ===
import * as MathUtils from "./math.js";
MathUtils.add(1, 2);
MathUtils.PI;

// === RE-EXPORTING ===
// index.js (barrel file)
export { add, subtract } from "./math.js";
export { default as User } from "./user.js";

// === DYNAMIC IMPORTS ===
async function loadModule() {
  const { add } = await import("./math.js");
  return add(1, 2);
}
```

### Key Points

- Modules are **file-scoped** — variables don't leak to global scope
- Modules are **strict mode by default**
- Named exports must use the exact name when importing (or alias with `as`)
- Only one default export per module
- Dynamic imports (`import()`) are useful for code splitting and lazy loading

---

# Part 2 — JavaScript Needed for DSA

> A structured mapping of JavaScript features to their relevance in Data Structures & Algorithms. Use this as your reference before solving DSA problems.

---

## Variables

### 1. Explanation
`let` and `const` for block-scoped variables. Use `const` for values that don't change, `let` for pointers, counters, and accumulators.

### 2. Example

```javascript
let left = 0, right = arr.length - 1; // two-pointer setup
const result = [];                     // accumulator
let maxSum = -Infinity;               // tracking max
```

### 3. Is this important for DSA?
**YES**

### 4. How it is used in DSA
- Pointers (`left`, `right`, `slow`, `fast`, `mid`)
- Accumulators (`sum`, `count`, `maxLen`)
- State tracking (`visited`, `found`, `memo`)
- `const` for read-only references (result arrays, maps, sets)

### 5. Extra Notes
- Never use `var` — its function scoping causes hard-to-debug bugs in loops
- Name variables meaningfully: `windowStart` > `i`, `currentNode` > `x`

---

## Loops

### 1. Explanation
Iteration constructs: `for`, `while`, `for...of`, and `for...in`.

### 2. Example

```javascript
// Classic for — most common in DSA
for (let i = 0; i < nums.length; i++) { }

// Two pointers
let left = 0, right = nums.length - 1;
while (left < right) { left++; right--; }

// for...of — clean iteration over arrays
for (const num of nums) { }

// Nested — matrix traversal
for (let r = 0; r < grid.length; r++) {
  for (let c = 0; c < grid[0].length; c++) { }
}
```

### 3. Is this important for DSA?
**YES**

### 4. How it is used in DSA
- **Linear scan** → `for` / `for...of`
- **Two pointers** → `while (left < right)`
- **Sliding window** → `for` with window management
- **Matrix traversal** → nested `for`
- **BFS** → `while (queue.length > 0)`
- **Binary search** → `while (left <= right)`

### 5. Extra Notes
- Prefer `while` for pointer-based patterns (cleaner condition expression)
- `for...in` is rarely useful in DSA — use `for...of` or indexed `for`
- Watch out for off-by-one errors — clarify if your loop condition uses `<` or `<=`

---

## Arrays

### 1. Explanation
Ordered, indexed, mutable collections. The most fundamental DSA structure in JS.

### 2. Example

```javascript
// Sliding window
function maxSumSubarray(arr, k) {
  let sum = arr.slice(0, k).reduce((a, b) => a + b, 0);
  let max = sum;
  for (let i = k; i < arr.length; i++) {
    sum += arr[i] - arr[i - k];
    max = Math.max(max, sum);
  }
  return max;
}

// Prefix sum
function buildPrefix(arr) {
  const prefix = [0];
  for (const n of arr) {
    prefix.push(prefix[prefix.length - 1] + n);
  }
  return prefix;
}

// Two pointers
function twoSum(sorted, target) {
  let l = 0, r = sorted.length - 1;
  while (l < r) {
    const sum = sorted[l] + sorted[r];
    if (sum === target) return [l, r];
    else if (sum < target) l++;
    else r--;
  }
  return [];
}
```

### 3. Is this important for DSA?
**YES**

### 4. How it is used in DSA
| Pattern | Key Array Operations |
|---------|---------------------|
| Two pointers | Index access `arr[i]`, `arr[j]` |
| Sliding window | Slice or index arithmetic |
| Prefix sum | `push`, index access |
| Sorting | `.sort((a,b) => a-b)` |
| Stack | `push`, `pop` |
| Queue | `push`, `shift` (or deque with index) |
| Binary search | Index access, `length` |
| Kadane's algorithm | Scan with accumulator |

### 5. Extra Notes
- `shift()` is O(n) — for queue-heavy problems, use a pointer instead of shifting
- `sort()` without comparator is wrong for numbers — always pass `(a,b) => a-b`
- Know these array tricks by heart:
  - Remove duplicates: `[...new Set(arr)]`
  - Flatten: `arr.flat(Infinity)`
  - Fill initialized array: `new Array(n).fill(0)`
  - 2D matrix: `Array.from({length:n}, () => new Array(m).fill(0))`
  - Last element: `arr[arr.length - 1]` or `arr.at(-1)`

---

## Strings

### 1. Explanation
Immutable sequences of characters. Frequently manipulated in DSA for pattern matching, parsing, and encoding.

### 2. Example

```javascript
// Anagram check
function isAnagram(s, t) {
  if (s.length !== t.length) return false;
  const freq = {};
  for (const ch of s) freq[ch] = (freq[ch] || 0) + 1;
  for (const ch of t) {
    if (!freq[ch]) return false;
    freq[ch]--;
  }
  return true;
}

// Reverse string
const reversed = str.split("").reverse().join("");

// Sliding window — longest substring without repeating chars
function lengthOfLongestSubstring(s) {
  const seen = new Set();
  let left = 0, max = 0;
  for (let right = 0; right < s.length; right++) {
    while (seen.has(s[right])) { seen.delete(s[left++]); }
    seen.add(s[right]);
    max = Math.max(max, right - left + 1);
  }
  return max;
}
```

### 3. Is this important for DSA?
**YES**

### 4. How it is used in DSA
- Character frequency counting (use object or Map)
- Substring problems (sliding window)
- Palindrome checking (two pointers)
- Pattern matching (sliding window, KMP)
- Parsing expressions and tokens
- Encoding/decoding

### 5. Extra Notes
- Strings are immutable — don't build strings by concatenation in a loop (O(n²)) → use array + `join`
- `charCodeAt(i)` gives the ASCII code — useful for letter index: `ch.charCodeAt(0) - 'a'.charCodeAt(0)` gives 0-25
- `String.fromCharCode(code)` converts back
- Template literals work fine for small DSA outputs

---

## Objects

### 1. Explanation
Key-value stores used as hash maps, frequency counters, adjacency lists, and memos.

### 2. Example

```javascript
// Frequency counter pattern
function topKFrequent(nums, k) {
  const freq = {};
  for (const n of nums) freq[n] = (freq[n] || 0) + 1;

  return Object.entries(freq)
    .sort(([,a], [,b]) => b - a)
    .slice(0, k)
    .map(([key]) => Number(key));
}

// Graph as adjacency list
const graph = {};
function addEdge(u, v) {
  if (!graph[u]) graph[u] = [];
  if (!graph[v]) graph[v] = [];
  graph[u].push(v);
  graph[v].push(u);
}

// Memoization cache
const memo = {};
function dp(i) {
  if (i in memo) return memo[i];
  // ...compute
  memo[i] = result;
  return memo[i];
}
```

### 3. Is this important for DSA?
**YES**

### 4. How it is used in DSA
- **Frequency maps** → count occurrences of elements
- **Memoization** → cache recursive results
- **Adjacency list** → graph representation
- **Parent maps** → BFS/DFS backtracking
- **Lookup tables** → O(1) access instead of O(n) search

### 5. Extra Notes
- Object key access is O(1) average — treat it as a hash map
- Keys are always strings (or Symbols) — numbers are coerced: `obj[1]` → key is `"1"`
- For non-string keys, use `Map`
- `Object.keys()`, `Object.values()`, `Object.entries()` are essential for traversal

---

## Map

### 1. Explanation
`Map` is a key-value store where ANY type can be a key — unlike objects which coerce keys to strings.

### 2. Example

```javascript
// Two sum with Map
function twoSum(nums, target) {
  const seen = new Map(); // value → index
  for (let i = 0; i < nums.length; i++) {
    const complement = target - nums[i];
    if (seen.has(complement)) return [seen.get(complement), i];
    seen.set(nums[i], i);
  }
  return [];
}

// Character frequency with Map
function charFreq(s) {
  const freq = new Map();
  for (const ch of s) {
    freq.set(ch, (freq.get(ch) || 0) + 1);
  }
  return freq;
}

// Cache in graph problems
const dist = new Map();
dist.set(startNode, 0);
```

### 3. Is this important for DSA?
**YES**

### 4. How it is used in DSA
- **Two Sum pattern** — map value → index for O(1) lookup
- **Frequency counters** — cleaner than plain objects when keys may be non-strings
- **Cache/memoization** — especially when key is complex (array/object)
- **Graph distances** — node → distance mapping
- **Window state** — character counts in sliding window

### 5. Extra Notes
- `map.get(key) || 0` → safe pattern for incrementing counts
- `map.size` is O(1) — instant size check
- Prefer `Map` over plain object when:
  - Keys might be numbers (objects coerce to string)
  - You need to iterate in insertion order reliably
  - You need the `.size` property

---

## Set

### 1. Explanation
A collection of unique values with O(1) lookup, insertion, and deletion.

### 2. Example

```javascript
// Detect cycle in linked list (Floyd's is better, but Set approach is clear)
function hasCycle(head) {
  const seen = new Set();
  let current = head;
  while (current) {
    if (seen.has(current)) return true;
    seen.add(current);
    current = current.next;
  }
  return false;
}

// Longest consecutive sequence
function longestConsecutive(nums) {
  const numSet = new Set(nums);
  let longest = 0;
  for (const num of numSet) {
    if (!numSet.has(num - 1)) { // start of a sequence
      let length = 1;
      while (numSet.has(num + length)) length++;
      longest = Math.max(longest, length);
    }
  }
  return longest;
}

// Remove duplicates
const unique = [...new Set(arr)];

// Visited tracking (BFS/DFS)
const visited = new Set();
visited.add(node);
if (!visited.has(neighbor)) { ... }
```

### 3. Is this important for DSA?
**YES**

### 4. How it is used in DSA
- **O(1) lookup** — checking if element was seen (vs O(n) `includes`)
- **Visited tracking** — BFS/DFS graph traversal
- **Duplicate removal**
- **Contains checks** — interval problems, anagram checks
- **Consecutive sequence problems**

### 5. Extra Notes
- Set operations in DSA: union (`new Set([...a,...b])`), intersection (`a.filter(x => b.has(x))`), difference
- Set is significantly faster than `.includes()` on arrays for lookup — O(1) vs O(n)
- Remember: Sets use same-value-zero equality — `NaN` is handled correctly (`NaN === NaN` is true in Set)

---

## Functions

### 1. Explanation
Reusable blocks of logic. In DSA, functions enable recursion, clean separation of logic, and passing algorithms as parameters.

### 2. Example

```javascript
// Helper functions for cleaner DSA code
function swap(arr, i, j) {
  [arr[i], arr[j]] = [arr[j], arr[i]];
}

function isValid(r, c, rows, cols) {
  return r >= 0 && r < rows && c >= 0 && c < cols;
}

// Higher-order function for comparator
const sortByFrequency = (freq) => (a, b) => freq[b] - freq[a];
arr.sort(sortByFrequency(freqMap));

// DFS as function
function dfs(node, visited, graph) {
  visited.add(node);
  for (const neighbor of graph[node] || []) {
    if (!visited.has(neighbor)) dfs(neighbor, visited, graph);
  }
}
```

### 3. Is this important for DSA?
**YES**

### 4. How it is used in DSA
- **Recursion** — DFS, tree traversal, backtracking, divide-and-conquer
- **Helper functions** — swap, isValid, getNeighbors
- **Comparators** — custom sort functions
- **Memoization wrappers** — wrapping recursive functions

### 5. Extra Notes
- Keep DSA functions **pure** when possible — easier to reason about and test
- Name helper functions clearly: `isValidCell`, `getNeighbors`, `mergeIntervals`
- Default parameters are useful: `function dfs(node, memo = new Map())`

---

## Recursion

### 1. Explanation
A function that calls itself with a simpler subproblem. Essential for tree/graph traversal, backtracking, and divide-and-conquer.

### 2. Example

```javascript
// Binary tree inorder traversal
function inorder(root) {
  if (!root) return [];
  return [...inorder(root.left), root.val, ...inorder(root.right)];
}

// Backtracking — generate subsets
function subsets(nums) {
  const result = [];
  function backtrack(start, current) {
    result.push([...current]);
    for (let i = start; i < nums.length; i++) {
      current.push(nums[i]);
      backtrack(i + 1, current);
      current.pop(); // undo
    }
  }
  backtrack(0, []);
  return result;
}

// Merge sort
function mergeSort(arr) {
  if (arr.length <= 1) return arr;
  const mid = Math.floor(arr.length / 2);
  const left = mergeSort(arr.slice(0, mid));
  const right = mergeSort(arr.slice(mid));
  return merge(left, right);
}
```

### 3. Is this important for DSA?
**YES**

### 4. How it is used in DSA
| Algorithm | Recursive Pattern |
|-----------|------------------|
| DFS | Visit node, recurse on neighbors |
| Tree traversal | Inorder, preorder, postorder |
| Backtracking | Choose → explore → unchoose |
| Divide & conquer | Split → solve halves → merge |
| Dynamic programming | Recursive + memoization |
| Binary search | Recurse on half |

### 5. Extra Notes
- Always identify: base case, recursive case, and that it moves toward base case
- Iterative DFS with explicit stack is more memory-efficient than recursion for large inputs
- JS call stack is ~10,000–15,000 frames — deep recursion on large inputs may need iterative conversion
- Memoization template: `const memo = {}; if (key in memo) return memo[key];`

---

## ES6 Features

### 1. Explanation
Modern JavaScript syntax that makes DSA code cleaner and more concise.

### 2. Example

```javascript
// Destructuring in DSA
const [left, right] = [0, nums.length - 1];
const { val, next } = node;

// Spread for copying (avoid mutation)
const newPath = [...currentPath, node.val];

// Arrow functions for concise callbacks
nums.sort((a, b) => a - b);
const evens = nums.filter(n => n % 2 === 0);

// Template literals for debugging
console.log(`left=${left}, right=${right}, mid=${mid}`);

// Default params
function dfs(node, depth = 0, memo = new Map()) { ... }

// Optional chaining for null-safe tree traversal
const leftVal = node?.left?.val ?? 0;
```

### 3. Is this important for DSA?
**PARTIAL**

### 4. How it is used in DSA
- **Arrow functions** → clean comparators and callbacks — YES, use constantly
- **Destructuring** → clean variable unpacking — YES, very useful
- **Spread** → cloning arrays in backtracking — YES, important for immutability
- **Default params** → cleaner recursive signatures — YES
- **Optional chaining** → safe tree/graph traversal — PARTIAL
- **Classes** → implementing custom data structures (Node, LinkedList, Stack) — PARTIAL
- **Template literals** → debugging only — NO impact on algorithm

### 5. Extra Notes
- Don't over-engineer DSA solutions with ES6 — clarity > cleverness
- Spread for array copy (`[...arr]`) is cleaner than `arr.slice()`
- Arrow functions in `.sort()` comparators are essential

---

## Async / Promises

### 1. Explanation
Mechanisms for handling asynchronous operations — `Promise`, `.then()`, `async/await`.

### 2. Example

```javascript
async function fetchData(url) {
  const response = await fetch(url);
  return response.json();
}
```

### 3. Is this important for DSA?
**NO**

### 4. Why it is less relevant
DSA problems are purely algorithmic — they deal with in-memory data structures and synchronous logic. There are no network requests, file I/O, or timed operations in standard DSA problems (LeetCode, HackerRank, etc.).

### 5. Extra Notes
- Async/Await matters enormously in real-world software engineering and system design
- Some advanced DSA problems simulate async behavior with callbacks, but the underlying algorithm is still synchronous
- For competitive programming, async is irrelevant — all solutions are synchronous

---

## Additional DSA-Critical JavaScript Topics

---

## Math & Number Utilities

### 1. Explanation
Built-in Math functions frequently needed in DSA.

### 2. Example

```javascript
Math.max(3, 1, 4, 1, 5);    // 5
Math.min(3, 1, 4, 1, 5);    // 1
Math.abs(-5);                // 5
Math.floor(3.7);             // 3
Math.ceil(3.2);              // 4
Math.round(3.5);             // 4
Math.sqrt(16);               // 4
Math.pow(2, 10);             // 1024
2 ** 10;                     // 1024 — ES2016 exponentiation

// Infinity
let max = -Infinity;
let min = Infinity;

// Integer check
Number.isInteger(4);     // true
Number.isInteger(4.5);   // false

// Max safe integer
Number.MAX_SAFE_INTEGER; // 9007199254740991

// Bitwise tricks (often appear in DSA)
n >> 1;           // Math.floor(n / 2) — integer division
n << 1;           // n * 2
n & 1;            // 0 if even, 1 if odd
n & (n - 1);      // clear lowest set bit
n & (-n);         // isolate lowest set bit (lowest set bit trick)
Math.floor((l + r) / 2);  // can overflow in other languages
const mid = l + Math.floor((r - l) / 2); // safer mid calculation
```

### 3. Is this important for DSA?
**YES**

### 4. How it is used in DSA
- `Math.max` / `Math.min` → tracking extremes
- `Math.floor` → binary search mid, integer division
- `Infinity` / `-Infinity` → initializing min/max values
- Bitwise operators → optimization, bit manipulation problems
- `Math.abs` → distance calculations, difference comparisons

---

## Stack & Queue Implementation

### 1. Explanation
JavaScript doesn't have built-in Stack/Queue classes — you implement them using arrays.

### 2. Example

```javascript
// Stack — LIFO (Last In, First Out)
const stack = [];
stack.push(1);         // add to top — O(1)
stack.push(2);
stack.push(3);
stack.pop();           // remove from top — O(1) → returns 3
stack[stack.length - 1]; // peek — O(1)

// Stack problems: balanced parentheses, monotonic stack, DFS
function isValid(s) {
  const stack = [];
  const pairs = { ")": "(", "}": "{", "]": "[" };
  for (const ch of s) {
    if ("({[".includes(ch)) stack.push(ch);
    else if (stack.pop() !== pairs[ch]) return false;
  }
  return stack.length === 0;
}

// Queue — FIFO (First In, First Out)
const queue = [];
queue.push(1);    // enqueue — O(1)
queue.push(2);
queue.shift();    // dequeue — O(n) WARNING!

// Better queue: use index as head pointer
function bfs(start, graph) {
  const queue = [start];
  const visited = new Set([start]);
  let head = 0;
  while (head < queue.length) {
    const node = queue[head++]; // O(1) dequeue via pointer
    for (const neighbor of graph[node] || []) {
      if (!visited.has(neighbor)) {
        visited.add(neighbor);
        queue.push(neighbor);
      }
    }
  }
}
```

### 3. Is this important for DSA?
**YES**

### 4. How it is used in DSA
- **Stack** → DFS, parenthesis matching, monotonic stack, undo operations
- **Queue** → BFS, level-order traversal, sliding window maximum

### 5. Extra Notes
- `array.shift()` is O(n) — in performance-sensitive BFS, use a head pointer instead
- For very performance-critical queue operations, implement a doubly-linked-list queue
- Monotonic stack (maintain increasing/decreasing order) solves Next Greater Element problems

---

## Sorting Techniques

### 1. Explanation
JavaScript's built-in sort and custom comparators.

### 2. Example

```javascript
// Ascending
arr.sort((a, b) => a - b);

// Descending
arr.sort((a, b) => b - a);

// Sort strings
arr.sort((a, b) => a.localeCompare(b));

// Sort by property
intervals.sort((a, b) => a[0] - b[0]); // sort by start time

// Sort by multiple criteria
people.sort((a, b) => {
  if (a.age !== b.age) return a.age - b.age;
  return a.name.localeCompare(b.name);
});

// Stable sort — JS guarantees stable sort since ES2019
// Elements with equal keys maintain their original order
```

### 3. Is this important for DSA?
**YES**

### 4. How it is used in DSA
- Interval problems — sort by start
- Greedy algorithms — sort input to make local optimal choices
- Two-pointer on sorted arrays
- Counting inversions (merge sort)
- Topological sort (conceptual — use BFS/DFS for implementation)

### 5. Extra Notes
- JS sort is O(n log n) — typically TimSort (hybrid merge + insertion sort)
- Always provide comparator for numeric sort — default is lexicographic
- For DSA, sorting is often the first step in a greedy or two-pointer solution

---

## Hash Map Patterns (DSA Focus)

### 1. Explanation
The most common patterns using objects and Maps in DSA problems.

### 2. Example

```javascript
// Pattern 1 — Frequency Counter
function areAnagrams(s1, s2) {
  if (s1.length !== s2.length) return false;
  const freq = {};
  for (const ch of s1) freq[ch] = (freq[ch] || 0) + 1;
  for (const ch of s2) {
    if (!freq[ch]) return false;
    freq[ch]--;
  }
  return true;
}

// Pattern 2 — Two Sum (complement lookup)
function twoSum(nums, target) {
  const seen = new Map();
  for (let i = 0; i < nums.length; i++) {
    const complement = target - nums[i];
    if (seen.has(complement)) return [seen.get(complement), i];
    seen.set(nums[i], i);
  }
}

// Pattern 3 — Group by key
function groupAnagrams(strs) {
  const map = new Map();
  for (const s of strs) {
    const key = s.split("").sort().join("");
    if (!map.has(key)) map.set(key, []);
    map.get(key).push(s);
  }
  return [...map.values()];
}

// Pattern 4 — Prefix sum with hash map
function subarraySum(nums, k) {
  const prefixCount = new Map([[0, 1]]);
  let count = 0, sum = 0;
  for (const n of nums) {
    sum += n;
    count += prefixCount.get(sum - k) || 0;
    prefixCount.set(sum, (prefixCount.get(sum) || 0) + 1);
  }
  return count;
}
```

### 3. Is this important for DSA?
**YES**

### 4. How it is used in DSA
- Reduces O(n²) brute force to O(n) in many problems
- Core to sliding window, two sum, anagram, and grouping problems

---

## Linked List Node (Custom Data Structure)

### 2. Example

```javascript
// Node class
class ListNode {
  constructor(val = 0, next = null) {
    this.val = val;
    this.next = next;
  }
}

// Build list from array
function arrayToList(arr) {
  let dummy = new ListNode(0);
  let curr = dummy;
  for (const val of arr) {
    curr.next = new ListNode(val);
    curr = curr.next;
  }
  return dummy.next;
}

// Reverse linked list
function reverseList(head) {
  let prev = null, curr = head;
  while (curr) {
    const next = curr.next;
    curr.next = prev;
    prev = curr;
    curr = next;
  }
  return prev;
}

// Fast & slow pointer — detect cycle
function hasCycle(head) {
  let slow = head, fast = head;
  while (fast && fast.next) {
    slow = slow.next;
    fast = fast.next.next;
    if (slow === fast) return true;
  }
  return false;
}
```

### 3. Is this important for DSA?
**YES**

---

## Tree Node (Custom Data Structure)

### 2. Example

```javascript
class TreeNode {
  constructor(val = 0, left = null, right = null) {
    this.val = val;
    this.left = left;
    this.right = right;
  }
}

// BFS level order traversal
function levelOrder(root) {
  if (!root) return [];
  const result = [], queue = [root];
  while (queue.length) {
    const levelSize = queue.length;
    const level = [];
    for (let i = 0; i < levelSize; i++) {
      const node = queue.shift();
      level.push(node.val);
      if (node.left) queue.push(node.left);
      if (node.right) queue.push(node.right);
    }
    result.push(level);
  }
  return result;
}

// DFS — max depth
function maxDepth(root) {
  if (!root) return 0;
  return 1 + Math.max(maxDepth(root.left), maxDepth(root.right));
}
```

### 3. Is this important for DSA?
**YES**

---

## Quick DSA Reference — JavaScript Cheat Sheet

```
// ─── ARRAY INITIALIZATION ───────────────────────────────────────────────
new Array(n).fill(0)                    // [0,0,...,0]
Array.from({length: n}, (_, i) => i)   // [0,1,...,n-1]
Array.from({length:n}, () => [])        // n empty arrays

// ─── COMMON MATH ────────────────────────────────────────────────────────
Math.max(...arr)                        // max of array
Math.min(...arr)                        // min of array
Math.floor(n / 2)                       // integer division
n >> 1                                  // same, bitwise
n & 1                                   // 0 if even, 1 if odd
l + Math.floor((r - l) / 2)            // safe mid for binary search

// ─── STRING TRICKS ───────────────────────────────────────────────────────
str.split("").reverse().join("")        // reverse string
str.charCodeAt(i) - 'a'.charCodeAt(0)  // letter → 0-25 index
String.fromCharCode(code)               // code → character
str.toLowerCase().replace(/[^a-z0-9]/g,'') // clean for palindrome

// ─── SORTING ────────────────────────────────────────────────────────────
arr.sort((a, b) => a - b)              // ascending numbers
arr.sort((a, b) => b - a)              // descending numbers

// ─── FREQUENCY COUNT ─────────────────────────────────────────────────────
const freq = {};
for (const x of arr) freq[x] = (freq[x] || 0) + 1;

// ─── MAP FREQUENCY ───────────────────────────────────────────────────────
const map = new Map();
map.set(key, (map.get(key) || 0) + 1);

// ─── DEDUPLICATION ───────────────────────────────────────────────────────
[...new Set(arr)]

// ─── STACK (LIFO) ────────────────────────────────────────────────────────
stack.push(x)           // add top
stack.pop()             // remove top — O(1)
stack[stack.length-1]   // peek

// ─── QUEUE (FIFO — pointer method) ───────────────────────────────────────
const queue = [start];
let head = 0;
const node = queue[head++]; // O(1) dequeue

// ─── TWO POINTERS ────────────────────────────────────────────────────────
let l = 0, r = arr.length - 1;
while (l < r) { l++; r--; }

// ─── BINARY SEARCH ───────────────────────────────────────────────────────
let lo = 0, hi = arr.length - 1;
while (lo <= hi) {
  const mid = lo + ((hi - lo) >> 1);
  if (arr[mid] === target) return mid;
  arr[mid] < target ? lo = mid + 1 : hi = mid - 1;
}

// ─── BFS TEMPLATE ────────────────────────────────────────────────────────
const queue = [start], visited = new Set([start]);
let head = 0;
while (head < queue.length) {
  const curr = queue[head++];
  for (const next of getNeighbors(curr)) {
    if (!visited.has(next)) { visited.add(next); queue.push(next); }
  }
}

// ─── DFS TEMPLATE (recursive) ────────────────────────────────────────────
function dfs(node, visited) {
  if (!node || visited.has(node)) return;
  visited.add(node);
  for (const next of getNeighbors(node)) dfs(next, visited);
}

// ─── BACKTRACKING TEMPLATE ───────────────────────────────────────────────
function backtrack(start, current) {
  if (/* done */) { result.push([...current]); return; }
  for (let i = start; i < choices.length; i++) {
    current.push(choices[i]);
    backtrack(i + 1, current);
    current.pop();
  }
}

// ─── MEMOIZATION TEMPLATE ────────────────────────────────────────────────
const memo = new Map();
function dp(state) {
  if (memo.has(state)) return memo.get(state);
  // base cases
  const result = /* recursive computation */;
  memo.set(state, result);
  return result;
}
```

---

*End of JavaScript Complete Guide + DSA Mapping*
