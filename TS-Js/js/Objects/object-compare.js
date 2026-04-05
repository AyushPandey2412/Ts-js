// object-compare.js

const a = { name: "A", age: 20 };
const b = { name: "A", age: 20 };
const c = a;

console.log("a === b:", a === b); // false (different memory)
console.log("a === c:", a === c); // true (same reference)

// Why?
// Objects are compared by reference, not by value.
// Even if two objects look identical, they live in different memory slots.

// --------------------------------------
// Simple value comparison for plain objects
function isEqual(o1, o2) {
  return JSON.stringify(o1) === JSON.stringify(o2);
}

console.log("Value equal (a, b):", isEqual(a, b));

// Limits of JSON.stringify approach:
// - Order of keys must be same
// - Fails for functions, Dates, Maps, Sets
// - Not suitable for complex or nested structures
// Use only for quick checks on simple objects.

// --------------------------------------
// Real-dev approach: compare identity or fields

const user1 = { id: 1, name: "Hemla" };
const user2 = { id: 1, name: "Hemla" };
const user3 = { id: 2, name: "Other" };

console.log("Same user:", user1.id === user2.id); // true
console.log("Different user:", user1.id === user3.id); // false

// ==============================
// DEV GUIDE – HOW COMPARISON WORKS
// ==============================
//
// Never ask:
//   "Are these two objects equal?"
//
// Ask instead:
//   "Do these two objects represent the same thing?"
//
// In real apps, that usually means:
//
//   user.id === otherUser.id
//   order.number === incoming.number
//   product.sku === skuFromURL
//
// Because:
// - Objects are recreated from DB / API / state
// - Memory references are almost never the same
// - === will fail even if data is identical
//
// ------------------------------
// WHEN TO COMPARE WHOLE OBJECTS
// ------------------------------
//
// Rare cases only:
// - Tests
// - Debug tools
// - Snapshot diffing
// - Config comparison
//
// In business logic:
// - Compare ids
// - Compare specific fields
// - Never rely on a === b for objects
//
// ------------------------------
// MENTAL MODEL
// ------------------------------
//
// Primitives:
//   5 === 5        -> true
//   "a" === "a"    -> true
//
// Objects:
//   {} === {}      -> false
//   obj === objRef -> true
//
// Objects are identities, not values.
// Compare what they *represent*, not where they live.
