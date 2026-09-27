/**
 * ============================================================================
 * ASYNCHRONOUS JAVASCRIPT & REAL-WORLD APIs MADE DEAD SIMPLE
 * ============================================================================
 * 
 * 🍔 THE REAL-LIFE MENTAL MODEL: The Food Court Buzzer / Token
 * ----------------------------------------------------------------------------
 * Imagine you walk into a food court and order a burger:
 * 1. The cashier takes your money and hands you an electronic BUZZER (a Promise).
 * 2. You DO NOT stand frozen at the counter blocking everyone for 15 minutes!
 *    Instead, you walk over to a table, chat with your friends, check your phone.
 *    (This is "Non-Blocking" / "Asynchronous"!)
 * 3. While you wait, the buzzer is in the "PENDING" state (the kitchen is cooking).
 * 4. Case A - Success:
 *    The buzzer beeps and flashes! (RESOLVED / FULFILLED).
 *    You walk up to the counter and collect your hot burger.
 * 5. Case B - Failure:
 *    The manager calls you over: "Sorry, the kitchen grill caught fire!" (REJECTED).
 *    You handle the error (get a refund).
 * 
 * In JavaScript:
 * - A Promise is just that BUZZER!
 * - `pending`   -> Food is cooking.
 * - `fulfilled` -> Food is ready! (`resolve(food)`)
 * - `rejected`  -> An error happened! (`reject(error)`)
 * - `await`     -> Calmly waiting for the buzzer to ring without freezing the whole app.
 * ============================================================================
 */

// ============================================================================
// PART 1: THE EVOLUTION - WHY CALLBACKS GOT CRAZY ("CALLBACK HELL")
// ============================================================================

// In old-school JavaScript (before 2015), the ONLY way to wait for something
// was by nesting callbacks inside callbacks. Look at how messy this gets:
/*
function getOldData(id, nextStep) {
  setTimeout(() => {
    console.log("Fetched step:", id);
    if (nextStep) nextStep();
  }, 1000);
}

// "Callback Hell" / The Pyramid of Doom:
getOldData(1, () => {
  getOldData(2, () => {
    getOldData(3, () => {
      console.log("Done! But this code is painful to read and debug.");
    });
  });
});
*/

// ============================================================================
// PART 2: CREATING A PROMISE FROM SCRATCH (Fixing simulateNetwork)
// ============================================================================

/**
 * A Promise takes a function with two superpowers:
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
// PART 3: HOW TO CONSUME PROMISES - 2 WAYS
// ============================================================================

// ----------------------------------------------------------------------------
// STYLE A: The Classic .then() / .catch() approach
// ----------------------------------------------------------------------------
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

// ----------------------------------------------------------------------------
// STYLE B: The Modern async / await approach (Industry Standard!)
// ----------------------------------------------------------------------------
// Notice how clean this reads! It looks just like normal synchronous code.
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
// PART 4: REAL-WORLD APIs - HOW TO ACTUALLY USE FETCH IN REAL LIFE
// ============================================================================

/**
 * ⚠️ THE 2 CRITICAL TRAPS EVERY DEVELOPER MUST KNOW ABOUT FETCH:
 * 
 * TRAP 1: The "Two-Step Fetch"
 *   - Step 1: `const res = await fetch(url);`
 *             Wait for the server to answer with HEADERS and STATUS CODE (e.g. 200 OK).
 *             The data body hasn't fully downloaded yet!
 *   - Step 2: `const data = await res.json();`
 *             Wait for the raw JSON text body to stream in and parse into a JS object!
 * 
 * TRAP 2: Fetch DOES NOT reject on 404 or 500 errors!
 *   - If you ask for a page that does not exist (404 Not Found), fetch thinks:
 *     "Hey, the server talked to me! That's a successful network connection!"
 *   - So fetch RESOLVES! It does NOT jump to your `catch` block!
 *   - YOU MUST ALWAYS CHECK: `if (!response.ok)`
 */

// ----------------------------------------------------------------------------
// REAL SAMPLE API 1: JSONPlaceholder (Free Fake REST API used across the tech world)
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
// PART 5: RUNNING ALL EXAMPLES IN SEQUENCE
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

// Run the master workflow
runAllDemos();