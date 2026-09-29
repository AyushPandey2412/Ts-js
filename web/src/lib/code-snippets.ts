export interface CodeSnippet {
  title: string;
  language: 'typescript' | 'javascript';
  code: string;
}

export const MODULE_SNIPPETS: Record<string, CodeSnippet> = {
  // TypeScript Modules
  'ts-00-queue-and-index': {
    title: 'Set Theory & Type Lattice in Action',
    language: 'typescript',
    code: `// DevMastery TS-00: Type Lattice & Set Theory
// Top Type: unknown (Universal Set)
// Bottom Type: never (Empty Set ∅)

function demonstrateLattice(value: unknown) {
  console.log("=== Type Lattice Demonstration ===");

  if (typeof value === "string") {
    // Narrowed from unknown -> string
    console.log("Narrowed string length:", value.length);
  } else if (typeof value === "number") {
    // Narrowed from unknown -> number
    console.log("Narrowed number squared:", value * value);
  } else {
    console.log("Unknown type fallback:", value);
  }
}

demonstrateLattice("DevMastery TypeScript 5.x");
demonstrateLattice(42);
demonstrateLattice({ runtime: "V8" });
`
  },

  'ts-01-type-architecture-and-structural-subtyping': {
    title: 'Nominal Branding & Exhaustiveness Checking',
    language: 'typescript',
    code: `// DevMastery TS-01: Branded Nominal Types & CFA Narrowing

// 1. Branded Nominal Type pattern
declare const BrandKey: unique symbol;
type Branded<T, Brand extends string> = T & { readonly [BrandKey]: Brand };

type UserId = Branded<string, "UserId">;
type OrderId = Branded<string, "OrderId">;

function createUserId(id: string): UserId {
  return id as UserId;
}

function fetchUser(userId: UserId) {
  console.log("Fetching secure user with ID:", userId);
}

const uid = createUserId("usr_8923a");
fetchUser(uid);

// 2. Exhaustive Type Narrowing
type NetworkState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "success"; data: string[] }
  | { status: "error"; error: Error };

function handleState(state: NetworkState) {
  switch (state.status) {
    case "idle":
      return "Ready to initiate";
    case "loading":
      return "Fetching data...";
    case "success":
      return \`Received \${state.data.length} records: \${state.data.join(", ")}\`;
    case "error":
      return \`Failed with: \${state.error.message}\`;
    default: {
      const _exhaustive: never = state;
      throw new Error(\`Unhandled state: \${_exhaustive}\`);
    }
  }
}

console.log(handleState({ status: "success", data: ["TypeScript", "V8", "PostgreSQL"] }));
`
  },

  'ts-02-generics-and-type-operators': {
    title: 'Generic Constraints & Const Type Parameters',
    language: 'typescript',
    code: `// DevMastery TS-02: Generics & const Type Parameters (TS 5.0+)

// Generic identity with property constraint
function getProperty<T, K extends keyof T>(obj: T, key: K): T[K] {
  return obj[key];
}

const config = {
  host: "api.devmastery.dev",
  port: 443,
  ssl: true
};

const host = getProperty(config, "host");
const port = getProperty(config, "port");
console.log("Config loaded:", { host, port });

// Immutable tuple inference with const type parameter
function defineRoutes<const T extends readonly string[]>(routes: T): T {
  return routes;
}

const appRoutes = defineRoutes(["/auth/login", "/dashboard", "/settings"] as const);
console.log("Registered routes:", appRoutes);
`
  },

  'ts-03-conditional-types-and-inference': {
    title: 'Conditional Types & infer Pattern Matching',
    language: 'typescript',
    code: `// DevMastery TS-03: Conditional Types & infer Pattern Matching

// Extract return type of a promise-returning function
type AsyncReturnType<T> = T extends (...args: any[]) => Promise<infer R> ? R : never;

async function fetchMetrics() {
  return { qps: 18400, p99Ms: 4.2, activeWorkers: 16 };
}

// Simulated runtime inspection
const metrics = await fetchMetrics();
console.log("Cluster Metrics:", metrics);

// Flattening array type conditionally
type Flatten<T> = T extends Array<infer Item> ? Flatten<Item> : T;

function flattenDeep(arr: any[]): any[] {
  return arr.flat(Infinity);
}

const nested = [1, [2, [3, [4, 5]]]];
console.log("Flattened:", flattenDeep(nested));
`
  },

  'ts-04-mapped-types-and-metaprogramming': {
    title: 'Mapped Types & Key Remapping',
    language: 'typescript',
    code: `// DevMastery TS-04: Mapped Types & Key Remapping with 'as'

interface UserProfile {
  name: string;
  age: number;
  email: string;
}

// Generate getters runtime object
function createGetters<T extends Record<string, any>>(obj: T) {
  const getters: Record<string, () => any> = {};
  for (const key of Object.keys(obj)) {
    const capitalized = key.charAt(0).toUpperCase() + key.slice(1);
    getters[\`get\${capitalized}\`] = () => obj[key];
  }
  return getters;
}

const user = { name: "Alice", age: 30, email: "alice@devmastery.dev" };
const getters = createGetters(user);

console.log("Generated Getters Keys:", Object.keys(getters));
console.log("getName():", (getters as any).getName());
console.log("getEmail():", (getters as any).getEmail());
`
  },

  'ts-05-template-literal-types-and-parsers': {
    title: 'Template Literal Route Parameter Parsing',
    language: 'typescript',
    code: `// DevMastery TS-05: Template Literal Route Parameter Extraction

function matchRoute(pattern: string, actualUrl: string) {
  const patternSegments = pattern.split("/");
  const actualSegments = actualUrl.split("/");
  const params: Record<string, string> = {};

  if (patternSegments.length !== actualSegments.length) return null;

  for (let i = 0; i < patternSegments.length; i++) {
    const p = patternSegments[i];
    const a = actualSegments[i];
    if (p.startsWith(":")) {
      const paramName = p.slice(1);
      params[paramName] = a;
    } else if (p !== a) {
      return null;
    }
  }
  return params;
}

const routePattern = "/teams/:teamId/projects/:projectId/builds/:buildId";
const incomingUrl = "/teams/core-platform/projects/devmastery/builds/v2.4.0";

const extracted = matchRoute(routePattern, incomingUrl);
console.log("Pattern:", routePattern);
console.log("Incoming URL:", incomingUrl);
console.log("Extracted Params:", extracted);
`
  },

  'ts-06-oop-class-internals-and-solid': {
    title: 'Complete OOP, Modifiers & SOLID Architecture',
    language: 'typescript',
    code: `// DevMastery TS-06: OOP Architecture, #private fields & Parameter Properties

interface Notifier {
  send(message: string): void;
}

class EmailService implements Notifier {
  send(message: string) {
    console.log("[EmailService] Sending:", message);
  }
}

class SlackService implements Notifier {
  send(message: string) {
    console.log("[SlackService] Posting to #alerts:", message);
  }
}

// Dependency Inversion Principle
class AlertSystem {
  // #private field has true runtime privacy (ECMAScript private brand)
  #secretToken: string = "sec_k8910481x";

  constructor(private readonly notifier: Notifier) {}

  triggerAlert(event: string) {
    console.log("Authenticating alert with token:", this.#secretToken.slice(0, 5) + "...");
    this.notifier.send(\`CRITICAL ALERT: \${event} at \${new Date().toISOString()}\`);
  }
}

const slackAlerts = new AlertSystem(new SlackService());
slackAlerts.triggerAlert("High Memory Heap Pressure (92%)");
`
  },

  'ts-07-enterprise-design-patterns-and-builders': {
    title: 'Type-State Builder & Result Monad',
    language: 'typescript',
    code: `// DevMastery TS-07: Type-Safe Builder Pattern & Result Monad

type Result<T, E = Error> =
  | { ok: true; value: T }
  | { ok: false; error: E };

function Ok<T>(value: T): Result<T, never> {
  return { ok: true, value };
}

function Err<E>(error: E): Result<never, E> {
  return { ok: false, error };
}

// Step-Builder implementation
class RequestBuilder {
  private url?: string;
  private method: string = "GET";
  private headers: Record<string, string> = {};

  setUrl(url: string) {
    this.url = url;
    return this;
  }

  setMethod(method: "GET" | "POST" | "PUT" | "DELETE") {
    this.method = method;
    return this;
  }

  addHeader(key: string, value: string) {
    this.headers[key] = value;
    return this;
  }

  execute(): Result<{ url: string; method: string; headers: Record<string, string> }> {
    if (!this.url) {
      return Err(new Error("URL must be provided before executing request!"));
    }
    return Ok({ url: this.url, method: this.method, headers: this.headers });
  }
}

const req = new RequestBuilder()
  .setUrl("https://api.devmastery.dev/v1/telemetry")
  .setMethod("POST")
  .addHeader("Authorization", "Bearer dev_token_xyz")
  .execute();

console.log("Builder Result:", req);
`
  },

  'ts-08-decorators-metadata-and-ioc': {
    title: 'IoC Container & TC39 Stage 3 Decorators',
    language: 'typescript',
    code: `// DevMastery TS-08: Inversion of Control (IoC) Container

type Constructor<T = any> = new (...args: any[]) => T;

class Container {
  private services = new Map<string, any>();

  register<T>(name: string, instance: T) {
    this.services.set(name, instance);
    console.log(\`[IoC] Registered service: "\${name}"\`);
  }

  resolve<T>(name: string): T {
    const service = this.services.get(name);
    if (!service) {
      throw new Error(\`Service "\${name}" not found in IoC container!\`);
    }
    return service;
  }
}

// Usage
const container = new Container();

class Database {
  query(sql: string) {
    return \`Result of: "\${sql}" on cluster postgres-primary\`;
  }
}

class UserRepository {
  constructor(private db: Database) {}

  findUser(id: number) {
    return this.db.query(\`SELECT * FROM users WHERE id = \${id}\`);
  }
}

container.register("db", new Database());
container.register("userRepo", new UserRepository(container.resolve("db")));

const repo = container.resolve<UserRepository>("userRepo");
console.log(repo.findUser(42));
`
  },

  'ts-09-compiler-pipeline-and-ast': {
    title: 'AST Parsing & Syntax Tree Traversal',
    language: 'typescript',
    code: `// DevMastery TS-09: Mini AST Traversal Demonstration

interface ASTNode {
  type: string;
  value?: string | number;
  children?: ASTNode[];
}

const sampleAST: ASTNode = {
  type: "FunctionDeclaration",
  value: "calculateSum",
  children: [
    { type: "Parameter", value: "a" },
    { type: "Parameter", value: "b" },
    {
      type: "BlockStatement",
      children: [
        {
          type: "ReturnStatement",
          children: [
            { type: "BinaryExpression", value: "+", children: [
              { type: "Identifier", value: "a" },
              { type: "Identifier", value: "b" }
            ]}
          ]
        }
      ]
    }
  ]
};

function traverseAST(node: ASTNode, depth = 0) {
  const indent = "  ".repeat(depth);
  console.log(\`\${indent}├─ [\${node.type}] \${node.value ? \`("\${node.value}")\` : ""}\`);
  if (node.children) {
    for (const child of node.children) {
      traverseAST(child, depth + 1);
    }
  }
}

console.log("=== AST Visitor Tree ===");
traverseAST(sampleAST);
`
  },

  'ts-10-production-tsconfig-monorepos-and-declarations': {
    title: 'Strict Configuration & Monorepo Matrix',
    language: 'typescript',
    code: `// DevMastery TS-10: Strict Flag Simulation & Safe Index Access

// Simulating noUncheckedIndexedAccess
interface MatrixConfig {
  flags: Record<string, boolean>;
  ports: number[];
}

const config: MatrixConfig = {
  flags: { enableJit: true, telemetry: false },
  ports: [3000, 8080, 9092]
};

function getPort(ports: number[], index: number): number | undefined {
  // Safe indexing with bounds checking
  if (index >= 0 && index < ports.length) {
    return ports[index];
  }
  return undefined;
}

console.log("Port at index 1:", getPort(config.ports, 1));
console.log("Port at index 99 (undefined safety):", getPort(config.ports, 99));
`
  },

  'ts-11-library-authoring-packaging-and-module-federation': {
    title: 'Modern Package Exports & Dual-Package Resolver',
    language: 'typescript',
    code: `// DevMastery TS-11: package.json "exports" Resolution Algorithm

interface PackageJson {
  name: string;
  version: string;
  exports: Record<string, { import?: string; require?: string; types?: string }>;
}

const devMasteryPkg: PackageJson = {
  name: "@devmastery/core",
  version: "1.0.0",
  exports: {
    ".": {
      types: "./dist/index.d.ts",
      import: "./dist/index.mjs",
      require: "./dist/index.cjs"
    },
    "./utils": {
      types: "./dist/utils.d.ts",
      import: "./dist/utils.mjs",
      require: "./dist/utils.cjs"
    }
  }
};

function resolveExport(pkg: PackageJson, subpath: string, format: "import" | "require") {
  const target = pkg.exports[subpath];
  if (!target) return \`Subpath "\${subpath}" not exported!\`;
  return target[format] || "Format unsupported";
}

console.log("ESM Entrypoint:", resolveExport(devMasteryPkg, ".", "import"));
console.log("CJS Entrypoint:", resolveExport(devMasteryPkg, ".", "require"));
console.log("Utils Entrypoint:", resolveExport(devMasteryPkg, "./utils", "import"));
`
  },

  'ts-12-runtime-validation-and-schema-synthesis': {
    title: 'Runtime Validation & Schema Synthesis',
    language: 'typescript',
    code: `// DevMastery TS-12: Single Source of Truth Runtime Schema Validator

class SchemaValidator<T> {
  constructor(private validatorFn: (data: unknown) => { valid: boolean; errors: string[]; parsed?: T }) {}

  parse(data: unknown): T {
    const result = this.validatorFn(data);
    if (!result.valid) {
      throw new Error("Validation Error: " + result.errors.join(", "));
    }
    return result.parsed!;
  }
}

// User schema definition
const UserSchema = new SchemaValidator<{ id: number; username: string; email: string }>((data: any) => {
  const errors: string[] = [];
  if (typeof data !== "object" || data === null) {
    return { valid: false, errors: ["Data must be an object"] };
  }
  if (typeof data.id !== "number" || data.id <= 0) errors.push("id must be a positive number");
  if (typeof data.username !== "string" || data.username.length < 3) errors.push("username must be at least 3 chars");
  if (typeof data.email !== "string" || !data.email.includes("@")) errors.push("email must be valid format");

  return { valid: errors.length === 0, errors, parsed: data };
});

// Test valid
const validUser = UserSchema.parse({ id: 101, username: "ayush_dev", email: "ayush@devmastery.dev" });
console.log("Successfully validated user:", validUser);

// Test invalid
try {
  UserSchema.parse({ id: -5, username: "x", email: "invalid" });
} catch (e: any) {
  console.log("Caught Expected Error:", e.message);
}
`
  },

  // JavaScript Core Modules
  '01-engine-memory-execution-context': {
    title: 'Call Stack, Memory Heap & Execution Context',
    language: 'javascript',
    code: `// DevMastery JS-01: V8 Execution Context & Closures in Heap Memory

function createRateLimiter(maxCalls, timeWindowMs) {
  // Allocated in V8 Heap Memory as part of closure scope context
  let callTimestamps = [];

  return function checkLimit() {
    const now = Date.now();
    // Slide window
    callTimestamps = callTimestamps.filter(t => now - t < timeWindowMs);

    if (callTimestamps.length >= maxCalls) {
      return { allowed: false, remaining: 0, retryAfterMs: timeWindowMs - (now - callTimestamps[0]) };
    }

    callTimestamps.push(now);
    return { allowed: true, remaining: maxCalls - callTimestamps.length };
  };
}

const limiter = createRateLimiter(3, 1000);

console.log("Call 1:", limiter());
console.log("Call 2:", limiter());
console.log("Call 3:", limiter());
console.log("Call 4 (Blocked):", limiter());
`
  },

  '06-arrays-and-collections': {
    title: 'Packed vs Holey Arrays & Map/Set Hash Mechanics',
    language: 'javascript',
    code: `// DevMastery JS-06: V8 Array Elements Kinds & Fast Map Lookup

// 1. Packed Array (Fast Elements)
const packedArray = [1, 2, 3, 4, 5];

// 2. Frequency Counter via Map (O(1) average lookup)
function findDuplicates(arr) {
  const seen = new Set();
  const duplicates = new Set();

  for (const item of arr) {
    if (seen.has(item)) {
      duplicates.add(item);
    } else {
      seen.add(item);
    }
  }
  return Array.from(duplicates);
}

const input = [1, 2, 3, 2, 4, 5, 1, 6, 7, 1];
console.log("Input Array:", input);
console.log("Duplicates Found:", findDuplicates(input));
`
  },

  'javascript-async-programming-complete': {
    title: 'Event Loop, Microtasks & Promise Concurrency Pool',
    language: 'javascript',
    code: `// DevMastery JS-14-16: Event Loop & Concurrent Batching Pool

console.log("1. Synchronous script start");

setTimeout(() => {
  console.log("4. Macrotask (setTimeout 0ms)");
}, 0);

Promise.resolve().then(() => {
  console.log("3. Microtask (Promise.then)");
});

console.log("2. Synchronous script end");

// Concurrency Pool Simulator
async function runConcurrentPool(tasks, limit = 2) {
  const results = [];
  const executing = [];

  for (const [idx, task] of tasks.entries()) {
    const p = Promise.resolve().then(async () => {
      console.log(\`  -> Started task \${idx + 1}\`);
      const res = await task();
      console.log(\`  <- Finished task \${idx + 1}\`);
      return res;
    });

    results.push(p);

    if (limit <= tasks.length) {
      const e = p.then(() => executing.splice(executing.indexOf(e), 1));
      executing.push(e);
      if (executing.length >= limit) {
        await Promise.race(executing);
      }
    }
  }
  return Promise.all(results);
}

const testTasks = [
  () => new Promise(r => setTimeout(() => r("Task A Result"), 100)),
  () => new Promise(r => setTimeout(() => r("Task B Result"), 50)),
  () => new Promise(r => setTimeout(() => r("Task C Result"), 80)),
];

console.log("Starting Concurrency Pool (limit = 2):");
runConcurrentPool(testTasks, 2).then(res => {
  console.log("All tasks completed:", res);
});
`
  },

  '20-destructuring-and-pattern-matching': {
    title: 'Destructuring & Pattern Unpacking Architecture',
    language: 'javascript',
    code: `// DevMastery JS-20: Deep Pattern Unpacking & Dynamic Keys

const telemetryPacket = {
  service: "order-service",
  timestamp: Date.now(),
  metrics: {
    cpu: { usagePct: 42.8, cores: 8 },
    memory: { rssMb: 256, heapUsedMb: 142 }
  },
  tags: ["production", "us-east-1", "canary"],
  metadata: {
    "x-trace-id": "trc_99182371",
    "x-region": "virginia"
  }
};

// Deep Nested Destructuring with Renaming and Defaults
const {
  service,
  metrics: {
    cpu: { usagePct: cpuPercent },
    memory: { heapUsedMb }
  },
  tags: [primaryEnvironment, ...otherTags],
  metadata: { ["x-trace-id"]: traceId }
} = telemetryPacket;

console.log("Extracted Telemetry Data:");
console.log({
  service,
  cpuPercent: \`\${cpuPercent}%\`,
  heapUsedMb: \`\${heapUsedMb} MB\`,
  primaryEnvironment,
  otherTags,
  traceId
});
`
  }
};

export function getDefaultSnippet(slug: string, title?: string): CodeSnippet {
  if (MODULE_SNIPPETS[slug]) {
    return MODULE_SNIPPETS[slug];
  }

  const isTs = slug.startsWith('ts-');
  return {
    title: title || (isTs ? 'TypeScript Playground' : 'JavaScript Playground'),
    language: isTs ? 'typescript' : 'javascript',
    code: isTs
      ? `// DevMastery TypeScript Playground
// Type your TypeScript code here and press ▶ Run (or Ctrl + Enter)

interface EngineeringGoal {
  title: string;
  domain: "Types" | "Runtime" | "Systems";
  completed: boolean;
}

const goals: EngineeringGoal[] = [
  { title: "Master Structural Subtyping", domain: "Types", completed: true },
  { title: "Understand V8 JIT & Hidden Classes", domain: "Runtime", completed: true },
  { title: "Architect IoC & Decoupled Containers", domain: "Systems", completed: false }
];

console.log("Active Goals:", goals.filter(g => !g.completed));
console.log("Total Goals Count:", goals.length);
`
      : `// DevMastery JavaScript Playground
// Type your JavaScript code here and press ▶ Run (or Ctrl + Enter)

function calculateStats(values) {
  const sum = values.reduce((acc, curr) => acc + curr, 0);
  const avg = sum / values.length;
  const max = Math.max(...values);
  const min = Math.min(...values);

  return { sum, avg, max, min, count: values.length };
}

const latencies = [12.4, 8.9, 15.2, 42.1, 7.3, 11.0];
console.log("Latency Stats (ms):", calculateStats(latencies));
`
  };
}
