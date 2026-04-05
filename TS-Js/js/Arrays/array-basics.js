// array-basics.js

// Creating arrays
const fruits = ["apple", "banana", "mango"];
const numbers = [10, 20, 30, 40];

// Access by index (0-based)
console.log("First fruit:", fruits[0]);   // apple
console.log("Second fruit:", fruits[1]);  // banana

// Length of array
console.log("Fruits length:", fruits.length);
console.log("Numbers length:", numbers.length);

// Last element using length
console.log("Last fruit:", fruits[fruits.length - 1]);

// Arrays can hold mixed types
const mixed = ["text", 42, true, { a: 1 }, [1, 2]];
console.log("Mixed:", mixed);

// Rule:
// - Arrays are ordered lists
// - Index starts from 0
// - length tells how many items exist
