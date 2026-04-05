// // object-utils.js

// const user = {
//   name: "hemla",
//   age: 23,
//   email: "hemla23@gmail.com",
//   role: "admin"
// };

// // 1. Object.keys()
// // Returns all keys
// console.log("Keys:", Object.keys(user));

// // 2. Object.values()
// // Returns all values
// console.log("Values:", Object.values(user));

// // 3. Object.entries()
// // Returns [key, value] pairs
// console.log("Entries:", Object.entries(user));

// // Loop using entries
// for (const [key, value] of Object.entries(user)) {
//   console.log(key, "=>", value);
// }

// // 4. Object.hasOwn()
// // Check if key exists on object itself
// console.log("Has name:", Object.hasOwn(user, "name"));
// console.log("Has password:", Object.hasOwn(user, "password"));

// // 5. "in" operator
// // Checks if a key exists anywhere (own or prototype)
// console.log("name in user:", "name" in user);
// console.log("password in user:", "password" in user);

// // Difference:
// // Object.hasOwn(user, "name") -> only own keys
// // "name" in user              -> own + inherited keys

// // 6. Real-dev example: validate allowed fields
// const allowed = ["name", "age", "email"];
// const incoming = { name: "A", age: 20, role: "admin" };

// const invalid = Object.keys(incoming).filter(
//   key => !allowed.includes(key)
// );

// console.log("Invalid fields:", invalid);

// // 7. Object.fromEntries()
// // Converts [key, value] pairs back into an object
// const pairs = [
//   ["id", 1],
//   ["title", "Post"],
//   ["active", true]
// ];

// const objFromPairs = Object.fromEntries(pairs);
// console.log("From entries:", objFromPairs);

// // 8. Clean object by removing null / undefined values
// const dirty = {
//   name: "A",
//   email: null,
//   age: 23,
//   city: undefined
// };

// const cleaned = Object.fromEntries(
//   Object.entries(dirty).filter(([_, v]) => v != null)
// );

// console.log("Cleaned:", cleaned);

// // 9. for...in loop (older style)
// for (const key in user) {
//   console.log("for..in:", key, user[key]);
// }

// // Rules summary:
// //
// // Object.keys(obj)        -> array of keys
// // Object.values(obj)      -> array of values
// // Object.entries(obj)     -> array of [key, value]
// // Object.fromEntries(arr) -> build object from pairs
// // Object.hasOwn(obj, k)   -> check own key
// // "k" in obj              -> check key anywhere
// //
// // Use these to validate input, clean data,
// // reshape objects, and build API logic.





// object-utils.js

const user = {
  name: "hemla",
  age: 23,
  email: "hemla23@gmail.com",
  role: "admin"
};

// 1. Object.keys()
// Returns all keys
console.log("Keys:", Object.keys(user));

// 2. Object.values()
// Returns all values
console.log("Values:", Object.values(user));

// 3. Object.entries()
// Returns [key, value] pairs
console.log("Entries:", Object.entries(user));

// Loop using entries
for (const [key, value] of Object.entries(user)) {
  console.log(key, "=>", value);
}

// 4. Object.hasOwn()
// Check if key exists on object itself
console.log("Has name:", Object.hasOwn(user, "name"));
console.log("Has password:", Object.hasOwn(user, "password"));

// 5. "in" operator
// Checks if a key exists anywhere (own or prototype)
console.log("name in user:", "name" in user);
console.log("password in user:", "password" in user);

// Difference:
// Object.hasOwn(user, "name") -> only own keys
// "name" in user              -> own + inherited keys

// 6. Real-dev example: validate allowed fields
const allowed = ["name", "age", "email"];
const incoming = { name: "A", age: 20, role: "admin" };

const invalid = Object.keys(incoming).filter(
  key => !allowed.includes(key)
);

console.log("Invalid fields:", invalid);

// 7. Object.fromEntries()
// Converts [key, value] pairs back into an object
const pairs = [
  ["id", 1],
  ["title", "Post"],
  ["active", true]
];

const objFromPairs = Object.fromEntries(pairs);
console.log("From entries:", objFromPairs);

// 8. Clean object by removing null / undefined values
const dirty = {
  name: "A",
  email: null,
  age: 23,
  city: undefined
};

const cleaned = Object.fromEntries(
  Object.entries(dirty).filter(([_, v]) => v != null)
);

console.log("Cleaned:", cleaned);

// 9. for...in loop (older style)
for (const key in user) {
  console.log("for..in:", key, user[key]);
}

// --------------------------------------------------
// 10. Object Control: freeze and seal

// Object.freeze() -> fully lock object
const config = {
  apiUrl: "https://api.app.com",
  timeout: 5000
};

Object.freeze(config);

config.timeout = 10000;   // will NOT change
config.newKey = "test";  // will NOT be added

console.log("Frozen config:", config);

// Object.seal() -> lock structure, allow value change
const profile = {
  name: "A",
  age: 20
};

Object.seal(profile);

profile.age = 21;      // allowed
profile.city = "NY";   // not allowed
delete profile.name;   // not allowed

console.log("Sealed profile:", profile);

// Rules summary:
//
// Object.keys(obj)        -> array of keys
// Object.values(obj)      -> array of values
// Object.entries(obj)     -> array of [key, value]
// Object.fromEntries(arr) -> build object from pairs
// Object.hasOwn(obj, k)   -> check own key
// "k" in obj              -> check key anywhere
//
// freeze -> cannot change values, add keys, or delete keys
// seal   -> can change values, but cannot add or delete keys
//
// Use these to validate input, clean data,
// reshape objects, and protect important objects.


// ==============================
// DEV GUIDE – HOW TO THINK ABOUT OBJECT UTILS
// ==============================
//
// 1. I want to INSPECT an object
// --------------------------------
//   Object.keys(obj)    -> what fields exist?
//   Object.values(obj)  -> what data is inside?
//   Object.entries(obj) -> loop with [key, value]
//
// Use in:
// - Debugging payloads
// - Dynamic forms
// - Logging
// - Generic validators
//
// 2. I want to VALIDATE input (APIs / forms)
// --------------------------------
//   const invalid = Object.keys(incoming)
//     .filter(k => !allowed.includes(k))
//
// Use in:
// - Backend request validation
// - Preventing extra fields
// - Security hardening
//
// 3. I want to TRANSFORM objects
// --------------------------------
//   Object.entries(obj) -> filter/map -> Object.fromEntries()
//
// Pattern:
//   const cleaned = Object.fromEntries(
//     Object.entries(obj).filter(([_, v]) => v != null)
//   )
//
// Use in:
// - Cleaning payloads
// - Shaping API responses
// - Removing empty values
//
// 4. I want to CHECK key existence
// --------------------------------
//   Object.hasOwn(obj, k) -> only own data
//   "k" in obj            -> own + inherited
//
// Use:
// - hasOwn in business logic
// - "in" when working with prototypes / frameworks
//
// 5. I want to PROTECT objects
// --------------------------------
//   Object.freeze(obj)
//     -> config, constants, env maps
//
//   Object.seal(obj)
//     -> fixed schema, mutable values
//
// Use when:
// - You never want structure to change
// - You want to prevent accidental bugs
//
// ------------------------------
// MENTAL MODEL
// ------------------------------
//
// keys / values / entries  -> "Look at data"
// fromEntries              -> "Rebuild data"
// hasOwn / in              -> "Does this field exist?"
// freeze                   -> "This must never change"
// seal                     -> "Shape is fixed"
//
// In real apps:
// - Use these for safety
// - Use these for validation
// - Use these for shaping APIs
// - Use these to avoid silent bugs
