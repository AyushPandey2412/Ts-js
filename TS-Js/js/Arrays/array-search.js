// array-search.js

const fruits = ["apple", "banana", "mango", "orange"];

// 1. includes (true / false)
console.log("Has apple:", fruits.includes("apple"));
console.log("Has kiwi:", fruits.includes("kiwi"));

// Use when:
// - You only care about existence
// - You don’t need position
// - Works for primitive values (string, number, boolean)

// 2. indexOf (position or -1)
console.log("Index of mango:", fruits.indexOf("mango"));
console.log("Index of kiwi:", fruits.indexOf("kiwi")); // -1

// Use when:
// - You need the index
// - You will remove/update by index later
// - Works for primitive values

// ----------------------------------
// For arrays of objects

const users = [
  { id: 1, name: "A" },
  { id: 2, name: "B" }
];

// 3. find (get object)
const found = users.find(u => u.id === 2);
console.log("Found user:", found);

// Use when:
// - You want the actual object
// - You are searching by condition (id, name, etc.)

// 4. findIndex (get position)
const idx = users.findIndex(u => u.id === 2);
console.log("Index of user with id 2:", idx);

// Use when:
// - You need the index to update/remove
// - You work with position-based logic

// ==============================
// DEV GUIDE – WHEN TO USE WHAT
// ==============================
//
// Searching in arrays:
//
// Value exists?
//   -> arr.includes(value)
//
// Need index of primitive?
//   -> arr.indexOf(value)
//
// Need object by condition?
//   -> arr.find(obj => condition)
//
// Need index by condition?
//   -> arr.findIndex(obj => condition)
//
// ------------------------------
// REAL WORLD EXAMPLES
// ------------------------------
//
// Check permission:
//   roles.includes("admin")
//
// Find user by id:
//   users.find(u => u.id === id)
//
// Remove item by index (rare):
//   const i = arr.indexOf("x")
//   if (i !== -1) arr.splice(i, 1)
//
// Update object immutably (common):
//   users.map(u => u.id === id ? { ...u, name: "A" } : u)
//
// ------------------------------
// MENTAL MODEL
// ------------------------------
//
// includes  -> “Is it there?”
// indexOf  -> “Where is it?”
// find     -> “Give me the thing.”
// findIndex-> “Where is the thing?”
