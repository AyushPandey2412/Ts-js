# TypeScript — Complete Interview Preparation
> Theory Q&A + Coding Round Problems + Real Scenarios
> Covers: Junior → Senior level

---

# TABLE OF CONTENTS

1. [Core Concepts — Theory Questions](#1-core-concepts--theory-questions)
2. [Types vs Interfaces](#2-types-vs-interfaces)
3. [Generics](#3-generics)
4. [Utility Types](#4-utility-types)
5. [Advanced Types](#5-advanced-types)
6. [Classes & Access Modifiers](#6-classes--access-modifiers)
7. [Decorators](#7-decorators)
8. [Type Guards & Narrowing](#8-type-guards--narrowing)
9. [Modules & Declaration Files](#9-modules--declaration-files)
10. [TypeScript with React](#10-typescript-with-react)
11. [Coding Round Problems](#11-coding-round-problems)
12. [Output & Error Questions](#12-output--error-questions)
13. [Configuration](#13-configuration)

---

# 1. CORE CONCEPTS — THEORY QUESTIONS

---

## Q: What is TypeScript? Why use it over JavaScript?

TypeScript is a **statically typed superset of JavaScript** developed by Microsoft. It compiles down to plain JavaScript.

**Why TypeScript:**
```ts
// JavaScript — error found at RUNTIME (when user is using the app)
function getUser(id) {
  return fetch(`/api/users/${id}`)
}
getUser()  // No error shown — but crashes at runtime

// TypeScript — error found at COMPILE TIME (before shipping)
function getUser(id: number): Promise<User> {
  return fetch(`/api/users/${id}`).then(r => r.json())
}
getUser()  // ERROR: Expected 1 argument, but got 0.
```

**Benefits:**
- Catch bugs before runtime
- Better IDE autocomplete and refactoring
- Self-documenting code (types = documentation)
- Safer refactoring of large codebases
- Easier team collaboration

---

## Q: What is the difference between a type annotation and type inference?

```ts
// Type Annotation — you explicitly tell TypeScript the type
let name: string = 'John'
let age:  number = 25

function add(a: number, b: number): number {
  return a + b
}

// Type Inference — TypeScript figures out the type automatically
let name = 'John'   // inferred as string
let age  = 25       // inferred as number

const add = (a: number, b: number) => a + b
// return type inferred as number

// RULE: Let TypeScript infer when it's obvious.
//       Annotate when the type is not obvious or for public APIs.
let data = fetchData()  // annotate this — not obvious what it returns
```

---

## Q: What is 'any' type? Why is it bad?

```ts
// any — disables all type checking for that variable
let data: any = 'hello'
data = 42         // OK
data = {}         // OK
data.foo.bar.baz  // NO ERROR — but crashes at runtime!
data()            // NO ERROR — but crashes at runtime!

// Why it's bad:
// You lose ALL benefits of TypeScript
// Errors are pushed back to runtime

// BETTER ALTERNATIVES:

// unknown — type-safe alternative to any
let input: unknown = getUserInput()
input.toUpperCase()  // ERROR — must check type first
if (typeof input === 'string') {
  input.toUpperCase()  // OK — TypeScript knows it's string here
}

// Generics — when you need flexibility with type safety
function identity<T>(value: T): T {
  return value
}
```

---

## Q: What is the difference between unknown, never, void, and any?

```ts
// any — no type checking, avoid
let x: any = 'hello'
x.anything()  // no error (dangerous)

// unknown — type-safe any, must narrow before use
let y: unknown = 'hello'
// y.toUpperCase()  // ERROR — must check first
if (typeof y === 'string') y.toUpperCase()  // OK

// void — function returns nothing (or undefined)
function logMessage(msg: string): void {
  console.log(msg)
  // no return statement (or return undefined)
}

// never — function NEVER returns (throws or infinite loop)
function throwError(msg: string): never {
  throw new Error(msg)  // always throws
}

function infiniteLoop(): never {
  while (true) {}
}

// never in exhaustive checks
type Shape = 'circle' | 'square' | 'triangle'
function getArea(shape: Shape): number {
  switch (shape) {
    case 'circle':   return Math.PI * 10 * 10
    case 'square':   return 10 * 10
    case 'triangle': return 0.5 * 10 * 10
    default:
      const exhaustiveCheck: never = shape  // ERROR if a case is missed
      throw new Error(`Unknown shape: ${exhaustiveCheck}`)
  }
}
```

---

## Q: What are literal types?

```ts
// Specific values as types (not just 'string' or 'number')
type Direction = 'north' | 'south' | 'east' | 'west'
type DiceRoll  = 1 | 2 | 3 | 4 | 5 | 6
type Enabled   = true  // only the value true

// Template literal types (TS 4.1+)
type EventName = 'click' | 'focus' | 'blur'
type HandlerName = `on${Capitalize<EventName>}`
// 'onClick' | 'onFocus' | 'onBlur'

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE'
type ApiRoute = `/api/${string}`

// Const assertion — infer literal types from object
const config = {
  endpoint: '/api',
  method: 'GET'
} as const
// config.method is 'GET', not string
type Method = typeof config.method  // 'GET'
```

---

# 2. TYPES VS INTERFACES

---

## Q: What is the difference between type and interface?

```ts
// INTERFACE — for object shapes, can be extended/merged
interface User {
  id:    number
  name:  string
  email: string
}

// Declaration merging — interfaces can be declared twice
interface User {
  role: string  // merged into the same User interface
}
// User now has: id, name, email, role

// Interface extension
interface AdminUser extends User {
  permissions: string[]
}

// Multiple extension
interface SuperAdmin extends AdminUser, Timestamped {
  level: number
}

// ---

// TYPE — for aliases, unions, intersections, primitives, tuples
type ID = string | number
type Callback = (error: Error | null, data?: any) => void
type Point = [number, number]
type Status = 'active' | 'inactive'

// Type intersection (similar to extends)
type AdminUser = User & { permissions: string[] }

// Type CANNOT be merged (unlike interface)
type User = { id: number }
// type User = { name: string }  // ERROR: Duplicate identifier

// WHEN TO USE:
// Interface → object shapes, classes, public APIs, when you might extend
// Type      → unions, intersections, primitives, tuples, computed types
```

---

## Q: Can a class implement a type alias?

```ts
// YES — class can implement both interface and type alias
type Serializable = {
  serialize():   string
  deserialize(s: string): void
}

interface Printable {
  print(): void
}

class Document implements Serializable, Printable {
  private content: string = ''

  serialize() { return this.content }
  deserialize(s: string) { this.content = s }
  print() { console.log(this.content) }
}
```

---

# 3. GENERICS

---

## Q: What are generics? Why are they useful?

```ts
// Without generics — you'd duplicate code for each type
function getFirstNumber(arr: number[]): number { return arr[0] }
function getFirstString(arr: string[]): string { return arr[0] }

// With generics — one function, works with any type
function getFirst<T>(arr: T[]): T {
  return arr[0]
}

// TypeScript infers T from usage
getFirst([1, 2, 3])         // T = number, returns number
getFirst(['a', 'b', 'c'])   // T = string, returns string
getFirst<boolean>([true])   // T explicitly set to boolean
```

---

## Q: What are generic constraints?

```ts
// Without constraints — T can be ANYTHING
function getProperty<T>(obj: T, key: string) {
  return obj[key]  // ERROR — TypeScript doesn't know if key exists
}

// With constraints — T must have specific shape
function getProperty<T, K extends keyof T>(obj: T, key: K): T[K] {
  return obj[key]  // OK — K is guaranteed to be a key of T
}

const user = { id: 1, name: 'John', age: 25 }
getProperty(user, 'name')    // 'John' — typed as string
getProperty(user, 'id')      // 1 — typed as number
// getProperty(user, 'foo') // ERROR — 'foo' is not a key of user


// Constrain to objects with specific property
function merge<T extends object, U extends object>(obj1: T, obj2: U): T & U {
  return { ...obj1, ...obj2 }
}

// Constrain to objects with length property
function getLength<T extends { length: number }>(item: T): number {
  return item.length
}
getLength('hello')     // 5 — string has .length
getLength([1, 2, 3])   // 3 — array has .length
getLength({ length: 10 })  // 10 — object with length
// getLength(42)        // ERROR — number has no .length
```

---

## Q: Show real-world generic patterns.

```ts
// 1. Generic API response wrapper
interface ApiResponse<T> {
  data:    T
  status:  number
  message: string
  errors?: string[]
}

type UserResponse   = ApiResponse<User>
type OrderResponse  = ApiResponse<Order[]>

async function fetchUsers(): Promise<ApiResponse<User[]>> {
  const res = await fetch('/api/users')
  return res.json()
}


// 2. Generic repository pattern
interface Repository<T, ID = number> {
  findById(id: ID):          Promise<T | null>
  findAll():                 Promise<T[]>
  create(data: Omit<T, 'id'>): Promise<T>
  update(id: ID, data: Partial<T>): Promise<T>
  delete(id: ID):            Promise<void>
}

class UserRepository implements Repository<User> {
  async findById(id: number) { ... }
  async findAll() { ... }
  async create(data: Omit<User, 'id'>) { ... }
  async update(id: number, data: Partial<User>) { ... }
  async delete(id: number) { ... }
}


// 3. Generic hook
function useLocalStorage<T>(key: string, initialValue: T) {
  const [value, setValue] = useState<T>(() => {
    try {
      const item = localStorage.getItem(key)
      return item ? JSON.parse(item) : initialValue
    } catch {
      return initialValue
    }
  })

  const setStoredValue = (newValue: T) => {
    setValue(newValue)
    localStorage.setItem(key, JSON.stringify(newValue))
  }

  return [value, setStoredValue] as const
}

// Usage — fully typed
const [user, setUser] = useLocalStorage<User>('user', defaultUser)
const [theme, setTheme] = useLocalStorage<'light' | 'dark'>('theme', 'light')


// 4. Generic event emitter
class TypedEventEmitter<Events extends Record<string, any>> {
  private listeners: Partial<{
    [K in keyof Events]: Array<(data: Events[K]) => void>
  }> = {}

  on<K extends keyof Events>(event: K, listener: (data: Events[K]) => void) {
    if (!this.listeners[event]) this.listeners[event] = []
    this.listeners[event]!.push(listener)
  }

  emit<K extends keyof Events>(event: K, data: Events[K]) {
    this.listeners[event]?.forEach(l => l(data))
  }
}

// Usage — type-safe events
type AppEvents = {
  'user:login':  { userId: number; timestamp: Date }
  'order:create': { orderId: string; amount: number }
  'error':       { message: string; code: number }
}

const emitter = new TypedEventEmitter<AppEvents>()
emitter.on('user:login', (data) => {
  console.log(data.userId)    // typed as number
  console.log(data.timestamp) // typed as Date
})
emitter.emit('user:login', { userId: 1, timestamp: new Date() })
// emitter.emit('user:login', { wrong: 'data' })  // ERROR
```

---

# 4. UTILITY TYPES

---

## Q: Explain all built-in utility types with use cases.

```ts
interface User {
  id:        number
  name:      string
  email:     string
  password:  string
  role:      'admin' | 'user' | 'guest'
  createdAt: Date
  updatedAt: Date
}

// ─────────────────────────────────────────────────────────────────
// Partial<T> — all properties optional
// USE CASE: Update endpoints where you only send changed fields
type UserUpdate = Partial<User>
// { id?: number; name?: string; email?: string; ... }

function updateUser(id: number, updates: Partial<User>): User { ... }
updateUser(1, { name: 'New Name' })  // only name — valid


// ─────────────────────────────────────────────────────────────────
// Required<T> — all properties required (opposite of Partial)
// USE CASE: After validation, ensure all fields are present
type CompleteUser = Required<User>


// ─────────────────────────────────────────────────────────────────
// Readonly<T> — all properties readonly
// USE CASE: Immutable configuration, constants
type ImmutableUser = Readonly<User>
const user: ImmutableUser = { ...userData }
// user.name = 'Jane'  // ERROR: Cannot assign to 'name' because it is read-only


// ─────────────────────────────────────────────────────────────────
// Pick<T, Keys> — keep only specified properties
// USE CASE: Public API response — strip sensitive fields
type PublicUser    = Pick<User, 'id' | 'name' | 'role'>
type LoginInput    = Pick<User, 'email' | 'password'>
type UserSummary   = Pick<User, 'id' | 'name' | 'email'>


// ─────────────────────────────────────────────────────────────────
// Omit<T, Keys> — remove specified properties
// USE CASE: Create/Insert types without auto-generated fields
type CreateUserInput = Omit<User, 'id' | 'createdAt' | 'updatedAt'>
type SafeUser        = Omit<User, 'password'>
type UserWithoutMeta = Omit<User, 'createdAt' | 'updatedAt'>


// ─────────────────────────────────────────────────────────────────
// Record<Keys, Type> — object with specific keys and value type
// USE CASE: Maps, lookups, dictionaries

type RolePermissions = Record<'admin' | 'user' | 'guest', string[]>
const permissions: RolePermissions = {
  admin: ['read', 'write', 'delete'],
  user:  ['read', 'write'],
  guest: ['read']
}

type UserById  = Record<number, User>
type CacheEntry = Record<string, { value: any; expiry: number }>


// ─────────────────────────────────────────────────────────────────
// Exclude<T, U> — remove types from a union
type AllRoles    = 'admin' | 'user' | 'guest' | 'superadmin'
type PublicRoles = Exclude<AllRoles, 'admin' | 'superadmin'>
// 'user' | 'guest'

type NonNullable<T> = Exclude<T, null | undefined>  // actually built-in too


// ─────────────────────────────────────────────────────────────────
// Extract<T, U> — keep only matching types
type StringOrNumber = string | number | boolean | null
type Primitives     = Extract<StringOrNumber, string | number>
// string | number


// ─────────────────────────────────────────────────────────────────
// NonNullable<T> — remove null and undefined
type MaybeUser  = User | null | undefined
type DefiniteUser = NonNullable<MaybeUser>  // User


// ─────────────────────────────────────────────────────────────────
// ReturnType<T> — get return type of a function
function createOrder() {
  return { id: 1, product: 'Laptop', status: 'pending' as const }
}
type Order = ReturnType<typeof createOrder>
// { id: number; product: string; status: 'pending' }


// ─────────────────────────────────────────────────────────────────
// Parameters<T> — get parameter types as tuple
function createUser(name: string, age: number, role: 'admin' | 'user') { ... }
type CreateUserParams = Parameters<typeof createUser>
// [name: string, age: number, role: 'admin' | 'user']


// ─────────────────────────────────────────────────────────────────
// InstanceType<T> — get instance type of a constructor
class UserService {
  getUser(id: number): User { ... }
}
type ServiceInstance = InstanceType<typeof UserService>
// UserService


// ─────────────────────────────────────────────────────────────────
// Awaited<T> — unwrap Promise type (TS 4.5+)
type AsyncUser = Promise<Promise<User>>
type SyncUser  = Awaited<AsyncUser>  // User


// ─────────────────────────────────────────────────────────────────
// String utility types
type EventType   = 'click' | 'focus'
type UpperEvents = Uppercase<EventType>    // 'CLICK' | 'FOCUS'
type LowerEvents = Lowercase<UpperEvents>  // 'click' | 'focus'
type Handler     = `on${Capitalize<EventType>}`  // 'onClick' | 'onFocus'
```

---

# 5. ADVANCED TYPES

---

## Q: What are conditional types?

```ts
// T extends U ? X : Y — like ternary for types
type IsString<T> = T extends string ? true : false

type A = IsString<string>   // true
type B = IsString<number>   // false
type C = IsString<'hello'>  // true — string literal extends string


// REAL USE CASE: Unwrap array type
type Flatten<T> = T extends Array<infer Item> ? Item : T

type NumberItem = Flatten<number[]>  // number
type StringItem = Flatten<string[]>  // string
type JustNumber = Flatten<number>    // number (not an array, returns as-is)


// REAL USE CASE: Deep partial
type DeepPartial<T> = T extends object
  ? { [K in keyof T]?: DeepPartial<T[K]> }
  : T

interface Config {
  server: {
    host: string
    port: number
    ssl: {
      enabled: boolean
      cert: string
    }
  }
  database: {
    url: string
  }
}

type PartialConfig = DeepPartial<Config>
// All nested properties are optional


// infer — extract types within conditional types
type GetReturnType<T> = T extends (...args: any[]) => infer R ? R : never

function fetchUser(): Promise<User> { ... }
type Result = GetReturnType<typeof fetchUser>  // Promise<User>

type GetFirst<T> = T extends [infer First, ...any[]] ? First : never
type First = GetFirst<[string, number, boolean]>  // string
```

---

## Q: What are mapped types?

```ts
// Iterate over keys and transform
type Nullable<T> = {
  [K in keyof T]: T[K] | null
}

type Optional<T> = {
  [K in keyof T]?: T[K]
}

// With modifiers
type Mutable<T> = {
  -readonly [K in keyof T]: T[K]  // remove readonly
}

type Required<T> = {
  [K in keyof T]-?: T[K]  // remove optional (-)
}


// Remapping keys with 'as' (TS 4.1+)
type Getters<T> = {
  [K in keyof T as `get${Capitalize<string & K>}`]: () => T[K]
}

interface User { name: string; age: number }
type UserGetters = Getters<User>
// { getName: () => string; getAge: () => number }


// REAL USE CASE: Form state types
type FormState<T> = {
  values:  T
  errors:  Partial<Record<keyof T, string>>
  touched: Partial<Record<keyof T, boolean>>
}

interface LoginForm {
  email:    string
  password: string
}

type LoginFormState = FormState<LoginForm>
// {
//   values:  { email: string; password: string }
//   errors:  { email?: string; password?: string }
//   touched: { email?: boolean; password?: boolean }
// }
```

---

## Q: What are discriminated unions and why are they important?

```ts
// A union where each member has a common literal property (discriminant)
type LoadingState<T> =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'success'; data: T }
  | { status: 'error';   error: string; retryCount: number }

function render<T>(state: LoadingState<T>) {
  switch (state.status) {
    case 'idle':    return null
    case 'loading': return <Spinner />
    case 'success': return <Data value={state.data} />    // data is available
    case 'error':   return <Error msg={state.error} />    // error is available
    // TypeScript ensures all cases are handled
  }
}


// REAL USE CASE: Action types (Redux-like)
type Action =
  | { type: 'INCREMENT'; payload: number }
  | { type: 'DECREMENT'; payload: number }
  | { type: 'RESET' }
  | { type: 'SET_USER'; payload: User }

function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'INCREMENT': return { ...state, count: state.count + action.payload }
    case 'RESET':     return initialState  // no payload needed
    case 'SET_USER':  return { ...state, user: action.payload } // User typed
  }
}


// REAL USE CASE: API responses
type ApiResult<T> =
  | { success: true;  data: T;      message: string }
  | { success: false; error: string; code: number }

function handleResult<T>(result: ApiResult<T>) {
  if (result.success) {
    processData(result.data)    // TypeScript knows data exists
  } else {
    logError(result.error, result.code)  // TypeScript knows error/code exist
  }
}
```

---

## Q: What is the 'infer' keyword?

```ts
// infer — capture a type within a conditional type

// Extract promise value
type Awaited<T> = T extends Promise<infer U> ? U : T
type UserResult = Awaited<Promise<User>>  // User

// Extract array element
type ElementType<T> = T extends (infer U)[] ? U : never
type NumElement = ElementType<number[]>  // number

// Extract function return type
type ReturnType<T extends (...args: any) => any> =
  T extends (...args: any) => infer R ? R : never

// Extract first argument
type FirstArg<T extends (...args: any) => any> =
  T extends (first: infer F, ...rest: any[]) => any ? F : never

function login(email: string, password: string): Promise<User> { ... }
type EmailType = FirstArg<typeof login>  // string

// Extract constructor parameter
type ConstructorParam<T extends new (...args: any[]) => any> =
  T extends new (param: infer P) => any ? P : never
```

---

# 6. CLASSES & ACCESS MODIFIERS

---

## Q: What are access modifiers in TypeScript?

```ts
class BankAccount {
  public   id:       number       // accessible everywhere (default)
  private  balance:  number       // only inside this class
  protected ownerId: number       // this class + subclasses
  readonly  createdAt: Date       // cannot be changed after init

  // Shorthand — automatically creates and assigns properties
  constructor(
    public name:     string,   // public property
    private secret:  string,   // private property
    protected bank:  string    // protected property
  ) {
    this.id        = Math.random()
    this.balance   = 0
    this.ownerId   = 0
    this.createdAt = new Date()
  }

  // private method
  private validateAmount(amount: number): void {
    if (amount <= 0) throw new Error('Invalid amount')
  }

  public deposit(amount: number): void {
    this.validateAmount(amount)
    this.balance += amount
  }

  public getBalance(): number {
    return this.balance  // controlled access to private field
  }
}

class SavingsAccount extends BankAccount {
  constructor(name: string, secret: string) {
    super(name, secret, 'Savings Bank')
  }

  showOwner() {
    console.log(this.ownerId)  // OK — protected is accessible in subclass
    // console.log(this.balance)  // ERROR — private is not accessible
  }
}

const acc = new BankAccount('John', 'secret123', 'HDFC')
acc.deposit(1000)
acc.getBalance()     // 1000
// acc.balance        // ERROR — private
// acc.validateAmount(500)  // ERROR — private
```

---

## Q: What are abstract classes?

```ts
// Abstract class — cannot be instantiated, defines contract for subclasses
abstract class Shape {
  abstract getArea():      number  // must implement in subclass
  abstract getPerimeter(): number  // must implement in subclass

  // Concrete method — shared implementation
  describe(): string {
    return `Area: ${this.getArea()}, Perimeter: ${this.getPerimeter()}`
  }
}

class Circle extends Shape {
  constructor(private radius: number) { super() }

  getArea():      number { return Math.PI * this.radius ** 2 }
  getPerimeter(): number { return 2 * Math.PI * this.radius }
}

class Rectangle extends Shape {
  constructor(private width: number, private height: number) { super() }

  getArea():      number { return this.width * this.height }
  getPerimeter(): number { return 2 * (this.width + this.height) }
}

// const shape = new Shape()  // ERROR — cannot instantiate abstract class
const circle = new Circle(5)
circle.describe()  // works — uses concrete method from abstract class

// ABSTRACT vs INTERFACE:
// Abstract class: can have concrete methods, constructor, state
// Interface:      pure contract, no implementation
```

---

# 7. DECORATORS

---

## Q: What are decorators? (experimental feature)

```ts
// Enable in tsconfig.json: "experimentalDecorators": true

// Class decorator
function Injectable(constructor: Function) {
  console.log(`Class ${constructor.name} decorated`)
}

@Injectable
class UserService {
  getUser(id: number) { ... }
}


// Method decorator
function Log(target: any, propertyKey: string, descriptor: PropertyDescriptor) {
  const original = descriptor.value

  descriptor.value = function(...args: any[]) {
    console.log(`Calling ${propertyKey} with`, args)
    const result = original.apply(this, args)
    console.log(`${propertyKey} returned`, result)
    return result
  }
  return descriptor
}

class OrderService {
  @Log
  createOrder(product: string, qty: number) {
    return { product, qty, id: Math.random() }
  }
}

const service = new OrderService()
service.createOrder('Laptop', 2)
// Calling createOrder with ['Laptop', 2]
// createOrder returned { product: 'Laptop', qty: 2, id: ... }


// Property decorator
function Validate(min: number, max: number) {
  return function(target: any, propertyKey: string) {
    let value: number

    Object.defineProperty(target, propertyKey, {
      get: () => value,
      set: (newValue: number) => {
        if (newValue < min || newValue > max) {
          throw new Error(`${propertyKey} must be between ${min} and ${max}`)
        }
        value = newValue
      }
    })
  }
}

class Product {
  @Validate(1, 1000)
  quantity: number = 1
}
```

---

# 8. TYPE GUARDS & NARROWING

---

## Q: What is type narrowing?

TypeScript automatically narrows types based on conditions.

```ts
function processInput(input: string | number | null) {
  // At this point: input is string | number | null

  if (input === null) {
    // Here: input is null
    return 'empty'
  }

  // Here: input is string | number (null excluded)

  if (typeof input === 'string') {
    // Here: input is string
    return input.toUpperCase()
  }

  // Here: input is number
  return input.toFixed(2)
}
```

---

## Q: What are the different type guard techniques?

```ts
// 1. typeof guard — for primitives
function format(value: string | number): string {
  if (typeof value === 'string') {
    return value.trim()    // string
  }
  return value.toFixed(2)  // number
}

// 2. instanceof guard — for classes
function handle(error: Error | ApiError | ValidationError): string {
  if (error instanceof ApiError) {
    return `API ${error.statusCode}: ${error.message}`
  }
  if (error instanceof ValidationError) {
    return JSON.stringify(error.fields)
  }
  return error.message
}

// 3. 'in' operator guard — for objects
interface Admin  { role: 'admin'; permissions: string[] }
interface Guest  { role: 'guest'; sessionId: string }

function greet(user: Admin | Guest) {
  if ('permissions' in user) {
    console.log(user.permissions)  // Admin
  } else {
    console.log(user.sessionId)    // Guest
  }
}

// 4. Discriminant property guard — best for discriminated unions
type Result<T> =
  | { success: true;  data: T }
  | { success: false; error: string }

function process<T>(result: Result<T>) {
  if (result.success) {
    return result.data    // T — TypeScript knows data exists
  }
  return result.error     // string
}

// 5. Custom type guard function
interface Cat { meow: () => void; whiskers: number }
interface Dog { bark: () => void; breed: string }

function isCat(animal: Cat | Dog): animal is Cat {
  return 'meow' in animal
}

function makeSound(animal: Cat | Dog) {
  if (isCat(animal)) {
    animal.meow()        // Cat
    animal.whiskers      // number — TypeScript knows
  } else {
    animal.bark()        // Dog
    animal.breed         // string
  }
}

// 6. Assertion functions
function assertIsString(value: unknown): asserts value is string {
  if (typeof value !== 'string') {
    throw new Error('Expected string')
  }
}

function processInput(input: unknown) {
  assertIsString(input)
  // After this line, TypeScript knows input is string
  console.log(input.toUpperCase())  // OK
}
```

---

# 9. MODULES & DECLARATION FILES

---

## Q: What are declaration files (.d.ts)?

```ts
// Declaration files describe the shape of JavaScript code for TypeScript
// They contain ONLY type information — no actual implementation

// math.d.ts — declaring types for a JS library
declare module 'my-math-lib' {
  export function add(a: number, b: number): number
  export function multiply(a: number, b: number): number
  export const PI: number
}

// Global declaration
declare const API_URL: string
declare function fetchData(url: string): Promise<any>

// Augment existing module
declare module 'express' {
  interface Request {
    user?: User  // add user property to Express Request
  }
}

// When using @types packages
// npm install @types/lodash
// This installs lodash.d.ts — now you get types for lodash
```

---

## Q: What is module augmentation?

```ts
// Add types to existing modules without editing them

// Extend Express Request
import 'express'
declare module 'express' {
  interface Request {
    user?: { id: number; role: string }
    tenant?: string
  }
}

// Extend Window
interface Window {
  analytics: {
    track: (event: string, data?: object) => void
  }
}

// Extend existing interface from library
import 'react'
declare module 'react' {
  interface HTMLAttributes<T> {
    'data-testid'?: string  // add to all HTML elements
  }
}
```

---

# 10. TYPESCRIPT WITH REACT

---

## Q: How do you type React components?

```tsx
// Function component with interface
interface CardProps {
  title:       string
  description: string
  footer?:     React.ReactNode      // optional, any renderable content
  onClick?:    (id: number) => void
  className?:  string
}

// Option 1: Named function (recommended)
function Card({ title, description, footer, onClick, className }: CardProps) {
  return (
    <div className={className} onClick={() => onClick?.(1)}>
      <h2>{title}</h2>
      <p>{description}</p>
      {footer && <footer>{footer}</footer>}
    </div>
  )
}

// Option 2: FC type (adds implicit children — less explicit, less preferred)
const Card: React.FC<CardProps> = ({ title }) => <div>{title}</div>

// Extending HTML element props
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger'
  loading?: boolean
}

function Button({ variant = 'primary', loading = false, children, ...props }: ButtonProps) {
  return (
    <button
      {...props}
      disabled={loading || props.disabled}
      className={`btn btn-${variant}`}
    >
      {loading ? <Spinner /> : children}
    </button>
  )
}
// Now Button accepts all native button attributes + variant + loading


// Generic components
interface TableProps<T> {
  data:     T[]
  columns:  { key: keyof T; header: string }[]
  onSelect: (row: T) => void
}

function Table<T extends { id: number }>({ data, columns, onSelect }: TableProps<T>) {
  return (
    <table>
      <thead>
        <tr>{columns.map(c => <th key={String(c.key)}>{c.header}</th>)}</tr>
      </thead>
      <tbody>
        {data.map(row => (
          <tr key={row.id} onClick={() => onSelect(row)}>
            {columns.map(c => <td key={String(c.key)}>{String(row[c.key])}</td>)}
          </tr>
        ))}
      </tbody>
    </table>
  )
}

// Usage — fully typed
<Table<User>
  data={users}
  columns={[{ key: 'name', header: 'Name' }, { key: 'email', header: 'Email' }]}
  onSelect={(user) => console.log(user.name)}  // user is User type
/>
```

---

## Q: How do you type hooks?

```tsx
// useState
const [count,  setCount]  = useState<number>(0)
const [user,   setUser]   = useState<User | null>(null)
const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')

// useRef
const inputRef   = useRef<HTMLInputElement>(null)
const intervalId = useRef<ReturnType<typeof setInterval> | null>(null)

// useReducer
type State  = { count: number; loading: boolean }
type Action =
  | { type: 'INCREMENT' }
  | { type: 'DECREMENT' }
  | { type: 'SET_LOADING'; payload: boolean }

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'INCREMENT':    return { ...state, count: state.count + 1 }
    case 'DECREMENT':    return { ...state, count: state.count - 1 }
    case 'SET_LOADING':  return { ...state, loading: action.payload }
  }
}

const [state, dispatch] = useReducer(reducer, { count: 0, loading: false })

// useContext
interface AuthContextType {
  user:   User | null
  login:  (credentials: LoginInput) => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

// Custom hook for context with type safety
function useAuth(): AuthContextType {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx  // guaranteed non-undefined
}

// Custom hook with proper return type
function useCounter(initial = 0) {
  const [count, setCount] = useState(initial)

  return {
    count,
    increment: () => setCount(c => c + 1),
    decrement: () => setCount(c => c - 1),
    reset:     () => setCount(initial),
  } as const  // 'as const' prevents return type from being widened
}

type CounterReturn = ReturnType<typeof useCounter>
```

---

# 11. CODING ROUND PROBLEMS

---

## Problem 1: Implement a type-safe EventEmitter

```ts
type EventMap = Record<string, any>

class TypedEventEmitter<T extends EventMap> {
  private handlers: {
    [K in keyof T]?: Array<(payload: T[K]) => void>
  } = {}

  on<K extends keyof T>(event: K, handler: (payload: T[K]) => void): () => void {
    if (!this.handlers[event]) this.handlers[event] = []
    this.handlers[event]!.push(handler)
    return () => this.off(event, handler)
  }

  off<K extends keyof T>(event: K, handler: (payload: T[K]) => void): void {
    this.handlers[event] = this.handlers[event]?.filter(h => h !== handler)
  }

  emit<K extends keyof T>(event: K, payload: T[K]): void {
    this.handlers[event]?.forEach(h => h(payload))
  }
}

// Usage
type Events = {
  login:  { userId: number; email: string }
  logout: { userId: number }
  error:  string
}

const emitter = new TypedEventEmitter<Events>()
emitter.on('login', ({ userId, email }) => { /* fully typed */ })
// emitter.on('login', ({ wrong }) => {}) // ERROR
```

---

## Problem 2: Implement a type-safe fetch wrapper

```ts
type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH'

interface RequestConfig {
  headers?: Record<string, string>
  params?:  Record<string, string | number>
}

async function apiRequest<T>(
  method:   HttpMethod,
  endpoint: string,
  body?:    unknown,
  config:   RequestConfig = {}
): Promise<T> {
  const url = new URL(endpoint, process.env.NEXT_PUBLIC_API_URL)

  if (config.params) {
    Object.entries(config.params).forEach(([k, v]) =>
      url.searchParams.set(k, String(v))
    )
  }

  const response = await fetch(url.toString(), {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...config.headers
    },
    body: body ? JSON.stringify(body) : undefined
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Request failed' }))
    throw new Error(error.message || `HTTP ${response.status}`)
  }

  return response.json() as Promise<T>
}

// Convenience methods — all fully typed
const api = {
  get:    <T>(url: string, config?: RequestConfig) =>
            apiRequest<T>('GET', url, undefined, config),
  post:   <T>(url: string, body: unknown, config?: RequestConfig) =>
            apiRequest<T>('POST', url, body, config),
  put:    <T>(url: string, body: unknown, config?: RequestConfig) =>
            apiRequest<T>('PUT', url, body, config),
  delete: <T>(url: string, config?: RequestConfig) =>
            apiRequest<T>('DELETE', url, undefined, config),
}

// Usage
const users  = await api.get<User[]>('/users')
const user   = await api.post<User>('/users', { name: 'John' })
```

---

## Problem 3: Build a deep readonly type

```ts
// Built-in Readonly is shallow — only top level
type DeepReadonly<T> =
  T extends (infer U)[]           ? ReadonlyArray<DeepReadonly<U>>
  : T extends Map<infer K, infer V> ? ReadonlyMap<K, DeepReadonly<V>>
  : T extends Set<infer S>          ? ReadonlySet<DeepReadonly<S>>
  : T extends object                ? { readonly [K in keyof T]: DeepReadonly<T[K]> }
  : T

// Test
interface Config {
  server: {
    host: string
    ports: number[]
    ssl: { enabled: boolean }
  }
}

type FrozenConfig = DeepReadonly<Config>

declare const config: FrozenConfig
// config.server.host = 'x'        // ERROR
// config.server.ports.push(8080)  // ERROR
// config.server.ssl.enabled = true // ERROR
```

---

## Problem 4: Implement a Builder pattern

```ts
class QueryBuilder<T> {
  private query: {
    table?:       string
    conditions:   string[]
    selectedCols: (keyof T)[]
    limitVal?:    number
    offsetVal?:   number
    orderByCol?:  keyof T
    orderDir:     'ASC' | 'DESC'
  } = {
    conditions:   [],
    selectedCols: [],
    orderDir:     'ASC'
  }

  from(table: string): this {
    this.query.table = table
    return this
  }

  select(...columns: (keyof T)[]): this {
    this.query.selectedCols = columns
    return this
  }

  where(condition: string): this {
    this.query.conditions.push(condition)
    return this
  }

  limit(n: number): this {
    this.query.limitVal = n
    return this
  }

  offset(n: number): this {
    this.query.offsetVal = n
    return this
  }

  orderBy(column: keyof T, direction: 'ASC' | 'DESC' = 'ASC'): this {
    this.query.orderByCol = column
    this.query.orderDir   = direction
    return this
  }

  build(): string {
    const cols = this.query.selectedCols.length
      ? this.query.selectedCols.join(', ')
      : '*'

    let sql = `SELECT ${String(cols)} FROM ${this.query.table}`

    if (this.query.conditions.length) {
      sql += ` WHERE ${this.query.conditions.join(' AND ')}`
    }
    if (this.query.orderByCol) {
      sql += ` ORDER BY ${String(this.query.orderByCol)} ${this.query.orderDir}`
    }
    if (this.query.limitVal)  sql += ` LIMIT ${this.query.limitVal}`
    if (this.query.offsetVal) sql += ` OFFSET ${this.query.offsetVal}`

    return sql
  }
}

// Usage
interface User { id: number; name: string; email: string; role: string }

const query = new QueryBuilder<User>()
  .from('users')
  .select('id', 'name', 'email')
  .where("role = 'admin'")
  .where('active = true')
  .orderBy('name', 'ASC')
  .limit(10)
  .offset(0)
  .build()

// SELECT id, name, email FROM users WHERE role = 'admin' AND active = true ORDER BY name ASC LIMIT 10 OFFSET 0
```

---

## Problem 5: Implement Zod-like validation

```ts
// Simple schema validator
type ValidationResult<T> =
  | { success: true;  data: T }
  | { success: false; errors: string[] }

interface Validator<T> {
  parse(value: unknown): T
  safeParse(value: unknown): ValidationResult<T>
}

function string(): Validator<string> {
  return {
    parse(value) {
      if (typeof value !== 'string') throw new Error('Expected string')
      return value
    },
    safeParse(value) {
      try { return { success: true,  data: this.parse(value) } }
      catch (e) { return { success: false, errors: [(e as Error).message] } }
    }
  }
}

function number(): Validator<number> {
  return {
    parse(value) {
      if (typeof value !== 'number') throw new Error('Expected number')
      return value
    },
    safeParse(value) {
      try { return { success: true,  data: this.parse(value) } }
      catch (e) { return { success: false, errors: [(e as Error).message] } }
    }
  }
}

type ObjectShape = Record<string, Validator<any>>
type InferShape<T extends ObjectShape> = { [K in keyof T]: ReturnType<T[K]['parse']> }

function object<T extends ObjectShape>(shape: T): Validator<InferShape<T>> {
  return {
    parse(value) {
      if (typeof value !== 'object' || value === null) throw new Error('Expected object')
      const result: any = {}
      const errors: string[] = []

      for (const key in shape) {
        try {
          result[key] = shape[key].parse((value as any)[key])
        } catch (e) {
          errors.push(`${key}: ${(e as Error).message}`)
        }
      }
      if (errors.length) throw new Error(errors.join(', '))
      return result
    },
    safeParse(value) {
      try { return { success: true,  data: this.parse(value) } }
      catch (e) { return { success: false, errors: [(e as Error).message.split(', ')] as any } }
    }
  }
}

// Usage
const UserSchema = object({ name: string(), age: number() })
type User = InferShape<typeof UserSchema>  // { name: string; age: number }

const result = UserSchema.safeParse({ name: 'John', age: 25 })
if (result.success) {
  console.log(result.data.name)  // typed as string
}
```

---

# 12. OUTPUT & ERROR QUESTIONS

---

```ts
// Q1: Will this compile?
interface Animal { name: string }
interface Bear   extends Animal { honey: boolean }

const bear: Bear = { name: 'Paddington', honey: true }
const animal: Animal = bear  // OK — structural typing
// animal.honey  // ERROR — animal doesn't have honey in its type


// Q2: What is the type of 'result'?
const arr  = [1, 'hello', true] as const
type Item  = typeof arr[number]  // 1 | 'hello' | true


// Q3: Will this compile?
function getProperty<T, K extends keyof T>(obj: T, key: K): T[K] {
  return obj[key]
}
const user = { name: 'John', age: 25 }
const name = getProperty(user, 'name')   // string — compiles
// const x  = getProperty(user, 'email') // ERROR — 'email' not in user


// Q4: What's wrong here?
async function fetchUser(): User {  // ERROR — should be Promise<User>
  const user = await apiCall()
  return user
}
// Fix:
async function fetchUser(): Promise<User> { ... }


// Q5: What is the type error?
type OnlyString<T> = T extends string ? T : never

type A = OnlyString<string | number | boolean>
// Distributive conditional type: runs for each union member
// string extends string ? string : never → string
// number extends string ? number : never → never
// boolean extends string ? boolean : never → never
// Result: string | never | never = string


// Q6: Will this cause a type error?
const obj = {} as { [key: string]: number }
obj.count = 1       // OK
obj.name = 'John'   // ERROR: string is not assignable to number


// Q7: What is the output type?
function identity<T>(x: T): T { return x }
const result = identity(42)  // TypeScript infers T = 42 (literal)
// result: 42 (not number — TS infers the literal type)
```

---

# 13. CONFIGURATION

---

## Q: Important tsconfig.json options

```json
{
  "compilerOptions": {
    // Target — what JS version to output
    "target": "ES2020",

    // Module system
    "module": "ESNext",
    "moduleResolution": "bundler",

    // Strict mode — ALWAYS ENABLE in production
    "strict": true,
    // strict enables ALL of these:
    // "strictNullChecks": true      — null/undefined are their own types
    // "strictFunctionTypes": true   — stricter function type checking
    // "noImplicitAny": true         — error on implicit 'any'
    // "strictBindCallApply": true   — strict call/apply/bind
    // "noImplicitThis": true        — error on implicit 'this'

    // Additional strict checks
    "noUncheckedIndexedAccess": true,  // arr[0] is T | undefined
    "noImplicitOverride": true,        // must use 'override' keyword
    "noUnusedLocals": true,            // error on unused variables
    "noUnusedParameters": true,        // error on unused parameters

    // Path aliases
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"],
      "@components/*": ["./src/components/*"]
    },

    // Output
    "outDir": "./dist",
    "rootDir": "./src",

    // Source maps for debugging
    "sourceMap": true,

    // Decorators (NestJS etc.)
    "experimentalDecorators": true,
    "emitDecoratorMetadata": true,

    // JSX (React)
    "jsx": "react-jsx",

    // Allow JS files
    "allowJs": true,
    "checkJs": false
  }
}
```

---

## QUICK REFERENCE — Common Interview Topics by Level

### Junior Level
- Type annotations, type inference
- Basic types, union types
- Interface vs type (basic)
- Optional and readonly properties
- Basic generics
- Type assertions (as)

### Mid Level
- Generic constraints (`extends keyof`)
- All utility types with use cases
- Discriminated unions
- Type guards (all forms)
- Mapped types (basic)
- TypeScript with React (props, hooks, events)
- Declaration merging

### Senior Level
- Conditional types with `infer`
- Complex mapped types with `as` remapping
- Template literal types
- Variance and covariance
- Declaration files (.d.ts)
- Module augmentation
- Type-level programming
- Design patterns with TypeScript
- Performance (avoiding complex types that slow TS compiler)

---

## TypeScript vs JavaScript — Summary Table

| Feature | JavaScript | TypeScript |
|---|---|---|
| Type checking | Runtime | Compile time |
| Error detection | When running | When coding |
| Interfaces | No | Yes |
| Generics | No | Yes |
| Access modifiers | No (ES private #) | Yes (public/private/protected) |
| Abstract classes | No | Yes |
| Decorators | Stage 3 | Yes (experimental) |
| Tooling/Autocomplete | Basic | Excellent |
| Learning curve | Lower | Higher |
| Large codebase safety | Risky | Safer |

---

*TS Interview Notes — All levels covered*
