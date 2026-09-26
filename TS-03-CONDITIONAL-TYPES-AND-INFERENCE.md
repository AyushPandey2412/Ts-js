# Module TS-03: Conditional Types, Inference (`infer`) & Recursion

> **Guiding Invariant**: Complete mastery requires zero gaps. In this module, we dissect TypeScript's type-level computing engine: Distributive Conditional Types, distribution suppression, pattern matching with `infer`, Covariant vs Contravariant inference positions (`UnionToIntersection`), Recursive Conditional Types, and Tail-Call Recursion Optimization (TCO) in the TypeScript compiler.

---

## 🏛️ Section 01: The Genesis of Conditional Types: Turing-Completeness in Type Space

Before TypeScript 2.8, types could be composed using unions (`|`), intersections (`&`), and mapped types, but they lacked **branching logic**. Developers could not ask questions like:
- "If type $T$ is a Promise, extract its resolved value; otherwise, leave it unchanged."
- "If type $T$ is an array, what is its element type?"
- "Filter out all `null` and `undefined` types from a union."

Anders Hejlsberg introduced **Conditional Types** in TypeScript 2.8, modeled after the JavaScript ternary operator:
```typescript
type Conditional<T, U, X, Y> = T extends U ? X : Y;
```
This single language feature elevated TypeScript's type system from a static constraint checker into a **Turing-complete, functional programming language** executed entirely at compile time.

```
                  [ Type Expression: T extends U ? X : Y ]
                                     |
                       Is Set(T) ⊆ Set(U)?
                                    / \
                              YES  /   \  NO
                                  /     \
                         [ Resolve X ]   [ Resolve Y ]
```

---

## 📐 Section 02: Formal Semantics of `T extends U ? X : Y`

1. **Non-Deferred Evaluation**: If $T$ and $U$ are concrete types (e.g. `string extends string`), the compiler evaluates the conditional immediately:
   ```typescript
   type A = string extends string ? true : false; // true
   type B = number extends string ? true : false; // false
   ```
2. **Deferred Evaluation**: If $T$ or $U$ contains an uninstantiated generic type parameter, the compiler defers evaluation until the generic parameter is bound at a call-site.

---

## ⚡ Section 03: Distributive Conditional Types & Naked Type Parameters

### 3.1 What is a "Naked" Type Parameter?
A type parameter $T$ is considered **naked** if it appears alone on the left side of the `extends` keyword without being wrapped in another type constructor (such as a tuple `[T]`, array `T[]`, or promise `Promise<T>`).

### 3.2 The Distribution Law over Unions
When a naked type parameter is instantiated with a union type $A \mid B \mid C$, the conditional type automatically **distributes** over each member of the union:
$$(A \mid B \mid C) \text{ extends } U \; ? \; X \; : \; Y \iff (A \text{ extends } U ? X : Y) \mid (B \text{ extends } U ? X : Y) \mid (C \text{ extends } U ? X : Y)$$

```typescript
type ToArray<T> = T extends unknown ? T[] : never;

// Instantiating with string | number:
type Distributed = ToArray<string | number>;
// Step 1: (string extends unknown ? string[] : never) | (number extends unknown ? number[] : never)
// Step 2: string[] | number[] (NOT (string | number)[]!)
```

### 3.3 Algebraic Union Filtering: `Exclude`, `Extract`, and `NonNullable`
The standard TypeScript library implements core utility types using distributive conditional types:

```typescript
// 1. Exclude: If T is in U, eliminate it by returning never (empty set)
type MyExclude<T, U> = T extends U ? never : T;

// Distribution trace:
type CleanRoles = MyExclude<"admin" | "editor" | "guest", "guest">;
// ("admin" extends "guest" ? never : "admin") |
// ("editor" extends "guest" ? never : "editor") |
// ("guest" extends "guest" ? never : "guest")
// => "admin" | "editor" | never
// => "admin" | "editor" (never vanishes from unions!)

// 2. Extract: Keep only members present in U
type MyExtract<T, U> = T extends U ? T : never;

// 3. NonNullable: Filter out null and undefined
type MyNonNullable<T> = T extends null | undefined ? never : T;
```

### 3.4 Distribution Suppression with Square Brackets `[T]`
To test whether an entire union as a whole satisfies a condition without splitting it into individual variants, wrap both sides in square brackets:

```typescript
// Distributed: tests each member individually
type IsStringDist<T> = T extends string ? true : false;
type R1 = IsStringDist<string | number>; // true | false => boolean

// Non-Distributed: tests the entire union as a single set
type IsStringStrict<T> = [T] extends [string] ? true : false;
type R2 = IsStringStrict<string | number>; // false! (The union is not a subset of string)
```

---

## 🕳️ Section 04: The `never` Distribution Trap

A notorious edge case in TypeScript is testing whether a type is `never`:

```typescript
type IsNeverBuggy<T> = T extends never ? true : false;

// What does this evaluate to?
type Test = IsNeverBuggy<never>; // Evaluates to: never! (NOT true!)
```

### Why does this happen?
Because `never` represents the **empty set** $\emptyset$. When a distributive conditional type encounters a union, it distributes across all members of the union.
Since `never` has **0 members**, the conditional distributes zero times! The entire expression evaluates to `never`.

### The Solution: Distribution Suppression
Wrapping $T$ in a 1-tuple `[T]` turns $T$ into a single-element set, suppressing distribution:

```typescript
type IsNever<T> = [T] extends [never] ? true : false;

type SafeTest1 = IsNever<never>;  // true!
type SafeTest2 = IsNever<string>; // false!
```

---

## 🔍 Section 05: The `infer` Keyword Formalism

The `infer` keyword allows developers to introduce a new type variable inside the `extends` clause of a conditional type to **extract** or **pattern match** a sub-type.

### 5.1 Extracting Return Types and Arguments
```typescript
// Extract return type:
type ReturnTypeOf<T> = T extends (...args: any[]) => infer R ? R : never;

function calculateScore(): number { return 100; }
type Score = ReturnTypeOf<typeof calculateScore>; // number

// Extract first parameter:
type FirstParam<T> = T extends (first: infer P, ...rest: any[]) => any ? P : never;

function login(email: string, pass: string): boolean { return true; }
type UserEmail = FirstParam<typeof login>; // string
```

### 5.2 Extracting Nested Types from Promises and Arrays
```typescript
// Unwrapping Promise:
type UnwrapPromise<T> = T extends Promise<infer U> ? U : T;
type P = UnwrapPromise<Promise<{ data: string }>>; // { data: string }

// Unwrapping Array element:
type ArrayElement<T> = T extends (infer E)[] ? E : T;
type E = ArrayElement<string[]>; // string
```


---

## 🌪️ Section 06: `infer` in Covariant vs Contravariant Positions & The `UnionToIntersection` Proof

When the same type variable `infer R` appears in multiple candidates:
1. **Multiple Covariant Positions**: TypeScript infers a **Union** of candidate types:
   ```typescript
   type CovariantUnion<T> = T extends { a: infer R; b: infer R } ? R : never;
   type ResUnion = CovariantUnion<{ a: string; b: number }>; // string | number
   ```
2. **Multiple Contravariant Positions**: TypeScript infers an **Intersection** of candidate types:
   ```typescript
   type ContravariantIntersect<T> = T extends {
     a: (x: infer R) => void;
     b: (x: infer R) => void;
   } ? R : never;
   type ResIntersect = ContravariantIntersect<{
     a: (x: { name: string }) => void;
     b: (x: { age: number }) => void;
   }>; // { name: string } & { age: number }
   ```

### 6.1 The Famous `UnionToIntersection<U>` Theorem
How do you transform a union of types (`A | B`) into an intersection (`A & B`) at compile time?

```typescript
export type UnionToIntersection<U> = 
  (U extends unknown ? (k: U) => void : never) extends 
  (k: infer I) => void 
    ? I 
    : never;

type InputUnion = { id: string } | { count: number };
type OutputIntersection = UnionToIntersection<InputUnion>;
// Inferred Type: { id: string } & { count: number }
```

#### Step-by-Step Proof of Mechanics:
1. `(U extends unknown ? (k: U) => void : never)`:
   Because $U$ is naked, it **distributes** over the union:
   $$\{ id: string \} \mid \{ count: number \}$$
   Becomes a union of functions accepting each variant:
   $$((k: \{ id: string \}) \to \text{void}) \mid ((k: \{ count: number \}) \to \text{void})$$
2. `... extends (k: infer I) => void ? I : never`:
   The compiler attempts to match the union of functions against a single function `(k: infer I) => void`.
3. Because parameter positions are **contravariant**, to accept *both* functions in the union, parameter $I$ must be assignable to both candidates simultaneously.
4. The greatest lower bound that satisfies both is the **Set Intersection**:
   $$I = \{ id: string \} \cap \{ count: number \}$$

---

## 🗂️ Section 07: Tuple & Array Manipulation with `infer`

Using rest elements (`...infer Rest`) in tuple pattern matching unlocks complete functional list manipulation at compile time:

```typescript
// 1. Head: Extract first element
type Head<T extends readonly unknown[]> = 
  T extends readonly [infer First, ...unknown[]] ? First : never;

// 2. Tail: Extract all elements except the first
type Tail<T extends readonly unknown[]> = 
  T extends readonly [unknown, ...infer Rest] ? Rest : [];

// 3. Last: Extract final element
type Last<T extends readonly unknown[]> = 
  T extends readonly [...unknown[], infer Final] ? Final : never;

// 4. Prepend & Append:
type Prepend<T extends readonly unknown[], E> = [E, ...T];
type Append<T extends readonly unknown[], E> = [...T, E];

// Demonstrations:
type H = Head<["apple", "banana", "cherry"]>; // "apple"
type T = Tail<["apple", "banana", "cherry"]>; // ["banana", "cherry"]
type L = Last<["apple", "banana", "cherry"]>; // "cherry"
```

---

## 🔄 Section 08: Recursive Conditional Types & Tail-Call Recursion Optimization (TCO)

### 8.1 The Recursion Depth Problem
Prior to TypeScript 4.5, recursive conditional types were evaluated on a naive stack. Any recursion deeper than ~50 iterations resulted in a fatal compiler error:
`Type instantiation is excessively deep and possibly infinite`.

### 8.2 TypeScript 4.5+ Tail-Call Recursion Optimization
In TypeScript 4.5, the compiler introduced **Tail-Call Elimination** for conditional types:
- If a conditional type returns an immediate recursive call in its true or false branch without wrapping the recursive call in another type constructor, the compiler evaluates it iteratively.
- TCO increases the allowable recursion depth from **50 to 1,000 steps**!

### 8.3 The Accumulator Pattern in Type Space
To make recursive types tail-call optimizable, pass an intermediate accumulator tuple `Acc`:

```typescript
// Non-TCO (Stack-depth limited to ~50):
// type ReverseBad<T extends any[]> = T extends [infer Head, ...infer Tail] ? [...ReverseBad<Tail>, Head] : [];

// TCO Optimizable (Accumulator Pattern, up to 1,000 depth!):
type Reverse<T extends readonly unknown[], Acc extends readonly unknown[] = []> =
  T extends readonly [infer Head, ...infer Tail]
    ? Reverse<Tail, [Head, ...Acc]>
    : Acc;

type Reversed = Reverse<[1, 2, 3, 4, 5]>; // [5, 4, 3, 2, 1]
```

---

## 🔤 Section 09: Type-Level Recursive String Parsers

By combining template literal pattern matching with `infer`, conditional types can parse strings at compile time:

```typescript
// Split a string by a delimiter into a tuple of substrings:
type Split<S extends string, Delimiter extends string> =
  S extends `${infer Head}${Delimiter}${infer Tail}`
    ? [Head, ...Split<Tail, Delimiter>]
    : [S];

type PathParts = Split<"users/profile/settings", "/">;
// Inferred as: ["users", "profile", "settings"]

// Trim whitespace from string:
type Whitespace = " " | "\t" | "\n" | "\r";
type TrimLeft<S extends string> = S extends `${Whitespace}${infer Rest}` ? TrimLeft<Rest> : S;
type TrimRight<S extends string> = S extends `${infer Rest}${Whitespace}` ? TrimRight<Rest> : S;
type Trim<S extends string> = TrimRight<TrimLeft<S>>;

type Cleaned = Trim<"   hello world \n">; // "hello world"
```

---

## 🧩 Section 10: Syntax Deconstruction Boxes

### Syntax Box 1: `infer` Constraint Suffix (`infer T extends U`)
TypeScript 4.7 added the ability to constrain inferred types directly:
```typescript
type ParseIntString<S extends string> = 
  S extends `${infer N extends number}` ? N : never;

type Parsed = ParseIntString<"42">; // Inferred as literal number 42, NOT string "42"!
```

### Syntax Box 2: `[T] extends [never]`
Always use bracket notation when checking for `never`:
```typescript
type CheckNever<T> = [T] extends [never] ? true : false;
```
`;
};


---

## 💼 Section 11: Comprehensive Senior Engineering Interview Q&As (Part A: Questions 1–45)

### Q1: What makes a type parameter "naked" in a conditional type, and why does nakedness trigger union distribution?
**Answer:**
A type parameter $T$ is **naked** when it appears directly by itself on the left side of the `extends` keyword without being wrapped in another type constructor (such as a tuple `[T]`, array `T[]`, or generic `Box<T>`).
Naked type parameters distribute because the ECMAScript type design committee intended conditional types to act as a map operation over unions ($F(A \mid B) = F(A) \mid F(B)$), making utilities like `Exclude` and `Extract` naturally expressive.

```typescript
type Naked<T> = T extends string ? "str" : "other";
type Wrapped<T> = [T] extends [string] ? "str" : "other";

type R1 = Naked<string | number>;   // "str" | "other" (Distributed)
type R2 = Wrapped<string | number>; // "other" (Non-distributed: the union is not a subset of string)
```

---

### Q2: Why does `never extends never ? true : false` evaluate to `never` when passed through a generic type parameter?
**Answer:**
Because `never` is the empty union (a union with zero members).
When passed to a generic type `type Check<T> = T extends never ? true : false;`, the compiler distributes over the union's members. Since there are zero members, zero evaluations occur, returning `never`.
To fix this, wrap both sides in square brackets:
`type IsNever<T> = [T] extends [never] ? true : false;`

---

### Q3: How does the `infer` keyword work in TypeScript conditional types?
**Answer:**
The `infer` keyword introduces a temporary type variable within the `extends` clause of a conditional type. During type checking, the compiler matches the actual type against the expected pattern and binds the matching sub-type to the inferred variable, making it available in the true branch.

```typescript
type UnpackPromise<T> = T extends Promise<infer Value> ? Value : T;

type Data = UnpackPromise<Promise<string>>; // string
type NonPromise = UnpackPromise<number>;    // number
```

---

### Q4: Why can `infer` only be used inside the `extends` clause of a conditional type?
**Answer:**
Because `infer` performs pattern matching against an instantiated type. It requires a condition to evaluate against; outside of an `extends` pattern-matching context, there is no type pattern from which to deduce or extract the variable.

---

### Q5: What happens when the same `infer` variable appears in multiple covariant positions?
**Answer:**
When `infer R` appears in multiple covariant (output/return) positions within a pattern, TypeScript computes the **union** of all candidates:

```typescript
type CovariantPair<T> = T extends { first: infer R; second: infer R } ? R : never;

type Res = CovariantPair<{ first: string; second: number }>; // string | number
```

---

### Q6: What happens when the same `infer` variable appears in multiple contravariant positions?
**Answer:**
When `infer R` appears in multiple contravariant (input/parameter) positions, TypeScript computes the **intersection** of all candidates:

```typescript
type ContravariantPair<T> = T extends {
  a: (arg: infer R) => void;
  b: (arg: infer R) => void;
} ? R : never;

type Res = ContravariantPair<{
  a: (arg: { id: string }) => void;
  b: (arg: { age: number }) => void;
}>; // { id: string } & { age: number }
```

---

### Q7: Explain the theoretical proof and mechanics of the `UnionToIntersection<U>` type.
**Answer:**
```typescript
type UnionToIntersection<U> = 
  (U extends unknown ? (k: U) => void : never) extends 
  (k: infer I) => void ? I : never;
```
1. `U extends unknown ? (k: U) => void : never`:
   Because $U$ is naked, it distributes over the union, turning `A | B` into a union of functions: `((k: A) => void) | ((k: B) => void)`.
2. `... extends (k: infer I) => void ? I : never`:
   Matching this union of functions against a single function with parameter `infer I` forces inference in a **contravariant** position.
3. In contravariant position, to safely satisfy both functions in the union, $I$ must satisfy both parameter requirements simultaneously, resulting in the intersection `A & B`.

---

### Q8: How is the standard `Exclude<T, U>` utility implemented?
**Answer:**
```typescript
type CustomExclude<T, U> = T extends U ? never : T;

type Remaining = CustomExclude<"a" | "b" | "c", "a">; // "b" | "c"
```
It distributes across union $T$. If a member is a subtype of $U$, it returns `never`, which vanishes from the resulting union.

---

### Q9: How is the standard `Extract<T, U>` utility implemented?
**Answer:**
```typescript
type CustomExtract<T, U> = T extends U ? T : never;

type Common = CustomExtract<string | number | boolean, number | boolean>; // number | boolean
```

---

### Q10: How is the standard `NonNullable<T>` utility implemented?
**Answer:**
```typescript
type CustomNonNullable<T> = T extends null | undefined ? never : T;

type Clean = CustomNonNullable<string | null | undefined>; // string
```

---

### Q11: What is Tail-Call Recursion Optimization in TypeScript 4.5+ and why was it introduced?
**Answer:**
Before TS 4.5, recursive conditional types tracked stack frames for each recursive invocation, blowing the call stack and hitting the 50-depth recursion limit on common operations like string splitting or array manipulation.
TypeScript 4.5 introduced tail-call elimination in the compiler: when a conditional type's true or false branch directly returns the recursive invocation without wrapping it in an external type constructor, the compiler evaluates it iteratively up to **1,000 steps**.

---

### Q12: How do you rewrite a recursive type to leverage Tail-Call Optimization using the Accumulator pattern?
**Answer:**
Pass an intermediate tuple or accumulator `Acc` that gathers intermediate results:

```typescript
// Non-TCO (Stack depth limit ~50):
type RepeatBad<T, N extends number> = ...;

// TCO Optimizable (Accumulator Pattern, up to 1,000 steps):
type Repeat<T, N extends number, Acc extends T[] = []> =
  Acc["length"] extends N
    ? Acc
    : Repeat<T, N, [...Acc, T]>;

type FiveStrings = Repeat<string, 5>; // [string, string, string, string, string]
```

---

### Q13: How does TypeScript 4.7's `infer T extends U` syntax work?
**Answer:**
It allows constraining an inferred type variable directly inside the pattern match, preventing the need for nested conditional types:

```typescript
// TS 4.7+ constrained infer:
type StringNumber<T> = T extends `${infer N extends number}` ? N : never;

type Num = StringNumber<"100">; // Inferred as literal number 100!
```

---

### Q14: How do you build an accurate Type-Level Equality checker (`Equals<A, B>`)?
**Answer:**
Mutual assignability (`A extends B ? B extends A ? true : false : false`) fails because it incorrectly treats `any` as equal to `string`.
The gold standard implementation uses deferred conditional functions:

```typescript
type Equals<X, Y> = 
  (<T>() => T extends X ? 1 : 2) extends 
  (<T>() => T extends Y ? 1 : 2) ? true : false;

type T1 = Equals<string, string>; // true
type T2 = Equals<any, string>;    // false!
type T3 = Equals<never, never>;   // true
```

---

### Q15: Why does `boolean` distribute into `true | false` in distributive conditional types?
**Answer:**
In TypeScript, `boolean` is an alias for the union type `true | false`.
Therefore, when `boolean` is passed to a distributive conditional type `T extends true ? "A" : "B"`, it distributes over `true` and `false` individually:
`("A") | ("B")` => `"A" | "B"`.

---

### Q16: How do you implement `Head<T>` to extract the first element of a tuple?
**Answer:**
```typescript
type Head<T extends readonly unknown[]> = 
  T extends readonly [infer First, ...unknown[]] ? First : never;

type FirstItem = Head<[10, 20, 30]>; // 10
```

---

### Q17: How do you implement `Tail<T>` to extract all elements except the first?
**Answer:**
```typescript
type Tail<T extends readonly unknown[]> = 
  T extends readonly [unknown, ...infer Rest] ? Rest : [];

type RestItems = Tail<[10, 20, 30]>; // [20, 30]
```

---

### Q18: How do you implement `Last<T>` to extract the final element of a tuple?
**Answer:**
```typescript
type Last<T extends readonly unknown[]> = 
  T extends readonly [...unknown[], infer Final] ? Final : never;

type EndItem = Last<[10, 20, 30]>; // 30
```

---

### Q19: How do you recursively reverse a tuple type?
**Answer:**
```typescript
type Reverse<T extends readonly unknown[], Acc extends readonly unknown[] = []> =
  T extends readonly [infer First, ...infer Rest]
    ? Reverse<Rest, [First, ...Acc]>
    : Acc;

type Rev = Reverse<[1, 2, 3]>; // [3, 2, 1]
```

---

### Q20: How do you flatten an array of nested arrays by one level using conditional types?
**Answer:**
```typescript
type FlattenOneLevel<T extends readonly unknown[]> = 
  T extends readonly [infer First, ...infer Rest]
    ? First extends readonly unknown[]
      ? [...First, ...FlattenOneLevel<Rest>]
      : [First, ...FlattenOneLevel<Rest>]
    : [];

type Flat = FlattenOneLevel<[[1, 2], [3], 4]>; // [1, 2, 3, 4]
```

---

### Q21: How do you recursively flatten an array of arbitrarily deeply nested arrays?
**Answer:**
```typescript
type DeepFlatten<T extends readonly unknown[]> = 
  T extends readonly [infer First, ...infer Rest]
    ? First extends readonly unknown[]
      ? [...DeepFlatten<First>, ...DeepFlatten<Rest>]
      : [First, ...DeepFlatten<Rest>]
    : [];

type SuperFlat = DeepFlatten<[[1, [2, [3]]], [4]]>; // [1, 2, 3, 4]
```

---

### Q22: How do you implement a compile-time string splitter (`Split<S, Delimiter>`)?
**Answer:**
```typescript
type Split<S extends string, Delimiter extends string> =
  S extends `${infer Head}${Delimiter}${infer Tail}`
    ? [Head, ...Split<Tail, Delimiter>]
    : [S];

type Tokens = Split<"a.b.c", ".">; // ["a", "b", "c"]
```

---

### Q23: How do you implement a compile-time string joiner (`Join<T, Delimiter>`)?
**Answer:**
```typescript
type Join<T extends readonly (string | number)[], Delimiter extends string> =
  T extends [] ? "" :
  T extends [infer Only] ? `${Only & (string | number)}` :
  T extends [infer First, ...infer Rest extends (string | number)[]]
    ? `${First & (string | number)}${Delimiter}${Join<Rest, Delimiter>}`
    : string;

type Joined = Join<["user", "profile", "123"], "/">; // "user/profile/123"
```

---

### Q24: How does the built-in `Awaited<T>` utility type recursively unwrap Promises?
**Answer:**
```typescript
type CustomAwaited<T> =
  T extends null | undefined ? T :
  T extends object & { then(onfulfilled: infer F, ...args: infer _): any }
    ? F extends (value: infer V, ...args: infer _) => any
      ? CustomAwaited<V>
      : never
    : T;
```

---

### Q25: How do you extract the parameters of a function as a tuple (`Parameters<T>`)?
**Answer:**
```typescript
type CustomParameters<T extends (...args: any[]) => any> =
  T extends (...args: infer P) => any ? P : never;
```

---

### Q26: How do you extract the constructor arguments of a class (`ConstructorParameters<T>`)?
**Answer:**
```typescript
type CustomConstructorParameters<T extends abstract new (...args: any[]) => any> =
  T extends abstract new (...args: infer P) => any ? P : never;
```

---

### Q27: How do you extract the instance type produced by a constructor function (`InstanceType<T>`)?
**Answer:**
```typescript
type CustomInstanceType<T extends abstract new (...args: any[]) => any> =
  T extends abstract new (...args: any[]) => infer R ? R : any;
```

---

### Q28: How do you detect if a type is `any` using conditional types?
**Answer:**
Because `any` is assignable to everything and everything is assignable to `any`, testing with a type that only matches `any` (like `0 extends 1 & any`) identifies it:

```typescript
type IsAny<T> = 0 extends (1 & T) ? true : false;

type A = IsAny<any>;    // true
type B = IsAny<string>; // false
```

---

### Q29: How do you detect if a type is `unknown` using conditional types?
**Answer:**
`unknown` is only assignable to `unknown` and `any`. Combine with `IsAny` to exclude `any`:

```typescript
type IsUnknown<T> = IsAny<T> extends true
  ? false
  : unknown extends T
  ? true
  : false;

type U1 = IsUnknown<unknown>; // true
type U2 = IsUnknown<any>;     // false
```

---

### Q30: How do you extract all function properties from an object type?
**Answer:**
```typescript
type FunctionProperties<T> = {
  [K in keyof T as T[K] extends Function ? K : never]: T[K];
};
```

---

### Q31: How do you filter out all function properties from an object type?
**Answer:**
```typescript
type NonFunctionProperties<T> = {
  [K in keyof T as T[K] extends Function ? never : K]: T[K];
};
```

---

### Q32: How do you replace all occurrences of a substring in a string type (`ReplaceAll<S, From, To>`)?
**Answer:**
```typescript
type ReplaceAll<S extends string, From extends string, To extends string> =
  From extends "" ? S :
  S extends `${infer Left}${From}${infer Right}`
    ? `${Left}${To}${ReplaceAll<Right, From, To>}`
    : S;

type Replaced = ReplaceAll<"foo-bar-baz", "-", "_">; // "foo_bar_baz"
```

---

### Q33: How do you trim leading and trailing whitespace from a string type?
**Answer:**
```typescript
type WhiteSpace = " " | "\t" | "\n" | "\r";
type TrimStart<S extends string> = S extends `${WhiteSpace}${infer Rest}` ? TrimStart<Rest> : S;
type TrimEnd<S extends string> = S extends `${infer Rest}${WhiteSpace}` ? TrimEnd<Rest> : S;
type Trim<S extends string> = TrimEnd<TrimStart<S>>;
```

---

### Q34: What is the difference between `T extends unknown ? T[] : never` and `(T)[]`?
**Answer:**
- `T extends unknown ? T[] : never` is **distributive**. If $T$ is `string | number`, it produces `string[] | number[]`.
- `(T)[]` is **non-distributive**, producing `(string | number)[]`.

---

### Q35: How do you test if a type is a tuple rather than an arbitrary-length array?
**Answer:**
In TypeScript, tuples have a fixed literal `number` length, whereas arrays have `length: number`:

```typescript
type IsTuple<T> = T extends readonly unknown[]
  ? number extends T["length"]
    ? false
    : true
  : false;

type T1 = IsTuple<[number, string]>; // true
type T2 = IsTuple<number[]>;          // false
```

---

### Q36: How do you slice a tuple from index $A$ to index $B$ at compile time?
**Answer:**
Combine the `Drop` and `Take` helper types with counter tuples:

```typescript
type Drop<T extends readonly unknown[], N extends number, Acc extends unknown[] = []> =
  Acc["length"] extends N
    ? T
    : T extends readonly [unknown, ...infer Rest]
    ? Drop<Rest, N, [...Acc, unknown]>
    : [];
```

---

### Q37: How do you calculate the length of a string literal type at compile time?
**Answer:**
Split the string into a tuple of characters and read the tuple's `.length` property:

```typescript
type StringLength<S extends string, Acc extends unknown[] = []> =
  S extends `${string}${infer Rest}`
    ? StringLength<Rest, [...Acc, unknown]>
    : Acc["length"];

type Len = StringLength<"TypeScript">; // 10
```

---

### Q38: How do you extract keys of an object whose values match a specific type?
**Answer:**
```typescript
type KeysMatching<Obj, TargetValue> = {
  [K in keyof Obj]: Obj[K] extends TargetValue ? K : never;
}[keyof Obj];

interface User { id: number; age: number; name: string; }
type NumericKeys = KeysMatching<User, number>; // "id" | "age"
```

---

### Q39: Can `infer` be used in the constraint of another `infer`?
**Answer:**
Yes, in TypeScript 4.7+, chained inference and constraints are fully supported:
`T extends [infer A, infer B extends A] ? ...`

---

### Q40: What happens when `infer` is used in a non-conditional context?
**Answer:**
The compiler raises syntax error:
`'infer' declarations are only permitted in the 'extends' clause of a conditional type`.

---

### Q41: How do you implement a type-level Fibonacci generator?
**Answer:**
Using tuple length addition with accumulator tuples:

```typescript
type Add<A extends unknown[], B extends unknown[]> = [...A, ...B];
type Prev<T extends unknown[]> = T extends [unknown, ...infer Rest] ? Rest : [];

type Fib<N extends number, Current extends unknown[] = [unknown], Next extends unknown[] = [unknown], Count extends unknown[] = [unknown]> =
  Count["length"] extends N
    ? Current["length"]
    : Fib<N, Next, Add<Current, Next>, [...Count, unknown]>;

type Fib7 = Fib<7>; // 13
```

---

### Q42: How does the compiler handle conditional types with unresolved circular generic constraints?
**Answer:**
The compiler halts resolution and falls back to `any` or issues diagnostic:
`Type instantiation is excessively deep and possibly infinite`.

---

### Q43: How do you check if a union contains a specific member without distribution?
**Answer:**
```typescript
type UnionContains<Union, Target> = 
  [Target] extends [Union] ? true : false;
```

---

### Q44: What is the difference between `Exclude<keyof T, K>` and `Omit<T, K>`?
**Answer:**
- `Exclude<keyof T, K>` returns the **union of remaining keys** (a set of strings/symbols).
- `Omit<T, K>` returns a **new object type** containing the remaining properties mapped to their types.

---

### Q45: What is the Golden Rule of Recursive Conditional Types?
**Answer:**
**"Always structure recursive type calculations to be tail-recursive using an accumulator tuple, ensuring the recursive invocation is returned directly without outer wrapping, unlocking compiler TCO up to 1,000 steps."**
`;
};


---

## 💼 Section 12: Comprehensive Senior Engineering Interview Q&As (Part B: Questions 46–90)

### Q46: How do you extract deep nested property paths from an object type as dot-delimited strings (`Paths<T>`)?
**Answer:**
Use recursive conditional types over the object keys:

```typescript
type Paths<T> = T extends object
  ? {
      [K in keyof T]: K extends string
        ? T[K] extends object
          ? `${K}` | `${K}.${Paths<T[K]>}`
          : `${K}`
        : never;
    }[keyof T]
  : never;

interface UserProfile {
  id: string;
  contact: {
    email: string;
    address: { city: string; zip: number };
  };
}

type UserPaths = Paths<UserProfile>;
// "id" | "contact" | "contact.email" | "contact.address" | "contact.address.city" | "contact.address.zip"
```

---

### Q47: How do you implement a type-safe nested value retriever (`Get<T, Path>`) based on dot-delimited string paths?
**Answer:**
```typescript
type Get<T, Path extends string> =
  Path extends `${infer Head}.${infer Tail}`
    ? Head extends keyof T
      ? Get<T[Head], Tail>
      : never
    : Path extends keyof T
    ? T[Path]
    : never;

type City = Get<UserProfile, "contact.address.city">; // string
type Zip = Get<UserProfile, "contact.address.zip">;   // number
```

---

### Q48: How do you detect whether an object property is optional or required using conditional types?
**Answer:**
An empty object `{}` is assignable to `Pick<T, K>` if and only if property $K$ is optional!

```typescript
type IsOptional<T, K extends keyof T> = 
  {} extends Pick<T, K> ? true : false;

interface Person {
  requiredName: string;
  optionalAge?: number;
}

type T1 = IsOptional<Person, "requiredName">; // false
type T2 = IsOptional<Person, "optionalAge">;  // true
```

---

### Q49: How do you extract all optional keys of an object type (`OptionalKeys<T>`)?
**Answer:**
```typescript
type OptionalKeys<T> = {
  [K in keyof T]-?: {} extends Pick<T, K> ? K : never;
}[keyof T];

type Opts = OptionalKeys<Person>; // "optionalAge"
```

---

### Q50: How do you extract all required keys of an object type (`RequiredKeys<T>`)?
**Answer:**
```typescript
type RequiredKeys<T> = {
  [K in keyof T]-?: {} extends Pick<T, K> ? never : K;
}[keyof T];

type Reqs = RequiredKeys<Person>; // "requiredName"
```

---

### Q51: How do you detect if a property is `readonly` using conditional types?
**Answer:**
Compare assigning to the property using conditional equality:

```typescript
type IsReadonly<T, K extends keyof T> = 
  Equals<{ [P in K]: T[K] }, { readonly [P in K]: T[K] }>;

interface Account {
  readonly id: string;
  balance: number;
}

type R1 = IsReadonly<Account, "id">;      // true
type R2 = IsReadonly<Account, "balance">; // false
```

---

### Q52: How do you extract route parameters from a URL pattern (`/users/:userId/posts/:postId`)?
**Answer:**
Combine string pattern matching with recursive template literals and `infer`:

```typescript
type ExtractRouteParams<Path extends string> =
  Path extends `${string}:${infer Param}/${infer Rest}`
    ? Param | ExtractRouteParams<`/${Rest}`>
    : Path extends `${string}:${infer Param}`
    ? Param
    : never;

type RouteParams = ExtractRouteParams<"/users/:userId/posts/:postId">;
// "userId" | "postId"
```

---

### Q53: How do you convert a union of types into a tuple of types (`UnionToTuple<U>`)?
**Answer:**
Combine `UnionToIntersection` with function overload inference to pop one element at a time from the union:

```typescript
type LastOfUnion<U> =
  UnionToIntersection<U extends unknown ? (k: U) => void : never> extends
  (k: infer I) => void ? I : never;

type Push<T extends unknown[], V> = [...T, V];

export type UnionToTuple<U, Last = LastOfUnion<U>> =
  [U] extends [never]
    ? []
    : Push<UnionToTuple<Exclude<U, Last>>, Last>;

type TupleRes = UnionToTuple<"a" | "b" | "c">;
// Evaluates to: ["a", "b", "c"]
```

---

### Q54: How do you perform compile-time natural number addition using tuple lengths?
**Answer:**
Create tuples of length $A$ and $B$, spread them into a combined tuple, and read `.length`:

```typescript
type TupleOfLength<N extends number, Acc extends unknown[] = []> =
  Acc["length"] extends N ? Acc : TupleOfLength<N, [...Acc, unknown]>;

type TypeAdd<A extends number, B extends number> =
  [...TupleOfLength<A>, ...TupleOfLength<B>]["length"];

type Sum = TypeAdd<3, 4>; // 7
```

---

### Q55: How do you perform compile-time subtraction (`Sub<A, B>`)?
**Answer:**
Match the longer tuple against the shorter tuple with a rest parameter:

```typescript
type TypeSub<A extends number, B extends number> =
  TupleOfLength<A> extends [...TupleOfLength<B>, ...infer Rest]
    ? Rest["length"]
    : never;

type Diff = TypeSub<10, 4>; // 6
```

---

### Q56: How do you perform compile-time multiplication (`Multiply<A, B>`)?
**Answer:**
Repeated addition via accumulator tuples:

```typescript
type TypeMultiply<A extends number, B extends number, Acc extends unknown[] = [], Counter extends unknown[] = []> =
  Counter["length"] extends B
    ? Acc["length"]
    : TypeMultiply<A, B, [...Acc, ...TupleOfLength<A>], [...Counter, unknown]>;

type Product = TypeMultiply<3, 5>; // 15
```

---

### Q57: How do you write a generic Curried function type for a function with arbitrary parameters?
**Answer:**
Recursively consume parameters one by one:

```typescript
type Curry<Args extends readonly unknown[], Return> =
  Args extends readonly [infer First, ...infer Rest]
    ? (arg: First) => Curry<Rest, Return>
    : Return;

type Curried3 = Curry<[number, string, boolean], void>;
// (arg: number) => (arg: string) => (arg: boolean) => void
```

---

### Q58: How do you safely parse an integer string to a literal number type (`ParseInt<S>`)?
**Answer:**
```typescript
type ParseInt<S extends string> = S extends `${infer N extends number}` ? N : never;

type N1 = ParseInt<"42">;     // 42
type N2 = ParseInt<"invalid">; // never
```

---

### Q59: How do you detect if a type is a tuple with a fixed length vs an open array?
**Answer:**
```typescript
type IsFixedTuple<T> = T extends readonly unknown[]
  ? number extends T["length"]
    ? false
    : true
  : false;
```

---

### Q60: How do you implement `DeepNonNullable<T>` to recursively strip `null` and `undefined`?
**Answer:**
```typescript
type DeepNonNullable<T> = T extends Function
  ? T
  : T extends object
  ? { [K in keyof T]: DeepNonNullable<NonNullable<T[K]>> }
  : NonNullable<T>;
```

---

### Q61: What is the compiler's behavior when an unconstrained conditional type evaluates on `any`?
**Answer:**
If $T$ is `any`, an unconstrained conditional type `T extends U ? X : Y` evaluates to the **union of both branches** (`X | Y`), because `any` is assignable to everything and everything is assignable to `any`!

```typescript
type TestAny<T> = T extends number ? "num" : "not-num";
type Res = TestAny<any>; // "num" | "not-num"
```

---

### Q62: How do you prevent `any` from evaluating to `X | Y` in conditional types?
**Answer:**
Guard with `IsAny<T>` before proceeding with the conditional:

```typescript
type SafeTest<T> = IsAny<T> extends true ? "was-any" : T extends number ? "num" : "other";
```

---

### Q63: How do you convert a kebab-case string type to camelCase (`KebabToCamel<S>`)?
**Answer:**
```typescript
type KebabToCamel<S extends string> =
  S extends `${infer Head}-${infer Rest}`
    ? `${Head}${Capitalize<KebabToCamel<Rest>>}`
    : S;

type Camel = KebabToCamel<"user-profile-id">; // "userProfileId"
```

---

### Q64: How do you convert a camelCase string type to kebab-case (`CamelToKebab<S>`)?
**Answer:**
```typescript
type CamelToKebab<S extends string> =
  S extends `${infer First}${infer Rest}`
    ? First extends Uppercase<First>
      ? `-${Lowercase<First>}${CamelToKebab<Rest>}`
      : `${First}${CamelToKebab<Rest>}`
    : S;

type Kebab = CamelToKebab<"userProfileId">; // "user-profile-id"
```

---

### Q65: How do you implement a type-safe string includes check (`StringIncludes<S, Search>`)?
**Answer:**
```typescript
type StringIncludes<S extends string, Search extends string> =
  S extends `${string}${Search}${string}` ? true : false;

type HasAt = StringIncludes<"user@domain.com", "@">; // true
type HasHash = StringIncludes<"user@domain.com", "#">; // false
```

---

### Q66: How do you filter a tuple to keep only elements matching a type constraint (`FilterTuple<T, Constraint>`)?
**Answer:**
```typescript
type FilterTuple<T extends readonly unknown[], Constraint, Acc extends unknown[] = []> =
  T extends readonly [infer First, ...infer Rest]
    ? First extends Constraint
      ? FilterTuple<Rest, Constraint, [...Acc, First]>
      : FilterTuple<Rest, Constraint, Acc>
    : Acc;

type StringsOnly = FilterTuple<[1, "a", 2, "b", true], string>; // ["a", "b"]
```

---

### Q67: How do you deduplicate members of a tuple type at compile time?
**Answer:**
```typescript
type TupleIncludes<T extends readonly unknown[], Element> =
  T extends readonly [infer First, ...infer Rest]
    ? Equals<First, Element> extends true
      ? true
      : TupleIncludes<Rest, Element>
    : false;

type Deduplicate<T extends readonly unknown[], Acc extends unknown[] = []> =
  T extends readonly [infer First, ...infer Rest]
    ? TupleIncludes<Acc, First> extends true
      ? Deduplicate<Rest, Acc>
      : Deduplicate<Rest, [...Acc, First]>
    : Acc;

type Unique = Deduplicate<[1, 2, 2, 3, 1, 4]>; // [1, 2, 3, 4]
```

---

### Q68: How do you extract keys whose values are assignable to `string | number`?
**Answer:**
```typescript
type PrimitiveKeys<T> = {
  [K in keyof T]: T[K] extends string | number ? K : never;
}[keyof T];
```

---

### Q69: How do you implement a type-level Zip function that combines two tuples into tuple pairs?
**Answer:**
```typescript
type Zip<A extends readonly unknown[], B extends readonly unknown[], Acc extends unknown[] = []> =
  A extends readonly [infer AHead, ...infer ARest]
    ? B extends readonly [infer BHead, ...infer BRest]
      ? Zip<ARest, BRest, [...Acc, [AHead, BHead]]>
      : Acc
    : Acc;

type Zipped = Zip<[1, 2, 3], ["a", "b", "c"]>; // [[1, "a"], [2, "b"], [3, "c"]]
```

---

### Q70: How do you implement a compile-time string Repeat utility (`RepeatString<S, N>`)?
**Answer:**
```typescript
type RepeatString<S extends string, N extends number, Acc extends string = "", Counter extends unknown[] = []> =
  Counter["length"] extends N
    ? Acc
    : RepeatString<S, N, `${Acc}${S}`, [...Counter, unknown]>;

type Triple = RepeatString<"abc", 3>; // "abcabcabc"
```

---

### Q71: How do you detect if a type is a Union type?
**Answer:**
Compare the naked distributed type with the wrapped non-distributed type:

```typescript
type IsUnion<T, U = T> =
  [T] extends [never]
    ? false
    : T extends unknown
    ? [U] extends [T]
      ? false
      : true
    : false;

type U1 = IsUnion<string | number>; // true
type U2 = IsUnion<string>;          // false
```

---

### Q72: How does `infer` interact with generic default parameters?
**Answer:**
If a type parameter has a default, `infer` matches the concrete instantiated type, ignoring the default value during pattern matching.

---

### Q73: How do you flatten an object with nested properties into a single-level object with dot paths?
**Answer:**
```typescript
type FlattenObject<T> = {
  [K in Paths<T>]: Get<T, K>;
};
```

---

### Q74: What is the compilation performance trade-off of deep recursive types?
**Answer:**
Each level of recursion multiplies type checker instantiation cache lookups. Unbounded recursion or deep object graph parsing can dramatically inflate `tsc` memory usage and compilation times. Always use Tail-Call Optimization and depth guards for complex types.

---

### Q75: How do you implement a Depth Guard on recursive types?
**Answer:**
Use a counter tuple with a maximum allowed length:

```typescript
type MaxDepth = 5;
type GuardedRecurse<T, Depth extends unknown[] = []> =
  Depth["length"] extends MaxDepth
    ? T
    : T extends object
    ? { [K in keyof T]: GuardedRecurse<T[K], [...Depth, unknown]> }
    : T;
```

---

### Q76: How do you extract the arguments of a specific overload of a function?
**Answer:**
TypeScript's `Parameters<T>` only extracts the **last declared overload** of an overloaded function due to the way conditional inference processes intersection call signatures.

---

### Q77: How do you verify at compile time that an event handler handles all events defined in an event map?
**Answer:**
```typescript
type VerifyHandler<Map, Handler> =
  Handler extends { [K in keyof Map]: (payload: Map[K]) => void } ? true : false;
```

---

### Q78: How do you write a generic DeepMutable utility that removes `readonly` recursively?
**Answer:**
```typescript
type DeepMutable<T> = T extends Function
  ? T
  : T extends readonly (infer E)[]
  ? DeepMutable<E>[]
  : { -readonly [K in keyof T]: DeepMutable<T[K]> };
```

---

### Q79: How do you check if a number literal is greater than another number literal at compile time (`GreaterThan<A, B>`)?
**Answer:**
Use tuple length pattern matching:

```typescript
type GreaterThan<A extends number, B extends number> =
  A extends B
    ? false
    : TupleOfLength<A> extends [...TupleOfLength<B>, ...unknown[]]
    ? true
    : false;

type G1 = GreaterThan<10, 5>; // true
type G2 = GreaterThan<3, 8>;  // false
```

---

### Q80: How do you recursively strip undefined from object properties?
**Answer:**
```typescript
type StripUndefined<T> = {
  [K in keyof T]: Exclude<T[K], undefined>;
};
```

---

### Q81: What is the difference between `infer` on a tuple rest element `[...infer Rest]` and `infer Rest` on an array `(infer Rest)[]`?
**Answer:**
- `[...infer Rest]`: Captures the **exact remaining tuple elements** with their individual types and order preserved.
- `(infer Rest)[]`: Collapses all elements into a single **union** of element types.

---

### Q82: How do you implement compile-time JSON Schema validation using conditional types?
**Answer:**
Map JSON schema property types (`"string"`, `"number"`, `"boolean"`) to their corresponding TypeScript primitives in conditional branches.

---

### Q83: How do you extract all values of an object that are Promises?
**Answer:**
```typescript
type PromiseValues<T> = {
  [K in keyof T as T[K] extends Promise<any> ? K : never]: T[K];
};
```

---

### Q84: How do you unwrap all Promises inside an object's properties?
**Answer:**
```typescript
type UnwrapObjectPromises<T> = {
  [K in keyof T]: T[K] extends Promise<infer U> ? U : T[K];
};
```

---

### Q85: How do you implement a type-safe `PickByValue<T, ValueType>`?
**Answer:**
```typescript
type PickByValue<T, ValueType> = {
  [K in keyof T as T[K] extends ValueType ? K : never]: T[K];
};
```

---

### Q86: How do you implement a type-safe `OmitByValue<T, ValueType>`?
**Answer:**
```typescript
type OmitByValue<T, ValueType> = {
  [K in keyof T as T[K] extends ValueType ? never : K]: T[K];
};
```

---

### Q87: How do you construct a Cartesian product of two union types at compile time?
**Answer:**
Distributive conditional types over two naked parameters naturally generate a Cartesian product:

```typescript
type Cartesian<A, B> = A extends unknown ? (B extends unknown ? [A, B] : never) : never;

type Pairs = Cartesian<"x" | "y", 1 | 2>;
// ["x", 1] | ["x", 2] | ["y", 1] | ["y", 2]
```

---

### Q88: How do you count occurrences of a character in a string type?
**Answer:**
```typescript
type CountChar<S extends string, C extends string, Acc extends unknown[] = []> =
  S extends `${string}${C}${infer Rest}`
    ? CountChar<Rest, C, [...Acc, unknown]>
    : Acc["length"];

type Dots = CountChar<"192.168.1.1", ".">; // 3
```

---

### Q89: How do you check if a string starts with a specific prefix type?
**Answer:**
```typescript
type StartsWith<S extends string, Prefix extends string> =
  S extends `${Prefix}${string}` ? true : false;
```

---

### Q90: What is the architectural role of Conditional Types in modern enterprise software?
**Answer:**
**"Conditional types provide compile-time reflection and transformation. They eliminate runtime glue code, automate API contract validation, and ensure that changes to domain models automatically propagate through data transfer objects, database queries, and UI components with zero manual synchronization."**
`;
};


---

## 🧩 Section 13: Output & Type-Prediction Puzzles (15 In-Depth Scenarios)

### Puzzle 1: The `never` Distribution Disappearance
```typescript
type CheckType<T> = T extends number ? "number" : "not-number";

type ResA = CheckType<string>;
type ResB = CheckType<never>;

console.log("ResA evaluated");
```
**Question**: What is the static type of `ResA`? What is the static type of `ResB`?
**Answer & Analysis**:
- `ResA` evaluates to `"not-number"`.
- `ResB` evaluates to **`never`**, NOT `"not-number"`!
- Because `never` is an empty union of 0 members, the distributive conditional type evaluates 0 times, returning `never`.

---

### Puzzle 2: Distribution Suppression with `[T]`
```typescript
type IsNeverStrict<T> = [T] extends [never] ? "is-never" : "not-never";

type Test1 = IsNeverStrict<never>;
type Test2 = IsNeverStrict<string>;

console.log("Strict never check complete");
```
**Question**: What are `Test1` and `Test2`?
**Answer & Analysis**:
- By wrapping both sides in square brackets `[T] extends [never]`, distribution is suppressed.
- `Test1` evaluates to `"is-never"`.
- `Test2` evaluates to `"not-never"`.

---

### Puzzle 3: The `boolean` Distribution Split
```typescript
type Branch<T> = T extends true ? "YES" : "NO";

type Result = Branch<boolean>;
```
**Question**: What is the type of `Result`?
**Answer & Analysis**:
- In TypeScript, `boolean` is defined as `true | false`.
- The naked type parameter distributes over both variants:
  `(true extends true ? "YES" : "NO") | (false extends true ? "YES" : "NO")`
  => `"YES" | "NO"`.
- Result is the union `"YES" | "NO"`, not `"NO"`!

---

### Puzzle 4: Covariant `infer` Produces a Union
```typescript
type ExtractValues<T> = T extends { a: infer R; b: infer R } ? R : never;

type Data = ExtractValues<{ a: string; b: number }>;
```
**Question**: What is the type of `Data`?
**Answer & Analysis**:
- `infer R` appears in two covariant (output) positions (`a` and `b`).
- TypeScript collects candidates and computes their **Union**.
- `Data` is inferred as `string | number`.

---

### Puzzle 5: Contravariant `infer` Produces an Intersection
```typescript
type ExtractParams<T> = T extends {
  f1: (x: infer R) => void;
  f2: (x: infer R) => void;
} ? R : never;

type Combined = ExtractParams<{
  f1: (x: { name: string }) => void;
  f2: (x: { age: number }) => void;
}>;
```
**Question**: What is the type of `Combined`?
**Answer & Analysis**:
- `infer R` appears in two contravariant (function argument) positions.
- To safely accept calls from both functions, the candidate must satisfy both requirements simultaneously.
- TypeScript computes their **Intersection**.
- `Combined` is inferred as `{ name: string } & { age: number }`.

---

### Puzzle 6: The `any` Branching Explosion
```typescript
type CheckNumber<T> = T extends number ? "is-number" : "not-number";

type Outcome = CheckNumber<any>;
```
**Question**: What is the type of `Outcome`?
**Answer & Analysis**:
- Because `any` is assignable to `number` AND `number` is assignable to `any`, the conditional distributes into both branches!
- `Outcome` is inferred as the union `"is-number" | "not-number"`.

---

### Puzzle 7: Transforming Union to Intersection
```typescript
type UnionToIntersection<U> = 
  (U extends unknown ? (k: U) => void : never) extends 
  (k: infer I) => void ? I : never;

type Merged = UnionToIntersection<{ token: string } | { secret: number }>;
```
**Question**: What is the type of `Merged`?
**Answer & Analysis**:
- The union of objects is mapped to a union of functions contravariant on their parameters.
- Pattern matching against `(k: infer I) => void` intersects the parameters.
- `Merged` is inferred as `{ token: string } & { secret: number }`.

---

### Puzzle 8: Deep Promise Unwrapping
```typescript
type Unwrap<T> = T extends Promise<infer U> ? Unwrap<U> : T;

type DeepVal = Unwrap<Promise<Promise<Promise<number>>>>;
```
**Question**: What is the type of `DeepVal`?
**Answer & Analysis**:
- The conditional type recurses three times until the innermost type is non-Promise.
- `DeepVal` evaluates to `number`.

---

### Puzzle 9: String Path Tokenizer
```typescript
type SplitPath<S extends string> =
  S extends `${infer Head}/${infer Tail}`
    ? [Head, ...SplitPath<Tail>]
    : [S];

type Segments = SplitPath<"api/v1/users">;
```
**Question**: What is the static type of `Segments`?
**Answer & Analysis**:
- The template literal pattern extracts `"api"`, recurses on `"v1/users"`, extracts `"v1"`, and concludes with `["users"]`.
- `Segments` is inferred as `["api", "v1", "users"]`.

---

### Puzzle 10: Deep Path Key Extraction
```typescript
type Config = {
  db: {
    host: string;
    port: number;
  };
};

type DeepKeys<T> = T extends object
  ? { [K in keyof T]: K extends string ? `${K}` | `${K}.${DeepKeys<T[K]>}` : never }[keyof T]
  : never;

type Keys = DeepKeys<Config>;
```
**Question**: What keys are included in `Keys`?
**Answer & Analysis**:
- Evaluates to `"db" | "db.host" | "db.port"`.

---

### Puzzle 11: Testing Optional Property via Empty Object Assignability
```typescript
type Entity = {
  id: string;
  note?: string;
};

type IsNoteOptional = {} extends Pick<Entity, "note"> ? true : false;
type IsIdOptional = {} extends Pick<Entity, "id"> ? true : false;
```
**Question**: What are `IsNoteOptional` and `IsIdOptional`?
**Answer & Analysis**:
- `Pick<Entity, "note">` is `{ note?: string }`. `{}` is assignable to it, so `IsNoteOptional` is `true`.
- `Pick<Entity, "id">` is `{ id: string }`. `{}` lacks `id`, so `IsIdOptional` is `false`.

---

### Puzzle 12: Natural Number Addition at Compile Time
```typescript
type Length<T extends unknown[]> = T["length"];
type BuildTuple<N extends number, Acc extends unknown[] = []> =
  Acc["length"] extends N ? Acc : BuildTuple<N, [...Acc, unknown]>;

type Add<A extends number, B extends number> =
  Length<[...BuildTuple<A>, ...BuildTuple<B>]>;

type Result = Add<2, 3>;
```
**Question**: What is the static type of `Result`?
**Answer & Analysis**:
- Builds tuple of length 2, tuple of length 3, combines them into length 5, and reads `.length`.
- `Result` is literal number `5`.

---

### Puzzle 13: String Replace All
```typescript
type ReplaceChar<S extends string, From extends string, To extends string> =
  S extends `${infer Start}${From}${infer Rest}`
    ? `${Start}${To}${ReplaceChar<Rest, From, To>}`
    : S;

type CleanStr = ReplaceChar<"2026-09-27", "-", "/">;
```
**Question**: What is `CleanStr`?
**Answer & Analysis**:
- Recursively matches `-` and replaces with `/`.
- `CleanStr` is literal `"2026/09/27"`.

---

### Puzzle 14: Rest Tuple Pattern Matching
```typescript
type Deconstruct<T> = T extends [infer Head, ...infer Tail] ? { head: Head; tail: Tail } : never;

type Sample = Deconstruct<["first", 2, true]>;
```
**Question**: What are `Sample["head"]` and `Sample["tail"]`?
**Answer & Analysis**:
- `Sample["head"]` is literal `"first"`.
- `Sample["tail"]` is tuple `[2, true]`.

---

### Puzzle 15: Tail-Call Recursion vs Stack Overflow
```typescript
// Tail-recursive with accumulator:
type Loop<Count extends number, Acc extends unknown[] = []> =
  Acc["length"] extends Count
    ? Acc["length"]
    : Loop<Count, [...Acc, unknown]>;

type Hundred = Loop<100>;
```
**Question**: Does `Loop<100>` compile under modern TypeScript?
**Answer & Analysis**:
- **Yes!** Because the recursive call `Loop<Count, [...Acc, unknown]>` is in tail position, TypeScript 4.5+ Tail-Call Optimization executes it iteratively without blowing the 50-stack limit (handling up to 1,000 steps).
- `Hundred` evaluates to literal `100`.
`;
};


---

## 🛠️ Section 14: Four Complete Production Projects (Zero Stubs, Fully Runnable)

All four projects below are designed with production-grade architecture and self-contained runtime verification suites using `node:assert/strict`.

---

### Project 1: Type-Level Deep Object Differ & Runtime Patch Engine

**Architectural Objective**: Build a type-safe object diffing engine where changes between state snapshots are typed as explicit added, modified, and removed mutations, with a verifiable patch applier.

```typescript
import assert from "node:assert/strict";

// Diff Representation
export interface DiffPatch<T> {
  added: Partial<T>;
  modified: Partial<T>;
  removed: (keyof T)[];
}

export class ObjectDiffer<T extends Record<string, any>> {
  private baseState: T;

  constructor(base: T) {
    this.baseState = { ...base };
  }

  public computeDiff(nextState: T): DiffPatch<T> {
    const added: Partial<T> = {};
    const modified: Partial<T> = {};
    const removed: (keyof T)[] = [];

    const baseKeys = new Set(Object.keys(this.baseState));
    const nextKeys = new Set(Object.keys(nextState));

    for (const key of nextKeys) {
      if (!baseKeys.has(key)) {
        added[key as keyof T] = nextState[key];
      } else if (this.baseState[key] !== nextState[key]) {
        modified[key as keyof T] = nextState[key];
      }
    }

    for (const key of baseKeys) {
      if (!nextKeys.has(key)) {
        removed.push(key as keyof T);
      }
    }

    return { added, modified, removed };
  }

  public applyPatch(patch: DiffPatch<T>): T {
    const updated: any = { ...this.baseState };

    for (const key of patch.removed) {
      delete updated[key];
    }
    for (const [key, val] of Object.entries(patch.added)) {
      updated[key] = val;
    }
    for (const [key, val] of Object.entries(patch.modified)) {
      updated[key] = val;
    }

    this.baseState = updated;
    return this.baseState;
  }
}

// Verification Harness
function verifyObjectDiffer() {
  interface UserConfig {
    theme: string;
    fontSize: number;
    betaFeatures?: boolean;
    customDomain?: string;
  }

  const initial: UserConfig = { theme: "light", fontSize: 14 };
  const differ = new ObjectDiffer<UserConfig>(initial);

  const targetState: UserConfig = {
    theme: "dark",      // modified
    fontSize: 14,       // unchanged
    betaFeatures: true  // added
  };

  const patch = differ.computeDiff(targetState);

  assert.equal(patch.modified.theme, "dark");
  assert.equal(patch.added.betaFeatures, true);
  assert.equal(patch.removed.length, 0);

  const patched = differ.applyPatch(patch);
  assert.equal(patched.theme, "dark");
  assert.equal(patched.betaFeatures, true);

  console.log("✅ Project 1 (Deep Differ & Patch Engine) Verified Successfully!");
}
verifyObjectDiffer();
```

---

### Project 2: Type-Safe Recursive Schema Flattener & Dot-Path Resolver

**Architectural Objective**: Build a runtime path accessor that reads and writes deeply nested properties with full compile-time validation of dot-delimited path strings (`Paths<T>` and `Get<T, P>`).

```typescript
import assert from "node:assert/strict";

export type DotPaths<T> = T extends object
  ? {
      [K in keyof T]: K extends string
        ? T[K] extends object
          ? `${K}` | `${K}.${DotPaths<T[K]>}`
          : `${K}`
        : never;
    }[keyof T]
  : never;

export type PathValue<T, Path extends string> =
  Path extends `${infer Head}.${infer Tail}`
    ? Head extends keyof T
      ? PathValue<T[Head], Tail>
      : never
    : Path extends keyof T
    ? T[Path]
    : never;

export class DeepPathResolver<T extends Record<string, any>> {
  private target: T;

  constructor(target: T) {
    this.target = target;
  }

  public get<P extends DotPaths<T>>(path: P): PathValue<T, P> {
    const segments = (path as string).split(".");
    let current: any = this.target;

    for (const seg of segments) {
      if (current === undefined || current === null) return undefined as any;
      current = current[seg];
    }
    return current;
  }

  public set<P extends DotPaths<T>>(path: P, value: PathValue<T, P>): void {
    const segments = (path as string).split(".");
    let current: any = this.target;

    for (let i = 0; i < segments.length - 1; i++) {
      const seg = segments[i];
      if (typeof current[seg] !== "object" || current[seg] === null) {
        current[seg] = {};
      }
      current = current[seg];
    }
    current[segments[segments.length - 1]] = value;
  }

  public snapshot(): T {
    return structuredClone(this.target);
  }
}

// Verification Harness
function verifyDeepPathResolver() {
  interface EnterpriseOrg {
    name: string;
    infrastructure: {
      cloud: string;
      kubernetes: {
        clusterName: string;
        nodeCount: number;
      };
    };
  }

  const org: EnterpriseOrg = {
    name: "Acme Corp",
    infrastructure: {
      cloud: "AWS",
      kubernetes: {
        clusterName: "prod-cluster-01",
        nodeCount: 12
      }
    }
  };

  const resolver = new DeepPathResolver(org);

  // Type-Safe Deep Get:
  const nodeCount = resolver.get("infrastructure.kubernetes.nodeCount");
  assert.equal(nodeCount, 12);

  // Type-Safe Deep Set:
  resolver.set("infrastructure.kubernetes.nodeCount", 24);
  assert.equal(resolver.get("infrastructure.kubernetes.nodeCount"), 24);

  console.log("✅ Project 2 (Deep Path Resolver) Verified Successfully!");
}
verifyDeepPathResolver();
```

---

### Project 3: Type-Level Boolean Logic & Predicate Evaluator

**Architectural Objective**: Build a compile-time boolean logic engine that validates permissions and logical conditions using recursive conditional types.

```typescript
import assert from "node:assert/strict";

// Type-Level Boolean Operators:
export type Not<B extends boolean> = B extends true ? false : true;

export type And<A extends boolean, B extends boolean> =
  A extends true ? (B extends true ? true : false) : false;

export type Or<A extends boolean, B extends boolean> =
  A extends true ? true : (B extends true ? true : false);

export type Xor<A extends boolean, B extends boolean> =
  A extends B ? false : true;

// Permission Matrix Evaluator:
export interface UserContext {
  isAdmin: boolean;
  isOwner: boolean;
  hasWritePermission: boolean;
}

export type CanEditDocument<Ctx extends UserContext> =
  Or<Ctx["isAdmin"], And<Ctx["isOwner"], Ctx["hasWritePermission"]>>;

export class PermissionEngine {
  public static canEdit(ctx: UserContext): boolean {
    return ctx.isAdmin || (ctx.isOwner && ctx.hasWritePermission);
  }
}

// Verification Harness
function verifyPermissionEngine() {
  const adminCtx: UserContext = { isAdmin: true, isOwner: false, hasWritePermission: false };
  const ownerWithoutWrite: UserContext = { isAdmin: false, isOwner: true, hasWritePermission: false };
  const ownerWithWrite: UserContext = { isAdmin: false, isOwner: true, hasWritePermission: true };

  assert.equal(PermissionEngine.canEdit(adminCtx), true);
  assert.equal(PermissionEngine.canEdit(ownerWithoutWrite), false);
  assert.equal(PermissionEngine.canEdit(ownerWithWrite), true);

  console.log("✅ Project 3 (Type-Level Boolean Logic Engine) Verified Successfully!");
}
verifyPermissionEngine();
```

---

### Project 4: Enterprise Compile-Time Dependency Graph & Cyclic Import Validator

**Architectural Objective**: Build an asynchronous module dependency validator that topologically sorts dependency graphs, detecting circular dependencies and calculating execution order.

```typescript
import assert from "node:assert/strict";

export interface DependencyGraph {
  [moduleName: string]: readonly string[];
}

export class DependencyResolver {
  private graph: DependencyGraph;

  constructor(graph: DependencyGraph) {
    this.graph = graph;
  }

  public resolveBuildOrder(): string[] {
    const visited = new Set<string>();
    const visiting = new Set<string>();
    const order: string[] = [];

    const visit = (node: string) => {
      if (visiting.has(node)) {
        throw new Error(`Circular dependency detected involving module: "${node}"`);
      }
      if (visited.has(node)) return;

      visiting.add(node);
      const deps = this.graph[node] ?? [];
      for (const dep of deps) {
        visit(dep);
      }
      visiting.delete(node);
      visited.add(node);
      order.push(node);
    };

    for (const node of Object.keys(this.graph)) {
      if (!visited.has(node)) {
        visit(node);
      }
    }

    return order;
  }
}

// Verification Harness
function verifyDependencyResolver() {
  const validGraph: DependencyGraph = {
    "app": ["auth", "database"],
    "auth": ["crypto"],
    "database": ["crypto"],
    "crypto": []
  };

  const resolver = new DependencyResolver(validGraph);
  const order = resolver.resolveBuildOrder();

  assert.equal(order.indexOf("crypto") < order.indexOf("auth"), true);
  assert.equal(order.indexOf("crypto") < order.indexOf("database"), true);
  assert.equal(order.indexOf("auth") < order.indexOf("app"), true);

  // Circular graph:
  const circularGraph: DependencyGraph = {
    "A": ["B"],
    "B": ["C"],
    "C": ["A"]
  };

  const badResolver = new DependencyResolver(circularGraph);
  assert.throws(() => {
    badResolver.resolveBuildOrder();
  }, /Circular dependency detected/);

  console.log("✅ Project 4 (Dependency Graph & Cycle Detector) Verified Successfully!");
}
verifyDependencyResolver();
```


---

## 📋 Section 15: The Production DOs and DON'Ts Matrix (20 Critical Rules)

| # | Category | ❌ NEVER DO (Anti-Pattern) | ✅ ALWAYS DO (Production Standard) | Technical Rationale & Failure Mode |
|---|---|---|---|---|
| 1 | Never Check | `type IsNever<T> = T extends never ? true : false` | `type IsNever<T> = [T] extends [never] ? true : false` | Naked `never` has 0 members; distributive conditional evaluates 0 times to `never`. |
| 2 | Boolean Distribution | Forget that `boolean` is `true \| false` | Handle both branches or suppress with `[T]` | `T extends true` distributes into `true \| false` (boolean), surprising developers. |
| 3 | Recursion Structure | Non-TCO recursive types (`[...Recurse<T>, E]`) | Tail-Call Accumulator pattern (`Recurse<T, [E, ...Acc]>`) | Non-TCO recursion crashes compiler at ~50 levels; TCO handles up to 1,000 steps. |
| 4 | Union to Intersection | Re-implement with unsafe casts | Use contravariant parameter `infer I` | Contravariant inference provides mathematically sound union-to-intersection. |
| 5 | String Parsing | Hardcode nested regex without types | Combine template literals with `infer` | Template literal pattern matching guarantees exact string slice types. |
| 6 | Nested Dot Paths | Manually write strings like `"user.name"` | Use `Paths<T>` utility to constrain strings | Protects against typos and silently broken path accessors when schema fields rename. |
| 7 | Unbounded Recursion | Omit depth checks on arbitrary object graphs | Introduce depth guard counter tuples | Unbounded recursive traversals cause compiler memory exhaustion on cyclical types. |
| 8 | Tuple Slicing | Cast tuples with `as any[]` | Use rest tuple pattern matching `[infer H, ...infer T]` | Preserves exact element positions and readonly modifiers. |
| 9 | Function Return | Duplicate function return signatures | Use `ReturnType<T>` or `infer R` | Prevents desynchronization when function implementation return type changes. |
| 10 | Optional Detection | Check `undefined extends T[K]` alone | Check `{} extends Pick<T, K>` | Properties explicitly typed as `undefined` are not the same as optional properties. |
| 11 | Any Distribution | Rely on conditional types with `any` | Guard with `IsAny<T>` first | `any` distributes into both true and false branches (`A \| B`), poisoning logic. |
| 12 | Overload Inference | Expect `Parameters<T>` to return all overloads | Understand it returns only the last overload | TypeScript conditional inference processes intersection signatures from the bottom. |
| 13 | Deep Flattening | Flatten arrays with loose loops | Use recursive conditional `DeepFlatten` | Accurately models multi-dimensional scientific or graphics data structures. |
| 14 | Array vs Tuple | Treat `T[]` as equivalent to tuples | Check `number extends T["length"]` | Fixed tuples have literal lengths; open arrays have number length. |
| 15 | Infer Suffix | Nest conditions to cast inferred types | Use `infer T extends Constraint` (TS 4.7) | Flattens type definitions and simplifies compiler instantiation ASTs. |
| 16 | Key Filtering | Use manual index loops | Key remapping with `as` and conditional filtering | Cleaner, idiomatic, and faster type resolution. |
| 17 | Self-Referencing | Declare recursive interfaces that loop forever | Guard recursive base cases with terminal checks | Without base case checks, the compiler halts with depth errors. |
| 18 | Complex Conditionals | Nest 10 ternary conditions in one line | Break complex types into modular helper types | Improves readability, debugging, and IDE type inspection hover popups. |
| 19 | Library Utilities | Write custom versions of `Awaited` | Use native `Awaited<T>` (TS 4.5+) | Built-in utilities are optimized in C++ in the TypeScript core checker. |
| 20 | Monorepo Performance | Run deep conditional gymnastics in hot paths | Benchmark with `--extendedDiagnostics` | Overuse of non-TCO conditional types can double or triple CI build times. |

---

## 🏢 Section 16: Real-World Architectural Case Study: Enterprise Event Sourcing & CQRS Schema Projection

### 16.1 Context & Problem Statement
A high-frequency FinTech trading platform utilizes **Event Sourcing**: all state mutations are persisted as immutable domain events, and read models (CQRS projections) are dynamically recomputed by folding over historical event streams.

The legacy codebase suffered from:
1. Incomplete event handling: New event variants added by domain engineers were silently ignored by projection reducers.
2. Inaccurate state typing: Projection handlers had to manually cast event payloads with `as any`.
3. Lack of schema evolution safety: Modifying an event payload broke historical projections at runtime.

### 16.2 Architectural Solution
The engineering team introduced a type-level Event Projection Engine utilizing:
1. **Distributive Event Discrimination**: A single master event union mapped directly to handler signatures.
2. **Compile-Time Exhaustiveness Projection**: Reducers must implement handlers for all events in the stream.
3. **Type-Safe Event Folder**: A generic folding pipeline with conditional payload extraction.

### 16.3 Production Implementation & Verification

```typescript
import assert from "node:assert/strict";

// Master Domain Event Union:
export type DomainEvent =
  | { type: "ACCOUNT_OPENED"; accountId: string; initialDepositUSD: number; timestamp: number }
  | { type: "FUNDS_DEPOSITED"; accountId: string; amountUSD: number; txId: string; timestamp: number }
  | { type: "FUNDS_WITHDRAWN"; accountId: string; amountUSD: number; txId: string; timestamp: number }
  | { type: "ACCOUNT_FROZEN"; accountId: string; reason: string; timestamp: number };

// Read Model Projection State
export interface AccountReadModel {
  readonly accountId: string;
  readonly balanceUSD: number;
  readonly isFrozen: boolean;
  readonly transactionCount: number;
}

// Type-Level Event Payload Extractor:
export type ExtractEvent<E extends DomainEvent, T extends E["type"]> =
  E extends { type: T } ? E : never;

// Projection Reducer:
export class AccountProjectionEngine {
  public static project(events: readonly DomainEvent[]): Map<string, AccountReadModel> {
    const accounts = new Map<string, AccountReadModel>();

    for (const event of events) {
      switch (event.type) {
        case "ACCOUNT_OPENED": {
          accounts.set(event.accountId, {
            accountId: event.accountId,
            balanceUSD: event.initialDepositUSD,
            isFrozen: false,
            transactionCount: 1
          });
          break;
        }
        case "FUNDS_DEPOSITED": {
          const current = accounts.get(event.accountId);
          if (current) {
            accounts.set(event.accountId, {
              ...current,
              balanceUSD: current.balanceUSD + event.amountUSD,
              transactionCount: current.transactionCount + 1
            });
          }
          break;
        }
        case "FUNDS_WITHDRAWN": {
          const current = accounts.get(event.accountId);
          if (current) {
            accounts.set(event.accountId, {
              ...current,
              balanceUSD: current.balanceUSD - event.amountUSD,
              transactionCount: current.transactionCount + 1
            });
          }
          break;
        }
        case "ACCOUNT_FROZEN": {
          const current = accounts.get(event.accountId);
          if (current) {
            accounts.set(event.accountId, {
              ...current,
              isFrozen: true
            });
          }
          break;
        }
      }
    }

    return accounts;
  }
}

// Verification Harness
function runProjectionVerification() {
  const stream: DomainEvent[] = [
    { type: "ACCOUNT_OPENED", accountId: "acc_100", initialDepositUSD: 500, timestamp: 1000 },
    { type: "FUNDS_DEPOSITED", accountId: "acc_100", amountUSD: 250, txId: "tx_1", timestamp: 1001 },
    { type: "FUNDS_WITHDRAWN", accountId: "acc_100", amountUSD: 100, txId: "tx_2", timestamp: 1002 },
    { type: "ACCOUNT_FROZEN", accountId: "acc_100", reason: "Compliance audit", timestamp: 1003 }
  ];

  const projections = AccountProjectionEngine.project(stream);
  const account = projections.get("acc_100");

  assert.ok(account);
  assert.equal(account.balanceUSD, 650);
  assert.equal(account.isFrozen, true);
  assert.equal(account.transactionCount, 3);

  console.log("✅ Case Study (CQRS Event Sourcing Projection) Verified Successfully!");
}
runProjectionVerification();
```

---

## 🏋️ Section 17: 75 Graded Practice Drills Across 5 Tiers

### Tier 1: Foundations (Drills 1–15)
1. Write a conditional type `IsString<T>` that returns `true` if $T$ is `string` and `false` otherwise.
2. Implement a conditional type `IsNumber<T>`.
3. Create `IsArray<T>` using `T extends readonly unknown[]`.
4. Implement a custom `MyExclude<T, U>` and test it on a union of status codes.
5. Implement a custom `MyExtract<T, U>`.
6. Implement `MyNonNullable<T>`.
7. Write `UnwrapPromise<T>` using `infer U`.
8. Write `GetReturnType<T>` using `infer R`.
9. Write `GetFirstArg<T>` using `infer P`.
10. Demonstrate the difference between naked `T extends string` and `[T] extends [string]` with unions.
11. Write a type `IsNever<T>` that correctly evaluates to `true` when given `never`.
12. Create a type `UnwrapArray<T>` that returns the element type if $T$ is an array, or $T$ unchanged.
13. Implement `IsBoolean<T>` taking into account that `boolean` is `true | false`.
14. Write a conditional type that converts primitive literals to their boxed primitive names.
15. Demonstrate that `never` vanishes from unions (`string | never => string`).

### Tier 2: Intermediate (Drills 16–30)
16. Implement `Head<T>` to extract the first element of a tuple.
17. Implement `Tail<T>` to extract all elements except the first.
18. Implement `Last<T>` to extract the last element of a tuple.
19. Implement `Prepend<T, E>` to add an element to the start of a tuple.
20. Implement `Append<T, E>` to add an element to the end of a tuple.
21. Write `Reverse<T>` using the tail-call accumulator pattern.
22. Implement `FlattenOneLevel<T>` to flatten an array by one level.
23. Write `Split<S, Delimiter>` to split a string into a tuple of substrings.
24. Write `Join<T, Delimiter>` to join a tuple of strings with a delimiter.
25. Implement `TrimStart<S>` to remove leading whitespace.
26. Implement `TrimEnd<S>` to remove trailing whitespace.
27. Combine them into `Trim<S>`.
28. Write `ReplaceAll<S, From, To>` using recursive conditional types.
29. Implement `IsTuple<T>` to distinguish tuples from open arrays.
30. Write a type `StringLength<S>` that returns the compile-time character count.

### Tier 3: Advanced (Drills 31–45)
31. Implement the mathematical `UnionToIntersection<U>` type.
32. Prove that multiple contravariant `infer` positions produce an intersection.
33. Prove that multiple covariant `infer` positions produce a union.
34. Implement `DeepFlatten<T>` to recursively flatten arbitrarily nested arrays.
35. Implement `Paths<T>` to extract all dot-delimited key paths from an object.
36. Implement `Get<T, P>` to retrieve the value type at a dot-delimited path.
37. Implement `IsOptional<T, K>` using empty object assignability.
38. Implement `OptionalKeys<T>` to extract all optional property names.
39. Implement `RequiredKeys<T>` to extract all required property names.
40. Implement `IsReadonly<T, K>` using type equality.
41. Write a compile-time addition type `Add<A, B>` using tuple lengths.
42. Write a compile-time subtraction type `Sub<A, B>` using tuple lengths.
43. Write a compile-time multiplication type `Multiply<A, B>`.
44. Implement `Curry<Args, Return>` for curried function signatures.
45. Implement `ParseInt<S>` using TypeScript 4.7's `infer N extends number`.

### Tier 4: Expert & Edge Cases (Drills 46–60)
46. Implement `UnionToTuple<U>` using `UnionToIntersection` and overload peeling.
47. Implement `IsAny<T>` to accurately identify `any`.
48. Implement `IsUnknown<T>` distinguishing `unknown` from `any`.
49. Implement `IsUnion<T>` to detect union types.
50. Implement `KebabToCamel<S>`.
51. Implement `CamelToKebab<S>`.
52. Implement `StringIncludes<S, Search>`.
53. Implement `FilterTuple<T, Constraint>`.
54. Implement `Deduplicate<T>` for tuple types.
55. Implement `Zip<A, B>` to combine two tuples into pairs.
56. Implement `RepeatString<S, N>` to repeat a string literal $N$ times.
57. Implement `GreaterThan<A, B>` for numeric literals.
58. Implement `DeepNonNullable<T>`.
59. Implement `DeepMutable<T>`.
60. Implement `Cartesian<A, B>` for union types.

### Tier 5: System-Level & Framework Architecture (Drills 61–75)
61. Architect a Strongly Typed Route Matcher with parameter extraction (`/api/:version/users/:id`).
62. Build a Compile-Time SQL Query Parser that extracts selected columns from string literals.
63. Implement an Event Sourcing Projection Engine with compile-time exhaustiveness validation.
64. Architect a Type-Safe Deep Differ and Patch Applier for state trees.
65. Construct a Type-Level JSON Schema Validator.
66. Implement a Type-Safe ORM Query Builder supporting nested join paths.
67. Architect a Compile-Time State Machine transition table with forbidden transitions.
68. Build a Type-Safe Dependency Graph Cycle Detector.
69. Implement a Compile-Time Template Engine that extracts dynamic variable placeholders (`{{variable}}`).
70. Architect a GraphQL Response Selector matching query selection sets.
71. Construct a Type-Safe Redux Toolkit-style Slice Reducer.
72. Implement an RPC Client with automatic parameter and return type extraction from server interfaces.
73. Build a Type-Safe Microservices Event Bus with topic wildcard matching (`orders.*`).
74. Architect a High-Throughput Stream Pipeline with intermediate type refinement.
75. Implement a Compile-Time Markdown Frontmatter Parser and Validator.

---

## 🎓 Section 18: Key Takeaways & Masterclass Summary

1. **Turing-Completeness**: Conditional types (`T extends U ? X : Y`) enable compile-time branching and recursion, turning TypeScript into a functional metaprogramming language.
2. **Distribution Laws**:
   - Naked type parameters distribute over unions: $F(A \mid B) = F(A) \mid F(B)$.
   - Wrapping in tuples `[T] extends [U]` suppresses distribution, treating unions as atomic sets.
3. **The `never` Trap**: `never` has 0 members; distributive conditionals return `never`. Always use `[T] extends [never]`.
4. **Inference Positions**:
   - Covariant `infer` produces unions.
   - Contravariant `infer` produces intersections (`UnionToIntersection`).
5. **Tail-Call Optimization (TS 4.5+)**: Use the Accumulator pattern to evaluate recursive types up to 1,000 steps without compiler depth crashes.
6. **Production Invariant**: Use conditional types to automate reflection, eliminate runtime glue code, and guarantee single-source-of-truth type safety across system boundaries.
`;
};
