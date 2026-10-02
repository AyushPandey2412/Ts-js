# Module TS-07: Enterprise Design Patterns, Generic Builders, & Reusable Architecture

Welcome to TypeScript Enterprise Design Patterns, Generic Builders, and Reusable Architecture. This module teaches how to build scalable, type-safe software systems. You will learn creational patterns like phantom type builders and generic factories, structural patterns like generic repositories and adapters, and behavioral patterns like middleware pipelines and Railway-Oriented Result monads.

---

# Topic 1: Generic Factory with Auto-Registration Registry

### 1. What is it?
A factory is a creational pattern that creates objects without exposing the exact instantiation logic to the caller. A **Generic Factory with Auto-Registration** is a factory class or object that maintains a dictionary of constructor functions. Classes register themselves with a unique string key, and callers instantiate objects by passing the key and constructor arguments.

### 2. Why does it exist?
Without a registry, factories rely on large `switch` or `if/else` statements:
```typescript
// Anti-pattern: Hard-coded conditional factory
function createService(kind: string) {
  if (kind === "auth") return new AuthService();
  if (kind === "payment") return new PaymentService();
  throw new Error("Unknown service");
}
```
This violates the Open/Closed Principle. Every time you add a new service, you must modify the factory function. A dynamic registry allows new classes to register themselves at runtime while preserving strict compile-time type safety.

### 3. Basic example

```typescript
interface Service {
  execute(): string;
}

type ServiceConstructor<T extends Service> = new (...args: any[]) => T;

class ServiceRegistry {
  private static registry = new Map<string, ServiceConstructor<Service>>();

  static register<T extends Service>(key: string, ctor: ServiceConstructor<T>): void {
    this.registry.set(key, ctor);
  }

  static create<T extends Service>(key: string, ...args: any[]): T {
    const Ctor = this.registry.get(key);
    if (!Ctor) {
      throw new Error(`Service not registered: ${key}`);
    }
    return new Ctor(...args) as T;
  }
}

class AuthService implements Service {
  execute(): string {
    return "AuthService executed";
  }
}

ServiceRegistry.register("auth", AuthService);
const auth = ServiceRegistry.create<AuthService>("auth");
console.log(auth.execute());
```

**Line-by-line explanation:**
- `interface Service { execute(): string; }`: Declares the base contract that all registered instances must satisfy.
- `type ServiceConstructor<T extends Service> = new (...args: any[]) => T;`: Defines a constructor type that accepts any constructor arguments and produces an instance of `T`.
- `private static registry = new Map<...>`: Holds the registered constructors in memory indexed by string keys.
- `static register<T extends Service>(...)`: Adds a constructor to the map.
- `static create<T extends Service>(...)`: Looks up the constructor by key, validates existence, calls `new Ctor(...args)`, and casts the result to `T`.
- `ServiceRegistry.register("auth", AuthService)`: Registers `AuthService` under the key `"auth"`.
- `const auth = ServiceRegistry.create<AuthService>("auth")`: Instantiates the service and infers its type.

---

### 4. How it works inside TypeScript
1. **Constructor Signatures**: In TypeScript, the type `new (...args: any[]) => T` matches any class constructor whose instances satisfy `T`.
2. **Type Parameter Bounds**: The constraint `<T extends Service>` ensures that no class can be registered or instantiated unless it satisfies the `Service` interface.
3. **Map Storage**: At runtime, `new Map()` holds the constructor function references. At compile time, the generic parameter `T` provides type checking at the call site.

---

### 5. More examples

#### Example 1: Strongly-typed registry with key-to-type mapping
```typescript
interface ServiceMap {
  auth: AuthService;
  database: DatabaseService;
}

class DatabaseService implements Service {
  execute(): string {
    return "Database connected";
  }
}

class TypedServiceFactory {
  private static map = new Map<keyof ServiceMap, ServiceConstructor<Service>>();

  static register<K extends keyof ServiceMap>(key: K, ctor: ServiceConstructor<ServiceMap[K]>): void {
    this.map.set(key, ctor);
  }

  static get<K extends keyof ServiceMap>(key: K): ServiceMap[K] {
    const Ctor = this.map.get(key);
    if (!Ctor) throw new Error(`Missing ${key}`);
    return new Ctor() as ServiceMap[K];
  }
}

TypedServiceFactory.register("auth", AuthService);
TypedServiceFactory.register("database", DatabaseService);

const db = TypedServiceFactory.get("database"); // Inferred as DatabaseService
console.log(db.execute());
```

#### Example 2: Factory with dependency injection parameters
```typescript
interface Config {
  apiUrl: string;
}

class ApiService implements Service {
  constructor(private config: Config) {}
  execute(): string {
    return this.config.apiUrl;
  }
}

type FactoryFn<T> = (config: Config) => T;

class DynamicServiceFactory {
  private static factories = new Map<string, FactoryFn<Service>>();

  static register<T extends Service>(key: string, factory: FactoryFn<T>): void {
    this.factories.set(key, factory as FactoryFn<Service>);
  }

  static create<T extends Service>(key: string, config: Config): T {
    const fn = this.factories.get(key);
    if (!fn) throw new Error(`Factory not found: ${key}`);
    return fn(config) as T;
  }
}
```

---

### 6. Common mistakes

#### Mistake 1: Storing instances instead of constructor functions
```typescript
// WRONG: Pre-instantiating turns the factory into a cache or singleton
class BrokenFactory {
  private static registry = new Map<string, Service>();
  static register(key: string, instance: Service) {
    this.registry.set(key, instance); // Shares one single instance forever
  }
}
```
**Why it fails:** A factory's purpose is creating new instances on demand. Storing instances turns it into an eager service locator, which causes shared state mutations across different callers.

```typescript
// CORRECT: Store the constructor function or creator function
class CorrectFactory {
  private static registry = new Map<string, new () => Service>();
  static register(key: string, ctor: new () => Service) {
    this.registry.set(key, ctor);
  }
}
```

#### Mistake 2: Missing error check when key is unregistered
```typescript
// WRONG: Returning undefined without checking
static create(key: string): Service {
  const Ctor = this.registry.get(key);
  return new Ctor(); // TypeError: Ctor is not a constructor (when undefined)
}
```
**Why it fails:** If `key` is not in the map, `this.registry.get(key)` returns `undefined`. Calling `new undefined()` throws a runtime crash. Always validate and throw a descriptive error.

---

### 7. Rules to remember
1. Use `new (...args: any[]) => T` to type a class constructor.
2. Constrain generic constructors with `<T extends BaseContract>` to guarantee compatibility.
3. Throw an explicit error when looking up an unregistered key rather than allowing `new undefined()` to fail at runtime.
4. For compile-time key validation, use an interface map (`interface ServiceMap { [key]: ServiceType }`).

---

### Think first: Prediction puzzle
Look at the following code. What does it print, or does it fail at compile time?

```typescript
interface Widget {
  render(): string;
}

class ButtonWidget implements Widget {
  render(): string { return "button"; }
}

class Registry {
  static map = new Map<string, new () => Widget>();
}

Registry.map.set("btn", ButtonWidget);
const Ctor = Registry.map.get("btn");
const widget = new Ctor!();
console.log(widget.render());
```

---

**Answer:**
It prints:
```
button
```
**Execution trace:**
1. `Registry.map.set("btn", ButtonWidget)` stores the constructor function `ButtonWidget` under the key `"btn"`.
2. `Registry.map.get("btn")` retrieves the constructor function.
3. `new Ctor!()` executes `new ButtonWidget()`, producing an instance of `ButtonWidget`.
4. `widget.render()` returns `"button"`, which is logged to the console.

---

### Practice exercises

#### Exercise 1: Register and instantiate a Logger service
- **Task**: Create an interface `Logger` with method `log(msg: string): void`. Create a class `ConsoleLogger` implementing `Logger`. Register it in a factory and instantiate it.
- **Hint 1**: Define `type LoggerCtor = new () => Logger`.
- **Hint 2**: Use a `Map<string, LoggerCtor>` to store the class.

#### Exercise 2: Key-checked typed factory
- **Task**: Define an interface `AppServices` with properties `user: UserService` and `audit: AuditService`. Write a factory `AppFactory` whose `.create(key)` method only accepts keys of `AppServices` and returns the matching type.
- **Hint 1**: Use generic parameter `K extends keyof AppServices`.
- **Hint 2**: Return type must be `AppServices[K]`.

#### Exercise 3: Parameterized factory
- **Task**: Modify `ServiceConstructor` to accept a generic arguments tuple `TArgs extends any[]` so that `new (...args: TArgs) => T` preserves exact parameter types.
- **Hint 1**: Use `type ParamCtor<T, TArgs extends any[]> = new (...args: TArgs) => T`.
- **Hint 2**: In `create<T, A extends any[]>(key: string, ...args: A): T`, pass `...args` to `new Ctor(...args)`.

#### Exercise 4: Factory with fallback default constructor
- **Task**: Implement a factory that returns a `DefaultService` if the requested key is not found in the registry instead of throwing an error.
- **Hint 1**: Check `const Ctor = this.registry.get(key) ?? DefaultService;`.
- **Hint 2**: Both the registered services and `DefaultService` must implement the same interface.

---

### Exercise solutions

#### Solution 1: Register and instantiate a Logger service
```typescript
interface Logger {
  log(msg: string): void;
}

class ConsoleLogger implements Logger {
  log(msg: string): void {
    console.log(`LOG: ${msg}`);
  }
}

class LoggerFactory {
  private static map = new Map<string, new () => Logger>();

  static register(name: string, ctor: new () => Logger): void {
    this.map.set(name, ctor);
  }

  static create(name: string): Logger {
    const Ctor = this.map.get(name);
    if (!Ctor) throw new Error(`Logger not found: ${name}`);
    return new Ctor();
  }
}

LoggerFactory.register("console", ConsoleLogger);
const logger = LoggerFactory.create("console");
logger.log("initialized");
```

#### Solution 2: Key-checked typed factory
```typescript
interface UserService {
  getUser(): string;
}

interface AuditService {
  record(): void;
}

interface AppServices {
  user: UserService;
  audit: AuditService;
}

class AppFactory {
  private static registry = new Map<keyof AppServices, new () => any>();

  static register<K extends keyof AppServices>(key: K, ctor: new () => AppServices[K]): void {
    this.registry.set(key, ctor);
  }

  static create<K extends keyof AppServices>(key: K): AppServices[K] {
    const Ctor = this.registry.get(key);
    if (!Ctor) throw new Error(`Missing service: ${String(key)}`);
    return new Ctor() as AppServices[K];
  }
}
```

#### Solution 3: Parameterized factory
```typescript
type TypedConstructor<T, A extends any[]> = new (...args: A) => T;

class ParamFactory {
  private static map = new Map<string, TypedConstructor<any, any[]>>();

  static register<T, A extends any[]>(key: string, ctor: TypedConstructor<T, A>): void {
    this.map.set(key, ctor);
  }

  static create<T, A extends any[]>(key: string, ...args: A): T {
    const Ctor = this.map.get(key);
    if (!Ctor) throw new Error(`Unknown: ${key}`);
    return new Ctor(...args) as T;
  }
}

class UserProfile {
  constructor(public id: string, public active: boolean) {}
}

ParamFactory.register("profile", UserProfile);
const profile = ParamFactory.create<UserProfile, [string, boolean]>("profile", "u1", true);
```

#### Solution 4: Factory with fallback default constructor
```typescript
interface CacheStore {
  get(key: string): string | null;
}

class MemoryStore implements CacheStore {
  get(key: string): string | null {
    return null;
  }
}

class CustomStore implements CacheStore {
  get(key: string): string | null {
    return "hit";
  }
}

class CacheFactory {
  private static map = new Map<string, new () => CacheStore>();

  static register(key: string, ctor: new () => CacheStore): void {
    this.map.set(key, ctor);
  }

  static create(key: string): CacheStore {
    const Ctor = this.map.get(key) ?? MemoryStore;
    return new Ctor();
  }
}

const fallback = CacheFactory.create("redis"); // Returns MemoryStore
```

---

### Recall
1. What TypeScript syntax represents a constructor type? `new (...args: any[]) => T`.
2. Why does a dynamic registry violate less architecture rules than a `switch` statement? It allows new classes to be added without modifying the factory source code (Open/Closed Principle).
3. What is the difference between storing constructor references and storing instantiated objects in a factory? Constructors create fresh instances on demand; storing objects reuses the same instance (acting like a cache or singleton).

> **If you remember only one thing:**  
> A generic factory stores constructor functions (`new (...args: any[]) => T`) in a lookup map, letting callers instantiate objects dynamically with full type safety.

---

# Topic 2: The Type-State Step-Builder Pattern with Phantom Types

### 1. What is it?
The **Type-State Pattern** uses generic type parameters (called **phantom types**) to track the internal lifecycle state of an object at compile time. In a **Step-Builder**, the builder methods change these type parameters as you configure the object. The terminal `.build()` method is only allowed when all mandatory fields have reached the required state.

### 2. Why does it exist?
Standard builder patterns permit calling `.build()` prematurely before required fields are set:
```typescript
// Anti-pattern: runtime check in builder
const builder = new QueryBuilder();
builder.build(); // Throws runtime Error: "Table name is required"
```
The caller only finds out about the missing field when running the code. With the Type-State Step-Builder, TypeScript raises a compile-time error if `.build()` is called before all required configuration steps are completed.

### 3. Basic example

```typescript
// 1. Phantom type markers for state
interface NoUrl {}
interface HasUrl {}

interface NoMethod {}
interface HasMethod {}

// 2. The builder carries the markers in type parameters
class RequestBuilder<TUrl = NoUrl, TMethod = NoMethod> {
  private urlValue?: string;
  private methodValue?: string;

  withUrl(url: string): RequestBuilder<HasUrl, TMethod> {
    const next = new RequestBuilder<HasUrl, TMethod>();
    next.urlValue = url;
    next.methodValue = this.methodValue;
    return next;
  }

  withMethod(method: string): RequestBuilder<TUrl, HasMethod> {
    const next = new RequestBuilder<TUrl, HasMethod>();
    next.urlValue = this.urlValue;
    next.methodValue = method;
    return next;
  }

  // 3. .build() is only callable when TUrl = HasUrl and TMethod = HasMethod
  build(this: RequestBuilder<HasUrl, HasMethod>): { url: string; method: string } {
    return {
      url: this.urlValue!,
      method: this.methodValue!,
    };
  }
}

// Valid chain: compile passes
const req = new RequestBuilder()
  .withUrl("https://example.com/api")
  .withMethod("POST")
  .build();

console.log(req.url, req.method);
```

**Line-by-line explanation:**
- `interface NoUrl {}` and `interface HasUrl {}`: Marker interfaces. They contain no runtime code. They only exist to inform the compiler.
- `class RequestBuilder<TUrl = NoUrl, TMethod = NoMethod>`: Defaults to `NoUrl` and `NoMethod`.
- `withUrl(...)`: Returns a new `RequestBuilder<HasUrl, TMethod>`. The `TUrl` parameter is now advanced to `HasUrl`.
- `withMethod(...)`: Returns a new `RequestBuilder<TUrl, HasMethod>`. The `TMethod` parameter is advanced to `HasMethod`.
- `build(this: RequestBuilder<HasUrl, HasMethod>)`: TypeScript's `this` parameter typing restricts calling `.build()` unless both markers are satisfied.
- If you call `new RequestBuilder().build()`, TypeScript raises an error: `The 'this' context of type 'RequestBuilder<NoUrl, NoMethod>' is not assignable to method's 'this' of type 'RequestBuilder<HasUrl, HasMethod>'`.

---

### 4. How it works inside TypeScript
1. **Phantom Type Parameters**: The generic parameters `TUrl` and `TMethod` are never used as values inside the class. They only serve as tags on the type signature.
2. **`this` Parameter Constraint**: Specifying `this: Class<StateA, StateB>` on a method signature tells the TypeScript checker to verify that the caller's static type matches that exact generic state.
3. **Immutable Step Progression**: By returning a new builder with the updated type parameter on each step, the compiler enforces a state transition machine.

---

### 5. More examples

#### Example 1: Enforcing strictly ordered sequential steps
```typescript
interface Step1 {
  setName(name: string): Step2;
}

interface Step2 {
  setEmail(email: string): Step3;
}

interface Step3 {
  build(): { name: string; email: string };
}

class UserStepBuilder implements Step1, Step2, Step3 {
  private name: string = "";
  private email: string = "";

  static start(): Step1 {
    return new UserStepBuilder();
  }

  setName(name: string): Step2 {
    this.name = name;
    return this;
  }

  setEmail(email: string): Step3 {
    this.email = email;
    return this;
  }

  build(): { name: string; email: string } {
    return { name: this.name, email: this.email };
  }
}

// Forced order: must call setName, then setEmail, then build
const newUser = UserStepBuilder.start()
  .setName("Alex")
  .setEmail("alex@example.com")
  .build();
```

#### Example 2: Optional fields that preserve required type states
```typescript
class ConfigBuilder<THost = false, TPort = false> {
  private host?: string;
  private port?: number;
  private timeout: number = 5000;

  setHost(host: string): ConfigBuilder<true, TPort> {
    const next = new ConfigBuilder<true, TPort>();
    next.host = host;
    next.port = this.port;
    next.timeout = this.timeout;
    return next;
  }

  setPort(port: number): ConfigBuilder<THost, true> {
    const next = new ConfigBuilder<THost, true>();
    next.host = this.host;
    next.port = port;
    next.timeout = this.timeout;
    return next;
  }

  // Optional step: keeps current THost and TPort unchanged!
  setTimeout(ms: number): ConfigBuilder<THost, TPort> {
    const next = new ConfigBuilder<THost, TPort>();
    next.host = this.host;
    next.port = this.port;
    next.timeout = ms;
    return next;
  }

  build(this: ConfigBuilder<true, true>): { host: string; port: number; timeout: number } {
    return { host: this.host!, port: this.port!, timeout: this.timeout };
  }
}
```

---

### 6. Common mistakes

#### Mistake 1: Mutating `this` without returning the updated type
```typescript
// WRONG: Returning 'this' typed as current instance
class BadBuilder<THasData = false> {
  setData(data: string): this {
    return this; // Still typed as BadBuilder<false>!
  }
}
```
**Why it fails:** Calling `return this;` keeps the original `this` type (which is `BadBuilder<false>`). It does not update the generic parameter to `true`. You must return `BadBuilder<true>` (or cast `return this as unknown as BadBuilder<true>`).

#### Mistake 2: Missing `this` parameter typing on `.build()`
```typescript
// WRONG: Calling build without 'this' constraint
class MissingCheckBuilder<TReady> {
  build(): string {
    return "done"; // Can be called at any time, even when TReady is false!
  }
}
```
**Why it fails:** If `.build()` does not specify `this: MissingCheckBuilder<true>`, TypeScript will allow calling `.build()` immediately upon instantiation.

---

### 7. Rules to remember
1. Phantom types are generic parameters used strictly for type checking, not stored as runtime values.
2. Use `build(this: Builder<RequiredState1, RequiredState2>)` to lock the build method until requirements are satisfied.
3. Methods that supply a required field must transition the type parameter to its fulfilled marker.
4. Optional configuration methods must preserve existing type parameters: `method(...): Builder<T1, T2>`.

---

### Think first: Prediction puzzle
What happens when you compile this snippet?

```typescript
class ConnectionBuilder<TConnected = false> {
  connect(): ConnectionBuilder<true> {
    return new ConnectionBuilder<true>();
  }

  send(this: ConnectionBuilder<true>, msg: string): void {
    console.log(`Sent: ${msg}`);
  }
}

const conn = new ConnectionBuilder();
conn.send("hello");
```

---

**Answer:**
TypeScript compiler error on line `conn.send("hello")`:
```
The 'this' context of type 'ConnectionBuilder<false>' is not assignable to method's 'this' of type 'ConnectionBuilder<true>'.
```
**Reason:** `conn` is of type `ConnectionBuilder<false>`. The `send` method requires `this: ConnectionBuilder<true>`. To fix the error, the caller must call `.connect()` first: `conn.connect().send("hello")`.

---

### Practice exercises

#### Exercise 1: SQL Query Step-Builder
- **Task**: Create a `SelectQueryBuilder<TTable = false>` that requires `.from(table: string)` before `.execute()` can be called.
- **Hint 1**: Set `from(table: string): SelectQueryBuilder<true>`.
- **Hint 2**: Constrain `execute(this: SelectQueryBuilder<true>): string`.

#### Exercise 2: Two-step authentication builder
- **Task**: Build an `AuthSessionBuilder` requiring both `setUsername(u: string)` and `setPassword(p: string)` in any order before `.login()` can be called.
- **Hint 1**: Use two boolean phantom type parameters: `<THasUser = false, THasPass = false>`.
- **Hint 2**: `.login()` must require `this: AuthSessionBuilder<true, true>`.

#### Exercise 3: Strict state-machine interface builder
- **Task**: Implement a 3-stage interface chain for a deployment task: `InitStage` -> `BuildStage` -> `DeployStage`.
- **Hint 1**: Each interface method returns the interface of the next stage.
- **Hint 2**: `InitStage` has `setRepo(url: string): BuildStage`.

#### Exercise 4: Immutable builder with custom payload
- **Task**: Implement an immutable `JobBuilder<TData = void>` where `.withPayload<T>(data: T)` transitions the builder to `JobBuilder<T>`, and `.run(this: JobBuilder<object>): void` requires `TData` to be an object.
- **Hint 1**: Type `.withPayload<T>(data: T): JobBuilder<T>`.
- **Hint 2**: Set constraint `this: JobBuilder<object>` on `run()`.

---

### Exercise solutions

#### Solution 1: SQL Query Step-Builder
```typescript
class SelectQueryBuilder<TTable = false> {
  private table?: string;
  private fields: string[] = ["*"];

  select(fields: string[]): this {
    this.fields = fields;
    return this;
  }

  from(table: string): SelectQueryBuilder<true> {
    const next = new SelectQueryBuilder<true>();
    next.table = table;
    next.fields = this.fields;
    return next;
  }

  execute(this: SelectQueryBuilder<true>): string {
    return `SELECT ${this.fields.join(", ")} FROM ${this.table}`;
  }
}

const query = new SelectQueryBuilder().select(["id", "name"]).from("users").execute();
console.log(query);
```

#### Solution 2: Two-step authentication builder
```typescript
class AuthSessionBuilder<THasUser = false, THasPass = false> {
  private user?: string;
  private pass?: string;

  setUsername(user: string): AuthSessionBuilder<true, THasPass> {
    const next = new AuthSessionBuilder<true, THasPass>();
    next.user = user;
    next.pass = this.pass;
    return next;
  }

  setPassword(pass: string): AuthSessionBuilder<THasUser, true> {
    const next = new AuthSessionBuilder<THasUser, true>();
    next.user = this.user;
    next.pass = pass;
    return next;
  }

  login(this: AuthSessionBuilder<true, true>): string {
    return `Authenticated user: ${this.user}`;
  }
}

const session = new AuthSessionBuilder()
  .setPassword("secret")
  .setUsername("admin")
  .login();
```

#### Solution 3: Strict state-machine interface builder
```typescript
interface DeployStage {
  deploy(): string;
}

interface BuildStage {
  compile(): DeployStage;
}

interface InitStage {
  setRepo(url: string): BuildStage;
}

class Pipeline implements InitStage, BuildStage, DeployStage {
  private repo = "";

  static create(): InitStage {
    return new Pipeline();
  }

  setRepo(url: string): BuildStage {
    this.repo = url;
    return this;
  }

  compile(): DeployStage {
    return this;
  }

  deploy(): string {
    return `Deployed repo from ${this.repo}`;
  }
}

const pipeline = Pipeline.create().setRepo("github.com/org/repo").compile().deploy();
```

#### Solution 4: Immutable builder with custom payload
```typescript
class JobBuilder<TData = void> {
  constructor(private payload?: TData) {}

  withPayload<T extends object>(data: T): JobBuilder<T> {
    return new JobBuilder<T>(data);
  }

  run(this: JobBuilder<object>): string {
    return JSON.stringify(this.payload);
  }
}

const job = new JobBuilder().withPayload({ retries: 3 }).run();
```

---

### Recall
1. What is a "phantom type"? A generic type parameter that exists only at compile time for static checking and has no runtime value representation.
2. How do you prevent `.build()` from running when required fields are missing? By typing the method with a constrained `this` parameter: `build(this: Builder<true, true>)`.
3. Does the Type-State pattern add JavaScript runtime overhead? No; phantom types are completely erased during TypeScript compilation.

> **If you remember only one thing:**  
> The Type-State Step-Builder uses phantom generic parameters to track completed steps at compile time, completely eliminating invalid state errors before code runs.

---

# Topic 3: Fluent Builders with Type Parameter Accumulation

### 1. What is it?
A **Fluent Builder with Type Parameter Accumulation** is a builder that dynamically widens or extends its return type as keys are added. Instead of holding a fixed interface, each method call intersects (`T & { [K]: V }`) or merges the new property into the generic type accumulator.

### 2. Why does it exist?
When constructing dynamic configuration objects or entities where properties are optional or discovered incrementally, a fixed class requires defining every possible permutation of fields. By accumulating types across chained calls, the final `.build()` method returns an exact object type containing precisely the keys that were set:
```typescript
const config = new ConfigAccumulator()
  .set("host", "localhost")
  .set("port", 8080)
  .build();
// Inferred type: { host: string; port: number }
```

### 3. Basic example

```typescript
class RecordAccumulator<T = {}> {
  private data: Record<string, any> = {};

  constructor(initialData?: Record<string, any>) {
    if (initialData) {
      this.data = { ...initialData };
    }
  }

  set<K extends string, V>(key: K, value: V): RecordAccumulator<T & Record<K, V>> {
    const next = new RecordAccumulator<T & Record<K, V>>(this.data);
    next.data[key] = value;
    return next;
  }

  build(): T {
    return this.data as T;
  }
}

const userSettings = new RecordAccumulator()
  .set("theme", "dark")
  .set("fontSize", 14)
  .set("notifications", true)
  .build();

// TypeScript infers:
// userSettings: { theme: string } & { fontSize: number } & { notifications: boolean }
console.log(userSettings.theme);
console.log(userSettings.fontSize);
```

**Line-by-line explanation:**
- `class RecordAccumulator<T = {}>`: The accumulator starts with an empty object type `{}` as default.
- `set<K extends string, V>(key: K, value: V)`: Captures the literal key name `K` and value type `V`.
- `RecordAccumulator<T & Record<K, V>>`: Returns a new accumulator whose generic type is the intersection of the previous type `T` and the new `{ [K]: V }`.
- `build(): T`: Returns the accumulated object typed as `T`.
- `userSettings.theme`: TypeScript knows `theme` exists and is a `string`.

---

### 4. How it works inside TypeScript
1. **Intersection Chaining**: Each call to `.set("k", v)` intersects the accumulator with `Record<"k", typeof v>`.
2. **Type Simplification**: TypeScript preserves intersection types until properties are accessed. Property accesses like `userSettings.theme` resolve cleanly across the intersection.
3. **Literal Key Preservation**: By constraining `K extends string`, passing `"theme"` keeps the string literal `"theme"` rather than widening to generic `string`.

---

### 5. More examples

#### Example 1: Preventing duplicate keys from being overwritten
```typescript
class SafeAccumulator<T = {}> {
  private state: Record<string, any> = {};

  constructor(state?: Record<string, any>) {
    if (state) this.state = { ...state };
  }

  // K must NOT already be a key in T!
  set<K extends string, V>(
    key: K extends keyof T ? never : K,
    value: V
  ): SafeAccumulator<T & Record<K, V>> {
    const next = new SafeAccumulator<T & Record<K, V>>(this.state);
    next.state[key as string] = value;
    return next;
  }

  build(): T {
    return this.state as T;
  }
}

const safe = new SafeAccumulator()
  .set("host", "127.0.0.1")
  // .set("host", "localhost") // Compile error: Argument of type '"host"' is not assignable to parameter of type 'never'!
  .set("port", 3000)
  .build();
```

#### Example 2: Type-safe dynamic schema builder
```typescript
type Validator<T> = (val: unknown) => val is T;

class SchemaBuilder<TShape = {}> {
  private fields = new Map<string, Validator<any>>();

  field<K extends string, TType>(
    name: K,
    validator: Validator<TType>
  ): SchemaBuilder<TShape & Record<K, TType>> {
    const next = new SchemaBuilder<TShape & Record<K, TType>>();
    for (const [k, v] of this.fields) next.fields.set(k, v);
    next.fields.set(name, validator);
    return next;
  }

  validate(data: Record<string, unknown>): data is TShape {
    for (const [k, validator] of this.fields) {
      if (!validator(data[k])) return false;
    }
    return true;
  }
}
```

---

### 6. Common mistakes

#### Mistake 1: Widening keys to `string`
```typescript
// WRONG: Not making key a generic parameter K
set(key: string, value: any): RecordAccumulator<T & Record<string, any>> {
  // Lost literal key name!
}
```
**Why it fails:** If `key` is typed as plain `string`, TypeScript forgets the exact name of the property. The returned object will have an index signature `Record<string, any>` instead of specific property names like `host` or `port`.

```typescript
// CORRECT: Capture K extends string
set<K extends string, V>(key: K, value: V): RecordAccumulator<T & Record<K, V>>
```

#### Mistake 2: Mutating the same accumulator instance across branches
```typescript
// WRONG: In-place mutation can corrupt shared branches
const base = new RecordAccumulator().set("env", "prod");
const configA = base.set("port", 80);
const configB = base.set("port", 443); // If mutating in-place, configA.port becomes 443!
```
**Why it fails:** Accumulators must be immutable. Each call to `.set()` must copy the internal dictionary so that branching builders do not overwrite each other's state.

---

### 7. Rules to remember
1. Always make the key a generic parameter `K extends string` to capture literal string types.
2. Accumulate properties using intersection types: `T & Record<K, V>`.
3. To disallow duplicate property definition, type the key parameter as `K extends keyof T ? never : K`.
4. Copy the internal state on every step to maintain immutability.

---

### Think first: Prediction puzzle
What is the inferred type of `result` below?

```typescript
class Builder<T = {}> {
  add<K extends string, V>(k: K, v: V): Builder<T & Record<K, V>> {
    return new Builder<T & Record<K, V>>();
  }
  build(): T {
    return {} as T;
  }
}

const result = new Builder()
  .add("id", 101)
  .add("name", "Settings")
  .build();
```

---

**Answer:**
The inferred type of `result` is:
```typescript
Record<"id", number> & Record<"name", string>
```
Which is functionally equivalent to `{ id: number; name: string }`.

---

### Practice exercises

#### Exercise 1: Basic accumulator
- **Task**: Implement a `PropAccumulator` class with `.put(key, value)` and `.get()` methods.
- **Hint 1**: The class signature should be `class PropAccumulator<T = {}>`.
- **Hint 2**: `.put<K extends string, V>(k: K, v: V): PropAccumulator<T & Record<K, V>>`.

#### Exercise 2: Prevent overwriting existing keys
- **Task**: Add a duplicate guard to `PropAccumulator` so passing an existing key causes a compile error.
- **Hint 1**: Set key type to `K extends keyof T ? never : K`.

#### Exercise 3: Pre-seeded accumulator
- **Task**: Allow `PropAccumulator` to be initialized with an existing typed object: `new PropAccumulator({ id: "init" })`.
- **Hint 1**: Constructor accepts `initial: T`.

#### Exercise 4: Merging two accumulators
- **Task**: Add a method `.merge<U>(other: PropAccumulator<U>): PropAccumulator<T & U>` that combines two accumulators into a single object.
- **Hint 1**: Return `new PropAccumulator<T & U>({ ...this.data, ...other.data })`.

---

### Exercise solutions

#### Solution 1: Basic accumulator
```typescript
class PropAccumulator<T = {}> {
  private store: Record<string, any> = {};

  put<K extends string, V>(key: K, val: V): PropAccumulator<T & Record<K, V>> {
    const next = new PropAccumulator<T & Record<K, V>>();
    next.store = { ...this.store, [key]: val };
    return next;
  }

  get(): T {
    return this.store as T;
  }
}

const obj = new PropAccumulator().put("count", 42).put("active", true).get();
console.log(obj.count, obj.active);
```

#### Solution 2: Prevent overwriting existing keys
```typescript
class SafePropAccumulator<T = {}> {
  private store: Record<string, any> = {};

  put<K extends string, V>(
    key: K extends keyof T ? never : K,
    val: V
  ): SafePropAccumulator<T & Record<K, V>> {
    const next = new SafePropAccumulator<T & Record<K, V>>();
    next.store = { ...this.store, [key as string]: val };
    return next;
  }

  get(): T {
    return this.store as T;
  }
}
```

#### Solution 3: Pre-seeded accumulator
```typescript
class SeededAccumulator<T> {
  private store: Record<string, any>;

  constructor(initial: T) {
    this.store = { ...(initial as Record<string, any>) };
  }

  put<K extends string, V>(key: K, val: V): SeededAccumulator<T & Record<K, V>> {
    const next = new SeededAccumulator<T & Record<K, V>>({} as any);
    next.store = { ...this.store, [key]: val };
    return next;
  }

  get(): T {
    return this.store as T;
  }
}

const seeded = new SeededAccumulator({ defaultRole: "guest" }).put("timeout", 1000).get();
```

#### Solution 4: Merging two accumulators
```typescript
class MergeableAccumulator<T = {}> {
  public store: Record<string, any> = {};

  put<K extends string, V>(key: K, val: V): MergeableAccumulator<T & Record<K, V>> {
    const next = new MergeableAccumulator<T & Record<K, V>>();
    next.store = { ...this.store, [key]: val };
    return next;
  }

  merge<U>(other: MergeableAccumulator<U>): MergeableAccumulator<T & U> {
    const next = new MergeableAccumulator<T & U>();
    next.store = { ...this.store, ...other.store };
    return next;
  }

  get(): T {
    return this.store as T;
  }
}

const acc1 = new MergeableAccumulator().put("a", 1);
const acc2 = new MergeableAccumulator().put("b", "two");
const combined = acc1.merge(acc2).get();
console.log(combined.a, combined.b);
```

---

### Recall
1. What does `T & Record<K, V>` do to the generic type parameter? It intersects the previous type with the newly added key-value pair, producing a combined type.
2. Why is `K extends string` preferred over `key: string`? It keeps the exact literal string name of the property instead of discarding it to generic `string`.
3. How can you cause a compile error if a caller tries to set an existing key? By typing the key parameter as `K extends keyof T ? never : K`.

> **If you remember only one thing:**  
> By intersecting type parameters on every method call (`T & Record<K, V>`), a fluent builder accumulates exact property names and types dynamically.

---

# Topic 4: Singleton Pattern and Module-Level Encapsulation

### 1. What is it?
The **Singleton Pattern** ensures that a class has only one instance and provides a global access point to it. In modern TypeScript, singletons can be created via classical private constructors or via **module-level export encapsulation**.

### 2. Why does it exist?
Certain shared resources—such as a database connection pool, a global configuration manager, or a hardware clock client—must have exactly one coordinated coordinator. Creating multiple instances can cause socket exhaustion, conflicting writes, or out-of-sync cache state.

### 3. Basic example

```typescript
class DatabaseConnection {
  private static instance: DatabaseConnection | null = null;
  private isConnected: boolean = false;

  // Private constructor prevents direct 'new DatabaseConnection()' calls
  private constructor() {
    this.isConnected = true;
  }

  public static getInstance(): DatabaseConnection {
    if (!DatabaseConnection.instance) {
      DatabaseConnection.instance = new DatabaseConnection();
    }
    return DatabaseConnection.instance;
  }

  public query(sql: string): string {
    return `Executing "${sql}" on active connection`;
  }
}

// Usage:
const db1 = DatabaseConnection.getInstance();
const db2 = DatabaseConnection.getInstance();

console.log(db1 === db2); // true: both reference the identical instance
```

**Line-by-line explanation:**
- `private static instance: DatabaseConnection | null = null;`: Holds the single cached instance in static memory.
- `private constructor()`: Disallows `new DatabaseConnection()`. Calling `new` outside the class triggers a TypeScript compile error.
- `public static getInstance()`: The gatekeeper method. If `instance` is `null`, it instantiates the class once; otherwise it returns the existing instance.
- `console.log(db1 === db2)`: Confirms reference equality. Both variables point to the exact same heap memory allocation.

---

### 4. How it works inside TypeScript
1. **Private Constructor**: Marking `constructor()` as `private` removes the constructor signature from the public static type, making `new DatabaseConnection()` illegal.
2. **Static Property Persistence**: The static property `instance` lives on the constructor function object in JavaScript memory for the lifetime of the application process.
3. **Module Singleton Alternative**: In ES modules, exporting a `const instance = new Service()` creates a module-level singleton because Node.js and bundlers cache evaluated module exports.

---

### 5. More examples

#### Example 1: Module-level singleton (the idiomatic modern TS approach)
```typescript
// config.ts
class AppConfig {
  readonly environment: string;
  readonly port: number;

  constructor() {
    this.environment = "production";
    this.port = 8080;
  }
}

// Export a single instance directly:
export const appConfig = new AppConfig();
// Any file importing appConfig receives the exact same cached object reference!
```

#### Example 2: Thread-safe lazy initialization with reset for unit tests
```typescript
class CacheRegistry {
  private static instance: CacheRegistry | null = null;
  private cache = new Map<string, unknown>();

  private constructor() {}

  static get instance(): CacheRegistry {
    if (!this.instance) {
      this.instance = new CacheRegistry();
    }
    return this.instance;
  }

  set(key: string, value: unknown): void {
    this.cache.set(key, value);
  }

  get(key: string): unknown {
    return this.cache.get(key);
  }

  // Testing hook to reset state between test cases
  static resetForTesting(): void {
    this.instance = null;
  }
}

const cache = CacheRegistry.instance;
cache.set("user_1", { name: "Alice" });
```

---

### 6. Common mistakes

#### Mistake 1: Leaving constructor public
```typescript
// WRONG: Default public constructor
class LeakySingleton {
  private static instance = new LeakySingleton();
  static getInstance() { return this.instance; }
  // constructor is implicitly public!
}

const a = LeakySingleton.getInstance();
const b = new LeakySingleton(); // Legal! Breaks singleton contract!
```
**Why it fails:** If you omit `private constructor()`, TypeScript provides a default public constructor. Anyone can bypass `.getInstance()` by calling `new`.

#### Mistake 2: Singletons across dual-package hazard or multi-bundle environments
```typescript
// Gotcha: Bundling the same singleton file into two separate chunks
// Chunk A imports from dist/esm/singleton.js
// Chunk B imports from dist/cjs/singleton.js
// Two separate module instances are created!
```
**Why it fails:** Module-level singletons rely on module resolution caching. If two different build bundles or package versions load the file, two instances will exist. For global cross-bundle singletons, store on `globalThis`:
```typescript
const GLOBAL_KEY = Symbol.for("app.database.singleton");
const globalScope = globalThis as unknown as { [GLOBAL_KEY]?: DatabaseConnection };
```

---

### 7. Rules to remember
1. Always mark the `constructor()` as `private`.
2. Provide a `public static getInstance()` method or a `static get instance` getter.
3. For unit testing, provide a controlled `resetForTesting()` hook if the singleton maintains mutable state.
4. Prefer exporting a `const instance = new Service()` for simple module-scoped singletons unless you need lazy initialization.

---

### Think first: Prediction puzzle
What does the following code log?

```typescript
class Counter {
  private static _instance: Counter | null = null;
  public count = 0;

  private constructor() {}

  static get instance(): Counter {
    if (!this._instance) this._instance = new Counter();
    return this._instance;
  }
}

const c1 = Counter.instance;
c1.count += 5;

const c2 = Counter.instance;
c2.count += 10;

console.log(Counter.instance.count);
```

---

**Answer:**
```
15
```
**Execution trace:**
1. `c1` initializes the singleton. `count` is incremented by 5 (now 5).
2. `c2` retrieves the existing singleton reference.
3. `c2.count += 10` adds 10 to the existing 5 (now 15).
4. `Counter.instance.count` accesses the same instance and prints `15`.

---

### Practice exercises

#### Exercise 1: Application Clock Singleton
- **Task**: Implement a `SystemClock` singleton with method `now(): number` returning `Date.now()`.
- **Hint 1**: Mark the constructor `private`.
- **Hint 2**: Use `static getInstance(): SystemClock`.

#### Exercise 2: Testable singleton with reset
- **Task**: Implement an `AuditLog` singleton that stores log strings in an internal array. Provide a static `_reset()` method that clears the instance for tests.
- **Hint 1**: `static _reset() { this.instance = null; }`.

#### Exercise 3: Global scope attached singleton
- **Task**: Write a singleton that attaches to `globalThis` using `Symbol.for("my.app.singleton")` to survive dual-package imports.
- **Hint 1**: Check `(globalThis as any)[KEY]`.

#### Exercise 4: Async initialized singleton
- **Task**: Implement an `AsyncDb` singleton where `.getInstance()` returns `Promise<AsyncDb>` and runs an async connection step only on the first call.
- **Hint 1**: Store `private static initPromise: Promise<AsyncDb> | null = null;`.

---

### Exercise solutions

#### Solution 1: Application Clock Singleton
```typescript
class SystemClock {
  private static instance: SystemClock | null = null;
  private constructor() {}

  static getInstance(): SystemClock {
    if (!this.instance) {
      this.instance = new SystemClock();
    }
    return this.instance;
  }

  now(): number {
    return Date.now();
  }
}

const clock1 = SystemClock.getInstance();
const clock2 = SystemClock.getInstance();
console.log(clock1 === clock2);
```

#### Solution 2: Testable singleton with reset
```typescript
class AuditLog {
  private static _instance: AuditLog | null = null;
  private entries: string[] = [];

  private constructor() {}

  static get instance(): AuditLog {
    if (!this._instance) this._instance = new AuditLog();
    return this._instance;
  }

  log(msg: string): void {
    this.entries.push(msg);
  }

  getEntries(): string[] {
    return [...this.entries];
  }

  static _reset(): void {
    this._instance = null;
  }
}
```

#### Solution 3: Global scope attached singleton
```typescript
const GLOBAL_SINGLETON_KEY = Symbol.for("app.metrics.singleton");

class MetricsCollector {
  private count = 0;
  increment() { this.count++; }
  get value() { return this.count; }
}

function getGlobalMetrics(): MetricsCollector {
  const g = globalThis as any;
  if (!g[GLOBAL_SINGLETON_KEY]) {
    g[GLOBAL_SINGLETON_KEY] = new MetricsCollector();
  }
  return g[GLOBAL_SINGLETON_KEY];
}
```

#### Solution 4: Async initialized singleton
```typescript
class AsyncDb {
  private static instance: AsyncDb | null = null;
  private static initPromise: Promise<AsyncDb> | null = null;

  private constructor() {}

  static async getInstance(): Promise<AsyncDb> {
    if (this.instance) return this.instance;
    if (!this.initPromise) {
      this.initPromise = (async () => {
        const db = new AsyncDb();
        // simulate async handshake
        await new Promise((res) => setTimeout(res, 10));
        this.instance = db;
        return db;
      })();
    }
    return this.initPromise;
  }
}
```

---

### Recall
1. Why must the constructor of a classical singleton be marked `private`? To prevent external code from creating new instances with `new`.
2. How does ES module caching act as a singleton? A module is evaluated once when first imported; subsequent imports receive the cached export references.
3. What is the danger of mutable singletons in unit testing suites? State changes in one test leak into subsequent tests, causing intermittent test failures.

> **If you remember only one thing:**  
> A TypeScript singleton combines a `private constructor()` with a static accessor method to guarantee that exactly one instance exists across the application.

---

# Topic 5: The Generic Repository Pattern with Type-Safe Query Specifications

### 1. What is it?
The **Generic Repository Pattern** abstracts data persistence operations behind a collection-like interface (`find`, `save`, `delete`). Combined with the **Specification Pattern**, queries are encapsulated into reusable, combinable type-safe filter objects (`and`, `or`, `not`).

### 2. Why does it exist?
Hardcoding database queries or ORM calls directly inside business controllers tightly couples business logic to the database schema:
```typescript
// Anti-pattern: Leaking SQL/ORM into controllers
class UserController {
  async getActiveUsers() {
    return db.query("SELECT * FROM users WHERE status = 'active' AND age > 18");
  }
}
```
If you switch from PostgreSQL to MongoDB or want to test business logic in memory, every controller must be rewritten. The Generic Repository decouples storage from domain logic, and Specifications allow type-safe composable filtering.

### 3. Basic example

```typescript
// 1. Entity Base Contract
interface Entity {
  id: string;
}

// 2. Generic Repository Interface
interface Repository<T extends Entity> {
  findById(id: string): Promise<T | null>;
  findAll(spec?: Specification<T>): Promise<T[]>;
  save(entity: T): Promise<void>;
  delete(id: string): Promise<boolean>;
}

// 3. Specification Pattern Interface
interface Specification<T> {
  isSatisfiedBy(candidate: T): boolean;
}

// 4. In-Memory Implementation
class InMemoryRepository<T extends Entity> implements Repository<T> {
  private items = new Map<string, T>();

  async findById(id: string): Promise<T | null> {
    return this.items.get(id) ?? null;
  }

  async findAll(spec?: Specification<T>): Promise<T[]> {
    const all = Array.from(this.items.values());
    if (!spec) return all;
    return all.filter((item) => spec.isSatisfiedBy(item));
  }

  async save(entity: T): Promise<void> {
    this.items.set(entity.id, entity);
  }

  async delete(id: string): Promise<boolean> {
    return this.items.delete(id);
  }
}

// Usage
interface User extends Entity {
  id: string;
  name: string;
  active: boolean;
}

class ActiveUserSpec implements Specification<User> {
  isSatisfiedBy(user: User): boolean {
    return user.active;
  }
}

async function run() {
  const repo = new InMemoryRepository<User>();
  await repo.save({ id: "1", name: "Alice", active: true });
  await repo.save({ id: "2", name: "Bob", active: false });

  const activeUsers = await repo.findAll(new ActiveUserSpec());
  console.log(activeUsers.length); // 1 (Alice)
}
run();
```

**Line-by-line explanation:**
- `interface Entity { id: string; }`: Enforces that every managed domain entity has a unique identifier.
- `interface Repository<T extends Entity>`: Defines generic CRUD methods parameterised by the entity type `T`.
- `interface Specification<T>`: Declares the predicate contract `isSatisfiedBy(candidate: T): boolean`.
- `InMemoryRepository<T>`: Implements storage using a `Map<string, T>`.
- `findAll(spec?: Specification<T>)`: Uses the specification's `isSatisfiedBy` to filter items without modifying repository internals.

---

### 4. How it works inside TypeScript
1. **Generic Constraints**: `<T extends Entity>` allows the repository implementation to rely on `entity.id` safely across all operations.
2. **Predicate Inversion**: The specification encapsulates domain query rules into standalone classes, keeping the repository generic and decoupled.
3. **Composable Logic**: Specifications can be chained using composite operations (`AndSpecification`, `OrSpecification`).

---

### 5. More examples

#### Example 1: Composable Specifications (`and`, `or`, `not`)
```typescript
abstract class CompositeSpecification<T> implements Specification<T> {
  abstract isSatisfiedBy(candidate: T): boolean;

  and(other: Specification<T>): Specification<T> {
    return new AndSpecification(this, other);
  }

  or(other: Specification<T>): Specification<T> {
    return new OrSpecification(this, other);
  }
}

class AndSpecification<T> extends CompositeSpecification<T> {
  constructor(private left: Specification<T>, private right: Specification<T>) {
    super();
  }
  isSatisfiedBy(candidate: T): boolean {
    return this.left.isSatisfiedBy(candidate) && this.right.isSatisfiedBy(candidate);
  }
}

class OrSpecification<T> extends CompositeSpecification<T> {
  constructor(private left: Specification<T>, private right: Specification<T>) {
    super();
  }
  isSatisfiedBy(candidate: T): boolean {
    return this.left.isSatisfiedBy(candidate) || this.right.isSatisfiedBy(candidate);
  }
}

class MinAgeSpec extends CompositeSpecification<{ age: number }> {
  constructor(private min: number) { super(); }
  isSatisfiedBy(candidate: { age: number }): boolean {
    return candidate.age >= this.min;
  }
}

class PremiumSpec extends CompositeSpecification<{ isPremium: boolean }> {
  isSatisfiedBy(candidate: { isPremium: boolean }): boolean {
    return candidate.isPremium;
  }
}

// Chain: (age >= 18) AND (isPremium == true)
const eligibleSpec = new MinAgeSpec(18).and(new PremiumSpec());
```

#### Example 2: Type-safe property specification using keyof
```typescript
class PropertyEqualsSpec<T, K extends keyof T> implements Specification<T> {
  constructor(private key: K, private expected: T[K]) {}

  isSatisfiedBy(candidate: T): boolean {
    return candidate[this.key] === this.expected;
  }
}

interface Order extends Entity {
  id: string;
  status: "pending" | "shipped" | "delivered";
}

const pendingOrderSpec = new PropertyEqualsSpec<Order, "status">("status", "pending");
```

---

### 6. Common mistakes

#### Mistake 1: Exposing SQL/ORM types in the repository interface
```typescript
// WRONG: Coupling repository contract to Prisma/TypeORM
interface UserRepository {
  find(query: Prisma.UserWhereInput): Promise<User[]>; // Leaks DB driver!
}
```
**Why it fails:** If you replace the database driver or try to write an in-memory repository for fast unit tests, your test code must mock complex ORM driver objects. Keep the interface agnostic using Domain Specifications.

#### Mistake 2: Returning internal mutable entity references
```typescript
// WRONG: Returning internal references
async findById(id: string): Promise<T | null> {
  return this.items.get(id) ?? null; // Caller can mutate this item in-place without save()!
}
```
**Why it fails:** Modifying the returned object directly updates the internal cache without triggering change detection or domain events. Return a clone (`{ ...item }` or `structuredClone(item)`).

---

### 7. Rules to remember
1. Repository interfaces should be generic over `<T extends Entity>` and independent of database drivers.
2. The Specification pattern moves query filter logic into testable, composable predicates (`isSatisfiedBy`).
3. Specifications can be combined with `and()`, `or()`, and `not()` operators.
4. Clone entities on return to protect the repository's internal state.

---

### Think first: Prediction puzzle
What does this test print?

```typescript
interface Item {
  id: string;
  price: number;
}

const items: Item[] = [
  { id: "1", price: 10 },
  { id: "2", price: 50 },
  { id: "3", price: 100 },
];

const cheapSpec = { isSatisfiedBy: (i: Item) => i.price < 60 };
const expensiveSpec = { isSatisfiedBy: (i: Item) => i.price > 20 };

const combined = items.filter((i) => cheapSpec.isSatisfiedBy(i) && expensiveSpec.isSatisfiedBy(i));
console.log(combined.map((i) => i.id));
```

---

**Answer:**
```
[ "2" ]
```
**Explanation:**
- Item 1: price 10 is `< 60` (true), but not `> 20` (false).
- Item 2: price 50 is `< 60` (true) AND `> 20` (true). Matches!
- Item 3: price 100 is not `< 60` (false).
Only Item `"2"` satisfies both specifications.

---

### Practice exercises

#### Exercise 1: In-memory repository with count
- **Task**: Extend `Repository<T>` with a `count(spec?: Specification<T>): Promise<number>` method and implement it in `InMemoryRepository`.
- **Hint 1**: Call `(await this.findAll(spec)).length`.

#### Exercise 2: Negation specification (`NotSpecification`)
- **Task**: Implement a `NotSpecification<T>` that wraps any specification and inverts its result.
- **Hint 1**: `!this.inner.isSatisfiedBy(candidate)`.

#### Exercise 3: Key range specification
- **Task**: Create a specification `NumberRangeSpec<T, K extends keyof T>` where `T[K]` is a number, checking `min <= candidate[key] && candidate[key] <= max`.
- **Hint 1**: Constrain `T[K] extends number`.

#### Exercise 4: Unit test with mocked repository
- **Task**: Write a service `UserRegistrationService` that accepts `Repository<User>` in its constructor. Test user creation with `InMemoryRepository`.
- **Hint 1**: The service method calls `await this.repo.save(user)`.

---

### Exercise solutions

#### Solution 1: In-memory repository with count
```typescript
interface ExtendedRepo<T extends Entity> extends Repository<T> {
  count(spec?: Specification<T>): Promise<number>;
}

class ExtendedInMemoryRepo<T extends Entity> extends InMemoryRepository<T> implements ExtendedRepo<T> {
  async count(spec?: Specification<T>): Promise<number> {
    const matches = await this.findAll(spec);
    return matches.length;
  }
}
```

#### Solution 2: Negation specification (`NotSpecification`)
```typescript
class NotSpecification<T> implements Specification<T> {
  constructor(private spec: Specification<T>) {}
  isSatisfiedBy(candidate: T): boolean {
    return !this.spec.isSatisfiedBy(candidate);
  }
}
```

#### Solution 3: Key range specification
```typescript
class NumberRangeSpec<T, K extends keyof T> implements Specification<T> {
  constructor(
    private key: K,
    private min: number,
    private max: number
  ) {}

  isSatisfiedBy(candidate: T): boolean {
    const val = candidate[this.key] as unknown as number;
    return val >= this.min && val <= this.max;
  }
}
```

#### Solution 4: Unit test with mocked repository
```typescript
class UserService {
  constructor(private repo: Repository<User>) {}

  async registerUser(id: string, name: string): Promise<void> {
    const existing = await this.repo.findById(id);
    if (existing) throw new Error("User exists");
    await this.repo.save({ id, name, active: true });
  }
}

async function testService() {
  const repo = new InMemoryRepository<User>();
  const service = new UserService(repo);

  await service.registerUser("u100", "Alice");
  const saved = await repo.findById("u100");
  console.log(saved?.name === "Alice"); // true
}
testService();
```

---

### Recall
1. What is the main benefit of the Generic Repository pattern? It decouples business domain logic from specific database drivers and ORMs.
2. How does the Specification pattern improve filtering? It encapsulates query rules into testable, reusable classes with `isSatisfiedBy(item)` methods.
3. Why should repository interfaces be typed with `<T extends Entity>`? To guarantee all entities have an identifiable key (`id`) for indexing and queries.

> **If you remember only one thing:**  
> The Generic Repository pattern provides collection-like persistence, while Specifications encapsulate query filters into composable, testable objects.

---

# Checkpoint Challenge 1: Creational & Repository Architecture (Topics 1-5)

### Challenge Specification
Design an order processing setup combining:
1. A **Type-State Order Builder** requiring `setCustomer(id: string)` and `addItem(sku: string, price: number)` before calling `.build()`.
2. A **Generic Repository** to persist the built orders in memory.
3. A **Specification** that finds orders whose total price exceeds a minimum threshold.

### Solution

```typescript
// 1. Order Entity & State Markers
interface HasCustomer {}
interface HasItems {}

interface OrderItem {
  sku: string;
  price: number;
}

interface OrderEntity {
  id: string;
  customerId: string;
  items: OrderItem[];
  total: number;
}

// 2. Type-State Step Builder
class OrderBuilder<TCustomer = false, TItems = false> {
  private id: string = `ord_${Date.now()}`;
  private customerId?: string;
  private items: OrderItem[] = [];

  setCustomer(customerId: string): OrderBuilder<true, TItems> {
    const next = new OrderBuilder<true, TItems>();
    next.id = this.id;
    next.customerId = customerId;
    next.items = [...this.items];
    return next;
  }

  addItem(sku: string, price: number): OrderBuilder<TCustomer, true> {
    const next = new OrderBuilder<TCustomer, true>();
    next.id = this.id;
    next.customerId = this.customerId;
    next.items = [...this.items, { sku, price }];
    return next;
  }

  build(this: OrderBuilder<true, true>): OrderEntity {
    const total = this.items.reduce((sum, item) => sum + item.price, 0);
    return {
      id: this.id,
      customerId: this.customerId!,
      items: this.items,
      total,
    };
  }
}

// 3. Generic Specification & High-Value Filter
interface Specification<T> {
  isSatisfiedBy(candidate: T): boolean;
}

class MinOrderTotalSpec implements Specification<OrderEntity> {
  constructor(private minAmount: number) {}
  isSatisfiedBy(order: OrderEntity): boolean {
    return order.total >= this.minAmount;
  }
}

// 4. In-Memory Order Repository
class OrderRepository {
  private orders = new Map<string, OrderEntity>();

  async save(order: OrderEntity): Promise<void> {
    this.orders.set(order.id, order);
  }

  async find(spec: Specification<OrderEntity>): Promise<OrderEntity[]> {
    return Array.from(this.orders.values()).filter((o) => spec.isSatisfiedBy(o));
  }
}

// 5. Verification Run
async function runCheckpoint1() {
  const repo = new OrderRepository();

  const order1 = new OrderBuilder()
    .setCustomer("cust_101")
    .addItem("SKU_LAPTOP", 1200)
    .build();

  const order2 = new OrderBuilder()
    .setCustomer("cust_102")
    .addItem("SKU_CABLE", 25)
    .build();

  await repo.save(order1);
  await repo.save(order2);

  const highValueOrders = await repo.find(new MinOrderTotalSpec(500));
  console.log(`High value orders found: ${highValueOrders.length}`); // 1 (order1)
}
runCheckpoint1();
```


---

# Topic 6: Unit of Work & Identity Map Pattern

### 1. What is it?
The **Unit of Work** pattern maintains a list of entities affected by a business transaction and coordinates the writing of changes. The **Identity Map** ensures that each entity is loaded only once per session or transaction by maintaining a map of primary keys to in-memory instances.

### 2. Why does it exist?
Without an Identity Map, loading the same user twice in one request creates two independent objects:
```typescript
const userA = await repo.findById("u1");
const userB = await repo.findById("u1");
userA.name = "Alice Updated";
await repo.save(userB); // Overwrites userA's change because userB had the stale name!
```
This is the "lost update" problem. Without a Unit of Work, updating 5 items executes 5 separate database network trips. A Unit of Work aggregates inserts, updates, and deletes into a single atomic transactional commit.

### 3. Basic example

```typescript
interface Entity {
  id: string;
}

class IdentityMap<T extends Entity> {
  private cache = new Map<string, T>();

  get(id: string): T | undefined {
    return this.cache.get(id);
  }

  set(entity: T): void {
    this.cache.set(entity.id, entity);
  }

  has(id: string): boolean {
    return this.cache.has(id);
  }

  clear(): void {
    this.cache.clear();
  }
}

class UnitOfWork<T extends Entity> {
  private toInsert = new Set<T>();
  private toUpdate = new Set<T>();
  private toDelete = new Set<T>();
  private identityMap = new IdentityMap<T>();

  registerNew(entity: T): void {
    this.toInsert.add(entity);
    this.identityMap.set(entity);
  }

  registerDirty(entity: T): void {
    if (!this.toInsert.has(entity)) {
      this.toUpdate.add(entity);
    }
  }

  registerRemoved(entity: T): void {
    if (this.toInsert.has(entity)) {
      this.toInsert.delete(entity);
      return;
    }
    this.toUpdate.delete(entity);
    this.toDelete.add(entity);
  }

  async commit(
    sink: {
      insert(items: T[]): Promise<void>;
      update(items: T[]): Promise<void>;
      delete(items: T[]): Promise<void>;
    }
  ): Promise<void> {
    if (this.toInsert.size > 0) await sink.insert(Array.from(this.toInsert));
    if (this.toUpdate.size > 0) await sink.update(Array.from(this.toUpdate));
    if (this.toDelete.size > 0) await sink.delete(Array.from(this.toDelete));

    this.toInsert.clear();
    this.toUpdate.clear();
    this.toDelete.clear();
  }

  get(id: string): T | undefined {
    return this.identityMap.get(id);
  }
}
```

**Line-by-line explanation:**
- `class IdentityMap<T extends Entity>`: Caches objects by `id` so lookups return the exact same instance in memory.
- `private toInsert = new Set<T>()`: Holds entities created during this transaction.
- `private toUpdate = new Set<T>()`: Holds entities modified during this transaction.
- `private toDelete = new Set<T>()`: Holds entities marked for removal.
- `registerDirty(entity)`: If an entity was already marked for insert, it stays in `toInsert`. Otherwise it is queued in `toUpdate`.
- `commit(sink)`: Batches each category into single bulk operations (`insert`, `update`, `delete`), then empties the tracking sets.

---

### 4. How it works inside TypeScript
1. **Reference Tracking**: By using `Set<T>`, duplicate registrations of the same object reference are automatically ignored.
2. **Transaction Scoping**: A `UnitOfWork` instance is created per request/transaction and discarded after `commit()`, ensuring changes do not bleed between requests.
3. **Identity Coherence**: `IdentityMap` ensures `u1 === u2` for any query during that transaction.

---

### 5. More examples

#### Example 1: Rollback capability on transaction failure
```typescript
class TransactionUnitOfWork<T extends Entity> {
  private inserted: T[] = [];
  private updated: T[] = [];
  private deleted: T[] = [];

  registerNew(item: T) { this.inserted.push(item); }
  registerDirty(item: T) { this.updated.push(item); }
  registerDeleted(item: T) { this.deleted.push(item); }

  rollback(): void {
    this.inserted = [];
    this.updated = [];
    this.deleted = [];
    console.log("Unit of Work rolled back: tracking sets cleared");
  }
}
```

#### Example 2: Snapshot-based automatic dirty checking
```typescript
class DirtyCheckingUnitOfWork<T extends Entity> {
  private snapshots = new Map<string, string>();
  private entities = new Map<string, T>();

  registerLoaded(entity: T): void {
    this.entities.set(entity.id, entity);
    this.snapshots.set(entity.id, JSON.stringify(entity));
  }

  getDirtyEntities(): T[] {
    const dirty: T[] = [];
    for (const [id, entity] of this.entities) {
      const original = this.snapshots.get(id);
      if (original !== JSON.stringify(entity)) {
        dirty.push(entity);
      }
    }
    return dirty;
  }
}
```

---

### 6. Common mistakes

#### Mistake 1: Making Identity Map global across all HTTP requests
```typescript
// WRONG: Single global identity map across entire server process
export const globalIdentityMap = new IdentityMap<User>(); // LEAKS MEMORY and causes cross-user concurrency bugs!
```
**Why it fails:** An Identity Map held across all HTTP requests will continuously grow in memory (memory leak) and serve stale data from User A to User B. The Identity Map MUST be scoped to the lifetime of a single request or transaction.

#### Mistake 2: Forgetting to remove deleted items from insert/update sets
```typescript
// WRONG: Adding to delete without cleaning up insert set
registerRemoved(item: T) {
  this.toDelete.add(item); // If it was just inserted, trying to delete it from DB will crash!
}
```
**Why it fails:** If an object is created and then deleted within the same transaction, you should simply remove it from `toInsert` and never touch the database.

---

### 7. Rules to remember
1. Scope the `UnitOfWork` and `IdentityMap` to a single HTTP request or atomic transaction.
2. An Identity Map ensures that querying the same ID multiple times returns the identical object reference.
3. The Unit of Work aggregates database writes into batch operations at transaction commit time.
4. If an entity is registered as new and subsequently deleted within the same unit, remove it from the insert set without dispatching a delete query.

---

### Think first: Prediction puzzle
What does the code log?

```typescript
const map = new IdentityMap<{ id: string; name: string }>();

const user1 = { id: "u1", name: "Alice" };
map.set(user1);

const user2 = map.get("u1")!;
user2.name = "Bob";

console.log(user1.name);
```

---

**Answer:**
```
Bob
```
**Explanation:** `map.get("u1")` returns the exact memory reference of `user1`. Mutating `user2.name` modifies the same object in heap memory. Therefore, `user1.name` reflects `"Bob"`.

---

### Practice exercises

#### Exercise 1: Implement an Identity Map with eviction
- **Task**: Create an `IdentityMap<T extends Entity>` with an `.evict(id: string)` method that removes an item.
- **Hint 1**: `this.cache.delete(id)`.

#### Exercise 2: Dirty tracking set verification
- **Task**: Implement a `UnitOfWork` method `isDirty(entity: T): boolean` that checks if the entity is in `toUpdate`.
- **Hint 1**: `this.toUpdate.has(entity)`.

#### Exercise 3: Snapshot comparison function
- **Task**: Write a generic function `isChanged<T extends object>(original: T, current: T): boolean` using property comparison.
- **Hint 1**: Check `Object.keys(original)` against `current`.

#### Exercise 4: Atomic commit transaction runner
- **Task**: Wrap `uow.commit()` in a `try/catch` block that invokes `uow.rollback()` if an error occurs.
- **Hint 1**: `try { await uow.commit(); } catch (err) { uow.rollback(); throw err; }`.

---

### Exercise solutions

#### Solution 1: Implement an Identity Map with eviction
```typescript
class EvictingIdentityMap<T extends Entity> {
  private cache = new Map<string, T>();

  get(id: string): T | undefined { return this.cache.get(id); }
  set(entity: T): void { this.cache.set(entity.id, entity); }
  evict(id: string): boolean { return this.cache.delete(id); }
}
```

#### Solution 2: Dirty tracking set verification
```typescript
class TrackedUow<T extends Entity> {
  private dirty = new Set<T>();

  markDirty(entity: T): void { this.dirty.add(entity); }
  isDirty(entity: T): boolean { return this.dirty.has(entity); }
}
```

#### Solution 3: Snapshot comparison function
```typescript
function isChanged<T extends Record<string, any>>(original: T, current: T): boolean {
  for (const key of Object.keys(original)) {
    if (original[key] !== current[key]) return true;
  }
  return false;
}
```

#### Solution 4: Atomic commit transaction runner
```typescript
async function executeTransaction<T extends Entity>(
  uow: UnitOfWork<T>,
  sink: any,
  operations: (u: UnitOfWork<T>) => Promise<void>
): Promise<void> {
  try {
    await operations(uow);
    await uow.commit(sink);
  } catch (error) {
    console.error("Transaction aborted, clearing state:", error);
    throw error;
  }
}
```

---

### Recall
1. What bug does an Identity Map prevent during concurrent reads? The lost update problem caused by modifying two distinct in-memory copies of the same entity.
2. What does a Unit of Work do at commit time? Batches all pending inserts, updates, and deletes into a single atomic persistence operation.
3. Why must Identity Maps not be shared globally across all server requests? It causes memory leaks and cross-request data corruption.

> **If you remember only one thing:**  
> The Identity Map guarantees that an entity exists only once in memory per transaction, while the Unit of Work tracks its modifications for atomic batch commit.

---

# Topic 7: Dynamic Adapter Pattern

### 1. What is it?
The **Adapter Pattern** converts the interface of a class or third-party service into another interface that clients expect. It allows classes with incompatible interfaces to work together by wrapping the adaptee and translating method calls, parameters, and return types.

### 2. Why does it exist?
Third-party libraries (e.g., Stripe, PayPal, SendGrid, AWS SES) have vendor-specific APIs. If your domain code calls `stripe.charges.create()` directly, you cannot swap providers without refactoring your entire codebase:
```typescript
// Anti-pattern: Direct vendor coupling
class CheckoutService {
  async pay(stripe: StripeClient, amount: number) {
    return stripe.charges.create({ amount_in_cents: amount * 100 });
  }
}
```
An Adapter wraps the vendor client in a stable domain interface (`PaymentGateway`), isolating vendor changes to a single translation layer.

### 3. Basic example

```typescript
// 1. Target interface required by your application
interface PaymentProcessor {
  processPayment(userId: string, amountDollars: number): Promise<boolean>;
}

// 2. Adaptee: Legacy or external third-party SDK with different method signature
class ExternalStripeSdk {
  makeCharge(cents: number, customerId: string): { success: boolean; id: string } {
    console.log(`Charged ${cents} cents for customer ${customerId}`);
    return { success: true, id: "ch_999" };
  }
}

// 3. Adapter: Implements the Target interface and delegates to the Adaptee
class StripePaymentAdapter implements PaymentProcessor {
  constructor(private sdk: ExternalStripeSdk) {}

  async processPayment(userId: string, amountDollars: number): Promise<boolean> {
    const cents = Math.round(amountDollars * 100);
    const response = this.sdk.makeCharge(cents, userId);
    return response.success;
  }
}

// Usage in application code
const adapter: PaymentProcessor = new StripePaymentAdapter(new ExternalStripeSdk());
adapter.processPayment("usr_42", 29.99);
```

**Line-by-line explanation:**
- `interface PaymentProcessor`: The unified domain contract (`userId: string, amountDollars: number`).
- `class ExternalStripeSdk`: The third-party API that expects cents and `customerId` in opposite order.
- `class StripePaymentAdapter implements PaymentProcessor`: The adapter that fulfills the domain contract.
- `const cents = Math.round(...)`: Translates dollars to cents before invoking the vendor SDK.
- `return response.success`: Translates the vendor's object response into the domain's expected boolean.

---

### 4. How it works inside TypeScript
1. **Structural Subtyping**: Because `StripePaymentAdapter` has the `processPayment` method, it satisfies `PaymentProcessor` anywhere in the app.
2. **Encapsulation of Vendor Incompatibilities**: Type conversions (e.g., snake_case to camelCase, string timestamps to `Date` objects) happen inside the adapter methods.
3. **Pluggability**: Switching from Stripe to PayPal only requires writing a `PayPalAdapter implements PaymentProcessor`.

---

### 5. More examples

#### Example 1: Adapting callback-based legacy API to Promise-based modern interface
```typescript
interface ModernStorage {
  getItem(key: string): Promise<string | null>;
}

class LegacyCallbackStorage {
  read(k: string, cb: (err: Error | null, val: string | null) => void): void {
    cb(null, "stored_value");
  }
}

class StorageAdapter implements ModernStorage {
  constructor(private legacy: LegacyCallbackStorage) {}

  getItem(key: string): Promise<string | null> {
    return new Promise((resolve, reject) => {
      this.legacy.read(key, (err, val) => {
        if (err) reject(err);
        else resolve(val);
      });
    });
  }
}
```

#### Example 2: Generic data mapper adapter
```typescript
interface DomainUser {
  id: string;
  fullName: string;
  emailAddress: string;
}

interface ExternalUserDto {
  user_id: string;
  first_name: string;
  last_name: string;
  email: string;
}

class UserAdapter {
  static toDomain(dto: ExternalUserDto): DomainUser {
    return {
      id: dto.user_id,
      fullName: `${dto.first_name} ${dto.last_name}`,
      emailAddress: dto.email,
    };
  }
}
```

---

### 6. Common mistakes

#### Mistake 1: Leaking vendor types through the adapter interface
```typescript
// WRONG: Returning vendor types from the domain interface
interface PaymentProcessor {
  charge(amount: number): Stripe.Charge; // Defeats the purpose of the adapter!
}
```
**Why it fails:** If the interface returns `Stripe.Charge`, any code using the adapter is still coupled to Stripe. You cannot write a `PayPalAdapter` because PayPal does not return `Stripe.Charge`.

#### Mistake 2: Putting business domain logic into the adapter
```typescript
// WRONG: Putting order discount calculations inside the payment adapter
async processPayment(userId: string, amount: number) {
  if (amount > 100) amount -= 10; // Business rule belongs in Domain Service, not Adapter!
  return this.sdk.charge(amount);
}
```
**Why it fails:** Adapters should ONLY translate data formats, parameter orders, and calls. Business logic belongs in domain services.

---

### 7. Rules to remember
1. The adapter must implement a pure domain interface that contains zero vendor-specific types.
2. The adaptee (vendor client) should be injected via the constructor.
3. Keep adapters strictly focused on translation: mapping parameter formats, converting callbacks to promises, and mapping return types.
4. Business calculations must remain in domain services, not inside adapters.

---

### Think first: Prediction puzzle
What does the adapter return in this example?

```typescript
interface KVStore {
  get(key: string): string;
}

class NumberStore {
  lookup(k: string): number {
    return 404;
  }
}

class NumberStoreAdapter implements KVStore {
  constructor(private store: NumberStore) {}
  get(key: string): string {
    return String(this.store.lookup(key));
  }
}

const kv: KVStore = new NumberStoreAdapter(new NumberStore());
console.log(typeof kv.get("item"));
```

---

**Answer:**
```
string
```
**Explanation:** The adaptee produces `404` (number), but the adapter transforms it with `String(...)`, satisfying the `KVStore` return type of `string`.

---

### Practice exercises

#### Exercise 1: Temperature Unit Adapter
- **Task**: Create an interface `CelsiusSensor` with `readCelsius(): number`. Adapt a `FahrenheitSensor` (with `readFahrenheit(): number`) using the formula `(f - 32) * 5 / 9`.
- **Hint 1**: Wrap `FahrenheitSensor` inside `FahrenheitAdapter implements CelsiusSensor`.

#### Exercise 2: Date format adapter
- **Task**: Adapt an API returning Unix epoch timestamps (`number`) into a domain interface returning `Date` instances.
- **Hint 1**: `return new Date(timestamp * 1000)`.

#### Exercise 3: Key-value map to array adapter
- **Task**: Adapt an object containing `{ [key: string]: string }` into an iterable list of `{ key: string; value: string }` entries.
- **Hint 1**: Use `Object.entries(dict).map(([key, value]) => ({ key, value }))`.

#### Exercise 4: Async filesystem adapter
- **Task**: Adapt Node's callback-based `fs.readFile` into an interface `FileReader` returning `Promise<string>`.
- **Hint 1**: Wrap the callback in `new Promise((resolve, reject) => ...)`.

---

### Exercise solutions

#### Solution 1: Temperature Unit Adapter
```typescript
interface CelsiusSensor {
  readCelsius(): number;
}

class FahrenheitSensor {
  readFahrenheit(): number {
    return 68; // 68°F = 20°C
  }
}

class FahrenheitAdapter implements CelsiusSensor {
  constructor(private sensor: FahrenheitSensor) {}

  readCelsius(): number {
    const f = this.sensor.readFahrenheit();
    return Math.round(((f - 32) * 5) / 9);
  }
}

const sensor: CelsiusSensor = new FahrenheitAdapter(new FahrenheitSensor());
console.log(sensor.readCelsius()); // 20
```

#### Solution 2: Date format adapter
```typescript
interface TimestampSource {
  getEpoch(): number;
}

interface DateProvider {
  getDate(): Date;
}

class DateAdapter implements DateProvider {
  constructor(private source: TimestampSource) {}

  getDate(): Date {
    return new Date(this.source.getEpoch() * 1000);
  }
}
```

#### Solution 3: Key-value map to array adapter
```typescript
interface EntryListProvider {
  getEntries(): Array<{ key: string; value: string }>;
}

class DictionaryAdapter implements EntryListProvider {
  constructor(private dict: Record<string, string>) {}

  getEntries(): Array<{ key: string; value: string }> {
    return Object.entries(this.dict).map(([key, value]) => ({ key, value }));
  }
}
```

#### Solution 4: Async filesystem adapter
```typescript
interface FileReader {
  readText(path: string): Promise<string>;
}

type LegacyReaderFn = (path: string, cb: (err: Error | null, content: string) => void) => void;

class FileReaderAdapter implements FileReader {
  constructor(private legacyRead: LegacyReaderFn) {}

  readText(path: string): Promise<string> {
    return new Promise((resolve, reject) => {
      this.legacyRead(path, (err, data) => {
        if (err) reject(err);
        else resolve(data);
      });
    });
  }
}
```

---

### Recall
1. What is the core role of an Adapter? To make incompatible interfaces work together by translating method calls, arguments, and return types.
2. Why should domain interfaces never expose vendor-specific types? Because doing so couples the domain to that vendor, preventing easy substitution.
3. Where does business logic belong when using adapters? In domain services, never inside the adapter translation layer.

> **If you remember only one thing:**  
> An Adapter translates an external or incompatible interface into a standardized application interface without changing the underlying code.

---

# Topic 8: Type-Safe Facade Pattern

### 1. What is it?
The **Facade Pattern** provides a simplified, high-level interface to a complex subsystem composed of multiple classes, libraries, or asynchronous workflows.

### 2. Why does it exist?
Enterprise subsystems often consist of multiple cooperating services (e.g., authentication, inventory reservation, payment processing, shipping dispatch, and notification). If client controllers must coordinate all five services manually, code duplication and ordering bugs inevitably arise:
```typescript
// Anti-pattern: Controller coordinating 5 low-level services manually
await auth.verify(token);
await inventory.reserve(item);
await payment.charge(amount);
await shipping.schedule(address);
await notifications.sendEmail(user);
```
A Facade encapsulates this entire workflow behind a single, clean method call: `await orderFacade.placeOrder(command)`.

### 3. Basic example

```typescript
// Subsystem 1: Inventory
class InventoryService {
  checkStock(sku: string): boolean {
    return true;
  }
  reserve(sku: string): void {
    console.log(`Reserved SKU: ${sku}`);
  }
}

// Subsystem 2: Payment
class PaymentGateway {
  charge(cardToken: string, amount: number): boolean {
    console.log(`Charged $${amount}`);
    return true;
  }
}

// Subsystem 3: Notifications
class EmailNotifier {
  sendConfirmation(email: string, message: string): void {
    console.log(`Email to ${email}: ${message}`);
  }
}

// The Facade
interface CheckoutRequest {
  sku: string;
  amount: number;
  cardToken: string;
  email: string;
}

class OrderCheckoutFacade {
  constructor(
    private inventory = new InventoryService(),
    private payment = new PaymentGateway(),
    private notifier = new EmailNotifier()
  ) {}

  public async placeOrder(req: CheckoutRequest): Promise<{ success: boolean; orderId: string }> {
    if (!this.inventory.checkStock(req.sku)) {
      throw new Error(`Item ${req.sku} out of stock`);
    }

    this.inventory.reserve(req.sku);

    const paid = this.payment.charge(req.cardToken, req.amount);
    if (!paid) throw new Error("Payment failed");

    const orderId = `ord_${Date.now()}`;
    this.notifier.sendConfirmation(req.email, `Order ${orderId} confirmed`);

    return { success: true, orderId };
  }
}

// Client usage is clean and concise:
const checkout = new OrderCheckoutFacade();
checkout.placeOrder({
  sku: "ITEM_101",
  amount: 49.99,
  cardToken: "tok_visa",
  email: "customer@example.com",
});
```

**Line-by-line explanation:**
- `class InventoryService`, `PaymentGateway`, `EmailNotifier`: Three distinct subsystems with specialized responsibilities.
- `class OrderCheckoutFacade`: Encapsulates all three subsystems via constructor injection.
- `placeOrder(req)`: Coordinates the multi-step workflow in the correct sequence.
- Client code invokes only `placeOrder`, completely shielded from the internal complexity of the three underlying subsystems.

---

### 4. How it works inside TypeScript
1. **Encapsulated Dependencies**: Subsystems can be injected with default parameters or supplied via dependency injection.
2. **Simplified Parameter Object**: The Facade uses a cohesive Request type (`CheckoutRequest`) instead of sprawling parameter lists.
3. **Information Hiding**: Callers do not need to know the order of operations, caching rules, or fallback mechanisms.

---

### 5. More examples

#### Example 1: Subsystem Facade with unified error handling
```typescript
class CloudStorageFacade {
  constructor(
    private authClient: { getAuthToken(): string },
    private s3Client: { putObject(bucket: string, token: string, data: Buffer): void },
    private cdnClient: { purge(path: string): void }
  ) {}

  uploadFile(bucket: string, path: string, data: Buffer): boolean {
    try {
      const token = this.authClient.getAuthToken();
      this.s3Client.putObject(bucket, token, data);
      this.cdnClient.purge(path);
      return true;
    } catch (err) {
      console.error("Cloud storage upload failed:", err);
      return false;
    }
  }
}
```

#### Example 2: Read Facade aggregating data from multiple services
```typescript
interface DashboardSummary {
  username: string;
  activeOrders: number;
  unreadNotifications: number;
}

class UserDashboardFacade {
  constructor(
    private users: { getProfile(id: string): { name: string } },
    private orders: { getActiveCount(id: string): number },
    private notifications: { getUnreadCount(id: string): number }
  ) {}

  getSummary(userId: string): DashboardSummary {
    return {
      username: this.users.getProfile(userId).name,
      activeOrders: this.orders.getActiveCount(userId),
      unreadNotifications: this.notifications.getUnreadCount(userId),
    };
  }
}
```

---

### 6. Common mistakes

#### Mistake 1: Making the Facade a "God Object" with direct business logic
```typescript
// WRONG: Implementing low-level logic directly in the Facade
class BadOrderFacade {
  placeOrder() {
    // 500 lines of raw SQL, credit card algorithm calculation, and direct socket calls!
  }
}
```
**Why it fails:** A Facade should orchestrate and delegate to underlying subsystems, not implement the underlying work itself.

#### Mistake 2: Preventing access to underlying subsystems when low-level control is needed
```typescript
// GOTCHA: Making subsystems strictly private with no escape hatch when power users need it
```
**Why it fails:** A Facade is intended to provide a convenient default path. If a caller occasionally needs specialized lower-level subsystem control, they should still be able to access the underlying services directly.

---

### 7. Rules to remember
1. A Facade delegates to subsystems; it does not implement business mechanics directly.
2. Accept cohesive request parameter objects (`Command` or `Dto`) rather than long parameter lists.
3. Allow callers to bypass the Facade if they require fine-grained low-level control.
4. Inject subsystems in the constructor to maintain unit testability.

---

### Think first: Prediction puzzle
Does the Facade pattern prevent calling the subsystem classes directly?

```typescript
class SubsystemA {
  opA(): string { return "A"; }
}

class Facade {
  constructor(public a = new SubsystemA()) {}
  run(): string { return this.a.opA(); }
}

const f = new Facade();
const raw = new SubsystemA();
console.log(f.run() === raw.opA());
```

---

**Answer:**
```
true
```
**Explanation:** The Facade pattern simplifies access, but it does NOT forbid or encapsulate the subsystem classes away from the rest of the application. Both `f.run()` and `raw.opA()` produce `"A"`.

---

### Practice exercises

#### Exercise 1: Media Converter Facade
- **Task**: Implement a `VideoConversionFacade` that coordinates `AudioExtractor`, `VideoCompressor`, and `Muxer` to convert a file.
- **Hint 1**: Method `convert(fileName: string, format: string): string`.

#### Exercise 2: User Onboarding Facade
- **Task**: Create an `OnboardingFacade` that creates a database account, provisions a workspace folder, and sends a welcome notification.
- **Hint 1**: Group parameters into `interface OnboardRequest { email: string; name: string }`.

#### Exercise 3: Testable Facade with Mock Subsystems
- **Task**: Write a unit test for `UserDashboardFacade` using mock implementations of the 3 underlying services.
- **Hint 1**: Pass object literals satisfying the subsystem interfaces to `new UserDashboardFacade(...)`.

#### Exercise 4: Facade with rollback compensation
- **Task**: In an `EnrollmentFacade`, if step 2 (`billing.charge()`) fails, call step 1's undo method (`course.unenroll()`).
- **Hint 1**: Use `try / catch` around the billing call.

---

### Exercise solutions

#### Solution 1: Media Converter Facade
```typescript
class AudioExtractor { extract(file: string) { return "audio_track"; } }
class VideoCompressor { compress(file: string) { return "compressed_video"; } }
class Muxer { mux(audio: string, video: string, format: string) { return `output.${format}`; } }

class VideoConversionFacade {
  private audio = new AudioExtractor();
  private video = new VideoCompressor();
  private muxer = new Muxer();

  convert(file: string, format: string): string {
    const a = this.audio.extract(file);
    const v = this.video.compress(file);
    return this.muxer.mux(a, v, format);
  }
}
```

#### Solution 2: User Onboarding Facade
```typescript
interface OnboardRequest {
  email: string;
  name: string;
}

class OnboardingFacade {
  constructor(
    private db: { createUser(email: string, name: string): string },
    private fs: { createWorkspace(userId: string): void },
    private notify: { sendWelcome(email: string): void }
  ) {}

  onboard(req: OnboardRequest): string {
    const userId = this.db.createUser(req.email, req.name);
    this.fs.createWorkspace(userId);
    this.notify.sendWelcome(req.email);
    return userId;
  }
}
```

#### Solution 3: Testable Facade with Mock Subsystems
```typescript
const mockUsers = { getProfile: (id: string) => ({ name: "Test User" }) };
const mockOrders = { getActiveCount: (id: string) => 3 };
const mockNotifications = { getUnreadCount: (id: string) => 0 };

const facade = new UserDashboardFacade(mockUsers, mockOrders, mockNotifications);
const summary = facade.getSummary("usr_1");
console.log(summary.username === "Test User" && summary.activeOrders === 3); // true
```

#### Solution 4: Facade with rollback compensation
```typescript
class EnrollmentFacade {
  constructor(
    private course: { enroll(u: string, c: string): void; unenroll(u: string, c: string): void },
    private billing: { charge(u: string, fee: number): void }
  ) {}

  enrollStudent(user: string, courseId: string, fee: number): boolean {
    this.course.enroll(user, courseId);
    try {
      this.billing.charge(user, fee);
      return true;
    } catch (err) {
      this.course.unenroll(user, courseId);
      return false;
    }
  }
}
```

---

### Recall
1. What problem does the Facade pattern solve? It hides the complexity of multi-step subsystems behind a simplified high-level interface.
2. How does a Facade differ from an Adapter? An Adapter makes two incompatible interfaces match; a Facade creates a brand new simplified interface over a system.
3. Should a Facade prevent clients from calling low-level subsystems directly? No; clients with advanced needs can still use the underlying subsystems directly.

> **If you remember only one thing:**  
> A Facade provides a single, high-level entry point to orchestrate a complex subsystem without hiding or breaking the underlying classes.

---

# Topic 9: Compositional Decorator Pattern (Wrappers vs Subclassing)

### 1. What is it?
The **Compositional Decorator Pattern** dynamically attaches additional responsibilities and behavior to an object at runtime. Instead of using class inheritance (`extends`), the decorator wraps the target object and implements the same interface, delegating calls while adding functionality before or after.

### 2. Why does it exist?
Inheritance is static. If you have a `DataService` and want to add:
1. In-memory caching
2. Execution logging
3. Metrics timing

Using subclassing requires an explosion of classes: `CachedDataService`, `LoggedDataService`, `CachedAndLoggedDataService`, etc. With compositional decorators, you can mix and match behaviors dynamically:
```typescript
const service = new MetricsDecorator(new LoggingDecorator(new CachingDecorator(new BaseDataService())));
```

### 3. Basic example

```typescript
// 1. Component Interface
interface DataService {
  fetchData(id: string): Promise<string>;
}

// 2. Concrete Base Component
class BaseDataService implements DataService {
  async fetchData(id: string): Promise<string> {
    console.log(`[Base] Reading data for ${id} from database`);
    return `payload_${id}`;
  }
}

// 3. Decorator 1: Caching Decorator
class CachingDataServiceDecorator implements DataService {
  private cache = new Map<string, string>();

  constructor(private wrappee: DataService) {}

  async fetchData(id: string): Promise<string> {
    if (this.cache.has(id)) {
      console.log(`[Cache] HIT for ${id}`);
      return this.cache.get(id)!;
    }

    const result = await this.wrappee.fetchData(id);
    this.cache.set(id, result);
    return result;
  }
}

// 4. Decorator 2: Logging Decorator
class LoggingDataServiceDecorator implements DataService {
  constructor(private wrappee: DataService) {}

  async fetchData(id: string): Promise<string> {
    console.log(`[Log] Starting fetchData(${id})`);
    const start = Date.now();
    const result = await this.wrappee.fetchData(id);
    console.log(`[Log] Finished fetchData(${id}) in ${Date.now() - start}ms`);
    return result;
  }
}

// Usage: Stack decorators flexibly!
async function demo() {
  const base = new BaseDataService();
  const cached = new CachingDataServiceDecorator(base);
  const loggedAndCached = new LoggingDataServiceDecorator(cached);

  await loggedAndCached.fetchData("100"); // Executes log -> cache check (miss) -> base
  await loggedAndCached.fetchData("100"); // Executes log -> cache check (hit) -> returns immediately!
}
demo();
```

**Line-by-line explanation:**
- `interface DataService`: The shared contract implemented by both the base service and all decorators.
- `class CachingDataServiceDecorator implements DataService`: Holds `private wrappee: DataService`. Intercepts calls to check the cache before delegating.
- `class LoggingDataServiceDecorator implements DataService`: Intercepts calls to record timings before and after delegating.
- `new LoggingDataServiceDecorator(cached)`: Wraps the decorators like layers of an onion.

---

### 4. How it works inside TypeScript
1. **Interface Transparency**: Because the decorator implements the identical interface `DataService`, any function expecting `DataService` accepts decorated instances transparently.
2. **Transparent Delegation**: Method calls pass down through the wrapper chain until reaching the concrete base component.
3. **Runtime Composition**: Features can be enabled or disabled conditionally at runtime based on environment flags without recompilation.

---

### 5. More examples

#### Example 1: Retry decorator with exponential backoff
```typescript
class RetryDecorator implements DataService {
  constructor(
    private wrappee: DataService,
    private maxRetries: number = 3
  ) {}

  async fetchData(id: string): Promise<string> {
    let attempt = 0;
    while (true) {
      try {
        return await this.wrappee.fetchData(id);
      } catch (err) {
        attempt++;
        if (attempt >= this.maxRetries) throw err;
        await new Promise((res) => setTimeout(res, 50 * Math.pow(2, attempt)));
      }
    }
  }
}
```

#### Example 2: Generic method decorator factory
```typescript
function withTiming<T extends (...args: any[]) => Promise<any>>(fn: T, label: string): T {
  return (async (...args: any[]) => {
    const t0 = performance.now();
    try {
      return await fn(...args);
    } finally {
      console.log(`[Timing] ${label}: ${(performance.now() - t0).toFixed(2)}ms`);
    }
  }) as T;
}
```

---

### 6. Common mistakes

#### Mistake 1: Confusing TypeScript experimental/TC39 decorators with the Compositional Decorator pattern
```typescript
// Gotcha:
@LogMethod // This is a language syntax feature (Class/Method decorator)!
class Service {}

// vs Compositional Decorator Pattern:
const service = new LoggingDecorator(new Service()); // This is an architectural design pattern!
```
**Why it matters:** Language decorators (`@decorator`) modify classes or prototypes during definition. The Design Pattern Decorator is an object wrapper that conforms to an interface at runtime.

#### Mistake 2: Breaking the interface contract
```typescript
// WRONG: Decorator alters return type
class BadDecorator {
  constructor(private wrappee: DataService) {}
  fetchData(id: string): { data: string; cached: boolean } { // Breaks DataService contract!
    return { data: "...", cached: true };
  }
}
```
**Why it fails:** A decorator MUST implement the same interface as the wrappee. If the method signature changes, it is an Adapter, not a Decorator.

---

### 7. Rules to remember
1. Both the base service and the decorator MUST implement the exact same interface.
2. The decorator accepts the interface type in its constructor (`private wrappee: ServiceInterface`).
3. Call order is determined by the nesting order of the constructor calls.
4. If you change method signatures or return types, you are writing an Adapter, not a Decorator.

---

### Think first: Prediction puzzle
In what order are log messages printed when `service.execute()` is called below?

```typescript
interface Action { execute(): void; }

class BaseAction implements Action {
  execute() { console.log("Base"); }
}

class OuterDec implements Action {
  constructor(private inner: Action) {}
  execute() {
    console.log("Outer Before");
    this.inner.execute();
    console.log("Outer After");
  }
}

class InnerDec implements Action {
  constructor(private inner: Action) {}
  execute() {
    console.log("Inner Before");
    this.inner.execute();
    console.log("Inner After");
  }
}

const action = new OuterDec(new InnerDec(new BaseAction()));
action.execute();
```

---

**Answer:**
```
Outer Before
Inner Before
Base
Inner After
Outer After
```
**Execution trace:**
1. `OuterDec` runs `console.log("Outer Before")`.
2. `OuterDec` calls `this.inner.execute()` (`InnerDec`).
3. `InnerDec` runs `console.log("Inner Before")`.
4. `InnerDec` calls `this.inner.execute()` (`BaseAction`).
5. `BaseAction` logs `"Base"`.
6. Control returns to `InnerDec`: logs `"Inner After"`.
7. Control returns to `OuterDec`: logs `"Outer After"`.

---

### Practice exercises

#### Exercise 1: Authorization Decorator
- **Task**: Implement an `AuthDecorator` for an interface `Command { run(): void }` that verifies `this.user.isAdmin` before delegating to `wrappee.run()`.
- **Hint 1**: If `!isAdmin`, throw `new Error("Unauthorized")`.

#### Exercise 2: UpperCase Text Decorator
- **Task**: Create a `TextTransformer` interface with `transform(s: string): string`. Implement `BaseTransformer` and an `UpperCaseDecorator`.
- **Hint 1**: `return this.wrappee.transform(s).toUpperCase()`.

#### Exercise 3: Metrics Counter Decorator
- **Task**: Build an execution counter decorator that increments a public `invocationCount` integer on every method call.
- **Hint 1**: `this.invocationCount++` before calling `this.wrappee.call()`.

#### Exercise 4: Fallback Decorator
- **Task**: Implement a `FallbackDecorator` that wraps a primary service and catches any error, delegating to a backup service.
- **Hint 1**: `try { return await this.primary.run(); } catch { return await this.backup.run(); }`.

---

### Exercise solutions

#### Solution 1: Authorization Decorator
```typescript
interface Command {
  run(): void;
}

class AuthDecorator implements Command {
  constructor(
    private wrappee: Command,
    private user: { isAdmin: boolean }
  ) {}

  run(): void {
    if (!this.user.isAdmin) {
      throw new Error("Unauthorized");
    }
    this.wrappee.run();
  }
}
```

#### Solution 2: UpperCase Text Decorator
```typescript
interface TextTransformer {
  transform(s: string): string;
}

class BaseTransformer implements TextTransformer {
  transform(s: string): string { return s; }
}

class UpperCaseDecorator implements TextTransformer {
  constructor(private wrappee: TextTransformer) {}

  transform(s: string): string {
    return this.wrappee.transform(s).toUpperCase();
  }
}
```

#### Solution 3: Metrics Counter Decorator
```typescript
interface TaskRunner {
  run(): Promise<void>;
}

class MetricsCounterDecorator implements TaskRunner {
  public invocationCount = 0;

  constructor(private wrappee: TaskRunner) {}

  async run(): Promise<void> {
    this.invocationCount++;
    await this.wrappee.run();
  }
}
```

#### Solution 4: Fallback Decorator
```typescript
interface QueryService {
  execute(q: string): Promise<string>;
}

class FallbackDecorator implements QueryService {
  constructor(
    private primary: QueryService,
    private fallback: QueryService
  ) {}

  async execute(q: string): Promise<string> {
    try {
      return await this.primary.execute(q);
    } catch {
      return await this.fallback.execute(q);
    }
  }
}
```

---

### Recall
1. Why does the Compositional Decorator pattern avoid subclass explosion? Because behaviors are composed dynamically by nesting objects rather than declaring a new subclass for every combination.
2. What contract must a Decorator satisfy? It must implement the identical interface as the wrapped object.
3. What is the difference between an Adapter and a Decorator? An Adapter changes an interface; a Decorator preserves the interface and augments behavior.

> **If you remember only one thing:**  
> A Decorator wraps an object while implementing the exact same interface, dynamically enhancing behavior without class inheritance.

---

# Topic 10: Middleware Chain of Responsibility Pattern (Onion Model)

### 1. What is it?
The **Middleware Chain of Responsibility Pattern** passes a request or context through a chain of processing handlers. In the **Onion Model** (popularized by Koa, Express, and Redux), each middleware can execute logic before invoking `await next()`, pass control to the downstream handlers, and then execute cleanup or formatting logic on the way back up.

### 2. Why does it exist?
In web servers, HTTP clients, and command dispatchers, cross-cutting concerns (authentication, rate limiting, error catching, tracing, response compression) need to execute around the core business handler. Hardcoding these concerns into the route handler creates monolithic, untestable code. A middleware pipeline allows handlers to be registered independently and chained sequentially.

### 3. Basic example

```typescript
type NextFn = () => Promise<void>;
type Middleware<TContext> = (context: TContext, next: NextFn) => Promise<void>;

class Pipeline<TContext> {
  private middlewares: Middleware<TContext>[] = [];

  use(middleware: Middleware<TContext>): this {
    this.middlewares.push(middleware);
    return this;
  }

  async execute(context: TContext): Promise<void> {
    let index = -1;

    const dispatch = async (i: number): Promise<void> => {
      if (i <= index) {
        throw new Error("next() called multiple times");
      }
      index = i;

      if (i >= this.middlewares.length) {
        return;
      }

      const fn = this.middlewares[i];
      await fn(context, () => dispatch(i + 1));
    };

    await dispatch(0);
  }
}

// Usage Example
interface RequestContext {
  url: string;
  user?: string;
  statusCode?: number;
}

const pipeline = new Pipeline<RequestContext>();

// Middleware 1: Logger (Around logic)
pipeline.use(async (ctx, next) => {
  console.log(`--> ${ctx.url}`);
  const start = Date.now();
  await next();
  console.log(`<-- ${ctx.url} completed in ${Date.now() - start}ms with status ${ctx.statusCode}`);
});

// Middleware 2: Authenticator
pipeline.use(async (ctx, next) => {
  ctx.user = "auth_user_42";
  await next();
});

// Middleware 3: Route Handler
pipeline.use(async (ctx, next) => {
  ctx.statusCode = 200;
  await next();
});

pipeline.execute({ url: "/api/v1/orders" });
```

**Line-by-line explanation:**
- `type NextFn = () => Promise<void>`: Represents the delegate to the next middleware in line.
- `type Middleware<TContext>`: Receives the shared `context` and `next`.
- `dispatch(i)`: The recursive dispatcher. It advances `i` on each `next()` call.
- `if (i <= index)`: Safety guard preventing double invocation of `next()`.
- `await fn(context, () => dispatch(i + 1))`: Calls the middleware, passing an arrow function that advances the pointer to `i + 1`.

---

### 4. How it works inside TypeScript
1. **Context Typing**: `TContext` is carried throughout the chain, ensuring all middleware inspect and mutate the identical strongly-typed context.
2. **Onion Traversal**: Execution order is inward (before `await next()`) and outward (after `await next()`).
3. **Short-Circuiting**: Any middleware can stop the pipeline simply by returning without calling `await next()` (e.g., if authentication fails).

---

### 5. More examples

#### Example 1: Short-circuiting on validation failure
```typescript
interface ApiContext {
  token?: string;
  status?: number;
  body?: string;
}

const authGuard: Middleware<ApiContext> = async (ctx, next) => {
  if (!ctx.token) {
    ctx.status = 401;
    ctx.body = "Unauthorized: Missing Token";
    return; // Short-circuits: downstream middlewares are NEVER called!
  }
  await next();
};
```

#### Example 2: Global exception-handling middleware
```typescript
const errorHandler: Middleware<ApiContext> = async (ctx, next) => {
  try {
    await next();
  } catch (err: any) {
    ctx.status = 500;
    ctx.body = `Internal Error: ${err.message}`;
  }
};
```

---

### 6. Common mistakes

#### Mistake 1: Calling `next()` multiple times in a single middleware
```typescript
// WRONG: Calling next twice
pipeline.use(async (ctx, next) => {
  await next();
  await next(); // Crash: downstream handlers execute twice, corrupting state!
});
```
**Why it fails:** Calling `next()` multiple times restarts the downstream pipeline branch, leading to duplicated database queries or header write conflicts. Production dispatchers include an index guard to throw an immediate error.

#### Mistake 2: Forgetting to `await next()`
```typescript
// WRONG: Not awaiting next()
pipeline.use(async (ctx, next) => {
  next(); // Fire and forget! Out-of-order execution!
});
```
**Why it fails:** If `next()` is not awaited, the outer middleware finishes immediately before downstream async work completes. Timers and error handlers will fail to capture downstream events.

---

### 7. Rules to remember
1. Always `await next()` to ensure the downstream chain completes before post-processing.
2. Short-circuit the pipeline by returning early without calling `next()`.
3. Include an index check (`if (i <= index) throw ...`) to prevent multiple `next()` calls.
4. Keep the shared context object strongly typed (`Pipeline<TContext>`).

---

### Think first: Prediction puzzle
What is printed to the console?

```typescript
const logs: string[] = [];
const p = new Pipeline<{}>();

p.use(async (ctx, next) => {
  logs.push("A1");
  await next();
  logs.push("A2");
});

p.use(async (ctx, next) => {
  logs.push("B1");
  await next();
  logs.push("B2");
});

await p.execute({});
console.log(logs.join("-"));
```

---

**Answer:**
```
A1-B1-B2-A2
```
**Explanation:** This illustrates the classic Onion Model:
1. First middleware starts: `"A1"`.
2. First middleware calls `await next()`.
3. Second middleware starts: `"B1"`.
4. Second middleware calls `await next()` (reaches end of pipeline).
5. Second middleware resumes: `"B2"`.
6. First middleware resumes: `"A2"`.

---

### Practice exercises

#### Exercise 1: Execution timer middleware
- **Task**: Write a middleware that adds `executionTimeMs` to a context object.
- **Hint 1**: Record `performance.now()` before and after `await next()`.

#### Exercise 2: Authorization gatekeeper
- **Task**: Implement a middleware that checks `ctx.role === "admin"`. If false, set `ctx.allowed = false` and return without calling `next()`.
- **Hint 1**: Do not call `next()` when unauthorized.

#### Exercise 3: Double next invocation assertion
- **Task**: Test the `Pipeline` class to verify that calling `next()` twice throws `"next() called multiple times"`.
- **Hint 1**: Wrap `pipeline.execute(...)` in `expect().rejects.toThrow()`.

#### Exercise 4: Context transformer pipeline
- **Task**: Create a typed pipeline where middleware sequentially appends transformations to an array `ctx.steps: string[]`.
- **Hint 1**: In each middleware, call `ctx.steps.push("step_name")`.

---

### Exercise solutions

#### Solution 1: Execution timer middleware
```typescript
interface TimedContext {
  executionTimeMs?: number;
}

const timerMiddleware: Middleware<TimedContext> = async (ctx, next) => {
  const t0 = performance.now();
  await next();
  ctx.executionTimeMs = performance.now() - t0;
};
```

#### Solution 2: Authorization gatekeeper
```typescript
interface RoleContext {
  role: string;
  allowed?: boolean;
}

const adminGuard: Middleware<RoleContext> = async (ctx, next) => {
  if (ctx.role !== "admin") {
    ctx.allowed = false;
    return;
  }
  ctx.allowed = true;
  await next();
};
```

#### Solution 3: Double next invocation assertion
```typescript
async function testDoubleNext() {
  const p = new Pipeline<{}>();
  p.use(async (ctx, next) => {
    await next();
    await next(); // should throw
  });

  try {
    await p.execute({});
    console.error("Test failed: Should have thrown");
  } catch (err: any) {
    console.log(err.message === "next() called multiple times"); // true
  }
}
testDoubleNext();
```

#### Solution 4: Context transformer pipeline
```typescript
interface StepContext {
  steps: string[];
}

const p = new Pipeline<StepContext>();
p.use(async (ctx, next) => {
  ctx.steps.push("sanitize");
  await next();
});
p.use(async (ctx, next) => {
  ctx.steps.push("validate");
  await next();
});

const ctx: StepContext = { steps: [] };
await p.execute(ctx);
console.log(ctx.steps); // ["sanitize", "validate"]
```

---

### Recall
1. What is the Onion Model of middleware execution? Execution flows inward through handlers before `await next()`, and then flows outward in reverse order after `await next()`.
2. How does a middleware short-circuit the pipeline? By returning early without invoking `await next()`.
3. Why is it essential to guard against multiple `next()` invocations? To avoid re-running downstream side effects and causing race conditions or corrupted responses.

> **If you remember only one thing:**  
> The Onion Model allows middleware to execute logic both before and after downstream handlers by wrapping the flow around `await next()`.

---

# Checkpoint Challenge 2: Structural & Middleware Architecture (Topics 6-10)

### Challenge Specification
Construct an API Request Processor featuring:
1. A **Typed Middleware Pipeline** that calculates execution duration and provides global error recovery.
2. A **Logging Decorator** wrapping an underlying `UserService`.
3. An **Adapter** translating an external legacy authentication response format into a domain user format.

### Solution

```typescript
// 1. Domain Types & Adapter
interface DomainUser {
  id: string;
  username: string;
}

interface LegacyAuthResponse {
  user_identifier: string;
  user_login_name: string;
  is_valid: boolean;
}

class LegacyAuthAdapter {
  static toDomainUser(response: LegacyAuthResponse): DomainUser {
    if (!response.is_valid) {
      throw new Error("Invalid legacy session");
    }
    return {
      id: response.user_identifier,
      username: response.user_login_name,
    };
  }
}

// 2. Service Interface & Compositional Decorator
interface UserService {
  getUser(id: string): Promise<DomainUser>;
}

class BaseUserService implements UserService {
  async getUser(id: string): Promise<DomainUser> {
    // Simulating external retrieval + adapter
    const rawLegacyResponse: LegacyAuthResponse = {
      user_identifier: id,
      user_login_name: `alex_${id}`,
      is_valid: true,
    };
    return LegacyAuthAdapter.toDomainUser(rawLegacyResponse);
  }
}

class LoggingUserServiceDecorator implements UserService {
  constructor(private wrappee: UserService) {}

  async getUser(id: string): Promise<DomainUser> {
    console.log(`[ServiceLog] Fetching user: ${id}`);
    const result = await this.wrappee.getUser(id);
    console.log(`[ServiceLog] Found user: ${result.username}`);
    return result;
  }
}

// 3. Middleware Pipeline (Onion Model)
interface HttpContext {
  userId: string;
  user?: DomainUser;
  durationMs?: number;
  error?: string;
}

type NextFn = () => Promise<void>;
type HttpMiddleware = (ctx: HttpContext, next: NextFn) => Promise<void>;

class HttpPipeline {
  private middlewares: HttpMiddleware[] = [];

  use(m: HttpMiddleware): this {
    this.middlewares.push(m);
    return this;
  }

  async run(ctx: HttpContext): Promise<void> {
    let index = -1;
    const dispatch = async (i: number): Promise<void> => {
      if (i <= index) throw new Error("next() called multiple times");
      index = i;
      if (i >= this.middlewares.length) return;
      await this.middlewares[i](ctx, () => dispatch(i + 1));
    };
    await dispatch(0);
  }
}

// 4. Verification Execution
async function runCheckpoint2() {
  const userService = new LoggingUserServiceDecorator(new BaseUserService());
  const pipeline = new HttpPipeline();

  // Middleware 1: Performance Timer
  pipeline.use(async (ctx, next) => {
    const t0 = performance.now();
    await next();
    ctx.durationMs = performance.now() - t0;
  });

  // Middleware 2: Global Error Guard
  pipeline.use(async (ctx, next) => {
    try {
      await next();
    } catch (err: any) {
      ctx.error = err.message;
    }
  });

  // Middleware 3: Controller Handler
  pipeline.use(async (ctx, next) => {
    ctx.user = await userService.getUser(ctx.userId);
    await next();
  });

  const ctx: HttpContext = { userId: "usr_99" };
  await pipeline.run(ctx);

  console.log("Pipeline completed:", {
    user: ctx.user,
    durationMs: ctx.durationMs !== undefined,
    error: ctx.error,
  });
}
runCheckpoint2();
```


---

# Topic 11: Strictly-Typed Observer Pattern & Type-Safe EventEmitter

### 1. What is it?
The **Observer Pattern** defines a one-to-many subscription model between an emitter (subject) and listeners (observers). In modern TypeScript, a **Strictly-Typed EventEmitter** maps specific event names to their exact payload types via an interface map, ensuring compile-time validation for emitted arguments and handler signatures.

### 2. Why does it exist?
Node.js's standard `EventEmitter` accepts `string` for event names and `...args: any[]` for listener parameters:
```typescript
// Untyped EventEmitter anti-pattern
emitter.on("userCreated", (user) => {
  // 'user' is implicitly 'any'! No type checking, no IDE auto-completion!
  console.log(user.nonExistentField);
});
emitter.emit("userCreated", 12345); // Emits invalid payload with ZERO compiler warning!
```
A Strictly-Typed EventEmitter prevents typos in event names and enforces the exact payload shape expected by listeners.

### 3. Basic example

```typescript
// 1. Define the Event Map interface
interface AppEventMap {
  "user:created": { id: string; email: string };
  "user:deleted": { id: string; reason: string };
  "order:placed": { orderId: string; total: number };
}

type Listener<T> = (payload: T) => void;

// 2. Strongly-typed EventEmitter
class TypedEventEmitter<TEvents extends Record<string, any>> {
  private listeners: {
    [K in keyof TEvents]?: Set<Listener<TEvents[K]>>;
  } = {};

  on<K extends keyof TEvents>(event: K, listener: Listener<TEvents[K]>): () => void {
    if (!this.listeners[event]) {
      this.listeners[event] = new Set();
    }
    this.listeners[event]!.add(listener);

    // Return an unsubscribe function
    return () => {
      this.listeners[event]?.delete(listener);
    };
  }

  emit<K extends keyof TEvents>(event: K, payload: TEvents[K]): void {
    const handlers = this.listeners[event];
    if (handlers) {
      for (const handler of handlers) {
        handler(payload);
      }
    }
  }
}

// 3. Usage
const bus = new TypedEventEmitter<AppEventMap>();

const unsubscribe = bus.on("user:created", (payload) => {
  // payload is automatically inferred as { id: string; email: string }
  console.log(`User created: ${payload.id}, ${payload.email}`);
});

bus.emit("user:created", { id: "u_1", email: "user@example.com" });
// bus.emit("user:created", { id: "u_1" }); // COMPILE ERROR: Property 'email' is missing!
// bus.emit("invalid:event", {}); // COMPILE ERROR: Argument of type '"invalid:event"' is not assignable!

unsubscribe(); // Cleanly removes the listener
```

**Line-by-line explanation:**
- `interface AppEventMap`: Defines the registry of valid events and their required payload shapes.
- `class TypedEventEmitter<TEvents extends Record<string, any>>`: Constrained to an event dictionary type.
- `private listeners: { [K in keyof TEvents]?: Set<Listener<TEvents[K]>> }`: Mapped type storing sets of listeners per event key.
- `on<K extends keyof TEvents>(event: K, listener: Listener<TEvents[K]>)`: Restricts `event` to valid keys of `TEvents` and infers listener argument type `TEvents[K]`.
- `return () => { ... }`: Provides an unsubscribe cleanup callback.
- `emit<K extends keyof TEvents>(event: K, payload: TEvents[K])`: Enforces that the payload matches `TEvents[K]`.

---

### 4. How it works inside TypeScript
1. **Mapped Type Indexing**: `TEvents[K]` looks up the indexed value type associated with key `K`.
2. **Key Constraints**: `<K extends keyof TEvents>` restricts string arguments strictly to declared event names.
3. **Automatic Inference**: The listener parameter `(payload)` has its type inferred immediately from the event name without requiring manual type annotations.

---

### 5. More examples

#### Example 1: One-time listener (`once`)
```typescript
class AdvancedEventEmitter<TEvents extends Record<string, any>> extends TypedEventEmitter<TEvents> {
  once<K extends keyof TEvents>(event: K, listener: Listener<TEvents[K]>): void {
    const unsubscribe = this.on(event, (payload) => {
      unsubscribe();
      listener(payload);
    });
  }
}
```

#### Example 2: Wildcard / Global Event Observer
```typescript
type WildcardListener<TEvents> = <K extends keyof TEvents>(event: K, payload: TEvents[K]) => void;

class WildcardEmitter<TEvents extends Record<string, any>> extends TypedEventEmitter<TEvents> {
  private wildcards = new Set<WildcardListener<TEvents>>();

  onAny(listener: WildcardListener<TEvents>): () => void {
    this.wildcards.add(listener);
    return () => this.wildcards.delete(listener);
  }

  override emit<K extends keyof TEvents>(event: K, payload: TEvents[K]): void {
    super.emit(event, payload);
    for (const wildcard of this.wildcards) {
      wildcard(event, payload);
    }
  }
}
```

---

### 6. Common mistakes

#### Mistake 1: Permitting unconstrained string keys
```typescript
// WRONG: Falling back to string indexing
class LeakyEmitter {
  emit(event: string, data: any) {} // Zero type safety!
}
```
**Why it fails:** If any string is allowed, typos like `"user_created"` instead of `"user:created"` will fail silently at runtime.

#### Mistake 2: Storing listeners in a plain array without deduplication
```typescript
// WRONG: Using arrays causes duplicate execution on duplicate subscriptions
private listeners: Record<string, Function[]> = {};
on(event: string, fn: Function) {
  this.listeners[event].push(fn); // Adding the same function twice executes it twice!
}
```
**Why it fails:** Using `Set<Listener>` guarantees reference identity and prevents duplicate listener registrations and memory leaks.

---

### 7. Rules to remember
1. Always define an `EventMap` interface mapping event names to payload types.
2. Constrain emitter methods with `<K extends keyof TEvents>`.
3. Use `Set<Listener>` to store handlers for $O(1)$ removal and duplicate prevention.
4. Return an unsubscribe function from `.on()` for clean lifecycle management.

---

### Think first: Prediction puzzle
What does the following snippet log?

```typescript
interface Events {
  ping: number;
}

const emitter = new TypedEventEmitter<Events>();
let total = 0;

const unsub = emitter.on("ping", (val) => { total += val; });
emitter.emit("ping", 10);
unsub();
emitter.emit("ping", 20);

console.log(total);
```

---

**Answer:**
```
10
```
**Explanation:** The first `emit("ping", 10)` invokes the handler, adding 10 to `total`. Then `unsub()` removes the listener. The second `emit("ping", 20)` has no listeners registered, so `total` remains `10`.

---

### Practice exercises

#### Exercise 1: Asynchronous Event Emitter
- **Task**: Create an emitter where listeners can be async functions (`(payload: T) => Promise<void>`), and `emitSerial` awaits each listener sequentially.
- **Hint 1**: Type listeners as `(payload: T) => Promise<void> | void`.
- **Hint 2**: Use `for (const h of handlers) await h(payload)`.

#### Exercise 2: Strongly-typed event counting
- **Task**: Add a method `listenerCount<K extends keyof TEvents>(event: K): number` returning how many listeners are subscribed.
- **Hint 1**: Return `this.listeners[event]?.size ?? 0`.

#### Exercise 3: Remove all listeners for an event
- **Task**: Implement `removeAllListeners<K extends keyof TEvents>(event?: K): void` that clears listeners for a specific event or all events if none specified.
- **Hint 1**: If event provided, `delete this.listeners[event]`; else `this.listeners = {}`.

#### Exercise 4: Event forwarding / proxying
- **Task**: Write a function `forwardEvents(source, target, events)` that subscribes to an array of event names on `source` and emits them on `target`.
- **Hint 1**: Iterate over the events array and bind `source.on(ev, data => target.emit(ev, data))`.

---

### Exercise solutions

#### Solution 1: Asynchronous Event Emitter
```typescript
type AsyncListener<T> = (payload: T) => Promise<void> | void;

class AsyncTypedEmitter<TEvents extends Record<string, any>> {
  private listeners: { [K in keyof TEvents]?: Set<AsyncListener<TEvents[K]>> } = {};

  on<K extends keyof TEvents>(event: K, listener: AsyncListener<TEvents[K]>): () => void {
    if (!this.listeners[event]) this.listeners[event] = new Set();
    this.listeners[event]!.add(listener);
    return () => this.listeners[event]?.delete(listener);
  }

  async emitSerial<K extends keyof TEvents>(event: K, payload: TEvents[K]): Promise<void> {
    const handlers = this.listeners[event];
    if (handlers) {
      for (const h of handlers) {
        await h(payload);
      }
    }
  }
}
```

#### Solution 2: Strongly-typed event counting
```typescript
class CountedEmitter<TEvents extends Record<string, any>> extends TypedEventEmitter<TEvents> {
  private counts = new Map<keyof TEvents, number>();

  listenerCount<K extends keyof TEvents>(event: K): number {
    return (this as any).listeners[event]?.size ?? 0;
  }
}
```

#### Solution 3: Remove all listeners for an event
```typescript
class ClearableEmitter<TEvents extends Record<string, any>> {
  private listeners: { [K in keyof TEvents]?: Set<Listener<TEvents[K]>> } = {};

  removeAllListeners<K extends keyof TEvents>(event?: K): void {
    if (event) {
      delete this.listeners[event];
    } else {
      this.listeners = {};
    }
  }
}
```

#### Solution 4: Event forwarding / proxying
```typescript
function forwardEvents<T extends Record<string, any>>(
  source: TypedEventEmitter<T>,
  target: TypedEventEmitter<T>,
  events: Array<keyof T>
): () => void {
  const unsubs = events.map((ev) => source.on(ev, (data) => target.emit(ev, data)));
  return () => unsubs.forEach((unsub) => unsub());
}
```

---

### Recall
1. Why does an `EventMap` interface make event emitters safer? It ties every event name string directly to its required payload type at compile time.
2. What should `.on()` return to simplify cleanup? An unsubscribe callback function.
3. How do you disallow unknown event strings? By constraining the event parameter with `<K extends keyof TEvents>`.

> **If you remember only one thing:**  
> A typed event emitter uses `<K extends keyof TEvents>` to provide full auto-completion and compile-time payload checking for pub/sub architectures.

---

# Topic 12: Strategy Pattern with Generic Handler Registries

### 1. What is it?
The **Strategy Pattern** defines a family of interchangeable algorithms, encapsulates each one inside a separate class or function, and makes them swappable at runtime. In TypeScript, combining the Strategy Pattern with a **Generic Handler Registry** creates a type-safe dispatch mechanism that routes tasks to the appropriate strategy without conditional branching.

### 2. Why does it exist?
Without the Strategy pattern, algorithms are scattered across nested `if` or `switch` statements:
```typescript
// Anti-pattern: Monolithic conditional algorithm
function calculateDiscount(type: string, price: number) {
  if (type === "vip") return price * 0.8;
  if (type === "seasonal") return price * 0.9;
  if (type === "employee") return price * 0.5;
  throw new Error("Unknown discount");
}
```
Every new discount type requires modifying this function, risking regressions. With the Strategy pattern, each algorithm is isolated in its own class, and strategies are registered dynamically.

### 3. Basic example

```typescript
// 1. Strategy Interface
interface DiscountStrategy {
  calculate(price: number): number;
}

// 2. Concrete Strategies
class VipDiscount implements DiscountStrategy {
  calculate(price: number): number {
    return price * 0.8; // 20% off
  }
}

class SeasonalDiscount implements DiscountStrategy {
  calculate(price: number): number {
    return price * 0.9; // 10% off
  }
}

class StandardDiscount implements DiscountStrategy {
  calculate(price: number): number {
    return price; // No discount
  }
}

// 3. Strategy Context with Registry
class DiscountContext {
  private strategies = new Map<string, DiscountStrategy>();

  register(tier: string, strategy: DiscountStrategy): void {
    this.strategies.set(tier, strategy);
  }

  applyDiscount(tier: string, price: number): number {
    const strategy = this.strategies.get(tier) ?? new StandardDiscount();
    return strategy.calculate(price);
  }
}

// Usage
const context = new DiscountContext();
context.register("vip", new VipDiscount());
context.register("seasonal", new SeasonalDiscount());

console.log(context.applyDiscount("vip", 100));      // 80
console.log(context.applyDiscount("unknown", 100));  // 100 (standard fallback)
```

**Line-by-line explanation:**
- `interface DiscountStrategy`: Declares the unified method signature `calculate(price: number): number`.
- `class VipDiscount`, `SeasonalDiscount`, `StandardDiscount`: Independent implementations of the discount algorithm.
- `class DiscountContext`: Holds the strategy map and executes the chosen strategy.
- Adding a new discount tier requires only writing a new class implementing `DiscountStrategy` and registering it.

---

### 4. How it works inside TypeScript
1. **Polymorphic Invocations**: The context interacts with strategies purely through the `DiscountStrategy` interface.
2. **Open/Closed Principle**: New algorithms are introduced by adding new classes without touching the context class.
3. **Pluggable Architecture**: Strategies can be swapped at runtime based on user roles, geographical region, or business hours.

---

### 5. More examples

#### Example 1: Generic Strategy Registry with discriminated payloads
```typescript
interface StrategyPayloadMap {
  credit_card: { cardNumber: string; cvv: string };
  paypal: { email: string };
  crypto: { walletAddress: string };
}

interface PaymentStrategy<T> {
  pay(amount: number, details: T): Promise<boolean>;
}

class PaymentDispatcher {
  private registry = new Map<keyof StrategyPayloadMap, PaymentStrategy<any>>();

  register<K extends keyof StrategyPayloadMap>(key: K, strategy: PaymentStrategy<StrategyPayloadMap[K]>): void {
    this.registry.set(key, strategy);
  }

  async execute<K extends keyof StrategyPayloadMap>(
    key: K,
    amount: number,
    details: StrategyPayloadMap[K]
  ): Promise<boolean> {
    const strategy = this.registry.get(key);
    if (!strategy) throw new Error(`Strategy not registered: ${String(key)}`);
    return strategy.pay(amount, details);
  }
}
```

#### Example 2: Functional Strategy Pattern using first-class functions
```typescript
type SortStrategy<T> = (a: T, b: T) => number;

class Sorter<T> {
  constructor(private strategy: SortStrategy<T>) {}

  setStrategy(strategy: SortStrategy<T>): void {
    this.strategy = strategy;
  }

  sort(items: T[]): T[] {
    return [...items].sort(this.strategy);
  }
}

const byAscending: SortStrategy<number> = (a, b) => a - b;
const byDescending: SortStrategy<number> = (a, b) => b - a;

const sorter = new Sorter(byAscending);
console.log(sorter.sort([3, 1, 4])); // [1, 3, 4]
sorter.setStrategy(byDescending);
console.log(sorter.sort([3, 1, 4])); // [4, 3, 1]
```

---

### 6. Common mistakes

#### Mistake 1: Passing unneeded context state to strategies
```typescript
// WRONG: Exposing entire context object to strategy
interface Strategy {
  execute(context: EntireApplicationGodObject): void; // Leaks unnecessary internals!
}
```
**Why it fails:** Strategies should receive only the specific inputs they need to compute their result (`amount`, `price`, `userRole`). Passing the entire context creates tight coupling.

#### Mistake 2: Missing fallback or validation for unregistered strategies
```typescript
// WRONG: Calling method on potentially undefined strategy
execute(tier: string, price: number) {
  return this.strategies.get(tier).calculate(price); // TypeError if tier not found!
}
```
**Why it fails:** Always provide a sensible fallback strategy or throw a clear descriptive error if the requested strategy key is not registered.

---

### 7. Rules to remember
1. Encapsulate each algorithm inside a class or function implementing a common interface.
2. Strategies should only take the parameters required to execute their specific calculation.
3. Use generic registries (`Map<K, Strategy<T>>`) for type-safe parameter dispatch.
4. Favor lightweight functional strategies (first-class functions) when algorithms have no internal state.

---

### Think first: Prediction puzzle
What does the code log?

```typescript
type Formatter = (text: string) => string;

class TextContext {
  constructor(private strategy: Formatter) {}
  format(str: string) { return this.strategy(str); }
}

const lower: Formatter = (s) => s.toLowerCase();
const ctx = new TextContext(lower);

console.log(ctx.format("HeLLo"));
```

---

**Answer:**
```
hello
```
**Explanation:** The `TextContext` delegates formatting to the `lower` strategy, which transforms `"HeLLo"` to `"hello"`.

---

### Practice exercises

#### Exercise 1: Tax calculation strategy
- **Task**: Implement a `TaxStrategy` interface with `calculateTax(subtotal: number): number`. Create `UsTax` (7%) and `EuVatTax` (20%).
- **Hint 1**: `UsTax` returns `subtotal * 0.07`.

#### Exercise 2: Dynamic compression strategy
- **Task**: Create an interface `CompressionStrategy` with `compress(data: string): string`. Implement `GzipStrategy` (prefix with `"[gzip]"`) and `ZipStrategy` (prefix with `"[zip]"`).
- **Hint 1**: Simple string prefixes for mock compression.

#### Exercise 3: Runtime strategy switcher
- **Task**: Create a `DownloadManager` that switches between `FastDownloadStrategy` and `LowBandwidthDownloadStrategy` based on an input boolean flag.
- **Hint 1**: `setStrategy(flag ? fast : low)`.

#### Exercise 4: Discriminated strategy dispatcher
- **Task**: Implement a notification dispatcher where `"sms"` requires `{ phone: string }` and `"email"` requires `{ emailAddress: string }`.
- **Hint 1**: Use the generic `StrategyPayloadMap` pattern from Example 1.

---

### Exercise solutions

#### Solution 1: Tax calculation strategy
```typescript
interface TaxStrategy {
  calculateTax(subtotal: number): number;
}

class UsTax implements TaxStrategy {
  calculateTax(subtotal: number): number { return subtotal * 0.07; }
}

class EuVatTax implements TaxStrategy {
  calculateTax(subtotal: number): number { return subtotal * 0.20; }
}
```

#### Solution 2: Dynamic compression strategy
```typescript
interface CompressionStrategy {
  compress(data: string): string;
}

class GzipStrategy implements CompressionStrategy {
  compress(data: string): string { return `[gzip]${data}`; }
}

class ZipStrategy implements CompressionStrategy {
  compress(data: string): string { return `[zip]${data}`; }
}
```

#### Solution 3: Runtime strategy switcher
```typescript
interface DownloadStrategy { download(url: string): string; }

class FastDownload implements DownloadStrategy {
  download(url: string) { return `Fast: ${url}`; }
}

class LowBandwidthDownload implements DownloadStrategy {
  download(url: string) { return `LowBandwidth: ${url}`; }
}

class DownloadManager {
  private strategy: DownloadStrategy = new FastDownload();

  setLowBandwidthMode(enabled: boolean): void {
    this.strategy = enabled ? new LowBandwidthDownload() : new FastDownload();
  }

  fetch(url: string): string {
    return this.strategy.download(url);
  }
}
```

#### Solution 4: Discriminated strategy dispatcher
```typescript
interface NotificationMap {
  sms: { phone: string; message: string };
  email: { emailAddress: string; subject: string; body: string };
}

interface NotificationStrategy<T> {
  send(payload: T): Promise<void>;
}

class NotificationCenter {
  private handlers = new Map<keyof NotificationMap, NotificationStrategy<any>>();

  register<K extends keyof NotificationMap>(k: K, h: NotificationStrategy<NotificationMap[K]>): void {
    this.handlers.set(k, h);
  }

  async dispatch<K extends keyof NotificationMap>(k: K, payload: NotificationMap[K]): Promise<void> {
    const h = this.handlers.get(k);
    if (!h) throw new Error("Missing handler");
    await h.send(payload);
  }
}
```

---

### Recall
1. What is the core benefit of the Strategy pattern? It allows algorithms to vary independently from the clients that use them, eliminating conditional branching.
2. How does TypeScript enable type-safe strategy registration? By using generic dictionaries keyed by literal string maps (`StrategyPayloadMap[K]`).
3. When should functional strategies be used instead of class-based strategies? When the algorithm is stateless and requires only a single function signature.

> **If you remember only one thing:**  
> The Strategy pattern replaces messy `switch` statements with modular, interchangeable algorithm objects adhering to a common interface.

---

# Topic 13: Railway-Oriented Programming: The `Result<T, E>` Monad

### 1. What is it?
**Railway-Oriented Programming (ROP)** is a functional error handling pattern that models computations as two parallel tracks: a **Success track** (carrying `T`) and a **Failure track** (carrying `E`). The **`Result<T, E>`** type represents either an `Ok(value: T)` or an `Err(error: E)`.

### 2. Why does it exist?
In standard JavaScript and TypeScript, runtime exceptions thrown via `throw new Error()` are untyped:
```typescript
// Anti-pattern: Untyped throw
async function fetchUser(id: string): Promise<User> {
  if (!id) throw new ValidationError("Missing ID"); // TypeScript return signature says nothing about this error!
  return db.load(id);
}
```
The caller has no idea from the function signature what errors can be thrown, leading to unhandled crashes. With `Result<T, E>`, errors become explicit return values enforced by the compiler.

### 3. Basic example

```typescript
// 1. Result Data Structures
type Result<T, E = Error> = Ok<T, E> | Err<T, E>;

class Ok<T, E> {
  readonly isOk = true;
  readonly isErr = false;
  constructor(readonly value: T) {}

  map<U>(fn: (val: T) => U): Result<U, E> {
    return new Ok<U, E>(fn(this.value));
  }

  flatMap<U>(fn: (val: T) => Result<U, E>): Result<U, E> {
    return fn(this.value);
  }
}

class Err<T, E> {
  readonly isOk = false;
  readonly isErr = true;
  constructor(readonly error: E) {}

  map<U>(_fn: (val: T) => U): Result<U, E> {
    return new Err<U, E>(this.error);
  }

  flatMap<U>(_fn: (val: T) => Result<U, E>): Result<U, E> {
    return new Err<U, E>(this.error);
  }
}

function ok<T, E = Error>(value: T): Result<T, E> {
  return new Ok<T, E>(value);
}

function err<T = never, E = Error>(error: E): Result<T, E> {
  return new Err<T, E>(error);
}

// 2. Chained Pipeline Usage
function parsePositiveNumber(str: string): Result<number, string> {
  const n = Number(str);
  if (isNaN(n)) return err("Not a valid number");
  if (n <= 0) return err("Number must be positive");
  return ok(n);
}

function computeSquareRoot(val: number): Result<number, string> {
  return ok(Math.sqrt(val));
}

// Seamless chaining without try/catch:
const successResult = parsePositiveNumber("16").flatMap(computeSquareRoot);
if (successResult.isOk) {
  console.log(`Square root: ${successResult.value}`); // 4
}

const failedResult = parsePositiveNumber("-5").flatMap(computeSquareRoot);
if (failedResult.isErr) {
  console.log(`Failed: ${failedResult.error}`); // "Number must be positive"
}
```

**Line-by-line explanation:**
- `type Result<T, E> = Ok<T, E> | Err<T, E>`: A discriminated union with discriminator `isOk: true | false`.
- `class Ok`: Implements `map` (transforms the inner value) and `flatMap` (chains another `Result`-returning function).
- `class Err`: Short-circuits both `map` and `flatMap`, propagating the error downstream without invoking the callbacks.
- `flatMap(computeSquareRoot)`: If `parsePositiveNumber` returns an `Err`, `computeSquareRoot` is never called.

---

### 4. How it works inside TypeScript
1. **Discriminated Union Narrowing**: Checking `if (res.isOk)` narrows `res` to `Ok<T, E>`, making `res.value` available. Checking `if (res.isErr)` narrows to `Err<T, E>`, making `res.error` available.
2. **Short-Circuit Semantics**: `Err.flatMap` immediately returns itself, skipping all subsequent computations on the track.
3. **Explicit Type Signatures**: Any function returning `Result<T, E>` forces callers to handle failure cases before accessing the data.

---

### 5. More examples

#### Example 1: Wrapping throwing code with `Result.tryCatch`
```typescript
function tryCatch<T, E = Error>(fn: () => T): Result<T, E> {
  try {
    return ok(fn());
  } catch (caught) {
    return err(caught as E);
  }
}

const jsonResult = tryCatch(() => JSON.parse('{"valid": true}'));
```

#### Example 2: Railway pipeline with multiple stages
```typescript
interface RawOrder {
  id: string;
  total: number;
}

function validateOrder(order: RawOrder): Result<RawOrder, string> {
  if (order.total <= 0) return err("Total must be positive");
  return ok(order);
}

function applyTax(order: RawOrder): Result<RawOrder & { totalWithTax: number }, string> {
  return ok({ ...order, totalWithTax: order.total * 1.1 });
}

const processed = ok<RawOrder, string>({ id: "ord_1", total: 100 })
  .flatMap(validateOrder)
  .flatMap(applyTax);
```

---

### 6. Common mistakes

#### Mistake 1: Accessing `.value` without checking `.isOk`
```typescript
// WRONG: Accessing value directly
const res = parsePositiveNumber("abc");
console.log(res.value); // Compile error: Property 'value' does not exist on type 'Err<number, string>'!
```
**Why it fails:** TypeScript protects you. You must check `if (res.isOk)` first to narrow the union before accessing `res.value`.

#### Mistake 2: Throwing an exception inside a `map` callback
```typescript
// WRONG: Throwing inside map converts clean ROP back into runtime crashes
res.map((val) => {
  if (!val) throw new Error("Empty"); // Defeats ROP!
});
```
**Why it fails:** In Railway-Oriented Programming, functions should return `Result` and chain with `flatMap`, rather than throwing unhandled exceptions.

---

### 7. Rules to remember
1. Use `map` to transform `T` into `U` when the transformation cannot fail.
2. Use `flatMap` (bind) when the transformation itself returns a `Result<U, E>`.
3. Discriminate using `if (res.isOk)` or `if (res.isErr)`.
4. Wrap third-party throwing libraries with a `tryCatch()` utility.

---

### Think first: Prediction puzzle
What does the following chain log?

```typescript
const res = ok(10)
  .map((n) => n * 2)
  .flatMap((n) => err<number, string>("Failed at step 2"))
  .map((n) => n + 100);

if (res.isErr) {
  console.log(res.error);
}
```

---

**Answer:**
```
Failed at step 2
```
**Explanation:**
1. `ok(10).map(n => n * 2)` produces `Ok(20)`.
2. `.flatMap(...)` returns `Err("Failed at step 2")`.
3. The subsequent `.map(n => n + 100)` is short-circuited by `Err` and ignored.
4. The final result is `Err("Failed at step 2")`.

---

### Practice exercises

#### Exercise 1: Safe integer parser
- **Task**: Write `safeParseInt(str: string): Result<number, string>` returning an error if the string is not an integer.
- **Hint 1**: Test `Number.isInteger(Number(str))`.

#### Exercise 2: `unwrapOr` fallback utility
- **Task**: Add an `unwrapOr(fallback: T): T` method to `Result<T, E>` that returns `this.value` if `Ok`, or `fallback` if `Err`.
- **Hint 1**: `Ok` returns `this.value`; `Err` returns `fallback`.

#### Exercise 3: Async Result Promise wrapper (`ResultAsync`)
- **Task**: Write a helper `tryCatchAsync<T>(fn: () => Promise<T>): Promise<Result<T, Error>>`.
- **Hint 1**: `try { return ok(await fn()); } catch (e) { return err(e as Error); }`.

#### Exercise 4: Combining multiple Results (`Result.all`)
- **Task**: Implement `combineResults<T, E>(results: Result<T, E>[]): Result<T[], E>` that fails on the first `Err` or succeeds with an array of all `T`.
- **Hint 1**: Iterate through array; return early on first `.isErr`.

---

### Exercise solutions

#### Solution 1: Safe integer parser
```typescript
function safeParseInt(str: string): Result<number, string> {
  const n = Number(str);
  if (!Number.isInteger(n)) return err(`"${str}" is not an integer`);
  return ok(n);
}
```

#### Solution 2: `unwrapOr` fallback utility
```typescript
function unwrapOr<T, E>(res: Result<T, E>, fallback: T): T {
  return res.isOk ? res.value : fallback;
}

const val = unwrapOr(err("fail"), 42); // 42
```

#### Solution 3: Async Result Promise wrapper (`ResultAsync`)
```typescript
async function tryCatchAsync<T>(fn: () => Promise<T>): Promise<Result<T, Error>> {
  try {
    const val = await fn();
    return ok(val);
  } catch (error) {
    return err(error instanceof Error ? error : new Error(String(error)));
  }
}
```

#### Solution 4: Combining multiple Results (`Result.all`)
```typescript
function combineResults<T, E>(results: Result<T, E>[]): Result<T[], E> {
  const accumulated: T[] = [];
  for (const r of results) {
    if (r.isErr) return err(r.error);
    accumulated.push(r.value);
  }
  return ok(accumulated);
}
```

---

### Recall
1. What are the two tracks in Railway-Oriented Programming? The Success track (`Ok<T>`) and the Failure track (`Err<E>`).
2. What is the difference between `map` and `flatMap`? `map` transforms the inner value with a pure function; `flatMap` chains a function that returns another `Result`.
3. Why is `Result<T, E>` superior to `throw` in domain logic? Errors are explicit in function signatures and verified at compile time.

> **If you remember only one thing:**  
> The `Result<T, E>` monad replaces untyped runtime exceptions with explicit, compiler-checked Success and Failure return types.

---

# Topic 14: Functional Composition: Type-Safe `pipe` and `compose` Utilities

### 1. What is it?
**Functional Composition** combines multiple unary (single-argument) functions into a single pipeline. **`pipe`** executes functions from left-to-right, while **`compose`** executes functions from right-to-left. A strictly-typed implementation uses TypeScript function overloads to ensure that the return type of function $N$ matches the input parameter type of function $N+1$.

### 2. Why does it exist?
Nesting function calls leads to unreadable "pyramid of code" structures:
```typescript
// Anti-pattern: Deep nesting (inside-out reading)
const result = formatOutput(addTax(applyDiscount(sanitizeInput(rawInput))));
```
You must read the code from the inside out to understand the execution order. With `pipe`, execution flows linearly from top to bottom:
```typescript
const result = pipe(rawInput, sanitizeInput, applyDiscount, addTax, formatOutput);
```

### 3. Basic example

```typescript
// Strongly typed pipe implementation using function overloads
function pipe<A>(a: A): A;
function pipe<A, B>(a: A, ab: (a: A) => B): B;
function pipe<A, B, C>(a: A, ab: (a: A) => B, bc: (b: B) => C): C;
function pipe<A, B, C, D>(a: A, ab: (a: A) => B, bc: (b: B) => C, cd: (c: C) => D): D;
function pipe(value: any, ...fns: Function[]): any {
  return fns.reduce((acc, fn) => fn(acc), value);
}

// Pipeline transformation functions
const trim = (s: string): string => s.trim();
const toLength = (s: string): number => s.length;
const isEven = (n: number): boolean => n % 2 === 0;

// Type-safe execution:
const result = pipe(
  "   hello world   ",
  trim,      // string -> string ("hello world")
  toLength,  // string -> number (11)
  isEven     // number -> boolean (false)
);

console.log(result); // false (boolean)
```

**Line-by-line explanation:**
- `function pipe<A, B, C>(a: A, ab: (a: A) => B, bc: (b: B) => C): C`: Declares an overload where the output of `ab` (`B`) is guaranteed to match the input of `bc` (`B`).
- `fns.reduce((acc, fn) => fn(acc), value)`: Executes each function sequentially, passing the previous output as the next input.
- `pipe("   hello world   ", trim, toLength, isEven)`: TypeScript verifies each step and infers the final type as `boolean`.

---

### 4. How it works inside TypeScript
1. **Overload Resolution**: TypeScript checks the number of function arguments passed to `pipe` and picks the overload matching that argument count.
2. **Generic Parameter Propagation**: The compiler infers type `A` from the first argument, checks `(a: A) => B` to infer `B`, checks `(b: B) => C` to infer `C`, and assigns the final return type.
3. **Type Mismatch Diagnostics**: If function 2 returns a `number` but function 3 expects a `string`, TypeScript raises an immediate type error on function 3.

---

### 5. More examples

#### Example 1: Type-safe `compose` (Right-to-Left)
```typescript
function compose<A, B, C>(bc: (b: B) => C, ab: (a: A) => B): (a: A) => C {
  return (a: A) => bc(ab(a));
}

const double = (x: number) => x * 2;
const addOne = (x: number) => x + 1;

// First adds one, then doubles: (5 + 1) * 2 = 12
const calculate = compose(double, addOne);
console.log(calculate(5)); // 12
```

#### Example 2: Async pipeline (`pipeAsync`)
```typescript
async function pipeAsync<A, B, C>(
  initial: A,
  fn1: (a: A) => Promise<B> | B,
  fn2: (b: B) => Promise<C> | C
): Promise<C> {
  const step1 = await fn1(initial);
  return await fn2(step1);
}
```

---

### 6. Common mistakes

#### Mistake 1: Implementing `pipe` with `(...fns: any[]) => any` without overloads
```typescript
// WRONG: Untyped pipe loses all static guarantees
function brokenPipe(value: any, ...fns: ((x: any) => any)[]) {
  return fns.reduce((v, f) => f(v), value);
}
// Any incompatible function passes compilation silently and crashes at runtime!
```
**Why it fails:** TypeScript cannot infer type connections across a rest parameter array `...fns: Function[]`. You MUST use overloaded signatures or tuple generics to link the input/output types.

#### Mistake 2: Mixing unary and binary functions in `pipe`
```typescript
// WRONG: Passing a function that requires 2 arguments into pipe
const multiply = (x: number, y: number) => x * y;
// pipe(5, multiply) // Error: multiply expects 2 arguments!
```
**Why it fails:** Pipeline functions must be unary (accept exactly one argument). Use currying (`(y: number) => (x: number) => x * y`) to adapt multi-argument functions.

---

### 7. Rules to remember
1. `pipe` evaluates from left-to-right (first argument $\to$ last function).
2. `compose` evaluates from right-to-left (standard mathematical $f(g(x))$ order).
3. Every function in a pipeline must be unary (single parameter).
4. Use function overloads up to 8-10 arguments to ensure seamless compile-time type inference.

---

### Think first: Prediction puzzle
What does this pipe expression output?

```typescript
const add5 = (x: number) => x + 5;
const stringify = (x: number) => `value: ${x}`;
const shout = (s: string) => `${s}!`;

const res = pipe(10, add5, stringify, shout);
console.log(res);
```

---

**Answer:**
```
value: 15!
```
**Execution trace:**
1. Initial value: `10`.
2. `add5(10)` $\to$ `15`.
3. `stringify(15)` $\to$ `"value: 15"`.
4. `shout("value: 15")` $\to$ `"value: 15!"`.

---

### Practice exercises

#### Exercise 1: Curried multiplier for `pipe`
- **Task**: Write a curried function `multiplyBy(factor: number): (val: number) => number` and use it inside `pipe`.
- **Hint 1**: Return an arrow function `(val) => val * factor`.

#### Exercise 2: String sanitization pipeline
- **Task**: Use `pipe` to sanitize user input: strip whitespace, convert to lower case, and prefix with `"@"` to create a handle.
- **Hint 1**: Functions: `s => s.trim()`, `s => s.toLowerCase()`, `s => `@${s}``.

#### Exercise 3: Array mapping pipeline stage
- **Task**: Write a generic pipeline step `mapArray<T, U>(fn: (item: T) => U): (arr: T[]) => U[]`.
- **Hint 1**: Return `(arr) => arr.map(fn)`.

#### Exercise 4: Async `pipe` with error handling
- **Task**: Write an async pipe step that wraps an async function with fallback recovery if it rejects.
- **Hint 1**: Wrap in `try/catch` returning a fallback value on error.

---

### Exercise solutions

#### Solution 1: Curried multiplier for `pipe`
```typescript
const multiplyBy = (factor: number) => (val: number) => val * factor;

const calc = pipe(10, multiplyBy(3), add5); // (10 * 3) + 5 = 35
console.log(calc); // 35
```

#### Solution 2: String sanitization pipeline
```typescript
const toHandle = (input: string) =>
  pipe(
    input,
    (s: string) => s.trim(),
    (s: string) => s.toLowerCase(),
    (s: string) => `@${s}`
  );

console.log(toHandle("   AliceCooper   ")); // "@alicecooper"
```

#### Solution 3: Array mapping pipeline stage
```typescript
const mapArray = <T, U>(fn: (item: T) => U) => (arr: T[]): U[] => arr.map(fn);

const numbers = [1, 2, 3];
const doubled = pipe(numbers, mapArray((n: number) => n * 2));
console.log(doubled); // [2, 4, 6]
```

#### Solution 4: Async `pipe` with error handling
```typescript
const withDefault = <T>(fallback: T) => async (promiseFn: () => Promise<T>): Promise<T> => {
  try {
    return await promiseFn();
  } catch {
    return fallback;
  }
};
```

---

### Recall
1. What is the execution order of `pipe` vs `compose`? `pipe` executes left-to-right (top-to-bottom); `compose` executes right-to-left (inside-out).
2. Why must pipeline functions be unary? Because each step receives only the single output produced by the previous step.
3. How does TypeScript ensure type safety between steps? Through overloaded generic signatures linking the return type of step $N$ to the argument of step $N+1$.

> **If you remember only one thing:**  
> `pipe` chains unary functions from left to right, eliminating pyramid nesting while preserving complete static type safety across every step.

---

# Checkpoint Challenge 3: Enterprise Architecture & Pipeline Synthesis (Topics 11-14)

### Challenge Specification
Construct an enterprise Data Ingestion and Event Dispatch Engine that synthesizes:
1. A **Railway-Oriented Result Monad** to validate incoming sensor payloads.
2. A **Type-Safe Event Emitter** to broadcast validated sensor readings.
3. A **Functional Pipeline (`pipe`)** to normalize raw telemetry data.
4. A **Strategy Pattern** to route processed readings to specific archival sinks.

### Solution

```typescript
// 1. Result Data Types
type Result<T, E = string> = { isOk: true; value: T } | { isOk: false; error: E };
const ok = <T>(value: T): Result<T, never> => ({ isOk: true, value });
const err = <E>(error: E): Result<never, E> => ({ isOk: false, error });

// 2. Telemetry Types & Functional Normalization Pipeline
interface RawSensorData {
  device: string;
  rawTemperature: string;
  rawPressure: string;
}

interface NormalizedTelemetry {
  deviceId: string;
  temperatureC: number;
  pressureKPa: number;
}

function normalizeTelemetry(raw: RawSensorData): Result<NormalizedTelemetry, string> {
  const temp = parseFloat(raw.rawTemperature);
  const pressure = parseFloat(raw.rawPressure);

  if (isNaN(temp)) return err("Invalid temperature reading");
  if (isNaN(pressure)) return err("Invalid pressure reading");

  return ok({
    deviceId: raw.device.trim().toUpperCase(),
    temperatureC: Math.round(temp * 10) / 10,
    pressureKPa: Math.round(pressure * 10) / 10,
  });
}

// 3. Strictly-Typed Event Emitter
interface TelemetryEventMap {
  "telemetry:received": NormalizedTelemetry;
  "telemetry:alert": { deviceId: string; reason: string };
}

class TelemetryEventBus {
  private handlers: {
    [K in keyof TelemetryEventMap]?: Set<(data: TelemetryEventMap[K]) => void>;
  } = {};

  on<K extends keyof TelemetryEventMap>(
    event: K,
    listener: (data: TelemetryEventMap[K]) => void
  ): () => void {
    if (!this.handlers[event]) this.handlers[event] = new Set();
    this.handlers[event]!.add(listener);
    return () => this.handlers[event]?.delete(listener);
  }

  emit<K extends keyof TelemetryEventMap>(event: K, data: TelemetryEventMap[K]): void {
    this.handlers[event]?.forEach((h) => h(data));
  }
}

// 4. Strategy Pattern for Storage Sinks
interface IngestionStrategy {
  save(data: NormalizedTelemetry): Promise<void>;
}

class CloudArchiveStrategy implements IngestionStrategy {
  async save(data: NormalizedTelemetry): Promise<void> {
    console.log(`[CloudStorage] Archived device ${data.deviceId}: ${data.temperatureC}°C`);
  }
}

class AlertConsoleStrategy implements IngestionStrategy {
  async save(data: NormalizedTelemetry): Promise<void> {
    if (data.temperatureC > 50) {
      console.warn(`[ALERT] High temperature warning for ${data.deviceId}: ${data.temperatureC}°C`);
    }
  }
}

// 5. Synthesis Ingestion Coordinator
class TelemetryIngestionCoordinator {
  private sinks: IngestionStrategy[] = [];

  constructor(private bus: TelemetryEventBus) {}

  addSink(sink: IngestionStrategy): void {
    this.sinks.push(sink);
  }

  async processRawInput(raw: RawSensorData): Promise<Result<NormalizedTelemetry, string>> {
    const result = normalizeTelemetry(raw);

    if (!result.isOk) {
      return result; // Propagate failure
    }

    const telemetry = result.value;

    // Broadcast on EventBus
    this.bus.emit("telemetry:received", telemetry);
    if (telemetry.temperatureC > 50) {
      this.bus.emit("telemetry:alert", {
        deviceId: telemetry.deviceId,
        reason: `Exceeded threshold: ${telemetry.temperatureC}°C`,
      });
    }

    // Dispatch through strategies
    for (const sink of this.sinks) {
      await sink.save(telemetry);
    }

    return ok(telemetry);
  }
}

// 6. Verification Execution
async function runCheckpoint3() {
  const bus = new TelemetryEventBus();
  const coordinator = new TelemetryIngestionCoordinator(bus);

  coordinator.addSink(new CloudArchiveStrategy());
  coordinator.addSink(new AlertConsoleStrategy());

  bus.on("telemetry:alert", (alert) => {
    console.log(`[EventBus Alert Subscribed] ${alert.deviceId}: ${alert.reason}`);
  });

  console.log("--- Test 1: Valid Normal Ingestion ---");
  const res1 = await coordinator.processRawInput({
    device: "  sensor_alpha  ",
    rawTemperature: "24.56",
    rawPressure: "101.325",
  });
  console.log("Test 1 Result:", res1.isOk ? res1.value : res1.error);

  console.log("\n--- Test 2: Overheat Ingestion Triggering Alert ---");
  const res2 = await coordinator.processRawInput({
    device: "sensor_beta",
    rawTemperature: "58.2",
    rawPressure: "99.1",
  });
  console.log("Test 2 Result:", res2.isOk ? res2.value : res2.error);

  console.log("\n--- Test 3: Malformed Payload Triggering ROP Failure ---");
  const res3 = await coordinator.processRawInput({
    device: "sensor_gamma",
    rawTemperature: "corrupted_nan",
    rawPressure: "100.0",
  });
  console.log("Test 3 Result:", res3.isOk ? res3.value : res3.error);
}
runCheckpoint3();
```
