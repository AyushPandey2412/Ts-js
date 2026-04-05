// function-return.js

// return does two things:
// 1. Sends a value back
// 2. Immediately stops the function

function sum(a, b) {
  return a + b;
  console.log("This never runs");
}

// ------------------------------
// 1. Return a value (produce data)
// ------------------------------

function getFullName(user) {
  return user.first + " " + user.last;
}

const name = getFullName({ first: "A", last: "B" });

// ------------------------------
// 2. Early return (guard)
// ------------------------------

function createUser(data) {
  if (!data) return null;
  if (!data.email) return null;

  return { email: data.email.toLowerCase() };
}

function handleRequest(req, res) {
  if (!req.user) return res.status(401).end();
  res.json({ ok: true });
}

// ------------------------------
// 3. No meaningful return (action)
// ------------------------------

function logError(err) {
  console.error(err);
}

// ==============================
// DEV GUIDE – RETURN
// ==============================
//
// Use return to:
// - Produce data
// - Exit early (guards)
//
// Do NOT use return:
// - As a random flow hack
// - To hide side-effects
//
// Common mistakes:
// - Mixing action + data in same function
// - Forgetting return stops execution
//
// Mental model:
// Produce → return value
// Protect → early return
// Act     → no meaningful return
