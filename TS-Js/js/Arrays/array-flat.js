// array-flat.js

// Nested arrays
const nested = [1, 2, [3, 4], [5, [6, 7]]];

// 1. flat()
// Flattens one level by default
const oneLevel = nested.flat();
console.log("Flat (1 level):", oneLevel);

// Flatten two levels
const twoLevels = nested.flat(2);
console.log("Flat (2 levels):", twoLevels);

// --------------------------------------

// 2. flatMap()
// map + flat(1) in one step

const words = ["hello world", "js is fun"];

// Using map + flat
const split1 = words.map(w => w.split(" ")).flat();
console.log("map + flat:", split1);

// Using flatMap (cleaner)
const split2 = words.flatMap(w => w.split(" "));
console.log("flatMap:", split2);

// Rules:
//
// flat(depth)    -> flatten nested arrays
// flatMap(fn)    -> map and flatten in one step
//
// Use flat when data is already nested.
// Use flatMap when your map returns arrays.
