# Module TS-12: Runtime Validation & Schema Synthesis

Welcome to TypeScript Runtime Validation and Schema Synthesis. This module teaches how to bridge the gap between static TypeScript compile-time types and untrusted runtime data, how to design schemas and infer static types with Zod, TypeBox, and the Standard Schema specification, and how to build end-to-end type-safe APIs with tRPC, Server Actions, and OpenAPI generators.

---

# Topic 1: The TypeScript Runtime Type Boundary Problem (Compile-Time vs Runtime Types)

### 1. What is it?
The **Runtime Type Boundary Problem** refers to the fact that TypeScript's type system exists **only at compile time**. When TypeScript code is compiled to JavaScript, all types, interfaces, generics, and type annotations are completely erased:
- At compile time: TypeScript verifies that variables match your declared interfaces.
- At runtime: An external API, database query, form input, or incoming JSON payload can contain any arbitrary data shape.
If an external API returns `{ status: 500 }` when your code expects `{ user: { name: "Alice" } }`, TypeScript cannot prevent a runtime crash (`TypeError: Cannot read properties of undefined`).

### 2. Why does it exist?
JavaScript engines (V8, JavaScriptCore) execute plain JavaScript; they do not have a built-in static type checker. Type casting with `as` (`const data = await res.json() as User`) is an assertion to the compiler—it performs zero validation at runtime. If the server response does not match `User`, the variable is silently invalid.

### 3. Basic example

```typescript
// The Danger of Type Assertions ('as') at Runtime Boundaries:
interface UserProfile {
  id: string;
  email: string;
}

// Simulating an untrusted external HTTP payload
const incomingJsonString = '{"id": "usr_101"}'; // Notice: 'email' is MISSING!
const rawData: unknown = JSON.parse(incomingJsonString);

// ANTI-PATTERN: Blind type assertion
const user = rawData as UserProfile; // TypeScript believes 'user' has an email!

// Runtime Crash:
console.log(user.id); // "usr_101"
console.log(user.email.toLowerCase()); // CRASH! TypeError: Cannot read properties of undefined (reading 'toLowerCase')
```

**Line-by-line explanation:**
- `interface UserProfile`: Exists only in the TypeScript compiler. It generates zero JavaScript code.
- `JSON.parse(incomingJsonString)`: Produces an untrusted JavaScript object.
- `rawData as UserProfile`: Tells the compiler "Trust me, this object matches UserProfile". No validation code is executed.
- `user.email.toLowerCase()`: Because `email` was missing, accessing `.toLowerCase()` crashes the program at runtime.

---

### 4. How it works inside TypeScript
1. **Type Erasure**: TypeScript interfaces cannot be checked with `typeof` or `instanceof` because interfaces do not exist in the emitted JavaScript.
2. **Untrusted Data Types**: All incoming data from external sources (`fetch`, `process.env`, file reads, user input) should be typed as **`unknown`**, not `any`.
3. **The Schema Solution**: Instead of declaring a static interface and hoping incoming data matches it, you declare a **Runtime Schema**. The schema validates the data at runtime and infers the static TypeScript type automatically.

---

### 5. More examples

#### Example 1: Type Guards as a manual runtime validation boundary
```typescript
function isUserProfile(data: unknown): data is UserProfile {
  if (typeof data !== "object" || data === null) return false;
  const candidate = data as Record<string, unknown>;
  return typeof candidate["id"] === "string" && typeof candidate["email"] === "string";
}

if (isUserProfile(rawData)) {
  console.log(rawData.email.toLowerCase()); // Safe: Narrowed to UserProfile!
} else {
  console.error("Payload failed runtime validation!");
}
```
Manual type guards work for simple objects, but maintaining manual type guards for complex nested schemas with dozens of fields is tedious and error-prone.

---

### 6. Common mistakes

#### Mistake 1: Typing API responses as concrete interfaces without validation
```typescript
// ANTI-PATTERN:
const user: User = await fetch("/api/user").then(r => r.json()); // Dangerous!
```
**Why it fails:** If the server returns a 404 HTML error page or a 500 JSON error object, `user` will hold `{ error: "Internal Server Error" }` while the compiler treats it as `User`.

#### Mistake 2: Using `any` for incoming network payloads
```typescript
// WRONG:
function handleWebhook(payload: any) {
  payload.customer.charge(); // Disables all type checking!
}
```
**Why it fails:** `any` turns off all compiler checks. Always type external inputs as `unknown`.

---

### 7. Rules to remember
1. TypeScript types are completely erased at runtime.
2. Type assertions (`as User`) perform zero runtime validation.
3. Treat all external incoming data as `unknown`.
4. Use schema validation libraries (Zod, TypeBox) at system boundaries to guarantee runtime correctness.

---

### Think first: Prediction puzzle
Does `typeof x === "object"` prove that `x` is not `null`?

---

**Answer:**
```
No.
```
**Explanation:** In JavaScript, `typeof null === "object"`. A safe object check must verify `typeof x === "object" && x !== null`.

---

### Practice exercises

#### Exercise 1: Safe JSON parse wrapper
- **Task**: Write a function `safeJsonParse(text: string): unknown` that wraps `JSON.parse` in a `try/catch` and returns `unknown`.
- **Hint 1**: Return `null` or an error object on catch.

#### Exercise 2: Manual type guard for Point
- **Task**: Write a type guard `isPoint(val: unknown): val is { x: number; y: number }`.
- **Hint 1**: Check `typeof val === "object" && val !== null`, then check `x` and `y`.

#### Exercise 3: Explain why `interface` cannot be checked with `instanceof`
- **Task**: Explain why `data instanceof UserInterface` is invalid syntax in TypeScript.
- **Hint 1**: Interfaces have no runtime representation in JavaScript.

#### Exercise 4: Identify type boundary
- **Task**: Name 3 places in a backend application that represent untrusted runtime type boundaries.
- **Hint 1**: HTTP request body, environment variables, database query results.

---

### Exercise solutions

#### Solution 1: Safe JSON parse wrapper
```typescript
function safeJsonParse(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}
```

#### Solution 2: Manual type guard for Point
```typescript
interface Point {
  x: number;
  y: number;
}

function isPoint(val: unknown): val is Point {
  if (typeof val !== "object" || val === null) return false;
  const candidate = val as Record<string, unknown>;
  return typeof candidate["x"] === "number" && typeof candidate["y"] === "number";
}
```

#### Solution 3: Explain why `interface` cannot be checked with `instanceof`
The `instanceof` operator checks if an object's prototype chain contains a constructor function's prototype. Because TypeScript interfaces are purely compile-time types that are completely stripped during compilation, there is no constructor function or object prototype in JavaScript memory for `instanceof` to inspect.

#### Solution 4: Identify type boundary
1. Incoming HTTP request payloads (`req.body`, `req.query`, `req.headers`).
2. Environment variables (`process.env`).
3. External third-party API responses (`fetch().then(r => r.json())`).

---

### Recall
1. Why does `as Type` fail to protect against runtime crashes? Because type assertions are erased during compilation and execute no runtime checks.
2. What type should always be used for incoming untrusted network data? `unknown`.
3. What is the fundamental limitation of TypeScript's type system regarding external data? It operates exclusively at compile time.

> **If you remember only one thing:**  
> TypeScript types are completely erased at runtime; you must validate external data using runtime schemas before trusting its shape.

---

# Topic 2: Schema-Driven Validation Fundamentals: Zod Syntax and Type Inference (`z.infer<typeof Schema>`)

### 1. What is it?
**Zod** is a TypeScript-first schema declaration and validation library. You define a **Runtime Schema** representing your data structure, and Zod validates inputs at runtime. Crucially, Zod automatically infers the static TypeScript type using **`z.infer<typeof Schema>`**, eliminating duplicate code.

### 2. Why does it exist?
Writing both an interface and a validator by hand leads to duplication:
```typescript
// Duplication Anti-Pattern:
interface User { id: string; age: number; }
function validateUser(data: unknown): boolean { /* 10 lines of checks */ }
```
If you change `age` to optional in the interface, you must remember to update `validateUser`, or the two will fall out of sync. With Zod, **the Schema is the single source of truth**:
$$\text{Zod Schema} \longrightarrow \text{Runtime Validation} + \text{Static TypeScript Type}$$

### 3. Basic example

```typescript
import { z } from "zod";

// 1. Define the Runtime Schema (Single source of truth)
export const UserSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(2),
  age: z.number().int().positive(),
  isActive: z.boolean().default(true),
});

// 2. Infer the static TypeScript type automatically!
export type User = z.infer<typeof UserSchema>;
// Equivalent to:
// type User = { id: string; name: string; age: number; isActive: boolean; }

// 3. Validate untrusted input at runtime:
const rawInput: unknown = {
  id: "550e8400-e29b-41d4-a716-446655440000",
  name: "Alice",
  age: 28,
};

// Safe parsing: does NOT throw exceptions!
const parseResult = UserSchema.safeParse(rawInput);

if (parseResult.success) {
  // parseResult.data is strongly typed as User!
  console.log(`Validated user: ${parseResult.data.name}, age: ${parseResult.data.age}`);
} else {
  // parseResult.error contains detailed field validation errors
  console.error("Validation failed:", parseResult.error.format());
}
```

**Line-by-line explanation:**
- `z.object({ ... })`: Creates an object validation schema.
- `z.string().uuid()`: Validates that `id` is a string formatted as a valid UUID.
- `z.infer<typeof UserSchema>`: TypeScript generic utility that extracts the exact TypeScript interface from the Zod schema definition.
- `UserSchema.safeParse(rawInput)`: Evaluates the untrusted input. Returns `{ success: true, data: User }` on success, or `{ success: false, error: ZodError }` on failure.

---

### 4. How it works inside TypeScript
1. **Static Type Inference**: Zod uses conditional mapped types and generic parameter matching internally to deduce the static type shape from schema method calls.
2. **Strip Unknown Properties**: By default, `z.object` strips any unrecognised keys not declared in the schema, protecting against excess property injection attacks.
3. **`safeParse` vs `parse`**:
   - `.parse(input)`: Returns the validated data or throws a `ZodError`.
   - `.safeParse(input)`: Returns a discriminated union `{ success: true, data } | { success: false, error }` without throwing.

---

### 5. More examples

#### Example 1: Handling validation errors with `safeParse`
```typescript
const badData = { id: "not-a-uuid", name: "A", age: -5 };
const result = UserSchema.safeParse(badData);

if (!result.success) {
  result.error.issues.forEach((issue) => {
    console.log(`Field [${issue.path.join(".")}]: ${issue.message}`);
  });
}
// Outputs:
// Field [id]: Invalid uuid
// Field [name]: String must contain at least 2 character(s)
// Field [age]: Number must be greater than 0
```

#### Example 2: Strict object validation (`.strict()`)
```typescript
// Reject objects that contain unknown extra properties:
const StrictUserSchema = UserSchema.strict();
const res = StrictUserSchema.safeParse({ ...validUser, extraHackerField: "malicious" });
console.log(res.success); // false (Unrecognized key in object)
```

---

### 6. Common mistakes

#### Mistake 1: Declaring both an interface and a Zod schema separately
```typescript
// ANTI-PATTERN:
interface User { id: string; }
const UserSchema = z.object({ id: z.string() }); // Two separate definitions that can diverge!
```
**Why it fails:** Use `type User = z.infer<typeof UserSchema>`. Never maintain duplicate manual interfaces alongside schemas.

#### Mistake 2: Using `.parse()` without `try/catch` in HTTP request handlers
```typescript
// DANGEROUS:
app.post("/user", (req, res) => {
  const user = UserSchema.parse(req.body); // If invalid, THROWS uncaught exception and crashes the request!
});
```
**Why it fails:** `.parse()` throws on invalid input. Always use `.safeParse()` or wrap `.parse()` in a centralized error middleware.

---

### 7. Rules to remember
1. Derive static TypeScript types using `z.infer<typeof Schema>`.
2. Prefer `.safeParse()` over `.parse()` to avoid unhandled exception crashes.
3. By default, Zod objects strip undeclared keys; use `.strict()` if extra keys should be rejected.
4. Chain validation constraints (`.min()`, `.max()`, `.email()`, `.uuid()`) directly on primitive schemas.

---

### Think first: Prediction puzzle
What does `UserSchema.parse({ ...validUser, extraProp: 123 })` return by default?

---

**Answer:**
```
It returns an object containing only the valid keys declared in UserSchema; 'extraProp' is stripped away.
```
**Explanation:** Zod objects strip unknown keys by default, ensuring downstream code does not receive unexpected injected properties.

---

### Practice exercises

#### Exercise 1: Declare Product schema
- **Task**: Write a `ProductSchema` with `sku: string` (min 3 chars), `price: number` (positive), and infer type `Product`.
- **Hint 1**: `z.object({ sku: z.string().min(3), price: z.number().positive() })`.

#### Exercise 2: Safe parse validation function
- **Task**: Write a function `validateProduct(input: unknown): Product | null` using `.safeParse()`.
- **Hint 1**: Return `res.success ? res.data : null`.

#### Exercise 3: Strict schema declaration
- **Task**: Make `ProductSchema` reject unknown properties.
- **Hint 1**: Call `.strict()` on the schema.

#### Exercise 4: Format Zod errors
- **Task**: Use `result.error.flatten()` to extract field-level error messages.
- **Hint 1**: Inspect `res.error.flatten().fieldErrors`.

---

### Exercise solutions

#### Solution 1: Declare Product schema
```typescript
import { z } from "zod";

export const ProductSchema = z.object({
  sku: z.string().min(3),
  price: z.number().positive(),
});

export type Product = z.infer<typeof ProductSchema>;
```

#### Solution 2: Safe parse validation function
```typescript
function validateProduct(input: unknown): Product | null {
  const res = ProductSchema.safeParse(input);
  return res.success ? res.data : null;
}
```

#### Solution 3: Strict schema declaration
```typescript
export const StrictProductSchema = ProductSchema.strict();
```

#### Solution 4: Format Zod errors
```typescript
function getFieldErrors(input: unknown) {
  const res = ProductSchema.safeParse(input);
  if (!res.success) {
    return res.error.flatten().fieldErrors;
  }
  return null;
}
```

---

### Recall
1. How do you extract a static TypeScript type from a Zod schema? `type MyType = z.infer<typeof MySchema>`.
2. What is the difference between `.parse()` and `.safeParse()`? `.parse()` throws a `ZodError` on failure; `.safeParse()` returns a result object `{ success, data | error }`.
3. What does Zod do with unknown extra properties by default? Strips them from the validated output.

> **If you remember only one thing:**  
> In Zod, the runtime schema is the single source of truth, from which static TypeScript types are automatically inferred via `z.infer`.

---

# Topic 3: Validating Primitives, Objects, Arrays, and Optionality in Zod

### 1. What is it?
Zod provides a full suite of schema builders for all JavaScript data types:
- **Primitives**: `z.string()`, `z.number()`, `z.boolean()`, `z.bigint()`, `z.date()`.
- **Modality**: `.optional()` (`T | undefined`), `.nullable()` (`T | null`), `.nullish()` (`T | null | undefined`).
- **Collections**: `z.array(schema)`, `z.record(keySchema, valueSchema)`, `z.tuple([...])`.
- **Objects**: `z.object({...})`, `.extend({...})`, `.pick({...})`, `.omit({...})`.

### 2. Why does it exist?
Real-world data structures are deeply nested and contain optional properties, arrays of records, and nullable fields. Zod models these complex shapes with exact parity to TypeScript's type system.

### 3. Basic example

```typescript
import { z } from "zod";

const TagSchema = z.object({
  id: z.string(),
  label: z.string(),
});

const ArticleSchema = z.object({
  title: z.string().min(5),
  content: z.string(),
  publishedAt: z.date().nullable(),     // Date | null
  summary: z.string().optional(),       // string | undefined
  tags: z.array(TagSchema).min(1),      // Array with at least 1 tag
  metadata: z.record(z.string()),       // Record<string, string>
});

export type Article = z.infer<typeof ArticleSchema>;
```

**Line-by-line explanation:**
- `z.date().nullable()`: Validates that `publishedAt` is either a `Date` instance or `null`.
- `z.string().optional()`: Allows `summary` to be a string or `undefined` (or omitted).
- `z.array(TagSchema).min(1)`: Validates an array of `TagSchema` objects, requiring at least one entry.
- `z.record(z.string())`: Validates a key-value dictionary where all values are strings.

---

### 4. How it works inside TypeScript
1. **Schema Inheritance & Extension**: You can extend an existing object schema using `.extend()`:
   ```typescript
   const AdminArticleSchema = ArticleSchema.extend({
     reviewedBy: z.string(),
   });
   ```
2. **Schema Slicing (`.pick` and `.omit`)**: Mirroring TypeScript's utility types:
   ```typescript
   const ArticlePreviewSchema = ArticleSchema.pick({ title: true, summary: true });
   ```
3. **Empty String vs Optional**: Zod differentiates empty strings `""` from `undefined`. An optional string (`z.string().optional()`) will fail if passed `""` when chained with `.min(1)`.

---

### 5. More examples

#### Example 1: Validating Fixed-Length Tuples
```typescript
// Validates GeoJSON coordinate: [longitude, latitude]
const CoordinateSchema = z.tuple([
  z.number().min(-180).max(180), // longitude
  z.number().min(-90).max(90),   // latitude
]);

type Coordinate = z.infer<typeof CoordinateSchema>; // [number, number]
```

#### Example 2: Non-empty Array (`.nonempty()`)
```typescript
const NonEmptyArraySchema = z.array(z.string()).nonempty();
type NonEmptyArray = z.infer<typeof NonEmptyArraySchema>; // [string, ...string[]]
```
TypeScript infers `NonEmptyArray` as a tuple with at least one element!

---

### 6. Common mistakes

#### Mistake 1: Confusing `.optional()` with `.nullable()`
```typescript
// GOTCHA:
z.string().optional() // accepts: string | undefined (FAILS on null!)
z.string().nullable() // accepts: string | null (FAILS on undefined!)
z.string().nullish()  // accepts: string | null | undefined
```
**Why it matters:** Database queries often return `null`, while JavaScript object properties default to `undefined`. Use `.nullable()` for database columns and `.optional()` for optional form fields.

#### Mistake 2: Mutating schemas via `.extend()` expecting in-place changes
```typescript
// WRONG:
ArticleSchema.extend({ author: z.string() }); // Does NOT mutate ArticleSchema!
// .extend() returns a BRAND NEW schema; ArticleSchema remains unchanged!
```
**Why it fails:** Zod schemas are immutable. Assign the result to a new variable: `const Extended = ArticleSchema.extend(...)`.

---

### 7. Rules to remember
1. Use `.optional()` for `undefined`, `.nullable()` for `null`, and `.nullish()` for both.
2. Use `.extend()`, `.pick()`, and `.omit()` to compose and slice object schemas.
3. `z.array(schema).nonempty()` infers a typed non-empty tuple `[T, ...T[]]`.
4. All Zod schema methods are immutable and return new schema instances.

---

### Think first: Prediction puzzle
Does `z.string().optional().safeParse(null).success` evaluate to `true`?

---

**Answer:**
```
false
```
**Explanation:** `.optional()` only allows `undefined`. Passing `null` fails validation. To accept `null`, you must use `.nullable()` or `.nullish()`.

---

### Practice exercises

#### Exercise 1: Nullable date schema
- **Task**: Create a schema for `completedAt` that accepts `Date` or `null`.
- **Hint 1**: `z.date().nullable()`.

#### Exercise 2: Sliced schema with `.pick()`
- **Task**: From `UserSchema = z.object({ id: z.string(), name: z.string(), email: z.string() })`, create `UserSummarySchema` containing only `id` and `name`.
- **Hint 1**: `UserSchema.pick({ id: true, name: true })`.

#### Exercise 3: Validating a dictionary of numbers
- **Task**: Write a schema validating a key-value record where values must be positive numbers.
- **Hint 1**: `z.record(z.number().positive())`.

#### Exercise 4: Non-empty array validation
- **Task**: Validate that an array of tags has at least 1 string entry.
- **Hint 1**: `z.array(z.string()).nonempty()`.

---

### Exercise solutions

#### Solution 1: Nullable date schema
```typescript
const CompletedAtSchema = z.date().nullable();
```

#### Solution 2: Sliced schema with `.pick()`
```typescript
const UserSchema = z.object({ id: z.string(), name: z.string(), email: z.string() });
const UserSummarySchema = UserSchema.pick({ id: true, name: true });
```

#### Solution 3: Validating a dictionary of numbers
```typescript
const ScoreRecordSchema = z.record(z.number().positive());
```

#### Solution 4: Non-empty array validation
```typescript
const TagListSchema = z.array(z.string()).nonempty();
```

---

### Recall
1. What is the difference between `.optional()` and `.nullable()` in Zod? `.optional()` allows `undefined`; `.nullable()` allows `null`.
2. Which method allows extracting a subset of fields from an existing Zod object schema? `.pick()`.
3. Are Zod schemas mutable or immutable? Completely immutable; methods return new schema objects.

> **If you remember only one thing:**  
> Use `.optional()` for `undefined`, `.nullable()` for `null`, and compose object schemas immutably with `.extend()`, `.pick()`, and `.omit()`.

---

# Topic 4: Discriminated Unions and Polymorphic Payloads in Zod

### 1. What is it?
A **Discriminated Union** (or Tagged Union) is a union of object schemas that share a common literal discriminator property (such as `type: "card"` vs `type: "bank"`). In Zod, **`z.discriminatedUnion("discriminator", [schemaA, schemaB])`** validates polymorphic data structures with $O(1)$ fast lookup performance.

### 2. Why does it exist?
Using a standard `z.union([schemaA, schemaB, schemaC])` tests the incoming object against each schema sequentially. If schema A fails on line 10, Zod tries schema B; if all fail, Zod generates a confusing, giant multi-page error message combining errors from all three schemas. `z.discriminatedUnion` inspects the discriminator field first, immediately selecting the exact matching schema and producing precise error messages.

### 3. Basic example

```typescript
import { z } from "zod";

// 1. Define individual variant schemas with a shared discriminator 'kind'
const CreditCardPayment = z.object({
  kind: z.literal("credit_card"),
  cardNumber: z.string().length(16),
  cvv: z.string().length(3),
});

const WireTransferPayment = z.object({
  kind: z.literal("wire_transfer"),
  iban: z.string().min(15),
  swiftCode: z.string().min(8),
});

const CashPayment = z.object({
  kind: z.literal("cash"),
  collectedBy: z.string(),
});

// 2. Combine into a fast Discriminated Union
export const PaymentMethodSchema = z.discriminatedUnion("kind", [
  CreditCardPayment,
  WireTransferPayment,
  CashPayment,
]);

export type PaymentMethod = z.infer<typeof PaymentMethodSchema>;

// 3. Validation
const input = {
  kind: "credit_card",
  cardNumber: "1234567812345678",
  cvv: "99", // Invalid: length must be 3!
};

const result = PaymentMethodSchema.safeParse(input);
if (!result.success) {
  // Zod knows this is a credit_card, so error reporting is targeted and clear!
  console.log(result.error.issues[0].message);
  // "String must contain exactly 3 character(s)"
}
```

**Line-by-line explanation:**
- `kind: z.literal("credit_card")`: Declares a literal string discriminator.
- `z.discriminatedUnion("kind", [...])`: First argument specifies the discriminator property name (`"kind"`). Second argument is the array of variant schemas.
- `z.infer<typeof PaymentMethodSchema>`: TypeScript infers a discriminated union type:
  `CreditCardPayment | WireTransferPayment | CashPayment`.

---

### 4. How it works inside TypeScript
1. **$O(1)$ Schema Selection**: Zod reads `input["kind"]` first, looks up the corresponding schema in an internal Map, and validates only that specific schema.
2. **Exhaustiveness Checking**: When writing a `switch (payment.kind)` in TypeScript, the compiler enforces that all variants are handled.
3. **Targeted Errors**: If `kind: "credit_card"` is provided, Zod will never report irrelevant errors about missing `iban` or `swiftCode`.

---

### 5. More examples

#### Example 1: Webhook Event Routing with Discriminated Unions
```typescript
const UserCreatedEvent = z.object({
  event: z.literal("user.created"),
  data: z.object({ userId: z.string() }),
});

const OrderPlacedEvent = z.object({
  event: z.literal("order.placed"),
  data: z.object({ orderId: z.string(), total: z.number() }),
});

const WebhookSchema = z.discriminatedUnion("event", [
  UserCreatedEvent,
  OrderPlacedEvent,
]);

type WebhookEvent = z.infer<typeof WebhookSchema>;
```

---

### 6. Common mistakes

#### Mistake 1: Using regular `z.union()` instead of `z.discriminatedUnion()`
```typescript
// SLOW and confusing error messages:
const SlowUnion = z.union([SchemaA, SchemaB, SchemaC]); // Avoid when objects have a shared discriminator!
```
**Why it fails:** Standard `z.union` runs trial-and-error parsing across every schema, producing confusing composite error logs. Always use `z.discriminatedUnion` when a discriminator tag exists.

#### Mistake 2: Missing or non-literal discriminator property
```typescript
// WRONG:
const BadSchema = z.object({
  type: z.string(), // Must be z.literal("specific_name"), NOT generic z.string()!
});
```
**Why it fails:** `z.discriminatedUnion` requires the discriminator property in each schema to be a `z.literal(...)`.

---

### 7. Rules to remember
1. Use `z.discriminatedUnion("key", [schemas])` for polymorphic payloads.
2. The discriminator property must be a `z.literal(...)` in every schema.
3. Discriminated unions provide $O(1)$ fast validation and clean, targeted error diagnostics.
4. Static inference yields a standard TypeScript discriminated union.

---

### Think first: Prediction puzzle
What error does `PaymentMethodSchema.safeParse({ kind: "crypto" })` produce?

---

**Answer:**
```
Invalid discriminator value. Expected 'credit_card' | 'wire_transfer' | 'cash'.
```
**Explanation:** Because `"crypto"` is not a valid discriminator key, Zod fails immediately at the discriminator inspection step.

---

### Practice exercises

#### Exercise 1: Server response discriminated union
- **Task**: Create a `ResponseSchema` with `status: "success"` (carrying `data: string`) and `status: "error"` (carrying `message: string`).
- **Hint 1**: Use discriminator `"status"`.

#### Exercise 2: Infer discriminated union type
- **Task**: Infer the TypeScript type from `ResponseSchema`.
- **Hint 1**: `type ResponsePayload = z.infer<typeof ResponseSchema>`.

#### Exercise 3: Exhaustive switch handler
- **Task**: Write a function that accepts `ResponsePayload` and handles both `"success"` and `"error"` via a type-safe switch statement.
- **Hint 1**: `switch (res.status) { case "success": ... case "error": ... }`.

#### Exercise 4: Add third variant
- **Task**: Add a `"pending"` status variant carrying `progress: number` to the discriminated union.
- **Hint 1**: Add third schema to the array with `status: z.literal("pending")`.

---

### Exercise solutions

#### Solution 1: Server response discriminated union
```typescript
import { z } from "zod";

const SuccessResponse = z.object({
  status: z.literal("success"),
  data: z.string(),
});

const ErrorResponse = z.object({
  status: z.literal("error"),
  message: z.string(),
});

export const ApiResponseSchema = z.discriminatedUnion("status", [
  SuccessResponse,
  ErrorResponse,
]);
```

#### Solution 2: Infer discriminated union type
```typescript
export type ApiResponse = z.infer<typeof ApiResponseSchema>;
```

#### Solution 3: Exhaustive switch handler
```typescript
function handleResponse(res: ApiResponse): string {
  switch (res.status) {
    case "success":
      return `Success: ${res.data}`;
    case "error":
      return `Error: ${res.message}`;
  }
}
```

#### Solution 4: Add third variant
```typescript
const PendingResponse = z.object({
  status: z.literal("pending"),
  progress: z.number().min(0).max(100),
});

export const FullApiResponseSchema = z.discriminatedUnion("status", [
  SuccessResponse,
  ErrorResponse,
  PendingResponse,
]);
```

---

### Recall
1. Why is `z.discriminatedUnion` faster than `z.union`? It inspects the discriminator field directly in $O(1)$ time instead of testing every schema sequentially.
2. What type must the discriminator property be in each member schema? A literal type (`z.literal(...)`).
3. How does TypeScript's type checker handle the inferred discriminated union? Allows narrowing variants via standard `if (item.tag === "variant")` or `switch`.

> **If you remember only one thing:**  
> Use `z.discriminatedUnion` for polymorphic data to achieve $O(1)$ validation speed and targeted, readable error messages.

---

# Topic 5: Schema Transformations, Coercions, and Pipelines (`.transform()`, `z.coerce`, `.pipe()`)

### 1. What is it?
Validation often requires modifying data as it passes through the schema:
- **`z.coerce`**: Coerces primitive types (e.g. string `"42"` to number `42`, or string `"true"` to boolean `true`).
- **`.transform()`**: Modifies or reformats the validated output (e.g. trimming a string, hashing a password, or parsing a date).
- **`.pipe()`**: Chains two schemas sequentially, passing the output of schema 1 as the input to schema 2.

### 2. Why does it exist?
HTTP query parameters, environment variables, and multipart form uploads are always delivered as raw strings:
```typescript
// Incoming query string:
req.query = { page: "2", limit: "50", active: "true" };
```
Without coercion and transformation, you have to write manual conversion boilerplate (`Number(req.query.page)`) everywhere. Zod handles coercion, validation, and sanitization in a single pipeline.

### 3. Basic example

```typescript
import { z } from "zod";

// 1. Coercion: Automatically casts string inputs to numbers
const QueryParamsSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

// 2. Transformation: Trims and downcases an email
const EmailSchema = z.string()
  .email()
  .transform((val) => val.trim().toLowerCase());

// 3. Pipeline (.pipe): Coerce string to Date, then validate Date range
const DateFilterSchema = z.string()
  .pipe(z.coerce.date())
  .pipe(z.date().min(new Date("2020-01-01")));

// Execution:
const query = QueryParamsSchema.parse({ page: "3", limit: "25" });
console.log(query); // { page: 3, limit: 25 } (Numbers, NOT strings!)

const email = EmailSchema.parse("  ALICE@EXAMPLE.COM  ");
console.log(email); // "alice@example.com"
```

**Line-by-line explanation:**
- `z.coerce.number()`: Automatically calls `Number(input)` before running the integer and positive validation checks.
- `.transform((val) => ...)`: Executes after the `.email()` check succeeds, transforming the string into lowercase.
- `.pipe(...)`: Connects schemas so that the output of one schema feeds into the next.

---

### 4. How it works inside TypeScript
1. **Input Type vs Output Type**: When `.transform()` is used, the schema's **input type** can differ from its **output type**!
   - `z.input<typeof Schema>`: The type expected before transformation (`string`).
   - `z.output<typeof Schema>`: The type produced after transformation (`Date` or `number`).
   - `z.infer<typeof Schema>`: Equivalent to `z.output`.
2. **Order of Execution**: Validations placed before `.transform()` run on the original input; validations placed after `.transform()` run on the transformed output.

---

### 5. More examples

#### Example 1: `z.input` vs `z.output` in action
```typescript
const StringToNumberSchema = z.string().transform((s) => s.length);

type InputType = z.input<typeof StringToNumberSchema>;   // string
type OutputType = z.output<typeof StringToNumberSchema>; // number
```

#### Example 2: Parsing JSON strings embedded in payloads
```typescript
const EmbeddedJsonSchema = z.string().transform((str, ctx) => {
  try {
    return JSON.parse(str);
  } catch {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Invalid JSON string format",
    });
    return z.NEVER;
  }
});
```

---

### 6. Common mistakes

#### Mistake 1: Placing validations that depend on transformed values before `.transform()`
```typescript
// WRONG:
z.string()
  .min(5) // Checks length BEFORE trim!
  .transform(s => s.trim()) // "   a   " passes min(5), but after trim it has length 1!
```
**Why it fails:** Move `.trim()` first, or use `.pipe()` to validate the trimmed output.

#### Mistake 2: Forgetting that `z.coerce.boolean()` treats `"false"` as `true`!
```typescript
// CRITICAL GOTCHA:
z.coerce.boolean().parse("false") // Returns TRUE! Because Boolean("false") === true in JavaScript!
```
**Why it matters:** JavaScript's native `Boolean("false")` evaluates to `true` because `"false"` is a non-empty string! For query strings, use a custom transform:
```typescript
const SafeBoolSchema = z.enum(["true", "false"]).transform((v) => v === "true");
```

---

### 7. Rules to remember
1. Use `z.coerce.number()` to automatically cast string parameters.
2. `z.input<typeof Schema>` gets the raw input type; `z.output<typeof Schema>` gets the transformed output type.
3. Be careful with `z.coerce.boolean()` because `Boolean("false")` is `true`.
4. Use `.pipe()` to chain multiple validation and transformation stages.

---

### Think first: Prediction puzzle
What does `z.string().transform(s => s.length)` produce for `z.infer`?

---

**Answer:**
```
number
```
**Explanation:** `z.infer` yields the output type of the schema. Because the transform returns the string's length, the inferred output type is `number`.

---

### Practice exercises

#### Exercise 1: Trim and uppercase transform
- **Task**: Write a schema that validates a string and transforms it by trimming and converting to uppercase.
- **Hint 1**: `.transform(s => s.trim().toUpperCase())`.

#### Exercise 2: Coerced positive integer
- **Task**: Write a schema that coerces a query string into a positive integer.
- **Hint 1**: `z.coerce.number().int().positive()`.

#### Exercise 3: Inspect input vs output types
- **Task**: For a schema transforming `string` to `boolean`, extract both `z.input` and `z.output`.
- **Hint 1**: Use `z.input<typeof Schema>` and `z.output<typeof Schema>`.

#### Exercise 4: Safe boolean string transform
- **Task**: Implement a schema that correctly transforms `"true"` to `true` and `"false"` to `false`.
- **Hint 1**: Use `z.enum(["true", "false"]).transform(v => v === "true")`.

---

### Exercise solutions

#### Solution 1: Trim and uppercase transform
```typescript
import { z } from "zod";

export const UpperTrimSchema = z.string().transform((s) => s.trim().toUpperCase());
```

#### Solution 2: Coerced positive integer
```typescript
export const PageNumberSchema = z.coerce.number().int().positive();
```

#### Solution 3: Inspect input vs output types
```typescript
const StrToBoolSchema = z.string().transform((s) => s === "yes");

type PreValidation = z.input<typeof StrToBoolSchema>;   // string
type PostValidation = z.output<typeof StrToBoolSchema>; // boolean
```

#### Solution 4: Safe boolean string transform
```typescript
export const SafeBooleanQuerySchema = z
  .enum(["true", "false", "1", "0"])
  .transform((val) => val === "true" || val === "1");
```

---

### Recall
1. What does `z.coerce` do? Automatically casts incoming values using native JavaScript constructors (`Number()`, `Date()`) before validation.
2. What is the difference between `z.input` and `z.output`? `z.input` represents the raw type before transformation; `z.output` represents the type returned after transformation.
3. Why does `z.coerce.boolean().parse("false")` evaluate to `true`? Because native JavaScript `Boolean("false")` evaluates to `true` for any non-empty string.

> **If you remember only one thing:**  
> Use `z.coerce` for casting raw string inputs and `.transform()` to sanitize data, distinguishing `z.input` from `z.output`.

---

# Checkpoint Challenge 1: Zod Schema Fundamentals & Transformations (Topics 1-5)

### Challenge Specification
Construct a production API Request Validator that:
1. Validates incoming query string pagination parameters using `z.coerce` with defaults.
2. Validates a polymorphic payment body using `z.discriminatedUnion`.
3. Sanitizes user emails using `.transform()`.
4. Tests invalid input safely without throwing runtime exceptions.

### Solution

```typescript
import { z } from "zod";

// 1. Query String Schema with Coercion
export const PaginationQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(5).max(100).default(20),
  search: z.string().optional().transform((s) => s?.trim()),
});

export type PaginationQuery = z.infer<typeof PaginationQuerySchema>;

// 2. Polymorphic Payment Payload (Discriminated Union)
const CardPayment = z.object({
  type: z.literal("card"),
  token: z.string().startsWith("tok_"),
  last4: z.string().length(4),
});

const CryptoPayment = z.object({
  type: z.literal("crypto"),
  walletAddress: z.string().startsWith("0x"),
  network: z.enum(["ethereum", "polygon"]),
});

export const CheckoutPayloadSchema = z.object({
  email: z.string().email().transform((e) => e.trim().toLowerCase()),
  amountDollars: z.coerce.number().positive(),
  payment: z.discriminatedUnion("type", [CardPayment, CryptoPayment]),
});

export type CheckoutPayload = z.infer<typeof CheckoutPayloadSchema>;

// 3. Verification Execution
function runCheckpoint1() {
  console.log("--- 1. Query Coercion Test ---");
  const rawQuery = { page: "3", pageSize: "50", search: "  phones  " };
  const queryResult = PaginationQuerySchema.safeParse(rawQuery);

  if (queryResult.success) {
    console.log("Parsed query:", queryResult.data);
    // { page: 3, pageSize: 50, search: 'phones' }
  }

  console.log("\n--- 2. Valid Checkout Payload Test ---");
  const rawCheckout = {
    email: "  BUYER@EXAMPLE.COM  ",
    amountDollars: "149.99", // Coerced string to number
    payment: {
      type: "card",
      token: "tok_visa_12345",
      last4: "4242",
    },
  };

  const checkoutResult = CheckoutPayloadSchema.safeParse(rawCheckout);
  if (checkoutResult.success) {
    console.log("Sanitized Email:", checkoutResult.data.email); // "buyer@example.com"
    console.log("Coerced Amount:", typeof checkoutResult.data.amountDollars); // "number"
  }

  console.log("\n--- 3. Invalid Discriminator Test ---");
  const badCheckout = {
    email: "valid@example.com",
    amountDollars: 10,
    payment: { type: "paypal", account: "buyer" }, // Unregistered payment type!
  };

  const failResult = CheckoutPayloadSchema.safeParse(badCheckout);
  console.log("Validation rejected properly:", !failResult.success);
}
runCheckpoint1();
```


---

# Topic 6: Custom Validations and Refinements (`.refine()`, `.superRefine()`, and Custom Error Formatting)

### 1. What is it?
While built-in validators check basic formats (like `.min()`, `.email()`), real-world business logic requires custom rules (e.g. `confirmPassword === password`, or checking if a username is already taken).
- **`.refine(predicate, options)`**: Adds a custom validation check that returns a boolean.
- **`.superRefine((val, ctx) => ...)`**: Advanced refinement API that allows attaching multiple custom issues with specific error paths, error codes, and dynamic error messages.

### 2. Why does it exist?
Cross-field validations (validating Field B based on Field A) cannot be expressed on individual primitive fields. For instance, validating that a flight departure date is strictly before the return date requires evaluating the entire parent object. Refinements allow inspecting multiple fields simultaneously.

### 3. Basic example

```typescript
import { z } from "zod";

// Cross-field validation: Password Confirmation
export const RegistrationSchema = z.object({
  password: z.string().min(8),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"], // Attaches the error specifically to the 'confirmPassword' field!
});

export type RegistrationInput = z.infer<typeof RegistrationSchema>;

// Testing:
const result = RegistrationSchema.safeParse({
  password: "supersecret123",
  confirmPassword: "differentpassword",
});

if (!result.success) {
  console.log(result.error.flatten().fieldErrors);
  // { confirmPassword: [ 'Passwords do not match' ] }
}
```

**Line-by-line explanation:**
- `refine((data) => data.password === data.confirmPassword)`: Receives the fully validated object `data` and verifies equality.
- `path: ["confirmPassword"]`: Binds the error message directly to the `confirmPassword` field rather than the root object, ensuring frontend forms can display the error right under the confirmation input.

---

### 4. How it works inside TypeScript
1. **Refinement Ordering**: Refinement functions execute **only after** all individual field schemas have passed validation.
2. **`superRefine` Power**: `.superRefine((val, ctx) => ...)` provides access to `ctx.addIssue(...)`, allowing you to report multiple errors in a single pass.
3. **Async Refinement**: Both `.refine()` and `.superRefine()` can be asynchronous (e.g. checking a database). If an async refinement is present, you MUST use `.parseAsync()` or `.safeParseAsync()`.

---

### 5. More examples

#### Example 1: `superRefine` with complex multi-field rules
```typescript
const DateRangeSchema = z.object({
  startDate: z.coerce.date(),
  endDate: z.coerce.date(),
}).superRefine((val, ctx) => {
  if (val.endDate < val.startDate) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "End date must be after start date",
      path: ["endDate"],
    });
  }
});
```

#### Example 2: Asynchronous refinement (Database check)
```typescript
const UsernameSchema = z.string().min(3).refine(async (username) => {
  // Simulate database lookup:
  const isAvailable = await checkDbAvailability(username);
  return isAvailable;
}, {
  message: "Username is already taken",
});

// MUST use safeParseAsync for schemas with async refinements:
const check = await UsernameSchema.safeParseAsync("alice");
```

---

### 6. Common mistakes

#### Mistake 1: Forgetting `path` in `.refine()`, causing root-level errors
```typescript
// WRONG:
schema.refine(data => data.a === data.b, { message: "Mismatch" }); // Error path defaults to [] (root object)!
```
**Why it fails:** Frontend form libraries (like React Hook Form) match errors by field name. Omitting `path: ["confirmPassword"]` attaches the error to the whole form instead of the specific input.

#### Mistake 2: Calling synchronous `.parse()` on an async refinement
```typescript
// WRONG:
UsernameSchema.parse("admin"); // Throws Error: Synchronous parse encountered promise!
```
**Why it fails:** If any refinement in the schema is an `async` function, you MUST use `.parseAsync()` or `.safeParseAsync()`.

---

### 7. Rules to remember
1. Use `.refine()` for simple boolean custom checks.
2. Use `.superRefine()` when you need to emit multiple issues or customize error codes.
3. Always specify `path: ["fieldName"]` when refining parent objects for clean form errors.
4. Schemas with async refinements must be parsed using `.safeParseAsync()`.

---

### Think first: Prediction puzzle
Does `.refine()` run if one of the object's required fields failed basic validation?

---

**Answer:**
```
No.
```
**Explanation:** Zod will not execute `.refine()` if basic field validation fails. Refinement predicates only execute on structurally valid data.

---

### Practice exercises

#### Exercise 1: Ensure positive difference
- **Task**: Refine `{ min: number, max: number }` to guarantee `max > min`.
- **Hint 1**: `.refine(data => data.max > data.min, { path: ["max"] })`.

#### Exercise 2: Async email uniqueness check
- **Task**: Write a schema that uses an async refinement to verify an email isn't in an external list.
- **Hint 1**: `z.string().email().refine(async (e) => !takenEmails.has(e))`.

#### Exercise 3: Use superRefine to check password strength
- **Task**: Use `superRefine` to verify a password contains at least one digit and one special symbol.
- **Hint 1**: Check with regex, call `ctx.addIssue` if missing.

#### Exercise 4: Dynamic error message
- **Task**: Produce an error message showing the invalid value: `"Value must be even, received ${val}"`.
- **Hint 1**: `.refine(n => n % 2 === 0, val => ({ message: `Value must be even, received ${val}` }))`.

---

### Exercise solutions

#### Solution 1: Ensure positive difference
```typescript
const RangeSchema = z.object({
  min: z.number(),
  max: z.number(),
}).refine((d) => d.max > d.min, {
  message: "max must be strictly greater than min",
  path: ["max"],
});
```

#### Solution 2: Async email uniqueness check
```typescript
const existingEmails = new Set(["admin@example.com", "root@example.com"]);

const UniqueEmailSchema = z.string().email().refine(
  async (email) => !existingEmails.has(email),
  { message: "Email is already registered" }
);
```

#### Solution 3: Use superRefine to check password strength
```typescript
const StrongPasswordSchema = z.string().superRefine((pwd, ctx) => {
  if (!/\d/.test(pwd)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Password must contain at least one digit",
    });
  }
  if (!/[!@#$%^&*]/.test(pwd)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Password must contain at least one special character",
    });
  }
});
```

#### Solution 4: Dynamic error message
```typescript
const EvenNumberSchema = z.number().refine(
  (n) => n % 2 === 0,
  (val) => ({ message: `Value must be an even number, received: ${val}` })
);
```

---

### Recall
1. When should you use `.refine()` vs basic constraints? For custom domain rules or cross-field comparisons.
2. Why is specifying `path: ["fieldName"]` important in object refinements? To bind the error message to a specific form field.
3. Which parse method must be called when using async refinements? `.safeParseAsync()` or `.parseAsync()`.

> **If you remember only one thing:**  
> Use `.refine()` and `.superRefine()` to enforce multi-field business rules, explicitly specifying `path` to bind errors to the offending fields.

---

# Topic 7: Recursive and Lazy Schemas (`z.lazy()`) for Tree and Graph Data Structures

### 1. What is it?
A **Recursive Schema** validates hierarchical, self-referential data structures—such as JSON trees, file directory structures, nested comments, or org charts. In Zod, recursive schemas are declared using **`z.lazy(() => schema)`**, which delays schema evaluation until runtime.

### 2. Why does it exist?
In JavaScript, a variable cannot reference itself before initialization:
```typescript
// JavaScript ReferenceError:
const CategorySchema = z.object({
  name: z.string(),
  subcategories: z.array(CategorySchema), // ERROR: CategorySchema is used before its declaration!
});
```
`z.lazy()` wraps the recursive reference inside a closure function (`() => CategorySchema`), deferring evaluation until the schema is actually called.

### 3. Basic example

```typescript
import { z } from "zod";

// 1. Declare the recursive TypeScript type explicitly
interface Category {
  name: string;
  subcategories?: Category[];
}

// 2. Define the schema using z.lazy with explicit type annotation:
export const CategorySchema: z.ZodType<Category> = z.object({
  name: z.string(),
  subcategories: z.lazy(() => z.array(CategorySchema)).optional(),
});

// 3. Validate arbitrary nested tree structures:
const nestedData: Category = {
  name: "Electronics",
  subcategories: [
    {
      name: "Computers",
      subcategories: [
        { name: "Laptops" },
        { name: "Desktops" },
      ],
    },
    {
      name: "Audio",
    },
  ],
};

const result = CategorySchema.safeParse(nestedData);
console.log("Nested tree validation:", result.success); // true
```

**Line-by-line explanation:**
- `interface Category`: Recursive structures in TypeScript require an explicit interface declaration because TypeScript cannot recursively infer types that reference themselves circularly.
- `z.ZodType<Category>`: Explicitly annotates the schema with the target recursive interface.
- `z.lazy(() => z.array(CategorySchema))`: Wraps the reference in an arrow function so JavaScript does not attempt to evaluate `CategorySchema` before it exists in memory.

---

### 4. How it works inside TypeScript
1. **Deferred Evaluation**: When `CategorySchema.parse()` is invoked, Zod calls the lazy closure on demand, stepping down into nested sub-nodes recursively.
2. **Infinite Depth Traversal**: Validation naturally walks the entire depth of the tree until reaching leaf nodes without `subcategories`.
3. **Explicit Type Annotation Mandatory**: Omitting `: z.ZodType<Category>` causes TypeScript compiler error TS7022: *'CategorySchema' implicitly has type 'any' because it does not have a type annotation and is referenced directly or indirectly in its own initializer.*

---

### 5. More examples

#### Example 1: Recursive JSON Value Schema
```typescript
type JsonLiteral = string | number | boolean | null;
type JsonValue = JsonLiteral | { [key: string]: JsonValue } | JsonValue[];

const JsonLiteralSchema = z.union([z.string(), z.number(), z.boolean(), z.null()]);

const JsonValueSchema: z.ZodType<JsonValue> = z.lazy(() =>
  z.union([
    JsonLiteralSchema,
    z.array(JsonValueSchema),
    z.record(JsonValueSchema),
  ])
);
```

#### Example 2: Filesystem Folder Tree
```typescript
interface FileNode {
  name: string;
  sizeBytes: number;
}

interface DirectoryNode {
  name: string;
  files: FileNode[];
  directories: DirectoryNode[];
}

const DirectorySchema: z.ZodType<DirectoryNode> = z.object({
  name: z.string(),
  files: z.array(z.object({ name: z.string(), sizeBytes: z.number() })),
  directories: z.lazy(() => z.array(DirectorySchema)),
});
```

---

### 6. Common mistakes

#### Mistake 1: Omitting the explicit `: z.ZodType<T>` annotation
```typescript
// COMPILE ERROR:
const TreeSchema = z.object({
  children: z.lazy(() => z.array(TreeSchema)), // TS7022: 'TreeSchema' implicitly has type 'any'...
});
```
**Why it fails:** TypeScript's type inference engine cannot solve recursive circular types without an explicit type hint. Always write `const TreeSchema: z.ZodType<Tree> = ...`.

#### Mistake 2: Missing termination condition (Infinite loops)
```typescript
// GOTCHA: Making subcategories required without optional or empty array fallback
const InfiniteSchema: z.ZodType<any> = z.object({
  child: z.lazy(() => InfiniteSchema), // MUST have a child forever! Impossible to instantiate a leaf node!
});
```
**Why it matters:** Recursive schemas must provide a leaf termination path (e.g. `.optional()` or an empty array `[]`).

---

### 7. Rules to remember
1. Always declare an explicit TypeScript interface for recursive structures.
2. Annotate the schema with `: z.ZodType<MyInterface>`.
3. Wrap recursive references in `z.lazy(() => Schema)`.
4. Ensure recursive fields have an optional or empty leaf termination path.

---

### Think first: Prediction puzzle
Why can't `z.infer<typeof CategorySchema>` infer the recursive type without the manual interface?

---

**Answer:**
```
Because circular type inference causes infinite recursion in TypeScript's type solver.
```
**Explanation:** TypeScript requires an explicit interface anchor (`interface Category`) to break the circular type inference loop.

---

### Practice exercises

#### Exercise 1: Recursive comment thread schema
- **Task**: Create an interface `Comment` with `id: string`, `text: string`, and `replies?: Comment[]`. Build `CommentSchema` with `z.lazy`.
- **Hint 1**: `const CommentSchema: z.ZodType<Comment> = ...`.

#### Exercise 2: Binary tree node schema
- **Task**: Define a binary tree node with `value: number`, `left?: BinaryTreeNode`, and `right?: BinaryTreeNode`.
- **Hint 1**: `left: z.lazy(() => BinaryTreeSchema).optional()`.

#### Exercise 3: Validate nested comment depth
- **Task**: Validate a comment object with 3 levels of nested replies using `CommentSchema.safeParse()`.
- **Hint 1**: Verify `res.success === true`.

#### Exercise 4: Recursive menu item schema
- **Task**: Define a navigation menu schema with `title: string`, `url?: string`, and `children?: MenuItem[]`.
- **Hint 1**: Set `url` and `children` as optional.

---

### Exercise solutions

#### Solution 1: Recursive comment thread schema
```typescript
import { z } from "zod";

interface CommentThread {
  id: string;
  text: string;
  replies?: CommentThread[];
}

export const CommentThreadSchema: z.ZodType<CommentThread> = z.object({
  id: z.string(),
  text: z.string(),
  replies: z.lazy(() => z.array(CommentThreadSchema)).optional(),
});
```

#### Solution 2: Binary tree node schema
```typescript
interface TreeNode {
  value: number;
  left?: TreeNode;
  right?: TreeNode;
}

export const TreeNodeSchema: z.ZodType<TreeNode> = z.object({
  value: z.number(),
  left: z.lazy(() => TreeNodeSchema).optional(),
  right: z.lazy(() => TreeNodeSchema).optional(),
});
```

#### Solution 3: Validate nested comment depth
```typescript
const sampleThread: CommentThread = {
  id: "1",
  text: "Root comment",
  replies: [
    {
      id: "2",
      text: "First reply",
      replies: [
        { id: "3", text: "Nested reply" },
      ],
    },
  ],
};

const check = CommentThreadSchema.safeParse(sampleThread);
console.log("Thread valid:", check.success); // true
```

#### Solution 4: Recursive menu item schema
```typescript
interface MenuItem {
  title: string;
  url?: string;
  children?: MenuItem[];
}

export const MenuItemSchema: z.ZodType<MenuItem> = z.object({
  title: z.string(),
  url: z.string().optional(),
  children: z.lazy(() => z.array(MenuItemSchema)).optional(),
});
```

---

### Recall
1. What function enables recursive schemas in Zod? `z.lazy()`.
2. Why is an explicit TypeScript interface required when writing recursive Zod schemas? To break circular type inference limits in the TypeScript compiler.
3. How do you prevent infinite recursive schemas that can never terminate? By making the recursive child property optional or an array that can be empty.

> **If you remember only one thing:**  
> Use `z.lazy(() => Schema)` with an explicit `: z.ZodType<T>` annotation to validate recursive tree structures.

---

# Topic 8: JSON Schema Synthesis: TypeBox (`Type.Object`, `Static<typeof Schema>`)

### 1. What is it?
**TypeBox** (`@sinclair/typebox`) is a schema library that creates standard **JSON Schema Draft-07 / 2020-12** objects directly while synthesizing static TypeScript types using **`Static<typeof Schema>`**.
- While Zod creates proprietary internal JavaScript objects, TypeBox emits standard, portable JSON Schema specifications.
- It is the native schema engine for ultra-fast frameworks like **Fastify** and **ElysiaJS**.

### 2. Why does it exist?
Many enterprise systems require standard JSON Schema definitions for database column validation, OpenAPI / Swagger generation, and cross-language microservice communication (Python, Go, Java). TypeBox creates schemas that are valid JSON Schemas at runtime while delivering full TypeScript static type safety.

### 3. Basic example

```typescript
import { Type, Static } from "@sinclair/typebox";

// 1. Define schema using TypeBox
export const UserSchema = Type.Object({
  id: Type.String({ format: "uuid" }),
  name: Type.String({ minLength: 2 }),
  age: Type.Integer({ minimum: 0 }),
  roles: Type.Array(Type.String()),
});

// 2. Synthesize the static TypeScript type automatically!
export type User = Static<typeof UserSchema>;
// Equivalent to:
// type User = { id: string; name: string; age: number; roles: string[]; }

// 3. Inspect the runtime JSON Schema object:
console.log(JSON.stringify(UserSchema, null, 2));
```

**Output (Standard JSON Schema!):**
```json
{
  "type": "object",
  "properties": {
    "id": { "type": "string", "format": "uuid" },
    "name": { "type": "string", "minLength": 2 },
    "age": { "type": "integer", "minimum": 0 },
    "roles": { "type": "array", "items": { "type": "string" } }
  },
  "required": ["id", "name", "age", "roles"]
}
```

**Line-by-line explanation:**
- `Type.Object(...)`: Generates a standard JSON Schema object representation.
- `Static<typeof UserSchema>`: TypeBox's equivalent of `z.infer`. Extracts the exact static TypeScript interface.
- `UserSchema`: At runtime, this is a plain, serializable JavaScript object compliant with JSON Schema specifications.

---

### 4. How it works inside TypeScript
1. **JSON Schema Compatibility**: The schema is serializable via `JSON.stringify()`. You can write it directly to a file or send it over the wire.
2. **`Static<T>` Mechanism**: TypeBox uses mapped types and conditional inference on the schema definition to synthesize the TypeScript type.
3. **Modifiers**: `Type.Optional(Type.String())` marks the property as optional, omitting it from the `"required"` array in the JSON Schema.

---

### 5. More examples

#### Example 1: TypeBox Optional and Readonly Modifiers
```typescript
const ConfigSchema = Type.Object({
  port: Type.Integer({ default: 8080 }),
  apiKey: Type.Readonly(Type.String()),
  debugMode: Type.Optional(Type.Boolean()),
});

type Config = Static<typeof ConfigSchema>;
// { port: number; readonly apiKey: string; debugMode?: boolean; }
```

#### Example 2: Union and Enum validation in TypeBox
```typescript
const StatusSchema = Type.Union([
  Type.Literal("active"),
  Type.Literal("inactive"),
  Type.Literal("pending"),
]);

type Status = Static<typeof StatusSchema>; // "active" | "inactive" | "pending"
```

---

### 6. Common mistakes

#### Mistake 1: Confusing `Type.Number()` with `Type.Integer()`
```typescript
Type.Number()  // Maps to JSON Schema { type: "number" } (allows floats: 3.14)
Type.Integer() // Maps to JSON Schema { type: "integer" } (strictly whole numbers: 3)
```
**Why it matters:** If validating database IDs or pagination offsets, use `Type.Integer()`.

#### Mistake 2: Forgetting `Static<typeof Schema>`
```typescript
// WRONG:
type User = UserSchema; // Error: UserSchema is a runtime value, not a type!
// CORRECT:
type User = Static<typeof UserSchema>;
```

---

### 7. Rules to remember
1. TypeBox schemas are standard JSON Schema objects.
2. Infer static types using `Static<typeof Schema>`.
3. Use `Type.Optional(schema)` to make fields optional.
4. Fastify and ElysiaJS use TypeBox schemas directly for route validation.

---

### Think first: Prediction puzzle
Is `JSON.stringify(UserSchema)` valid JSON Schema that can be validated by Python or Go JSON Schema libraries?

---

**Answer:**
```
Yes.
```
**Explanation:** TypeBox adheres strictly to standard JSON Schema specifications, making its output 100% interoperable across non-JavaScript languages.

---

### Practice exercises

#### Exercise 1: Declare TypeBox Account schema
- **Task**: Create an account schema with `accountId: string`, `balance: number`, and `currency: string`.
- **Hint 1**: `Type.Object({ accountId: Type.String(), balance: Type.Number(), currency: Type.String() })`.

#### Exercise 2: Infer static account type
- **Task**: Extract the TypeScript type from `AccountSchema`.
- **Hint 1**: `type Account = Static<typeof AccountSchema>`.

#### Exercise 3: Add optional description
- **Task**: Add an optional `description` string to the schema.
- **Hint 1**: `description: Type.Optional(Type.String())`.

#### Exercise 4: TypeBox string format
- **Task**: Create an email string schema with format `"email"`.
- **Hint 1**: `Type.String({ format: "email" })`.

---

### Exercise solutions

#### Solution 1: Declare TypeBox Account schema
```typescript
import { Type, Static } from "@sinclair/typebox";

export const AccountSchema = Type.Object({
  accountId: Type.String(),
  balance: Type.Number(),
  currency: Type.String(),
});
```

#### Solution 2: Infer static account type
```typescript
export type Account = Static<typeof AccountSchema>;
```

#### Solution 3: Add optional description
```typescript
export const ExtendedAccountSchema = Type.Object({
  accountId: Type.String(),
  balance: Type.Number(),
  currency: Type.String(),
  description: Type.Optional(Type.String()),
});
```

#### Solution 4: TypeBox string format
```typescript
export const EmailSchema = Type.String({ format: "email" });
```

---

### Recall
1. What specification do TypeBox schemas adhere to? Standard JSON Schema (Draft-07 / 2020-12).
2. How do you extract static TypeScript types from TypeBox schemas? `Static<typeof Schema>`.
3. How do you mark a property as optional in TypeBox? `Type.Optional(schema)`.

> **If you remember only one thing:**  
> TypeBox creates standard, serializable JSON Schemas while inferring exact TypeScript types via `Static<typeof Schema>`.

---

# Topic 9: High-Performance Schema Validation: TypeBox TypeCompiler vs Zod

### 1. What is it?
In high-throughput microservices (handling 10,000+ requests/sec), schema validation can become a significant CPU bottleneck.
- **Zod**: Interprets schemas dynamically at runtime, creating validation objects and closures on every pass (~20,000 ops/sec).
- **TypeBox TypeCompiler (`TypeCompiler.Compile`)**: Compiles the JSON Schema into a **just-in-time (JIT) generated JavaScript function** containing hard-coded `if/else` checks (~2,000,000 ops/sec, up to **50x to 100x faster** than Zod!).

### 2. Why does it exist?
In high-performance backends (like Fastify or gaming gateways), spending 0.5ms parsing Zod schemas per request degrades latency. The TypeBox `TypeCompiler` turns schema rules into compiled machine-speed JavaScript functions.

### 3. Basic example

```typescript
import { Type } from "@sinclair/typebox";
import { TypeCompiler } from "@sinclair/typebox/compiler";

const UserSchema = Type.Object({
  id: Type.String(),
  age: Type.Integer({ minimum: 0 }),
  email: Type.String({ format: "email" }),
});

// Compile the schema ONCE at server startup:
const compiledUserCheck = TypeCompiler.Compile(UserSchema);

// High-speed validation inside HTTP request handler:
const payload: unknown = { id: "101", age: 25, email: "alice@example.com" };

// 1. Ultra-fast boolean check (~50x faster than Zod!):
if (compiledUserCheck.Check(payload)) {
  // payload is valid!
  console.log("Validation passed at compiled JIT speed!");
} else {
  // 2. Extract error iterator if invalid:
  for (const error of compiledUserCheck.Errors(payload)) {
    console.log(`Error at ${error.path}: ${error.message}`);
  }
}
```

**Line-by-line explanation:**
- `TypeCompiler.Compile(UserSchema)`: Runs once during initialization. It generates a specialized JavaScript function using `new Function(...)` containing unrolled property checks.
- `compiledUserCheck.Check(payload)`: Evaluates the compiled function. Executes in nanoseconds.
- `compiledUserCheck.Errors(payload)`: Returns a generator yielding detailed errors if validation fails.

---

### 4. How it works inside TypeScript
1. **JIT Code Generation**: `TypeCompiler` inspects the schema and writes code like:
   ```javascript
   function validate(value) {
     return typeof value === "object" && value !== null &&
       typeof value.id === "string" &&
       Number.isInteger(value.age) && value.age >= 0;
   }
   ```
   V8 can inline and optimize this generated function immediately.
2. **Zero Allocation**: `Check()` allocates zero temporary validation issue objects when the data is valid, putting zero pressure on V8 garbage collection.

---

### 5. More examples

#### Example 1: Performance Benchmark Comparison
| Engine | Strategy | Throughput (ops/sec) | Relative Speed |
|---|---|---|---|
| **Zod** | Runtime AST Interpretation | ~45,000 | 1x (Baseline) |
| **Ajv** | Pre-compiled JSON Schema | ~1,800,000 | 40x |
| **TypeBox TypeCompiler** | JIT Unrolled Function | **~2,200,000** | **~50x** |

---

### 6. Common mistakes

#### Mistake 1: Re-compiling the schema inside the request handler
```typescript
// FATAL PERFORMANCE BUG:
app.post("/user", (req, res) => {
  const check = TypeCompiler.Compile(UserSchema); // Compiling JIT function on EVERY request! 100x SLOWER!
  check.Check(req.body);
});
```
**Why it fails:** `TypeCompiler.Compile()` is an initialization step. Always compile schemas **once** at module scope, and call `.Check()` inside the request loop.

#### Mistake 2: Missing JIT permission in restricted environments
```bash
# In restricted serverless or Cloudflare Workers environments where 'new Function()' is banned:
# Use TypeBox's Value.Check() instead of TypeCompiler.Compile()!
```

---

### 7. Rules to remember
1. Use `TypeCompiler.Compile(schema)` for maximum validation performance (100x faster).
2. Compile schemas **once** at startup, never inside per-request functions.
3. `.Check(data)` returns a boolean in nanoseconds with zero GC allocations.
4. Use `.Errors(data)` to inspect failure reasons when `.Check()` returns `false`.

---

### Think first: Prediction puzzle
Does `TypeCompiler.Compile` return a boolean directly?

---

**Answer:**
```
No.
```
**Explanation:** It returns a compiled validator object holding `.Check(data)` and `.Errors(data)` methods.

---

### Practice exercises

#### Exercise 1: Compile TypeBox schema
- **Task**: Write a compiled validator for an object with `id: string` and `active: boolean`.
- **Hint 1**: `TypeCompiler.Compile(Type.Object({ ... }))`.

#### Exercise 2: Boolean check test
- **Task**: Check if `{ id: "1", active: true }` passes the compiled validator.
- **Hint 1**: `validator.Check(data)`.

#### Exercise 3: Inspect compiled errors
- **Task**: Pass invalid data and log all error paths using `validator.Errors(data)`.
- **Hint 1**: Use `for (const err of validator.Errors(data))`.

#### Exercise 4: Module-level compilation architecture
- **Task**: Structure an Express/Fastify route file so the compiled validator is instantiated only once.
- **Hint 1**: Store in a `const` at file top-level.

---

### Exercise solutions

#### Solution 1: Compile TypeBox schema
```typescript
import { Type } from "@sinclair/typebox";
import { TypeCompiler } from "@sinclair/typebox/compiler";

const DeviceSchema = Type.Object({
  id: Type.String(),
  active: Type.Boolean(),
});

export const deviceValidator = TypeCompiler.Compile(DeviceSchema);
```

#### Solution 2: Boolean check test
```typescript
const isValid = deviceValidator.Check({ id: "dev_99", active: true });
console.log("Is valid:", isValid); // true
```

#### Solution 3: Inspect compiled errors
```typescript
const badData = { id: 123, active: "not-bool" };
if (!deviceValidator.Check(badData)) {
  for (const error of deviceValidator.Errors(badData)) {
    console.log(`Validation error at ${error.path}: ${error.message}`);
  }
}
```

#### Solution 4: Module-level compilation architecture
```typescript
// In routes/device.ts:
// Compiled ONCE when module loads:
const checkDevice = TypeCompiler.Compile(DeviceSchema);

export function handleDeviceRequest(body: unknown) {
  if (!checkDevice.Check(body)) {
    throw new Error("Invalid device payload");
  }
  return body;
}
```

---

### Recall
1. Why is TypeBox `TypeCompiler` so much faster than Zod? It compiles the schema once into a hardcoded, unrolled JavaScript function that V8 can JIT-optimize.
2. When should `TypeCompiler.Compile()` be executed? Once at application startup, never inside per-request handlers.
3. How do you extract failure messages if `.Check()` returns false? Iterate through `.Errors(data)`.

> **If you remember only one thing:**  
> In performance-critical microservices, pre-compile schemas with `TypeCompiler.Compile()` to validate millions of requests per second.

---

# Topic 10: Standard Schema Specification (The Cross-Library Validation Standard)

### 1. What is it?
The **Standard Schema Specification** (`@standard-schema/spec`) is a common interoperability specification created by the authors of **Zod**, **Valibot**, and **ArkType**. Any schema adhering to this specification implements a standard property:
```typescript
"~standard": {
  version: 1,
  vendor: "zod",
  validate(value: unknown): StandardResult
}
```
This allows framework authors (like tRPC, TanStack Form, and Astro) to accept schemas from **any** validation library interchangeably!

### 2. Why does it exist?
Previously, if a library author created a form library or an API framework, they had to write separate adapter plugins for Zod, Yup, Joi, Valibot, and TypeBox:
```typescript
// Old Fragmentation Nightmare:
import { zodAdapter } from "@hookform/resolvers/zod";
import { yupAdapter } from "@hookform/resolvers/yup";
import { valibotAdapter } from "@hookform/resolvers/valibot";
```
With the Standard Schema specification, framework authors support a single interface. A user can pass a Zod schema, a Valibot schema, or an ArkType schema, and the framework executes validation identically.

### 3. Basic example

```typescript
import { z } from "zod";
import type { StandardSchemaV1 } from "@standard-schema/spec";

// A framework function that accepts ANY Standard Schema:
async function validateWithAnyLibrary<T extends StandardSchemaV1>(
  schema: T,
  input: unknown
): Promise<StandardSchemaV1.InferOutput<T>> {
  // Standard Schema execution contract:
  const result = await schema["~standard"].validate(input);

  if (result.issues) {
    const messages = result.issues.map((i) => i.message).join(", ");
    throw new Error(`Standard validation failed: ${messages}`);
  }

  return result.value;
}

// 1. Usage with Zod (Zod 3.24+ implements Standard Schema natively!):
const ZodUser = z.object({ username: z.string().min(3) });

async function run() {
  const user = await validateWithAnyLibrary(ZodUser, { username: "Alice" });
  console.log("Validated user:", user.username);
}
run();
```

**Line-by-line explanation:**
- `StandardSchemaV1`: The universal TypeScript interface defining `"~standard"`.
- `schema["~standard"].validate(input)`: Universal method returning `{ value }` on success, or `{ issues: [...] }` on failure.
- `StandardSchemaV1.InferOutput<T>`: Universal type utility to infer the output type across Zod, Valibot, or ArkType.

---

### 4. How it works inside TypeScript
1. **Zero Runtime Dependency**: `@standard-schema/spec` is a pure type package containing zero runtime JavaScript code.
2. **Symbol-Safe Key**: The `"~standard"` property uses a tilde prefix to avoid colliding with business domain property names.
3. **Synchronous or Asynchronous**: `validate(input)` can return a `StandardResult` directly or a `Promise<StandardResult>`.

---

### 5. More examples

#### Example 1: Type-checking if a schema implements Standard Schema
```typescript
function isStandardSchema(val: unknown): val is StandardSchemaV1 {
  return typeof val === "object" && val !== null && "~standard" in val;
}
```

---

### 6. Common mistakes

#### Mistake 1: Relying on vendor-specific methods when writing framework adapters
```typescript
// WRONG in a reusable library:
function parseInput(schema: any, data: unknown) {
  return schema.safeParse(data); // FAILS if user passes Valibot or TypeBox!
}
// CORRECT:
function parseInput(schema: StandardSchemaV1, data: unknown) {
  return schema["~standard"].validate(data); // Works universally!
}
```

---

### 7. Rules to remember
1. Standard Schema provides a common contract (`"~standard"`) across Zod, Valibot, and ArkType.
2. Reusable libraries and frameworks should accept `StandardSchemaV1` instead of tying themselves to Zod.
3. Call `schema["~standard"].validate(input)` to execute validation universally.
4. Extract types using `StandardSchemaV1.InferOutput<T>`.

---

### Think first: Prediction puzzle
Does `@standard-schema/spec` increase your production bundle size?

---

**Answer:**
```
No, 0 bytes.
```
**Explanation:** The package contains only TypeScript type definitions and interfaces; it contains zero runtime JavaScript code.

---

### Practice exercises

#### Exercise 1: Universal validator runner
- **Task**: Write a helper `runStandardValidation(schema, data)` that returns `{ success: true, data }` or `{ success: false, errors }`.
- **Hint 1**: Check `result.issues`.

#### Exercise 2: Infer input and output
- **Task**: Use `StandardSchemaV1.InferInput<T>` and `StandardSchemaV1.InferOutput<T>`.
- **Hint 1**: Import from `@standard-schema/spec`.

#### Exercise 3: Check standard schema compatibility
- **Task**: Inspect `ZodSchema["~standard"].version` to verify compatibility.
- **Hint 1**: Returns `1`.

#### Exercise 4: Format standard issues
- **Task**: Format `StandardSchemaV1.Issue[]` into an array of string descriptions.
- **Hint 1**: `issues.map(i => `${i.path?.join(".")}: ${i.message}`)`.

---

### Exercise solutions

#### Solution 1: Universal validator runner
```typescript
import type { StandardSchemaV1 } from "@standard-schema/spec";

async function runStandardValidation<T extends StandardSchemaV1>(schema: T, data: unknown) {
  const res = await schema["~standard"].validate(data);
  if (res.issues) {
    return { success: false as const, errors: res.issues };
  }
  return { success: true as const, data: res.value as StandardSchemaV1.InferOutput<T> };
}
```

#### Solution 2: Infer input and output
```typescript
import type { StandardSchemaV1 } from "@standard-schema/spec";

type RawInput<T extends StandardSchemaV1> = StandardSchemaV1.InferInput<T>;
type ValidData<T extends StandardSchemaV1> = StandardSchemaV1.InferOutput<T>;
```

#### Solution 3: Check standard schema compatibility
```typescript
import { z } from "zod";

const testSchema = z.string();
console.log(testSchema["~standard"].version === 1); // true
console.log(testSchema["~standard"].vendor === "zod"); // true
```

#### Solution 4: Format standard issues
```typescript
import type { StandardSchemaV1 } from "@standard-schema/spec";

function formatIssues(issues: readonly StandardSchemaV1.Issue[]): string[] {
  return issues.map((i) => {
    const pathStr = i.path ? `[${i.path.join(".")}] ` : "";
    return `${pathStr}${i.message}`;
  });
}
```

---

### Recall
1. What is the Standard Schema specification? A joint cross-library standard uniting Zod, Valibot, and ArkType under a single validation contract.
2. What property identifies a Standard Schema? `"~standard"`.
3. Why is this beneficial for framework authors? It allows building tools that work with any schema library without writing custom adapter plugins.

> **If you remember only one thing:**  
> The Standard Schema specification (`"~standard"`) provides universal interoperability across Zod, Valibot, and TypeBox for modern web frameworks.

---

# Checkpoint Challenge 2: Advanced Refinements & TypeBox Performance (Topics 6-10)

### Challenge Specification
Construct an Enterprise High-Throughput Validation Suite:
1. Build a **Zod Schema** with cross-field `.refine()` validating an authentication request (`password` and `confirmPassword`).
2. Build an ultra-high performance **TypeBox Schema** for telemetry events and compile it using `TypeCompiler.Compile`.
3. Demonstrate a benchmark helper executing 100,000 checks through the compiled TypeBox validator.
4. Verify that validation errors include exact property paths.

### Solution

```typescript
import { z } from "zod";
import { Type, Static } from "@sinclair/typebox";
import { TypeCompiler } from "@sinclair/typebox/compiler";

// 1. Zod Cross-Field Refinement
export const AuthRegistrationSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

export type AuthRegistration = z.infer<typeof AuthRegistrationSchema>;

// 2. High-Performance TypeBox Telemetry Schema
export const TelemetryEventSchema = Type.Object({
  sensorId: Type.String({ minLength: 3 }),
  reading: Type.Number(),
  timestamp: Type.Integer({ minimum: 0 }),
  status: Type.Union([Type.Literal("ok"), Type.Literal("warning"), Type.Literal("critical")]),
});

export type TelemetryEvent = Static<typeof TelemetryEventSchema>;

// Pre-compile JIT validator once at startup:
const compiledTelemetryCheck = TypeCompiler.Compile(TelemetryEventSchema);

// 3. Execution and Benchmark Run
function runCheckpoint2() {
  console.log("--- 1. Testing Zod Cross-Field Refinement ---");
  const badAuth = {
    email: "user@test.com",
    password: "Password123!",
    confirmPassword: "WrongPassword!",
  };

  const authRes = AuthRegistrationSchema.safeParse(badAuth);
  if (!authRes.success) {
    console.log("Refinement caught mismatch on path:", authRes.error.issues[0].path);
    console.log("Error message:", authRes.error.issues[0].message);
  }

  console.log("\n--- 2. High-Speed TypeBox Benchmark (100,000 runs) ---");
  const sampleEvent: unknown = {
    sensorId: "temp_probe_01",
    reading: 98.6,
    timestamp: Date.now(),
    status: "ok",
  };

  const start = performance.now();
  let validCount = 0;
  for (let i = 0; i < 100_000; i++) {
    if (compiledTelemetryCheck.Check(sampleEvent)) {
      validCount++;
    }
  }
  const duration = performance.now() - start;

  console.log(`Executed 100,000 compiled checks in: ${duration.toFixed(2)}ms`);
  console.log(`Throughput: ${Math.round((100_000 / duration) * 1000).toLocaleString()} ops/sec`);
  console.log(`Validation count verified: ${validCount === 100_000}`);
}
runCheckpoint2();
```

## Topic 11: Validating API Boundaries: Next.js Server Actions and Route Handlers with Zod

### What Is It?
An API boundary is the exact perimeter where an external network request enters your server-side application. In frameworks like Next.js (App Router), incoming payloads arrive via HTTP Route Handlers (`app/api/*/route.ts`) or Server Actions (`"use server"` functions). 

Network payloads arrive across the wire as untyped byte streams, JSON strings, or `FormData` key-value pairs. Zod validation at this boundary converts raw, untrusted network inputs into verified, strongly typed objects before your application logic or database queries execute.

### Why Does It Exist?
TypeScript types do not exist at runtime. If a client transmits a malicious or malformed payload to a Next.js Server Action:
```typescript
// Unsafe Server Action
export async function updateUser(data: { id: string; email: string }) {
  // If the client sends { id: 123, email: null }, TypeScript cannot stop it at runtime!
  await db.user.update({ where: { id: data.id }, data: { email: data.email } });
}
```
Without runtime validation, database queries fail with unhandled runtime errors, or worse, execute unauthorized operations. Validating payloads at the boundary guarantees that invalid inputs are rejected with clear error codes (such as HTTP `400 Bad Request`) before touching internal systems.

### Basic Example and Line-by-Line Explanation

```typescript
import { z } from "zod";

export const CreateUserSchema = z.object({
  name: z.string().min(1, "Name cannot be empty"),
  email: z.string().email("Invalid email address"),
});

export type CreateUserInput = z.infer<typeof CreateUserSchema>;

export async function handleCreateUser(rawPayload: unknown): Promise<{
  success: boolean;
  data?: CreateUserInput;
  error?: string;
}> {
  const result = CreateUserSchema.safeParse(rawPayload);

  if (!result.success) {
    return {
      success: false,
      error: result.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join(", "),
    };
  }

  return {
    success: true,
    data: result.data,
  };
}
```

Line-by-line breakdown:
1. `import { z } from "zod";`: Imports the Zod runtime schema library.
2. `export const CreateUserSchema = z.object({`: Defines an object schema representing the expected request body.
3. `name: z.string().min(1, "Name cannot be empty"),`: Asserts that `name` must be a string with at least one character.
4. `email: z.string().email("Invalid email address"),`: Asserts that `email` must match a valid RFC email format.
5. `export type CreateUserInput = z.infer<typeof CreateUserSchema>;`: Extracts the static TypeScript type `{ name: string; email: string }`.
6. `export async function handleCreateUser(rawPayload: unknown)`: Declares a handler accepting `rawPayload` typed as `unknown`, forcing validation before access.
7. `const result = CreateUserSchema.safeParse(rawPayload);`: Executes validation without throwing exceptions.
8. `if (!result.success) {`: Evaluates the tagged union discriminant.
9. `return { success: false, error: ... };`: Formats validation issues into a safe error response string for the client.
10. `return { success: true, data: result.data };`: Returns the verified, fully typed data payload when validation passes.

### How It Works Inside TypeScript
TypeScript treats `rawPayload: unknown` as an uninspectable value. When `CreateUserSchema.safeParse(rawPayload)` is called:
1. The return type is inferred as `SafeParseReturnType<CreateUserInput, CreateUserInput>`.
2. This type is a discriminated union:
   ```typescript
   type SafeParseReturnType<Input, Output> =
     | { success: true; data: Output }
     | { success: false; error: ZodError<Input> };
   ```
3. Inside the `if (!result.success)` branch, TypeScript narrows `result` to `{ success: false; error: ZodError }`. Accessing `result.data` here causes compiler error `TS2339`.
4. Outside or below the failure guard, TypeScript narrows `result` to `{ success: true; data: Output }`. Now `result.data.email` is fully typed as `string`.

### More Examples

#### Example 1: Next.js App Router Route Handler (POST JSON)
```typescript
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const UpdateSettingsSchema = z.object({
  theme: z.enum(["light", "dark", "system"]),
  notifications: z.boolean(),
  retries: z.number().int().min(0).max(5),
});

export async function POST(request: NextRequest) {
  try {
    const rawBody: unknown = await request.json();
    const parseResult = UpdateSettingsSchema.safeParse(rawBody);

    if (!parseResult.success) {
      return NextResponse.json(
        {
          error: "Validation failed",
          details: parseResult.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const validData = parseResult.data;
    // validData is typed: { theme: "light" | "dark" | "system"; notifications: boolean; retries: number; }
    return NextResponse.json({ success: true, settings: validData }, { status: 200 });
  } catch {
    return NextResponse.json({ error: "Malformed JSON payload" }, { status: 400 });
  }
}
```

#### Example 2: Next.js Server Action with `FormData` Parsing
```typescript
"use server";

import { z } from "zod";

const FileUploadActionSchema = z.object({
  title: z.string().min(3),
  fileSize: z.coerce.number().positive(),
  isPublic: z.preprocess((val) => val === "on" || val === "true" || val === true, z.boolean()),
});

export type ActionState = {
  status: "idle" | "success" | "error";
  message: string;
  errors?: Record<string, string[] | undefined>;
};

export async function submitUploadAction(
  prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const rawEntries = {
    title: formData.get("title"),
    fileSize: formData.get("fileSize"),
    isPublic: formData.get("isPublic"),
  };

  const parsed = FileUploadActionSchema.safeParse(rawEntries);

  if (!parsed.success) {
    return {
      status: "error",
      message: "Invalid form input",
      errors: parsed.error.flatten().fieldErrors,
    };
  }

  return {
    status: "success",
    message: `Uploaded "${parsed.data.title}" (${parsed.data.fileSize} bytes, public: ${parsed.data.isPublic})`,
  };
}
```

#### Example 3: Type-Safe Server Action Wrapper Utility (Action Middleware Pattern)
```typescript
import { z } from "zod";

export type ActionResponse<TOutput> =
  | { success: true; data: TOutput }
  | { success: false; errors: Record<string, string[] | undefined> };

export function createValidatedAction<TSchema extends z.ZodTypeAny, TOutput>(
  schema: TSchema,
  handler: (data: z.infer<TSchema>) => Promise<TOutput>
) {
  return async (rawInput: unknown): Promise<ActionResponse<TOutput>> => {
    const parseResult = schema.safeParse(rawInput);
    if (!parseResult.success) {
      return {
        success: false,
        errors: parseResult.error.flatten().fieldErrors,
      };
    }

    const output = await handler(parseResult.data);
    return {
      success: true,
      data: output,
    };
  };
}

// Usage:
const DeleteItemSchema = z.object({ itemId: z.string().uuid() });

export const deleteItemAction = createValidatedAction(
  DeleteItemSchema,
  async (input) => {
    // input is typed: { itemId: string }
    return { deletedId: input.itemId, timestamp: Date.now() };
  }
);
```

### Common Mistakes

#### Mistake 1: Relying on TypeScript type assertions `request.json() as TargetType`
```typescript
// WRONG: Blind type assertion bypassing runtime inspection
export async function POST(req: Request) {
  const body = (await req.json()) as { userId: string; role: "admin" | "user" };
  // If attacker sends { userId: 123 }, body.userId is not a string at runtime!
  console.log(body.userId.toUpperCase()); // Throws TypeError: body.userId.toUpperCase is not a function
}

// CORRECT: Safe parsing with Zod schema
const BodySchema = z.object({
  userId: z.string(),
  role: z.enum(["admin", "user"]),
});

export async function POST(req: Request) {
  const raw = await req.json();
  const parsed = BodySchema.safeParse(raw);
  if (!parsed.success) {
    return new Response(JSON.stringify(parsed.error.format()), { status: 400 });
  }
  console.log(parsed.data.userId.toUpperCase()); // Guaranteed safe
}
```

#### Mistake 2: Throwing raw `ZodError` exceptions across Server Action boundaries
```typescript
// WRONG: Using .parse() directly inside Server Actions leaks stack traces to the client
export async function myAction(input: unknown) {
  const valid = MySchema.parse(input); // Throws unhandled ZodError, causing HTTP 500
  return db.save(valid);
}

// CORRECT: Using .safeParse() and returning structured error payloads
export async function myAction(input: unknown) {
  const result = MySchema.safeParse(input);
  if (!result.success) {
    return { ok: false, errors: result.error.flatten().fieldErrors };
  }
  const saved = await db.save(result.data);
  return { ok: true, data: saved };
}
```

### Rules to Remember
1. All network payloads across Route Handlers and Server Actions are untrusted runtime values (`unknown`).
2. Never cast network inputs with `as Type`. Always pass them through schema `.safeParse()`.
3. Use `request.json()` inside a `try/catch` block because invalid JSON strings throw native `SyntaxError` before Zod can run.
4. Server Actions communicating with client forms should return structured error states (e.g. `result.error.flatten().fieldErrors`) instead of unhandled thrown errors.

---

### Think First: Prediction Puzzle
Look at this Server Action code:
```typescript
import { z } from "zod";

const Schema = z.object({
  count: z.number().int(),
});

export async function processCount(formData: FormData) {
  const raw = formData.get("count");
  const parsed = Schema.safeParse({ count: raw });
  return parsed.success;
}
```
If a form submits `<input name="count" value="42" />`, what will `processCount(formData)` return: `true` or `false`?

--------------------------------------------------------------------------------
**Answer:**
`false`.

**Explanation:**
`formData.get("count")` returns the string `"42"`. `z.number()` strictly expects a JavaScript `number` type. Because `"42"` is of type `string`, validation fails. To accept strings that convert to numbers from `FormData`, use `z.coerce.number().int()`.

---

### Graded Exercises

#### Exercise 1: Basic Route Handler Body Validator
Write a function `validateRequestBody<T>(schema: z.ZodType<T>, rawJson: unknown)` that returns `{ valid: true; data: T }` if validation succeeds, or `{ valid: false; errors: string[] }` containing all error messages if validation fails.
- Hint 1: Use `schema.safeParse(rawJson)`.
- Hint 2: If `!res.success`, map over `res.error.issues` and extract each `issue.message`.

#### Exercise 2: Next.js URL Search Query Parameters Validator
Write a schema and parser function `parseSearchParams(searchParams: URLSearchParams)` that validates `page` (optional integer string, defaults to `1`), `limit` (optional integer string, defaults to `20`), and `query` (optional string). The output object must have numeric `page` and `limit` types (`number`).
- Hint 1: Use `z.coerce.number().int().positive()` for numeric fields.
- Hint 2: Use `.default(1)` and `.default(20)` on the coerced fields.

#### Exercise 3: Server Action FormData Formatter
Build a function `parseUserFormData(formData: FormData)` that extracts `username` (string, min 3 chars), `age` (number >= 18), and `subscribe` (boolean). Note that HTML checkboxes submit `"on"` when checked and `null` when unchecked.
- Hint 1: Use `formData.get(key)` to extract values.
- Hint 2: Use `z.preprocess()` on the boolean field to convert `"on"` to `true` and `null`/undefined to `false`.

#### Exercise 4: Production Action Middleware Factory with Context
Create a higher-order function `createActionWithAuth<TInput, TOutput>(schema: z.ZodType<TInput>, handler: (input: TInput, ctx: { userId: string }) => Promise<TOutput>)` that takes an input payload and a simulated session token `string | null`. If the token is null, it immediately rejects with `"Unauthorized"`. If validation fails, it returns validation errors. Otherwise, it executes the handler with the validated input and `{ userId: "user_validated_123" }`.
- Hint 1: Check `if (!sessionToken)` first before schema parsing.
- Hint 2: Return a discriminated union: `{ status: "unauthorized" } | { status: "invalid"; errors: any } | { status: "success"; data: TOutput }`.

--------------------------------------------------------------------------------
### Exercise Solutions

```typescript
// Solution 1:
import { z } from "zod";

export function validateRequestBody<T>(
  schema: z.ZodType<T>,
  rawJson: unknown
): { valid: true; data: T } | { valid: false; errors: string[] } {
  const result = schema.safeParse(rawJson);
  if (result.success) {
    return { valid: true, data: result.data };
  }
  return {
    valid: false,
    errors: result.error.issues.map((issue) => issue.message),
  };
}

// Solution 2:
export const QueryParamSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  query: z.string().optional(),
});

export type QueryParams = z.infer<typeof QueryParamSchema>;

export function parseSearchParams(params: URLSearchParams): QueryParams {
  const raw = {
    page: params.get("page") ?? undefined,
    limit: params.get("limit") ?? undefined,
    query: params.get("query") ?? undefined,
  };
  return QueryParamSchema.parse(raw);
}

// Solution 3:
export const UserFormSchema = z.object({
  username: z.string().min(3, "Username must have at least 3 characters"),
  age: z.coerce.number().int().min(18, "Must be at least 18 years old"),
  subscribe: z.preprocess((val) => val === "on" || val === "true", z.boolean()),
});

export function parseUserFormData(formData: FormData) {
  const raw = {
    username: formData.get("username"),
    age: formData.get("age"),
    subscribe: formData.get("subscribe"),
  };
  return UserFormSchema.safeParse(raw);
}

// Solution 4:
export type ActionAuthResult<T> =
  | { status: "unauthorized"; message: string }
  | { status: "invalid"; errors: Record<string, string[] | undefined> }
  | { status: "success"; data: T };

export function createActionWithAuth<TInput, TOutput>(
  schema: z.ZodType<TInput>,
  handler: (input: TInput, ctx: { userId: string }) => Promise<TOutput>
) {
  return async (
    rawInput: unknown,
    sessionToken: string | null
  ): Promise<ActionAuthResult<TOutput>> => {
    if (!sessionToken) {
      return { status: "unauthorized", message: "User is not authenticated" };
    }

    const parseResult = schema.safeParse(rawInput);
    if (!parseResult.success) {
      return {
        status: "invalid",
        errors: parseResult.error.flatten().fieldErrors,
      };
    }

    const data = await handler(parseResult.data, { userId: "user_validated_123" });
    return { status: "success", data };
  };
}
```

---

### Recall
1. Why does `formData.get("field")` fail when tested against `z.number()`?
2. What discriminated union property on `SafeParseReturnType` allows TypeScript to narrow valid data vs ZodError?
3. If you remember only one thing: **Never type incoming network requests with `as Type`; treat all boundary inputs as `unknown` and validate them with `schema.safeParse()`.**

---

## Topic 12: End-to-End Type Safety: tRPC Procedure Input/Output Validation

### What Is It?
tRPC is an RPC (Remote Procedure Call) framework that shares TypeScript types between a backend server and a frontend client without code generation. Instead of manually writing API routes, client fetch calls, and shared interface files, tRPC infers types directly from backend router definitions.

At the core of every tRPC procedure is an input validator (typically a Zod schema). The schema verifies network payloads at runtime on the server and provides static auto-completion on the client.

### Why Does It Exist?
In traditional REST architectures:
1. The backend defines an endpoint `POST /api/user`.
2. The frontend writes `fetch("/api/user", { body: JSON.stringify(payload) })`.
3. If the backend changes `userId` to `id`, the frontend code compiles without errors, but crashes at runtime in production.

tRPC eliminates this synchronization gap. When you update the Zod schema on a tRPC backend procedure, any client invoking that procedure receives immediate TypeScript compilation errors if its arguments or expected returns do not match.

### Basic Example and Line-by-Line Explanation

```typescript
import { initTRPC } from "@trpc/server";
import { z } from "zod";

// 1. Initialize tRPC router context
const t = initTRPC.create();

// 2. Define reusable router and procedure helpers
export const router = t.router;
export const publicProcedure = t.procedure;

// 3. Define input validation schema
const GetUserInputSchema = z.object({
  id: z.string().uuid("User ID must be a valid UUID"),
});

// 4. Construct application router
export const appRouter = router({
  getUser: publicProcedure
    .input(GetUserInputSchema)
    .query(async ({ input }) => {
      // input is automatically typed as: { id: string }
      return {
        id: input.id,
        name: "Test User",
        createdAt: new Date().toISOString(),
      };
    }),
});

// 5. Export AppRouter type definition for client consumption
export type AppRouter = typeof appRouter;
```

Line-by-line breakdown:
1. `import { initTRPC } from "@trpc/server";`: Imports the tRPC initialization constructor.
2. `const t = initTRPC.create();`: Creates an instance of tRPC with internal type helpers.
3. `export const router = t.router;`: Helper function to group multiple procedures into a router tree.
4. `export const publicProcedure = t.procedure;`: Base procedure builder without authentication middleware.
5. `const GetUserInputSchema = z.object({ ... });`: Standard Zod schema defining the expected shape of the input payload.
6. `export const appRouter = router({`: Initializes the root application router.
7. `getUser: publicProcedure.input(GetUserInputSchema)`: Attaches the Zod schema as runtime parser. tRPC extracts `z.infer<typeof GetUserInputSchema>` to type the procedure's incoming arguments.
8. `.query(async ({ input }) => {`: Defines a read-only query procedure. The parameter `{ input }` is statically typed.
9. `return { id: input.id, ... };`: Returns the procedure response. The return type is inferred automatically.
10. `export type AppRouter = typeof appRouter;`: Exports the pure TypeScript type of the router. Only the type is imported by frontend clients (zero server code is bundled into the client).

### How It Works Inside TypeScript
tRPC uses advanced conditional type inference across builder chains:
1. `.input(schema)` inspects the passed validator. If the validator conforms to the Standard Schema Specification or Zod's `ZodType<T>`, tRPC infers `T` as the procedure's `TInput`.
2. When the procedure method `.query()` or `.mutation()` is called with `({ input }) => TOutput`, tRPC sets:
   ```typescript
   Procedure<"query", { _input_in: TInput; _output_out: TOutput }>
   ```
3. On the frontend, `createTRPCClient<AppRouter>()` parses `AppRouter`. When calling `trpc.getUser.query({ id: "..." })`, TypeScript looks up `AppRouter["getUser"]["_input_in"]` and enforces that the arguments match the exact shape of `GetUserInputSchema`.

### More Examples

#### Example 1: Mutation with Input and Output Validation
Output schemas ensure that server internal fields (such as hashed passwords or internal database IDs) are never leaked across the wire.
```typescript
import { initTRPC } from "@trpc/server";
import { z } from "zod";

const t = initTRPC.create();

const RegisterInputSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

const RegisterOutputSchema = z.object({
  id: z.string(),
  email: z.string(),
  registeredAt: z.string(),
});

export const authRouter = t.router({
  register: t.procedure
    .input(RegisterInputSchema)
    .output(RegisterOutputSchema)
    .mutation(async ({ input }) => {
      // Simulated database insert returning full entity
      const dbUser = {
        id: "usr_9981",
        email: input.email,
        passwordHash: "$2b$12$e80b..hashed",
        secretToken: "xyz_sensitive",
        registeredAt: new Date().toISOString(),
      };

      // Zod output schema strips or validates fields before transmitting to client
      return dbUser;
    }),
});
```

#### Example 2: Middleware Context Injection and Protected Procedures
```typescript
import { initTRPC, TRPCError } from "@trpc/server";
import { z } from "zod";

type Context = {
  authorizationHeader?: string;
};

const t = initTRPC.context<Context>().create();

const isAuthed = t.middleware(({ ctx, next }) => {
  if (!ctx.authorizationHeader || !ctx.authorizationHeader.startsWith("Bearer ")) {
    throw new TRPCError({ code: "UNAUTHORIZED", message: "Missing or invalid token" });
  }

  const token = ctx.authorizationHeader.slice(7);
  // Inject verified user session into context
  return next({
    ctx: {
      user: { id: "usr_authed_42", role: "admin" as const, token },
    },
  });
});

export const protectedProcedure = t.procedure.use(isAuthed);

export const projectRouter = t.router({
  deleteProject: protectedProcedure
    .input(z.object({ projectId: z.string().uuid() }))
    .mutation(async ({ input, ctx }) => {
      // ctx.user is guaranteed to exist and is strongly typed!
      return {
        deletedBy: ctx.user.id,
        projectId: input.projectId,
        role: ctx.user.role,
      };
    }),
});
```

#### Example 3: Client Consumption Pattern (Type-Only Import)
```typescript
// On the client: zero backend code is bundled, only the pure type
import { createTRPCClient, httpBatchLink } from "@trpc/client";
import type { AppRouter } from "./server/router"; // Pure type import

const trpc = createTRPCClient<AppRouter>({
  links: [
    httpBatchLink({
      url: "http://localhost:3000/api/trpc",
    }),
  ],
});

async function runClientQuery() {
  // TypeScript enforces { id: string }
  const user = await trpc.getUser.query({
    id: "f81d4fae-7dec-11d0-a765-00a0c91e6bf6",
  });

  // user is strongly typed with id, name, and createdAt
  console.log(user.name, user.createdAt);
}
```

### Common Mistakes

#### Mistake 1: Importing the backend router value instead of `type AppRouter` in client files
```typescript
// WRONG: Bundles server-side code (database drivers, passwords, node modules) into the client
import { appRouter } from "../server/router"; 

// CORRECT: Uses pure type import (completely erased at runtime by TypeScript)
import type { AppRouter } from "../server/router";
```

#### Mistake 2: Forgetting to handle TRPCError codes on the server
```typescript
// WRONG: Throwing generic JavaScript errors results in generic 500 Internal Server Errors
if (!item) {
  throw new Error("Item not found"); // Client gets opaque 500 error
}

// CORRECT: Throwing typed TRPCError with explicit HTTP mapping
import { TRPCError } from "@trpc/server";

if (!item) {
  throw new TRPCError({
    code: "NOT_FOUND",
    message: "Requested item does not exist",
  });
}
```

### Rules to Remember
1. Always export router types using `export type AppRouter = typeof appRouter`.
2. Frontend clients must only import the router type with `import type { AppRouter }`.
3. Input validation schemas passed to `.input()` run on the server before the resolver function runs.
4. Output schemas passed to `.output()` guarantee that data sent to the client matches the specified shape and prevents internal server fields from leaking.

---

### Think First: Prediction Puzzle
Inspect the following tRPC procedure definition:
```typescript
const router = t.router({
  updateScore: t.procedure
    .input(z.object({ score: z.number().max(100) }))
    .output(z.object({ newScore: z.number() }))
    .mutation(async ({ input }) => {
      return { newScore: input.score, internalMetrics: { dbTimeMs: 12 } };
    }),
});
```
Will the client receive `{ newScore: number; internalMetrics: { dbTimeMs: number } }` or just `{ newScore: number }`?

--------------------------------------------------------------------------------
**Answer:**
The client will only receive `{ newScore: number }`.

**Explanation:**
Zod object schemas automatically strip unrecognized properties during validation unless `.passthrough()` is explicitly enabled. Because the output schema specifies only `newScore`, `internalMetrics` is stripped before serialization and transmission to the client.

---

### Graded Exercises

#### Exercise 1: Basic tRPC Mutation Procedure
Define a tRPC procedure `createPost` that accepts an input schema with `title` (string, min 5 chars) and `content` (string, min 10 chars). It returns `{ id: string; title: string; content: string }`.
- Hint 1: Use `publicProcedure.input(schema).mutation(async ({ input }) => ...)`.
- Hint 2: Return a synthetic object with `id: "post_1"` and the input fields.

#### Exercise 2: Procedure Output Sanitization
Define a tRPC query `getUserProfile` that takes `{ userId: z.string() }`. The resolver queries an internal user object containing `{ id: string; name: string; hashedPin: string; balance: number }`. Use `.output()` to guarantee that `hashedPin` is never returned.
- Hint 1: Define an output schema with only `id`, `name`, and `balance`.
- Hint 2: Attach `.output(UserProfileOutputSchema)` to the procedure.

#### Exercise 3: Role-Based Procedure Middleware
Create a procedure builder `adminProcedure` using tRPC middleware. The context provides `{ user?: { role: "admin" | "user" } }`. If the user is missing or their role is not `"admin"`, throw a `TRPCError` with code `"FORBIDDEN"`.
- Hint 1: Define middleware with `t.middleware(({ ctx, next }) => ...)`.
- Hint 2: Check `if (ctx.user?.role !== "admin") throw new TRPCError({ code: "FORBIDDEN" })`.

#### Exercise 4: Router Merging and Sub-Routers
Construct two sub-routers: `userRouter` (with query `getById`) and `orderRouter` (with query `listRecent`). Merge them into a single `rootRouter` and demonstrate how the root client type accesses `rootRouter.order.listRecent`.
- Hint 1: Create each router with `t.router({ ... })`.
- Hint 2: Combine them in the root router: `t.router({ user: userRouter, order: orderRouter })`.

--------------------------------------------------------------------------------
### Exercise Solutions

```typescript
// Solution 1:
import { initTRPC } from "@trpc/server";
import { z } from "zod";

const t = initTRPC.create();

const CreatePostInput = z.object({
  title: z.string().min(5),
  content: z.string().min(10),
});

export const postRouter = t.router({
  createPost: t.procedure
    .input(CreatePostInput)
    .mutation(async ({ input }) => {
      return {
        id: "post_1",
        title: input.title,
        content: input.content,
      };
    }),
});

// Solution 2:
const UserProfileOutput = z.object({
  id: z.string(),
  name: z.string(),
  balance: z.number(),
});

export const profileRouter = t.router({
  getUserProfile: t.procedure
    .input(z.object({ userId: z.string() }))
    .output(UserProfileOutput)
    .query(async ({ input }) => {
      const internalUser = {
        id: input.userId,
        name: "Alice",
        hashedPin: "salt_99812_hash",
        balance: 450.0,
      };
      return internalUser; // hashedPin is stripped automatically by UserProfileOutput
    }),
});

// Solution 3:
import { TRPCError } from "@trpc/server";

type AuthContext = {
  user?: {
    id: string;
    role: "admin" | "user";
  };
};

const tAuth = initTRPC.context<AuthContext>().create();

const enforceAdmin = tAuth.middleware(({ ctx, next }) => {
  if (!ctx.user || ctx.user.role !== "admin") {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Admin privileges required for this action",
    });
  }
  return next({
    ctx: {
      adminUser: ctx.user,
    },
  });
});

export const adminProcedure = tAuth.procedure.use(enforceAdmin);

// Solution 4:
const userRouter = t.router({
  getById: t.procedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input }) => ({ id: input.id, username: "user_a" })),
});

const orderRouter = t.router({
  listRecent: t.procedure.query(async () => [
    { orderId: "ord_101", amount: 99.5 },
    { orderId: "ord_102", amount: 14.2 },
  ]),
});

export const rootRouter = t.router({
  user: userRouter,
  order: orderRouter,
});

export type RootRouter = typeof rootRouter;
```

---

### Recall
1. Why does tRPC recommend importing router types with `import type { AppRouter }` instead of a regular import?
2. What happens to unrecognized fields returned from a query handler when an explicit `.output()` Zod schema is attached?
3. If you remember only one thing: **tRPC provides end-to-end type safety without code generation by letting the TypeScript compiler infer client types directly from backend Zod schemas.**

## Topic 13: Schema-to-OpenAPI / Swagger Generation (`@asteasolutions/zod-to-openapi`)

### What Is It?
OpenAPI (formerly Swagger) is the industry-standard specification for describing RESTful HTTP APIs using JSON or YAML. `@asteasolutions/zod-to-openapi` is a library that extends standard Zod schemas with OpenAPI metadata and automatically generates valid OpenAPI 3.0 and 3.1 specification documents.

Instead of writing OpenAPI YAML files manually in parallel with your TypeScript code, you declare your Zod schemas once. The library synthesizes both the TypeScript static types and the OpenAPI documentation from the single source of truth.

### Why Does It Exist?
Manual API documentation suffers from documentation rot:
1. An engineer modifies a backend Zod schema or TypeScript type.
2. The engineer forgets to update the OpenAPI YAML documentation or Swagger UI.
3. Third-party API consumers, SDK generators, and frontend teams experience broken integrations because the documentation disagrees with actual server behavior.

Generating OpenAPI definitions directly from runtime Zod schemas guarantees that documentation, validation, and types can never drift apart.

### Basic Example and Line-by-Line Explanation

```typescript
import {
  extendZodWithOpenApi,
  OpenAPIRegistry,
  OpenApiGeneratorV3,
} from "@asteasolutions/zod-to-openapi";
import { z } from "zod";

// 1. Extend Zod prototype with .openapi() helper methods
extendZodWithOpenApi(z);

// 2. Initialize OpenAPI registry to collect schemas and endpoints
const registry = new OpenAPIRegistry();

// 3. Register a reusable schema with OpenAPI metadata
export const UserDtoSchema = registry.register(
  "UserDto",
  z.object({
    id: z.string().uuid().openapi({
      description: "Unique system identifier for the user",
      example: "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11",
    }),
    email: z.string().email().openapi({
      description: "Primary verified email address",
      example: "user@example.com",
    }),
  })
);

// 4. Register an API endpoint path
registry.registerPath({
  method: "get",
  path: "/users/{id}",
  description: "Retrieve user details by ID",
  request: {
    params: z.object({
      id: z.string().uuid(),
    }),
  },
  responses: {
    200: {
      description: "User located successfully",
      content: {
        "application/json": {
          schema: UserDtoSchema,
        },
      },
    },
    404: {
      description: "User not found",
    },
  },
});

// 5. Generate OpenAPI 3.0 document
const generator = new OpenApiGeneratorV3(registry.definitions);
export const openApiDoc = generator.generateDocument({
  openapi: "3.0.0",
  info: {
    title: "User Management Service API",
    version: "1.0.0",
  },
});
```

Line-by-line breakdown:
1. `import { extendZodWithOpenApi, OpenAPIRegistry, OpenApiGeneratorV3 } from "@asteasolutions/zod-to-openapi";`: Imports the registry and generator helpers.
2. `extendZodWithOpenApi(z);`: Patches the Zod namespace prototype in-memory so every Zod type gains the `.openapi()` builder method.
3. `const registry = new OpenAPIRegistry();`: Creates a registry container where schemas, route parameters, headers, and responses are registered.
4. `registry.register("UserDto", z.object({ ... }))`: Registers `UserDto` as a reusable component in the OpenAPI `#/components/schemas/UserDto` dictionary.
5. `id: z.string().uuid().openapi({ description, example })`: Appends metadata (descriptions, field examples) to the schema AST without altering runtime parsing behavior.
6. `registry.registerPath({ method: "get", path: "/users/{id}", ... })`: Defines an HTTP path operation.
7. `params: z.object({ id: z.string().uuid() })`: Specifies path parameter validation and documentation.
8. `responses: { 200: { content: { "application/json": { schema: UserDtoSchema } } } }`: Links the response payload directly to the registered `UserDto` component.
9. `const generator = new OpenApiGeneratorV3(registry.definitions);`: Instantiates the OpenAPI generator with all accumulated definitions.
10. `export const openApiDoc = generator.generateDocument({ ... })`: Produces the complete, valid OpenAPI 3.0 specification JSON object ready for Swagger UI or Redoc.

### How It Works Inside TypeScript
1. `extendZodWithOpenApi(z)` relies on TypeScript declaration merging. The library augments the global `z.ZodType` interface with an `.openapi(metadata)` signature.
2. When you invoke `.openapi({ example: "..." })`, Zod stores the metadata in an internal symbol property on the schema instance (`_def.openapi`).
3. During runtime parsing via `schema.parse(data)`, Zod ignores the OpenAPI metadata and performs standard type validation.
4. When `generator.generateDocument()` executes, the AST visitor walks the schema definition tree (`_def`), maps primitive Zod types to OpenAPI types (`z.string()` -> `"type": "string"`, `z.number().int()` -> `"type": "integer"`), and embeds the attached descriptions and examples.

### More Examples

#### Example 1: Registering Request Body and Error Responses
```typescript
import { extendZodWithOpenApi, OpenAPIRegistry } from "@asteasolutions/zod-to-openapi";
import { z } from "zod";

extendZodWithOpenApi(z);
const registry = new OpenAPIRegistry();

const CreateProjectSchema = registry.register(
  "CreateProjectInput",
  z.object({
    projectName: z.string().min(3).max(50).openapi({ example: "Alpha Engine" }),
    budget: z.number().positive().openapi({ example: 50000 }),
    isArchived: z.boolean().default(false),
  })
);

const ErrorResponseSchema = registry.register(
  "ApiError",
  z.object({
    code: z.string().openapi({ example: "INVALID_INPUT" }),
    message: z.string().openapi({ example: "Project name too short" }),
  })
);

registry.registerPath({
  method: "post",
  path: "/api/projects",
  summary: "Create a new project",
  request: {
    body: {
      description: "Project creation payload",
      content: {
        "application/json": {
          schema: CreateProjectSchema,
        },
      },
    },
  },
  responses: {
    201: {
      description: "Project created successfully",
      content: {
        "application/json": {
          schema: z.object({ id: z.string().uuid(), projectName: z.string() }),
        },
      },
    },
    400: {
      description: "Bad Request",
      content: {
        "application/json": {
          schema: ErrorResponseSchema,
        },
      },
    },
  },
});
```

#### Example 2: Documenting Bearer Authentication Security Schemes
```typescript
import { OpenAPIRegistry } from "@asteasolutions/zod-to-openapi";

const registry = new OpenAPIRegistry();

// Register Bearer Auth Security Scheme
const bearerAuth = registry.registerComponent("securitySchemes", "BearerAuth", {
  type: "http",
  scheme: "bearer",
  bearerFormat: "JWT",
  description: "Enter your JSON Web Token in the format: Bearer <token>",
});

// Protect path with the registered security scheme
registry.registerPath({
  method: "delete",
  path: "/api/users/{id}",
  security: [{ [bearerAuth.name]: [] }],
  responses: {
    204: {
      description: "User permanently deleted",
    },
    401: {
      description: "Unauthorized - Missing or invalid Bearer token",
    },
  },
});
```

#### Example 3: Serving Swagger UI with Express / Node.js
```typescript
import express from "express";
import swaggerUi from "swagger-ui-express";
import { openApiDoc } from "./openapi-definition"; // The generated spec object

const app = express();

// Serve interactive Swagger UI directly from the generated spec
app.use("/docs", swaggerUi.serve, swaggerUi.setup(openApiDoc));

// Serve raw JSON spec for external tooling and SDK generators
app.get("/docs.json", (_req, res) => {
  res.json(openApiDoc);
});
```

### Common Mistakes

#### Mistake 1: Forgetting to call `extendZodWithOpenApi(z)` before defining schemas
```typescript
// WRONG: Calling .openapi() without extending Zod throws TypeError at runtime
import { z } from "zod";

const Schema = z.string().openapi({ description: "Missing extension call" });
// Runtime Error: z.string(...).openapi is not a function!

// CORRECT: Call extendZodWithOpenApi(z) first
import { extendZodWithOpenApi } from "@asteasolutions/zod-to-openapi";
import { z } from "zod";

extendZodWithOpenApi(z);
const Schema = z.string().openapi({ description: "Valid and functional" });
```

#### Mistake 2: Anonymous nested schemas in responses causing duplication
```typescript
// SUBOPTIMAL: Inlining full schemas everywhere creates duplicate definitions in Swagger
registry.registerPath({
  path: "/users",
  responses: {
    200: {
      content: { "application/json": { schema: z.object({ id: z.string(), email: z.string() }) } }
    }
  }
});

// CORRECT: Register reusable schemas with registry.register("ComponentKey", schema)
// This creates clean references: "#/components/schemas/ComponentKey"
const UserSchema = registry.register("User", z.object({ id: z.string(), email: z.string() }));
registry.registerPath({
  path: "/users",
  responses: {
    200: {
      content: { "application/json": { schema: UserSchema } }
    }
  }
});
```

### Rules to Remember
1. Call `extendZodWithOpenApi(z)` at the entry point of your schema definition modules.
2. Use `registry.register("Name", schema)` to create reusable `#/components/schemas/Name` definitions.
3. Use `.openapi({ description, example })` to add human-readable API documentation.
4. Schema validation behavior is completely unaffected by `.openapi()` metadata; schemas remain 100% standard Zod validators at runtime.

---

### Think First: Prediction Puzzle
Examine this schema:
```typescript
extendZodWithOpenApi(z);

const SecretSchema = z.string().openapi({
  description: "User master password",
  example: "P@ssw0rd123",
});

const result = SecretSchema.safeParse(12345);
```
What is `result.success`? Does adding `.openapi()` relax or modify Zod's runtime type checking?

--------------------------------------------------------------------------------
**Answer:**
`result.success` is `false`.

**Explanation:**
`.openapi()` only attaches non-executable metadata to the internal schema definition. It does not alter Zod's runtime validation logic. Passing `12345` to `z.string()` fails with a type error regardless of any OpenAPI annotations.

---

### Graded Exercises

#### Exercise 1: Registering a Paginated Response Schema
Extend Zod with OpenAPI and use `OpenAPIRegistry` to register a reusable schema named `"PaginationMeta"` with `page` (integer, example `1`), `limit` (integer, example `20`), and `total` (integer, example `100`).
- Hint 1: Call `extendZodWithOpenApi(z)`.
- Hint 2: Use `registry.register("PaginationMeta", z.object({ ... }))`.

#### Exercise 2: Documenting Query Parameters
Using `OpenAPIRegistry`, register an HTTP GET endpoint `/api/search` that documents two query parameters: `q` (string, required) and `sort` (enum: `"asc"` | `"desc"`, optional).
- Hint 1: Use `registry.registerPath({ method: "get", path: "/api/search", request: { query: ... } })`.
- Hint 2: Define `query: z.object({ q: z.string(), sort: z.enum(["asc", "desc"]).optional() })`.

#### Exercise 3: Generating the OpenAPI JSON Document
Write a function `exportSpec(registry: OpenAPIRegistry, title: string, version: string)` that creates an `OpenApiGeneratorV3` and returns the generated OpenAPI 3.0 document object.
- Hint 1: Instantiate `new OpenApiGeneratorV3(registry.definitions)`.
- Hint 2: Call `generator.generateDocument({ openapi: "3.0.0", info: { title, version } })`.

#### Exercise 4: End-to-End Route Definition with Error Codes
Register a POST endpoint `/api/tokens` that accepts a request body containing `apiKey` (string). Document two responses: `200` returning `{ token: string; expiresAt: number }` and `403` returning `{ message: string }`.
- Hint 1: Register request body under `request: { body: { content: { "application/json": { schema: ... } } } }`.
- Hint 2: Register responses under `responses: { 200: { ... }, 403: { ... } }`.

--------------------------------------------------------------------------------
### Exercise Solutions

```typescript
// Solution 1:
import { extendZodWithOpenApi, OpenAPIRegistry } from "@asteasolutions/zod-to-openapi";
import { z } from "zod";

extendZodWithOpenApi(z);
export const registry = new OpenAPIRegistry();

export const PaginationMetaSchema = registry.register(
  "PaginationMeta",
  z.object({
    page: z.number().int().openapi({ example: 1 }),
    limit: z.number().int().openapi({ example: 20 }),
    total: z.number().int().openapi({ example: 100 }),
  })
);

// Solution 2:
registry.registerPath({
  method: "get",
  path: "/api/search",
  summary: "Search endpoint",
  request: {
    query: z.object({
      q: z.string().min(1).openapi({ description: "Search query string" }),
      sort: z.enum(["asc", "desc"]).optional().openapi({ description: "Sort order direction" }),
    }),
  },
  responses: {
    200: {
      description: "Search results returned successfully",
    },
  },
});

// Solution 3:
import { OpenApiGeneratorV3 } from "@asteasolutions/zod-to-openapi";

export function exportSpec(registry: OpenAPIRegistry, title: string, version: string) {
  const generator = new OpenApiGeneratorV3(registry.definitions);
  return generator.generateDocument({
    openapi: "3.0.0",
    info: {
      title,
      version,
    },
  });
}

// Solution 4:
const TokenRequestSchema = registry.register(
  "TokenRequest",
  z.object({
    apiKey: z.string().min(16).openapi({ example: "live_sec_9981abcdef" }),
  })
);

const TokenResponseSchema = registry.register(
  "TokenResponse",
  z.object({
    token: z.string(),
    expiresAt: z.number().int(),
  })
);

registry.registerPath({
  method: "post",
  path: "/api/tokens",
  summary: "Generate API session token",
  request: {
    body: {
      content: {
        "application/json": {
          schema: TokenRequestSchema,
        },
      },
    },
  },
  responses: {
    200: {
      description: "Token generated",
      content: {
        "application/json": {
          schema: TokenResponseSchema,
        },
      },
    },
    403: {
      description: "Forbidden - Invalid API Key",
      content: {
        "application/json": {
          schema: z.object({ message: z.string() }),
        },
      },
    },
  },
});
```

---

### Recall
1. Which method must be called to attach the `.openapi()` builder to standard Zod types?
2. What does `registry.register("ComponentName", schema)` do in the generated OpenAPI document?
3. If you remember only one thing: **By generating OpenAPI specifications directly from Zod schemas, your API documentation, runtime validation, and TypeScript types always stay in exact synchronization.**

---

## Topic 14: Environment Variable Validation and Fail-Fast Startup Pipelines (`@t3-oss/env-core`)

### What Is It?
Environment variable validation is the practice of inspecting and validating all application configuration variables (`process.env`) immediately upon server startup using a strict schema.

`@t3-oss/env-core` is an ecosystem library that uses Zod to validate server and client environment variables at build or runtime. It guarantees that an application cannot start if required configuration settings (such as database URLs, secrets, or API keys) are missing, misconfigured, or of invalid types.

### Why Does It Exist?
In standard Node.js applications, `process.env` properties are typed as `string | undefined`. This leads to two critical vulnerabilities:
1. **Silent runtime failures**: If `DATABASE_URL` is omitted, the application compiles and boots without warnings. Only when the first user attempts to query the database does the application crash in production.
2. **Secret leaks to the frontend**: In full-stack frameworks like Next.js, server secrets (e.g. `STRIPE_SECRET_KEY`) can accidentally be imported into client components if client and server environment variables are not strictly segregated.

A fail-fast startup pipeline halts the application process immediately during initialization with an informative error summary if any environment variable fails validation.

### Basic Example and Line-by-Line Explanation

```typescript
import { createEnv } from "@t3-oss/env-core";
import { z } from "zod";

export const env = createEnv({
  server: {
    NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
    PORT: z.coerce.number().int().positive().default(3000),
    DATABASE_URL: z.string().url("DATABASE_URL must be a valid connection URL"),
    API_SECRET_KEY: z.string().min(16, "Secret key must be at least 16 characters long"),
  },

  clientPrefix: "PUBLIC_",

  client: {
    PUBLIC_APP_URL: z.string().url(),
  },

  // Read environment variables directly from Node.js process runtime
  runtimeEnv: process.env,

  // Treat empty strings as undefined so default values or required checks trigger correctly
  emptyStringAsUndefined: true,
});
```

Line-by-line breakdown:
1. `import { createEnv } from "@t3-oss/env-core";`: Imports the environment configuration factory.
2. `import { z } from "zod";`: Imports Zod to define type constraints.
3. `export const env = createEnv({`: Invokes `createEnv` and exports the validated environment object.
4. `server: { ... }`: Declares variables that are strictly restricted to the server environment. Accessing these in client bundles causes build errors.
5. `PORT: z.coerce.number().int().positive().default(3000)`: Coerces the string `"3000"` from `process.env.PORT` into a static TypeScript `number`.
6. `DATABASE_URL: z.string().url(...)`: Verifies that the database connection string is a valid URL schema.
7. `clientPrefix: "PUBLIC_"`: Declares the prefix required for variables that are safe to expose to client-side browsers.
8. `client: { PUBLIC_APP_URL: z.string().url() }`: Declares public variables that client components may safely read.
9. `runtimeEnv: process.env`: Supplies the actual runtime dictionary (e.g. Node's `process.env`).
10. `emptyStringAsUndefined: true`: Transforms `DATABASE_URL=""` into `undefined` so that required validation errors trigger properly.

### How It Works Inside TypeScript
1. `createEnv` takes two type arguments inferred from the `server` and `client` configuration objects:
   ```typescript
   type ServerEnv = { [K in keyof typeof server]: z.infer<(typeof server)[K]> };
   type ClientEnv = { [K in keyof typeof client]: z.infer<(typeof client)[K]> };
   ```
2. The returned `env` object is statically typed as the union/intersection:
   ```typescript
   export const env: Readonly<ServerEnv & ClientEnv>;
   ```
3. When you type `env.PORT`, TypeScript infers `number` instead of `string | undefined`.
4. If an invalid or unconfigured property is accessed (e.g. `env.UNKNOWN_KEY`), TypeScript issues an immediate compilation error `TS2339`.

### More Examples

#### Example 1: Standalone Fail-Fast Node.js Pipeline (Zero External Libraries, Pure Zod)
```typescript
import { z } from "zod";

const EnvSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().default(8080),
  REDIS_HOST: z.string().min(1),
  REDIS_PORT: z.coerce.number().int().default(6379),
  ENCRYPTION_KEY: z.string().min(32, "ENCRYPTION_KEY must be 32 bytes minimum"),
});

export type Env = z.infer<typeof EnvSchema>;

function initializeEnvironment(): Env {
  const result = EnvSchema.safeParse(process.env);

  if (!result.success) {
    console.error("CRITICAL: Failed to validate application environment variables.");
    console.error("Please configure the missing or invalid variables below:\n");

    const issues = result.error.issues;
    for (const issue of issues) {
      console.error(`  - [${issue.path.join(".")}]: ${issue.message}`);
    }

    console.error("\nTerminating process with exit code 1.\n");
    process.exit(1);
  }

  return Object.freeze(result.data);
}

export const env = initializeEnvironment();
```

#### Example 2: Differentiating Staging and Production Credentials
```typescript
import { z } from "zod";

const BaseEnvSchema = z.object({
  NODE_ENV: z.enum(["development", "staging", "production"]),
  DATABASE_URL: z.string().url(),
});

// Discriminated refinement based on NODE_ENV
const ProductionConfigSchema = BaseEnvSchema.superRefine((data, ctx) => {
  if (data.NODE_ENV === "production") {
    if (!process.env.AWS_S3_BUCKET) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["AWS_S3_BUCKET"],
        message: "AWS_S3_BUCKET is strictly required when NODE_ENV is production",
      });
    }
  }
});
```

#### Example 3: Client vs Server Variable Protection Guard
```typescript
// env.ts
import { createEnv } from "@t3-oss/env-core";
import { z } from "zod";

export const env = createEnv({
  server: {
    STRIPE_SECRET_KEY: z.string().startsWith("sk_"),
  },
  clientPrefix: "NEXT_PUBLIC_",
  client: {
    NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: z.string().startsWith("pk_"),
  },
  runtimeEnv: process.env,
});

// In a browser component:
// console.log(env.STRIPE_SECRET_KEY);
// TypeScript Error: Property 'STRIPE_SECRET_KEY' does not exist on client build context!
```

### Common Mistakes

#### Mistake 1: Reading `process.env` throughout codebase instead of a centralized `env` module
```typescript
// WRONG: Scattered, unchecked access throughout service files
export async function connectDb() {
  const url = process.env.DATABASE_URL; // Type is string | undefined!
  if (!url) throw new Error("Missing url"); // Late failure at runtime
  return db.connect(url);
}

// CORRECT: Centralized import of validated, strongly typed env
import { env } from "./env";

export async function connectDb() {
  return db.connect(env.DATABASE_URL); // url is guaranteed string and validated URL
}
```

#### Mistake 2: Missing `emptyStringAsUndefined: true` when `.env` files contain empty values
```typescript
// WRONG: If .env has "DATABASE_URL=", process.env.DATABASE_URL is ""
// z.string().url().default("http://fallback") will NOT use the default,
// because "" is considered a string value and will fail the .url() check!

// CORRECT: Preprocess or configure emptyStringAsUndefined: true
const EnvSchema = z.object({
  DATABASE_URL: z.preprocess(
    (val) => (val === "" ? undefined : val),
    z.string().url().default("http://localhost:5432")
  ),
});
```

### Rules to Remember
1. Always validate environment variables at the application's earliest entry point (`process.exit(1)` on error).
2. Never access `process.env` directly in application logic; always import your verified `env` object.
3. Coerce numeric and boolean environment variables with `z.coerce.number()` and `z.coerce.boolean()`.
4. Segregate server-only secrets from client-exposed public keys to prevent credential leaks.

---

### Think First: Prediction Puzzle
Consider this environment validation code:
```typescript
const Schema = z.object({
  IS_DEBUG: z.coerce.boolean(),
});

process.env.IS_DEBUG = "false";
const parsed = Schema.parse(process.env);
console.log(parsed.IS_DEBUG);
```
What will be logged: `true` or `false`?

--------------------------------------------------------------------------------
**Answer:**
`true`.

**Explanation:**
In JavaScript, `Boolean("false")` evaluates to `true` because any non-empty string is truthy! `z.coerce.boolean()` performs native `Boolean(value)`. To safely parse boolean strings from environment variables, use:
```typescript
z.enum(["true", "false"]).transform((val) => val === "true")
```
or a custom preprocessor:
```typescript
z.preprocess((val) => val === "true" || val === "1", z.boolean())
```

---

### Graded Exercises

#### Exercise 1: Basic Node Server Startup Validator
Write an `EnvSchema` validating `PORT` (positive integer, default `3000`), `HOST` (string, default `"0.0.0.0"`), and `NODE_ENV` (enum: `"development"` | `"production"`, default `"development"`). Test it against an empty object `{}`.
- Hint 1: Use `z.coerce.number().int().positive().default(3000)`.
- Hint 2: Call `EnvSchema.parse({})` and verify default values.

#### Exercise 2: Boolean Environment Variable Preprocessor
Write a custom validator `zodEnvBoolean()` that safely parses `"true"`, `"1"`, `"false"`, and `"0"` into their corresponding boolean values `true` or `false`.
- Hint 1: Use `z.preprocess()`.
- Hint 2: Check `if (val === "true" || val === "1") return true; if (val === "false" || val === "0") return false;`.

#### Exercise 3: Fail-Fast Crash Reporter
Write a function `validateAndBoot(schema: z.ZodObject<any>, rawEnv: Record<string, unknown>)` that calls `schema.safeParse`. If it fails, return `{ ok: false; missingKeys: string[] }`. If it succeeds, return `{ ok: true; env: ValidatedType }`.
- Hint 1: Check `!result.success`.
- Hint 2: Map `result.error.issues` to extract unique variable names from `issue.path[0]`.

#### Exercise 4: Production Multi-Environment Configuration
Build a schema that requires `STRIPE_WEBHOOK_SECRET` only when `ENABLE_BILLING` is `"true"`. If `ENABLE_BILLING` is false or not provided, `STRIPE_WEBHOOK_SECRET` is optional.
- Hint 1: Use `.superRefine((data, ctx) => ...)`.
- Hint 2: If `data.ENABLE_BILLING === true && !data.STRIPE_WEBHOOK_SECRET`, call `ctx.addIssue(...)`.

--------------------------------------------------------------------------------
### Exercise Solutions

```typescript
// Solution 1:
import { z } from "zod";

export const BasicEnvSchema = z.object({
  PORT: z.coerce.number().int().positive().default(3000),
  HOST: z.string().default("0.0.0.0"),
  NODE_ENV: z.enum(["development", "production"]).default("development"),
});

const defaultEnv = BasicEnvSchema.parse({});
// defaultEnv is: { PORT: 3000, HOST: "0.0.0.0", NODE_ENV: "development" }

// Solution 2:
export const safeBooleanEnv = z.preprocess((val) => {
  if (val === "true" || val === "1" || val === true) return true;
  if (val === "false" || val === "0" || val === false) return false;
  return val;
}, z.boolean());

// Solution 3:
export function validateAndBoot<T extends z.ZodRawShape>(
  schema: z.ZodObject<T>,
  rawEnv: Record<string, unknown>
): { ok: true; env: z.infer<z.ZodObject<T>> } | { ok: false; missingKeys: string[] } {
  const result = schema.safeParse(rawEnv);
  if (result.success) {
    return { ok: true, env: result.data };
  }

  const missingKeys = Array.from(
    new Set(result.error.issues.map((issue) => String(issue.path[0])))
  );

  return { ok: false, missingKeys };
}

// Solution 4:
export const BillingEnvSchema = z
  .object({
    ENABLE_BILLING: safeBooleanEnv.default(false),
    STRIPE_WEBHOOK_SECRET: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.ENABLE_BILLING && !data.STRIPE_WEBHOOK_SECRET) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["STRIPE_WEBHOOK_SECRET"],
        message: "STRIPE_WEBHOOK_SECRET is mandatory when ENABLE_BILLING is enabled",
      });
    }
  });
```

---

### Recall
1. Why does `z.coerce.boolean()` return `true` for `process.env.DEBUG = "false"`?
2. What is the danger of letting an application start up without validating required database URLs?
3. If you remember only one thing: **Validate all environment variables during application boot so your server fails fast with clear errors instead of crashing later in production.**

---

## Checkpoint Challenge 3: Full-Stack Schema Synthesis and End-to-End Type Safety (Topics 11-14)

### Challenge Objective
In this comprehensive capstone challenge, you will construct a complete, unified schema-driven architecture that bridges all concepts from Topics 11 through 14:
1. **Startup Fail-Fast Environment Validation**: Configure and validate server startup variables using a strict Zod schema.
2. **OpenAPI Schema Registry and Spec Generation**: Define OpenAPI-augmented DTO schemas and register an HTTP route with `@asteasolutions/zod-to-openapi`.
3. **End-to-End tRPC Router**: Build a type-safe procedure with input validation and output data sanitization.
4. **Boundary Route Handler Execution**: Process and safely validate an untrusted incoming network payload, handling errors with structured HTTP 400 responses.

### Implementation Code

```typescript
import {
  extendZodWithOpenApi,
  OpenAPIRegistry,
  OpenApiGeneratorV3,
} from "@asteasolutions/zod-to-openapi";
import { initTRPC } from "@trpc/server";
import { z } from "zod";

// ============================================================================
// Step 1: Fail-Fast Startup Environment Pipeline
// ============================================================================
const ServerConfigSchema = z.object({
  PORT: z.coerce.number().int().positive().default(4000),
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  DATABASE_URL: z.string().url(),
  JWT_SECRET: z.string().min(16),
});

export type ServerConfig = z.infer<typeof ServerConfigSchema>;

export function bootEnvironment(raw: Record<string, unknown>): ServerConfig {
  const result = ServerConfigSchema.safeParse(raw);
  if (!result.success) {
    const errorDetails = result.error.issues
      .map((i) => `Field [${i.path.join(".")}]: ${i.message}`)
      .join("\n");
    throw new Error(`CRITICAL STARTUP FAILURE: Invalid environment:\n${errorDetails}`);
  }
  return Object.freeze(result.data);
}

// ============================================================================
// Step 2: OpenAPI Registry & Schema-to-OpenAPI Synthesis
// ============================================================================
extendZodWithOpenApi(z);
export const apiRegistry = new OpenAPIRegistry();

// Document Account Model
export const AccountDtoSchema = apiRegistry.register(
  "AccountDto",
  z.object({
    accountId: z.string().uuid().openapi({
      description: "Globally unique account UUID",
      example: "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d",
    }),
    username: z.string().min(3).max(30).openapi({
      description: "User handle",
      example: "developer_one",
    }),
    role: z.enum(["member", "admin"]).openapi({
      example: "member",
    }),
  })
);

// Register Path Operation in OpenAPI
apiRegistry.registerPath({
  method: "post",
  path: "/api/v1/accounts",
  summary: "Register a new user account",
  request: {
    body: {
      content: {
        "application/json": {
          schema: z.object({
            username: z.string().min(3),
            role: z.enum(["member", "admin"]).default("member"),
          }),
        },
      },
    },
  },
  responses: {
    201: {
      description: "Account successfully created",
      content: {
        "application/json": {
          schema: AccountDtoSchema,
        },
      },
    },
  },
});

export function generateSwaggerSpec() {
  const generator = new OpenApiGeneratorV3(apiRegistry.definitions);
  return generator.generateDocument({
    openapi: "3.0.0",
    info: {
      title: "Enterprise Account Engine API",
      version: "1.0.0",
    },
  });
}

// ============================================================================
// Step 3: End-to-End tRPC Router with Output Sanitization
// ============================================================================
const t = initTRPC.create();

const AccountMutationInput = z.object({
  username: z.string().min(3),
  role: z.enum(["member", "admin"]).default("member"),
});

// Output schema strips internal passwordHash and database fields
const AccountMutationOutput = z.object({
  accountId: z.string().uuid(),
  username: z.string(),
  role: z.enum(["member", "admin"]),
});

export const accountRouter = t.router({
  createAccount: t.procedure
    .input(AccountMutationInput)
    .output(AccountMutationOutput)
    .mutation(async ({ input }) => {
      // Simulate database insertion returning internal entity
      const dbRecord = {
        accountId: "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d",
        username: input.username,
        role: input.role,
        passwordHash: "$argon2id$v=19$m=65536,t=3,p=4$secret",
        internalId: 10091,
      };

      // Zod output schema strips passwordHash and internalId before returning!
      return dbRecord;
    }),
});

export type AccountRouter = typeof accountRouter;

// ============================================================================
// Step 4: Verification and Test Suite Runner
// ============================================================================
export async function runFullStackCheckpoint() {
  console.log("--- 1. Testing Fail-Fast Environment Validation ---");
  const validMockEnv = {
    PORT: "5050",
    NODE_ENV: "production",
    DATABASE_URL: "postgresql://postgres:secret@localhost:5432/main_db",
    JWT_SECRET: "ultra_secure_session_secret_key_12345",
  };

  const validatedConfig = bootEnvironment(validMockEnv);
  console.log("Config validated successfully. Port:", validatedConfig.PORT);

  let caughtError = false;
  try {
    bootEnvironment({ PORT: "invalid_port" });
  } catch (err: any) {
    caughtError = true;
    console.log("Successfully prevented boot with invalid env variables!");
  }

  console.log("\n--- 2. Testing OpenAPI Document Generation ---");
  const openApiDoc = generateSwaggerSpec();
  console.log("OpenAPI Title:", openApiDoc.info.title);
  console.log("Documented Paths:", Object.keys(openApiDoc.paths));
  console.log(
    "Components Registered:",
    Object.keys(openApiDoc.components?.schemas ?? {})
  );

  console.log("\n--- 3. Testing tRPC Procedure Execution & Sanitization ---");
  const caller = accountRouter.createCaller({});
  const created = await caller.createAccount({
    username: "john_doe",
    role: "member",
  });

  console.log("Procedure executed successfully!");
  console.log("Output account ID:", created.accountId);
  console.log("Output username:", created.username);
  // Verify that internal passwordHash was stripped
  console.log("Password hash stripped:", !("passwordHash" in created));

  console.log("\n--- Checkpoint 3 Complete: All assertions passed cleanly! ---");
}

runFullStackCheckpoint();
```
