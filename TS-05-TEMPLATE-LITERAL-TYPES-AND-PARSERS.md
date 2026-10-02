# Module TS-05: Template Literal Types & Type Parsers

Welcome to TypeScript Template Literal Types and Type Parsers. This module teaches how to build compile-time string patterns, manipulate text at the type level, extract route parameters, and build type-safe path accessors.

---

# Topic 1: What Are Template Literal Types? (`${Prefix}_${Suffix}`)

### 1. What is it?
Introduced in TypeScript 4.1, a template literal type uses the same backtick syntax as JavaScript template strings (`` `hello ${name}` ``), but operates entirely in type space.

It allows you to concatenate string literals, enforce string formatting rules, and construct new string types dynamically:
```typescript
type World = "world";
type Greeting = `hello ${World}`; // "hello world"
```

### 2. Why does it exist?
In JavaScript, strings often follow structured formats (such as CSS units `"10px"`, event names `"on_click"`, or HTTP routes `"/api/users"`).

Without template literal types, TypeScript can only treat these values as broad `string`s (which allows typos like `"10p"` or `"on-clck"`) or require you to manually write hundreds of individual string literal types. Template literal types let you declare rules for string formats that the compiler checks automatically.

### 3. Basic example

```typescript
type Unit = "px" | "em" | "rem";
type Size = 10 | 20 | 50;

// Construct a valid CSS dimension type:
type Dimension = `${Size}${Unit}`;

const valid1: Dimension = "10px";  // Allowed
const valid2: Dimension = "50rem"; // Allowed
// const invalid: Dimension = "100px"; // Compile Error: 100 is not in Size!
// const typo: Dimension = "10p";      // Compile Error: '10p' is not valid!
```

**Line-by-line explanation:**
- `type Unit = "px" | "em" | "rem";`: A union of three allowed units.
- `type Size = 10 | 20 | 50;`: A union of three allowed numeric sizes.
- `type Dimension = `${Size}${Unit}`;`: Combines them. TypeScript generates all valid combinations: `"10px" | "10em" | "10rem" | "20px" ...`.
- `valid1` and `valid2` match the generated combinations and compile cleanly.
- `invalid` and `typo` fail because they are not in the generated set of types.

---

### 4. How it works inside TypeScript
1. **Interpolation Expansion**: The compiler evaluates expressions inside `${...}`.
2. **Type Coercion**: Numbers, strings, booleans, and bigints inside `${...}` are converted to their string representations.
3. **Set Generation**: If you interpolate union types, TypeScript automatically computes all possible combinations (the Cartesian product).

---

### 5. Think first

What is the resulting type of `Notification` in the code below? Decide first.

```typescript
type Status = "success" | "error";
type Notification = `STATUS_${Status}`;
```

---

**Answer and Reason:**

The resulting type is:

```typescript
"STATUS_success" | "STATUS_error"
```

**Reason**: Interpolating the union `"success" | "error"` into `` `STATUS_${Status}` `` distributes across the union, producing two distinct string literal types.

---

### 6. Try it yourself
Create a type `Color = "red" | "blue"`. Create a type `Shade = "light" | "dark"`. Create a template literal type `ThemedColor = `${Shade}-${Color}``. Test assigning `"light-red"` and `"dark-green"`.

---

### 7. More examples

#### Example A: Hex Color Code Validation (Medium)

```typescript
type HexDigit = "0" | "1" | "2" | "3" | "4" | "5" | "6" | "7" | "8" | "9" | "a" | "b" | "c" | "d" | "e" | "f";
type ShortHexColor = `#${HexDigit}${HexDigit}${HexDigit}`;

const color1: ShortHexColor = "#fff"; // Valid
const color2: ShortHexColor = "#000"; // Valid
// const bad: ShortHexColor = "#ggg"; // Error: 'g' is not a valid hex digit!
```

**Line-by-line explanation:**
- Strictly enforces that the string begins with `#` and contains three valid hex characters.

---

### 8. Common mistakes

#### Mistake 1: Trying to interpolate objects or symbols

**Wrong code:**
```typescript
type Bad = `${{ name: string }}`; // Error!
```

**Why it happens:**
Only primitive types that can be serialized to text (`string`, `number`, `boolean`, `bigint`, `null`, `undefined`) can be placed inside `${...}`.

---

### 9. Rules to remember
1. Template literal types use backticks `` `...` `` in type space.
2. Interpolating unions computes all valid combinations automatically.
3. Numbers and booleans inside `${...}` are stringified into literal types.

---

### 10. Exercises

#### Question 1 (Predict the compile result)
What is the resulting type of `Route`?
```typescript
type Version = 1 | 2;
type Route = `/v${Version}/api`;
```

#### Question 2 (Find and fix the bug)
Fix the syntax error in the template literal type:
```typescript
type Event = "on_" + "click"; // Bug: Plus operator does not work in type space!
```

#### Question 3 (Write code from scratch)
Define a type `HttpMethod = "get" | "post"`. Create a type `Endpoint = `${Uppercase<HttpMethod>} /api``.

#### Question 4 (Explain in your own words)
How do template literal types prevent typos in string parameters like CSS units or API routes?

---

### Solutions

#### Solution to Question 1
**Hint 1**: Substitute each number into the template.

**Answer**:
`Route` evaluates to `"/v1/api" | "/v2/api"`.

#### Solution to Question 2
**Hint 1**: Use backtick syntax with `${...}`.

**Answer**:
```typescript
type Event = `on_${"click"}`;
```

#### Solution to Question 3
**Hint 1**: Combine `Uppercase` with the template literal.

**Answer**:
```typescript
type HttpMethod = "get" | "post";
type Endpoint = `${Uppercase<HttpMethod>} /api`;
// "GET /api" | "POST /api"
```

#### Solution to Question 4
**Hint 1**: Think about what happens if you pass `"10pxx"` instead of `"10px"`.

**Answer**:
Without template literal types, functions must accept broad `string`s, which allows typos to compile silently and fail at runtime. Template literal types restrict the allowed string values to an exact pattern, so the compiler rejects any misspelled unit or route before the code ever runs.

---

### 11. Recall

1. What syntax introduces a template literal type?
2. What happens when you interpolate a union type into a template literal?
3. Can numbers be interpolated into template literal types?

**If you remember only one thing:**
Template literal types let you construct and enforce structured string patterns at compile time.

---

# Topic 2: Union Distribution and Combinatorial String Generation

### 1. What is it?
When multiple union types are interpolated into a single template literal type, TypeScript automatically computes the **Cartesian product** (all possible combinations) across all positions:
```typescript
type Vertical = "top" | "bottom";
type Horizontal = "left" | "right";
type Position = `${Vertical}-${Horizontal}`;
// "top-left" | "top-right" | "bottom-left" | "bottom-right"
```

### 2. Why does it exist?
In design systems, UI frameworks, and protocol definitions, properties often consist of compound options:
- Button variants: `("primary" | "secondary")` + `("sm" | "md" | "lg")`.
- Alignments: `("top" | "center" | "bottom")` + `("left" | "center" | "right")`.

Writing all 9 or 12 permutations manually is repetitive and easy to get wrong. Combinatorial string generation synthesizes all valid combinations automatically.

### 3. Basic example

```typescript
type Speed = "fast" | "slow";
type Animation = "fade" | "slide" | "zoom";

type ClassName = `animate-${Animation}-${Speed}`;

// Automatically generates 2 * 3 = 6 combinations:
// "animate-fade-fast"  | "animate-fade-slow"
// "animate-slide-fast" | "animate-slide-slow"
// "animate-zoom-fast"  | "animate-zoom-slow"

const myClass: ClassName = "animate-slide-fast"; // Valid
// const badClass: ClassName = "animate-fade-normal"; // Error!
```

**Line-by-line explanation:**
- `Speed` has 2 members. `Animation` has 3 members.
- `` `animate-${Animation}-${Speed}` `` multiplies them: $2 \times 3 = 6$ total literal types.
- Every valid combination is accepted; any other string is rejected.

---

### 4. How it works inside TypeScript
1. **Multi-Slot Expansion**: If there are $N$ interpolation slots, the compiler expands each slot independently.
2. **Permutation Matrix**: It combines every member of slot 1 with every member of slot 2, slot 3, and so on.
3. **Union Flattening**: All resulting strings are flattened into a single union type.

---

### 5. Think first

How many members does `AlertKey` have in the code below? Decide first.

```typescript
type Priority = "low" | "medium" | "high";
type Category = "system" | "network";
type AlertKey = `alert:${Category}:${Priority}`;
```

---

**Answer and Reason:**

`AlertKey` has **6** members.

**Reason**: 3 priority values multiplied by 2 category values: $3 \times 2 = 6$ distinct string literal combinations.

---

### 6. Try it yourself
Create `type MarginSide = "top" | "bottom" | "left" | "right"`. Create `type MarginSize = 0 | 1 | 2 | 4 | 8`. Create a template literal type `MarginUtility = `m-${MarginSide}-${MarginSize}``. Verify that `"m-top-4"` is valid.

---

### 7. More examples

#### Example A: Grid Coordinates (Medium)

```typescript
type Column = "A" | "B" | "C";
type Row = 1 | 2 | 3;

type ChessSquare = `${Column}${Row}`;
// "A1" | "A2" | "A3" | "B1" | "B2" | "B3" | "C1" | "C2" | "C3"
```

---

### 8. Common mistakes

#### Mistake 1: Accidentally creating millions of combinations (Union Explosion)

**Wrong code:**
```typescript
type Char = "a" | "b" | "c" | "d" | "e" | "f" | "g" | "h" | "i" | "j";
type SixChars = `${Char}${Char}${Char}${Char}${Char}${Char}`;
// 10 * 10 * 10 * 10 * 10 * 10 = 1,000,000 combinations!
// Error TS2590: Expression produces a union type that is too complex to represent.
```

**Why it happens:**
TypeScript caps union complexity at approximately 100,000 members. Multiplying large unions exceeds this limit.

---

### 9. Rules to remember
1. Multiple unions in a template literal generate all permutations ($M \times N$).
2. Total combinations equal the product of the sizes of each union.
3. Keep union sizes modest to avoid compiler complexity errors (TS2590).

---

### 10. Exercises

#### Question 1 (Predict the compile result)
How many union members are in `Result`?
```typescript
type A = "x" | "y";
type B = 1 | 2;
type C = "alpha" | "beta";
type Result = `${A}_${B}_${C}`;
```

#### Question 2 (Find and fix the bug)
The code below is supposed to allow `"btn-primary"` and `"btn-danger"`, but has a syntax error. Fix it:
```typescript
type Variant = "primary" | "danger";
type BtnClass = `btn-${Variant);
```

#### Question 3 (Write code from scratch)
Define `type Prefix = "dev" | "prod"` and `type Service = "auth" | "db" | "api"`. Generate a type `ClusterNode = `${Prefix}-${Service}-node``.

#### Question 4 (Explain in your own words)
Why does interpolating unions in template literals generate combinations rather than evaluating to a single string?

---

### Solutions

#### Solution to Question 1
**Hint 1**: Multiply $2 \times 2 \times 2$.

**Answer**:
`Result` has 8 union members.

#### Solution to Question 2
**Hint 1**: Close the template interpolation with `}` instead of `)`.

**Answer**:
```typescript
type Variant = "primary" | "danger";
type BtnClass = `btn-${Variant}`;
```

#### Solution to Question 3
**Hint 1**: Combine `Prefix` and `Service`.

**Answer**:
```typescript
type Prefix = "dev" | "prod";
type Service = "auth" | "db" | "api";
type ClusterNode = `${Prefix}-${Service}-node`;
```

#### Solution to Question 4
**Hint 1**: Remember distributive evaluation from earlier modules.

**Answer**:
TypeScript distributes operations over unions. When a template literal contains a union, TypeScript evaluates the template for each individual union member across all slots, ensuring that every valid permutation is recognized as a valid type.

---

### 11. Recall

1. What mathematical operation describes how unions combine in template literals?
2. What error occurs if too many combinations are generated?
3. How many members does `${"a" | "b"}-${1 | 2}` have?

**If you remember only one thing:**
Interpolating multiple unions creates all permutations across all slots automatically.

---

# Topic 3: Intrinsic String Manipulation Types (`Uppercase`, `Lowercase`, `Capitalize`, `Uncapitalize`)

### 1. What is it?
TypeScript includes four built-in keyword types for manipulating string casing at compile time:
- `Uppercase<S>`: Converts all characters to uppercase.
- `Lowercase<S>`: Converts all characters to lowercase.
- `Capitalize<S>`: Converts the first character to uppercase.
- `Uncapitalize<S>`: Converts the first character to lowercase.

These are called **intrinsic** types because their logic is built directly into the compiler engine.

### 2. Why does it exist?
In JavaScript, naming conventions differ across domains:
- Constants use `UPPER_SNAKE_CASE`.
- Properties use `camelCase`.
- Classes and components use `PascalCase`.
- Event listeners prepend `on` and capitalize the event name (`onClick`, `onFocus`).

String intrinsic types allow you to transform string types from one casing convention to another without writing manual character conversion tables.

### 3. Basic example

```typescript
type Greeting = "hello world";

type Loud = Uppercase<Greeting>;     // "HELLO WORLD"
type Quiet = Lowercase<"SHOUTING">;  // "shouting"
type Title = Capitalize<"alex">;     // "Alex"
type Prop = Uncapitalize<"UserId">;  // "userId"
```

**Line-by-line explanation:**
- `Uppercase<"hello world">`: Converts every character, producing `"HELLO WORLD"`.
- `Lowercase<"SHOUTING">`: Converts every character, producing `"shouting"`.
- `Capitalize<"alex">`: Uppercases only the first character `"a"` to `"A"`, producing `"Alex"`.
- `Uncapitalize<"UserId">`: Lowercases only the first character `"U"` to `"u"`, producing `"userId"`.

---

### 4. How it works inside TypeScript
1. **Compiler Intrinsics**: These four types are defined with `type Uppercase<S extends string> = intrinsic;`. The compiler handles them internally.
2. **Distribution over Unions**: Intrinsics distribute over unions:
   `Capitalize<"apple" | "banana">` evaluates to `"Apple" | "Banana"`.
3. **Non-String Handling**: Non-alphabetical characters (numbers, underscores, dashes) are left unchanged.

---

### 5. Think first

What is the resulting type of `Result` in the code below? Decide first.

```typescript
type Action = "start" | "stop";
type HandlerName = `on${Capitalize<Action>}`;
```

---

**Answer and Reason:**

The resulting type is:

```typescript
"onStart" | "onStop"
```

**Reason**: `Capitalize` distributes over `"start"` and `"stop"`, producing `"Start"` and `"Stop"`. Prepending `"on"` results in `"onStart" | "onStop"`.

---

### 6. Try it yourself
Create a type `Status = "pending" | "approved" | "rejected"`. Write a type `EventName = `EVENT_${Uppercase<Status>}``. Verify the result.

---

### 7. More examples

#### Example A: Normalizing Case for API Headers (Medium)

```typescript
type RawHeader = "content-type" | "authorization" | "x-api-key";
type EnvVar = `HTTP_${Uppercase<ReplaceAll<RawHeader, "-", "_">>}`;
// We will learn ReplaceAll in Topic 7!
```

---

### 8. Common mistakes

#### Mistake 1: Expecting locale-specific transformations

**Explanation:**
TypeScript's intrinsics use standard Unicode mappings and do not consider browser locales (such as Turkish dotted/dotless `"i"`).

---

### 9. Rules to remember
1. Four intrinsics: `Uppercase`, `Lowercase`, `Capitalize`, `Uncapitalize`.
2. All four automatically distribute across union members.
3. Non-letter characters remain unchanged.

---

### 10. Exercises

#### Question 1 (Predict the compile result)
What is the resulting type of `T`?
```typescript
type T = Uncapitalize<"DARK_MODE">;
```

#### Question 2 (Find and fix the bug)
The code below fails to compile because `Uppercase` received a number. Fix it:
```typescript
type Code = Uppercase<404>;
```

#### Question 3 (Write code from scratch)
Write a type `ToGetterName<Prop extends string>` that takes a property name like `"age"` and returns `"getAge"`.

#### Question 4 (Explain in your own words)
Why are `Uppercase`, `Lowercase`, `Capitalize`, and `Uncapitalize` called "intrinsic" types in TypeScript?

---

### Solutions

#### Solution to Question 1
**Hint 1**: Only the very first character is affected by `Uncapitalize`.

**Answer**:
The type is `"dARK_MODE"`.

#### Solution to Question 2
**Hint 1**: Convert the number to a string literal `"404"`.

**Answer**:
```typescript
type Code = Uppercase<"404">;
```

#### Solution to Question 3
**Hint 1**: Use `` `get${Capitalize<Prop>}` ``.

**Answer**:
```typescript
type ToGetterName<Prop extends string> = `get${Capitalize<Prop>}`;
type Test = ToGetterName<"age">; // "getAge"
```

#### Solution to Question 4
**Hint 1**: Where is their logic implemented?

**Answer**:
They are called intrinsic because their transformation logic is implemented directly within the TypeScript compiler's source code (using JavaScript string methods like `.toUpperCase()`), rather than being defined as standard type aliases in `.d.ts` files.

---

### 11. Recall

1. What type capitalizes only the first letter of a string?
2. What type lowercases only the first letter of a string?
3. Do intrinsic string types distribute across unions?

**If you remember only one thing:**
Use `Capitalize`, `Uncapitalize`, `Uppercase`, and `Lowercase` to transform character casing at compile time.

---

# Topic 4: Pattern Matching Strings with `infer` (`${infer Head}/${infer Tail}`)

### 1. What is it?
When you combine template literal types with conditional types and the `infer` keyword, you can pattern match inside strings to extract substrings.

For example, you can extract the text before and after a delimiter:
```typescript
type Split<S> = S extends `${infer Head}/${infer Tail}`
  ? { head: Head; tail: Tail }
  : never;
```

### 2. Why does it exist?
Many software configurations and protocols encode structured information into strings:
- URLs: `"/users/123/profile"`
- File paths: `"src/components/Button.tsx"`
- Date strings: `"2026-10-02"`

Before template literal inference, TypeScript could not inspect or parse what was inside a string literal. String pattern matching lets you parse and validate internal substrings at compile time.

### 3. Basic example

```typescript
type ExtractProtocol<Url extends string> =
  Url extends `${infer Protocol}://${string}` ? Protocol : never;

type P1 = ExtractProtocol<"https://example.com">; // "https"
type P2 = ExtractProtocol<"ftp://files.org">;      // "ftp"
type P3 = ExtractProtocol<"invalid-url">;          // never
```

**Line-by-line explanation:**
- `Url extends `${infer Protocol}://${string}``:
  - Looks for the delimiter `"://"`.
  - Captures everything *before* `"://"` into the type variable `Protocol`.
  - Captures everything *after* `"://"` as a generic `string`.
- `"https://example.com"` matches: `Protocol` is bound to `"https"`.
- `"invalid-url"` does not contain `"://"`, so the condition evaluates to false and returns `never`.

---

### 4. How it works inside TypeScript
1. **Delimiter Matching**: The compiler searches `Url` from left to right for the static delimiter `"://"`.
2. **Substring Slicing**:
   - The portion to the left of the delimiter is bound to `infer Protocol`.
   - The portion to the right is validated against the remaining pattern.
3. **Success / Failure**: If the string matches the pattern, the inferred variables become available in the true branch.

---

### 5. Think first

What is the resulting type of `Result` in the code below? Decide first.

```typescript
type FirstSegment<Path extends string> =
  Path extends `/${infer Segment}/${string}` ? Segment : never;

type Result = FirstSegment<"/users/100/edit">;
```

---

**Answer and Reason:**

The resulting type is:

```typescript
"users"
```

**Reason**: The pattern matches a leading `"/"`, captures everything up to the next `"/"` into `Segment`, and ignores the rest. `Segment` captures `"users"`.

---

### 6. Try it yourself
Write a conditional type `GetFileExtension<FileName extends string>` that captures everything after a dot `.` using `${string}.${infer Ext}`. Test it with `"index.ts"`.

---

### 7. More examples

#### Example A: Extracting Query Parameters (Medium)

```typescript
type ExtractQuery<Url extends string> =
  Url extends `${string}?${infer Query}` ? Query : "";

type Q1 = ExtractQuery<"https://api.com/search?q=typescript">; // "q=typescript"
type Q2 = ExtractQuery<"https://api.com/home">;                // ""
```

---

### 8. Common mistakes

#### Mistake 1: Placing `infer` without a delimiter between variables

**Wrong code:**
```typescript
type Split<S extends string> = S extends `${infer A}${infer B}` ? [A, B] : never;
// Does NOT split in the middle!
```

**Why it happens:**
When two `infer` variables are adjacent without a delimiter, `A` matches only the **first single character**, and `B` captures everything else (covered in Topic 5 and 6).

---

### 9. Rules to remember
1. Use `${infer Substring}` inside template literal conditions to capture text.
2. Static delimiters (like `/`, `.`, `?`, `:`) separate the captured parts.
3. If the string does not match the pattern, the condition falls back to the false branch.

---

### 10. Exercises

#### Question 1 (Predict the compile result)
What is the type of `Ext`?
```typescript
type Extension<S extends string> = S extends `${string}.${infer E}` ? E : never;
type Ext = Extension<"archive.tar.gz">;
```

#### Question 2 (Find and fix the bug)
The type below fails to extract the domain. Fix the delimiter:
```typescript
type GetDomain<Email extends string> =
  Email extends `${string}#${infer Domain}` ? Domain : never;
```

#### Question 3 (Write code from scratch)
Write a type `ExtractScope<Pkg extends string>` that extracts the scope from an npm package name (e.g. extracts `"myorg"` from `"@myorg/core"`).

#### Question 4 (Explain in your own words)
How does TypeScript determine where the inferred substring starts and ends?

---

### Solutions

#### Solution to Question 1
**Hint 1**: The pattern looks for the dot `.`.

**Answer**:
The type is `"tar.gz"` (because `infer E` captures everything after the first dot from the left).

#### Solution to Question 2
**Hint 1**: Emails use `@`, not `#`.

**Answer**:
```typescript
type GetDomain<Email extends string> =
  Email extends `${string}@${infer Domain}` ? Domain : never;
```

#### Solution to Question 3
**Hint 1**: Pattern match on `@${infer Scope}/${string}`.

**Answer**:
```typescript
type ExtractScope<Pkg extends string> =
  Pkg extends `@${infer Scope}/${string}` ? Scope : never;

type S = ExtractScope<"@myorg/core">; // "myorg"
```

#### Solution to Question 4
**Hint 1**: Look at the static characters preceding and following the `infer` keyword.

**Answer**:
TypeScript uses the static literal characters before and after `${infer X}` as boundary delimiters. The inferred variable captures all characters that appear between those static boundaries.

---

### 11. Recall

1. What keyword captures substrings in template literal types?
2. What happens if a string does not contain the specified delimiter?
3. In `${infer Head}/${infer Tail}`, what separates `Head` and `Tail`?

**If you remember only one thing:**
Use `${infer Head}${Delimiter}${infer Tail}` to slice and parse strings at compile time.

---

# Topic 5: Non-Greedy vs Greedy Matching Mechanics in String Inference

### 1. What is it?
When TypeScript matches string patterns from left to right:
- An `infer` variable preceding a delimiter is **non-greedy** (it captures the shortest possible match up to the *first* occurrence of the delimiter).
- An `infer` variable after a delimiter at the end of the pattern is **greedy** (it captures everything remaining).

### 2. Why does it exist?
Consider splitting a file path with multiple slashes: `"a/b/c"`.
If you write `${infer Head}/${infer Tail}`:
- Does `Head` match `"a"` or `"a/b"`?
Because `Head` is non-greedy, it matches `"a"` (up to the first slash).
`Tail` captures the rest: `"b/c"`.
Understanding this rule is essential for writing recursive string parsers.

### 3. Basic example

```typescript
type SplitFirst<S extends string> =
  S extends `${infer Head}/${infer Tail}`
    ? { head: Head; tail: Tail }
    : never;

type Result = SplitFirst<"users/123/profile">;
// Inferred as:
// {
//   head: "users";
//   tail: "123/profile";
// }
```

**Line-by-line explanation:**
- `Head` stops at the very first `/` found from the left. It captures `"users"`.
- `Tail` captures everything following that first slash: `"123/profile"`.
- If you run `SplitFirst` again on `Tail`, you extract `"123"` and `"profile"`. This predictable behavior makes recursive parsers possible.

---

### 4. How it works inside TypeScript
1. **Left-to-Right Scan**: The parser scans the target string from index 0.
2. **First Delimiter Match**: As soon as it encounters the first character matching the delimiter, it freezes `Head`.
3. **Rest Collection**: The remaining characters are passed to the next pattern component (in this case, `Tail`).

---

### 5. Think first

What is `Head` and `Tail` when matching `"one.two.three"` against `${infer Head}.${infer Tail}`? Decide first.

```typescript
type Test<S extends string> = S extends `${infer Head}.${infer Tail}`
  ? [Head, Tail]
  : never;

type R = Test<"one.two.three">;
```

---

**Answer and Reason:**

The resulting type is:

```typescript
["one", "two.three"]
```

**Reason**: `Head` stops at the first dot (`"one"`). `Tail` captures everything remaining (`"two.three"`).

---

### 6. Try it yourself
Write a type `GetProtocolAndRest<Url extends string>` matching `${infer Proto}://${infer Rest}`. Test with `"https://site.com/path/page"`. Verify `Proto` is `"https"` and `Rest` is `"site.com/path/page"`.

---

### 7. More examples

#### Example A: What Happens If Delimiter Appears Multiple Times? (Medium)

```typescript
type ParseCsvLine<S extends string> =
  S extends `${infer First},${infer Remainder}`
    ? [First, Remainder]
    : [S];

type TwoParts = ParseCsvLine<"Alex,25,Engineer">;
// ["Alex", "25,Engineer"]
```

---

### 8. Common mistakes

#### Mistake 1: Assuming `Head` captures up to the LAST delimiter

**Wrong assumption:**
Expecting `Head` to be `"users/123"` and `Tail` to be `"profile"`.

**Reality:**
TypeScript matches left-to-right. `Head` captures up to the *first* delimiter. If you want the last segment, you must parse recursively.

---

### 9. Rules to remember
1. `infer` before a delimiter is non-greedy (stops at the first occurrence).
2. `infer` at the end of the pattern captures the remainder greedily.
3. Matching proceeds strictly from left to right.

---

### 10. Exercises

#### Question 1 (Predict the compile result)
What is the resulting tuple type of `R`?
```typescript
type SplitColon<S extends string> = S extends `${infer A}:${infer B}` ? [A, B] : never;
type R = SplitColon<"user:profile:settings">;
```

#### Question 2 (Find and fix the bug)
The code below expects `Tail` to be `"css"`, but it captures `"module.css"`. Explain why:
```typescript
type Ext<S extends string> = S extends `${infer Head}.${infer Tail}` ? Tail : never;
type FileExt = Ext<"styles.module.css">;
```

#### Question 3 (Write code from scratch)
Write a type `PopFirstSegment<S extends string>` that returns the remaining string after the first slash `/`. If there is no slash, return `""`.

#### Question 4 (Explain in your own words)
Why is non-greedy matching on the first variable useful when writing recursive string parsers?

---

### Solutions

#### Solution to Question 1
**Hint 1**: Stop at the first colon.

**Answer**:
`R` is `["user", "profile:settings"]`.

#### Solution to Question 2
**Hint 1**: The first delimiter found is the dot after `styles`.

**Answer**:
Because `Head` stops at the first dot, `Tail` captures everything after the first dot: `"module.css"`. To get only the final extension, you must recursively call `Ext<Tail>`.

#### Solution to Question 3
**Hint 1**: `S extends `${string}/${infer Tail}` ? Tail : ""`.

**Answer**:
```typescript
type PopFirstSegment<S extends string> =
  S extends `${string}/${infer Tail}` ? Tail : "";
```

#### Solution to Question 4
**Hint 1**: Think of a `while` loop taking one item at a time from a list.

**Answer**:
Non-greedy matching allows you to cleanly peel off one token at a time from the front of the string. You process that token, and then recursively pass the remaining string to the same parser until all tokens are processed.

---

### 11. Recall

1. Does the first `infer` variable match greedily or non-greedily?
2. In `"a/b/c"`, what does `${infer H}/${infer T}` bind `H` to?
3. How do you reach the last segment of a delimited string?

**If you remember only one thing:**
The first `infer` before a delimiter captures the shortest match up to the first delimiter found.

---

# Checkpoint Challenge: Topics 1 to 5

### Challenge Scenario
Build a type-safe URL router parser:

1. Create a union of allowed HTTP methods:
   ```typescript
   type Method = "get" | "post" | "delete";
   ```
2. Create an `EndpointName = `${Uppercase<Method>} /api/${string}``.
3. Write a conditional type `ExtractMethod<E extends string>` that pattern matches `${infer M} ${string}` and extracts the method.
4. Write a conditional type `ExtractPath<E extends string>` that pattern matches `${string} ${infer P}` and extracts the path.
5. Test both extractors with `"GET /api/users"`.

### Challenge Solution

```typescript
type Method = "get" | "post" | "delete";

// 2. Formatted endpoint type:
type EndpointName = `${Uppercase<Method>} /api/${string}`;

// 3. Extract method:
type ExtractMethod<E extends string> =
  E extends `${infer M} ${string}` ? M : never;

// 4. Extract path:
type ExtractPath<E extends string> =
  E extends `${string} ${infer P}` ? P : never;

// 5. Tests:
type Route = "GET /api/users";
type M = ExtractMethod<Route>; // "GET"
type P = ExtractPath<Route>;   // "/api/users"
```

---

# Topic 6: Single-Character Splitting (`${infer First}${infer Rest}`)

### 1. What is it?
When two `infer` variables are placed side-by-side with **no delimiter**:
```typescript
S extends `${infer First}${infer Rest}`
```
TypeScript matches `First` as exactly **one single character**, while `Rest` captures the remainder of the string.

### 2. Why does it exist?
Sometimes you need to inspect or transform a string character by character (for example, counting string length, checking for illegal characters, converting snake_case to camelCase, or reversing a string).

Because there is no character-index operator in TypeScript like `str[0]`, adjacent `infer` variables are the primary mechanism for character-by-character processing.

### 3. Basic example

```typescript
type UnpackFirstChar<S extends string> =
  S extends `${infer First}${infer Rest}`
    ? { first: First; rest: Rest }
    : never;

type Step = UnpackFirstChar<"TypeScript">;
// Inferred as:
// {
//   first: "T";
//   rest: "ypeScript";
// }
```

**Line-by-line explanation:**
- `S extends `${infer First}${infer Rest}``: With no static delimiter in between, TypeScript assigns the first 16-bit code unit to `First`.
- `first` becomes `"T"`.
- `rest` becomes `"ypeScript"`.

---

### 4. How it works inside TypeScript
1. **Adjacent Matching Rule**: In the absence of a delimiter, the first `infer` variable is constrained to a length of 1 character.
2. **Empty String Termination**: When `S` is empty (`""`), the condition fails and falls back to the false branch (`never` or `[]`). This serves as the natural base case for recursive character processing.

---

### 5. Think first

What does `Step` evaluate to when passed an empty string `""`? Decide first.

```typescript
type UnpackFirstChar<S extends string> =
  S extends `${infer First}${infer Rest}` ? [First, Rest] : [];

type Step = UnpackFirstChar<"">;
```

---

**Answer and Reason:**

The resulting type is:

```typescript
[]
```

**Reason**: An empty string has 0 characters. It cannot match `${infer First}${infer Rest}` (which requires at least 1 character for `First`). It falls into the false branch and returns `[]`.

---

### 6. Try it yourself
Write a recursive type `StringLength<S extends string, Acc extends any[] = []>` that counts characters by peeling off one character at a time, adding an element to `Acc`, and returning `Acc["length"]` when `""` is reached. Test with `"code"`.

---

### 7. More examples

#### Example A: String to Character Tuple (Medium)

```typescript
type StringToChars<S extends string> =
  S extends `${infer First}${infer Rest}`
    ? [First, ...StringToChars<Rest>]
    : [];

type Chars = StringToChars<"ABC">;
// Inferred as: ["A", "B", "C"]
```

**Line-by-line explanation:**
- Recursively peels off `"A"`, then `"B"`, then `"C"`, then hits `""` and returns `[]`.
- Combines into tuple `["A", "B", "C"]`.

---

### 8. Common mistakes

#### Mistake 1: Infinite recursion on empty strings

**Wrong code:**
```typescript
type Loop<S extends string> = S extends `${infer F}${infer R}` ? Loop<S> : "";
// Calling Loop<S> with S instead of R causes infinite recursion!
```

**Correct code:**
Always recurse on `Rest` (`R`), which shrinks the string each step.

---

### 9. Rules to remember
1. `${infer First}${infer Rest}` captures exactly one character into `First`.
2. `Rest` captures the remaining substring.
3. An empty string `""` does not match, triggering the base case.

---

### 10. Exercises

#### Question 1 (Predict the compile result)
What is the resulting type of `HeadChar`?
```typescript
type First<S extends string> = S extends `${infer C}${string}` ? C : "";
type HeadChar = First<"Hello">;
```

#### Question 2 (Find and fix the bug)
The recursive type below never terminates. Fix the recursive argument:
```typescript
type ToTuple<S extends string> = S extends `${infer F}${infer R}`
  ? [F, ...ToTuple<S>]
  : [];
```

#### Question 3 (Write code from scratch)
Write a type `StartsWithVowel<S extends string>` that returns `true` if the first character is `"a" | "e" | "i" | "o" | "u"`, and `false` otherwise.

#### Question 4 (Explain in your own words)
Why does `${infer First}${infer Rest}` assign only one character to `First`?

---

### Solutions

#### Solution to Question 1
**Hint 1**: Extract the first character.

**Answer**:
The type is `"H"`.

#### Solution to Question 2
**Hint 1**: Recurse on `R`, not `S`.

**Answer**:
```typescript
type ToTuple<S extends string> = S extends `${infer F}${infer R}`
  ? [F, ...ToTuple<R>]
  : [];
```

#### Solution to Question 3
**Hint 1**: `S extends `${"a" | "e" | "i" | "o" | "u"}${string}` ? true : false`.

**Answer**:
```typescript
type Vowel = "a" | "e" | "i" | "o" | "u";
type StartsWithVowel<S extends string> =
  S extends `${Vowel}${string}` ? true : false;
```

#### Solution to Question 4
**Hint 1**: How would the compiler know how many characters to give `First` without a delimiter?

**Answer**:
Without a delimiter separating two adjacent infer variables, any division would be ambiguous. TypeScript specifies that the first variable matches the smallest possible non-empty unit (exactly 1 character), leaving the rest to the second variable.

---

### 11. Recall

1. How many characters does `First` capture in `${infer First}${infer Rest}`?
2. Does an empty string `""` match `${infer First}${infer Rest}`?
3. What happens if you recurse on `S` instead of `Rest`?

**If you remember only one thing:**
Adjacent infer variables without delimiters peel off exactly one character at a time.

---

# Topic 7: Recursive String Replacement (`Replace` and `ReplaceAll`)

### 1. What is it?
You can build compile-time search-and-replace utilities using template literal pattern matching and recursive conditional types:
- `Replace<S, From, To>`: Replaces the *first* occurrence of `From` with `To`.
- `ReplaceAll<S, From, To>`: Replaces *all* occurrences of `From` with `To`.

### 2. Why does it exist?
Strings in code often need format conversions:
- Converting hyphens to underscores: `"content-type"` $\to$ `"content_type"`.
- Converting dot paths to slashes: `"user.name"` $\to$ `"user/name"`.

In JavaScript runtime, you use `str.replaceAll()`. In TypeScript compile time, you use recursive template literal replacement.

### 3. Basic example

```typescript
// 1. Replace first occurrence:
type Replace<
  S extends string,
  From extends string,
  To extends string
> = From extends ""
  ? S
  : S extends `${infer Head}${From}${infer Tail}`
  ? `${Head}${To}${Tail}`
  : S;

type R1 = Replace<"user-profile-card", "-", "_">;
// "user_profile-card"

// 2. Replace all occurrences (recursive):
type ReplaceAll<
  S extends string,
  From extends string,
  To extends string
> = From extends ""
  ? S
  : S extends `${infer Head}${From}${infer Tail}`
  ? `${Head}${To}${ReplaceAll<Tail, From, To>}`
  : S;

type R2 = ReplaceAll<"user-profile-card", "-", "_">;
// "user_profile_card"
```

**Line-by-line explanation:**
- `S extends `${infer Head}${From}${infer Tail}``: Finds the first instance of `From`.
- In `Replace`: replaces `From` with `To` and returns `${Head}${To}${Tail}`.
- In `ReplaceAll`: replaces `From` with `To` and recursively calls `ReplaceAll<Tail, From, To>` on the remaining substring.
- When no more occurrences of `From` exist, it returns `S`.

---

### 4. How it works inside TypeScript
1. **Leftmost Replacement**: The compiler finds the first instance of `From`.
2. **Head Preservation**: The part before `From` (`Head`) has already been processed and is preserved.
3. **Tail Recursion**: Recursion is performed *only* on `Tail`. This prevents infinite loops if `To` contains `From` (such as replacing `"a"` with `"aa"`).

---

### 5. Think first

What happens if you run `ReplaceAll<"a", "a", "aa">`? Does it loop forever? Decide first.

```typescript
type ReplaceAll<S extends string, From extends string, To extends string> =
  From extends "" ? S :
  S extends `${infer Head}${From}${infer Tail}`
    ? `${Head}${To}${ReplaceAll<Tail, From, To>}`
    : S;

type Test = ReplaceAll<"a", "a", "aa">;
```

---

**Answer and Reason:**

It evaluates to `"aa"` without looping forever!

**Reason**: Because `ReplaceAll` only recurses on `Tail` (which is `""`), the replacement `"aa"` is placed in `${Head}${To}` and is not re-scanned.

---

### 6. Try it yourself
Use `ReplaceAll` to convert a date string `"2026/10/02"` from slashes to dashes: `"2026-10-02"`.

---

### 7. More examples

#### Example A: Stripping Characters (Medium)

```typescript
type RemoveSpaces<S extends string> = ReplaceAll<S, " ", "">;

type Clean = RemoveSpaces<" H e l l o ">;
// "Hello"
```

---

### 8. Common mistakes

#### Mistake 1: Recursing on the whole reconstructed string instead of `Tail`

**Wrong code:**
```typescript
type InfiniteReplace<S extends string, From extends string, To extends string> =
  S extends `${infer Head}${From}${infer Tail}`
    ? InfiniteReplace<`${Head}${To}${Tail}`, From, To>
    : S;
// If To contains From (e.g. replace 'a' with 'ba'), this runs forever!
```

---

### 9. Rules to remember
1. `Replace` replaces the first occurrence; `ReplaceAll` recurses on `Tail`.
2. Guard against `From extends ""` to avoid infinite loops on empty strings.
3. Recurse only on `Tail` to prevent recursive re-matching of replaced characters.

---

### 10. Exercises

#### Question 1 (Predict the compile result)
What is the resulting type of `Output`?
```typescript
type Output = ReplaceAll<"1.0.0.0", ".", "-">;
```

#### Question 2 (Find and fix the bug)
The replace utility below loops infinitely when `From` is `""`. Add the guard check:
```typescript
type UnsafeReplace<S extends string, From extends string, To extends string> =
  S extends `${infer H}${From}${infer T}` ? `${H}${To}${T}` : S;
```

#### Question 3 (Write code from scratch)
Write a type `ToSnakeCase<S extends string>` that replaces all hyphens `"-"` with underscores `"_"` using `ReplaceAll`.

#### Question 4 (Explain in your own words)
Why must `ReplaceAll` recurse on `Tail` rather than `${Head}${To}${Tail}`?

---

### Solutions

#### Solution to Question 1
**Hint 1**: Replace every dot with a dash.

**Answer**:
The type is `"1-0-0-0"`.

#### Solution to Question 2
**Hint 1**: Add `From extends "" ? S : ...`.

**Answer**:
```typescript
type SafeReplace<S extends string, From extends string, To extends string> =
  From extends "" ? S :
  S extends `${infer H}${From}${infer T}` ? `${H}${To}${T}` : S;
```

#### Solution to Question 3
**Hint 1**: Call `ReplaceAll<S, "-", "_">`.

**Answer**:
```typescript
type ToSnakeCase<S extends string> = ReplaceAll<S, "-", "_">;
type Result = ToSnakeCase<"kebab-case-string">; // "kebab_case_string"
```

#### Solution to Question 4
**Hint 1**: What happens if you replace `"a"` with `"aa"`?

**Answer**:
If you recurse on `${Head}${To}${Tail}`, the newly inserted `To` string is placed back into the search area. If `To` contains `From` (such as replacing `"a"` with `"aa"`), the compiler will find `From` again and again in an infinite loop. Recursing only on `Tail` guarantees that replaced text is never re-processed.

---

### 11. Recall

1. What is the difference between `Replace` and `ReplaceAll`?
2. Why is an empty string guard (`From extends ""`) required?
3. Which portion of the string does `ReplaceAll` recurse on?

**If you remember only one thing:**
Recurse strictly on `Tail` to replace all occurrences without triggering infinite recursion loops.

---

# Topic 8: Trimming Whitespace at Compile Time (`TrimStart`, `TrimEnd`, `Trim`)

### 1. What is it?
TypeScript can remove leading and trailing whitespace from string literal types at compile time:
- `TrimStart<S>`: Strips whitespace from the beginning.
- `TrimEnd<S>`: Strips whitespace from the end.
- `Trim<S>`: Strips whitespace from both ends.

Whitespace includes spaces (`" "`), tabs (`"\t"`), and newlines (`"\n"`).

### 2. Why does it exist?
When parsing strings (like SQL queries, CSV rows, or template strings), leading and trailing whitespace is often present.

Trimming utilities clean string inputs before passing them to type-level parsers, preventing whitespace from breaking pattern matches.

### 3. Basic example

```typescript
type Whitespace = " " | "\t" | "\n";

// 1. Trim left:
type TrimStart<S extends string> =
  S extends `${Whitespace}${infer Rest}` ? TrimStart<Rest> : S;

// 2. Trim right:
type TrimEnd<S extends string> =
  S extends `${infer Rest}${Whitespace}` ? TrimEnd<Rest> : S;

// 3. Trim both ends:
type Trim<S extends string> = TrimEnd<TrimStart<S>>;

type Clean1 = TrimStart<"   hello">; // "hello"
type Clean2 = TrimEnd<"world   ">;   // "world"
type Clean3 = Trim<"   alex   ">;    // "alex"
```

**Line-by-line explanation:**
- `type Whitespace = " " | "\t" | "\n";`: Defines all characters considered whitespace.
- `TrimStart`: If the string begins with any `Whitespace` character, peel it off and recursively call `TrimStart<Rest>`. Once the first character is not whitespace, return `S`.
- `TrimEnd`: If the string ends with `Whitespace`, peel it off and recurse.
- `Trim`: Combines both operations.

---

### 4. How it works inside TypeScript
1. **Union Matching**: The compiler checks if the first character matches any member of `Whitespace`.
2. **Peeling**: It discards one whitespace character at a time.
3. **Termination**: When the boundary character is not whitespace, recursion stops.

---

### 5. Think first

What does `Trim<"\n\t  config  \t\n">` evaluate to? Decide first.

```typescript
type Clean = Trim<"\n\t  config  \t\n">;
```

---

**Answer and Reason:**

It evaluates to:

```typescript
"config"
```

**Reason**: `Whitespace` includes spaces, tabs (`\t`), and newlines (`\n`). All surrounding whitespace characters are recursively stripped from both sides.

---

### 6. Try it yourself
Test `Trim` on `"   user_id   "`. Verify that the result is `"user_id"`.

---

### 7. More examples

#### Example A: Cleaning Command Input (Medium)

```typescript
type Command = Trim<"   npm run build   ">;
// Inferred as: "npm run build"
```

---

### 8. Common mistakes

#### Mistake 1: Trying to trim interior spaces with `Trim`

**Wrong assumption:**
Expecting `Trim<"a   b">` to become `"ab"`.

**Reality:**
`Trim` only removes leading and trailing whitespace. To remove interior spaces, use `ReplaceAll<S, " ", "">`.

---

### 9. Rules to remember
1. `Whitespace` is `" " | "\t" | "\n"`.
2. `TrimStart` peels from the left; `TrimEnd` peels from the right.
3. `Trim` combines both: `TrimEnd<TrimStart<S>>`.

---

### 10. Exercises

#### Question 1 (Predict the compile result)
What is the resulting type of `T`?
```typescript
type T = TrimStart<"   42">;
```

#### Question 2 (Find and fix the bug)
The type below fails to trim newlines. Fix `Whitespace`:
```typescript
type Whitespace = " ";
```

#### Question 3 (Write code from scratch)
Write the complete `Trim<S>` utility from scratch including tab and newline support.

#### Question 4 (Explain in your own words)
Why does `TrimEnd<TrimStart<S>>` safely clean both ends without needing a separate two-sided recursive loop?

---

### Solutions

#### Solution to Question 1
**Hint 1**: Strip leading spaces.

**Answer**:
The type is `"42"`.

#### Solution to Question 2
**Hint 1**: Include `\t` and `\n`.

**Answer**:
```typescript
type Whitespace = " " | "\t" | "\n";
```

#### Solution to Question 3
**Hint 1**: Define `Whitespace`, `TrimStart`, `TrimEnd`, and combine them.

**Answer**:
```typescript
type Whitespace = " " | "\t" | "\n";
type TrimStart<S extends string> = S extends `${Whitespace}${infer R}` ? TrimStart<R> : S;
type TrimEnd<S extends string> = S extends `${infer R}${Whitespace}` ? TrimEnd<R> : S;
type Trim<S extends string> = TrimEnd<TrimStart<S>>;
```

#### Solution to Question 4
**Hint 1**: Does trimming the left affect the right?

**Answer**:
Trimming the left removes all leading whitespace up to the first non-whitespace character, leaving the right side untouched. Then `TrimEnd` processes the resulting string and removes all trailing whitespace. Composing them sequentially guarantees both ends are completely clean.

---

### 11. Recall

1. What characters are included in the standard `Whitespace` union?
2. How do you implement `TrimStart`?
3. Does `Trim` remove spaces in the middle of words?

**If you remember only one thing:**
Compose `TrimStart` and `TrimEnd` to clean surrounding whitespace from string types.

---

# Topic 9: Splitting Strings into Tuples at Compile Time (`Split<S, Delimiter>`)

### 1. What is it?
`Split<S, Delimiter>` is a recursive template literal type that splits a string literal into a tuple of substrings based on a delimiter, mirroring JavaScript's `str.split()` method:
```typescript
type Words = Split<"hello-world-again", "-">;
// ["hello", "world", "again"]
```

### 2. Why does it exist?
Structured strings often encode lists of tokens:
- CSV lines: `"Alex,28,Admin"`
- File paths: `"src/lib/utils/format.ts"`
- Dot notation: `"user.address.city"`

Splitting the string into a tuple of elements allows you to access individual segments by index (`Tuple[0]`), count segments, or iterate through them.

### 3. Basic example

```typescript
type Split<
  S extends string,
  Delimiter extends string
> = S extends `${infer Head}${Delimiter}${infer Tail}`
  ? [Head, ...Split<Tail, Delimiter>]
  : [S];

type Segments = Split<"src/components/Button", "/">;
// Inferred as: ["src", "components", "Button"]
```

**Line-by-line explanation:**
- `S extends `${infer Head}${Delimiter}${infer Tail}``: Finds the first occurrence of `Delimiter`.
- `[Head, ...Split<Tail, Delimiter>]`: Puts `Head` as the first tuple element, and spreads the result of splitting `Tail`.
- When no more delimiters exist, it hits the false branch and returns `[S]` (the final segment).

---

### 4. How it works inside TypeScript
1. **Peeled Token**: The non-greedy `Head` captures the first segment.
2. **Tuple Spreading**: The spread operator `...` nests the recursive call inside the tuple constructor.
3. **Base Case**: When the delimiter is no longer found, `[S]` terminates the tuple.

---

### 5. Think first

What is the resulting type of `Result` when splitting `"apple"` with delimiter `","`? Decide first.

```typescript
type Result = Split<"apple", ",">;
```

---

**Answer and Reason:**

The resulting type is:

```typescript
["apple"]
```

**Reason**: There is no comma in `"apple"`. The condition evaluates to false, returning `[S]` which is `["apple"]`.

---

### 6. Try it yourself
Use `Split` to split `"red;green;blue"` by `";"`. Verify the resulting tuple has length 3.

---

### 7. More examples

#### Example A: Extracting the Last Segment (Medium)

```typescript
type LastSegment<S extends string, Delimiter extends string> =
  Split<S, Delimiter> extends [...any[], infer Last] ? Last : never;

type FileName = LastSegment<"src/utils/math.ts", "/">;
// Inferred as: "math.ts"
```

**Line-by-line explanation:**
- Splits into a tuple, then uses tuple pattern matching `[...any[], infer Last]` to get the final element.

---

### 8. Common mistakes

#### Mistake 1: Splitting an empty string `""`

**Wrong assumption:**
Expecting `Split<"", "/">` to return `[]`.

**Reality:**
It returns `[""]` (a 1-element tuple containing an empty string), exactly like JavaScript's `"".split("/")`.

---

### 9. Rules to remember
1. `Split<S, Delimiter>` turns delimited strings into tuples of string literals.
2. Syntax: `[Head, ...Split<Tail, Delimiter>]`.
3. Base case returns `[S]` when no delimiter remains.

---

### 10. Exercises

#### Question 1 (Predict the compile result)
What is the resulting type of `T`?
```typescript
type T = Split<"a.b", ".">;
```

#### Question 2 (Find and fix the bug)
The split type below forgets to recurse on `Tail`. Fix it:
```typescript
type BadSplit<S extends string, D extends string> =
  S extends `${infer H}${D}${infer T}` ? [H, T] : [S];
```

#### Question 3 (Write code from scratch)
Write a type `SegmentCount<S extends string, D extends string>` that returns the number of segments in a delimited string (e.g. `SegmentCount<"a/b/c", "/">` returns `3`).

#### Question 4 (Explain in your own words)
How does tuple spreading `...Split<Tail, Delimiter>` allow TypeScript to construct a flat tuple of arbitrary length?

---

### Solutions

#### Solution to Question 1
**Hint 1**: Split by dot.

**Answer**:
`T` is `["a", "b"]`.

#### Solution to Question 2
**Hint 1**: Spread `...BadSplit<T, D>`.

**Answer**:
```typescript
type GoodSplit<S extends string, D extends string> =
  S extends `${infer H}${D}${infer T}` ? [H, ...GoodSplit<T, D>] : [S];
```

#### Solution to Question 3
**Hint 1**: Access `Split<S, D>["length"]`.

**Answer**:
```typescript
type SegmentCount<S extends string, D extends string> =
  Split<S, D>["length"];
```

#### Solution to Question 4
**Hint 1**: What does the array spread operator do in JavaScript?

**Answer**:
Just like spreading in JavaScript arrays (`[head, ...tail]`), tuple spreading in TypeScript unrolls the elements of the recursive tuple into the parent tuple, producing a single, flat tuple containing all segments in order.

---

### 11. Recall

1. What does `Split<"a-b-c", "-">` return?
2. How do you access the number of segments produced by `Split`?
3. What is returned when the delimiter is not found in the string?

**If you remember only one thing:**
Use `[Head, ...Split<Tail, Delimiter>]` to parse delimited strings into typed tuples.

---

# Topic 10: Extracting Dynamic Route Parameters (`/users/:userId/posts/:postId`)

### 1. What is it?
You can use template literal pattern matching to extract dynamic URL parameters (like `:userId` and `:postId`) from path strings and turn them into a strongly typed object schema:
```typescript
type Route = "/users/:userId/posts/:postId";
type Params = ExtractParams<Route>;
// { userId: string; postId: string }
```

### 2. Why does it exist?
In web frameworks (Next.js, Express, React Router), route paths contain dynamic placeholders like `:id` or `[id]`.

If route parameters are untyped, accessing `req.params.userId` has no autocomplete and does not catch typos like `req.params.userid`. Extracting parameters directly from the route string makes routing APIs 100% type-safe.

### 3. Basic example

```typescript
type ExtractRouteParams<Path extends string> =
  Path extends `${string}:${infer Param}/${infer Rest}`
    ? { [K in Param | keyof ExtractRouteParams<Rest>]: string }
    : Path extends `${string}:${infer Param}`
    ? { [K in Param]: string }
    : {};

type Route = "/users/:userId/posts/:postId";
type Params = ExtractRouteParams<Route>;
// Inferred as:
// {
//   userId: string;
//   postId: string;
// }
```

**Line-by-line explanation:**
- `Path extends `${string}:${infer Param}/${infer Rest}``:
  - Finds a parameter `:Param` that is followed by a slash `/`.
  - Captures `Param` (e.g. `"userId"`).
  - Recursively calls `ExtractRouteParams<Rest>` on the remainder.
- `Path extends `${string}:${infer Param}``:
  - Handles the trailing parameter at the very end of the URL (e.g. `":postId"`).
- `Params`: Combines both into `{ userId: string; postId: string }`.

---

### 4. How it works inside TypeScript
1. **Prefix Detection**: The pattern searches for `:` denoting a parameter.
2. **Slash Boundary**: It captures up to the next `/` delimiter.
3. **Union Accumulation**: Extracted parameter names are accumulated into a union and mapped into an object type with string values.

---

### 5. Think first

What is `ExtractRouteParams<"/about">` when there are no dynamic parameters? Decide first.

```typescript
type StaticParams = ExtractRouteParams<"/about">;
```

---

**Answer and Reason:**

It evaluates to:

```typescript
{}
```

**Reason**: There are no colons `:` in `"/about"`. The condition falls through to the base case `{}` (an empty object with no required parameters).

---

### 6. Try it yourself
Test `ExtractRouteParams` on `"/orgs/:orgId/members/:memberId/roles/:roleId"`. Verify that all three parameters are present in the resulting type.

---

### 7. More examples

#### Example A: Type-Safe Route Handler Function (Medium)

```typescript
function get<Path extends string>(
  path: Path,
  handler: (params: ExtractRouteParams<Path>) => void
) {
  // Registers route handler
}

get("/users/:userId/edit", (params) => {
  console.log(params.userId); // Completely type-safe!
  // console.log(params.postId); // Compile Error: Property 'postId' does not exist!
});
```

---

### 8. Common mistakes

#### Mistake 1: Forgetting to handle the parameter at the end of the URL

**Wrong code:**
```typescript
type Bad<P extends string> = P extends `${string}:${infer Param}/${infer Rest}`
  ? Param | Bad<Rest>
  : never;
// Fails on "/users/:userId" because there is no trailing slash!
```

**Correct code:**
Always provide a second branch for trailing parameters without a slash.

---

### 9. Rules to remember
1. Match `:${infer Param}/` for parameters in the middle of a path.
2. Match `:${infer Param}` for parameters at the end of a path.
3. Return `{}` if no dynamic parameters are found.

---

### 10. Exercises

#### Question 1 (Predict the compile result)
What properties are in `P`?
```typescript
type P = ExtractRouteParams<"/articles/:slug">;
```

#### Question 2 (Find and fix the bug)
The route below uses Next.js bracket syntax `/[id]`. Write a pattern to match `[infer Param]`:
```typescript
type NextParam<P extends string> = P extends `${string}[${infer Param}]` ? Param : never;
```

#### Question 3 (Write code from scratch)
Write a type-safe function `navigateTo<Path extends string>(path: Path, params: ExtractRouteParams<Path>): string`.

#### Question 4 (Explain in your own words)
How does extracting route parameters at compile time prevent runtime 404 or undefined parameter bugs?

---

### Solutions

#### Solution to Question 1
**Hint 1**: The parameter is `slug`.

**Answer**:
`P` has `{ slug: string }`.

#### Solution to Question 2
**Hint 1**: The pattern `[${infer Param}]` matches bracket syntax.

**Answer**:
```typescript
type NextParam<P extends string> =
  P extends `${string}[${infer Param}]${string}` ? Param : never;
```

#### Solution to Question 3
**Hint 1**: Accept `path` and `params`.

**Answer**:
```typescript
function navigateTo<Path extends string>(
  path: Path,
  params: ExtractRouteParams<Path>
): string {
  let url: string = path;
  for (const [key, value] of Object.entries(params as Record<string, string>)) {
    url = url.replace(`:${key}`, value);
  }
  return url;
}
```

#### Solution to Question 4
**Hint 1**: What happens if a developer types `params.userid` instead of `params.userId`?

**Answer**:
Without compile-time extraction, parameter names are unchecked strings. Typos like `params.userid` or missing parameters cause runtime bugs where undefined values are queried. Compile-time parameter extraction forces the caller to provide exact, correctly spelled parameters.

---

### 11. Recall

1. What character indicates a dynamic parameter in standard route strings?
2. What should be returned if a route contains no dynamic parameters?
3. How do you handle parameters at the end of a path without a trailing slash?

**If you remember only one thing:**
Parse `${string}:${infer Param}` to derive type-safe parameter dictionaries directly from URL route strings.

---

# Checkpoint Challenge: Topics 6 to 10

### Challenge Scenario
Build a type-safe micro-router with path parameter replacement:

1. Create a route string `const USER_ROUTE = "/teams/:teamId/users/:userId" as const;`.
2. Extract the parameter type `RouteParams = ExtractRouteParams<typeof USER_ROUTE>`.
3. Write a function `buildPath<Path extends string>(path: Path, params: ExtractRouteParams<Path>): string`:
   - It iterates over the keys of `params` and replaces `:${key}` in `path` with its value.
   - It returns the clean path string.
4. Test calling `buildPath(USER_ROUTE, { teamId: "alpha", userId: "u123" })`.
5. Verify that omitting `teamId` triggers a compile error.

### Challenge Solution

```typescript
type ExtractRouteParams<Path extends string> =
  Path extends `${string}:${infer Param}/${infer Rest}`
    ? { [K in Param | keyof ExtractRouteParams<Rest>]: string }
    : Path extends `${string}:${infer Param}`
    ? { [K in Param]: string }
    : {};

const USER_ROUTE = "/teams/:teamId/users/:userId" as const;

type RouteParams = ExtractRouteParams<typeof USER_ROUTE>;
// { teamId: string; userId: string }

function buildPath<Path extends string>(
  path: Path,
  params: ExtractRouteParams<Path>
): string {
  let result: string = path;
  for (const [key, value] of Object.entries(params as Record<string, string>)) {
    result = result.replace(`:${key}`, value);
  }
  return result;
}

// Valid call:
const url = buildPath(USER_ROUTE, { teamId: "alpha", userId: "u123" });
console.log("Built URL:", url); // "/teams/alpha/users/u123"

// Invalid call (compile error):
// buildPath(USER_ROUTE, { userId: "u123" });
// Error: Property 'teamId' is missing!
```

---

# Topic 11: Deep Object Path Accessors with Dot Notation (`Path<T>`)

### 1. What is it?
You can generate a union of all possible nested object paths separated by dots (`"user.profile.name"`, `"settings.theme"`):
```typescript
type User = {
  profile: {
    name: string;
    age: number;
  };
};

type UserPaths = Path<User>;
// "profile" | "profile.name" | "profile.age"
```

### 2. Why does it exist?
Form libraries (like React Hook Form or Formik), database query builders (Prisma, TypeORM), and utility libraries (lodash `get`) use dot-separated paths to access deeply nested data.

Without template literal types, path strings must be typed as plain `string`, which allows typos like `"profile.nmae"` to go unnoticed. Generating path unions guarantees that only valid paths can be queried.

### 3. Basic example

```typescript
type Path<T> = T extends object
  ? {
      [K in keyof T]: K extends string
        ? T[K] extends object
          ? `${K}` | `${K}.${Path<T[K]>}`
          : `${K}`
        : never;
    }[keyof T]
  : never;

type Config = {
  db: {
    host: string;
    port: number;
  };
  active: boolean;
};

type ConfigPaths = Path<Config>;
// "active" | "db" | "db.host" | "db.port"
```

**Line-by-line explanation:**
- Loops over `[K in keyof T]`.
- If `T[K]` is a nested object, it produces both the property itself (`"${K}"`) and dot-joined children (`"${K}.${Path<T[K]>}"`).
- If `T[K]` is a primitive, it produces just `"${K}"`.
- `[keyof T]` indexes into the mapped object to extract the union of all paths.

---

### 4. How it works inside TypeScript
1. **Recursive Traversal**: The type recurses down object trees.
2. **String Interpolation**: It concatenates the current key with child paths using `` `${K}.${Path<T[K]>}` ``.
3. **Union Indexing**: Indexing with `[keyof T]` flattens the mapped object into a single union of path strings.

---

### 5. Think first

What paths are generated for `{ a: { b: string } }`? Decide first.

```typescript
type Paths = Path<{ a: { b: string } }>;
```

---

**Answer and Reason:**

The paths are:

```typescript
"a" | "a.b"
```

**Reason**: `"a"` is the top-level key. Since `a` is an object, it also generates `"a.b"`.

---

### 6. Try it yourself
Create an interface `State = { user: { id: string; email: string }; version: number }`. Apply `Path<State>` and test assigning `"user.email"` and `"user.password"`.

---

### 7. More examples

#### Example A: Excluding Arrays from Deep Path Expansion (Medium)

```typescript
// Guard against arrays to prevent mapping over array methods:
type SafePath<T> = T extends readonly any[]
  ? never
  : T extends object
  ? {
      [K in keyof T]: K extends string
        ? T[K] extends object
          ? `${K}` | `${K}.${SafePath<T[K]>}`
          : `${K}`
        : never;
    }[keyof T]
  : never;
```

---

### 8. Common mistakes

#### Mistake 1: Forgetting `[keyof T]` at the end of the mapped type

**Wrong code:**
```typescript
type BadPath<T> = {
  [K in keyof T]: `${string & K}`;
};
// Returns an object { a: "a", b: "b" }, NOT a union "a" | "b"!
```

**Why it happens:**
You must index with `[keyof T]` to extract the values of the mapped object into a union.

---

### 9. Rules to remember
1. Dot paths are constructed with `` `${K}.${Path<T[K]>}` ``.
2. Index with `[keyof T]` to produce a union of strings.
3. Guard against `Function` and arrays to prevent mapping over prototype methods.

---

### 10. Exercises

#### Question 1 (Predict the compile result)
Is `"x.y.z"` in `Path<{ x: { y: { z: number } } }>`?

#### Question 2 (Find and fix the bug)
The type below returns an object instead of a union of path strings. Fix it:
```typescript
type GetKeys<T> = { [K in keyof T]: K };
```

#### Question 3 (Write code from scratch)
Write a function signature `watchField<T, P extends Path<T>>(obj: T, path: P): void`.

#### Question 4 (Explain in your own words)
Why is `Path<T>` useful for form libraries?

---

### Solutions

#### Solution to Question 1
**Hint 1**: Follow the nesting from `x` to `y` to `z`.

**Answer**:
Yes, `"x.y.z"` is a valid path in the generated union.

#### Solution to Question 2
**Hint 1**: Add `[keyof T]` at the end.

**Answer**:
```typescript
type GetKeys<T> = { [K in keyof T]: K }[keyof T];
```

#### Solution to Question 3
**Hint 1**: Use `P extends Path<T>`.

**Answer**:
```typescript
function watchField<T, P extends Path<T>>(obj: T, path: P): void {}
```

#### Solution to Question 4
**Hint 1**: Think about registering input fields in forms.

**Answer**:
Form libraries register inputs using string paths (like `"address.street"`). Without `Path<T>`, any misspelled string is allowed. `Path<T>` provides autocomplete for every nested field and flags invalid paths at compile time.

---

### 11. Recall

1. What syntax joins parent keys with child paths?
2. How do you convert a mapped object type into a union of its values?
3. Should arrays and functions be excluded from deep object path expansion?

**If you remember only one thing:**
Use `` `${K}.${Path<T[K]>}` `` and index with `[keyof T]` to generate all valid nested dot paths.

---

# Topic 12: Resolving Values from Deep Path Strings (`Get<T, Path>`)

### 1. What is it?
Once you have dot-separated path strings (like `"user.profile.name"`), you can write a utility type `Get<T, P>` that traverses into object `T` along path `P` and extracts the **exact value type** stored at that path:
```typescript
type Name = Get<User, "profile.name">; // string
```

### 2. Why does it exist?
Functions like Lodash's `get(obj, "a.b.c")` return the nested value.

Without a path-resolver type, `get()` has to return `any` or `unknown`. The `Get<T, P>` type inspects the path string, navigates through the properties at compile time, and gives you the exact type of the nested property.

### 3. Basic example

```typescript
type Get<T, P extends string> =
  P extends `${infer Head}.${infer Tail}`
    ? Head extends keyof T
      ? Get<T[Head], Tail>
      : never
    : P extends keyof T
    ? T[P]
    : never;

type Data = {
  user: {
    name: string;
    scores: {
      math: number;
    };
  };
};

type T1 = Get<Data, "user.name">;               // string
type T2 = Get<Data, "user.scores.math">;        // number
type T3 = Get<Data, "user.unknown">;            // never
```

**Line-by-line explanation:**
- `P extends `${infer Head}.${infer Tail}``: Checks if the path contains a dot.
  - If yes: extracts the first segment `Head` (e.g. `"user"`).
  - Checks if `Head extends keyof T`.
  - Recurses with `Get<T[Head], Tail>`.
- `P extends keyof T`: Base case (no dots left in path). Looks up `T[P]`.
- If any segment is invalid, it returns `never`.

---

### 4. How it works inside TypeScript
1. **Peel First Key**: The non-greedy `Head` extracts the first property name.
2. **Step Inward**: The compiler indexes into `T[Head]` and passes the nested object to the next step.
3. **Tail Termination**: When no dots remain, it performs the final property lookup and returns the value type.

---

### 5. Think first

What is the type of `Score` in the code below? Decide first.

```typescript
type State = { volume: number };
type Score = Get<State, "volume">;
```

---

**Answer and Reason:**

The type is:

```typescript
number
```

**Reason**: There are no dots in `"volume"`. It hits the base case `P extends keyof T ? T[P] : never` and returns `number`.

---

### 6. Try it yourself
Write a generic function signature `getDeep<T, P extends string>(obj: T, path: P): Get<T, P>`. Test calling it on a nested configuration object.

---

### 7. More examples

#### Example A: Type-Safe Lodash `get` (Medium)

```typescript
function getProperty<T, P extends Path<T>>(obj: T, path: P): Get<T, P> {
  const parts = path.split(".");
  let current: any = obj;
  for (const part of parts) {
    current = current[part];
  }
  return current;
}
```

---

### 8. Common mistakes

#### Mistake 1: Forgetting to verify `Head extends keyof T`

**Wrong code:**
```typescript
type BadGet<T, P extends string> =
  P extends `${infer Head}.${infer Tail}` ? BadGet<T[Head], Tail> : T[P];
  // Error: Type 'Head' cannot be used to index type 'T'!
```

---

### 9. Rules to remember
1. `Get<T, P>` resolves the value type at dot-separated path `P`.
2. Slices paths recursively using `${infer Head}.${infer Tail}`.
3. Returns `never` if any path segment does not exist.

---

### 10. Exercises

#### Question 1 (Predict the compile result)
What is the resulting type of `Result`?
```typescript
type Schema = { a: { b: boolean } };
type Result = Get<Schema, "a.b">;
```

#### Question 2 (Find and fix the bug)
The type below fails when `Head` is not a key of `T`. Add the key check:
```typescript
type Lookup<T, P extends string> =
  P extends `${infer H}.${infer Tl}` ? Lookup<T[H], Tl> : never;
```

#### Question 3 (Write code from scratch)
Test `Get` on `{ api: { v1: { endpoint: string } } }` with path `"api.v1.endpoint"`.

#### Question 4 (Explain in your own words)
How does `Get<T, P>` combine string pattern matching with recursive type indexing?

---

### Solutions

#### Solution to Question 1
**Hint 1**: Follow `a` then `b`.

**Answer**:
The type is `boolean`.

#### Solution to Question 2
**Hint 1**: Check `H extends keyof T ? Lookup<T[H], Tl> : never`.

**Answer**:
```typescript
type Lookup<T, P extends string> =
  P extends `${infer H}.${infer Tl}`
    ? H extends keyof T
      ? Lookup<T[H], Tl>
      : never
    : never;
```

#### Solution to Question 3
**Hint 1**: Apply `Get<..., "api.v1.endpoint">`.

**Answer**:
```typescript
type App = { api: { v1: { endpoint: string } } };
type Ep = Get<App, "api.v1.endpoint">; // string
```

#### Solution to Question 4
**Hint 1**: How does it move from one level of the object to the next?

**Answer**:
`Get` uses template literal pattern matching to slice off the first segment of the string path (`Head`). It then uses standard indexed access (`T[Head]`) to move down into the nested object, and repeats this process recursively until the path is fully resolved.

---

### 11. Recall

1. What does `Get<T, P>` return?
2. What delimiter does `Get` use to navigate object hierarchies?
3. What type is returned if a segment in the path does not exist?

**If you remember only one thing:**
`Get<T, P>` recursively navigates down an object tree using dot-separated keys to resolve the exact property value type.

---

# Topic 13: Type-Safe Event Emitter Names with Colons (`event:action`)

### 1. What is it?
In many event systems (Node.js EventEmitter, WebSocket protocols, DOM events), events follow compound naming patterns with colons:
- `"user:login"`, `"user:logout"`
- `"order:created"`, `"order:cancelled"`

You can model these compound names with template literal types and pair each event name with its exact payload type.

### 2. Why does it exist?
Without template literal types, event emitter names are typed as `string`, and payloads are typed as `any`.

If you write `emitter.emit("user:login", payload)`, a typo like `"user:loginn"` or sending the wrong payload object fails silently at runtime. Template literal event maps enforce complete end-to-end type safety for events and their payloads.

### 3. Basic example

```typescript
type Entity = "user" | "order";
type Action = "created" | "deleted";

type EventName = `${Entity}:${Action}`;
// "user:created" | "user:deleted" | "order:created" | "order:deleted"

interface EventPayloads {
  "user:created": { userId: string; name: string };
  "user:deleted": { userId: string };
  "order:created": { orderId: string; amount: number };
  "order:deleted": { orderId: string };
}

class TypedEmitter {
  emit<E extends keyof EventPayloads>(event: E, payload: EventPayloads[E]): void {
    console.log("Emitting", event, payload);
  }
}

const emitter = new TypedEmitter();
emitter.emit("user:created", { userId: "u1", name: "Alex" }); // Valid!
// emitter.emit("user:created", { userId: "u1" }); // Error: Property 'name' is missing!
// emitter.emit("user:unknown", {}); // Error: Unknown event!
```

**Line-by-line explanation:**
- `EventName`: Uses template literals to define the structured naming convention `${Entity}:${Action}`.
- `EventPayloads`: Maps each valid event name to its required payload.
- `emit<E extends keyof EventPayloads>(event: E, payload: EventPayloads[E])`: Guarantees that passing `"user:created"` strictly requires the exact payload for that event.

---

### 4. How it works inside TypeScript
1. **Event Union**: The compound event names are validated against `keyof EventPayloads`.
2. **Dependent Argument**: The `payload` argument type is indexed directly from `EventPayloads[E]`.
3. **Catching Typos**: A typo in either the event name or the payload properties triggers an immediate compile error.

---

### 5. Think first

What happens if you pass the payload for `"user:deleted"` into `"user:created"`? Decide first.

```typescript
emitter.emit("user:created", { userId: "u1" });
```

---

**Answer and Reason:**

This code fails to compile:

```
Property 'name' is missing in type '{ userId: string; }' but required in type '{ userId: string; name: string; }'.
```

**Reason**: `EventPayloads["user:created"]` requires both `userId` and `name`. TypeScript prevents mismatched payloads.

---

### 6. Try it yourself
Add an event `"order:shipped"` with payload `{ orderId: string; trackingCode: string }` to `EventPayloads`. Test emitting it.

---

### 7. More examples

#### Example A: Wildcard Event Names (Medium)

```typescript
type AnyUserEvent = `user:${string}`;

function onUserEvent(event: AnyUserEvent) {
  console.log("Listening to user event:", event);
}

onUserEvent("user:login"); // Allowed
onUserEvent("user:custom_event"); // Allowed
// onUserEvent("order:created"); // Error! Does not start with "user:"
```

---

### 8. Common mistakes

#### Mistake 1: Decoupling the event name from the payload type

**Wrong code:**
```typescript
function emit(event: string, payload: any) {}
// Zero type checking!
```

---

### 9. Rules to remember
1. Combine template literal types to build structured event names `${Entity}:${Action}`.
2. Use an event payload map interface to associate each event with its payload.
3. Type the listener/emitter using generic parameter `<E extends keyof EventMap>`.

---

### 10. Exercises

#### Question 1 (Predict the compile result)
Will the following code compile?
```typescript
type Scope = "auth" | "db";
type EventType = `${Scope}:error`;
const e: EventType = "auth:error";
```

#### Question 2 (Find and fix the bug)
Fix the payload parameter type:
```typescript
interface Events { "log:info": string }
function send<E extends keyof Events>(event: E, payload: any) {}
```

#### Question 3 (Write code from scratch)
Write an `on<E extends keyof EventPayloads>(event: E, listener: (payload: EventPayloads[E]) => void): void` method signature.

#### Question 4 (Explain in your own words)
Why is an event emitter with a generic map `EventPayloads[E]` safer than overloading `on` for each event?

---

### Solutions

#### Solution to Question 1
**Hint 1**: Does `"auth:error"` match `${Scope}:error`?

**Answer**:
Yes, it compiles without error.

#### Solution to Question 2
**Hint 1**: Replace `any` with `Events[E]`.

**Answer**:
```typescript
interface Events { "log:info": string }
function send<E extends keyof Events>(event: E, payload: Events[E]) {}
```

#### Solution to Question 3
**Hint 1**: Type `listener` as `(payload: EventPayloads[E]) => void`.

**Answer**:
```typescript
function on<E extends keyof EventPayloads>(
  event: E,
  listener: (payload: EventPayloads[E]) => void
): void {}
```

#### Solution to Question 4
**Hint 1**: What happens when you add 20 new events to your system?

**Answer**:
With function overloads, you have to write duplicate function signatures for every single event. With a generic event map (`EventPayloads[E]`), you define the signature once, and adding a new event only requires adding a single entry to the interface.

---

### 11. Recall

1. What pattern syntax represents scoped events like `user:login`?
2. How do you link an event argument to its corresponding payload?
3. What is the benefit of a generic event map over manual overloads?

**If you remember only one thing:**
Use generic event maps indexed by template literal event names to build 100% type-safe event emitters.

---

# Topic 14: Union Explosion Limits and Compiler Safety (TS2590 Prevention)

### 1. What is it?
When template literal types multiply large unions together, the total number of combinations can grow exponentially.

If the number of generated union members exceeds the compiler's safety threshold (approximately **100,000 members**), TypeScript stops evaluation and triggers:
```
TS2590: Expression produces a union type that is too complex to represent.
```

### 2. Why does it exist?
Every union member in TypeScript consumes memory and compiler processing time.

If TypeScript allowed a template literal to generate 100 million types, your IDE would freeze, memory would be exhausted, and the compiler process would crash. The TS2590 limit protects your machine and ensures fast compilation.

### 3. Basic example

```typescript
type Digit = "0" | "1" | "2" | "3" | "4" | "5" | "6" | "7" | "8" | "9";

// 1. Safe: 10 * 10 = 100 members
type TwoDigits = `${Digit}${Digit}`;

// 2. Safe: 100 * 100 = 10,000 members
type FourDigits = `${TwoDigits}${TwoDigits}`;

// 3. EXPLOSION: 10,000 * 10,000 = 100,000,000 members!
// type EightDigits = `${FourDigits}${FourDigits}`;
// Compile Error TS2590: Expression produces a union type that is too complex to represent.
```

**Line-by-line explanation:**
- `TwoDigits`: $10 \times 10 = 100$ combinations (fast, safe).
- `FourDigits`: $100 \times 100 = 10,000$ combinations (acceptable).
- `EightDigits`: $10,000 \times 10,000 = 100,000,000$ combinations. The compiler detects that this exceeds 100,000 and stops compilation immediately with TS2590.

---

### 4. How it works inside TypeScript
1. **Cardinality Check**: Before generating all string permutations, the compiler calculates the product of the sizes of each interpolated union.
2. **Threshold Enforcement**: If the total cardinality exceeds the internal threshold, union construction is aborted.
3. **Alternative Strategy**: Use broad `string` with branded types or pattern validation functions instead of generating millions of literal strings.

---

### 5. Think first

What is the best way to type a valid 8-digit postal code without causing a union explosion? Decide first.

```typescript
// Approach A:
type EightDigits = `${Digit}${Digit}${Digit}${Digit}${Digit}${Digit}${Digit}${Digit}`;

// Approach B:
type PostalCode = string & { readonly __brand: "PostalCode" };
```

---

**Answer and Reason:**

**Approach B** is the correct, professional solution.

**Reason**: Approach A causes an exponential union explosion that crashes the compiler. Approach B uses a branded string with runtime validation, providing 100% type safety with zero compiler performance cost.

---

### 6. Try it yourself
Calculate the cardinality of `${"a"|"b"|"c"}${"1"|"2"|"3"}${"x"|"y"}`. Verify that $3 \times 3 \times 2 = 18$ combinations.

---

### 7. More examples

#### Example A: Defending Against Complex Permutations (Medium)

```typescript
// Instead of generating all IP addresses:
// type Octet = 0 | 1 | ... | 255;
// type IP = `${Octet}.${Octet}.${Octet}.${Octet}`; // Over 4 billion combinations!

// Use branded strings with smart constructors:
type IpAddress = string & { readonly __brand: "IpAddress" };

function toIpAddress(raw: string): IpAddress {
  const parts = raw.split(".");
  if (parts.length !== 4) throw new Error("Invalid IP");
  return raw as IpAddress;
}
```

---

### 8. Common mistakes

#### Mistake 1: Trying to generate exhaustive combinations of long strings

**Wrong assumption:**
Trying to generate all valid UUIDs or phone numbers with template literal unions.

**Why it happens:**
Template literals are meant for structured prefixes, suffixes, and small categorical combinations, not high-cardinality data like phone numbers or IDs.

---

### 9. Rules to remember
1. Multiplying unions multiplies their sizes ($M \times N$).
2. Exceeding ~100,000 combinations triggers error TS2590.
3. For large or infinite string sets, use branded strings with validation functions.

---

### 10. Exercises

#### Question 1 (Predict the compile result)
Will the following code cause error TS2590?
```typescript
type A = "1" | "2";
type B = "a" | "b";
type Combo = `${A}_${B}`;
```

#### Question 2 (Find and fix the bug)
The code below attempts to type all 4-digit PIN numbers by generating all permutations. Replace it with a branded string:
```typescript
type D = 0|1|2|3|4|5|6|7|8|9;
type Pin = `${D}${D}${D}${D}`; // 10,000 members
```

#### Question 3 (Write code from scratch)
Write a formula to calculate the number of union members in `${U1}${U2}${U3}`.

#### Question 4 (Explain in your own words)
Why does TypeScript enforce a limit on the number of union members a template literal can produce?

---

### Solutions

#### Solution to Question 1
**Hint 1**: How many combinations are generated?

**Answer**:
No, it generates only 4 combinations ($2 \times 2 = 4$). It compiles instantly.

#### Solution to Question 2
**Hint 1**: Use a branded string `string & { readonly __brand: "Pin" }`.

**Answer**:
```typescript
type Pin = string & { readonly __brand: "Pin" };

function toPin(raw: string): Pin {
  if (!/^\d{4}$/.test(raw)) throw new Error("Invalid PIN");
  return raw as Pin;
}
```

#### Solution to Question 3
**Hint 1**: Multiply the size of each union.

**Answer**:
$$\text{Total Combinations} = |U_1| \times |U_2| \times |U_3|$$

#### Solution to Question 4
**Hint 1**: Think about memory usage and IDE responsiveness.

**Answer**:
Each union member requires internal memory and processing time during type checking. Generating hundreds of thousands or millions of union members would cause the compiler process to run out of memory, crash, or freeze the user's IDE. The TS2590 limit ensures compiler stability and fast response times.

---

### 11. Recall

1. What error code indicates that a union is too complex to represent?
2. What is the approximate limit on generated union members?
3. What pattern should you use for high-cardinality string formats like UUIDs or phone numbers?

**If you remember only one thing:**
Keep template literal unions small to avoid union explosion errors (TS2590), and use branded strings for large formats.

---

# Final Checkpoint Challenge: Topics 11 to 14

### Challenge Scenario
Build a complete compile-time type-safe state store with dot-path reading and event notifications:

1. Define a nested application state:
   ```typescript
   interface AppState {
     auth: {
       user: {
         id: string;
         name: string;
       };
       token: string;
     };
     theme: "dark" | "light";
   }
   ```
2. Using `Path<AppState>`, generate all valid dot paths.
3. Using `Get<AppState, P>`, resolve the value type of `"auth.user.name"`.
4. Create an event system where changing any path emits `"change:${Path}"` with payload `{ path: Path; value: Get<AppState, Path> }`.
5. Write a method `notifyChange<P extends Path<AppState>>(path: P, value: Get<AppState, P>): void`.

### Challenge Solution

```typescript
interface AppState {
  auth: {
    user: {
      id: string;
      name: string;
    };
    token: string;
  };
  theme: "dark" | "light";
}

// 2. Generate valid dot paths:
type Path<T> = T extends object
  ? {
      [K in keyof T]: K extends string
        ? T[K] extends object
          ? `${K}` | `${K}.${Path<T[K]>}`
          : `${K}`
        : never;
    }[keyof T]
  : never;

// 3. Resolve value type at path:
type Get<T, P extends string> =
  P extends `${infer Head}.${infer Tail}`
    ? Head extends keyof T
      ? Get<T[Head], Tail>
      : never
    : P extends keyof T
    ? T[P]
    : never;

type UserName = Get<AppState, "auth.user.name">; // string

// 4 & 5. Type-safe change notifier:
function notifyChange<P extends Path<AppState>>(
  path: P,
  value: Get<AppState, P>
): void {
  console.log(`Event [change:${path}] emitted with value:`, value);
}

// Valid call:
notifyChange("auth.user.name", "Alex");
notifyChange("theme", "dark");

// Invalid calls (caught at compile time):
// notifyChange("auth.user.name", 123); // Error: 123 is not a string!
// notifyChange("auth.user.unknown", "test"); // Error: Invalid path!
```
