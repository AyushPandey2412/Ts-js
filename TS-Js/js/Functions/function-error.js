// function-error.js

// Safe boundaries for chaos

async function getUserSafe(id) {
  try {
    const user = await db.findById(id);
    return user;
  } catch (err) {
    return null;
  }
}

async function handler(req, res) {
  const user = await getUserSafe(req.params.id);

  if (!user) {
    return res.status(404).json({ error: "Not found" });
  }

  res.json(user);
}

// Centralized wrapper
function safe(fn) {
  return async function (...args) {
    try {
      return await fn(...args);
    } catch (e) {
      return null;
    }
  };
}

const safeGetUser = safe(async (id) => {
  return await db.findById(id);
});

// ==============================
// DEV GUIDE – ERROR HANDLING
// ==============================
//
// Layers:
// - Validation → return error values
// - Business   → throw domain errors
// - Services   → let bubble
// - API edge   → catch + respond
//
// Why it matters:
// - Predictable behavior
// - Clean routes
// - No silent crashes
//
// Common mistakes:
// - try/catch everywhere
// - Swallowing programmer bugs
//
// Mental model:
// Errors flow upward.
// Only boundaries translate them.
