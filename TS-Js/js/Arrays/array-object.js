// array-object.js

const users = [
  { id: 1, name: "A", active: true },
  { id: 2, name: "B", active: false },
  { id: 3, name: "C", active: true }
];

// 1. Find by id (READ)
const found = users.find(u => u.id === 2);
console.log("Found:", found);

// 2. Filter by field (READ MANY)
const activeUsers = users.filter(u => u.active);
console.log("Active users:", activeUsers);

// 3. Delete by id (DELETE - immutable)
function deleteById(list, id) {
  return list.filter(item => item.id !== id);
}

const afterDelete = deleteById(users, 2);
console.log("After delete:", afterDelete);

// 4. Update by id (UPDATE - immutable)
function updateById(list, id, changes) {
  return list.map(item =>
    item.id === id ? { ...item, ...changes } : item
  );
}

const afterUpdate = updateById(users, 1, { name: "AA", active: false });
console.log("After update:", afterUpdate);

// 5. Add new object (CREATE - immutable)
function addUser(list, user) {
  return [...list, user];
}

const afterAdd = addUser(users, { id: 4, name: "D", active: true });
console.log("After add:", afterAdd);

// ==============================
// DEV GUIDE – REAL WORLD THINKING
// ==============================
//
// CRUD with arrays of objects:
//
// CREATE  -> [...list, newItem]
// READ 1  -> list.find(x => x.id === id)
// READ N  -> list.filter(condition)
// UPDATE  -> list.map(x => x.id === id ? { ...x, ...changes } : x)
// DELETE  -> list.filter(x => x.id !== id)
//
// These 5 patterns cover 90% of backend & frontend logic.
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
// - State corruption
// - Hard-to-track issues in React / APIs
//
// ------------------------------
// MENTAL MODEL
// ------------------------------
//
// Array of objects = mini database in memory
//
// You NEVER change rows directly.
// You ALWAYS return a new table:
//
// map    -> update rows
// filter -> delete rows
// find   -> select one row
// spread -> insert new row
//
// Think like SQL, but in JS.
