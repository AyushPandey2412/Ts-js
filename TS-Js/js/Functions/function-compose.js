// function-compose.js

// Build big logic from small workers

function trim(value) {
  return value.trim();
}

function toLower(value) {
  return value.toLowerCase();
}

function addDomain(value) {
  return value + "@gmail.com";
}

// Compose them
function buildEmail(input) {
  const trimmed = trim(input);
  const lowered = toLower(trimmed);
  return addDomain(lowered);
}

console.log(buildEmail("  Ayush  ")); // ayush@gmail.com

// Real-app style

function normalizeUser(data) {
  return {
    name: data.name.trim().toLowerCase(),
    email: data.email.trim().toLowerCase(),
    active: true,
  };
}

function saveUser(user) {
  db.insert(user);
}

function processUser(data) {
  const user = normalizeUser(data);
  saveUser(user);
}

// ==============================
// DEV GUIDE – COMPOSITION
// ==============================
//
// Use when:
// - Logic is growing
// - A function feels “too big”
//
// Why it matters:
// - Each worker is testable
// - Changes are localized
// - Code reads like a story
//
// Common mistakes:
// - Writing one giant function
// - Mixing pure + side-effect logic
//
// Mental model:
// Small pure workers
// + Small side-effect workers
// → Orchestrated by a thin function
