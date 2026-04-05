// // function-types.js

// // Three main ways to define functions

// // ------------------------------
// // 1. Function Declaration
// // ------------------------------

// function calculateTotal(items) {
//   return items.reduce((s, i) => s + i.price, 0);
// }

// // Hoisted, stable, best for core logic

// // ------------------------------
// // 2. Function Expression
// // ------------------------------

// const calculateTotalExpr = function (items) {
//   return items.reduce((s, i) => s + i.price, 0);
// };

// // Useful when assigning dynamically

// const handler = true
//   ? function adminHandler() {}
//   : function userHandler() {};

// // ------------------------------
// // 3. Arrow Function
// // ------------------------------

// const calculateTotalArrow = (items) => {
//   return items.reduce((s, i) => s + i.price, 0);
// };

// button.addEventListener("click", () => {
//   console.log("clicked");
// });

// // ==============================
// // DEV GUIDE – FUNCTION TYPES
// // ==============================
// //
// // Use function declarations for:
// // - Core utilities
// // - Business logic
// // - Shared helpers
// //
// // Use arrow functions for:
// // - Callbacks
// // - Event handlers
// // - React logic
// // - Short, local behavior
// //
// // Use expressions when:
// // - Functions are treated as values
// // - You assign them dynamically
// //
// // Mental model:
// // function = stable worker
// // =>        = inline behavior
// // expression = flexible assignment





// function-types.js

// Three main ways to define functions
// + One special pattern: IIFE (Immediately Invoked Function Expression)

// ------------------------------
// 1. Function Declaration
// ------------------------------

function calculateTotal(items) {
  return items.reduce((s, i) => s + i.price, 0);
}

// Characteristics:
// - Hoisted (can be used before definition)
// - Named clearly
// - Best for core logic and utilities


// ------------------------------
// 2. Function Expression
// ------------------------------

const calculateTotalExpr = function (items) {
  return items.reduce((s, i) => s + i.price, 0);
};

// Characteristics:
// - Not hoisted
// - Treated like a value
// - Useful when assigning dynamically

const handler = true
  ? function adminHandler() {}
  : function userHandler() {};


// ------------------------------
// 3. Arrow Function
// ------------------------------

const calculateTotalArrow = (items) => {
  return items.reduce((s, i) => s + i.price, 0);
};

button.addEventListener("click", () => {
  console.log("clicked");
});

// Characteristics:
// - No own `this`
// - Short and expressive
// - Dominates in callbacks & React


// ------------------------------
// 4. IIFE (Immediately Invoked Function Expression)
// ------------------------------

// An IIFE is a function that runs immediately
// at the moment it is defined.

// Classic form
(function () {
  console.log("IIFE executed immediately");
})();

// Arrow form
(() => {
  console.log("Arrow IIFE executed immediately");
})();

// IIFE WITH PARAMETERS
(function (name) {
  console.log("Hello", name);
})("Ayush");

((a, b) => {
  console.log("Sum:", a + b);
})(10, 20);

// With returned value (common real-world use)
const config = ((env) => {
  return env === "prod"
    ? { api: "https://prod.api.com" }
    : { api: "http://localhost:3000" };
})("dev");

console.log(config);

// Why IIFE exists:
// - Create a private scope
// - Run setup logic once
// - Avoid polluting global scope

// In modern apps (Node, React, TS):
// - Modules already give us scope
// - let/const give block safety
// - So IIFE is mainly used for:
//   - One-time setup
//   - Config building
//   - Legacy JS patterns


// ------------------------------
// IIFE SYNTAX RULES
// ------------------------------

// Parentheses are required because JS expects statements.
// `function () {}` alone is a declaration, not an expression.
// Wrapping in () turns it into a value (expression).

(function () {
  console.log("IIFE needs parentheses");
})();

// ------------------------------
// SEMICOLON BETWEEN IIFEs
// ------------------------------

// When placing two IIFEs back-to-back,
// ALWAYS separate them with a semicolon.

(function () {
  console.log("First IIFE");
})(); // important semicolon

(function () {
  console.log("Second IIFE");
})();

// Safe production pattern (defensive):
;(() => {
  console.log("Safe IIFE with leading semicolon");
})();

;(() => {
  console.log("Another safe IIFE");
})();


// ==============================
// DEV GUIDE – FUNCTION TYPES
// ==============================
//
// Use function declarations for:
// - Core utilities
// - Business logic
// - Shared helpers
//
// Use arrow functions for:
// - Callbacks
// - Event handlers
// - React logic
// - Short, local behavior
//
// Use function expressions when:
// - Functions are treated as values
// - You assign them dynamically
//
// Use IIFE when:
// - You need one-time execution
// - You want a private setup scope
// - You are writing bootstrapping logic
//
// Avoid IIFE for:
// - Reusable business logic
// - Anything that should be called again
//
// Mental model:
// function   = stable worker
// =>         = inline behavior
// expression = flexible assignment
// IIFE       = run-now, private setup block
//
// Parentheses -> “treat as value”
// ()          -> “run now”
// Semicolon   -> “end safely before next IIFE”
