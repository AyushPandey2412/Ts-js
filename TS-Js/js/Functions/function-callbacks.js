// function-callbacks.js

// A callback is just a function passed into another function
// so it can be called later.

function run(task) {
  task();
}

run(() => {
  console.log("Task executed");
});

// Frontend
button.addEventListener("click", () => {
  console.log("clicked");
});

// Backend
app.get("/users", (req, res) => {
  res.json([]);
});

// Array methods
users.map((u) => u.email);

// Confusion point
doSomething(myFunc);   // passing
doSomething(myFunc()); // executing immediately (wrong)

// ==============================
// DEV GUIDE – CALLBACKS
// ==============================
//
// Use callbacks when:
// - Another system controls timing
// - You want to inject behavior
//
// Why it matters:
// - Powers events
// - Powers middleware
// - Powers async flows
//
// Common mistakes:
// - Calling instead of passing
// - Mixing sync and async thinking
//
// Mental model:
// - Outer function controls time
// - Callback controls behavior
//
// “Here is my logic.
// You decide when to run it.”
