# Module TS-06: Complete OOP, Class Internals & Modifiers

Welcome to TypeScript Object-Oriented Programming (OOP), Class Internals, and Modifiers. This module teaches how classes work in TypeScript, the difference between compile-time modifiers and runtime private fields, abstract contracts, polymorphic chaining, and the SOLID architectural principles.

---

# Topic 1: The Dual Nature of Classes: Instance Type vs Static Constructor Type

### 1. What is it?
In TypeScript, a single `class` declaration creates two distinct things at the same time:
1. **A Value**: The runtime JavaScript constructor function that you invoke with `new`.
2. **A Type**: The shape of the instance produced by that constructor.

Because the class name serves as both a value and a type, referencing `ClassName` gives you the instance shape, while referencing `typeof ClassName` gives you the constructor function itself.

### 2. Why does it exist?
JavaScript classes have both instance properties (defined on the created object or prototype) and static properties (defined directly on the class constructor function).

In a static type system, TypeScript must type both halves independently. If you write a factory function that takes a class constructor and instantiates it, you need to type the constructor (`typeof User`), not the instance (`User`).

### 3. Basic example

```typescript
class User {
  static defaultRole: string = "guest";
  id: string;

  constructor(id: string) {
    this.id = id;
  }

  printId(): void {
    console.log(this.id);
  }
}

// 1. Instance Type: represents an object created by 'new User()'
const userInstance: User = new User("usr_1");

// 2. Static / Constructor Type: represents the User constructor itself
type UserConstructor = typeof User;

const userFactory: UserConstructor = User;
console.log(userFactory.defaultRole); // "guest"
```

**Line-by-line explanation:**
- `class User { ... }`: Declares the class.
- `static defaultRole`: A property stored on the constructor function, not on instances.
- `const userInstance: User`: `User` here refers to the instance type. It requires properties `id` and method `printId()`.
- `type UserConstructor = typeof User;`: `typeof User` refers to the constructor function. It has a constructor signature `new (id: string) => User` and the static property `defaultRole`.

---

### 4. How it works inside TypeScript
1. **Symbol Table Split**: The compiler enters `User` in both the Type space and the Value space.
2. **Type Space Lookup**: In type positions (`let u: User`), the compiler resolves the instance interface.
3. **Value Space Lookup**: In value positions (`new User()`), the compiler evaluates the JavaScript constructor function.
4. **`typeof` Query**: Writing `typeof User` in type space bridges from the value space to query the constructor's static type.

---

### 5. Think first

What happens when you pass a class name to a function expecting an instance? Decide first.

```typescript
class Point {
  x: number = 0;
}

function draw(p: Point) {
  console.log(p.x);
}

draw(Point);
```

---

**Answer and Reason:**

This code fails to compile:

```
Argument of type 'typeof Point' is not assignable to parameter of type 'Point'.
  Property 'x' is missing in type 'typeof Point' but required in type 'Point'.
```

**Reason**: `draw` expects an instance of `Point` (`{ x: number }`). You passed `Point` (the constructor function `typeof Point`), not an instance created with `new Point()`.

---

### 6. Try it yourself
Create a class `Config` with a static property `version = 1` and an instance property `env = "dev"`. Declare a function `printVersion(c: typeof Config)` that accepts the constructor and prints `c.version`.

---

### 7. More examples

#### Example A: Generic Factory Function (Medium)

```typescript
type Constructor<T> = new (...args: any[]) => T;

function createInstance<T>(Cls: Constructor<T>, ...args: any[]): T {
  return new Cls(...args);
}

const user = createInstance(User, "usr_100");
// user is typed as User!
```

**Line-by-line explanation:**
- `new (...args: any[]) => T` represents a constructor function that produces instances of type `T`.

---

### 8. Common mistakes

#### Mistake 1: Confusing `Class` and `typeof Class` in factory parameters

**Wrong code:**
```typescript
function build(Target: User) {
  // return new Target(); // Error: 'Target' has no construct signatures!
}
```

**Why it happens:**
`Target: User` means an already-instantiated user object. To accept the class constructor, write `Target: typeof User`.

---

### 9. Rules to remember
1. `ClassName` in type space refers to the instance type.
2. `typeof ClassName` in type space refers to the constructor / static side.
3. Static properties belong to `typeof ClassName`, not `ClassName`.

---

### 10. Exercises

#### Question 1 (Predict the compile result)
What is the type of `val`?
```typescript
class Account {
  balance: number = 0;
}
type Acc = Account;
```

#### Question 2 (Find and fix the bug)
Fix the parameter type so `makeItem` can instantiate `Cls`:
```typescript
function makeItem(Cls: Point) {
  return new Cls();
}
```

#### Question 3 (Write code from scratch)
Write a class `Server` with a static property `port = 8080`. Write a function that accepts `typeof Server` and returns its `port`.

#### Question 4 (Explain in your own words)
Why does TypeScript create both a value and a type when you declare a class?

---

### Solutions

#### Solution to Question 1
**Hint 1**: Does `Account` refer to the instance or the constructor?

**Answer**:
`Acc` is the instance type `{ balance: number }`.

#### Solution to Question 2
**Hint 1**: Use `typeof Point` or a constructor signature.

**Answer**:
```typescript
function makeItem(Cls: typeof Point) {
  return new Cls();
}
```

#### Solution to Question 3
**Hint 1**: Access `Cls.port`.

**Answer**:
```typescript
class Server {
  static port: number = 8080;
}

function getPort(s: typeof Server): number {
  return s.port;
}
```

#### Solution to Question 4
**Hint 1**: Think about what exists at runtime versus what the type checker needs.

**Answer**:
In JavaScript, classes are runtime constructor functions that can be invoked and passed around (the value). At the same time, static type checking requires an interface describing what properties instances of that class will have (the type). Creating both allows seamless integration between JavaScript runtime behavior and static type checking.

---

### 11. Recall

1. What does `ClassName` represent in type space?
2. What does `typeof ClassName` represent in type space?
3. Where are static properties located?

**If you remember only one thing:**
`User` is the type of an instance, while `typeof User` is the type of the constructor function itself.

---

# Topic 2: Access Modifiers: `public`, `protected`, and `private`

### 1. What is it?
TypeScript provides three compile-time access modifiers that control where class properties and methods can be accessed:
- `public` (default): Accessible from anywhere (inside the class, derived subclasses, and external callers).
- `protected`: Accessible within the declaring class and all derived subclasses. Forbidden to outside callers.
- `private`: Accessible **only** within the declaring class. Forbidden to subclasses and outside callers.

### 2. Why does it exist?
Encapsulation is a core principle of object-oriented design.

If internal state (like an internal password hash or database connection pointer) is accessible to outside callers, callers can modify it directly, bypassing validation rules and causing corrupt state. Access modifiers enforce encapsulation at compile time.

### 3. Basic example

```typescript
class BaseEntity {
  public id: string;
  protected version: number;
  private secretToken: string;

  constructor(id: string, token: string) {
    this.id = id;
    this.version = 1;
    this.secretToken = token;
  }

  public getSecret(): string {
    return this.secretToken; // Allowed: private accessible inside declaring class
  }
}

class UserEntity extends BaseEntity {
  public updateVersion(): void {
    this.version++; // Allowed: protected accessible inside subclass
    // console.log(this.secretToken); // Compile Error: secretToken is private to BaseEntity!
  }
}

const entity = new BaseEntity("usr_1", "tok_secret");
console.log(entity.id); // Allowed: public
// console.log(entity.version); // Compile Error: version is protected!
// console.log(entity.secretToken); // Compile Error: secretToken is private!
```

**Line-by-line explanation:**
- `public id`: Can be read by `entity.id` anywhere.
- `protected version`: `UserEntity` can access `this.version` inside its methods, but outside code (`entity.version`) cannot.
- `private secretToken`: Can only be accessed inside `BaseEntity`. Even the child class `UserEntity` is forbidden from reading it.

---

### 4. How it works inside TypeScript
1. **Modifier Checking**: When compiling property access (`obj.prop`), the compiler looks up the declaring class of `prop` and checks if the calling scope has permission.
2. **Type Erasure**: `public`, `protected`, and `private` are TypeScript-only keywords. When emitted to JavaScript, all access modifier keywords are completely removed!
3. **Compile-Time Only**: A `private` property in TypeScript is still accessible at runtime if inspected with raw JavaScript or bracket notation (`entity["secretToken"]`).

---

### 5. Think first

What happens when you access a `protected` member on an instance from outside the class? Decide first.

```typescript
class Device {
  protected serialNumber: string = "SN-100";
}

const d = new Device();
console.log(d.serialNumber);
```

---

**Answer and Reason:**

This code fails to compile:

```
Property 'serialNumber' is protected and only accessible within class 'Device' and its subclasses.
```

**Reason**: `protected` members cannot be accessed directly on instances from external code.

---

### 6. Try it yourself
Create a class `Account` with `public id: string` and `protected balance: number`. Create a subclass `SavingsAccount` with a method `deposit(amount: number)` that adds to `this.balance`. Verify that `deposit` can access `balance`.

---

### 7. More examples

#### Example A: Private Methods for Internal Helpers (Medium)

```typescript
class QueryBuilder {
  private sanitize(input: string): string {
    return input.trim();
  }

  public where(clause: string): void {
    const clean = this.sanitize(clause); // Allowed
    console.log("WHERE", clean);
  }
}
```

---

### 8. Common mistakes

#### Mistake 1: Relying on TypeScript `private` for security

**Wrong assumption:**
Assuming TypeScript `private` hides sensitive data from hackers in browser memory.

**Reality:**
TypeScript access modifiers are completely erased during compilation. At runtime, the property is a plain, public JavaScript property! For true runtime privacy, use `#private` (covered in Topic 3).

---

### 9. Rules to remember
1. `public`: Accessible everywhere (default).
2. `protected`: Accessible in class and subclasses.
3. `private`: Accessible only in the declaring class.
4. Access modifiers are compile-time only and erased in emitted JavaScript.

---

### 10. Exercises

#### Question 1 (Predict the compile result)
Will the call to `p.code` compile?
```typescript
class Key {
  private code: string = "secret";
}
const p = new Key();
console.log(p.code);
```

#### Question 2 (Find and fix the bug)
The subclass cannot access `count` because it is marked `private`. Change it so subclasses can access it, but external code cannot:
```typescript
class Counter {
  private count: number = 0;
}
class StepCounter extends Counter {
  step() { this.count++; }
}
```

#### Question 3 (Write code from scratch)
Write a class `DatabasePool` with:
- a private property `connections: number`
- a public method `getConnectionCount(): number`

#### Question 4 (Explain in your own words)
What is the difference between `protected` and `private`?

---

### Solutions

#### Solution to Question 1
**Hint 1**: Is `code` accessible outside the class?

**Answer**:
No, it fails with: `Property 'code' is private and only accessible within class 'Key'`.

#### Solution to Question 2
**Hint 1**: Change `private` to `protected`.

**Answer**:
```typescript
class Counter {
  protected count: number = 0;
}
class StepCounter extends Counter {
  step() { this.count++; }
}
```

#### Solution to Question 3
**Hint 1**: Use `private connections = 0;`.

**Answer**:
```typescript
class DatabasePool {
  private connections: number = 5;

  public getConnectionCount(): number {
    return this.connections;
  }
}
```

#### Solution to Question 4
**Hint 1**: Think about whether subclasses have access.

**Answer**:
A `private` member can only be accessed within the exact class that declared it; derived subclasses cannot access it. A `protected` member can be accessed by both the declaring class and any child subclasses that extend it, while still hiding the member from outside callers.

---

### 11. Recall

1. What is the default access modifier if none is written?
2. Which modifier allows access inside subclasses but denies external callers?
3. Do TypeScript `private` properties exist on the JavaScript object at runtime?

**If you remember only one thing:**
`private` is for declaring class only, `protected` includes subclasses, and both are compile-time checks erased at runtime.

---

# Topic 3: TypeScript `private` vs JavaScript `#private` Fields

### 1. What is it?
There are two ways to make class fields private in TypeScript:
1. **TypeScript `private`**: A compile-time keyword (`private prop: string`). Erased at runtime.
2. **ECMAScript `#private`**: A native JavaScript syntax introduced in ES2022 (`#prop: string`). Enforced at runtime by the JavaScript engine in memory.

### 2. Why does it exist?
TypeScript's `private` keyword was created in 2012 before JavaScript had native private fields. It stops accidental access during compilation, but can still be bypassed at runtime (e.g. via `obj["secret"]` or `Object.keys()`).

The ECMAScript `#private` syntax provides **hard privacy**: the field is completely inaccessible from outside the class, even with bracket access or runtime reflection.

### 3. Basic example

```typescript
class SecurityVault {
  // 1. Soft private (compile-time only):
  private softToken: string = "soft_secret";

  // 2. Hard private (runtime engine enforced):
  #hardToken: string = "hard_secret";

  public getTokens() {
    return { soft: this.softToken, hard: this.#hardToken };
  }
}

const vault = new SecurityVault();

// Bypassing soft private at runtime:
console.log((vault as any).softToken); // Prints "soft_secret"!

// Trying to bypass hard private:
// console.log((vault as any).#hardToken); // Syntax Error!
// console.log(vault["#hardToken"]); // undefined! Hard private fields cannot be accessed by name!
```

**Line-by-line explanation:**
- `private softToken`: Emitted as a regular property `this.softToken` in JavaScript. Casting to `any` allows accessing it.
- `#hardToken`: Stored in a private field slot managed directly by the V8 JavaScript engine. It cannot be read or written from outside the class by any means.

---

### 4. How it works inside TypeScript
Comparison table of the two private mechanisms:

| Feature | TypeScript `private x` | ECMAScript `#x` |
|---|---|---|
| **Enforced At** | Compile time only | Compile time AND Runtime |
| **Runtime Representation** | Regular object property | Native Private Identifier / WeakMap |
| **Bracket Access (`obj["x"]`)** | Allowed at runtime | Returns `undefined` (inaccessible) |
| **Subclass Collisions** | Subclasses cannot use same private name | Subclasses CAN declare `#x` without collision |
| **`Object.keys()` Visibility** | Visible at runtime | Completely hidden |

---

### 5. Think first

What does `Object.keys(vault)` return for the class below? Decide first.

```typescript
class Vault {
  private softKey = "a";
  #hardKey = "b";
}
const v = new Vault();
console.log(Object.keys(v));
```

---

**Answer and Reason:**

It prints:

```javascript
["softKey"]
```

**Reason**: `softKey` is compiled into a standard enumerable JavaScript property, so `Object.keys` finds it. `#hardKey` is a native private field and is completely invisible to reflection.

---

### 6. Try it yourself
Create a class `ApiKeyManager` with a native private field `#apiKey: string`. Add a public method `verify(key: string): boolean` that compares input with `#apiKey`. Try to read `#apiKey` directly from outside the class to see the compiler error.

---

### 7. More examples

#### Example A: Independent Private Fields in Inheritance (Medium)

```typescript
class Parent {
  #id = "parent_id";
  printParent() { console.log(this.#id); }
}

class Child extends Parent {
  #id = "child_id"; // No collision! Completely independent private field.
  printChild() { console.log(this.#id); }
}

const c = new Child();
c.printParent(); // "parent_id"
c.printChild();  // "child_id"
```

**Line-by-line explanation:**
- Native `#private` fields are scoped to the exact declaring class. Subclasses can reuse the same `#id` identifier without colliding.

---

### 8. Common mistakes

#### Mistake 1: Trying to use dynamic bracket notation on `#private` fields

**Wrong code:**
```typescript
class Item {
  #value = 10;
  getValue(prop: string) {
    // return this[`#${prop}`]; // Syntax Error!
  }
}
```

**Why it happens:**
`#` is part of the identifier syntax, not a string property name. Private fields cannot be indexed dynamically.

---

### 9. Rules to remember
1. `private x` is soft privacy (compile-time only).
2. `#x` is hard privacy (enforced by the JavaScript runtime engine).
3. Use `#x` whenever you need true encapsulation that cannot be bypassed by reflection.

---

### 10. Exercises

#### Question 1 (Predict the compile result)
Will the line outside the class compile?
```typescript
class Session {
  #sessionId: string = "xyz";
}
const s = new Session();
console.log(s.#sessionId);
```

#### Question 2 (Find and fix the bug)
Fix the syntax error:
```typescript
class User {
  #name: string;
  constructor(name: string) {
    this.name = name; // Bug: Missed the '#' prefix!
  }
}
```

#### Question 3 (Write code from scratch)
Write a class `Counter` that stores its count in a native private field `#count: number`. Add public methods `increment()` and `getCount()`.

#### Question 4 (Explain in your own words)
Why does native `#private` prevent name collisions between parent classes and child classes?

---

### Solutions

#### Solution to Question 1
**Hint 1**: Can `#` fields be accessed outside the class?

**Answer**:
No, it fails with: `Property '#sessionId' is not accessible outside class 'Session' because it has a private identifier`.

#### Solution to Question 2
**Hint 1**: Use `this.#name`.

**Answer**:
```typescript
class User {
  #name: string;
  constructor(name: string) {
    this.#name = name;
  }
}
```

#### Solution to Question 3
**Hint 1**: Initialize `#count = 0`.

**Answer**:
```typescript
class Counter {
  #count: number = 0;

  increment(): void {
    this.#count++;
  }

  getCount(): number {
    return this.#count;
  }
}
```

#### Solution to Question 4
**Hint 1**: How are `#` fields stored in the JavaScript engine?

**Answer**:
Native `#` private fields are not stored as property keys on the object's prototype or shape. Instead, the engine associates private field storage with the specific class definition that declared them. Because the storage is keyed to the class itself, a parent class and a child class maintain separate private storage slots.

---

### 11. Recall

1. What syntax creates native runtime-private fields?
2. Can `(obj as any).field` access a `#private` field?
3. Do `#private` fields appear in `Object.keys()`?

**If you remember only one thing:**
Use native `#field` for runtime-enforced privacy, and `private field` for compile-time design intent.

---

# Topic 4: Parameter Properties (`constructor(public id: string)`)

### 1. What is it?
TypeScript provides a shorthand syntax called **Parameter Properties** that lets you declare and initialize class properties directly in the constructor arguments list:
```typescript
class User {
  constructor(public id: string, public name: string) {}
}
```
Prefixing a constructor parameter with `public`, `protected`, `private`, or `readonly` automatically creates a property on the class and assigns the argument to it.

### 2. Why does it exist?
In standard JavaScript and vanilla TypeScript, creating an object with several fields requires tedious boilerplate:
1. Declare the property on the class (`id: string;`).
2. Add the parameter to the constructor (`constructor(id: string)`).
3. Assign the property inside the constructor body (`this.id = id;`).

Parameter properties eliminate all three repetitive steps in a single declaration.

### 3. Basic example

```typescript
// Boilerplate-free declaration:
class User {
  constructor(
    public id: string,
    public name: string,
    private token: string,
    readonly createdAt: number
  ) {
    // No 'this.id = id' needed! TypeScript generates it automatically.
  }
}

const user = new User("usr_1", "Alex", "tok_99", 1700000000);
console.log(user.id);   // "usr_1"
console.log(user.name); // "Alex"
// console.log(user.token); // Compile Error: token is private!
```

**Line-by-line explanation:**
- `public id: string`: Declares a public property `id` and assigns the first argument to `this.id`.
- `public name: string`: Declares a public property `name` and assigns the second argument to `this.name`.
- `private token: string`: Declares a private property `token` and assigns it.
- `readonly createdAt: number`: Declares a readonly property.
- The constructor body `{}` can be empty because property assignment is handled automatically.

---

### 4. How it works inside TypeScript
When TypeScript compiles a parameter property to JavaScript, it automatically generates:

```javascript
// Emitted JavaScript:
class User {
  constructor(id, name, token, createdAt) {
    this.id = id;
    this.name = name;
    this.token = token;
    this.createdAt = createdAt;
  }
}
```

---

### 5. Think first

What happens if you omit the access modifier keyword (`public`, `private`, etc.) in the constructor? Decide first.

```typescript
class Point {
  constructor(x: number, y: number) {}
}

const p = new Point(10, 20);
console.log(p.x);
```

---

**Answer and Reason:**

This code fails to compile:

```
Property 'x' does not exist on type 'Point'.
```

**Reason**: Without an access modifier (`public`, `private`, `protected`, or `readonly`), `x` and `y` are just regular constructor parameters. They do NOT create properties on the class!

---

### 6. Try it yourself
Write a class `Product` using parameter properties with `public readonly id: string` and `public price: number`. Create an instance and print its properties.

---

### 7. More examples

#### Example A: Combining Parameter Properties with Constructor Logic (Medium)

```typescript
class BankAccount {
  constructor(
    public readonly accountNumber: string,
    private balance: number
  ) {
    if (balance < 0) {
      throw new Error("Initial balance cannot be negative");
    }
  }

  public getBalance(): number {
    return this.balance;
  }
}
```

**Line-by-line explanation:**
- Properties are assigned automatically *before* the constructor body executes, so `balance` is available for validation immediately.

---

### 8. Common mistakes

#### Mistake 1: Declaring the property twice

**Wrong code:**
```typescript
class User {
  id: string; // Redundant declaration!
  constructor(public id: string) {} // Error: Duplicate identifier 'id'.
}
```

**Why it happens:**
Writing `public id: string` in the constructor automatically declares the property on the class. Declaring it above the constructor creates a duplicate definition.

---

### 9. Rules to remember
1. Prepend `public`, `protected`, `private`, or `readonly` to a constructor argument to create a parameter property.
2. Parameter properties eliminate the need for manual `this.prop = prop` assignments.
3. Do not declare the property outside the constructor when using parameter properties.

---

### 10. Exercises

#### Question 1 (Predict the compile result)
Will `console.log(b.title)` compile?
```typescript
class Book {
  constructor(title: string) {}
}
const b = new Book("TypeScript Guide");
console.log(b.title);
```

#### Question 2 (Find and fix the bug)
Fix the duplicate identifier error:
```typescript
class Car {
  speed: number;
  constructor(public speed: number) {}
}
```

#### Question 3 (Write code from scratch)
Write a class `ServerConfig` using parameter properties that takes `public host: string`, `public port: number`, and `readonly isSecure: boolean`.

#### Question 4 (Explain in your own words)
Why are parameter properties preferred in production TypeScript code over manual field assignments?

---

### Solutions

#### Solution to Question 1
**Hint 1**: Did `title` have an access modifier?

**Answer**:
No, it fails. Without an access modifier, `title` is not stored as a class property.

#### Solution to Question 2
**Hint 1**: Remove the top declaration `speed: number;`.

**Answer**:
```typescript
class Car {
  constructor(public speed: number) {}
}
```

#### Solution to Question 3
**Hint 1**: Declare all three in the constructor parameters.

**Answer**:
```typescript
class ServerConfig {
  constructor(
    public host: string,
    public port: number,
    public readonly isSecure: boolean
  ) {}
}
```

#### Solution to Question 4
**Hint 1**: How many lines of code are saved per property?

**Answer**:
Parameter properties eliminate boilerplate code. Instead of repeating each property name three times (class declaration, constructor parameter, and `this.x = x` assignment), parameter properties declare and assign the field in a single clean line.

---

### 11. Recall

1. What keywords turn a constructor argument into a parameter property?
2. Does `constructor(name: string)` create a property on the class?
3. Where is `this.prop = prop` generated?

**If you remember only one thing:**
Add `public`, `private`, or `readonly` to a constructor parameter to declare and assign the property in one line.

---

# Topic 5: `readonly` Properties and Class Getters/Setters

### 1. What is it?
- A `readonly` class property can only be assigned during declaration or inside the class `constructor`. Once construction finishes, it cannot be reassigned.
- **Getters** (`get`) and **Setters** (`set`) define accessor methods that look like standard properties from the outside, but execute functions when read or written.

### 2. Why does it exist?
- `readonly` protects immutable identifiers (like an entity ID or creation date) from being accidentally altered after instantiation.
- Getters and setters allow you to encapsulate validation logic, computed properties, and lazy evaluations without changing how callers access the property.

### 3. Basic example

```typescript
class Circle {
  readonly id: string;
  private _radius: number;

  constructor(id: string, radius: number) {
    this.id = id; // Allowed in constructor
    this._radius = radius;
  }

  // Getter: computed property
  get radius(): number {
    return this._radius;
  }

  // Setter: validation logic
  set radius(value: number) {
    if (value <= 0) {
      throw new Error("Radius must be positive");
    }
    this._radius = value;
  }

  get area(): number {
    return Math.PI * this._radius ** 2;
  }
}

const c = new Circle("c1", 5);
console.log(c.area); // 78.53... (Accessed like a property, runs the getter!)
c.radius = 10;       // Valid: runs the setter
// c.radius = -5;    // Throws Error at runtime!
// c.id = "c2";      // Compile Error: Cannot assign to 'id' because it is a read-only property.
```

**Line-by-line explanation:**
- `readonly id: string`: Can be assigned in the constructor. Calling `c.id = "c2"` after construction fails at compile time.
- `get radius()`: When reading `c.radius`, this function runs and returns `this._radius`.
- `set radius(value)`: When writing `c.radius = 10`, this function runs, validates the input, and updates `this._radius`.
- `get area()`: Read-only computed property (no setter is provided).

---

### 4. How it works inside TypeScript
1. **Getter Only = Readonly**: If a property has a `get` accessor but no `set` accessor, TypeScript automatically infers it as `readonly`. Reassigning it triggers a compile error.
2. **Setter Type Alignment**: In TypeScript 4.3+, getters and setters can have different types, as long as the setter's input type is assignable to the getter's return type.

---

### 5. Think first

What happens if you try to assign a value to `c.area` in the example above? Decide first.

```typescript
c.area = 100;
```

---

**Answer and Reason:**

This code fails to compile:

```
Cannot assign to 'area' because it is a read-only property.
```

**Reason**: `area` only has a `get` accessor, with no corresponding `set` accessor. TypeScript automatically marks getter-only properties as read-only.

---

### 6. Try it yourself
Create a class `Temperature` with a private field `_celsius: number`. Create a getter and setter for `celsius`. Add a getter `fahrenheit` that computes `(_celsius * 9/5) + 32`.

---

### 7. More examples

#### Example A: Readonly Arrays vs Readonly Properties (Medium)

```typescript
class Team {
  readonly members: string[] = ["Alex"];
}

const team = new Team();
// team.members = ["Jordan"]; // Error: Cannot reassign 'members'!
team.members.push("Jordan");   // Allowed! The reference is readonly, but the array is mutable!
```

**Line-by-line explanation:**
- `readonly` on an object or array property prevents reassigning the variable reference (`team.members = ...`). It does NOT freeze the array contents. To freeze the array contents, use `readonly string[]`.

---

### 8. Common mistakes

#### Mistake 1: Infinite recursion inside getters and setters

**Wrong code:**
```typescript
class Bad {
  get count(): number {
    return this.count; // Infinite recursion! Calls getter again!
  }
}
```

**Why it happens:**
A getter must read from an internal private field (like `this._count`), not from itself.

---

### 9. Rules to remember
1. `readonly` properties can only be assigned in declaration or the constructor.
2. Getter-only properties are automatically treated as read-only.
3. Accessors run functions behind the scenes while looking like standard properties to callers.

---

### 10. Exercises

#### Question 1 (Predict the compile result)
Will line 6 compile?
```typescript
class User {
  readonly id: string = "u1";
}
const u = new User();
u.id = "u2";
```

#### Question 2 (Find and fix the bug)
Fix the infinite loop in the setter:
```typescript
class Account {
  set balance(val: number) {
    this.balance = val;
  }
}
```

#### Question 3 (Write code from scratch)
Write a class `Rectangle` with readonly properties `width: number` and `height: number`, and a getter `perimeter` that returns `2 * (width + height)`.

#### Question 4 (Explain in your own words)
Why does `readonly members: string[]` still allow calling `members.push()`?

---

### Solutions

#### Solution to Question 1
**Hint 1**: Is `id` read-only?

**Answer**:
No, it fails. Cannot assign to `id` because it is a read-only property.

#### Solution to Question 2
**Hint 1**: Store the value in a private backing property `_balance`.

**Answer**:
```typescript
class Account {
  private _balance: number = 0;
  set balance(val: number) {
    this._balance = val;
  }
}
```

#### Solution to Question 3
**Hint 1**: Use parameter properties and a getter.

**Answer**:
```typescript
class Rectangle {
  constructor(
    readonly width: number,
    readonly height: number
  ) {}

  get perimeter(): number {
    return 2 * (this.width + this.height);
  }
}
```

#### Solution to Question 4
**Hint 1**: What does the `readonly` modifier apply to?

**Answer**:
The `readonly` modifier applies to the property binding on the class instance, preventing the variable reference from being reassigned to a different array. It does not make the underlying array object immutable.

---

### 11. Recall

1. Where can a `readonly` property be assigned?
2. What happens if a property has a `get` method but no `set` method?
3. Does `readonly obj: object` prevent mutating properties inside `obj`?

**If you remember only one thing:**
`readonly` locks the property reference after construction, and getter-only properties are automatically read-only.

---

# Checkpoint Challenge: Topics 1 to 5

### Challenge Scenario
Build a secure user profile management class:

1. Create a class `UserProfile`:
   - Use parameter properties to initialize:
     - `public readonly userId: string`
     - `private _email: string`
     - `private _age: number`
   - Store a native private field `#secretPin: string` initialized to `"0000"`.
2. Add a getter and setter for `email`:
   - The setter throws an error if the email does not contain `"@"`.
3. Add a getter `isAdult: boolean` that returns `true` if `_age >= 18`.
4. Add a public method `updatePin(oldPin: string, newPin: string): boolean`:
   - If `oldPin === this.#secretPin`, update `#secretPin = newPin` and return `true`.
   - Otherwise return `false`.
5. Instantiate `UserProfile` and test updating the email, checking `isAdult`, and verifying that `userId` cannot be reassigned.

### Challenge Solution

```typescript
class UserProfile {
  #secretPin: string = "0000";

  constructor(
    public readonly userId: string,
    private _email: string,
    private _age: number
  ) {}

  get email(): string {
    return this._email;
  }

  set email(newEmail: string) {
    if (!newEmail.includes("@")) {
      throw new Error("Invalid email format");
    }
    this._email = newEmail;
  }

  get isAdult(): boolean {
    return this._age >= 18;
  }

  public updatePin(oldPin: string, newPin: string): boolean {
    if (oldPin === this.#secretPin) {
      this.#secretPin = newPin;
      return true;
    }
    return false;
  }
}

const profile = new UserProfile("usr_100", "alex@example.com", 25);
console.log("Is adult:", profile.isAdult); // true
profile.email = "alex.new@example.com";     // Valid
console.log("Pin updated:", profile.updatePin("0000", "1234")); // true

// Compile Error on reassignment:
// profile.userId = "usr_200"; // Cannot assign to 'userId' because it is a read-only property.
```

---

# Topic 6: Class Inheritance with `extends` and `super`

### 1. What is it?
Class inheritance allows a child class (subclass) to inherit all properties and methods from a parent class (superclass) using the `extends` keyword:
```typescript
class Child extends Parent {}
```
Inside the child class constructor, you must call `super()` before accessing `this` to initialize the parent class.

### 2. Why does it exist?
Inheritance enables code reuse and subtype polymorphism.

If you have multiple entities (like `AdminUser`, `CustomerUser`, and `GuestUser`) that share common behavior (such as `id`, `name`, and `login()`), you can define those shared features once in a base `User` class. Subclasses inherit those features and add their own specialized behavior.

### 3. Basic example

```typescript
class Vehicle {
  constructor(public brand: string, public maxSpeed: number) {}

  startEngine(): void {
    console.log(`Starting ${this.brand} engine`);
  }
}

class ElectricCar extends Vehicle {
  constructor(brand: string, maxSpeed: number, public batteryLevel: number) {
    super(brand, maxSpeed); // Calls Vehicle constructor!
  }

  charge(): void {
    this.batteryLevel = 100;
    console.log(`${this.brand} is fully charged`);
  }
}

const tesla = new ElectricCar("Tesla", 250, 80);
tesla.startEngine(); // Inherited method from Vehicle
tesla.charge();      // Specific method on ElectricCar
```

**Line-by-line explanation:**
- `class ElectricCar extends Vehicle`: `ElectricCar` inherits all fields and methods of `Vehicle`.
- `super(brand, maxSpeed);`: Invokes `Vehicle`'s constructor. This is mandatory before accessing `this` in a subclass.
- `tesla.startEngine()`: Calls the inherited method defined on `Vehicle`.
- `tesla.charge()`: Calls the specialized method defined on `ElectricCar`.

---

### 4. How it works inside TypeScript
1. **Prototype Chaining**: At runtime, JavaScript establishes a prototype link: `ElectricCar.prototype.__proto__ === Vehicle.prototype`.
2. **Constructor Protocol**: The JavaScript engine requires calling `super()` to construct the instance memory slot before subclass initializers run.
3. **Subtype Relationship**: An instance of `ElectricCar` is assignable to a variable of type `Vehicle` (`ElectricCar extends Vehicle`).

---

### 5. Think first

What happens if you reference `this` before calling `super()` in a subclass constructor? Decide first.

```typescript
class Animal { constructor(public name: string) {} }

class Dog extends Animal {
  constructor(name: string) {
    this.name = name;
    super(name);
  }
}
```

---

**Answer and Reason:**

This code fails to compile:

```
'super' must be called before accessing 'this' in the constructor of a derived class.
```

**Reason**: The JavaScript language specification requires `super()` to be invoked first to initialize the parent object before `this` can be referenced.

---

### 6. Try it yourself
Create a base class `Notification` with `public message: string` and method `send(): void`. Create a subclass `EmailNotification` that takes an extra `email: string` and overrides `send()` to print `"Sending email to " + email`.

---

### 7. More examples

#### Example A: Calling Super Methods with `super.method()` (Medium)

```typescript
class Logger {
  log(msg: string): void {
    console.log("[LOG]:", msg);
  }
}

class TimestampLogger extends Logger {
  override log(msg: string): void {
    console.log(new Date().toISOString());
    super.log(msg); // Calls parent method!
  }
}
```

**Line-by-line explanation:**
- `super.log(msg)` delegates to the parent implementation after adding extra behavior.

---

### 8. Common mistakes

#### Mistake 1: Forgetting to pass parent arguments to `super()`

**Wrong code:**
```typescript
class Parent { constructor(public id: string) {} }
class Child extends Parent {
  constructor() {
    // super(); // Error: Expected 1 arguments, but got 0.
  }
}
```

---

### 9. Rules to remember
1. Subclasses inherit from parent classes using `extends`.
2. Subclass constructors must call `super(...args)` before using `this`.
3. Use `super.methodName()` to invoke parent methods from a subclass.

---

### 10. Exercises

#### Question 1 (Predict the compile result)
Will the subclass constructor compile?
```typescript
class Shape { constructor(public color: string) {} }
class Circle extends Shape {
  constructor(color: string, public radius: number) {
    super(color);
  }
}
```

#### Question 2 (Find and fix the bug)
Fix the error in the derived class constructor:
```typescript
class Base { constructor(public count: number) {} }
class Sub extends Base {
  constructor(count: number) {
    console.log(this.count);
    super(count);
  }
}
```

#### Question 3 (Write code from scratch)
Write a base class `Employee` with `name: string` and `salary: number`. Write a subclass `Manager` that adds `department: string` and calls `super()`.

#### Question 4 (Explain in your own words)
Why does JavaScript require calling `super()` before accessing `this` in a subclass?

---

### Solutions

#### Solution to Question 1
**Hint 1**: Is `super(color)` called properly?

**Answer**:
Yes, it compiles cleanly.

#### Solution to Question 2
**Hint 1**: Move `super(count)` before `console.log(this.count)`.

**Answer**:
```typescript
class Base { constructor(public count: number) {} }
class Sub extends Base {
  constructor(count: number) {
    super(count);
    console.log(this.count);
  }
}
```

#### Solution to Question 3
**Hint 1**: Use parameter properties and `super(name, salary)`.

**Answer**:
```typescript
class Employee {
  constructor(public name: string, public salary: number) {}
}

class Manager extends Employee {
  constructor(name: string, salary: number, public department: string) {
    super(name, salary);
  }
}
```

#### Solution to Question 4
**Hint 1**: Think about how instance memory is allocated in the JavaScript engine.

**Answer**:
In JavaScript ES6 class semantics, the base class constructor is responsible for allocating the instance memory and binding the prototype chain. The child class constructor cannot access `this` until the base class has created the instance via `super()`.

---

### 11. Recall

1. What keyword establishes class inheritance?
2. What function must be called in a derived constructor before `this`?
3. How do you call a parent method from a subclass?

**If you remember only one thing:**
Use `extends` to inherit from a parent class, and call `super()` before accessing `this`.

---

# Topic 7: Abstract Classes and Abstract Methods

### 1. What is it?
An **Abstract Class** is a base class that cannot be instantiated directly with `new`. It is designed strictly to be inherited by concrete subclasses.

An **Abstract Method** is a method signature declared inside an abstract class without any implementation body (`abstract render(): void;`). Concrete subclasses are required to implement every abstract method.

### 2. Why does it exist?
Often, you want to define a common template or workflow for a family of classes, but certain specific steps cannot be implemented in the base class.

For example, a `DatabaseAdapter` might have concrete shared methods for `connect()` and `disconnect()`, but executing a query (`executeQuery()`) is completely different for PostgreSQL versus SQLite. An abstract class lets you share common code while forcing subclasses to implement the specialized steps.

### 3. Basic example

```typescript
abstract class PaymentProcessor {
  // Concrete shared method:
  public logTransaction(amount: number): void {
    console.log(`Processing payment of $${amount}`);
  }

  // Abstract method: subclasses MUST implement this!
  abstract processPayment(amount: number): boolean;
}

// Cannot instantiate abstract class directly:
// const p = new PaymentProcessor(); // Compile Error!

class CreditCardProcessor extends PaymentProcessor {
  // Implementing required abstract method:
  processPayment(amount: number): boolean {
    this.logTransaction(amount);
    console.log("Charging credit card");
    return true;
  }
}

const processor = new CreditCardProcessor();
processor.processPayment(50); // Works!
```

**Line-by-line explanation:**
- `abstract class PaymentProcessor`: Marks the class as abstract. Calling `new PaymentProcessor()` triggers a compile error: `Cannot create an instance of an abstract class`.
- `logTransaction`: A standard concrete method with an implementation body. Inherited by all subclasses.
- `abstract processPayment(amount: number): boolean;`: Has no body `{}`. Every child class extending `PaymentProcessor` must implement it.
- `CreditCardProcessor extends PaymentProcessor`: Implements `processPayment`.

---

### 4. How it works inside TypeScript
1. **Instantiation Block**: The compiler forbids `new AbstractClass()`.
2. **Abstract Method Contract**: The compiler checks all derived classes. If a derived class fails to implement any abstract method, TypeScript reports an error:
   ```
   Non-abstract class 'X' does not implement inherited abstract member 'Y'.
   ```
3. **Template Method Pattern**: Enables writing base class workflows that call abstract methods implemented by children.

---

### 5. Think first

What happens if a concrete class extends an abstract class but forgets to implement an abstract method? Decide first.

```typescript
abstract class Task {
  abstract execute(): void;
}

class MyTask extends Task {}
```

---

**Answer and Reason:**

This code fails to compile:

```
Non-abstract class 'MyTask' does not implement inherited abstract member 'execute' from class 'Task'.
```

**Reason**: Concrete subclasses must implement all abstract methods defined in parent abstract classes.

---

### 6. Try it yourself
Create an `abstract class Storage` with an abstract method `abstract save(key: string, data: string): void`. Create a concrete subclass `LocalStorage` that implements `save`.

---

### 7. More examples

#### Example A: The Template Method Pattern (Medium)

```typescript
abstract class ReportGenerator {
  // Concrete workflow method:
  public generate(): string {
    const data = this.fetchData(); // Calls abstract step
    const formatted = this.formatReport(data); // Calls abstract step
    return formatted;
  }

  protected abstract fetchData(): string[];
  protected abstract formatReport(data: string[]): string;
}
```

**Line-by-line explanation:**
- The base class defines the overarching workflow algorithm (`generate()`), while subclasses provide the custom data-fetching and formatting steps.

---

### 8. Common mistakes

#### Mistake 1: Confusing Abstract Classes and Interfaces

**Comparison:**
- **Interface**: Pure contract. Has zero runtime code. Erased completely at compilation. Cannot contain method implementations.
- **Abstract Class**: Can contain both abstract contracts AND concrete method implementations that subclasses inherit. Emits a real JavaScript class at runtime.

---

### 9. Rules to remember
1. Abstract classes cannot be instantiated with `new`.
2. Abstract methods have no body and must be implemented by concrete subclasses.
3. Abstract classes can contain both concrete methods and abstract contracts.

---

### 10. Exercises

#### Question 1 (Predict the compile result)
Will line 5 compile?
```typescript
abstract class Animal {
  abstract makeSound(): void;
}
const a = new Animal();
```

#### Question 2 (Find and fix the bug)
Fix the error in `Circle`:
```typescript
abstract class Shape {
  abstract getArea(): number;
}
class Circle extends Shape {
  constructor(public radius: number) { super(); }
}
```

#### Question 3 (Write code from scratch)
Write an `abstract class Validator` with an abstract method `validate(input: string): boolean`. Write a concrete subclass `EmailValidator` that returns `true` if `input.includes("@")`.

#### Question 4 (Explain in your own words)
When should you use an abstract class instead of an interface?

---

### Solutions

#### Solution to Question 1
**Hint 1**: Can an abstract class be instantiated directly?

**Answer**:
No, it fails with: `Cannot create an instance of an abstract class`.

#### Solution to Question 2
**Hint 1**: Implement `getArea(): number`.

**Answer**:
```typescript
class Circle extends Shape {
  constructor(public radius: number) { super(); }
  getArea(): number {
    return Math.PI * this.radius ** 2;
  }
}
```

#### Solution to Question 3
**Hint 1**: Implement `validate` in `EmailValidator`.

**Answer**:
```typescript
abstract class Validator {
  abstract validate(input: string): boolean;
}

class EmailValidator extends Validator {
  validate(input: string): boolean {
    return input.includes("@");
  }
}
```

#### Solution to Question 4
**Hint 1**: Do you need to share actual code and state among subclasses?

**Answer**:
Use an interface when you only need a pure type contract with zero implementation or runtime overhead. Use an abstract class when you want to provide shared implementation code, shared state, or default behaviors that all subclasses inherit.

---

### 11. Recall

1. Can an abstract class be instantiated with `new`?
2. Do abstract methods have a code body `{}` in the abstract class?
3. What error happens if a subclass forgets to implement an abstract method?

**If you remember only one thing:**
Abstract classes provide a mix of shared implementation and required abstract contracts that subclasses must implement.

---

# Topic 8: Implementing Interfaces with `implements`

### 1. What is it?
A class can implement one or more interfaces using the `implements` keyword:
```typescript
class User implements Serializable, Loggable {}
```
The `implements` clause acts as a compile-time check. It forces the class to define all properties and methods declared in the interfaces.

### 2. Why does it exist?
In JavaScript, classes can only extend a single parent class (`extends Base`). Multiple inheritance of classes is not allowed.

However, an object often plays multiple roles: it might be `Serializable`, `Auditable`, and `Printable`. The `implements` keyword allows a class to satisfy multiple interface contracts simultaneously.

### 3. Basic example

```typescript
interface Loggable {
  log(): void;
}

interface Serializable {
  serialize(): string;
}

// Class implements both interfaces:
class UserRecord implements Loggable, Serializable {
  constructor(public id: string, public name: string) {}

  log(): void {
    console.log(`User ${this.id}: ${this.name}`);
  }

  serialize(): string {
    return JSON.stringify({ id: this.id, name: this.name });
  }
}

const user = new UserRecord("u1", "Alex");
user.log();
console.log(user.serialize());
```

**Line-by-line explanation:**
- `class UserRecord implements Loggable, Serializable`: Tells the compiler that `UserRecord` must satisfy both contracts.
- If `UserRecord` was missing either `log()` or `serialize()`, TypeScript would reject compilation with an error.

---

### 4. How it works inside TypeScript
1. **Contract Verification**: The compiler checks that the public instance members of the class satisfy all shapes in the `implements` list.
2. **Type Checking Only**: `implements` does NOT change the runtime behavior of the class, and does NOT generate prototype code.
3. **Public Requirement**: Properties required by an implemented interface **must be public**. They cannot be `private` or `protected`.

---

### 5. Think first

Does `implements` automatically provide types for your method parameters if you omit them? Decide first.

```typescript
interface MathOperation {
  calculate(a: number, b: number): number;
}

class Adder implements MathOperation {
  calculate(a, b) {
    return a + b;
  }
}
```

---

**Answer and Reason:**

With `noImplicitAny: true`, this code fails to compile:

```
Parameter 'a' implicitly has an 'any' type.
Parameter 'b' implicitly has an 'any' type.
```

**Reason**: `implements` only checks that the class matches the interface. It does **not** automatically annotate method parameters in the class body. You must write parameter types explicitly: `calculate(a: number, b: number)`.

---

### 6. Try it yourself
Create an interface `Disposable { dispose(): void }`. Write a class `FileStream implements Disposable` that implements the `dispose` method.

---

### 7. More examples

#### Example A: Combining `extends` and `implements` (Medium)

```typescript
class BaseService {
  public serviceId = "srv_1";
}

interface HealthCheck {
  isHealthy(): boolean;
}

class AuthService extends BaseService implements HealthCheck {
  isHealthy(): boolean {
    return true;
  }
}
```

**Line-by-line explanation:**
- `AuthService` inherits state from `BaseService` while satisfying the `HealthCheck` interface contract.

---

### 8. Common mistakes

#### Mistake 1: Trying to implement an interface using private properties

**Wrong code:**
```typescript
interface HasSecret { secret: string; }
class Vault implements HasSecret {
  private secret: string = "123"; // Error!
}
```

**Why it happens:**
Interfaces define public contracts. All implemented members must be `public`.

---

### 9. Rules to remember
1. `class C implements A, B` enforces that class `C` satisfies interfaces `A` and `B`.
2. A class can implement multiple interfaces, but can only extend one class.
3. Implemented interface members must always be `public`.
4. Method parameter types are not automatically inferred by `implements`.

---

### 10. Exercises

#### Question 1 (Predict the compile result)
Will the class below compile?
```typescript
interface Clock { tick(): void }
class WallClock implements Clock {}
```

#### Question 2 (Find and fix the bug)
Fix the accessibility modifier:
```typescript
interface Runner { run(): void }
class Athlete implements Runner {
  protected run(): void { console.log("Running"); }
}
```

#### Question 3 (Write code from scratch)
Write two interfaces: `Identifiable { id: string }` and `Versioned { version: number }`. Write a class `Document` that implements both.

#### Question 4 (Explain in your own words)
What is the difference between `extends` and `implements`?

---

### Solutions

#### Solution to Question 1
**Hint 1**: Does `WallClock` define `tick()`?

**Answer**:
No, it fails with: `Class 'WallClock' incorrectly implements interface 'Clock'. Property 'tick' is missing`.

#### Solution to Question 2
**Hint 1**: Change `protected` to `public`.

**Answer**:
```typescript
interface Runner { run(): void }
class Athlete implements Runner {
  public run(): void { console.log("Running"); }
}
```

#### Solution to Question 3
**Hint 1**: Provide public properties `id` and `version`.

**Answer**:
```typescript
interface Identifiable { id: string; }
interface Versioned { version: number; }

class Document implements Identifiable, Versioned {
  constructor(
    public id: string,
    public version: number
  ) {}
}
```

#### Solution to Question 4
**Hint 1**: Which one inherits actual code versus which one checks a type contract?

**Answer**:
`extends` is class inheritance: the child class inherits actual runtime methods, state, and prototype links from the parent class. `implements` is a static type contract check: it does not inherit any code, but forces the class to satisfy the public shape defined by the interface.

---

### 11. Recall

1. Can a class implement more than one interface?
2. What visibility must implemented interface members have?
3. Does `implements` emit JavaScript code?

**If you remember only one thing:**
Use `implements` to force a class to adhere to public interface contracts.

---

# Topic 9: Method Overriding and the `override` Keyword (TS 4.3)

### 1. What is it?
Introduced in TypeScript 4.3, the `override` keyword explicitly indicates that a method or property in a subclass is intended to override an existing method in its parent class:
```typescript
class Child extends Parent {
  override execute(): void {}
}
```

### 2. Why does it exist?
In large codebases, developers frequently override methods. Two common bugs occur:
1. **Misspelled Override**: You intend to override `saveUser()`, but you accidentally name it `saveUsers()`. The compiler silently creates a new method, and the parent method is never overridden.
2. **Parent Method Renamed**: A developer renames or deletes `render()` in the parent class. The subclass's `render()` method is now an orphaned method without warning.

The `override` keyword forces the compiler to verify that a method with the exact same name actually exists on the parent class.

### 3. Basic example

```typescript
class BaseService {
  start(): void {
    console.log("Base service started");
  }
}

class AuthService extends BaseService {
  // Explicitly marked as overriding:
  override start(): void {
    console.log("Auth service starting with security checks");
  }

  // Typo caught immediately!
  // override starrt(): void {}
  // Compile Error: This member cannot have an 'override' modifier because it is not declared in the base class 'BaseService'.
}
```

**Line-by-line explanation:**
- `override start(): void`: Tells the compiler that `start` exists on `BaseService`.
- If someone renames `start()` on `BaseService` in the future, TypeScript will immediately flag an error on `AuthService`.
- A typo like `starrt` is caught immediately because `starrt` does not exist on `BaseService`.

---

### 4. How it works inside TypeScript
1. **Parent Hierarchy Check**: The compiler inspects the prototype chain of the superclass.
2. **Existence Verification**: If no matching member exists in the parent class, error TS4113 is raised.
3. **`noImplicitOverride` Compiler Flag**: When enabled in `tsconfig.json`, TypeScript **requires** you to use `override` on any subclass member that shadows a parent member.

---

### 5. Think first

What happens when you use `override` on a class that does NOT extend any parent class? Decide first.

```typescript
class Standalone {
  override run() {}
}
```

---

**Answer and Reason:**

This code fails to compile:

```
This member cannot have an 'override' modifier because it is not declared in the base class.
```

**Reason**: `Standalone` does not extend a parent class. It has no parent method to override.

---

### 6. Try it yourself
Create a parent class `Writer` with method `write(text: string): void`. Create a subclass `HtmlWriter` that uses `override` on `write(text: string)`.

---

### 7. More examples

#### Example A: Overriding Properties (Medium)

```typescript
class Component {
  name: string = "BaseComponent";
}

class Button extends Component {
  override name: string = "ButtonComponent";
}
```

**Line-by-line explanation:**
- `override` can also be applied to properties that shadow parent properties.

---

### 8. Common mistakes

#### Mistake 1: Changing the parameter types incompatibly when overriding

**Wrong code:**
```typescript
class Parent {
  process(x: string): void {}
}
class Child extends Parent {
  // override process(x: number): void {} // Error: Incompatible signature!
}
```

**Why it happens:**
Subclass methods must remain compatible with the parent class signature according to the Liskov Substitution Principle.

---

### 9. Rules to remember
1. `override` tells the compiler that a member must exist on the parent class.
2. Catches typos and orphaned methods if parent classes are refactored.
3. Enable `noImplicitOverride: true` in `tsconfig.json` to make `override` mandatory.

---

### 10. Exercises

#### Question 1 (Predict the compile result)
Will `Child` compile?
```typescript
class Parent { render(): void {} }
class Child extends Parent {
  override render(): void {}
}
```

#### Question 2 (Find and fix the bug)
Fix the error caught by `override`:
```typescript
class SuperLogger { log(msg: string): void {} }
class SubLogger extends SuperLogger {
  override print(msg: string): void {}
}
```

#### Question 3 (Write code from scratch)
Write a base class `Notification` with `send(): void`. Write a subclass `PushNotification` using `override send(): void` that logs `"Sending push"`.

#### Question 4 (Explain in your own words)
Why is the `noImplicitOverride` tsconfig flag recommended for large engineering teams?

---

### Solutions

#### Solution to Question 1
**Hint 1**: Does `render` exist on `Parent`?

**Answer**:
Yes, it compiles without error.

#### Solution to Question 2
**Hint 1**: Change `print` to `log`.

**Answer**:
```typescript
class SuperLogger { log(msg: string): void {} }
class SubLogger extends SuperLogger {
  override log(msg: string): void {}
}
```

#### Solution to Question 3
**Hint 1**: Use `override send(): void`.

**Answer**:
```typescript
class Notification {
  send(): void { console.log("Sending"); }
}

class PushNotification extends Notification {
  override send(): void {
    console.log("Sending push");
  }
}
```

#### Solution to Question 4
**Hint 1**: What happens during large refactors when parent class methods are renamed?

**Answer**:
In large teams, an engineer might rename a method in a base class without knowing that other developers created subclasses overriding that method. Without `noImplicitOverride`, the subclasses silently stop overriding the method and introduce runtime bugs. With `noImplicitOverride`, the compiler immediately catches all subclasses and requires them to be updated.

---

### 11. Recall

1. What keyword explicitly marks a subclass method as overriding a parent method?
2. Which TypeScript version introduced the `override` keyword?
3. What compiler flag requires `override` on all shadowed methods?

**If you remember only one thing:**
Use `override` to ensure you are actually overriding a parent method, catching typos and refactoring bugs.

---

# Topic 10: Polymorphic `this` Type for Fluent Chaining

### 1. What is it?
In TypeScript classes, the special type `this` represents the **current subtype** of the class, rather than the base class itself.

When a method returns `this`, method calls on a subclass automatically return the subclass type, allowing seamless method chaining (fluent builders).

### 2. Why does it exist?
Consider building a query builder or fluent API with inheritance:
- Base class `QueryBuilder` has `.where()`.
- Subclass `UserQueryBuilder` adds `.withRoles()`.

If `.where()` returned the base type `QueryBuilder`, calling `userQuery.where("...").withRoles()` would fail because `.where()` returned the base class! Returning `this` ensures the chained return type remains `UserQueryBuilder`.

### 3. Basic example

```typescript
class BasicBuilder {
  protected query: string = "";

  where(condition: string): this {
    this.query += ` WHERE ${condition}`;
    return this; // Returns 'this'
  }
}

class UserQueryBuilder extends BasicBuilder {
  withRoles(role: string): this {
    this.query += ` AND role = '${role}'`;
    return this;
  }

  build(): string {
    return this.query;
  }
}

// Fluent method chaining across inheritance:
const sql = new UserQueryBuilder()
  .where("active = true") // Returns UserQueryBuilder!
  .withRoles("admin")     // Accessible because return type was not lost!
  .build();

console.log(sql);
```

**Line-by-line explanation:**
- `where(condition: string): this`: The return type is not `BasicBuilder`; it is the polymorphic `this` type.
- When called on `UserQueryBuilder`, `this` evaluates to `UserQueryBuilder`.
- Chaining `.withRoles()` works seamlessly because the subclass methods are preserved.

---

### 4. How it works inside TypeScript
1. **Dynamic Subtype Binding**: `this` dynamically represents whatever subclass instance the method was invoked on.
2. **Subclass Compatibility**: In a subclass, `this` is a subtype of the parent's `this`.
3. **Builder Pattern Support**: Allows fluent, chainable method calls across multiple levels of inheritance.

---

### 5. Think first

What would happen if `where()` returned `BasicBuilder` instead of `this`? Decide first.

```typescript
class BasicBuilder {
  where(condition: string): BasicBuilder {
    return this;
  }
}
class UserQueryBuilder extends BasicBuilder {
  withRoles(): this { return this; }
}

const b = new UserQueryBuilder().where("x = 1").withRoles();
```

---

**Answer and Reason:**

This code fails to compile:

```
Property 'withRoles' does not exist on type 'BasicBuilder'.
```

**Reason**: `where` explicitly returned `BasicBuilder`. The subclass methods on `UserQueryBuilder` were lost in the chain. Returning `this` prevents this error.

---

### 6. Try it yourself
Create a class `Calculator` with methods `add(n: number): this` and `multiply(n: number): this`. Chain calls `new Calculator().add(5).multiply(2)`.

---

### 7. More examples

#### Example A: Multi-Level Builder Hierarchy (Medium)

```typescript
class BaseRequest {
  setUrl(url: string): this { return this; }
}

class AuthenticatedRequest extends BaseRequest {
  setToken(token: string): this { return this; }
}

class JsonRequest extends AuthenticatedRequest {
  setPayload(data: object): this { return this; }
}

// Chains across 3 inheritance levels:
new JsonRequest()
  .setUrl("/api")
  .setToken("tok_123")
  .setPayload({ ok: true });
```

---

### 8. Common mistakes

#### Mistake 1: Returning the class name instead of `this` in chainable methods

**Wrong code:**
```typescript
class StepBuilder {
  stepOne(): StepBuilder { return this; }
}
```

**Why it happens:**
If someone extends `StepBuilder`, `stepOne()` will drop subclass methods. Always use `: this`.

---

### 9. Rules to remember
1. Returning `: this` preserves the derived subclass type during method chaining.
2. Enables fluent builders that work across multiple levels of inheritance.
3. Prefer `: this` over `: ClassName` for all chainable methods.

---

### 10. Exercises

#### Question 1 (Predict the compile result)
What is the return type of `builder.setA(1)` when called on an instance of `ChildBuilder`?
```typescript
class ParentBuilder { setA(n: number): this { return this; } }
class ChildBuilder extends ParentBuilder {}
```

#### Question 2 (Find and fix the bug)
Fix the return type so subclasses can chain methods:
```typescript
class Pipeline {
  pipe(step: string): Pipeline { return this; }
}
```

#### Question 3 (Write code from scratch)
Write a class `FluentString` with a private `val: string`. Add chainable methods `append(s: string): this` and `trim(): this`, and a terminal method `toString(): string`.

#### Question 4 (Explain in your own words)
Why is the polymorphic `this` type different from writing the class's own name as the return type?

---

### Solutions

#### Solution to Question 1
**Hint 1**: `this` represents the derived instance.

**Answer**:
The return type is `ChildBuilder`.

#### Solution to Question 2
**Hint 1**: Change `Pipeline` to `this`.

**Answer**:
```typescript
class Pipeline {
  pipe(step: string): this { return this; }
}
```

#### Solution to Question 3
**Hint 1**: Return `this` on `append` and `trim`.

**Answer**:
```typescript
class FluentString {
  constructor(private val: string = "") {}

  append(s: string): this {
    this.val += s;
    return this;
  }

  trim(): this {
    this.val = this.val.trim();
    return this;
  }

  toString(): string {
    return this.val;
  }
}
```

#### Solution to Question 4
**Hint 1**: What happens when a subclass extends the class?

**Answer**:
Writing the class's own name (e.g. `: BasicBuilder`) hardcodes the return type to the base class, slicing off any methods added by derived subclasses. The polymorphic `this` type dynamically represents the exact subtype of the object at the call site, keeping derived methods accessible in chains.

---

### 11. Recall

1. What return type preserves derived subclasses during method chaining?
2. What pattern commonly uses polymorphic `this`?
3. If `Child extends Parent`, what does `parentMethod(): this` return on a `Child` instance?

**If you remember only one thing:**
Return `this` from chainable methods to support fluent method calls across class inheritance.

---

# Checkpoint Challenge: Topics 6 to 10

### Challenge Scenario
Build an extensible SQL query builder using inheritance, abstract methods, and polymorphic `this`:

1. Define an `abstract class BaseQuery`:
   - Store `protected table: string`.
   - Store `protected conditions: string[] = []`.
   - Add a chainable method `where(clause: string): this` that pushes to `conditions` and returns `this`.
   - Declare an abstract method `abstract build(): string`.
2. Create a concrete subclass `SelectQuery extends BaseQuery`:
   - Add a constructor taking `table: string` and `public fields: string[] = ["*"]`.
   - Add a chainable method `limit(count: number): this`.
   - Implement `override build(): string` that returns `"SELECT " + fields.join(", ") + " FROM " + this.table + ...`.
3. Test chaining `.where("id = 1").limit(10).build()`.

### Challenge Solution

```typescript
abstract class BaseQuery {
  protected conditions: string[] = [];

  constructor(protected table: string) {}

  where(clause: string): this {
    this.conditions.push(clause);
    return this;
  }

  abstract build(): string;
}

class SelectQuery extends BaseQuery {
  private limitCount?: number;

  constructor(table: string, public fields: string[] = ["*"]) {
    super(table);
  }

  limit(count: number): this {
    this.limitCount = count;
    return this;
  }

  override build(): string {
    let sql = `SELECT ${this.fields.join(", ")} FROM ${this.table}`;
    if (this.conditions.length > 0) {
      sql += ` WHERE ${this.conditions.join(" AND ")}`;
    }
    if (this.limitCount !== undefined) {
      sql += ` LIMIT ${this.limitCount}`;
    }
    return sql;
  }
}

const query = new SelectQuery("users", ["id", "name"])
  .where("active = 1")
  .where("age > 18")
  .limit(5)
  .build();

console.log("Generated SQL:", query);
// "SELECT id, name FROM users WHERE active = 1 AND age > 18 LIMIT 5"
```

---

# Topic 11: Class Mixins and Functional Composition

### 1. What is it?
A **Mixin** is a function that takes a class constructor as an input argument and returns a new class constructor that extends it with new properties and methods:
```typescript
function Timestamped<TBase extends Constructor>(Base: TBase) {
  return class extends Base {
    timestamp = Date.now();
  };
}
```

### 2. Why does it exist?
JavaScript does not support multiple class inheritance: a class cannot write `class User extends Model, Loggable, Disposable`.

Mixins allow you to compose reusable behaviors across unrelated classes cleanly without deep, rigid inheritance hierarchies.

### 3. Basic example

```typescript
type Constructor<T = {}> = new (...args: any[]) => T;

// 1. Mixin adding a timestamp:
function Timestamped<TBase extends Constructor>(Base: TBase) {
  return class extends Base {
    createdAt = new Date();
  };
}

// 2. Mixin adding an activator flag:
function Activatable<TBase extends Constructor>(Base: TBase) {
  return class extends Base {
    isActive = false;
    activate() {
      this.isActive = true;
    }
  };
}

// 3. Base class:
class User {
  constructor(public name: string) {}
}

// 4. Compose mixins:
const AdvancedUser = Activatable(Timestamped(User));

const u = new AdvancedUser("Alex");
console.log(u.name);      // From User
console.log(u.createdAt); // From Timestamped mixin
u.activate();             // From Activatable mixin
console.log(u.isActive);  // true
```

**Line-by-line explanation:**
- `type Constructor<T>`: A generic constructor signature.
- `Timestamped(Base)`: Returns an anonymous class extending `Base` with `createdAt`.
- `Activatable(Base)`: Returns an anonymous class extending `Base` with `isActive` and `activate()`.
- `Activatable(Timestamped(User))`: Chains the mixins to produce a combined class.

---

### 4. How it works inside TypeScript
1. **Higher-Order Class**: The function creates a dynamic class extension at runtime.
2. **Type Intersection**: TypeScript infers the returned constructor type as an intersection of the base class and the added properties.
3. **Constructor Forwarding**: Any arguments passed to the composed constructor are forwarded down the chain via `...args`.

---

### 5. Think first

What is the type of `u` in `const u = new AdvancedUser("Alex")`? Decide first.

---

**Answer and Reason:**

The type of `u` is an intersection:

```typescript
User & { createdAt: Date } & { isActive: boolean; activate(): void }
```

**Reason**: TypeScript infers the compound instance type by combining the members of the base class and all applied mixins.

---

### 6. Try it yourself
Write a mixin `Tagging<TBase extends Constructor>(Base: TBase)` that adds an array `tags: string[] = []` and a method `addTag(tag: string)`. Apply it to a `Post` class.

---

### 7. More examples

#### Example A: Mixin with Constrained Base Classes (Medium)

```typescript
interface HasId {
  id: string;
}

// Restrict mixin so it can ONLY be applied to classes that have 'id':
function Deletable<TBase extends Constructor<HasId>>(Base: TBase) {
  return class extends Base {
    deleteRecord(): void {
      console.log("Deleting record with ID:", this.id);
    }
  };
}
```

---

### 8. Common mistakes

#### Mistake 1: Trying to use private `#` fields across mixin boundaries

**Wrong assumption:**
Expecting a mixin to access private `#` fields of the base class.

**Reality:**
Native `#` private fields are strictly scoped to the class that declared them. A mixin cannot access private fields of its base class.

---

### 9. Rules to remember
1. Mixins are functions that accept a constructor and return an extended class.
2. Syntax: `function Mixin<TBase extends Constructor>(Base: TBase) { return class extends Base { ... }; }`.
3. Mixins allow multiple inheritance of behavior through functional composition.

---

### 10. Exercises

#### Question 1 (Predict the compile result)
Will `item.id` and `item.count` be available?
```typescript
class Base { id = 1; }
function AddCount<T extends Constructor>(B: T) {
  return class extends B { count = 0; };
}
const Mixed = AddCount(Base);
const item = new Mixed();
```

#### Question 2 (Find and fix the bug)
Fix the constructor constraint so `Base` can accept arguments:
```typescript
type BadConstructor = new () => {};
```

#### Question 3 (Write code from scratch)
Write a mixin `Disposable` that adds `isDisposed: boolean` and `dispose(): void`.

#### Question 4 (Explain in your own words)
Why are class mixins preferred over deep multi-level inheritance hierarchies?

---

### Solutions

#### Solution to Question 1
**Hint 1**: The mixin combines both.

**Answer**:
Yes, both `item.id` (from `Base`) and `item.count` (from `AddCount`) are available.

#### Solution to Question 2
**Hint 1**: Add `...args: any[]`.

**Answer**:
```typescript
type Constructor<T = {}> = new (...args: any[]) => T;
```

#### Solution to Question 3
**Hint 1**: Return `class extends Base { ... }`.

**Answer**:
```typescript
function Disposable<TBase extends Constructor>(Base: TBase) {
  return class extends Base {
    isDisposed = false;
    dispose(): void {
      this.isDisposed = true;
    }
  };
}
```

#### Solution to Question 4
**Hint 1**: Think about the "diamond problem" and rigid class hierarchies.

**Answer**:
Deep inheritance chains create brittle architectures where changes to a base class unintentionally break all descendants. Mixins allow you to compose discrete, independent behaviors on demand, keeping classes small and loosely coupled without rigid parent-child dependencies.

---

### 11. Recall

1. What is a TypeScript class mixin?
2. What generic constraint describes a class constructor?
3. Can multiple mixins be applied to a single class?

**If you remember only one thing:**
Mixins compose reusable behaviors onto classes via higher-order functions without deep inheritance trees.

---

# Topic 12: The Single Responsibility (S) and Open/Closed (O) Principles

### 1. What is it?
The **SOLID** principles are five design rules for writing maintainable object-oriented software:
- **S (Single Responsibility Principle)**: A class should have only one reason to change. It should do one job well.
- **O (Open/Closed Principle)**: Software entities should be open for extension, but closed for modification. You should be able to add new behavior without altering existing, tested code.

### 2. Why does it exist?
- Violating **SRP** creates "God classes" that handle business logic, database queries, and email formatting all in one file. Changing the email template can accidentally break the database query!
- Violating **OCP** means modifying a giant `switch` statement every time a new feature is added, which risks breaking existing features.

### 3. Basic example

#### S: Single Responsibility Principle

```typescript
// VIOLATION: User class handles data AND database persistence AND email sending
class BadUser {
  constructor(public email: string) {}
  saveToDb() { /* DB code */ }
  sendWelcomeEmail() { /* Email code */ }
}

// ADHERENCE: Separate responsibilities into specialized classes
class User {
  constructor(public email: string) {}
}

class UserRepository {
  save(user: User): void {
    console.log("Saving user to DB:", user.email);
  }
}

class EmailService {
  sendWelcome(user: User): void {
    console.log("Sending welcome email to:", user.email);
  }
}
```

#### O: Open/Closed Principle

```typescript
// VIOLATION: Adding a new shape requires editing calculateArea with new switch cases!
// ADHERENCE: Define an interface. New shapes extend behavior without modifying existing code.
interface Shape {
  getArea(): number;
}

class Rectangle implements Shape {
  constructor(public width: number, public height: number) {}
  getArea(): number { return this.width * this.height; }
}

class Circle implements Shape {
  constructor(public radius: number) {}
  getArea(): number { return Math.PI * this.radius ** 2; }
}

// Adding a Triangle never touches Rectangle or Circle!
class Triangle implements Shape {
  constructor(public base: number, public height: number) {}
  getArea(): number { return 0.5 * this.base * this.height; }
}

function printTotalArea(shapes: Shape[]): number {
  return shapes.reduce((sum, s) => sum + s.getArea(), 0);
}
```

---

### 4. How it works inside TypeScript
1. **SRP**: High cohesion and small classes. Each class encapsulates one cohesive concept.
2. **OCP via Polymorphism**: Polymorphic interfaces allow new implementations to be passed to existing consumer functions without changing the consumer's code.

---

### 5. Think first

If you need to add a discounts feature to an order system, which approach satisfies the Open/Closed Principle?
- **Approach A**: Add an `if/else` inside `Order.calculatePrice()` for every discount code.
- **Approach B**: Create a `DiscountStrategy` interface and pass discount implementations into `calculatePrice()`.
Decide first.

---

**Answer and Reason:**

**Approach B** satisfies OCP.

**Reason**: Approach B allows adding 50 new discount strategies in new files without ever editing or risking bugs in `Order.calculatePrice()`.

---

### 6. Try it yourself
Create an interface `PaymentMethod { pay(amount: number): void }`. Create `CreditCardPayment` and `PayPalPayment`. Write a function `checkout(p: PaymentMethod, amount: number)`. Verify that adding a third payment method requires zero changes to `checkout`.

---

### 7. More examples

#### Example A: Notification Service following SRP and OCP (Medium)

```typescript
interface Notifier {
  send(message: string): void;
}

class SmsNotifier implements Notifier {
  send(msg: string) { console.log("SMS:", msg); }
}

class SlackNotifier implements Notifier {
  send(msg: string) { console.log("Slack:", msg); }
}

class AlertManager {
  constructor(private notifiers: Notifier[]) {}

  notifyAll(msg: string) {
    for (const n of this.notifiers) n.send(msg);
  }
}
```

---

### 8. Common mistakes

#### Mistake 1: Editing core classes instead of using polymorphism

**Wrong approach:**
Modifying existing class methods every time a new business requirement appears.

---

### 9. Rules to remember
1. Single Responsibility: One class = one responsibility.
2. Open/Closed: Open for extension (via interfaces/inheritance), closed for modification.
3. Polymorphism is the primary tool for implementing OCP.

---

### 10. Exercises

#### Question 1 (Predict the compile result)
Does `printTotalArea([new Rectangle(2, 3), new Circle(5)])` compile?

#### Question 2 (Find and fix the bug)
Refactor the class below to satisfy the Single Responsibility Principle:
```typescript
class Order {
  constructor(public id: string) {}
  printInvoice() { /* print logic */ }
}
```

#### Question 3 (Write code from scratch)
Write an interface `FilterStrategy<T> { isMatch(item: T): boolean }`. Write a function `filterItems<T>(items: T[], strategy: FilterStrategy<T>): T[]`.

#### Question 4 (Explain in your own words)
Why does violating the Single Responsibility Principle make code harder to test?

---

### Solutions

#### Solution to Question 1
**Hint 1**: Both implement `Shape`.

**Answer**:
Yes, it compiles and runs cleanly.

#### Solution to Question 2
**Hint 1**: Move printing to an `InvoicePrinter` class.

**Answer**:
```typescript
class Order {
  constructor(public id: string) {}
}

class InvoicePrinter {
  print(order: Order): void {
    console.log("Invoice for order:", order.id);
  }
}
```

#### Solution to Question 3
**Hint 1**: Use `items.filter(item => strategy.isMatch(item))`.

**Answer**:
```typescript
interface FilterStrategy<T> {
  isMatch(item: T): boolean;
}

function filterItems<T>(items: T[], strategy: FilterStrategy<T>): T[] {
  return items.filter((item) => strategy.isMatch(item));
}
```

#### Solution to Question 4
**Hint 1**: What dependencies must you mock when a class does multiple jobs?

**Answer**:
When a class does multiple jobs (e.g. business logic, database queries, and email transport), testing a simple calculation requires mocking databases, network connections, and email servers. Classes with a single responsibility have minimal dependencies, making unit tests fast, isolated, and simple.

---

### 11. Recall

1. What does SRP stand for?
2. What does OCP stand for?
3. What language feature enables OCP without modifying existing code?

**If you remember only one thing:**
Give each class one job, and use interfaces so new features can be added without modifying existing code.

---

# Topic 13: Liskov Substitution (L) and Interface Segregation (I) Principles

### 1. What is it?
- **L (Liskov Substitution Principle - LSP)**: Subtypes must be substitutable for their base types without altering the correctness of the program. If class `B` extends `A`, any code expecting `A` must function correctly with `B`.
- **I (Interface Segregation Principle - ISP)**: Clients should not be forced to depend on interfaces they do not use. Split fat interfaces into small, specific ones.

### 2. Why does it exist?
- Violating **LSP** happens when a subclass breaks expectations (for example, throwing an error on an inherited method or changing return contracts). Code that expects the base class crashes unexpectedly.
- Violating **ISP** creates bloated interfaces where classes are forced to write dummy empty methods (`throw new Error("Not implemented")`) for methods they don't support.

### 3. Basic example

#### L: Liskov Substitution Principle

```typescript
// VIOLATION: Square breaks the behavior of Rectangle!
class Rectangle {
  constructor(public width: number, public height: number) {}
  setWidth(w: number) { this.width = w; }
  setHeight(h: number) { this.height = h; }
  getArea() { return this.width * this.height; }
}

class BadSquare extends Rectangle {
  override setWidth(w: number) { this.width = w; this.height = w; }
  override setHeight(h: number) { this.width = h; this.height = h; }
}

function resize(r: Rectangle) {
  r.setWidth(5);
  r.setHeight(4);
  // Expects 5 * 4 = 20. But with BadSquare, it produces 4 * 4 = 16! Bug!
}

// ADHERENCE: Separate Square and Rectangle or use a shared Shape interface
interface Shape { getArea(): number; }
```

#### I: Interface Segregation Principle

```typescript
// VIOLATION: Bloated interface forces unnecessary methods
interface BadWorker {
  work(): void;
  eat(): void;
  sleep(): void;
}

// A RobotWorker cannot eat or sleep!
// ADHERENCE: Segregate into small, focused interfaces:
interface Workable {
  work(): void;
}

interface Feedable {
  eat(): void;
}

class HumanWorker implements Workable, Feedable {
  work() { console.log("Working"); }
  eat() { console.log("Eating"); }
}

class RobotWorker implements Workable {
  work() { console.log("Working without food or sleep"); }
}
```

---

### 4. How it works inside TypeScript
1. **LSP**: Subclass method parameters must be contravariant/bivariant, and return types must be covariant. Do not throw unexpected errors in overridden methods.
2. **ISP**: Favor composing multiple small interfaces (`implements A, B`) over implementing a single monolithic interface.

---

### 5. Think first

Why does `throw new Error("Method not supported")` in an overridden method almost always indicate a violation of the Liskov Substitution Principle? Decide first.

---

**Answer and Reason:**

**Reason**: Callers expecting the base class contract expect the method to execute successfully. If a subclass throws an unsupported error, it cannot safely substitute for the base class, violating LSP.

---

### 6. Try it yourself
Create interfaces `Readable { read(): string }` and `Writable { write(data: string): void }`. Create a class `ReadOnlyFile implements Readable`. Verify it does not need to implement `write`.

---

### 7. More examples

#### Example A: Segregated Printer Interfaces (Medium)

```typescript
interface Printer { print(): void; }
interface Scanner { scan(): void; }
interface Fax { fax(): void; }

class SimplePrinter implements Printer {
  print() { console.log("Printing"); }
}

class AllInOneMachine implements Printer, Scanner, Fax {
  print() { console.log("Printing"); }
  scan() { console.log("Scanning"); }
  fax() { console.log("Faxing"); }
}
```

---

### 8. Common mistakes

#### Mistake 1: Creating one giant interface with 20 methods

**Wrong approach:**
Creating a `Repository` interface that forces read-only queries to implement `insert`, `update`, and `delete`.

---

### 9. Rules to remember
1. Subclasses must safely substitute for their parents without breaking behavior (LSP).
2. Avoid throwing "not supported" exceptions in overridden methods.
3. Split large interfaces into small, cohesive interfaces (ISP).

---

### 10. Exercises

#### Question 1 (Predict the compile result)
Can `SimplePrinter` be passed to `function test(p: Printer)`?

#### Question 2 (Find and fix the bug)
Segregate the bloated interface below:
```typescript
interface AudioPlayer {
  play(): void;
  burnToCd(): void;
}
```

#### Question 3 (Write code from scratch)
Write an interface `CanFly { fly(): void }` and `CanSwim { swim(): void }`. Write a class `Duck` implementing both.

#### Question 4 (Explain in your own words)
How does the Interface Segregation Principle prevent dummy or stub implementations?

---

### Solutions

#### Solution to Question 1
**Hint 1**: Does `SimplePrinter` implement `Printer`?

**Answer**:
Yes, it satisfies `Printer` and compiles cleanly.

#### Solution to Question 2
**Hint 1**: Separate playback from CD burning.

**Answer**:
```typescript
interface Playable { play(): void; }
interface CdBurnable { burnToCd(): void; }
```

#### Solution to Question 3
**Hint 1**: Implement both interfaces.

**Answer**:
```typescript
interface CanFly { fly(): void; }
interface CanSwim { swim(): void; }

class Duck implements CanFly, CanSwim {
  fly() { console.log("Flying"); }
  swim() { console.log("Swimming"); }
}
```

#### Solution to Question 4
**Hint 1**: What happens when an interface contains methods a class cannot support?

**Answer**:
When an interface is bloated, implementing classes are forced to write dummy stubs or throw errors for methods they cannot support. Segregating interfaces into small, targeted capabilities ensures that classes only implement methods they actually use.

---

### 11. Recall

1. What does LSP stand for?
2. What does ISP stand for?
3. What is the danger of giant interfaces?

**If you remember only one thing:**
Subclasses must safely replace their parents, and interfaces should be small and specific.

---

# Topic 14: Dependency Inversion Principle (D) and Inversion of Control

### 1. What is it?
The **Dependency Inversion Principle (DIP)** states:
1. High-level modules should not import or depend on low-level modules directly. Both should depend on **abstractions** (interfaces).
2. Abstractions should not depend on details. Details (implementations) should depend on abstractions.

**Inversion of Control (IoC)** is the pattern where dependencies are injected from the outside (Dependency Injection) rather than instantiated internally with `new`.

### 2. Why does it exist?
If a high-level `OrderService` directly instantiates `new MySqlDatabase()` and `new SmtpEmailClient()`, the code is tightly coupled.

You cannot unit test `OrderService` without running a real MySQL server and sending real emails! If you switch to PostgreSQL, you have to rewrite `OrderService`.
By depending on interfaces (`Database` and `EmailClient`), `OrderService` becomes completely decoupled, easily testable with mock data, and flexible.

### 3. Basic example

```typescript
// 1. Abstraction (Contract):
interface DatabaseConnection {
  save(key: string, value: string): void;
}

// 2. Low-level Implementations:
class PostgresConnection implements DatabaseConnection {
  save(key: string, value: string): void {
    console.log(`[Postgres] Saving ${key}: ${value}`);
  }
}

class MockTestConnection implements DatabaseConnection {
  public store = new Map<string, string>();
  save(key: string, value: string): void {
    this.store.set(key, value);
  }
}

// 3. High-level Module (Depends ONLY on abstraction):
class UserService {
  // Dependency is injected from outside!
  constructor(private db: DatabaseConnection) {}

  registerUser(id: string, name: string): void {
    this.db.save(id, name);
  }
}

// Production execution:
const prodService = new UserService(new PostgresConnection());
prodService.registerUser("u1", "Alex");

// Unit test execution (Zero database needed!):
const mockDb = new MockTestConnection();
const testService = new UserService(mockDb);
testService.registerUser("u2", "Jordan");
console.log(mockDb.store.get("u2")); // "Jordan" (Fast, isolated test!)
```

**Line-by-line explanation:**
- `interface DatabaseConnection`: The abstraction defining the contract.
- `PostgresConnection` and `MockTestConnection`: Concrete details implementing the contract.
- `constructor(private db: DatabaseConnection)`: `UserService` depends on the abstraction, not any concrete class.
- Dependencies are passed in from the outside (Inversion of Control).

---

### 4. How it works inside TypeScript
1. **Inverted Dependency Arrow**: Instead of high-level code pointing to low-level code, both point to the shared interface.
2. **Compile-Time Decoupling**: You can change, swap, or mock the database without recompiling or altering `UserService`.
3. **Foundation for DI Containers**: Frameworks like NestJS, Angular, and InversifyJS build on this exact principle.

---

### 5. Think first

What happens to unit testing if a class writes `private db = new PostgresDatabase()` inside its constructor? Decide first.

---

**Answer and Reason:**

Unit tests cannot run without a live, running Postgres database!

**Reason**: The class is tightly coupled to the concrete `PostgresDatabase` implementation. You cannot inject a mock database for tests.

---

### 6. Try it yourself
Create an interface `Logger { log(msg: string): void }`. Create a class `ConsoleLogger` and a class `FileLogger`. Create a class `App` that accepts `Logger` in its constructor and logs `"App started"`.

---

### 7. More examples

#### Example A: Swapping Cloud Storage Providers (Medium)

```typescript
interface FileStorage {
  upload(fileName: string, buffer: Buffer): Promise<string>;
}

class S3Storage implements FileStorage {
  async upload(name: string): Promise<string> { return `https://s3.amazonaws.com/${name}`; }
}

class GoogleCloudStorage implements FileStorage {
  async upload(name: string): Promise<string> { return `https://storage.googleapis.com/${name}`; }
}

class UploadManager {
  constructor(private storage: FileStorage) {}
  async process(file: string) {
    return this.storage.upload(file, Buffer.from(""));
  }
}
```

---

### 8. Common mistakes

#### Mistake 1: Using `new ConcreteClass()` inside high-level business services

**Wrong code:**
```typescript
class OrderService {
  private db = new MySQL(); // Hard dependency!
}
```

**Correct code:**
Inject via constructor:
```typescript
class OrderService {
  constructor(private db: Database) {}
}
```

---

### 9. Rules to remember
1. High-level modules should depend on interfaces, not concrete implementations.
2. Inject dependencies through constructors (Dependency Injection).
3. Decoupled code is easy to test, maintain, and refactor.

---

### 10. Exercises

#### Question 1 (Predict the compile result)
Can `new UserService(new MockTestConnection())` compile?

#### Question 2 (Find and fix the bug)
Refactor `Notifier` to depend on an abstraction:
```typescript
class NotificationManager {
  private emailClient = new SmtpEmailClient();
  send(msg: string) { this.emailClient.send(msg); }
}
```

#### Question 3 (Write code from scratch)
Write an interface `PaymentGateway { charge(amount: number): boolean }`. Write a class `CheckoutService` that receives `PaymentGateway` via its constructor.

#### Question 4 (Explain in your own words)
Why is the Dependency Inversion Principle called "inversion"? What is being inverted?

---

### Solutions

#### Solution to Question 1
**Hint 1**: Does `MockTestConnection` implement `DatabaseConnection`?

**Answer**:
Yes, it compiles and runs cleanly.

#### Solution to Question 2
**Hint 1**: Define an interface and inject it.

**Answer**:
```typescript
interface EmailClient {
  send(msg: string): void;
}

class NotificationManager {
  constructor(private emailClient: EmailClient) {}
  send(msg: string) { this.emailClient.send(msg); }
}
```

#### Solution to Question 3
**Hint 1**: Accept `gateway: PaymentGateway`.

**Answer**:
```typescript
interface PaymentGateway {
  charge(amount: number): boolean;
}

class CheckoutService {
  constructor(private gateway: PaymentGateway) {}

  pay(amount: number): boolean {
    return this.gateway.charge(amount);
  }
}
```

#### Solution to Question 4
**Hint 1**: Think about the direction of dependency arrows.

**Answer**:
In traditional procedural design, high-level business policies directly depend on low-level technical utilities (high-level points to low-level). In Dependency Inversion, this direction is inverted: low-level utilities and high-level policies both depend on shared abstractions (interfaces). The control of dependencies is inverted from internal creation to external injection.

---

### 11. Recall

1. What does DIP stand for?
2. Should high-level modules depend on concrete classes or abstractions?
3. How are dependencies passed into classes in Dependency Injection?

**If you remember only one thing:**
Depend on interfaces, not concrete classes, and inject dependencies from the outside.

---

# Final Checkpoint Challenge: Topics 11 to 14

### Challenge Scenario
Build a fully decoupled, SOLID-compliant user notification architecture:

1. Define an interface `NotificationChannel`:
   - `send(recipient: string, message: string): boolean`
2. Create two implementations:
   - `EmailChannel implements NotificationChannel`
   - `SmsChannel implements NotificationChannel`
3. Write an interface `AuditLogger`:
   - `log(action: string): void`
4. Write a class `UserService`:
   - Inject `NotificationChannel` and `AuditLogger` via constructor (DIP).
   - Method `notifyUser(user: { phone: string; email: string }, msg: string)` sends the notification and logs the action (SRP).
5. Demonstrate swapping `EmailChannel` for `SmsChannel` without modifying `UserService` (OCP & LSP).

### Challenge Solution

```typescript
// 1. Abstractions:
interface NotificationChannel {
  send(recipient: string, message: string): boolean;
}

interface AuditLogger {
  log(action: string): void;
}

// 2. Concrete Channels:
class EmailChannel implements NotificationChannel {
  send(recipient: string, message: string): boolean {
    console.log(`[Email to ${recipient}]: ${message}`);
    return true;
  }
}

class SmsChannel implements NotificationChannel {
  send(recipient: string, message: string): boolean {
    console.log(`[SMS to ${recipient}]: ${message}`);
    return true;
  }
}

class ConsoleAuditLogger implements AuditLogger {
  log(action: string): void {
    console.log(`[Audit]: ${action}`);
  }
}

// 3 & 4. Decoupled Service:
class UserService {
  constructor(
    private channel: NotificationChannel,
    private logger: AuditLogger
  ) {}

  notifyUser(recipient: string, msg: string): void {
    const success = this.channel.send(recipient, msg);
    if (success) {
      this.logger.log(`Notification sent to ${recipient}`);
    }
  }
}

// 5. Interchangeable Channels:
const logger = new ConsoleAuditLogger();

// Email notification:
const emailService = new UserService(new EmailChannel(), logger);
emailService.notifyUser("alex@example.com", "Your order has shipped");

// SMS notification (zero code changes to UserService!):
const smsService = new UserService(new SmsChannel(), logger);
smsService.notifyUser("+15551234567", "Your verification code is 4242");
```
