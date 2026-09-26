# Module TS-05: Template Literal Types, Type Parsers, & Compile-Time DSLs

> **Track**: TypeScript Production Engineering Masterclass (TS 5.x)  
> **Prerequisites**: [TS-00](file:///C:/Users/ayush/OneDrive/Desktop/js-learning/TS-00-QUEUE-AND-INDEX.md), [TS-01](file:///C:/Users/ayush/OneDrive/Desktop/js-learning/TS-01-TYPE-ARCHITECTURE-AND-STRUCTURAL-SUBTYPING.md), [TS-02](file:///C:/Users/ayush/OneDrive/Desktop/js-learning/TS-02-GENERICS-AND-TYPE-OPERATORS.md), [TS-03](file:///C:/Users/ayush/OneDrive/Desktop/js-learning/TS-03-CONDITIONAL-TYPES-AND-INFERENCE.md), [TS-04](file:///C:/Users/ayush/OneDrive/Desktop/js-learning/TS-04-MAPPED-TYPES-AND-METAPROGRAMMING.md)  
> **Target Audience**: Principal Engineers, Framework Authors, Full-Stack Architects  
> **Universal Specification**: Complete Technical Treatise, 90 Real-World Interview Q&As with Runnable Code, 15 Prediction Puzzles with Step-by-Step Traces, 4 Complete Runnable Production Projects with Test Assertions, 20 DOs & DON'Ts, Real-World Enterprise Case Study, 75 Practice Drills (5 Tiers).

---

# Module TS-05: Template Literal Types, Type Parsers, & Compile-Time DSLs

## 1. Architectural Deep-Dive & Specification Foundations

### 1.1 The Template Literal Type Grammar (TS 4.1+)

Template Literal Types introduce ECMAScript template literal syntax (`${...}`) directly into the TypeScript type system. Rather than treating strings as monolithic opaque primitives (`string`) or static literals (`"user_profile"`), template literal types allow you to model structured string grammars, perform string pattern matching, and synthesize types via combinatorial interpolation.

```typescript
type Protocol = "http" | "https";
type Domain = "example.com" | "internal.net";
type Port = 80 | 443 | 8080;

// Cartesian product of union interpolations:
// 2 * 2 * 3 = 12 distinct literal union members!
type WebUrl = `${Protocol}://${Domain}:${Port}`;
```

#### The Type Lattice & Combinatorial Explosion Rules
When unions are interpolated into template literals, TypeScript computes the Cartesian product across all placeholder positions:
$$\text{Cardinality} = \prod_{i=1}^{N} |U_i|$$
Where $|U_i|$ is the number of union members in the $i$-th interpolation slot.
If the resulting cardinality exceeds **100,000 members**, the TypeScript compiler halts evaluation and triggers:
`TS2590: Expression produces a union type that is too complex to represent.`

```typescript
// Architectural Warning: Beware unchecked union explosions
type Digit = "0" | "1" | "2" | "3" | "4" | "5" | "6" | "7" | "8" | "9";
type TwoDigit = `${Digit}${Digit}`; // 100 members
type FourDigit = `${TwoDigit}${TwoDigit}`; // 10,000 members
// type EightDigit = `${FourDigit}${FourDigit}`; // 100,000,000 members -> TS2590 ERROR!
```

---

### 1.2 Compiler-Level String Intrinsics

TypeScript 4.1 introduced four built-in keyword types for character case conversions. Unlike standard type aliases, these are implemented directly inside the TypeScript compiler (`src/compiler/checker.ts`) as intrinsic operations leveraging V8 string manipulation methods:

```typescript
// 1. Uppercase<StringType>
type Shout = Uppercase<"hello world">; // "HELLO WORLD"

// 2. Lowercase<StringType>
type Whisper = Lowercase<"SYSTEM_FAILURE">; // "system_failure"

// 3. Capitalize<StringType>
type CamelToPascal = Capitalize<"orderService">; // "OrderService"

// 4. Uncapitalize<StringType>
type PascalToCamel = Uncapitalize<"OrderService">; // "orderService"
```

#### Specification Behavior on Special Characters & Unicode:
1. **Locale Independence**: Intrinsics use standard Unicode case mappings without locale awareness (e.g., standard uppercase of `"i"` is `"I"`, unlike Turkish dotted/dotless rules).
2. **Distribution over Unions**: Intrinsics distribute over unions:
   `Capitalize<"foo" | "bar">` evaluates to `"Foo" | "Bar"`.
3. **Idempotence**: `Capitalize<Capitalize<T>> === Capitalize<T>`.

---

### 1.3 Pattern Matching & Inference with `infer`

When combined with conditional types, template literal types allow recursive string parsing by extracting substrings via `infer`.

```typescript
type SplitHeadTail<S extends string, Delimiter extends string> =
  S extends `${infer Head}${Delimiter}${infer Tail}`
    ? [Head, Tail]
    : [S, null];

type Res1 = SplitHeadTail<"users/123/profile", "/">;
// ["users", "123/profile"]
```

#### Greedy vs Non-Greedy Matching Mechanics
TypeScript's string pattern matcher evaluates template literal patterns from **left to right**:
1. When two `infer` variables are separated by a static delimiter (e.g. `${infer A}/${infer B}`), `A` matches non-greedily up to the **first occurrence** of `/`.
2. `B` captures everything remaining (greedy).
3. If two `infer` variables are adjacent without a delimiter (e.g. `${infer A}${infer B}`), `A` matches **only the single first character**, and `B` captures the rest!

```typescript
type AdjacentInfer<S extends string> = S extends `${infer First}${infer Rest}`
  ? { first: First; rest: Rest }
  : never;

type SingleCharStep = AdjacentInfer<"TypeScript">;
// { first: "T", rest: "ypeScript" }
```

---

### 1.4 Type-Level Numeric Parsing (`infer N extends number`, TS 4.8+)

Prior to TypeScript 4.8, `infer N` in a template string always inferred `N` as a string (`"42"`). Starting in TS 4.8, `infer N extends number` enables compile-time string-to-number parsing:

```typescript
type ParseInt<S extends string> = S extends `${infer N extends number}` ? N : never;

type Num1 = ParseInt<"42">;     // 42
type Num2 = ParseInt<"-100">;   // -100
type Num3 = ParseInt<"3.1415">; // 3.1415
type Num4 = ParseInt<"0x1F">;   // never (hex string literals not supported by numeric infer)
type Num5 = ParseInt<"NaN">;    // never
```

#### Parsing Booleans and BigInts
TypeScript 4.8 also supports `infer B extends boolean` and `infer B extends bigint`:
```typescript
type ParseBool<S extends string> = S extends `${infer B extends boolean}` ? B : never;
type B1 = ParseBool<"true">;  // true
type B2 = ParseBool<"false">; // false
type B3 = ParseBool<"yes">;   // never

type ParseBigInt<S extends string> = S extends `${infer N extends bigint}` ? N : never;
type BI1 = ParseBigInt<"9007199254740991">; // 9007199254740991n
```

---

### 1.5 String Length and Character Counting via Tuple Accumulators

Because TypeScript types cannot perform raw arithmetic or measure string length directly, string algorithms employ tuple recursion where the length of a tuple represents the accumulator:

```typescript
type StringToTuple<S extends string, Acc extends any[] = []> =
  S extends `${infer First}${infer Rest}`
    ? StringToTuple<Rest, [...Acc, First]>
    : Acc;

type StringLength<S extends string> = StringToTuple<S>['length'];

type Len1 = StringLength<"">;           // 0
type Len2 = StringLength<"TypeScript">; // 10
type Len3 = StringLength<"Cloud-Native Architecture">; // 23
```


---

## 2. Advanced Type Parsers, Case Converters, & Compile-Time DSLs

### 2.1 Complete Case Conversion Suite

Transforming casing between API boundaries, database schemas, and application domain models at the type level:

```typescript
// 1. snake_case to camelCase
export type SnakeToCamel<S extends string> = S extends `${infer P1}_${infer P2}${infer Rest}`
  ? `${Lowercase<P1>}${Uppercase<P2>}${SnakeToCamel<Rest>}`
  : Lowercase<S>;

type TestCamel = SnakeToCamel<"user_account_id">; // "userAccountId"

// 2. camelCase to snake_case
export type CamelToSnake<S extends string> = S extends `${infer Head}${infer Rest}`
  ? `${Head extends Uppercase<Head> ? `_${Lowercase<Head>}` : Head}${CamelToSnake<Rest>}`
  : S;

type TestSnake = CamelToSnake<"userAccountId">; // "user_account_id"

// 3. kebab-case to camelCase
export type KebabToCamel<S extends string> = S extends `${infer P1}-${infer P2}${infer Rest}`
  ? `${Lowercase<P1>}${Uppercase<P2>}${KebabToCamel<Rest>}`
  : Lowercase<S>;

type TestKebabToCamel = KebabToCamel<"content-security-policy">; // "contentSecurityPolicy"

// 4. camelCase to kebab-case
export type CamelToKebab<S extends string> = S extends `${infer Head}${infer Rest}`
  ? `${Head extends Uppercase<Head> ? `-${Lowercase<Head>}` : Head}${CamelToKebab<Rest>}`
  : S;

type TestCamelToKebab = CamelToKebab<"contentSecurityPolicy">; // "content-security-policy"
```

---

### 2.2 Enterprise URL Route Param Extractor

Modern routing libraries (Express, Fastify, Next.js App Router, Hono) extract route parameters dynamically:

```typescript
export type ExtractRouteParams<Path extends string> =
  Path extends `${infer _Start}:${infer Param}/${infer Rest}`
    ? { [K in Param | keyof ExtractRouteParams<`/${Rest}`>]: string }
    : Path extends `${infer _Start}:${infer Param}`
    ? { [K in Param]: string }
    : {};

type Route1 = ExtractRouteParams<"/api/v1/users/:userId/posts/:postId">;
// { userId: string; postId: string; }

type Route2 = ExtractRouteParams<"/health">;
// {}

type Route3 = ExtractRouteParams<"/orgs/:orgId/members/:memberId/roles/:roleId">;
// { orgId: string; memberId: string; roleId: string; }
```

---

### 2.3 Query String Type Parser

Parsing URL search params into typed key-value pairs at compile time:

```typescript
type ParseQueryPair<P extends string> =
  P extends `${infer Key}=${infer Val}`
    ? { [K in Key]: Val }
    : { [K in P]: true };

export type ParseQueryString<Q extends string> =
  Q extends `?${infer Rest}`
    ? ParseQueryString<Rest>
    : Q extends `${infer Pair}&${infer Rest}`
    ? ParseQueryPair<Pair> & ParseQueryString<Rest>
    : Q extends `${infer Pair}`
    ? ParseQueryPair<Pair>
    : {};

type QueryParsed = ParseQueryString<"?page=1&limit=25&sort=desc">;
// { page: "1" } & { limit: "25" } & { sort: "desc" }
```

---

### 2.4 Type-Safe `sprintf` Format String Parser

Enforcing argument count and types corresponding to format specifiers (`%s`, `%d`, `%j`):

```typescript
type SpecifierType<T extends string> =
  T extends "s" ? string :
  T extends "d" | "i" ? number :
  T extends "j" ? object :
  T extends "b" ? boolean :
  never;

export type ExtractFormatArgs<S extends string> =
  S extends `${infer _Pre}%${infer Spec}${infer Rest}`
    ? [SpecifierType<Spec>, ...ExtractFormatArgs<Rest>]
    : [];

export function sprintf<S extends string>(
  format: S,
  ...args: ExtractFormatArgs<S>
): string {
  let result = format;
  for (const arg of args) {
    result = result.replace(/%[sdijb]/, String(arg));
  }
  return result;
}

// Compile-Time Verification:
// sprintf("Hello %s, your balance is %d", "Alice", 450); // OK
// sprintf("Hello %s, your balance is %d", "Alice", "NaN"); // TS2345: string not assignable to number!
```

---

### 2.5 i18n Parameter Interpolation Parser

Validating translation key parameters at compile time:

```typescript
type ExtractInterpolationKeys<S extends string> =
  S extends `${infer _Start}{${infer Key}}${infer Rest}`
    ? Key | ExtractInterpolationKeys<Rest>
    : never;

export type I18nParams<S extends string> =
  [ExtractInterpolationKeys<S>] extends [never]
    ? []
    : [params: { [K in ExtractInterpolationKeys<S>]: string | number }];

export function translate<
  Schema extends Record<string, string>,
  Key extends keyof Schema
>(
  schema: Schema,
  key: Key,
  ...args: I18nParams<Schema[Key]>
): string {
  let text = schema[key];
  if (args.length > 0 && args[0]) {
    const params = args[0] as Record<string, string | number>;
    for (const [k, v] of Object.entries(params)) {
      text = text.replace(new RegExp(`{${k}}`, "g"), String(v));
    }
  }
  return text;
}
```

---

### 2.6 Compile-Time SQL Query Syntax & Projection Parser

Extracting projected columns and verifying table names at compile time:

```typescript
export interface AppDatabaseSchema {
  users: { id: number; username: string; email: string; is_admin: boolean };
  orders: { id: string; user_id: number; total: number; status: string };
}

type SplitColumns<S extends string> =
  S extends `${infer Col}, ${infer Rest}`
    ? Col | SplitColumns<Rest>
    : S;

export type ParseSelectQuery<
  Query extends string,
  Schema extends Record<string, Record<string, any>>
> =
  Query extends `SELECT ${infer Cols} FROM ${infer Table}`
    ? Table extends keyof Schema
      ? Cols extends "*"
        ? Schema[Table]
        : { [K in SplitColumns<Cols> as K extends keyof Schema[Table] ? K : never]: Schema[Table][K & keyof Schema[Table]] }
      : { error: `Table '${Table}' does not exist in database schema` }
    : { error: "Invalid SQL SELECT syntax" };

type UserProjection = ParseSelectQuery<"SELECT id, username FROM users", AppDatabaseSchema>;
// { id: number; username: string; }

type InvalidTable = ParseSelectQuery<"SELECT id FROM nonexistent", AppDatabaseSchema>;
// { error: "Table 'nonexistent' does not exist in database schema" }
```


---

## 3. 90 Real-World Technical Interview Q&As (Part 1: Q1–Q45)

---

#### Q1: What are Template Literal Types and what version of TypeScript introduced them?
**Answer:**
Template Literal Types were introduced in **TypeScript 4.1**. They allow string literals to be combined using ECMAScript template literal interpolation syntax (`${...}`). They can be used to generate new string literal types from unions, extract substrings using `infer`, and construct compile-time domain-specific languages (DSLs).

```typescript
type World = "world";
type Greeting = `hello ${World}`; // Type: "hello world"
```

---

#### Q2: How does TypeScript evaluate unions interpolated into template literals?
**Answer:**
When unions are interpolated into template literals, TypeScript calculates the **Cartesian product** across all positions. Every member of each union is combined with every member of every other union.

```typescript
type Size = "sm" | "md" | "lg";
type Color = "red" | "blue";
type Variant = `${Size}-${Color}`;
// "sm-red" | "sm-blue" | "md-red" | "md-blue" | "lg-red" | "lg-blue" (3 * 2 = 6 members)
```

---

#### Q3: What is the compiler limit on union cardinality in template literals?
**Answer:**
The TypeScript compiler limits union expansion to prevent infinite loops and memory exhaustion. If a template literal type expands to more than **100,000 union members**, the compiler throws `TS2590: Expression produces a union type that is too complex to represent`.

```typescript
type Digit = "0" | "1" | "2" | "3" | "4" | "5" | "6" | "7" | "8" | "9";
type Hex = Digit | "a" | "b" | "c" | "d" | "e" | "f"; // 16
type FourHex = `${Hex}${Hex}${Hex}${Hex}`; // 65,536 members (Legal)
// type FiveHex = `${FourHex}${Hex}`; // 1,048,576 members -> Triggers TS2590!
```

---

#### Q4: What are the four built-in string intrinsics and how do they differ from normal type aliases?
**Answer:**
The four intrinsics are `Uppercase<S>`, `Lowercase<S>`, `Capitalize<S>`, and `Uncapitalize<S>`. They are not implemented using TypeScript conditional types; instead, the compiler recognizes them as `intrinsic` keywords and delegates execution directly to internal V8 C++ string manipulation routines.

```typescript
type A = Uppercase<"status">;     // "STATUS"
type B = Lowercase<"PORT_8080">;   // "port_8080"
type C = Capitalize<"service">;    // "Service"
type D = Uncapitalize<"Service">;  // "service"
```

---

#### Q5: Do built-in string intrinsics distribute over unions?
**Answer:**
Yes. String intrinsics automatically distribute over unions.

```typescript
type Action = "create" | "update" | "delete";
type UpperAction = Uppercase<Action>;
// Evaluates to: "CREATE" | "UPDATE" | "DELETE"
```

---

#### Q6: How does pattern matching with `infer` work in template literal types?
**Answer:**
When a string type is matched against a template literal pattern with `infer`, TypeScript extracts the matching substring into the inferred type parameter.

```typescript
type ExtractEventDomain<T extends string> =
  T extends `${infer Domain}:${infer _Event}` ? Domain : never;

type Domain = ExtractEventDomain<"billing:invoice_created">; // "billing"
```

---

#### Q7: Is string matching in template literal types greedy or non-greedy?
**Answer:**
When two `infer` variables are separated by a static delimiter, the left `infer` variable is **non-greedy** (matches up to the first occurrence of the delimiter), and the right `infer` variable matches the remainder.

```typescript
type Split<S extends string> = S extends `${infer Head}/${infer Tail}` ? [Head, Tail] : never;
type Result = Split<"a/b/c/d">;
// Head = "a" (first match)
// Tail = "b/c/d" (remainder)
```

---

#### Q8: What happens when two `infer` variables are placed adjacent to each other without a delimiter?
**Answer:**
The first `infer` variable matches exactly **one character**, while the second `infer` variable matches the entire remaining string.

```typescript
type FirstChar<S extends string> = S extends `${infer First}${infer Rest}` ? First : never;
type F = FirstChar<"JavaScript">; // "J"
```

---

#### Q9: How does TypeScript 4.8+ support numeric inference in template strings?
**Answer:**
By specifying `infer N extends number`, TypeScript parses a numeric string literal directly into a literal `number` type.

```typescript
type ToNumber<S extends string> = S extends `${infer N extends number}` ? N : never;
type N1 = ToNumber<"42">;     // 42 (literal number, not "42")
type N2 = ToNumber<"3.14">;   // 3.14
type N3 = ToNumber<"-99">;    // -99
type N4 = ToNumber<"invalid">;// never
```

---

#### Q10: Does `infer N extends number` parse hexadecimal string literals like `"0xFF"`?
**Answer:**
No. The TypeScript compiler's template string parser for numeric inference only recognizes standard decimal format (integers, negative numbers, floats, and scientific notation). `"0xFF"` evaluates to `never`.

```typescript
type HexNum = ToNumber<"0xFF">; // never
```

---

#### Q11: How do you parse boolean values from strings at compile time?
**Answer:**
Using `infer B extends boolean` (TS 4.8+):

```typescript
type ToBoolean<S extends string> = S extends `${infer B extends boolean}` ? B : never;
type T = ToBoolean<"true">;  // true
type F = ToBoolean<"false">; // false
type X = ToBoolean<"yes">;   // never
```

---

#### Q12: How do you calculate the length of a string literal at compile time?
**Answer:**
Since strings do not expose a type-level length property, you recursively decompose the string into a tuple of characters and query the tuple's `.length`.

```typescript
type StringLength<S extends string, Acc extends any[] = []> =
  S extends `${infer _First}${infer Rest}`
    ? StringLength<Rest, [...Acc, any]>
    : Acc['length'];

type Len = StringLength<"TypeScript">; // 10
```

---

#### Q13: How do you implement `TrimStart<S>` to remove leading whitespace?
**Answer:**
Match against whitespace characters (`" "` | `"\t"` | `"\n"` | `"\r"`) and recurse:

```typescript
type WhiteSpace = " " | "\t" | "\n" | "\r";
type TrimStart<S extends string> = S extends `${WhiteSpace}${infer Rest}` ? TrimStart<Rest> : S;

type Trimmed = TrimStart<"   hello">; // "hello"
```

---

#### Q14: How do you implement `TrimEnd<S>` to remove trailing whitespace?
**Answer:**
Match trailing whitespace characters and recurse:

```typescript
type TrimEnd<S extends string> = S extends `${infer Rest}${WhiteSpace}` ? TrimEnd<Rest> : S;

type Trimmed = TrimEnd<"hello   \n">; // "hello"
```

---

#### Q15: How do you implement a complete `Trim<S>` utility?
**Answer:**
Compose `TrimStart` and `TrimEnd`:

```typescript
type Trim<S extends string> = TrimEnd<TrimStart<S>>;
type Clean = Trim<"   data payload   ">; // "data payload"
```

---

#### Q16: How do you implement `Replace<S, From, To>` for single replacements?
**Answer:**
Pattern-match on `${infer Head}${From}${infer Tail}` and substitute `To`:

```typescript
type Replace<S extends string, From extends string, To extends string> =
  From extends ""
    ? S
    : S extends `${infer Head}${From}${infer Tail}`
    ? `${Head}${To}${Tail}`
    : S;

type R = Replace<"user_id", "_", "-">; // "user-id"
```

---

#### Q17: How do you implement `ReplaceAll<S, From, To>` for global replacements?
**Answer:**
Recurse on the `Tail` of the matched pattern:

```typescript
type ReplaceAll<S extends string, From extends string, To extends string> =
  From extends ""
    ? S
    : S extends `${infer Head}${From}${infer Tail}`
    ? `${Head}${To}${ReplaceAll<Tail, From, To>}`
    : S;

type RAll = ReplaceAll<"foo.bar.baz.qux", ".", "/">; // "foo/bar/baz/qux"
```

---

#### Q18: How do you split a string into a tuple of substrings (`Split<S, Delimiter>`)?
**Answer:**
```typescript
type Split<S extends string, Delimiter extends string> =
  S extends `${infer Head}${Delimiter}${infer Tail}`
    ? [Head, ...Split<Tail, Delimiter>]
    : [S];

type S1 = Split<"2026-09-27", "-">; // ["2026", "09", "27"]
```

---

#### Q19: How do you join a tuple of strings with a delimiter (`Join<Tuple, Delimiter>`)?
**Answer:**
```typescript
type Join<T extends string[], Delimiter extends string> =
  T extends []
    ? ""
    : T extends [infer Single extends string]
    ? Single
    : T extends [infer First extends string, ...infer Rest extends string[]]
    ? `${First}${Delimiter}${Join<Rest, Delimiter>}`
    : string;

type J = Join<["api", "v1", "users"], "/">; // "api/v1/users"
```

---

#### Q20: How do you convert `snake_case` to `camelCase` at the type level?
**Answer:**
```typescript
type SnakeToCamel<S extends string> =
  S extends `${infer P1}_${infer P2}${infer Rest}`
    ? `${Lowercase<P1>}${Uppercase<P2>}${SnakeToCamel<Rest>}`
    : Lowercase<S>;

type Camel = SnakeToCamel<"order_item_quantity">; // "orderItemQuantity"
```

---

#### Q21: How do you convert `camelCase` to `snake_case` at the type level?
**Answer:**
```typescript
type CamelToSnake<S extends string> =
  S extends `${infer Head}${infer Rest}`
    ? `${Head extends Uppercase<Head> ? `_${Lowercase<Head>}` : Head}${CamelToSnake<Rest>}`
    : S;

type Snake = CamelToSnake<"orderItemQuantity">; // "order_item_quantity"
```

---

#### Q22: How do you convert `kebab-case` to `PascalCase`?
**Answer:**
```typescript
type KebabToPascal<S extends string> =
  S extends `${infer P1}-${infer P2}${infer Rest}`
    ? `${Capitalize<P1>}${Capitalize<P2>}${KebabToPascal<Rest>}`
    : Capitalize<S>;

type Pascal = KebabToPascal<"order-service-client">; // "OrderServiceClient"
```

---

#### Q23: How do you extract route parameters from a URL string like `/users/:userId/posts/:postId`?
**Answer:**
```typescript
type ExtractRouteParams<Path extends string> =
  Path extends `${infer _Start}:${infer Param}/${infer Rest}`
    ? { [K in Param | keyof ExtractRouteParams<`/${Rest}`>]: string }
    : Path extends `${infer _Start}:${infer Param}`
    ? { [K in Param]: string }
    : {};

type Params = ExtractRouteParams<"/users/:userId/posts/:postId">;
// { userId: string; postId: string; }
```

---

#### Q24: How do you handle trailing slashes in route parameter extraction?
**Answer:**
Strip optional trailing slashes before parsing:

```typescript
type CleanPath<P extends string> = P extends `${infer Base}/` ? Base : P;
type SafeRouteParams<P extends string> = ExtractRouteParams<CleanPath<P>>;

type Params2 = SafeRouteParams<"/users/:id/">; // { id: string }
```

---

#### Q25: How do you implement a compile-time SemVer string validator?
**Answer:**
Check that the string matches `${number}.${number}.${number}`:

```typescript
type IsSemVer<S extends string> =
  S extends `${infer Major extends number}.${infer Minor extends number}.${infer Patch extends number}`
    ? true
    : false;

type V1 = IsSemVer<"1.0.4">; // true
type V2 = IsSemVer<"v1.0">;  // false
```

---

#### Q26: How do you implement a compile-time Hex Color validator?
**Answer:**
```typescript
type HexChar = "0"|"1"|"2"|"3"|"4"|"5"|"6"|"7"|"8"|"9"|"a"|"b"|"c"|"d"|"e"|"f"|"A"|"B"|"C"|"D"|"E"|"F";

type IsHex6<S extends string> =
  S extends `${HexChar}${HexChar}${HexChar}${HexChar}${HexChar}${HexChar}` ? true : false;

type IsHexColor<S extends string> =
  S extends `#${infer Rest}` ? IsHex6<Rest> : false;

type C1 = IsHexColor<"#FFFFFF">; // true
type C2 = IsHexColor<"#123">;    // false (strictly 6-char hex)
```

---

#### Q27: How do you implement a type-safe `StartsWith<S, Prefix>` utility?
**Answer:**
```typescript
type StartsWith<S extends string, Prefix extends string> =
  S extends `${Prefix}${string}` ? true : false;

type S1 = StartsWith<"https://github.com", "https://">; // true
type S2 = StartsWith<"http://github.com", "https://">;  // false
```

---

#### Q28: How do you implement a type-safe `EndsWith<S, Suffix>` utility?
**Answer:**
```typescript
type EndsWith<S extends string, Suffix extends string> =
  S extends `${string}${Suffix}` ? true : false;

type E1 = EndsWith<"image.png", ".png">; // true
type E2 = EndsWith<"image.jpg", ".png">; // false
```

---

#### Q29: How do you implement `Includes<S, Substring>`?
**Answer:**
```typescript
type Includes<S extends string, Sub extends string> =
  S extends `${string}${Sub}${string}` ? true : false;

type I1 = Includes<"enterprise-grade", "prise">; // true
type I2 = Includes<"enterprise-grade", "cloud">; // false
```

---

#### Q30: How do you implement a type-safe `Reverse<S>` for strings?
**Answer:**
```typescript
type Reverse<S extends string> =
  S extends `${infer First}${infer Rest}`
    ? `${Reverse<Rest>}${First}`
    : "";

type Rev = Reverse<"hello">; // "olleh"
```

---

#### Q31: How do you implement `Repeat<S, N>` at the type level?
**Answer:**
Use a tuple accumulator to count repetitions up to `N`:

```typescript
type Repeat<S extends string, N extends number, Acc extends any[] = [], Out extends string = ""> =
  Acc['length'] extends N
    ? Out
    : Repeat<S, N, [...Acc, any], `${Out}${S}`>;

type Rep = Repeat<"*", 5>; // "*****"
```

---

#### Q32: How do you resolve a nested object property by its dot path string (`PathValue<T, P>`)?
**Answer:**
```typescript
type PathValue<T, P extends string> =
  P extends `${infer Key}.${infer Rest}`
    ? Key extends keyof T
      ? PathValue<T[Key], Rest>
      : never
    : P extends keyof T
    ? T[P]
    : never;

interface Config {
  db: { connection: { pool: number } };
}

type PoolType = PathValue<Config, "db.connection.pool">; // number
```

---

#### Q33: How do you generate a union of all possible dot-separated paths of an object?
**Answer:**
```typescript
type ObjectPaths<T> = T extends object
  ? { [K in keyof T & string]: K | `${K}.${ObjectPaths<T[K]>}` }[keyof T & string]
  : never;

interface UserProfile {
  name: string;
  address: {
    city: string;
    zip: number;
  };
}

type Paths = ObjectPaths<UserProfile>;
// "name" | "address" | "address.city" | "address.zip"
```

---

#### Q34: What is the risk of `ObjectPaths<T>` on objects with circular references?
**Answer:**
Without a termination guard, circular object references cause unbounded recursion, triggering:
`TS2589: Type instantiation is excessively deep and possibly infinite.`

---

#### Q35: How do you guard `ObjectPaths<T>` against infinite recursion using a depth counter?
**Answer:**
Use a tuple counter to cap recursion at a specific depth (e.g., depth 5):

```typescript
type SafeObjectPaths<T, Depth extends any[] = []> =
  Depth['length'] extends 5
    ? never
    : T extends object
    ? { [K in keyof T & string]: K | `${K}.${SafeObjectPaths<T[K], [...Depth, any]>}` }[keyof T & string]
    : never;
```

---

#### Q36: How do template literals support Event Emitter namespaces (e.g. `domain:event`)?
**Answer:**
```typescript
type Entity = "user" | "order" | "product";
type EventType = "created" | "updated" | "deleted";
type DomainEvent = `${Entity}:${EventType}`;

function on(event: DomainEvent, callback: () => void): void {}
// on("user:created", () => {}); // Valid
// on("user:unknown", () => {}); // TS2345 error!
```

---

#### Q37: How do you implement wildcard event subscriptions (`${string}:*`)?
**Answer:**
```typescript
type WildcardSubscription<E extends string> =
  E | `${infer Domain}:*` | "*";

type ValidEvent = WildcardSubscription<"order:paid">;
// "order:paid" | `${string}:*` | "*"
```

---

#### Q38: How do you extract HTTP Method and Route Path from a composite route definition?
**Answer:**
```typescript
type Method = "GET" | "POST" | "PUT" | "DELETE";
type Endpoint = `${Method} ${string}`;

type ExtractMethod<E extends Endpoint> = E extends `${infer M extends Method} ${string}` ? M : never;
type ExtractPath<E extends Endpoint> = E extends `${Method} ${infer P}` ? P : never;

type M = ExtractMethod<"POST /api/v1/checkout">; // "POST"
type P = ExtractPath<"POST /api/v1/checkout">;   // "/api/v1/checkout"
```

---

#### Q39: How do you enforce CSS Units (e.g., `px`, `rem`, `%`) at compile time?
**Answer:**
```typescript
type CSSUnit = "px" | "rem" | "em" | "%" | "vh" | "vw";
type CSSDimension = `${number}${CSSUnit}` | "0" | "auto";

function setWidth(width: CSSDimension) {}
// setWidth("100px");  // OK
// setWidth("2.5rem"); // OK
// setWidth("50");     // TS2345: Unit missing!
```

---

#### Q40: How do you validate an IPv4 address string at the type level?
**Answer:**
```typescript
type Octet = `${number}`;
type IPv4 = `${Octet}.${Octet}.${Octet}.${Octet}`;

function bindAddress(ip: IPv4) {}
// bindAddress("127.0.0.1"); // OK
// bindAddress("localhost"); // Error
```

---

#### Q41: How do you extract GraphQL Field names from a selection string?
**Answer:**
```typescript
type ExtractFields<Query extends string> =
  Query extends `{ ${infer Fields} }`
    ? Split<Fields, " ">[number]
    : never;

type Fields = ExtractFields<"{ id name email }">; // "id" | "name" | "email"
```

---

#### Q42: How do you implement a type-safe `Join` that preserves empty arrays?
**Answer:**
```typescript
type SafeJoin<T extends readonly string[], Delimiter extends string> =
  T extends []
    ? ""
    : T extends readonly [infer F extends string]
    ? F
    : T extends readonly [infer F extends string, ...infer R extends readonly string[]]
    ? `${F}${Delimiter}${SafeJoin<R, Delimiter>}`
    : string;
```

---

#### Q43: How does TypeScript differentiate `${string}` from `string`?
**Answer:**
Inside type relationships and template literal patterns, `${string}` represents an interpolation wildcard that matches any string. In isolation, the type `${string}` is structurally identical to `string`.

---

#### Q44: Can template literal types match literal symbols?
**Answer:**
No. Symbols cannot be serialized into string template literals. Attempting `${symbol}` produces compile error `TS2469: Symbol' type cannot be serialized in template literal type`.

---

#### Q45: How do you parse URL hash/fragment identifiers at compile time?
**Answer:**
```typescript
type ExtractHash<Url extends string> =
  Url extends `${infer _Before}#${infer Fragment}` ? Fragment : null;

type Hash = ExtractHash<"https://docs.ts.com/intro#generics">; // "generics"
```


---

## 3. 90 Real-World Technical Interview Q&As (Part 2: Q46–Q90)

---

#### Q46: How do you parse query string parameters into an object type (`ParseQueryString<Q>`)?
**Answer:**
Iteratively split by `&` and then decompose key-value pairs separated by `=`:

```typescript
type ParsePair<P extends string> =
  P extends `${infer K}=${infer V}`
    ? { [Key in K]: V }
    : { [Key in P]: true };

type ParseQueryString<Q extends string> =
  Q extends `?${infer Rest}`
    ? ParseQueryString<Rest>
    : Q extends `${infer Pair}&${infer Rest}`
    ? ParsePair<Pair> & ParseQueryString<Rest>
    : Q extends `${infer Pair}`
    ? ParsePair<Pair>
    : {};

type Query = ParseQueryString<"?role=admin&active=true">;
// { role: "admin" } & { active: "true" }
```

---

#### Q47: How do you handle multiple identical query keys (e.g. array values `?tag=ts&tag=js`)?
**Answer:**
Synthesize existing accumulator properties into a tuple when a duplicate key is detected:

```typescript
type MergeParams<Acc, NewPair> = {
  [K in keyof Acc | keyof NewPair]:
    K extends keyof Acc
      ? K extends keyof NewPair
        ? Acc[K] extends any[]
          ? [...Acc[K], NewPair[K]]
          : [Acc[K], NewPair[K]]
        : Acc[K]
      : K extends keyof NewPair
      ? NewPair[K]
      : never;
};
```

---

#### Q48: How do you extract placeholder variable names from an i18n string like `"Welcome {username}, you have {count} alerts"`?
**Answer:**
Recursively pattern-match against `{${infer Param}}`:

```typescript
type ExtractI18nParams<S extends string> =
  S extends `${infer _Before}{${infer Param}}${infer Rest}`
    ? Param | ExtractI18nParams<Rest>
    : never;

type Params = ExtractI18nParams<"Welcome {username}, you have {count} alerts">;
// "username" | "count"
```

---

#### Q49: How do you create a type-safe `t()` translation function requiring all extracted placeholders?
**Answer:**
```typescript
type TranslationArgs<S extends string> =
  [ExtractI18nParams<S>] extends [never]
    ? []
    : [params: Record<ExtractI18nParams<S>, string | number>];

function t<S extends string>(template: S, ...args: TranslationArgs<S>): string {
  let result: string = template;
  if (args.length > 0) {
    for (const [k, v] of Object.entries(args[0])) {
      result = result.replace(new RegExp(`{${k}}`, "g"), String(v));
    }
  }
  return result;
}

// t("Hello {name}", { name: "Alice" }); // Valid
// t("Hello {name}"); // TS2554: Expected 2 arguments, got 1!
```

---

#### Q50: How do you model Tailwind-like utility classes using template literal types?
**Answer:**
Combine utility prefixes, scales, and state variants:

```typescript
type Variant = "" | "hover:" | "focus:";
type Property = "p" | "m" | "text";
type Scale = "sm" | "md" | "lg" | "xl";

type TailwindClass = `${Variant}${Property}-${Scale}`;
// "p-sm" | "hover:p-sm" | "focus:text-lg" | etc.
```

---

#### Q51: How do you extract columns from a SQL `SELECT` statement?
**Answer:**
```typescript
type SplitCols<S extends string> =
  S extends `${infer Col}, ${infer Rest}`
    ? Col | SplitCols<Rest>
    : S;

type ExtractSelectCols<Q extends string> =
  Q extends `SELECT ${infer Cols} FROM ${string}`
    ? SplitCols<Cols>
    : never;

type Columns = ExtractSelectCols<"SELECT id, name, email FROM users">;
// "id" | "name" | "email"
```

---

#### Q52: How do you validate an ISO 8601 Date string (`YYYY-MM-DD`) at compile time?
**Answer:**
```typescript
type Digit = "0"|"1"|"2"|"3"|"4"|"5"|"6"|"7"|"8"|"9";
type Year = `${Digit}${Digit}${Digit}${Digit}`;
type Month = `${Digit}${Digit}`;
type Day = `${Digit}${Digit}`;
type ISODate = `${Year}-${Month}-${Day}`;

function setDate(date: ISODate) {}
// setDate("2026-09-27"); // OK
// setDate("27-09-2026"); // Error
```

---

#### Q53: How do you parse and validate a JWT Token structure?
**Answer:**
A JWT consists of three Base64URL-encoded strings separated by two periods:

```typescript
type JWT = `${string}.${string}.${string}`;

function verifyToken(token: JWT) {}
// verifyToken("header.payload.signature"); // OK
// verifyToken("invalid-token"); // TS2345
```

---

#### Q54: How do you type a 40-character Git commit SHA?
**Answer:**
Using recursive character verification or repeated 4-character chunks:

```typescript
type HexChar = "0"|"1"|"2"|"3"|"4"|"5"|"6"|"7"|"8"|"9"|"a"|"b"|"c"|"d"|"e"|"f";
type Hex4 = `${HexChar}${HexChar}${HexChar}${HexChar}`;
type GitSHA = `${Hex4}${Hex4}${Hex4}${Hex4}${Hex4}${Hex4}${Hex4}${Hex4}${Hex4}${Hex4}`; // 40 chars
```

---

#### Q55: How do you parse and validate a MAC Address?
**Answer:**
```typescript
type Hex2 = `${HexChar}${HexChar}`;
type MACAddress = `${Hex2}:${Hex2}:${Hex2}:${Hex2}:${Hex2}:${Hex2}`;

function registerDevice(mac: MACAddress) {}
// registerDevice("00:1A:2B:3C:4D:5E"); // OK
```

---

#### Q56: How do you parse Semantic Version comparison ranges (e.g. `^1.2.3`, `~1.2.3`)?
**Answer:**
```typescript
type SemVerRange<V extends string> =
  V extends `^${infer Rest}` ? { operator: "^"; version: Rest } :
  V extends `~${infer Rest}` ? { operator: "~"; version: Rest } :
  V extends `>=${infer Rest}` ? { operator: ">="; version: Rest } :
  { operator: "="; version: V };

type R1 = SemVerRange<"^5.4.0">; // { operator: "^"; version: "5.4.0" }
```

---

#### Q57: How do you validate a type-safe JSON Pointer (RFC 6901)?
**Answer:**
A JSON pointer begins with `/` and separates object keys:

```typescript
type JsonPointer = `/${string}` | "";
function resolvePointer<T>(target: T, pointer: JsonPointer) {}
```

---

#### Q58: How do you implement a compile-time CSS `rgb()` / `rgba()` validator?
**Answer:**
```typescript
type RGB = `rgb(${number}, ${number}, ${number})`;
type RGBA = `rgba(${number}, ${number}, ${number}, ${number})`;
type CSSColor = RGB | RGBA | `#${string}`;

function setColor(c: CSSColor) {}
// setColor("rgb(255, 0, 128)"); // OK
// setColor("rgba(0, 0, 0, 0.5)"); // OK
```

---

#### Q59: How do you extract keys prefixed with `on` and strip the prefix to lowercase event names?
**Answer:**
```typescript
type ExtractEventNames<T> = {
  [K in keyof T as K extends `on${infer Event}` ? Uncapitalize<Event> : never]: T[K];
};

interface DOMEvents {
  onClick: (e: any) => void;
  onKeyDown: (e: any) => void;
  className: string;
}

type Extracted = ExtractEventNames<DOMEvents>;
// { click: (e: any) => void; keyDown: (e: any) => void; }
```

---

#### Q60: How do you enforce that an interface has NO leading underscores in its properties?
**Answer:**
```typescript
type EnforceNoLeadingUnderscore<T> = {
  [K in keyof T]: K extends `_${string}` ? never : T[K];
};
```

---

#### Q61: How do you convert all object keys from `snake_case` to `camelCase` in a mapped type?
**Answer:**
```typescript
type SnakeToCamelObject<T> = {
  [K in keyof T as K extends string ? SnakeToCamel<K> : K]: T[K];
};

interface DBRow {
  first_name: string;
  is_verified: boolean;
}

type CleanRow = SnakeToCamelObject<DBRow>;
// { firstName: string; isVerified: boolean; }
```

---

#### Q62: How do you convert all object keys to UPPERCASE?
**Answer:**
```typescript
type UppercaseKeys<T> = {
  [K in keyof T as K extends string ? Uppercase<K> : K]: T[K];
};

type EnvConfig = UppercaseKeys<{ port: number; host: string }>;
// { PORT: number; HOST: string; }
```

---

#### Q63: How do you parse Markdown inline link syntax (`[text](url)`)?
**Answer:**
```typescript
type ParseMarkdownLink<S extends string> =
  S extends `[${infer Text}](${infer Url})`
    ? { text: Text; url: Url }
    : never;

type Link = ParseMarkdownLink<"[TypeScript Docs](https://typescriptlang.org)">;
// { text: "TypeScript Docs"; url: "https://typescriptlang.org" }
```

---

#### Q64: How do you parse CLI flags with values (e.g. `--port=8080`)?
**Answer:**
```typescript
type ParseFlag<S extends string> =
  S extends `--${infer Key}=${infer Val extends number}`
    ? { [K in Key]: Val }
    : S extends `--${infer Key}=${infer Val}`
    ? { [K in Key]: Val }
    : S extends `--${infer Key}`
    ? { [K in Key]: true }
    : never;

type Flag1 = ParseFlag<"--port=3000">; // { port: 3000 }
type Flag2 = ParseFlag<"--verbose">;   // { verbose: true }
```

---

#### Q65: How do you parse environment variable interpolation syntax (e.g. `${PORT:-8080}`)?
**Answer:**
```typescript
type ParseEnvInterpolation<S extends string> =
  S extends `\${${infer Var}:-${infer Default}}`
    ? { variable: Var; fallback: Default }
    : S extends `\${${infer Var}}`
    ? { variable: Var; fallback: null }
    : null;

type E1 = ParseEnvInterpolation<"${PORT:-3000}">; // { variable: "PORT"; fallback: "3000" }
```

---

#### Q66: How do you parse Kafka/RabbitMQ multi-level topic keys (e.g. `us-east.prod.billing.invoice_paid`)?
**Answer:**
```typescript
type ParseRoutingKey<K extends string> =
  K extends `${infer Region}.${infer Env}.${infer Service}.${infer Event}`
    ? { region: Region; env: Env; service: Service; event: Event }
    : never;

type Topic = ParseRoutingKey<"eu-west.staging.auth.user_logged_in">;
// { region: "eu-west"; env: "staging"; service: "auth"; event: "user_logged_in" }
```

---

#### Q67: How do you construct Redis hierarchical keys with strong types (`tenant:entity:id`)?
**Answer:**
```typescript
type RedisKey<Tenant extends string, Entity extends string, ID extends string | number> =
  `${Tenant}:${Entity}:${ID}`;

function getCache<T extends string, E extends string, ID extends string | number>(
  key: RedisKey<T, E, ID>
) {}
// getCache("tenant_42:orders:9999"); // Valid
```

---

#### Q68: How do you implement a type-safe `printf` format argument extractor?
**Answer:**
```typescript
type PrintfArg<C extends string> =
  C extends "s" ? string :
  C extends "d" ? number :
  C extends "j" ? object :
  any;

type ExtractPrintfArgs<S extends string> =
  S extends `${string}%${infer Code}${infer Rest}`
    ? [PrintfArg<Code>, ...ExtractPrintfArgs<Rest>]
    : [];

type Args = ExtractPrintfArgs<"Item %s costs %d dollars">;
// [string, number]
```

---

#### Q69: What is tail-call recursion optimization in template literal type parsers?
**Answer:**
When recursive types accumulate their results in an accumulator type parameter in the tail position, TypeScript's compiler can optimize memory usage and evaluate recursion depths of up to **1,000 iterations** without encountering the standard recursion stack limit of ~50.

---

#### Q70: How do you implement tail-call optimized string splitting?
**Answer:**
```typescript
type SplitTCO<
  S extends string,
  Delimiter extends string,
  Acc extends string[] = []
> = S extends `${infer Head}${Delimiter}${infer Tail}`
  ? SplitTCO<Tail, Delimiter, [...Acc, Head]>
  : [...Acc, S];
```

---

#### Q71: How do you implement tail-call optimized string length measurement?
**Answer:**
```typescript
type StringLengthTCO<S extends string, Acc extends any[] = []> =
  S extends `${infer _First}${infer Rest}`
    ? StringLengthTCO<Rest, [...Acc, any]>
    : Acc['length'];
```

---

#### Q72: How do you check if a string is a palindrome at compile time?
**Answer:**
```typescript
type ReverseStr<S extends string> =
  S extends `${infer First}${infer Rest}`
    ? `${ReverseStr<Rest>}${First}`
    : "";

type IsPalindrome<S extends string> = S extends ReverseStr<S> ? true : false;

type P1 = IsPalindrome<"racecar">; // true
type P2 = IsPalindrome<"engine">;  // false
```

---

#### Q73: How do you parse and validate a UUID v4 string at the type level?
**Answer:**
```typescript
type Hex8 = `${Hex4}${Hex4}`;
type Hex12 = `${Hex4}${Hex4}${Hex4}`;
type UUID = `${Hex8}-${Hex4}-4${HexChar}${HexChar}${HexChar}-${HexChar}${HexChar}${HexChar}${HexChar}-${Hex12}`;

function findByUUID(id: UUID) {}
// findByUUID("123e4567-e89b-42d3-a456-426614174000"); // Valid UUID v4
```

---

#### Q74: How do you validate a CSS Selector syntax at compile time?
**Answer:**
```typescript
type SimpleSelector = `.${string}` | `#${string}` | `${string} > ${string}` | `${string}:hover`;

function queryEl(selector: SimpleSelector) {}
// queryEl(".card > .title"); // OK
// queryEl("plain-text"); // Error
```

---

#### Q75: How do you enforce that a string contains only numeric digits?
**Answer:**
```typescript
type IsNumeric<S extends string> =
  S extends ""
    ? true
    : S extends `${Digit}${infer Rest}`
    ? IsNumeric<Rest>
    : false;

type N1 = IsNumeric<"1234567">; // true
type N2 = IsNumeric<"123a567">; // false
```

---

#### Q76: How do you enforce that a string contains NO spaces?
**Answer:**
```typescript
type NoSpaces<S extends string> =
  S extends `${string} ${string}` ? never : S;

function setSlug<T extends string>(slug: NoSpaces<T>) {}
// setSlug("typescript-guide"); // OK
// setSlug("typescript guide"); // TS2345: Argument not assignable to never!
```

---

#### Q77: How do you parse an SQL `INSERT INTO <table> (<cols>)` query?
**Answer:**
```typescript
type ParseInsert<Q extends string> =
  Q extends `INSERT INTO ${infer Table} (${infer Cols}) VALUES (${string})`
    ? { table: Table; columns: Split<Cols, ", "> }
    : never;

type Ins = ParseInsert<"INSERT INTO users (id, name, email) VALUES (1, 'Alice', 'a@b.com')">;
// { table: "users"; columns: ["id", "name", "email"] }
```

---

#### Q78: How do you implement a compile-time CSS calc() expression validator?
**Answer:**
```typescript
type CalcExpression = `calc(${string} + ${string})` | `calc(${string} - ${string})` | `calc(${string} * ${string})`;

function setCalc(val: CalcExpression) {}
// setCalc("calc(100% - 20px)"); // OK
```

---

#### Q79: How do you parse command line arguments into typed configuration?
**Answer:**
```typescript
type ParseCliArg<Arg extends string> =
  Arg extends `--${infer Key}=${infer Val}` ? { [K in Key]: Val } : {};
```

---

#### Q80: How do you map a camelCase property to an uppercase SQL column name?
**Answer:**
```typescript
type CamelToScreamingSnake<S extends string> = Uppercase<CamelToSnake<S>>;

type Col = CamelToScreamingSnake<"userId">; // "USER_ID"
```

---

#### Q81: How do you extract all path parameters enclosed in braces like `/users/{userId}/books/{bookId}`?
**Answer:**
```typescript
type ExtractBraceParams<Path extends string> =
  Path extends `${string}{${infer Param}}${infer Rest}`
    ? Param | ExtractBraceParams<Rest>
    : never;

type P = ExtractBraceParams<"/api/v1/{teamId}/projects/{projectId}">;
// "teamId" | "projectId"
```

---

#### Q82: How do you parse nested JSON path queries (e.g. `$.store.book[0].title`)?
**Answer:**
```typescript
type JsonPathTokens<S extends string> =
  S extends `$.${infer Rest}`
    ? Split<Rest, ".">
    : never;

type Tokens = JsonPathTokens<"$.store.inventory.items">;
// ["store", "inventory", "items"]
```

---

#### Q83: How do you create a type-safe `URLBuilder` with fluent parametric interpolation?
**Answer:**
```typescript
class URLBuilder<Pattern extends string> {
  private pattern: Pattern;
  constructor(pattern: Pattern) { this.pattern = pattern; }

  public build(params: ExtractRouteParams<Pattern>): string {
    let url: string = this.pattern;
    for (const [key, val] of Object.entries(params)) {
      url = url.replace(`:${key}`, String(val));
    }
    return url;
  }
}
```

---

#### Q84: How do you implement a compile-time MIME type validator?
**Answer:**
```typescript
type TopLevelType = "application" | "text" | "image" | "audio" | "video";
type MimeType = `${TopLevelType}/${string}`;

function setContentType(type: MimeType) {}
// setContentType("application/json"); // OK
// setContentType("image/png");        // OK
// setContentType("unknown-format");   // Error
```

---

#### Q85: How do you prevent template literal types from causing compiler memory degradation?
**Answer:**
1. Avoid Cartesian products of large unions ($> 50$ members).
2. Avoid adjacent unconstrained `infer` parameters.
3. Use tail-call recursive accumulators.
4. Add depth recursion guards using tuple counter lengths.

---

#### Q86: Can template literal types pattern-match numbers using negative signs?
**Answer:**
Yes, `infer N extends number` parses negative numbers like `"-42"` into literal `-42`.

---

#### Q87: How do you map an event handler interface from a list of action names?
**Answer:**
```typescript
type Actions = "login" | "logout" | "register";
type Handlers = {
  [A in Actions as `on${Capitalize<A>}`]: () => void;
};
// { onLogin: () => void; onLogout: () => void; onRegister: () => void; }
```

---

#### Q88: How do you implement compile-time String Padding (`PadStart<S, Length, Char>`)?
**Answer:**
```typescript
type PadStart<
  S extends string,
  TargetLength extends number,
  PadChar extends string = " "
> = StringLength<S> extends TargetLength
  ? S
  : PadStart<`${PadChar}${S}`, TargetLength, PadChar>;

type Padded = PadStart<"42", 5, "0">; // "00042"
```

---

#### Q89: How do template literals integrate with `as const` assertions?
**Answer:**
When a template literal expression in runtime JavaScript is tagged with `as const`, TypeScript infers its exact literal template type rather than widening it to `string`.

```typescript
const prefix = "item";
const id = 101;
const sku = `${prefix}_${id}` as const; // Type: "item_101" (not string)
```

---

#### Q90: How do you profile template literal compilation performance in TypeScript?
**Answer:**
Run the TypeScript compiler with `--extendedDiagnostics` or `--generateTrace <trace-dir>` to inspect `CheckTime`, `Types`, and `Instantiations`. Large Cartesian products or deep recursive string templates will show up as significant spikes in instantiation counts.


---

## 4. Output Prediction Puzzles (15 Puzzles with Step-by-Step Traces)

Test your mental model of TypeScript's template literal parser, greedy/non-greedy inference, intrinsic distribution, and type-level string grammar evaluation.

---

### Puzzle 1: Cartesian Product Union Explosion

```typescript
type A = "a" | "b";
type B = "1" | "2";
type C = "x" | "y";

type Combined = `${A}_${B}_${C}`;
// Question: How many union members are in Combined, and what are they?
```

**Step-by-Step Evaluation Trace:**
1. Union `A` has cardinality 2 (`"a"`, `"b"`).
2. Union `B` has cardinality 2 (`"1"`, `"2"`).
3. Union `C` has cardinality 2 (`"x"`, `"y"`).
4. TypeScript calculates the Cartesian product: $2 \times 2 \times 2 = 8$ union members.
5. **Output Type:**
   ```typescript
   "a_1_x" | "a_1_y" | "a_2_x" | "a_2_y" | "b_1_x" | "b_1_y" | "b_2_x" | "b_2_y"
   ```

---

### Puzzle 2: Adjacent `infer` Variables Without Delimiters

```typescript
type Decompose<S extends string> = S extends `${infer Head}${infer Tail}`
  ? { head: Head; tail: Tail }
  : never;

type Result2 = Decompose<"GraphQL">;
```

**Step-by-Step Evaluation Trace:**
1. In `${infer Head}${infer Tail}`, there is no separator between `Head` and `Tail`.
2. TypeScript's parser specifies that the leftmost `infer` captures exactly **one character**.
3. `Head` captures `"G"`.
4. `Tail` captures the remainder: `"raphQL"`.
5. **Output Type:** `{ head: "G"; tail: "raphQL"; }`.

---

### Puzzle 3: Numeric Infer vs Hexadecimal Strings

```typescript
type ParseNumeric<S extends string> = S extends `${infer N extends number}` ? N : "FAILED";

type R3_A = ParseNumeric<"-42.5">;
type R3_B = ParseNumeric<"0xFF">;
type R3_C = ParseNumeric<"1e5">;
```

**Step-by-Step Evaluation Trace:**
1. For `R3_A`: `"-42.5"` is a valid floating point decimal. TS 4.8+ parses it to literal `-42.5`.
2. For `R3_B`: `"0xFF"` is hexadecimal. The TypeScript numeric infer engine only parses standard decimal numbers. The match fails -> `"FAILED"`.
3. For `R3_C`: `"1e5"` is valid scientific decimal notation for 100000. TS parses it to literal `100000`.
4. **Output Types:**
   - `R3_A` = `-42.5`
   - `R3_B` = `"FAILED"`
   - `R3_C` = `100000`

---

### Puzzle 4: Delimiter Non-Greediness

```typescript
type ExtractSegments<S extends string> = S extends `${infer Left}/${infer Right}`
  ? [Left, Right]
  : [S];

type Result4 = ExtractSegments<"api/v1/users/profile">;
```

**Step-by-Step Evaluation Trace:**
1. The static delimiter is `/`.
2. The left `infer Left` matches non-greedily up to the **first** occurrence of `/`.
3. First `/` occurs after `"api"`.
4. `Left` = `"api"`.
5. `Right` captures the rest of the string: `"v1/users/profile"`.
6. **Output Type:** `["api", "v1/users/profile"]`.

---

### Puzzle 5: Intrinsic Distribution Over Unions

```typescript
type Actions = "user_login" | "user_logout";
type Remap<T extends string> = `ON_${Uppercase<T>}`;

type Result5 = Remap<Actions>;
```

**Step-by-Step Evaluation Trace:**
1. `Uppercase<T>` distributes over the union `Actions`.
2. `Uppercase<"user_login">` = `"USER_LOGIN"`.
3. `Uppercase<"user_logout">` = `"USER_LOGOUT"`.
4. The template literal combines each:
5. **Output Type:** `"ON_USER_LOGIN" | "ON_USER_LOGOUT"`.

---

### Puzzle 6: String Trimming on Empty and Pure Whitespace Strings

```typescript
type WhiteSpace = " " | "\t" | "\n";
type TrimStart<S extends string> = S extends `${WhiteSpace}${infer Rest}` ? TrimStart<Rest> : S;

type R6_A = TrimStart<"">;
type R6_B = TrimStart<"   ">;
type R6_C = TrimStart<"   foo   ">;
```

**Step-by-Step Evaluation Trace:**
1. `R6_A`: `""` does not match `${WhiteSpace}${infer Rest}`. Returns `""`.
2. `R6_B`: `"   "` matches whitespace recursively until `""` remains, returning `""`.
3. `R6_C`: Removes leading spaces until `"foo   "` is reached, which does not start with whitespace.
4. **Output Types:**
   - `R6_A` = `""`
   - `R6_B` = `""`
   - `R6_C` = `"foo   "`

---

### Puzzle 7: Param Extraction with Colons in URLs

```typescript
type ExtractParam<S extends string> = S extends `${string}:${infer Param}/${string}`
  ? Param
  : S extends `${string}:${infer Param}`
  ? Param
  : null;

type R7_A = ExtractParam<"http://localhost:8080/metrics">;
type R7_B = ExtractParam<"/api/users/:userId">;
```

**Step-by-Step Evaluation Trace:**
1. For `R7_A`: The URL is `"http://localhost:8080/metrics"`.
   - The first colon matches after `"http"`.
   - `${string}:${infer Param}/${string}` matches:
   - `Param` matches `//localhost:8080`. (Because `/` appears after `metrics`).
   - Notice that naive pattern matching without distinguishing scheme colons captures the host!
2. For `R7_B`: Path is `"/api/users/:userId"`.
   - No trailing slash, so first branch fails.
   - Second branch `${string}:${infer Param}` matches -> `Param` = `"userId"`.
3. **Lesson:** Always use leading slash delimiters like `/:${infer Param}` to isolate URL path parameters!

---

### Puzzle 8: String Length via Recursive Tuple Length

```typescript
type StrLen<S extends string, Acc extends any[] = []> =
  S extends `${infer _Head}${infer Tail}`
    ? StrLen<Tail, [...Acc, any]>
    : Acc['length'];

type Result8 = StrLen<"TS5">;
```

**Step-by-Step Evaluation Trace:**
1. Iteration 1: `S = "TS5"`, `Acc = []`. `Head = "T"`, `Tail = "S5"`. Next: `Acc = [any]`.
2. Iteration 2: `S = "S5"`, `Acc = [any]`. `Head = "S"`, `Tail = "5"`. Next: `Acc = [any, any]`.
3. Iteration 3: `S = "5"`, `Acc = [any, any]`. `Head = "5"`, `Tail = ""`. Next: `Acc = [any, any, any]`.
4. Iteration 4: `S = ""`. Match fails, returns `Acc['length']`.
5. **Output Type:** `3` (literal number).

---

### Puzzle 9: Query String Trailing Ampersands

```typescript
type ParsePairs<S extends string> = S extends `${infer Head}&${infer Tail}`
  ? [Head, ...ParsePairs<Tail>]
  : [S];

type Result9 = ParsePairs<"a=1&b=2&">;
```

**Step-by-Step Evaluation Trace:**
1. Step 1: Matches `Head = "a=1"`, `Tail = "b=2&"`.
2. Step 2: Matches `Head = "b=2"`, `Tail = ""`.
3. Step 3: `S = ""` has no `&`, so it yields `[""]`.
4. Tuple combination: `["a=1", "b=2", ""]`.
5. Note the trailing empty string `""`! Robust parsers must filter out empty chunks.

---

### Puzzle 10: Inverting Mapped Template Names

```typescript
type DropGetPrefix<T> = {
  [K in keyof T as K extends `get${infer Name}` ? Uncapitalize<Name> : never]: T[K];
};

interface GetterService {
  getUser(): string;
  getAccountBalance(): number;
  postMessage(): void;
}

type Result10 = DropGetPrefix<GetterService>;
```

**Step-by-Step Evaluation Trace:**
1. For `getUser`: `K extends 'get${infer Name}'` matches with `Name = "User"`. `Uncapitalize<"User">` = `"user"`.
2. For `getAccountBalance`: `Name = "AccountBalance"`. `Uncapitalize<"AccountBalance">` = `"accountBalance"`.
3. For `postMessage`: Does not start with `"get"`. Evaluates to `never` (stripped).
4. **Output Type:**
   ```typescript
   {
     user: () => string;
     accountBalance: () => number;
   }
   ```

---

### Puzzle 11: Replace with Empty Substring

```typescript
type ReplaceEmpty<S extends string> = S extends `${infer Head}${""}${infer Tail}`
  ? [Head, Tail]
  : never;

type Result11 = ReplaceEmpty<"hello">;
```

**Step-by-Step Evaluation Trace:**
1. In TypeScript template matching, matching against the empty string `""` matches at the start of the string.
2. `Head` captures `""` (first character position before `"h"`).
3. `Tail` captures `"hello"`.
4. **Output Type:** `["", "hello"]`.

---

### Puzzle 12: `as const` Template Expression vs Widen String

```typescript
const host = "127.0.0.1";
const port = 3000;

const endpointA = `${host}:${port}`;
const endpointB = `${host}:${port}` as const;

type TypeA = typeof endpointA;
type TypeB = typeof endpointB;
```

**Step-by-Step Evaluation Trace:**
1. `endpointA` is declared with `const`, but without `as const` on the template literal expression itself, TypeScript widens dynamic template strings containing numbers to `string`.
2. `endpointB` has explicit `as const`. TypeScript retains the exact literal string.
3. **Output Types:**
   - `TypeA` = `string`
   - `TypeB` = `"127.0.0.1:3000"`

---

### Puzzle 13: Case Converter Round-Trip Equivalence

```typescript
type RoundTrip<S extends string> = CamelToSnake<SnakeToCamel<S>>;

type R13 = RoundTrip<"user_first_name">;
```

**Step-by-Step Evaluation Trace:**
1. `SnakeToCamel<"user_first_name">`:
   - `"user"` + `"First"` + `"Name"` = `"userFirstName"`.
2. `CamelToSnake<"userFirstName">`:
   - `"user"` + `_f` -> `_first` + `_n` -> `_name` = `"user_first_name"`.
3. The round-trip is strictly isomorphic!
4. **Output Type:** `"user_first_name"`.

---

### Puzzle 14: SemVer with Pre-Release Match

```typescript
type ParseSemVer<S extends string> =
  S extends `${infer M extends number}.${infer N extends number}.${infer P extends number}-${infer Tag}`
    ? { major: M; minor: N; patch: P; tag: Tag }
    : S extends `${infer M extends number}.${infer N extends number}.${infer P extends number}`
    ? { major: M; minor: N; patch: P; tag: null }
    : never;

type S1 = ParseSemVer<"2.1.0-beta.1">;
type S2 = ParseSemVer<"2.1.0">;
```

**Step-by-Step Evaluation Trace:**
1. `S1` matches the first branch:
   - `M = 2`, `N = 1`, `P = 0`, `Tag = "beta.1"`.
   - Output: `{ major: 2; minor: 1; patch: 0; tag: "beta.1" }`.
2. `S2` fails first branch (no `-`), matches second branch:
   - `M = 2`, `N = 1`, `P = 0`, `tag = null`.
   - Output: `{ major: 2; minor: 1; patch: 0; tag: null }`.

---

### Puzzle 15: Dot-Path Traversal Beyond Leaves

```typescript
type SafeGet<T, P extends string> =
  P extends `${infer Key}.${infer Rest}`
    ? Key extends keyof T
      ? SafeGet<T[Key], Rest>
      : undefined
    : P extends keyof T
    ? T[P]
    : undefined;

type Data = { a: { b: number } };

type Test15A = SafeGet<Data, "a.b">;
type Test15B = SafeGet<Data, "a.b.c">;
```

**Step-by-Step Evaluation Trace:**
1. `Test15A`:
   - `Key = "a"`, `Rest = "b"`. `a` is in `Data`. Next: `SafeGet<Data["a"], "b">`.
   - `"b"` has no `.`, matches `keyof Data["a"]` -> returns `number`.
2. `Test15B`:
   - `Key = "a"`, `Rest = "b.c"`. `a` matches. Next: `SafeGet<Data["a"], "b.c">`.
   - `Key = "b"`, `Rest = "c"`. `b` is `number`. Next: `SafeGet<number, "c">`.
   - `"c"` is not a key of `number` -> returns `undefined`.
3. **Output Types:** `Test15A = number`, `Test15B = undefined`.


---

## 5. Four Complete Runnable Production Projects with Test Assertions

Every project below is a fully functional, self-contained TypeScript engine demonstrating production template literal metaprogramming. All class properties are explicitly declared for strict Node.js compatibility (`--experimental-strip-types`).

---

### Project 1: Type-Safe Full-Stack Route Dispatcher & URL Parameter Parser

#### Architectural Overview
```
+-------------------------------------------------------------------------+
|                  Type-Safe Full-Stack Route Dispatcher                  |
+-------------------------------------------------------------------------+
|  Route Pattern: "/api/v1/teams/:teamId/projects/:projectId"             |
|         │                                                               |
|  [ExtractRouteParams<Route>] ──► { teamId: string; projectId: string }  |
|         │                                                               |
|  [TypedRouteDispatcher]                                                 |
|    ├── register<P extends string>(method, path, handler)                |
|    └── dispatch(method, url): DispatchResult                            |
|         │                                                               |
|    (Regex compilation from route pattern with named capture groups)     |
+-------------------------------------------------------------------------+
```

#### Complete Implementation & Verification Suite
```typescript
import assert from "node:assert";

export type HttpMethod = "GET" | "POST" | "PUT" | "DELETE" | "PATCH";

export type ExtractRouteParams<Path extends string> =
  Path extends `${infer _Start}/:${infer Param}/${infer Rest}`
    ? { [K in Param | keyof ExtractRouteParams<`/${Rest}`>]: string }
    : Path extends `${infer _Start}/:${infer Param}`
    ? { [K in Param]: string }
    : Record<string, never>;

export interface RequestContext<Params> {
  method: HttpMethod;
  path: string;
  params: Params;
  query: Record<string, string>;
}

export type RouteHandler<Params> = (ctx: RequestContext<Params>) => any;

interface CompiledRoute {
  method: HttpMethod;
  pattern: string;
  regex: RegExp;
  paramNames: string[];
  handler: RouteHandler<any>;
}

export class TypedRouteDispatcher {
  private routes: CompiledRoute[];

  constructor() {
    this.routes = [];
  }

  public register<Path extends string>(
    method: HttpMethod,
    path: Path,
    handler: RouteHandler<ExtractRouteParams<Path>>
  ): void {
    const paramNames: string[] = [];
    const regexPattern = path.replace(/:([a-zA-Z0-9_]+)/g, (_, name) => {
      paramNames.push(name);
      return "([^/]+)";
    });

    this.routes.push({
      method,
      pattern: path,
      regex: new RegExp(`^${regexPattern}$`),
      paramNames,
      handler,
    });
  }

  public dispatch(method: HttpMethod, url: string): any {
    const [pathname, queryString] = url.split("?");
    const query: Record<string, string> = {};

    if (queryString) {
      for (const pair of queryString.split("&")) {
        const [k, v] = pair.split("=");
        if (k) query[decodeURIComponent(k)] = decodeURIComponent(v ?? "");
      }
    }

    for (const route of this.routes) {
      if (route.method !== method) continue;
      const match = pathname.match(route.regex);
      if (match) {
        const params: Record<string, string> = {};
        for (let i = 0; i < route.paramNames.length; i++) {
          params[route.paramNames[i]] = match[i + 1];
        }

        return route.handler({
          method,
          path: pathname,
          params,
          query,
        });
      }
    }

    throw new Error(`Route not found: ${method} ${pathname}`);
  }
}

// Verification Assertions
const router = new TypedRouteDispatcher();

router.register(
  "GET",
  "/api/v1/tenants/:tenantId/users/:userId",
  (ctx) => {
    // Compile-time verified: ctx.params has tenantId and userId
    return {
      message: `User ${ctx.params.userId} retrieved for tenant ${ctx.params.tenantId}`,
      filter: ctx.query.filter ?? "none",
    };
  }
);

router.register("GET", "/health", () => {
  return { status: "healthy" };
});

// Test parametric dispatch
const res1 = router.dispatch("GET", "/api/v1/tenants/t_corp/users/u_42?filter=active");
assert.strictEqual(
  res1.message,
  "User u_42 retrieved for tenant t_corp"
);
assert.strictEqual(res1.filter, "active");

// Test static dispatch
const res2 = router.dispatch("GET", "/health");
assert.strictEqual(res2.status, "healthy");

// Test 404 error
assert.throws(() => {
  router.dispatch("POST", "/api/v1/tenants/t_corp/users/u_42");
}, /Route not found: POST/);

console.log("Project 1 (Typed Route Dispatcher) passed all assertions.");
```

---

### Project 2: Type-Safe Internationalization (i18n) Engine with Interpolation Grammar

#### Architectural Overview
```
+-------------------------------------------------------------------------+
|                  Type-Safe Internationalization (i18n)                  |
+-------------------------------------------------------------------------+
|  Locale Catalog: { "welcome": "Welcome back {name}, balance: {amount}" }|
|         │                                                               |
|  [ExtractInterpolationKeys<S>] ──► "name" | "amount"                    |
|         │                                                               |
|  [I18nEngine<Schema>]                                                   |
|    ├── setLocale(locale)                                                |
|    └── t<Key>(key, params) ──► Strict compile-time required arguments  |
|         │                                                               |
|    (Handles pluralization tokens & locale fallbacks)                    |
+-------------------------------------------------------------------------+
```

#### Complete Implementation & Verification Suite
```typescript
import assert from "node:assert";

export type ExtractPlaceholders<S extends string> =
  S extends `${infer _Before}{${infer Param}}${infer Rest}`
    ? Param | ExtractPlaceholders<Rest>
    : never;

export type TranslationArgs<S extends string> =
  [ExtractPlaceholders<S>] extends [never]
    ? []
    : [params: { [K in ExtractPlaceholders<S>]: string | number }];

export class I18nEngine<
  Locales extends string,
  Schema extends Record<string, string>
> {
  private currentLocale: Locales;
  private catalogs: Map<Locales, Schema>;
  private fallbackLocale: Locales;

  constructor(defaultLocale: Locales, fallbackLocale: Locales) {
    this.currentLocale = defaultLocale;
    this.fallbackLocale = fallbackLocale;
    this.catalogs = new Map();
  }

  public registerCatalog(locale: Locales, catalog: Schema): void {
    this.catalogs.set(locale, catalog);
  }

  public setLocale(locale: Locales): void {
    if (!this.catalogs.has(locale)) {
      throw new Error(`Locale '${locale}' is not registered`);
    }
    this.currentLocale = locale;
  }

  public t<Key extends keyof Schema & string>(
    key: Key,
    ...args: TranslationArgs<Schema[Key]>
  ): string {
    const catalog = this.catalogs.get(this.currentLocale) ?? this.catalogs.get(this.fallbackLocale);
    if (!catalog) {
      throw new Error(`No catalog available for locale: ${this.currentLocale}`);
    }

    const template = catalog[key];
    if (template === undefined) {
      throw new Error(`Missing translation key: ${key}`);
    }

    if (args.length === 0 || !args[0]) {
      return template;
    }

    let result = template;
    const params = args[0] as Record<string, string | number>;
    for (const [paramKey, paramVal] of Object.entries(params)) {
      result = result.replace(new RegExp(`{${paramKey}}`, "g"), String(paramVal));
    }

    return result;
  }
}

// Verification Assertions
const enDictionary = {
  greeting: "Hello {name}, welcome to Antigravity!",
  unreadMessages: "You have {count} unread notifications.",
  appStatus: "System is online.",
};

const esDictionary = {
  greeting: "¡Hola {name}, bienvenido a Antigravity!",
  unreadMessages: "Tienes {count} notificaciones sin leer.",
  appStatus: "El sistema está en línea.",
};

const i18n = new I18nEngine<"en" | "es", typeof enDictionary>("en", "en");
i18n.registerCatalog("en", enDictionary);
i18n.registerCatalog("es", esDictionary);

// English translations
const greetingEn = i18n.t("greeting", { name: "Alice" });
assert.strictEqual(greetingEn, "Hello Alice, welcome to Antigravity!");

const statusEn = i18n.t("appStatus");
assert.strictEqual(statusEn, "System is online.");

// Spanish translations
i18n.setLocale("es");
const greetingEs = i18n.t("greeting", { name: "Carlos" });
assert.strictEqual(greetingEs, "¡Hola Carlos, bienvenido a Antigravity!");

const messagesEs = i18n.t("unreadMessages", { count: 5 });
assert.strictEqual(messagesEs, "Tienes 5 notificaciones sin leer.");

console.log("Project 2 (Type-Safe i18n Engine) passed all assertions.");
```

---

### Project 3: Type-Safe In-Memory SQL Query Engine & Syntax Parser

#### Architectural Overview
```
+-------------------------------------------------------------------------+
|                  Type-Safe In-Memory SQL Query Engine                   |
+-------------------------------------------------------------------------+
|  SQL String: "SELECT id, name FROM users WHERE age > 18"                |
|         │                                                               |
|  [SQL Syntax Lexer & AST Parser]                                        |
|         │                                                               |
|  [Compile-Time Projection Validation]                                   |
|    └── ParseSelectQuery<Query, DatabaseSchema> ──► Typed Result Shape   |
|         │                                                               |
|  [QueryExecutor]                                                        |
|    └── execute(query, db): Pick<Row, Columns>[]                         |
+-------------------------------------------------------------------------+
```

#### Complete Implementation & Verification Suite
```typescript
import assert from "node:assert";

export interface DatabaseTables {
  users: { id: number; name: string; age: number; role: string };
  orders: { orderId: string; userId: number; amount: number; isPaid: boolean };
}

type SplitCols<S extends string> =
  S extends `${infer Col}, ${infer Rest}`
    ? Col | SplitCols<Rest>
    : S extends `${infer Single}`
    ? Single
    : never;

export type ParseSQL<
  Q extends string,
  Schema extends Record<string, Record<string, any>>
> =
  Q extends `SELECT ${infer Cols} FROM ${infer Table} WHERE ${infer _Where}`
    ? Table extends keyof Schema
      ? Cols extends "*"
        ? Schema[Table]
        : { [K in SplitCols<Cols> as K extends keyof Schema[Table] ? K : never]: Schema[Table][K & keyof Schema[Table]] }
      : never
    : Q extends `SELECT ${infer Cols} FROM ${infer Table}`
    ? Table extends keyof Schema
      ? Cols extends "*"
        ? Schema[Table]
        : { [K in SplitCols<Cols> as K extends keyof Schema[Table] ? K : never]: Schema[Table][K & keyof Schema[Table]] }
      : never
    : never;

export class InMemorySQLEngine<Schema extends Record<string, Record<string, any>>> {
  private tables: { [K in keyof Schema]?: Schema[K][] };

  constructor() {
    this.tables = {};
  }

  public insert<Table extends keyof Schema>(table: Table, row: Schema[Table]): void {
    if (!this.tables[table]) {
      this.tables[table] = [];
    }
    this.tables[table]!.push(row);
  }

  public query<Q extends string>(queryString: Q): ParseSQL<Q, Schema>[] {
    const trimmed = queryString.trim();
    const selectMatch = trimmed.match(/^SELECT\s+(.+?)\s+FROM\s+([a-zA-Z0-9_]+)(?:\s+WHERE\s+(.+))?$/i);

    if (!selectMatch) {
      throw new Error(`Invalid SQL syntax: "${queryString}"`);
    }

    const [, rawCols, rawTable, rawWhere] = selectMatch;
    const tableKey = rawTable as keyof Schema;
    const tableData = this.tables[tableKey] ?? [];

    let filteredRows = [...tableData];

    // Simple WHERE clause parsing: "field = value" or "field > value"
    if (rawWhere) {
      const whereMatch = rawWhere.trim().match(/^([a-zA-Z0-9_]+)\s*(=|>|<)\s*(.+)$/);
      if (whereMatch) {
        const [, field, op, rawVal] = whereMatch;
        let compVal: any = rawVal.replace(/^['"]|['"]$/g, "");
        if (!isNaN(Number(compVal))) compVal = Number(compVal);

        filteredRows = filteredRows.filter((row) => {
          const val = row[field];
          if (op === "=") return val === compVal;
          if (op === ">") return val > compVal;
          if (op === "<") return val < compVal;
          return true;
        });
      }
    }

    // Column projection
    if (rawCols.trim() === "*") {
      return filteredRows as ParseSQL<Q, Schema>[];
    }

    const projectedColumns = rawCols.split(",").map((c) => c.trim());
    return filteredRows.map((row) => {
      const projected: any = {};
      for (const col of projectedColumns) {
        projected[col] = row[col];
      }
      return projected;
    }) as ParseSQL<Q, Schema>[];
  }
}

// Verification Assertions
const db = new InMemorySQLEngine<DatabaseTables>();

db.insert("users", { id: 1, name: "Alice", age: 30, role: "admin" });
db.insert("users", { id: 2, name: "Bob", age: 17, role: "guest" });
db.insert("users", { id: 3, name: "Charlie", age: 25, role: "admin" });

// Query with WHERE clause
const adultAdmins = db.query("SELECT name, age FROM users WHERE age > 18");

assert.strictEqual(adultAdmins.length, 2);
assert.deepStrictEqual(adultAdmins[0], { name: "Alice", age: 30 });
assert.deepStrictEqual(adultAdmins[1], { name: "Charlie", age: 25 });

// Non-selected fields are omitted
assert.strictEqual((adultAdmins[0] as any).id, undefined);
assert.strictEqual((adultAdmins[0] as any).role, undefined);

// Wildcard query
const allUsers = db.query("SELECT * FROM users");
assert.strictEqual(allUsers.length, 3);
assert.strictEqual(allUsers[0].role, "admin");

console.log("Project 3 (In-Memory SQL Engine) passed all assertions.");
```

---

### Project 4: Type-Safe CSS-in-JS Utility Compiler & Design Token DSL

#### Architectural Overview
```
+-------------------------------------------------------------------------+
|                  Type-Safe CSS Utility Compiler & Token DSL             |
+-------------------------------------------------------------------------+
|  Utility Token DSL: `${Modifier}${Property}-${Scale}`                   |
|         │                                                               |
|  [TailwindClass Validator] ──► Validates valid utilities at compile time|
|         │                                                               |
|  [CssUtilityCompiler]                                                   |
|    ├── addClasses(...tokens)                                            |
|    ├── generateStyleSheet(): string                                     |
|    └── deduplicate()                                                    |
+-------------------------------------------------------------------------+
```

#### Complete Implementation & Verification Suite
```typescript
import assert from "node:assert";

export type UtilityPrefix = "p" | "m" | "text" | "bg" | "rounded";
export type Scale = "sm" | "md" | "lg" | "xl" | "none";
export type VariantModifier = "" | "hover:" | "focus:";

export type UtilityClass = `${VariantModifier}${UtilityPrefix}-${Scale}`;

interface CssRule {
  selector: string;
  css: string;
}

export class CssUtilityCompiler {
  private activeClasses: Set<UtilityClass>;
  private tokenMap: Record<UtilityPrefix, Record<Scale, string>>;

  constructor() {
    this.activeClasses = new Set();
    this.tokenMap = {
      p: {
        none: "padding: 0;",
        sm: "padding: 0.25rem;",
        md: "padding: 0.5rem;",
        lg: "padding: 1rem;",
        xl: "padding: 2rem;",
      },
      m: {
        none: "margin: 0;",
        sm: "margin: 0.25rem;",
        md: "margin: 0.5rem;",
        lg: "margin: 1rem;",
        xl: "margin: 2rem;",
      },
      text: {
        none: "font-size: 0;",
        sm: "font-size: 0.875rem;",
        md: "font-size: 1rem;",
        lg: "font-size: 1.125rem;",
        xl: "font-size: 1.25rem;",
      },
      bg: {
        none: "background-color: transparent;",
        sm: "background-color: #f1f5f9;",
        md: "background-color: #cbd5e1;",
        lg: "background-color: #64748b;",
        xl: "background-color: #0f172a;",
      },
      rounded: {
        none: "border-radius: 0;",
        sm: "border-radius: 0.125rem;",
        md: "border-radius: 0.25rem;",
        lg: "border-radius: 0.5rem;",
        xl: "border-radius: 1rem;",
      },
    };
  }

  public addClass(...classes: UtilityClass[]): this {
    for (const cls of classes) {
      this.activeClasses.add(cls);
    }
    return this;
  }

  public compileRule(className: UtilityClass): CssRule {
    let modifier = "";
    let rawClass = className as string;

    if (rawClass.startsWith("hover:")) {
      modifier = ":hover";
      rawClass = rawClass.slice(6);
    } else if (rawClass.startsWith("focus:")) {
      modifier = ":focus";
      rawClass = rawClass.slice(6);
    }

    const [prefix, scale] = rawClass.split("-") as [UtilityPrefix, Scale];
    const propertyCss = this.tokenMap[prefix]?.[scale] ?? "/* unknown */";
    const escapedSelector = `.${className.replace(":", "\\:")}${modifier}`;

    return {
      selector: escapedSelector,
      css: `${escapedSelector} { ${propertyCss} }`,
    };
  }

  public generateStyleSheet(): string {
    const rules: string[] = [];
    for (const cls of this.activeClasses) {
      rules.push(this.compileRule(cls).css);
    }
    return rules.join("\n");
  }

  public getClassNames(): string {
    return Array.from(this.activeClasses).join(" ");
  }
}

// Verification Assertions
const compiler = new CssUtilityCompiler();

compiler.addClass("p-md", "m-lg", "hover:bg-xl", "rounded-md");

const styleSheet = compiler.generateStyleSheet();

assert.ok(styleSheet.includes(".p-md { padding: 0.5rem; }"));
assert.ok(styleSheet.includes(".m-lg { margin: 1rem; }"));
assert.ok(styleSheet.includes(".hover\\:bg-xl:hover { background-color: #0f172a; }"));
assert.ok(styleSheet.includes(".rounded-md { border-radius: 0.25rem; }"));

// Class name deduplication check
compiler.addClass("p-md");
assert.strictEqual(compiler.getClassNames().split(" ").length, 4);

console.log("Project 4 (CSS Utility Compiler) passed all assertions.");
```


---

## 6. Enterprise Best Practices: 20 DOs and DON'Ts

| # | Rule | Bad Practice (DON'T) | Best Practice (DO) | Architectural Impact |
|---|------|----------------------|--------------------|----------------------|
| 1 | **Union Cardinality Control** | Multiplying large unions `${U1}_${U2}_${U3}` without cardinality checks | Bound union sizes or factor expressions into structured objects | Exceeding 100,000 combinations crashes compilation with `TS2590`. |
| 2 | **String Intrinsics Usage** | Handcrafting lowercase/uppercase character lookup tables | Use native `Uppercase`, `Lowercase`, `Capitalize`, `Uncapitalize` | Native compiler intrinsics execute in V8 C++ with zero type recursion overhead. |
| 3 | **Delimited Inference** | `${infer A}${infer B}` expecting equal splitting | `${infer Head}/${infer Tail}` or `${infer Single}${infer Rest}` | Adjacent `infer` parameters assign 1 character to the left and everything to the right. |
| 4 | **Numeric Inference** | Hand-parsing numeric strings into union digits | Use `infer N extends number` (TS 4.8+) | Provides instant compile-time conversion of decimals, floats, and scientific notation. |
| 5 | **Tail-Call Optimization** | Writing recursive string transformers without accumulators | Accumulate output in a tail-positioned type parameter `Acc` | Increases recursion ceiling from ~50 to 1,000 iterations. |
| 6 | **Recursive Depth Guards** | Recursively traversing dot-paths without a counter on circular objects | Track recursion depth with `Depth['length'] extends 5 ? never : ...` | Prevents infinite compilation loops (`TS2589`). |
| 7 | **Route Parameter Isolation** | Matching `${string}:${infer Param}` | Matching `${infer _Start}/:${infer Param}/${infer Rest}` | Prevents catching URL protocol colons (`http://`) as route variables. |
| 8 | **Avoid `as const` Omission** | Inlining template strings into functions without `as const` | Add `as const` to template literal values passed to type-level parsers | Prevents TypeScript from widening literal types to general `string`. |
| 9 | **Index Signatures in Paths** | Generating dot paths on objects with `[x: string]: any` | Filter keys with `string extends K ? never : K` | Broad index signatures cause path generators to explode into infinite strings. |
| 10 | **Explicit Class Properties** | Using `constructor(private pattern: string)` in TS modules | Declare properties explicitly on class bodies | Guarantees compatibility with Node.js `--experimental-strip-types` and modern tooling. |
| 11 | **Handling Whitespace** | Matching only spaces `" "` in trim utilities | Include all whitespace characters: `" " \| "\t" \| "\n" \| "\r"` | Ensures robust parsing across multi-line template strings. |
| 12 | **Replace Edge Cases** | Omitting the empty string check `From extends ""` | Guard `From extends "" ? S : ...` | Matching empty strings can cause infinite recursion or premature termination. |
| 13 | **Boolean Parsing** | Matching `S extends "true" \| "false"` manually | Use `infer B extends boolean` (TS 4.8+) | Natively evaluates booleans into strict boolean literals. |
| 14 | **SemVer Build Metadata** | Ignoring build metadata `+build` in SemVer regexes | Parse both `-prerelease` and `+build` suffixes | Ensures spec compliance with Semantic Versioning 2.0.0. |
| 15 | **Case Conversion Idempotence** | Assuming `CamelToSnake<SnakeToCamel<S>> === S` without normalization | Ensure identifiers follow standard casing before round-trip transforms | Irregular uppercase sequences (`HTMLParser`) require explicit acronym boundary handling. |
| 16 | **Avoid Redundant Interpolation** | Writing `${string}` when `string` is already expected | Use `string` directly unless constrained by prefixes or suffixes | Keeps compiler type representation clean and fast. |
| 17 | **Format Specifiers Validation** | Accepting arbitrary format strings in `printf` wrappers | Validate format codes against a strict union (`%s` \| `%d` \| `%j`) | Prevents unhandled runtime formatting placeholders. |
| 18 | **Avoid Intermediate Massive Tuples** | Creating 10,000-element tuples just to measure character counts | Decompose strings hierarchically or cap length checks | Excessive tuple instantiations exhaust compiler memory. |
| 19 | **Distributive Template Conditionals** | Invoking template types over naked unions without distribution awareness | Distribute explicitly with `T extends any ? MyTemplate<T> : never` | Guarantees consistent union evaluation across all branches. |
| 20 | **Named Export of DSL Types** | Keeping complex template parsers buried inside function signatures | Export top-level type aliases for client SDK consumption | Improves IDE hover tooltips, autocomplete responsiveness, and `.d.ts` generation. |

---

## 7. Real-World Case Study: Enterprise REST & GraphQL SDK with Zero-Runtime Route Synthesis

### Problem Context
In enterprise microservice architectures, API client SDKs are notoriously vulnerable to drift. Developers hardcode URL paths, mistype URL path parameters, and guess query parameters. When backend routes change from `/api/v1/organizations/:orgId/billing` to `/api/v2/orgs/:orgId/billing-accounts`, runtime requests fail in production.

### Architectural Solution
Using TypeScript Template Literal Types, we synthesize a **Zero-Runtime-Cost API SDK**:
1. **Contract Registry**: Routes and HTTP methods are defined as literal templates.
2. **Compile-Time Param Extraction**: The SDK automatically demands the exact path parameters declared in the route string.
3. **Query Param Validation**: Query strings are validated against defined DTO interfaces.
4. **Zero Overhead**: The type system enforces complete correctness at build time; the runtime client compiles down to a lightweight 1 KB fetch wrapper.

```typescript
// 1. API Route Contract Definition
export interface ApiContracts {
  "GET /api/v1/tenants/:tenantId/users": {
    query: { page?: number; limit?: number; search?: string };
    response: { users: { id: string; name: string }[]; total: number };
  };
  "GET /api/v1/tenants/:tenantId/users/:userId": {
    query: Record<string, never>;
    response: { id: string; name: string; email: string };
  };
  "POST /api/v1/tenants/:tenantId/users": {
    query: Record<string, never>;
    body: { name: string; email: string; role: "admin" | "member" };
    response: { id: string; status: "created" };
  };
}

// 2. Type-Level Route Deconstruction
type ExtractPathFromContract<C extends string> =
  C extends `${string} ${infer Path}` ? Path : never;

type ExtractMethodFromContract<C extends string> =
  C extends `${infer Method} ${string}` ? Method : never;

// 3. Strongly Typed Client Engine
export class EnterpriseApiClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl.replace(/\/$/, "");
  }

  public async request<Route extends keyof ApiContracts & string>(
    route: Route,
    options: {
      params: ExtractRouteParams<ExtractPathFromContract<Route>>;
      query?: ApiContracts[Route] extends { query: infer Q } ? Q : never;
      body?: ApiContracts[Route] extends { body: infer B } ? B : never;
    }
  ): Promise<ApiContracts[Route]["response"]> {
    const [method, pathTemplate] = route.split(" ");
    let finalPath = pathTemplate;

    // Substitute URL parameters
    for (const [key, val] of Object.entries(options.params)) {
      finalPath = finalPath.replace(`:${key}`, encodeURIComponent(String(val)));
    }

    const url = new URL(`${this.baseUrl}${finalPath}`);

    // Attach Query Params
    if (options.query) {
      for (const [qKey, qVal] of Object.entries(options.query as Record<string, any>)) {
        if (qVal !== undefined) {
          url.searchParams.append(qKey, String(qVal));
        }
      }
    }

    // In production, execute native fetch:
    // return (await fetch(url.toString(), { method, body: JSON.stringify(options.body) })).json();
    return { mockResponse: true } as any;
  }
}
```

---

## 8. Practice Drills (75 Drills across 5 Progression Tiers)

### Tier 1: Syntax & Built-in Intrinsics (Drills 1–15)
1. Write a template literal type that combines `"admin"` and `"user"` with `"_read"` and `"_write"`.
2. Use `Uppercase<S>` to convert `"pending_review"` to `"PENDING_REVIEW"`.
3. Use `Lowercase<S>` to convert `"SERVER_ERROR"` to `"server_error"`.
4. Use `Capitalize<S>` to convert `"userService"` to `"UserService"`.
5. Use `Uncapitalize<S>` to convert `"OrderModel"` to `"orderModel"`.
6. Demonstrate that string intrinsics distribute over unions of 5 strings.
7. Construct a `ColorHex` type matching `#${string}`.
8. Construct an `AbsoluteUrl` type requiring `"http://"` or `"https://"`.
9. Write a template type that validates ports between standard web services (`${Protocol}:${Port}`).
10. Verify the behavior of `Capitalize<"">` on an empty string.
11. Test `Capitalize<"123abc">` (starting with digits).
12. Construct a `Greeting<Name>` type that yields `"Hello, ${Name}!"`.
13. Create an `EventName<Domain, Action>` type combining two string generic parameters.
14. Inspect what happens when passing `any` to a template literal type.
15. Inspect what happens when passing `never` to a template literal type.

### Tier 2: Pattern Matching & Parsing with `infer` (Drills 16–30)
16. Implement `StartsWith<S, Prefix>` returning `true` or `false`.
17. Implement `EndsWith<S, Suffix>` returning `true` or `false`.
18. Implement `Includes<S, Substring>` returning `true` or `false`.
19. Implement `FirstChar<S>` extracting only the first character.
20. Implement `LastChar<S>` extracting only the final character using recursion.
21. Implement `DropFirstChar<S>` returning all characters except the first.
22. Implement `DropLastChar<S>` returning all characters except the last.
23. Implement `Split<S, Delimiter>` returning a tuple of string chunks.
24. Implement `Join<Tuple, Delimiter>` joining a tuple of strings.
25. Implement `TrimStart<S>` removing leading whitespace.
26. Implement `TrimEnd<S>` removing trailing whitespace.
27. Implement `Trim<S>` removing both leading and trailing whitespace.
28. Implement `Replace<S, From, To>` for single replacements.
29. Implement `ReplaceAll<S, From, To>` for recursive global replacements.
30. Implement `Repeat<S, N>` repeating string `S` $N$ times using a tuple accumulator.

### Tier 3: Case Conversion & String Transformers (Drills 31–45)
31. Implement `SnakeToCamel<S>` (`"user_profile_id"` -> `"userProfileId"`).
32. Implement `CamelToSnake<S>` (`"userProfileId"` -> `"user_profile_id"`).
33. Implement `KebabToCamel<S>` (`"background-color"` -> `"backgroundColor"`).
34. Implement `CamelToKebab<S>` (`"backgroundColor"` -> `"background-color"`).
35. Implement `PascalToCamel<S>` (`"OrderService"` -> `"orderService"`).
36. Implement `CamelToPascal<S>` (`"orderService"` -> `"OrderService"`).
37. Implement `ScreamingSnakeToCamel<S>` (`"ORDER_STATUS_PENDING"` -> `"orderStatusPending"`).
38. Implement `CamelToScreamingSnake<S>` (`"orderStatusPending"` -> `"ORDER_STATUS_PENDING"`).
39. Write a mapped type `CamelCaseKeys<T>` converting all object keys to camelCase.
40. Write a mapped type `SnakeCaseKeys<T>` converting all object keys to snake_case.
41. Write a mapped type `UppercaseKeys<T>` converting all object keys to uppercase.
42. Implement a type-safe string reversal utility `Reverse<S>`.
43. Implement `IsPalindrome<S>` checking if a string is symmetric.
44. Write a utility that extracts all capital letters from a camelCase identifier.
45. Implement `PadStart<S, Length, Char>` at the type level.

### Tier 4: Compile-Time Grammars & Domain DSLs (Drills 46–60)
46. Implement `ExtractRouteParams<Path>` extracting `:param` tokens from URL paths.
47. Implement `ExtractBraceParams<Path>` extracting `{param}` tokens from OpenAPI paths.
48. Implement `ParseQueryString<Q>` parsing `?key=val&key2=val2` into an object type.
49. Implement a compile-time SemVer validator (`${Major}.${Minor}.${Patch}`).
50. Extend the SemVer validator to support pre-release tags (`-alpha.1`).
51. Implement a compile-time IPv4 validator (`${Octet}.${Octet}.${Octet}.${Octet}`).
52. Implement a compile-time MAC Address validator.
53. Implement a compile-time 6-digit Hex Color validator (`#RRGGBB`).
54. Implement a compile-time CSS unit validator (`${number}${"px"|"rem"|"em"|"%"}`).
55. Implement a compile-time CSS `calc()` expression validator.
56. Implement `ParseMarkdownLink<S>` extracting text and URL from `[text](url)`.
57. Implement `ParseCliFlags<S>` extracting `--key=value` pairs into an object.
58. Implement `ParseEnvVar<S>` extracting variable names from `"${VAR_NAME}"`.
59. Implement `ExtractFormatArgs<S>` for `printf`-style strings (`%s`, `%d`, `%j`).
60. Implement `SafeObjectPaths<T>` generating a union of valid dot-paths with recursion limits.

### Tier 5: Enterprise Framework Architecture & Synthesis (Drills 61–75)
61. Build an Express/Fastify-style router that rejects handler registrations if URL params do not match.
62. Synthesize an API Client SDK from a union of HTTP endpoint definitions.
63. Build an i18n translation engine that enforces all required placeholder arguments.
64. Construct a type-safe in-memory SQL query engine parsing column projections.
65. Build a Tailwind-style CSS utility compiler and deduplicator.
66. Construct a type-safe event-bus with wildcard and namespaced channels (`"auth:*"`).
67. Build a Redis hierarchical key generator with compile-time tenant scoping.
68. Design a Kafka topic router validating region, environment, and domain names.
69. Create a JSON Pointer resolver (RFC 6901) navigating nested structures via `/a/b/c`.
70. Build a type-safe URL query builder ensuring no missing required search parameters.
71. Construct a microservice RPC client validating methods and parameters from contract strings.
72. Implement tail-call optimized string length measurement handling 500+ character strings.
73. Construct a type-safe GraphQL query selection set parser.
74. Build a state-machine transition validator ensuring events match `${FromState}_TO_${ToState}`.
75. Design a complete Zero-Overhead HTTP SDK client verifying query, params, and body at build time.


---

