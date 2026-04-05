/**
 * loops-foundation.js
 *
 * LOOPS IN PRODUCTION — THINKING, NOT SYNTAX
 *
 * Loops are not "repeat N times".
 * They are tools to THINK over data in real systems.
 *
 * In real apps, loops are used to:
 * 1. Scan      → find / validate / search
 * 2. Transform → build new data
 * 3. Guard     → protect business rules
 *
 * And later:
 * 4. Compare   → nested logic
 * 5. Group     → bucket data
 *
 * This file builds your mental model.
 */

/* =========================================================
   1. LOOP AS SCANNER
   =========================================================

   Purpose:
   - Search something
   - Validate something
   - Find the first match
   - Decide early

   Mental model:
   "Walk through data until the answer is known.
    The moment it's known → stop."

   Production examples:
   - Is any user banned?
   - Is any required field missing?
   - Is there any unpaid order?
   - Is there any error in logs?

   Key idea:
   - Loops exist so you can STOP EARLY.
   - break is a business tool, not syntax.

   When to use:
   - Searching
   - Validation
   - Permission checks
   - Feature gates

   When NOT to use:
   - Pure transformation (use map)
*/

/* =========================================================
   2. LOOP AS TRANSFORMER
   =========================================================

   Purpose:
   - Convert data from one shape to another
   - Prepare API responses
   - Prepare UI-friendly data

   Mental model:
   "Take input → build output → one item at a time"

   Use map when:
   - One input → one output
   - No skipping
   - No early stop
   - No business branching

   Use loops when:
   - You may skip items
   - You may stop early
   - Logic is business-driven
   - You mix decisions + building

   Production examples:
   - DB rows → API objects
   - Products → UI labels
   - Logs → metrics
*/

/* =========================================================
   3. LOOP AS GUARD
   =========================================================

   Purpose:
   - Enforce business rules
   - Protect system from bad data
   - Block illegal states

   Mental model:
   "Walk → Check → Allow or Block"

   Tools meaning:

   continue → "This record is bad, others may be fine"
   return   → "This operation should end now"
   throw    → "System must not proceed"

   Use continue when:
   - Bad data is expected
   - You just want to skip

   Use return when:
   - Function’s job is over
   - Further work is meaningless

   Use throw when:
   - Rule is violated
   - System must stop

   Never use forEach when you need:
   - break
   - continue
   - early stop
*/

/* =========================================================
   NESTED LOOPS — PSYCHOLOGY (NO CODE YET)
   =========================================================

   Nested loops are NOT:
   "a loop inside a loop"

   They are:
   Outer loop  → choose a CONTEXT
   Inner loop  → do WORK inside that context

   Real-world thinking:

   Orders → Items
   Users  → Permissions
   Rows   → Columns

   Read them like English:

   "For each ORDER, go through its ITEMS."
   "For each USER, check their PERMISSIONS."
   "For each ROW, process its COLUMNS."

   Why one loop is not enough:
   - Real data is hierarchical, not flat
   - A single loop can only think in one dimension
   - Nested loops exist because real systems have layers

   Outer = world
   Inner = things inside that world
*/

/* =========================================================
   HOW TO DECIDE CONDITIONS (THE CONFUSION KILLER)
   =========================================================

   You NEVER randomly choose < or >.

   Condition comes from one question:

   "Am I walking forward or backward?"

   In 95% of real apps:
   - You walk forward in arrays
   - Start at 0
   - Move +1
   - Stop at length

   That automatically gives:

   start = 0
   move  = +1
   stop  = length
   → condition = i < length

   You use > only when you INTENTIONALLY walk backward.
*/

/* =========================================================
   5-STEP LOOP CHECKLIST (USE EVERY TIME)
   =========================================================

   1️⃣ Name the worlds (in English)
      Ask:
      - What is the outer thing?
      - What is inside it?

      If you cannot say:
      "For each ___, go through its ___"
      → you are not ready for a nested loop.

   2️⃣ Decide direction
      Ask:
      "Am I walking from start to end?"

      If yes (most cases):
      - start = 0
      - move  = +1
      - stop  = length
      - condition = <

   3️⃣ Lock responsibilities
      - i → outer world only
      - j → inner world of current outer

      Rules:
      - i never touches inner data
      - j never controls outer flow
      - inner condition always depends on current outer

   4️⃣ Speak in English first
      Always say:
      "For each OUTER, go through its INNER."

      Split:
      - "For each OUTER" → outer condition
      - "Go through its INNER" → inner condition

   5️⃣ Safety check
      Ask:
      - What makes this loop end?
      - Does i move toward its end?
      - Does j reset for each outer?
      - Does each loop depend on its own world?

      If you cannot answer:
      "Why will this stop?"
      → it's dangerous.
*/

/* =========================================================
   FINAL MENTAL MODELS
   =========================================================

   Loop as Scanner:
   "Walk until the answer is known."

   Loop as Transformer:
   "Take input → build output."

   Loop as Guard:
   "Allow or block based on rules."

   Nested Loop:
   Outer = Context
   Inner = Work inside that context

   Loops are not syntax.
   They are control over thinking in your system.
*/









/* =========================================================
   NESTED LOOP THINKING — NO CODE, ONLY LOGIC
   =========================================================

   Before writing any loop, especially nested loops,
   you must solve the problem in ENGLISH first.

   You are not allowed to think in:
   - i
   - j
   - <
   - length

   You must think in JOURNEYS.

   A nested loop is two journeys:
   1. Journey across OUTER world (Orders, Users, Rows)
   2. Journey across INNER world of the CURRENT outer item (Items, Permissions, Columns)

   Real data is layered:

       Order
         → Items

   So your thinking must be layered:

       "For each order, go through its items."

   You always:
   - Fully finish the inner world of ONE context
   - Then move to the next outer context

   You never jump between worlds randomly.

   ---------------------------------------------------------
   LOOP THINKING TEMPLATE (WRITE THIS IN NOTEBOOK)
   ---------------------------------------------------------

   1. Goal:
      "What do I want to produce / check / calculate?"

   2. Outer World:
      "What is the main list I am walking through?"

   3. Inner World:
      "What does each outer item contain?"

   4. English Flow (Story Form):

      "For each ______
           → go through its ______
           → apply this rule: ______
           → produce / check: ______"

   5. Bad Data Behavior:
      - Skip it?
      - Stop everything?
      - Throw error?

   ---------------------------------------------------------
   EXAMPLE (Orders → Items)
   ---------------------------------------------------------

   Goal:
   "Calculate total revenue from all valid items."

   Outer:
   Orders

   Inner:
   Items inside each order

   English Flow:

   "For each order
        → go through its items
        → if an item is invalid, skip it
        → otherwise add its price to total"

   This IS the algorithm.

   You never think:
   - "What should i be?"
   - "What condition should I give?"

   You think:
   - "When I finish items of this order, I move to the next order."

   Conditions are not chosen.
   They are DISCOVERED from this sentence:

   "Until this list ends."

   That is how senior engineers think.
*/




const classes = [
  {
    name: "10A",
    students: [
      { name: "Aman", marks: 80, isPresent: true },
      { name: "Riya", marks: 70, isPresent: false },
    ],
  },
  {
    name: "10B",
    students: [
      { name: "Karan", marks: 90, isPresent: true },
    ],
  },
  {
    name: "10C",
    students: [
      { name: "Neha", marks: 60, isPresent: false },
      { name: "Pooja", marks: 85, isPresent: true },
    ],
  },
];

let totalMarks=0
for ( let i=0; i<classes.length; i++){
    const CurrentClass=classes[i];
    console.log(CurrentClass);

    for (let j=0; j<CurrentClass.students.length; j++){
        const CurrentStudents=CurrentClass.students[j];

        if(CurrentStudents.isPresent !==true){
            continue;
        }

        else
            totalMarks+=CurrentStudents.marks;
    }
}


console.log(totalMarks)