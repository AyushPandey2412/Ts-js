# Module TS-03: Conditional Types, Inference & Recursion

Welcome to TypeScript Conditional Types, Inference, and Recursion. This module teaches how to write type-level logic that makes decisions, extracts hidden types, and computes complex type transformations at compile time.

---

# Topic 1: What Are Conditional Types? (`T extends U ? X : Y`)

### 1. What is it?
A conditional type is a type-level if-else statement. It chooses one of two possible types based on a condition expressed as a subtyping check.

Its syntax looks like JavaScript's ternary operator:
```typescript
T extends U ? X : Y
```
If `T` is assignable to `U`, the type evaluates to `X`. Otherwise, it evaluates to `Y`.

### 2. Why does it exist?
In JavaScript, functions often return different shapes of data depending on the types of their inputs.

For example, a function might return a `string` if passed a string, or a `number` if passed a number. Without conditional types, you would either have to write complex function overloads or fall back to unions that force the caller to perform manual type checks. Conditional types allow the return type to dynamically match the input type.

### 3. Basic example

```typescript
type IsString<T> = T extends string ? true : false;

type A = IsString<"hello">; // true
type B = IsString<42>;       // false
type C = IsString<boolean>;  // false
```

**Line-by-line explanation:**
- `type IsString<T> = T extends string ? true : false;`: Declares a generic conditional type. It checks if the type parameter `T` is a subtype of `string`. If yes, it resolves to literal type `true`. If no, it resolves to literal type `false`.
- `type A = IsString<"hello">;`: `"hello"` is a string literal, so `"hello" extends string` is true. `A` becomes `true`.
- `type B = IsString<42>;`: `42` is a number, not a string. `B` becomes `false`.
- `type C = IsString<boolean>;`: `boolean` is not a string. `C` becomes `false`.

---

### 4. How it works inside TypeScript
When TypeScript encounters `T extends U ? X : Y`:

1. **Subtyping Check**: The compiler checks if `Set(T) ⊆ Set(U)`. That is, can every possible value in `T` be assigned to `U`?
2. **Branch Selection**:
   - If `T` satisfies `U`, the compiler discards branch `Y` and resolves branch `X`.
   - If `T` does not satisfy `U`, the compiler discards branch `X` and resolves branch `Y`.
3. **Type Simplification**: The resulting type replaces the conditional expression across the entire program.

---

### 5. Think first

What is the resulting type of `Result` in the code below? Decide first.

```typescript
type CheckNumber<T> = T extends number ? "is-number" : "not-number";

type Result = CheckNumber<100 | 200>;
```

---

**Answer and Reason:**

The resulting type is:

```typescript
"is-number"
```

**Reason**: `100 | 200` is a union of number literals. Every member of this union is a number. Therefore, `100 | 200 extends number` evaluates to true, resolving to `"is-number"`.

---

### 6. Try it yourself
Create a conditional type `IsArray<T>` that checks if `T extends unknown[]`. If yes, resolve to `"array"`. If no, resolve to `"other"`. Test it with `string[]` and `number`.

---

### 7. More examples

#### Example A: Conditional Return Types in Functions (Easy)

```typescript
function processId<T extends string | number>(
  id: T
): T extends string ? string : number {
  return (typeof id === "string" ? id.toUpperCase() : id * 2) as any;
}

const str = processId("usr_100"); // Inferred type: string
const num = processId(50);        // Inferred type: number
```

**Line-by-line explanation:**
- Calling `processId("usr_100")` infers `T` as `"usr_100"`. Since `"usr_100" extends string` is true, the return type is automatically `string`.
- Calling `processId(50)` infers `T` as `number`. The return type is automatically `number`.

#### Example B: Checking for Functions (Medium)

```typescript
type IsFunction<T> = T extends (...args: any[]) => any ? true : false;

type Test1 = IsFunction<() => void>; // true
type Test2 = IsFunction<{ name: string }>; // false
```

**Line-by-line explanation:**
- `(...args: any[]) => any` represents any callable function signature.

---

### 8. Common mistakes

#### Mistake 1: Expecting conditional types to run at runtime

**Wrong code:**
```typescript
function check(val: unknown) {
  // if (val extends string) { ... } // Syntax Error!
}
```

**Why it happens:**
`extends` in a conditional type exists purely in type space. In runtime JavaScript code, you must use standard operators like `typeof val === "string"`.

---

### 9. Rules to remember
1. Syntax: `T extends U ? X : Y`.
2. Evaluates to `X` if `T` is assignable to `U`; otherwise evaluates to `Y`.
3. Conditional types operate entirely during compilation and are erased from emitted JavaScript.

---

### 10. Exercises

#### Question 1 (Predict the compile result)
What is the resulting type of `Output`?
```typescript
type Check<T> = T extends boolean ? "bool" : "other";
type Output = Check<true>;
```

#### Question 2 (Find and fix the bug)
The conditional type below is missing its false branch. Fix the syntax:
```typescript
type IsObject<T> = T extends object ? true;
```

#### Question 3 (Write code from scratch)
Write a conditional type `TypeName<T>` that checks:
- If `T extends string`, return `"string"`
- Else if `T extends number`, return `"number"`
- Else if `T extends boolean`, return `"boolean"`
- Else return `"object"`

#### Question 4 (Explain in your own words)
How do conditional types help create functions that return different types depending on their arguments?

---

### Solutions

#### Solution to Question 1
**Hint 1**: Does literal `true` extend `boolean`?

**Answer**:
The resulting type is `"bool"`.

#### Solution to Question 2
**Hint 1**: Add `: false` to complete the ternary syntax.

**Answer**:
```typescript
type IsObject<T> = T extends object ? true : false;
```

#### Solution to Question 3
**Hint 1**: Chain ternary checks: `T extends string ? "string" : T extends number ? ...`.

**Answer**:
```typescript
type TypeName<T> =
  T extends string ? "string" :
  T extends number ? "number" :
  T extends boolean ? "boolean" :
  "object";
```

#### Solution to Question 4
**Hint 1**: Think about how the return type annotation can inspect parameter `T`.

**Answer**:
By using the parameter type `T` in a conditional return type (`T extends string ? string : number`), the compiler dynamically resolves the exact return type based on what the caller passed into the function, without needing manual type assertions at call sites.

---

### 11. Recall

1. What operator is conditional type syntax modeled after?
2. When does branch `X` in `T extends U ? X : Y` get chosen?
3. Do conditional types exist at runtime?

**If you remember only one thing:**
`T extends U ? X : Y` lets you make compile-time decisions based on whether type `T` fits into type `U`.

---

# Topic 2: Immediate vs Deferred Evaluation

### 1. What is it?
When TypeScript processes a conditional type, it evaluates it in one of two ways:
- **Immediate Evaluation**: If the types are concrete (like `string` or `number`), TypeScript solves the conditional immediately.
- **Deferred Evaluation**: If the type depends on an unresolved generic parameter `T`, TypeScript delays (defers) solving the condition until the generic function or type is actually called with a concrete type.

### 2. Why does it exist?
Inside a generic function body, the compiler does not yet know what concrete type the caller will provide.

If TypeScript tried to guess immediately, it would make assumptions that could be wrong. By deferring evaluation, TypeScript ensures that type decisions are only finalized when the exact concrete type is known.

### 3. Basic example

```typescript
// 1. Immediate Evaluation:
type ConcreteResult = string extends number ? true : false;
// Evaluated immediately by compiler as: false

// 2. Deferred Evaluation:
function processValue<T>(val: T): T extends string ? string[] : number[] {
  // Inside this function, 'T' is unresolved.
  // The return type is deferred!
  return null as any;
}

// Solved as soon as a concrete type is passed:
const res1 = processValue("hello"); // Evaluates to string[]!
const res2 = processValue(42);      // Evaluates to number[]!
```

**Line-by-line explanation:**
- `type ConcreteResult`: The types `string` and `number` are known immediately. The compiler evaluates the ternary to `false` during compilation.
- `function processValue<T>`: Inside the function body, `T` is unknown. The compiler leaves the conditional type in an unresolved (deferred) state.
- `const res1 = processValue("hello")`: When called with `"hello"`, `T` becomes `"hello"`. The compiler immediately resolves `"hello" extends string ? string[] : number[]` to `string[]`.

---

### 4. How it works inside TypeScript
1. **Concrete Types**: When all operands in `T extends U ? X : Y` are known literals or primitives, the compiler resolves the type to `X` or `Y` right away.
2. **Generic Type Variables**: If `T` is a generic placeholder, the compiler creates a deferred conditional type node in its abstract syntax tree.
3. **Call-Site Specialization**: When the generic is instantiated with a real type, the deferred node is replaced with the final resolved type.

---

### 5. Think first

What is the type of `result` below? Decide first.

```typescript
type Check<T> = T extends string ? true : false;
type Immediate = Check<"test">;
```

---

**Answer and Reason:**

The type of `Immediate` is:

```typescript
true
```

**Reason**: `"test"` is a concrete literal string. Because no unresolved generic variables remain, TypeScript immediately resolves `"test" extends string` to `true`.

---

### 6. Try it yourself
Write a generic type `Unpack<T> = T extends Array<infer Item> ? Item : T`. Test it with a concrete type `number[]`. Notice that the result immediately resolves to `number`.

---

### 7. More examples

#### Example A: Deferred Return Type Inside Function Bodies (Medium)

```typescript
function choose<T extends boolean>(flag: T): T extends true ? string : number {
  if (flag) {
    // TypeScript cannot prove that "active" matches the deferred conditional!
    // return "active"; // Error without assertion
    return "active" as any;
  }
  return 0 as any;
}
```

**Line-by-line explanation:**
- Inside `choose`, `T` is deferred. Because `T` is not yet bound to `true` or `false`, the compiler cannot verify that `"active"` matches the deferred return type. A type assertion is commonly required inside the implementation.

---

### 8. Common mistakes

#### Mistake 1: Expecting the compiler to solve deferred types inside generic function bodies

**Wrong code:**
```typescript
function test<T extends string | number>(x: T): T extends string ? string : number {
  if (typeof x === "string") {
    // return x; // Error: Type 'string' is not assignable to type 'T extends string ? string : number'.
  }
  return 0 as any;
}
```

**Why it happens:**
Narrowing `x` with `typeof` narrows the variable `x`, but it does NOT narrow the type parameter `T` itself. `T` remains deferred, so returning `x` directly fails without an assertion.

---

### 9. Rules to remember
1. Concrete conditionals are evaluated immediately by the compiler.
2. Conditionals containing generic placeholders are deferred until called.
3. Deferred conditionals inside function bodies usually require a type assertion on the return value.

---

### 10. Exercises

#### Question 1 (Predict the compile result)
Is `type R = number extends string ? true : false` evaluated immediately or deferred?

#### Question 2 (Find and fix the bug)
Explain why `return x;` fails in the function below:
```typescript
function echo<T extends string>(x: T): T extends string ? T : never {
  return x;
}
```

#### Question 3 (Write code from scratch)
Write a conditional type `IsBoolean<T> = T extends boolean ? "yes" : "no"`. Create two concrete type aliases that evaluate immediately: one for `true` and one for `"true"`.

#### Question 4 (Explain in your own words)
Why does TypeScript defer conditional types that contain generic type parameters?

---

### Solutions

#### Solution to Question 1
**Hint 1**: Are `number` and `string` concrete types?

**Answer**:
It is evaluated immediately to `false`.

#### Solution to Question 2
**Hint 1**: Is `T extends string ? T : never` deferred inside the body?

**Answer**:
Inside the generic function body, the return type is deferred. The compiler cannot verify that `x: T` matches the deferred conditional type without an explicit assertion like `return x as any;`.

#### Solution to Question 3
**Hint 1**: Pass `true` and `"true"`.

**Answer**:
```typescript
type IsBoolean<T> = T extends boolean ? "yes" : "no";

type R1 = IsBoolean<true>;   // "yes"
type R2 = IsBoolean<"true">; // "no"
```

#### Solution to Question 4
**Hint 1**: What happens if the function hasn't been called yet?

**Answer**:
Because the concrete type is not known until the caller invokes the function, the compiler cannot evaluate the condition ahead of time. Deferring evaluation ensures that the decision is calculated accurately for each specific call site.

---

### 11. Recall

1. What is immediate evaluation?
2. What causes a conditional type to be deferred?
3. How do you return values from a function whose return type is a deferred conditional?

**If you remember only one thing:**
Conditionals are evaluated immediately when types are concrete, but deferred when generic parameters are unresolved.

---

# Topic 3: Distributive Conditional Types and Naked Type Parameters

### 1. What is it?
When a conditional type checks a **naked type parameter** (a bare type parameter `T` without brackets or wrapper types), and you pass a union type into it (`A | B | C`), TypeScript automatically **distributes** the check across each member of the union individually:
```typescript
(A | B) extends U ? X : Y
// becomes:
(A extends U ? X : Y) | (B extends U ? X : Y)
```

### 2. Why does it exist?
In JavaScript, functions frequently operate on unions. For example, if you want a type that turns types into arrays, you want `ToArray<string | number>` to produce `string[] | number[]`, so each variant is cleanly wrapped.

Distributive conditional types allow you to transform, filter, and inspect union members one by one automatically.

### 3. Basic example

```typescript
type ToArray<T> = T extends unknown ? T[] : never;

// When passed a union:
type Result = ToArray<string | number>;
// Resolves to: string[] | number[]
```

**Line-by-line explanation:**
- `type ToArray<T> = T extends unknown ? T[] : never;`: `T` is a naked type parameter (it stands alone before `extends`).
- `ToArray<string | number>`: Because `string | number` is a union, TypeScript splits it:
  1. `string extends unknown ? string[] : never` $\to$ `string[]`
  2. `number extends unknown ? number[] : never` $\to$ `number[]`
- Union of results: `string[] | number[]` (NOT `(string | number)[]`!).

---

### 4. How it works inside TypeScript
1. **Naked Parameter Detection**: The compiler checks if `T` on the left of `extends` is a bare type parameter.
2. **Union Expansion**: If the incoming type argument is a union $A \mid B \mid C$, the compiler expands the expression into:
   $$(A \text{ extends } U ? X : Y) \mid (B \text{ extends } U ? X : Y) \mid (C \text{ extends } U ? X : Y)$$
3. **Result Recombination**: The results from each branch are combined back into a single final union.

---

### 5. Think first

What is the resulting type of `Result` in the code below? Decide first.

```typescript
type FilterString<T> = T extends string ? T : never;

type Result = FilterString<string | number | boolean>;
```

---

**Answer and Reason:**

The resulting type is:

```typescript
string
```

**Reason**: The union distributes:
1. `string extends string ? string : never` $\to$ `string`
2. `number extends string ? number : never` $\to$ `never`
3. `boolean extends string ? boolean : never` $\to$ `never`
Recombining: `string | never | never`. Since `never` represents the empty set, it vanishes from unions, leaving only `string`.

---

### 6. Try it yourself
Create a distributive conditional type `KeepNumbers<T> = T extends number ? T : never`. Test it with `"a" | 1 | "b" | 2 | true`. Verify that the result is `1 | 2`.

---

### 7. More examples

#### Example A: Mapping a Union of Primitives (Easy)

```typescript
type WrapInObject<T> = T extends any ? { value: T } : never;

type Wrapped = WrapInObject<"open" | "closed">;
// Resolves to: { value: "open" } | { value: "closed" }
```

**Line-by-line explanation:**
- Distributes over `"open"` and `"closed"`, producing a union of two distinct object types.

---

### 8. Common mistakes

#### Mistake 1: Expecting distribution when `T` is wrapped in an array

**Wrong assumption:**
```typescript
type Check<T> = T[] extends string[] ? true : false;
type R = Check<string | number>;
// Does NOT distribute because T is wrapped in T[], so it is not naked!
// Evaluates to: false
```

**Why it happens:**
Distribution only happens when `T` is a bare (naked) type parameter directly preceding `extends`.

---

### 9. Rules to remember
1. Conditional types distribute over unions only when `T` is a naked type parameter.
2. `(A | B) extends U ? X : Y` expands to `(A extends U ? ...) | (B extends U ? ...)`.
3. Returning `never` in a branch removes that member from the resulting union.

---

### 10. Exercises

#### Question 1 (Predict the compile result)
What is the resulting type of `Result`?
```typescript
type IsPositive<T> = T extends "yes" ? true : false;
type Result = IsPositive<"yes" | "no">;
```

#### Question 2 (Find and fix the bug)
The type below is intended to distribute, but fails to distribute because `T` is wrapped. Fix it:
```typescript
type BoxEach<T> = [T] extends [unknown] ? { data: T } : never;
```

#### Question 3 (Write code from scratch)
Write a distributive conditional type `FilterOutNull<T>` that filters out `null` from any union.

#### Question 4 (Explain in your own words)
Why does `never` vanish when returned from a distributive branch?

---

### Solutions

#### Solution to Question 1
**Hint 1**: Distribute over `"yes"` and `"no"`.

**Answer**:
`Result` is `true | false` (which simplifies to `boolean`).

#### Solution to Question 2
**Hint 1**: Remove the square brackets around `[T]` and `[unknown]`.

**Answer**:
```typescript
type BoxEach<T> = T extends unknown ? { data: T } : never;
```

#### Solution to Question 3
**Hint 1**: `T extends null ? never : T`.

**Answer**:
```typescript
type FilterOutNull<T> = T extends null ? never : T;
```

#### Solution to Question 4
**Hint 1**: What does `T | never` equal in set theory?

**Answer**:
`never` represents the empty set (zero values). In union types, adding nothing to a set leaves the set unchanged (`T | never = T`). Therefore, `never` automatically drops out of union types.

---

### 11. Recall

1. What is a naked type parameter?
2. What happens when a union type is passed to a naked conditional type?
3. What happens to `never` members in a union?

**If you remember only one thing:**
Naked conditional types automatically distribute across union members, allowing you to filter and transform unions.

---

# Topic 4: Filtering Unions with Built-in Conditionals (`Exclude` and `Extract`)

### 1. What is it?
TypeScript includes two standard utility types for filtering unions:
- `Exclude<T, U>`: Removes all union members from `T` that are assignable to `U`.
- `Extract<T, U>`: Keeps only union members from `T` that are assignable to `U`.

Both utilities are implemented in the standard library using distributive conditional types.

### 2. Why does it exist?
In real applications, you often have a broad union (such as all user roles or all possible event names) and need to derive a more specific subset.

For example, if you have `type Role = "admin" | "editor" | "viewer"`, you might need a type for public roles (excluding `"admin"`). Instead of manually retyping the union, `Exclude` and `Extract` let you derive exact subsets cleanly.

### 3. Basic example

```typescript
type Role = "admin" | "editor" | "viewer";

// 1. Exclude: Remove "admin"
type PublicRole = Exclude<Role, "admin">;
// Inferred as: "editor" | "viewer"

// 2. Extract: Keep only "admin" and "editor"
type StaffRole = Extract<Role, "admin" | "editor">;
// Inferred as: "admin" | "editor"
```

**Line-by-line explanation:**
- `type PublicRole = Exclude<Role, "admin">;`: Distributes over `"admin"`, `"editor"`, and `"viewer"`. It removes `"admin"` and keeps the rest.
- `type StaffRole = Extract<Role, "admin" | "editor">;`: Only keeps members that belong to `"admin" | "editor"`.

---

### 4. How it works inside TypeScript
Here is the exact source code of `Exclude` and `Extract` from TypeScript's `lib.d.ts`:

```typescript
// Official TypeScript definitions:
type Exclude<T, U> = T extends U ? never : T;
type Extract<T, U> = T extends U ? T : never;
```

**Step-by-step trace of `Exclude<"a" | "b", "a">`:**
1. `"a" extends "a" ? never : "a"` $\to$ `never`
2. `"b" extends "a" ? never : "b"` $\to$ `"b"`
3. Combine: `never | "b"` $\to$ `"b"`.

---

### 5. Think first

What is the resulting type of `Result` below? Decide first.

```typescript
type Mixed = string | number | boolean;
type Result = Exclude<Mixed, number | boolean>;
```

---

**Answer and Reason:**

The resulting type is:

```typescript
string
```

**Reason**: `Exclude` removes every member that is assignable to `number | boolean`. Both `number` and `boolean` are eliminated, leaving only `string`.

---

### 6. Try it yourself
Define a union type `Status = "pending" | "approved" | "rejected" | "cancelled"`. Use `Exclude` to create `ActiveStatus` that excludes `"rejected"` and `"cancelled"`.

---

### 7. More examples

#### Example A: Extracting Action Types (Medium)

```typescript
type Action =
  | { type: "CLICK"; x: number; y: number }
  | { type: "HOVER"; element: string }
  | { type: "SCROLL"; offset: number };

// Extract only the CLICK action:
type ClickAction = Extract<Action, { type: "CLICK" }>;
// Resolves to: { type: "CLICK"; x: number; y: number }
```

**Line-by-line explanation:**
- `Extract` checks each object in the union. Only the object with `type: "CLICK"` matches `{ type: "CLICK" }`.

---

### 8. Common mistakes

#### Mistake 1: Confusing `Exclude` and `Omit`

**Wrong assumption:**
Trying to use `Exclude` to remove a property from an object.
```typescript
type User = { id: string; name: string };
// type NoName = Exclude<User, "name">; // Bug: Does not remove the property!
```

**Why it happens:**
- `Exclude` filters **unions** (`"a" | "b"`).
- `Omit` removes properties from **objects** (`{ a: 1, b: 2 }`).

**Correct code:**
```typescript
type NoName = Omit<User, "name">; // { id: string }
```

---

### 9. Rules to remember
1. `Exclude<T, U>` removes matching members from a union: `T extends U ? never : T`.
2. `Extract<T, U>` keeps matching members from a union: `T extends U ? T : never`.
3. Use `Exclude` on unions; use `Omit` on object properties.

---

### 10. Exercises

#### Question 1 (Predict the compile result)
What is the resulting type of `Clean`?
```typescript
type Clean = Exclude<string | null | undefined, null | undefined>;
```

#### Question 2 (Find and fix the bug)
The code below attempts to keep only string types from `Data`, but uses the wrong utility. Fix it:
```typescript
type Data = string | number | boolean;
type StringsOnly = Exclude<Data, string>;
```

#### Question 3 (Write code from scratch)
Write your own generic type `MyExclude<T, U>` from scratch without using TypeScript's built-in `Exclude`. Test it on `"red" | "green" | "blue"`.

#### Question 4 (Explain in your own words)
How does `Exclude` use `never` to remove unwanted types from a union?

---

### Solutions

#### Solution to Question 1
**Hint 1**: Remove `null` and `undefined`.

**Answer**:
The resulting type is `string`.

#### Solution to Question 2
**Hint 1**: Use `Extract` to keep matching types.

**Answer**:
```typescript
type Data = string | number | boolean;
type StringsOnly = Extract<Data, string>;
```

#### Solution to Question 3
**Hint 1**: `T extends U ? never : T`.

**Answer**:
```typescript
type MyExclude<T, U> = T extends U ? never : T;
type Colors = MyExclude<"red" | "green" | "blue", "blue">; // "red" | "green"
```

#### Solution to Question 4
**Hint 1**: What happens to `never` when combined in a union?

**Answer**:
When `Exclude` evaluates a matching member, it returns `never`. Because `never` represents an empty set containing no values, it automatically disappears when combined with the other union members.

---

### 11. Recall

1. What built-in utility type removes matching union members?
2. What built-in utility type keeps matching union members?
3. What is the difference between `Exclude` and `Omit`?

**If you remember only one thing:**
`Exclude` removes members from a union, while `Extract` keeps members in a union.

---

# Topic 5: Filtering Nullability with `NonNullable<T>`

### 1. What is it?
`NonNullable<T>` is a built-in utility type that constructs a type by removing `null` and `undefined` from `T`.

### 2. Why does it exist?
Variables, API payloads, and database fields frequently have types like `string | null | undefined`.

When you validate that data exists (or write a function that only processes existing values), you need a type that represents the guaranteed non-nullish value. `NonNullable<T>` removes `null` and `undefined` in one step.

### 3. Basic example

```typescript
type RawInput = string | number | null | undefined;

type CleanInput = NonNullable<RawInput>;
// Inferred as: string | number
```

**Line-by-line explanation:**
- `type RawInput`: Holds a union of four types including `null` and `undefined`.
- `type CleanInput = NonNullable<RawInput>;`: Filters out both `null` and `undefined`, leaving only `string | number`.

---

### 4. How it works inside TypeScript
Here is the official definition of `NonNullable<T>` from `lib.d.ts`:

```typescript
type NonNullable<T> = T extends null | undefined ? never : T;
```

**Step-by-step trace:**
1. Each member of the union is checked against `null | undefined`.
2. If the member is `null` or `undefined`, it evaluates to `never`.
3. If the member is anything else (such as `string`), it evaluates to `T`.
4. The `never` members vanish, leaving only valid non-nullish types.

---

### 5. Think first

What is the resulting type of `Result` below? Decide first.

```typescript
type MaybeUser = { id: string } | null;
type Result = NonNullable<MaybeUser>;
```

---

**Answer and Reason:**

The resulting type is:

```typescript
{ id: string }
```

**Reason**: `null` matches `null | undefined` and is replaced by `never`. The object `{ id: string }` does not match `null | undefined` and is kept.

---

### 6. Try it yourself
Create a type `UserProfile = { name: string | null; age: number | undefined }`. Use `NonNullable<UserProfile["name"]>` to extract the clean type of `name`.

---

### 7. More examples

#### Example A: Clean Function Parameter (Easy)

```typescript
function saveName(name: NonNullable<string | null>) {
  console.log(name.trim()); // Completely safe! Cannot be null.
}

saveName("Alex"); // Valid
// saveName(null); // Compile Error!
```

---

### 8. Common mistakes

#### Mistake 1: Expecting `NonNullable` to deeply clean nested object properties

**Wrong assumption:**
```typescript
type User = {
  name: string | null;
};
type CleanUser = NonNullable<User>;
// CleanUser.name is STILL string | null!
```

**Why it happens:**
`NonNullable` only operates on the top-level type `User` itself (which is not null). It does not recurse into nested properties.

---

### 9. Rules to remember
1. `NonNullable<T>` strips `null` and `undefined` from a union.
2. Official definition: `T extends null | undefined ? never : T`.
3. It only operates on the top-level union, not nested object properties.

---

### 10. Exercises

#### Question 1 (Predict the compile result)
What is the resulting type of `T1`?
```typescript
type T1 = NonNullable<number | undefined>;
```

#### Question 2 (Find and fix the bug)
Write the definition of `MyNonNullable<T>` from scratch:
```typescript
type MyNonNullable<T> = T extends null ? never : T; // Missing undefined!
```

#### Question 3 (Write code from scratch)
Given a type `Config = { timeout?: number }`. Extract the type of `timeout` and use `NonNullable` to get guaranteed `number`.

#### Question 4 (Explain in your own words)
Why does `NonNullable<{ name: string | null }>` not remove `null` from `name`?

---

### Solutions

#### Solution to Question 1
**Hint 1**: Remove `undefined`.

**Answer**:
The resulting type is `number`.

#### Solution to Question 2
**Hint 1**: Include `null | undefined` in the condition.

**Answer**:
```typescript
type MyNonNullable<T> = T extends null | undefined ? never : T;
```

#### Solution to Question 3
**Hint 1**: Use `NonNullable<Config["timeout"]>`.

**Answer**:
```typescript
type Config = { timeout?: number };
type CleanTimeout = NonNullable<Config["timeout"]>; // number
```

#### Solution to Question 4
**Hint 1**: What type is the object itself? Is the object null?

**Answer**:
The object itself is not `null` or `undefined` (it is an object). `NonNullable` only checks the top-level type passed to it; it does not inspect or transform the properties inside an object.

---

### 11. Recall

1. What two types does `NonNullable` remove?
2. What does `NonNullable<null>` evaluate to?
3. Does `NonNullable` clean nested properties automatically?

**If you remember only one thing:**
`NonNullable<T>` removes `null` and `undefined` from top-level union types.

---

# Checkpoint Challenge: Topics 1 to 5

### Challenge Scenario
Build a type-safe event dispatcher and event payload extractor:

1. Define a union of event objects:
   ```typescript
   type AppEvent =
     | { type: "USER_LOGIN"; payload: { userId: string } }
     | { type: "USER_LOGOUT"; payload: null }
     | { type: "PAGE_VIEW"; payload: { url: string } };
   ```
2. Using `Extract`, create a type `LoginEvent` that extracts the `USER_LOGIN` event.
3. Using `Exclude`, create a type `EventWithPayload` that excludes `USER_LOGOUT`.
4. Write a generic conditional type `GetPayload<E extends AppEvent>` that extracts the `payload` property, and if `payload` is `null`, returns `never`.
5. Test `GetPayload` with `AppEvent`.

### Challenge Solution

```typescript
type AppEvent =
  | { type: "USER_LOGIN"; payload: { userId: string } }
  | { type: "USER_LOGOUT"; payload: null }
  | { type: "PAGE_VIEW"; payload: { url: string } };

// 2. Extract LoginEvent:
type LoginEvent = Extract<AppEvent, { type: "USER_LOGIN" }>;

// 3. Exclude USER_LOGOUT:
type EventWithPayload = Exclude<AppEvent, { type: "USER_LOGOUT" }>;

// 4. GetPayload conditional type:
type GetPayload<E extends AppEvent> =
  E["payload"] extends null ? never : E["payload"];

// 5. Test GetPayload with AppEvent:
type ExtractedPayloads = GetPayload<AppEvent>;
// Resolves to: { userId: string } | { url: string }
```

---

# Topic 6: Preventing Distribution with Tuple Wrapping (`[T]`)

### 1. What is it?
Sometimes you do NOT want a conditional type to distribute across a union. You want to check whether the union **as a whole** satisfies a condition.

To prevent distribution, wrap both sides of the `extends` keyword in a 1-element tuple:
```typescript
[T] extends [U] ? X : Y
```

### 2. Why does it exist?
Consider checking whether a type is strictly assignable to `string`.

If you test `string | number` with a naked parameter `T extends string ? true : false`:
- `string` branch evaluates to `true`
- `number` branch evaluates to `false`
- The union of results is `true | false` (`boolean`)!
That is wrong if you wanted to ask: "Is the whole type assignable to string?" (The answer should be `false`).
Wrapping in tuples `[T] extends [string]` prevents distribution and tests the whole union at once.

### 3. Basic example

```typescript
// 1. Distributive (naked T):
type IsStringDist<T> = T extends string ? true : false;
type R1 = IsStringDist<string | number>; // Evaluates to: boolean (true | false)

// 2. Non-Distributive (tuple wrapped [T]):
type IsStringStrict<T> = [T] extends [string] ? true : false;
type R2 = IsStringStrict<string | number>; // Evaluates to: false!
```

**Line-by-line explanation:**
- `[T] extends [string]`: Because `T` is wrapped inside `[T]`, it is no longer a naked type parameter.
- The compiler compares the entire set `[string | number]` against `[string]`.
- Since `string | number` is not a subset of `string`, the condition evaluates directly to `false`.

---

### 4. How it works inside TypeScript
1. **Naked vs Wrapped**: Distribution only triggers when `T` stands completely alone before `extends`.
2. **Tuple Protection**: Wrapping `[T]` turns the check into a standard structural comparison of a 1-element tuple.
3. **Whole-Set Evaluation**: The entire union is evaluated as a single type without being split into separate branches.

---

### 5. Think first

What is the resulting type of `Test` below? Decide first.

```typescript
type Check<T> = [T] extends [unknown] ? "yes" : "no";
type Test = Check<string | number>;
```

---

**Answer and Reason:**

The resulting type is:

```typescript
"yes"
```

**Reason**: `[string | number]` is checked as a whole against `[unknown]`. Since any type fits into `unknown`, the entire check passes as a single result `"yes"`.

---

### 6. Try it yourself
Create a type `IsExactUnion<T>` that uses `[T]` to verify if a type is assignable to `string | number`. Test it with `string | number` (should return true) and `string | boolean` (should return false).

---

### 7. More examples

#### Example A: Detecting Tuples vs Arrays (Medium)

```typescript
type IsFixedTuple<T> = [T] extends [readonly [any, ...any[]]] ? true : false;
```

---

### 8. Common mistakes

#### Mistake 1: Forgetting to wrap both sides in brackets

**Wrong code:**
```typescript
type Check<T> = [T] extends string ? true : false; // Always false!
```

**Why it happens:**
`[T]` is a tuple. A tuple can never extend a primitive `string`. Both sides must be wrapped: `[T] extends [string]`.

---

### 9. Rules to remember
1. `T extends U` distributes over unions.
2. `[T] extends [U]` suppresses distribution and tests the union as a whole.
3. Both sides must be wrapped in square brackets.

---

### 10. Exercises

#### Question 1 (Predict the compile result)
What is the resulting type of `R`?
```typescript
type Test<T> = [T] extends [number] ? true : false;
type R = Test<number | string>;
```

#### Question 2 (Find and fix the bug)
The type below is supposed to test if `T` as a whole is assignable to `object`, but it distributes. Fix it:
```typescript
type IsWholeObject<T> = T extends object ? true : false;
```

#### Question 3 (Write code from scratch)
Write a non-distributive conditional type `IsAllStrings<T>` that returns `true` only if every member of `T` is a string, and `false` otherwise.

#### Question 4 (Explain in your own words)
Why does `[T] extends [U]` prevent distribution?

---

### Solutions

#### Solution to Question 1
**Hint 1**: Does the union `number | string` fit inside `number`?

**Answer**:
The resulting type is `false`.

#### Solution to Question 2
**Hint 1**: Wrap both sides in square brackets: `[T] extends [object]`.

**Answer**:
```typescript
type IsWholeObject<T> = [T] extends [object] ? true : false;
```

#### Solution to Question 3
**Hint 1**: Use `[T] extends [string] ? true : false`.

**Answer**:
```typescript
type IsAllStrings<T> = [T] extends [string] ? true : false;
```

#### Solution to Question 4
**Hint 1**: What is the definition of a naked type parameter?

**Answer**:
TypeScript only distributes conditional types when the type parameter `T` is naked (unwrapped). Wrapping `T` in a tuple `[T]` creates a compound type, so TypeScript treats it as a single unit and disables the distribution law.

---

### 11. Recall

1. What syntax disables distributive conditional types?
2. Why does `T extends string` return `boolean` when passed `string | number`?
3. Must both sides of `extends` be wrapped in brackets?

**If you remember only one thing:**
Wrap both sides in square brackets `[T] extends [U]` to test a union as a whole without splitting it.

---

# Topic 7: The `never` Distribution Trap and How to Check for `never`

### 1. What is it?
When you pass `never` to a distributive conditional type, it does NOT evaluate either branch. It immediately returns `never`!

To check if a type is `never`, you **must** use tuple wrapping:
```typescript
type IsNever<T> = [T] extends [never] ? true : false;
```

### 2. Why does it exist?
Because `never` represents the empty set ($\emptyset$), distributing over `never` means distributing over zero elements.

When you loop over a list with zero elements, the loop runs zero times. In the same way, distributing over `never` runs zero times and produces an empty union (`never`). If you want to check if a type is `never`, you must disable distribution using `[T]`.

### 3. Basic example

```typescript
// 1. The Trap: Distributive check fails on never!
type IsNeverBroken<T> = T extends never ? true : false;
type R1 = IsNeverBroken<never>; // Evaluates to: never! (NOT true!)

// 2. The Solution: Non-distributive tuple check
type IsNever<T> = [T] extends [never] ? true : false;
type R2 = IsNever<never>;  // Evaluates to: true!
type R3 = IsNever<string>; // Evaluates to: false!
```

**Line-by-line explanation:**
- `type IsNeverBroken<never>`: `never` is an empty union. Distributing over an empty union runs 0 times, returning `never`. The branch `true` is never reached.
- `type IsNever<T> = [T] extends [never]`: Wrapping in `[T]` disables distribution.
- `[never] extends [never]`: Compares the 1-element tuple `[never]` to `[never]`. The condition is true, returning `true`.

---

### 4. How it works inside TypeScript
1. **Empty Set Principle**: `never` is the identity element of unions ($T \mid \text{never} = T$).
2. **Zero Invocations**: Passing `never` to a naked conditional produces zero evaluations.
3. **Tuple Escape**: A tuple containing `never` (`[never]`) is NOT empty; it is a 1-element tuple. This allows the comparison to run normally.

---

### 5. Think first

What is the resulting type of `Output` below? Decide first.

```typescript
type Check<T> = T extends number ? "num" : "other";
type Output = Check<never>;
```

---

**Answer and Reason:**

The resulting type is:

```typescript
never
```

**Reason**: `Check` has a naked type parameter `T`. Passing `never` distributes over an empty set, resulting in `never` immediately.

---

### 6. Try it yourself
Write the `IsNever<T>` type utility using `[T] extends [never] ? true : false`. Test it with `never`, `void`, and `undefined`.

---

### 7. More examples

#### Example A: Safe Fallback for `never` (Medium)

```typescript
type ValueOrDefault<T, Default> = [T] extends [never] ? Default : T;

type A = ValueOrDefault<string, "fallback">; // string
type B = ValueOrDefault<never, "fallback">;  // "fallback"
```

**Line-by-line explanation:**
- Safely detects `never` and substitutes a fallback type.

---

### 8. Common mistakes

#### Mistake 1: Trying to check `T extends never` without brackets

**Wrong code:**
```typescript
type Test<T> = T extends never ? 1 : 2;
type Res = Test<never>; // Evaluates to never, not 1!
```

---

### 9. Rules to remember
1. Naked conditional types return `never` when passed `never`.
2. To check if `T` is `never`, always write: `[T] extends [never] ? true : false`.

---

### 10. Exercises

#### Question 1 (Predict the compile result)
What is the resulting type of `R`?
```typescript
type Broken<T> = T extends any ? "yes" : "no";
type R = Broken<never>;
```

#### Question 2 (Find and fix the bug)
Fix `CheckNever` so that it returns `true` for `never`:
```typescript
type CheckNever<T> = T extends never ? true : false;
```

#### Question 3 (Write code from scratch)
Write a conditional type `EnsureNonEmpty<T, Fallback>` that returns `Fallback` if `T` is `never`, otherwise returns `T`.

#### Question 4 (Explain in your own words)
Why does distributing over `never` return `never` instead of evaluating the ternary branches?

---

### Solutions

#### Solution to Question 1
**Hint 1**: Does a naked conditional execute when given an empty set?

**Answer**:
The resulting type is `never`.

#### Solution to Question 2
**Hint 1**: Wrap both sides in square brackets: `[T] extends [never]`.

**Answer**:
```typescript
type CheckNever<T> = [T] extends [never] ? true : false;
```

#### Solution to Question 3
**Hint 1**: Use `[T] extends [never] ? Fallback : T`.

**Answer**:
```typescript
type EnsureNonEmpty<T, Fallback> = [T] extends [never] ? Fallback : T;
```

#### Solution to Question 4
**Hint 1**: Think of a `for` loop over an empty list.

**Answer**:
In distributive conditional types, TypeScript treats the input as a union and runs the check for each member. Because `never` represents the empty set (a union with 0 members), the operation runs 0 times and produces an empty result (`never`).

---

### 11. Recall

1. What happens when `never` is passed to a naked conditional type?
2. How do you properly check if a type is `never`?
3. Is `[never]` considered an empty union?

**If you remember only one thing:**
Always use `[T] extends [never]` to check for `never`.

---

# Topic 8: Type Inference in Conditional Types with `infer`

### 1. What is it?
The `infer` keyword allows you to declare a type variable inside the condition of a conditional type, and extract (infer) a component type from a larger structure.

Think of `infer` as pattern matching for types:
```typescript
T extends Array<infer Item> ? Item : never
```

### 2. Why does it exist?
Often you have a complex type (like a Promise, a function, an array, or an object) and you need to unwrap or extract an internal type.

Before `infer`, extracting the return type of a function or the element type of an array was impossible without complex workarounds. The `infer` keyword lets you reach into any type structure and pull out what you need.

### 3. Basic example

```typescript
type Flatten<T> = T extends Array<infer Item> ? Item : T;

type NumberArray = number[];
type ElementType = Flatten<NumberArray>; // Inferred as: number

type NonArray = string;
type SameType = Flatten<NonArray>; // Inferred as: string
```

**Line-by-line explanation:**
- `type Flatten<T> = T extends Array<infer Item> ? Item : T;`:
  - `T extends Array<infer Item>`: Checks if `T` is an array. If it is, the compiler introduces a temporary type variable `Item` and binds it to the element type of that array.
  - `? Item`: In the true branch, we return the extracted `Item`.
  - `: T`: If `T` is not an array, return `T` unchanged.
- `Flatten<number[]>`: Matches `Array<infer Item>`. `Item` is bound to `number`. The type resolves to `number`.

---

### 4. How it works inside TypeScript
1. **Pattern Matching**: The compiler compares `T` against the shape containing `infer VarName`.
2. **Variable Binding**: If `T` matches the pattern, the compiler solves for `VarName` and binds it.
3. **Branch Scope**: The inferred type variable `VarName` is only available in the **true** branch of that conditional type. It cannot be used in the false branch.

---

### 5. Think first

What is the resulting type of `Extracted` in the code below? Decide first.

```typescript
type UnwrapPromise<T> = T extends Promise<infer Value> ? Value : T;

type Extracted = UnwrapPromise<Promise<{ id: string }>>;
```

---

**Answer and Reason:**

The resulting type is:

```typescript
{ id: string }
```

**Reason**: `Promise<{ id: string }>` matches `Promise<infer Value>`. TypeScript binds `Value` to `{ id: string }` and returns it.

---

### 6. Try it yourself
Write a generic type `FirstElement<T>` that uses `infer` on a tuple `T extends [infer First, ...any[]]` to return the first element of a tuple, or `never` if the tuple is empty. Test it with `[string, number]`.

---

### 7. More examples

#### Example A: Unwrapping a Box Object (Easy)

```typescript
type Box<T> = { value: T };

type Unbox<B> = B extends Box<infer Content> ? Content : never;

type Content = Unbox<Box<boolean>>; // boolean
```

**Line-by-line explanation:**
- Matches `{ value: infer Content }` and extracts `boolean`.

---

### 8. Common mistakes

#### Mistake 1: Trying to use `infer` in the false branch

**Wrong code:**
```typescript
type Bad<T> = T extends Array<infer Item> ? Item : Item; // Error!
```

**Why it happens:**
If `T` does not match the array pattern, `Item` was never found. It cannot exist in the false branch.

---

### 9. Rules to remember
1. `infer` declares a type variable to pattern-match inside `extends`.
2. `infer` can only be used in the condition of a conditional type.
3. The inferred variable is only in scope in the **true** branch.

---

### 10. Exercises

#### Question 1 (Predict the compile result)
What is the resulting type of `Result`?
```typescript
type GetType<T> = T extends { data: infer D } ? D : never;
type Result = GetType<{ data: number[] }>;
```

#### Question 2 (Find and fix the bug)
Fix the syntax error in the type alias below:
```typescript
type ExtractItem<T> = T extends infer Item[] ? Item : never;
```

#### Question 3 (Write code from scratch)
Write a conditional type `GetSecond<T>` that extracts the second element from a 2-element tuple `[A, B]` using `infer`.

#### Question 4 (Explain in your own words)
Why can an inferred type variable only be used in the true branch of a conditional type?

---

### Solutions

#### Solution to Question 1
**Hint 1**: What is the type of the `data` property?

**Answer**:
The resulting type is `number[]`.

#### Solution to Question 2
**Hint 1**: Write `(infer Item)[]` or `Array<infer Item>`.

**Answer**:
```typescript
type ExtractItem<T> = T extends (infer Item)[] ? Item : never;
```

#### Solution to Question 3
**Hint 1**: Pattern match on `[any, infer Second]`.

**Answer**:
```typescript
type GetSecond<T> = T extends [any, infer Second] ? Second : never;
```

#### Solution to Question 4
**Hint 1**: What if the condition is false?

**Answer**:
If the condition evaluates to false, it means the input type did not match the expected pattern. In that case, the compiler could not find or extract the type, so the inferred variable has no value in the false branch.

---

### 11. Recall

1. What keyword enables type pattern matching in conditional types?
2. In which branch is the inferred type variable accessible?
3. Can `infer` be used outside of a conditional type?

**If you remember only one thing:**
`infer` extracts nested types by pattern matching inside the `extends` clause of a conditional type.

---

# Topic 9: Extracting Return Types with `ReturnType<T>`

### 1. What is it?
`ReturnType<T>` is a built-in TypeScript utility type that extracts the return type of a function type `T`.

### 2. Why does it exist?
Often, a function's return type is complex and inferred by TypeScript rather than written manually (such as a database query or an action creator).

If you need that return type elsewhere in your code (for example, to annotate a state variable or a component prop), you can extract it automatically using `ReturnType<typeof functionName>` without having to manually duplicate the interface.

### 3. Basic example

```typescript
function createUser() {
  return {
    id: "usr_100",
    name: "Morgan",
    roles: ["admin", "editor"],
    createdAt: Date.now(),
  };
}

// Extract the return type:
type User = ReturnType<typeof createUser>;
// User is inferred as:
// { id: string; name: string; roles: string[]; createdAt: number; }
```

**Line-by-line explanation:**
- `function createUser()`: Returns an object literal. TypeScript infers its return type.
- `typeof createUser`: Gets the function's type signature: `() => { id: string; ... }`.
- `ReturnType<typeof createUser>`: Extracts the return type from the function signature and assigns it to `User`.

---

### 4. How it works inside TypeScript
Here is the official definition of `ReturnType<T>` from `lib.d.ts`:

```typescript
type ReturnType<T extends (...args: any[]) => any> =
  T extends (...args: any[]) => infer R ? R : any;
```

**Step-by-step breakdown:**
1. `T extends (...args: any[]) => any`: Constrains `T` so you can only pass function types.
2. `T extends (...args: any[]) => infer R`: Uses `infer R` on the function's return position.
3. `? R`: Returns the inferred return type `R`.

---

### 5. Think first

What happens if you pass a function value directly to `ReturnType` instead of `typeof function`? Decide first.

```typescript
function getCount() { return 42; }
type CountType = ReturnType<getCount>;
```

---

**Answer and Reason:**

This code fails to compile:

```
'getCount' refers to a value, but is being used as a type here. Did you mean 'typeof getCount'?
```

**Reason**: `ReturnType` expects a **type**, not a runtime function value. You must write `ReturnType<typeof getCount>`.

---

### 6. Try it yourself
Write a function `makeConfig()` that returns `{ theme: "dark", port: 3000 }`. Use `ReturnType<typeof makeConfig>` to create a type `Config`, and declare a variable using that type.

---

### 7. More examples

#### Example A: Async Functions Return Promises (Medium)

```typescript
async function fetchUser() {
  return { id: "1", name: "Alex" };
}

type FetchReturn = ReturnType<typeof fetchUser>;
// Inferred as: Promise<{ id: string; name: string }>
```

**Line-by-line explanation:**
- `async` functions always wrap their return value in a `Promise`. `ReturnType` returns the `Promise` wrapper (we will learn how to unwrap promises in Topic 11 with `Awaited`).

---

### 8. Common mistakes

#### Mistake 1: Passing non-function types to `ReturnType`

**Wrong code:**
```typescript
type Res = ReturnType<string>; // Error!
```

**Why it happens:**
`ReturnType` requires a function type.

---

### 9. Rules to remember
1. `ReturnType<T>` extracts the return type of a function type `T`.
2. Always write `ReturnType<typeof fn>` when referencing runtime functions.
3. For async functions, `ReturnType` returns `Promise<Result>`.

---

### 10. Exercises

#### Question 1 (Predict the compile result)
What is the type of `Num`?
```typescript
const add = (a: number, b: number) => a + b;
type Num = ReturnType<typeof add>;
```

#### Question 2 (Find and fix the bug)
Fix the error in this type declaration:
```typescript
function build() { return { ok: true }; }
type Built = ReturnType<build>;
```

#### Question 3 (Write code from scratch)
Write your own `MyReturnType<T>` utility using conditional types and `infer`.

#### Question 4 (Explain in your own words)
Why is `ReturnType<typeof fn>` preferred over manually creating and maintaining a separate interface for a function's output?

---

### Solutions

#### Solution to Question 1
**Hint 1**: What does `a + b` return when both are numbers?

**Answer**:
The type is `number`.

#### Solution to Question 2
**Hint 1**: Add `typeof` before `build`.

**Answer**:
```typescript
type Built = ReturnType<typeof build>;
```

#### Solution to Question 3
**Hint 1**: `T extends (...args: any[]) => infer R ? R : never`.

**Answer**:
```typescript
type MyReturnType<T extends (...args: any[]) => any> =
  T extends (...args: any[]) => infer R ? R : never;
```

#### Solution to Question 4
**Hint 1**: What happens when someone changes the function implementation later?

**Answer**:
If you maintain a separate interface manually, you have to update both the function and the interface whenever the return structure changes. `ReturnType<typeof fn>` stays automatically in sync with the function implementation, eliminating duplicate code and synchronization bugs.

---

### 11. Recall

1. What built-in utility extracts a function's return type?
2. What operator must you precede a runtime function name with when using `ReturnType`?
3. What is the return type of an `async` function?

**If you remember only one thing:**
Use `ReturnType<typeof functionName>` to extract a function's return type automatically.

---

# Topic 10: Extracting Parameter Types with `Parameters<T>`

### 1. What is it?
`Parameters<T>` is a built-in utility type that extracts the parameter types of a function type `T` as a tuple.

### 2. Why does it exist?
When working with third-party libraries or legacy code, functions often take complex arguments without exporting the argument types.

`Parameters<typeof functionName>` lets you extract the exact tuple of parameters. You can then index into the tuple (`Parameters<typeof fn>[0]`) to get the type of the first argument.

### 3. Basic example

```typescript
function saveUser(id: string, age: number, isActive: boolean) {
  // Saves user to database
}

// 1. Extract all parameters as a tuple:
type SaveUserArgs = Parameters<typeof saveUser>;
// Inferred as: [id: string, age: number, isActive: boolean]

// 2. Extract the first parameter type:
type FirstArg = Parameters<typeof saveUser>[0];
// Inferred as: string
```

**Line-by-line explanation:**
- `typeof saveUser`: The signature `(id: string, age: number, isActive: boolean) => void`.
- `Parameters<typeof saveUser>`: Extracts the arguments into a tuple `[string, number, boolean]`.
- `Parameters<typeof saveUser>[0]`: Indexes into the first element of the tuple, producing `string`.

---

### 4. How it works inside TypeScript
Here is the official definition of `Parameters<T>` from `lib.d.ts`:

```typescript
type Parameters<T extends (...args: any[]) => any> =
  T extends (...args: infer P) => any ? P : never;
```

**Step-by-step breakdown:**
1. `infer P` is placed on the rest parameter `...args: infer P`.
2. TypeScript infers `P` as a tuple representing all argument types in order.
3. The tuple is returned.

---

### 5. Think first

What is the resulting type of `Args` if a function takes no arguments? Decide first.

```typescript
function reset() {}
type Args = Parameters<typeof reset>;
```

---

**Answer and Reason:**

The resulting type is:

```typescript
[]
```

**Reason**: An empty parameter list is represented as an empty tuple `[]`.

---

### 6. Try it yourself
Declare a function `updateSettings(config: { theme: string; volume: number })`. Extract the type of `config` using `Parameters<typeof updateSettings>[0]`. Create a variable with that type.

---

### 7. More examples

#### Example A: Forwarding Arguments to Another Function (Medium)

```typescript
function logEvent(name: string, timestamp: number) {
  console.log(name, timestamp);
}

function eventWrapper(...args: Parameters<typeof logEvent>) {
  console.log("Before event");
  logEvent(...args);
}
```

**Line-by-line explanation:**
- `...args: Parameters<typeof logEvent>`: Guarantees that `eventWrapper` accepts the exact same arguments as `logEvent`.

---

### 8. Common mistakes

#### Mistake 1: Indexing past the tuple length

**Wrong code:**
```typescript
function greet(name: string) {}
type Third = Parameters<typeof greet>[2]; // undefined
```

**Why it happens:**
`greet` only has 1 parameter (index 0). Index 2 does not exist.

---

### 9. Rules to remember
1. `Parameters<T>` extracts function arguments as a tuple type.
2. Index with `[0]`, `[1]`, etc. to get individual parameter types.
3. Works on standard functions, arrow functions, and method signatures.

---

### 10. Exercises

#### Question 1 (Predict the compile result)
What is the type of `Arg`?
```typescript
const fn = (x: number) => x * 2;
type Arg = Parameters<typeof fn>[0];
```

#### Question 2 (Find and fix the bug)
Fix the syntax error:
```typescript
function run(a: string) {}
type First = Parameters<run>[0];
```

#### Question 3 (Write code from scratch)
Write your own `MyParameters<T>` utility type from scratch using conditional types and `infer`.

#### Question 4 (Explain in your own words)
Why does `Parameters<T>` return a tuple rather than a union of parameter types?

---

### Solutions

#### Solution to Question 1
**Hint 1**: What is the type of parameter `x`?

**Answer**:
The type is `number`.

#### Solution to Question 2
**Hint 1**: Add `typeof` before `run`.

**Answer**:
```typescript
type First = Parameters<typeof run>[0];
```

#### Solution to Question 3
**Hint 1**: `T extends (...args: infer P) => any ? P : never`.

**Answer**:
```typescript
type MyParameters<T extends (...args: any[]) => any> =
  T extends (...args: infer P) => any ? P : never;
```

#### Solution to Question 4
**Hint 1**: Does the order of parameters matter when calling a function?

**Answer**:
Function arguments must be passed in a specific order with exact positions. A tuple preserves the order, position, and names of the parameters, whereas a union would lose all positional information.

---

### 11. Recall

1. What built-in utility type extracts a function's parameters?
2. What structure does `Parameters<T>` return?
3. How do you extract the second parameter of a function?

**If you remember only one thing:**
`Parameters<typeof fn>` extracts a function's parameters as a tuple, which you can index by position.

---

# Checkpoint Challenge: Topics 6 to 10

### Challenge Scenario
Build a type-safe higher-order function decorator:

1. Create a function `sendNotification(userId: string, message: string, priority: number): boolean`:
   - It prints the notification and returns `true`.
2. Extract its parameter tuple using `Parameters`.
3. Extract its return type using `ReturnType`.
4. Write a higher-order wrapper function `withLogging`:
   - It takes a function `fn: (...args: any[]) => any`.
   - It returns a new function that takes `...args: Parameters<typeof fn>` and returns `ReturnType<typeof fn>`.
   - Inside, it logs `"Function called"`, invokes `fn(...args)`, and returns the result.
5. Wrap `sendNotification` with `withLogging` and verify that the decorated function preserves all parameter types and return type.

### Challenge Solution

```typescript
function sendNotification(
  userId: string,
  message: string,
  priority: number
): boolean {
  console.log(`To ${userId}: ${message} (Priority: ${priority})`);
  return true;
}

type NotificationArgs = Parameters<typeof sendNotification>;
type NotificationReturn = ReturnType<typeof sendNotification>;

function withLogging<F extends (...args: any[]) => any>(fn: F) {
  return function (...args: Parameters<F>): ReturnType<F> {
    console.log("Function called with args:", args);
    const result = fn(...args);
    return result;
  };
}

const loggedSend = withLogging(sendNotification);
// Preserves full type safety:
const success = loggedSend("usr_1", "Welcome", 1);
```

---

# Topic 11: Unwrapping Promises and Asynchronous Types with `Awaited<T>` (TS 4.5)

### 1. What is it?
Introduced in TypeScript 4.5, `Awaited<T>` is a built-in utility type that models the unwrapping behavior of `await` in `async` functions or the `.then()` method on Promises.

It recursively unwraps nested Promises until it reaches the underlying non-Promise type.

### 2. Why does it exist?
In JavaScript, `await` automatically unwraps nested Promises: `await Promise.resolve(Promise.resolve(42))` resolves to the number `42`.

Before TypeScript 4.5, writing custom unwrappers for Promises was error-prone because developers often encountered nested Promises (`Promise<Promise<T>>`). `Awaited<T>` standardizes deep promise unwrapping directly in the compiler.

### 3. Basic example

```typescript
// 1. Single Promise unwrapping:
type T1 = Awaited<Promise<string>>; // string

// 2. Nested Promise unwrapping:
type T2 = Awaited<Promise<Promise<number>>>; // number

// 3. Non-Promise passthrough:
type T3 = Awaited<boolean>; // boolean
```

**Line-by-line explanation:**
- `Awaited<Promise<string>>`: Recursively strips `Promise`, returning `string`.
- `Awaited<Promise<Promise<number>>>`: Recursively unwrap both layers of Promises, returning `number`.
- `Awaited<boolean>`: If the type is not a Promise, it returns the type unchanged.

---

### 4. How it works inside TypeScript
1. **Thenable Check**: It checks if `T` has a `.then()` method (is a `PromiseLike`).
2. **Recursive Unwrapping**: If it is a Promise, it uses `infer` to extract the resolved value `V`, and recursively calls `Awaited<V>`.
3. **Termination**: When `V` is no longer a Promise, the recursive cycle stops and returns `V`.

---

### 5. Think first

What is the resulting type of `Result` in the code below? Decide first.

```typescript
async function fetchUser() {
  return { id: "1", name: "Alex" };
}

type Result = Awaited<ReturnType<typeof fetchUser>>;
```

---

**Answer and Reason:**

The resulting type is:

```typescript
{ id: string; name: string }
```

**Reason**: `ReturnType<typeof fetchUser>` returns `Promise<{ id: string; name: string }>`. `Awaited` unwraps the `Promise`, leaving only the clean object type.

---

### 6. Try it yourself
Create an async function `loadSettings()` that returns `{ theme: "dark" }`. Extract its unwrapped return type using `Awaited<ReturnType<typeof loadSettings>>`.

---

### 7. More examples

#### Example A: Unwrapping Union of Promises (Medium)

```typescript
type MixedPromises = Promise<string> | Promise<number>;
type Unwrapped = Awaited<MixedPromises>;
// Inferred as: string | number
```

**Line-by-line explanation:**
- `Awaited` distributes over unions of Promises, unwrapping each member.

---

### 8. Common mistakes

#### Mistake 1: Using `ReturnType` without `Awaited` on async functions

**Wrong code:**
```typescript
async function getData() { return 100; }
type Data = ReturnType<typeof getData>; // Promise<number>, not number!
```

**Correct code:**
```typescript
type Data = Awaited<ReturnType<typeof getData>>; // number
```

---

### 9. Rules to remember
1. `Awaited<T>` unwraps Promises recursively (even nested `Promise<Promise<T>>`).
2. If `T` is not a Promise, `Awaited<T>` returns `T` unchanged.
3. Use `Awaited<ReturnType<typeof asyncFn>>` to get the clean output of async functions.

---

### 10. Exercises

#### Question 1 (Predict the compile result)
What is the type of `Val`?
```typescript
type Val = Awaited<Promise<Promise<string[]>>>;
```

#### Question 2 (Find and fix the bug)
The type below is supposed to be `number`, but is currently `Promise<number>`. Fix it:
```typescript
async function getScore() { return 95; }
type Score = ReturnType<typeof getScore>;
```

#### Question 3 (Write code from scratch)
Write a generic function signature `unwrapPromise<T>(p: T): Promise<Awaited<T>>`.

#### Question 4 (Explain in your own words)
Why is `Awaited<T>` recursive rather than only unwrapping a single layer?

---

### Solutions

#### Solution to Question 1
**Hint 1**: Unwrap all layers of Promises.

**Answer**:
The type is `string[]`.

#### Solution to Question 2
**Hint 1**: Wrap `ReturnType` inside `Awaited<...>`.

**Answer**:
```typescript
type Score = Awaited<ReturnType<typeof getScore>>;
```

#### Solution to Question 3
**Hint 1**: Return `Promise<Awaited<T>>`.

**Answer**:
```typescript
function unwrapPromise<T>(p: T): Promise<Awaited<T>> {
  return Promise.resolve(p) as Promise<Awaited<T>>;
}
```

#### Solution to Question 4
**Hint 1**: Think about how JavaScript runtime `await` behaves on nested promises.

**Answer**:
In JavaScript runtime, `await` unwraps nested promises recursively until a non-promise value is reached. `Awaited<T>` mirrors runtime JavaScript behavior in the type system.

---

### 11. Recall

1. What built-in utility type unwraps Promises?
2. What does `Awaited<number>` return?
3. Which TypeScript version introduced `Awaited`?

**If you remember only one thing:**
Use `Awaited<ReturnType<typeof asyncFn>>` to extract the resolved value of async functions.

---

# Topic 12: Extracting Array Element Types with `infer`

### 1. What is it?
You can use `infer` inside a conditional type to extract the element type from an array or tuple:
```typescript
type ElementOf<T> = T extends (infer E)[] ? E : never;
```

### 2. Why does it exist?
When a function takes an array of items (like a list of users, numbers, or records), you frequently need a type representing a single item from that array.

Instead of writing a separate type for the array and the item, you can derive the item type directly from the array type using conditional type inference.

### 3. Basic example

```typescript
type ElementOf<T> = T extends (infer E)[] ? E : never;

type StringArray = string[];
type SingleString = ElementOf<StringArray>; // string

type NumberTuple = [number, boolean];
type TupleUnion = ElementOf<NumberTuple>; // number | boolean
```

**Line-by-line explanation:**
- `type ElementOf<T> = T extends (infer E)[] ? E : never;`: Checks if `T` is an array. If so, it infers the element type `E`.
- `ElementOf<string[]>`: Matches `string[]`. `E` is inferred as `string`.
- `ElementOf<[number, boolean]>`: A tuple is an array with known positions. Inferring `(infer E)[]` on `[number, boolean]` unions all element types into `number | boolean`.

---

### 4. How it works inside TypeScript
1. **Array Matching**: TypeScript matches `T` against `(infer E)[]`.
2. **Tuple Unioning**: When matching a tuple with multiple different types, TypeScript unions the candidate types into `infer E`.
3. **Alternative Lookup**: You can also extract array elements using index lookup: `T[number]`.

---

### 5. Think first

What is the difference between `T[number]` and `T extends (infer E)[] ? E : never`? Decide first.

```typescript
type A<T> = T extends (infer E)[] ? E : never;
type B<T extends readonly any[]> = T[number];
```

---

**Answer and Reason:**

- `B<T>` requires `T` to be constrained to an array beforehand (`T extends readonly any[]`).
- `A<T>` works on **any** input type. If you pass a non-array (like `string`), `A<string>` safely returns `never`, while `string[number]` would be a compiler error.

---

### 6. Try it yourself
Create an array `const ROLES = ["admin", "editor", "viewer"] as const;`. Extract the union of roles using `(typeof ROLES)[number]`.

---

### 7. More examples

#### Example A: Extracting from Readonly Arrays (Medium)

```typescript
type ElementOfAny<T> = T extends readonly (infer E)[] ? E : never;

const items = [1, 2, 3] as const;
type Item = ElementOfAny<typeof items>; // 1 | 2 | 3
```

**Line-by-line explanation:**
- Adding `readonly` ensures it works on both mutable arrays and `as const` tuples.

---

### 8. Common mistakes

#### Mistake 1: Forgetting `readonly` when matching `as const` arrays

**Wrong code:**
```typescript
type ElementOf<T> = T extends (infer E)[] ? E : never;
const list = ["a", "b"] as const; // readonly ["a", "b"]
type R = ElementOf<typeof list>; // Evaluates to never!
```

**Why it happens:**
`as const` produces a `readonly` array. A `readonly` array cannot extend a mutable array `(infer E)[]`.

**Correct code:**
```typescript
type ElementOf<T> = T extends readonly (infer E)[] ? E : never;
```

---

### 9. Rules to remember
1. `T extends readonly (infer E)[] ? E : never` extracts the element type from any array.
2. `readonly` allows matching both mutable arrays and `as const` tuples.
3. Indexing with `T[number]` is an alternative when `T` is already known to be an array.

---

### 10. Exercises

#### Question 1 (Predict the compile result)
What is the resulting type of `Item`?
```typescript
type ElementType<T> = T extends readonly (infer E)[] ? E : never;
type Item = ElementType<boolean[]>;
```

#### Question 2 (Find and fix the bug)
Fix `GetElement` so it works with `as const` arrays:
```typescript
type GetElement<T> = T extends (infer E)[] ? E : never;
const flags = [true, false] as const;
type FlagType = GetElement<typeof flags>;
```

#### Question 3 (Write code from scratch)
Write a generic function `getFirstItem<T extends readonly any[]>(arr: T): T[0]` that returns the first element of a tuple.

#### Question 4 (Explain in your own words)
Why does a mutable array pattern `(infer E)[]` fail to match an `as const` tuple?

---

### Solutions

#### Solution to Question 1
**Hint 1**: What is the element type of `boolean[]`?

**Answer**:
The type is `boolean`.

#### Solution to Question 2
**Hint 1**: Add `readonly` before `(infer E)[]`.

**Answer**:
```typescript
type GetElement<T> = T extends readonly (infer E)[] ? E : never;
```

#### Solution to Question 3
**Hint 1**: Return `arr[0]`.

**Answer**:
```typescript
function getFirstItem<T extends readonly any[]>(arr: T): T[0] {
  return arr[0];
}
```

#### Solution to Question 4
**Hint 1**: Can a readonly array be passed where a mutable array is required?

**Answer**:
A readonly array cannot be assigned to a mutable array because mutable arrays allow operations like `.push()` and property reassignment. Therefore, a readonly tuple does not satisfy `(infer E)[]` unless the pattern explicitly includes `readonly`.

---

### 11. Recall

1. What syntax extracts an array element using `infer`?
2. What modifier must you include to match `as const` tuples?
3. What is the alternative syntax using index access?

**If you remember only one thing:**
Use `T extends readonly (infer E)[] ? E : never` to extract element types from any array or tuple.

---

# Topic 13: Recursive Conditional Types (JSON Values, Deep Flattening)

### 1. What is it?
Introduced in TypeScript 4.1, a **Recursive Conditional Type** is a conditional type that references itself in its own definition.

It allows you to perform recursive computations at compile time, such as deeply unwrapping arrays, building JSON types, or flattening nested data structures.

### 2. Why does it exist?
Real-world data structures are often recursive:
- A JSON value can be a primitive, an array of JSON values, or an object containing JSON values.
- A nested array might be arbitrarily deep: `number[][][]`.

Before TypeScript 4.1, circular type aliases were forbidden. Recursive conditional types make modeling arbitrarily deep data structures possible.

### 3. Basic example

```typescript
// Deeply unwrap arrays of any depth:
type DeepFlatten<T> = T extends (infer Element)[] ? DeepFlatten<Element> : T;

type Level1 = DeepFlatten<number[]>;       // number
type Level2 = DeepFlatten<number[][]>;     // number
type Level3 = DeepFlatten<number[][][]>;   // number
type NonArr = DeepFlatten<string>;         // string
```

**Line-by-line explanation:**
- `type DeepFlatten<T> = T extends (infer Element)[] ? DeepFlatten<Element> : T;`:
  - If `T` is an array, extract its `Element` and call `DeepFlatten<Element>` again.
  - If `T` is no longer an array, return `T` (the base case).
- `DeepFlatten<number[][][]>`: Recursively unwraps three times until `number` is reached, then terminates.

---

### 4. How it works inside TypeScript
1. **Self-Reference**: The compiler allows a conditional type to reference itself in either branch.
2. **Recursion Limit**: To prevent the compiler from freezing in infinite loops, TypeScript enforces a maximum recursion depth limit.
3. **Tail-Call Optimization**: When the recursive call is in tail position, TypeScript optimizes the stack to support deeper recursion.

---

### 5. Think first

What happens if you define a recursive conditional type without a base case? Decide first.

```typescript
type Infinite<T> = Infinite<T>;
```

---

**Answer and Reason:**

This code fails to compile:

```
Type instantiation is excessively deep and possibly infinite.
```

**Reason**: Every recursive type must have a terminating base case (a condition where it stops calling itself). Without a base case, TypeScript stops with a recursion limit error.

---

### 6. Try it yourself
Create a recursive type `JsonValue`:
- Can be `string | number | boolean | null`
- Or `JsonValue[]`
- Or `{ [key: string]: JsonValue }`
Create a variable with that type holding a nested JSON object.

---

### 7. More examples

#### Example A: Modeling Valid JSON Data (Medium)

```typescript
type JsonPrimitive = string | number | boolean | null;
type JsonArray = JsonValue[];
type JsonObject = { [key: string]: JsonValue };

type JsonValue = JsonPrimitive | JsonArray | JsonObject;

const config: JsonValue = {
  version: 1,
  enabled: true,
  servers: ["auth", "database"],
  metadata: {
    region: "us-east",
  },
};
```

**Line-by-line explanation:**
- `JsonValue` is self-referential: `JsonObject` holds `JsonValue`, which can contain another `JsonObject`.

---

### 8. Common mistakes

#### Mistake 1: Exceeding TypeScript's recursion stack depth

**Wrong code:**
Creating an infinite recursion that fails to stop.

**Why it happens:**
Always ensure the recursive step operates on a smaller, unwrapped subset of the type so it terminates.

---

### 9. Rules to remember
1. Recursive conditional types reference themselves in their branches.
2. Every recursive type must have a base case that stops recursion.
3. TypeScript enforces a maximum recursion depth to protect compile performance.

---

### 10. Exercises

#### Question 1 (Predict the compile result)
What is the resulting type of `Result`?
```typescript
type Unroll<T> = T extends Promise<infer Next> ? Unroll<Next> : T;
type Result = Unroll<Promise<Promise<Promise<boolean>>>>;
```

#### Question 2 (Find and fix the bug)
The recursive type below has no terminating base case. Fix it:
```typescript
type Loop<T> = Loop<T[]>;
```

#### Question 3 (Write code from scratch)
Write a recursive type `DeepElement<T>` that extracts the element of nested arrays, or returns `T` if it is not an array.

#### Question 4 (Explain in your own words)
Why is a base case required in a recursive conditional type?

---

### Solutions

#### Solution to Question 1
**Hint 1**: Recursively unwrap all three Promises.

**Answer**:
The resulting type is `boolean`.

#### Solution to Question 2
**Hint 1**: Add a conditional check to stop recursion.

**Answer**:
```typescript
type Loop<T> = T extends (infer E)[] ? Loop<E> : T;
```

#### Solution to Question 3
**Hint 1**: `T extends readonly (infer E)[] ? DeepElement<E> : T`.

**Answer**:
```typescript
type DeepElement<T> = T extends readonly (infer E)[] ? DeepElement<E> : T;
```

#### Solution to Question 4
**Hint 1**: What happens if a function calls itself forever?

**Answer**:
Without a base case, the compiler would evaluate recursive calls endlessly, exhausting memory and crashing the compiler process. A base case provides a stopping condition that terminates recursion and returns a concrete type.

---

### 11. Recall

1. What is a recursive conditional type?
2. What error occurs if a recursive type runs forever?
3. Which TypeScript version added official support for recursive conditional types?

**If you remember only one thing:**
Recursive conditional types call themselves to process deeply nested structures until a base case is reached.

---

# Topic 14: Covariant vs Contravariant Inference (`UnionToIntersection`)

### 1. What is it?
When you use `infer` on multiple positions:
- Multiple inferences in **covariant positions** (return types) create a **union** (`A | B`).
- Multiple inferences in **contravariant positions** (function parameters) create an **intersection** (`A & B`).

This fundamental property enables one of the most famous advanced TypeScript utilities: `UnionToIntersection<U>`.

### 2. Why does it exist?
Sometimes you have a union of object types:
```typescript
type Union = { a: string } | { b: number }
```
And you need to merge them into a single intersecting object:
```typescript
{ a: string } & { b: number }
```
Because function parameters are contravariant, inferring the parameter type from a distributed union of function consumers forces TypeScript to combine them into an intersection!

### 3. Basic example

```typescript
// 1. Multiple inferences in Covariant position -> Union:
type Covariant<T> = T extends { a: infer U; b: infer U } ? U : never;
type R1 = Covariant<{ a: string; b: number }>; // string | number

// 2. Multiple inferences in Contravariant position -> Intersection:
type Contravariant<T> = T extends {
  f1: (x: infer U) => void;
  f2: (x: infer U) => void;
} ? U : never;
type R2 = Contravariant<{
  f1: (x: { name: string }) => void;
  f2: (x: { age: number }) => void;
}>;
// Inferred as: { name: string } & { age: number }
```

**Line-by-line explanation:**
- `Covariant<T>`: `U` is in output/property positions. When multiple candidates exist (`string` and `number`), TypeScript unions them into `string | number`.
- `Contravariant<T>`: `U` is in function parameter positions (input). To satisfy both functions, `U` must satisfy both inputs, so TypeScript intersects them into `{ name: string } & { age: number }`.

---

### 4. How it works inside TypeScript
Building the complete `UnionToIntersection<U>` utility:

```typescript
type UnionToIntersection<U> =
  (U extends any ? (k: U) => void : never) extends (k: infer I) => void
    ? I
    : never;

type Merged = UnionToIntersection<{ a: 1 } | { b: 2 }>;
// Inferred as: { a: 1 } & { b: 2 }
```

**Step-by-step breakdown:**
1. `(U extends any ? (k: U) => void : never)`: Distributes over each union member and places it into a contravariant function parameter position.
   - Becomes: `((k: { a: 1 }) => void) | ((k: { b: 2 }) => void)`.
2. `extends (k: infer I) => void`: The compiler infers `I` from the union of function signatures.
3. Because function parameters are contravariant, TypeScript intersects the candidates:
   - `I` resolves to `{ a: 1 } & { b: 2 }`.

---

### 5. Think first

What happens when multiple candidates for `infer R` exist in return types? Does it create a union or an intersection? Decide first.

```typescript
type Test<T> = T extends () => infer R ? R : never;
```

---

**Answer and Reason:**

It creates a **union**.

**Reason**: Return types are in covariant (output) positions. Candidate types in covariant positions combine as a union (`A | B`).

---

### 6. Try it yourself
Use the `UnionToIntersection` utility defined above on `{ id: string } | { createdAt: number } | { active: boolean }`. Verify that the result has all three properties.

---

### 7. More examples

#### Example A: Merging Function Signatures into Overloads (Medium)

```typescript
type Fn1 = (x: string) => void;
type Fn2 = (x: number) => void;

type CombinedFn = UnionToIntersection<Fn1 | Fn2>;
// Produces an overloaded function that accepts string AND number!
```

---

### 8. Common mistakes

#### Mistake 1: Expecting primitive intersections to remain primitives

**Wrong code:**
```typescript
type Clashing = UnionToIntersection<string | number>;
// Resolves to: string & number -> never!
```

**Why it happens:**
Intersecting incompatible primitive types (`string & number`) produces `never`.

---

### 9. Rules to remember
1. Inferences in covariant positions produce unions (`|`).
2. Inferences in contravariant positions produce intersections (`&`).
3. `UnionToIntersection` leverages contravariance on function parameters.

---

### 10. Exercises

#### Question 1 (Predict the compile result)
What is the resulting type of `Merged`?
```typescript
type U = { name: string } | { age: number };
type Merged = UnionToIntersection<U>;
```

#### Question 2 (Find and fix the bug)
Explain why `UnionToIntersection<"a" | "b">` resolves to `never`:

#### Question 3 (Write code from scratch)
Write out the `UnionToIntersection<U>` definition from memory and test it.

#### Question 4 (Explain in your own words)
Why does inferring from function parameters create an intersection instead of a union?

---

### Solutions

#### Solution to Question 1
**Hint 1**: Intersect both object types.

**Answer**:
The resulting type is `{ name: string } & { age: number }`.

#### Solution to Question 2
**Hint 1**: Can a value be `"a"` and `"b"` simultaneously?

**Answer**:
`"a" & "b"` is an intersection of incompatible string literals. No value can be both `"a"` and `"b"`, so it resolves to `never`.

#### Solution to Question 3
**Hint 1**: Distribute into `(k: U) => void`, then infer `I`.

**Answer**:
```typescript
type UnionToIntersection<U> =
  (U extends any ? (k: U) => void : never) extends (k: infer I) => void
    ? I
    : never;
```

#### Solution to Question 4
**Hint 1**: What type must a parameter be to be accepted by all handler functions?

**Answer**:
In contravariant parameter positions, a single type must be able to satisfy every function variant. To be compatible with all variants, the argument must satisfy all requirements simultaneously, which requires an intersection.

---

### 11. Recall

1. What do multiple inferences in covariant positions produce?
2. What do multiple inferences in contravariant positions produce?
3. What utility type turns `{ a: string } | { b: number }` into `{ a: string } & { b: number }`?

**If you remember only one thing:**
Contravariant inference in function parameters turns unions into intersections.

---

# Final Checkpoint Challenge: Topics 11 to 14

### Challenge Scenario
Build an asynchronous event pipeline type system:

1. Define an async handler type:
   ```typescript
   type UserHandler = () => Promise<{ userId: string }>;
   type OrderHandler = () => Promise<{ orderId: string }>;
   ```
2. Using `ReturnType` and `Awaited`, extract the clean data models from both handlers.
3. Using `UnionToIntersection`, merge `{ userId: string } | { orderId: string }` into a single combined payload.
4. Write a recursive conditional type `DeepReadonly<T>`:
   - If `T` is a primitive or function, return `T`.
   - If `T` is an array `(infer E)[]`, return `readonly DeepReadonly<E>[]`.
   - If `T` is an object, return `{ readonly [K in keyof T]: DeepReadonly<T[K]> }`.
5. Apply `DeepReadonly` to the merged payload.

### Challenge Solution

```typescript
type UserHandler = () => Promise<{ userId: string }>;
type OrderHandler = () => Promise<{ orderId: string }>;

// 2. Extract unwrapped return types:
type UserPayload = Awaited<ReturnType<UserHandler>>;
type OrderPayload = Awaited<ReturnType<OrderHandler>>;

// 3. Union to Intersection:
type UnionToIntersection<U> =
  (U extends any ? (k: U) => void : never) extends (k: infer I) => void
    ? I
    : never;

type CombinedPayload = UnionToIntersection<UserPayload | OrderPayload>;
// Inferred as: { userId: string } & { orderId: string }

// 4. Recursive DeepReadonly:
type DeepReadonly<T> =
  T extends (...args: any[]) => any ? T :
  T extends readonly (infer E)[] ? readonly DeepReadonly<E>[] :
  T extends object ? { readonly [K in keyof T]: DeepReadonly<T[K]> } :
  T;

// 5. Applied:
type FinalConfig = DeepReadonly<CombinedPayload>;

const config: FinalConfig = {
  userId: "usr_100",
  orderId: "ord_500",
};
```
