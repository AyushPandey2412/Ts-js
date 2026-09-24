# Module 06 — Complete JavaScript Arrays & Collections
## Beginner → Advanced → Senior

> **Core Invariant**: In JavaScript, an Array is not a contiguous C-style memory block by specification—it is an exotic Object whose keys are non-negative numeric strings and whose `length` property automatically synchronizes with the highest numeric index. Modern engines (like V8) optimize dense, monomorphic arrays into blazing fast contiguous memory vectors behind the scenes, but semantically, JavaScript arrays are dynamic, heterogeneous, reference-typed collections.

---

## 00. How to Use This Module & Roadmap

Welcome to the definitive JavaScript Arrays, Collections, and Data Processing Masterclass. This module is engineered to take you from basic bracket indexing to building high-performance data structures, mastering algorithmic patterns, understanding low-level engine representations, and architecting immutable frontend and backend pipelines.

### Learning Roadmap
```text
Beginner
   ↓
Level 01: Array Fundamentals (Exotic Objects, Memory, Literals, Length, Sparse vs Dense)
   ↓
Level 02: Array Access, Modern .at(), Overwriting, and the Pitfall of 'delete'
   ↓
Level 03: Stack & Queue Operations (push, pop, shift, unshift, Amortized O(1) vs O(n))
   ↓
Level 04: Slicing vs Splicing (Deep Dive: Comparison Matrix, Negative Indices, 4 Tiers of Examples)
   ↓
Level 05: Searching & Inspection (indexOf, includes, find, findLast, some, every, NaN Quirks)
   ↓
Level 06: Iteration Methods Compared (for, for..of, forEach, map, Async Traps, Performance)
   ↓
Level 07: Transformations (map, filter, flat, flatMap, Chaining vs Single-Pass)
   ↓
Level 08: Mastering Reduce (The Accumulator Mental Model, 10 Production Patterns, Anti-Patterns)
   ↓
Level 09-10: Ordering & Mutability (sort vs toSorted, reverse vs toReversed, Stable Timsort)
   ↓
Level 11: The Immutability Matrix & ES2023 (with(), toSpliced(), Pure Data Architecture)
   ↓
Level 12-14: Utilities, Creation (fill, copyWithin, Array.from, Array.of, Array-likes & Iterables)
   ↓
Level 15-17: Multi-Dimensional Grids, Destructuring, Spread, Reference Traps & Deep Cloning
   ↓
Level 18-20: Modern Collections (Set, ES2024 Set Methods, Map, WeakMap & WeakSet GC Semantics)
   ↓
Level 21-22: Binary & Low-Level (ArrayBuffer, TypedArrays, DataView, Endianness, Iterators)
   ↓
Level 23-24: Big-O Complexity Matrix & 8 Core Algorithmic Problem-Solving Archetypes
   ↓
Level 25: The 103 Array Algorithms (Beginner 1-27, Intermediate 28-56, Advanced 57-82, 2D 83-95, Structures 96-103)
   ↓
Level 26-28: Async Pipelines (Promise.all/Settled, Concurrency Pools), React State, V8 Internals
   ↓
Level 29-33: Debugging, Senior System Guidance, 10 Senior Interviews, 4 Projects, Decision Trees & Cheat Sheets
   ↓
Senior Production Engineer
```

### Visual Legend Used Throughout This Guide
* 📘 **Concept**: Fundamental theory, mental model, or specification rule.
* 💡 **Important**: Core principle to commit to memory.
* ⚠️ **Common Mistake**: Production bugs and junior anti-patterns.
* 🧠 **Deep Dive**: Low-level engine behavior (V8 Elements Kinds, Garbage Collection).
* 🔧 **Real World**: Production backend, cloud data processing, and API design scenarios.
* 🧪 **Practice**: Hands-on code verification and assertions.
* 🎯 **Challenge**: Multi-step algorithmic coding implementation.
* 💼 **Interview**: Hard questions asked in FAANG/Tier-1 technical screens.
* ⚡ **Performance**: Algorithmic complexity ($O(1)$ vs $O(n)$) and memory optimization.
* 🔐 **Defensive / Immutability**: Preventing unintended side effects and prototype pollution.

---

### Mental Model: JavaScript Arrays vs C-Style Arrays
In low-level languages like C or Rust, an array is a **contiguous block of memory** where every element has a fixed byte width. The memory address of element `i` is computed mathematically:
$$\text{Address}(arr[i]) = \text{BaseAddress} + (i \times \text{ElementByteSize})$$
This allows true $O(1)$ constant-time hardware memory indexing.

In JavaScript:
1. **ECMAScript Specification**: An Array is an Object with a special prototype (`Array.prototype`) and an auto-updating `length` property. Numeric indices `0, 1, 2` are formally string object properties (`"0", "1", "2"`).
2. **Engine Reality (V8/SpiderMonkey/JavaScriptCore)**: Modern JavaScript engines inspect how you use the array. If you allocate numbers sequentially without gaps, V8 allocates contiguous memory under the hood (known as `PACKED_SMI` or `PACKED_DOUBLE` elements). If you introduce holes or delete indices, V8 de-optimizes the array into a dictionary-mode hash table!
3. **Implications**: JavaScript arrays are dynamically sized, can hold heterogeneous data types (`[1, "hello", true, {}]`), and never throw an Index-Out-Of-Bounds exception (accessing an out-of-bounds index returns `undefined`).

---

## 01. Array Fundamentals

### 1. What is an Array?
An array in JavaScript is an ordered list of values. Values can be primitives (numbers, strings, booleans, symbols, bigints) or references (objects, functions, other arrays).

```javascript
// Heterogeneous values in a single array
const mixedData = [42, "Antigravity", true, { role: "Architect" }, [1, 2, 3]];
console.log(mixedData[0]); // 42
console.log(mixedData[3].role); // "Architect"
```

### 2. Array Literals vs `new Array()` vs `Array.of()`
There are three primary ways to instantiate an array:

1. **Array Literal** (Recommended 99% of the time):
   ```javascript
   const items = [1, 2, 3];
   ```

2. **`new Array()` Constructor** (⚠️ Has an infamous single-argument trap!):
   ```javascript
   // Multiple arguments: elements are treated as items
   const a = new Array(1, 2, 3); // [1, 2, 3]

   // Single NUMERIC argument: creates an EMPTY array with length N (holes!)
   const b = new Array(3); // [ <3 empty items> ], length is 3!
   console.log(b[0]); // undefined
   console.log(0 in b); // false (the index property does not even exist!)

   // Single NON-NUMERIC argument: creates a single-element array
   const c = new Array("3"); // ["3"], length is 1
   ```

3. **`Array.of()`** (ES6 Standard - avoids the single-argument trap):
   ```javascript
   const d = Array.of(3); // [3], length is 1
   const e = Array.of(1, 2, 3); // [1, 2, 3]
   ```

### 3. The `typeof` Quirk and True Type Checking
In JavaScript, arrays are objects. Therefore:
```javascript
console.log(typeof []); // "object" (Not "array"!)
console.log(typeof {}); // "object"
console.log([] instanceof Object); // true
```

#### How to reliably check if a value is an Array:
```javascript
// 1. Array.isArray() (The gold standard - works across iframes / execution realms)
console.log(Array.isArray([1, 2])); // true
console.log(Array.isArray({ length: 2 })); // false

// 2. instanceof Array (Fails if the array was created in another iframe/window!)
// [iframeWindow.Array] !== [currentWindow.Array]
```

> 💡 **Cross-Realm Warning**: Never use `value instanceof Array` in environments with iframes, micro-frontends, or Web Workers. An array instantiated in an iframe has `iframe.Array.prototype` as its prototype, which does not match `window.Array.prototype`. Always use `Array.isArray(value)`.

### 4. The Dynamic `.length` Property Mechanics
The `.length` property of an array has two unique characteristics:
1. It is **automatically updated** whenever an element is added at an index $\ge$ current length.
2. It is **writable**, meaning you can truncate or expand arrays by manually assigning to `.length`.

```javascript
const letters = ["a", "b", "c", "d", "e"];
console.log(letters.length); // 5

// Truncation: assigning a smaller length deletes elements permanently!
letters.length = 2;
console.log(letters); // ["a", "b"]
console.log(letters[2]); // undefined

// Expansion: assigning a larger length introduces empty slots (holes)!
letters.length = 5;
console.log(letters); // ["a", "b", <3 empty items>]

// Instant Array Wipe:
letters.length = 0;
console.log(letters); // []
```

### 5. Sparse Arrays (Holes) vs Dense Arrays
A **dense array** has elements defined at every index from `0` to `length - 1`.
A **sparse array** has gaps or "holes" where indices do not exist as properties on the object.

```javascript
const dense = [undefined, undefined];
const sparse = new Array(2); // [ <2 empty items> ]

console.log(0 in dense);  // true (index 0 exists, its value is undefined)
console.log(0 in sparse); // false (index 0 does NOT exist!)

// Behavior with array iteration methods:
dense.forEach(x => console.log("Dense tick"));  // Logs 2 times
sparse.forEach(x => console.log("Sparse tick")); // NEVER logs! (forEach skips holes!)

// Behavior with map():
console.log(sparse.map(() => 99)); // [ <2 empty items> ] (Holes remain untouched!)

// Modern methods (find, includes, for..of) treat holes as undefined:
console.log(sparse.includes(undefined)); // true!
for (const val of sparse) {
  console.log(val); // logs 'undefined' twice
}
```

| Operation | Sparse Hole Behavior | Dense Array `[undefined]` Behavior |
| :--- | :--- | :--- |
| `0 in arr` | `false` | `true` |
| `arr.forEach()` | **Skips hole** | Executes callback with `undefined` |
| `arr.map()` | Preserves hole without calling fn | Transforms `undefined` |
| `arr.filter()` | **Drops hole** completely | Keeps `undefined` if predicate is truthy |
| `for...of` | Yields `undefined` | Yields `undefined` |
| `Array.from(arr)` | **Converts holes to `undefined`** | Preserves `undefined` |
| `JSON.stringify(arr)` | Serializes as `null` | Serializes as `null` |

---

## 02. Array Access & Modification (Basics)

### 1. Bracket Access
Accessing elements uses zero-based indexing via square brackets:
```javascript
const stack = ["React", "Node", "Postgres"];
console.log(stack[0]); // "React"
console.log(stack[2]); // "Postgres"
console.log(stack[100]); // undefined (No out-of-bounds error!)
```

### 2. Modern Relative Indexing with `.at(index)` (ES2022)
Prior to ES2022, retrieving the last item required the verbose `arr[arr.length - 1]`. The modern `.at()` method supports negative indices counting backwards from the end:

```javascript
const versions = ["v1.0", "v1.1", "v2.0", "v2.4"];

// The Old Way:
console.log(versions[versions.length - 1]); // "v2.4"
console.log(versions[versions.length - 2]); // "v2.0"

// The Modern Way with .at():
console.log(versions.at(-1)); // "v2.4" (Last item)
console.log(versions.at(-2)); // "v2.0" (Second to last item)
console.log(versions.at(0));  // "v1.0" (First item)
console.log(versions.at(-99)); // undefined
```

### 3. Assigning Beyond Current Length
Assigning to an index greater than `arr.length` automatically expands the array and creates holes:
```javascript
const scores = [10, 20];
scores[5] = 60;
console.log(scores); // [ 10, 20, <3 empty items>, 60 ]
console.log(scores.length); // 6
```

### 4. The Danger of the `delete` Operator
In JavaScript, the `delete` operator deletes object properties. When applied to an array element, it deletes the index property but **does not shift remaining elements or change `length`**! It turns your dense array into a sparse array with a hole:

```javascript
const users = ["Alice", "Bob", "Charlie"];
delete users[1]; // ⚠️ NEVER DO THIS!

console.log(users); // ["Alice", <1 empty item>, "Charlie"]
console.log(users.length); // 3 (Length did not decrease!)
console.log(users[1]); // undefined
console.log(1 in users); // false

// The correct way to remove an element by index:
// Mutating: users.splice(1, 1);
// Non-mutating: const updated = users.toSpliced(1, 1);
```

---

## 03. Adding and Removing Elements (Stack & Queue Operations)

JavaScript provides 4 fundamental methods to add and remove items from the boundaries of an array:

```
       unshift()  ────────> ┌─────────┬─────────┬─────────┐ <────────  push()
    (Add to front)          │ Index 0 │ Index 1 │ Index 2 │         (Add to end)
                            └─────────┴─────────┴─────────┘
       shift()    <──────── ┌─────────┬─────────┬─────────┐ ────────>  pop()
   (Remove front)           │ Index 0 │ Index 1 │ Index 2 │        (Remove end)
                            └─────────┴─────────┴─────────┘
```

### 1. `push(...items)` (End Insertion)
* Appends one or more items to the end of the array.
* **Mutates** original array.
* Returns the **new length** of the array.
* Complexity: **$O(1)$ amortized**.

```javascript
const queue = ["Task 1"];
const newLength = queue.push("Task 2", "Task 3");
console.log(newLength); // 3
console.log(queue); // ["Task 1", "Task 2", "Task 3"]
```

### 2. `pop()` (End Deletion)
* Removes and returns the **last** element of the array.
* **Mutates** original array.
* Returns `undefined` if the array is empty.
* Complexity: **$O(1)$**.

```javascript
const logs = ["log1", "log2", "log3"];
const last = logs.pop();
console.log(last); // "log3"
console.log(logs); // ["log1", "log2"]
console.log([].pop()); // undefined
```

### 3. `unshift(...items)` (Front Insertion)
* Prepends one or more items to the beginning of the array.
* **Mutates** original array.
* Every existing element must have its internal index shifted by $+k$!
* Returns the **new length** of the array.
* Complexity: **$O(n)$ linear time**.

```javascript
const priorities = ["Medium", "Low"];
const len = priorities.unshift("Urgent", "High");
console.log(len); // 4
console.log(priorities); // ["Urgent", "High", "Medium", "Low"]
```

### 4. `shift()` (Front Deletion)
* Removes and returns the **first** element of the array (at index `0`).
* **Mutates** original array.
* Every remaining element must have its internal index shifted down by $-1$!
* Returns `undefined` if empty.
* Complexity: **$O(n)$ linear time**.

```javascript
const line = ["Customer A", "Customer B", "Customer C"];
const served = line.shift();
console.log(served); // "Customer A"
console.log(line); // ["Customer B", "Customer C"]
```

### 5. Architectural Performance Summary: Stack vs Queue
| Operation | Method | Direction | Amortized Time Complexity | Why? |
| :--- | :--- | :--- | :--- | :--- |
| **Stack Push** | `arr.push(x)` | Tail | $\mathcal{O}(1)$ | Memory capacity doubled periodically |
| **Stack Pop** | `arr.pop()` | Tail | $\mathcal{O}(1)$ | Decrements length pointer |
| **Queue Enqueue** | `arr.push(x)` | Tail | $\mathcal{O}(1)$ | Append at end |
| **Queue Dequeue** | `arr.shift()` | Head | $\mathcal{O}(n)$ | Shifts every remaining item in memory |
| **List Prepend** | `arr.unshift(x)`| Head | $\mathcal{O}(n)$ | Shifts every existing item forward |

> ⚡ **Senior Performance Note**: If your application requires processing millions of queue operations (e.g., job processing, BFS graph search), using `arr.shift()` will result in severe quadratic $O(n^2)$ bottlenecks. For large queues, use a **Doubly-Linked List** or a **Ring/Circular Buffer** (which we build in Level 25, Algorithm 96) to achieve true $O(1)$ dequeue.


---

## 04. Slicing vs Splicing (The Master Comparison)

The difference between `slice()` and `splice()` is one of the most frequently tested concepts in JavaScript technical interviews and one of the most common sources of data corruption bugs.

### 1. Master Comparison Matrix

| Feature | `Array.prototype.slice()` | `Array.prototype.splice()` | `Array.prototype.toSpliced()` (ES2023) |
| :--- | :--- | :--- | :--- |
| **Primary Purpose** | Copying a sub-segment | In-place removal / insertion | Non-mutating removal / insertion |
| **Mutates Original?** | ❌ **No (Pure)** | ✅ **Yes (Mutating)** | ❌ **No (Pure)** |
| **Return Value** | Brand new shallow copy array | Array of **removed elements** | Brand new array with changes applied |
| **Parameter 1** | `start` (0-based start index) | `start` (0-based start index) | `start` (0-based start index) |
| **Parameter 2** | `end` (non-inclusive stop index) | `deleteCount` (number of items) | `deleteCount` (number of items) |
| **Parameter 3+** | Ignored | `...items` to insert | `...items` to insert |
| **Negative Indices?** | Supported (counts from end) | Supported (counts from end) | Supported (counts from end) |
| **Time Complexity** | $\mathcal{O}(k)$ where $k = end - start$ | $\mathcal{O}(n)$ (must shift elements) | $\mathcal{O}(n)$ (copies entire array) |

---

### 2. Syntax Deconstruction

#### `slice(start, end)`
```javascript
const arr = [0, 1, 2, 3, 4, 5];
// Syntax: arr.slice([start[, end]])
// - start: defaults to 0. If negative, start = Math.max(0, length + start).
// - end: non-inclusive! If omitted, extracts to arr.length.
// - If start >= end, returns empty array [].

arr.slice(1, 4);  // [1, 2, 3] (elements at index 1, 2, 3. Index 4 excluded!)
arr.slice(-3);    // [3, 4, 5] (last 3 elements)
arr.slice(2, -1); // [2, 3, 4] (from index 2 up to, but not including, the last item)
arr.slice();      // [0, 1, 2, 3, 4, 5] (clean shallow clone)
```

#### `splice(start, deleteCount, ...items)`
```javascript
const letters = ["a", "b", "c", "d"];
// Syntax: arr.splice(start[, deleteCount[, item1[, item2[, ...]]]])
// - start: index at which to start changing the array.
// - deleteCount: integer indicating the number of elements to remove.
//   If 0 or negative, no elements removed.
//   If omitted or >= arr.length - start, all elements from start to end are removed.
// - item1, item2...: items to add at start index.

const removed = letters.splice(1, 2, "X", "Y");
console.log(removed); // ["b", "c"] (The items that got cut out!)
console.log(letters); // ["a", "X", "Y", "d"] (Original mutated in-place!)
```

---

### 3. 4-Tier Real-World Examples for `slice`

#### Tier 1 (Beginner): Pagination Subset
Extracting a current page slice for a table or feed:
```javascript
function paginate(items, pageNumber = 1, pageSize = 10) {
  const startIndex = (pageNumber - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  return items.slice(startIndex, endIndex);
}

const auditLogs = Array.from({ length: 50 }, (_, i) => `Log #${i + 1}`);
const page2 = paginate(auditLogs, 2, 5);
console.log(page2); // ["Log #6", "Log #7", "Log #8", "Log #9", "Log #10"]
```

#### Tier 2 (Intermediate): Safe Shallow Copying Before Transformation
Preventing unintended mutations to raw external configuration:
```javascript
function getTopScores(rawScores, limit = 3) {
  // slice() creates a clone so .sort() doesn't mutate the caller's array!
  return rawScores
    .slice()
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}

const leaderboard = [{ score: 85 }, { score: 99 }, { score: 72 }, { score: 91 }];
const top3 = getTopScores(leaderboard);
console.log(top3.map(u => u.score)); // [99, 91, 85]
console.log(leaderboard[0].score);   // 85 (original untouched!)
```

#### Tier 3 (Advanced): Tail Extraction and Array-Like Conversion
Retrieving dynamic trail elements and legacy object conversion:
```javascript
// Extract the trailing N elements regardless of total length
function getLastAuditTrail(events, count = 3) {
  return events.slice(-count);
}
console.log(getLastAuditTrail(["boot", "connect", "auth", "ready", "ping"], 2)); // ["ready", "ping"]

// Converting array-like objects (historical standard before Array.from)
function legacyArgsToArray() {
  return Array.prototype.slice.call(arguments);
}
console.log(legacyArgsToArray(1, 2, "x")); // [1, 2, "x"]
```

#### Tier 4 (Senior): Time-Series Rolling Window
Computing rolling averages without allocating unnecessary memory leaks:
```javascript
function computeMovingAverages(dailyPrices, windowSize = 3) {
  if (dailyPrices.length < windowSize) return [];
  const results = [];
  for (let i = 0; i <= dailyPrices.length - windowSize; i++) {
    const windowSlice = dailyPrices.slice(i, i + windowSize);
    const avg = windowSlice.reduce((sum, val) => sum + val, 0) / windowSize;
    results.push(Number(avg.toFixed(2)));
  }
  return results;
}

const stockPrices = [100, 102, 104, 101, 105, 107];
console.log(computeMovingAverages(stockPrices, 3)); // [102, 102.33, 103.33, 104.33]
```

---

### 4. 4-Tier Real-World Examples for `splice`

#### Tier 1 (Beginner): Removing an Item by Target Index
```javascript
const shoppingCart = ["Apples", "Milk", "Bread", "Eggs"];
const breadIndex = shoppingCart.indexOf("Bread");

if (breadIndex !== -1) {
  shoppingCart.splice(breadIndex, 1); // delete 1 item starting at breadIndex
}
console.log(shoppingCart); // ["Apples", "Milk", "Eggs"]
```

#### Tier 2 (Intermediate): Arbitrary Position Insertion Without Deletion
Inserting items at a specific sorted position:
```javascript
const sortedPriorities = [10, 20, 40, 50];
const newPriority = 30;

// Insert 30 between 20 and 40 without deleting anything (deleteCount = 0)
const insertAt = sortedPriorities.findIndex(p => p > newPriority);
sortedPriorities.splice(insertAt, 0, newPriority);

console.log(sortedPriorities); // [10, 20, 30, 40, 50]
```

#### Tier 3 (Advanced): In-Place Record Replacement
Updating an existing item while preserving object array reference identity:
```javascript
const connections = [
  { id: "c1", status: "idle" },
  { id: "c2", status: "connecting" },
  { id: "c3", status: "idle" }
];

const targetIdx = connections.findIndex(c => c.id === "c2");
if (targetIdx !== -1) {
  // Replace old connection with refreshed active record
  connections.splice(targetIdx, 1, { id: "c2", status: "connected", pingMs: 14 });
}

console.log(connections[1]); // { id: "c2", status: "connected", pingMs: 14 }
```

#### Tier 4 (Senior): In-Place Batch Cleanup (Eliminating Memory Reallocations)
Removing expired tokens directly from an in-memory queue without assigning a new array reference:
```javascript
function pruneExpiredTokensInPlace(tokenStore, now = Date.now()) {
  let i = tokenStore.length;
  // Walk backwards so splicing does not offset upcoming unvisited indices!
  while (i--) {
    if (tokenStore[i].expiresAt <= now) {
      tokenStore.splice(i, 1);
    }
  }
}

const activeTokens = [
  { token: "t1", expiresAt: 1000 },
  { token: "t2", expiresAt: 5000 },
  { token: "t3", expiresAt: 800 }
];
pruneExpiredTokensInPlace(activeTokens, 2000);
console.log(activeTokens.map(t => t.token)); // ["t2"]
```

---

### 5. Modern Pure Alternative: `toSpliced()` (ES2023)
In modern functional architectures (React state, Redux, pure stores), in-place mutation causes stale rendering bugs. ES2023 introduced `toSpliced()`, which has the exact same arguments as `splice()`, but **returns a new array** without mutating the original:

```javascript
const baseList = ["task-1", "task-2", "task-3"];

// Pure insertion at index 1:
const nextState = baseList.toSpliced(1, 0, "task-inserted");

console.log(baseList);  // ["task-1", "task-2", "task-3"] (Untouched!)
console.log(nextState); // ["task-1", "task-inserted", "task-2", "task-3"]
```

---

## 05. Searching & Inspecting Arrays

### 1. Decision Matrix: Which Search Tool Should You Use?

| Your Need | Recommended Method | Returns | Equality Mechanism | Short-Circuits? |
| :--- | :--- | :--- | :--- | :--- |
| Check if primitive exists | `arr.includes(val)` | `boolean` | SameValueZero (`NaN === NaN`) | ✅ Yes |
| Find index of primitive | `arr.indexOf(val)` | `number` (`-1` if not found) | Strict Equality (`===`) | ✅ Yes |
| Find last index of primitive | `arr.lastIndexOf(val)` | `number` (`-1` if not found) | Strict Equality (`===`) | ✅ Yes (from right) |
| Find first object by condition | `arr.find(predicate)` | Value or `undefined` | Callback predicate | ✅ Yes |
| Find index of first match | `arr.findIndex(predicate)` | `number` (`-1` if not found) | Callback predicate | ✅ Yes |
| Find last object by condition | `arr.findLast(predicate)` | Value or `undefined` | Callback predicate (ES2023) | ✅ Yes (from right) |
| Find last index by condition | `arr.findLastIndex(pred)` | `number` (`-1` if not found) | Callback predicate (ES2023) | ✅ Yes (from right) |
| Check if ANY match condition | `arr.some(predicate)` | `boolean` | Callback predicate | ✅ Yes (on first true) |
| Check if ALL match condition | `arr.every(predicate)` | `boolean` | Callback predicate | ✅ Yes (on first false) |

---

### 2. Primitive Search & The NaN Quirk
`indexOf` and `includes` differ fundamentally when dealing with `NaN`:

```javascript
const values = [10, NaN, 30];

// indexOf uses Strict Equality (===). In JavaScript, NaN !== NaN!
console.log(values.indexOf(NaN)); // -1 (Fails to find it!)

// includes uses SameValueZero. It correctly matches NaN!
console.log(values.includes(NaN)); // true

// -0 vs +0:
console.log([+0].includes(-0)); // true
console.log([+0].indexOf(-0));  // 0
```

### 3. Predicate Searching: `find` vs `findIndex`
Used when searching for objects by specific attributes:

```javascript
const employees = [
  { id: 101, name: "Sarah", role: "Dev", active: true },
  { id: 102, name: "Marcus", role: "Design", active: false },
  { id: 103, name: "Chloe", role: "Dev", active: true }
];

// 1. find(): Returns first matching element reference
const firstDev = employees.find(e => e.role === "Dev");
console.log(firstDev.name); // "Sarah"

// 2. findIndex(): Returns the index
const inactiveIdx = employees.findIndex(e => !e.active);
console.log(inactiveIdx); // 1
```

### 4. Modern Reverse Searching: `findLast` & `findLastIndex` (ES2023)
Before ES2023, developers commonly wrote `arr.slice().reverse().find(...)`, which needlessly allocated memory to clone and reverse the entire array. `findLast` scans right-to-left in $O(n)$ with zero extra memory:

```javascript
const timeline = [
  { commit: "a1", status: "success" },
  { commit: "b2", status: "fail" },
  { commit: "c3", status: "success" },
  { commit: "d4", status: "fail" }
];

// Find the latest successful commit:
const latestSuccess = timeline.findLast(t => t.status === "success");
console.log(latestSuccess.commit); // "c3"

const latestFailIndex = timeline.findLastIndex(t => t.status === "fail");
console.log(latestFailIndex); // 3
```

### 5. Universal Condition Checks: `some()` and `every()`
Both methods short-circuit immediately as soon as the outcome is determined.

```javascript
const transactions = [120, -15, 340, 500];

// some(): true if AT LEAST ONE element satisfies condition
const hasNegative = transactions.some(t => t < 0);
console.log(hasNegative); // true

// every(): true if ALL elements satisfy condition
const allPositive = transactions.every(t => t > 0);
console.log(allPositive); // false
```

> 💡 **The Vacuous Truth Trap**:
> What does an empty array return for `every()` and `some()`?
> ```javascript
> [].every(x => x > 100); // true! (Vacuously true in formal logic)
> [].some(x => x > 100);  // false!
> ```
> In mathematics, "for all elements in an empty set, statement P holds" is true because no counterexample exists to disprove it! Always check `arr.length > 0` if you require at least one element to be present.

---

## 06. Iteration Methods Compared

Choosing the wrong loop construct in JavaScript leads to subtle bugs, broken asynchronous execution, and performance degradation.

### 1. Master Iteration Comparison

| Construct | Syntax | Can `break` / `continue`? | Handles `await` sequentially? | Skips Sparse Holes? | Prototype Chain Pollution? | Typical Use Case |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Standard `for`** | `for (let i = 0; ...)` | ✅ Yes | ✅ Yes | ❌ No (yields `undefined`) | ❌ Safe | Performance-critical hot loops, complex step increments |
| **`for...of`** | `for (const item of arr)` | ✅ Yes | ✅ Yes | ❌ No (yields `undefined`) | ❌ Safe | Modern sequential processing, async iteration |
| **`forEach`** | `arr.forEach(fn)` | ❌ No (throws exception to stop) | ❌ **No (Fire & Forget bug!)** | ✅ **Skips holes** | ❌ Safe | Simple synchronous side effects |
| **`map`** | `arr.map(fn)` | ❌ No | ❌ Returns array of Promises | ✅ **Preserves holes** | ❌ Safe | Pure 1:1 data transformation |
| **`for...in`** | `for (const key in arr)` | ✅ Yes | ✅ Yes | ✅ Skips holes | ⚠️ **Severe Risk!** | 🚫 **NEVER USE FOR ARRAYS** |

> ⚠️ **Why you must NEVER use `for...in` on arrays**:
> 1. `for...in` iterates over **all enumerable properties**, including prototype additions! If a library or polyfill adds `Array.prototype.customMethod = ...`, `for...in` will yield `"customMethod"` as an index.
> 2. The iteration order is not guaranteed by the engine to be numerical sequential order.
> 3. Indices are yielded as strings (`"0"`, `"1"`), not numbers.

---

### 2. The Infamous Asynchronous `forEach` Trap
One of the most dangerous bugs in Node.js backend development:
```javascript
// ❌ BROKEN: forEach does NOT wait for promises!
async function saveUsersBroken(userIds) {
  console.log("Start saving...");
  userIds.forEach(async (id) => {
    await databaseSave(id); // Fire and forget!
  });
  console.log("Finished saving!"); // Logs IMMEDIATELY before saves complete!
}

// ✅ SOLUTION 1: Sequential processing with for...of (Waits in order)
async function saveUsersSequential(userIds) {
  console.log("Start saving...");
  for (const id of userIds) {
    await databaseSave(id); // Waits for each DB call to finish
  }
  console.log("All saved sequentially!");
}

// ✅ SOLUTION 2: Concurrent / Parallel processing with Promise.all + map
async function saveUsersParallel(userIds) {
  console.log("Start saving concurrently...");
  await Promise.all(userIds.map(id => databaseSave(id)));
  console.log("All saved concurrently!");
}
```

---

## 07. Transformations: Map, Filter, Flat, FlatMap

### 1. Pure Projections with `map()`
* Creates a brand new array with the results of calling a provided callback on every element.
* **Invariant**: Output array length is always equal to input array length.
* Callback signature: `(currentValue, index, array) => transformedValue`

```javascript
const rawProducts = [
  { id: "p1", price: 100, taxRate: 0.1 },
  { id: "p2", price: 250, taxRate: 0.2 }
];

const invoices = rawProducts.map((p, idx) => ({
  lineItem: idx + 1,
  productId: p.id,
  total: p.price * (1 + p.taxRate)
}));

console.log(invoices);
// [
//   { lineItem: 1, productId: 'p1', total: 110 },
//   { lineItem: 2, productId: 'p2', total: 300 }
// ]
```

### 2. Subsetting with `filter()`
* Creates a shallow copy of a portion of an array containing only elements that pass the predicate test (return truthy).
* Output array length is $\le$ input array length.

```javascript
const serverMetrics = [
  { host: "srv-1", cpu: 82, healthy: true },
  { host: "srv-2", cpu: 96, healthy: false },
  { host: "srv-3", cpu: 45, healthy: true }
];

const alerts = serverMetrics.filter(m => m.cpu > 80 && m.healthy);
console.log(alerts.map(a => a.host)); // ["srv-1"]
```

### 3. Chaining `filter().map()` vs Single-Pass Reduction
While method chaining is elegant and readable, it creates an intermediate array in memory:

```javascript
const dataset = [1, 2, 3, 4, 5, 6];

// Chained: 2 passes, 1 intermediate array allocated
const squaredEvens = dataset
  .filter(n => n % 2 === 0)
  .map(n => n * n);

// Single pass using flatMap or reduce (Ideal for 1,000,000+ items):
const squaredEvensSinglePass = dataset.flatMap(n => (n % 2 === 0 ? [n * n] : []));
console.log(squaredEvensSinglePass); // [4, 16, 36]
```

### 4. `flat(depth)`
Flattens sub-array elements up to the specified depth:
```javascript
const nested = [1, [2, [3, [4, 5]]]];

console.log(nested.flat(1)); // [1, 2, [3, [4, 5]]]
console.log(nested.flat(2)); // [1, 2, 3, [4, 5]]

// Deep flattening any arbitrary nested structure:
console.log(nested.flat(Infinity)); // [1, 2, 3, 4, 5]

// Bonus: flat() automatically strips sparse holes!
const sparseWithHoles = [1, , 2, , 3];
console.log(sparseWithHoles.flat()); // [1, 2, 3]
```

### 5. `flatMap()` (Map + 1-Level Flatten)
`flatMap()` runs a mapping function and flattens the result by a depth of 1. It is exceptionally powerful for **1-to-N** or **1-to-0** mappings:

```javascript
// Scenario: Tokenize sentences into a single flat list of words
const sentences = ["Hello world", "Architecture and systems design"];
const words = sentences.flatMap(s => s.toLowerCase().split(" "));
console.log(words); // ["hello", "world", "architecture", "and", "systems", "design"]

// Scenario: 1-to-0 (filtering) and 1-to-many in one pass:
const orders = [
  { id: 1, items: ["Keyboard", "Mouse"] },
  { id: 2, items: [] }, // cancelled order
  { id: 3, items: ["Monitor"] }
];

const allShippableItems = orders.flatMap(o => o.items);
console.log(allShippableItems); // ["Keyboard", "Mouse", "Monitor"]
```


---

## 08. Mastering Reduce

`reduce` is the Swiss Army Knife of array transformations. Every other transformation method (`map`, `filter`, `flat`, `some`, `every`) can be mathematically expressed using `reduce`.

### 1. The Anatomy of `reduce`
```javascript
arr.reduce((accumulator, currentValue, currentIndex, array) => {
  // return new accumulator value for next iteration
}, initialValue);
```

### 2. The Golden Rule of Initial Values
> ⚠️ **CRITICAL RULE**: Always provide the `initialValue` argument to `reduce`!
> If you omit `initialValue`:
> 1. If the array is empty, JavaScript throws a fatal runtime exception: `TypeError: Reduce of empty array with no initial value`.
> 2. The accumulator starts at `arr[0]` and iteration begins at index `1`. If `arr[0]` is an object and you are accumulating a number or another structure, your first step will result in disastrous `[object Object]` type coercion bugs.

```javascript
// ❌ DANGEROUS:
const emptyCart = [];
// emptyCart.reduce((sum, item) => sum + item.price); // THROWS TYPE ERROR!

// ✅ SAFE:
const total = emptyCart.reduce((sum, item) => sum + item.price, 0); // 0
```

---

### 3. 10 Essential Real-World Reduce Patterns

#### Pattern 1: Mathematical Aggregation (Sum, Product, Min, Max)
```javascript
const metrics = [45, 12, 89, 34, 67];

const sum = metrics.reduce((acc, val) => acc + val, 0);
const max = metrics.reduce((acc, val) => Math.max(acc, val), -Infinity);
const min = metrics.reduce((acc, val) => Math.min(acc, val), Infinity);
console.log({ sum, max, min }); // { sum: 247, max: 89, min: 12 }
```

#### Pattern 2: Grouping Elements by Key (Pre-ES2024 / Deep Support)
```javascript
const staff = [
  { name: "Alex", dept: "Engineering" },
  { name: "Beth", dept: "Product" },
  { name: "Carl", dept: "Engineering" }
];

const byDept = staff.reduce((acc, person) => {
  acc[person.dept] = acc[person.dept] || [];
  acc[person.dept].push(person.name);
  return acc;
}, {});

console.log(byDept);
// { Engineering: ['Alex', 'Carl'], Product: ['Beth'] }
```

#### Pattern 3: Frequency Counter / Histogram
```javascript
const votes = ["Yes", "No", "Yes", "Abstain", "Yes", "No"];
const tally = votes.reduce((counts, vote) => {
  counts[vote] = (counts[vote] || 0) + 1;
  return counts;
}, {});
console.log(tally); // { Yes: 3, No: 2, Abstain: 1 }
```

#### Pattern 4: Converting Array to Fast Keyed Lookup Dictionary ($O(1)$ Access)
```javascript
const users = [
  { id: "usr_101", name: "Alice", email: "alice@antigravity.io" },
  { id: "usr_102", name: "Bob", email: "bob@antigravity.io" }
];

const userMap = users.reduce((acc, user) => {
  acc[user.id] = user;
  return acc;
}, {});

// Immediate O(1) lookup without scanning array:
console.log(userMap["usr_101"].email); // "alice@antigravity.io"
```

#### Pattern 5: Deep Array Flattening (Recursive Reducer)
```javascript
const deeplyNested = [1, [2, [3, [4, 5]]], 6];

function deepFlatten(arr) {
  return arr.reduce((acc, item) => {
    return acc.concat(Array.isArray(item) ? deepFlatten(item) : item);
  }, []);
}
console.log(deepFlatten(deeplyNested)); // [1, 2, 3, 4, 5, 6]
```

#### Pattern 6: Function Composition Pipeline (`pipe`)
Executing a sequence of functions left-to-right on an initial input:
```javascript
const trim = s => s.trim();
const lowercase = s => s.toLowerCase();
const removeHyphens = s => s.replace(/-/g, " ");

const pipeline = [trim, lowercase, removeHyphens];

const cleanInput = (str) => pipeline.reduce((value, fn) => fn(value), str);
console.log(cleanInput("   HELLO-WORLD-ARCHITECTURE   ")); // "hello world architecture"
```

#### Pattern 7: Deduplication While Preserving Insertion Order
```javascript
const tags = ["javascript", "node", "javascript", "react", "node", "typescript"];

const uniqueTags = tags.reduce((acc, tag) => {
  if (!acc.includes(tag)) acc.push(tag);
  return acc;
}, []);
console.log(uniqueTags); // ["javascript", "node", "react", "typescript"]
```

#### Pattern 8: Multi-Bucket Partitioning in a Single Pass
```javascript
const numbers = [12, -4, 5, -9, 0, 18, -3];

const partitioned = numbers.reduce((acc, n) => {
  if (n > 0) acc.positive.push(n);
  else if (n < 0) acc.negative.push(n);
  else acc.zeroes.push(n);
  return acc;
}, { positive: [], negative: [], zeroes: [] });

console.log(partitioned);
// { positive: [12, 5, 18], negative: [-4, -9, -3], zeroes: [0] }
```

#### Pattern 9: Cumulative Running Statistics (Moving Running Balance)
```javascript
const ledgerTransactions = [100, -25, -15, 50];

const ledgerWithRunningBalance = ledgerTransactions.reduce((acc, amount) => {
  const previousBalance = acc.length > 0 ? acc[acc.length - 1].balance : 0;
  acc.push({
    transaction: amount,
    balance: previousBalance + amount
  });
  return acc;
}, []);

console.log(ledgerWithRunningBalance);
// [
//   { transaction: 100, balance: 100 },
//   { transaction: -25, balance: 75 },
//   { transaction: -15, balance: 60 },
//   { transaction: 50, balance: 110 }
// ]
```

#### Pattern 10: Generating Query Strings or Nested Property Paths
```javascript
// Resolving deeply nested object paths: "user.profile.address.city"
const nestedRecord = { user: { profile: { address: { city: "Zurich" } } } };

function getDeepValue(obj, path) {
  return path.split(".").reduce((curr, key) => (curr ? curr[key] : undefined), obj);
}
console.log(getDeepValue(nestedRecord, "user.profile.address.city")); // "Zurich"
console.log(getDeepValue(nestedRecord, "user.settings.theme")); // undefined (safe!)
```

---

### 4. When NOT to Use Reduce
> 💡 **Readability over Cleverness**:
> Don't force `reduce` when a standard method is 10x clearer!
> ```javascript
> // ❌ BAD: Overly complex reduce just to double numbers
> const doubled = arr.reduce((acc, x) => { acc.push(x * 2); return acc; }, []);
>
> // ✅ GOOD: Clean and standard
> const doubled = arr.map(x => x * 2);
> ```

---

### 5. `reduceRight()`
Iterates from the last element to the first (right-to-left). Essential for mathematical right-associative evaluation:
```javascript
// Function composition (right-to-left: compose)
const compose = (...fns) => (x) => fns.reduceRight((v, f) => f(v), x);

const add5 = x => x + 5;
const double = x => x * 2;

// double first, then add5:
const doubleThenAdd5 = compose(add5, double);
console.log(doubleThenAdd5(10)); // (10 * 2) + 5 = 25
```

---

## 09. Sorting & Ordering: Sort vs toSorted

Sorting in JavaScript is notorious for surprising developers due to default string coercion.

### 1. The Default UTF-16 Pitfall
Without a comparator function, `sort()` converts all elements to strings and compares their UTF-16 code units:
```javascript
const numbers = [10, 5, 20, 1, 100, 2];
numbers.sort();

console.log(numbers); // [1, 10, 100, 2, 20, 5] ⚠️ SURPRISE!
// "10" comes before "2" alphabetically, just like "apple" comes before "banana"!
```

### 2. The Comparator Function Mechanics
A comparator function takes two arguments `(a, b)` and returns:
* A **negative number** ($< 0$): `a` should come before `b`.
* **Zero** ($0$): `a` and `b` have equal ordering rank.
* A **positive number** ($> 0$): `b` should come before `a`.

```javascript
// Ascending numerical order:
const ascending = [10, 5, 20, 1, 100, 2].sort((a, b) => a - b);
console.log(ascending); // [1, 2, 5, 10, 20, 100]

// Descending numerical order:
const descending = [10, 5, 20, 1, 100, 2].sort((a, b) => b - a);
console.log(descending); // [100, 20, 10, 5, 2, 1]
```

### 3. Stability in Sorting (Guaranteed Since ES2019 / Timsort)
A sort algorithm is **stable** if elements with identical keys retain their original relative order. In modern ECMAScript engines (V8 uses Timsort), `Array.prototype.sort` is **guaranteed to be stable**.

### 4. Multi-Field Sorting
```javascript
const tickets = [
  { priority: 1, created: 100 },
  { priority: 2, created: 50 },
  { priority: 1, created: 20 },
  { priority: 2, created: 10 }
];

// Sort primarily by priority DESCENDING, then by created ASCENDING:
tickets.sort((a, b) => {
  if (b.priority !== a.priority) {
    return b.priority - a.priority; // higher priority first
  }
  return a.created - b.created;     // older timestamp first
});

console.log(tickets);
// [
//   { priority: 2, created: 10 },
//   { priority: 2, created: 50 },
//   { priority: 1, created: 20 },
//   { priority: 1, created: 100 }
// ]
```

### 5. String Sorting with `localeCompare`
Never use `a > b ? 1 : -1` for strings if your software supports international users or numeric filenames:
```javascript
const files = ["file10.txt", "file2.txt", "file1.txt"];

// Natural alphanumeric sorting:
files.sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
console.log(files); // ["file1.txt", "file2.txt", "file10.txt"]
```

### 6. Mutating `sort()` vs Non-Mutating `toSorted()` (ES2023)
```javascript
const original = [3, 1, 2];

// Mutating:
// original.sort(); // original is now [1, 2, 3]!

// Pure / Non-mutating:
const sortedCopy = original.toSorted((a, b) => a - b);
console.log(original);   // [3, 1, 2] (Preserved!)
console.log(sortedCopy); // [1, 2, 3]
```

---

## 10. Reversing & Shallow Copying

### 1. Mutating `reverse()` vs Pure `toReversed()` (ES2023)
```javascript
const sequence = [1, 2, 3];

// ES2023 Pure reversal:
const reversed = sequence.toReversed();
console.log(reversed); // [3, 2, 1]
console.log(sequence); // [1, 2, 3] (Original untouched!)
```

### 2. The 4 Methods to Shallow Copy an Array
```javascript
const source = [1, 2, 3];

const clone1 = [...source];          // Spread operator (Most modern & common)
const clone2 = source.slice();       // slice()
const clone3 = Array.from(source);   // Array.from()
const clone4 = [].concat(source);    // concat()
```

### 3. The Shallow Copy Reference Trap
> ⚠️ **IMPORTANT**: Every shallow copy duplicates only the outer array container. If an array contains objects, arrays, or functions, the copies **reference the exact same underlying memory pointers**!

```javascript
const originalState = [{ id: 1, status: "pending" }];
const shallowClone = [...originalState];

// Modifying an inner object property:
shallowClone[0].status = "approved";

// ⚠️ The original array was modified too!
console.log(originalState[0].status); // "approved"!
```

---

## 11. The Immutability Matrix & Modern ES2023 Methods

Modern application architectures (React, Redux, Solid, Zustand) require immutable state updates to ensure predictability and prevent race conditions.

### 1. The Master Mutability Matrix

| Method Group | Mutating In-Place (Impure) | Pure Equivalent (Immutable) |
| :--- | :--- | :--- |
| **Adding/Removing Ends** | `push()`, `pop()` | `[...arr, item]`, `arr.slice(0, -1)` |
| **Adding/Removing Front** | `unshift()`, `shift()` | `[item, ...arr]`, `arr.slice(1)` |
| **Arbitrary Removal / Insertion** | `splice(start, count, ...items)` | `toSpliced(start, count, ...items)` |
| **Sorting** | `sort(comparator)` | `toSorted(comparator)` |
| **Reversing** | `reverse()` | `toReversed()` |
| **Single Index Replacement** | `arr[index] = newValue` | `arr.with(index, newValue)` |
| **Subsetting** | `splice()` | `slice()` / `filter()` |
| **Transforming** | For-loop index mutations | `map()` |

---

### 2. `Array.prototype.with(index, value)` (ES2023)
Returns a new array with the element at `index` replaced by `value`. Eliminates ugly spread-slice boilerplate:

```javascript
const themes = ["light", "dark", "high-contrast"];

// The old immutable way:
const updatedOld = [...themes.slice(0, 1), "dim", ...themes.slice(2)];

// The modern ES2023 way with .with():
const updatedNew = themes.with(1, "dim");
console.log(updatedNew); // ["light", "dim", "high-contrast"]
console.log(themes);     // ["light", "dark", "high-contrast"] (Original untouched!)

// Supports negative indices!
const withLastChanged = themes.with(-1, "system-default");
console.log(withLastChanged); // ["light", "dark", "system-default"]
```

---

## 12. Filling and In-Place Copying

### 1. `fill(value, start, end)`
Fills all elements in an array from a start index to an end index with a static value.

```javascript
const buffer = new Array(5).fill(0);
console.log(buffer); // [0, 0, 0, 0, 0]

const masked = ["a", "b", "c", "d", "e"].fill("*", 1, 4);
console.log(masked); // ["a", "*", "*", "*", "e"]
```

> ⚠️ **The Object Reference Trap in `fill`**:
> Passing an object to `fill()` copies the **reference**, not the object!
> ```javascript
> const grid = new Array(3).fill([]); // ⚠️ All 3 slots point to THE SAME array!
> grid[0].push("X");
> console.log(grid); // [ ["X"], ["X"], ["X"] ] !
>
> // ✅ The correct way to initialize an array of independent objects/arrays:
> const correctGrid = Array.from({ length: 3 }, () => []);
> correctGrid[0].push("X");
> console.log(correctGrid); // [ ["X"], [], [] ]
> ```

---

### 2. `copyWithin(target, start, end)`
Copies a sequence of array elements within the array in-place without modifying its length.
* High performance: executes at raw memory level without allocating intermediate arrays.
* Useful in game dev, audio synthesis, and buffer operations.

```javascript
const arr = [10, 20, 30, 40, 50];
// Copy elements from index 3 to end (40, 50) and paste them starting at index 0:
arr.copyWithin(0, 3);
console.log(arr); // [40, 50, 30, 40, 50]
```

---

## 13. Static Methods & Creation Utilities

### 1. `Array.isArray()`
The only 100% reliable mechanism for verifying arrays across execution contexts (iframes, realms).

### 2. `Array.from(iterableOrArrayLike, mapFn, thisArg)`
Creates a brand new Array instance from an iterable or array-like object.
The optional second argument is a built-in mapping function (faster than calling `.map()` afterwards because it doesn't allocate an intermediate array!).

```javascript
// 1. Generate range of numbers: 0..4
const range = Array.from({ length: 5 }, (_, i) => i * 10);
console.log(range); // [0, 10, 20, 30, 40]

// 2. Convert Set to Array:
const uniqueSet = new Set([1, 2, 2, 3]);
console.log(Array.from(uniqueSet)); // [1, 2, 3]

// 3. String to characters (handles surrogate pairs correctly!):
console.log(Array.from("🚀✨")); // ["🚀", "✨"]
```

### 3. `Array.of(...items)`
Creates an array with a variable number of arguments, regardless of number or type of arguments:
```javascript
console.log(Array.of(7));       // [7]
console.log(new Array(7));      // [ <7 empty items> ]
console.log(Array.of(1, 2, 3)); // [1, 2, 3]
```

---

## 14. Array-Like Objects vs Iterables

A major source of confusion in JavaScript is the distinction between an **Array-Like** and an **Iterable**.

```
┌──────────────────────────────────────┐     ┌──────────────────────────────────────┐
│          Array-Like Object           │     │               Iterable               │
│                                      │     │                                      │
│  - Has a non-negative .length        │     │  - Implements [Symbol.iterator]()    │
│  - Has indexed integer keys (0, 1...)│     │  - Can be consumed by for...of      │
│  - Examples: arguments, NodeList,     │     │  - Examples: Array, Set, Map, String │
│    { 0: "a", 1: "b", length: 2 }     │     │                                      │
└──────────────────────────────────────┘     └──────────────────────────────────────┘
```

### Conversion Strategies
```javascript
// An Array-like (not an iterable!)
const arrayLike = { 0: "first", 1: "second", length: 2 };

// ❌ Spread operator fails if object is not iterable:
// [...arrayLike]; // TypeError: arrayLike is not iterable

// ✅ Array.from handles BOTH array-likes AND iterables:
const realArray1 = Array.from(arrayLike);
console.log(realArray1); // ["first", "second"]

// DOM NodeList (Both array-like and iterable in modern browsers):
// const buttons = Array.from(document.querySelectorAll("button"));
```


---

## 15. Multi-Dimensional Arrays & Matrices

In JavaScript, matrices and multi-dimensional grids are represented as **nested arrays** (arrays of arrays).

### 1. The Correct Way to Initialize a 2D Matrix
```javascript
const rows = 3;
const cols = 4;

// ❌ DANGEROUS REFERENCE BUG:
// const grid = Array(rows).fill(Array(cols).fill(0));
// All rows share the exact same array reference in memory!

// ✅ THE CORRECT WAY:
const matrix = Array.from({ length: rows }, () => Array(cols).fill(0));
matrix[0][1] = 99;
console.log(matrix[1][1]); // 0 (Rows are completely independent!)
```

### 2. Matrix Traversal: Row-Major vs Column-Major
```javascript
const grid = [
  [1, 2, 3],
  [4, 5, 6]
];

// Row-major traversal (Cache-friendly in memory):
for (let r = 0; r < grid.length; r++) {
  for (let c = 0; c < grid[r].length; c++) {
    // process grid[r][c]
  }
}
```

### 3. Matrix Transposition ($M^T$)
Flipping a matrix over its diagonal (converting rows into columns):
```javascript
function transpose(mat) {
  const rows = mat.length;
  const cols = mat[0].length;
  const result = Array.from({ length: cols }, () => Array(rows));
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      result[c][r] = mat[r][c];
    }
  }
  return result;
}

console.log(transpose([[1, 2, 3], [4, 5, 6]]));
// [ [ 1, 4 ], [ 2, 5 ], [ 3, 6 ] ]
```

---

## 16. Destructuring, Rest, and Spread

### 1. Destructuring Essentials
```javascript
const coordinates = [12.9716, 77.5946, 920]; // lat, lng, altitude

// Basic extraction:
const [latitude, longitude] = coordinates;

// Skipping elements with empty commas:
const [, , altitude] = coordinates;
console.log(altitude); // 920

// Default fallback values:
const [a, b, c = 0, d = 100] = [1, 2];
console.log({ a, b, c, d }); // { a: 1, b: 2, c: 0, d: 100 }
```

### 2. Swapping Variables Without Temporary Variables
```javascript
let x = 10;
let y = 20;

[x, y] = [y, x];
console.log({ x, y }); // { x: 20, y: 10 }
```

### 3. Rest Pattern in Destructuring (`...rest`)
The rest element must always be the last element in the destructuring pattern:
```javascript
const [primaryHeader, secondaryHeader, ...bodyColumns] = [
  "ID", "Timestamp", "Payload", "Checksum", "Signature"
];
console.log(bodyColumns); // ["Payload", "Checksum", "Signature"]
```

### 4. Spread Operator (`...arr`)
Unpacks elements into a new array or function arguments:
```javascript
const frontEnd = ["HTML", "CSS", "JS"];
const backEnd = ["Node", "Postgres"];
const fullStack = [...frontEnd, "GraphQL", ...backEnd];
console.log(fullStack);
// ['HTML', 'CSS', 'JS', 'GraphQL', 'Node', 'Postgres']
```

---

## 17. References, Shallow Copies vs Deep Copies

### 1. JavaScript Memory Model: Value vs Reference
Primitives (strings, numbers, booleans) are copied by value. Arrays and Objects are stored in heap memory; variables store only the **memory reference (pointer)**.

```javascript
const original = [1, 2, 3];
const pointer = original; // Both variables point to the EXACT same memory address!

pointer.push(99);
console.log(original); // [1, 2, 3, 99] (Mutated!)
```

### 2. Deep Cloning Techniques Compared

#### Modern Native Standard: `structuredClone()`
Added to the HTML standard and Node.js v17+:
```javascript
const complexState = [
  { id: 1, tags: new Set(["admin"]), date: new Date() }
];

const deepCloned = structuredClone(complexState);
deepCloned[0].tags.add("superadmin");

console.log(complexState[0].tags.has("superadmin")); // false! (Completely isolated!)
```

#### Legacy Fallback: `JSON.parse(JSON.stringify())`
⚠️ **Limitations**:
1. Strips functions and `undefined` properties.
2. Converts `Date` instances into ISO strings.
3. Converts `Set` and `Map` into empty objects `{}`.
4. Throws a fatal crash on **circular references**.

#### Custom Recursive Deep Clone Implementation
```javascript
function deepClone(value, hash = new WeakMap()) {
  if (value === null || typeof value !== "object") return value;
  if (value instanceof Date) return new Date(value.getTime());
  if (value instanceof RegExp) return new RegExp(value.source, value.flags);
  if (hash.has(value)) return hash.get(value); // Handles circular references

  const copy = Array.isArray(value) ? [] : {};
  hash.set(value, copy);

  for (const key of Reflect.ownKeys(value)) {
    copy[key] = deepClone(value[key], hash);
  }
  return copy;
}
```

---

## 18. Keyed Collection: Set

A `Set` is a collection of unique values where each value can occur only once. Insertion order is guaranteed during iteration.

### 1. Core Methods & Complexity
* `set.add(value)`: Adds value. Returns the set. Complexity: $\mathcal{O}(1)$.
* `set.has(value)`: Returns boolean. Complexity: $\mathcal{O}(1)$.
* `set.delete(value)`: Removes value. Returns boolean. Complexity: $\mathcal{O}(1)$.
* `set.clear()`: Empties set.
* `set.size`: Number of unique elements.

```javascript
const uniqueVisits = new Set();
uniqueVisits.add("192.168.1.1");
uniqueVisits.add("10.0.0.1");
uniqueVisits.add("192.168.1.1"); // Ignored!

console.log(uniqueVisits.size); // 2
console.log(uniqueVisits.has("10.0.0.1")); // true
```

### 2. Fast Array Deduplication
```javascript
const duplicateNums = [1, 2, 2, 3, 4, 4, 5, 1];
const uniqueNums = [...new Set(duplicateNums)];
console.log(uniqueNums); // [1, 2, 3, 4, 5]
```

### 3. ES2024 Modern Set Methods
Modern JavaScript (ES2024 / Node 22+) provides native mathematical set operations:

```javascript
const teamA = new Set(["Alice", "Bob", "Charlie"]);
const teamB = new Set(["Charlie", "David", "Eve"]);

// 1. Union: all elements in either set (A ∪ B)
console.log([...teamA.union(teamB)]); 
// ['Alice', 'Bob', 'Charlie', 'David', 'Eve']

// 2. Intersection: elements present in BOTH sets (A ∩ B)
console.log([...teamA.intersection(teamB)]); 
// ['Charlie']

// 3. Difference: elements in A that are NOT in B (A \ B)
console.log([...teamA.difference(teamB)]); 
// ['Alice', 'Bob']

// 4. Symmetric Difference: elements in either A or B, but NOT both (A △ B)
console.log([...teamA.symmetricDifference(teamB)]); 
// ['Alice', 'Bob', 'David', 'Eve']

// 5. Relationship Checks:
const subset = new Set(["Alice"]);
console.log(subset.isSubsetOf(teamA)); // true
console.log(teamA.isSupersetOf(subset)); // true
console.log(teamA.isDisjointFrom(new Set(["Zack"]))); // true (no common elements)
```

---

## 19. Keyed Collection: Map

A `Map` is a collection of keyed data items, similar to an Object. But the critical difference is that **Map allows keys of ANY type**—including objects, arrays, and functions!

### 1. Map vs Plain Object Master Comparison

| Feature | `Map` | Plain `Object` |
| :--- | :--- | :--- |
| **Allowed Key Types** | **Any value** (objects, functions, primitives) | Strings and Symbols only |
| **Key Ordering** | Guaranteed exact insertion order | Mostly insertion, but numeric keys sort first |
| **Size Retrieval** | `map.size` in $\mathcal{O}(1)$ | `Object.keys(obj).length` in $\mathcal{O}(n)$ |
| **Performance** | Optimized for frequent additions and removals | Optimized for fixed static shape access |
| **Prototype Pollution** | Immune (no default prototype keys) | Vulnerable (`__proto__`, `toString`) |
| **JSON Serialization** | Requires custom serializer | Native `JSON.stringify()` |

### 2. Map in Action
```javascript
const metadataCache = new Map();

const domNode = { id: "main-button" };
const userSession = { token: "xyz" };

// Using OBJECTS as keys!
metadataCache.set(domNode, { clickCount: 42 });
metadataCache.set(userSession, { role: "admin" });

console.log(metadataCache.get(domNode).clickCount); // 42
console.log(metadataCache.has(userSession)); // true

// Iterating Map:
for (const [key, val] of metadataCache.entries()) {
  // key is the original object reference
}
```

### 3. Converting Between Map and Object
```javascript
const obj = { server: "prod-1", port: 8080 };

// Object to Map:
const map = new Map(Object.entries(obj));

// Map to Object:
const backToObj = Object.fromEntries(map);
console.log(backToObj); // { server: 'prod-1', port: 8080 }
```

---

## 20. Weak Collections: WeakMap & WeakSet

`WeakMap` and `WeakSet` hold **weak references** to their keys, meaning they do not prevent the JavaScript Garbage Collector (GC) from reclaiming an object once all other references to it are lost.

### 1. Invariants of Weak Collections
1. **Keys MUST be Objects** (or non-registered Symbols). Primitives are rejected with a `TypeError`.
2. **Not Enumerable**: There is no `size` property, no `keys()`, no `values()`, and no `forEach()`.
3. **Why Non-Enumerable?** Because garbage collection timing is non-deterministic. If you could inspect the size, the program's observable state would depend on when the engine runs garbage collection!

### 2. Real-World Use Case: Metadata Storage Without Memory Leaks
```javascript
const domElementMetadata = new WeakMap();

function registerElement(element, data) {
  domElementMetadata.set(element, data);
}

// When the DOM element is removed from the document and all variables referencing it
// go out of scope, both the element AND its associated metadata are automatically
// reclaimed by the Garbage Collector—completely preventing memory leaks!
```

### 3. Real-World Use Case: Private Class State
```javascript
const privateData = new WeakMap();

class SecureClient {
  constructor(apiKey) {
    privateData.set(this, { apiKey });
  }

  authenticate() {
    const { apiKey } = privateData.get(this);
    return `Authenticated with ${apiKey.slice(0, 4)}****`;
  }
}

const client = new SecureClient("sk_live_987654321");
console.log(client.authenticate()); // Authenticated with sk_l****
console.log(client.apiKey); // undefined (Completely hidden!)
```

---

## 21. Binary Data: TypedArrays, ArrayBuffer & DataView

Standard JavaScript arrays are dynamic and allocate heap memory per element. In applications like WebGL, audio processing, image filters, and network protocols, we need raw byte-level performance.

```
┌────────────────────────────────────────────────────────────────────────┐
│                    ArrayBuffer (Raw Memory Chunk)                      │
│  [ Byte 0 ] [ Byte 1 ] [ Byte 2 ] [ Byte 3 ] [ Byte 4 ] [ Byte 5 ] ... │
└────────────────────────────────────────────────────────────────────────┘
          ▲                                ▲
          │                                │
┌──────────────────┐             ┌──────────────────┐
│   Uint8Array     │             │   Int32Array     │
│ (View as 1 byte) │             │ (View as 4 bytes)│
└──────────────────┘             └──────────────────┘
```

### 1. The Core TypedArray Family
* **`ArrayBuffer(byteLength)`**: Fixed-length binary memory buffer.
* **`Uint8Array`**: 8-bit unsigned integers (0 to 255).
* **`Uint8ClampedArray`**: 8-bit integers clamped to 0–255 (used for HTML Canvas `ImageData`).
* **`Int16Array` / `Uint16Array`**: 16-bit integers (2 bytes each).
* **`Int32Array` / `Uint32Array`**: 32-bit integers (4 bytes each).
* **`Float32Array` / `Float64Array`**: 32-bit (single) and 64-bit (double) precision floats.
* **`BigInt64Array`**: 64-bit integers.

```javascript
// Allocate 8 bytes of raw zeroed memory:
const buffer = new ArrayBuffer(8);

// Create a 32-bit view (each element consumes 4 bytes -> total 2 elements):
const int32View = new Int32Array(buffer);
int32View[0] = 1000;
int32View[1] = 2000;

console.log(int32View.length); // 2
console.log(int32View.byteLength); // 8 bytes
```

### 2. `DataView` for Explicit Endianness
When reading binary packets sent over network protocols, bytes may be ordered as **Big-Endian** (network order) or **Little-Endian** (x86 CPU order). `DataView` provides explicit control:

```javascript
const packetBuffer = new ArrayBuffer(4);
const view = new DataView(packetBuffer);

// Write 16-bit integer at offset 0 as Big-Endian (second arg false or omitted):
view.setUint16(0, 0x1234, false);

// Read back as Little-Endian:
console.log("0x" + view.getUint16(0, true).toString(16)); // 0x3412 (Bytes flipped!)
```

---

## 22. Array Iterators: keys(), values(), entries()

Arrays implement the standard JavaScript Iteration Protocol:
* `arr.keys()`: Returns an iterator of index numbers.
* `arr.values()`: Returns an iterator of element values.
* `arr.entries()`: Returns an iterator of `[index, value]` pairs.

```javascript
const frameworks = ["React", "Vue", "Svelte"];

// The standard way to iterate both index AND value cleanly in a for...of loop:
for (const [idx, name] of frameworks.entries()) {
  console.log(`Rank #${idx + 1}: ${name}`);
}

// Unlike Object.keys(), arr.keys() DOES NOT skip sparse holes:
const sparse = ["a", , "c"];
console.log([...sparse.keys()]); // [0, 1, 2]
```

---

## 23. Big-O Complexity Matrix of All Array Operations

| Operation / Method | Time Complexity | Space Complexity | Explanation |
| :--- | :--- | :--- | :--- |
| **Index Access** (`arr[i]`) | $\mathcal{O}(1)$ | $\mathcal{O}(1)$ | Direct pointer calculation |
| **Index Assignment** (`arr[i] = x`) | $\mathcal{O}(1)$ | $\mathcal{O}(1)$ | Updates value at slot |
| **Push** (`arr.push(x)`) | $\mathcal{O}(1)$ amortized | $\mathcal{O}(1)$ | Capacity doubles when full |
| **Pop** (`arr.pop()`) | $\mathcal{O}(1)$ | $\mathcal{O}(1)$ | Length pointer decremented |
| **Unshift** (`arr.unshift(x)`) | $\mathcal{O}(n)$ | $\mathcal{O}(1)$ | Every element shifted right |
| **Shift** (`arr.shift()`) | $\mathcal{O}(n)$ | $\mathcal{O}(1)$ | Every element shifted left |
| **Splice** (`arr.splice(i, k)`) | $\mathcal{O}(n)$ | $\mathcal{O}(k)$ | Shifts remaining elements |
| **Slice** (`arr.slice(i, j)`) | $\mathcal{O}(k)$ | $\mathcal{O}(k)$ | Copies $k$ elements to new array |
| **Concat** (`arr.concat(arr2)`) | $\mathcal{O}(n + m)$ | $\mathcal{O}(n + m)$ | Allocates combined array |
| **Linear Search** (`indexOf`, `find`) | $\mathcal{O}(n)$ | $\mathcal{O}(1)$ | Scans sequentially |
| **Sort** (`arr.sort()`) | $\mathcal{O}(n \log n)$ | $\mathcal{O}(n)$ | Timsort (adaptive merge/insertion) |
| **Reverse** (`arr.reverse()`) | $\mathcal{O}(n)$ | $\mathcal{O}(1)$ | Two-pointer swap in place |
| **Map / Filter / ForEach** | $\mathcal{O}(n)$ | $\mathcal{O}(n)$ (or $\mathcal{O}(1)$ forEach) | Visits all elements once |
| **Set.prototype.has()** | $\mathcal{O}(1)$ avg | $\mathcal{O}(1)$ | Hash table lookup |
| **Map.prototype.get()** | $\mathcal{O}(1)$ avg | $\mathcal{O}(1)$ | Hash table lookup |

---

## 24. Array Problem-Solving Patterns

Mastering these 8 algorithmic patterns unlocks the ability to solve virtually any array coding challenge in competitive programming and senior technical interviews.

```
1. Two Pointers        ───>  [ L ──>            <── R ]   (Sorted pairs, palindromes, water)
2. Sliding Window      ───>  [ L ... R ] ──>              (Subarrays, rolling sums, substrings)
3. Prefix Sum          ───>  Prefix[i] = Sum(0..i)        (O(1) range sum queries)
4. Frequency Counter   ───>  Map<Element, Count>          (Anagrams, majority, duplicates)
5. Monotonic Stack     ───>  Increasing or Decreasing     (Next greater element, histograms)
6. Cyclic Sort         ───>  Item at index = item - 1     (Finding missing/duplicate 1..N)
7. Merge Intervals     ───>  Sort by start, combine if    (Calendar booking, time blocks)
                             curr.start <= prev.end
8. Dutch National Flag ───>  Low, Mid, High pointers      (3-way partitioning in O(n))
```

### 1. Two Pointers (Converging)
* **When to use**: Sorted arrays, pair finding, reversing, water containment.
* **Mechanism**: Pointer `L` starts at `0`, Pointer `R` starts at `length - 1`. They step toward each other based on comparison conditions.

### 2. Sliding Window
* **When to use**: Finding longest, shortest, or target contiguous subarray.
* **Mechanism**: Expand right boundary `R` to include elements; shrink left boundary `L` to satisfy constraint. Reduces $O(n^2)$ nested loops to $O(n)$ linear time.

### 3. Prefix Sum
* **When to use**: Repeated range queries $[L, R]$, finding subarrays summing to $K$.
* **Mechanism**: Precompute cumulative sums so $\sum_{i=L}^{R} arr[i] = \text{Prefix}[R] - \text{Prefix}[L - 1]$.

### 4. Frequency Counter
* **When to use**: Tracking item frequencies, anagram matching, finding anomalies.
* **Mechanism**: Use `Map` or plain object to record counts in a single $O(n)$ pass, avoiding nested $O(n^2)$ searches.

### 5. Monotonic Stack
* **When to use**: "Next Greater Element", "Largest Rectangle in Histogram", temperature problems.
* **Mechanism**: Maintain a stack where elements are strictly increasing or decreasing. Every item is pushed and popped at most once ($O(n)$ time).

### 6. Cyclic Sort
* **When to use**: Array of numbers from $1$ to $N$ (or $0$ to $N$) with missing or duplicate elements.
* **Mechanism**: Place each number at its corresponding index in-place (`nums[i]` belongs at `nums[i] - 1`). Solves in $O(n)$ time and $O(1)$ space.

### 7. Merge Intervals
* **When to use**: Scheduling, overlapping time blocks, calendar meetings.
* **Mechanism**: Sort intervals by start time. Iterate through: if the current interval starts before the previous ends, merge their boundaries.

### 8. Dutch National Flag (3-Way Partitioning)
* **When to use**: Sorting array with 3 distinct values (e.g. 0s, 1s, 2s) in-place in a single pass.
* **Mechanism**: Three pointers: `low`, `mid`, `high`. Swaps elements into position in $O(n)$ time and $O(1)$ space.


---

## 25. Complete Array Algorithms Encyclopedia (103 Problems)

Every algorithm is presented with a formal problem description, example, production-ready JavaScript implementation, time & space complexity, and edge case insights.

---

### Part 1: Beginner Array Algorithms (1 – 27)

#### 1. Find Maximum in Array
* **Problem**: Return the largest number in an array.
```javascript
function findMax(nums) {
  if (nums.length === 0) return undefined;
  let max = nums[0];
  for (let i = 1; i < nums.length; i++) {
    if (nums[i] > max) max = nums[i];
  }
  return max;
}
// Example: findMax([3, 7, 2, 9, 5]) -> 9
// Time: O(n) | Space: O(1) | Edge case: Empty array returns undefined.
```

#### 2. Find Minimum in Array
* **Problem**: Return the smallest number in an array.
```javascript
function findMin(nums) {
  if (nums.length === 0) return undefined;
  let min = nums[0];
  for (let i = 1; i < nums.length; i++) {
    if (nums[i] < min) min = nums[i];
  }
  return min;
}
// Example: findMin([3, 7, 2, 9, 5]) -> 2
// Time: O(n) | Space: O(1) | Edge case: Negative numbers.
```

#### 3. Calculate Array Sum
* **Problem**: Compute the mathematical sum of all numeric elements.
```javascript
function arraySum(nums) {
  return nums.reduce((acc, curr) => acc + curr, 0);
}
// Example: arraySum([1, 2, 3, 4]) -> 10
// Time: O(n) | Space: O(1) | Edge case: Empty array returns 0.
```

#### 4. Calculate Array Average
* **Problem**: Calculate the arithmetic mean of the array.
```javascript
function arrayAverage(nums) {
  if (nums.length === 0) return 0;
  return arraySum(nums) / nums.length;
}
// Example: arrayAverage([10, 20, 30]) -> 20
// Time: O(n) | Space: O(1) | Edge case: Division by zero avoided for empty array.
```

#### 5. Reverse an Array In-Place
* **Problem**: Reverse elements in-place without allocating a new array.
```javascript
function reverseInPlace(nums) {
  let left = 0;
  let right = nums.length - 1;
  while (left < right) {
    [nums[left], nums[right]] = [nums[right], nums[left]];
    left++;
    right--;
  }
  return nums;
}
// Example: reverseInPlace([1, 2, 3, 4]) -> [4, 3, 2, 1]
// Time: O(n) | Space: O(1) | Two Pointers pattern.
```

#### 6. Check if Array Contains Element
* **Problem**: Return true if element exists in array.
```javascript
function containsElement(nums, target) {
  for (let i = 0; i < nums.length; i++) {
    if (Object.is(nums[i], target)) return true;
  }
  return false;
}
// Example: containsElement([1, NaN, 3], NaN) -> true
// Time: O(n) | Space: O(1) | Object.is properly matches NaN.
```

#### 7. Count Occurrences of an Element
* **Problem**: Count how many times a given target appears.
```javascript
function countOccurrences(nums, target) {
  let count = 0;
  for (const item of nums) {
    if (item === target) count++;
  }
  return count;
}
// Example: countOccurrences([1, 2, 2, 3, 2], 2) -> 3
// Time: O(n) | Space: O(1) | Edge case: Target not in array returns 0.
```

#### 8. Remove Duplicates from Sorted Array (In-Place)
* **Problem**: Given a sorted array, remove duplicates in-place so unique elements appear at front. Return new length.
```javascript
function removeDuplicatesSorted(nums) {
  if (nums.length === 0) return 0;
  let writeIdx = 1;
  for (let i = 1; i < nums.length; i++) {
    if (nums[i] !== nums[i - 1]) {
      nums[writeIdx] = nums[i];
      writeIdx++;
    }
  }
  return writeIdx;
}
// Example: removeDuplicatesSorted([1, 1, 2, 2, 3]) -> 3 (nums: [1, 2, 3, ...])
// Time: O(n) | Space: O(1) | Fast & slow pointer pattern.
```

#### 9. Remove Duplicates from Unsorted Array
* **Problem**: Return array with duplicate values removed, preserving first seen order.
```javascript
function removeDuplicatesUnsorted(nums) {
  return [...new Set(nums)];
}
// Example: removeDuplicatesUnsorted([4, 2, 4, 1, 2]) -> [4, 2, 1]
// Time: O(n) | Space: O(n) | Set deduplication.
```

#### 10. Find Second Largest Number
* **Problem**: Find the second largest distinct number.
```javascript
function secondLargest(nums) {
  let first = -Infinity;
  let second = -Infinity;
  for (const n of nums) {
    if (n > first) {
      second = first;
      first = n;
    } else if (n > second && n < first) {
      second = n;
    }
  }
  return second === -Infinity ? null : second;
}
// Example: secondLargest([10, 5, 10, 8]) -> 8
// Time: O(n) | Space: O(1) | Handles identical max values correctly.
```

#### 11. Check if Array is Sorted (Ascending)
* **Problem**: Return true if array is sorted non-decreasingly.
```javascript
function isSorted(nums) {
  for (let i = 0; i < nums.length - 1; i++) {
    if (nums[i] > nums[i + 1]) return false;
  }
  return true;
}
// Example: isSorted([1, 2, 2, 5]) -> true
// Time: O(n) | Space: O(1) | Empty or 1-item arrays return true.
```

#### 12. Move All Zeroes to End (In-Place)
* **Problem**: Move all 0s to the end while maintaining relative order of non-zero elements.
```javascript
function moveZeroes(nums) {
  let nonZeroIdx = 0;
  for (let i = 0; i < nums.length; i++) {
    if (nums[i] !== 0) {
      [nums[nonZeroIdx], nums[i]] = [nums[i], nums[nonZeroIdx]];
      nonZeroIdx++;
    }
  }
  return nums;
}
// Example: moveZeroes([0, 1, 0, 3, 12]) -> [1, 3, 12, 0, 0]
// Time: O(n) | Space: O(1) | In-place partition.
```

#### 13. Rotate Array to Right by K Steps
* **Problem**: Shift elements to the right by $k$ positions.
```javascript
function rotateArray(nums, k) {
  k = k % nums.length;
  if (k === 0) return nums;
  
  const reverse = (arr, start, end) => {
    while (start < end) {
      [arr[start], arr[end]] = [arr[end], arr[start]];
      start++; end--;
    }
  };
  
  // Three reversals trick:
  reverse(nums, 0, nums.length - 1);
  reverse(nums, 0, k - 1);
  reverse(nums, k, nums.length - 1);
  return nums;
}
// Example: rotateArray([1, 2, 3, 4, 5], 2) -> [4, 5, 1, 2, 3]
// Time: O(n) | Space: O(1) | In-place 3-reversal algorithm.
```

#### 14. Linear Search
* **Problem**: Scan array to return index of target or -1.
```javascript
function linearSearch(nums, target) {
  for (let i = 0; i < nums.length; i++) {
    if (nums[i] === target) return i;
  }
  return -1;
}
// Example: linearSearch([10, 20, 30], 20) -> 1
// Time: O(n) | Space: O(1)
```

#### 15. Binary Search (Iterative)
* **Problem**: Search sorted array in logarithmic time.
```javascript
function binarySearch(nums, target) {
  let left = 0;
  let right = nums.length - 1;
  while (left <= right) {
    const mid = Math.floor(left + (right - left) / 2);
    if (nums[mid] === target) return mid;
    if (nums[mid] < target) left = mid + 1;
    else right = mid - 1;
  }
  return -1;
}
// Example: binarySearch([2, 5, 8, 12, 16], 12) -> 3
// Time: O(log n) | Space: O(1) | Mid calculation avoids integer overflow.
```

#### 16. Merge Two Sorted Arrays
* **Problem**: Combine two sorted arrays into one single sorted array.
```javascript
function mergeSortedArrays(a, b) {
  const result = [];
  let i = 0, j = 0;
  while (i < a.length && j < b.length) {
    if (a[i] <= b[j]) {
      result.push(a[i++]);
    } else {
      result.push(b[j++]);
    }
  }
  while (i < a.length) result.push(a[i++]);
  while (j < b.length) result.push(b[j++]);
  return result;
}
// Example: mergeSortedArrays([1, 3, 5], [2, 4, 6]) -> [1, 2, 3, 4, 5, 6]
// Time: O(n + m) | Space: O(n + m)
```

#### 17. Insert Element at Specific Index
* **Problem**: Insert an element into array at index $k$ without using `splice`.
```javascript
function insertAt(arr, index, element) {
  const result = [];
  for (let i = 0; i < arr.length; i++) {
    if (i === index) result.push(element);
    result.push(arr[i]);
  }
  if (index >= arr.length) result.push(element);
  return result;
}
// Example: insertAt([1, 2, 4], 2, 3) -> [1, 2, 3, 4]
// Time: O(n) | Space: O(n)
```

#### 18. Delete Element by Value
* **Problem**: Remove the first occurrence of a value from array.
```javascript
function deleteByValue(arr, value) {
  const idx = arr.indexOf(value);
  if (idx !== -1) {
    return arr.toSpliced(idx, 1);
  }
  return [...arr];
}
// Example: deleteByValue([10, 20, 30], 20) -> [10, 30]
// Time: O(n) | Space: O(n) | Pure ES2023 approach.
```

#### 19. Find Index of First Occurrence
* **Problem**: Return first index where element satisfies condition.
```javascript
function findFirstIndex(arr, predicate) {
  for (let i = 0; i < arr.length; i++) {
    if (predicate(arr[i], i, arr)) return i;
  }
  return -1;
}
// Example: findFirstIndex([1, 3, 4, 7], n => n % 2 === 0) -> 2
// Time: O(n) | Space: O(1)
```

#### 20. Find Index of Last Occurrence
* **Problem**: Return last index where element satisfies condition.
```javascript
function findLastOccurrence(arr, predicate) {
  for (let i = arr.length - 1; i >= 0; i--) {
    if (predicate(arr[i], i, arr)) return i;
  }
  return -1;
}
// Example: findLastOccurrence([2, 4, 6, 7], n => n % 2 === 0) -> 2
// Time: O(n) | Space: O(1) | Scans right to left.
```

#### 21. Filter Even Numbers
* **Problem**: Extract only even numbers.
```javascript
function filterEvens(nums) {
  return nums.filter(n => n % 2 === 0);
}
// Example: filterEvens([1, 2, 3, 4, 5, 6]) -> [2, 4, 6]
// Time: O(n) | Space: O(k)
```

#### 22. Filter Odd Numbers
* **Problem**: Extract only odd numbers.
```javascript
function filterOdds(nums) {
  return nums.filter(n => Math.abs(n % 2) === 1);
}
// Example: filterOdds([-3, -2, 0, 1, 4]) -> [-3, 1]
// Time: O(n) | Space: O(k) | Math.abs correctly handles negative odds.
```

#### 23. Square All Elements (Map)
* **Problem**: Return array with every number squared.
```javascript
function squareAll(nums) {
  return nums.map(n => n * n);
}
// Example: squareAll([2, 3, 4]) -> [4, 9, 16]
// Time: O(n) | Space: O(n)
```

#### 24. Swap Two Elements in Array
* **Problem**: Swap items at indices `i` and `j`.
```javascript
function swapElements(arr, i, j) {
  const copy = [...arr];
  [copy[i], copy[j]] = [copy[j], copy[i]];
  return copy;
}
// Example: swapElements([10, 20, 30], 0, 2) -> [30, 20, 10]
// Time: O(n) copy | Space: O(n)
```

#### 25. Check if Two Arrays are Equal (Shallow)
* **Problem**: Return true if two arrays have identical length and elements in same order.
```javascript
function arraysEqual(a, b) {
  if (a.length !== b.length) return false;
  return a.every((val, idx) => Object.is(val, b[idx]));
}
// Example: arraysEqual([1, 2], [1, 2]) -> true
// Time: O(n) | Space: O(1)
```

#### 26. Concatenate Two Arrays Without Concat / Spread
* **Problem**: Combine two arrays using manual loop.
```javascript
function manualConcat(a, b) {
  const result = new Array(a.length + b.length);
  for (let i = 0; i < a.length; i++) result[i] = a[i];
  for (let j = 0; j < b.length; j++) result[a.length + j] = b[j];
  return result;
}
// Example: manualConcat([1], [2, 3]) -> [1, 2, 3]
// Time: O(n + m) | Space: O(n + m) | Pre-allocated length.
```

#### 27. Find Missing Number in Range 1 to N
* **Problem**: Given array of length $N - 1$ containing unique numbers in range $1..N$, find the single missing number.
```javascript
function findMissingNumber(nums, n) {
  const expectedSum = (n * (n + 1)) / 2;
  const actualSum = nums.reduce((acc, curr) => acc + curr, 0);
  return expectedSum - actualSum;
}
// Example: findMissingNumber([1, 2, 4, 5], 5) -> 3
// Time: O(n) | Space: O(1) | Gauss summation formula.
```

---

### Part 2: Intermediate Array Algorithms (28 – 56)

#### 28. Two Sum (Target Pair)
* **Problem**: Given array of integers and target, return indices of the two numbers that add up to target.
```javascript
function twoSum(nums, target) {
  const seen = new Map();
  for (let i = 0; i < nums.length; i++) {
    const complement = target - nums[i];
    if (seen.has(complement)) {
      return [seen.get(complement), i];
    }
    seen.set(nums[i], i);
  }
  return [];
}
// Example: twoSum([2, 7, 11, 15], 9) -> [0, 1]
// Time: O(n) | Space: O(n) | Hash Map lookup.
```

#### 29. Three Sum (Zero Sum Triplet)
* **Problem**: Find all unique triplets $[a, b, c]$ in array such that $a + b + c = 0$.
```javascript
function threeSum(nums) {
  nums.sort((a, b) => a - b);
  const result = [];
  
  for (let i = 0; i < nums.length - 2; i++) {
    if (i > 0 && nums[i] === nums[i - 1]) continue; // Skip duplicates
    let left = i + 1;
    let right = nums.length - 1;
    
    while (left < right) {
      const sum = nums[i] + nums[left] + nums[right];
      if (sum === 0) {
        result.push([nums[i], nums[left], nums[right]]);
        while (left < right && nums[left] === nums[left + 1]) left++;
        while (left < right && nums[right] === nums[right - 1]) right--;
        left++; right--;
      } else if (sum < 0) {
        left++;
      } else {
        right--;
      }
    }
  }
  return result;
}
// Example: threeSum([-1, 0, 1, 2, -1, -4]) -> [[-1, -1, 2], [-1, 0, 1]]
// Time: O(n^2) | Space: O(1) extra (excluding output) | Two Pointers.
```

#### 30. Maximum Subarray Sum (Kadane's Algorithm)
* **Problem**: Find contiguous subarray with the largest sum.
```javascript
function maxSubArray(nums) {
  let maxSoFar = nums[0];
  let currentMax = nums[0];
  for (let i = 1; i < nums.length; i++) {
    currentMax = Math.max(nums[i], currentMax + nums[i]);
    maxSoFar = Math.max(maxSoFar, currentMax);
  }
  return maxSoFar;
}
// Example: maxSubArray([-2, 1, -3, 4, -1, 2, 1, -5, 4]) -> 6 (subarray [4, -1, 2, 1])
// Time: O(n) | Space: O(1) | Kadane's dynamic programming.
```

#### 31. Container With Most Water
* **Problem**: Find two lines that together with x-axis form container holding maximum water.
```javascript
function maxArea(height) {
  let left = 0;
  let right = height.length - 1;
  let max = 0;
  while (left < right) {
    const width = right - left;
    const h = Math.min(height[left], height[right]);
    max = Math.max(max, width * h);
    if (height[left] < height[right]) {
      left++;
    } else {
      right--;
    }
  }
  return max;
}
// Example: maxArea([1, 8, 6, 2, 5, 4, 8, 3, 7]) -> 49
// Time: O(n) | Space: O(1) | Converging Two Pointers.
```

#### 32. Product of Array Except Self
* **Problem**: Return array where `output[i]` is product of all elements except `nums[i]` in $O(n)$ time without division.
```javascript
function productExceptSelf(nums) {
  const n = nums.length;
  const output = new Array(n).fill(1);
  
  let prefix = 1;
  for (let i = 0; i < n; i++) {
    output[i] = prefix;
    prefix *= nums[i];
  }
  
  let postfix = 1;
  for (let i = n - 1; i >= 0; i--) {
    output[i] *= postfix;
    postfix *= nums[i];
  }
  return output;
}
// Example: productExceptSelf([1, 2, 3, 4]) -> [24, 12, 8, 6]
// Time: O(n) | Space: O(1) extra | Prefix and Postfix pass.
```

#### 33. Majority Element (Boyer-Moore Voting Algorithm)
* **Problem**: Find element appearing more than $\lfloor n/2 \rfloor$ times.
```javascript
function majorityElement(nums) {
  let candidate = null;
  let count = 0;
  for (const n of nums) {
    if (count === 0) candidate = n;
    count += (n === candidate) ? 1 : -1;
  }
  return candidate;
}
// Example: majorityElement([2, 2, 1, 1, 1, 2, 2]) -> 2
// Time: O(n) | Space: O(1) | Boyer-Moore algorithm.
```

#### 34. Best Time to Buy and Sell Stock (Single Transaction)
* **Problem**: Maximize profit from at most one buy and one sell.
```javascript
function maxProfit(prices) {
  let minPrice = Infinity;
  let maxProfit = 0;
  for (const p of prices) {
    if (p < minPrice) {
      minPrice = p;
    } else if (p - minPrice > maxProfit) {
      maxProfit = p - minPrice;
    }
  }
  return maxProfit;
}
// Example: maxProfit([7, 1, 5, 3, 6, 4]) -> 5 (buy at 1, sell at 6)
// Time: O(n) | Space: O(1)
```

#### 35. Best Time to Buy and Sell Stock II (Multiple Transactions)
* **Problem**: Maximize profit by making as many transactions as desired.
```javascript
function maxProfitII(prices) {
  let totalProfit = 0;
  for (let i = 1; i < prices.length; i++) {
    if (prices[i] > prices[i - 1]) {
      totalProfit += prices[i] - prices[i - 1];
    }
  }
  return totalProfit;
}
// Example: maxProfitII([7, 1, 5, 3, 6, 4]) -> 7 (buy 1 sell 5, buy 3 sell 6)
// Time: O(n) | Space: O(1) | Greedy valley-to-peak capture.
```

#### 36. Subarray Sum Equals K
* **Problem**: Find total number of continuous subarrays whose sum equals $k$.
```javascript
function subarraySum(nums, k) {
  const prefixCount = new Map([[0, 1]]);
  let currentSum = 0;
  let matches = 0;
  
  for (const n of nums) {
    currentSum += n;
    if (prefixCount.has(currentSum - k)) {
      matches += prefixCount.get(currentSum - k);
    }
    prefixCount.set(currentSum, (prefixCount.get(currentSum) || 0) + 1);
  }
  return matches;
}
// Example: subarraySum([1, 1, 1], 2) -> 2
// Time: O(n) | Space: O(n) | Prefix sum + Map pattern.
```

#### 37. Longest Consecutive Sequence
* **Problem**: Given unsorted array, find length of longest consecutive elements sequence in $O(n)$ time.
```javascript
function longestConsecutive(nums) {
  const numSet = new Set(nums);
  let longestStreak = 0;
  
  for (const num of numSet) {
    // Only start counting if num is the beginning of a sequence:
    if (!numSet.has(num - 1)) {
      let currentNum = num;
      let currentStreak = 1;
      while (numSet.has(currentNum + 1)) {
        currentNum++;
        currentStreak++;
      }
      longestStreak = Math.max(longestStreak, currentStreak);
    }
  }
  return longestStreak;
}
// Example: longestConsecutive([100, 4, 200, 1, 3, 2]) -> 4 ([1, 2, 3, 4])
// Time: O(n) | Space: O(n) | Set lookup avoids O(n log n) sorting.
```

#### 38. Merge Overlapping Intervals
* **Problem**: Merge all overlapping intervals into non-overlapping intervals.
```javascript
function mergeIntervals(intervals) {
  if (intervals.length <= 1) return intervals;
  intervals.sort((a, b) => a[0] - b[0]);
  
  const merged = [intervals[0]];
  for (let i = 1; i < intervals.length; i++) {
    const prev = merged[merged.length - 1];
    const curr = intervals[i];
    
    if (curr[0] <= prev[1]) {
      prev[1] = Math.max(prev[1], curr[1]);
    } else {
      merged.push(curr);
    }
  }
  return merged;
}
// Example: mergeIntervals([[1, 3], [2, 6], [8, 10], [15, 18]]) -> [[1, 6], [8, 10], [15, 18]]
// Time: O(n log n) | Space: O(n)
```

#### 39. Insert Interval
* **Problem**: Insert a new interval into sorted non-overlapping intervals and merge if necessary.
```javascript
function insertInterval(intervals, newInterval) {
  const result = [];
  let i = 0;
  const n = intervals.length;
  
  // 1. Add all intervals before newInterval:
  while (i < n && intervals[i][1] < newInterval[0]) {
    result.push(intervals[i++]);
  }
  
  // 2. Merge overlapping intervals:
  while (i < n && intervals[i][0] <= newInterval[1]) {
    newInterval[0] = Math.min(newInterval[0], intervals[i][0]);
    newInterval[1] = Math.max(newInterval[1], intervals[i][1]);
    i++;
  }
  result.push(newInterval);
  
  // 3. Add remaining intervals:
  while (i < n) {
    result.push(intervals[i++]);
  }
  return result;
}
// Example: insertInterval([[1, 3], [6, 9]], [2, 5]) -> [[1, 5], [6, 9]]
// Time: O(n) | Space: O(n)
```

#### 40. Non-Overlapping Intervals (Erase Minimum Overlaps)
* **Problem**: Find minimum number of intervals to remove to make remainder non-overlapping.
```javascript
function eraseOverlapIntervals(intervals) {
  if (intervals.length === 0) return 0;
  intervals.sort((a, b) => a[1] - b[1]); // Sort by END time
  
  let nonOverlappingCount = 1;
  let lastEnd = intervals[0][1];
  
  for (let i = 1; i < intervals.length; i++) {
    if (intervals[i][0] >= lastEnd) {
      nonOverlappingCount++;
      lastEnd = intervals[i][1];
    }
  }
  return intervals.length - nonOverlappingCount;
}
// Example: eraseOverlapIntervals([[1, 2], [2, 3], [3, 4], [1, 3]]) -> 1
// Time: O(n log n) | Space: O(1) | Greedy interval scheduling.
```

#### 41. Sort Colors / Dutch National Flag (3-Way Partition)
* **Problem**: Sort array of 0s, 1s, and 2s in-place in a single pass.
```javascript
function sortColors(nums) {
  let low = 0;
  let mid = 0;
  let high = nums.length - 1;
  
  while (mid <= high) {
    if (nums[mid] === 0) {
      [nums[low], nums[mid]] = [nums[mid], nums[low]];
      low++; mid++;
    } else if (nums[mid] === 1) {
      mid++;
    } else {
      [nums[mid], nums[high]] = [nums[high], nums[mid]];
      high--;
    }
  }
  return nums;
}
// Example: sortColors([2, 0, 2, 1, 1, 0]) -> [0, 0, 1, 1, 2, 2]
// Time: O(n) | Space: O(1) | Dutch National Flag algorithm.
```

#### 42. Next Permutation
* **Problem**: Rearrange numbers into lexicographically next greater permutation in-place.
```javascript
function nextPermutation(nums) {
  let i = nums.length - 2;
  while (i >= 0 && nums[i] >= nums[i + 1]) i--;
  
  if (i >= 0) {
    let j = nums.length - 1;
    while (nums[j] <= nums[i]) j--;
    [nums[i], nums[j]] = [nums[j], nums[i]];
  }
  
  // Reverse suffix:
  let l = i + 1, r = nums.length - 1;
  while (l < r) {
    [nums[l], nums[r]] = [nums[r], nums[l]];
    l++; r--;
  }
  return nums;
}
// Example: nextPermutation([1, 2, 3]) -> [1, 3, 2]
// Time: O(n) | Space: O(1)
```

#### 43. Search in Rotated Sorted Array
* **Problem**: Search target in sorted array that has been rotated at unknown pivot in $O(\log n)$.
```javascript
function searchRotated(nums, target) {
  let left = 0;
  let right = nums.length - 1;
  
  while (left <= right) {
    const mid = Math.floor((left + right) / 2);
    if (nums[mid] === target) return mid;
    
    // Left half is sorted:
    if (nums[left] <= nums[mid]) {
      if (nums[left] <= target && target < nums[mid]) {
        right = mid - 1;
      } else {
        left = mid + 1;
      }
    } else { // Right half is sorted
      if (nums[mid] < target && target <= nums[right]) {
        left = mid + 1;
      } else {
        right = mid - 1;
      }
    }
  }
  return -1;
}
// Example: searchRotated([4, 5, 6, 7, 0, 1, 2], 0) -> 4
// Time: O(log n) | Space: O(1) | Modified binary search.
```

#### 44. Find Minimum in Rotated Sorted Array
* **Problem**: Find the minimum element in rotated sorted array in $O(\log n)$.
```javascript
function findMinRotated(nums) {
  let left = 0;
  let right = nums.length - 1;
  while (left < right) {
    const mid = Math.floor((left + right) / 2);
    if (nums[mid] > nums[right]) {
      left = mid + 1;
    } else {
      right = mid;
    }
  }
  return nums[left];
}
// Example: findMinRotated([3, 4, 5, 1, 2]) -> 1
// Time: O(log n) | Space: O(1)
```

#### 45. Peak Element in Array
* **Problem**: Find a peak element ($nums[i] > nums[i - 1]$ and $nums[i] > nums[i + 1]$) in $O(\log n)$.
```javascript
function findPeakElement(nums) {
  let left = 0;
  let right = nums.length - 1;
  while (left < right) {
    const mid = Math.floor((left + right) / 2);
    if (nums[mid] > nums[mid + 1]) {
      right = mid;
    } else {
      left = mid + 1;
    }
  }
  return left;
}
// Example: findPeakElement([1, 2, 3, 1]) -> 2 (value 3 is peak)
// Time: O(log n) | Space: O(1)
```

#### 46. Find All Duplicates in an Array ($O(1)$ Extra Space)
* **Problem**: Array of size $N$ with elements in $1..N$, find all elements appearing twice without extra hash set.
```javascript
function findDuplicates(nums) {
  const result = [];
  for (let i = 0; i < nums.length; i++) {
    const targetIdx = Math.abs(nums[i]) - 1;
    if (nums[targetIdx] < 0) {
      result.push(Math.abs(nums[i]));
    } else {
      nums[targetIdx] = -nums[targetIdx]; // Mark seen via negation
    }
  }
  return result;
}
// Example: findDuplicates([4, 3, 2, 7, 8, 2, 3, 1]) -> [2, 3]
// Time: O(n) | Space: O(1) extra | Sign-negation index hashing.
```

#### 47. Trapping Rain Water
* **Problem**: Compute how much water elevation map can trap after raining.
```javascript
function trapRainWater(height) {
  let left = 0, right = height.length - 1;
  let leftMax = 0, rightMax = 0;
  let water = 0;
  
  while (left < right) {
    if (height[left] <= height[right]) {
      if (height[left] >= leftMax) leftMax = height[left];
      else water += leftMax - height[left];
      left++;
    } else {
      if (height[right] >= rightMax) rightMax = height[right];
      else water += rightMax - height[right];
      right--;
    }
  }
  return water;
}
// Example: trapRainWater([0, 1, 0, 2, 1, 0, 1, 3, 2, 1, 2, 1]) -> 6
// Time: O(n) | Space: O(1) | Two Pointers.
```

#### 48. Daily Temperatures
* **Problem**: For each day, return number of days until a warmer temperature.
```javascript
function dailyTemperatures(temps) {
  const result = new Array(temps.length).fill(0);
  const stack = []; // Stores indices
  
  for (let i = 0; i < temps.length; i++) {
    while (stack.length > 0 && temps[i] > temps[stack[stack.length - 1]]) {
      const prevIdx = stack.pop();
      result[prevIdx] = i - prevIdx;
    }
    stack.push(i);
  }
  return result;
}
// Example: dailyTemperatures([73, 74, 75, 71, 69, 72, 76, 73]) -> [1, 1, 4, 2, 1, 1, 0, 0]
// Time: O(n) | Space: O(n) | Monotonic decreasing stack.
```

#### 49. Next Greater Element I
* **Problem**: Find the next greater element for each number in `nums1` based on position in `nums2`.
```javascript
function nextGreaterElement(nums1, nums2) {
  const nextGreaterMap = new Map();
  const stack = [];
  
  for (const n of nums2) {
    while (stack.length > 0 && n > stack[stack.length - 1]) {
      nextGreaterMap.set(stack.pop(), n);
    }
    stack.push(n);
  }
  
  return nums1.map(n => nextGreaterMap.get(n) ?? -1);
}
// Example: nextGreaterElement([4, 1, 2], [1, 3, 4, 2]) -> [-1, 3, -1]
// Time: O(n + m) | Space: O(m)
```

#### 50. Sliding Window Maximum
* **Problem**: Return max element in sliding window of size $k$ moving across array.
```javascript
function maxSlidingWindow(nums, k) {
  const deque = []; // Stores indices of monotonic decreasing elements
  const result = [];
  
  for (let i = 0; i < nums.length; i++) {
    // 1. Remove indices outside current window:
    if (deque.length > 0 && deque[0] <= i - k) deque.shift();
    
    // 2. Maintain decreasing order:
    while (deque.length > 0 && nums[deque[deque.length - 1]] < nums[i]) {
      deque.pop();
    }
    deque.push(i);
    
    // 3. Window reached size k:
    if (i >= k - 1) result.push(nums[deque[0]]);
  }
  return result;
}
// Example: maxSlidingWindow([1, 3, -1, -3, 5, 3, 6, 7], 3) -> [3, 3, 5, 5, 6, 7]
// Time: O(n) | Space: O(k) | Monotonic deque.
```

#### 51. Minimum Size Subarray Sum
* **Problem**: Find minimal length of contiguous subarray of which sum $\ge target$.
```javascript
function minSubArrayLen(target, nums) {
  let minLen = Infinity;
  let sum = 0;
  let left = 0;
  
  for (let right = 0; right < nums.length; right++) {
    sum += nums[right];
    while (sum >= target) {
      minLen = Math.min(minLen, right - left + 1);
      sum -= nums[left++];
    }
  }
  return minLen === Infinity ? 0 : minLen;
}
// Example: minSubArrayLen(7, [2, 3, 1, 2, 4, 3]) -> 2 ([4, 3])
// Time: O(n) | Space: O(1) | Dynamic Sliding Window.
```

#### 52. Maximum Product Subarray
* **Problem**: Find contiguous subarray with largest product.
```javascript
function maxProduct(nums) {
  let maxProd = nums[0];
  let minProd = nums[0];
  let result = nums[0];
  
  for (let i = 1; i < nums.length; i++) {
    const n = nums[i];
    if (n < 0) [maxProd, minProd] = [minProd, maxProd]; // Swaps when negative!
    
    maxProd = Math.max(n, maxProd * n);
    minProd = Math.min(n, minProd * n);
    result = Math.max(result, maxProd);
  }
  return result;
}
// Example: maxProduct([2, 3, -2, 4]) -> 6
// Time: O(n) | Space: O(1)
```

#### 53. Jump Game I (Can Reach End)
* **Problem**: Determine if you can reach last index starting from index 0.
```javascript
function canJump(nums) {
  let maxReach = 0;
  for (let i = 0; i < nums.length; i++) {
    if (i > maxReach) return false;
    maxReach = Math.max(maxReach, i + nums[i]);
    if (maxReach >= nums.length - 1) return true;
  }
  return true;
}
// Example: canJump([2, 3, 1, 1, 4]) -> true
// Time: O(n) | Space: O(1) | Greedy furthest reachable index.
```

#### 54. Jump Game II (Minimum Jumps to Reach End)
* **Problem**: Find minimum number of jumps to reach end.
```javascript
function jump(nums) {
  let jumps = 0, currentEnd = 0, furthest = 0;
  for (let i = 0; i < nums.length - 1; i++) {
    furthest = Math.max(furthest, i + nums[i]);
    if (i === currentEnd) {
      jumps++;
      currentEnd = furthest;
      if (currentEnd >= nums.length - 1) break;
    }
  }
  return jumps;
}
// Example: jump([2, 3, 1, 1, 4]) -> 2
// Time: O(n) | Space: O(1) | Greedy BFS interval jumps.
```

#### 55. Gas Station (Circular Tour)
* **Problem**: Find starting gas station index from which you can travel around circuit clockwise once without running out of fuel.
```javascript
function canCompleteCircuit(gas, cost) {
  let totalSurplus = 0;
  let currentSurplus = 0;
  let startIdx = 0;
  
  for (let i = 0; i < gas.length; i++) {
    const diff = gas[i] - cost[i];
    totalSurplus += diff;
    currentSurplus += diff;
    if (currentSurplus < 0) {
      startIdx = i + 1;
      currentSurplus = 0;
    }
  }
  return totalSurplus >= 0 ? startIdx : -1;
}
// Example: canCompleteCircuit([1, 2, 3, 4, 5], [3, 4, 5, 1, 2]) -> 3
// Time: O(n) | Space: O(1) | Single pass greedy reset.
```

#### 56. Partition Equal Subset Sum
* **Problem**: Determine if array can be partitioned into two subsets with equal sum.
```javascript
function canPartition(nums) {
  const sum = nums.reduce((acc, curr) => acc + curr, 0);
  if (sum % 2 !== 0) return false;
  const target = sum / 2;
  
  let dp = new Set([0]);
  for (const n of nums) {
    const nextDp = new Set(dp);
    for (const val of dp) {
      if (val + n === target) return true;
      if (val + n < target) nextDp.add(val + n);
    }
    dp = nextDp;
  }
  return dp.has(target);
}
// Example: canPartition([1, 5, 11, 5]) -> true ([1, 5, 5] and [11])
// Time: O(n * target) | Space: O(target) | 0/1 Knapsack DP.
```


---

### Part 3: Advanced Array Algorithms (57 – 82)

#### 57. Median of Two Sorted Arrays
* **Problem**: Given two sorted arrays, find the median of the two sorted arrays in $O(\log(\min(m, n)))$ time.
```javascript
function findMedianSortedArrays(nums1, nums2) {
  if (nums1.length > nums2.length) return findMedianSortedArrays(nums2, nums1);
  const m = nums1.length, n = nums2.length;
  let low = 0, high = m;
  
  while (low <= high) {
    const partitionX = Math.floor((low + high) / 2);
    const partitionY = Math.floor((m + n + 1) / 2) - partitionX;
    
    const maxX = partitionX === 0 ? -Infinity : nums1[partitionX - 1];
    const minX = partitionX === m ? Infinity : nums1[partitionX];
    
    const maxY = partitionY === 0 ? -Infinity : nums2[partitionY - 1];
    const minY = partitionY === n ? Infinity : nums2[partitionY];
    
    if (maxX <= minY && maxY <= minX) {
      if ((m + n) % 2 === 0) {
        return (Math.max(maxX, maxY) + Math.min(minX, minY)) / 2;
      } else {
        return Math.max(maxX, maxY);
      }
    } else if (maxX > minY) {
      high = partitionX - 1;
    } else {
      low = partitionX + 1;
    }
  }
}
// Example: findMedianSortedArrays([1, 3], [2]) -> 2
// Time: O(log(min(m, n))) | Space: O(1) | Binary search on partition.
```

#### 58. Longest Increasing Subsequence ($O(n \log n)$)
* **Problem**: Find length of longest strictly increasing subsequence.
```javascript
function lengthOfLIS(nums) {
  const tails = [];
  for (const x of nums) {
    let i = 0, j = tails.length;
    while (i < j) {
      const mid = Math.floor((i + j) / 2);
      if (tails[mid] < x) i = mid + 1;
      else j = mid;
    }
    tails[i] = x;
  }
  return tails.length;
}
// Example: lengthOfLIS([10, 9, 2, 5, 3, 7, 101, 18]) -> 4 ([2, 3, 7, 101])
// Time: O(n log n) | Space: O(n) | Patience sorting + binary search.
```

#### 59. Largest Rectangle in Histogram
* **Problem**: Find the area of largest rectangle in histogram bars.
```javascript
function largestRectangleArea(heights) {
  const stack = []; // Monotonic increasing bar indices
  let maxArea = 0;
  const n = heights.length;
  
  for (let i = 0; i <= n; i++) {
    const currentH = i === n ? 0 : heights[i];
    while (stack.length > 0 && currentH < heights[stack[stack.length - 1]]) {
      const h = heights[stack.pop()];
      const w = stack.length === 0 ? i : i - stack[stack.length - 1] - 1;
      maxArea = Math.max(maxArea, h * w);
    }
    stack.push(i);
  }
  return maxArea;
}
// Example: largestRectangleArea([2, 1, 5, 6, 2, 3]) -> 10
// Time: O(n) | Space: O(n) | Monotonic Stack.
```

#### 60. Maximal Rectangle in 2D Binary Matrix
* **Problem**: Find largest rectangle containing only 1s in a binary matrix.
```javascript
function maximalRectangle(matrix) {
  if (matrix.length === 0 || matrix[0].length === 0) return 0;
  const cols = matrix[0].length;
  const heights = new Array(cols).fill(0);
  let maxArea = 0;
  
  for (let r = 0; r < matrix.length; r++) {
    for (let c = 0; c < cols; c++) {
      heights[c] = matrix[r][c] === "1" ? heights[c] + 1 : 0;
    }
    maxArea = Math.max(maxArea, largestRectangleArea(heights));
  }
  return maxArea;
}
// Example: maximalRectangle([["1","0","1","0","0"],["1","0","1","1","1"],["1","1","1","1","1"],["1","0","0","1","0"]]) -> 6
// Time: O(r * c) | Space: O(c) | Dynamic histogram projection.
```

#### 61. Count Inversions in Array
* **Problem**: Count pairs $(i, j)$ such that $i < j$ and $arr[i] > arr[j]$.
```javascript
function countInversions(arr) {
  let inversions = 0;
  function mergeSort(list) {
    if (list.length <= 1) return list;
    const mid = Math.floor(list.length / 2);
    const left = mergeSort(list.slice(0, mid));
    const right = mergeSort(list.slice(mid));
    return merge(left, right);
  }
  function merge(left, right) {
    const res = [];
    let i = 0, j = 0;
    while (i < left.length && j < right.length) {
      if (left[i] <= right[j]) {
        res.push(left[i++]);
      } else {
        inversions += left.length - i; // All remaining elements in left are > right[j]
        res.push(right[j++]);
      }
    }
    return res.concat(left.slice(i)).concat(right.slice(j));
  }
  mergeSort(arr);
  return inversions;
}
// Example: countInversions([8, 4, 2, 1]) -> 6
// Time: O(n log n) | Space: O(n) | Divide and conquer merge sort.
```

#### 62. Kth Largest Element in an Array (Quickselect)
* **Problem**: Find the $k$-th largest element in unsorted array in $O(n)$ average time.
```javascript
function findKthLargest(nums, k) {
  const target = nums.length - k;
  function quickselect(left, right) {
    const pivot = nums[right];
    let p = left;
    for (let i = left; i < right; i++) {
      if (nums[i] <= pivot) {
        [nums[p], nums[i]] = [nums[i], nums[p]];
        p++;
      }
    }
    [nums[p], nums[right]] = [nums[right], nums[p]];
    if (p === target) return nums[p];
    if (p < target) return quickselect(p + 1, right);
    return quickselect(left, p - 1);
  }
  return quickselect(0, nums.length - 1);
}
// Example: findKthLargest([3, 2, 1, 5, 6, 4], 2) -> 5
// Time: O(n) average, O(n^2) worst | Space: O(1) | Quickselect in-place.
```

#### 63. Top K Frequent Elements ($O(n)$ Bucket Sort)
* **Problem**: Return the $k$ most frequent elements in $O(n)$ time.
```javascript
function topKFrequent(nums, k) {
  const countMap = new Map();
  for (const n of nums) countMap.set(n, (countMap.get(n) || 0) + 1);
  
  const buckets = Array.from({ length: nums.length + 1 }, () => []);
  for (const [num, freq] of countMap.entries()) {
    buckets[freq].push(num);
  }
  
  const result = [];
  for (let i = buckets.length - 1; i >= 0 && result.length < k; i--) {
    for (const num of buckets[i]) {
      result.push(num);
      if (result.length === k) break;
    }
  }
  return result;
}
// Example: topKFrequent([1, 1, 1, 2, 2, 3], 2) -> [1, 2]
// Time: O(n) | Space: O(n) | Bucket sort by frequency.
```

#### 64. Longest Substring Without Repeating Characters
* **Problem**: Find length of longest substring without duplicate characters.
```javascript
function lengthOfLongestSubstring(s) {
  const lastIndex = new Map();
  let maxLen = 0, left = 0;
  for (let right = 0; right < s.length; right++) {
    const char = s[right];
    if (lastIndex.has(char) && lastIndex.get(char) >= left) {
      left = lastIndex.get(char) + 1;
    }
    lastIndex.set(char, right);
    maxLen = Math.max(maxLen, right - left + 1);
  }
  return maxLen;
}
// Example: lengthOfLongestSubstring("abcabcbb") -> 3 ("abc")
// Time: O(n) | Space: O(min(m, n)) | Dynamic Sliding Window.
```

#### 65. Subarrays with K Different Integers
* **Problem**: Count contiguous subarrays containing exactly $k$ distinct integers.
```javascript
function subarraysWithKDistinct(nums, k) {
  function atMostK(kLimit) {
    if (kLimit === 0) return 0;
    const count = new Map();
    let left = 0, res = 0;
    for (let right = 0; right < nums.length; right++) {
      count.set(nums[right], (count.get(nums[right]) || 0) + 1);
      while (count.size > kLimit) {
        count.set(nums[left], count.get(nums[left]) - 1);
        if (count.get(nums[left]) === 0) count.delete(nums[left]);
        left++;
      }
      res += right - left + 1;
    }
    return res;
  }
  return atMostK(k) - atMostK(k - 1);
}
// Example: subarraysWithKDistinct([1, 2, 1, 2, 3], 2) -> 7
// Time: O(n) | Space: O(k) | Exact(k) = AtMost(k) - AtMost(k-1).
```

#### 66. Shortest Unsorted Continuous Subarray
* **Problem**: Find length of shortest continuous subarray that, if sorted, sorts the entire array.
```javascript
function findUnsortedSubarray(nums) {
  let n = nums.length;
  let end = -1, start = -1;
  let max = nums[0], min = nums[n - 1];
  
  for (let i = 1; i < n; i++) {
    max = Math.max(max, nums[i]);
    if (nums[i] < max) end = i;
  }
  for (let i = n - 2; i >= 0; i--) {
    min = Math.min(min, nums[i]);
    if (nums[i] > min) start = i;
  }
  return end === -1 ? 0 : end - start + 1;
}
// Example: findUnsortedSubarray([2, 6, 4, 8, 10, 9, 15]) -> 5 ([6, 4, 8, 10, 9])
// Time: O(n) | Space: O(1) | Boundary scanning.
```

#### 67. Wiggle Sort II
* **Problem**: Reorder array such that $nums[0] < nums[1] > nums[2] < nums[3]...$
```javascript
function wiggleSort(nums) {
  const sorted = [...nums].sort((a, b) => a - b);
  let n = nums.length;
  let mid = Math.floor((n + 1) / 2);
  let left = mid - 1;
  let right = n - 1;
  
  for (let i = 0; i < n; i++) {
    nums[i] = i % 2 === 0 ? sorted[left--] : sorted[right--];
  }
  return nums;
}
// Example: wiggleSort([1, 5, 1, 1, 6, 4]) -> [1, 6, 1, 5, 1, 4]
// Time: O(n log n) | Space: O(n)
```

#### 68. Find Peak Element II (2D Matrix Peak)
* **Problem**: Find peak in $M \times N$ grid strictly greater than up, down, left, right neighbors in $O(m \log n)$.
```javascript
function findPeakGrid(mat) {
  let startCol = 0, endCol = mat[0].length - 1;
  while (startCol <= endCol) {
    const midCol = Math.floor((startCol + endCol) / 2);
    let maxRow = 0;
    for (let r = 0; r < mat.length; r++) {
      if (mat[r][midCol] > mat[maxRow][midCol]) maxRow = r;
    }
    const leftIsBigger = midCol > 0 && mat[maxRow][midCol - 1] > mat[maxRow][midCol];
    const rightIsBigger = midCol < mat[0].length - 1 && mat[maxRow][midCol + 1] > mat[maxRow][midCol];
    
    if (!leftIsBigger && !rightIsBigger) return [maxRow, midCol];
    if (rightIsBigger) startCol = midCol + 1;
    else endCol = midCol - 1;
  }
  return [-1, -1];
}
// Example: findPeakGrid([[1, 4], [3, 2]]) -> [0, 1] (value 4)
// Time: O(r * log c) | Space: O(1) | Binary search on columns.
```

#### 69. Candy Distribution
* **Problem**: Distribute minimum candies to children standing in a line such that higher-rated children get more candy than neighbors.
```javascript
function candy(ratings) {
  const n = ratings.length;
  const candies = new Array(n).fill(1);
  
  // Left-to-right pass:
  for (let i = 1; i < n; i++) {
    if (ratings[i] > ratings[i - 1]) candies[i] = candies[i - 1] + 1;
  }
  // Right-to-left pass:
  for (let i = n - 2; i >= 0; i--) {
    if (ratings[i] > ratings[i + 1]) candies[i] = Math.max(candies[i], candies[i + 1] + 1);
  }
  return candies.reduce((sum, c) => sum + c, 0);
}
// Example: candy([1, 0, 2]) -> 5 ([2, 1, 2])
// Time: O(n) | Space: O(n) | Two-pass greedy.
```

#### 70. First Missing Positive
* **Problem**: Given unsorted integer array, find smallest missing positive integer in $O(n)$ time and $O(1)$ extra space.
```javascript
function firstMissingPositive(nums) {
  const n = nums.length;
  // Place each number in range 1..n at index n - 1 (Cyclic Sort)
  for (let i = 0; i < n; i++) {
    while (nums[i] > 0 && nums[i] <= n && nums[nums[i] - 1] !== nums[i]) {
      const targetIdx = nums[i] - 1;
      [nums[i], nums[targetIdx]] = [nums[targetIdx], nums[i]];
    }
  }
  for (let i = 0; i < n; i++) {
    if (nums[i] !== i + 1) return i + 1;
  }
  return n + 1;
}
// Example: firstMissingPositive([3, 4, -1, 1]) -> 2
// Time: O(n) | Space: O(1) | Cyclic sort mapping.
```

#### 71. Russian Doll Envelopes
* **Problem**: Find max number of envelopes you can Russian doll (fit inside one another).
```javascript
function maxEnvelopes(envelopes) {
  // Sort width ascending, and height descending for same width:
  envelopes.sort((a, b) => a[0] === b[0] ? b[1] - a[1] : a[0] - b[0]);
  // LIS on heights:
  const heights = envelopes.map(e => e[1]);
  return lengthOfLIS(heights);
}
// Example: maxEnvelopes([[5,4],[6,4],[6,7],[2,3]]) -> 3 ([2,3] -> [5,4] -> [6,7])
// Time: O(n log n) | Space: O(n)
```

#### 72. The Skyline Problem
* **Problem**: Return key points forming outline of city buildings $[L, R, H]$.
```javascript
function getSkyline(buildings) {
  const events = [];
  for (const [l, r, h] of buildings) {
    events.push([l, -h]); // Start of building (negative height)
    events.push([r, h]);  // End of building (positive height)
  }
  // Sort events by x coordinate:
  events.sort((a, b) => a[0] === b[0] ? a[1] - b[1] : a[0] - b[0]);
  
  const result = [];
  const heights = [0]; // active heights multiset
  let prevMax = 0;
  
  for (const [x, h] of events) {
    if (h < 0) {
      heights.push(-h);
      heights.sort((a, b) => b - a);
    } else {
      const idx = heights.indexOf(h);
      heights.splice(idx, 1);
    }
    const currentMax = heights[0];
    if (currentMax !== prevMax) {
      result.push([x, currentMax]);
      prevMax = currentMax;
    }
  }
  return result;
}
// Example: getSkyline([[2,9,10],[3,7,15],[5,12,12]])
// Time: O(n^2) with array multiset, O(n log n) with MaxHeap | Space: O(n)
```

#### 73. Burst Balloons
* **Problem**: Burst balloons to maximize coins collected $nums[i-1] * nums[i] * nums[i+1]$.
```javascript
function maxCoins(nums) {
  const vals = [1, ...nums, 1];
  const n = vals.length;
  const dp = Array.from({ length: n }, () => Array(n).fill(0));
  
  for (let len = 1; len <= nums.length; len++) {
    for (let left = 1; left <= nums.length - len + 1; left++) {
      const right = left + len - 1;
      for (let k = left; k <= right; k++) {
        const gain = vals[left - 1] * vals[k] * vals[right + 1];
        const total = gain + dp[left][k - 1] + dp[k + 1][right];
        dp[left][right] = Math.max(dp[left][right], total);
      }
    }
  }
  return dp[1][nums.length];
}
// Example: maxCoins([3, 1, 5, 8]) -> 167
// Time: O(n^3) | Space: O(n^2) | Interval Dynamic Programming.
```

#### 74. Count of Smaller Numbers After Self
* **Problem**: For each $nums[i]$, count number of $nums[j]$ such that $j > i$ and $nums[j] < nums[i]$.
```javascript
function countSmaller(nums) {
  const n = nums.length;
  const result = new Array(n).fill(0);
  const indexed = nums.map((val, idx) => ({ val, idx }));
  
  function mergeSort(arr) {
    if (arr.length <= 1) return arr;
    const mid = Math.floor(arr.length / 2);
    const left = mergeSort(arr.slice(0, mid));
    const right = mergeSort(arr.slice(mid));
    
    const merged = [];
    let i = 0, j = 0, rightCounter = 0;
    while (i < left.length && j < right.length) {
      if (right[j].val < left[i].val) {
        rightCounter++;
        merged.push(right[j++]);
      } else {
        result[left[i].idx] += rightCounter;
        merged.push(left[i++]);
      }
    }
    while (i < left.length) {
      result[left[i].idx] += rightCounter;
      merged.push(left[i++]);
    }
    while (j < right.length) merged.push(right[j++]);
    return merged;
  }
  mergeSort(indexed);
  return result;
}
// Example: countSmaller([5, 2, 6, 1]) -> [2, 1, 1, 0]
// Time: O(n log n) | Space: O(n) | Merge sort counting.
```

#### 75. Maximum Gap
* **Problem**: Given unsorted array, find maximum difference between successive elements in sorted form in $O(n)$ time.
```javascript
function maximumGap(nums) {
  if (nums.length < 2) return 0;
  const min = Math.min(...nums);
  const max = Math.max(...nums);
  if (min === max) return 0;
  
  const n = nums.length;
  const bucketSize = Math.max(1, Math.floor((max - min) / (n - 1)));
  const bucketCount = Math.floor((max - min) / bucketSize) + 1;
  
  const buckets = Array.from({ length: bucketCount }, () => ({
    min: Infinity, max: -Infinity, hasNum: false
  }));
  
  for (const num of nums) {
    const bIdx = Math.floor((num - min) / bucketSize);
    buckets[bIdx].hasNum = true;
    buckets[bIdx].min = Math.min(buckets[bIdx].min, num);
    buckets[bIdx].max = Math.max(buckets[bIdx].max, num);
  }
  
  let maxGap = 0;
  let prevMax = min;
  for (const b of buckets) {
    if (!b.hasNum) continue;
    maxGap = Math.max(maxGap, b.min - prevMax);
    prevMax = b.max;
  }
  return maxGap;
}
// Example: maximumGap([3, 6, 9, 1]) -> 3
// Time: O(n) | Space: O(n) | Pigeonhole Bucket Sort.
```

#### 76. Create Maximum Number from Two Arrays
* **Problem**: Create largest number of length $k$ from two digit arrays preserving relative order.
```javascript
function maxNumber(nums1, nums2, k) {
  function maxSingleArray(nums, count) {
    const stack = [];
    let drop = nums.length - count;
    for (const num of nums) {
      while (drop > 0 && stack.length > 0 && stack[stack.length - 1] < num) {
        stack.pop();
        drop--;
      }
      stack.push(num);
    }
    return stack.slice(0, count);
  }
  function isGreater(sub1, i, sub2, j) {
    while (i < sub1.length && j < sub2.length && sub1[i] === sub2[j]) {
      i++; j++;
    }
    return j === sub2.length || (i < sub1.length && sub1[i] > sub2[j]);
  }
  function merge(sub1, sub2) {
    const res = [];
    let i = 0, j = 0;
    while (i < sub1.length || j < sub2.length) {
      res.push(isGreater(sub1, i, sub2, j) ? sub1[i++] : sub2[j++]);
    }
    return res;
  }
  
  let best = [];
  for (let len1 = Math.max(0, k - nums2.length); len1 <= Math.min(k, nums1.length); len1++) {
    const cand = merge(maxSingleArray(nums1, len1), maxSingleArray(nums2, k - len1));
    if (isGreater(cand, 0, best, 0)) best = cand;
  }
  return best;
}
// Example: maxNumber([3, 4, 6, 5], [9, 1, 2, 5, 8, 3], 5) -> [9, 8, 6, 5, 3]
// Time: O(k * (n + m)) | Space: O(k)
```

#### 77. Sliding Window Median
* **Problem**: Return median for each window of size $k$ as it moves across array.
```javascript
function medianSlidingWindow(nums, k) {
  const window = nums.slice(0, k).sort((a, b) => a - b);
  const result = [];
  const getMedian = () => k % 2 === 1 ? window[Math.floor(k / 2)] : (window[k / 2 - 1] + window[k / 2]) / 2;
  
  result.push(getMedian());
  for (let i = k; i < nums.length; i++) {
    // Remove element sliding out:
    const removeIdx = window.indexOf(nums[i - k]);
    window.splice(removeIdx, 1);
    
    // Insert new element in sorted position (Binary search insertion):
    let low = 0, high = window.length;
    while (low < high) {
      const mid = Math.floor((low + high) / 2);
      if (window[mid] < nums[i]) low = mid + 1;
      else high = mid;
    }
    window.splice(low, 0, nums[i]);
    result.push(getMedian());
  }
  return result;
}
// Example: medianSlidingWindow([1, 3, -1, -3, 5, 3, 6, 7], 3) -> [1, -1, -1, 3, 5, 6]
// Time: O(n * k) with binary insert | Space: O(k)
```

#### 78. Split Array Largest Sum (Binary Search on Answer)
* **Problem**: Split array into $k$ non-empty continuous subarrays such that largest sum among subarrays is minimized.
```javascript
function splitArray(nums, k) {
  let low = Math.max(...nums);
  let high = nums.reduce((a, b) => a + b, 0);
  
  function canSplit(maxAllowedSum) {
    let pieces = 1, currentSum = 0;
    for (const n of nums) {
      if (currentSum + n > maxAllowedSum) {
        pieces++;
        currentSum = n;
      } else {
        currentSum += n;
      }
    }
    return pieces <= k;
  }
  
  while (low < high) {
    const mid = Math.floor((low + high) / 2);
    if (canSplit(mid)) high = mid;
    else low = mid + 1;
  }
  return low;
}
// Example: splitArray([7, 2, 5, 10, 8], 2) -> 18 ([7, 2, 5] and [10, 8])
// Time: O(n * log(sum - max)) | Space: O(1) | Binary search on result range.
```

#### 79. Minimum Window Subarray Containing All Target Elements
* **Problem**: Find the shortest contiguous subarray containing all elements from target set.
```javascript
function minWindowSubarray(nums, targets) {
  const targetMap = new Map();
  for (const t of targets) targetMap.set(t, (targetMap.get(t) || 0) + 1);
  
  let required = targetMap.size;
  let left = 0, minLen = Infinity, bestWindow = [];
  const windowMap = new Map();
  let formed = 0;
  
  for (let right = 0; right < nums.length; right++) {
    const val = nums[right];
    windowMap.set(val, (windowMap.get(val) || 0) + 1);
    if (targetMap.has(val) && windowMap.get(val) === targetMap.get(val)) formed++;
    
    while (left <= right && formed === required) {
      if (right - left + 1 < minLen) {
        minLen = right - left + 1;
        bestWindow = nums.slice(left, right + 1);
      }
      const leftVal = nums[left];
      windowMap.set(leftVal, windowMap.get(leftVal) - 1);
      if (targetMap.has(leftVal) && windowMap.get(leftVal) < targetMap.get(leftVal)) formed--;
      left++;
    }
  }
  return bestWindow;
}
// Example: minWindowSubarray([1, 2, 3, 1, 4, 3], [1, 3, 4]) -> [1, 4, 3]
// Time: O(n) | Space: O(k) | Sliding window.
```

#### 80. Online Stock Span
* **Problem**: Calculate span of stock price today (max consecutive days prior where price $\le$ today).
```javascript
class StockSpanner {
  constructor() {
    this.stack = []; // [price, span]
  }
  next(price) {
    let span = 1;
    while (this.stack.length > 0 && this.stack[this.stack.length - 1][0] <= price) {
      span += this.stack.pop()[1];
    }
    this.stack.push([price, span]);
    return span;
  }
}
// Example: sp = new StockSpanner(); [100, 80, 60, 70, 60, 75, 85].map(p => sp.next(p)) -> [1, 1, 1, 2, 1, 4, 6]
// Time: O(1) amortized | Space: O(n) | Monotonic stack class.
```

#### 81. Queue Reconstruction by Height
* **Problem**: People given as $[h, k]$ (height, count of people taller or equal in front). Reconstruct queue.
```javascript
function reconstructQueue(people) {
  // Sort descending by height; for equal height, sort ascending by k
  people.sort((a, b) => a[0] === b[0] ? a[1] - b[1] : b[0] - a[0]);
  const queue = [];
  for (const person of people) {
    queue.splice(person[1], 0, person); // Insert person at index k
  }
  return queue;
}
// Example: reconstructQueue([[7,0],[4,4],[7,1],[5,0],[6,1],[5,2]]) -> [[5,0],[7,0],[5,2],[6,1],[4,4],[7,1]]
// Time: O(n^2) | Space: O(n) | Greedy insertion.
```

#### 82. Beautiful Array
* **Problem**: Array of $1..N$ where no $nums[k] * 2 = nums[i] + nums[j]$ for $i < k < j$.
```javascript
function beautifulArray(n) {
  let result = [1];
  while (result.length < n) {
    const odds = result.map(x => 2 * x - 1).filter(x => x <= n);
    const evens = result.map(x => 2 * x).filter(x => x <= n);
    result = [...odds, ...evens];
  }
  return result;
}
// Example: beautifulArray(4) -> [1, 3, 2, 4]
// Time: O(n log n) | Space: O(n) | Divide & conquer parity partitioning.
```

---

### Part 4: 2D & Matrix Algorithms (83 – 95)

#### 83. Spiral Matrix I
* **Problem**: Return all elements of $M \times N$ matrix in spiral order.
```javascript
function spiralOrder(matrix) {
  const result = [];
  if (matrix.length === 0) return result;
  let top = 0, bottom = matrix.length - 1;
  let left = 0, right = matrix[0].length - 1;
  
  while (top <= bottom && left <= right) {
    for (let c = left; c <= right; c++) result.push(matrix[top][c]);
    top++;
    for (let r = top; r <= bottom; r++) result.push(matrix[r][right]);
    right--;
    if (top <= bottom) {
      for (let c = right; c >= left; c--) result.push(matrix[bottom][c]);
      bottom--;
    }
    if (left <= right) {
      for (let r = bottom; r >= top; r--) result.push(matrix[r][left]);
      left++;
    }
  }
  return result;
}
// Example: spiralOrder([[1, 2, 3], [4, 5, 6], [7, 8, 9]]) -> [1, 2, 3, 6, 9, 8, 7, 4, 5]
// Time: O(m * n) | Space: O(1) extra
```

#### 84. Spiral Matrix II
* **Problem**: Generate an $N \times N$ matrix filled with elements from $1$ to $N^2$ in spiral order.
```javascript
function generateMatrix(n) {
  const matrix = Array.from({ length: n }, () => new Array(n).fill(0));
  let top = 0, bottom = n - 1, left = 0, right = n - 1;
  let val = 1;
  
  while (top <= bottom && left <= right) {
    for (let c = left; c <= right; c++) matrix[top][c] = val++;
    top++;
    for (let r = top; r <= bottom; r++) matrix[r][right] = val++;
    right--;
    for (let c = right; c >= left; c--) matrix[bottom][c] = val++;
    bottom--;
    for (let r = bottom; r >= top; r--) matrix[r][left] = val++;
    left++;
  }
  return matrix;
}
// Example: generateMatrix(3) -> [[1,2,3],[8,9,4],[7,6,5]]
// Time: O(n^2) | Space: O(n^2)
```

#### 85. Rotate Matrix 90 Degrees Clockwise (In-Place)
* **Problem**: Rotate $N \times N$ matrix 90 degrees clockwise in-place.
```javascript
function rotateMatrix(mat) {
  const n = mat.length;
  // 1. Transpose matrix in-place:
  for (let r = 0; r < n; r++) {
    for (let c = r + 1; c < n; c++) {
      [mat[r][c], mat[c][r]] = [mat[c][r], mat[r][c]];
    }
  }
  // 2. Reverse each row:
  for (let r = 0; r < n; r++) {
    mat[r].reverse();
  }
  return mat;
}
// Example: rotateMatrix([[1,2,3],[4,5,6],[7,8,9]]) -> [[7,4,1],[8,5,2],[9,6,3]]
// Time: O(n^2) | Space: O(1)
```

#### 86. Set Matrix Zeroes
* **Problem**: If an element in $M \times N$ matrix is 0, set its entire row and column to 0 in $O(1)$ extra space.
```javascript
function setZeroes(matrix) {
  let firstColHasZero = false;
  const rows = matrix.length, cols = matrix[0].length;
  
  for (let r = 0; r < rows; r++) {
    if (matrix[r][0] === 0) firstColHasZero = true;
    for (let c = 1; c < cols; c++) {
      if (matrix[r][c] === 0) {
        matrix[r][0] = 0;
        matrix[0][c] = 0;
      }
    }
  }
  for (let r = rows - 1; r >= 0; r--) {
    for (let c = cols - 1; c >= 1; c--) {
      if (matrix[r][0] === 0 || matrix[0][c] === 0) matrix[r][c] = 0;
    }
    if (firstColHasZero) matrix[r][0] = 0;
  }
  return matrix;
}
// Example: setZeroes([[1,1,1],[1,0,1],[1,1,1]]) -> [[1,0,1],[0,0,0],[1,0,1]]
// Time: O(m * n) | Space: O(1) | In-place marker variables.
```

#### 87. Search a 2D Matrix I (Sorted 1D Representation)
* **Problem**: Search target in matrix where each row is sorted and first integer of row is greater than last of previous.
```javascript
function searchMatrix(matrix, target) {
  const m = matrix.length, n = matrix[0].length;
  let low = 0, high = m * n - 1;
  while (low <= high) {
    const mid = Math.floor((low + high) / 2);
    const r = Math.floor(mid / n);
    const c = mid % n;
    if (matrix[r][c] === target) return true;
    if (matrix[r][c] < target) low = mid + 1;
    else high = mid - 1;
  }
  return false;
}
// Example: searchMatrix([[1,3,5,7],[10,11,16,20],[23,30,34,60]], 3) -> true
// Time: O(log(m * n)) | Space: O(1) | Virtual 1D binary search.
```

#### 88. Search a 2D Matrix II (Row & Column Sorted)
* **Problem**: Search target in matrix where rows are sorted left-to-right and columns sorted top-to-bottom.
```javascript
function searchMatrixII(matrix, target) {
  let r = 0;
  let c = matrix[0].length - 1; // Top-right corner
  while (r < matrix.length && c >= 0) {
    if (matrix[r][c] === target) return true;
    if (matrix[r][c] > target) c--;
    else r++;
  }
  return false;
}
// Example: searchMatrixII([[1,4,7],[2,5,8],[3,6,9]], 5) -> true
// Time: O(m + n) | Space: O(1) | Staircase search.
```

#### 89. Transpose Matrix
* **Problem**: Return transpose of rectangular matrix $M \times N$.
```javascript
function transposeMatrix(mat) {
  const rows = mat.length, cols = mat[0].length;
  const result = Array.from({ length: cols }, () => new Array(rows));
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      result[c][r] = mat[r][c];
    }
  }
  return result;
}
// Example: transposeMatrix([[1, 2, 3], [4, 5, 6]]) -> [[1, 4], [2, 5], [3, 6]]
// Time: O(m * n) | Space: O(m * n)
```

#### 90. Matrix Multiplication ($A \times B$)
* **Problem**: Multiply matrix $A$ ($m \times k$) by matrix $B$ ($k \times n$).
```javascript
function multiplyMatrices(A, B) {
  const m = A.length, k = A[0].length, n = B[0].length;
  const C = Array.from({ length: m }, () => new Array(n).fill(0));
  for (let i = 0; i < m; i++) {
    for (let p = 0; p < k; p++) {
      for (let j = 0; j < n; j++) {
        C[i][j] += A[i][p] * B[p][j];
      }
    }
  }
  return C;
}
// Example: multiplyMatrices([[1, 2], [3, 4]], [[5, 6], [7, 8]]) -> [[19, 22], [43, 50]]
// Time: O(m * k * n) | Space: O(m * n)
```

#### 91. Number of Islands (Grid BFS/DFS)
* **Problem**: Count distinct islands formed by horizontally/vertically connected 1s.
```javascript
function numIslands(grid) {
  if (grid.length === 0) return 0;
  let count = 0;
  const rows = grid.length, cols = grid[0].length;
  
  function dfs(r, c) {
    if (r < 0 || c < 0 || r >= rows || c >= cols || grid[r][c] !== "1") return;
    grid[r][c] = "0"; // Sink island to avoid extra visited matrix
    dfs(r + 1, c);
    dfs(r - 1, c);
    dfs(r, c + 1);
    dfs(r, c - 1);
  }
  
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (grid[r][c] === "1") {
        count++;
        dfs(r, c);
      }
    }
  }
  return count;
}
// Example: numIslands([["1","1","0"],["1","1","0"],["0","0","1"]]) -> 2
// Time: O(m * n) | Space: O(m * n) recursion stack.
```

#### 92. Flood Fill Algorithm
* **Problem**: Fill connected region with new color starting from $[sr, sc]$.
```javascript
function floodFill(image, sr, sc, color) {
  const originalColor = image[sr][sc];
  if (originalColor === color) return image;
  
  function fill(r, c) {
    if (r < 0 || c < 0 || r >= image.length || c >= image[0].length) return;
    if (image[r][c] !== originalColor) return;
    image[r][c] = color;
    fill(r + 1, c); fill(r - 1, c); fill(r, c + 1); fill(r, c - 1);
  }
  fill(sr, sc);
  return image;
}
// Example: floodFill([[1,1,1],[1,1,0],[1,0,1]], 1, 1, 2)
// Time: O(m * n) | Space: O(m * n)
```

#### 93. Diagonal Traverse
* **Problem**: Traverse $M \times N$ matrix diagonally.
```javascript
function findDiagonalOrder(mat) {
  if (mat.length === 0) return [];
  const m = mat.length, n = mat[0].length;
  const result = [];
  
  for (let d = 0; d < m + n - 1; d++) {
    const intermediate = [];
    let r = d < n ? 0 : d - n + 1;
    let c = d < n ? d : n - 1;
    while (r < m && c >= 0) {
      intermediate.push(mat[r][c]);
      r++; c--;
    }
    if (d % 2 === 0) intermediate.reverse();
    result.push(...intermediate);
  }
  return result;
}
// Example: findDiagonalOrder([[1,2,3],[4,5,6],[7,8,9]]) -> [1,2,4,7,5,3,6,8,9]
// Time: O(m * n) | Space: O(min(m, n))
```

#### 94. Word Search in Matrix (Backtracking)
* **Problem**: Determine if word exists in grid with adjacent letters.
```javascript
function existWord(board, word) {
  const rows = board.length, cols = board[0].length;
  function backtrack(r, c, idx) {
    if (idx === word.length) return true;
    if (r < 0 || c < 0 || r >= rows || c >= cols || board[r][c] !== word[idx]) return false;
    
    board[r][c] = "#"; // Mark visited
    const found = backtrack(r + 1, c, idx + 1) ||
                  backtrack(r - 1, c, idx + 1) ||
                  backtrack(r, c + 1, idx + 1) ||
                  backtrack(r, c - 1, idx + 1);
    board[r][c] = word[idx]; // Unmark
    return found;
  }
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (backtrack(r, c, 0)) return true;
    }
  }
  return false;
}
// Example: existWord([["A","B","C","E"],["S","F","C","S"],["A","D","E","E"]], "ABCCED") -> true
// Time: O(m * n * 4^L) | Space: O(L) recursion stack.
```

#### 95. Game of Life (Conway's Simulation In-Place)
* **Problem**: Compute next state of Conway's Game of Life in-place using 2-bit state encoding.
```javascript
function gameOfLife(board) {
  const m = board.length, n = board[0].length;
  // State transitions: 0 -> 0 (0), 1 -> 0 (1), 0 -> 1 (2), 1 -> 1 (3)
  for (let r = 0; r < m; r++) {
    for (let c = 0; c < n; c++) {
      let liveNeighbors = 0;
      for (let dr = -1; dr <= 1; dr++) {
        for (let dc = -1; dc <= 1; dc++) {
          if (dr === 0 && dc === 0) continue;
          const nr = r + dr, nc = c + dc;
          if (nr >= 0 && nr < m && nc >= 0 && nc < n && (board[nr][nc] & 1) === 1) {
            liveNeighbors++;
          }
        }
      }
      if (board[r][c] === 1 && (liveNeighbors === 2 || liveNeighbors === 3)) board[r][c] = 3;
      if (board[r][c] === 0 && liveNeighbors === 3) board[r][c] = 2;
    }
  }
  for (let r = 0; r < m; r++) {
    for (let c = 0; c < n; c++) board[r][c] >>= 1; // Extract next state
  }
  return board;
}
// Example: gameOfLife([[0,1,0],[0,0,1],[1,1,1],[0,0,0]])
// Time: O(m * n) | Space: O(1) extra space.
```

---

### Part 5: Data Structures Implemented on Arrays (96 – 103)

#### 96. Circular Buffer / Ring Buffer using Fixed Array
* **Problem**: Implement fixed-capacity circular buffer with $O(1)$ enqueue and dequeue without shifting elements.
```javascript
class CircularBuffer {
  constructor(capacity) {
    this.buffer = new Array(capacity);
    this.capacity = capacity;
    this.head = 0;
    this.tail = 0;
    this.size = 0;
  }
  enqueue(item) {
    if (this.isFull()) throw new Error("Buffer overflow");
    this.buffer[this.tail] = item;
    this.tail = (this.tail + 1) % this.capacity;
    this.size++;
  }
  dequeue() {
    if (this.isEmpty()) return undefined;
    const item = this.buffer[this.head];
    this.buffer[this.head] = undefined;
    this.head = (this.head + 1) % this.capacity;
    this.size--;
    return item;
  }
  isEmpty() { return this.size === 0; }
  isFull() { return this.size === this.capacity; }
}
// Time: O(1) for enqueue & dequeue | Space: O(capacity)
```

#### 97. Resizable Dynamic Array (Vector) with Doubling Amortization
* **Problem**: Implement dynamic array that reallocates and doubles internal storage upon reaching capacity.
```javascript
class DynamicArray {
  constructor(initialCapacity = 2) {
    this.capacity = initialCapacity;
    this.size = 0;
    this.data = new Array(this.capacity);
  }
  push(val) {
    if (this.size === this.capacity) this._resize(this.capacity * 2);
    this.data[this.size++] = val;
  }
  pop() {
    if (this.size === 0) return undefined;
    const val = this.data[--this.size];
    this.data[this.size] = undefined;
    if (this.size > 0 && this.size === Math.floor(this.capacity / 4)) {
      this._resize(Math.floor(this.capacity / 2));
    }
    return val;
  }
  _resize(newCapacity) {
    const nextData = new Array(newCapacity);
    for (let i = 0; i < this.size; i++) nextData[i] = this.data[i];
    this.data = nextData;
    this.capacity = newCapacity;
  }
}
// Time: O(1) amortized push/pop | Space: O(n)
```

#### 98. Min-Heap / Max-Heap (Binary Heap on Array)
* **Problem**: Implement binary Min-Heap where parent is always $\le$ children stored at $2i + 1$ and $2i + 2$.
```javascript
class MinHeap {
  constructor() {
    this.heap = [];
  }
  insert(val) {
    this.heap.push(val);
    this._bubbleUp(this.heap.length - 1);
  }
  extractMin() {
    if (this.heap.length === 0) return null;
    const min = this.heap[0];
    const end = this.heap.pop();
    if (this.heap.length > 0) {
      this.heap[0] = end;
      this._sinkDown(0);
    }
    return min;
  }
  _bubbleUp(idx) {
    while (idx > 0) {
      const parentIdx = Math.floor((idx - 1) / 2);
      if (this.heap[idx] >= this.heap[parentIdx]) break;
      [this.heap[idx], this.heap[parentIdx]] = [this.heap[parentIdx], this.heap[idx]];
      idx = parentIdx;
    }
  }
  _sinkDown(idx) {
    const len = this.heap.length;
    while (true) {
      let smallest = idx;
      const left = 2 * idx + 1, right = 2 * idx + 2;
      if (left < len && this.heap[left] < this.heap[smallest]) smallest = left;
      if (right < len && this.heap[right] < this.heap[smallest]) smallest = right;
      if (smallest === idx) break;
      [this.heap[idx], this.heap[smallest]] = [this.heap[smallest], this.heap[idx]];
      idx = smallest;
    }
  }
}
// Time: O(log n) insert/extract, O(1) peek | Space: O(n)
```

#### 99. Priority Queue Based on Binary Heap
* **Problem**: Build priority queue supporting arbitrary priority comparator.
```javascript
class PriorityQueue {
  constructor(comparator = (a, b) => a.priority - b.priority) {
    this.heap = [];
    this.comparator = comparator;
  }
  enqueue(item) {
    this.heap.push(item);
    let i = this.heap.length - 1;
    while (i > 0) {
      const p = Math.floor((i - 1) / 2);
      if (this.comparator(this.heap[i], this.heap[p]) >= 0) break;
      [this.heap[i], this.heap[p]] = [this.heap[p], this.heap[i]];
      i = p;
    }
  }
  dequeue() {
    if (this.heap.length === 0) return undefined;
    const top = this.heap[0];
    const bottom = this.heap.pop();
    if (this.heap.length > 0) {
      this.heap[0] = bottom;
      let i = 0;
      while (true) {
        let best = i, l = 2 * i + 1, r = 2 * i + 2;
        if (l < this.heap.length && this.comparator(this.heap[l], this.heap[best]) < 0) best = l;
        if (r < this.heap.length && this.comparator(this.heap[r], this.heap[best]) < 0) best = r;
        if (best === i) break;
        [this.heap[i], this.heap[best]] = [this.heap[best], this.heap[i]];
        i = best;
      }
    }
    return top;
  }
}
```

#### 100. Disjoint Set Union (Union-Find) with Path Compression & Rank
* **Problem**: Maintain disjoint sets with near $O(1)$ amortized find and union operations.
```javascript
class UnionFind {
  constructor(n) {
    this.parent = Array.from({ length: n }, (_, i) => i);
    this.rank = new Array(n).fill(0);
    this.count = n;
  }
  find(x) {
    if (this.parent[x] !== x) {
      this.parent[x] = this.find(this.parent[x]); // Path compression
    }
    return this.parent[x];
  }
  union(x, y) {
    const rootX = this.find(x);
    const rootY = this.find(y);
    if (rootX === rootY) return false;
    // Union by rank:
    if (this.rank[rootX] < this.rank[rootY]) {
      this.parent[rootX] = rootY;
    } else if (this.rank[rootX] > this.rank[rootY]) {
      this.parent[rootY] = rootX;
    } else {
      this.parent[rootY] = rootX;
      this.rank[rootX]++;
    }
    this.count--;
    return true;
  }
}
// Time: O(alpha(n)) near O(1) with Inverse Ackermann | Space: O(n)
```

#### 101. LRU Cache Using Map & Doubly Linked List Nodes
* **Problem**: Design Least Recently Used (LRU) Cache with $O(1)$ get and put.
```javascript
class LRUCache {
  constructor(capacity) {
    this.capacity = capacity;
    this.map = new Map(); // Built-in JS Map maintains exact insertion order!
  }
  get(key) {
    if (!this.map.has(key)) return -1;
    const val = this.map.get(key);
    this.map.delete(key);
    this.map.set(key, val); // Re-insert at end to mark most recently used
    return val;
  }
  put(key, value) {
    if (this.map.has(key)) this.map.delete(key);
    else if (this.map.size >= this.capacity) {
      // Evict oldest (first key in map iterator):
      const oldestKey = this.map.keys().next().value;
      this.map.delete(oldestKey);
    }
    this.map.set(key, value);
  }
}
// Time: O(1) get & put | Space: O(capacity)
```

#### 102. Binary Indexed Tree (Fenwick Tree) on Array
* **Problem**: Efficiently update elements and calculate prefix range sums in $O(\log n)$ time.
```javascript
class FenwickTree {
  constructor(size) {
    this.tree = new Array(size + 1).fill(0);
  }
  add(i, delta) {
    i++; // 1-based indexing
    while (i < this.tree.length) {
      this.tree[i] += delta;
      i += i & (-i); // Add lowest set bit
    }
  }
  query(i) {
    i++;
    let sum = 0;
    while (i > 0) {
      sum += this.tree[i];
      i -= i & (-i); // Remove lowest set bit
    }
    return sum;
  }
  rangeQuery(l, r) {
    return this.query(r) - (l > 0 ? this.query(l - 1) : 0);
  }
}
// Time: O(log n) query & update | Space: O(n)
```

#### 103. Segment Tree for Range Queries and Updates on Array
* **Problem**: Support $O(\log n)$ range minimum/sum queries and point updates.
```javascript
class SegmentTree {
  constructor(nums) {
    this.n = nums.length;
    this.tree = new Array(4 * this.n).fill(0);
    if (this.n > 0) this.build(nums, 0, 0, this.n - 1);
  }
  build(nums, node, start, end) {
    if (start === end) {
      this.tree[node] = nums[start];
      return;
    }
    const mid = Math.floor((start + end) / 2);
    this.build(nums, 2 * node + 1, start, mid);
    this.build(nums, 2 * node + 2, mid + 1, end);
    this.tree[node] = this.tree[2 * node + 1] + this.tree[2 * node + 2];
  }
  queryRange(l, r, node = 0, start = 0, end = this.n - 1) {
    if (r < start || end < l) return 0;
    if (l <= start && end <= r) return this.tree[node];
    const mid = Math.floor((start + end) / 2);
    return this.queryRange(l, r, 2 * node + 1, start, mid) +
           this.queryRange(l, r, 2 * node + 2, mid + 1, end);
  }
  update(idx, val, node = 0, start = 0, end = this.n - 1) {
    if (start === end) {
      this.tree[node] = val;
      return;
    }
    const mid = Math.floor((start + end) / 2);
    if (idx <= mid) this.update(idx, val, 2 * node + 1, start, mid);
    else this.update(idx, val, 2 * node + 2, mid + 1, end);
    this.tree[node] = this.tree[2 * node + 1] + this.tree[2 * node + 2];
  }
}
// Time: O(log n) query & update, O(n) build | Space: O(n)
```


---

## 26. Asynchronous Array Processing

In modern fullstack applications, processing arrays of asynchronous tasks (API queries, database writes, file parsing) requires strict control over concurrency, error handling, and ordering.

### 1. Parallel Execution: `Promise.all` vs `Promise.allSettled`

```javascript
const userIds = [101, 102, 103, 104];
const fetchProfile = async (id) => {
  if (id === 103) throw new Error("User 103 suspended");
  return { id, name: `User ${id}` };
};

// 1. Promise.all: All-or-Nothing (Fails FAST on first rejection!)
try {
  const profiles = await Promise.all(userIds.map(id => fetchProfile(id)));
} catch (err) {
  console.error("Promise.all aborted completely:", err.message);
}

// 2. Promise.allSettled: Resilient Batch (Never rejects!)
const results = await Promise.allSettled(userIds.map(id => fetchProfile(id)));
const successful = results
  .filter(r => r.status === "fulfilled")
  .map(r => r.value);
const failed = results
  .filter(r => r.status === "rejected")
  .map(r => r.reason);

console.log({ successfulCount: successful.length, failedCount: failed.length });
// { successfulCount: 3, failedCount: 1 }
```

### 2. Sequential Execution (Throttling / Rate-Limiting)
When calling rate-limited APIs (e.g., Stripe, OpenAI, GitHub), you must execute promises one at a time:

```javascript
async function processSequentially(items, asyncFn) {
  const outputs = [];
  for (const item of items) {
    const result = await asyncFn(item); // Strictly waits for completion before next
    outputs.push(result);
  }
  return outputs;
}
```

### 3. Production Concurrency Limiter (Worker Pool of Size $K$)
Executing 10,000 requests with `Promise.all` will crash your server (socket exhaustion, OOM). A concurrency limiter processes an array with at most $K$ active promises in flight:

```javascript
async function pLimit(items, limit, asyncFn) {
  const results = new Array(items.length);
  let nextIdx = 0;
  
  const worker = async () => {
    while (nextIdx < items.length) {
      const current = nextIdx++;
      results[current] = await asyncFn(items[current], current);
    }
  };
  
  // Launch 'limit' workers concurrently:
  const workers = Array.from({ length: Math.min(limit, items.length) }, () => worker());
  await Promise.all(workers);
  return results;
}

// Example: Process 100 images with at most 5 concurrent downloads:
// const downloaded = await pLimit(imageUrls, 5, downloadImage);
```

---

## 27. React & Frontend State Immutability Patterns

In React and Redux, state changes are detected via **shallow reference equality** (`prevProps.items !== nextProps.items`). Mutating an array in-place preserves its reference pointer, causing React to skip re-renders and produce ghost bugs.

### 1. The Core React Array State Operations
```javascript
// Initial State:
const initialTodos = [
  { id: "t1", text: "Design Architecture", done: false },
  { id: "t2", text: "Write Benchmarks", done: true }
];

// 1. Append Item:
const addTodo = (state, newTodo) => [...state, newTodo];

// 2. Prepend Item:
const prependTodo = (state, urgentTodo) => [urgentTodo, ...state];

// 3. Remove Item by ID (filter):
const removeTodo = (state, targetId) => state.filter(t => t.id !== targetId);

// 4. Update Item by ID (map + object spread):
const toggleTodo = (state, targetId) => state.map(t => 
  t.id === targetId ? { ...t, done: !t.done } : t
);

// 5. Replace Item at specific Index (ES2023 .with()):
const replaceAtIndex = (state, index, updatedItem) => state.with(index, updatedItem);

// 6. Move Item (Reorder / Drag & Drop):
function moveItemInArray(arr, fromIndex, toIndex) {
  const clone = [...arr];
  const [moved] = clone.splice(fromIndex, 1);
  clone.splice(toIndex, 0, moved);
  return clone;
}
```

---

## 28. V8 Engine Internals & Memory Architecture

> 🧠 **CRITICAL NOTE**: The details in this section describe **V8 implementation details** (the engine powering Node.js, Chrome, and Edge). They are **not guarantees of the ECMAScript specification**, but understanding them allows you to write JavaScript code that runs at near-C++ speed.

### 1. Fast Elements vs Dictionary Mode (Slow Elements)
V8 represents arrays internally in two distinct modes:
1. **Fast Elements**: Stored as a flat, contiguous C++ memory buffer. Index access is a single pointer addition.
2. **Dictionary Mode (Slow Elements)**: Stored as a hash table. Used when the array is sparse, has large gaps, or has property attributes modified via `Object.defineProperty`. Property lookups incur hash computation and collision resolution.

### 2. The Elements Kinds Lattice (Irreversible Degradation)
V8 categorizes dense arrays into progressive "Element Kinds". The engine only transitions in **one direction** (from more specific to more generic). Once an array degrades, it can **never transition back**!

```
       PACKED_SMI_ELEMENTS        (Small integers only: -2^31 to 2^31 - 1)
               │
               ▼
      PACKED_DOUBLE_ELEMENTS      (Floating point numbers)
               │
               ▼
        PACKED_ELEMENTS           (Strings, objects, mixed types)
               │
               ▼
         HOLEY VARIANTS           (HOLEY_SMI -> HOLEY_DOUBLE -> HOLEY_ELEMENTS)
```

#### Demonstrating the Transition:
```javascript
// 1. Starts as PACKED_SMI_ELEMENTS (Most optimized: raw 32-bit integers)
const arr = [1, 2, 3];

// 2. Transitions to PACKED_DOUBLE_ELEMENTS (Requires 64-bit IEEE-754 representation)
arr.push(4.56);

// 3. Transitions to PACKED_ELEMENTS (Heap pointers required)
arr.push("text");

// 4. Introducing a hole irreversibly degrades to HOLEY_ELEMENTS!
arr[100] = 999; 
// Now V8 must check prototype chain for every missing index lookup!
```

### 3. Monomorphism vs Polymorphism in Array Loops
A function that operates on arrays of a single consistent element kind (monomorphic) can be inlined and vectorized by V8's TurboFan compiler. If passed arrays of varying element kinds (polymorphic or megamorphic), TurboFan de-optimizes into generic ICs (Inline Caches), running up to 5x–10x slower!

---

## 29. Debugging & Testing Checklists

### 1. The 5 Most Fatal Production Array Bugs
1. **Accidental In-Place Sorting**: `items.sort()` mutating props or store data directly.
2. **The Asynchronous `forEach` Trap**: Expecting `await` inside `forEach` to hold execution.
3. **Sparse Array Iteration Gaps**: Assuming `forEach` or `map` visits every index up to `length`.
4. **Shallow Copy Object Mutation**: Assuming `[...arr]` isolates nested object modifications.
5. **Single Numeric Constructor Trap**: `new Array(5)` creating empty holes instead of `[5]`.

### 2. Unit Testing Assertions (Jest / Vitest / Node Assert)
```javascript
const assert = require("node:assert/strict");

const original = [1, 2, 3];
const result = original.map(x => x * 2);

// 1. Verify deep structural equality:
assert.deepStrictEqual(result, [2, 4, 6]);

// 2. Verify immutability (references must differ):
assert.notStrictEqual(result, original);

// 3. Verify original array was not mutated:
assert.deepStrictEqual(original, [1, 2, 3]);
```

---

## 30. Senior Guidance & Production Architecture

1. **Memory Ceiling in Node.js**: By default, Node.js limits the V8 heap to ~2 GB (configurable via `--max-old-space-size=8192`). An array containing 20,000,000 JavaScript objects will exhaust heap memory and cause an Out-Of-Memory (OOM) crash.
2. **Stream vs Array Rule**: Never accumulate massive datasets (e.g. 500 MB CSV files or 100,000 SQL records) into an in-memory array. Use **Node.js Streams** or **Async Generators** (`for await (const chunk of stream)`) to process data in small constant-memory chunks.
3. **Garbage Collection (GC) Pressure**: In high-throughput backend services (e.g. processing 50,000 requests/sec), continuously creating intermediate arrays via `.filter().map().slice()` creates massive short-lived heap allocations, triggering frequent GC pauses (Stop-The-World). Use single-pass loops or reuse typed buffers in hot code paths.

---

## 31. Top 10 High-Frequency Senior Interview Questions

### Q1: What is the difference between `Array.prototype.forEach()` and `Array.prototype.map()`?
* **Answer**: `map()` allocates and returns a brand new array containing the return values of the callback function, preserving immutability and allowing method chaining. `forEach()` always returns `undefined` and is designed solely to execute side effects.

### Q2: Why does `[10, 2, 5, 1].sort()` result in `[1, 10, 2, 5]`?
* **Answer**: By default, ECMAScript specifies that `sort()` converts all elements to strings and compares their sequence of UTF-16 code units. In UTF-16, character `"1"` comes before `"2"`. To sort numerically, you must supply a comparator: `(a, b) => a - b`.

### Q3: What is a sparse array ("holes"), and how do different methods treat them?
* **Answer**: A sparse array has indices that have not been allocated (the property key does not exist on the object). Older iteration methods like `forEach` and `map` skip holes entirely without executing the callback. Modern methods like `for...of`, `Array.from`, and `includes` treat holes as `undefined`.

### Q4: Why is `arr.push()` $O(1)$ amortized while `arr.unshift()` is $O(n)$?
* **Answer**: `push()` appends to the end of the array. The engine allocates spare capacity; when full, it reallocates and doubles the capacity, yielding $O(1)$ amortized time. `unshift()` inserts at index 0, requiring every single existing element in the array to be moved forward in memory, costing linear $O(n)$ time.

### Q5: How does `structuredClone` differ from `JSON.parse(JSON.stringify(arr))`?
* **Answer**: `structuredClone` uses the HTML Structured Clone Algorithm. It correctly clones circular references, `Date`, `RegExp`, `Map`, `Set`, `ArrayBuffer`, and `TypedArrays`. `JSON.stringify` throws on circular references, drops `undefined` and functions, and converts `Date` to strings and `Set`/`Map` to empty objects.

### Q6: What is the difference between `Map` and a plain JavaScript object?
* **Answer**: `Map` allows keys of ANY type (including objects and functions), preserves insertion order strictly, provides an $O(1)$ `.size` property, is immune to prototype pollution, and is optimized for frequent key-value additions and deletions.

### Q7: Why do `WeakMap` and `WeakSet` not support iteration or a `.size` property?
* **Answer**: Because they hold weak references to their keys. If iteration or size were exposed, the observable behavior of your program would depend on the non-deterministic timing of the engine's Garbage Collector.

### Q8: What does the ES2023 `with()` method do?
* **Answer**: `arr.with(index, value)` returns a new array with the element at the specified index replaced by the new value, without mutating the original array. It supports negative indices and enables clean immutable state updates.

### Q9: Why is `Array.isArray()` preferred over `instanceof Array`?
* **Answer**: `instanceof` checks if the constructor's prototype exists in the prototype chain. When an array is created in another execution realm (such as an iframe or Web Worker), its prototype is `iframeWindow.Array.prototype`, which does not match the parent's `window.Array.prototype`. `Array.isArray()` operates on the internal `[[Class]]` / exotic array brand and works reliably across all realms.

### Q10: How does V8 optimize JavaScript arrays under the hood?
* **Answer**: V8 uses Elements Kinds. Monomorphic dense arrays of integers are stored as `PACKED_SMI` (contiguous 32-bit C++ vectors). If floats or strings are introduced, the array transitions to `PACKED_DOUBLE` or `PACKED_ELEMENTS`. If indices are skipped or deleted, the array degrades to `HOLEY` elements or slow Dictionary Mode (hash tables). These transitions are one-way.

---

## 32. 4 Final Real-World Projects

---

### Project 1: Real-Time Event Stream Aggregator & Rolling Metrics Window
* **Architecture**: Implements an in-memory sliding time window that computes p50, p95, and p99 latency percentiles over a rolling duration without memory leaks.

```javascript
class RollingMetricsAggregator {
  constructor(windowMs = 60000) {
    this.windowMs = windowMs;
    this.events = []; // [timestamp, latencyMs]
  }

  record(latencyMs, timestamp = Date.now()) {
    this.events.push([timestamp, latencyMs]);
    this._prune(timestamp);
  }

  _prune(now) {
    const threshold = now - this.windowMs;
    // Binary search for oldest valid index to slice in O(log n):
    let low = 0, high = this.events.length;
    while (low < high) {
      const mid = Math.floor((low + high) / 2);
      if (this.events[mid][0] < threshold) low = mid + 1;
      else high = mid;
    }
    if (low > 0) {
      this.events = this.events.slice(low);
    }
  }

  getPercentile(p) {
    if (this.events.length === 0) return 0;
    const sortedLatencies = this.events.map(e => e[1]).sort((a, b) => a - b);
    const index = Math.ceil((p / 100) * sortedLatencies.length) - 1;
    return sortedLatencies[Math.max(0, index)];
  }

  getStats() {
    const count = this.events.length;
    if (count === 0) return { count: 0, avg: 0, p50: 0, p95: 0, p99: 0 };
    const sum = this.events.reduce((acc, e) => acc + e[1], 0);
    return {
      count,
      avg: Number((sum / count).toFixed(2)),
      p50: this.getPercentile(50),
      p95: this.getPercentile(95),
      p99: this.getPercentile(99)
    };
  }
}

// Verification:
const monitor = new RollingMetricsAggregator(5000);
[45, 52, 120, 34, 48, 210, 60, 55].forEach(lat => monitor.record(lat));
console.log(monitor.getStats());
```

---

### Project 2: High-Performance In-Memory Data Store with Secondary Indexes
* **Architecture**: Uses `Map` and `Set` to create an in-memory database with $O(1)$ primary key lookups and $O(1)$ secondary indexed queries.

```javascript
class IndexedDataStore {
  constructor() {
    this.primaryStore = new Map(); // id -> entity
    this.indexes = new Map();      // fieldName -> Map<value, Set<id>>
  }

  createIndex(fieldName) {
    if (!this.indexes.has(fieldName)) {
      this.indexes.set(fieldName, new Map());
    }
  }

  insert(record) {
    if (this.primaryStore.has(record.id)) {
      throw new Error(`Duplicate primary key: ${record.id}`);
    }
    this.primaryStore.set(record.id, record);

    // Update secondary indexes:
    for (const [field, indexMap] of this.indexes.entries()) {
      const val = record[field];
      if (val !== undefined) {
        if (!indexMap.has(val)) indexMap.set(val, new Set());
        indexMap.get(val).add(record.id);
      }
    }
  }

  findBy(field, value) {
    const indexMap = this.indexes.get(field);
    if (!indexMap || !indexMap.has(value)) return [];
    const ids = indexMap.get(value);
    return Array.from(ids, id => this.primaryStore.get(id));
  }

  delete(id) {
    const record = this.primaryStore.get(id);
    if (!record) return false;

    // Remove from indexes:
    for (const [field, indexMap] of this.indexes.entries()) {
      const val = record[field];
      if (val !== undefined && indexMap.has(val)) {
        indexMap.get(val).delete(id);
      }
    }
    return this.primaryStore.delete(id);
  }
}

// Verification:
const db = new IndexedDataStore();
db.createIndex("role");
db.insert({ id: "u1", name: "Alice", role: "admin" });
db.insert({ id: "u2", name: "Bob", role: "dev" });
db.insert({ id: "u3", name: "Charlie", role: "dev" });

console.log(db.findBy("role", "dev").map(u => u.name)); // ['Bob', 'Charlie']
```

---

### Project 3: Undo / Redo History Stack Manager with Immutability
* **Architecture**: Implements state history with structural snapshots and undo/redo navigation.

```javascript
class UndoRedoHistory {
  constructor(initialState, maxHistory = 50) {
    this.history = [structuredClone(initialState)];
    this.currentIndex = 0;
    this.maxHistory = maxHistory;
  }

  get state() {
    return this.history[this.currentIndex];
  }

  pushState(nextState) {
    // Drop any redo states beyond current pointer:
    this.history = this.history.slice(0, this.currentIndex + 1);
    this.history.push(structuredClone(nextState));

    if (this.history.length > this.maxHistory) {
      this.history.shift();
    } else {
      this.currentIndex++;
    }
  }

  undo() {
    if (this.canUndo) {
      this.currentIndex--;
      return this.state;
    }
    return null;
  }

  redo() {
    if (this.canRedo) {
      this.currentIndex++;
      return this.state;
    }
    return null;
  }

  get canUndo() { return this.currentIndex > 0; }
  get canRedo() { return this.currentIndex < this.history.length - 1; }
}

// Verification:
const session = new UndoRedoHistory({ count: 0 });
session.pushState({ count: 1 });
session.pushState({ count: 2 });
session.undo();
console.log(session.state); // { count: 1 }
session.redo();
console.log(session.state); // { count: 2 }
```

---

### Project 4: Fast CSV Parser & Data Grid Transformer Pipeline
* **Architecture**: A pipeline that parses raw CSV string data into typed, validated, sorted, and paginated records.

```javascript
class CsvPipeline {
  static parse(csvString) {
    const lines = csvString.trim().split(/\r?\n/);
    if (lines.length === 0) return [];
    const headers = lines[0].split(",").map(h => h.trim());

    return lines.slice(1).map((line, rowIdx) => {
      const values = line.split(",").map(v => v.trim());
      return headers.reduce((record, header, colIdx) => {
        const raw = values[colIdx] ?? "";
        // Automatic type inference:
        if (!isNaN(raw) && raw !== "") record[header] = Number(raw);
        else if (raw.toLowerCase() === "true") record[header] = true;
        else if (raw.toLowerCase() === "false") record[header] = false;
        else record[header] = raw;
        return record;
      }, { _row: rowIdx + 1 });
    });
  }

  static filter(data, predicate) {
    return data.filter(predicate);
  }

  static sortBy(data, key, ascending = true) {
    return data.toSorted((a, b) => {
      if (a[key] < b[key]) return ascending ? -1 : 1;
      if (a[key] > b[key]) return ascending ? 1 : -1;
      return 0;
    });
  }

  static paginate(data, page = 1, pageSize = 10) {
    const start = (page - 1) * pageSize;
    return {
      page,
      pageSize,
      totalRecords: data.length,
      totalPages: Math.ceil(data.length / pageSize),
      data: data.slice(start, start + pageSize)
    };
  }
}

// Verification:
const rawCsv = `
name,age,active,score
Alice,30,true,95.5
Bob,24,false,82.0
Charlie,35,true,88.5
David,29,true,91.0
`;

const dataset = CsvPipeline.parse(rawCsv);
const activeAdults = CsvPipeline.filter(dataset, r => r.active && r.age >= 25);
const sortedByScore = CsvPipeline.sortBy(activeAdults, "score", false);
const resultPage = CsvPipeline.paginate(sortedByScore, 1, 2);

console.log(resultPage);
```

---

## 33. Decision Trees, Cheat Sheets & Quick References

### 1. The Method Selection Decision Tree
```text
Do you need to modify the array or produce something new?
│
├── 1. Check a condition:
│   ├── Does AT LEAST ONE match? ────────────> .some()
│   ├── Do ALL match? ───────────────────────> .every()
│   └── Does it contain a primitive value? ──> .includes()
│
├── 2. Search for an element:
│   ├── Want the element itself? ────────────> .find() / .findLast()
│   └── Want the index? ─────────────────────> .findIndex() / .indexOf()
│
├── 3. Transform data:
│   ├── 1-to-1 transformation of each item? ──> .map()
│   ├── Subsetting / filtering items? ───────> .filter()
│   ├── 1-to-N or 1-to-0 (flatten)? ─────────> .flatMap()
│   └── Accumulate to single value/object? ──> .reduce()
│
└── 4. Reorder / Modify structure:
    ├── Mutating allowed?
    │   ├── Sort: ───────────────────────────> .sort()
    │   ├── Reverse: ────────────────────────> .reverse()
    │   └── Splice: ─────────────────────────> .splice()
    └── Pure / Immutable required (React/Redux):
        ├── Sort: ───────────────────────────> .toSorted()
        ├── Reverse: ────────────────────────> .toReversed()
        ├── Splice: ─────────────────────────> .toSpliced()
        └── Single index update: ────────────> .with()
```

---

### 2. Array Methods Quick-Reference Cheat Sheet

| Method | Mutates? | Returns | Complexity | ES Version | Description |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `push()` | ✅ Yes | `number` (new length) | $\mathcal{O}(1)$ amortized | ES1 | Append to end |
| `pop()` | ✅ Yes | Removed item or `undefined` | $\mathcal{O}(1)$ | ES1 | Remove from end |
| `shift()` | ✅ Yes | Removed item or `undefined` | $\mathcal{O}(n)$ | ES1 | Remove from front |
| `unshift()` | ✅ Yes | `number` (new length) | $\mathcal{O}(n)$ | ES1 | Prepend to front |
| `splice()` | ✅ Yes | Array of removed items | $\mathcal{O}(n)$ | ES1 | In-place removal & insertion |
| `sort()` | ✅ Yes | Mutated array | $\mathcal{O}(n \log n)$ | ES1 | In-place sort (Timsort) |
| `reverse()` | ✅ Yes | Mutated array | $\mathcal{O}(n)$ | ES1 | In-place reverse |
| `fill()` | ✅ Yes | Mutated array | $\mathcal{O}(n)$ | ES6 | In-place fill |
| `copyWithin()` | ✅ Yes | Mutated array | $\mathcal{O}(n)$ | ES6 | In-place block memory copy |
| `slice()` | ❌ No | New array | $\mathcal{O}(k)$ | ES1 | Shallow copy subsegment |
| `concat()` | ❌ No | New array | $\mathcal{O}(n + m)$ | ES1 | Merge arrays |
| `map()` | ❌ No | New array | $\mathcal{O}(n)$ | ES5 | 1:1 projection |
| `filter()` | ❌ No | New array | $\mathcal{O}(n)$ | ES5 | Subsetting |
| `reduce()` | ❌ No | Accumulator value | $\mathcal{O}(n)$ | ES5 | Universal fold |
| `flat()` | ❌ No | New array | $\mathcal{O}(n)$ | ES2019 | Flatten sub-arrays |
| `flatMap()` | ❌ No | New array | $\mathcal{O}(n)$ | ES2019 | Map and flatten 1 level |
| `toSorted()` | ❌ No | New sorted array | $\mathcal{O}(n \log n)$ | ES2023 | Pure sort |
| `toReversed()`| ❌ No | New reversed array | $\mathcal{O}(n)$ | ES2023 | Pure reverse |
| `toSpliced()` | ❌ No | New array | $\mathcal{O}(n)$ | ES2023 | Pure splice |
| `with()` | ❌ No | New array | $\mathcal{O}(n)$ | ES2023 | Pure single-index update |
| `at()` | ❌ No | Element or `undefined` | $\mathcal{O}(1)$ | ES2022 | Negative relative index |

---

### 3. 15 Common Mistakes & Junior Pitfalls

1. **`new Array(5)` vs `Array.of(5)`**: `new Array(5)` creates 5 empty holes! Use `Array.of(5)` or `[5]`.
2. **`Array(3).fill({})` Reference Sharing**: All slots point to the same object reference. Use `Array.from({ length: 3 }, () => ({}))`.
3. **`delete arr[i]`**: Leaves an empty hole and does NOT update length! Use `arr.splice(i, 1)` or `arr.toSpliced(i, 1)`.
4. **`arr.sort()` Without Comparator**: Alphabetically sorts numbers (`[1, 10, 2]`). Always provide `(a, b) => a - b`.
5. **`forEach(async () => ...)`**: Does NOT wait for async operations. Use `for...of` or `Promise.all(arr.map(...))`.
6. **`[].every()` on Empty Array**: Returns `true` due to vacuous truth. Check `arr.length > 0` if non-empty is required.
7. **`indexOf(NaN)`**: Always returns `-1` because `NaN !== NaN`. Use `includes(NaN)` or `findIndex(Number.isNaN)`.
8. **`for...in` on Arrays**: Iterates arbitrary enumerable properties and prototype additions as strings. Use `for...of`.
9. **Modifying Arrays While Iterating**: Splicing an array forward while iterating causes skipped elements. Walk backwards or use `filter`.
10. **Omitting `reduce` Initial Value**: Throws a runtime error on empty arrays. Always specify initial value.
11. **Assuming `[...arr]` Deep Clones**: It only shallow copies the top-level container. Nested objects remain shared.
12. **Using `instanceof Array` Across Realms**: Fails across iframes. Always use `Array.isArray()`.
13. **Excessive Chaining in Hot Loops**: `.filter().map().filter()` creates multiple intermediate arrays, increasing GC pauses.
14. **Using Shift in Large Queues**: `arr.shift()` is $O(n)$. Dequeueing $100,000$ elements takes seconds. Use a Ring Buffer.
15. **Mutating React State Directly**: `state.push(x)` will not trigger UI updates. Always return a new array.

---

### 4. DOs and DON'Ts Summary

* **DO** use `Array.isArray()` for cross-realm defensive type checks.
* **DO** use `arr.at(-1)` instead of `arr[arr.length - 1]`.
* **DO** use `toSorted()`, `toReversed()`, `toSpliced()`, and `with()` for pure React updates.
* **DO** use `Set` for $O(1)$ existence checks and deduplication.
* **DO** use `Map` when keys are objects or when dynamic key addition/deletion is frequent.
* **DON'T** use `delete arr[i]` to remove array elements.
* **DON'T** use `for...in` to iterate array elements.
* **DON'T** use `forEach` with async/await callbacks.
* **DON'T** omit the initial value argument in `reduce()`.
* **DON'T** allocate massive arrays when data can be processed via Streams or Async Iterators.

---

### 5. Senior Array & Collections Mastery Checklist
- [ ] Understand that JS arrays are exotic objects with auto-synchronizing length.
- [ ] Understand the difference between dense and sparse arrays ("holes").
- [ ] Can explain why `push` is amortized $O(1)$ and `shift` is $O(n)$.
- [ ] Mastered `slice` vs `splice` vs `toSpliced` in memory and return values.
- [ ] Mastered the 10 core `reduce` patterns and know when NOT to use `reduce`.
- [ ] Mastered stable comparator mechanics and multi-field sorting.
- [ ] Fluent with ES2023 immutability methods (`with`, `toSorted`, `toReversed`, `toSpliced`).
- [ ] Can implement deep cloning via `structuredClone` and custom recursive fallback.
- [ ] Deeply understand `Set`, `Map`, `WeakMap`, and `WeakSet` garbage collection semantics.
- [ ] Understand TypedArrays, `ArrayBuffer`, and `DataView` endianness.
- [ ] Mastered the 8 algorithmic problem-solving patterns (Two Pointers, Sliding Window, etc.).
- [ ] Mastered all 103 array algorithms with time and space complexity.
- [ ] Capable of building custom data structures on arrays (Heaps, Ring Buffers, Union-Find, Segment Trees).
- [ ] Understand V8 Elements Kinds (`PACKED_SMI` to `HOLEY_ELEMENTS`) and de-optimization costs.
