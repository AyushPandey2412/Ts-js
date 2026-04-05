// object-transform.js

const dbUser = {
  _id: "abc123",
  name: "A",
  email: "a@x.com",
  password: "secret",
  __v: 0
};

console.log("Raw DB User:", dbUser);

// 1. Simple transform (manual)
const { password, __v, ...safe } = dbUser;

const response1 = {
  id: safe._id,
  name: safe.name,
  email: safe.email
};

console.log("API Response 1:", response1);

// 2. Real-dev pattern using a helper

function toUserResponse(user) {
  const { password, __v, _id, ...rest } = user;

  return {
    id: _id,
    ...rest
  };
}

const response2 = toUserResponse(dbUser);
console.log("API Response 2:", response2);

// Rules:
//
// - Never send raw DB objects directly
// - Remove sensitive fields (password, tokens, __v)
// - Rename internal keys (_id -> id)
// - Keep API shape clean and stable


// ==============================
// DEV GUIDE – OBJECT TRANSFORMATION
// ==============================
//
// In real backend work:
//
// Database shape  !=  API shape  !=  Frontend shape
//
// You almost never expose raw DB objects.
// You always transform them.
//
// Common operations:
//
// 1. Remove sensitive fields
//    password, tokens, secrets, internal flags
//
//    const { password, ...safe } = user
//
// 2. Rename internal keys
//    _id -> id
//    created_at -> createdAt
//
//    return { id: _id, ...rest }
//
// 3. Control API contract
//    Frontend should NEVER depend on DB structure.
//
// ------------------------------
// REAL WORLD EXAMPLES
// ------------------------------
//
// MongoDB -> API:
//
//   const { password, __v, _id, ...rest } = doc
//   return { id: _id, ...rest }
//
// Stripe -> UI:
//
//   const { object, livemode, ...safe } = payload
//   return safe
//
// Form -> API:
//
//   const { tempField, ...clean } = body
//   return clean
//
// ------------------------------
// MENTAL MODEL
// ------------------------------
//
// Raw data  ->  Transform  ->  Public shape
//
// DB object     API response     Frontend
//
// Never leak internals.
// Never trust raw data.
// Always shape what you return.
//
// This pattern appears in:
// - Express controllers
// - Service layers
// - GraphQL resolvers
// - REST responses
