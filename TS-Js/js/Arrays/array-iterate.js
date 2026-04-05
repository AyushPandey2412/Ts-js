// array-iterate.js

const numbers = [1, 2, 3, 4, 5];

// 1. for loop (old school)
for (let i = 0; i < numbers.length; i++) {
  console.log("for:", numbers[i]);
}

// 2. forEach (do something for each item)
numbers.forEach(n => {
  console.log("forEach:", n);
});

// 3. map (transform each item, return new array)

// Arrow with implicit return
const doubled1 = numbers.map(n => n * 2);

// Arrow with block + explicit return
const doubled2 = numbers.map(n => {
  return n * 2;
});

// Object return needs ()
const objs = numbers.map(n => ({ value: n }));

console.log("map implicit:", doubled1);
console.log("map explicit:", doubled2);
console.log("map objects:", objs);

// Common mistake:
// numbers.map(n => { n * 2 }); // returns undefined for each item

// Correct:
numbers.map(n => { return n * 2; });

// 4. filter (keep only matching items)
const even = numbers.filter(n => n % 2 === 0);
console.log("filter (even):", even);

// 5. find (get first matching item)
const firstGreaterThanThree = numbers.find(n => n > 3);
console.log("find:", firstGreaterThanThree);

// 6. some (does any item match?)
const hasEven = numbers.some(n => n % 2 === 0);
console.log("some (has even):", hasEven);

// 7. every (do all items match?)
const allPositive = numbers.every(n => n > 0);
console.log("every (all positive):", allPositive);

// 8. reduce (combine into single value)
const sum = numbers.reduce((acc, n) => acc + n, 0);
console.log("reduce (sum):", sum);

// ==============================
// DEV GUIDE – WHEN TO USE WHAT
// ==============================
//
// I want to DO something for each item:
//   -> forEach
//
// I want to CHANGE each item:
//   -> map
//
// I want to REMOVE some items:
//   -> filter
//
// I want ONE item:
//   -> find
//
// I want to CHECK condition:
//   -> some (any true)
//   -> every (all true)
//
// I want to COMBINE into one value:
//   -> reduce
//
// ------------------------------
// REAL DEV PATTERNS
// ------------------------------
//
// API shaping:
//   users.map(u => ({ id: u.id, name: u.name }))
//
// Cleanup data:
//   items.filter(x => x.active)
//
// Find by id:
//   users.find(u => u.id === id)
//
// Update immutably:
//   users.map(u => u.id === id ? { ...u, name: "A" } : u)
//
// Validation:
//   fields.some(f => f === "")
//   fields.every(f => f !== "")
//
// ------------------------------
// MENTAL MODEL
// ------------------------------
//
// map    -> "change each item"
// filter -> "remove some items"
// find   -> "give me one"
// some   -> "is there any?"
// every  -> "are all?"
// reduce -> "turn many into one"
