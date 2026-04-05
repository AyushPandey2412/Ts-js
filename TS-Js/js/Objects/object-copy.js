// object-copy.js

const user = {
  name: "hemla",
  age: 23,
  permissions: {
    read: true,
    write: false
  }
};

// 1. Reference copy (both point to same object)
const ref = user;
ref.age = 22;

console.log("After reference change:");
console.log("user:", user);
console.log("ref :", ref);

// 2. Shallow copy using spread (outer object only)
const copy = { ...user };
copy.age = 30;

console.log("\nAfter shallow copy change:");
console.log("user:", user); // unchanged at top level
console.log("copy:", copy);

// Nested object is still shared
copy.permissions.read = false;

console.log("\nAfter nested change in shallow copy:");
console.log("user.permissions:", user.permissions); // changed (bug)
console.log("copy.permissions:", copy.permissions);

// 3. Safe nested update using spread at each level
const safeUpdate = {
  ...user,
  permissions: {
    ...user.permissions,
    write: true
  }
};

console.log("\nAfter safe nested update:");
console.log("user.permissions:", user.permissions);
console.log("safeUpdate.permissions:", safeUpdate.permissions);

// 4. Deep copy using structuredClone (copies everything)
const deep = structuredClone(user);
deep.permissions.read = true;

console.log("\nAfter structuredClone change:");
console.log("user.permissions:", user.permissions); // unchanged
console.log("deep.permissions:", deep.permissions);

// ==============================
// DEV GUIDE – COPYING OBJECTS
// ==============================
//
// Direct assignment:
//   const a = b
// -> shares memory (dangerous)
//
// Shallow copy:
//   const c = { ...b }
// -> new outer object, inner objects shared
//
// Nested update (real dev pattern):
//   const next = {
//     ...obj,
//     nested: {
//       ...obj.nested,
//       changed: true
//     }
//   }
//
// Deep copy:
//   structuredClone(obj)
//
// Use cases:
//
// - Spread            -> daily updates
// - Nested spread     -> nested updates
// - structuredClone   -> complex deep structures






// object-nested.js


console.log("Original:", user);

// Wrong way (mutates original nested object)
const shallow = { ...user };
shallow.permissions.read = false;

console.log("\nAfter shallow nested change:");
console.log("user:", user);       // changed (bug)
console.log("shallow:", shallow);

// Correct way (copy each level you change)
const updated = {
  ...user,
  permissions: {
    ...user.permissions,
    read: true
  }
};

console.log("\nAfter safe nested update:");
console.log("user:", user);       // unchanged
console.log("updated:", updated);

// ==============================
// DEV GUIDE – NESTED OBJECTS
// ==============================
//
// Spread only copies ONE level.
//
// If you change inside a nested object:
//
//   obj.nested.key = value   
//
// Correct pattern:
//
//   const next = {
//     ...obj,
//     nested: {
//       ...obj.nested,
//       key: value
//     }
//   }
//
// Rule:
// If you touch a level,
// you must spread that level.
