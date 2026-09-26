# Module TS-04: Mapped Types, Modifiers, & Type-Level Metaprogramming

> **Track**: TypeScript Production Engineering Masterclass (TS 5.x)  
> **Prerequisites**: [TS-00](file:///C:/Users/ayush/OneDrive/Desktop/js-learning/TS-00-QUEUE-AND-INDEX.md), [TS-01](file:///C:/Users/ayush/OneDrive/Desktop/js-learning/TS-01-TYPE-ARCHITECTURE-AND-STRUCTURAL-SUBTYPING.md), [TS-02](file:///C:/Users/ayush/OneDrive/Desktop/js-learning/TS-02-GENERICS-AND-TYPE-OPERATORS.md), [TS-03](file:///C:/Users/ayush/OneDrive/Desktop/js-learning/TS-03-CONDITIONAL-TYPES-AND-INFERENCE.md)  
> **Target Audience**: Principal Engineers, Framework Authors, Full-Stack Architects  
> **Universal Specification**: Complete Technical Treatise, 90 Real-World Interview Q&As with Runnable Code, 15 Prediction Puzzles with Step-by-Step Traces, 4 Complete Runnable Production Projects with Test Assertions, 20 DOs & DON'Ts, Real-World Enterprise Case Study, 75 Practice Drills (5 Tiers).

---

# Module TS-04: Mapped Types, Modifiers & Metaprogramming

> **Guiding Invariant**: Complete mastery requires zero gaps. In this module, we explore Type-Level Metaprogramming over object schemas: Homomorphic vs Non-Homomorphic Mapped Types, modifier algebra (`+readonly`, `-readonly`, `+?`, `-?`), Key Remapping via `as`, filtering with `never`, deep recursive immutability, and dynamic DTO transformation pipelines.

---

## 🏛️ Section 01: The Genesis of Mapped Types: DRY Principle at the Type Level

In enterprise codebases, domain models exist in multiple operational states:
1. **Creation DTO**: Optional identifiers, generated timestamps absent.
2. **Update DTO**: All fields optional (partial update / PATCH).
3. **Database Entity**: All fields required, strictly typed identifiers.
4. **Audit Snapshot**: All fields recursively immutable (`readonly`).

Without mapped types, engineers were forced to manually copy and synchronize 4 to 5 interface variants per entity. When an entity added a field, engineers frequently forgot to update secondary interfaces, causing silent runtime bugs.

Anders Hejlsberg introduced **Mapped Types** in TypeScript 2.1 to enable programmatic iteration over property keys:
```typescript
type Mapped<T> = {
  [K in keyof T]: T[K];
};
```
Just as `Array.prototype.map()` transforms every element of an array, a Mapped Type transforms every property of an object type according to a functional projection rule.

```
[ Input Object Type T ]
          |
    keyof T: "id" | "name" | "email"
          |
   Iterate [K in keyof T]
   Transform Value: T[K] -> NewType
          |
[ Output Transformed Object Type ]
```

---

## 📐 Section 02: Homomorphic vs Non-Homomorphic Mapped Types

The TypeScript compiler treats mapped types differently depending on whether they are **homomorphic** or **non-homomorphic**.

### 2.1 Homomorphic Mapped Types
A mapped type is **homomorphic** if it operates directly over a type variable of the form:
`[K in keyof T]` (or `[K in keyof T as ...]`).

#### Preserved Behaviors:
1. **Modifier Inheritance**: If property `x` was `readonly` or optional (`?`) in $T$, it remains `readonly` or optional in the mapped output (unless explicitly stripped with `-readonly` or `-?`).
2. **Array and Tuple Preservation**: If $T$ is a tuple (e.g. `[string, number]`), a homomorphic mapped type returns a new **tuple** with the same length, rather than collapsing into an object with numeric keys!

```typescript
type DoubleNumberValues<T> = {
  [K in keyof T]: T[K] extends number ? string : T[K];
};

type TupleIn = readonly [number, boolean];
type TupleOut = DoubleNumberValues<TupleIn>;
// Inferred as: readonly [string, boolean] (Array/Tuple structure & readonly preserved!)
```

### 2.2 Non-Homomorphic Mapped Types
A mapped type is **non-homomorphic** if it iterates over a type that is not a direct `keyof T` expression:
`[K in "id" | "name"]` or `[K in PropertyKey]`.

#### Behaviors:
1. **Modifier Stripping**: It does **not** inherit property modifiers (`readonly` or `?`) from any base type.
2. **Array Degradation**: Applying a non-homomorphic mapped type to an array produces an object dictionary, losing array and tuple mechanics.

```typescript
type RecordNonHomomorphic<Keys extends string, Val> = {
  [K in Keys]: Val;
};
```

---

## ➕ Section 03: Property Modifier Algebra: `+` and `-`

Mapped types support explicit additive (`+`) and subtractive (`-`) property modifiers for both `readonly` and optionality (`?`).

| Syntax | Formal Meaning | Standard Utility Equivalent |
|---|---|---|
| `+?` (or `?`) | Adds optional modifier to all properties | `Partial<T>` |
| `-?` | Removes optional modifier (forces required) | `Required<T>` |
| `+readonly` (or `readonly`) | Adds `readonly` modifier to all properties | `Readonly<T>` |
| `-readonly` | Removes `readonly` modifier (makes mutable) | `Mutable<T>` |

```typescript
// 1. Partial: Makes every property optional
type CustomPartial<T> = {
  [K in keyof T]+?: T[K];
};

// 2. Required: Strips optionality from every property
type CustomRequired<T> = {
  [K in keyof T]-?: T[K];
};

// 3. Readonly: Freezes every property at compile time
type CustomReadonly<T> = {
  +readonly [K in keyof T]: T[K];
};

// 4. Mutable: Unfreezes every property at compile time
type Mutable<T> = {
  -readonly [K in keyof T]: T[K];
};
```

---

## 🔀 Section 04: Key Remapping via `as` (TypeScript 4.1)

TypeScript 4.1 introduced the `as` clause in mapped types, allowing developers to:
1. Rename keys using template literal types.
2. Filter keys out of the object by remapping them to `never`.

### 4.1 Renaming Keys (Getter / Setter Generation)
```typescript
interface Person {
  name: string;
  age: number;
}

// Automatically synthesize a Getters interface:
type Getters<T> = {
  [K in keyof T as `get${Capitalize<string & K>}`]: () => T[K];
};

type PersonGetters = Getters<Person>;
// Inferred as:
// {
//   getName: () => string;
//   getAge: () => number;
// }
```

### 4.2 Filtering Keys with `as never`
When a key in an `as` clause evaluates to `never`, the compiler completely **drops** that property from the resulting object type:

```typescript
// Pick only properties whose values are strings:
type PickByString<T> = {
  [K in keyof T as T[K] extends string ? K : never]: T[K];
};

interface UserRecord {
  id: string;
  name: string;
  age: number;
  isActive: boolean;
}

type OnlyStringProps = PickByString<UserRecord>;
// Inferred as: { id: string; name: string }
```

---

## 🧊 Section 05: Deep Immutability & Deep Transformations

Standard utility types like `Readonly<T>` and `Partial<T>` are **shallow**; they do not transform nested objects.

### 5.1 DeepReadonly Implementation
```typescript
type DeepReadonly<T> = T extends Function | boolean | number | string | symbol | bigint | null | undefined
  ? T
  : T extends readonly (infer E)[]
  ? readonly DeepReadonly<E>[]
  : T extends Map<infer K, infer V>
  ? ReadonlyMap<DeepReadonly<K>, DeepReadonly<V>>
  : T extends Set<infer M>
  ? ReadonlySet<DeepReadonly<M>>
  : { readonly [K in keyof T]: DeepReadonly<T[K]> };
```

### 5.2 DeepPartial Implementation
```typescript
type DeepPartial<T> = T extends Function | boolean | number | string | symbol | bigint | null | undefined
  ? T
  : T extends readonly (infer E)[]
  ? readonly DeepPartial<E>[]
  : T extends object
  ? { [K in keyof T]?: DeepPartial<T[K]> }
  : T;
```


---

---

## 🚀 Section 06: Advanced Mapped Types: Promisification, Inversion & RPC Modeling

### 6.1 Automatic Promisification of Service Interfaces
In microservice architectures, synchronous service classes are frequently mirrored by asynchronous RPC clients. Mapped types allow creating the asynchronous interface automatically without code duplication:

```typescript
type PromisifyMethods<T> = {
  [K in keyof T]: T[K] extends (...args: infer Args) => infer Ret
    ? Ret extends Promise<any>
      ? T[K]
      : (...args: Args) => Promise<Ret>
    : T[K];
};

interface LocalCalculationService {
  computeTax(amount: number): number;
  getUserTier(userId: string): "gold" | "silver";
}

type RemoteRpcClient = PromisifyMethods<LocalCalculationService>;
// Inferred as:
// {
//   computeTax: (amount: number) => Promise<number>;
//   getUserTier: (userId: string) => Promise<"gold" | "silver">;
// }
```

### 6.2 Inverting Object Key-Value Pairs
Converting a lookup map `{ red: "ff0000", blue: "0000ff" }` into `{ ff0000: "red", "0000ff": "blue" }`:

```typescript
type InvertMap<T extends Record<PropertyKey, PropertyKey>> = {
  [K in keyof T as T[K]]: K;
};

const ColorCodes = {
  crimson: "#DC143C",
  azure: "#F0FFFF"
} as const;

type InvertedColors = InvertMap<typeof ColorCodes>;
// Inferred as:
// {
//   readonly "#DC143C": "crimson";
//   readonly "#F0FFFF": "azure";
// }
```

### 6.3 Mapping Event Handlers with Subscriptions
```typescript
interface DomainEvents {
  userRegistered: { userId: string; email: string };
  orderPlaced: { orderId: string; totalUSD: number };
}

type Subscriptions<Events> = {
  [K in keyof Events as `on${Capitalize<string & K>}`]: (
    handler: (payload: Events[K]) => void
  ) => () => void; // returns unsubscription lambda
};

type AppSubscriptions = Subscriptions<DomainEvents>;
// Inferred as:
// {
//   onUserRegistered: (handler: (payload: { userId: string; email: string }) => void) => () => void;
//   onOrderPlaced: (handler: (payload: { orderId: string; totalUSD: number }) => void) => () => void;
// }
```

---

## 🧩 Section 07: Syntax Deconstruction Boxes

### Syntax Box 1: The `string & K` Intersection Idiom
`PropertyKey` in TypeScript is a union of `string | number | symbol`.
String intrinsic utilities like `Capitalize<T>` only accept `string`. Passing an unconstrained `K` results in a compile error:
`Type 'symbol' is not assignable to type 'string'`.
Intersecting with string (`Capitalize<string & K>`) filters out symbols and numbers safely:
```typescript
type SafePrefix<T> = {
  [K in keyof T as `set_${string & K}`]: (val: T[K]) => void;
};
```

### Syntax Box 2: Homomorphic Tuple Mapping
When a homomorphic mapped type is passed a tuple, it preserves the tuple's exact structure, element names, and length:
```typescript
type BoxTuple<T extends readonly unknown[]> = {
  [K in keyof T]: { value: T[K] };
};

type Boxed = BoxTuple<[name: string, age: number]>;
// Inferred as: [name: { value: string }, age: { value: number }]
```
`;
};


---

---

## 💼 Section 08: Comprehensive Senior Engineering Interview Q&As (Part A: Questions 1–45)

### Q1: What is a Mapped Type in TypeScript, and how does it relate to the DRY (Don't Repeat Yourself) principle?
**Answer:**
A mapped type is a generic type that builds new object types by iterating over the property keys of another type using the syntax `[K in Keys]: ValueType`.
It adheres directly to the DRY principle by allowing developers to derive multiple domain DTOs (e.g., partial updates, readonly snapshots, validation schemas) programmatically from a single canonical entity definition, eliminating duplicate interface declarations.

```typescript
interface UserEntity {
  id: string;
  name: string;
  email: string;
}

// Programmatic derivation instead of duplicate code:
type UpdateUserDto = Partial<UserEntity>;
type ReadonlyUser = Readonly<UserEntity>;
```

---

### Q2: What is the formal difference between a Homomorphic and a Non-Homomorphic mapped type?
**Answer:**
- **Homomorphic Mapped Type**: Uses the exact syntax `[K in keyof T]` (or `[K in keyof T as ...]`). The compiler recognises that the keys belong directly to $T$. It **preserves property modifiers** (`readonly` and `?`) from $T$, and preserves array and tuple structures (including length and labels).
- **Non-Homomorphic Mapped Type**: Iterates over an independent type or union that is not syntactically a direct `keyof T` expression (e.g. `[K in string]` or `[K in Keys]`). It does not inherit property modifiers, and degrades tuples into generic indexed objects.

---

### Q3: How does the `-?` modifier work in `Required<T>`?
**Answer:**
The `-` prefix acts as a subtractive modifier. `-?` removes the optionality flag from each property, converting optional properties (`prop?: string`) into mandatory, required properties (`prop: string`).

```typescript
type CustomRequired<T> = {
  [K in keyof T]-?: T[K];
};

interface FormState {
  username?: string;
  password?: string;
}

type ValidatedForm = CustomRequired<FormState>;
// { username: string; password: string }
```

---

### Q4: How does the `-readonly` modifier work in a `Mutable<T>` utility?
**Answer:**
The `-readonly` modifier removes the compile-time immutability flag from all properties, allowing them to be reassigned.

```typescript
type Mutable<T> = {
  -readonly [K in keyof T]: T[K];
};

interface FrozenConfig {
  readonly host: string;
  readonly port: number;
}

type WritableConfig = Mutable<FrozenConfig>;
// { host: string; port: number }
```

---

### Q5: How does Key Remapping via `as` work in TypeScript 4.1+?
**Answer:**
The `as` clause in a mapped type allows re-binding the emitted key name to a new string, number, or symbol. It can rename the key using template literal string manipulations or drop the key entirely by remapping it to `never`.

```typescript
type EventEmitters<T> = {
  [K in keyof T as `emit${Capitalize<string & K>}`]: (val: T[K]) => void;
};
```

---

### Q6: Why is `string & K` commonly written inside template literal remapping (`as `on${Capitalize<string & K>}`)`?
**Answer:**
Because `keyof T` produces a union of `string | number | symbol`.
The built-in intrinsic string manipulators (`Capitalize`, `Lowercase`, `Uppercase`, `Uncapitalize`) only accept types that extend `string`.
Passing a raw `K` causes a compiler error because `symbol` cannot be capitalized. Intersecting with `string` (`string & K`) filters out symbols and numbers, ensuring strict type safety.

---

### Q7: How does filtering keys with `as never` work?
**Answer:**
When an object key in a mapped type evaluates to `never`, the TypeScript compiler omits that key completely from the generated type.
This allows implementing filters like `PickByType` or `OmitByType` in a single clean mapped expression:

```typescript
type PickByType<T, ValueType> = {
  [K in keyof T as T[K] extends ValueType ? K : never]: T[K];
};

interface Device {
  id: string;
  ip: string;
  port: number;
  isActive: boolean;
}

type StringOnly = PickByType<Device, string>; // { id: string; ip: string }
```

---

### Q8: How is the standard `Record<K, T>` implemented in TypeScript?
**Answer:**
```typescript
type CustomRecord<K extends keyof any, T> = {
  [P in K]: T;
};
```
Note that `keyof any` evaluates to `string | number | symbol`. Because it does not iterate over `keyof T`, `Record` is a **non-homomorphic** mapped type.

---

### Q9: How is the standard `Pick<T, K>` implemented?
**Answer:**
```typescript
type CustomPick<T, K extends keyof T> = {
  [P in K]: T[P];
};
```
`Pick` is a homomorphic mapped type because $K$ is constrained to `keyof T`, preserving modifiers.

---

### Q10: How is the standard `Omit<T, K>` implemented?
**Answer:**
```typescript
type CustomOmit<T, K extends keyof any> = Pick<T, Exclude<keyof T, K>>;
```
Or using modern TypeScript 4.1 key remapping directly:
```typescript
type CustomOmitModern<T, K extends keyof any> = {
  [P in keyof T as P extends K ? never : P]: T[P];
};
```

---

### Q11: Why does mapping a tuple type with a homomorphic mapped type produce another tuple rather than an object?
**Answer:**
The TypeScript compiler has special built-in handling for homomorphic mapped types (`[K in keyof T]`). When $T$ is an array or tuple, the compiler recognizes that the keys represent indexed sequence positions, and constructs a new array or tuple with matching length and attributes.

```typescript
type StringifyTuple<T> = {
  [K in keyof T]: string;
};

type T1 = StringifyTuple<[number, boolean]>;
// Inferred as: [string, string] (Tuple structure preserved!)
```

---

### Q12: How do you implement a `DeepReadonly<T>` type utility?
**Answer:**
Recursively traverse nested objects, arrays, Maps, and Sets while preserving primitives and functions:

```typescript
type DeepReadonly<T> = T extends Function | boolean | number | string | symbol | bigint | null | undefined
  ? T
  : T extends readonly (infer E)[]
  ? readonly DeepReadonly<E>[]
  : T extends Map<infer K, infer V>
  ? ReadonlyMap<DeepReadonly<K>, DeepReadonly<V>>
  : T extends Set<infer M>
  ? ReadonlySet<DeepReadonly<M>>
  : { readonly [K in keyof T]: DeepReadonly<T[K]> };
```

---

### Q13: How do you implement a `DeepPartial<T>` type utility?
**Answer:**
```typescript
type DeepPartial<T> = T extends Function | boolean | number | string | symbol | bigint | null | undefined
  ? T
  : T extends readonly (infer E)[]
  ? readonly DeepPartial<E>[]
  : T extends object
  ? { [K in keyof T]?: DeepPartial<T[K]> }
  : T;
```

---

### Q14: How do you implement a `DeepRequired<T>` type utility?
**Answer:**
```typescript
type DeepRequired<T> = T extends Function | boolean | number | string | symbol | bigint | null | undefined
  ? T
  : T extends readonly (infer E)[]
  ? readonly DeepRequired<E>[]
  : T extends object
  ? { [K in keyof T]-?: DeepRequired<T[K]> }
  : T;
```

---

### Q15: Can a mapped type declare methods using method syntax (`[K in keyof T](): void`)?
**Answer:**
**No.** Mapped types can only declare property signatures (`[K in keyof T]: ...`). They cannot declare method shorthand syntax. This is intentional, as property function signatures enforce strict contravariant parameter checking under `strictFunctionTypes`.

---

### Q16: How do you automatically generate a Getters and Setters interface from a state interface?
**Answer:**
```typescript
type Accessors<T> = {
  [K in keyof T as `get${Capitalize<string & K>}`]: () => T[K];
} & {
  [K in keyof T as `set${Capitalize<string & K>}`]: (val: T[K]) => void;
};

interface State { count: number; title: string; }
type StateAccessors = Accessors<State>;
// {
//   getCount: () => number;
//   getTitle: () => string;
//   setCount: (val: number) => void;
//   setTitle: (val: string) => void;
// }
```

---

### Q17: How do you extract only the mutable properties of an object?
**Answer:**
```typescript
type MutableKeys<T> = {
  [K in keyof T]-?: Equals<{ [P in K]: T[P] }, { readonly [P in K]: T[P] }> extends true
    ? never
    : K;
}[keyof T];

type PickMutable<T> = Pick<T, MutableKeys<T>>;
```

---

### Q18: How do you extract only the readonly properties of an object?
**Answer:**
```typescript
type ReadonlyKeys<T> = {
  [K in keyof T]-?: Equals<{ [P in K]: T[P] }, { readonly [P in K]: T[P] }> extends true
    ? K
    : never;
}[keyof T];

type PickReadonly<T> = Pick<T, ReadonlyKeys<T>>;
```

---

### Q19: How do you invert a key-value object map where values become keys?
**Answer:**
```typescript
type Invert<T extends Record<PropertyKey, PropertyKey>> = {
  [K in keyof T as T[K]]: K;
};
```

---

### Q20: What happens if two properties in an object have identical values when using `Invert<T>`?
**Answer:**
If multiple keys have identical values (e.g. `{ a: "val", b: "val" }`), the mapped type intersects the keys, creating a union of keys for that target key (`val: "a" | "b"`).

---

### Q21: How do you promisify all methods on an interface?
**Answer:**
```typescript
type AsyncMethods<T> = {
  [K in keyof T]: T[K] extends (...args: infer P) => infer R
    ? (...args: P) => Promise<Awaited<R>>
    : T[K];
};
```

---

### Q22: How do you prefix all property keys of an object with a namespace (`PrefixKeys<T, "user_">`)?
**Answer:**
```typescript
type PrefixKeys<T, Prefix extends string> = {
  [K in keyof T as `${Prefix}${string & K}`]: T[K];
};

interface Profile { id: string; email: string; }
type Prefixed = PrefixKeys<Profile, "user_">;
// { user_id: string; user_email: string }
```

---

### Q23: How do you suffix all property keys of an object (`SuffixKeys<T, "Id">`)?
**Answer:**
```typescript
type SuffixKeys<T, Suffix extends string> = {
  [K in keyof T as `${string & K}${Suffix}`]: T[K];
};
```

---

### Q24: How do you filter an object to only properties that are NOT functions?
**Answer:**
```typescript
type NonFunctionProperties<T> = {
  [K in keyof T as T[K] extends Function ? never : K]: T[K];
};
```

---

### Q25: How do you map an object type to an object containing boolean dirty flags for each property?
**Answer:**
```typescript
type DirtyFlags<T> = {
  [K in keyof T]: boolean;
};
```

---

### Q26: How do you map an object type to an object containing validation error arrays for each property?
**Answer:**
```typescript
type ValidationErrors<T> = {
  [K in keyof T]?: string[];
};
```

---

### Q27: How does TypeScript handle mapping over an empty object type (`{}`)?
**Answer:**
Since `keyof {}` evaluates to `never`, the mapped type evaluates to an empty object `{}`.

---

### Q28: How do you unwrap `Ref<T>` or `Observable<T>` wrappers across an entire object?
**Answer:**
```typescript
type UnwrapObservables<T> = {
  [K in keyof T]: T[K] extends { subscribe(fn: (val: infer V) => any): any } ? V : T[K];
};
```

---

### Q29: What is the difference between `[K in keyof T]: T[K]` and `Identity<T>`?
**Answer:**
`[K in keyof T]: T[K]` creates a clean, flat object type that flattens intersections (`A & B`), simplifying type tooltips in VS Code.

```typescript
type Prettify<T> = {
  [K in keyof T]: T[K];
} & {};
```

---

### Q30: How do you make specific keys optional while keeping all other keys required?
**Answer:**
Combine `Omit` and `Partial`:

```typescript
type MakeOptional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;
```

---

### Q31: How do you make specific keys required while keeping all other keys optional?
**Answer:**
```typescript
type MakeRequired<T, K extends keyof T> = Omit<T, K> & Required<Pick<T, K>>;
```

---

### Q32: How do you make specific keys readonly while keeping others mutable?
**Answer:**
```typescript
type MakeReadonly<T, K extends keyof T> = Omit<T, K> & Readonly<Pick<T, K>>;
```

---

### Q33: How do you map an object's values to getter functions?
**Answer:**
```typescript
type ValueToGetter<T> = {
  [K in keyof T]: () => T[K];
};
```

---

### Q34: What is the effect of mapping over a union of object types (`A | B`) with a mapped type?
**Answer:**
A mapped type is non-distributive over unions by default unless wrapped in a distributive conditional helper:

```typescript
// Distributive mapped type:
type DistributiveMapped<T> = T extends unknown
  ? { [K in keyof T]: T[K] }
  : never;
```

---

### Q35: How do you recursively strip `null` from all properties in an object?
**Answer:**
```typescript
type StripNull<T> = {
  [K in keyof T]: T[K] extends object ? StripNull<T[K]> : Exclude<T[K], null>;
};
```

---

### Q36: How do you transform property values based on their current type?
**Answer:**
Use conditional types inside the value position of the mapped type:

```typescript
type StringifyPrimitives<T> = {
  [K in keyof T]: T[K] extends number | boolean ? string : T[K];
};
```

---

### Q37: How do you map an interface to produce a JSON-serializable DTO?
**Answer:**
Strip all functions and Symbols:

```typescript
type JsonDto<T> = {
  [K in keyof T as T[K] extends Function | symbol ? never : K]: T[K];
};
```

---

### Q38: How do you generate an Event Payload mapping where every key `key` maps to `{ previous: T[K], current: T[K] }`?
**Answer:**
```typescript
type ChangePayloads<T> = {
  [K in keyof T as `on${Capitalize<string & K>}Changed`]: {
    previous: T[K];
    current: T[K];
  };
};
```

---

### Q39: Can mapped types add new properties that did not exist in the original type?
**Answer:**
Directly inside `[K in keyof T]`, you cannot add unrelated properties.
However, you can intersect the mapped type with additional properties:
`type Extended<T> = { [K in keyof T]: T[K] } & { timestamp: number };`

---

### Q40: How do you convert a tuple of keys into an object type with boolean values?
**Answer:**
```typescript
type TupleToObject<T extends readonly string[]> = {
  [K in T[number]]: boolean;
};

type Flags = TupleToObject<["isRead", "isWrite", "isAdmin"]>;
// { isRead: boolean; isWrite: boolean; isAdmin: boolean }
```

---

### Q41: How do you map an object's properties to reactive Signal wrappers?
**Answer:**
```typescript
interface Signal<T> {
  value: T;
}

type ToSignals<T> = {
  [K in keyof T]: Signal<T[K]>;
};
```

---

### Q42: What happens when `Readonly<T>` is applied to a class instance?
**Answer:**
All public properties are marked as `readonly`, but methods remain callable (method signatures are marked as readonly property functions).

---

### Q43: How do you remove an index signature from an object type while preserving explicit properties?
**Answer:**
Filter keys where `string extends K` or `number extends K`:

```typescript
type RemoveIndexSignature<T> = {
  [K in keyof T as string extends K ? never : number extends K ? never : K]: T[K];
};
```

---

### Q44: How do you create an exhaustive schema mapper that checks that a mapped object implements all keys of a model?
**Answer:**
Constrain the schema keys using `Record<keyof Model, SchemaValidator>`.

---

### Q45: What is the Golden Rule of Mapped Types?
**Answer:**
**"Use Homomorphic Mapped Types (`[K in keyof T]`) whenever possible to automatically preserve property modifiers and tuple structures, and use `as` key remapping with `never` for surgical key filtering."**
`;
};


---

---

## 💼 Section 09: Comprehensive Senior Engineering Interview Q&As (Part B: Questions 46–90)

### Q46: How do you recursively transform all snake_case property keys of an object into camelCase (`DeepCamelCase<T>`)?
**Answer:**
Combine recursive mapped types with key remapping and string template literal transformation:

```typescript
type SnakeToCamel<S extends string> =
  S extends `${infer Head}_${infer Tail}`
    ? `${Head}${Capitalize<SnakeToCamel<Tail>>}`
    : S;

type DeepCamelCase<T> = T extends Function | boolean | number | string | symbol | bigint | null | undefined
  ? T
  : T extends readonly (infer E)[]
  ? DeepCamelCase<E>[]
  : {
      [K in keyof T as SnakeToCamel<string & K>]: DeepCamelCase<T[K]>;
    };

interface DatabaseRow {
  user_id: string;
  first_name: string;
  account_details: {
    billing_address: string;
    zip_code: number;
  };
}

type CamelCased = DeepCamelCase<DatabaseRow>;
// {
//   userId: string;
//   firstName: string;
//   accountDetails: {
//     billingAddress: string;
//     zipCode: number;
//   };
// }
```

---

### Q47: How do you recursively transform all camelCase property keys into snake_case (`DeepSnakeCase<T>`)?
**Answer:**
```typescript
type CamelToSnake<S extends string> =
  S extends `${infer First}${infer Rest}`
    ? First extends Uppercase<First>
      ? `_${Lowercase<First>}${CamelToSnake<Rest>}`
      : `${First}${CamelToSnake<Rest>}`
    : S;

type DeepSnakeCase<T> = T extends Function | boolean | number | string | symbol | bigint | null | undefined
  ? T
  : T extends readonly (infer E)[]
  ? DeepSnakeCase<E>[]
  : {
      [K in keyof T as CamelToSnake<string & K>]: DeepSnakeCase<T[K]>;
    };
```

---

### Q48: How do you strip a specific prefix from all keys of an object?
**Answer:**
```typescript
type StripPrefix<T, Prefix extends string> = {
  [K in keyof T as K extends `${Prefix}${infer Rest}` ? Rest : K]: T[K];
};

interface StoredItem {
  meta_created: number;
  meta_author: string;
  data: string;
}

type Stripped = StripPrefix<StoredItem, "meta_">;
// { created: number; author: string; data: string }
```

---

### Q49: How do you strip a specific suffix from all keys of an object?
**Answer:**
```typescript
type StripSuffix<T, Suffix extends string> = {
  [K in keyof T as K extends `${infer Rest}${Suffix}` ? Rest : K]: T[K];
};

interface RawForm {
  nameField: string;
  ageField: number;
}

type CleanForm = StripSuffix<RawForm, "Field">;
// { name: string; age: number }
```

---

### Q50: How do you merge two object types where properties of the second type overwrite the first type?
**Answer:**
```typescript
type Merge<A, B> = Omit<A, keyof B> & B;

type T1 = { id: string; name: string };
type T2 = { name: number; age: number };

type Merged = Merge<T1, T2>;
// { id: string; name: number; age: number }
```

---

### Q51: How do you map an object type into a schema definition object where each property maps to a validator function?
**Answer:**
```typescript
type SchemaDefinition<T> = {
  [K in keyof T]: (val: unknown) => val is T[K];
};

interface User { name: string; age: number; }
type UserValidator = SchemaDefinition<User>;
// {
//   name: (val: unknown) => val is string;
//   age: (val: unknown) => val is number;
// }
```

---

### Q52: How do you extract keys whose values are strictly boolean?
**Answer:**
```typescript
type BooleanKeys<T> = {
  [K in keyof T]: T[K] extends boolean ? K : never;
}[keyof T];
```

---

### Q53: How do you extract keys whose values are strictly numbers?
**Answer:**
```typescript
type NumericKeys<T> = {
  [K in keyof T]: T[K] extends number ? K : never;
}[keyof T];
```

---

### Q54: How do you map an object type into a builder interface where every method accepts a value and returns `this`?
**Answer:**
```typescript
type BuilderInterface<T, BuilderInstance> = {
  [K in keyof T as `set${Capitalize<string & K>}`]: (value: T[K]) => BuilderInstance;
};
```

---

### Q55: How do you make all nested properties nullable (`DeepNullable<T>`)?
**Answer:**
```typescript
type DeepNullable<T> = T extends Function
  ? T
  : T extends object
  ? { [K in keyof T]: DeepNullable<T[K]> | null }
  : T | null;
```

---

### Q56: How do you extract the common keys present in both type $A$ and type $B$?
**Answer:**
```typescript
type CommonKeys<A, B> = Extract<keyof A, keyof B>;
```

---

### Q57: How do you extract the difference of keys between type $A$ and type $B$?
**Answer:**
```typescript
type DiffKeys<A, B> = Exclude<keyof A, keyof B>;
```

---

### Q58: How do you create an object type with exact keys from an array of string literals at runtime?
**Answer:**
```typescript
type FromStringArray<T extends readonly string[], Val> = {
  [K in T[number]]: Val;
};
```

---

### Q59: How do you create a type-safe Patch type where only changed properties are included?
**Answer:**
```typescript
type Patch<T> = {
  [K in keyof T]?: T[K];
};
```

---

### Q60: How do you create a type that requires at least one property of an object to be defined?
**Answer:**
Combine mapped types with union distribution:

```typescript
type RequireAtLeastOne<T, Keys extends keyof T = keyof T> =
  Keys extends keyof T
    ? Required<Pick<T, Keys>> & Partial<Omit<T, Keys>>
    : never;

interface Contact { email?: string; phone?: string; }
type ValidContact = RequireAtLeastOne<Contact>;
// Allows { email: "..." } or { phone: "..." } or both, but disallows {}!
```

---

### Q61: How do you create a type that enforces exactly one property of an object to be defined (XOR)?
**Answer:**
```typescript
type Without<T, U> = { [P in Exclude<keyof T, keyof U>]?: never };
type XOR<T, U> = (T | U) extends object ? (Without<T, U> & U) | (Without<U, T> & T) : T | U;
```

---

### Q62: How do you map an object type to an asynchronous loader map where every property is a loader Promise?
**Answer:**
```typescript
type AsyncLoaders<T> = {
  [K in keyof T]: () => Promise<T[K]>;
};
```

---

### Q63: How do you map an object type to a proxy traps handler?
**Answer:**
```typescript
type ProxyHandlers<T extends object> = {
  get?<K extends keyof T>(target: T, p: K, receiver: any): T[K];
  set?<K extends keyof T>(target: T, p: K, value: T[K], receiver: any): boolean;
};
```

---

### Q64: How do you strip all symbol properties from an object type?
**Answer:**
```typescript
type StripSymbols<T> = {
  [K in keyof T as K extends symbol ? never : K]: T[K];
};
```

---

### Q65: How do you keep only symbol properties from an object type?
**Answer:**
```typescript
type OnlySymbols<T> = {
  [K in keyof T as K extends symbol ? K : never]: T[K];
};
```

---

### Q66: How do you map an object type to an HTTP query parameter dictionary where all values are strings?
**Answer:**
```typescript
type QueryParams<T> = {
  [K in keyof T as T[K] extends Function ? never : K]?: string;
};
```

---

### Q67: How do you map an object to produce a ChangeEvent union where each variant has `{ property: K; oldValue: T[K]; newValue: T[K] }`?
**Answer:**
```typescript
type ChangeEvents<T> = {
  [K in keyof T]: {
    property: K;
    oldValue: T[K];
    newValue: T[K];
  };
}[keyof T];
```

---

### Q68: How do you map an object to a Form Field State object with `value`, `isValid`, and `isTouched`?
**Answer:**
```typescript
type FormFields<T> = {
  [K in keyof T]: {
    value: T[K];
    isValid: boolean;
    isTouched: boolean;
    errors: string[];
  };
};
```

---

### Q69: What is the compiler performance cost of recursive mapped types over deep objects?
**Answer:**
For every nested object, the compiler generates a new internal type symbol and type identity cache record. Deeply nested recursive mapped types applied over hundreds of files can significantly inflate memory usage and compilation times.
**Mitigation**: Restrict recursion depth using terminal depth guards or use shallow utility types where deep immutability is unnecessary.

---

### Q70: How do you make an object's properties `readonly` except for a specific whitelist of keys?
**Answer:**
```typescript
type ReadonlyExcept<T, K extends keyof T> = Readonly<Omit<T, K>> & Pick<T, K>;
```

---

### Q71: How do you make an object's properties optional except for a specific whitelist of required keys?
**Answer:**
```typescript
type OptionalExcept<T, K extends keyof T> = Partial<Omit<T, K>> & Required<Pick<T, K>>;
```

---

### Q72: How do you map an object's numeric properties to currency strings while preserving other fields?
**Answer:**
```typescript
type CurrencyFormatted<T> = {
  [K in keyof T]: T[K] extends number ? `$${string}` : T[K];
};
```

---

### Q73: How do you create an identity mapped type that forces TypeScript to simplify complex intersection types in hover tooltips?
**Answer:**
```typescript
type Simplify<T> = {
  [K in keyof T]: T[K];
} & {};
```

---

### Q74: How do you remove all readonly modifiers from a deeply nested object graph?
**Answer:**
```typescript
type DeepMutable<T> = T extends Function | boolean | number | string | symbol | bigint | null | undefined
  ? T
  : T extends readonly (infer E)[]
  ? DeepMutable<E>[]
  : { -readonly [K in keyof T]: DeepMutable<T[K]> };
```

---

### Q75: How do you map an interface to produce an audit diff record?
**Answer:**
```typescript
type AuditDiff<T> = {
  [K in keyof T]?: {
    before: T[K];
    after: T[K];
    updatedBy: string;
    updatedAt: number;
  };
};
```

---

### Q76: How do you convert a union of object types into a mapped object where each key corresponds to a variant?
**Answer:**
```typescript
type UnionToMap<U extends { type: string }> = {
  [E in U as E["type"]]: E;
};
```

---

### Q77: How do you map an object's properties to asynchronous resolver functions?
**Answer:**
```typescript
type Resolvers<T, Context> = {
  [K in keyof T]: (parent: T, args: Record<string, any>, context: Context) => Promise<T[K]> | T[K];
};
```

---

### Q78: How do you extract keys whose values match a union of types?
**Answer:**
```typescript
type KeysMatchingUnion<T, Allowed> = {
  [K in keyof T]: T[K] extends Allowed ? K : never;
}[keyof T];
```

---

### Q79: How do you map an object's properties into mock factory generators?
**Answer:**
```typescript
type MockFactories<T> = {
  [K in keyof T]: () => T[K];
};
```

---

### Q80: How do you map an object to support Redux action dispatches for each property update?
**Answer:**
```typescript
type ActionDispatchers<T> = {
  [K in keyof T as `update${Capitalize<string & K>}`]: (payload: T[K]) => {
    type: `UPDATE_${Uppercase<string & K>}`;
    payload: T[K];
  };
};
```

---

### Q81: How do you map an object to produce a snapshot comparison report?
**Answer:**
```typescript
type ComparisonReport<T> = {
  [K in keyof T]: {
    isEqual: boolean;
    source: T[K];
    target: T[K];
  };
};
```

---

### Q82: How do you enforce that a generic type must contain only serializable JSON values?
**Answer:**
```typescript
type JsonPrimitive = string | number | boolean | null;
type JsonCompatible<T> = {
  [K in keyof T]: T[K] extends JsonPrimitive | JsonPrimitive[] | Record<string, JsonPrimitive>
    ? T[K]
    : never;
};
```

---

### Q83: How do you map an object type into a schema for database table columns?
**Answer:**
```typescript
type ColumnDefinitions<T> = {
  [K in keyof T]: {
    columnName: string;
    type: T[K] extends string ? "VARCHAR" : T[K] extends number ? "INTEGER" : "TEXT";
    nullable: undefined extends T[K] ? true : false;
  };
};
```

---

### Q84: How do you generate an indexed access mapping where every property is wrapped in a getter/setter descriptor?
**Answer:**
```typescript
type PropertyDescriptors<T> = {
  [K in keyof T]: {
    get?(): T[K];
    set?(val: T[K]): void;
    enumerable?: boolean;
    configurable?: boolean;
  };
};
```

---

### Q85: How do you map an object's properties into telemetry metrics?
**Answer:**
```typescript
type TelemetryCounters<T> = {
  [K in keyof T as `metric_${string & K}_total`]: number;
};
```

---

### Q86: How do you strip all properties with `never` value types from an object?
**Answer:**
```typescript
type StripNever<T> = {
  [K in keyof T as [T[K]] extends [never] ? never : K]: T[K];
};
```

---

### Q87: How do you map an object type to an input mask configuration?
**Answer:**
```typescript
type InputMasks<T> = {
  [K in keyof T]?: RegExp | string;
};
```

---

### Q88: How do you map an object type to an Internationalization (i18n) translation dictionary?
**Answer:**
```typescript
type I18nKeys<T> = {
  [K in keyof T as `i18n_${string & K}`]: string;
};
```

---

### Q89: How do you map an object's properties into optimistic UI update rollback snapshots?
**Answer:**
```typescript
type RollbackStore<T> = {
  [K in keyof T]?: {
    rollbackValue: T[K];
    revertedAt: number;
  };
};
```

---

### Q90: What is the architectural power of Mapped Types in enterprise design systems?
**Answer:**
**"Mapped types allow an engineering organization to define a domain entity once, and automatically project it into Database Schemas, API Request Payloads, Response DTOs, State Store Lenses, and Form Validation Schemas with 100% mathematical fidelity and zero manual synchronization overhead."**
`;
};


---

## 4. Output Prediction Puzzles (15 Puzzles with Step-by-Step Traces)

Test your mental model of TypeScript's mapped type transformation engine, homomorphic rules, key remapping, and index signature resolution.

---

### Puzzle 1: Key Remapping Filtering to `never`

```typescript
type FilterStringProps<T> = {
  [K in keyof T as T[K] extends string ? K : never]: T[K];
};

interface UserProfile {
  id: number;
  name: string;
  bio: string | null;
  email: string;
}

type Result1 = FilterStringProps<UserProfile>;
// Question: What keys does Result1 contain?
```

**Step-by-Step Evaluation Trace:**
1. `keyof UserProfile` yields `'id' | 'name' | 'bio' | 'email'`.
2. TS iterates over each key `K`:
   - `K = 'id'`: `UserProfile['id']` is `number`. `number extends string` is false -> maps to `never`. In key remapping (`as`), mapping to `never` removes the key completely.
   - `K = 'name'`: `UserProfile['name']` is `string`. `string extends string` is true -> key `'name'` retained.
   - `K = 'bio'`: `UserProfile['bio']` is `string | null`. `(string | null) extends string` is false -> maps to `never`, key `'bio'` removed.
   - `K = 'email'`: `UserProfile['email']` is `string` -> key `'email'` retained.
3. **Output Type:** `{ name: string; email: string; }`.

---

### Puzzle 2: Homomorphic vs Non-Homomorphic Tuple Mapping

```typescript
type Homomorphic<T> = {
  [K in keyof T]: T[K];
};

type NonHomomorphic<T> = {
  [K in keyof T as K]: T[K];
};

type Arr = [string, number];

type R1 = Homomorphic<Arr>;
type R2 = NonHomomorphic<Arr>;
```

**Step-by-Step Evaluation Trace:**
1. In `Homomorphic<Arr>`, the syntax `[K in keyof T]` directly references `keyof T` without key remapping or boxing.
2. Homomorphic mapped types on tuples/arrays preserve the tuple structure! `Homomorphic<[string, number]>` produces `[string, number]`.
3. In `NonHomomorphic<Arr>`, the introduction of `as K` (key remapping) turns off homomorphic array preservation.
4. TypeScript treats `Arr` as an object whose keys include `"0"`, `"1"`, `"length"`, `"slice"`, `"map"`, etc.
5. **Output Types:**
   - `R1` = `[string, number]` (Tuple preserved).
   - `R2` = `{ 0: string; 1: number; length: 2; slice: ...; map: ...; ... }` (Plain object exposing all Array prototype members!).

---

### Puzzle 3: Modifier Stripping (`-readonly`, `-?`)

```typescript
interface ImmutableDraft {
  readonly id: number;
  readonly title?: string;
  readonly tags?: readonly string[];
}

type ConcreteMutable<T> = {
  -readonly [K in keyof T]-?: T[K];
};

type Result3 = ConcreteMutable<ImmutableDraft>;
```

**Step-by-Step Evaluation Trace:**
1. `-readonly` strips the `readonly` modifier from every key.
2. `-?` removes the optionality flag (`?`), making every property strictly required and stripping `undefined` if it was introduced solely by optionality.
3. For `title?: string`: `-?` converts it to `title: string`.
4. For `tags?: readonly string[]`: the outer property becomes mutable (`tags: readonly string[]`), but the inner array remains `readonly string[]` because mapping is shallow!
5. **Output Type:**
   ```typescript
   {
     id: number;
     title: string;
     tags: readonly string[];
   }
   ```

---

### Puzzle 4: Interface Call Signature Loss

```typescript
interface CallableService {
  (command: string): void;
  version: number;
  execute(task: string): boolean;
}

type IdentityMap<T> = {
  [K in keyof T]: T[K];
};

type Result4 = IdentityMap<CallableService>;
// Can Result4 be invoked as a function?
```

**Step-by-Step Evaluation Trace:**
1. `CallableService` has an object property `version`, a method `execute`, and a call signature `(command: string): void`.
2. `keyof CallableService` evaluates only to property names: `"version" | "execute"`. Call signatures and construct signatures do not have string, number, or symbol keys in `keyof`.
3. The mapped type iterates over `"version"` and `"execute"`.
4. The call signature `(command: string): void` is discarded during mapped type iteration.
5. **Output Type:** `{ version: number; execute: (task: string) => boolean; }`.
6. Invoking `Result4("test")` fails type checking with `TS2349: This expression is not callable`.

---

### Puzzle 5: Key Collision via Remapping

```typescript
type Collide<T> = {
  [K in keyof T as "fixed"]: T[K];
};

interface Target {
  a: string;
  b: number;
}

type Result5 = Collide<Target>;
```

**Step-by-Step Evaluation Trace:**
1. TypeScript iterates over keys `'a'` and `'b'`.
2. For `'a'`, the key is remapped to `'fixed'`, with value `string`.
3. For `'b'`, the key is remapped to `'fixed'`, with value `number`.
4. When two distinct keys map to the same literal key name during mapped type evaluation, TypeScript synthesizes their property types into an **intersection** (`A & B`).
5. `string & number` evaluates to `never`.
6. **Output Type:** `{ fixed: never; }`.

---

### Puzzle 6: Value Filtering on Heterogeneous Interfaces

```typescript
type MethodsOnly<T> = {
  [K in keyof T as T[K] extends (...args: any[]) => any ? K : never]: T[K];
};

class OrderService {
  id: string = "101";
  static timeout: number = 5000;
  computeTotal(tax: number): number { return tax * 1.2; }
  private secretKey: string = "sec_abc";
  cancel(): void {}
}

type Result6 = MethodsOnly<OrderService>;
```

**Step-by-Step Evaluation Trace:**
1. `keyof OrderService` inspects the instance type of `OrderService`, ignoring `static` members.
2. `keyof OrderService` in public type queries includes public instance properties and methods: `'id' | 'computeTotal' | 'cancel'`. (Private member `'secretKey'` is nominal and generally inaccessible in structural remappings or stripped).
3. `OrderService['id']` is `string` -> does not extend function -> maps to `never`.
4. `OrderService['computeTotal']` is function -> retained.
5. `OrderService['cancel']` is function -> retained.
6. **Output Type:** `{ computeTotal: (tax: number) => number; cancel: () => void; }`.

---

### Puzzle 7: Deep Readonly on Functions and Primitives

```typescript
type DeepReadonly<T> = T extends (...args: any[]) => any
  ? T
  : T extends object
  ? { readonly [K in keyof T]: DeepReadonly<T[K]> }
  : T;

interface ComplexStore {
  fetcher: (url: string) => Promise<string>;
  config: {
    retries: number;
    endpoints: string[];
  };
}

type Result7 = DeepReadonly<ComplexStore>;
```

**Step-by-Step Evaluation Trace:**
1. For `fetcher`: TS encounters `T extends (...args: any[]) => any`. The conditional is true, so it returns `T` untouched without attempting to map function properties.
2. For `config`: It is an object, so it maps keys recursively:
   - `readonly retries: number`
   - `readonly endpoints: readonly string[]` (homomorphic mapping on arrays).
3. **Output Type:**
   ```typescript
   {
     readonly fetcher: (url: string) => Promise<string>;
     readonly config: {
       readonly retries: number;
       readonly endpoints: readonly string[];
     };
   }
   ```

---

### Puzzle 8: Mapped Type over Union of Objects

```typescript
type MakeOptional<T> = {
  [K in keyof T]?: T[K];
};

type UnionState = { status: "success"; data: string } | { status: "error"; error: Error };

type Result8 = MakeOptional<UnionState>;
```

**Step-by-Step Evaluation Trace:**
1. Notice that `MakeOptional<T>` is NOT distributive because `T` is not a naked type parameter in a conditional type (`T extends any`). It is directly inside `keyof T`.
2. `keyof (A | B)` evaluates to the intersection of keys: `keyof A & keyof B`.
3. Key `'status'` exists on both; `'data'` and `'error'` exist on only one branch.
4. `keyof UnionState` = `'status'`.
5. `MakeOptional` evaluates only over `'status'`:
   `status?: ("success" | "error")`.
6. Notice that `'data'` and `'error'` are completely lost!
7. *Note:* To preserve unions, one must distribute first: `type DistributiveOptional<T> = T extends any ? MakeOptional<T> : never;`.

---

### Puzzle 9: As-Clause Template Literal Capitalization

```typescript
type Getters<T> = {
  [K in keyof T as K extends string ? `get${Capitalize<K>}` : never]: () => T[K];
};

interface Dimensions {
  width: number;
  height: number;
  [extra: number]: string;
}

type Result9 = Getters<Dimensions>;
```

**Step-by-Step Evaluation Trace:**
1. `keyof Dimensions` is `string | number` (specifically `"width" | "height" | number`).
2. TS evaluates `K`:
   - `K = "width"`: `K extends string` is true -> `Capitalize<"width">` is `"Width"` -> `get${"Width"}` is `"getWidth"`. Type: `() => number`.
   - `K = "height"`: `Capitalize<"height">` is `"Height"` -> `"getHeight"`. Type: `() => number`.
   - `K = number`: `number extends string` is false -> maps to `never`! The numeric index signature is filtered out.
3. **Output Type:** `{ getWidth: () => number; getHeight: () => number; }`.

---

### Puzzle 10: `Pick` vs `Omit` and Symbol Keys

```typescript
const secret = Symbol("secret");

interface SecuredConfig {
  [secret]: string;
  host: string;
  port: number;
}

type Picked = Pick<SecuredConfig, typeof secret | "host">;
type Omitted = Omit<SecuredConfig, "port">;
```

**Step-by-Step Evaluation Trace:**
1. `Pick<T, K>` is implemented as `{ [P in K]: T[P] }`.
   - `K` = `typeof secret | "host"`.
   - Mapped types support symbol keys since TS 2.7.
   - `Picked` = `{ [secret]: string; host: string; }`.
2. `Omit<T, K>` is implemented as `Pick<T, Exclude<keyof T, K>>`.
   - `keyof SecuredConfig` is `typeof secret | "host" | "port"`.
   - `Exclude<..., "port">` = `typeof secret | "host"`.
   - `Omitted` = `{ [secret]: string; host: string; }`.
3. Both properly retain symbol keys.

---

### Puzzle 11: Nested Path Traversal Extraction

```typescript
type PathValue<T, P extends string> =
  P extends `${infer Key}.${infer Rest}`
    ? Key extends keyof T
      ? PathValue<T[Key], Rest>
      : never
    : P extends keyof T
    ? T[P]
    : never;

interface DatabaseSchema {
  server: {
    connection: {
      poolSize: number;
      host: string;
    };
  };
}

type R11_A = PathValue<DatabaseSchema, "server.connection.poolSize">;
type R11_B = PathValue<DatabaseSchema, "server.invalid.poolSize">;
```

**Step-by-Step Evaluation Trace:**
1. For `R11_A`:
   - Step 1: `server.connection.poolSize` matches `Key = "server"`, `Rest = "connection.poolSize"`. `server` is key of `DatabaseSchema`. Next: `PathValue<DatabaseSchema["server"], "connection.poolSize">`.
   - Step 2: `connection.poolSize` matches `Key = "connection"`, `Rest = "poolSize"`. `connection` is key of `server`. Next: `PathValue<DatabaseSchema["server"]["connection"], "poolSize">`.
   - Step 3: `"poolSize"` has no `.`, falls through to `P extends keyof T` -> returns `number`.
2. For `R11_B`:
   - Step 1: `server` matches.
   - Step 2: `invalid` is NOT a key of `DatabaseSchema["server"]` -> returns `never`.
3. **Output Types:** `R11_A = number`, `R11_B = never`.

---

### Puzzle 12: `Record<string, unknown>` vs `{ [k: string]: unknown }` vs Homomorphic Mapping

```typescript
type Input = {
  a?: string;
  readonly b: number;
};

type WrapRecord<T> = Record<keyof T, string>;
type WrapHomomorphic<T> = { [K in keyof T]: string };

type TestRecord = WrapRecord<Input>;
type TestHomomorphic = WrapHomomorphic<Input>;
```

**Step-by-Step Evaluation Trace:**
1. `WrapRecord<T>` expands to `{ [P in keyof T]: string }`.
2. Wait! Why does `Record` not preserve modifiers?
   - In TS, `Record<K, T>` is defined as `type Record<K extends keyof any, T> = { [P in K]: T; }`.
   - Because `K` is an arbitrary type parameter (`keyof any`), it is considered a **non-homomorphic** mapped type!
   - Therefore, modifiers (`readonly`, `?`) from `Input` are **discarded**!
3. In `WrapHomomorphic<T>`, `[K in keyof T]` directly references `keyof T` where `T` is the target type parameter.
   - It is homomorphic, meaning it **copies** the `readonly` and `?` modifiers from `Input`.
4. **Output Types:**
   - `TestRecord` = `{ a: string; b: string; }` (Both required, both mutable).
   - `TestHomomorphic` = `{ a?: string; readonly b: string; }` (Optional and readonly flags preserved).

---

### Puzzle 13: Optionality vs Undefined in Key Extraction

```typescript
interface Sample {
  a?: string;
  b: string | undefined;
}

type RequiredKeys<T> = {
  [K in keyof T]-?: {} extends Pick<T, K> ? never : K;
}[keyof T];

type Result13 = RequiredKeys<Sample>;
```

**Step-by-Step Evaluation Trace:**
1. For property `a?: string`:
   - `Pick<Sample, 'a'>` is `{ a?: string }`.
   - Is `{}` assignable to `{ a?: string }`? Yes! Because `a` is optional, an empty object `{}` satisfies `{ a?: string }`.
   - `{} extends Pick<Sample, 'a'>` is true -> resolves to `never`.
2. For property `b: string | undefined`:
   - `Pick<Sample, 'b'>` is `{ b: string | undefined }`.
   - Is `{}` assignable to `{ b: string | undefined }`? No! Property `b` is required, even though its value may be `undefined`.
   - `{} extends Pick<Sample, 'b'>` is false -> resolves to `'b'`.
3. Union across all keys: `never | 'b' = 'b'`.
4. **Output Type:** `'b'`.

---

### Puzzle 14: Mutable Deep Partial on Readonly Arrays

```typescript
type DeepPartial<T> = T extends Function
  ? T
  : T extends Array<infer U>
  ? _DeepPartialArray<U>
  : T extends object
  ? { [K in keyof T]?: DeepPartial<T[K]> }
  : T;

interface _DeepPartialArray<U> extends Array<DeepPartial<U>> {}

interface State {
  readonly items: readonly string[];
}

type Result14 = DeepPartial<State>;
```

**Step-by-Step Evaluation Trace:**
1. `State` is an object. Its key `items` is evaluated.
2. `items` has type `readonly string[]` (`ReadonlyArray<string>`).
3. Does `ReadonlyArray<string>` extend `Array<infer U>`?
   - In TypeScript, `Array<T>` is mutable (has `push`, `pop`, etc.), whereas `ReadonlyArray<T>` lacks mutating methods.
   - Contravariance / structural check: A readonly array is NOT assignable to a mutable `Array`!
   - `readonly string[] extends Array<infer U>` is FALSE!
4. It falls through to `T extends object`!
5. Mapping over `ReadonlyArray<string>` as an object maps all array prototype methods (`slice`, `concat`, etc.) as optional properties!
6. **Lesson:** Always check `T extends readonly (infer U)[]` or `T extends ReadonlyArray<infer U>` to correctly intercept readonly arrays!

---

### Puzzle 15: Exact/Strict Keys Mapped Filter

```typescript
type DisallowUnknownKeys<Actual, Expected> = {
  [K in keyof Actual]: K extends keyof Expected ? Actual[K] : never;
};

type Validate<Actual, Expected> =
  keyof Actual extends keyof Expected ? Actual : DisallowUnknownKeys<Actual, Expected>;

interface ExpectedConfig {
  port: number;
  host: string;
}

function configure<T extends ExpectedConfig>(config: Validate<T, ExpectedConfig>): T {
  return config as T;
}

// Case A: configure({ port: 8080, host: "localhost" });
// Case B: configure({ port: 8080, host: "localhost", extra: 123 });
```

**Step-by-Step Evaluation Trace:**
1. In Case A:
   - `Actual` keys: `'port' | 'host'`.
   - `'port' | 'host' extends keyof ExpectedConfig` is true.
   - `Validate` resolves to `T`. Validates cleanly without error.
2. In Case B:
   - `Actual` keys: `'port' | 'host' | 'extra'`.
   - `'port' | 'host' | 'extra' extends 'port' | 'host'` is false!
   - `Validate` resolves to `DisallowUnknownKeys<T, ExpectedConfig>`.
   - For `'extra'`: `'extra' extends 'port' | 'host'` is false -> maps to `never`.
   - The argument must satisfy `{ port: number; host: string; extra: never }`.
   - Passing `extra: 123` fails because `number` is not assignable to `never`!
3. **Result:** Produces a compile-time excess property rejection even when type parameters are inferred!


---

## 5. Four Complete Runnable Production Projects with Test Assertions

Every project below is a fully functional, self-contained TypeScript engine demonstrating production metaprogramming patterns. All class properties are explicitly declared for strict Node.js compatibility (`--experimental-strip-types`).

---

### Project 1: Enterprise Deep Immutable State & RFC 6902 JSON Patch Engine

#### Architectural Overview
```
+-------------------------------------------------------------------------+
|                  Deep Immutable State & Patch Engine                   |
+-------------------------------------------------------------------------+
|  [Source State: T]                                                      |
|         │                                                               |
|         ▼                                                               |
|  [DeepImmutableProxy<T>] ──► Enforces DeepReadonly at compile time      |
|         │                                                               |
|         ▼                                                               |
|  [JsonPatchEngine]                                                      |
|    ├── generateDiff(prev, next): PatchOperation[]                       |
|    └── applyPatches(target, patches): DeepReadonly<T>                   |
|         │                                                               |
|         ▼                                                               |
|  [Type-Safe Path Accessor] ──► Mapped Path Traversal & Compile Validity |
+-------------------------------------------------------------------------+
```

#### Complete Implementation & Verification Suite
```typescript
import assert from "node:assert";

// Type Metaprogramming Definitions
export type Primitive = string | number | boolean | bigint | symbol | null | undefined;

export type DeepReadonly<T> = T extends Primitive | ((...args: any[]) => any)
  ? T
  : T extends ReadonlyArray<infer U>
  ? ReadonlyArray<DeepReadonly<U>>
  : T extends Map<infer K, infer V>
  ? ReadonlyMap<DeepReadonly<K>, DeepReadonly<V>>
  : T extends Set<infer M>
  ? ReadonlySet<DeepReadonly<M>>
  : { readonly [K in keyof T]: DeepReadonly<T[K]> };

export type DeepPartial<T> = T extends Primitive | ((...args: any[]) => any)
  ? T
  : T extends ReadonlyArray<infer U>
  ? ReadonlyArray<DeepPartial<U>>
  : { [K in keyof T]?: DeepPartial<T[K]> };

export type JsonPatchOp = "add" | "remove" | "replace";

export interface PatchOperation {
  op: JsonPatchOp;
  path: string;
  value?: any;
}

export class StatePatchEngine<T extends Record<string, any>> {
  private currentState: DeepReadonly<T>;

  constructor(initialState: T) {
    this.currentState = this.deepFreeze(this.cloneDeep(initialState)) as DeepReadonly<T>;
  }

  public getState(): DeepReadonly<T> {
    return this.currentState;
  }

  public update(updater: (draft: T) => void): PatchOperation[] {
    const mutableClone = this.cloneDeep(this.currentState as T);
    updater(mutableClone);
    const patches = this.computeDiff(this.currentState, mutableClone, "");
    this.currentState = this.deepFreeze(mutableClone) as DeepReadonly<T>;
    return patches;
  }

  public applyPatch(patches: PatchOperation[]): void {
    const target = this.cloneDeep(this.currentState as T);
    for (const patch of patches) {
      const segments = patch.path.split("/").filter((s) => s.length > 0);
      let curr: any = target;
      for (let i = 0; i < segments.length - 1; i++) {
        curr = curr[segments[i]];
      }
      const finalKey = segments[segments.length - 1];

      if (patch.op === "replace" || patch.op === "add") {
        curr[finalKey] = patch.value;
      } else if (patch.op === "remove") {
        if (Array.isArray(curr)) {
          curr.splice(Number(finalKey), 1);
        } else {
          delete curr[finalKey];
        }
      }
    }
    this.currentState = this.deepFreeze(target) as DeepReadonly<T>;
  }

  private computeDiff(prev: any, next: any, currentPath: string): PatchOperation[] {
    const patches: PatchOperation[] = [];

    if (prev === next) return patches;

    if (
      typeof prev !== "object" ||
      prev === null ||
      typeof next !== "object" ||
      next === null
    ) {
      patches.push({ op: "replace", path: currentPath, value: next });
      return patches;
    }

    const prevKeys = new Set(Object.keys(prev));
    const nextKeys = new Set(Object.keys(next));

    // Find removed keys
    for (const key of prevKeys) {
      if (!nextKeys.has(key)) {
        patches.push({ op: "remove", path: `${currentPath}/${key}` });
      }
    }

    // Find added or modified keys
    for (const key of nextKeys) {
      const childPath = `${currentPath}/${key}`;
      if (!prevKeys.has(key)) {
        patches.push({ op: "add", path: childPath, value: next[key] });
      } else {
        const subPatches = this.computeDiff(prev[key], next[key], childPath);
        patches.push(...subPatches);
      }
    }

    return patches;
  }

  private deepFreeze<U>(obj: U): U {
    if (obj === null || typeof obj !== "object") return obj;
    Object.freeze(obj);
    for (const key of Object.getOwnPropertyNames(obj)) {
      const val = (obj as any)[key];
      if (val !== null && typeof val === "object" && !Object.isFrozen(val)) {
        this.deepFreeze(val);
      }
    }
    return obj;
  }

  private cloneDeep<U>(obj: U): U {
    return structuredClone(obj);
  }
}

// Verification Assertions
interface ApplicationState {
  version: number;
  user: {
    id: string;
    profile: {
      displayName: string;
      roles: string[];
    };
  };
  settings: {
    theme: "light" | "dark";
    notifications: boolean;
  };
}

const initialState: ApplicationState = {
  version: 1,
  user: {
    id: "usr_99",
    profile: {
      displayName: "Alice",
      roles: ["admin", "engineer"],
    },
  },
  settings: {
    theme: "dark",
    notifications: true,
  },
};

const store = new StatePatchEngine<ApplicationState>(initialState);

// Verify immutability at runtime
const state1 = store.getState();
assert.strictEqual(state1.user.profile.displayName, "Alice");
assert.throws(() => {
  (state1.user.profile as any).displayName = "Bob";
}, /TypeError: Cannot assign to read only property/);

// Update via mutation draft and capture patches
const patches = store.update((draft) => {
  draft.version = 2;
  draft.user.profile.displayName = "Alice Smith";
  draft.settings.theme = "light";
});

assert.strictEqual(patches.length, 3);
assert.deepStrictEqual(patches, [
  { op: "replace", path: "/version", value: 2 },
  { op: "replace", path: "/user/profile/displayName", value: "Alice Smith" },
  { op: "replace", path: "/settings/theme", value: "light" },
]);

const state2 = store.getState();
assert.strictEqual(state2.version, 2);
assert.strictEqual(state2.user.profile.displayName, "Alice Smith");
assert.strictEqual(state2.settings.theme, "light");

// Rollback via applyPatch
store.applyPatch([
  { op: "replace", path: "/version", value: 1 },
  { op: "replace", path: "/user/profile/displayName", value: "Alice" },
]);
assert.strictEqual(store.getState().version, 1);
assert.strictEqual(store.getState().user.profile.displayName, "Alice");

console.log("Project 1 (Deep State & Patch Engine) passed all assertions.");
```

---

### Project 2: Type-Safe ORM Query Builder & Data Projection Mapper

#### Architectural Overview
```
+-------------------------------------------------------------------------+
|                  Type-Safe Data Mapper & Projection Query               |
+-------------------------------------------------------------------------+
|  Entity Schema: T                                                       |
|         │                                                               |
|  [QueryBuilder<T, SelectedKeys>]                                        |
|    ├── select(...keys: K[]): QueryBuilder<T, K>                          |
|    ├── where<K extends keyof T>(key: K, op: Operator, val: T[K])        |
|    ├── orderBy(key: keyof T, dir: 'ASC' | 'DESC')                       |
|    └── execute(dataSource: T[]): Pick<T, SelectedKeys>[]                |
+-------------------------------------------------------------------------+
```

#### Complete Implementation & Verification Suite
```typescript
import assert from "node:assert";

export type ComparisonOperator = "eq" | "neq" | "gt" | "lt" | "contains";

export interface WhereClause<T> {
  key: keyof T;
  op: ComparisonOperator;
  value: any;
}

export type OrderDirection = "ASC" | "DESC";

export interface OrderClause<T> {
  key: keyof T;
  direction: OrderDirection;
}

// Metaprogramming Projections
export type ModelProjection<T, K extends keyof T> = {
  [P in K]: T[P];
};

export class TypeSafeQueryBuilder<T extends Record<string, any>, SelectedKeys extends keyof T = keyof T> {
  private selectedKeys: (keyof T)[];
  private whereClauses: WhereClause<T>[];
  private orderClauses: OrderClause<T>[];

  constructor(selectedKeys?: (keyof T)[]) {
    this.selectedKeys = selectedKeys ?? [];
    this.whereClauses = [];
    this.orderClauses = [];
  }

  public select<K extends keyof T>(...keys: K[]): TypeSafeQueryBuilder<T, K> {
    const builder = new TypeSafeQueryBuilder<T, K>(keys);
    builder.whereClauses = [...this.whereClauses];
    builder.orderClauses = [...this.orderClauses];
    return builder;
  }

  public where<K extends keyof T>(
    key: K,
    op: ComparisonOperator,
    value: T[K]
  ): this {
    this.whereClauses.push({ key, op, value });
    return this;
  }

  public orderBy(key: keyof T, direction: OrderDirection = "ASC"): this {
    this.orderClauses.push({ key, direction });
    return this;
  }

  public execute(dataset: T[]): ModelProjection<T, SelectedKeys>[] {
    let result = [...dataset];

    // Filter
    for (const clause of this.whereClauses) {
      result = result.filter((row) => {
        const fieldVal = row[clause.key];
        switch (clause.op) {
          case "eq":
            return fieldVal === clause.value;
          case "neq":
            return fieldVal !== clause.value;
          case "gt":
            return fieldVal > clause.value;
          case "lt":
            return fieldVal < clause.value;
          case "contains":
            return typeof fieldVal === "string" && fieldVal.includes(clause.value);
          default:
            return true;
        }
      });
    }

    // Sort
    for (const order of this.orderClauses) {
      result.sort((a, b) => {
        const valA = a[order.key];
        const valB = b[order.key];
        if (valA < valB) return order.direction === "ASC" ? -1 : 1;
        if (valA > valB) return order.direction === "ASC" ? 1 : -1;
        return 0;
      });
    }

    // Project keys
    if (this.selectedKeys.length === 0) {
      return result as ModelProjection<T, SelectedKeys>[];
    }

    return result.map((row) => {
      const projection: any = {};
      for (const key of this.selectedKeys) {
        projection[key] = row[key];
      }
      return projection as ModelProjection<T, SelectedKeys>;
    });
  }
}

// Verification Assertions
interface ProductEntity {
  id: number;
  sku: string;
  name: string;
  price: number;
  inStock: boolean;
  category: "hardware" | "software" | "cloud";
}

const mockProducts: ProductEntity[] = [
  { id: 1, sku: "HW-001", name: "Mechanical Keyboard", price: 150, inStock: true, category: "hardware" },
  { id: 2, sku: "SW-101", name: "IDE Professional", price: 200, inStock: true, category: "software" },
  { id: 3, sku: "HW-002", name: "4K Monitor", price: 600, inStock: false, category: "hardware" },
  { id: 4, sku: "CL-500", name: "Compute Node", price: 80, inStock: true, category: "cloud" },
];

const query = new TypeSafeQueryBuilder<ProductEntity>()
  .select("id", "name", "price")
  .where("inStock", "eq", true)
  .where("price", "gt", 100)
  .orderBy("price", "DESC");

const results = query.execute(mockProducts);

assert.strictEqual(results.length, 2);
assert.deepStrictEqual(results[0], { id: 2, name: "IDE Professional", price: 200 });
assert.deepStrictEqual(results[1], { id: 1, name: "Mechanical Keyboard", price: 150 });

// Verify that non-selected properties are absent from projected output
assert.strictEqual((results[0] as any).sku, undefined);
assert.strictEqual((results[0] as any).inStock, undefined);

console.log("Project 2 (Type-Safe ORM Query Builder) passed all assertions.");
```

---

### Project 3: Dynamic Form Controller & Schema Validation Pipeline

#### Architectural Overview
```
+-------------------------------------------------------------------------+
|                  Type-Safe Dynamic Form Controller                      |
+-------------------------------------------------------------------------+
|  Model Schema: T                                                        |
|         │                                                               |
|  [FormState<T>]                                                         |
|    ├── values: T                                                        |
|    ├── errors: { [K in keyof T]?: string[] }                            |
|    ├── touched: { [K in keyof T]?: boolean }                            |
|    └── dirty: { [K in keyof T]?: boolean }                              |
|         │                                                               |
|  [ValidationRules<T>]                                                   |
|    └── { [K in keyof T]?: ValidatorFn<T[K]>[] }                         |
|         │                                                               |
|  [FormController<T>] ──► setFieldValue(), validateField(), submit()    |
+-------------------------------------------------------------------------+
```

#### Complete Implementation & Verification Suite
```typescript
import assert from "node:assert";

export type FormErrors<T> = {
  [K in keyof T]?: string[];
};

export type FormTouched<T> = {
  [K in keyof T]?: boolean;
};

export type FormDirty<T> = {
  [K in keyof T]?: boolean;
};

export type FieldValidator<V> = (val: V) => string | null;

export type FormValidationSchema<T> = {
  [K in keyof T]?: FieldValidator<T[K]>[];
};

export class FormController<T extends Record<string, any>> {
  private initialValues: T;
  private currentValues: T;
  private errors: FormErrors<T>;
  private touched: FormTouched<T>;
  private dirty: FormDirty<T>;
  private validators: FormValidationSchema<T>;

  constructor(initialValues: T, validators?: FormValidationSchema<T>) {
    this.initialValues = { ...initialValues };
    this.currentValues = { ...initialValues };
    this.errors = {};
    this.touched = {};
    this.dirty = {};
    this.validators = validators ?? {};
  }

  public getValues(): Readonly<T> {
    return this.currentValues;
  }

  public getErrors(): FormErrors<T> {
    return this.errors;
  }

  public isFieldTouched<K extends keyof T>(field: K): boolean {
    return !!this.touched[field];
  }

  public isFieldDirty<K extends keyof T>(field: K): boolean {
    return !!this.dirty[field];
  }

  public setFieldValue<K extends keyof T>(field: K, value: T[K]): void {
    this.currentValues[field] = value;
    this.touched[field] = true;
    this.dirty[field] = this.currentValues[field] !== this.initialValues[field];
    this.validateField(field);
  }

  public validateField<K extends keyof T>(field: K): boolean {
    const rules = this.validators[field];
    if (!rules || rules.length === 0) {
      delete this.errors[field];
      return true;
    }

    const fieldErrors: string[] = [];
    const val = this.currentValues[field];
    for (const rule of rules) {
      const err = rule(val);
      if (err) fieldErrors.push(err);
    }

    if (fieldErrors.length > 0) {
      this.errors[field] = fieldErrors;
      return false;
    } else {
      delete this.errors[field];
      return true;
    }
  }

  public validateAll(): boolean {
    let isValid = true;
    for (const key of Object.keys(this.currentValues) as (keyof T)[]) {
      const fieldValid = this.validateField(key);
      if (!fieldValid) isValid = false;
    }
    return isValid;
  }

  public reset(): void {
    this.currentValues = { ...this.initialValues };
    this.errors = {};
    this.touched = {};
    this.dirty = {};
  }
}

// Verification Assertions
interface SignupFormData {
  username: string;
  email: string;
  age: number;
}

const form = new FormController<SignupFormData>(
  { username: "", email: "", age: 18 },
  {
    username: [
      (v) => (v.length < 3 ? "Username must be at least 3 chars" : null),
      (v) => (/\s/.test(v) ? "Username cannot contain spaces" : null),
    ],
    email: [
      (v) => (!v.includes("@") ? "Must be a valid email" : null),
    ],
    age: [
      (v) => (v < 18 ? "Must be at least 18 years old" : null),
    ],
  }
);

assert.strictEqual(form.isFieldTouched("username"), false);
assert.strictEqual(form.isFieldDirty("username"), false);

// Mutate username with invalid value
form.setFieldValue("username", "al");
assert.strictEqual(form.isFieldTouched("username"), true);
assert.strictEqual(form.isFieldDirty("username"), true);
assert.deepStrictEqual(form.getErrors().username, ["Username must be at least 3 chars"]);

// Provide valid username
form.setFieldValue("username", "alice");
assert.strictEqual(form.getErrors().username, undefined);

// Validate all fields
const isValid = form.validateAll();
assert.strictEqual(isValid, false);
assert.deepStrictEqual(form.getErrors().email, ["Must be a valid email"]);

// Fill remaining valid fields
form.setFieldValue("email", "alice@example.com");
assert.strictEqual(form.validateAll(), true);
assert.strictEqual(Object.keys(form.getErrors()).length, 0);

console.log("Project 3 (Dynamic Form Controller) passed all assertions.");
```

---

### Project 4: Enterprise CQRS Event Bus & Remapped Handler Hub

#### Architectural Overview
```
+-------------------------------------------------------------------------+
|                  Enterprise CQRS Event Bus & Handler Hub                |
+-------------------------------------------------------------------------+
|  Domain Events Map: EventType -> Payload                                 |
|         │                                                               |
|  [Key Remapping Metaprogramming]                                        |
|    └── { [K in keyof Events as `on${Capitalize<K>}`]: HandlerFn<Events[K]> }
|         │                                                               |
|  [TypedEventHub<Events>]                                                |
|    ├── emit<K extends keyof Events>(event: K, payload: Events[K])       |
|    ├── subscribe<K extends keyof Events>(event: K, handler)             |
|    └── registerAggregate(handlerObject: RemappedHandlerHub<Events>)    |
+-------------------------------------------------------------------------+
```

#### Complete Implementation & Verification Suite
```typescript
import assert from "node:assert";

export type DomainEvents = Record<string, any>;

export type EventHandler<Payload> = (payload: Payload) => void | Promise<void>;

// Remapped Event Handler Signature
export type RemappedHandlerHub<Events extends DomainEvents> = {
  [K in keyof Events as K extends string ? `on${Capitalize<K>}` : never]?: EventHandler<Events[K]>;
};

export class TypedEventHub<Events extends DomainEvents> {
  private listeners: {
    [K in keyof Events]?: EventHandler<Events[K]>[];
  };
  private executionLog: { event: keyof Events; payload: any; timestamp: number }[];

  constructor() {
    this.listeners = {};
    this.executionLog = [];
  }

  public subscribe<K extends keyof Events>(
    event: K,
    handler: EventHandler<Events[K]>
  ): () => void {
    if (!this.listeners[event]) {
      this.listeners[event] = [];
    }
    this.listeners[event]!.push(handler);

    // Unsubscribe closure
    return () => {
      this.listeners[event] = this.listeners[event]!.filter((h) => h !== handler);
    };
  }

  public emit<K extends keyof Events>(event: K, payload: Events[K]): void {
    this.executionLog.push({ event, payload, timestamp: Date.now() });
    const handlers = this.listeners[event];
    if (handlers) {
      for (const fn of handlers) {
        fn(payload);
      }
    }
  }

  public registerAggregate(aggregate: RemappedHandlerHub<Events>): () => void {
    const unsubs: (() => void)[] = [];
    const proto = Object.getPrototypeOf(aggregate);
    const propertyNames = new Set([
      ...Object.keys(aggregate),
      ...(proto ? Object.getOwnPropertyNames(proto) : []),
    ]);

    for (const key of propertyNames) {
      if (key.startsWith("on") && key.length > 2) {
        const rawEventName = key.slice(2);
        const eventName = (rawEventName.charAt(0).toLowerCase() + rawEventName.slice(1)) as keyof Events;
        const handler = (aggregate as any)[key];
        if (typeof handler === "function") {
          const unsub = this.subscribe(eventName, handler.bind(aggregate));
          unsubs.push(unsub);
        }
      }
    }

    return () => {
      for (const unsub of unsubs) unsub();
    };
  }

  public getAuditLog(): ReadonlyArray<{ event: keyof Events; payload: any }> {
    return this.executionLog;
  }
}

// Verification Assertions
interface CommerceEvents {
  orderPlaced: { orderId: string; amount: number; customerId: string };
  paymentSettled: { orderId: string; transactionHash: string };
  orderShipped: { orderId: string; trackingNumber: string };
}

const bus = new TypedEventHub<CommerceEvents>();

let notificationSent = false;
let paymentProcessed = false;

// Direct subscriber test
const unsubOrderPlaced = bus.subscribe("orderPlaced", (payload) => {
  assert.strictEqual(payload.orderId, "ORD-777");
  notificationSent = true;
});

// Aggregate handler implementation adhering to RemappedHandlerHub<CommerceEvents>
class AccountingAggregate implements RemappedHandlerHub<CommerceEvents> {
  public settledOrders: string[];

  constructor() {
    this.settledOrders = [];
  }

  public onPaymentSettled(payload: { orderId: string; transactionHash: string }): void {
    this.settledOrders.push(payload.orderId);
    paymentProcessed = true;
  }
}

const accounting = new AccountingAggregate();
const detachAggregate = bus.registerAggregate(accounting);

// Emit events
bus.emit("orderPlaced", { orderId: "ORD-777", amount: 249.99, customerId: "CUST-10" });
bus.emit("paymentSettled", { orderId: "ORD-777", transactionHash: "0xabc123" });

assert.strictEqual(notificationSent, true);
assert.strictEqual(paymentProcessed, true);
assert.deepStrictEqual(accounting.settledOrders, ["ORD-777"]);

// Test unsubscription
unsubOrderPlaced();
notificationSent = false;
bus.emit("orderPlaced", { orderId: "ORD-888", amount: 15.0, customerId: "CUST-11" });
assert.strictEqual(notificationSent, false); // Handler removed

assert.strictEqual(bus.getAuditLog().length, 3);

console.log("Project 4 (CQRS Event Bus & Remapped Hub) passed all assertions.");
```


---

## 6. Enterprise Best Practices: 20 DOs and DON'Ts

| # | Rule | Bad Practice (DON'T) | Best Practice (DO) | Architectural Impact |
|---|------|----------------------|--------------------|----------------------|
| 1 | **Homomorphic Preservation** | `type MapObj<T> = { [K in keyof T as K]: T[K] }` | `type MapObj<T> = { [K in keyof T]: T[K] }` | Adding redundant `as K` breaks homomorphic array and tuple preservation. |
| 2 | **Record vs Mapped Object** | `type MyProps<T> = Record<keyof T, string>` | `type MyProps<T> = { [K in keyof T]: string }` | `Record` drops `readonly` and optional `?` modifiers; homomorphic mapped types preserve them. |
| 3 | **Filter Keys with `never`** | `[K in keyof T]: T[K] extends Fn ? T[K] : undefined` | `[K in keyof T as T[K] extends Fn ? K : never]: T[K]` | Mapping values to `undefined` leaves dangling empty keys. Mapping keys to `never` in `as` prunes them completely. |
| 4 | **Modifier Stripping** | `type Mutable<T> = { [K in keyof T]: T[K] }` | `type Mutable<T> = { -readonly [K in keyof T]: T[K] }` | Omitting modifier prefixes keeps incoming `readonly` intact. Explicit `-readonly` strips it. |
| 5 | **Union Distribution** | `{ [K in keyof (A \| B)]: ... }` | `T extends any ? { [K in keyof T]: ... } : never` | `keyof (A \| B)` yields only common keys. Distributing over `T` maps every union branch independently. |
| 6 | **Recursive Depth Safety** | Recursively mapping arbitrary `T` without depth guard or primitive check | Intercept `T extends Primitive \| Function` before recurring into object properties | Prevents infinite recursion, compiler slowdowns, and mangling Date, RegExp, or Map instances. |
| 7 | **Readonly Array Handling** | `T extends Array<infer U>` in `DeepPartial` | `T extends readonly (infer U)[]` | `ReadonlyArray` does not extend mutable `Array`, causing deep mappers to fall through to object mapping. |
| 8 | **Index Signatures Pruning** | Assuming `keyof T` returns only literal keys | Use `string extends K ? never : K` in `as` clause | Eliminates broad `[x: string]: any` index signatures to isolate known explicit properties. |
| 9 | **Call Signatures Preservation** | Relying on mapped types for function/callable interfaces | Intercept call signatures with conditional types before mapping object properties | Mapped types drop call and construct signatures completely. |
| 10 | **Template Literal Keys** | Hardcoding uppercase transforms manually | Use built-in `Capitalize<K>`, `Uncapitalize<K>`, `Uppercase<K>`, `Lowercase<K>` | Leverages compiler-native intrinsics with optimal compilation caching. |
| 11 | **Exact Optional Checking** | `T[K] extends undefined` | `{} extends Pick<T, K>` | Distinguishes optional properties (`prop?: string`) from required properties with undefined values (`prop: string \| undefined`). |
| 12 | **Avoid `any` in Value Mappings** | `[K in keyof T]: any` | `[K in keyof T]: unknown` or strongly typed projection | Prevents type safety holes and cascading `any` contagion across downstream consumers. |
| 13 | **Avoid Circular Type Bomb** | Self-referencing recursive mapped types without lazy evaluation | Guard recursion using tuple counters or known termination criteria | Prevents TS2589: Type instantiation is excessively deep and possibly infinite. |
| 14 | **Symbol Keys Retention** | Assuming keys are only `string \| number` | Support `string \| number \| symbol` when defining custom dictionary constraints | Modern ECMAScript relies heavily on Symbol keys (e.g. `Symbol.iterator`, `Symbol.dispose`). |
| 15 | **Explicit Prototype Traversal** | Using `Object.keys()` on class instances to bind remapped methods | Inspect both instance keys and `Object.getPrototypeOf(instance)` | Class methods reside on the prototype; `Object.keys()` will miss them entirely. |
| 16 | **No Parameter Properties** | `constructor(public id: string)` in multi-runtime targets | Declare properties explicitly: `public id: string; constructor(id: string) { this.id = id; }` | Ensures zero-transpile compatibility with Node.js `--experimental-strip-types` and modern bundlers. |
| 17 | **Immutable By Default** | Returning raw mutable references from state stores | Wrap outputs in `DeepReadonly<T>` and freeze with `Object.freeze()` | Prevents accidental external mutations from corrupting internal architectural state. |
| 18 | **Avoid Overloaded Mapped Types** | Mapping multiple unrelated mutations in a single opaque mapped type | Compose single-purpose utility types (`DeepReadonly<DeepPartial<T>>`) | Enhances readability, reusability, and compiler diagnostic reporting. |
| 19 | **Key Collision Awareness** | Remapping disparate keys to identical literal strings without intersection handling | Ensure remapping expressions preserve unique identity or intentionally handle intersected types | Prevents unexpected `{ prop: never }` collisions. |
| 20 | **Export Intermediate Types** | Inlining massive mapped type expressions into public function signatures | Create named aliases for complex mapped types | Dramatically improves IDE autocomplete, hover tooltips, and `.d.ts` declaration generation. |

---

## 7. Real-World Case Study: Enterprise Schema Synthesis & Bidirectional DTO Mapper

### Problem Context
Modern enterprise platforms often struggle with the divergence between Database Entities (Prisma, TypeORM), GraphQL/REST API DTOs, and Client-Side Form State. Writing separate interfaces for `UserEntity`, `UpdateUserInput`, `UserDto`, and `UserFormState` results in massive code duplication, subtle schema drift, and brittle runtime mapping layers.

### Architectural Solution
Using TypeScript Mapped Types and Key Remapping, we synthesize:
1. **Creation Input DTO**: Auto-generates from Entity by stripping auto-generated columns (`id`, `createdAt`, `updatedAt`) and making nullable columns optional.
2. **Partial Update DTO**: Auto-generates deep patch schemas.
3. **Form Controller State**: Remaps properties into typed validation observables (`values`, `errors`, `touched`, `validators`).
4. **Bidirectional Transform Engine**: Maps database snake_case or raw columns to API camelCase properties with 100% compile-time verification.

```typescript
// Core Entity Definition
export interface BaseEntity {
  id: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserEntity extends BaseEntity {
  first_name: string;
  last_name: string;
  email_address: string;
  phone_number: string | null;
  is_active: boolean;
  role: "admin" | "member" | "viewer";
}

// 1. Synthesize Creation DTO (Strip BaseEntity keys, convert snake_case to camelCase)
type SnakeToCamel<S extends string> = S extends `${infer P1}_${infer P2}${infer Rest}`
  ? `${Lowercase<P1>}${Uppercase<P2>}${SnakeToCamel<Rest>}`
  : Lowercase<S>;

export type CreateDto<T extends BaseEntity> = {
  [K in keyof Omit<T, keyof BaseEntity> as SnakeToCamel<K & string>]: T[K];
};

// 2. Synthesize Patch DTO (Deep Partial + Remapped Keys)
export type UpdateDto<T extends BaseEntity> = Partial<CreateDto<T>>;

// 3. Synthesize Form Validation Schema
export type FormValidationSchema<T> = {
  [K in keyof T]?: (val: T[K]) => string | null;
};

// Implementation: DTO Mapper
export class DtoMapper {
  public static toCreateDto<T extends BaseEntity>(entity: T): CreateDto<T> {
    const ignored: Set<string> = new Set(["id", "createdAt", "updatedAt"]);
    const dto: any = {};

    for (const [key, value] of Object.entries(entity)) {
      if (!ignored.has(key)) {
        const camelKey = key.replace(/_([a-z])/g, (_, g) => g.toUpperCase());
        dto[camelKey] = value;
      }
    }

    return dto as CreateDto<T>;
  }
}
```

---

## 8. Practice Drills (75 Drills across 5 Progression Tiers)

### Tier 1: Syntax & Built-in Utilities (Drills 1–15)
1. Write a custom `MyPartial<T>` mapped type from scratch without using TypeScript's built-in `Partial`.
2. Write a custom `MyRequired<T>` that enforces all properties using the `-?` modifier.
3. Write a custom `MyReadonly<T>` that attaches `readonly` to all properties.
4. Write an `Unreadonly<T>` (or `Mutable<T>`) that strips `readonly` using `-readonly`.
5. Implement `MyRecord<K, T>` where `K extends keyof any`.
6. Implement `MyPick<T, K>` using mapped type key constraint `[P in K]`.
7. Implement `MyOmit<T, K>` by composing `MyPick` with `Exclude`.
8. Write a mapped type that transforms all property values of an object `T` to `boolean`.
9. Write a mapped type that transforms all property values of an object `T` to `Promise<T[K]>`.
10. Write a mapped type that wraps all property values in an accessor `{ get: () => T[K]; set: (v: T[K]) => void }`.
11. Write a mapped type that maps every property value to a string description of its type.
12. Inspect the behavior of mapping over an empty interface `{}`.
13. Inspect the behavior of mapping over `any` and `unknown`.
14. Write a mapped type that turns all properties into nullables (`T[K] | null`).
15. Write a mapped type that preserves property keys but maps every value to `never`.

### Tier 2: Modifier Manipulation & Homomorphism (Drills 16–30)
16. Demonstrate with an example why `{ [K in keyof T]: T[K] }` preserves tuple length while `{ [K in keyof T as K]: T[K] }` turns tuples into objects.
17. Write a mapped type that makes only optional properties required while leaving existing required properties unchanged.
18. Write a mapped type that strips `readonly` from arrays while keeping nested objects readonly.
19. Create an `OptionalToNullable<T>` that replaces optional `?` properties with required `T[K] | null`.
20. Demonstrate what happens when mapping over a union of interfaces `A | B`.
21. Write a `DistributiveMapped<T>` that distributes mapped transformations over union types.
22. Test how `-?` interacts with explicit `undefined` values (`prop: string | undefined`).
23. Write a mapped type that converts only `readonly` properties into mutable ones without altering mutability of existing properties.
24. Explain why `Record<keyof T, T[keyof T]>` is non-homomorphic.
25. Write a mapped type that preserves symbol keys alongside string and number keys.
26. Verify how homomorphic mapped types treat `ReadonlyArray<T>`.
27. Write a utility that preserves private class fields during mapped type transformations (and explain why it fails).
28. Create a mapped type that preserves index signatures while modifying explicit properties.
29. Write a utility that strips index signatures from an interface while keeping explicit keys.
30. Prove how mapped types treat methods defined as method signatures vs function properties.

### Tier 3: Key Remapping & Filtering with `as` (Drills 31–45)
31. Write a mapped type `FilterByType<T, ValueType>` that removes all keys whose values do not match `ValueType`.
32. Write a mapped type `OmitByType<T, ValueType>` that drops keys matching `ValueType`.
33. Write a mapped type that extracts only method keys from a class instance.
34. Write a mapped type that extracts only non-function (data) properties from a class.
35. Implement a getter-generator: remapping every property `foo` into `getFoo: () => T['foo']`.
36. Implement a setter-generator: remapping every property `bar` into `setBar: (val: T['bar']) => void`.
37. Write a mapped type that adds a `_` prefix to all private-by-convention properties.
38. Write a mapped type that strips a specific prefix (e.g. `data_`) from all keys.
39. Write a mapped type that converts all `UPPERCASE_KEYS` to `camelCaseKeys`.
40. Implement a mapped type that filters out any key starting with `temp_`.
41. Write a mapped type that prefixes all method names with `execute_`.
42. Create a mapped type that maps keys to string literal representations of their values.
43. What happens when key remapping produces an empty object? Verify with assertions.
44. Create a mapped type that converts snake_case keys to camelCase using template literal recursion.
45. Create a mapped type that converts camelCase keys to kebab-case.

### Tier 4: Recursive & Nested Metaprogramming (Drills 46–60)
46. Implement a production-grade `DeepReadonly<T>` that handles primitives, arrays, tuples, Maps, and Sets.
47. Implement `DeepRequired<T>` that recursively strips `?` from all nested objects.
48. Implement `DeepMutable<T>` that recursively strips `readonly` at all levels.
49. Implement `DeepNullable<T>` that attaches `null` to all nested primitive leaves.
50. Implement `DeepNonNullable<T>` that strips `null` and `undefined` recursively.
51. Write a `DeepUndefinable<T>` that recursively allows `undefined` on all fields.
52. Create a `Paths<T>` utility that returns a union of all dot-separated object paths.
53. Create a `PathValue<T, Path>` utility that resolves the property type at a dot-separated path.
54. Implement a `DeepOmit<T, KeyUnion>` that removes matching keys at any nesting level.
55. Implement a `DeepPick<T, PathUnion>` that selects nested sub-trees based on dot paths.
56. Create a type-safe nested lens `Lens<T, Path>` providing `get()` and `set()` methods.
57. Write a recursive mapper that transforms all `Date` objects in a nested structure into ISO strings.
58. Write a recursive mapper that converts all BigInt values into numbers.
59. Prevent recursion stack overflow on circular references using a depth-limiting tuple counter.
60. Implement a recursive mapper that wraps all leaf functions in an error-handling boundary.

### Tier 5: Enterprise Framework Architecture & Synthesis (Drills 61–75)
61. Build a type-safe Redux action creator mapper from a slice of reducer functions.
62. Build a type-safe RPC client interface generated from a backend service class.
63. Synthesize a GraphQL Query Selection Set type mapper.
64. Create a dynamic configuration validator that verifies environment variables against an interface.
65. Build a reactive state Proxy mapper that emits `'change:${key}'` events when properties are mutated.
66. Construct a Database Repository interface where `findUnique` requires unique branded keys.
67. Build a JSON-Schema-to-TypeScript type synthesis engine.
68. Design an IoC Container dependency token mapper.
69. Create a type-safe event-emitter that supports wildcards (`*`) and namespaced events (`auth.*`).
70. Build an immutable state update helper using mapped paths (`updateIn(state, 'user.address.zip', 90210)`).
71. Synthesize a CLI argument parser schema from an options interface.
72. Build a type-safe Mock generator that auto-stubs all methods of an interface with Jest/Vitest mock functions.
73. Create a bidirectional serializer/deserializer mapped type system.
74. Build a type-safe routing table mapper that extracts URL parameters from path templates (`/users/:id/posts/:postId`).
75. Design a complete Microservices Contract Registry ensuring client and server RPC parity.


---

