# Hands-On Async Lab: Promises & Real-World APIs (`Asynccc.js`)

> **Interactive Code Lab**: This module is the companion web guide for [`Asynccc.js`](file:///c:/Users/ayush/OneDrive/Desktop/js-learning/Asynccc.js). It demonstrates how to build Promises from scratch, avoid Callback Hell, call live public APIs with `fetch()` and `async / await`, and handle network errors like a senior engineer.

---

## 🍔 The Food Court Buzzer Mental Model

Why does JavaScript need "Asynchronous Programming" in the first place?
JavaScript is **single-threaded**—meaning it only has **one brain and one pair of hands** (one Call Stack). It can only execute one line of code at any split second.

If JavaScript had to wait 2 whole seconds for a server across the world to send back data before doing anything else, your webpage would completely freeze!

```text
┌─────────────────────────────────────────────────────────────────────────────┐
│                   THE RESTAURANT / FOOD COURT ANALOGY                       │
├─────────────────────────────────────────────────────────────────────────────┤
│ 1. YOU ORDER FOOD:                                                          │
│    You walk up to the counter and order a burger.                           │
│                                                                             │
│ 2. YOU GET A BUZZER (THE PROMISE):                                          │
│    The cashier doesn't force you to stand frozen at the counter!            │
│    Instead, they hand you an electronic BUZZER.                             │
│    This Buzzer is a PROMISE that food will arrive in the future.            │
│                                                                             │
│ 3. PENDING STATE:                                                           │
│    While the kitchen is cooking, your buzzer is silent.                     │
│    You walk to a table, chat with friends, check your phone.                │
│    (Your life is NON-BLOCKING! You didn't freeze!).                         │
│                                                                             │
│ 4. SCENARIO A — SUCCESS (RESOLVED / FULFILLED):                             │
│    Buzzer beeps and flashes! The kitchen finished your food.                │
│    You take your burger and eat. In code: `.then(food => ...)` or `await`   │
│                                                                             │
│ 5. SCENARIO B — ERROR (REJECTED):                                           │
│    The cashier calls you over: "The kitchen grill broke down!"              │
│    You get a refund instead. In code: `.catch(error => ...)` or try...catch │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 📖 The Evolution: From Callbacks to `async / await`

### Phase 1: Callback Hell (Old School JS)
In early JavaScript, waiting for asynchronous tasks required nesting callbacks within callbacks ("The Pyramid of Doom"):

```javascript
// ⚠️ Fragile, hard to read, and impossible to handle errors cleanly:
getData(1, () => {
  getData(2, () => {
    getData(3, () => {
      console.log("Finally finished! But good luck debugging this.");
    });
  });
});
```

### Phase 2: Native Promises (`.then()` and `.catch()`)
Promises flatten nested pyramids into linear, chainable pipelines:

```javascript
getData(1)
  .then(() => getData(2))
  .then(() => getData(3))
  .then(() => console.log("Clean chain!"))
  .catch((err) => console.error("Single error handler for all steps:", err));
```

### Phase 3: Modern `async` and `await` (Industry Standard)
Allows asynchronous code to read sequentially like synchronous code:

```javascript
async function executeWorkflow() {
  try {
    await getData(1);
    await getData(2);
    await getData(3);
    console.log("Readable and synchronous-like!");
  } catch (err) {
    console.error("Caught error:", err.message);
  }
}
```

---

## 🛠️ Complete Source Code: `Asynccc.js`

Here is the complete, runnable source code from [`Asynccc.js`](file:///c:/Users/ayush/OneDrive/Desktop/js-learning/Asynccc.js). You can run this directly in your terminal with `node Asynccc.js`:

```javascript
/**
 * ============================================================================
 * ASYNCHRONOUS JAVASCRIPT & REAL-WORLD APIs MADE DEAD SIMPLE
 * ============================================================================
 */

// ============================================================================
// PART 1: CREATING A PROMISE FROM SCRATCH (simulateNetwork)
// ============================================================================

/**
 * A Promise takes an executor function with two superpowers:
 * - resolve(data) -> Call this when things went WELL!
 * - reject(error) -> Call this when something went WRONG!
 */
function simulateNetwork(url) {
  return new Promise((resolve, reject) => {
    // 1. Check if the URL was even provided
    if (!url) {
      return reject(new Error("❌ Error: Please provide a valid URL!"));
    }

    console.log(`📡 Simulating network request to: ${url}...`);

    // 2. Simulate network delay of 1 second
    setTimeout(() => {
      if (url.startsWith("https://")) {
        // Secure connection succeeded!
        resolve({
          status: 200,
          url: url,
          message: "🔒 Secure payload received successfully!",
          timestamp: new Date().toISOString()
        });
      } else {
        // Insecure connection rejected!
        reject(new Error(`⚠️ Insecure connection blocked for URL: ${url}. HTTPS is required.`));
      }
    }, 1000);
  });
}

// ============================================================================
// PART 2: HOW TO CONSUME PROMISES - 2 WAYS
// ============================================================================

// STYLE A: The Classic .then() / .catch() approach
function demoWithThenCatch() {
  console.log("\n--- [Demo A] Using .then() and .catch() ---");
  
  simulateNetwork("https://api.github.com/users/octocat")
    .then((result) => {
      console.log("✅ .then() received:", result.message);
    })
    .catch((error) => {
      console.error("❌ .catch() caught an error:", error.message);
    });
}

// STYLE B: Modern async / await (Industry Standard!)
async function demoWithAsyncAwait() {
  console.log("\n--- [Demo B] Using async / await with try...catch ---");
  
  try {
    const result = await simulateNetwork("https://secure.bank.com/data");
    console.log("✅ await received:", result.message);
  } catch (error) {
    console.error("❌ try...catch caught:", error.message);
  }
}

// ============================================================================
// PART 3: REAL-WORLD APIs - THE TWO-STEP FETCH & ERROR HANDLING
// ============================================================================

/**
 * ⚠️ THE 2 CRITICAL TRAPS EVERY DEVELOPER MUST KNOW ABOUT FETCH:
 * 
 * TRAP 1: The "Two-Step Fetch"
 *   - Step 1: const res = await fetch(url);
 *             Wait for the server to answer with HEADERS and STATUS CODE (e.g. 200 OK).
 *             The data body hasn't fully downloaded yet!
 *   - Step 2: const data = await res.json();
 *             Wait for the raw JSON text body to stream in and parse into a JS object!
 * 
 * TRAP 2: Fetch DOES NOT reject on 404 or 500 errors!
 *   - If you ask for a page that does not exist (404 Not Found), fetch thinks:
 *     "Hey, the server talked to me! That's a successful network connection!"
 *   - So fetch RESOLVES! It does NOT jump to your catch block!
 *   - YOU MUST ALWAYS CHECK: if (!response.ok)
 */

// ----------------------------------------------------------------------------
// REAL SAMPLE API 1: JSONPlaceholder (Free Fake REST API)
// URL: https://jsonplaceholder.typicode.com/posts/1
// ----------------------------------------------------------------------------
async function fetchRealUserPost(postId = 1) {
  const url = `https://jsonplaceholder.typicode.com/posts/${postId}`;
  console.log(`\n🌐 [Real API Call 1] Fetching post #${postId} from JSONPlaceholder...`);

  try {
    const response = await fetch(url);

    // Trap 2 check: Did the server return 200-299?
    if (!response.ok) {
      throw new Error(`HTTP Error! Status: ${response.status} (${response.statusText})`);
    }

    // Trap 1: Parse the JSON body
    const postData = await response.json();

    console.log("🎉 Successfully fetched Real Post!");
    console.log("   📌 Title:", postData.title);
    console.log("   📝 Body :", postData.body.slice(0, 60) + "...");
    return postData;
  } catch (error) {
    console.error("❌ Failed to fetch post:", error.message);
  }
}

// ----------------------------------------------------------------------------
// REAL SAMPLE API 2: PokéAPI (Free Public Pokémon Database)
// URL: https://pokeapi.co/api/v2/pokemon/pikachu
// ----------------------------------------------------------------------------
async function fetchPokemon(name = "pikachu") {
  const url = `https://pokeapi.co/api/v2/pokemon/${name.toLowerCase()}`;
  console.log(`\n⚡ [Real API Call 2] Fetching Pokémon "${name}" from PokéAPI...`);

  try {
    const response = await fetch(url);

    if (!response.ok) {
      if (response.status === 404) {
        throw new Error(`Pokémon "${name}" was not found in the PokéAPI database!`);
      }
      throw new Error(`HTTP Request Failed with status: ${response.status}`);
    }

    const pokemon = await response.json();

    console.log(`✨ Found ${pokemon.name.toUpperCase()}!`);
    console.log(`   📏 Height: ${pokemon.height * 10} cm`);
    console.log(`   ⚖️ Weight: ${pokemon.weight / 10} kg`);
    console.log(`   🔥 Types : ${pokemon.types.map(t => t.type.name).join(", ")}`);
    console.log(`   🎯 Abilities: ${pokemon.abilities.map(a => a.ability.name).join(", ")}`);
    return pokemon;
  } catch (error) {
    console.error("❌ Pokémon API Error:", error.message);
  }
}

// ----------------------------------------------------------------------------
// REAL SAMPLE API 3: Sending Data with POST (Creating a Resource)
// ----------------------------------------------------------------------------
async function createNewPost() {
  console.log("\n📤 [Real API Call 3] Sending a POST request to create a new resource...");

  const newPostPayload = {
    title: "Learning Promises in JavaScript",
    body: "Async programming is easy once you understand the food court buzzer analogy!",
    userId: 42
  };

  try {
    const response = await fetch("https://jsonplaceholder.typicode.com/posts", {
      method: "POST",
      headers: {
        "Content-Type": "application/json; charset=UTF-8"
      },
      body: JSON.stringify(newPostPayload) // Convert JS Object to JSON String
    });

    if (!response.ok) {
      throw new Error(`Failed to create post. Status: ${response.status}`);
    }

    const createdRecord = await response.json();
    console.log("✅ Post Created Successfully on Server!");
    console.log("   🆔 New Record ID:", createdRecord.id);
    console.log("   📌 New Record Title:", createdRecord.title);
  } catch (error) {
    console.error("❌ POST Request Error:", error.message);
  }
}

// ============================================================================
// PART 4: RUNNING ALL EXAMPLES IN SEQUENCE
// ============================================================================
async function runAllDemos() {
  console.log("🚀 STARTING REAL-WORLD JAVASCRIPT ASYNC & PROMISE DEMO");
  console.log("======================================================");

  // 1. Scratchpad Custom Promise
  demoWithThenCatch();
  await demoWithAsyncAwait();

  // 2. Real GET request (JSONPlaceholder)
  await fetchRealUserPost(1);

  // 3. Real GET request (PokéAPI)
  await fetchPokemon("ditto");

  // 4. Real POST request (Sending JSON data)
  await createNewPost();

  // 5. Demonstrating Error Handling (404 test)
  console.log("\n🧪 [Test Error Handling] Asking for a non-existent Pokémon:");
  await fetchPokemon("not-a-real-pokemon-xyz");

  console.log("\n======================================================");
  console.log("🏁 ALL ASYNC & API DEMOS FINISHED SUCCESSFULLY!");
}

runAllDemos();
```

---

## 🖥️ Live Terminal Execution Output

When executed in Node.js, `Asynccc.js` produces this clean output:

```text
🚀 STARTING REAL-WORLD JAVASCRIPT ASYNC & PROMISE DEMO
======================================================

--- [Demo A] Using .then() and .catch() ---
📡 Simulating network request to: https://api.github.com/users/octocat...

--- [Demo B] Using async / await with try...catch ---
📡 Simulating network request to: https://secure.bank.com/data...
✅ .then() received: 🔒 Secure payload received successfully!
✅ await received: 🔒 Secure payload received successfully!

🌐 [Real API Call 1] Fetching post #1 from JSONPlaceholder...
🎉 Successfully fetched Real Post!
   📌 Title: sunt aut facere repellat provident occaecati excepturi optio reprehenderit
   📝 Body : quia et suscipit suscipit recusandae consequuntur expedita e...

⚡ [Real API Call 2] Fetching Pokémon "ditto" from PokéAPI...
✨ Found DITTO!
   📏 Height: 30 cm
   ⚖️ Weight: 4 kg
   🔥 Types : normal
   🎯 Abilities: limber, imposter

📤 [Real API Call 3] Sending a POST request to create a new resource...
✅ Post Created Successfully on Server!
   🆔 New Record ID: 101
   📌 New Record Title: Learning Promises in JavaScript

🧪 [Test Error Handling] Asking for a non-existent Pokémon:

⚡ [Real API Call 2] Fetching Pokémon "not-a-real-pokemon-xyz" from PokéAPI...
❌ Pokémon API Error: Pokémon "not-a-real-pokemon-xyz" was not found in the PokéAPI database!

======================================================
🏁 ALL ASYNC & API DEMOS FINISHED SUCCESSFULLY!
```

---

## 🎯 Key Takeaways & Cheat Sheet

1. **`fetch(url)` gives you a Buzzer (Promise)** immediately, without freezing the browser or Node.js runtime.
2. **Always `await` twice**: Once for the response headers (`const res = await fetch(url)`), and once for the body (`const data = await res.json()`).
3. **Always verify `response.ok`**: HTTP `404` and `500` status codes **do not reject** the Promise!
4. **Use `try...catch` with `async/await`**: It provides the cleanest, most maintainable error handling in modern JavaScript.
