// function-params.js

/**
 * PARAMETERS vs ARGUMENTS
 *
 * Parameters = variables in the function definition
 * Arguments  = actual values passed when calling
 */

function greet(name, age) {  
  // name, age → PARAMETERS
  return `Hello ${name}, you are ${age}`;
}

greet("Ayush", 21);
// "Ayush", 21 → ARGUMENTS

/**
 * Flow of a function:
 * Input (params) → Logic → Output (return)
 */

function createUser(email, password) {
  return { email, password };
}

/**
 * Bad signature:
 * function process(data) {}
 *
 * Good signature:
 * function createUser(email, password) {}
 *
 * A function’s parameters define its CONTRACT.
 * They tell other devs exactly what this worker expects.
 */

/**
 * Return vs Mutate
 */

// Prefer returning new data (safe, predictable)
function addRole(user, role) {
  return { ...user, role };
}

// Mutation (use carefully, creates side-effects)
function addRoleMutate(user, role) {
  user.role = role;
}

// Example
const u1 = { name: "A" };
const u2 = addRole(u1, "admin");

console.log(u1); // { name: "A" }
console.log(u2); // { name: "A", role: "admin" }

addRoleMutate(u1, "admin");
console.log(u1); // { name: "A", role: "admin" }

/**
 * ==============================
 * DEV GUIDE – PARAMETERS
 * ==============================
 *
 * When to use:
 * - Design parameters like an API contract
 * - Be explicit about what a function needs
 *
 * Why it matters:
 * - Clear boundaries
 * - Self-documenting code
 * - Fewer bugs from misuse
 *
 * Common mistakes:
 * - Vague parameters like `data`
 * - Passing whole objects when only one field is needed
 * - Mutating inputs unexpectedly
 *
 * Mental model:
 * - Parameters are empty boxes
 * - Arguments fill those boxes
 * - A function is a mini-API inside your app
 */
