# Module TS-01: Type Architecture, Set Theory & Structural Subtyping

Welcome to TypeScript Type Architecture and Structural Subtyping. This module teaches how TypeScript views types, how it checks your code, and how its type system works from the ground up.

---

# Topic 1: What TypeScript Is and Static Type Checking

### 1. What is it?
TypeScript is a programming language that builds on top of JavaScript. It adds a layer called a type system to check your code before it runs. Once the checks pass, TypeScript removes all type information and produces regular JavaScript.

A type is a label that tells the compiler what kind of value a variable is allowed to hold (such as a string, a number, or a boolean).

### 2. Why does it exist?
JavaScript is dynamically typed. This means JavaScript does not check types until the code actually runs in the browser or on the server. If you make a typo in a property name or pass the wrong type to a function, JavaScript does not stop you ahead of time. The program fails at runtime while the user is using it.

TypeScript exists to catch these errors during development, before the code ever runs.

### 3. Basic example

```typescript
function printUserName(user: { name: string }) {
  console.log(user.name);
}

const user = { name: "Alex" };
printUserName(user);
```

**Line-by-line explanation:**
- `function printUserName(user: { name: string }) {`: Declares a function named `printUserName`. The parameter `user` has a type annotation `{ name: string }`. This tells TypeScript that `user` must be an object with a property named `name` whose value is a string.
- `console.log(user.name);`: Reads the `name` property on the `user` object and prints it. Because TypeScript verified that `name` exists on `user`, this line is guaranteed not to fail due to a missing property.
- `}`: Closes the function body.
- `const user = { name: "Alex" };`: Declares a constant named `user` and assigns an object with a `name` property of type string.
- `printUserName(user);`: Calls `printUserName` and passes `user`. TypeScript checks that `{ name: "Alex" }` matches `{ name: string }`. The types match, so compilation succeeds.

---

### 4. How it works inside TypeScript
When you compile TypeScript code, the compiler follows these steps:

1. **Parsing**: The compiler reads the source text and turns it into a tree structure representing the code structure.
2. **Type Checking**: The type checker inspects every variable, function, and expression. It checks if values assigned to variables match their declared types.
3. **Diagnostics Report**: If any value violates a type rule, the compiler stops and prints an error message pointing to the exact file and line number.
4. **Type Erasure**: If there are no errors (or if the compiler is configured to emit regardless), the compiler strips away all type annotations, interfaces, and type aliases.
5. **Code Emission**: The compiler writes clean, standard JavaScript files containing only the runtime code.

---

### 5. Think first

What do you think happens when this code is checked by TypeScript? Will it compile, or will it report an error? Decide first.

```typescript
function getLength(text: string) {
  return text.length;
}

getLength(42);
```

---

**Answer and Reason:**

This code fails at compile time with an error:

```
Argument of type 'number' is not assignable to parameter of type 'string'.
```

**Reason**: The function `getLength` specifies that the parameter `text` must be of type `string`. When you call `getLength(42)`, the argument `42` is a number. TypeScript detects this mismatch before running the code and rejects the call.

---

### 6. Try it yourself
Write a function named `calculateTotal` that takes two parameters: `price` (a number) and `tax` (a number). Annotate both parameters. Return the sum of `price` and `tax`. Then call the function with valid numbers and print the result.

---

### 7. More examples

#### Example A: Type Inference (Easy)
You do not always have to write types manually. TypeScript can infer them from values.

```typescript
let count = 10;
count = 20;
```

**Line-by-line explanation:**
- `let count = 10;`: Declares a variable named `count` initialized to the number `10`. TypeScript automatically assigns the type `number` to `count`. This is called type inference.
- `count = 20;`: Reassigns `count` to the number `20`. This is valid because `20` matches the inferred type `number`.

#### Example B: Catching Invalid Reassignment (Medium)

```typescript
let message = "hello";
message = 100;
```

**Line-by-line explanation:**
- `let message = "hello";`: TypeScript infers the type of `message` as `string`.
- `message = 100;`: TypeScript rejects this line with: `Type 'number' is not assignable to type 'string'`. Even though we did not write `: string`, TypeScript protects the variable from holding other types.

#### Example C: Object Property Safety (Harder)

```typescript
const settings = {
  theme: "dark",
  fontSize: 14,
};

console.log(settings.theme);
console.log(settings.volume);
```

**Line-by-line explanation:**
- `const settings = { ... };`: Creates an object with two known properties: `theme` (type `string`) and `fontSize` (type `number`).
- `console.log(settings.theme);`: Allowed because `theme` exists on `settings`.
- `console.log(settings.volume);`: TypeScript flags an error: `Property 'volume' does not exist on type '{ theme: string; fontSize: number; }'`. In regular JavaScript, this would silently return `undefined` and cause bugs downstream. TypeScript stops it immediately.

---

### 8. Common mistakes

#### Mistake 1: Assuming TypeScript types exist at runtime

**Wrong code:**
```typescript
function checkValue(val: unknown) {
  if (val instanceof { name: string }) {
    console.log("Valid user");
  }
}
```

**Error output:**
```
'{}' only refers to a type, but is being used as a value here.
```

**Why it happens:**
Types exist only during compilation. At runtime, JavaScript executes without any types. You cannot use a TypeScript type in a runtime expression like `instanceof`.

**Correct code:**
```typescript
function checkValue(val: unknown) {
  if (typeof val === "object" && val !== null && "name" in val) {
    console.log("Valid user");
  }
}
```

---

#### Mistake 2: Missing function parameter annotations

**Wrong code:**
```typescript
function multiply(a, b) {
  return a * b;
}
```

**Error output (with `noImplicitAny: true`):**
```
Parameter 'a' implicitly has an 'any' type.
Parameter 'b' implicitly has an 'any' type.
```

**Why it happens:**
When you do not provide a type for function parameters, TypeScript cannot be sure what type you intended, so it falls back to `any`. The `any` type disables type checking on that parameter.

**Correct code:**
```typescript
function multiply(a: number, b: number): number {
  return a * b;
}
```

---

### 9. Rules to remember
1. TypeScript checks types at compile time; it does not check types at runtime.
2. All TypeScript types, interfaces, and annotations are completely erased when compiled to JavaScript.
3. If you do not write a type, TypeScript infers one from the initial value whenever possible.
4. Accessing properties that do not exist on an object causes a compile-time error.

---

### 10. Exercises

#### Question 1 (Predict the compile result)
Will the following code compile without errors? Explain why or why not.

```typescript
const point = { x: 10, y: 20 };
point.x = 30;
point.z = 40;
```

#### Question 2 (Find and fix the bug)
The following function should accept a user object and return their greeting, but it fails to compile. Identify the bug and fix it.

```typescript
function greet(user: { name: string; age: number }) {
  return "Hello, " + user.name + ", age " + user.age;
}

greet({ name: "Alex" });
```

#### Question 3 (Write code from scratch)
Declare a type annotation for a variable named `config`. The variable must hold an object with:
- a string property named `title`
- a boolean property named `isActive`
- a number property named `version`

Assign a valid object to `config`.

#### Question 4 (Explain in your own words)
What is "type erasure" in TypeScript? Why does it mean you cannot inspect TypeScript types in the browser console?

---

### Solutions

#### Solution to Question 1
**Hint 1**: Look at the properties declared on `point` initially.
**Hint 2**: Check whether `z` was defined when `point` was created.

**Answer**:
No, it will not compile. It fails on `point.z = 40;` with the error: `Property 'z' does not exist on type '{ x: number; y: number; }'`. TypeScript inferred `point` as having only `x` and `y`. You cannot add new, unmodeled properties to it.

#### Solution to Question 2
**Hint 1**: Look at the parameters required by the `greet` type signature.
**Hint 2**: Check what arguments are provided in the function call.

**Answer**:
The call `greet({ name: "Alex" })` is missing the required property `age`.

Correct code:
```typescript
greet({ name: "Alex", age: 25 });
```

#### Solution to Question 3
**Hint 1**: Use `{ propName: type }` syntax.
**Hint 2**: Ensure all three properties are included in the object assigned to `config`.

**Answer**:
```typescript
const config: { title: string; isActive: boolean; version: number } = {
  title: "Dashboard",
  isActive: true,
  version: 1,
};
```

#### Solution to Question 4
**Hint 1**: Consider what happens when TypeScript code is compiled into `.js` files.
**Hint 2**: Think about what JavaScript engines actually execute.

**Answer**:
Type erasure is the process where the TypeScript compiler strips away all type annotations, interfaces, and type aliases, leaving only plain JavaScript. Because no type information is saved into the generated `.js` files, the browser runtime only sees plain JavaScript values and cannot read TypeScript types.

---

### 11. Recall

1. What phase of development does TypeScript catch errors in?
2. What happens to TypeScript types after the code is compiled?
3. What error does TypeScript produce if you access a property that does not exist on an object?

**If you remember only one thing:**
TypeScript checks types before your code runs, and removes all types when generating JavaScript.

---

# Topic 2: Types as Sets of Values

### 1. What is it?
In TypeScript, a type is a set of permissible values. For example, the type `number` is the set of all possible numbers. The literal type `"admin"` is a set containing only the single value `"admin"`.

When we say a variable has a type, we mean the variable is only allowed to hold values that belong to that set.

### 2. Why does it exist?
Thinking of types as sets makes the rules of TypeScript consistent and predictable.

It explains why a specific value like `"admin"` can be passed to a function expecting `string`: because `"admin"` is inside the set of all strings. When one set is completely inside another set, it is called a subtype (`A extends B`).

### 3. Basic example

```typescript
type Direction = "north" | "south" | "east" | "west";

let move: Direction = "north";
let rawText: string = move;
```

**Line-by-line explanation:**
- `type Direction = "north" | "south" | "east" | "west";`: Defines a type named `Direction`. It is a set containing exactly four string values.
- `let move: Direction = "north";`: Creates a variable `move` restricted to the `Direction` set, initialized to `"north"`.
- `let rawText: string = move;`: Assigns `move` to a variable of type `string`. This compiles because every value in `Direction` is also a valid `string`. The set `Direction` is a subset of `string`.

---

### 4. How it works inside TypeScript
When TypeScript checks if type `A` can be assigned to type `B` (written `A extends B`):

1. **Member Evaluation**: The compiler examines all values represented by type `A`.
2. **Subset Verification**: The compiler checks if every possible value in `A` is allowed in type `B`.
3. **Assignment Decision**:
   - If every value in `A` belongs to `B`, then `A` is a subtype of `B`. The assignment is accepted.
   - If even one value in `A` is not in `B`, TypeScript rejects the assignment with an error: `Type 'A' is not assignable to type 'B'`.

---

### 5. Think first

What do you think happens when we try to assign `rawText` back to `move`? Decide first.

```typescript
type Direction = "north" | "south" | "east" | "west";

let rawText: string = "hello";
let move: Direction = rawText;
```

---

**Answer and Reason:**

This code fails to compile:

```
Type 'string' is not assignable to type 'Direction'.
```

**Reason**: `string` is the set of all possible strings (infinite values like `"hello"`, `"banana"`, `"123"`). `Direction` contains only 4 specific strings. Since not every `string` is inside `Direction`, `string` is not a subset of `Direction`.

---

### 6. Try it yourself
Create a type alias named `Status` that allows only the strings `"active"`, `"inactive"`, and `"pending"`. Declare a variable `userStatus` with that type, assign `"active"` to it, and then test assigning `"deleted"` to see the compiler error.

---

### 7. More examples

#### Example A: Literal Types as Single-Element Sets (Easy)

```typescript
type ExactlyFive = 5;

let a: ExactlyFive = 5;
let b: number = a;
```

**Line-by-line explanation:**
- `type ExactlyFive = 5;`: Creates a literal type containing only the number `5`.
- `let a: ExactlyFive = 5;`: Assigns `5` to `a`.
- `let b: number = a;`: Allowed because `5` is a member of the set `number`.

#### Example B: Boolean as a Two-Element Set (Medium)

```typescript
type CustomBool = true | false;
let flag: CustomBool = true;
let regularBool: boolean = flag;
```

**Line-by-line explanation:**
- `type CustomBool = true | false;`: Declares a set with elements `true` and `false`.
- In TypeScript, the built-in `boolean` type is defined exactly as the union `true | false`.

#### Example C: Object Types as Sets of Requirements (Harder)

```typescript
type Person = { name: string };
type Employee = { name: string; role: string };

let emp: Employee = { name: "Jordan", role: "Engineer" };
let per: Person = emp;
```

**Line-by-line explanation:**
- `type Person = { name: string };`: The set of all objects that have at least a `name` property of type string.
- `type Employee = { name: string; role: string };`: The set of objects that have both a `name` and a `role`.
- `let per: Person = emp;`: Compiles without error. `Employee` has more properties, which means it satisfies all requirements of `Person`. Therefore, `Employee` is a subset of `Person`.

---

### 8. Common mistakes

#### Mistake 1: Confusing property count with set size

**Wrong assumption:**
Thinking that an object type with 3 properties is a "larger set" than an object type with 1 property.

**Why it is wrong:**
Every added requirement restricts the number of conforming values.
- `{ name: string }` matches millions of potential objects.
- `{ name: string; role: string; salary: number }` matches far fewer objects.
More properties = more restrictions = a smaller subset.

---

### 9. Rules to remember
1. In TypeScript, every type represents a set of values.
2. A subtype is a subset of values.
3. `A extends B` means every value in set `A` is also in set `B`.
4. You can always assign a smaller, more specific set to a larger, general set. You cannot assign a large general set to a smaller specific set.

---

### 10. Exercises

#### Question 1 (Predict the compile result)
Will the following code compile? Explain why.

```typescript
type Action = "start" | "stop";
let currentAction: Action = "start";
let text: string = currentAction;
let nextAction: Action = text;
```

#### Question 2 (Find and fix the bug)
The code below has an assignment error on line 4. Fix it using a type check or a valid literal.

```typescript
type Priority = "high" | "low";
let val: string = "high";
let level: Priority = val;
```

#### Question 3 (Write code from scratch)
Define a type `PositiveSmallNumber` that allows only the numbers `1`, `2`, and `3`. Declare a function `logNumber(n: number)` and call it using a variable of type `PositiveSmallNumber`.

#### Question 4 (Explain in your own words)
Why does an object type with more properties form a smaller subset of values than an object type with fewer properties?

---

### Solutions

#### Solution to Question 1
**Hint 1**: Trace line 4: what is the type of `text`?
**Hint 2**: Can any `string` be put into `Action`?

**Answer**:
Lines 1, 2, and 3 compile, but line 4 fails. `text` is of type `string`, which contains infinite possible strings. `Action` only accepts `"start"` or `"stop"`. A general `string` cannot be assigned to `Action`.

#### Solution to Question 2
**Hint 1**: Type `Priority` only allows `"high"` or `"low"`.
**Hint 2**: Change `val` to have type `Priority` or type `"high"`.

**Answer**:
```typescript
type Priority = "high" | "low";
let val: Priority = "high";
let level: Priority = val;
```

#### Solution to Question 3
**Hint 1**: Use union syntax `1 | 2 | 3`.
**Hint 2**: Pass a variable of that type to `logNumber`.

**Answer**:
```typescript
type PositiveSmallNumber = 1 | 2 | 3;
function logNumber(n: number) {
  console.log(n);
}

const num: PositiveSmallNumber = 2;
logNumber(num);
```

#### Solution to Question 4
**Hint 1**: Think of each property as a rule an object must satisfy.
**Hint 2**: Do more rules make it easier or harder for an object to qualify?

**Answer**:
Each property in an object type is an additional requirement. An object with fewer properties requires fewer constraints, so more objects satisfy it. An object with more properties requires more constraints, so fewer objects qualify. Therefore, adding properties shrinks the set of conforming objects.

---

### 11. Recall

1. What does the term "subtype" mean in terms of sets?
2. What does `A extends B` check?
3. Can a value of type `string` be assigned to `"admin"` without narrowing?

**If you remember only one thing:**
Types are sets of values, and subtyping means one set is a subset of another.

---

# Topic 3: Union Types (`|`) and Intersection Types (`&`)

### 1. What is it?
A union type (`A | B`) represents values that belong to set `A` OR set `B` (or both). It combines multiple types into one.

An intersection type (`A & B`) represents values that satisfy all requirements of set `A` AND set `B` at the same time.

### 2. Why does it exist?
In real code, a variable often needs to accept more than one type. For example, an ID might be either a number or a string. A union type (`string | number`) allows you to express this accurately.

At the same time, we often compose configurations by combining separate objects. An intersection type allows you to merge multiple type requirements into a single combined type.

### 3. Basic example

```typescript
// Union: value can be string OR number
let id: string | number;
id = 101;
id = "usr_101";

// Intersection: object must have name AND age
type Named = { name: string };
type Aged = { age: number };
type UserProfile = Named & Aged;

const user: UserProfile = {
  name: "Morgan",
  age: 30,
};
```

**Line-by-line explanation:**
- `let id: string | number;`: Declares a variable `id` that can hold either a `string` or a `number`.
- `id = 101;`: Assigns a number. Allowed by the union.
- `id = "usr_101";`: Assigns a string. Allowed by the union.
- `type Named = { name: string };`: Defines an object type requiring `name`.
- `type Aged = { age: number };`: Defines an object type requiring `age`.
- `type UserProfile = Named & Aged;`: Defines an intersection. Any object of type `UserProfile` must satisfy both `Named` and `Aged`.
- `const user: UserProfile = { name: "Morgan", age: 30 };`: An object providing both properties. If either property were missing, TypeScript would reject it.

---

### 4. How it works inside TypeScript
1. **Union Member Access**: When reading properties on a union (`A | B`), TypeScript only allows accessing properties that are present in **both** `A` and `B`. This prevents runtime errors where a property exists on `A` but not on `B`.
2. **Intersection Property Merging**: When creating an intersection of object types (`A & B`), TypeScript combines all property requirements. The resulting type must contain all properties from `A` plus all properties from `B`.
3. **Primitive Intersection**: If you intersect incompatible primitive types (such as `string & number`), no value can be both at once. TypeScript simplifies the resulting type to `never`.

---

### 5. Think first

What do you think happens when we try to call `.toUpperCase()` on `value`? Decide first.

```typescript
function printValue(value: string | number) {
  console.log(value.toUpperCase());
}
```

---

**Answer and Reason:**

This code fails to compile:

```
Property 'toUpperCase' does not exist on type 'string | number'.
  Property 'toUpperCase' does not exist on type 'number'.
```

**Reason**: `value` could be a `number`. Numbers do not have a `.toUpperCase` method. TypeScript only permits methods that exist on every member of the union. To call `.toUpperCase()`, you must first narrow the type using `typeof value === "string"`.

---

### 6. Try it yourself
Write a function `formatInput` that takes a parameter `input` of type `string | number`. Inside the function, check if `typeof input === "string"`. If yes, return `input.trim()`. Otherwise, return `input.toFixed(2)`. Call it with both a string and a number.

---

### 7. More examples

#### Example A: Union of Literals (Easy)

```typescript
type Mode = "read" | "write";
function setMode(mode: Mode) {
  console.log(mode);
}
setMode("read");
```

**Line-by-line explanation:**
- `type Mode = "read" | "write";`: Restricts `mode` to only two specific string values.
- `setMode("read");`: Valid because `"read"` belongs to the `Mode` union.

#### Example B: Intersecting Object Schemas (Medium)

```typescript
type BaseEntity = { id: string; createdAt: number };
type Article = BaseEntity & { title: string; content: string };

const post: Article = {
  id: "art_1",
  createdAt: 1700000000,
  title: "TypeScript Guide",
  content: "Learn types step by step.",
};
```

**Line-by-line explanation:**
- `BaseEntity & { title: string; content: string }`: Merges the properties. `post` must provide `id`, `createdAt`, `title`, and `content`.

#### Example C: Primitive Intersection Clashes (Harder)

```typescript
type Impossible = string & number;
// let val: Impossible = "test"; // Error: Type 'string' is not assignable to type 'never'.
```

**Line-by-line explanation:**
- `type Impossible = string & number;`: No JavaScript value can be both a string and a number simultaneously. TypeScript resolves this intersection to `never`.

---

### 8. Common mistakes

#### Mistake 1: Accessing non-common properties on a union without narrowing

**Wrong code:**
```typescript
type Cat = { name: string; meow: () => void };
type Dog = { name: string; bark: () => void };

function speak(pet: Cat | Dog) {
  pet.bark();
}
```

**Error output:**
```
Property 'bark' does not exist on type 'Cat | Dog'.
  Property 'bark' does not exist on type 'Cat'.
```

**Why it happens:**
`pet` might be a `Cat`. Calling `.bark()` on a `Cat` would crash at runtime.

**Correct code:**
```typescript
function speak(pet: Cat | Dog) {
  if ("bark" in pet) {
    pet.bark();
  } else {
    pet.meow();
  }
}
```

---

### 9. Rules to remember
1. `A | B` means the value can satisfy `A`, `B`, or both.
2. On a union type, you can only access properties that exist on all members of the union without narrowing.
3. `A & B` means the value must satisfy all members simultaneously.
4. Intersecting incompatible primitive types results in `never`.

---

### 10. Exercises

#### Question 1 (Predict the compile result)
Will the following code compile? Explain why or why not.

```typescript
type Product = { id: string; price: number };
type Service = { id: string; duration: number };

function getId(item: Product | Service) {
  return item.id;
}
```

#### Question 2 (Find and fix the bug)
The function below attempts to return the length of an item, but fails to compile. Fix the bug using a type check.

```typescript
function getLength(item: string | string[]) {
  return item.length;
}
```
Wait, does `string | string[]` have `.length`? Both `string` and `string[]` have `.length`!
Let's consider:
```typescript
function getItem(item: string | number) {
  return item.length;
}
```
Fix this function so it compiles safely.

#### Question 3 (Write code from scratch)
Create two types:
- `Timestamps` with properties `createdAt: number` and `updatedAt: number`.
- `PostData` with properties `title: string` and `body: string`.

Create a third type `BlogPost` that intersects both. Write a valid object matching `BlogPost`.

#### Question 4 (Explain in your own words)
Why does TypeScript restrict you to only common properties when working with a union type?

---

### Solutions

#### Solution to Question 1
**Hint 1**: Does `id` exist on `Product`?
**Hint 2**: Does `id` exist on `Service`?

**Answer**:
Yes, it compiles without errors. Because `id` is present on both `Product` and `Service`, TypeScript permits reading `item.id` directly from the union.

#### Solution to Question 2
**Hint 1**: `number` does not have a `.length` property.
**Hint 2**: Check `typeof item === "string"`.

**Answer**:
```typescript
function getItem(item: string | number) {
  if (typeof item === "string") {
    return item.length;
  }
  return item.toString().length;
}
```

#### Solution to Question 3
**Hint 1**: Use the `&` operator to combine `Timestamps` and `PostData`.
**Hint 2**: Provide all four properties in the object literal.

**Answer**:
```typescript
type Timestamps = { createdAt: number; updatedAt: number };
type PostData = { title: string; body: string };
type BlogPost = Timestamps & PostData;

const post: BlogPost = {
  createdAt: 1000,
  updatedAt: 2000,
  title: "New Post",
  body: "Content here",
};
```

#### Solution to Question 4
**Hint 1**: Consider what happens if a property only exists on one member of a union.
**Hint 2**: Think about JavaScript runtime behavior when reading an undefined property.

**Answer**:
If TypeScript allowed accessing a property that only exists on one member of the union, the code could crash or return `undefined` at runtime if the other member was passed. To guarantee runtime safety, TypeScript only allows accessing properties that are guaranteed to exist on all members.

---

### 11. Recall

1. What operator creates a union type?
2. What operator creates an intersection type?
3. What is the result of intersecting `string & number`?

**If you remember only one thing:**
Union types represent an OR relationship across values, while intersection types represent an AND relationship combining requirements.

---

# Topic 4: Top Types (`unknown` vs `any`)

### 1. What is it?
In type theory, a "top type" is a type that contains all possible values.

TypeScript has two top types: `any` and `unknown`.
- `any` turns off type checking completely.
- `unknown` represents any value safely, requiring you to verify what it is before using it.

### 2. Why does it exist?
Programs frequently receive data from outside sources whose shape cannot be known at compile time: API responses, user inputs, or JSON files.

In older versions of TypeScript, developers used `any` for this data. But `any` removes all safety and allows calling non-existent methods, which causes crashes. TypeScript introduced `unknown` so developers can accept any data without losing safety.

### 3. Basic example

```typescript
let unsafeVal: any = "hello";
unsafeVal.nonExistentMethod(); // Compiles! But crashes at runtime!

let safeVal: unknown = "hello";
// safeVal.nonExistentMethod(); // Compile error: 'safeVal' is of type 'unknown'.

if (typeof safeVal === "string") {
  console.log(safeVal.toUpperCase()); // Safe! TypeScript knows it is a string here.
}
```

**Line-by-line explanation:**
- `let unsafeVal: any = "hello";`: Declares `unsafeVal` as `any`. TypeScript will not check any operations on this variable.
- `unsafeVal.nonExistentMethod();`: The compiler allows this line because `any` disables checks. When run, JavaScript throws a `TypeError`.
- `let safeVal: unknown = "hello";`: Declares `safeVal` as `unknown`. Any value can be assigned to it, but no operations are allowed without proof.
- `// safeVal.nonExistentMethod();`: Rejected by TypeScript. You cannot call methods on `unknown`.
- `if (typeof safeVal === "string") {`: Checks the runtime type. Inside this `if` block, TypeScript narrows `safeVal` from `unknown` to `string`.
- `console.log(safeVal.toUpperCase());`: Compiles safely because `safeVal` is verified to be a string.

---

### 4. How it works inside TypeScript
1. **Universal Assignment Inbound**: You can assign any value in JavaScript (`42`, `"text"`, `{}`, `null`) to either `any` or `unknown`.
2. **Assignment Outbound**:
   - `any` can be assigned to any other type (such as `number` or `string`) without a check.
   - `unknown` cannot be assigned to any other type except `unknown` itself or `any`.
3. **Property Access**:
   - On `any`: Allowed without checks.
   - On `unknown`: Forbidden until you narrow the type using guards (`typeof`, `instanceof`, etc.).

---

### 5. Think first

What do you think happens when this code is compiled? Decide first.

```typescript
function processData(val: unknown) {
  let text: string = val;
  console.log(text);
}
```

---

**Answer and Reason:**

This code fails to compile:

```
Type 'unknown' is not assignable to type 'string'.
```

**Reason**: `val` is of type `unknown`. It could be a number, a boolean, or an object. TypeScript prevents you from putting an unverified `unknown` value into a variable expecting a specific type like `string`.

---

### 6. Try it yourself
Write a function `parseJSON(input: string): unknown`. Return `JSON.parse(input)`. In a separate function `handleResult`, accept an argument of type `unknown`, check if `typeof arg === "number"`, and print its square (`arg * arg`).

---

### 7. More examples

#### Example A: Assigning Everything to `unknown` (Easy)

```typescript
let value: unknown;
value = 123;
value = true;
value = ["a", "b"];
```

**Line-by-line explanation:**
- Every assignment succeeds because `unknown` contains all possible JavaScript values.

#### Example B: Narrowing `unknown` with `typeof` (Medium)

```typescript
function printLength(data: unknown) {
  if (typeof data === "string") {
    console.log(data.length);
  }
}
```

**Line-by-line explanation:**
- `if (typeof data === "string")`: Narrows `data` to `string`. Accessing `.length` is completely type-safe inside this branch.

#### Example C: The Danger of `any` Leaks (Harder)

```typescript
function getStoredValue(): any {
  return 100;
}

const userName: string = getStoredValue();
// userName is typed as string, but holds the number 100!
// userName.toLowerCase(); // Crashes with TypeError at runtime!
```

**Line-by-line explanation:**
- `const userName: string = getStoredValue();`: Because `getStoredValue` returns `any`, TypeScript silently allows assigning it to `string`. This breaks type safety and causes runtime crashes later.

---

### 8. Common mistakes

#### Mistake 1: Using `any` instead of `unknown` for third-party inputs

**Wrong code:**
```typescript
function handleApiResponse(response: any) {
  console.log(response.data.user.name);
}
```

**Why it happens:**
It is faster to type `any`, but if `response.data` is missing or undefined, the code crashes at runtime with `Cannot read properties of undefined`.

**Correct code:**
```typescript
function handleApiResponse(response: unknown) {
  if (
    typeof response === "object" &&
    response !== null &&
    "data" in response
  ) {
    console.log("Safe to inspect");
  }
}
```

---

### 9. Rules to remember
1. Any value can be assigned to `unknown` and `any`.
2. `any` disables all type checking; avoid using it in production code.
3. `unknown` keeps type safety intact; you must narrow it before performing operations.
4. `unknown` cannot be assigned to another type without a check.

---

### 10. Exercises

#### Question 1 (Predict the compile result)
Will the following code compile? Explain why.

```typescript
let val: unknown = 50;
let num: number = val;
```

#### Question 2 (Find and fix the bug)
The function below should safely print the length of a string passed as `unknown`. Fix the compile error.

```typescript
function displayLength(val: unknown) {
  console.log(val.length);
}
```

#### Question 3 (Write code from scratch)
Write a function `isNumber(val: unknown): boolean` that returns `true` if `val` is a number, and `false` otherwise.

#### Question 4 (Explain in your own words)
Why is `unknown` called "type-safe" while `any` is not?

---

### Solutions

#### Solution to Question 1
**Hint 1**: What can `unknown` be assigned to?
**Hint 2**: Is `number` allowed to receive an unverified `unknown`?

**Answer**:
No, it will not compile. It fails with: `Type 'unknown' is not assignable to type 'number'`. You cannot assign `unknown` to `number` without first narrowing it.

#### Solution to Question 2
**Hint 1**: You cannot access properties on `unknown`.
**Hint 2**: Check `typeof val === "string"` before accessing `.length`.

**Answer**:
```typescript
function displayLength(val: unknown) {
  if (typeof val === "string") {
    console.log(val.length);
  }
}
```

#### Solution to Question 3
**Hint 1**: Use the JavaScript `typeof` operator.
**Hint 2**: Compare the result with `"number"`.

**Answer**:
```typescript
function isNumber(val: unknown): boolean {
  return typeof val === "number";
}
```

#### Solution to Question 4
**Hint 1**: Think about what operations the compiler allows on both.
**Hint 2**: What happens if you make a typo with `any` versus `unknown`?

**Answer**:
`any` completely shuts off the compiler's checks, allowing invalid property accesses and invalid assignments that can cause runtime crashes. In contrast, `unknown` forces you to perform explicit runtime type checks before accessing properties or assigning values, preserving full type safety.

---

### 11. Recall

1. Which top type turns off the type checker?
2. Which top type requires narrowing before property access?
3. Can a variable of type `unknown` be assigned to a variable of type `string` directly?

**If you remember only one thing:**
Use `unknown` instead of `any` when dealing with uncertain data to keep type safety.

---

# Topic 5: Bottom Type (`never`) and Exhaustiveness Checking

### 1. What is it?
In TypeScript, `never` is the bottom type. It represents the empty set of values: a type that contains zero values.

No value can ever have the type `never` at runtime.

### 2. Why does it exist?
`never` exists to model situations that should never happen or code paths that can never be reached.

It solves two primary problems:
1. Describing functions that never return (such as functions that always throw an error or run an infinite loop).
2. Ensuring that every possible case in a `switch` or `if/else` block has been handled (called exhaustiveness checking).

### 3. Basic example

```typescript
type Direction = "up" | "down";

function getDirectionCode(dir: Direction): number {
  switch (dir) {
    case "up":
      return 1;
    case "down":
      return 2;
    default: {
      const check: never = dir;
      return check;
    }
  }
}
```

**Line-by-line explanation:**
- `type Direction = "up" | "down";`: Defines a union type with two string members.
- `function getDirectionCode(dir: Direction): number {`: Declares a function taking `dir`.
- `case "up": return 1;`: Handles the `"up"` case.
- `case "down": return 2;`: Handles the `"down"` case.
- `default: {`: Reached only if `dir` was neither `"up"` nor `"down"`.
- `const check: never = dir;`: Because TypeScript verified that all members of `Direction` were handled in the cases above, the remaining type of `dir` here is `never`. Assigning `dir` to `check: never` succeeds. If someone later adds `"left"` to `Direction` without adding a case for it, `dir` in the `default` block would be `"left"`, causing an immediate compile error!

---

### 4. How it works inside TypeScript
1. **Control-Flow Elimination**: As TypeScript moves through `if` or `switch` branches, it removes the handled types from the variable's union.
2. **Reaching `never`**: When every member of a union has been removed, the type of the variable becomes `never`.
3. **Algebraic Invariant**:
   - In unions: `T | never` simplifies to `T` (adding nothing to a set leaves it unchanged).
   - In intersections: `T & never` simplifies to `never` (intersecting with an empty set leaves an empty set).

---

### 5. Think first

What happens if we add `"left"` to `Direction` in the code below without updating the `switch` statement? Decide first.

```typescript
type Direction = "up" | "down" | "left";

function getCode(dir: Direction) {
  switch (dir) {
    case "up":
      return 1;
    case "down":
      return 2;
    default: {
      const check: never = dir;
      return check;
    }
  }
}
```

---

**Answer and Reason:**

This code fails to compile:

```
Type 'string' is not assignable to type 'never'.
  Type '"left"' is not assignable to type 'never'.
```

**Reason**: Because `"left"` was not handled in any case, `dir` inside `default` still has the type `"left"`. It cannot be assigned to `check: never`. TypeScript forces you to handle `"left"` before compiling.

---

### 6. Try it yourself
Create a union type `Theme = "light" | "dark" | "system"`. Write a function `getThemeBackground(theme: Theme): string`. Handle all three cases in a `switch` statement. In the `default` branch, assign `theme` to a variable of type `never`. Verify that it compiles.

---

### 7. More examples

#### Example A: Function That Always Throws (Easy)

```typescript
function fail(message: string): never {
  throw new Error(message);
}
```

**Line-by-line explanation:**
- `function fail(message: string): never {`: The return type `never` tells TypeScript this function never finishes normally; it always throws an exception.

#### Example B: Infinite Loop (Medium)

```typescript
function keepRunning(): never {
  while (true) {
    // Process background events
  }
}
```

**Line-by-line explanation:**
- Because the loop never exits, the function never returns a value, so its return type is `never`.

#### Example C: Union Filtering (Harder)

```typescript
type Allowed = string | number | never;
// Evaluates to: string | number
```

**Line-by-line explanation:**
- Because `never` represents the empty set, adding `never` to a union does not add any values. `never` disappears from union types automatically.

---

### 8. Common mistakes

#### Mistake 1: Confusing `void` and `never`

**Wrong code:**
```typescript
function logMessage(msg: string): never {
  console.log(msg);
}
```

**Error output:**
```
A function returning 'never' cannot have a reachable end point.
```

**Why it happens:**
`void` means a function finishes normally but returns nothing (`undefined`). `never` means the function never finishes executing at all.

**Correct code:**
```typescript
function logMessage(msg: string): void {
  console.log(msg);
}
```

---

### 9. Rules to remember
1. `never` contains zero values.
2. No value can be assigned to `never` except `never` itself.
3. Functions that throw errors or run infinite loops have return type `never`.
4. In union types, `T | never` simplifies to `T`.
5. Use `const check: never = val` in `default` branches for exhaustiveness checking.

---

### 10. Exercises

#### Question 1 (Predict the compile result)
Will the following function compile? Explain why.

```typescript
function stopApp(): never {
  console.log("Shutting down");
}
```

#### Question 2 (Find and fix the bug)
The following function is supposed to guarantee that all shapes are handled, but it currently has a compile error. Fix it.

```typescript
type Shape = "circle" | "square";

function getArea(s: Shape) {
  if (s === "circle") {
    return 3.14;
  }
  const check: never = s;
}
```

#### Question 3 (Write code from scratch)
Define a type `LogLevel = "info" | "warn" | "error"`. Write a function that accepts `LogLevel` and uses a `switch` statement with an exhaustive `never` check in the `default` case.

#### Question 4 (Explain in your own words)
What is the difference between a function returning `void` and a function returning `never`?

---

### Solutions

#### Solution to Question 1
**Hint 1**: Does `stopApp` throw an error or run forever?
**Hint 2**: What does a function return by default if it ends?

**Answer**:
No, it will not compile. It fails with: `A function returning 'never' cannot have a reachable end point`. Because the function reaches its closing brace, it returns `undefined` (which is `void`), not `never`.

#### Solution to Question 2
**Hint 1**: Has the `"square"` case been handled?
**Hint 2**: If `s !== "circle"`, what type does `s` have?

**Answer**:
In the code, `s` can still be `"square"`, so assigning it to `never` fails. You must handle `"square"` first:

```typescript
type Shape = "circle" | "square";

function getArea(s: Shape) {
  if (s === "circle") {
    return 3.14;
  }
  if (s === "square") {
    return 4;
  }
  const check: never = s;
}
```

#### Solution to Question 3
**Hint 1**: Write cases for `"info"`, `"warn"`, and `"error"`.
**Hint 2**: Place `const check: never = level;` in the `default` branch.

**Answer**:
```typescript
type LogLevel = "info" | "warn" | "error";

function handleLog(level: LogLevel) {
  switch (level) {
    case "info":
      console.log("Information");
      break;
    case "warn":
      console.warn("Warning");
      break;
    case "error":
      console.error("Error");
      break;
    default: {
      const check: never = level;
      throw new Error(`Unhandled level: ${check}`);
    }
  }
}
```

#### Solution to Question 4
**Hint 1**: Consider whether the function finishes and returns to the caller.
**Hint 2**: Think about what value is returned.

**Answer**:
A function returning `void` completes its execution normally and returns `undefined` to the caller. A function returning `never` never finishes executing and never returns control to the caller (it throws an exception or loops indefinitely).

---

### 11. Recall

1. How many values exist in the type `never`?
2. What does `string | never` simplify to?
3. What compile-time technique uses `never` to make sure all union cases are handled?

**If you remember only one thing:**
`never` represents an impossible state and enables compile-time verification that all union branches are handled.

---

# Checkpoint Challenge: Topics 1 to 5

### Challenge Scenario
You are building an event dispatch system.

1. Create a union type `AppEvent` that allows three string actions: `"login"`, `"logout"`, and `"update"`.
2. Write a function `dispatch(event: AppEvent): void`.
3. Inside `dispatch`, write a `switch` statement that handles every event:
   - For `"login"`, print `"User logged in"`.
   - For `"logout"`, print `"User logged out"`.
   - For `"update"`, print `"Profile updated"`.
   - In the `default` case, write an exhaustiveness check using `never` that throws an error if an unhandled event is reached.
4. Test what happens if you add `"delete"` to `AppEvent` before updating your `switch`.

### Challenge Solution

```typescript
type AppEvent = "login" | "logout" | "update";

function dispatch(event: AppEvent): void {
  switch (event) {
    case "login":
      console.log("User logged in");
      break;
    case "logout":
      console.log("User logged out");
      break;
    case "update":
      console.log("Profile updated");
      break;
    default: {
      const _exhaustiveCheck: never = event;
      throw new Error(`Unhandled event: ${_exhaustiveCheck}`);
    }
  }
}

dispatch("login");
```

---

# Topic 6: The Object Type Hierarchy (`{}` vs `object` vs `Object`)

### 1. What is it?
In TypeScript, there are three types that look like objects but have different meanings:
- `{}`: The empty object type. Represents any value that is not `null` or `undefined`.
- `object` (lowercase): Represents any non-primitive reference type (objects, arrays, functions).
- `Object` (capitalized): The interface describing JavaScript's `Object.prototype`.

### 2. Why does it exist?
JavaScript has both primitive values (`42`, `"text"`, `true`) and reference types (objects `{ ... }`, arrays `[ ... ]`).

Sometimes you need to write a function that strictly accepts reference objects and rejects primitives (such as `Object.create` or `WeakMap.set`). Using `{}` would accidentally allow numbers and strings, so TypeScript introduced lowercase `object` to represent strictly non-primitive types.

### 3. Basic example

```typescript
// 1. Lowercase object: only reference types allowed
let ref: object;
ref = { key: "value" }; // Allowed
ref = [1, 2, 3];        // Allowed (arrays are objects)
// ref = 42;            // Compile error: Type 'number' is not assignable to type 'object'.

// 2. Empty object {}: accepts any non-nullish value
let anyNonNull: {};
anyNonNull = "hello";   // Allowed!
anyNonNull = 100;       // Allowed!
// anyNonNull = null;   // Compile error!
```

**Line-by-line explanation:**
- `let ref: object;`: Restricts `ref` to reference types.
- `ref = { key: "value" };`: Valid because an object literal is a reference type.
- `ref = [1, 2, 3];`: Valid because arrays are objects in JavaScript.
- `// ref = 42;`: Rejected because `42` is a primitive number.
- `let anyNonNull: {};`: `{}` means any value except `null` or `undefined`.
- `anyNonNull = "hello";`: Allowed because `"hello"` is not `null` or `undefined`.

---

### 4. How it works inside TypeScript
Comparison table of the three object types:

| Type | Allows Primitives (`string`, `number`)? | Allows `null` & `undefined`? | Allows Objects & Arrays? |
|---|---|---|---|
| `{}` | Yes | No (with `strictNullChecks`) | Yes |
| `object` | No | No | Yes |
| `Object` | Yes | No (with `strictNullChecks`) | Yes |

---

### 5. Think first

What do you think happens when we try to assign `true` to `val: object`? Decide first.

```typescript
let val: object = true;
```

---

**Answer and Reason:**

This code fails to compile:

```
Type 'boolean' is not assignable to type 'object'.
```

**Reason**: `true` is a primitive boolean value. Lowercase `object` strictly permits non-primitive reference types.

---

### 6. Try it yourself
Declare a function `storeReference(target: object): void`. Call it with an object `{ name: "Alex" }`, an array `[1, 2]`, and a number `42`. Notice which calls succeed and which one fails.

---

### 7. More examples

#### Example A: WeakMap Keys (Easy)

```typescript
const cache = new WeakMap<object, string>();
const userKey = { id: 1 };
cache.set(userKey, "Admin User");
```

**Line-by-line explanation:**
- `WeakMap` keys in JavaScript must be reference objects. TypeScript enforces this using `object`.

#### Example B: Avoiding `{}` When You Want Key-Value Pairs (Medium)

```typescript
// Bad: accepts strings and numbers
// let dict: {} = 42;

// Good: specifically an object with string keys
let dict: Record<string, unknown> = { key: "value" };
```

**Line-by-line explanation:**
- `Record<string, unknown>` explicitly enforces an object structure with string keys, preventing primitives from being assigned.

---

### 8. Common mistakes

#### Mistake 1: Using `{}` believing it requires an object

**Wrong code:**
```typescript
function saveRecord(record: {}) {
  console.log(record);
}
saveRecord("test"); // Compiles without error!
saveRecord(123);    // Compiles without error!
```

**Why it happens:**
`{}` matches any value that is not `null` or `undefined`. It does not restrict values to JavaScript objects.

**Correct code:**
```typescript
function saveRecord(record: Record<string, unknown>) {
  console.log(record);
}
// saveRecord("test"); // Error!
```

---

### 9. Rules to remember
1. `{}` means any value except `null` and `undefined`.
2. Lowercase `object` means non-primitive reference types only (objects, arrays, functions).
3. Do not use capitalized `Object` in regular code.
4. Use `Record<string, unknown>` when you want an object dictionary with key-value pairs.

---

### 10. Exercises

#### Question 1 (Predict the compile result)
Which of the following assignments will compile?
```typescript
let a: object = [1, 2, 3];
let b: object = "text";
let c: {} = 99;
```

#### Question 2 (Find and fix the bug)
The function below should only accept reference objects, but currently allows strings. Fix its parameter type.

```typescript
function freezeObject(item: {}) {
  Object.freeze(item);
}
```

#### Question 3 (Write code from scratch)
Write a variable declaration for `data` that accepts any object with string keys and unknown values. Assign a valid object to it.

#### Question 4 (Explain in your own words)
Why does TypeScript allow assigning the number `42` to the empty object type `{}`?

---

### Solutions

#### Solution to Question 1
**Hint 1**: Are arrays reference types?
**Hint 2**: Does `{}` allow primitives?

**Answer**:
`a` compiles (arrays are objects).
`b` fails (strings are primitives).
`c` compiles (`{}` allows any non-nullish value, including numbers).

#### Solution to Question 2
**Hint 1**: Change `{}` to lowercase `object`.

**Answer**:
```typescript
function freezeObject(item: object) {
  Object.freeze(item);
}
```

#### Solution to Question 3
**Hint 1**: Use `Record<string, unknown>`.

**Answer**:
```typescript
const data: Record<string, unknown> = {
  name: "Alex",
  score: 100,
};
```

#### Solution to Question 4
**Hint 1**: Think about how JavaScript boxes primitives into objects when reading methods.
**Hint 2**: Remember the definition of `{}` in TypeScript.

**Answer**:
In TypeScript, `{}` represents any value that is not `null` or `undefined`. Because numbers have prototype methods (like `.toFixed()`), they can be treated as having object members when boxed. Thus, `{}` accepts all primitives except `null` and `undefined`.

---

### 11. Recall

1. What type strictly represents non-primitive values?
2. What values cannot be assigned to `{}`?
3. What is the recommended type for an object dictionary?

**If you remember only one thing:**
Use lowercase `object` for non-primitives, and `Record<string, unknown>` for key-value dictionaries.

---

# Topic 7: Structural Subtyping (Width and Depth Subtyping)

### 1. What is it?
Structural subtyping means TypeScript checks types based on their shape (their properties), not their declared names. If type `A` has all the properties required by type `B`, with compatible types, then `A` can be used wherever `B` is expected.

In nominal languages (like Java or C#), two classes with identical fields are incompatible unless one explicitly inherits from the other. In TypeScript, shape is all that matters.

### 2. Why does it exist?
JavaScript is built around object literals and dynamic shapes. Functions frequently accept objects as long as they contain specific properties. Structural typing aligns TypeScript with standard JavaScript programming practices.

### 3. Basic example

```typescript
type Point2D = { x: number; y: number };
type Point3D = { x: number; y: number; z: number };

const point3: Point3D = { x: 10, y: 20, z: 30 };
const point2: Point2D = point3; // Compiles!
```

**Line-by-line explanation:**
- `type Point2D = { x: number; y: number };`: Requires an object to have numbers `x` and `y`.
- `type Point3D = { x: number; y: number; z: number };`: Requires `x`, `y`, and `z`.
- `const point3: Point3D = { x: 10, y: 20, z: 30 };`: Creates an object with `x`, `y`, and `z`.
- `const point2: Point2D = point3;`: TypeScript checks if `point3` has `x` (yes) and `y` (yes). Having the extra property `z` does not prevent it from being a valid `Point2D`. This is called **Width Subtyping**.

---

### 4. How it works inside TypeScript
Structural subtyping operates along two dimensions:

1. **Width Subtyping**: An object type with extra properties is assignable to an object type with fewer properties.
2. **Depth Subtyping**: An object type whose nested properties are subtypes of another object's nested properties is assignable to that object.

```
Point3D has: { x: number, y: number, z: number }
Point2D expects: { x: number, y: number }
Result: Point3D satisfies all expectations of Point2D.
```

---

### 5. Think first

What do you think happens here? Will this compile? Decide first.

```typescript
class UserRecord {
  id: string = "usr_1";
}

class ProductRecord {
  id: string = "prd_1";
}

let user: UserRecord = new ProductRecord();
```

---

**Answer and Reason:**

This code compiles without errors!

**Reason**: TypeScript uses structural typing, not nominal typing. Because both `UserRecord` and `ProductRecord` have the exact same shape (a single property `id` of type `string`), TypeScript considers them interchangeable.

---

### 6. Try it yourself
Create an interface `Named` with `name: string`. Create another interface `DetailedNamed` with `name: string` and `age: number`. Create a function `printName(item: Named)`. Pass an object of type `DetailedNamed` to `printName` and verify that it compiles.

---

### 7. More examples

#### Example A: Function Parameter Flexibility (Easy)

```typescript
function logCoordinates(point: { x: number; y: number }) {
  console.log(point.x, point.y);
}

const target = { x: 5, y: 10, label: "Center" };
logCoordinates(target);
```

**Line-by-line explanation:**
- `target` has `x`, `y`, and `label`. When passed to `logCoordinates`, TypeScript verifies `x` and `y` exist. The extra `label` is ignored.

#### Example B: Depth Subtyping (Medium)

```typescript
type SuperConfig = { settings: { theme: string } };
type SubConfig   = { settings: { theme: "dark" } };

const sub: SubConfig = { settings: { theme: "dark" } };
const sup: SuperConfig = sub; // Allowed!
```

**Line-by-line explanation:**
- `theme: "dark"` is a subtype of `theme: string`. Because the nested property matches, the entire `SubConfig` is assignable to `SuperConfig`.

---

### 8. Common mistakes

#### Mistake 1: Expecting class names to enforce type distinction

**Wrong assumption:**
```typescript
class AccountId {
  constructor(public value: string) {}
}
class CustomerId {
  constructor(public value: string) {}
}

function processAccount(id: AccountId) {}
processAccount(new CustomerId("123")); // Compiles!
```

**Why it happens:**
Both classes have the same shape (`value: string`). TypeScript does not care about the class name. To make them distinct, you need branded types (covered in Topic 9).

---

### 9. Rules to remember
1. TypeScript checks object compatibility by shape, not by class or interface name.
2. An object with more properties is compatible with a type requiring fewer properties (Width Subtyping).
3. Two different classes with identical fields are considered compatible.

---

### 10. Exercises

#### Question 1 (Predict the compile result)
Will the following code compile?
```typescript
type BasicUser = { id: string };
type AdminUser = { id: string; permissions: string[] };

let admin: AdminUser = { id: "1", permissions: ["read"] };
let user: BasicUser = admin;
let nextAdmin: AdminUser = user;
```

#### Question 2 (Find and fix the bug)
The following assignment fails. Explain why and fix it:
```typescript
type RequiredFields = { id: string; active: boolean };
const data = { id: "10" };
const item: RequiredFields = data;
```

#### Question 3 (Write code from scratch)
Define a type `HasId` with `id: number`. Define a function `printId(item: HasId)`. Create an object with `id: 1` and `title: "Book"` and pass it to `printId`.

#### Question 4 (Explain in your own words)
What is the difference between nominal typing and structural typing?

---

### Solutions

#### Solution to Question 1
**Hint 1**: Can `AdminUser` be assigned to `BasicUser`?
**Hint 2**: Can `BasicUser` be assigned to `AdminUser`?

**Answer**:
Line 4 (`user = admin`) compiles.
Line 5 (`nextAdmin = user`) fails with: `Property 'permissions' is missing in type 'BasicUser'`. Subtyping only works from more specific to less specific.

#### Solution to Question 2
**Hint 1**: What property is missing from `data`?

**Answer**:
`data` is missing `active: boolean`.
```typescript
const data = { id: "10", active: true };
const item: RequiredFields = data;
```

#### Solution to Question 3
**Hint 1**: Declare `type HasId = { id: number }`.

**Answer**:
```typescript
type HasId = { id: number };
function printId(item: HasId) {
  console.log(item.id);
}

const item = { id: 1, title: "Book" };
printId(item);
```

#### Solution to Question 4
**Hint 1**: Nominal refers to names.
**Hint 2**: Structural refers to shapes.

**Answer**:
In nominal typing, types are compatible only if they share explicit declarations or inheritance names. In structural typing, types are compatible whenever their shapes and property types match, regardless of their names.

---

### 11. Recall

1. Does TypeScript use nominal or structural typing?
2. What is width subtyping?
3. If two classes have identical properties, does TypeScript treat them as compatible?

**If you remember only one thing:**
TypeScript checks types based on their shape and properties, not their names.

---

# Topic 8: Excess Property Checks and Freshness Decay

### 1. What is it?
If TypeScript uses structural typing (where extra properties are allowed), why does the compiler reject extra properties in an object literal?

This behavior is called **Excess Property Checking** (or **Freshness**). When you write a fresh object literal directly in an assignment or function call, TypeScript forbids extra properties.

### 2. Why does it exist?
When a developer writes an object literal directly at an assignment site, extra properties are almost always a typo or a misunderstanding of the API.

For example, typing `user = { name: "Alex", agge: 25 }` is a typo for `age`. If structural typing allowed it silently, the typo would go unnoticed and cause a bug. Excess Property Checking catches these mistakes.

### 3. Basic example

```typescript
interface UserConfig {
  theme: string;
  timeout?: number;
}

// 1. Direct object literal: Error on typo!
// const config: UserConfig = { theme: "dark", timeeout: 1000 };
// Error: Object literal may only specify known properties, and 'timeeout' does not exist in type 'UserConfig'.

// 2. Intermediate variable: Freshness decays, structural subtyping applies
const rawConfig = { theme: "dark", timeeout: 1000 };
const config: UserConfig = rawConfig; // Compiles!
```

**Line-by-line explanation:**
- `interface UserConfig { theme: string; timeout?: number; };`: Defines the expected shape.
- `const config: UserConfig = { theme: "dark", timeeout: 1000 };`: Direct literal assignment. Because it is a fresh object literal, TypeScript performs an Excess Property Check and catches the typo `timeeout`.
- `const rawConfig = { theme: "dark", timeeout: 1000 };`: Declares a variable `rawConfig`. Its inferred type is `{ theme: string; timeeout: number }`.
- `const config: UserConfig = rawConfig;`: When assigned through an intermediate variable, the object is no longer "fresh". Freshness decays, and standard structural subtyping rules apply.

---

### 4. How it works inside TypeScript
1. **Freshness Flag**: When the compiler parses an object literal directly (`{ ... }`), it marks its type as Fresh.
2. **Freshness Check**: A fresh object literal cannot have properties that do not exist on the target type.
3. **Freshness Decay**: An object literal loses its freshness when:
   - It is assigned to a separate variable.
   - It is passed through a type assertion (`as`).
   - It is returned from an unannotated helper function.

---

### 5. Think first

What do you think happens in this function call? Decide first.

```typescript
interface Point {
  x: number;
  y: number;
}

function drawPoint(p: Point) {}

drawPoint({ x: 10, y: 20, z: 30 });
```

---

**Answer and Reason:**

This code fails to compile:

```
Argument of type '{ x: number; y: number; z: number; }' is not assignable to parameter of type 'Point'.
  Object literal may only specify known properties, and 'z' does not exist in type 'Point'.
```

**Reason**: The argument `{ x: 10, y: 20, z: 30 }` is a fresh object literal passed directly into the function call. TypeScript triggers an Excess Property Check and rejects the extra property `z`.

---

### 6. Try it yourself
Create an interface `ButtonProps` with `label: string` and optional `disabled?: boolean`. Call a function `renderButton(props: ButtonProps)` directly with `{ label: "Submit", disable: true }` and observe the typo error. Then fix the typo.

---

### 7. More examples

#### Example A: Catching Obsolete Options (Easy)

```typescript
type RequestOptions = { url: string; method?: string };

// Catches outdated property 'headersObj'
// const req: RequestOptions = { url: "/api", headersObj: {} };
```

**Line-by-line explanation:**
- Excess property checking prevents passing obsolete or misnamed options.

#### Example B: Bypassing with Intermediate Variable (Medium)

```typescript
const options = { url: "/api", extraDebugInfo: true };
const req: RequestOptions = options; // Allowed!
```

**Line-by-line explanation:**
- Because `options` is an intermediate variable, the freshness flag is gone, allowing `extraDebugInfo` via width subtyping.

---

### 8. Common mistakes

#### Mistake 1: Relying on TypeScript to strip extra properties at runtime

**Wrong assumption:**
Assuming TypeScript strips `extraDebugInfo` when assigned to `req: RequestOptions`.

**Reality:**
TypeScript does nothing at runtime. The extra property `extraDebugInfo` still exists in memory on the JavaScript object!

---

### 9. Rules to remember
1. Fresh object literals cannot contain excess properties.
2. Excess property checking catches typos and misspellings.
3. Assigning an object literal to an intermediate variable clears freshness.
4. TypeScript never strips extra properties at runtime.

---

### 10. Exercises

#### Question 1 (Predict the compile result)
Which line fails to compile?
```typescript
interface Config { host: string }
const a: Config = { host: "localhost", port: 8080 }; // Line 2
const b = { host: "localhost", port: 8080 };        // Line 3
const c: Config = b;                                  // Line 4
```

#### Question 2 (Find and fix the bug)
Fix the typo caught by the excess property check below:
```typescript
interface Settings { volume: number }
const userSettings: Settings = { volumme: 80 };
```

#### Question 3 (Write code from scratch)
Write an interface `Profile` with `name: string`. Show two examples: one direct assignment that fails due to an extra property `age`, and one assignment via an intermediate variable that succeeds.

#### Question 4 (Explain in your own words)
Why does TypeScript treat fresh object literals differently from intermediate variables?

---

### Solutions

#### Solution to Question 1
**Hint 1**: Which line assigns an object literal directly to a typed target?

**Answer**:
Line 2 fails with an excess property check error. Line 3 and Line 4 compile successfully.

#### Solution to Question 2
**Hint 1**: Notice the spelling of `volumme`.

**Answer**:
```typescript
interface Settings { volume: number }
const userSettings: Settings = { volume: 80 };
```

#### Solution to Question 3
**Hint 1**: Direct literal vs variable assignment.

**Answer**:
```typescript
interface Profile { name: string }

// Fails (Excess Property Check):
// const p1: Profile = { name: "Alex", age: 25 };

// Succeeds (Freshness Decay):
const raw = { name: "Alex", age: 25 };
const p2: Profile = raw;
```

#### Solution to Question 4
**Hint 1**: Consider the intent of a developer writing a literal directly.

**Answer**:
When writing an object literal directly, extra properties are almost always accidental typos. When an object already exists in an intermediate variable, it may have come from an API or another function where having extra data is normal and expected in structural typing.

---

### 11. Recall

1. What causes an Excess Property Check?
2. How does an object lose its freshness?
3. Does TypeScript delete extra properties from the emitted JavaScript?

**If you remember only one thing:**
Direct object literals are strictly checked for typos, while intermediate variables follow regular structural subtyping.

---

# Topic 9: Branded and Flavored Types for Nominal Safety

### 1. What is it?
Because TypeScript is structural, primitive types like `string` and `number` can be assigned anywhere another string or number is expected.

A **Branded Type** (also called a Nominal Type) is a technique that attaches a compile-time "brand" to a primitive type so that different types cannot be accidentally mixed up, with zero runtime performance cost.

### 2. Why does it exist?
Consider an application that has `UserId` and `OrderId`, both represented as strings.

Without branding, you could accidentally pass an `OrderId` into a function expecting a `UserId`: `getUser(orderId)`. TypeScript would not stop you because both are strings. Branded types force the compiler to treat them as distinct, incompatible types.

### 3. Basic example

```typescript
// Define branded types
type UserId = string & { readonly __brand: unique symbol };
type OrderId = string & { readonly __brand: unique symbol };

// Factory functions (smart constructors)
function makeUserId(id: string): UserId {
  return id as UserId;
}

function makeOrderId(id: string): OrderId {
  return id as OrderId;
}

function deleteUser(id: UserId) {
  console.log("Deleting user", id);
}

const user = makeUserId("usr_100");
const order = makeOrderId("ord_500");

deleteUser(user); // Valid!
// deleteUser(order); // Compile Error!
```

**Line-by-line explanation:**
- `type UserId = string & { readonly __brand: unique symbol };`: Creates an intersection between `string` and an object with a brand property. At compile time, `UserId` is no longer a plain `string`.
- `type OrderId = string & { readonly __brand: unique symbol };`: Creates a distinct branded type for orders.
- `function makeUserId(id: string): UserId`: Smart constructor that casts a validated string to `UserId`.
- `deleteUser(user);`: Compiles because `user` has the type `UserId`.
- `// deleteUser(order);`: Fails with a compile error: `Type 'OrderId' is not assignable to type 'UserId'`. Even though both are strings at runtime, TypeScript stops the accidental swap!

---

### 4. How it works inside TypeScript
1. **Phantom Properties**: The property `__brand` does not actually exist at runtime on the string. It only exists in the compiler's type checker.
2. **Intersection Distinctness**: Because each brand uses a distinct symbol or string literal, the intersections produce incompatible sets of types.
3. **Zero Runtime Overhead**: At runtime, the values remain standard JavaScript strings or numbers. The branding vanishes during compilation.

---

### 5. Think first

What do you think happens if we pass a plain string `"usr_100"` directly to `deleteUser`? Decide first.

```typescript
deleteUser("usr_100");
```

---

**Answer and Reason:**

This code fails to compile:

```
Argument of type 'string' is not assignable to parameter of type 'UserId'.
  Type 'string' is not assignable to type '{ readonly __brand: unique symbol; }'.
```

**Reason**: A plain string does not have the `__brand` property. To get a `UserId`, you must pass the string through the constructor function `makeUserId`.

---

### 6. Try it yourself
Create a branded type `USD` (a number branded with `{ readonly __brand: "USD" }`) and a branded type `EUR` (a number branded with `{ readonly __brand: "EUR" }`). Write a function `transferUSD(amount: USD)`. Try passing an amount of type `EUR` and observe the compiler error.

---

### 7. More examples

#### Example A: String Literal Brand (Easy)

```typescript
type EmailAddress = string & { readonly __brand: "Email" };

function toEmail(raw: string): EmailAddress {
  if (!raw.includes("@")) {
    throw new Error("Invalid email");
  }
  return raw as EmailAddress;
}
```

**Line-by-line explanation:**
- Validates the string before applying the brand, ensuring that only valid emails can inhabit the `EmailAddress` type.

#### Example B: Flavored Types (Medium)
A "flavored" type uses an optional brand (`__flavor?: string`). It allows auto-complete and loose assignments from string literals while still documenting intent.

---

### 8. Common mistakes

#### Mistake 1: Expecting the brand to exist in JavaScript at runtime

**Wrong code:**
```typescript
if ("__brand" in user) {
  console.log("Is branded");
}
```

**Why it happens:**
Brands are purely compile-time constructs. They do not exist on the JavaScript object in memory.

---

### 9. Rules to remember
1. Branded types turn structural primitives into nominally distinct types.
2. Branded types have zero runtime performance cost.
3. Use constructor functions with type assertions (`as`) to create branded values.
4. Brands cannot be inspected with JavaScript operators at runtime.

---

### 10. Exercises

#### Question 1 (Predict the compile result)
Will the following code compile?
```typescript
type MetricMeters = number & { readonly __brand: "Meters" };
type MetricFeet = number & { readonly __brand: "Feet" };

const dist1 = 100 as MetricMeters;
const dist2: MetricFeet = dist1;
```

#### Question 2 (Find and fix the bug)
The function below should accept a validated postal code, but fails when called with a raw string. Fix the call site.
```typescript
type PostalCode = string & { readonly __brand: "PostalCode" };
function ship(code: PostalCode) {}
ship("90210");
```

#### Question 3 (Write code from scratch)
Create a branded type `PositiveNumber` (a number branded with `"Positive"`). Write a helper `makePositive(n: number): PositiveNumber` that throws an error if `n <= 0`.

#### Question 4 (Explain in your own words)
Why are branded types useful in a structurally-typed language like TypeScript?

---

### Solutions

#### Solution to Question 1
**Hint 1**: Do the brand types match?

**Answer**:
No, it fails. `MetricMeters` cannot be assigned to `MetricFeet` because their brand types are different.

#### Solution to Question 2
**Hint 1**: Cast or validate the string to `PostalCode`.

**Answer**:
```typescript
ship("90210" as PostalCode);
```

#### Solution to Question 3
**Hint 1**: Check `if (n <= 0) throw new Error(...)`.

**Answer**:
```typescript
type PositiveNumber = number & { readonly __brand: "Positive" };

function makePositive(n: number): PositiveNumber {
  if (n <= 0) {
    throw new Error("Must be positive");
  }
  return n as PositiveNumber;
}
```

#### Solution to Question 4
**Hint 1**: Think about what happens when multiple different concepts share the same primitive type (`string` or `number`).

**Answer**:
In structural typing, all strings are compatible. Branded types prevent accidental bugs where different entities (like user IDs and order IDs) are mixed up, while introducing zero runtime performance cost.

---

### 11. Recall

1. What operator is used to attach a brand to a type?
2. What is the runtime performance cost of a branded type?
3. Does the brand property exist in emitted JavaScript?

**If you remember only one thing:**
Branded types prevent mixing up identical primitives at compile time with zero runtime overhead.

---

# Topic 10: Control-Flow Analysis and Native Type Narrowing

### 1. What is it?
Control-Flow Analysis (CFA) is the engine inside TypeScript that reads through your code's branches (`if`, `else`, `switch`, `return`) and narrows variable types as conditions are checked.

Type narrowing is the process of moving from a broad type (like `string | number`) to a more specific type (like `string`).

### 2. Why does it exist?
When a function accepts a union type, you cannot safely call methods specific to one member without checking what the value is first.

Control-Flow Analysis allows you to write natural JavaScript checks (`typeof`, `instanceof`, `in`), and TypeScript automatically understands which branch holds which type.

### 3. Basic example

```typescript
function printLength(value: string | number) {
  if (typeof value === "string") {
    // Inside this branch, value is narrowed to 'string'
    console.log(value.length);
  } else {
    // Inside this branch, value is narrowed to 'number'
    console.log(value.toFixed(2));
  }
}
```

**Line-by-line explanation:**
- `function printLength(value: string | number) {`: `value` begins as either a `string` or a `number`.
- `if (typeof value === "string") {`: JavaScript checks if `value` is a string. TypeScript's Control-Flow Analysis recognizes this check and narrows `value` to `string`.
- `console.log(value.length);`: Safe because `value` is guaranteed to be a `string` inside this block.
- `} else {`: Since `value` can only be `string` or `number`, and it is not `string`, TypeScript narrows `value` to `number`.
- `console.log(value.toFixed(2));`: Safe because `value` is guaranteed to be a `number`.

---

### 4. How it works inside TypeScript
TypeScript supports five primary native narrowing checks:

1. **`typeof`**: Narrows primitives (`"string"`, `"number"`, `"boolean"`, `"symbol"`, `"undefined"`, `"object"`).
2. **`instanceof`**: Narrows class instances based on their prototype chain.
3. **`in` operator**: Narrows objects by checking whether a property exists on the object.
4. **Equality (`===`, `!==`)**: Narrows literal values and handles `null` / `undefined` checks.
5. **Truthiness**: Narrows out falsy values (`false`, `0`, `""`, `null`, `undefined`, `NaN`).

---

### 5. Think first

What is the type of `item` inside the `if` block below? Decide first.

```typescript
function inspect(item: object | null) {
  if (typeof item === "object") {
    console.log(item);
  }
}
```

---

**Answer and Reason:**

Inside the `if` block, the type of `item` is **still `object | null`**!

**Reason**: In JavaScript, `typeof null === "object"`. Because `null` returns `"object"`, checking `typeof item === "object"` does **not** filter out `null`. To narrow out `null`, you must check `if (item !== null)`.

---

### 6. Try it yourself
Write a function `processValue(v: string | null | undefined): string`. Use a truthiness check or an equality check to handle `null` and `undefined`, and return `v.toUpperCase()` safely.

---

### 7. More examples

#### Example A: Narrowing with `instanceof` (Easy)

```typescript
function handleDate(val: Date | string) {
  if (val instanceof Date) {
    console.log(val.getFullYear());
  } else {
    console.log(val.toUpperCase());
  }
}
```

**Line-by-line explanation:**
- `val instanceof Date`: Checks if `val` was created from the `Date` constructor, narrowing `val` to `Date`.

#### Example B: Narrowing with the `in` Operator (Medium)

```typescript
type Admin = { role: "admin"; kickUser: () => void };
type Member = { role: "member" };

function handleUser(u: Admin | Member) {
  if ("kickUser" in u) {
    u.kickUser(); // Safely narrowed to Admin!
  }
}
```

**Line-by-line explanation:**
- `"kickUser" in u`: Checks if the property exists on `u`, safely narrowing `u` to `Admin`.

---

### 8. Common mistakes

#### Mistake 1: Forgetting that `typeof null === "object"`

**Wrong code:**
```typescript
function parse(obj: { id: string } | null) {
  if (typeof obj === "object") {
    // console.log(obj.id); // Error: 'obj' is possibly 'null'.
  }
}
```

**Correct code:**
```typescript
function parse(obj: { id: string } | null) {
  if (obj !== null) {
    console.log(obj.id); // Safe!
  }
}
```

---

### 9. Rules to remember
1. Control-Flow Analysis narrows variable types across branches.
2. `typeof`, `instanceof`, `in`, and equality checks automatically narrow types.
3. Remember that `typeof null === "object"`.
4. Early returns narrow the remainder of the function.

---

### 10. Exercises

#### Question 1 (Predict the compile result)
Will the following code compile?
```typescript
function check(x: string | number) {
  if (typeof x === "string") {
    return;
  }
  console.log(x.toFixed(1));
}
```

#### Question 2 (Find and fix the bug)
Fix the narrowing error in the function below:
```typescript
function format(data: string | null) {
  if (typeof data === "object") {
    console.log("No data");
  } else {
    console.log(data.trim());
  }
}
```

#### Question 3 (Write code from scratch)
Write a function `runTask(task: { run: () => void } | { stop: () => void })` that uses the `in` operator to call either `.run()` or `.stop()`.

#### Question 4 (Explain in your own words)
How does an early `return` statement help TypeScript narrow types in the rest of a function?

---

### Solutions

#### Solution to Question 1
**Hint 1**: If `x` was a string, the function returned early. What is left?

**Answer**:
Yes, it compiles without error. After the `if (typeof x === "string") return;`, the only remaining possible type for `x` is `number`.

#### Solution to Question 2
**Hint 1**: `typeof null` is `"object"`, but `data` could be `null`!

**Answer**:
Check for `null` explicitly:
```typescript
function format(data: string | null) {
  if (data === null) {
    console.log("No data");
  } else {
    console.log(data.trim());
  }
}
```

#### Solution to Question 3
**Hint 1**: Use `"run" in task`.

**Answer**:
```typescript
function runTask(task: { run: () => void } | { stop: () => void }) {
  if ("run" in task) {
    task.run();
  } else {
    task.stop();
  }
}
```

#### Solution to Question 4
**Hint 1**: If execution cannot continue down the function when a condition is met, what does TypeScript do with that type?

**Answer**:
When an early return exits a branch, TypeScript removes the types handled in that branch from the rest of the function scope, leaving only the remaining unhandled types.

---

### 11. Recall

1. What is the process of refining a broad type to a specific type called?
2. What does `typeof null` return in JavaScript?
3. Which operator checks if a property key exists on an object to narrow types?

**If you remember only one thing:**
Control-Flow Analysis narrows variable types based on runtime checks like `typeof`, `instanceof`, and `in`.

---

# Checkpoint Challenge: Topics 6 to 10

### Challenge Scenario
You are writing a secure payment handler.

1. Create a branded type `PaymentId` (a string branded with `{ readonly __brand: "PaymentId" }`).
2. Write a smart constructor `toPaymentId(raw: string): PaymentId` that throws if `raw.length < 5`.
3. Create two payment request types:
   - `CardPayment`: `{ id: PaymentId; cardLast4: string }`
   - `CryptoPayment`: `{ id: PaymentId; walletAddress: string }`
4. Write a function `processPayment(payment: CardPayment | CryptoPayment)`:
   - Use the `in` operator to detect whether it is a `CardPayment` or `CryptoPayment`.
   - Print the appropriate details.

### Challenge Solution

```typescript
type PaymentId = string & { readonly __brand: "PaymentId" };

function toPaymentId(raw: string): PaymentId {
  if (raw.length < 5) {
    throw new Error("Payment ID too short");
  }
  return raw as PaymentId;
}

type CardPayment = { id: PaymentId; cardLast4: string };
type CryptoPayment = { id: PaymentId; walletAddress: string };

function processPayment(payment: CardPayment | CryptoPayment) {
  if ("cardLast4" in payment) {
    console.log(`Processing card payment: ${payment.cardLast4} (ID: ${payment.id})`);
  } else {
    console.log(`Processing crypto payment: ${payment.walletAddress} (ID: ${payment.id})`);
  }
}

const card = { id: toPaymentId("pay_12345"), cardLast4: "4242" };
processPayment(card);
```

---

# Topic 11: User-Defined Type Guards (`is`) and Assertion Functions (`asserts`)

### 1. What is it?
Native narrowing (`typeof`, `instanceof`) only works within the immediate scope. If you move your check into a separate helper function, TypeScript forgets the narrowed type.

A **User-Defined Type Guard** is a function whose return type uses a type predicate (`param is Type`). It tells TypeScript: "If this function returns `true`, narrow `param` to `Type`".

An **Assertion Function** uses `asserts param is Type` and tells TypeScript: "If this function does not throw an error, narrow `param` to `Type` in the current scope".

### 2. Why does it exist?
In production code, type checks are often complex and need to be reused across many files. Without type predicates, you would have to duplicate `if` checks everywhere. Type predicates let you extract clean, reusable type verification functions.

### 3. Basic example

```typescript
interface AdminUser {
  id: string;
  role: "admin";
}

interface MemberUser {
  id: string;
  role: "member";
}

type AppUser = AdminUser | MemberUser;

// Type Guard
function isAdmin(user: AppUser): user is AdminUser {
  return user.role === "admin";
}

function processUser(user: AppUser) {
  if (isAdmin(user)) {
    // Narrowed to AdminUser!
    console.log("Admin user:", user.id);
  } else {
    // Narrowed to MemberUser!
    console.log("Member user:", user.id);
  }
}
```

**Line-by-line explanation:**
- `function isAdmin(user: AppUser): user is AdminUser {`: Defines a type guard. The return type is not just `boolean`; it is a type predicate `user is AdminUser`.
- `return user.role === "admin";`: Returns `true` if `user.role` is `"admin"`.
- `if (isAdmin(user)) {`: When this condition evaluates to `true`, TypeScript narrows `user` from `AppUser` to `AdminUser` inside the `if` block.

---

### 4. How it works inside TypeScript
1. **Type Predicate Syntax**: `parameterName is TargetType`.
2. **Boolean Return**: The function must return a boolean.
3. **Compiler Integration**: When the compiler's Control-Flow Analysis sees an `if (guard(x))` check, it binds `x` to `TargetType` inside the `true` branch, and removes `TargetType` in the `else` branch.

---

### 5. Think first

What happens in `handleData` below? Will it compile? Decide first.

```typescript
function isString(val: unknown): boolean {
  return typeof val === "string";
}

function handleData(val: unknown) {
  if (isString(val)) {
    console.log(val.toUpperCase());
  }
}
```

---

**Answer and Reason:**

This code fails to compile:

```
Property 'toUpperCase' does not exist on type 'unknown'.
```

**Reason**: `isString` has return type `boolean`, NOT a type predicate (`val is string`). TypeScript knows the function returned a boolean, but it does NOT narrow `val`. Changing the return type to `val is string` fixes the error.

---

### 6. Try it yourself
Write a type guard `isNumber(val: unknown): val is number` that checks `typeof val === "number"`. Use it in a function to narrow an `unknown` parameter and calculate its square.

---

### 7. More examples

#### Example A: Assertion Signatures (`asserts condition`) (Medium)

```typescript
function assertIsDefined<T>(val: T): asserts val is NonNullable<T> {
  if (val === null || val === undefined) {
    throw new Error("Value is not defined");
  }
}

function printText(text: string | null) {
  assertIsDefined(text);
  // text is now narrowed to 'string' without an if-else block!
  console.log(text.trim());
}
```

**Line-by-line explanation:**
- `asserts val is NonNullable<T>`: If the function returns without throwing, `val` is guaranteed not to be `null` or `undefined` in all following lines.

---

### 8. Common mistakes

#### Mistake 1: Writing an incorrect predicate implementation

**Wrong code:**
```typescript
function isNumber(val: unknown): val is number {
  return true; // Bug!
}
```

**Why it happens:**
TypeScript trusts your type predicate. If your function returns `true` for a string, TypeScript will still treat it as a number, causing runtime crashes! Always verify the condition accurately.

---

### 9. Rules to remember
1. `param is Type` returns a boolean and narrows the parameter in `if` branches.
2. `asserts param is Type` throws on invalid inputs and narrows in the current scope.
3. TypeScript trusts your predicate logic; ensure your runtime check is accurate.

---

### 10. Exercises

#### Question 1 (Predict the compile result)
Will the following code compile?
```typescript
function checkArray(v: unknown): v is string[] {
  return Array.isArray(v);
}
function test(v: unknown) {
  if (checkArray(v)) {
    console.log(v.length);
  }
}
```

#### Question 2 (Find and fix the bug)
Fix `isPoint` so that `item` is properly narrowed:
```typescript
function isPoint(item: unknown): boolean {
  return typeof item === "object" && item !== null && "x" in item;
}
```

#### Question 3 (Write code from scratch)
Write an assertion function `assertNonEmptyString(val: unknown): asserts val is string` that throws if `val` is not a string or if `val.length === 0`.

#### Question 4 (Explain in your own words)
Why is `val is string` necessary instead of simply returning `boolean`?

---

### Solutions

#### Solution to Question 1
**Hint 1**: Does `Array.isArray` return boolean? Does `checkArray` use a type predicate?

**Answer**:
Yes, it compiles without error. `v` is narrowed to `string[]`, which has a `.length` property.

#### Solution to Question 2
**Hint 1**: Change `boolean` to a type predicate.

**Answer**:
```typescript
function isPoint(item: unknown): item is { x: number } {
  return typeof item === "object" && item !== null && "x" in item;
}
```

#### Solution to Question 3
**Hint 1**: Throw an Error if `typeof val !== "string" || val.length === 0`.

**Answer**:
```typescript
function assertNonEmptyString(val: unknown): asserts val is string {
  if (typeof val !== "string" || val.length === 0) {
    throw new Error("Value must be a non-empty string");
  }
}
```

#### Solution to Question 4
**Hint 1**: What information does `boolean` communicate to the compiler?

**Answer**:
A `boolean` return type only tells the compiler that the function produces true or false. It does not connect the boolean result to the type of the parameter. A type predicate (`val is string`) explicitly informs the compiler to narrow the parameter when the function returns true.

---

### 11. Recall

1. What syntax defines a type guard return type?
2. What syntax defines an assertion function?
3. If an assertion function finishes without throwing, what happens to the variable's type?

**If you remember only one thing:**
User-defined type guards let you extract reusable runtime checks that teach TypeScript how to narrow types.

---

# Topic 12: Discriminated Unions (Tagged Unions)

### 1. What is it?
A **Discriminated Union** (also called a Tagged Union) is a union of object types where every object has a common property (called the **discriminant** or tag) with a distinct literal type.

### 2. Why does it exist?
When working with complex state (like network requests: loading, success, error), different states need completely different data fields:
- `loading` needs progress percentage.
- `success` needs response payload.
- `error` needs error message.

A discriminated union allows you to represent these distinct states cleanly, while preventing invalid states (like having an error message while loading).

### 3. Basic example

```typescript
type NetworkState =
  | { status: "loading" }
  | { status: "success"; data: string }
  | { status: "error"; message: string };

function renderState(state: NetworkState) {
  switch (state.status) {
    case "loading":
      console.log("Loading...");
      break;
    case "success":
      console.log("Data:", state.data);
      break;
    case "error":
      console.log("Error:", state.message);
      break;
  }
}
```

**Line-by-line explanation:**
- `type NetworkState = ...`: Defines three variants. The common property `status` is the discriminant.
- `switch (state.status)`: Checks the discriminant tag.
- `case "success":`: Inside this case, TypeScript automatically narrows `state` to `{ status: "success"; data: string }`. You can access `state.data` safely.
- `case "error":`: Inside this case, TypeScript narrows `state` to `{ status: "error"; message: string }`. Accessing `state.data` here would cause a compile error.

---

### 4. How it works inside TypeScript
1. **Discriminant Detection**: TypeScript identifies properties that exist on all members of a union and hold literal types (`"loading"`, `"success"`, `"error"`).
2. **Branch Narrowing**: When you check `state.status === "success"`, TypeScript eliminates all variants whose tag is not `"success"`.
3. **Payload Access**: Once narrowed, only the properties that belong to that specific variant are accessible.

---

### 5. Think first

What happens if we try to read `state.data` in the `"loading"` case? Decide first.

```typescript
case "loading":
  console.log(state.data);
```

---

**Answer and Reason:**

This code fails to compile:

```
Property 'data' does not exist on type '{ status: "loading"; }'.
```

**Reason**: In the `"loading"` state, `data` is not defined. TypeScript prevents accessing data that is not part of the active state variant.

---

### 6. Try it yourself
Create a discriminated union `Shape`:
- `{ kind: "circle"; radius: number }`
- `{ kind: "square"; side: number }`

Write a function `calculateArea(shape: Shape): number`. Use a `switch` on `shape.kind` to calculate the area for each shape.

---

### 7. More examples

#### Example A: Discriminated Union with Exhaustiveness (Medium)

```typescript
type Result =
  | { ok: true; value: number }
  | { ok: false; error: string };

function handleResult(res: Result) {
  if (res.ok) {
    console.log("Success:", res.value);
  } else {
    console.log("Failed:", res.error);
  }
}
```

**Line-by-line explanation:**
- The discriminant here is `ok` with boolean literals `true` and `false`.
- Inside `if (res.ok)`, `res` is narrowed to `{ ok: true; value: number }`.

---

### 8. Common mistakes

#### Mistake 1: Using general types like `string` instead of literals for the discriminant

**Wrong code:**
```typescript
type State =
  | { status: string; data: string }
  | { status: string; error: string };
```

**Why it happens:**
If `status` is just `string`, TypeScript cannot tell the variants apart because both have `status: string`. The discriminant must use specific literal types (e.g., `"success"` and `"error"`).

---

### 9. Rules to remember
1. A discriminated union requires a shared property with unique literal values on every variant.
2. Checking the discriminant tag narrows the union to the exact matching variant.
3. Combine discriminated unions with `never` for exhaustive compile checks.

---

### 10. Exercises

#### Question 1 (Predict the compile result)
Will the following code compile?
```typescript
type Action =
  | { type: "add"; amount: number }
  | { type: "reset" };

function reducer(a: Action) {
  if (a.type === "reset") {
    console.log(a.amount);
  }
}
```

#### Question 2 (Find and fix the bug)
The discriminated union below fails to narrow. Fix the discriminant property type:
```typescript
type Event =
  | { kind: string; message: string }
  | { kind: string; code: number };
```

#### Question 3 (Write code from scratch)
Define a discriminated union `ApiResponse` with `status: 200` (holding `data: string`) and `status: 404` (holding `error: string`). Write a function to handle both statuses.

#### Question 4 (Explain in your own words)
Why are discriminated unions preferred over a single object with optional properties like `{ status: string; data?: string; error?: string }`?

---

### Solutions

#### Solution to Question 1
**Hint 1**: Does `amount` exist on the `"reset"` variant?

**Answer**:
No, it fails to compile with: `Property 'amount' does not exist on type '{ type: "reset"; }'`.

#### Solution to Question 2
**Hint 1**: Change `string` to distinct string literal types.

**Answer**:
```typescript
type Event =
  | { kind: "log"; message: string }
  | { kind: "error"; code: number };
```

#### Solution to Question 3
**Hint 1**: Use number literals `200` and `404` as the discriminant.

**Answer**:
```typescript
type ApiResponse =
  | { status: 200; data: string }
  | { status: 404; error: string };

function handleResponse(res: ApiResponse) {
  if (res.status === 200) {
    console.log(res.data);
  } else {
    console.log(res.error);
  }
}
```

#### Solution to Question 4
**Hint 1**: Think about invalid state combinations like having both `data` and `error` present at the same time.

**Answer**:
A single object with optional properties allows invalid states (such as both `data` and `error` being present, or neither being present). A discriminated union makes invalid states unrepresentable in the type system, ensuring you can only access `data` when `status` is success.

---

### 11. Recall

1. What is the shared literal property in a tagged union called?
2. What type of values must a discriminant hold?
3. What happens to the remaining object properties once the discriminant is checked?

**If you remember only one thing:**
Discriminated unions use a shared literal tag to make invalid states impossible and enable precise narrowing.

---

# Topic 13: `satisfies` Operator vs Type Assertions (`as`)

### 1. What is it?
Introduced in TypeScript 4.9, the `satisfies` operator validates that an expression matches a type **without changing or widening the inferred type** of the expression.

In contrast:
- A type annotation (`const x: Type = ...`) widens the type to `Type`.
- A type assertion (`const x = ... as Type`) forces TypeScript to accept the type, silencing error checks.

### 2. Why does it exist?
Often you want to ensure an object conforms to a schema (like a configuration or palette), but you also want to keep the exact literal types of its properties.

If you write `const palette: Record<string, string | number[]> = { red: "#ff0000" }`, TypeScript widens `palette.red` to `string | number[]`. Calling `palette.red.toUpperCase()` fails!
The `satisfies` operator validates that the object conforms to the schema while preserving that `palette.red` is specifically a `string`.

### 3. Basic example

```typescript
type Colors = Record<string, string | [number, number, number]>;

// Using satisfies:
const palette = {
  primary: "#ff0000",
  secondary: [0, 255, 0],
} satisfies Colors;

// Safe to call string methods on primary!
console.log(palette.primary.toUpperCase());

// Safe to access tuple indices on secondary!
console.log(palette.secondary[0]);
```

**Line-by-line explanation:**
- `type Colors = Record<string, string | [number, number, number]>;`: Defines the allowed types for color values.
- `const palette = { ... } satisfies Colors;`: TypeScript checks that `palette` matches `Colors`. If there is an invalid property, it reports an error.
- `palette.primary.toUpperCase()`: Because `satisfies` does not widen types, TypeScript knows `primary` is specifically a string. Calling `.toUpperCase()` is allowed.
- `palette.secondary[0]`: TypeScript knows `secondary` is specifically a 3-element tuple, allowing index access.

---

### 4. How it works inside TypeScript
1. **Validation Step**: The compiler checks that the expression on the left is assignable to the type on the right.
2. **Type Preservation**: Instead of assigning the type on the right to the variable, the compiler preserves the exact, inferred type of the literal.
3. **Comparison with `as`**:
   - `as Type` overrides the compiler's safety checks (can hide bugs).
   - `satisfies Type` enforces the compiler's safety checks while keeping specific types.

---

### 5. Think first

What happens if we replace `satisfies Colors` with `: Colors` in the code below? Decide first.

```typescript
type Colors = Record<string, string | number[]>;

const palette: Colors = {
  primary: "red",
};

console.log(palette.primary.toUpperCase());
```

---

**Answer and Reason:**

This code fails to compile:

```
Property 'toUpperCase' does not exist on type 'string | number[]'.
  Property 'toUpperCase' does not exist on type 'number[]'.
```

**Reason**: Using `: Colors` widened `primary` from `string` to `string | number[]`. Because `number[]` does not have `.toUpperCase`, TypeScript rejects the call. Using `satisfies Colors` avoids this widening.

---

### 6. Try it yourself
Create a type `Config = Record<string, string | number>`. Create a configuration object `{ host: "localhost", port: 8080 }` using `satisfies Config`. Call `.toLowerCase()` on `host` and `.toFixed(0)` on `port` without any type errors.

---

### 7. More examples

#### Example A: Catching Typos with `satisfies` (Medium)

```typescript
type RouteConfig = Record<string, { path: string }>;

// Error: 'patth' does not exist in type '{ path: string; }'
// const routes = {
//   home: { patth: "/" }
// } satisfies RouteConfig;
```

**Line-by-line explanation:**
- `satisfies` catches the typo `patth` immediately during compilation.

---

### 8. Common mistakes

#### Mistake 1: Using `as` to silence errors instead of fixing them

**Wrong code:**
```typescript
const user = { name: "Alex" } as { name: string; age: number };
// Compiles, but user.age is undefined at runtime!
```

**Why it happens:**
`as` forces the compiler to trust you. If the object does not actually have `age`, you get runtime bugs. `satisfies` never lies to the compiler.

---

### 9. Rules to remember
1. `satisfies` validates conformance without widening types.
2. `: Type` annotates and widens the variable type.
3. `as Type` asserts and forces the compiler to trust the type.
4. Prefer `satisfies` over `as` whenever validating objects.

---

### 10. Exercises

#### Question 1 (Predict the compile result)
Will the following code compile?
```typescript
type SettingMap = Record<string, boolean | number>;
const settings = {
  darkMode: true,
  volume: 50,
} satisfies SettingMap;

const isDark: boolean = settings.darkMode;
```

#### Question 2 (Find and fix the bug)
The code below fails on line 6. Fix it using `satisfies`:
```typescript
type Form = Record<string, string | number>;
const form: Form = {
  title: "Contact",
  id: 1,
};
console.log(form.title.trim());
```

#### Question 3 (Write code from scratch)
Define a type `Endpoints = Record<string, string>`. Create an object `api` with properties `login` and `logout` validated by `satisfies Endpoints`.

#### Question 4 (Explain in your own words)
Why is `satisfies` safer than a type assertion with `as`?

---

### Solutions

#### Solution to Question 1
**Hint 1**: Does `satisfies` preserve the inferred type of `darkMode`?

**Answer**:
Yes, it compiles without error. `settings.darkMode` is preserved as `boolean` (specifically `true`), so assigning it to `boolean` succeeds.

#### Solution to Question 2
**Hint 1**: Replace `: Form` with `satisfies Form`.

**Answer**:
```typescript
type Form = Record<string, string | number>;
const form = {
  title: "Contact",
  id: 1,
} satisfies Form;
console.log(form.title.trim());
```

#### Solution to Question 3
**Hint 1**: Write `const api = { ... } satisfies Endpoints;`.

**Answer**:
```typescript
type Endpoints = Record<string, string>;
const api = {
  login: "/api/login",
  logout: "/api/logout",
} satisfies Endpoints;
```

#### Solution to Question 4
**Hint 1**: Think about what happens if you make a mistake in the object.

**Answer**:
`as` forces the compiler to accept a type even if properties are missing or wrong, hiding runtime bugs. `satisfies` strictly checks that the object matches the target type, catching errors while preserving exact types.

---

### 11. Recall

1. What operator validates a type without widening its properties?
2. What operator forces the compiler to accept a type, potentially hiding bugs?
3. Which TypeScript version introduced `satisfies`?

**If you remember only one thing:**
Use `satisfies` to validate that data matches a type while preserving its exact literal types.

---

# Topic 14: Literal Types and `as const` Assertions

### 1. What is it?
By default, when you declare a variable with `let` or create an object, TypeScript widens literal values like `"GET"` to `string`, and `42` to `number`.

An `as const` assertion (also called a **const assertion**) tells TypeScript:
1. Do not widen primitive literals (keep `"GET"` as `"GET"`).
2. Mark all object properties as `readonly`.
3. Treat arrays as fixed-length `readonly` tuples.

### 2. Why does it exist?
In JavaScript, arrays and objects are mutable. TypeScript widens their types because you might reassign or push new elements to them later.

However, in configuration objects or constant lists (like HTTP methods or status codes), you want the values to be permanently fixed. `as const` locks down their types completely.

### 3. Basic example

```typescript
// 1. Without const assertion:
const method1 = "GET"; // Type is "GET" because it's a const primitive

const config1 = {
  method: "GET", // Inferred as: string!
};

// 2. With const assertion:
const config2 = {
  method: "GET",
} as const; // Inferred as: { readonly method: "GET" }
```

**Line-by-line explanation:**
- `const config1 = { method: "GET" };`: In an object literal, TypeScript assumes properties may change, so it infers `method` as `string`.
- `const config2 = { method: "GET" } as const;`: The `as const` assertion locks the property type to `"GET"` and marks it `readonly`.

---

### 4. How it works inside TypeScript
1. **No Widening**: String, number, and boolean literals are kept as literal types.
2. **Deep Readonly**: Every nested property in the object becomes `readonly`.
3. **Tuple Inference**: Array literals become readonly tuples (`readonly ["a", "b"]`) instead of mutable arrays (`string[]`).

---

### 5. Think first

What happens when we try to push a new number to `numbers` below? Decide first.

```typescript
const numbers = [1, 2, 3] as const;
numbers.push(4);
```

---

**Answer and Reason:**

This code fails to compile:

```
Property 'push' does not exist on type 'readonly [1, 2, 3]'.
```

**Reason**: `as const` turns the array into a `readonly` tuple. Methods that mutate arrays (`push`, `pop`, `splice`) do not exist on readonly tuples.

---

### 6. Try it yourself
Create an array of roles `const ROLES = ["admin", "member", "guest"] as const;`. Extract a union type of all roles using `type Role = (typeof ROLES)[number];`. Verify that `Role` evaluates to `"admin" | "member" | "guest"`.

---

### 7. More examples

#### Example A: Extracting Union Types from Arrays (Medium)

```typescript
const HTTP_METHODS = ["GET", "POST", "PUT", "DELETE"] as const;

// Deriving the union type:
type HttpMethod = (typeof HTTP_METHODS)[number];
// Evaluates to: "GET" | "POST" | "PUT" | "DELETE"

function request(url: string, method: HttpMethod) {
  console.log(method, url);
}

request("/users", "GET"); // Valid
// request("/users", "PATCH"); // Error!
```

**Line-by-line explanation:**
- `const HTTP_METHODS = [...] as const;`: Creates a readonly tuple of string literals.
- `(typeof HTTP_METHODS)[number]`: Indexes into the tuple by number, producing a union of all element types.

---

### 8. Common mistakes

#### Mistake 1: Trying to modify properties on an `as const` object

**Wrong code:**
```typescript
const settings = { theme: "dark" } as const;
settings.theme = "light";
```

**Error output:**
```
Cannot assign to 'theme' because it is a read-only property.
```

**Why it happens:**
`as const` marks all properties as `readonly`.

---

### 9. Rules to remember
1. `as const` prevents literal widening.
2. `as const` marks object properties as `readonly`.
3. `as const` turns array literals into `readonly` tuples.
4. Use `(typeof CONST_ARRAY)[number]` to derive union types from constant lists.

---

### 10. Exercises

#### Question 1 (Predict the compile result)
What is the inferred type of `coords`?
```typescript
const coords = [10, 20] as const;
```

#### Question 2 (Find and fix the bug)
The function below expects `"asc"` or `"desc"`, but passing `options.order` fails. Fix it:
```typescript
function sortData(order: "asc" | "desc") {}
const options = { order: "asc" };
sortData(options.order);
```

#### Question 3 (Write code from scratch)
Create a constant object `STATUS_CODES` with properties `OK: 200` and `NOT_FOUND: 404` using `as const`. Derive a type `StatusCode` representing the union of their values (`200 | 404`).

#### Question 4 (Explain in your own words)
Why does TypeScript infer `string` instead of literal `"GET"` on object properties unless `as const` is used?

---

### Solutions

#### Solution to Question 1
**Hint 1**: Does `as const` make it a mutable array or a readonly tuple?

**Answer**:
The type is `readonly [10, 20]`.

#### Solution to Question 2
**Hint 1**: Add `as const` to `options`.

**Answer**:
```typescript
function sortData(order: "asc" | "desc") {}
const options = { order: "asc" } as const;
sortData(options.order);
```

#### Solution to Question 3
**Hint 1**: Use `as const` and index with `keyof typeof STATUS_CODES`.

**Answer**:
```typescript
const STATUS_CODES = {
  OK: 200,
  NOT_FOUND: 404,
} as const;

type StatusCode = (typeof STATUS_CODES)[keyof typeof STATUS_CODES];
```

#### Solution to Question 4
**Hint 1**: In JavaScript, are object properties mutable?

**Answer**:
In JavaScript, properties on objects can be reassigned at any time. TypeScript assumes you may reassign `method` to another string later, so it widens the type to `string`. `as const` tells TypeScript that the object is permanently immutable.

---

### 11. Recall

1. What assertion locks primitive literals and marks objects readonly?
2. What type does an array literal become when asserted with `as const`?
3. How do you extract a union of array element types from an `as const` array?

**If you remember only one thing:**
`as const` prevents literal widening, marks object properties readonly, and turns arrays into fixed tuples.

---

# Final Checkpoint Challenge: Topics 11 to 14

### Challenge Scenario
Build a type-safe action dispatcher for a state management system:

1. Create a constant array of action types:
   ```typescript
   const ACTION_TYPES = ["LOGIN", "LOGOUT", "SET_THEME"] as const;
   ```
2. Derive a union type `ActionType` from `ACTION_TYPES`.
3. Create a discriminated union `AppAction`:
   - `{ type: "LOGIN"; userId: string }`
   - `{ type: "LOGOUT" }`
   - `{ type: "SET_THEME"; theme: "dark" | "light" }`
4. Write a user-defined type guard `isLoginAction(action: AppAction): action is { type: "LOGIN"; userId: string }`.
5. Create a default state object `{ theme: "dark", loggedIn: false }` and validate it using `satisfies Record<string, unknown>`.

### Challenge Solution

```typescript
const ACTION_TYPES = ["LOGIN", "LOGOUT", "SET_THEME"] as const;
type ActionType = (typeof ACTION_TYPES)[number];

type AppAction =
  | { type: "LOGIN"; userId: string }
  | { type: "LOGOUT" }
  | { type: "SET_THEME"; theme: "dark" | "light" };

function isLoginAction(
  action: AppAction
): action is { type: "LOGIN"; userId: string } {
  return action.type === "LOGIN";
}

const defaultState = {
  theme: "dark",
  loggedIn: false,
} satisfies Record<string, unknown>;

function handleAction(action: AppAction) {
  if (isLoginAction(action)) {
    console.log("Logged in user:", action.userId);
  } else if (action.type === "SET_THEME") {
    console.log("Updated theme to:", action.theme);
  } else {
    console.log("Logged out");
  }
}

const action: AppAction = { type: "LOGIN", userId: "usr_99" };
handleAction(action);
```
