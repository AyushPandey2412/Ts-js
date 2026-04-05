// function-async.js

// Async functions handle slow reality:
// - DB
// - API
// - Files
// - Network

async function getUser(id) {
  const user = await db.findById(id);
  return user;
}

// Bad
function handlerBad(req, res) {
  const user = db.findById(req.params.id);
  res.json(user); // Promise, not data
}

// Good
async function handler(req, res) {
  const user = await db.findById(req.params.id);
  res.json(user);
}

// Async is still normal flow
async function add(a, b) {
  return a + b;
}

const result = await add(2, 3);

// ==============================
// DEV GUIDE – ASYNC
// ==============================
//
// Use when:
// - Work depends on I/O
//
// Why it matters:
// - Prevents race conditions
// - Keeps logic linear
//
// Common mistakes:
// - Forgetting await
// - Mixing sync and async styles
//
// Mental model:
// async  = this worker deals with slow things
// await  = pause until done
//
// Async changes time, not design.
