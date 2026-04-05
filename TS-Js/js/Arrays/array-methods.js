// array-master.js
// Complete Array Reference for Development

// ==============================
// BASICS
// ==============================

const arr = ["a", "b", "c"];

console.log(arr[0]);           // read by index
arr[1] = "bb";                 // update by index (mutates)
console.log(arr.length);       // size
console.log(arr[arr.length - 1]); // last item

// ==============================
// ADD / REMOVE
// ==============================

const items = ["apple", "banana"];

// Mutating (avoid in real apps)
items.push("mango");           // add at end
items.pop();                   // remove from end
items.unshift("pear");         // add at start
items.shift();                 // remove from start

// Safe (immutable)
const addEnd = [...items, "mango"];
const addStart = ["pear", ...items];
const removeEnd = items.slice(0, -1);
const removeStart = items.slice(1);

// ==============================
// ITERATION METHODS
// ==============================

const nums = [1, 2, 3, 4, 5];

nums.forEach(n => console.log("forEach:", n)); // side-effects only

const doubled = nums.map(n => n * 2);          // transform
const even = nums.filter(n => n % 2 === 0);    // remove
const found = nums.find(n => n > 3);           // get one
const hasEven = nums.some(n => n % 2 === 0);   // any?
const allPositive = nums.every(n => n > 0);    // all?
const sum = nums.reduce((acc, n) => acc + n, 0); // combine

// ==============================
// SEARCHING
// ==============================

const fruits = ["apple", "banana", "mango"];

fruits.includes("apple");      // true/false
fruits.indexOf("mango");       // index or -1
fruits.lastIndexOf("mango");   // last index or -1

// For objects
const users = [
  { id: 1, name: "A" },
  { id: 2, name: "B" }
];

users.find(u => u.id === 2);
users.findIndex(u => u.id === 2);

// ==============================
// TRANSFORMATION & CHAINING
// ==============================

const activeNames = users
  .filter(u => u.id > 1)
  .map(u => u.name);

// ==============================
// FLATTENING
// ==============================

const nested = [1, 2, [3, 4], [5, [6]]];

nested.flat();        // one level
nested.flat(2);       // deep

const words = ["hello world", "js is fun"];
const flatWords = words.flatMap(w => w.split(" ")); // map + flat(1)

// ==============================
// SORTING
// ==============================

const numbers = [10, 5, 40, 2];

const asc = [...numbers].sort((a, b) => a - b);
const desc = [...numbers].sort((a, b) => b - a);

const nameSort = ["banana", "apple", "mango"].sort();
const objSort = [
  { id: 3, name: "C" },
  { id: 1, name: "A" },
  { id: 2, name: "B" }
].sort((a, b) => a.name.localeCompare(b.name));

// ==============================
// ARRAYS OF OBJECTS (REAL DEV)
// ==============================

const list = [
  { id: 1, name: "A", active: true },
  { id: 2, name: "B", active: false }
];

const byId = list.find(i => i.id === 2);

const updated = list.map(i =>
  i.id === 2 ? { ...i, active: true } : i
);

const removed = list.filter(i => i.id !== 1);
const added = [...list, { id: 3, name: "C", active: true }];

// ==============================
// UTILS
// ==============================

Array.isArray([1, 2]);          // true
Array.from("abc");             // ["a","b","c"]
Array.from([1, 2, 3], n => n * 2); // map in one go
Array.of(3);                   // [3]
Array.of(1, 2, 3);             // [1,2,3]

["a", "b"].join("-");           // "a-b"
"js is fun".split(" ");         // ["js","is","fun"]

// ==============================
// SLICE vs SPLICE
// ==============================

const base = ["a", "b", "c", "d"];

// slice(start, end) -> NON-mutating, end not included
const part = base.slice(1, 3);        // ["b","c"]
const lastTwo = base.slice(-2);       // ["c","d"]
const exceptLast = base.slice(0, -1); // ["a","b","c"]

// splice(start, deleteCount, ...items) -> MUTATING
const base2 = ["a", "b", "c", "d"];
const removedBySplice = base2.splice(1, 2); // removes ["b","c"], base2 -> ["a","d"]

const base3 = ["a", "b", "d"];
base3.splice(2, 0, "c"); // insert -> ["a","b","c","d"]

// ==============================
// POSITIVE vs NEGATIVE INDEX
// ==============================

const arr2 = ["x", "y", "z", "w"];
console.log(arr2[0]);     // "x"
console.log(arr2[-1]);    // undefined ([] doesn't support negative)
console.log(arr2.slice(-1)); // ["w"]
console.log(arr2.slice(-2)); // ["z","w"]

// ==============================
// MUTATING vs NON-MUTATING
// ==============================

// MUTATING:
// push, pop, shift, unshift
// splice, sort, reverse

// NON-MUTATING (safe):
// map, filter, find, some, every, reduce
// slice, flat, flatMap, concat
// spread [...arr]

// ==============================
// GOLDEN RULES
// ==============================
//
// ADD safely        -> [...arr, item]
// REMOVE safely     -> arr.filter(...)
// UPDATE safely     -> arr.map(...)
// SUBSET safely     -> arr.slice(...)
// FIND one          -> arr.find(...)
// ANY / ALL         -> some / every
// COMBINE           -> reduce
// FLATTEN           -> flat / flatMap
// SORT safely       -> [...arr].sort()
//
// Treat arrays as IMMUTABLE in real apps.
