// array-read-write.js

const items = ["apple", "banana", "mango"];

// --------------------
// Read by index
console.log(items[0]); // apple
console.log(items[1]); // banana

// Update by index (mutates)
items[1] = "grapes";
console.log("After update:", items);

// Dynamic index access
function getItem(arr, index) {
  return arr[index];
}

function setItem(arr, index, value) {
  arr[index] = value; // mutates
  return arr;
}

console.log("Get dynamic:", getItem(items, 2));
console.log("Set dynamic:", setItem(items, 0, "orange"));

// --------------------
// Add & Remove (Mutating)

// Add
items.push("kiwi");        // add at end
items.unshift("pear");     // add at start
console.log("After add:", items);

// Remove
items.pop();               // remove from end
items.shift();             // remove from start
console.log("After remove:", items);

// --------------------
// Safe (Immutable) Add & Remove

const safeAddEnd = [...items, "papaya"];
const safeAddStart = ["pineapple", ...items];

const safeRemoveEnd = items.slice(0, -1);
const safeRemoveStart = items.slice(1);

console.log("Safe add end:", safeAddEnd);
console.log("Safe add start:", safeAddStart);
console.log("Safe remove end:", safeRemoveEnd);
console.log("Safe remove start:", safeRemoveStart);

// Rules:
//
// - arr[index] reads/writes
// - push/pop/shift/unshift mutate the original array
// - Use spread or slice for safe (immutable) changes
