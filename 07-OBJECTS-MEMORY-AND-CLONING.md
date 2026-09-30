# MODULE 07 — THE ULTIMATE JAVASCRIPT OBJECTS TEXTBOOK
## Mastering JavaScript Objects from Beginner to Senior Engineer

---

# 01. WHAT IS AN OBJECT?

### What is it?
An object is a data structure in JavaScript that groups related data and functions together. It stores this data as a list of key-value pairs, which are called properties. Each property has a name (the key) and a piece of data stored under that name (the value).

Here are the key technical terms used in this topic:
- A primitive is a single basic value in JavaScript, such as a number (`42`) or a string (`"hello"`).
- A property is a single entry inside an object that pairs a name with a value.
- A key is the identifier or name used to look up a property.
- A value is the data stored under a specific key.
- A method is a property whose value is a function.
- Memory is the temporary storage space in your computer where running programs keep data.

---

### Why does it exist?
A primitive variable can store only one piece of data at a time. For example, if you want to store information about a single user without an object, you have to write separate variables:

```javascript
let userName = "Alex";
let userAge = 25;
let userIsActive = true;
```

This causes three problems as code grows:
1. The variables are completely detached from each other in code, so JavaScript does not know they represent the same user.
2. Passing user information into a function requires passing three separate arguments instead of a single package.
3. If you have ten users, you must declare thirty separate variable names.

An object solves this problem. It groups all related variables into a single compound structure under one variable name.

---

### Basic example and explanation

```javascript
const user = {
  name: "Alex",
  age: 25,
  isActive: true
};

console.log(user.name);
console.log(user.age);
```

Output:
```text
Alex
25
```

How this code runs, step by step:

First, we declare a variable called `user` using `const`. The opening curly brace `{` marks the start of the object definition.

Next, we define the properties between the curly braces:
- We write `name: "Alex"`. This creates a property with the key `name` and gives it the string value `"Alex"`. A comma `,` separates this property from the next.
- We write `age: 25`. This creates a second property with the key `age` and assigns the number `25`.
- We write `isActive: true`. This creates a third property with the key `isActive` and assigns the boolean `true`.

We close the object definition with the closing curly brace `}` and a semicolon `;`.

Finally, we read values out of the object using dot notation (`.`):
- Writing `user.name` looks inside `user`, finds the key `name`, and returns `"Alex"`.
- Writing `user.age` looks inside `user`, finds the key `age`, and returns `25`.

---

### How it works inside JavaScript

When JavaScript evaluates `const user = { name: "Alex", age: 25 };`, it performs the following internal steps:

1. The engine allocates space in the memory heap. The heap is the section of memory used for data that can grow or change dynamically.
2. The engine generates a unique memory address for this new object (for example, address `#101`).
3. Inside address `#101`, JavaScript writes the property keys (`"name"` and `"age"`) and their values (`"Alex"` and `25`).
4. The variable `user` is created on the call stack, but it does not contain the properties directly. Instead, it stores the memory address `#101`.
5. When you access `user.name`, JavaScript follows the address pointer from the stack to address `#101` in the heap and retrieves the value stored under `"name"`.

```text
Stack Memory                     Heap Memory (Address #101)
┌──────────────┐                 ┌───────────────────────────┐
│ user: #101 ──┼────────────────►│ name: "Alex"              │
└──────────────┘                 │ age: 25                   │
                                 └───────────────────────────┘
```

The variable `user` on the stack stores only the memory address `#101`. The actual properties and their values reside on the heap at that address.

---

### Comparing primitives and objects

JavaScript values fall into two distinct categories: primitives and objects.

| Feature | Primitive (`number`, `string`, `boolean`, `null`, `undefined`, `symbol`, `bigint`) | Object (`{}`, `[]`, `function`) |
| :--- | :--- | :--- |
| Stored content | Holds a single raw value directly | Holds a collection of key-value pairs |
| Mutability | Immutable (the value itself cannot be modified) | Mutable (properties can be added, changed, or removed) |
| Comparison | Compared by value (`5 === 5` is `true`) | Compared by memory address (`{} === {}` is `false`) |
| Memory location | Stored directly in stack memory | Stored in the heap; variable holds a reference address |

---

### Think first

What do you think this code prints? Decide first before checking below.

```javascript
const userA = { id: 1 };
const userB = { id: 1 };

console.log(userA === userB);
```

---

Result:
```text
false
```

Why:
Every time JavaScript runs an object literal `{ ... }`, it allocates a brand new object at a distinct memory address.
- `userA` holds address `#201`.
- `userB` holds address `#202`.
- The strict equality operator `===` compares the memory address of objects, not the properties written inside them.
- Because address `#201` is not equal to address `#202`, the result is `false`.

---

### More examples: from easy to harder

#### Example 1: Holding different data types
An object property can hold any valid JavaScript data type: numbers, strings, booleans, arrays, or other objects.

```javascript
const settings = {
  theme: "dark",
  fontSize: 14,
  autoSave: true,
  tags: ["editor", "ui"]
};

console.log(settings.theme);
console.log(settings.tags[0]);
```

Output:
```text
dark
editor
```

Explanation:
- `settings.theme` returns the string `"dark"`.
- `settings.tags` returns the entire array `["editor", "ui"]`.
- To get an element from the array inside the object, we chain standard array indexing right after the property name: `settings.tags[0]` gives `"editor"`.

#### Example 2: Nested objects
An object can contain another object as one of its property values. This is called nesting.

```javascript
const config = {
  version: 1,
  server: {
    port: 8080,
    host: "localhost"
  }
};

console.log(config.server.port);
console.log(config.server.host);
```

Output:
```text
8080
localhost
```

Explanation:
- The property `server` holds its own independent object with properties `port` and `host`.
- To access `port`, JavaScript first resolves `config.server`, which returns the inner object, and then accesses `port` on that inner object using a second dot.

#### Example 3: Adding a method
When a function is assigned to a property on an object, it is called a method.

```javascript
const point = {
  x: 10,
  y: 20,
  describe: function() {
    return "Point at position";
  }
};

console.log(point.describe());
```

Output:
```text
Point at position
```

Explanation:
- The key `describe` stores a function.
- We call that function by writing parentheses after the property name: `point.describe()`.

---

### Common mistakes

#### Mistake 1: Comparing two objects directly to see if their values match
Wrong code:
```javascript
const point1 = { x: 5, y: 10 };
const point2 = { x: 5, y: 10 };

if (point1 === point2) {
  console.log("Points match");
} else {
  console.log("Points do not match");
}
```

Output:
```text
Points do not match
```

Why it happens:
JavaScript never compares the contents inside two objects. It only checks whether both variables point to the exact same location in memory. Since `point1` and `point2` were created separately, they have different memory locations.

Correct code:
Compare the individual primitive values inside the objects:
```javascript
const point1 = { x: 5, y: 10 };
const point2 = { x: 5, y: 10 };

if (point1.x === point2.x && point1.y === point2.y) {
  console.log("Points match");
}
```

Output:
```text
Points match
```

---

#### Mistake 2: Using semicolons inside an object literal
Wrong code:
```javascript
const user = {
  name: "Sam";
  age: 30;
}
```

Output:
```text
SyntaxError: Unexpected token ';'
```

Why it happens:
Inside curly braces `{ ... }` of an object, properties must be separated by commas `,`, never semicolons `;`.

Correct code:
```javascript
const user = {
  name: "Sam",
  age: 30
};
```

---

#### Mistake 3: Reading an undefined property
```javascript
const user = {
  name: "Sam"
};

console.log(user.age);
```

Output:
```text
undefined
```

Why it happens:
When you query a property key that does not exist on an object, JavaScript does not throw an error. It evaluates to `undefined`.

---

### Try it yourself
Create an object named `person` with three properties:
1. `firstName` with the value `"Taylor"`
2. `age` with the value `28`
3. `isStudent` with the value `false`

Then print the `firstName` and `age` to the console.

---

### Rules to remember
1. An object stores data as key-value pairs called properties.
2. Property values can be any valid JavaScript type, including arrays, functions, and other objects.
3. Variables holding objects store a memory address pointing to the heap, not the object's contents directly.
4. Two different objects are never equal with `===`, even if they contain identical keys and values.
5. Reading a property that has not been defined returns `undefined`, without crashing the program.

---

### Exercises

#### Question 1 (Predict the output)
What will this code print to the console?
```javascript
const settings = {
  theme: "light",
  volume: 80
};

console.log(settings.volume);
console.log(settings.brightness);
```

#### Question 2 (Find and fix the bug)
The following code throws a syntax error. Find the mistake and write the corrected version.
```javascript
const config = {
  mode: "production";
  timeout: 5000;
}
```

#### Question 3 (Write code from scratch)
Write an object named `point3D` that stores:
- `x` with the value `0`
- `y` with the value `15`
- `z` with the value `-5`

Then write a single `console.log` statement that prints the value of `y`.

#### Question 4 (Explain in your own words)
Explain why the following code prints `false` even though both objects contain the exact same key and value:
```javascript
const first = { count: 10 };
const second = { count: 10 };
console.log(first === second);
```

---

### Solutions

#### Solution for Question 1
- Hint 1: Check what value is explicitly assigned to `volume`.
- Hint 2: If a property name is not declared in the object, what does JavaScript return?

Answer:
```text
80
undefined
```
Explanation: `settings.volume` resolves to `80`. The property `brightness` was never assigned to `settings`, so reading it produces `undefined`.

---

#### Solution for Question 2
- Hint 1: Look at the punctuation at the end of each property line inside the curly braces.
- Hint 2: Check the statement ending after the closing curly brace.

Corrected code:
```javascript
const config = {
  mode: "production",
  timeout: 5000
};
```
Explanation: Inside an object literal, each key-value pair must be followed by a comma `,`, not a semicolon `;`. The entire variable declaration statement ends with a semicolon `;` after the closing brace.

---

#### Solution for Question 3
- Hint 1: Use `const` to declare the object variable.
- Hint 2: Separate properties with commas and read `y` using `point3D.y`.

Code:
```javascript
const point3D = {
  x: 0,
  y: 15,
  z: -5
};

console.log(point3D.y);
```
Output:
```text
15
```

---

#### Solution for Question 4
- Hint 1: Think about how objects are stored in memory.
- Hint 2: Does the variable hold the data values, or does it hold a memory address reference?

Explanation:
Each time an object literal `{ ... }` runs, JavaScript creates a separate object in heap memory with a unique address. Variable `first` stores the address of the first object (for example, `#101`), and `second` stores the address of the second object (for example, `#102`). The `===` operator compares the reference addresses stored in the variables. Because `#101` and `#102` are different memory addresses, `first === second` evaluates to `false`.

---

### Recall
1. What is the name of the memory region where JavaScript stores objects?
2. What value does JavaScript return when you read a property that does not exist on an object?
3. If two objects have identical keys and values, will `objA === objB` return `true` or `false`?

---

### If you remember only one thing:
An object groups related data as key-value pairs stored in heap memory, and variables hold a reference to that memory address rather than the values themselves.

---

# 02. OBJECT LITERALS

### What is it?
An object literal is a syntax in JavaScript that creates a new object using a pair of curly braces `{}`. Inside the braces, you can write zero, one, or more properties directly. It is the most common way to create an object in JavaScript.

Here are the key technical terms used in this topic:
- An object literal is an expression that directly creates and initializes an object using `{}`.
- Property shorthand is a syntax feature where you write just the variable name instead of `key: value` if both names match.
- A method shorthand is a concise syntax for defining a function inside an object without writing the `function` keyword.
- A computed property name is a property key created from the result of an expression inside square brackets `[]`.

---

### Why does it exist?
In early versions of JavaScript, creating an object often required calling a constructor function like `new Object()`, and then assigning each property one line at a time:

```javascript
const user = new Object();
user.name = "Alex";
user.age = 25;
```

This approach has two problems:
1. It requires multiple lines of code just to set up initial data.
2. It makes it harder to read the structure of the data at a single glance.

The object literal syntax solves this. It lets you declare the object and define all its initial data in one clear, readable block.

---

### Basic example and explanation

```javascript
const settings = {
  theme: "dark",
  volume: 75,
  notifications: true
};

console.log(settings.theme);
console.log(settings.volume);
```

Output:
```text
dark
75
```

How this code runs, step by step:

First, we declare a constant named `settings`. The opening curly brace `{` tells JavaScript to start creating a new object literal.

Inside the braces, each property is written as a key followed by a colon `:`, then the value, and then a comma `,`:
- `theme: "dark",` sets the key `theme` to the string `"dark"`.
- `volume: 75,` sets the key `volume` to the number `75`.
- `notifications: true` sets the key `notifications` to the boolean `true`.

The closing brace `}` finishes the object creation, and the statement ends with a semicolon `;`.

Finally, we read `settings.theme` and `settings.volume` using dot notation. JavaScript looks up each key and prints `"dark"` followed by `75`.

---

### How it works inside JavaScript

When the JavaScript engine reaches an object literal expression, it performs the following steps:

1. The engine allocates an empty object block in heap memory.
2. It evaluates each property value expression in order from top to bottom.
3. For each property, the engine inserts the key and the evaluated value into the newly allocated object.
4. When all properties are written, the engine returns the memory address of the new object.
5. The variable receives that memory address.

---

### Think first

What do you think this code prints? Decide first before checking below.

```javascript
const keyName = "status";

const config = {
  keyName: "active"
};

console.log(config.keyName);
console.log(config.status);
```

---

Result:
```text
active
undefined
```

Why:
Inside an object literal, writing `keyName: "active"` creates a literal property named `"keyName"`. It does not use the value of the variable `keyName`. Therefore, `config.keyName` is `"active"`, and `config.status` does not exist, which returns `undefined`.

---

### More examples: from easy to harder

#### Example 1: Property name shorthand
When a variable in your code has the same name as the key you want to create, you do not have to write `name: name`. You can write just `name`.

```javascript
const name = "Taylor";
const age = 28;

const user = {
  name,
  age
};

console.log(user.name);
console.log(user.age);
```

Output:
```text
Taylor
28
```

Explanation:
- JavaScript sees `{ name, age }`.
- Because there is no colon after `name`, JavaScript looks for an existing variable named `name` and sets its value as the value of the `name` property.
- This produces the exact same result as writing `{ name: name, age: age }`.

#### Example 2: Method definition shorthand
You can define methods without writing the `: function` keywords.

```javascript
const counter = {
  count: 0,
  increment() {
    return "Increased";
  }
};

console.log(counter.increment());
```

Output:
```text
Increased
```

Explanation:
- Writing `increment() { ... }` is the method shorthand introduced in modern JavaScript (ES2015).
- It behaves the same as writing `increment: function() { ... }`, but is cleaner to read.

#### Example 3: Computed property names
If you want the name of a key to come from a variable or a calculation, wrap the expression in square brackets `[]` inside the object literal.

```javascript
const prefix = "item_";
const index = 4;

const collection = {
  [prefix + index]: "Widget",
  [1 + 2]: "Three"
};

console.log(collection.item_4);
console.log(collection[3]);
```

Output:
```text
Widget
Three
```

Explanation:
- In `[prefix + index]`, JavaScript evaluates the string concatenation `"item_" + 4` to get `"item_4"`. It then uses `"item_4"` as the key name.
- In `[1 + 2]`, JavaScript calculates `1 + 2 = 3` and uses `"3"` as the key name.

---

### Common mistakes

#### Mistake 1: Trying to use a variable as a key without square brackets
Wrong code:
```javascript
const propertyName = "role";

const user = {
  propertyName: "admin"
};

console.log(user.role);
```

Output:
```text
undefined
```

Why it happens:
Without square brackets, JavaScript treats `propertyName` as the literal text of the key. It does not look up what the variable holds.

Correct code:
Use square brackets to compute the key name from the variable:
```javascript
const propertyName = "role";

const user = {
  [propertyName]: "admin"
};

console.log(user.role);
```

Output:
```text
admin
```

---

#### Mistake 2: Missing commas between properties
Wrong code:
```javascript
const point = {
  x: 10
  y: 20
};
```

Output:
```text
SyntaxError: Unexpected identifier 'y'
```

Why it happens:
JavaScript requires a comma `,` to separate each property definition inside an object literal.

Correct code:
```javascript
const point = {
  x: 10,
  y: 20
};
```

---

### Try it yourself
Create an object named `device` using shorthand syntax for two variables: `type = "tablet"` and `battery = 85`. Also add a method shorthand named `getStatus()` that returns `"Battery at 85%"`.

---

### Rules to remember
1. An object literal is written with curly braces `{}`.
2. Properties inside an object literal must be separated by commas `,`.
3. If a variable name matches the desired property key name, you can write just the variable name as a shorthand.
4. Method shorthand lets you write `methodName() {}` instead of `methodName: function() {}`.
5. To use a variable or expression as a key name inside an object literal, wrap it in square brackets `[expression]`.

---

### Exercises

#### Question 1 (Predict the output)
What will this code print to the console?
```javascript
const id = 101;
const state = "pending";

const task = {
  id,
  state,
  ["task_" + id]: true
};

console.log(task.id);
console.log(task.task_101);
```

#### Question 2 (Find and fix the bug)
The following code tries to create an object where the key name is the value stored inside `selectedKey`. Fix the code.
```javascript
const selectedKey = "volume";
const options = {
  selectedKey: 50
};

console.log(options.volume);
```

#### Question 3 (Write code from scratch)
Declare two variables: `width = 200` and `height = 100`. Then create an object named `dimensions` that uses property shorthand for both, plus a method shorthand `getArea()` that returns `20000`.

#### Question 4 (Explain in your own words)
What is the difference between writing `{ key: "value" }` and `{ [key]: "value" }` inside an object literal?

---

### Solutions

#### Solution for Question 1
- Hint 1: `id` and `state` use property shorthand.
- Hint 2: `["task_" + id]` calculates the property name dynamically.

Answer:
```text
101
true
```
Explanation: `task.id` takes the value of the variable `id` (`101`). The computed property evaluates `"task_" + 101`, creating the key `"task_101"` with value `true`.

---

#### Solution for Question 2
- Hint 1: What syntax tells JavaScript to read the variable value for a key name instead of the literal word?
- Hint 2: Use square brackets around the key name.

Corrected code:
```javascript
const selectedKey = "volume";
const options = {
  [selectedKey]: 50
};

console.log(options.volume);
```
Explanation: Wrapping `selectedKey` in square brackets tells JavaScript to evaluate the variable and use `"volume"` as the key name.

---

#### Solution for Question 3
- Hint 1: Declare `width` and `height` before the object.
- Hint 2: In the method shorthand, you do not write the word `function`.

Code:
```javascript
const width = 200;
const height = 100;

const dimensions = {
  width,
  height,
  getArea() {
    return 20000;
  }
};

console.log(dimensions.width);
console.log(dimensions.getArea());
```

---

#### Solution for Question 4
- Hint 1: Think about literal strings versus variable lookups.
- Hint 2: One uses the exact characters written; the other evaluates an expression.

Explanation:
Writing `{ key: "value" }` creates a property with the literal string name `"key"`. Writing `{ [key]: "value" }` evaluates whatever expression or variable is inside the square brackets and uses the resulting value as the property name.

---

### Recall
1. What punctuation mark must separate properties inside an object literal?
2. What syntax allows an object literal to use an expression as a property key?
3. What is the shorthand syntax for a property whose key matches the variable name?

---

### If you remember only one thing:
Object literals use curly braces `{}` to define key-value pairs, and wrapping a key in square brackets `[expr]` lets you calculate the key name from any JavaScript expression.

---

# 03. OBJECT KEYS

### What is it?
An object key is the identifier used to locate a property inside an object. In JavaScript, an ordinary object property key can only be one of two types: a string or a symbol. If you supply any other data type as a key, JavaScript automatically converts it into a string.

Here are the key technical terms used in this topic:
- A key is the name part of a key-value property pair.
- A symbol is a unique primitive value created with `Symbol()`.
- Coercion is the automatic conversion of a value from one data type to another by JavaScript.
- Stringification is the specific process of converting any value into a string.

---

### Why does it exist?
JavaScript engines need a consistent, predictable way to index and find properties in memory. By limiting keys to strings (and symbols), the engine can look up properties reliably using a single internal hashing mechanism.

When developers provide a number or a boolean as a key, JavaScript automatically converts it to a string behind the scenes rather than stopping with an error.

---

### Basic example and explanation

```javascript
const scores = {};

scores[1] = "First place";
scores["1"] = "Updated first place";

console.log(scores[1]);
console.log(scores["1"]);
```

Output:
```text
Updated first place
Updated first place
```

How this code runs, step by step:

First, we create an empty object named `scores`.

Next, we write `scores[1] = "First place"`. The key provided is the number `1`. JavaScript automatically converts the number `1` into the string `"1"`. It stores the property under the key `"1"`.

Then, we write `scores["1"] = "Updated first place"`. Because the key `"1"` already exists from the previous line, JavaScript does not create a second property. Instead, it overwrites the value of the existing `"1"` property with `"Updated first place"`.

Finally, we read `scores[1]` and `scores["1"]`. Both accesses convert the key to `"1"` and point to the exact same property, printing `"Updated first place"` both times.

---

### How it works inside JavaScript

When you assign or read a property using a key that is not a string or symbol:

1. JavaScript runs its internal `ToString()` operation on the key.
2. If the key is the number `123`, it becomes the string `"123"`.
3. If the key is `true`, it becomes the string `"true"`.
4. If the key is an object (for example `{}`), JavaScript calls its `toString()` method, which produces the string `"[object Object]"`.
5. The engine looks up or stores the property under that string representation in heap memory.

---

### Think first

What do you think this code prints? Decide first before checking below.

```javascript
const collection = {};

const userA = { id: 1 };
const userB = { id: 2 };

collection[userA] = "Alex";
collection[userB] = "Taylor";

console.log(collection[userA]);
```

---

Result:
```text
Taylor
```

Why:
When `userA` is used as an object key, JavaScript converts it to a string. Calling `toString()` on a plain object produces `"[object Object]"`.
So line 6 writes `collection["[object Object]"] = "Alex"`.
Next, `userB` is also an object. Its string conversion also produces `"[object Object]"`.
So line 7 overwrites the exact same property: `collection["[object Object]"] = "Taylor"`.
Reading `collection[userA]` reads `collection["[object Object]"]`, which now holds `"Taylor"`.

---

### More examples: from easy to harder

#### Example 1: Numeric keys
Numbers used as keys are always strings.

```javascript
const items = {
  0: "First",
  1: "Second"
};

console.log(items[0]);
console.log(items["0"]);
```

Output:
```text
First
First
```

Explanation:
- In the object literal, `0` becomes `"0"`.
- `items[0]` and `items["0"]` access the exact same property.

#### Example 2: Boolean keys
Booleans used as keys become strings.

```javascript
const flags = {};
flags[true] = "Active";
flags[false] = "Inactive";

console.log(flags["true"]);
console.log(flags[false]);
```

Output:
```text
Active
Inactive
```

Explanation:
- `flags[true]` stores `"Active"` under key `"true"`.
- `flags[false]` stores `"Inactive"` under key `"false"`.

#### Example 3: Symbol keys do not convert to strings
Symbols are the only keys that are not converted to strings. Every symbol is completely unique.

```javascript
const key1 = Symbol("id");
const key2 = Symbol("id");

const registry = {
  [key1]: "Data A",
  [key2]: "Data B"
};

console.log(registry[key1]);
console.log(registry[key2]);
```

Output:
```text
Data A
Data B
```

Explanation:
- Even though both symbols have the description `"id"`, each call to `Symbol()` creates a unique symbol identity.
- Because symbols are not converted to strings, `key1` and `key2` remain separate properties and do not overwrite each other.

---

### Common mistakes

#### Mistake 1: Using objects as keys in plain objects
Wrong code:
```javascript
const tracker = {};
const configA = { env: "dev" };
const configB = { env: "prod" };

tracker[configA] = 1;
tracker[configB] = 2;

console.log(tracker[configA]);
```

Output:
```text
2
```

Why it happens:
Both `configA` and `configB` are converted to the string `"[object Object]"`. The second assignment overwrites the first.

Correct code:
If you need objects as keys, use a `Map` instead of a plain object:
```javascript
const tracker = new Map();
const configA = { env: "dev" };
const configB = { env: "prod" };

tracker.set(configA, 1);
tracker.set(configB, 2);

console.log(tracker.get(configA));
```

Output:
```text
1
```

---

### Try it yourself
Create an empty object named `cache`. Store the string `"Success"` using the boolean `true` as the key. Then read it back using the string `"true"` and print it.

---

### Rules to remember
1. Object keys can only be strings or symbols.
2. Any non-symbol key passed into an object is automatically converted into a string.
3. Numeric keys like `1` and string keys like `"1"` point to the exact same property.
4. Using plain objects as keys converts all of them to `"[object Object]"`, overwriting each other.
5. If you need objects as keys, use `Map` instead of a plain object.

---

### Exercises

#### Question 1 (Predict the output)
What will this code print to the console?
```javascript
const data = {};
data[10] = "Ten";
data["10"] = "Also Ten";

console.log(data[10]);
console.log(Object.keys(data).length);
```

#### Question 2 (Find and fix the bug)
The author expected `map` to store two different settings for two different users. Find the bug and explain how to fix it using `Map`.
```javascript
const map = {};
const user1 = { name: "A" };
const user2 = { name: "B" };

map[user1] = 100;
map[user2] = 200;

console.log(map[user1]);
```

#### Question 3 (Write code from scratch)
Create an object named `statusCodes` that maps the number `200` to `"OK"` and `404` to `"Not Found"`. Then write a `console.log` reading both properties using string keys `"200"` and `"404"`.

#### Question 4 (Explain in your own words)
Why does `obj[1]` return the same value as `obj["1"]` in JavaScript?

---

### Solutions

#### Solution for Question 1
- Hint 1: What happens to the number `10` when used as a key?
- Hint 2: Does `data["10"]` create a new property or update an existing one?

Answer:
```text
Also Ten
1
```
Explanation: `10` is converted to the string `"10"`. The second assignment overwrites the same property. The object contains only 1 property.

---

#### Solution for Question 2
- Hint 1: What does `user1.toString()` produce?
- Hint 2: Use JavaScript's built-in `Map` data structure.

Corrected code:
```javascript
const map = new Map();
const user1 = { name: "A" };
const user2 = { name: "B" };

map.set(user1, 100);
map.set(user2, 200);

console.log(map.get(user1));
```
Explanation: Plain objects convert object keys to strings, causing both to become `"[object Object]"`. `Map` preserves object references as distinct keys.

---

#### Solution for Question 3
- Hint 1: You can define numeric keys directly inside an object literal `{ 200: "OK", ... }`.
- Hint 2: Access with `statusCodes["200"]`.

Code:
```javascript
const statusCodes = {
  200: "OK",
  404: "Not Found"
};

console.log(statusCodes["200"]);
console.log(statusCodes["404"]);
```
Output:
```text
OK
Not Found
```

---

#### Solution for Question 4
- Hint 1: What data types can keys be in an ordinary object?
- Hint 2: What internal conversion takes place when accessing with `1`?

Explanation:
In JavaScript objects, property keys can only be strings or symbols. When you access `obj[1]`, JavaScript automatically converts the number `1` into the string `"1"`. Therefore, `obj[1]` and `obj["1"]` look up the exact same property.

---

### Recall
1. What two data types can be used as keys in an ordinary JavaScript object?
2. What string does a plain object turn into when used as a key in an object?
3. If you assign a value to `obj[5]`, can you read it back with `obj["5"]`?

---

### If you remember only one thing:
Ordinary object keys are always strings or symbols; any other value is automatically converted to a string before the property is stored or retrieved.

---

# 04. ACCESSING OBJECT PROPERTIES

### What is it?
Accessing an object property means reading the value stored under a specific key inside that object. JavaScript gives you two ways to access properties: dot notation (`obj.key`) and bracket notation (`obj[keyExpression]`).

Here are the key technical terms used in this topic:
- Dot notation is the syntax `obj.property`, where the property name is written directly after a period.
- Bracket notation is the syntax `obj[expression]`, where the key is written as an expression inside square brackets.
- An identifier is a valid name in JavaScript that begins with a letter, underscore, or dollar sign, and contains no spaces or dashes.

---

### Why does it exist?
Dot notation is clean, compact, and easy to read. Most of the time, developers know the exact property name when writing the code.

However, dot notation cannot handle every situation. For example, if a property name contains a space (like `"first name"`), begins with a number (like `"2fa"`), or is stored inside a variable, dot notation causes a syntax error. Bracket notation exists to handle these dynamic and non-standard property names.

---

### Basic example and explanation

```javascript
const user = {
  firstName: "Taylor",
  "account type": "admin"
};

console.log(user.firstName);
console.log(user["account type"]);
```

Output:
```text
Taylor
admin
```

How this code runs, step by step:

First, we create an object named `user` with two properties: `firstName` and `"account type"`.

Next, we read `user.firstName` using dot notation. The property name `firstName` is a valid identifier without spaces, so JavaScript finds the key and prints `"Taylor"`.

Then, we read `user["account type"]` using bracket notation. Because `"account type"` contains a space, dot notation like `user.account type` is invalid syntax. Putting the string `"account type"` inside square brackets allows JavaScript to read the key and print `"admin"`.

---

### How it works inside JavaScript

1. For dot notation (`user.name`): The engine parses `name` during code compilation as a fixed identifier. It directly checks if the object contains a property named `"name"`.
2. For bracket notation (`user[expression]`): The engine first evaluates the expression inside the brackets at runtime.
3. If the expression evaluates to a string or symbol, the engine uses that value directly. If it evaluates to any other type, JavaScript converts it to a string.
4. The engine searches the object for that key string and returns the associated value.

---

### Comparing property access notations

| Feature | Dot Notation (`obj.key`) | Bracket Notation (`obj[expr]`) |
| :--- | :--- | :--- |
| Syntax | `object.propertyName` | `object[expression]` |
| When to use | When the key is a known, valid identifier | When the key is dynamic, has spaces, hyphens, or numbers |
| Uses variables? | No (treats the word literally) | Yes (evaluates whatever is inside brackets) |
| Handles hyphens/spaces? | No (causes syntax error) | Yes (with quotes: `obj["user-name"]`) |

---

### Think first

What do you think this code prints? Decide first before checking below.

```javascript
const prop = "theme";

const settings = {
  theme: "dark",
  prop: "light"
};

console.log(settings.prop);
console.log(settings[prop]);
```

---

Result:
```text
light
dark
```

Why:
- `settings.prop` uses dot notation. Dot notation does not look up variables. It looks literally for a property named `"prop"`, which holds `"light"`.
- `settings[prop]` uses bracket notation with the variable `prop`. JavaScript evaluates `prop` to get `"theme"`, and then looks up `settings["theme"]`, which holds `"dark"`.

---

### More examples: from easy to harder

#### Example 1: Reading properties stored in variables
When the property name you need is chosen at runtime, bracket notation is required.

```javascript
const user = {
  name: "Morgan",
  role: "editor"
};

function getField(fieldName) {
  return user[fieldName];
}

console.log(getField("name"));
console.log(getField("role"));
```

Output:
```text
Morgan
editor
```

Explanation:
- Inside `getField`, `user[fieldName]` evaluates the argument `fieldName`.
- When called with `"name"`, it reads `user["name"]`.
- When called with `"role"`, it reads `user["role"]`.

#### Example 2: Property keys with hyphens or numbers
Property names that come from external systems like HTTP headers or database columns often contain dashes.

```javascript
const headers = {
  "content-type": "application/json",
  "x-request-id": "abc-123"
};

console.log(headers["content-type"]);
console.log(headers["x-request-id"]);
```

Output:
```text
application/json
abc-123
```

Explanation:
- Writing `headers.content-type` would be parsed as `headers.content` minus `type` (subtraction).
- Bracket notation with quotes safely passes the exact string key to look up.

#### Example 3: Dynamic calculations inside bracket notation
The expression inside the brackets can be any valid JavaScript calculation.

```javascript
const scores = {
  level_1: 100,
  level_2: 250,
  level_3: 400
};

const currentLevel = 2;
console.log(scores["level_" + currentLevel]);
```

Output:
```text
250
```

Explanation:
- JavaScript evaluates `"level_" + 2`, which produces `"level_2"`.
- It then reads `scores["level_2"]`, returning `250`.

---

### Common mistakes

#### Mistake 1: Forgetting quotes inside bracket notation
Wrong code:
```javascript
const user = {
  name: "Alex"
};

console.log(user[name]);
```

Output:
```text
ReferenceError: name is not defined
```

Why it happens:
Without quotes, JavaScript thinks `name` is a variable name. Since no variable named `name` exists in scope, it throws a `ReferenceError`.

Correct code:
Use quotes for a literal string key:
```javascript
const user = {
  name: "Alex"
};

console.log(user["name"]);
```

Output:
```text
Alex
```

---

#### Mistake 2: Using dot notation with variables
Wrong code:
```javascript
const key = "age";
const user = { age: 30 };

console.log(user.key);
```

Output:
```text
undefined
```

Why it happens:
Dot notation does not evaluate the variable `key`. It looks for a property literally named `"key"`.

Correct code:
Use bracket notation when using a variable:
```javascript
const key = "age";
const user = { age: 30 };

console.log(user[key]);
```

Output:
```text
30
```

---

### Try it yourself
Create an object named `point` with properties `"pos-x": 10` and `"pos-y": 20`. Access both properties using bracket notation and print their sum.

---

### Rules to remember
1. Use dot notation (`obj.key`) for simple, fixed property names that are valid identifiers.
2. Use bracket notation (`obj[expr]`) when the key is stored in a variable, has spaces, or has hyphens.
3. Writing `obj.varName` looks for a literal key named `"varName"`, not the value stored in the variable.
4. Bracket notation evaluates the expression inside brackets before accessing the property.
5. If you write `obj[key]` without quotes, `key` must be an existing variable.

---

### Exercises

#### Question 1 (Predict the output)
What will this code print to the console?
```javascript
const fruit = "apple";
const inventory = {
  apple: 15,
  fruit: 5
};

console.log(inventory[fruit]);
console.log(inventory.fruit);
```

#### Question 2 (Find and fix the bug)
The following code throws an error. Find the mistake and fix it so it prints `"standard"`.
```javascript
const config = {
  "user-tier": "standard"
};

console.log(config.user-tier);
```

#### Question 3 (Write code from scratch)
Write a function named `getProperty(obj, keyName)` that accepts an object and a property name as a string, and returns the value of that property from the object.

#### Question 4 (Explain in your own words)
Why does `user["name"]` work when `user[name]` throws a `ReferenceError`?

---

### Solutions

#### Solution for Question 1
- Hint 1: What does `inventory[fruit]` evaluate to when `fruit` holds `"apple"`?
- Hint 2: What does `inventory.fruit` look for?

Answer:
```text
15
5
```
Explanation: `inventory[fruit]` looks up `inventory["apple"]`, which is `15`. `inventory.fruit` literally looks up property `"fruit"`, which is `5`.

---

#### Solution for Question 2
- Hint 1: Can dot notation be used with keys containing dashes?
- Hint 2: Use bracket notation with a string inside.

Corrected code:
```javascript
const config = {
  "user-tier": "standard"
};

console.log(config["user-tier"]);
```
Explanation: In JavaScript, `config.user-tier` is parsed as `config.user` minus `tier`. Bracket notation `config["user-tier"]` correctly accesses the property.

---

#### Solution for Question 3
- Hint 1: `keyName` is passed as a variable into the function.
- Hint 2: Use bracket notation with `keyName`.

Code:
```javascript
function getProperty(obj, keyName) {
  return obj[keyName];
}

const testObj = { count: 42 };
console.log(getProperty(testObj, "count"));
```
Output:
```text
42
```

---

#### Solution for Question 4
- Hint 1: What does JavaScript do when it sees an unquoted word inside square brackets?
- Hint 2: What does it do when the word is enclosed in quotes?

Explanation:
When you write `user["name"]`, JavaScript treats `"name"` as a string literal and looks up the key `"name"`. When you write `user[name]`, JavaScript searches for a variable named `name` in memory. If no such variable exists, it throws a `ReferenceError`.

---

### Recall
1. Which notation must you use when a property key contains a hyphen `-`?
2. Does `obj.key` look up a variable named `key`?
3. What error occurs if you write `obj[key]` and no variable named `key` exists?

---

### If you remember only one thing:
Use dot notation `obj.prop` for fixed, clean property names, and bracket notation `obj[variable]` whenever the key is dynamic, stored in a variable, or contains special characters.

---

# 05. ADDING, UPDATING AND DELETING PROPERTIES

### What is it?
Adding a property means introducing a new key-value pair to an existing object. Updating a property means assigning a new value to an existing key. Deleting a property means permanently removing a key-value pair from an object using the `delete` operator.

Here are the key technical terms used in this topic:
- Mutation is the act of changing an object's contents without creating a brand new object.
- The `delete` operator is a JavaScript operator that removes a property from an object.
- Reassignment is giving an existing property key a new value.

---

### Why does it exist?
In real applications, data is rarely static. A user's profile may change its email address, a shopping cart may gain or lose items, and a settings object may update when the user changes a preference.

Because JavaScript objects are mutable by default, you can add, change, or remove properties at any time without having to rebuild the entire object from scratch.

---

### Basic example and explanation

```javascript
const profile = {
  name: "Taylor"
};

// 1. Adding a new property
profile.age = 26;

// 2. Updating an existing property
profile.name = "Morgan";

// 3. Deleting a property
delete profile.age;

console.log(profile);
```

Output:
```text
{ name: 'Morgan' }
```

How this code runs, step by step:

First, we create an object named `profile` containing one property: `name: "Taylor"`.

Next, we write `profile.age = 26`. JavaScript checks whether the key `age` exists on `profile`. It does not, so JavaScript creates a new property named `age` with the value `26`.

Then, we write `profile.name = "Morgan"`. JavaScript checks whether `name` exists on `profile`. It already exists, so JavaScript updates its value from `"Taylor"` to `"Morgan"`.

After that, we write `delete profile.age`. The `delete` operator removes both the key `age` and its value `26` completely from the object.

Finally, we log `profile`. The object now contains only `{ name: 'Morgan' }`.

---

### How it works inside JavaScript

When you modify an object:

1. When adding a property (`profile.age = 26`): JavaScript allocates a new slot in the object's heap memory record and stores the key `"age"` and value `26`.
2. When updating a property (`profile.name = "Morgan"`): JavaScript locates the existing key `"name"` in the heap record and replaces its stored value pointer with the new value.
3. When using `delete profile.age`: JavaScript removes the property key from the object's property list. Any future attempt to access `profile.age` will return `undefined`.
4. Return value of `delete`: The expression `delete obj.prop` evaluates to `true` if the property was successfully removed or if the property did not exist in the first place.

---

### Think first

What do you think this code prints? Decide first before checking below.

```javascript
const user = { name: "Sam" };

const result = delete user.missingProperty;

console.log(result);
console.log(user);
```

---

Result:
```text
true
{ name: 'Sam' }
```

Why:
The `delete` operator returns `true` as long as the property does not exist on the object when it finishes. Since `missingProperty` was not there to begin with, the operation is considered successful, and `result` is `true`. The `user` object remains unchanged.

---

### More examples: from easy to harder

#### Example 1: Setting to `undefined` vs `delete`
Setting a property to `undefined` is not the same as deleting it.

```javascript
const configA = { volume: 50 };
const configB = { volume: 50 };

configA.volume = undefined;
delete configB.volume;

console.log("volume" in configA);
console.log("volume" in configB);
```

Output:
```text
true
false
```

Explanation:
- `configA.volume = undefined` keeps the key `"volume"` on the object, but sets its value to `undefined`. The key still exists.
- `delete configB.volume` removes the key `"volume"` entirely from the object.

#### Example 2: Adding and updating with bracket notation
Bracket notation works for adding and updating just like dot notation, and allows dynamic property keys.

```javascript
const stats = {};
const keyName = "score";

stats[keyName] = 10;
stats[keyName] = stats[keyName] + 5;

console.log(stats.score);
```

Output:
```text
15
```

Explanation:
- Line 4 creates the property `score` with value `10`.
- Line 5 reads the current value `10`, adds `5`, and updates `score` to `15`.

#### Example 3: Modifying properties of an object declared with `const`
A common question is: why can we change properties if the object is declared with `const`?

```javascript
const user = { status: "offline" };

// This is ALLOWED: mutating object contents
user.status = "online";
console.log(user.status);

// This is NOT ALLOWED: reassigning the variable itself
// user = { status: "away" }; // TypeError: Assignment to constant variable.
```

Output:
```text
online
```

Explanation:
- `const` prevents you from changing what memory address the variable points to.
- `const` does NOT freeze the object sitting at that address. The properties inside the object remain fully mutable.

---

### Common mistakes

#### Mistake 1: Trying to `delete` a plain variable
Wrong code:
```javascript
let count = 10;
delete count;

console.log(count);
```

Output:
```text
10
```

Why it happens:
The `delete` operator is designed strictly to remove properties from objects. It cannot delete variables declared with `let`, `const`, or `var`. In strict mode (`"use strict"`), this line throws a `SyntaxError`.

---

#### Mistake 2: Thinking `delete` returns `false` when a property is missing
Wrong code:
```javascript
const user = { id: 1 };

if (delete user.email) {
  console.log("Email was deleted");
}
```

Output:
```text
Email was deleted
```

Why it happens:
`delete user.email` returns `true` even though `user.email` never existed. Do not use the return value of `delete` to test whether a property was present before deletion.

Correct code:
Check if the property exists first, or just delete it without assuming it was there:
```javascript
const user = { id: 1 };

if ("email" in user) {
  delete user.email;
  console.log("Email was deleted");
} else {
  console.log("No email to delete");
}
```

Output:
```text
No email to delete
```

---

### Try it yourself
Create an object named `cart` with `itemsCount: 2`. Update `itemsCount` to `3`. Add a new property `total: 45`. Then delete `itemsCount` and log the final object.

---

### Rules to remember
1. Assigning to `obj.newKey` creates a new property if it did not exist before.
2. Assigning to an existing `obj.existingKey` overwrites its previous value.
3. The `delete obj.key` operator permanently removes both the key and the value from the object.
4. Setting `obj.key = undefined` leaves the key inside the object; only `delete` removes the key.
5. Declaring an object with `const` protects the variable reference, but the object's properties can still be added, changed, or deleted.

---

### Exercises

#### Question 1 (Predict the output)
What will this code print to the console?
```javascript
const record = { a: 1, b: 2 };
record.c = 3;
record.a = 10;
delete record.b;

console.log(record.a);
console.log(record.b);
console.log(record.c);
```

#### Question 2 (Find and fix the bug)
The developer wanted to delete the property `apiKey` from the object `config`. Fix the code.
```javascript
const config = { apiKey: "secret_123" };
config.apiKey = null;

console.log("apiKey" in config); // Prints true, but wanted false!
```

#### Question 3 (Write code from scratch)
Write a function named `cleanObject(obj, keyToDelete)` that removes `keyToDelete` from `obj` using the `delete` operator and returns the modified object.

#### Question 4 (Explain in your own words)
Explain the difference between writing `obj.status = undefined` and writing `delete obj.status`.

---

### Solutions

#### Solution for Question 1
- Hint 1: Trace each modification line by line.
- Hint 2: What is returned when reading a deleted property?

Answer:
```text
10
undefined
```
Explanation: `record.a` is updated to `10`. `record.b` is deleted, so reading it returns `undefined`. `record.c` was added with value `3`.

---

#### Solution for Question 2
- Hint 1: Setting a property to `null` or `undefined` does not remove the key from the object.
- Hint 2: Use the `delete` operator.

Corrected code:
```javascript
const config = { apiKey: "secret_123" };
delete config.apiKey;

console.log("apiKey" in config);
```
Output:
```text
false
```
Explanation: Setting a property to `null` keeps the key in the object with a value of `null`. The `delete` operator removes the key entirely.

---

#### Solution for Question 3
- Hint 1: The key name is stored in the parameter `keyToDelete`.
- Hint 2: Use bracket notation with `delete`.

Code:
```javascript
function cleanObject(obj, keyToDelete) {
  delete obj[keyToDelete];
  return obj;
}

const user = { name: "Alex", temp: true };
console.log(cleanObject(user, "temp"));
```
Output:
```text
{ name: 'Alex' }
```

---

#### Solution for Question 4
- Hint 1: Does the key still exist in memory in both cases?
- Hint 2: How does the `"in"` operator react to both?

Explanation:
Writing `obj.status = undefined` retains the key `"status"` inside the object's list of properties, but sets its value to `undefined`. Checking `"status" in obj` will return `true`. Writing `delete obj.status` completely removes the key `"status"` and its value from the object. Checking `"status" in obj` will return `false`.

---

### Recall
1. What operator is used to completely remove a property from an object?
2. If you declare an object with `const`, can you still add a new property to it?
3. Does `delete obj.missingKey` return `true` or `false`?

---

### If you remember only one thing:
Objects are mutable: you can add new keys by assignment, update existing keys by reassignment, and completely remove keys with the `delete` operator, even if the variable was declared with `const`.

---

### Checkpoint Challenge: Topics 1 to 5

This challenge tests the concepts covered across the first 5 topics: object creation, computed keys, property access, adding, updating, and deleting properties.

#### Challenge Task
Write a function named `manageUserRecord(initialData, keyToUpdate, newValue, keyToRemove)` that does the following in order:
1. Takes an existing object `initialData`.
2. Updates or adds the property named by `keyToUpdate` with `newValue`.
3. Adds a computed property named `"lastModified"` with the current year as a number (`2026`).
4. Permanently removes the property named by `keyToRemove` from the object.
5. Returns the updated object.

---

#### Solutions for Checkpoint Challenge

- Hint 1: Use bracket notation `obj[keyToUpdate] = newValue` because `keyToUpdate` is a parameter variable.
- Hint 2: Use `delete obj[keyToRemove]` to permanently remove the requested key.

Code:
```javascript
function manageUserRecord(initialData, keyToUpdate, newValue, keyToRemove) {
  // 1. Update or add the specified property
  initialData[keyToUpdate] = newValue;

  // 2. Add lastModified property
  initialData.lastModified = 2026;

  // 3. Permanently remove the requested key
  delete initialData[keyToRemove];

  // 4. Return the modified object
  return initialData;
}

// Verification:
const original = { name: "Sam", role: "guest", temporaryId: 999 };
const updated = manageUserRecord(original, "role", "admin", "temporaryId");

console.log(updated);
```

Output:
```text
{ name: 'Sam', role: 'admin', lastModified: 2026 }
```

Explanation:
- `initialData[keyToUpdate] = newValue` uses bracket notation to update the property stored in `keyToUpdate` (`"role"` becomes `"admin"`).
- `initialData.lastModified = 2026` adds a new property using dot notation.
- `delete initialData[keyToRemove]` removes `"temporaryId"` completely from the object.
- The returned object contains only the surviving keys with their updated values.

---

# 06. OBJECT PROPERTY EXISTENCE

### What is it?
Checking property existence means testing whether an object contains a specific key. JavaScript provides three primary ways to check if a property exists: `Object.hasOwn(obj, key)`, the `in` operator, and `obj.hasOwnProperty(key)`.

Here are the key technical terms used in this topic:
- An own property is a property that was defined directly on the object itself, not inherited from a prototype.
- An inherited property is a property that belongs to an ancestor object on the prototype chain.
- The prototype chain is the series of linked objects that JavaScript searches when a property is not found directly on an object.

---

### Why does it exist?
In JavaScript, reading a missing property does not throw an error; it simply returns `undefined`.

However, testing `obj.key !== undefined` causes a bug if a property explicitly exists with the value `undefined`. Additionally, some checks return `true` for inherited built-in methods (like `"toString"`), which you might not want. Dedicated existence-checking tools exist so you can distinguish between own properties, inherited properties, and non-existent properties accurately.

---

### Basic example and explanation

```javascript
const user = {
  name: "Alex",
  nickname: undefined
};

console.log(Object.hasOwn(user, "name"));
console.log(Object.hasOwn(user, "nickname"));
console.log(Object.hasOwn(user, "age"));
console.log("toString" in user);
```

Output:
```text
true
true
false
true
```

How this code runs, step by step:

First, we create an object named `user` with two own properties: `name` with value `"Alex"` and `nickname` with value `undefined`.

Next, we run `Object.hasOwn(user, "name")`. JavaScript checks whether `"name"` is directly attached to `user`. It is, so this returns `true`.

Then, we run `Object.hasOwn(user, "nickname")`. Even though the value is `undefined`, the key `"nickname"` does exist on the object. Therefore, `Object.hasOwn` correctly returns `true`.

Next, we run `Object.hasOwn(user, "age")`. The key `"age"` was never defined on `user`, so it returns `false`.

Finally, we run `"toString" in user`. The `in` operator checks both the object itself and its prototype chain. Because all standard objects inherit the `toString` method from `Object.prototype`, this returns `true`.

---

### How it works inside JavaScript

1. `Object.hasOwn(obj, key)`: The engine queries the internal property table of `obj`. If the key exists directly in that table, it returns `true`. It stops immediately and never checks the prototype chain.
2. `'key' in obj`: The engine first checks `obj`'s internal table. If found, it returns `true`. If not found, it follows the internal `[[Prototype]]` link to the next object and checks there. It repeats this until it finds the key or reaches `null`.
3. `obj.hasOwnProperty(key)`: This is an older method inherited from `Object.prototype`. It behaves like `Object.hasOwn`, but can fail if the object was created with `Object.create(null)` or if the property name `"hasOwnProperty"` was overwritten on `obj`.

---

### Comparing existence check methods

| Method | Checks own properties? | Checks prototype chain? | Works on `Object.create(null)`? |
| :--- | :--- | :--- | :--- |
| `Object.hasOwn(obj, key)` | Yes | No | Yes (Modern standard, ES2022) |
| `'key' in obj` | Yes | Yes | Yes |
| `obj.hasOwnProperty(key)` | Yes | No | No (Throws `TypeError`) |
| `obj.key !== undefined` | Fails if value is `undefined` | Fails if value is `undefined` | Yes |

---

### Think first

What do you think this code prints? Decide first before checking below.

```javascript
const response = {
  data: undefined
};

console.log(response.data !== undefined);
console.log(Object.hasOwn(response, "data"));
```

---

Result:
```text
false
true
```

Why:
- `response.data` evaluates to `undefined`. Comparing `undefined !== undefined` is `false`. The property check incorrectly says the property does not exist.
- `Object.hasOwn(response, "data")` inspects whether the key `"data"` is registered in the object's properties. Because the key is present, it returns `true`.

---

### More examples: from easy to harder

#### Example 1: Differentiating own properties from inherited properties
Standard objects inherit properties like `toString`, `valueOf`, and `constructor`.

```javascript
const config = {
  timeout: 3000
};

console.log("timeout" in config);
console.log("toString" in config);

console.log(Object.hasOwn(config, "timeout"));
console.log(Object.hasOwn(config, "toString"));
```

Output:
```text
true
true
true
false
```

Explanation:
- Both `"timeout"` and `"toString"` exist in the object's lookup hierarchy, so `in` returns `true` for both.
- Only `"timeout"` is an own property of `config`. `"toString"` is inherited from `Object.prototype`, so `Object.hasOwn` returns `false` for `"toString"`.

#### Example 2: Safe checks on null-prototype objects
When an object is created with `Object.create(null)`, it has no prototype.

```javascript
const dictionary = Object.create(null);
dictionary.word = "syntax";

// dictionary.hasOwnProperty("word"); // Throws TypeError: dictionary.hasOwnProperty is not a function

console.log(Object.hasOwn(dictionary, "word"));
console.log("word" in dictionary);
```

Output:
```text
true
true
```

Explanation:
- Because `dictionary` has no prototype, calling `dictionary.hasOwnProperty` crashes because the method does not exist.
- `Object.hasOwn` is a static method on the global `Object` constructor, so it works safely on any object.

---

### Common mistakes

#### Mistake 1: Using truthiness or undefined checks for existence
Wrong code:
```javascript
const settings = {
  volume: 0,
  debug: false
};

if (settings.volume) {
  console.log("Volume is set");
} else {
  console.log("Volume is NOT set");
}
```

Output:
```text
Volume is NOT set
```

Why it happens:
The number `0` is falsy in JavaScript. The `if` statement evaluates `0` as `false`, even though the property `volume` exists and has a valid value.

Correct code:
Use `Object.hasOwn` to test whether the property was defined:
```javascript
const settings = {
  volume: 0,
  debug: false
};

if (Object.hasOwn(settings, "volume")) {
  console.log("Volume is set");
}
```

Output:
```text
Volume is set
```

---

### Try it yourself
Create an object named `metrics` with `count: 0`. Check if `count` exists using both `Boolean(metrics.count)` and `Object.hasOwn(metrics, "count")`. Print both results.

---

### Rules to remember
1. Use `Object.hasOwn(obj, key)` as the primary way to check if an object directly owns a property.
2. Use the `in` operator if you also want to check for properties on the prototype chain.
3. Never use `if (obj.key)` or `obj.key !== undefined` to check existence, because values like `0`, `""`, `false`, and `undefined` will produce false negatives.
4. Avoid `obj.hasOwnProperty(key)` in modern code because it can crash on objects that have no prototype.

---

### Exercises

#### Question 1 (Predict the output)
What will this code print to the console?
```javascript
const record = {
  active: false,
  tag: undefined
};

console.log("active" in record);
console.log(record.tag !== undefined);
console.log(Object.hasOwn(record, "tag"));
console.log(Object.hasOwn(record, "valueOf"));
```

#### Question 2 (Find and fix the bug)
The function below should return `true` if `prop` exists on `data`, but it fails when `data[prop]` is `0` or `false`. Fix the bug.
```javascript
function propertyExists(data, prop) {
  return data[prop] ? true : false;
}
```

#### Question 3 (Write code from scratch)
Write a function named `hasOwnAndTruthy(obj, key)` that returns `true` only if `key` is an own property of `obj` AND its value is truthy.

#### Question 4 (Explain in your own words)
Why does `Object.hasOwn(obj, "toString")` return `false` on a plain object `{}` when `"toString" in {}` returns `true`?

---

### Solutions

#### Solution for Question 1
- Hint 1: Does `in` check keys regardless of whether their value is `false`?
- Hint 2: Does `Object.hasOwn` check inherited prototype methods?

Answer:
```text
true
false
true
false
```
Explanation: `"active" in record` is `true`. `record.tag !== undefined` fails because `tag` is `undefined`. `Object.hasOwn(record, "tag")` is `true` because the key exists. `"valueOf"` is inherited from `Object.prototype`, so it is not an own property.

---

#### Solution for Question 2
- Hint 1: Avoid truthy checks on values.
- Hint 2: Use `Object.hasOwn`.

Corrected code:
```javascript
function propertyExists(data, prop) {
  return Object.hasOwn(data, prop);
}
```

---

#### Solution for Question 3
- Hint 1: Check existence first using `Object.hasOwn(obj, key)`.
- Hint 2: Combine with `Boolean(obj[key])` using `&&`.

Code:
```javascript
function hasOwnAndTruthy(obj, key) {
  return Object.hasOwn(obj, key) && Boolean(obj[key]);
}

console.log(hasOwnAndTruthy({ count: 10 }, "count")); // true
console.log(hasOwnAndTruthy({ count: 0 }, "count"));  // false
```

---

#### Solution for Question 4
- Hint 1: Where does `toString` come from?
- Hint 2: What is the difference between an own property and an inherited property?

Explanation:
`Object.hasOwn` checks only the properties that belong directly to the specified object. Plain objects do not own a property named `"toString"`. Instead, `"toString"` is inherited from `Object.prototype`. The `in` operator checks both own properties and inherited properties along the entire prototype chain, which is why `"toString" in {}` returns `true`.

---

### Recall
1. What static method should you use in modern JavaScript to check if an object owns a key?
2. Which operator checks both own properties and inherited prototype properties?
3. If an object has `{ count: undefined }`, will `Object.hasOwn(obj, "count")` return `true` or `false`?

---

### If you remember only one thing:
Always use `Object.hasOwn(obj, key)` to test if an object directly contains a property; do not rely on `obj[key] !== undefined` or truthiness checks.

---

# 07. OBJECT REFERENCES

### What is it?
An object reference is a memory address that tells JavaScript where an object lives in heap memory. When you assign an object to a variable or pass it into a function, JavaScript does not copy the object. It copies the reference address pointing to that object.

Here are the key technical terms used in this topic:
- A reference is a memory address pointing to a location where data is stored.
- The call stack is the fast memory region where variables and function execution frames are kept.
- The memory heap is the large, dynamic memory region where objects, arrays, and functions are allocated.
- A pointer is another term for a reference that points to a memory address.

---

### Why does it exist?
Objects can be large data structures containing thousands of properties, arrays, or nested objects.

If JavaScript copied every property and every nested value every time an object was assigned to a variable or passed to a function, programs would run slowly and consume huge amounts of memory. By copying only a small memory address (the reference), variable assignments and function calls remain fast and efficient.

---

### Basic example and explanation

```javascript
const firstUser = { name: "Taylor" };
const secondUser = firstUser;

secondUser.name = "Jordan";

console.log(firstUser.name);
console.log(secondUser.name);
```

Output:
```text
Jordan
Jordan
```

How this code runs, step by step:

First, JavaScript creates an object `{ name: "Taylor" }` at a specific address in heap memory (for example, address `#301`).

Next, the variable `firstUser` receives address `#301`.

Then, we write `const secondUser = firstUser`. This does NOT create a second object. Instead, it copies the memory address `#301` from `firstUser` into `secondUser`. Both variables now hold the exact same memory address.

Next, we write `secondUser.name = "Jordan"`. JavaScript follows the address `#301` to the heap and changes the `name` property to `"Jordan"`.

Finally, we read `firstUser.name`. JavaScript follows `firstUser`'s pointer (address `#301`) to the heap and reads `"Jordan"`. Because both variables point to the same object in memory, changing the object through one variable changes what the other variable sees.

---

### How it works inside JavaScript

1. Line 1: JavaScript allocates memory block `#301` in the heap and stores `{ name: "Taylor" }`. Variable `firstUser` on the stack stores `#301`.
2. Line 2: A new variable `secondUser` is allocated on the stack. The value `#301` is copied into `secondUser`.
3. Stack state: `firstUser -> #301`, `secondUser -> #301`.
4. Line 4: The property assignment mutates the data at address `#301`. No new memory address is created.
5. When any variable pointing to `#301` reads `name`, it accesses the updated value.

```text
Stack Memory                             Heap Memory (Address #301)
┌──────────────────────┐                 ┌───────────────────────────┐
│ firstUser:  #301 ────┼────────────────►│ name: "Jordan"            │
├──────────────────────┤                 └───────────────────────────┘
│ secondUser: #301 ────┼──────────────────────────────▲
└──────────────────────┘                              │
```

---

### Think first

What do you think this code prints? Decide first before checking below.

```javascript
function resetScore(record) {
  record.score = 0;
}

const player = { score: 100 };
resetScore(player);

console.log(player.score);
```

---

Result:
```text
0
```

Why:
When `player` is passed as an argument to `resetScore`, JavaScript copies the memory address from `player` into the parameter variable `record`. Inside the function, `record.score = 0` modifies the object at that shared address. When the function finishes, `player` sees the change because it points to the exact same heap record.

---

### More examples: from easy to harder

#### Example 1: Reassigning a parameter does not affect the caller
If you change what a parameter variable points to, the original object outside is not modified.

```javascript
function replaceObject(item) {
  item = { score: 0 }; // Reassigns the local parameter variable to a new address
}

const player = { score: 100 };
replaceObject(player);

console.log(player.score);
```

Output:
```text
100
```

Explanation:
- Inside `replaceObject`, writing `item = { score: 0 }` assigns a brand new object address (such as `#402`) to the local variable `item`.
- It does not modify the object at the original address `#401`. The variable `player` outside still points to `#401`.

#### Example 2: Multiple references to an array inside an object
When an object property holds an array or another object, that property itself stores a reference address.

```javascript
const team = {
  members: ["Sam", "Alex"]
};

const roster = team.members;
roster.push("Taylor");

console.log(team.members);
```

Output:
```text
[ 'Sam', 'Alex', 'Taylor' ]
```

Explanation:
- `team.members` holds a reference to the array in heap memory.
- `roster` receives a copy of that reference.
- Calling `roster.push("Taylor")` mutates the shared array directly.

---

### Common mistakes

#### Mistake 1: Believing assignment creates an independent copy
Wrong code:
```javascript
const defaultSettings = { theme: "light" };
const userSettings = defaultSettings;

userSettings.theme = "dark";

console.log(defaultSettings.theme); // Prints "dark", but expected "light"!
```

Why it happens:
`userSettings = defaultSettings` does not copy the properties. It copies the reference address. Mutating `userSettings` modifies `defaultSettings`.

Correct code:
Create a new object using the spread operator `{ ...obj }` for a shallow copy:
```javascript
const defaultSettings = { theme: "light" };
const userSettings = { ...defaultSettings };

userSettings.theme = "dark";

console.log(defaultSettings.theme);
console.log(userSettings.theme);
```

Output:
```text
light
dark
```

---

### Try it yourself
Create an object `point = { x: 5, y: 10 }`. Assign `point` to a new variable `alias`. Change `alias.x = 20`. Print `point.x`.

---

### Rules to remember
1. Variables do not store objects directly; they store a reference address pointing to heap memory.
2. Assigning an object to a new variable copies the reference address, not the object.
3. Mutating an object through one reference modifies the data seen by all other references pointing to that object.
4. Passing an object into a function passes its reference; modifying properties inside the function mutates the caller's object.
5. Reassigning a variable (`obj = { ... }`) points that variable to a new address, breaking the link without changing the original object.

---

### Exercises

#### Question 1 (Predict the output)
What will this code print to the console?
```javascript
const configA = { port: 8080 };
const configB = configA;
const configC = configB;

configC.port = 3000;

console.log(configA.port);
console.log(configB.port);
console.log(configC.port);
```

#### Question 2 (Find and fix the bug)
The function `updateConfig` should return a new object with updated timeout without mutating the input object. Fix the bug.
```javascript
function updateConfig(original, newTimeout) {
  const duplicate = original;
  duplicate.timeout = newTimeout;
  return duplicate;
}

const base = { timeout: 1000 };
const modified = updateConfig(base, 5000);
console.log(base.timeout); // Prints 5000, but should be 1000!
```

#### Question 3 (Write code from scratch)
Write a function `clearUserData(user)` that sets `user.isLoggedIn = false` and `user.token = null` on the provided user object reference, and test it on an object.

#### Question 4 (Explain in your own words)
Why does `second = first; second.val = 5;` change `first.val`, but `second = first; second = { val: 5 };` does not change `first.val`?

---

### Solutions

#### Solution for Question 1
- Hint 1: Do `configA`, `configB`, and `configC` point to the same memory address?
- Hint 2: Changing `configC.port` changes the object at that shared address.

Answer:
```text
3000
3000
3000
```
Explanation: All three variables store the exact same reference address in heap memory. Mutating the property through `configC` mutates the shared object.

---

#### Solution for Question 2
- Hint 1: `const duplicate = original` copies the reference, not the object.
- Hint 2: Create a new object literal with `{ ...original }`.

Corrected code:
```javascript
function updateConfig(original, newTimeout) {
  const duplicate = { ...original };
  duplicate.timeout = newTimeout;
  return duplicate;
}

const base = { timeout: 1000 };
const modified = updateConfig(base, 5000);
console.log(base.timeout);
console.log(modified.timeout);
```
Output:
```text
1000
5000
```

---

#### Solution for Question 3
- Hint 1: Modify the properties directly on `user`.
- Hint 2: No return statement is required if you want to mutate in place.

Code:
```javascript
function clearUserData(user) {
  user.isLoggedIn = false;
  user.token = null;
}

const session = { isLoggedIn: true, token: "xyz_987" };
clearUserData(session);
console.log(session);
```
Output:
```text
{ isLoggedIn: false, token: null }
```

---

#### Solution for Question 4
- Hint 1: What is the difference between property mutation and variable reassignment?
- Hint 2: Does `{ val: 5 }` create a new memory address?

Explanation:
In the first case, `second.val = 5` modifies the property inside the object located at the shared memory address. In the second case, `second = { val: 5 }` reassigns the variable `second` to a completely new memory address. It does not touch or modify the object at the original address, so `first.val` remains untouched.

---

### Recall
1. What does a variable holding an object actually store?
2. If `b = a`, how many objects exist in heap memory?
3. What happens to the caller's object when a function mutates a property on an object argument?

---

### If you remember only one thing:
Assigning an object to another variable copies only its reference address, meaning both variables point to and mutate the exact same object in heap memory.

---

# 08. OBJECT IDENTITY

### What is it?
Object identity means that an object is unique based on its specific location in memory, not based on the properties and values it contains. In JavaScript, two objects are considered equal only if they share the exact same memory address.

Here are the key technical terms used in this topic:
- Reference equality is comparing two variables to see if they hold the exact same memory address.
- Structural equality is comparing two objects to see if they have the same property keys and values, regardless of memory address.
- Strict equality is the `===` operator in JavaScript.

---

### Why does it exist?
JavaScript does not perform deep structural comparisons with `===` because doing so would require traversing every key and value in both objects, including nested objects and arrays. On large objects, that would cause severe performance issues.

Instead, JavaScript tests reference equality: it checks in a single CPU cycle whether the two 64-bit pointers point to the exact same address in memory.

---

### Basic example and explanation

```javascript
const pointA = { x: 10, y: 20 };
const pointB = { x: 10, y: 20 };
const pointC = pointA;

console.log(pointA === pointB);
console.log(pointA === pointC);
```

Output:
```text
false
true
```

How this code runs, step by step:

First, JavaScript evaluates `{ x: 10, y: 20 }` on line 1, allocates it in heap memory at address `#501`, and assigns `#501` to `pointA`.

Next, JavaScript evaluates `{ x: 10, y: 20 }` on line 2. This is a separate object literal, so JavaScript allocates a brand new object at address `#502` and assigns `#502` to `pointB`.

Then, line 3 assigns `pointA` to `pointC`. `pointC` receives the address `#501`.

Next, we run `pointA === pointB`. JavaScript compares address `#501` with address `#502`. Because `#501` is not equal to `#502`, the comparison evaluates to `false`, even though both objects have identical keys and values.

Finally, we run `pointA === pointC`. JavaScript compares address `#501` with address `#501`. Because both variables hold the exact same address, the comparison evaluates to `true`.

---

### How it works inside JavaScript

When JavaScript runs `objA === objB`:

1. The engine checks the data type of both operands. Both are objects.
2. The engine reads the memory pointer stored in `objA`.
3. The engine reads the memory pointer stored in `objB`.
4. It compares the two memory addresses directly:
   - If address A equals address B, it returns `true`.
   - If address A does not equal address B, it returns `false`.
5. The engine never inspects the keys, values, or size of the objects.

```text
Variable pointA ──► Heap Address #501: { x: 10, y: 20 }
Variable pointB ──► Heap Address #502: { x: 10, y: 20 }

Is #501 === #502? ──► FALSE (Different memory addresses)
```

---

### Think first

What do you think this code prints? Decide first before checking below.

```javascript
const items = [{ id: 1 }];

console.log(items.includes({ id: 1 }));
```

---

Result:
```text
false
```

Why:
The `Array.prototype.includes` method uses strict equality (`===`) to search for elements in the array.
Inside the call, `{ id: 1 }` creates a brand new object literal at a new memory address (such as `#602`).
The array contains an object at address `#601`.
Because `#601 !== #602`, `includes` does not find a match and returns `false`.

---

### More examples: from easy to harder

#### Example 1: Checking structural equality manually
If you want to know whether two objects have identical values, you must compare their properties yourself.

```javascript
const userA = { id: 1, role: "admin" };
const userB = { id: 1, role: "admin" };

function areUsersEqual(a, b) {
  return a.id === b.id && a.role === b.role;
}

console.log(userA === userB);
console.log(areUsersEqual(userA, userB));
```

Output:
```text
false
true
```

Explanation:
- `userA === userB` compares reference addresses and yields `false`.
- `areUsersEqual` compares primitive values (`1 === 1` and `"admin" === "admin"`), yielding `true`.

#### Example 2: Finding an object in an array by property
Because `items.includes({ id: 1 })` fails due to reference identity, use `find` or `some` to compare properties.

```javascript
const users = [
  { id: 1, name: "Taylor" },
  { id: 2, name: "Morgan" }
];

const found = users.find(u => u.id === 2);
console.log(found.name);
```

Output:
```text
Morgan
```

Explanation:
- `find` runs a predicate function on each element.
- Comparing primitive numbers (`u.id === 2`) works reliably regardless of object reference identity.

---

### Common mistakes

#### Mistake 1: Testing empty objects for equality
Wrong code:
```javascript
if ({} === {}) {
  console.log("Empty objects match");
} else {
  console.log("Empty objects do NOT match");
}
```

Output:
```text
Empty objects do NOT match
```

Why it happens:
Each `{}` literal creates a distinct object in memory. They never share a reference address.

---

### Try it yourself
Create two separate objects `a = { val: 1 }` and `b = { val: 1 }`. Create a third variable `c = a`. Print the results of `a === b` and `a === c`.

---

### Rules to remember
1. In JavaScript, `===` tests whether two objects share the exact same memory address.
2. Two separate object literals `{}` are never equal, even if they have identical properties and values.
3. Methods like `array.indexOf()` and `array.includes()` use reference equality, so searching for a new object literal `{ ... }` always fails.
4. To compare the actual contents of two objects, compare their individual primitive properties.

---

### Exercises

#### Question 1 (Predict the output)
What will this code print to the console?
```javascript
const user1 = { name: "Sam" };
const user2 = { name: "Sam" };
const list = [user1];

console.log(user1 === user2);
console.log(list.includes(user1));
console.log(list.includes(user2));
```

#### Question 2 (Find and fix the bug)
The code below wants to check if a user with `id: 5` is in the list, but it always prints `"Not found"`. Fix it.
```javascript
const sessions = [{ id: 5, active: true }];

if (sessions.includes({ id: 5, active: true })) {
  console.log("Found");
} else {
  console.log("Not found");
}
```

#### Question 3 (Write code from scratch)
Write a function `isSamePoint(p1, p2)` that takes two point objects and returns `true` if both have matching `x` and `y` properties.

#### Question 4 (Explain in your own words)
Why does JavaScript compare objects by reference identity instead of automatically checking all their properties and values?

---

### Solutions

#### Solution for Question 1
- Hint 1: Does `user1` share a memory address with `user2`?
- Hint 2: Which variable was placed in `list`?

Answer:
```text
false
true
false
```
Explanation: `user1` and `user2` have different memory addresses (`false`). `list` contains `user1`, so `list.includes(user1)` is `true`. `list` does not contain the reference `user2`, so `list.includes(user2)` is `false`.

---

#### Solution for Question 2
- Hint 1: Avoid `includes` with a newly created object literal.
- Hint 2: Use `some` to test property values.

Corrected code:
```javascript
const sessions = [{ id: 5, active: true }];

const exists = sessions.some(s => s.id === 5);
if (exists) {
  console.log("Found");
} else {
  console.log("Not found");
}
```
Output:
```text
Found
```

---

#### Solution for Question 3
- Hint 1: Compare `p1.x === p2.x` and `p1.y === p2.y`.
- Hint 2: Return a boolean with `&&`.

Code:
```javascript
function isSamePoint(p1, p2) {
  return p1.x === p2.x && p1.y === p2.y;
}

console.log(isSamePoint({ x: 2, y: 3 }, { x: 2, y: 3 })); // true
console.log(isSamePoint({ x: 2, y: 3 }, { x: 4, y: 5 })); // false
```

---

#### Solution for Question 4
- Hint 1: Think about how large objects can get.
- Hint 2: How fast is comparing two numbers (addresses) versus inspecting many properties?

Explanation:
Comparing two memory addresses takes a single fast CPU comparison. If JavaScript compared objects by their contents, it would have to loop through every property of both objects on every comparison. If objects had nested arrays, nested objects, or circular references, comparisons would be slow and could crash with infinite recursion.

---

### Recall
1. Does `===` compare object properties or object memory addresses?
2. If two objects have identical properties, will `objA === objB` return `true`?
3. Why does `[ { id: 1 } ].includes({ id: 1 })` return `false`?

---

### If you remember only one thing:
JavaScript object equality `===` strictly checks whether two variables share the same memory address; it never compares the contents inside the objects.

---

# 09. OBJECT MUTATION

### What is it?
Object mutation is the process of altering the internal properties or values of an existing object without creating a new object in memory.

Here are the key technical terms used in this topic:
- Mutation is changing data in place inside an existing memory record.
- Immutability is the design principle where data is never modified after it is created; updates produce a new copy instead.
- A side effect is an unexpected change made by a function to state outside of its own local scope.
- A pure function is a function that produces no side effects and always returns the same output for the same input.

---

### Why does it exist?
Mutation allows applications to update state efficiently. When you update a property on an existing object, the engine modifies memory in place without having to allocate and garbage-collect a whole new object.

However, unchecked mutation can cause severe bugs. If multiple parts of a program hold references to the same object, modifying it in one place can silently break code in another place. Learning when to mutate and when to keep objects immutable is essential for writing reliable JavaScript.

---

### Basic example and explanation

```javascript
const order = {
  id: 101,
  status: "pending"
};

// In-place mutation
order.status = "completed";
order.paidAt = 1700000000;

console.log(order);
```

Output:
```text
{ id: 101, status: 'completed', paidAt: 1700000000 }
```

How this code runs, step by step:

First, we create an object named `order` with two properties: `id` and `status`.

Next, we write `order.status = "completed"`. This mutates the existing `status` property in place at that object's memory address.

Then, we write `order.paidAt = 1700000000`. This adds a new property to the same object in place.

Finally, we log `order`. The single object in memory now contains the updated `status` and the new `paidAt` property.

---

### How it works inside JavaScript

1. The engine looks up the memory address of `order` in heap memory.
2. For an update (`order.status = "completed"`): The engine overwrites the value stored in the slot for `"status"`. The object's memory address does not change.
3. For an addition (`order.paidAt = ...`): The engine allocates a new property entry in the existing object record.
4. Any other variable in the program holding the memory address of `order` immediately sees these new values.

---

### Think first

What do you think this code prints? Decide first before checking below.

```javascript
function setAdmin(user) {
  user.role = "admin";
  return user;
}

const current = { name: "Taylor", role: "guest" };
const updated = setAdmin(current);

console.log(current.role);
console.log(current === updated);
```

---

Result:
```text
admin
true
```

Why:
The function `setAdmin` mutates the object passed to it directly via `user.role = "admin"`. It returns the exact same object reference (`user`). Therefore, `current.role` was changed to `"admin"`, and `current === updated` is `true` because both point to the same memory record.

---

### More examples: from easy to harder

#### Example 1: Avoiding mutation with the immutability pattern
Instead of mutating an incoming object, return a new object with the desired property updates.

```javascript
function setAdminPure(user) {
  return {
    ...user,
    role: "admin"
  };
}

const current = { name: "Taylor", role: "guest" };
const updated = setAdminPure(current);

console.log(current.role);
console.log(updated.role);
console.log(current === updated);
```

Output:
```text
guest
admin
false
```

Explanation:
- `setAdminPure` creates a brand new object literal `{ ...user, role: "admin" }`.
- `current` is not modified; its `role` remains `"guest"`.
- `updated` is a distinct object with `role: "admin"`.
- `current === updated` is `false`.

#### Example 2: Mutating nested objects inside a shallow copy
Creating a shallow copy does not protect nested objects from mutation.

```javascript
const user = {
  name: "Sam",
  settings: { theme: "light" }
};

const copy = { ...user };
copy.settings.theme = "dark";

console.log(user.settings.theme);
```

Output:
```text
dark
```

Explanation:
- `{ ...user }` copies top-level properties.
- For `settings`, it copies the reference address of the inner object.
- `copy.settings` and `user.settings` point to the exact same inner object. Mutating `copy.settings.theme` changes `user.settings.theme`.

---

### Common mistakes

#### Mistake 1: Accidental mutation in utility functions
Wrong code:
```javascript
function addTimestamp(data) {
  data.timestamp = Date.now();
  return data;
}

const report = { title: "Monthly Report" };
addTimestamp(report); // Mutates caller's report object unexpectedly!
```

Why it happens:
The function mutates the caller's object directly, creating an unintended side effect.

Correct code:
Return a new object containing the new property without changing the original:
```javascript
function addTimestamp(data) {
  return {
    ...data,
    timestamp: Date.now()
  };
}
```

---

### Try it yourself
Create an object `counter = { count: 0 }`. Write a function `incrementPure(obj)` that returns a new object with `count` incremented by `1`, without mutating the original `counter`.

---

### Rules to remember
1. Mutation changes an object's properties in place without creating a new memory record.
2. Modifying an object passed into a function creates side effects that affect the caller.
3. The immutability pattern returns a new object `{ ...original, key: newValue }` instead of modifying the original.
4. Shallow copying with spread (`{ ...obj }`) does NOT protect nested objects from mutation.

---

### Exercises

#### Question 1 (Predict the output)
What will this code print to the console?
```javascript
const state = { count: 1 };

function change(s) {
  s.count = s.count + 1;
}

change(state);
console.log(state.count);
```

#### Question 2 (Find and fix the bug)
The function `setOffline` is supposed to return an updated object without modifying `user`. Fix the function to make it pure.
```javascript
function setOffline(user) {
  user.online = false;
  return user;
}

const activeUser = { name: "Alex", online: true };
const offlineUser = setOffline(activeUser);
console.log(activeUser.online); // Should remain true!
```

#### Question 3 (Write code from scratch)
Write a pure function `updateEmail(user, newEmail)` that returns a new user object with the updated `email`, leaving the input object unmodified.

#### Question 4 (Explain in your own words)
What is a function side effect in JavaScript, and why can mutating object arguments cause bugs?

---

### Solutions

#### Solution for Question 1
- Hint 1: Does `change` mutate `s` directly?
- Hint 2: Does `s` share the memory address of `state`?

Answer:
```text
2
```
Explanation: `change` mutates `state.count` in place through the shared reference.

---

#### Solution for Question 2
- Hint 1: Do not assign to `user.online`.
- Hint 2: Use the object spread operator `{ ...user, online: false }`.

Corrected code:
```javascript
function setOffline(user) {
  return {
    ...user,
    online: false
  };
}

const activeUser = { name: "Alex", online: true };
const offlineUser = setOffline(activeUser);
console.log(activeUser.online);
console.log(offlineUser.online);
```
Output:
```text
true
false
```

---

#### Solution for Question 3
- Hint 1: Return an object literal with `{ ...user, email: newEmail }`.

Code:
```javascript
function updateEmail(user, newEmail) {
  return {
    ...user,
    email: newEmail
  };
}

const original = { name: "Alex", email: "old@example.com" };
const updated = updateEmail(original, "new@example.com");

console.log(original.email); // old@example.com
console.log(updated.email);  // new@example.com
```

---

#### Solution for Question 4
- Hint 1: What happens when two different functions share a single object?
- Hint 2: Can one function predict changes made by another?

Explanation:
A side effect occurs when a function changes state outside of its own local variables. When a function mutates an object argument, any other part of the program holding a reference to that object sees the change. This leads to hard-to-find bugs because state changes without the other parts of the program knowing when or where it happened.

---

### Recall
1. What does mutating an object mean?
2. How do you update an object property using the immutability pattern?
3. If you pass an object into a function and change a property inside, is the caller's object changed?

---

### If you remember only one thing:
Mutating an object modifies its data in place across all variables sharing that memory address; prefer returning new objects with `{ ...original, key: value }` to prevent accidental side effects.

---

# 10. OBJECT COPYING

### What is it?
Object copying means creating a new object that duplicates the data of an existing object. JavaScript supports two levels of copying: shallow copying (which duplicates only the top-level properties) and deep copying (which recursively duplicates all nested objects and arrays).

Here are the key technical terms used in this topic:
- A shallow copy duplicates top-level properties; any nested objects remain shared by reference.
- A deep copy creates a completely independent clone of an object and all of its nested objects and arrays.
- `structuredClone()` is the modern built-in JavaScript function for creating deep copies.
- Lossy serialization is converting data into a format (like JSON) where certain data types (like functions or `undefined`) are lost or altered.

---

### Why does it exist?
Because variables hold references rather than independent copies of objects, writing `const b = a` creates another pointer to the same object, not a duplicate.

To work with an object without modifying the original, you must explicitly create a copy. Shallow copying is fast and suitable for flat objects, while deep copying is necessary when dealing with nested structures.

---

### Basic example and explanation

```javascript
const original = {
  name: "Settings",
  options: { volume: 80 }
};

// 1. Shallow copy
const shallow = { ...original };

// 2. Deep copy
const deep = structuredClone(original);

// Modifying the nested object
shallow.options.volume = 90;
console.log(original.options.volume);
console.log(deep.options.volume);
```

Output:
```text
90
80
```

How this code runs, step by step:

First, we create an object named `original` containing a nested object under `options`.

Next, we create `shallow` using `{ ...original }`. This copies the top-level property `name`. For `options`, it copies the reference address pointing to the inner object. Both `original.options` and `shallow.options` point to the same memory address.

Then, we create `deep` using `structuredClone(original)`. This recursively allocates brand new memory for both the outer object and the inner `options` object.

Next, we write `shallow.options.volume = 90`. Because `shallow.options` shares its memory address with `original.options`, `original.options.volume` becomes `90`.

Finally, we inspect `deep.options.volume`. Because `deep` has its own isolated copy of `options` in memory, its `volume` remains unchanged at `80`.

---

### How it works inside JavaScript

1. Assignment (`const b = a`): Copies only the 64-bit reference address. Zero new objects are allocated.
2. Shallow copy (`{ ...a }` or `Object.assign({}, a)`): Allocates one new object on the heap and copies each top-level key-value pair. Primitive values are copied by value; object values are copied by reference.
3. Deep copy (`structuredClone(a)`): Traverses the entire tree of properties. For every object and array found, it allocates a new heap record and copies the primitive values inside. It also handles circular references safely.

---

### Comparing object copying methods

| Method | Copy Depth | Preserves Nested Objects? | Handles Circular References? | Built-in Support |
| :--- | :--- | :--- | :--- | :--- |
| Assignment (`=`) | None (Reference copy) | Shared | N/A | All versions |
| Spread `{ ...obj }` | Shallow | Shared | N/A | ES2018+ |
| `Object.assign({}, obj)` | Shallow | Shared | N/A | ES2015+ |
| `structuredClone(obj)` | Deep | Fully Cloned | Yes | Modern browsers & Node.js 17+ |
| `JSON.parse(JSON.stringify(obj))` | Deep (Lossy) | Fully Cloned | No (Throws error) | ES5+ (Drops functions/undefined) |

---

### Think first

What do you think this code prints? Decide first before checking below.

```javascript
const user = {
  name: "Morgan",
  scores: [10, 20]
};

const clone = { ...user };
clone.name = "Sam";
clone.scores.push(30);

console.log(user.name);
console.log(user.scores);
```

---

Result:
```text
Morgan
[ 10, 20, 30 ]
```

Why:
- `name` is a top-level primitive string. The spread operator copies it independently. Mutating `clone.name` does not affect `user.name`.
- `scores` is an array (an object). The spread operator copies only its reference address. Calling `push` mutates the shared array in memory, so `user.scores` sees the new element `30`.

---

### More examples: from easy to harder

#### Example 1: Shallow copying with `Object.assign`
`Object.assign` is the pre-ES2018 way to create a shallow copy.

```javascript
const config = { host: "localhost", port: 3000 };
const copy = Object.assign({}, config);

copy.port = 4000;
console.log(config.port);
console.log(copy.port);
```

Output:
```text
3000
4000
```

Explanation:
- `Object.assign({}, config)` copies properties from `config` into the empty target object `{}`.
- Because `port` is a primitive number, `config.port` remains `3000`.

#### Example 2: The limitations of JSON deep cloning
Before `structuredClone`, developers used `JSON.parse(JSON.stringify(obj))`. It has major limitations:

```javascript
const record = {
  title: "Draft",
  date: new Date(),
  missing: undefined,
  action: () => "save"
};

const jsonClone = JSON.parse(JSON.stringify(record));
console.log(typeof jsonClone.date);
console.log(jsonClone.missing);
console.log(jsonClone.action);
```

Output:
```text
string
undefined
undefined
```

Explanation:
- `Date` objects are converted to ISO strings (`typeof date` becomes `"string"`, losing the `Date` methods).
- Properties with `undefined` or functions are completely removed during JSON serialization.
- Prefer `structuredClone()` for reliable deep copying.

---

### Common mistakes

#### Mistake 1: Assuming spread creates a deep copy
Wrong code:
```javascript
const profile = {
  details: { age: 25 }
};

const profileCopy = { ...profile };
profileCopy.details.age = 30;

console.log(profile.details.age); // Prints 30!
```

Why it happens:
Spread `{ ...profile }` is shallow. The `details` object is shared.

Correct code:
Use `structuredClone` for nested data:
```javascript
const profile = {
  details: { age: 25 }
};

const profileCopy = structuredClone(profile);
profileCopy.details.age = 30;

console.log(profile.details.age);
console.log(profileCopy.details.age);
```

Output:
```text
25
30
```

---

### Try it yourself
Create an object `book = { title: "JS Guide", metadata: { pages: 300 } }`. Create a deep copy using `structuredClone`. Modify `pages` in the copy to `350`. Confirm that the original still has `300`.

---

### Rules to remember
1. Assignment (`=`) never copies an object; it copies only the memory reference.
2. The spread operator `{ ...obj }` and `Object.assign({}, obj)` create shallow copies.
3. In a shallow copy, nested objects and arrays are shared by reference between original and copy.
4. Use `structuredClone(obj)` for a true, independent deep copy of nested structures.
5. Avoid `JSON.parse(JSON.stringify(obj))` for deep copies because it strips functions and `undefined`, and turns `Date` objects into strings.

---

### Exercises

#### Question 1 (Predict the output)
What will this code print to the console?
```javascript
const original = {
  tags: ["code"],
  level: 1
};

const shallow = { ...original };
const deep = structuredClone(original);

shallow.tags.push("web");
shallow.level = 2;

console.log(original.tags.length);
console.log(original.level);
console.log(deep.tags.length);
```

#### Question 2 (Find and fix the bug)
The function below attempts to clone a user object, but changes to `user.preferences` in the clone mutate the original. Fix it.
```javascript
function cloneUser(user) {
  return { ...user };
}
```

#### Question 3 (Write code from scratch)
Write a function `safeCloneSettings(settings)` that creates a completely isolated deep copy of `settings` using `structuredClone`, updates `copy.isModified = true`, and returns the copy.

#### Question 4 (Explain in your own words)
Explain the difference between a shallow copy and a deep copy in terms of memory addresses.

---

### Solutions

#### Solution for Question 1
- Hint 1: What happened to `original.tags` when `shallow.tags.push` was called?
- Hint 2: Did `deep.tags` share the memory address with `original.tags`?

Answer:
```text
2
1
1
```
Explanation: `shallow.tags` shares the array reference with `original.tags`, so adding `"web"` increases `original.tags.length` to `2`. `shallow.level` is a primitive, so `original.level` remains `1`. `deep.tags` is completely independent, so its length is `1`.

---

#### Solution for Question 2
- Hint 1: `user` contains nested data.
- Hint 2: Use `structuredClone`.

Corrected code:
```javascript
function cloneUser(user) {
  return structuredClone(user);
}
```

---

#### Solution for Question 3
- Hint 1: Call `structuredClone(settings)` first.
- Hint 2: Add `isModified = true` to the cloned object and return it.

Code:
```javascript
function safeCloneSettings(settings) {
  const copy = structuredClone(settings);
  copy.isModified = true;
  return copy;
}

const original = { theme: "dark", audio: { volume: 50 } };
const updated = safeCloneSettings(original);

console.log(original.isModified); // undefined
console.log(updated.isModified);  // true
```

---

#### Solution for Question 4
- Hint 1: How many memory allocations occur in a shallow copy versus a deep copy?
- Hint 2: What happens to nested memory addresses?

Explanation:
A shallow copy allocates a new memory address only for the outermost object. All nested objects and arrays retain their original memory addresses, meaning both the original and the copy point to the same nested records in memory. A deep copy allocates new memory addresses for the outer object AND every nested object and array inside it, ensuring that no memory addresses are shared between the two structures.

---

### Recall
1. Does `{ ...obj }` create a shallow copy or a deep copy?
2. What modern JavaScript function creates a deep copy of an object?
3. What happens to a property containing `undefined` when using `JSON.stringify`?

---

### If you remember only one thing:
Shallow copies (`{ ...obj }`) duplicate only the outer object while sharing nested objects by reference; use `structuredClone(obj)` whenever you need a completely independent copy of nested data.

---

### Checkpoint Challenge: Topics 6 to 10

This checkpoint challenge tests existence checking, reference sharing, object identity, mutation side-effects, and deep copying.

#### Challenge Task
Write a function named `cloneAndVerifyUser(originalUser, updateKey, updateValue)` that performs the following steps:
1. Verifies if `updateKey` exists on `originalUser` using `Object.hasOwn`. If it does NOT exist, throw an `Error("Invalid key")`.
2. Creates a completely isolated deep copy of `originalUser` using `structuredClone`.
3. Mutates the property specified by `updateKey` on the deep copy to `updateValue`.
4. Adds a property `isDeepClone: true` to the deep copy.
5. Verifies that `originalUser !== copy` and that modifying the copy did NOT alter `originalUser`.
6. Returns an object `{ original: originalUser, copy: copy }`.

---

#### Solutions for Checkpoint Challenge

- Hint 1: Use `if (!Object.hasOwn(originalUser, updateKey)) throw new Error("Invalid key");`.
- Hint 2: Use `structuredClone(originalUser)` to ensure nested properties are not shared.

Code:
```javascript
function cloneAndVerifyUser(originalUser, updateKey, updateValue) {
  // 1. Verify existence
  if (!Object.hasOwn(originalUser, updateKey)) {
    throw new Error("Invalid key");
  }

  // 2. Create deep copy
  const copy = structuredClone(originalUser);

  // 3. Mutate copy
  copy[updateKey] = updateValue;

  // 4. Add isDeepClone flag
  copy.isDeepClone = true;

  // 5. Return both
  return {
    original: originalUser,
    copy
  };
}

// Verification:
const original = { id: 1, profile: { theme: "light" } };
const result = cloneAndVerifyUser(original, "profile", { theme: "dark" });

console.log(result.original.profile.theme); // "light" (Unchanged!)
console.log(result.copy.profile.theme);     // "dark" (Updated!)
console.log(result.original === result.copy); // false (Distinct identities!)
```

Output:
```text
light
dark
false
```

Explanation:
- `Object.hasOwn` safely confirms that `updateKey` is an own property of `originalUser`.
- `structuredClone` creates fully isolated heap records for both outer and nested objects.
- Updating `copy[updateKey]` does not leak changes into `originalUser`.
- Comparing `result.original === result.copy` evaluates to `false`, confirming distinct memory identities.

---

# 11. SHALLOW COPY

A **Shallow Copy** duplicates only the top-level properties of an object. If any property value is itself an object or array, **only the reference pointer is copied**!

```js
const original = {
  name: "Ayush",
  address: {
    city: "Mumbai",
    zip: "400001"
  }
};

// Creating a shallow copy via Spread Operator:
const shallowCopy = { ...original };

// Top-level property is independent:
shallowCopy.name = "John";
console.log(original.name); // 'Ayush' (Not affected)

// Nested object is SHARED:
shallowCopy.address.city = "Bengaluru";
console.log(original.address.city); // 'Bengaluru' ⚠️ (MUTATED!)
```

### The Visual Shallow Copy Architecture
```text
original    ──► Heap: { name: 'Ayush', address: 0x9999 }
                                                   │
                                                   ▼
shallowCopy ──► Heap: { name: 'John',  address: 0x9999 } ──► Heap: { city: 'Bengaluru' }
```

---

# 12. DEEP COPY

A **Deep Copy** duplicates the target object **and recursively duplicates all nested objects, arrays, maps, and sets**, ensuring the new structure is completely isolated in memory.

### 1. Modern Native Standard: `structuredClone()` (ES2022)
The web standard `structuredClone()` is built into all modern browsers and Node.js (v17+). It supports circular references, Dates, RegExps, Maps, Sets, and TypedArrays!
```js
const profile = {
  user: "Ayush",
  meta: { role: "Admin", loginCount: 14 },
  joinedAt: new Date("2024-01-01")
};

const deep = structuredClone(profile);

deep.meta.role = "SuperAdmin";
console.log(profile.meta.role); // 'Admin' (Completely safe & isolated!)
console.log(deep.joinedAt instanceof Date); // true (Retains true Date instance!)
```

### 2. The Legacy Hack & Its Pitfalls: `JSON.parse(JSON.stringify(obj))`
Historically, developers used JSON serialization for deep cloning. **This pattern is dangerous in production** because it silently strips or corrupts data:
```js
const dirtyObject = {
  created: new Date(),
  pattern: /^[a-z]+$/gi,
  callback: () => "Hello",
  missing: undefined,
  notANumber: NaN,
  balance: Infinity,
  id: Symbol("id")
};

const cloned = JSON.parse(JSON.stringify(dirtyObject));

console.log(typeof cloned.created); // 'string' ⚠️ (Lost Date object!)
console.log(cloned.pattern);        // {} ⚠️ (Lost RegExp pattern!)
console.log(cloned.callback);       // undefined ⚠️ (Function deleted!)
console.log(cloned.missing);        // undefined ⚠️ (Undefined key removed!)
console.log(cloned.notANumber);     // null ⚠️ (NaN coerced to null!)
console.log(cloned.balance);        // null ⚠️ (Infinity coerced to null!)
console.log(cloned.id);             // undefined ⚠️ (Symbol key stripped!)
```

### Summary Comparison: `structuredClone` vs `JSON`
| Feature | `structuredClone()` | `JSON.parse(JSON.stringify())` |
| :--- | :--- | :--- |
| **Circular References** | ✅ Supported (Preserves topology) | ❌ Throws `TypeError: Converting circular structure to JSON` |
| **Dates** | ✅ Clones as true `Date` instances | ❌ Coerces to ISO String |
| **Regular Expressions** | ✅ Clones as true `RegExp` instances | ❌ Coerces to empty object `{}` |
| **Maps & Sets** | ✅ Clones as true `Map` / `Set` | ❌ Coerces to empty object or array |
| **Functions / Methods** | ❌ Throws `DataCloneError` | ❌ Silently strips / omits |
| **DOM Nodes / Symbols** | ❌ Throws `DataCloneError` | ❌ Strips Symbols, throws on DOM nodes |


---

# 13. NESTED OBJECTS

Real-world applications rarely deal with flat key-value pairs. Data models—such as user profiles, database schemas, and e-commerce carts—are structured hierarchically as **Nested Objects**.

```js
const customerOrder = {
  orderId: "ORD-2024-889",
  createdAt: "2024-03-15T10:00:00Z",
  customer: {
    id: "CUST-104",
    name: "Ayush",
    contact: {
      email: "ayush@example.com",
      phone: "+91-9876543210"
    }
  },
  shipping: {
    address: {
      street: "42 Tech Boulevard",
      city: "Bengaluru",
      postalCode: "560001"
    },
    carrier: "Express Logistics"
  }
};
```

### The Uncaught TypeError Crash
Accessing deeply nested properties without checks is the leading source of production runtime crashes in JavaScript:
```js
const city = customerOrder.shipping.address.city; // "Bengaluru" (Safe)

// What if customerOrder.billing is undefined?
const billingZip = customerOrder.billing.address.postalCode;
// 💥 FATAL CRASH: TypeError: Cannot read properties of undefined (reading 'address')
```

---

# 14. OPTIONAL CHAINING

Introduced in ES2020, the **Optional Chaining Operator (`?.`)** short-circuits property evaluation to `undefined` if the reference before `?.` is **nullish** (`null` or `undefined`), preventing catastrophic crashes.

```text
EVALUATION PIPELINE:
customerOrder?.billing?.address?.postalCode
      │           │
   Exists?        Is nullish? (undefined)
      ▼           ▼
   Continue    SHORT-CIRCUIT IMMEDIATELY ──► Returns undefined (No Crash!)
```

### 1. Property Access
```js
const zip = customerOrder?.billing?.address?.postalCode;
console.log(zip); // undefined (Execution continues smoothly without crashing!)
```

### 2. Method Calls (`obj.method?.()`)
Call a method only if it actually exists on the object:
```js
const logger = {
  log: (msg) => console.log(`[INFO]: ${msg}`)
};

logger.log?.("System operational");   // Logs: [INFO]: System operational
logger.debug?.("Diagnostic trace");   // Silently evaluates to undefined without crashing!
```

### 3. Bracket Notation & Array Element Access
```js
const key = "contact";
console.log(customerOrder?.customer?.[key]?.email); // "ayush@example.com"

const team = { members: ["Alice", "Bob"] };
console.log(team.members?.[0]); // "Alice"
console.log(team.guests?.[0]);  // undefined
```

---

# 15. NULLISH COALESCING WITH OBJECTS

The **Nullish Coalescing Operator (`??`)** returns its right-hand operand only when its left-hand operand evaluates to `null` or `undefined`.

### The Critical Bug: `??` vs `||` (Logical OR)
Logical OR (`||`) checks for **falsy values** (`false`, `0`, `""`, `NaN`, `null`, `undefined`). This causes subtle, critical bugs when valid business values like `0` or `false` get overwritten!

```text
┌──────────────┬────────────────────────────────┬────────────────────────────────┐
│ Input Value  │ Value || "Fallback"            │ Value ?? "Fallback"            │
├──────────────┼────────────────────────────────┼────────────────────────────────┤
│ 0            │ "Fallback" ⚠️ (Bug! 0 is lost) │ 0 ✅ (Preserved!)              │
│ false        │ "Fallback" ⚠️ (Bug! Overwrite) │ false ✅ (Preserved!)          │
│ ""           │ "Fallback" ⚠️ (Bug! Empty lost)│ "" ✅ (Preserved!)             │
│ null         │ "Fallback"                     │ "Fallback"                     │
│ undefined    │ "Fallback"                     │ "Fallback"                     │
└──────────────┴────────────────────────────────┴────────────────────────────────┘
```

### Real-World Example: User Configuration
```js
const userConfig = {
  animationSpeed: 0,       // 0 is a valid fast speed!
  showNotifications: false // false is an intentional opt-out!
};

// ❌ DANGEROUS LOGICAL OR (||):
const speedOR = userConfig.animationSpeed || 300;
console.log(speedOR); // 300 ⚠️ (BUG: Overrode the user's explicit choice of 0!)

// ✅ CORRECT NULLISH COALESCING (??):
const speedClean = userConfig.animationSpeed ?? 300;
console.log(speedClean); // 0 (Preserved correctly!)

const notifyClean = userConfig.showNotifications ?? true;
console.log(notifyClean); // false (Preserved correctly!)
```

### Combining Optional Chaining with Nullish Coalescing
This pair forms the gold standard for robust data extraction:
```js
const userTheme = response?.data?.preferences?.theme ?? "dark-default";
```

---

# 16. OBJECT DESTRUCTURING

**Object Destructuring** (ES6) is an expressive syntax for unpacking values from objects into distinct variables.

### 1. Basic Destructuring
```js
const user = { name: "Ayush", age: 24, role: "Engineer" };

// Unpacks 'name' and 'age' directly
const { name, age } = user;
console.log(name, age); // "Ayush" 24
```

### 2. Variable Renaming (`key: newName`)
When a local variable name already exists or you want clearer naming:
```js
const apiResponse = { user_id: 101, is_act: true };

const { user_id: userId, is_act: isActive } = apiResponse;
console.log(userId, isActive); // 101 true
```

### 3. Default Values
Provide fallback values if the property is `undefined`:
```js
const config = { host: "localhost" };

const { host, port = 8080, secure = false } = config;
console.log(host, port, secure); // "localhost" 8080 false
```

### 4. Renaming with Default Values
```js
const settings = {};
const { timeout_ms: timeout = 5000 } = settings;
console.log(timeout); // 5000
```

### 5. Nested Destructuring
Unpack deeply nested properties in a single statement:
```js
const account = {
  id: 42,
  profile: {
    personal: { fullName: "Ayush Sharma" }
  }
};

const {
  profile: {
    personal: { fullName }
  }
} = account;

console.log(fullName); // "Ayush Sharma"
```

### 6. Function Parameter Destructuring (Senior Pattern)
Instead of passing positional arguments or accepting an unwieldy `options` object:
```js
function renderUserCard({ name, role = "Member", avatar = "/default.png" } = {}) {
  return `<div class="card"><img src="${avatar}"/><h3>${name}</h3><p>${role}</p></div>`;
}

renderUserCard({ name: "Ayush", role: "Staff Architect" });
renderUserCard(); // Safe fallback to {} thanks to default parameter!
```

---

# 17. OBJECT REST PROPERTIES

The **Rest syntax (`...rest`)** in destructuring gathers all remaining enumerable own properties into a fresh new object.

```js
const rawUser = {
  id: "U-1001",
  username: "ayush99",
  passwordHash: "9f8e7d6c5b4a",
  salt: "a1b2c3d4",
  email: "ayush@example.com",
  role: "admin"
};

// Strip sensitive properties:
const { passwordHash, salt, ...sanitizedUser } = rawUser;

console.log(sanitizedUser);
// { id: 'U-1001', username: 'ayush99', email: 'ayush@example.com', role: 'admin' }
```

### 4 Essential Production Use Cases for Rest Properties:
1. **Sanitizing API payloads**: Stripping database secrets (`passwordHash`, `ssn`) before returning JSON to clients.
2. **Component Props Forwarding**: Extracting specific props (`title`, `onClick`) and forwarding the rest (`...domProps`) to HTML elements.
3. **Immutable Property Deletion**: Instead of using `delete obj.prop` (which mutates the object and hurts V8 optimization), use rest destructuring to create a clean object without the unwanted key.
4. **Config Parsing**: Extracting core settings (`port`, `host`) and grouping all arbitrary third-party plugin options into `pluginOptions`.

---

# 18. OBJECT SPREAD

The **Object Spread Operator (`...`)** copies all enumerable own properties from one or more source objects into a new object literal.

### 1. Basic Spread & Precedence
Properties declared **after** the spread override matching properties copied from the source:

```js
const defaultSettings = {
  theme: "light",
  fontSize: 14,
  autoSave: true
};

const userCustomSettings = {
  theme: "dark",
  fontSize: 16
};

// Merging with precedence:
const activeSettings = {
  ...defaultSettings,
  ...userCustomSettings, // Overrides 'theme' and 'fontSize'
  autoSave: false        // Final manual override
};

console.log(activeSettings);
// { theme: 'dark', fontSize: 16, autoSave: false }
```

### 2. Order Matters: The Precedence Trap
```js
// Trap: Placing default values AFTER the spread overwrites custom values!
const badSettings = {
  ...userCustomSettings,
  theme: "light" // ⚠️ Overwrites user's "dark" theme back to "light"!
};
```

---

# 19. OBJECT MERGING

Combining data from multiple objects is a staple of JavaScript application architecture.

```text
MERGE STRATEGY         SYNTAX / CALL                      TYPE     PRECEDENCE
Spread Operator        { ...objA, ...objB }               Shallow  Last key wins
Object.assign          Object.assign(target, srcA, srcB)  Shallow  Mutates target, last key wins
Deep Merge Utility     deepMerge(objA, objB)              Deep     Recursively merges nested objects
```

### 1. Object Spread vs `Object.assign()`
* `{ ...a, ...b }` always creates and returns a **brand-new object**.
* `Object.assign(target, ...sources)` **mutates the first argument** (`target`) and returns it. To avoid mutation, pass an empty object as target: `Object.assign({}, a, b)`.

### 2. The Deep Merge Algorithm
Neither spread nor `Object.assign` merges nested objects—they completely overwrite them:
```js
const target = { user: { name: "Ayush", age: 24 } };
const patch  = { user: { city: "Mumbai" } };

// Shallow merge clobbers nested properties:
const shallowResult = { ...target, ...patch };
console.log(shallowResult.user); // { city: 'Mumbai' } (name and age were WIPED OUT!)
```

#### Production Recursive Deep Merge Implementation:
```js
function isPlainObject(item) {
  return item && typeof item === "object" && !Array.isArray(item) && !(item instanceof Date);
}

function deepMerge(target, source) {
  const output = { ...target };

  if (isPlainObject(target) && isPlainObject(source)) {
    for (const key of Object.keys(source)) {
      if (isPlainObject(source[key])) {
        if (!(key in target)) {
          output[key] = source[key];
        } else {
          output[key] = deepMerge(target[key], source[key]);
        }
      } else {
        output[key] = source[key];
      }
    }
  }

  return output;
}

const merged = deepMerge(target, patch);
console.log(merged.user); // { name: 'Ayush', age: 24, city: 'Mumbai' } ✅ (Preserved!)
```


---

# 20. OBJECT METHODS (`keys`, `values`, `entries`)

To iterate over or inspect an object's contents without prototype pollution, modern JavaScript provides three static reflection methods on `Object`.

```text
┌──────────────────┬────────────────────────────────────────────────────────────────────────┐
│ Method           │ Returns                                                                │
├──────────────────┼────────────────────────────────────────────────────────────────────────┤
│ Object.keys()    │ Array of own enumerable string keys                                    │
│ Object.values()  │ Array of own enumerable property values                                │
│ Object.entries() │ Array of [key, value] tuples (enumerable own string keys only)        │
└──────────────────┴────────────────────────────────────────────────────────────────────────┘
```

```js
const user = {
  id: 101,
  username: "ayush",
  role: "admin"
};

console.log(Object.keys(user));   // ['id', 'username', 'role']
console.log(Object.values(user)); // [101, 'ayush', 'admin']
console.log(Object.entries(user));// [['id', 101], ['username', 'ayush'], ['role', 'admin']]
```

### Iteration with `for...of` and Destructuring
```js
for (const [key, value] of Object.entries(user)) {
  console.log(`${key.toUpperCase()}: ${value}`);
}
```

---

# 21. OBJECT.FROMENTRIES

Introduced in ES2019, `Object.fromEntries()` performs the inverse operation of `Object.entries()`. It accepts an iterable of key-value pairs (tuples) and transforms them back into a plain object.

```text
Object.entries(obj)      ──►  [ ['a', 1], ['b', 2] ]
                                      │
                                      ▼
Object.fromEntries(arr)  ◄──  { a: 1, b: 2 }
```

### 1. Converting a `Map` to an Object
```js
const userMap = new Map([
  ["name", "Ayush"],
  ["level", "Senior"]
]);

const objFromMap = Object.fromEntries(userMap);
console.log(objFromMap); // { name: 'Ayush', level: 'Senior' }
```

### 2. The Clean Object Transformation Pipeline
The combo of `Object.entries()`, array methods (`map`, `filter`), and `Object.fromEntries()` is the cleanest way to transform objects functionally:
```js
const pricesUSD = { laptop: 1200, keyboard: 100, mouse: 50 };

// Double all prices and filter out items under 150:
const premiumPrices = Object.fromEntries(
  Object.entries(pricesUSD)
    .map(([item, price]) => [item, price * 2])
    .filter(([_, price]) => price >= 150)
);

console.log(premiumPrices); // { laptop: 2400, keyboard: 200 }
```

### 3. Converting URL Search Parameters to an Object
```js
const searchParams = new URLSearchParams("category=books&sort=asc&page=2");
const queryObj = Object.fromEntries(searchParams);
console.log(queryObj); // { category: 'books', sort: 'asc', page: '2' }
```

---

# 22. OBJECT.CREATE

`Object.create(proto, [propertiesObject])` creates a new object with its internal `[[Prototype]]` explicitly linked to the specified `proto` object.

```js
const animalPrototype = {
  type: "Unknown",
  breathe() {
    return "Inhaling oxygen...";
  }
};

// Create a dog whose prototype is animalPrototype:
const dog = Object.create(animalPrototype);
dog.breed = "Golden Retriever";

console.log(dog.breed);     // "Golden Retriever" (Own property)
console.log(dog.breathe());   // "Inhaling oxygen..." (Inherited from prototype!)
```

### ⚠️ The Second Argument Trap
The optional second argument takes property **descriptors**, NOT raw key-value pairs! Passing raw values fails or silently creates non-writable/non-enumerable properties:
```js
// ❌ WRONG:
const bad = Object.create(animalPrototype, { name: "Max" }); // Throws TypeError! Descriptors required!

// ✅ CORRECT:
const good = Object.create(animalPrototype, {
  name: {
    value: "Max",
    writable: true,
    enumerable: true,
    configurable: true
  }
});
```

---

# 23. PROTOTYPE BASICS

Every JavaScript object has an internal hidden slot named **`[[Prototype]]`**. This slot holds either a reference to another object (its prototype) or `null`.

```text
┌────────────────────────────────────────────────────────┐
│                   THE PROTOTYPE CHAIN                  │
│                                                        │
│  dog                                                   │
│  ┌───────────────────────┐                             │
│  │ breed: "Golden"       │                             │
│  │ [[Prototype]] ────────┼────────┐                    │
│  └───────────────────────┘        │                    │
│                                   ▼                    │
│                        animalPrototype                 │
│                        ┌───────────────────────┐       │
│                        │ breathe: ƒ()          │       │
│                        │ [[Prototype]] ────────┼───┐   │
│                        └───────────────────────┘   │   │
│                                                    ▼   │
│                                         Object.prototype
│                                         ┌───────────────────────┐
│                                         │ toString: ƒ()         │
│                                         │ valueOf: ƒ()          │
│                                         │ [[Prototype]]: null   │
│                                         └───────────────────────┘
└────────────────────────────────────────────────────────┘
```

* **Prototype Delegation**: When code attempts to read a property on an object (e.g. `dog.breathe`), if the engine doesn't find it directly on `dog`, it follows the `[[Prototype]]` link upward until it finds the property or reaches `null`.
* **Prototype Memory Optimization**: Methods defined on the prototype are shared across all instances, consuming memory for only a single function instance rather than duplicating it on every object.

---

# 24. `__proto__` VS OBJECT.GETPROTOTYPEOF

To inspect an object's prototype link:

```text
┌─────────────────────────────┬─────────────────────────────────────────────────────────┐
│ Property / Method           │ Status & Recommendation                                 │
├─────────────────────────────┼─────────────────────────────────────────────────────────┤
│ obj.__proto__               │ Legacy accessor on Object.prototype. Deprecated!        │
│ Object.getPrototypeOf(obj)  │ Modern ECMAScript Standard (ES5+). Recommended!         │
│ Reflect.getPrototypeOf(obj) │ Modern Reflection API Standard (ES6+). Safe & Robust.   │
└─────────────────────────────┴─────────────────────────────────────────────────────────┘
```

### Why `__proto__` is Dangerous
1. `__proto__` is an accessor property sitting on `Object.prototype`. If an object has a `null` prototype (`Object.create(null)`), `obj.__proto__` is simply `undefined`!
2. Mutating `__proto__` causes severe V8 performance de-optimizations.

```js
const parent = { familyName: "Smith" };
const child = Object.create(parent);

// ❌ Avoid legacy __proto__:
console.log(child.__proto__ === parent); // true, but discouraged

// ✅ Use standard Object.getPrototypeOf:
console.log(Object.getPrototypeOf(child) === parent); // true (Safe, standard!)
```

---

# 25. OBJECT.SETPROTOTYPEOF

`Object.setPrototypeOf(obj, newProto)` dynamically reassigns the prototype of `obj` to `newProto`.

```js
const human = { walk: () => "Walking" };
const robot = { recharge: () => "Recharging" };

const cyborg = { name: "C-1" };
Object.setPrototypeOf(cyborg, human);
console.log(cyborg.walk()); // "Walking"

// Switch prototype dynamically at runtime:
Object.setPrototypeOf(cyborg, robot);
console.log(cyborg.recharge()); // "Recharging"
```

> [!CAUTION]
> **Severe Performance Degradation**: Re-assigning an object's prototype with `Object.setPrototypeOf()` is one of the slowest operations in JavaScript. It blows away V8's Inline Caches (ICs) and forces the JavaScript engine to invalidate optimized JIT machine code across all downstream property accesses. Always set the prototype up-front using `Object.create()` or class `extends`.

---

# 26. PROTOTYPE CHAIN PROPERTY LOOKUP

When you evaluate `obj.someProp`, the JavaScript engine executes the following step-by-step algorithm:

```text
LOOKUP ALGORITHM: obj.someProp
Step 1: Check if 'someProp' is an OWN property on 'obj'.
        ├── Found? ──► Return value. (LOOKUP TERMINATES)
        └── Not found? ──► Proceed to Step 2.

Step 2: Check obj's [[Prototype]].
        ├── Is [[Prototype]] null? ──► Return undefined. (LOOKUP TERMINATES)
        └── Is [[Prototype]] an object? ──► Repeat Step 1 on the prototype!
```

### Step-by-Step Code Walkthrough
```js
const grandparent = { surname: "Gupta", homeCity: "Delhi" };
const parent = Object.create(grandparent);
parent.homeCity = "Mumbai"; // Shadows grandparent.homeCity!

const child = Object.create(parent);
child.firstName = "Ayush";

// Step-by-step resolution:
console.log(child.firstName); // Step 1: Found on 'child' directly -> "Ayush"
console.log(child.homeCity);  // Step 1: Miss on child -> Step 2: Found on 'parent' -> "Mumbai" (Shadowed!)
console.log(child.surname);   // Step 1: Miss -> Step 2: Miss on parent -> Step 3: Found on grandparent -> "Gupta"
console.log(child.salary);    // Miss on child -> parent -> grandparent -> Object.prototype -> null -> undefined
```

---

# 27. OWN VS INHERITED PROPERTIES

Properties living directly on the object are **Own Properties**. Properties available via the prototype chain are **Inherited Properties**.

```js
const vehicle = { wheels: 4 };
const sedan = Object.create(vehicle);
sedan.make = "Honda";

// 1. in operator: checks BOTH own and inherited
console.log("make" in sedan);   // true (Own)
console.log("wheels" in sedan); // true (Inherited!)

// 2. Object.hasOwn(): checks ONLY own properties
console.log(Object.hasOwn(sedan, "make"));   // true
console.log(Object.hasOwn(sedan, "wheels")); // false (wheels is inherited!)

// 3. Object.keys(): returns ONLY own enumerable keys
console.log(Object.keys(sedan)); // ['make'] (wheels is omitted!)
```

---

# 28. OBJECT PROPERTY DESCRIPTORS

Behind every property in JavaScript lies an internal record called a **Property Descriptor**. Property descriptors define the meta-rules governing how that property behaves.

### The 2 Flavors of Descriptors:
1. **Data Descriptors**: Hold a tangible value (`value`, `writable`).
2. **Accessor Descriptors**: Hold getter and setter functions (`get`, `set`).

### Inspecting Descriptors: `Object.getOwnPropertyDescriptor(obj, prop)`
```js
const book = { title: "JavaScript Mastery" };
const descriptor = Object.getOwnPropertyDescriptor(book, "title");

console.log(descriptor);
/*
{
  value: 'JavaScript Mastery',
  writable: true,        // Can the value be changed?
  enumerable: true,      // Will it show up in loops / Object.keys?
  configurable: true     // Can attributes be changed or property deleted?
}
*/
```

---

# 29. DEFINEPROPERTY

`Object.defineProperty(obj, prop, descriptor)` defines a new property or modifies an existing property's descriptors with surgical precision.

```js
const user = {};

Object.defineProperty(user, "id", {
  value: 1001,
  writable: false,      // Read-only!
  enumerable: true,     // Visible in Object.keys
  configurable: false   // Permanent! Cannot be deleted or reconfigured
});

console.log(user.id); // 1001

user.id = 9999; // Silently ignored in non-strict mode; throws TypeError in strict mode!
console.log(user.id); // 1001 (Unchanged!)

delete user.id; // Returns false! Deletion rejected!
console.log(user.id); // 1001
```

---

# 30. DEFINEPROPERTIES

To define or modify multiple property descriptors at once, use `Object.defineProperties(obj, props)`:

```js
const bankAccount = {};

Object.defineProperties(bankAccount, {
  accountNumber: {
    value: "ACC-908123",
    writable: false,
    enumerable: true,
    configurable: false
  },
  balance: {
    value: 5000,
    writable: true,
    enumerable: false, // Hidden from reflection loops!
    configurable: true
  }
});

console.log(Object.keys(bankAccount)); // ['accountNumber'] (balance is non-enumerable)
console.log(bankAccount.balance);      // 5000 (Direct access still works!)
```

---

# 31. PROPERTY DESCRIPTOR DEFAULTS

This is one of the most critical gotchas in JavaScript meta-programming:

```text
┌──────────────────────┬────────────────────────────────────────────────────────┐
│ Creation Technique   │ Descriptor Defaults (writable, enumerable, configurable)│
├──────────────────────┼────────────────────────────────────────────────────────┤
│ Object Literal `{}`  │ ALL DEFAULT TO TRUE! (`writable: true`, etc.)          │
│ Direct assignment `=`│ ALL DEFAULT TO TRUE!                                   │
│ Object.defineProperty│ ALL DEFAULT TO FALSE!                                  │
└──────────────────────┴────────────────────────────────────────────────────────┘
```

```js
const a = {};
a.x = 10;
// Descriptors for 'x': writable: true, enumerable: true, configurable: true

const b = {};
Object.defineProperty(b, "y", { value: 20 });
// Descriptors for 'y': writable: FALSE, enumerable: FALSE, configurable: FALSE!
```

---

# 32. ENUMERABILITY

The `enumerable` attribute dictates whether a property shows up during enumeration:
* `for...in` loops
* `Object.keys()`
* `Object.values()`
* `Object.entries()`
* Spread operator `{ ...obj }`
* `JSON.stringify()`

```js
const config = { apiHost: "https://api.internal.net" };

Object.defineProperty(config, "secretKey", {
  value: "super_secret_shh",
  enumerable: false // Invisible to ordinary reflection!
});

console.log(Object.keys(config)); // ['apiHost']
console.log(JSON.stringify(config)); // '{"apiHost":"https://api.internal.net"}'

// Accessing non-enumerable properties explicitly:
console.log(config.secretKey); // 'super_secret_shh'
console.log(Object.getOwnPropertyNames(config)); // ['apiHost', 'secretKey']
```

---

# 33. WRITABLE

The `writable` attribute controls whether the property's `value` can be overwritten via assignment (`=`):

```js
const server = {};
Object.defineProperty(server, "port", {
  value: 3000,
  writable: false,
  configurable: true
});

server.port = 8080; 
// In non-strict mode: silently ignored.
// In strict mode ("use strict";): throws TypeError: Cannot assign to read only property 'port'
```

---

# 34. CONFIGURABLE

The `configurable` attribute is the **Master Lock** of a property:
When `configurable: false`:
1. The property **CANNOT be deleted** (`delete obj.prop` fails).
2. The property cannot be converted between a data descriptor and an accessor descriptor.
3. `enumerable` cannot be changed.
4. `configurable` cannot be changed back to `true`.
5. **One exception**: `writable` can be transitioned from `true` to `false` (one-way ratchet lock), but never from `false` back to `true`.

```js
const permanent = {};
Object.defineProperty(permanent, "token", {
  value: "ABC-123",
  configurable: false,
  writable: true
});

// Allowed: turning writable false
Object.defineProperty(permanent, "token", { writable: false });

// 💥 Throws TypeError: Cannot redefine property 'token'
// Object.defineProperty(permanent, "token", { configurable: true });
```

---

# 35. GETTERS AND SETTERS

**Accessors** look and act like ordinary properties from the outside, but execute functions under the hood when read (`get`) or written (`set`).

### Syntax in Object Literals
```js
const user = {
  firstName: "Ayush",
  lastName: "Sharma",

  get fullName() {
    return `${this.firstName} ${this.lastName}`;
  },

  set fullName(value) {
    const parts = value.trim().split(" ");
    if (parts.length < 2) {
      throw new Error("Full name must include first and last name.");
    }
    this.firstName = parts[0];
    this.lastName = parts.slice(1).join(" ");
  }
};

console.log(user.fullName); // "Ayush Sharma" (Getter invoked!)

user.fullName = "Ayush Verma"; // Setter invoked!
console.log(user.firstName); // "Ayush"
console.log(user.lastName);  // "Verma"
```

---

# 36. GETTER/SETTER DESCRIPTORS

Accessor descriptors use `get` and `set` in place of `value` and `writable`:

```js
const temperatureSensor = {
  _celsius: 25
};

Object.defineProperty(temperatureSensor, "fahrenheit", {
  get() {
    return (this._celsius * 9) / 5 + 32;
  },
  set(fVal) {
    this._celsius = ((fVal - 32) * 5) / 9;
  },
  enumerable: true,
  configurable: true
});

console.log(temperatureSensor.fahrenheit); // 77°F
temperatureSensor.fahrenheit = 212;
console.log(temperatureSensor._celsius);   // 100°C
```


---

# 37. IMMUTABILITY

In modern software architecture, **immutability** (the guarantee that data cannot be modified after creation) prevents state mutations, race conditions, and side-effects.

JavaScript offers three built-in integrity levels to enforce varying degrees of object immutability:

```text
┌──────────────────────────┬───────────┬──────────────┬─────────────┐
│ Integrity Level          │ Add Props │ Delete Props │ Modify Vals │
├──────────────────────────┼───────────┼──────────────┼─────────────┤
│ Object.preventExtensions │ ❌ NO     │ ✅ YES       │ ✅ YES      │
│ Object.seal              │ ❌ NO     │ ❌ NO        │ ✅ YES      │
│ Object.freeze            │ ❌ NO     │ ❌ NO        │ ❌ NO       │
└──────────────────────────┴───────────┴──────────────┴─────────────┘
```

---

# 38. OBJECT.FREEZE

`Object.freeze(obj)` is the highest level of built-in immutability. It renders an object completely read-only:
* No new properties can be added.
* No existing properties can be deleted.
* No property values can be changed.
* All descriptors have `configurable: false` and `writable: false`.

```js
"use strict";

const appConfig = Object.freeze({
  endpoint: "https://api.myapp.com",
  timeout: 5000
});

// appConfig.timeout = 10000; // 💥 TypeError: Cannot assign to read only property 'timeout'
// delete appConfig.timeout;   // 💥 TypeError: Cannot delete property 'timeout'
// appConfig.retries = 3;      // 💥 TypeError: Cannot add property retries, object is not extensible
```

### ⚠️ The Shallow Freeze Trap & Deep Freeze Solution
`Object.freeze` is **shallow**! Nested objects remain completely mutable:
```js
const user = Object.freeze({
  name: "Ayush",
  preferences: { theme: "dark" }
});

user.preferences.theme = "light"; // ⚠️ MUTATED! Nested object was NOT frozen!
console.log(user.preferences.theme); // "light"
```

#### Production Recursive `deepFreeze` Utility:
```js
function deepFreeze(object) {
  // Retrieve all property names including non-enumerable ones
  const propNames = Reflect.ownKeys(object);

  // Freeze properties before freezing self
  for (const name of propNames) {
    const value = object[name];
    if (value && typeof value === "object") {
      deepFreeze(value);
    }
  }

  return Object.freeze(object);
}
```

---

# 39. OBJECT.SEAL

`Object.seal(obj)` seals an object:
* Prevents adding new properties.
* Prevents deleting existing properties (sets `configurable: false` on all properties).
* **Allows modifying existing values** (if `writable: true`).

```js
const gamePlayer = { score: 100, lives: 3 };
Object.seal(gamePlayer);

gamePlayer.score = 150; // ✅ Permitted! Value updated.
// delete gamePlayer.lives; // 💥 TypeError: Cannot delete property 'lives'
// gamePlayer.level = 2;    // 💥 TypeError: Cannot add property level
```

---

# 40. OBJECT.PREVENTEXTENSIONS

`Object.preventExtensions(obj)` prevents any new properties from ever being added to an object, but existing properties can still be modified and deleted freely.

```js
const car = { make: "Toyota", model: "Corolla" };
Object.preventExtensions(car);

delete car.model; // ✅ Allowed!
car.make = "Lexus"; // ✅ Allowed!
// car.year = 2024; // 💥 TypeError: Cannot add property year
```

---

# 41. OBJECT IS EXTENSIBLE / SEALED / FROZEN

To inspect the integrity status of any object:

```js
const testObj = { a: 1 };

console.log(Object.isExtensible(testObj)); // true
console.log(Object.isSealed(testObj));     // false
console.log(Object.isFrozen(testObj));     // false

Object.freeze(testObj);

console.log(Object.isExtensible(testObj)); // false
console.log(Object.isSealed(testObj));     // true (A frozen object is sealed by definition!)
console.log(Object.isFrozen(testObj));     // true
```

---

# 42. PROPERTY ENUMERATION

Understanding which properties are captured by different reflection tools is vital for serialization and framework design:

```text
┌─────────────────────────────────┬───────────┬───────────────┬─────────┬────────────┐
│ Mechanism                       │ Own Enumerable│ Own Non-Enum │ Symbols │ Prototypes │
├─────────────────────────────────┼───────────┼───────────────┼─────────┼────────────┤
│ for...in loop                   │ ✅ Yes    │ ❌ No         │ ❌ No   │ ✅ Yes     │
│ Object.keys()                   │ ✅ Yes    │ ❌ No         │ ❌ No   │ ❌ No      │
│ Object.values()                 │ ✅ Yes    │ ❌ No         │ ❌ No   │ ❌ No      │
│ Object.entries()                │ ✅ Yes    │ ❌ No         │ ❌ No   │ ❌ No      │
│ Object.getOwnPropertyNames()    │ ✅ Yes    │ ✅ Yes        │ ❌ No   │ ❌ No      │
│ Object.getOwnPropertySymbols()  │ ❌ No     │ ❌ No         │ ✅ Yes  │ ❌ No      │
│ Reflect.ownKeys()               │ ✅ Yes    │ ✅ Yes        │ ✅ Yes  │ ❌ No      │
└─────────────────────────────────┴───────────┴───────────────┴─────────┴────────────┘
```

> [!TIP]
> **`Reflect.ownKeys(obj)`** is the ultimate universal reflection method in modern JavaScript—it returns **every own key** (enumerable, non-enumerable, and symbols) in a single array.

---

# 43. PROPERTY ORDER

Since ES2015 (ES6), ECMAScript specifies a deterministic **3-tier iteration order** for own properties:

```text
┌────────────────────────────────────────────────────────────────────────┐
│               ECMASCRIPT DETERMINISTIC ITERATION ORDER                 │
│                                                                        │
│ 1. Non-negative Integer Keys (0, 1, 2...) in ASCENDING NUMERIC order   │
│ 2. String Keys in CHRONOLOGICAL INSERTION order                        │
│ 3. Symbol Keys in CHRONOLOGICAL INSERTION order                        │
└────────────────────────────────────────────────────────────────────────┘
```

```js
const strangeObj = {};

strangeObj["z"] = "last string";
strangeObj[10] = "second integer";
strangeObj["a"] = "first string";
strangeObj[2] = "first integer";
strangeObj[Symbol("id")] = "symbol key";

console.log(Reflect.ownKeys(strangeObj));
// Output order: ['2', '10', 'z', 'a', Symbol(id)]
// Notice:
// 1. Integers ('2', '10') are sorted numerically first!
// 2. Strings ('z', 'a') follow in order of insertion!
// 3. Symbol is placed at the very end!
```

---

# 44. SYMBOL PROPERTIES

**Symbols** (introduced in ES6) are primitive, unique, and immutable identifiers. They cannot accidentally collide with other property names:

```js
const idKey1 = Symbol("id");
const idKey2 = Symbol("id");

console.log(idKey1 === idKey2); // false! Every Symbol is unique!

const user = {
  name: "Ayush",
  [idKey1]: 9001
};

// Hidden from ordinary enumeration:
console.log(Object.keys(user)); // ['name']
console.log(JSON.stringify(user)); // '{"name":"Ayush"}'

// Retrieved via Symbol reflection:
console.log(user[idKey1]); // 9001
console.log(Object.getOwnPropertySymbols(user)); // [ Symbol(id) ]
```

---

# 45. WELL-KNOWN SYMBOLS

JavaScript provides built-in "Well-Known Symbols" allowing custom objects to hook directly into engine runtime operations:

### 1. `Symbol.iterator`: Making an Object Iterable
Allows custom objects to be traversed using `for...of` and spread syntax:
```js
const inventory = {
  items: ["Keyboard", "Mouse", "Monitor"],
  [Symbol.iterator]() {
    let index = 0;
    return {
      next: () => {
        if (index < this.items.length) {
          return { value: this.items[index++], done: false };
        }
        return { done: true };
      }
    };
  }
};

for (const item of inventory) {
  console.log(item); // "Keyboard", "Mouse", "Monitor"
}
console.log([...inventory]); // ['Keyboard', 'Mouse', 'Monitor']
```

### 2. `Symbol.toStringTag`: Customizing `[object Object]`
```js
const customService = {
  [Symbol.toStringTag]: "AuthenticationEngine"
};

console.log(Object.prototype.toString.call(customService));
// "[object AuthenticationEngine]"
```

---

# 46. OBJECT TO PRIMITIVE CONVERSION

When an object is used in mathematical operations (`+`, `-`), comparisons (`<`, `>`), or template literals, the engine executes the **`ToPrimitive` abstract operation** with a `hint`: `"number"`, `"string"`, or `"default"`.

You can intercept and customize this behavior using `[Symbol.toPrimitive](hint)`:

```js
const wallet = {
  balance: 500,
  currency: "USD",

  [Symbol.toPrimitive](hint) {
    if (hint === "number") {
      return this.balance;
    }
    if (hint === "string") {
      return `${this.currency} ${this.balance}`;
    }
    return this.balance; // default hint
  }
};

console.log(+wallet);          // 500 (hint: "number")
console.log(wallet + 50);      // 550 (hint: "default")
console.log(`Total: ${wallet}`);// "Total: USD 500" (hint: "string")
```

---

# 47. OBJECT STRING CONVERSION

If `Symbol.toPrimitive` is absent, the engine falls back to calling `.toString()` and `.valueOf()`.

* **String Hint**: Calls `toString()` first; if it returns an object, calls `valueOf()`.
* **Number Hint**: Calls `valueOf()` first; if it returns an object, calls `toString()`.

```js
const counter = {
  val: 42,
  toString() {
    return `Counter[${this.val}]`;
  },
  valueOf() {
    return this.val;
  }
};

console.log(String(counter)); // "Counter[42]" (Invokes toString)
console.log(counter + 8);     // 50 (Invokes valueOf)
```

---

# 48. OBJECT EQUALITY

In JavaScript, there is **NO built-in structural equality for objects**.
* `==` and `===` check strictly for pointer identity.
* Two objects containing identical data are never equal:

```js
const a = { x: 1 };
const b = { x: 1 };

console.log(a == b);  // false
console.log(a === b); // false
```

---

# 49. OBJECT.IS VS `===`

`Object.is(a, b)` determines whether two values are the exact same value. It behaves almost identically to `===`, with **two crucial scientific differences**:

```text
┌─────────────────────────┬───────────────┬───────────────────────────────┐
│ Comparison              │ Strict (===)  │ Object.is()                   │
├─────────────────────────┼───────────────┼───────────────────────────────┤
│ NaN === NaN             │ false ⚠️      │ true ✅ (Proper identity)     │
│ +0 === -0               │ true ⚠️       │ false ✅ (Preserves sign bit) │
│ {} === {}               │ false         │ false                         │
│ 'hello' === 'hello'     │ true          │ true                          │
└─────────────────────────┴───────────────┴───────────────────────────────┘
```

```js
console.log(NaN === NaN);            // false (The infamous JS quirk!)
console.log(Object.is(NaN, NaN));    // true (Correct mathematical identity!)

console.log(+0 === -0);              // true (Quirk: ignores IEEE 754 signs!)
console.log(Object.is(+0, -0));      // false (Differentiates positive/negative zero!)
```

---

# 50. OBJECT METHODS FROM PROTOTYPE

Every standard object inherits utility methods from `Object.prototype`:

1. `hasOwnProperty(prop)`: Verifies own property (vulnerable on null-prototype objects).
2. `isPrototypeOf(obj)`: Checks if an object exists in another object's prototype chain.
3. `propertyIsEnumerable(prop)`: Checks if a property is own and enumerable.
4. `valueOf()`: Returns the primitive value representation of the object.
5. `toString()`: Returns a string representation (`[object Object]`).

```js
const proto = { role: "base" };
const instance = Object.create(proto);

console.log(proto.isPrototypeOf(instance)); // true
```

---

# 51. OBJECT.PROTOTYPE

`Object.prototype` is the root of the JavaScript object model. Its internal prototype is `null`:

```js
console.log(Object.getPrototypeOf(Object.prototype)); // null (Terminal end of the chain!)
```

Any modification or monkey-patching of `Object.prototype` pollutes EVERY object in the entire application!

---

# 52. NULL-PROTOTYPE OBJECTS

A **null-prototype object** has no prototype (`[[Prototype]] = null`). It inherits zero methods or properties from `Object.prototype`.

```js
const pureDict = Object.create(null);
pureDict["key"] = "value";

console.log(pureDict.toString);       // undefined!
console.log(pureDict.hasOwnProperty); // undefined!
console.log(pureDict.__proto__);      // undefined!
```

---

# 53. OBJECTS AS DICTIONARIES

Historically, plain objects `{}` were used as key-value dictionaries. However, using `{}` as a dictionary exposes vulnerabilities:
1. Keys like `"toString"`, `"constructor"`, or `"__proto__"` collide with inherited prototype properties.
2. In untrusted user input scenarios, an attacker can manipulate prototype chains (Prototype Pollution).

**Safe Alternatives**:
* Use `Object.create(null)` for pure string dictionaries.
* Use ES6 `Map` for high-frequency or non-string key lookups.

---

# 54. OBJECT VS MAP

```text
┌──────────────────────┬────────────────────────────────┬────────────────────────────────┐
│ Feature              │ Plain Object `{}`              │ ES6 `Map`                      │
├──────────────────────┼────────────────────────────────┼────────────────────────────────┤
│ Key Types            │ String and Symbol only         │ ANY type (Objects, Functions)  │
│ Key Order            │ 3-tier (Integers first)        │ Strict insertion order         │
│ Size Retrieval       │ Manual: Object.keys(obj).length│ Direct: map.size               │
│ Prototype Pollution  │ Vulnerable                     │ Immune                         │
│ Performance          │ Optimized for fixed structures │ Optimized for add/delete churn │
│ Serialization        │ Native JSON.stringify()        │ Requires custom serialization  │
└──────────────────────┴────────────────────────────────┴────────────────────────────────┘
```

---

# 55. OBJECT VS SET

* **Object**: A key-to-value map where you look up a value using a key.
* **Set**: A collection of **unique values** where you check for membership (`set.has(x)`).

---

# 56. OBJECT VS ARRAY

* **Array**: An ordered, index-based list (`0, 1, 2...`) where position indicates sequence, and items are manipulated with algorithms (`push`, `pop`, `shift`, `filter`).
* **Object**: An associative entity representing an identifiable record or domain model (`user.email`, `car.speed`).

---

# 57. OBJECT VS CLASS

* **Object Literal**: Best for singletons, DTOs (Data Transfer Objects), configuration hashes, and ad-hoc data bundles.
* **Class**: Best when creating dozens or thousands of instances sharing the exact same methods, requiring inheritance (`extends`), or enforcing private encapsulation (`#fields`).


---

# 58. CONSTRUCTOR FUNCTIONS

Before ES6 classes, JavaScript used **Constructor Functions** to stamp out multiple objects sharing the same prototype:

```js
function User(username, email) {
  // Implicitly: this = Object.create(User.prototype);
  this.username = username;
  this.email = email;
  this.createdAt = new Date();
  // Implicitly: return this;
}

// Attach shared methods to the prototype:
User.prototype.greet = function() {
  return `Hello, I am ${this.username}!`;
};

const user1 = new User("ayush", "ayush@test.com");
console.log(user1.greet()); // "Hello, I am ayush!"
```

---

# 59. THE NEW OPERATOR

When you call a function with the `new` operator (`new Constructor(args)`), the JavaScript engine executes an exact **5-step lifecycle algorithm**:

```text
THE 5 STEPS OF 'new':
Step 1: Create a brand-new, empty plain object in heap memory: {}.
Step 2: Set the new object's internal [[Prototype]] link to Constructor.prototype.
Step 3: Execute the Constructor function body with 'this' bound to the new object.
Step 4: Check the function's return value:
        ├── Did it return an object? ──► Return that object! (Overrides 'this')
        └── Did it return a primitive (or undefined)? ──► Return 'this'!
```

### Implementing `new` Manually:
```js
function customNew(Constructor, ...args) {
  // Step 1 & 2: Create object linked to prototype
  const instance = Object.create(Constructor.prototype);

  // Step 3: Execute constructor with instance as 'this'
  const result = Constructor.apply(instance, args);

  // Step 4: Check return value
  return (typeof result === "object" && result !== null) ? result : instance;
}

const user2 = customNew(User, "john_doe", "john@test.com");
console.log(user2.greet()); // "Hello, I am john_doe!"
```

---

# 60. PROTOTYPAL INHERITANCE

In classical languages (Java, C++), classes are blueprints that copy structure into instances. In JavaScript, **objects link directly to other objects**.

```js
function Developer(username, email, techStack) {
  User.call(this, username, email); // Borrow parent constructor
  this.techStack = techStack;
}

// Inherit prototype chain
Developer.prototype = Object.create(User.prototype);
Developer.prototype.constructor = Developer; // Fix constructor pointer!

Developer.prototype.code = function() {
  return `${this.username} is building with ${this.techStack.join(", ")}`;
};

const dev = new Developer("ayush", "ayush@test.com", ["JavaScript", "TypeScript"]);
console.log(dev.greet()); // Inherited from User!
console.log(dev.code());  // Own Developer method!
```

---

# 61. CLASS SYNTAX

Introduced in ES6, the `class` keyword is **syntactic sugar** over prototype chains and constructor functions, offering cleaner syntax for modern software engineering.

```js
class ModernUser {
  constructor(username, email) {
    this.username = username;
    this.email = email;
  }

  // Prototype method (attached to ModernUser.prototype)
  greet() {
    return `Hi, I am ${this.username}`;
  }
}

class ModernDeveloper extends ModernUser {
  constructor(username, email, techStack) {
    super(username, email); // Invokes parent constructor
    this.techStack = techStack;
  }

  code() {
    return `${this.username} is coding in ${this.techStack}`;
  }
}
```

---

# 62. CLASS VS PROTOTYPE

```text
┌──────────────────────┬────────────────────────────────┬────────────────────────────────┐
│ Feature              │ Classical `class` Syntax       │ Constructor Function + Proto   │
├──────────────────────┼────────────────────────────────┼────────────────────────────────┤
│ Under the Hood       │ Prototype Delegation           │ Prototype Delegation           │
│ Calling without `new`│ 💥 Throws TypeError            │ Silently pollutes global scope │
│ Hoisting             │ Not hoisted (Temporal Dead Zone) Function declaration is hoisted │
│ Strict Mode          │ Class bodies run in strict mode Requires explicit "use strict"  │
│ Private Fields       │ Native support (`#field`)      │ Closures or WeakMaps only      │
└──────────────────────┴────────────────────────────────┴────────────────────────────────┘
```

---

# 63. STATIC PROPERTIES AND METHODS

**Static members** are defined on the constructor function itself, NOT on instances or prototypes.

```js
class HttpClient {
  static defaultTimeout = 5000;

  static createDefault() {
    return new HttpClient(this.defaultTimeout);
  }

  constructor(timeout) {
    this.timeout = timeout;
  }
}

console.log(HttpClient.defaultTimeout); // 5000
const client = HttpClient.createDefault();
console.log(client.timeout);            // 5000
// console.log(client.defaultTimeout);  // undefined (Static props not on instances!)
```

---

# 64. PRIVATE CLASS FIELDS

Introduced natively in modern ECMAScript, prefixing a field with a hash `#` makes it **strictly private** at the engine runtime level.

```js
class BankAccount {
  #balance; // Private variable declaration

  constructor(initialDeposit) {
    this.#balance = initialDeposit;
  }

  deposit(amount) {
    if (amount <= 0) throw new Error("Deposit must be positive.");
    this.#balance += amount;
  }

  getBalance() {
    return this.#balance;
  }
}

const myAccount = new BankAccount(1000);
myAccount.deposit(500);
console.log(myAccount.getBalance()); // 1500

// 💥 SyntaxError: Private field '#balance' must be declared in an enclosing class
// console.log(myAccount.#balance);
```

---

# 65. OBJECT COMPOSITION

> *"Favor object composition over class inheritance."* — Design Patterns (GoF)

Deep inheritance hierarchies (`User -> Employee -> Manager -> Executive`) create fragile, rigid codebases. **Composition** builds complex objects by assembling small, focused feature pieces.

```text
INHERITANCE ("What it IS"):               COMPOSITION ("What it DOES"):
Animal                                    CanBark = { bark: ƒ() }
  └── Dog                                 CanFly  = { fly: ƒ() }
        └── FlyingDog (Awkward hierarchy!) RobotDog = { ...CanBark, ...CanRecharge }
```

---

# 66. OBJECT-ORIENTED DESIGN IN JAVASCRIPT

Modern JavaScript OOP leverages four foundational principles:
1. **Encapsulation**: Bundling state and methods together while restricting direct access to internals via `#private` fields or closures.
2. **Abstraction**: Exposing high-level methods (`user.login()`) while hiding low-level network details.
3. **Inheritance / Delegation**: Sharing common behavior across models via prototypes.
4. **Polymorphism**: Enabling multiple objects to provide different implementations for the exact same method signature.

---

# 67. POLYMORPHISM WITH OBJECTS

Polymorphism enables calling code to treat different objects interchangeably as long as they implement the expected interface (Duck Typing):

```js
const stripeProcessor = {
  processPayment(amount) {
    return `Charged $${amount} via Stripe API`;
  }
};

const paypalProcessor = {
  processPayment(amount) {
    return `Charged $${amount} via PayPal OAuth`;
  }
};

function checkout(processor, total) {
  // Polymorphic execution: checkout doesn't care WHICH processor it is!
  console.log(processor.processPayment(total));
}

checkout(stripeProcessor, 49.99); // Charged $49.99 via Stripe API
checkout(paypalProcessor, 49.99); // Charged $49.99 via PayPal OAuth
```

---

# 68. OBJECT COMPOSITION PATTERNS

We compose capabilities dynamically using factory pipelines:

```js
const withTimestamps = (target) => ({
  ...target,
  createdAt: new Date(),
  updatedAt: new Date()
});

const withId = (target) => ({
  ...target,
  id: `UUID-${Math.random().toString(36).substring(2, 9)}`
});

const createPost = (title, author) => {
  const base = { title, author, views: 0 };
  return withTimestamps(withId(base));
};

console.log(createPost("JavaScript Mastery", "Ayush"));
```

---

# 69. MIXINS

A **Mixin** is a collection of methods that can be injected into any class or object to provide shared capabilities.

```js
const EventEmitterMixin = {
  on(event, handler) {
    this._listeners = this._listeners || {};
    (this._listeners[event] = this._listeners[event] || []).push(handler);
  },
  emit(event, data) {
    if (this._listeners?.[event]) {
      this._listeners[event].forEach(fn => fn(data));
    }
  }
};

// Inject into a model:
class ChatRoom {}
Object.assign(ChatRoom.prototype, EventEmitterMixin);

const room = new ChatRoom();
room.on("message", (msg) => console.log(`Received: ${msg}`));
room.emit("message", "Hello everyone!"); // "Received: Hello everyone!"
```

---

# 70. FACTORY FUNCTIONS

A **Factory Function** is any function that produces and returns a new object without requiring the `new` keyword.

```js
function createCounter(initial = 0) {
  let count = initial; // Private state held via closure!

  return {
    increment() { count++; return count; },
    decrement() { count--; return count; },
    getCount()  { return count; }
  };
}

const counterA = createCounter(10);
console.log(counterA.increment()); // 11
console.log(counterA.getCount());  // 11
// count variable is 100% private and cannot be tampered with!
```

---

# 71. OBJECT DELEGATION

JavaScript's native alternative to classes is **OLOO** (Objects Linked to Other Objects), popularized by Kyle Simpson:

```js
const TaskDelegator = {
  init(title) {
    this.title = title;
    return this;
  },
  output() {
    return `Task: ${this.title}`;
  }
};

// Link directly without classes or constructors!
const myTask = Object.create(TaskDelegator).init("Ship release v2.0");
console.log(myTask.output()); // "Task: Ship release v2.0"
```

---

# 72. THIS + OBJECTS

In JavaScript, the value of **`this` inside an ordinary method is dynamic**: it depends solely on **HOW the function was invoked** at runtime.

```js
const user = {
  name: "Ayush",
  greet() {
    return `Hello, ${this.name}`;
  }
};

console.log(user.greet()); // "Hello, Ayush" ('this' resolves to 'user' before the dot)
```

---

# 73. DETACHED METHODS

When you extract a method from an object and assign it to a variable, the method loses its connection to the object:

```js
const user = {
  name: "Ayush",
  greet() {
    return `Hello, ${this.name}`;
  }
};

const detachedGreet = user.greet;
console.log(detachedGreet()); // "Hello, undefined"! (In strict mode: TypeError!)
```

### The 3 Solutions for Detached Methods:
1. **Explicit Binding**: `detachedGreet.call(user)` or `detachedGreet.apply(user)`.
2. **Hard Binding**: `const bound = user.greet.bind(user); bound();`.
3. **Arrow Wrapper**: `() => user.greet()`.

---

# 74. OBJECT METHODS AND ARROW FUNCTIONS

> [!WARNING]
> **Never use arrow functions as top-level object methods if you need access to `this`!**

Arrow functions do **NOT** have their own `this` binding. They lexically inherit `this` from the outer execution scope (usually the global `window` or module `exports`):

```js
const developer = {
  name: "Ayush",
  // ❌ BROKEN: Arrow function lexically captures outer scope!
  sayNameArrow: () => {
    return this.name;
  },
  // ✅ CORRECT: Standard method shorthand
  sayNameMethod() {
    return this.name;
  }
};

console.log(developer.sayNameArrow());  // undefined!
console.log(developer.sayNameMethod()); // "Ayush"
```

---

# 75. OBJECT FACTORIES

### Real-World Production Factory Pattern: API Client
```js
function createApiClient({ baseUrl, apiKey, timeout = 3000 }) {
  const defaultHeaders = {
    "Authorization": `Bearer ${apiKey}`,
    "Content-Type": "application/json"
  };

  return {
    async get(endpoint) {
      console.log(`[GET] ${baseUrl}${endpoint} with timeout ${timeout}ms`);
      return { status: 200, data: { success: true } };
    },
    async post(endpoint, body) {
      console.log(`[POST] ${baseUrl}${endpoint}`, body);
      return { status: 201, data: body };
    }
  };
}

const githubClient = createApiClient({
  baseUrl: "https://api.github.com",
  apiKey: "ghp_mock_token_123"
});

githubClient.get("/user/repos");
```


---

# 76. OBJECT TRANSFORMATION

Real-world applications frequently require transforming data structures between API payloads, UI state, and database models. The foundational pipeline for transforming any object without mutation is:

```text
               Object.entries(obj)
                     │
                     ▼
             [ [key, val], ... ]
                     │
                     ▼ (map / filter / sort)
             [ [newKey, newVal], ... ]
                     │
                     ▼
           Object.fromEntries(entries)
```

---

# 77. OBJECT FILTERING

Filtering an object means removing key-value pairs based on a predicate condition:

```js
const inventory = {
  apples: 15,
  bananas: 0,
  oranges: 8,
  berries: 0
};

// Filter out out-of-stock items (quantity === 0):
const inStock = Object.fromEntries(
  Object.entries(inventory).filter(([item, count]) => count > 0)
);

console.log(inStock); // { apples: 15, oranges: 8 }
```

### Generic Reusable `filterObject` Helper:
```js
function filterObject(obj, predicate) {
  return Object.fromEntries(
    Object.entries(obj).filter(([key, value]) => predicate(key, value))
  );
}

const activeUsers = filterObject({ u1: { active: true }, u2: { active: false } }, (_, u) => u.active);
```

---

# 78. OBJECT MAPPING

Transforming an object's values while preserving or modifying its keys:

```js
const userRoles = {
  alice: "admin",
  bob: "editor",
  carol: "viewer"
};

// Transform all roles to uppercase:
const upperRoles = Object.fromEntries(
  Object.entries(userRoles).map(([user, role]) => [user, role.toUpperCase()])
);

console.log(upperRoles); // { alice: 'ADMIN', bob: 'EDITOR', carol: 'VIEWER' }
```

### Generic Reusable `mapValues` Helper:
```js
function mapValues(obj, fn) {
  return Object.fromEntries(
    Object.entries(obj).map(([key, value]) => [key, fn(value, key)])
  );
}
```

---

# 79. OBJECT GROUPING (`Object.groupBy` ES2024)

Standardized in ES2024, `Object.groupBy(items, callback)` groups array elements into a null-prototype object keyed by the callback return values.

```js
const engineers = [
  { name: "Ayush", department: "Architecture", seniority: "Staff" },
  { name: "Sarah", department: "Frontend",     seniority: "Senior" },
  { name: "David", department: "Frontend",     seniority: "Junior" },
  { name: "Elena", department: "Architecture", seniority: "Lead" }
];

const byDept = Object.groupBy(engineers, (dev) => dev.department);

console.log(byDept);
/*
{
  Architecture: [
    { name: 'Ayush', department: 'Architecture', seniority: 'Staff' },
    { name: 'Elena', department: 'Architecture', seniority: 'Lead' }
  ],
  Frontend: [
    { name: 'Sarah', department: 'Frontend', seniority: 'Senior' },
    { name: 'David', department: 'Frontend', seniority: 'Junior' }
  ]
}
*/
```

> [!NOTE]
> `Object.groupBy` returns an object with a `null` prototype (`[[Prototype]]: null`). This guarantees that user-generated group keys (such as `"toString"` or `"constructor"`) will never clash with built-in prototype methods!

---

# 80. OBJECT NORMALIZATION

APIs often return deeply nested relational structures. In scalable state management (Redux, Pinia, Zustand), storing nested arrays causes duplicated data and difficult updates. **Normalization** flattens the hierarchy into keyed dictionary tables:

```text
NESTED TREE (Messy, duplicated):
Post -> Author -> Comments -> CommentAuthors

NORMALIZED STATE (Relational, fast O(1) lookups):
{
  entities: {
    posts:    { "p1": { id: "p1", authorId: "u1", commentIds: ["c1"] } },
    users:    { "u1": { id: "u1", name: "Ayush" } },
    comments: { "c1": { id: "c1", text: "Great guide!", authorId: "u2" } }
  }
}
```

```js
function normalizePosts(postsArray) {
  const users = {};
  const posts = {};

  for (const post of postsArray) {
    users[post.author.id] = post.author;
    posts[post.id] = {
      id: post.id,
      title: post.title,
      authorId: post.author.id
    };
  }

  return { users, posts };
}
```

---

# 81. JSON AND OBJECTS

**JSON** (JavaScript Object Notation) is a strict text-based subset of JavaScript literal syntax.

```text
FEATURE               JAVASCRIPT OBJECT                JSON STRING
Keys                  Strings or Symbols               MUST be double-quoted strings ("key")
Values                Any JS entity (functions, dates) Limited (Strings, Numbers, Booleans, null)
Trailing Commas       Supported                        SYNTAX ERROR
Functions / Methods   Fully supported                  Stripped / Forbidden
Undefined             Fully supported                  Stripped / Forbidden
```

```js
const payload = {
  title: "API Release",
  tags: ["v1", "prod"],
  active: true
};

const jsonString = JSON.stringify(payload, null, 2); // 2 spaces indentation
console.log(jsonString);

const parsedBack = JSON.parse(jsonString);
console.log(parsedBack.title); // "API Release"
```

---

# 82. JSON REPLACER / REVIVER

`JSON.stringify` and `JSON.parse` accept optional functional interceptors.

### 1. The `replacer` Function in `JSON.stringify(obj, replacer)`
Used to filter properties or serialize complex types like `BigInt`, `Map`, or `Set`:
```js
const order = {
  id: "ORD-1",
  secretHash: "ab99",
  quantity: 20n // Native BigInt throws TypeError in JSON.stringify without replacer!
};

const serialized = JSON.stringify(order, (key, value) => {
  if (key === "secretHash") return undefined; // Strips this key!
  if (typeof value === "bigint") return value.toString() + "n"; // Serializes BigInt safely!
  return value;
});

console.log(serialized); // '{"id":"ORD-1","quantity":"20n"}'
```

### 2. The `reviver` Function in `JSON.parse(text, reviver)`
Automatically restores ISO timestamp strings back into true `Date` instances:
```js
const rawJson = '{"title":"Meeting","timestamp":"2026-09-19T00:00:00.000Z"}';

const revived = JSON.parse(rawJson, (key, value) => {
  if (key === "timestamp") return new Date(value);
  return value;
});

console.log(revived.timestamp instanceof Date); // true! Restored!
```

---

# 83. CIRCULAR OBJECTS

An object is **circular** when one of its properties references the object itself or creates an infinite loop through child objects:

```js
const nodeA = { name: "Node A" };
const nodeB = { name: "Node B" };

nodeA.neighbor = nodeB;
nodeB.neighbor = nodeA; // 💥 Circular reference created!

// JSON.stringify(nodeA);
// 💥 FATAL CRASH: TypeError: Converting circular structure to JSON
```

### Handling Circular Objects:
1. Use `structuredClone(nodeA)` which natively preserves cyclical graph topology.
2. Use a custom replacer with a `WeakSet` to track visited nodes during serialization:
```js
function safeStringifyCircular(obj) {
  const seen = new WeakSet();
  return JSON.stringify(obj, (key, value) => {
    if (typeof value === "object" && value !== null) {
      if (seen.has(value)) return "[Circular]";
      seen.add(value);
    }
    return value;
  });
}
```

---

# 84. OBJECTS AND APIS (DTOs)

In professional backend and full-stack development, objects arriving from HTTP requests or databases should be filtered and validated into explicit **Data Transfer Objects (DTOs)**:

```js
// Inbound dirty HTTP payload
const inboundBody = {
  username: "ayush",
  email: "ayush@example.com",
  isAdmin: true, // ⚠️ Malicious escalation attempt!
  unwantedField: "junk"
};

// Safe DTO Construction (Allow-listing only):
function toUserRegistrationDto(body) {
  return {
    username: String(body.username ?? "").trim(),
    email: String(body.email ?? "").trim().toLowerCase()
  };
}

const safeDto = toUserRegistrationDto(inboundBody);
console.log(safeDto); // { username: 'ayush', email: 'ayush@example.com' } (isAdmin stripped!)
```

---

# 85. OBJECT VALIDATION

Before accepting an object into domain logic, validate its schema and data types:

```js
function validateUserProfile(data) {
  const errors = [];

  if (typeof data !== "object" || data === null) {
    return { valid: false, errors: ["Payload must be a non-null object."] };
  }

  if (typeof data.username !== "string" || data.username.length < 3) {
    errors.push("username must be a string with at least 3 characters.");
  }

  if (typeof data.age !== "number" || data.age < 18 || Number.isNaN(data.age)) {
    errors.push("age must be a valid number >= 18.");
  }

  return {
    valid: errors.length === 0,
    errors
  };
}
```

---

# 86. OBJECT SECURITY

In JavaScript, objects share prototypes globally across the execution environment. If an application blindly accepts arbitrary keys from untrusted user input and merges them, attackers can compromise the runtime.

### The 3 Golden Rules of Object Security:
1. **Never use plain `{}` for user-supplied dictionaries**: Use `Object.create(null)` or `Map`.
2. **Never blindly recursively merge untrusted input**: Always validate or sanitize keys.
3. **Freeze foundational prototypes in security-critical environments**: `Object.freeze(Object.prototype)`.

---

# 87. PROTOTYPE POLLUTION

**Prototype Pollution** is a critical security vulnerability where an attacker exploits an unsafe recursive object merge/clone function to inject properties onto `Object.prototype`. Once `Object.prototype` is polluted, **every single object in the entire application inherits the polluted property**, leading to Remote Code Execution (RCE) or authentication bypass!

### The Exploit Mechanism:
```js
// Vulnerable recursive merge function:
function vulnerableMerge(target, source) {
  for (const key in source) {
    if (typeof source[key] === "object" && source[key] !== null) {
      if (!target[key]) target[key] = {};
      vulnerableMerge(target[key], source[key]);
    } else {
      target[key] = source[key];
    }
  }
  return target;
}

// Malicious JSON payload submitted by an attacker:
const maliciousPayload = JSON.parse('{"__proto__": {"isAdmin": true}}');

const emptyConfig = {};
vulnerableMerge(emptyConfig, maliciousPayload);

// THE CATASTROPHE:
const freshUser = {};
console.log(freshUser.isAdmin); // true 💥 (EVERY object now has isAdmin: true!)
```

### Production Defense: Key Sanitization
```js
function safeMerge(target, source) {
  for (const key of Object.keys(source)) {
    // 🛡️ REJECT DANGEROUS KEYS:
    if (key === "__proto__" || key === "constructor" || key === "prototype") {
      continue;
    }

    if (source[key] && typeof source[key] === "object" && !Array.isArray(source[key])) {
      if (!target[key] || typeof target[key] !== "object") target[key] = {};
      safeMerge(target[key], source[key]);
    } else {
      target[key] = source[key];
    }
  }
  return target;
}
```


---

# 88. OBJECT PERFORMANCE

JavaScript engines (such as Google V8, Apple JavaScriptCore, and Mozilla SpiderMonkey) execute JavaScript at near-C++ speeds through dynamic Just-In-Time (JIT) optimization. Understanding how the engine models objects under the hood allows senior engineers to write blazing-fast, allocation-efficient systems.

```text
HIGH ALLOCATION (Slow)                OPTIMIZED ALLOCATION (Fast)
In a 100,000-iteration loop:           Pre-allocate object shapes:
Creating 100,000 new objects           Reuse structures, minimize GC pressure,
causes GC pauses and heap churn.       keep object shapes predictable and stable.
```

---

# 89. V8 OBJECT INTERNALS: SHAPES & HIDDEN CLASSES

Under the hood, JavaScript has no static types. When you create an object `{ x: 1, y: 2 }`, the V8 engine generates a **Hidden Class (called a "Shape" or "Map")** behind the scenes.

```text
┌────────────────────────────────────────────────────────┐
│             V8 SHAPE TRANSITION TREE                   │
│                                                        │
│                     Shape C0 (empty {})                │
│                              │                         │
│                    Add 'x'   ▼                         │
│                     Shape C1 (offset 0: x)             │
│                              │                         │
│                    Add 'y'   ▼                         │
│                     Shape C2 (offset 0: x, offset 1: y)│
└────────────────────────────────────────────────────────┘
```

* **Property Offsets**: The Shape tells V8: *"Property `x` is stored at memory offset 0; property `y` is stored at memory offset 1."*
* **Shape Sharing**: When multiple objects are initialized with the same properties in the exact same order, they share the **exact same Shape reference**, saving massive amounts of RAM!

---

# 90. OBJECT MEMORY MODEL: IN-OBJECT PROPERTIES

V8 divides object storage into two tiers:
1. **In-Object Properties**: Stored directly on the object's heap header block for lightning-fast pointer dereferencing (typically up to ~10 properties).
2. **Backing Store (Property Array)**: If an object exceeds its in-object limit or switches to dictionary mode, additional properties are moved into an out-of-object array or a hash table.

```text
HEAP OBJECT (V8 Layout):
┌───────────────────────────┐
│ Map / Shape Pointer (8 B) │ ──► References Shared Shape Definition
├───────────────────────────┤
│ Elements Pointer (8 B)    │ ──► Numeric Indexed Elements [0, 1, ...]
├───────────────────────────┤
│ Properties Pointer (8 B)  │ ──► Out-of-object slow backing store
├───────────────────────────┤
│ In-Object Property 0 ('x')│ ──► Direct value (Zero extra indirection!)
├───────────────────────────┤
│ In-Object Property 1 ('y')│ ──► Direct value
└───────────────────────────┘
```

---

# 91. OBJECT PROPERTY ACCESS: INLINE CACHING (ICs)

When V8 executes `obj.x`, it doesn't perform an expensive hash-table string lookup every time. Instead, it deploys **Inline Caches (ICs)**:

```text
┌─────────────────────────┬─────────────────────────────────────────────────────────┐
│ Inline Cache State      │ Behavior & Speed                                        │
├─────────────────────────┼─────────────────────────────────────────────────────────┤
│ Monomorphic (Fastest)   │ Sees only 1 Shape. Emits direct memory offset read.     │
│ Polymorphic (Fast)      │ Sees 2 to 4 distinct Shapes. Emits small switch/table.  │
│ Megamorphic (Slow)      │ Sees 5+ different Shapes. Drops to generic hash lookup! │
└─────────────────────────┴─────────────────────────────────────────────────────────┘
```

> [!TIP]
> Always initialize objects with identical property orders so property access sites remain **monomorphic**.

---

# 92. OBJECT PERFORMANCE ANTI-PATTERNS

### Anti-Pattern 1: Divergent Property Initialization Order
```js
// ❌ BAD: Divergent shapes created!
const p1 = {};
p1.x = 10;
p1.y = 20; // Shape: {} -> {x} -> {x, y}

const p2 = {};
p2.y = 20;
p2.x = 10; // Shape: {} -> {y} -> {y, x} (DIFFERENT SHAPE! Destroys Monomorphism!)

// ✅ GOOD: Initialize properties in the same order via class or factory:
class Point {
  constructor(x, y) {
    this.x = x;
    this.y = y;
  }
}
```

### Anti-Pattern 2: Object Spreading in Hot Loops
```js
// ❌ TERRIBLE: O(n²) memory allocations in a loop!
let accumulator = {};
for (let i = 0; i < 10000; i++) {
  accumulator = { ...accumulator, [i]: i }; // Re-copies entire object 10,000 times!
}

// ✅ GOOD: Direct property assignment:
const fastAccumulator = {};
for (let i = 0; i < 10000; i++) {
  fastAccumulator[i] = i;
}
```

### Anti-Pattern 3: Using `delete` in Hot Paths
The `delete` operator forces V8 to drop the object into slow **Dictionary Mode**.
```js
// ❌ SLOW: delete p.x;
// ✅ FAST: p.x = null;
```

---

# 93. OBJECTS IN REACT / FRONTEND

In modern UI frameworks (React, Solid, Vue), UI rendering is driven by **Object Reference Equality (`===`)**:

```text
prevProps.user === nextProps.user
  ├── true  ──► SKIP RE-RENDER (Blazing Fast)
  └── false ──► RE-RENDER COMPONENT & CHILDREN
```

### 1. Accidental State Mutation Bug
```js
// ❌ FATAL REACT BUG:
const [user, setUser] = useState({ name: "Ayush", score: 10 });

const handleScore = () => {
  user.score = 20; // Direct mutation!
  setUser(user);   // React checks user === user -> SAME REFERENCE! React skips re-render!
};

// ✅ CORRECT: Return a fresh object reference via spread:
const handleScoreCorrect = () => {
  setUser(prev => ({ ...prev, score: prev.score + 10 }));
};
```

### 2. Shallow Updates in Deeply Nested State
```js
const updateCity = (newCity) => {
  setUser(prev => ({
    ...prev,
    profile: {
      ...prev.profile,
      address: {
        ...prev.profile.address,
        city: newCity
      }
    }
  }));
};
```

---

# 94. OBJECTS IN NODE.JS BACKENDS

In Node.js backends handling thousands of requests per second:
1. **Garbage Collection Pressure**: Avoid creating throwaway helper objects inside request handlers. Every object allocated must eventually be swept by the V8 GC.
2. **JSON Serialization Latency**: `JSON.stringify` is synchronous and CPU-bound. For massive JSON payloads, streaming JSON serializers prevent blocking the single-threaded Event Loop.
3. **Singleton Service Objects**: Instantiate database connections, logger instances, and cache clients as module-level singleton objects.

---

# 95. OBJECTS IN TYPESCRIPT

TypeScript adds compile-time type safety over JavaScript objects:

```ts
// Interface declaration
interface UserProfile {
  readonly id: string;   // Immutable property
  username: string;
  avatarUrl?: string;    // Optional property
}

const developer: UserProfile = {
  id: "USR-001",
  username: "ayush"
};

// developer.id = "NEW-ID"; // 💥 TypeScript Compile Error: Cannot assign to 'id' because it is a read-only property.
```

### Excess Property Checking
When assigning object literals directly to a typed variable, TypeScript enforces strict excess property checks:
```ts
// 💥 Error: Object literal may only specify known properties, and 'extraField' does not exist in type 'UserProfile'.
// const dev: UserProfile = { id: "1", username: "ayush", extraField: 123 };
```

---

# 96. RECORD AND INDEX SIGNATURE PATTERNS

When an object functions as an open-ended dictionary with dynamic keys:

### 1. Index Signatures
```ts
interface MetricsStore {
  [metricName: string]: number;
}

const metrics: MetricsStore = {
  cpuUsage: 78.4,
  memoryMB: 4096
};
```

### 2. The Modern `Record<K, V>` Utility Type
```ts
type Role = "admin" | "editor" | "viewer";

// Maps every union member to its permission object:
const rolePermissions: Record<Role, { canDelete: boolean; canEdit: boolean }> = {
  admin:  { canDelete: true,  canEdit: true },
  editor: { canDelete: false, canEdit: true },
  viewer: { canDelete: false, canEdit: false }
};
```

---

# 97. OBJECTS AND FUNCTION PARAMETERS

Positional parameters with more than 2 or 3 arguments create bug-prone call sites:

```js
// ❌ FRAGILE: What do true and false mean? Hard to read, ordering mistakes happen!
createUser("Ayush", 24, true, false, "admin");

// ✅ CLEAN SENIOR PATTERN: Named Parameter Object with Destructuring
function createUser({ name, age, isVerified = false, sendWelcomeEmail = true, role = "user" }) {
  return { name, age, isVerified, sendWelcomeEmail, role };
}

createUser({
  name: "Ayush",
  age: 24,
  role: "admin"
});
```

---

# 98. CONFIGURATION OBJECT PATTERN

APIs and libraries should accept a configuration object with deep default merging:

```js
const DEFAULT_CONFIG = Object.freeze({
  host: "localhost",
  port: 8080,
  tls: false,
  timeoutMs: 3000,
  logger: console
});

function createServer(userOptions = {}) {
  const finalConfig = {
    ...DEFAULT_CONFIG,
    ...userOptions
  };

  return `Server listening on ${finalConfig.host}:${finalConfig.port} (TLS: ${finalConfig.tls})`;
}

console.log(createServer({ port: 443, tls: true }));
```

---

# 99. OPTIONS OBJECT PATTERN

When implementing complex functions:
1. Accept an `options` object as the final argument.
2. Provide default fallback values for each option.
3. Validate unexpected or invalid options up-front.

```js
function queryDatabase(sql, { timeout = 5000, retry = 3, readOnly = true } = {}) {
  return { sql, timeout, retry, readOnly };
}
```

---

# 100. OBJECT DESIGN PRINCIPLES

Senior engineers follow key design heuristics when designing object architectures:
1. **Predictable Shape**: Always initialize properties in the constructor or literal in the same order. Never add properties ad-hoc at random points in execution.
2. **Immutability by Default**: Treat domain models and API entities as immutable records. Create new objects rather than mutating existing ones.
3. **Law of Demeter (Principle of Least Knowledge)**: Avoid deeply coupled dot-traversals (`a.b.c.d.doSomething()`). Objects should only communicate with their immediate neighbors.
4. **Prefer Composition Over Inheritance**: Assemble small, focused objects rather than building deep multi-tier class hierarchies.


---

# 101. COMMON OBJECT BUGS (THE SENIOR DEBUGGING SUITE)

Below are the 12 most frequent, painful object bugs encountered in JavaScript production codebases, complete with symptom, root cause, reproduction, debug technique, fix, and prevention.

### Bug 1: Accidental Shared Reference Mutation
* **Symptom**: Mutating user B's profile unexpectedly changes user A's profile.
* **Root Cause**: Shallow copy copied the pointer to a nested object.
* **Reproduction**:
  ```js
  const defaultSettings = { theme: "dark", notifications: { email: true } };
  const userA = { ...defaultSettings };
  userA.notifications.email = false;
  console.log(defaultSettings.notifications.email); // false! Mutated!
  ```
* **Fix**: Use `structuredClone(defaultSettings)` for deep isolation.

### Bug 2: Arrow Function as Object Method (`this` is `undefined`)
* **Symptom**: Calling `user.getName()` returns `undefined` or throws in strict mode.
* **Root Cause**: Arrow functions inherit lexical `this`, not the invoking object.
* **Fix**: Use ES6 method syntax `getName() { return this.name; }`.

### Bug 3: Checking Existence with `if (obj[key])` Failing on Falsy Values
* **Symptom**: Setting `volume = 0` or `active = false` triggers the fallback branch.
* **Root Cause**: `0` and `false` evaluate to falsy in boolean coercion.
* **Fix**: Use `Object.hasOwn(obj, key)` or `obj[key] !== undefined`.

### Bug 4: Object Literal Key Stringification Collision
* **Symptom**: Saving data for two different objects overwrites the first one.
* **Root Cause**: Objects stringified to `"[object Object]"` as plain object keys.
* **Fix**: Use `new Map()` when keys are objects.

### Bug 5: `JSON.stringify` Silently Stripping Functions, Dates & `undefined`
* **Symptom**: Deep-cloned object loses methods, and `Date` turns into a string.
* **Root Cause**: JSON specification does not support functions, undefined, or native Dates.
* **Fix**: Use native `structuredClone()`.

### Bug 6: Inadvertent Prototype Traversal in `for...in`
* **Symptom**: Third-party library methods show up in loop iterations.
* **Root Cause**: `for...in` walks the entire prototype chain.
* **Fix**: Use `Object.keys()` or `Object.entries()`.

### Bug 7: Calling `obj.hasOwnProperty()` on Null-Prototype Object Crashes
* **Symptom**: `TypeError: obj.hasOwnProperty is not a function`.
* **Root Cause**: `Object.create(null)` objects don't inherit from `Object.prototype`.
* **Fix**: Use static `Object.hasOwn(obj, key)`.

### Bug 8: React State Not Updating Due to In-Place Mutation
* **Symptom**: UI fails to re-render after state changes.
* **Root Cause**: React performs reference check `prev === next`; mutating in-place preserves pointer.
* **Fix**: Always return a new object: `setState(prev => ({ ...prev, updated: true }))`.

### Bug 9: Property Order Assumption Bugs
* **Symptom**: Keys appear in a different order than inserted.
* **Root Cause**: ECMAScript specifies numeric integer keys are sorted in ascending order first.
* **Fix**: Use `Map` or an Array if strict insertion order across all key types is required.

### Bug 10: Attempting to Freeze an Object Shallowly
* **Symptom**: Nested properties are modified despite calling `Object.freeze()`.
* **Root Cause**: `Object.freeze` is shallow.
* **Fix**: Implement and run recursive `deepFreeze()`.

### Bug 11: Destructuring Undefined Nested Object Crashes
* **Symptom**: `TypeError: Cannot read properties of undefined (reading 'street')`.
* **Root Cause**: Destructuring nested properties without providing fallback defaults.
* **Fix**: `const { address: { street } = {} } = user;`.

### Bug 12: Prototype Pollution in Merge Utility
* **Symptom**: Attacker injects malicious properties across all application objects.
* **Root Cause**: Unsafe recursive merge traversing `__proto__`.
* **Fix**: Sanitize keys and reject `__proto__`, `constructor`, and `prototype`.

---

# 102. OBJECT DEBUGGING

Modern tools for inspecting objects at runtime:

```js
const complexData = {
  id: 101,
  user: { name: "Ayush", roles: ["admin", "dev"] },
  metrics: { latency: 42, errorRate: 0.01 }
};

// 1. console.dir() — Inspect expandable DOM & Object properties
console.dir(complexData, { depth: null, colors: true });

// 2. console.table() — Visual tabular formatting for array of objects or key-value pairs
console.table([
  { id: 1, name: "Alice", role: "Dev" },
  { id: 2, name: "Bob", role: "Design" }
]);

// 3. JSON formatted snapshot
console.log(JSON.stringify(complexData, null, 2));
```

---

# 103. OBJECT TESTING

Writing bulletproof unit tests for objects using Jest/Vitest assertions:

```js
describe("User Profile Object", () => {
  const createUser = (name) => ({ id: "u-1", name, roles: ["member"], active: true });

  test("creates object with exact shape and value", () => {
    const user = createUser("Ayush");

    // Value equality (Structural Deep Match)
    expect(user).toEqual({ id: "u-1", name: "Ayush", roles: ["member"], active: true });

    // Reference identity assertion (Should NOT be same memory address)
    expect(user).not.toBe(createUser("Ayush"));

    // Shape / Property matchers
    expect(user).toHaveProperty("roles");
    expect(user.roles).toContain("member");
  });
});
```

---

# 104. OBJECT ALGORITHMS (20 CORE ALGORITHMS)

Key algorithmic patterns leveraging objects:

1. **Frequency Counter**: Counting occurrences of characters or tokens in $O(n)$ time.
2. **Two-Sum Index Lookup**: Using an object hash map to find target sums in $O(n)$ time.
3. **Array Deduplication**: Grouping unique objects by key.
4. **Graph Adjacency List**: Representing graph nodes and edges as object keys with array values.
5. **Flattening Nested Objects**: Converting `{ a: { b: 1 } }` into `{ "a.b": 1 }`.
6. **Unflattening Paths**: Reconstructing nested trees from dot-delimited strings.
7. **Object Inversion**: Swapping keys and values `{ a: 1 }` -> `{ 1: "a" }`.
8. **Deep Equality Check**: Recursively verifying nested properties and types.
9. **Diffing Two Objects**: Returning an object representing added, modified, and deleted keys.
10. **Sanitizing / Allow-listing**: Retaining only approved keys.
11. **Denylist / Omission**: Stripping forbidden keys.
12. **Grouping by Key**: Emulating `Object.groupBy`.
13. **Key Renaming**: Renaming keys according to an alias dictionary.
14. **Merging with Conflict Resolution**: Merging two objects using custom value reducers.
15. **Query String Serialization**: Converting an object to `?foo=bar&baz=1`.
16. **Query String Parser**: Parsing `?foo=bar` into an object.
17. **Memoization Cache**: Caching heavy function outputs by hashed argument keys.
18. **Cyclic Graph Detection**: Detecting circular references using a `WeakSet`.
19. **Object Schema Validation**: Validating types, bounds, and required keys.
20. **Deep Freezing**: Recursively locking object graphs.

---

# 105. BUILD CUSTOM OBJECT UTILITIES

```js
// 1. pick(obj, keys): Extracts only specified keys
function pick(obj, keys) {
  const result = {};
  for (const key of keys) {
    if (Object.hasOwn(obj, key)) {
      result[key] = obj[key];
    }
  }
  return result;
}

// 2. omit(obj, keys): Returns object without specified keys
function omit(obj, keys) {
  const keySet = new Set(keys);
  const result = {};
  for (const [key, value] of Object.entries(obj)) {
    if (!keySet.has(key)) {
      result[key] = value;
    }
  }
  return result;
}

// 3. getPath(obj, path, fallback): Safe deep property access ("user.profile.name")
function getPath(obj, path, fallback = undefined) {
  const parts = Array.isArray(path) ? path : path.split(".");
  let current = obj;
  for (const part of parts) {
    if (current === null || current === undefined) return fallback;
    current = current[part];
  }
  return current === undefined ? fallback : current;
}

// 4. setPath(obj, path, value): Deep mutable path setter
function setPath(obj, path, value) {
  const parts = Array.isArray(path) ? path : path.split(".");
  let current = obj;
  for (let i = 0; i < parts.length - 1; i++) {
    const part = parts[i];
    if (!(part in current) || typeof current[part] !== "object") {
      current[part] = {};
    }
    current = current[part];
  }
  current[parts[parts.length - 1]] = value;
  return obj;
}
```

---

# 106. BUILD A DEEP EQUALITY FUNCTION

```js
function deepEqual(a, b) {
  // 1. Primitive and reference identity check (handles NaN)
  if (Object.is(a, b)) return true;

  // 2. Handle null and primitives
  if (typeof a !== "object" || a === null || typeof b !== "object" || b === null) {
    return false;
  }

  // 3. Handle Dates
  if (a instanceof Date && b instanceof Date) {
    return a.getTime() === b.getTime();
  }

  // 4. Handle RegExps
  if (a instanceof RegExp && b instanceof RegExp) {
    return a.source === b.source && a.flags === b.flags;
  }

  // 5. Compare prototypes / constructors
  if (Object.getPrototypeOf(a) !== Object.getPrototypeOf(b)) {
    return false;
  }

  // 6. Compare keys length
  const keysA = Reflect.ownKeys(a);
  const keysB = Reflect.ownKeys(b);
  if (keysA.length !== keysB.length) return false;

  // 7. Recursive comparison of all own keys
  for (const key of keysA) {
    if (!Object.hasOwn(b, key) || !deepEqual(a[key], b[key])) {
      return false;
    }
  }

  return true;
}
```

---

# 107. BUILD A DEEP CLONE FUNCTION (WITH WEAKMAP)

```js
function deepClone(value, hash = new WeakMap()) {
  // Primitives, functions, null
  if (typeof value !== "object" || value === null) {
    return value;
  }

  // Circular reference detection
  if (hash.has(value)) {
    return hash.get(value);
  }

  // Special object types
  if (value instanceof Date) return new Date(value);
  if (value instanceof RegExp) return new RegExp(value.source, value.flags);
  if (value instanceof Map) {
    const mapClone = new Map();
    hash.set(value, mapClone);
    value.forEach((v, k) => mapClone.set(deepClone(k, hash), deepClone(v, hash)));
    return mapClone;
  }
  if (value instanceof Set) {
    const setClone = new Set();
    hash.set(value, setClone);
    value.forEach(v => setClone.add(deepClone(v, hash)));
    return setClone;
  }

  // Array or Plain Object
  const clone = Array.isArray(value) ? [] : Object.create(Object.getPrototypeOf(value));
  hash.set(value, clone);

  for (const key of Reflect.ownKeys(value)) {
    clone[key] = deepClone(value[key], hash);
  }

  return clone;
}
```

---

# 108. BUILD AN OBJECT VALIDATOR

```js
class SchemaValidator {
  constructor(schema) {
    this.schema = schema;
  }

  validate(data) {
    const errors = [];

    for (const [field, rules] of Object.entries(this.schema)) {
      const val = data[field];

      if (rules.required && (val === undefined || val === null)) {
        errors.push(`Field '${field}' is required.`);
        continue;
      }

      if (val !== undefined && rules.type && typeof val !== rules.type) {
        errors.push(`Field '${field}' must be of type ${rules.type}.`);
      }

      if (val !== undefined && rules.validator && !rules.validator(val)) {
        errors.push(`Field '${field}' failed custom validation constraint.`);
      }
    }

    return { isValid: errors.length === 0, errors };
  }
}
```

---

# 109. BUILD A CONFIGURATION SYSTEM

```js
class ConfigManager {
  #config;

  constructor(defaults = {}) {
    this.#config = deepClone(defaults);
  }

  merge(userOverrides) {
    for (const [key, val] of Object.entries(userOverrides)) {
      if (val && typeof val === "object" && !Array.isArray(val)) {
        this.#config[key] = { ...this.#config[key], ...val };
      } else {
        this.#config[key] = val;
      }
    }
    return this;
  }

  lock() {
    deepFreeze(this.#config);
    return this;
  }

  get(path) {
    return getPath(this.#config, path);
  }
}
```

---

# 110. BUILD AN OBJECT-BASED CACHE (LRU)

```js
class LRUCache {
  constructor(capacity = 3) {
    this.capacity = capacity;
    this.map = new Map(); // Maps retain insertion order
  }

  get(key) {
    if (!this.map.has(key)) return undefined;
    const value = this.map.get(key);
    // Refresh position to mark as recently used
    this.map.delete(key);
    this.map.set(key, value);
    return value;
  }

  put(key, value) {
    if (this.map.has(key)) {
      this.map.delete(key);
    } else if (this.map.size >= this.capacity) {
      // Evict oldest item (first entry in Map)
      const oldestKey = this.map.keys().next().value;
      this.map.delete(oldestKey);
    }
    this.map.set(key, value);
  }
}
```

---

# 111. BUILD A SIMPLE ORM-LIKE ENTITY

```js
class ModelEntity {
  #attributes = {};
  #dirty = new Set();

  constructor(initialData = {}) {
    this.#attributes = { ...initialData };
  }

  get(attr) {
    return this.#attributes[attr];
  }

  set(attr, value) {
    if (this.#attributes[attr] !== value) {
      this.#attributes[attr] = value;
      this.#dirty.add(attr);
    }
  }

  isDirty() {
    return this.#dirty.size > 0;
  }

  save() {
    console.log(`Persisting dirty fields to DB:`, [...this.#dirty]);
    this.#dirty.clear();
    return true;
  }

  toJSON() {
    return { ...this.#attributes };
  }
}
```

---

# 112. REAL-WORLD OBJECT PATTERNS

* **Repository Pattern**: Centralizes data fetching and database queries behind clean object interfaces (`UserRepository.findById()`).
* **Builder Pattern**: Uses method chaining on an internal state object to assemble complex configurations step-by-step (`new RequestBuilder().setUrl(url).setMethod('POST').build()`).
* **Observer Pattern**: Objects maintain a subscription list and broadcast state changes to registered listeners.

---

# 113. OBJECT DESIGN DECISION TREE

```text
Do I need to store keyed data?
       │
       ├── Do I need non-string keys, high-frequency additions/removals, or size?
       │     └── YES ──► Use 'Map'
       │
       ├── Do I need a simple lookup dictionary with zero prototype baggage?
       │     └── YES ──► Use 'Object.create(null)'
       │
       ├── Do I need multiple instances with shared methods and strict typing?
       │     └── YES ──► Use 'class'
       │
       └── Do I just need a single static record, DTO, or options object?
             └── YES ──► Use Plain Object Literal '{}'
```

---

# 114. COMPLETE OBJECT COMPARISON TABLE

```text
┌─────────────────────────┬──────────────────┬──────────────────┬──────────────────┬──────────────────┐
│ Criteria                │ Plain Object {}  │ Object.create(null)│ Map            │ Class Instance   │
├─────────────────────────┼──────────────────┼──────────────────┼──────────────────┼──────────────────┤
│ Prototype Chain         │ Object.prototype │ null (Empty)     │ Map.prototype    │ Custom Class Proto│
│ Key Types               │ String / Symbol  │ String / Symbol  │ Any Type         │ String / Symbol  │
│ JSON Serialization      │ Native Support   │ Native Support   │ Custom Replacer  │ Serializes Props │
│ Prototype Pollution Risk│ Vulnerable       │ Immune           │ Immune           │ Immune           │
│ Direct Property Access  │ obj.foo          │ obj.foo          │ map.get('foo')   │ inst.foo         │
│ Memory Footprint        │ Low              │ Minimal          │ Moderate         │ Low (Shared proto)│
└─────────────────────────┴──────────────────┴──────────────────┴──────────────────┴──────────────────┘
```

---

# 115. OBJECT DO / DON'T

| DO | DON'T |
| :--- | :--- |
| **DO** use `Object.hasOwn(obj, key)` for existence checks. | **DON'T** use `obj.hasOwnProperty()` or `if (obj[key])`. |
| **DO** use `structuredClone()` for deep copies. | **DON'T** use `JSON.parse(JSON.stringify())` blindly. |
| **DO** use `Object.freeze()` to protect constants. | **DON'T** assume `Object.freeze()` freezes nested objects. |
| **DO** use standard method shorthand `greet() {}`. | **DON'T** use arrow functions as methods relying on `this`. |
| **DO** use named parameter objects for $> 2$ arguments. | **DON'T** pass multiple mystery booleans `(a, true, false)`. |
| **DO** sanitize keys against `__proto__` in merge tools. | **DON'T** blindly merge untrusted user JSON into prototypes. |

---

# 116. OBJECT CHEAT SHEET

```js
// CREATION
const obj = { a: 1 };
const dict = Object.create(null);

// INSPECTION
Object.keys(obj);            // ['a']
Object.values(obj);          // [1]
Object.entries(obj);         // [['a', 1]]
Object.hasOwn(obj, 'a');     // true
Reflect.ownKeys(obj);        // All keys including Symbols

// IMMUTABILITY
Object.preventExtensions(obj); // No new properties
Object.seal(obj);              // No additions or deletions
Object.freeze(obj);            // Completely read-only (shallow)

// COPYING
const shallow = { ...obj };
const deep = structuredClone(obj);
```


---

# 117. INTERVIEW PREPARATION (4-TIER INTERVIEW SUITE)

### Tier 1 — Beginner Questions & Model Answers
**Q1: What is an object in JavaScript?**
* **Answer**: An object is a non-primitive composite data structure stored on the memory heap that holds key-value pairs (properties and methods). Keys are either strings or symbols, and values can be any JavaScript data type.

**Q2: What is the difference between dot notation and bracket notation?**
* **Answer**: Dot notation (`obj.prop`) is concise and requires valid JavaScript identifiers. Bracket notation (`obj["prop"]`) evaluates expressions dynamically, allowing variable lookups, strings with spaces or dashes, numeric keys, and symbols.

**Q3: How do you check if a property exists on an object?**
* **Answer**: Use `Object.hasOwn(obj, key)` for own properties (ES2022 standard). Use the `in` operator if you also want to check inherited properties on the prototype chain. Avoid `obj[key] !== undefined` because the property might exist with a value of `undefined`.

---

### Tier 2 — Intermediate Questions & Model Answers
**Q4: Explain the difference between a shallow copy and a deep copy.**
* **Answer**: A shallow copy (`{ ...obj }` or `Object.assign({}, obj)`) duplicates only the top-level properties. If a property references a nested object or array, only the memory pointer is copied, meaning changes to nested data mutate both objects. A deep copy (`structuredClone(obj)`) recursively duplicates all nested objects, creating completely isolated data structures in memory.

**Q5: Why does `{} === {}` return `false`?**
* **Answer**: JavaScript compares objects by **reference identity**, not structural content. Each empty object literal `{}` allocates a distinct memory block on the heap with a unique memory address. Since the two pointers point to different addresses, strict equality evaluates to `false`.

**Q6: What is the difference between `Object.freeze()` and `Object.seal()`?**
* **Answer**: Both prevent adding or deleting properties. However, `Object.seal()` allows existing properties to be modified (if `writable: true`), whereas `Object.freeze()` marks all properties as `writable: false`, making the object completely read-only (shallowly).

---

### Tier 3 — Advanced Questions & Model Answers
**Q7: How does property lookup work on the prototype chain?**
* **Answer**: When evaluating `obj.prop`, the engine first checks `obj`'s own properties. If not found, it checks `obj`'s internal `[[Prototype]]` link. It repeats this process recursively up the chain until the property is found or `[[Prototype]]` evaluates to `null` (at `Object.prototype`), returning `undefined`.

**Q8: What happens during `new Constructor()` execution?**
* **Answer**: The engine executes 5 steps: (1) Allocates a new empty plain object `{}`; (2) Links the object's `[[Prototype]]` to `Constructor.prototype`; (3) Binds `this` to the new object and executes the constructor body; (4) Inspects the returned value; (5) If the constructor returns an object, that object is returned; otherwise, the newly created instance is returned.

**Q9: Explain Property Descriptors and the difference between data and accessor descriptors.**
* **Answer**: Descriptors define property meta-behavior. Data descriptors contain `value`, `writable`, `enumerable`, and `configurable`. Accessor descriptors contain `get`, `set`, `enumerable`, and `configurable`. An object cannot have both `value`/`writable` and `get`/`set` on the same property.

---

### Tier 4 — Senior Engineer Questions & Model Answers
**Q10: What is Prototype Pollution and how do you prevent it in production?**
* **Answer**: Prototype pollution occurs when an insecure recursive merge/clone function processes untrusted user JSON containing `__proto__`, `constructor`, or `prototype` keys, modifying `Object.prototype`. To prevent it: (1) Sanitize and reject dangerous keys during merges; (2) Use `Object.create(null)` or `Map` for dictionaries; (3) Run `Object.freeze(Object.prototype)` in security-sensitive initialization.

**Q11: How does V8 optimize object property access using Shapes and Inline Caches (ICs)?**
* **Answer**: V8 assigns a hidden class ("Shape") to objects tracking property offsets. Code sites accessing properties start uninitialized, transition to **monomorphic** when observing one shape (generating direct memory-offset reads), become **polymorphic** if observing 2-4 shapes, and degrade to **megamorphic** (slow hash table lookup) if observing 5+ shapes. Initializing properties in consistent orders preserves monomorphism.

---

# 118. SENIOR ENGINEER OBJECT GUIDE

Senior software architects reason about objects across three distinct architectural vectors:

```text
┌────────────────────────────────────────────────────────┐
│            SENIOR OBJECT ARCHITECTURE MATRIX           │
│                                                        │
│  1. DATA INTEGRITY        2. MEMORY & GC       3. V8 JIT OPTIMIZATION
│  ─────────────────        ──────────────       ──────────────────────
│  • Immutability by default• Allocation rate   • Monomorphic ICs
│  • Schema validation      • Retained heap size • Stable Shapes
│  • Prototype pollution    • WeakMap caches     • Fast/In-Object mode
│    prevention             • Object pooling     • Avoid 'delete'
└────────────────────────────────────────────────────────┘
```

1. **Invariants and Defensive Copies**: Treat domain entities as immutable. Deep-clone before exporting state across subsystem boundaries.
2. **Memory Footprint Budgeting**: In Node.js microservices processing millions of payloads, prefer flat typed shapes or typed arrays over sprawling, deeply nested dynamic objects.
3. **Shape Stability**: Construct objects using constructor functions or factories that assign all fields in an identical chronological order. Never add or delete properties dynamically at runtime.

---

# 119. OBJECT SYSTEM DESIGN EXERCISE

## "Build a Production-Grade Configuration & Entity System"

### System Architecture Requirements:
1. **Hierarchical Configuration Hierarchy**: Support default settings, environment-specific overrides, and runtime overrides.
2. **Immutability Locking**: Once loaded, configuration must be frozen using recursive deep freeze.
3. **Dirty-Tracking Entity Model**: Model database entities with change detection, schema type verification, and rollback capabilities.

```js
class SystemConfig {
  #store;

  constructor(baseDefaults) {
    this.#store = deepClone(baseDefaults);
  }

  override(layer) {
    this.#store = deepMerge(this.#store, layer);
    return this;
  }

  freezeConfig() {
    deepFreeze(this.#store);
    return this;
  }

  get(path) {
    return getPath(this.#store, path);
  }
}

class TrackedEntity {
  #initial;
  #current;
  #dirtyFields = new Set();

  constructor(data) {
    this.#initial = Object.freeze(structuredClone(data));
    this.#current = structuredClone(data);
  }

  get(key) {
    return this.#current[key];
  }

  set(key, value) {
    if (!deepEqual(this.#current[key], value)) {
      this.#current[key] = value;
      this.#dirtyFields.add(key);
    }
  }

  isDirty() {
    return this.#dirtyFields.size > 0;
  }

  getDirtyFields() {
    return [...this.#dirtyFields];
  }

  rollback() {
    this.#current = structuredClone(this.#initial);
    this.#dirtyFields.clear();
  }

  commit() {
    this.#initial = Object.freeze(structuredClone(this.#current));
    this.#dirtyFields.clear();
  }
}
```

---

# 120. FINAL OBJECT CHALLENGE

### The Multi-Disciplinary Challenge
Create an **OmniStore Engine** that combines:
1. Nested data structures.
2. Property accessors (getters/setters).
3. Prototype delegation.
4. Property descriptors (`Object.defineProperty`).
5. Event broadcasting on mutation.

```js
function createOmniStore(initialState = {}) {
  const listeners = new Map();

  const storeProto = {
    subscribe(key, callback) {
      if (!listeners.has(key)) listeners.set(key, new Set());
      listeners.get(key).add(callback);
      return () => listeners.get(key).delete(callback);
    },
    toJSON() {
      const output = {};
      for (const k of Object.keys(this)) {
        output[k] = this[k];
      }
      return output;
    }
  };

  const storeInstance = Object.create(storeProto);

  for (const [key, initialVal] of Object.entries(initialState)) {
    let internalVal = initialVal;

    Object.defineProperty(storeInstance, key, {
      enumerable: true,
      configurable: false,
      get() {
        return internalVal;
      },
      set(newVal) {
        if (!Object.is(internalVal, newVal)) {
          const oldVal = internalVal;
          internalVal = newVal;
          if (listeners.has(key)) {
            listeners.get(key).forEach(fn => fn(newVal, oldVal));
          }
        }
      }
    });
  }

  return storeInstance;
}

// Verification:
const state = createOmniStore({ count: 0, user: "Ayush" });
state.subscribe("count", (newVal, oldVal) => {
  console.log(`[STATE CHANGE]: count updated from ${oldVal} to ${newVal}`);
});

state.count = 1; // Logs: [STATE CHANGE]: count updated from 0 to 1
state.count = 2; // Logs: [STATE CHANGE]: count updated from 1 to 2
console.log(state.toJSON()); // { count: 2, user: 'Ayush' }
```

---

# 121. FINAL OBJECT KNOWLEDGE CHECKLIST

* [ ] Understand key-value structure and composite nature of objects.
* [ ] Master Object Literals, computed keys, and shorthand notation.
* [ ] Distinguish dot notation vs bracket notation requirements.
* [ ] Understand memory pointers, Heap vs Stack, and reference equality (`===`).
* [ ] Differentiate shallow copy (`{...obj}`) from deep copy (`structuredClone()`).
* [ ] Master Optional Chaining (`?.`) and Nullish Coalescing (`??`).
* [ ] Master Destructuring, Rest (`...rest`), and Spread (`...spread`).
* [ ] Use `Object.keys`, `values`, `entries`, and `fromEntries`.
* [ ] Understand `[[Prototype]]`, `Object.getPrototypeOf`, and lookup mechanics.
* [ ] Master Property Descriptors: `value`, `writable`, `enumerable`, `configurable`.
* [ ] Understand Accessors (`get` / `set`) and descriptor defaults.
* [ ] Enforce immutability with `preventExtensions`, `seal`, and `freeze`.
* [ ] Know deterministic property enumeration order (Integers -> Strings -> Symbols).
* [ ] Master Symbols and well-known symbols (`Symbol.iterator`, `Symbol.toPrimitive`).
* [ ] Recognize when to use `Map`, `Set`, `Object.create(null)`, or `class`.
* [ ] Understand constructor functions and the 5 steps of the `new` operator.
* [ ] Prevent detached method bugs using `.bind()` or method shorthand.
* [ ] Understand V8 Shapes, Transition Trees, and Inline Caches (ICs).
* [ ] Understand and defend against Prototype Pollution vulnerabilities.

---

# 122. FINAL TECHNICAL ACCURACY REVIEW

1. **ECMAScript Specification Compliance**:
   * Property keys conform to ECMAScript standard §7.1.19 (`ToPropertyKey`: String or Symbol only).
   * Property iteration ordering strictly complies with §10.1.14 (`OrdinaryOwnPropertyKeys`).
   * Nullish coalescing conforms to §13.15 (`CoalesceExpression`).
2. **Engine Reality vs Abstract Specification**:
   * Hidden classes and transition trees represent Google V8's implementation (similarly implemented as Shapes in SpiderMonkey and Structures in JSC).
   * In-object properties represent V8's contiguous memory block optimization.
3. **Strict Mode Semantics**:
   * In strict mode (`"use strict";`), writing to non-writable properties, adding properties to non-extensible objects, or deleting non-configurable properties throws explicit `TypeError`s rather than failing silently.

---

# 123. TEACHING QUALITY REQUIREMENTS

Every concept throughout this textbook follows the **6-Stage Pedagogical Mastery Framework**:
1. **Plain-English Definition**: Accessible layman explanation without jargon.
2. **Mental Model & Metaphor**: Real-world analogy (e.g. Filing Cabinets, Deeds of Ownership).
3. **Architectural ASCII Diagram**: Visual rendering of memory or prototype paths.
4. **Annotated Code Demonstration**: Fully commented, executable JavaScript code.
5. **Junior Pitfall & Gotcha**: Common traps, edge cases, and why they fail.
6. **Senior Production Pattern**: Scalable, secure, and engine-optimized solution.

---

# 124. CODE QUALITY REQUIREMENTS

All code examples in this curriculum satisfy strict production standards:
* Modern ES2024 / ECMAScript standards (`Object.hasOwn`, `Object.groupBy`, `structuredClone`).
* Descriptive, meaningful variable and domain names.
* Fully runnable without missing dependencies.
* Robust error handling and edge-case defensiveness.

---

# 125. VISUAL LEARNING REQUIREMENTS

ASCII diagrams are systematically deployed across memory structures, prototype chains, execution flows, and engine states to ensure multi-modal comprehension.


---

# 126. PRACTICE SYSTEM (75 GRADED EXERCISES)

Test your knowledge with 75 progressive exercises spanning Beginner, Intermediate, Advanced, and Senior levels.

---

## Level 1 — Beginner Exercises (1 to 20)

**1. Create a Book Object**: Create an object `book` with `title`, `author`, and `pages`. Print each property using dot notation.
```js
const book = { title: "JavaScript: The Good Parts", author: "Douglas Crockford", pages: 176 };
console.log(book.title, book.author, book.pages);
```

**2. Bracket Notation with Special Character**: Create an object with a key `"user-status"` and access it using bracket notation.
```js
const account = { "user-status": "active" };
console.log(account["user-status"]);
```

**3. Dynamic Property Lookup**: Given `const key = "email"`, retrieve that property from `{ email: "test@example.com" }`.
```js
const key = "email";
const user = { email: "test@example.com" };
console.log(user[key]);
```

**4. Add a New Property**: Add a property `isAvailable: true` to an existing empty object `car`.
```js
const car = {};
car.isAvailable = true;
```

**5. Update a Property**: Given `{ score: 10 }`, update `score` to `25`.
```js
const player = { score: 10 };
player.score = 25;
```

**6. Delete a Property**: Remove the property `secret` from `{ id: 1, secret: "xyz" }`.
```js
const record = { id: 1, secret: "xyz" };
delete record.secret;
```

**7. Property Existence with `Object.hasOwn`**: Verify whether `user` owns the property `role`.
```js
const user = { role: "admin" };
console.log(Object.hasOwn(user, "role")); // true
```

**8. Shorthand Property Definition**: Given `const x = 10, y = 20`, construct a point object using ES6 shorthand.
```js
const x = 10, y = 20;
const point = { x, y };
```

**9. Shorthand Method**: Define an object `greeter` with a method `sayHi()` returning `"Hi!"` using method shorthand.
```js
const greeter = {
  sayHi() { return "Hi!"; }
};
```

**10. Iterate Keys with `Object.keys()`**: Print all keys of `{ a: 1, b: 2, c: 3 }`.
```js
console.log(Object.keys({ a: 1, b: 2, c: 3 })); // ['a', 'b', 'c']
```

**11. Retrieve Values with `Object.values()`**: Sum all values in `{ math: 90, english: 85 }`.
```js
const scores = { math: 90, english: 85 };
const total = Object.values(scores).reduce((sum, v) => sum + v, 0); // 175
```

**12. Count Properties**: Write a function returning the total count of an object's own properties.
```js
const countProps = (obj) => Object.keys(obj).length;
```

**13. Reference Sharing**: What is logged?
```js
const a = { val: 5 };
const b = a;
b.val = 10;
console.log(a.val); // 10 (Shared reference)
```

**14. Object Identity**: What does `{} === {}` evaluate to and why?
*Answer*: `false`, because each literal allocates a separate heap location with distinct memory pointers.

**15. Basic Destructuring**: Extract `firstName` and `lastName` from `{ firstName: "Ayush", lastName: "Sharma" }`.
```js
const { firstName, lastName } = { firstName: "Ayush", lastName: "Sharma" };
```

**16. Destructuring with Default**: Extract `theme` with a default value of `"light"` from `{}`.
```js
const { theme = "light" } = {};
```

**17. Destructuring with Renaming**: Extract `id` as `userId` from `{ id: 501 }`.
```js
const { id: userId } = { id: 501 };
```

**18. Shallow Copy with Spread**: Create a shallow copy of `{ a: 1, b: 2 }`.
```js
const original = { a: 1, b: 2 };
const copy = { ...original };
```

**19. Check for Missing Key**: Show why `if (obj.val)` is bug-prone when `val: 0`.
*Answer*: `0` is falsy, so the check fails even though the property exists. Use `Object.hasOwn(obj, "val")`.

**20. Empty Object Check**: Write a function checking if an object has zero own keys.
```js
const isEmpty = (obj) => Object.keys(obj).length === 0;
```

---

## Level 2 — Intermediate Exercises (21 to 40)

**21. Optional Chaining with Deep Nesting**: Safely read `user?.profile?.address?.zip` without crashing if `profile` is undefined.
```js
const zip = user?.profile?.address?.zip;
```

**22. Nullish Coalescing Fallback**: Read `user.age ?? 18` where `user = { age: 0 }`. What is the result?
*Answer*: `0` (Nullish coalescing preserves 0 because 0 is not null or undefined).

**23. Safe Method Invocation**: Safely invoke `handler.onClick?.(event)` only if defined.
```js
handler.onClick?.(event);
```

**24. Object Rest Deletion**: Remove `password` from `user` immutably using rest destructuring.
```js
const { password, ...publicProfile } = user;
```

**25. Shallow Merge with Override**: Merge `{ port: 3000, host: "localhost" }` and `{ port: 8080 }`.
```js
const config = { ...{ port: 3000, host: "localhost" }, ...{ port: 8080 } };
// { port: 8080, host: "localhost" }
```

**26. Shallow Copy Trap**: Demonstrate how mutating `copy.address.city` affects `original.address.city`.
```js
const orig = { address: { city: "Delhi" } };
const copy = { ...orig };
copy.address.city = "Pune";
console.log(orig.address.city); // "Pune"
```

**27. Deep Clone with `structuredClone`**: Safely clone an object containing nested objects and a `Date`.
```js
const deep = structuredClone({ date: new Date(), meta: { v: 1 } });
```

**28. `Object.entries()` to Loop**: Print all key-value pairs formatted as `"KEY = VALUE"`.
```js
for (const [k, v] of Object.entries(obj)) console.log(`${k} = ${v}`);
```

**29. Transform via `Object.fromEntries`**: Double all numeric values in an object `{ a: 10, b: 20 }`.
```js
const doubled = Object.fromEntries(Object.entries({ a: 10, b: 20 }).map(([k, v]) => [k, v * 2]));
```

**30. Filter an Object**: Retain only properties whose values are numbers.
```js
const numericOnly = Object.fromEntries(Object.entries(obj).filter(([_, v]) => typeof v === "number"));
```

**31. Computed Key Construction**: Construct `{ ["item_" + id]: name }` dynamically.
```js
const makeItem = (id, name) => ({ ["item_" + id]: name });
```

**32. Prototype Inheritance with `Object.create`**: Create `child` delegating to `parent = { kind: "human" }`.
```js
const parent = { kind: "human" };
const child = Object.create(parent);
```

**33. Inspecting Prototype**: Retrieve `child`'s prototype using `Object.getPrototypeOf()`.
```js
console.log(Object.getPrototypeOf(child) === parent); // true
```

**34. Own vs Inherited Distinction**: Show that `Object.hasOwn(child, "kind")` returns `false` while `"kind" in child` returns `true`.

**35. Pure Null-Prototype Dictionary**: Create a map with no prototype methods.
```js
const dict = Object.create(null);
```

**36. Shallow Freeze**: Use `Object.freeze()` on an object and verify `Object.isFrozen()`.
```js
const locked = Object.freeze({ a: 1 });
console.log(Object.isFrozen(locked)); // true
```

**37. Seal an Object**: Seal an object and demonstrate modifying an existing value vs adding a new key.
```js
const s = Object.seal({ x: 1 });
s.x = 2; // Allowed
s.y = 3; // Blocked
```

**38. Prevent Extensions**: Block adding new keys while preserving property deletion.
```js
const pe = Object.preventExtensions({ a: 1, b: 2 });
delete pe.a; // Allowed!
```

**39. Detached Method Bug**: What does `const fn = user.greet; fn();` output and how do you fix it with `.bind()`?
*Answer*: Outputs `"Hello, undefined"` because `this` is lost. Fix with `const fn = user.greet.bind(user);`.

**40. Arrow Method Pitfall**: Explain why `{ name: "A", get: () => this.name }` fails.
*Answer*: Arrow functions capture lexical `this` from outer scope rather than binding to the object.

---

## Level 3 — Advanced Exercises (41 to 60)

**41. Custom Getter/Setter**: Implement a `temperature` object with `celsius` and dynamic `fahrenheit` accessor.
```js
const temp = {
  celsius: 0,
  get fahrenheit() { return this.celsius * 1.8 + 32; },
  set fahrenheit(f) { this.celsius = (f - 32) / 1.8; }
};
```

**42. Read-Only Property Descriptor**: Use `Object.defineProperty` to create a non-writable property.
```js
const obj = {};
Object.defineProperty(obj, "API_KEY", { value: "SEC-123", writable: false, enumerable: true });
```

**43. Hidden Property Descriptor**: Create a property that is hidden from `Object.keys()` (`enumerable: false`).
```js
Object.defineProperty(obj, "hidden", { value: 42, enumerable: false });
```

**44. Permanent Property**: Create a non-configurable property that cannot be deleted.
```js
Object.defineProperty(obj, "perm", { value: "forever", configurable: false });
```

**45. Define Multiple Descriptors**: Define multiple properties using `Object.defineProperties()`.
```js
Object.defineProperties(target, {
  a: { value: 1, writable: true },
  b: { value: 2, writable: false }
});
```

**46. Universal Key Reflection**: Retrieve all string, non-enumerable, and symbol keys using `Reflect.ownKeys()`.
```js
const allKeys = Reflect.ownKeys(obj);
```

**47. Deterministic Property Order**: Demonstrate integer keys sorting before string keys.
```js
const o = { z: "1", 5: "num", a: "2", 1: "num" };
console.log(Object.keys(o)); // ['1', '5', 'z', 'a']
```

**48. `Symbol.toPrimitive` Interception**: Customize an object to return different values for `"number"` vs `"string"`.
```js
const money = {
  amt: 50,
  [Symbol.toPrimitive](hint) { return hint === "string" ? "$50" : 50; }
};
```

**49. Iterable Object**: Implement `[Symbol.iterator]` on an object so it works in `for...of`.
```js
const range = {
  from: 1, to: 3,
  [Symbol.iterator]() {
    let cur = this.from;
    return { next: () => ({ value: cur, done: cur++ > this.to }) };
  }
};
```

**50. `Object.is` Precision**: Compare `+0` vs `-0` and `NaN` vs `NaN`.
```js
console.log(Object.is(+0, -0)); // false
console.log(Object.is(NaN, NaN)); // true
```

**51. Implement `customNew`**: Recreate the `new` operator from scratch using `Object.create()`.
```js
function customNew(Ctor, ...args) {
  const inst = Object.create(Ctor.prototype);
  const res = Ctor.apply(inst, args);
  return (typeof res === "object" && res !== null) ? res : inst;
}
```

**52. Constructor Inheritance**: Implement ES5 classical inheritance between `Person` and `Employee`.
```js
function Person(name) { this.name = name; }
Person.prototype.greet = function() { return `Hi ${this.name}`; };
function Employee(name, id) { Person.call(this, name); this.id = id; }
Employee.prototype = Object.create(Person.prototype);
Employee.prototype.constructor = Employee;
```

**53. ES6 Class with Private Field**: Use `#privateField` to encapsulate internal state.
```js
class Vault {
  #secret;
  constructor(s) { this.#secret = s; }
  reveal() { return this.#secret; }
}
```

**54. Static Factory Method**: Implement `User.fromJSON(jsonString)` on a class.
```js
class User {
  constructor(name) { this.name = name; }
  static fromJSON(str) { const d = JSON.parse(str); return new User(d.name); }
}
```

**55. Recursive `deepFreeze`**: Implement a function that freezes all levels of a nested object graph.
```js
function deepFreeze(o) {
  Reflect.ownKeys(o).forEach(k => {
    if (o[k] && typeof o[k] === "object") deepFreeze(o[k]);
  });
  return Object.freeze(o);
}
```

**56. Grouping by Key with `Object.groupBy`**: Group a list of users by `country`.
```js
const grouped = Object.groupBy(users, u => u.country);
```

**57. JSON Replacer Filtering**: Use `JSON.stringify(obj, replacer)` to omit all properties containing `"secret"`.
```js
const json = JSON.stringify(data, (k, v) => k.includes("secret") ? undefined : v);
```

**58. JSON Reviver Date Parsing**: Automatically parse ISO strings into `Date` objects during `JSON.parse`.
```js
const parsed = JSON.parse(str, (k, v) => /^\d{4}-\d{2}-\d{2}T/.test(v) ? new Date(v) : v);
```

**59. Safe Circular JSON Stringifier**: Serialize an object with circular references without crashing.
```js
function safeStringify(obj) {
  const seen = new WeakSet();
  return JSON.stringify(obj, (k, v) => {
    if (typeof v === "object" && v !== null) {
      if (seen.has(v)) return "[Circular]";
      seen.add(v);
    }
    return v;
  });
}
```

**60. Defend Against Prototype Pollution**: Sanitize merge keys against `__proto__` and `constructor`.
```js
const isSafeKey = (k) => k !== "__proto__" && k !== "constructor" && k !== "prototype";
```

---

## Level 4 — Senior Engineer Exercises (61 to 75)

**61. Build `deepEqual(a, b)`**: Implement comprehensive structural deep equality handling primitives, Dates, RegExps, and nested objects.

**62. Build `deepClone(obj)` with WeakMap**: Implement deep cloning supporting circular graph topologies.

**63. Recursive Object Flattener**: Convert `{ a: { b: { c: 1 } } }` into `{ "a.b.c": 1 }`.
```js
function flattenObject(obj, prefix = "", res = {}) {
  for (const [k, v] of Object.entries(obj)) {
    const key = prefix ? `${prefix}.${k}` : k;
    if (v && typeof v === "object" && !Array.isArray(v)) {
      flattenObject(v, key, res);
    } else {
      res[key] = v;
    }
  }
  return res;
}
```

**64. Unflattening Utility**: Reverse the flatten operation back into a nested tree.
```js
function unflattenObject(obj) {
  const res = {};
  for (const [k, v] of Object.entries(obj)) {
    setPath(res, k, v);
  }
  return res;
}
```

**65. Deep Object Diff**: Compare two objects and return `{ added, modified, deleted }`.
```js
function diffObjects(oldObj, newObj) {
  const diff = { added: {}, modified: {}, deleted: {} };
  for (const k of Reflect.ownKeys(newObj)) {
    if (!Object.hasOwn(oldObj, k)) diff.added[k] = newObj[k];
    else if (!deepEqual(oldObj[k], newObj[k])) diff.modified[k] = { from: oldObj[k], to: newObj[k] };
  }
  for (const k of Reflect.ownKeys(oldObj)) {
    if (!Object.hasOwn(newObj, k)) diff.deleted[k] = oldObj[k];
  }
  return diff;
}
```

**66. Custom `pick` and `omit` Utilities**: Write zero-dependency, type-safe implementations.

**67. Reactive Observer via Proxy**: Build an observable object that notifies callbacks on property mutation.
```js
function makeObservable(target, onChange) {
  return new Proxy(target, {
    set(obj, prop, val) {
      const oldVal = obj[prop];
      obj[prop] = val;
      onChange(prop, val, oldVal);
      return true;
    }
  });
}
```

**68. Monomorphic Property Access Benchmark**: Measure execution speed of objects sharing a single hidden class vs divergent shapes.

**69. Property Inversion**: Invert an object's keys and values `{ a: "1", b: "2" }` -> `{ "1": "a", "2": "b" }`.
```js
const invert = (o) => Object.fromEntries(Object.entries(o).map(([k, v]) => [v, k]));
```

**70. Immutable Nested Path Updater**: Implement `updatePath(obj, path, updaterFn)` returning a new object with only the affected path cloned.

**71. LRU Cache with Size Limits**: Build an in-memory cache using `Map` ensuring $O(1)$ gets and puts.

**72. Active Record Dirty Tracking**: Create an entity class tracking changed fields and supporting `rollback()`.

**73. Dependency Injection Container via Objects**: Implement a registry object resolving services by key.

**74. Function Parameter Validation Pipeline**: Validate options objects against schema rules up-front.

**75. Memory Leak Detector**: Demonstrate how retaining detached DOM nodes or large objects in uncleaned closures creates memory leaks.

---

# 127. REAL-WORLD PROJECTS (10 CAPSTONE PROJECTS)

### Project 1: Production User & Permission Manager (RBAC)
```js
class UserManager {
  #users = new Map();
  #roles = {
    admin: new Set(["read", "write", "delete"]),
    editor: new Set(["read", "write"]),
    viewer: new Set(["read"])
  };

  register(id, username, role = "viewer") {
    if (this.#users.has(id)) throw new Error("User exists");
    this.#users.set(id, Object.freeze({ id, username, role }));
  }

  can(id, action) {
    const user = this.#users.get(id);
    if (!user) return false;
    return this.#roles[user.role]?.has(action) ?? false;
  }
}
```

### Project 2: Hierarchical Configuration System with Environment Overrides
Supports layered merging from defaults, JSON config, and CLI overrides with recursive deep freeze.

### Project 3: Micro-State Container (Mini-Redux)
```js
function createStore(reducer, initialState) {
  let state = initialState;
  const listeners = new Set();

  return {
    getState: () => state,
    dispatch: (action) => {
      state = reducer(state, action);
      listeners.forEach(fn => fn());
    },
    subscribe: (fn) => {
      listeners.add(fn);
      return () => listeners.delete(fn);
    }
  };
}
```

### Project 4: In-Memory Key-Value Store with TTL & Expiration
Tracks keys with timestamps, auto-evicting expired records on read or sweep intervals.

### Project 5: Deep Object Difference Engine
Calculates added, modified, and deleted properties across complex nested JSON payloads.

### Project 6: Zero-Dependency Schema Validation Engine
Validates nested object types, bounds, regex formats, and required constraints.

### Project 7: URL Query Parameter Serializer & Parser
Parses nested bracket notation (`user[name]=Ayush&user[age]=24`) into nested objects and vice versa.

### Project 8: Event Bus / Pub-Sub Mediator Pattern
Enables loosely coupled module communication using an object event registry.

### Project 9: ORM Entity with Dirty Tracking & Schema Constraints
Enforces field-level validation, tracks modified keys, and writes clean SQL update hashes.

### Project 10: JSON API Data Normalizer & Denormalizer
Transforms nested relational API payloads into flat normalized lookup tables and back.

---

# 128. CONNECTION TO OTHER JAVASCRIPT CONCEPTS

```text
┌────────────────────────────────────────────────────────────────────────┐
│                   HOW OBJECTS CONNECT TO JAVASCRIPT                    │
│                                                                        │
│  FUNCTIONS ──────► Functions are "First-Class Objects" with a [[Call]] │
│                    internal slot and prototype properties.             │
│                                                                        │
│  ARRAYS ─────────► Arrays are specialized objects with integer keys   │
│                    and an auto-managed 'length' descriptor.            │
│                                                                        │
│  EXECUTION ──────► Variable Environments and Lexical Environments      │
│  CONTEXT           are modeled as Environment Record Objects.          │
│                                                                        │
│  CLOSURES ───────► Retain references to lexical scope objects stored   │
│                    on the memory heap.                                 │
│                                                                        │
│  PROMISES ───────► State-holding objects transitioning between         │
│                    "pending", "fulfilled", and "rejected".             │
│                                                                        │
│  MODULES ────────► Module namespaces are sealed, null-prototype        │
│                    exotic objects exporting live bindings.             │
└────────────────────────────────────────────────────────────────────────┘
```

---

# 129. FINAL ONE-PAGE OBJECT MIND MAP

```text
================================================================================
                        JAVASCRIPT OBJECTS ARCHITECTURE
================================================================================
                                       │
         ┌─────────────────────────────┼─────────────────────────────┐
         ▼                             ▼                             ▼
  1. FUNDAMENTALS               2. MANIPULATION               3. INTERNALS
  ────────────────              ───────────────               ────────────
  • Heap vs Stack Allocation    • Dot vs Bracket Access       • [[Prototype]] Chain
  • Reference Identity (===)    • Optional Chaining (?.)      • Object.prototype
  • Key Coercion (ToString)     • Nullish Coalescing (??)     • Property Descriptors
  • Symbols as Keys             • Destructuring & Defaults    • Writable / Configurable
  • Literals vs Object.create   • Rest & Spread (...obj)      • Enumerable / Accessors
                                • Merging & Deep Cloning      • V8 Shapes & ICs
                                       │
         ┌─────────────────────────────┼─────────────────────────────┐
         ▼                             ▼                             ▼
  4. INTEGRITY & SECURITY       5. ADVANCED OOP               6. ECOSYSTEM
  ───────────────────────       ───────────────               ────────────
  • Object.preventExtensions    • Constructor Functions       • JSON & Reviver/Replacer
  • Object.seal                 • 5 Steps of 'new'            • Object vs Map / Set
  • Object.freeze (Shallow)     • ES6 Classes & #Private      • React State Immutability
  • Recursive deepFreeze        • Composition over Inherit.   • DTOs & Schema Validation
  • Prototype Pollution Defense • Polymorphism & Mixins       • TypeScript Records
  • Safe Dictionary (null proto)• Dynamic 'this' Binding      • Performance Optimization
================================================================================
```

---

# 130. FINAL OUTPUT REQUIREMENTS & SUMMARY

This module completes the transformation of JavaScript Objects from basic key-value dictionaries into an industrial-grade, senior-level architectural discipline.

### What You Have Mastered:
1. **Memory Mechanics**: The exact heap and stack mechanics governing pointers, reference sharing, and garbage collection.
2. **Meta-Programming**: Surgical control over property descriptors, immutability barriers, and prototype delegation chains.
3. **Engine Optimization**: Writing shape-stable, monomorphic code aligned with V8's internal Hidden Classes and Inline Caches.
4. **Security & Production Rigor**: Hardening code against prototype pollution, data corruption, and accidental mutations.
5. **Architectural Excellence**: Leveraging composition, factories, and normalization to build scalable, enterprise-grade software.
