// function-defaults-guards.js

// In production, functions will NOT always receive perfect input.
// APIs get broken payloads.
// Components get undefined.
// Users do weird things.

// ------------------------------
// DEFAULT PARAMETERS
// ------------------------------

// They protect your function from missing input.

function greet(name = "Guest") {
  return `Hello ${name}`;
}

console.log(greet("Ayush")); // Hello Ayush
console.log(greet());        // Hello Guest

function paginate(page = 1, limit = 10) {
  const skip = (page - 1) * limit;
  return { skip, limit };
}

console.log(paginate());
console.log(paginate(2, 20));

// ------------------------------
// GUARD CLAUSES (EARLY RETURNS)
// ------------------------------

function createUser(data) {
  if (!data) return null;
  if (!data.email) return null;

  return {
    email: data.email.toLowerCase(),
  };
}

// Backend-style guard
function handleRequest(req, res) {
  if (!req.user) return res.status(401).end();

  res.json({ ok: true });
}

// ==============================
// DEV GUIDE – DEFAULTS & GUARDS
// ==============================
//
// Use defaults when:
// - A value is optional
// - You want predictable behavior
//
// Use guards when:
// - Input may be invalid
// - You want to stop bad flow early
//
// Why it matters:
// - Prevents crashes
// - Keeps “happy path” clean
// - Makes APIs safer
//
// Common mistakes:
// - Letting undefined flow deep
// - Writing nested if-else instead of guards
//
// Mental model:
// - Defaults = “What if nothing comes?”
// - Guards   = “Stop bad data at the door”
