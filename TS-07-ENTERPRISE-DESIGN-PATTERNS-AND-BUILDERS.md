# Module TS-07: Enterprise Design Patterns, Generic Builders, & Reusable Architecture

> **Track**: TypeScript Production Engineering Masterclass (TS 5.x)  
> **Prerequisites**: [TS-00](file:///C:/Users/ayush/OneDrive/Desktop/js-learning/TS-00-QUEUE-AND-INDEX.md), [TS-01](file:///C:/Users/ayush/OneDrive/Desktop/js-learning/TS-01-TYPE-ARCHITECTURE-AND-STRUCTURAL-SUBTYPING.md), [TS-02](file:///C:/Users/ayush/OneDrive/Desktop/js-learning/TS-02-GENERICS-AND-TYPE-OPERATORS.md), [TS-03](file:///C:/Users/ayush/OneDrive/Desktop/js-learning/TS-03-CONDITIONAL-TYPES-AND-INFERENCE.md), [TS-04](file:///C:/Users/ayush/OneDrive/Desktop/js-learning/TS-04-MAPPED-TYPES-AND-METAPROGRAMMING.md), [TS-05](file:///C:/Users/ayush/OneDrive/Desktop/js-learning/TS-05-TEMPLATE-LITERAL-TYPES-AND-PARSERS.md), [TS-06](file:///C:/Users/ayush/OneDrive/Desktop/js-learning/TS-06-OOP-CLASS-INTERNALS-AND-SOLID.md)  
> **Target Audience**: Principal Architects, Staff Software Engineers, Systems Designers  
> **Universal Specification**: Complete Technical Treatise, 90 Real-World Interview Q&As with Runnable Code, 15 Prediction Puzzles with Step-by-Step Traces, 4 Complete Runnable Production Projects with Test Assertions, 20 DOs & DON'Ts, Real-World Enterprise Case Study, 75 Practice Drills (5 Tiers).

---

# Module TS-07: Enterprise Design Patterns, Generic Builders, & Reusable Architecture

## 1. Architectural Deep-Dive & Specification Foundations

### 1.1 Creational Patterns in Modern TypeScript

Creational design patterns in TypeScript go beyond classical object instantiation. By leveraging generic type parameters, constructor signatures, and mapped types, we can construct factories and builders that enforce compile-time correctness without runtime overhead.

```
+-------------------------------------------------------------------------+
|                  Enterprise Design Pattern Taxonomies in TS             |
+-------------------------------------------------------------------------+
|  [Creational]                                                           |
|    ├── Generic Factory with Auto-Registration Registry                  |
|    ├── Type-State Step-Builder (Phantom Type State Tracking)            |
|    └── Reflection-Proof Thread-Safe Singleton                           |
|  [Structural]                                                           |
|    ├── Generic Repository & Unit of Work (Identity Map)                 |
|    ├── Dynamic Adapter & Type-Safe Facade                               |
|    └── Compositional Decorator with Transparent Delegation              |
|  [Behavioral]                                                           |
|    ├── Middleware Chain of Responsibility (Context Transformation)      |
|    ├── Strictly-Typed Observer & Event Map                              |
|    └── Railway-Oriented Result / Either Error Recovery Monad            |
+-------------------------------------------------------------------------+
```

---

### 1.2 The Type-State Step-Builder Pattern (Phantom Types)

The Step-Builder pattern solves the telescoping constructor anti-pattern while preventing runtime `InvalidStateException` errors by using **phantom types** to model a finite state machine directly within the TypeScript compiler:

```typescript
// State Markers
interface NoUrl {}
interface HasUrl {}

interface NoMethod {}
interface HasMethod {}

// The Builder tracks state via generic phantom type parameters
export class HttpRequestBuilder<TUrl = NoUrl, TMethod = NoMethod> {
  private url?: string;
  private method?: string;
  private headers: Record<string, string> = {};
  private body?: any;

  // Step 1: Set URL transitions TUrl from NoUrl -> HasUrl
  public withUrl(url: string): HttpRequestBuilder<HasUrl, TMethod> {
    const next = new HttpRequestBuilder<HasUrl, TMethod>();
    next.url = url;
    next.method = this.method;
    next.headers = { ...this.headers };
    next.body = this.body;
    return next;
  }

  // Step 2: Set Method transitions TMethod from NoMethod -> HasMethod
  public withMethod(method: "GET" | "POST" | "PUT" | "DELETE"): HttpRequestBuilder<TUrl, HasMethod> {
    const next = new HttpRequestBuilder<TUrl, HasMethod>();
    next.url = this.url;
    next.method = method;
    next.headers = { ...this.headers };
    next.body = this.body;
    return next;
  }

  public withHeader(key: string, value: string): this {
    this.headers[key] = value;
    return this;
  }

  public withBody(body: any): this {
    this.body = body;
    return this;
  }

  // Final Step: .build() is ONLY callable when both HasUrl AND HasMethod are satisfied!
  public build(this: HttpRequestBuilder<HasUrl, HasMethod>): {
    url: string;
    method: string;
    headers: Record<string, string>;
    body?: any;
  } {
    return {
      url: this.url!,
      method: this.method!,
      headers: this.headers,
      body: this.body,
    };
  }
}

// Compile-Time Verification:
const partial = new HttpRequestBuilder().withUrl("https://api.internal.com");
// partial.build(); // TS2684: The 'this' context of type 'HttpRequestBuilder<HasUrl, NoMethod>' is not assignable to method's 'this' of type 'HttpRequestBuilder<HasUrl, HasMethod>'.

const ready = partial.withMethod("POST").withBody({ data: 123 });
const req = ready.build(); // Compiles cleanly!
```

---

### 1.3 Type-Safe Dynamic Factory with Self-Registering Constructors

A classical factory requires manual `switch(type)` statements that violate the Open/Closed Principle. A TypeScript Generic Factory binds constructor types dynamically:

```typescript
export type ServiceConstructor<T> = new (...args: any[]) => T;

export class ServiceFactory<TBase> {
  private registry: Map<string, ServiceConstructor<TBase>> = new Map();

  public register<TDerived extends TBase>(
    typeKey: string,
    ctor: ServiceConstructor<TDerived>
  ): void {
    if (this.registry.has(typeKey)) {
      throw new Error(`Service key '${typeKey}' already registered.`);
    }
    this.registry.set(typeKey, ctor);
  }

  public create<TDerived extends TBase = TBase>(
    typeKey: string,
    ...args: any[]
  ): TDerived {
    const Ctor = this.registry.get(typeKey);
    if (!Ctor) {
      throw new Error(`Unregistered service key: '${typeKey}'`);
    }
    return new Ctor(...args) as TDerived;
  }
}
```

---

### 1.4 The Generic Repository Pattern with Specification Querying

Decoupling persistence logic from domain entities using generic specifications:

```typescript
export interface Specification<T> {
  isSatisfiedBy(candidate: T): boolean;
  and(other: Specification<T>): Specification<T>;
  or(other: Specification<T>): Specification<T>;
  not(): Specification<T>;
}

export abstract class CompositeSpecification<T> implements Specification<T> {
  public abstract isSatisfiedBy(candidate: T): boolean;

  public and(other: Specification<T>): Specification<T> {
    return new AndSpecification(this, other);
  }

  public or(other: Specification<T>): Specification<T> {
    return new OrSpecification(this, other);
  }

  public not(): Specification<T> {
    return new NotSpecification(this);
  }
}

class AndSpecification<T> extends CompositeSpecification<T> {
  constructor(private left: Specification<T>, private right: Specification<T>) {
    super();
  }
  public isSatisfiedBy(candidate: T): boolean {
    return this.left.isSatisfiedBy(candidate) && this.right.isSatisfiedBy(candidate);
  }
}

class OrSpecification<T> extends CompositeSpecification<T> {
  constructor(private left: Specification<T>, private right: Specification<T>) {
    super();
  }
  public isSatisfiedBy(candidate: T): boolean {
    return this.left.isSatisfiedBy(candidate) || this.right.isSatisfiedBy(candidate);
  }
}

class NotSpecification<T> extends CompositeSpecification<T> {
  constructor(private spec: Specification<T>) {
    super();
  }
  public isSatisfiedBy(candidate: T): boolean {
    return !this.spec.isSatisfiedBy(candidate);
  }
}

export interface IRepository<T, TId> {
  findById(id: TId): Promise<T | null>;
  find(spec: Specification<T>): Promise<T[]>;
  save(entity: T): Promise<void>;
  delete(id: TId): Promise<void>;
}
```


---

## 2. Reusable Code Architecture, Functional Utilities, & Railway-Oriented Programming

### 2.1 The Railway-Oriented `Result<T, E>` Monad

Throwing raw runtime exceptions (`throw new Error(...)`) breaks referential transparency and forces callers to guess what exceptions might be thrown. The `Result<T, E>` pattern models success and failure as explicit types:

```typescript
export type Result<T, E> = Ok<T, E> | Err<T, E>;

export class Ok<T, E> {
  public readonly isOk: true = true;
  public readonly isErr: false = false;
  public readonly value: T;

  constructor(value: T) {
    this.value = value;
  }

  public map<U>(fn: (val: T) => U): Result<U, E> {
    return new Ok<U, E>(fn(this.value));
  }

  public flatMap<U>(fn: (val: T) => Result<U, E>): Result<U, E> {
    return fn(this.value);
  }

  public match<U>(patterns: { onOk: (v: T) => U; onErr: (e: E) => U }): U {
    return patterns.onOk(this.value);
  }

  public unwrap(): T {
    return this.value;
  }
}

export class Err<T, E> {
  public readonly isOk: false = false;
  public readonly isErr: true = true;
  public readonly error: E;

  constructor(error: E) {
    this.error = error;
  }

  public map<U>(_fn: (val: T) => U): Result<U, E> {
    return new Err<U, E>(this.error);
  }

  public flatMap<U>(_fn: (val: T) => Result<U, E>): Result<U, E> {
    return new Err<U, E>(this.error);
  }

  public match<U>(patterns: { onOk: (v: T) => U; onErr: (e: E) => U }): U {
    return patterns.onErr(this.error);
  }

  public unwrap(): never {
    throw this.error instanceof Error ? this.error : new Error(String(this.error));
  }
}

export function ok<T, E = never>(value: T): Result<T, E> {
  return new Ok<T, E>(value);
}

export function err<E, T = never>(error: E): Result<T, E> {
  return new Err<T, E>(error);
}

// Utility: wrap throwing functions into Result safely
export function tryCatch<T, E = Error>(fn: () => T): Result<T, E> {
  try {
    return ok(fn());
  } catch (caught) {
    return err(caught as E);
  }
}

export async function tryCatchAsync<T, E = Error>(fn: () => Promise<T>): Promise<Result<T, E>> {
  try {
    const res = await fn();
    return ok(res);
  } catch (caught) {
    return err(caught as E);
  }
}
```

---

### 2.2 Functional Utilities: Type-Safe `pipe` and `compose`

Chaining synchronous and asynchronous data transformations with 100% parameter and return type preservation:

```typescript
// Type-Safe Pipe for up to 5 functions:
export function pipe<A>(a: A): A;
export function pipe<A, B>(a: A, fn1: (a: A) => B): B;
export function pipe<A, B, C>(a: A, fn1: (a: A) => B, fn2: (b: B) => C): C;
export function pipe<A, B, C, D>(a: A, fn1: (a: A) => B, fn2: (b: B) => C, fn3: (c: C) => D): D;
export function pipe<A, B, C, D, E>(a: A, fn1: (a: A) => B, fn2: (b: B) => C, fn3: (c: C) => D, fn4: (d: D) => E): E;
export function pipe(initial: any, ...fns: Function[]): any {
  return fns.reduce((acc, fn) => fn(acc), initial);
}

const double = (n: number) => n * 2;
const addFive = (n: number) => n + 5;
const toCurrencyString = (n: number) => `$${n.toFixed(2)}`;

const formattedPrice = pipe(10, double, addFive, toCurrencyString);
// Type: string ("$25.00")
```

---

### 2.3 Type-Safe Middleware Chain of Responsibility

Modeling Express/Koa/Hono-style asynchronous pipelines where context is passed and augmented down the chain:

```typescript
export type MiddlewareNext = () => Promise<void>;
export type MiddlewareFn<TContext> = (ctx: TContext, next: MiddlewareNext) => Promise<void>;

export class MiddlewarePipeline<TContext> {
  private middlewares: MiddlewareFn<TContext>[] = [];

  public use(fn: MiddlewareFn<TContext>): this {
    this.middlewares.push(fn);
    return this;
  }

  public async execute(context: TContext): Promise<void> {
    let index = -1;

    const dispatch = async (i: number): Promise<void> => {
      if (i <= index) {
        throw new Error("next() called multiple times in single middleware");
      }
      index = i;

      const fn = this.middlewares[i];
      if (!fn) return;

      await fn(context, () => dispatch(i + 1));
    };

    await dispatch(0);
  }
}
```

---

### 2.4 Generic LRU Cache with TTL Eviction

A production-grade, generic Least-Recently-Used (LRU) cache with time-to-live expiration:

```typescript
interface CacheEntry<V> {
  value: V;
  expiresAt: number;
}

export class LRUCache<K extends string | number, V> {
  private capacity: number;
  private defaultTtlMs: number;
  private cache: Map<K, CacheEntry<V>>;

  constructor(capacity: number, defaultTtlMs: number = 60000) {
    this.capacity = capacity;
    this.defaultTtlMs = defaultTtlMs;
    this.cache = new Map();
  }

  public get(key: K): V | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return null;
    }

    // Refresh LRU ordering: delete and re-insert
    this.cache.delete(key);
    this.cache.set(key, entry);
    return entry.value;
  }

  public set(key: K, value: V, ttlMs?: number): void {
    if (this.cache.has(key)) {
      this.cache.delete(key);
    } else if (this.cache.size >= this.capacity) {
      // Evict oldest item (first item in Map iteration)
      const oldestKey = this.cache.keys().next().value;
      if (oldestKey !== undefined) {
        this.cache.delete(oldestKey);
      }
    }

    this.cache.set(key, {
      value,
      expiresAt: Date.now() + (ttlMs ?? this.defaultTtlMs),
    });
  }

  public size(): number {
    return this.cache.size;
  }
}
```


---

## 3. 90 Real-World Technical Interview Q&As (Part 1: Q1–Q45)

---

#### Q1: What are Phantom Types and how do they enable the Type-State Pattern?
**Answer:**
A Phantom Type is a generic type parameter that appears only in the type definition but is never used as the type of an actual runtime property. In the Type-State pattern, phantom types represent the compile-time state of an object, preventing invalid operations (e.g. calling `.build()` before setting mandatory fields).

```typescript
interface Unconfigured {}
interface Configured {}

class Pipeline<TState = Unconfigured> {
  public configure(): Pipeline<Configured> {
    return new Pipeline<Configured>();
  }

  // Only callable when TState is Configured:
  public execute(this: Pipeline<Configured>): void {
    console.log("Pipeline executed successfully");
  }
}

const p = new Pipeline();
// p.execute(); // TS2684 Error! Cannot execute unconfigured pipeline!
p.configure().execute(); // OK
```

---

#### Q2: How does the Step-Builder pattern solve the "telescoping constructor" anti-pattern?
**Answer:**
Instead of passing 8 constructor parameters where several are optional or boolean flags (e.g. `new Server(8080, "0.0.0.0", true, false, 5000, ...)`), the Step-Builder provides fluent, readable configuration methods where the compiler enforces the exact sequence of mandatory steps before allowing `.build()`.

---

#### Q3: How do you implement a Type-Safe Generic Factory that avoids `switch` statements?
**Answer:**
Bind constructor signatures to a dynamic registry map where subclasses register themselves:

```typescript
type Constructor<T> = new (...args: any[]) => T;

class GenericFactory<TBase> {
  private registry = new Map<string, Constructor<TBase>>();

  register(key: string, ctor: Constructor<TBase>): void {
    this.registry.set(key, ctor);
  }

  create(key: string, ...args: any[]): TBase {
    const Ctor = this.registry.get(key);
    if (!Ctor) throw new Error(`Unknown key: ${key}`);
    return new Ctor(...args);
  }
}
```

---

#### Q4: What is the Abstract Factory Pattern in TypeScript?
**Answer:**
An interface that provides an abstract contract for creating families of related or dependent objects without specifying their concrete classes:

```typescript
interface Button { render(): string; }
interface Checkbox { check(): void; }

interface GUIFactory {
  createButton(): Button;
  createCheckbox(): Checkbox;
}

class WindowsFactory implements GUIFactory {
  createButton(): Button { return { render: () => "[WinButton]" }; }
  createCheckbox(): Checkbox { return { check: () => {} }; }
}
```

---

#### Q5: How do you harden a Singleton class against reflection bypass and cloning in TypeScript?
**Answer:**
1. Make the constructor `private`.
2. Throw an exception if an instance already exists.
3. Freeze the instance with `Object.freeze()`.
4. Hide the instance reference behind a Symbol.

```typescript
const SINGLETON_INSTANCE = Symbol("SINGLETON");

class HardenedSingleton {
  private static [SINGLETON_INSTANCE]: HardenedSingleton | null = null;

  private constructor() {
    if (HardenedSingleton[SINGLETON_INSTANCE]) {
      throw new Error("Cannot re-instantiate Singleton");
    }
    Object.freeze(this);
  }

  public static getInstance(): HardenedSingleton {
    if (!this[SINGLETON_INSTANCE]) {
      this[SINGLETON_INSTANCE] = new HardenedSingleton();
    }
    return this[SINGLETON_INSTANCE]!;
  }
}
```

---

#### Q6: What is the Generic Repository Pattern?
**Answer:**
It mediates between the domain and data mapping layers, acting like an in-memory domain object collection with standard CRUD operations:

```typescript
interface IRepository<T, TId> {
  getById(id: TId): Promise<T | null>;
  getAll(): Promise<T[]>;
  add(entity: T): Promise<void>;
  remove(id: TId): Promise<void>;
}
```

---

#### Q7: What is the Unit of Work pattern and how does it collaborate with Repositories?
**Answer:**
The Unit of Work maintains a list of database transactions and dirty/modified entities during a business transaction, coordinating the writing out of changes and atomic rollbacks upon failure.

---

#### Q8: What is the Identity Map pattern in enterprise data persistence?
**Answer:**
An in-memory cache that ensures each database record is loaded only once into the application memory per transaction, preventing duplicate instances and stale reference conflicts.

---

#### Q9: How does the Specification Pattern enable composable business rules?
**Answer:**
It encapsulates boolean query criteria into discrete classes with chaining methods (`and`, `or`, `not`), allowing them to be combined dynamically without coupling domain rules to SQL queries.

```typescript
interface Spec<T> {
  isSatisfied(item: T): boolean;
}

class InStockSpec implements Spec<{ inStock: boolean }> {
  isSatisfied(item: { inStock: boolean }) { return item.inStock; }
}
```

---

#### Q10: How do you implement a Type-Safe Decorator / Wrapper without inheritance?
**Answer:**
Implement the same interface as the target and hold a reference to the inner object:

```typescript
interface QueryExecutor {
  query(sql: string): Promise<any[]>;
}

class TimedQueryExecutor implements QueryExecutor {
  constructor(private inner: QueryExecutor) {}

  async query(sql: string): Promise<any[]> {
    const start = performance.now();
    try {
      return await this.inner.query(sql);
    } finally {
      console.log(`Query took ${(performance.now() - start).toFixed(2)}ms`);
    }
  }
}
```

---

#### Q11: What is the Adapter Pattern and how is it used in API migration?
**Answer:**
It translates the interface of an old or third-party service into the target interface your domain expects:

```typescript
interface ModernPaymentGateway {
  charge(amountCents: number, currency: string): Promise<string>;
}

class LegacyPaymentApi {
  processOldPayment(dollars: number): { receiptId: string } {
    return { receiptId: "rec_123" };
  }
}

class PaymentAdapter implements ModernPaymentGateway {
  constructor(private legacy: LegacyPaymentApi) {}

  async charge(amountCents: number, currency: string): Promise<string> {
    const res = this.legacy.processOldPayment(amountCents / 100);
    return res.receiptId;
  }
}
```

---

#### Q12: What is the Facade Pattern and how does it improve system architecture?
**Answer:**
A Facade provides a simplified, unified high-level interface to a complex subsystem (e.g. video encoding, audio mixing, compression), shielding client code from complex low-level API wiring.

---

#### Q13: How do you implement the Composite Pattern in TypeScript?
**Answer:**
Compose objects into tree structures to represent part-whole hierarchies. Both individual leaf nodes and composite branches implement a common interface:

```typescript
interface FileSystemItem {
  getSize(): number;
}

class FileItem implements FileSystemItem {
  constructor(private size: number) {}
  getSize(): number { return this.size; }
}

class DirectoryItem implements FileSystemItem {
  private children: FileSystemItem[] = [];
  add(item: FileSystemItem) { this.children.push(item); }
  getSize(): number {
    return this.children.reduce((total, child) => total + child.getSize(), 0);
  }
}
```

---

#### Q14: How do you implement a Type-Safe Proxy for change tracking?
**Answer:**
Using JavaScript's native `Proxy` with typed handlers:

```typescript
export function createChangeTracker<T extends object>(target: T, onChange: (prop: keyof T) => void): T {
  return new Proxy(target, {
    set(obj, prop, value) {
      Reflect.set(obj, prop, value);
      onChange(prop as keyof T);
      return true;
    }
  });
}
```

---

#### Q15: What is the Strategy Pattern and how does it differ from the State Pattern?
**Answer:**
- **Strategy**: The client typically passes a specific algorithm to a context object to configure how a task is performed. Strategies are usually independent and do not know about each other.
- **State**: The context's internal behavior changes automatically as its internal state changes. State classes frequently transition the context to other concrete states.

---

#### Q16: How do you model a Type-Safe Middleware Chain of Responsibility?
**Answer:**
Pass a typed context and an asynchronous `next()` function down a pipeline of handlers:

```typescript
type Next = () => Promise<void>;
type Middleware<C> = (ctx: C, next: Next) => Promise<void>;

class Pipeline<C> {
  private stack: Middleware<C>[] = [];
  use(fn: Middleware<C>) { this.stack.push(fn); return this; }
}
```

---

#### Q17: How does an in-process Observer Pattern differ from distributed Pub/Sub?
**Answer:**
- **In-Process Observer**: Synchronous or microtask-based notification within the same V8 isolate; zero serialization cost; strong compile-time type checking.
- **Distributed Pub/Sub**: Message brokers (Kafka, RabbitMQ, Redis); involves network boundaries, JSON/Protobuf serialization, and eventual consistency.

---

#### Q18: How do you build a strictly-typed EventEmitter in TypeScript?
**Answer:**
Use mapped types over an event-name-to-payload dictionary:

```typescript
type EventMap = Record<string, any>;

class TypedEventEmitter<Events extends EventMap> {
  private listeners: { [K in keyof Events]?: ((payload: Events[K]) => void)[] } = {};

  on<K extends keyof Events>(event: K, handler: (payload: Events[K]) => void): void {
    if (!this.listeners[event]) this.listeners[event] = [];
    this.listeners[event]!.push(handler);
  }

  emit<K extends keyof Events>(event: K, payload: Events[K]): void {
    this.listeners[event]?.forEach((h) => h(payload));
  }
}
```

---

#### Q19: What is the Command Pattern and how does it support Undo/Redo?
**Answer:**
Encapsulates all information needed to perform an action as an object containing `execute()` and `undo()` methods. A command history stack pushes executed commands for undoing.

---

#### Q20: What is the Memento Pattern and when is it used?
**Answer:**
It captures and externalizes an object's internal state without violating encapsulation, allowing the object to be restored to this state later (snapshots/checkpoints).

---

#### Q21: What is the Visitor Pattern and how do you achieve Double Dispatch in TypeScript?
**Answer:**
It separates algorithms from the object structures on which they operate. The element class accepts a visitor (`element.accept(visitor)`), and calls the visitor's corresponding method (`visitor.visitConcreteElement(this)`).

---

#### Q22: What is the Template Method Pattern?
**Answer:**
An abstract class defines the invariant execution workflow of an algorithm while leaving variant steps to abstract or hook methods implemented by subclasses.

---

#### Q23: What is the Flyweight Pattern?
**Answer:**
Minimizes memory usage by sharing common immutable state (intrinsic state) across multiple objects, while externalizing unique variable state (extrinsic state).

---

#### Q24: Why is Railway-Oriented Programming with `Result<T, E>` preferred over throwing exceptions?
**Answer:**
1. **Explicit Error Contracts**: Callers know exactly what errors can happen from the type signature (`Result<User, UserNotFoundError | DatabaseError>`).
2. **Referential Transparency**: Functions return values instead of jumping out of the call stack.
3. **No Unhandled Crashes**: The compiler forces callers to handle both `Ok` and `Err` branches before accessing `.value`.

---

#### Q25: What is the difference between `Result.map` and `Result.flatMap`?
**Answer:**
- `map(fn)`: Transforms `value` using a function that returns a regular value `U`, automatically wrapping it into `Ok<U, E>`.
- `flatMap(fn)`: Transforms `value` using a function that returns another `Result<U, E>`, preventing nested `Result<Result<U, E>, E>`.

---

#### Q26: How do you wrap throwing legacy functions into `Result` safely?
**Answer:**
Using a `tryCatch` helper:

```typescript
function tryCatch<T>(fn: () => T): Result<T, Error> {
  try {
    return ok(fn());
  } catch (err) {
    return err(err instanceof Error ? err : new Error(String(err)));
  }
}
```

---

#### Q27: What is the `Option<T>` (or `Maybe<T>`) pattern and how does it prevent null pointer errors?
**Answer:**
Represents an optional value as either `Some(value)` or `None`. Forces callers to pattern match or unwrap safely, eliminating defensive `if (x !== null && x !== undefined)` checks.

---

#### Q28: How does `pipe()` function application work in TypeScript?
**Answer:**
Passes a value through a sequence of functions from left to right: `pipe(x, f, g) === g(f(x))`.

---

#### Q29: How does `compose()` differ from `pipe()`?
**Answer:**
`compose()` evaluates functions from **right to left**: `compose(f, g)(x) === f(g(x))`, matching mathematical function composition $(f \circ g)(x)$.

---

#### Q30: What is Function Currying and how is it typed in TypeScript?
**Answer:**
Translating a function that takes multiple arguments `(a, b, c) => d` into a sequence of unary functions `a => b => c => d`.

---

#### Q31: How do you implement a Type-Safe `memoize` function in TypeScript?
**Answer:**
Cache function results indexed by stringified arguments:

```typescript
export function memoize<Args extends any[], Return>(
  fn: (...args: Args) => Return
): (...args: Args) => Return {
  const cache = new Map<string, Return>();
  return (...args: Args): Return => {
    const key = JSON.stringify(args);
    if (cache.has(key)) return cache.get(key)!;
    const res = fn(...args);
    cache.set(key, res);
    return res;
  };
}
```

---

#### Q32: What is the Least-Recently-Used (LRU) cache eviction policy?
**Answer:**
When the cache reaches maximum capacity, the item that has not been accessed for the longest time is evicted first. In JavaScript, `Map` insertion ordering enables fast $O(1)$ LRU tracking.

---

#### Q33: What is the difference between Dependency Injection (DI) and the Service Locator anti-pattern?
**Answer:**
- **Dependency Injection**: Dependencies are pushed explicitly into a class via constructor parameters. The class's contract clearly states what it needs.
- **Service Locator**: The class actively pulls dependencies from a global registry (`Locator.get("Db")`). Dependencies are hidden and cannot be verified at compile time.

---

#### Q34: What is Constructor Injection and why is it preferred over Property Injection?
**Answer:**
Constructor injection passes dependencies at object construction time, guaranteeing that an instance cannot exist in an uninitialized or broken state.

---

#### Q35: What are the three standard service lifetimes in IoC containers?
**Answer:**
1. **Transient**: Created every time requested.
2. **Scoped**: Created once per request/transaction context.
3. **Singleton**: Created once for the entire application lifetime.

---

#### Q36: How do Service Tokens provide type safety in an IoC Container?
**Answer:**
A token pairs a unique runtime `symbol` with a compile-time phantom type `_type?: T`:

```typescript
interface Token<T> {
  symbol: symbol;
  _type?: T;
}

function createToken<T>(name: string): Token<T> {
  return { symbol: Symbol(name) };
}
```

---

#### Q37: How do you detect circular dependencies in an IoC container?
**Answer:**
Maintain a set of "currently resolving" tokens during resolution. If a token being resolved is already in the set, throw `CircularDependencyError`.

---

#### Q38: What are Ports and Adapters in Hexagonal Architecture?
**Answer:**
- **Ports**: Inbound/Outbound interfaces defined by the core domain (e.g. `UserRepository`, `PaymentGateway`).
- **Adapters**: Concrete implementations outside the domain (e.g. `PostgresUserRepository`, `StripePaymentGateway`).

---

#### Q39: What is the Active Record pattern and why is Data Mapper preferred in complex domains?
**Answer:**
- **Active Record**: An entity class contains both data properties and direct database persistence methods (`user.save()`, `User.find()`). Couples domain logic to DB tables.
- **Data Mapper**: Separates the in-memory domain model from the database schema entirely (`userRepo.save(user)`). Keeps domain models pure and testable.

---

#### Q40: What is the Circuit Breaker pattern?
**Answer:**
Wraps remote service calls to prevent cascading failures. It tracks failures; when a threshold is breached, it trips to the "Open" state, rejecting requests immediately without hitting the failing remote service.

---

#### Q41: What are the three states of a Circuit Breaker?
**Answer:**
1. **Closed**: Normal operations; requests pass through.
2. **Open**: Service failing; all requests fail fast immediately.
3. **Half-Open**: Probe requests sent to test if the service has recovered.

---

#### Q42: What is the Retry with Exponential Backoff pattern?
**Answer:**
Retrying failed transient network calls with exponentially increasing delays ($2^n \times \text{base} + \text{jitter}$) to prevent hammering recovering servers.

---

#### Q43: How do you model an Immutable Event-Sourced Entity?
**Answer:**
The entity's state is not mutated directly; instead, state is derived by replaying a sequence of past immutable domain events:

```typescript
type Event = { type: "OrderCreated"; amount: number } | { type: "OrderCancelled" };

function evolve(state: { status: string; amount: number }, event: Event) {
  switch (event.type) {
    case "OrderCreated": return { status: "created", amount: event.amount };
    case "OrderCancelled": return { ...state, status: "cancelled" };
  }
}
```

---

#### Q44: What is the Bulkhead pattern in distributed systems?
**Answer:**
Isolating system resources (thread pools, connection pools, memory) into distinct pools so that the failure of one downstream service does not exhaust resources for the rest of the application.

---

#### Q45: How do you enforce transactional boundaries using the Unit of Work pattern?
**Answer:**
All repository mutation calls register operations in the Unit of Work. Only when `await unitOfWork.commit()` is called are all changes committed in a single atomic database transaction.


---

## 3. 90 Real-World Technical Interview Q&As (Part 2: Q46–Q90)

---

#### Q46: How do you build a type-safe CQRS Command Dispatcher in TypeScript?
**Answer:**
Separate write commands from read queries using dedicated command handlers:

```typescript
interface Command<Type extends string, Payload> {
  type: Type;
  payload: Payload;
}

interface CommandHandler<C extends Command<string, any>, Result = void> {
  handle(command: C): Promise<Result>;
}

class CommandBus {
  private handlers = new Map<string, CommandHandler<any, any>>();

  register<C extends Command<string, any>, R>(type: C["type"], handler: CommandHandler<C, R>) {
    this.handlers.set(type, handler);
  }

  async execute<C extends Command<string, any>, R>(command: C): Promise<R> {
    const handler = this.handlers.get(command.type);
    if (!handler) throw new Error(`No handler for command: ${command.type}`);
    return handler.handle(command);
  }
}
```

---

#### Q47: What is the Outbox Pattern in distributed microservices?
**Answer:**
To guarantee atomic database writes and message publishing, domain events are saved into an "Outbox" table in the same database transaction as the business entity. A separate background worker reads the outbox table and publishes events to the message broker.

---

#### Q48: How do you model a Saga Orchestrator in TypeScript?
**Answer:**
A Saga manages a distributed transaction across multiple services as a sequence of steps. Each step has an action and a compensating transaction (rollback) if subsequent steps fail:

```typescript
interface SagaStep<TContext> {
  execute(ctx: TContext): Promise<void>;
  compensate(ctx: TContext): Promise<void>;
}

class SagaOrchestrator<TContext> {
  private steps: SagaStep<TContext>[] = [];

  addStep(step: SagaStep<TContext>) { this.steps.push(step); return this; }

  async run(ctx: TContext): Promise<void> {
    const executed: SagaStep<TContext>[] = [];
    for (const step of this.steps) {
      try {
        await step.execute(ctx);
        executed.push(step);
      } catch (err) {
        // Rollback executed steps in reverse order
        for (const done of executed.reverse()) {
          await done.compensate(ctx);
        }
        throw err;
      }
    }
  }
}
```

---

#### Q49: How do you implement the Null Object Pattern to eliminate `undefined` checks?
**Answer:**
Provide a concrete class implementing an interface that performs neutral / no-op behavior instead of passing `null`:

```typescript
interface Logger { log(msg: string): void; }

class ConsoleLogger implements Logger {
  log(msg: string) { console.log(msg); }
}

class NullLogger implements Logger {
  log(_msg: string): void {} // Silent no-op
}

function initService(logger: Logger = new NullLogger()) {
  logger.log("Service started"); // Never needs 'if (logger)' check!
}
```

---

#### Q50: How do you implement a Token Bucket Rate Limiter in TypeScript?
**Answer:**
Refill tokens at a fixed rate up to a capacity limit. Each incoming request consumes one or more tokens:

```typescript
export class TokenBucketRateLimiter {
  private tokens: number;
  private lastRefill: number;

  constructor(
    private capacity: number,
    private refillRatePerSec: number
  ) {
    this.tokens = capacity;
    this.lastRefill = Date.now();
  }

  public tryConsume(cost: number = 1): boolean {
    this.refill();
    if (this.tokens >= cost) {
      this.tokens -= cost;
      return true;
    }
    return false;
  }

  private refill(): void {
    const now = Date.now();
    const elapsedSec = (now - this.lastRefill) / 1000;
    this.tokens = Math.min(this.capacity, this.tokens + elapsedSec * this.refillRatePerSec);
    this.lastRefill = now;
  }
}
```

---

#### Q51: How do you build a Type-Safe Promise Pool for concurrency throttling?
**Answer:**
Run asynchronous tasks with a maximum concurrency limit:

```typescript
export async function promisePool<T, R>(
  items: T[],
  limit: number,
  worker: (item: T) => Promise<R>
): Promise<R[]> {
  const results: R[] = [];
  const executing: Promise<any>[] = [];

  for (const item of items) {
    const p = Promise.resolve().then(() => worker(item)).then((res) => results.push(res));
    executing.push(p);

    if (executing.length >= limit) {
      await Promise.race(executing);
      // Remove completed promises
      for (let i = executing.length - 1; i >= 0; i--) {
        // Simple race filter
      }
    }
  }

  await Promise.all(executing);
  return results;
}
```

---

#### Q52: How do you implement an Exponential Backoff retry utility with jitter?
**Answer:**
```typescript
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  retries: number = 3,
  delayMs: number = 100
): Promise<T> {
  try {
    return await fn();
  } catch (err) {
    if (retries <= 0) throw err;
    const jitter = Math.random() * 50;
    await new Promise((r) => setTimeout(r, delayMs + jitter));
    return retryWithBackoff(fn, retries - 1, delayMs * 2);
  }
}
```

---

#### Q53: What is the Gateway Pattern in enterprise software?
**Answer:**
An object that encapsulates access to an external system, providing a clean domain-oriented interface while handling HTTP headers, serialization, authentication, and error mapping internally.

---

#### Q54: How do you prevent memory leaks in Node.js EventEmitters?
**Answer:**
1. Always remove event listeners when components or subscriptions unmount (`emitter.off()` or returning unsubscribe closures).
2. Avoid registering anonymous inline functions as listeners if you intend to remove them later.
3. Monitor `emitter.listenerCount(event)`.

---

#### Q55: How do you use `WeakRef` and `FinalizationRegistry` to prevent memory leaks in caches?
**Answer:**
Store weak references to cached values so the garbage collector can reclaim them if no other references exist:

```typescript
class WeakValueCache<K, V extends object> {
  private cache = new Map<K, WeakRef<V>>();

  set(key: K, value: V) {
    this.cache.set(key, new WeakRef(value));
  }

  get(key: K): V | null {
    const ref = this.cache.get(key);
    if (!ref) return null;
    const val = ref.deref();
    if (!val) {
      this.cache.delete(key);
      return null;
    }
    return val;
  }
}
```

---

#### Q56: How do you handle Graceful Shutdown (`SIGTERM` / `SIGINT`) in TypeScript Node.js services?
**Answer:**
Intercept process termination signals, stop accepting new connections, wait for active transactions to complete, and close database pools:

```typescript
export class GracefulShutdownManager {
  private cleanupTasks: (() => Promise<void>)[] = [];

  public register(task: () => Promise<void>): void {
    this.cleanupTasks.push(task);
  }

  public listen(): void {
    const handler = async (signal: string) => {
      console.log(`Received ${signal}. Shutting down cleanly...`);
      for (const task of this.cleanupTasks) {
        try { await task(); } catch (e) { console.error(e); }
      }
      process.exit(0);
    };
    process.on("SIGTERM", () => handler("SIGTERM"));
    process.on("SIGINT", () => handler("SIGINT"));
  }
}
```

---

#### Q57: How do you implement the Mediator Pattern in TypeScript?
**Answer:**
An object that encapsulates how a set of components interact, preventing them from referring to each other explicitly and keeping their coupling loose:

```typescript
interface DialogMediator {
  notify(sender: Component, event: string): void;
}

abstract class Component {
  constructor(protected mediator: DialogMediator) {}
}

class Checkbox extends Component {
  check() { this.mediator.notify(this, "check"); }
}

class SubmitButton extends Component {
  enable() { console.log("Button enabled"); }
}
```

---

#### Q58: What is the difference between Cohesion and Coupling in software architecture?
**Answer:**
- **Cohesion**: How closely related and focused the responsibilities of a single module/class are (High cohesion is desirable).
- **Coupling**: How much one module/class depends on the internal details of other modules/classes (Low coupling is desirable).

---

#### Q59: How do you enforce architectural boundaries using TypeScript Project References?
**Answer:**
In a monorepo, define separate `tsconfig.json` files for `domain`, `application`, and `infrastructure` layers, configuring `composite: true` and `references: [...]` to prevent inner layers from referencing outer layers.

---

#### Q60: What is the Data Transfer Object (DTO) pattern?
**Answer:**
An object that carries data between processes or layers (e.g. over HTTP or RPC) without any business logic, ensuring API serialization formats remain decoupled from domain entity models.

---

#### Q61: How do you build an In-Memory Unit of Work with transaction rollback?
**Answer:**
Stage state changes in memory. If any operation fails, discard the staged state without updating the primary storage.

---

#### Q62: What is the difference between Optimistic and Pessimistic Concurrency Control?
**Answer:**
- **Optimistic**: Records include a `version` number. When updating, the write checks `WHERE version = currentVersion`. If modified by another transaction, the update fails.
- **Pessimistic**: Acquires a database lock (`SELECT FOR UPDATE`) on the row, blocking other transactions until the lock is released.

---

#### Q63: How do you write a Type-Safe Dynamic Adapter?
**Answer:**
```typescript
interface SourceData { first_name: string; age_years: number; }
interface TargetData { fullName: string; isAdult: boolean; }

function adaptUser(src: SourceData): TargetData {
  return {
    fullName: src.first_name,
    isAdult: src.age_years >= 18,
  };
}
```

---

#### Q64: What is the Health Check pattern for containerized services?
**Answer:**
Exposing `/health/liveness` (checks if the Node.js process is alive) and `/health/readiness` (checks if database, Redis, and message broker connections are healthy).

---

#### Q65: How do you implement a Type-Safe Feature Flag client?
**Answer:**
```typescript
interface FeatureFlags {
  "new-checkout-flow": boolean;
  "max-upload-size-mb": number;
}

class FeatureFlagService {
  constructor(private flags: FeatureFlags) {}

  isEnabled(flag: keyof FeatureFlags): boolean {
    return Boolean(this.flags[flag]);
  }

  getValue<K extends keyof FeatureFlags>(flag: K): FeatureFlags[K] {
    return this.flags[flag];
  }
}
```

---

#### Q66: What is the difference between Monadic `flatMap` and `Promise.then`?
**Answer:**
`Promise.then` automatically unwraps nested promises (flattening them) whether the return value is a bare value or a promise. Monadic `flatMap` strictly requires a function returning a monad (`Result<U, E>`), while `map` handles bare values.

---

#### Q67: How do you implement the Memento Pattern with deep snapshots?
**Answer:**
```typescript
class EditorState {
  constructor(public text: string) {}
}

class TextEditor {
  private content: string = "";

  public type(words: string) { this.content += words; }
  public saveSnapshot(): EditorState { return new EditorState(this.content); }
  public restore(snapshot: EditorState) { this.content = snapshot.text; }
  public getText() { return this.content; }
}
```

---

#### Q68: How do you implement a Type-Safe Command History stack?
**Answer:**
```typescript
interface Command {
  execute(): void;
  undo(): void;
}

class CommandHistory {
  private history: Command[] = [];

  public pushAndExecute(cmd: Command): void {
    cmd.execute();
    this.history.push(cmd);
  }

  public undo(): void {
    const cmd = this.history.pop();
    if (cmd) cmd.undo();
  }
}
```

---

#### Q69: What is the difference between Synchronous and Asynchronous Middleware?
**Answer:**
Synchronous middleware executes in a single event loop tick. Asynchronous middleware returns a `Promise<void>`, allowing `await next()` to pause execution until downstream asynchronous operations complete.

---

#### Q70: How do you build an In-Memory Event Store?
**Answer:**
```typescript
interface StoredEvent {
  aggregateId: string;
  version: number;
  type: string;
  data: any;
  timestamp: Date;
}

class EventStore {
  private events: StoredEvent[] = [];

  append(streamId: string, expectedVersion: number, newEvents: StoredEvent[]) {
    // Check concurrency
    this.events.push(...newEvents);
  }

  getEvents(streamId: string): StoredEvent[] {
    return this.events.filter((e) => e.aggregateId === streamId);
  }
}
```

---

#### Q71: How do you test a class that depends on `Date.now()` without mocking global clocks?
**Answer:**
Inject an abstract `Clock` interface:

```typescript
interface Clock { now(): number; }
class SystemClock implements Clock { now() { return Date.now(); } }
class FrozenClock implements Clock {
  constructor(private time: number) {}
  now() { return this.time; }
}
```

---

#### Q72: How do you type an immutable Reducer function in TypeScript?
**Answer:**
```typescript
type Reducer<State, Action> = (prevState: State, action: Action) => State;
```

---

#### Q73: What is the difference between Factory Method and Abstract Factory?
**Answer:**
- **Factory Method**: A single method on a class responsible for creating a single product.
- **Abstract Factory**: An object responsible for creating families of multiple related products.

---

#### Q74: How do you write a Type-Safe Curried function?
**Answer:**
```typescript
function curry2<A, B, R>(fn: (a: A, b: B) => R): (a: A) => (b: B) => R {
  return (a: A) => (b: B) => fn(a, b);
}
```

---

#### Q75: How do you implement a Type-Safe Logger Decorator?
**Answer:**
Wrap any service interface with automatic entry/exit logging:

```typescript
function withLogging<T extends Record<string, (...args: any[]) => any>>(service: T): T {
  const handler: ProxyHandler<T> = {
    get(target, prop, receiver) {
      const orig = Reflect.get(target, prop, receiver);
      if (typeof orig === "function") {
        return (...args: any[]) => {
          console.log(`[CALL] ${String(prop)} with`, args);
          return orig.apply(target, args);
        };
      }
      return orig;
    }
  };
  return new Proxy(service, handler);
}
```

---

#### Q76: What is the Idempotency Key pattern in payment APIs?
**Answer:**
A unique client-generated token passed with a write request. If the client retries the request due to network failure, the server detects the idempotency key and returns the cached result without charging the card again.

---

#### Q77: How do you model Idempotency in a Repository?
**Answer:**
Store idempotency keys alongside transactions and check if an operation has already executed before processing.

---

#### Q78: How do you build an In-Memory Mutex / Lock in TypeScript?
**Answer:**
```typescript
class AsyncMutex {
  private queue: Promise<void> = Promise.resolve();

  async acquire(): Promise<() => void> {
    let release: () => void;
    const next = new Promise<void>((r) => { release = r; });
    const current = this.queue;
    this.queue = this.queue.then(() => next);
    await current;
    return release!;
  }
}
```

---

#### Q79: How do you implement the Observer Pattern with Unsubscribe tokens?
**Answer:**
Return an unsubscribe function from the subscription method:

```typescript
type Unsubscribe = () => void;
class EventHub {
  private subs = new Set<(msg: string) => void>();
  subscribe(fn: (msg: string) => void): Unsubscribe {
    this.subs.add(fn);
    return () => this.subs.delete(fn);
  }
}
```

---

#### Q80: How do you implement a Type-Safe Builder with Default Options?
**Answer:**
Merge default options with user-provided options using object spread:

```typescript
interface Options { port: number; host: string; }
const defaultOpts: Options = { port: 8080, host: "0.0.0.0" };
function createServer(opts: Partial<Options> = {}): Options {
  return { ...defaultOpts, ...opts };
}
```

---

#### Q81: What is the Flyweight Factory Pattern?
**Answer:**
A factory that maintains an internal pool of existing flyweight instances, returning an existing object if one with matching intrinsic state already exists.

---

#### Q82: How do you prevent prototype pollution in dynamic object mergers?
**Answer:**
Filter out forbidden prototype keys (`__proto__`, `constructor`, `prototype`):

```typescript
function safeMerge(target: any, source: any): any {
  for (const key of Object.keys(source)) {
    if (key === "__proto__" || key === "constructor" || key === "prototype") continue;
    target[key] = source[key];
  }
  return target;
}
```

---

#### Q83: What is the difference between Lazy and Eager evaluation in design patterns?
**Answer:**
- **Eager**: Computed immediately at program start or object construction.
- **Lazy**: Postponed until the value is actually accessed for the first time, saving CPU/memory if never used.

---

#### Q84: How do you build a Lazy Evaluator in TypeScript?
**Answer:**
```typescript
export class Lazy<T> {
  private instance?: T;
  constructor(private factory: () => T) {}

  public get value(): T {
    if (this.instance === undefined) {
      this.instance = this.factory();
    }
    return this.instance;
  }
}
```

---

#### Q85: What is the Strangler Fig Pattern in legacy migration?
**Answer:**
Incrementally replacing specific functionalities of a legacy monolith with modern microservices until the legacy system has been completely replaced.

---

#### Q86: How do you implement a Type-Safe In-Memory Queue?
**Answer:**
```typescript
class Queue<T> {
  private items: T[] = [];
  enqueue(item: T) { this.items.push(item); }
  dequeue(): T | undefined { return this.items.shift(); }
  peek(): T | undefined { return this.items[0]; }
  isEmpty(): boolean { return this.items.length === 0; }
}
```

---

#### Q87: What is the Composite Specification Pattern?
**Answer:**
Combining multiple specifications using boolean combinators (`and`, `or`, `not`) into an expression tree.

---

#### Q88: How do you design an Extensible Plugin Architecture?
**Answer:**
Define a `Plugin` interface with lifecycle hooks (`initialize(context)`, `destroy()`) and register plugins in an orchestrator.

---

#### Q89: How do you test a Class using Test Doubles (Mocks, Stubs, Spies)?
**Answer:**
- **Stub**: Provides canned responses to calls made during the test.
- **Mock**: Registers expectations of calls and asserts they occurred.
- **Spy**: Wraps real implementation to record invocations.

---

#### Q90: What is the ultimate benefit of Reusable Architecture in TypeScript?
**Answer:**
Codebases scale without exponential complexity. Changes in business rules are localized to single components (SRP), extensions require zero edits to existing classes (OCP), and the compiler catches 100% of contract violations at build time before deployment.


---

## 4. Output Prediction Puzzles (15 Puzzles with Step-by-Step Traces)

Test your mental model of TypeScript's phantom type state builders, railway-oriented monads, middleware execution order, and caching mechanics.

---

### Puzzle 1: Phantom Type State Enforcement in Step-Builder

```typescript
interface StateInitial {}
interface StateWithUrl {}
interface StateReady {}

class ApiBuilder<TState = StateInitial> {
  public setUrl(url: string): ApiBuilder<StateWithUrl> {
    return new ApiBuilder<StateWithUrl>();
  }

  public setToken(token: string): ApiBuilder<StateReady> {
    return new ApiBuilder<StateReady>();
  }

  public fetch(this: ApiBuilder<StateReady>): string {
    return "SUCCESS";
  }
}

const b1 = new ApiBuilder();
const b2 = b1.setUrl("https://api.test");
// Case A: b2.fetch()
// Case B: b2.setToken("tok_123").fetch()
```

**Step-by-Step Evaluation Trace:**
1. `b1` has type `ApiBuilder<StateInitial>`.
2. `b2 = b1.setUrl(...)` transitions type to `ApiBuilder<StateWithUrl>`.
3. In Case A: `.fetch()` declares `this: ApiBuilder<StateReady>`. Because `StateWithUrl` is not assignable to `StateReady`, Case A triggers compile error `TS2684`.
4. In Case B: `.setToken("tok_123")` transitions the builder to `ApiBuilder<StateReady>`. Calling `.fetch()` succeeds, returning `"SUCCESS"`.
5. **Result:** Case A produces compilation error `TS2684`; Case B produces `"SUCCESS"`.

---

### Puzzle 2: Railway Monad `flatMap` Short-Circuiting on Error

```typescript
const result = ok<number, string>(10)
  .map((n) => n * 2)
  .flatMap((n) => err<string, number>("Failed calculation at step 2"))
  .map((n) => n + 5);

const output = result.match({
  onOk: (v) => `OK: ${v}`,
  onErr: (e) => `ERR: ${e}`,
});
// Question: What is the value of 'output'?
```

**Step-by-Step Evaluation Trace:**
1. `ok(10)` creates an `Ok` with value `10`.
2. `.map(n => n * 2)` executes the callback -> `Ok(20)`.
3. `.flatMap(...)` executes the callback, which returns `Err("Failed calculation at step 2")`.
4. Now the pipeline holds an `Err` instance!
5. The subsequent `.map(n => n + 5)` encounters `Err`. In the `Err` class, `.map()` is a no-op that immediately returns `this` without calling the transformer.
6. `.match()` evaluates `onErr` with the error message.
7. **Output Value:** `"ERR: Failed calculation at step 2"`.

---

### Puzzle 3: Onion Model Middleware Execution Order

```typescript
const executionTrail: string[] = [];

const pipeline = new MiddlewarePipeline<{ id: string }>();

pipeline.use(async (ctx, next) => {
  executionTrail.push("M1 Entry");
  await next();
  executionTrail.push("M1 Exit");
});

pipeline.use(async (ctx, next) => {
  executionTrail.push("M2 Entry");
  await next();
  executionTrail.push("M2 Exit");
});

await pipeline.execute({ id: "ctx_1" });
// Question: What is executionTrail?
```

**Step-by-Step Evaluation Trace:**
1. Pipeline begins: enters Middleware 1 -> pushes `"M1 Entry"`.
2. `await next()` invokes Middleware 2.
3. Middleware 2 enters -> pushes `"M2 Entry"`.
4. Middleware 2 calls `await next()`. No more middleware in stack, dispatch resolves immediately.
5. Control returns to Middleware 2 after `next()` -> pushes `"M2 Exit"`.
6. Middleware 2 completes; control unwinds back to Middleware 1 after `next()` -> pushes `"M1 Exit"`.
7. **Output Sequence:**
   ```javascript
   [
     "M1 Entry",
     "M2 Entry",
     "M2 Exit",
     "M1 Exit"
   ]
   ```

---

### Puzzle 4: LRU Cache Access Ordering and Eviction

```typescript
const cache = new LRUCache<string, number>(2); // Capacity = 2

cache.set("A", 1);
cache.set("B", 2);
cache.get("A");   // Read 'A'
cache.set("C", 3); // Insert 'C'

const resA = cache.get("A");
const resB = cache.get("B");
const resC = cache.get("C");
```

**Step-by-Step Evaluation Trace:**
1. Insert `"A"`: Cache = `["A"]`.
2. Insert `"B"`: Cache = `["A", "B"]`.
3. Read `"A"`: Accessing `"A"` refreshes its LRU position, moving it to the back: Cache = `["B", "A"]`. (Now `"B"` is the oldest/least-recently-used item!).
4. Insert `"C"`: Capacity is 2. The oldest item (`"B"`) is evicted! Cache = `["A", "C"]`.
5. `cache.get("A")` -> `1`.
6. `cache.get("B")` -> `null` (evicted!).
7. `cache.get("C")` -> `3`.
8. **Output Values:** `resA = 1`, `resB = null`, `resC = 3`.

---

### Puzzle 5: Double `next()` Invocation Guard

```typescript
const p = new MiddlewarePipeline<any>();

p.use(async (ctx, next) => {
  await next();
  await next(); // Attempt second next() invocation
});

p.use(async (ctx, next) => {});

// Question: What happens when p.execute({}) runs?
```

**Step-by-Step Evaluation Trace:**
1. The first `await next()` dispatches index 1. Inside `dispatch`, `index` becomes 1.
2. The second middleware finishes.
3. The first middleware attempts to call `await next()` again.
4. `dispatch(1)` is invoked again. The guard `if (i <= index)` evaluates: `1 <= 1` is true!
5. It throws `new Error("next() called multiple times in single middleware")`.
6. **Result:** Throws runtime error preventing re-entrant middleware corruption.

---

### Puzzle 6: Functional `pipe` Type Transformation

```typescript
const addSuffix = (s: string) => `${s}_tail`;
const countChars = (s: string) => s.length;
const isEven = (n: number) => n % 2 === 0;

const result = pipe("core", addSuffix, countChars, isEven);
// Question: What is the type and runtime value of 'result'?
```

**Step-by-Step Evaluation Trace:**
1. Input: `"core"` (string).
2. Step 1: `addSuffix("core")` -> `"core_tail"` (string).
3. Step 2: `countChars("core_tail")` -> `9` (number).
4. Step 3: `isEven(9)` -> `false` (boolean).
5. **Output Value:** `false` (type: `boolean`).

---

### Puzzle 7: Lazy Evaluator Construction vs Access

```typescript
let callCount = 0;

const lazyValue = new Lazy(() => {
  callCount++;
  return 42;
});

// Step 1: Check callCount
const countBefore = callCount;

// Step 2: Read lazyValue.value twice
const v1 = lazyValue.value;
const v2 = lazyValue.value;
const countAfter = callCount;
```

**Step-by-Step Evaluation Trace:**
1. Constructing `new Lazy(...)` stores the factory function without executing it. `callCount` remains `0`.
2. First access `lazyValue.value`: checks if instance exists (`undefined`). Executes factory -> `callCount` becomes `1`. Caches `42`. Returns `42`.
3. Second access `lazyValue.value`: instance is already cached (`42`). Does NOT execute factory. Returns `42`.
4. **Output Values:** `countBefore = 0`, `v1 = 42`, `v2 = 42`, `countAfter = 1`.

---

### Puzzle 8: Composite Specification `and` / `or` Precedence

```typescript
class ValueSpec extends CompositeSpecification<number> {
  constructor(private min: number, private max: number) { super(); }
  isSatisfiedBy(n: number) { return n >= this.min && n <= this.max; }
}

const specA = new ValueSpec(1, 10);
const specB = new ValueSpec(20, 30);
const specC = new ValueSpec(5, 25);

// Composite: (A OR B) AND C
const composite = specA.or(specB).and(specC);

const test1 = composite.isSatisfiedBy(7);
const test2 = composite.isSatisfiedBy(22);
const test3 = composite.isSatisfiedBy(28);
```

**Step-by-Step Evaluation Trace:**
1. `composite = (A or B) and C`.
2. For `7`:
   - `specA(7)` is true ($1 \le 7 \le 10$). `(A or B)` is true.
   - `specC(7)` is true ($5 \le 7 \le 25$).
   - `true && true` -> `true`.
3. For `22`:
   - `specB(22)` is true ($20 \le 22 \le 30$). `(A or B)` is true.
   - `specC(22)` is true ($5 \le 22 \le 25$).
   - `true && true` -> `true`.
4. For `28`:
   - `specB(28)` is true. `(A or B)` is true.
   - `specC(28)` is false ($28 > 25$).
   - `true && false` -> `false`.
5. **Output Values:** `test1 = true`, `test2 = true`, `test3 = false`.

---

### Puzzle 9: Saga Orchestrator Compensating Step Ordering

```typescript
const trace: string[] = [];

const saga = new SagaOrchestrator<any>()
  .addStep({
    execute: async () => { trace.push("Exec 1"); },
    compensate: async () => { trace.push("Compensate 1"); },
  })
  .addStep({
    execute: async () => { trace.push("Exec 2"); },
    compensate: async () => { trace.push("Compensate 2"); },
  })
  .addStep({
    execute: async () => { throw new Error("Step 3 failed"); },
    compensate: async () => { trace.push("Compensate 3"); },
  });

try {
  await saga.run({});
} catch (e) {}
```

**Step-by-Step Evaluation Trace:**
1. Step 1 executes successfully -> pushes `"Exec 1"`.
2. Step 2 executes successfully -> pushes `"Exec 2"`.
3. Step 3 throws `"Step 3 failed"`.
4. Orchestrator catches failure and triggers compensation on previously executed steps in **reverse order**:
   - Step 2 is compensated -> pushes `"Compensate 2"`.
   - Step 1 is compensated -> pushes `"Compensate 1"`.
5. Notice that Step 3 is NOT compensated because its execution never succeeded.
6. **Output Trace:**
   ```javascript
   [
     "Exec 1",
     "Exec 2",
     "Compensate 2",
     "Compensate 1"
   ]
   ```

---

### Puzzle 10: Token Bucket Rate Limiter Instant Burst vs Continuous Refill

```typescript
const limiter = new TokenBucketRateLimiter(2, 1); // Capacity: 2 tokens, 1 token/sec

const b1 = limiter.tryConsume(1);
const b2 = limiter.tryConsume(1);
const b3 = limiter.tryConsume(1);
```

**Step-by-Step Evaluation Trace:**
1. Limiter initializes with 2 tokens.
2. `b1`: Consumes 1 token. Remaining tokens: 1. Returns `true`.
3. `b2`: Consumes 1 token. Remaining tokens: 0. Returns `true`.
4. `b3`: Needs 1 token, but 0 available and no time has passed. Returns `false`.
5. **Output Values:** `b1 = true`, `b2 = true`, `b3 = false`.

---

### Puzzle 11: Dynamic Factory Unregistered Key Exception

```typescript
const factory = new ServiceFactory<any>();
factory.register("json", class JsonParser {});

const p1 = factory.create("json");
// What happens if we run: factory.create("xml")?
```

**Step-by-Step Evaluation Trace:**
1. `"json"` is registered in the internal map. `factory.create("json")` instantiates `JsonParser`.
2. `"xml"` is not in the registry map.
3. `factory.create("xml")` checks `if (!Ctor)` and throws:
   `Error: Unregistered service key: 'xml'`.
4. **Result:** Throws runtime error with diagnostic message.

---

### Puzzle 12: `tryCatch` vs Async Promise Rejection

```typescript
function asyncThrower(): Promise<string> {
  return Promise.reject(new Error("Async Error"));
}

const syncResult = tryCatch(() => {
  return asyncThrower();
});
// Question: What is syncResult?
```

**Step-by-Step Evaluation Trace:**
1. `tryCatch` runs synchronously.
2. Calling `asyncThrower()` returns a rejected Promise object without throwing synchronously in the try block!
3. `tryCatch` treats the returned Promise as a successful value!
4. `syncResult` is `Ok(Promise { <rejected> })`!
5. This is the classic asynchronous error swallowing bug. Asynchronous functions must be wrapped with `tryCatchAsync`, NOT synchronous `tryCatch`!

---

### Puzzle 13: Identity Map Instance Equivalence

```typescript
class IdentityMap<TId, TEntity> {
  private entities = new Map<TId, TEntity>();
  get(id: TId): TEntity | undefined { return this.entities.get(id); }
  put(id: TId, entity: TEntity): void { this.entities.set(id, entity); }
}

const map = new IdentityMap<string, { id: string; name: string }>();
const u1 = { id: "1", name: "Alice" };
map.put("1", u1);

const fetched1 = map.get("1");
const fetched2 = map.get("1");
const isIdentical = fetched1 === fetched2;
```

**Step-by-Step Evaluation Trace:**
1. `u1` is stored under key `"1"`.
2. `fetched1` returns the exact object reference `u1`.
3. `fetched2` returns the exact object reference `u1`.
4. Strict reference comparison `fetched1 === fetched2` evaluates to `true`.
5. **Output Value:** `isIdentical = true`.

---

### Puzzle 14: Unit of Work Rollback Leaves Target Clean

```typescript
class MockUnitOfWork {
  private staged = new Map<string, string>();
  private target: Record<string, string> = {};

  stage(k: string, v: string) { this.staged.set(k, v); }
  commit() {
    for (const [k, v] of this.staged) this.target[k] = v;
    this.staged.clear();
  }
  rollback() { this.staged.clear(); }
  getTarget() { return this.target; }
}

const uow = new MockUnitOfWork();
uow.stage("key1", "val1");
uow.rollback();
const keys = Object.keys(uow.getTarget());
```

**Step-by-Step Evaluation Trace:**
1. `uow.stage(...)` records `"key1"` into the private `staged` map.
2. `uow.rollback()` empties `staged`.
3. Nothing was ever written to `this.target`.
4. `Object.keys(uow.getTarget())` is empty.
5. **Output Value:** `keys = []`.

---

### Puzzle 15: Circuit Breaker Half-Open Recovery

```typescript
class SimpleBreaker {
  public state: "CLOSED" | "OPEN" | "HALF_OPEN" = "CLOSED";
  public failureCount: number = 0;

  recordFailure() {
    this.failureCount++;
    if (this.failureCount >= 2) this.state = "OPEN";
  }

  recordSuccess() {
    this.failureCount = 0;
    this.state = "CLOSED";
  }
}

const cb = new SimpleBreaker();
cb.recordFailure();
const s1 = cb.state;
cb.recordFailure();
const s2 = cb.state;
cb.recordSuccess();
const s3 = cb.state;
```

**Step-by-Step Evaluation Trace:**
1. First failure: `failureCount = 1` ($< 2$). `state` remains `"CLOSED"`.
2. Second failure: `failureCount = 2` ($\ge 2$). `state` transitions to `"OPEN"`.
3. Success occurs: resets `failureCount = 0`, `state` transitions back to `"CLOSED"`.
4. **Output Values:** `s1 = "CLOSED"`, `s2 = "OPEN"`, `s3 = "CLOSED"`.


---

## 5. Four Complete Runnable Production Projects with Test Assertions

Every project below is a fully functional, self-contained TypeScript engine demonstrating production enterprise design patterns and reusable architecture. All class properties are explicitly declared for strict Node.js compatibility (`--experimental-strip-types`).

---

### Project 1: Type-State Sequential Pipeline & HTTP Request Step-Builder

#### Architectural Overview
```
+-------------------------------------------------------------------------+
|                  Type-State HTTP Request Step-Builder                   |
+-------------------------------------------------------------------------+
|  [HttpRequestBuilder<TUrl, TMethod>]                                    |
|         │                                                               |
|  State 1: withUrl(url) ──► transitions TUrl to HasUrl                   |
|         │                                                               |
|  State 2: withMethod(method) ──► transitions TMethod to HasMethod       |
|         │                                                               |
|  State 3: execute(): Response ──► ONLY callable on <HasUrl, HasMethod>  |
+-------------------------------------------------------------------------+
```

#### Complete Implementation & Verification Suite
```typescript
import assert from "node:assert";

export interface NoUrl {}
export interface HasUrl {}
export interface NoMethod {}
export interface HasMethod {}

export interface HttpResponse {
  statusCode: number;
  url: string;
  method: string;
  headers: Record<string, string>;
  body?: any;
}

export class HttpRequestStepBuilder<TUrl = NoUrl, TMethod = NoMethod> {
  private url?: string;
  private method?: string;
  private headers: Record<string, string>;
  private body?: any;

  constructor() {
    this.headers = {};
  }

  public withUrl(url: string): HttpRequestStepBuilder<HasUrl, TMethod> {
    const next = new HttpRequestStepBuilder<HasUrl, TMethod>();
    next.url = url;
    next.method = this.method;
    next.headers = { ...this.headers };
    next.body = this.body;
    return next;
  }

  public withMethod(
    method: "GET" | "POST" | "PUT" | "DELETE"
  ): HttpRequestStepBuilder<TUrl, HasMethod> {
    const next = new HttpRequestStepBuilder<TUrl, HasMethod>();
    next.url = this.url;
    next.method = method;
    next.headers = { ...this.headers };
    next.body = this.body;
    return next;
  }

  public withHeader(key: string, value: string): this {
    this.headers[key] = value;
    return this;
  }

  public withBody(body: any): this {
    this.body = body;
    return this;
  }

  public execute(this: HttpRequestStepBuilder<HasUrl, HasMethod>): HttpResponse {
    return {
      statusCode: 200,
      url: this.url!,
      method: this.method!,
      headers: this.headers,
      body: this.body,
    };
  }
}

// Verification Assertions
const builder = new HttpRequestStepBuilder()
  .withUrl("https://api.gateway.internal/v1/orders")
  .withMethod("POST")
  .withHeader("Authorization", "Bearer tok_sec_99")
  .withBody({ orderId: "ord_101", amount: 450 });

const response = builder.execute();

assert.strictEqual(response.statusCode, 200);
assert.strictEqual(response.url, "https://api.gateway.internal/v1/orders");
assert.strictEqual(response.method, "POST");
assert.strictEqual(response.headers["Authorization"], "Bearer tok_sec_99");
assert.deepStrictEqual(response.body, { orderId: "ord_101", amount: 450 });

console.log("Project 1 (Type-State Step-Builder) passed all assertions.");
```

---

### Project 2: Generic Repository & Unit of Work with Transaction Rollback

#### Architectural Overview
```
+-------------------------------------------------------------------------+
|                  Generic Repository & Unit of Work                      |
+-------------------------------------------------------------------------+
|  [Domain Entity: User]                                                  |
|         │                                                               |
|  [GenericRepository<T, TId>] ──► findById(), find(), add(), remove()   |
|         │                                                               |
|  [UnitOfWork]                                                           |
|    ├── registerNew(entity)                                              |
|    ├── registerDirty(entity)                                            |
|    ├── registerDeleted(entity)                                          |
|    ├── commit(): Promise<void>                                          |
|    └── rollback(): void                                                 |
+-------------------------------------------------------------------------+
```

#### Complete Implementation & Verification Suite
```typescript
import assert from "node:assert";

export interface IEntity<TId> {
  id: TId;
}

export interface Specification<T> {
  isSatisfiedBy(candidate: T): boolean;
}

export class UnitOfWork<T extends IEntity<TId>, TId> {
  private inserted: Map<TId, T>;
  private updated: Map<TId, T>;
  private deleted: Set<TId>;
  private primaryStore: Map<TId, T>;

  constructor(primaryStore: Map<TId, T>) {
    this.primaryStore = primaryStore;
    this.inserted = new Map();
    this.updated = new Map();
    this.deleted = new Set();
  }

  public registerNew(entity: T): void {
    this.inserted.set(entity.id, entity);
  }

  public registerDirty(entity: T): void {
    if (!this.inserted.has(entity.id)) {
      this.updated.set(entity.id, entity);
    }
  }

  public registerDeleted(id: TId): void {
    if (this.inserted.has(id)) {
      this.inserted.delete(id);
    } else {
      this.deleted.add(id);
    }
  }

  public commit(): void {
    for (const [id, entity] of this.inserted) {
      this.primaryStore.set(id, entity);
    }
    for (const [id, entity] of this.updated) {
      this.primaryStore.set(id, entity);
    }
    for (const id of this.deleted) {
      this.primaryStore.delete(id);
    }
    this.clearStaging();
  }

  public rollback(): void {
    this.clearStaging();
  }

  private clearStaging(): void {
    this.inserted.clear();
    this.updated.clear();
    this.deleted.clear();
  }
}

export class GenericRepository<T extends IEntity<TId>, TId> {
  private store: Map<TId, T>;
  private unitOfWork: UnitOfWork<T, TId>;

  constructor() {
    this.store = new Map();
    this.unitOfWork = new UnitOfWork(this.store);
  }

  public getUnitOfWork(): UnitOfWork<T, TId> {
    return this.unitOfWork;
  }

  public async findById(id: TId): Promise<T | null> {
    const item = this.store.get(id);
    return item ? { ...item } : null;
  }

  public async find(spec: Specification<T>): Promise<T[]> {
    const matches: T[] = [];
    for (const item of this.store.values()) {
      if (spec.isSatisfiedBy(item)) {
        matches.push({ ...item });
      }
    }
    return matches;
  }

  public add(entity: T): void {
    this.unitOfWork.registerNew(entity);
  }

  public update(entity: T): void {
    this.unitOfWork.registerDirty(entity);
  }

  public delete(id: TId): void {
    this.unitOfWork.registerDeleted(id);
  }
}

// Verification Assertions
interface UserAccount extends IEntity<string> {
  id: string;
  email: string;
  isActive: boolean;
  score: number;
}

const repo = new GenericRepository<UserAccount, string>();
const uow = repo.getUnitOfWork();

// 1. Stage changes
repo.add({ id: "usr_1", email: "alice@test.com", isActive: true, score: 95 });
repo.add({ id: "usr_2", email: "bob@test.com", isActive: false, score: 60 });

// Verify store is un-mutated before commit
let initialCheck = await repo.findById("usr_1");
assert.strictEqual(initialCheck, null);

// 2. Commit transaction
uow.commit();

const alice = await repo.findById("usr_1");
assert.ok(alice);
assert.strictEqual(alice.email, "alice@test.com");

// 3. Test Specification Query
class ActiveHighScoreSpec implements Specification<UserAccount> {
  public isSatisfiedBy(u: UserAccount): boolean {
    return u.isActive && u.score > 80;
  }
}

const activeHighScorers = await repo.find(new ActiveHighScoreSpec());
assert.strictEqual(activeHighScorers.length, 1);
assert.strictEqual(activeHighScorers[0].id, "usr_1");

// 4. Test Rollback
repo.add({ id: "usr_3", email: "charlie@test.com", isActive: true, score: 90 });
uow.rollback(); // Discard staging

const charlie = await repo.findById("usr_3");
assert.strictEqual(charlie, null); // Rollback succeeded!

console.log("Project 2 (Generic Repository & Unit of Work) passed all assertions.");
```

---

### Project 3: Type-Safe Middleware Chain of Responsibility Pipeline

#### Architectural Overview
```
+-------------------------------------------------------------------------+
|                  Type-Safe Middleware Onion Pipeline                    |
+-------------------------------------------------------------------------+
|  [RequestContext] ──► { requestId: string, user?: User, timings: [] }    |
|         │                                                               |
|  [Middleware 1: Timing] ──► Entry timer -> await next() -> Exit duration|
|         │                                                               |
|  [Middleware 2: Auth] ──► Attaches authenticated user to Context        |
|         │                                                               |
|  [Middleware 3: Handler] ──► Generates business response                |
+-------------------------------------------------------------------------+
```

#### Complete Implementation & Verification Suite
```typescript
import assert from "node:assert";

export type NextFunction = () => Promise<void>;
export type Middleware<TCtx> = (context: TCtx, next: NextFunction) => Promise<void>;

export class TypeSafePipeline<TCtx> {
  private stack: Middleware<TCtx>[];

  constructor() {
    this.stack = [];
  }

  public use(middleware: Middleware<TCtx>): this {
    this.stack.push(middleware);
    return this;
  }

  public async execute(context: TCtx): Promise<void> {
    let prevIndex = -1;

    const dispatch = async (index: number): Promise<void> => {
      if (index <= prevIndex) {
        throw new Error("next() called multiple times in single middleware");
      }
      prevIndex = index;

      const fn = this.stack[index];
      if (!fn) return;

      await fn(context, () => dispatch(index + 1));
    };

    await dispatch(0);
  }
}

// Verification Assertions
interface PipelineContext {
  reqId: string;
  userRole?: string;
  auditTrail: string[];
}

const pipeline = new TypeSafePipeline<PipelineContext>();

pipeline.use(async (ctx, next) => {
  ctx.auditTrail.push("Logger:Entry");
  await next();
  ctx.auditTrail.push("Logger:Exit");
});

pipeline.use(async (ctx, next) => {
  ctx.auditTrail.push("Auth:Authenticate");
  ctx.userRole = "admin";
  await next();
  ctx.auditTrail.push("Auth:Completed");
});

pipeline.use(async (ctx) => {
  ctx.auditTrail.push(`Handler:Action[${ctx.userRole}]`);
});

const testContext: PipelineContext = {
  reqId: "req_xyz",
  auditTrail: [],
};

await pipeline.execute(testContext);

assert.deepStrictEqual(testContext.auditTrail, [
  "Logger:Entry",
  "Auth:Authenticate",
  "Handler:Action[admin]",
  "Auth:Completed",
  "Logger:Exit",
]);

console.log("Project 3 (Type-Safe Middleware Pipeline) passed all assertions.");
```

---

### Project 4: Railway-Oriented Result/Either Monad & Error Recovery Engine

#### Architectural Overview
```
+-------------------------------------------------------------------------+
|                  Railway-Oriented Result Monad Engine                   |
+-------------------------------------------------------------------------+
|  Input ──► [Step 1: validateUser] ──► Ok(user) or Err(ValidationError)  |
|                  │                                                      |
|             (on Ok only)                                                |
|                  ▼                                                      |
|           [Step 2: chargeCard]   ──► Ok(tx) or Err(PaymentError)        |
|                  │                                                      |
|             (on Ok only)                                                |
|                  ▼                                                      |
|           [Step 3: sendReceipt]  ──► Ok(emailId) or Err(EmailError)     |
|                  │                                                      |
|         (match success/error)                                           |
+-------------------------------------------------------------------------+
```

#### Complete Implementation & Verification Suite
```typescript
import assert from "node:assert";

export type Result<T, E> = Success<T, E> | Failure<T, E>;

export class Success<T, E> {
  public readonly isSuccess: true = true;
  public readonly isFailure: false = false;
  public readonly value: T;

  constructor(value: T) {
    this.value = value;
  }

  public map<U>(fn: (val: T) => U): Result<U, E> {
    return new Success<U, E>(fn(this.value));
  }

  public flatMap<U>(fn: (val: T) => Result<U, E>): Result<U, E> {
    return fn(this.value);
  }

  public match<U>(branches: { onSuccess: (v: T) => U; onFailure: (e: E) => U }): U {
    return branches.onSuccess(this.value);
  }

  public unwrap(): T {
    return this.value;
  }
}

export class Failure<T, E> {
  public readonly isSuccess: false = false;
  public readonly isFailure: true = true;
  public readonly error: E;

  constructor(error: E) {
    this.error = error;
  }

  public map<U>(_fn: (val: T) => U): Result<U, E> {
    return new Failure<U, E>(this.error);
  }

  public flatMap<U>(_fn: (val: T) => Result<U, E>): Result<U, E> {
    return new Failure<U, E>(this.error);
  }

  public match<U>(branches: { onSuccess: (v: T) => U; onFailure: (e: E) => U }): U {
    return branches.onFailure(this.error);
  }

  public unwrap(): never {
    throw this.error instanceof Error ? this.error : new Error(String(this.error));
  }
}

export function ok<T, E = never>(val: T): Result<T, E> {
  return new Success<T, E>(val);
}

export function err<E, T = never>(e: E): Result<T, E> {
  return new Failure<T, E>(e);
}

export async function tryCatchAsync<T, E = Error>(
  fn: () => Promise<T>
): Promise<Result<T, E>> {
  try {
    const val = await fn();
    return ok(val);
  } catch (error) {
    return err(error as E);
  }
}

// Verification Assertions
interface CheckoutOrder {
  orderId: string;
  amount: number;
}

interface PaymentReceipt {
  receiptId: string;
  orderId: string;
}

function validateOrder(raw: any): Result<CheckoutOrder, string> {
  if (!raw.orderId) return err("Invalid orderId");
  if (raw.amount <= 0) return err("Amount must be positive");
  return ok({ orderId: raw.orderId, amount: raw.amount });
}

function processPayment(order: CheckoutOrder): Result<PaymentReceipt, string> {
  if (order.amount > 1000) return err("Credit limit exceeded");
  return ok({ receiptId: `rcpt_${order.orderId}`, orderId: order.orderId });
}

// Happy path
const goodOrder = validateOrder({ orderId: "ord_1", amount: 150 })
  .flatMap(processPayment)
  .map((rcpt) => rcpt.receiptId.toUpperCase());

assert.strictEqual(goodOrder.isSuccess, true);
assert.strictEqual(goodOrder.unwrap(), "RCPT_ORD_1");

// Failure on validation step
const badValidation = validateOrder({ orderId: "", amount: 150 })
  .flatMap(processPayment);

assert.strictEqual(badValidation.isFailure, true);
const errMsg1 = badValidation.match({
  onSuccess: () => "Should not succeed",
  onFailure: (e) => e,
});
assert.strictEqual(errMsg1, "Invalid orderId");

// Failure on payment step
const badPayment = validateOrder({ orderId: "ord_2", amount: 5000 })
  .flatMap(processPayment);

assert.strictEqual(badPayment.isFailure, true);
const errMsg2 = badPayment.match({
  onSuccess: () => "Should not succeed",
  onFailure: (e) => e,
});
assert.strictEqual(errMsg2, "Credit limit exceeded");

console.log("Project 4 (Railway-Oriented Result Monad) passed all assertions.");
```


---

## 6. Enterprise Best Practices: 20 DOs and DON'Ts

| # | Rule | Bad Practice (DON'T) | Best Practice (DO) | Architectural Impact |
|---|------|----------------------|--------------------|----------------------|
| 1 | **Compile-Time Step Verification** | Throwing runtime errors if required builder properties are missing | Use phantom type states (`Builder<HasUrl, HasMethod>`) | Enforces valid builder progression at compile time before `.build()` is callable. |
| 2 | **Explicit Error Handling** | Throwing untyped exceptions across business boundaries | Return `Result<T, E>` monads | Guarantees that errors are part of the type signature and must be handled by callers. |
| 3 | **Avoid Telescoping Constructors** | Creating constructors with 7+ arguments and boolean flags | Implement Step-Builder or Options configuration objects | Eliminates positional parameter bugs and improves self-documenting code. |
| 4 | **Middleware Re-entrancy Protection** | Allowing arbitrary multiple calls to `next()` in middleware | Guard with `if (index <= prevIndex) throw ...` | Prevents cascading duplicate pipeline execution and corrupted responses. |
| 5 | **Identity Map Caching** | Re-fetching entities from storage repeatedly in a transaction | Cache entity instances in an Identity Map | Prevents inconsistent concurrent mutations and redundant I/O roundtrips. |
| 6 | **Rollback Safety** | Mutating production storage directly during multi-step transactions | Stage changes in a Unit of Work and commit atomically | Guarantees zero partial-state contamination when intermediate steps fail. |
| 7 | **Dynamic Factory Type Safety** | Hardcoding large `switch(type)` statements in factories | Use a generic registry mapping keys to constructors | Fulfills OCP; new subclasses register themselves without modifying the factory. |
| 8 | **Specification Pattern Over Raw Queries** | Inlining complex SQL / Mongo filter logic into services | Encapsulate rules into reusable `Specification<T>` classes | Enables rule composition (`specA.and(specB)`) across both in-memory and database queries. |
| 9 | **Hardened Singleton Encapsulation** | Relying on convention not to call `new Singleton()` | Make constructor `private` and throw if an instance exists | Prevents accidental duplicate instantiations via reflection. |
| 10 | **Explicit Class Properties** | Using parameter properties `constructor(public x: string)` | Declare explicit class fields | Ensures compatibility with Node.js `--experimental-strip-types` and modern tooling. |
| 11 | **LRU Eviction Order Refresh** | Only updating LRU position on writes | Refresh ordering on both `get()` and `set()` | Accurately retains frequently read entries, preventing premature eviction. |
| 12 | **Avoid Async Swallowing in `tryCatch`** | Passing an async Promise to synchronous `tryCatch` | Use dedicated `tryCatchAsync` awaiting the Promise | Prevents unhandled rejected promises from escaping as successful `Ok(Promise)`. |
| 13 | **Token Bucket Refill Precision** | Using coarse interval timers for rate limit refills | Calculate elapsed time proportionally on consumption: `now - lastRefill` | Guarantees exact token allocation without timer drift or memory leaks. |
| 14 | **Saga Compensation Inversion** | Compensating saga steps in forward execution order | Compensate previously executed steps in **strict reverse order** | Accurately unwinds nested distributed transactions. |
| 15 | **Avoid Memory Leaks in Event Observers** | Subscribing without retaining an unsubscribe token | Return an `Unsubscribe` closure from `subscribe()` | Prevents retained closures and `MaxListenersExceededWarning`. |
| 16 | **Prefer Composition over Class Trees** | Creating deep 5-tier inheritance hierarchies | Compose independent Strategy and Decorator objects | Eliminates Fragile Base Class problems and compile-time rigidity. |
| 17 | **Immutable Value Objects** | Providing public setters on Value Objects | Declare properties `public readonly` and freeze in constructor | Guarantees that value equality holds indefinitely without side effects. |
| 18 | **Dependency Injection Over Service Locator** | Pulling dependencies out of a global locator map | Inject abstractions via constructor parameters | Makes component requirements transparent and enables straightforward unit testing. |
| 19 | **Circuit Breaker Fast-Failure** | Continuously hitting unresponsive external APIs | Trip to `OPEN` state after repeated consecutive failures | Protects downstream capacity and returns immediate failure to clients. |
| 20 | **Export Monad & Pattern Types** | Burying `Result` or `Builder` return types inside function bodies | Export named type aliases (`UserResult = Result<User, AuthError>`) | Improves IDE hover tooltips, developer ergonomics, and generated declaration files. |

---

## 7. Real-World Case Study: Enterprise E-Commerce Checkout Engine

### Problem Context
An international e-commerce platform processes millions of dollars in orders daily. The checkout process involves:
1. Validating shopping cart inventory.
2. Applying dynamic tiered and regional discount strategies.
3. Calculating tax via third-party tax engines.
4. Charging the payment gateway with automated retry.
5. Emitting transactional domain events.
Any failure at steps 3 or 4 must immediately rollback reserved inventory and release locks.

### Architectural Solution
We synthesize the complete suite of Enterprise Patterns:
- **Type-State Step-Builder**: `CheckoutContextBuilder` guarantees cart, address, and payment method exist before execution.
- **Strategy Pattern**: `DiscountStrategy` and `TaxStrategy` allow dynamic runtime policy injection.
- **Chain of Responsibility**: A modular pipeline coordinates validation, tax computation, and payment execution.
- **Repository & Unit of Work**: Ensures all database modifications commit atomically or rollback cleanly.
- **Result Monad**: Every step yields a typed `Result<T, CheckoutError>`, eliminating unhandled exceptions.

```typescript
// Architectural Sketch of Checkout Synthesis
export interface CartItem { sku: string; price: number; quantity: number; }
export interface CustomerAddress { country: string; zip: string; }
export interface PaymentDetails { token: string; provider: "stripe" | "paypal"; }

export class CheckoutProcessor {
  constructor(
    private discountStrategy: DiscountStrategy,
    private taxStrategy: TaxStrategy,
    private unitOfWork: UnitOfWork<any, string>
  ) {}

  public async processCheckout(
    cart: CartItem[],
    address: CustomerAddress,
    payment: PaymentDetails
  ): Promise<Result<{ orderId: string; totalPaid: number }, string>> {
    // 1. Calculate raw total
    const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

    // 2. Apply discount strategy
    const discountedTotal = this.discountStrategy.calculate(subtotal);

    // 3. Apply tax strategy
    const taxAmount = this.taxStrategy.calculate(discountedTotal);
    const finalAmount = discountedTotal + taxAmount;

    // 4. Atomic transaction staging
    try {
      const orderId = `ORD-${Date.now()}`;
      this.unitOfWork.registerNew({ id: orderId, amount: finalAmount });
      this.unitOfWork.commit();
      return ok({ orderId, totalPaid: finalAmount });
    } catch (err) {
      this.unitOfWork.rollback();
      return err("Checkout transaction failed and was rolled back");
    }
  }
}
```

---

## 8. Practice Drills (75 Drills across 5 Progression Tiers)

### Tier 1: Creational Patterns & Generic Factories (Drills 1–15)
1. Implement a Type-State Builder for a Database Connection string enforcing Host and Database before `.connect()`.
2. Implement a Step-Builder for constructing HTTP Headers with fluent chaining.
3. Build a Generic Factory that maps string keys to service constructors.
4. Implement a reflection-proof Singleton using a Symbol instance property and `Object.freeze()`.
5. Write an Abstract Factory creating UI components (Buttons, Inputs) for Web and Desktop.
6. Create an immutable Value Object `ColorRGB` with `equals()` comparison.
7. Implement an object pool reusing expensive database connection wrappers.
8. Create a Lazy Evaluator that defers object construction until the first property read.
9. Implement a Cloneable interface using the Curiously Recurring Template Pattern.
10. Build a dynamic plugin registry where plugins register themselves at initialization.
11. Implement a prototype-based object cloning factory using `structuredClone`.
12. Build an options builder with default fallback values merged via object spread.
13. Create an abstract constructor type and test dynamic instantiation via `new Ctor()`.
14. Build a Type-Safe Configuration Factory validating environment variables.
15. Implement a Flyweight factory sharing immutable character formatting objects.

### Tier 2: Structural Patterns & Decoupled Architecture (Drills 16–30)
16. Implement the Generic Repository Pattern with in-memory storage.
17. Implement the Unit of Work pattern staging new, dirty, and deleted entities.
18. Build an Identity Map that caches entity references by ID during a request lifecycle.
19. Implement the Specification Pattern with `and()`, `or()`, and `not()` combinators.
20. Implement a Type-Safe Dynamic Adapter converting snake_case payloads to camelCase.
21. Implement a Decorator wrapping an asynchronous repository with execution time logging.
22. Build a Facade hiding the complexity of a 3-step media compression pipeline.
23. Implement the Composite Pattern representing a nested folder and file structure.
24. Create a Type-Safe Proxy that intercepts property writes and logs mutations.
25. Implement a caching Decorator that caches repository `findById` calls with TTL.
26. Create an Adapter bridging a legacy callback-based API to Promise-based syntax.
27. Implement a Composite Specification combining 3 independent business criteria.
28. Build a Virtual Proxy that loads entity relations lazily upon first property access.
29. Implement an in-memory transactional key-value store with rollback support.
30. Design a Hexagonal Architecture Port and Adapter for an SMS notification service.

### Tier 3: Behavioral Patterns & Event Pipelines (Drills 31–45)
31. Implement the Strategy Pattern with three compression strategies (Gzip, Brotli, None).
32. Build an Asynchronous Middleware Chain of Responsibility pipeline with `next()`.
33. Implement re-entrancy protection in a middleware pipeline preventing double `next()` calls.
34. Build a strongly-typed EventEmitter mapping event names to payload interfaces.
35. Implement the Command Pattern with `execute()` and `undo()` for a text buffer.
36. Build a Command History manager supporting multi-level undo and redo.
37. Implement the State Pattern for a Media Player (Playing, Paused, Stopped).
38. Implement the Observer Pattern returning an explicit `Unsubscribe` closure.
39. Build a Token Bucket Rate Limiter with continuous mathematical refill.
40. Implement a Saga Orchestrator executing forward steps and compensating in reverse order.
41. Implement the Memento Pattern saving and restoring entity snapshots.
42. Build a Mediator coordinating interactions between a Form, Button, and ErrorDisplay.
43. Implement the Template Method Pattern with an abstract data extraction pipeline.
44. Build a Circuit Breaker transitioning between CLOSED, OPEN, and HALF-OPEN states.
45. Implement an exponential backoff retry utility with randomized jitter.

### Tier 4: Railway-Oriented Programming & Functional Monads (Drills 46–60)
46. Implement the `Result<T, E>` monad with `Ok` and `Err` classes.
47. Implement `Result.map()` transforming successful values.
48. Implement `Result.flatMap()` binding sequential operations returning Results.
49. Implement `Result.match()` pattern matching on success and failure branches.
50. Implement `tryCatch()` wrapping throwing synchronous functions into Results.
51. Implement `tryCatchAsync()` wrapping Promise rejections into Results.
52. Implement the `Option<T>` monad with `Some` and `None` branches.
53. Implement `pipe()` supporting 4 sequential function applications with full type safety.
54. Implement `compose()` evaluating functions in right-to-left mathematical order.
55. Implement a Type-Safe `curry()` function for binary functions.
56. Implement a Type-Safe `memoize()` function caching results by serialized arguments.
57. Build a validation pipeline returning an array of all validation error strings.
58. Chain 3 business operations using `flatMap()` and assert early failure short-circuiting.
59. Implement an `Either<L, R>` monad and compare its ergonomics with `Result<T, E>`.
60. Build an asynchronous Promise Pool throttling concurrency to a maximum of $N$ workers.

### Tier 5: Enterprise Framework Architecture & Synthesis (Drills 61–75)
61. Build an end-to-end E-Commerce Checkout engine synthesizing Builder, Strategy, and Unit of Work.
62. Construct a full-featured In-Memory CQRS Command Bus and Query Bus.
63. Implement an Outbox Pattern worker staging domain events alongside database transactions.
64. Build a lightweight Inversion of Control (IoC) Container with Transient and Singleton lifecycles.
65. Implement circular dependency detection in a generic IoC Container.
66. Build a multi-tenant repository where every query is automatically scoped to a `tenantId`.
67. Implement a feature-flag evaluation engine with contextual user targeting.
68. Build a Least-Recently-Used (LRU) Cache with capacity eviction and TTL expiration.
69. Implement a Graceful Shutdown manager listening for `SIGTERM` and cleaning up open handles.
70. Build an In-Memory Distributed Lock / Mutex for serializing asynchronous workflows.
71. Construct an Event Store supporting stream append and optimistic version checking.
72. Implement an asynchronous Batch Processor chunking arrays into parallel batches.
73. Design a Clean Architecture boundary model strictly separating Domain, Use Case, and Adapter types.
74. Build a Type-Safe HTTP Client with request and response interceptor pipelines.
75. Design a complete Microservices Contract Gateway with typed routing and payload validation.


---

