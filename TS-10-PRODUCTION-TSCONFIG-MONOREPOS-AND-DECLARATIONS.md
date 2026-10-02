# Module TS-10: Production TSConfig, Monorepos & Declarations

Welcome to TypeScript Production TSConfig, Monorepos, and Declarations. This module teaches how to architect scalable, hardened `tsconfig.json` configurations, enforce enterprise compiler strictness flags, manage multi-package monorepos with TypeScript Project References, and generate high-performance `.d.ts` declaration maps with `isolatedDeclarations`.

---

# Topic 1: Modern `tsconfig.json` Architecture: Base Configs, `extends`, and Inheritance

### 1. What is it?
A **`tsconfig.json`** file specifies the root files and compiler options required to compile a TypeScript project. The **`extends`** property allows a `tsconfig.json` to inherit configurations from a parent configuration file or an npm package (e.g. `@tsconfig/node20`, `@tsconfig/strictest`).

### 2. Why does it exist?
In large enterprise codebases and monorepos, duplicating 40 compiler options across 20 different microservices leads to configuration drift, where one package accidentally compiles with loose flags while another compiles with strict flags. Inheriting from a shared base configuration guarantees uniform compiler rules across all repositories.

### 3. Basic example

```json
// base.json (Shared base configuration)
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "strict": true,
    "skipLibCheck": true,
    "esModuleInterop": true
  }
}
```

```json
// tsconfig.json (Application package inheriting from base.json)
{
  "extends": "./base.json",
  "compilerOptions": {
    "outDir": "./dist",
    "rootDir": "./src"
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "**/*.spec.ts"]
}
```

**Line-by-line explanation:**
- `"extends": "./base.json"`: Loads `base.json` first. Any options defined in `tsconfig.json` override options from `base.json`.
- `"strict": true`: Inherited from `base.json`.
- `"outDir": "./dist"`: Overrides or augments the base config with package-specific output directory settings.
- `"include": ["src/**/*"]`: Specifies which glob patterns the compiler includes in this project. Files not in `"include"` are excluded from compilation.

---

### 4. How it works inside TypeScript
1. **Shallow Merge of Compiler Options**: Properties inside `compilerOptions` from the inheriting file override matching keys from the parent file.
2. **Top-Level Key Replacement**: Non-compilerOptions keys (like `include`, `exclude`, and `files`) are **replaced entirely** by the child file, NOT merged!
3. **Multiple Inheritance (TS 5.0+)**: TypeScript 5.0 added support for extending multiple configurations as an array: `"extends": ["@tsconfig/base", "./local-overrides.json"]`.

---

### 5. More examples

#### Example 1: Multiple `extends` array in TypeScript 5.0+
```json
{
  "extends": ["@tsconfig/node20/tsconfig.json", "@tsconfig/strictest/tsconfig.json"],
  "compilerOptions": {
    "outDir": "build"
  }
}
```
Options in later array entries override options from earlier entries. Local `compilerOptions` override all extended configurations.

#### Example 2: Inspecting the fully resolved configuration via CLI
```bash
# Print the final merged tsconfig configuration to the console
tsc --showConfig
```
Running `tsc --showConfig` resolves all `extends` trees and prints the exact computed JSON object used by the compiler.

---

### 6. Common mistakes

#### Mistake 1: Expecting `include` and `exclude` arrays to merge
```json
// base.json
{ "exclude": ["node_modules"] }

// tsconfig.json
{
  "extends": "./base.json",
  "exclude": ["**/*.spec.ts"] // OVERWRITES base exclude! node_modules is NO LONGER excluded!
}
```
**Why it fails:** Unlike `compilerOptions`, top-level keys like `include` and `exclude` are NOT merged. The child's `exclude` completely replaces the parent's `exclude`. Always repeat standard exclusions if overriding `exclude`.

#### Mistake 2: Missing relative path prefix in local extends
```json
// WRONG: Missing ./ prefix
{ "extends": "base.json" } // Looks for an npm package named 'base.json' in node_modules!
```
**Why it fails:** Without `./`, TypeScript treats the string as an npm package specifier. Use `"extends": "./base.json"`.

---

### 7. Rules to remember
1. `compilerOptions` keys merge shallowly; child keys overwrite parent keys.
2. `include`, `exclude`, and `files` arrays are replaced entirely, never merged.
3. TypeScript 5.0+ supports multiple inheritance via an array of config paths.
4. Run `tsc --showConfig` to debug the final resolved configuration.

---

### Think first: Prediction puzzle
If `base.json` sets `"target": "ES2018"` and child `tsconfig.json` sets `"target": "ES2022"`, what target does `tsc --showConfig` output?

---

**Answer:**
```
ES2022
```
**Explanation:** Child configuration properties always take precedence over inherited parent properties.

---

### Practice exercises

#### Exercise 1: Create a shared base config
- **Task**: Write a `tsconfig.base.json` enabling `strict: true` and `declaration: true`.
- **Hint 1**: Wrap inside `"compilerOptions"`.

#### Exercise 2: Extend with multiple configs
- **Task**: Configure a `tsconfig.json` using an array extending `"./base.json"` and `"./paths.json"`.
- **Hint 1**: `"extends": ["./base.json", "./paths.json"]`.

#### Exercise 3: Isolate test compilation
- **Task**: Create a `tsconfig.test.json` extending `tsconfig.json` that overrides `include` to include `["tests/**/*"]`.
- **Hint 1**: Top-level `"include": ["tests/**/*"]`.

#### Exercise 4: Show resolved config
- **Task**: Write the terminal command to view the fully merged config for `tsconfig.build.json`.
- **Hint 1**: `tsc -p tsconfig.build.json --showConfig`.

---

### Exercise solutions

#### Solution 1: Create a shared base config
```json
{
  "$schema": "https://json.schemastore.org/tsconfig",
  "compilerOptions": {
    "strict": true,
    "declaration": true,
    "skipLibCheck": true
  }
}
```

#### Solution 2: Extend with multiple configs
```json
{
  "extends": ["./base.json", "./paths.json"],
  "compilerOptions": {
    "outDir": "./dist"
  }
}
```

#### Solution 3: Isolate test compilation
```json
{
  "extends": "./tsconfig.json",
  "compilerOptions": {
    "noEmit": true
  },
  "include": ["src/**/*", "tests/**/*"]
}
```

#### Solution 4: Show resolved config
```bash
tsc -p tsconfig.build.json --showConfig
```

---

### Recall
1. Which property in `tsconfig.json` enables configuration inheritance? `"extends"`.
2. Do `include` and `exclude` arrays merge or replace when extending? They replace entirely.
3. How do you view the final resolved options computed by `tsc`? Run `tsc --showConfig`.

> **If you remember only one thing:**  
> Use `"extends"` to share a single base configuration across projects, and verify the merged result with `tsc --showConfig`.

---

# Topic 2: Strictness Compiler Flags (`strict`, `noImplicitAny`, `strictNullChecks`, `exactOptionalPropertyTypes`)

### 1. What is it?
TypeScript provides a collection of compiler flags to eliminate common JavaScript runtime errors. Setting **`"strict": true`** is a master toggle that turns on a whole family of type-checking flags at once:
- `noImplicitAny`
- `strictNullChecks`
- `strictFunctionTypes`
- `strictBindCallApply`
- `strictPropertyInitialization`
- `noImplicitThis`
- `useUnknownInCatchVariables`
- `alwaysStrict`

### 2. Why does it exist?
Without strict flags, TypeScript allows variables to be implicitly `any` and ignores `null` and `undefined`:
```typescript
// With strict: false (Dangerous JavaScript behavior)
function printLen(str: string) {
  return str.length; // If caller passes null, crashes with: Cannot read properties of null!
}
printLen(null); // Allowed without any compiler warning!
```
Enabling `"strict": true` turns `null` and `undefined` into distinct types that must be checked before accessing properties.

### 3. Basic example

```typescript
// tsconfig.json: { "compilerOptions": { "strict": true, "exactOptionalPropertyTypes": true } }

interface UserSettings {
  theme?: "dark" | "light"; // optional property
}

// 1. strictNullChecks in action:
function greet(name: string | null) {
  // console.log(name.toUpperCase()); // COMPILE ERROR: 'name' is possibly 'null'!
  if (name !== null) {
    console.log(name.toUpperCase()); // OK: narrowed to string
  }
}

// 2. exactOptionalPropertyTypes in action:
const settings: UserSettings = {
  // theme: undefined // COMPILE ERROR with exactOptionalPropertyTypes: true!
  // Property 'theme' must either be "dark", "light", or omitted entirely!
};
```

**Line-by-line explanation:**
- `"strict": true`: Enables all core strict checking options simultaneously.
- `greet(name: string | null)`: With `strictNullChecks: true`, TypeScript refuses to let you access `name.toUpperCase()` until you narrow away `null`.
- `"exactOptionalPropertyTypes": true`: Differentiates between a property that is omitted (`{}`) and a property that is explicitly set to `undefined` (`{ theme: undefined }`).

---

### 4. How it works inside TypeScript
1. **The `strict` Macro Flag**: When `strict: true` is set, all sub-flags default to `true` unless explicitly overridden to `false`.
2. **`useUnknownInCatchVariables`**: Catch block variables `catch (err)` default to `unknown` rather than `any`, forcing type guards before reading error properties.
3. **`strictPropertyInitialization`**: Requires all non-optional class properties to be assigned in the constructor or declaration.

---

### 5. More examples

#### Example 1: `useUnknownInCatchVariables`
```typescript
try {
  JSON.parse("{ invalid json }");
} catch (error) {
  // error is typed as 'unknown' under strict: true!
  // console.log(error.message); // Error: 'error' is of type 'unknown'
  if (error instanceof Error) {
    console.log(error.message); // OK: narrowed
  }
}
```

#### Example 2: `strictFunctionTypes` (Contravariant Parameters)
```typescript
class Animal { name = "animal"; }
class Dog extends Animal { bark() {} }

let animalFn: (a: Animal) => void = (a) => console.log(a.name);
let dogFn: (d: Dog) => void = (d) => d.bark();

// Under strictFunctionTypes: true, this assignment is illegal:
// animalFn = dogFn; // Error: Type '(d: Dog) => void' is not assignable to '(a: Animal) => void'!
```

---

### 6. Common mistakes

#### Mistake 1: Setting `"strict": true` but leaving `"strictNullChecks": false`
```json
// ANTI-PATTERN:
{
  "compilerOptions": {
    "strict": true,
    "strictNullChecks": false // Disables the single most important safety flag in TypeScript!
  }
}
```
**Why it fails:** Disabling `strictNullChecks` allows `null` and `undefined` to silently bypass every type check, leading to `TypeError: Cannot read properties of undefined` in production.

#### Mistake 2: Assuming `exactOptionalPropertyTypes` is enabled by `"strict": true`
```json
// GOTCHA:
{
  "compilerOptions": {
    "strict": true // exactOptionalPropertyTypes is NOT part of strict!
  }
}
```
**Why it matters:** `exactOptionalPropertyTypes` is opt-in and must be specified independently alongside `strict: true`.

---

### 7. Rules to remember
1. Always enable `"strict": true` in all new projects.
2. Enable `"exactOptionalPropertyTypes": true` to distinguish omitted properties from `undefined`.
3. Handle catch variables safely using `instanceof Error` narrowing.
4. Never manually disable `strictNullChecks`.

---

### Think first: Prediction puzzle
What does TypeScript report on `err.message` if `strict: true` is enabled?

```typescript
try {
  fetch("/api");
} catch (err) {
  console.log(err.message);
}
```

---

**Answer:**
```
Compiler error: 'err' is of type 'unknown'.
```
**Explanation:** Under `strict: true`, `useUnknownInCatchVariables` is activated, typing `err` as `unknown`. You must narrow `err` using `if (err instanceof Error)` before accessing `.message`.

---

### Practice exercises

#### Exercise 1: Enable strict configuration
- **Task**: Write the minimal `tsconfig.json` compiler options block enabling `strict` and `exactOptionalPropertyTypes`.
- **Hint 1**: Set both flags to `true`.

#### Exercise 2: Narrow catch block error
- **Task**: Write a function that catches an error, narrows it safely to `Error`, and returns its message or `"Unknown error"`.
- **Hint 1**: `err instanceof Error ? err.message : "Unknown error"`.

#### Exercise 3: Fix uninitialized class property
- **Task**: Fix a class with `title: string;` that fails under `strictPropertyInitialization`.
- **Hint 1**: Initialize in constructor: `constructor(title: string) { this.title = title; }`.

#### Exercise 4: Exact optional property assignment
- **Task**: Define an interface `Config { timeout?: number }`. Show an object assignment that is valid under standard optionality but rejected by `exactOptionalPropertyTypes`.
- **Hint 1**: `{ timeout: undefined }`.

---

### Exercise solutions

#### Solution 1: Enable strict configuration
```json
{
  "compilerOptions": {
    "strict": true,
    "exactOptionalPropertyTypes": true
  }
}
```

#### Solution 2: Narrow catch block error
```typescript
function getErrorMessage(action: () => void): string {
  try {
    action();
    return "ok";
  } catch (err) {
    if (err instanceof Error) {
      return err.message;
    }
    return "Unknown error";
  }
}
```

#### Solution 3: Fix uninitialized class property
```typescript
class DocumentModel {
  title: string;
  constructor(title: string) {
    this.title = title;
  }
}
```

#### Solution 4: Exact optional property assignment
```typescript
interface ServerConfig {
  port?: number;
}

// Invalid under exactOptionalPropertyTypes: true:
// const cfg: ServerConfig = { port: undefined };

// Valid:
const cfgValid1: ServerConfig = {};
const cfgValid2: ServerConfig = { port: 8080 };
```

---

### Recall
1. What master flag enables the core suite of type-safety checks? `"strict": true`.
2. What type does `catch (err)` receive under `strict: true`? `unknown`.
3. What does `exactOptionalPropertyTypes` enforce? That optional properties cannot be assigned explicit `undefined` unless `undefined` is explicitly part of the union type.

> **If you remember only one thing:**  
> `"strict": true` turns on the entire family of essential TypeScript safety checks, converting runtime errors into compile-time diagnostics.

---

# Topic 3: Safety Guard Flags (`noUncheckedIndexedAccess`, `noPropertyAccessFromIndexSignature`, `noFallthroughCasesInSwitch`)

### 1. What is it?
Beyond the `"strict": true` family, TypeScript provides advanced **Safety Guard Flags** that protect against subtle edge cases:
1. **`noUncheckedIndexedAccess`**: Forces all index lookups (e.g. `array[0]`, `record["key"]`) to include `undefined` in their return type.
2. **`noPropertyAccessFromIndexSignature`**: Disallows dot notation (`obj.foo`) for types defined with index signatures, requiring bracket notation (`obj["foo"]`).
3. **`noFallthroughCasesInSwitch`**: Disallows unintentional switch-case fallthrough when a case does not break or return.

### 2. Why does it exist?
By default, TypeScript dangerously assumes array lookups are always successful:
```typescript
// With noUncheckedIndexedAccess: false (Default TS behavior)
const items: string[] = [];
const item = items[0]; // Inferred as 'string', NOT 'string | undefined'!
console.log(item.toUpperCase()); // CRASHES AT RUNTIME with TypeError: Cannot read properties of undefined!
```
Enabling `noUncheckedIndexedAccess: true` forces `item` to be typed as `string | undefined`, requiring you to check if the item exists before calling methods on it.

### 3. Basic example

```typescript
// tsconfig.json:
// { "compilerOptions": { "noUncheckedIndexedAccess": true, "noPropertyAccessFromIndexSignature": true } }

// 1. Array index lookup:
const numbers: number[] = [10, 20, 30];
const first = numbers[0]; // Type is 'number | undefined'!

if (first !== undefined) {
  console.log(first * 2); // OK: narrowed to number
}

// 2. Record index lookup:
interface CacheStore {
  [key: string]: string; // Index signature
}

const cache: CacheStore = { host: "localhost" };

// COMPILE ERROR with noPropertyAccessFromIndexSignature: true:
// console.log(cache.host); // Error: Property 'host' comes from an index signature, so it must be accessed with ['host']

// CORRECT:
console.log(cache["host"]); // Inferred as 'string | undefined'
```

**Line-by-line explanation:**
- `const first = numbers[0]`: With `noUncheckedIndexedAccess: true`, accessing index `0` yields `number | undefined` because the array might be empty or out of bounds.
- `if (first !== undefined)`: You must verify presence before operating on the number.
- `cache["host"]`: `noPropertyAccessFromIndexSignature: true` forces bracket notation so developers don't confuse dynamic index signatures with explicitly declared fixed properties.

---

### 4. How it works inside TypeScript
1. **Type Widening at Lookups**: Every index access `T[K]` on an array or dictionary type is automatically unioned with `undefined`: `T[K] | undefined`.
2. **Tuple Exemption**: If an array is a fixed tuple (e.g. `[string, number]`), accessing index `0` remains `string` because the tuple length is statically proven.
3. **Switch Fallthrough Detection**: Checks that every non-empty case statement ends with `break`, `return`, or `throw`.

---

### 5. More examples

#### Example 1: `noFallthroughCasesInSwitch`
```typescript
function handleStatus(code: number) {
  switch (code) {
    case 1:
      console.log("Starting");
      // Missing 'break'!
      // COMPILE ERROR with noFallthroughCasesInSwitch: true: Fallthrough case in switch!
    case 2:
      console.log("Done");
      break;
  }
}
```

#### Example 2: Tuple safe access vs Array lookup
```typescript
type Coordinate = [number, number];
const pt: Coordinate = [10, 20];
const x = pt[0]; // Type: 'number' (Tuples guarantee bounds!)

const arr: number[] = [10, 20];
const y = arr[0]; // Type: 'number | undefined' (Arrays do NOT guarantee bounds!)
```

---

### 6. Common mistakes

#### Mistake 1: Relying on `array.length` checks without local caching
```typescript
// GOTCHA with noUncheckedIndexedAccess:
if (items.length > 0) {
  console.log(items[0].trim()); // Still typed as 'string | undefined' because items[0] could mutate!
}
```
**Why it happens:** TypeScript does not narrow array lookups based on length comparisons because external mutations could alter the array. Cache the lookup: `const first = items[0]; if (first) first.trim();`.

#### Mistake 2: Leaving `noUncheckedIndexedAccess` disabled in mission-critical applications
```json
// RISKY:
{ "compilerOptions": { "strict": true } } // noUncheckedIndexedAccess is NOT enabled by strict!
```
**Why it matters:** Out-of-bounds array access is one of the top causes of runtime crashes in production. Add `"noUncheckedIndexedAccess": true` explicitly.

---

### 7. Rules to remember
1. `noUncheckedIndexedAccess: true` adds `| undefined` to all array and record index lookups.
2. `noPropertyAccessFromIndexSignature: true` forbids dot-access (`obj.key`) on dynamic index signatures.
3. `noFallthroughCasesInSwitch: true` prevents accidental switch-case fallthrough bugs.
4. None of these three flags are included in `"strict": true`; you must enable them explicitly.

---

### Think first: Prediction puzzle
What is the type of `val` under `noUncheckedIndexedAccess: true`?

```typescript
const map: Record<string, number> = { count: 5 };
const val = map["count"];
```

---

**Answer:**
```
number | undefined
```
**Explanation:** Even though `"count"` is present in the object literal, `Record<string, number>` represents an arbitrary dynamic dictionary. Any key lookup might return undefined, so the type is `number | undefined`.

---

### Practice exercises

#### Exercise 1: Safe array item access
- **Task**: Write a function `getFirstElement<T>(arr: T[]): T | null` using a safe presence check compatible with `noUncheckedIndexedAccess: true`.
- **Hint 1**: `const el = arr[0]; return el !== undefined ? el : null;`.

#### Exercise 2: Switch fallthrough prevention
- **Task**: Write a switch statement handling `"start"`, `"stop"`, and `"pause"` that compiles cleanly under `noFallthroughCasesInSwitch: true`.
- **Hint 1**: Add `break;` to every non-empty case.

#### Exercise 3: Bracket notation enforcement
- **Task**: Given `interface Dict { [k: string]: boolean }`, access `"active"` in a way that satisfies `noPropertyAccessFromIndexSignature: true`.
- **Hint 1**: Use `dict["active"]` instead of `dict.active`.

#### Exercise 4: Safe dictionary lookup with fallback
- **Task**: Write a function that looks up a string key in `Record<string, string>` and returns a default string if missing.
- **Hint 1**: `dict[key] ?? defaultValue`.

---

### Exercise solutions

#### Solution 1: Safe array item access
```typescript
function getFirstElement<T>(arr: T[]): T | null {
  const item = arr[0];
  return item !== undefined ? item : null;
}
```

#### Solution 2: Switch fallthrough prevention
```typescript
function processAction(action: "start" | "stop" | "pause"): void {
  switch (action) {
    case "start":
      console.log("Started");
      break;
    case "stop":
      console.log("Stopped");
      break;
    case "pause":
      console.log("Paused");
      break;
  }
}
```

#### Solution 3: Bracket notation enforcement
```typescript
interface Dict {
  [k: string]: boolean;
}

function checkActive(dict: Dict): boolean {
  return dict["active"] ?? false;
}
```

#### Solution 4: Safe dictionary lookup with fallback
```typescript
function safeLookup(dict: Record<string, string>, key: string, fallback: string): string {
  return dict[key] ?? fallback;
}
```

---

### Recall
1. Is `noUncheckedIndexedAccess` enabled automatically by `"strict": true`? No, it must be enabled explicitly.
2. What does `noUncheckedIndexedAccess` add to array index lookup return types? `| undefined`.
3. What does `noPropertyAccessFromIndexSignature` forbid? Dot-notation access (`obj.prop`) on index signature types.

> **If you remember only one thing:**  
> Enable `"noUncheckedIndexedAccess": true` to force all array and dictionary lookups to check for `undefined`, preventing out-of-bounds crashes.

---

# Topic 4: Module Resolution Strategies: `node16`, `nodenext`, and `bundler`

### 1. What is it?
The **`moduleResolution`** compiler option controls how TypeScript resolves module paths inside `import` and `export` statements. Modern TypeScript (5.0+) provides three primary modern strategies:
1. **`node16` / `nodenext`**: Follows official Node.js ECMAScript Module (ESM) resolution rules. Requires explicit file extensions in relative imports (e.g. `import "./utils.js";`) and respects `package.json` `"exports"`.
2. **`bundler`**: Designed for tools like Vite, Webpack, esbuild, and Next.js. Allows extensionless imports (`import "./utils";`) while still respecting `package.json` `"exports"`.

### 2. Why does it exist?
Historically, TypeScript used `moduleResolution: "node"` (now called "node10"), which only understood CommonJS `require()` resolution. Node.js natively introduced ECMAScript Modules with strict rules:
- ESM requires `.js` file extensions in imports.
- ESM respects conditional `"exports"` subpaths.
Using `"node16"` or `"nodenext"` forces TypeScript to mimic actual Node.js runtime behavior, preventing "works in dev, crashes in production" import bugs.

### 3. Basic example

```typescript
// In modern NodeNext ESM:
// Even though the file on disk is 'math.ts', you MUST import it as 'math.js'!
import { calculateTotal } from "./math.js";

export function run() {
  return calculateTotal(10, 20);
}
```

```json
// tsconfig.json for pure modern Node.js 18+ (ESM):
{
  "compilerOptions": {
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "target": "ES2022"
  }
}
```

```json
// tsconfig.json for modern Web Frontend / Bundlers (Vite, Next.js, Rollup):
{
  "compilerOptions": {
    "module": "ESNext",
    "moduleResolution": "bundler",
    "target": "ES2022"
  }
}
```

**Line-by-line explanation:**
- `import { calculateTotal } from "./math.js"`: In `NodeNext`, the extension `.js` is required because the compiled output in Node.js will run as native ESM.
- `"moduleResolution": "NodeNext"`: Aligns with modern Node.js package resolution specifications.
- `"moduleResolution": "bundler"`: For frontend projects where Vite/Webpack handles extension resolution.

---

### 4. How it works inside TypeScript
1. **`package.json` `"type": "module"`**: In `NodeNext`, setting `"type": "module"` makes all `.ts` files compile to ES Modules. Setting `"type": "commonjs"` makes them compile to CommonJS.
2. **File Extensions**:
   - `.mts` $\to$ Compiles to `.mjs` (always ESM).
   - `.cts` $\to$ Compiles to `.cjs` (always CommonJS).
   - `.ts` $\to$ Follows `package.json` `"type"`.
3. **`package.json` `"exports"`**: `NodeNext` and `bundler` both respect package export maps, forbidding deep imports into internal files that aren't exported.

---

### 5. More examples

#### Example 1: Respecting `package.json` `"exports"` map
```json
// In third-party package: node_modules/my-lib/package.json
{
  "name": "my-lib",
  "exports": {
    ".": "./dist/index.js",
    "./feature": "./dist/feature.js"
  }
}
```
Under `moduleResolution: "NodeNext"` or `"bundler"`:
- `import { x } from "my-lib/feature";` $\to$ **Allowed**.
- `import { internal } from "my-lib/dist/internal.js";` $\to$ **Compile Error!** Package subpath is not exported!

---

### 6. Common mistakes

#### Mistake 1: Importing `.ts` extensions in `NodeNext`
```typescript
// WRONG under NodeNext:
import { add } from "./math.ts"; // Error: An import path can only end with a '.ts' extension when 'allowImportingTsExtensions' is enabled.
```
**Why it fails:** Node.js executes JavaScript files, not TypeScript files. In `NodeNext`, you write `import "./math.js";` because the emitted JavaScript file will be `./math.js`.

#### Mistake 2: Using `moduleResolution: "node"` (node10) in modern projects
```json
// OUTDATED:
{ "compilerOptions": { "moduleResolution": "node" } }
```
**Why it fails:** Legacy `node10` resolution does NOT support `package.json` `"exports"`, leading to silent failures when importing modern libraries.

---

### 7. Rules to remember
1. Use `moduleResolution: "NodeNext"` for modern Node.js applications and libraries.
2. Use `moduleResolution: "bundler"` for frontend applications built with Vite, Next.js, or esbuild.
3. In `NodeNext`, relative imports MUST end with `.js` or `.mjs`.
4. Both modern strategies respect `package.json` `"exports"` maps.

---

### Think first: Prediction puzzle
Does `import { helper } from "./helper.js";` compile if the file on disk is `helper.ts` under `moduleResolution: "NodeNext"`?

---

**Answer:**
```
Yes, this is required.
```
**Explanation:** Under `NodeNext`, TypeScript maps the `.js` import extension to the corresponding `.ts` source file during compilation, outputting valid native JavaScript ESM.

---

### Practice exercises

#### Exercise 1: Frontend bundler configuration
- **Task**: Write the `tsconfig.json` compiler options block for a Vite project.
- **Hint 1**: `"module": "ESNext"`, `"moduleResolution": "bundler"`.

#### Exercise 2: Node.js ESM configuration
- **Task**: Write the `tsconfig.json` compiler options for a pure Node.js 20 microservice.
- **Hint 1**: `"module": "NodeNext"`, `"moduleResolution": "NodeNext"`.

#### Exercise 3: Package subpath restriction test
- **Task**: Explain why `import "pkg/dist/hidden.js"` fails when `pkg` defines `"exports": { ".": "./dist/index.js" }`.
- **Hint 1**: The exports map restricts public access to explicitly listed paths.

#### Exercise 4: Explicit `.cts` CommonJS file
- **Task**: Create a `.cts` file and explain what extension it compiles to under `NodeNext`.
- **Hint 1**: Compiles to `.cjs`.

---

### Exercise solutions

#### Solution 1: Frontend bundler configuration
```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "strict": true
  }
}
```

#### Solution 2: Node.js ESM configuration
```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "strict": true
  }
}
```

#### Solution 3: Package subpath restriction test
In modern module resolution, the `exports` field acts as an encapsulation boundary. Any file not explicitly mapped in `"exports"` is treated as a private internal implementation detail and blocked by the compiler.

#### Solution 4: Explicit `.cts` CommonJS file
Files with `.cts` extensions are explicitly CommonJS TypeScript files. Under `NodeNext`, the compiler emits them as `.cjs` files using CommonJS `require()` and `module.exports`.

---

### Recall
1. Which module resolution strategy is designed for frontend bundlers like Vite and Next.js? `"bundler"`.
2. Which module resolution strategy requires `.js` extensions in relative imports? `"NodeNext"` (and `"Node16"`).
3. What feature in `package.json` allows packages to define explicit entry points? `"exports"`.

> **If you remember only one thing:**  
> Use `"moduleResolution": "NodeNext"` for modern Node.js and `"bundler"` for frontend applications; both strictly enforce package export boundaries.

---

# Topic 5: Path Aliases (`paths` and `baseUrl`) vs Subpath Imports (`#`) in `package.json`

### 1. What is it?
**Path Aliases** allow you to replace long relative import paths (`import "../../../utils/format"`) with clean aliases (`import "@/utils/format"`).
In modern development, there are two distinct approaches:
1. **TypeScript Path Aliases (`paths` and `baseUrl` in `tsconfig.json`)**: Compile-time only. Requires bundler plugins (like `tsconfig-paths` or Vite `vite-tsconfig-paths`) to resolve at runtime.
2. **Native Package Subpath Imports (`#` in `package.json`)**: The official Node.js standard. Works natively in Node.js 14+ with zero bundler plugins required.

### 2. Why does it exist?
Deeply nested relative paths (`../../../../services/user`) are error-prone and break when files are moved. Subpath imports provide clean, stable import specifiers that work across the entire codebase.

### 3. Basic example

#### Approach A: TypeScript `paths` in `tsconfig.json`
```json
// tsconfig.json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"],
      "@shared/*": ["packages/shared/src/*"]
    }
  }
}
```
```typescript
// Usage in code:
import { formatCurrency } from "@/utils/format";
```

#### Approach B: Native Subpath Imports in `package.json` (Recommended for Node.js)
```json
// package.json
{
  "name": "my-app",
  "type": "module",
  "imports": {
    "#utils/*": "./dist/utils/*.js",
    "#config": "./dist/config.js"
  }
}
```
```typescript
// Usage in code (Supported natively by Node.js runtime!):
import { formatCurrency } from "#utils/format.js";
```

---

### 4. How it works inside TypeScript
1. **`paths` is Compile-Time Only**: `tsc` does **NOT** rewrite import strings when compiling to JavaScript! If you write `import "@/utils"`, `tsc` outputs `import "@/utils"` into the `.js` file, which crashes in raw Node.js unless a runtime resolver or bundler is present.
2. **Native `#` Imports**: Supported natively by Node.js. When using `moduleResolution: "NodeNext"`, TypeScript recognizes `#` imports declared in `package.json` without requiring any `paths` in `tsconfig.json`.

---

### 5. More examples

#### Example 1: Conditional subpath imports (Environment Swapping)
```json
// package.json: Native conditional subpath imports
{
  "imports": {
    "#database": {
      "production": "./dist/db/postgres.js",
      "test": "./dist/db/mock-db.js",
      "default": "./dist/db/sqlite.js"
    }
  }
}
```
In your code, `import db from "#database";` dynamically resolves to the mock database during test runs and Postgres in production!

---

### 6. Common mistakes

#### Mistake 1: Expecting `tsc` to rewrite `paths` aliases in emitted JavaScript
```typescript
// FATAL MISTAKE:
// tsconfig.json has paths: { "@/*": ["src/*"] }
// Compile with 'tsc':
// Emitted dist/index.js contains: import { x } from "@/utils";
// Running 'node dist/index.js' throws: Error: Cannot find package '@'
```
**Why it fails:** TypeScript's `paths` option is exclusively a type-checking declaration. It deliberately does NOT rewrite module specifier strings. For Node.js without a bundler, use native `#` imports or `tsc-alias`.

#### Mistake 2: Missing `baseUrl` when using `paths`
```json
// In TS < 4.1:
{
  "compilerOptions": {
    "paths": { "@/*": ["src/*"] } // Error: 'paths' requires 'baseUrl' to be set!
  }
}
```
**Why it fails:** In older TypeScript versions, `paths` required `baseUrl`. In TS 4.1+, `paths` can resolve relative to the `tsconfig.json` directory without `baseUrl`.

---

### 7. Rules to remember
1. `tsconfig.json` `paths` does NOT rewrite emitted JavaScript imports.
2. For pure Node.js projects, prefer native `package.json` `"imports"` with `#` prefix.
3. For frontend projects, bundlers (Vite/Webpack) resolve `paths` aliases during bundling.
4. Native `#` imports allow conditional environment swapping directly in Node.js.

---

### Think first: Prediction puzzle
Does `node dist/main.js` succeed if `main.js` contains `import "@/math";` without a bundler or loader?

---

**Answer:**
```
No, it crashes with 'Cannot find package @'.
```
**Explanation:** Node.js has no built-in knowledge of `tsconfig.json` `paths`. It interprets `@/math` as an npm package named `@`, which does not exist.

---

### Practice exercises

#### Exercise 1: Configure `@app/*` alias
- **Task**: Configure `paths` in `tsconfig.json` to map `@app/*` to `src/*`.
- **Hint 1**: `"paths": { "@app/*": ["src/*"] }`.

#### Exercise 2: Configure native package subpath import
- **Task**: Add an `#internal/*` subpath import to `package.json` mapping to `./src/*.ts` in dev.
- **Hint 1**: `"imports": { "#internal/*": "./src/*.ts" }`.

#### Exercise 3: Multi-directory path fallback
- **Task**: Map `@assets/*` to look first in `src/assets/*` and then fall back to `shared/assets/*`.
- **Hint 1**: `"@assets/*": ["src/assets/*", "shared/assets/*"]`.

#### Exercise 4: Explain runtime crash of `tsc` emitted paths
- **Task**: Write a short explanation of why running raw `tsc` output with path aliases fails in Node.js.
- **Hint 1**: `tsc` leaves import specifiers unchanged.

---

### Exercise solutions

#### Solution 1: Configure `@app/*` alias
```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@app/*": ["src/*"]
    }
  }
}
```

#### Solution 2: Configure native package subpath import
```json
{
  "name": "my-service",
  "imports": {
    "#internal/*": "./src/*.js"
  }
}
```

#### Solution 3: Multi-directory path fallback
```json
{
  "compilerOptions": {
    "paths": {
      "@assets/*": ["src/assets/*", "shared/assets/*"]
    }
  }
}
```

#### Solution 4: Explain runtime crash of `tsc` emitted paths
TypeScript is designed not to alter module specifiers during compilation. Because Node.js resolution does not parse `tsconfig.json`, it treats `@app` as an external npm dependency rather than a local folder, resulting in a runtime `MODULE_NOT_FOUND` crash.

---

### Recall
1. Does `tsc` rewrite `paths` imports into relative paths when emitting JavaScript? No.
2. What is the native Node.js standard for subpath imports? The `"imports"` field in `package.json` using the `#` prefix.
3. How can you resolve `paths` in frontend projects? Using bundler plugins (e.g. `vite-tsconfig-paths`).

> **If you remember only one thing:**  
> TypeScript `paths` are compile-time only and never rewritten by `tsc`; use native `package.json` `#imports` for zero-tooling Node.js path aliases.

---

# Checkpoint Challenge 1: TSConfig Hardening & Resolution (Topics 1-5)

### Challenge Specification
Design an Enterprise Node.js Service Configuration:
1. Create a **Hardened Base Config** (`tsconfig.base.json`) with strict flags, `noUncheckedIndexedAccess`, and `NodeNext` module resolution.
2. Create an **App Config** (`tsconfig.json`) inheriting from the base with root and output directories.
3. Demonstrate a code snippet that validates array access safely under `noUncheckedIndexedAccess`.
4. Demonstrate a `package.json` utilizing native `#` subpath imports.

### Solution

```json
// 1. tsconfig.base.json (Hardened Enterprise Standard)
{
  "$schema": "https://json.schemastore.org/tsconfig",
  "compilerOptions": {
    "target": "ES2022",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "strict": true,
    "exactOptionalPropertyTypes": true,
    "noUncheckedIndexedAccess": true,
    "noPropertyAccessFromIndexSignature": true,
    "noFallthroughCasesInSwitch": true,
    "skipLibCheck": true,
    "esModuleInterop": true
  }
}
```

```json
// 2. tsconfig.json (Application package)
{
  "extends": "./tsconfig.base.json",
  "compilerOptions": {
    "rootDir": "./src",
    "outDir": "./dist"
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "**/*.spec.ts"]
}
```

```json
// 3. package.json with Native Subpath Imports
{
  "name": "enterprise-order-service",
  "version": "1.0.0",
  "type": "module",
  "imports": {
    "#services/*": "./dist/services/*.js",
    "#config": "./dist/config.js"
  }
}
```

```typescript
// 4. src/main.ts: Verification code adhering to strict compiler guards
interface ConfigDictionary {
  [key: string]: string;
}

export function runService(rawArgs: string[], dynamicConfig: ConfigDictionary) {
  // Safe Array Access (guarded by noUncheckedIndexedAccess)
  const primaryCommand = rawArgs[0];
  if (primaryCommand === undefined) {
    throw new Error("Missing required primary command argument");
  }

  // Safe Index Signature Access (guarded by noPropertyAccessFromIndexSignature)
  const dbUrl = dynamicConfig["DATABASE_URL"];
  if (dbUrl === undefined) {
    throw new Error("Missing DATABASE_URL in config dictionary");
  }

  console.log(`Executing ${primaryCommand} with DB: ${dbUrl}`);
}
```


---

# Topic 6: Project References and Composite Builds (`composite: true`, `references`, `tsc -b`)

### 1. What is it?
**Project References** enable you to structure a TypeScript codebase into multiple independent, interconnected projects. A root `tsconfig.json` references sub-projects using the `"references"` array. Sub-projects enable **`"composite": true`**, and the compiler is invoked in **Build Mode** using **`tsc --build`** (or **`tsc -b`**).

### 2. Why does it exist?
In a large monorepo with 50 packages, compiling the entire codebase as a single monolithic project is extremely slow. If package A changes, the compiler has to recheck all 50 packages. With Project References:
- TypeScript builds packages in topological dependency order.
- If package A has not changed, TypeScript skips it entirely, reading its cached `.d.ts` declaration files instead of rechecking its source code.
- Boundary enforcement: Package B cannot import from Package A unless Package B explicitly declares a reference to Package A.

### 3. Basic example

```
monorepo/
├── tsconfig.base.json
├── tsconfig.json          (Root orchestrator)
├── packages/
│   ├── core/
│   │   ├── tsconfig.json  (Composite library)
│   │   └── src/index.ts
│   └── api/
│       ├── tsconfig.json  (Consumes core)
│       └── src/server.ts
```

```json
// packages/core/tsconfig.json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "composite": true,
    "outDir": "./dist",
    "rootDir": "./src",
    "declaration": true
  },
  "include": ["src/**/*"]
}
```

```json
// packages/api/tsconfig.json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "composite": true,
    "outDir": "./dist",
    "rootDir": "./src"
  },
  "references": [
    { "path": "../core" } // Explicitly declare dependency on core!
  ],
  "include": ["src/**/*"]
}
```

```json
// Root orchestrator: /tsconfig.json
{
  "files": [],
  "references": [
    { "path": "./packages/core" },
    { "path": "./packages/api" }
  ]
}
```

**Terminal Build Command:**
```bash
# Builds both projects in topological order (core first, then api)
tsc --build
```

---

### 4. How it works inside TypeScript
1. **The `composite: true` Requirements**: Setting `composite: true` enforces three strict constraints:
   - `declaration: true` is automatically enabled.
   - `rootDir` must be explicitly specified (or defaults to the config directory).
   - Every implementation file must be matched by an `include` pattern or listed in `files`.
2. **Topological Sort**: `tsc -b` analyzes references and builds leaf dependencies first.
3. **Smart Skip**: If `core/dist/index.d.ts` is up to date, building `api` reads only `index.d.ts`, completely skipping `core/src/index.ts`.

---

### 5. More examples

#### Example 1: Cleaning build artifacts with `tsc -b --clean`
```bash
# Deletes all emitted .js, .d.ts, and .tsbuildinfo files across all referenced projects
tsc --build --clean
```

#### Example 2: Watching all referenced projects simultaneously
```bash
# Watches and incrementally rebuilds only affected projects upon file changes
tsc --build --watch
```

---

### 6. Common mistakes

#### Mistake 1: Invoking `tsc` instead of `tsc --build`
```bash
# WRONG in a monorepo root:
tsc # Compiles only the root tsconfig.json (which has empty files: []) and does NOTHING!
```
**Why it fails:** Standard `tsc` does not traverse the `references` array. You MUST invoke `tsc --build` (or `tsc -b`) to build project references.

#### Mistake 2: Circular project references
```json
// packages/a references packages/b
// packages/b references packages/a
```
**Why it fails:** `tsc -b` will crash with: `Project references may not form a circular graph`. Refactor shared code into a third package (`packages/common`).

---

### 7. Rules to remember
1. Always build project reference monorepos with `tsc --build` (or `tsc -b`).
2. Sub-projects must enable `"composite": true`.
3. The root orchestrator `tsconfig.json` typically has `"files": []` and references all packages.
4. Circular project references are forbidden.

---

### Think first: Prediction puzzle
What does `tsc -b --dry` do?

---

**Answer:**
```
It shows what projects would be built without actually compiling any files.
```
**Explanation:** `--dry` simulates the build plan and logs which projects are out of date and need compilation.

---

### Practice exercises

#### Exercise 1: Configure a composite library
- **Task**: Write a `tsconfig.json` for a library package enabling composite mode and declaration output.
- **Hint 1**: Set `"composite": true` and `"declaration": true`.

#### Exercise 2: Add project reference
- **Task**: Update an application `tsconfig.json` to depend on `../shared`.
- **Hint 1**: `"references": [{ "path": "../shared" }]`.

#### Exercise 3: Root orchestrator config
- **Task**: Write a root `tsconfig.json` with empty files array referencing packages `a` and `b`.
- **Hint 1**: `"files": []`, `"references": [{ "path": "./packages/a" }, { "path": "./packages/b" }]`.

#### Exercise 4: Clean build artifacts command
- **Task**: Write the command to wipe all compiled output across all referenced monorepo projects.
- **Hint 1**: `tsc -b --clean`.

---

### Exercise solutions

#### Solution 1: Configure a composite library
```json
{
  "compilerOptions": {
    "composite": true,
    "declaration": true,
    "outDir": "./dist",
    "rootDir": "./src"
  },
  "include": ["src/**/*"]
}
```

#### Solution 2: Add project reference
```json
{
  "compilerOptions": {
    "composite": true,
    "outDir": "./dist",
    "rootDir": "./src"
  },
  "references": [
    { "path": "../shared" }
  ],
  "include": ["src/**/*"]
}
```

#### Solution 3: Root orchestrator config
```json
{
  "files": [],
  "references": [
    { "path": "./packages/core" },
    { "path": "./packages/web" }
  ]
}
```

#### Solution 4: Clean build artifacts command
```bash
tsc -b --clean
```

---

### Recall
1. What command builds a project reference monorepo? `tsc --build` (or `tsc -b`).
2. What flag must be enabled in sub-projects to allow them to be referenced? `"composite": true`.
3. Why does Project References speed up large builds? Because unchanged projects are skipped, and dependents only read lightweight `.d.ts` declaration files.

> **If you remember only one thing:**  
> Project references (`"composite": true` + `tsc -b`) break large codebases into modular packages that compile in dependency order with aggressive caching.

---

# Topic 7: Incremental Compilation and Build Caching (`incremental: true`, `.tsbuildinfo`)

### 1. What is it?
**Incremental Compilation** (`"incremental": true`) instructs TypeScript to save compilation metadata to a cache file called **`.tsbuildinfo`**. On subsequent builds, the compiler reads this file to determine which source files have changed and only recompiles the affected files and their dependents.

### 2. Why does it exist?
In medium-to-large projects, cold builds can take 10 to 30 seconds. Most developer changes affect only one or two files. With incremental caching, subsequent builds finish in under 1 second because the compiler avoids re-parsing and re-checking unchanged files.

### 3. Basic example

```json
// tsconfig.json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "NodeNext",
    "strict": true,
    "incremental": true,
    "tsBuildInfoFile": "./.cache/tsconfig.tsbuildinfo",
    "outDir": "./dist",
    "rootDir": "./src"
  },
  "include": ["src/**/*"]
}
```

**Compilation Execution:**
```bash
# First build (Cold): Computes full project, generates dist/ and .cache/tsconfig.tsbuildinfo
tsc

# Second build (Warm): Reads .tsbuildinfo, detects 0 changes, completes in milliseconds!
tsc
```

**Line-by-line explanation:**
- `"incremental": true`: Enables build state serialization.
- `"tsBuildInfoFile": "./.cache/tsconfig.tsbuildinfo"`: Specifies the exact file path where the build cache is stored (keeps root directories clean).
- On the next run, `tsc` checks file hashes against `.tsbuildinfo` and skips re-checking unchanged source trees.

---

### 4. How it works inside TypeScript
1. **The `.tsbuildinfo` Contents**: Stores:
   - Cryptographic hashes of all source files.
   - The compiler options used during the build.
   - The directed dependency graph of imports and type references.
2. **Composite Projects**: Setting `"composite": true` automatically enables `"incremental": true`.
3. **Invalidation**: If compiler options change (e.g. you toggle `strict: false` to `true`), TypeScript automatically invalidates the cache and executes a cold rebuild.

---

### 5. More examples

#### Example 1: Git-ignoring build cache
```gitignore
# .gitignore
dist/
.cache/
*.tsbuildinfo
```
Always git-ignore `.tsbuildinfo` files. They represent local build state and should not be committed to version control.

#### Example 2: Profiling incremental speedups via CLI
```bash
# Measure build times with extended diagnostics
tsc --extendedDiagnostics
```
Check the output for:
- `Files:` (number of files checked)
- `Check time:` (time spent in checker)
- `Total time:`

---

### 6. Common mistakes

#### Mistake 1: Committing `.tsbuildinfo` to Git
```gitignore
# WRONG: Forgetting to add *.tsbuildinfo to .gitignore
```
**Why it fails:** If Developer A commits `.tsbuildinfo` from their machine, Developer B or the CI server will have mismatched timestamps and corrupted caching, leading to bizarre build failures.

#### Mistake 2: Missing `tsBuildInfoFile` in custom multi-target configs
```json
// tsconfig.cjs.json and tsconfig.esm.json both set "incremental": true without custom tsBuildInfoFile
```
**Why it fails:** Both configurations will overwrite the same default `tsconfig.tsbuildinfo` file in the root, repeatedly wiping each other's cache! Set custom paths: `"tsBuildInfoFile": "./.cache/cjs.tsbuildinfo"`.

---

### 7. Rules to remember
1. `"incremental": true` saves build state to `.tsbuildinfo`.
2. `"composite": true` automatically implies `"incremental": true`.
3. Always add `*.tsbuildinfo` to `.gitignore`.
4. Provide distinct `tsBuildInfoFile` paths if multiple `tsconfig` files share the same directory.

---

### Think first: Prediction puzzle
Does changing a comment in a file trigger a full recheck of all dependent files under incremental compilation?

---

**Answer:**
```
No.
```
**Explanation:** If declaration output (`.d.ts`) does not change, TypeScript knows the public type surface of the file is identical, so it does not need to recheck dependent files.

---

### Practice exercises

#### Exercise 1: Enable incremental caching
- **Task**: Configure `tsconfig.json` with `incremental: true` saving to `./build/.tsbuildinfo`.
- **Hint 1**: Set `incremental` and `tsBuildInfoFile`.

#### Exercise 2: Diagnose warm build
- **Task**: Run `tsc --extendedDiagnostics` twice in a row and compare check time.
- **Hint 1**: Look for `Check time` reduction.

#### Exercise 3: Multi-config build info isolation
- **Task**: Write the `tsBuildInfoFile` setting for `tsconfig.esm.json` to prevent conflict with `tsconfig.cjs.json`.
- **Hint 1**: `"tsBuildInfoFile": "./node_modules/.cache/esm.tsbuildinfo"`.

#### Exercise 4: Gitignore verification
- **Task**: Write the `.gitignore` pattern to ignore all tsbuildinfo files in any subdirectory.
- **Hint 1**: `**/*.tsbuildinfo`.

---

### Exercise solutions

#### Solution 1: Enable incremental caching
```json
{
  "compilerOptions": {
    "incremental": true,
    "tsBuildInfoFile": "./build/.tsbuildinfo"
  }
}
```

#### Solution 2: Diagnose warm build
```bash
tsc --extendedDiagnostics
tsc --extendedDiagnostics
```

#### Solution 3: Multi-config build info isolation
```json
{
  "compilerOptions": {
    "incremental": true,
    "tsBuildInfoFile": "./.cache/esm.tsbuildinfo"
  }
}
```

#### Solution 4: Gitignore verification
```gitignore
**/*.tsbuildinfo
```

---

### Recall
1. What file does incremental compilation produce? `.tsbuildinfo`.
2. Does `composite: true` require explicitly setting `incremental: true`? No, composite mode enables it automatically.
3. Should `.tsbuildinfo` be committed to version control? No, it should always be git-ignored.

> **If you remember only one thing:**  
> `"incremental": true` drastically speeds up builds by caching dependency graphs and file hashes in `.tsbuildinfo`.

---

# Topic 8: Declaration Files (`.d.ts`), `declaration`, `declarationMap`, and `emitDeclarationOnly`

### 1. What is it?
A **Declaration File (`.d.ts`)** contains purely TypeScript type information with zero executable JavaScript code.
Three key compiler flags control declaration emission:
1. **`"declaration": true`**: Emits corresponding `.d.ts` files alongside JavaScript output.
2. **`"declarationMap": true`**: Emits sourcemaps (`.d.ts.map`) linking generated `.d.ts` files back to original `.ts` source files.
3. **`"emitDeclarationOnly": true`**: Tells `tsc` to emit **only** `.d.ts` files, emitting zero `.js` files (used when Babel, SWC, or Vite handles the JavaScript emission).

### 2. Why does it exist?
When publishing an npm package or building a monorepo library, external consumers need type definitions to compile their code. Emitting `.d.ts` files provides type safety without exposing source code. Enabling `"declarationMap": true` allows consumers using "Go to Definition" in VS Code to jump directly into the original `.ts` source code rather than stopping inside a generated `.d.ts` file!

### 3. Basic example

```json
// tsconfig.build.json (Library packaging configuration)
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "declaration": true,
    "declarationMap": true,
    "outDir": "./dist",
    "rootDir": "./src"
  }
}
```

**Given `src/math.ts`:**
```typescript
export function multiply(a: number, b: number): number {
  return a * b;
}
```

**Emitted Files in `dist/`:**
1. `math.js`: `export function multiply(a, b) { return a * b; }`
2. `math.d.ts`: `export declare function multiply(a: number, b: number): number;`
3. `math.d.ts.map`: `{"version":3,"file":"math.d.ts","sourceRoot":"","sources":["../src/math.ts"],...}`

---

### 4. How it works inside TypeScript
1. **Declaration Maps**: `.d.ts.map` files contain a source map mapping tokens in `math.d.ts` to character positions in `math.ts`.
2. **IDE Navigation**: When a developer holds `Ctrl` and clicks `multiply()` from an external package, VS Code reads `math.d.ts.map` and opens `src/math.ts` directly.
3. **`emitDeclarationOnly`**: Used in pipelines where tools like esbuild or SWC transpile the JavaScript code at 100x speed, and `tsc --emitDeclarationOnly` is run separately to generate types.

---

### 5. More examples

#### Example 1: High-Speed Build Pipeline Architecture
```
+-------------------------------------------------------------------+
|               High-Performance Modern Build Pipeline              |
+-------------------------------------------------------------------+
|  Source: src/index.ts                                             |
|        │                                                          |
|        ├──> [esbuild / SWC / Vite] ──> dist/index.js (Blazing Fast)|
|        │                                                          |
|        └──> [tsc --emitDeclarationOnly] ──> dist/index.d.ts       |
+-------------------------------------------------------------------+
```

#### Example 2: `declarationDir` for separating types
```json
{
  "compilerOptions": {
    "outDir": "./dist/js",
    "declaration": true,
    "declarationDir": "./dist/types" // Emits all .d.ts files into a dedicated folder
  }
}
```

---

### 6. Common mistakes

#### Mistake 1: Publishing libraries without `declarationMap`
```json
// INCOMPLETE:
{
  "compilerOptions": {
    "declaration": true // Missing declarationMap!
  }
}
```
**Why it matters:** Without `declarationMap`, monorepo developers and library users using "Go to Definition" land in unhelpful generated `.d.ts` files with no comments or implementation details. Always include `"declarationMap": true`.

#### Mistake 2: Missing `emitDeclarationOnly` when using SWC/Babel
```bash
# WRONG: Running full tsc when SWC already generated JS
tsc # Generates JS files again, overwriting SWC's output!
```
**Why it fails:** Use `tsc --emitDeclarationOnly` so TypeScript only produces `.d.ts` files without touching JavaScript output.

---

### 7. Rules to remember
1. Always enable `"declaration": true` when building libraries or monorepo packages.
2. Always enable `"declarationMap": true` for seamless "Go to Definition" in IDEs.
3. Use `"emitDeclarationOnly": true` when a separate fast bundler (esbuild, Vite, SWC) emits the JavaScript.
4. Use `"declarationDir"` if you want declaration files placed in a separate directory from JavaScript output.

---

### Think first: Prediction puzzle
Does `tsc --emitDeclarationOnly` emit any `.js` files?

---

**Answer:**
```
No.
```
**Explanation:** `--emitDeclarationOnly` strictly emits `.d.ts` and `.d.ts.map` files, producing zero `.js` output.

---

### Practice exercises

#### Exercise 1: Library declaration config
- **Task**: Write `compilerOptions` enabling declaration files and declaration maps into `./types`.
- **Hint 1**: Set `declaration: true`, `declarationMap: true`, and `declarationDir: "./types"`.

#### Exercise 2: Type generation CLI command
- **Task**: Write the `tsc` CLI command to emit only declaration files for project `tsconfig.build.json`.
- **Hint 1**: `tsc -p tsconfig.build.json --emitDeclarationOnly`.

#### Exercise 3: Inspect generated `.d.ts`
- **Task**: Given `export const x = 100;`, write the corresponding line emitted in `.d.ts`.
- **Hint 1**: `export declare const x = 100;` (or `export declare const x: 100;`).

#### Exercise 4: Source map verification
- **Task**: Name the extension of the source map file generated for `index.d.ts`.
- **Hint 1**: `index.d.ts.map`.

---

### Exercise solutions

#### Solution 1: Library declaration config
```json
{
  "compilerOptions": {
    "declaration": true,
    "declarationMap": true,
    "declarationDir": "./types"
  }
}
```

#### Solution 2: Type generation CLI command
```bash
tsc -p tsconfig.build.json --emitDeclarationOnly
```

#### Solution 3: Inspect generated `.d.ts`
```typescript
export declare const x = 100;
```

#### Solution 4: Source map verification
The file generated is `index.d.ts.map`.

---

### Recall
1. What does `"declarationMap": true` enable in IDEs? Allows "Go to Definition" to navigate directly into original `.ts` source files.
2. What flag tells TypeScript to emit only type definitions? `"emitDeclarationOnly": true`.
3. Which directory setting separates `.d.ts` files from `.js` files? `"declarationDir"`.

> **If you remember only one thing:**  
> Always pair `"declaration": true` with `"declarationMap": true` so consumers can navigate directly into your original source files.

---

# Topic 9: TypeScript 5.5+ `isolatedDeclarations` for Blazing Fast Multi-Threaded Builds

### 1. What is it?
Introduced in **TypeScript 5.5**, **`"isolatedDeclarations": true`** is a revolutionary compiler mode that guarantees every single file can have its `.d.ts` declaration file generated in complete isolation without running the full type checker or checking imported dependencies.

### 2. Why does it exist?
Historically, generating `.d.ts` files required running the entire TypeScript Type Checker. If a function omitted an explicit return type:
```typescript
export function compute(x: number) {
  return helper(x); // TypeScript must resolve helper() across other files to infer the return type for .d.ts!
}
```
Because of this, tools like SWC, esbuild, and oxc could not emit `.d.ts` files in parallel. With `"isolatedDeclarations": true`, TypeScript forces developers to write explicit return types and annotations on all exported declarations, enabling multi-threaded Rust/Go tools to emit `.d.ts` files up to **20x to 50x faster**.

### 3. Basic example

```json
// tsconfig.json
{
  "compilerOptions": {
    "declaration": true,
    "isolatedDeclarations": true
  }
}
```

```typescript
// ERROR with isolatedDeclarations: true:
// export function add(a: number, b: number) {
//   return a + b;
// }
// Compiler Diagnostic: Function must have an explicit return type annotation with isolatedDeclarations.

// CORRECT:
export function add(a: number, b: number): number {
  return a + b;
}

// CORRECT: Non-exported internal functions do NOT require explicit return types:
function internalHelper(x: number) {
  return x * 2; // Allowed! Not exported!
}
```

**Line-by-line explanation:**
- `"isolatedDeclarations": true`: Activates the rule that all exported entities must have explicit types.
- `export function add(...): number`: Explicit `: number` return type allows an external tool (like `oxc_transform`) to emit `export declare function add(a: number, b: number): number;` by looking ONLY at this single file!
- Internal (non-exported) functions can still use type inference freely.

---

### 4. How it works inside TypeScript
1. **Single-File Syntactic Generation**: When all exported symbols have explicit type annotations, emitting `.d.ts` becomes a trivial AST syntax copy operation that requires zero semantic type checking.
2. **Parallel Tooling Ecosystem**: Enables tools written in Rust (such as `oxc`, `swc`, and `tsdown`) to generate declarations across multi-core CPUs in parallel.
3. **Monorepo Build Speedups**: Huge monorepos can generate types for hundreds of packages in seconds.

---

### 5. More examples

#### Example 1: Explicit types on exported consts
```typescript
// ERROR under isolatedDeclarations:
// export const API_CONFIG = {
//   timeout: 5000,
// }; // Error: Expression type can't be inferred with isolatedDeclarations.

// CORRECT:
export interface ApiConfig {
  timeout: number;
}

export const API_CONFIG: ApiConfig = {
  timeout: 5000,
};
```

#### Example 2: Class property annotations
```typescript
export class UserSession {
  // ERROR: id = "session_1"; // Error: Property must have an explicit type annotation
  // CORRECT:
  id: string = "session_1";
}
```

---

### 6. Common mistakes

#### Mistake 1: Trying to enable `isolatedDeclarations` without `declaration`
```json
// WRONG:
{
  "compilerOptions": {
    "isolatedDeclarations": true // Error: 'isolatedDeclarations' can only be used when 'declaration' or 'composite' is enabled!
  }
}
```
**Why it fails:** `isolatedDeclarations` exists to govern declaration emission. You must enable `"declaration": true` or `"composite": true`.

#### Mistake 2: Writing complex mapped types in exports without named type aliases
```typescript
// Hard for single-file declaration emitters to resolve:
// Prefer named interfaces or type aliases for exported entities.
```

---

### 7. Rules to remember
1. `isolatedDeclarations` requires TypeScript 5.5+ and `"declaration": true`.
2. All exported functions, methods, and getters must have explicit return type annotations.
3. All exported variables and properties must have explicit type annotations.
4. Internal (non-exported) functions and variables can still use full type inference.

---

### Think first: Prediction puzzle
Does `isolatedDeclarations` require explicit return types on private `#privateMethods()` inside an exported class?

---

**Answer:**
```
No.
```
**Explanation:** Private members (`#method` or `private method`) are not part of the public declaration contract of the class in `.d.ts` files, so explicit annotations are not mandatory on them.

---

### Practice exercises

#### Exercise 1: Fix unannotated exported function
- **Task**: Annotate `export const isReady = (val: boolean) => !val;` so it passes `isolatedDeclarations`.
- **Hint 1**: `(val: boolean): boolean => !val`.

#### Exercise 2: Fix unannotated exported constant
- **Task**: Annotate `export const DEFAULT_PORT = 3000;` to satisfy `isolatedDeclarations`.
- **Hint 1**: `export const DEFAULT_PORT: number = 3000;`.

#### Exercise 3: Enable isolatedDeclarations
- **Task**: Write the `tsconfig.json` fragment enabling `declaration` and `isolatedDeclarations`.
- **Hint 1**: Set both to `true`.

#### Exercise 4: Identify why non-exported functions are exempt
- **Task**: Explain why `function localHelper(x: number) { return x; }` does not require a return type.
- **Hint 1**: Non-exported functions do not appear in emitted `.d.ts` files.

---

### Exercise solutions

#### Solution 1: Fix unannotated exported function
```typescript
export const isReady = (val: boolean): boolean => !val;
```

#### Solution 2: Fix unannotated exported constant
```typescript
export const DEFAULT_PORT: number = 3000;
```

#### Solution 3: Enable isolatedDeclarations
```json
{
  "compilerOptions": {
    "declaration": true,
    "isolatedDeclarations": true
  }
}
```

#### Solution 4: Identify why non-exported functions are exempt
Declaration files (`.d.ts`) only expose public, exported APIs. Because non-exported functions are omitted entirely from the generated declaration file, their return types do not need to be written to disk.

---

### Recall
1. In what TypeScript version was `isolatedDeclarations` introduced? TypeScript 5.5.
2. What does `isolatedDeclarations` enforce on exported functions? Explicit return type annotations.
3. What is the primary benefit of `isolatedDeclarations`? Allows ultra-fast multi-threaded non-TypeScript compilers (like Rust-based SWC/oxc) to generate `.d.ts` files in parallel.

> **If you remember only one thing:**  
> `"isolatedDeclarations": true` enforces explicit annotations on all exported APIs, unlocking 20x faster declaration generation via external build tools.

---

# Topic 10: Ambient Declarations (`declare module`, `declare global`, asset typing for `.svg`/`.css`)

### 1. What is it?
**Ambient Declarations** describe the shape of existing JavaScript code, global variables, or non-code assets (such as CSS modules or image files) without providing any executable implementation. They are declared using the **`declare`** keyword:
- `declare module "name"`: Types an untyped third-party package or file extension.
- `declare global`: Augments the global window or runtime scope.
- Asset declarations: Allows importing `.svg`, `.png`, or `.module.css` files without compile errors.

### 2. Why does it exist?
TypeScript is designed to work in real-world web environments where global variables exist (like `window.gtag` or `process.env`) and where bundlers allow importing images and stylesheets. Without ambient declarations, importing `import logo from "./logo.svg"` causes a compile error: `Cannot find module './logo.svg'`.

### 3. Basic example

```typescript
// globals.d.ts (Ambient type declaration file)

// 1. Ambient Asset Declarations:
declare module "*.svg" {
  const content: string;
  export default content;
}

declare module "*.module.css" {
  const classes: Record<string, string>;
  export default classes;
}

// 2. Global Window Augmentation:
declare global {
  interface Window {
    analyticsId: string;
    triggerCustomEvent(name: string): void;
  }

  // Augment process.env
  namespace NodeJS {
    interface ProcessEnv {
      DATABASE_URL: string;
      PORT?: string;
    }
  }
}

// Ensures this file is treated as a module:
export {};
```

```typescript
// app.ts (Consuming ambient declarations seamlessly)
import styles from "./button.module.css";
import icon from "./arrow.svg";

console.log(styles["btn-primary"]); // Inferred as string
console.log(icon.toUpperCase());    // Inferred as string

window.analyticsId = "GA_12345";
window.triggerCustomEvent("page_view");
```

**Line-by-line explanation:**
- `declare module "*.svg"`: Wildcard module declaration. Tells the compiler that any import ending with `.svg` returns a default string export.
- `declare global`: Opens up the global scope to add properties to `Window` and `ProcessEnv`.
- `export {}`: Turns the `.d.ts` file into an ES module so that `declare global` augments the existing global scope rather than replacing it.

---

### 4. How it works inside TypeScript
1. **Zero JS Emission**: Declarations starting with `declare` produce zero JavaScript code. They are purely compile-time constructs.
2. **Declaration Merging**: Writing `interface Window` inside `declare global` merges with the browser's built-in `Window` interface.
3. **Wildcard Resolution**: The compiler matches `import logo from "./logo.svg"` against `declare module "*.svg"`.

---

### 5. More examples

#### Example 1: Typing an untyped third-party library
```typescript
// types/untyped-lib.d.ts
declare module "legacy-chart-library" {
  export function renderChart(elementId: string, data: number[]): void;
  export const version: string;
}
```

#### Example 2: Module-level subpath declaration
```typescript
declare module "my-lib/plugins/*" {
  const plugin: { init(): void };
  export default plugin;
}
```

---

### 6. Common mistakes

#### Mistake 1: Forgetting `export {}` in files with `declare global`
```typescript
// WRONG: A declaration file with NO imports or exports is a script, NOT a module!
declare global {
  // If the file has no imports/exports, declare global is a SYNTAX ERROR!
}
```
**Why it fails:** In TypeScript, `declare global` can only be used inside a module. If a file has no `import` or `export` statements, add `export {};` at the bottom.

#### Mistake 2: Including implementation code in a `.d.ts` file
```typescript
// WRONG: In a .d.ts file
declare module "math" {
  export function add(a: number, b: number) { return a + b; } // Error: Initializers are not allowed in ambient contexts!
}
```
**Why it fails:** Ambient declarations can only declare signatures, never function bodies or runtime assignments.

---

### 7. Rules to remember
1. Use `declare module "*.ext"` to type non-code assets (CSS, SVG, PNG).
2. Use `declare global` inside an ES module (`export {}`) to augment `Window` or `ProcessEnv`.
3. Ambient declarations produce zero JavaScript output.
4. Ambient declarations cannot contain function implementation bodies.

---

### Think first: Prediction puzzle
Does `declare const API_KEY: string;` generate `var API_KEY;` in the emitted JavaScript?

---

**Answer:**
```
No.
```
**Explanation:** All `declare` constructs are ambient and are completely erased during compilation, generating zero JavaScript output.

---

### Practice exercises

#### Exercise 1: Declare PNG image asset module
- **Task**: Declare ambient type support for `*.png` imports exporting a default string path.
- **Hint 1**: `declare module "*.png" { const src: string; export default src; }`.

#### Exercise 2: Augment `process.env` with JWT secret
- **Task**: Augment `NodeJS.ProcessEnv` with `JWT_SECRET: string`.
- **Hint 1**: Inside `declare global { namespace NodeJS { interface ProcessEnv { ... } } }`.

#### Exercise 3: Type untyped library
- **Task**: Create an ambient declaration for `"fake-mailer"` exporting `sendMail(to: string, msg: string): Promise<boolean>`.
- **Hint 1**: `declare module "fake-mailer" { export function sendMail(...): Promise<boolean>; }`.

#### Exercise 4: Window extension interface
- **Task**: Add a property `isProduction: boolean` to `window`.
- **Hint 1**: `declare global { interface Window { isProduction: boolean; } }`.

---

### Exercise solutions

#### Solution 1: Declare PNG image asset module
```typescript
declare module "*.png" {
  const src: string;
  export default src;
}
```

#### Solution 2: Augment `process.env` with JWT secret
```typescript
declare global {
  namespace NodeJS {
    interface ProcessEnv {
      JWT_SECRET: string;
    }
  }
}
export {};
```

#### Solution 3: Type untyped library
```typescript
declare module "fake-mailer" {
  export function sendMail(to: string, msg: string): Promise<boolean>;
}
```

#### Solution 4: Window extension interface
```typescript
declare global {
  interface Window {
    isProduction: boolean;
  }
}
export {};
```

---

### Recall
1. What keyword introduces an ambient type declaration? `declare`.
2. Do ambient declarations generate JavaScript code? No, they are completely erased.
3. How do you augment global browser interfaces like `Window`? Using `declare global { interface Window { ... } }` inside a module.

> **If you remember only one thing:**  
> Ambient declarations (`declare module`, `declare global`) describe runtime globals and asset imports to the compiler with zero emitted JavaScript.

---

# Checkpoint Challenge 2: Monorepo Architecture & Declarations (Topics 6-10)

### Challenge Specification
Construct a production Monorepo Package Setup:
1. Configure a **Composite Library Package** (`packages/shared`) with `composite: true`, `declaration: true`, `declarationMap: true`, and `isolatedDeclarations: true`.
2. Write a source file adhering to `isolatedDeclarations` with explicit return annotations.
3. Create an ambient declaration file (`env.d.ts`) typing `process.env.APP_ENV` and `*.svg` assets.
4. Configure an application package (`packages/app`) referencing `packages/shared`.

### Solution

```json
// 1. packages/shared/tsconfig.json (Strict Composite Library)
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "composite": true,
    "declaration": true,
    "declarationMap": true,
    "isolatedDeclarations": true,
    "outDir": "./dist",
    "rootDir": "./src"
  },
  "include": ["src/**/*"]
}
```

```typescript
// 2. packages/shared/src/index.ts (Conforms to isolatedDeclarations)
export interface UserRecord {
  id: string;
  role: "admin" | "user";
}

// Explicit return type ': boolean' is mandatory under isolatedDeclarations!
export function isAdminUser(user: UserRecord): boolean {
  return user.role === "admin";
}

export const SYSTEM_VERSION: string = "3.2.0";
```

```typescript
// 3. packages/shared/src/env.d.ts (Ambient Environment & Asset Types)
declare module "*.svg" {
  const content: string;
  export default content;
}

declare global {
  namespace NodeJS {
    interface ProcessEnv {
      APP_ENV: "production" | "staging" | "development";
    }
  }
}

export {};
```

```json
// 4. packages/app/tsconfig.json (Consuming App with Project Reference)
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "composite": true,
    "outDir": "./dist",
    "rootDir": "./src"
  },
  "references": [
    { "path": "../shared" }
  ],
  "include": ["src/**/*"]
}
```

```bash
# 5. Build Execution
# Compiles packages/shared first (emitting .d.ts and .d.ts.map), then builds packages/app
tsc --build
```


---

# Topic 11: Monorepo Workspaces: Integrating pnpm/npm/yarn Workspaces with Project References

### 1. What is it?
Modern enterprise monorepos combine package manager workspaces (**pnpm**, **npm**, or **yarn**) with **TypeScript Project References**.
- The package manager handles symlinking packages inside `node_modules` (e.g. `import "@myorg/core"`).
- TypeScript Project References (`composite: true` and `references: [{ path: "../core" }]`) coordinate the type checking and compilation order across those packages.

### 2. Why does it exist?
Workspaces alone only handle symlinks in `node_modules`. If Package B imports from Package A, your editor will look at Package A's `dist/` output. If you edit Package A, Package B will not see the changes until Package A is built. Integrating Workspaces with Project References allows VS Code to navigate directly to the source TypeScript files across package boundaries in real time.

### 3. Basic example

```yaml
# pnpm-workspace.yaml
packages:
  - "packages/*"
```

```json
// packages/core/package.json
{
  "name": "@myorg/core",
  "version": "1.0.0",
  "main": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "default": "./dist/index.js"
    }
  },
  "scripts": {
    "build": "tsc -b"
  }
}
```

```json
// packages/app/package.json
{
  "name": "@myorg/app",
  "version": "1.0.0",
  "dependencies": {
    "@myorg/core": "workspace:*" // pnpm workspace protocol
  }
}
```

```json
// packages/app/tsconfig.json
{
  "compilerOptions": {
    "composite": true,
    "outDir": "./dist"
  },
  "references": [
    { "path": "../core" } // Project reference allows tsc -b and IDE to connect them!
  ]
}
```

**Line-by-line explanation:**
- `pnpm-workspace.yaml`: Tells pnpm to discover subpackages inside `packages/*`.
- `"@myorg/core": "workspace:*"`: Instructs pnpm to symlink the local `packages/core` folder rather than downloading from the npm registry.
- `"references": [{ "path": "../core" }]`: Tells TypeScript's language server that `@myorg/core` corresponds to the local project in `../core`, enabling instant cross-package type checking without prebuilding.

---

### 4. How it works inside TypeScript
1. **Source Linking in Language Server**: When VS Code opens `packages/app/src/index.ts` and sees `import from "@myorg/core"`, it reads the `references` array, identifies `../core/tsconfig.json`, and loads the TypeScript source files directly.
2. **Topological Build**: Running `pnpm --filter @myorg/app build` or `tsc -b` at the root executes compilation in the exact graph order.
3. **Circular Prevention**: If Package A depends on Package B and Package B depends on Package A, both pnpm and `tsc -b` will reject the build.

---

### 5. More examples

#### Example 1: Turborepo Pipeline Integration
```json
// turbo.json
{
  "$schema": "https://turbo.build/schema.json",
  "tasks": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": ["dist/**"]
    },
    "typecheck": {
      "dependsOn": ["^typecheck"]
    }
  }
}
```

---

### 6. Common mistakes

#### Mistake 1: Declaring workspace dependency in `package.json` without `tsconfig.json` reference
```json
// package.json has "@myorg/core": "workspace:*"
// BUT tsconfig.json has NO "references": [{ "path": "../core" }]
```
**Why it fails:** TypeScript will only look at the compiled `dist/` files of `@myorg/core`. If you make an edit in `@myorg/core/src/index.ts`, `@myorg/app` will report stale types until you run a manual build.

#### Mistake 2: Forgetting to export types in `package.json`
```json
// packages/core/package.json
{
  "exports": {
    ".": "./dist/index.js" // Missing "types" condition!
  }
}
```
**Why it fails:** Under `moduleResolution: "NodeNext"`, TypeScript strictly reads the `"types"` condition inside `"exports"`. If omitted, consumers will complain: `Could not find a declaration file for module '@myorg/core'`.

---

### 7. Rules to remember
1. Always pair `package.json` workspace dependencies with `tsconfig.json` `references`.
2. Always declare the `"types"` key inside `package.json` `"exports"` before `"default"`.
3. Use `pnpm-workspace.yaml` or npm/yarn `"workspaces": ["packages/*"]`.
4. Use `tsc -b` at root to compile all packages in topological order.

---

### Think first: Prediction puzzle
In `package.json` `"exports"`, why must the `"types"` condition be listed before `"import"` or `"default"`?

---

**Answer:**
```
Because package.json exports are evaluated in order of declaration, and the first matching condition wins.
```
**Explanation:** If `"import"` is placed before `"types"`, TypeScript's resolver under `NodeNext` may stop at `"import"` and fail to find the declaration types.

---

### Practice exercises

#### Exercise 1: Declare pnpm workspace file
- **Task**: Write a `pnpm-workspace.yaml` covering `apps/*` and `packages/*`.
- **Hint 1**: List them under `packages:`.

#### Exercise 2: package.json exports with types
- **Task**: Write the `"exports"` field mapping `"."` to `./dist/index.d.ts` and `./dist/index.js`.
- **Hint 1**: Place `"types"` before `"default"`.

#### Exercise 3: Wire dual references
- **Task**: If package `web` depends on `ui` and `utils`, write its `references` array in `tsconfig.json`.
- **Hint 1**: `[{ "path": "../ui" }, { "path": "../utils" }]`.

#### Exercise 4: Workspace protocol specifier
- **Task**: Write the `package.json` dependency line for `@monorepo/shared` using the workspace protocol.
- **Hint 1**: `"@monorepo/shared": "workspace:*"`.

---

### Exercise solutions

#### Solution 1: Declare pnpm workspace file
```yaml
packages:
  - "apps/*"
  - "packages/*"
```

#### Solution 2: package.json exports with types
```json
{
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "default": "./dist/index.js"
    }
  }
}
```

#### Solution 3: Wire dual references
```json
{
  "references": [
    { "path": "../ui" },
    { "path": "../utils" }
  ]
}
```

#### Solution 4: Workspace protocol specifier
```json
{
  "dependencies": {
    "@monorepo/shared": "workspace:*"
  }
}
```

---

### Recall
1. Why must `tsconfig.json` references mirror `package.json` workspace dependencies? To allow the TypeScript Language Server to resolve live `.ts` source files across packages without requiring prior builds.
2. In what order must `"types"` appear in a package's `"exports"` map? First, before other conditions.
3. What file defines workspace package globs in pnpm? `pnpm-workspace.yaml`.

> **If you remember only one thing:**  
> Mirror package manager workspace dependencies with `tsconfig.json` `references` for instant cross-package IDE navigation.

---

# Topic 12: Triple-Slash Directives (`/// <reference types="..." />` vs `/// <reference path="..." />`)

### 1. What is it?
**Triple-Slash Directives** are single-line XML comments placed at the very top of a TypeScript file that instruct the compiler to include additional files or type declarations in the compilation:
1. **`/// <reference types="..." />`**: Declares a dependency on a `@types` package (e.g. `/// <reference types="node" />`).
2. **`/// <reference path="..." />`**: Declares a direct dependency on a relative `.d.ts` file path.
3. **`/// <reference lib="..." />`**: Explicitly includes a built-in compiler library (e.g. `/// <reference lib="dom" />`).

### 2. Why does it exist?
In modern TypeScript, `import` statements handle almost all dependencies. However, for ambient types (like Node.js globals, DOM types, or custom environment variables) that have no runtime JavaScript values to `import`, triple-slash directives explicitly tell the compiler to include those type definitions before compiling the file.

### 3. Basic example

```typescript
/// <reference types="node" />
/// <reference path="./globals.d.ts" />

// Now Node.js globals and custom globals are recognized without compile errors:
console.log(process.version);
```

**Line-by-line explanation:**
- `/// <reference types="node" />`: Informs the compiler to resolve `@types/node` and inject its declarations into this file's scope.
- `/// <reference path="./globals.d.ts" />`: Explicitly includes `./globals.d.ts`.
- Must appear at the very beginning of the file (before any statements or imports).

---

### 4. How it works inside TypeScript
1. **Pre-Processing Phase**: Before running the parser, the compiler pre-processes files, scanning the top of each file for triple-slash comments to assemble the initial file list for the `Program`.
2. **Placement Requirement**: A triple-slash directive must only be preceded by whitespace or other comments. If a statement appears before it, the directive is ignored and treated as a regular comment!

---

### 5. More examples

#### Example 1: `/// <reference lib="webworker" />`
```typescript
/// <reference lib="webworker" />

// Allows using Web Worker globals (like postMessage) without including DOM lib in tsconfig
self.onmessage = (event) => {
  postMessage(`Received: ${event.data}`);
};
```

---

### 6. Common mistakes

#### Mistake 1: Placing triple-slash directives below `import` statements
```typescript
// WRONG: Directive placed after import
import { format } from "./format";
/// <reference types="node" /> // IGNORED! Must be placed before all code!
```
**Why it fails:** TypeScript ignores triple-slash directives that appear after the first executable code statement. Always place them at line 1.

#### Mistake 2: Using `/// <reference path="..." />` instead of standard `import`
```typescript
// ANTI-PATTERN in modern modular code:
/// <reference path="./user.ts" /> // Legacy namespace syntax!
```
**Why it fails:** In modern ES module code, use `import { User } from "./user.js"` instead of triple-slash path references.

---

### 7. Rules to remember
1. Triple-slash directives must be placed at the very top of the file.
2. Use `/// <reference types="..." />` to include ambient `@types` packages.
3. Use `/// <reference lib="..." />` to include specific built-in standard libraries.
4. Prefer standard ES `import` statements for code and module types.

---

### Think first: Prediction puzzle
Does a triple-slash directive work if preceded by `console.log("start");` on line 1?

---

**Answer:**
```
No.
```
**Explanation:** Directives must appear before any executable statements. Any directive placed after a statement is ignored by the compiler pre-processor.

---

### Practice exercises

#### Exercise 1: Reference Node types
- **Task**: Write the directive to include `@types/node`.
- **Hint 1**: `/// <reference types="node" />`.

#### Exercise 2: Reference DOM lib
- **Task**: Write the directive to include the DOM standard library.
- **Hint 1**: `/// <reference lib="dom" />`.

#### Exercise 3: Reference local declaration file
- **Task**: Write the directive to include `./types/custom.d.ts`.
- **Hint 1**: `/// <reference path="./types/custom.d.ts" />`.

#### Exercise 4: Explain placement requirement
- **Task**: Explain what happens if an import appears before a triple-slash reference.
- **Hint 1**: The directive is ignored.

---

### Exercise solutions

#### Solution 1: Reference Node types
```typescript
/// <reference types="node" />
```

#### Solution 2: Reference DOM lib
```typescript
/// <reference lib="dom" />
```

#### Solution 3: Reference local declaration file
```typescript
/// <reference path="./types/custom.d.ts" />
```

#### Solution 4: Explain placement requirement
The TypeScript compiler pre-processor only scans comments at the very top of the file. As soon as it encounters a statement or import, pre-processing stops. Any subsequent triple-slash directives are treated as standard inert comments.

---

### Recall
1. Where must a triple-slash directive appear in a file? At the very top (before any statements).
2. What is the difference between `types` and `path` in directives? `types` resolves an npm `@types` package; `path` references a direct relative `.d.ts` file path.
3. Should triple-slash directives be used instead of ES module imports? No; standard `import` statements should always be used for modular code.

> **If you remember only one thing:**  
> Triple-slash directives must be placed at line 1 to inject ambient types or libraries before compilation begins.

---

# Topic 13: Compiler Diagnostic Profiling (`--extendedDiagnostics`, `--explainFiles`, `--traceResolution`)

### 1. What is it?
When TypeScript compilation or IDE responsiveness feels sluggish, the compiler provides built-in diagnostic and profiling flags to locate bottlenecks:
1. **`--extendedDiagnostics`**: Prints a breakdown of time spent in each compiler phase (parse, bind, check, emit), memory usage, and file counts.
2. **`--explainFiles`**: Explains exactly *why* every single file was included in compilation (which import or config brought it in).
3. **`--traceResolution`**: Logs step-by-step module resolution decisions to debug import failures.
4. **`--generateCpuProfile`**: Dumps a V8 CPU profile file that can be inspected in Chrome DevTools.

### 2. Why does it exist?
Slow TypeScript builds often stem from an accidental import pulling in a massive 50,000-line type definition file (like AWS SDK or full DOM lib), or recursive conditional types causing check times to skyrocket. Profiling flags identify the exact culprit files.

### 3. Basic example

```bash
# 1. Measure compiler execution performance breakdown
tsc --extendedDiagnostics
```

**Sample Output:**
```
Files:                         125
Lines of Library:           32,450
Lines of Definitions:       18,200
Lines of TypeScript:         8,400
Lines of JavaScript:             0
Nodes:                      82,100
Identifiers:                28,400
Symbols:                    41,200
Types:                       8,500
Memory used:               124,500K
Assignability cache-size:    4,200
Identity cache-size:           800
Subtype cache-size:            400
Strict subtype cache-size:     200
I/O Read time:               0.04s
Parse time:                  0.18s
Bind time:                   0.08s
Check time:                  0.62s
Emit time:                   0.12s
Total time:                  1.04s
```

**Line-by-line explanation:**
- `Check time: 0.62s`: Reveals that 60% of compilation time was spent in the Type Checker.
- `Memory used: 124,500K`: Shows peak memory footprint during compilation.
- `Files: 125`: Shows the total number of files included. If your project only has 10 files, this immediately alerts you that 115 external definition files were pulled in!

---

### 4. How it works inside TypeScript
1. **`--explainFiles` Trace**:
```bash
tsc --explainFiles
```
Outputs:
```
../../node_modules/@types/node/index.d.ts
  Entry point for implicit type library 'node'
src/index.ts
  Matched by include pattern 'src/**/*' in tsconfig.json
```
2. **`--traceResolution`**: Prints every directory and `package.json` checked when resolving an import path.

---

### 5. More examples

#### Example 1: Capturing a CPU Profile for Chrome DevTools
```bash
tsc --generateCpuProfile profile.cpuprofile
```
Open `chrome://tracing` or the Performance panel in Chrome DevTools and load `profile.cpuprofile` to see the exact call stack flamegraph of the compiler.

---

### 6. Common mistakes

#### Mistake 1: Leaving `skipLibCheck: false` in large projects
```json
// SLOW:
{ "compilerOptions": { "skipLibCheck": false } }
```
**Why it fails:** When `skipLibCheck` is `false`, TypeScript rechecks every single `.d.ts` file inside `node_modules`. Setting `"skipLibCheck": true` cuts check time in half by only checking your own source code.

#### Mistake 2: Accidental global `@types` inclusion
```json
// GOTCHA: By default, TypeScript includes ALL packages in node_modules/@types!
// If @types/jest, @types/mocha, and @types/node are installed, all three are loaded into every build!
```
**Why it matters:** Restrict types to only what is needed: `"types": ["node"]`.

---

### 7. Rules to remember
1. Use `tsc --extendedDiagnostics` to identify whether parse, check, or emit is slow.
2. Use `tsc --explainFiles` to find out why unexpected files were compiled.
3. Always enable `"skipLibCheck": true` to skip rechecking third-party `.d.ts` files.
4. Restrict global types using the `"types"` array in `tsconfig.json`.

---

### Think first: Prediction puzzle
What flag reveals why a file from `node_modules` was pulled into your compilation?

---

**Answer:**
```
tsc --explainFiles
```
**Explanation:** `--explainFiles` lists every compiled file and explains the exact chain of imports or configuration settings that caused it to be included.

---

### Practice exercises

#### Exercise 1: Run extended diagnostics
- **Task**: Write the CLI command to display detailed performance breakdown.
- **Hint 1**: `tsc --extendedDiagnostics`.

#### Exercise 2: Explain files command
- **Task**: Write the command to trace why external files are present in the build.
- **Hint 1**: `tsc --explainFiles`.

#### Exercise 3: Generate CPU profile
- **Task**: Write the command to output a profile named `build.cpuprofile`.
- **Hint 1**: `tsc --generateCpuProfile build.cpuprofile`.

#### Exercise 4: Restrict types in tsconfig
- **Task**: Configure `types` in `tsconfig.json` so only `"node"` is loaded from `@types`.
- **Hint 1**: `"compilerOptions": { "types": ["node"] }`.

---

### Exercise solutions

#### Solution 1: Run extended diagnostics
```bash
tsc --extendedDiagnostics
```

#### Solution 2: Explain files command
```bash
tsc --explainFiles
```

#### Solution 3: Generate CPU profile
```bash
tsc --generateCpuProfile build.cpuprofile
```

#### Solution 4: Restrict types in tsconfig
```json
{
  "compilerOptions": {
    "types": ["node"]
  }
}
```

---

### Recall
1. What does `Check time` in `--extendedDiagnostics` represent? Time spent by the Type Checker analyzing semantic types and enforcing rules.
2. What does `tsc --explainFiles` show? Why each file was included in the compilation graph.
3. Which flag avoids rechecking declarations inside `node_modules`? `"skipLibCheck": true`.

> **If you remember only one thing:**  
> Use `tsc --extendedDiagnostics` and `tsc --explainFiles` to identify compilation bottlenecks and eliminate unwanted files.

---

# Topic 14: The Gold-Standard Enterprise Production `tsconfig.json` Matrix

### 1. What is it?
The **Gold-Standard Production TSConfig Matrix** is the definitive, battle-tested configuration suite for enterprise systems. Rather than guessing compiler options, enterprise systems maintain standardized presets tailored to three core runtime archetypes:
1. **Node.js ESM Service** (Backend microservices).
2. **Modern Web Frontend** (Vite, Next.js, React).
3. **Published Enterprise Library** (Dual CJS/ESM npm packages).

### 2. Why does it exist?
Mismatched configuration flags across services cause inconsistent compilation, security blindspots, and broken imports. A production matrix provides zero-compromise, type-safe configurations for each architecture.

### 3. Basic example

#### Archetype 1: Enterprise Node.js ESM Service (`tsconfig.node.json`)
```json
{
  "$schema": "https://json.schemastore.org/tsconfig",
  "compilerOptions": {
    "target": "ES2022",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "lib": ["ES2022"],
    "strict": true,
    "exactOptionalPropertyTypes": true,
    "noUncheckedIndexedAccess": true,
    "noPropertyAccessFromIndexSignature": true,
    "noFallthroughCasesInSwitch": true,
    "forceConsistentCasingInFileNames": true,
    "skipLibCheck": true,
    "esModuleInterop": true,
    "incremental": true,
    "tsBuildInfoFile": "./.cache/tsconfig.tsbuildinfo",
    "outDir": "./dist",
    "rootDir": "./src"
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

#### Archetype 2: Modern Web Frontend (`tsconfig.web.json`)
```json
{
  "$schema": "https://json.schemastore.org/tsconfig",
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "jsx": "react-jsx",
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "noFallthroughCasesInSwitch": true,
    "skipLibCheck": true,
    "noEmit": true,
    "isolatedModules": true
  },
  "include": ["src/**/*"]
}
```

#### Archetype 3: Published Enterprise Library (`tsconfig.lib.json`)
```json
{
  "$schema": "https://json.schemastore.org/tsconfig",
  "compilerOptions": {
    "target": "ES2022",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "composite": true,
    "declaration": true,
    "declarationMap": true,
    "isolatedDeclarations": true,
    "strict": true,
    "skipLibCheck": true,
    "outDir": "./dist",
    "rootDir": "./src"
  },
  "include": ["src/**/*"]
}
```

---

### 4. How it works inside TypeScript
1. **Frontend (`noEmit: true`)**: Because Vite/Next.js/esbuild emits the JavaScript code, TypeScript runs exclusively as a type checker (`noEmit: true`).
2. **Library (`isolatedDeclarations: true`)**: Forces explicit return types so monorepo packages can generate `.d.ts` files at extreme speeds.
3. **Backend (`NodeNext`)**: Matches the native Node.js runtime and enforces `.js` extensions on imports.

---

### 5. More examples

#### Example 1: Full Monorepo Architecture Matrix
```
monorepo/
├── tsconfig.base.json  (Shared strictness flags)
├── apps/
│   ├── api/            (Extends tsconfig.base.json + NodeNext)
│   └── web/            (Extends tsconfig.base.json + bundler + noEmit)
└── packages/
    ├── ui/             (Extends tsconfig.base.json + composite + isolatedDeclarations)
    └── core/           (Extends tsconfig.base.json + composite + declarationMap)
```

---

### 6. Common mistakes

#### Mistake 1: Using `lib: ["DOM"]` in backend Node.js services
```json
// WRONG in a backend Node.js microservice:
{ "compilerOptions": { "lib": ["ES2022", "DOM"] } } // Exposes 'window', 'document', and 'localStorage' in Node!
```
**Why it fails:** Backend code can accidentally call `window` or `document` without any compiler error, only to crash at runtime when executed in Node.js. Only include `"DOM"` in frontend projects.

#### Mistake 2: Missing `isolatedModules: true` in frontend projects
```json
// GOTCHA: Frontend project using Vite or Babel
{ "compilerOptions": { "isolatedModules": false } }
```
**Why it matters:** Single-file transpilers (Babel/Vite/esbuild) compile files one by one. Without `isolatedModules: true`, you can write code (like `const enum` or re-exporting types without `export type`) that works in `tsc` but breaks when bundled by Vite!

---

### 7. Rules to remember
1. Never include `"DOM"` in the `lib` array of backend Node.js projects.
2. Always enable `"isolatedModules": true` when using Vite, Babel, or SWC.
3. Enable `"isolatedDeclarations": true` in published libraries for blazing fast builds.
4. Set `"noEmit": true` when bundlers handle JavaScript emission.

---

### Think first: Prediction puzzle
Why does `isolatedModules: true` forbid `const enum` without `preserveConstEnums`?

---

**Answer:**
```
Because single-file bundlers like Babel and esbuild compile one file at a time and cannot resolve const enum values declared in other files.
```
**Explanation:** `const enum` requires cross-file type inspection to inline values. `isolatedModules: true` flags syntax that cannot be compiled safely by isolated single-file transpilers.

---

### Practice exercises

#### Exercise 1: Select correct `lib` for Node.js
- **Task**: Write the `lib` compiler options for a pure Node 20 backend service.
- **Hint 1**: `"lib": ["ES2022"]` (No DOM!).

#### Exercise 2: Frontend safety flags
- **Task**: Configure a frontend `tsconfig.json` with `noEmit: true` and `isolatedModules: true`.
- **Hint 1**: Both set to `true`.

#### Exercise 3: Explain why `isolatedModules` is needed with Vite
- **Task**: State why `export type` is required under `isolatedModules`.
- **Hint 1**: Vite needs to know that the export is purely a type so it can erase it without reading the source file.

#### Exercise 4: Production monorepo verification
- **Task**: Run `tsc -b --showConfig` on a composite project and verify `composite` is `true`.
- **Hint 1**: Check the printed JSON.

---

### Exercise solutions

#### Solution 1: Select correct `lib` for Node.js
```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["ES2022"]
  }
}
```

#### Solution 2: Frontend safety flags
```json
{
  "compilerOptions": {
    "noEmit": true,
    "isolatedModules": true
  }
}
```

#### Solution 3: Explain why `isolatedModules` is needed with Vite
Single-file bundlers like Vite do not perform type checking; they only transpile one file at a time. If an import or export is purely a type, the bundler cannot know whether it should be removed or kept as runtime JavaScript unless explicit `import type` or `export type` syntax is used. `isolatedModules: true` enforces this syntax.

#### Solution 4: Production monorepo verification
```bash
tsc -p packages/core/tsconfig.json --showConfig
```

---

### Recall
1. Why should the `"DOM"` library be excluded from backend `tsconfig.json` files? To prevent accidental references to `window`, `document`, and browser APIs in server code.
2. What does `"noEmit": true` do? Instructs `tsc` to perform type checking only, emitting zero files.
3. Why is `"isolatedModules": true` mandatory when using bundlers like Vite or SWC? Because it warns about syntax (like `const enum` or untyped re-exports) that cannot be safely compiled in isolation.

> **If you remember only one thing:**  
> Use `NodeNext` for Node.js backends, `bundler` + `noEmit` + `isolatedModules` for frontend apps, and `composite` + `isolatedDeclarations` for libraries.

---

# Checkpoint Challenge 3: Monorepo Synthesis & Production Matrix (Topics 11-14)

### Challenge Specification
Construct a complete Enterprise Monorepo Orchestration Suite:
1. A **Root Orchestrator** (`tsconfig.json`) linking two packages: `@enterprise/contracts` and `@enterprise/service`.
2. A **Strict Base Config** (`tsconfig.base.json`) with all safety guard flags.
3. The `@enterprise/contracts` package configured with `composite: true`, `declaration: true`, `declarationMap: true`, and `isolatedDeclarations: true`.
4. The `@enterprise/service` package configured with `NodeNext`, referencing `@enterprise/contracts`.
5. Code demonstrating a type-safe consumer verifying contract types.

### Solution

```json
// 1. Root Orchestrator: /tsconfig.json
{
  "files": [],
  "references": [
    { "path": "./packages/contracts" },
    { "path": "./packages/service" }
  ]
}
```

```json
// 2. Shared Base: /tsconfig.base.json
{
  "$schema": "https://json.schemastore.org/tsconfig",
  "compilerOptions": {
    "target": "ES2022",
    "strict": true,
    "exactOptionalPropertyTypes": true,
    "noUncheckedIndexedAccess": true,
    "noPropertyAccessFromIndexSignature": true,
    "noFallthroughCasesInSwitch": true,
    "skipLibCheck": true,
    "esModuleInterop": true
  }
}
```

```json
// 3. packages/contracts/tsconfig.json (Composite Contract Library)
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "composite": true,
    "declaration": true,
    "declarationMap": true,
    "isolatedDeclarations": true,
    "outDir": "./dist",
    "rootDir": "./src"
  },
  "include": ["src/**/*"]
}
```

```typescript
// packages/contracts/src/index.ts (Conforms to isolatedDeclarations)
export interface OrderPayload {
  orderId: string;
  amountCents: number;
}

export interface OrderResult {
  success: boolean;
  timestamp: number;
}

// Explicit return type required by isolatedDeclarations:
export function formatOrderId(id: string): string {
  return `ORD_${id.toUpperCase()}`;
}
```

```json
// 4. packages/service/tsconfig.json (Consumes contracts)
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "composite": true,
    "outDir": "./dist",
    "rootDir": "./src"
  },
  "references": [
    { "path": "../contracts" }
  ],
  "include": ["src/**/*"]
}
```

```typescript
// 5. packages/service/src/server.ts (Consumer Implementation)
import { OrderPayload, OrderResult, formatOrderId } from "../../contracts/src/index.js";

export class OrderService {
  processOrder(payload: OrderPayload): OrderResult {
    const formattedId = formatOrderId(payload.orderId);
    console.log(`Processing order ${formattedId} for $${(payload.amountCents / 100).toFixed(2)}`);

    return {
      success: true,
      timestamp: Date.now(),
    };
  }
}
```

```bash
# 6. Monorepo Build Execution
# Builds @enterprise/contracts first, outputs .d.ts + .d.ts.map, then builds @enterprise/service
tsc --build --extendedDiagnostics
```

