# MODULE 11 — CLASSES, OOP PATTERNS & PRIVATE ENCAPSULATION
## The Exhaustive Engineering Guide from ES6 Class Desugaring to #private Field Brand Checks, Polymorphism, V8 Hidden Classes, and Enterprise Design Patterns

---

## TABLE OF CONTENTS
- [00. How to Use This Module & Conceptual Mind Map](#00-how-to-use-this-module--conceptual-mind-map)
- [01. The Genesis: Why ES6 Classes?](#01-the-genesis-why-es6-classes)
  - [1.1 The Perils of ES5 Pseudo-Classical Boilerplate](#11-the-perils-of-es5-pseudo-classical-boilerplate)
  - [1.2 Syntactic Unification: Standardization Across Runtimes](#12-syntactic-unification-standardization-across-runtimes)
- [02. Desugaring the ES6 Class](#02-desugaring-the-es6-class)
  - [2.1 What Babel Generates: The Internal [[Construct]] Mechanism](#21-what-babel-generates-the-internal-construct-mechanism)
  - [2.2 Why Class Methods are Non-Enumerable by Default](#22-why-class-methods-are-non-enumerable-by-default)
  - [2.3 Class Hoisting & The Temporal Dead Zone (TDZ)](#23-class-hoisting--the-temporal-dead-zone-tdz)
  - [2.4 Mandatory `new` Enforcement & `new.target`](#24-mandatory-new-enforcement--newtarget)
- [03. Modern Class Anatomy & Property Declarations](#03-modern-class-anatomy--property-declarations)
  - [3.1 Class Declarations vs. Class Expressions](#31-class-declarations-vs-class-expressions)
  - [3.2 The `constructor` Protocol & Default Constructors](#32-the-constructor-protocol--default-constructors)
  - [3.3 Public Class Fields & Instance Memory Footprint](#33-public-class-fields--instance-memory-footprint)
  - [3.4 Hard Private Fields (`#field`), Private Methods & Accessors](#34-hard-private-fields-field-private-methods--accessors)
  - [3.5 Static Fields, Methods & Static Initialization Blocks (`static {}`)](#35-static-fields-methods--static-initialization-blocks-static-)
  - [3.6 Getters, Setters & Property Invariants](#36-getters-setters--property-invariants)
- [04. Class Inheritance & Dynamic Polymorphism](#04-class-inheritance--dynamic-polymorphism)
  - [4.1 The `extends` Dual-Linkage Architecture](#41-the-extends-dual-linkage-architecture)
  - [4.2 The `super()` Constructor Protocol: Why `this` is TDZ Uninitialized](#42-the-super-constructor-protocol-why-this-is-tdz-uninitialized)
  - [4.3 `super.method()` & The Internal `[[HomeObject]]` Slot](#43-supermethod--the-internal-homeobject-slot)
  - [4.4 Method Overriding, Shadowing & Super Delegation](#44-method-overriding-shadowing--super-delegation)
  - [4.5 Abstract Base Classes via `new.target`](#45-abstract-base-classes-via-newtarget)
- [05. Classical OOP Design Patterns in Modern TypeScript/JavaScript](#05-classical-oop-design-patterns-in-modern-typescriptjavascript)
  - [5.1 Factory Method Pattern](#51-factory-method-pattern)
  - [5.2 Builder Pattern (Fluent API Architecture)](#52-builder-pattern-fluent-api-architecture)
  - [5.3 Strategy Pattern & Dependency Swapping](#53-strategy-pattern--dependency-swapping)
  - [5.4 Observer / PubSub Event-Driven Pattern](#54-observer--pubsub-event-driven-pattern)
  - [5.5 Class Mixin Factories (Composition over Multiple Inheritance)](#55-class-mixin-factories-composition-over-multiple-inheritance)
- [06. V8 Engine Internals: Hidden Classes, Transitions & Class Performance](#06-v8-engine-internals-hidden-classes-transitions--class-performance)
  - [6.1 Inline Field Initialization Order & Shape Stability](#61-inline-field-initialization-order--shape-stability)
  - [6.2 Monomorphic vs. Megamorphic Call-Sites in Method Dispatch](#62-monomorphic-vs-megamorphic-call-sites-in-method-dispatch)
  - [6.3 #private Field Storage Mechanics in V8 & Brand Checks](#63-private-field-storage-mechanics-in-v8--brand-checks)
- [07. Encapsulation Trade-offs: #private vs Symbols vs WeakMaps vs Closures](#07-encapsulation-trade-offs-private-vs-symbols-vs-weakmaps-vs-closures)
- [08. Production Architectural Anti-Patterns](#08-production-architectural-anti-patterns)
  - [Anti-Pattern 1: Unbound Method Detachment in Callbacks](#anti-pattern-1-unbound-method-detachment-in-callbacks)
  - [Anti-Pattern 2: God Classes & Over-Inheritance Fragility](#anti-pattern-2-god-classes--over-inheritance-fragility)
- [09. Architectural Decision Matrix: When to Use What](#09-architectural-decision-matrix-when-to-use-what)
- [10. Spec-Compliant Reference Algorithms & Polyfills](#10-spec-compliant-reference-algorithms--polyfills)
  - [Algorithm 1: Spec-Compliant Class Desugarer (`desugarClass`)](#algorithm-1-spec-compliant-class-desugarer-desugarclass)
  - [Algorithm 2: Private Field Brand Check Emulator Engine](#algorithm-2-private-field-brand-check-emulator-engine)
  - [Algorithm 3: Abstract Base Class Validator](#algorithm-3-abstract-base-class-validator)
  - [Algorithm 4: Industrial-Grade Class Mixin Compositor](#algorithm-4-industrial-grade-class-mixin-compositor)
- [11. 90 Comprehensive Interview Questions & Detailed Answers](#11-90-comprehensive-interview-questions--detailed-answers)
  - [11.1 Beginner Tier (Questions 1 to 20)](#111-beginner-tier-questions-1-to-20)
  - [11.2 Intermediate Tier (Questions 21 to 45)](#112-intermediate-tier-questions-21-to-45)
  - [11.3 Advanced Tier (Questions 46 to 70)](#113-advanced-tier-questions-46-to-70)
  - [11.4 Senior & Staff Tier (Questions 71 to 90)](#114-senior--staff-tier-questions-71-to-90)
- [12. 15 Tricky Output Prediction Puzzles with Execution Traces](#12-15-tricky-output-prediction-puzzles-with-execution-traces)
- [13. 4 Progressive Real-World Projects](#13-4-progressive-real-world-projects)
  - [Project 1: Enterprise Event-Driven Finite State Machine (FSM) Engine](#project-1-enterprise-event-driven-finite-state-machine-fsm-engine)
  - [Project 2: Pluggable Repository Pattern with Type-Safe Data Mapping](#project-2-pluggable-repository-pattern-with-type-safe-data-mapping)
  - [Project 3: Resilient HTTP Client SDK with Middleware Pipeline](#project-3-resilient-http-client-sdk-with-middleware-pipeline)
  - [Project 4: Micro-DI (Dependency Injection) IoC Container using Class Reflection](#project-4-micro-di-dependency-injection-ioc-container-using-class-reflection)
- [14. Production Best Practices: DOs and DON'Ts Matrix](#14-production-best-practices-dos-and-donts-matrix)
- [15. Real-World Case Study: The Broken Unbound Method Outage](#15-real-world-case-study-the-broken-unbound-method-outage)
- [16. 75 Practice Exercises Across 4 Tiers](#16-75-practice-exercises-across-4-tiers)
- [17. Module Summary & Key Invariants](#17-module-summary--key-invariants)

---

## 00. HOW TO USE THIS MODULE & CONCEPTUAL MIND MAP

### 🧠 The Core Architectural Invariant
> **The ES6 Class Invariant**: An ES6 class is not a new object-oriented runtime paradigm. It is **first-class syntactic sugar** layered atop JavaScript's prototypal delegation model, augmented by strict engine invariants: mandatory `new` enforcement, strict-mode execution, non-enumerable prototype methods, dual-linkage prototype inheritance, and hard lexical brand checks for private (`#`) identifiers.

```text
┌─────────────────────────────────────────────────────────────────────────────┐
│                            ES6 CLASS DUAL LINKAGE                           │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│   SuperClass (Constructor) ◄───────── [__proto__] ──────── SubClass        │
│        │                                                      │             │
│   [.prototype]                                           [.prototype]       │
│        ▼                                                      ▼             │
│   SuperClass.prototype     ◄───────── [__proto__] ──────── SubClass.prototype
│        ▲                                                      ▲             │
│        │ [[Prototype]]                                        │ [[Prototype]]
│        │                                                      │             │
│   superInstance                                          subInstance        │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 01. THE GENESIS: WHY ES6 CLASSES?

### 1.1 The Perils of ES5 Pseudo-Classical Boilerplate
Prior to ECMAScript 2015 (ES6), achieving object-oriented inheritance in JavaScript was notorious for human error. Developers had to manually coordinate four disparate operations:
1. Constructor function declaration.
2. Parent constructor invocation via `Super.call(this, ...args)`.
3. Prototype linking via `Object.create(Super.prototype)`.
4. Manual constructor property repair via `Sub.prototype.constructor = Sub`.

A single mistake—such as assigning `Sub.prototype = Super.prototype` (which mutates the superclass prototype) or forgetting `Object.defineProperty` for the constructor link—introduced critical subtle bugs:

```javascript
// The ES5 Pseudo-Classical Quagmire:
function Animal(name) {
  this.name = name;
}
Animal.prototype.speak = function() {
  return this.name + " makes a sound.";
};

function Dog(name, breed) {
  Animal.call(this, name); // 1. Must remember manual super call
  this.breed = breed;
}

// 2. Must allocate delegate prototype:
Dog.prototype = Object.create(Animal.prototype);

// 3. Must repair constructor (frequently forgotten!):
Dog.prototype.constructor = Dog;

// 4. Must define methods AFTER prototype linking:
Dog.prototype.bark = function() {
  return this.name + " barks.";
};
```

### 1.2 Syntactic Unification: Standardization Across Runtimes
ES6 introduced the `class` keyword to eliminate this fragile boilerplate and unify JavaScript object design with other enterprise languages (Java, C++, C#, Python), while preserving the dynamic flexibility of prototypal delegation under the hood:

```javascript
// The Clean ES6 Unification:
class Animal {
  constructor(name) {
    this.name = name;
  }
  speak() {
    return `${this.name} makes a sound.`;
  }
}

class Dog extends Animal {
  constructor(name, breed) {
    super(name); // Language guarantees execution before 'this' access
    this.breed = breed;
  }
  bark() {
    return `${this.name} barks.`;
  }
}
```

---

## 02. DESUGARING THE ES6 CLASS

### 2.1 What Babel Generates: The Internal [[Construct]] Mechanism
Under the hood, an ES6 class declaration is transformed into a specialized constructor function. However, unlike standard ES5 constructor functions, ES6 classes possess internal engine protections:

```text
┌─────────────────────────────────────────────────────────────────────────┐
│                      ES6 CLASS DESUGARING PIPELINE                      │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│   class User {                                                          │
│     constructor(name) { this.name = name; }                             │
│     greet() { return `Hello ${this.name}`; }                            │
│   }                                                                     │
│                                                                         │
│                           TRANSPILES TO:                                │
│                                                                         │
│   function User(name) {                                                 │
│     if (!(this instanceof User)) {                                      │
│       throw new TypeError("Class constructor User cannot be invoked");  │
│     }                                                                   │
│     this.name = name;                                                   │
│   }                                                                     │
│   Object.defineProperty(User.prototype, "greet", {                      │
│     value: function() { return "Hello " + this.name; },                 │
│     writable: true,                                                     │
│     enumerable: false, // Critical: Not enumerable in for..in!          │
│     configurable: true                                                  │
│   });                                                                   │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

### 2.2 Why Class Methods are Non-Enumerable by Default
In ES5, methods assigned to `Constructor.prototype.method = fn` had `enumerable: true` by default. This caused prototype methods to leak into `for...in` loops and `Object.keys()` across consumer code.

In ES6 classes, all methods declared within the class body are configured as **non-enumerable** (`enumerable: false`):

```javascript
class Account {
  deposit(amount) { this.balance += amount; }
}

const desc = Object.getOwnPropertyDescriptor(Account.prototype, "deposit");
console.log(desc.enumerable); // false!

const acc = new Account();
for (let key in acc) {
  console.log(key); // Never prints "deposit"
}
```

### 2.3 Class Hoisting & The Temporal Dead Zone (TDZ)
Unlike function declarations which are fully hoisted with their implementation during the Compilation Phase, **class declarations behave like `let` and `const`**:
- Their identifier is registered in the Lexical Environment during the Creation Phase.
- They remain uninitialized in the **Temporal Dead Zone (TDZ)** until execution reaches the class declaration statement.
- Accessing a class before its declaration throws a `ReferenceError`.

```javascript
try {
  const p = new Point(); // Throws ReferenceError: Cannot access 'Point' before initialization
} catch (e) {
  console.log(e.name); // "ReferenceError"
}

class Point {
  constructor(x = 0, y = 0) {
    this.x = x;
    this.y = y;
  }
}
```

### 2.4 Mandatory `new` Enforcement & `new.target`
Invoking an ES6 class without the `new` operator throws a `TypeError` immediately:

```javascript
class Service {}
// Service(); // TypeError: Class constructor Service cannot be invoked without 'new'
```

In the ECMAScript specification, ES6 classes lack a `[[Call]]` internal slot that permits function execution; they only implement `[[Construct]]`. Within the constructor, the meta-property `new.target` points directly to the constructor function invoked by `new`.



---

## 03. MODERN CLASS ANATOMY & PROPERTY DECLARATIONS

### 3.1 Class Declarations vs. Class Expressions
Similar to functions, classes can be declared either as statements or expressions:

```javascript
// 1. Class Declaration:
class DatabaseConnection {
  connect() { return "Connected"; }
}

// 2. Class Expression (Anonymous):
const CacheStore = class {
  get(key) { return null; }
};

// 3. Named Class Expression:
const Logger = class InternalLogger {
  log(msg) {
    // InternalLogger is accessible ONLY within the class body!
    console.log(InternalLogger.name, msg);
  }
};
```

### 3.2 The `constructor` Protocol & Default Constructors
Every class has a constructor. If you omit the constructor, the JavaScript engine supplies a default constructor:
- For base classes: `constructor() {}`
- For derived classes (`extends Super`): `constructor(...args) { super(...args); }`

Constructors implicitly return `this`. If you explicitly return a primitive (e.g. `return 42;`), the return value is ignored and `this` is returned. If you explicitly return an object (e.g. `return { custom: true };`), that object overrides the newly created instance.

### 3.3 Public Class Fields & Instance Memory Footprint
Public class fields (standardized in ES2022) allow declaring instance properties directly inside the class body without using `this.field = value` inside the constructor:

```javascript
class User {
  role = "standard"; // Attached directly to the instance, NOT on User.prototype!
  tokens = 100;

  constructor(name) {
    this.name = name;
  }
}

const u1 = new User("Alice");
console.assert(Object.hasOwn(u1, "role") === true);
console.assert(Object.hasOwn(User.prototype, "role") === false);
```

> [!WARNING]
> Defining arrow functions as public class fields (`handleClick = () => { ... }`) binds `this` automatically, but allocates a **brand new function closure for every single instance created**. For 100,000 instances, this consumes 100,000 function closures instead of sharing one method on the prototype!

### 3.4 Hard Private Fields (`#field`), Private Methods & Accessors
JavaScript provides true private encapsulation via the hash (`#`) prefix:
- Private fields are **lexically scoped** to the class body.
- They cannot be accessed, enumerated, or manipulated from outside the class.
- They are completely invisible to `Object.keys()`, `Object.getOwnPropertyNames()`, `Object.getOwnPropertySymbols()`, and `Reflect.ownKeys()`.

```javascript
class BankVault {
  #secretCode;
  #balance = 0;

  constructor(secretCode, initialDeposit) {
    this.#secretCode = secretCode;
    this.#balance = initialDeposit;
  }

  // Private method:
  #validateCode(code) {
    return this.#secretCode === code;
  }

  // Public API with encapsulated private access:
  withdraw(code, amount) {
    if (!this.#validateCode(code)) {
      throw new Error("Unauthorized access to vault");
    }
    if (amount > this.#balance) {
      throw new Error("Insufficient funds");
    }
    this.#balance -= amount;
    return this.#balance;
  }

  // Private getter & setter:
  get #auditLog() {
    return `Balance: ${this.#balance}`;
  }
}

const vault = new BankVault("1234-XYZ", 5000);
// vault.#balance; // SyntaxError: Private field '#balance' must be declared in an enclosing class
console.log(Reflect.ownKeys(vault)); // [] - No private keys revealed!
```

#### Private Field Brand Checks (`in` operator)
ES2022 added the `in` operator syntax to test whether an instance possesses a specific private field:

```javascript
class CryptoWallet {
  #privateKey = "0xABC123";

  static isCryptoWallet(obj) {
    return #privateKey in obj; // Returns true ONLY if obj is an instance of CryptoWallet!
  }
}

const wallet = new CryptoWallet();
const fake = { #privateKey: "hacked" }; // SyntaxError! Cannot declare external private field
console.log(CryptoWallet.isCryptoWallet(wallet)); // true
console.log(CryptoWallet.isCryptoWallet({})); // false
```

### 3.5 Static Fields, Methods & Static Initialization Blocks (`static {}`)
Static members belong to the class constructor function itself, not to its instances:

```javascript
class ConfigManager {
  static #defaultTimeout = 5000;
  static apiBaseUrl;

  // Static initialization block (ES2022):
  // Runs once when the class definition is evaluated by the engine!
  static {
    try {
      this.apiBaseUrl = process.env.API_URL || "https://api.internal.local";
    } catch {
      this.apiBaseUrl = "https://api.fallback.local";
    }
  }

  static getTimeout() {
    return this.#defaultTimeout;
  }
}

console.log(ConfigManager.apiBaseUrl); // Evaluated at class load time
```

### 3.6 Getters, Setters & Property Invariants
Getters and setters define accessor properties on the prototype:

```javascript
class Temperature {
  #celsius = 0;

  constructor(celsius) {
    this.celsius = celsius; // Triggers setter validation
  }

  get celsius() {
    return this.#celsius;
  }

  set celsius(value) {
    if (typeof value !== "number" || Number.isNaN(value)) {
      throw new TypeError("Temperature must be a valid number");
    }
    if (value < -273.15) {
      throw new RangeError("Temperature cannot fall below absolute zero (-273.15C)");
    }
    this.#celsius = value;
  }

  get fahrenheit() {
    return (this.#celsius * 9) / 5 + 32;
  }

  set fahrenheit(value) {
    this.celsius = ((value - 32) * 5) / 9;
  }
}
```

---

## 04. CLASS INHERITANCE & DYNAMIC POLYMORPHISM

### 4.1 The `extends` Dual-Linkage Architecture
When `class Derived extends Base` is evaluated, the JavaScript engine constructs **two distinct prototype links**:
1. **Instance Prototype Chain**: `Object.setPrototypeOf(Derived.prototype, Base.prototype)`
   - Allows instances of `Derived` to inherit methods from `Base.prototype`.
2. **Static Constructor Chain**: `Object.setPrototypeOf(Derived, Base)`
   - Allows `Derived` to inherit static methods directly from `Base`!

```javascript
class SuperService {
  static ping() { return "PONG"; }
  exec() { return "EXEC_SUPER"; }
}

class SubService extends SuperService {
  exec() { return "EXEC_SUB"; }
}

// 1. Instance prototype link:
console.assert(Object.getPrototypeOf(SubService.prototype) === SuperService.prototype);

// 2. Static prototype link (Constructor inheritance):
console.assert(Object.getPrototypeOf(SubService) === SuperService);
console.assert(SubService.ping() === "PONG"); // Static method inherited!
```

### 4.2 The `super()` Constructor Protocol: Why `this` is TDZ Uninitialized
In classical languages (C++, Java), the memory block for an object is allocated before constructor logic runs. In JavaScript derived classes, **the base constructor allocates `this`**:
- Derived constructors have an internal slot: `[[ConstructorKind]]: "derived"`.
- The identifier `this` is placed in a **Temporal Dead Zone (TDZ)** when entering the derived constructor.
- Calling `super(...args)` invokes the base constructor, which allocates the actual memory instance and binds it to `this`.
- Any reference to `this` before calling `super()` immediately throws a `ReferenceError: Must call super constructor in derived class before accessing 'this'`!

```javascript
class Parent {
  constructor(name) {
    this.name = name;
  }
}

class Child extends Parent {
  constructor(name, age) {
    // console.log(this.name); // ReferenceError! 'this' is in TDZ!
    super(name); // Allocates 'this' and binds Parent properties
    this.age = age; // Safe: 'this' is now initialized
  }
}
```

### 4.3 `super.method()` & The Internal `[[HomeObject]]` Slot
When calling `super.method()` inside a concise method, JavaScript does not use dynamic `this.__proto__` lookup (which would cause infinite recursion loops in multi-level hierarchies). Instead, the engine relies on the static internal slot `[[HomeObject]]`:
- Every concise method in a class or object literal gets a permanent `[[HomeObject]]` pointer to the object where the method was defined.
- `super` resolves dynamically as: `Object.getPrototypeOf(method.[[HomeObject]])`.
- The method call is then dispatched with the current `this`: `SuperMethod.call(this, ...args)`.

```javascript
class Shape {
  draw() { return "Drawing Shape"; }
}

class Circle extends Shape {
  draw() {
    return super.draw() + " -> Circle";
  }
}
```

### 4.4 Method Overriding, Shadowing & Super Delegation
A derived class can completely override a superclass method, or delegate back to the superclass implementation while decorating the result:

```javascript
class LoggerService {
  format(message) {
    return `[LOG]: ${message}`;
  }
}

class TimestampLoggerService extends LoggerService {
  format(message) {
    const baseFormatted = super.format(message);
    return `${new Date().toISOString()} ${baseFormatted}`;
  }
}
```

### 4.5 Abstract Base Classes via `new.target`
JavaScript does not have an `abstract` keyword, but you can enforce abstract classes at runtime using the `new.target` meta-property:

```javascript
class AbstractRepository {
  constructor() {
    if (new.target === AbstractRepository) {
      throw new TypeError("Cannot construct AbstractRepository instances directly");
    }
  }

  // Enforce contract on derived classes:
  findById(id) {
    throw new Error("Method 'findById()' must be implemented by derived class");
  }

  save(entity) {
    throw new Error("Method 'save()' must be implemented by derived class");
  }
}

class UserRepository extends AbstractRepository {
  findById(id) { return { id, name: "Admin" }; }
  save(entity) { return true; }
}

// new AbstractRepository(); // TypeError: Cannot construct AbstractRepository instances directly
const repo = new UserRepository(); // Works!
```

---

## 05. CLASSICAL OOP DESIGN PATTERNS IN MODERN TYPESCRIPT/JAVASCRIPT

### 5.1 Factory Method Pattern
Decouples client code from concrete class instantiation by delegating construction to a factory class or static factory method:

```javascript
class Notification {
  send(message) { throw new Error("Subclasses must implement send()"); }
}

class EmailNotification extends Notification {
  send(message) { return `Sending Email: ${message}`; }
}

class SMSNotification extends Notification {
  send(message) { return `Sending SMS: ${message}`; }
}

class NotificationFactory {
  static create(type) {
    switch (type.toLowerCase()) {
      case "email": return new EmailNotification();
      case "sms": return new SMSNotification();
      default: throw new Error(`Unknown notification type: ${type}`);
    }
  }
}
```

### 5.2 Builder Pattern (Fluent API Architecture)
Constructs complex, multi-parameter objects step-by-step through a chain of self-returning methods:

```javascript
class HttpRequest {
  #url = "";
  #method = "GET";
  #headers = new Map();
  #body = null;
  #timeout = 30000;

  setUrl(url) { this.#url = url; return this; }
  setMethod(method) { this.#method = method; return this; }
  addHeader(k, v) { this.#headers.set(k, v); return this; }
  setBody(body) { this.#body = body; return this; }
  setTimeout(ms) { this.#timeout = ms; return this; }

  build() {
    if (!this.#url) throw new Error("URL is mandatory");
    return Object.freeze({
      url: this.#url,
      method: this.#method,
      headers: Object.fromEntries(this.#headers),
      body: this.#body,
      timeout: this.#timeout
    });
  }
}
```

### 5.3 Strategy Pattern & Dependency Swapping
Defines a family of interchangeable algorithms, encapsulating each one in a class and making them dynamically swappable at runtime:

```javascript
class PaymentStrategy {
  pay(amount) { throw new Error("Abstract pay()"); }
}

class CreditCardStrategy extends PaymentStrategy {
  pay(amount) { return `Paid $${amount} via Credit Card`; }
}

class CryptoStrategy extends PaymentStrategy {
  pay(amount) { return `Paid $${amount} via Bitcoin`; }
}

class OrderCheckout {
  #strategy;
  constructor(strategy) { this.#strategy = strategy; }
  setStrategy(strategy) { this.#strategy = strategy; }
  process(amount) { return this.#strategy.pay(amount); }
}
```

### 5.4 Observer / PubSub Event-Driven Pattern
Establishes a one-to-many dependency where state changes in a Subject automatically notify and update subscribed Observers:

```javascript
class EventEmitterSubject {
  #listeners = new Map();

  subscribe(event, listener) {
    if (!this.#listeners.has(event)) {
      this.#listeners.set(event, new Set());
    }
    this.#listeners.get(event).add(listener);
    return () => this.#listeners.get(event)?.delete(listener); // Unsubscribe lambda
  }

  notify(event, payload) {
    const callbacks = this.#listeners.get(event);
    if (callbacks) {
      for (const cb of callbacks) cb(payload);
    }
  }
}
```

### 5.5 Class Mixin Factories (Composition over Multiple Inheritance)
JavaScript does not support multiple inheritance (`class C extends A, B` is illegal syntax). Mixin factories provide composable multi-inheritance behavior:

```javascript
const Timestampable = (Base) => class extends Base {
  createdAt = new Date();
  updatedAt = new Date();
  touch() { this.updatedAt = new Date(); }
};

const Serializable = (Base) => class extends Base {
  toJSON() {
    return JSON.stringify(this);
  }
};

class BaseRecord {
  constructor(id) { this.id = id; }
}

// Composed Class Hierarchy:
class DocumentModel extends Timestampable(Serializable(BaseRecord)) {
  constructor(id, title) {
    super(id);
    this.title = title;
  }
}

const doc = new DocumentModel("doc_101", "Architecture Blueprint");
console.assert(doc.id === "doc_101");
console.assert(doc.createdAt instanceof Date);
console.assert(typeof doc.toJSON === "function");
```



---

## 06. V8 ENGINE INTERNALS: HIDDEN CLASSES, TRANSITIONS & CLASS PERFORMANCE

### 6.1 Inline Field Initialization Order & Shape Stability
In V8, objects instantiated from the same class share a common **Hidden Class (Shape / Map)**:
- When public fields are initialized in the exact same syntactic order in the class body, every instance follows the identical transition tree:
  `Map0 -> (add 'id') -> Map1 -> (add 'name') -> Map2`.
- If developers dynamically inject ad-hoc properties outside the constructor or in varying order, the shapes diverge, forcing V8 into polymorphic or slow dictionary mode!

```javascript
// FAST: Unified class declaration guarantees identical property insertion order:
class Point {
  x = 0;
  y = 0;
  constructor(x, y) {
    this.x = x;
    this.y = y;
  }
}
// Both p1 and p2 share the exact same V8 Hidden Class Map:
const p1 = new Point(1, 2);
const p2 = new Point(3, 4);

// SLOW ANTI-PATTERN: Diverging shapes
if (Math.random() > 0.5) {
  p1.z = 10; // Transitions p1 to a new Shape (Map3), diverging from p2!
}
```

### 6.2 Monomorphic vs. Megamorphic Call-Sites in Method Dispatch
V8 compiles method invocations through **Inline Caches (ICs)**:
- **Monomorphic (1 Shape)**: TurboFan generates a direct machine code jump to the method offset (~1 CPU cycle).
- **Polymorphic (2–4 Shapes)**: Generates a small branch table of shape checks.
- **Megamorphic (5+ Shapes)**: Abandons inline caching; executes a dynamic hash table lookup on the prototype chain (~20-50x slower).

```javascript
function renderShape(shape) {
  // Call-site: shape.draw()
  // If only Circle is passed -> MONOMORPHIC (Extremely Fast)
  // If Circle, Square, Triangle, Hexagon, Octagon are passed -> MEGAMORPHIC (Slow)
  return shape.draw();
}
```

### 6.3 #private Field Storage Mechanics in V8 & Brand Checks
Private identifiers (`#field`) are **NOT** stored as normal property keys in the object's properties backing store:
- V8 allocates a hidden internal private name symbol (`PrivateSymbol`) accessible only within the class lexical scope.
- In addition, V8 installs a **Brand Symbol** on the instance during construction.
- Accessing `this.#field` first executes an internal **Brand Check** (verifying that the instance holds the class's brand). If the brand check succeeds, it accesses the private field offset with near-direct field performance!

---

## 07. ENCAPSULATION TRADE-OFFS: #PRIVATE VS SYMBOLS VS WEAKMAPS VS CLOSURES

| Mechanism | Privacy Level | Serialization (`JSON.stringify`) | Memory Cost | Reflection (`Reflect.ownKeys`) |
|:---|:---|:---|:---|:---|
| **Hard Private (`#field`)** | **Absolute (Hard)** | Excluded | Minimal (Fast V8 slot) | Completely Invisible |
| **`WeakMap` Storage** | **Hard** | Excluded | Extra Map overhead | Invisible outside module |
| **`Symbol` Properties** | **Soft (Convention)** | Excluded | Standard property slot | Exposed via `getOwnPropertySymbols()` |
| **Constructor Closures** | **Hard** | Excluded | $O(N)$ closures per instance | Completely Invisible |
| **Underscore (`_prop`)** | **None (Convention)** | Included | Standard property slot | Fully Visible & Mutable |

---

## 08. PRODUCTION ARCHITECTURAL ANTI-PATTERNS

### Anti-Pattern 1: Unbound Method Detachment in Callbacks
Passing a class method directly to an event listener or callback separates the function from its instance context (`this` becomes `undefined` in strict mode):

```javascript
class ServerPoller {
  #intervalId;
  poll() {
    console.log("Polling service...");
  }
  start() {
    // BUG: Unbound callback dispatches poll with this === undefined!
    // setInterval(this.poll, 1000); 

    // FIX: Arrow wrapper or explicit bind:
    this.#intervalId = setInterval(() => this.poll(), 1000);
  }
}
```

### Anti-Pattern 2: God Classes & Over-Inheritance Fragility
Creating deep, rigid inheritance hierarchies (e.g. `BaseComponent -> VisualComponent -> StatefulComponent -> InteractiveComponent -> Button`) produces severe coupling:
- Fragile Base Class Problem: Modifying a method in `BaseComponent` unexpectedly breaks `Button`.
- Prefer **composition and mixin pipelines** over deep (> 2 levels) inheritance hierarchies.

---

## 09. ARCHITECTURAL DECISION MATRIX: WHEN TO USE WHAT

| Architecture | Best Use Case | Performance | Memory Overhead | Encapsulation |
|:---|:---|:---|:---|:---|
| **ES6 Class** | Domain entities, stateful services, repositories, long-lived components | Fast (V8 Shapes + Monomorphic ICs) | Low (Shared prototype methods) | High (`#private`) |
| **Factory Functions** | Stateless pipelines, lightweight functional bags, closure-based encapsulation | Fast | Moderate ($O(N)$ closures) | High (Lexical closures) |
| **Object Literals** | Configuration, data DTOs, singletons, static maps | Fastest | Lowest | None (Fully public) |
| **Class Mixins** | Cross-cutting concerns (logging, metrics, timestamps, serialization) | Fast | Low | High |

---

## 10. SPEC-COMPLIANT REFERENCE ALGORITHMS & POLYFILLS

### Algorithm 1: Spec-Compliant Class Desugarer (`desugarClass`)
Replicates the ECMAScript engine's transformation of class declarations into strict constructor functions with non-enumerable methods and mandatory `new` guards.

```javascript
function desugarClass(className, constructorFn, protoMethods = {}, staticMethods = {}) {
  // 1. Mandatory new guard:
  function ClassConstructor(...args) {
    if (!(this instanceof ClassConstructor)) {
      throw new TypeError(`Class constructor ${className} cannot be invoked without 'new'`);
    }
    constructorFn.apply(this, args);
  }

  // Set function name:
  Object.defineProperty(ClassConstructor, "name", { value: className });

  // 2. Define non-enumerable prototype methods:
  for (const [key, fn] of Object.entries(protoMethods)) {
    Object.defineProperty(ClassConstructor.prototype, key, {
      value: fn,
      writable: true,
      enumerable: false, // Critical invariant!
      configurable: true
    });
  }

  // 3. Define non-enumerable static methods:
  for (const [key, fn] of Object.entries(staticMethods)) {
    Object.defineProperty(ClassConstructor, key, {
      value: fn,
      writable: true,
      enumerable: false,
      configurable: true
    });
  }

  return ClassConstructor;
}

// Verification:
const UserClass = desugarClass(
  "User",
  function(name) { this.name = name; },
  {
    greet() { return "Hello " + this.name; }
  },
  {
    createDefault() { return new UserClass("Default"); }
  }
);

const u = new UserClass("Bob");
console.assert(u.greet() === "Hello Bob", "Method dispatch works");
console.assert(Object.getOwnPropertyDescriptor(UserClass.prototype, "greet").enumerable === false, "Method is non-enumerable");
console.assert(UserClass.createDefault().name === "Default", "Static method works");
```

### Algorithm 2: Private Field Brand Check Emulator Engine
Implements the exact semantic behavior of private fields (`#field`) and brand checks (`#field in obj`) using `WeakMap` storage.

```javascript
function createPrivateField(fieldName) {
  const store = new WeakMap();

  return {
    init(instance, initialValue) {
      if (store.has(instance)) {
        throw new TypeError(`Cannot initialize '#${fieldName}' twice on the same object`);
      }
      store.set(instance, initialValue);
    },
    get(instance) {
      if (!store.has(instance)) {
        throw new TypeError(`Cannot read private member '#${fieldName}' from an invalid receiver`);
      }
      return store.get(instance);
    },
    set(instance, value) {
      if (!store.has(instance)) {
        throw new TypeError(`Cannot write private member '#${fieldName}' to an invalid receiver`);
      }
      store.set(instance, value);
    },
    has(instance) {
      return typeof instance === "object" && instance !== null && store.has(instance);
    }
  };
}

// Verification:
const _balance = createPrivateField("balance");
class SecureAccount {
  constructor(initial) {
    _balance.init(this, initial);
  }
  deposit(amt) {
    _balance.set(this, _balance.get(this) + amt);
  }
  getBalance() {
    return _balance.get(this);
  }
  static isAccount(obj) {
    return _balance.has(obj);
  }
}

const acc = new SecureAccount(500);
acc.deposit(200);
console.assert(acc.getBalance() === 700, "Private balance updated");
console.assert(SecureAccount.isAccount(acc) === true, "Brand check succeeds");
console.assert(SecureAccount.isAccount({}) === false, "Brand check rejects foreign object");
```

### Algorithm 3: Abstract Base Class Validator
Enforces abstract base class constraints and abstract method contracts at instantiation time.

```javascript
function enforceAbstract(instance, abstractClass, requiredMethods = []) {
  if (instance.constructor === abstractClass) {
    throw new TypeError(`Cannot construct abstract class '${abstractClass.name}' directly`);
  }
  for (const method of requiredMethods) {
    if (typeof instance[method] !== "function") {
      throw new TypeError(
        `Class '${instance.constructor.name}' must implement abstract method '${method}()'`
      );
    }
  }
}

// Verification:
class AbstractDriver {
  constructor() {
    enforceAbstract(this, AbstractDriver, ["connect", "disconnect"]);
  }
}

class PostgresDriver extends AbstractDriver {
  connect() { return true; }
  disconnect() { return true; }
}

class IncompleteDriver extends AbstractDriver {
  connect() { return true; }
}

console.assert(new PostgresDriver().connect() === true, "Valid concrete driver instantiated");
let threwAbstract = false;
try { new AbstractDriver(); } catch { threwAbstract = true; }
console.assert(threwAbstract, "Direct abstract instantiation blocked");

let threwIncomplete = false;
try { new IncompleteDriver(); } catch { threwIncomplete = true; }
console.assert(threwIncomplete, "Missing abstract method blocked");
```

### Algorithm 4: Industrial-Grade Class Mixin Compositor
Composes multiple class mixins into a single coherent class constructor hierarchy with type-safe delegation.

```javascript
function mix(BaseClass, ...mixins) {
  return mixins.reduce((currentBase, mixin) => mixin(currentBase), BaseClass);
}

// Verification:
const Activable = (B) => class extends B {
  isActive = true;
  deactivate() { this.isActive = false; }
};

const Auditable = (B) => class extends B {
  auditedAt = Date.now();
};

class CoreEntity {
  constructor(id) { this.id = id; }
}

class ComposedEntity extends mix(CoreEntity, Activable, Auditable) {
  constructor(id, tag) {
    super(id);
    this.tag = tag;
  }
}

const item = new ComposedEntity("item_1", "Production");
console.assert(item.id === "item_1", "Base id retained");
console.assert(item.isActive === true, "Activable mixin applied");
console.assert(typeof item.auditedAt === "number", "Auditable mixin applied");
item.deactivate();
console.assert(item.isActive === false, "Mixin method works");
```



---

## 11. 90 COMPREHENSIVE INTERVIEW QUESTIONS & DETAILED ANSWERS

### 11.1 Beginner Tier (Questions 1 to 20)

#### 1. What is an ES6 class in JavaScript?
**Answer**: An ES6 class is a syntactical construct introduced in ECMAScript 2015 that provides a cleaner, declarative syntax for object-oriented programming. Under the hood, it desugars to JavaScript's existing prototypal delegation model, creating a constructor function and attaching methods to its `.prototype`.

#### 2. Is an ES6 class a new object model or syntactic sugar?
**Answer**: It is syntactic sugar atop JavaScript's prototype chain. Instances created via `new MyClass()` are linked to `MyClass.prototype` via their `[[Prototype]]` internal slot, exactly like objects created via ES5 constructor functions. However, classes add engine-level semantics: mandatory `new` enforcement, strict mode execution, and non-enumerable prototype methods.

#### 3. How do you declare a class in JavaScript?
**Answer**: Using the `class` keyword followed by the class identifier and a body enclosed in curly braces:
```javascript
class User {
  constructor(name) {
    this.name = name;
  }
}
```

#### 4. What is the difference between a class declaration and a class expression?
**Answer**: A class declaration defines a named class statement (`class Foo {}`). A class expression defines a class inside an expression, either anonymous (`const Foo = class {}`) or named (`const Foo = class Bar {}`). Named class expressions bind their internal name only within the class body.

#### 5. Are class declarations hoisted in JavaScript?
**Answer**: Class declarations are hoisted during the Compilation Phase, but unlike function declarations, they are **not initialized**. They reside in the Temporal Dead Zone (TDZ) until the execution thread reaches the declaration statement, behaving identically to `let` and `const`.

#### 6. What happens if you instantiate a class before its declaration?
**Answer**: A `ReferenceError: Cannot access 'ClassName' before initialization` is thrown due to the Temporal Dead Zone (TDZ).

#### 7. What is the `constructor` method in a class?
**Answer**: The `constructor` is a special method used to initialize instance state when instantiated with `new`. A class may have at most one method named `constructor`; multiple constructor methods result in a `SyntaxError`.

#### 8. What is the default constructor if you do not define one?
**Answer**: 
- For a base class: `constructor() {}`
- For a derived class (`extends`): `constructor(...args) { super(...args); }`

#### 9. What happens if you call a class constructor without the `new` keyword?
**Answer**: A `TypeError: Class constructor ClassName cannot be invoked without 'new'` is thrown. The ECMAScript specification mandates that classes lack a `[[Call]]` internal slot and only implement `[[Construct]]`.

#### 10. How do you define a method on an ES6 class?
**Answer**: Using concise method syntax inside the class body:
```javascript
class Greeter {
  greet() {
    return "Hello";
  }
}
```

#### 11. Where do methods defined in a class body live in memory?
**Answer**: They are placed directly on the class's prototype object (`Greeter.prototype.greet`), ensuring all instances share a single function reference in memory.

#### 12. Are class prototype methods enumerable?
**Answer**: No. Methods defined inside an ES6 class body are automatically configured with `enumerable: false`. They will not appear in `for...in` loops or `Object.keys()`.

#### 13. What does the `extends` keyword do?
**Answer**: It sets up prototypal inheritance between two classes. It links the subclass prototype to the superclass prototype (`SubClass.prototype.__proto__ = SuperClass.prototype`) and links the subclass constructor to the superclass constructor (`SubClass.__proto__ = SuperClass`) to inherit static methods.

#### 14. What does the `super()` call do in a derived constructor?
**Answer**: It invokes the superclass constructor function, which allocates the instance memory block and initializes `this` for the derived class.

#### 15. Why must `super()` be called before accessing `this` in a derived class?
**Answer**: In derived classes, `this` remains uninitialized in the Temporal Dead Zone (TDZ) until `super()` completes and returns the allocated instance from the base constructor. Accessing `this` beforehand throws a `ReferenceError`.

#### 16. What is a public class field?
**Answer**: A property defined directly inside the class body outside any method (e.g. `count = 0;`). It is evaluated and assigned to the instance during construction.

#### 17. Where do public class fields live (on the instance or the prototype)?
**Answer**: On the **instance** itself. Every instantiated object gets its own distinct copy of public class fields as an own property.

#### 18. What is a static method in an ES6 class?
**Answer**: A method prefixed with the `static` keyword. It is attached directly to the class constructor function itself, not to the class prototype or instances.

#### 19. How do you invoke a static method?
**Answer**: Directly on the class constructor: `ClassName.staticMethod()`. Instances cannot invoke static methods via `instance.staticMethod()`.

#### 20. What does `this` refer to inside a static method?
**Answer**: `this` refers to the class constructor function itself (unless overridden via explicit binding like `call` or `apply`).

---

### 11.2 Intermediate Tier (Questions 21 to 45)

#### 21. What is a private class field (`#field`) and how does it work?
**Answer**: A private field begins with a hash (`#`) symbol. It provides true hard privacy enforced by the JavaScript engine. It is lexically scoped to the class body and cannot be accessed or inspected outside the class.

#### 22. Can private fields be accessed outside the class body?
**Answer**: No. Any syntactic attempt to access `obj.#field` outside the declaring class body throws a compilation `SyntaxError`.

#### 23. How do you check if an object has a private field?
**Answer**: Using the private field `in` operator syntax inside the class body: `#field in obj`. It evaluates to `true` if `obj` was constructed by this class and holds the private brand check.

#### 24. What is a private method (`#method()`) in an ES6 class?
**Answer**: A method prefixed with `#`. It can only be called from within methods of the same class using `this.#method()`.

#### 25. Can a subclass access private fields of its parent class?
**Answer**: No. Private members are private to the exact lexical class declaration that defined them. Subclasses cannot access private fields of their superclass.

#### 26. What is the difference between `#field` and `_field` (underscore)?
**Answer**: `_field` is merely a naming convention indicating intended privacy; it is fully public, accessible, and enumerable. `#field` is enforced hard privacy by the V8 runtime engine and completely inaccessible externally.

#### 27. What is a static initialization block (`static { ... }`)?
**Answer**: A block of code inside a class body prefixed with `static` that executes once when the class definition is evaluated by the engine. It has privileged access to private static fields.

#### 28. When do static initialization blocks run?
**Answer**: During the evaluation phase of the class declaration, before any instances of the class are constructed.

#### 29. Can static initialization blocks access private static fields?
**Answer**: Yes. Static blocks reside within the lexical scope of the class and can access and initialize both public and private static members.

#### 30. What is the meta-property `new.target`?
**Answer**: `new.target` is a meta-property available in all functions and constructors. In class constructors, it references the constructor function that was directly invoked with `new` (which in an inheritance chain is the derived subclass).

#### 31. How can you use `new.target` to simulate an abstract class?
**Answer**: By checking `if (new.target === AbstractClass) throw new TypeError("Cannot instantiate abstract class");` inside the base constructor.

#### 32. What happens if a constructor explicitly returns an object?
**Answer**: The returned object overrides the newly created instance and becomes the result of the `new` expression.

#### 33. What happens if a constructor explicitly returns a primitive value?
**Answer**: The primitive return value is ignored by the engine, and the newly created instance (`this`) is returned.

#### 34. What is the internal slot `[[HomeObject]]` and what is it used for?
**Answer**: `[[HomeObject]]` is an internal slot on concise methods pointing to the object or prototype where the method was defined. It is used by the engine to statically resolve `super` method lookups via `Object.getPrototypeOf(method.[[HomeObject]])`.

#### 35. How does `super.method()` resolve in an ES6 class?
**Answer**: It retrieves the method from the prototype of the current method's `[[HomeObject]]` and calls it with the current `this` binding: `Object.getPrototypeOf(method.[[HomeObject]])[prop].call(this, ...args)`.

#### 36. Can you use `super` inside an arrow function?
**Answer**: Yes. Arrow functions do not define their own `super` or `[[HomeObject]]`; they resolve `super` lexically from the enclosing concise method.

#### 37. What is the difference between an arrow function field and a prototype method?
**Answer**: An arrow function field (`fn = () => {}`) is allocated on every instance with `this` permanently bound to that instance. A prototype method (`fn() {}`) is allocated once on the class prototype and shared by all instances.

#### 38. What are the memory implications of defining arrow function methods inside a class?
**Answer**: High memory overhead. Creating 10,000 instances creates 10,000 separate closure instances instead of sharing a single function reference on the prototype.

#### 39. What is the prototype chain of an ES6 subclass constructor function?
**Answer**: `Object.getPrototypeOf(SubClass) === SuperClass`. This constructor-to-constructor prototype link is what allows static method inheritance.

#### 40. How do static methods get inherited in derived classes?
**Answer**: Through the constructor prototype chain: `DerivedClass.__proto__ === BaseClass`. When a static method is not found on `DerivedClass`, the engine searches `BaseClass`.

#### 41. Can you inherit from built-in constructors like `Array` or `Error` using `extends`?
**Answer**: Yes. ES6 classes support subclassing built-ins because the base constructor allocates the exotic object instance with all internal slots (e.g. `[[ArrayData]]`).

#### 42. What is species pattern (`Symbol.species`) in derived built-in classes?
**Answer**: A static accessor property that specifies the constructor function used by derived array methods (like `map`, `filter`, `slice`) to construct the return array.

#### 43. How do getters and setters work in an ES6 class?
**Answer**: Defined with `get propName() {}` and `set propName(val) {}`. They create accessor descriptors on the class prototype.

#### 44. Where are getters and setters defined (on instance or prototype)?
**Answer**: On the class **prototype** (`Class.prototype`), not on the instance.

#### 45. What happens if a class defines a getter without a setter in strict mode?
**Answer**: In strict mode (which classes always run under), attempting to assign a value to that property throws a `TypeError: Cannot set property which has only a getter`.



---

### 11.3 Advanced Tier (Questions 46 to 70)

#### 46. How does V8 optimize class method dispatch using Inline Caches?
**Answer**: V8 monitors method call-sites. When a call-site consistently encounters instances of the same class (monomorphic), V8 caches the memory offset of the method on the class prototype directly in the compiled machine code, bypassing prototype chain traversal entirely.

#### 47. What is the difference between monomorphic, polymorphic, and megamorphic class method calls?
**Answer**:
- **Monomorphic**: Exactly 1 class shape observed. Executes via a direct memory jump (~1 CPU cycle).
- **Polymorphic**: 2 to 4 class shapes observed. Executes via a small branch check table.
- **Megamorphic**: 5 or more shapes observed. Abandons inline caching and falls back to dynamic hash table lookup on the prototype chain (~20-50x slower).

#### 48. How does property declaration order impact V8 Hidden Classes?
**Answer**: V8 constructs Hidden Class transition trees based on property insertion order. If two instances initialize properties in different order, they will possess distinct Hidden Classes, degrading monomorphic call-sites into polymorphic or megamorphic states.

#### 49. What is the internal representation of private fields (`#field`) in V8?
**Answer**: V8 allocates internal private name symbols that are stored in a dedicated private fields slot on the object, indexed and guarded by a hidden Brand Symbol assigned to the object during construction.

#### 50. How do private brand checks work at the V8 engine level?
**Answer**: The expression `#field in obj` executes an internal brand check verifying whether `obj` contains the private name symbol for that specific class. If `obj` was constructed by another class or is a primitive, the engine returns `false` without throwing an error.

#### 51. Can you access private fields through a Proxy?
**Answer**: No. Proxies trap property accesses on their target, but private fields are resolved directly on the receiver. Accessing `proxy.#field` fails with a `TypeError: Cannot read private member #field from an object whose class did not declare it`, because the proxy is the receiver, not the underlying instance!

#### 52. Why do Proxies break `#private` fields and how do you fix it?
**Answer**: Because private fields enforce brand checks directly against the `receiver`. When accessing a method on a Proxy, the method receives `this === proxy`. To fix this, bind methods to the target instance or intercept the `get` trap in the Proxy to bind methods to the target: `return typeof prop === 'function' ? target[prop].bind(target) : Reflect.get(target, prop, receiver)`.

#### 53. What is the difference between `#private` fields and `WeakMap` private fields?
**Answer**: `#private` fields are a native language feature with engine-level optimization and direct syntax. `WeakMap` is a library pattern that works in older JS runtimes. Both provide true hard privacy, but `#private` fields avoid the overhead of map lookups.

#### 54. Can private fields be added dynamically at runtime?
**Answer**: No. Private fields must be statically declared inside the class body. They cannot be created dynamically using bracket notation or reflection APIs.

#### 55. Can a class have a private constructor?
**Answer**: Not through syntax alone, but you can simulate a private constructor using an internal token symbol or a static factory method:
```javascript
const internalToken = Symbol("PrivateConstructor");
class Singleton {
  constructor(token) {
    if (token !== internalToken) throw new Error("Constructor is private");
  }
  static getInstance() {
    return new Singleton(internalToken);
  }
}
```

#### 56. How do you implement a Singleton pattern using a private constructor or static factory?
**Answer**: Maintain a static private instance variable (`static #instance`) and expose a static `getInstance()` method:
```javascript
class Database {
  static #instance;
  #connected = false;
  constructor(token) {
    if (Database.#instance) return Database.#instance;
    Database.#instance = this;
  }
  static getInstance() {
    if (!Database.#instance) Database.#instance = new Database();
    return Database.#instance;
  }
}
```

#### 57. What is the difference between `class A extends null` and normal classes?
**Answer**: `class A extends null` creates a class whose prototype does not inherit from `Object.prototype` (`A.prototype.__proto__ === null`), creating a pure dictionary prototype.

#### 58. What is the prototype of `class A extends null`?
**Answer**: `Object.getPrototypeOf(A.prototype) === null`, and `Object.getPrototypeOf(A) === Function.prototype`.

#### 59. How do you instantiate `class A extends null` without throwing a `TypeError`?
**Answer**: Because `extends null` triggers derived constructor semantics (`[[ConstructorKind]]: "derived"`), you cannot call `super()` (as `null` is not a constructor). You must explicitly return an object from the constructor: `constructor() { return Object.create(null); }`.

#### 60. What happens if you define a method named `prototype` on a class?
**Answer**: Defining an instance method named `prototype` is valid and creates `Class.prototype.prototype`.

#### 61. What happens if you define a static method named `prototype` on a class?
**Answer**: A compile-time `SyntaxError: Classes may not have a static property named 'prototype'` is thrown, because `Constructor.prototype` is a non-configurable, non-writable property on all functions.

#### 62. What is the difference between `super()` in a constructor vs `super.method()`?
**Answer**: `super()` calls the parent constructor to allocate and initialize `this`. `super.method()` calls a specific method on the parent prototype resolved statically via the `[[HomeObject]]` internal slot, binding `this` to the current instance.

#### 63. Can you call `super` inside a static method?
**Answer**: Yes. Inside a static method, `super.method()` looks up the method on the superclass constructor function (`SuperClass.method`), because the `[[HomeObject]]` of a static method is the class constructor itself.

#### 64. What does `super.staticMethod()` resolve to?
**Answer**: It resolves to `Object.getPrototypeOf(CurrentClass)[staticMethod].call(this, ...args)`, delegating to the parent class's static method.

#### 65. How do ES6 classes handle generator methods and async methods?
**Answer**: By prefixing concise methods with `*` for generators (`*generate() {}`) or `async` for asynchronous methods (`async fetchData() {}`). They are attached to the prototype as generator or async functions.

#### 66. Can an ES6 class have an async constructor?
**Answer**: No. Constructors must synchronously return an object instance. Marking a constructor `async constructor()` throws a `SyntaxError: Class constructor may not be an async method`.

#### 67. How do you implement asynchronous initialization in a class pattern?
**Answer**: Use a private constructor coupled with an asynchronous static factory method:
```javascript
class Connection {
  #socket;
  constructor(socket) { this.#socket = socket; }
  static async create(url) {
    const socket = await openSocket(url);
    return new Connection(socket);
  }
}
```

#### 68. What is the Factory pattern and when should it be used over classes?
**Answer**: The Factory pattern is a creational pattern that wraps object instantiation inside a function. It should be used when the concrete class to instantiate depends on runtime configuration, when complex asynchronous initialization is required, or when returning different object implementations sharing a common interface.

#### 69. What is the Strategy pattern and how is it implemented using classes?
**Answer**: The Strategy pattern encapsulates interchangeable algorithms into separate classes conforming to a common interface. A context class holds a reference to a strategy instance and delegates work to it, allowing the algorithm to be swapped dynamically at runtime without altering the context.

#### 70. What is the Builder pattern and how does method chaining work with classes?
**Answer**: The Builder pattern separates the construction of a complex object from its representation. Methods configure internal state and return `this`, enabling a fluent API chain ending with a `.build()` method that validates and returns the final immutable product.

---

### 11.4 Senior & Staff Tier (Questions 71 to 90)

#### 71. How do you build an IoC (Inversion of Control) container using class reflection?
**Answer**: An IoC container registers class constructors and their dependencies. When resolving a class, it inspects metadata (or constructor parameter signatures), recursively resolves each dependency from the container, and instantiates the class via `Reflect.construct(TargetClass, resolvedArgs)`.

#### 72. What are TypeScript / TC39 Stage 3 Decorators on classes?
**Answer**: Decorators are functions that wrap or transform classes, methods, fields, or accessors at class definition time. They receive the target value and a context object (`{ kind, name, addInitializer, access }`) and return a replacement function or initializer.

#### 73. How does class field evaluation order work relative to constructor execution?
**Answer**: Base class public and private fields are evaluated and initialized immediately before the base class constructor body executes. In derived classes, fields are evaluated immediately upon returning from the `super()` call, before the derived constructor body executes.

#### 74. In what order do base class fields, derived class fields, and constructors execute?
**Answer**:
1. Base class field initializers execute.
2. Base class constructor body executes.
3. `super()` returns in the derived constructor.
4. Derived class field initializers execute.
5. Derived class constructor body executes.

#### 75. What is the exact execution timeline of a derived class instantiation?
**Answer**: Entering `new Derived()` sets `this` to uninitialized in TDZ. Evaluating `super()` delegates to `Base`. `Base` initializes its fields, runs its constructor, and returns the newly allocated object. Control returns to `Derived`, which initializes its own public and private fields, and finally executes the rest of the `Derived` constructor body.

#### 76. How do you implement safe serialization for classes with private fields?
**Answer**: Implement a `toJSON()` method on the class that explicitly maps internal private fields to a public plain JSON object representation:
```javascript
class User {
  #secretToken;
  #username;
  constructor(u, t) { this.#username = u; this.#secretToken = t; }
  toJSON() {
    return { username: this.#username }; // Omits #secretToken safely!
  }
}
```

#### 77. Why does `JSON.stringify(instance)` ignore `#private` fields and methods?
**Answer**: `JSON.stringify` relies on `for...in` or `Object.keys()` enumeration. Private identifiers (`#`) do not exist in the property backing store and cannot be reflected by any property enumeration APIs.

#### 78. How do you design an immutable Value Object using ES6 classes and `#private` fields?
**Answer**: Store all state in private fields, expose only getters (no setters), and freeze the instance in the constructor via `Object.freeze(this)`:
```javascript
class Money {
  #cents;
  #currency;
  constructor(cents, currency) {
    this.#cents = Object.freeze(cents);
    this.#currency = Object.freeze(currency);
    Object.freeze(this);
  }
  get cents() { return this.#cents; }
  get currency() { return this.#currency; }
  add(other) {
    if (this.#currency !== other.currency) throw new Error("Currency mismatch");
    return new Money(this.#cents + other.cents, this.#currency);
  }
}
```

#### 79. How do you build an Event-Driven Finite State Machine (FSM) class?
**Answer**: Maintain an internal state variable, a transition table mapping `(currentState, event) -> nextState`, and an event dispatcher emitting lifecycle hooks (`onEnter`, `onExit`, `onTransition`).

#### 80. What is the Fragile Base Class problem and how do mixins avoid it?
**Answer**: The Fragile Base Class problem occurs when base classes are modified, unintentionally breaking the behavior or invariants of subclasses. Mixins avoid this by decomposing behavior into small, composable, orthogonal traits that can be mixed in on-demand without deep coupling.

#### 81. How do you implement the Mixin pattern using subclass factories?
**Answer**: A mixin is a function taking a `Base` class and returning a class that `extends Base`:
```javascript
const Serializable = (Base) => class extends Base {
  serialize() { return JSON.stringify(this); }
};
```

#### 82. How do you prevent prototype pollution in class-based architectures?
**Answer**: Classes do not permit overriding `__proto__` via property assignment. To prevent pollution, sanitize all input keys before merging into instances, use `Object.freeze(Class.prototype)`, and validate schemas strictly before instantiation.

#### 83. How do you implement a Repository pattern with pluggable database drivers?
**Answer**: Create an abstract repository defining standard CRUD contracts. Concrete driver classes extend the repository or implement a common interface. The application interacts strictly with the repository abstraction, allowing drivers to be swapped via configuration.

#### 84. How do class definitions behave across multiple V8 execution realms (iframes/Worker threads)?
**Answer**: Each realm possesses its own distinct prototype trees and global scope. A class defined in Realm A is distinct from an identical class in Realm B. `instanceof` checks between realms fail because `instance.[[Prototype]] !== RealmBClass.prototype`.

#### 85. What happens if you evaluate two identical class declarations in different modules?
**Answer**: Modules have isolated lexical scopes. Each evaluation creates a distinct constructor function and prototype object in memory, even if their source text is 100% identical.

#### 86. Why does `instance instanceof Class` fail across realms and how do you build a cross-realm brand check?
**Answer**: `instanceof` compares exact prototype identity in memory. Cross-realm instances point to Prototype A, whereas the check evaluates against Prototype B. Use `Symbol.hasInstance` or private field brand checks with a shared symbol across realms.

#### 87. How does TurboFan optimize `new.target` checks in hot loops?
**Answer**: When TurboFan inlines a constructor call-site where the constructor is known at compile time, it statically folds `new.target` to a constant reference, eliminating the runtime meta-property check completely.

#### 88. What is the memory overhead of class inheritance chains vs flat object composition?
**Answer**: Class inheritance chains share methods across prototypes, consuming minimal memory ($O(1)$ per method). Deep inheritance, however, increases lookup time in megamorphic sites. Flat composition (copying methods) duplicates function pointers, increasing memory consumption by $O(N 	imes M)$.

#### 89. How do you trace and debug detached method calls in production logs?
**Answer**: Use the ESLint rule `@typescript-eslint/unbound-method` in CI/CD, wrap class methods in an auto-bind proxy or decorator, or capture error stack traces within strict mode to pinpoint call-sites where `this === undefined`.

#### 90. What is the core philosophical rule of object-oriented design in modern JavaScript?
**Answer**: **Favor composition over deep inheritance**. Use classes for stateful domain entities and encapsulation of business logic with `#private` fields, but keep inheritance trees shallow (maximum 1–2 levels) and compose behaviors using mixins, strategies, and functional pipelines.



---

## 12. 15 TRICKY OUTPUT PREDICTION PUZZLES WITH EXECUTION TRACES

### Puzzle 1: Class Hoisting in the Temporal Dead Zone
```javascript
try {
  const instance = new Widget();
  console.log(instance.name);
} catch (err) {
  console.log(err.name);
}

class Widget {
  name = "WidgetAlpha";
}
```
**Output**:
```text
ReferenceError
```
**Execution Trace**:
1. During the Creation Phase, the identifier `Widget` is registered in the module lexical environment but remains uninitialized in the Temporal Dead Zone (TDZ).
2. During the Execution Phase, the `new Widget()` call is reached before the class declaration.
3. Accessing an uninitialized TDZ identifier throws a `ReferenceError`.

---

### Puzzle 2: Class Method Default Strict Mode & Detached Invocation
```javascript
class Greeter {
  name = "Alice";
  greet() {
    return "Hello " + this?.name;
  }
}

const g = new Greeter();
const detached = g.greet;

try {
  console.log(detached());
} catch (err) {
  console.log(err.name);
}
```
**Output**:
```text
Hello undefined
```
**Execution Trace**:
1. Class bodies always execute in strict mode (`"use strict"`).
2. When `detached` is called without a call-site context object, `this` is bound to `undefined` (rather than the global object).
3. Optional chaining `this?.name` evaluates safely to `undefined`.
4. String concatenation `"Hello " + undefined` evaluates to `"Hello undefined"`.

---

### Puzzle 3: Derived Class 'this' Access Before super()
```javascript
class Base {
  constructor() {
    this.id = 100;
  }
}

class Derived extends Base {
  constructor() {
    try {
      this.custom = true;
    } catch (e) {
      console.log(e.name);
    }
    super();
    console.log(this.id, this.custom);
  }
}

new Derived();
```
**Output**:
```text
ReferenceError
100 undefined
```
**Execution Trace**:
1. In derived classes, `this` is uninitialized in TDZ until `super()` returns.
2. Attempting to assign `this.custom = true` triggers a `ReferenceError`, which is caught by the `try...catch` block.
3. `super()` is called next, initializing `this` and setting `this.id = 100`.
4. `this.custom` was never set, so `this.id, this.custom` prints `100 undefined`.

---

### Puzzle 4: Public Field Initialization Timing
```javascript
class Parent {
  name = "ParentName";
  constructor() {
    this.printName();
  }
  printName() {
    console.log("Parent:", this.name);
  }
}

class Child extends Parent {
  name = "ChildName";
  printName() {
    console.log("Child:", this.name);
  }
}

new Child();
```
**Output**:
```text
Child: undefined
```
**Execution Trace**:
1. `new Child()` calls `super()` (the default constructor).
2. Inside `Parent` constructor, `this.printName()` is invoked.
3. Dynamic dispatch finds the overridden `printName` on `Child.prototype`.
4. Crucially: `Child`'s field initializers (`name = "ChildName"`) have **not executed yet**! They execute only *after* `super()` completes.
5. Therefore, `this.name` inside `Child.printName` is `undefined`.

---

### Puzzle 5: Base Class Calling Overridden Method
```javascript
class Operation {
  constructor() {
    this.val = 10;
    this.calculate();
  }
  calculate() {
    this.val += 5;
  }
}

class AdvancedOperation extends Operation {
  multiplier = 2;
  calculate() {
    this.val *= (this.multiplier || 1);
  }
}

const op = new AdvancedOperation();
console.log(op.val);
```
**Output**:
```text
10
```
**Execution Trace**:
1. `AdvancedOperation` defaults to calling `super()`.
2. Inside `Operation` constructor, `this.val = 10` is set, followed by `this.calculate()`.
3. `AdvancedOperation.prototype.calculate` runs, multiplying `this.val` by `(this.multiplier || 1)`.
4. Because `this.multiplier` field has not yet been initialized (it runs after `super()`), `this.multiplier` is `undefined`, falling back to `1`.
5. `this.val` becomes `10 * 1 = 10`.
6. Finally, `AdvancedOperation` initializes `this.multiplier = 2`, leaving `op.val` as `10`.

---

### Puzzle 6: Constructor Returning Object Literal Override
```javascript
class Device {
  constructor(name) {
    this.name = name;
    return { name: "OverriddenDevice", custom: true };
  }
}

const d = new Device("Laptop");
console.log(d instanceof Device, d.name);
```
**Output**:
```text
false OverriddenDevice
```
**Execution Trace**:
1. If a constructor explicitly returns a non-primitive object, that object replaces the instance allocated by `new`.
2. The returned object literal `{ name: "OverriddenDevice", custom: true }` inherits from `Object.prototype`, not `Device.prototype`.
3. Consequently, `d instanceof Device` is `false`.

---

### Puzzle 7: super.method() Receiver Preservation
```javascript
class Base {
  name = "BaseInstance";
  identify() {
    return this.name;
  }
}

class Derived extends Base {
  name = "DerivedInstance";
  identify() {
    return super.identify();
  }
}

const d = new Derived();
console.log(d.identify());
```
**Output**:
```text
DerivedInstance
```
**Execution Trace**:
1. `d.identify()` calls `super.identify()`.
2. The engine uses `[[HomeObject]]` of `Derived.prototype.identify` to find `Base.prototype.identify`.
3. Crucially, the method is dispatched with `this` bound to `d` (the derived instance).
4. `this.name` evaluates to `"DerivedInstance"`.

---

### Puzzle 8: Static Method Inheritance via Prototype Chain
```javascript
class SuperService {
  static version = "1.0.0";
  static getVersion() {
    return this.version;
  }
}

class SubService extends SuperService {
  static version = "2.0.0";
}

console.log(SubService.getVersion());
```
**Output**:
```text
2.0.0
```
**Execution Trace**:
1. `SubService` inherits from `SuperService` via `Object.setPrototypeOf(SubService, SuperService)`.
2. Calling `SubService.getVersion()` finds the method on `SuperService`.
3. Inside `getVersion()`, `this` refers to the call-site object: `SubService`.
4. `SubService.version` resolves to `"2.0.0"`.

---

### Puzzle 9: Private Field Access Through Proxy Throws TypeError
```javascript
class SecretVault {
  #secret = 42;
  getSecret() {
    return this.#secret;
  }
}

const vault = new SecretVault();
const proxy = new Proxy(vault, {});

try {
  console.log(proxy.getSecret());
} catch (err) {
  console.log(err.name);
}
```
**Output**:
```text
TypeError
```
**Execution Trace**:
1. Invoking `proxy.getSecret()` sets `this` inside `getSecret` to `proxy`.
2. When reading `this.#secret`, the engine performs a brand check on the receiver (`proxy`).
3. Because the proxy is an exotic wrapper and not the actual `SecretVault` instance holding the brand, the brand check fails, throwing a `TypeError`.

---

### Puzzle 10: Private Field Brand Check on Foreign Object
```javascript
class Box {
  #code = "SECRET";
  static check(obj) {
    return #code in obj;
  }
}

const b1 = new Box();
const b2 = Object.create(b1);
console.log(Box.check(b1), Box.check(b2));
```
**Output**:
```text
true false
```
**Execution Trace**:
1. `b1` was instantiated directly by `new Box()`, so it holds the `#code` brand.
2. `b2` is an object delegating to `b1` via prototype. Private fields are **not** inherited through prototype chains!
3. The brand check `#code in b2` evaluates to `false`.

---

### Puzzle 11: Static Initialization Block Execution Timing
```javascript
const logs = [];

class Initializer {
  static {
    logs.push("StaticInit");
  }
  constructor() {
    logs.push("Constructed");
  }
}

logs.push("ClassLoaded");
new Initializer();

console.log(logs.join(" -> "));
```
**Output**:
```text
StaticInit -> ClassLoaded -> Constructed
```
**Execution Trace**:
1. The static initialization block executes synchronously when the class definition is evaluated by the engine (`StaticInit`).
2. Execution proceeds down the script, pushing `ClassLoaded`.
3. `new Initializer()` executes the constructor, pushing `Constructed`.

---

### Puzzle 12: new.target in Multi-Level Inheritance
```javascript
class A {
  constructor() {
    console.log(new.target.name);
  }
}
class B extends A {}
class C extends B {}

new C();
```
**Output**:
```text
C
```
**Execution Trace**:
1. `new C()` invokes the `C` constructor.
2. `C` calls `super()` (in `B`), which calls `super()` (in `A`).
3. Across the entire inheritance chain, `new.target` points to the original constructor invoked by `new`, which is `C`.

---

### Puzzle 13: Arrow Function Class Field vs Prototype Method super
```javascript
class Base {
  greet() { return "Base"; }
}

class Sub extends Base {
  greet() { return "Sub"; }
  arrowMethod = () => {
    return super.greet();
  };
}

const s = new Sub();
console.log(s.arrowMethod());
```
**Output**:
```text
Base
```
**Execution Trace**:
1. Public class fields are initialized during instance construction.
2. The arrow function `arrowMethod` captures `super` from its lexical environment at definition time.
3. `super.greet()` statically binds to `Base.prototype.greet`, returning `"Base"`.

---

### Puzzle 14: Non-Enumerable Prototype Methods in Object Inspection
```javascript
class Account {
  balance = 1000;
  deposit() {}
}

const acc = new Account();
console.log(Object.keys(acc).length, Object.keys(Account.prototype).length);
```
**Output**:
```text
1 0
```
**Execution Trace**:
1. `Object.keys(acc)` returns enumerable own properties of the instance (`['balance']`), count = 1.
2. `deposit` lives on `Account.prototype` with `enumerable: false`.
3. `Object.keys(Account.prototype)` ignores non-enumerable properties, returning `[]`, count = 0.

---

### Puzzle 15: class ExtendsNull Instantiation Error
```javascript
class PureDictionary extends null {
  constructor() {
    // Omitting super() and returning undefined
  }
}

try {
  new PureDictionary();
} catch (err) {
  console.log(err.name);
}
```
**Output**:
```text
TypeError
```
**Execution Trace**:
1. `extends null` triggers derived class constructor semantics (`[[ConstructorKind]]: "derived"`).
2. In a derived constructor, if you don't call `super()` (which cannot be called because `null` is not a constructor), you **must explicitly return an object**.
3. Returning `undefined` causes the engine to check if `this` was initialized, which throws a `TypeError: Derived constructors may only return object or undefined`.



---

## 13. 4 PROGRESSIVE REAL-WORLD PROJECTS

### Project 1: Enterprise Event-Driven Finite State Machine (FSM) Engine

#### Architectural Blueprint
```text
┌────────────────────────────────────────────────────────────────────────┐
│               ENTERPRISE EVENT-DRIVEN FINITE STATE MACHINE             │
├────────────────────────────────────────────────────────────────────────┤
│  State Table: Strict (fromState, event) -> toState mappings             │
│  Transitions: Validates state transitions before state mutation        │
│  Lifecycle Hooks: onEnter, onExit, onTransition callbacks              │
│  Hard Encapsulation: State variable stored in #currentState             │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
       ┌────────────────────────────┼────────────────────────────┐
       ▼                            ▼                            ▼
┌──────────────┐             ┌──────────────┐             ┌──────────────┐
│  State: IDLE │──[SUBMIT]──▶│ STATE: BUSY  │──[SUCCESS]─▶│STATE: SUCCESS│
└──────────────┘             └──────────────┘             └──────────────┘
```

#### Production Implementation
```javascript
/**
 * Industrial-Grade Event-Driven Finite State Machine (FSM)
 */
class StateMachine {
  #currentState;
  #transitions = new Map();
  #listeners = new Map();

  constructor(initialState) {
    if (!initialState) throw new Error("Initial state required");
    this.#currentState = initialState;
  }

  get state() {
    return this.#currentState;
  }

  addTransition(from, event, to) {
    const key = `${from}:${event}`;
    if (this.#transitions.has(key)) {
      throw new Error(`Transition already exists for '${key}'`);
    }
    this.#transitions.set(key, to);
    return this;
  }

  on(event, callback) {
    if (!this.#listeners.has(event)) {
      this.#listeners.set(event, new Set());
    }
    this.#listeners.get(event).add(callback);
    return () => this.#listeners.get(event)?.delete(callback);
  }

  dispatch(event, payload = {}) {
    const key = `${this.#currentState}:${event}`;
    const nextState = this.#transitions.get(key);

    if (!nextState) {
      throw new Error(`Invalid transition: cannot handle event '${event}' in state '${this.#currentState}'`);
    }

    const prevState = this.#currentState;
    this.#currentState = nextState;

    const transitionData = { from: prevState, to: nextState, event, payload };

    // Emit event callbacks:
    const callbacks = this.#listeners.get(event);
    if (callbacks) {
      for (const cb of callbacks) cb(transitionData);
    }

    const allTransitions = this.#listeners.get("*");
    if (allTransitions) {
      for (const cb of allTransitions) cb(transitionData);
    }

    return this.#currentState;
  }
}

// Verification Suite:
const fsm = new StateMachine("IDLE");
fsm
  .addTransition("IDLE", "FETCH", "LOADING")
  .addTransition("LOADING", "RESOLVE", "SUCCESS")
  .addTransition("LOADING", "REJECT", "ERROR");

const transitionHistory = [];
fsm.on("*", (t) => transitionHistory.push(`${t.from}->${t.to}`));

console.assert(fsm.state === "IDLE", "Initial state is IDLE");
fsm.dispatch("FETCH", { url: "/api/users" });
console.assert(fsm.state === "LOADING", "State transitioned to LOADING");
fsm.dispatch("RESOLVE", { data: [1, 2, 3] });
console.assert(fsm.state === "SUCCESS", "State transitioned to SUCCESS");

console.assert(transitionHistory.join(",") === "IDLE->LOADING,LOADING->SUCCESS", "Transition logs match");

let transitionFailed = false;
try {
  fsm.dispatch("FETCH"); // Invalid from SUCCESS
} catch {
  transitionFailed = true;
}
console.assert(transitionFailed, "Invalid transition successfully prevented");
```

---

### Project 2: Pluggable Repository Pattern with Type-Safe Data Mapping

#### Architectural Blueprint
```text
┌────────────────────────────────────────────────────────────────────────┐
│                     PLUGGABLE REPOSITORY ARCHITECTURE                  │
├────────────────────────────────────────────────────────────────────────┤
│  Base Repository: Abstract CRUD interface & lifecycle hooks             │
│  Data Driver: Swap out in-memory, SQL, or Key-Value persistence       │
│  Entity Model: Encapsulated business entity with schema validation     │
└────────────────────────────────────────────────────────────────────────┘
```

#### Production Implementation
```javascript
/**
 * Pluggable Repository Engine
 */
class BaseRepository {
  #driver;

  constructor(driver) {
    if (new.target === BaseRepository) {
      throw new TypeError("Cannot construct BaseRepository directly");
    }
    if (!driver || typeof driver.get !== "function" || typeof driver.set !== "function") {
      throw new TypeError("Valid storage driver required");
    }
    this.#driver = driver;
  }

  get driver() {
    return this.#driver;
  }

  async findById(id) {
    return this.#driver.get(id);
  }

  async save(id, entity) {
    this.validate(entity);
    return this.#driver.set(id, entity);
  }

  validate(entity) {
    throw new Error("Method 'validate()' must be implemented by derived repository");
  }
}

class InMemoryDriver {
  #store = new Map();

  async get(id) {
    return this.#store.get(id) || null;
  }

  async set(id, val) {
    this.#store.set(id, Object.freeze({ ...val }));
    return true;
  }

  async delete(id) {
    return this.#store.delete(id);
  }
}

class UserRepository extends BaseRepository {
  validate(user) {
    if (!user || typeof user.email !== "string" || !user.email.includes("@")) {
      throw new TypeError("Invalid user entity: email is required and must be valid");
    }
  }
}

// Verification Suite:
(async () => {
  const driver = new InMemoryDriver();
  const repo = new UserRepository(driver);

  let validationCaught = false;
  try {
    await repo.save("u1", { name: "John" }); // Missing valid email!
  } catch {
    validationCaught = true;
  }
  console.assert(validationCaught, "Repository validation properly blocks invalid entity");

  await repo.save("u1", { name: "John Doe", email: "john@enterprise.io" });
  const fetched = await repo.findById("u1");
  console.assert(fetched.name === "John Doe", "Saved user accurately fetched");
  console.assert(fetched.email === "john@enterprise.io", "User email matched");
})();
```

---

### Project 3: Resilient HTTP Client SDK with Middleware Pipeline

#### Architectural Blueprint
```text
┌────────────────────────────────────────────────────────────────────────┐
│                   RESILIENT HTTP CLIENT SDK PIPELINE                   │
├────────────────────────────────────────────────────────────────────────┤
│  Client Instance: Base URL, default headers, and timeout               │
│  Request Middlewares: Intercept and augment outgoing config             │
│  Response Middlewares: Transform or validate returned payload          │
│  Execution Engine: Composed onion middleware pipeline                  │
└────────────────────────────────────────────────────────────────────────┘
```

#### Production Implementation
```javascript
/**
 * Resilient Extensible HTTP Client Engine
 */
class HttpClient {
  #baseUrl;
  #defaultHeaders = new Map();
  #requestMiddlewares = [];
  #responseMiddlewares = [];

  constructor(baseUrl = "") {
    this.#baseUrl = baseUrl;
    this.#defaultHeaders.set("Content-Type", "application/json");
  }

  setHeader(k, v) {
    this.#defaultHeaders.set(k, v);
    return this;
  }

  useRequest(fn) {
    this.#requestMiddlewares.push(fn);
    return this;
  }

  useResponse(fn) {
    this.#responseMiddlewares.push(fn);
    return this;
  }

  async request(endpoint, options = {}) {
    let config = {
      url: this.#baseUrl + endpoint,
      method: options.method || "GET",
      headers: new Map([...this.#defaultHeaders, ...Object.entries(options.headers || {})]),
      body: options.body || null
    };

    // 1. Run Request Middlewares:
    for (const mw of this.#requestMiddlewares) {
      config = await mw(config);
    }

    // 2. Simulated Network Dispatch:
    let response = {
      status: 200,
      headers: { "content-type": "application/json" },
      data: { success: true, endpoint: config.url }
    };

    // 3. Run Response Middlewares:
    for (const mw of this.#responseMiddlewares) {
      response = await mw(response);
    }

    return response;
  }
}

// Verification Suite:
(async () => {
  const client = new HttpClient("https://api.gateway.internal");

  // Auth Middleware:
  client.useRequest((cfg) => {
    cfg.headers.set("Authorization", "Bearer TOKEN_123");
    return cfg;
  });

  // Logging Middleware:
  let intercepted = false;
  client.useResponse((res) => {
    intercepted = true;
    res.data.timestamp = 123456789;
    return res;
  });

  const res = await client.request("/v1/telemetry");
  console.assert(intercepted === true, "Response middleware was executed");
  console.assert(res.data.timestamp === 123456789, "Response payload mutated by middleware");
  console.assert(res.data.endpoint === "https://api.gateway.internal/v1/telemetry", "Endpoint correctly routed");
})();
```

---

### Project 4: Micro-DI (Dependency Injection) IoC Container using Class Reflection

#### Architectural Blueprint
```text
┌────────────────────────────────────────────────────────────────────────┐
│                   INVERSION OF CONTROL (IoC) CONTAINER                 │
├────────────────────────────────────────────────────────────────────────┤
│  Container: Central registry mapping tokens to classes or singletons   │
│  Reflection & Resolution: Dynamically instantiates dependency trees    │
│  Lifecycles: Supports TRANSIENT and SINGLETON scopes                   │
└────────────────────────────────────────────────────────────────────────┘
```

#### Production Implementation
```javascript
/**
 * Industrial-Grade Micro-DI Container
 */
class Container {
  #bindings = new Map();
  #singletons = new Map();

  bind(token, targetClass, dependencies = [], isSingleton = false) {
    this.#bindings.set(token, { targetClass, dependencies, isSingleton });
    return this;
  }

  singleton(token, targetClass, dependencies = []) {
    return this.bind(token, targetClass, dependencies, true);
  }

  resolve(token) {
    const binding = this.#bindings.get(token);
    if (!binding) {
      throw new Error(`No binding found for token: '${String(token)}'`);
    }

    const { targetClass, dependencies, isSingleton } = binding;

    if (isSingleton && this.#singletons.has(token)) {
      return this.#singletons.get(token);
    }

    // Recursively resolve all dependencies:
    const resolvedDeps = dependencies.map((depToken) => this.resolve(depToken));

    // Construct target instance:
    const instance = Reflect.construct(targetClass, resolvedDeps);

    if (isSingleton) {
      this.#singletons.set(token, instance);
    }

    return instance;
  }
}

// Verification Suite:
class Logger {
  log(msg) { return `[LOG]: ${msg}`; }
}

class AuthService {
  #logger;
  constructor(logger) {
    this.#logger = logger;
  }
  login(username) {
    return this.#logger.log(`User ${username} logged in`);
  }
}

const di = new Container();
di.singleton("Logger", Logger);
di.bind("AuthService", AuthService, ["Logger"]);

const authInstance1 = di.resolve("AuthService");
const authInstance2 = di.resolve("AuthService");

console.assert(authInstance1 !== authInstance2, "AuthService is transient (new instance per resolve)");
console.assert(authInstance1.login("Alice") === "[LOG]: User Alice logged in", "Injected Logger functions correctly");

// Assert singleton logger:
const logger1 = di.resolve("Logger");
const logger2 = di.resolve("Logger");
console.assert(logger1 === logger2, "Logger is a true singleton instance");
```



---

## 14. PRODUCTION BEST PRACTICES: DOS AND DON'TS MATRIX

| Rule # | DO / DON'T | Bad Code | Good Code | Why & Architectural Impact |
|:---|:---|:---|:---|:---|
| **1** | **DON'T** pass unbound class methods to callbacks | `btn.addEventListener('click', this.handleClick);` | `btn.addEventListener('click', (e) => this.handleClick(e));` | Passing detached methods strips `this` (becoming `undefined` in strict mode), causing runtime crashes. |
| **2** | **DO** use `#private` fields for true internal state | `this._balance = amt;` | `#balance = amt;` | Underscores offer zero protection; `#` fields are enforced by V8 and completely invisible to reflection. |
| **3** | **DON'T** instantiate classes before declaration | `const a = new App(); class App {}` | `class App {} const a = new App();` | Classes are not hoisted with initialization; calling them early throws a `ReferenceError` (TDZ). |
| **4** | **DO** validate constructor arguments | `constructor(id) { this.id = id; }` | `constructor(id) { if (!id) throw new TypeError("ID required"); this.id = id; }` | Failing to validate produces invalid object state invariants across the application lifecycle. |
| **5** | **DON'T** use arrow functions for all class methods | `class C { a = () => {}; b = () => {}; }` | `class C { a() {} b() {} }` | Arrow class fields duplicate functions on every instance, increasing memory footprint 10x in high-scale systems. |
| **6** | **DO** use `super()` as the very first line in derived constructors | `constructor() { this.init(); super(); }` | `constructor() { super(); this.init(); }` | Accessing `this` before `super()` returns triggers an immediate `ReferenceError`. |
| **7** | **DON'T** create deep (> 2 levels) inheritance hierarchies | `class E extends D extends C extends B extends A` | `const Mixed = mix(Base, TraitA, TraitB);` | Deep inheritance introduces the Fragile Base Class problem and degrades V8 Inline Cache lookups. |
| **8** | **DO** use `static {}` initialization blocks for complex static setup | `class C {} try { C.init(); } catch {}` | `class C { static { try { ... } catch {} } }` | Static blocks keep initialization logic cleanly encapsulated within the class lexical scope. |
| **9** | **DON'T** rely on `instanceof` across multiple V8 realms | `data instanceof MyEntity` | `MyEntity.isMyEntity(data)` or `Symbol.hasInstance` | Cross-realm objects (iframes, Workers) have different prototype references, breaking `instanceof`. |
| **10** | **DO** return explicit objects in `toJSON()` to prevent leaking private fields | `JSON.stringify(user);` | `toJSON() { return { id: this.#id }; }` | Explicit `toJSON()` defines a secure public data transfer contract. |
| **11** | **DON'T** access `#private` fields through arbitrary Proxies without target unwrapping | `const p = new Proxy(new C(), {}); p.method();` | Wrap Proxy handler to bind methods to the target instance | Proxies fail private field brand checks, throwing `TypeError`. |
| **12** | **DO** enforce abstract classes via `new.target` | `class AbstractRepo {}` | `if (new.target === AbstractRepo) throw new TypeError(...);` | Prevents accidental direct instantiation of incomplete architectural interfaces. |
| **13** | **DON'T** mutate class prototype methods at runtime | `MyClass.prototype.exec = patchedFn;` | Use composition, decorators, or inheritance | Mutating prototypes invalidates V8 ValidityCells and deoptimizes monomorphic call-sites globally. |
| **14** | **DO** initialize class fields in consistent syntactic order | `class A { x; y; } class B { y; x; }` | Always declare identical properties in identical order | Consistent property order stabilizes V8 Hidden Class shapes across the entire application. |
| **15** | **DO** freeze Value Objects in the constructor | `class Point { constructor(x, y) { this.x = x; this.y = y; } }` | `class Point { constructor(x, y) { this.x = x; this.y = y; Object.freeze(this); } }` | Freezing ensures true immutability for domain Value Objects. |

---

## 15. REAL-WORLD CASE STUDY: THE BROKEN UNBOUND METHOD OUTAGE

### Incident Context
During a Black Friday traffic surge, an enterprise fintech checkout service began suffering sporadic 500 HTTP errors on payment capture requests. The application ran on Node.js using an Express and TypeScript backend.

### Root Cause Analysis
The engineering team had refactored the `PaymentGatewayService` class into a modular component:

```typescript
class PaymentGatewayService {
  #apiKey: string;
  #httpClient: HttpClient;

  constructor(apiKey: string, httpClient: HttpClient) {
    this.#apiKey = apiKey;
    this.#httpClient = httpClient;
  }

  async processPayment(transaction: Transaction): Promise<Receipt> {
    // Relies on this.#httpClient:
    return this.#httpClient.post("/v1/charge", {
      key: this.#apiKey,
      amount: transaction.amount
    });
  }
}
```

In the route handler, the developer passed the method directly as callback middleware:

```typescript
const gateway = new PaymentGatewayService(config.key, client);

// FATAL BUG: Method passed as detached reference:
app.post("/api/checkout", gateway.processPayment);
```

When Express invoked `gateway.processPayment(req, res)`, it dispatched the function with `this` set to the Express `app` or `undefined`. When the method executed `this.#httpClient.post(...)`, the runtime threw:
```text
TypeError: Cannot read private member #httpClient from an object whose class did not declare it
```

### Enterprise Remediation
1. **Immediate Patch**: Wrap method invocations in explicit arrow callbacks:
   ```typescript
   app.post("/api/checkout", (req, res) => gateway.processPayment(req, res));
   ```
2. **Static Analysis Rule**: Enforce ESLint rule `@typescript-eslint/unbound-method` in the CI/CD pipeline to block un-bound method passing during pull request builds.
3. **Architectural Guard**: In stateful service classes, automatically bind methods in the constructor or use an auto-bind utility.

---

## 16. 75 PRACTICE EXERCISES ACROSS 4 TIERS

### Tier 1: Fundamentals of Classes & Declarations (Exercises 1 to 20)
1. Declare a class `Rectangle` with a constructor that takes `width` and `height`.
2. Add a method `getArea()` to `Rectangle` that calculates and returns the area.
3. Add a getter `perimeter` to `Rectangle` that computes the perimeter.
4. Verify using `Object.getOwnPropertyDescriptor` that `getArea` is non-enumerable.
5. Create an anonymous class expression and assign it to a constant `Square`.
6. Create a named class expression `const Calc = class Calculator {}` and verify that `Calculator` is not accessible outside the class.
7. Demonstrate that calling `Rectangle()` without `new` throws a `TypeError`.
8. Show that class declarations are not hoisted with initialization by instantiating one inside a `try...catch` before its declaration.
9. Create a class `Counter` with a public field `count = 0` and an `increment()` method.
10. Verify that `count` is an own property of the instance, whereas `increment` lives on the prototype.
11. Implement a static method `createSquare(size)` on `Rectangle` that returns a new `Rectangle` instance.
12. Show that `this` inside `Rectangle.createSquare` refers to `Rectangle`.
13. Demonstrate what happens when a constructor explicitly returns a primitive value (e.g., `return 42`).
14. Demonstrate what happens when a constructor explicitly returns an object literal `{ custom: true }`.
15. Inspect the `constructor` property of an instance and confirm it equals the class.
16. Use the `in` operator to verify that `getArea` exists on a `Rectangle` instance.
17. Use `Object.hasOwn()` to prove that `getArea` is not an own property of the instance.
18. Create a class with a computed method name using bracket syntax `[Symbol.iterator]() {}`.
19. Demonstrate that a class body always executes in strict mode by assigning to an undeclared variable inside a method.
20. Check the `name` property of a class declaration vs a class expression.

### Tier 2: Inheritance, Super & Fields (Exercises 21 to 40)
21. Create a base class `Vehicle` and a derived class `ElectricCar` using `extends`.
22. Call `super()` with arguments inside `ElectricCar` constructor.
23. Demonstrate that accessing `this` before `super()` throws a `ReferenceError`.
24. Override a method `drive()` in `ElectricCar` and call `super.drive()` inside it.
25. Demonstrate static method inheritance by defining `Vehicle.identify()` and calling `ElectricCar.identify()`.
26. Verify with `Object.getPrototypeOf` that `Object.getPrototypeOf(ElectricCar) === Vehicle`.
27. Verify with `Object.getPrototypeOf` that `Object.getPrototypeOf(ElectricCar.prototype) === Vehicle.prototype`.
28. Demonstrate that omitting the constructor in a derived class automatically calls `super(...args)`.
29. Use `new.target` in `Vehicle` to print the name of the derived class that was instantiated.
30. Implement an abstract class `AbstractView` that throws an error if `new.target === AbstractView`.
31. Subclass the built-in `Array` class to create `ExtendedArray` with a custom method `first()`.
32. Override `static get [Symbol.species]()` on `ExtendedArray` to return `Array`.
33. Subclass the built-in `Error` class to create a custom `HttpError` with `statusCode` and `timestamp`.
34. Demonstrate that `new HttpError(404, "Not Found") instanceof Error` returns `true`.
35. Create a class with public class fields and trace their initialization order relative to the constructor body.
36. Show that in a derived class, derived field initializers execute after `super()` returns.
37. Create a class with a setter that validates that input is a positive integer.
38. Create a class with a getter and setter that synchronizes two properties (e.g. `celsius` and `fahrenheit`).
39. Demonstrate that defining a getter without a setter throws an error when written to in strict mode.
40. Implement a fluent Builder pattern class `QueryBuilder` where each method returns `this`.

### Tier 3: Private Encapsulation, Reflection & OOP Patterns (41 to 60)
41. Create a class `BankAccount` with private fields `#balance` and `#accountNumber`.
42. Add a private method `#auditTransaction(type, amount)` called from `deposit()` and `withdraw()`.
43. Add a private getter `get #formattedBalance()` and use it internally.
44. Demonstrate that accessing `account.#balance` outside the class throws a `SyntaxError`.
45. Implement a static method `isBankAccount(obj)` using the `#balance in obj` brand check.
46. Create an object using `Object.create(account)` and verify that the brand check `#balance in obj` returns `false`.
47. Wrap an instance of `BankAccount` in a `Proxy` and demonstrate why calling a method that reads `#balance` throws a `TypeError`.
48. Fix the Proxy private field issue by binding method calls to the underlying target.
49. Create a static initialization block `static {}` that loads and parses a configuration object at class load time.
50. Use a static initialization block to grant a privileged external function access to a class's private field.
51. Implement a Singleton class `AppConfig` using `static #instance` and `static getInstance()`.
52. Implement the Factory Method pattern using an abstract `LoggerFactory` and concrete subclasses.
53. Implement the Strategy pattern using a `CompressionContext` class that accepts different `ZipStrategy` and `GzipStrategy` classes.
54. Implement the Observer pattern with a class `ObservableStore` that notifies subscribed listeners upon state changes.
55. Create a mixin factory `Timestamped(Base)` that adds `createdAt` and `updatedAt` fields.
56. Create a mixin factory `Identifiable(Base)` that generates a UUID `id` on construction.
57. Compose multiple mixins together onto a base class: `class Task extends Timestamped(Identifiable(BaseEntity)) {}`.
58. Implement a class-based Finite State Machine with transitions and event dispatches.
59. Implement a class `Disposable` that implements `[Symbol.dispose]()` for the ES2023 `using` declaration.
60. Create an immutable Value Object class `Coordinates` with `#lat` and `#lng` that calls `Object.freeze(this)`.

### Tier 4: Senior Architecture, Engine Internals & Security Hardening (61 to 75)
61. Write a micro-benchmark measuring property access latency on public fields vs `#private` fields across 1,000,000 iterations.
62. Benchmark method call performance on a monomorphic call-site vs a megamorphic call-site (passing 6 different classes).
63. Demonstrate how declaring fields in different orders creates divergent V8 Hidden Classes.
64. Implement an IoC (Inversion of Control) container class that registers and resolves class dependencies.
65. Build a class-based HTTP client SDK with onion request/response middleware pipelines.
66. Implement an auto-bind decorator function that automatically binds all prototype methods to the instance in the constructor.
67. Implement safe JSON serialization for a class with private fields by defining a customized `toJSON()` method.
68. Write an abstract repository class and implement an in-memory repository subclass with schema validation.
69. Create a class that extends `null` (`class PureDict extends null`) and properly instantiate it by returning an object.
70. Build an Aspect-Oriented Programming (AOP) wrapper that logs execution times of all methods on a class.
71. Implement an enterprise EventBus class supporting wildcard topic matching (`orders.*`).
72. Build a class-based circuit breaker with states `CLOSED`, `OPEN`, and `HALF_OPEN`.
73. Demonstrate cross-realm class brand checking across two isolated Node.js `vm.Context` environments.
74. Write an automated migration script that transpiles an ES5 prototype inheritance hierarchy into an ES6 `class` hierarchy.
75. Implement an enterprise security guard that seals all registered class prototypes at server boot time.

---

## 17. MODULE SUMMARY & KEY INVARIANTS

1. **Syntactic Sugar with Engine Invariants**: ES6 classes desugar to constructor functions and prototypal delegation, but enforce engine-level rules: strict mode by default, non-enumerable prototype methods, and mandatory instantiation via `new`.
2. **Dual-Linkage Prototype Hierarchy**: `class Derived extends Base` creates two parallel prototype links: `Derived.prototype` delegates to `Base.prototype` (for instance methods), and `Derived` delegates to `Base` (for static methods).
3. **The Derived Constructor TDZ**: In derived classes, `this` is uninitialized in the Temporal Dead Zone until `super()` returns the allocated object from the base constructor.
4. **Hard Lexical Encapsulation (`#private`)**: Private identifiers (`#field`, `#method`) provide native, unforgeable privacy enforced by V8 brand checks, completely inaccessible to reflection APIs like `Reflect.ownKeys`.
5. **Static Initialization Blocks (`static {}`)**: Execute once during class evaluation, allowing clean, encapsulated static initialization with privileged access to private static members.
6. **Composition Over Deep Inheritance**: To maintain high performance and avoid the Fragile Base Class problem, keep inheritance hierarchies shallow and compose orthogonal behaviors using mixins, factories, and strategy patterns.
