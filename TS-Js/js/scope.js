// scope-basics.js

// Scope = where a variable is visible and usable.
// Think of scope as: "Who is allowed to see this variable?"

// JavaScript has 3 main scopes:
// 1. Global Scope
// 2. Function Scope
// 3. Block Scope (let / const)

// ------------------------------
// 1. GLOBAL SCOPE
// ------------------------------

const appName = "MyApp";

function showApp() {
  console.log(appName); // accessible
}

showApp();

// Global variables are accessible everywhere.
// In production, avoid putting business data in global scope.
// It causes hidden dependencies and bugs.

// ------------------------------
// 2. FUNCTION SCOPE
// ------------------------------

function createUser(name) {
  const role = "user"; // function-scoped
  return { name, role };
}

const u = createUser("Ayush");
// console.log(role); // ❌ ReferenceError

// Variables declared inside a function
// live ONLY inside that function.

// ------------------------------
// 3. BLOCK SCOPE (let / const)
// ------------------------------

if (true) {
  const secret = "token";
  let count = 1;
}

// console.log(secret); // ❌ ReferenceError
// console.log(count);  // ❌ ReferenceError

// var does NOT respect block scope
if (true) {
  var legacy = "old";
}

console.log(legacy); // "old" (leaks outside block)

// This is why we avoid `var` in modern code.

// ------------------------------
// SHADOWING
// ------------------------------

const value = 10;

function demo() {
  const value = 20; // shadows outer value
  console.log(value); // 20
}

demo();
console.log(value); // 10

// Inner scope can have same name,
// but it does NOT change the outer one.

// ------------------------------
// REAL-APP FEEL
// ------------------------------

function handler(req, res) {
  const user = req.user;

  if (!user) {
    const error = "Unauthorized";
    return res.status(401).json({ error });
  }

  // error is NOT accessible here
  res.json({ ok: true });
}

// Each block and function protects its own data.

// ==============================
// DEV GUIDE – SCOPE
// ==============================
//
// Global scope:
// - Config constants
// - App-level utilities
// - Avoid storing dynamic state here
//
// Function scope:
// - Business logic variables
// - Temporary workers
//
// Block scope (let/const):
// - Conditions
// - Loops
// - Temporary guards
//
// Why it matters:
// - Prevents accidental overwrites
// - Makes logic predictable
// - Avoids hidden coupling
//
// Common mistakes:
// - Using var
// - Relying on outer variables
// - Modifying globals inside functions
//
// Mental model:
// - Each scope is a room
// - Variables live only in their room
// - Inner rooms can see outer rooms
// - Outer rooms cannot see inside rooms
//
// Write code so that:
// “Every variable lives as close as possible
// to where it is used.”
