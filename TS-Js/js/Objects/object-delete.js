// object-delete.js

const user = {
  name: "hemla",
  age: 23,
  email: "hemla23@gmail.com",
  role: "admin"
};

// --------------------------------------
// Direct delete (mutates original - avoid in real apps)
// delete user.role;

// Safe delete (immutable way)
const { role, ...safeUser } = user;

console.log("Original user:", user);
console.log("Without role (safe):", safeUser);

// --------------------------------------
// Keep the key, but clear the value

const cleared = { ...user, role: null };

console.log("Cleared role:", cleared);

// ==============================
// DEV GUIDE – REMOVING DATA
// ==============================
//
// There are two different intents:
//
// 1. "This field should NOT exist anymore"
//    -> remove the key
//
//    Safe pattern:
//      const { field, ...rest } = obj
//
//    Use when:
//    - Hiding sensitive data (password, tokens)
//    - Preparing API responses
//    - Cleaning payloads
//
// 2. "This field should exist but be empty"
//    -> keep the key, clear the value
//
//    Safe pattern:
//      const next = { ...obj, field: null }
//
//    Use when:
//    - Resetting form values
//    - Optional fields
//    - Maintaining object shape
//
// ------------------------------
// WHAT NOT TO DO IN REAL APPS
// ------------------------------
//
// Avoid:
//   delete obj.key
//
// Because:
// - It mutates shared objects
// - Can break references elsewhere
// - Causes hidden side effects
//
// ------------------------------
// MENTAL MODEL
// ------------------------------
//
// Remove key      -> destructuring
// Clear value     -> spread + null
//
// In backend & frontend:
// Always prefer immutable patterns.
