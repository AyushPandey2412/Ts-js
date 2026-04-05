// array-sort.js

// 1. Sorting numbers
const nums = [10, 5, 40, 2];

// Default sort (as strings - wrong for numbers)
const wrong = [...nums].sort();
console.log("Wrong sort:", wrong);

// Correct numeric sort
const asc = [...nums].sort((a, b) => a - b);
const desc = [...nums].sort((a, b) => b - a);

console.log("Ascending:", asc);
console.log("Descending:", desc);

// --------------------------------------
// 2. Sorting strings

const fruits = ["banana", "apple", "mango"];

const sortedFruits = [...fruits].sort();
console.log("Sorted fruits:", sortedFruits);

// localeCompare for custom string logic
const caseInsensitive = [...fruits].sort((a, b) =>
  a.localeCompare(b, undefined, { sensitivity: "base" })
);
console.log("Case-insensitive:", caseInsensitive);

// --------------------------------------
// 3. Sorting objects

const users = [
  { id: 3, name: "C" },
  { id: 1, name: "A" },
  { id: 2, name: "B" }
];

// Sort by id
const byId = [...users].sort((a, b) => a.id - b.id);
console.log("By id:", byId);

// Sort by name
const byName = [...users].sort((a, b) =>
  a.name.localeCompare(b.name)
);
console.log("By name:", byName);

// Sort by multiple fields (real-dev pattern)
const byActiveThenName = [...users].sort((a, b) => {
  if (a.active !== b.active) return a.active ? -1 : 1;
  return a.name.localeCompare(b.name);
});
console.log("By active then name:", byActiveThenName);

// ==============================
// DEV GUIDE – WHEN TO SORT
// ==============================
//
// Use sorting when:
// - Displaying lists in UI
// - Returning ordered API responses
// - Ranking / leaderboards
// - Reports and dashboards
//
// Always assume:
// - sort() MUTATES
// - Never sort state or shared data directly
//
// Safe pattern:
//   const ordered = [...arr].sort(...)
//
// ------------------------------
// COMPARATOR MENTAL MODEL
// ------------------------------
//
// (a, b) => result
//
// result < 0  -> a comes before b
// result > 0  -> b comes before a
// result = 0  -> keep order
//
// Examples:
//
// Numbers asc: (a, b) => a - b
// Numbers desc:(a, b) => b - a
// Strings:     (a, b) => a.localeCompare(b)
// Objects:     (a, b) => a.id - b.id
//
// ------------------------------
// WHAT NOT TO DO
// ------------------------------
//
// arr.sort() on:
// - React state
// - Redux store
// - Shared backend arrays
//
// This causes:
// - Hidden bugs
// - Unexpected UI changes
// - Data corruption
//
// Always copy first.
