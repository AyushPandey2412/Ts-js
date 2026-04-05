// object-basics.js

// Literal Object (most common)
const user1 = {
  name: "Hemla",
  role: "admin"
};

console.log("Literal Object:", user1);

// Singleton Object (created using constructor)
const user2 = new Object();
user2.name = "Hemla";
user2.role = "admin";

console.log("Singleton Object:", user2);

// Both store data as key-value pairs.
// Difference:
//
// - Literal creates a new object directly using {}
// - Constructor form creates via new Object()
//
// In practice:
// These two are functionally the same.
// The difference is style, not capability.

// ==============================
// DEV GUIDE – HOW REAL APPS USE OBJECTS
// ==============================
//
// In real development:
//
// 1. You almost always use literal objects:
//
//   const user = { name: "A", role: "admin" };
//
// Reasons:
// - Shorter and clearer
// - Easier to read
// - Standard across codebases
// - No mental overhead
//
// 2. Constructor style is rare:
//
//   const obj = new Object();
//
// You will mostly see it in:
// - Legacy code
// - Polyfills / libraries
// - Framework internals
//
// ------------------------------
// MENTAL MODEL
// ------------------------------
//
// Object = structured data
//
// {
//   key: value,
//   key: value
// }
//
// Use objects when:
// - Data has meaning by name
// - Order is not important
// - You want to model real-world entities
//
// Examples:
// - User
// - Config
// - Settings
// - Payload
//
// Arrays are for lists.
// Objects are for entities.
//
// Think:
//   "Is this a thing?"  -> Object
//   "Is this a list?"   -> Array
