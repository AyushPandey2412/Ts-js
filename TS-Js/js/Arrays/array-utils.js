// array-utils.js

// 1. Array.isArray()
// Check if something is really an array

console.log(Array.isArray([1, 2, 3])); // true
console.log(Array.isArray("hello"));   // false
console.log(Array.isArray({}));        // false

// Real-dev use:
// APIs sometimes return single value OR array.
// This normalizes the input.
function ensureArray(value) {
  return Array.isArray(value) ? value : [value];
}

console.log(ensureArray(5));        // [5]
console.log(ensureArray([1, 2]));   // [1, 2]

// Use when:
// - Input can be value or array
// - You want to always work with arrays

// --------------------------------------

// 2. Array.from()
// Create array from iterable or array-like

const str = "hello";
const chars = Array.from(str);
console.log("From string:", chars);

const set = new Set([1, 2, 3]);
const arrFromSet = Array.from(set);
console.log("From set:", arrFromSet);

// With map in one go
const doubled = Array.from([1, 2, 3], n => n * 2);
console.log("From with map:", doubled);

// Use when:
// - You have string, Set, Map, arguments, NodeList
// - You need a real array to use map/filter/etc.

// --------------------------------------

// 3. Array.of()
// Create array from arguments

const a = Array.of(1);
const b = Array.of(1, 2, 3);

console.log("Array.of(1):", a);
console.log("Array.of(1,2,3):", b);

// Difference:
// Array(3)    -> empty array of length 3
// Array.of(3) -> [3]

// Use when:
// - You want to safely create array from values
// - Avoid confusion with Array(length)

// --------------------------------------

// 4. join()
// Convert array to string

const fruits = ["apple", "banana", "mango"];
console.log("Join with comma:", fruits.join(", "));
console.log("Join with dash:", fruits.join("-"));

// Use when:
// - Displaying list in UI
// - Creating CSV-like strings
// - Formatting output

// --------------------------------------

// 5. split (string -> array)

const sentence = "js is fun";
const words = sentence.split(" ");
console.log("Split words:", words);

// Use when:
// - Parsing input
// - Tokenizing text
// - Converting form input to list

// ==============================
// DEV GUIDE – MENTAL MODEL
// ==============================
//
// I am not sure if value is array:
//   -> Array.isArray / ensureArray
//
// I have iterable, not array:
//   -> Array.from
//
// I want safe array creation:
//   -> Array.of
//
// I want string from array:
//   -> join
//
// I want array from string:
//   -> split
//
// These helpers are small,
// but they prevent many runtime bugs
// in backend APIs and frontend apps.
