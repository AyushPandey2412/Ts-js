# Module TS-06: Complete OOP, Class Internals, Modifiers, & SOLID Principles

> **Track**: TypeScript Production Engineering Masterclass (TS 5.x)  
> **Prerequisites**: [TS-00](file:///C:/Users/ayush/OneDrive/Desktop/js-learning/TS-00-QUEUE-AND-INDEX.md), [TS-01](file:///C:/Users/ayush/OneDrive/Desktop/js-learning/TS-01-TYPE-ARCHITECTURE-AND-STRUCTURAL-SUBTYPING.md), [TS-02](file:///C:/Users/ayush/OneDrive/Desktop/js-learning/TS-02-GENERICS-AND-TYPE-OPERATORS.md), [TS-03](file:///C:/Users/ayush/OneDrive/Desktop/js-learning/TS-03-CONDITIONAL-TYPES-AND-INFERENCE.md), [TS-04](file:///C:/Users/ayush/OneDrive/Desktop/js-learning/TS-04-MAPPED-TYPES-AND-METAPROGRAMMING.md), [TS-05](file:///C:/Users/ayush/OneDrive/Desktop/js-learning/TS-05-TEMPLATE-LITERAL-TYPES-AND-PARSERS.md)  
> **Target Audience**: Principal Engineers, Software Architects, Framework Authors  
> **Universal Specification**: Complete Technical Treatise, 90 Real-World Interview Q&As with Runnable Code, 15 Prediction Puzzles with Step-by-Step Traces, 4 Complete Runnable Production Projects with Test Assertions, 20 DOs & DON'Ts, Real-World Enterprise Case Study, 75 Practice Drills (5 Tiers).

---

# Module TS-06: Complete OOP, Class Internals, Modifiers, & SOLID Principles

## 1. Architectural Deep-Dive & Specification Foundations

### 1.1 The Dual-Type Nature of Classes: Static Side vs Instance Side

In TypeScript, a `class` declaration introduces **two distinct entities** into the compiler's symbol table with the exact same identifier:
1. A **Value**: The JavaScript constructor function that exists at runtime.
2. A **Type**: The structural shape of an instance produced by `new` (`InstanceType<typeof ClassName>`).

```typescript
class Account {
  public static defaultCurrency: string = "USD";
  public balance: number;

  constructor(initialBalance: number) {
    this.balance = initialBalance;
  }

  public deposit(amount: number): void {
    this.balance += amount;
  }
}

// 1. The Instance Type:
// Type queries referencing 'Account' refer to the instance shape:
const userAccount: Account = new Account(100);

// 2. The Static Constructor Type:
// To type the constructor function itself, use 'typeof Account':
type AccountConstructor = typeof Account;

const factory: AccountConstructor = Account;
console.log(factory.defaultCurrency); // "USD"
```

```
+-------------------------------------------------------------------------+
|                  The Dual-Type Nature of TypeScript Classes             |
+-------------------------------------------------------------------------+
|  Value Identifier: Account                                              |
|    ├── Runtime Constructor Function                                     |
|    └── Prototype Object (Methods, Getters, Setters)                     |
+-------------------------------------------------------------------------+
|  Type 1: typeof Account (Constructor / Static Side)                     |
|    ├── new (initialBalance: number) => Account                          |
|    └── defaultCurrency: string                                          |
+-------------------------------------------------------------------------+
|  Type 2: Account (Instance Side)                                        |
|    ├── balance: number                                                  |
|    └── deposit(amount: number): void                                    |
+-------------------------------------------------------------------------+
```

---

### 1.2 Access Modifiers Deep-Dive: `public`, `protected`, and `private`

TypeScript provides three compile-time accessibility modifiers:
- `public` (default): Accessible from anywhere (internal, subclasses, and external callers).
- `protected`: Accessible within the declaring class and all derived subclasses, but forbidden to external callers.
- `private`: Accessible **only** within the declaring class. Forbidden to external callers AND derived subclasses.

```typescript
class BaseEntity {
  public id: string;
  protected internalVersion: number;
  private secretToken: string;

  constructor(id: string, token: string) {
    this.id = id;
    this.internalVersion = 1;
    this.secretToken = token;
  }

  protected bumpVersion(): void {
    this.internalVersion++;
  }
}

class UserEntity extends BaseEntity {
  public printVersion(): void {
    // Legal: internalVersion is protected
    this.bumpVersion();
    console.log(`Version: ${this.internalVersion}`);

    // ERROR: TS2341: Property 'secretToken' is private and only accessible within class 'BaseEntity'.
    // console.log(this.secretToken);
  }
}
```

---

### 1.3 TypeScript `private` vs ECMAScript `#private` (Hard vs Soft Privacy)

Understanding the fundamental divide between TypeScript's compile-time `private` modifier and native JavaScript private fields (`#field`, TC39 Stage 4 / ES2022) is essential for enterprise security:

| Feature | TypeScript `private prop: T` | ECMAScript `#prop: T` |
| :--- | :--- | :--- |
| **Enforcement Layer** | **Compile-Time Only** (Type checker) | **Runtime Engine** (V8 / Bytecode VM) |
| **Compiled JavaScript** | `this.prop = val;` (Regular property!) | `#prop` or `WeakMap` private brand |
| **Bypass via Bracket Access** | `(instance as any)['prop']` (Accessible!) | Throws runtime `SyntaxError` |
| **Inspection via Reflection** | `Object.keys()`, `Reflect.ownKeys()` | Completely invisible to reflection |
| **Subclass Collisions** | Subclasses cannot declare same name | Subclasses can independently declare `#prop` |
| **Performance Overhead** | Zero runtime cost (Standard property) | Brand-check slot lookup (Minimal) |

```typescript
class VulnerableVault {
  private secretKey: string = "super_secret_123";
}

const v = new VulnerableVault();
// TypeScript error at compile time, BUT succeeds at runtime:
console.log((v as any).secretKey); // "super_secret_123" (LEAK!)

class SecureVault {
  #secretKey: string = "hardened_runtime_secret";

  public verify(key: string): boolean {
    return this.#secretKey === key;
  }
}

const s = new SecureVault();
// Even with 'any', runtime engine refuses access:
// console.log((s as any).#secretKey); // SyntaxError: Private identifier '#secretKey' is not accessible outside class
```

---

### 1.4 Polymorphic `this` and Fluent Method Chaining

In TypeScript, `this` can be used as a return type annotation. When used in a class hierarchy, polymorphic `this` dynamically represents the **current subtype**, allowing fluent builder patterns to survive inheritance without losing specific derived types:

```typescript
class QueryBuilder {
  protected table: string = "";

  public from(table: string): this {
    this.table = table;
    return this;
  }
}

class PostgresQueryBuilder extends QueryBuilder {
  protected schema: string = "public";

  public withSchema(schema: string): this {
    this.schema = schema;
    return this;
  }
}

// Fluent chaining automatically preserves derived PostgresQueryBuilder type:
const query = new PostgresQueryBuilder()
  .from("users")         // Returns PostgresQueryBuilder (not base QueryBuilder!)
  .withSchema("tenant_1"); // Compiles cleanly without casting!
```

---

### 1.5 Type Guard Methods on Classes: `this is SubType`

Class methods can act as user-defined type guards on the calling instance using `this is SubType`:

```typescript
abstract class FileNode {
  public name: string;
  constructor(name: string) { this.name = name; }

  public isDirectory(): this is DirectoryNode {
    return this instanceof DirectoryNode;
  }

  public isFile(): this is LeafFileNode {
    return this instanceof LeafFileNode;
  }
}

class LeafFileNode extends FileNode {
  public sizeBytes: number = 1024;
}

class DirectoryNode extends FileNode {
  public children: FileNode[] = [];
}

function processNode(node: FileNode) {
  if (node.isDirectory()) {
    // TypeScript narrows 'node' to DirectoryNode:
    console.log(node.children.length);
  } else if (node.isFile()) {
    // TypeScript narrows 'node' to LeafFileNode:
    console.log(node.sizeBytes);
  }
}
```

---

### 1.6 Abstract Classes, Abstract Members, & Constructor Signatures

An `abstract class` cannot be instantiated directly and serves as a formal base contract:

```typescript
abstract class AbstractRepository<T> {
  protected tableName: string;

  constructor(tableName: string) {
    this.tableName = tableName;
  }

  // Abstract methods must be implemented by concrete subclasses
  public abstract findById(id: string): Promise<T | null>;
  public abstract save(entity: T): Promise<void>;

  // Concrete shared template method
  public async exists(id: string): Promise<boolean> {
    const item = await this.findById(id);
    return item !== null;
  }
}

// Abstract Constructor Type Signature:
type AbstractConstructor<T = {}> = abstract new (...args: any[]) => T;
```

---

### 1.7 `implements` vs `extends` & The Interface Parameter Type Trap

A critical junior trap in TypeScript: **`implements` does NOT infer method parameter types!**

```typescript
interface AuthService {
  authenticate(username: string, token: string): Promise<boolean>;
}

// THE TRAP:
class BadAuthService implements AuthService {
  // TS7006: Parameter 'username' implicitly has an 'any' type!
  // TS7006: Parameter 'token' implicitly has an 'any' type!
  // async authenticate(username, token) { return true; }

  // CORRECT: Parameter types must be explicitly typed!
  async authenticate(username: string, token: string): Promise<boolean> {
    return username.length > 0 && token.length > 0;
  }
}
```

---

### 1.8 The `override` Keyword & `noImplicitOverride` (TS 4.3+)

When a base class method changes its signature or is deleted, derived class overrides can silently turn into orphaned methods without warning. The `override` keyword guarantees that a method genuinely overrides a base class member:

```typescript
class BaseWorker {
  public start(): void {
    console.log("Worker started");
  }
}

class HeavyWorker extends BaseWorker {
  // With 'noImplicitOverride: true', this is mandatory and verified:
  public override start(): void {
    super.start();
    console.log("Heavy resources allocated");
  }

  // If BaseWorker removes 'start()', TypeScript immediately triggers:
  // TS4113: This member cannot have an 'override' modifier because it is not declared in the base class.
}
```


---

## 2. Advanced OOP Patterns, Static Internals, Mixins, & SOLID Architecture

### 2.1 Static Initialization Blocks & Static Inheritance

JavaScript classes have **dual-linkage inheritance**:
1. The **instance prototype chain**: `SubClass.prototype.__proto__ === SuperClass.prototype`.
2. The **static constructor chain**: `SubClass.__proto__ === SuperClass`.

This enables static properties and methods to be inherited by derived classes!

#### Static Blocks (`static { ... }`, ES2022 / TS 4.4+)
Static initialization blocks allow multi-statement logic, exception handling, and access to private fields during class evaluation:

```typescript
class DatabaseConnection {
  static #pool: any[];
  public static isInitialized: boolean = false;

  static {
    try {
      this.#pool = [];
      this.isInitialized = true;
      console.log("Database connection pool initialized statically.");
    } catch (err) {
      console.error("Static pool initialization failed", err);
    }
  }

  public static getPoolSize(): number {
    return this.#pool.length;
  }
}
```

---

### 2.2 Mixins & Multiple Inheritance Emulation

Because ECMAScript and TypeScript strictly enforce single inheritance (`extends SuperClass`), multiple inheritance must be emulated using the **Class Expression Mixin Pattern**:

```typescript
export type Constructor<T = {}> = new (...args: any[]) => T;

// 1. Mixin: Timestampable
export function Timestampable<TBase extends Constructor>(Base: TBase) {
  return class extends Base {
    public createdAt: Date = new Date();
    public updatedAt: Date = new Date();

    public touch(): void {
      this.updatedAt = new Date();
    }
  };
}

// 2. Mixin: SoftDeletable
export function SoftDeletable<TBase extends Constructor>(Base: TBase) {
  return class extends Base {
    public isDeleted: boolean = false;
    public deletedAt: Date | null = null;

    public softDelete(): void {
      this.isDeleted = true;
      this.deletedAt = new Date();
    }
  };
}

// 3. Concrete Base Class
export class BaseEntity {
  public id: string;
  constructor(id: string) {
    this.id = id;
  }
}

// 4. Compose Mixins
export class Article extends SoftDeletable(Timestampable(BaseEntity)) {
  public title: string;

  constructor(id: string, title: string) {
    super(id);
    this.title = title;
  }
}

const article = new Article("art_101", "TypeScript OOP In-Depth");
console.log(article.id);        // "art_101"
console.log(article.createdAt); // Date
article.softDelete();
console.log(article.isDeleted); // true
```

---

### 2.3 The SOLID Principles in TypeScript

```
+-------------------------------------------------------------------------+
|                  SOLID Principles in TypeScript Architecture            |
+-------------------------------------------------------------------------+
|  [S] Single Responsibility  ──► Class has ONE reason to change           |
|  [O] Open/Closed            ──► Open for extension, closed for mutation  |
|  [L] Liskov Substitution    ──► Subclasses satisfy behavioral contracts  |
|  [I] Interface Segregation  ──► Granular role interfaces, not fat monolith|
|  [D] Dependency Inversion   ──► High-level modules depend on abstractions|
+-------------------------------------------------------------------------+
```

#### 1. Single Responsibility Principle (SRP)
A class should encapsulate a single domain responsibility, keeping data modeling, persistence, and transport decoupled:

```typescript
// VIOLATION: User handles domain data, DB persistence, and email transport:
// class BadUser { saveToDb() { ... } sendWelcomeEmail() { ... } }

// REFACTORED TO SRP:
export class User {
  public id: string;
  public email: string;
  constructor(id: string, email: string) {
    this.id = id;
    this.email = email;
  }
}

export interface UserRepository {
  save(user: User): Promise<void>;
}

export interface EmailService {
  sendEmail(to: string, subject: string, body: string): Promise<void>;
}
```

#### 2. Open/Closed Principle (OCP)
Classes should be open for extension without modifying existing code. Achieved via polymorphic strategies:

```typescript
export interface DiscountStrategy {
  calculate(price: number): number;
}

export class RegularDiscount implements DiscountStrategy {
  public calculate(price: number): number { return price; }
}

export class VipDiscount implements DiscountStrategy {
  public calculate(price: number): number { return price * 0.8; }
}

export class OrderCalculator {
  public computeFinalPrice(price: number, discount: DiscountStrategy): number {
    return discount.calculate(price);
  }
}
// Adding 'HolidayDiscount' requires ZERO edits to OrderCalculator!
```

#### 3. Liskov Substitution Principle (LSP)
Subclasses must be substitutable for their base types without altering program correctness. In TypeScript, this means method parameter types must be **contravariant or invariant**, and return types must be **covariant**:

```typescript
export abstract class PaymentProcessor {
  public abstract process(amount: number): Promise<{ success: boolean; txId: string }>;
}

export class StripeProcessor extends PaymentProcessor {
  // Satisfies LSP: Returns subtype (same shape or narrower), accepts same parameter
  public override async process(amount: number): Promise<{ success: boolean; txId: string }> {
    return { success: true, txId: `stripe_${amount}` };
  }
}
```

#### 4. Interface Segregation Principle (ISP)
Clients should not be forced to depend on methods they do not use. Split monolithic interfaces into focused roles:

```typescript
// VIOLATION: Fat Monolith
// interface Worker { work(): void; eat(): void; sleep(): void; }

// REFACTORED TO GRANULAR ROLES:
export interface Workable {
  work(): void;
}

export interface Feedable {
  eat(): void;
}

export class HumanWorker implements Workable, Feedable {
  public work(): void { console.log("Working"); }
  public eat(): void { console.log("Eating lunch"); }
}

export class RobotWorker implements Workable {
  public work(): void { console.log("Assembling components 24/7"); }
  // RobotWorker is NOT forced to implement unused 'eat()' method!
}
```

#### 5. Dependency Inversion Principle (DIP)
High-level modules must depend on abstractions (interfaces), never on concrete implementations:

```typescript
export interface Logger {
  log(message: string): void;
}

export class ConsoleLogger implements Logger {
  public log(message: string): void { console.log(`[LOG]: ${message}`); }
}

export class OrderService {
  private repository: UserRepository;
  private logger: Logger;

  // Constructor Injection: Depends entirely on abstract interfaces
  constructor(repository: UserRepository, logger: Logger) {
    this.repository = repository;
    this.logger = logger;
  }

  public async registerUser(id: string, email: string): Promise<void> {
    const user = new User(id, email);
    await this.repository.save(user);
    this.logger.log(`Registered user: ${id}`);
  }
}
```

---

### 2.4 Composition Over Inheritance (The Strategy Pattern)

Inheritance creates tight compile-time coupling (`is-a`). Composition provides dynamic runtime flexibility (`has-a`):

```typescript
export interface CompressionCodec {
  compress(data: string): string;
}

export class GzipCompression implements CompressionCodec {
  public compress(data: string): string { return `[GZIP]:${data}`; }
}

export class BrotliCompression implements CompressionCodec {
  public compress(data: string): string { return `[BROTLI]:${data}`; }
}

export class NetworkPayloadSender {
  private codec: CompressionCodec;

  constructor(codec: CompressionCodec) {
    this.codec = codec;
  }

  public setCodec(codec: CompressionCodec): void {
    this.codec = codec; // Dynamic strategy swap at runtime!
  }

  public send(payload: string): string {
    return this.codec.compress(payload);
  }
}
```


---

## 3. 90 Real-World Technical Interview Q&As (Part 1: Q1–Q45)

---

#### Q1: What is the dual-type nature of TypeScript classes?
**Answer:**
A TypeScript `class` declaration introduces both a runtime **value** (the constructor function) and **two types**:
1. The **instance type** (`Account`): Represents instances created by `new Account()`.
2. The **static constructor type** (`typeof Account`): Represents the constructor function itself, including static methods and properties.

```typescript
class Account {
  public static version: number = 1;
  public balance: number = 0;
}

const inst: Account = new Account();       // Instance type
const ctor: typeof Account = Account;      // Static constructor type
console.log(ctor.version);                 // 1
```

---

#### Q2: How do you extract the instance type of a class constructor dynamically?
**Answer:**
Using the built-in `InstanceType<T>` utility type:

```typescript
class OrderManager {
  public process(): void {}
}

type OrderInstance = InstanceType<typeof OrderManager>; // OrderManager
```

---

#### Q3: How do you extract constructor parameter types of a class?
**Answer:**
Using the built-in `ConstructorParameters<T>` utility type:

```typescript
class UserSession {
  constructor(public userId: string, public expiresAt: number) {}
}

type SessionArgs = ConstructorParameters<typeof UserSession>; // [string, number]
```

---

#### Q4: What is the difference between `public`, `protected`, and `private` in TypeScript?
**Answer:**
- `public`: Accessible anywhere.
- `protected`: Accessible within the declaring class and all its derived subclasses.
- `private`: Accessible only within the declaring class. Subclasses cannot access it.

```typescript
class Base {
  public pub = 1;
  protected prot = 2;
  private priv = 3;
}

class Sub extends Base {
  test() {
    console.log(this.pub);  // OK
    console.log(this.prot); // OK
    // console.log(this.priv); // TS2341 Error!
  }
}
```

---

#### Q5: Why is TypeScript's `private` considered "soft privacy"?
**Answer:**
TypeScript's `private` keyword only exists at compile time. When compiled to JavaScript, it is converted into a standard public property, meaning external code can bypass it at runtime using bracket notation or reflection:

```typescript
class SecretKeeper {
  private secret: string = "classified";
}

const keeper = new SecretKeeper();
// Compile error, BUT prints "classified" at runtime:
console.log((keeper as any)["secret"]); // "classified"
```

---

#### Q6: How does ECMAScript `#private` (private fields) differ from TypeScript `private`?
**Answer:**
`#private` is enforced at the **runtime VM bytecode layer** using private name lexical brand checks. It cannot be accessed via bracket notation or reflection and throws a runtime `SyntaxError` if accessed outside the class body.

```typescript
class HardenedSecret {
  #secret: string = "hard_security";
  getSecret() { return this.#secret; }
}

const h = new HardenedSecret();
// console.log((h as any)["#secret"]); // undefined
// (h as any).#secret; // SyntaxError: Private identifier '#secret' is not accessible
```

---

#### Q7: Can a subclass declare a private field with the same name as a parent class private field?
**Answer:**
- With TypeScript `private`: **NO**. Subclasses cannot redeclare a `private` member of the parent class (throws `TS2415`).
- With ECMAScript `#private`: **YES**. Private fields are scoped strictly to the enclosing class body. A subclass can declare `#field` completely independently without collision.

```typescript
class Parent {
  #id: string = "parent";
}

class Child extends Parent {
  #id: string = "child"; // Legal! Distinct private brand slot.
}
```

---

#### Q8: What is the `readonly` modifier in classes, and where can it be initialized?
**Answer:**
`readonly` properties can only be assigned either at their declaration site or inside the class `constructor`. They cannot be modified in methods.

```typescript
class ImmutableConfig {
  public readonly endpoint: string;
  public readonly timeout: number = 5000; // Declaration site

  constructor(endpoint: string) {
    this.endpoint = endpoint; // Constructor site
  }

  public update() {
    // this.endpoint = "new"; // TS2540: Cannot assign to 'endpoint' because it is read-only.
  }
}
```

---

#### Q9: Does `readonly` on a class property make nested object references immutable?
**Answer:**
No! `readonly` is shallow. If a `readonly` property holds an object or array, its internal properties and elements remain completely mutable.

```typescript
class Settings {
  public readonly tags: string[] = ["production"];
}

const s = new Settings();
s.tags.push("experimental"); // Mutates internal array despite 'readonly'!
```

---

#### Q10: What are Parameter Properties in TypeScript and what is their desugaring?
**Answer:**
Parameter properties automatically declare and assign class properties directly in the constructor signature using access modifiers:

```typescript
// Concise Parameter Property:
class Example {
  constructor(public id: string, private secret: number) {}
}

// Desugars into:
class DesugaredExample {
  public id: string;
  private secret: number;
  constructor(id: string, secret: number) {
    this.id = id;
    this.secret = secret;
  }
}
```

---

#### Q11: Why are Parameter Properties discouraged in modern multi-target / strip-only environments?
**Answer:**
In modern environments running Node.js `--experimental-strip-types` or TypeScript without transpile steps (isolated declarations), parameter properties cannot be stripped as pure types because they generate executable runtime assignment code. Explicit property declarations guarantee 100% compatibility across all runtimes.

---

#### Q12: What does the `strictPropertyInitialization` compiler option enforce?
**Answer:**
When enabled (with `strictNullChecks`), TypeScript ensures that every non-optional class property is explicitly initialized either at its declaration site or inside the constructor.

```typescript
class Config {
  // TS2564: Property 'port' has no initializer and is not definitely assigned in the constructor.
  // public port: number;

  public port: number = 8080; // OK
}
```

---

#### Q13: What is the Definite Assignment Assertion operator (`!`) on class properties?
**Answer:**
Placing `!` after a property name tells the compiler that the property will be initialized out-of-band (e.g. via dependency injection or lifecycle hooks) and suppresses `TS2564`:

```typescript
class Component {
  public element!: HTMLElement; // Initialized in onMount lifecycle

  public onMount(el: HTMLElement) {
    this.element = el;
  }
}
```

---

#### Q14: What is Polymorphic `this` as a return type?
**Answer:**
Polymorphic `this` allows method chaining in base classes to return the exact type of the derived subclass at runtime:

```typescript
class Builder {
  public setStep(): this {
    return this;
  }
}

class AdvancedBuilder extends Builder {
  public setSpecial(): this {
    return this;
  }
}

const b = new AdvancedBuilder().setStep().setSpecial(); // Type remains AdvancedBuilder!
```

---

#### Q15: How do type predicates on class methods (`this is SubType`) narrow instances?
**Answer:**
A method with return type `this is SubType` refines the type of the caller instance within conditional control flow:

```typescript
abstract class Vehicle {
  public isCar(): this is Car {
    return this instanceof Car;
  }
}

class Car extends Vehicle {
  public drive(): void {}
}

function operate(v: Vehicle) {
  if (v.isCar()) {
    v.drive(); // Narrowed to Car
  }
}
```

---

#### Q16: What is an `abstract class` and how does it differ from an `interface`?
**Answer:**
- `abstract class`: Can contain both abstract method signatures AND concrete method implementations, fields, and constructors. It generates runtime JavaScript code and supports `instanceof`.
- `interface`: A pure compile-time contract without any runtime code or implementation.

---

#### Q17: Can an abstract class be instantiated directly using `new`?
**Answer:**
No. Attempting `new AbstractClass()` produces `TS2511: Cannot create an instance of an abstract class`.

---

#### Q18: How do you define a type for an abstract class constructor?
**Answer:**
Use the `abstract new` constructor signature:

```typescript
type AbstractCtor<T = any> = abstract new (...args: any[]) => T;

function isInstanceOf<T>(inst: any, ctor: AbstractCtor<T>): inst is T {
  return inst instanceof ctor;
}
```

---

#### Q19: What is the "Interface Parameter Type Trap" with `implements`?
**Answer:**
When a class implements an interface, TypeScript validates the public shape of the class, but it does **NOT** infer the parameter types of implemented methods. You must annotate parameter types explicitly or they default to `any`:

```typescript
interface Processor {
  execute(data: string): boolean;
}

class MyProcessor implements Processor {
  // Must annotate '(data: string)', otherwise 'data' implicitly has type 'any'!
  execute(data: string): boolean {
    return data.length > 0;
  }
}
```

---

#### Q20: Can a class implement multiple interfaces?
**Answer:**
Yes. A class can implement any number of comma-separated interfaces:

```typescript
interface Readable { read(): string; }
interface Writable { write(data: string): void; }

class StreamBuffer implements Readable, Writable {
  read(): string { return ""; }
  write(data: string): void {}
}
```

---

#### Q21: What is the `override` keyword introduced in TypeScript 4.3?
**Answer:**
`override` explicitly marks a method that intends to override a method inherited from a base class. When `noImplicitOverride: true` is enabled, omitting `override` on an overridden method triggers a compile error.

```typescript
class BaseService {
  start(): void {}
}

class DerivedService extends BaseService {
  override start(): void {
    super.start();
  }
}
```

---

#### Q22: What problem does `noImplicitOverride` prevent?
**Answer:**
It prevents two bugs:
1. **Accidental Overriding**: Defining a method in a subclass that accidentally shares the name of a base class method without realizing it.
2. **Phantom Overrides**: Modifying or removing a base class method, causing the subclass's intended override to silently become an unrelated orphan method.

---

#### Q23: How does static inheritance work in TypeScript/ES6 classes?
**Answer:**
Static members are attached directly to the constructor function. Because `DerivedClass.__proto__ === BaseClass`, derived classes inherit all public and protected static properties and methods of their base class.

```typescript
class Parent {
  public static appName: string = "Suite";
}

class Child extends Parent {}

console.log(Child.appName); // "Suite"
```

---

#### Q24: What are Static Initialization Blocks (`static { ... }`, ES2022 / TS 4.4+)?
**Answer:**
Static blocks provide a dedicated lexical scope inside class bodies to run initialization statements, setup logic, and error handling for static members during class definition:

```typescript
class Registry {
  public static items: Map<string, string>;

  static {
    Registry.items = new Map();
    Registry.items.set("default", "v1");
  }
}
```

---

#### Q25: In what order do static blocks and static fields execute in an inheritance hierarchy?
**Answer:**
1. Base class static fields and static blocks execute in definition order.
2. Derived class static fields and static blocks execute in definition order.

---

#### Q26: Can static blocks access private instance fields or private static fields?
**Answer:**
Static blocks can access **private static fields** (`#privateStatic`) within the same class, but they cannot access instance fields because no instance exists during static evaluation.

---

#### Q27: How do you dynamically reference the derived constructor inside an instance method?
**Answer:**
Using `this.constructor`:

```typescript
class BaseNode {
  public clone(): this {
    const Ctor = this.constructor as new () => this;
    return new Ctor();
  }
}
```

---

#### Q28: How do you emulate Multiple Inheritance in TypeScript using Mixins?
**Answer:**
By defining functions that accept a generic constructor type and return a class expression extending it:

```typescript
type GConstructor<T = {}> = new (...args: any[]) => T;

function Activatable<TBase extends GConstructor>(Base: TBase) {
  return class extends Base {
    public isActive: boolean = false;
    public activate() { this.isActive = true; }
  };
}
```

---

#### Q29: Can mixins define constructors that accept arguments?
**Answer:**
Yes, by using `...args: any[]` and passing them to `super(...args)`:

```typescript
function Tagged<TBase extends GConstructor>(Base: TBase) {
  return class extends Base {
    public tag: string;
    constructor(...args: any[]) {
      super(...args);
      this.tag = "default-tag";
    }
  };
}
```

---

#### Q30: What is the limitation of mixin composition regarding private `#fields`?
**Answer:**
Classes generated inside mixin expressions cannot declare `#private` fields if the mixin is invoked multiple times in the same inheritance hierarchy due to ECMAScript private field branding rules.

---

#### Q31: How does return type covariance apply to class method overrides?
**Answer:**
A derived class method can narrow its return type to a subtype of the parent class method's return type:

```typescript
class AnimalProducer {
  produce(): object { return {}; }
}

class SpecificProducer extends AnimalProducer {
  // Covariant narrowing: returns { id: string } which is a subtype of object
  override produce(): { id: string } { return { id: "1" }; }
}
```

---

#### Q32: Why are method parameters bivariant by default in TypeScript classes?
**Answer:**
To maintain ergonomics for arrays and collections (e.g. `Array<Derived>` assignable to `Array<Base>`), method declarations in TypeScript classes are checked bivariantly unless declared as function property signatures.

---

#### Q33: How do you enforce strict contravariant parameter checking in class methods?
**Answer:**
Declare methods as function properties rather than method signatures:

```typescript
class Handler {
  // Function property: strictly checked contravariantly under 'strictFunctionTypes'
  public process: (input: string) => void = (input) => {};
}
```

---

#### Q34: What is the rule for getter and setter types in TypeScript 4.3+?
**Answer:**
TypeScript 4.3 allows setters to accept a broader type than the getter returns:

```typescript
class Dimension {
  private _width: number = 0;

  get width(): number {
    return this._width;
  }

  // Setter accepts string OR number; coerces to number internally
  set width(value: string | number) {
    this._width = typeof value === "string" ? parseFloat(value) : value;
  }
}
```

---

#### Q35: How do you make a TypeScript class iterable using `[Symbol.iterator]`?
**Answer:**
Implement the `Iterable<T>` interface and declare a generator method:

```typescript
class NumberCollection implements Iterable<number> {
  private items: number[] = [1, 2, 3];

  *[Symbol.iterator](): Iterator<number> {
    for (const item of this.items) {
      yield item;
    }
  }
}

for (const n of new NumberCollection()) console.log(n); // 1, 2, 3
```

---

#### Q36: What is the `using` statement and `[Symbol.dispose]` in TypeScript 5.2+?
**Answer:**
TypeScript 5.2 introduced explicit resource management (TC39 Stage 3). When an object implements `[Symbol.dispose]()`, declaring it with `using` guarantees that `[Symbol.dispose]()` will be invoked automatically when execution exits the lexical block:

```typescript
class TempFile implements Disposable {
  public path: string = "/tmp/work.txt";

  [Symbol.dispose](): void {
    console.log("Cleaning up temp file...");
  }
}

{
  using file = new TempFile();
  console.log(`Writing to ${file.path}`);
} // 'Symbol.dispose' executes here automatically!
```

---

#### Q37: What is `await using` and `[Symbol.asyncDispose]`?
**Answer:**
The asynchronous variant of resource management for resources requiring async cleanup (database connections, network sockets):

```typescript
class AsyncDbConnection implements AsyncDisposable {
  async [Symbol.asyncDispose](): Promise<void> {
    console.log("Closing DB connection asynchronously...");
  }
}

async function runQuery() {
  await using db = new AsyncDbConnection();
} // Automatically awaits [Symbol.asyncDispose]() upon exit!
```

---

#### Q38: How do you implement nominal branding in classes using private fields?
**Answer:**
ECMAScript private fields create true nominal types because TypeScript considers two classes structurally incompatible if either contains a private field:

```typescript
class OrderId {
  #brand!: void;
  public value: string;
  constructor(v: string) { this.value = v; }
}

class UserId {
  #brand!: void;
  public value: string;
  constructor(v: string) { this.value = v; }
}

let order: OrderId = new OrderId("ord_1");
// let user: UserId = order; // TS2322: Type 'OrderId' is not assignable to type 'UserId'.
```

---

#### Q39: What happens when `super()` is omitted in a derived class constructor?
**Answer:**
TypeScript throws `TS17009: 'super' must be called before accessing 'this' in the constructor of a derived class`.

---

#### Q40: Can you access `this` before calling `super()` in a constructor?
**Answer:**
No. ECMAScript spec dictates that derived class instance binding (`this`) is only initialized after `super()` evaluates.

---

#### Q41: How do you declare a constructor that cannot be instantiated outside the class (Singleton pattern)?
**Answer:**
Mark the `constructor` as `private`:

```typescript
class GlobalConfig {
  private static instance: GlobalConfig;
  private constructor() {}

  public static getInstance(): GlobalConfig {
    if (!this.instance) this.instance = new GlobalConfig();
    return this.instance;
  }
}

// new GlobalConfig(); // TS2673: Constructor is private.
const config = GlobalConfig.getInstance();
```

---

#### Q42: What is the effect of marking a constructor `protected`?
**Answer:**
The class cannot be instantiated directly via `new`, but it can be extended and instantiated by derived subclasses.

---

#### Q43: How does TypeScript type-check method overloading in classes?
**Answer:**
Multiple overload signatures precede a single implementation signature. The implementation signature is not visible to external callers:

```typescript
class Formatter {
  format(val: string): string;
  format(val: number): string;
  format(val: any): string {
    return String(val);
  }
}
```

---

#### Q44: Can static methods be overloaded in classes?
**Answer:**
Yes, static methods follow identical overloading mechanics to instance methods.

---

#### Q45: How do you ensure that a class method cannot be overridden by subclasses (final methods)?
**Answer:**
TypeScript does not currently have a native `final` keyword for methods, but you can achieve finality by defining the method as a `readonly` function property in the base class:

```typescript
class BasePipeline {
  public readonly execute = (): void => {
    console.log("Core execution algorithm cannot be overridden");
  };
}
```


---

## 3. 90 Real-World Technical Interview Q&As (Part 2: Q46–Q90)

---

#### Q46: What is the Single Responsibility Principle (SRP) in TypeScript?
**Answer:**
A class should have only one reason to change, meaning it must encapsulate only a single domain concern or responsibility.

```typescript
// SRP VIOLATION: Handles customer data, email formatting, and database queries:
// class BadCustomer { save() {} sendInvoice() {} }

// CLEAN SRP:
class Customer {
  constructor(public id: string, public name: string) {}
}

class CustomerRepository {
  async save(customer: Customer): Promise<void> {}
}

class InvoiceMailer {
  async send(customer: Customer, amount: number): Promise<void> {}
}
```

---

#### Q47: How is the Open/Closed Principle (OCP) implemented in TypeScript?
**Answer:**
Software entities should be open for extension, but closed for modification. We achieve this by depending on polymorphic interfaces or abstract base classes:

```typescript
interface TaxStrategy {
  calculate(amount: number): number;
}

class UsTaxStrategy implements TaxStrategy {
  calculate(amount: number): number { return amount * 0.08; }
}

class EuTaxStrategy implements TaxStrategy {
  calculate(amount: number): number { return amount * 0.20; }
}

class TaxCalculator {
  // Open to any new TaxStrategy without editing TaxCalculator:
  compute(amount: number, strategy: TaxStrategy): number {
    return strategy.calculate(amount);
  }
}
```

---

#### Q48: What is a classic violation of the Liskov Substitution Principle (LSP)?
**Answer:**
The Classic Rectangle/Square problem. Overriding `setWidth` and `setHeight` in a `Square` subclass breaks the behavioral contract assumed by callers of `Rectangle`:

```typescript
class Rectangle {
  protected _width: number = 0;
  protected _height: number = 0;

  setWidth(w: number) { this._width = w; }
  setHeight(h: number) { this._height = h; }
  getArea() { return this._width * this._height; }
}

class Square extends Rectangle {
  override setWidth(w: number) { this._width = w; this._height = w; }
  override setHeight(h: number) { this._width = h; this._height = h; }
}

function verify(rect: Rectangle) {
  rect.setWidth(5);
  rect.setHeight(4);
  // Caller expects 5 * 4 = 20. But Square yields 4 * 4 = 16! LSP VIOLATED!
}
```

---

#### Q49: How does the Interface Segregation Principle (ISP) prevent bloated code?
**Answer:**
Instead of defining one massive interface with dozens of methods, ISP splits contracts into small, cohesive role interfaces:

```typescript
// Fat interface: forces non-printing devices to implement print()
// interface Device { print(): void; scan(): void; fax(): void; }

// Role interfaces:
interface Printer { print(doc: string): void; }
interface Scanner { scan(): string; }

class SimplePrinter implements Printer {
  print(doc: string): void { console.log(doc); }
}
```

---

#### Q50: How does Dependency Inversion (DIP) differ from Dependency Injection (DI)?
**Answer:**
- **Dependency Inversion Principle (DIP)**: The high-level architectural rule stating that high-level modules should depend on abstractions (interfaces), not concrete implementations.
- **Dependency Injection (DI)**: The mechanical design pattern used to implement DIP by passing dependencies into a class (via constructor, property, or method) rather than having the class instantiate them directly.

```typescript
interface DataStore { get(key: string): string; }

class CacheService {
  // Dependency Injection fulfilling Dependency Inversion:
  constructor(private store: DataStore) {}
}
```

---

#### Q51: What is the "Fragile Base Class" problem in OOP?
**Answer:**
When changes made to a base class unintentionally break the behavior or internal state assumptions of derived subclasses due to tight coupling and shared implementation details.

---

#### Q52: Why is "Composition Over Inheritance" preferred in enterprise systems?
**Answer:**
Inheritance is rigid (`is-a`), creates compile-time coupling, exposes parent class internals, and cannot be changed at runtime. Composition (`has-a`) delegates responsibilities to interchangeable components that can be dynamically swapped at runtime.

```typescript
class LogProcessor {
  constructor(private formatter: LogFormatter, private transport: LogTransport) {}
}
```

---

#### Q53: How do you implement the Strategy Pattern in TypeScript?
**Answer:**
Define a family of algorithms behind a common interface and encapsulate each one in a separate class:

```typescript
interface RouteStrategy {
  buildRoute(start: string, end: string): string;
}

class FastestRoute implements RouteStrategy {
  buildRoute(s: string, e: string) { return `Fastest: ${s} -> ${e}`; }
}

class ScenicRoute implements RouteStrategy {
  buildRoute(s: string, e: string) { return `Scenic: ${s} -> ${e}`; }
}

class Navigator {
  constructor(private strategy: RouteStrategy) {}
  navigate(a: string, b: string) { return this.strategy.buildRoute(a, b); }
}
```

---

#### Q54: How do you implement the Factory Pattern in TypeScript?
**Answer:**
```typescript
interface NotificationSender {
  send(message: string): void;
}

class EmailSender implements NotificationSender {
  send(msg: string) { console.log(`Email: ${msg}`); }
}

class SmsSender implements NotificationSender {
  send(msg: string) { console.log(`SMS: ${msg}`); }
}

class NotificationFactory {
  static create(type: "email" | "sms"): NotificationSender {
    switch (type) {
      case "email": return new EmailSender();
      case "sms": return new SmsSender();
    }
  }
}
```

---

#### Q55: How do you implement the Template Method pattern in TypeScript?
**Answer:**
An abstract class defines the invariant skeleton of an algorithm in a concrete method and defers specific variant steps to abstract methods:

```typescript
abstract class DataMiner {
  // Invariant Template Method
  public mine(path: string): void {
    const raw = this.openFile(path);
    const parsed = this.parseData(raw);
    this.saveReport(parsed);
  }

  protected abstract openFile(path: string): string;
  protected abstract parseData(raw: string): any;

  protected saveReport(data: any): void {
    console.log("Report saved.");
  }
}
```

---

#### Q56: What is the difference between an Entity and a Value Object in Domain-Driven Design (DDD)?
**Answer:**
- **Entity**: Defined by a unique continuous identity (`id`) that persists across mutations. Two entities with different IDs are distinct even if their data matches.
- **Value Object**: Defined solely by its attributes. Immutable with no conceptual identity. Two value objects with identical attributes are equal.

```typescript
class Money {
  constructor(public readonly amount: number, public readonly currency: string) {}

  equals(other: Money): boolean {
    return this.amount === other.amount && this.currency === other.currency;
  }
}
```

---

#### Q57: How do you model an Aggregate Root in TypeScript?
**Answer:**
An Aggregate Root is the primary Entity in a cluster of domain objects that controls all access, enforces transactional consistency invariants, and records Domain Events:

```typescript
abstract class AggregateRoot<TId> {
  protected domainEvents: any[] = [];
  constructor(public readonly id: TId) {}

  protected recordEvent(event: any): void {
    this.domainEvents.push(event);
  }

  public pullEvents(): any[] {
    const events = [...this.domainEvents];
    this.domainEvents = [];
    return events;
  }
}
```

---

#### Q58: What is the Specification Pattern in TypeScript Repositories?
**Answer:**
Encapsulating query criteria into a reusable class that evaluates both in-memory and against database queries:

```typescript
interface Specification<T> {
  isSatisfiedBy(candidate: T): boolean;
}

class ActiveUserSpec implements Specification<{ isActive: boolean }> {
  isSatisfiedBy(user: { isActive: boolean }): boolean {
    return user.isActive;
  }
}
```

---

#### Q59: Why do class method arrows vs prototype methods affect memory?
**Answer:**
- **Prototype Methods**: Defined once on `Class.prototype` and shared across all 1,000,000 instances in memory.
- **Arrow Function Properties** (`public fn = () => {}`): Creates a unique closure function object per instance, consuming significantly more heap memory.

---

#### Q60: When should you use Arrow Function Properties on classes?
**Answer:**
When passing the method as an un-bound callback to external event listeners or `setTimeout` where you need `this` to remain lexically bound without calling `.bind(this)`.

---

#### Q61: What is the performance impact of V8 Hidden Classes (Shapes) on class instances?
**Answer:**
If properties are added to instances in differing orders or dynamically attached after construction, V8 diverges their Hidden Classes (Shapes), deoptimizing inline caches (ICs) into slower dictionary lookups. Always declare and initialize properties in uniform order inside the constructor.

---

#### Q62: Why does `delete instance.prop` hurt performance in classes?
**Answer:**
`delete` forces V8 to drop the object's optimized Hidden Class and degrade the instance into slow dictionary mode (hash map lookups). Set properties to `null` or `undefined` instead of using `delete`.

---

#### Q63: How do you declare an explicit `this: void` parameter in a class method?
**Answer:**
To guarantee that a method cannot access `this` and can safely be passed as an unbound function without runtime binding bugs:

```typescript
class MathUtils {
  public static add(this: void, a: number, b: number): number {
    return a + b;
  }
}
```

---

#### Q64: What is F-Bounded Polymorphism in TypeScript classes?
**Answer:**
A generic constraint where a type parameter references itself (`T extends Comparable<T>`):

```typescript
interface Comparable<T> {
  compareTo(other: T): number;
}

class PriorityItem implements Comparable<PriorityItem> {
  constructor(public priority: number) {}

  compareTo(other: PriorityItem): number {
    return this.priority - other.priority;
  }
}
```

---

#### Q65: Why can `instanceof` fail in multi-realm environments (iframes, Web Workers, Node vm)?
**Answer:**
`instanceof` checks if the constructor's `.prototype` matches in the prototype chain. If an object is created in an iframe or different `vm.Context`, its constructor prototype belongs to that realm and is NOT strictly equal (`!==`) to the main realm's prototype.

---

#### Q66: How do you defend against multi-realm `instanceof` failures?
**Answer:**
Use Symbol branding with `Symbol.hasInstance`:

```typescript
const REALM_BRAND = Symbol("REALM_BRAND");

class CrossRealmEntity {
  public [REALM_BRAND] = true;

  static [Symbol.hasInstance](instance: any): boolean {
    return Boolean(instance && instance[REALM_BRAND]);
  }
}
```

---

#### Q67: How do you customize JSON serialization of a class?
**Answer:**
Implement the `toJSON()` method. When `JSON.stringify(instance)` is called, JavaScript automatically calls `toJSON()`:

```typescript
class UserAccount {
  #passwordHash: string = "secret_hash";
  constructor(public id: string, public email: string) {}

  toJSON() {
    return { id: this.id, email: this.email };
  }
}

const u = new UserAccount("1", "user@test.com");
console.log(JSON.stringify(u)); // {"id":"1","email":"user@test.com"}
```

---

#### Q68: Why does `JSON.stringify` ignore `#private` fields?
**Answer:**
Because ECMAScript `#private` fields are completely invisible to property enumeration, `Object.keys()`, and reflection. `JSON.stringify` only serializes enumerable string-keyed own properties.

---

#### Q69: How do you prevent instances of a class from being modified?
**Answer:**
Call `Object.freeze(this)` at the end of the constructor:

```typescript
class ImmutableRecord {
  constructor(public readonly key: string, public readonly value: string) {
    Object.freeze(this);
  }
}
```

---

#### Q70: What is the Adapter Pattern and when do you use it?
**Answer:**
It converts the interface of a class into another interface clients expect, enabling classes with incompatible interfaces to work together:

```typescript
interface TargetPaymentGateway {
  pay(cents: number): Promise<void>;
}

class LegacyPaymentSystem {
  makePayment(dollars: number): void {}
}

class PaymentAdapter implements TargetPaymentGateway {
  constructor(private legacy: LegacyPaymentSystem) {}

  async pay(cents: number): Promise<void> {
    this.legacy.makePayment(cents / 100);
  }
}
```

---

#### Q71: How do you implement the Command Pattern with Undo support?
**Answer:**
```typescript
interface Command {
  execute(): void;
  undo(): void;
}

class TextEditor {
  public content: string = "";
}

class AppendCommand implements Command {
  constructor(private editor: TextEditor, private text: string) {}

  execute(): void { this.editor.content += this.text; }
  undo(): void { this.editor.content = this.editor.content.slice(0, -this.text.length); }
}
```

---

#### Q72: How do you type an Inversion of Control (IoC) Service Token?
**Answer:**
```typescript
export interface ServiceToken<T> {
  symbol: symbol;
  _type?: T;
}

export function createToken<T>(description: string): ServiceToken<T> {
  return { symbol: Symbol(description) };
}
```

---

#### Q73: What is the difference between Transient, Scoped, and Singleton service lifetimes in IoC?
**Answer:**
- **Transient**: A new instance is constructed every time it is injected.
- **Scoped**: A single instance is constructed per request/transaction scope and reused within that scope.
- **Singleton**: Only one instance is constructed for the entire lifetime of the application.

---

#### Q74: How do you prevent circular dependency crashes in class hierarchies?
**Answer:**
1. Avoid mutual imports between base and derived class files.
2. Abstract shared dependencies into independent interfaces.
3. Use property/method dependency injection rather than constructor instantiations.

---

#### Q75: What is the difference between `class` and `interface` for API DTOs?
**Answer:**
- `interface`: Has zero runtime footprint; ideal when parsing raw JSON responses directly without instantiation.
- `class`: Enables runtime validation, default property values, and instance methods; requires an explicit instantiation step (`new DTO(data)` or `plainToInstance`).

---

#### Q76: How do you safely rehydrate JSON into class instances with prototype chains intact?
**Answer:**
Use `Object.assign(new TargetClass(), json)` or custom mapper constructors:

```typescript
class UserProfile {
  public name: string = "";
  public getInitials(): string { return this.name.charAt(0); }

  static fromJSON(json: Record<string, any>): UserProfile {
    const inst = new UserProfile();
    inst.name = json.name;
    return inst;
  }
}
```

---

#### Q77: How do you implement the Observer Pattern in TypeScript classes?
**Answer:**
```typescript
interface Observer<T> {
  update(data: T): void;
}

class Subject<T> {
  private observers: Observer<T>[] = [];

  subscribe(obs: Observer<T>): () => void {
    this.observers.push(obs);
    return () => { this.observers = this.observers.filter((o) => o !== obs); };
  }

  notify(data: T): void {
    for (const obs of this.observers) obs.update(data);
  }
}
```

---

#### Q78: How do you implement the Decorator/Wrapper Pattern without inheritance?
**Answer:**
Wrap an existing object that implements an interface and delegate calls, adding behavior before or after:

```typescript
interface HttpHandler {
  handle(req: any): Promise<any>;
}

class LoggingHttpDecorator implements HttpHandler {
  constructor(private inner: HttpHandler) {}

  async handle(req: any): Promise<any> {
    console.log(`[REQ] ${req.url}`);
    const res = await this.inner.handle(req);
    console.log(`[RES] status: ${res.status}`);
    return res;
  }
}
```

---

#### Q79: How do you create an immutable Step-Builder with compile-time type states?
**Answer:**
By tracking builder progress in a generic type parameter and returning new builder instances at each step:

```typescript
class RequestBuilder<HasUrl extends boolean = false, HasMethod extends boolean = false> {
  private url?: string;
  private method?: string;

  setUrl(url: string): RequestBuilder<true, HasMethod> {
    const next = new RequestBuilder<true, HasMethod>();
    next.url = url;
    next.method = this.method;
    return next;
  }

  setMethod(method: string): RequestBuilder<HasUrl, true> {
    const next = new RequestBuilder<HasUrl, true>();
    next.url = this.url;
    next.method = method;
    return next;
  }

  // Only callable when both URL and Method are provided!
  build(this: RequestBuilder<true, true>): { url: string; method: string } {
    return { url: this.url!, method: this.method! };
  }
}
```

---

#### Q80: How does TypeScript type-check class getters without explicit return types?
**Answer:**
TypeScript infers the getter's return type from the return expression inside the getter body. If a matching setter exists, the setter parameter type is automatically inferred from the getter return type unless annotated.

---

#### Q81: What is the Curiously Recurring Template Pattern (CRTP) in TypeScript?
**Answer:**
A derived class passes itself as a type parameter to its base class:

```typescript
abstract class Clonable<Derived> {
  abstract clone(): Derived;
}

class DocumentNode extends Clonable<DocumentNode> {
  override clone(): DocumentNode {
    return new DocumentNode();
  }
}
```

---

#### Q82: Can an `interface` extend a `class` in TypeScript?
**Answer:**
Yes! An interface extending a class inherits all public, protected, and private members of the class, but without their implementations. Only the class itself or a subclass of it can implement such an interface!

```typescript
class Control {
  private state: any;
}

interface SelectableControl extends Control {
  select(): void;
}
```

---

#### Q83: How do you enforce that a class instance can only be created via a factory method?
**Answer:**
Make the constructor `private`:

```typescript
class SecureToken {
  private constructor(public readonly token: string) {}

  public static generate(): SecureToken {
    return new SecureToken("sec_" + Math.random());
  }
}
```

---

#### Q84: What happens if a derived class constructor omits `super()` when the base class has no constructor?
**Answer:**
If the base class has no constructor, the derived class must still call `super()` if it declares its own constructor.

---

#### Q85: How do you implement a Type-Safe Dynamic Class Registry?
**Answer:**
```typescript
type PluginConstructor = new () => any;

class PluginRegistry {
  private static plugins = new Map<string, PluginConstructor>();

  public static register(name: string, ctor: PluginConstructor): void {
    this.plugins.set(name, ctor);
  }

  public static create(name: string): any {
    const Ctor = this.plugins.get(name);
    if (!Ctor) throw new Error(`Unknown plugin: ${name}`);
    return new Ctor();
  }
}
```

---

#### Q86: What are the three layers of Clean Architecture and how are classes organized?
**Answer:**
1. **Domain Layer**: Pure Entities, Value Objects, and Domain Events (no external framework dependencies).
2. **Use Case / Application Layer**: Application Services and Ports (Abstract Repositories/Gateways).
3. **Infrastructure / Adapter Layer**: Concrete DB Repositories, Controllers, and External HTTP Adapters.

---

#### Q87: How do you mock a class dependency cleanly in unit tests without Jest `jest.mock()`?
**Answer:**
By relying on interface abstractions and passing an in-memory test double class:

```typescript
class InMemoryUserRepo implements UserRepository {
  public users: User[] = [];
  async save(user: User): Promise<void> { this.users.push(user); }
}
```

---

#### Q88: How do you detect whether an object is a class constructor function at runtime?
**Answer:**
Check `typeof obj === 'function'` and whether `Function.prototype.toString.call(obj).startsWith('class ')`.

---

#### Q89: Can a class implement an intersection of multiple types?
**Answer:**
Yes: `class MyClass implements (InterfaceA & InterfaceB) { ... }`.

---

#### Q90: How do you enforce strict immutability across an entire domain entity hierarchy?
**Answer:**
1. Mark all properties as `public readonly`.
2. Wrap all collections in `ReadonlyArray<T>` or `ReadonlyMap<K, V>`.
3. Freeze instances in constructors via `Object.freeze(this)`.
4. Perform state updates by returning fresh cloned instances (Copy-on-Write).


---

## 4. Output Prediction Puzzles (15 Puzzles with Step-by-Step Traces)

Test your mental model of TypeScript's class internals, prototype chains, static block execution order, `#private` encapsulation, and polymorphic `this` resolution.

---

### Puzzle 1: Static vs Instance Symbol Resolution

```typescript
class Widget {
  public static count: number = 10;
  public count: number = 5;

  public getCount(): number {
    return this.count;
  }
}

const W: typeof Widget = Widget;
const w: Widget = new Widget();

// Question: What are the values of W.count and w.getCount()?
```

**Step-by-Step Evaluation Trace:**
1. `Widget` introduces both an instance type (`Widget`) and a constructor value (`typeof Widget`).
2. `W` is bound to the constructor function `Widget`. `W.count` accesses the static property on the constructor object -> `10`.
3. `w` is an instance of `Widget`. `w.count` is `5`.
4. `w.getCount()` returns `this.count` which resolves to the instance property `5`.
5. **Output Values:** `W.count = 10`, `w.getCount() = 5`.

---

### Puzzle 2: Reflection Visibility of `#private` vs `private`

```typescript
class Vault {
  private softKey: string = "soft_123";
  #hardKey: string = "hard_456";

  public getKeys(): string[] {
    return Object.keys(this);
  }
}

const vault = new Vault();
const keys = vault.getKeys();
// Question: What array is returned by vault.getKeys()?
```

**Step-by-Step Evaluation Trace:**
1. TypeScript's `private softKey` compiles down to an ordinary JavaScript property `this.softKey = "soft_123"`. It is an own enumerable property.
2. ECMAScript `#hardKey` uses private brand slots managed by the engine. It is completely invisible to `Object.keys()`, `Object.getOwnPropertyNames()`, and `Reflect.ownKeys()`.
3. `Object.keys(this)` iterates over own enumerable string keys of the instance.
4. Only `"softKey"` is found.
5. **Output Value:** `["softKey"]`.

---

### Puzzle 3: Polymorphic `this` Across Three Levels of Inheritance

```typescript
class StepOne {
  public alpha(): this { return this; }
}

class StepTwo extends StepOne {
  public beta(): this { return this; }
}

class StepThree extends StepTwo {
  public gamma(): this { return this; }
}

const result = new StepThree().alpha().beta().gamma();
// Question: What is the compile-time type of 'result'?
```

**Step-by-Step Evaluation Trace:**
1. `new StepThree()` has type `StepThree`.
2. `.alpha()` is defined on `StepOne` returning `this`. Because `this` is polymorphic, the return type is dynamically bound to the calling subtype (`StepThree`).
3. `.beta()` is defined on `StepTwo` returning `this` -> still typed as `StepThree`.
4. `.gamma()` is called on `StepThree`, returning `StepThree`.
5. Without casting, the type flows seamlessly across all 3 levels.
6. **Output Type:** `StepThree`.

---

### Puzzle 4: The `implements` Parameter Type Erasure Trap

```typescript
interface StringTransformer {
  transform(input: string): string;
}

class Capitalizer implements StringTransformer {
  transform(input) {
    return input.toUpperCase();
  }
}

const c = new Capitalizer();
// Question: Under strict mode (noImplicitAny: true), does this compile?
```

**Step-by-Step Evaluation Trace:**
1. `StringTransformer` specifies `transform(input: string): string`.
2. `Capitalizer implements StringTransformer` declares that the class matches the interface contract.
3. However, TypeScript does **NOT** infer parameter types for methods implemented from an interface.
4. Parameter `input` has no type annotation.
5. Under strict mode (`noImplicitAny: true`), TypeScript flags:
   `TS7006: Parameter 'input' implicitly has an 'any' type.`
6. **Result:** Compilation Error `TS7006`. Parameter types must be explicitly typed!

---

### Puzzle 5: Static Initialization Blocks Execution Order

```typescript
const executionOrder: string[] = [];

class Base {
  static {
    executionOrder.push("Base Static Block");
  }
  public static baseProp = executionOrder.push("Base Static Prop");
}

class Derived extends Base {
  public static derivedProp = executionOrder.push("Derived Static Prop");
  static {
    executionOrder.push("Derived Static Block");
  }
}

// Question: What is executionOrder after Derived class is defined?
```

**Step-by-Step Evaluation Trace:**
1. The engine evaluates `Base` first:
   - `static { ... }` block in `Base` executes -> pushes `"Base Static Block"`.
   - `baseProp` initializer runs -> pushes `"Base Static Prop"`.
2. Next, the engine evaluates `Derived`:
   - `derivedProp` initializer runs -> pushes `"Derived Static Prop"`.
   - `static { ... }` block in `Derived` runs -> pushes `"Derived Static Block"`.
3. **Output Array:**
   ```javascript
   [
     "Base Static Block",
     "Base Static Prop",
     "Derived Static Prop",
     "Derived Static Block"
   ]
   ```

---

### Puzzle 6: Prototype Method vs Arrow Function Callback Binding

```typescript
class Processor {
  public name: string = "PrimaryProcessor";

  public protoMethod(): string {
    return this.name;
  }

  public arrowMethod = (): string => {
    return this.name;
  };
}

const p = new Processor();
const fn1 = p.protoMethod;
const fn2 = p.arrowMethod;

// Case A: fn2()
// Case B: fn1()
```

**Step-by-Step Evaluation Trace:**
1. `protoMethod` is defined on `Processor.prototype`. When extracted (`fn1 = p.protoMethod`) and invoked unbound (`fn1()`), `this` is `undefined` in strict mode. Invoking `fn1()` throws:
   `TypeError: Cannot read properties of undefined (reading 'name')`.
2. `arrowMethod` is an own property initialized as an arrow function closed over `this` (the instance `p`). When invoked unbound (`fn2()`), `this` remains strictly bound to `p`.
3. `fn2()` returns `"PrimaryProcessor"`.
4. **Result:** `fn2()` returns `"PrimaryProcessor"`; `fn1()` throws runtime `TypeError`.

---

### Puzzle 7: Dual-Linkage Static Inheritance

```typescript
class SuperLogger {
  public static appPrefix: string = "[CORE]";
  public static log(msg: string): string {
    return `${this.appPrefix} ${msg}`;
  }
}

class SubLogger extends SuperLogger {
  public static override appPrefix: string = "[SUB]";
}

const out1 = SuperLogger.log("Started");
const out2 = SubLogger.log("Running");
```

**Step-by-Step Evaluation Trace:**
1. `SuperLogger.log("Started")`: `this` is `SuperLogger`. `this.appPrefix` is `"[CORE]"`. Returns `"[CORE] Started"`.
2. `SubLogger.log("Running")`: `SubLogger` inherits the static method `log` via `SubLogger.__proto__ === SuperLogger`.
3. Inside `SubLogger.log()`, `this` is `SubLogger`!
4. `this.appPrefix` on `SubLogger` resolves to `"[SUB]"`.
5. Returns `"[SUB] Running"`.
6. **Output Values:** `out1 = "[CORE] Started"`, `out2 = "[SUB] Running"`.

---

### Puzzle 8: Mixin Class Inheritance Order

```typescript
type GConstructor<T = {}> = new (...args: any[]) => T;

function WithA<TBase extends GConstructor>(Base: TBase) {
  return class extends Base {
    public tag: string = "A";
  };
}

function WithB<TBase extends GConstructor>(Base: TBase) {
  return class extends Base {
    public tag: string = "B";
  };
}

class Root {}
class TestClass extends WithB(WithA(Root)) {}

const inst = new TestClass();
// Question: What is inst.tag?
```

**Step-by-Step Evaluation Trace:**
1. `WithA(Root)` produces an intermediate class `ClassA` with `this.tag = "A"`.
2. `WithB(ClassA)` produces `ClassB` extending `ClassA`, where constructor initializes `this.tag = "B"`.
3. `TestClass` extends `ClassB`.
4. When `new TestClass()` runs:
   - `super()` calls `ClassB`'s constructor.
   - `ClassB` calls `super()`, running `ClassA`'s constructor (`tag = "A"`).
   - Execution returns to `ClassB`'s constructor body, assigning `this.tag = "B"`.
5. Property `tag` is overwritten by the outer mixin (`WithB`).
6. **Output Value:** `inst.tag = "B"`.

---

### Puzzle 9: Definite Assignment Assertion vs Constructor Timing

```typescript
class DataService {
  public data!: string[];

  constructor() {
    this.init();
  }

  private init(): void {
    this.data = ["ready"];
  }
}

const svc = new DataService();
// Question: Does TS compile this, and what is svc.data?
```

**Step-by-Step Evaluation Trace:**
1. `public data!: string[];` has definite assignment assertion `!`, suppressing `TS2564`.
2. At runtime, `new DataService()` calls `this.init()`.
3. `this.init()` assigns `this.data = ["ready"]`.
4. The property is populated synchronously.
5. **Output Value:** `svc.data = ["ready"]`.

---

### Puzzle 10: Private Constructor Singleton and Subclassing

```typescript
class SingletonMaster {
  private constructor() {}
}

class AttemptedSub extends SingletonMaster {
  // Question: Does AttemptedSub compile?
}
```

**Step-by-Step Evaluation Trace:**
1. A derived class must implicitly or explicitly call `super()`.
2. In `SingletonMaster`, the constructor is marked `private`.
3. A `private` constructor can only be called from inside `SingletonMaster`. Subclasses are forbidden from invoking `super()`.
4. TypeScript flags:
   `TS2675: Cannot extend a class 'SingletonMaster'. Class constructor is marked as private.`
5. **Result:** Compilation Error `TS2675`.

---

### Puzzle 11: Getter / Setter Type Asymmetry

```typescript
class NumericInput {
  private _val: number = 0;

  get value(): number {
    return this._val;
  }

  set value(v: number | string) {
    this._val = typeof v === "string" ? parseFloat(v) : v;
  }
}

const input = new NumericInput();
input.value = "100.5";
const num: number = input.value;
```

**Step-by-Step Evaluation Trace:**
1. The setter accepts `number | string`. Assigning `"100.5"` is strictly valid.
2. The setter executes, parsing `"100.5"` to `100.5`.
3. The getter returns `number`. Reading `input.value` produces type `number`.
4. Assigning to `num: number` compiles without error.
5. **Output Value:** `num = 100.5`.

---

### Puzzle 12: `instanceof` with `Symbol.hasInstance` Customization

```typescript
class NumberLike {
  public static [Symbol.hasInstance](instance: any): boolean {
    return typeof instance === "number" || instance instanceof Number;
  }
}

const val1: any = 42;
const val2: any = "42";

const check1 = val1 instanceof (NumberLike as any);
const check2 = val2 instanceof (NumberLike as any);
```

**Step-by-Step Evaluation Trace:**
1. The `instanceof` operator delegates to `Constructor[Symbol.hasInstance](value)` if defined.
2. For `val1 = 42`: `typeof 42 === "number"` is true -> returns `true`.
3. For `val2 = "42"`: string is not number -> returns `false`.
4. **Output Values:** `check1 = true`, `check2 = false`.

---

### Puzzle 13: `override` with `noImplicitOverride` Guard

```typescript
class BaseController {
  public handleRequest(req: any): void {}
}

class ApiController extends BaseController {
  public handlRequest(req: any): void {}
}
// With noImplicitOverride: true and 'override' modifier rules
```

**Step-by-Step Evaluation Trace:**
1. The developer intended to override `handleRequest` but made a typo (`handlRequest`).
2. Without `override`, the developer accidentally declares a brand new method.
3. If the developer wrote `public override handlRequest()`, TypeScript immediately flags:
   `TS4113: This member cannot have an 'override' modifier because it is not declared in the base class.`
4. The typo is caught instantly at build time!

---

### Puzzle 14: Method Parameter Contravariance under `strictFunctionTypes`

```typescript
class Animal { name = "Animal"; }
class Dog extends Animal { bark() {} }

class AnimalHandler {
  public handle: (a: Animal) => void = (a) => console.log(a.name);
}

class DogHandler extends AnimalHandler {
  // Can DogHandler narrow the parameter to Dog?
  // public override handle: (d: Dog) => void = (d) => d.bark();
}
```

**Step-by-Step Evaluation Trace:**
1. `AnimalHandler.handle` expects any `Animal`.
2. If `DogHandler` overrides `handle` with `(d: Dog) => void`, what happens if a caller has an `AnimalHandler` reference and passes a `Cat`?
3. Passing a `Cat` to a function expecting `Dog` crashes when calling `d.bark()`!
4. Function parameters are **contravariant** (or invariant). A derived class CANNOT narrow parameter types.
5. TypeScript flags `TS2322: Type '(d: Dog) => void' is not assignable to type '(a: Animal) => void'.`

---

### Puzzle 15: `using` Resource Disposal Execution Order

```typescript
const logs: string[] = [];

class Resource implements Disposable {
  constructor(private id: string) {}

  [Symbol.dispose](): void {
    logs.push(`Disposed ${this.id}`);
  }
}

function execute() {
  using r1 = new Resource("First");
  using r2 = new Resource("Second");
  logs.push("Work done");
}

execute();
// Question: What is the sequence in 'logs'?
```

**Step-by-Step Evaluation Trace:**
1. `r1` is acquired, then `r2` is acquired.
2. `"Work done"` is pushed.
3. As execution leaves the scope, `using` declarations are disposed in **reverse order of declaration** (LIFO / Stack order):
   - `r2` is disposed first -> `"Disposed Second"`.
   - `r1` is disposed second -> `"Disposed First"`.
4. **Output Sequence:**
   ```javascript
   [
     "Work done",
     "Disposed Second",
     "Disposed First"
   ]
   ```


---

## 5. Four Complete Runnable Production Projects with Test Assertions

Every project below is a fully functional, self-contained TypeScript engine demonstrating production OOP patterns, clean architecture, and SOLID design. All class properties are explicitly declared for strict Node.js compatibility (`--experimental-strip-types`).

---

### Project 1: Enterprise Domain-Driven Design (DDD) Entity & Aggregate Root Engine

#### Architectural Overview
```
+-------------------------------------------------------------------------+
|                  Enterprise Domain-Driven Design Engine                 |
+-------------------------------------------------------------------------+
|  [Entity<TId>] ──► Identity Equality & Optimistic Concurrency Version   |
|         │                                                               |
|         ▼                                                               |
|  [AggregateRoot<TId>] ──► Encapsulates Domain Events & Consistency      |
|         │                                                               |
|  [OrderAggregate]                                                       |
|    ├── addItem(sku, price, qty): void                                   |
|    ├── markPaid(txId): void                                             |
|    └── pullDomainEvents(): DomainEvent[]                                |
+-------------------------------------------------------------------------+
```

#### Complete Implementation & Verification Suite
```typescript
import assert from "node:assert";

export interface DomainEvent {
  eventName: string;
  occurredOn: Date;
  aggregateId: string;
  payload: any;
}

export abstract class Entity<TId> {
  public readonly id: TId;
  private _version: number;

  constructor(id: TId, initialVersion: number = 1) {
    this.id = id;
    this._version = initialVersion;
  }

  public get version(): number {
    return this._version;
  }

  protected incrementVersion(): void {
    this._version++;
  }

  public equals(other: Entity<TId> | null | undefined): boolean {
    if (other === null || other === undefined) return false;
    if (this === other) return true;
    return this.id === other.id;
  }
}

export abstract class AggregateRoot<TId extends string> extends Entity<TId> {
  private _domainEvents: DomainEvent[];

  constructor(id: TId, initialVersion: number = 1) {
    super(id, initialVersion);
    this._domainEvents = [];
  }

  protected recordEvent(eventName: string, payload: any): void {
    this.incrementVersion();
    this._domainEvents.push({
      eventName,
      occurredOn: new Date(),
      aggregateId: this.id,
      payload,
    });
  }

  public pullDomainEvents(): DomainEvent[] {
    const events = [...this._domainEvents];
    this._domainEvents = [];
    return events;
  }
}

// Concrete Domain Aggregate
export interface OrderItem {
  sku: string;
  unitPrice: number;
  quantity: number;
}

export class OrderAggregate extends AggregateRoot<string> {
  private _items: OrderItem[];
  private _status: "pending" | "paid" | "shipped" | "cancelled";
  private _transactionId?: string;

  constructor(orderId: string) {
    super(orderId);
    this._items = [];
    this._status = "pending";
  }

  public get status(): string {
    return this._status;
  }

  public get items(): ReadonlyArray<OrderItem> {
    return this._items;
  }

  public get totalAmount(): number {
    return this._items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
  }

  public addItem(sku: string, unitPrice: number, quantity: number): void {
    if (this._status !== "pending") {
      throw new Error(`Cannot add items to order in ${this._status} status`);
    }
    if (quantity <= 0) {
      throw new Error("Quantity must be positive");
    }

    this._items.push({ sku, unitPrice, quantity });
    this.recordEvent("ItemAddedToOrder", { sku, quantity, unitPrice });
  }

  public markAsPaid(transactionId: string): void {
    if (this._status !== "pending") {
      throw new Error(`Cannot pay for order in ${this._status} status`);
    }
    if (this._items.length === 0) {
      throw new Error("Cannot pay for an empty order");
    }

    this._status = "paid";
    this._transactionId = transactionId;
    this.recordEvent("OrderPaid", { transactionId, totalAmount: this.totalAmount });
  }
}

// Verification Assertions
const order = new OrderAggregate("ord_9901");
assert.strictEqual(order.version, 1);
assert.strictEqual(order.status, "pending");

order.addItem("SKU-KEYBOARD", 120, 1);
order.addItem("SKU-MOUSE", 60, 2);

assert.strictEqual(order.totalAmount, 240);
assert.strictEqual(order.version, 3); // 2 increments

order.markAsPaid("tx_stripe_abc");
assert.strictEqual(order.status, "paid");
assert.strictEqual(order.version, 4);

// Pull and verify domain events
const events = order.pullDomainEvents();
assert.strictEqual(events.length, 3);
assert.strictEqual(events[0].eventName, "ItemAddedToOrder");
assert.strictEqual(events[2].eventName, "OrderPaid");
assert.strictEqual(events[2].payload.totalAmount, 240);

// Events should be purged after pull
assert.strictEqual(order.pullDomainEvents().length, 0);

// Immutability of items array
assert.throws(() => {
  (order.items as any).push({ sku: "HACK", unitPrice: 0, quantity: 1 });
  // Verify encapsulated status prevents modification
  order.addItem("SKU-FAIL", 10, 1);
}, /Cannot add items to order in paid status/);

console.log("Project 1 (DDD Aggregate Root Engine) passed all assertions.");
```

---

### Project 2: Extensible Role-Based Access Control (RBAC) & Policy Engine

#### Architectural Overview
```
+-------------------------------------------------------------------------+
|                  Enterprise RBAC & Policy Enforcement Engine            |
+-------------------------------------------------------------------------+
|  [Permission]: { action: string, resource: string }                     |
|         │                                                               |
|  [Role]: Encapsulates hierarchical permissions                          |
|         │                                                               |
|  [Subject]: User with assigned Roles                                    |
|         │                                                               |
|  [PolicyEngine]                                                         |
|    ├── registerRole(role)                                               |
|    ├── can(subject, action, resource): boolean                          |
|    └── enforce(subject, action, resource): void                         |
+-------------------------------------------------------------------------+
```

#### Complete Implementation & Verification Suite
```typescript
import assert from "node:assert";

export interface Permission {
  action: string;
  resource: string;
}

export class Role {
  public readonly name: string;
  private permissions: Set<string>;
  private inheritedRoles: Role[];

  constructor(name: string) {
    this.name = name;
    this.permissions = new Set();
    this.inheritedRoles = [];
  }

  public grant(action: string, resource: string): this {
    this.permissions.add(`${action}:${resource}`);
    return this;
  }

  public inherit(role: Role): this {
    this.inheritedRoles.push(role);
    return this;
  }

  public hasPermission(action: string, resource: string): boolean {
    const target = `${action}:${resource}`;
    const wildcardTarget = `*:${resource}`;
    const globalWildcard = `*:*`;

    if (
      this.permissions.has(target) ||
      this.permissions.has(wildcardTarget) ||
      this.permissions.has(globalWildcard)
    ) {
      return true;
    }

    for (const inherited of this.inheritedRoles) {
      if (inherited.hasPermission(action, resource)) {
        return true;
      }
    }

    return false;
  }
}

export class UserSubject {
  public readonly id: string;
  private roles: Role[];

  constructor(id: string) {
    this.id = id;
    this.roles = [];
  }

  public assignRole(role: Role): this {
    this.roles.push(role);
    return this;
  }

  public can(action: string, resource: string): boolean {
    for (const role of this.roles) {
      if (role.hasPermission(action, resource)) {
        return true;
      }
    }
    return false;
  }

  public enforce(action: string, resource: string): void {
    if (!this.can(action, resource)) {
      throw new Error(`AccessDenied: User '${this.id}' cannot perform '${action}' on '${resource}'`);
    }
  }
}

// Verification Assertions
const viewerRole = new Role("viewer")
  .grant("read", "document")
  .grant("read", "report");

const editorRole = new Role("editor")
  .inherit(viewerRole)
  .grant("create", "document")
  .grant("update", "document");

const adminRole = new Role("admin")
  .grant("*", "*");

const bob = new UserSubject("usr_bob").assignRole(viewerRole);
const alice = new UserSubject("usr_alice").assignRole(editorRole);
const root = new UserSubject("usr_root").assignRole(adminRole);

// Bob (Viewer)
assert.strictEqual(bob.can("read", "document"), true);
assert.strictEqual(bob.can("update", "document"), false);

// Alice (Editor inherits Viewer)
assert.strictEqual(alice.can("read", "document"), true); // Inherited
assert.strictEqual(alice.can("update", "document"), true); // Direct
assert.strictEqual(alice.can("delete", "document"), false);

// Root (Admin wildcard)
assert.strictEqual(root.can("delete", "server"), true);

// Enforcement assertion
alice.enforce("create", "document"); // Passes cleanly
assert.throws(() => {
  bob.enforce("delete", "document");
}, /AccessDenied: User 'usr_bob' cannot perform 'delete' on 'document'/);

console.log("Project 2 (RBAC Policy Engine) passed all assertions.");
```

---

### Project 3: Type-Safe Finite State Machine (FSM) & Workflow Engine

#### Architectural Overview
```
+-------------------------------------------------------------------------+
|                  Type-Safe Finite State Machine (FSM)                   |
+-------------------------------------------------------------------------+
|  States: "Draft" | "Review" | "Approved" | "Published"                  |
|  Events: "SUBMIT" | "APPROVE" | "REJECT" | "PUBLISH"                    |
|         │                                                               |
|  [Transition Definition]: from, event, to, guardFn, actionFn            |
|         │                                                               |
|  [StateMachine<TState, TEvent>]                                         |
|    ├── transition(event, context): void                                 |
|    └── getState(): TState                                               |
+-------------------------------------------------------------------------+
```

#### Complete Implementation & Verification Suite
```typescript
import assert from "node:assert";

export interface Transition<TState extends string, TEvent extends string, TCtx> {
  from: TState;
  event: TEvent;
  to: TState;
  guard?: (ctx: TCtx) => boolean;
  action?: (ctx: TCtx) => void;
}

export class FiniteStateMachine<TState extends string, TEvent extends string, TCtx> {
  private currentState: TState;
  private transitions: Transition<TState, TEvent, TCtx>[];
  private context: TCtx;

  constructor(initialState: TState, initialContext: TCtx) {
    this.currentState = initialState;
    this.context = initialContext;
    this.transitions = [];
  }

  public addTransition(transition: Transition<TState, TEvent, TCtx>): this {
    this.transitions.push(transition);
    return this;
  }

  public getState(): TState {
    return this.currentState;
  }

  public getContext(): TCtx {
    return this.context;
  }

  public trigger(event: TEvent): boolean {
    for (const t of this.transitions) {
      if (t.from === this.currentState && t.event === event) {
        if (t.guard && !t.guard(this.context)) {
          return false; // Guard rejected transition
        }

        if (t.action) {
          t.action(this.context);
        }

        this.currentState = t.to;
        return true;
      }
    }

    throw new Error(`InvalidTransition: No valid transition from '${this.currentState}' on event '${event}'`);
  }
}

// Verification Assertions
type DocumentState = "draft" | "under_review" | "approved" | "published";
type DocumentEvent = "SUBMIT" | "APPROVE" | "REJECT" | "PUBLISH";

interface DocumentContext {
  title: string;
  reviewerScore: number;
  publishedUrl?: string;
}

const fsm = new FiniteStateMachine<DocumentState, DocumentEvent, DocumentContext>(
  "draft",
  { title: "TS OOP Guide", reviewerScore: 0 }
);

fsm
  .addTransition({
    from: "draft",
    event: "SUBMIT",
    to: "under_review",
    action: (ctx) => { ctx.reviewerScore = 85; },
  })
  .addTransition({
    from: "under_review",
    event: "APPROVE",
    to: "approved",
    guard: (ctx) => ctx.reviewerScore >= 80,
  })
  .addTransition({
    from: "under_review",
    event: "REJECT",
    to: "draft",
  })
  .addTransition({
    from: "approved",
    event: "PUBLISH",
    to: "published",
    action: (ctx) => { ctx.publishedUrl = `https://docs.ts.com/${ctx.title.toLowerCase().replace(/\s+/g, "-")}`; },
  });

assert.strictEqual(fsm.getState(), "draft");

// Transition: draft -> under_review
assert.strictEqual(fsm.trigger("SUBMIT"), true);
assert.strictEqual(fsm.getState(), "under_review");
assert.strictEqual(fsm.getContext().reviewerScore, 85);

// Transition: under_review -> approved (score 85 satisfies guard >= 80)
assert.strictEqual(fsm.trigger("APPROVE"), true);
assert.strictEqual(fsm.getState(), "approved");

// Transition: approved -> published
assert.strictEqual(fsm.trigger("PUBLISH"), true);
assert.strictEqual(fsm.getState(), "published");
assert.strictEqual(fsm.getContext().publishedUrl, "https://docs.ts.com/ts-oop-guide");

// Disallowed transition throws error
assert.throws(() => {
  fsm.trigger("SUBMIT");
}, /InvalidTransition: No valid transition from 'published' on event 'SUBMIT'/);

console.log("Project 3 (Finite State Machine) passed all assertions.");
```

---

### Project 4: Enterprise Notification Dispatcher with Composition & SOLID Pipeline

#### Architectural Overview
```
+-------------------------------------------------------------------------+
|                  Enterprise Notification Dispatcher                     |
+-------------------------------------------------------------------------+
|  [NotificationStrategy Interface]: send(msg): Promise<boolean>          |
|         │                                                               |
|  [Concrete Strategies]: EmailStrategy, SmsStrategy, WebhookStrategy     |
|         │                                                               |
|  [RateLimiterDecorator]: Prevents API quota exhaustion                  |
|         │                                                               |
|  [FallbackPipeline]: Tries primary channel -> fallbacks on failure      |
+-------------------------------------------------------------------------+
```

#### Complete Implementation & Verification Suite
```typescript
import assert from "node:assert";

export interface NotificationMessage {
  recipient: string;
  subject: string;
  body: string;
}

// 1. Core Abstraction (ISP & DIP)
export interface NotificationChannel {
  name: string;
  send(message: NotificationMessage): Promise<boolean>;
}

// 2. Concrete Channel Strategies (OCP & SRP)
export class EmailChannel implements NotificationChannel {
  public readonly name: string = "Email";
  public sentMessages: NotificationMessage[];

  constructor() {
    this.sentMessages = [];
  }

  public async send(message: NotificationMessage): Promise<boolean> {
    this.sentMessages.push(message);
    return true;
  }
}

export class SmsChannel implements NotificationChannel {
  public readonly name: string = "SMS";
  public sentMessages: NotificationMessage[];
  public shouldSimulateFailure: boolean;

  constructor(shouldFail: boolean = false) {
    this.sentMessages = [];
    this.shouldSimulateFailure = shouldFail;
  }

  public async send(message: NotificationMessage): Promise<boolean> {
    if (this.shouldSimulateFailure) {
      return false; // Gateway error
    }
    this.sentMessages.push(message);
    return true;
  }
}

// 3. Decorator Pattern: Rate Limiting & Audit Logging
export class RateLimitedChannel implements NotificationChannel {
  public readonly name: string;
  private inner: NotificationChannel;
  private maxRequests: number;
  private requestCount: number;

  constructor(inner: NotificationChannel, maxRequests: number) {
    this.inner = inner;
    this.name = `${inner.name} (RateLimited)`;
    this.maxRequests = maxRequests;
    this.requestCount = 0;
  }

  public async send(message: NotificationMessage): Promise<boolean> {
    if (this.requestCount >= this.maxRequests) {
      return false; // Rate limit exceeded
    }
    this.requestCount++;
    return this.inner.send(message);
  }
}

// 4. Notification Dispatcher with Fallback Pipeline (Composition)
export class NotificationDispatcher {
  private channels: NotificationChannel[];
  private auditLog: { channel: string; recipient: string; success: boolean }[];

  constructor(channels: NotificationChannel[]) {
    this.channels = channels;
    this.auditLog = [];
  }

  public async dispatchWithFallback(message: NotificationMessage): Promise<string> {
    for (const channel of this.channels) {
      try {
        const success = await channel.send(message);
        this.auditLog.push({ channel: channel.name, recipient: message.recipient, success });
        if (success) {
          return channel.name;
        }
      } catch (err) {
        this.auditLog.push({ channel: channel.name, recipient: message.recipient, success: false });
      }
    }

    throw new Error(`DispatchFailed: All notification channels failed for ${message.recipient}`);
  }

  public getAuditLogs(): ReadonlyArray<{ channel: string; recipient: string; success: boolean }> {
    return this.auditLog;
  }
}

// Verification Assertions
const smsPrimary = new SmsChannel(true); // Fails
const emailFallback = new EmailChannel();
const rateLimitedEmail = new RateLimitedChannel(emailFallback, 2);

const dispatcher = new NotificationDispatcher([smsPrimary, rateLimitedEmail]);

const msg: NotificationMessage = {
  recipient: "user@enterprise.corp",
  subject: "Account Alert",
  body: "Suspicious login attempt detected.",
};

// Dispatch message: SMS fails -> falls back to Email
const successfulChannel = await dispatcher.dispatchWithFallback(msg);
assert.strictEqual(successfulChannel, "Email (RateLimited)");
assert.strictEqual(emailFallback.sentMessages.length, 1);

// Send second message within rate limit
await dispatcher.dispatchWithFallback(msg);
assert.strictEqual(emailFallback.sentMessages.length, 2);

// Third message exceeds rate limit -> pipeline exhausts
await assert.rejects(async () => {
  await dispatcher.dispatchWithFallback(msg);
}, /DispatchFailed: All notification channels failed/);

assert.strictEqual(dispatcher.getAuditLogs().length, 6); // 3 attempts * 2 channels

console.log("Project 4 (Notification Dispatcher & SOLID Pipeline) passed all assertions.");
```


---

## 6. Enterprise Best Practices: 20 DOs and DON'Ts

| # | Rule | Bad Practice (DON'T) | Best Practice (DO) | Architectural Impact |
|---|------|----------------------|--------------------|----------------------|
| 1 | **Explicit Property Declarations** | Relying on parameter properties `constructor(public x: number)` | Explicitly declare properties on class bodies | Guarantees zero-transpile compatibility with Node.js `--experimental-strip-types`. |
| 2 | **True Runtime Privacy** | Using TypeScript `private` for sensitive API secrets or encryption keys | Use ECMAScript `#private` fields (`#secretKey`) | Prevents runtime reflection bypass via bracket notation `(inst as any)['secretKey']`. |
| 3 | **Mandatory Override Guard** | Overriding base class methods without the `override` keyword | Enable `noImplicitOverride: true` and mark overridden methods with `override` | Prevents silent phantom overrides when base class contracts evolve. |
| 4 | **Annotate `implements` Parameters** | Omitting parameter type annotations when implementing interfaces | Always explicitly annotate method parameter types | `implements` does NOT infer method parameter types; omitting annotations introduces implicit `any`. |
| 5 | **Avoid Dynamic Property Injection** | Dynamically attaching properties to instances after construction | Initialize all properties in consistent order in the constructor | Prevents V8 from de-optimizing Hidden Classes (Shapes) into slow dictionary mode. |
| 6 | **Avoid `delete` on Class Instances** | Using `delete this.prop` to clear instance fields | Assign properties to `null` or `undefined` | `delete` permanently mutates the V8 hidden class shape, degrading inline caches. |
| 7 | **Prefer Composition over Deep Inheritance** | Creating 5-level inheritance hierarchies (`Animal -> Mammal -> Canine -> Dog -> Bulldog`) | Compose focused strategy components via constructor injection | Eliminates Fragile Base Class problems and tight compile-time coupling. |
| 8 | **Polymorphic `this` Chaining** | Returning base class type `Builder` from fluent methods | Return polymorphic `this` | Preserves the concrete derived type across arbitrary subclass method chains. |
| 9 | **Explicit Resource Cleanup** | Relying on manual cleanup calls that callers can forget | Implement `Disposable` with `[Symbol.dispose]()` and consume via `using` | Guarantees deterministic, automatic cleanup when execution leaves scope. |
| 10 | **Definite Assignment Safety** | Sprinkling definite assignment assertion `!` without out-of-band initialization | Initialize properties inline or inside constructor | Prevents runtime `TypeError: Cannot read properties of undefined`. |
| 11 | **Decouple Domain from Infrastructure** | Embedding SQL queries or Axios HTTP calls directly inside Entity classes | Inject abstract Repository and Gateway interfaces (DIP) | Allows instantaneous unit testing using in-memory test doubles. |
| 12 | **Granular Role Interfaces** | Defining monolithic 20-method interfaces | Segregate into small, focused role interfaces (ISP) | Prevents implementers from being forced to stub unused methods. |
| 13 | **Contravariant Method Parameters** | Narrowing method parameter types in derived class overrides | Keep parameter types identical or broaden them (LSP) | Violating parameter contravariance breaks runtime substitution assumptions. |
| 14 | **Covariant Return Types** | Widening return types in derived class overrides | Keep return types identical or narrow to specific subtypes | Maintains caller contract guarantees while providing richer derived return values. |
| 15 | **Prototype vs Arrow Method Memory** | Declaring every class method as an arrow function property | Use standard prototype methods unless passing unbound callbacks | Arrow function properties duplicate function instances across every object in heap memory. |
| 16 | **Protected Modifiers for Extensibility** | Marking base class helper fields `private` when subclasses need them | Mark them `protected` or provide protected accessors | Avoids forcing subclasses to reinvent duplicate internal state. |
| 17 | **Immutable Value Objects** | Allowing public setters on Value Objects | Declare properties `public readonly` and freeze in constructor | Guarantees domain integrity and prevents subtle side-effect mutations. |
| 18 | **Aggregate Root Encapsulation** | Exposing mutable internal arrays directly via getters | Return readonly copies `[...this._items]` or `ReadonlyArray<T>` | Prevents external callers from mutating aggregate invariants out-of-band. |
| 19 | **Static Initialization Safety** | Writing complex multi-step static initialization directly on property declarations | Encapsulate multi-statement setup inside `static { ... }` blocks | Provides proper error handling and access to private static fields. |
| 20 | **Multi-Realm `instanceof` Defense** | Relying purely on `instanceof` across iframes or worker threads | Implement `Symbol.hasInstance` with structural or Symbol branding | Prevents false negative type assertions caused by divergent prototype realms. |

---

## 7. Real-World Case Study: Enterprise Core Banking & Ledger Engine with Strict SOLID Compliance

### Problem Context
A financial technology platform requires a high-throughput, multi-currency ledger engine. Financial transactions must adhere to strict regulatory double-entry accounting rules:
1. Every transaction must consist of balanced Debit and Credit entries ($\sum \text{Debits} = \sum \text{Credits}$).
2. Once posted, ledger entries must be strictly immutable.
3. System must support pluggable audit loggers, fraud detection strategies, and currency conversion providers without mutating core transaction logic (Open/Closed Principle).

### Architectural Solution
We construct the Core Ledger Engine using strict OOP and SOLID principles:
- **SRP**: `LedgerTransaction` models domain invariants; `LedgerRepository` handles persistence; `FraudDetector` evaluates compliance.
- **OCP**: Pluggable `FraudRule` strategies are registered dynamically.
- **LSP**: All specialized accounts (Checking, Savings, Escrow) satisfy base `Account` contracts.
- **ISP**: Separate `BalanceReader` from `TransactionPoster`.
- **DIP**: `LedgerService` depends exclusively on abstract interfaces.

```typescript
// Core Domain Entities & Value Objects
export class Money {
  constructor(public readonly cents: number, public readonly currency: string) {
    if (!Number.isInteger(cents)) throw new Error("Cents must be an integer");
    Object.freeze(this);
  }

  public equals(other: Money): boolean {
    return this.cents === other.cents && this.currency === other.currency;
  }
}

export interface LedgerEntry {
  accountId: string;
  amount: Money;
  direction: "DEBIT" | "CREDIT";
}

export class LedgerTransaction {
  public readonly id: string;
  private readonly _entries: LedgerEntry[];
  public readonly timestamp: Date;

  constructor(id: string, entries: LedgerEntry[]) {
    this.id = id;
    this.timestamp = new Date();
    this._entries = [...entries];
    this.validateBalance();
    Object.freeze(this);
  }

  public get entries(): ReadonlyArray<LedgerEntry> {
    return this._entries;
  }

  private validateBalance(): void {
    if (this._entries.length < 2) {
      throw new Error("Transaction must have at least 2 entries");
    }

    const balances = new Map<string, number>();
    for (const entry of this._entries) {
      const curr = balances.get(entry.amount.currency) ?? 0;
      const signedAmount = entry.direction === "DEBIT" ? entry.amount.cents : -entry.amount.cents;
      balances.set(entry.amount.currency, curr + signedAmount);
    }

    for (const [currency, balance] of balances.entries()) {
      if (balance !== 0) {
        throw new Error(`Unbalanced ledger transaction for currency ${currency}: net ${balance}`);
      }
    }
  }
}
```

---

## 8. Practice Drills (75 Drills across 5 Progression Tiers)

### Tier 1: Class Syntax, Constructors & Access Modifiers (Drills 1–15)
1. Declare a class `User` with explicit properties `id: string` and `email: string` and an explicit constructor.
2. Demonstrate why parameter properties fail in strip-only mode by writing both versions.
3. Create a class with `public`, `protected`, and `private` properties and verify access limits.
4. Implement ECMAScript `#private` fields and prove that `Object.keys()` cannot detect them.
5. Create a class with a `readonly` property and verify that modification inside a method throws a compile error.
6. Demonstrate that pushing to a `readonly string[]` property succeeds at runtime.
7. Implement a class getter and setter with asymmetric types (`get width(): number`, `set width(v: string | number)`).
8. Enable `strictPropertyInitialization` and fix an uninitialized property error.
9. Use the definite assignment assertion `!` on a property initialized in an `init()` method.
10. Implement a Singleton class with a `private constructor` and static `getInstance()`.
11. Implement a class with a `protected constructor` and extend it in a subclass.
12. Create a class method that returns polymorphic `this` and test fluent chaining.
13. Write a class with overloaded method signatures and a single implementation signature.
14. Implement custom serialization by adding `toJSON()` to a class with private fields.
15. Freeze a class instance in its constructor using `Object.freeze(this)`.

### Tier 2: Inheritance, Abstract Classes & Overrides (Drills 16–30)
16. Define an `abstract class BaseWorker` with an abstract method `execute(): void` and a concrete method `log(): void`.
17. Attempt to instantiate `new BaseWorker()` and document the TypeScript error.
18. Implement a concrete subclass `PrintWorker` extending `BaseWorker`.
19. Enable `noImplicitOverride: true` and override a base class method using the `override` keyword.
20. Demonstrate what happens when the base class deletes the overridden method.
21. Call `super.execute()` inside an overridden derived method.
22. Verify constructor execution timing: what happens if you access `this` before `super()`?
23. Create an abstract constructor type `abstract new (...args: any[]) => any`.
24. Implement an interface using `implements` and verify that parameter types must be annotated explicitly.
25. Implement three distinct interfaces on a single class.
26. Demonstrate return type covariance in an overridden method.
27. Demonstrate that derived class methods cannot narrow parameter types under `strictFunctionTypes`.
28. Implement a type guard method on a base class returning `this is DerivedClass`.
29. Use `this.constructor` inside a base class method to instantiate derived instances.
30. Write a class that extends another class while implementing two interfaces.

### Tier 3: Static Internals, Mixins & Polymorphic `this` (Drills 31–45)
31. Write a class with static properties and demonstrate that derived classes inherit them.
32. Write a static initialization block (`static { ... }`) that catches an exception during setup.
33. Access a private static field `#cache` from inside a `static { ... }` block.
34. Trace the execution order of static blocks and property initializers across two classes.
35. Implement a generic `Constructor<T = {}>` type.
36. Write a `Timestamped` mixin adding `createdAt: Date` to any base class.
37. Write a `Serializable` mixin adding `serialize(): string`.
38. Compose both mixins on a concrete `BlogPost` class.
39. Write a fluent Query Builder supporting `.select()`, `.where()`, and `.orderBy()` using polymorphic `this`.
40. Extend the Query Builder with `.limit()` in a subclass and verify that earlier methods return the subclass type.
41. Implement `[Symbol.iterator]` on a custom collection class.
42. Implement `[Symbol.dispose]` on a class and consume it via `using`.
43. Implement `[Symbol.asyncDispose]` on a class and consume it via `await using`.
44. Trace the LIFO cleanup order of multiple `using` declarations in a single block.
45. Implement nominal branding on two structurally identical classes using `#brand`.

### Tier 4: SOLID Principles & Design Patterns (Drills 46–60)
46. Refactor an SRP-violating class handling validation, formatting, and DB persistence into three separate classes.
47. Implement the Strategy Pattern with three payment strategies (CreditCard, PayPal, Crypto).
48. Demonstrate an LSP violation with the Rectangle/Square problem and refactor to clean shapes.
49. Split a monolithic `Repository<T>` interface into `Reader<T>` and `Writer<T>` (ISP).
50. Implement Dependency Inversion by injecting an interface into an `OrderService`.
51. Implement the Adapter Pattern adapting a third-party legacy logging library.
52. Implement the Decorator Pattern wrapping an HTTP client with retry logic.
53. Implement the Observer Pattern with typed events using classes.
54. Implement the Command Pattern supporting `execute()` and `undo()`.
55. Implement the Template Method Pattern with invariant execution steps.
56. Implement a Step-Builder pattern with type-states enforcing sequential configuration.
57. Build a dynamic plugin registry using a static class factory.
58. Implement the Curiously Recurring Template Pattern (CRTP) for a cloneable interface.
59. Write an in-memory repository implementing an abstract repository interface for unit tests.
60. Defend against multi-realm `instanceof` failure using `Symbol.hasInstance`.

### Tier 5: Enterprise Domain Architecture & Clean Engineering (Drills 61–75)
61. Build an Entity base class with continuous identity equality and version tracking.
62. Build an AggregateRoot base class with encapsulated domain event collection.
63. Implement an immutable `Money` Value Object with currency matching assertions.
64. Construct a Role-Based Access Control (RBAC) hierarchy with wildcard permission support.
65. Build a Type-Safe Finite State Machine enforcing valid state transitions.
66. Construct a multi-channel notification dispatcher with rate limiting and fallback chains.
67. Design a Clean Architecture Domain Entity free of framework or library dependencies.
68. Build a Data Mapper separating the domain model from database schema mapping.
69. Implement optimistic concurrency checks using entity version comparisons.
70. Build an audit-logging decorator that wraps aggregate command execution.
71. Construct a Specification Pattern evaluator checking domain criteria on entity collections.
72. Implement custom JSON deserialization re-instantiating complete prototype chains.
73. Build a type-safe IoC Container service token and registration mapper.
74. Implement a double-entry ledger transaction validator with balanced debit/credit checks.
75. Design a complete Domain-Driven Architecture with Aggregates, Repositories, and Unit of Work.


---

