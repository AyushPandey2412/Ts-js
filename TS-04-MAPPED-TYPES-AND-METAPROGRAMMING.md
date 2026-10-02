# Module TS-04: Mapped Types, Modifiers & Metaprogramming

Welcome to TypeScript Mapped Types, Modifiers, and Metaprogramming. This module teaches how to iterate over object property keys, transform object shapes, add or remove modifiers, and generate dynamic data types at compile time.

---

# Topic 1: What Are Mapped Types? (`[K in keyof T]: T[K]`)

### 1. What is it?
A mapped type is a type that builds a new object type by iterating over the property keys of an existing type.

Just as `Array.prototype.map()` in JavaScript loops over each element of an array to create a new array, a mapped type loops over each property in an object type to create a new object type:
```typescript
type Mapped<T> = {
  [K in keyof T]: T[K];
};
```

### 2. Why does it exist?
In real applications, you often need multiple variations of the same model:
- An entity model where all properties are required.
- An update payload (DTO) where all properties are optional.
- A frozen snapshot where all properties are `readonly`.

Without mapped types, you would have to write and maintain three or four duplicate interfaces for every single model. If an entity changes, secondary interfaces fall out of sync, causing bugs. Mapped types allow you to derive new variations from a single source of truth automatically.

### 3. Basic example

```typescript
type User = {
  id: string;
  name: string;
  age: number;
};

// Create a mapped type that wraps every property value in a function
type PropertyGetters<T> = {
  [K in keyof T]: () => T[K];
};

type UserGetters = PropertyGetters<User>;
```

**Line-by-line explanation:**
- `type PropertyGetters<T> = {`: Declares a generic mapped type with type parameter `T`.
- `[K in keyof T]:`: Loops over every key `K` in `keyof T` (for `User`, this is `"id" | "name" | "age"`).
- `() => T[K];`: Sets the value type for property `K` to a function returning `T[K]`.
- `type UserGetters = PropertyGetters<User>;`: Produces:
  ```typescript
  {
    id: () => string;
    name: () => string;
    age: () => number;
  }
  ```

---

### 4. How it works inside TypeScript
1. **Key Extraction**: The compiler evaluates `keyof T` to obtain the union of property names.
2. **Property Iteration**: The `[K in ...]` syntax acts as a type-level `for...in` loop over each property key.
3. **Value Transformation**: For each key `K`, the compiler evaluates the expression on the right side of the colon (`:`) and assigns it as the new property value type.
4. **Object Construction**: The compiler emits a new object type containing all iterated properties.

---

### 5. Think first

What is the resulting shape of `Result` in the code below? Decide first.

```typescript
type Point = { x: number; y: number };

type Stringify<T> = {
  [K in keyof T]: string;
};

type Result = Stringify<Point>;
```

---

**Answer and Reason:**

The resulting type is:

```typescript
{
  x: string;
  y: string;
}
```

**Reason**: `keyof Point` is `"x" | "y"`. For every key, `Stringify` sets the value type to `string`. The resulting object has properties `x: string` and `y: string`.

---

### 6. Try it yourself
Create an object type `Config = { theme: string; port: number }`. Write a mapped type `Nullable<T> = { [K in keyof T]: T[K] | null }`. Apply it to `Config` and create a valid object.

---

### 7. More examples

#### Example A: The Identity Mapped Type (Easy)

```typescript
type Clone<T> = {
  [K in keyof T]: T[K];
};

type UserClone = Clone<User>;
// Produces an identical copy of User.
```

**Line-by-line explanation:**
- Reads each key `K` and assigns its exact existing type `T[K]`.

#### Example B: Boolean Flags for Every Property (Medium)

```typescript
type DirtyFlags<T> = {
  [K in keyof T]: boolean;
};

type UserDirtyFlags = DirtyFlags<User>;
// { id: boolean; name: boolean; age: boolean }
```

---

### 8. Common mistakes

#### Mistake 1: Trying to use mapped type syntax inside an `interface`

**Wrong code:**
```typescript
interface BadMapped<T> {
  // [K in keyof T]: T[K]; // Syntax Error!
}
```

**Why it happens:**
Mapped types can only be declared using type aliases (`type Mapped<T> = { ... }`), never inside `interface` declarations.

---

### 9. Rules to remember
1. Mapped types iterate over property keys using `[K in keyof T]`.
2. Mapped types must be declared with `type`, not `interface`.
3. The right side of the colon specifies the new type for each property.

---

### 10. Exercises

#### Question 1 (Predict the compile result)
What is the resulting type of `Output`?
```typescript
type Original = { a: number; b: boolean };
type Wrap<T> = { [K in keyof T]: [T[K]] };
type Output = Wrap<Original>;
```

#### Question 2 (Find and fix the bug)
Fix the syntax error in the mapped type below:
```typescript
interface MakeOptional<T> {
  [K in keyof T]?: T[K];
}
```

#### Question 3 (Write code from scratch)
Write a mapped type `PromiseBox<T>` that wraps every property value of an object in a `Promise`. Test it on `{ id: string; count: number }`.

#### Question 4 (Explain in your own words)
Why does TypeScript require mapped types to be defined as `type` aliases instead of `interface` declarations?

---

### Solutions

#### Solution to Question 1
**Hint 1**: Wrap each property type in a 1-element tuple.

**Answer**:
`Output` is `{ a: [number]; b: [boolean] }`.

#### Solution to Question 2
**Hint 1**: Change `interface` to `type MakeOptional<T> = { ... }`.

**Answer**:
```typescript
type MakeOptional<T> = {
  [K in keyof T]?: T[K];
};
```

#### Solution to Question 3
**Hint 1**: Wrap `T[K]` with `Promise<T[K]>`.

**Answer**:
```typescript
type PromiseBox<T> = {
  [K in keyof T]: Promise<T[K]>;
};

type Result = PromiseBox<{ id: string; count: number }>;
// { id: Promise<string>; count: Promise<number> }
```

#### Solution to Question 4
**Hint 1**: Interfaces in TypeScript are open and support declaration merging.

**Answer**:
Interfaces can be reopened and extended through declaration merging. Mapped types perform an immediate computational loop over a fixed set of keys, which conflicts with the open, mergeable nature of interfaces. Therefore, mapped types are restricted to type aliases.

---

### 11. Recall

1. What syntax loops over keys in a mapped type?
2. Can a mapped type be declared using an `interface`?
3. What does `T[K]` represent inside a mapped type?

**If you remember only one thing:**
Mapped types loop over an object's keys to transform property values into a new object type.

---

# Topic 2: Homomorphic vs Non-Homomorphic Mapped Types

### 1. What is it?
A mapped type is **homomorphic** if it operates directly over `keyof T` (for example, `[K in keyof T]`).

A mapped type is **non-homomorphic** if it iterates over an arbitrary union of keys that is not directly tied to a type parameter's `keyof` (for example, `[K in "a" | "b"]`).

### 2. Why does it exist?
When you transform an object, you often want to preserve its original modifiers:
- If a property was `readonly`, it should remain `readonly`.
- If a property was optional (`?`), it should remain optional.
- If the input was an array or tuple (`[string, number]`), the result should remain a tuple, not an object with numeric keys.

Homomorphic mapped types automatically preserve these modifiers and array/tuple structures. Non-homomorphic mapped types create a plain, bare dictionary without inheriting modifiers.

### 3. Basic example

```typescript
type User = {
  readonly id: string;
  name?: string;
};

// 1. Homomorphic: iterates directly over keyof T
type HomomorphicCopy<T> = {
  [K in keyof T]: T[K];
};

type UserCopy = HomomorphicCopy<User>;
// Preserves: readonly id: string; name?: string;

// 2. Non-Homomorphic: iterates over a hardcoded union
type NonHomomorphicCopy<Keys extends keyof any> = {
  [K in Keys]: string;
};

type BareDict = NonHomomorphicCopy<"id" | "name">;
// Strips modifiers: id: string; name: string; (Not readonly, not optional!)
```

**Line-by-line explanation:**
- `HomomorphicCopy`: Because the syntax uses `[K in keyof T]`, TypeScript recognizes the link to `T`. It copies the `readonly` modifier on `id` and the optional `?` modifier on `name`.
- `NonHomomorphicCopy`: Iterates over keys independently of a source object. Modifiers are not inherited.

---

### 4. How it works inside TypeScript
1. **Modifier Inheritance**: In homomorphic mapped types, the compiler automatically copies `readonly` and `?` attributes from `T` to the new properties.
2. **Tuple Preservation**: When applied to a tuple `[string, number]`, a homomorphic mapped type returns a tuple `[NewA, NewB]`. A non-homomorphic mapped type would degrade into an object with string keys `{"0": ..., "1": ...}`.

---

### 5. Think first

What happens when we pass a tuple `[number, string]` to a homomorphic mapped type? Does it return a tuple or an object? Decide first.

```typescript
type Wrap<T> = {
  [K in keyof T]: Promise<T[K]>;
};

type Result = Wrap<[number, string]>;
```

---

**Answer and Reason:**

The resulting type is:

```typescript
[Promise<number>, Promise<string>]
```

**Reason**: Because `Wrap` is homomorphic (`[K in keyof T]`), TypeScript preserves the tuple structure. It maps each tuple element to `Promise<T[K]>` and returns a 2-element tuple.

---

### 6. Try it yourself
Create an interface `ReadonlyPoint = { readonly x: number; readonly y: number }`. Apply `HomomorphicCopy` to it and verify that the properties on the result remain `readonly`.

---

### 7. More examples

#### Example A: Mapping Over Tuples Preserves Length (Medium)

```typescript
type StringifyList<T> = {
  [K in keyof T]: string;
};

type TupleOut = StringifyList<[1, 2, 3]>;
// Inferred as: [string, string, string]
```

**Line-by-line explanation:**
- Preserves the fixed 3-element tuple length.

---

### 8. Common mistakes

#### Mistake 1: Expecting a non-homomorphic mapped type to preserve optionality

**Wrong assumption:**
```typescript
type PickKeys<Keys extends string> = { [K in Keys]: number };
// If you pass keys from an optional interface, optionality is lost!
```

**Why it happens:**
Only `[K in keyof T]` has access to the original property descriptors.

---

### 9. Rules to remember
1. Homomorphic mapped types use `[K in keyof T]`.
2. Homomorphic mapped types preserve `readonly`, optional (`?`), and tuple structures.
3. Non-homomorphic mapped types do not inherit modifiers.

---

### 10. Exercises

#### Question 1 (Predict the compile result)
Is `type M<T> = { [K in keyof T]: boolean }` homomorphic or non-homomorphic?

#### Question 2 (Find and fix the bug)
The mapped type below is non-homomorphic and loses tuple mechanics. Rewrite it as homomorphic:
```typescript
type Convert<T, Keys extends keyof T> = { [K in Keys]: string };
```

#### Question 3 (Write code from scratch)
Declare a tuple `type Coords = readonly [number, number]`. Write a homomorphic mapped type that turns all elements into `string`. Verify that the result remains `readonly`.

#### Question 4 (Explain in your own words)
Why is it beneficial that homomorphic mapped types preserve tuple structures?

---

### Solutions

#### Solution to Question 1
**Hint 1**: Does it iterate directly over `keyof T`?

**Answer**:
It is homomorphic because it uses `[K in keyof T]`.

#### Solution to Question 2
**Hint 1**: Iterate directly over `keyof T`.

**Answer**:
```typescript
type Convert<T> = { [K in keyof T]: string };
```

#### Solution to Question 3
**Hint 1**: Use `{ [K in keyof T]: string }`.

**Answer**:
```typescript
type Coords = readonly [number, number];
type ToString<T> = { [K in keyof T]: string };
type Result = ToString<Coords>; // readonly [string, string]
```

#### Solution to Question 4
**Hint 1**: What happens to array methods and fixed lengths if a tuple becomes a plain object?

**Answer**:
If tuples were converted into plain objects with numeric keys, you would lose tuple length checking, positional destructuring, and array methods. Preserving tuples allows mapped types to work seamlessly on function parameter lists and fixed data arrays.

---

### 11. Recall

1. What makes a mapped type homomorphic?
2. Do homomorphic mapped types preserve `readonly` modifiers?
3. What happens when a homomorphic mapped type is applied to a tuple?

**If you remember only one thing:**
Homomorphic mapped types (`[K in keyof T]`) automatically preserve property modifiers and tuple structures from the input type.

---

# Topic 3: Making Properties Optional or Required with `+?` and `-?` (`Partial<T>` and `Required<T>`)

### 1. What is it?
Mapped types support modifier algebra:
- `+?` (or simply `?`): Adds the optional modifier to all properties.
- `-?`: Removes the optional modifier, forcing every property to be required.

TypeScript provides two standard utility types built using this syntax:
- `Partial<T>`: Makes all properties optional.
- `Required<T>`: Makes all properties required.

### 2. Why does it exist?
When creating or updating entities, requirements differ:
- When updating a user via a PATCH API, the client can send any subset of fields. All properties should be optional (`Partial<User>`).
- When validating a completed profile, all optional fields must have been filled in. All properties should be required (`Required<User>`).

Modifier algebra lets you toggle optionality without writing new interfaces.

### 3. Basic example

```typescript
type User = {
  id: string;
  name: string;
  age?: number;
};

// 1. Partial: Makes all properties optional
type UpdateUserDto = Partial<User>;
// { id?: string; name?: string; age?: number }

// 2. Required: Strips all '?' modifiers, making all properties required
type CompleteUser = Required<User>;
// { id: string; name: string; age: number }
```

**Line-by-line explanation:**
- `Partial<User>`: Adds `?` to `id` and `name`. `age` was already optional and remains optional.
- `Required<User>`: Strips `?` from `age` using `-?`. Every property is now strictly required.

---

### 4. How it works inside TypeScript
Here are the official definitions from `lib.d.ts`:

```typescript
// Official TypeScript source code:
type Partial<T> = {
  [P in keyof T]?: T[P];
};

type Required<T> = {
  [P in keyof T]-?: T[P];
};
```

**The `-?` Modifier**:
The minus sign `-` explicitly deletes the `?` token from each property descriptor during mapping.

---

### 5. Think first

What happens if you assign `{ id: "1" }` to a variable of type `Required<User>`? Decide first.

```typescript
type User = { id: string; name?: string };
const user: Required<User> = { id: "1" };
```

---

**Answer and Reason:**

This code fails to compile:

```
Property 'name' is missing in type '{ id: string; }' but required in type 'Required<User>'.
```

**Reason**: `Required<User>` stripped the `?` from `name`. Both `id` and `name` must be provided.

---

### 6. Try it yourself
Create an interface `Settings = { volume?: number; theme?: string }`. Use `Required<Settings>` to create an object where both properties must be specified.

---

### 7. More examples

#### Example A: Patch Update Function (Medium)

```typescript
type Profile = {
  id: string;
  bio: string;
  avatarUrl: string;
};

function updateProfile(id: string, updates: Partial<Profile>) {
  console.log("Updating", id, "with", updates);
}

// Any subset of fields is valid:
updateProfile("usr_1", { bio: "Hello world" });
updateProfile("usr_2", { avatarUrl: "https://example.com/pic.png" });
```

---

### 8. Common mistakes

#### Mistake 1: Confusing optional properties with `undefined` values

**Wrong assumption:**
Assuming `Partial<T>` allows `{ name: undefined }` when `exactOptionalPropertyTypes: true` is enabled.

**Reality:**
With `exactOptionalPropertyTypes` enabled, an optional property means the property can be omitted, not that it can be assigned `undefined`.

---

### 9. Rules to remember
1. `?` or `+?` adds optionality to all properties (`Partial<T>`).
2. `-?` removes optionality, making all properties required (`Required<T>`).
3. Modifiers operate across all iterated keys.

---

### 10. Exercises

#### Question 1 (Predict the compile result)
Will the following code compile?
```typescript
type Entity = { title?: string };
const e: Required<Entity> = {};
```

#### Question 2 (Find and fix the bug)
Write `MyRequired<T>` from scratch using modifier algebra:
```typescript
type MyRequired<T> = {
  [K in keyof T]+?: T[K]; // Bug: This makes it optional!
};
```

#### Question 3 (Write code from scratch)
Create a type `Article = { title: string; body: string; tags?: string[] }`. Use `Partial` to declare a variable that only specifies `title`.

#### Question 4 (Explain in your own words)
How does the `-?` token differ from simply omitting the `?` token in a mapped type?

---

### Solutions

#### Solution to Question 1
**Hint 1**: Is `title` required on `Required<Entity>`?

**Answer**:
No, it fails. `Required<Entity>` requires `title` to be present.

#### Solution to Question 2
**Hint 1**: Replace `+?` with `-?`.

**Answer**:
```typescript
type MyRequired<T> = {
  [K in keyof T]-?: T[K];
};
```

#### Solution to Question 3
**Hint 1**: `const draft: Partial<Article> = { title: "Draft" };`.

**Answer**:
```typescript
type Article = { title: string; body: string; tags?: string[] };
const draft: Partial<Article> = {
  title: "My First Post",
};
```

#### Solution to Question 4
**Hint 1**: Think about homomorphic inheritance of modifiers.

**Answer**:
In a homomorphic mapped type, omitting the `?` token inherits the existing optionality of the input type (optional properties stay optional). Using `-?` explicitly strips the optional modifier, converting previously optional properties into required properties.

---

### 11. Recall

1. What syntax removes optionality in a mapped type?
2. What built-in utility makes all properties optional?
3. What built-in utility makes all properties required?

**If you remember only one thing:**
Use `+?` (`Partial`) to make properties optional, and `-?` (`Required`) to force properties to be required.

---

# Topic 4: Making Properties Immutable or Mutable with `+readonly` and `-readonly` (`Readonly<T>`)

### 1. What is it?
Just like optionality, `readonly` modifiers support additive and subtractive algebra:
- `+readonly` (or `readonly`): Marks every property as read-only.
- `-readonly`: Removes the `readonly` modifier, making every property mutable.

TypeScript provides the built-in utility `Readonly<T>`, and you can write a `Mutable<T>` utility using `-readonly`.

### 2. Why does it exist?
In JavaScript, objects passed to functions can be mutated by reference, causing unexpected side effects.

Marking types with `Readonly<T>` ensures that callers cannot reassign properties after creation. Conversely, when you need to clone or initialize an object that was originally marked readonly, `-readonly` lets you strip the restriction cleanly.

### 3. Basic example

```typescript
type Config = {
  endpoint: string;
  port: number;
};

// 1. Readonly: Freezes properties at compile time
type LockedConfig = Readonly<Config>;

const config: LockedConfig = { endpoint: "/api", port: 8080 };
// config.port = 9000; // Compile Error: Cannot assign to 'port' because it is a read-only property.

// 2. Mutable: Strips readonly
type Mutable<T> = {
  -readonly [K in keyof T]: T[K];
};

type UnlockedConfig = Mutable<LockedConfig>;
const editable: UnlockedConfig = { endpoint: "/api", port: 8080 };
editable.port = 9000; // Allowed!
```

**Line-by-line explanation:**
- `Readonly<Config>`: Applies `readonly` to every property of `Config`. Reassigning `config.port` triggers a compile error.
- `Mutable<T>`: Uses `-readonly` to delete the `readonly` flag from each property, allowing reassignments.

---

### 4. How it works inside TypeScript
Here is the official definition of `Readonly<T>` from `lib.d.ts`:

```typescript
type Readonly<T> = {
  readonly [P in keyof T]: T[P];
};
```

**The `-readonly` modifier**:
The `-readonly` syntax instructs the compiler's type checker to clear the `ReadOnly` bit flag on each property symbol.

---

### 5. Think first

What happens when we attempt to modify an array marked with `Readonly<number[]>`? Decide first.

```typescript
const numbers: Readonly<number[]> = [1, 2, 3];
numbers.push(4);
```

---

**Answer and Reason:**

This code fails to compile:

```
Property 'push' does not exist on type 'readonly number[]'.
```

**Reason**: `Readonly` on an array removes all mutating methods (`push`, `pop`, `splice`).

---

### 6. Try it yourself
Define an interface `Point = { readonly x: number; readonly y: number }`. Write a mapped type `MutablePoint = Mutable<Point>` that removes `readonly`. Create an instance and reassign its `x` property.

---

### 7. More examples

#### Example A: Deep Immutability Caveat (Medium)

```typescript
type Nested = {
  user: {
    name: string;
  };
};

const data: Readonly<Nested> = {
  user: { name: "Alex" },
};

// data.user = { name: "Jordan" }; // Error: user is readonly!
data.user.name = "Jordan"; // Allowed! Nested object is NOT readonly!
```

**Line-by-line explanation:**
- Standard `Readonly<T>` is **shallow**. It only protects top-level properties. We will cover `DeepReadonly` in Topic 13.

---

### 8. Common mistakes

#### Mistake 1: Expecting `Readonly<T>` to freeze objects at runtime

**Wrong assumption:**
Thinking `Readonly<T>` calls `Object.freeze()` automatically.

**Reality:**
TypeScript types are completely erased at compile time. At runtime, the object is a regular, mutable JavaScript object unless you explicitly call `Object.freeze()`.

---

### 9. Rules to remember
1. `readonly` or `+readonly` marks properties read-only (`Readonly<T>`).
2. `-readonly` strips the read-only flag, restoring mutability.
3. Standard `Readonly<T>` is shallow; nested objects remain mutable.
4. `Readonly` checks exist only during compilation.

---

### 10. Exercises

#### Question 1 (Predict the compile result)
Will the following code compile?
```typescript
type Data = { id: string };
const d: Readonly<Data> = { id: "1" };
d.id = "2";
```

#### Question 2 (Find and fix the bug)
Write a `Mutable<T>` utility that removes `readonly` from all properties:
```typescript
type Mutable<T> = {
  [K in keyof T]: T[K]; // Bug: Homomorphic mapped type inherits readonly!
};
```

#### Question 3 (Write code from scratch)
Create an interface `Settings = { readonly theme: string; readonly volume: number }`. Write a function `updateSettings(s: Mutable<Settings>)` that mutates `s.volume = 50`.

#### Question 4 (Explain in your own words)
Why does `[K in keyof T]: T[K]` without `-readonly` fail to make an object mutable?

---

### Solutions

#### Solution to Question 1
**Hint 1**: Is `id` read-only?

**Answer**:
No, it fails. `d.id` cannot be reassigned because it is `readonly`.

#### Solution to Question 2
**Hint 1**: Add `-readonly` before `[K in keyof T]`.

**Answer**:
```typescript
type Mutable<T> = {
  -readonly [K in keyof T]: T[K];
};
```

#### Solution to Question 3
**Hint 1**: Use `-readonly` in `Mutable<T>`.

**Answer**:
```typescript
type Settings = { readonly theme: string; readonly volume: number };
type Mutable<T> = { -readonly [K in keyof T]: T[K] };

function updateSettings(s: Mutable<Settings>) {
  s.volume = 50;
}
```

#### Solution to Question 4
**Hint 1**: Remember homomorphic inheritance of modifiers from Topic 2.

**Answer**:
Because `[K in keyof T]` is a homomorphic mapped type, it automatically copies all existing modifiers from `T` to the new type. If a property was `readonly` in `T`, it remains `readonly` unless explicitly removed with `-readonly`.

---

### 11. Recall

1. What modifier makes a property read-only?
2. What modifier removes read-only restrictions?
3. Is built-in `Readonly<T>` shallow or deep?

**If you remember only one thing:**
Use `+readonly` to lock properties and `-readonly` to unlock them.

---

# Topic 5: Constructing Dictionary Types with `Record<K, T>`

### 1. What is it?
`Record<K, T>` is a built-in utility type that constructs an object type whose property keys are `K` and whose property values are `T`:
```typescript
type Record<K extends keyof any, T> = {
  [P in K]: T;
};
```

### 2. Why does it exist?
In JavaScript, objects are frequently used as key-value dictionaries or lookup maps (for example, mapping user IDs to user objects, or error codes to error messages).

`Record<K, T>` allows you to define these dictionary types cleanly in one line, while strictly controlling which keys are allowed and what values they hold.

### 3. Basic example

```typescript
type Page = "home" | "about" | "contact";

interface PageInfo {
  title: string;
}

// Create a record mapping every Page to PageInfo:
const nav: Record<Page, PageInfo> = {
  home: { title: "Home" },
  about: { title: "About Us" },
  contact: { title: "Contact" },
};
```

**Line-by-line explanation:**
- `Record<Page, PageInfo>`: Creates an object type requiring every key in `Page` (`"home"`, `"about"`, `"contact"`), with each value typed as `PageInfo`.
- If any page is missing, or if an unknown page is added, TypeScript reports a compile error.

---

### 4. How it works inside TypeScript
Here is the official definition from `lib.d.ts`:

```typescript
type Record<K extends keyof any, T> = {
  [P in K]: T;
};
```

**Key constraints (`keyof any`)**:
`keyof any` is defined as `string | number | symbol` (all valid JavaScript object key types). `K` must be assignable to `string | number | symbol`.

---

### 5. Think first

What happens if you omit `"contact"` from `nav` in the code below? Decide first.

```typescript
type Page = "home" | "about" | "contact";

const nav: Record<Page, string> = {
  home: "/home",
  about: "/about",
};
```

---

**Answer and Reason:**

This code fails to compile:

```
Property 'contact' is missing in type '{ home: string; about: string; }' but required in type 'Record<Page, string>'.
```

**Reason**: `Record<Page, string>` requires **all** keys in the union `Page` to be present.

---

### 6. Try it yourself
Create a dictionary `RolePermissions = Record<"admin" | "guest", string[]>`. Assign permissions `["read", "write"]` for admin and `["read"]` for guest.

---

### 7. More examples

#### Example A: Dynamic String Key Dictionaries (Easy)

```typescript
type Cache = Record<string, unknown>;

const cache: Cache = {
  token: "abc123",
  count: 42,
};
```

**Line-by-line explanation:**
- `Record<string, unknown>` allows any string key with unknown values.

---

### 8. Common mistakes

#### Mistake 1: Using `boolean` as a Record key

**Wrong code:**
```typescript
type Bad = Record<boolean, string>; // Error!
```

**Why it happens:**
JavaScript object keys can only be `string`, `number`, or `symbol`. Booleans are not valid key types.

---

### 9. Rules to remember
1. `Record<K, T>` creates an object type with keys `K` and values `T`.
2. `K` must be assignable to `string | number | symbol`.
3. If `K` is a union of literals, all keys in the union are strictly required.

---

### 10. Exercises

#### Question 1 (Predict the compile result)
Will the following code compile?
```typescript
type Status = "ready" | "error";
const msg: Record<Status, string> = {
  ready: "All set",
};
```

#### Question 2 (Find and fix the bug)
Fix the error in this type definition:
```typescript
type ScoreMap = Record<object, number>;
```

#### Question 3 (Write code from scratch)
Create a type `HttpStatusCodes` mapping `"OK" | "NOT_FOUND"` to `number`. Create a valid object conforming to it.

#### Question 4 (Explain in your own words)
Why is `Record<"a" | "b", number>` safer than `{ [key: string]: number }`?

---

### Solutions

#### Solution to Question 1
**Hint 1**: Is `"error"` present in the object?

**Answer**:
No, it fails. Property `error` is missing.

#### Solution to Question 2
**Hint 1**: Object keys must be `string`, `number`, or `symbol`.

**Answer**:
```typescript
type ScoreMap = Record<string, number>;
```

#### Solution to Question 3
**Hint 1**: Use `Record<"OK" | "NOT_FOUND", number>`.

**Answer**:
```typescript
type HttpStatusCodes = Record<"OK" | "NOT_FOUND", number>;

const codes: HttpStatusCodes = {
  OK: 200,
  NOT_FOUND: 404,
};
```

#### Solution to Question 4
**Hint 1**: Does `{ [key: string]: number }` check if specific keys exist?

**Answer**:
`{ [key: string]: number }` allows arbitrary keys and cannot guarantee that any specific key is present. In contrast, `Record<"a" | "b", number>` strictly enforces that both `"a"` and `"b"` are present, catching typos and missing properties at compile time.

---

### 11. Recall

1. What built-in utility creates a dictionary of keys and values?
2. What types can be used as keys in `Record`?
3. If `K` is `"a" | "b"`, can you omit `"b"`?

**If you remember only one thing:**
`Record<K, T>` constructs a strongly typed dictionary where every key in `K` must be present with value type `T`.

---

# Checkpoint Challenge: Topics 1 to 5

### Challenge Scenario
Build a type-safe form state manager:

1. Define a form entity interface:
   ```typescript
   interface UserForm {
     username: string;
     email: string;
     age?: number;
   }
   ```
2. Using `Required`, create a type `ValidatedForm` where all fields must be filled in.
3. Using `Partial`, create a type `FormDirtyState` that tracks which fields have been touched.
4. Using `Record`, create an error dictionary `FormErrors` mapping each key of `UserForm` to `string | null`.
5. Using `Readonly`, create an immutable snapshot type `FormSnapshot`.

### Challenge Solution

```typescript
interface UserForm {
  username: string;
  email: string;
  age?: number;
}

// 2. All fields required:
type ValidatedForm = Required<UserForm>;
// { username: string; email: string; age: number }

// 3. Form dirty flags (all optional booleans):
type FormDirtyState = Partial<Record<keyof UserForm, boolean>>;

// 4. Error dictionary:
type FormErrors = Record<keyof UserForm, string | null>;

// 5. Immutable snapshot:
type FormSnapshot = Readonly<UserForm>;

const errors: FormErrors = {
  username: null,
  email: "Invalid email address",
  age: null,
};
```

---

# Topic 6: Selecting Properties with `Pick<T, K>`

### 1. What is it?
`Pick<T, K>` is a built-in utility type that constructs a new type by picking a specific set of properties `K` from an existing type `T`:
```typescript
type Pick<T, K extends keyof T> = {
  [P in K]: T[P];
};
```

### 2. Why does it exist?
Often, a component or function only needs a small subset of a large object.

For example, a user profile card might only need `name` and `avatarUrl` from a 20-field `User` database model. Instead of creating a brand-new interface from scratch, `Pick<User, "name" | "avatarUrl">` extracts exactly what you need while staying in sync with the master model.

### 3. Basic example

```typescript
type User = {
  id: string;
  name: string;
  email: string;
  role: string;
  createdAt: number;
};

// Pick only 'id' and 'name'
type UserPreview = Pick<User, "id" | "name">;
// Inferred as: { id: string; name: string }

const preview: UserPreview = {
  id: "usr_1",
  name: "Alex",
};
```

**Line-by-line explanation:**
- `Pick<User, "id" | "name">`: Evaluates `[P in "id" | "name"]: User[P]`.
- Produces an object containing only `id: string` and `name: string`.
- Modifiers (like `readonly` or `?`) on the picked properties are preserved because `Pick` is a homomorphic mapped type.

---

### 4. How it works inside TypeScript
1. **Key Constraint**: `K extends keyof T` guarantees that you can only pick keys that actually exist on `T`.
2. **Homomorphic Mapping**: The compiler iterates over `P in K` and looks up `T[P]`.
3. **Typo Prevention**: Writing `Pick<User, "nonExistent">` triggers an immediate compile error.

---

### 5. Think first

What happens if you try to pick a key that does not exist on `T`? Decide first.

```typescript
type User = { name: string };
type BadPick = Pick<User, "name" | "salary">;
```

---

**Answer and Reason:**

This code fails to compile:

```
Type '"salary"' does not satisfy the constraint 'keyof User'.
  Type '"salary"' is not assignable to type '"name"'.
```

**Reason**: `K extends keyof T` prevents picking keys that do not exist on `User`.

---

### 6. Try it yourself
Create a type `Article = { id: string; title: string; content: string; views: number }`. Use `Pick` to create a `ArticleSummary` type with only `id` and `title`.

---

### 7. More examples

#### Example A: Preserving Property Modifiers (Medium)

```typescript
type Account = {
  readonly id: string;
  nickname?: string;
};

type Picked = Pick<Account, "id" | "nickname">;
// Inferred as: { readonly id: string; nickname?: string }
```

**Line-by-line explanation:**
- `Pick` preserves `readonly` on `id` and optionality `?` on `nickname`.

---

### 8. Common mistakes

#### Mistake 1: Confusing `Pick` and `Extract`

**Wrong assumption:**
```typescript
// Trying to pick properties from an object using Extract:
type Bad = Extract<User, "id">; // Evaluates to never!
```

**Why it happens:**
- `Pick` works on **object types** to select properties.
- `Extract` works on **unions** to filter matching members.

---

### 9. Rules to remember
1. `Pick<T, K>` constructs a type with only keys `K` from `T`.
2. `K` must be assignable to `keyof T`.
3. Picked properties retain their original modifiers (`readonly`, `?`).

---

### 10. Exercises

#### Question 1 (Predict the compile result)
What is the resulting type of `Sub`?
```typescript
type Point = { x: number; y: number; z: number };
type Sub = Pick<Point, "x" | "y">;
```

#### Question 2 (Find and fix the bug)
Fix the typo caught by `Pick`:
```typescript
type Settings = { volume: number; mute: boolean };
type VolumeOnly = Pick<Settings, "volumme">;
```

#### Question 3 (Write code from scratch)
Write the `MyPick<T, K>` utility from scratch without using TypeScript's built-in `Pick`.

#### Question 4 (Explain in your own words)
Why is `Pick<User, "id" | "name">` better than declaring a separate interface `UserPreview { id: string; name: string }`?

---

### Solutions

#### Solution to Question 1
**Hint 1**: Pick `x` and `y`.

**Answer**:
The type is `{ x: number; y: number }`.

#### Solution to Question 2
**Hint 1**: Fix the spelling of `volumme`.

**Answer**:
```typescript
type VolumeOnly = Pick<Settings, "volume">;
```

#### Solution to Question 3
**Hint 1**: `[P in K]: T[P]`.

**Answer**:
```typescript
type MyPick<T, K extends keyof T> = {
  [P in K]: T[P];
};
```

#### Solution to Question 4
**Hint 1**: What happens if the type of `id` in `User` changes from `string` to `number` in the future?

**Answer**:
If `id` changes in `User`, `Pick<User, "id" | "name">` updates automatically. A manually declared interface would not update, leading to type desynchronization and potential runtime bugs.

---

### 11. Recall

1. What built-in utility selects properties from an object type?
2. What constraint does `Pick` place on its second argument `K`?
3. Does `Pick` preserve `readonly` modifiers?

**If you remember only one thing:**
Use `Pick<T, K>` to extract a subset of properties from an object type while preserving modifiers.

---

# Topic 7: Omitting Properties with `Omit<T, K>`

### 1. What is it?
`Omit<T, K>` is a built-in utility type that constructs an object type by picking all properties from `T` and then removing `K`:
```typescript
type Omit<T, K extends keyof any> = Pick<T, Exclude<keyof T, K>>;
```

### 2. Why does it exist?
While `Pick` is ideal when you want a *small* subset of properties, `Omit` is ideal when you want *almost all* properties except one or two.

For example, when creating a new database record, the database generates `id` and `createdAt`. The creation payload should contain every field of the entity *except* `id` and `createdAt`. `Omit<User, "id" | "createdAt">` defines this cleanly.

### 3. Basic example

```typescript
type User = {
  id: string;
  name: string;
  email: string;
  createdAt: number;
};

// Remove id and createdAt:
type CreateUserDto = Omit<User, "id" | "createdAt">;
// Inferred as: { name: string; email: string }

const newUser: CreateUserDto = {
  name: "Morgan",
  email: "morgan@example.com",
};
```

**Line-by-line explanation:**
- `keyof User`: `"id" | "name" | "email" | "createdAt"`.
- `Exclude<keyof User, "id" | "createdAt">`: Removes `"id"` and `"createdAt"`, leaving `"name" | "email"`.
- `Pick<User, "name" | "email">`: Picks the remaining properties.

---

### 4. How it works inside TypeScript
Here is the official definition from `lib.d.ts`:

```typescript
type Omit<T, K extends keyof any> = Pick<T, Exclude<keyof T, K>>;
```

**Composition of Utilities**:
`Omit` combines `Pick` and `Exclude`:
1. `Exclude<keyof T, K>` removes `K` from the keys union.
2. `Pick<T, ...>` picks the remaining keys.

---

### 5. Think first

Notice that `K` in `Omit<T, K extends keyof any>` is `keyof any`, NOT `keyof T`. What does this mean if you omit a key that does not exist? Decide first.

```typescript
type User = { name: string };
type Result = Omit<User, "salary">;
```

---

**Answer and Reason:**

This code compiles without error!

**Reason**: `K` is constrained to `keyof any` (`string | number | symbol`), not strictly `keyof T`. Omitting a key that does not exist is safely ignored, returning `User` unchanged.

---

### 6. Try it yourself
Create an interface `Post = { id: string; title: string; views: number; published: boolean }`. Use `Omit` to create `DraftPost` that removes `id` and `views`.

---

### 7. More examples

#### Example A: Replacing a Property Type (Medium)

```typescript
type Base = { id: string; count: number };

// Replace count: number with count: string
type StringCount = Omit<Base, "count"> & { count: string };

const item: StringCount = {
  id: "1",
  count: "five", // Type is string!
};
```

**Line-by-line explanation:**
- Omits the original property first to prevent an impossible intersection (`number & string -> never`).

---

### 8. Common mistakes

#### Mistake 1: Trying to replace a property without omitting it first

**Wrong code:**
```typescript
type Base = { id: string; count: number };
type BadOverride = Base & { count: string };
// BadOverride.count is number & string -> never!
```

**Why it happens:**
Intersecting without `Omit` produces `never` for conflicting primitive property types.

---

### 9. Rules to remember
1. `Omit<T, K>` creates an object type with keys `K` removed.
2. Implemented as `Pick<T, Exclude<keyof T, K>>`.
3. Use `Omit` before overriding existing property types.

---

### 10. Exercises

#### Question 1 (Predict the compile result)
What is the resulting type of `Clean`?
```typescript
type Raw = { a: number; b: string; c: boolean };
type Clean = Omit<Raw, "b" | "c">;
```

#### Question 2 (Find and fix the bug)
The code below results in `never` for `port`. Fix it using `Omit`:
```typescript
type ServerConfig = { host: string; port: number };
type StringPortConfig = ServerConfig & { port: string };
```

#### Question 3 (Write code from scratch)
Write your own `MyOmit<T, K>` utility from scratch using `Pick` and `Exclude`.

#### Question 4 (Explain in your own words)
Why is `Omit` useful when writing DTOs (Data Transfer Objects) for database insertion?

---

### Solutions

#### Solution to Question 1
**Hint 1**: Remove `b` and `c`.

**Answer**:
The type is `{ a: number }`.

#### Solution to Question 2
**Hint 1**: Omit `"port"` before intersecting.

**Answer**:
```typescript
type ServerConfig = { host: string; port: number };
type StringPortConfig = Omit<ServerConfig, "port"> & { port: string };
```

#### Solution to Question 3
**Hint 1**: `Pick<T, Exclude<keyof T, K>>`.

**Answer**:
```typescript
type MyOmit<T, K extends keyof any> = Pick<T, Exclude<keyof T, K>>;
```

#### Solution to Question 4
**Hint 1**: What fields does the database generate automatically?

**Answer**:
Database entities typically include auto-generated fields (like primary keys and timestamps) that do not exist yet when creating a new record. `Omit` allows you to derive creation DTOs by stripping those auto-generated fields while retaining the rest of the entity schema.

---

### 11. Recall

1. What built-in utility type removes properties from an object type?
2. What two utility types are combined to create `Omit`?
3. How do you safely override a property type on an existing interface?

**If you remember only one thing:**
Use `Omit<T, K>` to strip unwanted properties from an object type.

---

# Topic 8: Key Remapping with `as` (TypeScript 4.1)

### 1. What is it?
Introduced in TypeScript 4.1, **Key Remapping** lets you transform or filter property names in a mapped type using the `as` clause:
```typescript
type Mapped<T> = {
  [K in keyof T as NewKey]: T[K];
};
```

### 2. Why does it exist?
Before TypeScript 4.1, a mapped type could only produce objects with the *exact same* property names as the input type.

You could not rename keys, prefix them (like `get${Key}`), or filter keys out based on their names. Key remapping allows you to programmatically rewrite property keys during mapping.

### 3. Basic example

```typescript
type User = {
  name: string;
  age: number;
};

// Prefix every property name with "user_"
type PrefixedUser = {
  [K in keyof User as `user_${string & K}`]: User[K];
};

// Resulting type:
// { user_name: string; user_age: number }
```

**Line-by-line explanation:**
- `[K in keyof User as \`user_\${string & K}\`]:`:
  - `K` iterates over `"name" | "age"`.
  - `string & K` ensures `K` is treated as a string (since symbols are not valid in template literals).
  - The `as` clause remaps the key to `"user_name"` and `"user_age"`.
- Values (`User[K]`) remain unchanged.

---

### 4. How it works inside TypeScript
1. **Key Generation**: For each key `K` in `keyof T`, the compiler evaluates the expression after `as`.
2. **New Key Assignment**: The result of the `as` expression becomes the new property name on the output object.
3. **Value Lookup**: The right side (`T[K]`) still uses the original key `K` to look up the original property value type.

---

### 5. Think first

What is the resulting type of `Result` in the code below? Decide first.

```typescript
type Point = { x: number; y: number };

type UppercasePoint = {
  [K in keyof Point as Uppercase<string & K>]: Point[K];
};
```

---

**Answer and Reason:**

The resulting type is:

```typescript
{
  X: number;
  Y: number;
}
```

**Reason**: `Uppercase<string & K>` turns `"x"` into `"X"`, and `"y"` into `"Y"`. The values remain `number`.

---

### 6. Try it yourself
Create an object type `Settings = { volume: number; theme: string }`. Write a mapped type that prefixes every key with `"app_"`.

---

### 7. More examples

#### Example A: Capitalize Helper (Medium)

```typescript
type Person = { name: string; email: string };

type Getters = {
  [K in keyof Person as `get${Capitalize<string & K>}`]: () => Person[K];
};
// { getName: () => string; getEmail: () => string }
```

**Line-by-line explanation:**
- Combines key remapping with `Capitalize` and function wrapping.

---

### 8. Common mistakes

#### Mistake 1: Forgetting `string & K` when using template literals

**Wrong code:**
```typescript
type Prefixed<T> = {
  // [K in keyof T as `data_${K}`]: T[K]; // Error!
};
```

**Why it happens:**
`keyof T` can include `symbol` or `number`. Template literals only accept `string | number | boolean | null | undefined | bigint`. Intersecting with `string` (`string & K`) guarantees that non-string keys are safely handled.

---

### 9. Rules to remember
1. `as` remaps property names in a mapped type.
2. Syntax: `[K in keyof T as NewKey]: ValueType`.
3. Use `string & K` when passing keys into template literal types.

---

### 10. Exercises

#### Question 1 (Predict the compile result)
What are the property names of `Result`?
```typescript
type Actions = { login: boolean; logout: boolean };
type Result = {
  [K in keyof Actions as `on_${string & K}`]: Actions[K];
};
```

#### Question 2 (Find and fix the bug)
Fix the error in the remapped type:
```typescript
type CapitalizedKeys<T> = {
  [K in keyof T as Capitalize<K>]: T[K];
};
```

#### Question 3 (Write code from scratch)
Write a mapped type `AddSuffix<T, Suffix extends string>` that appends `Suffix` to every key in `T`.

#### Question 4 (Explain in your own words)
How does key remapping with `as` preserve the original value lookup `T[K]` while changing the property name?

---

### Solutions

#### Solution to Question 1
**Hint 1**: Prefix with `"on_"`.

**Answer**:
The property names are `"on_login"` and `"on_logout"`.

#### Solution to Question 2
**Hint 1**: Intersect `K` with `string`: `Capitalize<string & K>`.

**Answer**:
```typescript
type CapitalizedKeys<T> = {
  [K in keyof T as Capitalize<string & K>]: T[K];
};
```

#### Solution to Question 3
**Hint 1**: Use template literal `${string & K}${Suffix}`.

**Answer**:
```typescript
type AddSuffix<T, Suffix extends string> = {
  [K in keyof T as `${string & K}${Suffix}`]: T[K];
};
```

#### Solution to Question 4
**Hint 1**: Look at the variable before `as` versus after `as`.

**Answer**:
The variable `K` before the `as` keyword still references the original key from `keyof T`. This allows `T[K]` on the right side to look up the original property value, while the expression after `as` defines the new name under which that value will be stored.

---

### 11. Recall

1. What keyword enables key remapping in a mapped type?
2. Which TypeScript version introduced key remapping?
3. Why do we write `string & K` inside template literals?

**If you remember only one thing:**
Use `[K in keyof T as NewKey]` to rename properties while mapping over an object type.

---

# Topic 9: Filtering Object Keys Using `as ... ? Key : never`

### 1. What is it?
In key remapping, if the expression after `as` evaluates to `never`, TypeScript completely **omits that key** from the resulting object type:
```typescript
[K in keyof T as Condition ? K : never]: T[K];
```

### 2. Why does it exist?
Before key remapping, filtering object properties by value type (for example, "keep only properties whose values are functions" or "remove all string properties") required complex workarounds using `Pick` and conditional types.

Returning `never` in an `as` clause filters out unwanted properties directly in a single, clean mapped type.

### 3. Basic example

```typescript
type User = {
  id: string;
  name: string;
  age: number;
  roles: string[];
};

// Filter out all properties that are NOT strings:
type OnlyStrings<T> = {
  [K in keyof T as T[K] extends string ? K : never]: T[K];
};

type StringFields = OnlyStrings<User>;
// Inferred as: { id: string; name: string }
```

**Line-by-line explanation:**
- `T[K] extends string ? K : never`:
  - For `id`: `string extends string` is true $\to$ keep key `id`.
  - For `name`: `string extends string` is true $\to$ keep key `name`.
  - For `age`: `number extends string` is false $\to$ returns `never`. Key `age` is dropped!
  - For `roles`: `string[] extends string` is false $\to$ returns `never`. Key `roles` is dropped!
- Resulting type has only `id` and `name`.

---

### 4. How it works inside TypeScript
1. **Key Filtering Rule**: If the remapped key evaluates to `never`, the compiler does not create that property on the output object.
2. **Conditional Remapping**: You can use any conditional type logic inside the `as` clause.
3. **Type-Safe Extraction**: Preserves exact property value types on all remaining properties.

---

### 5. Think first

What is the resulting type of `Methods` in the code below? Decide first.

```typescript
type Service = {
  id: string;
  start: () => void;
  stop: () => void;
};

type OnlyFunctions<T> = {
  [K in keyof T as T[K] extends Function ? K : never]: T[K];
};

type Methods = OnlyFunctions<Service>;
```

---

**Answer and Reason:**

The resulting type is:

```typescript
{
  start: () => void;
  stop: () => void;
}
```

**Reason**: `id` is a string (not a `Function`), so its remapped key evaluates to `never` and is excluded. `start` and `stop` are functions, so they are kept.

---

### 6. Try it yourself
Create a type `Mixed = { a: number; b: string; c: number; d: boolean }`. Write a mapped type `OnlyNumbers<T>` that keeps only properties of type `number`.

---

### 7. More examples

#### Example A: Filtering by Property Name (Medium)

```typescript
type EventRecord = {
  id: string;
  _internalTimestamp: number;
  _internalToken: string;
  name: string;
};

// Filter out all private properties starting with "_"
type PublicFields<T> = {
  [K in keyof T as K extends `_${string}` ? never : K]: T[K];
};

type PublicOnly = PublicFields<EventRecord>;
// { id: string; name: string }
```

**Line-by-line explanation:**
- Checks if the key starts with `_`. If yes, returns `never` to drop it.

---

### 8. Common mistakes

#### Mistake 1: Returning `never` as the value type instead of the remapped key

**Wrong code:**
```typescript
type BadFilter<T> = {
  [K in keyof T]: T[K] extends string ? T[K] : never;
};
// Does NOT omit the key! It produces: { age: never }!
```

**Why it happens:**
Returning `never` on the **right side** of the colon creates a property with type `never`. Returning `never` in the `as` clause removes the property completely.

---

### 9. Rules to remember
1. In an `as` clause, returning `never` completely removes the property from the object.
2. Returning `never` as the value type keeps the property with type `never`.
3. Use `as Condition ? K : never` to filter properties cleanly.

---

### 10. Exercises

#### Question 1 (Predict the compile result)
What properties exist on `Result`?
```typescript
type Data = { x: number; y: string };
type Filter<T> = {
  [K in keyof T as T[K] extends number ? K : never]: T[K];
};
type Result = Filter<Data>;
```

#### Question 2 (Find and fix the bug)
The type below leaves unwanted properties with type `never`. Fix it using an `as` clause:
```typescript
type KeepBooleans<T> = {
  [K in keyof T]: T[K] extends boolean ? T[K] : never;
};
```

#### Question 3 (Write code from scratch)
Write a mapped type `OmitByType<T, ValueType>` that removes all properties assignable to `ValueType`. Test it by removing strings from `{ id: string; count: number }`.

#### Question 4 (Explain in your own words)
Why does returning `never` in the `as` clause delete a property, while returning `never` for the value type preserves the key?

---

### Solutions

#### Solution to Question 1
**Hint 1**: Only keep properties whose values are numbers.

**Answer**:
Only property `x: number` exists.

#### Solution to Question 2
**Hint 1**: Move the conditional check into the `as` clause.

**Answer**:
```typescript
type KeepBooleans<T> = {
  [K in keyof T as T[K] extends boolean ? K : never]: T[K];
};
```

#### Solution to Question 3
**Hint 1**: Check `T[K] extends ValueType ? never : K`.

**Answer**:
```typescript
type OmitByType<T, ValueType> = {
  [K in keyof T as T[K] extends ValueType ? never : K]: T[K];
};

type Result = OmitByType<{ id: string; count: number }, string>;
// { count: number }
```

#### Solution to Question 4
**Hint 1**: What does each part of a mapped type declaration control?

**Answer**:
The `as` clause determines the property names (keys) of the new object. If a key evaluates to `never`, no valid key exists, so the compiler omits the property entirely. The right side controls the property's value type, so returning `never` there creates an unassignable property with the original key intact.

---

### 11. Recall

1. What happens when an `as` remapping evaluates to `never`?
2. How do you remove a property based on its value type?
3. What is the difference between filtering the key versus setting the value to `never`?

**If you remember only one thing:**
Return `never` in an `as` clause to omit properties completely from an object type.

---

# Topic 10: Generating Getters and Method Signatures with Template Literal Key Remapping

### 1. What is it?
You can combine mapped types, key remapping (`as`), and template literal types to generate complete object APIs (such as getter and setter methods) from raw state interfaces.

### 2. Why does it exist?
In patterns like Vuex, Redux, state stores, and ActiveRecord models, you often define a state object and automatically generate methods like `getName()`, `getAge()`, `setName(val)`, and `setAge(val)`.

Without key remapping, you would have to write duplicate interfaces for all these getters and setters by hand. Key remapping allows you to synthesize complete getter/setter interfaces from a single state shape.

### 3. Basic example

```typescript
type State = {
  name: string;
  age: number;
};

// Generate getter methods for every property:
type StateGetters<T> = {
  [K in keyof T as `get${Capitalize<string & K>}`]: () => T[K];
};

type Getters = StateGetters<State>;
// Inferred as:
// {
//   getName: () => string;
//   getAge: () => number;
// }
```

**Line-by-line explanation:**
- `keyof State`: `"name" | "age"`.
- `Capitalize<string & K>`: Turns `"name"` into `"Name"`, and `"age"` into `"Age"`.
- `` `get${...}` ``: Prepends `"get"`, creating `"getName"` and `"getAge"`.
- `() => T[K]`: Sets the value type to a parameterless function returning `T[K]`.

---

### 4. How it works inside TypeScript
1. **Intrinsic String Manipulation**: TypeScript provides built-in type helpers for string literals: `Capitalize<S>`, `Uncapitalize<S>`, `Uppercase<S>`, `Lowercase<S>`.
2. **Template Combination**: The compiler evaluates `` `get${Capitalize<string & K>}` `` into a new string literal type.
3. **Method Signature**: The method return type or parameter type references `T[K]`, ensuring full type safety.

---

### 5. Think first

What is the resulting signature of `setVolume` in `StateSetters<AudioState>` below? Decide first.

```typescript
type AudioState = { volume: number };

type StateSetters<T> = {
  [K in keyof T as `set${Capitalize<string & K>}`]: (val: T[K]) => void;
};

type Setters = StateSetters<AudioState>;
```

---

**Answer and Reason:**

The resulting signature is:

```typescript
setVolume: (val: number) => void
```

**Reason**: The key is remapped to `"setVolume"`. The value is a function taking `val: T["volume"]` (which is `number`) and returning `void`.

---

### 6. Try it yourself
Create an interface `Point = { x: number; y: number }`. Write a mapped type `PointSetters` that generates `setX(val: number): void` and `setY(val: number): void`.

---

### 7. More examples

#### Example A: Combining Getters and Setters (Medium)

```typescript
type CompleteStore<T> = {
  [K in keyof T as `get${Capitalize<string & K>}`]: () => T[K];
} & {
  [K in keyof T as `set${Capitalize<string & K>}`]: (value: T[K]) => void;
};

type UserStore = CompleteStore<{ theme: string }>;
// {
//   getTheme: () => string;
//   setTheme: (value: string) => void;
// }
```

---

### 8. Common mistakes

#### Mistake 1: Forgetting to capitalize the first letter

**Wrong code:**
```typescript
type Bad<T> = {
  [K in keyof T as `get${string & K}`]: () => T[K];
};
// Produces "getname", not standard camelCase "getName"!
```

**Correct code:**
Use `Capitalize<string & K>`:
```typescript
type Good<T> = {
  [K in keyof T as `get${Capitalize<string & K>}`]: () => T[K];
};
```

---

### 9. Rules to remember
1. Use `Capitalize<string & K>` to create camelCase and PascalCase method names.
2. Method parameters can reference `T[K]` for setters.
3. Multiple mapped types can be intersected (`&`) to combine getters and setters.

---

### 10. Exercises

#### Question 1 (Predict the compile result)
What method names exist on `Listeners`?
```typescript
type Events = { click: number; hover: string };
type Listeners<T> = {
  [K in keyof T as `on${Capitalize<string & K>}`]: (data: T[K]) => void;
};
type Res = Listeners<Events>;
```

#### Question 2 (Find and fix the bug)
Fix the setter method signature so it accepts the correct property value:
```typescript
type Setters<T> = {
  [K in keyof T as `set${Capitalize<string & K>}`]: (val: any) => void;
};
```

#### Question 3 (Write code from scratch)
Write a mapped type `Resetters<T>` that creates methods `reset${Capitalize<K>}: () => void` for every property in `T`.

#### Question 4 (Explain in your own words)
Why does `Capitalize<string & K>` require `string & K` rather than just `K`?

---

### Solutions

#### Solution to Question 1
**Hint 1**: Prepend `"on"` and capitalize.

**Answer**:
`onClick: (data: number) => void` and `onHover: (data: string) => void`.

#### Solution to Question 2
**Hint 1**: Replace `any` with `T[K]`.

**Answer**:
```typescript
type Setters<T> = {
  [K in keyof T as `set${Capitalize<string & K>}`]: (val: T[K]) => void;
};
```

#### Solution to Question 3
**Hint 1**: Use `() => void`.

**Answer**:
```typescript
type Resetters<T> = {
  [K in keyof T as `reset${Capitalize<string & K>}`]: () => void;
};
```

#### Solution to Question 4
**Hint 1**: What types can `keyof T` contain in addition to strings?

**Answer**:
`keyof T` can include `symbol` or `number`. The `Capitalize` helper only accepts string types. Intersecting with `string` (`string & K`) filters out symbols, guaranteeing that only valid string keys are passed to `Capitalize`.

---

### 11. Recall

1. What built-in utility capitalizes the first character of a string literal?
2. How do you construct `getName` from key `"name"`?
3. How do you type a setter's argument to match the property's type?

**If you remember only one thing:**
Combine `as \`get\${Capitalize<string & K>}\`` with `T[K]` to synthesize type-safe getter and setter APIs.

---

# Checkpoint Challenge: Topics 6 to 10

### Challenge Scenario
Build a reactive model accessor system:

1. Define a model data interface:
   ```typescript
   interface UserModel {
     id: string;
     name: string;
     age: number;
     isVerified: boolean;
   }
   ```
2. Using `Pick`, create a `PublicProfile` with only `name` and `isVerified`.
3. Using `Omit`, create an `UpdateUserData` that removes `id`.
4. Using key remapping and filtering (`never`), create a type `NumericFields` that keeps only numeric properties.
5. Create a mapped type `ModelGetters<T>` that generates getter methods for every property (`getId`, `getName`, `getAge`, `getIsVerified`).

### Challenge Solution

```typescript
interface UserModel {
  id: string;
  name: string;
  age: number;
  isVerified: boolean;
}

// 2. Public profile:
type PublicProfile = Pick<UserModel, "name" | "isVerified">;

// 3. Update DTO:
type UpdateUserData = Omit<UserModel, "id">;

// 4. Numeric fields only:
type NumericFields = {
  [K in keyof UserModel as UserModel[K] extends number ? K : never]: UserModel[K];
};
// { age: number }

// 5. Model getters:
type ModelGetters<T> = {
  [K in keyof T as `get${Capitalize<string & K>}`]: () => T[K];
};

type UserGetters = ModelGetters<UserModel>;

const userGetters: UserGetters = {
  getId: () => "usr_100",
  getName: () => "Morgan",
  getAge: () => 29,
  getIsVerified: () => true,
};
```

---

# Topic 11: Transforming Property Value Types Conditionally

### 1. What is it?
You can combine mapped types and conditional types on the **value side** (the right side of the colon) to transform each property's value based on what type it currently is:
```typescript
type Transform<T> = {
  [K in keyof T]: T[K] extends Function ? boolean : T[K];
};
```

### 2. Why does it exist?
Often, you need to transform values uniformly across an entire object based on rules:
- Turn all `Date` objects into ISO timestamp `string`s for serialization.
- Wrap all functions into async functions that return `Promise`.
- Replace all nullable values with default fallbacks.

Combining mapped types with conditional types lets you apply targeted transformations across complex schemas in a single pass.

### 3. Basic example

```typescript
type Entity = {
  id: string;
  createdAt: Date;
  updatedAt: Date;
  viewCount: number;
};

// Transform Date properties into strings for JSON serialization:
type SerializeDates<T> = {
  [K in keyof T]: T[K] extends Date ? string : T[K];
};

type SerializedEntity = SerializeDates<Entity>;
// Inferred as:
// {
//   id: string;
//   createdAt: string;
//   updatedAt: string;
//   viewCount: number;
// }
```

**Line-by-line explanation:**
- `[K in keyof T]:`: Loops over all properties of `Entity`.
- `T[K] extends Date ? string : T[K]`: Checks each property's value. If it is a `Date`, replace it with `string`. Otherwise, leave it as `T[K]`.
- `createdAt` and `updatedAt` become `string`; `id` and `viewCount` remain unchanged.

---

### 4. How it works inside TypeScript
1. **Property Iteration**: The compiler walks each property in `T`.
2. **Conditional Value Evaluation**: For each property, the conditional type on the right side evaluates based on `T[K]`.
3. **Targeted Replacement**: Only matching properties are altered; non-matching properties retain their original types.

---

### 5. Think first

What happens to `active` in `MakeAsync` below? Decide first.

```typescript
type Service = {
  active: boolean;
  save: () => void;
};

type MakeAsync<T> = {
  [K in keyof T]: T[K] extends (...args: any[]) => infer R
    ? (...args: any[]) => Promise<R>
    : T[K];
};

type AsyncService = MakeAsync<Service>;
```

---

**Answer and Reason:**

`active` remains `boolean`.

**Reason**: `boolean` does not extend `(...args: any[]) => any`. The conditional type falls back to `: T[K]`, leaving non-function properties unchanged.

---

### 6. Try it yourself
Write a mapped type `UnwrapArrays<T>`: if a property is an array `(infer E)[]`, change it to `E`. Otherwise leave it as `T[K]`. Test it on `{ tags: string[]; count: number }`.

---

### 7. More examples

#### Example A: Replacing Null with Undefined (Medium)

```typescript
type NullToUndefined<T> = {
  [K in keyof T]: T[K] extends null ? undefined : T[K];
};
```

---

### 8. Common mistakes

#### Mistake 1: Forgetting to fall back to `T[K]`

**Wrong code:**
```typescript
type Bad<T> = {
  [K in keyof T]: T[K] extends Date ? string : never;
  // Non-Date properties become never!
};
```

**Correct code:**
Always fall back to `T[K]` if you want to keep non-matching properties:
```typescript
type Good<T> = {
  [K in keyof T]: T[K] extends Date ? string : T[K];
};
```

---

### 9. Rules to remember
1. Conditional types on the value side transform specific property types while preserving others.
2. Always provide `: T[K]` in the false branch to leave non-matching properties intact.
3. Can be combined with `infer` to unwrap or restructure property values.

---

### 10. Exercises

#### Question 1 (Predict the compile result)
What is the type of `output.score`?
```typescript
type Data = { score: number; label: string };
type BoxNumbers<T> = {
  [K in keyof T]: T[K] extends number ? { val: T[K] } : T[K];
};
type Res = BoxNumbers<Data>;
```

#### Question 2 (Find and fix the bug)
Fix the mapped type below so non-string properties are preserved:
```typescript
type TrimStrings<T> = {
  [K in keyof T]: T[K] extends string ? string : never;
};
```

#### Question 3 (Write code from scratch)
Write a mapped type `PromisifyMethods<T>` that turns all function properties into functions returning `Promise<ReturnType>`. Leave non-functions unchanged.

#### Question 4 (Explain in your own words)
What is the difference between filtering keys with `as` and transforming values with conditional types?

---

### Solutions

#### Solution to Question 1
**Hint 1**: `score` is a number.

**Answer**:
The type of `score` is `{ val: number }`.

#### Solution to Question 2
**Hint 1**: Replace `: never` with `: T[K]`.

**Answer**:
```typescript
type TrimStrings<T> = {
  [K in keyof T]: T[K] extends string ? string : T[K];
};
```

#### Solution to Question 3
**Hint 1**: `T[K] extends (...args: infer P) => infer R ? (...args: P) => Promise<R> : T[K]`.

**Answer**:
```typescript
type PromisifyMethods<T> = {
  [K in keyof T]: T[K] extends (...args: infer P) => infer R
    ? (...args: P) => Promise<R>
    : T[K];
};
```

#### Solution to Question 4
**Hint 1**: Which one removes the property versus changing what the property holds?

**Answer**:
Filtering keys with `as ... ? K : never` completely adds or removes property names from the object. Transforming values with conditional types keeps all property names intact and modifies the data types stored under those properties.

---

### 11. Recall

1. Where do conditional types go when transforming property values?
2. What should you return in the false branch to keep properties unchanged?
3. Can you combine `infer` with mapped type value transformations?

**If you remember only one thing:**
Use `T[K] extends Pattern ? NewType : T[K]` to conditionally transform property values across an object type.

---

# Topic 12: Preserving Arrays and Tuples in Mapped Types

### 1. What is it?
When a homomorphic mapped type (`[K in keyof T]`) is applied to an array or tuple, TypeScript does NOT convert it into a plain object dictionary with keys `"0"`, `"1"`.

Instead, TypeScript maps over each element and returns a **new array or tuple** with the same length, elements, and array methods.

### 2. Why does it exist?
In JavaScript, tuples represent fixed lists of values (like function parameter lists or coordinates).

If mapping over a tuple turned it into `{ "0": string, "1": number }`, you would lose all array methods (`.slice()`, `.map()`) and tuple destructuring (`const [a, b] = val`). Preserving tuples allows mapped types to work naturally on lists and argument tuples.

### 3. Basic example

```typescript
type StringifyTuple<T> = {
  [K in keyof T]: string;
};

// Applied to a 2-element tuple:
type NumberTuple = [10, 20];
type StringTuple = StringifyTuple<NumberTuple>;
// Inferred as: [string, string] (Tuple preserved!)

// Applied to an array:
type StringList = StringifyTuple<number[]>;
// Inferred as: string[] (Array preserved!)
```

**Line-by-line explanation:**
- `StringifyTuple` is a homomorphic mapped type.
- When passed `[10, 20]`, TypeScript maps over index `0` and index `1`, returning `[string, string]`.
- Array prototype methods (`length`, `slice`, etc.) are preserved automatically.

---

### 4. How it works inside TypeScript
1. **Tuple Detection**: The compiler checks if `T` is an array or tuple type.
2. **Homomorphic Rule**: If the mapped type is homomorphic (`[K in keyof T]`), the compiler invokes specialized tuple mapping logic.
3. **Element-by-Element Projection**: Each element type at index `0`, `1`, `2` is transformed independently.
4. **Tuple Tagging**: The resulting type retains the internal `Tuple` and `Array` type flags.

---

### 5. Think first

What happens when we apply `Partial` to a tuple `[string, number]`? Decide first.

```typescript
type OptionalTuple = Partial<[string, number]>;
```

---

**Answer and Reason:**

The resulting type is:

```typescript
[(string | undefined)?, (number | undefined)?]
```

**Reason**: Because `Partial` is a homomorphic mapped type, it marks each element of the tuple as optional (`?`), preserving the tuple structure.

---

### 6. Try it yourself
Write a homomorphic mapped type `PromisifyTuple<T> = { [K in keyof T]: Promise<T[K]> }`. Apply it to `[string, number]`. Verify that the result is `[Promise<string>, Promise<number>]`.

---

### 7. More examples

#### Example A: Mapping Over Rest Elements (Medium)

```typescript
type WrapList<T> = {
  [K in keyof T]: { item: T[K] };
};

type RestTuple = [string, ...number[]];
type Wrapped = WrapList<RestTuple>;
// Inferred as: [{ item: string }, ...{ item: number }[]]
```

**Line-by-line explanation:**
- Preserves the rest element `...number[]` and transforms it to `...{ item: number }[]`.

---

### 8. Common mistakes

#### Mistake 1: Breaking homomorphic structure and losing tuple mechanics

**Wrong code:**
```typescript
type NonHomomorphic<T> = {
  [K in keyof T as string]: boolean;
};
// Remapping keys to generic string degrades tuples into plain dictionaries!
```

---

### 9. Rules to remember
1. Homomorphic mapped types preserve array and tuple structures.
2. Mapping over `[A, B]` produces a new tuple `[NewA, NewB]`.
3. Readonly modifiers on tuples are preserved.

---

### 10. Exercises

#### Question 1 (Predict the compile result)
What is the resulting type of `R`?
```typescript
type BoxTuple<T> = { [K in keyof T]: [T[K]] };
type R = BoxTuple<[number, boolean]>;
```

#### Question 2 (Find and fix the bug)
Explain why the type below degrades a tuple into an object:
```typescript
type BadMap<Keys extends keyof any> = { [K in Keys]: string };
type Degraded = BadMap<keyof [number, string]>;
```

#### Question 3 (Write code from scratch)
Write a homomorphic mapped type `AwaitedTuple<T>` that unwraps every Promise in a tuple using `Awaited<T[K]>`.

#### Question 4 (Explain in your own words)
Why does TypeScript treat tuples specially in homomorphic mapped types?

---

### Solutions

#### Solution to Question 1
**Hint 1**: Wrap each element in a tuple.

**Answer**:
The type is `[[number], [boolean]]`.

#### Solution to Question 2
**Hint 1**: The mapped type is non-homomorphic because it does not use `[K in keyof T]`.

**Answer**:
`BadMap` iterates over a generic `Keys` parameter without linking directly to `keyof T`. Because it is non-homomorphic, the compiler cannot detect the tuple structure and falls back to a plain object dictionary.

#### Solution to Question 3
**Hint 1**: Use `[K in keyof T]: Awaited<T[K]>`.

**Answer**:
```typescript
type AwaitedTuple<T> = {
  [K in keyof T]: Awaited<T[K]>;
};

type Result = AwaitedTuple<[Promise<string>, Promise<number>]>;
// [string, number]
```

#### Solution to Question 4
**Hint 1**: Think about tuple destructuring and function argument lists.

**Answer**:
Tuples are arrays with specific positions and lengths. Preserving them in mapped types ensures that mapped function arguments (`Parameters<F>`) and tuple data can still be indexed by number, destructured, and passed to array methods.

---

### 11. Recall

1. Does a homomorphic mapped type convert a tuple into a plain object?
2. What does `Partial<[string, number]>` produce?
3. Are rest elements (`...T[]`) preserved in mapped tuples?

**If you remember only one thing:**
Homomorphic mapped types preserve array and tuple structures, transforming each element position individually.

---

# Topic 13: Recursive Mapped Types (`DeepReadonly<T>` and `DeepPartial<T>`)

### 1. What is it?
Standard `Readonly<T>` and `Partial<T>` are **shallow**: they only affect the top-level properties of an object. Nested objects remain mutable or required.

A **Recursive Mapped Type** references itself in its property definition, recursing deeply through all nested objects and arrays to apply modifiers at every level.

### 2. Why does it exist?
Real-world data structures are deeply nested:
```typescript
type AppConfig = {
  database: {
    connection: {
      host: string;
      port: number;
    };
  };
};
```
If you pass `Readonly<AppConfig>`, someone can still mutate `config.database.connection.host = "hacked"`!
A recursive mapped type like `DeepReadonly<T>` guarantees complete immutability from the root down to the leaf properties.

### 3. Basic example

```typescript
type DeepReadonly<T> = {
  readonly [K in keyof T]: T[K] extends Function
    ? T[K]
    : T[K] extends object
    ? DeepReadonly<T[K]>
    : T[K];
};

type Config = {
  db: {
    host: string;
  };
};

const locked: DeepReadonly<Config> = {
  db: { host: "localhost" },
};

// locked.db = { host: "remote" }; // Error: db is readonly!
// locked.db.host = "remote";       // Error: host is ALSO readonly!
```

**Line-by-line explanation:**
- `readonly [K in keyof T]:`: Marks the current level `readonly`.
- `T[K] extends Function ? T[K]`: If the property is a function, leave it alone (functions are objects, but we don't want to map over their methods).
- `: T[K] extends object ? DeepReadonly<T[K]>`: If the property is an object, recursively call `DeepReadonly<T[K]>` on it.
- `: T[K]`: Base case: primitives (`string`, `number`, `boolean`) are returned unchanged.

---

### 4. How it works inside TypeScript
1. **Recursion Unfolding**: When inspecting `locked.db.host`, TypeScript expands `DeepReadonly` on the nested `db` object.
2. **Function Guard**: Checking `T[K] extends Function` prevents TypeScript from trying to map over function prototype properties like `bind`, `call`, and `apply`.
3. **Base Case Termination**: Primitives terminate the recursion.

---

### 5. Think first

What happens if you do NOT exclude `Function` in a recursive mapped type? Decide first.

```typescript
type BadDeep<T> = {
  [K in keyof T]: T[K] extends object ? BadDeep<T[K]> : T[K];
};

type Service = {
  run: () => void;
};

type Result = BadDeep<Service>;
```

---

**Answer and Reason:**

In JavaScript, functions are objects!

**Reason**: Without checking `extends Function` first, TypeScript treats `() => void` as an object and attempts to map over all function properties (`bind`, `apply`, `caller`), breaking the function signature.

---

### 6. Try it yourself
Write a `DeepPartial<T>` type that makes all properties and nested object properties optional. Test it on `{ user: { profile: { age: number } } }`.

---

### 7. More examples

#### Example A: DeepPartial Implementation (Medium)

```typescript
type DeepPartial<T> = {
  [K in keyof T]?: T[K] extends Function
    ? T[K]
    : T[K] extends object
    ? DeepPartial<T[K]>
    : T[K];
};

type NestedUser = {
  id: string;
  profile: {
    name: string;
    settings: {
      darkMode: boolean;
    };
  };
};

// All levels are optional:
const update: DeepPartial<NestedUser> = {
  profile: {
    settings: {},
  },
};
```

**Line-by-line explanation:**
- Every level of the hierarchy accepts partial updates.

---

### 8. Common mistakes

#### Mistake 1: Forgetting to handle arrays in recursive types

**Wrong code:**
Arrays are objects, so a naive `T[K] extends object` maps over array methods (`push`, `pop`) unless handled properly:
```typescript
type DeepReadonly<T> = {
  readonly [K in keyof T]: T[K] extends (infer E)[]
    ? readonly DeepReadonly<E>[]
    : T[K] extends object
    ? DeepReadonly<T[K]>
    : T[K];
};
```

---

### 9. Rules to remember
1. Standard `Readonly` and `Partial` are shallow.
2. Recursive mapped types check `extends object` and call themselves on nested structures.
3. Always guard against `Function` to avoid breaking function signatures.
4. Handle arrays explicitly when recursing.

---

### 10. Exercises

#### Question 1 (Predict the compile result)
Will the reassignment on line 8 compile?
```typescript
type DeepReadonly<T> = {
  readonly [K in keyof T]: T[K] extends object ? DeepReadonly<T[K]> : T[K];
};
type Nested = { a: { b: number } };
const obj: DeepReadonly<Nested> = { a: { b: 10 } };
obj.a.b = 20;
```

#### Question 2 (Find and fix the bug)
The recursive type below breaks on methods. Fix it by excluding functions:
```typescript
type DeepLock<T> = {
  readonly [K in keyof T]: T[K] extends object ? DeepLock<T[K]> : T[K];
};
```

#### Question 3 (Write code from scratch)
Write `DeepMutable<T>` that recursively removes `readonly` from all properties and nested objects.

#### Question 4 (Explain in your own words)
Why is `DeepReadonly` necessary even when TypeScript has the built-in `Readonly<T>` utility?

---

### Solutions

#### Solution to Question 1
**Hint 1**: Is `b` read-only in `DeepReadonly`?

**Answer**:
No, it fails. `DeepReadonly` recursed into `a` and marked `b` as `readonly`.

#### Solution to Question 2
**Hint 1**: Add `T[K] extends Function ? T[K] : ...`.

**Answer**:
```typescript
type DeepLock<T> = {
  readonly [K in keyof T]: T[K] extends Function
    ? T[K]
    : T[K] extends object
    ? DeepLock<T[K]>
    : T[K];
};
```

#### Solution to Question 3
**Hint 1**: Use `-readonly` and recurse.

**Answer**:
```typescript
type DeepMutable<T> = {
  -readonly [K in keyof T]: T[K] extends Function
    ? T[K]
    : T[K] extends object
    ? DeepMutable<T[K]>
    : T[K];
};
```

#### Solution to Question 4
**Hint 1**: Does `Readonly<T>` protect nested objects?

**Answer**:
Built-in `Readonly<T>` is strictly shallow; it only prevents reassigning top-level properties. Nested objects inside a `Readonly` object remain completely mutable unless a recursive utility like `DeepReadonly<T>` traverses and locks each nested level.

---

### 11. Recall

1. What is the difference between shallow and deep immutability?
2. Why must functions be excluded when recursing into objects?
3. How do you remove `readonly` deeply across an object?

**If you remember only one thing:**
Recursive mapped types call themselves on nested objects to apply modifiers deeply across an entire schema.

---

# Topic 14: Mapping Over Unions of Object Keys

### 1. What is it?
You can construct mapped types directly from arbitrary unions of string literal keys:
```typescript
type Status = "draft" | "published" | "archived";

type StatusFlags = {
  [K in Status]: boolean;
};
```
Here, `K` iterates over each member of the union `Status`.

### 2. Why does it exist?
Often, you start with a union of string literals (like a list of event names, roles, or permission strings) and need to create an object where every member of that union is a required key.

Mapping over a union of string literals allows you to create these object shapes directly, without needing a base interface first.

### 3. Basic example

```typescript
type HttpMethod = "GET" | "POST" | "PUT" | "DELETE";

type RouteHandlers = {
  [M in HttpMethod]: (url: string) => void;
};

const router: RouteHandlers = {
  GET: (url) => console.log("GET", url),
  POST: (url) => console.log("POST", url),
  PUT: (url) => console.log("PUT", url),
  DELETE: (url) => console.log("DELETE", url),
};
```

**Line-by-line explanation:**
- `type HttpMethod`: A union of four string literals.
- `[M in HttpMethod]:`: Iterates over `"GET"`, `"POST"`, `"PUT"`, and `"DELETE"`.
- Every method must be implemented on `router`.

---

### 4. How it works inside TypeScript
1. **Union Iteration**: The `in` operator accepts any union of types that extend `string | number | symbol`.
2. **Exhaustive Keys**: Every member of the union becomes a required property key on the resulting object.
3. **Non-Homomorphic**: Because it does not use `keyof T`, it creates a clean, independent object type.

---

### 5. Think first

What happens if you omit `"DELETE"` in `router` above? Decide first.

```typescript
const router: RouteHandlers = {
  GET: (url) => {},
  POST: (url) => {},
  PUT: (url) => {},
};
```

---

**Answer and Reason:**

This code fails to compile:

```
Property 'DELETE' is missing in type '{ GET: ...; POST: ...; PUT: ...; }' but required in type 'RouteHandlers'.
```

**Reason**: Mapping over a union makes every member of the union a required property.

---

### 6. Try it yourself
Create a union `Role = "admin" | "editor" | "viewer"`. Create a mapped type `RoleDescriptions = { [R in Role]: string }`. Implement a valid object.

---

### 7. More examples

#### Example A: Generating Event Handlers from Event Names (Medium)

```typescript
type EventName = "click" | "hover" | "focus";

type EventListenerMap = {
  [E in EventName as `on${Capitalize<E>}`]: (event: Event) => void;
};
// { onClick: ...; onHover: ...; onFocus: ... }
```

**Line-by-line explanation:**
- Combines union mapping with key remapping and capitalization.

---

### 8. Common mistakes

#### Mistake 1: Trying to iterate over a non-literal type like `string`

**Wrong code:**
```typescript
type Bad = {
  [K in string]: number; // Error: An index signature must have a type annotation!
};
```

**Why it happens:**
`in` requires a discrete union of keys (like `"a" | "b"`). For arbitrary strings, you must use an index signature `{ [key: string]: number }` or `Record<string, number>`.

---

### 9. Rules to remember
1. `[K in Union]` loops over every literal member of a union.
2. Every union member becomes a required property.
3. Can be combined with `as` for key remapping and filtering.

---

### 10. Exercises

#### Question 1 (Predict the compile result)
What properties are required on `Obj`?
```typescript
type Keys = "x" | "y";
type Obj = { [K in Keys]: number };
```

#### Question 2 (Find and fix the bug)
The mapped type below fails to compile because it tries to use `in` on broad `string`. Fix it:
```typescript
type MapAll = { [K in string]: boolean };
```

#### Question 3 (Write code from scratch)
Define a union `Size = "sm" | "md" | "lg"`. Write a mapped type `SizeToPixels` that maps each size to a `number`.

#### Question 4 (Explain in your own words)
What is the difference between `[K in "a" | "b"]` and `[K in keyof T]`?

---

### Solutions

#### Solution to Question 1
**Hint 1**: The keys are `"x"` and `"y"`.

**Answer**:
Properties `x: number` and `y: number` are required.

#### Solution to Question 2
**Hint 1**: Use `Record<string, boolean>` or index signature `[key: string]: boolean`.

**Answer**:
```typescript
type MapAll = Record<string, boolean>;
```

#### Solution to Question 3
**Hint 1**: Use `[S in Size]: number`.

**Answer**:
```typescript
type Size = "sm" | "md" | "lg";
type SizeToPixels = {
  [S in Size]: number;
};

const sizes: SizeToPixels = {
  sm: 12,
  md: 16,
  lg: 24,
};
```

#### Solution to Question 4
**Hint 1**: Which one is homomorphic and inherits from an existing type?

**Answer**:
`[K in "a" | "b"]` is a non-homomorphic mapped type that iterates over an explicit union of literal keys to build a brand-new object. `[K in keyof T]` is a homomorphic mapped type that links directly to an existing object type `T` and inherits its property modifiers and tuple structures.

---

### 11. Recall

1. What syntax loops over a union of string literals?
2. Does `[K in Union]` require every member of the union to be present?
3. What is the difference between iterating over `"a" | "b"` versus `string`?

**If you remember only one thing:**
`[K in Union]` builds a strongly typed object where every member of a string literal union becomes a required property.

---

# Final Checkpoint Challenge: Topics 11 to 14

### Challenge Scenario
Build a type-safe database entity transformation pipeline:

1. Define an entity schema:
   ```typescript
   interface PostEntity {
     id: string;
     title: string;
     content: string;
     publishedAt: Date | null;
     tags: string[];
   }
   ```
2. Using value-side conditional mapping, create `JsonPost`:
   - If a property is a `Date | null`, convert it to `string | null`.
   - If a property is an array `(infer E)[]`, preserve it as `E[]`.
   - Leave other properties unchanged.
3. Write a `DeepReadonly<T>` mapped type that deeply freezes all nested properties and arrays.
4. Using key remapping and filtering (`never`), create `OnlyStringFields` that extracts only properties whose value type is `string`.
5. Apply `DeepReadonly` to `JsonPost`.

### Challenge Solution

```typescript
interface PostEntity {
  id: string;
  title: string;
  content: string;
  publishedAt: Date | null;
  tags: string[];
}

// 2. Conditionally transform Date to string:
type JsonPost = {
  [K in keyof PostEntity]: PostEntity[K] extends Date | null
    ? string | null
    : PostEntity[K];
};

// 3. DeepReadonly implementation:
type DeepReadonly<T> = {
  readonly [K in keyof T]: T[K] extends Function
    ? T[K]
    : T[K] extends readonly (infer E)[]
    ? readonly DeepReadonly<E>[]
    : T[K] extends object
    ? DeepReadonly<T[K]>
    : T[K];
};

// 4. Extract only string fields:
type OnlyStringFields = {
  [K in keyof PostEntity as PostEntity[K] extends string ? K : never]: PostEntity[K];
};
// Inferred as: { id: string; title: string; content: string }

// 5. Freeze JsonPost:
type FrozenPost = DeepReadonly<JsonPost>;

const post: FrozenPost = {
  id: "post_101",
  title: "TypeScript Mapped Types",
  content: "Deep dive into modifiers and remapping.",
  publishedAt: "2026-10-02T12:00:00Z",
  tags: ["typescript", "programming"],
};
```
