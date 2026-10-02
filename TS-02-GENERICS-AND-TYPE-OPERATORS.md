# Module TS-02: Generics, Constraints & Type Operators

Welcome to TypeScript Generics, Constraints, and Type Operators. This module teaches how to write reusable, type-safe code that works with any data type while preserving exact shapes and compiler checks.

---

# Topic 1: What Are Generics and Why Do We Need Them?

### 1. What is it?
A generic is a tool for creating reusable code components that work over a variety of types rather than a single one. It lets you pass types as parameters, just like you pass values as function arguments.

A type parameter (often written `<T>`) acts as a placeholder for a concrete type that will be provided when the code is called.

### 2. Why does it exist?
Without generics, if you want a function that returns whatever value you give it, you face two bad choices:
1. Write a separate function for every single type (`identityString`, `identityNumber`, `identityUser`).
2. Use `any`, which disables type checking completely and causes runtime bugs.

Generics solve this problem by capturing the exact type you pass in, and keeping that exact type intact on the output.

### 3. Basic example

```typescript
function identity<T>(value: T): T {
  return value;
}

const textResult = identity("hello");
const numberResult = identity(42);
```

**Line-by-line explanation:**
- `function identity<T>(value: T): T {`: Declares a generic function named `identity`. The `<T>` introduces a type parameter named `T`. The parameter `value` has type `T`, and the return type is also `T`.
- `return value;`: Returns the input unchanged.
- `}`: Closes the function body.
- `const textResult = identity("hello");`: Calls `identity` with a string. TypeScript infers `T` as `"hello"` (or `string`). The variable `textResult` is guaranteed to be a string.
- `const numberResult = identity(42);`: Calls `identity` with a number. TypeScript infers `T` as `number`. The variable `numberResult` is guaranteed to be a number.

---

### 4. How it works inside TypeScript
When TypeScript encounters a generic function call:

1. **Argument Inspection**: The compiler inspects the runtime values passed into the function arguments.
2. **Type Inference**: The compiler matches the argument types against the type parameter `T`.
3. **Instantiation**: The compiler creates a concrete version of the function signature specifically for that call (for example, substituting `string` for `T`).
4. **Output Binding**: The return type receives the substituted type, allowing autocomplete and strict type safety on the result.

---

### 5. Think first

What do you think is the type of `output` in the code below? Decide first.

```typescript
function wrap<T>(item: T) {
  return { data: item };
}

const output = wrap("config_item");
```

---

**Answer and Reason:**

The type of `output` is:

```typescript
{ data: string }
```

**Reason**: `wrap` takes `item: T` and returns `{ data: item }`. When called with `"config_item"`, TypeScript infers `T` as `string`. The return type becomes `{ data: string }`.

---

### 6. Try it yourself
Write a generic function `makePair<T>(first: T, second: T): [T, T]` that takes two arguments of the same type `T` and returns them as a 2-element tuple. Call it with two numbers, and then test calling it with a string and a number to see what TypeScript does.

---

### 7. More examples

#### Example A: Array Wrapping (Easy)

```typescript
function toArray<T>(item: T): T[] {
  return [item];
}

const list = toArray(100);
```

**Line-by-line explanation:**
- `toArray<T>(item: T): T[]`: Takes a single item of type `T` and returns an array of `T`.
- `const list = toArray(100);`: `T` is inferred as `number`, so `list` is typed as `number[]`.

#### Example B: Explicit Type Arguments (Medium)

```typescript
function createDefault<T>(value: T): T {
  return value;
}

const result = createDefault<string | null>(null);
```

**Line-by-line explanation:**
- `<string | null>`: Explicitly supplies the type argument instead of letting TypeScript infer it. This allows `result` to hold either a string or null later.

---

### 8. Common mistakes

#### Mistake 1: Using `any` instead of a generic parameter

**Wrong code:**
```typescript
function getFirst(items: any[]): any {
  return items[0];
}
const item = getFirst(["a", "b", "c"]);
// item is 'any' - TypeScript cannot check its methods!
```

**Why it happens:**
`any` destroys type tracking. The caller loses all autocomplete and type safety.

**Correct code:**
```typescript
function getFirst<T>(items: T[]): T | undefined {
  return items[0];
}
const item = getFirst(["a", "b", "c"]);
// item is string | undefined - completely type-safe!
```

---

### 9. Rules to remember
1. Generics let you pass types as parameters to functions, interfaces, and classes.
2. `<T>` defines a type parameter placeholder.
3. TypeScript infers `T` automatically from function arguments whenever possible.
4. Generics preserve exact types instead of widening to `any` or base types.

---

### 10. Exercises

#### Question 1 (Predict the compile result)
What is the inferred return type of `res`?
```typescript
function pick<T>(val: T): T {
  return val;
}
const res = pick(true);
```

#### Question 2 (Find and fix the bug)
The function below should return a generic array, but fails to compile because the type parameter is missing from the function signature. Fix it:
```typescript
function duplicate(item: T): T[] {
  return [item, item];
}
```

#### Question 3 (Write code from scratch)
Write a generic function `boxValue<T>(value: T): { value: T; createdAt: number }` that takes a value of any type, creates an object containing that value and a timestamp number, and returns it.

#### Question 4 (Explain in your own words)
Why is a generic function better than a function that takes and returns `unknown`?

---

### Solutions

#### Solution to Question 1
**Hint 1**: What argument was passed to `pick`?
**Hint 2**: Look at the literal boolean passed.

**Answer**:
The inferred return type is `boolean` (specifically the literal `true`).

#### Solution to Question 2
**Hint 1**: Add `<T>` right after the function name.

**Answer**:
```typescript
function duplicate<T>(item: T): T[] {
  return [item, item];
}
```

#### Solution to Question 3
**Hint 1**: Return `{ value, createdAt: Date.now() }`.

**Answer**:
```typescript
function boxValue<T>(value: T): { value: T; createdAt: number } {
  return {
    value: value,
    createdAt: Date.now(),
  };
}
```

#### Solution to Question 4
**Hint 1**: What can you do with an `unknown` return value without narrowing?

**Answer**:
If a function returns `unknown`, the caller must perform manual type checks before using the returned value. A generic function preserves the exact original type, so the caller can use the returned value immediately without any extra checks.

---

### 11. Recall

1. What syntax introduces a type parameter on a function?
2. What happens to type safety when you replace generics with `any`?
3. Can TypeScript infer generic type arguments without you typing `<string>` manually?

**If you remember only one thing:**
Generics allow functions to accept any type while preserving the exact type on the output.

---

# Topic 2: Generic Functions and Arrow Functions

### 1. What is it?
Generic syntax works with all styles of functions in TypeScript, including standard function declarations, function expressions, and arrow functions.

When writing generic arrow functions, the syntax uses `<T>` immediately before the parameter parentheses.

### 2. Why does it exist?
Modern JavaScript makes heavy use of arrow functions (callbacks, array methods, functional pipelines). TypeScript supports generics on arrow functions so you can write callbacks without losing type safety.

### 3. Basic example

```typescript
// Standard function declaration:
function firstItem<T>(arr: T[]): T | undefined {
  return arr[0];
}

// Generic arrow function:
const lastItem = <T>(arr: T[]): T | undefined => {
  return arr[arr.length - 1];
};

const numbers = [10, 20, 30];
const first = firstItem(numbers);
const last = lastItem(numbers);
```

**Line-by-line explanation:**
- `function firstItem<T>(arr: T[]): T | undefined {`: Declares a generic function. It receives an array of elements of type `T` and returns either `T` or `undefined`.
- `const lastItem = <T>(arr: T[]): T | undefined => {`: Declares a generic arrow function. The `<T>` before `(arr: T[])` declares the type parameter for the arrow function.
- `const numbers = [10, 20, 30];`: Inferred as `number[]`.
- `const first = firstItem(numbers);`: `T` is `number`. `first` is inferred as `number | undefined`.
- `const last = lastItem(numbers);`: `T` is `number`. `last` is inferred as `number | undefined`.

---

### 4. How it works inside TypeScript
1. **Arrow Function Parsing**: In `.ts` files, `<T>` before parentheses is recognized as a generic type parameter.
2. **TSX Ambiguity**: In `.tsx` files (used in React), the compiler might confuse `<T>` with an opening JSX tag like `<T>...</T>`. To resolve this, TypeScript allows `<T,>` (with a trailing comma) or `<T extends unknown>`.
3. **Parameter Scoping**: The type parameter `T` is available throughout the function's parameter list, return type annotation, and function body.

---

### 5. Think first

In a `.tsx` file, what happens when you write this arrow function? Decide first.

```typescript
const wrap = <T>(item: T) => [item];
```

---

**Answer and Reason:**

In a `.tsx` file, this can cause a syntax error:

```
JSX element 'T' has no corresponding closing tag.
```

**Reason**: In TSX files, the compiler assumes `<T>` is an HTML/JSX tag. To fix this, write `<T,>` with a trailing comma: `const wrap = <T,>(item: T) => [item];`.

---

### 6. Try it yourself
Write a generic arrow function named `swapPair` that takes a tuple `[A, B]` with two different generic types `<A, B>`, and returns the swapped tuple `[B, A]`. Test it by passing `["status", 200]`.

---

### 7. More examples

#### Example A: Multiple Type Parameters on an Arrow Function (Easy)

```typescript
const makeEntry = <K, V>(key: K, value: V): [K, V] => {
  return [key, value];
};

const entry = makeEntry("id", 101);
```

**Line-by-line explanation:**
- `<K, V>`: Introduces two independent generic type parameters.
- `entry`: Inferred as `[string, number]`.

#### Example B: Higher-Order Generic Callback (Medium)

```typescript
const mapList = <T, R>(list: T[], transform: (item: T) => R): R[] => {
  return list.map(transform);
};

const lengths = mapList(["apple", "banana"], (word) => word.length);
```

**Line-by-line explanation:**
- `T` is inferred as `string` from the list.
- `R` is inferred as `number` from `word.length`.
- `lengths` is inferred as `number[]`.

---

### 8. Common mistakes

#### Mistake 1: Declaring type parameters inside the parameter list

**Wrong code:**
```typescript
const run = (value: <T>) => value; // Syntax Error!
```

**Why it happens:**
Type parameters must be declared before the parameter parentheses, not inside them.

**Correct code:**
```typescript
const run = <T>(value: T) => value;
```

---

### 9. Rules to remember
1. Generic arrow functions place `<T>` right before the argument parentheses: `<T>(param: T) => result`.
2. In TSX files, use `<T,>` with a trailing comma to avoid JSX tag confusion.
3. You can define multiple type parameters separated by commas: `<A, B>`.

---

### 10. Exercises

#### Question 1 (Predict the compile result)
What is the inferred return type of `result`?
```typescript
const combine = <T, U>(a: T, b: U) => ({ first: a, second: b });
const result = combine("user", 99);
```

#### Question 2 (Find and fix the bug)
Fix the syntax error in this arrow function:
```typescript
const identityArrow = (item: T): T => item;
```

#### Question 3 (Write code from scratch)
Write a generic arrow function `filterList` that takes an array `items: T[]` and a predicate function `test: (item: T) => boolean`, and returns an array `T[]` containing only items where `test` returns true.

#### Question 4 (Explain in your own words)
Why does `<T,>` with a comma resolve JSX ambiguity in `.tsx` files?

---

### Solutions

#### Solution to Question 1
**Hint 1**: Trace the types of `a` and `b`.

**Answer**:
The inferred return type is `{ first: string; second: number }`.

#### Solution to Question 2
**Hint 1**: Add `<T>` before `(item: T)`.

**Answer**:
```typescript
const identityArrow = <T>(item: T): T => item;
```

#### Solution to Question 3
**Hint 1**: Use `items.filter(test)`.

**Answer**:
```typescript
const filterList = <T>(items: T[], test: (item: T) => boolean): T[] => {
  return items.filter(test);
};
```

#### Solution to Question 4
**Hint 1**: Can a JSX tag contain a comma inside `<Tag,>`?

**Answer**:
A JSX element name cannot contain a comma (like `<T,>`). The comma proves to the parser that the angle brackets represent a TypeScript generic parameter list rather than an opening JSX tag.

---

### 11. Recall

1. Where does `<T>` sit in a generic arrow function definition?
2. How do you resolve JSX tag confusion on an arrow function in `.tsx` files?
3. Can an arrow function have more than one generic type parameter?

**If you remember only one thing:**
Place `<T>` before the parameter parentheses to create generic arrow functions.

---

# Topic 3: Generic Interfaces and Type Aliases

### 1. What is it?
Generics are not limited to functions. You can also define generic interfaces and generic type aliases.

A generic interface or type alias is a reusable blueprint where one or more property types are defined as placeholders to be filled in when the type is used.

### 2. Why does it exist?
In real applications, common data envelopes wrap many different kinds of data. For example:
- An API response envelope has `success`, `timestamp`, and `data`.
- A database result has `records`, `totalCount`, and `page`.

Without generic interfaces, you would have to duplicate the envelope structure for every data model (`UserApiResponse`, `ProductApiResponse`, `OrderApiResponse`). A generic interface lets you define the envelope once.

### 3. Basic example

```typescript
interface ApiResponse<T> {
  success: boolean;
  timestamp: number;
  data: T;
}

type UserData = { id: string; name: string };
type ProductData = { id: string; price: number };

const userResponse: ApiResponse<UserData> = {
  success: true,
  timestamp: 1700000000,
  data: { id: "usr_1", name: "Alex" },
};

const productResponse: ApiResponse<ProductData> = {
  success: true,
  timestamp: 1700000000,
  data: { id: "prd_1", price: 49.99 },
};
```

**Line-by-line explanation:**
- `interface ApiResponse<T> {`: Declares a generic interface with type parameter `T`.
- `data: T;`: The `data` property will have whatever type is passed into `ApiResponse`.
- `type UserData = { id: string; name: string };`: Defines a specific user shape.
- `const userResponse: ApiResponse<UserData> = { ... };`: Specializes `ApiResponse` with `UserData`. `data` must now match `{ id: string; name: string }`.

---

### 4. How it works inside TypeScript
1. **Type Substitution**: When you write `ApiResponse<UserData>`, TypeScript creates a concrete type where every occurrence of `T` is replaced with `UserData`.
2. **Property Verification**: The object assigned to the interface is checked against the substituted properties.
3. **Autocomplete Support**: Reading `userResponse.data.` gives direct autocomplete for `id` and `name`.

---

### 5. Think first

What happens if we pass the wrong shape into `data` in `userResponse`? Decide first.

```typescript
const userResponse: ApiResponse<{ name: string }> = {
  success: true,
  timestamp: 100,
  data: { age: 30 },
};
```

---

**Answer and Reason:**

This code fails to compile:

```
Type '{ age: number; }' is not assignable to type '{ name: string; }'.
  Property 'name' is missing in type '{ age: number; }'.
```

**Reason**: `ApiResponse<{ name: string }>` requires `data` to have a `name: string` property. Because `data` is missing `name`, TypeScript rejects the assignment.

---

### 6. Try it yourself
Create a generic type alias `PaginatedResult<T>` that contains:
- `items: T[]`
- `totalCount: number`
- `currentPage: number`

Create a variable holding a `PaginatedResult<string>` containing three string items, and verify that it compiles.

---

### 7. More examples

#### Example A: Generic Type Alias for Key-Value Pairs (Easy)

```typescript
type KeyValuePair<K, V> = {
  key: K;
  value: V;
};

const entry: KeyValuePair<string, number> = {
  key: "score",
  value: 95,
};
```

**Line-by-line explanation:**
- `KeyValuePair<K, V>`: Uses two type parameters to describe a pair.

#### Example B: Generic Result Union (Medium)

```typescript
type Result<T, E> =
  | { success: true; value: T }
  | { success: false; error: E };

const okResult: Result<string, Error> = {
  success: true,
  value: "File uploaded successfully",
};
```

**Line-by-line explanation:**
- A generic discriminated union that safely models operations that can succeed with `T` or fail with `E`.

---

### 8. Common mistakes

#### Mistake 1: Forgetting to supply the type argument when using the interface

**Wrong code:**
```typescript
interface Box<T> {
  item: T;
}
// let b: Box; // Error: Generic type 'Box<T>' requires 1 type argument(s).
```

**Why it happens:**
Unlike generic functions (which can infer types from values), generic interfaces must either receive an explicit type argument (`Box<string>`) or have a default type (`interface Box<T = string>`).

---

### 9. Rules to remember
1. Generic interfaces and type aliases define reusable blueprints with type placeholders.
2. Syntax: `interface Name<T> { ... }` and `type Name<T> = ...`.
3. You must supply concrete type arguments when using generic types, unless defaults are defined.

---

### 10. Exercises

#### Question 1 (Predict the compile result)
Will the following code compile?
```typescript
interface Container<T> {
  value: T;
}
const c: Container<number> = { value: "hello" };
```

#### Question 2 (Find and fix the bug)
Fix the error in this type definition:
```typescript
type Tree<T> = {
  value: T;
  left: Tree;
  right: Tree;
};
```

#### Question 3 (Write code from scratch)
Define a generic interface `CacheStore<T>` that contains two methods:
- `get(key: string): T | undefined`
- `set(key: string, value: T): void`

Create an object conforming to `CacheStore<number>`.

#### Question 4 (Explain in your own words)
Why is `ApiResponse<T>` better than defining separate interfaces for every response type?

---

### Solutions

#### Solution to Question 1
**Hint 1**: Compare the type argument with the value property.

**Answer**:
No, it fails. `Container<number>` requires `value` to be a `number`, but `"hello"` is a `string`.

#### Solution to Question 2
**Hint 1**: The nested `Tree` references must also specify `<T>`.

**Answer**:
```typescript
type Tree<T> = {
  value: T;
  left: Tree<T> | null;
  right: Tree<T> | null;
};
```

#### Solution to Question 3
**Hint 1**: Implement `get` and `set` with `T = number`.

**Answer**:
```typescript
interface CacheStore<T> {
  get(key: string): T | undefined;
  set(key: string, value: T): void;
}

const numCache: CacheStore<number> = {
  get(key: string) {
    return 42;
  },
  set(key: string, value: number) {},
};
```

#### Solution to Question 4
**Hint 1**: Think about code duplication when an API has 50 different endpoints.

**Answer**:
It avoids duplicating the shared envelope properties (`success`, `timestamp`) across dozens of separate interfaces. If the envelope changes in the future, you only need to update `ApiResponse<T>` in one place.

---

### 11. Recall

1. What syntax creates a generic interface?
2. Does a generic interface require type arguments when used in a type annotation?
3. Can a generic type alias be a discriminated union?

**If you remember only one thing:**
Generic interfaces and type aliases allow you to write reusable data structures and envelopes once.

---

# Topic 4: Generic Classes and State Containers

### 1. What is it?
A generic class is a class that includes type parameters in its class declaration.

The type parameters can be used across the class's properties, constructor arguments, method parameters, and return types.

### 2. Why does it exist?
Data structures such as stacks, queues, caches, and state containers hold collections of items. A stack of strings works with the exact same logic as a stack of numbers.

Generic classes let you write the data structure logic once, while guaranteeing that each instance strictly holds only elements of its specified type.

### 3. Basic example

```typescript
class Box<T> {
  private content: T;

  constructor(initial: T) {
    this.content = initial;
  }

  getContent(): T {
    return this.content;
  }

  setContent(newContent: T): void {
    this.content = newContent;
  }
}

const stringBox = new Box("Secret");
console.log(stringBox.getContent().toUpperCase()); // Type is string!

const numberBox = new Box(100);
console.log(numberBox.getContent().toFixed(2));     // Type is number!
```

**Line-by-line explanation:**
- `class Box<T> {`: Declares a generic class with type parameter `T`.
- `private content: T;`: The private property `content` has type `T`.
- `constructor(initial: T) { this.content = initial; }`: The constructor accepts an item of type `T`. TypeScript infers `T` from `initial`.
- `getContent(): T`: Method that returns `T`.
- `const stringBox = new Box("Secret");`: TypeScript infers `T` as `string`. `stringBox` has type `Box<string>`. Calling `getContent()` safely returns a string.

---

### 4. How it works inside TypeScript
1. **Instance Type Parameterization**: When an instance is created (`new Box("test")`), TypeScript binds `T` to `string` for that specific instance.
2. **Static Member Restriction**: Static members on a class **cannot** refer to the class's type parameters. Static properties belong to the class constructor itself, not to any individual generic instance.

---

### 5. Think first

What happens if you try to use `T` on a `static` property of a generic class? Decide first.

```typescript
class DataStore<T> {
  static defaultValue: T;
}
```

---

**Answer and Reason:**

This code fails to compile:

```
Static members cannot reference class type parameters.
```

**Reason**: `T` is determined per instance when you create an object with `new DataStore<string>()`. The static property `defaultValue` belongs to the constructor `DataStore` which is shared across all instances. It cannot have a single instance-specific type.

---

### 6. Try it yourself
Create a generic class `Stack<T>`. Include an array `private items: T[] = []`. Add a method `push(item: T): void` and a method `pop(): T | undefined`. Create an instance for numbers, push three numbers, and pop one.

---

### 7. More examples

#### Example A: A Type-Safe Queue (Easy)

```typescript
class Queue<T> {
  private items: T[] = [];

  enqueue(item: T): void {
    this.items.push(item);
  }

  dequeue(): T | undefined {
    return this.items.shift();
  }
}

const q = new Queue<string>();
q.enqueue("first");
```

**Line-by-line explanation:**
- `Queue<T>` manages items of type `T`. Passing `"first"` is valid; passing `123` triggers a compile error.

#### Example B: State Container with Subscriptions (Medium)

```typescript
class ObservableState<T> {
  private listeners: ((state: T) => void)[] = [];

  constructor(private state: T) {}

  getState(): T {
    return this.state;
  }

  setState(next: T): void {
    this.state = next;
    for (const listener of this.listeners) {
      listener(this.state);
    }
  }

  subscribe(listener: (state: T) => void): void {
    this.listeners.push(listener);
  }
}
```

**Line-by-line explanation:**
- All listeners are guaranteed to receive arguments of type `T`.

---

### 8. Common mistakes

#### Mistake 1: Expecting static methods to share the class type parameter

**Wrong code:**
```typescript
class Factory<T> {
  static create(): T { // Error!
    // ...
  }
}
```

**Why it happens:**
Static methods do not have access to the instance's type parameter `T`.

**Correct code:**
Give the static method its own generic type parameter:
```typescript
class Factory<T> {
  static create<U>(item: U): Factory<U> {
    return new Factory<U>();
  }
}
```

---

### 9. Rules to remember
1. Generic classes parameterize instance properties and methods with `<T>`.
2. TypeScript can infer `T` from constructor arguments.
3. Static members cannot reference class type parameters.
4. Each instance of a generic class maintains its own independent concrete type.

---

### 10. Exercises

#### Question 1 (Predict the compile result)
Will the following code compile?
```typescript
class KeyStore<T> {
  constructor(public val: T) {}
}
const store = new KeyStore("token_1");
store.val = 42;
```

#### Question 2 (Find and fix the bug)
Fix the compile error in the class below:
```typescript
class Registry<T> {
  static defaultItem: T;
}
```

#### Question 3 (Write code from scratch)
Write a generic class `MemoryCache<V>` with:
- a private property `entries: Record<string, V> = {}`
- a method `put(key: string, val: V): void`
- a method `get(key: string): V | undefined`

Create an instance storing booleans.

#### Question 4 (Explain in your own words)
Why are static class members forbidden from using class generic type parameters?

---

### Solutions

#### Solution to Question 1
**Hint 1**: What was `T` inferred as when `new KeyStore("token_1")` was called?

**Answer**:
No, it fails. `T` was inferred as `string`. Assigning number `42` to `val` causes: `Type 'number' is not assignable to type 'string'`.

#### Solution to Question 2
**Hint 1**: Static members cannot use instance type parameters. Make it non-static or use a concrete type.

**Answer**:
```typescript
class Registry<T> {
  public defaultItem: T | undefined;
}
```

#### Solution to Question 3
**Hint 1**: Use `this.entries[key] = val`.

**Answer**:
```typescript
class MemoryCache<V> {
  private entries: Record<string, V> = {};

  put(key: string, val: V): void {
    this.entries[key] = val;
  }

  get(key: string): V | undefined {
    return this.entries[key];
  }
}

const cache = new MemoryCache<boolean>();
cache.put("isReady", true);
```

#### Solution to Question 4
**Hint 1**: When is a static property created versus when are generic instances created?

**Answer**:
Static members exist once on the class constructor itself, before any instances exist. Type parameters exist only when an instance is created with specific types. Because multiple instances might use different types (`Box<string>` vs `Box<number>`), a single static member cannot know which type to use.

---

### 11. Recall

1. Where are type parameters declared on a generic class?
2. Can a generic class infer `T` from its constructor arguments?
3. Can static methods use the class's type parameters?

**If you remember only one thing:**
Generic classes let you build reusable data structures that are strongly typed per instance.

---

# Topic 5: Generic Constraints with `extends` (Upper Bounds)

### 1. What is it?
By default, an unconstrained generic `<T>` can be any type in JavaScript (numbers, strings, booleans, objects, `null`). Because `T` could be anything, TypeScript forbids accessing any specific properties on a variable of type `T`.

A **Generic Constraint** uses the `extends` keyword (`<T extends TargetType>`) to limit the types that can be passed into `T`. It guarantees that `T` has at least the properties defined in `TargetType`.

### 2. Why does it exist?
Suppose you want a function that logs the length of an item (`item.length`).

If you write `<T>(item: T)`, TypeScript reports an error: `Property 'length' does not exist on type 'T'`. Because `T` might be a number, which has no `.length`.
By constraining `<T extends { length: number }>`, you tell the compiler: "You can pass any type, as long as it has a `.length` property".

### 3. Basic example

```typescript
interface HasLength {
  length: number;
}

function logLength<T extends HasLength>(item: T): T {
  console.log(item.length); // Safe! Guaranteed to have .length
  return item;
}

logLength("hello");       // Valid: string has .length
logLength([1, 2, 3]);     // Valid: array has .length
logLength({ length: 10 });// Valid: object has .length
// logLength(100);        // Compile Error: number has no .length!
```

**Line-by-line explanation:**
- `interface HasLength { length: number; };`: Defines the minimum requirement.
- `<T extends HasLength>`: Constrains `T`. Any argument passed to `item` must be assignable to `HasLength`.
- `console.log(item.length);`: TypeScript allows this line because `T` is guaranteed to have `length`.
- `return item;`: Returns the exact type `T` (not just `HasLength`), preserving the original shape.
- `// logLength(100);`: Rejected because `100` does not have a `length` property.

---

### 4. How it works inside TypeScript
1. **Upper Bound Check**: `T extends HasLength` establishes an upper bound. The set of allowed types for `T` is restricted to subtypes of `HasLength`.
2. **Property Access**: Inside the function, the compiler permits accessing all properties of the constraint (`length`).
3. **Preserving Specificity**: Unlike accepting `(item: HasLength)`, using `<T extends HasLength>` preserves the exact incoming type on the return value.

---

### 5. Think first

Compare these two functions. What is the difference in the return type of `result`? Decide first.

```typescript
function f1(item: { id: string }) { return item; }
function f2<T extends { id: string }>(item: T) { return item; }

const user = { id: "usr_1", name: "Alex", role: "admin" };
const r1 = f1(user);
const r2 = f2(user);
```

---

**Answer and Reason:**

- In `r1`: The type is narrowed/widened to only `{ id: string }`. The properties `name` and `role` are lost on the return type!
- In `r2`: The type is preserved as `{ id: string; name: string; role: string }`.

**Reason**: `f1` returns the base type `{ id: string }`. `f2` uses a generic constraint, which checks that `user` has `id`, but returns the exact concrete type `T`.

---

### 6. Try it yourself
Create an interface `HasId { id: number }`. Write a generic function `printId<T extends HasId>(item: T): void`. Call it with an object `{ id: 1, title: "Book", pages: 300 }`. Notice that extra properties are allowed and preserved.

---

### 7. More examples

#### Example A: Constraining to Primitive Unions (Easy)

```typescript
function stringifyPrimitive<T extends string | number | boolean>(val: T): string {
  return String(val);
}

stringifyPrimitive(42);      // Allowed
stringifyPrimitive("text");  // Allowed
// stringifyPrimitive({});   // Error: Object is not assignable to string | number | boolean
```

**Line-by-line explanation:**
- Restricts `T` to only string, number, or boolean.

#### Example B: Constraining to Objects (Medium)

```typescript
function mergeObjects<A extends object, B extends object>(a: A, b: B): A & B {
  return { ...a, ...b };
}

const merged = mergeObjects({ name: "Alex" }, { age: 30 });
```

**Line-by-line explanation:**
- `<A extends object, B extends object>` ensures primitives like `123` cannot be passed to the merge function.

---

### 8. Common mistakes

#### Mistake 1: Trying to access properties without a constraint

**Wrong code:**
```typescript
function printName<T>(entity: T) {
  console.log(entity.name); // Error: Property 'name' does not exist on type 'T'.
}
```

**Why it happens:**
`T` could be anything. TypeScript cannot assume `entity` has a `name` property unless you constrain it.

**Correct code:**
```typescript
function printName<T extends { name: string }>(entity: T) {
  console.log(entity.name);
}
```

---

### 9. Rules to remember
1. Use `<T extends Target>` to constrain what types can be passed into `T`.
2. Generic constraints give you access to properties on `T` without losing the exact return type.
3. Any type passed to `T` must satisfy all requirements of the constraint.

---

### 10. Exercises

#### Question 1 (Predict the compile result)
Will the following code compile?
```typescript
function logSize<T extends { size: number }>(val: T) {
  return val.size;
}
logSize({ size: 10, color: "blue" });
```

#### Question 2 (Find and fix the bug)
The function below fails to compile on line 2. Fix it by adding a generic constraint:
```typescript
function getCount<T>(item: T): number {
  return item.count;
}
```

#### Question 3 (Write code from scratch)
Write a generic function `cloneRecord<T extends { id: string }>(item: T): T` that returns a shallow copy `{ ...item }`. Verify that properties other than `id` remain accessible on the result.

#### Question 4 (Explain in your own words)
Why is `<T extends HasId>(item: T): T` better than `(item: HasId): HasId`?

---

### Solutions

#### Solution to Question 1
**Hint 1**: Does `{ size: 10, color: "blue" }` have `size: number`?

**Answer**:
Yes, it compiles without error. The object satisfies `{ size: number }`.

#### Solution to Question 2
**Hint 1**: Add `extends { count: number }` to `<T>`.

**Answer**:
```typescript
function getCount<T extends { count: number }>(item: T): number {
  return item.count;
}
```

#### Solution to Question 3
**Hint 1**: Return `{ ...item }`.

**Answer**:
```typescript
function cloneRecord<T extends { id: string }>(item: T): T {
  return { ...item };
}

const user = cloneRecord({ id: "1", name: "Alex" });
console.log(user.name); // Preserved!
```

#### Solution to Question 4
**Hint 1**: Think about what properties are visible on the returned value.

**Answer**:
If you use `(item: HasId): HasId`, the return type is widened to `HasId`, losing any other properties the input had (like `name` or `email`). With a generic constraint, the exact input type `T` is preserved on the return value.

---

### 11. Recall

1. What keyword creates a generic constraint?
2. Can an object with extra properties satisfy a generic constraint?
3. What is the difference between returning a constraint interface versus returning `T`?

**If you remember only one thing:**
Generic constraints limit allowed types to those with required properties, while preserving the exact input type.

---

# Checkpoint Challenge: Topics 1 to 5

### Challenge Scenario
Build a type-safe generic cache repository for entity models.

1. Define an interface `BaseEntity` requiring `id: string` and `createdAt: number`.
2. Create a generic class `Repository<T extends BaseEntity>`.
3. Inside `Repository<T>`:
   - Store entities in a private map: `private store = new Map<string, T>()`.
   - Add a method `save(entity: T): void` that saves the entity using `entity.id` as the key.
   - Add a method `findById(id: string): T | undefined` that looks up the entity.
4. Create a specific entity type `UserEntity = BaseEntity & { name: string; role: string }`.
5. Create an instance of `Repository<UserEntity>`, save a user, retrieve it, and verify that `user.name` is fully accessible and typed.

### Challenge Solution

```typescript
interface BaseEntity {
  id: string;
  createdAt: number;
}

class Repository<T extends BaseEntity> {
  private store = new Map<string, T>();

  save(entity: T): void {
    this.store.set(entity.id, entity);
  }

  findById(id: string): T | undefined {
    return this.store.get(id);
  }
}

type UserEntity = BaseEntity & {
  name: string;
  role: string;
};

const userRepo = new Repository<UserEntity>();
userRepo.save({
  id: "usr_100",
  createdAt: 1700000000,
  name: "Morgan",
  role: "admin",
});

const retrieved = userRepo.findById("usr_100");
if (retrieved) {
  console.log("Found user:", retrieved.name, "(Role:", retrieved.role, ")");
}
```

---

# Topic 6: The `keyof` Type Operator and Lookup Types (`T[K]`)

### 1. What is it?
The `keyof` operator takes an object type and produces a union of all its property names (keys) as string or number literal types.

An **Indexed Access Type** (or Lookup Type, written `T[K]`) looks up the type of a specific property `K` on an object type `T`.

### 2. Why does it exist?
In JavaScript, functions frequently read properties dynamically by key (such as `obj[key]`).

If `key` is just a plain `string`, TypeScript cannot know if the property exists on `obj`, nor what type the property has. The `keyof` operator ensures that `key` is a valid property name, and `T[K]` gives you the exact type of that property.

### 3. Basic example

```typescript
type User = {
  id: string;
  name: string;
  age: number;
};

// 1. keyof User produces: "id" | "name" | "age"
type UserKeys = keyof User;

// 2. Lookup type User["age"] produces: number
type AgeType = User["age"];

const validKey: UserKeys = "name"; // Allowed
// const invalidKey: UserKeys = "email"; // Error: 'email' is not assignable to 'id' | 'name' | 'age'
```

**Line-by-line explanation:**
- `type UserKeys = keyof User;`: `keyof` extracts the property names of `User` into the union `"id" | "name" | "age"`.
- `type AgeType = User["age"];`: Extracts the type of the `age` property, which is `number`.
- `const validKey: UserKeys = "name";`: Valid because `"name"` is in the union.
- `// const invalidKey: UserKeys = "email";`: Fails because `"email"` is not a property on `User`.

---

### 4. How it works inside TypeScript
1. **Key Extraction**: `keyof` inspects the declared property names of a type and creates a union of literals.
2. **Lookup Resolution**: `T[K]` navigates into `T` at key `K` and returns the property's declared type.
3. **Union Distribution**: If `K` is a union (like `"id" | "age"`), `User["id" | "age"]` produces `string | number`.

---

### 5. Think first

What is the resulting type of `PropertyTypes` below? Decide first.

```typescript
type Settings = {
  volume: number;
  mute: boolean;
};

type PropertyTypes = Settings[keyof Settings];
```

---

**Answer and Reason:**

The resulting type is:

```typescript
number | boolean
```

**Reason**: `keyof Settings` produces `"volume" | "mute"`. Looking up `Settings["volume" | "mute"]` looks up both properties and returns the union of their types: `number | boolean`.

---

### 6. Try it yourself
Create an object type `Config` with properties `host: string`, `port: number`, and `secure: boolean`. Create a type alias `ConfigKey = keyof Config`. Declare a variable `k: ConfigKey` and assign `"port"` to it.

---

### 7. More examples

#### Example A: Reading Array Element Types (Easy)

```typescript
type NumberList = number[];
type ElementType = NumberList[number]; // Inferred as: number
```

**Line-by-line explanation:**
- Indexing an array type by `number` extracts the type of its elements.

#### Example B: Nested Lookup Types (Medium)

```typescript
type AppState = {
  user: {
    profile: {
      avatarUrl: string;
    };
  };
};

type Avatar = AppState["user"]["profile"]["avatarUrl"]; // string
```

**Line-by-line explanation:**
- You can chain lookup types to reach deeply nested property types.

---

### 8. Common mistakes

#### Mistake 1: Using a runtime variable name instead of a type in `keyof`

**Wrong code:**
```typescript
const user = { name: "Alex" };
// type K = keyof user; // Error: 'user' refers to a value, but is being used as a type here.
```

**Why it happens:**
`keyof` operates on types, not runtime values.

**Correct code:**
Use `typeof` to get the value's type first:
```typescript
type K = keyof typeof user; // "name"
```

---

### 9. Rules to remember
1. `keyof T` returns a union of all property names of type `T`.
2. `T[K]` returns the type of property `K` on type `T`.
3. Use `keyof typeof variable` to get keys from a runtime object variable.

---

### 10. Exercises

#### Question 1 (Predict the compile result)
What is the type of `Val`?
```typescript
type Point = { x: number; y: number; label: string };
type Val = Point["x"];
```

#### Question 2 (Find and fix the bug)
The type alias below fails to compile. Fix it:
```typescript
const settings = { theme: "dark", level: 1 };
type SettingKeys = keyof settings;
```

#### Question 3 (Write code from scratch)
Define a type `Person` with `name: string`, `age: number`, and `isEmployed: boolean`. Write a type alias `AllPersonValues` that extracts the union of all value types from `Person`.

#### Question 4 (Explain in your own words)
What is the difference between `keyof T` and `T[keyof T]`?

---

### Solutions

#### Solution to Question 1
**Hint 1**: What type is the property `x` on `Point`?

**Answer**:
The type is `number`.

#### Solution to Question 2
**Hint 1**: Add `typeof` before `settings`.

**Answer**:
```typescript
const settings = { theme: "dark", level: 1 };
type SettingKeys = keyof typeof settings;
```

#### Solution to Question 3
**Hint 1**: Use `Person[keyof Person]`.

**Answer**:
```typescript
type Person = {
  name: string;
  age: number;
  isEmployed: boolean;
};

type AllPersonValues = Person[keyof Person];
// Evaluates to: string | number | boolean
```

#### Solution to Question 4
**Hint 1**: One returns the property names; the other returns the property values.

**Answer**:
`keyof T` produces a union of the property names (keys) of `T`. `T[keyof T]` produces a union of all the property value types stored under those keys.

---

### 11. Recall

1. What operator extracts the union of property names from an object type?
2. What syntax extracts the type of a property `K` on `T`?
3. How do you apply `keyof` to a runtime variable?

**If you remember only one thing:**
`keyof T` extracts property names, and `T[K]` extracts the type of values stored under those names.

---

# Topic 7: Multiple Generic Parameters and Key Constraints

### 1. What is it?
You can combine generics and `keyof` to write functions that accept an object and one of its keys:
```typescript
function getProperty<T, K extends keyof T>(obj: T, key: K): T[K]
```
Here, `K` is constrained to be a valid key of `T`, and the return type is automatically typed as `T[K]`.

### 2. Why does it exist?
In JavaScript, reading dynamic properties using `obj[key]` is common (for example, in property getters, event handlers, or sorting functions).

Without this pattern, `key` would have to be typed as `string`, and the return type would be `any` or `unknown`. By constraining `K extends keyof T`, TypeScript verifies that the key exists, and returns the exact type of that property with full autocomplete.

### 3. Basic example

```typescript
function getProperty<T, K extends keyof T>(obj: T, key: K): T[K] {
  return obj[key];
}

const user = {
  id: "usr_101",
  name: "Morgan",
  age: 28,
};

const userName = getProperty(user, "name"); // Type: string
const userAge = getProperty(user, "age");   // Type: number
// getProperty(user, "salary");             // Compile Error: 'salary' does not exist!
```

**Line-by-line explanation:**
- `<T, K extends keyof T>`: Declares two type parameters. `T` is the object type. `K` is constrained to only valid keys of `T`.
- `(obj: T, key: K): T[K]`: Takes `obj` and `key`, and returns `T[K]` (the exact type of property `key` on `obj`).
- `const userName = getProperty(user, "name");`: `K` is `"name"`. `T["name"]` is `string`. `userName` is typed as `string`.
- `const userAge = getProperty(user, "age");`: `K` is `"age"`. `T["age"]` is `number`. `userAge` is typed as `number`.
- `// getProperty(user, "salary");`: Fails because `"salary"` is not in `"id" | "name" | "age"`.

---

### 4. How it works inside TypeScript
1. **First Parameter Binding**: When `user` is passed, TypeScript infers `T` as `{ id: string; name: string; age: number }`.
2. **Second Parameter Constraint**: The constraint `keyof T` becomes `"id" | "name" | "age"`. The argument `"name"` is validated against this union.
3. **Lookup Resolution**: The return type `T[K]` is evaluated as `T["name"]`, which resolves directly to `string`.

---

### 5. Think first

What happens when you call `setProperty` below with a mismatched value type? Decide first.

```typescript
function setProperty<T, K extends keyof T>(obj: T, key: K, value: T[K]): void {
  obj[key] = value;
}

const config = { port: 8080, host: "localhost" };
setProperty(config, "port", "nine-thousand");
```

---

**Answer and Reason:**

This code fails to compile:

```
Argument of type 'string' is not assignable to parameter of type 'number'.
```

**Reason**: `key` is `"port"`. `T["port"]` is `number`. The parameter `value: T[K]` expects a `number`. Passing `"nine-thousand"` (a string) triggers a compile error.

---

### 6. Try it yourself
Write a generic function `pluck<T, K extends keyof T>(items: T[], key: K): T[K][]` that takes an array of objects and extracts an array of values for that key. Call it on an array of `{ title: string; price: number }` with key `"price"`.

---

### 7. More examples

#### Example A: Object Property Modifier (Easy)

```typescript
function updateProperty<T, K extends keyof T>(
  obj: T,
  key: K,
  updater: (prev: T[K]) => T[K]
): void {
  obj[key] = updater(obj[key]);
}

const counter = { count: 10 };
updateProperty(counter, "count", (c) => c + 1);
```

**Line-by-line explanation:**
- `updater: (prev: T[K]) => T[K]`: The updater function receives and returns the exact type of that property.

---

### 8. Common mistakes

#### Mistake 1: Forgetting `extends keyof T` on the second parameter

**Wrong code:**
```typescript
function readProp<T, K>(obj: T, key: K) {
  // return obj[key]; // Error: Type 'K' cannot be used to index type 'T'.
}
```

**Why it happens:**
`K` could be anything (like a boolean or an object). It cannot be used to index `T` unless constrained with `extends keyof T`.

---

### 9. Rules to remember
1. `<T, K extends keyof T>` links the key parameter directly to the object type.
2. The return type `T[K]` matches the exact type of that specific property.
3. TypeScript catches typos in property names passed to the function at compile time.

---

### 10. Exercises

#### Question 1 (Predict the compile result)
What is the inferred return type of `val`?
```typescript
function get<T, K extends keyof T>(o: T, k: K): T[K] {
  return o[k];
}
const item = { isReady: true, attempts: 3 };
const val = get(item, "isReady");
```

#### Question 2 (Find and fix the bug)
Fix the error in `setProp`:
```typescript
function setProp<T, K>(o: T, k: K, v: any) {
  o[k] = v;
}
```

#### Question 3 (Write code from scratch)
Write a generic function `hasKey<T extends object, K extends string>(obj: T, key: K): boolean` that checks if `key in obj`.

#### Question 4 (Explain in your own words)
Why does TypeScript allow `obj[key]` when `K extends keyof T`, but rejects it when `K` is unconstrained?

---

### Solutions

#### Solution to Question 1
**Hint 1**: Look at the type of `isReady` on `item`.

**Answer**:
The inferred return type is `boolean`.

#### Solution to Question 2
**Hint 1**: Constrain `K` with `extends keyof T`.

**Answer**:
```typescript
function setProp<T, K extends keyof T>(o: T, k: K, v: T[K]): void {
  o[k] = v;
}
```

#### Solution to Question 3
**Hint 1**: Return `key in obj`.

**Answer**:
```typescript
function hasKey<T extends object, K extends string>(obj: T, key: K): boolean {
  return key in obj;
}
```

#### Solution to Question 4
**Hint 1**: What values can an unconstrained `K` hold?

**Answer**:
An unconstrained `K` could be any type (like `number`, `boolean`, or an arbitrary string that does not exist on `obj`). TypeScript cannot verify that indexing `obj[key]` is safe. By constraining `K extends keyof T`, TypeScript guarantees that `K` is a known property name of `T`.

---

### 11. Recall

1. What constraint connects a type parameter `K` to the keys of `T`?
2. What lookup syntax gives the type of property `K` on `T`?
3. What error happens if you pass an unknown property name to `K extends keyof T`?

**If you remember only one thing:**
`<T, K extends keyof T>` ensures safe dynamic property access and preserves exact property value types.

---

# Topic 8: Generic Defaults (`<T = DefaultType>`)

### 1. What is it?
Just like function parameters can have default values (`function f(x = 10)`), generic type parameters can have default types (`<T = string>`).

If a caller does not provide an explicit type argument and TypeScript cannot infer one from arguments, the default type is used.

### 2. Why does it exist?
Many generic components have a common, standard use case, but still need to allow customization when necessary.

For example, an HTML element container might default to a `HTMLDivElement` 90% of the time, but occasionally need to hold an `HTMLInputElement`. Generic defaults make the common case simple to write, without removing flexibility.

### 3. Basic example

```typescript
interface ApiResponse<Data = Record<string, unknown>> {
  status: number;
  data: Data;
}

// 1. Using the default type:
const defaultResponse: ApiResponse = {
  status: 200,
  data: { message: "OK" },
};

// 2. Supplying a custom type:
type User = { id: string; name: string };
const userResponse: ApiResponse<User> = {
  status: 200,
  data: { id: "1", name: "Alex" },
};
```

**Line-by-line explanation:**
- `interface ApiResponse<Data = Record<string, unknown>>`: Declares `Data` with a default of `Record<string, unknown>`.
- `const defaultResponse: ApiResponse`: We did not provide `<Type>` brackets. TypeScript uses the default type `Record<string, unknown>`.
- `const userResponse: ApiResponse<User>`: We explicitly provided `<User>`. The custom type overrides the default.

---

### 4. How it works inside TypeScript
1. **Precedence**: If an explicit type argument is provided (`ApiResponse<User>`), it is used.
2. **Inference**: If omitted in a function call, TypeScript tries to infer `T` from runtime arguments.
3. **Fallback to Default**: If the type argument is omitted and cannot be inferred, TypeScript falls back to the default type.
4. **Ordering Rule**: Type parameters with defaults must follow required type parameters (just like optional function parameters).

---

### 5. Think first

Will this interface declaration compile? Decide first.

```typescript
interface Container<A = string, B> {
  first: A;
  second: B;
}
```

---

**Answer and Reason:**

This code fails to compile:

```
Required type parameters may not follow optional type parameters.
```

**Reason**: Just like regular function parameters, any generic type parameter with a default is considered optional and must appear **after** all required type parameters: `<B, A = string>`.

---

### 6. Try it yourself
Create a generic type `Result<T, E = Error>` that has `{ success: true; value: T } | { success: false; error: E }`. Create a variable `r: Result<string>` without specifying `E`, and assign a failed result with `error: new Error("Failed")`.

---

### 7. More examples

#### Example A: Generic Constraint with Default (Medium)

```typescript
type ElementFactory<E extends HTMLElement = HTMLDivElement> = () => E;

const makeDiv: ElementFactory = () => document.createElement("div");
const makeButton: ElementFactory<HTMLButtonElement> = () => document.createElement("button");
```

**Line-by-line explanation:**
- `E extends HTMLElement = HTMLDivElement`: `E` is constrained to `HTMLElement`, and defaults to `HTMLDivElement` if omitted.

---

### 8. Common mistakes

#### Mistake 1: Placing default type parameters before required ones

**Wrong code:**
```typescript
type Pair<First = string, Second> = [First, Second]; // Error!
```

**Correct code:**
```typescript
type Pair<Second, First = string> = [First, Second];
```

---

### 9. Rules to remember
1. Syntax for defaults: `<T = DefaultType>`.
2. Type parameters with defaults must appear after required type parameters.
3. Explicit type arguments override defaults.

---

### 10. Exercises

#### Question 1 (Predict the compile result)
What is the type of `item.val`?
```typescript
interface Box<T = number> { val: T; }
const item: Box = { val: 42 };
```

#### Question 2 (Find and fix the bug)
Fix the type parameter order in the definition below:
```typescript
type ResponseWrapper<Meta = { time: number }, Payload> = {
  meta: Meta;
  payload: Payload;
};
```

#### Question 3 (Write code from scratch)
Define a generic type `StateStore<T = Record<string, string>>` with `state: T`. Create one variable using the default, and one variable overriding `T` with `number[]`.

#### Question 4 (Explain in your own words)
Why are type parameters with defaults placed at the end of the type parameter list?

---

### Solutions

#### Solution to Question 1
**Hint 1**: Did the caller specify `<T>`? What is the default?

**Answer**:
The type is `number`.

#### Solution to Question 2
**Hint 1**: Move `Payload` before `Meta = { time: number }`.

**Answer**:
```typescript
type ResponseWrapper<Payload, Meta = { time: number }> = {
  meta: Meta;
  payload: Payload;
};
```

#### Solution to Question 3
**Hint 1**: Use `type StateStore<T = Record<string, string>> = { state: T }`.

**Answer**:
```typescript
type StateStore<T = Record<string, string>> = { state: T };

const s1: StateStore = { state: { env: "prod" } };
const s2: StateStore<number[]> = { state: [1, 2, 3] };
```

#### Solution to Question 4
**Hint 1**: How would the compiler know which argument you intended to skip?

**Answer**:
If an optional parameter appeared first, the compiler would not know whether a single supplied type argument was intended for the first parameter or the second. Placing optional parameters at the end allows the compiler to map arguments in order from left to right.

---

### 11. Recall

1. What syntax assigns a default type to `<T>`?
2. Where must type parameters with defaults be positioned?
3. Does an explicit type argument override a default type?

**If you remember only one thing:**
Generic defaults provide convenient fallback types while allowing callers to override them when needed.

---

# Topic 9: Instantiation Expressions (Specializing Generics without Calling)

### 1. What is it?
Introduced in TypeScript 4.7, an **Instantiation Expression** allows you to specialize a generic function or class with concrete type arguments *without invoking it*.

It produces a new, specialized function or constructor with specific types baked in.

### 2. Why does it exist?
Frequently, you have a generic function (like `makeMap<K, V>()` or `new Set<T>()`) and you want to pass a pre-typed version of it to another function or export it as a specialized helper (like `makeStringMap`).

Before TypeScript 4.7, you had to write a wrapper function `(args) => genericFn<string>(args)`. Instantiation expressions let you specialize the function directly: `const makeStringMap = genericFn<string>;`.

### 3. Basic example

```typescript
function wrapInBox<T>(item: T) {
  return { value: item };
}

// Pre-specialize the function for numbers:
const wrapNumber = wrapInBox<number>;

// wrapNumber now has type: (item: number) => { value: number }
const result1 = wrapNumber(100); // Allowed
// const result2 = wrapNumber("hello"); // Compile Error: Argument is not a number!
```

**Line-by-line explanation:**
- `function wrapInBox<T>(item: T)`: A generic function.
- `const wrapNumber = wrapInBox<number>;`: Specializes `wrapInBox` by binding `T` to `number`. Notice there are no parentheses `()` after `<number>`. We did NOT call the function; we created a specialized reference.
- `wrapNumber(100)`: Calling the specialized function accepts only numbers.
- `// wrapNumber("hello")`: Rejected at compile time.

---

### 4. How it works inside TypeScript
1. **Generic Specialization**: The compiler takes the generic signature `forall T. (item: T) => { value: T }`.
2. **Type Parameter Substitution**: It substitutes `number` for `T`.
3. **New Non-Generic Signature**: It produces a new function type `(item: number) => { value: number }`.
4. **Zero Runtime Code**: At runtime, `wrapNumber` simply points to the same JavaScript function `wrapInBox`. There is no performance penalty.

---

### 5. Think first

What happens when we specialize `Set` below? Decide first.

```typescript
const StringSet = Set<string>;
const set = new StringSet();
set.add(42);
```

---

**Answer and Reason:**

This code fails to compile:

```
Argument of type 'number' is not assignable to parameter of type 'string'.
```

**Reason**: `StringSet` is specialized to `Set<string>`. Calling `set.add(42)` fails because the specialized set only accepts strings.

---

### 6. Try it yourself
Write a generic function `makePair<T>(first: T, second: T): [T, T]`. Create a specialized reference `makeStringPair = makePair<string>`. Test calling it with two strings, and then with numbers to see the error.

---

### 7. More examples

#### Example A: Specializing Class Constructors (Medium)

```typescript
class Store<T> {
  items: T[] = [];
  add(item: T) {
    this.items.push(item);
  }
}

// Specialize the constructor:
const UserStore = Store<{ id: string }>;

const store = new UserStore();
store.add({ id: "usr_1" }); // Allowed
```

**Line-by-line explanation:**
- `UserStore` is pre-specialized to accept only `{ id: string }`.

---

### 8. Common mistakes

#### Mistake 1: Confusing specialization `<T>` with a function call `()`

**Wrong assumption:**
Thinking `wrapInBox<string>` runs the function.

**Reality:**
`<string>` without `(...)` only specializes the type signature. To invoke the function, you must add parentheses: `wrapInBox<string>("test")`.

---

### 9. Rules to remember
1. Instantiation expressions specialize generic functions or classes without calling them.
2. Syntax: `const specialized = genericFn<Type>;` (no parentheses).
3. Works on both functions and class constructors.
4. Introduces zero runtime overhead.

---

### 10. Exercises

#### Question 1 (Predict the compile result)
What is the type of `fn`?
```typescript
function echo<T>(x: T): T { return x; }
const fn = echo<boolean>;
```

#### Question 2 (Find and fix the bug)
The code below attempts to specialize `makeList`, but has a syntax error. Fix it:
```typescript
function makeList<T>(a: T, b: T): T[] { return [a, b]; }
const makeNumberList = makeList(number);
```

#### Question 3 (Write code from scratch)
Write a generic function `formatData<T extends { id: string }>(item: T): string`. Create an instantiation expression `formatUser` that specializes it for `{ id: string; name: string }`.

#### Question 4 (Explain in your own words)
Why is an instantiation expression cleaner than writing an arrow function wrapper like `const fn = (x: string) => original(x)`?

---

### Solutions

#### Solution to Question 1
**Hint 1**: Substitute `boolean` for `T`.

**Answer**:
The type of `fn` is `(x: boolean) => boolean`.

#### Solution to Question 2
**Hint 1**: Use angle brackets `<number>` without parentheses.

**Answer**:
```typescript
function makeList<T>(a: T, b: T): T[] { return [a, b]; }
const makeNumberList = makeList<number>;
```

#### Solution to Question 3
**Hint 1**: Write `formatData<{ id: string; name: string }>`.

**Answer**:
```typescript
function formatData<T extends { id: string }>(item: T): string {
  return "Item ID: " + item.id;
}

const formatUser = formatData<{ id: string; name: string }>;
```

#### Solution to Question 4
**Hint 1**: Think about runtime function overhead and extra call stack frames.

**Answer**:
An arrow function wrapper creates a new function in memory and adds an extra function call to the call stack at runtime. An instantiation expression has zero runtime cost; it merely assigns the existing function reference with a specialized compile-time type.

---

### 11. Recall

1. What TypeScript feature specializes a generic function without calling it?
2. Does an instantiation expression add runtime overhead?
3. What is the difference between `fn<string>` and `fn<string>()`?

**If you remember only one thing:**
Use `fn<Type>` without parentheses to specialize a generic function's types before calling it.

---

# Topic 10: Understanding Variance: Covariance (Output Positions)

### 1. What is it?
**Variance** describes how the subtyping relationship between two types (`A extends B`) affects the subtyping relationship between complex types wrapping them (`Box<A>` and `Box<B>`).

A generic type is **Covariant** if it preserves the subtyping direction:
If `A extends B`, then `Box<A> extends Box<B>`.

### 2. Why does it exist?
Consider a `Dog` that extends `Animal`.
If you have a function that returns a `Dog` (`() => Dog`), can you pass it to code that expects a function returning an `Animal` (`() => Animal`)?
Yes! Because whoever calls the function expects an `Animal`, and a `Dog` is an `Animal`.
Covariance is the rule that makes this work. Types in **output positions** (return values, readonly properties) are naturally covariant.

### 3. Basic example

```typescript
type Animal = { name: string };
type Dog = { name: string; bark: () => void };

// Dog is a subtype of Animal (Dog extends Animal)
const myDog: Dog = { name: "Rex", bark: () => console.log("Woof") };

// Functions that produce values (output position):
type Producer<T> = () => T;

let produceDog: Producer<Dog> = () => myDog;
let produceAnimal: Producer<Animal> = produceDog; // Allowed! (Covariant)

const animal = produceAnimal();
console.log(animal.name); // Safe!
```

**Line-by-line explanation:**
- `Dog extends Animal`: Every `Dog` has a `name`, so `Dog` is a subtype of `Animal`.
- `type Producer<T> = () => T;`: `T` appears only as the **output** (return type) of the function.
- `let produceAnimal: Producer<Animal> = produceDog;`: Allowed by covariance. Because `produceDog` returns a `Dog`, and every `Dog` is an `Animal`, `produceAnimal()` safely produces a valid `Animal`.

---

### 4. How it works inside TypeScript
1. **Output Position**: When a generic type parameter `T` only appears in output positions (function return types, `readonly` properties):
2. **Subtyping Preservation**: `Producer<Dog>` is assignable to `Producer<Animal>`.
3. **Readonly Collections**: `readonly Dog[]` is assignable to `readonly Animal[]` because you can only read (output) items from it.

---

### 5. Think first

Is a mutable array `Dog[]` safely assignable to `Animal[]`? What could go wrong? Decide first.

```typescript
class Animal { name = "Animal"; }
class Dog extends Animal { bark() {} }
class Cat extends Animal { meow() {} }

let dogs: Dog[] = [new Dog()];
// What if this was allowed?
let animals: Animal[] = dogs;
animals.push(new Cat());
```

---

**Answer and Reason:**

If `dogs` was treated as an `Animal[]`, you could push a `Cat` into what is actually an array of dogs! Then `dogs[1].bark()` would crash because a `Cat` cannot bark.

**Reason**: Mutable arrays are NOT purely covariant because they allow writing (input). A type that allows both reading and writing is **invariant** (covered in Topic 11).

---

### 6. Try it yourself
Create an interface `Reader<T> { read(): T; }`. Create an object of type `Reader<string>`. Assign it to a variable of type `Reader<string | number>`. Verify that TypeScript allows this because `Reader` is covariant.

---

### 7. More examples

#### Example A: Promises are Covariant (Easy)

```typescript
type User = { id: string };
type Admin = User & { role: "admin" };

declare let adminPromise: Promise<Admin>;
let userPromise: Promise<User> = adminPromise; // Allowed!
```

**Line-by-line explanation:**
- `Promise<T>` produces `T` upon resolution (output position). Therefore, `Promise<Admin>` is assignable to `Promise<User>`.

---

### 8. Common mistakes

#### Mistake 1: Assuming all generic wrappers are covariant

**Wrong assumption:**
Assuming `Container<Dog>` is always assignable to `Container<Animal>`.

**Reality:**
Only containers where `T` is strictly in output positions are covariant. If the container allows writing `T`, it is not covariant.

---

### 9. Rules to remember
1. Covariance means: If `A extends B`, then `F<A> extends F<B>`.
2. Output positions (return types, readonly properties) are covariant.
3. Readonly arrays and Promises are covariant.

---

### 10. Exercises

#### Question 1 (Predict the compile result)
Will the following code compile?
```typescript
type Getter<T> = () => T;
let getNumber: Getter<42> = () => 42;
let getAnyNumber: Getter<number> = getNumber;
```

#### Question 2 (Find and fix the bug)
Explain why line 4 fails and fix it by using a readonly array:
```typescript
type SuperType = { id: string };
type SubType = { id: string; active: boolean };
let subItems: SubType[] = [];
let superItems: readonly SuperType[] = subItems;
```

#### Question 3 (Write code from scratch)
Write an interface `ResultProducer<T>` with a single method `getValue(): T`. Show that `ResultProducer<string>` is assignable to `ResultProducer<string | null>`.

#### Question 4 (Explain in your own words)
Why are return types naturally covariant?

---

### Solutions

#### Solution to Question 1
**Hint 1**: Does `42` extend `number`? Are return types covariant?

**Answer**:
Yes, it compiles without error. Literal `42` is a subtype of `number`, and `Getter` produces values.

#### Solution to Question 2
**Hint 1**: `readonly SuperType[]` is covariant! The snippet already uses `readonly SuperType[]`, so it compiles.

**Answer**:
Line 4 compiles because `readonly` arrays only permit reading (output), making them safely covariant.

#### Solution to Question 3
**Hint 1**: Define `getValue(): T`.

**Answer**:
```typescript
interface ResultProducer<T> {
  getValue(): T;
}

let stringProducer: ResultProducer<string> = { getValue: () => "OK" };
let nullableProducer: ResultProducer<string | null> = stringProducer;
```

#### Solution to Question 4
**Hint 1**: What does the caller expect to receive from the function?

**Answer**:
The caller expects a value of type `Animal`. If the function returns a more specific subtype `Dog`, the caller receives all the properties of `Animal` they expected, plus more. The contract is fully satisfied.

---

### 11. Recall

1. What is covariance?
2. Which positions in a type definition are covariant?
3. Are `Promise` return types covariant?

**If you remember only one thing:**
Covariance preserves subtyping direction for types that produce values in output positions.

---

# Checkpoint Challenge: Topics 6 to 10

### Challenge Scenario
Build a type-safe entity property selector and serializer:

1. Create an interface `Product` with properties `id: string`, `price: number`, and `inStock: boolean`.
2. Write a generic function `pluckProp<T, K extends keyof T>(obj: T, key: K): T[K]` that returns the property value.
3. Specialize `pluckProp` using an instantiation expression to create `pluckProductProp` specifically for `Product`.
4. Define a covariant producer interface `ItemSource<T>` with `fetch(): T`.
5. Create a `ItemSource<Product>` and demonstrate that it can be assigned to `ItemSource<{ id: string }>`.

### Challenge Solution

```typescript
interface Product {
  id: string;
  price: number;
  inStock: boolean;
}

function pluckProp<T, K extends keyof T>(obj: T, key: K): T[K] {
  return obj[key];
}

// 3. Instantiation expression:
const pluckProductProp = pluckProp<Product, keyof Product>;

const laptop: Product = { id: "p1", price: 999, inStock: true };
const price = pluckProductProp(laptop, "price"); // Type: number

// 4. Covariant Producer:
interface ItemSource<T> {
  fetch(): T;
}

let productSource: ItemSource<Product> = {
  fetch: () => laptop,
};

// 5. Covariant assignment:
let baseSource: ItemSource<{ id: string }> = productSource;
console.log("Fetched item id:", baseSource.fetch().id);
```

---

# Topic 11: Understanding Variance: Contravariance (Input Positions) and Invariance

### 1. What is it?
- **Contravariance** inverts the subtyping relationship:
  If `Dog extends Animal`, then `Consumer<Animal> extends Consumer<Dog>`.
- **Invariance** means subtyping is neither preserved nor inverted:
  `Box<Dog>` and `Box<Animal>` are completely incompatible unless the types match identically.

### 2. Why does it exist?
Consider a function that handles an animal (`(a: Animal) => void`). Can you pass this function where a dog handler is expected (`(d: Dog) => void`)?
Yes! Because a function that knows how to handle *any* animal can certainly handle a dog.
Notice how the direction reversed: `Dog` is a subtype of `Animal`, but the function accepting `Animal` is a subtype of the function accepting `Dog`.
Types in **input positions** (function parameters) are naturally **contravariant**.

### 3. Basic example

```typescript
type Animal = { name: string };
type Dog = { name: string; bark: () => void };

type Consumer<T> = (item: T) => void;

let handleAnimal: Consumer<Animal> = (a) => console.log("Handling animal:", a.name);
let handleDog: Consumer<Dog> = handleAnimal; // Allowed! (Contravariant)

const myDog: Dog = { name: "Buddy", bark: () => console.log("Woof") };
handleDog(myDog); // Safe!
```

**Line-by-line explanation:**
- `Dog extends Animal`: `Dog` is more specific than `Animal`.
- `type Consumer<T> = (item: T) => void;`: `T` is in the **input** position (function parameter).
- `let handleDog: Consumer<Dog> = handleAnimal;`: Contravariance in action! `handleAnimal` only needs a `name`. Since `Dog` has a `name`, passing `Dog` into `handleAnimal` is completely safe.
- What if we tried the reverse: `handleAnimal = handleDog`? That would fail, because `handleDog` might try to call `item.bark()`, but a general `Animal` (like a cat) cannot bark!

---

### 4. How it works inside TypeScript
Summary of the three main variance behaviors:

| Variance Type | Parameter Position | Direction Rule | Example |
|---|---|---|---|
| **Covariant** | Output (Return type) | `Dog extends Animal` $\to$ `F<Dog> extends F<Animal>` | `() => T`, `Promise<T>` |
| **Contravariant** | Input (Parameter) | `Dog extends Animal` $\to$ `F<Animal> extends F<Dog>` | `(x: T) => void` |
| **Invariant** | Both Input and Output | Neither direction allowed | `{ get(): T; set(x: T): void }` |

---

### 5. Think first

Why is a read-write box `MutableBox<T>` invariant? Decide first.

```typescript
interface MutableBox<T> {
  get(): T;
  set(val: T): void;
}
```

---

**Answer and Reason:**

- If `MutableBox<Dog>` was assignable to `MutableBox<Animal>`, someone could call `set(new Cat())`, breaking the box!
- If `MutableBox<Animal>` was assignable to `MutableBox<Dog>`, calling `get()` might return a `Cat`, which is not a `Dog`!

**Reason**: Because `T` appears in BOTH input (`set`) and output (`get`) positions, neither direction is safe. The type is **invariant**.

---

### 6. Try it yourself
Create a type `Logger<T> = (msg: T) => void`. Create a `Logger<string | number>`. Assign it to a variable of type `Logger<string>`. Notice that TypeScript allows this due to contravariance.

---

### 7. More examples

#### Example A: Sorting Comparators are Contravariant (Medium)

```typescript
type Comparator<T> = (a: T, b: T) => number;

type Item = { id: string };
type PriorityItem = Item & { priority: number };

const compareById: Comparator<Item> = (a, b) => a.id.localeCompare(b.id);

// Allowed by contravariance:
const comparePriority: Comparator<PriorityItem> = compareById;
```

**Line-by-line explanation:**
- `compareById` can compare any two objects with an `id`. Therefore, it can safely compare `PriorityItem` objects.

---

### 8. Common mistakes

#### Mistake 1: Trying to assign a specific handler to a general handler

**Wrong code:**
```typescript
let dogHandler: (d: Dog) => void = (d) => d.bark();
// let animalHandler: (a: Animal) => void = dogHandler; // Error!
```

**Why it happens:**
`animalHandler` might be called with a `Cat`. Passing a `Cat` to `dogHandler` would crash because `cat.bark()` does not exist!

---

### 9. Rules to remember
1. Input positions (function parameters) are contravariant (direction reverses).
2. A function that handles general inputs can safely handle specific inputs.
3. Types with both input and output positions are invariant.

---

### 10. Exercises

#### Question 1 (Predict the compile result)
Will the following code compile?
```typescript
type Callback<T> = (arg: T) => void;
let generalCb: Callback<string | number> = (x) => console.log(x);
let stringCb: Callback<string> = generalCb;
```

#### Question 2 (Find and fix the bug)
Explain why the assignment below fails:
```typescript
type User = { id: string };
type Admin = User & { kick(): void };
let onAdmin: (a: Admin) => void = (a) => a.kick();
let onUser: (u: User) => void = onAdmin;
```

#### Question 3 (Write code from scratch)
Write an interface `Writer<T>` with a single method `write(data: T): void`. Demonstrate contravariant assignment.

#### Question 4 (Explain in your own words)
Why does the subtyping direction invert for function parameters?

---

### Solutions

#### Solution to Question 1
**Hint 1**: Can a function that handles `string | number` handle a `string`?

**Answer**:
Yes, it compiles without error. A handler for `string | number` can safely handle `string`.

#### Solution to Question 2
**Hint 1**: What happens if `onUser` is called with a regular `User` that does not have `kick()`?

**Answer**:
`onAdmin` requires `a.kick()`. A regular `User` does not have `kick()`, so assigning `onAdmin` to `onUser` would cause a runtime crash.

#### Solution to Question 3
**Hint 1**: Create a `Writer<string | number>` and assign to `Writer<string>`.

**Answer**:
```typescript
interface Writer<T> {
  write(data: T): void;
}

let broadWriter: Writer<string | number> = { write: (d) => console.log(d) };
let stringWriter: Writer<string> = broadWriter; // Allowed!
```

#### Solution to Question 4
**Hint 1**: Consider what the function promises to accept versus what the caller provides.

**Answer**:
A function that accepts general inputs requires fewer properties. A caller providing a more specific subtype provides all required properties and more. Therefore, the general function safely satisfies the specific caller's expectations.

---

### 11. Recall

1. What is contravariance?
2. Which position in a function signature is contravariant?
3. What is invariance?

**If you remember only one thing:**
Function parameters are contravariant: a handler for general types can safely handle specific types.

---

# Topic 12: Explicit Variance Annotations (`in` and `out` Modifiers)

### 1. What is it?
Introduced in TypeScript 4.7, explicit variance annotations let you declare whether a generic type parameter is intended for input (`in`) or output (`out`):
- `out T`: Declares `T` as **covariant** (output-only).
- `in T`: Declares `T` as **contravariant** (input-only).
- `in out T`: Declares `T` as **invariant** (both input and output).

### 2. Why does it exist?
By default, TypeScript calculates variance by deeply inspecting all properties and methods on an interface. For large, deeply nested codebases (like ASTs or ORMs), this recursive check slows down compile times.

Explicit variance annotations tell the compiler the variance upfront, speeding up type checking and immediately catching mistakes if you use a type parameter in the wrong position.

### 3. Basic example

```typescript
// 1. Explicit Covariance (Producer):
interface Producer<out T> {
  produce(): T;
}

// 2. Explicit Contravariance (Consumer):
interface Consumer<in T> {
  consume(item: T): void;
}

// 3. Explicit Invariance (Both):
interface Container<in out T> {
  get(): T;
  set(val: T): void;
}
```

**Line-by-line explanation:**
- `interface Producer<out T>`: Declares `T` with the `out` modifier. `T` must only be produced (output).
- `interface Consumer<in T>`: Declares `T` with the `in` modifier. `T` must only be consumed (input).
- `interface Container<in out T>`: Declares `T` as invariant.

---

### 4. How it works inside TypeScript
1. **Compile-Time Verification**: If you annotate `out T`, but accidentally use `T` in a function parameter (input position), TypeScript produces an error:
   ```
   Type parameter 'T' is declared as 'out', but occurs in an 'in'-position.
   ```
2. **Performance Optimization**: When comparing two generic types (`Producer<A>` and `Producer<B>`), the compiler checks `A extends B` immediately without recursively walking every property on the interface.

---

### 5. Think first

What happens when you compile this interface? Decide first.

```typescript
interface Store<out T> {
  addItem(item: T): void;
}
```

---

**Answer and Reason:**

This code fails to compile:

```
Type parameter 'T' is declared as 'out', but occurs in an 'in'-position in type '(item: T) => void'.
```

**Reason**: `out` declares that `T` is strictly an output. Using `item: T` as a parameter is an input position. TypeScript catches the conflict immediately.

---

### 6. Try it yourself
Create an interface `Reader<out T>` with method `get(): T`. Verify that it compiles. Then try adding `set(val: T): void` to see the compiler error caught by `out`.

---

### 7. More examples

#### Example A: Event Listener Interface (Medium)

```typescript
interface EventListener<in EventData> {
  handleEvent(data: EventData): void;
}
```

**Line-by-line explanation:**
- `in EventData` explicitly documents that events only flow *into* the listener.

---

### 8. Common mistakes

#### Mistake 1: Using `out` on a mutable property

**Wrong code:**
```typescript
interface Box<out T> {
  content: T; // Mutable properties allow both read (out) and write (in)!
}
```

**Correct code:**
Mark the property `readonly`:
```typescript
interface Box<out T> {
  readonly content: T;
}
```

---

### 9. Rules to remember
1. `out T` marks covariance (output only, return types, readonly properties).
2. `in T` marks contravariance (input only, function parameters).
3. `in out T` marks invariance (both input and output).
4. The compiler verifies that your annotations match how `T` is actually used.

---

### 10. Exercises

#### Question 1 (Predict the compile result)
Will the following code compile?
```typescript
interface Transformer<in Input, out Output> {
  transform(data: Input): Output;
}
```

#### Question 2 (Find and fix the bug)
Fix the variance annotation error below:
```typescript
interface Serializer<out T> {
  serialize(item: T): string;
}
```

#### Question 3 (Write code from scratch)
Write an interface `ReadableStream<out Chunk>` with a method `readNext(): Chunk | null`.

#### Question 4 (Explain in your own words)
Why do `in` and `out` annotations improve TypeScript compiler performance?

---

### Solutions

#### Solution to Question 1
**Hint 1**: Is `Input` in an input position? Is `Output` in an output position?

**Answer**:
Yes, it compiles without error. `Input` is in an input parameter position, and `Output` is in an output return position.

#### Solution to Question 2
**Hint 1**: `item: T` is an input position. Change `out` to `in`.

**Answer**:
```typescript
interface Serializer<in T> {
  serialize(item: T): string;
}
```

#### Solution to Question 3
**Hint 1**: Use `out Chunk`.

**Answer**:
```typescript
interface ReadableStream<out Chunk> {
  readNext(): Chunk | null;
}
```

#### Solution to Question 4
**Hint 1**: Think about how the compiler checks type assignability.

**Answer**:
Without annotations, the compiler must recursively inspect every property and method to calculate variance. With `in` and `out`, the compiler knows the variance immediately and skips the deep structural traversal.

---

### 11. Recall

1. What modifier declares a covariant type parameter?
2. What modifier declares a contravariant type parameter?
3. What modifier declares an invariant type parameter?

**If you remember only one thing:**
Use `in` for inputs and `out` for outputs to document variance and speed up compiler checks.

---

# Topic 13: TypeScript 5.0 `<const T>` Type Parameters

### 1. What is it?
Introduced in TypeScript 5.0, a `const` type parameter (`<const T>`) instructs the compiler to infer the most specific, literal type possible when calling a generic function, without requiring the caller to manually write `as const`.

### 2. Why does it exist?
Before TypeScript 5.0, generic functions always widened literal values unless the caller added `as const`:
```typescript
function defineRoutes<T>(routes: T) { return routes; }
const r1 = defineRoutes(["/home", "/about"]); // Inferred as: string[]!
const r2 = defineRoutes(["/home", "/about"] as const); // Inferred as: readonly ["/home", "/about"]
```
Forcing callers to append `as const` at every call site is error-prone. In TypeScript 5.0, library authors can add `const` to the type parameter, making literal inference automatic.

### 3. Basic example

```typescript
// TypeScript 5.0 const type parameter:
function createConfig<const T>(config: T): T {
  return config;
}

const config = createConfig({
  endpoint: "/api/v1",
  retries: 3,
});

// Inferred as:
// { readonly endpoint: "/api/v1"; readonly retries: 3 }
// NOT widened to { endpoint: string; retries: number }!
```

**Line-by-line explanation:**
- `function createConfig<const T>(config: T): T`: The `const` modifier on `<const T>` tells TypeScript to treat incoming literals as immutable const values.
- `const config = createConfig({ ... });`: The caller writes a plain object literal.
- The property types are preserved as literal `"/api/v1"` and `3`, and marked `readonly`.

---

### 4. How it works inside TypeScript
1. **Automatic Literal Retention**: String, number, and boolean literals are inferred as exact literals instead of widened primitives.
2. **Readonly Tuples**: Array literals are inferred as `readonly` fixed tuples instead of mutable arrays (`readonly ["a", "b"]` instead of `string[]`).
3. **Zero Call-Site Syntax**: The caller does not need to write `as const`.

---

### 5. Think first

What is the inferred return type of `routes` below? Decide first.

```typescript
function registerRoutes<const T extends readonly string[]>(routes: T): T {
  return routes;
}

const routes = registerRoutes(["/users", "/posts"]);
```

---

**Answer and Reason:**

The inferred type of `routes` is:

```typescript
readonly ["/users", "/posts"]
```

**Reason**: Because `T` is declared with `const`, the array literal is inferred as a readonly tuple of exact string literals rather than `string[]`.

---

### 6. Try it yourself
Write a function `makeColors<const T extends readonly string[]>(colors: T): T`. Call it with `["red", "green"]`. Verify that the result type is `readonly ["red", "green"]`.

---

### 7. More examples

#### Example A: Object Literal Freezing (Medium)

```typescript
function setSettings<const T extends Record<string, unknown>>(settings: T): T {
  return settings;
}

const s = setSettings({ theme: "dark", level: 1 });
// s.theme is "dark", not string!
```

---

### 8. Common mistakes

#### Mistake 1: Trying to modify arrays returned from a `const T` function

**Wrong code:**
```typescript
function getList<const T extends readonly unknown[]>(items: T): T {
  return items;
}
const list = getList([1, 2]);
// list.push(3); // Error: Property 'push' does not exist on type 'readonly [1, 2]'.
```

**Why it happens:**
`const T` infers `readonly` tuples, which do not have mutating methods like `push`.

---

### 9. Rules to remember
1. `<const T>` infers exact literal types and readonly structures automatically.
2. Callers do not need to write `as const` at call sites.
3. Arrays are inferred as `readonly` tuples.

---

### 10. Exercises

#### Question 1 (Predict the compile result)
What is the inferred type of `item`?
```typescript
function wrap<const T>(x: T): T { return x; }
const item = wrap("production");
```

#### Question 2 (Find and fix the bug)
The function below widens `options` to `string[]`. Add TypeScript 5.0 syntax to preserve literal tuple types:
```typescript
function chooseOption<T extends readonly string[]>(opts: T): T {
  return opts;
}
```

#### Question 3 (Write code from scratch)
Write a function `defineEndpoints<const T extends Record<string, string>>(endpoints: T): T`. Call it with `{ login: "/auth/login", logout: "/auth/logout" }`.

#### Question 4 (Explain in your own words)
Why is `<const T>` useful for library authors building configuration functions?

---

### Solutions

#### Solution to Question 1
**Hint 1**: Does `const T` widen to `string`?

**Answer**:
The type is literal `"production"`.

#### Solution to Question 2
**Hint 1**: Add `const` before `T`.

**Answer**:
```typescript
function chooseOption<const T extends readonly string[]>(opts: T): T {
  return opts;
}
```

#### Solution to Question 3
**Hint 1**: Write `function defineEndpoints<const T...`.

**Answer**:
```typescript
function defineEndpoints<const T extends Record<string, string>>(endpoints: T): T {
  return endpoints;
}

const endpoints = defineEndpoints({
  login: "/auth/login",
  logout: "/auth/logout",
});
```

#### Solution to Question 4
**Hint 1**: Think about requiring users of your library to type `as const` everywhere.

**Answer**:
It eliminates boilerplate for library users. Instead of forcing users to remember to append `as const` to their configuration objects, the library function automatically infers exact, readonly literal types.

---

### 11. Recall

1. What modifier enables automatic literal inference on generic parameters?
2. What version of TypeScript introduced `const` type parameters?
3. What type do array arguments become under `<const T>`?

**If you remember only one thing:**
`<const T>` automatically infers exact literals and readonly tuples without requiring `as const` at call sites.

---

# Topic 14: TypeScript 5.4 `NoInfer<T>` Intrinsic Utility

### 1. What is it?
Introduced in TypeScript 5.4, `NoInfer<T>` is a built-in utility type that tells the compiler:
"Do not use this parameter to infer the generic type `T`".

### 2. Why does it exist?
When a generic function has multiple parameters that use the same type parameter `T`, TypeScript examines *all* arguments to figure out what `T` is.

For example, in a function `selectColor(colors: T[], defaultColor: T)`, if you pass `colors = ["red", "blue"]` and `defaultColor = "green"`, TypeScript widens `T` to `"red" | "blue" | "green"`. The error is silently missed!
By wrapping `defaultColor: NoInfer<T>`, you force TypeScript to infer `T` *only* from the first argument, and then validate `defaultColor` against that inference.

### 3. Basic example

```typescript
// Without NoInfer (TypeScript widens T):
function chooseBad<T extends string>(options: T[], defaultOption: T) {
  return { options, defaultOption };
}
// Silently compiles because "yellow" widens T to ("red" | "blue" | "yellow")!
chooseBad(["red", "blue"], "yellow");

// With TypeScript 5.4 NoInfer<T>:
function chooseGood<T extends string>(options: T[], defaultOption: NoInfer<T>) {
  return { options, defaultOption };
}

chooseGood(["red", "blue"], "red"); // Valid!
// chooseGood(["red", "blue"], "yellow");
// Compile Error: Argument of type '"yellow"' is not assignable to '"red" | "blue"'.
```

**Line-by-line explanation:**
- `chooseGood<T extends string>(options: T[], defaultOption: NoInfer<T>)`: Tells TypeScript to infer `T` from `options` only.
- `defaultOption: NoInfer<T>`: Does not participate in inferring `T`. Instead, it checks that `defaultOption` matches whatever `T` was inferred to be.
- In the error call, `T` was inferred as `"red" | "blue"`. Passing `"yellow"` triggers an immediate compile error.

---

### 4. How it works inside TypeScript
1. **Candidate Exclusion**: The compiler excludes any parameter wrapped in `NoInfer<T>` from the list of inference candidates for `T`.
2. **Inference Finalization**: Once all non-`NoInfer` parameters have been evaluated, `T` is locked.
3. **Validation**: The parameters wrapped in `NoInfer<T>` are validated against the locked type `T`.

---

### 5. Think first

What happens when we call `createFilter` below? Decide first.

```typescript
function createFilter<T>(allowed: T[], initial: NoInfer<T>) {
  return { allowed, initial };
}

createFilter([1, 2, 3], 99);
```

---

**Answer and Reason:**

This code fails to compile:

```
Argument of type '99' is not assignable to parameter of type 'number'.
  (Or more specifically: 99 is not in the allowed list).
```

**Reason**: `T` is inferred strictly from `[1, 2, 3]` (the first argument). `initial` cannot contribute to `T`, and must match the inferred type.

---

### 6. Try it yourself
Write a function `validateState<T extends string>(states: T[], current: NoInfer<T>): boolean`. Call it with `states = ["idle", "loading"]` and `current = "idle"`. Verify that passing `"error"` fails compilation.

---

### 7. More examples

#### Example A: Default Theme Selector (Medium)

```typescript
type Theme = "light" | "dark" | "system";

function setupTheme<T extends Theme>(available: readonly T[], fallback: NoInfer<T>) {
  return { available, fallback };
}

setupTheme(["light", "dark"], "light"); // Valid
// setupTheme(["light", "dark"], "system"); // Error! "system" is not in ["light", "dark"]
```

---

### 8. Common mistakes

#### Mistake 1: Wrapping all parameters in `NoInfer`

**Wrong code:**
```typescript
function run<T>(a: NoInfer<T>, b: NoInfer<T>) {}
// If all parameters are NoInfer, TypeScript has nowhere to infer T from, falling back to unknown!
```

**Why it happens:**
At least one parameter must remain un-wrapped so TypeScript can infer `T`.

---

### 9. Rules to remember
1. `NoInfer<T>` blocks a parameter from contributing to generic type inference.
2. Use it on fallback, default, or secondary arguments.
3. At least one argument must remain without `NoInfer` to allow inference.
4. Introduced natively in TypeScript 5.4.

---

### 10. Exercises

#### Question 1 (Predict the compile result)
Will the following code compile?
```typescript
function pickItem<T>(items: T[], fallback: NoInfer<T>): T {
  return fallback;
}
pickItem(["yes", "no"], "maybe");
```

#### Question 2 (Find and fix the bug)
The function below widens `Role` accidentally. Use `NoInfer` so that `defaultRole` must be one of the `roles`:
```typescript
function configureRoles<Role extends string>(roles: Role[], defaultRole: Role) {}
```

#### Question 3 (Write code from scratch)
Write a generic function `makeDropdown<Option extends string>(options: Option[], selected: NoInfer<Option>): void`. Call it with valid and invalid options.

#### Question 4 (Explain in your own words)
Why does TypeScript widen types when multiple parameters share the same generic parameter `T`?

---

### Solutions

#### Solution to Question 1
**Hint 1**: Does `"maybe"` exist in `["yes", "no"]`?

**Answer**:
No, it fails to compile. `T` is inferred as `"yes" | "no"`, and `"maybe"` cannot be assigned to `NoInfer<T>`.

#### Solution to Question 2
**Hint 1**: Wrap `defaultRole: NoInfer<Role>`.

**Answer**:
```typescript
function configureRoles<Role extends string>(
  roles: Role[],
  defaultRole: NoInfer<Role>
) {}
```

#### Solution to Question 3
**Hint 1**: Use `selected: NoInfer<Option>`.

**Answer**:
```typescript
function makeDropdown<Option extends string>(
  options: Option[],
  selected: NoInfer<Option>
): void {}

makeDropdown(["home", "profile"], "home"); // Valid
// makeDropdown(["home", "profile"], "settings"); // Error!
```

#### Solution to Question 4
**Hint 1**: How does TypeScript reconcile conflicting argument types for `T`?

**Answer**:
When multiple arguments share `T`, TypeScript attempts to find a common supertype that satisfies all passed arguments. If argument 1 is `"red"` and argument 2 is `"blue"`, TypeScript unions them into `"red" | "blue"`, allowing unintended values unless `NoInfer` is used.

---

### 11. Recall

1. What built-in utility prevents a parameter from participating in generic inference?
2. Which TypeScript version introduced `NoInfer<T>`?
3. Where should `NoInfer<T>` typically be applied?

**If you remember only one thing:**
Use `NoInfer<T>` on secondary or default arguments to stop TypeScript from accidentally widening your generic types.

---

# Final Checkpoint Challenge: Topics 11 to 14

### Challenge Scenario
Build a type-safe form field configuration system using modern TypeScript variance and inference features:

1. Create a consumer interface `Validator<in Value>` with a method `validate(val: Value): boolean`.
2. Demonstrate that a `Validator<string | number>` can be assigned to a `Validator<string>` due to contravariance.
3. Write a generic function `defineField`:
   - It takes `<const FieldName extends string, Option extends string>`.
   - Parameter 1: `name: FieldName`.
   - Parameter 2: `options: readonly Option[]`.
   - Parameter 3: `defaultOption: NoInfer<Option>`.
4. Call `defineField` with:
   - `name`: `"country"`
   - `options`: `["US", "CA", "MX"]`
   - `defaultOption`: `"US"`
5. Test that passing `"UK"` as `defaultOption` triggers a compile error.

### Challenge Solution

```typescript
// 1. Contravariant Validator:
interface Validator<in Value> {
  validate(val: Value): boolean;
}

// 2. Contravariant assignment:
const generalValidator: Validator<string | number> = {
  validate: (val) => String(val).length > 0,
};
const stringValidator: Validator<string> = generalValidator; // Allowed!

// 3. defineField with const type parameters and NoInfer:
function defineField<const FieldName extends string, Option extends string>(
  name: FieldName,
  options: readonly Option[],
  defaultOption: NoInfer<Option>
) {
  return {
    name,
    options,
    defaultOption,
  };
}

// 4. Valid invocation:
const field = defineField("country", ["US", "CA", "MX"], "US");
console.log("Configured field:", field.name, "with default:", field.defaultOption);

// 5. Invalid invocation (triggers compile error):
// defineField("country", ["US", "CA", "MX"], "UK");
// Error: Argument of type '"UK"' is not assignable to '"US" | "CA" | "MX"'.
```
