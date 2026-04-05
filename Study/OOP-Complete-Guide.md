# Object-Oriented Programming — Complete Guide

> Covers everything: Core Pillars, SOLID Principles, Design Patterns, Relationships, and more — with TypeScript examples.

---

## Table of Contents

1. [What is OOP?](#1-what-is-oop)
2. [Classes & Objects](#2-classes--objects)
3. [Constructor](#3-constructor)
4. [The Four Pillars](#4-the-four-pillars)
   - [Encapsulation](#41-encapsulation)
   - [Abstraction](#42-abstraction)
   - [Inheritance](#43-inheritance)
   - [Polymorphism](#44-polymorphism)
5. [Access Modifiers](#5-access-modifiers)
6. [Interfaces](#6-interfaces)
7. [Abstract Classes](#7-abstract-classes)
8. [Interface vs Abstract Class](#8-interface-vs-abstract-class)
9. [Static Members](#9-static-members)
10. [Getters & Setters](#10-getters--setters)
11. [Composition vs Inheritance](#11-composition-vs-inheritance)
12. [SOLID Principles](#12-solid-principles)
    - [S — Single Responsibility](#s--single-responsibility-principle)
    - [O — Open/Closed](#o--openclosed-principle)
    - [L — Liskov Substitution](#l--liskov-substitution-principle)
    - [I — Interface Segregation](#i--interface-segregation-principle)
    - [D — Dependency Inversion](#d--dependency-inversion-principle)
13. [Relationships Between Classes](#13-relationships-between-classes)
    - [Association](#association)
    - [Aggregation](#aggregation)
    - [Composition](#composition)
    - [Dependency](#dependency)
14. [Design Patterns Overview](#14-design-patterns-overview)
    - [Creational Patterns](#creational-patterns)
    - [Structural Patterns](#structural-patterns)
    - [Behavioral Patterns](#behavioral-patterns)
15. [Common OOP Mistakes](#15-common-oop-mistakes)
16. [Quick Reference Cheat Sheet](#16-quick-reference-cheat-sheet)

---

## 1. What is OOP?

**Object-Oriented Programming (OOP)** is a programming paradigm that organizes code around **objects** — instances of **classes** — rather than functions and logic alone.

### Core Idea
Model real-world entities as objects that have:
- **State** → data stored in properties/fields
- **Behavior** → actions defined as methods

### Why OOP?
| Problem (Procedural) | Solution (OOP) |
|---|---|
| Global state everywhere | Encapsulated state inside objects |
| Hard to reuse code | Inheritance & composition |
| Rigid, hard to extend | Polymorphism & abstraction |
| Everything tightly coupled | Interfaces & dependency injection |

---

## 2. Classes & Objects

A **class** is a blueprint. An **object** is an instance created from that blueprint.

```typescript
// Class = blueprint
class Car {
  brand: string;
  speed: number;

  drive(): void {
    console.log(`${this.brand} is driving at ${this.speed} km/h`);
  }
}

// Object = instance of the class
const myCar = new Car();
myCar.brand = "Toyota";
myCar.speed = 120;
myCar.drive(); // Toyota is driving at 120 km/h

const anotherCar = new Car();
anotherCar.brand = "BMW";
anotherCar.speed = 200;
```

- `myCar` and `anotherCar` are two separate objects from the same class
- Each has its own copy of `brand` and `speed`

---

## 3. Constructor

A **constructor** is a special method that runs automatically when an object is created. Used to initialize properties.

```typescript
class Person {
  name: string;
  age: number;

  constructor(name: string, age: number) {
    this.name = name;
    this.age = age;
  }

  greet(): void {
    console.log(`Hi, I'm ${this.name}, age ${this.age}`);
  }
}

const p = new Person("Alice", 30);
p.greet(); // Hi, I'm Alice, age 30
```

### TypeScript Shorthand Constructor

```typescript
class Person {
  // Automatically creates and assigns properties
  constructor(
    public name: string,
    private age: number
  ) {}
}
```

---

## 4. The Four Pillars

---

### 4.1 Encapsulation

**Definition:** Bundling data (properties) and behavior (methods) together, and **hiding internal details** from the outside world.

**Goal:** Protect internal state. Only expose what is necessary.

```typescript
class BankAccount {
  private balance: number; // hidden from outside

  constructor(initialBalance: number) {
    this.balance = initialBalance;
  }

  deposit(amount: number): void {
    if (amount <= 0) throw new Error("Amount must be positive");
    this.balance += amount;
  }

  withdraw(amount: number): void {
    if (amount > this.balance) throw new Error("Insufficient funds");
    this.balance -= amount;
  }

  getBalance(): number {
    return this.balance; // controlled read access
  }
}

const account = new BankAccount(1000);
account.deposit(500);
account.withdraw(200);
console.log(account.getBalance()); // 1300

// account.balance = -99999; // ERROR — private, can't access directly
```

**Key Point:** The outside world interacts through a controlled interface, not raw data.

---

### 4.2 Abstraction

**Definition:** Hiding **how** something works internally, and only showing **what** it does.

**Goal:** Reduce complexity. Users of a class don't need to know implementation details.

```typescript
// User sees: start(), stop(), refuel()
// User does NOT see: internal engine mechanics, fuel injection logic

abstract class Vehicle {
  abstract start(): void;   // what — no implementation here
  abstract stop(): void;

  refuel(liters: number): void {
    // shared implementation — hidden complexity
    console.log(`Refueling ${liters} liters...`);
  }
}

class Motorcycle extends Vehicle {
  start(): void {
    // how it starts — hidden behind the abstract contract
    console.log("Motorcycle engine rumbles to life");
  }

  stop(): void {
    console.log("Motorcycle brakes applied");
  }
}

const bike = new Motorcycle();
bike.start();   // User just calls start() — doesn't care how
bike.refuel(5);
```

**Real-world analogy:** You press the TV remote's power button — you don't know (or care) about the infrared signal frequency it sends.

---

### 4.3 Inheritance

**Definition:** A class (**child/subclass**) acquires properties and methods from another class (**parent/superclass**).

**Goal:** Reuse code. Establish "is-a" relationships.

```typescript
class Animal {
  name: string;

  constructor(name: string) {
    this.name = name;
  }

  breathe(): void {
    console.log(`${this.name} is breathing`);
  }

  eat(): void {
    console.log(`${this.name} is eating`);
  }
}

class Dog extends Animal {
  breed: string;

  constructor(name: string, breed: string) {
    super(name); // call parent constructor
    this.breed = breed;
  }

  bark(): void {
    console.log(`${this.name} barks!`);
  }
}

class Cat extends Animal {
  meow(): void {
    console.log(`${this.name} meows!`);
  }
}

const dog = new Dog("Rex", "Labrador");
dog.breathe(); // inherited from Animal
dog.eat();     // inherited from Animal
dog.bark();    // own method

const cat = new Cat("Whiskers");
cat.eat();     // inherited
cat.meow();    // own method
```

### `super` keyword

- `super()` — calls the parent constructor
- `super.methodName()` — calls a parent method from child

```typescript
class Employee extends Person {
  company: string;

  constructor(name: string, age: number, company: string) {
    super(name, age); // must call super first
    this.company = company;
  }

  greet(): void {
    super.greet(); // call parent greet
    console.log(`I work at ${this.company}`);
  }
}
```

---

### 4.4 Polymorphism

**Definition:** The ability of different classes to be treated as the same type, while each behaves differently.

**"Poly" = many, "morph" = forms** — many forms of the same method.

#### Method Overriding (Runtime Polymorphism)

```typescript
class Shape {
  area(): number {
    return 0;
  }

  describe(): void {
    console.log(`This shape has area: ${this.area()}`);
  }
}

class Circle extends Shape {
  constructor(private radius: number) {
    super();
  }

  area(): number {
    return Math.PI * this.radius * this.radius; // overrides parent
  }
}

class Rectangle extends Shape {
  constructor(private width: number, private height: number) {
    super();
  }

  area(): number {
    return this.width * this.height; // overrides parent
  }
}

class Triangle extends Shape {
  constructor(private base: number, private height: number) {
    super();
  }

  area(): number {
    return 0.5 * this.base * this.height;
  }
}

// Polymorphism in action — same interface, different behavior
const shapes: Shape[] = [
  new Circle(5),
  new Rectangle(4, 6),
  new Triangle(3, 8),
];

shapes.forEach(shape => shape.describe());
// This shape has area: 78.53...
// This shape has area: 24
// This shape has area: 12
```

#### Method Overloading (Compile-time Polymorphism)

```typescript
class Calculator {
  add(a: number, b: number): number;
  add(a: string, b: string): string;
  add(a: any, b: any): any {
    return a + b;
  }
}

const calc = new Calculator();
calc.add(1, 2);       // 3
calc.add("Hi", " !"); // "Hi !"
```

---

## 5. Access Modifiers

Control **who** can access class members.

| Modifier | Class Itself | Subclass | Outside |
|---|---|---|---|
| `public` | Yes | Yes | Yes |
| `protected` | Yes | Yes | No |
| `private` | Yes | No | No |

```typescript
class Employee {
  public name: string;         // anyone can access
  protected salary: number;    // only this class & subclasses
  private ssn: string;         // only this class

  constructor(name: string, salary: number, ssn: string) {
    this.name = name;
    this.salary = salary;
    this.ssn = ssn;
  }
}

class Manager extends Employee {
  showSalary(): void {
    console.log(this.salary); // OK — protected
    // console.log(this.ssn); // ERROR — private
  }
}

const emp = new Employee("Alice", 5000, "123-45-6789");
console.log(emp.name);   // OK — public
// emp.salary             // ERROR — protected
// emp.ssn                // ERROR — private
```

---

## 6. Interfaces

An **interface** defines a **contract** — a set of properties and methods a class must implement. No implementation, only the shape.

```typescript
interface Printable {
  print(): void;
}

interface Saveable {
  save(): void;
}

// A class can implement multiple interfaces
class Document implements Printable, Saveable {
  constructor(private content: string) {}

  print(): void {
    console.log(`Printing: ${this.content}`);
  }

  save(): void {
    console.log(`Saving: ${this.content}`);
  }
}

const doc = new Document("Hello World");
doc.print();
doc.save();
```

### Interface for Object Shape

```typescript
interface User {
  id: string;
  name: string;
  email: string;
  role?: string; // optional
}

function greetUser(user: User): void {
  console.log(`Hello, ${user.name}`);
}
```

### Interface Extending Interface

```typescript
interface Animal {
  name: string;
  eat(): void;
}

interface Pet extends Animal {
  owner: string;
  cuddle(): void;
}

class Dog implements Pet {
  constructor(
    public name: string,
    public owner: string
  ) {}

  eat(): void { console.log(`${this.name} eats`); }
  cuddle(): void { console.log(`${this.name} cuddles with ${this.owner}`); }
}
```

---

## 7. Abstract Classes

An **abstract class** sits between a regular class and an interface:
- Can have **abstract methods** (no implementation — must be overridden)
- Can have **concrete methods** (with implementation — shared logic)
- **Cannot be instantiated directly**

```typescript
abstract class Notification {
  // Concrete method — shared for all notifications
  send(message: string): void {
    const formatted = this.format(message); // uses abstract method
    this.deliver(formatted);
  }

  // Abstract methods — subclass must implement
  abstract format(message: string): string;
  abstract deliver(message: string): void;
}

class EmailNotification extends Notification {
  format(message: string): string {
    return `<html><body>${message}</body></html>`;
  }

  deliver(message: string): void {
    console.log(`Sending email: ${message}`);
  }
}

class SMSNotification extends Notification {
  format(message: string): string {
    return message.substring(0, 160); // SMS limit
  }

  deliver(message: string): void {
    console.log(`Sending SMS: ${message}`);
  }
}

// const n = new Notification(); // ERROR — cannot instantiate abstract class

const email = new EmailNotification();
email.send("Your order has been placed!");

const sms = new SMSNotification();
sms.send("Order confirmed");
```

---

## 8. Interface vs Abstract Class

| Feature | Interface | Abstract Class |
|---|---|---|
| Implementation | No | Yes (partial) |
| Multiple inheritance | Yes (implements many) | No (extends one) |
| Constructor | No | Yes |
| Access modifiers | No (all public) | Yes |
| Fields with values | No | Yes |
| When to use | Define a contract/shape | Share common logic + enforce contract |

**Rule of thumb:**
- Use **interface** when you only need to define a shape/contract
- Use **abstract class** when you want to share implementation + enforce a contract

---

## 9. Static Members

**Static** members belong to the **class itself**, not to instances.

```typescript
class MathHelper {
  static PI = 3.14159;

  static circleArea(radius: number): number {
    return MathHelper.PI * radius * radius;
  }
}

// No need to create an instance
console.log(MathHelper.PI);               // 3.14159
console.log(MathHelper.circleArea(5));    // 78.53...
```

### Singleton Pattern (uses static)

```typescript
class DatabaseConnection {
  private static instance: DatabaseConnection;

  private constructor() {
    // private — can't do new DatabaseConnection() outside
    console.log("DB connected");
  }

  static getInstance(): DatabaseConnection {
    if (!DatabaseConnection.instance) {
      DatabaseConnection.instance = new DatabaseConnection();
    }
    return DatabaseConnection.instance;
  }

  query(sql: string): void {
    console.log(`Running: ${sql}`);
  }
}

const db1 = DatabaseConnection.getInstance();
const db2 = DatabaseConnection.getInstance();
console.log(db1 === db2); // true — same instance
```

---

## 10. Getters & Setters

Provide **controlled access** to private properties with custom logic.

```typescript
class Temperature {
  private _celsius: number;

  constructor(celsius: number) {
    this._celsius = celsius;
  }

  // Getter
  get fahrenheit(): number {
    return (this._celsius * 9) / 5 + 32;
  }

  // Getter
  get celsius(): number {
    return this._celsius;
  }

  // Setter with validation
  set celsius(value: number) {
    if (value < -273.15) throw new Error("Below absolute zero!");
    this._celsius = value;
  }
}

const temp = new Temperature(100);
console.log(temp.fahrenheit); // 212
console.log(temp.celsius);    // 100

temp.celsius = 25;            // uses setter
console.log(temp.fahrenheit); // 77

// temp.celsius = -300;       // throws error
```

---

## 11. Composition vs Inheritance

**Inheritance** = "is-a" relationship → `Dog is an Animal`
**Composition** = "has-a" relationship → `Car has an Engine`

> **Prefer composition over inheritance** — it's more flexible and avoids deep, brittle inheritance chains.

### Problem with Deep Inheritance

```typescript
// Fragile hierarchy — what if FlyingFish needs both?
class Animal {}
class FlyingAnimal extends Animal {}
class SwimmingAnimal extends Animal {}
// class FlyingFish extends ??? — can't extend both!
```

### Composition Solution

```typescript
// Behaviors as separate classes
class FlyBehavior {
  fly(): void {
    console.log("Flying through the sky");
  }
}

class SwimBehavior {
  swim(): void {
    console.log("Swimming through water");
  }
}

// Compose behaviors as needed
class FlyingFish {
  private flyBehavior = new FlyBehavior();
  private swimBehavior = new SwimBehavior();

  fly(): void { this.flyBehavior.fly(); }
  swim(): void { this.swimBehavior.swim(); }
}

class Eagle {
  private flyBehavior = new FlyBehavior();
  fly(): void { this.flyBehavior.fly(); }
}
```

---

## 12. SOLID Principles

**SOLID** is a set of 5 principles for writing maintainable, scalable OOP code.

---

### S — Single Responsibility Principle

> **"A class should have only one reason to change."**

Each class should do **one thing** and do it well.

```typescript
// BAD — too many responsibilities
class OrderService {
  placeOrder(order: any) { /* ... */ }
  sendEmailConfirmation(order: any) { /* ... */ } // email logic here?
  generateInvoicePDF(order: any) { /* ... */ }    // PDF logic here?
  saveToDatabase(order: any) { /* ... */ }        // DB logic here?
}

// GOOD — each class has one responsibility
class OrderService {
  placeOrder(order: any) { /* only order logic */ }
}

class EmailService {
  sendConfirmation(order: any) { /* only email logic */ }
}

class InvoiceService {
  generatePDF(order: any) { /* only PDF logic */ }
}

class OrderRepository {
  save(order: any) { /* only DB logic */ }
}
```

---

### O — Open/Closed Principle

> **"Open for extension, closed for modification."**

You should be able to add new behavior **without changing existing code**.

```typescript
// BAD — every new discount type requires modifying this class
class DiscountCalculator {
  calculate(type: string, price: number): number {
    if (type === "seasonal") return price * 0.9;
    if (type === "loyalty")  return price * 0.85;
    if (type === "newuser")  return price * 0.8;
    // adding more means editing this file — violates OCP
    return price;
  }
}

// GOOD — extend by adding new classes, not modifying existing ones
interface DiscountStrategy {
  apply(price: number): number;
}

class SeasonalDiscount implements DiscountStrategy {
  apply(price: number): number { return price * 0.9; }
}

class LoyaltyDiscount implements DiscountStrategy {
  apply(price: number): number { return price * 0.85; }
}

class NewUserDiscount implements DiscountStrategy {
  apply(price: number): number { return price * 0.8; }
}

class DiscountCalculator {
  constructor(private strategy: DiscountStrategy) {}

  calculate(price: number): number {
    return this.strategy.apply(price);
  }
}

// Adding new discount = new class, no existing code touched
const calc = new DiscountCalculator(new LoyaltyDiscount());
calc.calculate(100); // 85
```

---

### L — Liskov Substitution Principle

> **"Subclasses should be substitutable for their parent class without breaking the program."**

If `S` extends `T`, you should be able to use `S` wherever `T` is expected — without unexpected behavior.

```typescript
// BAD — Square breaks Rectangle's contract
class Rectangle {
  constructor(protected width: number, protected height: number) {}

  setWidth(w: number): void { this.width = w; }
  setHeight(h: number): void { this.height = h; }

  area(): number { return this.width * this.height; }
}

class Square extends Rectangle {
  setWidth(w: number): void {
    this.width = w;
    this.height = w; // forces height to match — breaks LSP!
  }

  setHeight(h: number): void {
    this.width = h;
    this.height = h;
  }
}

// This breaks with Square — width and height behave unexpectedly
function testRectangle(rect: Rectangle): void {
  rect.setWidth(5);
  rect.setHeight(10);
  console.log(rect.area()); // expects 50, but Square gives 100!
}

// GOOD — model them independently
interface Shape {
  area(): number;
}

class Rectangle implements Shape {
  constructor(private width: number, private height: number) {}
  area(): number { return this.width * this.height; }
}

class Square implements Shape {
  constructor(private side: number) {}
  area(): number { return this.side * this.side; }
}
```

---

### I — Interface Segregation Principle

> **"Clients should not be forced to depend on interfaces they don't use."**

Split large interfaces into smaller, focused ones.

```typescript
// BAD — one fat interface forces all classes to implement irrelevant methods
interface Worker {
  work(): void;
  eat(): void;
  sleep(): void;
}

class Robot implements Worker {
  work(): void { console.log("Robot working"); }
  eat(): void { /* robots don't eat — forced to implement anyway */ }
  sleep(): void { /* robots don't sleep — forced to implement anyway */ }
}

// GOOD — split into focused interfaces
interface Workable {
  work(): void;
}

interface Eatable {
  eat(): void;
}

interface Sleepable {
  sleep(): void;
}

class Human implements Workable, Eatable, Sleepable {
  work(): void { console.log("Human working"); }
  eat(): void { console.log("Human eating"); }
  sleep(): void { console.log("Human sleeping"); }
}

class Robot implements Workable {
  work(): void { console.log("Robot working"); }
  // Only implements what it needs
}
```

---

### D — Dependency Inversion Principle

> **"High-level modules should not depend on low-level modules. Both should depend on abstractions."**

Depend on **interfaces**, not concrete implementations.

```typescript
// BAD — high-level service directly depends on low-level MySQL class
class MySQLDatabase {
  save(data: any): void {
    console.log("Saving to MySQL...");
  }
}

class UserService {
  private db = new MySQLDatabase(); // tightly coupled — can't swap DB easily

  createUser(user: any): void {
    this.db.save(user);
  }
}

// GOOD — both depend on an abstraction (interface)
interface Database {
  save(data: any): void;
  findById(id: string): any;
}

class MySQLDatabase implements Database {
  save(data: any): void { console.log("Saving to MySQL"); }
  findById(id: string): any { return {}; }
}

class MongoDatabase implements Database {
  save(data: any): void { console.log("Saving to MongoDB"); }
  findById(id: string): any { return {}; }
}

class UserService {
  constructor(private db: Database) {} // depends on abstraction

  createUser(user: any): void {
    this.db.save(user);
  }
}

// Swap DB without touching UserService
const mysqlService = new UserService(new MySQLDatabase());
const mongoService = new UserService(new MongoDatabase());
```

---

## 13. Relationships Between Classes

---

### Association

A general "uses-a" relationship. Objects are independent.

```typescript
class Teacher {
  name: string;
  constructor(name: string) { this.name = name; }
}

class Student {
  name: string;
  constructor(name: string) { this.name = name; }

  learnFrom(teacher: Teacher): void {
    console.log(`${this.name} learns from ${teacher.name}`);
  }
}

// Student uses Teacher, but neither owns the other
const teacher = new Teacher("Mr. Smith");
const student = new Student("Alice");
student.learnFrom(teacher);
```

---

### Aggregation

"Has-a" relationship — child can **exist independently** of the parent.

```typescript
class Department {
  name: string;
  constructor(name: string) { this.name = name; }
}

class University {
  departments: Department[];

  constructor(departments: Department[]) {
    this.departments = departments;
  }
}

// Department exists independently — if University closes, Department still exists
const cs = new Department("Computer Science");
const math = new Department("Mathematics");
const uni = new University([cs, math]);
```

---

### Composition

Strong "has-a" relationship — child **cannot exist** without the parent.

```typescript
class Engine {
  start(): void { console.log("Engine started"); }
}

class Car {
  private engine: Engine;

  constructor() {
    this.engine = new Engine(); // Car creates Engine — Engine dies with Car
  }

  drive(): void {
    this.engine.start();
    console.log("Car is driving");
  }
}

// Engine is created inside Car and doesn't exist independently
const car = new Car();
car.drive();
```

---

### Dependency

A class **uses** another class temporarily (as a method parameter or local variable).

```typescript
class Logger {
  log(message: string): void {
    console.log(`[LOG]: ${message}`);
  }
}

class OrderService {
  // Logger is used temporarily inside a method — not stored
  processOrder(orderId: string, logger: Logger): void {
    logger.log(`Processing order ${orderId}`);
  }
}
```

---

### Summary of Relationships

| Relationship | Keyword | Lifetime | Example |
|---|---|---|---|
| Association | uses-a | Independent | Student uses Teacher |
| Aggregation | has-a (weak) | Child survives parent | University has Departments |
| Composition | has-a (strong) | Child dies with parent | Car has Engine |
| Dependency | depends-on | Temporary | Method parameter |

---

## 14. Design Patterns Overview

Design patterns are reusable solutions to common OOP problems.

---

### Creational Patterns

> How objects are **created**.

#### Singleton — One instance only

```typescript
class Config {
  private static instance: Config;
  private settings: Record<string, string> = {};

  private constructor() {}

  static getInstance(): Config {
    if (!Config.instance) Config.instance = new Config();
    return Config.instance;
  }

  set(key: string, value: string): void { this.settings[key] = value; }
  get(key: string): string { return this.settings[key]; }
}
```

#### Factory — Delegate object creation

```typescript
interface Button {
  render(): void;
}

class WindowsButton implements Button {
  render(): void { console.log("Rendering Windows button"); }
}

class MacButton implements Button {
  render(): void { console.log("Rendering Mac button"); }
}

class ButtonFactory {
  static create(os: "windows" | "mac"): Button {
    if (os === "windows") return new WindowsButton();
    return new MacButton();
  }
}

const btn = ButtonFactory.create("mac");
btn.render();
```

#### Builder — Step-by-step object construction

```typescript
class QueryBuilder {
  private table = "";
  private conditions: string[] = [];
  private limitVal?: number;

  from(table: string): this {
    this.table = table;
    return this;
  }

  where(condition: string): this {
    this.conditions.push(condition);
    return this;
  }

  limit(n: number): this {
    this.limitVal = n;
    return this;
  }

  build(): string {
    let query = `SELECT * FROM ${this.table}`;
    if (this.conditions.length) query += ` WHERE ${this.conditions.join(" AND ")}`;
    if (this.limitVal) query += ` LIMIT ${this.limitVal}`;
    return query;
  }
}

const query = new QueryBuilder()
  .from("users")
  .where("age > 18")
  .where("active = true")
  .limit(10)
  .build();

console.log(query);
// SELECT * FROM users WHERE age > 18 AND active = true LIMIT 10
```

---

### Structural Patterns

> How classes are **composed/structured**.

#### Adapter — Make incompatible interfaces work together

```typescript
// Old interface
class OldLogger {
  writeLog(msg: string): void {
    console.log(`[OLD LOG]: ${msg}`);
  }
}

// New interface your system expects
interface Logger {
  log(msg: string): void;
}

// Adapter makes OldLogger compatible with Logger interface
class LoggerAdapter implements Logger {
  constructor(private oldLogger: OldLogger) {}

  log(msg: string): void {
    this.oldLogger.writeLog(msg); // delegates to old interface
  }
}

const adapter = new LoggerAdapter(new OldLogger());
adapter.log("Something happened");
```

#### Decorator — Add behavior without modifying the class

```typescript
interface Coffee {
  cost(): number;
  description(): string;
}

class SimpleCoffee implements Coffee {
  cost(): number { return 5; }
  description(): string { return "Simple coffee"; }
}

class MilkDecorator implements Coffee {
  constructor(private coffee: Coffee) {}
  cost(): number { return this.coffee.cost() + 2; }
  description(): string { return this.coffee.description() + ", milk"; }
}

class SugarDecorator implements Coffee {
  constructor(private coffee: Coffee) {}
  cost(): number { return this.coffee.cost() + 1; }
  description(): string { return this.coffee.description() + ", sugar"; }
}

let coffee: Coffee = new SimpleCoffee();
coffee = new MilkDecorator(coffee);
coffee = new SugarDecorator(coffee);

console.log(coffee.description()); // Simple coffee, milk, sugar
console.log(coffee.cost());        // 8
```

---

### Behavioral Patterns

> How objects **communicate and behave**.

#### Strategy — Swap algorithms at runtime

```typescript
interface SortStrategy {
  sort(data: number[]): number[];
}

class BubbleSort implements SortStrategy {
  sort(data: number[]): number[] {
    console.log("Bubble sorting...");
    return [...data].sort((a, b) => a - b);
  }
}

class QuickSort implements SortStrategy {
  sort(data: number[]): number[] {
    console.log("Quick sorting...");
    return [...data].sort((a, b) => a - b);
  }
}

class Sorter {
  constructor(private strategy: SortStrategy) {}

  setStrategy(strategy: SortStrategy): void {
    this.strategy = strategy;
  }

  sort(data: number[]): number[] {
    return this.strategy.sort(data);
  }
}

const sorter = new Sorter(new BubbleSort());
sorter.sort([3, 1, 4, 1, 5]);

sorter.setStrategy(new QuickSort()); // swap at runtime
sorter.sort([3, 1, 4, 1, 5]);
```

#### Observer — Notify multiple objects of events

```typescript
interface Observer {
  update(event: string): void;
}

class EventEmitter {
  private observers: Observer[] = [];

  subscribe(observer: Observer): void {
    this.observers.push(observer);
  }

  unsubscribe(observer: Observer): void {
    this.observers = this.observers.filter(o => o !== observer);
  }

  notify(event: string): void {
    this.observers.forEach(o => o.update(event));
  }
}

class EmailAlert implements Observer {
  update(event: string): void {
    console.log(`Email alert: ${event}`);
  }
}

class SMSAlert implements Observer {
  update(event: string): void {
    console.log(`SMS alert: ${event}`);
  }
}

const emitter = new EventEmitter();
emitter.subscribe(new EmailAlert());
emitter.subscribe(new SMSAlert());
emitter.notify("Order placed!"); // both get notified
```

---

## 15. Common OOP Mistakes

| Mistake | Problem | Fix |
|---|---|---|
| God Class | One class does everything | Apply SRP — split responsibilities |
| Deep inheritance (5+ levels) | Brittle, hard to follow | Use composition instead |
| Exposing all properties as public | Breaks encapsulation | Use private + getters/setters |
| Concrete dependencies everywhere | Hard to test/swap | Depend on interfaces (DIP) |
| Fat interfaces | Forces unused method implementations | Apply ISP — smaller interfaces |
| Premature abstraction | Over-engineering | Only abstract when there's a real need |
| No separation of concerns | Everything mixed together | Apply layered architecture |

---

## 16. Quick Reference Cheat Sheet

```
CLASS         → Blueprint for objects
OBJECT        → Instance of a class
CONSTRUCTOR   → Initializes object on creation

ENCAPSULATION → Hide state, expose controlled interface
ABSTRACTION   → Hide HOW, show WHAT
INHERITANCE   → Child inherits parent (is-a)
POLYMORPHISM  → Same interface, different behavior

public        → Accessible everywhere
protected     → Class + subclasses only
private       → Class only

interface     → Contract (no implementation)
abstract      → Partial implementation + contract
static        → Belongs to class, not instance

SOLID:
  S → One class, one reason to change
  O → Extend without modifying
  L → Subclass must honor parent's contract
  I → Small focused interfaces
  D → Depend on abstractions, not concretions

Relationships:
  Association  → uses-a (independent)
  Aggregation  → has-a (child survives)
  Composition  → has-a (child dies with parent)
  Dependency   → temporary use

Patterns:
  Singleton  → One instance
  Factory    → Delegate creation
  Builder    → Step-by-step construction
  Adapter    → Bridge incompatible interfaces
  Decorator  → Add behavior dynamically
  Strategy   → Swap algorithms at runtime
  Observer   → Notify multiple listeners
```

---

*End of OOP Complete Guide*
