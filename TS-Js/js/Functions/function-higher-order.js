// function-higher-order.js

// A higher-order function is a function that:
// - accepts another function
// - or returns a function

// You already have a worker:





// --------------------------------------------------
// ADVANCED LEVEL
// --------------------------------------------------
 
/*
Q6. Field Validation Utility (Higher-Order Function)
 
Context:
API validation logic reused across routes.
 
Task:
Write `allowOnly(allowedFields)` that:
- Returns a function
- Returned function accepts an object
- Removes keys NOT in allowedFields
 
Usage Example:
const sanitizeUser = allowOnly(["name", "email"]);
 
sanitizeUser({ name: "A", age: 20, role: "admin" });
 
Expected Output:
{ name: "A", email: undefined }  // or removed key (your choice, but be consistent)
*/














// function sendEmail(to) {
//   console.log("Email sent to", to);
// }

// // Now we want logging without touching sendEmail
// function withLog(fn) {
//   return function (value) {
//     console.log("About to run function");
//     return fn(value);
//   };
// }

// const sendEmailWithLog = withLog(sendEmail);

// sendEmailWithLog("user@gmail.com");
// // About to run function
// // Email sent to user@gmail.com

// // Another simple example
// function calculate(price) {
//   return price * 2;
// }

// function safe(fn) {
//   return function (value) {
//     if (value == null) {
//       return "Invalid value";
//     }
//     return fn(value);
//   };
// }

// const safeCalculate = safe(calculate);

// console.log(safeCalculate(10));   // 20
// console.log(safeCalculate(null)); // "Invalid value"







// ==============================
// DEV GUIDE – HIGHER-ORDER FUNCTIONS
// ==============================
//
// Use when:
// - You want to add behavior without touching core logic
// - You need wrappers (auth, log, validate, retry)
//
// Why it matters:
// - Keeps core logic clean
// - Avoids duplication
// - Powers middleware & hooks
//
// Common mistakes:
// - Putting business logic inside wrappers
// - Making wrappers too complex
//
// Mental model:
// Normal function = does the job
// HOF             = controls how the job runs
//
// “Give me your worker, I’ll give you a better one.”







/*
Q6. Field Validation Utility (Higher-Order Function)
 
Context:
API validation logic reused across routes.
 
Task:
Write `allowOnly(allowedFields)` that:
- Returns a function
- Returned function accepts an object
- Removes keys NOT in allowedFields
 
Usage Example:
const sanitizeUser = allowOnly(["name", "email"]);
 
sanitizeUser({ name: "A", age: 20, role: "admin" });
 
Expected Output:
{ name: "A", email: undefined }  // or removed key (your choice, but be consistent)
*/




// solution:

// Higher-Order Function: allowOnly

// function allowOnly(allowed) {
//   // Outer function: receives configuration (array)
//   return function (objectx) {
//     // Inner function: receives real data (object)
//     const result = {};

//     for (const key of allowed) {
//       // keep only allowed keys
//       result[key] = objectx[key];
//     }

//     return result;
//   };
// }

// // Usage
// const sanitizeUser = allowOnly(["name", "email"]);

// const user = {
//   name: "A",
//   age: 20,
//   role: "admin"
// };

// const cleaned = sanitizeUser(user);
// console.log(cleaned);
// // { name: "A", email: undefined }
// // (or you could design it to omit missing keys entirely)



// const user = {
//   id: 1,
//   name: "A",
//   email: "a@x.com",
//   password: "secret",
//   role: "admin"
// };



//   function pickmeonly(fields){
//   return function (objectx){
//     const result={}

//     for (const key of fields){
  
//       if (key in objectx){
//     result[key]=objectx[key]
//       }

    
//     }

//     return result
//   }
//   }

//   const sanitizeField=pickmeonly(["id" , "name"])

//   const cleaned=sanitizeField(user)

//   console.log(cleaned)







  // calll only once function



//   function once(fn) {
//   let called = false;

//   return function (data) {
//     if (called) return;
//     called = true;
//     return fn(data);
//   };
// }

// function submitForm(data) {
//   console.log("Submitted:", data);
// }

// const submitOnce = once(submitForm);

// submitOnce({ a: 1 });
// submitOnce({ a: 2 });
// submitOnce({ a: 3 });




// function limit(fn, max) {
//   let count = 0;

//   return function (...args) {
//     if (count < max) {
//       count++;
//       return fn(...args);
//     }
//   };
// }


// function sendOTP(phone) {
//   console.log("OTP sent to", phone);
// }

// const sendOTP3Times = limit(sendOTP, 3);


// sendOTP3Times("111")
// sendOTP3Times("112")
// sendOTP3Times("113")






// 8 – Group Users by Role

// Context (real-world case):
// In an admin dashboard, you receive a flat list of users from the backend.
// For analytics and UI sections, you need users grouped by their role.

// Input:

// const users = [
//   { id: 1, role: "admin" },
//   { id: 2, role: "user" },
//   { id: 3, role: "admin" }
// ];


// Task:

// Write a function:

// function groupByRole(users) { ... }


// That:

// Accepts an array of user objects

// Returns an object where:

// Each unique role becomes a key

// The value is an array of users with that role

// Expected Output:

// {
//   admin: [
//     { id: 1, role: "admin" },
//     { id: 3, role: "admin" }
//   ],
//   user: [
//     { id: 2, role: "user" }
//   ]
// }



function groupByRole(users) {
  const result = {};

  for (const user of users) {
    const key = user.role;

    if (!result[key]) {
      result[key] = [];
    }

    result[key].push(user);
  }

  return result;
}



// Rules:

// Do not mutate the original users array

// Handle any number of roles dynamically

// Use clean, readable logic

// Write only the function code.