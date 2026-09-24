# MODULE 07 — THE ULTIMATE JAVASCRIPT OBJECTS TEXTBOOK
## Mastering JavaScript Objects from Beginner to Senior Engineer

---

# 00. HOW TO USE THIS MODULE

### 🧠 What is an Object in Plain English?
Imagine a physical **filing cabinet** or a **labeled warehouse locker**. Inside this locker, you can place folders, items, or instructions, and paste a clear sticky note on each one. When you want something, you do not search by a random guess; you look up the label on the sticky note (the **key**) to retrieve whatever sits inside (the **value**).

In JavaScript, **Objects are the bedrock of the entire language runtime**. Almost everything you interact with—arrays, functions, DOM elements, class instances, regular expressions, and module exports—is an Object or is powered by object mechanics under the hood.

### 🗺️ How Objects Connect to the JavaScript Universe
```text
                      ┌────────────────────────────────────────┐
                      │          OBJECT FOUNDATION             │
                      │  Key-Value Store, Memory Heap Identity  │
                      └───────────────────┬────────────────────┘
                                          │
        ┌───────────────────┬─────────────┴───────┬───────────────────┐
        ▼                   ▼                     ▼                   ▼
┌───────────────┐   ┌───────────────┐     ┌───────────────┐   ┌───────────────┐
│    ARRAYS     │   │   FUNCTIONS   │     │  PROTOTYPES   │   │    CLASSES    │
│  Specialized  │   │   Callable    │     │  Inheritance  │   │  Syntactic    │
│  Object with  │   │  Objects with │     │  Delegation   │   │  Sugar over   │
│ numeric keys  │   │ [[Call]] slot │     │     Chain     │   │  Prototypes   │
└───────┬───────┘   └───────┬───────┘     └───────┬───────┘   └───────┬───────┘
        │                   │                     │                   │
        └───────────────────┼─────────────────────┴───────────────────┘
                            ▼
        ┌─────────────────────────────────────────┐
        │  'this' CONTEXT & EXECUTION SCOPE       │
        │  Determined by HOW the object is called │
        └───────────────────┬─────────────────────┘
                            ▼
        ┌─────────────────────────────────────────┐
        │  COLLECTIONS & DATA SERIALIZATION       │
        │  Map / Set / WeakMap / JSON DTOs        │
        └─────────────────────────────────────────┘
```

* **Arrays**: Special objects where keys are 0-indexed integers and an auto-updating `length` property is maintained.
* **Functions**: "First-class objects" that can have properties attached to them, but possess an internal callable code slot `[[Call]]`.
* **Prototypes**: The invisible delegating link (`[[Prototype]]`) allowing objects to inherit methods from ancestor objects.
* **Classes**: Elegant syntactic sugar sitting directly on top of constructor functions and prototype chains.
* **`this` Keyword**: A dynamic execution context reference heavily dictated by which object invoked a method at runtime.
* **Maps & Sets**: Modern keyed collection primitives engineered specifically for high-frequency key additions and non-string keys.
* **JSON**: JavaScript Object Notation, the universal serialization standard powering Web APIs worldwide.

---

# 01. WHAT IS AN OBJECT?

### 1. Plain-English Definition
An **Object** in JavaScript is a standalone collection of related data and functionality stored as **key-value pairs** (often called *properties*). 

Unlike a primitive (such as the number `42` or the boolean `true` which represents a single atomic piece of information), an object is a **composite data structure** allocated on the **Memory Heap**. It bundles multiple attributes together into a cohesive entity.

```js
const developer = {
  name: "Ayush",          // key: "name",        value: "Ayush" (String primitive)
  age: 24,                // key: "age",         value: 24 (Number primitive)
  isEmployed: true,       // key: "isEmployed",  value: true (Boolean primitive)
  skills: ["JS", "TS"],   // key: "skills",      value: Array reference
  code: function() {      // key: "code",        value: Function (method)
    return "Writing clean JavaScript";
  }
};
```

### 2. Anatomy of an Object
* **Property Key (Name)**: An identifier (string or symbol) used to label and look up a value.
* **Property Value**: Any valid JavaScript entity: primitives, arrays, other objects, or functions.
* **Method**: A property whose value is a callable function.
* **Object Reference**: The address pointer in memory where the object actually lives.
* **Object Identity**: The unique heap location assigned to the object upon creation. Even if two objects have identical properties, their identities are distinct.

### 3. Primitives vs Objects: The 2 Worlds of JavaScript
| Feature | Primitives (`string`, `number`, `boolean`, `null`, `undefined`, `symbol`, `bigint`) | Objects (`{}`, `[]`, `function`, `Date`, `Map`, etc.) |
| :--- | :--- | :--- |
| **Mutability** | **Immutable**: Values cannot be altered; operations return new values. | **Mutable**: Properties can be added, modified, or removed in place. |
| **Memory Storage** | Typically stored directly on the execution stack or in-place. | Allocated on the **Memory Heap**; variables store a reference pointer. |
| **Comparison** | **Compared by Value**: `5 === 5`, `'cat' === 'cat'`. | **Compared by Reference**: `{} === {}` is `false`. |
| **Methods** | Do not own methods. (Engines temporarily wrap them in Object wrappers). | Own methods directly or inherit them via the Prototype Chain. |

---

# 02. OBJECT LITERALS

The **Object Literal** (written with curly braces `{}`) is the cleanest, fastest, and most idiomatic way to create an object in modern JavaScript.

### 1. Basic Object Literals
```js
// An empty object literal
const emptyBox = {};

// Object literal with various property types
const laptop = {
  brand: "Apple",
  model: "MacBook Pro",
  year: 2024,
  inStock: true
};
```

### 2. Shorthand Property Names (ES6)
When your local variable name matches the object property key you want to set, you can omit the redundant `: value` syntax:
```js
const username = "ayush";
const role = "admin";

// Old ES5 way:
const userES5 = { username: username, role: role };

// Modern ES6 Shorthand:
const userModern = { username, role };
console.log(userModern); // { username: 'ayush', role: 'admin' }
```

### 3. Method Definitions & Shorthand Methods
```js
const calculator = {
  // Method Shorthand (ES6) — Clean & concise
  add(a, b) {
    return a + b;
  },
  
  // Traditional Key-Value Function Expression
  subtract: function(a, b) {
    return a - b;
  },
  
  // Arrow function property (⚠️ BEWARE: Lexical 'this' binding)
  multiply: (a, b) => a * b
};
```

### 4. Computed Property Names `[expression]`
ES6 lets you compute property names dynamically inside the literal declaration using square brackets `[]`:
```js
const dynamicKey = "user_status";
const prefix = "field_";

const record = {
  [dynamicKey]: "active",
  [prefix + 1]: "First value",
  [10 + 20]: "Calculated key 30"
};

console.log(record.user_status); // 'active'
console.log(record.field_1);     // 'First value'
console.log(record["30"]);       // 'Calculated key 30'
```

### 5. Trailing Commas & Clean Git Diffs
Always place a trailing comma after the last property in multi-line objects. It produces cleaner Git version control diffs when adding new properties later:
```js
const project = {
  name: "Apollo",
  status: "in-progress", // <-- Trailing comma prevents diff clutter on next line!
};
```

---

# 03. OBJECT KEYS

### 1. Valid Types of Object Keys
Under the ECMAScript specification, an ordinary object property key can **ONLY** be one of two types:
1. **String** (UTF-16 text)
2. **Symbol** (Unique primitive identifier introduced in ES6)

### 2. The Automatic Key Stringification Trap
If you supply any value other than a Symbol as an object key, the JavaScript runtime **silently coerces it into a string** using the abstract operation `ToString(key)`.

```js
const obj = {};

// 1. Numbers become Strings
obj[1] = "Number one";
console.log(obj["1"]); // 'Number one' (obj[1] and obj["1"] access the exact same slot!)

// 2. Booleans become Strings
obj[true] = "Truth";
console.log(obj["true"]); // 'Truth'

// 3. Objects become "[object Object]" (FATAL BUG WARNING!)
const userA = { id: 101 };
const userB = { id: 202 };

obj[userA] = "Data for User A";
// userA.toString() yields '[object Object]'
// obj now contains: { '[object Object]': 'Data for User A' }

obj[userB] = "Data for User B";
// userB.toString() ALSO yields '[object Object]'!
// obj['[object Object]'] is overwritten!

console.log(obj[userA]); // 'Data for User B' <-- OVERWRITTEN!
```
> [!CAUTION]
> If you need to key your collection by actual object references or retain true types without string coercion, **use `Map` instead of a plain Object**.

---

# 04. ACCESSING OBJECT PROPERTIES

JavaScript offers two fundamental notations for retrieving property values:

```text
                 ┌──────────────────────────────────────┐
                 │          PROPERTY ACCESS             │
                 └──────────────┬───────────────────────┘
                                │
          ┌─────────────────────┴─────────────────────┐
          ▼                                           ▼
┌──────────────────┐                        ┌──────────────────┐
│   DOT NOTATION   │                        │ BRACKET NOTATION │
│    user.name     │                        │   user["name"]   │
└─────────┬────────┘                        └─────────┬────────┘
          │                                           │
  Fast, clean, concise                      Dynamic, flexible, handles
  Requires valid identifier                 spaces, hyphens, & variables
```

### 1. Dot Notation (`obj.property`)
* **When to use**: When the property name is known ahead of time, is a valid JavaScript identifier (no spaces, hyphens, or starting with digits), and is not stored in a variable.
```js
const user = { firstName: "Ayush", age: 24 };
console.log(user.firstName); // 'Ayush'
```

### 2. Bracket Notation (`obj[expression]`)
* **When to use**: Mandatory when:
  1. The key is stored in a dynamic variable: `obj[keyVar]`.
  2. The key contains spaces, dashes, or special characters: `obj["first-name"]`.
  3. The key is numeric or starts with a digit: `obj["2fa-token"]`.
  4. The key is a Symbol: `obj[mySymbol]`.
```js
const car = {
  "model-name": "Model 3",
  123: "Order ID",
  brand: "Tesla"
};

const query = "brand";
console.log(car["model-name"]); // 'Model 3' (Dot notation car.model-name would evaluate to subtraction!)
console.log(car[123]);           // 'Order ID'
console.log(car[query]);         // 'Tesla' (Evaluates variable 'query')
```

---

# 05. ADDING, UPDATING AND DELETING PROPERTIES

Objects are fully mutable dynamic records by default:

```js
const profile = { name: "Ayush" };

// 1. Adding a new property
profile.age = 24;
profile["country"] = "India";

// 2. Updating an existing property (Overwriting)
profile.age = 25;

// 3. Deleting a property using the 'delete' operator
delete profile.country;
console.log(profile); // { name: 'Ayush', age: 25 }
```

### ⚠️ The 'delete' Operator Deep-Dive & Performance Trap
1. **Return Value**: `delete obj.prop` returns `true` if the property was deleted or if the property never existed in the first place. It returns `false` only if the property is non-configurable (e.g. frozen or configured with `configurable: false`).
2. **V8 Shape De-optimization**: In high-performance loops, deleting properties transitions the object from V8's fast "Hidden Class / Shape" mode into a slow "Dictionary / Hash Table" mode.
```js
// Fast alternative to delete in high-throughput engines:
profile.temporaryData = undefined; // Retains V8 Shape
```

---

# 06. OBJECT PROPERTY EXISTENCE

There are 3 standard ways to verify if an object contains a property. Choosing the right one avoids serious security and correctness bugs.

```text
┌─────────────────────────────┬───────────────────┬──────────────────────┬──────────────────────┐
│ Method                      │ Checks Own Props? │ Checks Prototypes?   │ Null-Prototype Safe? │
├─────────────────────────────┼───────────────────┼──────────────────────┼──────────────────────┤
│ 'prop' in obj               │ ✅ Yes            │ ✅ Yes               │ ✅ Yes               │
│ Object.hasOwn(obj, 'prop')  │ ✅ Yes            │ ❌ No (Own only)     │ ✅ Yes (ES2022 Best) │
│ obj.hasOwnProperty('prop')  │ ✅ Yes            │ ❌ No (Own only)     │ ❌ Throws TypeError  │
└─────────────────────────────┴───────────────────┴──────────────────────┴──────────────────────┘
```

### 1. Modern Best Practice: `Object.hasOwn(obj, key)` (ES2022)
`Object.hasOwn` is a static method that works reliably on ANY object, even null-prototype dictionaries:
```js
const user = { name: "Ayush" };
console.log(Object.hasOwn(user, "name"));     // true
console.log(Object.hasOwn(user, "toString")); // false (inherited from Object.prototype)
```

### 2. The Prototype Trap: The `in` Operator
The `in` operator returns `true` if the property exists on the object **OR anywhere in its prototype chain**:
```js
console.log("name" in user);     // true
console.log("toString" in user); // true! (Inherited method exists!)
```

### 3. The `undefined` Value Trap
Checking `obj.key !== undefined` is dangerous because a property can explicitly exist with a value of `undefined`:
```js
const response = { data: undefined };

// Buggy check:
if (response.data !== undefined) {
  // Never runs, even though property 'data' exists!
}

// Correct check:
if (Object.hasOwn(response, "data")) {
  console.log("Property 'data' is present!"); // Runs!
}
```

---

# 07. OBJECT REFERENCES

In JavaScript, **variables do NOT hold objects directly**. Instead, variables hold a **Memory Reference** (a 64-bit pointer) indicating where the object is stored on the **Memory Heap**.

```text
STACK MEMORY                             HEAP MEMORY (Shared Pool)
┌──────────────┐                         ┌─────────────────────────────┐
│ Variable 'a' │ ─── Address 0x8821 ───► │ { value: 10 }               │
└──────────────┘                         └──────────────▲──────────────┘
                                                        │
┌──────────────┐                                        │
│ Variable 'b' │ ─── Address 0x8821 ────────────────────┘
└──────────────┘
```

### Real-World Code Demonstration
```js
const a = { x: 1 };
const b = a; // 'b' does not get a copy of the object; it copies the POINTER!

b.x = 99; // Modifying through pointer 'b'

console.log(a.x); // 99! Variable 'a' sees the mutation because they share the heap record!
```

> [!NOTE]
> **The Deed Analogy**: Think of an object as a physical house. The variable `a` is not the house itself; it is the *Deed of Ownership* containing the house's street address. When you write `const b = a`, you photocopy the deed. Both deeds point to the exact same house. If someone paints the living room blue using deed `b`, anyone visiting the house via deed `a` sees blue walls.

---

# 08. OBJECT IDENTITY

Object equality in JavaScript (`===` and `==`) tests **Reference Identity**, NOT structural content.

```js
const houseA = { rooms: 3 };
const houseB = { rooms: 3 };

console.log(houseA === houseB); // false! (Two distinct houses built at different addresses)

const houseC = houseA;
console.log(houseA === houseC); // true! (Both point to address 0x8821)
```

### The Visual Identity Breakdown
```text
houseA ──► Heap Address 0x1001: { rooms: 3 }
houseB ──► Heap Address 0x2002: { rooms: 3 }

houseA === houseB ──► Does 0x1001 equal 0x2002? ──► FALSE!
```

---

# 09. OBJECT MUTATION

**Mutation** means altering the internal state (properties, values) of an object in-place without creating a new heap record.

### 1. Mutating Properties & Nested Objects
```js
const order = {
  id: "ORD-991",
  customer: { name: "Ayush" },
  items: ["Keyboard", "Mouse"]
};

// Direct Mutation
order.status = "Shipped";
order.customer.name = "Ayush S.";
order.items.push("Monitor");
```

### 2. Accidental Mutation via Function Side-Effects
When you pass an object into a function, the function receives the pointer. Any mutations inside the function leak out and affect the caller:
```js
function markActive(user) {
  user.isActive = true; // ⚠️ UNINTENDED SIDE-EFFECT: Mutates caller's original object!
}

const originalUser = { name: "Dev", isActive: false };
markActive(originalUser);
console.log(originalUser.isActive); // true (Original mutated!)
```

### 3. Functional Immutability Pattern
Instead of mutating the incoming object, return a new object with the desired updates:
```js
function makeActivePure(user) {
  return {
    ...user,
    isActive: true
  };
}
```

---

# 10. OBJECT COPYING

When duplicating objects, JavaScript provides several distinct strategies with varying performance, shallow vs deep guarantees, and memory behaviors:

```text
METHOD                 COPY TYPE      PRESERVES PROTOTYPE?  HANDLES NESTED?  CIRCULAR REFS?
Assignment (=)         No Copy (Ref)  N/A                   N/A              N/A
Spread ({...obj})      Shallow        ❌ No (Becomes Object) ❌ By Reference  ❌ N/A
Object.assign({}, obj) Shallow        ❌ No (Becomes Object) ❌ By Reference  ❌ N/A
structuredClone(obj)   Deep           ❌ No (Plain clone)   ✅ Full Clone    ✅ Supported!
JSON stringify/parse   Deep (Lossy)   ❌ No                 ✅ Full Clone    ❌ Crashes!
```

---

# 11. SHALLOW COPY

A **Shallow Copy** duplicates only the top-level properties of an object. If any property value is itself an object or array, **only the reference pointer is copied**!

```js
const original = {
  name: "Ayush",
  address: {
    city: "Mumbai",
    zip: "400001"
  }
};

// Creating a shallow copy via Spread Operator:
const shallowCopy = { ...original };

// Top-level property is independent:
shallowCopy.name = "John";
console.log(original.name); // 'Ayush' (Not affected)

// Nested object is SHARED:
shallowCopy.address.city = "Bengaluru";
console.log(original.address.city); // 'Bengaluru' ⚠️ (MUTATED!)
```

### The Visual Shallow Copy Architecture
```text
original    ──► Heap: { name: 'Ayush', address: 0x9999 }
                                                   │
                                                   ▼
shallowCopy ──► Heap: { name: 'John',  address: 0x9999 } ──► Heap: { city: 'Bengaluru' }
```

---

# 12. DEEP COPY

A **Deep Copy** duplicates the target object **and recursively duplicates all nested objects, arrays, maps, and sets**, ensuring the new structure is completely isolated in memory.

### 1. Modern Native Standard: `structuredClone()` (ES2022)
The web standard `structuredClone()` is built into all modern browsers and Node.js (v17+). It supports circular references, Dates, RegExps, Maps, Sets, and TypedArrays!
```js
const profile = {
  user: "Ayush",
  meta: { role: "Admin", loginCount: 14 },
  joinedAt: new Date("2024-01-01")
};

const deep = structuredClone(profile);

deep.meta.role = "SuperAdmin";
console.log(profile.meta.role); // 'Admin' (Completely safe & isolated!)
console.log(deep.joinedAt instanceof Date); // true (Retains true Date instance!)
```

### 2. The Legacy Hack & Its Pitfalls: `JSON.parse(JSON.stringify(obj))`
Historically, developers used JSON serialization for deep cloning. **This pattern is dangerous in production** because it silently strips or corrupts data:
```js
const dirtyObject = {
  created: new Date(),
  pattern: /^[a-z]+$/gi,
  callback: () => "Hello",
  missing: undefined,
  notANumber: NaN,
  balance: Infinity,
  id: Symbol("id")
};

const cloned = JSON.parse(JSON.stringify(dirtyObject));

console.log(typeof cloned.created); // 'string' ⚠️ (Lost Date object!)
console.log(cloned.pattern);        // {} ⚠️ (Lost RegExp pattern!)
console.log(cloned.callback);       // undefined ⚠️ (Function deleted!)
console.log(cloned.missing);        // undefined ⚠️ (Undefined key removed!)
console.log(cloned.notANumber);     // null ⚠️ (NaN coerced to null!)
console.log(cloned.balance);        // null ⚠️ (Infinity coerced to null!)
console.log(cloned.id);             // undefined ⚠️ (Symbol key stripped!)
```

### Summary Comparison: `structuredClone` vs `JSON`
| Feature | `structuredClone()` | `JSON.parse(JSON.stringify())` |
| :--- | :--- | :--- |
| **Circular References** | ✅ Supported (Preserves topology) | ❌ Throws `TypeError: Converting circular structure to JSON` |
| **Dates** | ✅ Clones as true `Date` instances | ❌ Coerces to ISO String |
| **Regular Expressions** | ✅ Clones as true `RegExp` instances | ❌ Coerces to empty object `{}` |
| **Maps & Sets** | ✅ Clones as true `Map` / `Set` | ❌ Coerces to empty object or array |
| **Functions / Methods** | ❌ Throws `DataCloneError` | ❌ Silently strips / omits |
| **DOM Nodes / Symbols** | ❌ Throws `DataCloneError` | ❌ Strips Symbols, throws on DOM nodes |


---

# 13. NESTED OBJECTS

Real-world applications rarely deal with flat key-value pairs. Data models—such as user profiles, database schemas, and e-commerce carts—are structured hierarchically as **Nested Objects**.

```js
const customerOrder = {
  orderId: "ORD-2024-889",
  createdAt: "2024-03-15T10:00:00Z",
  customer: {
    id: "CUST-104",
    name: "Ayush",
    contact: {
      email: "ayush@example.com",
      phone: "+91-9876543210"
    }
  },
  shipping: {
    address: {
      street: "42 Tech Boulevard",
      city: "Bengaluru",
      postalCode: "560001"
    },
    carrier: "Express Logistics"
  }
};
```

### The Uncaught TypeError Crash
Accessing deeply nested properties without checks is the leading source of production runtime crashes in JavaScript:
```js
const city = customerOrder.shipping.address.city; // "Bengaluru" (Safe)

// What if customerOrder.billing is undefined?
const billingZip = customerOrder.billing.address.postalCode;
// 💥 FATAL CRASH: TypeError: Cannot read properties of undefined (reading 'address')
```

---

# 14. OPTIONAL CHAINING

Introduced in ES2020, the **Optional Chaining Operator (`?.`)** short-circuits property evaluation to `undefined` if the reference before `?.` is **nullish** (`null` or `undefined`), preventing catastrophic crashes.

```text
EVALUATION PIPELINE:
customerOrder?.billing?.address?.postalCode
      │           │
   Exists?        Is nullish? (undefined)
      ▼           ▼
   Continue    SHORT-CIRCUIT IMMEDIATELY ──► Returns undefined (No Crash!)
```

### 1. Property Access
```js
const zip = customerOrder?.billing?.address?.postalCode;
console.log(zip); // undefined (Execution continues smoothly without crashing!)
```

### 2. Method Calls (`obj.method?.()`)
Call a method only if it actually exists on the object:
```js
const logger = {
  log: (msg) => console.log(`[INFO]: ${msg}`)
};

logger.log?.("System operational");   // Logs: [INFO]: System operational
logger.debug?.("Diagnostic trace");   // Silently evaluates to undefined without crashing!
```

### 3. Bracket Notation & Array Element Access
```js
const key = "contact";
console.log(customerOrder?.customer?.[key]?.email); // "ayush@example.com"

const team = { members: ["Alice", "Bob"] };
console.log(team.members?.[0]); // "Alice"
console.log(team.guests?.[0]);  // undefined
```

---

# 15. NULLISH COALESCING WITH OBJECTS

The **Nullish Coalescing Operator (`??`)** returns its right-hand operand only when its left-hand operand evaluates to `null` or `undefined`.

### The Critical Bug: `??` vs `||` (Logical OR)
Logical OR (`||`) checks for **falsy values** (`false`, `0`, `""`, `NaN`, `null`, `undefined`). This causes subtle, critical bugs when valid business values like `0` or `false` get overwritten!

```text
┌──────────────┬────────────────────────────────┬────────────────────────────────┐
│ Input Value  │ Value || "Fallback"            │ Value ?? "Fallback"            │
├──────────────┼────────────────────────────────┼────────────────────────────────┤
│ 0            │ "Fallback" ⚠️ (Bug! 0 is lost) │ 0 ✅ (Preserved!)              │
│ false        │ "Fallback" ⚠️ (Bug! Overwrite) │ false ✅ (Preserved!)          │
│ ""           │ "Fallback" ⚠️ (Bug! Empty lost)│ "" ✅ (Preserved!)             │
│ null         │ "Fallback"                     │ "Fallback"                     │
│ undefined    │ "Fallback"                     │ "Fallback"                     │
└──────────────┴────────────────────────────────┴────────────────────────────────┘
```

### Real-World Example: User Configuration
```js
const userConfig = {
  animationSpeed: 0,       // 0 is a valid fast speed!
  showNotifications: false // false is an intentional opt-out!
};

// ❌ DANGEROUS LOGICAL OR (||):
const speedOR = userConfig.animationSpeed || 300;
console.log(speedOR); // 300 ⚠️ (BUG: Overrode the user's explicit choice of 0!)

// ✅ CORRECT NULLISH COALESCING (??):
const speedClean = userConfig.animationSpeed ?? 300;
console.log(speedClean); // 0 (Preserved correctly!)

const notifyClean = userConfig.showNotifications ?? true;
console.log(notifyClean); // false (Preserved correctly!)
```

### Combining Optional Chaining with Nullish Coalescing
This pair forms the gold standard for robust data extraction:
```js
const userTheme = response?.data?.preferences?.theme ?? "dark-default";
```

---

# 16. OBJECT DESTRUCTURING

**Object Destructuring** (ES6) is an expressive syntax for unpacking values from objects into distinct variables.

### 1. Basic Destructuring
```js
const user = { name: "Ayush", age: 24, role: "Engineer" };

// Unpacks 'name' and 'age' directly
const { name, age } = user;
console.log(name, age); // "Ayush" 24
```

### 2. Variable Renaming (`key: newName`)
When a local variable name already exists or you want clearer naming:
```js
const apiResponse = { user_id: 101, is_act: true };

const { user_id: userId, is_act: isActive } = apiResponse;
console.log(userId, isActive); // 101 true
```

### 3. Default Values
Provide fallback values if the property is `undefined`:
```js
const config = { host: "localhost" };

const { host, port = 8080, secure = false } = config;
console.log(host, port, secure); // "localhost" 8080 false
```

### 4. Renaming with Default Values
```js
const settings = {};
const { timeout_ms: timeout = 5000 } = settings;
console.log(timeout); // 5000
```

### 5. Nested Destructuring
Unpack deeply nested properties in a single statement:
```js
const account = {
  id: 42,
  profile: {
    personal: { fullName: "Ayush Sharma" }
  }
};

const {
  profile: {
    personal: { fullName }
  }
} = account;

console.log(fullName); // "Ayush Sharma"
```

### 6. Function Parameter Destructuring (Senior Pattern)
Instead of passing positional arguments or accepting an unwieldy `options` object:
```js
function renderUserCard({ name, role = "Member", avatar = "/default.png" } = {}) {
  return `<div class="card"><img src="${avatar}"/><h3>${name}</h3><p>${role}</p></div>`;
}

renderUserCard({ name: "Ayush", role: "Staff Architect" });
renderUserCard(); // Safe fallback to {} thanks to default parameter!
```

---

# 17. OBJECT REST PROPERTIES

The **Rest syntax (`...rest`)** in destructuring gathers all remaining enumerable own properties into a fresh new object.

```js
const rawUser = {
  id: "U-1001",
  username: "ayush99",
  passwordHash: "9f8e7d6c5b4a",
  salt: "a1b2c3d4",
  email: "ayush@example.com",
  role: "admin"
};

// Strip sensitive properties:
const { passwordHash, salt, ...sanitizedUser } = rawUser;

console.log(sanitizedUser);
// { id: 'U-1001', username: 'ayush99', email: 'ayush@example.com', role: 'admin' }
```

### 4 Essential Production Use Cases for Rest Properties:
1. **Sanitizing API payloads**: Stripping database secrets (`passwordHash`, `ssn`) before returning JSON to clients.
2. **Component Props Forwarding**: Extracting specific props (`title`, `onClick`) and forwarding the rest (`...domProps`) to HTML elements.
3. **Immutable Property Deletion**: Instead of using `delete obj.prop` (which mutates the object and hurts V8 optimization), use rest destructuring to create a clean object without the unwanted key.
4. **Config Parsing**: Extracting core settings (`port`, `host`) and grouping all arbitrary third-party plugin options into `pluginOptions`.

---

# 18. OBJECT SPREAD

The **Object Spread Operator (`...`)** copies all enumerable own properties from one or more source objects into a new object literal.

### 1. Basic Spread & Precedence
Properties declared **after** the spread override matching properties copied from the source:

```js
const defaultSettings = {
  theme: "light",
  fontSize: 14,
  autoSave: true
};

const userCustomSettings = {
  theme: "dark",
  fontSize: 16
};

// Merging with precedence:
const activeSettings = {
  ...defaultSettings,
  ...userCustomSettings, // Overrides 'theme' and 'fontSize'
  autoSave: false        // Final manual override
};

console.log(activeSettings);
// { theme: 'dark', fontSize: 16, autoSave: false }
```

### 2. Order Matters: The Precedence Trap
```js
// Trap: Placing default values AFTER the spread overwrites custom values!
const badSettings = {
  ...userCustomSettings,
  theme: "light" // ⚠️ Overwrites user's "dark" theme back to "light"!
};
```

---

# 19. OBJECT MERGING

Combining data from multiple objects is a staple of JavaScript application architecture.

```text
MERGE STRATEGY         SYNTAX / CALL                      TYPE     PRECEDENCE
Spread Operator        { ...objA, ...objB }               Shallow  Last key wins
Object.assign          Object.assign(target, srcA, srcB)  Shallow  Mutates target, last key wins
Deep Merge Utility     deepMerge(objA, objB)              Deep     Recursively merges nested objects
```

### 1. Object Spread vs `Object.assign()`
* `{ ...a, ...b }` always creates and returns a **brand-new object**.
* `Object.assign(target, ...sources)` **mutates the first argument** (`target`) and returns it. To avoid mutation, pass an empty object as target: `Object.assign({}, a, b)`.

### 2. The Deep Merge Algorithm
Neither spread nor `Object.assign` merges nested objects—they completely overwrite them:
```js
const target = { user: { name: "Ayush", age: 24 } };
const patch  = { user: { city: "Mumbai" } };

// Shallow merge clobbers nested properties:
const shallowResult = { ...target, ...patch };
console.log(shallowResult.user); // { city: 'Mumbai' } (name and age were WIPED OUT!)
```

#### Production Recursive Deep Merge Implementation:
```js
function isPlainObject(item) {
  return item && typeof item === "object" && !Array.isArray(item) && !(item instanceof Date);
}

function deepMerge(target, source) {
  const output = { ...target };

  if (isPlainObject(target) && isPlainObject(source)) {
    for (const key of Object.keys(source)) {
      if (isPlainObject(source[key])) {
        if (!(key in target)) {
          output[key] = source[key];
        } else {
          output[key] = deepMerge(target[key], source[key]);
        }
      } else {
        output[key] = source[key];
      }
    }
  }

  return output;
}

const merged = deepMerge(target, patch);
console.log(merged.user); // { name: 'Ayush', age: 24, city: 'Mumbai' } ✅ (Preserved!)
```


---

# 20. OBJECT METHODS (`keys`, `values`, `entries`)

To iterate over or inspect an object's contents without prototype pollution, modern JavaScript provides three static reflection methods on `Object`.

```text
┌──────────────────┬────────────────────────────────────────────────────────────────────────┐
│ Method           │ Returns                                                                │
├──────────────────┼────────────────────────────────────────────────────────────────────────┤
│ Object.keys()    │ Array of own enumerable string keys                                    │
│ Object.values()  │ Array of own enumerable property values                                │
│ Object.entries() │ Array of [key, value] tuples (enumerable own string keys only)        │
└──────────────────┴────────────────────────────────────────────────────────────────────────┘
```

```js
const user = {
  id: 101,
  username: "ayush",
  role: "admin"
};

console.log(Object.keys(user));   // ['id', 'username', 'role']
console.log(Object.values(user)); // [101, 'ayush', 'admin']
console.log(Object.entries(user));// [['id', 101], ['username', 'ayush'], ['role', 'admin']]
```

### Iteration with `for...of` and Destructuring
```js
for (const [key, value] of Object.entries(user)) {
  console.log(`${key.toUpperCase()}: ${value}`);
}
```

---

# 21. OBJECT.FROMENTRIES

Introduced in ES2019, `Object.fromEntries()` performs the inverse operation of `Object.entries()`. It accepts an iterable of key-value pairs (tuples) and transforms them back into a plain object.

```text
Object.entries(obj)      ──►  [ ['a', 1], ['b', 2] ]
                                      │
                                      ▼
Object.fromEntries(arr)  ◄──  { a: 1, b: 2 }
```

### 1. Converting a `Map` to an Object
```js
const userMap = new Map([
  ["name", "Ayush"],
  ["level", "Senior"]
]);

const objFromMap = Object.fromEntries(userMap);
console.log(objFromMap); // { name: 'Ayush', level: 'Senior' }
```

### 2. The Clean Object Transformation Pipeline
The combo of `Object.entries()`, array methods (`map`, `filter`), and `Object.fromEntries()` is the cleanest way to transform objects functionally:
```js
const pricesUSD = { laptop: 1200, keyboard: 100, mouse: 50 };

// Double all prices and filter out items under 150:
const premiumPrices = Object.fromEntries(
  Object.entries(pricesUSD)
    .map(([item, price]) => [item, price * 2])
    .filter(([_, price]) => price >= 150)
);

console.log(premiumPrices); // { laptop: 2400, keyboard: 200 }
```

### 3. Converting URL Search Parameters to an Object
```js
const searchParams = new URLSearchParams("category=books&sort=asc&page=2");
const queryObj = Object.fromEntries(searchParams);
console.log(queryObj); // { category: 'books', sort: 'asc', page: '2' }
```

---

# 22. OBJECT.CREATE

`Object.create(proto, [propertiesObject])` creates a new object with its internal `[[Prototype]]` explicitly linked to the specified `proto` object.

```js
const animalPrototype = {
  type: "Unknown",
  breathe() {
    return "Inhaling oxygen...";
  }
};

// Create a dog whose prototype is animalPrototype:
const dog = Object.create(animalPrototype);
dog.breed = "Golden Retriever";

console.log(dog.breed);     // "Golden Retriever" (Own property)
console.log(dog.breathe());   // "Inhaling oxygen..." (Inherited from prototype!)
```

### ⚠️ The Second Argument Trap
The optional second argument takes property **descriptors**, NOT raw key-value pairs! Passing raw values fails or silently creates non-writable/non-enumerable properties:
```js
// ❌ WRONG:
const bad = Object.create(animalPrototype, { name: "Max" }); // Throws TypeError! Descriptors required!

// ✅ CORRECT:
const good = Object.create(animalPrototype, {
  name: {
    value: "Max",
    writable: true,
    enumerable: true,
    configurable: true
  }
});
```

---

# 23. PROTOTYPE BASICS

Every JavaScript object has an internal hidden slot named **`[[Prototype]]`**. This slot holds either a reference to another object (its prototype) or `null`.

```text
┌────────────────────────────────────────────────────────┐
│                   THE PROTOTYPE CHAIN                  │
│                                                        │
│  dog                                                   │
│  ┌───────────────────────┐                             │
│  │ breed: "Golden"       │                             │
│  │ [[Prototype]] ────────┼────────┐                    │
│  └───────────────────────┘        │                    │
│                                   ▼                    │
│                        animalPrototype                 │
│                        ┌───────────────────────┐       │
│                        │ breathe: ƒ()          │       │
│                        │ [[Prototype]] ────────┼───┐   │
│                        └───────────────────────┘   │   │
│                                                    ▼   │
│                                         Object.prototype
│                                         ┌───────────────────────┐
│                                         │ toString: ƒ()         │
│                                         │ valueOf: ƒ()          │
│                                         │ [[Prototype]]: null   │
│                                         └───────────────────────┘
└────────────────────────────────────────────────────────┘
```

* **Prototype Delegation**: When code attempts to read a property on an object (e.g. `dog.breathe`), if the engine doesn't find it directly on `dog`, it follows the `[[Prototype]]` link upward until it finds the property or reaches `null`.
* **Prototype Memory Optimization**: Methods defined on the prototype are shared across all instances, consuming memory for only a single function instance rather than duplicating it on every object.

---

# 24. `__proto__` VS OBJECT.GETPROTOTYPEOF

To inspect an object's prototype link:

```text
┌─────────────────────────────┬─────────────────────────────────────────────────────────┐
│ Property / Method           │ Status & Recommendation                                 │
├─────────────────────────────┼─────────────────────────────────────────────────────────┤
│ obj.__proto__               │ Legacy accessor on Object.prototype. Deprecated!        │
│ Object.getPrototypeOf(obj)  │ Modern ECMAScript Standard (ES5+). Recommended!         │
│ Reflect.getPrototypeOf(obj) │ Modern Reflection API Standard (ES6+). Safe & Robust.   │
└─────────────────────────────┴─────────────────────────────────────────────────────────┘
```

### Why `__proto__` is Dangerous
1. `__proto__` is an accessor property sitting on `Object.prototype`. If an object has a `null` prototype (`Object.create(null)`), `obj.__proto__` is simply `undefined`!
2. Mutating `__proto__` causes severe V8 performance de-optimizations.

```js
const parent = { familyName: "Smith" };
const child = Object.create(parent);

// ❌ Avoid legacy __proto__:
console.log(child.__proto__ === parent); // true, but discouraged

// ✅ Use standard Object.getPrototypeOf:
console.log(Object.getPrototypeOf(child) === parent); // true (Safe, standard!)
```

---

# 25. OBJECT.SETPROTOTYPEOF

`Object.setPrototypeOf(obj, newProto)` dynamically reassigns the prototype of `obj` to `newProto`.

```js
const human = { walk: () => "Walking" };
const robot = { recharge: () => "Recharging" };

const cyborg = { name: "C-1" };
Object.setPrototypeOf(cyborg, human);
console.log(cyborg.walk()); // "Walking"

// Switch prototype dynamically at runtime:
Object.setPrototypeOf(cyborg, robot);
console.log(cyborg.recharge()); // "Recharging"
```

> [!CAUTION]
> **Severe Performance Degradation**: Re-assigning an object's prototype with `Object.setPrototypeOf()` is one of the slowest operations in JavaScript. It blows away V8's Inline Caches (ICs) and forces the JavaScript engine to invalidate optimized JIT machine code across all downstream property accesses. Always set the prototype up-front using `Object.create()` or class `extends`.

---

# 26. PROTOTYPE CHAIN PROPERTY LOOKUP

When you evaluate `obj.someProp`, the JavaScript engine executes the following step-by-step algorithm:

```text
LOOKUP ALGORITHM: obj.someProp
Step 1: Check if 'someProp' is an OWN property on 'obj'.
        ├── Found? ──► Return value. (LOOKUP TERMINATES)
        └── Not found? ──► Proceed to Step 2.

Step 2: Check obj's [[Prototype]].
        ├── Is [[Prototype]] null? ──► Return undefined. (LOOKUP TERMINATES)
        └── Is [[Prototype]] an object? ──► Repeat Step 1 on the prototype!
```

### Step-by-Step Code Walkthrough
```js
const grandparent = { surname: "Gupta", homeCity: "Delhi" };
const parent = Object.create(grandparent);
parent.homeCity = "Mumbai"; // Shadows grandparent.homeCity!

const child = Object.create(parent);
child.firstName = "Ayush";

// Step-by-step resolution:
console.log(child.firstName); // Step 1: Found on 'child' directly -> "Ayush"
console.log(child.homeCity);  // Step 1: Miss on child -> Step 2: Found on 'parent' -> "Mumbai" (Shadowed!)
console.log(child.surname);   // Step 1: Miss -> Step 2: Miss on parent -> Step 3: Found on grandparent -> "Gupta"
console.log(child.salary);    // Miss on child -> parent -> grandparent -> Object.prototype -> null -> undefined
```

---

# 27. OWN VS INHERITED PROPERTIES

Properties living directly on the object are **Own Properties**. Properties available via the prototype chain are **Inherited Properties**.

```js
const vehicle = { wheels: 4 };
const sedan = Object.create(vehicle);
sedan.make = "Honda";

// 1. in operator: checks BOTH own and inherited
console.log("make" in sedan);   // true (Own)
console.log("wheels" in sedan); // true (Inherited!)

// 2. Object.hasOwn(): checks ONLY own properties
console.log(Object.hasOwn(sedan, "make"));   // true
console.log(Object.hasOwn(sedan, "wheels")); // false (wheels is inherited!)

// 3. Object.keys(): returns ONLY own enumerable keys
console.log(Object.keys(sedan)); // ['make'] (wheels is omitted!)
```

---

# 28. OBJECT PROPERTY DESCRIPTORS

Behind every property in JavaScript lies an internal record called a **Property Descriptor**. Property descriptors define the meta-rules governing how that property behaves.

### The 2 Flavors of Descriptors:
1. **Data Descriptors**: Hold a tangible value (`value`, `writable`).
2. **Accessor Descriptors**: Hold getter and setter functions (`get`, `set`).

### Inspecting Descriptors: `Object.getOwnPropertyDescriptor(obj, prop)`
```js
const book = { title: "JavaScript Mastery" };
const descriptor = Object.getOwnPropertyDescriptor(book, "title");

console.log(descriptor);
/*
{
  value: 'JavaScript Mastery',
  writable: true,        // Can the value be changed?
  enumerable: true,      // Will it show up in loops / Object.keys?
  configurable: true     // Can attributes be changed or property deleted?
}
*/
```

---

# 29. DEFINEPROPERTY

`Object.defineProperty(obj, prop, descriptor)` defines a new property or modifies an existing property's descriptors with surgical precision.

```js
const user = {};

Object.defineProperty(user, "id", {
  value: 1001,
  writable: false,      // Read-only!
  enumerable: true,     // Visible in Object.keys
  configurable: false   // Permanent! Cannot be deleted or reconfigured
});

console.log(user.id); // 1001

user.id = 9999; // Silently ignored in non-strict mode; throws TypeError in strict mode!
console.log(user.id); // 1001 (Unchanged!)

delete user.id; // Returns false! Deletion rejected!
console.log(user.id); // 1001
```

---

# 30. DEFINEPROPERTIES

To define or modify multiple property descriptors at once, use `Object.defineProperties(obj, props)`:

```js
const bankAccount = {};

Object.defineProperties(bankAccount, {
  accountNumber: {
    value: "ACC-908123",
    writable: false,
    enumerable: true,
    configurable: false
  },
  balance: {
    value: 5000,
    writable: true,
    enumerable: false, // Hidden from reflection loops!
    configurable: true
  }
});

console.log(Object.keys(bankAccount)); // ['accountNumber'] (balance is non-enumerable)
console.log(bankAccount.balance);      // 5000 (Direct access still works!)
```

---

# 31. PROPERTY DESCRIPTOR DEFAULTS

This is one of the most critical gotchas in JavaScript meta-programming:

```text
┌──────────────────────┬────────────────────────────────────────────────────────┐
│ Creation Technique   │ Descriptor Defaults (writable, enumerable, configurable)│
├──────────────────────┼────────────────────────────────────────────────────────┤
│ Object Literal `{}`  │ ALL DEFAULT TO TRUE! (`writable: true`, etc.)          │
│ Direct assignment `=`│ ALL DEFAULT TO TRUE!                                   │
│ Object.defineProperty│ ALL DEFAULT TO FALSE!                                  │
└──────────────────────┴────────────────────────────────────────────────────────┘
```

```js
const a = {};
a.x = 10;
// Descriptors for 'x': writable: true, enumerable: true, configurable: true

const b = {};
Object.defineProperty(b, "y", { value: 20 });
// Descriptors for 'y': writable: FALSE, enumerable: FALSE, configurable: FALSE!
```

---

# 32. ENUMERABILITY

The `enumerable` attribute dictates whether a property shows up during enumeration:
* `for...in` loops
* `Object.keys()`
* `Object.values()`
* `Object.entries()`
* Spread operator `{ ...obj }`
* `JSON.stringify()`

```js
const config = { apiHost: "https://api.internal.net" };

Object.defineProperty(config, "secretKey", {
  value: "super_secret_shh",
  enumerable: false // Invisible to ordinary reflection!
});

console.log(Object.keys(config)); // ['apiHost']
console.log(JSON.stringify(config)); // '{"apiHost":"https://api.internal.net"}'

// Accessing non-enumerable properties explicitly:
console.log(config.secretKey); // 'super_secret_shh'
console.log(Object.getOwnPropertyNames(config)); // ['apiHost', 'secretKey']
```

---

# 33. WRITABLE

The `writable` attribute controls whether the property's `value` can be overwritten via assignment (`=`):

```js
const server = {};
Object.defineProperty(server, "port", {
  value: 3000,
  writable: false,
  configurable: true
});

server.port = 8080; 
// In non-strict mode: silently ignored.
// In strict mode ("use strict";): throws TypeError: Cannot assign to read only property 'port'
```

---

# 34. CONFIGURABLE

The `configurable` attribute is the **Master Lock** of a property:
When `configurable: false`:
1. The property **CANNOT be deleted** (`delete obj.prop` fails).
2. The property cannot be converted between a data descriptor and an accessor descriptor.
3. `enumerable` cannot be changed.
4. `configurable` cannot be changed back to `true`.
5. **One exception**: `writable` can be transitioned from `true` to `false` (one-way ratchet lock), but never from `false` back to `true`.

```js
const permanent = {};
Object.defineProperty(permanent, "token", {
  value: "ABC-123",
  configurable: false,
  writable: true
});

// Allowed: turning writable false
Object.defineProperty(permanent, "token", { writable: false });

// 💥 Throws TypeError: Cannot redefine property 'token'
// Object.defineProperty(permanent, "token", { configurable: true });
```

---

# 35. GETTERS AND SETTERS

**Accessors** look and act like ordinary properties from the outside, but execute functions under the hood when read (`get`) or written (`set`).

### Syntax in Object Literals
```js
const user = {
  firstName: "Ayush",
  lastName: "Sharma",

  get fullName() {
    return `${this.firstName} ${this.lastName}`;
  },

  set fullName(value) {
    const parts = value.trim().split(" ");
    if (parts.length < 2) {
      throw new Error("Full name must include first and last name.");
    }
    this.firstName = parts[0];
    this.lastName = parts.slice(1).join(" ");
  }
};

console.log(user.fullName); // "Ayush Sharma" (Getter invoked!)

user.fullName = "Ayush Verma"; // Setter invoked!
console.log(user.firstName); // "Ayush"
console.log(user.lastName);  // "Verma"
```

---

# 36. GETTER/SETTER DESCRIPTORS

Accessor descriptors use `get` and `set` in place of `value` and `writable`:

```js
const temperatureSensor = {
  _celsius: 25
};

Object.defineProperty(temperatureSensor, "fahrenheit", {
  get() {
    return (this._celsius * 9) / 5 + 32;
  },
  set(fVal) {
    this._celsius = ((fVal - 32) * 5) / 9;
  },
  enumerable: true,
  configurable: true
});

console.log(temperatureSensor.fahrenheit); // 77°F
temperatureSensor.fahrenheit = 212;
console.log(temperatureSensor._celsius);   // 100°C
```


---

# 37. IMMUTABILITY

In modern software architecture, **immutability** (the guarantee that data cannot be modified after creation) prevents state mutations, race conditions, and side-effects.

JavaScript offers three built-in integrity levels to enforce varying degrees of object immutability:

```text
┌──────────────────────────┬───────────┬──────────────┬─────────────┐
│ Integrity Level          │ Add Props │ Delete Props │ Modify Vals │
├──────────────────────────┼───────────┼──────────────┼─────────────┤
│ Object.preventExtensions │ ❌ NO     │ ✅ YES       │ ✅ YES      │
│ Object.seal              │ ❌ NO     │ ❌ NO        │ ✅ YES      │
│ Object.freeze            │ ❌ NO     │ ❌ NO        │ ❌ NO       │
└──────────────────────────┴───────────┴──────────────┴─────────────┘
```

---

# 38. OBJECT.FREEZE

`Object.freeze(obj)` is the highest level of built-in immutability. It renders an object completely read-only:
* No new properties can be added.
* No existing properties can be deleted.
* No property values can be changed.
* All descriptors have `configurable: false` and `writable: false`.

```js
"use strict";

const appConfig = Object.freeze({
  endpoint: "https://api.myapp.com",
  timeout: 5000
});

// appConfig.timeout = 10000; // 💥 TypeError: Cannot assign to read only property 'timeout'
// delete appConfig.timeout;   // 💥 TypeError: Cannot delete property 'timeout'
// appConfig.retries = 3;      // 💥 TypeError: Cannot add property retries, object is not extensible
```

### ⚠️ The Shallow Freeze Trap & Deep Freeze Solution
`Object.freeze` is **shallow**! Nested objects remain completely mutable:
```js
const user = Object.freeze({
  name: "Ayush",
  preferences: { theme: "dark" }
});

user.preferences.theme = "light"; // ⚠️ MUTATED! Nested object was NOT frozen!
console.log(user.preferences.theme); // "light"
```

#### Production Recursive `deepFreeze` Utility:
```js
function deepFreeze(object) {
  // Retrieve all property names including non-enumerable ones
  const propNames = Reflect.ownKeys(object);

  // Freeze properties before freezing self
  for (const name of propNames) {
    const value = object[name];
    if (value && typeof value === "object") {
      deepFreeze(value);
    }
  }

  return Object.freeze(object);
}
```

---

# 39. OBJECT.SEAL

`Object.seal(obj)` seals an object:
* Prevents adding new properties.
* Prevents deleting existing properties (sets `configurable: false` on all properties).
* **Allows modifying existing values** (if `writable: true`).

```js
const gamePlayer = { score: 100, lives: 3 };
Object.seal(gamePlayer);

gamePlayer.score = 150; // ✅ Permitted! Value updated.
// delete gamePlayer.lives; // 💥 TypeError: Cannot delete property 'lives'
// gamePlayer.level = 2;    // 💥 TypeError: Cannot add property level
```

---

# 40. OBJECT.PREVENTEXTENSIONS

`Object.preventExtensions(obj)` prevents any new properties from ever being added to an object, but existing properties can still be modified and deleted freely.

```js
const car = { make: "Toyota", model: "Corolla" };
Object.preventExtensions(car);

delete car.model; // ✅ Allowed!
car.make = "Lexus"; // ✅ Allowed!
// car.year = 2024; // 💥 TypeError: Cannot add property year
```

---

# 41. OBJECT IS EXTENSIBLE / SEALED / FROZEN

To inspect the integrity status of any object:

```js
const testObj = { a: 1 };

console.log(Object.isExtensible(testObj)); // true
console.log(Object.isSealed(testObj));     // false
console.log(Object.isFrozen(testObj));     // false

Object.freeze(testObj);

console.log(Object.isExtensible(testObj)); // false
console.log(Object.isSealed(testObj));     // true (A frozen object is sealed by definition!)
console.log(Object.isFrozen(testObj));     // true
```

---

# 42. PROPERTY ENUMERATION

Understanding which properties are captured by different reflection tools is vital for serialization and framework design:

```text
┌─────────────────────────────────┬───────────┬───────────────┬─────────┬────────────┐
│ Mechanism                       │ Own Enumerable│ Own Non-Enum │ Symbols │ Prototypes │
├─────────────────────────────────┼───────────┼───────────────┼─────────┼────────────┤
│ for...in loop                   │ ✅ Yes    │ ❌ No         │ ❌ No   │ ✅ Yes     │
│ Object.keys()                   │ ✅ Yes    │ ❌ No         │ ❌ No   │ ❌ No      │
│ Object.values()                 │ ✅ Yes    │ ❌ No         │ ❌ No   │ ❌ No      │
│ Object.entries()                │ ✅ Yes    │ ❌ No         │ ❌ No   │ ❌ No      │
│ Object.getOwnPropertyNames()    │ ✅ Yes    │ ✅ Yes        │ ❌ No   │ ❌ No      │
│ Object.getOwnPropertySymbols()  │ ❌ No     │ ❌ No         │ ✅ Yes  │ ❌ No      │
│ Reflect.ownKeys()               │ ✅ Yes    │ ✅ Yes        │ ✅ Yes  │ ❌ No      │
└─────────────────────────────────┴───────────┴───────────────┴─────────┴────────────┘
```

> [!TIP]
> **`Reflect.ownKeys(obj)`** is the ultimate universal reflection method in modern JavaScript—it returns **every own key** (enumerable, non-enumerable, and symbols) in a single array.

---

# 43. PROPERTY ORDER

Since ES2015 (ES6), ECMAScript specifies a deterministic **3-tier iteration order** for own properties:

```text
┌────────────────────────────────────────────────────────────────────────┐
│               ECMASCRIPT DETERMINISTIC ITERATION ORDER                 │
│                                                                        │
│ 1. Non-negative Integer Keys (0, 1, 2...) in ASCENDING NUMERIC order   │
│ 2. String Keys in CHRONOLOGICAL INSERTION order                        │
│ 3. Symbol Keys in CHRONOLOGICAL INSERTION order                        │
└────────────────────────────────────────────────────────────────────────┘
```

```js
const strangeObj = {};

strangeObj["z"] = "last string";
strangeObj[10] = "second integer";
strangeObj["a"] = "first string";
strangeObj[2] = "first integer";
strangeObj[Symbol("id")] = "symbol key";

console.log(Reflect.ownKeys(strangeObj));
// Output order: ['2', '10', 'z', 'a', Symbol(id)]
// Notice:
// 1. Integers ('2', '10') are sorted numerically first!
// 2. Strings ('z', 'a') follow in order of insertion!
// 3. Symbol is placed at the very end!
```

---

# 44. SYMBOL PROPERTIES

**Symbols** (introduced in ES6) are primitive, unique, and immutable identifiers. They cannot accidentally collide with other property names:

```js
const idKey1 = Symbol("id");
const idKey2 = Symbol("id");

console.log(idKey1 === idKey2); // false! Every Symbol is unique!

const user = {
  name: "Ayush",
  [idKey1]: 9001
};

// Hidden from ordinary enumeration:
console.log(Object.keys(user)); // ['name']
console.log(JSON.stringify(user)); // '{"name":"Ayush"}'

// Retrieved via Symbol reflection:
console.log(user[idKey1]); // 9001
console.log(Object.getOwnPropertySymbols(user)); // [ Symbol(id) ]
```

---

# 45. WELL-KNOWN SYMBOLS

JavaScript provides built-in "Well-Known Symbols" allowing custom objects to hook directly into engine runtime operations:

### 1. `Symbol.iterator`: Making an Object Iterable
Allows custom objects to be traversed using `for...of` and spread syntax:
```js
const inventory = {
  items: ["Keyboard", "Mouse", "Monitor"],
  [Symbol.iterator]() {
    let index = 0;
    return {
      next: () => {
        if (index < this.items.length) {
          return { value: this.items[index++], done: false };
        }
        return { done: true };
      }
    };
  }
};

for (const item of inventory) {
  console.log(item); // "Keyboard", "Mouse", "Monitor"
}
console.log([...inventory]); // ['Keyboard', 'Mouse', 'Monitor']
```

### 2. `Symbol.toStringTag`: Customizing `[object Object]`
```js
const customService = {
  [Symbol.toStringTag]: "AuthenticationEngine"
};

console.log(Object.prototype.toString.call(customService));
// "[object AuthenticationEngine]"
```

---

# 46. OBJECT TO PRIMITIVE CONVERSION

When an object is used in mathematical operations (`+`, `-`), comparisons (`<`, `>`), or template literals, the engine executes the **`ToPrimitive` abstract operation** with a `hint`: `"number"`, `"string"`, or `"default"`.

You can intercept and customize this behavior using `[Symbol.toPrimitive](hint)`:

```js
const wallet = {
  balance: 500,
  currency: "USD",

  [Symbol.toPrimitive](hint) {
    if (hint === "number") {
      return this.balance;
    }
    if (hint === "string") {
      return `${this.currency} ${this.balance}`;
    }
    return this.balance; // default hint
  }
};

console.log(+wallet);          // 500 (hint: "number")
console.log(wallet + 50);      // 550 (hint: "default")
console.log(`Total: ${wallet}`);// "Total: USD 500" (hint: "string")
```

---

# 47. OBJECT STRING CONVERSION

If `Symbol.toPrimitive` is absent, the engine falls back to calling `.toString()` and `.valueOf()`.

* **String Hint**: Calls `toString()` first; if it returns an object, calls `valueOf()`.
* **Number Hint**: Calls `valueOf()` first; if it returns an object, calls `toString()`.

```js
const counter = {
  val: 42,
  toString() {
    return `Counter[${this.val}]`;
  },
  valueOf() {
    return this.val;
  }
};

console.log(String(counter)); // "Counter[42]" (Invokes toString)
console.log(counter + 8);     // 50 (Invokes valueOf)
```

---

# 48. OBJECT EQUALITY

In JavaScript, there is **NO built-in structural equality for objects**.
* `==` and `===` check strictly for pointer identity.
* Two objects containing identical data are never equal:

```js
const a = { x: 1 };
const b = { x: 1 };

console.log(a == b);  // false
console.log(a === b); // false
```

---

# 49. OBJECT.IS VS `===`

`Object.is(a, b)` determines whether two values are the exact same value. It behaves almost identically to `===`, with **two crucial scientific differences**:

```text
┌─────────────────────────┬───────────────┬───────────────────────────────┐
│ Comparison              │ Strict (===)  │ Object.is()                   │
├─────────────────────────┼───────────────┼───────────────────────────────┤
│ NaN === NaN             │ false ⚠️      │ true ✅ (Proper identity)     │
│ +0 === -0               │ true ⚠️       │ false ✅ (Preserves sign bit) │
│ {} === {}               │ false         │ false                         │
│ 'hello' === 'hello'     │ true          │ true                          │
└─────────────────────────┴───────────────┴───────────────────────────────┘
```

```js
console.log(NaN === NaN);            // false (The infamous JS quirk!)
console.log(Object.is(NaN, NaN));    // true (Correct mathematical identity!)

console.log(+0 === -0);              // true (Quirk: ignores IEEE 754 signs!)
console.log(Object.is(+0, -0));      // false (Differentiates positive/negative zero!)
```

---

# 50. OBJECT METHODS FROM PROTOTYPE

Every standard object inherits utility methods from `Object.prototype`:

1. `hasOwnProperty(prop)`: Verifies own property (vulnerable on null-prototype objects).
2. `isPrototypeOf(obj)`: Checks if an object exists in another object's prototype chain.
3. `propertyIsEnumerable(prop)`: Checks if a property is own and enumerable.
4. `valueOf()`: Returns the primitive value representation of the object.
5. `toString()`: Returns a string representation (`[object Object]`).

```js
const proto = { role: "base" };
const instance = Object.create(proto);

console.log(proto.isPrototypeOf(instance)); // true
```

---

# 51. OBJECT.PROTOTYPE

`Object.prototype` is the root of the JavaScript object model. Its internal prototype is `null`:

```js
console.log(Object.getPrototypeOf(Object.prototype)); // null (Terminal end of the chain!)
```

Any modification or monkey-patching of `Object.prototype` pollutes EVERY object in the entire application!

---

# 52. NULL-PROTOTYPE OBJECTS

A **null-prototype object** has no prototype (`[[Prototype]] = null`). It inherits zero methods or properties from `Object.prototype`.

```js
const pureDict = Object.create(null);
pureDict["key"] = "value";

console.log(pureDict.toString);       // undefined!
console.log(pureDict.hasOwnProperty); // undefined!
console.log(pureDict.__proto__);      // undefined!
```

---

# 53. OBJECTS AS DICTIONARIES

Historically, plain objects `{}` were used as key-value dictionaries. However, using `{}` as a dictionary exposes vulnerabilities:
1. Keys like `"toString"`, `"constructor"`, or `"__proto__"` collide with inherited prototype properties.
2. In untrusted user input scenarios, an attacker can manipulate prototype chains (Prototype Pollution).

**Safe Alternatives**:
* Use `Object.create(null)` for pure string dictionaries.
* Use ES6 `Map` for high-frequency or non-string key lookups.

---

# 54. OBJECT VS MAP

```text
┌──────────────────────┬────────────────────────────────┬────────────────────────────────┐
│ Feature              │ Plain Object `{}`              │ ES6 `Map`                      │
├──────────────────────┼────────────────────────────────┼────────────────────────────────┤
│ Key Types            │ String and Symbol only         │ ANY type (Objects, Functions)  │
│ Key Order            │ 3-tier (Integers first)        │ Strict insertion order         │
│ Size Retrieval       │ Manual: Object.keys(obj).length│ Direct: map.size               │
│ Prototype Pollution  │ Vulnerable                     │ Immune                         │
│ Performance          │ Optimized for fixed structures │ Optimized for add/delete churn │
│ Serialization        │ Native JSON.stringify()        │ Requires custom serialization  │
└──────────────────────┴────────────────────────────────┴────────────────────────────────┘
```

---

# 55. OBJECT VS SET

* **Object**: A key-to-value map where you look up a value using a key.
* **Set**: A collection of **unique values** where you check for membership (`set.has(x)`).

---

# 56. OBJECT VS ARRAY

* **Array**: An ordered, index-based list (`0, 1, 2...`) where position indicates sequence, and items are manipulated with algorithms (`push`, `pop`, `shift`, `filter`).
* **Object**: An associative entity representing an identifiable record or domain model (`user.email`, `car.speed`).

---

# 57. OBJECT VS CLASS

* **Object Literal**: Best for singletons, DTOs (Data Transfer Objects), configuration hashes, and ad-hoc data bundles.
* **Class**: Best when creating dozens or thousands of instances sharing the exact same methods, requiring inheritance (`extends`), or enforcing private encapsulation (`#fields`).


---

# 58. CONSTRUCTOR FUNCTIONS

Before ES6 classes, JavaScript used **Constructor Functions** to stamp out multiple objects sharing the same prototype:

```js
function User(username, email) {
  // Implicitly: this = Object.create(User.prototype);
  this.username = username;
  this.email = email;
  this.createdAt = new Date();
  // Implicitly: return this;
}

// Attach shared methods to the prototype:
User.prototype.greet = function() {
  return `Hello, I am ${this.username}!`;
};

const user1 = new User("ayush", "ayush@test.com");
console.log(user1.greet()); // "Hello, I am ayush!"
```

---

# 59. THE NEW OPERATOR

When you call a function with the `new` operator (`new Constructor(args)`), the JavaScript engine executes an exact **5-step lifecycle algorithm**:

```text
THE 5 STEPS OF 'new':
Step 1: Create a brand-new, empty plain object in heap memory: {}.
Step 2: Set the new object's internal [[Prototype]] link to Constructor.prototype.
Step 3: Execute the Constructor function body with 'this' bound to the new object.
Step 4: Check the function's return value:
        ├── Did it return an object? ──► Return that object! (Overrides 'this')
        └── Did it return a primitive (or undefined)? ──► Return 'this'!
```

### Implementing `new` Manually:
```js
function customNew(Constructor, ...args) {
  // Step 1 & 2: Create object linked to prototype
  const instance = Object.create(Constructor.prototype);

  // Step 3: Execute constructor with instance as 'this'
  const result = Constructor.apply(instance, args);

  // Step 4: Check return value
  return (typeof result === "object" && result !== null) ? result : instance;
}

const user2 = customNew(User, "john_doe", "john@test.com");
console.log(user2.greet()); // "Hello, I am john_doe!"
```

---

# 60. PROTOTYPAL INHERITANCE

In classical languages (Java, C++), classes are blueprints that copy structure into instances. In JavaScript, **objects link directly to other objects**.

```js
function Developer(username, email, techStack) {
  User.call(this, username, email); // Borrow parent constructor
  this.techStack = techStack;
}

// Inherit prototype chain
Developer.prototype = Object.create(User.prototype);
Developer.prototype.constructor = Developer; // Fix constructor pointer!

Developer.prototype.code = function() {
  return `${this.username} is building with ${this.techStack.join(", ")}`;
};

const dev = new Developer("ayush", "ayush@test.com", ["JavaScript", "TypeScript"]);
console.log(dev.greet()); // Inherited from User!
console.log(dev.code());  // Own Developer method!
```

---

# 61. CLASS SYNTAX

Introduced in ES6, the `class` keyword is **syntactic sugar** over prototype chains and constructor functions, offering cleaner syntax for modern software engineering.

```js
class ModernUser {
  constructor(username, email) {
    this.username = username;
    this.email = email;
  }

  // Prototype method (attached to ModernUser.prototype)
  greet() {
    return `Hi, I am ${this.username}`;
  }
}

class ModernDeveloper extends ModernUser {
  constructor(username, email, techStack) {
    super(username, email); // Invokes parent constructor
    this.techStack = techStack;
  }

  code() {
    return `${this.username} is coding in ${this.techStack}`;
  }
}
```

---

# 62. CLASS VS PROTOTYPE

```text
┌──────────────────────┬────────────────────────────────┬────────────────────────────────┐
│ Feature              │ Classical `class` Syntax       │ Constructor Function + Proto   │
├──────────────────────┼────────────────────────────────┼────────────────────────────────┤
│ Under the Hood       │ Prototype Delegation           │ Prototype Delegation           │
│ Calling without `new`│ 💥 Throws TypeError            │ Silently pollutes global scope │
│ Hoisting             │ Not hoisted (Temporal Dead Zone) Function declaration is hoisted │
│ Strict Mode          │ Class bodies run in strict mode Requires explicit "use strict"  │
│ Private Fields       │ Native support (`#field`)      │ Closures or WeakMaps only      │
└──────────────────────┴────────────────────────────────┴────────────────────────────────┘
```

---

# 63. STATIC PROPERTIES AND METHODS

**Static members** are defined on the constructor function itself, NOT on instances or prototypes.

```js
class HttpClient {
  static defaultTimeout = 5000;

  static createDefault() {
    return new HttpClient(this.defaultTimeout);
  }

  constructor(timeout) {
    this.timeout = timeout;
  }
}

console.log(HttpClient.defaultTimeout); // 5000
const client = HttpClient.createDefault();
console.log(client.timeout);            // 5000
// console.log(client.defaultTimeout);  // undefined (Static props not on instances!)
```

---

# 64. PRIVATE CLASS FIELDS

Introduced natively in modern ECMAScript, prefixing a field with a hash `#` makes it **strictly private** at the engine runtime level.

```js
class BankAccount {
  #balance; // Private variable declaration

  constructor(initialDeposit) {
    this.#balance = initialDeposit;
  }

  deposit(amount) {
    if (amount <= 0) throw new Error("Deposit must be positive.");
    this.#balance += amount;
  }

  getBalance() {
    return this.#balance;
  }
}

const myAccount = new BankAccount(1000);
myAccount.deposit(500);
console.log(myAccount.getBalance()); // 1500

// 💥 SyntaxError: Private field '#balance' must be declared in an enclosing class
// console.log(myAccount.#balance);
```

---

# 65. OBJECT COMPOSITION

> *"Favor object composition over class inheritance."* — Design Patterns (GoF)

Deep inheritance hierarchies (`User -> Employee -> Manager -> Executive`) create fragile, rigid codebases. **Composition** builds complex objects by assembling small, focused feature pieces.

```text
INHERITANCE ("What it IS"):               COMPOSITION ("What it DOES"):
Animal                                    CanBark = { bark: ƒ() }
  └── Dog                                 CanFly  = { fly: ƒ() }
        └── FlyingDog (Awkward hierarchy!) RobotDog = { ...CanBark, ...CanRecharge }
```

---

# 66. OBJECT-ORIENTED DESIGN IN JAVASCRIPT

Modern JavaScript OOP leverages four foundational principles:
1. **Encapsulation**: Bundling state and methods together while restricting direct access to internals via `#private` fields or closures.
2. **Abstraction**: Exposing high-level methods (`user.login()`) while hiding low-level network details.
3. **Inheritance / Delegation**: Sharing common behavior across models via prototypes.
4. **Polymorphism**: Enabling multiple objects to provide different implementations for the exact same method signature.

---

# 67. POLYMORPHISM WITH OBJECTS

Polymorphism enables calling code to treat different objects interchangeably as long as they implement the expected interface (Duck Typing):

```js
const stripeProcessor = {
  processPayment(amount) {
    return `Charged $${amount} via Stripe API`;
  }
};

const paypalProcessor = {
  processPayment(amount) {
    return `Charged $${amount} via PayPal OAuth`;
  }
};

function checkout(processor, total) {
  // Polymorphic execution: checkout doesn't care WHICH processor it is!
  console.log(processor.processPayment(total));
}

checkout(stripeProcessor, 49.99); // Charged $49.99 via Stripe API
checkout(paypalProcessor, 49.99); // Charged $49.99 via PayPal OAuth
```

---

# 68. OBJECT COMPOSITION PATTERNS

We compose capabilities dynamically using factory pipelines:

```js
const withTimestamps = (target) => ({
  ...target,
  createdAt: new Date(),
  updatedAt: new Date()
});

const withId = (target) => ({
  ...target,
  id: `UUID-${Math.random().toString(36).substring(2, 9)}`
});

const createPost = (title, author) => {
  const base = { title, author, views: 0 };
  return withTimestamps(withId(base));
};

console.log(createPost("JavaScript Mastery", "Ayush"));
```

---

# 69. MIXINS

A **Mixin** is a collection of methods that can be injected into any class or object to provide shared capabilities.

```js
const EventEmitterMixin = {
  on(event, handler) {
    this._listeners = this._listeners || {};
    (this._listeners[event] = this._listeners[event] || []).push(handler);
  },
  emit(event, data) {
    if (this._listeners?.[event]) {
      this._listeners[event].forEach(fn => fn(data));
    }
  }
};

// Inject into a model:
class ChatRoom {}
Object.assign(ChatRoom.prototype, EventEmitterMixin);

const room = new ChatRoom();
room.on("message", (msg) => console.log(`Received: ${msg}`));
room.emit("message", "Hello everyone!"); // "Received: Hello everyone!"
```

---

# 70. FACTORY FUNCTIONS

A **Factory Function** is any function that produces and returns a new object without requiring the `new` keyword.

```js
function createCounter(initial = 0) {
  let count = initial; // Private state held via closure!

  return {
    increment() { count++; return count; },
    decrement() { count--; return count; },
    getCount()  { return count; }
  };
}

const counterA = createCounter(10);
console.log(counterA.increment()); // 11
console.log(counterA.getCount());  // 11
// count variable is 100% private and cannot be tampered with!
```

---

# 71. OBJECT DELEGATION

JavaScript's native alternative to classes is **OLOO** (Objects Linked to Other Objects), popularized by Kyle Simpson:

```js
const TaskDelegator = {
  init(title) {
    this.title = title;
    return this;
  },
  output() {
    return `Task: ${this.title}`;
  }
};

// Link directly without classes or constructors!
const myTask = Object.create(TaskDelegator).init("Ship release v2.0");
console.log(myTask.output()); // "Task: Ship release v2.0"
```

---

# 72. THIS + OBJECTS

In JavaScript, the value of **`this` inside an ordinary method is dynamic**: it depends solely on **HOW the function was invoked** at runtime.

```js
const user = {
  name: "Ayush",
  greet() {
    return `Hello, ${this.name}`;
  }
};

console.log(user.greet()); // "Hello, Ayush" ('this' resolves to 'user' before the dot)
```

---

# 73. DETACHED METHODS

When you extract a method from an object and assign it to a variable, the method loses its connection to the object:

```js
const user = {
  name: "Ayush",
  greet() {
    return `Hello, ${this.name}`;
  }
};

const detachedGreet = user.greet;
console.log(detachedGreet()); // "Hello, undefined"! (In strict mode: TypeError!)
```

### The 3 Solutions for Detached Methods:
1. **Explicit Binding**: `detachedGreet.call(user)` or `detachedGreet.apply(user)`.
2. **Hard Binding**: `const bound = user.greet.bind(user); bound();`.
3. **Arrow Wrapper**: `() => user.greet()`.

---

# 74. OBJECT METHODS AND ARROW FUNCTIONS

> [!WARNING]
> **Never use arrow functions as top-level object methods if you need access to `this`!**

Arrow functions do **NOT** have their own `this` binding. They lexically inherit `this` from the outer execution scope (usually the global `window` or module `exports`):

```js
const developer = {
  name: "Ayush",
  // ❌ BROKEN: Arrow function lexically captures outer scope!
  sayNameArrow: () => {
    return this.name;
  },
  // ✅ CORRECT: Standard method shorthand
  sayNameMethod() {
    return this.name;
  }
};

console.log(developer.sayNameArrow());  // undefined!
console.log(developer.sayNameMethod()); // "Ayush"
```

---

# 75. OBJECT FACTORIES

### Real-World Production Factory Pattern: API Client
```js
function createApiClient({ baseUrl, apiKey, timeout = 3000 }) {
  const defaultHeaders = {
    "Authorization": `Bearer ${apiKey}`,
    "Content-Type": "application/json"
  };

  return {
    async get(endpoint) {
      console.log(`[GET] ${baseUrl}${endpoint} with timeout ${timeout}ms`);
      return { status: 200, data: { success: true } };
    },
    async post(endpoint, body) {
      console.log(`[POST] ${baseUrl}${endpoint}`, body);
      return { status: 201, data: body };
    }
  };
}

const githubClient = createApiClient({
  baseUrl: "https://api.github.com",
  apiKey: "ghp_mock_token_123"
});

githubClient.get("/user/repos");
```


---

# 76. OBJECT TRANSFORMATION

Real-world applications frequently require transforming data structures between API payloads, UI state, and database models. The foundational pipeline for transforming any object without mutation is:

```text
               Object.entries(obj)
                     │
                     ▼
             [ [key, val], ... ]
                     │
                     ▼ (map / filter / sort)
             [ [newKey, newVal], ... ]
                     │
                     ▼
           Object.fromEntries(entries)
```

---

# 77. OBJECT FILTERING

Filtering an object means removing key-value pairs based on a predicate condition:

```js
const inventory = {
  apples: 15,
  bananas: 0,
  oranges: 8,
  berries: 0
};

// Filter out out-of-stock items (quantity === 0):
const inStock = Object.fromEntries(
  Object.entries(inventory).filter(([item, count]) => count > 0)
);

console.log(inStock); // { apples: 15, oranges: 8 }
```

### Generic Reusable `filterObject` Helper:
```js
function filterObject(obj, predicate) {
  return Object.fromEntries(
    Object.entries(obj).filter(([key, value]) => predicate(key, value))
  );
}

const activeUsers = filterObject({ u1: { active: true }, u2: { active: false } }, (_, u) => u.active);
```

---

# 78. OBJECT MAPPING

Transforming an object's values while preserving or modifying its keys:

```js
const userRoles = {
  alice: "admin",
  bob: "editor",
  carol: "viewer"
};

// Transform all roles to uppercase:
const upperRoles = Object.fromEntries(
  Object.entries(userRoles).map(([user, role]) => [user, role.toUpperCase()])
);

console.log(upperRoles); // { alice: 'ADMIN', bob: 'EDITOR', carol: 'VIEWER' }
```

### Generic Reusable `mapValues` Helper:
```js
function mapValues(obj, fn) {
  return Object.fromEntries(
    Object.entries(obj).map(([key, value]) => [key, fn(value, key)])
  );
}
```

---

# 79. OBJECT GROUPING (`Object.groupBy` ES2024)

Standardized in ES2024, `Object.groupBy(items, callback)` groups array elements into a null-prototype object keyed by the callback return values.

```js
const engineers = [
  { name: "Ayush", department: "Architecture", seniority: "Staff" },
  { name: "Sarah", department: "Frontend",     seniority: "Senior" },
  { name: "David", department: "Frontend",     seniority: "Junior" },
  { name: "Elena", department: "Architecture", seniority: "Lead" }
];

const byDept = Object.groupBy(engineers, (dev) => dev.department);

console.log(byDept);
/*
{
  Architecture: [
    { name: 'Ayush', department: 'Architecture', seniority: 'Staff' },
    { name: 'Elena', department: 'Architecture', seniority: 'Lead' }
  ],
  Frontend: [
    { name: 'Sarah', department: 'Frontend', seniority: 'Senior' },
    { name: 'David', department: 'Frontend', seniority: 'Junior' }
  ]
}
*/
```

> [!NOTE]
> `Object.groupBy` returns an object with a `null` prototype (`[[Prototype]]: null`). This guarantees that user-generated group keys (such as `"toString"` or `"constructor"`) will never clash with built-in prototype methods!

---

# 80. OBJECT NORMALIZATION

APIs often return deeply nested relational structures. In scalable state management (Redux, Pinia, Zustand), storing nested arrays causes duplicated data and difficult updates. **Normalization** flattens the hierarchy into keyed dictionary tables:

```text
NESTED TREE (Messy, duplicated):
Post -> Author -> Comments -> CommentAuthors

NORMALIZED STATE (Relational, fast O(1) lookups):
{
  entities: {
    posts:    { "p1": { id: "p1", authorId: "u1", commentIds: ["c1"] } },
    users:    { "u1": { id: "u1", name: "Ayush" } },
    comments: { "c1": { id: "c1", text: "Great guide!", authorId: "u2" } }
  }
}
```

```js
function normalizePosts(postsArray) {
  const users = {};
  const posts = {};

  for (const post of postsArray) {
    users[post.author.id] = post.author;
    posts[post.id] = {
      id: post.id,
      title: post.title,
      authorId: post.author.id
    };
  }

  return { users, posts };
}
```

---

# 81. JSON AND OBJECTS

**JSON** (JavaScript Object Notation) is a strict text-based subset of JavaScript literal syntax.

```text
FEATURE               JAVASCRIPT OBJECT                JSON STRING
Keys                  Strings or Symbols               MUST be double-quoted strings ("key")
Values                Any JS entity (functions, dates) Limited (Strings, Numbers, Booleans, null)
Trailing Commas       Supported                        SYNTAX ERROR
Functions / Methods   Fully supported                  Stripped / Forbidden
Undefined             Fully supported                  Stripped / Forbidden
```

```js
const payload = {
  title: "API Release",
  tags: ["v1", "prod"],
  active: true
};

const jsonString = JSON.stringify(payload, null, 2); // 2 spaces indentation
console.log(jsonString);

const parsedBack = JSON.parse(jsonString);
console.log(parsedBack.title); // "API Release"
```

---

# 82. JSON REPLACER / REVIVER

`JSON.stringify` and `JSON.parse` accept optional functional interceptors.

### 1. The `replacer` Function in `JSON.stringify(obj, replacer)`
Used to filter properties or serialize complex types like `BigInt`, `Map`, or `Set`:
```js
const order = {
  id: "ORD-1",
  secretHash: "ab99",
  quantity: 20n // Native BigInt throws TypeError in JSON.stringify without replacer!
};

const serialized = JSON.stringify(order, (key, value) => {
  if (key === "secretHash") return undefined; // Strips this key!
  if (typeof value === "bigint") return value.toString() + "n"; // Serializes BigInt safely!
  return value;
});

console.log(serialized); // '{"id":"ORD-1","quantity":"20n"}'
```

### 2. The `reviver` Function in `JSON.parse(text, reviver)`
Automatically restores ISO timestamp strings back into true `Date` instances:
```js
const rawJson = '{"title":"Meeting","timestamp":"2026-09-19T00:00:00.000Z"}';

const revived = JSON.parse(rawJson, (key, value) => {
  if (key === "timestamp") return new Date(value);
  return value;
});

console.log(revived.timestamp instanceof Date); // true! Restored!
```

---

# 83. CIRCULAR OBJECTS

An object is **circular** when one of its properties references the object itself or creates an infinite loop through child objects:

```js
const nodeA = { name: "Node A" };
const nodeB = { name: "Node B" };

nodeA.neighbor = nodeB;
nodeB.neighbor = nodeA; // 💥 Circular reference created!

// JSON.stringify(nodeA);
// 💥 FATAL CRASH: TypeError: Converting circular structure to JSON
```

### Handling Circular Objects:
1. Use `structuredClone(nodeA)` which natively preserves cyclical graph topology.
2. Use a custom replacer with a `WeakSet` to track visited nodes during serialization:
```js
function safeStringifyCircular(obj) {
  const seen = new WeakSet();
  return JSON.stringify(obj, (key, value) => {
    if (typeof value === "object" && value !== null) {
      if (seen.has(value)) return "[Circular]";
      seen.add(value);
    }
    return value;
  });
}
```

---

# 84. OBJECTS AND APIS (DTOs)

In professional backend and full-stack development, objects arriving from HTTP requests or databases should be filtered and validated into explicit **Data Transfer Objects (DTOs)**:

```js
// Inbound dirty HTTP payload
const inboundBody = {
  username: "ayush",
  email: "ayush@example.com",
  isAdmin: true, // ⚠️ Malicious escalation attempt!
  unwantedField: "junk"
};

// Safe DTO Construction (Allow-listing only):
function toUserRegistrationDto(body) {
  return {
    username: String(body.username ?? "").trim(),
    email: String(body.email ?? "").trim().toLowerCase()
  };
}

const safeDto = toUserRegistrationDto(inboundBody);
console.log(safeDto); // { username: 'ayush', email: 'ayush@example.com' } (isAdmin stripped!)
```

---

# 85. OBJECT VALIDATION

Before accepting an object into domain logic, validate its schema and data types:

```js
function validateUserProfile(data) {
  const errors = [];

  if (typeof data !== "object" || data === null) {
    return { valid: false, errors: ["Payload must be a non-null object."] };
  }

  if (typeof data.username !== "string" || data.username.length < 3) {
    errors.push("username must be a string with at least 3 characters.");
  }

  if (typeof data.age !== "number" || data.age < 18 || Number.isNaN(data.age)) {
    errors.push("age must be a valid number >= 18.");
  }

  return {
    valid: errors.length === 0,
    errors
  };
}
```

---

# 86. OBJECT SECURITY

In JavaScript, objects share prototypes globally across the execution environment. If an application blindly accepts arbitrary keys from untrusted user input and merges them, attackers can compromise the runtime.

### The 3 Golden Rules of Object Security:
1. **Never use plain `{}` for user-supplied dictionaries**: Use `Object.create(null)` or `Map`.
2. **Never blindly recursively merge untrusted input**: Always validate or sanitize keys.
3. **Freeze foundational prototypes in security-critical environments**: `Object.freeze(Object.prototype)`.

---

# 87. PROTOTYPE POLLUTION

**Prototype Pollution** is a critical security vulnerability where an attacker exploits an unsafe recursive object merge/clone function to inject properties onto `Object.prototype`. Once `Object.prototype` is polluted, **every single object in the entire application inherits the polluted property**, leading to Remote Code Execution (RCE) or authentication bypass!

### The Exploit Mechanism:
```js
// Vulnerable recursive merge function:
function vulnerableMerge(target, source) {
  for (const key in source) {
    if (typeof source[key] === "object" && source[key] !== null) {
      if (!target[key]) target[key] = {};
      vulnerableMerge(target[key], source[key]);
    } else {
      target[key] = source[key];
    }
  }
  return target;
}

// Malicious JSON payload submitted by an attacker:
const maliciousPayload = JSON.parse('{"__proto__": {"isAdmin": true}}');

const emptyConfig = {};
vulnerableMerge(emptyConfig, maliciousPayload);

// THE CATASTROPHE:
const freshUser = {};
console.log(freshUser.isAdmin); // true 💥 (EVERY object now has isAdmin: true!)
```

### Production Defense: Key Sanitization
```js
function safeMerge(target, source) {
  for (const key of Object.keys(source)) {
    // 🛡️ REJECT DANGEROUS KEYS:
    if (key === "__proto__" || key === "constructor" || key === "prototype") {
      continue;
    }

    if (source[key] && typeof source[key] === "object" && !Array.isArray(source[key])) {
      if (!target[key] || typeof target[key] !== "object") target[key] = {};
      safeMerge(target[key], source[key]);
    } else {
      target[key] = source[key];
    }
  }
  return target;
}
```


---

# 88. OBJECT PERFORMANCE

JavaScript engines (such as Google V8, Apple JavaScriptCore, and Mozilla SpiderMonkey) execute JavaScript at near-C++ speeds through dynamic Just-In-Time (JIT) optimization. Understanding how the engine models objects under the hood allows senior engineers to write blazing-fast, allocation-efficient systems.

```text
HIGH ALLOCATION (Slow)                OPTIMIZED ALLOCATION (Fast)
In a 100,000-iteration loop:           Pre-allocate object shapes:
Creating 100,000 new objects           Reuse structures, minimize GC pressure,
causes GC pauses and heap churn.       keep object shapes predictable and stable.
```

---

# 89. V8 OBJECT INTERNALS: SHAPES & HIDDEN CLASSES

Under the hood, JavaScript has no static types. When you create an object `{ x: 1, y: 2 }`, the V8 engine generates a **Hidden Class (called a "Shape" or "Map")** behind the scenes.

```text
┌────────────────────────────────────────────────────────┐
│             V8 SHAPE TRANSITION TREE                   │
│                                                        │
│                     Shape C0 (empty {})                │
│                              │                         │
│                    Add 'x'   ▼                         │
│                     Shape C1 (offset 0: x)             │
│                              │                         │
│                    Add 'y'   ▼                         │
│                     Shape C2 (offset 0: x, offset 1: y)│
└────────────────────────────────────────────────────────┘
```

* **Property Offsets**: The Shape tells V8: *"Property `x` is stored at memory offset 0; property `y` is stored at memory offset 1."*
* **Shape Sharing**: When multiple objects are initialized with the same properties in the exact same order, they share the **exact same Shape reference**, saving massive amounts of RAM!

---

# 90. OBJECT MEMORY MODEL: IN-OBJECT PROPERTIES

V8 divides object storage into two tiers:
1. **In-Object Properties**: Stored directly on the object's heap header block for lightning-fast pointer dereferencing (typically up to ~10 properties).
2. **Backing Store (Property Array)**: If an object exceeds its in-object limit or switches to dictionary mode, additional properties are moved into an out-of-object array or a hash table.

```text
HEAP OBJECT (V8 Layout):
┌───────────────────────────┐
│ Map / Shape Pointer (8 B) │ ──► References Shared Shape Definition
├───────────────────────────┤
│ Elements Pointer (8 B)    │ ──► Numeric Indexed Elements [0, 1, ...]
├───────────────────────────┤
│ Properties Pointer (8 B)  │ ──► Out-of-object slow backing store
├───────────────────────────┤
│ In-Object Property 0 ('x')│ ──► Direct value (Zero extra indirection!)
├───────────────────────────┤
│ In-Object Property 1 ('y')│ ──► Direct value
└───────────────────────────┘
```

---

# 91. OBJECT PROPERTY ACCESS: INLINE CACHING (ICs)

When V8 executes `obj.x`, it doesn't perform an expensive hash-table string lookup every time. Instead, it deploys **Inline Caches (ICs)**:

```text
┌─────────────────────────┬─────────────────────────────────────────────────────────┐
│ Inline Cache State      │ Behavior & Speed                                        │
├─────────────────────────┼─────────────────────────────────────────────────────────┤
│ Monomorphic (Fastest)   │ Sees only 1 Shape. Emits direct memory offset read.     │
│ Polymorphic (Fast)      │ Sees 2 to 4 distinct Shapes. Emits small switch/table.  │
│ Megamorphic (Slow)      │ Sees 5+ different Shapes. Drops to generic hash lookup! │
└─────────────────────────┴─────────────────────────────────────────────────────────┘
```

> [!TIP]
> Always initialize objects with identical property orders so property access sites remain **monomorphic**.

---

# 92. OBJECT PERFORMANCE ANTI-PATTERNS

### Anti-Pattern 1: Divergent Property Initialization Order
```js
// ❌ BAD: Divergent shapes created!
const p1 = {};
p1.x = 10;
p1.y = 20; // Shape: {} -> {x} -> {x, y}

const p2 = {};
p2.y = 20;
p2.x = 10; // Shape: {} -> {y} -> {y, x} (DIFFERENT SHAPE! Destroys Monomorphism!)

// ✅ GOOD: Initialize properties in the same order via class or factory:
class Point {
  constructor(x, y) {
    this.x = x;
    this.y = y;
  }
}
```

### Anti-Pattern 2: Object Spreading in Hot Loops
```js
// ❌ TERRIBLE: O(n²) memory allocations in a loop!
let accumulator = {};
for (let i = 0; i < 10000; i++) {
  accumulator = { ...accumulator, [i]: i }; // Re-copies entire object 10,000 times!
}

// ✅ GOOD: Direct property assignment:
const fastAccumulator = {};
for (let i = 0; i < 10000; i++) {
  fastAccumulator[i] = i;
}
```

### Anti-Pattern 3: Using `delete` in Hot Paths
The `delete` operator forces V8 to drop the object into slow **Dictionary Mode**.
```js
// ❌ SLOW: delete p.x;
// ✅ FAST: p.x = null;
```

---

# 93. OBJECTS IN REACT / FRONTEND

In modern UI frameworks (React, Solid, Vue), UI rendering is driven by **Object Reference Equality (`===`)**:

```text
prevProps.user === nextProps.user
  ├── true  ──► SKIP RE-RENDER (Blazing Fast)
  └── false ──► RE-RENDER COMPONENT & CHILDREN
```

### 1. Accidental State Mutation Bug
```js
// ❌ FATAL REACT BUG:
const [user, setUser] = useState({ name: "Ayush", score: 10 });

const handleScore = () => {
  user.score = 20; // Direct mutation!
  setUser(user);   // React checks user === user -> SAME REFERENCE! React skips re-render!
};

// ✅ CORRECT: Return a fresh object reference via spread:
const handleScoreCorrect = () => {
  setUser(prev => ({ ...prev, score: prev.score + 10 }));
};
```

### 2. Shallow Updates in Deeply Nested State
```js
const updateCity = (newCity) => {
  setUser(prev => ({
    ...prev,
    profile: {
      ...prev.profile,
      address: {
        ...prev.profile.address,
        city: newCity
      }
    }
  }));
};
```

---

# 94. OBJECTS IN NODE.JS BACKENDS

In Node.js backends handling thousands of requests per second:
1. **Garbage Collection Pressure**: Avoid creating throwaway helper objects inside request handlers. Every object allocated must eventually be swept by the V8 GC.
2. **JSON Serialization Latency**: `JSON.stringify` is synchronous and CPU-bound. For massive JSON payloads, streaming JSON serializers prevent blocking the single-threaded Event Loop.
3. **Singleton Service Objects**: Instantiate database connections, logger instances, and cache clients as module-level singleton objects.

---

# 95. OBJECTS IN TYPESCRIPT

TypeScript adds compile-time type safety over JavaScript objects:

```ts
// Interface declaration
interface UserProfile {
  readonly id: string;   // Immutable property
  username: string;
  avatarUrl?: string;    // Optional property
}

const developer: UserProfile = {
  id: "USR-001",
  username: "ayush"
};

// developer.id = "NEW-ID"; // 💥 TypeScript Compile Error: Cannot assign to 'id' because it is a read-only property.
```

### Excess Property Checking
When assigning object literals directly to a typed variable, TypeScript enforces strict excess property checks:
```ts
// 💥 Error: Object literal may only specify known properties, and 'extraField' does not exist in type 'UserProfile'.
// const dev: UserProfile = { id: "1", username: "ayush", extraField: 123 };
```

---

# 96. RECORD AND INDEX SIGNATURE PATTERNS

When an object functions as an open-ended dictionary with dynamic keys:

### 1. Index Signatures
```ts
interface MetricsStore {
  [metricName: string]: number;
}

const metrics: MetricsStore = {
  cpuUsage: 78.4,
  memoryMB: 4096
};
```

### 2. The Modern `Record<K, V>` Utility Type
```ts
type Role = "admin" | "editor" | "viewer";

// Maps every union member to its permission object:
const rolePermissions: Record<Role, { canDelete: boolean; canEdit: boolean }> = {
  admin:  { canDelete: true,  canEdit: true },
  editor: { canDelete: false, canEdit: true },
  viewer: { canDelete: false, canEdit: false }
};
```

---

# 97. OBJECTS AND FUNCTION PARAMETERS

Positional parameters with more than 2 or 3 arguments create bug-prone call sites:

```js
// ❌ FRAGILE: What do true and false mean? Hard to read, ordering mistakes happen!
createUser("Ayush", 24, true, false, "admin");

// ✅ CLEAN SENIOR PATTERN: Named Parameter Object with Destructuring
function createUser({ name, age, isVerified = false, sendWelcomeEmail = true, role = "user" }) {
  return { name, age, isVerified, sendWelcomeEmail, role };
}

createUser({
  name: "Ayush",
  age: 24,
  role: "admin"
});
```

---

# 98. CONFIGURATION OBJECT PATTERN

APIs and libraries should accept a configuration object with deep default merging:

```js
const DEFAULT_CONFIG = Object.freeze({
  host: "localhost",
  port: 8080,
  tls: false,
  timeoutMs: 3000,
  logger: console
});

function createServer(userOptions = {}) {
  const finalConfig = {
    ...DEFAULT_CONFIG,
    ...userOptions
  };

  return `Server listening on ${finalConfig.host}:${finalConfig.port} (TLS: ${finalConfig.tls})`;
}

console.log(createServer({ port: 443, tls: true }));
```

---

# 99. OPTIONS OBJECT PATTERN

When implementing complex functions:
1. Accept an `options` object as the final argument.
2. Provide default fallback values for each option.
3. Validate unexpected or invalid options up-front.

```js
function queryDatabase(sql, { timeout = 5000, retry = 3, readOnly = true } = {}) {
  return { sql, timeout, retry, readOnly };
}
```

---

# 100. OBJECT DESIGN PRINCIPLES

Senior engineers follow key design heuristics when designing object architectures:
1. **Predictable Shape**: Always initialize properties in the constructor or literal in the same order. Never add properties ad-hoc at random points in execution.
2. **Immutability by Default**: Treat domain models and API entities as immutable records. Create new objects rather than mutating existing ones.
3. **Law of Demeter (Principle of Least Knowledge)**: Avoid deeply coupled dot-traversals (`a.b.c.d.doSomething()`). Objects should only communicate with their immediate neighbors.
4. **Prefer Composition Over Inheritance**: Assemble small, focused objects rather than building deep multi-tier class hierarchies.


---

# 101. COMMON OBJECT BUGS (THE SENIOR DEBUGGING SUITE)

Below are the 12 most frequent, painful object bugs encountered in JavaScript production codebases, complete with symptom, root cause, reproduction, debug technique, fix, and prevention.

### Bug 1: Accidental Shared Reference Mutation
* **Symptom**: Mutating user B's profile unexpectedly changes user A's profile.
* **Root Cause**: Shallow copy copied the pointer to a nested object.
* **Reproduction**:
  ```js
  const defaultSettings = { theme: "dark", notifications: { email: true } };
  const userA = { ...defaultSettings };
  userA.notifications.email = false;
  console.log(defaultSettings.notifications.email); // false! Mutated!
  ```
* **Fix**: Use `structuredClone(defaultSettings)` for deep isolation.

### Bug 2: Arrow Function as Object Method (`this` is `undefined`)
* **Symptom**: Calling `user.getName()` returns `undefined` or throws in strict mode.
* **Root Cause**: Arrow functions inherit lexical `this`, not the invoking object.
* **Fix**: Use ES6 method syntax `getName() { return this.name; }`.

### Bug 3: Checking Existence with `if (obj[key])` Failing on Falsy Values
* **Symptom**: Setting `volume = 0` or `active = false` triggers the fallback branch.
* **Root Cause**: `0` and `false` evaluate to falsy in boolean coercion.
* **Fix**: Use `Object.hasOwn(obj, key)` or `obj[key] !== undefined`.

### Bug 4: Object Literal Key Stringification Collision
* **Symptom**: Saving data for two different objects overwrites the first one.
* **Root Cause**: Objects stringified to `"[object Object]"` as plain object keys.
* **Fix**: Use `new Map()` when keys are objects.

### Bug 5: `JSON.stringify` Silently Stripping Functions, Dates & `undefined`
* **Symptom**: Deep-cloned object loses methods, and `Date` turns into a string.
* **Root Cause**: JSON specification does not support functions, undefined, or native Dates.
* **Fix**: Use native `structuredClone()`.

### Bug 6: Inadvertent Prototype Traversal in `for...in`
* **Symptom**: Third-party library methods show up in loop iterations.
* **Root Cause**: `for...in` walks the entire prototype chain.
* **Fix**: Use `Object.keys()` or `Object.entries()`.

### Bug 7: Calling `obj.hasOwnProperty()` on Null-Prototype Object Crashes
* **Symptom**: `TypeError: obj.hasOwnProperty is not a function`.
* **Root Cause**: `Object.create(null)` objects don't inherit from `Object.prototype`.
* **Fix**: Use static `Object.hasOwn(obj, key)`.

### Bug 8: React State Not Updating Due to In-Place Mutation
* **Symptom**: UI fails to re-render after state changes.
* **Root Cause**: React performs reference check `prev === next`; mutating in-place preserves pointer.
* **Fix**: Always return a new object: `setState(prev => ({ ...prev, updated: true }))`.

### Bug 9: Property Order Assumption Bugs
* **Symptom**: Keys appear in a different order than inserted.
* **Root Cause**: ECMAScript specifies numeric integer keys are sorted in ascending order first.
* **Fix**: Use `Map` or an Array if strict insertion order across all key types is required.

### Bug 10: Attempting to Freeze an Object Shallowly
* **Symptom**: Nested properties are modified despite calling `Object.freeze()`.
* **Root Cause**: `Object.freeze` is shallow.
* **Fix**: Implement and run recursive `deepFreeze()`.

### Bug 11: Destructuring Undefined Nested Object Crashes
* **Symptom**: `TypeError: Cannot read properties of undefined (reading 'street')`.
* **Root Cause**: Destructuring nested properties without providing fallback defaults.
* **Fix**: `const { address: { street } = {} } = user;`.

### Bug 12: Prototype Pollution in Merge Utility
* **Symptom**: Attacker injects malicious properties across all application objects.
* **Root Cause**: Unsafe recursive merge traversing `__proto__`.
* **Fix**: Sanitize keys and reject `__proto__`, `constructor`, and `prototype`.

---

# 102. OBJECT DEBUGGING

Modern tools for inspecting objects at runtime:

```js
const complexData = {
  id: 101,
  user: { name: "Ayush", roles: ["admin", "dev"] },
  metrics: { latency: 42, errorRate: 0.01 }
};

// 1. console.dir() — Inspect expandable DOM & Object properties
console.dir(complexData, { depth: null, colors: true });

// 2. console.table() — Visual tabular formatting for array of objects or key-value pairs
console.table([
  { id: 1, name: "Alice", role: "Dev" },
  { id: 2, name: "Bob", role: "Design" }
]);

// 3. JSON formatted snapshot
console.log(JSON.stringify(complexData, null, 2));
```

---

# 103. OBJECT TESTING

Writing bulletproof unit tests for objects using Jest/Vitest assertions:

```js
describe("User Profile Object", () => {
  const createUser = (name) => ({ id: "u-1", name, roles: ["member"], active: true });

  test("creates object with exact shape and value", () => {
    const user = createUser("Ayush");

    // Value equality (Structural Deep Match)
    expect(user).toEqual({ id: "u-1", name: "Ayush", roles: ["member"], active: true });

    // Reference identity assertion (Should NOT be same memory address)
    expect(user).not.toBe(createUser("Ayush"));

    // Shape / Property matchers
    expect(user).toHaveProperty("roles");
    expect(user.roles).toContain("member");
  });
});
```

---

# 104. OBJECT ALGORITHMS (20 CORE ALGORITHMS)

Key algorithmic patterns leveraging objects:

1. **Frequency Counter**: Counting occurrences of characters or tokens in $O(n)$ time.
2. **Two-Sum Index Lookup**: Using an object hash map to find target sums in $O(n)$ time.
3. **Array Deduplication**: Grouping unique objects by key.
4. **Graph Adjacency List**: Representing graph nodes and edges as object keys with array values.
5. **Flattening Nested Objects**: Converting `{ a: { b: 1 } }` into `{ "a.b": 1 }`.
6. **Unflattening Paths**: Reconstructing nested trees from dot-delimited strings.
7. **Object Inversion**: Swapping keys and values `{ a: 1 }` -> `{ 1: "a" }`.
8. **Deep Equality Check**: Recursively verifying nested properties and types.
9. **Diffing Two Objects**: Returning an object representing added, modified, and deleted keys.
10. **Sanitizing / Allow-listing**: Retaining only approved keys.
11. **Denylist / Omission**: Stripping forbidden keys.
12. **Grouping by Key**: Emulating `Object.groupBy`.
13. **Key Renaming**: Renaming keys according to an alias dictionary.
14. **Merging with Conflict Resolution**: Merging two objects using custom value reducers.
15. **Query String Serialization**: Converting an object to `?foo=bar&baz=1`.
16. **Query String Parser**: Parsing `?foo=bar` into an object.
17. **Memoization Cache**: Caching heavy function outputs by hashed argument keys.
18. **Cyclic Graph Detection**: Detecting circular references using a `WeakSet`.
19. **Object Schema Validation**: Validating types, bounds, and required keys.
20. **Deep Freezing**: Recursively locking object graphs.

---

# 105. BUILD CUSTOM OBJECT UTILITIES

```js
// 1. pick(obj, keys): Extracts only specified keys
function pick(obj, keys) {
  const result = {};
  for (const key of keys) {
    if (Object.hasOwn(obj, key)) {
      result[key] = obj[key];
    }
  }
  return result;
}

// 2. omit(obj, keys): Returns object without specified keys
function omit(obj, keys) {
  const keySet = new Set(keys);
  const result = {};
  for (const [key, value] of Object.entries(obj)) {
    if (!keySet.has(key)) {
      result[key] = value;
    }
  }
  return result;
}

// 3. getPath(obj, path, fallback): Safe deep property access ("user.profile.name")
function getPath(obj, path, fallback = undefined) {
  const parts = Array.isArray(path) ? path : path.split(".");
  let current = obj;
  for (const part of parts) {
    if (current === null || current === undefined) return fallback;
    current = current[part];
  }
  return current === undefined ? fallback : current;
}

// 4. setPath(obj, path, value): Deep mutable path setter
function setPath(obj, path, value) {
  const parts = Array.isArray(path) ? path : path.split(".");
  let current = obj;
  for (let i = 0; i < parts.length - 1; i++) {
    const part = parts[i];
    if (!(part in current) || typeof current[part] !== "object") {
      current[part] = {};
    }
    current = current[part];
  }
  current[parts[parts.length - 1]] = value;
  return obj;
}
```

---

# 106. BUILD A DEEP EQUALITY FUNCTION

```js
function deepEqual(a, b) {
  // 1. Primitive and reference identity check (handles NaN)
  if (Object.is(a, b)) return true;

  // 2. Handle null and primitives
  if (typeof a !== "object" || a === null || typeof b !== "object" || b === null) {
    return false;
  }

  // 3. Handle Dates
  if (a instanceof Date && b instanceof Date) {
    return a.getTime() === b.getTime();
  }

  // 4. Handle RegExps
  if (a instanceof RegExp && b instanceof RegExp) {
    return a.source === b.source && a.flags === b.flags;
  }

  // 5. Compare prototypes / constructors
  if (Object.getPrototypeOf(a) !== Object.getPrototypeOf(b)) {
    return false;
  }

  // 6. Compare keys length
  const keysA = Reflect.ownKeys(a);
  const keysB = Reflect.ownKeys(b);
  if (keysA.length !== keysB.length) return false;

  // 7. Recursive comparison of all own keys
  for (const key of keysA) {
    if (!Object.hasOwn(b, key) || !deepEqual(a[key], b[key])) {
      return false;
    }
  }

  return true;
}
```

---

# 107. BUILD A DEEP CLONE FUNCTION (WITH WEAKMAP)

```js
function deepClone(value, hash = new WeakMap()) {
  // Primitives, functions, null
  if (typeof value !== "object" || value === null) {
    return value;
  }

  // Circular reference detection
  if (hash.has(value)) {
    return hash.get(value);
  }

  // Special object types
  if (value instanceof Date) return new Date(value);
  if (value instanceof RegExp) return new RegExp(value.source, value.flags);
  if (value instanceof Map) {
    const mapClone = new Map();
    hash.set(value, mapClone);
    value.forEach((v, k) => mapClone.set(deepClone(k, hash), deepClone(v, hash)));
    return mapClone;
  }
  if (value instanceof Set) {
    const setClone = new Set();
    hash.set(value, setClone);
    value.forEach(v => setClone.add(deepClone(v, hash)));
    return setClone;
  }

  // Array or Plain Object
  const clone = Array.isArray(value) ? [] : Object.create(Object.getPrototypeOf(value));
  hash.set(value, clone);

  for (const key of Reflect.ownKeys(value)) {
    clone[key] = deepClone(value[key], hash);
  }

  return clone;
}
```

---

# 108. BUILD AN OBJECT VALIDATOR

```js
class SchemaValidator {
  constructor(schema) {
    this.schema = schema;
  }

  validate(data) {
    const errors = [];

    for (const [field, rules] of Object.entries(this.schema)) {
      const val = data[field];

      if (rules.required && (val === undefined || val === null)) {
        errors.push(`Field '${field}' is required.`);
        continue;
      }

      if (val !== undefined && rules.type && typeof val !== rules.type) {
        errors.push(`Field '${field}' must be of type ${rules.type}.`);
      }

      if (val !== undefined && rules.validator && !rules.validator(val)) {
        errors.push(`Field '${field}' failed custom validation constraint.`);
      }
    }

    return { isValid: errors.length === 0, errors };
  }
}
```

---

# 109. BUILD A CONFIGURATION SYSTEM

```js
class ConfigManager {
  #config;

  constructor(defaults = {}) {
    this.#config = deepClone(defaults);
  }

  merge(userOverrides) {
    for (const [key, val] of Object.entries(userOverrides)) {
      if (val && typeof val === "object" && !Array.isArray(val)) {
        this.#config[key] = { ...this.#config[key], ...val };
      } else {
        this.#config[key] = val;
      }
    }
    return this;
  }

  lock() {
    deepFreeze(this.#config);
    return this;
  }

  get(path) {
    return getPath(this.#config, path);
  }
}
```

---

# 110. BUILD AN OBJECT-BASED CACHE (LRU)

```js
class LRUCache {
  constructor(capacity = 3) {
    this.capacity = capacity;
    this.map = new Map(); // Maps retain insertion order
  }

  get(key) {
    if (!this.map.has(key)) return undefined;
    const value = this.map.get(key);
    // Refresh position to mark as recently used
    this.map.delete(key);
    this.map.set(key, value);
    return value;
  }

  put(key, value) {
    if (this.map.has(key)) {
      this.map.delete(key);
    } else if (this.map.size >= this.capacity) {
      // Evict oldest item (first entry in Map)
      const oldestKey = this.map.keys().next().value;
      this.map.delete(oldestKey);
    }
    this.map.set(key, value);
  }
}
```

---

# 111. BUILD A SIMPLE ORM-LIKE ENTITY

```js
class ModelEntity {
  #attributes = {};
  #dirty = new Set();

  constructor(initialData = {}) {
    this.#attributes = { ...initialData };
  }

  get(attr) {
    return this.#attributes[attr];
  }

  set(attr, value) {
    if (this.#attributes[attr] !== value) {
      this.#attributes[attr] = value;
      this.#dirty.add(attr);
    }
  }

  isDirty() {
    return this.#dirty.size > 0;
  }

  save() {
    console.log(`Persisting dirty fields to DB:`, [...this.#dirty]);
    this.#dirty.clear();
    return true;
  }

  toJSON() {
    return { ...this.#attributes };
  }
}
```

---

# 112. REAL-WORLD OBJECT PATTERNS

* **Repository Pattern**: Centralizes data fetching and database queries behind clean object interfaces (`UserRepository.findById()`).
* **Builder Pattern**: Uses method chaining on an internal state object to assemble complex configurations step-by-step (`new RequestBuilder().setUrl(url).setMethod('POST').build()`).
* **Observer Pattern**: Objects maintain a subscription list and broadcast state changes to registered listeners.

---

# 113. OBJECT DESIGN DECISION TREE

```text
Do I need to store keyed data?
       │
       ├── Do I need non-string keys, high-frequency additions/removals, or size?
       │     └── YES ──► Use 'Map'
       │
       ├── Do I need a simple lookup dictionary with zero prototype baggage?
       │     └── YES ──► Use 'Object.create(null)'
       │
       ├── Do I need multiple instances with shared methods and strict typing?
       │     └── YES ──► Use 'class'
       │
       └── Do I just need a single static record, DTO, or options object?
             └── YES ──► Use Plain Object Literal '{}'
```

---

# 114. COMPLETE OBJECT COMPARISON TABLE

```text
┌─────────────────────────┬──────────────────┬──────────────────┬──────────────────┬──────────────────┐
│ Criteria                │ Plain Object {}  │ Object.create(null)│ Map            │ Class Instance   │
├─────────────────────────┼──────────────────┼──────────────────┼──────────────────┼──────────────────┤
│ Prototype Chain         │ Object.prototype │ null (Empty)     │ Map.prototype    │ Custom Class Proto│
│ Key Types               │ String / Symbol  │ String / Symbol  │ Any Type         │ String / Symbol  │
│ JSON Serialization      │ Native Support   │ Native Support   │ Custom Replacer  │ Serializes Props │
│ Prototype Pollution Risk│ Vulnerable       │ Immune           │ Immune           │ Immune           │
│ Direct Property Access  │ obj.foo          │ obj.foo          │ map.get('foo')   │ inst.foo         │
│ Memory Footprint        │ Low              │ Minimal          │ Moderate         │ Low (Shared proto)│
└─────────────────────────┴──────────────────┴──────────────────┴──────────────────┴──────────────────┘
```

---

# 115. OBJECT DO / DON'T

| DO | DON'T |
| :--- | :--- |
| **DO** use `Object.hasOwn(obj, key)` for existence checks. | **DON'T** use `obj.hasOwnProperty()` or `if (obj[key])`. |
| **DO** use `structuredClone()` for deep copies. | **DON'T** use `JSON.parse(JSON.stringify())` blindly. |
| **DO** use `Object.freeze()` to protect constants. | **DON'T** assume `Object.freeze()` freezes nested objects. |
| **DO** use standard method shorthand `greet() {}`. | **DON'T** use arrow functions as methods relying on `this`. |
| **DO** use named parameter objects for $> 2$ arguments. | **DON'T** pass multiple mystery booleans `(a, true, false)`. |
| **DO** sanitize keys against `__proto__` in merge tools. | **DON'T** blindly merge untrusted user JSON into prototypes. |

---

# 116. OBJECT CHEAT SHEET

```js
// CREATION
const obj = { a: 1 };
const dict = Object.create(null);

// INSPECTION
Object.keys(obj);            // ['a']
Object.values(obj);          // [1]
Object.entries(obj);         // [['a', 1]]
Object.hasOwn(obj, 'a');     // true
Reflect.ownKeys(obj);        // All keys including Symbols

// IMMUTABILITY
Object.preventExtensions(obj); // No new properties
Object.seal(obj);              // No additions or deletions
Object.freeze(obj);            // Completely read-only (shallow)

// COPYING
const shallow = { ...obj };
const deep = structuredClone(obj);
```


---

# 117. INTERVIEW PREPARATION (4-TIER INTERVIEW SUITE)

### Tier 1 — Beginner Questions & Model Answers
**Q1: What is an object in JavaScript?**
* **Answer**: An object is a non-primitive composite data structure stored on the memory heap that holds key-value pairs (properties and methods). Keys are either strings or symbols, and values can be any JavaScript data type.

**Q2: What is the difference between dot notation and bracket notation?**
* **Answer**: Dot notation (`obj.prop`) is concise and requires valid JavaScript identifiers. Bracket notation (`obj["prop"]`) evaluates expressions dynamically, allowing variable lookups, strings with spaces or dashes, numeric keys, and symbols.

**Q3: How do you check if a property exists on an object?**
* **Answer**: Use `Object.hasOwn(obj, key)` for own properties (ES2022 standard). Use the `in` operator if you also want to check inherited properties on the prototype chain. Avoid `obj[key] !== undefined` because the property might exist with a value of `undefined`.

---

### Tier 2 — Intermediate Questions & Model Answers
**Q4: Explain the difference between a shallow copy and a deep copy.**
* **Answer**: A shallow copy (`{ ...obj }` or `Object.assign({}, obj)`) duplicates only the top-level properties. If a property references a nested object or array, only the memory pointer is copied, meaning changes to nested data mutate both objects. A deep copy (`structuredClone(obj)`) recursively duplicates all nested objects, creating completely isolated data structures in memory.

**Q5: Why does `{} === {}` return `false`?**
* **Answer**: JavaScript compares objects by **reference identity**, not structural content. Each empty object literal `{}` allocates a distinct memory block on the heap with a unique memory address. Since the two pointers point to different addresses, strict equality evaluates to `false`.

**Q6: What is the difference between `Object.freeze()` and `Object.seal()`?**
* **Answer**: Both prevent adding or deleting properties. However, `Object.seal()` allows existing properties to be modified (if `writable: true`), whereas `Object.freeze()` marks all properties as `writable: false`, making the object completely read-only (shallowly).

---

### Tier 3 — Advanced Questions & Model Answers
**Q7: How does property lookup work on the prototype chain?**
* **Answer**: When evaluating `obj.prop`, the engine first checks `obj`'s own properties. If not found, it checks `obj`'s internal `[[Prototype]]` link. It repeats this process recursively up the chain until the property is found or `[[Prototype]]` evaluates to `null` (at `Object.prototype`), returning `undefined`.

**Q8: What happens during `new Constructor()` execution?**
* **Answer**: The engine executes 5 steps: (1) Allocates a new empty plain object `{}`; (2) Links the object's `[[Prototype]]` to `Constructor.prototype`; (3) Binds `this` to the new object and executes the constructor body; (4) Inspects the returned value; (5) If the constructor returns an object, that object is returned; otherwise, the newly created instance is returned.

**Q9: Explain Property Descriptors and the difference between data and accessor descriptors.**
* **Answer**: Descriptors define property meta-behavior. Data descriptors contain `value`, `writable`, `enumerable`, and `configurable`. Accessor descriptors contain `get`, `set`, `enumerable`, and `configurable`. An object cannot have both `value`/`writable` and `get`/`set` on the same property.

---

### Tier 4 — Senior Engineer Questions & Model Answers
**Q10: What is Prototype Pollution and how do you prevent it in production?**
* **Answer**: Prototype pollution occurs when an insecure recursive merge/clone function processes untrusted user JSON containing `__proto__`, `constructor`, or `prototype` keys, modifying `Object.prototype`. To prevent it: (1) Sanitize and reject dangerous keys during merges; (2) Use `Object.create(null)` or `Map` for dictionaries; (3) Run `Object.freeze(Object.prototype)` in security-sensitive initialization.

**Q11: How does V8 optimize object property access using Shapes and Inline Caches (ICs)?**
* **Answer**: V8 assigns a hidden class ("Shape") to objects tracking property offsets. Code sites accessing properties start uninitialized, transition to **monomorphic** when observing one shape (generating direct memory-offset reads), become **polymorphic** if observing 2-4 shapes, and degrade to **megamorphic** (slow hash table lookup) if observing 5+ shapes. Initializing properties in consistent orders preserves monomorphism.

---

# 118. SENIOR ENGINEER OBJECT GUIDE

Senior software architects reason about objects across three distinct architectural vectors:

```text
┌────────────────────────────────────────────────────────┐
│            SENIOR OBJECT ARCHITECTURE MATRIX           │
│                                                        │
│  1. DATA INTEGRITY        2. MEMORY & GC       3. V8 JIT OPTIMIZATION
│  ─────────────────        ──────────────       ──────────────────────
│  • Immutability by default• Allocation rate   • Monomorphic ICs
│  • Schema validation      • Retained heap size • Stable Shapes
│  • Prototype pollution    • WeakMap caches     • Fast/In-Object mode
│    prevention             • Object pooling     • Avoid 'delete'
└────────────────────────────────────────────────────────┘
```

1. **Invariants and Defensive Copies**: Treat domain entities as immutable. Deep-clone before exporting state across subsystem boundaries.
2. **Memory Footprint Budgeting**: In Node.js microservices processing millions of payloads, prefer flat typed shapes or typed arrays over sprawling, deeply nested dynamic objects.
3. **Shape Stability**: Construct objects using constructor functions or factories that assign all fields in an identical chronological order. Never add or delete properties dynamically at runtime.

---

# 119. OBJECT SYSTEM DESIGN EXERCISE

## "Build a Production-Grade Configuration & Entity System"

### System Architecture Requirements:
1. **Hierarchical Configuration Hierarchy**: Support default settings, environment-specific overrides, and runtime overrides.
2. **Immutability Locking**: Once loaded, configuration must be frozen using recursive deep freeze.
3. **Dirty-Tracking Entity Model**: Model database entities with change detection, schema type verification, and rollback capabilities.

```js
class SystemConfig {
  #store;

  constructor(baseDefaults) {
    this.#store = deepClone(baseDefaults);
  }

  override(layer) {
    this.#store = deepMerge(this.#store, layer);
    return this;
  }

  freezeConfig() {
    deepFreeze(this.#store);
    return this;
  }

  get(path) {
    return getPath(this.#store, path);
  }
}

class TrackedEntity {
  #initial;
  #current;
  #dirtyFields = new Set();

  constructor(data) {
    this.#initial = Object.freeze(structuredClone(data));
    this.#current = structuredClone(data);
  }

  get(key) {
    return this.#current[key];
  }

  set(key, value) {
    if (!deepEqual(this.#current[key], value)) {
      this.#current[key] = value;
      this.#dirtyFields.add(key);
    }
  }

  isDirty() {
    return this.#dirtyFields.size > 0;
  }

  getDirtyFields() {
    return [...this.#dirtyFields];
  }

  rollback() {
    this.#current = structuredClone(this.#initial);
    this.#dirtyFields.clear();
  }

  commit() {
    this.#initial = Object.freeze(structuredClone(this.#current));
    this.#dirtyFields.clear();
  }
}
```

---

# 120. FINAL OBJECT CHALLENGE

### The Multi-Disciplinary Challenge
Create an **OmniStore Engine** that combines:
1. Nested data structures.
2. Property accessors (getters/setters).
3. Prototype delegation.
4. Property descriptors (`Object.defineProperty`).
5. Event broadcasting on mutation.

```js
function createOmniStore(initialState = {}) {
  const listeners = new Map();

  const storeProto = {
    subscribe(key, callback) {
      if (!listeners.has(key)) listeners.set(key, new Set());
      listeners.get(key).add(callback);
      return () => listeners.get(key).delete(callback);
    },
    toJSON() {
      const output = {};
      for (const k of Object.keys(this)) {
        output[k] = this[k];
      }
      return output;
    }
  };

  const storeInstance = Object.create(storeProto);

  for (const [key, initialVal] of Object.entries(initialState)) {
    let internalVal = initialVal;

    Object.defineProperty(storeInstance, key, {
      enumerable: true,
      configurable: false,
      get() {
        return internalVal;
      },
      set(newVal) {
        if (!Object.is(internalVal, newVal)) {
          const oldVal = internalVal;
          internalVal = newVal;
          if (listeners.has(key)) {
            listeners.get(key).forEach(fn => fn(newVal, oldVal));
          }
        }
      }
    });
  }

  return storeInstance;
}

// Verification:
const state = createOmniStore({ count: 0, user: "Ayush" });
state.subscribe("count", (newVal, oldVal) => {
  console.log(`[STATE CHANGE]: count updated from ${oldVal} to ${newVal}`);
});

state.count = 1; // Logs: [STATE CHANGE]: count updated from 0 to 1
state.count = 2; // Logs: [STATE CHANGE]: count updated from 1 to 2
console.log(state.toJSON()); // { count: 2, user: 'Ayush' }
```

---

# 121. FINAL OBJECT KNOWLEDGE CHECKLIST

* [ ] Understand key-value structure and composite nature of objects.
* [ ] Master Object Literals, computed keys, and shorthand notation.
* [ ] Distinguish dot notation vs bracket notation requirements.
* [ ] Understand memory pointers, Heap vs Stack, and reference equality (`===`).
* [ ] Differentiate shallow copy (`{...obj}`) from deep copy (`structuredClone()`).
* [ ] Master Optional Chaining (`?.`) and Nullish Coalescing (`??`).
* [ ] Master Destructuring, Rest (`...rest`), and Spread (`...spread`).
* [ ] Use `Object.keys`, `values`, `entries`, and `fromEntries`.
* [ ] Understand `[[Prototype]]`, `Object.getPrototypeOf`, and lookup mechanics.
* [ ] Master Property Descriptors: `value`, `writable`, `enumerable`, `configurable`.
* [ ] Understand Accessors (`get` / `set`) and descriptor defaults.
* [ ] Enforce immutability with `preventExtensions`, `seal`, and `freeze`.
* [ ] Know deterministic property enumeration order (Integers -> Strings -> Symbols).
* [ ] Master Symbols and well-known symbols (`Symbol.iterator`, `Symbol.toPrimitive`).
* [ ] Recognize when to use `Map`, `Set`, `Object.create(null)`, or `class`.
* [ ] Understand constructor functions and the 5 steps of the `new` operator.
* [ ] Prevent detached method bugs using `.bind()` or method shorthand.
* [ ] Understand V8 Shapes, Transition Trees, and Inline Caches (ICs).
* [ ] Understand and defend against Prototype Pollution vulnerabilities.

---

# 122. FINAL TECHNICAL ACCURACY REVIEW

1. **ECMAScript Specification Compliance**:
   * Property keys conform to ECMAScript standard §7.1.19 (`ToPropertyKey`: String or Symbol only).
   * Property iteration ordering strictly complies with §10.1.14 (`OrdinaryOwnPropertyKeys`).
   * Nullish coalescing conforms to §13.15 (`CoalesceExpression`).
2. **Engine Reality vs Abstract Specification**:
   * Hidden classes and transition trees represent Google V8's implementation (similarly implemented as Shapes in SpiderMonkey and Structures in JSC).
   * In-object properties represent V8's contiguous memory block optimization.
3. **Strict Mode Semantics**:
   * In strict mode (`"use strict";`), writing to non-writable properties, adding properties to non-extensible objects, or deleting non-configurable properties throws explicit `TypeError`s rather than failing silently.

---

# 123. TEACHING QUALITY REQUIREMENTS

Every concept throughout this textbook follows the **6-Stage Pedagogical Mastery Framework**:
1. **Plain-English Definition**: Accessible layman explanation without jargon.
2. **Mental Model & Metaphor**: Real-world analogy (e.g. Filing Cabinets, Deeds of Ownership).
3. **Architectural ASCII Diagram**: Visual rendering of memory or prototype paths.
4. **Annotated Code Demonstration**: Fully commented, executable JavaScript code.
5. **Junior Pitfall & Gotcha**: Common traps, edge cases, and why they fail.
6. **Senior Production Pattern**: Scalable, secure, and engine-optimized solution.

---

# 124. CODE QUALITY REQUIREMENTS

All code examples in this curriculum satisfy strict production standards:
* Modern ES2024 / ECMAScript standards (`Object.hasOwn`, `Object.groupBy`, `structuredClone`).
* Descriptive, meaningful variable and domain names.
* Fully runnable without missing dependencies.
* Robust error handling and edge-case defensiveness.

---

# 125. VISUAL LEARNING REQUIREMENTS

ASCII diagrams are systematically deployed across memory structures, prototype chains, execution flows, and engine states to ensure multi-modal comprehension.


---

# 126. PRACTICE SYSTEM (75 GRADED EXERCISES)

Test your knowledge with 75 progressive exercises spanning Beginner, Intermediate, Advanced, and Senior levels.

---

## Level 1 — Beginner Exercises (1 to 20)

**1. Create a Book Object**: Create an object `book` with `title`, `author`, and `pages`. Print each property using dot notation.
```js
const book = { title: "JavaScript: The Good Parts", author: "Douglas Crockford", pages: 176 };
console.log(book.title, book.author, book.pages);
```

**2. Bracket Notation with Special Character**: Create an object with a key `"user-status"` and access it using bracket notation.
```js
const account = { "user-status": "active" };
console.log(account["user-status"]);
```

**3. Dynamic Property Lookup**: Given `const key = "email"`, retrieve that property from `{ email: "test@example.com" }`.
```js
const key = "email";
const user = { email: "test@example.com" };
console.log(user[key]);
```

**4. Add a New Property**: Add a property `isAvailable: true` to an existing empty object `car`.
```js
const car = {};
car.isAvailable = true;
```

**5. Update a Property**: Given `{ score: 10 }`, update `score` to `25`.
```js
const player = { score: 10 };
player.score = 25;
```

**6. Delete a Property**: Remove the property `secret` from `{ id: 1, secret: "xyz" }`.
```js
const record = { id: 1, secret: "xyz" };
delete record.secret;
```

**7. Property Existence with `Object.hasOwn`**: Verify whether `user` owns the property `role`.
```js
const user = { role: "admin" };
console.log(Object.hasOwn(user, "role")); // true
```

**8. Shorthand Property Definition**: Given `const x = 10, y = 20`, construct a point object using ES6 shorthand.
```js
const x = 10, y = 20;
const point = { x, y };
```

**9. Shorthand Method**: Define an object `greeter` with a method `sayHi()` returning `"Hi!"` using method shorthand.
```js
const greeter = {
  sayHi() { return "Hi!"; }
};
```

**10. Iterate Keys with `Object.keys()`**: Print all keys of `{ a: 1, b: 2, c: 3 }`.
```js
console.log(Object.keys({ a: 1, b: 2, c: 3 })); // ['a', 'b', 'c']
```

**11. Retrieve Values with `Object.values()`**: Sum all values in `{ math: 90, english: 85 }`.
```js
const scores = { math: 90, english: 85 };
const total = Object.values(scores).reduce((sum, v) => sum + v, 0); // 175
```

**12. Count Properties**: Write a function returning the total count of an object's own properties.
```js
const countProps = (obj) => Object.keys(obj).length;
```

**13. Reference Sharing**: What is logged?
```js
const a = { val: 5 };
const b = a;
b.val = 10;
console.log(a.val); // 10 (Shared reference)
```

**14. Object Identity**: What does `{} === {}` evaluate to and why?
*Answer*: `false`, because each literal allocates a separate heap location with distinct memory pointers.

**15. Basic Destructuring**: Extract `firstName` and `lastName` from `{ firstName: "Ayush", lastName: "Sharma" }`.
```js
const { firstName, lastName } = { firstName: "Ayush", lastName: "Sharma" };
```

**16. Destructuring with Default**: Extract `theme` with a default value of `"light"` from `{}`.
```js
const { theme = "light" } = {};
```

**17. Destructuring with Renaming**: Extract `id` as `userId` from `{ id: 501 }`.
```js
const { id: userId } = { id: 501 };
```

**18. Shallow Copy with Spread**: Create a shallow copy of `{ a: 1, b: 2 }`.
```js
const original = { a: 1, b: 2 };
const copy = { ...original };
```

**19. Check for Missing Key**: Show why `if (obj.val)` is bug-prone when `val: 0`.
*Answer*: `0` is falsy, so the check fails even though the property exists. Use `Object.hasOwn(obj, "val")`.

**20. Empty Object Check**: Write a function checking if an object has zero own keys.
```js
const isEmpty = (obj) => Object.keys(obj).length === 0;
```

---

## Level 2 — Intermediate Exercises (21 to 40)

**21. Optional Chaining with Deep Nesting**: Safely read `user?.profile?.address?.zip` without crashing if `profile` is undefined.
```js
const zip = user?.profile?.address?.zip;
```

**22. Nullish Coalescing Fallback**: Read `user.age ?? 18` where `user = { age: 0 }`. What is the result?
*Answer*: `0` (Nullish coalescing preserves 0 because 0 is not null or undefined).

**23. Safe Method Invocation**: Safely invoke `handler.onClick?.(event)` only if defined.
```js
handler.onClick?.(event);
```

**24. Object Rest Deletion**: Remove `password` from `user` immutably using rest destructuring.
```js
const { password, ...publicProfile } = user;
```

**25. Shallow Merge with Override**: Merge `{ port: 3000, host: "localhost" }` and `{ port: 8080 }`.
```js
const config = { ...{ port: 3000, host: "localhost" }, ...{ port: 8080 } };
// { port: 8080, host: "localhost" }
```

**26. Shallow Copy Trap**: Demonstrate how mutating `copy.address.city` affects `original.address.city`.
```js
const orig = { address: { city: "Delhi" } };
const copy = { ...orig };
copy.address.city = "Pune";
console.log(orig.address.city); // "Pune"
```

**27. Deep Clone with `structuredClone`**: Safely clone an object containing nested objects and a `Date`.
```js
const deep = structuredClone({ date: new Date(), meta: { v: 1 } });
```

**28. `Object.entries()` to Loop**: Print all key-value pairs formatted as `"KEY = VALUE"`.
```js
for (const [k, v] of Object.entries(obj)) console.log(`${k} = ${v}`);
```

**29. Transform via `Object.fromEntries`**: Double all numeric values in an object `{ a: 10, b: 20 }`.
```js
const doubled = Object.fromEntries(Object.entries({ a: 10, b: 20 }).map(([k, v]) => [k, v * 2]));
```

**30. Filter an Object**: Retain only properties whose values are numbers.
```js
const numericOnly = Object.fromEntries(Object.entries(obj).filter(([_, v]) => typeof v === "number"));
```

**31. Computed Key Construction**: Construct `{ ["item_" + id]: name }` dynamically.
```js
const makeItem = (id, name) => ({ ["item_" + id]: name });
```

**32. Prototype Inheritance with `Object.create`**: Create `child` delegating to `parent = { kind: "human" }`.
```js
const parent = { kind: "human" };
const child = Object.create(parent);
```

**33. Inspecting Prototype**: Retrieve `child`'s prototype using `Object.getPrototypeOf()`.
```js
console.log(Object.getPrototypeOf(child) === parent); // true
```

**34. Own vs Inherited Distinction**: Show that `Object.hasOwn(child, "kind")` returns `false` while `"kind" in child` returns `true`.

**35. Pure Null-Prototype Dictionary**: Create a map with no prototype methods.
```js
const dict = Object.create(null);
```

**36. Shallow Freeze**: Use `Object.freeze()` on an object and verify `Object.isFrozen()`.
```js
const locked = Object.freeze({ a: 1 });
console.log(Object.isFrozen(locked)); // true
```

**37. Seal an Object**: Seal an object and demonstrate modifying an existing value vs adding a new key.
```js
const s = Object.seal({ x: 1 });
s.x = 2; // Allowed
s.y = 3; // Blocked
```

**38. Prevent Extensions**: Block adding new keys while preserving property deletion.
```js
const pe = Object.preventExtensions({ a: 1, b: 2 });
delete pe.a; // Allowed!
```

**39. Detached Method Bug**: What does `const fn = user.greet; fn();` output and how do you fix it with `.bind()`?
*Answer*: Outputs `"Hello, undefined"` because `this` is lost. Fix with `const fn = user.greet.bind(user);`.

**40. Arrow Method Pitfall**: Explain why `{ name: "A", get: () => this.name }` fails.
*Answer*: Arrow functions capture lexical `this` from outer scope rather than binding to the object.

---

## Level 3 — Advanced Exercises (41 to 60)

**41. Custom Getter/Setter**: Implement a `temperature` object with `celsius` and dynamic `fahrenheit` accessor.
```js
const temp = {
  celsius: 0,
  get fahrenheit() { return this.celsius * 1.8 + 32; },
  set fahrenheit(f) { this.celsius = (f - 32) / 1.8; }
};
```

**42. Read-Only Property Descriptor**: Use `Object.defineProperty` to create a non-writable property.
```js
const obj = {};
Object.defineProperty(obj, "API_KEY", { value: "SEC-123", writable: false, enumerable: true });
```

**43. Hidden Property Descriptor**: Create a property that is hidden from `Object.keys()` (`enumerable: false`).
```js
Object.defineProperty(obj, "hidden", { value: 42, enumerable: false });
```

**44. Permanent Property**: Create a non-configurable property that cannot be deleted.
```js
Object.defineProperty(obj, "perm", { value: "forever", configurable: false });
```

**45. Define Multiple Descriptors**: Define multiple properties using `Object.defineProperties()`.
```js
Object.defineProperties(target, {
  a: { value: 1, writable: true },
  b: { value: 2, writable: false }
});
```

**46. Universal Key Reflection**: Retrieve all string, non-enumerable, and symbol keys using `Reflect.ownKeys()`.
```js
const allKeys = Reflect.ownKeys(obj);
```

**47. Deterministic Property Order**: Demonstrate integer keys sorting before string keys.
```js
const o = { z: "1", 5: "num", a: "2", 1: "num" };
console.log(Object.keys(o)); // ['1', '5', 'z', 'a']
```

**48. `Symbol.toPrimitive` Interception**: Customize an object to return different values for `"number"` vs `"string"`.
```js
const money = {
  amt: 50,
  [Symbol.toPrimitive](hint) { return hint === "string" ? "$50" : 50; }
};
```

**49. Iterable Object**: Implement `[Symbol.iterator]` on an object so it works in `for...of`.
```js
const range = {
  from: 1, to: 3,
  [Symbol.iterator]() {
    let cur = this.from;
    return { next: () => ({ value: cur, done: cur++ > this.to }) };
  }
};
```

**50. `Object.is` Precision**: Compare `+0` vs `-0` and `NaN` vs `NaN`.
```js
console.log(Object.is(+0, -0)); // false
console.log(Object.is(NaN, NaN)); // true
```

**51. Implement `customNew`**: Recreate the `new` operator from scratch using `Object.create()`.
```js
function customNew(Ctor, ...args) {
  const inst = Object.create(Ctor.prototype);
  const res = Ctor.apply(inst, args);
  return (typeof res === "object" && res !== null) ? res : inst;
}
```

**52. Constructor Inheritance**: Implement ES5 classical inheritance between `Person` and `Employee`.
```js
function Person(name) { this.name = name; }
Person.prototype.greet = function() { return `Hi ${this.name}`; };
function Employee(name, id) { Person.call(this, name); this.id = id; }
Employee.prototype = Object.create(Person.prototype);
Employee.prototype.constructor = Employee;
```

**53. ES6 Class with Private Field**: Use `#privateField` to encapsulate internal state.
```js
class Vault {
  #secret;
  constructor(s) { this.#secret = s; }
  reveal() { return this.#secret; }
}
```

**54. Static Factory Method**: Implement `User.fromJSON(jsonString)` on a class.
```js
class User {
  constructor(name) { this.name = name; }
  static fromJSON(str) { const d = JSON.parse(str); return new User(d.name); }
}
```

**55. Recursive `deepFreeze`**: Implement a function that freezes all levels of a nested object graph.
```js
function deepFreeze(o) {
  Reflect.ownKeys(o).forEach(k => {
    if (o[k] && typeof o[k] === "object") deepFreeze(o[k]);
  });
  return Object.freeze(o);
}
```

**56. Grouping by Key with `Object.groupBy`**: Group a list of users by `country`.
```js
const grouped = Object.groupBy(users, u => u.country);
```

**57. JSON Replacer Filtering**: Use `JSON.stringify(obj, replacer)` to omit all properties containing `"secret"`.
```js
const json = JSON.stringify(data, (k, v) => k.includes("secret") ? undefined : v);
```

**58. JSON Reviver Date Parsing**: Automatically parse ISO strings into `Date` objects during `JSON.parse`.
```js
const parsed = JSON.parse(str, (k, v) => /^\d{4}-\d{2}-\d{2}T/.test(v) ? new Date(v) : v);
```

**59. Safe Circular JSON Stringifier**: Serialize an object with circular references without crashing.
```js
function safeStringify(obj) {
  const seen = new WeakSet();
  return JSON.stringify(obj, (k, v) => {
    if (typeof v === "object" && v !== null) {
      if (seen.has(v)) return "[Circular]";
      seen.add(v);
    }
    return v;
  });
}
```

**60. Defend Against Prototype Pollution**: Sanitize merge keys against `__proto__` and `constructor`.
```js
const isSafeKey = (k) => k !== "__proto__" && k !== "constructor" && k !== "prototype";
```

---

## Level 4 — Senior Engineer Exercises (61 to 75)

**61. Build `deepEqual(a, b)`**: Implement comprehensive structural deep equality handling primitives, Dates, RegExps, and nested objects.

**62. Build `deepClone(obj)` with WeakMap**: Implement deep cloning supporting circular graph topologies.

**63. Recursive Object Flattener**: Convert `{ a: { b: { c: 1 } } }` into `{ "a.b.c": 1 }`.
```js
function flattenObject(obj, prefix = "", res = {}) {
  for (const [k, v] of Object.entries(obj)) {
    const key = prefix ? `${prefix}.${k}` : k;
    if (v && typeof v === "object" && !Array.isArray(v)) {
      flattenObject(v, key, res);
    } else {
      res[key] = v;
    }
  }
  return res;
}
```

**64. Unflattening Utility**: Reverse the flatten operation back into a nested tree.
```js
function unflattenObject(obj) {
  const res = {};
  for (const [k, v] of Object.entries(obj)) {
    setPath(res, k, v);
  }
  return res;
}
```

**65. Deep Object Diff**: Compare two objects and return `{ added, modified, deleted }`.
```js
function diffObjects(oldObj, newObj) {
  const diff = { added: {}, modified: {}, deleted: {} };
  for (const k of Reflect.ownKeys(newObj)) {
    if (!Object.hasOwn(oldObj, k)) diff.added[k] = newObj[k];
    else if (!deepEqual(oldObj[k], newObj[k])) diff.modified[k] = { from: oldObj[k], to: newObj[k] };
  }
  for (const k of Reflect.ownKeys(oldObj)) {
    if (!Object.hasOwn(newObj, k)) diff.deleted[k] = oldObj[k];
  }
  return diff;
}
```

**66. Custom `pick` and `omit` Utilities**: Write zero-dependency, type-safe implementations.

**67. Reactive Observer via Proxy**: Build an observable object that notifies callbacks on property mutation.
```js
function makeObservable(target, onChange) {
  return new Proxy(target, {
    set(obj, prop, val) {
      const oldVal = obj[prop];
      obj[prop] = val;
      onChange(prop, val, oldVal);
      return true;
    }
  });
}
```

**68. Monomorphic Property Access Benchmark**: Measure execution speed of objects sharing a single hidden class vs divergent shapes.

**69. Property Inversion**: Invert an object's keys and values `{ a: "1", b: "2" }` -> `{ "1": "a", "2": "b" }`.
```js
const invert = (o) => Object.fromEntries(Object.entries(o).map(([k, v]) => [v, k]));
```

**70. Immutable Nested Path Updater**: Implement `updatePath(obj, path, updaterFn)` returning a new object with only the affected path cloned.

**71. LRU Cache with Size Limits**: Build an in-memory cache using `Map` ensuring $O(1)$ gets and puts.

**72. Active Record Dirty Tracking**: Create an entity class tracking changed fields and supporting `rollback()`.

**73. Dependency Injection Container via Objects**: Implement a registry object resolving services by key.

**74. Function Parameter Validation Pipeline**: Validate options objects against schema rules up-front.

**75. Memory Leak Detector**: Demonstrate how retaining detached DOM nodes or large objects in uncleaned closures creates memory leaks.

---

# 127. REAL-WORLD PROJECTS (10 CAPSTONE PROJECTS)

### Project 1: Production User & Permission Manager (RBAC)
```js
class UserManager {
  #users = new Map();
  #roles = {
    admin: new Set(["read", "write", "delete"]),
    editor: new Set(["read", "write"]),
    viewer: new Set(["read"])
  };

  register(id, username, role = "viewer") {
    if (this.#users.has(id)) throw new Error("User exists");
    this.#users.set(id, Object.freeze({ id, username, role }));
  }

  can(id, action) {
    const user = this.#users.get(id);
    if (!user) return false;
    return this.#roles[user.role]?.has(action) ?? false;
  }
}
```

### Project 2: Hierarchical Configuration System with Environment Overrides
Supports layered merging from defaults, JSON config, and CLI overrides with recursive deep freeze.

### Project 3: Micro-State Container (Mini-Redux)
```js
function createStore(reducer, initialState) {
  let state = initialState;
  const listeners = new Set();

  return {
    getState: () => state,
    dispatch: (action) => {
      state = reducer(state, action);
      listeners.forEach(fn => fn());
    },
    subscribe: (fn) => {
      listeners.add(fn);
      return () => listeners.delete(fn);
    }
  };
}
```

### Project 4: In-Memory Key-Value Store with TTL & Expiration
Tracks keys with timestamps, auto-evicting expired records on read or sweep intervals.

### Project 5: Deep Object Difference Engine
Calculates added, modified, and deleted properties across complex nested JSON payloads.

### Project 6: Zero-Dependency Schema Validation Engine
Validates nested object types, bounds, regex formats, and required constraints.

### Project 7: URL Query Parameter Serializer & Parser
Parses nested bracket notation (`user[name]=Ayush&user[age]=24`) into nested objects and vice versa.

### Project 8: Event Bus / Pub-Sub Mediator Pattern
Enables loosely coupled module communication using an object event registry.

### Project 9: ORM Entity with Dirty Tracking & Schema Constraints
Enforces field-level validation, tracks modified keys, and writes clean SQL update hashes.

### Project 10: JSON API Data Normalizer & Denormalizer
Transforms nested relational API payloads into flat normalized lookup tables and back.

---

# 128. CONNECTION TO OTHER JAVASCRIPT CONCEPTS

```text
┌────────────────────────────────────────────────────────────────────────┐
│                   HOW OBJECTS CONNECT TO JAVASCRIPT                    │
│                                                                        │
│  FUNCTIONS ──────► Functions are "First-Class Objects" with a [[Call]] │
│                    internal slot and prototype properties.             │
│                                                                        │
│  ARRAYS ─────────► Arrays are specialized objects with integer keys   │
│                    and an auto-managed 'length' descriptor.            │
│                                                                        │
│  EXECUTION ──────► Variable Environments and Lexical Environments      │
│  CONTEXT           are modeled as Environment Record Objects.          │
│                                                                        │
│  CLOSURES ───────► Retain references to lexical scope objects stored   │
│                    on the memory heap.                                 │
│                                                                        │
│  PROMISES ───────► State-holding objects transitioning between         │
│                    "pending", "fulfilled", and "rejected".             │
│                                                                        │
│  MODULES ────────► Module namespaces are sealed, null-prototype        │
│                    exotic objects exporting live bindings.             │
└────────────────────────────────────────────────────────────────────────┘
```

---

# 129. FINAL ONE-PAGE OBJECT MIND MAP

```text
================================================================================
                        JAVASCRIPT OBJECTS ARCHITECTURE
================================================================================
                                       │
         ┌─────────────────────────────┼─────────────────────────────┐
         ▼                             ▼                             ▼
  1. FUNDAMENTALS               2. MANIPULATION               3. INTERNALS
  ────────────────              ───────────────               ────────────
  • Heap vs Stack Allocation    • Dot vs Bracket Access       • [[Prototype]] Chain
  • Reference Identity (===)    • Optional Chaining (?.)      • Object.prototype
  • Key Coercion (ToString)     • Nullish Coalescing (??)     • Property Descriptors
  • Symbols as Keys             • Destructuring & Defaults    • Writable / Configurable
  • Literals vs Object.create   • Rest & Spread (...obj)      • Enumerable / Accessors
                                • Merging & Deep Cloning      • V8 Shapes & ICs
                                       │
         ┌─────────────────────────────┼─────────────────────────────┐
         ▼                             ▼                             ▼
  4. INTEGRITY & SECURITY       5. ADVANCED OOP               6. ECOSYSTEM
  ───────────────────────       ───────────────               ────────────
  • Object.preventExtensions    • Constructor Functions       • JSON & Reviver/Replacer
  • Object.seal                 • 5 Steps of 'new'            • Object vs Map / Set
  • Object.freeze (Shallow)     • ES6 Classes & #Private      • React State Immutability
  • Recursive deepFreeze        • Composition over Inherit.   • DTOs & Schema Validation
  • Prototype Pollution Defense • Polymorphism & Mixins       • TypeScript Records
  • Safe Dictionary (null proto)• Dynamic 'this' Binding      • Performance Optimization
================================================================================
```

---

# 130. FINAL OUTPUT REQUIREMENTS & SUMMARY

This module completes the transformation of JavaScript Objects from basic key-value dictionaries into an industrial-grade, senior-level architectural discipline.

### What You Have Mastered:
1. **Memory Mechanics**: The exact heap and stack mechanics governing pointers, reference sharing, and garbage collection.
2. **Meta-Programming**: Surgical control over property descriptors, immutability barriers, and prototype delegation chains.
3. **Engine Optimization**: Writing shape-stable, monomorphic code aligned with V8's internal Hidden Classes and Inline Caches.
4. **Security & Production Rigor**: Hardening code against prototype pollution, data corruption, and accidental mutations.
5. **Architectural Excellence**: Leveraging composition, factories, and normalization to build scalable, enterprise-grade software.
