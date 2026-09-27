# Module TS-10: Production tsconfig, Monorepos, & Declarations

## 1. Architectural Deep-Dive & Specification Foundations

### 1.1 The Production `tsconfig.json` Strictness Matrix

In enterprise environments, a default or loosely configured `tsconfig.json` invites subtle runtime bugs, memory leaks, and breaking architectural divergence. TypeScript provides a layered matrix of strictness flags that eliminate entire categories of production failures:

```
+-------------------------------------------------------------------------+
|                  Enterprise tsconfig Strictness Matrix                  |
+-------------------------------------------------------------------------+
|  Tier 1: Core Strict Family ("strict": true)                            |
|    ├── strictNullChecks (distinguishes null/undefined from types)       |
|    ├── noImplicitAny (prevents unannotated expressions defaulting to any)|
|    ├── strictFunctionTypes (enforces contravariant parameter checks)   |
|    ├── strictBindCallApply (types .bind(), .call(), and .apply())       |
|    ├── strictPropertyInitialization (requires class field initialization)|
|    ├── noImplicitThis (flags untyped 'this' expressions)                |
|    ├── alwaysStrict (emits "use strict" directives)                     |
|    └── useUnknownInCatchVariables (types catch(e) as unknown, not any)  |
+-------------------------------------------------------------------------+
|  Tier 2: Modern Enterprise Hardening Flags                              |
|    ├── noUncheckedIndexedAccess (types arr[i] and dict[k] as T | undef)|
|    ├── exactOptionalPropertyTypes (prohibits assigning undefined to ?)  |
|    ├── noImplicitOverride (enforces 'override' keyword on subclasses)   |
|    ├── verbatimModuleSyntax (enforces explicit type-only imports)       |
|    └── isolatedDeclarations (TS 5.5: mandates explicit export types)    |
+-------------------------------------------------------------------------+
```

---

### 1.2 Modern Enterprise Flags Deep-Dive

#### 1. `noUncheckedIndexedAccess: true`
By default, TypeScript dangerously assumes that indexing an array or dictionary always succeeds:
```typescript
// Without noUncheckedIndexedAccess:
const users: string[] = ["Alice", "Bob"];
const third = users[2]; // Type: string (RUNTIME BUG: undefined!)
console.log(third.toUpperCase()); // TypeError: Cannot read properties of undefined!

// With noUncheckedIndexedAccess: true:
const thirdChecked = users[2]; // Type: string | undefined
// thirdChecked.toUpperCase(); // TS18048: 'thirdChecked' is possibly 'undefined'.
if (thirdChecked) {
  console.log(thirdChecked.toUpperCase()); // Type narrowed safely to string!
}
```

#### 2. `exactOptionalPropertyTypes: true`
In standard TypeScript, an optional property `timeout?: number` can be explicitly assigned `undefined`:
```typescript
interface RequestOptions {
  timeout?: number;
}

// Without exactOptionalPropertyTypes:
const opts: RequestOptions = { timeout: undefined };
console.log("timeout" in opts); // true! (Property exists, breaking { ...defaults, ...opts })

// With exactOptionalPropertyTypes: true:
// TS2375: Type 'undefined' is not assignable to type 'number' with 'exactOptionalPropertyTypes: true'.
// const optsChecked: RequestOptions = { timeout: undefined }; // ERROR!
// To allow undefined, type must be explicitly written: timeout?: number | undefined;
```

#### 3. `isolatedDeclarations: true` (TS 5.5+)
Standard TypeScript computes `.d.ts` declaration files by running the full, expensive Type Checker across your entire project dependency graph.

When `isolatedDeclarations: true` is enabled, TypeScript requires that all **exported** declarations have explicit type annotations. This allows blazingly fast external compilers (like SWC, OXC, and Turbopack) to emit `.d.ts` files in parallel on single files without type-checking the rest of the project:

```typescript
// With isolatedDeclarations: true:
// TS9007: Function must have an explicit return type annotation with --isolatedDeclarations.
// export function computeTotal(subtotal: number) { return subtotal * 1.2; }

// CORRECT: Explicit return type provided
export function computeTotal(subtotal: number): number {
  return subtotal * 1.2;
}
```

---

### 1.3 Module & Resolution Mechanics in TS 5.x

#### `module: "NodeNext"` & `moduleResolution: "NodeNext"`
The gold standard for modern Node.js and full-stack projects:
- Complies strictly with Node.js ESM loader rules.
- Enforces explicit file extensions in relative imports: `import { helper } from "./helper.js";` (even in `.ts` source files!).
- Inspects package `package.json` `"type": "module"` field.

#### `moduleResolution: "Bundler"` (TS 5.0+)
For projects bundled by Vite, Webpack, esbuild, or Turbopack:
- Resolves package `"exports"` conditions matching bundler rules.
- Allows omitting file extensions in imports.
- Supports package imports `#internal/*`.

#### `verbatimModuleSyntax: true` (TS 5.0+)
Supersedes `importsNotUsedAsValues` and `preserveValueImports`:
- Any import written without `type` (e.g. `import { User } from "./user"`) is strictly preserved in the emitted JavaScript.
- Type-only imports MUST use explicit `import type { User } from "./user"` syntax, guaranteeing that the emitter can erase type imports without guessing or type-checking!


---

## 2. Monorepos, Project References, & Declaration Maps

### 2.1 Project References Architecture (`composite: true`)

In large monorepos containing dozens of packages, running a single monolithic `tsc` build causes out-of-memory errors and sluggish editor responsiveness.

**TypeScript Project References** divide a codebase into independent, modular compilation units:

```
+-------------------------------------------------------------------------+
|                  Monorepo Project References Topology                   |
+-------------------------------------------------------------------------+
|  [apps/web] ──────────────────────────┐                                 |
|     │                                 ▼                                 |
|     ▼                          [packages/ui]                            |
|  [packages/api-client] ───────────────┼─────────────────┐               |
|     │                                 │                 │               |
|     ▼                                 ▼                 ▼               |
|  [packages/models] ──────────► [packages/utils] ──► [packages/config]   |
+-------------------------------------------------------------------------+
```

#### The `composite: true` Invariants:
When a package has `"composite": true`:
1. `"declaration": true` is mandatory (generates `.d.ts` contracts).
2. `"rootDir"` must be explicitly defined or defaults to the directory containing `tsconfig.json`.
3. All files must be matched by an `include` or `files` array.
4. Incremental compilation cache `.tsbuildinfo` is emitted automatically.

---

### 2.2 Declaration Maps (`declarationMap: true`)

By default, when Package A imports Package B in a monorepo, pressing **F12 / Go to Definition** in VS Code jumps to Package B's compiled `dist/index.d.ts` declaration file.

Enabling `"declarationMap": true` generates a `.d.ts.map` file that links compiled declaration types back to the original source TypeScript files:
```json
{
  "compilerOptions": {
    "composite": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true
  }
}
```
With `declarationMap`, clicking **Go to Definition** opens `packages/ui/src/button.tsx` directly!

---

### 2.3 The Dual-Package Hazard & Conditional Export Maps

When publishing packages supporting both CommonJS (`require()`) and ESM (`import`), a catastrophic runtime bug occurs if an application inadvertently loads both versions into memory simultaneously:

```
+-------------------------------------------------------------------------+
|                  The Dual-Package Hazard in Memory                      |
+-------------------------------------------------------------------------+
|  Module ESM Instance (State A)   !==   Module CJS Instance (State B)    |
|  [Singleton Store: items = []]         [Singleton Store: items = []]    |
|  (State divergence, instanceof failures, duplicate memory allocation)    |
+-------------------------------------------------------------------------+
```

#### Safe `package.json` Export Map Configuration:
The order of conditional keys in `package.json` matters critically: **`"types"` must always be listed FIRST!**

```json
{
  "name": "@enterprise/core",
  "type": "module",
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "import": "./dist/index.js",
      "require": "./dist/index.cjs"
    }
  },
  "main": "./dist/index.cjs",
  "module": "./dist/index.js",
  "types": "./dist/index.d.ts"
}
```

If `"import"` is placed before `"types"`, older TypeScript versions will ignore the type definitions completely!


---

## 3. Comprehensive Questions & Answers (Part 1: Questions 1 to 45)

### Q1: What is the fundamental difference between `moduleResolution: "node10"` (formerly `"node"`) and `moduleResolution: "nodenext"` / `"node16"`?
**Answer:**  
`node10` mirrors the legacy CommonJS module loader of Node.js 10: it looks for `index.js`, tries implicit extensions (`.ts`, `.js`), and ignores `"type": "module"` and `"exports"` in `package.json`.  
`nodenext` / `"node16"` mirrors modern ECMAScript module resolution in Node.js (Node 12+ / 16+):
1. Respects `package.json` `"exports"` and `"imports"` subpath maps.
2. Respects `"type": "module"` in `package.json`.
3. **Mandates relative import extensions**: You MUST write `import { util } from "./util.js";` even in `.ts` files, because Node's native ESM loader requires exact file specifiers without extension guessing.

```typescript
// Under moduleResolution: "node16" / "nodenext" in a TypeScript file:
// INCORRECT (compile error TS2835):
// import { sum } from "./math";

// CORRECT:
import { sum } from "./math.js"; // TS compiler resolves math.ts but emits import "./math.js"
```

---

### Q2: Why does TypeScript require writing `.js` extensions in imports when writing TypeScript code under `NodeNext`?
**Answer:**  
TypeScript's design goal is to emit clean JavaScript without rewriting module specifiers. Because modern Node.js ESM requires explicit extensions (`import "./foo.js"`), and TypeScript will emit `./foo.js` to disk, the TypeScript compiler checks the source `./foo.ts` at compile time but expects the import specifier to be `./foo.js`.

---

### Q3: What is `moduleResolution: "bundler"` introduced in TypeScript 5.0, and when should it be used?
**Answer:**  
`moduleResolution: "bundler"` is designed for modern frontend build tools (Vite, webpack 5, esbuild, Turbopack) where:
1. `package.json` `"exports"` are respected (like NodeNext).
2. Relative imports do **NOT** require `.js` extensions (the bundler resolves extensions and directories like `index.ts` automatically).
3. Hybrid conditions are supported.
It should be used in frontend projects or apps compiled by a bundler, but **NOT** in libraries published to npm intended for direct consumption by Node.js.

---

### Q4: Explain `isolatedDeclarations: true` introduced in TypeScript 5.5.
**Answer:**  
In standard TypeScript, `tsc` needs a full type checker to infer return types and emit `.d.ts` files:
```typescript
// Without isolatedDeclarations:
export function add(a: number, b: number) {
  return a + b; // tsc calculates return type: number
}
```
If a multi-threaded tool (swc, esbuild, oxc) tries to emit `.d.ts` files in parallel without running full type analysis across all files, it fails.  
`isolatedDeclarations: true` forces developers to explicitly annotate all exported signatures:
```typescript
// With isolatedDeclarations: true:
// Error TS9007: Function must have an explicit return type annotation with --isolatedDeclarations.
export function add(a: number, b: number): number {
  return a + b; // Passes!
}
```
This enables sub-millisecond declaration generation by external compilers.

---

### Q5: What is `verbatimModuleSyntax: true` introduced in TS 5.0, and what flags does it supersede?
**Answer:**  
`verbatimModuleSyntax` supersedes `importsNotUsedAsValues` and `preserveValueImports`.  
Under `verbatimModuleSyntax`:
1. Any import without `type` is assumed to be a value import and is **never** elided:
   ```typescript
   import { User } from "./models"; // ALWAYS emitted: import { User } from "./models"; -> runtime crash if User is an interface!
   import type { User } from "./models"; // Elided completely from JS output!
   ```
2. Type-only exports must use `export type`.
3. Default imports from CommonJS must use `import name = require("pkg")` if targeting CJS interop without synthetic defaults.

---

### Q6: What is the exact purpose of `noUncheckedIndexedAccess: true`?
**Answer:**  
By default, indexing arrays or objects typed with an index signature returns `T`, which is a blatant lie if the index is out of bounds or the key does not exist.  
With `noUncheckedIndexedAccess: true`, indexing always returns `T | undefined`, forcing defensive checks or optional chaining:
```typescript
const scores: number[] = [95, 82];
const third = scores[2]; // Type: number | undefined
// console.log(third.toFixed()); // TS Error: 'third' is possibly 'undefined'
if (third !== undefined) {
  console.log(third.toFixed()); // Safe!
}
```

---

### Q7: What is `exactOptionalPropertyTypes: true`?
**Answer:**  
Under default TypeScript:
```typescript
interface Config {
  retries?: number;
}
const a: Config = { retries: undefined }; // Valid!
```
However, in JavaScript:
`"retries" in a` is `true`, and `Object.keys(a)` includes `"retries"`. Default parameters like `retries = 3` trigger on `undefined`, but functions doing `Object.assign({}, defaults, a)` will overwrite a default with `undefined`!  
`exactOptionalPropertyTypes: true` distinguishes between "property is absent" and "property is present with value `undefined`":
```typescript
interface Config {
  retries?: number;
}
// Error with exactOptionalPropertyTypes:
// Type 'undefined' is not assignable to type 'number'.
// const b: Config = { retries: undefined };
```

---

### Q8: What is `esModuleInterop: true` and why is it necessary?
**Answer:**  
Before ES modules, CommonJS modules exported an object or function via `module.exports = fn`.  
When importing CJS in ESM:
```javascript
// CJS: module.exports = function express() {}
import express from "express";
```
Without `esModuleInterop`, TypeScript treats the CJS export as `{ default: express }`, which is `undefined` at runtime if the library only assigned `module.exports = fn`.  
`esModuleInterop: true` instructs TypeScript to emit runtime helper wrappers (`__importDefault` and `__importStar`) that allow default imports from non-ESM CommonJS modules seamlessly.

---

### Q9: What does `skipLibCheck: true` do, and what are its risks?
**Answer:**  
`skipLibCheck: true` skips type checking of all `.d.ts` declaration files across the project (including all files in `node_modules`).  
**Benefit**: Speeds up compilation drastically (often 5x to 10x faster).  
**Risk**: If two dependencies have conflicting global declarations or broken type definitions, `tsc` will not report the error until runtime or when your code directly interacts with the broken type. It is universally recommended in production for compilation speed.

---

### Q10: What is `composite: true` in `tsconfig.json`?
**Answer:**  
`composite: true` enables TypeScript Project References. It mandates that:
1. `"declaration": true` is enabled.
2. The project can be referenced by other `tsconfig.json` files via `"references": [{ "path": "..." }]`.
3. Builds produce a `.tsbuildinfo` file caching compilation artifacts.
4. All files in the compilation unit are known and bounded.

---

### Q11: Explain the difference between `rootDir` and `rootDirs`.
**Answer:**  
- `rootDir`: The deepest common root directory of all input `.ts` files. TypeScript uses this to replicate the input folder structure inside `outDir`.
- `rootDirs`: An array of virtual root directories that the TypeScript compiler blends together at compile time. This allows files from different physical paths (e.g. generated template files or localized assets) to resolve imports as if they were in the same directory.

---

### Q12: How does `declarationMap: true` work?
**Answer:**  
It generates `.d.ts.map` sourcemap files alongside `.d.ts` files. When a monorepo package imports another package's `.d.ts`, the IDE uses `.d.ts.map` to jump directly to the original `.ts` source file instead of the generated `.d.ts` type definition when using "Go to Definition" (F12).

---

### Q13: What is the difference between `isolatedModules: true` and `isolatedDeclarations: true`?
**Answer:**  
- `isolatedModules: true`: Warns when you write TypeScript code that cannot be safely transpiled to JavaScript by single-file transpilers (e.g. Babel, esbuild) that do not perform cross-file type resolution. Flags: `const enum` usage, type re-exports without `export type`, and namespace merging.
- `isolatedDeclarations: true` (TS 5.5): Specifically requires explicit type annotations on exported entities so that third-party tools can generate `.d.ts` declaration files in single-file isolation without the full TypeScript compiler.

---

### Q14: Explain the Dual-Package Hazard in modern Node.js development.
**Answer:**  
When a package provides both CommonJS and ESM builds:
If package `A` imports the ESM build, and package `B` requires the CJS build within the same application process, Node.js loads two separate instances of the module into memory. If the package relies on singleton state, `instanceof` checks, or global caches, the two instances operate independently, causing state desynchronization and failed `instanceof` comparisons.

---

### Q15: How do you solve the Dual-Package Hazard in `package.json`?
**Answer:**  
Use the "Wrapper Pattern":
Author the core logic purely in ESM (or CJS) with a single shared state store, and create a thin wrapper for the other format that imports/requires the primary instance, or expose separate entry points via `"exports"` map:
```json
{
  "name": "my-pkg",
  "type": "module",
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "import": "./dist/index.js",
      "require": "./dist/index.cjs"
    }
  }
}
```

---

### Q16: Why MUST `"types"` always be the FIRST condition in a `package.json` `"exports"` object?
**Answer:**  
Condition order matters in modern Node.js and TypeScript. Tools resolve the first matching condition from top to bottom. If `"import"` or `"default"` comes before `"types"`, TypeScript 4.x / 5.x will match `"import"` first and may attempt to read the JavaScript file instead of the type definitions, causing lost type definitions:
```json
// CORRECT:
"exports": {
  ".": {
    "types": "./dist/index.d.ts",
    "import": "./dist/index.js",
    "require": "./dist/index.cjs"
  }
}
```

---

### Q17: What does `noImplicitOverride: true` enforce?
**Answer:**  
It enforces that any method in a subclass that overrides a method in a parent class must have the `override` keyword. If the parent class removes or renames the method, TypeScript raises a compile error alerting you that your subclass method no longer overrides anything:
```typescript
class BaseService {
  connect(): void {}
}
class CustomService extends BaseService {
  // Error with noImplicitOverride if 'override' keyword is missing:
  override connect(): void {
    console.log("Connected");
  }
}
```

---

### Q18: What is `useUnknownInCatchVariables: true`?
**Answer:**  
In standard JavaScript and legacy TypeScript, the error parameter in `catch (e)` is typed as `any`. This allows unsafe property access like `e.message` without verification.  
With `useUnknownInCatchVariables: true`, `catch (e)` types `e` as `unknown`, forcing defensive type narrowing before accessing properties:
```typescript
try {
  JSON.parse("{ bad json }");
} catch (err: unknown) {
  if (err instanceof Error) {
    console.error(err.message); // Safe!
  }
}
```

---

### Q19: What is `preserveConstEnums: true` and when should it be used?
**Answer:**  
By default, `const enum` declarations are completely inlined as literal values at compile time, and no JavaScript object is emitted.  
If your code is consumed by external JavaScript files or reflection tools that expect the enum object to exist at runtime, `preserveConstEnums: true` emits the runtime enum object while still inlining values for internal TypeScript code.

---

### Q20: Explain the difference between `paths` in `tsconfig.json` and package subpath exports.
**Answer:**  
- `tsconfig.json` `paths`: Purely a compile-time alias mechanism for TypeScript (e.g. `"@/*": ["src/*"]`). **It does NOT alter emitted JavaScript output**. At runtime, Node.js will fail with `Cannot find module '@/...'` unless a runtime resolver (like `tsconfig-paths` or a bundler) rewrites it.
- Package Subpath Exports (`package.json` `"imports"` / `"exports"`): A native ECMAScript and Node.js standard (e.g. `"#utils/*": "./src/utils/*"`). Works natively at runtime without bundlers or rewrite plugins.

---

### Q21: What is the difference between `declare module "foo"` and `declare module "./foo"`?
**Answer:**  
- `declare module "foo"`: Declares an **ambient module** representing an external npm package or bare specifier named `"foo"`.
- `declare module "./foo"`: Declares a module relative to the file where the declaration lives. Used to augment or type local non-TypeScript files (e.g. CSS modules, `.svg`, or legacy `.js` files).

---

### Q22: What is Declaration Merging and what constructs can merge with each other?
**Answer:**  
Declaration merging occurs when the TypeScript compiler merges two separate declarations with the same name into a single definition:
1. **Interface + Interface**: Properties merge into a unified interface (last declared has highest overload priority).
2. **Namespace + Class**: Adds static properties/utilities to the class constructor.
3. **Namespace + Function**: Adds static properties/methods to a function.
4. **Namespace + Enum**: Adds static methods or values to an enum.
*Note: Classes cannot merge with other classes, and type aliases (`type`) cannot merge with anything.*

---

### Q23: How do you perform Module Augmentation to add a property to an external library's interface?
**Answer:**  
Import the external module and reopen its exported namespace/interface:
```typescript
import "express";

declare module "express" {
  export interface Request {
    currentUser?: { id: string; role: string };
  }
}
```

---

### Q24: What is `globalThis` and how do you augment it in TypeScript?
**Answer:**  
Use `declare global` within a module file (a file containing at least one top-level `import` or `export`):
```typescript
declare global {
  var __APP_METRICS_REGISTRY__: Map<string, number> | undefined;
  function getSystemUptime(): number;
}

export {}; // Ensures this file is treated as a module
```

---

### Q25: What is the difference between `.d.ts`, `.d.mts`, and `.d.cts`?
**Answer:**  
- `.d.ts`: Generic declaration file whose format (CJS or ESM) depends on the surrounding `package.json` `"type"` field and the `tsconfig.json` `module` setting.
- `.d.mts`: Explicit ECMAScript Module declaration file. Always treated as an ESM declaration regardless of `package.json`.
- `.d.cts`: Explicit CommonJS declaration file. Always treated as a CommonJS declaration regardless of `package.json`.

---

### Q26: What is `downlevelIteration: true`?
**Answer:**  
When compiling to an older ECMAScript target (like ES5), `downlevelIteration` emits helper functions (`__values`, `__read`) to faithfully reproduce ES6 iteration protocols (`for...of`, spread `[...iter]`, destructuring) over Symbols and custom iterables, instead of falling back to a naive numeric index loop (`for (var i = 0; i < arr.length; i++)`).

---

### Q27: What is `resolveJsonModule: true`?
**Answer:**  
Allows importing `.json` files directly into TypeScript files with full type inference:
```typescript
import pkg from "./package.json";
console.log(pkg.version); // Type: string
```
Requirement: `moduleResolution` must be `node10`, `node16`, `nodenext`, or `bundler`.

---

### Q28: What is `forceConsistentCasingInFileNames: true`?
**Answer:**  
Windows and macOS file systems are case-insensitive by default (`User.ts` and `user.ts` resolve to the same disk file), while Linux is case-sensitive.  
If Developer A imports `./User.ts` on Windows and Developer B imports `./user.ts`, code compiles fine locally on Windows but crashes CI/CD Linux Docker containers.  
Enabling this flag forces the compiler to error if an import specifier's casing does not exactly match the disk filename.

---

### Q29: What is `noEmitOnError: true`?
**Answer:**  
By default, TypeScript emits `.js` and `.d.ts` files even when compilation errors occur.  
`noEmitOnError: true` guarantees that no output files are written to disk if even a single type error exists, preventing corrupted or incomplete builds in CI pipelines.

---

### Q30: What is `allowSyntheticDefaultImports: true` vs `esModuleInterop: true`?
**Answer:**  
- `allowSyntheticDefaultImports: true`: Purely a type-checker flag. It allows writing `import React from "react"` even if React doesn't have a `default` export in its types. **It emits NO runtime helpers**. At runtime, this crashes in Node.js unless a bundler like webpack handles it.
- `esModuleInterop: true`: Automatically turns on `allowSyntheticDefaultImports` AND emits actual runtime helper functions to make default imports work reliably at runtime.

---

### Q31: What is `types` vs `typeRoots` in `tsconfig.json`?
**Answer:**  
- `typeRoots`: An array of directories containing `@types` packages (defaults to `["./node_modules/@types"]`).
- `types`: A whitelist of specific packages inside `typeRoots` to include in global scope. If `types: ["node", "jest"]` is specified, only those two packages are loaded globally; all other `@types/*` in `node_modules` are excluded from global scope.

---

### Q32: What is `emitDeclarationOnly: true`?
**Answer:**  
Tells the TypeScript compiler to only emit `.d.ts` and `.d.ts.map` files, skipping `.js` generation.  
This is standard in modern build pipelines where a specialized transpiler (like esbuild, Vite, or swc) generates `.js` files in milliseconds, while `tsc` is run purely for type checking and declaration generation.

---

### Q33: How does `references` work with `tsc -b` (build mode)?
**Answer:**  
Project references are invoked using the build flag: `tsc -b` or `tsc --build`.  
`tsc -b` analyzes the dependency graph across all referenced `tsconfig.json` files, builds dependencies in topological order, and skips re-compilation of up-to-date projects by checking `.tsbuildinfo` timestamps.

---

### Q34: What is `allowJs` and `checkJs`?
**Answer:**  
- `allowJs: true`: Allows `.js` and `.jsx` files to be part of the compilation unit and processed by `tsc`.
- `checkJs: true`: Enables type checking inside plain `.js` files using JSDoc type annotations (`/** @type {string} */`).

---

### Q35: How does JSDoc `@template` relate to TypeScript Generics?
**Answer:**  
`@template T` in JSDoc defines a generic type parameter for JavaScript functions when `checkJs: true` is enabled:
```javascript
/**
 * @template T
 * @param {T[]} items
 * @returns {T | undefined}
 */
function firstItem(items) {
  return items[0];
}
```

---

### Q36: What is `stripInternal: true`?
**Answer:**  
Strips any declaration annotated with JSDoc `@internal` from the generated `.d.ts` output. This allows library authors to keep internal methods public across files within their repo while hiding them from external consumers of the library.

---

### Q37: What is `inlineSourceMap` vs `sourceMap`?
**Answer:**  
- `sourceMap: true`: Emits separate `.js.map` files alongside `.js` files.
- `inlineSourceMap: true`: Emits sourcemap data directly inside the `.js` file as a Base64-encoded data URL comment (`//# sourceMappingURL=data:application/json;base64,...`).

---

### Q38: What does `noFallthroughCasesInSwitch: true` do?
**Answer:**  
Flags an error on any non-empty `switch` case that does not terminate with `break`, `return`, or `throw`, preventing accidental fallthrough bugs.

---

### Q39: What is `allowArbitraryExtensions` (introduced in TS 5.0)?
**Answer:**  
Allows importing files with arbitrary extensions (e.g. `import style from "./style.css"`) provided a corresponding `.d.css.ts` declaration file exists on disk to provide the types.

---

### Q40: What is `customConditions` in `tsconfig.json`?
**Answer:**  
Allows specifying custom conditions for `package.json` `"exports"` resolution (e.g. `"customConditions": ["development", "browser"]`), allowing TypeScript to match non-standard export conditions used by modern frameworks.

---

### Q41: Explain how `target` affects emitted JavaScript code.
**Answer:**  
`target` specifies the ECMAScript language version of the emitted JavaScript (e.g. `ES5`, `ES2015`, `ES2020`, `ESNext`).  
If `target: "ES2015"`, async/await and classes are emitted natively. If `target: "ES5"`, async functions are downleveled into complex generator/state-machine helpers (`__awaiter`, `__generator`).

---

### Q42: What does `moduleDetection: "force"` do?
**Answer:**  
By default, TypeScript treats a `.ts` file as a module only if it contains top-level `import` or `export` statements; otherwise, it is treated as a script whose variables enter the global scope.  
`"moduleDetection": "force"` forces all `.ts` files to be treated as modules regardless of whether they contain imports or exports.

---

### Q43: How do you declare ambient types for non-code assets (e.g. `.png`, `.svg`, `.module.css`)?
**Answer:**  
Create an `assets.d.ts` ambient declaration file:
```typescript
declare module "*.png" {
  const content: string;
  export default content;
}

declare module "*.module.css" {
  const classes: Record<string, string>;
  export default classes;
}
```

---

### Q44: What is the risk of using `declare namespace` in modern code?
**Answer:**  
Namespaces are legacy TypeScript features that generate IIFEs (Immediately Invoked Function Expressions) in JavaScript. They do not tree-shake cleanly and conflict with standard ECMAScript modules. Namespaces should only be used in ambient declaration files (`.d.ts`) to describe legacy CJS libraries.

---

### Q45: What is `ts-node` vs `tsx` for running TypeScript in Node.js?
**Answer:**  
- `ts-node`: Classic loader that invokes the full TypeScript compiler (or type-stripping). Requires extensive `tsconfig.json` configuration for ESM (`--loader ts-node/esm`).
- `tsx`: Modern, blazingly fast TypeScript executor powered by esbuild. Seamlessly handles ESM, CJS, `.ts`, `.tsx`, and path aliases with zero configuration.


---

## 4. Comprehensive Questions & Answers (Part 2: Questions 46 to 90)

### Q46: How does `pnpm workspaces` integrate with TypeScript Project References?
**Answer:**  
In a `pnpm-workspace.yaml`, packages are declared:
```yaml
packages:
  - "apps/*"
  - "packages/*"
```
In `apps/web/package.json`, internal packages are linked via `"@corp/ui": "workspace:*"`.  
In `apps/web/tsconfig.json`, the corresponding Project Reference is established:
```json
{
  "references": [{ "path": "../../packages/ui" }]
}
```
This enables both package-manager level symlinking and TypeScript compiler-level incremental build dependency tracking.

---

### Q47: What does the `tsc --explainFiles` flag do?
**Answer:**  
It outputs the reason why every single file was included in the compilation program (e.g. matched by `include`, imported by file X, or pulled in via a global `@types` package).  
This is the single most valuable debugging tool when diagnosing slow compilation times or unexpected type pollutions.

---

### Q48: What does `tsc --extendedDiagnostics` reveal?
**Answer:**  
Prints detailed compiler profiling metrics:
- Number of files, lines of code, and identifiers parsed.
- Memory used by AST nodes and symbols.
- Exact milliseconds spent in: I/O Read, Parse, Resolve Module, Bind, Check, and Emit.

---

### Q49: What is the difference between `incremental: true` and `composite: true`?
**Answer:**  
- `incremental: true`: Emits `.tsbuildinfo` to enable incremental builds for a single standalone project. It does **not** mandate `.d.ts` emit or allow referencing by other projects.
- `composite: true`: Enforces all rules necessary for a project to be referenced by other projects in a multi-project build (`tsc -b`). Automatically enables `incremental: true` and `declaration: true`.

---

### Q50: How do you configure `tsconfig.json` for Explicit Resource Management (`using` / `await using`) introduced in TS 5.2?
**Answer:**  
Add `"esnext.disposable"` or `"es2024"` to the `lib` array, and set `target: "ES2022"` or higher:
```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["ES2022", "esnext.disposable"]
  }
}
```
At runtime, ensure a polyfill for `Symbol.dispose` and `Symbol.asyncDispose` is imported if running on older Node.js versions.

---

### Q51: What is `NoInfer<T>` introduced in TypeScript 5.4?
**Answer:**  
`NoInfer<T>` prevents TypeScript from using a specific argument to infer the generic type parameter `T`, forcing inference to come from another argument:
```typescript
function createSelector<T>(defaultValue: T, options: NoInfer<T>[]): T {
  return defaultValue;
}
// Inference for T comes ONLY from defaultValue ("red"), so "blue" and "green" are checked against "red":
createSelector("red", ["red", "blue"]); // Valid
```

---

### Q52: What is the purpose of triple-slash directive `/// <reference types="..." />`?
**Answer:**  
It declares a dependency on an ambient `@types` package (e.g. `/// <reference types="node" />`). It tells the compiler to load that type declaration file into the compilation unit before checking the current file. In modern code, explicit `import` statements are preferred.

---

### Q53: What is the purpose of `/// <reference path="..." />`?
**Answer:**  
Used in older TypeScript or single-bundle concatenation (`--outFile`) to establish explicit compilation order between files. In modern modular TypeScript, standard ECMAScript `import` statements should be used instead.

---

### Q54: Why does `sideEffects: false` in `package.json` matter for published TypeScript libraries?
**Answer:**  
Webpack, Rollup, and Vite use `"sideEffects": false` to perform aggressive tree-shaking. If a consumer imports `{ utilA }` from your library, the bundler can safely discard all other files in your library if they are not referenced, knowing they don't produce global side effects.

---

### Q55: How do you configure TypeScript to support Path Aliases in both development and production?
**Answer:**  
In `tsconfig.json`:
```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@core/*": ["src/core/*"]
    }
  }
}
```
For production Node.js without bundlers, install `tsconfig-paths` (`node -r tsconfig-paths/register dist/index.js`) or use native package subpath imports (`#core/*`) in `package.json`.

---

### Q56: How do native Package Subpath Imports (`#`) work?
**Answer:**  
Declared in `package.json`:
```json
{
  "name": "my-app",
  "imports": {
    "#utils/*": "./dist/utils/*.js"
  }
}
```
In TypeScript (with `moduleResolution: "nodenext"`):
```typescript
import { logger } from "#utils/logger.js";
```
This is resolved natively by Node.js and TypeScript without any extra tools.

---

### Q57: What is the danger of circular project references in `tsc --build`?
**Answer:**  
If Project A references Project B, and Project B references Project A, `tsc -b` aborts with error `TS6202: Project references may not form a circular graph`.  
Fix: Extract the shared contracts/types into a third package (e.g. `packages/types` or `packages/common`) that both A and B reference.

---

### Q58: What is `emitDecoratorMetadata` and what are its dependencies?
**Answer:**  
`emitDecoratorMetadata: true` emits runtime reflection metadata (`design:type`, `design:paramtypes`, `design:returntype`) using the legacy experimental decorator system.  
It requires:
1. `experimentalDecorators: true`
2. A runtime polyfill like `reflect-metadata` imported at the application entry point.

---

### Q59: Can `emitDecoratorMetadata` be used with modern Stage 3 Decorators?
**Answer:**  
**No.** Stage 3 Decorators (TS 5.0+) do not support `emitDecoratorMetadata`. Stage 3 decorators use the standard `context.metadata` dictionary object specified by TC39.

---

### Q60: What does `resolvePackageJsonExports: true` do?
**Answer:**  
Forces TypeScript to consult the `"exports"` field of `package.json` when resolving packages, even if `moduleResolution` is set to legacy `node10`.

---

### Q61: What is the difference between `tsc` and `tsc -p tsconfig.build.json`?
**Answer:**  
By default, `tsc` looks for `tsconfig.json` in the current working directory. The `-p` or `--project` flag points to a specific configuration file (e.g. `tsconfig.build.json` which excludes tests and development tools for production emit).

---

### Q62: What is `sourceRoot` and `mapRoot`?
**Answer:**  
- `sourceRoot`: Specifies the base URL or disk path where debuggers should locate source TypeScript files instead of looking at relative paths.
- `mapRoot`: Specifies the base location where debuggers should locate `.js.map` sourcemap files instead of generated locations.

---

### Q63: How do you declare ambient types for global environment variables in `process.env`?
**Answer:**  
Augment the Node.js `ProcessEnv` interface:
```typescript
declare global {
  namespace NodeJS {
    interface ProcessEnv {
      DATABASE_URL: string;
      PORT?: string;
      NODE_ENV: "development" | "production" | "test";
    }
  }
}
export {};
```

---

### Q64: What is `declarationDir`?
**Answer:**  
Specifies a distinct directory for emitted `.d.ts` declaration files, separating them from the emitted `.js` files when `outDir` contains the JavaScript code.

---

### Q65: What does `allowUmdGlobalAccess: true` do?
**Answer:**  
Allows accessing UMD (Universal Module Definition) exports as global variables even within module files (files containing `import`/`export`).

---

### Q66: What is the `target` vs `lib` relationship?
**Answer:**  
- `target` controls the syntax emitted in output JavaScript (e.g. `ES5` vs `ES2022`).
- `lib` controls what built-in API types are available during type-checking (e.g. `["ES2022", "DOM"]`).
If `lib` is omitted, TypeScript provides default API definitions based on `target`.

---

### Q67: What does `noErrorTruncation: true` do?
**Answer:**  
Prevents TypeScript from truncating long types in error messages with `...` (ellipsis), allowing developers to see the full structural mismatch in deep generic or mapped types.

---

### Q68: What is `pretty: true`?
**Answer:**  
Enables colorful, formatted compiler error output with syntax highlighting and code context markers in the terminal.

---

### Q69: What is `diagnostics: true`?
**Answer:**  
Outputs basic compiler performance metrics (file count, memory usage) after compilation.

---

### Q70: How do you type `window` extensions in TypeScript?
**Answer:**  
Augment the global `Window` interface:
```typescript
declare global {
  interface Window {
    analytics?: {
      trackEvent(name: string, payload: Record<string, unknown>): void;
    };
  }
}
export {};
```

---

### Q71: What is the difference between a Script and a Module in TypeScript?
**Answer:**  
- **Script**: Any file without top-level `import` or `export` statements. All variables and functions declared in a script exist in the global scope!
- **Module**: Any file with at least one `import` or `export` statement. Top-level declarations are scoped locally to the file.

---

### Q72: How does `export =` and `import = require()` work in TypeScript?
**Answer:**  
This is TypeScript's syntax for native CommonJS interoperability:
```typescript
// math.ts
function sum(a: number, b: number) { return a + b; }
export = sum; // Emits: module.exports = sum;

// consumer.ts
import sum = require("./math"); // Emits: const sum = require("./math");
```

---

### Q73: What is `allowUnreachableCode: false`?
**Answer:**  
Causes the compiler to raise an error if any code is proven unreachable (e.g. lines after a `return`, `throw`, or infinite loop).

---

### Q74: What is `allowUnusedLabels: false`?
**Answer:**  
Reports errors on unused loop labels in JavaScript loops.

---

### Q75: How do you type dynamic imports with variable paths in TypeScript?
**Answer:**  
Use `import()` expressions with template literal types or indexed type maps:
```typescript
type ModuleName = "auth" | "billing";
async function loadModule(name: ModuleName) {
  const mod = await import(`./plugins/${name}.js`);
  return mod;
}
```

---

### Q76: What is `moduleSuffixes` in `tsconfig.json`?
**Answer:**  
Provides a list of filename suffixes to search during module resolution (e.g. `[".ios", ".native", ""]`), heavily used in React Native projects to resolve platform-specific implementations.

---

### Q77: What is `resolvePackageJsonImports: true`?
**Answer:**  
Forces the compiler to resolve internal subpath imports defined in `package.json` `"imports"` when compiling under non-NodeNext resolution modes.

---

### Q78: Why should you NEVER publish `.ts` files directly to `node_modules` on npm?
**Answer:**  
1. Every consumer's project may have different `tsconfig.json` settings, causing compilation failures.
2. Build times skyrocket as consumers re-compile your code.
3. Node.js cannot execute `.ts` files directly without special loaders. Always publish pre-compiled `.js` and `.d.ts` files.

---

### Q79: What is `stripInternal`'s effect on API documentation tools (like API Extractor or TypeDoc)?
**Answer:**  
It signals to documentation tools that classes, methods, or properties annotated with `@internal` should be omitted from public API documentation and declaration rollups.

---

### Q80: How does `declaration` interact with `outDir`?
**Answer:**  
When both are specified, `.d.ts` files are emitted into `outDir` following the same directory structure as emitted `.js` files. If `declarationDir` is also set, `.d.ts` files go to `declarationDir` instead.

---

### Q81: What is `noPropertyAccessFromIndexSignature: true`?
**Answer:**  
Forces accessing index-signature properties via bracket notation (`obj["foo"]`) instead of dot notation (`obj.foo`). This clearly distinguishes between explicitly declared fields and dynamic map lookups.

---

### Q82: What is `suppressImplicitAnyIndexErrors`?
**Answer:**  
A deprecated legacy flag that suppressed errors when indexing an object without an index signature. It should never be used in modern TypeScript; use `Record<string, unknown>` or `keyof` instead.

---

### Q83: What is `types: []` (empty array) used for?
**Answer:**  
Setting `"types": []` disables automatic global inclusion of all packages found in `node_modules/@types`. This prevents accidental pollution of global scope (e.g. preventing `@types/node` from adding Node globals like `Buffer` to a pure frontend browser app).

---

### Q84: What is `rootDir` inference failure?
**Answer:**  
If a file outside the intended source directory is included in compilation (e.g. a shared config file `../../config.ts`), TypeScript recalculates `rootDir` to the common parent directory, shifting the output folder structure inside `outDir` (e.g. `dist/src/...` instead of `dist/...`).  
Fix: Explicitly set `"rootDir": "src"`.

---

### Q85: What does `noImplicitReturns: true` enforce?
**Answer:**  
Ensures that all code paths in a function with a return type explicitly return a value, preventing accidental returns of `undefined` through falling off the end of a branch.

---

### Q86: What is `importHelpers: true` and `tslib`?
**Answer:**  
When downleveling features (classes, spreads, decorators, async/await), TypeScript emits helper functions (`__extends`, `__assign`). By default, it copies these helpers into every single compiled file!  
`importHelpers: true` imports helpers from the shared `tslib` npm package instead, drastically reducing final bundle size across large codebases.

---

### Q87: What is `strictBindCallApply: true`?
**Answer:**  
Ensures that `.bind()`, `.call()`, and `.apply()` methods on functions are type-checked against the actual function parameters and `this` context.

---

### Q88: What is `strictFunctionTypes: true`?
**Answer:**  
Enforces contravariant parameter checking on function types instead of bivariant checking, preventing runtime type mismatches when assigning function callbacks.

---

### Q89: What is `strictPropertyInitialization: true`?
**Answer:**  
Requires that all non-optional class properties are initialized in their declaration or inside the constructor, preventing `undefined` property errors at runtime.

---

### Q90: What is the ultimate Enterprise TypeScript Gold-Standard configuration?
**Answer:**  
A layered configuration using `"strict": true`, `"noUncheckedIndexedAccess": true`, `"exactOptionalPropertyTypes": true`, `"noImplicitOverride": true`, `"verbatimModuleSyntax": true`, and `"skipLibCheck": true`.


---

## 5. Output Prediction Puzzles & Compiler Diagnostics (15 Puzzles)

```typescript
// ============================================================================
// PUZZLE 1: The noUncheckedIndexedAccess Trap
// ============================================================================
// Compiler Setting: "noUncheckedIndexedAccess": true
const registry: Record<string, number> = { cpu: 8, memory: 32 };
const key = "gpu";
const gpuCores = registry[key];

// Question: What is the compiler diagnosis for line A, and what is logged at runtime on line B?
// Line A:
// const doubled = gpuCores * 2;
// Line B:
console.log(typeof gpuCores, gpuCores);

/**
 * COMPILER DIAGNOSTIC & TRACE:
 * 1. Under "noUncheckedIndexedAccess": true, dynamic index signatures return T | undefined.
 * 2. Therefore, `gpuCores` has type `number | undefined`.
 * 3. Line A produces Compile Error TS18048: 'gpuCores' is possibly 'undefined'.
 * 4. At runtime, JavaScript executes without type constraints: registry["gpu"] is undefined.
 * Output: "undefined undefined"
 */


// ============================================================================
// PUZZLE 2: exactOptionalPropertyTypes vs Object.assign
// ============================================================================
// Compiler Setting: "exactOptionalPropertyTypes": true
interface ServerConfig {
  port?: number;
  host: string;
}

const defaultConfig: ServerConfig = { port: 8080, host: "0.0.0.0" };
const userConfig = { port: undefined };

// Question: Can `userConfig` be typed as `Partial<ServerConfig>` under exactOptionalPropertyTypes?
// What happens if we do Object.assign({}, defaultConfig, userConfig)?

/**
 * COMPILER DIAGNOSTIC & TRACE:
 * 1. Under "exactOptionalPropertyTypes": true, optional properties `port?: number` accept
 *    either a number or being completely omitted. They do NOT accept explicit `undefined`.
 * 2. Assigning { port: undefined } to ServerConfig yields:
 *    Type 'undefined' is not assignable to type 'number' with 'exactOptionalPropertyTypes: true'.
 * 3. At runtime, Object.assign({}, { port: 8080 }, { port: undefined }) results in
 *    { port: undefined }, overwriting the default port with undefined!
 * Output: { port: undefined, host: "0.0.0.0" }
 */


// ============================================================================
// PUZZLE 3: verbatimModuleSyntax Import Elision
// ============================================================================
// Compiler Setting: "verbatimModuleSyntax": true
// In models.ts:
export interface UserDTO { id: string; name: string; }
export class UserEntity { constructor(public id: string) {} }

// In service.ts:
import { UserDTO, UserEntity } from "./models.js";

// Question: What JavaScript code is emitted for the import statement in service.ts?

/**
 * COMPILER DIAGNOSTIC & TRACE:
 * 1. Under "verbatimModuleSyntax": true, TypeScript will NOT inspect whether UserDTO
 *    is an interface or class to elide it automatically.
 * 2. It requires `import type { UserDTO }` for type-only imports.
 * 3. Because UserDTO is imported without `type`, TS emits:
 *    import { UserDTO, UserEntity } from "./models.js";
 * 4. In a pure ESM environment, importing UserDTO (which has no JS runtime export)
 *    causes a SyntaxError: Named export 'UserDTO' not found in './models.js'!
 */


// ============================================================================
// PUZZLE 4: isolatedDeclarations Missing Signature
// ============================================================================
// Compiler Setting: "isolatedDeclarations": true (TS 5.5+)
export function calculateFactorial(n: number) {
  if (n <= 1) return 1;
  return n * calculateFactorial(n - 1);
}

// Question: Does this compile under isolatedDeclarations? If not, what error is thrown?

/**
 * COMPILER DIAGNOSTIC & TRACE:
 * 1. With "isolatedDeclarations": true, all exported functions must declare an explicit return type.
 * 2. Single-file declaration emitters cannot perform recursive type analysis.
 * 3. Error TS9007: Function must have an explicit return type annotation with --isolatedDeclarations.
 * Fix: export function calculateFactorial(n: number): number { ... }
 */


// ============================================================================
// PUZZLE 5: Interface and Namespace Declaration Merging
// ============================================================================
interface TaskRunner {
  execute(taskId: string): Promise<boolean>;
}

namespace TaskRunner {
  export const DEFAULT_TIMEOUT_MS = 5000;
  export function createDefault(): TaskRunner {
    return {
      async execute(id: string) {
        console.log(`Executed ${id}`);
        return true;
      }
    };
  }
}

// Question: Is TaskRunner a type, a value, or both? What does this log?
const runner: TaskRunner = TaskRunner.createDefault();
console.log(TaskRunner.DEFAULT_TIMEOUT_MS);

/**
 * COMPILER DIAGNOSTIC & TRACE:
 * 1. An interface creates a declaration in the TYPE namespace.
 * 2. A namespace creates a declaration in the VALUE namespace.
 * 3. They merge cleanly without conflict: TaskRunner acts as a type for `runner`,
 *    and as an object containing static properties at runtime.
 * Output: 5000
 */


// ============================================================================
// PUZZLE 6: The Dual-Package Hazard Simulation
// ============================================================================
class TokenRegistry {
  private static instance: TokenRegistry;
  private tokens = new Set<string>();
  private constructor() {}
  public static getInstance() {
    if (!TokenRegistry.instance) TokenRegistry.instance = new TokenRegistry();
    return TokenRegistry.instance;
  }
  public register(token: string) { this.tokens.add(token); }
  public has(token: string) { return this.tokens.has(token); }
}

// Module A (ESM build) calls:
const regA = TokenRegistry.getInstance();
regA.register("auth_abc");

// Module B (loaded via CJS require in same Node process):
// In Node.js dual-package hazard, Module B executes a separate copy of TokenRegistry class!
const regB = TokenRegistry.getInstance();
console.log("Tokens match:", regA === regB);

/**
 * COMPILER DIAGNOSTIC & TRACE:
 * 1. If Module A and Module B are bundled or loaded via different module formats (ESM vs CJS),
 *    two distinct class constructors and two private static `instance` singletons are instantiated.
 * 2. regA !== regB (evaluates to false).
 * 3. regB.has("auth_abc") returns false!
 * Output: "Tokens match: true" (in single bundle) but FALSE in dual-package runtime!
 */


// ============================================================================
// PUZZLE 7: noImplicitOverride Enforcement
// ============================================================================
// Compiler Setting: "noImplicitOverride": true
class DatabaseDriver {
  connect(): void { console.log("DB Connected"); }
  disconnect(): void { console.log("DB Disconnected"); }
}

class PostgresDriver extends DatabaseDriver {
  connect(): void { console.log("Postgres Connected"); }
}

// Question: What is the compiler diagnostic?

/**
 * COMPILER DIAGNOSTIC & TRACE:
 * 1. With "noImplicitOverride": true, any method overriding a base class method
 *    MUST be explicitly annotated with the `override` keyword.
 * 2. Error TS4114: This member must have an 'override' modifier because it overrides
 *    a member in the base class 'DatabaseDriver'.
 * Fix: override connect(): void { ... }
 */


// ============================================================================
// PUZZLE 8: useUnknownInCatchVariables Duck-Typing
// ============================================================================
// Compiler Setting: "useUnknownInCatchVariables": true
function parsePayload(raw: string) {
  try {
    return JSON.parse(raw);
  } catch (err) {
    // Question: What type is `err`? Can we do err.message directly?
    if (typeof err === "object" && err !== null && "message" in err) {
      console.log((err as { message: string }).message);
    }
  }
}

/**
 * COMPILER DIAGNOSTIC & TRACE:
 * 1. `err` is typed as `unknown`.
 * 2. Direct property access `err.message` produces Error TS18046: 'err' is of type 'unknown'.
 * 3. Narrowing using `typeof err === "object" && err !== null && "message" in err`
 *    safely verifies the shape before property access.
 */


// ============================================================================
// PUZZLE 9: Subpath Exports Resolution Precedence
// ============================================================================
// In package.json:
/*
{
  "name": "enterprise-sdk",
  "exports": {
    ".": {
      "import": "./dist/index.js",
      "types": "./dist/index.d.ts"
    }
  }
}
*/
// Question: What is wrong with this exports field?

/**
 * COMPILER DIAGNOSTIC & TRACE:
 * 1. Condition keys in package.json "exports" are evaluated in order of insertion.
 * 2. Because "import" comes before "types", bundlers and TypeScript resolving the ESM
 *    import will match "import" first and may completely skip "types"!
 * 3. Fix: Always place "types" as the very first condition in any condition group.
 */


// ============================================================================
// PUZZLE 10: Declaration Merging with Enum
// ============================================================================
enum HttpStatusCode {
  OK = 200,
  NOT_FOUND = 404
}

namespace HttpStatusCode {
  export function isSuccess(code: HttpStatusCode): boolean {
    return code >= 200 && code < 300;
  }
}

console.log(HttpStatusCode.isSuccess(HttpStatusCode.OK));
console.log(HttpStatusCode.isSuccess(HttpStatusCode.NOT_FOUND));

/**
 * COMPILER DIAGNOSTIC & TRACE:
 * 1. TypeScript allows namespaces to merge with Enums.
 * 2. This pattern attaches static domain methods to the enum object cleanly.
 * Output:
 * true
 * false
 */


// ============================================================================
// PUZZLE 11: downlevelIteration with Symbol.iterator
// ============================================================================
// Compiler Setting: "target": "ES5", "downlevelIteration": false
class NumberSequence {
  *[Symbol.iterator]() {
    yield 10;
    yield 20;
  }
}

const seq = new NumberSequence();
// Question: Can we spread `[...seq]` if downlevelIteration is false targeting ES5?

/**
 * COMPILER DIAGNOSTIC & TRACE:
 * 1. In ES5 without downlevelIteration, TypeScript assumes arrays have numeric indices.
 * 2. Spreading a custom iterable object fails with:
 *    Type 'NumberSequence' is not an array type or a string type.
 *    Use compiler option '--downlevelIteration' to allow iterating with Symbol.iterator.
 */


// ============================================================================
// PUZZLE 12: Ambient Augmentation of globalThis
// ============================================================================
// File: env.d.ts
declare global {
  var BUILD_TIMESTAMP: number;
}
export {};

// File: index.ts
globalThis.BUILD_TIMESTAMP = Date.now();
console.log(typeof globalThis.BUILD_TIMESTAMP);

/**
 * COMPILER DIAGNOSTIC & TRACE:
 * 1. The `declare global` block within an ESM module file adds `BUILD_TIMESTAMP`
 *    to the global scope interface.
 * 2. Accessing and mutating `globalThis.BUILD_TIMESTAMP` compiles with zero errors.
 * Output: "number"
 */


// ============================================================================
// PUZZLE 13: rootDir Shift Trap
// ============================================================================
// Directory Structure:
// /project
//   ├── tsconfig.json ("rootDir": undefined, "outDir": "dist")
//   ├── src/
//   │    └── index.ts
//   └── shared-config.ts (outside src/)

// In src/index.ts:
// import { config } from "../shared-config.js";

// Question: What does the output folder structure inside /dist look like?

/**
 * COMPILER DIAGNOSTIC & TRACE:
 * 1. Without an explicit "rootDir", TypeScript finds the deepest common directory
 *    containing all input files.
 * 2. Because shared-config.ts lives at the root, the common root is /project, NOT /src!
 * 3. Output files are placed in:
 *    dist/src/index.js
 *    dist/shared-config.js
 * 4. This breaks scripts expecting `dist/index.js`!
 * Fix: Explicitly set "rootDir": "./src" or place shared files in a referenced project.
 */


// ============================================================================
// PUZZLE 14: noPropertyAccessFromIndexSignature
// ============================================================================
// Compiler Setting: "noPropertyAccessFromIndexSignature": true
interface UserSession {
  userId: string;
  [metadataKey: string]: unknown;
}

const session: UserSession = { userId: "usr_101", ip: "127.0.0.1" };
console.log(session.userId);
// Line X:
// console.log(session.ip);

/**
 * COMPILER DIAGNOSTIC & TRACE:
 * 1. `userId` is an explicitly defined field; dot notation `session.userId` is permitted.
 * 2. `ip` is an index signature field.
 * 3. Line X produces Error TS4111: Property 'ip' comes from an index signature,
 *    so it must be accessed with ['ip'].
 * Fix: session["ip"]
 */


// ============================================================================
// PUZZLE 15: NoInfer<T> Generic Guard
// ============================================================================
// Compiler Setting: TypeScript 5.4+
function configureTransport<T extends string>(
  primary: T,
  fallbacks: NoInfer<T>[]
): { primary: T; fallbacks: T[] } {
  return { primary, fallbacks };
}

// Call A:
const configA = configureTransport("grpc", ["grpc", "http"]); // Error or Valid?

/**
 * COMPILER DIAGNOSTIC & TRACE:
 * 1. In `configureTransport`, `primary` has type `T`.
 * 2. `fallbacks` uses `NoInfer<T>`, meaning TypeScript will NOT widen `T` to include
 *    literal types from the `fallbacks` array.
 * 3. `T` is inferred strictly as `"grpc"` from the first parameter.
 * 4. The array element `"http"` is not assignable to type `"grpc"`.
 * 5. Error TS2322: Type '"http"' is not assignable to type '"grpc"'.
 */


---

## 6. Enterprise Capstone Projects

```typescript
// ============================================================================
// PROJECT 1: Enterprise Monorepo Config Validator & Topology Analyzer
// ============================================================================

/**
 * Architectural Overview:
 * In a monorepo with 50+ packages, configuration drift causes subtle compilation
 * failures and broken declaration maps. This engine parses tsconfig trees,
 * validates composite and reference integrity, detects circular dependencies,
 * and validates that project references form a Directed Acyclic Graph (DAG).
 */

export interface PackageTsConfig {
  name: string;
  path: string;
  compilerOptions?: {
    composite?: boolean;
    declaration?: boolean;
    declarationMap?: boolean;
    rootDir?: string;
    outDir?: string;
    strict?: boolean;
    noUncheckedIndexedAccess?: boolean;
  };
  references?: Array<{ path: string }>;
}

export interface ValidationIssue {
  packageName: string;
  rule: string;
  severity: "error" | "warning";
  message: string;
}

export class MonorepoTopologyValidator {
  private packageMap = new Map<string, PackageTsConfig>();

  public registerPackage(config: PackageTsConfig): void {
    this.packageMap.set(config.name, config);
  }

  public validateMonorepo(): { isValid: boolean; issues: ValidationIssue[] } {
    const issues: ValidationIssue[] = [];

    // Rule 1: Composite Invariants
    for (const [name, pkg] of this.packageMap.entries()) {
      const opts = pkg.compilerOptions || {};

      if (opts.composite) {
        if (!opts.declaration) {
          issues.push({
            packageName: name,
            rule: "COMPOSITE_REQUIRES_DECLARATION",
            severity: "error",
            message: `Package "${name}" has composite: true but declaration: false or missing.`
          });
        }
        if (!opts.declarationMap) {
          issues.push({
            packageName: name,
            rule: "DECLARATION_MAP_RECOMMENDED",
            severity: "warning",
            message: `Package "${name}" has composite: true without declarationMap. IDE "Go to Definition" will jump to .d.ts instead of source.`
          });
        }
      }

      // Rule 2: References must exist
      if (pkg.references) {
        for (const ref of pkg.references) {
          const referencedPkg = Array.from(this.packageMap.values()).find(
            p => p.path === ref.path
          );
          if (referencedPkg && !referencedPkg.compilerOptions?.composite) {
            issues.push({
              packageName: name,
              rule: "REFERENCED_PROJECT_NOT_COMPOSITE",
              severity: "error",
              message: `Project "${name}" references "${referencedPkg.name}", but the target project does not have "composite": true.`
            });
          }
        }
      }
    }

    // Rule 3: Circular Reference Detection via DFS
    const cycleDetected = this.detectCycles(issues);

    return {
      isValid: issues.filter(i => i.severity === "error").length === 0 && !cycleDetected,
      issues
    };
  }

  private detectCycles(issues: ValidationIssue[]): boolean {
    const visited = new Set<string>();
    const recStack = new Set<string>();

    const dfs = (pkgName: string): boolean => {
      visited.add(pkgName);
      recStack.add(pkgName);

      const pkg = this.packageMap.get(pkgName);
      if (pkg?.references) {
        for (const ref of pkg.references) {
          const childPkg = Array.from(this.packageMap.values()).find(p => p.path === ref.path);
          if (!childPkg) continue;

          if (!visited.has(childPkg.name)) {
            if (dfs(childPkg.name)) return true;
          } else if (recStack.has(childPkg.name)) {
            issues.push({
              packageName: pkgName,
              rule: "CIRCULAR_PROJECT_REFERENCE",
              severity: "error",
              message: `Circular project reference cycle detected: ${pkgName} -> ${childPkg.name}`
            });
            return true;
          }
        }
      }

      recStack.delete(pkgName);
      return false;
    };

    for (const name of this.packageMap.keys()) {
      if (!visited.has(name)) {
        if (dfs(name)) return true;
      }
    }
    return false;
  }
}


// ============================================================================
// PROJECT 2: Isolated Declarations AST Signature Normalizer (TS 5.5+)
// ============================================================================

/**
 * Architectural Overview:
 * TypeScript 5.5's isolatedDeclarations mandates that every exported function,
 * method, and constant has an explicit return type so fast transpilers (esbuild/swc)
 * can emit .d.ts files in parallel. This tool inspects exported definitions,
 * flags missing signatures, and generates valid declaration stubs.
 */

export interface ExportedFunctionDescriptor {
  name: string;
  isExported: boolean;
  hasExplicitReturnType: boolean;
  inferredReturnType?: string;
  parameters: Array<{ name: string; type: string }>;
}

export class IsolatedDeclarationAuditor {
  public auditSignatures(declarations: ExportedFunctionDescriptor[]): {
    compliant: boolean;
    diagnostics: string[];
    synthesizedDeclarations: string[];
  } {
    const diagnostics: string[] = [];
    const synthesized: string[] = [];
    let compliant = true;

    for (const decl of declarations) {
      if (!decl.isExported) continue;

      if (!decl.hasExplicitReturnType) {
        compliant = false;
        diagnostics.push(
          `TS9007: Exported function '${decl.name}' must have an explicit return type annotation with --isolatedDeclarations.`
        );

        // Generate remediation declaration
        const params = decl.parameters.map(p => `${p.name}: ${p.type}`).join(", ");
        const returnType = decl.inferredReturnType || "unknown";
        synthesized.push(`export declare function ${decl.name}(${params}): ${returnType};`);
      } else {
        const params = decl.parameters.map(p => `${p.name}: ${p.type}`).join(", ");
        synthesized.push(`export declare function ${decl.name}(${params}): ${decl.inferredReturnType};`);
      }
    }

    return {
      compliant,
      diagnostics,
      synthesizedDeclarations: synthesized
    };
  }
}


// ============================================================================
// PROJECT 3: Multi-Target Universal Library Packager
// ============================================================================

/**
 * Architectural Overview:
 * Solves the Dual-Package Hazard and generates compliant package.json "exports"
 * maps for universal ESM/CJS libraries with TypeScript declaration trees.
 */

export interface LibraryExportSpec {
  subpath: string; // e.g. "." or "./helpers"
  esmEntry: string;
  cjsEntry: string;
  typesEntry: string;
}

export class UniversalPackageJsonGenerator {
  public static generateExports(specs: LibraryExportSpec[]): Record<string, unknown> {
    const exportsMap: Record<string, unknown> = {};

    for (const spec of specs) {
      // INVARIANT: "types" MUST ALWAYS BE THE FIRST KEY in the condition block!
      exportsMap[spec.subpath] = {
        types: spec.typesEntry,
        import: spec.esmEntry,
        require: spec.cjsEntry,
        default: spec.esmEntry
      };
    }

    return {
      name: "enterprise-core-library",
      type: "module",
      main: specs.find(s => s.subpath === ".")?.cjsEntry,
      module: specs.find(s => s.subpath === ".")?.esmEntry,
      types: specs.find(s => s.subpath === ".")?.typesEntry,
      exports: exportsMap,
      sideEffects: false
    };
  }
}


// ============================================================================
// PROJECT 4: Ambient Declaration & Runtime Schema Synchronizer
// ============================================================================

/**
 * Architectural Overview:
 * Ensures that ambient declaration types (such as environment variables or
 * plugin registry extensions) have 100% parity with runtime validation schemas.
 */

export interface EnvSchemaDefinition {
  name: string;
  type: "string" | "number" | "boolean";
  required: boolean;
  defaultValue?: unknown;
}

export class AmbientTypeSynchronizer {
  private schemaFields = new Map<string, EnvSchemaDefinition>();

  public registerField(field: EnvSchemaDefinition): void {
    this.schemaFields.set(field.name, field);
  }

  public generateAmbientDts(): string {
    const lines: string[] = [
      "// Auto-generated ambient declaration file. Do NOT edit manually.",
      "declare global {",
      "  namespace NodeJS {",
      "    interface ProcessEnv {"
    ];

    for (const field of this.schemaFields.values()) {
      const tsType = field.type;
      const opt = field.required ? "" : "?";
      lines.push(`      ${field.name}${opt}: ${tsType};`);
    }

    lines.push("    }");
    lines.push("  }");
    lines.push("}");
    lines.push("export {};");

    return lines.join("\n");
  }

  public validateRuntimeEnv(env: Record<string, string | undefined>): {
    valid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    for (const field of this.schemaFields.values()) {
      const val = env[field.name];
      if (field.required && (val === undefined || val === "")) {
        errors.push(`Missing required environment variable: ${field.name}`);
        continue;
      }
      if (val !== undefined && field.type === "number" && isNaN(Number(val))) {
        errors.push(`Environment variable ${field.name} must be a number, got "${val}"`);
      }
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }
}


// ============================================================================
// COMPREHENSIVE VERIFICATION TEST SUITE
// ============================================================================

export function runModuleVerificationTests(): boolean {
  console.log("=== Running TS-10 Production Verification Tests ===");

  // Test 1: Monorepo Topology Validator
  const validator = new MonorepoTopologyValidator();
  validator.registerPackage({
    name: "@corp/core",
    path: "packages/core",
    compilerOptions: { composite: true, declaration: true, declarationMap: true }
  });
  validator.registerPackage({
    name: "@corp/ui",
    path: "packages/ui",
    compilerOptions: { composite: true, declaration: true, declarationMap: true },
    references: [{ path: "packages/core" }]
  });

  const report1 = validator.validateMonorepo();
  if (!report1.isValid) throw new Error("Test 1 Failed: Valid monorepo flagged as invalid!");
  console.log("✔ Test 1 Passed: Monorepo Project References Validated");

  // Test 2: Circular Dependency Detection
  const cyclicValidator = new MonorepoTopologyValidator();
  cyclicValidator.registerPackage({
    name: "pkg-a",
    path: "packages/a",
    compilerOptions: { composite: true, declaration: true },
    references: [{ path: "packages/b" }]
  });
  cyclicValidator.registerPackage({
    name: "pkg-b",
    path: "packages/b",
    compilerOptions: { composite: true, declaration: true },
    references: [{ path: "packages/a" }]
  });
  const cyclicReport = cyclicValidator.validateMonorepo();
  if (cyclicReport.isValid) throw new Error("Test 2 Failed: Cycle not detected!");
  console.log("✔ Test 2 Passed: Cyclic Project References Caught");

  // Test 3: Isolated Declarations Auditor
  const auditor = new IsolatedDeclarationAuditor();
  const result = auditor.auditSignatures([
    {
      name: "computeMetrics",
      isExported: true,
      hasExplicitReturnType: false,
      inferredReturnType: "{ total: number }",
      parameters: [{ name: "raw", type: "number[]" }]
    }
  ]);
  if (result.compliant || result.diagnostics.length === 0) {
    throw new Error("Test 3 Failed: Isolated declarations violation missed!");
  }
  console.log("✔ Test 3 Passed: Isolated Declarations Auditor Enforced Explicit Return Types");

  // Test 4: Universal Package JSON Generator
  const pkgConfig = UniversalPackageJsonGenerator.generateExports([
    {
      subpath: ".",
      esmEntry: "./dist/index.js",
      cjsEntry: "./dist/index.cjs",
      typesEntry: "./dist/index.d.ts"
    }
  ]) as Record<string, unknown>;

  const rootExports = (pkgConfig.exports as Record<string, Record<string, string>>)["."];
  const keys = Object.keys(rootExports);
  if (keys[0] !== "types") {
    throw new Error("Test 4 Failed: 'types' must be the first key in exports!");
  }
  console.log("✔ Test 4 Passed: Package.json exports condition precedence verified");

  // Test 5: Ambient Type Synchronizer
  const sync = new AmbientTypeSynchronizer();
  sync.registerField({ name: "PORT", type: "number", required: true });
  sync.registerField({ name: "DATABASE_URL", type: "string", required: true });

  const dts = sync.generateAmbientDts();
  if (!dts.includes("PORT: number;") || !dts.includes("DATABASE_URL: string;")) {
    throw new Error("Test 5 Failed: Ambient .d.ts generation incomplete!");
  }
  const envTest = sync.validateRuntimeEnv({ PORT: "abc", DATABASE_URL: "postgres://..." });
  if (envTest.valid) throw new Error("Test 5 Failed: Non-numeric PORT was not caught!");
  console.log("✔ Test 5 Passed: Ambient .d.ts and Runtime Env Parity Verified");

  console.log("🎉 ALL TS-10 VERIFICATION TESTS PASSED SUCCESSFULLY!");
  return true;
}

runModuleVerificationTests();


---

## 7. Practice Drills, Key Takeaways & Enterprise Summary

### 7.1 75 Hands-On Production Drills

1. **Drill 1**: Initialize an enterprise tsconfig using `npx tsc --init` and turn on all 8 core strict flags.
2. **Drill 2**: Add `"noUncheckedIndexedAccess": true` and verify how an array index lookup `arr[0]` type changes.
3. **Drill 3**: Add `"exactOptionalPropertyTypes": true` and write an interface demonstrating why `{ field: undefined }` produces an error.
4. **Drill 4**: Enable `"noImplicitOverride": true` and create a subclass overriding a method with and without the `override` keyword.
5. **Drill 5**: Configure `"verbatimModuleSyntax": true` and fix type imports by adding the `type` modifier.
6. **Drill 6**: Create a monorepo root `tsconfig.base.json` with shared compiler options extended by sub-packages.
7. **Drill 7**: Set up a package `packages/core` with `"composite": true` and verify that `"declaration": true` is enforced.
8. **Drill 8**: Add `"declarationMap": true` to `packages/core` and inspect the emitted `.d.ts.map` file.
9. **Drill 9**: Set up a consuming app `apps/web` with `"references": [{ "path": "../../packages/core" }]`.
10. **Drill 10**: Run `tsc -b` and observe the generation of `.tsbuildinfo` caching artifacts.
11. **Drill 11**: Create a circular reference between two packages and observe error `TS6202`.
12. **Drill 12**: Refactor the circular reference by extracting shared interfaces into a third `packages/types` package.
13. **Drill 13**: Configure `isolatedDeclarations: true` and write a function without a return type to trigger `TS9007`.
14. **Drill 14**: Fix the `isolatedDeclarations` error by explicitly typing the return signature.
15. **Drill 15**: Create a `package.json` with `"type": "module"` and an `"exports"` map supporting both CJS and ESM.
16. **Drill 16**: Ensure `"types"` is placed as the first key in the export condition map.
17. **Drill 17**: Configure `moduleResolution: "nodenext"` and write relative imports requiring `.js` extensions.
18. **Drill 18**: Create a `.d.mts` file and verify it is treated as an ECMAScript module declaration.
19. **Drill 19**: Create a `.d.cts` file and verify it is treated as a CommonJS declaration.
20. **Drill 20**: Declare an ambient module `declare module "virtual:config"` and import from it in source code.
21. **Drill 21**: Augment the `Window` interface using `declare global` to add a typed analytics tracker.
22. **Drill 22**: Augment the `NodeJS.ProcessEnv` interface to enforce strict typing on `process.env.DATABASE_URL`.
23. **Drill 23**: Merge an `interface` with a `namespace` to add static factory functions to an interface.
24. **Drill 24**: Merge an `enum` with a `namespace` to attach validation helper methods to the enum.
25. **Drill 25**: Use `stripInternal: true` and tag a method with `@internal` to verify it is omitted from `.d.ts`.
26. **Drill 26**: Configure `emitDeclarationOnly: true` in conjunction with `esbuild` for high-speed builds.
27. **Drill 27**: Profile compilation times using `tsc --extendedDiagnostics`.
28. **Drill 28**: Debug file inclusion using `tsc --explainFiles`.
29. **Drill 29**: Configure `"moduleDetection": "force"` and verify that files without imports/exports are treated as modules.
30. **Drill 30**: Test `resolveJsonModule: true` by importing a JSON file and accessing typed fields.
31. **Drill 31**: Configure `"forceConsistentCasingInFileNames": true` and test case mismatch between imports and disk.
32. **Drill 32**: Implement `NoInfer<T>` to prevent unwanted widening of generic type arguments.
33. **Drill 33**: Set up path aliases with `"paths"` in `tsconfig.json` and configure `tsconfig-paths` for runtime execution.
34. **Drill 34**: Replace path aliases with native Node.js package subpath imports (`#subpath`).
35. **Drill 35**: Configure `"downlevelIteration": true` and test spreading a custom generator targeting ES5.
36. **Drill 36**: Enable `"useUnknownInCatchVariables": true` and practice narrowing `catch (err)` safely.
37. **Drill 37**: Configure `"noPropertyAccessFromIndexSignature": true` and practice bracket notation on dynamic maps.
38. **Drill 38**: Set up `"types": []` to prevent pollution of the global scope by ambient packages.
39. **Drill 39**: Configure `"outDir": "dist"` and `"rootDir": "src"` to prevent common directory shifting.
40. **Drill 40**: Set up a pre-commit hook using `husky` to run `tsc --noEmit` before any git commit.
41. **Drill 41**: Configure `sourceMap: true` and debug a compiled TypeScript application using VS Code launch configs.
42. **Drill 42**: Use `inlineSourceMap: true` to bundle sourcemaps directly into emitted files.
43. **Drill 43**: Configure `"allowJs": true` and `"checkJs": true` to type-check legacy JavaScript files via JSDoc.
44. **Drill 44**: Write JSDoc `@template` tags to add generics to plain `.js` files.
45. **Drill 45**: Write JSDoc `@satisfies` to validate object shapes without widening in JavaScript files.
46. **Drill 46**: Configure `"lib": ["ES2022", "DOM", "DOM.Iterable"]` for a modern browser application.
47. **Drill 47**: Configure `"lib": ["ES2022", "esnext.disposable"]` for explicit resource management (`using`).
48. **Drill 48**: Write a custom resource implementing `[Symbol.dispose]` and test `using res = createResource()`.
49. **Drill 49**: Configure Turborepo `turbo.json` with pipeline dependencies matching `tsc -b` references.
50. **Drill 50**: Use pnpm workspaces `"workspace:*"` protocol to link internal packages.
51. **Drill 51**: Publish an npm package with subpath exports: `@scope/sdk/auth` and `@scope/sdk/database`.
52. **Drill 52**: Implement the Singleton wrapper pattern to prevent the Dual-Package Hazard in hybrid CJS/ESM libs.
53. **Drill 53**: Use `tsc --watch` with project references to verify incremental rebuild speeds.
54. **Drill 54**: Configure `"noImplicitReturns": true` and identify functions missing return statements on edge branches.
55. **Drill 55**: Configure `"noFallthroughCasesInSwitch": true` and verify switch case fallthrough prevention.
56. **Drill 56**: Configure `"allowSyntheticDefaultImports": true` vs `"esModuleInterop": true` and compare emitted JS.
57. **Drill 57**: Create an `ambient.d.ts` file declaring image asset modules (`*.png`, `*.svg`).
58. **Drill 58**: Write an ambient declaration for CSS modules (`*.module.css`) typing exported classes as `Record<string, string>`.
59. **Drill 59**: Augment an external library's namespace (e.g. `fastify` or `express`) to attach session state.
60. **Drill 60**: Create a composite library with `"declarationDir": "types"` separate from `"outDir": "dist"`.
61. **Drill 61**: Test `preserveConstEnums: true` and examine the generated JavaScript runtime object.
62. **Drill 62**: Configure `"importHelpers": true` and verify that helpers are imported from `tslib`.
63. **Drill 63**: Use `tsc -p tsconfig.prod.json` to compile a production build excluding spec and test files.
64. **Drill 64**: Write a custom bash/powershell script to verify that all referenced project directories exist on disk.
65. **Drill 65**: Inspect `.tsbuildinfo` JSON data to observe file hashes and dependency timestamps.
66. **Drill 66**: Clean up project reference build artifacts using `tsc -b --clean`.
67. **Drill 67**: Configure `"customConditions": ["development"]` to resolve development builds in local environments.
68. **Drill 68**: Test `allowArbitraryExtensions: true` with a custom `.d.css.ts` declaration.
69. **Drill 69**: Use `isolatedModules: true` and re-export a type using `export type { T }` to avoid single-file transpiler errors.
70. **Drill 70**: Configure `"strictBindCallApply": true` and test calling a typed function with wrong argument types.
71. **Drill 71**: Configure `"strictFunctionTypes": true` and observe rejection of bivariant function assignment.
72. **Drill 72**: Configure `"strictPropertyInitialization": true` and observe rejection of uninitialized class fields.
73. **Drill 73**: Build a multi-package monorepo containing `core`, `models`, `ui`, and `web` from scratch.
74. **Drill 74**: Verify zero compilation errors across all packages using `tsc -b --verbose`.
75. **Drill 75**: Verify that all declaration maps resolve correctly in VS Code across packages.

---

### 7.2 Enterprise Best Practices & Architecture Checklist

1. **Always enable `strict: true`**: Non-negotiable foundation for all production TypeScript codebases.
2. **Adopt `noUncheckedIndexedAccess: true`**: Eliminates the #1 source of production `TypeError: Cannot read properties of undefined`.
3. **Adopt `exactOptionalPropertyTypes: true`**: Prevents subtle bugs caused by `Object.assign` and default parameters.
4. **Use Project References (`composite: true`) in monorepos**: Keeps build times linear and editor performance instant.
5. **Always generate Declaration Maps (`declarationMap: true`)**: Without them, monorepo navigation degrades into reading compiled `.d.ts` files.
6. **Order `"types"` first in `package.json` `"exports"`**: Prevents modern Node.js and bundlers from misresolving JavaScript files as types.
7. **Use `verbatimModuleSyntax: true`**: Guarantees zero runtime crashes caused by un-elided type imports in ESM.
8. **Adopt `isolatedDeclarations: true` for enterprise libraries**: Future-proofs your packages for multi-threaded Rust/Go compilers.
9. **Run `tsc --noEmit` in CI/CD**: Ensures 100% type safety before deploying code to production.
10. **Use `skipLibCheck: true`**: Accelerates CI build pipelines without compromising application-level type correctness.
