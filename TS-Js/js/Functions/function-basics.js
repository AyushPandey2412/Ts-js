// function-basics.js

// A function is a WORKER that performs ONE responsibility.

// A good function:
// - Does one job
// - Has clear input
// - Has predictable output or effect
// - Can be reasoned about in isolation

// A bad function:
// - Does many unrelated things 
// - Reads random globals
// - Mutates unknown state
// - Is hard to test or reuse

// ------------------------------
// DECLARATION vs INVOCATION
// ------------------------------

// Declaration = build the worker
function createUser(name) {
  return { name };
}

// Invocation = use the worker
const user = createUser("Ayush");
console.log(user);

// ------------------------------
// THINK LIKE A DEV
// ------------------------------
//
// Routes orchestrate
// Components orchestrate
// Functions do the actual work

function normalizeEmail(email) {
  return email.trim().toLowerCase();
}

function buildUserPayload(form) {
  return {
    name: form.name,
    email: normalizeEmail(form.email),
  };
}

// Example usage (backend or frontend)
const payload = buildUserPayload({
  name: "Ayush",
  email: "  AYUSH@MAIL.COM  ",
});

console.log(payload);

// ==============================
// DEV GUIDE – FUNCTION BASICS
// ==============================
//
// When to use:
// - Anytime logic needs isolation
// - Anytime behavior is reused
// - Anytime you want clarity
//
// Why it matters:
// - Keeps code testable
// - Makes debugging easy
// - Prevents spaghetti logic
//
// Common mistakes:
// - One function doing many jobs
// - Depending on hidden globals
// - Mixing unrelated concerns
//
// Mental model:
// - A function is a worker in your system
// - Your app is a network of workers
// - Orchestrators (routes/components) call workers
