// function-nested-closure.js

// Functions inside functions are used for:
// - Privacy
// - Configuration
// - Memory (state)

function createCounter() {
  let count = 0;

  function increment() {
    count++;
    return count;
  }

  return increment;
}

const counter = createCounter();

console.log(counter()); // 1
console.log(counter()); // 2
console.log(counter()); // 3

// Another real-feel example
function createLogger(prefix) {
  return function log(message) {
    console.log(prefix, message);
  };
}

const apiLog = createLogger("[API]");
const authLog = createLogger("[AUTH]");

apiLog("Request started");
authLog("User logged in");

// ==============================
// DEV GUIDE – NESTED FUNCTIONS & CLOSURES
// ==============================
//
// Use when:
// - You need private state
// - You need configuration-based behavior
// - You want controlled environments
//
// Why it matters:
// - Powers hooks
// - Powers middleware factories
// - Enables state without classes
//
// Common mistakes:
// - Forgetting closures keep memory
// - Creating too many nested layers
//
// Mental model:
// Outer function = setup
// Inner function = worker with memory
//
// “A function carries a backpack of data
// from where it was born.”
