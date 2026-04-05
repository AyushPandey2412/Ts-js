// array-transform.js

const users = [
  { id: 1, name: "A", active: true },
  { id: 2, name: "B", active: false },
  { id: 3, name: "C", active: true }
];

// 1. Map: shape data
const names = users.map(u => u.name);
console.log("Names:", names);

// Use map when:
// - You want to change the shape
// - You want one output for each input

// 2. Filter: clean data
const activeUsers = users.filter(u => u.active);
console.log("Active users:", activeUsers);

// Use filter when:
// - You want to remove items
// - Output array can be smaller than input

// 3. Chain: filter -> map
const activeNames = users
  .filter(u => u.active)
  .map(u => u.name);

console.log("Active names:", activeNames);

// Rule:
// Always filter first, then map.
// Never map then filter unless required.

// 4. Transform raw data into API shape
const apiUsers = users.map(u => ({
  id: u.id,
  label: u.name
}));

console.log("API users:", apiUsers);

// ==============================
// DEV GUIDE – TRANSFORMATION
// ==============================
//
// In real development:
//
// Database shape  !=  API shape  !=  UI shape
//
// You almost never send raw objects.
// You always reshape them.
//
// Examples:
//
// Backend API:
//   users.map(u => ({ id: u._id, name: u.name }))
//
// Frontend list:
//   items.map(i => ({ label: i.title, value: i.id }))
//
// Dropdown options:
//   data.map(d => ({ text: d.name, value: d.code }))
//
// ------------------------------
// MENTAL MODEL
// ------------------------------
//
// map    -> "convert each item"
// filter -> "remove some items"
// chain  -> "clean, then convert"
//
// Think of arrays as pipelines:
//
// raw data
//    ↓ filter
// clean data
//    ↓ map
// shaped data
//
// This is how all real apps process collections.
