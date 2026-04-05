// null-empty-undefined.js

// In real apps, bugs often come from confusing:
// - null
// - undefined
// - empty values ("", [], {})

// Think in terms of MEANING:

// undefined -> "Not provided / not set yet"
// null      -> "Intentionally empty / no value"
// empty     -> "Exists, but has no content"

// ------------------------------
// UNDEFINED
// ------------------------------

let a;
console.log(a); // undefined

function getUser(id) {
  // no return
}

console.log(getUser(1)); // undefined

// Use case:
// - Optional fields
// - Missing params
// - Uninitialized variables

// ------------------------------
// NULL
// ------------------------------

let user = null; // explicitly saying: "no user"
console.log(user); // null

function findUser(id) {
  return null; // explicitly: "not found"
}

// Use case:
// - “No result”
// - “Cleared value”
// - “Not applicable”

// ------------------------------
// EMPTY VALUES
// ------------------------------

const emptyString = "";
const emptyArray = [];
const emptyObject = {};

console.log(Boolean(emptyString)); // false
console.log(Boolean(emptyArray));  // true
console.log(Boolean(emptyObject)); // true

// Empty means:
// - Value exists
// - But contains nothing

// ------------------------------
// REAL-APP PATTERNS
// ------------------------------

function validateEmail(email) {
  if (email == null) {
    return "Email missing"; // catches null and undefined
  }

  if (email === "") {
    return "Email empty";
  }

  return null;
}

console.log(validateEmail());       // "Email missing"
console.log(validateEmail(null));   // "Email missing"
console.log(validateEmail(""));     // "Email empty"
console.log(validateEmail("a@x"));  // null

// Cleaning payloads
const payload = {
  name: "A",
  email: null,
  city: undefined,
  bio: ""
};

const cleaned = Object.fromEntries(
  Object.entries(payload).filter(([_, v]) => v != null)
);

console.log(cleaned);
// { name: "A", bio: "" }

// ------------------------------
// DEV GUIDE – NULL vs UNDEFINED vs EMPTY
// ------------------------------
//
// Use undefined when:
// - Value is optional
// - Field may not exist
//
// Use null when:
// - You want to say “intentionally no value”
// - Clearing a field
// - “Not found” results
//
// Use empty values when:
// - The type must exist
//   ("" for text, [] for lists, {} for objects)
//
// Why it matters:
// - Prevents false validations
// - Avoids UI glitches
// - Makes API behavior consistent
//
// Common mistakes:
// - Treating "" and null as same
// - Using truthy checks blindly
// - Returning undefined when null is clearer
//
// Mental model:
// undefined -> “I don’t have it”
// null      -> “I intentionally have nothing”
// empty     -> “I have it, but it’s empty”
//
// Always ask:
// “Is this missing, cleared, or just empty?”
