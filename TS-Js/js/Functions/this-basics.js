// this-basics.js

// `this` is NOT where a function is written.
// `this` is decided by HOW a function is CALLED.
//
// Think:
// "Who is calling me right now?"

// ------------------------------
// 1. Normal Functions (own `this`)
// ------------------------------

const user = {
  name: "Ayush",
  greet: function () {
    console.log(this.name);
  }
};

user.greet(); // "Ayush"

// Detach the method
const fn = user.greet;
fn(); // undefined (in strict mode)

// Rule:
// In normal functions, `this` is set at CALL TIME.

// ------------------------------
// 2. Arrow Functions (no own `this`)
// ------------------------------

const user2 = {
  name: "Ayush",
  greet: () => {
    console.log(this.name);
  }
};

user2.greet(); // undefined
// Arrow does NOT bind `this`.
// It inherits from where it was created.

const user3 = {
  name: "Ayush",
  greet() {
    setTimeout(() => {
      console.log(this.name); // "Ayush"
    }, 500);
  }
};

user3.greet();

// Here:
// - greet() is normal → this = user3
// - arrow inside inherits that this

// ------------------------------
// 3. IIFE and `this`
// ------------------------------

(function () {
  console.log(this); // undefined (strict) / window (browser)
})();

(() => {
  console.log(this); // inherits outer scope
})();

// IIFE is for setup, not object behavior.
// `this` is rarely useful here.

// ------------------------------
// 4. Real-App Pattern
// ------------------------------

const cart = {
  items: [],
  add(item) {
    this.items.push(item);
  },
  count() {
    return this.items.length;
  }
};

cart.add("Book");
cart.add("Pen");
console.log(cart.count()); // 2

// Correct use of `this`:
// Object behavior that depends on its owner.

// ------------------------------
// DEV GUIDE – `this`
// ------------------------------
//
// Use `this` when:
// - Writing object methods
// - Behavior depends on the owner (object/class)
//
// Avoid `this` when:
// - Writing utilities
// - Writing pure functions
// - Transforming data
//
// Bad:
// function normalize() {
//   return this.name.trim();
// }
//
// Good:
// function normalize(name) {
//   return name.trim();
// }
//
// Why it matters:
// - `this` is dynamic and can break easily
// - Pure functions are predictable
//
// Function types and `this`:
//
// Normal function:
// - Has its own `this`
// - Decided at call time
//
// Arrow function:
// - No own `this`
// - Inherits from outer scope
// - Best for callbacks and preserving context
//
// IIFE:
// - Not for object behavior
// - Rarely rely on `this`
//
// Mental model:
// - `this` = "Who is calling me?"
// - Use `this` for OBJECT BEHAVIOR
// - Use PARAMETERS for BUSINESS LOGIC
//
// If a function can work with just inputs,
// it should NOT use `this`.
