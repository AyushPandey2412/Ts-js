# JavaScript — Complete Interview Preparation
> Theory Q&A + Coding Round Problems + Real Scenarios
> Covers: Junior → Senior level

---

# TABLE OF CONTENTS

1. [Core Concepts — Theory Questions](#1-core-concepts--theory-questions)
2. [Functions & Scope](#2-functions--scope)
3. [Closures](#3-closures)
4. [Prototypes & Inheritance](#4-prototypes--inheritance)
5. [Asynchronous JavaScript](#5-asynchronous-javascript)
6. [Event Loop](#6-event-loop)
7. [ES6+ Features](#7-es6-features)
8. [Array & Object Methods](#8-array--object-methods)
9. [this Keyword](#9-this-keyword)
10. [Memory & Performance](#10-memory--performance)
11. [Coding Round Problems](#11-coding-round-problems)
12. [Output-Based Questions](#12-output-based-questions)
13. [System Design Questions](#13-system-design-questions)

---

# 1. CORE CONCEPTS — THEORY QUESTIONS

---

## Q: What is JavaScript? What makes it unique?

JavaScript is a single-threaded, interpreted, dynamically typed programming language with first-class functions.

**Unique traits:**
- Runs in the browser AND server (Node.js)
- Non-blocking I/O via event loop
- Functions are first-class citizens (can be passed, returned, assigned)
- Prototype-based inheritance (not classical)
- Dynamic typing — types are checked at runtime

---

## Q: What is the difference between var, let, and const?

| Feature | var | let | const |
|---|---|---|---|
| Scope | Function | Block | Block |
| Hoisted | Yes (as undefined) | Yes (TDZ) | Yes (TDZ) |
| Re-declarable | Yes | No | No |
| Re-assignable | Yes | Yes | No |
| Global property | Yes (window.x) | No | No |

```js
// Temporal Dead Zone (TDZ) — let/const before declaration
console.log(x) // ReferenceError — TDZ
let x = 5

// var hoisting
console.log(y) // undefined — hoisted but not initialized
var y = 5
```

---

## Q: What is hoisting?

JavaScript moves **declarations** (not initializations) to the top of their scope during the compilation phase.

```js
// What you write
greet()
function greet() { console.log('Hello') }
var name = 'John'

// What JS sees
function greet() { console.log('Hello') } // function fully hoisted
var name                                   // var declaration hoisted
greet()                                    // works
name = 'John'                              // initialization stays here

// Class declarations are NOT hoisted
new Animal()  // ReferenceError
class Animal {}
```

---

## Q: What is the difference between == and ===?

- `==` (loose equality) — performs **type coercion** before comparing
- `===` (strict equality) — compares **value AND type**, no coercion

```js
0  == false    // true  — false coerces to 0
0  === false   // false — different types

'' == false    // true
'' === false   // false

null == undefined  // true  — special case
null === undefined // false

NaN == NaN    // false — NaN is never equal to anything
NaN === NaN   // false

// RULE: Always use === in production
```

---

## Q: What are falsy values in JavaScript?

```js
// Exactly 8 falsy values:
false
0
-0
0n          // BigInt zero
''          // empty string
null
undefined
NaN

// Everything else is truthy, including:
[]          // empty array — truthy
{}          // empty object — truthy
'0'         // non-empty string — truthy
'false'     // non-empty string — truthy
-1          // non-zero number — truthy
```

---

## Q: What is the difference between null and undefined?

```js
// undefined — variable declared but not assigned
let x
console.log(x)          // undefined
console.log(typeof x)   // 'undefined'

// null — intentional absence of value
let user = null
console.log(typeof null) // 'object' — famous JS bug

// When to use
// undefined — default state, function with no return
// null      — intentional empty value (user not logged in)

// Checking
x == null       // true for both null and undefined (loose)
x === null      // false if x is undefined
x === undefined // true only for undefined
```

---

## Q: What is typeof and what are its quirks?

```js
typeof 'hello'      // 'string'
typeof 42           // 'number'
typeof true         // 'boolean'
typeof undefined    // 'undefined'
typeof Symbol()     // 'symbol'
typeof 42n          // 'bigint'
typeof function(){} // 'function'
typeof {}           // 'object'
typeof []           // 'object'   ← arrays are objects
typeof null         // 'object'   ← famous bug, null is NOT an object

// Better checks
Array.isArray([])   // true
x === null          // true for null only
```

---

## Q: What is type coercion? Give examples of implicit coercion.

Type coercion is automatic/implicit conversion of values from one type to another.

```js
// String coercion (+ with string)
'5' + 3    // '53'   — number converts to string
'5' + true // '5true'

// Number coercion (-, *, /, comparison)
'5' - 3    // 2      — string converts to number
'5' * '3'  // 15
+'5'        // 5      — unary + converts to number

// Boolean coercion
!!''        // false
!!0         // false
!!null      // false
!![]        // true   — arrays are truthy even if empty
!!{}        // true

// Object to primitive
{} + []     // 0     — browser quirk
[] + {}     // '[object Object]'
```

---

# 2. FUNCTIONS & SCOPE

---

## Q: What are the different ways to define a function?

```js
// 1. Function Declaration — hoisted
function add(a, b) { return a + b }

// 2. Function Expression — not hoisted
const multiply = function(a, b) { return a * b }

// 3. Named Function Expression — name available inside only
const factorial = function fact(n) {
  return n <= 1 ? 1 : n * fact(n - 1)  // 'fact' accessible here
}

// 4. Arrow Function — no own this, arguments, super
const divide = (a, b) => a / b

// 5. IIFE — runs immediately
const result = (function() { return 42 })()

// 6. Generator Function
function* generateIds() {
  let id = 1
  while (true) { yield id++ }
}

// 7. Async Function
async function fetchData() { return await fetch('/api') }
```

---

## Q: What is lexical scope?

Scope is determined by where the function is **written** (defined), not where it is **called**.

```js
const name = 'Global'

function outer() {
  const name = 'Outer'

  function inner() {
    console.log(name)  // 'Outer' — looks up to its lexical parent
  }

  inner()
}

outer()  // 'Outer' — NOT 'Global', because inner is defined inside outer
```

---

## Q: What is the difference between function scope and block scope?

```js
// Function scope (var)
function example() {
  if (true) {
    var x = 10  // accessible throughout the function
  }
  console.log(x)  // 10 — var leaks out of the if block
}

// Block scope (let/const)
function example2() {
  if (true) {
    let y = 10  // only accessible inside the if block
  }
  console.log(y)  // ReferenceError — y is not defined
}
```

---

## Q: What is an IIFE and why use it?

Immediately Invoked Function Expression — executes right after creation.

```js
// Pattern
(function() {
  // code here
})()

// Arrow IIFE
(() => {
  // code here
})()

// Why use it:
// 1. Create private scope — avoid polluting global namespace
const counter = (function() {
  let count = 0  // private
  return {
    increment: () => ++count,
    getCount:  () => count
  }
})()

// 2. Execute async code at top level (before top-level await)
(async () => {
  const data = await fetchData()
  console.log(data)
})()
```

---

## Q: What is a pure function?

A function that:
1. Always returns the same output for same input
2. Has no side effects (doesn't modify external state)

```js
// Pure — no side effects, deterministic
function add(a, b) { return a + b }
function formatName(first, last) { return `${first} ${last}` }

// Impure — depends on or modifies external state
let total = 0
function addToTotal(n) {
  total += n  // side effect — modifies external variable
  return total
}

// Impure — non-deterministic
function getCurrentTime() { return Date.now() }

// Why pure functions matter:
// - Easy to test
// - Easy to cache (memoize)
// - Safe to run in parallel
// - Predictable behavior
```

---

# 3. CLOSURES

---

## Q: What is a closure?

A closure is a function that **remembers** the variables from its outer scope even after the outer function has finished executing.

```js
function outer() {
  let count = 0  // this variable is "closed over"

  return function inner() {
    count++        // inner remembers 'count' from outer
    return count
  }
}

const increment = outer()  // outer() has finished, but count lives on
increment()  // 1
increment()  // 2
increment()  // 3
```

---

## Q: Give real-world use cases of closures.

```js
// 1. Data privacy / encapsulation
function createBankAccount(initialBalance) {
  let balance = initialBalance  // private

  return {
    deposit(amount)  { balance += amount; return balance },
    withdraw(amount) {
      if (amount > balance) return 'Insufficient funds'
      balance -= amount
      return balance
    },
    getBalance() { return balance }
  }
}

const account = createBankAccount(1000)
account.deposit(500)    // 1500
account.withdraw(200)   // 1300
// account.balance      // undefined — private!


// 2. Function factories
function createMultiplier(factor) {
  return (number) => number * factor
}

const double = createMultiplier(2)
const triple = createMultiplier(3)
double(5)  // 10
triple(5)  // 15


// 3. Memoization
function memoize(fn) {
  const cache = new Map()
  return function(...args) {
    const key = JSON.stringify(args)
    if (cache.has(key)) return cache.get(key)
    const result = fn.apply(this, args)
    cache.set(key, result)
    return result
  }
}

const expensiveCalc = memoize((n) => {
  // heavy computation
  return n * n
})


// 4. Event handlers with shared state
function createClickTracker(elementId) {
  let clickCount = 0
  const element = document.getElementById(elementId)

  element.addEventListener('click', function() {
    clickCount++
    console.log(`Clicked ${clickCount} times`)
  })
}


// 5. Partial application
function multiply(a, b, c) { return a * b * c }

function partial(fn, ...presetArgs) {
  return function(...laterArgs) {
    return fn(...presetArgs, ...laterArgs)
  }
}

const double = partial(multiply, 2, 1)
double(5)  // 10
```

---

## Q: Classic closure trap in loops — explain and fix.

```js
// TRAP — all callbacks share the same 'i' reference
for (var i = 0; i < 5; i++) {
  setTimeout(() => console.log(i), 1000)
}
// Prints: 5 5 5 5 5
// Reason: var is function-scoped, all callbacks close over same 'i'
// By the time callbacks run, loop is done and i = 5

// FIX 1 — use let (block scoped, new binding per iteration)
for (let i = 0; i < 5; i++) {
  setTimeout(() => console.log(i), 1000)
}
// Prints: 0 1 2 3 4

// FIX 2 — IIFE to capture 'i' per iteration
for (var i = 0; i < 5; i++) {
  (function(j) {
    setTimeout(() => console.log(j), 1000)
  })(i)
}
// Prints: 0 1 2 3 4

// FIX 3 — pass i as argument to setTimeout
for (var i = 0; i < 5; i++) {
  setTimeout(console.log, 1000, i)
}
```

---

# 4. PROTOTYPES & INHERITANCE

---

## Q: What is a prototype? How does prototype chain work?

Every JS object has an internal `[[Prototype]]` property linking to another object. When you access a property, JS walks up the prototype chain until it finds it or reaches `null`.

```js
const animal = {
  breathe() { return 'breathing' }
}

const dog = Object.create(animal)  // dog's prototype is animal
dog.bark = function() { return 'woof' }

dog.bark()    // 'woof'    — found on dog
dog.breathe() // 'breathing' — found on dog's prototype (animal)
dog.toString() // '[object Object]' — found on Object.prototype

// Chain: dog → animal → Object.prototype → null

// Check prototype
Object.getPrototypeOf(dog) === animal  // true
dog.hasOwnProperty('bark')    // true
dog.hasOwnProperty('breathe') // false — inherited, not own
```

---

## Q: What is the difference between __proto__ and prototype?

```js
// prototype — property on constructor FUNCTIONS only
function Person(name) { this.name = name }
Person.prototype.greet = function() { return `Hi, I'm ${this.name}` }

// __proto__ — property on INSTANCES, links to constructor's prototype
const john = new Person('John')
john.__proto__ === Person.prototype  // true

// Modern way — use Object.getPrototypeOf()
Object.getPrototypeOf(john) === Person.prototype  // true
```

---

## Q: How does class work in JS? Is it different from prototype?

```js
// Class is syntactic sugar over prototype-based inheritance
class Animal {
  #sound  // private field (ES2022)

  constructor(name, sound) {
    this.name  = name
    this.#sound = sound
  }

  speak() {
    return `${this.name} says ${this.#sound}`
  }

  static create(name, sound) {
    return new Animal(name, sound)
  }
}

class Dog extends Animal {
  constructor(name) {
    super(name, 'woof')  // must call super before using 'this'
    this.tricks = []
  }

  learn(trick) {
    this.tricks.push(trick)
    return this
  }

  // Override parent method
  speak() {
    return `${super.speak()}! (tail wagging)`
  }
}

const dog = new Dog('Rex')
dog.speak()        // 'Rex says woof! (tail wagging)'
dog.learn('sit').learn('shake')  // chaining

// Under the hood — still prototype based
typeof Animal  // 'function'
```

---

## Q: What is Object.create() and when to use it?

```js
// Create object with specific prototype
const userMethods = {
  greet()    { return `Hello, ${this.name}` },
  getAge()   { return this.age },
}

const user = Object.create(userMethods)
user.name = 'John'
user.age  = 25
user.greet()  // 'Hello, John'

// Create object with no prototype (pure dictionary)
const dict = Object.create(null)
dict.key = 'value'
// dict has no toString, hasOwnProperty, etc. — safe for key-value store

// vs {} — has Object.prototype as prototype
const obj = {}
obj.toString  // [Function: toString] — inherited
```

---

# 5. ASYNCHRONOUS JAVASCRIPT

---

## Q: What is the difference between synchronous and asynchronous code?

```js
// Synchronous — blocks execution until done
console.log('1')
const result = heavyCalculation()  // blocks here
console.log('2')  // only runs after heavyCalculation finishes

// Asynchronous — doesn't block
console.log('1')
fetchData().then(data => console.log('3 — data arrived'))
console.log('2')  // runs immediately, doesn't wait
// Output: 1, 2, 3
```

---

## Q: What are Promises? Explain the states.

A Promise represents a value that will be available in the future.

**States:**
- `pending` — initial state
- `fulfilled` — operation succeeded, has a value
- `rejected` — operation failed, has a reason

```js
// Creating a Promise
const promise = new Promise((resolve, reject) => {
  const success = true

  if (success) {
    resolve('Data loaded')   // fulfills
  } else {
    reject(new Error('Failed'))  // rejects
  }
})

// Consuming
promise
  .then(value => console.log(value))   // 'Data loaded'
  .catch(error => console.error(error))
  .finally(() => console.log('Done'))  // always runs

// Chaining — each .then returns a new Promise
fetchUser(1)
  .then(user => fetchOrders(user.id))  // return value becomes next .then's input
  .then(orders => orders.filter(o => o.status === 'active'))
  .then(activeOrders => setOrders(activeOrders))
  .catch(error => handleError(error))  // catches any error in the chain
```

---

## Q: async/await vs .then() — which to prefer?

```js
// .then() — harder to read with complex logic
function loadDashboard() {
  return fetchUser()
    .then(user => {
      return fetchOrders(user.id)
        .then(orders => ({ user, orders }))  // nesting to share 'user'
    })
    .then(({ user, orders }) => {
      return fetchStats(user.id, orders.length)
    })
}

// async/await — reads like synchronous code
async function loadDashboard() {
  const user   = await fetchUser()
  const orders = await fetchOrders(user.id)
  const stats  = await fetchStats(user.id, orders.length)
  return { user, orders, stats }
}

// BOTH compile to the same thing — async/await is preferred for readability
// BUT .then() is useful for simple one-liners
const users = await fetch('/api/users').then(r => r.json())
```

---

## Q: What are the Promise combinator methods?

```js
const p1 = fetchUsers()     // resolves in 1s
const p2 = fetchProducts()  // resolves in 2s
const p3 = fetchOrders()    // rejects in 1.5s

// Promise.all — waits for ALL, rejects if ANY rejects
const [users, products, orders] = await Promise.all([p1, p2, p3])
// If p3 rejects, the whole thing rejects

// Promise.allSettled — waits for ALL, never rejects
const results = await Promise.allSettled([p1, p2, p3])
results.forEach(r => {
  if (r.status === 'fulfilled') console.log(r.value)
  else console.log(r.reason)
})

// Promise.race — resolves/rejects with the FIRST to settle
const first = await Promise.race([p1, p2, p3])  // p1 (fastest)

// Promise.any — resolves with FIRST SUCCESS (ignores rejections)
const fastest = await Promise.any([p1, p2, p3])
// If ALL reject, throws AggregateError

// WHEN TO USE:
// all         → load all required data, fail if any missing
// allSettled  → load optional data, don't fail if some missing
// race        → timeout pattern
// any         → multiple servers, use fastest responder
```

---

## Q: How do you handle errors in async/await?

```js
// Option 1 — try/catch (most common)
async function loadUser(id) {
  try {
    const user = await fetchUser(id)
    return user
  } catch (error) {
    console.error('Failed to load user:', error)
    throw error  // re-throw so caller can handle
  }
}

// Option 2 — catch on the await expression
const user = await fetchUser(id).catch(err => null)
if (!user) return  // handle null case

// Option 3 — wrapper utility (elegant, avoids try/catch everywhere)
async function to(promise) {
  try {
    const data = await promise
    return [null, data]
  } catch (error) {
    return [error, null]
  }
}

const [error, user] = await to(fetchUser(id))
if (error) { handleError(error); return }
// use user safely
```

---

# 6. EVENT LOOP

---

## Q: Explain the JavaScript Event Loop.

```
JavaScript Runtime:
┌─────────────────┐
│   Call Stack    │  ← runs code
└────────┬────────┘
         │
         ↓
┌─────────────────┐
│   Web APIs      │  ← setTimeout, fetch, DOM events (browser handles these)
└────────┬────────┘
         │
    ┌────┴────────────────┐
    │                     │
    ↓                     ↓
┌──────────┐    ┌──────────────────┐
│Microtask │    │   Task Queue     │
│ Queue    │    │ (Macrotask)      │
│(Promise) │    │(setTimeout, I/O) │
└──────────┘    └──────────────────┘

EVENT LOOP: When call stack is empty:
  1. Run ALL microtasks first
  2. Then run ONE macrotask
  3. Repeat
```

```js
// Order of execution
console.log('1')              // sync — runs immediately

setTimeout(() => {
  console.log('2')            // macrotask — runs last
}, 0)

Promise.resolve()
  .then(() => console.log('3'))  // microtask — runs before macrotask

queueMicrotask(() => {
  console.log('4')            // microtask
})

console.log('5')              // sync

// Output: 1, 5, 3, 4, 2
// Sync first → all microtasks → then macrotasks
```

---

## Q: What is the difference between microtasks and macrotasks?

| | Microtasks | Macrotasks |
|---|---|---|
| Examples | Promise.then, queueMicrotask, MutationObserver | setTimeout, setInterval, setImmediate, I/O |
| Priority | High — runs before macrotasks | Low — runs after microtasks |
| Queue | Microtask queue (drained completely) | Task queue (one per event loop iteration) |

```js
// Microtask queue is completely drained before macrotask runs
Promise.resolve().then(() => {
  console.log('Micro 1')
  Promise.resolve().then(() => console.log('Micro 2'))  // added during drain
})

setTimeout(() => console.log('Macro'), 0)

// Output: Micro 1, Micro 2, Macro
// Even though Micro 2 was added after Macro was queued,
// microtasks drain completely before macrotasks run
```

---

# 7. ES6+ FEATURES

---

## Q: What are template literals?

```js
const name  = 'John'
const price = 1500

// Tagged template literals (advanced)
function highlight(strings, ...values) {
  return strings.reduce((result, str, i) => {
    return result + str + (values[i] ? `<strong>${values[i]}</strong>` : '')
  }, '')
}

const html = highlight`Hello ${name}, your total is ${price}`
// 'Hello <strong>John</strong>, your total is <strong>1500</strong>'
```

---

## Q: What is destructuring? Show complex examples.

```js
// Array destructuring
const [first, , third, fourth = 'default'] = [1, 2, 3]
// first=1, third=3, fourth='default'

// Swap variables
let a = 1, b = 2
;[a, b] = [b, a]  // a=2, b=1 — no temp variable needed

// Object destructuring with renaming and defaults
const { name: fullName = 'Anonymous', age = 0, address: { city } = {} } = user

// In function parameters
function createUser({ name, age = 25, role = 'user' } = {}) {
  return { name, age, role }
}

// Mixed
const { data: [firstUser, ...otherUsers], total } = apiResponse
```

---

## Q: What are generators?

```js
function* idGenerator() {
  let id = 1
  while (true) {
    yield id++  // pauses here and returns value
  }
}

const gen = idGenerator()
gen.next()  // { value: 1, done: false }
gen.next()  // { value: 2, done: false }
gen.next()  // { value: 3, done: false }


// REAL USE: Infinite scroll pagination
function* paginate(fetchFn, pageSize = 10) {
  let page = 1
  while (true) {
    const data = yield fetchFn(page, pageSize)
    if (data.length < pageSize) return  // done
    page++
  }
}


// REAL USE: Unique ID generation
const uniqueId = (function*() {
  let id = 0
  while (true) yield `id_${++id}`
})()

uniqueId.next().value  // 'id_1'
uniqueId.next().value  // 'id_2'
```

---

## Q: What is the difference between Map and Object?

```js
// Object — keys must be strings/symbols
const obj = {}
obj['name'] = 'John'
obj[1]      = 'number key'  // stored as '1' (string)

// Map — keys can be ANY type
const map = new Map()
map.set('name', 'John')
map.set(1, 'number key')   // stored as number 1
map.set({}, 'object key')  // object as key!
map.set(function(){}, 'fn key')

// Size
Object.keys(obj).length  // manual
map.size                 // built-in

// Iteration
for (const [key, value] of map) { ... }  // direct iteration

// Performance: Map is better for frequent add/delete operations
// Object is better for small, static data with string keys

// When to use Map:
// - Keys are not strings
// - Need to know the size easily
// - Frequent insertions and deletions
// - Need ordered iteration
```

---

## Q: What is the difference between Set and Array?

```js
// Set — collection of UNIQUE values
const set = new Set([1, 2, 3, 2, 1])  // {1, 2, 3} — duplicates removed

// Common use: Remove duplicates from array
const unique = [...new Set([1, 2, 3, 2, 1])]  // [1, 2, 3]

// Set operations
const setA = new Set([1, 2, 3, 4])
const setB = new Set([3, 4, 5, 6])

// Union
const union = new Set([...setA, ...setB])  // {1,2,3,4,5,6}

// Intersection
const intersection = new Set([...setA].filter(x => setB.has(x)))  // {3,4}

// Difference
const difference = new Set([...setA].filter(x => !setB.has(x)))   // {1,2}

// Has — O(1) lookup vs Array.includes O(n)
set.has(3)  // true — faster than array for large collections
```

---

## Q: What is a WeakMap and WeakSet?

```js
// WeakMap — keys must be objects, keys are weakly held (garbage collected)
const cache = new WeakMap()

function processUser(user) {
  if (cache.has(user)) return cache.get(user)
  const result = heavyProcessing(user)
  cache.set(user, result)
  return result
}

// When 'user' object is garbage collected, entry is automatically removed
// No memory leaks!

// WeakSet — set of objects, weakly held
const visited = new WeakSet()

function visit(node) {
  if (visited.has(node)) return  // already processed
  visited.add(node)
  // process node
}

// KEY DIFFERENCE from Map/Set:
// - Keys/values must be objects
// - Not iterable (no .forEach, no size)
// - Automatically garbage collected — no memory leaks
// - USE CASE: caching, tracking without preventing GC
```

---

# 8. ARRAY & OBJECT METHODS

---

## Q: Explain reduce with complex examples.

```js
const transactions = [
  { type: 'credit', amount: 1000, category: 'salary'  },
  { type: 'debit',  amount: 200,  category: 'food'    },
  { type: 'debit',  amount: 500,  category: 'rent'    },
  { type: 'credit', amount: 500,  category: 'freelance'},
  { type: 'debit',  amount: 100,  category: 'food'    },
]

// 1. Simple sum
const total = transactions.reduce((sum, t) => sum + t.amount, 0)

// 2. Group by category
const byCategory = transactions.reduce((groups, t) => {
  const key = t.category
  if (!groups[key]) groups[key] = []
  groups[key].push(t)
  return groups
}, {})

// 3. Running balance
const balance = transactions.reduce((acc, t) => {
  return t.type === 'credit' ? acc + t.amount : acc - t.amount
}, 0)

// 4. Implement map using reduce
const doubled = [1,2,3].reduce((acc, n) => [...acc, n * 2], [])

// 5. Implement filter using reduce
const evens = [1,2,3,4,5].reduce((acc, n) => n % 2 === 0 ? [...acc, n] : acc, [])

// 6. Flatten nested array
const nested = [[1,2], [3,4], [5,6]]
const flat = nested.reduce((acc, arr) => [...acc, ...arr], [])

// 7. Count occurrences
const words = ['apple', 'banana', 'apple', 'cherry', 'banana', 'apple']
const count = words.reduce((acc, word) => {
  acc[word] = (acc[word] || 0) + 1
  return acc
}, {})
// { apple: 3, banana: 2, cherry: 1 }
```

---

## Q: What is the difference between slice and splice?

```js
const arr = [1, 2, 3, 4, 5]

// slice — returns portion, does NOT mutate
arr.slice(1, 3)   // [2, 3] — from index 1 to 3 (exclusive)
arr.slice(-2)     // [4, 5] — last 2 elements
arr.slice()       // [1,2,3,4,5] — copy of array
console.log(arr)  // [1, 2, 3, 4, 5] — unchanged

// splice — modifies original array, returns removed elements
arr.splice(1, 2)           // removes 2 elements starting at index 1
// returns [2, 3], arr is now [1, 4, 5]

arr.splice(1, 0, 'a', 'b') // insert at index 1 without removing
// returns [], arr is now [1, 'a', 'b', 4, 5]

arr.splice(1, 1, 'x')      // replace element at index 1
// returns ['a'], arr is now [1, 'x', 'b', 4, 5]
```

---

## Q: What is the difference between Object.freeze() and const?

```js
// const — prevents REASSIGNMENT of the variable
const user = { name: 'John', age: 25 }
user.age = 26       // OK — mutating the object
user.city = 'NYC'   // OK — adding property
// user = {}        // ERROR — reassigning the variable

// Object.freeze() — prevents MUTATION of the object
const frozen = Object.freeze({ name: 'John', age: 25 })
frozen.age = 26     // silently fails (strict mode: TypeError)
frozen.city = 'NYC' // silently fails
console.log(frozen) // { name: 'John', age: 25 } — unchanged

// freeze is SHALLOW — nested objects are still mutable
const config = Object.freeze({ db: { host: 'localhost' } })
config.db.host = 'remote'  // WORKS! nested not frozen
config.db = {}             // fails — db itself can't be reassigned

// Deep freeze
function deepFreeze(obj) {
  Object.keys(obj).forEach(key => {
    if (typeof obj[key] === 'object' && obj[key] !== null) {
      deepFreeze(obj[key])
    }
  })
  return Object.freeze(obj)
}
```

---

# 9. THIS KEYWORD

---

## Q: What is 'this' in JavaScript?

`this` refers to the **execution context** — what object is "calling" the function.

```js
// 1. Global context — 'this' is window (browser) or global (Node)
console.log(this)  // window

// 2. Object method — 'this' is the object
const user = {
  name: 'John',
  greet() { console.log(this.name) }  // 'John'
}
user.greet()

// 3. Regular function — 'this' depends on how it's called
function show() { console.log(this) }
show()              // window (global) or undefined (strict mode)
user.show = show
user.show()         // user object

// 4. Arrow function — 'this' is lexically inherited (from definition scope)
const obj = {
  name: 'John',
  greet: () => console.log(this.name)  // 'this' is global, not obj!
}

// 5. Constructor — 'this' is the new instance
function Person(name) { this.name = name }
const john = new Person('John')
john.name  // 'John'

// 6. Class — 'this' is the instance
class Animal {
  constructor(name) { this.name = name }
  speak() { return this.name }
}

// 7. Explicit binding — call, apply, bind
function greet(greeting, punctuation) {
  return `${greeting} ${this.name}${punctuation}`
}

const person = { name: 'John' }
greet.call(person, 'Hello', '!')      // 'Hello John!'  — call: args individually
greet.apply(person, ['Hello', '!'])   // 'Hello John!'  — apply: args as array
const bound = greet.bind(person)      // bind: returns new function permanently bound
bound('Hi', '.')                      // 'Hi John.'
```

---

## Q: What is call, apply, and bind?

```js
function introduce(role, department) {
  return `I'm ${this.name}, ${role} in ${department}`
}

const employee = { name: 'John' }

// call — invoke immediately with 'this' and individual args
introduce.call(employee, 'Developer', 'Engineering')

// apply — invoke immediately with 'this' and args as array
// USE CASE: spread array as arguments
introduce.apply(employee, ['Developer', 'Engineering'])

const args = ['Developer', 'Engineering']
Math.max.apply(null, [1, 2, 3])  // same as Math.max(1, 2, 3)
// Modern way: Math.max(...[1, 2, 3])

// bind — returns new function with 'this' bound, doesn't call
const johnIntroduce = introduce.bind(employee)
johnIntroduce('Developer', 'Engineering')  // call later

// Partial application with bind
const johnDev = introduce.bind(employee, 'Developer')
johnDev('Engineering')  // first arg pre-filled

// REAL USE CASE: React class component methods
class Counter extends React.Component {
  constructor(props) {
    super(props)
    this.handleClick = this.handleClick.bind(this)  // bind 'this'
  }
  handleClick() { this.setState(s => ({ count: s.count + 1 })) }
}
```

---

# 10. MEMORY & PERFORMANCE

---

## Q: What is a memory leak? How do you prevent it?

```js
// Leak 1: Forgotten event listeners
function addHandler() {
  const element = document.getElementById('btn')
  element.addEventListener('click', function() {
    // references element, cannot be garbage collected
  })
}
// FIX: Store and remove the listener
const handler = () => { ... }
element.addEventListener('click', handler)
element.removeEventListener('click', handler) // cleanup

// Leak 2: setInterval not cleared
const timer = setInterval(() => {
  // this runs forever and holds references
}, 1000)
// FIX:
clearInterval(timer)

// Leak 3: Closures holding large data
function createHandler() {
  const largeData = new Array(1000000).fill('data')  // 1M items

  return function() {
    // largeData is referenced, never garbage collected
    console.log(largeData[0])
  }
}

// Leak 4: Detached DOM nodes
let detached
function detach() {
  const tree = document.getElementById('tree')
  detached = tree  // still referenced in JS
  document.body.removeChild(tree)  // removed from DOM but not from memory
}
// FIX: detached = null when done

// Leak 5: Global variables
function leak() {
  leakedVar = 'I am global now'  // forgot 'var/let/const'
}
// Use strict mode to catch this
'use strict'
function noLeak() {
  leakedVar = 'error'  // ReferenceError
}
```

---

## Q: What is debounce and throttle?

```js
// DEBOUNCE — wait until calls stop, then execute ONCE
// USE CASE: search input — don't fire API on every keystroke
function debounce(fn, delay) {
  let timerId

  return function(...args) {
    clearTimeout(timerId)
    timerId = setTimeout(() => {
      fn.apply(this, args)
    }, delay)
  }
}

const searchApi = debounce((query) => {
  fetch(`/api/search?q=${query}`)
}, 300)

input.addEventListener('input', (e) => searchApi(e.target.value))
// API called 300ms after user stops typing


// THROTTLE — execute at most once per interval
// USE CASE: scroll/resize events
function throttle(fn, limit) {
  let lastCall = 0

  return function(...args) {
    const now = Date.now()
    if (now - lastCall >= limit) {
      lastCall = now
      return fn.apply(this, args)
    }
  }
}

const handleScroll = throttle(() => {
  updateScrollPosition()
}, 100)

window.addEventListener('scroll', handleScroll)
// handleScroll executes at most once every 100ms

// KEY DIFFERENCE:
// Debounce: "Only run after things settle" (search, resize-end)
// Throttle: "Run at most N times per second" (scroll, mousemove)
```

---

# 11. CODING ROUND PROBLEMS

---

## Problem 1: Flatten nested array (without flat())

```js
// Input:  [1, [2, [3, [4, [5]]]]]
// Output: [1, 2, 3, 4, 5]

// Solution 1: Recursion
function flatten(arr) {
  return arr.reduce((flat, item) => {
    return flat.concat(Array.isArray(item) ? flatten(item) : item)
  }, [])
}

// Solution 2: Stack (iterative — no stack overflow)
function flattenIterative(arr) {
  const stack = [...arr]
  const result = []

  while (stack.length) {
    const item = stack.pop()
    if (Array.isArray(item)) {
      stack.push(...item)
    } else {
      result.unshift(item)
    }
  }
  return result
}

// Solution 3: toString trick (only for numbers)
[1, [2, [3, [4]]]].toString().split(',').map(Number)

// Test
flatten([1, [2, [3, [4, [5]]]]]) // [1, 2, 3, 4, 5]
```

---

## Problem 2: Implement debounce

```js
function debounce(fn, delay) {
  let timerId = null

  const debounced = function(...args) {
    clearTimeout(timerId)
    timerId = setTimeout(() => {
      fn.apply(this, args)
      timerId = null
    }, delay)
  }

  // Cancel the pending invocation
  debounced.cancel = () => {
    clearTimeout(timerId)
    timerId = null
  }

  return debounced
}

// Test
const log = debounce((msg) => console.log(msg), 300)
log('a')  // cancelled
log('b')  // cancelled
log('c')  // 'c' — after 300ms
```

---

## Problem 3: Deep clone an object

```js
function deepClone(obj) {
  // Handle primitives and null
  if (obj === null || typeof obj !== 'object') return obj

  // Handle Date
  if (obj instanceof Date) return new Date(obj.getTime())

  // Handle Array
  if (Array.isArray(obj)) return obj.map(item => deepClone(item))

  // Handle Object
  const cloned = {}
  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      cloned[key] = deepClone(obj[key])
    }
  }
  return cloned
}

// Modern alternative (handles Map, Set, Date, circular — browser support needed)
const clone = structuredClone(original)
```

---

## Problem 4: Implement Promise.all from scratch

```js
function myPromiseAll(promises) {
  return new Promise((resolve, reject) => {
    if (promises.length === 0) return resolve([])

    const results = new Array(promises.length)
    let resolved  = 0

    promises.forEach((promise, index) => {
      Promise.resolve(promise).then(value => {
        results[index] = value
        resolved++
        if (resolved === promises.length) resolve(results)
      }).catch(reject)  // any rejection fails all
    })
  })
}

// Test
myPromiseAll([
  Promise.resolve(1),
  Promise.resolve(2),
  Promise.resolve(3)
]).then(console.log) // [1, 2, 3]
```

---

## Problem 5: Curry a function

```js
// Currying: transform f(a, b, c) into f(a)(b)(c)
function curry(fn) {
  return function curried(...args) {
    if (args.length >= fn.length) {
      return fn.apply(this, args)
    }
    return function(...moreArgs) {
      return curried.apply(this, args.concat(moreArgs))
    }
  }
}

// Test
const add = curry((a, b, c) => a + b + c)
add(1)(2)(3)    // 6
add(1, 2)(3)    // 6
add(1)(2, 3)    // 6
add(1, 2, 3)    // 6

// Real use: configurable functions
const multiply = curry((factor, number) => factor * number)
const double = multiply(2)
const triple = multiply(3)
double(5)  // 10
triple(5)  // 15
```

---

## Problem 6: Implement memoize

```js
function memoize(fn) {
  const cache = new Map()

  return function(...args) {
    const key = JSON.stringify(args)

    if (cache.has(key)) {
      console.log('cache hit')
      return cache.get(key)
    }

    const result = fn.apply(this, args)
    cache.set(key, result)
    return result
  }
}

// Test
const factorial = memoize(function f(n) {
  return n <= 1 ? 1 : n * f(n - 1)
})

factorial(5)  // calculates: 120
factorial(5)  // cache hit: 120
```

---

## Problem 7: Flatten nested object (dot notation)

```js
// Input:  { a: { b: { c: 1 } }, d: 2 }
// Output: { 'a.b.c': 1, 'd': 2 }

function flattenObject(obj, prefix = '') {
  return Object.keys(obj).reduce((acc, key) => {
    const fullKey = prefix ? `${prefix}.${key}` : key
    const value   = obj[key]

    if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      Object.assign(acc, flattenObject(value, fullKey))
    } else {
      acc[fullKey] = value
    }

    return acc
  }, {})
}

// Test
flattenObject({ a: { b: { c: 1 } }, d: 2 })
// { 'a.b.c': 1, d: 2 }
```

---

## Problem 8: Event emitter implementation

```js
class EventEmitter {
  constructor() {
    this.events = {}
  }

  on(event, listener) {
    if (!this.events[event]) this.events[event] = []
    this.events[event].push(listener)
    return () => this.off(event, listener)  // return unsubscribe
  }

  once(event, listener) {
    const wrapper = (...args) => {
      listener(...args)
      this.off(event, wrapper)
    }
    return this.on(event, wrapper)
  }

  emit(event, ...args) {
    ;(this.events[event] || []).forEach(listener => listener(...args))
  }

  off(event, listener) {
    this.events[event] = (this.events[event] || []).filter(l => l !== listener)
  }
}

// Test
const emitter = new EventEmitter()
const unsub = emitter.on('data', (d) => console.log('received:', d))
emitter.once('connect', () => console.log('connected once'))

emitter.emit('data', { id: 1 })   // 'received: { id: 1 }'
emitter.emit('connect')            // 'connected once'
emitter.emit('connect')            // nothing — 'once' already fired
unsub()
emitter.emit('data', { id: 2 })   // nothing — unsubscribed
```

---

## Problem 9: Implement pipe and compose

```js
// pipe — left to right execution
const pipe = (...fns) => (value) => fns.reduce((acc, fn) => fn(acc), value)

// compose — right to left execution
const compose = (...fns) => (value) => fns.reduceRight((acc, fn) => fn(acc), value)

// Test
const double    = x => x * 2
const addTen    = x => x + 10
const square    = x => x * x

const transform = pipe(double, addTen, square)
transform(3)  // ((3*2)+10)^2 = 256

const transform2 = compose(square, addTen, double)
transform2(3)  // same result, different reading order
```

---

## Problem 10: Group array by key (like lodash groupBy)

```js
function groupBy(arr, key) {
  return arr.reduce((groups, item) => {
    const groupKey = typeof key === 'function' ? key(item) : item[key]
    if (!groups[groupKey]) groups[groupKey] = []
    groups[groupKey].push(item)
    return groups
  }, {})
}

const orders = [
  { id: 1, status: 'pending', city: 'Mumbai' },
  { id: 2, status: 'shipped', city: 'Delhi' },
  { id: 3, status: 'pending', city: 'Delhi' },
]

groupBy(orders, 'status')
// { pending: [{id:1,...}, {id:3,...}], shipped: [{id:2,...}] }

groupBy(orders, order => order.city)
// { Mumbai: [...], Delhi: [...] }
```

---

# 12. OUTPUT-BASED QUESTIONS

---

```js
// Q1: What is the output?
console.log(typeof typeof 1)
// typeof 1 = 'number', typeof 'number' = 'string'
// Answer: 'string'

// Q2: What is the output?
var x = 1
;(function() {
  console.log(x)  // undefined — var x inside IIFE is hoisted
  var x = 2
  console.log(x)  // 2
})()

// Q3: What is the output?
console.log([] + [])  // ''    — [] converts to '', '' + '' = ''
console.log([] + {})  // '[object Object]' — {} converts to '[object Object]'
console.log({} + [])  // '[object Object]' in console, 0 as expression

// Q4: What is the output?
const obj = { a: 1 }
const copy = obj
copy.a = 2
console.log(obj.a)  // 2 — same reference

// Q5: What is the output?
for (var i = 0; i < 3; i++) {
  setTimeout(() => console.log(i), 0)
}
// 3 3 3 — var is shared across iterations

// Q6: What is the output?
const promise = new Promise((resolve) => {
  console.log(1)  // sync — runs immediately
  resolve(2)
  console.log(3)  // sync — runs immediately after resolve
})
promise.then(v => console.log(v))  // async — microtask
console.log(4)  // sync
// Output: 1, 3, 4, 2

// Q7: What is the output?
function foo() {
  return
  {
    name: 'John'
  }
}
console.log(foo())  // undefined — ASI (auto semicolon insertion after return)

// Q8: What is the output?
console.log(0.1 + 0.2 === 0.3)  // false — floating point precision
console.log(0.1 + 0.2)          // 0.30000000000000004
// Fix: Math.abs((0.1 + 0.2) - 0.3) < Number.EPSILON

// Q9: Closure in loop
const funcs = []
for (let i = 0; i < 3; i++) {
  funcs.push(() => i)
}
console.log(funcs[0](), funcs[1](), funcs[2]())  // 0 1 2 — let creates new binding

// Q10: Prototype
function Animal(name) { this.name = name }
Animal.prototype.speak = function() { return this.name }
const dog = new Animal('Rex')
console.log(dog.hasOwnProperty('name'))   // true — own property
console.log(dog.hasOwnProperty('speak'))  // false — on prototype
```

---

# 13. SYSTEM DESIGN QUESTIONS

---

## Q: Design a throttle/rate limiter for API calls

```js
class RateLimiter {
  constructor(maxCalls, windowMs) {
    this.maxCalls  = maxCalls
    this.windowMs  = windowMs
    this.calls     = []
  }

  canMakeCall() {
    const now = Date.now()
    this.calls = this.calls.filter(time => now - time < this.windowMs)

    if (this.calls.length < this.maxCalls) {
      this.calls.push(now)
      return true
    }
    return false
  }

  async execute(fn) {
    if (this.canMakeCall()) {
      return fn()
    }
    throw new Error(`Rate limit exceeded: max ${this.maxCalls} calls per ${this.windowMs}ms`)
  }
}

const limiter = new RateLimiter(5, 1000)  // 5 calls per second
await limiter.execute(() => fetch('/api/data'))
```

---

## Q: Design an LRU Cache

```js
class LRUCache {
  constructor(capacity) {
    this.capacity = capacity
    this.cache    = new Map()  // Map preserves insertion order
  }

  get(key) {
    if (!this.cache.has(key)) return -1

    // Move to end (most recently used)
    const value = this.cache.get(key)
    this.cache.delete(key)
    this.cache.set(key, value)
    return value
  }

  put(key, value) {
    if (this.cache.has(key)) {
      this.cache.delete(key)  // remove old position
    } else if (this.cache.size >= this.capacity) {
      // Remove least recently used (first item in Map)
      this.cache.delete(this.cache.keys().next().value)
    }
    this.cache.set(key, value)
  }
}

const cache = new LRUCache(3)
cache.put(1, 'one')
cache.put(2, 'two')
cache.put(3, 'three')
cache.get(1)          // 'one' — moves 1 to most recent
cache.put(4, 'four')  // removes 2 (LRU), adds 4
cache.get(2)          // -1 — evicted
```

---

## QUICK REFERENCE — Common Interview Topics by Level

### Junior Level
- var/let/const, hoisting
- == vs ===, type coercion
- Arrow functions, template literals
- Array methods: map, filter, reduce
- Basic async/await
- DOM manipulation

### Mid Level
- Closures and practical uses
- Prototype chain
- Event loop (microtask vs macrotask)
- this keyword and binding
- Promise combinators
- Debounce/throttle implementation
- ES6+ features thoroughly

### Senior Level
- Memory management and leaks
- Generator functions
- WeakMap/WeakSet use cases
- Design patterns (Observer, Singleton, Factory)
- Performance optimization
- Implement Promise.all, curry, pipe from scratch
- LRU cache, rate limiter

---

*JS Interview Notes — All levels covered*
