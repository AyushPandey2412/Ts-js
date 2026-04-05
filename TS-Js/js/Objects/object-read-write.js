// object-read-write.js

const user = {
  name: "hemla",
  age: 23,
  email: "hemla23@gmail.com"
};

// Dot notation (most common)
console.log("Dot:", user.name);

// Bracket notation
console.log("Bracket:", user["name"]);

// Dynamic access (real dev use)
function getUserField(obj, key) {
  return obj[key];
}

console.log("Dynamic:", getUserField(user, "email"));
console.log("Dynamic:", getUserField(user, "age"));

// When to use what:
// - Use dot when key is fixed
// - Use bracket when key comes from variable

// --------------------------------------
// Dynamic object with nested structure

const user1 = {
  name: "Hemla",
  sections: {
    profile: { visible: true },
    settings: { visible: false },
    billing: { visible: true }
  }
};

// Check if a section is visible
function isSectionVisible(user, sectionName) {
  if (!user.sections?.[sectionName]) {
    return "section not found";
  }

  return user.sections[sectionName].visible ? "visible" : "hidden";
}

console.log(isSectionVisible(user1, "profile"));  
console.log(isSectionVisible(user1, "settings")); 
console.log(isSectionVisible(user1, "help"));     

// --------------------------------------
// MUTATING update (works, but risky in real apps)

function updateSectionMutating(user, sectionName, newVal) {
  if (!user.sections?.[sectionName]) {
    return "section not found";
  }

  user.sections[sectionName].visible = newVal;
  return user;
}

console.log(updateSectionMutating(user1, "settings", true));

// --------------------------------------
// SAFE immutable update (real-dev pattern)

function updateSectionSafe(user, sectionName, newVal) {
  if (!user.sections?.[sectionName]) {
    return user;
  }

  return {
    ...user,
    sections: {
      ...user.sections,
      [sectionName]: {
        ...user.sections[sectionName],
        visible: newVal
      }
    }
  };
}

const updatedUser = updateSectionSafe(user1, "billing", false);
console.log("Original:", user1);
console.log("Updated :", updatedUser);

// --------------------------------------
// Generic dynamic setter

// Mutating version
function setUserFieldMutating(obj, key, value) {
  obj[key] = value;
  return obj;
}

// Safe version (preferred in real apps)
function setUserFieldSafe(obj, key, value) {
  return {
    ...obj,
    [key]: value
  };
}

console.log(setUserFieldMutating(user, "theme", "dark"));
console.log(setUserFieldSafe(user, "country", "India"));

// ==============================
// DEV GUIDE – DYNAMIC ACCESS
// ==============================
//
// Dot:
//   user.name
// Use when key is fixed.
//
// Bracket:
//   user[key]
// Use when key is dynamic (API, form, loop).
//
// Optional chaining:
//   obj.a?.[key]
// Prevents crashes when path doesn't exist.
//
// ------------------------------
// UPDATES IN REAL APPS
// ------------------------------
//
// Mutating:
//   obj[key] = value       
//   obj.nested.x = y        
//
// Safe (immutable):
//   { ...obj, [key]: value }
//
// Nested safe update:
//   {
//     ...obj,
//     nested: {
//       ...obj.nested,
//       [key]: newValue
//     }
//   }
//
// Mental model:
// - Reading can be direct
// - Writing should usually return a new object
