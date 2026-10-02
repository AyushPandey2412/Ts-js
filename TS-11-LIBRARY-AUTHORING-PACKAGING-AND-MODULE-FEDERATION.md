# Module TS-11: Library Authoring, Packaging & Module Federation

Welcome to TypeScript Library Authoring, Packaging, and Module Federation. This module teaches how to build, package, and publish production-grade TypeScript libraries, support dual CommonJS and ECMAScript Modules (ESM) without the Dual-Package Hazard, validate package exports with `attw` and `publint`, type Module Federation remotes, and automate releases with Changesets.

---

# Topic 1: Library Authoring Fundamentals: Clean Public API Surface and Internal Encapsulation

### 1. What is it?
**Library Authoring** is the discipline of creating reusable TypeScript code packages consumed by other developers. A **Public API Surface** is the exact set of functions, classes, interfaces, and types explicitly exported through entry points. All internal utilities, private helpers, and experimental features must be strictly encapsulated so consumers cannot accidentally depend on them.

### 2. Why does it exist?
If a library exposes internal helper functions (e.g. `import { _internalHash } from "my-lib/dist/utils/hash"`), consumers will inevitably start importing them. If you refactor that internal function in a patch release, consumers' applications will break. A clean public API contract guarantees that you can refactor internal implementations without breaking consumer code.

### 3. Basic example

```typescript
// src/internal/math-helpers.ts (Private internal code)
export function privateClamp(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, n));
}

// src/index.ts (Public API Entry Point)
import { privateClamp } from "./internal/math-helpers.js";

export interface RateLimiterOptions {
  maxRequests: number;
}

export class RateLimiter {
  private limit: number;

  constructor(options: RateLimiterOptions) {
    this.limit = privateClamp(options.maxRequests, 1, 1000);
  }

  isAllowed(currentCount: number): boolean {
    return currentCount < this.limit;
  }
}

// NOTE: Notice privateClamp is NOT re-exported in index.ts!
// Consumers can ONLY import RateLimiter and RateLimiterOptions!
```

**Line-by-line explanation:**
- `src/internal/math-helpers.ts`: Internal implementation detail.
- `src/index.ts`: The explicit public contract of the library.
- `export interface RateLimiterOptions`: Re-exports only the public option types consumers need for type checking.
- `export class RateLimiter`: The main public class.
- Because `privateClamp` is not exported from `index.ts`, it is not part of the library's public API.

---

### 4. How it works inside TypeScript
1. **Barrel Export Index**: The root `src/index.ts` serves as the single source of truth for public API declarations.
2. **Declaration Boundary**: When `tsc` or a bundler generates `.d.ts` files, consumers importing the library package only receive types exported by the main entry point.
3. **`export type` Syntax**: Use `export type { MyType }` for types so bundlers can eliminate unused imports during tree shaking.

---

### 5. More examples

#### Example 1: Explicit type-only re-exports
```typescript
// Better for tree-shaking and bundler performance:
export type { RateLimiterOptions } from "./limiter.js";
export { RateLimiter } from "./limiter.js";
```
Using `export type` guarantees that bundlers know the symbol has no runtime JavaScript code and will completely erase it.

#### Example 2: Subpath entry points for modular features
```typescript
// For large libraries, expose separate functional domains via separate entry points:
// "my-lib/validation" -> src/validation/index.ts
// "my-lib/crypto"     -> src/crypto/index.ts
```

---

### 6. Common mistakes

#### Mistake 1: Exporting internal types or classes with generic names
```typescript
// ANTI-PATTERN in index.ts:
export * from "./internal/helpers"; // Accidental leak of 20 internal helper utilities!
```
**Why it fails:** Using `export *` blindly re-exports everything in that directory, polluting autocomplete menus in users' IDEs and leaking private APIs into SemVer guarantees.

#### Mistake 2: Missing types for parameters used in public methods
```typescript
// WRONG:
class Service {
  configure(config: InternalConfig) {} // InternalConfig is NOT exported from index.ts!
}
```
**Why it fails:** If a consumer needs to declare a variable holding `config`, they cannot import `InternalConfig`, causing TypeScript errors. If a type appears in a public function signature, that type **must** be exported.

---

### 7. Rules to remember
1. `src/index.ts` is the single source of truth for your library's public API.
2. Never use `export * from "./internal"`. Explicitly list public exports.
3. Every type used in public function arguments or return values must be exported.
4. Use `export type { ... }` for type-only exports to aid consumer tree-shaking.

---

### Think first: Prediction puzzle
If `type Token = string;` is used in `export function setToken(t: Token): void`, but `Token` is not exported from `index.ts`, can a consumer still call `setToken("abc")`?

---

**Answer:**
```
Yes.
```
**Explanation:** Because TypeScript uses structural subtyping, passing the literal `"abc"` satisfies `Token` (which is an alias for `string`). However, the consumer cannot explicitly type their own helper functions with `let t: Token`.

---

### Practice exercises

#### Exercise 1: Clean barrel export
- **Task**: Write an `index.ts` exporting class `Client` and type `ClientOptions` using explicit named exports.
- **Hint 1**: `export { Client } from "./client.js"; export type { ClientOptions } from "./client.js";`.

#### Exercise 2: Prevent internal leak
- **Task**: Refactor a file using `export * from "./utils"` to only re-export `formatDate`.
- **Hint 1**: `export { formatDate } from "./utils.js";`.

#### Exercise 3: Isolate experimental feature
- **Task**: Place experimental utilities in a separate entry point `src/experimental/index.ts` instead of `src/index.ts`.
- **Hint 1**: Export from dedicated subpath.

#### Exercise 4: Ensure public return type is exported
- **Task**: In `export function getResult(): ExecutionResult`, export `interface ExecutionResult`.
- **Hint 1**: Add `export interface ExecutionResult { ... }`.

---

### Exercise solutions

#### Solution 1: Clean barrel export
```typescript
export { HttpClient } from "./client.js";
export type { HttpClientOptions } from "./types.js";
```

#### Solution 2: Prevent internal leak
```typescript
export { formatDate } from "./utils.js";
```

#### Solution 3: Isolate experimental feature
```typescript
// src/experimental/index.ts
export { ExperimentalCacheEngine } from "./cache.js";
```

#### Solution 4: Ensure public return type is exported
```typescript
export interface ExecutionResult {
  success: boolean;
  durationMs: number;
}

export function executeTask(): ExecutionResult {
  return { success: true, durationMs: 12 };
}
```

---

### Recall
1. What is the single source of truth for a library's public API? The root entry point (`src/index.ts`).
2. Why is `export *` dangerous in library entry points? It leaks internal implementation details that become accidental SemVer commitments.
3. Why should `export type` be preferred for interfaces? It signals to bundlers that the symbol has no runtime JavaScript code, improving tree shaking.

> **If you remember only one thing:**  
> Explicitly curate your library's public API surface in `index.ts` and encapsulate all internal utilities to prevent breaking consumer code during refactors.

---

# Topic 2: Dual CommonJS & ESM Packaging: The Modern Dual-Package Architecture

### 1. What is it?
**Dual Packaging** is the architecture of publishing a TypeScript library that can be consumed seamlessly by both **CommonJS** (`require()`) and **ECMAScript Modules** (`import`):
- Modern bundlers and Node.js ESM load the `.mjs` or ESM build.
- Legacy Node.js applications load the `.cjs` or CommonJS build.
- Both formats ship with matching `.d.ts` declaration files.

### 2. Why does it exist?
While modern frontend frameworks and modern Node.js versions use ESM, millions of enterprise production servers, test runners (like older Jest), and scripts still run on CommonJS. Publishing only ESM breaks CommonJS users; publishing only CJS prevents modern bundlers from performing tree shaking. A dual package supports both ecosystems.

### 3. Basic example

```
dist/
├── index.js         (ESM format: export { ... })
├── index.d.ts       (ESM types)
├── index.cjs        (CommonJS format: module.exports = { ... })
└── index.d.cts      (CommonJS types)
```

```json
// package.json (Modern Dual-Package Specification)
{
  "name": "my-dual-library",
  "version": "1.0.0",
  "type": "module",
  "main": "./dist/index.cjs",
  "module": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "exports": {
    ".": {
      "types": {
        "import": "./dist/index.d.ts",
        "require": "./dist/index.d.cts"
      },
      "import": "./dist/index.js",
      "require": "./dist/index.cjs"
    }
  },
  "files": ["dist"]
}
```

**Line-by-line explanation:**
- `"type": "module"`: Declares that `.js` files are treated as ESM by default.
- `"main": "./dist/index.cjs"`: Legacy fallback for tools that do not support `"exports"`.
- `"module": "./dist/index.js"`: Legacy bundler fallback (Webpack 4 / Rollup).
- `"exports"`: The modern standard.
  - When imported via `import "my-dual-library"`, Node.js loads `./dist/index.js` and TypeScript loads `./dist/index.d.ts`.
  - When imported via `require("my-dual-library")`, Node.js loads `./dist/index.cjs` and TypeScript loads `./dist/index.d.cts`.

---

### 4. How it works inside TypeScript
1. **Extension Suffix Pairing**:
   - `.js` pairs with `.d.ts` (ESM).
   - `.cjs` pairs with `.d.cts` (CommonJS).
2. **`types` Condition Placement**: Inside `"exports"`, the `"types"` key **must** come before `"import"` and `"require"`.
3. **TypeScript Module Resolution**: TypeScript under `NodeNext` reads `"require"` or `"import"` matching how the user's file is configured.

---

### 5. More examples

#### Example 1: Compiling dual CJS and ESM with `tsup`
```bash
# In package.json scripts:
# tsup compiles src/index.ts into both ESM and CJS with full .d.ts files in one command!
npx tsup src/index.ts --format esm,cjs --dts
```

---

### 6. Common mistakes

#### Mistake 1: Placing `"types"` after `"import"` or `"require"`
```json
// WRONG in package.json:
{
  "exports": {
    ".": {
      "import": "./dist/index.js",
      "require": "./dist/index.cjs",
      "types": "./dist/index.d.ts" // NEVER REACHED in some TypeScript resolvers!
    }
  }
}
```
**Why it fails:** Export condition order matters! The first matching condition wins. Always list `"types"` first.

#### Mistake 2: Missing `.d.cts` for CommonJS consumers
```json
// WRONG: Pointing CommonJS types to an ESM .d.ts file
"require": {
  "types": "./dist/index.d.ts", // Incompatible with CommonJS require() under NodeNext!
  "default": "./dist/index.cjs"
}
```
**Why it fails:** Under `NodeNext`, a CommonJS file importing a `.d.ts` that contains `export default` will encounter import mismatches. CommonJS declarations must be `.d.cts`.

---

### 7. Rules to remember
1. Always list `"types"` as the first condition inside `"exports"`.
2. Pair `.js` with `.d.ts` (ESM) and `.cjs` with `.d.cts` (CommonJS).
3. Keep `"main"` and `"types"` at the root of `package.json` for legacy tool compatibility.
4. Use modern bundlers (`tsup`, `unbuild`) to generate dual builds automatically.

---

### Think first: Prediction puzzle
What file does `const lib = require("my-dual-library");` load in Node.js when configured with the example above?

---

**Answer:**
```
./dist/index.cjs
```
**Explanation:** Because `require()` matches the `"require"` condition in `"exports"`, Node.js routes execution to `./dist/index.cjs`.

---

### Practice exercises

#### Exercise 1: Dual package.json exports mapping
- **Task**: Write the `"exports"` block supporting both ESM and CommonJS with corresponding types for `"."`.
- **Hint 1**: Include `types`, `import`, and `require`.

#### Exercise 2: tsup dual build script
- **Task**: Write a package.json `build` script using `tsup` to generate dual ESM/CJS output with declarations.
- **Hint 1**: `tsup src/index.ts --format cjs,esm --dts`.

#### Exercise 3: Explain the `.d.cts` extension
- **Task**: Explain why `.d.cts` is required alongside `.cjs`.
- **Hint 1**: TypeScript recognizes `.d.cts` as a CommonJS declaration file under `NodeNext`.

#### Exercise 4: Legacy fallback fields
- **Task**: Write the `"main"` and `"types"` root fields for backwards compatibility with Node 12.
- **Hint 1**: `"main": "./dist/index.cjs"`, `"types": "./dist/index.d.ts"`.

---

### Exercise solutions

#### Solution 1: Dual package.json exports mapping
```json
{
  "exports": {
    ".": {
      "types": {
        "import": "./dist/index.d.ts",
        "require": "./dist/index.d.cts"
      },
      "import": "./dist/index.js",
      "require": "./dist/index.cjs"
    }
  }
}
```

#### Solution 2: tsup dual build script
```json
{
  "scripts": {
    "build": "tsup src/index.ts --format cjs,esm --dts --clean"
  }
}
```

#### Solution 3: Explain the `.d.cts` extension
Under `moduleResolution: "NodeNext"`, TypeScript treats `.cjs` files as CommonJS modules. If the type definition is named `.d.ts`, the compiler assumes ESM type semantics. Naming it `.d.cts` explicitly marks it as CommonJS declarations.

#### Solution 4: Legacy fallback fields
```json
{
  "main": "./dist/index.cjs",
  "module": "./dist/index.js",
  "types": "./dist/index.d.ts"
}
```

---

### Recall
1. Why is dual packaging necessary? To support both modern ESM environments (with tree shaking) and legacy CommonJS systems (`require()`).
2. Where must the `"types"` key be positioned within an `"exports"` block? At the very top (first key).
3. What is the declaration file extension for CommonJS output? `.d.cts`.

> **If you remember only one thing:**  
> Dual packaging provides `.js`/`.d.ts` for ESM and `.cjs`/`.d.cts` for CommonJS, with `"types"` always listed first in `package.json` `"exports"`.

---

# Topic 3: The `package.json` Standard: `exports`, `imports`, `types`, and Condition Ordering

### 1. What is it?
The **`package.json`** file is the manifest defining a library package. In modern packaging, the **`"exports"`** field replaces `"main"` as the primary encapsulation boundary, while the **`"imports"`** field defines internal subpath aliases starting with `#`.

### 2. Why does it exist?
Legacy `package.json` configurations allowed consumers to bypass entry points and import deep internal files (`import "pkg/dist/internals/secret.js"`). The modern `"exports"` map strictly forbids unauthorized deep imports, creating a secure encapsulation boundary around your library package.

### 3. Basic example

```json
{
  "name": "enterprise-toolkit",
  "version": "2.0.0",
  "type": "module",
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "import": "./dist/index.js"
    },
    "./security": {
      "types": "./dist/security/index.d.ts",
      "import": "./dist/security/index.js"
    },
    "./package.json": "./package.json"
  }
}
```

**Consumer Usage:**
```typescript
// 1. Root import: Allowed
import { Toolkit } from "enterprise-toolkit";

// 2. Subpath import: Allowed
import { encrypt } from "enterprise-toolkit/security";

// 3. Unauthorized deep import: COMPILE ERROR!
// import { privateHash } from "enterprise-toolkit/dist/security/hash.js";
// Error: Package subpath './dist/security/hash.js' is not defined by "exports"
```

**Line-by-line explanation:**
- `"."`: Maps the root package name (`"enterprise-toolkit"`).
- `"./security"`: Maps the explicit subpath `"enterprise-toolkit/security"`.
- `"./package.json": "./package.json"`: Explicitly exports `package.json` so build tools can read the package version.
- Any file not listed in `"exports"` is completely blocked from consumer imports.

---

### 4. How it works inside TypeScript
1. **Export Conditions Order**: Node.js and TypeScript evaluate conditions sequentially:
   - `types`: Evaluated by TypeScript.
   - `import`: Evaluated when imported via `import`.
   - `require`: Evaluated when imported via `require()`.
   - `default`: Generic catch-all fallback.
2. **Wildcard Patterns**: `"./features/*": "./dist/features/*.js"` matches arbitrary subpaths under `features/`.

---

### 5. More examples

#### Example 1: Conditional exports for Browser vs Node.js
```json
{
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "browser": "./dist/browser.js",
      "node": "./dist/node.js",
      "default": "./dist/index.js"
    }
  }
}
```
When bundled by Vite/Webpack for the browser, `./dist/browser.js` is loaded; when running in Node.js, `./dist/node.js` is loaded.

---

### 6. Common mistakes

#### Mistake 1: Forgetting to export `./package.json`
```json
// GOTCHA: Omitting ./package.json
// Tools like Next.js or React Native that read pkg/package.json will throw:
// Error: Package subpath './package.json' is not defined by "exports"
```
**Why it matters:** Always add `"./package.json": "./package.json"` to your `"exports"` map.

#### Mistake 2: Missing leading `./` in export keys
```json
// WRONG:
{
  "exports": {
    "security": "./dist/security.js" // Error: Must start with './'!
  }
}
```
**Why it fails:** All subpath keys in `"exports"` MUST start with `./` (e.g. `"./security"`).

---

### 7. Rules to remember
1. All subpath keys in `"exports"` must begin with `./`.
2. Always list `"types"` before runtime conditions (`"import"`, `"require"`, `"default"`).
3. Explicitly export `"./package.json": "./package.json"`.
4. Any path not listed in `"exports"` is strictly private.

---

### Think first: Prediction puzzle
Can a user import `my-pkg/utils` if `package.json` defines `"exports": { ".": "./dist/index.js" }`?

---

**Answer:**
```
No, it fails with a module not found error.
```
**Explanation:** The `"exports"` field encapsulates the package. Because `"./utils"` is not mapped in `"exports"`, external imports are blocked.

---

### Practice exercises

#### Exercise 1: Multi-subpath export mapping
- **Task**: Configure `"exports"` for `"."` and `"./helpers"` with types and ESM files.
- **Hint 1**: Define keys `"."` and `"./helpers"`.

#### Exercise 2: Add package.json self-export
- **Task**: Add the export line allowing build tools to read `./package.json`.
- **Hint 1**: `"./package.json": "./package.json"`.

#### Exercise 3: Wildcard subpath export
- **Task**: Map `./components/*` to `./dist/components/*.js` with types `./dist/components/*.d.ts`.
- **Hint 1**: Use `*` wildcard in both key and value.

#### Exercise 4: Browser conditional export
- **Task**: Configure an export that loads `./dist/web.js` in browsers and `./dist/server.js` in Node.js.
- **Hint 1**: Conditions: `"browser"` and `"node"`.

---

### Exercise solutions

#### Solution 1: Multi-subpath export mapping
```json
{
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "import": "./dist/index.js"
    },
    "./helpers": {
      "types": "./dist/helpers.d.ts",
      "import": "./dist/helpers.js"
    },
    "./package.json": "./package.json"
  }
}
```

#### Solution 2: Add package.json self-export
```json
{
  "exports": {
    "./package.json": "./package.json"
  }
}
```

#### Solution 3: Wildcard subpath export
```json
{
  "exports": {
    "./components/*": {
      "types": "./dist/components/*.d.ts",
      "import": "./dist/components/*.js"
    }
  }
}
```

#### Solution 4: Browser conditional export
```json
{
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "browser": "./dist/web.js",
      "node": "./dist/server.js",
      "default": "./dist/server.js"
    }
  }
}
```

---

### Recall
1. What does the `"exports"` field do to files not explicitly listed? Blocks them from external consumer access.
2. What character must all subpath keys start with? `./`.
3. Why should `"./package.json"` be exported? To allow tooling and bundlers to inspect package metadata.

> **If you remember only one thing:**  
> The `"exports"` field forms a strict encapsulation boundary where only explicitly mapped subpaths can be imported by consumers.

---

# Topic 4: Modern Zero-Config Bundlers: Building with `tsup` and `unbuild`

### 1. What is it?
Modern TypeScript library bundlers—specifically **`tsup`** (powered by esbuild) and **`unbuild`** (powered by Rollup & jiti)—are purpose-built build tools for library authors. They produce dual ESM/CJS bundles, roll up `.d.ts` declaration files, and clean output directories with minimal configuration.

### 2. Why does it exist?
Configuring raw Webpack or Rollup for a TypeScript library requires writing 100 lines of plugins, loaders, and declaration rollups. `tsup` does all of this in a single CLI command with sub-second build times.

### 3. Basic example

```typescript
// tsup.config.ts (Configuration file for tsup)
import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts", "src/security/index.ts"],
  format: ["esm", "cjs"],
  dts: true,              // Generates .d.ts and .d.cts declaration rollups!
  splitting: false,       // Avoids unnecessary chunks in libraries
  sourcemap: true,
  clean: true,            // Wipes dist/ before each build
  treeshake: true,
  minify: false,          // Keep libraries readable for debugging
});
```

**Run Build via CLI:**
```bash
npx tsup
```

**Emitted output in `dist/`:**
```
dist/
├── index.js          (ESM output)
├── index.cjs         (CJS output)
├── index.d.ts        (Rolled-up ESM declarations)
├── index.d.cts       (Rolled-up CJS declarations)
├── security/index.js
├── security/index.cjs
└── security/index.d.ts
```

---

### 4. How it works inside TypeScript
1. **esbuild Speed**: `tsup` uses `esbuild` for transpilation, compiling thousands of lines of TypeScript in less than 50 milliseconds.
2. **Declaration Rollup**: Because `esbuild` cannot generate `.d.ts` files, `tsup` runs an isolated TypeScript worker using `rollup-plugin-dts` to bundle all declarations into a single, clean `.d.ts` file per entry point.
3. **No Intermediate Files**: Consumers don't get 50 separate small `.d.ts` files; they get a single cohesive `index.d.ts`.

---

### 5. More examples

#### Example 1: Injecting shims for CJS/ESM compatibility
```typescript
export default defineConfig({
  entry: ["src/index.ts"],
  format: ["esm", "cjs"],
  shims: true, // Polyfills import.meta.url in CJS and __dirname in ESM automatically!
});
```

---

### 6. Common mistakes

#### Mistake 1: Enabling minification on published library code
```typescript
// AVOID:
export default defineConfig({
  minify: true // Makes debugging stack traces impossible for library users!
});
```
**Why it matters:** End-user applications (like Next.js or Vite) already minify their final bundles. Minifying your library makes it impossible for consumers to read stack traces when debugging your library.

#### Mistake 2: Missing `clean: true`
```typescript
// GOTCHA: Omitting clean
// Old renamed files stay in dist/ and get accidentally published to npm!
```
**Why it matters:** Always set `clean: true` so stale output is wiped before building.

---

### 7. Rules to remember
1. Use `tsup` or `unbuild` for zero-boilerplate library builds.
2. Enable `dts: true` to generate rolled-up declaration files.
3. Enable `clean: true` to prevent publishing stale artifacts.
4. Set `shims: true` if you use `__dirname` or `import.meta.url`.

---

### Think first: Prediction puzzle
Does `tsup` use the official TypeScript compiler (`tsc`) to transpile JavaScript code?

---

**Answer:**
```
No, it uses esbuild.
```
**Explanation:** `tsup` uses `esbuild` for ultra-fast JavaScript code generation, using TypeScript only to generate the declaration (`.d.ts`) files.

---

### Practice exercises

#### Exercise 1: Basic tsup config
- **Task**: Write a `tsup.config.ts` targeting `src/index.ts` with `esm` and `cjs` formats and declarations.
- **Hint 1**: `entry: ["src/index.ts"]`, `format: ["esm", "cjs"]`, `dts: true`.

#### Exercise 2: CLI build script
- **Task**: Write the `package.json` script to run `tsup` in watch mode during development.
- **Hint 1**: `"dev": "tsup --watch"`.

#### Exercise 3: Enable shims
- **Task**: Configure `tsup` to polyfill `__dirname` and `import.meta.url`.
- **Hint 1**: Set `shims: true`.

#### Exercise 4: Multi-entry configuration
- **Task**: Configure `tsup` to build both `src/index.ts` and `src/cli.ts`.
- **Hint 1**: `entry: ["src/index.ts", "src/cli.ts"]`.

---

### Exercise solutions

#### Solution 1: Basic tsup config
```typescript
import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts"],
  format: ["esm", "cjs"],
  dts: true,
  clean: true,
});
```

#### Solution 2: CLI build script
```json
{
  "scripts": {
    "dev": "tsup --watch",
    "build": "tsup"
  }
}
```

#### Solution 3: Enable shims
```typescript
import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts"],
  shims: true,
});
```

#### Solution 4: Multi-entry configuration
```typescript
import { defineConfig } from "tsup";

export default defineConfig({
  entry: {
    index: "src/index.ts",
    cli: "src/cli.ts",
  },
  format: ["esm"],
  dts: true,
});
```

---

### Recall
1. What engine powers `tsup`'s fast transpilation? `esbuild`.
2. What option in `tsup` generates `.d.ts` declaration files? `dts: true`.
3. Why should libraries generally avoid minification? Because consuming applications minify final bundles; unminified library code preserves readable stack traces.

> **If you remember only one thing:**  
> `tsup` builds dual ESM/CJS packages and rolls up `.d.ts` declaration files in milliseconds with zero complex Webpack boilerplate.

---

# Topic 5: Declaration Packaging: Bundled `.d.ts` Rollups, Declaration Maps, and Sourcemaps

### 1. What is it?
When building a library with 30 source files, standard `tsc` emits 30 individual `.d.ts` files reflecting the internal folder structure (`dist/utils/calc.d.ts`, `dist/models/user.d.ts`). **Declaration Rollup** is the process of bundling all those individual declaration files into a single clean `dist/index.d.ts` file, while **Declaration Maps** (`.d.ts.map`) maintain IDE "Go to Definition" navigation back to original `.ts` source files.

### 2. Why does it exist?
Shipping hundreds of tiny `.d.ts` files slows down the TypeScript Language Server in consumers' IDEs, exposes internal folder layouts, and risks broken relative type references. A single rolled-up `.d.ts` file loads faster and presents a clean, consolidated API.

### 3. Basic example

**Without Rollup (Messy `tsc` output):**
```
dist/
├── index.d.ts
├── utils/
│   ├── format.d.ts
│   └── math.d.ts
└── models/
    ├── user.d.ts
    └── account.d.ts
```

**With Declaration Rollup (`tsup --dts` or API Extractor):**
```
dist/
├── index.js
├── index.d.ts        (Single unified declaration file containing all public types!)
└── index.d.ts.map    (Declaration sourcemap)
```

**Inside `dist/index.d.ts`:**
```typescript
// Bundled declarations with internal types inlined or scoped cleanly:
interface UserDTO {
  id: string;
  name: string;
}

declare class UserManager {
  getUser(id: string): UserDTO;
}

export { UserDTO, UserManager };
//# sourceMappingURL=index.d.ts.map
```

---

### 4. How it works inside TypeScript
1. **Declaration Tree Walking**: Tools like `rollup-plugin-dts` or Microsoft's `API Extractor` parse all emitted `.d.ts` files starting from `index.d.ts`.
2. **Inlining & Renaming**: Unexported helper interfaces are either omitted or inlined with unique names to prevent namespace collisions.
3. **Sourcemap Mapping**: The declaration map links each line in `dist/index.d.ts` to the original character position in `src/models/user.ts`.

---

### 5. More examples

#### Example 1: Microsoft API Extractor for Enterprise Libraries
```json
// api-extractor.json
{
  "$schema": "https://developer.microsoft.com/json-schemas/api-extractor/v7/api-extractor.schema.json",
  "mainEntryPointFilePath": "<projectFolder>/dist/types/index.d.ts",
  "dtsRollup": {
    "enabled": true,
    "untrimmedFilePath": "<projectFolder>/dist/index.d.ts"
  }
}
```
API Extractor also detects accidental API leaks, enforces doc comment standards, and produces API report diffs for pull requests.

---

### 6. Common mistakes

#### Mistake 1: Missing `.d.ts.map` files when bundling declarations
```bash
# If declaration maps are omitted:
# Consumers clicking "Go to Definition" on your functions get stuck in 'dist/index.d.ts'
# instead of jumping to the real source code!
```
**Why it matters:** Always generate declaration maps so consumers can view implementation comments and real source logic.

#### Mistake 2: Name collisions in bundled declarations
```typescript
// If fileA and fileB both declare internal 'interface Options', a naive rollup tool can collide!
// Professional tools (tsup, API Extractor) automatically rename internal clashes to Options_1.
```

---

### 7. Rules to remember
1. Bundle declarations into a single `dist/index.d.ts` for faster IDE resolution and cleaner distribution.
2. Always ship `.d.ts.map` declaration maps alongside `.d.ts` files.
3. Use `tsup --dts` or `API Extractor` to generate declaration rollups.
4. Ensure internal unexported interfaces don't collide during bundling.

---

### Think first: Prediction puzzle
Does bundling declaration files change the runtime behavior of the library?

---

**Answer:**
```
No.
```
**Explanation:** Declaration files (`.d.ts`) contain zero runtime code. They only affect compile-time type checking and IDE autocomplete.

---

### Practice exercises

#### Exercise 1: Enable declaration rollup in tsup
- **Task**: Configure `tsup` to roll up declarations and output sourcemaps.
- **Hint 1**: `dts: true`, `sourcemap: true`.

#### Exercise 2: Inspect declaration sourcemap
- **Task**: State what URL directive is placed at the bottom of `dist/index.d.ts`.
- **Hint 1**: `//# sourceMappingURL=index.d.ts.map`.

#### Exercise 3: Explain API Extractor benefits
- **Task**: List two benefits of using Microsoft API Extractor over simple declaration emission.
- **Hint 1**: Generates API review reports and rolls up declarations cleanly.

#### Exercise 4: Clean distribution folder
- **Task**: Explain why a single `index.d.ts` loads faster in VS Code than 50 separate `.d.ts` files.
- **Hint 1**: Reduces filesystem I/O operations by the Language Server.

---

### Exercise solutions

#### Solution 1: Enable declaration rollup in tsup
```typescript
import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts"],
  dts: true,
  sourcemap: true,
});
```

#### Solution 2: Inspect declaration sourcemap
The directive is:
```typescript
//# sourceMappingURL=index.d.ts.map
```

#### Solution 3: Explain API Extractor benefits
1. Detects accidental leaks of internal types in public APIs.
2. Creates markdown API reports (`api-report.md`) to catch accidental breaking changes in pull requests.

#### Solution 4: Clean distribution folder
A single rolled-up declaration file allows the TypeScript Language Server to read all types in a single sequential disk read, avoiding dozens of disk lookups across nested folders.

---

### Recall
1. What is Declaration Rollup? Bundling multiple `.d.ts` files into a single unified `index.d.ts` file.
2. What file enables "Go to Definition" to jump from `.d.ts` to `.ts` source files? The declaration map (`.d.ts.map`).
3. Which tool from Microsoft provides enterprise-grade declaration rollups and API reviews? API Extractor.

> **If you remember only one thing:**  
> Bundle declarations into a single `index.d.ts` with `.d.ts.map` declaration maps for fast IDE performance and seamless source navigation.

---

# Checkpoint Challenge 1: Dual Packaging & API Design (Topics 1-5)

### Challenge Specification
Construct a production Dual-Package Library Setup:
1. Design a clean `src/index.ts` public API surface with explicit `export type` usage.
2. Configure `tsup.config.ts` for dual ESM/CJS generation with rolled-up declarations.
3. Write a production `package.json` with `"type": "module"`, `"exports"` condition order, and legacy fallbacks.
4. Verify that internal helper files are encapsulated and not reachable from consumers.

### Solution

```typescript
// 1. src/index.ts (Curated Public API Surface)
export interface CachePolicy {
  ttlMs: number;
  maxEntries: number;
}

export class MemoryCache<T> {
  private store = new Map<string, { value: T; expiresAt: number }>();

  constructor(private policy: CachePolicy) {}

  set(key: string, value: T): void {
    this.store.set(key, {
      value,
      expiresAt: Date.now() + this.policy.ttlMs,
    });
  }

  get(key: string): T | null {
    const entry = this.store.get(key);
    if (!entry || entry.expiresAt < Date.now()) {
      this.store.delete(key);
      return null;
    }
    return entry.value;
  }
}

// Explicit type export
export type { CachePolicy as ICachePolicy };
```

```typescript
// 2. tsup.config.ts (Dual Packaging Build Configuration)
import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts"],
  format: ["esm", "cjs"],
  dts: true,
  sourcemap: true,
  clean: true,
  shims: true,
  treeshake: true,
});
```

```json
// 3. package.json (Production Dual-Package Manifest)
{
  "name": "@enterprise/cache-core",
  "version": "1.0.0",
  "type": "module",
  "main": "./dist/index.cjs",
  "module": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "exports": {
    ".": {
      "types": {
        "import": "./dist/index.d.ts",
        "require": "./dist/index.d.cts"
      },
      "import": "./dist/index.js",
      "require": "./dist/index.cjs"
    },
    "./package.json": "./package.json"
  },
  "files": ["dist"],
  "scripts": {
    "build": "tsup"
  }
}
```

```bash
# 4. Build Execution & Verification
npx tsup
# Emits dist/index.js, dist/index.cjs, dist/index.d.ts, dist/index.d.cts
```


---

# Topic 6: The Dual-Package Hazard (DPH): Symbol Identity & State Duplication

### 1. What is it?
The **Dual-Package Hazard (DPH)** occurs when an application or its dependencies accidentally load **both** the CommonJS version AND the ESM version of the same library at runtime in the same process:
- Package A imports `my-lib` via ESM (`import`).
- Package B imports `my-lib` via CommonJS (`require()`).
Node.js treats `dist/index.js` and `dist/index.cjs` as two completely separate modules, instantiating two independent copies of the code and memory state!

### 2. Why does it exist?
Because JavaScript modules in Node.js are cached by their absolute filesystem URL or path. Since `./dist/index.js` and `./dist/index.cjs` are different files on disk, Node.js evaluates both files independently.

### 3. Basic example

```typescript
// Problem Demonstration: Duplicate Singletons & Broken instanceof
// If my-lib exports a class:
export class Registry {
  static instances: string[] = [];
  static register(name: string) { this.instances.push(name); }
}

// In Consumer App:
// file1.mjs:
import { Registry as EsmRegistry } from "my-lib";
EsmRegistry.register("client_A");

// file2.cjs:
const { Registry: CjsRegistry } = require("my-lib");
console.log(CjsRegistry.instances); // [] - EMPTY!
// Catastrophic Bug: CjsRegistry has its own isolated static array!
// EsmRegistry !== CjsRegistry
// new EsmRegistry() instanceof CjsRegistry === FALSE!
```

---

### 4. How it works inside TypeScript
1. **Broken `instanceof`**: If an error class `class CustomError extends Error` is instantiated by the CJS bundle, an ESM `catch (err)` block checking `if (err instanceof CustomError)` will evaluate to `false`.
2. **State Duplication**: Any module-level variables (connection pools, cache dictionaries, counters) exist in duplicate.
3. **The Solution (CJS Wrapper Pattern)**: To eliminate the hazard, compile the core logic into CommonJS **only**, and have the ESM entry point act as a thin wrapper that re-exports the CommonJS instance!

```javascript
// dist/index.cjs (Holds the actual implementation and single state)
class Registry {
  static instances = [];
}
module.exports = { Registry };

// dist/index.js (Thin ESM wrapper delegating to the SAME CJS file!)
import cjs from "./index.cjs";
export const Registry = cjs.Registry;
```
Now, whether imported via `import` or `require()`, both point to the identical heap memory references in `index.cjs`!

---

### 5. More examples

#### Example 1: Global Symbol sharing for cross-package singletons
```typescript
// If dual builds must exist independently, store singletons on globalThis using Symbol.for:
const REGISTRY_KEY = Symbol.for("@myorg/library.registry.state");

export class SafeRegistry {
  private static get store(): string[] {
    const g = globalThis as any;
    return (g[REGISTRY_KEY] ??= []);
  }

  static add(item: string) {
    this.store.push(item);
  }
}
```
Because `Symbol.for` shares a global string registry across the entire process, both the ESM and CJS copies share the exact same state array!

---

### 6. Common mistakes

#### Mistake 1: Publishing completely independent stateful bundles
```typescript
// FATAL MISTAKE:
// Bundling dist/index.js and dist/index.cjs independently with local state
let activeConnections = 0; // Will be duplicated in memory if dual-loaded!
```
**Why it fails:** If a consumer's dependency tree contains both ESM and CJS consumers, two connection pools will open, exhausting database sockets.

#### Mistake 2: Assuming `Symbol()` is globally unique
```typescript
const KEY = Symbol("my.key"); // NOT shared across dual bundles!
```
**Why it fails:** Standard `Symbol("key")` generates a unique memory identity on every execution. Use `Symbol.for("my.key")` to look up or create in the global runtime symbol registry.

---

### 7. Rules to remember
1. The Dual-Package Hazard occurs when both CJS and ESM versions of a library are loaded into the same process.
2. It breaks `instanceof` checks and duplicates module-level state.
3. Use the CJS wrapper pattern or `Symbol.for` on `globalThis` to preserve singleton identity.
4. Stateless pure-function utility libraries (like lodash) are immune to state duplication, but still susceptible to `instanceof` mismatches.

---

### Think first: Prediction puzzle
Does `Symbol("token") === Symbol("token")` evaluate to `true` across two different evaluated modules?

---

**Answer:**
```
false
```
**Explanation:** `Symbol("token")` creates a unique symbol every time it is called. Only `Symbol.for("token")` checks and reuses the global registry.

---

### Practice exercises

#### Exercise 1: Implement global shared state
- **Task**: Write a class `Counter` that stores its `count` on `globalThis` using `Symbol.for`.
- **Hint 1**: `const KEY = Symbol.for("app.counter");`.

#### Exercise 2: CJS wrapper for ESM
- **Task**: Write an ESM wrapper file that imports a CJS module and re-exports its `Client` class.
- **Hint 1**: `import cjs from "./index.cjs"; export const Client = cjs.Client;`.

#### Exercise 3: Explain broken `instanceof`
- **Task**: Explain why `instanceof` evaluates to false when a class is loaded from both `.js` and `.cjs`.
- **Hint 1**: Prototype identity is based on constructor function reference equality.

#### Exercise 4: Detect dual package hazard warning
- **Task**: Name the CLI tool that detects Dual-Package Hazard risks in published packages.
- **Hint 1**: `publint` or `attw`.

---

### Exercise solutions

#### Solution 1: Implement global shared state
```typescript
const COUNTER_KEY = Symbol.for("@lib/counter.state");

export class SharedCounter {
  private static get state(): { count: number } {
    const g = globalThis as any;
    return (g[COUNTER_KEY] ??= { count: 0 });
  }

  static increment(): number {
    return ++this.state.count;
  }
}
```

#### Solution 2: CJS wrapper for ESM
```javascript
import cjs from "./index.cjs";

export const Client = cjs.Client;
export default cjs;
```

#### Solution 3: Explain broken `instanceof`
`instanceof` checks if the prototype of the constructor exists anywhere in the object's prototype chain. Because Node.js creates two separate constructor functions with different prototypes for `index.js` and `index.cjs`, an instance of one does not match the prototype of the other.

#### Solution 4: Detect dual package hazard warning
The tools are `publint` and `@arethetypeswrong/cli` (`attw`).

---

### Recall
1. What causes the Dual-Package Hazard? Loading both the ESM and CJS bundles of a package in the same Node.js process.
2. What happens to `instanceof` checks under the Dual-Package Hazard? They fail because the two bundles create different constructor function references.
3. How can you share state across dual bundles safely? By storing state on `globalThis` using `Symbol.for()`.

> **If you remember only one thing:**  
> The Dual-Package Hazard duplicates state and breaks `instanceof`; use `Symbol.for` or the CJS wrapper pattern to ensure singleton identity.

---

# Topic 7: Packaging Validation Tooling: `publint` and `@arethetypeswrong/cli` (`attw`)

### 1. What is it?
**`publint`** and **`@arethetypeswrong/cli` (`attw`)** are automated CLI validation tools that analyze your built npm package before publication to detect broken `package.json` configurations, missing types, invalid condition orders, and Dual-Package Hazards.

### 2. Why does it exist?
Configuring `package.json` `"exports"` correctly across all combinations of TypeScript versions, Node.js ESM/CJS modes, and bundlers is notoriously difficult. A package that works on your machine can easily fail for consumers. `attw` tests your package against all 6 major TypeScript module resolution modes automatically.

### 3. Basic example

```bash
# 1. Run publint to verify package.json exports syntax and file presence
npx publint

# 2. Run Are The Types Wrong (attw) to test all TS resolution modes
npx @arethetypeswrong/cli --pack .
```

**Sample `attw` Output Matrix:**
```
┌───────────────────┬──────────────┬────────────────┬────────────────┐
│ Entrypoint        │ node10       │ node16 (ESM)   │ node16 (CJS)   │
├───────────────────┼──────────────┼────────────────┼────────────────┤
│ . (import)        │ 🟢 (resolved)│ 🟢 (resolved)  │ 🟢 (resolved)  │
│ . (require)       │ 🟢 (resolved)│ 🟢 (resolved)  │ 🟢 (resolved)  │
│ ./security        │ 🟢 (resolved)│ 🟢 (resolved)  │ 🟢 (resolved)  │
└───────────────────┴──────────────┴────────────────┴────────────────┘
All checks passed! Zero packaging errors detected.
```

**Line-by-line explanation:**
- `npx publint`: Checks for broken paths, missing files listed in `"exports"`, and invalid condition keys.
- `npx @arethetypeswrong/cli --pack .`: Packs a temporary `.tgz` tarball (exactly as `npm publish` would) and verifies that every entry point resolves correctly under `node10`, `node16 (ESM)`, and `node16 (CJS)`.

---

### 4. How it works inside TypeScript
1. **`--pack .` Parameter**: Ensures `attw` tests the actual files bundled into the npm tarball (honoring `.npmignore` and `"files"`), catching missing build output.
2. **Resolution Matrix**: `attw` tests:
   - Does `import "pkg"` resolve to a valid `.d.ts` file?
   - Does `require("pkg")` resolve to a valid `.d.cts` file?
   - Is there a Dual-Package Hazard or prototype mismatch?

---

### 5. More examples

#### Example 1: Integrating `attw` and `publint` into CI Pre-Publish Scripts
```json
// package.json
{
  "scripts": {
    "build": "tsup",
    "check:exports": "publint",
    "check:types": "attw --pack .",
    "prepublishOnly": "pnpm build && pnpm check:exports && pnpm check:types"
  }
}
```

---

### 6. Common mistakes

#### Mistake 1: Testing `attw` on source files instead of the packed tarball
```bash
# WRONG: Running without --pack
attw . # Checks local folder, missing missing-files packaging errors!
```
**Why it fails:** Always use `--pack .`. This packs the actual archive that npm will distribute, catching cases where you forgot to include `dist/` in `"files"`.

#### Mistake 2: Ignoring red flags in `attw`
```
// ATTW WARNING: "Masquerading as CJS" or "Cannot be loaded by require()"
```
**Why it matters:** Red flags in `attw` mean real consumers will experience build errors. Fix your `"exports"` conditions until all checks are green.

---

### 7. Rules to remember
1. Always run `publint` to validate `package.json` fields.
2. Always run `attw --pack .` before publishing to npm.
3. Add `attw` and `publint` to your CI pipeline.
4. Green across all columns in `attw` guarantees universal consumer compatibility.

---

### Think first: Prediction puzzle
What does `publint` report if `package.json` `"exports"` points to `./dist/index.js`, but `./dist/index.js` was never compiled?

---

**Answer:**
```
Error: File does not exist: ./dist/index.js
```
**Explanation:** `publint` checks every path listed in `package.json` to verify that the target files actually exist on disk.

---

### Practice exercises

#### Exercise 1: Run publint
- **Task**: Write the npm script to run `publint`.
- **Hint 1**: `"lint:package": "publint"`.

#### Exercise 2: Run attw with tarball packing
- **Task**: Write the command to test package types using temporary tarball packing.
- **Hint 1**: `npx @arethetypeswrong/cli --pack .`.

#### Exercise 3: Add pre-publish check hook
- **Task**: Add a `prepublishOnly` script in `package.json` that runs the build, `publint`, and `attw`.
- **Hint 1**: `"prepublishOnly": "npm run build && publint && attw --pack ."`.

#### Exercise 4: Explain "Masquerading as ESM"
- **Task**: Explain what `attw`'s "Masquerading as ESM" warning means.
- **Hint 1**: A `.js` file contains `export` statements inside a package marked `"type": "commonjs"`.

---

### Exercise solutions

#### Solution 1: Run publint
```json
{
  "scripts": {
    "check:exports": "publint"
  }
}
```

#### Solution 2: Run attw with tarball packing
```bash
npx @arethetypeswrong/cli --pack .
```

#### Solution 3: Add pre-publish check hook
```json
{
  "scripts": {
    "prepublishOnly": "npm run build && publint && attw --pack ."
  }
}
```

#### Solution 4: Explain "Masquerading as ESM"
The warning occurs when a file contains ESM syntax (like `export` or `import`), but the enclosing `package.json` does not specify `"type": "module"`, causing Node.js to evaluate it as CommonJS and crash with `SyntaxError: Cannot use import statement outside a module`.

---

### Recall
1. What does `publint` check? Syntax, file existence, and condition ordering in `package.json`.
2. What does `attw --pack .` check? Resolvability and correctness of types across all TypeScript module resolution modes using the packed npm tarball.
3. Why should these tools be run in CI? To catch packaging errors before publishing broken releases to npm.

> **If you remember only one thing:**  
> Run `publint` and `attw --pack .` before every release to guarantee that your package exports and types resolve cleanly across all runtimes.

---

# Topic 8: Package Whitelisting and Publishing: `"files"`, `.npmignore`, and NPM Provenance

### 1. What is it?
When publishing a package to the npm registry with `npm publish`, you must control exactly which files are uploaded.
- **`"files"` array in `package.json`**: An explicit whitelist of folders and files to include in the package tarball.
- **NPM Provenance (`--provenance`)**: Generates a cryptographically signed public ledger proving that the package was built and published from a specific GitHub Actions workflow and commit.

### 2. Why does it exist?
Without an explicit `"files"` whitelist, `npm publish` will upload your entire workspace: test files, configuration secrets, internal `.env` files, and raw source code. Using an explicit `"files"` whitelist ensures that only the compiled `dist/` directory and documentation are published. NPM Provenance protects against supply chain attacks.

### 3. Basic example

```json
// package.json (Production Publishing Whitelist)
{
  "name": "@enterprise/auth-tools",
  "version": "1.0.0",
  "files": [
    "dist",
    "README.md",
    "LICENSE"
  ],
  "publishConfig": {
    "access": "public",
    "provenance": true
  }
}
```

```yaml
# .github/workflows/publish.yml (Automated Provenance Publishing)
name: Publish to NPM
on:
  release:
    types: [published]

jobs:
  publish:
    runs-on: ubuntu-latest
    permissions:
      contents: read
      id-token: write # Mandatory for NPM Provenance cryptographic signatures!
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v3
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          registry-url: 'https://registry.npmjs.org'
      - run: pnpm install --frozen-lockfile
      - run: pnpm build
      - run: pnpm publish --provenance --no-git-checks
        env:
          NODE_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }}
```

**Line-by-line explanation:**
- `"files": ["dist", "README.md", "LICENSE"]`: Explicit whitelist. Only `dist/`, README, and LICENSE are packaged. Everything else (`src/`, `tests/`, `.github/`, `tsconfig.json`) is excluded.
- `"provenance": true`: Configures npm to sign releases cryptographically.
- `id-token: write`: Grants GitHub Actions permission to mint OpenID Connect (OIDC) identity tokens for npm.

---

### 4. How it works inside TypeScript
1. **Always Included**: `package.json`, `README.md`, `LICENSE`, and `CHANGELOG.md` are always included by npm, even if omitted from `"files"`.
2. **Always Excluded**: `.git`, `.env`, `node_modules`, and `.npmrc` are always excluded by npm for security.
3. **Inspect Tarball Contents**: Run `npm pack --dry-run` to preview the exact list of files that will be uploaded.

---

### 5. More examples

#### Example 1: Previewing published files with `npm pack --dry-run`
```bash
npm pack --dry-run
```
Outputs:
```
npm notice 📦  @enterprise/auth-tools@1.0.0
npm notice === Tarball Contents ===
npm notice 1.2kB dist/index.js
npm notice 1.4kB dist/index.cjs
npm notice 450B  dist/index.d.ts
npm notice 450B  dist/index.d.cts
npm notice 2.1kB README.md
npm notice 1.1kB LICENSE
npm notice 850B  package.json
npm notice === Tarball Details ===
npm notice total files: 7
```

---

### 6. Common mistakes

#### Mistake 1: Relying on `.npmignore` instead of `"files"`
```bash
# RISKY: Using .npmignore
# If someone adds a new folder 'secrets/' and forgets to update .npmignore,
# that folder will be uploaded to the public npm registry!
```
**Why it fails:** `.npmignore` is a blacklist (opt-out). The `"files"` field is a whitelist (opt-in). Whitelists are dramatically safer.

#### Mistake 2: Missing `id-token: write` when enabling provenance
```yaml
# In GitHub Actions without id-token: write
# Error: NPM Provenance generation failed: Unable to exchange OIDC token!
```
**Why it fails:** NPM Provenance requires GitHub Actions OIDC permissions to sign releases.

---

### 7. Rules to remember
1. Always use the `"files"` whitelist array in `package.json`.
2. Never rely on `.npmignore` for production packages.
3. Preview tarball contents before publishing with `npm pack --dry-run`.
4. Enable `--provenance` in GitHub Actions for cryptographic supply chain security.

---

### Think first: Prediction puzzle
Does `npm pack --dry-run` upload files to the npm registry?

---

**Answer:**
```
No.
```
**Explanation:** `--dry-run` only builds and displays the tarball file list in the terminal without uploading anything.

---

### Practice exercises

#### Exercise 1: Package whitelist definition
- **Task**: Configure `package.json` to only publish `dist/` and `LICENSE`.
- **Hint 1**: `"files": ["dist", "LICENSE"]`.

#### Exercise 2: Dry-run command
- **Task**: Write the command to inspect the contents of your package tarball before publishing.
- **Hint 1**: `npm pack --dry-run`.

#### Exercise 3: Scoped package public access
- **Task**: Set `"publishConfig"` so a scoped package (`@myorg/pkg`) publishes publicly instead of privately.
- **Hint 1**: `"publishConfig": { "access": "public" }`.

#### Exercise 4: OIDC permission for provenance
- **Task**: Write the GitHub Actions workflow permission needed for npm provenance.
- **Hint 1**: `permissions: { id-token: write }`.

---

### Exercise solutions

#### Solution 1: Package whitelist definition
```json
{
  "files": [
    "dist",
    "LICENSE",
    "README.md"
  ]
}
```

#### Solution 2: Dry-run command
```bash
npm pack --dry-run
```

#### Solution 3: Scoped package public access
```json
{
  "publishConfig": {
    "access": "public",
    "provenance": true
  }
}
```

#### Solution 4: OIDC permission for provenance
```yaml
permissions:
  contents: read
  id-token: write
```

---

### Recall
1. Why is the `"files"` whitelist safer than `.npmignore`? Because it only includes explicitly listed files, preventing accidental leaks of new files or secrets.
2. What does NPM Provenance prove? That the package was built and published from a verifiable GitHub Actions workflow and commit.
3. How do you preview the exact files included in a package? Run `npm pack --dry-run`.

> **If you remember only one thing:**  
> Use the `"files"` whitelist array in `package.json` and publish with `--provenance` for verified supply-chain security.

---

# Topic 9: Testing Public Type Contracts: `tsd` and Type-Level Unit Testing

### 1. What is it?
**Type-Level Unit Testing** is the practice of writing automated tests that verify your library's public TypeScript types, ensuring that return types are accurate, invalid arguments trigger compile errors, and generics infer correctly. Popular tools include **`tsd`** and Vitest's `expectTypeOf()`.

### 2. Why does it exist?
Standard testing frameworks (Jest, Vitest) only execute JavaScript code at runtime. They cannot verify whether a type is inferred as `string` vs `any`, or whether an invalid function call triggers a compile-time diagnostic error. Type tests catch accidental type regressions before releases.

### 3. Basic example

```typescript
// test-d/index.test-d.ts (Type Test Suite using tsd)
import { expectType, expectError, expectAssignable } from "tsd";
import { MemoryCache, CachePolicy } from "../src/index.js";

// 1. Verify Class Construction
const policy: CachePolicy = { ttlMs: 1000, maxEntries: 100 };
const cache = new MemoryCache<string>(policy);

// 2. Test Return Types
expectType<string | null>(cache.get("key"));

// 3. Test Type Assignment Guard
expectAssignable<CachePolicy>({ ttlMs: 500, maxEntries: 50 });

// 4. Test Negative Assertions (Must trigger compile errors!)
expectError(new MemoryCache<string>({ ttlMs: "invalid_string" })); // Should fail: ttlMs must be number
expectError(cache.set("key", 12345)); // Should fail: cache expects string value, not number!
```

**Run Type Tests via CLI:**
```bash
npx tsd
```

**Line-by-line explanation:**
- `expectType<T>(expr)`: Asserts that the inferred type of `expr` matches `T` identically (not a subtype, but an exact match).
- `expectAssignable<T>(expr)`: Asserts that `expr` is assignable to `T`.
- `expectError(expr)`: Asserts that `expr` produces a TypeScript compile error. If `expr` compiles successfully, the test **fails**!

---

### 4. How it works inside TypeScript
1. **Language Service Diagnostics**: `tsd` runs the TypeScript compiler against `test-d/` files and matches the diagnostics against `expectError` and `expectType` directives.
2. **Strict Equality Check**: Unlike standard assignability, `expectType` tests for type identity, ensuring `string` is not satisfied by `any`.
3. **CI Integration**: Add `tsd` to your `test` script in `package.json`.

---

### 5. More examples

#### Example 1: Testing with Vitest `expectTypeOf`
```typescript
import { test, expectTypeOf } from "vitest";
import { formatCurrency } from "../src/index.js";

test("type contract", () => {
  expectTypeOf(formatCurrency(100)).toEqualTypeOf<string>();
  expectTypeOf(formatCurrency).toBeCallableWith(50);
});
```

---

### 6. Common mistakes

#### Mistake 1: Testing types with runtime `typeof` assertions
```typescript
// WRONG: Runtime typeof checks do not test TypeScript types!
expect(typeof result).toBe("string"); // Only tests runtime string, cannot distinguish string vs any vs 'hello'!
```
**Why it fails:** At runtime, types are erased. Use `expectType<T>()` from `tsd` or `expectTypeOf()` from Vitest.

#### Mistake 2: Missing negative compilation tests
```typescript
// INCOMPLETE: Testing only valid calls
// If a breaking change allows any argument to be passed, your tests will still pass!
```
**Why it matters:** Always write `expectError()` tests to prove that invalid arguments are properly rejected by the compiler.

---

### 7. Rules to remember
1. Use `tsd` or Vitest `expectTypeOf` to test public type signatures.
2. Use `expectType<T>()` for exact type identity matching.
3. Use `expectError()` to verify that illegal calls are rejected at compile time.
4. Run type tests in CI alongside runtime unit tests.

---

### Think first: Prediction puzzle
Does `expectType<string>(value)` pass if `value` is typed as `any`?

---

**Answer:**
```
No, it fails.
```
**Explanation:** `expectType` checks for strict type identity. `any` is not identical to `string`, so the test fails.

---

### Practice exercises

#### Exercise 1: Exact return type assertion
- **Task**: Write a `tsd` assertion verifying that `calc(10)` returns type `number`.
- **Hint 1**: `expectType<number>(calc(10))`.

#### Exercise 2: Negative type assertion
- **Task**: Assert that calling `greet(123)` produces a compile error.
- **Hint 1**: `expectError(greet(123))`.

#### Exercise 3: Assignability check
- **Task**: Assert that `{ id: "1", role: "admin" }` is assignable to `User`.
- **Hint 1**: `expectAssignable<User>({ id: "1", role: "admin" })`.

#### Exercise 4: Type test script in package.json
- **Task**: Add a `"test:types"` script to `package.json` running `tsd`.
- **Hint 1**: `"test:types": "tsd"`.

---

### Exercise solutions

#### Solution 1: Exact return type assertion
```typescript
import { expectType } from "tsd";
expectType<number>(calc(10));
```

#### Solution 2: Negative type assertion
```typescript
import { expectError } from "tsd";
expectError(greet(123));
```

#### Solution 3: Assignability check
```typescript
import { expectAssignable } from "tsd";
expectAssignable<User>({ id: "1", role: "admin" });
```

#### Solution 4: Type test script in package.json
```json
{
  "scripts": {
    "test:types": "tsd",
    "test": "vitest run && npm run test:types"
  }
}
```

---

### Recall
1. Why can't runtime unit tests verify TypeScript types? Because TypeScript types are completely erased at runtime.
2. What does `expectError()` test in `tsd`? Asserts that the enclosed code produces a TypeScript compiler error.
3. How does `expectType` differ from `expectAssignable`? `expectType` requires exact identical types; `expectAssignable` permits subtypes.

> **If you remember only one thing:**  
> Use `tsd` to write automated unit tests for your library's public types, including `expectError` tests for negative cases.

---

# Topic 10: SemVer for TypeScript Libraries: Breaking Type Changes vs Runtime Changes

### 1. What is it?
**Semantic Versioning (SemVer)** dictates version numbers as `MAJOR.MINOR.PATCH`:
- `PATCH`: Backwards-compatible bug fixes.
- `MINOR`: Backwards-compatible new features.
- `MAJOR`: Breaking changes.
In TypeScript libraries, **Breaking Changes can occur purely at the type level**, even when the runtime JavaScript code has not changed at all!

### 2. Why does it exist?
If a library changes an interface property from `string | undefined` to strictly `string`:
- The JavaScript function still executes the exact same way.
- But consumers' TypeScript builds will fail to compile!
Under SemVer for TypeScript libraries, any change that causes previously compiling consumer code to fail compilation is considered a **Breaking Change** requiring a **MAJOR** version bump.

### 3. Basic example

```typescript
// Version 1.0.0
export interface ClientConfig {
  apiKey: string;
  timeout?: number;
  retries?: number;
}
export function createClient(config: ClientConfig): void {}

// --- SCENARIO A: BREAKING TYPE CHANGE (Requires MAJOR bump: 2.0.0) ---
// Adding a new REQUIRED property:
export interface ClientConfig {
  apiKey: string;
  timeout?: number;
  retries?: number;
  region: string; // BREAKING! Any existing code calling createClient({ apiKey: "..." }) fails to compile!
}

// --- SCENARIO B: NON-BREAKING ADDITION (Requires MINOR bump: 1.1.0) ---
// Adding an OPTIONAL property:
export interface ClientConfig {
  apiKey: string;
  timeout?: number;
  retries?: number;
  region?: string; // SAFE: Existing consumer code continues to compile!
}
```

---

### 4. How it works inside TypeScript
1. **Contravariance in Callbacks**: Narrowing callback parameter types is a breaking change.
2. **Widening Return Types**: Adding a union member to a return type (`string` $\to$ `string | null`) is a breaking change because consumers must now handle `null`.
3. **Narrowing Argument Types**: Removing a union member from an argument (`string | number` $\to$ `string`) is a breaking change because callers passing numbers will fail.

---

### 5. More examples

#### Example 1: Breaking vs Non-Breaking Type Matrix
| Modification | Type Position | Breaking? | SemVer Bump |
|---|---|---|---|
| Adding optional property | Parameter / Input | NO | MINOR |
| Adding required property | Parameter / Input | **YES** | **MAJOR** |
| Adding property | Return value / Output | NO | MINOR |
| Removing property | Return value / Output | **YES** | **MAJOR** |
| Widening return type (`T` $\to$ `T \| null`) | Return value / Output | **YES** | **MAJOR** |
| Narrowing parameter type (`T \| null` $\to$ `T`) | Parameter / Input | **YES** | **MAJOR** |

---

### 6. Common mistakes

#### Mistake 1: Treating type-only breaking changes as a PATCH release
```typescript
// Changing a return type from Promise<string> to Promise<string | undefined>
// in a patch release: 1.0.1 -> Breaks thousands of downstream CI builds!
```
**Why it fails:** In static languages like TypeScript, compilation failures break CI pipelines. Treat type-breaking changes with the same severity as runtime crashes.

#### Mistake 2: Renaming public interfaces without deprecation aliases
```typescript
// BAD: Renaming interface in 1.1.0
// export interface NewOptions {} // Old 'interface Options' removed!

// GOOD: Deprecate first in MINOR release:
/** @deprecated Use NewOptions instead */
export type Options = NewOptions;
```

---

### 7. Rules to remember
1. Adding required properties to input interfaces is a MAJOR breaking change.
2. Widening return types (`string` $\to$ `string | null`) is a MAJOR breaking change.
3. Adding optional properties to input interfaces is a MINOR feature.
4. Deprecate old types before removing them in the next major version.

---

### Think first: Prediction puzzle
Is changing a function parameter from `(data: string)` to `(data: string | number)` a breaking change for callers?

---

**Answer:**
```
No, it is a non-breaking MINOR change.
```
**Explanation:** Existing callers passing `string` continue to compile without error. The function simply widened its input acceptance.

---

### Practice exercises

#### Exercise 1: Identify breaking return type change
- **Task**: State whether changing `getUser(): User` to `getUser(): User | null` is breaking.
- **Hint 1**: Consumers must now check for null.

#### Exercise 2: Graceful interface renaming
- **Task**: Rename `OldConfig` to `AppConfig` while maintaining backwards compatibility via a type alias.
- **Hint 1**: `export type OldConfig = AppConfig;`.

#### Exercise 3: Non-breaking option addition
- **Task**: Add a new `cache` option to `interface Options { id: string }` without breaking existing consumers.
- **Hint 1**: Make it optional: `cache?: boolean`.

#### Exercise 4: Deprecation JSDoc annotation
- **Task**: Annotate a function with `@deprecated` including migration advice.
- **Hint 1**: `/** @deprecated Use newFunction() instead */`.

---

### Exercise solutions

#### Solution 1: Identify breaking return type change
It is a **MAJOR breaking change**. Any consumer calling `getUser().name` will immediately fail compilation with `Object is possibly 'null'`.

#### Solution 2: Graceful interface renaming
```typescript
export interface AppConfig {
  apiUrl: string;
}

/** @deprecated Use AppConfig instead. Will be removed in v2.0.0 */
export type OldConfig = AppConfig;
```

#### Solution 3: Non-breaking option addition
```typescript
export interface Options {
  id: string;
  cache?: boolean; // Optional: Safe for existing callers!
}
```

#### Solution 4: Deprecation JSDoc annotation
```typescript
/**
 * @deprecated Since v1.2.0. Use `fetchUserData()` instead.
 */
export function getUserDataLegacy(): void {}
```

---

### Recall
1. Can a TypeScript library have a breaking change without any runtime JavaScript changes? Yes; any type change that causes existing consumer code to fail compilation is a breaking change.
2. Is adding a required property to an options interface breaking or non-breaking? Breaking (requires MAJOR bump).
3. How should public interfaces be phased out? Deprecated in a MINOR release using `@deprecated`, then removed in the next MAJOR release.

> **If you remember only one thing:**  
> In TypeScript libraries, any change that breaks consumer compilation requires a SemVer MAJOR release.

---

# Checkpoint Challenge 2: Package Validation & Type Testing (Topics 6-10)

### Challenge Specification
Construct an automated Packaging and Type Verification Engine:
1. Write a `tsup.config.ts` configured for clean dual packaging.
2. Write a `package.json` with strict `"files"` whitelisting and `"exports"` mapping.
3. Write a `test-d/index.test-d.ts` test suite using `tsd` testing:
   - Return type assertions with `expectType`.
   - Rejection of invalid properties with `expectError`.
4. Include an npm pre-publish script running `publint`, `attw`, and `tsd`.

### Solution

```typescript
// 1. tsup.config.ts
import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts"],
  format: ["esm", "cjs"],
  dts: true,
  sourcemap: true,
  clean: true,
  shims: true,
});
```

```json
// 2. package.json
{
  "name": "@enterprise/identity-vault",
  "version": "1.0.0",
  "type": "module",
  "main": "./dist/index.cjs",
  "types": "./dist/index.d.ts",
  "exports": {
    ".": {
      "types": {
        "import": "./dist/index.d.ts",
        "require": "./dist/index.d.cts"
      },
      "import": "./dist/index.js",
      "require": "./dist/index.cjs"
    },
    "./package.json": "./package.json"
  },
  "files": [
    "dist",
    "README.md",
    "LICENSE"
  ],
  "scripts": {
    "build": "tsup",
    "test:types": "tsd",
    "test:exports": "publint && attw --pack .",
    "prepublishOnly": "npm run build && npm run test:types && npm run test:exports"
  }
}
```

```typescript
// 3. src/index.ts (Implementation)
export interface VaultOptions {
  secretKey: string;
  maxLeaseSeconds?: number;
}

export class IdentityVault {
  constructor(private options: VaultOptions) {}

  generateToken(subject: string): string {
    return `tok_${subject}_${this.options.secretKey.slice(0, 4)}`;
  }
}
```

```typescript
// 4. test-d/index.test-d.ts (Type Tests)
import { expectType, expectError } from "tsd";
import { IdentityVault, VaultOptions } from "../src/index.js";

// Test valid construction
const vault = new IdentityVault({ secretKey: "super_secret" });

// Test return type
expectType<string>(vault.generateToken("user_42"));

// Negative assertion: Missing required 'secretKey'
expectError(new IdentityVault({ maxLeaseSeconds: 60 }));

// Negative assertion: Invalid argument type
expectError(vault.generateToken(12345));
```


---

# Topic 11: Module Federation Fundamentals: Micro-Frontends and Shared Runtime Singletons

### 1. What is it?
**Module Federation** (popularized by Webpack 5, Rspack, and Vite) is an architectural pattern that allows multiple independent applications or builds to share code and components dynamically at runtime.
- **Host (Shell)**: The main container application that loads remotes.
- **Remote**: An independently deployed micro-frontend that exposes components or functions.
- **Shared Dependencies**: Libraries (like `react`, `react-dom`, or state stores) loaded once as runtime singletons to prevent loading duplicate copies.

### 2. Why does it exist?
In large enterprise organizations, different teams own different parts of an application (e.g., Team Checkout, Team Dashboard, Team Auth). With standard npm dependencies, whenever Team Checkout updates their code, the entire host application must be recompiled and redeployed. With Module Federation:
- Team Checkout deploys their remote independently to a CDN.
- The host application fetches the latest remote bundle at runtime without needing a rebuild or redeployment!

### 3. Basic example

```javascript
// remote/rspack.config.js (The Remote Application exposing a component)
const { ModuleFederationPlugin } = require("@rspack/core").container;

module.exports = {
  plugins: [
    new ModuleFederationPlugin({
      name: "checkoutApp",
      filename: "remoteEntry.js",
      exposes: {
        "./CheckoutButton": "./src/CheckoutButton.tsx",
        "./CartSummary": "./src/CartSummary.tsx",
      },
      shared: {
        react: { singleton: true, requiredVersion: "^18.2.0" },
        "react-dom": { singleton: true, requiredVersion: "^18.2.0" },
      },
    }),
  ],
};
```

```javascript
// host/rspack.config.js (The Host Shell consuming the remote)
const { ModuleFederationPlugin } = require("@rspack/core").container;

module.exports = {
  plugins: [
    new ModuleFederationPlugin({
      name: "hostShell",
      remotes: {
        checkoutApp: "checkoutApp@https://cdn.example.com/checkout/remoteEntry.js",
      },
      shared: {
        react: { singleton: true },
        "react-dom": { singleton: true },
      },
    }),
  ],
};
```

**Host Application Code:**
```typescript
// Dynamically importing the federated remote:
import React, { lazy, Suspense } from "react";

const RemoteCheckoutButton = lazy(() => import("checkoutApp/CheckoutButton"));

export function App() {
  return (
    <div>
      <h1>Main Host Portal</h1>
      <Suspense fallback={<div>Loading remote checkout...</div>}>
        <RemoteCheckoutButton amount={49.99} />
      </Suspense>
    </div>
  );
}
```

---

### 4. How it works inside TypeScript
1. **Dynamic Chunk Loading**: At runtime in the browser, `remoteEntry.js` is loaded via a `<script>` tag.
2. **Shared Scope Negotiation**: The host and remote negotiate version requirements for shared dependencies. If both require `react: "^18.2.0"`, only one single copy of React is loaded into memory, avoiding the dreaded "Multiple instances of React" hook crash.
3. **Type Problem**: Because `checkoutApp/CheckoutButton` is fetched from an external CDN at runtime, standard TypeScript compiler will report: `Cannot find module 'checkoutApp/CheckoutButton'`.

---

### 5. More examples

#### Example 1: Typing remote modules manually with ambient declarations
```typescript
// host/src/declarations.d.ts
declare module "checkoutApp/CheckoutButton" {
  import { ComponentType } from "react";
  export interface CheckoutButtonProps {
    amount: number;
    onSuccess?: () => void;
  }
  const CheckoutButton: ComponentType<CheckoutButtonProps>;
  export default CheckoutButton;
}
```
Now `import("checkoutApp/CheckoutButton")` has full type checking and autocompletion in the host application!

---

### 6. Common mistakes

#### Mistake 1: Forgetting `singleton: true` on React in shared configuration
```javascript
// WRONG in shared config:
shared: ["react", "react-dom"] // Missing singleton: true!
```
**Why it fails:** If `singleton: true` is omitted, the host and remote might instantiate two separate copies of React. When the remote component calls `useState()` or `useEffect()`, React crashes with `Invalid hook call: hooks can only be called inside the body of a function component`.

#### Mistake 2: Synchronous top-level imports of remotes
```typescript
// WRONG in host:
import RemoteButton from "checkoutApp/CheckoutButton"; // Crashes if remoteEntry.js is not yet downloaded!
```
**Why it fails:** Remote containers load asynchronously. You must load remotes using `React.lazy(() => import("..."))` or an async bootstrap boundary (`import("./bootstrap")`).

---

### 7. Rules to remember
1. Always mark framework dependencies (`react`, `react-dom`, `vue`) as `singleton: true`.
2. Load federated remote components asynchronously via `React.lazy()` and `Suspense`.
3. Provide ambient type declarations or use automated type-sync tools to type remotes.
4. Use an async bootstrap entry point (`import("./bootstrap")`) in federated hosts.

---

### Think first: Prediction puzzle
What happens if the Host uses React 18.2 and a Remote uses React 17.0 with `singleton: true`?

---

**Answer:**
```
Module Federation issues a version mismatch warning and falls back to the higher version if semver compatible, or warns in the console.
```
**Explanation:** `singleton: true` tells the runtime to pick one instance; `requiredVersion` determines if the negotiated version satisfies both apps.

---

### Practice exercises

#### Exercise 1: Ambient declaration for remote component
- **Task**: Declare an ambient type for `"authRemote/LoginForm"` accepting `onLogin(token: string): void`.
- **Hint 1**: `declare module "authRemote/LoginForm" { ... }`.

#### Exercise 2: Shared singleton configuration
- **Task**: Write the `shared` object configuration for `react` enforcing a singleton.
- **Hint 1**: `shared: { react: { singleton: true } }`.

#### Exercise 3: Lazy remote component
- **Task**: Wrap a remote import in `React.lazy()`.
- **Hint 1**: `React.lazy(() => import("remoteApp/Widget"))`.

#### Exercise 4: Async bootstrap pattern
- **Task**: Write the two-line `index.ts` that implements the async bootstrap boundary.
- **Hint 1**: `import("./bootstrap.js");`.

---

### Exercise solutions

#### Solution 1: Ambient declaration for remote component
```typescript
declare module "authRemote/LoginForm" {
  import React from "react";
  export interface LoginFormProps {
    onLogin: (token: string) => void;
  }
  const LoginForm: React.FC<LoginFormProps>;
  export default LoginForm;
}
```

#### Solution 2: Shared singleton configuration
```javascript
shared: {
  react: {
    singleton: true,
    requiredVersion: "^18.0.0",
  },
  "react-dom": {
    singleton: true,
    requiredVersion: "^18.0.0",
  }
}
```

#### Solution 3: Lazy remote component
```typescript
import { lazy } from "react";
const RemoteWidget = lazy(() => import("remoteApp/Widget"));
```

#### Solution 4: Async bootstrap pattern
```typescript
// src/index.ts
import("./bootstrap.js");
export {};
```

---

### Recall
1. What role does `remoteEntry.js` play in Module Federation? It is the manifest and loader script exposed by a remote container.
2. Why is `singleton: true` critical for React? To prevent multiple instances of React from being loaded, which breaks React Hooks.
3. How do you load a federated component in React? Using `React.lazy(() => import("remote/Component"))` wrapped in `<Suspense>`.

> **If you remember only one thing:**  
> Module Federation shares code between independently deployed apps at runtime, using `singleton: true` to prevent library duplication.

---

# Topic 12: Typing Federated Remotes: `@module-federation/typescript` and Remote Type Sync

### 1. What is it?
**Federated Type Sync** is the automated generation and consumption of `.d.ts` declaration files across Module Federation boundaries. Using plugins like **`@module-federation/typescript`** or `@originjs/vite-plugin-federation`:
- The **Remote** compiles and exposes a tarball of `.d.ts` files alongside `remoteEntry.js`.
- The **Host** automatically downloads these `.d.ts` files during development and places them in `@mf-types/`, giving full IDE auto-completion and compile-time type safety for remote components.

### 2. Why does it exist?
Writing manual `declare module "remoteApp/Button"` files by hand is error-prone. If the Remote team adds a required prop `variant: "primary" | "secondary"`, the Host team has no idea until the component crashes at runtime in production. Automated type sync guarantees that host builds fail if remote props change.

### 3. Basic example

```javascript
// remote/webpack.config.js
const { FederatedTypesPlugin } = require("@module-federation/typescript");

module.exports = {
  plugins: [
    new FederatedTypesPlugin({
      federationConfig: {
        name: "ordersRemote",
        filename: "remoteEntry.js",
        exposes: {
          "./OrderCard": "./src/OrderCard.tsx",
        },
        shared: { react: { singleton: true } },
      },
    }),
  ],
};
```

**What the Remote Emits:**
Alongside `remoteEntry.js`, the plugin compiles `dist/@mf-types.zip` containing `OrderCard.d.ts`.

**In Host Application:**
When the host builds, `@module-federation/typescript` downloads `@mf-types.zip` from the remote and unzips it into:
```
host/
├── @mf-types/
│   └── ordersRemote/
│       └── OrderCard.d.ts
└── tsconfig.json
```

```json
// host/tsconfig.json (Include the downloaded federated types!)
{
  "compilerOptions": {
    "paths": {
      "*": ["./@mf-types/*"]
    }
  },
  "include": ["src/**/*", "@mf-types/**/*"]
}
```

```typescript
// host/src/App.tsx: Full type checking and auto-completion!
import OrderCard from "ordersRemote/OrderCard";

// TypeScript validates that props match OrderCard.d.ts!
<OrderCard orderId="ord_101" />
```

---

### 4. How it works inside TypeScript
1. **Automated Declaration Extraction**: The remote uses `tsc` or `api-extractor` to emit types for each exposed file.
2. **Download on Build**: During `npm run build` or `npm run dev`, the host fetches the remote types archive via HTTP.
3. **IDE Integration**: TypeScript reads `./@mf-types/ordersRemote/OrderCard.d.ts` via standard `paths` mapping in `tsconfig.json`.

---

### 5. More examples

#### Example 1: Vite Module Federation Type Generation
```typescript
// vite.config.ts
import federation from "@originjs/vite-plugin-federation";

export default {
  plugins: [
    federation({
      name: "remote-app",
      filename: "remoteEntry.js",
      exposes: {
        "./Button": "./src/Button.vue",
      },
      shared: ["vue"],
    }),
  ],
};
```

---

### 6. Common mistakes

#### Mistake 1: Forgetting to add `@mf-types` to `tsconfig.json` `include`
```json
// WRONG:
{
  "include": ["src/**/*"] // Missing @mf-types! TypeScript will NOT see the downloaded types!
}
```
**Why it fails:** If `@mf-types` is outside `src/`, you must add `"@mf-types/**/*"` to the `"include"` array in `tsconfig.json`.

#### Mistake 2: Missing remote during offline development
```bash
# If the remote dev server is not running:
# The host fails to download @mf-types and throws type errors!
```
**Why it matters:** Commit or cache `@mf-types` or mock the remote types when developing offline.

---

### 7. Rules to remember
1. Use `@module-federation/typescript` to automate cross-application type sync.
2. The remote generates a types archive alongside `remoteEntry.js`.
3. The host downloads types and maps them via `paths` in `tsconfig.json`.
4. Include `"@mf-types/**/*"` in the host's `tsconfig.json` `"include"` array.

---

### Think first: Prediction puzzle
Does the host application download the remote's `.ts` source code files?

---

**Answer:**
```
No.
```
**Explanation:** The host only downloads the compiled `.d.ts` declaration files. The actual JavaScript implementation is loaded dynamically in the browser at runtime.

---

### Practice exercises

#### Exercise 1: Configure tsconfig for @mf-types
- **Task**: Update `tsconfig.json` `paths` and `include` to load types from `@mf-types`.
- **Hint 1**: `"paths": { "*": ["./@mf-types/*"] }`, `"include": ["src/**/*", "@mf-types/**/*"]`.

#### Exercise 2: Identify remote types artifact
- **Task**: Name the zip archive typically emitted by `@module-federation/typescript`.
- **Hint 1**: `@mf-types.zip`.

#### Exercise 3: Type check remote prop change
- **Task**: Explain what happens in the host CI build if a remote adds a new required prop to a component.
- **Hint 1**: Host compilation fails during type checking.

#### Exercise 4: Clean old downloaded types
- **Task**: Write a shell command to remove old cached federated types before re-syncing.
- **Hint 1**: `rm -rf @mf-types`.

---

### Exercise solutions

#### Solution 1: Configure tsconfig for @mf-types
```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "*": ["./@mf-types/*"]
    }
  },
  "include": ["src/**/*", "@mf-types/**/*"]
}
```

#### Solution 2: Identify remote types artifact
The standard artifact is `@mf-types.zip`.

#### Solution 3: Type check remote prop change
During the host's CI build, the federated types plugin downloads the remote's updated `.d.ts` file. When `tsc` runs on the host codebase, it detects that the new required prop is missing from the JSX call site and terminates with a compiler diagnostic error, preventing broken code from deploying.

#### Solution 4: Clean old downloaded types
```bash
rm -rf @mf-types
```

---

### Recall
1. Why is manual ambient typing of remotes risky? Because remote teams can change component props without the host being notified, causing production crashes.
2. How does `@module-federation/typescript` distribute types? Compiles `.d.ts` into a zip archive hosted alongside `remoteEntry.js`.
3. Where are downloaded remote types stored in the host? In the `@mf-types/` directory.

> **If you remember only one thing:**  
> Use `@module-federation/typescript` to automatically generate and download `.d.ts` files across micro-frontend boundaries.

---

# Topic 13: Exposing CLI Binaries and Executable Tools in TypeScript Packages

### 1. What is it?
TypeScript packages can expose command-line interface (CLI) tools that users run directly via `npx` or by installing globally.
A CLI tool requires:
1. A **Shebang line** (`#!/usr/bin/env node`) at the very top of the compiled executable file.
2. A **`"bin"` field** in `package.json` mapping the command name to the executable file path.
3. Executable filesystem permissions (`chmod +x`).

### 2. Why does it exist?
Many enterprise libraries include developer utility scripts (e.g., code generators, database migration runners, linter tools). Publishing a CLI tool alongside your library lets users run `npx my-tool init` with zero installation.

### 3. Basic example

```typescript
// src/cli.ts (CLI Entry Point)
#!/usr/bin/env node

import { Command } from "commander";

const program = new Command();

program
  .name("enterprise-cli")
  .description("CLI developer utilities for Enterprise Toolkit")
  .version("1.0.0");

program
  .command("init")
  .description("Initialize configuration files")
  .option("-t, --type <type>", "Project type", "standard")
  .action((options) => {
    console.log(`[CLI] Initializing enterprise project with type: ${options.type}`);
  });

program.parse(process.argv);
```

```typescript
// tsup.config.ts (Compile CLI to dist/cli.js)
import { defineConfig } from "tsup";

export default defineConfig({
  entry: {
    index: "src/index.ts",
    cli: "src/cli.ts", // Separate binary entry point!
  },
  format: ["esm"],
  banner: {
    js: "#!/usr/bin/env node", // Guarantees shebang is preserved at line 1!
  },
});
```

```json
// package.json (Exposing the binary command)
{
  "name": "enterprise-cli",
  "version": "1.0.0",
  "type": "module",
  "bin": {
    "enterprise-cli": "./dist/cli.js"
  },
  "files": ["dist"]
}
```

**Running the tool:**
```bash
# Executing locally during development
node ./dist/cli.js init --type microservice

# Executing after publication to npm
npx enterprise-cli init
```

---

### 4. How it works inside TypeScript
1. **The Shebang (`#!/usr/bin/env node`)**: Instructs UNIX shells (Linux, macOS, WSL) to execute this file using the Node.js runtime.
2. **`banner` in `tsup`**: Bundlers often strip comments. Adding `banner: { js: "#!/usr/bin/env node" }` in `tsup.config.ts` ensures the shebang line remains at the absolute top of `dist/cli.js`.
3. **NPM Symlinking**: When installed globally or run via `npx`, npm creates a symlink in the system `PATH` pointing to `./dist/cli.js`.

---

### 5. More examples

#### Example 1: Exit codes for automation pipelines
```typescript
function run() {
  try {
    // perform task
    process.exit(0); // Success
  } catch (err) {
    console.error(err);
    process.exit(1); // Failure (halts CI pipeline!)
  }
}
```

---

### 6. Common mistakes

#### Mistake 1: Missing the Shebang line
```bash
# If #!/usr/bin/env node is missing:
# Running on Linux/macOS fails with:
# ./dist/cli.js: line 1: syntax error near unexpected token '('
```
**Why it fails:** Without a shebang, the operating system attempts to run the JavaScript file as a Bash shell script!

#### Mistake 2: Missing execution permissions on UNIX
```bash
# Ensure execution bit is set before publishing:
chmod +x dist/cli.js
```

---

### 7. Rules to remember
1. Executable CLI files must begin with `#!/usr/bin/env node`.
2. Map the command name in the `"bin"` field in `package.json`.
3. Use `banner: { js: "#!/usr/bin/env node" }` in `tsup` to ensure the shebang isn't stripped.
4. Exit with `process.exit(1)` on errors so CI/CD pipelines detect failures.

---

### Think first: Prediction puzzle
What does npm do with the `"bin"` field when a package is installed globally (`npm i -g`)?

---

**Answer:**
```
It creates a symlink in the global system PATH pointing to the target file.
```
**Explanation:** This allows users to execute the tool by typing the command name directly in any terminal.

---

### Practice exercises

#### Exercise 1: Define `"bin"` mapping
- **Task**: Map command `"my-tool"` to `./dist/bin.js` in `package.json`.
- **Hint 1**: `"bin": { "my-tool": "./dist/bin.js" }`.

#### Exercise 2: Add shebang banner in tsup
- **Task**: Configure `tsup` to inject the Node.js shebang at the top of generated JS.
- **Hint 1**: `banner: { js: "#!/usr/bin/env node" }`.

#### Exercise 3: Parse command line arguments
- **Task**: Write a small script reading `process.argv.slice(2)` and printing the first argument.
- **Hint 1**: `const arg = process.argv[2];`.

#### Exercise 4: CLI error exit
- **Task**: Terminate a CLI tool with a non-zero exit code on failure.
- **Hint 1**: `process.exit(1)`.

---

### Exercise solutions

#### Solution 1: Define `"bin"` mapping
```json
{
  "bin": {
    "my-tool": "./dist/bin.js"
  }
}
```

#### Solution 2: Add shebang banner in tsup
```typescript
import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/bin.ts"],
  banner: {
    js: "#!/usr/bin/env node",
  },
});
```

#### Solution 3: Parse command line arguments
```typescript
#!/usr/bin/env node
const args = process.argv.slice(2);
const command = args[0] ?? "help";
console.log(`Executing CLI command: ${command}`);
```

#### Solution 4: CLI error exit
```typescript
if (!process.env.API_KEY) {
  console.error("FATAL: Missing API_KEY environment variable");
  process.exit(1);
}
```

---

### Recall
1. What line must be at the very top of an executable Node.js CLI script? `#!/usr/bin/env node`.
2. What field in `package.json` links the CLI command name to its executable file? `"bin"`.
3. How do you prevent bundlers from stripping the shebang line? Using the `banner` option in bundler configs.

> **If you remember only one thing:**  
> Expose CLI tools by configuring `"bin"` in `package.json` and injecting `#!/usr/bin/env node` via bundler banners.

---

# Topic 14: Automated Releases and Monorepo Versioning with Changesets

### 1. What is it?
**Changesets** (`@changesets/cli`) is the industry-standard tool for managing versions, changelogs, and npm publishing in multi-package monorepos and standalone libraries. Developers document changes with small markdown files called "changesets", and an automated GitHub Action consumes them to bump SemVer versions and publish packages.

### 2. Why does it exist?
In a monorepo with 30 packages, manual version bumping is a nightmare:
- If Package A has a breaking change, which other packages depend on it?
- What should their version numbers become?
- Writing changelogs manually across 30 repositories causes human error.
Changesets calculates the dependency graph, bumps dependent package versions automatically, and generates formatted `CHANGELOG.md` files.

### 3. Basic example

```bash
# 1. Initialize Changesets in your repository
npx changeset init
```

Creates `.changeset/config.json`:
```json
{
  "$schema": "https://unpkg.com/@changesets/config/schema.json",
  "changelog": "@changesets/cli/changelog",
  "commit": false,
  "fixed": [],
  "linked": [],
  "access": "public",
  "baseBranch": "main"
}
```

**Developer Workflow on Pull Request:**
```bash
# 2. When creating a PR, the developer generates a changeset:
npx changeset
```
Prompt:
- Which packages changed? (Selects `@myorg/core`)
- Is this a major, minor, or patch bump? (Selects `minor`)
- Summary: `"Added new RateLimiter memory cache option"`

Creates a committed file: `.changeset/warm-foxes-sing.md`.

**Release Workflow (CI):**
```bash
# 3. Bumps version numbers and updates CHANGELOG.md files across all packages:
npx changeset version

# 4. Publishes all updated packages to npm:
npx changeset publish
```

---

### 4. How it works inside TypeScript
1. **Decentralized Change Tracking**: Each pull request adds its own independent `.changeset/*.md` file, eliminating Git merge conflicts on `package.json` version strings.
2. **Graph-Aware Bumping**: If `@myorg/core` has a minor bump, Changesets inspects the monorepo graph and automatically creates patch bumps for `@myorg/app` and `@myorg/cli` that depend on it!
3. **GitHub Action Automation**: The `@changesets/action` opens a persistent "Version Packages" pull request on GitHub, automatically updating it as new PRs merge.

---

### 5. More examples

#### Example 1: GitHub Actions Release Pipeline
```yaml
# .github/workflows/release.yml
name: Release
on:
  push:
    branches: [main]

jobs:
  release:
    runs-on: ubuntu-latest
    permissions:
      contents: write
      pull-requests: write
      id-token: write
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v3
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          registry-url: 'https://registry.npmjs.org'
      - run: pnpm install --frozen-lockfile
      - run: pnpm build

      # Opens PR for version bumps OR publishes to npm if PR was merged!
      - uses: changesets/action@v1
        with:
          publish: pnpm changeset publish
          version: pnpm changeset version
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
          NODE_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }}
```

---

### 6. Common mistakes

#### Mistake 1: Manually editing `version` in `package.json`
```json
// WRONG in a Changesets monorepo:
// Manually changing "version": "1.1.0" in package.json
```
**Why it fails:** Manually editing versions skips changelog generation and fails to update dependent packages. Always use `npx changeset` to record intent.

#### Mistake 2: Missing `NODE_AUTH_TOKEN` in CI publish step
```yaml
# Error: ENEEDAUTH: This command requires you to be logged in to npm!
```
**Why it fails:** Ensure `NODE_AUTH_TOKEN` is passed to the environment during `changeset publish`.

---

### 7. Rules to remember
1. Developers run `npx changeset` to record SemVer changes on feature branches.
2. Changeset markdown files are committed to Git.
3. `changeset version` updates `package.json` files and generates `CHANGELOG.md`.
4. `changeset publish` uploads updated packages to the npm registry.

---

### Think first: Prediction puzzle
Why do changeset files have funny generated names like `.changeset/sweet-peaches-run.md`?

---

**Answer:**
```
To avoid Git merge conflicts between different pull requests.
```
**Explanation:** If all developers edited a single `CHANGELOG.md` file in their PRs, constant merge conflicts would occur. Unique random filenames allow dozens of PRs to merge simultaneously without conflict.

---

### Practice exercises

#### Exercise 1: Changeset config initialization
- **Task**: Write the command to initialize Changesets in a monorepo.
- **Hint 1**: `npx changeset init`.

#### Exercise 2: Developer change recording
- **Task**: Write the command a developer runs to add a new changeset.
- **Hint 1**: `npx changeset`.

#### Exercise 3: Version bump command
- **Task**: Write the command that consumes pending changesets and updates `package.json` versions.
- **Hint 1**: `npx changeset version`.

#### Exercise 4: Publish command
- **Task**: Write the command to publish all bumped packages.
- **Hint 1**: `npx changeset publish`.

---

### Exercise solutions

#### Solution 1: Changeset config initialization
```bash
npx changeset init
```

#### Solution 2: Developer change recording
```bash
npx changeset
```

#### Solution 3: Version bump command
```bash
npx changeset version
```

#### Solution 4: Publish command
```bash
npx changeset publish
```

---

### Recall
1. What problem does Changesets solve in monorepos? Automates version bumping, dependency graph updates, and changelog generation without merge conflicts.
2. How do developers specify whether a change is major, minor, or patch? Through the interactive `npx changeset` CLI prompt.
3. What does `changeset version` do? Consumes markdown changesets, updates `package.json` version strings, updates internal dependency versions, and writes `CHANGELOG.md`.

> **If you remember only one thing:**  
> Use Changesets to document SemVer changes in pull requests and automate multi-package monorepo releases in CI.

---

# Checkpoint Challenge 3: Enterprise Library & Federation Synthesis (Topics 11-14)

### Challenge Specification
Construct a complete Enterprise Publishing & Micro-Frontend Architecture:
1. Create a **Shared Library** (`@enterprise/shared-auth`) packaged with `tsup` (dual ESM/CJS, rolled-up declarations).
2. Configure a **CLI Binary** (`auth-tool`) exposed via `package.json` `"bin"`.
3. Configure a **Module Federation Remote** exposing an `AuthWidget` component with a shared React singleton.
4. Provide a Host application setup that loads the remote component with `React.lazy` and `Suspense` and consumes the shared library.

### Solution

```json
// 1. packages/shared-auth/package.json (Dual Package + CLI Binary)
{
  "name": "@enterprise/shared-auth",
  "version": "1.0.0",
  "type": "module",
  "main": "./dist/index.cjs",
  "types": "./dist/index.d.ts",
  "bin": {
    "auth-tool": "./dist/cli.js"
  },
  "exports": {
    ".": {
      "types": {
        "import": "./dist/index.d.ts",
        "require": "./dist/index.d.cts"
      },
      "import": "./dist/index.js",
      "require": "./dist/index.cjs"
    },
    "./package.json": "./package.json"
  },
  "files": ["dist"],
  "scripts": {
    "build": "tsup"
  }
}
```

```typescript
// 2. packages/shared-auth/tsup.config.ts
import { defineConfig } from "tsup";

export default defineConfig({
  entry: {
    index: "src/index.ts",
    cli: "src/cli.ts",
  },
  format: ["esm", "cjs"],
  dts: true,
  sourcemap: true,
  clean: true,
  banner: {
    js: "#!/usr/bin/env node",
  },
});
```

```javascript
// 3. apps/remote-auth/rspack.config.js (Module Federation Remote)
const { ModuleFederationPlugin } = require("@rspack/core").container;

module.exports = {
  plugins: [
    new ModuleFederationPlugin({
      name: "authRemote",
      filename: "remoteEntry.js",
      exposes: {
        "./AuthWidget": "./src/AuthWidget.tsx",
      },
      shared: {
        react: { singleton: true, requiredVersion: "^18.2.0" },
        "react-dom": { singleton: true, requiredVersion: "^18.2.0" },
      },
    }),
  ],
};
```

```typescript
// 4. apps/host-portal/src/App.tsx (Host Shell consuming remote & shared library)
import React, { lazy, Suspense } from "react";
import { MemoryCache } from "@enterprise/shared-auth";

// Ambient type for remote component
declare module "authRemote/AuthWidget" {
  export interface AuthWidgetProps {
    portalId: string;
    onAuthenticated: (userId: string) => void;
  }
  const AuthWidget: React.FC<AuthWidgetProps>;
  export default AuthWidget;
}

const RemoteAuthWidget = lazy(() => import("authRemote/AuthWidget"));

export function App() {
  const tokenCache = new MemoryCache<string>({ ttlMs: 60000, maxEntries: 10 });

  const handleAuth = (userId: string) => {
    tokenCache.set("currentUser", userId);
    console.log(`[Host Portal] User authenticated: ${userId}`);
  };

  return (
    <div style={{ padding: "20px" }}>
      <h1>Enterprise Portal Shell</h1>
      <Suspense fallback={<div>Loading remote authentication widget...</div>}>
        <RemoteAuthWidget portalId="PORTAL_99" onAuthenticated={handleAuth} />
      </Suspense>
    </div>
  );
}
```

