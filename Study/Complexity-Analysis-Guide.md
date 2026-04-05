# Time & Space Complexity + Optimization + Analysis Guide

> A complete, interview-ready reference — from beginner fundamentals to advanced optimization thinking.

---

## 📚 Table of Contents

1. [What is Complexity Analysis](#1-what-is-complexity-analysis)
2. [Why Complexity Matters](#2-why-complexity-matters)
3. [Time Complexity Basics](#3-time-complexity-basics)
4. [Space Complexity Basics](#4-space-complexity-basics)
5. [Big-O Notation](#5-big-o-notation)
6. [Big-O Rules](#6-big-o-rules)
7. [Common Time Complexities](#7-common-time-complexities)
8. [Common Space Complexities](#8-common-space-complexities)
9. [How to Calculate Time Complexity](#9-how-to-calculate-time-complexity)
10. [How to Calculate Space Complexity](#10-how-to-calculate-space-complexity)
11. [Best / Average / Worst Case](#11-best--average--worst-case)
12. [Recursion Complexity](#12-recursion-complexity)
13. [Amortized Complexity](#13-amortized-complexity)
14. [Trade-offs — Time vs Space](#14-trade-offs--time-vs-space)
15. [Complexity of Common JS Operations](#15-complexity-of-common-js-operations)
16. [Common Mistakes](#16-common-mistakes)
17. [Quick Cheat Sheet](#17-quick-cheat-sheet)

---

**Part 2 — How to Calculate Time Complexity (Deep Dive)**

18. [Count Loops](#rule-1-count-loops)
19. [Ignore Constants](#rule-2-ignore-constants)
20. [Sequential Code](#rule-3-sequential-code)
21. [Nested Loops](#rule-4-nested-loops)
22. [Different Variables](#rule-5-different-variables)
23. [Logarithmic Complexity](#rule-6-logarithmic-complexity)
24. [Recursion Analysis](#rule-7-recursion)
25. [Built-in Methods](#rule-8-built-in-methods)

**Part 3 — How to Calculate Space Complexity**

26. [Variables — O(1)](#space-rule-1-variables--o1)
27. [Arrays — O(n)](#space-rule-2-arrays--on)
28. [Objects and Maps — O(n)](#space-rule-3-objects--maps--on)
29. [Recursion Stack](#space-rule-4-recursion-stack)
30. [Auxiliary vs Input Space](#space-rule-5-auxiliary-space-vs-input-space)

**Part 4 — How to Identify the Best Solution**

31. [Start with Brute Force](#step-1-start-with-brute-force)
32. [Identify Bottlenecks](#step-2-identify-bottlenecks)
33. [Reduce Nested Loops](#step-3-reduce-nested-loops)
34. [Use Patterns](#step-4-use-patterns)
35. [Compare Complexities](#step-5-compare-complexities)
36. [Know When a Solution is Optimal](#step-6-know-when-a-solution-is-optimal)

**Part 5 — Complexity in DSA Patterns**

37. [Arrays](#arrays)
38. [HashMap](#hashmap)
39. [Two Pointers](#two-pointers)
40. [Sliding Window](#sliding-window)
41. [Recursion](#recursion)
42. [Trees](#trees)
43. [Graphs](#graphs)

---

# PART 1 — Complete Time & Space Complexity

---

## 1. What is Complexity Analysis

### Explanation

Complexity analysis is the study of how an algorithm's **resource usage** — primarily time and memory — grows as the input size grows.

When you write a function, two questions always exist:

- **How long does it take to run?** → Time Complexity
- **How much memory does it use?** → Space Complexity

We do not measure these in seconds or megabytes. Instead we measure them in terms of **how they scale** relative to input size `n`. This is because actual seconds depend on the hardware — a faster computer runs the same code faster, but the *growth rate* of the algorithm stays the same regardless.

Think of it this way: if you have 10 items, sorting may take 1ms. If you have 10,000 items, does it take 1000ms? Or 100ms? Or 130ms? The *pattern* of that growth is what complexity analysis captures.

### Examples

```js
// Example A — reading one element
function getFirst(arr) {
  return arr[0]; // always 1 operation, no matter how large arr is
}

// Example B — printing every element
function printAll(arr) {
  for (let i = 0; i < arr.length; i++) {
    console.log(arr[i]); // runs n times
  }
}

// Example C — checking every pair
function printPairs(arr) {
  for (let i = 0; i < arr.length; i++) {
    for (let j = 0; j < arr.length; j++) {
      console.log(arr[i], arr[j]); // runs n * n times
    }
  }
}
```

- `getFirst` → O(1) — constant, doesn't grow
- `printAll` → O(n) — grows linearly with input
- `printPairs` → O(n²) — grows quadratically

### Key Points

- We analyze growth rate, not exact operation counts
- Input size is usually called `n`
- Complexity is a mathematical abstraction, not a benchmark

### Common Mistakes

- Confusing "fast code" with "good complexity" — a slow machine running O(1) beats a fast machine running O(n²) at large inputs
- Thinking complexity analysis is only for interviews — it guides every real engineering decision

### Extra Notes

Complexity analysis applies to every algorithm, not just sorting. It applies to database queries, API pagination, rendering loops, and more.

---

## 2. Why Complexity Matters

### Explanation

The difference between a good algorithm and a bad one is not style — it is scale. When inputs are small (n = 10), almost any solution works. When inputs grow (n = 1,000,000), a bad complexity can make software completely unusable.

### Examples

```
n = 1,000 items:

O(1)       →   1 operation
O(log n)   →   10 operations
O(n)       →   1,000 operations
O(n log n) →   10,000 operations
O(n²)      →   1,000,000 operations  ← starts to feel slow
O(2ⁿ)      →   2^1000 operations     ← computationally impossible
```

Real-world scenario: You're building a social network with 50 million users. A function that runs O(n²) to find mutual friends would require **2.5 quadrillion operations** — your server would never finish.

### Key Points

- O(n²) is fine for n = 100 but dangerous for n = 100,000+
- Knowing complexity lets you predict whether a solution will scale
- In interviews, complexity is a primary evaluation criterion — showing you understand it separates good from great candidates

### Common Mistakes

- Optimizing prematurely for tiny inputs
- Ignoring space complexity and running out of memory instead of time

---

## 3. Time Complexity Basics

### Explanation

Time complexity measures **how the number of operations an algorithm performs grows** as the input size `n` grows.

It answers: "If I double the input, does the work double? Quadruple? Stay the same?"

We don't count exact operations — we count the *dominant* operations that scale with input.

### Examples

```js
// O(1) — one operation regardless of input size
function isEven(n) {
  return n % 2 === 0;
}

// O(n) — loop runs n times
function sumArray(arr) {
  let total = 0;
  for (let i = 0; i < arr.length; i++) {
    total += arr[i];
  }
  return total;
}

// O(n²) — loop inside a loop, each runs n times
function bubbleSort(arr) {
  for (let i = 0; i < arr.length; i++) {
    for (let j = 0; j < arr.length - 1; j++) {
      if (arr[j] > arr[j + 1]) {
        [arr[j], arr[j + 1]] = [arr[j + 1], arr[j]];
      }
    }
  }
  return arr;
}
```

### Key Points

- Time complexity is about the number of *steps*, not clock time
- The variable `n` represents the size of the input (array length, string length, number of nodes, etc.)
- We only keep the **dominant term** and drop constants

### Common Mistakes

- Counting assignment lines and return statements as significant — they are O(1) and get dropped
- Forgetting that `arr.length` itself is O(1) in JavaScript (it's a stored property)

---

## 4. Space Complexity Basics

### Explanation

Space complexity measures **how much memory an algorithm uses** as the input size grows.

This includes:
- Variables you declare
- Data structures you create (arrays, objects, maps)
- The call stack when using recursion

It does **not** include the memory of the input itself (that's input space, covered later).

### Examples

```js
// O(1) space — only fixed variables created
function findMax(arr) {
  let max = arr[0]; // one variable — doesn't grow with input
  for (let i = 1; i < arr.length; i++) {
    if (arr[i] > max) max = arr[i];
  }
  return max;
}

// O(n) space — creating a new array of size n
function doubleValues(arr) {
  const result = []; // grows with input
  for (let i = 0; i < arr.length; i++) {
    result.push(arr[i] * 2);
  }
  return result;
}

// O(n) space — object grows proportionally
function countFrequency(arr) {
  const freq = {};
  for (const item of arr) {
    freq[item] = (freq[item] || 0) + 1; // at most n keys
  }
  return freq;
}
```

### Key Points

- Space complexity counts memory *you allocate*, not the input
- Recursion adds space via the call stack (each function call occupies a stack frame)
- A common trade-off: use more memory to get faster time

### Common Mistakes

- Forgetting recursive call stack space
- Assuming "in-place" algorithms are always O(1) space (sometimes they still use the stack)

---

## 5. Big-O Notation

### Explanation

Big-O notation is a mathematical language for expressing the **upper bound** of an algorithm's growth rate. It answers: "In the worst case, how does this algorithm scale?"

The "O" stands for "Order of" — as in "on the order of n" or "on the order of n squared."

Formally: `f(n) = O(g(n))` means that for large enough `n`, `f(n)` grows no faster than `g(n)` multiplied by some constant.

In practice, you only need to understand: **Big-O tells you the worst-case growth rate, ignoring constants and lower-order terms.**

### Examples

```
Exact operations    Big-O notation
────────────────    ──────────────
3                 → O(1)
2n + 5            → O(n)
4n² + 3n + 7      → O(n²)
n/2               → O(n)
log₂(n) + 3       → O(log n)
n * log(n) + n    → O(n log n)
2ⁿ + n³           → O(2ⁿ)
```

The rule: keep only the **fastest-growing term**, drop the rest, and drop any coefficient.

### Key Points

- Big-O is the ceiling — it describes the worst case
- Big-Ω (Omega) describes the best case
- Big-Θ (Theta) describes the tight bound (when best and worst are the same)
- In interviews, "Big-O" usually means worst case

### Common Mistakes

- Confusing Big-O (worst) with Big-Ω (best) — when someone asks "what's the complexity?", they mean Big-O
- Writing O(2n) instead of simplifying to O(n)

### Extra Notes

You'll also hear:
- **Little-o** — strict upper bound (strictly less than, not equal to)
- **Little-ω** — strict lower bound

These are rarely needed in software interviews but common in theory courses.

---

## 6. Big-O Rules

### Explanation

There are four core rules that let you simplify any complexity expression into proper Big-O form.

---

#### Rule 1: Drop Constants

If the algorithm does `2n` operations, it's still O(n). Constants are machine-dependent and irrelevant to growth rate.

```js
// O(2n) → O(n)
function twoLoops(arr) {
  for (let i = 0; i < arr.length; i++) console.log(arr[i]); // n
  for (let i = 0; i < arr.length; i++) console.log(arr[i]); // n
  // total: 2n → O(n)
}
```

---

#### Rule 2: Drop Non-Dominant Terms

When you have `O(n² + n)`, the `n` is irrelevant compared to `n²` at large values of n.

```
O(n² + n)     → O(n²)
O(n + log n)  → O(n)
O(2ⁿ + n³)   → O(2ⁿ)
```

---

#### Rule 3: Add Complexities for Sequential Steps

When you do one thing then another, **add** the complexities.

```js
function twoThings(arr) {
  // Step 1: O(n)
  for (const x of arr) console.log(x);

  // Step 2: O(n²)
  for (let i = 0; i < arr.length; i++)
    for (let j = 0; j < arr.length; j++)
      console.log(arr[i], arr[j]);
}
// Total: O(n) + O(n²) = O(n²)
```

---

#### Rule 4: Multiply Complexities for Nested Steps

When one thing happens *inside* another, **multiply** the complexities.

```js
function nested(arr) {
  for (let i = 0; i < arr.length; i++) {       // O(n)
    for (let j = 0; j < arr.length; j++) {     // O(n)
      console.log(arr[i] + arr[j]);
    }
  }
}
// n * n = O(n²)
```

---

### Key Points

- Sequential = add
- Nested = multiply
- Always drop constants and non-dominant terms at the end

### Common Mistakes

- Adding when you should multiply (nested loops are multiplication)
- Keeping the `+n` in `O(n² + n)` — it's irrelevant

---

## 7. Common Time Complexities

### Explanation

These are the complexities you will encounter in the vast majority of real problems, listed from fastest to slowest.

---

### O(1) — Constant

Does the same amount of work regardless of input size.

```js
function getElement(arr, i) {
  return arr[i]; // single array access — always 1 step
}

function addTwoNumbers(a, b) {
  return a + b; // always 1 step
}
```

**When you see it:** Array index access, hash map lookup, stack push/pop, arithmetic.

---

### O(log n) — Logarithmic

Work roughly halves the problem with each step. Doubling input only adds one more step.

```js
// Binary search — each comparison eliminates half the array
function binarySearch(arr, target) {
  let left = 0, right = arr.length - 1;
  while (left <= right) {
    const mid = Math.floor((left + right) / 2);
    if (arr[mid] === target) return mid;
    else if (arr[mid] < target) left = mid + 1;
    else right = mid - 1;
  }
  return -1;
}
```

**When you see it:** Binary search, balanced BST operations, dividing the problem in half each iteration.

---

### O(n) — Linear

Work grows directly with input size.

```js
function linearSearch(arr, target) {
  for (const item of arr) {
    if (item === target) return true;
  }
  return false;
}
```

**When you see it:** Single loops, traversal, linear search, building a frequency map.

---

### O(n log n) — Linearithmic

Work is n times log n. Common in efficient sorting.

```js
// Merge sort — splits n times (log n levels), merges n elements per level
function mergeSort(arr) {
  if (arr.length <= 1) return arr;
  const mid = Math.floor(arr.length / 2);
  const left = mergeSort(arr.slice(0, mid));
  const right = mergeSort(arr.slice(mid));
  return merge(left, right);
}
```

**When you see it:** Merge sort, heap sort, most efficient comparison-based sorting algorithms.

---

### O(n²) — Quadratic

Grows as the square of input. Common in naive nested loops.

```js
function hasDuplicates(arr) {
  for (let i = 0; i < arr.length; i++) {
    for (let j = i + 1; j < arr.length; j++) {
      if (arr[i] === arr[j]) return true;
    }
  }
  return false;
}
```

**When you see it:** Bubble sort, selection sort, comparing every pair, nested loops over the same data.

---

### O(n³) — Cubic

Triple nested loops. Rare but exists (e.g., naive matrix multiplication).

```js
function matrixMultiply(A, B, C, n) {
  for (let i = 0; i < n; i++)
    for (let j = 0; j < n; j++)
      for (let k = 0; k < n; k++)
        C[i][j] += A[i][k] * B[k][j];
}
```

---

### O(2ⁿ) — Exponential

Work doubles with each additional input element. Often seen in brute-force combinatorics.

```js
// Naive fibonacci — two recursive calls each time
function fib(n) {
  if (n <= 1) return n;
  return fib(n - 1) + fib(n - 2);
}
```

**When you see it:** Recursive problems without memoization, exploring all subsets (power set), some backtracking.

---

### O(n!) — Factorial

Worst possible. Every permutation is explored.

```js
// Generating all permutations of n elements
function permutations(arr) {
  if (arr.length <= 1) return [arr];
  const result = [];
  for (let i = 0; i < arr.length; i++) {
    const rest = [...arr.slice(0, i), ...arr.slice(i + 1)];
    for (const perm of permutations(rest)) {
      result.push([arr[i], ...perm]);
    }
  }
  return result;
}
```

**When you see it:** Traveling salesman brute force, all permutations, some backtracking on ordered sequences.

---

### Growth Comparison

```
n = 10:
  O(1)      →  1
  O(log n)  →  3
  O(n)      →  10
  O(n log n)→  33
  O(n²)     →  100
  O(2ⁿ)    →  1,024
  O(n!)     →  3,628,800

n = 100:
  O(1)      →  1
  O(log n)  →  7
  O(n)      →  100
  O(n log n)→  664
  O(n²)     →  10,000
  O(2ⁿ)    →  1.27 × 10³⁰   ← unacceptable
```

### Key Points

- Aim for O(1), O(log n), or O(n) when possible
- O(n log n) is the best achievable for comparison-based sorting
- O(n²) is acceptable for small inputs but avoid it for large `n`
- O(2ⁿ) and O(n!) require optimization (memoization, pruning) for any real use

---

## 8. Common Space Complexities

### Explanation

Space complexity follows the same notation but measures memory allocation.

---

### O(1) — Constant Space

Only a fixed number of variables created, no matter input size.

```js
function sum(arr) {
  let total = 0;          // 1 variable
  for (const n of arr) total += n;
  return total;
}
// Space: O(1) — just `total` and the loop variable
```

---

### O(log n) — Logarithmic Space

Usually from recursion depth that halves each call.

```js
function binarySearch(arr, target, left = 0, right = arr.length - 1) {
  if (left > right) return -1;
  const mid = Math.floor((left + right) / 2);
  if (arr[mid] === target) return mid;
  if (arr[mid] < target) return binarySearch(arr, target, mid + 1, right);
  return binarySearch(arr, target, left, mid - 1);
}
// Stack depth: log n levels → O(log n) space
```

---

### O(n) — Linear Space

Creating a data structure proportional to input.

```js
function copyArray(arr) {
  return [...arr]; // new array of size n → O(n) space
}

function buildFreqMap(arr) {
  const map = {};
  for (const x of arr) map[x] = (map[x] || 0) + 1;
  return map; // at most n keys → O(n) space
}
```

---

### O(n²) — Quadratic Space

Creating a 2D structure (matrix) of size n × n.

```js
function createMatrix(n) {
  const matrix = [];
  for (let i = 0; i < n; i++) {
    matrix[i] = new Array(n).fill(0); // n arrays of n elements
  }
  return matrix;
}
// Space: O(n²)
```

---

### Key Points

- Think about every data structure you create
- Recursion always uses stack space equal to the maximum call depth
- "In-place" means O(1) auxiliary space (but the algorithm still has input space)

---

## 9. How to Calculate Time Complexity

> This is one of the most important skills for interviews. Master this section.

### The Process

**Step 1:** Identify the input size variable (usually `n`)
**Step 2:** Find every loop or recursive call
**Step 3:** Determine how many times each section runs
**Step 4:** Apply the rules: add for sequential, multiply for nested
**Step 5:** Drop constants and non-dominant terms

### Examples (Worked Through Fully)

```js
// ─── Example 1 ───
function example1(arr) {
  let sum = 0;                          // O(1)
  for (let i = 0; i < arr.length; i++) // O(n)
    sum += arr[i];                      // O(1) inside the loop
  return sum;                           // O(1)
}
// Analysis: O(1) + O(n) * O(1) + O(1) = O(n)
// Result: O(n)

// ─── Example 2 ───
function example2(arr) {
  for (let i = 0; i < arr.length; i++) {        // O(n)
    for (let j = 0; j < arr.length; j++) {      // O(n)
      console.log(arr[i] + arr[j]);             // O(1)
    }
  }
}
// Analysis: n * n * 1 = n²
// Result: O(n²)

// ─── Example 3 ───
function example3(arr) {
  for (const x of arr) console.log(x);   // O(n)
  for (const x of arr) console.log(x);   // O(n)  ← sequential, not nested!
}
// Analysis: O(n) + O(n) = O(2n) → drop constant → O(n)
// Result: O(n)

// ─── Example 4 ───
function example4(arr, matrix) {
  // arr has n elements, matrix is n x n
  for (const x of arr) console.log(x);                // O(n)
  for (const row of matrix)                            // O(n)
    for (const cell of row) console.log(cell);         // O(n)
}
// Analysis: O(n) + O(n²) = O(n² + n) → drop non-dominant → O(n²)
// Result: O(n²)
```

---

## 10. How to Calculate Space Complexity

### The Process

**Step 1:** Ignore input space (unless the problem asks for total space)
**Step 2:** List every variable, array, object, or data structure you create
**Step 3:** Ask: does this grow with n, or is it fixed?
**Step 4:** Add space for recursion call stack depth
**Step 5:** Take the dominant term

### Examples (Worked Through Fully)

```js
// ─── Example 1: O(1) space ───
function findMin(arr) {
  let min = arr[0];                    // 1 variable — O(1)
  for (let i = 1; i < arr.length; i++)
    if (arr[i] < min) min = arr[i];
  return min;
}
// Variables created: min, i → both fixed → O(1) space

// ─── Example 2: O(n) space ───
function getEvens(arr) {
  const result = [];                   // grows up to n elements → O(n)
  for (const x of arr)
    if (x % 2 === 0) result.push(x);
  return result;
}
// Variables: result (up to n), x → O(n) space

// ─── Example 3: Recursion — O(n) space ───
function factorial(n) {
  if (n === 0) return 1;
  return n * factorial(n - 1);         // n frames on the call stack
}
// Call stack depth: n levels → O(n) space
// Each frame stores: n (the argument) and the return address

// ─── Example 4: Recursion with O(log n) space ───
function binarySearch(arr, t, l = 0, r = arr.length - 1) {
  if (l > r) return -1;
  const m = Math.floor((l + r) / 2);
  if (arr[m] === t) return m;
  if (arr[m] < t) return binarySearch(arr, t, m + 1, r);
  return binarySearch(arr, t, l, m - 1);
}
// Problem halves each call → depth is log n → O(log n) space
```

---

## 11. Best / Average / Worst Case

### Explanation

An algorithm's complexity can differ depending on what the input looks like. The three cases capture this:

- **Best Case (Ω)** — the most favorable input possible; how fast can we be?
- **Average Case (Θ)** — a typical, random input; what do we usually expect?
- **Worst Case (O)** — the least favorable input; how bad can it get?

In interviews, unless stated otherwise, **always analyze the worst case.**

### Examples

```js
// Linear search
function linearSearch(arr, target) {
  for (let i = 0; i < arr.length; i++) {
    if (arr[i] === target) return i;
  }
  return -1;
}

// Best case: target is arr[0] → O(1) (found immediately)
// Average case: target is somewhere in the middle → O(n/2) → O(n)
// Worst case: target is arr[n-1] or not found → O(n)


// Quick sort
// Best case:  pivot always splits array perfectly → O(n log n)
// Average:    random pivots → O(n log n)
// Worst case: sorted input, pivot always smallest/largest → O(n²)
```

### Key Points

- When someone asks "what's the time complexity?", they want worst case
- Choosing a good pivot in quicksort avoids the worst case (randomized quicksort)
- Hash maps have O(1) average case but O(n) worst case due to hash collisions

### Common Mistakes

- Saying quicksort is O(n log n) without qualifying — it's O(n²) worst case
- Ignoring the worst case in interviews and only describing the happy path

---

## 12. Recursion Complexity

### Explanation

Recursive algorithms are harder to analyze because you can't just read a loop. You need to figure out:

1. **How deep does the recursion go?** (time and space)
2. **How many branches does each call make?** (time)

The total work = `branches^depth` if each level does constant work, but this needs careful reasoning.

### Method 1: Trace the Call Tree

```js
// fib(4) call tree:
//
//           fib(4)
//          /      \
//       fib(3)   fib(2)
//       /   \    /   \
//    fib(2) fib(1) fib(1) fib(0)
//    /   \
// fib(1) fib(0)
//
// Branches: 2 per call
// Depth: n
// Total nodes: ~2ⁿ → O(2ⁿ) time
// Stack depth: n → O(n) space

function fib(n) {
  if (n <= 1) return n;
  return fib(n - 1) + fib(n - 2);
}
```

### Method 2: Recurrence Relations

Express the work as a formula:

```
T(n) = T(n-1) + O(1)     → O(n)   (linear recursion)
T(n) = T(n/2) + O(1)     → O(log n)  (halving)
T(n) = 2T(n/2) + O(n)    → O(n log n)  (merge sort)
T(n) = 2T(n-1) + O(1)    → O(2ⁿ)  (exponential)
```

### Examples

```js
// Example 1: O(n) time, O(n) space
function countdown(n) {
  if (n <= 0) return;
  console.log(n);
  countdown(n - 1); // one call, depth n
}
// T(n) = T(n-1) + 1 → O(n)

// Example 2: O(n) time, O(log n) space (tail-call-like)
function binarySum(arr, l = 0, r = arr.length - 1) {
  if (l === r) return arr[l];
  const mid = Math.floor((l + r) / 2);
  return binarySum(arr, l, mid) + binarySum(arr, mid + 1, r);
}
// This makes 2 recursive calls but total work across all levels = O(n)
// Tree has n leaves, so O(n) total nodes → O(n) time, O(log n) space

// Example 3: Memoized fib — O(n) time, O(n) space
function fib(n, memo = {}) {
  if (n <= 1) return n;
  if (memo[n]) return memo[n];
  memo[n] = fib(n - 1, memo) + fib(n - 2, memo);
  return memo[n];
}
// Each value computed once → n unique values → O(n) time
```

### Key Points

- Call tree depth = space complexity (stack frames)
- Total nodes in call tree = time complexity (if each node does O(1) work)
- Memoization eliminates redundant branches, often reducing O(2ⁿ) to O(n)

### Common Mistakes

- Assuming O(n) time just because there's one recursive call — check the depth
- Forgetting the call stack adds O(depth) to space complexity

---

## 13. Amortized Complexity

### Explanation

Amortized complexity is the **average cost per operation over a sequence of operations**, even if some individual operations are expensive.

The classic example is a dynamic array (like JavaScript's `Array` or Java's `ArrayList`). Most `push` operations are O(1), but occasionally the array must resize — copying all elements — which is O(n). However, resizing happens so rarely that the average cost per push is still O(1).

Think of it as amortizing (spreading) the cost of rare expensive operations across many cheap ones.

### Examples

```js
// Dynamic array push — amortized O(1)
// When array is full (say capacity c):
//   - Copy c elements → O(c)
//   - Double capacity to 2c
//   - Next c-1 pushes are all O(1)
// Total cost for c pushes after resize: c + (c-1) ≈ 2c
// Per operation: 2c / c = O(2) → O(1) amortized

const arr = [];
for (let i = 0; i < 1000; i++) {
  arr.push(i); // sometimes triggers resize, but amortized O(1)
}
```

Another example: the `Two Stack Queue` or any data structure with occasional O(n) rebalancing.

### Key Points

- Amortized is not the same as average case — it's a worst-case bound over sequences
- Used to analyze data structures like dynamic arrays, hash tables, union-find
- JavaScript `Array.push()` is amortized O(1) — this is important for interviews

### Common Mistakes

- Saying `push` is O(n) because it can resize — that's the one-off case, not amortized
- Confusing amortized analysis with average-case analysis (which requires probability theory)

---

## 14. Trade-offs — Time vs Space

### Explanation

In algorithm design, time and space often trade off against each other. You can frequently:

- **Use more memory to go faster** — precompute, cache, or index data
- **Use less memory by doing more work** — recompute values on demand

Understanding this trade-off is essential for interviews and system design.

### Examples

```js
// ─── BRUTE FORCE: O(n²) time, O(1) space ───
function hasDuplicate_slow(arr) {
  for (let i = 0; i < arr.length; i++)
    for (let j = i + 1; j < arr.length; j++)
      if (arr[i] === arr[j]) return true;
  return false;
}

// ─── OPTIMIZED: O(n) time, O(n) space ───
function hasDuplicate_fast(arr) {
  const seen = new Set(); // trade space for time
  for (const x of arr) {
    if (seen.has(x)) return true;
    seen.add(x);
  }
  return false;
}
```

```js
// ─── Fibonacci: O(2ⁿ) time, O(n) space (recursion stack) ───
function fib_slow(n) {
  if (n <= 1) return n;
  return fib_slow(n - 1) + fib_slow(n - 2);
}

// ─── Memoized: O(n) time, O(n) space (memo table + stack) ───
const memo = {};
function fib_memo(n) {
  if (n <= 1) return n;
  if (memo[n]) return memo[n];
  return (memo[n] = fib_memo(n - 1) + fib_memo(n - 2));
}

// ─── Iterative DP: O(n) time, O(n) space ───
function fib_dp(n) {
  const dp = [0, 1];
  for (let i = 2; i <= n; i++) dp[i] = dp[i - 1] + dp[i - 2];
  return dp[n];
}

// ─── Optimized DP: O(n) time, O(1) space ───
function fib_optimal(n) {
  if (n <= 1) return n;
  let prev = 0, curr = 1;
  for (let i = 2; i <= n; i++) {
    [prev, curr] = [curr, prev + curr]; // only keep last two values
  }
  return curr;
}
```

### Key Points

- The HashSet/HashMap pattern is the most common time-space trade-off in interviews
- Memoization trades space for time in recursive problems
- Rolling variables (as in `fib_optimal`) is the pattern for reducing O(n) space to O(1)

### Common Mistakes

- Always defaulting to the brute force approach because it uses less space — in most interviews, O(n) space for a faster solution is perfectly acceptable
- Not recognizing when a hash map can eliminate a nested loop

---

## 15. Complexity of Common JS Operations

### Explanation

Every built-in operation has a complexity. Knowing these is essential — using a slow built-in inside a loop can unknowingly blow up your complexity.

### Arrays

| Operation | Complexity | Notes |
|-----------|-----------|-------|
| `arr[i]` | O(1) | Direct index access |
| `arr.push(x)` | O(1) amortized | Appends to end |
| `arr.pop()` | O(1) | Removes from end |
| `arr.unshift(x)` | O(n) | Prepends — shifts all elements |
| `arr.shift()` | O(n) | Removes front — shifts all elements |
| `arr.splice(i, n)` | O(n) | Must shift elements |
| `arr.slice(i, j)` | O(j - i) | Copies a portion |
| `arr.indexOf(x)` | O(n) | Linear scan |
| `arr.includes(x)` | O(n) | Linear scan |
| `arr.find(fn)` | O(n) | Linear scan |
| `arr.sort()` | O(n log n) | Timsort in V8 |
| `arr.reverse()` | O(n) | Swaps in place |
| `arr.map(fn)` | O(n) | Creates new array |
| `arr.filter(fn)` | O(n) | Creates new array |
| `arr.reduce(fn)` | O(n) | Single pass |
| `arr.forEach(fn)` | O(n) | Single pass |
| `arr.flat()` | O(n) | where n = total elements |
| `arr.concat(arr2)` | O(n + m) | Creates new array |
| `[...arr]` spread | O(n) | Copies all elements |

### Strings

| Operation | Complexity | Notes |
|-----------|-----------|-------|
| `str[i]` | O(1) | Index access |
| `str.length` | O(1) | Stored property |
| `str.slice(i, j)` | O(j - i) | Creates new string |
| `str.split(sep)` | O(n) | Creates array |
| `str.includes(sub)` | O(n * m) | n=string len, m=sub len |
| `str.indexOf(sub)` | O(n * m) | |
| `str + str2` | O(n + m) | Creates new string |
| `str.replace(a, b)` | O(n) | |
| `str.toLowerCase()` | O(n) | |

> **Critical note:** String concatenation inside a loop `s += x` is O(n²) total because each concatenation creates a new string. Use `arr.push()` + `arr.join('')` instead for O(n).

### Objects / Maps

| Operation | Complexity | Notes |
|-----------|-----------|-------|
| `obj[key]` | O(1) avg | Hash lookup |
| `obj[key] = val` | O(1) avg | Hash insert |
| `delete obj[key]` | O(1) avg | Hash delete |
| `key in obj` | O(1) avg | |
| `Object.keys(obj)` | O(n) | n = num keys |
| `Object.values(obj)` | O(n) | |
| `Object.entries(obj)` | O(n) | |
| `Map.get(key)` | O(1) avg | |
| `Map.set(key, val)` | O(1) avg | |
| `Map.has(key)` | O(1) avg | |
| `Map.delete(key)` | O(1) avg | |

### Sets

| Operation | Complexity | Notes |
|-----------|-----------|-------|
| `set.add(x)` | O(1) avg | |
| `set.has(x)` | O(1) avg | |
| `set.delete(x)` | O(1) avg | |
| `set.size` | O(1) | |

### Key Points

- `unshift` and `shift` are O(n) — avoid them in hot paths; use a deque or pointer instead
- `sort` is O(n log n) — calling it inside a loop gives you O(n² log n)
- String `+=` inside a loop = O(n²) — a very common bug
- HashMap/Set lookups are O(1) — use them to replace O(n) linear searches

### Common Mistakes

- Using `arr.includes(x)` inside a loop (O(n²) total) instead of converting to a Set first
- Using `arr.unshift()` in a loop thinking it's O(1)
- Calling `str.split('').reverse().join('')` without realizing it's O(n) — which is fine, just know it

---

## 16. Common Mistakes

### Mistake 1: Not Simplifying

```
Wrong: "O(3n² + 5n + 2)"
Right: "O(n²)"
```

### Mistake 2: String Concatenation in Loops

```js
// BAD — O(n²)
let result = '';
for (const char of str) result += char; // new string created each time

// GOOD — O(n)
const parts = [];
for (const char of str) parts.push(char);
const result = parts.join('');
```

### Mistake 3: Forgetting Recursive Stack Space

```js
// This is O(n) space, not O(1)!
function sum(n) {
  if (n === 0) return 0;
  return n + sum(n - 1); // n frames on stack
}
```

### Mistake 4: Treating All Array Operations as O(1)

```js
// This loop is O(n²) because unshift is O(n)!
for (const x of data) {
  result.unshift(x); // O(n) per call
}
```

### Mistake 5: Calling sort() Inside a Loop

```js
// O(n² log n) — sort is O(n log n), called n times
for (const x of data) {
  arr.sort();
  // ...
}
```

### Mistake 6: Ignoring Hidden Loops

```js
// str.split creates an array — O(n)
// .reverse() — O(n)
// .join — O(n)
// Total: O(n) — this is FINE, just know it
const reversed = str.split('').reverse().join('');
```

### Mistake 7: Using Wrong Variable for Nested Collections

```js
// n = number of words, m = average word length
function countLetters(words) {
  let count = 0;
  for (const word of words) {        // O(n)
    for (const char of word) {       // O(m)
      count++;
    }
  }
  return count;
}
// Time: O(n * m) — NOT O(n²)
```

---

## 17. Quick Cheat Sheet

```
Complexity   Name           Example
─────────────────────────────────────────────────────────
O(1)         Constant       Array access, hash lookup
O(log n)     Logarithmic    Binary search, BST operations
O(n)         Linear         Single loop, linear search
O(n log n)   Linearithmic   Merge sort, heap sort
O(n²)        Quadratic      Nested loops, bubble sort
O(n³)        Cubic          Triple nested loops
O(2ⁿ)       Exponential    Recursive fib, power set
O(n!)        Factorial      All permutations

─── Big-O Rules ───────────────────────────────────────
Sequential steps:   add    O(n) + O(n²) = O(n²)
Nested steps:       multiply  O(n) * O(n) = O(n²)
Drop constants:     O(3n) → O(n)
Drop non-dominant:  O(n² + n) → O(n²)

─── Space Summary ──────────────────────────────────────
Fixed variables:    O(1)
Array/object of n:  O(n)
Recursion depth d:  O(d)
Matrix n×n:         O(n²)
```

---

# PART 2 — How to Calculate Time Complexity (Deep Dive)

> The goal of this section is to make complexity analysis feel automatic. Read each rule, understand the reasoning, then practice applying it mentally.

---

## Rule 1: Count Loops

### Explanation

A loop that runs through `n` elements does `n` units of work. That's O(n).

If you have a loop nested inside another loop, each iteration of the outer loop triggers a full run of the inner loop — that's multiplication.

### Examples

```js
// ─── Single loop → O(n) ───
function printAll(arr) {
  for (let i = 0; i < arr.length; i++) {  // runs n times
    console.log(arr[i]);                   // O(1) work per iteration
  }
}
// n * 1 = O(n)


// ─── Two sequential loops → O(n) ───
function printTwice(arr) {
  for (const x of arr) console.log(x);   // n
  for (const x of arr) console.log(x);   // n
}
// n + n = 2n → O(n)


// ─── Nested loops → O(n²) ───
function printPairs(arr) {
  for (let i = 0; i < arr.length; i++) {         // n
    for (let j = 0; j < arr.length; j++) {       // n
      console.log(arr[i], arr[j]);
    }
  }
}
// n * n = O(n²)


// ─── Loop not starting at 0 ───
function printUpperTriangle(arr) {
  for (let i = 0; i < arr.length; i++) {          // n
    for (let j = i; j < arr.length; j++) {        // n - i (on average n/2)
      console.log(arr[i], arr[j]);
    }
  }
}
// Total iterations: n + (n-1) + (n-2) + ... + 1 = n(n+1)/2 ≈ n²/2 → O(n²)
// The constant 1/2 is dropped
```

### Key Points

- Every independent loop over `n` elements = O(n)
- Nested loops multiply: loop-in-a-loop = O(n²)
- Triangular loops (j starts at i) are still O(n²) after simplification
- Loop bounds don't have to be exactly `arr.length` — any expression proportional to n is O(n)

### Common Mistakes

- Thinking j starting at i+1 makes the inner loop "not O(n)" — it's still O(n) on average

---

## Rule 2: Ignore Constants

### Explanation

Constants don't affect the growth rate. O(2n) and O(n) grow at the same rate — linearly. If you double n, both double. The "2" is irrelevant when comparing at scale.

More precisely: Big-O is defined as "up to a constant factor," so constants are absorbed into the definition itself.

### Examples

```js
// 3 separate loops → O(3n) → O(n)
function threeLoops(arr) {
  for (const x of arr) console.log(x);   // n
  for (const x of arr) console.log(x);   // n
  for (const x of arr) console.log(x);   // n
  // 3n → drop constant → O(n)
}

// 100 print statements → O(100) → O(1)
function printHeader() {
  console.log("line 1");
  console.log("line 2");
  // ... 100 lines
  console.log("line 100");
  // 100 operations — constant, not growing with input → O(1)
}

// Loop runs n/2 times → O(n/2) → O(n)
function skipEvens(arr) {
  for (let i = 0; i < arr.length; i += 2) {  // runs n/2 times
    console.log(arr[i]);
  }
  // n/2 → drop constant → O(n)
}
```

### Key Points

- O(5n²) = O(n²) — coefficients are always dropped
- O(1000) = O(1) — any fixed number of operations is constant
- This is not about "big constants don't matter" — it's about growth rate

### Common Mistakes

- Writing O(n/2) — simplify to O(n)
- Writing O(5) — simplify to O(1)

---

## Rule 3: Sequential Code

### Explanation

When you do step A, then step B (not nested), you **add** the complexities. Then simplify by dropping the non-dominant term.

Think of it as: the total work is the sum of the individual parts.

### Examples

```js
// O(n) + O(n²) → O(n²)
function twoPhases(arr) {
  // Phase 1: O(n)
  let sum = 0;
  for (const x of arr) sum += x;

  // Phase 2: O(n²)
  for (let i = 0; i < arr.length; i++)
    for (let j = 0; j < arr.length; j++)
      console.log(arr[i] + arr[j]);
}
// O(n) + O(n²) = O(n² + n) → drop n → O(n²)


// O(n log n) + O(n) → O(n log n)
function sortAndSearch(arr, target) {
  arr.sort();                         // O(n log n)
  return binarySearch(arr, target);   // O(log n)
}
// O(n log n) + O(log n) → drop log n → O(n log n)


// O(n) + O(m) → O(n + m)   ← cannot simplify if n and m are unrelated
function processTwo(arr1, arr2) {
  for (const x of arr1) console.log(x);   // O(n)
  for (const x of arr2) console.log(x);   // O(m)
}
// O(n + m) — cannot simplify, both are dominant (different variables)
```

### Key Points

- Sequential = add the complexities
- After adding, simplify by dropping the smaller term
- If two inputs are unrelated (n and m), you cannot simplify O(n + m)

### Common Mistakes

- Saying O(n) + O(n) = O(n²) — that's wrong, it's still O(n) (or O(2n) → O(n))
- Trying to simplify O(n + m) to O(n) — only valid if you know m ≤ n

---

## Rule 4: Nested Loops

### Explanation

When loop B runs entirely inside loop A, every single iteration of A triggers a full run of B. This means you **multiply**.

This is the source of most O(n²), O(n³), and O(n log n) complexities.

### Examples

```js
// Standard O(n²)
for (let i = 0; i < n; i++) {         // n iterations
  for (let j = 0; j < n; j++) {       // n iterations each time
    // n * n = n²
  }
}


// O(n * m) — different array sizes
for (let i = 0; i < n; i++) {
  for (let j = 0; j < m; j++) {
    // n * m
  }
}


// O(n log n) — inner loop halves each time
for (let i = 0; i < n; i++) {           // n
  for (let j = 1; j < n; j = j * 2) {  // log n
    // n * log n
  }
}


// O(n²) — three sequential nested pairs
for (let i = 0; i < n; i++) {
  for (let j = 0; j < n; j++) {
    console.log(i + j);   // n²
  }
}
for (let i = 0; i < n; i++) {
  for (let j = 0; j < n; j++) {
    console.log(i * j);   // n²
  }
}
// n² + n² = 2n² → O(n²)
```

### Key Points

- Nesting = multiply
- Every additional layer of nesting adds another factor of n
- Watch for inner loops with non-n bounds — the actual bound determines the factor

### Common Mistakes

- Forgetting that the inner loop still runs n times for every outer iteration, even if the inner loop variable is independent

---

## Rule 5: Different Variables

### Explanation

When two loops iterate over **different** inputs, you must use **different variables** to represent them. You cannot collapse `O(n + m)` to `O(n)` unless you know m is bounded by n.

This is a subtle but critical point that catches many interviewees off guard.

### Examples

```js
// ─── Two different arrays → O(n + m), NOT O(n) ───
function processBoth(arr1, arr2) {
  for (const x of arr1) console.log(x);   // O(n)
  for (const x of arr2) console.log(x);   // O(m)
}
// Answer: O(n + m)


// ─── Nested with different arrays → O(n * m) ───
function intersection(arr1, arr2) {
  const result = [];
  for (const x of arr1) {               // n
    for (const y of arr2) {             // m
      if (x === y) result.push(x);
    }
  }
  return result;
}
// Answer: O(n * m)


// ─── Correct use of two variables ───
function appendAll(matrix) {
  // matrix has n rows, each row has m elements
  const result = [];
  for (const row of matrix) {          // n
    for (const cell of row) {          // m per row
      result.push(cell);
    }
  }
  return result;
}
// Answer: O(n * m)
// If it's a square matrix: n = m, so O(n²)
```

### Key Points

- When inputs have different sizes, give them different names (n, m, k...)
- `O(n + m)` and `O(n * m)` are both valid answers that cannot be simplified
- Only simplify if you have a provable relationship (e.g., m is always ≤ n)

### Common Mistakes

- Assuming m = n because you see two loops, and writing O(n²) for nested loops over two separate arrays — it should be O(n * m)

---

## Rule 6: Logarithmic Complexity

### Explanation

A loop is O(log n) when the loop variable **multiplies** (or divides) each iteration rather than incrementing by 1.

Why? Because if you multiply by 2 each time, you need log₂(n) steps to reach n. The number of times you can double before exceeding n is exactly log₂(n).

Logarithms mean the problem is being **halved** (or divided by some constant) each step.

### Examples

```js
// ─── Classic log n loop: multiply ───
for (let i = 1; i < n; i = i * 2) {
  console.log(i);
}
// i: 1, 2, 4, 8, 16, ... until i >= n
// Number of iterations: log₂(n) → O(log n)


// ─── Divide version ───
for (let i = n; i >= 1; i = Math.floor(i / 2)) {
  console.log(i);
}
// i: n, n/2, n/4, ..., 1
// Number of iterations: log₂(n) → O(log n)


// ─── Multiply by 3 → still O(log n) ───
for (let i = 1; i < n; i = i * 3) {
  console.log(i);
}
// log₃(n) → still O(log n) (different base, but Big-O drops the base)


// ─── Binary search ───
function binarySearch(arr, target) {
  let left = 0, right = arr.length - 1;
  while (left <= right) {
    const mid = Math.floor((left + right) / 2);
    if (arr[mid] === target) return mid;
    else if (arr[mid] < target) left = mid + 1; // eliminate left half
    else right = mid - 1;                        // eliminate right half
  }
  return -1;
}
// Each iteration eliminates half the remaining elements → O(log n)
```

### Key Points

- Variable multiplies/divides by a constant → O(log n)
- Binary search = O(log n): each comparison halves the search space
- All logarithm bases collapse to O(log n) in Big-O (log base is a constant factor)
- Balanced BST operations (search, insert, delete) = O(log n) because tree height is log n

### Common Mistakes

- Confusing `i = i + 2` (still O(n)) with `i = i * 2` (O(log n)) — addition is linear, multiplication is logarithmic

---

## Rule 7: Recursion

### Explanation

For recursive functions, count the work using two questions:

1. **How deep does the recursion go?** (This gives you the call stack depth, important for space)
2. **How many calls are made at each level?** (This gives you total work)

To find time complexity: draw or mentally trace the call tree. Total time = total number of nodes * work per node.

### Examples

```js
// ─── Linear recursion: O(n) time, O(n) space ───
function printDown(n) {
  if (n <= 0) return;
  console.log(n);
  printDown(n - 1); // one call per level
}
// Depth: n levels, 1 call per level → n total calls → O(n) time
// Stack: n frames deep → O(n) space


// ─── Two branches: O(2ⁿ) time, O(n) space ───
function fib(n) {
  if (n <= 1) return n;
  return fib(n - 1) + fib(n - 2); // two recursive calls
}
// Call tree: ~2 branches per node, depth n → 2ⁿ nodes → O(2ⁿ) time
// Stack depth: n (deepest single path) → O(n) space


// ─── Halving: O(log n) time, O(log n) space ───
function halveDown(n) {
  if (n <= 1) return;
  halveDown(Math.floor(n / 2)); // problem halves each call
}
// Depth: log n → O(log n) time and space


// ─── Merge sort: O(n log n) time, O(n) space ───
function mergeSort(arr) {
  if (arr.length <= 1) return arr;
  const mid = Math.floor(arr.length / 2);
  const left = mergeSort(arr.slice(0, mid));   // n/2
  const right = mergeSort(arr.slice(mid));     // n/2
  return merge(left, right);                   // O(n) work to merge
}
// log n levels in call tree, each level does O(n) total merge work
// → O(n log n) time
// Stack depth: log n, but we hold the merged arrays → O(n) space
```

### Recurrence Relation Quick Reference

```
T(n) = T(n-1) + O(1)     → O(n)
T(n) = T(n-1) + O(n)     → O(n²)
T(n) = T(n/2) + O(1)     → O(log n)
T(n) = T(n/2) + O(n)     → O(n)
T(n) = 2T(n-1) + O(1)    → O(2ⁿ)
T(n) = 2T(n/2) + O(n)    → O(n log n)   ← merge sort
T(n) = 2T(n/2) + O(1)    → O(n)
```

### Key Points

- Draw the call tree if you're unsure
- Space = maximum call stack depth (the deepest path)
- Memoization converts `O(2ⁿ)` fib to `O(n)` by eliminating repeated branches

### Common Mistakes

- Saying O(n) space for a function with O(log n) recursion depth — trace the deepest path, not all calls
- Forgetting that stack frames count as space even when you don't create new variables

---

## Rule 8: Built-in Methods

### Explanation

Every built-in method runs code internally. If you use a built-in inside your code, its complexity adds to yours. Many beginners treat built-ins as "free" — they are not.

### Examples

```js
// ─── map → O(n) ───
const doubled = arr.map(x => x * 2);
// Creates new array, visits every element → O(n)


// ─── filter → O(n) ───
const evens = arr.filter(x => x % 2 === 0);
// Visits every element → O(n)


// ─── sort → O(n log n) ───
const sorted = arr.sort((a, b) => a - b);
// Timsort → O(n log n)


// ─── Using sort inside a loop → O(n² log n) ───
for (let i = 0; i < arr.length; i++) {
  subarrays[i].sort(); // O(n log n) * O(n outer) = O(n² log n)
}


// ─── indexOf inside a loop → O(n²) ───
for (const x of arr) {
  if (arr.indexOf(x) !== -1) {  // O(n) inside O(n) loop
    // ...
  }
}
// O(n) * O(n) = O(n²)
// Fix: convert arr to a Set first, then use Set.has() which is O(1)


// ─── String includes inside a loop → O(n * m) ───
for (const word of words) {        // O(n)
  if (word.includes(pattern)) {    // O(word.length) = O(m)
    // ...
  }
}
// O(n * m)
```

### Key Points

- `map`, `filter`, `forEach`, `reduce` = O(n)
- `sort` = O(n log n)
- `indexOf`, `includes` on arrays = O(n) — use Set for O(1) lookup
- Always ask: "what does this built-in do internally?"

### Common Mistakes

- Treating `arr.sort()` as O(1) or O(n)
- Using `arr.includes()` inside a loop without realizing it makes the whole thing O(n²)

---

# PART 3 — How to Calculate Space Complexity

---

## Space Rule 1: Variables → O(1)

### Explanation

Primitive variables (numbers, booleans, strings of fixed length) take a constant amount of memory. No matter what `n` is, a single variable like `let count = 0` uses the same amount of memory.

A fixed number of variables = O(1) space.

### Examples

```js
function maxProfit(prices) {
  let minPrice = Infinity;   // 1 variable
  let maxProfit = 0;         // 1 variable

  for (let i = 0; i < prices.length; i++) {   // 1 variable (i)
    minPrice = Math.min(minPrice, prices[i]);
    maxProfit = Math.max(maxProfit, prices[i] - minPrice);
  }

  return maxProfit;
}
// Space: O(1) — only fixed variables, no data structures created
// (prices array is input space, not counted)
```

### Key Points

- Variables, pointers, and loop counters = O(1)
- No matter how many fixed variables you have, it's still O(1) — constants are dropped
- O(1) space = "in-place" solution (in terms of auxiliary space)

---

## Space Rule 2: Arrays → O(n)

### Explanation

When you create an array that grows with input size, that's O(n) space. The array could hold up to n elements, so it scales with n.

### Examples

```js
// Creates a result array of up to n elements → O(n)
function filterEvens(arr) {
  const result = []; // could hold all n elements
  for (const x of arr) {
    if (x % 2 === 0) result.push(x);
  }
  return result;
}

// Creates n sub-arrays → O(n) total (if each sub-array is bounded)
function chunk(arr, size) {
  const result = [];
  for (let i = 0; i < arr.length; i += size) {
    result.push(arr.slice(i, i + size));
  }
  return result;
  // Total elements across all chunks = n → O(n)
}

// ─── Sorting in place: O(1) extra space ───
function sortInPlace(arr) {
  arr.sort(); // modifies arr, no new array created → O(1) auxiliary space
  return arr;
}
```

### Key Points

- Creating a new array of n elements = O(n) space
- "In-place" sort (like `arr.sort()`) uses O(1) extra space because it modifies the input
- Output arrays required by the problem usually don't count against your space complexity in interviews (ask the interviewer)

---

## Space Rule 3: Objects / Maps → O(n)

### Explanation

A hash map or object where keys are derived from input can grow up to n entries — one per unique input element. This is O(n) space.

### Examples

```js
// Frequency map — at most n unique keys → O(n)
function buildFreqMap(arr) {
  const freq = {};
  for (const x of arr) {
    freq[x] = (freq[x] || 0) + 1; // up to n unique keys
  }
  return freq;
}

// Memoization table — stores up to n unique results → O(n)
function fib(n, memo = new Map()) {
  if (n <= 1) return n;
  if (memo.has(n)) return memo.get(n);
  const result = fib(n - 1, memo) + fib(n - 2, memo);
  memo.set(n, result);
  return result;
}
// memo stores values for 0, 1, 2, ..., n → O(n) space

// Set for deduplication → O(n) in worst case
function uniqueValues(arr) {
  return [...new Set(arr)]; // Set grows up to n elements
}
```

### Key Points

- HashMap, object, or Set that stores input-derived values = O(n)
- The constant factor (how many bytes per entry) is irrelevant for Big-O
- Nested maps (e.g., adjacency lists for graphs) can be O(n + e) where e = number of edges

---

## Space Rule 4: Recursion Stack

### Explanation

Every recursive function call creates a new **stack frame** — a block of memory holding the function's local variables, parameters, and return address.

If your recursion goes d levels deep, you have d stack frames in memory simultaneously. This means recursion depth = O(d) space.

The key question is: **what is the maximum call stack depth at any point?**

### Examples

```js
// ─── Linear depth → O(n) space ───
function factorial(n) {
  if (n === 0) return 1;
  return n * factorial(n - 1);
}
// Call stack at deepest point:
// factorial(5) → factorial(4) → factorial(3) → factorial(2) → factorial(1) → factorial(0)
// 6 frames for n=5 → O(n) space


// ─── Logarithmic depth → O(log n) space ───
function binarySearch(arr, t, l, r) {
  if (l > r) return -1;
  const m = Math.floor((l + r) / 2);
  if (arr[m] === t) return m;
  if (arr[m] < t) return binarySearch(arr, t, m + 1, r); // one call, not both
  return binarySearch(arr, t, l, m - 1);
}
// Only one branch per level, problem halves → depth = log n → O(log n) space


// ─── Tree DFS → O(h) space where h = tree height ───
function maxDepth(node) {
  if (!node) return 0;
  return 1 + Math.max(maxDepth(node.left), maxDepth(node.right));
}
// Max stack depth = height of tree
// Balanced tree: h = log n → O(log n) space
// Skewed tree (like linked list): h = n → O(n) space


// ─── Both branches → O(n) space (not O(2ⁿ)!) ───
function fib(n) {
  if (n <= 1) return n;
  return fib(n - 1) + fib(n - 2);
}
// Space is the MAXIMUM DEPTH of the call stack, not total calls
// The deepest path is fib(n) → fib(n-1) → ... → fib(0): depth n
// Space: O(n) — even though there are O(2ⁿ) total calls
```

### Key Points

- Space = maximum concurrent stack depth (deepest path in call tree)
- Not total number of recursive calls (that's time)
- Tail recursion (where the recursive call is the last thing) can be optimized to O(1) space in some languages — not guaranteed in JavaScript

### Common Mistakes

- Saying `fib` has O(2ⁿ) space because it makes 2ⁿ calls — space is the maximum stack depth, which is O(n)
- Forgetting to account for recursion space entirely and saying O(1) for a recursive function

---

## Space Rule 5: Auxiliary Space vs Input Space

### Explanation

**Total space** = input space + auxiliary space
**Auxiliary space** = extra space beyond the input

In interviews, when asked for space complexity, most interviewers mean **auxiliary space** (the space your algorithm adds beyond storing the input). The input was already there before your function ran.

However, some problems and interviewers explicitly ask for total space — always clarify if unsure.

### Examples

```js
// ─── In-place sort: O(1) auxiliary, O(n) total ───
function sortArray(arr) {
  arr.sort(); // no new structures, modifies in place
  return arr;
}
// Auxiliary space: O(1) (just a few internal sort variables)
// Total space: O(n) (the input array)


// ─── Building a copy: O(n) auxiliary, O(2n) = O(n) total ───
function sortCopy(arr) {
  return [...arr].sort(); // creates a copy then sorts it
}
// Auxiliary space: O(n) (the copy)
// Total space: O(n) (input) + O(n) (copy) = O(n)


// ─── Recursion on input: O(n) auxiliary ───
function reverseArr(arr, i = 0, j = arr.length - 1) {
  if (i >= j) return;
  [arr[i], arr[j]] = [arr[j], arr[i]];
  reverseArr(arr, i + 1, j - 1); // stack depth n/2 → O(n) auxiliary
}
// Auxiliary: O(n) because of recursion stack, even though it modifies in-place
```

### Key Points

- Interview default: auxiliary space is what matters
- "In-place" means O(1) auxiliary space — the input doesn't count
- Recursion always uses auxiliary space (the call stack), even if no data structures are created

### Common Mistakes

- Saying "O(1) space" for a recursive algorithm — recursion always adds at least O(depth) auxiliary space

---

# PART 4 — How to Identify the Best Solution

> This section teaches the **thinking process** — how to go from "I see the problem" to "I found the optimal solution." This is what separates great engineers from average ones.

---

## Step 1: Start with Brute Force

### Explanation

Always start with the simplest, most obvious solution — even if you know it's slow. The brute force solution:

1. Verifies your understanding of the problem
2. Gives you a working baseline
3. Shows you exactly *where* the work is being done (which helps find optimizations)

Never jump to an optimized solution without first understanding the brute force.

### Example

```
Problem: Given an array of integers, find if any two numbers sum to a target.

Brute Force Thinking:
"Check every possible pair."
```

```js
// Brute force: O(n²) time, O(1) space
function twoSum_brute(nums, target) {
  for (let i = 0; i < nums.length; i++) {
    for (let j = i + 1; j < nums.length; j++) {
      if (nums[i] + nums[j] === target) return [i, j];
    }
  }
  return [];
}
```

Now you have a working solution. From here, look for optimization opportunities.

### Key Points

- Brute force first — always
- Communicate the brute force in interviews before jumping to the optimal
- The brute force shows you the structure of the problem clearly

---

## Step 2: Identify Bottlenecks

### Explanation

After brute force, ask: **"Where is the most work being done?"**

Look for:
- Nested loops (repeated work)
- Repeated lookups (searching the same data multiple times)
- Redundant computation (recalculating the same value)

### Example

```js
// In twoSum_brute:
for (let i = 0; i < nums.length; i++) {
  for (let j = i + 1; j < nums.length; j++) { // ← BOTTLENECK: searching for complement
    if (nums[i] + nums[j] === target) return [i, j];
  }
}
```

The inner loop is repeatedly searching for `target - nums[i]`. This search takes O(n) each time. That's the bottleneck.

**Ask yourself:** "Can I find the complement faster than O(n)?"

Yes — use a hash map for O(1) lookup.

---

## Step 3: Reduce Nested Loops

### Explanation

Nested loops are the most common source of poor complexity. The goal is to convert O(n²) work into O(n) work by:

- Precomputing something before the loop
- Using a data structure that answers queries in O(1)
- Moving from "check all pairs" to "for each element, look up its complement"

### Example

```js
// O(n²) → O(n) by using a hashmap to eliminate the inner loop
function twoSum_optimal(nums, target) {
  const seen = new Map(); // {value → index}
  for (let i = 0; i < nums.length; i++) {
    const complement = target - nums[i];
    if (seen.has(complement)) return [seen.get(complement), i]; // O(1) lookup
    seen.set(nums[i], i);
  }
  return [];
}
// O(n) time, O(n) space
```

The inner loop is gone. Each element is processed once, with O(1) lookup.

### Key Points

- The pattern "eliminate inner loop with hashmap" appears in dozens of interview problems
- Always ask: "What information do I need from previous elements?" — that's what goes in the map
- Trade O(n²) time for O(n) space — almost always worth it

---

## Step 4: Use Patterns

### Explanation

Most optimal solutions use a known algorithmic pattern. Learning patterns is more valuable than memorizing solutions — patterns apply to hundreds of problems.

---

### HashMap Pattern

**When to use:** You need fast lookup, counting, grouping, or tracking "have I seen this before?"

```js
// "Two Sum" — find pair summing to target
const seen = new Map();
for (let i = 0; i < nums.length; i++) {
  const comp = target - nums[i];
  if (seen.has(comp)) return [seen.get(comp), i];
  seen.set(nums[i], i);
}
// Eliminates O(n) inner search → O(1) lookup

// "Group Anagrams" — group words that are anagrams
const groups = new Map();
for (const word of words) {
  const key = word.split('').sort().join('');
  if (!groups.has(key)) groups.set(key, []);
  groups.get(key).push(word);
}
```

---

### Two Pointers Pattern

**When to use:** Sorted array, finding pairs, removing duplicates, comparing from both ends.

```js
// "Container With Most Water" — maximize area between two lines
function maxArea(heights) {
  let left = 0, right = heights.length - 1, max = 0;
  while (left < right) {
    const area = Math.min(heights[left], heights[right]) * (right - left);
    max = Math.max(max, area);
    if (heights[left] < heights[right]) left++;
    else right--;
  }
  return max;
}
// O(n) — single pass with two pointers
```

---

### Sliding Window Pattern

**When to use:** Subarray or substring problems with a constraint on the window size.

```js
// "Longest substring with k unique chars"
function longestSubstring(s, k) {
  const freq = new Map();
  let left = 0, maxLen = 0;

  for (let right = 0; right < s.length; right++) {
    freq.set(s[right], (freq.get(s[right]) || 0) + 1);

    while (freq.size > k) { // shrink window
      freq.set(s[left], freq.get(s[left]) - 1);
      if (freq.get(s[left]) === 0) freq.delete(s[left]);
      left++;
    }

    maxLen = Math.max(maxLen, right - left + 1);
  }

  return maxLen;
}
// O(n) — each element enters and exits the window once
```

---

### Key Points

- Learn the pattern, not just the solution — one pattern unlocks 10+ problems
- Recognize the pattern by the shape of the problem, not exact wording
- Common patterns: hashmap, two pointers, sliding window, binary search, BFS/DFS, DP, monotonic stack

---

## Step 5: Compare Complexities

### Explanation

After finding an optimized solution, evaluate whether it's actually better — and by how much.

Always compare:
1. Time complexity
2. Space complexity
3. Practical performance (constants matter at small n)

### Example

```
Problem: Find duplicate in array

Brute force:        O(n²) time, O(1) space
Sorted approach:    O(n log n) time, O(1) space
HashSet approach:   O(n) time, O(n) space
Math formula:       O(n) time, O(1) space  ← best of both worlds
```

```js
// HashSet: O(n) time, O(n) space
function hasDuplicate_set(arr) {
  const seen = new Set();
  for (const x of arr) {
    if (seen.has(x)) return true;
    seen.add(x);
  }
  return false;
}

// Math trick (if values are 1 to n): O(n) time, O(1) space
function findDuplicate_math(arr) {
  const expected = (arr.length * (arr.length - 1)) / 2;
  const actual = arr.reduce((a, b) => a + b, 0);
  return actual - expected;
}
```

### Key Points

- Always state both time and space complexity for your solution
- Sometimes O(n) time with O(1) space is achievable — look for mathematical insight
- In interviews, the O(n) time / O(n) space hashmap solution is usually the target

---

## Step 6: Know When a Solution is Optimal

### Explanation

How do you know you can't do better? There are several signals:

1. **Matches a known lower bound** — comparison-based sorting cannot be better than O(n log n)
2. **Must visit all elements at least once** — reading all input is O(n) minimum
3. **No repeated work** — each element processed exactly once
4. **Matches a known optimal algorithm** — if your solution is O(n log n) for sorting, you're there

### Examples

```
"Find if array has a duplicate"
→ You must read all elements → O(n) time minimum
→ HashSet approach is O(n) time → optimal

"Sort an array (comparison-based)"
→ Proven lower bound: O(n log n)
→ Merge sort/heap sort achieves O(n log n) → optimal

"Find an element in sorted array"
→ Binary search is O(log n)
→ Proven lower bound for comparison-based search: O(log n) → optimal
```

### Key Points

- O(n) is usually optimal when you need to examine all input at least once
- O(log n) is usually optimal for search in sorted data
- If you're using all input once, with O(1) per element, you're likely optimal

---

# PART 5 — Complexity in DSA Patterns

---

## Arrays

### Operations

| Operation | Complexity |
|-----------|-----------|
| Access by index | O(1) |
| Search (unsorted) | O(n) |
| Search (sorted, binary) | O(log n) |
| Insert at end | O(1) amortized |
| Insert at beginning | O(n) |
| Delete at end | O(1) |
| Delete at beginning | O(n) |
| Traverse | O(n) |

### Common Patterns and Their Complexities

```js
// Two-pass approach — O(n)
function maxProfit(prices) {
  let min = prices[0], profit = 0;
  for (const p of prices) {        // single pass
    min = Math.min(min, p);
    profit = Math.max(profit, p - min);
  }
  return profit;
}

// Prefix sum — O(n) preprocessing, O(1) range queries
function buildPrefixSum(arr) {
  const prefix = [0];
  for (const x of arr) prefix.push(prefix[prefix.length - 1] + x);
  return prefix;
}
function rangeSum(prefix, l, r) {
  return prefix[r + 1] - prefix[l]; // O(1)
}
```

---

## HashMap

### Operations

| Operation | Average | Worst |
|-----------|---------|-------|
| Insert | O(1) | O(n) |
| Delete | O(1) | O(n) |
| Lookup | O(1) | O(n) |
| Iteration | O(n) | O(n) |

> Worst case O(n) happens due to hash collisions. In practice (with good hash functions), O(1) is reliable.

### When to Use

- Count frequencies
- Group by a key
- O(1) existence check (replace O(n) linear search)
- Cache intermediate results

```js
// Frequency counting — O(n) time, O(k) space where k = unique values
function topKFrequent(nums, k) {
  const freq = new Map();
  for (const n of nums) freq.set(n, (freq.get(n) || 0) + 1);

  return [...freq.entries()]
    .sort((a, b) => b[1] - a[1])    // O(k log k)
    .slice(0, k)
    .map(([num]) => num);
}
```

---

## Two Pointers

### Pattern Complexity

- **Time:** O(n) — each pointer moves at most n steps total
- **Space:** O(1) — just two index variables

### When to Use

- Sorted array, find pair with target sum
- Remove duplicates in place
- Reverse a string/array
- Check palindrome
- Container with most water

```js
// Remove duplicates from sorted array — O(n) time, O(1) space
function removeDuplicates(nums) {
  let slow = 0;
  for (let fast = 1; fast < nums.length; fast++) {
    if (nums[fast] !== nums[slow]) {
      slow++;
      nums[slow] = nums[fast];
    }
  }
  return slow + 1;
}

// Three sum — O(n²) time (sort + two pointers per element), O(1) space
function threeSum(nums) {
  nums.sort((a, b) => a - b);         // O(n log n)
  const result = [];
  for (let i = 0; i < nums.length - 2; i++) {  // O(n)
    let left = i + 1, right = nums.length - 1;
    while (left < right) {                       // O(n) inner
      const sum = nums[i] + nums[left] + nums[right];
      if (sum === 0) result.push([nums[i], nums[left++], nums[right--]]);
      else if (sum < 0) left++;
      else right--;
    }
  }
  return result;
}
// Overall: O(n²)
```

---

## Sliding Window

### Pattern Complexity

- **Time:** O(n) — each element enters and exits the window at most once
- **Space:** O(k) — window of size k, or O(1) for fixed-size windows

### When to Use

- Longest/shortest subarray or substring satisfying a condition
- Maximum/minimum sum of subarray of size k
- Anagram search in string

```js
// Maximum sum subarray of size k — O(n) time, O(1) space
function maxSumSubarray(arr, k) {
  let windowSum = arr.slice(0, k).reduce((a, b) => a + b, 0);
  let maxSum = windowSum;

  for (let i = k; i < arr.length; i++) {
    windowSum += arr[i] - arr[i - k]; // slide: add new, remove old
    maxSum = Math.max(maxSum, windowSum);
  }
  return maxSum;
}

// Longest substring without repeating characters — O(n) time, O(min(n,k)) space
function lengthOfLongestSubstring(s) {
  const seen = new Map();
  let left = 0, maxLen = 0;

  for (let right = 0; right < s.length; right++) {
    if (seen.has(s[right]) && seen.get(s[right]) >= left) {
      left = seen.get(s[right]) + 1; // shrink from left
    }
    seen.set(s[right], right);
    maxLen = Math.max(maxLen, right - left + 1);
  }
  return maxLen;
}
```

---

## Recursion

### Complexity Summary

| Pattern | Time | Space |
|---------|------|-------|
| Linear recursion | O(n) | O(n) |
| Binary recursion (2 branches) | O(2ⁿ) | O(n) |
| Halving recursion | O(log n) | O(log n) |
| Merge sort style | O(n log n) | O(n) |
| Memoized recursion | O(unique states) | O(unique states) |

### Key Insight

```js
// Without memo: O(2ⁿ) — recomputes same subproblems
function fib(n) {
  if (n <= 1) return n;
  return fib(n - 1) + fib(n - 2);
}

// With memo: O(n) — each subproblem computed once
function fibMemo(n, memo = new Map()) {
  if (n <= 1) return n;
  if (memo.has(n)) return memo.get(n);
  const result = fibMemo(n - 1, memo) + fibMemo(n - 2, memo);
  memo.set(n, result);
  return result;
}
```

---

## Trees

### Traversal Complexity

| Operation | Time | Space |
|-----------|------|-------|
| DFS (all traversals) | O(n) | O(h) |
| BFS | O(n) | O(w) |
| BST search (balanced) | O(log n) | O(log n) |
| BST search (skewed) | O(n) | O(n) |
| Insert BST (balanced) | O(log n) | O(log n) |
| Insert BST (skewed) | O(n) | O(n) |

> h = height of tree, w = maximum width (for BFS queue space)
> Balanced tree: h = log n. Skewed tree (degenerate): h = n.

```js
// DFS — O(n) time, O(h) space
function inorder(root, result = []) {
  if (!root) return result;
  inorder(root.left, result);    // visit left
  result.push(root.val);         // process node
  inorder(root.right, result);   // visit right
  return result;
}

// BFS — O(n) time, O(w) space (w = max nodes at any level)
function levelOrder(root) {
  if (!root) return [];
  const result = [], queue = [root];
  while (queue.length) {
    const level = [];
    const size = queue.length;
    for (let i = 0; i < size; i++) {
      const node = queue.shift();
      level.push(node.val);
      if (node.left) queue.push(node.left);
      if (node.right) queue.push(node.right);
    }
    result.push(level);
  }
  return result;
}
// Note: queue.shift() is O(n) — use a proper deque for true O(n) BFS
// Or use index tracking: let front = 0; queue[front++] instead of shift
```

---

## Graphs

### Traversal Complexity

| Operation | Time | Space |
|-----------|------|-------|
| DFS | O(V + E) | O(V) |
| BFS | O(V + E) | O(V) |
| Dijkstra (with min-heap) | O((V + E) log V) | O(V) |
| Topological Sort | O(V + E) | O(V) |

> V = vertices (nodes), E = edges

```js
// DFS on adjacency list — O(V + E) time, O(V) space
function dfs(graph, start) {
  const visited = new Set();
  const result = [];

  function explore(node) {
    if (visited.has(node)) return;
    visited.add(node);
    result.push(node);
    for (const neighbor of graph[node]) {
      explore(neighbor);
    }
  }

  explore(start);
  return result;
}

// BFS — O(V + E) time, O(V) space
function bfs(graph, start) {
  const visited = new Set([start]);
  const queue = [start];
  const result = [];

  while (queue.length) {
    const node = queue.shift();   // use index trick for O(1) dequeue
    result.push(node);
    for (const neighbor of graph[node]) {
      if (!visited.has(neighbor)) {
        visited.add(neighbor);
        queue.push(neighbor);
      }
    }
  }
  return result;
}
```

### Why O(V + E)?

- You visit every vertex once: O(V)
- For each vertex, you check its edges once: O(E) total across all vertices
- Combined: O(V + E)

In a dense graph (every node connected to every other): E ≈ V², so O(V + E) = O(V²)
In a sparse graph: E ≈ V, so O(V + E) = O(V)

---

# Final Summary

## The Five Questions to Ask for Any Algorithm

```
1. What is n?           (Define your input variable)
2. How many loops?      (Count iterations)
3. Are loops nested?    (Multiply) or sequential? (Add)
4. Any recursion?       (Depth × work per level)
5. Any built-ins?       (Add their complexity)
```

## The Three-Step Optimization Process

```
Step 1: Write brute force — understand the problem
Step 2: Find the bottleneck — where is repeated work?
Step 3: Eliminate it — use hashmap, two pointers, sliding window, DP
```

## The Complexity Hierarchy (Best to Worst)

```
O(1) → O(log n) → O(n) → O(n log n) → O(n²) → O(2ⁿ) → O(n!)
```

## When You're Optimal

```
Must read all input?   →  O(n) is your floor
Searching sorted data? →  O(log n) is your floor
Sorting?               →  O(n log n) is your floor
```

---

> This guide was written as a complete reference for developers studying algorithms, preparing for technical interviews, and building a deep intuition for performance-aware software engineering.
