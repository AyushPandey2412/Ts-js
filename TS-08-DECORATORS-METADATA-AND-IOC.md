# Module TS-08: Decorators (Stage 3), Metadata, & IoC/DI Containers

> **Track**: TypeScript Production Engineering Masterclass (TS 5.x)  
> **Prerequisites**: [TS-00](file:///C:/Users/ayush/OneDrive/Desktop/js-learning/TS-00-QUEUE-AND-INDEX.md), [TS-01](file:///C:/Users/ayush/OneDrive/Desktop/js-learning/TS-01-TYPE-ARCHITECTURE-AND-STRUCTURAL-SUBTYPING.md), [TS-02](file:///C:/Users/ayush/OneDrive/Desktop/js-learning/TS-02-GENERICS-AND-TYPE-OPERATORS.md), [TS-03](file:///C:/Users/ayush/OneDrive/Desktop/js-learning/TS-03-CONDITIONAL-TYPES-AND-INFERENCE.md), [TS-04](file:///C:/Users/ayush/OneDrive/Desktop/js-learning/TS-04-MAPPED-TYPES-AND-METAPROGRAMMING.md), [TS-05](file:///C:/Users/ayush/OneDrive/Desktop/js-learning/TS-05-TEMPLATE-LITERAL-TYPES-AND-PARSERS.md), [TS-06](file:///C:/Users/ayush/OneDrive/Desktop/js-learning/TS-06-OOP-CLASS-INTERNALS-AND-SOLID.md), [TS-07](file:///C:/Users/ayush/OneDrive/Desktop/js-learning/TS-07-ENTERPRISE-DESIGN-PATTERNS-AND-BUILDERS.md)  
> **Target Audience**: Principal Engineers, Framework Authors, Platform Architects  
> **Universal Specification**: Complete Technical Treatise, 90 Real-World Interview Q&As with Runnable Code, 15 Prediction Puzzles with Step-by-Step Traces, 4 Complete Runnable Production Projects with Test Assertions, 20 DOs & DON'Ts, Real-World Enterprise Case Study, 75 Practice Drills (5 Tiers).

---

# Module TS-08: Decorators (Stage 3), Metadata, & IoC/DI Containers

## 1. Architectural Deep-Dive & Specification Foundations

### 1.1 The Decorator Evolution: Legacy (Stage 2) vs Modern (TC39 Stage 3 / TS 5.0+)

For nearly a decade, the TypeScript ecosystem relied on experimental decorators (`"experimentalDecorators": true`, originating in TC39 Stage 2). With **TypeScript 5.0**, TypeScript implemented the finalized **TC39 Stage 3 Decorator Standard** directly into the core language. Modern decorators are now native ECMAScript standard features requiring **zero experimental compiler flags**.

```
+-------------------------------------------------------------------------+
|                  TC39 Stage 3 vs Legacy Decorator Evolution             |
+-------------------------------------------------------------------------+
|  Feature                  | Legacy (Stage 2)     | Modern (Stage 3)     |
|  -------------------------+----------------------+----------------------|
|  Standardization Status   | Abandoned Draft      | TC39 Stage 3 Standard|
|  tsconfig.json flag       | experimentalDecorators| NONE (Standard TS)  |
|  Metadata Library         | reflect-metadata npm | Built-in Symbol.metadata|
|  Argument Signature       | (target, key, desc)  | (target, context)    |
|  Auto-Accessors           | NOT Supported        | Supported (accessor) |
|  Private Member (#) Decs  | FORBIDDEN            | Fully Supported      |
|  Type Safety              | Weak / Untyped       | Strongly Typed       |
+-------------------------------------------------------------------------+
```

---

### 1.2 TC39 Stage 3 Decorator Anatomy & Context Interfaces

A Stage 3 Decorator is an ordinary JavaScript function that receives two arguments:
1. `target`: The value being decorated (the class constructor, method function, getter/setter function, or accessor object; `undefined` for fields).
2. `context`: A strongly-typed metadata object (`DecoratorContext`) describing the member.

```typescript
type ClassMethodDecorator = <This, Args extends any[], Return>(
  target: (this: This, ...args: Args) => Return,
  context: ClassMethodDecoratorContext<This, (this: This, ...args: Args) => Return>
) => ((this: This, ...args: Args) => Return) | void;
```

#### The `context` Object Properties:
- `kind`: The decorator target category (`'class'` | `'method'` | `'getter'` | `'setter'` | `'field'` | `'accessor'`).
- `name`: The string or symbol name of the member.
- `static`: Boolean indicating whether the member is static.
- `private`: Boolean indicating whether the member is a `#private` field or method.
- `access`: An object containing `get()` and optional `set()` closures providing direct access to the member.
- `addInitializer(initializer: () => void)`: Schedules a callback to run after the class or instance is constructed.
- `metadata`: An object shared across all decorators on the class and its prototype chain (`Symbol.metadata`).

---

### 1.3 Auto-Accessors (`accessor prop: Type`)

Standard class fields (`public name: string`) cannot be intercepted by getters or setters without completely rewriting the property into explicit `get name()` and `set name()` methods.

TC39 Stage 3 introduced the `accessor` keyword (supported natively in TS 4.9+ and standardized with decorators in TS 5.0):

```typescript
class UserProfile {
  // Auto-accessor generates a private internal backing storage slot:
  accessor username: string = "anonymous";
}
```

#### Desugaring of Auto-Accessors:
Under the hood, `accessor username: string = "anonymous"` is equivalent to:
```javascript
class UserProfileDesugared {
  #username = "anonymous";
  get username() { return this.#username; }
  set username(value) { this.#username = value; }
}
```

#### Decorating Auto-Accessors:
An auto-accessor decorator can intercept read, write, and initial value assignment:
```typescript
function loggedAccessor<This, Value>(
  target: ClassAccessorDecoratorTarget<This, Value>,
  context: ClassAccessorDecoratorContext<This, Value>
): ClassAccessorDecoratorResult<This, Value> {
  return {
    get(this: This): Value {
      console.log(`[GET] ${String(context.name)}`);
      return target.get.call(this);
    },
    set(this: This, value: Value): void {
      console.log(`[SET] ${String(context.name)} = ${value}`);
      target.set.call(this, value);
    },
    init(this: This, value: Value): Value {
      console.log(`[INIT] ${String(context.name)} initialized with ${value}`);
      return value;
    }
  };
}
```

---

### 1.4 Class Method Decorator: Interception & Wrapping

A method decorator returns a replacement function that wraps the original method call:

```typescript
export function loggedMethod<This, Args extends any[], Return>(
  target: (this: This, ...args: Args) => Return,
  context: ClassMethodDecoratorContext<This, (this: This, ...args: Args) => Return>
) {
  const methodName = String(context.name);

  function replacementMethod(this: This, ...args: Args): Return {
    console.log(`[ENTER] ${methodName} with args:`, args);
    const start = performance.now();
    try {
      const result = target.call(this, ...args);
      console.log(`[EXIT] ${methodName} took ${(performance.now() - start).toFixed(2)}ms`);
      return result;
    } catch (error) {
      console.error(`[ERROR] ${methodName} threw:`, error);
      throw error;
    }
  }

  return replacementMethod;
}

class PaymentService {
  @loggedMethod
  public processPayment(amount: number): string {
    return `tx_success_${amount}`;
  }
}
```

---

### 1.5 Class Decorator: Constructor Wrapping & Mutation

A class decorator can wrap the constructor function, add static properties, or instantiate mixin behavior:

```typescript
export function sealedClass<TFunction extends abstract new (...args: any[]) => any>(
  target: TFunction,
  context: ClassDecoratorContext<TFunction>
) {
  context.addInitializer(function () {
    console.log(`Class ${String(context.name)} initialized.`);
  });

  Object.seal(target);
  Object.seal(target.prototype);
}
```


---

## 2. Decorator Metadata (`Symbol.metadata`) & Inversion of Control (IoC) Containers

### 2.1 The Modern Decorator Metadata Standard (`context.metadata`, TS 5.2+)

In legacy TypeScript, storing metadata required the external third-party library `reflect-metadata` and the `"emitDecoratorMetadata": true` compiler flag.

In **TypeScript 5.2+**, metadata is a **native language feature** via `context.metadata` and the well-known symbol `Symbol.metadata`. Every decorator invocation receives access to a shared plain JavaScript object via `context.metadata`:

```typescript
// Polyfill Symbol.metadata for runtimes where it is not yet defined globally:
(Symbol as any).metadata ??= Symbol("Symbol.metadata");

// Attaching metadata via modern decorators:
export function tagged(tag: string) {
  return function <This, Value>(
    target: any,
    context: ClassMemberDecoratorContext<This, Value> | ClassDecoratorContext
  ) {
    // context.metadata is a shared plain object across the class:
    context.metadata[context.name] = tag;
  };
}

class InvoiceService {
  @tagged("FINANCIAL_AUDIT")
  public generateReport(): void {}
}

// Reading metadata without any reflection library:
const metadata = (InvoiceService as any)[Symbol.metadata];
console.log(metadata.generateReport); // "FINANCIAL_AUDIT"
```

#### Metadata Inheritance Rules:
When a class extends a base class, the derived class inherits its metadata object using standard prototype linkage:
`DerivedClass[Symbol.metadata].__proto__ === BaseClass[Symbol.metadata]`

This means child classes automatically inherit base class decorator annotations while allowing child decorators to override them without mutating the parent!

---

### 2.2 Designing an Enterprise IoC/DI Container from Scratch

Inversion of Control (IoC) decouples object creation and lifecycle management from consuming business classes. Below is the complete architecture for a native Stage 3 IoC Container:

```
+-------------------------------------------------------------------------+
|                  TC39 Stage 3 Native IoC Container                     |
+-------------------------------------------------------------------------+
|  [@injectable()] ──► Tags class with Container Token & Scope Metadata   |
|         │                                                               |
|  [@inject(token)] ──► Auto-Accessor decorator injecting dependency     |
|         │                                                               |
|  [IoCContainer]                                                         |
|    ├── bind<T>(token, constructor, scope: 'singleton' | 'transient')   |
|    ├── resolve<T>(token): T                                             |
|    └── Dependency Graph Cycle Detection (Circular Dependency Defense)   |
+-------------------------------------------------------------------------+
```

#### Implementation Architecture:
```typescript
(Symbol as any).metadata ??= Symbol("Symbol.metadata");

export type ServiceLifetime = "singleton" | "transient";
export type ServiceToken<T = any> = string | symbol;

export interface Registration<T = any> {
  token: ServiceToken<T>;
  target: new (...args: any[]) => T;
  lifetime: ServiceLifetime;
  instance?: T;
}

const INJECTIONS_KEY = Symbol("IoC:Injections");

// Decorator: @injectable
export function injectable(lifetime: ServiceLifetime = "transient") {
  return function <TFunction extends new (...args: any[]) => any>(
    target: TFunction,
    context: ClassDecoratorContext<TFunction>
  ) {
    context.metadata.lifetime = lifetime;
  };
}

// Decorator: @inject on auto-accessors
export function inject(token: ServiceToken) {
  return function <This, Value>(
    target: ClassAccessorDecoratorTarget<This, Value>,
    context: ClassAccessorDecoratorContext<This, Value>
  ): ClassAccessorDecoratorResult<This, Value> {
    // Record injection token in metadata
    if (!context.metadata[INJECTIONS_KEY]) {
      context.metadata[INJECTIONS_KEY] = new Map<string | symbol, ServiceToken>();
    }
    (context.metadata[INJECTIONS_KEY] as Map<string | symbol, ServiceToken>).set(
      context.name,
      token
    );

    return target;
  };
}

// The IoC Container Engine
export class NativeIoCContainer {
  private registrations: Map<ServiceToken, Registration> = new Map();
  private resolvingTokens: Set<ServiceToken> = new Set();

  public bind<T>(
    token: ServiceToken<T>,
    target: new (...args: any[]) => T,
    lifetime: ServiceLifetime = "transient"
  ): this {
    this.registrations.set(token, { token, target, lifetime });
    return this;
  }

  public resolve<T>(token: ServiceToken<T>): T {
    const reg = this.registrations.get(token);
    if (!reg) {
      throw new Error(`IoCResolutionError: No binding found for token: ${String(token)}`);
    }

    if (reg.lifetime === "singleton" && reg.instance) {
      return reg.instance as T;
    }

    // Circular Dependency Detection
    if (this.resolvingTokens.has(token)) {
      throw new Error(`CircularDependencyError: Cycle detected while resolving: ${String(token)}`);
    }

    this.resolvingTokens.add(token);

    try {
      // Instantiate target class
      const instance = new reg.target();

      // Read auto-accessor injections from Symbol.metadata
      const metadata = (reg.target as any)[Symbol.metadata];
      const injections = metadata?.[INJECTIONS_KEY] as Map<string | symbol, ServiceToken> | undefined;

      if (injections) {
        for (const [propName, depToken] of injections.entries()) {
          const resolvedDep = this.resolve(depToken);
          (instance as any)[propName] = resolvedDep;
        }
      }

      if (reg.lifetime === "singleton") {
        reg.instance = instance;
      }

      return instance as T;
    } finally {
      this.resolvingTokens.delete(token);
    }
  }
}
```


---

## 3. 90 Real-World Technical Interview Q&As (Part 1: Q1–Q45)

---

#### Q1: In what version of TypeScript were TC39 Stage 3 Decorators introduced?
**Answer:**
TypeScript 5.0 introduced support for TC39 Stage 3 Decorators. Decorator Metadata (`context.metadata` / `Symbol.metadata`) was subsequently added in TypeScript 5.2.

---

#### Q2: What compiler flag in `tsconfig.json` is required for Stage 3 Decorators?
**Answer:**
**None.** Stage 3 decorators are part of standard JavaScript and require no experimental compiler flags. If you have `"experimentalDecorators": true` in your `tsconfig.json`, you must remove or set it to `false` to enable standard Stage 3 decorators.

---

#### Q3: What are the fundamental differences between legacy (Stage 2) and modern (Stage 3) decorators?
**Answer:**
1. **Signature**: Legacy decorators receive `(target, propertyKey, descriptor)`. Stage 3 decorators receive `(target, context)`.
2. **Context**: Stage 3 provides a strongly-typed `DecoratorContext` containing `kind`, `name`, `static`, `private`, `access`, and `addInitializer`.
3. **Private Members**: Legacy decorators could not decorate `#private` members. Stage 3 decorators fully support `#private` methods and fields.
4. **Auto-Accessors**: Stage 3 introduces `accessor` properties specifically to allow decorators to intercept property gets and sets cleanly.

---

#### Q4: What are the 6 decorator target kinds supported in Stage 3?
**Answer:**
1. `class` (`ClassDecoratorContext`)
2. `method` (`ClassMethodDecoratorContext`)
3. `getter` (`ClassGetterDecoratorContext`)
4. `setter` (`ClassSetterDecoratorContext`)
5. `field` (`ClassFieldDecoratorContext`)
6. `accessor` (`ClassAccessorDecoratorContext`)

---

#### Q5: What properties does the `context` object expose in Stage 3 decorators?
**Answer:**
- `kind`: Member category (`'class'`, `'method'`, `'getter'`, `'setter'`, `'field'`, `'accessor'`).
- `name`: String or Symbol name of the decorated member.
- `static`: `true` if member is static, `false` otherwise.
- `private`: `true` if member is a private identifier (`#member`).
- `access`: Object with `get()` and optional `set()` closures.
- `addInitializer(fn)`: Registers an initialization hook.
- `metadata`: Shared plain object across all decorators on the class (`Symbol.metadata`).

---

#### Q6: What are Auto-Accessors (`accessor prop: Type`) and why were they introduced?
**Answer:**
Auto-accessors introduce an internal private backing storage slot and automatically synthesize a public getter and setter. They were introduced because plain class fields (`public name = "Alice"`) cannot be intercepted on read and write without declaring boilerplate getter/setter pairs.

```typescript
class Account {
  accessor balance: number = 0; // Backed by private slot with auto-generated getter/setter
}
```

---

#### Q7: How does an auto-accessor decorator intercept reads, writes, and initial values?
**Answer:**
By returning an object with `get`, `set`, and optional `init` methods:

```typescript
function traceAccessor<This, Value>(
  target: ClassAccessorDecoratorTarget<This, Value>,
  context: ClassAccessorDecoratorContext<This, Value>
): ClassAccessorDecoratorResult<This, Value> {
  return {
    get(this: This): Value {
      return target.get.call(this);
    },
    set(this: This, value: Value): void {
      target.set.call(this, value);
    },
    init(this: This, value: Value): Value {
      return value;
    }
  };
}
```

---

#### Q8: How do you write a method decorator that logs execution time?
**Answer:**
```typescript
function timedMethod<This, Args extends any[], Return>(
  target: (this: This, ...args: Args) => Return,
  context: ClassMethodDecoratorContext<This, (this: This, ...args: Args) => Return>
) {
  return function (this: This, ...args: Args): Return {
    const start = performance.now();
    try {
      return target.call(this, ...args);
    } finally {
      console.log(`${String(context.name)} took ${(performance.now() - start).toFixed(2)}ms`);
    }
  };
}
```

---

#### Q9: How do you write an auto-bind method decorator in Stage 3?
**Answer:**
Use `context.addInitializer()` to bind the method instance in the constructor:

```typescript
function autobind<This, Args extends any[], Return>(
  target: (this: This, ...args: Args) => Return,
  context: ClassMethodDecoratorContext<This, (this: This, ...args: Args) => Return>
) {
  const methodName = context.name;
  context.addInitializer(function (this: This) {
    (this as any)[methodName] = target.bind(this);
  });
}
```

---

#### Q10: What does a field decorator receive as its `target` argument in Stage 3?
**Answer:**
In Stage 3, the `target` argument passed to a field decorator is always `undefined`! This is because class fields do not exist on the prototype during class definition.

---

#### Q11: What can a field decorator return in Stage 3?
**Answer:**
A field decorator can return an **initializer function** `(initialValue: Value) => Value` that modifies or transforms the initial field value when an instance is constructed:

```typescript
function toUpper<This, Value extends string>(
  target: undefined,
  context: ClassFieldDecoratorContext<This, Value>
) {
  return function (initialValue: Value): Value {
    return initialValue.toUpperCase() as Value;
  };
}
```

---

#### Q12: Can a field decorator intercept subsequent property assignments after construction?
**Answer:**
No. A field decorator only intercepts the **initialization** value. To intercept subsequent assignments (`set`) and reads (`get`), you must use an **auto-accessor** decorator (`accessor prop: Type`).

---

#### Q13: What is the execution order of decorators on a class?
**Answer:**
1. Member decorators execute in definition order from top to bottom inside the class body.
2. If multiple decorators decorate a single member, they execute **inside-out / bottom-up** (closest to the member first).
3. Class decorators execute last, after all member decorators have run.

---

#### Q14: What is the evaluation order of decorator factory expressions vs decorator execution?
**Answer:**
Decorator factory expressions evaluate in order from top to bottom (like normal arguments). The resulting decorator functions execute in reverse order (bottom-up / inside-out).

```typescript
function dec(name: string) {
  console.log(`Evaluated: ${name}`);
  return (target: any, context: any) => { console.log(`Executed: ${name}`); };
}

class Test {
  @dec("Outer")
  @dec("Inner")
  method() {}
}
// Output:
// Evaluated: Outer
// Evaluated: Inner
// Executed: Inner
// Executed: Outer
```

---

#### Q15: What is `Symbol.metadata` in TypeScript 5.2+?
**Answer:**
`Symbol.metadata` is a standard ECMAScript well-known symbol. The metadata attached to `context.metadata` during class definition is assigned to `Constructor[Symbol.metadata]`.

---

#### Q16: How do subclasses inherit decorator metadata in TypeScript 5.2+?
**Answer:**
Through standard prototype inheritance:
`SubClass[Symbol.metadata].__proto__ === SuperClass[Symbol.metadata]`.
Subclasses inherit base class metadata automatically while isolating their own mutations.

---

#### Q17: How do you polyfill `Symbol.metadata` in Node.js or browser environments?
**Answer:**
```typescript
(Symbol as any).metadata ??= Symbol("Symbol.metadata");
```

---

#### Q18: Can TC39 Stage 3 decorate `#private` members?
**Answer:**
Yes. Stage 3 decorators fully support private identifiers (`#field`, `#method`). In the decorator context, `context.private` will be `true`.

---

#### Q19: Why are parameter decorators not supported in TC39 Stage 3?
**Answer:**
The TC39 committee separated parameter decorators into a distinct follow-up proposal (Stage 1/2) to stabilize the core decorator proposal first.

---

#### Q20: How do modern Stage 3 frameworks achieve dependency injection without parameter decorators?
**Answer:**
By injecting dependencies into **auto-accessors** using `@inject(token) accessor service: ServiceType;` or using class-level metadata maps.

---

#### Q21: How do you write a `@retry(maxRetries, delayMs)` method decorator?
**Answer:**
```typescript
function retry(maxRetries: number = 3, delayMs: number = 100) {
  return function <This, Args extends any[], Return>(
    target: (this: This, ...args: Args) => Promise<Return>,
    context: ClassMethodDecoratorContext<This, (this: This, ...args: Args) => Promise<Return>>
  ) {
    return async function (this: This, ...args: Args): Promise<Return> {
      let attempts = 0;
      while (attempts < maxRetries) {
        try {
          return await target.call(this, ...args);
        } catch (err) {
          attempts++;
          if (attempts >= maxRetries) throw err;
          await new Promise((r) => setTimeout(r, delayMs));
        }
      }
      throw new Error("Retry attempts exhausted");
    };
  };
}
```

---

#### Q22: How do you write a `@memoize()` method decorator?
**Answer:**
```typescript
function memoize<This, Args extends any[], Return>(
  target: (this: This, ...args: Args) => Return,
  context: ClassMethodDecoratorContext<This, (this: This, ...args: Args) => Return>
) {
  const cache = new Map<string, Return>();
  return function (this: This, ...args: Args): Return {
    const key = JSON.stringify(args);
    if (cache.has(key)) return cache.get(key)!;
    const res = target.call(this, ...args);
    cache.set(key, res);
    return res;
  };
}
```

---

#### Q23: How do you write a `@debounce(delayMs)` method decorator?
**Answer:**
```typescript
function debounce(delayMs: number) {
  return function <This, Args extends any[]>(
    target: (this: This, ...args: Args) => void,
    context: ClassMethodDecoratorContext<This, (this: This, ...args: Args) => void>
  ) {
    let timeout: any = null;
    return function (this: This, ...args: Args): void {
      clearTimeout(timeout);
      timeout = setTimeout(() => target.call(this, ...args), delayMs);
    };
  };
}
```

---

#### Q24: How do you write a `@deprecated(warningMessage)` method decorator?
**Answer:**
```typescript
function deprecated(message: string = "This method is deprecated.") {
  return function <This, Args extends any[], Return>(
    target: (this: This, ...args: Args) => Return,
    context: ClassMethodDecoratorContext<This, (this: This, ...args: Args) => Return>
  ) {
    let warned = false;
    return function (this: This, ...args: Args): Return {
      if (!warned) {
        console.warn(`[DEPRECATION] ${String(context.name)}: ${message}`);
        warned = true;
      }
      return target.call(this, ...args);
    };
  };
}
```

---

#### Q25: Can a Stage 3 class decorator return a replacement constructor function?
**Answer:**
Yes. A class decorator can return a new constructor extending the target:

```typescript
function singleton<T extends new (...args: any[]) => any>(
  target: T,
  context: ClassDecoratorContext<T>
) {
  let instance: InstanceType<T>;
  return class extends target {
    constructor(...args: any[]) {
      if (instance) return instance;
      super(...args);
      instance = this as any;
    }
  };
}
```

---

#### Q26: What happens if a decorator throws an exception during class evaluation?
**Answer:**
Class evaluation immediately aborts with that exception, preventing the class constructor from being defined or registered in the environment.

---

#### Q27: How does `context.addInitializer()` work on class static methods?
**Answer:**
The initializer callback executes immediately when the class declaration is being finalized, receiving the constructor function as `this`.

---

#### Q28: How does `context.addInitializer()` work on instance methods?
**Answer:**
The initializer callback executes inside the instance constructor during `new ClassName()`, receiving the freshly created instance as `this`.

---

#### Q29: How do you write a decorator that validates method argument types at runtime?
**Answer:**
Wrap the target function and evaluate arguments against validation rules before invoking the target:

```typescript
function assertPositive(index: number) {
  return function <This, Args extends number[], Return>(
    target: (this: This, ...args: Args) => Return,
    context: ClassMethodDecoratorContext<This, (this: This, ...args: Args) => Return>
  ) {
    return function (this: This, ...args: Args): Return {
      if (args[index] <= 0) throw new Error(`Argument at index ${index} must be positive`);
      return target.call(this, ...args);
    };
  };
}
```

---

#### Q30: How do getter decorators differ from setter decorators in Stage 3?
**Answer:**
- `getter`: `context.kind === 'getter'`. Receives `target: () => Return`.
- `setter`: `context.kind === 'setter'`. Receives `target: (value: Value) => void`.

---

#### Q31: How do you type a Stage 3 decorator that works on both getters and setters?
**Answer:**
Use a union of `ClassGetterDecoratorContext` and `ClassSetterDecoratorContext`.

---

#### Q32: What is the `ClassAccessorDecoratorTarget` interface?
**Answer:**
The target passed to an auto-accessor decorator:
```typescript
interface ClassAccessorDecoratorTarget<This, Value> {
  get: (this: This) => Value;
  set: (this: This, value: Value) => void;
}
```

---

#### Q33: What is the `ClassAccessorDecoratorResult` interface?
**Answer:**
The optional replacement object returned by an auto-accessor decorator:
```typescript
interface ClassAccessorDecoratorResult<This, Value> {
  get?: (this: This) => Value;
  set?: (this: This, value: Value) => void;
  init?: (this: This, value: Value) => Value;
}
```

---

#### Q34: How do you make an auto-accessor property readonly using a decorator?
**Answer:**
Return a replacement setter that throws an error:

```typescript
function readonlyAccessor<This, Value>(
  target: ClassAccessorDecoratorTarget<This, Value>,
  context: ClassAccessorDecoratorContext<This, Value>
): ClassAccessorDecoratorResult<This, Value> {
  return {
    set(this: This, _val: Value) {
      throw new Error(`Cannot modify readonly accessor: ${String(context.name)}`);
    }
  };
}
```

---

#### Q35: How does `context.access.get` provide direct property access?
**Answer:**
`context.access.get(instance)` invokes the underlying getter for the decorated member, even if the member is private (`#field`)!

---

#### Q36: Can `context.access` read private `#fields` from external code?
**Answer:**
Yes! If a decorator stores `context.access.get` in an external registry, that registry can read private fields on instances of that class without syntax errors.

---

#### Q37: How do you write a decorator that marks a class as an OpenAPI Controller?
**Answer:**
Store route metadata on `context.metadata`:

```typescript
function controller(prefix: string) {
  return function <T extends abstract new (...args: any[]) => any>(
    target: T,
    context: ClassDecoratorContext<T>
  ) {
    context.metadata.routePrefix = prefix;
  };
}
```

---

#### Q38: How do you write an HTTP `@get(path)` route decorator?
**Answer:**
```typescript
function get(path: string) {
  return function <This, Args extends any[], Return>(
    target: (this: This, ...args: Args) => Return,
    context: ClassMethodDecoratorContext<This, (this: This, ...args: Args) => Return>
  ) {
    if (!context.metadata.routes) context.metadata.routes = [];
    (context.metadata.routes as any[]).push({ method: "GET", path, handler: context.name });
  };
}
```

---

#### Q39: What is the performance impact of Stage 3 decorators compared to legacy decorators?
**Answer:**
Stage 3 decorators execute faster because they integrate directly into native VM class evaluation instead of executing through external polyfill monkey-patching.

---

#### Q40: Can you decorate static auto-accessors?
**Answer:**
Yes. In static auto-accessors, `context.static === true`, and `this` refers to the constructor rather than an instance.

---

#### Q41: How do you enforce that a decorator is ONLY applied to methods, not fields or classes?
**Answer:**
By constraining the `context` parameter to `ClassMethodDecoratorContext`:
```typescript
function methodOnly(target: Function, context: ClassMethodDecoratorContext) {}
```

---

#### Q42: What happens if you apply `methodOnly` to a field in TypeScript?
**Answer:**
TypeScript flags compile error `TS1270: Decorator function return type is not assignable to type of target member`.

---

#### Q43: How do you write a `@clamp(min, max)` auto-accessor decorator for numeric properties?
**Answer:**
```typescript
function clamp(min: number, max: number) {
  return function <This, Value extends number>(
    target: ClassAccessorDecoratorTarget<This, Value>,
    context: ClassAccessorDecoratorContext<This, Value>
  ): ClassAccessorDecoratorResult<This, Value> {
    return {
      set(this: This, val: Value) {
        const clamped = Math.max(min, Math.min(max, val)) as Value;
        target.set.call(this, clamped);
      },
      init(this: This, val: Value) {
        return Math.max(min, Math.min(max, val)) as Value;
      }
    };
  };
}
```

---

#### Q44: Can decorators modify the TypeScript type of the decorated target?
**Answer:**
No! Decorators cannot alter the compile-time type signature of the member they decorate. They can only return an implementation conforming to the existing type.

---

#### Q45: How do you combine Stage 3 decorators with `Disposable` (`using`)?
**Answer:**
A class decorator can wrap the constructor to attach `[Symbol.dispose]` if not already implemented.


---

## 3. 90 Real-World Technical Interview Q&As (Part 2: Q46–Q90)

---

#### Q46: How do you design an IoC Container using native Stage 3 Decorator Metadata?
**Answer:**
1. Store dependency injection tokens on `context.metadata`.
2. The container reads `Constructor[Symbol.metadata]` during `.resolve()`.
3. Auto-accessors are populated with resolved dependencies:

```typescript
(Symbol as any).metadata ??= Symbol("Symbol.metadata");
const INJECTIONS = Symbol("INJECTIONS");

function inject(token: string) {
  return function (target: any, context: ClassAccessorDecoratorContext) {
    if (!context.metadata[INJECTIONS]) context.metadata[INJECTIONS] = new Map();
    (context.metadata[INJECTIONS] as Map<any, any>).set(context.name, token);
    return target;
  };
}
```

---

#### Q47: How does a Singleton lifecycle work in a custom IoC container?
**Answer:**
The container checks an internal `instances: Map<Token, any>` cache. If an instance already exists, it returns it; otherwise, it instantiates the target, caches it, and returns it.

---

#### Q48: How does a Transient lifecycle work in an IoC container?
**Answer:**
The container instantiates a brand new instance every time `.resolve(token)` is invoked.

---

#### Q49: How do you detect circular dependencies in an IoC Container?
**Answer:**
Maintain a `resolvingSet: Set<Token>` during recursive resolution. If `resolvingSet.has(token)` is true, throw `CircularDependencyError`:

```typescript
if (this.resolvingSet.has(token)) {
  throw new Error(`Circular dependency detected on token: ${String(token)}`);
}
this.resolvingSet.add(token);
try {
  return this.instantiate(token);
} finally {
  this.resolvingSet.delete(token);
}
```

---

#### Q50: How do you support Hierarchical / Scoped IoC Containers (Parent/Child containers)?
**Answer:**
A child container holds a reference to its `parent`. When resolving a token, if not found locally, it delegates up to `parent.resolve(token)`. Scoped services live in the child container and are garbage-collected when the child container is disposed.

---

#### Q51: How do you automatically dispose Scoped services using `[Symbol.asyncDispose]`?
**Answer:**
Implement `AsyncDisposable` on the scoped container. When an HTTP request completes, `await using scope = rootContainer.createScope();` automatically tears down all database handles and open sockets in that scope.

---

#### Q52: How do you write an `@auditLog` method decorator?
**Answer:**
Record invocation timestamps, actor IDs, and parameters before and after execution:

```typescript
function auditLog(actionName: string) {
  return function <This, Args extends any[], Return>(
    target: (this: This, ...args: Args) => Promise<Return>,
    context: ClassMethodDecoratorContext<This, (this: This, ...args: Args) => Promise<Return>>
  ) {
    return async function (this: This, ...args: Args): Promise<Return> {
      console.log(`[AUDIT START] Action: ${actionName}, Time: ${new Date().toISOString()}`);
      try {
        const result = await target.call(this, ...args);
        console.log(`[AUDIT SUCCESS] Action: ${actionName}`);
        return result;
      } catch (err) {
        console.error(`[AUDIT FAILURE] Action: ${actionName}, Error:`, err);
        throw err;
      }
    };
  };
}
```

---

#### Q53: How do you write an `@authorized(roles)` security decorator?
**Answer:**
Check the caller's context permissions before allowing the target method to execute:

```typescript
function authorized(...requiredRoles: string[]) {
  return function <This extends { currentUser?: { roles: string[] } }, Args extends any[], Return>(
    target: (this: This, ...args: Args) => Return,
    context: ClassMethodDecoratorContext<This, (this: This, ...args: Args) => Return>
  ) {
    return function (this: This, ...args: Args): Return {
      const user = this.currentUser;
      if (!user || !requiredRoles.some((r) => user.roles.includes(r))) {
        throw new Error(`Unauthorized: Requires roles [${requiredRoles.join(", ")}]`);
      }
      return target.call(this, ...args);
    };
  };
}
```

---

#### Q54: How do you write a `@transactional()` decorator for database operations?
**Answer:**
Wrap the method in a database transaction boundary, committing on success and rolling back on error:

```typescript
interface HasDbClient {
  db: { begin(): Promise<any>; commit(): Promise<void>; rollback(): Promise<void> };
}

function transactional() {
  return function <This extends HasDbClient, Args extends any[], Return>(
    target: (this: This, ...args: Args) => Promise<Return>,
    context: ClassMethodDecoratorContext<This, (this: This, ...args: Args) => Promise<Return>>
  ) {
    return async function (this: This, ...args: Args): Promise<Return> {
      await this.db.begin();
      try {
        const result = await target.call(this, ...args);
        await this.db.commit();
        return result;
      } catch (err) {
        await this.db.rollback();
        throw err;
      }
    };
  };
}
```

---

#### Q55: How do you write a `@cacheEvict(keys)` decorator?
**Answer:**
Clear specified cache entries whenever the target mutating method executes successfully:

```typescript
function cacheEvict(cacheMap: Map<string, any>, keyExtractor: (...args: any[]) => string) {
  return function <This, Args extends any[], Return>(
    target: (this: This, ...args: Args) => Promise<Return>,
    context: ClassMethodDecoratorContext<This, (this: This, ...args: Args) => Promise<Return>>
  ) {
    return async function (this: This, ...args: Args): Promise<Return> {
      const res = await target.call(this, ...args);
      const cacheKey = keyExtractor(...args);
      cacheMap.delete(cacheKey);
      return res;
    };
  };
}
```

---

#### Q56: How do you auto-register event handlers using `@onEvent(eventName)` and `context.addInitializer`?
**Answer:**
```typescript
interface GlobalEventHub {
  on(event: string, handler: Function): void;
}
declare const eventHub: GlobalEventHub;

function onEvent(event: string) {
  return function <This, Args extends any[], Return>(
    target: (this: This, ...args: Args) => Return,
    context: ClassMethodDecoratorContext<This, (this: This, ...args: Args) => Return>
  ) {
    context.addInitializer(function (this: This) {
      eventHub.on(event, target.bind(this));
    });
  };
}
```

---

#### Q57: How do you extract an OpenAPI route table from decorated controller classes?
**Answer:**
Read `Constructor[Symbol.metadata]` to inspect route prefixes and handler endpoint mappings:

```typescript
function extractOpenApiSpec(controllers: any[]) {
  const spec: Record<string, any> = { paths: {} };
  for (const ctor of controllers) {
    const meta = ctor[Symbol.metadata];
    if (meta?.routePrefix && meta?.routes) {
      for (const route of meta.routes) {
        const fullPath = `${meta.routePrefix}${route.path}`;
        spec.paths[fullPath] = { [route.method.toLowerCase()]: { operationId: String(route.handler) } };
      }
    }
  }
  return spec;
}
```

---

#### Q58: Can a method decorator decorate an `async *` generator method?
**Answer:**
Yes. The decorator wraps the generator function and returns an asynchronous generator.

---

#### Q59: How do you prevent double-initialization bugs in `context.addInitializer`?
**Answer:**
Use an internal `WeakSet` instance tracker to guarantee that instance initialization logic runs exactly once per instance:

```typescript
const initializedInstances = new WeakSet();

function onceInit(target: any, context: ClassMethodDecoratorContext) {
  context.addInitializer(function () {
    if (!initializedInstances.has(this)) {
      initializedInstances.add(this);
      // Run one-time setup
    }
  });
}
```

---

#### Q60: How does `context.access.set` allow decorators to modify `#private` fields?
**Answer:**
`context.access.set(instance, newValue)` uses the engine's internal private name slot binding, allowing the decorator to update private fields without runtime syntax errors.

---

#### Q61: What is the performance impact of auto-accessors compared to plain fields in V8?
**Answer:**
Auto-accessors require getter/setter invocations through function calls. In performance-critical loops running millions of operations, plain fields are faster unless V8's TurboFan inlines the auto-accessor.

---

#### Q62: How do you write a `@rateLimited(maxRequests, intervalMs)` method decorator?
**Answer:**
Track timestamps in an array or sliding window inside the decorator closure:

```typescript
function rateLimited(maxRequests: number, intervalMs: number) {
  return function <This, Args extends any[], Return>(
    target: (this: This, ...args: Args) => Return,
    context: ClassMethodDecoratorContext<This, (this: This, ...args: Args) => Return>
  ) {
    const timestamps: number[] = [];
    return function (this: This, ...args: Args): Return {
      const now = Date.now();
      while (timestamps.length > 0 && timestamps[0] <= now - intervalMs) {
        timestamps.shift();
      }
      if (timestamps.length >= maxRequests) {
        throw new Error(`RateLimitExceeded on ${String(context.name)}`);
      }
      timestamps.push(now);
      return target.call(this, ...args);
    };
  };
}
```

---

#### Q63: How do modern bundlers (esbuild, SWC, Vite) compile Stage 3 decorators?
**Answer:**
If the build target is `ESNext` or `Node 22+`, they emit native decorator expressions. For older targets, they lower decorators into standard runtime helper functions (`__esDecorate`, `__runInitializers`).

---

#### Q64: How do you write a decorator that wraps methods in an OpenTelemetry span?
**Answer:**
```typescript
function traceSpan(spanName: string) {
  return function <This, Args extends any[], Return>(
    target: (this: This, ...args: Args) => Promise<Return>,
    context: ClassMethodDecoratorContext<This, (this: This, ...args: Args) => Promise<Return>>
  ) {
    return async function (this: This, ...args: Args): Promise<Return> {
      console.log(`[TRACE] Start Span: ${spanName}`);
      try {
        return await target.call(this, ...args);
      } finally {
        console.log(`[TRACE] End Span: ${spanName}`);
      }
    };
  };
}
```

---

#### Q65: How do you decorate a static method in Stage 3?
**Answer:**
The decorator checks `context.static === true`. The `this` parameter is typed as the constructor function:

```typescript
function staticMethodDec<This extends Function, Args extends any[], Return>(
  target: (this: This, ...args: Args) => Return,
  context: ClassMethodDecoratorContext<This, (this: This, ...args: Args) => Return>
) {
  if (!context.static) throw new Error("Must be static");
  return target;
}
```

---

#### Q66: Can a class decorator add new methods to a class instance that TypeScript recognizes at compile time?
**Answer:**
No! In TypeScript, decorators cannot mutate the compile-time type shape of a class. To add methods that are visible to TypeScript's type checker, you must use **Mixins** rather than decorators.

---

#### Q67: How do you enforce Idempotency on payment endpoints using a decorator?
**Answer:**
```typescript
const processedKeys = new Set<string>();

function idempotent(keyArgIndex: number = 0) {
  return function <This, Args extends any[], Return>(
    target: (this: This, ...args: Args) => Promise<Return>,
    context: ClassMethodDecoratorContext<This, (this: This, ...args: Args) => Promise<Return>>
  ) {
    return async function (this: This, ...args: Args): Promise<Return> {
      const key = String(args[keyArgIndex]);
      if (processedKeys.has(key)) {
        throw new Error(`Duplicate request with idempotency key: ${key}`);
      }
      processedKeys.add(key);
      return target.call(this, ...args);
    };
  };
}
```

---

#### Q68: How do you write a decorator that catches errors and returns a `Result<T, E>` monad?
**Answer:**
```typescript
function asResult() {
  return function <This, Args extends any[], Return>(
    target: (this: This, ...args: Args) => Promise<Return>,
    context: ClassMethodDecoratorContext<This, (this: This, ...args: Args) => Promise<Return>>
  ) {
    return async function (this: This, ...args: Args): Promise<Result<Return, Error>> {
      try {
        const val = await target.call(this, ...args);
        return ok(val);
      } catch (err) {
        return err(err instanceof Error ? err : new Error(String(err)));
      }
    };
  };
}
```

---

#### Q69: What is the difference between `@injectable()` and `@singleton()`?
**Answer:**
- `@injectable()`: Marks a class as eligible for IoC resolution. Defaults to transient lifecycle.
- `@singleton()`: Marks a class to be instantiated once and reused for all subsequent resolutions.

---

#### Q70: How do you write a field decorator that automatically initializes a property to an empty array?
**Answer:**
```typescript
function defaultList<This, Value extends any[]>(
  target: undefined,
  context: ClassFieldDecoratorContext<This, Value>
) {
  return function (initialValue: Value): Value {
    return (initialValue ?? []) as Value;
  };
}
```

---

#### Q71: How do you unit test a class decorated with `@retry`?
**Answer:**
Instantiate the class and invoke the method with a mock service that fails twice before succeeding, asserting that 3 total invocations occurred.

---

#### Q72: How do you mock dependencies resolved by an IoC container in unit tests?
**Answer:**
Re-bind the token in the container to a mock implementation before calling `.resolve()`:
`container.bind(DatabaseToken, MockDatabase);`

---

#### Q73: What is the parameter decorator proposal status in TC39?
**Answer:**
Parameter decorators are currently an independent Stage 1/2 proposal. They will eventually allow decorating method parameters directly once standardized.

---

#### Q74: How do you prevent prototype pollution when storing metadata on `context.metadata`?
**Answer:**
Use `Symbol` keys or namespaced objects rather than generic string keys on `context.metadata`.

---

#### Q75: How do decorators interact with the `override` keyword?
**Answer:**
`override` works identically on decorated methods, verifying that the base class contains the member.

---

#### Q76: Can you apply decorators to abstract classes and abstract methods?
**Answer:**
Abstract classes can be decorated with class decorators. Abstract methods cannot be decorated with method decorators because abstract methods have no runtime function implementation to wrap.

---

#### Q77: How do you write a `@timeout(ms)` method decorator?
**Answer:**
```typescript
function timeout(ms: number) {
  return function <This, Args extends any[], Return>(
    target: (this: This, ...args: Args) => Promise<Return>,
    context: ClassMethodDecoratorContext<This, (this: This, ...args: Args) => Promise<Return>>
  ) {
    return async function (this: This, ...args: Args): Promise<Return> {
      let timer: any;
      const timeoutPromise = new Promise<never>((_, reject) => {
        timer = setTimeout(() => reject(new Error(`Operation timed out after ${ms}ms`)), ms);
      });
      try {
        return await Promise.race([target.call(this, ...args), timeoutPromise]);
      } finally {
        clearTimeout(timer);
      }
    };
  };
}
```

---

#### Q78: How do you write a `@clamp` decorator on an auto-accessor that enforces min/max bounds?
**Answer:**
Intercept `set` and `init` in `ClassAccessorDecoratorResult` and apply `Math.min`/`Math.max`.

---

#### Q79: Can a decorator access other methods of the instance?
**Answer:**
Yes. Inside the replacement method, `this` refers to the instance, so `this.otherMethod()` can be invoked freely.

---

#### Q80: How do you preserve method function names and arity in decorated methods?
**Answer:**
Assign `Object.defineProperty(replacement, 'name', { value: target.name })` and configure `length` to match `target.length`.

---

#### Q81: How do you decorate a getter to automatically cache its return value on the instance?
**Answer:**
```typescript
function lazyGetter<This extends object, Return>(
  target: (this: This) => Return,
  context: ClassGetterDecoratorContext<This, Return>
) {
  return function (this: This): Return {
    const value = target.call(this);
    Object.defineProperty(this, context.name, {
      value,
      writable: false,
      configurable: true,
    });
    return value;
  };
}
```

---

#### Q82: How does `lazyGetter` optimize property access?
**Answer:**
The first read executes the getter and overwrites the getter on the instance with a plain data property (`Object.defineProperty`). All subsequent reads are direct property lookups with zero function overhead!

---

#### Q83: What is the difference between decorating a class field vs an auto-accessor?
**Answer:**
- Field decorator: Runs once at property initialization; cannot intercept later writes or reads.
- Auto-accessor: Synthesizes getters and setters; intercepts every read (`get`) and write (`set`) throughout the object's lifetime.

---

#### Q84: How do you write an `@immutable` class decorator?
**Answer:**
```typescript
function immutable<T extends new (...args: any[]) => any>(
  target: T,
  context: ClassDecoratorContext<T>
) {
  context.addInitializer(function (this: any) {
    Object.freeze(this);
  });
}
```

---

#### Q85: What happens if an auto-accessor setter throws during construction?
**Answer:**
The constructor terminates immediately, throwing that error, and instance construction fails.

---

#### Q86: Can you compose multiple method decorators?
**Answer:**
Yes. `@timed @logged @retry(3) async method() {}`. They execute from bottom to top: `@retry` wraps `method`, `@logged` wraps that, and `@timed` wraps the outermost layer.

---

#### Q87: How do you write a decorator that intercepts constructor arguments?
**Answer:**
Return a new subclass from a class decorator and intercept `...args` inside its constructor before calling `super(...args)`.

---

#### Q88: How do you type an auto-accessor decorator that works with any property type?
**Answer:**
Use generics: `<This, Value>(target: ClassAccessorDecoratorTarget<This, Value>, context: ClassAccessorDecoratorContext<This, Value>)`.

---

#### Q89: How do you verify that an IoC container does not leak memory in long-running services?
**Answer:**
Profile heap snapshots in Node.js to ensure Scoped child containers and transient instances are garbage-collected after requests finish.

---

#### Q90: Why are TC39 Stage 3 Decorators the definitive future of TypeScript metaprogramming?
**Answer:**
They standardize decorators directly into the ECMAScript runtime specification, eliminate external polyfill libraries (`reflect-metadata`), provide native `Symbol.metadata` reflection, and deliver 100% type safety and private field compatibility.


---

## 4. Output Prediction Puzzles (15 Puzzles with Step-by-Step Traces)

Test your mental model of TC39 Stage 3 decorator evaluation and execution order, auto-accessor desugaring, `context.metadata` prototype linkage, and IoC resolution.

---

### Puzzle 1: Evaluation vs Execution Order of Composed Decorators

```typescript
const trace: string[] = [];

function decA() {
  trace.push("Evaluate A");
  return (target: any, context: any) => { trace.push("Execute A"); };
}

function decB() {
  trace.push("Evaluate B");
  return (target: any, context: any) => { trace.push("Execute B"); };
}

class Sample {
  @decA()
  @decB()
  public run(): void {}
}

// Question: What is the sequence in 'trace'?
```

**Step-by-Step Evaluation Trace:**
1. Decorator expressions evaluate in top-to-bottom definition order:
   - `decA()` evaluates -> pushes `"Evaluate A"`.
   - `decB()` evaluates -> pushes `"Evaluate B"`.
2. The resulting decorator functions execute in **reverse (inside-out / bottom-up)** order:
   - Inner decorator (`decB` return) executes -> pushes `"Execute B"`.
   - Outer decorator (`decA` return) executes -> pushes `"Execute A"`.
3. **Output Sequence:**
   ```javascript
   [
     "Evaluate A",
     "Evaluate B",
     "Execute B",
     "Execute A"
   ]
   ```

---

### Puzzle 2: Field Decorator Target Parameter

```typescript
let capturedTarget: any = "NOT_CAPTURED";

function inspectField(target: any, context: ClassFieldDecoratorContext) {
  capturedTarget = target;
}

class Example {
  @inspectField
  public count: number = 42;
}

// Question: What is the value of 'capturedTarget'?
```

**Step-by-Step Evaluation Trace:**
1. In TC39 Stage 3, class field properties do not exist on the prototype during class definition time.
2. The specification explicitly dictates that for `kind: 'field'`, the first parameter (`target`) is always `undefined`.
3. `capturedTarget` is assigned `undefined`.
4. **Output Value:** `undefined`.

---

### Puzzle 3: Auto-Accessor `init` vs `set` During Construction

```typescript
const operations: string[] = [];

function trackAccessor<This, Value>(
  target: ClassAccessorDecoratorTarget<This, Value>,
  context: ClassAccessorDecoratorContext<This, Value>
): ClassAccessorDecoratorResult<This, Value> {
  return {
    init(this: This, val: Value) {
      operations.push(`Init: ${val}`);
      return val;
    },
    set(this: This, val: Value) {
      operations.push(`Set: ${val}`);
      target.set.call(this, val);
    }
  };
}

class User {
  @trackAccessor
  accessor score: number = 100;
}

const u = new User();
u.score = 200;
```

**Step-by-Step Evaluation Trace:**
1. When `new User()` runs, the initial field assignment (`score: number = 100`) executes the `init` hook, NOT the `set` hook!
2. Pushes `"Init: 100"`.
3. Later, `u.score = 200` executes the `set` hook.
4. Pushes `"Set: 200"`.
5. **Output Sequence:**
   ```javascript
   [
     "Init: 100",
     "Set: 200"
   ]
   ```

---

### Puzzle 4: `context.metadata` Inheritance Across Subclasses

```typescript
(Symbol as any).metadata ??= Symbol("Symbol.metadata");

function markRole(role: string) {
  return function (target: any, context: ClassDecoratorContext) {
    context.metadata.role = role;
  };
}

@markRole("BASE_ROLE")
class ParentService {}

class ChildService extends ParentService {}

const parentMeta = (ParentService as any)[Symbol.metadata];
const childMeta = (ChildService as any)[Symbol.metadata];

// Case A: childMeta.role
// Case B: childMeta === parentMeta
```

**Step-by-Step Evaluation Trace:**
1. `ParentService` stores `role = "BASE_ROLE"` on its `Symbol.metadata` object.
2. In TypeScript 5.2+, when `ChildService extends ParentService`, TypeScript links `ChildService[Symbol.metadata]` to `ParentService[Symbol.metadata]` via `Object.create(ParentService[Symbol.metadata])`.
3. In Case A: `childMeta.role` resolves up the prototype chain to `"BASE_ROLE"`.
4. In Case B: `childMeta` is a distinct object inheriting from `parentMeta` (`childMeta.__proto__ === parentMeta`). They are not reference equal (`!==`).
5. **Output Values:** Case A = `"BASE_ROLE"`, Case B = `false`.

---

### Puzzle 5: `addInitializer` Timing on Class vs Method Decorators

```typescript
const events: string[] = [];

function classInit(target: any, context: ClassDecoratorContext) {
  context.addInitializer(() => { events.push("Class Initializer"); });
}

function methodInit(target: any, context: ClassMethodDecoratorContext) {
  context.addInitializer(function () { events.push("Method Initializer"); });
}

@classInit
class Demo {
  @methodInit
  public test() {}
}

events.push("Before Instantiation");
new Demo();
```

**Step-by-Step Evaluation Trace:**
1. Class definition phase:
   - Method decorator runs; registers method initializer.
   - Class decorator runs; registers class initializer.
   - The class initializer runs **immediately** as the class definition finalizes -> pushes `"Class Initializer"`.
2. `"Before Instantiation"` is pushed.
3. `new Demo()` runs:
   - Inside the instance constructor, method initializers execute -> pushes `"Method Initializer"`.
4. **Output Sequence:**
   ```javascript
   [
     "Class Initializer",
     "Before Instantiation",
     "Method Initializer"
   ]
   ```

---

### Puzzle 6: Autobind Method Extraction

```typescript
function autobind<This, Args extends any[], Return>(
  target: (this: This, ...args: Args) => Return,
  context: ClassMethodDecoratorContext<This, (this: This, ...args: Args) => Return>
) {
  const name = context.name;
  context.addInitializer(function (this: This) {
    (this as any)[name] = target.bind(this);
  });
}

class Greeter {
  public greeting: string = "Hello World";

  @autobind
  public greet(): string {
    return this.greeting;
  }
}

const g = new Greeter();
const extractedFn = g.greet;
const output = extractedFn();
// Question: What is 'output'?
```

**Step-by-Step Evaluation Trace:**
1. `context.addInitializer` executes when `new Greeter()` runs.
2. It assigns an own property `greet` bound to `g` (`target.bind(this)`).
3. `extractedFn` points to the bound method.
4. When called unbound (`extractedFn()`), `this` remains permanently bound to `g`.
5. Returns `"Hello World"`.
6. **Output Value:** `"Hello World"`.

---

### Puzzle 7: Lazy Getter Property Redefinition

```typescript
let computations = 0;

function lazy<This extends object, Return>(
  target: (this: This) => Return,
  context: ClassGetterDecoratorContext<This, Return>
) {
  return function (this: This): Return {
    computations++;
    const result = target.call(this);
    Object.defineProperty(this, context.name, {
      value: result,
      writable: false,
    });
    return result;
  };
}

class HeavyCalculation {
  @lazy
  get factor(): number {
    return 100 * 2;
  }
}

const calc = new HeavyCalculation();
const a = calc.factor;
const b = calc.factor;
const c = calc.factor;
// Question: What is computations and the value of c?
```

**Step-by-Step Evaluation Trace:**
1. First read `calc.factor`: executes decorated getter. Increments `computations = 1`. Evaluates `100 * 2 = 200`.
2. `Object.defineProperty` overwrites `factor` on `calc` with data property `{ value: 200 }`. Returns `200`.
3. Second and third reads: `calc.factor` directly reads the instance data property `200`. The getter function is never called again!
4. **Output Values:** `computations = 1`, `c = 200`.

---

### Puzzle 8: Circular Dependency Detection in IoC Container

```typescript
const container = new NativeIoCContainer();

class ServiceA {
  accessor b: any;
}
class ServiceB {
  accessor a: any;
}

container.bind("A", ServiceA);
container.bind("B", ServiceB);

// Simulate mutual circular resolution
// container.resolve("A") -> resolves "B" -> resolves "A"
```

**Step-by-Step Evaluation Trace:**
1. The container attempts to resolve `"A"`. Adds `"A"` to `resolvingTokens`.
2. Instantiates `ServiceA`, finds dependency `"B"`.
3. Resolves `"B"`. Adds `"B"` to `resolvingTokens`.
4. Instantiates `ServiceB`, finds dependency `"A"`.
5. Resolves `"A"`. Checks `resolvingTokens.has("A")` -> `true`!
6. Throws `CircularDependencyError: Cycle detected while resolving: A`.
7. **Result:** Fast-fails with descriptive circular dependency error.

---

### Puzzle 9: Decorating Private `#methods`

```typescript
function spy(target: Function, context: ClassMethodDecoratorContext) {
  return function (this: any, ...args: any[]) {
    return `SPY_${target.call(this, ...args)}`;
  };
}

class SecretEngine {
  @spy
  #computeCode(): number {
    return 999;
  }

  public getCode(): string {
    return this.#computeCode();
  }
}

const engine = new SecretEngine();
const code = engine.getCode();
// Question: What is code?
```

**Step-by-Step Evaluation Trace:**
1. Stage 3 decorators can decorate `#private` methods cleanly.
2. `spy` wraps `#computeCode`.
3. Inside `getCode()`, `this.#computeCode()` calls the wrapped method.
4. The wrapper executes: `999` is computed, prepended with `"SPY_"`.
5. Returns `"SPY_999"`.
6. **Output Value:** `"SPY_999"`.

---

### Puzzle 10: Auto-Accessor Range Clamping

```typescript
function clamp(min: number, max: number) {
  return function <This, Value extends number>(
    target: ClassAccessorDecoratorTarget<This, Value>,
    context: ClassAccessorDecoratorContext<This, Value>
  ): ClassAccessorDecoratorResult<This, Value> {
    return {
      init(this: This, val: Value) {
        return Math.max(min, Math.min(max, val)) as Value;
      },
      set(this: This, val: Value) {
        target.set.call(this, Math.max(min, Math.min(max, val)) as Value);
      }
    };
  };
}

class Thermostat {
  @clamp(15, 30)
  accessor temperature: number = 10;
}

const t = new Thermostat();
const initialTemp = t.temperature;
t.temperature = 45;
const highTemp = t.temperature;
```

**Step-by-Step Evaluation Trace:**
1. `init` hook clamps initial `10` between `[15, 30]` -> `15`. `initialTemp = 15`.
2. Setting `temperature = 45` triggers `set` hook. Clamps `45` between `[15, 30]` -> `30`.
3. `highTemp = 30`.
4. **Output Values:** `initialTemp = 15`, `highTemp = 30`.

---

### Puzzle 11: Class Decorator Returning Replacement Subclass

```typescript
function withId<T extends new (...args: any[]) => any>(
  target: T,
  context: ClassDecoratorContext<T>
) {
  return class extends target {
    public generatedId: string = "AUTO_ID_007";
  };
}

@withId
class Customer {
  public name: string = "Alice";
}

const c: any = new Customer();
// Question: What properties exist on c?
```

**Step-by-Step Evaluation Trace:**
1. `withId` returns an anonymous subclass extending `Customer`.
2. When `new Customer()` executes, the returned subclass constructor runs.
3. Initializes `name = "Alice"` via `super()`, then initializes `generatedId = "AUTO_ID_007"`.
4. **Output Properties:** `c.name = "Alice"`, `c.generatedId = "AUTO_ID_007"`.

---

### Puzzle 12: Method Decorator Mutating Execution Arguments

```typescript
function multiplyArgs(factor: number) {
  return function <This, Args extends number[], Return>(
    target: (this: This, ...args: Args) => Return,
    context: ClassMethodDecoratorContext<This, (this: This, ...args: Args) => Return>
  ) {
    return function (this: This, ...args: Args): Return {
      const transformed = args.map((x) => x * factor) as Args;
      return target.call(this, ...transformed);
    };
  };
}

class Calculator {
  @multiplyArgs(2)
  public add(a: number, b: number): number {
    return a + b;
  }
}

const calc = new Calculator();
const res = calc.add(3, 4);
```

**Step-by-Step Evaluation Trace:**
1. `calc.add(3, 4)` enters `multiplyArgs(2)`.
2. `transformed` multiplies each argument by 2: `[3 * 2, 4 * 2] = [6, 8]`.
3. Invokes original `add(6, 8)`.
4. `6 + 8 = 14`.
5. **Output Value:** `14`.

---

### Puzzle 13: Static Method Decorator Context

```typescript
let isStaticTarget: boolean = false;

function inspectStatic(target: any, context: ClassMethodDecoratorContext) {
  isStaticTarget = context.static;
}

class Utils {
  @inspectStatic
  public static helper(): void {}
}
```

**Step-by-Step Evaluation Trace:**
1. `helper` is declared with `static`.
2. The Stage 3 compiler sets `context.static = true`.
3. `isStaticTarget` is assigned `true`.
4. **Output Value:** `isStaticTarget = true`.

---

### Puzzle 14: Method Decorator Throw Catching and Recovery

```typescript
function recoverWith(fallback: string) {
  return function <This, Args extends any[], Return>(
    target: (this: This, ...args: Args) => Return,
    context: ClassMethodDecoratorContext<This, (this: This, ...args: Args) => Return>
  ) {
    return function (this: This, ...args: Args): any {
      try {
        return target.call(this, ...args);
      } catch (err) {
        return fallback;
      }
    };
  };
}

class FlakyService {
  @recoverWith("FALLBACK_VALUE")
  public riskyOperation(): string {
    throw new Error("Network timeout");
  }
}

const service = new FlakyService();
const result = service.riskyOperation();
```

**Step-by-Step Evaluation Trace:**
1. `riskyOperation()` throws `new Error("Network timeout")`.
2. The decorator wrapper's `try...catch` catches the error.
3. Instead of rethrowing, it returns `fallback` (`"FALLBACK_VALUE"`).
4. **Output Value:** `"FALLBACK_VALUE"`.

---

### Puzzle 15: Field Decorator Default Fallback Assignment

```typescript
function defaultTo<This, Value>(fallback: Value) {
  return function (target: undefined, context: ClassFieldDecoratorContext<This, Value>) {
    return function (initialValue: Value): Value {
      return initialValue === undefined ? fallback : initialValue;
    };
  };
}

class Profile {
  @defaultTo("active")
  public status!: string;
}

const p = new Profile();
const statusVal = p.status;
```

**Step-by-Step Evaluation Trace:**
1. `status` has no inline assignment, so its uninitialized value is `undefined`.
2. The field decorator's initializer function receives `undefined`.
3. Checks `initialValue === undefined ? "active" : initialValue`.
4. Returns `"active"`.
5. **Output Value:** `"active"`.


---

## 5. Four Complete Runnable Production Projects with Test Assertions

Every project below is a fully functional, self-contained TypeScript engine demonstrating production TC39 Stage 3 decorators and metadata. All class properties are explicitly declared for strict Node.js compatibility (`--experimental-strip-types`).

---

### Project 1: Production TC39 Stage 3 Inversion of Control (IoC) Container

#### Architectural Overview
```
+-------------------------------------------------------------------------+
|                  TC39 Stage 3 Native IoC Container                     |
+-------------------------------------------------------------------------+
|  [IoCContainer]                                                         |
|    ├── bind(token, constructor, lifetime)                              |
|    ├── resolve(token): T                                                |
|    └── Detects cycles in dependency graph using resolvingTokens Set     |
|         │                                                               |
|  [@injectable(lifetime)] ──► Annotates class metadata                   |
|  [@inject(token)] ──► Annotates auto-accessors with dependencies        |
+-------------------------------------------------------------------------+
```

#### Complete Implementation & Verification Suite
```typescript
import assert from "node:assert";

(Symbol as any).metadata ??= Symbol("Symbol.metadata");

export type ServiceLifetime = "singleton" | "transient";
export type ServiceToken<T = any> = string | symbol;

interface Registration<T = any> {
  token: ServiceToken<T>;
  target: new (...args: any[]) => T;
  lifetime: ServiceLifetime;
  instance?: T;
}

const INJECTIONS_KEY = Symbol("IoC:Injections");

export function injectable(lifetime: ServiceLifetime = "transient") {
  return function <TFunction extends new (...args: any[]) => any>(
    target: TFunction,
    context: ClassDecoratorContext<TFunction>
  ) {
    context.metadata.lifetime = lifetime;
  };
}

export function inject(token: ServiceToken) {
  return function <This, Value>(
    target: ClassAccessorDecoratorTarget<This, Value>,
    context: ClassAccessorDecoratorContext<This, Value>
  ): ClassAccessorDecoratorResult<This, Value> {
    if (!context.metadata[INJECTIONS_KEY]) {
      context.metadata[INJECTIONS_KEY] = new Map<string | symbol, ServiceToken>();
    }
    (context.metadata[INJECTIONS_KEY] as Map<string | symbol, ServiceToken>).set(
      context.name,
      token
    );
    return target;
  };
}

export class NativeIoCContainer {
  private registrations: Map<ServiceToken, Registration>;
  private resolvingTokens: Set<ServiceToken>;

  constructor() {
    this.registrations = new Map();
    this.resolvingTokens = new Set();
  }

  public bind<T>(
    token: ServiceToken<T>,
    target: new (...args: any[]) => T,
    lifetime: ServiceLifetime = "transient"
  ): this {
    this.registrations.set(token, { token, target, lifetime });
    return this;
  }

  public resolve<T>(token: ServiceToken<T>): T {
    const reg = this.registrations.get(token);
    if (!reg) {
      throw new Error(`IoCResolutionError: No binding found for token: ${String(token)}`);
    }

    if (reg.lifetime === "singleton" && reg.instance) {
      return reg.instance as T;
    }

    if (this.resolvingTokens.has(token)) {
      throw new Error(`CircularDependencyError: Cycle detected while resolving: ${String(token)}`);
    }

    this.resolvingTokens.add(token);

    try {
      const instance = new reg.target();
      const metadata = (reg.target as any)[(Symbol as any).metadata];
      const injections = metadata?.[INJECTIONS_KEY] as Map<string | symbol, ServiceToken> | undefined;

      if (injections) {
        for (const [propName, depToken] of injections.entries()) {
          const resolvedDep = this.resolve(depToken);
          (instance as any)[propName] = resolvedDep;
        }
      }

      if (reg.lifetime === "singleton") {
        reg.instance = instance;
      }

      return instance as T;
    } finally {
      this.resolvingTokens.delete(token);
    }
  }
}

// Verification Assertions
@injectable("singleton")
class LoggerService {
  public logs: string[];
  constructor() {
    this.logs = [];
  }
  public log(msg: string): void {
    this.logs.push(msg);
  }
}

@injectable("transient")
class DatabaseService {
  public isConnected: boolean;
  constructor() {
    this.isConnected = true;
  }
}

@injectable("transient")
class OrderProcessor {
  @inject("Logger")
  accessor logger!: LoggerService;

  @inject("Database")
  accessor db!: DatabaseService;

  public process(orderId: string): string {
    this.logger.log(`Processing order ${orderId}`);
    return `Processed ${orderId} (DB connected: ${this.db.isConnected})`;
  }
}

const container = new NativeIoCContainer()
  .bind("Logger", LoggerService, "singleton")
  .bind("Database", DatabaseService, "transient")
  .bind("OrderProcessor", OrderProcessor, "transient");

const processor1 = container.resolve<OrderProcessor>("OrderProcessor");
const processor2 = container.resolve<OrderProcessor>("OrderProcessor");

// Verify dependency resolution
const result = processor1.process("ORD-101");
assert.strictEqual(result, "Processed ORD-101 (DB connected: true)");
assert.deepStrictEqual(processor1.logger.logs, ["Processing order ORD-101"]);

// Verify Singleton Logger identity across distinct processor instances
assert.strictEqual(processor1.logger, processor2.logger);

// Verify Transient Database creates distinct instances
assert.notStrictEqual(processor1.db, processor2.db);

// Verify Circular Dependency Detection
class NodeA {
  @inject("NodeB")
  accessor b: any;
}
class NodeB {
  @inject("NodeA")
  accessor a: any;
}

const cycleContainer = new NativeIoCContainer()
  .bind("NodeA", NodeA)
  .bind("NodeB", NodeB);

assert.throws(() => {
  cycleContainer.resolve("NodeA");
}, /CircularDependencyError: Cycle detected while resolving: NodeA/);

console.log("Project 1 (Production Stage 3 IoC Container) passed all assertions.");
```

---

### Project 2: Type-Safe Method Interceptor & Telemetry Pipeline Decorators

#### Architectural Overview
```
+-------------------------------------------------------------------------+
|                  Telemetry & Method Interceptor Pipeline                |
+-------------------------------------------------------------------------+
|  [@timed] ──► Measures execution duration                               |
|  [@cached(ttlMs)] ──► In-memory caching layer                           |
|  [@retry(max, delay)] ──► Handles transient exceptions                  |
|         │                                                               |
|  [Execution Flow]: @timed -> @cached -> @retry -> Target Method         |
+-------------------------------------------------------------------------+
```

#### Complete Implementation & Verification Suite
```typescript
import assert from "node:assert";

export interface TelemetrySpan {
  method: string;
  durationMs: number;
}

export const telemetryLog: TelemetrySpan[] = [];

export function timed<This, Args extends any[], Return>(
  target: (this: This, ...args: Args) => Promise<Return>,
  context: ClassMethodDecoratorContext<This, (this: This, ...args: Args) => Promise<Return>>
) {
  const methodName = String(context.name);
  return async function (this: This, ...args: Args): Promise<Return> {
    const start = performance.now();
    try {
      return await target.call(this, ...args);
    } finally {
      telemetryLog.push({ method: methodName, durationMs: performance.now() - start });
    }
  };
}

export function cached(ttlMs: number) {
  const cacheMap = new Map<string, { val: any; exp: number }>();

  return function <This, Args extends any[], Return>(
    target: (this: This, ...args: Args) => Promise<Return>,
    context: ClassMethodDecoratorContext<This, (this: This, ...args: Args) => Promise<Return>>
  ) {
    return async function (this: This, ...args: Args): Promise<Return> {
      const key = JSON.stringify(args);
      const entry = cacheMap.get(key);
      if (entry && Date.now() < entry.exp) {
        return entry.val as Return;
      }
      const fresh = await target.call(this, ...args);
      cacheMap.set(key, { val: fresh, exp: Date.now() + ttlMs });
      return fresh;
    };
  };
}

export function retry(maxRetries: number, delayMs: number = 10) {
  return function <This, Args extends any[], Return>(
    target: (this: This, ...args: Args) => Promise<Return>,
    context: ClassMethodDecoratorContext<This, (this: This, ...args: Args) => Promise<Return>>
  ) {
    return async function (this: This, ...args: Args): Promise<Return> {
      let attempts = 0;
      while (attempts < maxRetries) {
        try {
          return await target.call(this, ...args);
        } catch (err) {
          attempts++;
          if (attempts >= maxRetries) throw err;
          await new Promise((r) => setTimeout(r, delayMs));
        }
      }
      throw new Error("Retry attempts exhausted");
    };
  };
}

// Verification Assertions
class WeatherServiceClient {
  public apiCallCount: number;

  constructor() {
    this.apiCallCount = 0;
  }

  @timed
  @cached(5000)
  public async getTemperature(city: string): Promise<number> {
    this.apiCallCount++;
    return city === "Tokyo" ? 18 : 22;
  }

  @retry(3, 5)
  public async flakyExternalCall(shouldFailTimes: number): Promise<string> {
    this.apiCallCount++;
    if (this.apiCallCount <= shouldFailTimes) {
      throw new Error("Temporary network glitch");
    }
    return "SUCCESS";
  }
}

const client = new WeatherServiceClient();

// Test caching
const temp1 = await client.getTemperature("Tokyo");
const temp2 = await client.getTemperature("Tokyo");

assert.strictEqual(temp1, 18);
assert.strictEqual(temp2, 18);
assert.strictEqual(client.apiCallCount, 1); // Second call served from cache!
assert.strictEqual(telemetryLog.length, 2);

// Test retry
client.apiCallCount = 0;
const retryRes = await client.flakyExternalCall(2); // Fails 2 times, succeeds on 3rd
assert.strictEqual(retryRes, "SUCCESS");
assert.strictEqual(client.apiCallCount, 3);

console.log("Project 2 (Method Interceptor & Telemetry Pipeline) passed all assertions.");
```

---

### Project 3: Type-Safe Enterprise Validation & Auto-Accessor Sanitation Engine

#### Architectural Overview
```
+-------------------------------------------------------------------------+
|                  Auto-Accessor Validation & Sanitation Engine           |
+-------------------------------------------------------------------------+
|  [UserRegistrationDTO]                                                  |
|    ├── @trim() accessor username                                        |
|    ├── @range(18, 120) accessor age                                     |
|    └── @matches(/^[a-z]+@[a-z]+\.[a-z]+$/) accessor email               |
|         │                                                               |
|    (Validates and sanitizes values on both initialization and set)      |
+-------------------------------------------------------------------------+
```

#### Complete Implementation & Verification Suite
```typescript
import assert from "node:assert";

export function trim() {
  return function <This, Value extends string>(
    target: ClassAccessorDecoratorTarget<This, Value>,
    context: ClassAccessorDecoratorContext<This, Value>
  ): ClassAccessorDecoratorResult<This, Value> {
    return {
      init(this: This, val: Value): Value {
        return (val ? val.trim() : val) as Value;
      },
      set(this: This, val: Value): void {
        target.set.call(this, (val ? val.trim() : val) as Value);
      }
    };
  };
}

export function range(min: number, max: number) {
  return function <This, Value extends number>(
    target: ClassAccessorDecoratorTarget<This, Value>,
    context: ClassAccessorDecoratorContext<This, Value>
  ): ClassAccessorDecoratorResult<This, Value> {
    const validate = (val: number) => {
      if (val < min || val > max) {
        throw new Error(`ValidationError: ${String(context.name)} must be between ${min} and ${max}, received ${val}`);
      }
    };

    return {
      init(this: This, val: Value): Value {
        if (val !== undefined) validate(val);
        return val;
      },
      set(this: This, val: Value): void {
        validate(val);
        target.set.call(this, val);
      }
    };
  };
}

export function matches(pattern: RegExp) {
  return function <This, Value extends string>(
    target: ClassAccessorDecoratorTarget<This, Value>,
    context: ClassAccessorDecoratorContext<This, Value>
  ): ClassAccessorDecoratorResult<This, Value> {
    const validate = (val: string) => {
      if (!pattern.test(val)) {
        throw new Error(`ValidationError: ${String(context.name)} does not match pattern ${pattern}`);
      }
    };

    return {
      init(this: This, val: Value): Value {
        if (val !== undefined) validate(val);
        return val;
      },
      set(this: This, val: Value): void {
        validate(val);
        target.set.call(this, val);
      }
    };
  };
}

// Verification Assertions
class UserRegistrationDto {
  @trim()
  accessor username: string;

  @range(18, 99)
  accessor age: number;

  @matches(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)
  accessor email: string;

  constructor(username: string, age: number, email: string) {
    this.username = username;
    this.age = age;
    this.email = email;
  }
}

// Valid instantiation with whitespace trimming
const dto = new UserRegistrationDto("   alice_dev   ", 28, "alice@enterprise.com");
assert.strictEqual(dto.username, "alice_dev");
assert.strictEqual(dto.age, 28);
assert.strictEqual(dto.email, "alice@enterprise.com");

// Dynamic set trimming
dto.username = "   alice_updated   ";
assert.strictEqual(dto.username, "alice_updated");

// Range validation rejection
assert.throws(() => {
  dto.age = 15;
}, /ValidationError: age must be between 18 and 99/);

// Email regex rejection
assert.throws(() => {
  dto.email = "not-an-email";
}, /ValidationError: email does not match pattern/);

console.log("Project 3 (Auto-Accessor Validation Engine) passed all assertions.");
```

---

### Project 4: API Controller Router & OpenAPI Route Metadata Generator

#### Architectural Overview
```
+-------------------------------------------------------------------------+
|                  API Controller Router & OpenAPI Generator              |
+-------------------------------------------------------------------------+
|  [@controller('/api/v1/users')]                                         |
|    ├── @get('/') listUsers()                                            |
|    ├── @get('/:id') getUserById()                                       |
|    └── @post('/') createUser()                                          |
|         │                                                               |
|  [RouterRegistry]                                                       |
|    └── generateOpenApiSpec(): OpenAPI 3.0 Document                      |
+-------------------------------------------------------------------------+
```

#### Complete Implementation & Verification Suite
```typescript
import assert from "node:assert";

(Symbol as any).metadata ??= Symbol("Symbol.metadata");

const ROUTES_KEY = Symbol("Controller:Routes");

export interface RouteDefinition {
  method: "GET" | "POST" | "PUT" | "DELETE";
  path: string;
  handlerName: string | symbol;
}

export function controller(prefix: string) {
  return function <T extends abstract new (...args: any[]) => any>(
    target: T,
    context: ClassDecoratorContext<T>
  ) {
    context.metadata.prefix = prefix.replace(/\/$/, "");
  };
}

function createMethodDecorator(method: "GET" | "POST" | "PUT" | "DELETE") {
  return function (path: string) {
    return function <This, Args extends any[], Return>(
      target: (this: This, ...args: Args) => Return,
      context: ClassMethodDecoratorContext<This, (this: This, ...args: Args) => Return>
    ) {
      if (!context.metadata[ROUTES_KEY]) {
        context.metadata[ROUTES_KEY] = [];
      }
      (context.metadata[ROUTES_KEY] as RouteDefinition[]).push({
        method,
        path: path.startsWith("/") ? path : `/${path}`,
        handlerName: context.name,
      });
    };
  };
}

export const get = createMethodDecorator("GET");
export const post = createMethodDecorator("POST");
export const put = createMethodDecorator("PUT");
export const del = createMethodDecorator("DELETE");

export class OpenApiRouter {
  public static generateSpec(controllers: (new (...args: any[]) => any)[]): Record<string, any> {
    const spec: Record<string, any> = {
      openapi: "3.0.0",
      paths: {},
    };

    for (const Ctrl of controllers) {
      const metadata = (Ctrl as any)[(Symbol as any).metadata];
      const prefix = (metadata?.prefix as string) ?? "";
      const routes = (metadata?.[ROUTES_KEY] as RouteDefinition[]) ?? [];

      for (const route of routes) {
        const fullPath = `${prefix}${route.path}`;
        if (!spec.paths[fullPath]) {
          spec.paths[fullPath] = {};
        }

        spec.paths[fullPath][route.method.toLowerCase()] = {
          operationId: `${Ctrl.name}_${String(route.handlerName)}`,
          responses: {
            "200": { description: "Successful response" },
          },
        };
      }
    }

    return spec;
  }
}

// Verification Assertions
@controller("/api/v1/orders")
class OrderController {
  @get("/")
  public listOrders(): string[] {
    return ["ord_1", "ord_2"];
  }

  @get("/:id")
  public getOrder(): { id: string } {
    return { id: "ord_1" };
  }

  @post("/")
  public createOrder(): { status: string } {
    return { status: "created" };
  }
}

@controller("/health")
class HealthController {
  @get("/")
  public check(): { ok: boolean } {
    return { ok: true };
  }
}

const openApiDoc = OpenApiRouter.generateSpec([OrderController, HealthController]);

assert.strictEqual(openApiDoc.openapi, "3.0.0");

// Verify Order paths
assert.ok(openApiDoc.paths["/api/v1/orders/"]);
assert.strictEqual(
  openApiDoc.paths["/api/v1/orders/"]["get"].operationId,
  "OrderController_listOrders"
);
assert.strictEqual(
  openApiDoc.paths["/api/v1/orders/"]["post"].operationId,
  "OrderController_createOrder"
);

assert.ok(openApiDoc.paths["/api/v1/orders/:id"]);
assert.strictEqual(
  openApiDoc.paths["/api/v1/orders/:id"]["get"].operationId,
  "OrderController_getOrder"
);

// Verify Health path
assert.ok(openApiDoc.paths["/health/"]);
assert.strictEqual(
  openApiDoc.paths["/health/"]["get"].operationId,
  "HealthController_check"
);

console.log("Project 4 (API Controller & OpenAPI Generator) passed all assertions.");
```


---

## 6. Enterprise Best Practices: 20 DOs and DON'Ts

| # | Rule | Bad Practice (DON'T) | Best Practice (DO) | Architectural Impact |
|---|------|----------------------|--------------------|----------------------|
| 1 | **Modern Standard Decorators** | Keeping `"experimentalDecorators": true` in new TS 5.x projects | Remove `experimentalDecorators` and use standard TC39 Stage 3 | Ensures future-proof compatibility with native JavaScript engines and avoids legacy deprecation. |
| 2 | **Native Decorator Metadata** | Importing `reflect-metadata` and enabling `emitDecoratorMetadata` | Use `context.metadata` and standard `Symbol.metadata` | Eliminates external polyfill bundles and provides native engine-level metadata performance. |
| 3 | **Field vs Auto-Accessor Interception** | Decorating a plain field expecting to intercept property writes | Use `accessor prop: Type` for get/set interception | Plain field decorators only intercept the initial value; auto-accessors intercept every read and write. |
| 4 | **Auto-Accessor Initializer Safety** | Assuming `init` hook always receives a defined value | Guard `if (val !== undefined)` in `init` hooks | Uninitialized auto-accessors pass `undefined` to `init` during constructor setup. |
| 5 | **Decorator Side Effect Isolation** | Mutating global state directly in decorator factory functions | Perform mutations inside the returned decorator or `addInitializer` | Decorator factories run during file evaluation, causing unexpected side effects on import. |
| 6 | **Explicit Class Properties** | Using parameter properties `constructor(public x: string)` with decorators | Declare explicit properties on class bodies | Guarantees compatibility with Node.js `--experimental-strip-types` and modern tooling. |
| 7 | **Autobind Instance Scope** | Binding methods on `target.prototype` | Bind methods inside `context.addInitializer` using instance `this` | Preserves instance identity and prevents cross-instance method reference leaks. |
| 8 | **Preserve Method Arity & Name** | Returning anonymous functions with empty argument names | Copy `Object.defineProperty(fn, 'name', { value: target.name })` | Preserves debugging stack traces, error messages, and framework reflection. |
| 9 | **Avoid Swallowing Errors in Wrappers** | Catching errors in method decorators without rethrowing | Rethrow errors or return explicit `Result<T, E>` monads | Silently swallowing exceptions corrupts downstream application state. |
| 10 | **Circular Dependency Defense** | Resolving IoC tokens without an active resolution set | Track active tokens in a `resolvingTokens` Set and throw on duplicates | Prevents infinite call stack exhaustion crashes in cyclic graphs. |
| 11 | **Hierarchical Metadata Safety** | Mutating `context.metadata` using un-namespaced string keys | Use unique Symbols or namespaced keys on metadata | Prevents collisions when multiple third-party libraries attach metadata. |
| 12 | **Idempotent Instance Initializers** | Re-running expensive initialization logic on every constructor | Track initialized instances in a `WeakSet` | Prevents duplicate event subscriptions and memory leaks. |
| 13 | **Private Identifier Decorators** | Trying to inspect private `#field` names using string matching | Check `context.private === true` and use `context.access` | Directly respects native ECMAScript lexical privacy rules. |
| 14 | **Avoid Type Alteration Assumptions** | Expecting a decorator to change a method's TypeScript return type | Use higher-order functions or mixins if type mutation is required | Stage 3 decorators cannot alter compile-time type signatures. |
| 15 | **Asynchronous Disposal Integration** | Writing manual cleanup methods that callers must remember to call | Implement `[Symbol.asyncDispose]` and consume via `await using` | Guarantees automatic, leak-free teardown of container scopes and database pools. |
| 16 | **Method Decorator Generic Preservation** | Typing decorator target as `Function` | Use `<This, Args extends any[], Return>` generics | Maintains complete type inference and parameter checking. |
| 17 | **Scoped Container Cleanup** | Leaving request-scoped dependencies in a singleton root container | Create child containers per request and dispose upon completion | Eliminates memory leaks in long-running HTTP microservices. |
| 18 | **Retry Decorator Jitter** | Retrying immediately or with static delays | Add randomized jitter: `delayMs + Math.random() * 50` | Prevents the "thundering herd" problem on recovering downstream APIs. |
| 19 | **OpenAPI Spec Deduplication** | Emitting duplicate path entries when multiple methods exist on a route | Index paths in a dictionary `paths[fullPath][method]` | Generates strictly valid OpenAPI 3.0 documents without schema validation errors. |
| 20 | **Avoid Over-Decoration** | Stacking 10+ decorators on a single method | Consolidate cross-cutting concerns into a composable pipeline | Reduces runtime closure overhead and simplifies debugging. |

---

## 7. Real-World Case Study: Enterprise Microservice DI & Telemetry Architecture

### Problem Context
An enterprise financial microservice requires:
1. Complete inversion of control where database connections, audit loggers, and HTTP clients are injected without tight coupling.
2. Production telemetry measuring latency on every database operation.
3. Automated route registration generating both runtime HTTP routing tables and OpenAPI 3.0 Swagger specifications from the exact same class annotations.
4. Zero third-party reflection libraries (`reflect-metadata` forbidden due to strict security auditing).

### Architectural Solution
Using native TC39 Stage 3 Decorators and `Symbol.metadata`:
- `@controller('/api/v1/accounts')`: Registers API route prefix.
- `@get('/:id')`: Registers HTTP endpoints and populates OpenAPI metadata.
- `@inject('AccountRepository')`: Injects repository dependency into auto-accessors.
- `@timed`: Captures latency metrics and logs to OpenTelemetry spans.
- All metadata is stored natively on `Constructor[Symbol.metadata]`, allowing the application bootstrapper to generate Swagger docs and wire IoC bindings with zero external dependencies.

```typescript
// Core Microservice Implementation Sketch
(Symbol as any).metadata ??= Symbol("Symbol.metadata");

export interface Account { id: string; balance: number; }

@controller("/api/v1/accounts")
export class AccountApiController {
  @inject("AccountRepository")
  accessor accountRepo!: { findById(id: string): Promise<Account | null> };

  @get("/:id")
  @timed
  public async getAccount(id: string): Promise<Account> {
    const account = await this.accountRepo.findById(id);
    if (!account) throw new Error("Account not found");
    return account;
  }
}
```

---

## 8. Practice Drills (75 Drills across 5 Progression Tiers)

### Tier 1: Stage 3 Decorator Syntax & Execution Order (Drills 1–15)
1. Write a no-op method decorator and inspect all fields of `context`.
2. Write a class decorator that freezes the constructor using `Object.freeze(target)`.
3. Demonstrate that decorator factories evaluate top-to-bottom while decorators execute bottom-to-top.
4. Write a field decorator that logs the initial field value.
5. Prove that `target` is `undefined` when decorating a class field.
6. Write a getter decorator that logs when a property is read.
7. Write a setter decorator that logs the new value being assigned.
8. Decorate a `#private` method and verify `context.private === true`.
9. Decorate a static method and verify `context.static === true`.
10. Use `context.addInitializer` in a class decorator to log when the class definition finishes.
11. Use `context.addInitializer` in a method decorator to log when a new instance is created.
12. Write a decorator that is constrained to only accept method targets.
13. Write a decorator that throws an error if applied to a static member.
14. Compose three method decorators (`@a @b @c`) and trace their execution order.
15. Polyfill `Symbol.metadata` on global `Symbol` if not present.

### Tier 2: Auto-Accessors & Property Interception (Drills 16–30)
16. Declare an auto-accessor `accessor name: string` and trace its desugared behavior.
17. Write an auto-accessor decorator that trims leading and trailing whitespace on set.
18. Write an auto-accessor decorator `@clamp(min, max)` enforcing numeric bounds.
19. Write an auto-accessor decorator `@readonly` throwing an error on any `set` call.
20. Demonstrate that the `init` hook runs during construction, while `set` runs on subsequent assignments.
21. Write an auto-accessor decorator that normalizes strings to lowercase on assignment.
22. Write an auto-accessor decorator that validates values against a regex pattern.
23. Decorate a static auto-accessor and verify `this` points to the constructor.
24. Decorate a private auto-accessor (`accessor #balance: number`) and verify encapsulation.
25. Write an auto-accessor decorator that tracks mutation counts in an internal counter.
26. Use `context.access.get` inside an auto-accessor decorator to read instance values.
27. Use `context.access.set` to mutate instance values from an external function.
28. Write an auto-accessor decorator that prevents setting `null` or `undefined`.
29. Write an auto-accessor decorator that rounds numbers to 2 decimal places.
30. Write an auto-accessor decorator that emits a `'change'` event whenever the value changes.

### Tier 3: Method Interceptors, Timing & Resilience (Drills 31–45)
31. Write a `@timed` decorator measuring method execution time using `performance.now()`.
32. Write an `@autobind` decorator ensuring `this` is permanently bound to the instance.
33. Write a `@retry(max, delayMs)` decorator retrying rejected async promises.
34. Write a `@memoize()` decorator caching method results based on JSON-serialized arguments.
35. Write a `@debounce(delayMs)` decorator delaying execution until idle.
36. Write a `@throttle(delayMs)` decorator limiting execution frequency.
37. Write a `@deprecated(message)` decorator emitting a console warning once per runtime.
38. Write an `@auditLog(action)` decorator logging start, success, and failure timestamps.
39. Write an `@authorized(roles)` decorator verifying caller permissions before execution.
40. Write a `@timeout(ms)` decorator rejecting if an async method takes longer than $N$ milliseconds.
41. Write a `@rateLimited(max, intervalMs)` decorator throwing when request limits are exceeded.
42. Write an `@idempotent()` decorator rejecting duplicate requests with identical idempotency keys.
43. Write a `@validateArgs(validatorFn)` decorator validating method arguments before execution.
44. Write a `@traceSpan(name)` decorator wrapping execution in an OpenTelemetry span.
45. Write a `@recoverWith(fallbackValue)` decorator catching exceptions and returning fallback data.

### Tier 4: Decorator Metadata & OpenAPI Generation (Drills 46–60)
46. Store metadata on `context.metadata` and read it from `Constructor[Symbol.metadata]`.
47. Verify that derived classes inherit metadata via prototype linkage (`Object.create`).
48. Write a `@tag(name)` decorator attaching custom tags to a class.
49. Write a `@controller(path)` decorator recording route prefixes in metadata.
50. Write a `@get(path)` decorator recording HTTP GET route definitions in metadata.
51. Write a `@post(path)` decorator recording HTTP POST route definitions in metadata.
52. Write a `@put(path)` decorator recording HTTP PUT route definitions in metadata.
53. Write a `@del(path)` decorator recording HTTP DELETE route definitions in metadata.
54. Build an OpenAPI 3.0 specification generator parsing routes from controller metadata.
55. Write a `@summary(text)` decorator adding endpoint descriptions to route metadata.
56. Write a `@response(statusCode, schema)` decorator adding OpenAPI response models.
57. Extract all registered route endpoints into an Express/Fastify compatible route table.
58. Prevent metadata pollution by using a unique Symbol key for route collections.
59. Write an `@injectable(lifetime)` decorator recording dependency injection lifetimes.
60. Read class metadata without importing any third-party reflection libraries.

### Tier 5: Enterprise IoC Containers & Dynamic Dependency Graphs (Drills 61–75)
61. Build an IoC Container from scratch supporting `bind()` and `resolve()`.
62. Implement the `@injectable()` decorator configuring Transient vs Singleton lifecycles.
63. Implement the `@inject(token)` decorator on auto-accessors.
64. Implement Circular Dependency Detection throwing a descriptive error upon cycle detection.
65. Build a Singleton cache inside the container returning identical references on resolution.
66. Build a Transient resolution engine instantiating fresh objects on every call.
67. Implement Scoped container resolution where instances are shared only within a request scope.
68. Implement automatic cleanup of Scoped containers using `[Symbol.asyncDispose]`.
69. Implement parent-to-child container delegation for hierarchical IoC containers.
70. Build an event-driven architecture using `@onEvent(name)` auto-registering handlers on boot.
71. Construct a unit test double overriding container bindings for isolated service testing.
72. Implement dynamic factory provider binding inside the IoC container.
73. Build a Transactional decorator `@transactional()` managing database begin, commit, and rollback.
74. Implement a full microservice controller integrating `@controller`, `@get`, `@inject`, and `@timed`.
75. Design a complete, framework-independent Dependency Injection architecture using TC39 Stage 3.


---

