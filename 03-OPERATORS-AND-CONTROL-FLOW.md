# Module 03: Operators, Advanced Short-Circuiting & Control Flow

> **Learning Invariant**: In JavaScript, logical operators (`&&`, `||`, `??`) do **not** return booleans; they return the **value of one of their operands**. Combining this with short-circuit evaluation, optional chaining (`?.`), and bitwise masks gives you the tools to write fast, crash-proof systems code.

---

## 1. The Genesis: Expressions, Statements & Evaluation Order

Programs are built of two things:
1. **Statements**: Instructions that perform actions (e.g., `if`, `for`, `while`, `return`). Statements do not produce a value you can assign to a variable.
2. **Expressions**: Any piece of code that resolves to a **value** (e.g., `5 + 5`, `user?.name`, `isValid && upload()`).

In JavaScript, operators have strict **Precedence** (which runs first) and **Associativity** (left-to-right vs right-to-left).
When evaluating an expression:
* Member access (`.`, `?.`) runs before arithmetic.
* Arithmetic (`*`, `/`) runs before logical comparison (`<`, `>`).
* Comparison runs before logical operators (`&&`, `||`, `??`).
* Assignment (`=`, `+=`, `??=`) runs last, from **right to left**.

---

## 2. Short-Circuit Evaluation: How `&&`, `||`, and `??` Really Work

Many tutorials say `&&` means "AND" and returns `true` or `false`. **This is technically inaccurate in JavaScript.**

### 2.1 The Logical AND Operator (`&&`)
* **Algorithm**:
  1. Evaluate the left-hand operand.
  2. If the left-hand operand is **falsy**, short-circuit immediately and **return that left-hand value**.
  3. Otherwise, evaluate and **return the right-hand value**.

```javascript
// Examples:
console.log(null && "download");  // returns null (stops at left)
console.log(0 && "download");     // returns 0 (stops at left)
console.log("admin" && "upload"); // returns "upload" (left was truthy, returns right)
```
*React Trap*: In React, `{filesCount && <FileList />}` will render `0` onto the user's screen if `filesCount === 0`, because `0 && <FileList />` returns `0`!

### 2.2 The Logical OR Operator (`||`)
* **Algorithm**:
  1. Evaluate the left-hand operand.
  2. If the left-hand operand is **truthy**, short-circuit immediately and **return that left-hand value**.
  3. Otherwise, evaluate and **return the right-hand value**.

```javascript
// Examples:
console.log("MinIO" || "S3");    // returns "MinIO"
console.log("" || "default.pdf"); // returns "default.pdf" (empty string is falsy)
console.log(0 || 5000);           // returns 5000 (0 is falsy!)
```

### 2.3 The Nullish Coalescing Operator (`??`)
Introduced in ES2020 to solve the flaw of `||`.
* **Algorithm**:
  1. Evaluate the left-hand operand.
  2. If the left-hand operand is strictly `null` or `undefined`, evaluate and **return the right-hand value**.
  3. If the left-hand operand is **anything else** (even `0`, `""`, `NaN`, or `false`), return the **left-hand value**.

```javascript
// Comparison Table:
const quotaLimit = 0; // 0 means 0 bytes allowed (a real business setting!)

const usingOr = quotaLimit || 1000;      // 1000 (BUG! 0 was overwritten)
const usingNullish = quotaLimit ?? 1000; // 0    (CORRECT! 0 is preserved)
```

> **Syntax Safety Rule**: You cannot combine `??` directly with `&&` or `||` without parentheses.
> ```javascript
> // SYNTAX ERROR:
> const val = a && b ?? c;
>
> // VALID (Parentheses make order explicit):
> const val = (a && b) ?? c;
> ```

---

## 3. Optional Chaining (`?.`) Mechanics

Optional chaining allows you to safely traverse nested object trees without throwing a `TypeError: Cannot read properties of undefined/null`.

```text
               user?.profile?.settings?.theme
                      │
   Is user null/undefined? ──Yes──► Return undefined immediately (Short-circuit!)
                      │ No
   Is profile null/undefined? ──Yes──► Return undefined immediately
                      │ No
   Read theme property
```

### The 3 Forms of Optional Chaining
1. **Property Access**: `obj?.prop`
2. **Computed Bracket Access**: `obj?.[expression]` (useful for dynamic keys or array indexing: `users?.[0]?.name`)
3. **Method Invocations**: `obj?.onComplete?.(payload)` (only invokes `onComplete` if it is not null or undefined)

### What `?.` Does NOT Protect Against:
* **Undeclared Variables**: `undeclaredVar?.prop` still throws `ReferenceError: undeclaredVar is not defined`.
* **Calling Non-Functions**: If `obj.onComplete` is `"string"` instead of a function, `obj.onComplete?.()` throws `TypeError: obj.onComplete is not a function`.

---

## 4. Logical Assignment Operators (ES2021)

Modern JavaScript introduced compound operators that combine logic with variable reassignment:

| Operator | Syntax | Equivalent Logic | Purpose |
|---|---|---|---|
| **OR Assignment** | `x ||= y` | `x || (x = y)` | Assign only if `x` is falsy |
| **AND Assignment** | `x &&= y` | `x && (x = y)` | Assign only if `x` is truthy |
| **Nullish Assignment** | `x ??= y` | `x ?? (x = y)` | Assign only if `x` is null/undefined |

```javascript
// Practical Example: Setting default configuration options
function configureUpload(options) {
  options.timeout ??= 30000; // Only sets 30000 if options.timeout is null or undefined
  options.retries ??= 3;
}
```

---

## 5. Bitwise Operators & High-Performance Permission Flags

Computers process bitwise operations in a single CPU cycle. In JavaScript, bitwise operators convert their operands to **32-bit signed integers in two's complement**.

### The Bitwise Operators
* `&` (Bitwise AND): `1 & 1 === 1`, otherwise `0`.
* `|` (Bitwise OR): `0 | 0 === 0`, otherwise `1`.
* `^` (Bitwise XOR): `1` if bits are different, `0` if identical.
* `~` (Bitwise NOT): Inverts all bits.
* `<<` (Left Shift): Shifts bits left, multiplying by powers of 2.

### Production Pattern: Role-Based Permission Mask
Instead of storing array permissions like `["READ", "WRITE", "DELETE"]` and searching through strings, systems like Linux and Google Drive use a single byte integer:

```javascript
// Define permissions as single bit flags using bit-shift:
const PERM_READ   = 1 << 0; // 0001 (1)
const PERM_WRITE  = 1 << 1; // 0010 (2)
const PERM_DELETE = 1 << 2; // 0100 (4)
const PERM_SHARE  = 1 << 3; // 1000 (8)

// 1. Granting permissions: Use Bitwise OR (|)
const editorPermissions = PERM_READ | PERM_WRITE; // 0011 (3)

// 2. Checking permissions: Use Bitwise AND (&)
const canWrite = (editorPermissions & PERM_WRITE) !== 0; // true
const canDelete = (editorPermissions & PERM_DELETE) !== 0; // false

// 3. Revoking permissions: Use Bitwise AND with NOT (& ~)
const viewerPermissions = editorPermissions & ~PERM_WRITE; // 0001 (Revoked write!)
```

---

## 6. Advanced Control Flow & Loops

### 6.1 `for...of` vs `for...in` (The Critical Difference)
* **`for...of`** (ES6): Iterates over **Values** of an **Iterable** (Arrays, Strings, Sets, Maps, Node Streams).
* **`for...in`**: Iterates over all **Enumerable Property Keys** of an object and its **entire prototype chain**.

```javascript
const chunkSizes = [1024, 2048, 4096];
chunkSizes.customTag = "metadata";

// for...of prints the values:
for (const size of chunkSizes) {
  console.log(size); // 1024, 2048, 4096 (Stops at values, ignores custom properties)
}

// for...in prints keys (including arbitrary properties and prototypes!):
for (const key in chunkSizes) {
  console.log(key); // "0", "1", "2", "customTag" (NEVER use for...in on arrays!)
}
```

### 6.2 Labeled Statements (Breaking Nested Loops Cleanly)
When you have nested loops (e.g., matching upload chunks across multiple files), `break` only exits the innermost loop. A **label** lets you break out of an outer loop directly:

```javascript
fileLoop: for (let f = 0; f < files.length; f++) {
  chunkLoop: for (let c = 0; c < files[f].chunks.length; c++) {
    if (files[f].chunks[c].isCorrupted) {
      console.log(`Corrupted chunk in file ${f}. Aborting whole batch.`);
      break fileLoop; // Jumps completely out of both loops!
    }
  }
}
```

---

## 7. Syntax Deconstruction

### 1. `++x` (Prefix) vs `x++` (Postfix)
```javascript
let a = 5;
let b = ++a; // Prefix: Increments 'a' FIRST, then returns new value (a=6, b=6)

let x = 5;
let y = x++; // Postfix: Returns current value FIRST, then increments 'x' (x=6, y=5)
```
*Why it matters in loops*: In simple `for (let i = 0; i < 10; i++)`, both work the same because the return value is discarded. But in assignment expressions like `buffer[offset++] = byte;`, postfix is an idiomatic way to write the byte and advance the index in a single line.

---

## 8. Senior Traps & Footguns

### Trap 1: The Switch Statement Fallthrough
```javascript
function handleUploadEvent(event) {
  let status = "";
  switch (event.type) {
    case "UPLOAD_INIT":
      status = "Pending";
      // FORGOT BREAK!
    case "UPLOAD_SUCCESS":
      status = "Completed";
      break;
  }
  return status;
}

console.log(handleUploadEvent({ type: "UPLOAD_INIT" })); // Returns "Completed"!
```
* **Why**: Without `break` or `return`, execution falls directly through into the next case regardless of whether the condition matches.

### Trap 2: Relying on `||` for System Port Configuration
```javascript
// Reading port from environment
const PORT = process.env.PORT || 3000;
```
* If `process.env.PORT` is set to `"0"` (meaning "bind to any available random OS port"), `"0"` is converted to number `0` in downstream math, but `||` treats `"0"` as truthy if string, but if coerced, `0 || 3000` will override it.
* Better:
  ```javascript
  const PORT = process.env.PORT ?? 3000;
  ```

---

## 9. Active Engineering Challenge (Write It Yourself)

Create `test-module-03.js` and build this permission engine yourself.

### Challenge: Bitwise File Permission System
**Requirements**:
1. Define the 4 standard permissions using binary bit shifts:
   * `READ` ($1$)
   * `WRITE` ($2$)
   * `DELETE` ($4$)
   * `SHARE` ($8$)
2. Create an object `PermissionManager` with 4 pure methods:
   * `grant(currentMask, permissionToGrant)`: Returns updated mask containing the new permission.
   * `revoke(currentMask, permissionToRevoke)`: Returns updated mask with the permission removed.
   * `has(currentMask, permissionToCheck)`: Returns boolean `true` if currentMask contains the permission, `false` otherwise.
   * `list(currentMask)`: Returns an array of human-readable strings representing all active permissions (e.g., `["READ", "WRITE"]`).

### Test Assertions to Verify:
```javascript
let userPerms = 0; // Starts with zero permissions

// Grant Read and Share
userPerms = PermissionManager.grant(userPerms, PermissionManager.READ);
userPerms = PermissionManager.grant(userPerms, PermissionManager.SHARE);

console.log("Has READ (must be true):", PermissionManager.has(userPerms, PermissionManager.READ));
console.log("Has WRITE (must be false):", PermissionManager.has(userPerms, PermissionManager.WRITE));
console.log("Has SHARE (must be true):", PermissionManager.has(userPerms, PermissionManager.SHARE));

// Revoke Read
userPerms = PermissionManager.revoke(userPerms, PermissionManager.READ);
console.log("Has READ after revoke (must be false):", PermissionManager.has(userPerms, PermissionManager.READ));

// Check list
console.log("Active list (must be ['SHARE']):", PermissionManager.list(userPerms));
```

Write and test your solution, then paste your code in chat for review!
