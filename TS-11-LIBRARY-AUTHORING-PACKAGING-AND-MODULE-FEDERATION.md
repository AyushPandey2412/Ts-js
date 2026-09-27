# Module TS-11: Library Authoring, Packaging & Module Federation

## 1. Modern Library Architecture & Specification Foundations

### 1.1 The Anatomy of Modern npm Packaging
Publishing a modern TypeScript library in the 2026 JavaScript ecosystem requires catering to diverse runtimes and build tools:
- Native Node.js ESM (`"type": "module"`)
- Legacy Node.js CommonJS (`require()`)
- Frontend Bundlers (Vite, webpack 5, Turbopack, Rollup, esbuild)
- TypeScript Type Checkers under `node10`, `node16`, `nodenext`, and `bundler` resolution modes.

```
+-------------------------------------------------------------------------+
|                  Universal Package Resolution Pipeline                  |
+-------------------------------------------------------------------------+
|  Consumer Environment:                                                  |
|    ├── Node.js ESM   ──► resolves package.json "exports" ["import"]     |
|    ├── Node.js CJS   ──► resolves package.json "exports" ["require"]    |
|    ├── Bundler       ──► resolves package.json "exports" ["import"/"browser"]
|    └── TypeScript    ──► resolves package.json "exports" ["types"]      |
+-------------------------------------------------------------------------+
```

---

### 1.2 The `package.json` "exports" Matrix & Condition Precedence

The `"exports"` field in `package.json` provides strict encapsulation and explicit entry points, rendering internal files in your `dist/` directory inaccessible unless declared.

#### Critical Precedence Rules:
1. **Condition Order Matters**: Tools evaluate export keys **in order of definition**.
2. **`"types"` MUST ALWAYS BE FIRST**: If `"import"` appears before `"types"`, TypeScript 4.7+ and 5.x will match the JavaScript file first under certain resolution modes and fail to find the declaration file!
3. **`"default"` MUST ALWAYS BE LAST**: Acts as the catch-all fallback.

```json
{
  "name": "@enterprise/core-sdk",
  "version": "1.0.0",
  "type": "module",
  "main": "./dist/cjs/index.cjs",
  "module": "./dist/esm/index.js",
  "types": "./dist/types/index.d.ts",
  "exports": {
    ".": {
      "types": "./dist/types/index.d.ts",
      "import": "./dist/esm/index.js",
      "require": "./dist/cjs/index.cjs",
      "default": "./dist/esm/index.js"
    },
    "./auth": {
      "types": "./dist/types/auth/index.d.ts",
      "import": "./dist/esm/auth/index.js",
      "require": "./dist/cjs/auth/index.cjs",
      "default": "./dist/esm/auth/index.js"
    },
    "./package.json": "./package.json"
  },
  "files": [
    "dist"
  ],
  "sideEffects": false
}
```

---

### 1.3 The Dual-Package Hazard & Stateful Singleton Defense

If your library contains state (singletons, in-memory caches, active connection pools, or `instanceof` checks), loading both the CJS build and the ESM build inside the same process will create two distinct memory instances!

```
+-------------------------------------------------------------------------+
|                  The Dual-Package State Fracture Hazard                 |
+-------------------------------------------------------------------------+
|  Application Memory Space:                                              |
|                                                                         |
|  [ESM Loader] ──► Loads dist/esm/index.js                               |
|                     └── Creates Store Instance #1 (items: 5)            |
|                                                                         |
|  [CJS Loader] ──► Loads dist/cjs/index.cjs                              |
|                     └── Creates Store Instance #2 (items: 0)            |
|                                                                         |
|  FAILURE: Store #1 !== Store #2! `instanceof` checks fail across builds!|
+-------------------------------------------------------------------------+
```

#### The Universal Stateful Singleton Wrapper Solution:
Ensure that one format is the primary source of truth, and the secondary format forwards directly to it, or store the singleton on `globalThis` using a unique symbol:

```typescript
// src/store.ts
const STORE_KEY = Symbol.for("@enterprise/core-sdk/global_store");

export class SharedStore {
  private items = new Map<string, unknown>();

  public static getInstance(): SharedStore {
    const globalObj = globalThis as unknown as { [STORE_KEY]?: SharedStore };
    if (!globalObj[STORE_KEY]) {
      globalObj[STORE_KEY] = new SharedStore();
    }
    return globalObj[STORE_KEY];
  }

  public set(key: string, value: unknown): void { this.items.set(key, value); }
  public get(key: string): unknown { return this.items.get(key); }
  public has(key: string): boolean { return this.items.has(key); }
}
```
With `Symbol.for`, regardless of how many times the module is loaded (CJS or ESM), `SharedStore.getInstance()` returns the exact same object reference!


---

## 2. Declaration Bundling, Automated Type Testing & Module Federation

### 2.1 Declaration Bundling & API Extractor (`@microsoft/api-extractor`)

When TypeScript compiles a large library with hundreds of internal files, it generates a sprawling tree of separate `.d.ts` files. This causes:
1. Slower consumer compilation (compiler reads hundreds of declaration files).
2. Leakage of private types and internal helper types.
3. Messy navigation in consumer IDEs.

**Declaration Rollups** bundle all declarations into a single, clean `dist/index.d.ts` file:

```
+-------------------------------------------------------------------------+
|                  Declaration Rollup Pipeline (API Extractor)            |
+-------------------------------------------------------------------------+
|  src/                                                                   |
|   ├── auth/tokens.ts                                                    |
|   ├── internal/crypto-helpers.ts  (annotated with @internal)            |
|   ├── database/client.ts                                                |
|   └── index.ts                                                          |
|         │                                                               |
|         ▼ (tsc --declaration)                                           |
|  temp-types/                                                            |
|   └── 140 separate .d.ts files                                          |
|         │                                                               |
|         ▼ (api-extractor run)                                           |
|  dist/index.d.ts  (Clean, single-file public API contract with          |
|                    all @internal types stripped out!)                   |
+-------------------------------------------------------------------------+
```

---

### 2.2 Automated Type Testing & Quality Auditing

Testing a library's runtime behavior with Jest or Vitest only verifies half of your contract. You must also write automated tests verifying that your types fail when they should and infer correctly when they should.

#### 1. `@arethetypeswrong/cli` (`attw`)
`attw` is the industry-standard linter for published packages. It checks every combination of Node.js and TypeScript resolution modes:
- `node10` (legacy CJS)
- `node16` (ESM)
- `node16` (CJS)
- `bundler`

It flags common errors like:
- Masquerading as CJS when compiled as ESM
- Missing export conditions
- Broken declaration file specifiers

#### 2. `expect-type` / `tsd`
```typescript
import { expectTypeOf } from "expect-type";
import { createClient, QueryResult } from "./index.js";

// Positive test: Verify inferred type matches expected interface
const client = createClient({ timeout: 5000 });
expectTypeOf(client.query("SELECT * FROM users")).toEqualTypeOf<Promise<QueryResult>>();

// Negative test: Verify compiler rejects invalid configuration
// @ts-expect-error - Port must be a number, not string
createClient({ port: "8080" });
```

---

### 2.3 Module Federation & Micro-Frontend Remote Types

In modern enterprise architectures (Module Federation in Webpack 5 or `@module-federation/enhanced`), micro-frontends share components and business logic dynamically at runtime across independent deployments.

```
+-------------------------------------------------------------------------+
|                  Micro-Frontend Module Federation Topology              |
+-------------------------------------------------------------------------+
|  [Host App: Checkout Shell]                                             |
|     │                                                                   |
|     ├── Dynamically loads Remote Component over HTTP                    |
|     ▼                                                                   |
|  [Remote App: Payment Microservice] (deployed at payment.corp.com)      |
|     ├── remoteEntry.js (Runtime code)                                   |
|     └── @mf-types.zip  (Compiled TypeScript declarations)                |
+-------------------------------------------------------------------------+
```

#### TypeScript Federation Plugins:
Tools like `@module-federation/typescript` automatically:
1. Extract exposed component types into a zip file (`@mf-types.zip`).
2. Serve the types alongside `remoteEntry.js`.
3. Download and register the remote types in the host application's `node_modules/@mf-types/payment`, providing instant IntelliSense and compile-time type safety across micro-frontends!

---

### 2.4 Semantic Versioning (SemVer) for Types

A common misconception is that type changes cannot break production. In TypeScript, a type change can cause consumer CI/CD pipelines to fail:

| Type System Modification | SemVer Impact | Why? |
| :--- | :--- | :--- |
| Adding an optional property `opts?: { retries?: number }` | **MINOR** | Non-breaking; existing consumer calls remain valid. |
| Adding a required property `opts: { apiKey: string }` | **MAJOR** | Breaking; causes compiler errors at all call sites without `apiKey`. |
| Widening a return type (`string` $\to$ `string \| null`) | **MAJOR** | Breaking; consumers doing `res.toUpperCase()` will fail to compile. |
| Narrowing an input parameter type (`string \| number` $\to$ `string`) | **MAJOR** | Breaking; callers passing `number` will fail compilation. |
| Deprecating a type with JSDoc `@deprecated` | **MINOR** | Non-breaking; produces IDE warning but code compiles. |
| Removing a previously deprecated type or interface | **MAJOR** | Breaking; missing symbol error. |


---

## 3. Comprehensive Questions & Answers (Part 1: Questions 1 to 45)

### Q1: What is the purpose of `package.json` `"exports"` and how does it differ from the legacy `"main"` field?
**Answer:**  
`"main"` provides a single file path for CommonJS resolution (`require("pkg")`). It has no encapsulation: consumers can import any internal file (e.g. `import "pkg/dist/internal/hack.js"`).  
`"exports"` provides:
1. **Encapsulation**: Any file not explicitly listed in `"exports"` cannot be imported by consumers (throws `ERR_PACKAGE_PATH_NOT_EXPORTED`).
2. **Conditional Resolution**: Resolves different files depending on the environment (ESM `import`, CJS `require`, TypeScript `types`, browser vs node).
3. **Subpath Mapping**: Clean public aliases like `import "@corp/sdk/auth"`.

---

### Q2: Why is `"types"` required to be the first key in each `"exports"` condition block?
**Answer:**  
Modern tools evaluate condition keys in insertion order. If `"import"` appears before `"types"`, TypeScript's module resolution algorithm may match the `"import"` condition first and read the compiled `.js` file, failing to discover the `.d.ts` declaration file. Placing `"types"` first guarantees type definitions are always discovered.

---

### Q3: What is the Dual-Package Hazard, and what are its symptoms?
**Answer:**  
The Dual-Package Hazard occurs when an application loads both the CommonJS (`dist/index.cjs`) and ECMAScript Module (`dist/index.js`) versions of a library in the same runtime process.  
Symptoms:
1. Global singletons (like stores or caches) are instantiated twice, causing state desynchronization.
2. `instanceof` checks fail: `obj instanceof MyError` evaluates to `false` if `obj` was created by the CJS build and checked by ESM code.
3. Multiple database or socket connections are opened inadvertently.

---

### Q4: How do you solve the Dual-Package Hazard for stateful classes?
**Answer:**  
Store singleton references on `globalThis` using a unique `Symbol.for`:
```typescript
const KEY = Symbol.for("my-pkg/unique_singleton");
const g = globalThis as unknown as { [KEY]?: MyStore };
if (!g[KEY]) {
  g[KEY] = new MyStore();
}
export const store = g[KEY];
```
Regardless of how many times CJS or ESM copies are loaded, they access the identical memory address.

---

### Q5: What is `typesVersions` in `package.json`?
**Answer:**  
A legacy feature introduced in TypeScript 3.1 that allows providing different `.d.ts` files for different TypeScript versions (e.g. `<4.5` vs `>=4.5`):
```json
{
  "typesVersions": {
    "<4.5": { "*": ["ts3.4/*"] }
  }
}
```
Before `exports` supported the `"types"` condition, `typesVersions` was also used for subpath type resolution.

---

### Q6: What does `@arethetypeswrong/cli` (`attw`) test?
**Answer:**  
It inspects published or packed npm tarballs against all permutations of Node.js and TypeScript module resolution algorithms:
- `node10` (CommonJS legacy)
- `node16` (Node ESM)
- `node16` (Node CJS)
- `bundler` (Vite, webpack)
It checks for broken entrypoints, ESM/CJS masquerading, and missing export conditions.

---

### Q7: Why should library authors prefer `@ts-expect-error` over `@ts-ignore` in type test suites?
**Answer:**  
- `@ts-ignore` silences any error on the next line unconditionally. If the library code changes in the future and the line becomes valid, `@ts-ignore` remains silent.
- `@ts-expect-error` requires that the next line produces a compiler error. If the line unexpectedly compiles without an error, the compiler raises an error (`Unused '@ts-expect-error' directive`), catching regressions in negative tests!

---

### Q8: What is `expect-type` / `expectTypeOf`?
**Answer:**  
A zero-runtime type-testing utility that performs compile-time assertions on inferred types:
```typescript
import { expectTypeOf } from "expect-type";
expectTypeOf(fetchUser("123")).toEqualTypeOf<Promise<UserDTO>>();
expectTypeOf(fetchUser).parameter(0).toBeString();
```

---

### Q9: Why is `"sideEffects": false` in `package.json` critical for library authors?
**Answer:**  
It tells bundlers (Vite, Rollup, webpack) that none of the files in your library execute top-level side effects (like modifying prototypes or registering global event listeners). This allows the bundler to safely tree-shake and discard unused exported functions.

---

### Q10: How do you declare files with side effects when `"sideEffects"` is used?
**Answer:**  
Pass an array of glob paths:
```json
{
  "sideEffects": [
    "dist/polyfills.js",
    "*.css"
  ]
}
```

---

### Q11: What is Declaration Bundling (or Declaration Rollup)?
**Answer:**  
The process of combining dozens of scattered `.d.ts` files into a single, unified `.d.ts` file using tools like `@microsoft/api-extractor` or `rollup-plugin-dts`.

---

### Q12: Why is publishing `declarationMap: true` without publishing source files bad practice?
**Answer:**  
If a library package includes `.d.ts.map` files, the sourcemap points to original `.ts` source files (e.g. `../src/index.ts`). If the library's `package.json` `"files"` array does not include `src/`, pressing F12 in consumer IDEs will attempt to open a non-existent file, resulting in an error. Always include `src/` in `"files"` if publishing declaration maps!

---

### Q13: What is the purpose of `@internal` in library authoring?
**Answer:**  
It marks internal classes, methods, or helper types that must be exported across files within the library repo, but should be stripped out of the public `.d.ts` declaration files before publishing to npm.

---

### Q14: How does `@microsoft/api-extractor` handle `@internal` declarations?
**Answer:**  
When configured with `api-extractor.json`, it generates two declaration rollups:
1. `publicTrimmedFilePath`: Contains only public API declarations, completely stripping `@internal` symbols.
2. `untrimmedFilePath`: Contains the full declaration tree for internal consumption.

---

### Q15: What is Module Federation in Webpack 5?
**Answer:**  
An architectural pattern allowing multiple independent JavaScript builds to form a single application at runtime. Different teams can develop, build, and deploy micro-frontends independently while sharing dependencies and components seamlessly.

---

### Q16: How are TypeScript types shared in Module Federation?
**Answer:**  
Through plugins like `@module-federation/typescript`:
1. The remote build extracts exported types and zips them into `@mf-types.zip`.
2. The host build downloads `@mf-types.zip` at build/development time and registers ambient module declarations for the remote imports (e.g. `declare module "remoteApp/Button"`).

---

### Q17: What does `shared: { react: { singleton: true, requiredVersion: "^18.0.0" } }` mean in Module Federation?
**Answer:**  
It instructs the Module Federation runtime to ensure that only a single instance of `react` is loaded in memory across all host and remote micro-frontends, preventing React hooks from breaking due to duplicate React instances.

---

### Q18: What is SemVer for TypeScript types?
**Answer:**  
A set of conventions determining whether a change in type signatures constitutes a Patch, Minor, or Major release:
- **Major**: Adding required parameters, removing properties, narrowing parameter types, widening return types.
- **Minor**: Adding optional parameters, adding properties to return types, widening parameter types.
- **Patch**: Internal refactoring with identical external type contracts.

---

### Q19: Why is narrowing an input parameter a breaking change?
**Answer:**  
If a function previously accepted `number | string` and is changed to accept only `number`, any existing consumer calling `fn("123")` will experience a compiler error upon upgrading the library.

---

### Q20: Why is widening a return type a breaking change?
**Answer:**  
If a function previously returned `User` and is changed to return `User | null`, any consumer code calling `fn().id` will fail compilation because the return value might now be `null`.

---

### Q21: What is the `prepublishOnly` npm script?
**Answer:**  
A script executed by npm automatically right before `npm publish` runs:
```json
{
  "scripts": {
    "prepublishOnly": "npm run clean && npm run build && npm run test:types"
  }
}
```
Ensures that the library is compiled, type-checked, and tested before artifacts are uploaded to the npm registry.

---

### Q22: What is the purpose of the `"files"` array in `package.json`?
**Answer:**  
A whitelist of files and folders to include in the published npm tarball (e.g. `["dist", "README.md", "LICENSE"]`). Excludes temporary files, local configs, and tests, keeping the package download lightweight.

---

### Q23: Why should libraries NEVER include global polyfills (e.g. `core-js` or `reflect-metadata` imports) in their entry points?
**Answer:**  
Because importing a library that pollutes global prototypes or globals can break the consumer application or conflict with other libraries. Polyfilling is strictly the responsibility of the end application, not libraries.

---

### Q24: What is `peerDependencies` vs `dependencies` in library authoring?
**Answer:**  
- `dependencies`: Packages required by the library that will be installed automatically for the consumer.
- `peerDependencies`: Packages expected to be provided by the consumer application (e.g. `react`, `typescript`). Prevents duplicate versions from being installed in `node_modules`.

---

### Q25: What is `peerDependenciesMeta` with `"optional": true`?
**Answer:**  
Allows marking a peer dependency as optional:
```json
{
  "peerDependencies": {
    "ioredis": "^5.0.0"
  },
  "peerDependenciesMeta": {
    "ioredis": { "optional": true }
  }
}
```
Consumers only install `ioredis` if they choose to use the Redis cache adapter feature of your library.

---

### Q26: What is a Subpath Pattern in `package.json` `"exports"`?
**Answer:**  
Allows exporting an entire directory of modules with pattern matching:
```json
"exports": {
  "./icons/*": {
    "types": "./dist/types/icons/*.d.ts",
    "import": "./dist/esm/icons/*.js",
    "require": "./dist/cjs/icons/*.cjs"
  }
}
```

---

### Q27: What is the risk of using wildcard subpath exports without explicit extension mappings?
**Answer:**  
If the pattern allows importing without extensions (e.g. `import "@pkg/icons/home"`), bundlers might resolve it, but native Node.js ESM will fail because Node requires exact file extensions.

---

### Q28: How do you publish a library with both CommonJS (`.cjs`) and ESM (`.mjs` / `.js`) files?
**Answer:**  
Set `"type": "module"` in `package.json`. Emitted ESM files have `.js` extensions, and emitted CommonJS files have `.cjs` extensions. The `"exports"` map points `"import"` to `.js` and `"require"` to `.cjs`.

---

### Q29: What is `npm pack --dry-run`?
**Answer:**  
Simulates creating an npm tarball and lists every single file that would be included in the published package, allowing authors to verify that sensitive files or unwanted tests are excluded.

---

### Q30: What is `tsup`?
**Answer:**  
A zero-config, blazingly fast bundler for TypeScript libraries powered by esbuild. It generates CJS, ESM, and `.d.ts` declaration rollups with a single command: `tsup src/index.ts --format cjs,esm --dts`.

---

### Q31: What is `publint`?
**Answer:**  
A static analysis tool that lints `package.json` to ensure `"exports"` and `"main"` fields conform to modern packaging standards across npm, Node, and Vite.

---

### Q32: What is the difference between `dts-bundle-generator` and `rollup-plugin-dts`?
**Answer:**  
- `dts-bundle-generator`: A standalone CLI tool that resolves all imports and produces a single bundled `.d.ts` file without needing Rollup.
- `rollup-plugin-dts`: A Rollup plugin that integrates declaration bundling directly into a Rollup or Vite build pipeline.

---

### Q33: How do you type an ambient global library without any module exports?
**Answer:**  
Create a `.d.ts` file without top-level `import` or `export` statements, using `declare var` or `declare interface`:
```typescript
interface AnalyticsSDK {
  track(event: string): void;
}
declare var analytics: AnalyticsSDK;
```

---

### Q34: What is `isolatedDeclarations` impact on library authors?
**Answer:**  
Requires all exported methods and variables to have explicit return types, allowing multi-threaded toolchains (like oxc or swc) to generate `.d.ts` files up to 20x faster.

---

### Q35: How do you provide backwards-compatible CommonJS default exports in TypeScript?
**Answer:**  
Use `export = MyClass;` instead of `export default MyClass;` if targeting pure legacy CJS where consumers expect `const MyClass = require("pkg");` rather than `require("pkg").default`.

---

### Q36: What is the "Wrapper Pattern" for hybrid CJS/ESM libraries?
**Answer:**  
Author the core library in pure ESM. Then create a small `index.cjs` file that uses dynamic `import()` or wraps the ESM build, ensuring code is not duplicated.

---

### Q37: How do you verify that your library tree-shakes properly?
**Answer:**  
Use tools like `bundlejs.com` or `agadoo` to inspect whether importing a single utility from your library bundles the entire package or just that utility.

---

### Q38: What is `npm provenance`?
**Answer:**  
A security mechanism linking an npm package to its source repository and GitHub Actions build workflow via Sigstore cryptographic signatures, proving the package was built from verified source code.

---

### Q39: What is `packageManager` field in `package.json`?
**Answer:**  
Enforces the exact package manager and version (e.g. `"packageManager": "pnpm@9.1.0"`), used by Corepack to prevent developers from accidentally running `npm` or `yarn`.

---

### Q40: What is `tsd` and how does it execute type assertions?
**Answer:**  
`tsd` checks `.test-d.ts` files using the TypeScript compiler API:
```typescript
import { expectType, expectError } from "tsd";
expectType<string>(formatDate(new Date()));
expectError(formatDate("not-a-date"));
```

---

### Q41: How do you handle deprecated features gracefully in library types?
**Answer:**  
Annotate them with JSDoc `@deprecated` explaining the replacement:
```typescript
/**
 * @deprecated Use `createSecureClient()` instead. Will be removed in v2.0.0.
 */
export function createClient(): Client { ... }
```

---

### Q42: What does `git tag v1.0.0` have to do with npm releases?
**Answer:**  
Release automation tools (like Changesets, Semantic Release, or Release Please) watch for git tags or conventional commits to bump versions, generate changelogs, and publish to npm automatically.

---

### Q43: How do you type dynamic plugin systems in TypeScript libraries?
**Answer:**  
Use interface merging or generic registration registries:
```typescript
export interface PluginRegistry {}
export function registerPlugin<K extends keyof PluginRegistry>(
  name: K,
  plugin: PluginRegistry[K]
): void;
```

---

### Q44: What is the danger of publishing `dependencies` as `devDependencies`?
**Answer:**  
The library will work locally for the author because `devDependencies` are installed in the author's repo. But when a consumer installs the library from npm, `devDependencies` are omitted, causing `Cannot find module` runtime crashes!

---

### Q45: What is the ultimate checklist for publishing an enterprise TypeScript library?
**Answer:**  
1. Strict `tsconfig.json` with declaration and declarationMap.
2. Explicit `"exports"` with `"types"` first.
3. Automated type testing with `expect-type` or `tsd`.
4. Automated linting with `attw` and `publint`.
5. CI/CD publishing with `prepublishOnly` and npm provenance.


---

## 4. Comprehensive Questions & Answers (Part 2: Questions 46 to 90)

### Q46: How do you configure `package.json` `"exports"` for React Server Components (`"use client"` vs `"use server"`)?
**Answer:**  
Modern frameworks (Next.js, Remix) support conditional exports based on environment conditions `"react-server"`:
```json
"exports": {
  ".": {
    "types": "./dist/types/index.d.ts",
    "react-server": "./dist/esm/index.server.js",
    "default": "./dist/esm/index.client.js"
  }
}
```
This ensures server components receive the server-optimized implementation without browser DOM dependencies.

---

### Q47: What is Changesets and why is it preferred in monorepos?
**Answer:**  
Changesets is a multi-package versioning and release tool:
1. Developers run `pnpm changeset` when adding a PR, creating a markdown file describing the change and whether it is `patch`, `minor`, or `major`.
2. On merge, Changesets aggregates changes, bumps versions across dependent monorepo packages, updates CHANGELOG.md files, and automates publishing via GitHub Actions.

---

### Q48: What is the purpose of the `"publishConfig"` field in `package.json`?
**Answer:**  
Overrides `package.json` fields specifically during `npm publish`:
```json
{
  "publishConfig": {
    "access": "public",
    "registry": "https://registry.npmjs.org/",
    "main": "./dist/index.cjs",
    "module": "./dist/index.js"
  }
}
```
Allows packages to use local development paths in the repo but clean distribution paths when published.

---

### Q49: How do you support Node.js and Browser environments conditionally in `"exports"`?
**Answer:**  
Use `"node"` and `"browser"` conditions:
```json
"exports": {
  ".": {
    "types": "./dist/types/index.d.ts",
    "node": {
      "import": "./dist/esm/node.js",
      "require": "./dist/cjs/node.cjs"
    },
    "browser": {
      "import": "./dist/esm/browser.js"
    },
    "default": "./dist/esm/node.js"
  }
}
```

---

### Q50: How should `import.meta.url` be handled in universal libraries?
**Answer:**  
In pure ESM, `import.meta.url` provides the URL of the current module. In CommonJS, `import.meta` is a syntax error!  
If authoring a dual library:
- In CJS, use `__dirname` or `path.resolve()`.
- Or use a build tool like `tsup` that automatically shims `import.meta.url` for CommonJS builds.

---

### Q51: What is DefinitelyTyped and when should a library author use it?
**Answer:**  
DefinitelyTyped (`@types/*`) is a community repository for type definitions of third-party libraries that do not bundle their own types.  
**Rule**: If you author a new library in TypeScript, **never** publish to DefinitelyTyped! Bundle your `.d.ts` files directly inside your npm package under `"types"` in `package.json`.

---

### Q52: What is the difference between `unbuild` and `tsup`?
**Answer:**  
- `tsup`: Bundles code using esbuild; ultra-fast, handles CJS/ESM and `.d.ts` via rollup-plugin-dts.
- `unbuild`: A unified build system by UnJS/Nuxt powered by Rollup and mkdist. Supports auto-generating declaration files, stubbing for instant local development, and ESM-first packaging.

---

### Q53: What are "Stub builds" in library development (`jiti` / `unbuild --stub`)?
**Answer:**  
Instead of compiling source files to `dist/`, a stub build writes small proxy files into `dist/` that use JIT TypeScript compilation (via `jiti` or `tsx`). Changes made in `src/` are reflected instantly in consuming local test apps without running a rebuild!

---

### Q54: How do you prevent users from accessing internal private functions when not using `"exports"`?
**Answer:**  
Without `"exports"`, consumers can import any file in `dist/`. The modern fix is strictly adopting `"exports"` in `package.json`, which makes internal paths completely unresolvable.

---

### Q55: How do you test whether your published library works with TypeScript 4.8 and 5.3?
**Answer:**  
Use a test matrix in GitHub Actions running `npm test` against multiple TypeScript versions:
```yaml
strategy:
  matrix:
    ts-version: ['4.8.4', '5.0.4', '5.3.3', '5.5.0']
```
Or run `tsd` configured with target TypeScript versions.

---

### Q56: What is the impact of function overload order on consumers?
**Answer:**  
TypeScript resolves function overloads from top to bottom, picking the **first matching signature**:
```typescript
// Specific overloads MUST come first!
function parse(input: string): string[];
function parse(input: any): any;
```
If the general overload (`any`) is placed first, it catches all calls, rendering more specific overloads unreachable.

---

### Q57: How do you declare deprecations with code actions in IDEs?
**Answer:**  
Use JSDoc `@deprecated` with clear migration guidance:
```typescript
/**
 * @deprecated Since v2.1.0. Migrate to `Client.connect()`:
 * ```typescript
 * const client = await Client.connect({ url });
 * ```
 */
export function init(url: string): Client { ... }
```

---

### Q58: What is `agadoo`?
**Answer:**  
A CLI tool that checks whether an npm package can be tree-shaken by a bundler like Rollup. It flags top-level side effects that prevent code elimination.

---

### Q59: How do you design extensible options objects in library APIs?
**Answer:**  
Use generic type parameters with defaults:
```typescript
export interface RequestOptions<TExtra = Record<string, unknown>> {
  timeout?: number;
  retries?: number;
  extra?: TExtra;
}
```

---

### Q60: What are Branded Types and how do they benefit library consumers?
**Answer:**  
Branded types prevent accidental parameter swapping (e.g. passing a `UserId` where an `OrderId` was expected) by adding a phantom type tag:
```typescript
export type UserId = string & { readonly __brand: unique symbol };
export type OrderId = string & { readonly __brand: unique symbol };
```

---

### Q61: What is the difference between `peerDependencies` and `optionalDependencies`?
**Answer:**  
- `peerDependencies`: Requires the host app to provide the package at a compatible version.
- `optionalDependencies`: Packages that npm attempts to install, but if installation fails (e.g. native C++ compilation failure on certain OSs), npm continues without erroring.

---

### Q62: Why should library authors avoid exporting namespace declarations?
**Answer:**  
Namespaces cannot be effectively tree-shaken by modern bundlers and do not interoperate cleanly with native ECMAScript module imports. Prefer named ES module exports.

---

### Q63: How do you preserve JSDoc comments in emitted `.d.ts` files?
**Answer:**  
Ensure `"removeComments": false` is set in `tsconfig.json`. This keeps all documentation, `@param`, `@returns`, and `@example` annotations intact in published declaration files.

---

### Q64: What is the `exports` wildcard syntax and its limitation?
**Answer:**  
Syntax: `"./*": "./dist/*.js"`.  
Limitation: Does not automatically map `.d.ts` files unless a parallel `"types"` condition with wildcard matching is declared.

---

### Q65: How do you verify that your library package contains no secret files (`.env`, `.git`) before publishing?
**Answer:**  
Run `npm pack --dry-run` and inspect the tarball file list, or inspect the `"files"` field in `package.json`.

---

### Q66: What is `sourceMap: true` vs `declarationMap: true` in published libraries?
**Answer:**  
- `sourceMap: true`: Links emitted `.js` files to `.ts` files for runtime debugging (stack traces).
- `declarationMap: true`: Links `.d.ts` files to `.ts` files for IDE navigation ("Go to Definition").

---

### Q67: What is the difference between `typesVersions` and `exports["./*"].types`?
**Answer:**  
`exports` is the modern standard supported by Node 12+ and TS 4.7+. `typesVersions` is the legacy mechanism used by TypeScript prior to version 4.7.

---

### Q68: How do you write a custom type-testing assertion using conditional types?
**Answer:**  
```typescript
type Expect<T extends true> = T;
type Equal<X, Y> = (<T>() => T extends X ? 1 : 2) extends (<T>() => T extends Y ? 1 : 2) ? true : false;

type Test1 = Expect<Equal<string, string>>; // Compiles!
// type Test2 = Expect<Equal<string, number>>; // Type Error!
```

---

### Q69: What is `bundle-analyzer` and how is it used in library authoring?
**Answer:**  
Generates a visual treemap of bundle sizes, allowing authors to detect accidentally bundled heavy dependencies (e.g. `lodash` or `moment`).

---

### Q70: Why should you avoid `import * as pkg from "pkg"` in library internals?
**Answer:**  
It can prevent tree-shaking by treating the imported library as a monolithic object. Use specific named imports (`import { map } from "pkg"`).

---

### Q71: How do you handle circular types across library modules?
**Answer:**  
Extract shared interfaces into a centralized `types.ts` file, and use `import type` to break circular value dependencies.

---

### Q72: What does `npx attw --pack .` do?
**Answer:**  
Packs the current directory into an npm tarball and runs `@arethetypeswrong/cli` against the exact archive that would be published to npm.

---

### Q73: What is the Dual-Package Hazard's effect on symbol identity?
**Answer:**  
`Symbol("foo") !== Symbol("foo")`. If Module A creates a symbol and Module B creates another instance of the module, their symbols do not match! Use `Symbol.for("foo")` for global symbol registry consistency.

---

### Q74: What is the purpose of `.npmignore` vs `"files"`?
**Answer:**  
- `.npmignore` uses a blacklist approach: everything is published except ignored files. (Dangerous: new files might accidentally be published).
- `"files"` in `package.json` uses a whitelist approach: ONLY listed folders are published. (Best practice).

---

### Q75: How do you expose a CLI binary in a TypeScript library?
**Answer:**  
Add the `"bin"` field in `package.json` pointing to a compiled JavaScript file with a shebang (`#!/usr/bin/env node`):
```json
{
  "bin": {
    "my-cli": "./dist/cli.js"
  }
}
```

---

### Q76: How do you test that your library works in a pure CommonJS project without ESM?
**Answer:**  
Create a test directory with `package.json` lacking `"type": "module"`, and write a script using `const lib = require("my-lib")`. Run it with `node test.cjs`.

---

### Q77: What is the difference between `tsup`'s `--dts` and `--dts-resolve`?
**Answer:**  
- `--dts`: Generates `.d.ts` files preserving external module imports.
- `--dts-resolve`: Bundles internal and external declaration types into the final `.d.ts` file.

---

### Q78: How do you declare optional features in TypeScript libraries?
**Answer:**  
Provide dedicated subpaths (e.g. `my-lib/redis` or `my-lib/s3`) with optional peer dependencies, so consumers only import and type what they use.

---

### Q79: What is `stripInternal`'s effect on bundle size?
**Answer:**  
It reduces the file size of published `.d.ts` files by removing non-public API type signatures and documentation.

---

### Q80: What is the danger of publishing unminified CJS along with minified ESM?
**Answer:**  
Consumers using legacy bundlers or Node CJS may inadvertently ship bloated, unminified code into their production bundles.

---

### Q81: What is `publint`'s "has dual package hazard" warning?
**Answer:**  
Warns that a package exports both CJS and ESM entrypoints without utilizing the stateful wrapper pattern or global symbol registry.

---

### Q82: How do you type an EventEmitter in a public library interface?
**Answer:**  
Use typed event maps with strict generic dispatchers:
```typescript
export interface TypedEmitter<TEvents extends Record<string, any>> {
  on<E extends keyof TEvents>(event: E, listener: (arg: TEvents[E]) => void): this;
  emit<E extends keyof TEvents>(event: E, arg: TEvents[E]): boolean;
}
```

---

### Q83: Why is `export type * from "./types"` better than `export * from "./types"`?
**Answer:**  
It guarantees that all symbols from `./types` are strictly type-only, allowing build tools to completely elide the re-export from runtime JavaScript.

---

### Q84: What is `release-it`?
**Answer:**  
A CLI tool that automates semantic version bumping, git tagging, commit creation, and npm publishing.

---

### Q85: What does `npm login --auth-type=web` do?
**Answer:**  
Authenticates the CLI to npm using modern browser-based web authentication with Two-Factor Authentication (2FA).

---

### Q86: How do you type middleware pipelines in public library APIs?
**Answer:**  
Use generic state accumulator types or tuple transformations:
```typescript
export type Middleware<TContext> = (ctx: TContext, next: () => Promise<void>) => Promise<void>;
```

---

### Q87: What is the risk of using `any` in a public library return type?
**Answer:**  
It infects the consumer's entire codebase, disabling type safety wherever the return value is used. Always use `unknown` if the type is indeterminate.

---

### Q88: How do you support Node.js native fetch in libraries targeting both Node 18+ and Node 16?
**Answer:**  
Avoid bundling `node-fetch`. Detect global `fetch`:
```typescript
const fetchFn = typeof globalThis.fetch === "function" ? globalThis.fetch : undefined;
```
And document that older Node versions require a global polyfill.

---

### Q89: What is `@types/node` version mismatch hazard?
**Answer:**  
If a library has `@types/node` in `dependencies`, it might force a newer Node.js type definition onto a consumer targeting an older Node version, causing global type collisions. Always place `@types/node` in `devDependencies`.

---

### Q90: What is the Golden Rule of TypeScript Library Design?
**Answer:**  
**"Design for inference, verify with tests, encapsulate with exports, and respect SemVer."**


---

## 5. Output Prediction Puzzles & Packaging Diagnostics (15 Puzzles)

```typescript
// ============================================================================
// PUZZLE 1: Condition Order Hazard in package.json
// ============================================================================
// File: package.json
/*
{
  "name": "calc-lib",
  "exports": {
    ".": {
      "import": "./dist/index.js",
      "types": "./dist/index.d.ts"
    }
  }
}
*/
// Question: Under TypeScript 5.0 with moduleResolution: "node16", what happens
// when a consumer writes: import { add } from "calc-lib";?

/**
 * COMPILER DIAGNOSTIC & TRACE:
 * 1. Under "node16", TypeScript checks condition keys in exact document order.
 * 2. Because "import" precedes "types", TS may resolve the JS file first and
 *    fail to locate "index.d.ts", reporting error TS7016: Could not find declaration file.
 * 3. Fix: Always place "types" as the very first condition in the object.
 */


// ============================================================================
// PUZZLE 2: Dual-Package State Fracture
// ============================================================================
class CacheStore {
  private static inst: CacheStore;
  public data = new Map<string, string>();
  public static get(): CacheStore {
    if (!this.inst) this.inst = new CacheStore();
    return this.inst;
  }
}

// Module A (loaded via ESM):
const storeA = CacheStore.get();
storeA.data.set("session_1", "active");

// Module B (loaded via CJS in same process):
// In Dual-Package Hazard, Module B evaluates its own isolated class:
const storeB = CacheStore.get();
console.log(storeB.data.has("session_1"));

/**
 * RUNTIME TRACE & OUTPUT:
 * 1. ESM and CJS bundles maintain separate static variable memory spaces.
 * 2. storeA !== storeB.
 * 3. storeB.data has not received "session_1".
 * Output: false! (Catastrophic cache desynchronization).
 */


// ============================================================================
// PUZZLE 3: Symbol.for Singleton Healing
// ============================================================================
const CACHE_KEY = Symbol.for("app/cache_singleton");
const globalRef = globalThis as unknown as { [CACHE_KEY]?: Map<string, string> };
if (!globalRef[CACHE_KEY]) globalRef[CACHE_KEY] = new Map();
const unifiedCache = globalRef[CACHE_KEY];

unifiedCache.set("token", "secret_123");

// In CJS loaded copy:
const secondaryRef = (globalThis as any)[Symbol.for("app/cache_singleton")];
console.log(secondaryRef.get("token"));

/**
 * RUNTIME TRACE & OUTPUT:
 * 1. Symbol.for looks up the global symbol registry shared across all realms.
 * 2. Both ESM and CJS access the identical Map instance on globalThis.
 * Output: "secret_123"
 */


// ============================================================================
// PUZZLE 4: Unused @ts-expect-error Regression
// ============================================================================
// Test File: test/types.test.ts
function setPort(port: number): void {}

// Line 1:
// @ts-expect-error - port should only be number
setPort(8080); // Wait, 8080 IS a number!

/**
 * COMPILER DIAGNOSTIC & TRACE:
 * 1. `@ts-expect-error` instructs the compiler to expect a type error on the next line.
 * 2. Because `setPort(8080)` is completely valid, no error occurs.
 * 3. The compiler raises: Error TS2578: Unused '@ts-expect-error' directive.
 * 4. This immediately alerts the engineer that their test or type contract is wrong!
 */


// ============================================================================
// PUZZLE 5: Encapsulation Breach Prevention with "exports"
// ============================================================================
// Package: @corp/sdk
// package.json:
/*
{
  "name": "@corp/sdk",
  "exports": {
    "./client": "./dist/client.js"
  }
}
*/
// Consumer tries:
// import { internalHelper } from "@corp/sdk/dist/internal/helper.js";

/**
 * RUNTIME / COMPILER DIAGNOSTIC & TRACE:
 * 1. The presence of "exports" strictly locks down the package folder.
 * 2. Node.js throws: Error [ERR_PACKAGE_PATH_NOT_EXPORTED]: Package subpath
 *    './dist/internal/helper.js' is not defined by "exports" in package.json.
 * 3. TypeScript raises: TS2307: Cannot find module '@corp/sdk/dist/internal/helper.js'.
 */


// ============================================================================
// PUZZLE 6: SemVer Type Invariant: Widening Return Type
// ============================================================================
// Library Version 1.0.0:
export function findUser(id: string): { id: string; name: string } {
  return { id, name: "Alice" };
}

// Library Version 1.1.0 (Author thought this was a non-breaking Minor update):
export function findUserV2(id: string): { id: string; name: string } | null {
  return null;
}

// Consumer Code:
// const user = findUser("1");
// console.log(user.name.toUpperCase());

/**
 * SEMVER IMPACT & TRACE:
 * 1. Consumer code expected a non-null object.
 * 2. Widening the return type to include `null` causes Compile Error TS18047:
 *    'user' is possibly 'null' across all consumer call sites.
 * 3. Verdict: Widening return types is ALWAYS A BREAKING MAJOR CHANGE!
 */


// ============================================================================
// PUZZLE 7: SemVer Type Invariant: Narrowing Parameter
// ============================================================================
// Version 1.0.0:
export function logMessage(msg: string | number): void {}

// Version 1.1.0:
export function logMessageV2(msg: string): void {}

// Consumer Code:
// logMessage(404);

/**
 * SEMVER IMPACT & TRACE:
 * 1. In v1.0.0, passing a number was completely valid.
 * 2. In v2, parameter types are contravariant: narrowing accepted inputs
 *    breaks existing consumers passing numbers.
 * 3. Verdict: Narrowing parameters is ALWAYS A BREAKING MAJOR CHANGE!
 */


// ============================================================================
// PUZZLE 8: Branded Type Parameter Safety
// ============================================================================
type AccountId = string & { readonly __brand: unique symbol };
type TransferId = string & { readonly __brand: unique symbol };

function processTransfer(acc: AccountId, tx: TransferId): void {
  console.log(`Processing tx ${tx as string} for account ${acc as string}`);
}

const myAccount = "acc_99" as AccountId;
const myTx = "tx_01" as TransferId;

// Call A: Correct order
processTransfer(myAccount, myTx);

// Call B: Swapped arguments!
// processTransfer(myTx, myAccount);

/**
 * COMPILER DIAGNOSTIC & TRACE:
 * 1. Without branding, both parameters are string, allowing accidental swaps.
 * 2. With branded types, Call B raises Error TS2345:
 *    Argument of type 'TransferId' is not assignable to parameter of type 'AccountId'.
 */


// ============================================================================
// PUZZLE 9: NodeNext Mandatory .js Extension
// ============================================================================
// In src/math.ts:
export const multiply = (a: number, b: number) => a * b;

// In src/index.ts (targeting moduleResolution: "nodenext"):
// import { multiply } from "./math";

/**
 * COMPILER DIAGNOSTIC & TRACE:
 * 1. NodeNext strictly mirrors Node ESM module resolution rules.
 * 2. Relative imports without an explicit extension are rejected.
 * 3. Error TS2835: Relative import paths need an explicit file extension.
 *    Did you mean './math.js'?
 */


// ============================================================================
// PUZZLE 10: @internal Property Stripping
// ============================================================================
export class ApiClient {
  public endpoint: string = "https://api.corp.com";

  /** @internal */
  public _secretSigningKey: string = "k_raw_secret";
}

// Question: What does the emitted dist/index.d.ts contain when compiled
// with stripInternal: true?

/**
 * DECLARATION EMIT TRACE:
 * 1. The compiler strips all AST nodes flagged with the `@internal` JSDoc tag.
 * 2. Emitted .d.ts:
 *    export declare class ApiClient {
 *      endpoint: string;
 *    }
 * 3. `_secretSigningKey` is completely absent from the published contract!
 */


// ============================================================================
// PUZZLE 11: Tree-Shaking and sideEffects: false
// ============================================================================
// In utils.ts:
export function usedHelper() { return "used"; }
export function heavyHelper() {
  console.log("Initializing huge 10MB dataset...");
  return "heavy";
}

// In app.ts:
// import { usedHelper } from "./utils.js";
// console.log(usedHelper());

/**
 * BUNDLER COMPILATION TRACE:
 * 1. With "sideEffects": false in package.json, Rollup/Vite/Webpack proves
 *    `heavyHelper` is never imported.
 * 2. It completely deletes `heavyHelper` from the final bundle.
 * 3. If sideEffects was true or omitted, the top-level initialization could
 *    be retained depending on bundler conservatism.
 */


// ============================================================================
// PUZZLE 12: Conditional Exports: Node vs Browser
// ============================================================================
// package.json:
/*
{
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "browser": "./dist/browser.js",
      "node": "./dist/node.js"
    }
  }
}
*/
// Question: What file is imported when this package is bundled by Vite for a web app?

/**
 * RESOLUTION TRACE:
 * 1. Vite configures export conditions to include ["browser", "import", "module"].
 * 2. The "browser" condition matches before "node".
 * 3. Vite bundles `./dist/browser.js` into the web application.
 */


// ============================================================================
// PUZZLE 13: Subpath Wildcard Types Mapping
// ============================================================================
// package.json:
/*
"exports": {
  "./icons/*": {
    "types": "./dist/icons/*.d.ts",
    "import": "./dist/icons/*.js"
  }
}
*/
// Consumer writes:
// import homeIcon from "my-pkg/icons/home.js";

/**
 * RESOLUTION TRACE:
 * 1. The wildcard `*` matches `"home.js"`.
 * 2. Types condition resolves to `./dist/icons/home.js.d.ts` (MISMATCH!).
 * 3. Fix: Use exact extensionless patterns or wildcard without .js suffix:
 *    "./icons/*": { "types": "./dist/icons/*.d.ts", "import": "./dist/icons/*.js" }
 *    and import "my-pkg/icons/home".
 */


// ============================================================================
// PUZZLE 14: Overload Signature Resolution Precedence
// ============================================================================
function formatInput(val: any): string;
function formatInput(val: Date): number;
function formatInput(val: any): any {
  return val instanceof Date ? val.getTime() : String(val);
}

const result = formatInput(new Date());
// Question: What is the type of `result`?

/**
 * COMPILER DIAGNOSTIC & TRACE:
 * 1. Overload signatures are matched from top to bottom.
 * 2. The first overload accepts `any`, which matches `Date`.
 * 3. TypeScript selects the first overload, typing `result` as `string`, NOT `number`!
 * 4. Rule: Specific overloads must ALWAYS precede general overloads.
 */


// ============================================================================
// PUZZLE 15: Module Federation Remote Type Augmentation
// ============================================================================
// File: remote-types.d.ts
declare module "remotePayment/CheckoutButton" {
  import React from "react";
  export interface CheckoutProps { amount: number; currency: "USD" | "EUR"; }
  const CheckoutButton: React.FC<CheckoutProps>;
  export default CheckoutButton;
}

// In Host App:
// import CheckoutButton from "remotePayment/CheckoutButton";
// <CheckoutButton amount={99} currency="USD" />;

/**
 * COMPILER TRACE:
 * 1. The ambient declaration provides complete compile-time type checking
 *    for dynamic HTTP module federation imports.
 * 2. Passing invalid props (e.g. currency="BTC") produces compile error TS2322.
 */
```


---

## 6. Enterprise Capstone Projects

```typescript
// ============================================================================
// PROJECT 1: Universal npm Package Specification & Linter Engine
// ============================================================================

/**
 * Architectural Overview:
 * Validates package.json configurations against modern Node.js and TypeScript
 * resolution invariants (mirroring publint and @arethetypeswrong/cli).
 * Flags condition precedence hazards, missing types, and dual-package risks.
 */

export interface ExportConditionGroup {
  types?: string;
  import?: string;
  require?: string;
  browser?: string;
  default?: string;
  [customKey: string]: string | undefined;
}

export interface PackageManifest {
  name: string;
  version: string;
  type?: "module" | "commonjs";
  main?: string;
  module?: string;
  types?: string;
  exports?: Record<string, ExportConditionGroup | string>;
  files?: string[];
  sideEffects?: boolean | string[];
}

export interface PackageAuditResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

export class PackageManifestAuditor {
  public static audit(manifest: PackageManifest): PackageAuditResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Rule 1: Exports presence
    if (!manifest.exports) {
      warnings.push("Package lacks modern 'exports' map. Internal files are not encapsulated.");
    } else {
      // Rule 2: Root export "." must exist
      if (!manifest.exports["."]) {
        errors.push("Missing root export '.' in 'exports' map.");
      } else {
        const rootExport = manifest.exports["."];
        if (typeof rootExport === "object") {
          // Rule 3: Condition Order Invariant - "types" MUST be first!
          const keys = Object.keys(rootExport);
          if (keys.includes("types") && keys[0] !== "types") {
            errors.push(
              "Condition Order Hazard: 'types' must be the FIRST key in the condition object to prevent resolution misdirection."
            );
          }

          // Rule 4: Dual package hazard warning
          if (rootExport.import && rootExport.require) {
            warnings.push(
              "Dual Package Hazard: Package exposes both ESM and CJS. Ensure stateful singletons use Symbol.for on globalThis."
            );
          }
        }
      }
    }

    // Rule 5: files whitelist
    if (!manifest.files || manifest.files.length === 0) {
      warnings.push("Package lacks 'files' whitelist. May accidentally publish tests or private source files.");
    }

    // Rule 6: sideEffects flag
    if (manifest.sideEffects === undefined) {
      warnings.push("Package lacks 'sideEffects' field. Bundlers cannot aggressively tree-shake unused exports.");
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings
    };
  }
}


// ============================================================================
// PROJECT 2: Automated Type-Testing Assertion Harness
// ============================================================================

/**
 * Architectural Overview:
 * A lightweight compile-time type testing harness implementing Type Assertions
 * (Equal, Extends, NotEqual) for automated regression testing of library types.
 */

export type TypeEqual<A, B> =
  (<T>() => T extends A ? 1 : 2) extends
  (<T>() => T extends B ? 1 : 2) ? true : false;

export type TypeExtends<Sub, Super> = Sub extends Super ? true : false;

export class TypeTestHarness {
  private passedTests = 0;
  private failedTests = 0;

  public assert<T extends true>(testName: string): void {
    console.log(`  ✔ Type Assertion Passed: [${testName}]`);
    this.passedTests++;
  }

  public report(): { passed: number; failed: number } {
    return { passed: this.passedTests, failed: this.failedTests };
  }
}


// ============================================================================
// PROJECT 3: Declaration Rollup & @internal API Stripper Pipeline
// ============================================================================

/**
 * Architectural Overview:
 * Simulates declaration bundling and API extraction (like @microsoft/api-extractor).
 * Parses raw TypeScript declaration entries, strips all declarations annotated
 * with @internal, and outputs a consolidated, public-only .d.ts rollup.
 */

export interface RawDeclarationNode {
  name: string;
  kind: "function" | "class" | "interface" | "type";
  signature: string;
  isInternal: boolean;
  jsdoc?: string;
}

export class DeclarationRollupEngine {
  private declarations: RawDeclarationNode[] = [];

  public register(node: RawDeclarationNode): void {
    this.declarations.push(node);
  }

  public bundlePublicDts(): string {
    const publicNodes = this.declarations.filter(n => !n.isInternal);

    const outputLines: string[] = [
      "// Universal Public Declaration Rollup",
      "// Stripped of all @internal symbols for enterprise security.",
      ""
    ];

    for (const node of publicNodes) {
      if (node.jsdoc) {
        outputLines.push(`/** ${node.jsdoc} */`);
      }
      outputLines.push(`export declare ${node.signature};`);
      outputLines.push("");
    }

    return outputLines.join("\n");
  }

  public getStrippedCount(): number {
    return this.declarations.filter(n => n.isInternal).length;
  }
}


// ============================================================================
// PROJECT 4: Micro-Frontend Module Federation Type Contract Registry
// ============================================================================

/**
 * Architectural Overview:
 * Manages remote micro-frontend module type contracts. Generates ambient
 * declarations for host apps consuming dynamic remote modules over HTTP.
 */

export interface RemoteComponentSpec {
  remoteName: string;
  modulePath: string; // e.g. "CheckoutButton"
  propsInterface: string;
  propsFields: Array<{ name: string; type: string; optional?: boolean }>;
}

export class ModuleFederationTypeRegistry {
  private components: RemoteComponentSpec[] = [];

  public registerRemote(spec: RemoteComponentSpec): void {
    this.components.push(spec);
  }

  public generateHostAmbientDeclarations(): string {
    const lines: string[] = [
      "// Auto-generated Module Federation Remote Type Declarations",
      "import React from 'react';",
      ""
    ];

    for (const comp of this.components) {
      const fullModuleSpecifier = `${comp.remoteName}/${comp.modulePath}`;
      lines.push(`declare module "${fullModuleSpecifier}" {`);
      lines.push(`  export interface ${comp.propsInterface} {`);

      for (const field of comp.propsFields) {
        const opt = field.optional ? "?" : "";
        lines.push(`    ${field.name}${opt}: ${field.type};`);
      }

      lines.push("  }");
      lines.push(`  const Component: React.FC<${comp.propsInterface}>;`);
      lines.push("  export default Component;");
      lines.push("}");
      lines.push("");
    }

    return lines.join("\n");
  }
}


// ============================================================================
// COMPREHENSIVE VERIFICATION TEST SUITE
// ============================================================================

export function runModuleVerificationTests(): boolean {
  console.log("=== Running TS-11 Production Verification Tests ===");

  // Test 1: Package Manifest Auditor - Valid Manifest
  const validAudit = PackageManifestAuditor.audit({
    name: "@enterprise/auth",
    version: "1.0.0",
    exports: {
      ".": {
        types: "./dist/index.d.ts",
        import: "./dist/index.js",
        require: "./dist/index.cjs"
      }
    },
    files: ["dist"],
    sideEffects: false
  });
  if (!validAudit.valid) throw new Error("Test 1 Failed: Valid manifest flagged as invalid!");
  console.log("✔ Test 1 Passed: Valid Manifest Verified");

  // Test 2: Package Manifest Auditor - Condition Order Hazard
  const invalidAudit = PackageManifestAuditor.audit({
    name: "@enterprise/bad",
    version: "1.0.0",
    exports: {
      ".": {
        import: "./dist/index.js",
        types: "./dist/index.d.ts" // Wrong order!
      }
    }
  });
  if (invalidAudit.valid || invalidAudit.errors.length === 0) {
    throw new Error("Test 2 Failed: Condition order hazard missed!");
  }
  console.log("✔ Test 2 Passed: 'types' First Condition Precedence Hazard Caught");

  // Test 3: Type Test Harness Compile-Time Assertions
  const harness = new TypeTestHarness();
  harness.assert<TypeEqual<string, string>>("string === string");
  harness.assert<TypeExtends<"admin", string>>("'admin' extends string");
  harness.assert<TypeEqual<TypeEqual<number, boolean>, false>>("number !== boolean");
  const stats = harness.report();
  if (stats.passed !== 3) throw new Error("Test 3 Failed: Type assertions failed!");
  console.log("✔ Test 3 Passed: Type Assertions Verified");

  // Test 4: Declaration Rollup & @internal Stripper
  const rollup = new DeclarationRollupEngine();
  rollup.register({
    name: "createSession",
    kind: "function",
    signature: "function createSession(userId: string): Promise<string>",
    isInternal: false,
    jsdoc: "Creates an authenticated user session."
  });
  rollup.register({
    name: "_decryptMasterKey",
    kind: "function",
    signature: "function _decryptMasterKey(): Buffer",
    isInternal: true,
    jsdoc: "Internal security helper."
  });

  const bundledDts = rollup.bundlePublicDts();
  if (bundledDts.includes("_decryptMasterKey")) {
    throw new Error("Test 4 Failed: Internal symbol leaked into public declaration rollup!");
  }
  if (!bundledDts.includes("createSession")) {
    throw new Error("Test 4 Failed: Public symbol missing from declaration rollup!");
  }
  if (rollup.getStrippedCount() !== 1) {
    throw new Error("Test 4 Failed: Stripped count incorrect!");
  }
  console.log("✔ Test 4 Passed: @internal API Stripping and Rollup Verified");

  // Test 5: Module Federation Ambient Declaration Generator
  const fedRegistry = new ModuleFederationTypeRegistry();
  fedRegistry.registerRemote({
    remoteName: "paymentRemote",
    modulePath: "StripeButton",
    propsInterface: "StripeButtonProps",
    propsFields: [
      { name: "amountCents", type: "number" },
      { name: "currency", type: "'USD' | 'EUR'" },
      { name: "onSuccess", type: "(txId: string) => void", optional: true }
    ]
  });

  const fedDts = fedRegistry.generateHostAmbientDeclarations();
  if (
    !fedDts.includes('declare module "paymentRemote/StripeButton"') ||
    !fedDts.includes("amountCents: number;")
  ) {
    throw new Error("Test 5 Failed: Module federation ambient declarations incorrect!");
  }
  console.log("✔ Test 5 Passed: Micro-Frontend Module Federation Ambient Declarations Verified");

  console.log("🎉 ALL TS-11 VERIFICATION TESTS PASSED SUCCESSFULLY!");
  return true;
}

runModuleVerificationTests();


---

## 7. Practice Drills, Key Takeaways & Enterprise Summary

### 7.1 75 Hands-On Production Drills

1. **Drill 1**: Configure `package.json` with an `"exports"` field replacing legacy `"main"`.
2. **Drill 2**: Add `"types"` as the very first condition in the root `.` export block.
3. **Drill 3**: Create a dual build exposing `./dist/index.js` (ESM) and `./dist/index.cjs` (CJS).
4. **Drill 4**: Test importing the package in a consumer project using `node16` resolution.
5. **Drill 5**: Create a subpath export for `./auth` and verify encapsulation prevents importing non-exported files.
6. **Drill 6**: Reproduce the Dual-Package Hazard by loading two instances of a stateful singleton class.
7. **Drill 7**: Solve the Dual-Package Hazard using `globalThis` and `Symbol.for("unique_store_id")`.
8. **Drill 8**: Configure `"sideEffects": false` in `package.json` and verify bundle tree-shaking with Rollup.
9. **Drill 9**: Define a `"sideEffects"` array retaining CSS files and global polyfill files.
10. **Drill 10**: Install `@arethetypeswrong/cli` and run `npx attw --pack .` on your library.
11. **Drill 11**: Fix any condition order warnings flagged by `attw`.
12. **Drill 12**: Install `publint` and run `npx publint` on `package.json`.
13. **Drill 13**: Write positive type tests using `expectTypeOf` to assert generic return types.
14. **Drill 14**: Write negative type tests using `// @ts-expect-error` asserting compile failures on invalid arguments.
15. **Drill 15**: Intentionally fix a line above `@ts-expect-error` and observe error `TS2578`.
16. **Drill 16**: Configure `"files": ["dist", "README.md", "LICENSE"]` in `package.json`.
17. **Drill 17**: Run `npm pack --dry-run` to inspect all files included in the published tarball.
18. **Drill 18**: Verify that sensitive local files (`.env`, `.npmrc`, test directories) are omitted.
19. **Drill 19**: Configure `declarationMap: true` and include `src/` in the published tarball for IDE navigation.
20. **Drill 20**: Configure `@microsoft/api-extractor` with `api-extractor.json` to roll up `.d.ts` files.
21. **Drill 21**: Annotate an internal helper with `@internal` and verify it is stripped from `dist/index.d.ts`.
22. **Drill 22**: Set up `rollup-plugin-dts` to bundle TypeScript declarations into a single file.
23. **Drill 23**: Configure `tsup` with `--format cjs,esm --dts` for zero-config dual builds.
24. **Drill 24**: Create a branded type `type UserId = string & { readonly __brand: unique symbol }`.
25. **Drill 25**: Write a type-guard function constructing and validating a branded `UserId`.
26. **Drill 26**: Set up a Webpack 5 Module Federation config exposing a `./Button` component.
27. **Drill 27**: Configure `@module-federation/typescript` to generate `@mf-types.zip`.
28. **Drill 28**: In a host application, consume the remote types and verify IntelliSense props completion.
29. **Drill 29**: Configure `peerDependencies` for React in a component library with a broad version range (`^18.0.0 || ^19.0.0`).
30. **Drill 30**: Add `peerDependenciesMeta` marking an optional database adapter as `"optional": true`.
31. **Drill 31**: Write a SemVer audit test verifying that function argument addition is optional, not required.
32. **Drill 32**: Write a test verifying that widening a return type is flagged as a Breaking Major release.
33. **Drill 33**: Set up `prepublishOnly` script running `npm run build && npm run test:types`.
34. **Drill 34**: Configure GitHub Actions to publish with `--provenance` to the npm registry.
35. **Drill 35**: Test dynamic imports in a library using `import()` for lazy-loaded plugin features.
36. **Drill 36**: Configure conditional exports for React Server Components with `"react-server"`.
37. **Drill 37**: Export browser-specific implementations using the `"browser"` condition in `"exports"`.
38. **Drill 38**: Add `"publishConfig"` to point to clean distribution paths during npm publishing.
39. **Drill 39**: Set up Changesets in a monorepo and run `pnpm changeset` to create a changelog entry.
40. **Drill 40**: Configure Corepack and the `"packageManager"` field to enforce `pnpm@9.x`.
41. **Drill 41**: Test library imports in a legacy CommonJS project using `const lib = require("my-lib")`.
42. **Drill 42**: Use `export =` to support default CJS imports without `.default` property nesting.
43. **Drill 43**: Add JSDoc `@deprecated` annotations with migration instructions to an old function signature.
44. **Drill 44**: Configure `"removeComments": false` in `tsconfig.json` to preserve JSDoc documentation in `.d.ts`.
45. **Drill 45**: Write an automated type equality assertion utility `TypeEqual<A, B>`.
46. **Drill 46**: Use `tsd` to type-check `.test-d.ts` files in CI.
47. **Drill 47**: Implement the Wrapper Pattern for a hybrid CJS/ESM library without code duplication.
48. **Drill 48**: Test tree-shaking using `bundlejs.com` or `agadoo`.
49. **Drill 49**: Build a CLI binary using the `"bin"` field in `package.json` with `#!/usr/bin/env node`.
50. **Drill 50**: Use `chmod +x` on the compiled binary script to make it executable.
51. **Drill 51**: Prevent global prototype pollution by auditing library dependencies.
52. **Drill 52**: Design an extensible configuration options type using generics with default values.
53. **Drill 53**: Create wildcard subpath exports for an icon directory (`./icons/*`).
54. **Drill 54**: Write typed EventEmitter interfaces using mapped generic event tables.
55. **Drill 55**: Re-export types using `export type * from "./types"` to guarantee type elision.
56. **Drill 56**: Configure CI test matrices testing the library across multiple TypeScript versions.
57. **Drill 57**: Verify that `@types/node` is strictly in `devDependencies`, never in `dependencies`.
58. **Drill 58**: Profile declaration generation time using `tsc --extendedDiagnostics`.
59. **Drill 59**: Set up `unbuild` to test stub builds (`unbuild --stub`) during local monorepo development.
60. **Drill 60**: Use `jiti` for on-the-fly TypeScript execution in development tools.
61. **Drill 61**: Write function overloads ensuring specific overloads precede general ones.
62. **Drill 62**: Test that consumer IDE "Go to Definition" navigates to source `.ts` files via `.d.ts.map`.
63. **Drill 63**: Build an enterprise SDK exposing three independent entry points: `/client`, `/server`, `/types`.
64. **Drill 64**: Add `npm run lint:package` using both `publint` and `attw`.
65. **Drill 65**: Verify that no ambient global declarations leak into consumer global namespaces.
66. **Drill 66**: Implement a runtime type registry synchronized with TypeScript ambient definitions.
67. **Drill 67**: Publish a pre-release version using `npm publish --tag beta`.
68. **Drill 68**: Test installing the beta version in a scratch testing project.
69. **Drill 69**: Promote the beta release to latest using `npm dist-tag add my-lib@1.0.0-beta.1 latest`.
70. **Drill 70**: Audit and resolve circular type imports between declaration files.
71. **Drill 71**: Configure `"isolatedDeclarations": true` across all library packages for parallel compiler support.
72. **Drill 72**: Verify that all exported signatures have explicit return types under `isolatedDeclarations`.
73. **Drill 73**: Package a full-stack library containing client hooks, server middleware, and shared types.
74. **Drill 74**: Run the end-to-end type verification suite with 100% passing assertions.
75. **Drill 75**: Publish the audited package to npm with full provenance and declaration maps.

---

### 7.2 Enterprise Best Practices & Architecture Checklist

1. **Adopt `package.json` `"exports"` exclusively**: Discard legacy `"main"` for modern modular encapsulation.
2. **Order `"types"` condition first**: Non-negotiable invariant to avoid declaration resolution failures.
3. **Heal the Dual-Package Hazard with `Symbol.for`**: Protect stateful singletons and caches across realms.
4. **Always whitelist files with `"files"`**: Never publish unnecessary tests, dotfiles, or internal docs.
5. **Verify packages with `attw` and `publint`**: Automated linting prevents 99% of published package bugs.
6. **Include `src/` if publishing `declarationMap: true`**: Keep developer IDE "Go to Definition" functional.
7. **Write compile-time type tests (`expect-type` / `tsd`)**: Protect your type contracts against subtle regressions.
8. **Never bundle global polyfills in libraries**: Let the consumer application manage runtime polyfills.
9. **Respect SemVer for Types**: Understand that widening return types or narrowing parameters breaks consumers.
10. **Enable `sideEffects: false`**: Allow modern bundlers to tree-shake unused exports cleanly.
