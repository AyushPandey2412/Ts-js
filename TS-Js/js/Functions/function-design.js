// function-design.js

// Senior-level function design

// Bad
function handle(data) {}
function process(x) {}

// Good
function validateSignup(data) {}
function normalizeUser(data) {}
function saveUserToDB(user) {}

// One job only

// Bad
function register(data) {
  const user = normalize(data);
  db.insert(user);
  console.log("Saved");
  sendEmail(user.email);
}

// Good
function register(data) {
  const user = normalize(data);
  saveUser(user);
  notifyUser(user);
}

// Testable core
function buildPayload(form) {
  return {
    name: form.name.trim(),
    email: form.email.toLowerCase(),
  };
}

// ==============================
// DEV GUIDE – FUNCTION DESIGN
// ==============================
//
// A senior function:
// - Has a clear name
// - Does one job
// - Has explicit input
// - Has predictable output or effect
//
// Why it matters:
// - Easy to reason
// - Easy to test
// - Easy to change
//
// Common mistakes:
// - God functions
// - Hidden dependencies
//
// Mental model:
// Pure = thinking
// Side-effect = doing
//
// Your app is a network of workers.
