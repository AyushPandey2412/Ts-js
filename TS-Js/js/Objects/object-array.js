// object-array.js

const users = [
  { id: 1, name: "A", active: true },
  { id: 2, name: "B", active: false },
  { id: 3, name: "C", active: true }
];

// 1. Find one object by id (READ ONE)
const found = users.find(u => u.id === 2);
console.log("Found:", found);

// 2. Filter objects by condition (READ MANY)
const activeUsers = users.filter(u => u.active);
console.log("Active users:", activeUsers);

// 3. Delete one object (DELETE - immutable)
const idToDelete = 1;
const withoutOne = users.filter(u => u.id !== idToDelete);
console.log("After delete:", withoutOne);

// 4. Update one object (UPDATE - immutable)
const updated = users.map(u =>
  u.id === 3 ? { ...u, name: "CC" } : u
);
console.log("After update:", updated);

// 5. Generic helpers (real-dev style)

function deleteById(list, id) {
  return list.filter(item => item.id !== id);
}

function updateById(list, id, changes) {
  return list.map(item =>
    item.id === id ? { ...item, ...changes } : item
  );
}

const afterDelete = deleteById(users, 2);
console.log("Helper delete:", afterDelete);

const afterUpdate = updateById(users, 1, { active: false, name: "AA" });
console.log("Helper update:", afterUpdate);

// ==============================
// DEV GUIDE – REAL WORLD THINKING
// ==============================
//
// Treat an array of objects like a mini database in memory.
//
// CRUD with arrays:
//
// CREATE -> [...list, newItem]
// READ 1 -> list.find(x => x.id === id)
// READ N -> list.filter(condition)
// UPDATE -> list.map(x => x.id === id ? { ...x, ...changes } : x)
// DELETE -> list.filter(x => x.id !== id)
//
// These 5 patterns cover most backend & frontend logic.
//
// ------------------------------
// WHAT NOT TO DO IN REAL APPS
// ------------------------------
//
// Avoid mutating:
//   users.push(...)
//   users.splice(...)
//   users[index] = ...
//
// These cause:
// - Hidden bugs
// - State corruption (React / Redux)
// - Hard-to-track behavior in APIs
//
// ------------------------------
// MENTAL MODEL
// ------------------------------
//
// You never change rows directly.
// You always return a NEW table:
//
// map    -> update rows
// filter -> delete rows
// find   -> select one row
// spread -> insert new row
//
// Think like SQL, but in JavaScript.
