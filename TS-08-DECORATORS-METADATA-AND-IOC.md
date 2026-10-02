# Module TS-08: Decorators, Metadata Reflection & Inversion of Control

Welcome to TypeScript Decorators, Metadata Reflection, and Inversion of Control (IoC). This module teaches modern TC39 Stage 3 decorators (supported natively in TypeScript 5.0+), decorator metadata (`Symbol.metadata` in TypeScript 5.2+), and how to build a production-grade Inversion of Control (IoC) dependency injection container from scratch.

---

# Topic 1: Modern TC39 Stage 3 Decorators vs Legacy Experimental Decorators

### 1. What is it?
A **Decorator** is a function applied to a class, method, getter/setter, field, or auto-accessor that modifies or extends its behavior.
TypeScript historically supported two completely different decorator systems:
1. **Legacy Experimental Decorators (Stage 2)**: Enabled by `"experimentalDecorators": true` in `tsconfig.json`. Relied on `reflect-metadata` and mutated property descriptors directly.
2. **Modern TC39 Stage 3 Decorators (TS 5.0+)**: The official JavaScript language standard. Enabled when `"experimentalDecorators": false` (or omitted). Decorators accept a target and a standardized `context` object, returning a replacement function or value.

### 2. Why does it exist?
The legacy Stage 2 proposal stalled in TC39 committee review for years due to performance issues and prototype mutation quirks. Modern Stage 3 decorators provide a standardized, engine-optimizable specification that works across all JavaScript runtimes without requiring non-standard compiler transformations.

### 3. Basic example

```typescript
// Modern TC39 Stage 3 Method Decorator
function loggedMethod<This, Args extends any[], Return>(
  target: (this: This, ...args: Args) => Return,
  context: ClassMethodDecoratorContext<This, (this: This, ...args: Args) => Return>
) {
  const methodName = String(context.name);

  return function (this: This, ...args: Args): Return {
    console.log(`Entering method: ${methodName}`);
    const result = target.call(this, ...args);
    console.log(`Exiting method: ${methodName}`);
    return result;
  };
}

class UserService {
  @loggedMethod
  greet(name: string): string {
    return `Hello, ${name}`;
  }
}

const service = new UserService();
service.greet("Alice");
```

**Line-by-line explanation:**
- `function loggedMethod(target, context)`: A modern decorator takes two arguments: the entity being decorated (`target`) and a metadata `context` object.
- `context: ClassMethodDecoratorContext`: Built-in TypeScript interface describing the method (its name, private status, and initializer hook).
- `return function (this: This, ...args: Args)`: Returning a function replaces the original method on the class prototype.
- `target.call(this, ...args)`: Invokes the original method while preserving the correct instance `this`.
- `@loggedMethod greet(...)`: Applies the decorator without parenthesis because it does not require configuration arguments.

---

### 4. How it works inside TypeScript
1. **No `experimentalDecorators` required**: Modern decorators run under standard TypeScript 5.0+ compilation with `experimentalDecorators` set to `false`.
2. **Context Interface**: TypeScript provides built-in context types:
   - `ClassDecoratorContext`
   - `ClassMethodDecoratorContext`
   - `ClassGetterDecoratorContext`
   - `ClassSetterDecoratorContext`
   - `ClassMemberDecoratorContext`
   - `ClassAccessorDecoratorContext`
   - `ClassFieldDecoratorContext`
3. **Replacement Return Values**: Stage 3 decorators replace targets by returning a new function or class constructor. If a decorator returns `undefined`, the original definition remains unmodified.

---

### 5. More examples

#### Example 1: Comparing Stage 2 vs Stage 3 signatures
```typescript
// Legacy Stage 2 (requires experimentalDecorators: true)
function legacyLog(target: any, propertyKey: string, descriptor: PropertyDescriptor) {
  const original = descriptor.value;
  descriptor.value = function (...args: any[]) {
    return original.apply(this, args);
  };
  return descriptor;
}

// Modern Stage 3 (standard TS 5.0+)
function modernLog<T extends (...args: any[]) => any>(
  target: T,
  context: ClassMethodDecoratorContext
) {
  return function (this: any, ...args: Parameters<T>): ReturnType<T> {
    return target.apply(this, args);
  };
}
```

#### Example 2: Inspecting decorator context metadata
```typescript
function inspectContext(target: any, context: ClassMethodDecoratorContext) {
  console.log(`Kind: ${context.kind}`);       // "method"
  console.log(`Name: ${String(context.name)}`); // "save"
  console.log(`Static: ${context.static}`);   // false
  console.log(`Private: ${context.private}`); // false
}

class OrderService {
  @inspectContext
  save(): void {}
}
```

---

### 6. Common mistakes

#### Mistake 1: Returning a property descriptor in Stage 3 decorators
```typescript
// WRONG: Stage 2 syntax used in Stage 3 mode
function badStage3MethodDecorator(target: any, context: ClassMethodDecoratorContext) {
  return {
    value: function () {} // Error! Stage 3 expects a replacement method function, NOT a PropertyDescriptor!
  };
}
```
**Why it fails:** In Stage 3, method decorators return the replacement function directly, not a `{ value: ... }` descriptor object.

```typescript
// CORRECT: Return the replacement function directly
function goodStage3MethodDecorator(target: any, context: ClassMethodDecoratorContext) {
  return function (this: any, ...args: any[]) {
    return target.apply(this, args);
  };
}
```

#### Mistake 2: Mixing `experimentalDecorators` compiler options
```json
// tsconfig.json
{
  "compilerOptions": {
    "experimentalDecorators": true // Forces compiler into legacy 2015 Stage 2 mode!
  }
}
```
**Why it fails:** Enabling `experimentalDecorators: true` disables TC39 Stage 3 syntax checking, preventing modern `context` typing from compiling. For modern decorators, omit `experimentalDecorators` or set it to `false`.

---

### 7. Rules to remember
1. Modern TC39 Stage 3 decorators are the default in TypeScript 5.0+ when `"experimentalDecorators"` is `false` or omitted.
2. A Stage 3 decorator function receives `(target, context)`.
3. Method decorators return a replacement function (or `undefined` to keep the original).
4. `context.kind` indicates what is being decorated (`"class"`, `"method"`, `"getter"`, `"setter"`, `"accessor"`, or `"field"`).

---

### Think first: Prediction puzzle
What does `context.kind` print for the following code?

```typescript
function trace(target: any, context: ClassMethodDecoratorContext) {
  console.log(context.kind);
}

class Account {
  @trace
  getBalance() { return 100; }
}
```

---

**Answer:**
```
method
```
**Explanation:** `context.kind` is an exact literal string representing the member type. For methods, it always evaluates to `"method"`.

---

### Practice exercises

#### Exercise 1: Execution timer method decorator
- **Task**: Write a modern Stage 3 method decorator `@timeExecution` that measures execution time using `performance.now()`.
- **Hint 1**: Return a replacement function that stores `const t0 = performance.now()` before calling `target.call(this, ...args)`.

#### Exercise 2: Static method logger
- **Task**: Write a method decorator that checks `context.static`. If `true`, logs `"[STATIC]"`, otherwise logs `"[INSTANCE]"`.
- **Hint 1**: Inspect `if (context.static)`.

#### Exercise 3: Return value multiplier
- **Task**: Write a decorator `@doubleReturn` that doubles numeric return values of methods.
- **Hint 1**: `const val = target.call(this, ...args); return typeof val === "number" ? val * 2 : val;`.

#### Exercise 4: Confirming Stage 3 context properties
- **Task**: Create a method decorator that asserts that `context.name` matches the expected string identifier `"run"`.
- **Hint 1**: `if (context.name !== "run") throw new Error("Invalid method name");`.

---

### Exercise solutions

#### Solution 1: Execution timer method decorator
```typescript
function timeExecution<This, Args extends any[], Return>(
  target: (this: This, ...args: Args) => Return,
  context: ClassMethodDecoratorContext<This, (this: This, ...args: Args) => Return>
) {
  const name = String(context.name);
  return function (this: This, ...args: Args): Return {
    const start = performance.now();
    try {
      return target.call(this, ...args);
    } finally {
      console.log(`${name} took ${(performance.now() - start).toFixed(2)}ms`);
    }
  };
}
```

#### Solution 2: Static method logger
```typescript
function logScope(target: any, context: ClassMethodDecoratorContext) {
  const prefix = context.static ? "[STATIC]" : "[INSTANCE]";
  return function (this: any, ...args: any[]) {
    console.log(`${prefix} ${String(context.name)} invoked`);
    return target.apply(this, args);
  };
}
```

#### Solution 3: Return value multiplier
```typescript
function doubleReturn<This, Args extends any[]>(
  target: (this: This, ...args: Args) => number,
  context: ClassMethodDecoratorContext<This, (this: This, ...args: Args) => number>
) {
  return function (this: This, ...args: Args): number {
    return target.call(this, ...args) * 2;
  };
}
```

#### Solution 4: Confirming Stage 3 context properties
```typescript
function mustBeRun(target: any, context: ClassMethodDecoratorContext) {
  if (context.name !== "run") {
    throw new Error(`Decorator must only be applied to 'run', found: ${String(context.name)}`);
  }
}
```

---

### Recall
1. Which compiler flag should be disabled (or omitted) to use modern TC39 Stage 3 decorators in TypeScript 5.x? `"experimentalDecorators": false`.
2. What are the two parameters passed to a Stage 3 decorator function? `target` (the entity) and `context` (`ClassMemberDecoratorContext`).
3. What does returning `undefined` from a method decorator do? It preserves the original method unchanged.

> **If you remember only one thing:**  
> Modern TC39 Stage 3 decorators receive `(target, context)` and return replacement functions directly without touching property descriptors.

---

# Topic 2: Class Method Decorators: Intercepting and Wrapping Invocations

### 1. What is it?
A **Class Method Decorator** wraps or replaces an instance or static method on a class. It intercepts arguments before the original method executes, inspects or mutates return values, or catches runtime errors.

### 2. Why does it exist?
Cross-cutting concerns like logging, input validation, transaction wrapping, and error alerting shouldn't clutter the core business logic of methods:
```typescript
// Anti-pattern: Repetitive boilerplate in every method
class OrderService {
  placeOrder(order: any) {
    console.log("Starting order");
    try {
      // 5 lines of business logic
    } catch (e) {
      alertOps(e);
      throw e;
    }
  }
}
```
A Method Decorator encapsulates this behavior into a clean reusable annotation: `@logAndAlert`.

### 3. Basic example

```typescript
function retry(maxAttempts: number) {
  return function <This, Args extends any[], Return>(
    target: (this: This, ...args: Args) => Promise<Return>,
    context: ClassMethodDecoratorContext<This, (this: This, ...args: Args) => Promise<Return>>
  ) {
    const methodName = String(context.name);

    return async function (this: This, ...args: Args): Promise<Return> {
      let attempts = 0;
      while (true) {
        try {
          attempts++;
          return await target.call(this, ...args);
        } catch (error) {
          if (attempts >= maxAttempts) {
            console.error(`Method ${methodName} failed after ${attempts} attempts`);
            throw error;
          }
          console.warn(`Retrying ${methodName} (attempt ${attempts + 1})...`);
        }
      }
    };
  };
}

class RemoteApiClient {
  private count = 0;

  @retry(3)
  async fetchData(): Promise<string> {
    this.count++;
    if (this.count < 3) {
      throw new Error("Network glitch");
    }
    return "Success payload";
  }
}

async function run() {
  const client = new RemoteApiClient();
  const res = await client.fetchData();
  console.log("Result:", res);
}
run();
```

**Line-by-line explanation:**
- `function retry(maxAttempts: number)`: A decorator factory that returns the actual decorator function.
- `target: (this: This, ...args: Args) => Promise<Return>`: Captures the original async method.
- `return async function (this: This, ...args: Args)`: Replaces the method with a retry loop.
- `await target.call(this, ...args)`: Executes the original method on each attempt.
- `if (attempts >= maxAttempts) throw error`: Rethrows if max attempts are exhausted.

---

### 4. How it works inside TypeScript
1. **Prototype Attachment**: For instance methods, the decorator runs once when the class is defined, replacing the method on `ClassName.prototype`.
2. **`this` Binding**: The replacement function must be a standard `function (this: This, ...args)` (not an arrow function) so that `this` points to the instance when called.
3. **Type Preservation**: Using generics `<This, Args, Return>` ensures that calling `client.fetchData()` keeps its exact argument and return types.

---

### 5. More examples

#### Example 1: Argument validation decorator
```typescript
function validatePositiveArg(
  target: (this: any, amount: number) => void,
  context: ClassMethodDecoratorContext
) {
  return function (this: any, amount: number): void {
    if (amount <= 0) {
      throw new Error(`Argument 'amount' must be positive, received: ${amount}`);
    }
    return target.call(this, amount);
  };
}

class BankAccount {
  private balance = 100;

  @validatePositiveArg
  deposit(amount: number): void {
    this.balance += amount;
  }
}
```

#### Example 2: Read-only / Immutable result wrapper
```typescript
function freezeResult<This, Args extends any[], Return extends object>(
  target: (this: This, ...args: Args) => Return,
  context: ClassMethodDecoratorContext
) {
  return function (this: This, ...args: Args): Return {
    const res = target.call(this, ...args);
    return Object.freeze(res);
  };
}

class ConfigService {
  @freezeResult
  loadConfig() {
    return { host: "127.0.0.1", port: 5432 };
  }
}
```

---

### 6. Common mistakes

#### Mistake 1: Using an arrow function for the replacement implementation
```typescript
// WRONG: Arrow functions do not bind 'this' to the caller instance
function badDecorator(target: any, context: ClassMethodDecoratorContext) {
  return (...args: any[]) => {
    return target.call(this, ...args); // 'this' is lexical (undefined or global)!
  };
}
```
**Why it fails:** Arrow functions capture lexical `this`. Inside a module, `this` is `undefined`. When the class instance calls the method, `this.propertyName` inside `target` crashes with `TypeError: Cannot read properties of undefined`. Always use standard `function (this: This, ...args: Args)`.

#### Mistake 2: Losing the return value
```typescript
// WRONG: Not returning the target result
function logOnly(target: any, context: ClassMethodDecoratorContext) {
  return function (this: any, ...args: any[]) {
    console.log("Called");
    target.call(this, ...args); // Forgot 'return'! Returns undefined to caller!
  };
}
```
**Why it fails:** If the original method returns a value, forgetting `return` causes the caller to receive `undefined`.

---

### 7. Rules to remember
1. Always declare replacement functions with standard `function (this: This, ...args: Args)` syntax to preserve `this`.
2. Always return the value produced by `target.call(this, ...args)`.
3. Use a decorator factory (`function myDec(opts) { return function(target, ctx) { ... } }`) when configuration arguments are needed.
4. Generics `<This, Args, Return>` preserve complete end-to-end type safety.

---

### Think first: Prediction puzzle
What does the following snippet print?

```typescript
function addSuffix(
  target: (this: any, s: string) => string,
  context: ClassMethodDecoratorContext
) {
  return function (this: any, s: string): string {
    return target.call(this, s) + " [decorated]";
  };
}

class Formatter {
  @addSuffix
  format(str: string): string {
    return str.toUpperCase();
  }
}

const f = new Formatter();
console.log(f.format("test"));
```

---

**Answer:**
```
TEST [decorated]
```
**Execution trace:**
1. `f.format("test")` enters the decorator replacement function.
2. `target.call(this, "test")` invokes `format`, returning `"TEST"`.
3. The decorator appends `" [decorated]"` and returns `"TEST [decorated]"`.

---

### Practice exercises

#### Exercise 1: Input sanitization decorator
- **Task**: Create a decorator `@trimStringInput` that trims the first string argument before passing it to the original method.
- **Hint 1**: `const sanitized = args.map(a => typeof a === "string" ? a.trim() : a) as Args;`.

#### Exercise 2: Safe async error fallback
- **Task**: Write a decorator `@catchError(fallbackValue)` that catches rejected promises and returns `fallbackValue`.
- **Hint 1**: Wrap `await target.call(this, ...args)` in `try/catch`.

#### Exercise 3: Invocation logger with parameter inspection
- **Task**: Write a decorator that logs the method name and `JSON.stringify(args)`.
- **Hint 1**: `console.log(`${String(context.name)} args:`, JSON.stringify(args))`.

#### Exercise 4: Disallow execution when offline
- **Task**: Decorate a method on a class with a boolean property `isOnline`. If `this.isOnline` is false, throw `new Error("Offline")`.
- **Hint 1**: Cast `this as { isOnline: boolean }`.

---

### Exercise solutions

#### Solution 1: Input sanitization decorator
```typescript
function trimStringInput<This, Return>(
  target: (this: This, input: string) => Return,
  context: ClassMethodDecoratorContext<This, (this: This, input: string) => Return>
) {
  return function (this: This, input: string): Return {
    return target.call(this, input.trim());
  };
}
```

#### Solution 2: Safe async error fallback
```typescript
function catchError<TFallback>(fallback: TFallback) {
  return function <This, Args extends any[], Return>(
    target: (this: This, ...args: Args) => Promise<Return>,
    context: ClassMethodDecoratorContext
  ) {
    return async function (this: This, ...args: Args): Promise<Return | TFallback> {
      try {
        return await target.call(this, ...args);
      } catch {
        return fallback;
      }
    };
  };
}
```

#### Solution 3: Invocation logger with parameter inspection
```typescript
function logParams<This, Args extends any[], Return>(
  target: (this: This, ...args: Args) => Return,
  context: ClassMethodDecoratorContext
) {
  const name = String(context.name);
  return function (this: This, ...args: Args): Return {
    console.log(`[Call] ${name}(${args.map((a) => JSON.stringify(a)).join(", ")})`);
    return target.call(this, ...args);
  };
}
```

#### Solution 4: Disallow execution when offline
```typescript
function requireOnline<This extends { isOnline: boolean }, Args extends any[], Return>(
  target: (this: This, ...args: Args) => Return,
  context: ClassMethodDecoratorContext<This, (this: This, ...args: Args) => Return>
) {
  return function (this: This, ...args: Args): Return {
    if (!this.isOnline) {
      throw new Error("Network connection required");
    }
    return target.call(this, ...args);
  };
}
```

---

### Recall
1. Why must replacement functions never be written as arrow functions? Because arrow functions do not bind `this` dynamically to the class instance.
2. Where is a decorated instance method installed in JavaScript memory? On the class prototype (`ClassName.prototype`).
3. How do you create a decorator that takes arguments like `@retry(5)`? By using a decorator factory function that returns the decorator.

> **If you remember only one thing:**  
> Method decorators intercept method calls by replacing the prototype function with a wrapper that preserves `this` via `target.call(this, ...args)`.

---

# Topic 3: Class Accessor Decorators & Auto-Accessors (`accessor prop: Type`)

### 1. What is it?
TypeScript 5.0 introduced **Auto-Accessors**, declared using the `accessor` keyword:
```typescript
class Person {
  accessor name: string;
}
```
An auto-accessor automatically generates a private backing storage variable alongside a getter and a setter. An **Accessor Decorator** (`ClassAccessorDecorator`) intercepts this getter and setter, allowing you to validate assignments or transform reads.

### 2. Why does it exist?
Previously, to validate a property, you had to manually declare a private field and write boilerplate getter/setter pairs:
```typescript
// Legacy boilerplate:
class Person {
  private _name: string = "";
  get name() { return this._name; }
  set name(v: string) { this._name = v; }
}
```
With `accessor name: string`, the compiler generates the backing field automatically. Decorating it with `@validate` allows attaching validation or reactivity in a single line.

### 3. Basic example

```typescript
function minLength(min: number) {
  return function <This, Value extends string>(
    target: ClassAccessorDecoratorTarget<This, Value>,
    context: ClassAccessorDecoratorContext<This, Value>
  ): ClassAccessorDecoratorResult<This, Value> {
    return {
      get(this: This): Value {
        return target.get.call(this);
      },
      set(this: This, value: Value): void {
        if (value.length < min) {
          throw new Error(`Property ${String(context.name)} must be at least ${min} chars`);
        }
        target.set.call(this, value);
      },
      init(this: This, initialValue: Value): Value {
        if (initialValue.length < min) {
          throw new Error(`Initial value for ${String(context.name)} too short`);
        }
        return initialValue;
      },
    };
  };
}

class UserProfile {
  @minLength(3)
  accessor username: string = "admin";
}

const profile = new UserProfile();
profile.username = "al"; // Throws runtime Error: Property username must be at least 3 chars
```

**Line-by-line explanation:**
- `accessor username: string = "admin"`: Declares an auto-accessor. TypeScript creates an internal private storage slot and public `get username()` / `set username(val)`.
- `target: ClassAccessorDecoratorTarget`: An object with `.get` and `.set` methods to access the internal storage slot.
- `return { get, set, init }`: An accessor decorator can return custom `get`, `set`, and `init` functions.
- `init`: Intercepts and transforms the initial value assigned during construction.
- `set`: Intercepts every subsequent assignment.

---

### 4. How it works inside TypeScript
1. **Desugaring**: TypeScript desugars `accessor x: string` into a private symbol or `#x` field, plus getter/setter functions on the prototype.
2. **Decorator Target**: The target contains `{ get: () => Value, set: (val: Value) => void }`.
3. **Decorator Return Object**: You can return any combination of `{ get, set, init }`. Any omitted property retains default behavior.

---

### 5. More examples

#### Example 1: Numeric range clamping
```typescript
function clamp(min: number, max: number) {
  return function <This>(
    target: ClassAccessorDecoratorTarget<This, number>,
    context: ClassAccessorDecoratorContext<This, number>
  ): ClassAccessorDecoratorResult<This, number> {
    return {
      set(this: This, value: number) {
        const clamped = Math.max(min, Math.min(max, value));
        target.set.call(this, clamped);
      },
      init(this: This, value: number) {
        return Math.max(min, Math.min(max, value));
      },
    };
  };
}

class VolumeControl {
  @clamp(0, 100)
  accessor level: number = 50;
}

const vol = new VolumeControl();
vol.level = 150;
console.log(vol.level); // 100 (clamped!)
```

#### Example 2: Change-notification / Reactive trigger
```typescript
function observable<This, Value>(
  target: ClassAccessorDecoratorTarget<This, Value>,
  context: ClassAccessorDecoratorContext<This, Value>
): ClassAccessorDecoratorResult<This, Value> {
  const propName = String(context.name);

  return {
    set(this: This, newVal: Value) {
      const oldVal = target.get.call(this);
      target.set.call(this, newVal);
      console.log(`[Observable] ${propName} changed from ${oldVal} -> ${newVal}`);
    },
  };
}

class Device {
  @observable
  accessor status: string = "idle";
}
```

---

### 6. Common mistakes

#### Mistake 1: Applying accessor decorator to standard class fields
```typescript
// WRONG: Missing 'accessor' keyword
class Settings {
  @minLength(3)
  username: string = "alice"; // Error: Cannot apply accessor decorator to plain field!
}
```
**Why it fails:** Plain fields (`username: string`) are fields, not auto-accessors. You must add the `accessor` keyword (`accessor username: string`) to use `ClassAccessorDecorator`.

#### Mistake 2: Forgetting to delegate to `target.set`
```typescript
// WRONG: Forgetting target.set leaves backing field unchanged
return {
  set(this: This, value: Value) {
    console.log("Setting:", value);
    // Forgot target.set.call(this, value); -> backing store is never updated!
  }
};
```
**Why it fails:** If you do not call `target.set.call(this, value)`, the private backing variable is never updated. The property will always return its old value.

---

### 7. Rules to remember
1. Auto-accessors require the `accessor` keyword: `accessor propertyName: Type`.
2. Accessor decorators receive `{ get, set }` in `target`.
3. Return `{ get, set, init }` to customize read, write, and initialization behavior.
4. Always invoke `target.set.call(this, value)` to update the underlying backing storage.

---

### Think first: Prediction puzzle
What does the console log?

```typescript
function upper(
  target: ClassAccessorDecoratorTarget<any, string>,
  context: ClassAccessorDecoratorContext
): ClassAccessorDecoratorResult<any, string> {
  return {
    set(this: any, val: string) {
      target.set.call(this, val.toUpperCase());
    },
    init(this: any, val: string) {
      return val.toUpperCase();
    }
  };
}

class Greeting {
  @upper
  accessor title: string = "hello";
}

const g = new Greeting();
g.title = "world";
console.log(g.title);
```

---

**Answer:**
```
WORLD
```
**Execution trace:**
1. During instantiation, `init` runs: `"hello".toUpperCase()` $\to$ `"HELLO"`.
2. When `g.title = "world"` is assigned, `set` runs: `"world".toUpperCase()` $\to$ `"WORLD"`.
3. `target.set.call(this, "WORLD")` updates the backing field.
4. `console.log(g.title)` outputs `"WORLD"`.

---

### Practice exercises

#### Exercise 1: Read-only auto-accessor
- **Task**: Write an accessor decorator `@readOnlyAccessor` that allows `init` but throws an error if `set` is called.
- **Hint 1**: In `set(val)`, throw `new Error("Read-only property")`.

#### Exercise 2: Integer validator
- **Task**: Write `@mustBeInteger` that ensures only whole numbers can be set.
- **Hint 1**: Check `Number.isInteger(value)`.

#### Exercise 3: Trim on assignment
- **Task**: Write `@trimmed` that strips leading and trailing whitespace from string auto-accessors on both `init` and `set`.
- **Hint 1**: Return `val.trim()` in both `init` and `set`.

#### Exercise 4: Audit history tracker
- **Task**: Build an accessor decorator that records every previous value in an array `this.__history = []`.
- **Hint 1**: Before calling `target.set`, push `target.get.call(this)` to an internal or instance history array.

---

### Exercise solutions

#### Solution 1: Read-only auto-accessor
```typescript
function readOnlyAccessor<This, Value>(
  target: ClassAccessorDecoratorTarget<This, Value>,
  context: ClassAccessorDecoratorContext<This, Value>
): ClassAccessorDecoratorResult<This, Value> {
  return {
    set() {
      throw new Error(`Cannot modify read-only property ${String(context.name)}`);
    },
  };
}
```

#### Solution 2: Integer validator
```typescript
function mustBeInteger<This>(
  target: ClassAccessorDecoratorTarget<This, number>,
  context: ClassAccessorDecoratorContext<This, number>
): ClassAccessorDecoratorResult<This, number> {
  return {
    set(this: This, val: number) {
      if (!Number.isInteger(val)) throw new Error("Must be an integer");
      target.set.call(this, val);
    },
    init(this: This, val: number) {
      if (!Number.isInteger(val)) throw new Error("Initial value must be integer");
      return val;
    },
  };
}
```

#### Solution 3: Trim on assignment
```typescript
function trimmed<This>(
  target: ClassAccessorDecoratorTarget<This, string>,
  context: ClassAccessorDecoratorContext<This, string>
): ClassAccessorDecoratorResult<This, string> {
  return {
    init(this: This, val: string) { return val.trim(); },
    set(this: This, val: string) { target.set.call(this, val.trim()); },
  };
}
```

#### Solution 4: Audit history tracker
```typescript
function trackHistory<This extends { __history?: any[] }, Value>(
  target: ClassAccessorDecoratorTarget<This, Value>,
  context: ClassAccessorDecoratorContext<This, Value>
): ClassAccessorDecoratorResult<This, Value> {
  return {
    set(this: This, val: Value) {
      if (!this.__history) this.__history = [];
      this.__history.push(target.get.call(this));
      target.set.call(this, val);
    },
  };
}
```

---

### Recall
1. What keyword introduces an auto-accessor in TypeScript 5.0? `accessor`.
2. What three optional functions can a `ClassAccessorDecorator` return? `get`, `set`, and `init`.
3. When does the `init` function of an accessor decorator execute? During class instantiation when the property's initial value is assigned.

> **If you remember only one thing:**  
> Auto-accessors (`accessor prop: Type`) provide compiler-generated backing storage that accessor decorators can intercept via `{ get, set, init }`.

---

# Topic 4: Class Field Decorators: Initializer Transformation

### 1. What is it?
A **Class Field Decorator** (`ClassFieldDecorator`) is applied to a regular instance or static property on a class. In Stage 3, a field decorator does not receive or modify the field's property descriptor; instead, it accepts `undefined` as its `target` and returns an **initializer function** that transforms the property's initial value.

### 2. Why does it exist?
In JavaScript, class fields are assigned directly on the created instance during constructor execution. Field decorators allow you to calculate default values, bind instance dependencies, or sanitize initial field state without manually writing constructor assignment statements.

### 3. Basic example

```typescript
function defaultValue<T>(fallback: T) {
  return function <This, Value>(
    target: undefined,
    context: ClassFieldDecoratorContext<This, Value>
  ) {
    return function (this: This, initialValue: Value): Value {
      // If no initial value was provided (or undefined), return the fallback
      return initialValue !== undefined ? initialValue : (fallback as unknown as Value);
    };
  };
}

class UserSettings {
  @defaultValue("en_US")
  locale?: string;

  @defaultValue(50)
  pageSize?: number;
}

const s1 = new UserSettings();
console.log(s1.locale);   // "en_US"
console.log(s1.pageSize); // 50

const s2 = new UserSettings();
s2.locale = "fr_FR";
console.log(s2.locale);   // "fr_FR"
```

**Line-by-line explanation:**
- `target: undefined`: In TC39 Stage 3, field decorators receive `undefined` for `target` because the field has not yet been assigned to any instance.
- `context: ClassFieldDecoratorContext<This, Value>`: Provides metadata about the field.
- `return function (this: This, initialValue: Value)`: Returns an initializer function that executes when an instance is instantiated.
- `return initialValue !== undefined ? initialValue : fallback`: Sets the default value if the field is undefined.

---

### 4. How it works inside TypeScript
1. **Target is `undefined`**: Because fields do not exist on the prototype, `target` is always `undefined`.
2. **Initializer Hook**: Returning a function `(initialValue: Value) => Value` tells the JavaScript engine to pass the property's initial expression into your function and assign the returned value to the instance.
3. **Execution Moment**: The initializer runs during constructor execution at the exact line where the field is declared.

---

### 5. More examples

#### Example 1: Dependency injection marker using field initializers
```typescript
const container = new Map<string, any>();
container.set("logger", { log: (msg: string) => console.log(`[LOG] ${msg}`) });

function inject(serviceKey: string) {
  return function (target: undefined, context: ClassFieldDecoratorContext) {
    return function (this: any, initialValue: any) {
      return container.get(serviceKey);
    };
  };
}

class TaskService {
  @inject("logger")
  logger: any;
}

const task = new TaskService();
task.logger.log("Task executed"); // "[LOG] Task executed"
```

#### Example 2: UUID Auto-Generator Field Decorator
```typescript
function generateUuid() {
  return function (target: undefined, context: ClassFieldDecoratorContext) {
    return function (this: any, initialValue: string | undefined): string {
      return initialValue ?? `uuid_${Math.random().toString(36).slice(2, 9)}`;
    };
  };
}

class Order {
  @generateUuid()
  orderId!: string;
}

const o1 = new Order();
console.log(o1.orderId.startsWith("uuid_")); // true
```

---

### 6. Common mistakes

#### Mistake 1: Expecting `target` to be a property descriptor or prototype
```typescript
// WRONG: Attempting to inspect target in a field decorator
function badFieldDecorator(target: any, context: ClassFieldDecoratorContext) {
  console.log(target.name); // TypeError: Cannot read properties of undefined!
}
```
**Why it fails:** In Stage 3, `target` is always `undefined` for field decorators.

#### Mistake 2: Expecting field decorators to intercept future assignments
```typescript
// GOTCHA:
class User {
  @defaultValue("admin")
  role: string = "admin";
}

const u = new User();
u.role = ""; // Field decorator DOES NOT intercept this assignment!
```
**Why it matters:** Field decorators only run once during initialization. To intercept ongoing assignments (`u.role = ...`), you must use an Auto-Accessor (`accessor role: string`) with an Accessor Decorator!

---

### 7. Rules to remember
1. `target` is always `undefined` for Stage 3 class field decorators.
2. Field decorators return an initializer function: `(this: This, initialValue: Value) => Value`.
3. Initializer functions execute during class constructor instantiation.
4. Field decorators do NOT intercept future assignments; use `accessor` if ongoing assignment interception is needed.

---

### Think first: Prediction puzzle
What does `item.count` evaluate to?

```typescript
function multiplyInitial(factor: number) {
  return function (target: undefined, context: ClassFieldDecoratorContext) {
    return function (this: any, initial: number) {
      return initial * factor;
    };
  };
}

class CartItem {
  @multiplyInitial(10)
  count: number = 5;
}

const item = new CartItem();
console.log(item.count);
```

---

**Answer:**
```
50
```
**Execution trace:**
1. Field `count` is initialized with expression `5`.
2. The decorator initializer function receives `initial = 5`.
3. `5 * 10` is calculated and returns `50`.
4. Property `item.count` is assigned `50`.

---

### Practice exercises

#### Exercise 1: Epoch timestamp initializer
- **Task**: Create a field decorator `@createdAt` that initializes a `number` field to `Date.now()`.
- **Hint 1**: Return `() => Date.now()`.

#### Exercise 2: Array initialization safeguard
- **Task**: Write a field decorator `@ensureArray` that initializes an array property to an empty array `[]` if no initial value is provided.
- **Hint 1**: `return (init) => init ?? []`.

#### Exercise 3: Uppercase initial string
- **Task**: Write a field decorator that converts the initial string literal to uppercase.
- **Hint 1**: `return (init: string) => init.toUpperCase()`.

#### Exercise 4: Immutable copy initializer
- **Task**: Write a field decorator that freezes any object passed as the initial value using `Object.freeze()`.
- **Hint 1**: `return (init: object) => Object.freeze(init)`.

---

### Exercise solutions

#### Solution 1: Epoch timestamp initializer
```typescript
function createdAt() {
  return function (target: undefined, context: ClassFieldDecoratorContext) {
    return function (): number {
      return Date.now();
    };
  };
}

class Post {
  @createdAt()
  timestamp!: number;
}
```

#### Solution 2: Array initialization safeguard
```typescript
function ensureArray<T>() {
  return function (target: undefined, context: ClassFieldDecoratorContext) {
    return function (this: any, initial: T[] | undefined): T[] {
      return initial ?? [];
    };
  };
}
```

#### Solution 3: Uppercase initial string
```typescript
function initialUpperCase() {
  return function (target: undefined, context: ClassFieldDecoratorContext) {
    return function (this: any, initial: string): string {
      return initial.toUpperCase();
    };
  };
}
```

#### Solution 4: Immutable copy initializer
```typescript
function frozenInitial<T extends object>() {
  return function (target: undefined, context: ClassFieldDecoratorContext) {
    return function (this: any, initial: T): T {
      return Object.freeze({ ...initial });
    };
  };
}
```

---

### Recall
1. What value is passed as `target` to a Stage 3 field decorator? `undefined`.
2. What does a field decorator return to modify the field? An initializer function `(initialValue) => transformedValue`.
3. Can a field decorator intercept property assignments that occur after instantiation? No; use `accessor` auto-accessors for ongoing assignment interception.

> **If you remember only one thing:**  
> Field decorators receive `undefined` as `target` and return an initializer function to transform or provide default values during construction.

---

# Topic 5: Class Decorators: Constructor Replacement and Subclass Augmentation

### 1. What is it?
A **Class Decorator** (`ClassDecorator`) is applied to a class declaration. It receives the constructor function as `target` and a `ClassDecoratorContext`. It can inspect the class, register it in an external table, or return a new constructor (typically extending the original) to replace or augment instances.

### 2. Why does it exist?
Certain architectural requirements apply to an entire class rather than individual methods:
- Auto-registering entities or controllers in a router or IoC container.
- Freezing the prototype to prevent runtime tampering.
- Injecting tracking properties (such as creation timestamps or instance counters) into all instances.
Class decorators satisfy these requirements without forcing the class author to extend a concrete base class.

### 3. Basic example

```typescript
type Constructor<T = {}> = new (...args: any[]) => T;

function entity(tableName: string) {
  return function <T extends Constructor>(
    target: T,
    context: ClassDecoratorContext<T>
  ) {
    // Return a subclass that augments the original constructor
    return class extends target {
      readonly __tableName = tableName;
      readonly __createdAt = new Date();

      constructor(...args: any[]) {
        super(...args);
        console.log(`[Entity] Instantiated ${context.name} mapped to table: ${tableName}`);
      }
    };
  };
}

@entity("users_table")
class User {
  constructor(public username: string) {}
}

const u = new User("Alice");
console.log((u as any).__tableName); // "users_table"
```

**Line-by-line explanation:**
- `target: T`: The original class constructor function.
- `context: ClassDecoratorContext`: Contains metadata such as `context.name` (the class name).
- `return class extends target { ... }`: Replaces the original constructor with an anonymous subclass extending `target`.
- `super(...args)`: Invokes the original constructor to initialize fields.
- Calling `new User("Alice")` executes the augmented constructor, adding `__tableName` and logging the instantiation.

---

### 4. How it works inside TypeScript
1. **Replacement Constructor**: If a class decorator returns a constructor function, that constructor replaces the decorated class in the calling scope.
2. **Prototype Preservation**: Subclassing `extends target` preserves the prototype chain so `u instanceof User` remains `true`.
3. **Erased Type Narrowing**: TypeScript's type system currently does not add new properties introduced by class decorator subclasses to the static type of `User` without explicit interface declaration merging or casting.

---

### 5. More examples

#### Example 1: Prototype freezing decorator
```typescript
function freezeClass<T extends Constructor>(
  target: T,
  context: ClassDecoratorContext<T>
) {
  Object.freeze(target);
  Object.freeze(target.prototype);
  // Return undefined: keeps the original constructor unchanged
}

@freezeClass
class ImmutableModel {
  sayHi() { return "hi"; }
}

// ImmutableModel.prototype.sayHi = () => "tampered"; // Throws TypeError in strict mode!
```

#### Example 2: Self-registering controller in a central registry
```typescript
const routeRegistry = new Map<string, Constructor>();

function controller(routePrefix: string) {
  return function <T extends Constructor>(target: T, context: ClassDecoratorContext<T>) {
    routeRegistry.set(routePrefix, target);
  };
}

@controller("/api/users")
class UserController {}

console.log(routeRegistry.has("/api/users")); // true
```

---

### 6. Common mistakes

#### Mistake 1: Expecting returned properties to exist on the TypeScript static type
```typescript
// GOTCHA:
@entity("orders")
class Order { id = "1"; }

const o = new Order();
// console.log(o.__tableName); // TS Error: Property '__tableName' does not exist on type 'Order'!
```
**Why it happens:** TypeScript does not currently mutate the type signature of a class declaration via decorators. To access augmented properties with static type checking, use interface merging:
```typescript
interface Order {
  __tableName: string;
}
```

#### Mistake 2: Forgetting to call `super(...args)` in constructor replacement
```typescript
// WRONG: Subclass constructor missing super()
return class extends target {
  constructor(...args: any[]) {
    // Missing super(...args)! Throws ReferenceError: Must call super constructor in derived class!
  }
};
```
**Why it fails:** JavaScript requires derived classes to call `super(...args)` before accessing `this`.

---

### 7. Rules to remember
1. A class decorator receives `(target: Constructor, context: ClassDecoratorContext)`.
2. Returning a new class constructor replaces the original class.
3. Subclassing `extends target` preserves `instanceof` checks.
4. Returning `undefined` leaves the constructor unchanged (ideal for registration or freezing).

---

### Think first: Prediction puzzle
Does `u instanceof User` evaluate to `true` when a class decorator returns a subclass?

```typescript
function augment<T extends new (...args: any[]) => any>(target: T, context: ClassDecoratorContext) {
  return class extends target {
    extra = true;
  };
}

@augment
class User {}

const u = new User();
console.log(u instanceof User);
```

---

**Answer:**
```
true
```
**Explanation:** Because the replacement class `extends target`, its prototype chain inherits from `target.prototype`. The variable `User` points to the returned subclass constructor. Therefore, `u instanceof User` evaluates to `true`.

---

### Practice exercises

#### Exercise 1: Instance counter decorator
- **Task**: Write a class decorator `@counted` that tracks how many times instances of the class are instantiated via a static property `instanceCount`.
- **Hint 1**: Subclass `target` and increment a static counter in the constructor.

#### Exercise 2: Sealed class decorator
- **Task**: Create a class decorator `@sealed` that calls `Object.seal(target)` and `Object.seal(target.prototype)`.
- **Hint 1**: Return `undefined`.

#### Exercise 3: Dependency tag decorator
- **Task**: Create a class decorator `@tag(label)` that stores `label` on a static property `Symbol.for("class.tag")`.
- **Hint 1**: `(target as any)[Symbol.for("class.tag")] = label`.

#### Exercise 4: Mandatory `id` generator subclass
- **Task**: Return a subclass that assigns `(this as any).id = Math.random().toString()` during construction if `id` is not present.
- **Hint 1**: `super(...args); if (!this.id) this.id = ...`.

---

### Exercise solutions

#### Solution 1: Instance counter decorator
```typescript
type Ctor = new (...args: any[]) => any;

function counted<T extends Ctor>(target: T, context: ClassDecoratorContext) {
  let count = 0;
  return class extends target {
    static get instanceCount() { return count; }
    constructor(...args: any[]) {
      super(...args);
      count++;
    }
  };
}
```

#### Solution 2: Sealed class decorator
```typescript
function sealed<T extends Ctor>(target: T, context: ClassDecoratorContext) {
  Object.seal(target);
  Object.seal(target.prototype);
}
```

#### Solution 3: Dependency tag decorator
```typescript
const TAG_KEY = Symbol.for("class.tag");

function tag(label: string) {
  return function <T extends Ctor>(target: T, context: ClassDecoratorContext) {
    (target as any)[TAG_KEY] = label;
  };
}
```

#### Solution 4: Mandatory `id` generator subclass
```typescript
function ensureId<T extends Ctor>(target: T, context: ClassDecoratorContext) {
  return class extends target {
    id: string;
    constructor(...args: any[]) {
      super(...args);
      this.id = (this as any).id ?? `id_${Date.now()}`;
    }
  };
}
```

---

### Recall
1. What does a class decorator receive as its `target`? The class constructor function.
2. How do you replace a class implementation using a decorator? By returning a new constructor function (usually subclassing `target`).
3. Does returning `class extends target` break `instanceof`? No; prototype inheritance is preserved.

> **If you remember only one thing:**  
> Class decorators inspect or replace class constructors, preserving the prototype chain by returning derived classes.

---

# Checkpoint Challenge 1: TC39 Decorator Foundations (Topics 1-5)

### Challenge Specification
Build an Entity Framework setup utilizing all 4 decorator types:
1. A **Class Decorator** (`@table(name)`) registering the class in an entity registry.
2. A **Field Decorator** (`@generatedId()`) initializing a unique identifier.
3. An **Auto-Accessor Decorator** (`@range(min, max)`) clamping a numeric property.
4. A **Method Decorator** (`@auditLog`) logging method execution.

### Solution

```typescript
// 1. Table Registry & Class Decorator
type Ctor = new (...args: any[]) => any;
const entityRegistry = new Map<string, Ctor>();

function table(name: string) {
  return function <T extends Ctor>(target: T, context: ClassDecoratorContext) {
    entityRegistry.set(name, target);
  };
}

// 2. Field Decorator
function generatedId() {
  return function (target: undefined, context: ClassFieldDecoratorContext) {
    return function (this: any, initial: string | undefined): string {
      return initial ?? `ent_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
    };
  };
}

// 3. Accessor Decorator
function range(min: number, max: number) {
  return function <This>(
    target: ClassAccessorDecoratorTarget<This, number>,
    context: ClassAccessorDecoratorContext<This, number>
  ): ClassAccessorDecoratorResult<This, number> {
    return {
      set(this: This, value: number) {
        const clamped = Math.max(min, Math.min(max, value));
        target.set.call(this, clamped);
      },
      init(this: This, value: number) {
        return Math.max(min, Math.min(max, value));
      },
    };
  };
}

// 4. Method Decorator
function auditLog<This, Args extends any[], Return>(
  target: (this: This, ...args: Args) => Return,
  context: ClassMethodDecoratorContext
) {
  const name = String(context.name);
  return function (this: This, ...args: Args): Return {
    console.log(`[AUDIT] Invoking ${name}`);
    return target.call(this, ...args);
  };
}

// 5. Applying all Decorators to an Account Entity
@table("accounts")
class AccountEntity {
  @generatedId()
  id!: string;

  @range(0, 1000)
  accessor riskScore: number = 50;

  @auditLog
  calculateHealth(): string {
    return `Account ${this.id} has risk score ${this.riskScore}`;
  }
}

// 6. Verification
function verifyCheckpoint1() {
  console.log("Registry has 'accounts':", entityRegistry.has("accounts"));

  const account = new AccountEntity();
  console.log("Generated ID:", account.id.startsWith("ent_"));

  account.riskScore = 5000; // Clamped to 1000
  console.log("Clamped Risk Score (max 1000):", account.riskScore === 1000);

  const health = account.calculateHealth();
  console.log("Health message:", health);
}
verifyCheckpoint1();
```


---

# Topic 6: Decorator Execution and Evaluation Ordering

### 1. What is it?
When multiple decorators are applied to a class and its members, they evaluate and execute according to strict language specification rules:
1. **Decorator Evaluation**: Expressions for decorator factories evaluate from **top-to-bottom**.
2. **Decorator Execution**: The decorator functions themselves execute from **bottom-to-top** (reverse order, like mathematical function composition: $f(g(x))$).
3. **Member Order**: Instance member decorators run before static member decorators, which run before class-level decorators.

### 2. Why does it exist?
Understanding execution order is critical when decorators depend on each other (e.g., an `@auth` decorator that must run before a `@log` decorator, or metadata decorators that must register data before a `@controller` decorator reads it).

### 3. Basic example

```typescript
function first() {
  console.log("first(): factory evaluated");
  return function (target: any, context: ClassMethodDecoratorContext) {
    console.log("first(): decorator executed");
  };
}

function second() {
  console.log("second(): factory evaluated");
  return function (target: any, context: ClassMethodDecoratorContext) {
    console.log("second(): decorator executed");
  };
}

class Example {
  @first()
  @second()
  method() {}
}
```

**Output when this file is evaluated:**
```
first(): factory evaluated
second(): factory evaluated
second(): decorator executed
first(): decorator executed
```

**Line-by-line explanation:**
- `@first()`: The outer expression `first()` runs first, returning its decorator function.
- `@second()`: The inner expression `second()` runs second, returning its decorator function.
- Then, the JavaScript engine applies them in reverse order:
  - `second`'s decorator executes first on the original method.
  - `first`'s decorator executes second on the result of `second`.

---

### 4. How it works inside TypeScript
1. **Phase 1: Outer Evaluation**: Outer decorator expressions are evaluated top-to-bottom to obtain the decorator functions.
2. **Phase 2: Member Execution**:
   - Member decorators (methods, getters/setters, accessors, fields) are executed in the order they appear in source code, with multiple decorators on the same member running bottom-to-top.
3. **Phase 3: Class Execution**:
   - After all class members are decorated and installed, the class-level decorators execute bottom-to-top.

---

### 5. More examples

#### Example 1: Full Member vs Class Execution Trace
```typescript
function logStep(name: string) {
  return function (target: any, context: any) {
    console.log(`Executed: ${name} on ${String(context.name ?? "class")}`);
  };
}

@logStep("Class Decorator 1")
@logStep("Class Decorator 2")
class Demo {
  @logStep("Instance Field")
  prop: string = "val";

  @logStep("Instance Method")
  fn() {}

  @logStep("Static Method")
  static staticFn() {}
}
```
**Execution output:**
1. Member decorators execute in declaration order:
   - `Executed: Instance Field on prop`
   - `Executed: Instance Method on fn`
   - `Executed: Static Method on staticFn`
2. Class decorators execute bottom-to-top:
   - `Executed: Class Decorator 2 on class`
   - `Executed: Class Decorator 1 on class`

---

### 6. Common mistakes

#### Mistake 1: Expecting decorators to execute top-to-bottom
```typescript
// WRONG ASSUMPTION:
@outerDecorator // Expecting this to wrap innerDecorator's output, but expecting outer to run first!
@innerDecorator
method() {}
```
**Why it fails:** Remember $f(g(x))$. `innerDecorator` runs first, receiving the raw method. `outerDecorator` runs second, receiving the wrapper created by `innerDecorator`.

#### Mistake 2: Expecting decorators to execute during instance creation
```typescript
// WRONG: Expecting class/method decorators to run upon 'new MyClass()'
```
**Why it fails:** Decorators execute **once** when the class definition is first loaded and evaluated by the JavaScript engine, NOT when individual instances are created with `new`. (Initializer hooks `addInitializer` and field initializers run on `new`, but the decorator function itself runs at class definition time).

---

### 7. Rules to remember
1. Decorator factory expressions evaluate top-to-bottom.
2. Multiple decorators on the same member execute bottom-to-top.
3. All member decorators execute before class decorators execute.
4. Decorators execute once at class definition time, not on every `new` instantiation.

---

### Think first: Prediction puzzle
What is the exact sequence of numbers printed?

```typescript
function track(n: number) {
  console.log(`Eval ${n}`);
  return function (target: any, ctx: any) {
    console.log(`Exec ${n}`);
  };
}

class Test {
  @track(1)
  @track(2)
  run() {}
}
```

---

**Answer:**
```
Eval 1
Eval 2
Exec 2
Exec 1
```
**Execution trace:**
1. `track(1)` is evaluated: prints `Eval 1`.
2. `track(2)` is evaluated: prints `Eval 2`.
3. Decorators execute in reverse:
   - Decorator 2 executes: prints `Exec 2`.
   - Decorator 1 executes: prints `Exec 1`.

---

### Practice exercises

#### Exercise 1: Pipeline wrapper order verification
- **Task**: Create two decorators `@addHeader` and `@addFooter`. Apply `@addHeader` then `@addFooter` on `render(): string[]`. Verify which one wraps the other.
- **Hint 1**: The outer decorator wraps the inner decorator.

#### Exercise 2: Tracing static vs instance ordering
- **Task**: Write a class with a static field and an instance field, both decorated. Log `context.static` to confirm execution order.
- **Hint 1**: Instance members evaluate before static members in standard declaration order.

#### Exercise 3: Three-layer composition
- **Task**: Apply three decorators `@dec(1)`, `@dec(2)`, `@dec(3)` to a class. Predict and verify execution order.
- **Hint 1**: Execution order: 3, then 2, then 1.

#### Exercise 4: Guarding against undefined inputs in composed decorators
- **Task**: Write an outer decorator that handles the case where an inner decorator returned `undefined` (preserving original method).
- **Hint 1**: `target` passed to outer will be whatever inner returned (or original if `undefined`).

---

### Exercise solutions

#### Solution 1: Pipeline wrapper order verification
```typescript
function addHeader(target: any, ctx: ClassMethodDecoratorContext) {
  return function (this: any): string[] {
    return ["--- HEADER ---", ...target.call(this)];
  };
}

function addFooter(target: any, ctx: ClassMethodDecoratorContext) {
  return function (this: any): string[] {
    return [...target.call(this), "--- FOOTER ---"];
  };
}

class DocumentRenderer {
  @addHeader
  @addFooter
  render(): string[] {
    return ["Content body"];
  }
}

const doc = new DocumentRenderer();
console.log(doc.render());
// [ '--- HEADER ---', 'Content body', '--- FOOTER ---' ]
```

#### Solution 2: Tracing static vs instance ordering
```typescript
function traceScope(target: any, ctx: ClassFieldDecoratorContext) {
  console.log(`Field ${String(ctx.name)}, static: ${ctx.static}`);
}

class OrderingTest {
  @traceScope
  instanceVal = 1;

  @traceScope
  static staticVal = 2;
}
```

#### Solution 3: Three-layer composition
```typescript
function dec(id: number) {
  return function (target: any, ctx: ClassDecoratorContext) {
    console.log(`Class dec: ${id}`);
  };
}

@dec(1)
@dec(2)
@dec(3)
class DemoClass {}
// Output: Class dec: 3, Class dec: 2, Class dec: 1
```

#### Solution 4: Guarding against undefined inputs in composed decorators
```typescript
function safeWrapper(target: any, ctx: ClassMethodDecoratorContext) {
  return function (this: any, ...args: any[]) {
    return target ? target.apply(this, args) : undefined;
  };
}
```

---

### Recall
1. In what order do multiple decorator factories evaluate? Top-to-bottom.
2. In what order do the resulting decorator functions execute? Bottom-to-top.
3. Do member decorators execute before or after class decorators? Before.

> **If you remember only one thing:**  
> Decorator evaluation is top-to-bottom, while decorator execution is bottom-to-top ($f(g(x))$ composition).

---

# Topic 7: The `addInitializer` Lifecycle Hook (Instance vs Static Initializers)

### 1. What is it?
Every decorator `context` object in TC39 Stage 3 includes an **`addInitializer`** method:
```typescript
context.addInitializer(initializerFn: (this: This) => void): void
```
This hook schedules a callback function to run during object lifecycle initialization:
- On **instance members** (methods, accessors, fields): The callback executes inside the constructor when a new instance is created.
- On **static members**: The callback executes immediately after static class initialization.
- On **classes**: The callback executes immediately after the class constructor has been defined and decorated.

### 2. Why does it exist?
Previously, to automatically bind an instance method to `this` (the "autobind" pattern), libraries had to replace methods with getters or mutate the prototype in complex ways. With `context.addInitializer`, a decorator can cleanly bind the method or register the instance inside the constructor automatically.

### 3. Basic example

```typescript
function autobind<This, Args extends any[], Return>(
  target: (this: This, ...args: Args) => Return,
  context: ClassMethodDecoratorContext<This, (this: This, ...args: Args) => Return>
) {
  const methodName = context.name;

  context.addInitializer(function (this: This) {
    // This runs inside the constructor for each new instance!
    (this as any)[methodName] = target.bind(this);
  });
}

class ClickHandler {
  private message = "Button clicked";

  @autobind
  handleClick(): void {
    console.log(this.message);
  }
}

const handler = new ClickHandler();
// Extract method reference (tearing the method away from the object)
const extracted = handler.handleClick;

extracted(); // Logs "Button clicked" - does NOT throw undefined error!
```

**Line-by-line explanation:**
- `context.addInitializer(function (this: This) { ... })`: Registers a callback to be called during `new ClickHandler()` instantiation.
- `target.bind(this)`: Creates an arrow/bound function locked to the specific instance.
- `(this as any)[methodName] = ...`: Overrides the prototype method lookup on this specific instance.
- `extracted()`: Calling `extracted` standalone retains the correct `this.message` because it was bound inside the constructor.

---

### 4. How it works inside TypeScript
1. **Engine Scheduling**: When the TypeScript compiler outputs JavaScript for a decorated class, it inserts calls to registered initializers at the end of the constructor body (for instance members) or after class definition (for static members).
2. **Order of Execution**: If multiple initializers are registered across multiple members, they execute in declaration order.
3. **No Prototype Pollution**: Initializers operate directly on the instance (`this`), keeping the prototype clean.

---

### 5. More examples

#### Example 1: Instance tracking / Registry via `addInitializer`
```typescript
const liveInstances = new Set<any>();

function trackInstances<T extends new (...args: any[]) => any>(
  target: T,
  context: ClassDecoratorContext<T>
) {
  context.addInitializer(function (this: any) {
    console.log(`Class ${context.name} defined and initialized`);
  });
}
```

#### Example 2: Static member initializer
```typescript
function registerStaticCommand(
  target: Function,
  context: ClassMethodDecoratorContext
) {
  if (context.static) {
    context.addInitializer(function () {
      console.log(`Static command registered: ${String(context.name)}`);
    });
  }
}

class CliCommands {
  @registerStaticCommand
  static help() { return "usage: cli <command>"; }
}
```

---

### 6. Common mistakes

#### Mistake 1: Using an arrow function inside `context.addInitializer`
```typescript
// WRONG: Arrow function has lexical 'this'
context.addInitializer(() => {
  this.value = 10; // 'this' is undefined or global, NOT the class instance!
});
```
**Why it fails:** An arrow function captures lexical `this`. You must use `function (this: This) { ... }` so the engine can pass the newly created instance as `this`.

#### Mistake 2: Heavy computations in instance initializers
```typescript
// GOTCHA: Expensive synchronous work inside instance initializer
context.addInitializer(function (this: any) {
  syncDatabaseRead(); // Runs on EVERY single 'new MyClass()' invocation!
});
```
**Why it matters:** Instance initializers run on every object instantiation. Keep them lightweight (binding, subscription setup, registration).

---

### 7. Rules to remember
1. `context.addInitializer` accepts a standard `function (this: This) { ... }`.
2. For instance members, initializers run inside the constructor for each new instance.
3. For static members, initializers run once after static class evaluation.
4. Use `addInitializer` for autobinding, event listener attachment, or instance registration.

---

### Think first: Prediction puzzle
When does the initializer function execute?

```typescript
function onInit(target: any, context: ClassMethodDecoratorContext) {
  console.log("A");
  context.addInitializer(function () {
    console.log("B");
  });
}

class Demo {
  @onInit
  test() {}
}

console.log("C");
new Demo();
```

---

**Answer:**
```
A
C
B
```
**Execution trace:**
1. Class `Demo` definition evaluates: decorator runs and logs `"A"`.
2. Script proceeds to `console.log("C")`: logs `"C"`.
3. `new Demo()` runs constructor: executes registered initializer, logging `"B"`.

---

### Practice exercises

#### Exercise 1: Autobind decorator implementation
- **Task**: Write a `@bound` decorator that automatically binds any method to its instance using `context.addInitializer`.
- **Hint 1**: `context.addInitializer(function (this: any) { this[context.name] = target.bind(this); });`.

#### Exercise 2: Subscription cleanup registrar
- **Task**: Use `context.addInitializer` to attach an empty array `this.cleanupFns = []` to each instance.
- **Hint 1**: `(this as any).cleanupFns = [];`.

#### Exercise 3: Static initialization logger
- **Task**: Create a static method decorator that logs when static initialization completes.
- **Hint 1**: Check `if (context.static)` and call `context.addInitializer`.

#### Exercise 4: Disallow multiple autobindings on same method
- **Task**: Prevent `@bound` from being added twice by checking a symbol tag on the method.
- **Hint 1**: Check `if ((target as any).__isBound) return;`.

---

### Exercise solutions

#### Solution 1: Autobind decorator implementation
```typescript
function bound<This, Args extends any[], Return>(
  target: (this: This, ...args: Args) => Return,
  context: ClassMethodDecoratorContext<This, (this: This, ...args: Args) => Return>
) {
  const name = context.name;
  context.addInitializer(function (this: This) {
    (this as any)[name] = target.bind(this);
  });
}

class Counter {
  count = 0;
  @bound
  increment() { this.count++; }
}

const c = new Counter();
const inc = c.increment;
inc();
console.log(c.count); // 1
```

#### Solution 2: Subscription cleanup registrar
```typescript
function withCleanups(target: any, context: ClassDecoratorContext) {
  context.addInitializer(function (this: any) {
    this.cleanups = [];
    this.destroy = () => {
      this.cleanups.forEach((fn: Function) => fn());
      this.cleanups = [];
    };
  });
}
```

#### Solution 3: Static initialization logger
```typescript
function loggedStatic(target: any, context: ClassMethodDecoratorContext) {
  if (context.static) {
    context.addInitializer(function () {
      console.log(`Static method ${String(context.name)} ready`);
    });
  }
}
```

#### Solution 4: Disallow multiple autobindings on same method
```typescript
const BOUND_FLAG = Symbol("bound.flag");

function safeBound<This, Args extends any[], Return>(
  target: (this: This, ...args: Args) => Return,
  context: ClassMethodDecoratorContext<This, (this: This, ...args: Args) => Return>
) {
  if ((target as any)[BOUND_FLAG]) return;
  (target as any)[BOUND_FLAG] = true;

  const name = context.name;
  context.addInitializer(function (this: This) {
    (this as any)[name] = target.bind(this);
  });
}
```

---

### Recall
1. What does `context.addInitializer` do? Registers a callback to run during object initialization.
2. For instance members, when does the initializer execute? Inside the constructor when `new ClassName()` runs.
3. Why is `addInitializer` ideal for the `@autobind` decorator? Because it binds the method directly to the instance during constructor execution without messy prototype hacks.

> **If you remember only one thing:**  
> `context.addInitializer` hooks directly into instance construction or static class evaluation, executing callbacks with the proper `this`.

---

# Topic 8: Decorating Private `#fields` and `#methods`

### 1. What is it?
JavaScript hard private class elements (declared with a `#` prefix, such as `#privateField` or `#privateMethod()`) can be decorated using modern TC39 Stage 3 decorators. When a private member is decorated, `context.private` evaluates to `true`, and `context.access` provides private getter/setter accessor methods.

### 2. Why does it exist?
Legacy Stage 2 decorators could not decorate JavaScript `#private` fields because `#private` slots are internal engine references not accessible via strings on the prototype. Stage 3 decorators have first-class support for `#private` elements via the `context.access` interface.

### 3. Basic example

```typescript
function logPrivate<This, Args extends any[], Return>(
  target: (this: This, ...args: Args) => Return,
  context: ClassMethodDecoratorContext<This, (this: This, ...args: Args) => Return>
) {
  if (context.private) {
    console.log(`Decorating private member: ${String(context.name)}`);
  }

  return function (this: This, ...args: Args): Return {
    console.log(`[Private Call] Entering`);
    return target.call(this, ...args);
  };
}

class Vault {
  #secretKey = "super_secret_99";

  @logPrivate
  #getSecret(): string {
    return this.#secretKey;
  }

  reveal(): string {
    return this.#getSecret();
  }
}

const v = new Vault();
console.log(v.reveal());
```

**Line-by-line explanation:**
- `#getSecret()`: A true JavaScript private method. Inaccessible outside the class body.
- `@logPrivate`: Applied directly above the `#` private method.
- `context.private`: Evaluates to `true`.
- `target.call(this, ...args)`: Executes the private method implementation safely within the class scope.
- Outside code can only call `v.reveal()`, which delegates to the decorated `#getSecret()`.

---

### 4. How it works inside TypeScript
1. **`context.private: true`**: Informs the decorator that the member is hard-private.
2. **`context.access`**: Provides an object with:
   - `get(instance: This): Value`: Reads the private member on the provided instance.
   - `set(instance: This, val: Value): void`: Writes to the private member on the instance (if writable).
3. **Engine Encapsulation**: Private brand checks remain fully enforced by the JavaScript engine; external code cannot forge or inspect `#` members.

---

### 5. More examples

#### Example 1: Reading private field via `context.access.get`
```typescript
let privateReader: ((obj: any) => string) | null = null;

function exposePrivate(target: undefined, context: ClassFieldDecoratorContext) {
  if (context.private) {
    privateReader = (obj: any) => context.access.get(obj);
  }
}

class SecretBox {
  @exposePrivate
  #secret = "hidden_treasure";
}

const box = new SecretBox();
// External code using the authorized reader:
console.log(privateReader!(box)); // "hidden_treasure"
```

#### Example 2: Private auto-accessor validation
```typescript
function validatePositive(
  target: ClassAccessorDecoratorTarget<any, number>,
  context: ClassAccessorDecoratorContext
) {
  return {
    set(this: any, val: number) {
      if (val < 0) throw new Error("Must be positive");
      target.set.call(this, val);
    },
  };
}

class Account {
  @validatePositive
  accessor #balance: number = 0;

  deposit(amount: number) {
    this.#balance += amount;
  }

  get balance() {
    return this.#balance;
  }
}
```

---

### 6. Common mistakes

#### Mistake 1: Attempting to access private members via string indexing
```typescript
// WRONG: Trying to access #field with string index
(this as any)["#secret"]; // Returns undefined!
```
**Why it fails:** `#private` names are not string properties on the object. They are stored in private internal slots. You MUST use `context.access.get(this)` or direct `this.#secret` inside the class.

#### Mistake 2: Confusing TypeScript `private` with `#private`
```typescript
class Mixed {
  private tsPrivate = 1; // Soft private: context.private is FALSE!
  #jsPrivate = 2;        // Hard private: context.private is TRUE!
}
```
**Why it matters:** TypeScript's `private` keyword is purely a compile-time check and compiles to standard public properties. `#jsPrivate` is runtime private and sets `context.private: true`.

---

### 7. Rules to remember
1. `context.private` is `true` for members declared with `#`.
2. Use `context.access.get(instance)` and `context.access.set(instance, val)` to interact with private members.
3. TypeScript's `private` keyword produces `context.private: false`; only `#names` produce `context.private: true`.
4. Decorating `#private` members does not break the JavaScript runtime's hard privacy guarantees.

---

### Think first: Prediction puzzle
What does `context.private` log for `propA` vs `propB`?

```typescript
function checkPrivate(target: any, ctx: any) {
  console.log(`${String(ctx.name)}: ${ctx.private}`);
}

class Sample {
  @checkPrivate
  private propA: number = 1;

  @checkPrivate
  #propB: number = 2;
}
```

---

**Answer:**
```
propA: false
#propB: true
```
**Explanation:** `private propA` is TypeScript compile-time visibility; at runtime it is a regular public property, so `ctx.private` is `false`. `#propB` is an ECMAScript private field, so `ctx.private` is `true`.

---

### Practice exercises

#### Exercise 1: Private method invocation counter
- **Task**: Decorate a private method `#compute()` to count how many times it is called.
- **Hint 1**: Wrap `target.call(this, ...args)` and increment an external counter.

#### Exercise 2: Assert private member decorator
- **Task**: Create a decorator `@onlyPrivate` that throws an error at class evaluation time if `!context.private`.
- **Hint 1**: `if (!context.private) throw new Error("Must be private");`.

#### Exercise 3: Private accessor clamping
- **Task**: Apply a `@clamp` decorator to a private auto-accessor `accessor #pin: number`.
- **Hint 1**: Use `ClassAccessorDecoratorTarget<This, number>`.

#### Exercise 4: External testing bridge for private field
- **Task**: Write a decorator that exposes a private field getter to a test map indexed by instance.
- **Hint 1**: Store `context.access.get(instance)` in a `WeakMap`.

---

### Exercise solutions

#### Solution 1: Private method invocation counter
```typescript
let callCount = 0;

function countPrivateCalls<This, Args extends any[], Return>(
  target: (this: This, ...args: Args) => Return,
  context: ClassMethodDecoratorContext
) {
  return function (this: This, ...args: Args): Return {
    callCount++;
    return target.call(this, ...args);
  };
}

class InternalWorker {
  @countPrivateCalls
  #work() { return "done"; }
  run() { return this.#work(); }
}

new InternalWorker().run();
console.log("Calls:", callCount); // 1
```

#### Solution 2: Assert private member decorator
```typescript
function onlyPrivate(target: any, context: ClassMemberDecoratorContext) {
  if (!context.private) {
    throw new Error(`Decorator @onlyPrivate cannot be applied to public ${String(context.name)}`);
  }
}
```

#### Solution 3: Private accessor clamping
```typescript
function clampPin(target: ClassAccessorDecoratorTarget<any, number>, context: ClassAccessorDecoratorContext) {
  return {
    set(this: any, val: number) {
      const clamped = Math.max(1000, Math.min(9999, val));
      target.set.call(this, clamped);
    },
  };
}

class ATM {
  @clampPin
  accessor #pin: number = 1000;
}
```

#### Solution 4: External testing bridge for private field
```typescript
const testBridge = new WeakMap<object, () => any>();

function bridgeForTesting(target: undefined, context: ClassFieldDecoratorContext) {
  context.addInitializer(function (this: any) {
    testBridge.set(this, () => context.access.get(this));
  });
}
```

---

### Recall
1. How do you detect if a decorated member is a JavaScript private field? Check `context.private === true`.
2. How can a decorator read or write a `#private` field without direct lexical access? Using `context.access.get(instance)` and `context.access.set(instance, val)`.
3. What is the difference between `private x` and `#x` in modern TypeScript? `private x` is compile-time only (public at runtime); `#x` is enforced by the JavaScript engine at runtime.

> **If you remember only one thing:**  
> Stage 3 decorators natively support ECMAScript `#private` members through `context.private: true` and the `context.access` API.

---

# Topic 9: Decorator Metadata with `context.metadata` (TS 5.2+ and `Symbol.metadata`)

### 1. What is it?
In TypeScript 5.2+, every decorator `context` object contains a **`context.metadata`** object. This metadata dictionary is attached to the class constructor under the well-known symbol **`Symbol.metadata`**. Decorators can read and attach arbitrary typed metadata to this object at compile time and inspect it at runtime.

### 2. Why does it exist?
Historically, storing metadata required the third-party `reflect-metadata` polyfill (`Reflect.defineMetadata`, `Reflect.getMetadata`). The TC39 Decorator Metadata proposal standardized metadata storage directly into the JavaScript language, eliminating the need for heavy external polyfills.

### 3. Basic example

```typescript
// Polyfill Symbol.metadata if not natively present in environment
(Symbol as any).metadata ??= Symbol("Symbol.metadata");

interface RouteMeta {
  path: string;
  method: "GET" | "POST";
}

function get(path: string) {
  return function <This, Args extends any[], Return>(
    target: (this: This, ...args: Args) => Return,
    context: ClassMethodDecoratorContext
  ) {
    // context.metadata is a shared object for the entire class!
    context.metadata[context.name] = { path, method: "GET" };
    return target;
  };
}

class UserController {
  @get("/api/users")
  listUsers() {
    return ["Alice", "Bob"];
  }
}

// Inspecting metadata from the class constructor:
const metadata = (UserController as any)[Symbol.metadata];
console.log(metadata["listUsers"]); // { path: "/api/users", method: "GET" }
```

**Line-by-line explanation:**
- `(Symbol as any).metadata ??= Symbol(...)`: Ensures `Symbol.metadata` exists in the runtime environment.
- `context.metadata[context.name] = { path, method: "GET" }`: Reads the shared metadata dictionary provided on `context` and stores routing details indexed by method name.
- `(UserController as any)[Symbol.metadata]`: At runtime, the JavaScript engine attaches the accumulated metadata object directly to the class constructor.
- Web frameworks and IoC containers can inspect this metadata to automatically register HTTP endpoints.

---

### 4. How it works inside TypeScript
1. **Shared Prototype Object**: `context.metadata` is identical across all member decorators applied to the same class.
2. **Prototype Inheritance**: If `SubClass extends BaseClass`, `(SubClass as any)[Symbol.metadata]` inherits from `(BaseClass as any)[Symbol.metadata]` via standard prototype delegation (`Object.create(BaseClass[Symbol.metadata])`).
3. **No Polyfill Required**: No `import "reflect-metadata"` is needed in TypeScript 5.2+ when `target` is configured for modern runtimes.

---

### 5. More examples

#### Example 1: Accumulating parameter validation rules
```typescript
interface ValidationRules {
  [propertyKey: string]: { required?: boolean; min?: number };
}

function required(target: undefined, context: ClassFieldDecoratorContext) {
  const meta = (context.metadata.validation ??= {}) as ValidationRules;
  meta[String(context.name)] = { ...meta[String(context.name)], required: true };
}

function min(val: number) {
  return function (target: undefined, context: ClassFieldDecoratorContext) {
    const meta = (context.metadata.validation ??= {}) as ValidationRules;
    meta[String(context.name)] = { ...meta[String(context.name)], min: val };
  };
}

class Product {
  @required
  name!: string;

  @min(1)
  price!: number;
}

const prodMeta = (Product as any)[Symbol.metadata]?.validation;
console.log(prodMeta);
// { name: { required: true }, price: { min: 1 } }
```

#### Example 2: Inspecting metadata across subclasses
```typescript
class BaseEntity {}
class OrderEntity extends BaseEntity {}

// OrderEntity[Symbol.metadata] inherits from BaseEntity[Symbol.metadata]
```

---

### 6. Common mistakes

#### Mistake 1: Overwriting `context.metadata` completely
```typescript
// WRONG: Replacing context.metadata replaces it for all other decorators!
context.metadata = { myMeta: 123 }; // Destroys metadata stored by other decorators!
```
**Why it fails:** `context.metadata` is a shared object. Always mutate or namespace it (`context.metadata.myNamespace = ...`) instead of reassigning the reference.

#### Mistake 2: Missing `Symbol.metadata` polyfill in older runtimes
```typescript
// GOTCHA: In Node 18 or older browsers, Symbol.metadata is undefined by default!
```
**Why it matters:** In environments that do not natively declare `Symbol.metadata`, include `(Symbol as any).metadata ??= Symbol("Symbol.metadata");` at application startup.

---

### 7. Rules to remember
1. `context.metadata` is a plain JavaScript object shared across all decorators of a class.
2. The engine attaches this object to `ClassConstructor[Symbol.metadata]`.
3. Subclasses inherit parent class metadata through prototypical inheritance.
4. Namespace your metadata keys to prevent collisions with other decorators.

---

### Think first: Prediction puzzle
What does `Child[Symbol.metadata].role` output?

```typescript
(Symbol as any).metadata ??= Symbol("Symbol.metadata");

function setRole(role: string) {
  return function (target: any, context: ClassDecoratorContext) {
    context.metadata.role = role;
  };
}

@setRole("parent_role")
class Parent {}

class Child extends Parent {}

console.log((Child as any)[Symbol.metadata]?.role);
```

---

**Answer:**
```
parent_role
```
**Explanation:** When `Child` extends `Parent`, JavaScript sets `Child[Symbol.metadata] = Object.create(Parent[Symbol.metadata])`. Accessing `.role` delegates through the prototype chain to `Parent`'s metadata.

---

### Practice exercises

#### Exercise 1: Roles-allowed authorization metadata
- **Task**: Create a method decorator `@roles("admin", "editor")` that stores the allowed roles in `context.metadata[context.name].roles`.
- **Hint 1**: `context.metadata[context.name] = { roles };`.

#### Exercise 2: OpenApi summary metadata
- **Task**: Write `@summary(text: string)` that stores an endpoint summary string on the method's metadata.
- **Hint 1**: Mutate `context.metadata[context.name]`.

#### Exercise 3: Read class metadata helper
- **Task**: Write a utility function `getClassMetadata(ctor: Function): Record<string, any>` that safely retrieves `[Symbol.metadata]`.
- **Hint 1**: `return (ctor as any)[Symbol.metadata] ?? {};`.

#### Exercise 4: Merge metadata from multiple decorators
- **Task**: Apply both `@roles("admin")` and `@summary("Delete user")` to a method and assert both keys exist on the method's metadata.
- **Hint 1**: Ensure neither decorator overwrites the other's object.

---

### Exercise solutions

#### Solution 1: Roles-allowed authorization metadata
```typescript
function roles(...allowed: string[]) {
  return function (target: any, context: ClassMethodDecoratorContext) {
    const meta = (context.metadata[context.name] ??= {}) as any;
    meta.roles = allowed;
  };
}
```

#### Solution 2: OpenApi summary metadata
```typescript
function summary(text: string) {
  return function (target: any, context: ClassMethodDecoratorContext) {
    const meta = (context.metadata[context.name] ??= {}) as any;
    meta.summary = text;
  };
}
```

#### Solution 3: Read class metadata helper
```typescript
function getClassMetadata(ctor: Function): Record<string, any> {
  return (ctor as any)[Symbol.metadata] ?? {};
}
```

#### Solution 4: Merge metadata from multiple decorators
```typescript
class AdminController {
  @roles("superadmin")
  @summary("Permanently purge database records")
  purge() {}
}

const purgeMeta = (AdminController as any)[Symbol.metadata]?.purge;
console.log(purgeMeta?.roles);   // ["superadmin"]
console.log(purgeMeta?.summary); // "Permanently purge database records"
```

---

### Recall
1. Where does the JavaScript engine attach the accumulated metadata? On `ClassConstructor[Symbol.metadata]`.
2. How do subclasses interact with parent class metadata? Subclasses inherit parent metadata via prototype delegation (`Object.create`).
3. Does modern decorator metadata require `reflect-metadata`? No; `Symbol.metadata` is part of standard TC39 Stage 3 (TS 5.2+).

> **If you remember only one thing:**  
> `context.metadata` provides a standardized, polyfill-free way to attach and read metadata via `ClassConstructor[Symbol.metadata]`.

---

# Topic 10: Designing a Parameterized Decorator Factory

### 1. What is it?
A **Decorator Factory** is a higher-order function that accepts configuration arguments and returns the actual decorator function. This allows decorators to be customized at the call site: `@throttle(500)`, `@log({ level: "debug" })`, or `@column({ nullable: false })`.

### 2. Why does it exist?
Standard decorator functions cannot accept custom arguments directly because the JavaScript engine always calls them with `(target, context)`. A decorator factory provides a closure over your custom arguments.

### 3. Basic example

```typescript
interface CacheOptions {
  ttlMs: number;
}

// The Decorator Factory takes custom parameters
function cache(options: CacheOptions) {
  const cacheMap = new Map<string, { value: any; expiry: number }>();

  // Returns the actual Stage 3 decorator function
  return function <This, Args extends any[], Return>(
    target: (this: This, ...args: Args) => Return,
    context: ClassMethodDecoratorContext<This, (this: This, ...args: Args) => Return>
  ) {
    return function (this: This, ...args: Args): Return {
      const key = JSON.stringify(args);
      const cached = cacheMap.get(key);
      const now = Date.now();

      if (cached && cached.expiry > now) {
        console.log(`[Cache Hit] TTL remaining: ${cached.expiry - now}ms`);
        return cached.value;
      }

      const result = target.call(this, ...args);
      cacheMap.set(key, { value: result, expiry: now + options.ttlMs });
      return result;
    };
  };
}

class WeatherService {
  @cache({ ttlMs: 1000 })
  getTemperature(city: string): number {
    console.log(`Calculating temperature for ${city}...`);
    return 22.5;
  }
}

const weather = new WeatherService();
weather.getTemperature("Berlin"); // Calculates
weather.getTemperature("Berlin"); // Cache hit!
```

**Line-by-line explanation:**
- `function cache(options: CacheOptions)`: The outer factory taking configuration arguments.
- `return function <This, Args, Return>(target, context)`: Returns the decorator itself.
- `const cacheMap = new Map(...)`: Scoped to the decorator instance via closure.
- `@cache({ ttlMs: 1000 })`: Calling `cache(...)` evaluates the factory and attaches the returned decorator to `getTemperature`.

---

### 4. How it works inside TypeScript
1. **Closure Scoping**: Variables declared inside the factory (like `cacheMap` or `options`) are retained in memory across method invocations.
2. **Two-Stage Typing**: The outer function types the configuration options; the inner function types the target and context.
3. **Syntax Requirement**: Decorator factories MUST be invoked with parentheses at the call site (`@myFactory()`). Omitting parentheses is a compile error.

---

### 5. More examples

#### Example 1: Rate limiting / Throttle decorator factory
```typescript
function throttle(intervalMs: number) {
  return function <This, Args extends any[], Return>(
    target: (this: This, ...args: Args) => Return,
    context: ClassMethodDecoratorContext
  ) {
    let lastTime = 0;

    return function (this: This, ...args: Args): Return | undefined {
      const now = Date.now();
      if (now - lastTime < intervalMs) {
        console.warn(`Throttled: call ignored (interval: ${intervalMs}ms)`);
        return undefined;
      }
      lastTime = now;
      return target.call(this, ...args);
    };
  };
}
```

#### Example 2: Configurable HTTP Route decorator factory
```typescript
interface RouteConfig {
  path: string;
  statusCode?: number;
}

function post(config: RouteConfig) {
  return function (target: any, context: ClassMethodDecoratorContext) {
    (context.metadata[context.name] ??= {}) = {
      httpMethod: "POST",
      path: config.path,
      statusCode: config.statusCode ?? 200,
    };
  };
}
```

---

### 6. Common mistakes

#### Mistake 1: Forgetting parentheses when applying a factory
```typescript
// WRONG: Applying factory without invoking it
class BadService {
  @cache // Error! Passes target to cache instead of the returned decorator!
  fetch() {}
}
```
**Why it fails:** If `cache` is a factory, writing `@cache` passes `fetch` as `options`, which causes a runtime type error. Always write `@cache({ ttlMs: 500 })`.

#### Mistake 2: Re-instantiating shared state inside the replacement function
```typescript
// WRONG: Re-creating state on every invocation
function badCache(ttl: number) {
  return function (target: any, ctx: any) {
    return function (this: any, ...args: any[]) {
      const cacheMap = new Map(); // Re-created on every single call! Never caches anything!
    };
  };
}
```
**Why it fails:** State meant to be shared across calls must live in the factory or decorator closure, not inside the returned replacement function.

---

### 7. Rules to remember
1. A decorator factory wraps the decorator in an outer function that returns the decorator.
2. Always apply decorator factories with parentheses: `@factory(arg)`.
3. Persistent state (caches, timers) must live in the factory closure, not inside the inner replacement function.
4. Strongly type the factory options interface for complete IDE auto-completion.

---

### Think first: Prediction puzzle
What happens when this snippet runs?

```typescript
function prefix(tag: string) {
  return function (target: any, ctx: any) {
    return function (this: any, msg: string) {
      return `[${tag}] ${target.call(this, msg)}`;
    };
  };
}

class Logger {
  @prefix("INFO")
  log(msg: string) { return msg; }
}

const l = new Logger();
console.log(l.log("System started"));
```

---

**Answer:**
```
[INFO] System started
```
**Execution trace:**
1. `@prefix("INFO")` evaluates, capturing `tag = "INFO"`.
2. `l.log("System started")` runs the decorator replacement function.
3. `target.call(this, msg)` returns `"System started"`.
4. Returns `"[INFO] System started"`.

---

### Practice exercises

#### Exercise 1: Retry decorator factory with exponential backoff
- **Task**: Write a decorator factory `@retryWithBackoff({ maxRetries: number, delayMs: number })`.
- **Hint 1**: `await new Promise(r => setTimeout(r, delayMs * Math.pow(2, attempt)))`.

#### Exercise 2: Prefix decorator factory
- **Task**: Create `@prepend(prefixStr: string)` that prefixes the string return value of a method.
- **Hint 1**: `return `${prefixStr}${target.call(this, ...args)}``.

#### Exercise 3: Parameterized timeout decorator factory
- **Task**: Write `@timeout(ms: number)` that rejects a Promise if the method doesn't resolve within `ms` milliseconds.
- **Hint 1**: Use `Promise.race([target.call(this, ...args), new Promise((_, rej) => setTimeout(rej, ms))])`.

#### Exercise 4: Configurable deprecation warning factory
- **Task**: Create `@deprecated({ message: string, sinceVersion: string })` that logs a warning on the first invocation only.
- **Hint 1**: Store a `let warned = false` flag in the decorator closure.

---

### Exercise solutions

#### Solution 1: Retry decorator factory with exponential backoff
```typescript
interface RetryOptions {
  maxRetries: number;
  delayMs: number;
}

function retryWithBackoff(opts: RetryOptions) {
  return function <This, Args extends any[], Return>(
    target: (this: This, ...args: Args) => Promise<Return>,
    context: ClassMethodDecoratorContext
  ) {
    return async function (this: This, ...args: Args): Promise<Return> {
      let attempt = 0;
      while (true) {
        try {
          return await target.call(this, ...args);
        } catch (err) {
          attempt++;
          if (attempt >= opts.maxRetries) throw err;
          await new Promise((r) => setTimeout(r, opts.delayMs * Math.pow(2, attempt - 1)));
        }
      }
    };
  };
}
```

#### Solution 2: Prefix decorator factory
```typescript
function prepend(prefixStr: string) {
  return function <This, Args extends any[]>(
    target: (this: This, ...args: Args) => string,
    context: ClassMethodDecoratorContext
  ) {
    return function (this: This, ...args: Args): string {
      return `${prefixStr} ${target.call(this, ...args)}`;
    };
  };
}
```

#### Solution 3: Parameterized timeout decorator factory
```typescript
function timeout(ms: number) {
  return function <This, Args extends any[], Return>(
    target: (this: This, ...args: Args) => Promise<Return>,
    context: ClassMethodDecoratorContext
  ) {
    return async function (this: This, ...args: Args): Promise<Return> {
      const timer = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error(`Timeout after ${ms}ms`)), ms)
      );
      return Promise.race([target.call(this, ...args), timer]);
    };
  };
}
```

#### Solution 4: Configurable deprecation warning factory
```typescript
interface DeprecateConfig {
  message: string;
  sinceVersion: string;
}

function deprecated(cfg: DeprecateConfig) {
  return function <This, Args extends any[], Return>(
    target: (this: This, ...args: Args) => Return,
    context: ClassMethodDecoratorContext
  ) {
    let hasWarned = false;
    const name = String(context.name);
    return function (this: This, ...args: Args): Return {
      if (!hasWarned) {
        console.warn(`[DEPRECATION] ${name} is deprecated since v${cfg.sinceVersion}: ${cfg.message}`);
        hasWarned = true;
      }
      return target.call(this, ...args);
    };
  };
}
```

---

### Recall
1. What is a decorator factory? A function that takes arguments and returns a decorator function.
2. Where should persistent state (such as caches or timers) be stored? In the factory or decorator closure.
3. What happens if you omit the invocation parentheses on a decorator factory? The factory itself is passed as the decorator, causing a runtime crash.

> **If you remember only one thing:**  
> A decorator factory is a function that returns a decorator, allowing custom parameters to be passed via closures.

---

# Checkpoint Challenge 2: Decorator Metadata & Auto-Accessors (Topics 6-10)

### Challenge Specification
Construct an API Controller Router Generator that:
1. Uses a **Decorator Factory** `@route("GET" | "POST", path)` to attach HTTP routing metadata to methods using `context.metadata`.
2. Uses an **Auto-Accessor Decorator** `@secured` that asserts the caller has an active auth token.
3. Employs `context.addInitializer` to automatically bind route methods.
4. Generates an executable route manifest from a class constructor.

### Solution

```typescript
// Polyfill Symbol.metadata
(Symbol as any).metadata ??= Symbol("Symbol.metadata");

// 1. Route Metadata Types & Decorator Factory
type HttpMethod = "GET" | "POST" | "PUT" | "DELETE";

interface RouteInfo {
  method: HttpMethod;
  path: string;
  handlerName: string;
}

function route(method: HttpMethod, path: string) {
  return function <This, Args extends any[], Return>(
    target: (this: This, ...args: Args) => Return,
    context: ClassMethodDecoratorContext<This, (this: This, ...args: Args) => Return>
  ) {
    // 1. Store metadata
    const routes = ((context.metadata.routes ??= []) as RouteInfo[]);
    routes.push({ method, path, handlerName: String(context.name) });

    // 2. Autobind handler via addInitializer
    const name = context.name;
    context.addInitializer(function (this: This) {
      (this as any)[name] = target.bind(this);
    });

    return target;
  };
}

// 2. Secured Auto-Accessor
function secured<This>(
  target: ClassAccessorDecoratorTarget<This, boolean>,
  context: ClassAccessorDecoratorContext<This, boolean>
): ClassAccessorDecoratorResult<This, boolean> {
  return {
    set(this: This, val: boolean) {
      console.log(`[Security] Auth status updated to: ${val}`);
      target.set.call(this, val);
    },
  };
}

// 3. Controller Implementation
class ApiOrderController {
  @secured
  accessor isAuthenticated: boolean = true;

  @route("GET", "/orders")
  getOrders(): string[] {
    return ["order_1", "order_2"];
  }

  @route("POST", "/orders")
  createOrder(): string {
    return "created_order_3";
  }
}

// 4. Manifest Generator inspecting Symbol.metadata
function generateRouteManifest(controllerCtor: Function): RouteInfo[] {
  const meta = (controllerCtor as any)[Symbol.metadata];
  return meta?.routes ?? [];
}

// 5. Verification Execution
function runCheckpoint2() {
  const manifest = generateRouteManifest(ApiOrderController);
  console.log("Extracted Routes:", manifest);

  const ctrl = new ApiOrderController();
  // Verify autobind
  const getOrdersFn = ctrl.getOrders;
  console.log("Invoking torn-off getOrders():", getOrdersFn());

  // Verify accessor decorator
  ctrl.isAuthenticated = false;
}
runCheckpoint2();
```


---

# Topic 11: Inversion of Control (IoC) and Dependency Injection Fundamentals

### 1. What is it?
**Inversion of Control (IoC)** is a software architecture principle in which the control of object creation and lifecycle management is transferred from the individual class to a centralized container or framework. **Dependency Injection (DI)** is the primary mechanism used to achieve IoC: instead of a class instantiating its own dependencies using `new`, the dependencies are passed (injected) into its constructor or properties.

### 2. Why does it exist?
When classes instantiate their own dependencies, they become tightly coupled to specific implementations:
```typescript
// Anti-pattern: Hard-coded instantiation (Tightly coupled)
class OrderProcessor {
  private repo = new PostgresOrderRepository(); // Cannot be unit tested without a live Postgres DB!
  private emailer = new SendGridEmailClient();  // Will send real emails during unit tests!
}
```
With Dependency Injection, `OrderProcessor` depends on abstract interfaces (`OrderRepository`, `EmailClient`). At runtime in production, the IoC container supplies real database clients; in unit tests, test suites supply in-memory fakes.

### 3. Basic example

```typescript
// 1. Service Abstractions (Interfaces)
interface DatabaseClient {
  query(sql: string): any[];
}

interface NotificationClient {
  send(to: string, msg: string): void;
}

// 2. Concrete Production Implementations
class SqlDatabase implements DatabaseClient {
  query(sql: string): any[] {
    return [{ id: 1, name: "Order #1" }];
  }
}

class EmailNotifier implements NotificationClient {
  send(to: string, msg: string): void {
    console.log(`Email to ${to}: ${msg}`);
  }
}

// 3. Dependent Domain Class with Constructor Injection
class OrderService {
  constructor(
    private db: DatabaseClient,
    private notifier: NotificationClient
  ) {}

  processOrder(userId: string): void {
    const orders = this.db.query("SELECT * FROM orders");
    this.notifier.send(userId, `Processed ${orders.length} orders`);
  }
}

// 4. Manual Dependency Injection
const productionDb = new SqlDatabase();
const productionNotifier = new EmailNotifier();

const orderService = new OrderService(productionDb, productionNotifier);
orderService.processOrder("user_101");
```

**Line-by-line explanation:**
- `interface DatabaseClient`, `NotificationClient`: Abstract contracts that define capabilities without binding to concrete classes.
- `constructor(private db: DatabaseClient, private notifier: NotificationClient)`: The constructor requests its dependencies. It does not instantiate them.
- `new OrderService(productionDb, productionNotifier)`: Dependencies are created externally and injected into the constructor.
- In a unit test, you can pass mock objects (`{ query: () => [] }`) without touching the filesystem or network.

---

### 4. How it works inside TypeScript
1. **Interface Polymorphism**: Any class satisfying `DatabaseClient` can be injected without changing `OrderService`.
2. **Structural Subtyping**: Mocks and fakes do not need to inherit from concrete classes—they only need to match the interface shape.
3. **Inversion of Creation**: The caller (or IoC container) dictates which implementations are provided, enabling painless reconfiguration across environments.

---

### 5. More examples

#### Example 1: Unit testing with lightweight mocks
```typescript
class MockDatabase implements DatabaseClient {
  queryCount = 0;
  query(sql: string): any[] {
    this.queryCount++;
    return [{ id: 99, name: "Mock Order" }];
  }
}

class MockNotifier implements NotificationClient {
  messages: string[] = [];
  send(to: string, msg: string): void {
    this.messages.push(msg);
  }
}

// Fast in-memory unit test:
const mockDb = new MockDatabase();
const mockNotifier = new MockNotifier();
const testService = new OrderService(mockDb, mockNotifier);

testService.processOrder("test_user");
console.log(mockDb.queryCount === 1);               // true
console.log(mockNotifier.messages[0].includes("1")); // true
```

#### Example 2: Property (Field) Injection vs Constructor Injection
```typescript
// Constructor Injection (RECOMMENDED: guarantees dependencies exist before any method runs)
class ReportGenerator {
  constructor(private db: DatabaseClient) {}
}

// Property Injection (Acceptable for optional dependencies or plugin architectures)
class PluginHost {
  public logger?: NotificationClient;
}
```

---

### 6. Common mistakes

#### Mistake 1: Service Locator Anti-Pattern
```typescript
// ANTI-PATTERN: Service Locator
class BadOrderService {
  private db: DatabaseClient;
  constructor() {
    this.db = GlobalServiceLocator.get<DatabaseClient>("db"); // Hidden dependency!
  }
}
```
**Why it fails:** The Service Locator hides class dependencies inside the constructor body. Anyone reading `new BadOrderService()` assumes it requires no arguments, only to suffer runtime crashes if `GlobalServiceLocator` hasn't been pre-configured. Constructor injection makes dependencies explicit.

#### Mistake 2: Depending on concrete classes instead of interfaces
```typescript
// WRONG: Constructor typed with concrete Postgres class
constructor(private db: PostgresDatabase) {} // Coupled directly to Postgres!
```
**Why it fails:** You cannot pass a `MockDatabase` or `MySqlDatabase` because TypeScript checks compatibility against the specific `PostgresDatabase` class. Always type parameters against generic interfaces.

---

### 7. Rules to remember
1. Always prefer Constructor Injection over Property Injection.
2. Type constructor dependencies against interfaces or abstract classes, never concrete vendor classes.
3. Do not instantiate dependencies with `new` inside domain business services.
4. Avoid the Service Locator anti-pattern (`Container.get()` inside domain classes).

---

### Think first: Prediction puzzle
Does the following code allow swapping implementations without modifying `Calculator`?

```typescript
interface MathOp {
  execute(a: number, b: number): number;
}

class Calculator {
  constructor(private op: MathOp) {}
  compute(x: number, y: number) { return this.op.execute(x, y); }
}

const add: MathOp = { execute: (a, b) => a + b };
const mul: MathOp = { execute: (a, b) => a * b };

console.log(new Calculator(add).compute(3, 4));
console.log(new Calculator(mul).compute(3, 4));
```

---

**Answer:**
```
7
12
```
**Explanation:** `Calculator` is completely decoupled from the arithmetic implementation. Passing `add` computes $3+4=7$; passing `mul` computes $3 \times 4=12$.

---

### Practice exercises

#### Exercise 1: Logger interface injection
- **Task**: Create an interface `Logger { log(msg: string): void }`. Write a `PaymentService` that requires `Logger` in its constructor and logs when payments occur.
- **Hint 1**: `constructor(private logger: Logger) {}`.

#### Exercise 2: Mock dependency test
- **Task**: Write a unit test for `PaymentService` using an object literal `{ log: (m) => logs.push(m) }`.
- **Hint 1**: Verify `logs.length === 1`.

#### Exercise 3: Default fallback injection
- **Task**: Allow `Logger` to be optional in the constructor, defaulting to `new ConsoleLogger()` if omitted.
- **Hint 1**: `constructor(private logger: Logger = new ConsoleLogger()) {}`.

#### Exercise 4: Multi-dependency constructor
- **Task**: Write a service `UserProfileService` that accepts `UserRepository`, `AuditService`, and `EmailClient`.
- **Hint 1**: Declare all three in constructor parameter properties.

---

### Exercise solutions

#### Solution 1: Logger interface injection
```typescript
interface Logger {
  log(msg: string): void;
}

class PaymentService {
  constructor(private logger: Logger) {}

  pay(amount: number): void {
    this.logger.log(`Processing payment of $${amount}`);
  }
}
```

#### Solution 2: Mock dependency test
```typescript
const logs: string[] = [];
const mockLogger: Logger = {
  log(msg: string) { logs.push(msg); }
};

const service = new PaymentService(mockLogger);
service.pay(100);
console.log(logs.length === 1 && logs[0].includes("100")); // true
```

#### Solution 3: Default fallback injection
```typescript
class ConsoleLogger implements Logger {
  log(msg: string): void { console.log(`[LOG] ${msg}`); }
}

class FlexiblePaymentService {
  constructor(private logger: Logger = new ConsoleLogger()) {}
  pay(amt: number) { this.logger.log(`Paid ${amt}`); }
}
```

#### Solution 4: Multi-dependency constructor
```typescript
interface UserRepository { getUser(id: string): any; }
interface AuditService { record(action: string): void; }
interface EmailClient { send(to: string): void; }

class UserProfileService {
  constructor(
    private users: UserRepository,
    private audit: AuditService,
    private emails: EmailClient
  ) {}
}
```

---

### Recall
1. What is the difference between Inversion of Control and Dependency Injection? IoC is the architectural principle; Dependency Injection is the practical technique of passing dependencies from the outside.
2. Why is Constructor Injection preferred over Property Injection? It guarantees that the object is fully formed and ready to use immediately after construction.
3. Why should dependencies be typed with interfaces? To enable swapping implementations and injecting test doubles without code changes.

> **If you remember only one thing:**  
> Inversion of Control means classes receive their dependencies from the outside via constructor parameters rather than creating them with `new`.

---

# Topic 12: Building a Custom IoC Container: Token-Based and Service Registration

### 1. What is it?
An **IoC Container** is a central registry that stores service recipes (factories, classes, or values) and resolves entire dependency graphs recursively. In TypeScript, because interfaces are erased at runtime, dependencies are identified using **Tokens** (unique `Symbol` or string identifiers).

### 2. Why does it exist?
While manual dependency injection works for small apps, in enterprise architectures with dozens of nested services:
```typescript
const service = new OrderService(
  new PostgresRepo(new ConnectionPool(new ConfigLoader())),
  new SendGridNotifier(new HttpClient(new RetryPolicy()))
);
```
Manual instantiation becomes deeply tedious. An IoC container automates resolution: `container.resolve(OrderService)`.

### 3. Basic example

```typescript
// 1. Injection Token Definition
type InjectionToken<T> = string | symbol | (new (...args: any[]) => T);

// 2. The IoC Container
class Container {
  private registry = new Map<InjectionToken<any>, () => any>();

  // Register a factory function
  registerFactory<T>(token: InjectionToken<T>, factory: (c: Container) => T): void {
    this.registry.set(token, () => factory(this));
  }

  // Register a fixed value or instance
  registerInstance<T>(token: InjectionToken<T>, instance: T): void {
    this.registry.set(token, () => instance);
  }

  // Resolve a token recursively
  resolve<T>(token: InjectionToken<T>): T {
    const factory = this.registry.get(token);
    if (!factory) {
      // If token is a class constructor that has no registered factory, try instantiating directly
      if (typeof token === "function") {
        return new (token as new () => T)();
      }
      throw new Error(`No provider registered for token: ${String(token)}`);
    }
    return factory();
  }
}

// 3. Usage
const TOKENS = {
  Config: Symbol.for("app.config"),
  Database: Symbol.for("app.database"),
};

interface AppConfig {
  dbUrl: string;
}

class Database {
  constructor(public config: AppConfig) {}
}

const container = new Container();

// Register dependencies
container.registerInstance<AppConfig>(TOKENS.Config, { dbUrl: "postgres://localhost" });
container.registerFactory(TOKENS.Database, (c) => new Database(c.resolve<AppConfig>(TOKENS.Config)));

// Resolve full graph automatically!
const db = container.resolve<Database>(TOKENS.Database);
console.log(db.config.dbUrl); // "postgres://localhost"
```

**Line-by-line explanation:**
- `type InjectionToken<T>`: Represents a key used to locate a provider. It preserves the expected return type `T`.
- `this.registry = new Map<...>`: Maps tokens to zero-argument factory functions.
- `registerFactory(token, factory)`: Passes the container `(c: Container)` to the factory so it can resolve sub-dependencies recursively.
- `c.resolve<AppConfig>(TOKENS.Config)`: Dynamically fetches nested dependencies during resolution.

---

### 4. How it works inside TypeScript
1. **Type Erasure Problem**: In TypeScript, `interface Config` does not exist in the compiled JavaScript. Therefore, `container.resolve(Config)` is invalid JavaScript.
2. **Tokens as Runtime Proxies**: `Symbol.for("token")` exists at runtime and bridges the gap.
3. **Generic Return Typing**: `resolve<T>(token: InjectionToken<T>): T` tells the compiler what type to return at the call site.

---

### 5. More examples

#### Example 1: Strongly typed Token helper
```typescript
class Token<T> {
  readonly _type!: T; // Phantom type to tie token to its service type
  constructor(public readonly description: string) {}
}

const USER_SERVICE_TOKEN = new Token<UserService>("UserService");

class TypedContainer {
  private map = new Map<Token<any>, any>();

  register<T>(token: Token<T>, value: T): void {
    this.map.set(token, value);
  }

  resolve<T>(token: Token<T>): T {
    const res = this.map.get(token);
    if (!res) throw new Error(`Missing: ${token.description}`);
    return res;
  }
}
```

#### Example 2: Class constructor self-registration
```typescript
class LoggerService {
  log(msg: string) { console.log(msg); }
}

const c = new Container();
// Resolving an unregistered class constructor instantiates it directly
const logger = c.resolve(LoggerService);
logger.log("Hello from auto-instantiated class");
```

---

### 6. Common mistakes

#### Mistake 1: Trying to use TypeScript interfaces as tokens
```typescript
// WRONG: Attempting to resolve an interface
container.resolve<IUserService>(IUserService); // 'IUserService' only refers to a type, but is being used as a value here!
```
**Why it fails:** Interfaces are erased during compilation. They do not exist at runtime. You must use a `Symbol`, a `string`, or a class constructor as the token.

#### Mistake 2: Missing error handling on unregistered tokens
```typescript
// WRONG: Returning undefined without throwing
resolve(token: any) {
  return this.registry.get(token)?.(); // Caller crashes later with mysterious 'cannot read properties of undefined'!
}
```
**Why it fails:** Always throw an informative error specifying the token name immediately when resolution fails.

---

### 7. Rules to remember
1. TypeScript interfaces cannot be used as runtime tokens (they are erased).
2. Use `Symbol.for("name")`, string identifiers, or class constructors as tokens.
3. Use phantom types (`class Token<T>`) to bind tokens to their expected types automatically.
4. Pass the container instance to factory registrations to enable recursive sub-dependency resolution.

---

### Think first: Prediction puzzle
What does the following snippet log?

```typescript
const container = new Container();
const TOKEN_A = Symbol("A");

container.registerFactory(TOKEN_A, () => ({ id: Math.random() }));

const a1 = container.resolve<{ id: number }>(TOKEN_A);
const a2 = container.resolve<{ id: number }>(TOKEN_A);

console.log(a1.id === a2.id);
```

---

**Answer:**
```
false
```
**Explanation:** `registerFactory` executes the factory function on every call to `resolve`. Because each call evaluates `Math.random()`, `a1` and `a2` receive different random numbers. (To share the same instance, it must be registered as a Singleton!).

---

### Practice exercises

#### Exercise 1: Register class with auto-instantiation
- **Task**: Extend `Container` with a method `registerClass<T>(token: InjectionToken<T>, ctor: new (...args: any[]) => T)` that instantiates the class on resolve.
- **Hint 1**: `this.registerFactory(token, () => new ctor());`.

#### Exercise 2: Type-safe Token class implementation
- **Task**: Create `Token<T>` and verify that `container.resolve(token)` returns `T` without requiring manual `<T>` at the call site.
- **Hint 1**: Signature: `resolve<T>(token: Token<T>): T`.

#### Exercise 3: Container child scopes / hierarchy
- **Task**: Add a `createChild()` method to `Container` that checks its own registry first, and delegates to the parent if not found.
- **Hint 1**: Store `private parent?: Container`.

#### Exercise 4: Multi-provider collection
- **Task**: Allow registering multiple handlers under a single array token `registerMulti(token, provider)`.
- **Hint 1**: Store an array of factories for multi-tokens.

---

### Exercise solutions

#### Solution 1: Register class with auto-instantiation
```typescript
class ExtendedContainer extends Container {
  registerClass<T>(token: InjectionToken<T>, ctor: new () => T): void {
    this.registerFactory(token, () => new ctor());
  }
}
```

#### Solution 2: Type-safe Token class implementation
```typescript
class TypedToken<T> {
  readonly __typeBrand!: T;
  constructor(public name: string) {}
}

class StronglyTypedContainer {
  private store = new Map<TypedToken<any>, () => any>();

  register<T>(token: TypedToken<T>, factory: () => T): void {
    this.store.set(token, factory);
  }

  resolve<T>(token: TypedToken<T>): T {
    const fn = this.store.get(token);
    if (!fn) throw new Error(`Missing ${token.name}`);
    return fn();
  }
}
```

#### Solution 3: Container child scopes / hierarchy
```typescript
class HierarchicalContainer extends Container {
  constructor(private parent?: HierarchicalContainer) {
    super();
  }

  createChild(): HierarchicalContainer {
    return new HierarchicalContainer(this);
  }

  override resolve<T>(token: InjectionToken<T>): T {
    try {
      return super.resolve(token);
    } catch (err) {
      if (this.parent) return this.parent.resolve(token);
      throw err;
    }
  }
}
```

#### Solution 4: Multi-provider collection
```typescript
class MultiContainer {
  private multiRegistry = new Map<string, Array<() => any>>();

  registerMulti<T>(key: string, factory: () => T): void {
    const list = this.multiRegistry.get(key) ?? [];
    list.push(factory);
    this.multiRegistry.set(key, list);
  }

  resolveAll<T>(key: string): T[] {
    const list = this.multiRegistry.get(key) ?? [];
    return list.map((fn) => fn());
  }
}
```

---

### Recall
1. Why do IoC containers in TypeScript use tokens instead of interfaces? Because TypeScript interfaces are completely erased at compile time.
2. How does an IoC container resolve nested dependencies? By passing the container instance into registered factory functions (`(c) => new Service(c.resolve(...))`).
3. What is the benefit of a `Token<T>` class with a phantom property? It provides automatic return-type inference when calling `container.resolve(token)` without manual type arguments.

> **If you remember only one thing:**  
> IoC containers use runtime tokens (Symbols or strings) to locate service factories and recursively assemble dependency graphs.

---

# Topic 13: Service Lifecycles in IoC: Singleton, Transient, and Scoped

### 1. What is it?
In an IoC container, the **Service Lifecycle** (or lifetime) determines how long an instantiated service is retained and how many instances are created:
1. **Transient**: A brand-new instance is created every single time the dependency is requested.
2. **Singleton**: Exactly one instance is created on first request and cached for the entire lifespan of the application process.
3. **Scoped**: An instance is created once per execution context (such as a single incoming HTTP request) and shared among all dependencies resolved within that scope.

### 2. Why does it exist?
Different services have different memory and concurrency requirements:
- A database connection pool should be a **Singleton** (shared globally).
- An authenticated user session or transaction context must be **Scoped** (isolated to one HTTP request; never leaked to another user).
- A lightweight formatting utility or stateful request parser should be **Transient** (fresh every time to avoid shared state mutations).

### 3. Basic example

```typescript
type Lifecycle = "transient" | "singleton" | "scoped";

interface ServiceDefinition<T> {
  factory: (c: LifecycleContainer) => T;
  lifecycle: Lifecycle;
}

class LifecycleContainer {
  private definitions = new Map<string, ServiceDefinition<any>>();
  private singletons = new Map<string, any>();
  private scopedInstances = new Map<string, any>();

  constructor(private parentScope?: LifecycleContainer) {}

  register<T>(key: string, factory: (c: LifecycleContainer) => T, lifecycle: Lifecycle): void {
    this.definitions.set(key, { factory, lifecycle });
  }

  // Create an isolated sub-container for an HTTP request
  createScope(): LifecycleContainer {
    const child = new LifecycleContainer(this);
    child.definitions = this.definitions;
    child.singletons = this.singletons; // Share global singletons!
    return child;
  }

  resolve<T>(key: string): T {
    const def = this.definitions.get(key);
    if (!def) {
      if (this.parentScope) return this.parentScope.resolve(key);
      throw new Error(`Service not registered: ${key}`);
    }

    // 1. Singleton: Cached at root
    if (def.lifecycle === "singleton") {
      if (!this.singletons.has(key)) {
        this.singletons.set(key, def.factory(this));
      }
      return this.singletons.get(key);
    }

    // 2. Scoped: Cached per scope instance
    if (def.lifecycle === "scoped") {
      if (!this.scopedInstances.has(key)) {
        this.scopedInstances.set(key, def.factory(this));
      }
      return this.scopedInstances.get(key);
    }

    // 3. Transient: Always create fresh
    return def.factory(this);
  }
}

// Verification
const root = new LifecycleContainer();
root.register("transient", () => ({ id: Math.random() }), "transient");
root.register("singleton", () => ({ id: Math.random() }), "singleton");
root.register("scoped", () => ({ id: Math.random() }), "scoped");

// Scope 1 (HTTP Request 1)
const req1 = root.createScope();
const s1_req1 = req1.resolve<{ id: number }>("scoped");
const s2_req1 = req1.resolve<{ id: number }>("scoped");
console.log(s1_req1 === s2_req1); // true: same instance within scope!

// Scope 2 (HTTP Request 2)
const req2 = root.createScope();
const s1_req2 = req2.resolve<{ id: number }>("scoped");
console.log(s1_req1 === s1_req2); // false: isolated between different scopes!

// Singleton across both scopes
console.log(req1.resolve("singleton") === req2.resolve("singleton")); // true!
```

**Line-by-line explanation:**
- `definitions`: Holds the recipe and lifecycle rule for each token.
- `singletons`: Root cache shared across all child scopes.
- `scopedInstances`: Local cache created on each child scope (cleared when the scope is garbage collected).
- `def.lifecycle === "transient"`: Always calls `def.factory(this)` without caching.

---

### 4. How it works inside TypeScript
1. **Scope Tree**: Scopes form a parent-child hierarchy. Singletons delegate to the root; scoped instances stay in the local child container.
2. **Memory Cleanup**: When an HTTP request completes, dropping the reference to `req1` allows V8 to garbage collect all scoped instances automatically.
3. **Captive Dependency Prevention**: In production frameworks, resolving a scoped service into a root singleton is prevented to avoid memory leaks.

---

### 5. More examples

#### Example 1: Web Request Middleware Scoping
```typescript
function handleHttpRequest(rootContainer: LifecycleContainer, incomingUser: string) {
  const requestScope = rootContainer.createScope();

  // Register request-specific state in the child scope
  requestScope.register("currentUser", () => incomingUser, "scoped");

  const handler = requestScope.resolve<any>("orderHandler");
  handler.execute();
  // Request ends: requestScope and currentUser are eligible for GC!
}
```

#### Example 2: Captive Dependency Detection Guard
```typescript
// If a Singleton depends on a Scoped service, the scoped instance is held forever (Captive Dependency bug!)
```

---

### 6. Common mistakes

#### Mistake 1: The Captive Dependency Anti-Pattern
```typescript
// DANGER:
// Service A is SINGLETON
// Service B is SCOPED (e.g., UserSession)
// If Service A injects Service B in constructor, Service B is captured forever in the singleton!
```
**Why it fails:** The singleton lives for the lifetime of the process. If it holds a reference to a scoped instance (like Request 1's user), all subsequent requests will inadvertently access Request 1's user data! Always ensure singletons only depend on other singletons or transients.

#### Mistake 2: Forgetting to clean up child scopes
```typescript
// WRONG: Storing child scopes in a global array
const allScopes: any[] = [];
function onRequest() {
  const scope = root.createScope();
  allScopes.push(scope); // Memory leak! Scopes are never garbage collected!
}
```
**Why it fails:** Child scopes hold all resolved scoped instances in memory. If you retain references to child scopes, your server will eventually crash with an Out of Memory (OOM) error.

---

### 7. Rules to remember
1. **Transient**: No caching; fresh instance on every resolution.
2. **Singleton**: Exactly one instance cached globally at the root.
3. **Scoped**: One instance cached per child scope (e.g., per HTTP request).
4. **Never inject a Scoped service into a Singleton** (Captive Dependency bug).

---

### Think first: Prediction puzzle
What does the code log?

```typescript
const container = new LifecycleContainer();
let count = 0;
container.register("counter", () => ++count, "transient");

console.log(container.resolve("counter"));
console.log(container.resolve("counter"));
```

---

**Answer:**
```
1
2
```
**Explanation:** Because the lifecycle is `"transient"`, the factory executes each time `resolve` is called, incrementing `count` from 1 to 2.

---

### Practice exercises

#### Exercise 1: Register singleton helper
- **Task**: Add `registerSingleton(key, factory)` to `LifecycleContainer` as a shortcut for `register(key, factory, "singleton")`.
- **Hint 1**: `this.register(key, factory, "singleton");`.

#### Exercise 2: Transient timestamp resolution
- **Task**: Register a transient service that returns `Date.now()`. Verify two subsequent resolutions produce values.
- **Hint 1**: Use `"transient"` lifecycle.

#### Exercise 3: Scoped context disposal hook
- **Task**: Add a `dispose()` method to `LifecycleContainer` that calls `.dispose()` on any scoped instance that implements `{ dispose(): void }`.
- **Hint 1**: Iterate over `this.scopedInstances.values()`.

#### Exercise 4: Captive dependency guard
- **Task**: In `register`, throw an error if a `"singleton"` tries to resolve a `"scoped"` dependency.
- **Hint 1**: Inspect the lifecycle of dependencies during factory resolution.

---

### Exercise solutions

#### Solution 1: Register singleton helper
```typescript
class BetterContainer extends LifecycleContainer {
  registerSingleton<T>(key: string, factory: (c: LifecycleContainer) => T): void {
    this.register(key, factory, "singleton");
  }

  registerTransient<T>(key: string, factory: (c: LifecycleContainer) => T): void {
    this.register(key, factory, "transient");
  }
}
```

#### Solution 2: Transient timestamp resolution
```typescript
const c = new BetterContainer();
c.registerTransient("time", () => Date.now());
const t1 = c.resolve<number>("time");
const t2 = c.resolve<number>("time");
console.log(typeof t1 === "number" && typeof t2 === "number"); // true
```

#### Solution 3: Scoped context disposal hook
```typescript
class DisposableContainer extends LifecycleContainer {
  dispose(): void {
    for (const instance of (this as any).scopedInstances.values()) {
      if (typeof instance?.dispose === "function") {
        instance.dispose();
      }
    }
    (this as any).scopedInstances.clear();
  }
}
```

#### Solution 4: Captive dependency guard
```typescript
function assertNoCaptiveDependency(parentLifecycle: Lifecycle, childLifecycle: Lifecycle): void {
  if (parentLifecycle === "singleton" && childLifecycle === "scoped") {
    throw new Error("Captive Dependency Error: A Singleton cannot inject a Scoped service!");
  }
}
```

---

### Recall
1. What is the difference between Transient and Scoped lifetimes? Transient creates a fresh instance on every call; Scoped shares one instance within the current scope.
2. What is a "Captive Dependency"? When a long-lived service (Singleton) holds onto a short-lived service (Scoped), preventing it from being garbage collected and causing state leaks.
3. When should a child scope be created? At the start of a request, transaction, or unit of work.

> **If you remember only one thing:**  
> Singletons live forever at the root, Scoped services live for one request scope, and Transient services are recreated on every call.

---

# Topic 14: Circular Dependency Detection in IoC Containers

### 1. What is it?
A **Circular Dependency** occurs when Service A depends on Service B, and Service B depends (directly or indirectly) on Service A:
$$A \longrightarrow B \longrightarrow A$$
Without protection, an IoC container attempting to resolve Service A will recursively attempt to resolve Service B, which will attempt to resolve Service A, causing an infinite loop and crashing the process with `RangeError: Maximum call stack size exceeded`.

### 2. Why does it exist?
Circular dependencies happen frequently in complex architectures as systems grow. A production IoC container must detect cycles dynamically during graph resolution and throw a descriptive error detailing the exact dependency chain (`A -> B -> C -> A`).

### 3. Basic example

```typescript
class CycleSafeContainer {
  private factories = new Map<string, (c: CycleSafeContainer) => any>();
  // Resolution stack tracking currently resolving tokens
  private resolutionStack = new Set<string>();

  register(token: string, factory: (c: CycleSafeContainer) => any): void {
    this.factories.set(token, factory);
  }

  resolve<T>(token: string): T {
    // 1. Check if token is already in active resolution stack!
    if (this.resolutionStack.has(token)) {
      const cyclePath = [...Array.from(this.resolutionStack), token].join(" -> ");
      throw new Error(`Circular dependency detected: ${cyclePath}`);
    }

    const factory = this.factories.get(token);
    if (!factory) {
      throw new Error(`No provider registered for: ${token}`);
    }

    // 2. Push to stack
    this.resolutionStack.add(token);

    try {
      // 3. Resolve
      return factory(this);
    } finally {
      // 4. Pop from stack when resolution of this branch completes
      this.resolutionStack.delete(token);
    }
  }
}

// Verification with a circular graph: A -> B -> A
const container = new CycleSafeContainer();

container.register("ServiceA", (c) => ({ b: c.resolve("ServiceB") }));
container.register("ServiceB", (c) => ({ a: c.resolve("ServiceA") }));

try {
  container.resolve("ServiceA");
} catch (err: any) {
  console.log(err.message);
  // Logs: "Circular dependency detected: ServiceA -> ServiceB -> ServiceA"
}
```

**Line-by-line explanation:**
- `private resolutionStack = new Set<string>()`: Maintains the active path of tokens currently being constructed.
- `if (this.resolutionStack.has(token))`: If we encounter a token that is already on the active call stack, we have detected a cycle.
- `const cyclePath = [...Array.from(this.resolutionStack), token].join(" -> ")`: Builds a readable breadcrumb path showing exactly how the cycle occurred.
- `this.resolutionStack.add(token)`: Marks the token as in-progress.
- `finally { this.resolutionStack.delete(token); }`: Guarantees the token is removed from the active stack even if factory resolution throws.

---

### 4. How it works inside TypeScript
1. **Call Stack Tracking**: The resolution stack mirrors the recursion stack of the resolution algorithm.
2. **Deterministic Cleanup**: The `try ... finally` block ensures that if an error occurs, the stack does not remain polluted for future resolutions.
3. **Graph Directionality**: Diamond dependencies ($A \to B, A \to C, B \to D, C \to D$) are NOT cycles; because $D$ finishes resolving before $C$ resolves, $D$ is removed from the stack and does not trigger an error.

---

### 5. More examples

#### Example 1: Solving Circular Dependencies via Lazy Proxy / Property Injection
```typescript
class LazyProxyContainer extends CycleSafeContainer {
  resolveLazy<T extends object>(token: string): T {
    let resolvedInstance: T | null = null;

    // Return a Proxy that defers resolution until first property access
    return new Proxy({} as T, {
      get(target, prop, receiver) {
        if (!resolvedInstance) {
          resolvedInstance = this.resolve(token);
        }
        return Reflect.get(resolvedInstance as any, prop, receiver);
      },
    });
  }
}
```

#### Example 2: Three-node cycle trace ($A \to B \to C \to A$)
```typescript
const c3 = new CycleSafeContainer();
c3.register("A", (c) => c.resolve("B"));
c3.register("B", (c) => c.resolve("C"));
c3.register("C", (c) => c.resolve("A"));

// Resolving A throws: "Circular dependency detected: A -> B -> C -> A"
```

---

### 6. Common mistakes

#### Mistake 1: Forgetting `finally` block cleanup
```typescript
// WRONG: Removing token only on success
this.resolutionStack.add(token);
const res = factory(this); // If this throws, token is NEVER deleted from stack!
this.resolutionStack.delete(token);
```
**Why it fails:** If a factory throws an ordinary error (e.g. database connection failed), the token remains permanently stuck in `this.resolutionStack`. Any future resolution of that token will falsely report a Circular Dependency!

#### Mistake 2: Confusing shared dependencies with circular dependencies
```typescript
// NOT a cycle: Diamond dependency
// A -> B -> D
// A -> C -> D
```
**Why it matters:** In a diamond dependency, `D` is resolved twice. A naive check that simply tracks "already seen" nodes without popping them from the stack will falsely report a cycle. You MUST push on entry and pop on exit (`Set.delete`).

---

### 7. Rules to remember
1. Track the active resolution path using a `Set<string>`.
2. Push the token before resolving dependencies; pop it in a `finally` block.
3. If `resolutionStack.has(token)` is true, abort immediately with the full path.
4. Diamond dependencies are valid DAGs (Directed Acyclic Graphs) and must not be flagged as cycles.

---

### Think first: Prediction puzzle
Does the following graph trigger a circular dependency error?

```typescript
const c = new CycleSafeContainer();
c.register("D", () => "leaf");
c.register("B", (c) => ({ d: c.resolve("D") }));
c.register("C", (c) => ({ d: c.resolve("D") }));
c.register("A", (c) => ({ b: c.resolve("B"), c: c.resolve("C") }));

c.resolve("A");
console.log("Success");
```

---

**Answer:**
```
Success
```
**Explanation:** This is a diamond dependency. When resolving `B`, `D` is pushed, resolved, and popped. When resolving `C`, `D` is pushed, resolved, and popped again. At no point is `D` on the active resolution stack twice simultaneously.

---

### Practice exercises

#### Exercise 1: Custom circular error type
- **Task**: Create a custom error class `CircularDependencyError` that stores `cyclePath: string[]`.
- **Hint 1**: Subclass `Error` and attach `public readonly path: string[]`.

#### Exercise 2: Depth limiter guard
- **Task**: Add a `maxDepth` limit to `CycleSafeContainer` that throws if resolution depth exceeds 20 levels.
- **Hint 1**: Check `if (this.resolutionStack.size > 20) throw new Error("Max depth exceeded");`.

#### Exercise 3: Self-dependency cycle
- **Task**: Register `container.register("Self", c => c.resolve("Self"))`. Verify it produces `"Circular dependency detected: Self -> Self"`.
- **Hint 1**: The stack has `"Self"` and sees `"Self"` immediately.

#### Exercise 4: Refactor circular dependency to event bus
- **Task**: Decouple `OrderService` (needs `NotificationService`) and `NotificationService` (needs `OrderService`) by introducing an event emitter so neither depends on the other.
- **Hint 1**: `OrderService` emits `"orderPlaced"`; `NotificationService` listens to the event bus.

---

### Exercise solutions

#### Solution 1: Custom circular error type
```typescript
class CircularDependencyError extends Error {
  constructor(public readonly path: string[]) {
    super(`Circular dependency detected: ${path.join(" -> ")}`);
    this.name = "CircularDependencyError";
  }
}
```

#### Solution 2: Depth limiter guard
```typescript
class DepthLimitedContainer extends CycleSafeContainer {
  private readonly MAX_DEPTH = 15;

  override resolve<T>(token: string): T {
    if ((this as any).resolutionStack.size > this.MAX_DEPTH) {
      throw new Error(`Resolution depth exceeded limit of ${this.MAX_DEPTH}`);
    }
    return super.resolve(token);
  }
}
```

#### Solution 3: Self-dependency cycle
```typescript
const container = new CycleSafeContainer();
container.register("Self", (c) => c.resolve("Self"));

try {
  container.resolve("Self");
} catch (err: any) {
  console.log(err.message.includes("Self -> Self")); // true
}
```

#### Solution 4: Refactor circular dependency to event bus
```typescript
interface EventHub {
  on(event: string, fn: Function): void;
  emit(event: string, data: any): void;
}

class DecoupledOrderService {
  constructor(private events: EventHub) {}
  createOrder(id: string) {
    this.events.emit("orderCreated", { id });
  }
}

class DecoupledNotificationService {
  constructor(events: EventHub) {
    events.on("orderCreated", (order: any) => {
      console.log(`Alert: Order ${order.id} was created`);
    });
  }
}
```

---

### Recall
1. Why must resolution stack cleanup happen in a `finally` block? To ensure failed resolutions do not leave tokens stuck in the stack, corrupting future resolutions.
2. What is the difference between a diamond dependency and a circular dependency? A diamond dependency is a valid DAG where a node is resolved along two distinct sequential branches; a circular dependency contains a loop on the same active call branch.
3. How can circular dependencies between two services be resolved architecturally? By introducing an intermediary event bus or by using lazy proxy injection.

> **If you remember only one thing:**  
> Tracking active tokens in a `Set` during recursive resolution enables immediate detection and reporting of circular dependency loops.

---

# Checkpoint Challenge 3: Enterprise IoC & Decorator Architecture (Topics 11-14)

### Challenge Specification
Construct a full Inversion of Control Container featuring:
1. **Token-based Registration** with Lifecycle Support (`singleton`, `transient`, `scoped`).
2. **Circular Dependency Detection** throwing a detailed cycle path.
3. **Child Scope Creation** for isolated request contexts.
4. **TC39 Stage 3 Decorator Integration** (`@injectable(token)`) to auto-register classes into the container.

### Solution

```typescript
// 1. Types & Tokens
type Lifetime = "singleton" | "transient" | "scoped";

type ProviderFactory<T> = (container: EnterpriseContainer) => T;

interface ServiceRecipe<T> {
  factory: ProviderFactory<T>;
  lifetime: Lifetime;
}

// 2. Enterprise IoC Container
class EnterpriseContainer {
  private recipes = new Map<string, ServiceRecipe<any>>();
  private singletons = new Map<string, any>();
  private scopedInstances = new Map<string, any>();
  private resolutionStack = new Set<string>();

  constructor(private parentScope?: EnterpriseContainer) {}

  register<T>(token: string, factory: ProviderFactory<T>, lifetime: Lifetime = "transient"): void {
    this.recipes.set(token, { factory, lifetime });
  }

  createScope(): EnterpriseContainer {
    const scope = new EnterpriseContainer(this);
    scope.recipes = this.recipes;
    scope.singletons = this.singletons;
    return scope;
  }

  resolve<T>(token: string): T {
    // Circular dependency detection
    if (this.resolutionStack.has(token)) {
      const path = [...Array.from(this.resolutionStack), token].join(" -> ");
      throw new Error(`Circular dependency detected: ${path}`);
    }

    const recipe = this.recipes.get(token);
    if (!recipe) {
      if (this.parentScope) return this.parentScope.resolve(token);
      throw new Error(`Unregistered token: ${token}`);
    }

    // Singleton check
    if (recipe.lifetime === "singleton") {
      if (!this.singletons.has(token)) {
        this.singletons.set(token, this.executeFactory(token, recipe.factory));
      }
      return this.singletons.get(token);
    }

    // Scoped check
    if (recipe.lifetime === "scoped") {
      if (!this.scopedInstances.has(token)) {
        this.scopedInstances.set(token, this.executeFactory(token, recipe.factory));
      }
      return this.scopedInstances.get(token);
    }

    // Transient
    return this.executeFactory(token, recipe.factory);
  }

  private executeFactory<T>(token: string, factory: ProviderFactory<T>): T {
    this.resolutionStack.add(token);
    try {
      return factory(this);
    } finally {
      this.resolutionStack.delete(token);
    }
  }
}

// 3. Global Container Instance & @injectable Decorator
const globalContainer = new EnterpriseContainer();

function injectable(token: string, lifetime: Lifetime = "transient") {
  return function <T extends new (...args: any[]) => any>(
    target: T,
    context: ClassDecoratorContext<T>
  ) {
    globalContainer.register(token, () => new target(), lifetime);
  };
}

// 4. Sample Domain Architecture
@injectable("DatabaseService", "singleton")
class DatabaseService {
  readonly connectionId = Math.random();
}

@injectable("RequestLogger", "scoped")
class RequestLogger {
  readonly requestId = Math.random();
}

// 5. Verification Execution
function runCheckpoint3() {
  console.log("--- 1. Singleton Verification ---");
  const db1 = globalContainer.resolve<DatabaseService>("DatabaseService");
  const db2 = globalContainer.resolve<DatabaseService>("DatabaseService");
  console.log("Singletons match:", db1.connectionId === db2.connectionId); // true

  console.log("\n--- 2. Scoped Verification ---");
  const reqScope1 = globalContainer.createScope();
  const logger1a = reqScope1.resolve<RequestLogger>("RequestLogger");
  const logger1b = reqScope1.resolve<RequestLogger>("RequestLogger");
  console.log("Same scope loggers match:", logger1a.requestId === logger1b.requestId); // true

  const reqScope2 = globalContainer.createScope();
  const logger2 = reqScope2.resolve<RequestLogger>("RequestLogger");
  console.log("Different scope loggers differ:", logger1a.requestId !== logger2.requestId); // true

  console.log("\n--- 3. Circular Dependency Detection ---");
  globalContainer.register("NodeA", (c) => ({ b: c.resolve("NodeB") }));
  globalContainer.register("NodeB", (c) => ({ a: c.resolve("NodeA") }));

  try {
    globalContainer.resolve("NodeA");
  } catch (err: any) {
    console.log("Caught expected cycle:", err.message);
  }
}
runCheckpoint3();
```
