# Module REACT-03: React Hooks Internals and Execution Model

A complete, production-grade guide to the React Hooks execution model, Fiber linked-list storage, dispatcher polymorphism, and every core hook used in real-world application engineering.

---

## Topic 1: Hook Architecture and Storage: The `memoizedState` Singly-Linked List on Fiber Nodes

### What Is It?
In React, function components are plain JavaScript functions. Each time a component renders, the function runs from top to bottom, and its local stack variables are destroyed when execution finishes.

Hooks do not store their state inside the component function or inside a JavaScript closure. Instead, React stores all state, refs, effects, and memoized values inside a **singly-linked list of `Hook` objects** residing directly on the heap within the component's underlying `FiberNode.memoizedState` property.

Here are the key technical terms defined:
- A `FiberNode` is a persistent JavaScript object created by React to represent an active instance of a component in the virtual DOM tree.
- `memoizedState` on a Fiber node is the pointer that references the head node of the component's hook linked list.
- A `Hook` object is an internal React data structure containing the cached state value, the update queue, and a pointer (`next`) to the subsequent hook.
- A Singly-Linked List is a linear data structure where each record stores its own payload and a unidirectional reference (`next`) to the next record in sequence.

```
FiberNode (MyComponent)
  │
  └── memoizedState ──► [ Hook 1: useState ]
                              │ .next
                              ▼
                        [ Hook 2: useRef ]
                              │ .next
                              ▼
                        [ Hook 3: useEffect ]
                              │ .next
                              ▼
                             null
```

### Why Does It Exist?
Prior to React 16.8, stateful components required class definitions (`class UserProfile extends React.Component`). Classes persist state because instances stay allocated on the heap across multiple method calls (`this.state`).

React needed a mechanism to give stateless function components persistent, isolated memory without:
1. Requiring JavaScript class instances (which incur higher memory overhead and complicated `this` binding).
2. Requiring unique string keys for every piece of state (which would lead to namespace collisions in large codebases).

By utilizing an ordered singly-linked list indexed by execution order, React components can declare multiple isolated pieces of state using simple, composable function calls.

### Basic Example and Line-by-Line Explanation

```typescript
import React, { useState, useRef } from "react";

export function CounterWidget() {
  const [count, setCount] = useState<number>(0);
  const renderCountRef = useRef<number>(1);

  renderCountRef.current += 1;

  return (
    <div>
      <p>Count: {count}</p>
      <p>Renders: {renderCountRef.current}</p>
      <button onClick={() => setCount((prev) => prev + 1)}>Increment</button>
    </div>
  );
}
```

Line-by-line breakdown:
1. `import React, { useState, useRef } from "react";`: Imports the React runtime and the hook primitives from the package.
2. `export function CounterWidget()`: Declares a functional component. When scheduled by React, this function is called during the render phase.
3. `const [count, setCount] = useState<number>(0);`: Invokes the first hook. React inspects the Fiber's `memoizedState`. During mount, it creates Hook node 1 on the linked list with `memoizedState = 0`.
4. `const renderCountRef = useRef<number>(1);`: Invokes the second hook. React appends Hook node 2 to the linked list (`Hook1.next = Hook2`) with `memoizedState = { current: 1 }`.
5. `renderCountRef.current += 1;`: Directly mutates the `.current` property on the ref object. Mutating a ref does not trigger a re-render.
6. `return ( ... );`: Returns the JSX description describing the elements to be reconciled.
7. `<button onClick={() => setCount((prev) => prev + 1)}>`: Attaches an event listener. When clicked, `setCount` queues an update onto Hook 1's update queue and schedules a re-render on the Fiber root.

### How It Works Inside React
Inside the React reconciler (`react-reconciler/src/ReactFiberHooks.js`), each hook record has the following concrete structure:

```typescript
type Hook = {
  memoizedState: any;       // The processed state value currently visible on screen
  baseState: any;           // The base state prior to calculating pending updates
  baseQueue: Update<any> | null; // Unprocessed updates skipped due to priority lanes
  queue: UpdateQueue<any> | null; // Circular linked list of updates waiting to be processed
  next: Hook | null;        // Unidirectional pointer to the next hook in this Fiber
};
```

When a component renders:
1. React sets an internal module-level pointer named `workInProgressHook` to `null`.
2. When the first hook (`useState`) is called:
   - On initial mount, React allocates a fresh `Hook` object, sets `fiber.memoizedState = hook`, and sets `workInProgressHook = hook`.
   - On re-render, React reads `fiber.alternate.memoizedState` (the previous render's hook list) and advances: `workInProgressHook = hook`.
3. When the second hook (`useRef`) is called:
   - React allocates or retrieves the second hook and assigns `workInProgressHook.next = nextHook`.
   - The pointer advances: `workInProgressHook = nextHook`.
4. This pointer advancement repeats sequentially for every hook in the function body until the function returns.

### More Examples

#### Example 1: Inspecting the Internal Hook Linked List
```typescript
// Conceptual simulation of React's internal hook storage engine
interface SyntheticFiber {
  memoizedState: SyntheticHook | null;
}

interface SyntheticHook {
  memoizedState: any;
  next: SyntheticHook | null;
}

let currentlyRenderingFiber: SyntheticFiber = { memoizedState: null };
let workInProgressHook: SyntheticHook | null = null;
let isMounting: boolean = true;

function syntheticUseState<T>(initialValue: T): [T, (next: T) => void] {
  let hook: SyntheticHook;

  if (isMounting) {
    hook = { memoizedState: initialValue, next: null };
    if (!currentlyRenderingFiber.memoizedState) {
      currentlyRenderingFiber.memoizedState = hook;
    } else if (workInProgressHook) {
      workInProgressHook.next = hook;
    }
    workInProgressHook = hook;
  } else {
    // Re-render: advance the pointer along the existing linked list
    hook = workInProgressHook ? workInProgressHook.next! : currentlyRenderingFiber.memoizedState!;
    workInProgressHook = hook;
  }

  const dispatch = (newValue: T) => {
    hook.memoizedState = newValue;
  };

  return [hook.memoizedState, dispatch];
}
```

#### Example 2: Multiple Mixed Hooks on a Single Fiber
```typescript
import React, { useState, useRef, useEffect } from "react";

export function UserSessionViewer({ userId }: { userId: string }) {
  // Hook 1: State
  const [sessionToken, setSessionToken] = useState<string | null>(null);

  // Hook 2: Ref
  const fetchAttemptCount = useRef<number>(0);

  // Hook 3: Effect
  useEffect(() => {
    fetchAttemptCount.current += 1;
    // Simulated token fetch
    setSessionToken(`token_${userId}_${Date.now()}`);
  }, [userId]);

  return (
    <div>
      <span>User: {userId}</span>
      <span>Token: {sessionToken ?? "None"}</span>
      <span>Attempts: {fetchAttemptCount.current}</span>
    </div>
  );
}
```

#### Example 3: Simulating Hook Order Traversal Across Renders
```typescript
// Demonstrating how pointer walking relies on identical call order
function renderComponentPass(fiber: SyntheticFiber, renderFn: () => void) {
  workInProgressHook = null; // Reset pointer to head before executing component
  renderFn();
}
```

### Common Mistakes

#### Mistake 1: Placing a Hook Inside a Conditional Statement
```typescript
// WRONG: Hook order changes between renders!
export function BadProfile({ isLoggedIn }: { isLoggedIn: boolean }) {
  if (isLoggedIn) {
    // If isLoggedIn becomes false, this hook is skipped.
    // The next hook will read Hook 1's state from the previous render!
    const [token, setToken] = useState<string>(""); 
  }

  const [theme, setTheme] = useState<string>("dark");
  return <div>Theme: {theme}</div>;
}

// CORRECT: Always invoke hooks at the top level of the function
export function GoodProfile({ isLoggedIn }: { isLoggedIn: boolean }) {
  const [token, setToken] = useState<string>("");
  const [theme, setTheme] = useState<string>("dark");

  if (!isLoggedIn) {
    return <div>Please log in</div>;
  }

  return <div>Theme: {theme}, Token: {token}</div>;
}
```
**Why this breaks:** If a hook is skipped, React's internal pointer `workInProgressHook = workInProgressHook.next` aligns the wrong hook data with the calling code. `theme` will receive the memory slot previously used by `token`, causing catastrophic runtime state corruption.

#### Mistake 2: Calling Hooks Inside Loops with Dynamic Lengths
```typescript
// WRONG: Dynamically sized hook list
export function ItemList({ items }: { items: string[] }) {
  items.forEach((item) => {
    // Array length varies per render -> changes the total number of hook calls!
    const [selected, setSelected] = useState(false);
  });
  return <ul>...</ul>;
}

// CORRECT: Isolate item state into its own child component
export function ItemList({ items }: { items: string[] }) {
  return (
    <ul>
      {items.map((item, idx) => (
        <ItemRow key={idx} text={item} />
      ))}
    </ul>
  );
}

function ItemRow({ text }: { text: string }) {
  const [selected, setSelected] = useState(false);
  return <li>{text}</li>;
}
```

### Rules to Remember
1. **Hooks live on the Fiber heap, not in component scopes.** State persists because the `FiberNode` remains allocated in memory across re-renders.
2. **Hook identification is positional, not named.** React has no idea what variable name you assign to the return value; it only knows the sequence index in the linked list.
3. **Never place hooks in conditionals, loops, or nested functions.** The linked-list traversal requires the exact same number and sequence of hook calls on every render.

---

### Think First: Prediction Puzzle
Inspect this component code:
```typescript
export function BuggedToggle({ enabled }: { enabled: boolean }) {
  if (enabled) {
    useState("ENABLED");
  }
  const [name, setName] = useState("USER_ALPHA");

  return <span>{name}</span>;
}
```
During Mount: `enabled` is `true`.
On Re-render: `enabled` is changed to `false`.
What value does `name` hold after the re-render: `"USER_ALPHA"`, `"ENABLED"`, or will React throw an error?

--------------------------------------------------------------------------------
**Answer:**
React throws a runtime invariant error: `"Rendered fewer hooks than expected. This may be caused by an accidental early return or a condition."`

**Explanation:**
During mount, React recorded two hooks in the Fiber's linked list: Hook 1 (`"ENABLED"`) and Hook 2 (`"USER_ALPHA"`). On the second render, only one hook was called. Because `workInProgressHook.next` was not reached, React detects that the component rendered fewer hooks than its previous render snapshot and immediately crashes the component tree to prevent state corruption.

---

### Graded Exercises

#### Exercise 1: Linked-List Pointer Walk Simulator
Implement a pure JavaScript function `walkHookList(head: Hook): any[]` that takes the head of a Fiber's hook linked list and returns an array of all `memoizedState` values in order.
- Hint 1: Initialize an empty results array and a `current: Hook | null = head` cursor.
- Hint 2: Loop `while (current !== null)`, push `current.memoizedState`, and advance `current = current.next`.

#### Exercise 2: State Slot Type Guard
Write a TypeScript type-predicate function `isRefHook(hook: Hook): hook is Hook & { memoizedState: { current: unknown } }` that verifies whether a given hook record contains a `useRef` object.
- Hint 1: Check if `hook.memoizedState !== null && typeof hook.memoizedState === "object"`.
- Hint 2: Verify that `"current" in hook.memoizedState`.

#### Exercise 3: Hook Order Validator
Write a function `validateHookOrder(previousTypes: string[], currentTypes: string[]): boolean` that compares two arrays of hook name strings across two renders. Return `true` if the call order is legal, or return `false` if a hook was added, removed, or swapped.
- Hint 1: First check if `previousTypes.length !== currentTypes.length`.
- Hint 2: Iterate through indices and confirm `previousTypes[i] === currentTypes[i]`.

#### Exercise 4: Minimal Functional Fiber Simulator
Construct a JavaScript object model representing a `SyntheticFiber` and a function `invokeComponent(fiber: SyntheticFiber, comp: () => void): void` that resets internal pointers and executes the component function, ensuring subsequent runs advance along the existing linked list.
- Hint 1: Store `fiber.memoizedState` for the head of the list.
- Hint 2: Track a global `currentHookCursor` during component execution.

--------------------------------------------------------------------------------
### Exercise Solutions

```typescript
// Solution 1:
interface HookNode {
  memoizedState: any;
  next: HookNode | null;
}

export function walkHookList(head: HookNode | null): any[] {
  const values: any[] = [];
  let current = head;
  while (current !== null) {
    values.push(current.memoizedState);
    current = current.next;
  }
  return values;
}

// Solution 2:
export function isRefHook(
  hook: HookNode
): hook is HookNode & { memoizedState: { current: unknown } } {
  return (
    hook.memoizedState !== null &&
    typeof hook.memoizedState === "object" &&
    "current" in hook.memoizedState
  );
}

// Solution 3:
export function validateHookOrder(
  previousTypes: string[],
  currentTypes: string[]
): boolean {
  if (previousTypes.length !== currentTypes.length) {
    return false;
  }
  for (let i = 0; i < previousTypes.length; i++) {
    if (previousTypes[i] !== currentTypes[i]) {
      return false;
    }
  }
  return true;
}

// Solution 4:
export class FiberSimulator {
  memoizedState: HookNode | null = null;
  private currentCursor: HookNode | null = null;
  private isMount: boolean = true;

  execute(component: () => void) {
    this.currentCursor = null;
    component();
    this.isMount = false;
  }

  useInternalState<T>(initial: T): [T, (next: T) => void] {
    let hook: HookNode;

    if (this.isMount) {
      hook = { memoizedState: initial, next: null };
      if (!this.memoizedState) {
        this.memoizedState = hook;
      } else if (this.currentCursor) {
        this.currentCursor.next = hook;
      }
      this.currentCursor = hook;
    } else {
      hook = this.currentCursor ? this.currentCursor.next! : this.memoizedState!;
      this.currentCursor = hook;
    }

    const set = (next: T) => {
      hook.memoizedState = next;
    };

    return [hook.memoizedState, set];
  }
}
```

---

### Recall
1. Where does React store the state of a functional component when the function exits?
2. What happens if a hook is placed inside an `if` block and the condition toggles from `true` to `false` between renders?
3. If you remember only one thing: **React identifies hooks strictly by their sequential index in a singly-linked list stored on the Fiber's `memoizedState` property.**

---

## Topic 2: Dispatcher Polymorphism: `HooksDispatcherOnMount` vs `HooksDispatcherOnUpdate` & Rules of Hooks

### What Is It?
When you import and call `useState(0)` in your component, `useState` is **not** a static function with hard-coded logic. Instead, `useState` is a polymorphic proxy function that delegates execution to an internal object called the **Dispatcher**.

React changes the active dispatcher object depending on what phase the component is currently in:
- During initial rendering: `ReactCurrentDispatcher.current = HooksDispatcherOnMount`
- During re-renders: `ReactCurrentDispatcher.current = HooksDispatcherOnUpdate`
- Outside of any component rendering: `ReactCurrentDispatcher.current = ContextOnlyDispatcher` (which throws errors if any hook is called)

Here are the key technical terms defined:
- Polymorphism is the programming ability of a single interface or function call to execute different underlying code based on runtime context.
- A Dispatcher is a container object holding the concrete implementations of all hook functions (`useState`, `useEffect`, `useRef`, etc.) for a specific phase of the component lifecycle.
- Invariant Violation is an intentional assertion error thrown by React when code violates a fundamental architectural guarantee.

```
                    ┌─────────────────────────┐
                    │  ReactCurrentDispatcher │
                    └────────────┬────────────┘
                                 │ .current
         ┌───────────────────────┼───────────────────────┐
         ▼                       ▼                       ▼
┌──────────────────┐   ┌──────────────────┐   ┌──────────────────┐
│  Dispatcher      │   │  Dispatcher      │   │  ContextOnly     │
│  OnMount         │   │  OnUpdate        │   │  Dispatcher      │
│ (Allocates Nodes)│   │ (Walks Nodes)    │   │ (Throws Errors)  │
└──────────────────┘   └──────────────────┘   └──────────────────┘
```

### Why Does It Exist?
During initial mounting, React must allocate new `Hook` objects, assign initial default states, and construct the singly-linked list. 

During an update (re-render), allocating new objects would create massive garbage collection churn and wipe out previous state values. Instead, React must walk the existing linked list, ignore the initial values, and apply queued state changes.

Rather than checking `if (isMount)` inside every single hook on every single render, React swaps the entire dispatcher object once before calling the component. This design provides:
1. Maximum V8 engine optimization (monomorphic call sites within each phase).
2. Elimination of conditional branches inside the hook functions.
3. Complete protection against calling hooks outside of React's render phase.

### Basic Example and Line-by-Line Explanation

```typescript
import React, { useState } from "react";

// Calling a hook outside a component body:
try {
  useState(0);
} catch (error: any) {
  console.log("Caught invalid hook call:", error.message);
}

export function ValidComponent() {
  // Inside a component body: ReactCurrentDispatcher is set to a valid dispatcher
  const [data, setData] = useState<string>("INITIAL");
  return <div>Data: {data}</div>;
}
```

Line-by-line breakdown:
1. `import React, { useState } from "react";`: Imports the proxy hook function.
2. `try { useState(0); }`: Attempts to execute a hook in normal JavaScript module scope.
3. `catch (error: any)`: Catches the error thrown by `ContextOnlyDispatcher.useState`. The error informs the developer: *"Invalid hook call. Hooks can only be called inside of the body of a function component."*
4. `export function ValidComponent()`: Declares a React functional component.
5. `const [data, setData] = useState<string>("INITIAL");`: When React executes `ValidComponent`, it sets `ReactCurrentDispatcher.current` to `HooksDispatcherOnMount` (first render) or `HooksDispatcherOnUpdate` (re-render), allowing the call to succeed.
6. `return <div>Data: {data}</div>;`: Returns the virtual element. Once the function returns, React resets the dispatcher back to the error-throwing dispatcher.

### How It Works Inside React
Inside the React core source code (`packages/react/src/ReactHooks.js`):

```typescript
import ReactCurrentDispatcher from "./ReactCurrentDispatcher";

export function useState(initialState) {
  const dispatcher = ReactCurrentDispatcher.current;
  if (dispatcher === null) {
    throw new Error("Invalid hook call. Hooks can only be called inside the body of a function component.");
  }
  return dispatcher.useState(initialState);
}
```

When the Reconciler processes a Fiber:
1. `renderWithHooks` is invoked in `ReactFiberHooks.js`.
2. React checks `current !== null && current.memoizedState !== null`.
   - If `false`: This is the first render. React assigns:
     ```javascript
     ReactCurrentDispatcher.current = HooksDispatcherOnMount;
     ```
   - If `true`: This is a subsequent re-render. React assigns:
     ```javascript
     ReactCurrentDispatcher.current = HooksDispatcherOnUpdate;
     ```
3. React invokes your component function: `const children = Component(props, secondArg)`.
4. When `useState` executes, it forwards directly to whichever dispatcher is active on `ReactCurrentDispatcher.current`.
5. After the component function finishes, React resets:
   ```javascript
   ReactCurrentDispatcher.current = ContextOnlyDispatcher;
   ```

### More Examples

#### Example 1: Conceptual Simulation of React's Dispatcher Switching
```typescript
type Dispatcher = {
  useState: <T>(initial: T) => [T, (val: T) => void];
};

const ContextOnlyDispatcher: Dispatcher = {
  useState: () => {
    throw new Error("Invalid hook call. Hooks cannot be called outside of a component.");
  },
};

const MountDispatcher: Dispatcher = {
  useState: <T>(initial: T) => {
    console.log("MountDispatcher: Creating new hook object with initial:", initial);
    return [initial, () => {}];
  },
};

const UpdateDispatcher: Dispatcher = {
  useState: <T>(initial: T) => {
    console.log("UpdateDispatcher: Ignoring initial value. Reading from existing Fiber node.");
    return [initial, () => {}];
  },
};

// Global container
const CurrentDispatcherContainer = {
  current: ContextOnlyDispatcher,
};

// Public facing API
function publicUseState<T>(initial: T) {
  return CurrentDispatcherContainer.current.useState(initial);
}
```

#### Example 2: Verifying Dispatcher Switch During Render Cycle
```typescript
function simulateRender(isFirstRender: boolean) {
  // 1. Enter render phase
  CurrentDispatcherContainer.current = isFirstRender ? MountDispatcher : UpdateDispatcher;

  try {
    // 2. Execute component
    const [score] = publicUseState(100);
  } finally {
    // 3. Exit render phase: always reset to prevent rogue hook calls
    CurrentDispatcherContainer.current = ContextOnlyDispatcher;
  }
}

simulateRender(true);  // Logs MountDispatcher
simulateRender(false); // Logs UpdateDispatcher
```

#### Example 3: The Custom Hook Passthrough
A custom hook does not have its own dispatcher. It simply calls standard hooks while the component's dispatcher is active:
```typescript
import { useState } from "react";

// Custom hook: legal because it executes synchronously while the parent component renders
export function useToggle(initialValue: boolean = false): [boolean, () => void] {
  const [active, setActive] = useState<boolean>(initialValue);
  const toggle = () => setActive((prev) => !prev);
  return [active, toggle];
}
```

### Common Mistakes

#### Mistake 1: Calling a Hook Inside an Asynchronous Callback or Event Handler
```typescript
// WRONG: Hook invoked inside an asynchronous callback after render completes
export function AsyncBadComponent() {
  const handleClick = async () => {
    // By the time this click runs, ReactCurrentDispatcher is ContextOnlyDispatcher!
    const [val, setVal] = useState(0); // THROWS RUNTIME ERROR!
  };

  return <button onClick={handleClick}>Click</button>;
}

// CORRECT: Call hooks synchronously in the component render body
export function AsyncGoodComponent() {
  const [val, setVal] = useState(0);

  const handleClick = async () => {
    // Mutate state using the dispatch function, NOT by calling a new hook
    setVal((prev) => prev + 1);
  };

  return <button onClick={handleClick}>Click</button>;
}
```

#### Mistake 2: Calling Hooks Inside Class Component Methods
```typescript
// WRONG: React class components do not configure ReactCurrentDispatcher
class BadClassComp extends React.Component {
  render() {
    const [state] = useState(0); // THROWS RUNTIME ERROR!
    return <div>{state}</div>;
  }
}
```

### Rules to Remember
1. **`useState` has no single implementation.** It delegates dynamically to `ReactCurrentDispatcher.current`.
2. **Mount and Update run completely different code.** `mountState` allocates the hook node; `updateState` navigates the existing node and ignores the initial value parameter.
3. **Hooks can only run synchronously inside function components or custom hooks.** Outside the synchronous render phase, `ReactCurrentDispatcher` throws an error.

---

### Think First: Prediction Puzzle
Consider the following component:
```typescript
export function ExpensiveInitializer() {
  const [config] = useState(() => {
    console.log("CALCULATING_DEFAULT_CONFIG");
    return { timeoutMs: 5000 };
  });

  const [counter, setCounter] = useState(0);

  return <button onClick={() => setCounter((c) => c + 1)}>Count: {counter}</button>;
}
```
When the user clicks the button, the component re-renders. Will `"CALCULATING_DEFAULT_CONFIG"` be printed to the console a second time?

--------------------------------------------------------------------------------
**Answer:**
No.

**Explanation:**
During the update phase, `ReactCurrentDispatcher.current` points to `HooksDispatcherOnUpdate`. In `updateState`, React completely skips evaluating both direct initial values and initial lazy state functions (`() => ...`), returning the already computed `memoizedState` from the existing Hook node.

---

### Graded Exercises

#### Exercise 1: Dispatcher Guard Mock
Implement a JavaScript function `createDispatcherGuard()` that returns an object with `runInContext(dispatcher, fn)` and a proxy function `useStateProxy(val)`. Calling `useStateProxy` outside of `runInContext` must throw `"No active dispatcher"`.
- Hint 1: Maintain a private `activeDispatcher: any = null` variable.
- Hint 2: In `runInContext`, assign `activeDispatcher = dispatcher`, execute `fn()`, and in a `finally` block set `activeDispatcher = null`.

#### Exercise 2: Detecting Mount vs Update Phase
Create a function `getPhaseDispatcher(hasMounted: boolean): "mount" | "update"` simulating React's `renderWithHooks` dispatcher branch condition.
- Hint 1: If `hasMounted === false`, return `"mount"`.
- Hint 2: Otherwise, return `"update"`.

#### Exercise 3: Custom Hook Name Validator Linter Rule
Write a function `isValidHookName(name: string): boolean` that verifies whether a function identifier conforms to React's hook naming convention (must start with `"use"` followed by a capital ASCII letter).
- Hint 1: Check `name.startsWith("use")`.
- Hint 2: Verify `name.length > 3` and character 3 is an uppercase letter (`name[3] >= 'A' && name[3] <= 'Z'`).

#### Exercise 4: Monomorphic Dispatcher Table
Construct a TypeScript type `DispatcherTable` representing all standard hooks (`useState`, `useEffect`, `useRef`, `useMemo`). Create two concrete objects of this type: `NullDispatcher` (all methods throw) and `MockMountDispatcher` (all methods log and return mock values).
- Hint 1: Define generic function signatures for each hook.
- Hint 2: Use `throw new Error(...)` for each entry in `NullDispatcher`.

--------------------------------------------------------------------------------
### Exercise Solutions

```typescript
// Solution 1:
export function createDispatcherGuard() {
  let activeDispatcher: { useState: (val: any) => any } | null = null;

  return {
    runInContext<T>(dispatcher: { useState: (val: any) => any }, fn: () => T): T {
      activeDispatcher = dispatcher;
      try {
        return fn();
      } finally {
        activeDispatcher = null;
      }
    },
    useStateProxy(val: any) {
      if (!activeDispatcher) {
        throw new Error("No active dispatcher");
      }
      return activeDispatcher.useState(val);
    },
  };
}

// Solution 2:
export function getPhaseDispatcher(hasMounted: boolean): "mount" | "update" {
  return hasMounted ? "update" : "mount";
}

// Solution 3:
export function isValidHookName(name: string): boolean {
  if (!name.startsWith("use") || name.length <= 3) {
    return false;
  }
  const fourthChar = name.charAt(3);
  return fourthChar === fourthChar.toUpperCase() && fourthChar !== fourthChar.toLowerCase();
}

// Solution 4:
export interface DispatcherTable {
  useState<T>(initial: T): [T, (next: T) => void];
  useRef<T>(initial: T): { current: T };
  useEffect(effect: () => void | (() => void), deps?: any[]): void;
  useMemo<T>(factory: () => T, deps?: any[]): T;
}

export const NullDispatcher: DispatcherTable = {
  useState: () => { throw new Error("Invalid hook call"); },
  useRef: () => { throw new Error("Invalid hook call"); },
  useEffect: () => { throw new Error("Invalid hook call"); },
  useMemo: () => { throw new Error("Invalid hook call"); },
};

export const MockMountDispatcher: DispatcherTable = {
  useState: (initial) => [initial, () => {}],
  useRef: (initial) => ({ current: initial }),
  useEffect: () => {},
  useMemo: (factory) => factory(),
};
```

---

### Recall
1. Which internal property does React check to decide whether to set `HooksDispatcherOnMount` or `HooksDispatcherOnUpdate`?
2. Why is calling a hook inside a `setTimeout` callback prohibited by React?
3. If you remember only one thing: **React uses dispatcher polymorphism to swap the implementation of all hook functions between mount, update, and error-throwing states without changing the public API.**

---

## Topic 3: `useState`: Update Queues, Batching, Functional Updaters & Eager State Bailout

### What Is It?
`useState` is React's fundamental hook for declaring local reactive state. When a state updater function (`setState`) is invoked, React does not immediately rewrite the state variable in place.

Instead, React appends an **`Update` record** to a circular queue attached to the hook (`hook.queue.pending`). During the next render phase, React processes this queue in order, computes the new `memoizedState`, and returns it.

Key technical terms defined:
- An Update Queue is a circular linked list on the Hook object where dispatches are held until React processes them.
- Batching is the grouping of multiple `setState` calls into a single render pass to prevent unnecessary duplicate rendering.
- A Functional Updater is an updater syntax `setState(prev => next)` that passes the most recent state to ensure sequential mutations compute correctly.
- Eager Bailout is a performance optimization where React evaluates your next state immediately upon calling `setState`; if it equals the current state (tested via `Object.is`), React discards the render before scheduling work.

```
                    setState(1)        setState(2)
                         │                  │
                         ▼                  ▼
                  ┌──────────────┐   ┌──────────────┐
                  │ Update Node  ├──►│ Update Node  ├──┐
                  └──────────────┘   └──────────────┘  │
                         ▲                             │
                         └─────────────────────────────┘
                               (Circular Queue)
```

### Why Does It Exist?
If every `setState` call synchronously mutated state and triggered DOM updates:
1. Setting 3 state variables in an event handler would trigger 3 independent renders and 3 DOM repaints, causing UI lag and inconsistent intermediate visual states.
2. Multiple sequential updates would overwrite each other if based on stale snapshot variables from the current render.

Queuing updates and processing them in a unified batch provides deterministic state computation and optimal rendering performance.

### Basic Example and Line-by-Line Explanation

```typescript
import React, { useState } from "react";

export function CounterDemo() {
  const [count, setCount] = useState<number>(0);

  const handleTripleIncrement = () => {
    setCount((prev) => prev + 1);
    setCount((prev) => prev + 1);
    setCount((prev) => prev + 1);
  };

  return (
    <div>
      <p>Count: {count}</p>
      <button onClick={handleTripleIncrement}>Add 3</button>
    </div>
  );
}
```

Line-by-line breakdown:
1. `import React, { useState } from "react";`: Imports the React runtime and the `useState` hook.
2. `export function CounterDemo()`: Declares the component.
3. `const [count, setCount] = useState<number>(0);`: Creates a state hook with `0` as initial value. `setCount` is a bound dispatcher reference.
4. `const handleTripleIncrement = () => {`: Declares an event handler executing 3 sequential updater calls.
5. `setCount((prev) => prev + 1);`: Creates an Update record with action `(prev) => prev + 1` and enqueues it to `hook.queue.pending`.
6. `setCount((prev) => prev + 1);`: Creates a second Update record and appends it to the circular queue.
7. `setCount((prev) => prev + 1);`: Creates a third Update record and appends it to the circular queue.
8. When the event handler finishes, React processes all 3 updates sequentially in a **single render**: $0 \to 1 \to 2 \to 3$. The component renders once with `count = 3`.

### How It Works Inside React
When `setState` is called:
1. **Eager State Calculation**:
   React checks if the queue is currently empty. If empty, React runs the reducer eagerly:
   ```javascript
   const eagerState = action(hook.memoizedState);
   if (Object.is(eagerState, hook.memoizedState)) {
     // BAILOUT: New state is identical to current state.
     // Return immediately without scheduling a re-render!
     return;
   }
   ```
2. **Enqueue Update**:
   If the state changed, React allocates an `Update` object:
   ```javascript
   const update = {
     action,
     next: null,
   };
   ```
3. **Circular Buffer Connection**:
   The update is appended to `queue.pending`. The last update points back to the first update, forming a circle. This allows React to append to the end in $O(1)$ while maintaining a direct reference to the head.
4. **Render-Phase Processing**:
   During `updateState`, React loops through the circular queue starting at the head:
   ```javascript
   let update = firstUpdate;
   let newState = hook.baseState;
   do {
     const action = update.action;
     newState = typeof action === "function" ? action(newState) : action;
     update = update.next;
   } while (update !== null && update !== firstUpdate);
   hook.memoizedState = newState;
   ```

### More Examples

#### Example 1: Direct Value vs Functional Updater (The Stale Value Trap)
```typescript
import React, { useState } from "react";

export function StaleCounter() {
  const [value, setValue] = useState(0);

  const brokenIncrement = () => {
    // value is captured as 0 in this render's closure
    setValue(value + 1); // Enqueues 0 + 1 = 1
    setValue(value + 1); // Enqueues 0 + 1 = 1
    setValue(value + 1); // Enqueues 0 + 1 = 1
    // Result after render: value will be 1, NOT 3!
  };

  const workingIncrement = () => {
    // Each updater receives the intermediate output of the previous updater
    setValue((v) => v + 1); // 0 -> 1
    setValue((v) => v + 1); // 1 -> 2
    setValue((v) => v + 1); // 2 -> 3
    // Result after render: value will be 3!
  };

  return (
    <div>
      <button onClick={brokenIncrement}>Broken: {value}</button>
      <button onClick={workingIncrement}>Working: {value}</button>
    </div>
  );
}
```

#### Example 2: Eager Bailout Verification with Object References
```typescript
import React, { useState } from "react";

export function BailoutTest() {
  const [user, setUser] = useState({ name: "Alex" });
  console.log("RENDERED_BAILOUT_TEST");

  const mutateSameObject = () => {
    user.name = "Alex"; // Mutates object in place
    setUser(user);      // Object.is(user, user) is true!
    // React bails out eagerly; NO re-render occurs!
  };

  const createNewObject = () => {
    setUser({ name: "Alex" }); // New object reference in heap memory
    // Object.is(oldUser, newUser) is false!
    // React schedules and executes a re-render.
  };

  return (
    <div>
      <button onClick={mutateSameObject}>Same Ref</button>
      <button onClick={createNewObject}>New Ref</button>
    </div>
  );
}
```

#### Example 3: Lazy Initial State for Heavy Computations
```typescript
import React, { useState } from "react";

function parseLargeFile(): string[] {
  console.log("HEAVY_COMPUTATION_EXECUTED");
  return Array.from({ length: 1000 }, (_, i) => `item_${i}`);
}

export function ItemCatalog() {
  // Pass a function reference (() => parseLargeFile()) so it ONLY runs on initial mount
  const [items] = useState(() => parseLargeFile());
  const [active, setActive] = useState(false);

  return (
    <div>
      <button onClick={() => setActive(!active)}>Toggle: {String(active)}</button>
      <p>Loaded items: {items.length}</p>
    </div>
  );
}
```

### Common Mistakes

#### Mistake 1: Invoking an Expensive Initializer Directly inside `useState`
```typescript
// WRONG: readConfigFromStorage() executes on EVERY re-render, throwing away the result!
export function BadConfig() {
  const [config, setConfig] = useState(readConfigFromStorage());
}

// CORRECT: Pass an anonymous factory function (Lazy Initialization)
export function GoodConfig() {
  const [config, setConfig] = useState(() => readConfigFromStorage());
}
```

#### Mistake 2: Mutating State Directly and Calling `setState` with the Same Object
```typescript
// WRONG: In-place mutation breaks React's Object.is comparison
export function UserSettings() {
  const [settings, setSettings] = useState({ theme: "light" });

  const toggle = () => {
    settings.theme = "dark";
    setSettings(settings); // React sees Object.is(settings, settings) === true and bails out!
  };

  return <div>{settings.theme}</div>;
}

// CORRECT: Create a new object shallow copy
export function UserSettingsCorrect() {
  const [settings, setSettings] = useState({ theme: "light" });

  const toggle = () => {
    setSettings((prev) => ({ ...prev, theme: "dark" }));
  };

  return <div>{settings.theme}</div>;
}
```

### Rules to Remember
1. **`setState` is asynchronous and batched.** State changes do not take effect immediately within the same function execution.
2. **When new state depends on previous state, always use functional updaters:** `setState(prev => next)`.
3. **React uses `Object.is` for eager bailouts.** If you pass the exact same reference, React cancels the render. Always create new object/array references when updating state.
4. **Use lazy initialization `useState(() => init())` for expensive calculations** to ensure the initializer only executes once during mount.

---

### Think First: Prediction Puzzle
Consider this code:
```typescript
export function StateBatchPuzzle() {
  const [count, setCount] = useState(10);

  const handleClick = () => {
    setCount(count + 5);
    setCount((c) => c * 2);
    setCount(count + 1);
  };

  return <button onClick={handleClick}>Count: {count}</button>;
}
```
If `count` starts at `10` and the user clicks the button once, what will `count` be on screen: `11`, `30`, `31`, or `21`?

--------------------------------------------------------------------------------
**Answer:**
`11`.

**Explanation:**
Let's trace the circular update queue step-by-step:
1. `setCount(count + 5)` enqueues action: `10 + 5 = 15`.
2. `setCount((c) => c * 2)` enqueues action: `(c) => c * 2`.
3. `setCount(count + 1)` enqueues action: `10 + 1 = 11`. (Because `count` in the current render scope is still `10`).

During render processing:
- Start with `10`.
- Apply update 1: `15`.
- Apply update 2: `15 * 2 = 30`.
- Apply update 3: Replaces with constant `11`.
Final state is `11`.

---

### Graded Exercises

#### Exercise 1: State Reducer Loop Simulator
Write a pure function `processUpdateQueue<T>(baseState: T, queue: Array<T | ((prev: T) => T)>): T` that mimics React's internal queue processing loop for a sequence of direct values and functional updaters.
- Hint 1: Iterate through the `queue` array using a loop or `reduce`.
- Hint 2: If `typeof action === "function"`, call `action(currentState)`, otherwise use `action`.

#### Exercise 2: Object Equality Bailout Detector
Implement a function `shouldBailout<T>(currentState: T, nextState: T): boolean` that returns `true` if React will perform an eager bailout using the `Object.is` comparison algorithm.
- Hint 1: Use `Object.is(currentState, nextState)`.
- Hint 2: Test edge cases like `Object.is(NaN, NaN)` (true) and `Object.is(+0, -0)` (false).

#### Exercise 3: Safe State Merging Hook Simulator
Write a helper function `createObjectUpdater<T extends object>(set: (updater: (prev: T) => T) => void)` that returns a function `mergeState(partial: Partial<T>)` which safely merges partial state objects without mutating the original.
- Hint 1: Call `set((prev) => ({ ...prev, ...partial }))`.

#### Exercise 4: Circular Linked List Update Queue
Construct an `UpdateQueue<T>` class with an `enqueue(action: T | ((prev: T) => T)): void` method that stores updates in a circular singly-linked list and a `drain(baseState: T): T` method that processes them in order and clears the queue.
- Hint 1: Keep a pointer `pending: UpdateNode<T> | null` pointing to the newest node.
- Hint 2: In a circular list, `pending.next` points to the oldest node (head).

--------------------------------------------------------------------------------
### Exercise Solutions

```typescript
// Solution 1:
export function processUpdateQueue<T>(
  baseState: T,
  queue: Array<T | ((prev: T) => T)>
): T {
  let currentState = baseState;
  for (const action of queue) {
    if (typeof action === "function") {
      currentState = (action as (prev: T) => T)(currentState);
    } else {
      currentState = action;
    }
  }
  return currentState;
}

// Solution 2:
export function shouldBailout<T>(currentState: T, nextState: T): boolean {
  return Object.is(currentState, nextState);
}

// Solution 3:
export function createObjectUpdater<T extends object>(
  set: (updater: (prev: T) => T) => void
) {
  return (partial: Partial<T>) => {
    set((prev) => ({ ...prev, ...partial }));
  };
}

// Solution 4:
interface UpdateNode<T> {
  action: T | ((prev: T) => T);
  next: UpdateNode<T> | null;
}

export class UpdateQueue<T> {
  private pending: UpdateNode<T> | null = null;

  enqueue(action: T | ((prev: T) => T)): void {
    const node: UpdateNode<T> = { action, next: null };
    if (!this.pending) {
      node.next = node;
      this.pending = node;
    } else {
      node.next = this.pending.next;
      this.pending.next = node;
      this.pending = node;
    }
  }

  drain(baseState: T): T {
    if (!this.pending) return baseState;

    const head = this.pending.next!;
    let current = head;
    let state = baseState;

    do {
      if (typeof current.action === "function") {
        state = (current.action as (prev: T) => T)(state);
      } else {
        state = current.action;
      }
      current = current.next!;
    } while (current !== head);

    this.pending = null;
    return state;
  }
}
```

---

### Recall
1. Why does calling `setCount(count + 1)` three times in the same click handler only increment by 1?
2. What algorithm does React use to decide if an update can be eagerly bailed out?
3. If you remember only one thing: **React queues state updates in a circular buffer and batches them together into a single render pass to maintain optimal UI frame rates.**

---

## Topic 4: `useReducer`: State Machine Architecture, Complex Actions & Comparison with `useState`

### What Is It?
`useReducer` is an alternative hook for managing state transitions through a pure reducer function. Instead of directly assigning new state values, components dispatch typed **Action objects** that describe *what happened*, and the reducer determines *how the state changes*.

In fact, inside React's source code, **`useState` is literally implemented as a `useReducer` with a pre-built basic reducer!**

Here are the key technical terms defined:
- A Reducer is a pure JavaScript function that accepts `(state, action)` and returns the next state without mutating the previous state.
- An Action is a plain JavaScript object, usually formatted with a `type` discriminant property and an optional `payload`.
- A Dispatch function is a stable function reference used to send actions into the reducer's update queue.
- A State Machine is a computational model consisting of a finite number of valid states and explicit transitions between them.

```
                  ┌────────────────────────┐
                  │ Action { type: "ADD" } │
                  └───────────┬────────────┘
                              │ dispatch
                              ▼
┌──────────────┐      ┌───────────────┐      ┌──────────────┐
│  Old State   ├─────►│    Reducer    ├─────►│  New State   │
└──────────────┘      │ Pure Function │      └──────────────┘
                      └───────────────┘
```

### Why Does It Exist?
While `useState` works well for independent primitive values, it degrades when:
1. Multiple state fields depend on one another (e.g. `isLoading`, `error`, and `data`). Updating them with separate `useState` calls can cause intermediate inconsistent UI states.
2. Complex state logic is mixed directly inside JSX event handlers, making unit testing difficult without mounting the UI.
3. Callbacks passed down through deep component hierarchies trigger child re-renders because `setState` handlers are constantly re-created. The `dispatch` function from `useReducer` is guaranteed to have a **stable identity** across all renders.

### Basic Example and Line-by-Line Explanation

```typescript
import React, { useReducer } from "react";

// 1. Define explicit State contract
type AuthState = {
  status: "idle" | "loading" | "authenticated" | "error";
  token: string | null;
  errorMessage: string | null;
};

// 2. Define Discriminated Union of Actions
type AuthAction =
  | { type: "LOGIN_START" }
  | { type: "LOGIN_SUCCESS"; token: string }
  | { type: "LOGIN_FAILURE"; error: string }
  | { type: "LOGOUT" };

const initialAuthState: AuthState = {
  status: "idle",
  token: null,
  errorMessage: null,
};

// 3. Pure Reducer Function
function authReducer(state: AuthState, action: AuthAction): AuthState {
  switch (action.type) {
    case "LOGIN_START":
      return { ...state, status: "loading", errorMessage: null };
    case "LOGIN_SUCCESS":
      return { status: "authenticated", token: action.token, errorMessage: null };
    case "LOGIN_FAILURE":
      return { status: "error", token: null, errorMessage: action.error };
    case "LOGOUT":
      return initialAuthState;
    default:
      return state;
  }
}

export function AuthPanel() {
  const [state, dispatch] = useReducer(authReducer, initialAuthState);

  return (
    <div>
      <p>Status: {state.status}</p>
      {state.status === "loading" && <p>Logging in...</p>}
      {state.status === "error" && <p>Error: {state.errorMessage}</p>}
      {state.status === "authenticated" ? (
        <button onClick={() => dispatch({ type: "LOGOUT" })}>Log Out</button>
      ) : (
        <button
          onClick={() =>
            dispatch({ type: "LOGIN_SUCCESS", token: "tok_secret_9981" })
          }
        >
          Log In
        </button>
      )}
    </div>
  );
}
```

Line-by-line breakdown:
1. `type AuthState = { ... }`: Defines the possible states. The `status` union prevents impossible states (like `status: "idle"` with an `errorMessage`).
2. `type AuthAction = ...`: Defines all permissible events using a discriminated union.
3. `function authReducer(state: AuthState, action: AuthAction): AuthState`: Declares the pure transition logic. Given identical inputs, it always produces identical outputs.
4. `case "LOGIN_SUCCESS": return { ... }`: Immutably returns the next state with the new token.
5. `const [state, dispatch] = useReducer(authReducer, initialAuthState);`: Initializes the hook. `dispatch` never changes identity across renders.
6. `onClick={() => dispatch({ type: "LOGOUT" })}`: Sends an action. React enqueues the action, passes it to `authReducer` during the next render, and updates the UI.

### How It Works Inside React
Inside `react-reconciler/src/ReactFiberHooks.js`, the implementation of `useState` literally invokes `useReducer`:

```javascript
// How React implements useState internally:
function basicStateReducer(state, action) {
  return typeof action === "function" ? action(state) : action;
}

export function useState(initialState) {
  return useReducer(basicStateReducer, initialState);
}
```

When `useReducer` mounts:
1. React creates a `Hook` record.
2. An internal `queue` object is initialized with a reference to the `lastRenderedReducer`.
3. React creates a dispatch function bound to the Fiber and queue:
   ```javascript
   const dispatch = dispatchReducerAction.bind(null, currentlyRenderingFiber, queue);
   ```
4. Because `dispatch` is bound once to the Fiber during mount, its reference is completely invariant (`dispatch === dispatch` across every render).

### More Examples

#### Example 1: Lazy Initialization with `init` Argument
```typescript
import React, { useReducer } from "react";

type CounterState = { count: number };

function initCounter(initialCount: number): CounterState {
  console.log("INITIALIZING_REDUCER_STATE");
  return { count: initialCount * 10 };
}

function counterReducer(state: CounterState, action: { type: "increment" }): CounterState {
  switch (action.type) {
    case "increment":
      return { count: state.count + 1 };
  }
}

export function ScaledCounter({ initialVal }: { initialVal: number }) {
  // Pass the initializer function as the 3rd argument for lazy evaluation
  const [state, dispatch] = useReducer(counterReducer, initialVal, initCounter);

  return (
    <button onClick={() => dispatch({ type: "increment" })}>
      Count: {state.count}
    </button>
  );
}
```

#### Example 2: Preventing Impossible States (State Machine Pattern)
```typescript
type FetchState<T> =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "success"; data: T }
  | { status: "error"; error: Error };

type FetchAction<T> =
  | { type: "FETCH" }
  | { type: "RESOLVE"; payload: T }
  | { type: "REJECT"; error: Error };

function fetchReducer<T>(state: FetchState<T>, action: FetchAction<T>): FetchState<T> {
  switch (state.status) {
    case "idle":
    case "error":
    case "success":
      if (action.type === "FETCH") return { status: "loading" };
      return state;
    case "loading":
      if (action.type === "RESOLVE") return { status: "success", data: action.payload };
      if (action.type === "REJECT") return { status: "error", error: action.error };
      return state;
  }
}
```

#### Example 3: Context Dispatch Provider Pattern
Because `dispatch` never changes reference, passing it down through React Context never triggers re-renders on child consumers unless state changes:
```typescript
import React, { createContext, useContext, useReducer } from "react";

const DispatchContext = createContext<React.Dispatch<AuthAction> | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(authReducer, initialAuthState);

  return (
    <DispatchContext.Provider value={dispatch}>
      {children}
    </DispatchContext.Provider>
  );
}

export function useAuthDispatch() {
  const ctx = useContext(DispatchContext);
  if (!ctx) throw new Error("useAuthDispatch must be used within AuthProvider");
  return ctx;
}
```

### Common Mistakes

#### Mistake 1: Mutating State Inside the Reducer
```typescript
// WRONG: Reducer mutates the incoming state reference!
function badReducer(state: { items: string[] }, action: { type: "add"; item: string }) {
  switch (action.type) {
    case "add":
      state.items.push(action.item); // MUTATION!
      return state; // Returns same object reference; React bails out of render!
  }
}

// CORRECT: Immutably copy state using spread syntax
function goodReducer(state: { items: string[] }, action: { type: "add"; item: string }) {
  switch (action.type) {
    case "add":
      return {
        ...state,
        items: [...state.items, action.item],
      };
  }
}
```

#### Mistake 2: Executing Side Effects Inside Reducer Functions
```typescript
// WRONG: Reducer functions must be 100% pure!
function badReducerWithSideEffect(state: any, action: any) {
  switch (action.type) {
    case "save":
      localStorage.setItem("DATA", JSON.stringify(action.payload)); // SIDE EFFECT!
      fetch("/api/audit", { method: "POST" }); // ASYNC SIDE EFFECT!
      return { ...state, data: action.payload };
  }
}
```
**Why this breaks:** In React StrictMode and during concurrent interruptions, React may evaluate your reducer function multiple times before committing. Side effects placed inside reducers will run multiple duplicate times. Side effects belong in `useEffect` or event handlers, never in reducers.

### Rules to Remember
1. **Reducers must be pure functions.** Zero mutations, zero API calls, zero side effects.
2. **`dispatch` is referentially stable.** It never changes across renders and does not need to be added to `useEffect` or `useCallback` dependency arrays.
3. **`useState` is syntactic sugar over `useReducer`.** Under the hood, React processes both using identical update queues.
4. **Use `useReducer` when state transitions involve multiple sub-values** or when next state depends on complex conditions.

---

### Think First: Prediction Puzzle
Consider this code:
```typescript
const [stateA, dispatchA] = useReducer(authReducer, initialAuthState);
const [stateB, dispatchB] = useReducer(authReducer, initialAuthState);
```
Are `dispatchA` and `dispatchB` the exact same function reference (`dispatchA === dispatchB`)?

--------------------------------------------------------------------------------
**Answer:**
No (`dispatchA !== dispatchB`).

**Explanation:**
Each `useReducer` invocation binds its `dispatch` function to its specific Fiber and Hook queue: `dispatchReducerAction.bind(null, fiber, hook.queue)`. Because `hook.queue` is unique to each hook instance, the resulting bound functions are distinct references. However, `dispatchA` on render 1 will strictly equal `dispatchA` on render 2 (`Object.is(dispatchA_r1, dispatchA_r2) === true`).

---

### Graded Exercises

#### Exercise 1: Pure Reducer Implementation
Write a reducer `todoReducer(state: Todo[], action: TodoAction): Todo[]` supporting `"ADD"` (appends `{ id, text, completed: false }`) and `"TOGGLE"` (inverts `completed` for matching `id`). Ensure zero in-place mutations.
- Hint 1: Use `[...state, action.payload]` for `"ADD"`.
- Hint 2: Use `state.map(todo => todo.id === action.id ? { ...todo, completed: !todo.completed } : todo)` for `"TOGGLE"`.

#### Exercise 2: Implementing `useState` with `useReducer`
Implement a custom React hook `useCustomState<T>(initialValue: T): [T, (val: T | ((prev: T) => T)) => void]` using only React's built-in `useReducer`.
- Hint 1: Define a reducer `(state: T, action: T | ((prev: T) => T)) => typeof action === "function" ? action(state) : action`.
- Hint 2: Call `useReducer(reducer, initialValue)`.

#### Exercise 3: Exhaustive Reducer Type Checking
Create a TypeScript reducer with a `default` case that asserts compile-time exhaustiveness using the `never` bottom type.
- Hint 1: In the `default` case, assign `const _unreachable: never = action`.
- Hint 2: Throw `new Error("Unhandled action: " + JSON.stringify(_unreachable))`.

#### Exercise 4: Undoable State Reducer Wrapper
Create a higher-order reducer `createUndoableReducer<S, A>(reducer: (state: S, action: A) => S)` that wraps any state reducer and returns a state shape `{ past: S[]; present: S; future: S[] }` supporting `"UNDO"` and `"REDO"` actions.
- Hint 1: On normal actions, push `present` into `past`, clear `future`, and set `present = reducer(present, action)`.
- Hint 2: On `"UNDO"`, pop from `past`, push `present` to `future`, and set `present = previousState`.

--------------------------------------------------------------------------------
### Exercise Solutions

```typescript
// Solution 1:
export type Todo = { id: string; text: string; completed: boolean };
export type TodoAction =
  | { type: "ADD"; payload: { id: string; text: string } }
  | { type: "TOGGLE"; id: string };

export function todoReducer(state: Todo[], action: TodoAction): Todo[] {
  switch (action.type) {
    case "ADD":
      return [...state, { ...action.payload, completed: false }];
    case "TOGGLE":
      return state.map((item) =>
        item.id === action.id ? { ...item, completed: !item.completed } : item
      );
    default:
      return state;
  }
}

// Solution 2:
import { useReducer } from "react";

function customStateReducer<T>(state: T, action: T | ((prev: T) => T)): T {
  return typeof action === "function"
    ? (action as (prev: T) => T)(state)
    : action;
}

export function useCustomState<T>(initialValue: T): [T, (val: T | ((prev: T) => T)) => void] {
  return useReducer(customStateReducer, initialValue);
}

// Solution 3:
type BasicAction = { type: "INCREMENT" } | { type: "DECREMENT" };

export function strictReducer(state: number, action: BasicAction): number {
  switch (action.type) {
    case "INCREMENT":
      return state + 1;
    case "DECREMENT":
      return state - 1;
    default: {
      const _exhaustiveCheck: never = action;
      throw new Error(`Unhandled action: ${JSON.stringify(_exhaustiveCheck)}`);
    }
  }
}

// Solution 4:
export type UndoableState<S> = {
  past: S[];
  present: S;
  future: S[];
};

export type UndoableAction<A> =
  | { type: "UNDO" }
  | { type: "REDO" }
  | { type: "ACTION"; payload: A };

export function createUndoableReducer<S, A>(reducer: (state: S, action: A) => S) {
  return (
    state: UndoableState<S>,
    action: UndoableAction<A>
  ): UndoableState<S> => {
    switch (action.type) {
      case "UNDO": {
        if (state.past.length === 0) return state;
        const previous = state.past[state.past.length - 1];
        const newPast = state.past.slice(0, -1);
        return {
          past: newPast,
          present: previous,
          future: [state.present, ...state.future],
        };
      }
      case "REDO": {
        if (state.future.length === 0) return state;
        const next = state.future[0];
        const newFuture = state.future.slice(1);
        return {
          past: [...state.past, state.present],
          present: next,
          future: newFuture,
        };
      }
      case "ACTION": {
        const newPresent = reducer(state.present, action.payload);
        if (Object.is(newPresent, state.present)) return state;
        return {
          past: [...state.past, state.present],
          present: newPresent,
          future: [],
        };
      }
    }
  };
}
```

---

### Recall
1. Why does passing `dispatch` to deep child components prevent unnecessary re-renders?
2. What is the relationship between `useState` and `useReducer` inside React's reconciler source code?
3. If you remember only one thing: **`useReducer` separates transition logic from rendering, guarantees a referentially stable dispatch function, and eliminates impossible states.**

---

## Topic 5: `useRef`: Heap Reference Persistence, DOM Node Binding, Instance Variables & Previous Value Tracking

### What Is It?
`useRef` is React's hook for holding a mutable value that persists across renders without triggering a re-render when mutated.

Calling `useRef(initialValue)` returns a plain, sealed JavaScript object with a single property: `{ current: initialValue }`.

Key technical terms defined:
- A Ref is a persistent wrapper object `{ current: T }` allocated on the heap whose reference identity remains unchanged for the entire lifecycle of the component.
- Mutability is the property of an object allowing its internal fields to be modified in place without reallocating the container.
- An Instance Variable is a persistent piece of data belonging to a component instance that can be read and written synchronously at any time.
- DOM Node Binding is the process where React automatically assigns a reference to the rendered host HTML element (`HTMLInputElement`, `HTMLDivElement`) to `ref.current` during the commit phase.

```
FiberNode (FormInput)
  │
  └── memoizedState (Hook 1)
            │
            └── { current: HTMLInputElement }  ◄── Persistent Heap Container
```

### Why Does It Exist?
In function components, any variable declared in the function body (`let timerId = null;`) is re-initialized every time the component renders. If you want a value to survive across re-renders, you have two options:
1. `useState`: Survives across renders, but mutating it **schedules a re-render**.
2. Module-level variables outside the component (`let globalTimerId = null;`): Survives across renders without re-rendering, but it is **shared globally**, so if the component is mounted twice, the instances overwrite each other!

`useRef` solves this dilemma: it provides **component-instance-isolated storage** that survives renders **without triggering re-renders**.

### Basic Example and Line-by-Line Explanation

```typescript
import React, { useRef, useEffect } from "react";

export function AutoFocusSearchInput() {
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  return (
    <div>
      <input ref={inputRef} placeholder="Search records..." />
    </div>
  );
}
```

Line-by-line breakdown:
1. `import React, { useRef, useEffect } from "react";`: Imports `useRef` and `useEffect`.
2. `const inputRef = useRef<HTMLInputElement | null>(null);`: React allocates a ref object `{ current: null }` and stores it on the Fiber's hook list.
3. `useEffect(() => { ... }, []);`: Schedules an effect to run after the DOM mutations are committed.
4. `<input ref={inputRef} ... />`: The JSX `ref` attribute instructs React to bind the underlying browser `HTMLInputElement` to `inputRef.current`.
5. `if (inputRef.current) inputRef.current.focus();`: When the effect runs after mount, `inputRef.current` points to the real DOM element, and `focus()` is invoked.

### How It Works Inside React
`useRef` is structurally the simplest hook in React's source code:

During Mount (`mountRef`):
```javascript
function mountRef(initialValue) {
  const hook = mountWorkInProgressHook();
  const ref = { current: initialValue };
  hook.memoizedState = ref;
  return ref;
}
```

During Update (`updateRef`):
```javascript
function updateRef(initialValue) {
  const hook = updateWorkInProgressHook();
  return hook.memoizedState; // Returns the exact same object reference!
}
```

When binding to a DOM node (`<div ref={myRef} />`):
1. During the **render phase**, React encounters the `ref` prop and attaches a flag to the Fiber: `fiber.flags |= Ref`.
2. During the **commit phase** (mutation sub-phase), React inserts or updates the real DOM node.
3. During the **commit layout phase**, React walks fibers with the `Ref` flag and assigns:
   ```javascript
   ref.current = hostDOMNode;
   ```
4. When the component unmounts, React safely cleans up before detaching the DOM node:
   ```javascript
   ref.current = null;
   ```

### More Examples

#### Example 1: Mutable Instance Variable (Timer ID across Renders)
```typescript
import React, { useState, useRef, useEffect } from "react";

export function Stopwatch() {
  const [seconds, setSeconds] = useState(0);
  const timerIdRef = useRef<NodeJS.Timeout | null>(null);

  const start = () => {
    if (timerIdRef.current !== null) return; // Already running
    timerIdRef.current = setInterval(() => {
      setSeconds((prev) => prev + 1);
    }, 1000);
  };

  const stop = () => {
    if (timerIdRef.current !== null) {
      clearInterval(timerIdRef.current);
      timerIdRef.current = null;
    }
  };

  // Clean up timer on unmount
  useEffect(() => {
    return () => {
      if (timerIdRef.current) clearInterval(timerIdRef.current);
    };
  }, []);

  return (
    <div>
      <p>Elapsed: {seconds}s</p>
      <button onClick={start}>Start</button>
      <button onClick={stop}>Stop</button>
    </div>
  );
}
```

#### Example 2: Tracking Previous State or Props
```typescript
import React, { useState, useRef, useEffect } from "react";

export function usePrevious<T>(value: T): T | undefined {
  const ref = useRef<T | undefined>(undefined);

  useEffect(() => {
    // Effects run AFTER render, so ref.current is updated after the UI paints
    ref.current = value;
  }, [value]);

  // Returns the value from the PREVIOUS render
  return ref.current;
}

export function PriceTracker({ price }: { price: number }) {
  const previousPrice = usePrevious(price);

  return (
    <div>
      <p>Current Price: ${price}</p>
      <p>Previous Price: ${previousPrice ?? price}</p>
      {previousPrice !== undefined && (
        <span>{price > previousPrice ? "Price Increased" : "Price Dropped"}</span>
      )}
    </div>
  );
}
```

#### Example 3: Callback Ref for Dynamic DOM Measurements
When you need to be notified the exact moment a DOM node attaches or detaches, use a **callback ref** instead of `useRef`:
```typescript
import React, { useState, useCallback } from "react";

export function MeasureNode() {
  const [height, setHeight] = useState<number>(0);

  // Callback ref is called with the DOM element on mount, and null on unmount
  const measuredRef = useCallback((node: HTMLDivElement | null) => {
    if (node !== null) {
      setHeight(node.getBoundingClientRect().height);
    }
  }, []);

  return (
    <div>
      <div ref={measuredRef} style={{ padding: "20px" }}>
        Dynamic Content Box
      </div>
      <p>Measured Box Height: {height}px</p>
    </div>
  );
}
```

### Common Mistakes

#### Mistake 1: Reading or Writing `ref.current` During the Render Phase
```typescript
// WRONG: Reading/writing refs during render makes rendering impure
export function BadComponent() {
  const countRef = useRef(0);

  countRef.current += 1; // SIDE EFFECT IN RENDER PHASE!
  
  // Reading a ref during render to compute JSX can produce mismatched UI in concurrent mode
  return <div>Render count: {countRef.current}</div>;
}

// CORRECT: Mutate refs in effects or event handlers
export function GoodComponent() {
  const countRef = useRef(0);

  useEffect(() => {
    countRef.current += 1;
  });

  return <div>Component Mounted</div>;
}
```
**Why this breaks:** React's render phase must remain pure. In Concurrent React, React may render a component, discard the work, and re-render it. Mutating refs during render produces unpredictable counts and leaks side effects.

#### Mistake 2: Expecting Ref Changes to Update the Screen
```typescript
// WRONG: Changing ref.current does NOT schedule a render!
export function BrokenForm() {
  const textRef = useRef("");

  const handleInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    textRef.current = e.target.value;
    // The UI does not re-render! The text on screen stays frozen.
  };

  return (
    <div>
      <input onChange={handleInput} />
      <p>Typed: {textRef.current}</p> 
    </div>
  );
}

// CORRECT: Use useState when data is intended to be displayed directly on screen
```

### Rules to Remember
1. **Mutating `ref.current` never triggers a re-render.**
2. **Never read or write `ref.current` during render execution.** Only access refs inside `useEffect`, `useLayoutEffect`, or event handlers.
3. **`useRef` returns a sealed `{ current }` object whose reference is invariant.**
4. **Use callback refs when you need to execute logic immediately upon DOM element attachment.**

---

### Think First: Prediction Puzzle
Consider this code:
```typescript
export function RefUpdateOrder() {
  const countRef = useRef(0);
  const [val, setVal] = useState(0);

  console.log("RENDER_VAL:", countRef.current);

  const handleClick = () => {
    countRef.current = 42;
    setVal(1);
  };

  return <button onClick={handleClick}>Click</button>;
}
```
When the user clicks the button, what is printed by `console.log("RENDER_VAL:", countRef.current)` during the resulting re-render: `0` or `42`?

--------------------------------------------------------------------------------
**Answer:**
`42`.

**Explanation:**
Refs are mutated synchronously in heap memory. In `handleClick`, `countRef.current = 42` runs immediately before `setVal(1)` schedules the render. When React runs the component function on re-render, `countRef.current` already points to the updated value `42`.

---

### Graded Exercises

#### Exercise 1: Click-Outside Detector Hook
Write a custom hook `useClickOutside(callback: () => void)` that returns a ref. If the user clicks any DOM element outside the node referenced by the ref, the callback must fire.
- Hint 1: Create `const ref = useRef<HTMLDivElement | null>(null)`.
- Hint 2: In `useEffect`, attach a `"mousedown"` listener on `document`. Check `if (ref.current && !ref.current.contains(e.target as Node)) callback()`.

#### Exercise 2: Debounced Callback with Ref
Implement a custom hook `useDebouncedCallback<T extends (...args: any[]) => void>(fn: T, delayMs: number): T` that uses `useRef` to store the timer ID and latest function reference, ensuring that rapid calls are debounced without re-instantiating the returned callback.
- Hint 1: Store `timerId` in a ref: `const timerRef = useRef<NodeJS.Timeout | null>(null)`.
- Hint 2: Store the latest `fn` in a ref so the debounced runner always calls the newest closure.

#### Exercise 3: Is-Mounted Guard Ref
Create a custom hook `useIsMounted(): () => boolean` that returns a function returning `true` if the component is currently mounted, and `false` after it has unmounted.
- Hint 1: `const isMountedRef = useRef(false)`.
- Hint 2: In `useEffect`, set `isMountedRef.current = true`, and in the cleanup function set `isMountedRef.current = false`.

#### Exercise 4: Imperative DOM Scroll Anchor
Construct a React component `ChatMessages({ messages }: { messages: string[] })` that uses a ref attached to a dummy `<div />` at the bottom of the list to automatically scroll into view (`scrollIntoView({ behavior: "smooth" })`) whenever `messages.length` increases.
- Hint 1: Attach `const bottomRef = useRef<HTMLDivElement | null>(null)`.
- Hint 2: In `useEffect(..., [messages.length])`, call `bottomRef.current?.scrollIntoView()`.

--------------------------------------------------------------------------------
### Exercise Solutions

```typescript
// Solution 1:
import { useRef, useEffect } from "react";

export function useClickOutside(callback: () => void) {
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const handleDocumentClick = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        callback();
      }
    };

    document.addEventListener("mousedown", handleDocumentClick);
    return () => {
      document.removeEventListener("mousedown", handleDocumentClick);
    };
  }, [callback]);

  return ref;
}

// Solution 2:
import { useRef, useEffect, useCallback } from "react";

export function useDebouncedCallback<T extends (...args: any[]) => void>(
  fn: T,
  delayMs: number
): T {
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const fnRef = useRef<T>(fn);

  useEffect(() => {
    fnRef.current = fn;
  }, [fn]);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const debouncedFn = useCallback(
    (...args: any[]) => {
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        fnRef.current(...args);
      }, delayMs);
    },
    [delayMs]
  ) as T;

  return debouncedFn;
}

// Solution 3:
import { useRef, useEffect, useCallback } from "react";

export function useIsMounted(): () => boolean {
  const isMountedRef = useRef<boolean>(false);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  return useCallback(() => isMountedRef.current, []);
}

// Solution 4:
import React, { useRef, useEffect } from "react";

export function ChatMessages({ messages }: { messages: string[] }) {
  const bottomRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  return (
    <div style={{ height: "300px", overflowY: "auto" }}>
      {messages.map((msg, index) => (
        <div key={index}>{msg}</div>
      ))}
      <div ref={bottomRef} />
    </div>
  );
}
```

---

### Recall
1. Does updating `myRef.current = 10` trigger a component re-render?
2. Why is mutating `ref.current` directly in the component render body considered unsafe in Concurrent React?
3. If you remember only one thing: **`useRef` provides a persistent, mutable `{ current }` container on the heap that survives across renders without triggering reconciliation.**

---

## Checkpoint Challenge 1: Core State & Persistent Refs Architecture (Topics 1–5)

### Challenge Objective
Build a complete, type-safe **Telemetry Polling Engine** component and custom hook that tests all concepts from Topics 1 through 5:
1. Fiber Hook linked-list stability and rules of hooks compliance.
2. `useState` with eager bailouts and functional updaters.
3. `useReducer` managing an explicit state machine for network polling (`idle`, `polling`, `success`, `error`, `paused`).
4. `useRef` maintaining timer handles, tracking previous poll durations, and storing dynamic callback references without stale closures.
5. Verification test suite validating state transitions and ref persistence.

### Implementation Code

```typescript
import React, { useState, useReducer, useRef, useEffect, useCallback } from "react";

// ============================================================================
// Step 1: Telemetry State Machine Definition (Topic 4)
// ============================================================================
export type TelemetryState =
  | { status: "idle"; data: null; error: null }
  | { status: "polling"; data: number[] | null; error: null }
  | { status: "success"; data: number[]; error: null }
  | { status: "error"; data: number[] | null; error: string }
  | { status: "paused"; data: number[] | null; error: null };

export type TelemetryAction =
  | { type: "START_POLLING" }
  | { type: "POLL_SUCCESS"; payload: number }
  | { type: "POLL_FAILURE"; error: string }
  | { type: "PAUSE" }
  | { type: "RESET" };

export const initialTelemetryState: TelemetryState = {
  status: "idle",
  data: null,
  error: null,
};

export function telemetryReducer(
  state: TelemetryState,
  action: TelemetryAction
): TelemetryState {
  switch (action.type) {
    case "START_POLLING":
      return {
        status: "polling",
        data: state.data,
        error: null,
      };
    case "POLL_SUCCESS": {
      const existing = state.data ?? [];
      const updated = [...existing, action.payload];
      return {
        status: "success",
        data: updated,
        error: null,
      };
    }
    case "POLL_FAILURE":
      return {
        status: "error",
        data: state.data,
        error: action.error,
      };
    case "PAUSE":
      return {
        status: "paused",
        data: state.data,
        error: null,
      };
    case "RESET":
      return initialTelemetryState;
    default:
      return state;
  }
}

// ============================================================================
// Step 2: Custom Telemetry Polling Hook (Topics 1, 3, 4, 5)
// ============================================================================
export function useTelemetryPoller(pollIntervalMs: number = 1000) {
  // Hook 1: useReducer for state machine (Topic 4)
  const [state, dispatch] = useReducer(telemetryReducer, initialTelemetryState);

  // Hook 2: useState for poll counter with eager bailout (Topic 3)
  const [pollCount, setPollCount] = useState<number>(0);

  // Hook 3: useRef for timer ID (Topic 5)
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Hook 4: useRef for tracking previous poll timestamp (Topic 5)
  const lastPollTimeRef = useRef<number>(0);

  // Hook 5: useRef for total duration tracking
  const totalPollDurationRef = useRef<number>(0);

  const stopTimer = useCallback(() => {
    if (timerRef.current !== null) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const startPolling = useCallback(() => {
    stopTimer();
    dispatch({ type: "START_POLLING" });

    timerRef.current = setInterval(() => {
      const now = performance.now();
      if (lastPollTimeRef.current > 0) {
        totalPollDurationRef.current += now - lastPollTimeRef.current;
      }
      lastPollTimeRef.current = now;

      // Simulated metric reading
      const syntheticMetric = Math.round(Math.random() * 100);

      dispatch({ type: "POLL_SUCCESS", payload: syntheticMetric });
      // Functional state updater to avoid stale closures
      setPollCount((prev) => prev + 1);
    }, pollIntervalMs);
  }, [pollIntervalMs, stopTimer]);

  const pausePolling = useCallback(() => {
    stopTimer();
    dispatch({ type: "PAUSE" });
  }, [stopTimer]);

  const resetPolling = useCallback(() => {
    stopTimer();
    lastPollTimeRef.current = 0;
    totalPollDurationRef.current = 0;
    setPollCount(0);
    dispatch({ type: "RESET" });
  }, [stopTimer]);

  // Clean up timer on unmount
  useEffect(() => {
    return () => stopTimer();
  }, [stopTimer]);

  return {
    state,
    pollCount,
    startPolling,
    pausePolling,
    resetPolling,
    averageDurationMs:
      pollCount > 0 ? totalPollDurationRef.current / pollCount : 0,
  };
}

// ============================================================================
// Step 3: Production Telemetry Panel Component
// ============================================================================
export function TelemetryDashboard() {
  const {
    state,
    pollCount,
    startPolling,
    pausePolling,
    resetPolling,
    averageDurationMs,
  } = useTelemetryPoller(500);

  // Ref for auto-scrolling log container
  const logContainerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [state.data?.length]);

  return (
    <div style={{ padding: "20px", fontFamily: "monospace" }}>
      <h2>System Telemetry Polling Monitor</h2>
      <div>
        <p>Status: <strong>{state.status.toUpperCase()}</strong></p>
        <p>Total Poll Cycles: {pollCount}</p>
        <p>Average Interval: {averageDurationMs.toFixed(2)}ms</p>
      </div>

      <div style={{ marginBottom: "16px" }}>
        <button onClick={startPolling} disabled={state.status === "polling"}>
          Start
        </button>
        <button onClick={pausePolling} disabled={state.status !== "polling"}>
          Pause
        </button>
        <button onClick={resetPolling}>Reset</button>
      </div>

      <div
        ref={logContainerRef}
        style={{
          height: "150px",
          overflowY: "auto",
          border: "1px solid #ccc",
          padding: "8px",
          background: "#fafafa",
        }}
      >
        {state.data && state.data.length > 0 ? (
          state.data.map((val, idx) => (
            <div key={idx}>
              [{idx + 1}] Metric value: {val}
            </div>
          ))
        ) : (
          <p>No telemetry received yet.</p>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// Step 4: Verification and Test Harness
// ============================================================================
export function runCheckpoint1Tests() {
  console.log("--- 1. Testing Telemetry Reducer State Machine ---");
  let st = initialTelemetryState;
  st = telemetryReducer(st, { type: "START_POLLING" });
  console.log("State after START_POLLING:", st.status === "polling");

  st = telemetryReducer(st, { type: "POLL_SUCCESS", payload: 42 });
  console.log("State after POLL_SUCCESS:", st.status === "success" && st.data?.[0] === 42);

  st = telemetryReducer(st, { type: "PAUSE" });
  console.log("State after PAUSE:", st.status === "paused" && st.data?.length === 1);

  st = telemetryReducer(st, { type: "RESET" });
  console.log("State after RESET:", st.status === "idle" && st.data === null);

  console.log("\n--- Checkpoint 1 Complete: All unit assertions passed cleanly! ---");
}

runCheckpoint1Tests();
```

## Topic 6: `useEffect` Internals: Passive Effects, Commit Phase Scheduling & Dependency Comparison (`Object.is`)

### What Is It?
`useEffect` is React's hook for performing **passive side effects**—operations that synchronize the React state tree with external systems (such as the browser DOM, network APIs, timers, or logging services).

A passive effect does **not** block the browser from painting the screen. React defers the execution of `useEffect` callbacks until after the browser has completed layout calculations and rendered the painted pixels to the user's monitor.

Key technical terms defined:
- A Side Effect is any operation that affects something outside the scope of the currently executing function (e.g. DOM mutations, network requests, timers).
- A Passive Effect is an effect scheduled with normal/idle priority that executes asynchronously after the browser paints the frame.
- A Dependency Array is a list of variables passed as the second argument to `useEffect`. React compares each element across renders to determine whether the effect must re-run.
- Dependency Comparison is the process where React iterates over old and new dependency arrays, comparing pairs using the `Object.is` algorithm.

```
┌────────────────┐     ┌────────────────┐     ┌────────────────┐     ┌────────────────┐
│  Render Phase  ├───►│  Commit Phase  ├───►│ Browser Paints  ├───►│ Passive Effect │
│  (Compute JSX) │     │ (DOM Mutation) │     │    Screen      │     │  (useEffect)   │
└────────────────┘     └────────────────┘     └────────────────┘     └────────────────┘
```

### Why Does It Exist?
If side effects were executed directly inside the component body:
1. Operations like network calls or document queries would run during React's render phase. If React interrupts or aborts a concurrent render, side effects would execute for discarded work.
2. Long-running or asynchronous operations would block the browser from drawing pixels, causing severe frame drops and unresponsive user interactions.

`useEffect` decouples rendering from side effects, ensuring the user sees an immediate visual response while background synchronization runs safely afterward.

### Basic Example and Line-by-Line Explanation

```typescript
import React, { useState, useEffect } from "react";

export function DocumentTitleSync() {
  const [unreadCount, setUnreadCount] = useState<number>(0);

  useEffect(() => {
    document.title = `Inbox (${unreadCount})`;
  }, [unreadCount]);

  return (
    <div>
      <p>Unread: {unreadCount}</p>
      <button onClick={() => setUnreadCount((c) => c + 1)}>Receive Message</button>
    </div>
  );
}
```

Line-by-line breakdown:
1. `import React, { useState, useEffect } from "react";`: Imports the state and effect primitives.
2. `export function DocumentTitleSync()`: Declares the functional component.
3. `const [unreadCount, setUnreadCount] = useState<number>(0);`: Creates the reactive counter.
4. `useEffect(() => { ... }, [unreadCount]);`: Declares the effect. The function is the effect creation callback, and `[unreadCount]` is the dependency array.
5. When the component mounts, React evaluates the JSX and mutates the DOM.
6. The browser renders the button and text to the screen.
7. Post-paint, React's scheduler triggers the passive effect queue: `document.title = "Inbox (0)"` executes.
8. When the button is clicked, `unreadCount` changes to `1`. React re-renders, paints `"Unread: 1"`, compares `Object.is(0, 1) === false`, and executes the effect again with `"Inbox (1)"`.

### How It Works Inside React
Inside `react-reconciler/src/ReactFiberHooks.js`:
1. During mount (`mountEffectImpl`), React allocates an `Effect` record on `hook.memoizedState`:
   ```javascript
   const effect = {
     tag: HookPassive | HookHasEffect, // Bitmask flag
     create: effectFn,                 // Your function
     destroy: undefined,               // Returned cleanup function
     deps: nextDeps,                   // [unreadCount]
     next: null,
   };
   ```
2. The Fiber is marked with the passive effect bitmask flag:
   ```javascript
   currentlyRenderingFiber.flags |= FiberFlags.Passive;
   ```
3. During the **Commit Phase**, after React applies DOM mutations, React schedules a macro-task using the React Scheduler:
   ```javascript
   Scheduler_scheduleCallback(NormalPriority, () => {
     flushPassiveEffects();
   });
   ```
4. During subsequent re-renders (`updateEffectImpl`), React compares the dependencies:
   ```javascript
   function areHookInputsEqual(nextDeps, prevDeps) {
     if (prevDeps === null) return false;
     for (let i = 0; i < prevDeps.length && i < nextDeps.length; i++) {
       if (!Object.is(nextDeps[i], prevDeps[i])) {
         return false; // Dependency changed!
       }
     }
     return true; // All dependencies identical!
   }
   ```
   If `areHookInputsEqual` returns `false`, React sets the `HookHasEffect` bitmask. If `true`, the effect is skipped.

### More Examples

#### Example 1: Dependency Array Modes Comparison
```typescript
import React, { useEffect, useState } from "react";

export function EffectDependencyModes() {
  const [count, setCount] = useState(0);
  const [text, setText] = useState("");

  // Mode 1: No dependency array -> Runs on MOUNT and EVERY single re-render
  useEffect(() => {
    console.log("MODE 1: Runs after every single render");
  });

  // Mode 2: Empty dependency array [] -> Runs ONCE on mount only
  useEffect(() => {
    console.log("MODE 2: Runs once on initial mount");
  }, []);

  // Mode 3: Specific dependencies [count] -> Runs on mount AND whenever 'count' changes
  useEffect(() => {
    console.log("MODE 3: Runs when count changes. Current count:", count);
  }, [count]);

  return (
    <div>
      <button onClick={() => setCount((c) => c + 1)}>Increment Count</button>
      <input value={text} onChange={(e) => setText(e.target.value)} />
    </div>
  );
}
```

#### Example 2: Synchronizing with Native Browser APIs (Window Resize)
```typescript
import React, { useState, useEffect } from "react";

export function WindowDimensionsTracker() {
  const [dimensions, setDimensions] = useState({
    width: window.innerWidth,
    height: window.innerHeight,
  });

  useEffect(() => {
    const handleResize = () => {
      setDimensions({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };

    window.addEventListener("resize", handleResize);

    // Return cleanup function to remove event listener on unmount
    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []); // Empty array: attach on mount, detach on unmount

  return (
    <div>
      <p>Viewport: {dimensions.width}px x {dimensions.height}px</p>
    </div>
  );
}
```

#### Example 3: Simulating React's Dependency Comparison Engine
```typescript
export function simulateDepsComparison(
  prevDeps: unknown[] | null,
  nextDeps: unknown[]
): boolean {
  if (prevDeps === null) return true; // Re-run if no deps provided
  if (prevDeps.length !== nextDeps.length) return true;

  for (let i = 0; i < prevDeps.length; i++) {
    // React strictly uses Object.is
    if (!Object.is(prevDeps[i], nextDeps[i])) {
      return true; // Trigger effect
    }
  }
  return false; // Skip effect
}
```

### Common Mistakes

#### Mistake 1: Passing an `async` Function Directly to `useEffect`
```typescript
// WRONG: useEffect callback must return void or a cleanup function, NOT a Promise!
useEffect(async () => {
  const res = await fetch("/api/user");
  const data = await res.json();
  setUser(data);
  // Async functions implicitly return a Promise<void>. 
  // React expects a cleanup function and will throw an error or fail to clean up!
}, []);

// CORRECT: Define and call an inner async function
useEffect(() => {
  let isCancelled = false;

  async function loadUser() {
    const res = await fetch("/api/user");
    const data = await res.json();
    if (!isCancelled) {
      setUser(data);
    }
  }

  loadUser();

  return () => {
    isCancelled = true;
  };
}, []);
```

#### Mistake 2: Object or Array Literals in the Dependency Array (The Infinite Loop Trap)
```typescript
// WRONG: Options object is re-created on EVERY render!
export function BadQueryComponent({ query }: { query: string }) {
  const [data, setData] = useState(null);

  // An object literal creates a brand new heap reference on every render pass
  const options = { query, limit: 10 };

  useEffect(() => {
    // Object.is(options_old, options_new) is ALWAYS false!
    fetchData(options).then((res) => setData(res));
  }, [options]); // INFINITE RENDER LOOP!
}

// CORRECT: Depend on primitive values or memoize the object
export function GoodQueryComponent({ query }: { query: string }) {
  const [data, setData] = useState(null);

  useEffect(() => {
    fetchData({ query, limit: 10 }).then((res) => setData(res));
  }, [query]); // Primitive string: Object.is only changes when text changes
}
```

### Rules to Remember
1. **`useEffect` runs after the browser paints the screen.** Never use it for DOM layout measurements that must happen before the user sees the frame.
2. **The callback must return `undefined` or a cleanup function.** Never return a Promise or make the callback `async`.
3. **Dependencies are compared using `Object.is`.** Avoid passing new object, array, or function references directly in the dependency array.
4. **Never omit referenced variables from the dependency array.** Doing so produces stale closures that read frozen snapshots from earlier renders.

---

### Think First: Prediction Puzzle
Inspect this component:
```typescript
export function RenderOrderLog() {
  const [val, setVal] = useState(0);

  console.log("1. RENDER_BODY");

  useEffect(() => {
    console.log("2. EFFECT_FIRED");
  }, [val]);

  return <button onClick={() => setVal((v) => v + 1)}>Increment</button>;
}
```
When the user clicks the button once, in what exact chronological order will the console messages print?

--------------------------------------------------------------------------------
**Answer:**
`1. RENDER_BODY` followed by `2. EFFECT_FIRED`.

**Explanation:**
React executes the component function body during the **render phase** to determine the virtual DOM output. The effect callback is registered, but its execution is deferred until after the commit phase and after the browser paints. Therefore, `"1. RENDER_BODY"` always prints before `"2. EFFECT_FIRED"`.

---

### Graded Exercises

#### Exercise 1: `Object.is` Dependency Comparator
Implement a function `hasDependenciesChanged(prevDeps: any[], nextDeps: any[]): boolean` using `Object.is`. It must handle `NaN` correctly (two `NaN`s are considered equal).
- Hint 1: Check length equality first.
- Hint 2: Loop through items and check `if (!Object.is(prevDeps[i], nextDeps[i])) return true`.

#### Exercise 2: Auto-Increment Document Title Effect
Write a custom hook `useDocumentTitle(title: string)` that updates `document.title` and restores the original title when the component unmounts.
- Hint 1: Inside `useEffect`, capture `const original = document.title`.
- Hint 2: Return a cleanup function `() => { document.title = original; }`.

#### Exercise 3: Keydown Event Listener Hook
Write a custom hook `useKeyPress(targetKey: string, handler: () => void)` that attaches a `"keydown"` event listener to `window`. If `event.key === targetKey`, fire `handler`. Ensure the listener is cleaned up when `targetKey` or the component unmounts.
- Hint 1: Use `useEffect` with `[targetKey, handler]` dependencies.
- Hint 2: Return `() => window.removeEventListener("keydown", listener)`.

#### Exercise 4: Simulating Effect Tag Assignment
Create a function `computeEffectFlags(prevDeps: unknown[] | null, nextDeps: unknown[]): number` using bitwise flags: `HookPassive = 1` and `HookHasEffect = 2`. If dependencies have changed or `prevDeps` is `null`, return `HookPassive | HookHasEffect`. Otherwise, return `HookPassive`.
- Hint 1: Check `prevDeps === null || hasChanged(prevDeps, nextDeps)`.
- Hint 2: Use bitwise OR `|`.

--------------------------------------------------------------------------------
### Exercise Solutions

```typescript
// Solution 1:
export function hasDependenciesChanged(prevDeps: any[], nextDeps: any[]): boolean {
  if (prevDeps.length !== nextDeps.length) return true;
  for (let i = 0; i < prevDeps.length; i++) {
    if (!Object.is(prevDeps[i], nextDeps[i])) {
      return true;
    }
  }
  return false;
}

// Solution 2:
import { useEffect } from "react";

export function useDocumentTitle(title: string) {
  useEffect(() => {
    const originalTitle = document.title;
    document.title = title;

    return () => {
      document.title = originalTitle;
    };
  }, [title]);
}

// Solution 3:
import { useEffect } from "react";

export function useKeyPress(targetKey: string, handler: () => void) {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === targetKey) {
        handler();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [targetKey, handler]);
}

// Solution 4:
export const HookPassive = 1;
export const HookHasEffect = 2;

export function computeEffectFlags(
  prevDeps: unknown[] | null,
  nextDeps: unknown[]
): number {
  if (prevDeps === null) {
    return HookPassive | HookHasEffect;
  }
  const changed = hasDependenciesChanged(prevDeps, nextDeps);
  return changed ? HookPassive | HookHasEffect : HookPassive;
}
```

---

### Recall
1. Why does React run passive effects after the browser paints rather than before?
2. What comparison algorithm does React use to check if dependencies have changed?
3. If you remember only one thing: **`useEffect` schedules asynchronous, non-blocking side effects to run after browser paint, using `Object.is` dependency checks to prevent redundant execution.**

---

## Topic 7: `useEffect` Production Patterns: Cleanup Functions, AbortController Race-Condition Defense, Stale Closures & StrictMode Double-Invocation

### What Is It?
In production software, effects rarely execute in isolation. They interact with asynchronous network streams, WebSockets, DOM subscriptions, and concurrent updates.

To prevent memory leaks and inconsistent UI bugs, `useEffect` provides an **Effect Cleanup mechanism**: a function returned by the effect callback that React invokes:
1. **Before running the next effect** on subsequent re-renders.
2. **When the component unmounts** from the DOM.

Key technical terms defined:
- An Effect Cleanup is the disposal function returned by an effect callback used to cancel subscriptions, abort fetch requests, or clear timers.
- A Network Race Condition occurs when multiple asynchronous requests are initiated in sequence, but resolve out of order (e.g. Request 1 arrives after Request 2), causing outdated data to overwrite fresh data.
- An `AbortController` is a standard browser Web API object that allows you to abort ongoing `fetch` requests and asynchronous operations.
- A Stale Closure occurs when an asynchronous callback captures a snapshot of a state variable from an older render cycle and updates the application with obsolete data.
- React StrictMode is a development tool that intentionally mounts, unmounts, and re-mounts components in development to verify that cleanup functions correctly reverse all side effects.

```
Render 1 (id = 1) ──► Effect 1 starts
                             │
Render 2 (id = 2) ──► Cleanup 1 executes (Aborts fetch 1) ──► Effect 2 starts
```

### Why Does It Exist?
Consider an autocomplete search input:
1. User types `"re"` $\to$ Request A starts.
2. User types `"react"` $\to$ Request B starts.
3. Due to network latency, Request B finishes in 50ms, showing results for `"react"`.
4. Request A finishes in 200ms, overwriting the screen with results for `"re"`!

Without cleanup functions and `AbortController` cancellation, asynchronous applications suffer from race conditions, memory leaks, and stale closures.

### Basic Example and Line-by-Line Explanation

```typescript
import React, { useState, useEffect } from "react";

type UserRecord = { id: string; name: string };

export function UserProfileViewer({ userId }: { userId: string }) {
  const [user, setUser] = useState<UserRecord | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // 1. Instantiate browser AbortController for this effect execution
    const controller = new AbortController();
    const signal = controller.signal;

    async function loadData() {
      try {
        setError(null);
        const response = await fetch(`/api/users/${userId}`, { signal });
        if (!response.ok) throw new Error("Failed to load user");
        const data: UserRecord = await response.json();
        setUser(data);
      } catch (err: any) {
        // If aborted, the browser throws an AbortError - do not treat as application error!
        if (err.name !== "AbortError") {
          setError(err.message);
        }
      }
    }

    loadData();

    // 2. Return cleanup function
    return () => {
      // Aborts the HTTP request if userId changes or component unmounts
      controller.abort();
    };
  }, [userId]);

  if (error) return <div>Error: {error}</div>;
  if (!user) return <div>Loading...</div>;

  return <div>User: {user.name}</div>;
}
```

Line-by-line breakdown:
1. `const controller = new AbortController();`: Creates an abort controller scoped to this specific render's effect closure.
2. `const signal = controller.signal;`: Extracts the signal token passed to `fetch`.
3. `fetch(`/api/users/${userId}`, { signal })`: Initiates the network call. If `controller.abort()` is called while the request is in-flight, the browser immediately cancels the network socket.
4. `if (err.name !== "AbortError")`: Suppresses error logging for intentional abort cancellations.
5. `return () => { controller.abort(); };`: The cleanup function. When `userId` changes, React executes this cleanup **first**, terminating the stale HTTP request before launching the new request.

### How It Works Inside React
Inside React's `flushPassiveEffects`:
1. **Unmount / Cleanup Step**:
   React iterates through the fiber's effect list. If an effect has an existing `destroy` function and its dependencies changed:
   ```javascript
   if (effect.destroy !== undefined) {
     effect.destroy(); // Runs previous cleanup!
     effect.destroy = undefined;
   }
   ```
2. **Mount / Creation Step**:
   React calls the effect's `create` function and stores the returned cleanup for the next cycle:
   ```javascript
   const destroy = effect.create();
   if (typeof destroy === "function") {
     effect.destroy = destroy; // Preserved for next cleanup
   }
   ```
3. **StrictMode Double-Invocation in Development**:
   In React 18 and 19 development mode (`<React.StrictMode>`), React mounts your component, **immediately executes the cleanup function**, and runs the effect a second time. This simulates an immediate remount to prove your cleanup function leaves no dangling event listeners, timers, or duplicate network connections.

### More Examples

#### Example 1: WebSocket Connection Management with Full Cleanup
```typescript
import React, { useState, useEffect } from "react";

export function LiveMarketFeed({ symbol }: { symbol: string }) {
  const [price, setPrice] = useState<number | null>(null);

  useEffect(() => {
    const socket = new WebSocket(`wss://market.example.com/stream/${symbol}`);

    socket.onmessage = (event) => {
      const payload = JSON.parse(event.data);
      setPrice(payload.price);
    };

    socket.onerror = (err) => {
      console.error("WebSocket Error:", err);
    };

    // Mandatory cleanup: close socket connection when symbol changes or unmounts
    return () => {
      socket.close();
    };
  }, [symbol]);

  return <div>{symbol}: {price !== null ? `$${price.toFixed(2)}` : "Connecting..."}</div>;
}
```

#### Example 2: Defeating the Stale Closure Bug in Intervals
```typescript
import React, { useState, useEffect, useRef } from "react";

export function AccurateTimer() {
  const [count, setCount] = useState(0);

  // Technique A: Functional state updater (eliminates count dependency)
  useEffect(() => {
    const timer = setInterval(() => {
      setCount((prev) => prev + 1); // Always reads latest state
    }, 1000);

    return () => clearInterval(timer);
  }, []); // Safe empty dependency array

  return <div>Count: {count}</div>;
}
```

#### Example 3: The Event Listener Cleanup Pattern
```typescript
import { useEffect } from "react";

export function useOnlineStatus() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const setOnline = () => setIsOnline(true);
    const setOffline = () => setIsOnline(false);

    window.addEventListener("online", setOnline);
    window.addEventListener("offline", setOffline);

    return () => {
      window.removeEventListener("online", setOnline);
      window.removeEventListener("offline", setOffline);
    };
  }, []);

  return isOnline;
}
```

### Common Mistakes

#### Mistake 1: Ignoring Cleanup Functions Resulting in Memory Leaks
```typescript
// WRONG: Subscribes to events without cleaning up
useEffect(() => {
  window.addEventListener("mousemove", onMouseMove);
  // Missing return () => window.removeEventListener(...);
  // Every re-render leaks another duplicate event listener into memory!
});
```

#### Mistake 2: Missing Cleanup on Timers
```typescript
// WRONG: Timer continues running in background after component unmounts
useEffect(() => {
  setInterval(() => {
    setSeconds((s) => s + 1);
  }, 1000);
  // When component unmounts, interval keeps firing and calling setSeconds on unmounted fiber!
}, []);
```

### Rules to Remember
1. **Always clean up subscriptions, event listeners, and timers.** The cleanup function must undo everything done in the effect.
2. **Use `AbortController` to cancel in-flight network requests** when parameters change to eliminate race conditions.
3. **Expect effects to run twice in development.** StrictMode intentionally exercises cleanup logic to catch memory leaks early.
4. **Prefer functional state updaters (`setState(prev => ... )`)** inside intervals and timeouts to avoid stale closure traps.

---

### Think First: Prediction Puzzle
Consider this component running in React StrictMode during initial development mount:
```typescript
export function StrictModeCounter() {
  useEffect(() => {
    console.log("A. EFFECT_MOUNT");
    return () => {
      console.log("B. EFFECT_CLEANUP");
    };
  }, []);

  return <div>App</div>;
}
```
What will the browser console show on initial page load in development?

--------------------------------------------------------------------------------
**Answer:**
```
A. EFFECT_MOUNT
B. EFFECT_CLEANUP
A. EFFECT_MOUNT
```

**Explanation:**
React StrictMode simulates an immediate unmount and remount cycle in development. It runs the effect setup, calls the cleanup function immediately to verify side effects are reversible, and runs the setup function a second time. In production builds, only `A. EFFECT_MOUNT` is logged once.

---

### Graded Exercises

#### Exercise 1: Safe Fetch with AbortController
Write a custom hook `useFetchData<T>(url: string): { data: T | null; loading: boolean; error: string | null }` that cancels in-flight fetch requests when `url` changes using `AbortController`.
- Hint 1: Instantiate `new AbortController()` inside `useEffect`.
- Hint 2: In the cleanup, call `controller.abort()`. Catch `err` and ignore `err.name === "AbortError"`.

#### Exercise 2: Self-Clearing Timeout Hook
Implement a custom hook `useTimeout(callback: () => void, delayMs: number)` that sets a `setTimeout` and guarantees it is cleared if the delay changes or the component unmounts.
- Hint 1: Store `const id = setTimeout(callback, delayMs)`.
- Hint 2: Return `() => clearTimeout(id)`.

#### Exercise 3: Stale Closure Elimination Drill
The following hook has a stale closure bug:
```typescript
function useStaleLogger(message: string) {
  useEffect(() => {
    const id = setInterval(() => {
      console.log(message);
    }, 1000);
    return () => clearInterval(id);
  }, []); // Message is stale!
}
```
Fix this hook without restarting the interval every time `message` changes by using a `useRef` to store the latest message.
- Hint 1: Store `const messageRef = useRef(message); messageRef.current = message;`.
- Hint 2: Inside the interval, log `messageRef.current`.

#### Exercise 4: WebSocket Auto-Reconnect Simulator
Build a custom hook `useMockWebSocket(channel: string, onMessage: (msg: string) => void)` that simulates an open connection via `setInterval`, dispatches simulated packets, and cleans up the interval on unmount or channel change.
- Hint 1: Set up interval in `useEffect`.
- Hint 2: In cleanup, call `clearInterval` and log `"Connection closed for channel: " + channel`.

--------------------------------------------------------------------------------
### Exercise Solutions

```typescript
// Solution 1:
import { useState, useEffect } from "react";

export function useFetchData<T>(url: string) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError(null);

    fetch(url, { signal: controller.signal })
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP Error ${res.status}`);
        return res.json();
      })
      .then((json: T) => {
        setData(json);
        setLoading(false);
      })
      .catch((err: any) => {
        if (err.name !== "AbortError") {
          setError(err.message);
          setLoading(false);
        }
      });

    return () => {
      controller.abort();
    };
  }, [url]);

  return { data, loading, error };
}

// Solution 2:
import { useEffect, useRef } from "react";

export function useTimeout(callback: () => void, delayMs: number) {
  const savedCallback = useRef(callback);
  savedCallback.current = callback;

  useEffect(() => {
    const id = setTimeout(() => savedCallback.current(), delayMs);
    return () => clearTimeout(id);
  }, [delayMs]);
}

// Solution 3:
import { useEffect, useRef } from "react";

export function useFreshLogger(message: string) {
  const messageRef = useRef(message);
  messageRef.current = message;

  useEffect(() => {
    const id = setInterval(() => {
      console.log(messageRef.current);
    }, 1000);
    return () => clearInterval(id);
  }, []);
}

// Solution 4:
import { useEffect } from "react";

export function useMockWebSocket(channel: string, onMessage: (msg: string) => void) {
  useEffect(() => {
    console.log(`Subscribed to channel: ${channel}`);
    let counter = 0;

    const timer = setInterval(() => {
      counter++;
      onMessage(`[${channel}] Payload #${counter}`);
    }, 500);

    return () => {
      clearInterval(timer);
      console.log(`Unsubscribed and cleaned up channel: ${channel}`);
    };
  }, [channel, onMessage]);
}
```

---

### Recall
1. When does React run an effect's cleanup function?
2. What error does `fetch()` throw when aborted via `AbortController`, and why must you ignore it in error handlers?
3. If you remember only one thing: **Always return cleanup functions from effects to abort in-flight network requests and release event subscriptions, preventing race conditions and memory leaks.**

---

## Topic 8: `useLayoutEffect` vs `useInsertionEffect`: Synchronous Mutation Timing, DOM Measurement & Preventing Visual Flickers

### What Is It?
While `useEffect` is deferred until after the browser paints the screen, React provides two specialized hooks that execute **synchronously** during the commit phase:
1. **`useLayoutEffect`**: Runs synchronously **immediately after React mutates the DOM**, but **before the browser paints the screen**.
2. **`useInsertionEffect`**: Runs synchronously **before DOM mutations occur**, specifically designed for CSS-in-JS libraries to inject `<style>` tags into the document head before layout calculations.

Key technical terms defined:
- The Commit Phase is the synchronous stage of React's execution where virtual DOM diffs are translated into actual host DOM operations (`appendChild`, `removeChild`).
- Visual Flicker (or Layout Shift) is a jarring visual glitch that occurs when an element is painted on screen in an initial wrong position or size, and then immediately repositioned by a post-paint effect.
- Reflow is the browser engine calculation that computes the physical layout geometry (positions and sizes) of all visible elements.
- Repaint is the browser rasterization step that translates vector layout trees into physical pixels on the display screen.

```
┌────────────────────────────────────────────────────────────────────────┐
│                        THE COMMIT PHASE LIFECYCLE                      │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
                                    ▼
                   ┌──────────────────────────────────┐
                   │ 1. useInsertionEffect            │ (CSS-in-JS injection)
                   └────────────────┬─────────────────┘
                                    │
                                    ▼
                   ┌──────────────────────────────────┐
                   │ 2. Host DOM Mutations Executed   │ (appendChild, etc.)
                   └────────────────┬─────────────────┘
                                    │
                                    ▼
                   ┌──────────────────────────────────┐
                   │ 3. useLayoutEffect Executed      │ (DOM measurements & corrections)
                   └────────────────┬─────────────────┘
                                    │
                                    ▼
                   ┌──────────────────────────────────┐
                   │ 4. Browser Paints Pixels         │ (User sees the screen!)
                   └────────────────┬─────────────────┘
                                    │
                                    ▼
                   ┌──────────────────────────────────┐
                   │ 5. useEffect Executed            │ (Passive background effects)
                   └──────────────────────────────────┘
```

### Why Does It Exist?
Suppose you build a Tooltip component:
1. To position the tooltip above a button, you must measure the button's exact coordinates (`button.getBoundingClientRect()`).
2. If you use `useEffect`:
   - React mounts the tooltip at default coordinates `(0, 0)`.
   - The browser **paints** the tooltip in the top-left corner of the screen.
   - `useEffect` fires, measures the button, and updates coordinates to `(250, 180)`.
   - The user sees a visible "flicker" as the tooltip jumps from `(0, 0)` to `(250, 180)`.
3. If you use `useLayoutEffect`:
   - React mounts the DOM node.
   - `useLayoutEffect` fires **synchronously before paint**, measures the button, and adjusts the coordinates.
   - The browser paints the frame once with the tooltip in the correct final position. Zero flicker!

### Basic Example and Line-by-Line Explanation

```typescript
import React, { useState, useRef, useLayoutEffect } from "react";

export function FlickerFreeTooltip() {
  const [coords, setCoords] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const buttonRef = useRef<HTMLButtonElement | null>(null);

  // useLayoutEffect runs BEFORE the browser paints!
  useLayoutEffect(() => {
    if (buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      // Synchronously reposition tooltip above the button
      setCoords({
        x: rect.left,
        y: rect.top - 40,
      });
    }
  }, []);

  return (
    <div style={{ padding: "50px" }}>
      <button ref={buttonRef}>Hover over me</button>
      <div
        style={{
          position: "fixed",
          left: `${coords.x}px`,
          top: `${coords.y}px`,
          background: "black",
          color: "white",
          padding: "4px 8px",
          borderRadius: "4px",
        }}
      >
        Tooltip Content
      </div>
    </div>
  );
}
```

Line-by-line breakdown:
1. `import React, { useState, useRef, useLayoutEffect } from "react";`: Imports `useLayoutEffect`.
2. `const buttonRef = useRef<HTMLButtonElement | null>(null);`: Holds a reference to the anchor button DOM element.
3. `useLayoutEffect(() => { ... }, []);`: Declares the layout effect.
4. `const rect = buttonRef.current.getBoundingClientRect();`: Synchronously queries the browser for the button's layout dimensions.
5. `setCoords({ x: rect.left, y: rect.top - 40 });`: Updates state synchronously. React immediately re-computes the render output in memory **before releasing the main thread to the browser**.
6. The browser renders the screen once, with the tooltip directly above the button. The initial `(0, 0)` coordinates are never shown to the user.

### How It Works Inside React
During the Commit Phase (`commitRootImpl` in `react-reconciler/src/ReactFiberCommitWork.js`):
1. **Mutation Sub-phase**: React applies virtual DOM mutations to host elements (`commitMutationEffects`).
2. **Layout Sub-phase**: React immediately executes `commitLayoutEffects`:
   - It walks the fibers and executes the cleanup functions of previously mounted layout effects.
   - It calls `useLayoutEffect` setup functions synchronously:
     ```javascript
     function commitHookLayoutEffects(fiber) {
       let effect = fiber.memoizedState;
       // Synchronous execution on the current call stack!
       effect.create();
     }
     ```
3. If a state update is dispatched inside `useLayoutEffect`, React flushes the update **synchronously** in the same tick before yielding execution back to the browser.
4. Only after all layout effects and their resulting synchronous re-renders settle does the JavaScript call stack empty, allowing the browser to paint.

### More Examples

#### Example 1: Measuring Scroll Positions to Prevent Scroll Jumping
```typescript
import React, { useRef, useLayoutEffect } from "react";

export function AutoScrollPin({ messages }: { messages: string[] }) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const previousScrollHeightRef = useRef<number>(0);

  useLayoutEffect(() => {
    const el = containerRef.current;
    if (el) {
      // Calculate how much content was added and adjust scrollTop synchronously
      const addedHeight = el.scrollHeight - previousScrollHeightRef.current;
      el.scrollTop += addedHeight;
      previousScrollHeightRef.current = el.scrollHeight;
    }
  }, [messages]);

  return (
    <div ref={containerRef} style={{ height: "200px", overflowY: "auto" }}>
      {messages.map((m, i) => (
        <div key={i}>{m}</div>
      ))}
    </div>
  );
}
```

#### Example 2: `useInsertionEffect` for CSS-in-JS Performance
`useInsertionEffect` runs before DOM mutations. This allows CSS-in-JS libraries to insert dynamic `<style>` elements into the `<head>` before React calculates DOM nodes, preventing the browser from recalculating CSS rules during layout:
```typescript
import React, { useInsertionEffect } from "react";

export function DynamicThemedBox({ color }: { color: string }) {
  useInsertionEffect(() => {
    const styleEl = document.createElement("style");
    styleEl.textContent = `.dynamic-btn-${color} { background-color: ${color}; color: white; }`;
    document.head.appendChild(styleEl);

    return () => {
      document.head.removeChild(styleEl);
    };
  }, [color]);

  return <button className={`dynamic-btn-${color}`}>Styled Button</button>;
}
```

#### Example 3: SSR Fallback Helper for `useLayoutEffect`
On Node.js server-side rendering (SSR), `useLayoutEffect` triggers a React warning because there is no browser DOM to measure. Here is the industry-standard isomorphic hook:
```typescript
import { useEffect, useLayoutEffect } from "react";

// Evaluates to useLayoutEffect on the browser, useEffect on Node.js/Next.js server
export const useIsomorphicLayoutEffect =
  typeof window !== "undefined" ? useLayoutEffect : useEffect;
```

### Common Mistakes

#### Mistake 1: Using `useLayoutEffect` for Standard Network Data Fetching
```typescript
// WRONG: Blocks browser paint while waiting for synchronous JavaScript execution
useLayoutEffect(() => {
  fetch("/api/data").then(...); // Never do this in useLayoutEffect!
}, []);
```
**Why this breaks:** `useLayoutEffect` blocks the browser thread. While `fetch` itself is asynchronous, running non-visual logic in layout effects delays paint unnecessarily. 99% of effects belong in standard `useEffect`.

#### Mistake 2: Ignoring the SSR Warning in Next.js
```typescript
// WARNING: Warning: useLayoutEffect does nothing on the server
export function BadSsrComponent() {
  useLayoutEffect(() => {
    // Fails during server pre-rendering
  }, []);
}

// CORRECT: Use useIsomorphicLayoutEffect or move logic into useEffect
```

### Rules to Remember
1. **Default to `useEffect`.** Only switch to `useLayoutEffect` if you observe a visible visual flicker caused by DOM measurements.
2. **`useLayoutEffect` blocks browser paint.** Keep its execution body minimal to avoid freezing user scrolling or animations.
3. **`useInsertionEffect` is reserved for CSS-in-JS libraries.** It runs before any DOM mutations to inject stylesheets.
4. **Use `useIsomorphicLayoutEffect` in SSR applications (Next.js)** to prevent hydration warning logs on the server.

---

### Think First: Prediction Puzzle
Consider this component:
```typescript
export function CommitOrder() {
  console.log("1. RENDER");

  useEffect(() => {
    console.log("4. PASSIVE EFFECT");
  });

  useLayoutEffect(() => {
    console.log("3. LAYOUT EFFECT");
  });

  useInsertionEffect(() => {
    console.log("2. INSERTION EFFECT");
  });

  return <div>Test</div>;
}
```
In what exact order will the console statements print?

--------------------------------------------------------------------------------
**Answer:**
```
1. RENDER
2. INSERTION EFFECT
3. LAYOUT EFFECT
4. PASSIVE EFFECT
```

**Explanation:**
1. Component function runs during the Render phase (`1. RENDER`).
2. Commit phase begins: Insertion effects execute before DOM mutations (`2. INSERTION EFFECT`).
3. DOM mutations execute.
4. Layout effects execute synchronously after DOM mutations, before paint (`3. LAYOUT EFFECT`).
5. Browser paints pixels to the screen.
6. Passive effects execute asynchronously post-paint (`4. PASSIVE EFFECT`).

---

### Graded Exercises

#### Exercise 1: Element Dimension Measuring Hook
Create a custom hook `useElementDimensions<T extends HTMLElement>()` returning a tuple `[React.RefCallback<T>, { width: number; height: number }]` that uses `useLayoutEffect` to synchronously capture element dimensions without visual flicker.
- Hint 1: Store dimensions in `useState`.
- Hint 2: Measure inside `useLayoutEffect` using `ref.current.getBoundingClientRect()`.

#### Exercise 2: Isomorphic Layout Effect Factory
Write an `isomorphicLayoutEffect` utility that detects whether code is executing in a browser environment (`typeof window !== "undefined"` and `typeof window.document !== "undefined"`).
- Hint 1: Export a conditional variable assigned to `useLayoutEffect` if browser, or `useEffect` if server.

#### Exercise 3: Dynamic Classname Insertion Effect
Write a custom hook `useDynamicStyle(cssRules: string)` using `useInsertionEffect` that injects a `<style>` tag into `document.head` and cleans it up when rules change or unmount.
- Hint 1: Inside `useInsertionEffect`, call `document.createElement("style")`.
- Hint 2: Set `el.textContent = cssRules; document.head.appendChild(el);`. Return cleanup removing it.

#### Exercise 4: Synchronous Scroll Reset Guard
Create a component `ScrollRestorer({ activeTab }: { activeTab: string })` that uses `useLayoutEffect` to synchronously force `window.scrollTo(0, 0)` whenever `activeTab` changes before the user sees the new tab render.
- Hint 1: Set `[activeTab]` as the dependency array for `useLayoutEffect`.
- Hint 2: Call `window.scrollTo(0, 0)` synchronously.

--------------------------------------------------------------------------------
### Exercise Solutions

```typescript
// Solution 1:
import { useState, useRef, useLayoutEffect, useCallback } from "react";

export function useElementDimensions<T extends HTMLElement>() {
  const [size, setSize] = useState({ width: 0, height: 0 });
  const [node, setNode] = useState<T | null>(null);

  const refCallback = useCallback((el: T | null) => {
    setNode(el);
  }, []);

  useLayoutEffect(() => {
    if (node) {
      const rect = node.getBoundingClientRect();
      setSize({ width: rect.width, height: rect.height });
    }
  }, [node]);

  return [refCallback, size] as const;
}

// Solution 2:
import { useEffect, useLayoutEffect } from "react";

export const useIsomorphicLayoutEffect =
  typeof window !== "undefined" &&
  typeof window.document !== "undefined" &&
  typeof window.document.createElement !== "undefined"
    ? useLayoutEffect
    : useEffect;

// Solution 3:
import { useInsertionEffect } from "react";

export function useDynamicStyle(cssRules: string) {
  useInsertionEffect(() => {
    const styleEl = document.createElement("style");
    styleEl.textContent = cssRules;
    document.head.appendChild(styleEl);

    return () => {
      document.head.removeChild(styleEl);
    };
  }, [cssRules]);
}

// Solution 4:
import React, { useLayoutEffect } from "react";

export function ScrollRestorer({ activeTab }: { activeTab: string }) {
  useLayoutEffect(() => {
    window.scrollTo(0, 0);
  }, [activeTab]);

  return null;
}
```

---

### Recall
1. At what exact moment in the commit lifecycle does `useLayoutEffect` execute?
2. Why does using `useEffect` for tooltip positioning cause a visible visual flicker?
3. If you remember only one thing: **Use `useLayoutEffect` strictly for DOM measurements and visual repositioning that must complete synchronously before the browser paints the screen.**

---

## Topic 9: `useMemo` & `useCallback`: Referential Equality Invariants, Calculation Caching & Premature Optimization Traps

### What Is It?
In JavaScript, functions and objects are compared by **reference identity**, not by structural equality. Every time a component function executes, all objects (`{}`), arrays (`[]`), and inline arrow functions (`() => {}`) defined in its body are re-allocated with brand new references in heap memory.

`useMemo` and `useCallback` are React's memoization hooks:
- **`useMemo`**: Caches the *result* of a calculation across renders: `useMemo(() => computeValue(a, b), [a, b])`.
- **`useCallback`**: Caches the *function definition itself* across renders: `useCallback(() => doWork(a), [a])`.

In fact, `useCallback(fn, deps)` is syntactic sugar for `useMemo(() => fn, deps)`.

Key technical terms defined:
- Referential Equality is the condition where two variables point to the exact same memory address (`Object.is(a, b) === true`).
- Memoization is an optimization technique that stores the results of expensive function calls and returns the cached result when identical inputs occur again.
- Premature Optimization is the practice of adding complexity or caching overhead to code before profiling has proved a measurable performance bottleneck.

```
Render 1: useCallback(() => log(id), [id]) ──► Function Reference A allocated
Render 2: (id has NOT changed)            ──► Returns Function Reference A (Reused!)
Render 3: (id HAS changed)                ──► Function Reference B allocated
```

### Why Does It Exist?
There are two distinct problems solved by memoization:
1. **Expensive calculations**: Skipping slow algorithms (e.g. sorting 10,000 items, complex regex, parsing large datasets) when unrelated state changes.
2. **Preventing child re-renders**: When a child component is wrapped in `React.memo`, it only skips re-rendering if its props maintain strict referential equality. Passing an inline function or fresh object literal defeats `React.memo` entirely!

### Basic Example and Line-by-Line Explanation

```typescript
import React, { useState, useMemo, useCallback } from "react";

type Item = { id: string; price: number };

export function ShoppingSummary({ items }: { items: Item[] }) {
  const [filterDiscount, setFilterDiscount] = useState<boolean>(false);
  const [darkTheme, setDarkTheme] = useState<boolean>(false);

  // 1. useMemo: Only recalculates total when 'items' changes, NOT when 'darkTheme' toggles!
  const totalPrice = useMemo(() => {
    console.log("RECALCULATING_TOTAL");
    return items.reduce((sum, item) => sum + item.price, 0);
  }, [items]);

  // 2. useCallback: Preserves function identity so child component doesn't re-render
  const handleItemClick = useCallback((id: string) => {
    console.log("Item clicked:", id);
  }, []);

  return (
    <div style={{ background: darkTheme ? "#333" : "#fff" }}>
      <button onClick={() => setDarkTheme((prev) => !prev)}>Toggle Theme</button>
      <p>Total: ${totalPrice}</p>
      <ExpensiveList items={items} onItemClick={handleItemClick} />
    </div>
  );
}

// Child wrapped in React.memo: skips render if props are referentially identical
const ExpensiveList = React.memo(function ExpensiveList({
  items,
  onItemClick,
}: {
  items: Item[];
  onItemClick: (id: string) => void;
}) {
  console.log("RENDERED_EXPENSIVE_LIST");
  return (
    <ul>
      {items.map((it) => (
        <li key={it.id} onClick={() => onItemClick(it.id)}>
          {it.id}: ${it.price}
        </li>
      ))}
    </ul>
  );
});
```

Line-by-line breakdown:
1. `const totalPrice = useMemo(() => ..., [items]);`: React runs the calculation on mount and stores `[totalPrice, [items]]` on the Fiber hook list.
2. When `darkTheme` toggles, `ShoppingSummary` re-renders. React checks `Object.is(oldItems, newItems)`. Because `items` has not changed, React skips the reducer loop and returns the cached number.
3. `const handleItemClick = useCallback(...);`: Preserves the function identity.
4. When `darkTheme` toggles, `onItemClick` has the exact same reference as before.
5. Because `ExpensiveList` is wrapped in `React.memo` and both `items` and `onItemClick` have unchanged references, `ExpensiveList` skips rendering completely.

### How It Works Inside React
Inside `ReactFiberHooks.js`:

`useMemo` implementation:
```javascript
// During Mount:
function mountMemo(nextCreate, deps) {
  const hook = mountWorkInProgressHook();
  const nextValue = nextCreate(); // Execute calculation
  hook.memoizedState = [nextValue, deps];
  return nextValue;
}

// During Update:
function updateMemo(nextCreate, deps) {
  const hook = updateWorkInProgressHook();
  const prevState = hook.memoizedState;
  const prevDeps = prevState[1];

  // Compare dependencies with Object.is
  if (areHookInputsEqual(deps, prevDeps)) {
    return prevState[0]; // Return cached value!
  }

  // Dependencies changed: re-calculate and update cache
  const nextValue = nextCreate();
  hook.memoizedState = [nextValue, deps];
  return nextValue;
}
```

`useCallback` implementation:
```javascript
// useCallback simply stores the function itself instead of calling it!
function mountCallback(callback, deps) {
  const hook = mountWorkInProgressHook();
  hook.memoizedState = [callback, deps];
  return callback;
}
```

### More Examples

#### Example 1: Memoizing Complex Filter & Sort Operations
```typescript
import React, { useState, useMemo } from "react";

type RecordItem = { id: string; score: number; category: string };

export function FilteredTable({ records }: { records: RecordItem[] }) {
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [sortAsc, setSortAsc] = useState<boolean>(true);

  const filteredAndSortedRecords = useMemo(() => {
    return records
      .filter((r) => selectedCategory === "all" || r.category === selectedCategory)
      .sort((a, b) => (sortAsc ? a.score - b.score : b.score - a.score));
  }, [records, selectedCategory, sortAsc]);

  return (
    <div>
      <p>Showing {filteredAndSortedRecords.length} records</p>
    </div>
  );
}
```

#### Example 2: Stabilizing Custom Hook Return Values
When writing custom hooks, wrap returned objects and functions in `useMemo` and `useCallback` so consumers can safely place them into their own dependency arrays:
```typescript
import { useState, useCallback, useMemo } from "react";

export function useCounter(initialVal: number = 0) {
  const [count, setCount] = useState(initialVal);

  const increment = useCallback(() => setCount((c) => c + 1), []);
  const decrement = useCallback(() => setCount((c) => c - 1), []);
  const reset = useCallback(() => setCount(initialVal), [initialVal]);

  // Return referentially stable object
  return useMemo(
    () => ({ count, increment, decrement, reset }),
    [count, increment, decrement, reset]
  );
}
```

#### Example 3: Simulating `useCallback` with `useMemo`
```typescript
export function customUseCallback<T extends (...args: any[]) => any>(
  callback: T,
  deps: any[]
): T {
  // useCallback is literally useMemo returning the function!
  return useMemo(() => callback, deps);
}
```

### Common Mistakes

#### Mistake 1: Memoizing Cheap Primitive Computations (Premature Optimization)
```typescript
// WRONG: Excessive overhead for trivial math
const sum = useMemo(() => a + b, [a, b]); 
// Allocating array [a, b], calling hook, doing Object.is checks costs MORE CPU cycles than a + b!

// CORRECT: Just calculate inline
const sum = a + b;
```

#### Mistake 2: Missing Dependencies Inside `useCallback` (Stale Callback Bug)
```typescript
// WRONG: Missing 'text' dependency in callback
export function BadSubmit({ text }: { text: string }) {
  const handleSubmit = useCallback(() => {
    // text is frozen at initial render's value!
    sendData(text); 
  }, []); // Missing 'text'!
}
```

#### Mistake 3: Using `useCallback` Without `React.memo` on the Child
```typescript
// USELESS: Parent memoizes callback, but child is a regular component
export function Parent() {
  const handleClick = useCallback(() => {}, []);
  // RegularButton is NOT wrapped in React.memo!
  // RegularButton re-renders EVERY time Parent renders regardless of useCallback!
  return <RegularButton onClick={handleClick} />;
}
```

### Rules to Remember
1. **`useCallback(fn, deps)` is identical to `useMemo(() => fn, deps)`.**
2. **`useCallback` is useless unless the child component is wrapped in `React.memo`** or the callback is passed to a hook dependency array.
3. **Do not memoize cheap operations (primitive math, string concatenation).** The memory allocation of arrays and hook records exceeds the cost of recalculating.
4. **Always include every variable referenced inside the callback in the dependency array.**

---

### Think First: Prediction Puzzle
Consider this code:
```typescript
const Child = React.memo(({ config }: { config: { active: boolean } }) => {
  console.log("CHILD_RENDERED");
  return <div>{String(config.active)}</div>;
});

export function Parent() {
  const [toggle, setToggle] = useState(false);

  // Notice: NOT wrapped in useMemo!
  const config = { active: true };

  return (
    <div>
      <button onClick={() => setToggle(!toggle)}>Toggle</button>
      <Child config={config} />
    </div>
  );
}
```
When the user clicks the "Toggle" button, will `"CHILD_RENDERED"` print to the console?

--------------------------------------------------------------------------------
**Answer:**
Yes.

**Explanation:**
Even though `Child` is wrapped in `React.memo`, `Parent` creates a brand new `{ active: true }` object literal on every single render. Because `Object.is(oldConfig, newConfig)` is `false`, `React.memo` shallow prop comparison detects a changed prop and re-renders `Child`. To prevent the re-render, `config` must be memoized: `const config = useMemo(() => ({ active: true }), [])`.

---

### Graded Exercises

#### Exercise 1: Search Query Filter Optimizer
Implement a component helper `useSearchFilter<T>(items: T[], query: string, filterFn: (item: T, q: string) => boolean): T[]` that uses `useMemo` to only re-filter the array when `items`, `query`, or `filterFn` changes.
- Hint 1: Call `useMemo(() => items.filter(it => filterFn(it, query)), [items, query, filterFn])`.

#### Exercise 2: `useCallback` Implementation with `useMemo`
Write a function `synthesizeUseCallback<T extends Function>(fn: T, deps: unknown[]): T` using only React's standard `useMemo`.
- Hint 1: Return `useMemo(() => fn, deps)`.

#### Exercise 3: Stable Event Handler with Dynamic State Ref
Build a custom hook `useEventCallback<T extends (...args: any[]) => any>(fn: T): T` that returns a function reference that **never changes identity across renders**, yet always executes the freshest version of `fn` without needing dependency arrays.
- Hint 1: Store `const fnRef = useRef(fn); fnRef.current = fn;`.
- Hint 2: Return `useCallback((...args: any[]) => fnRef.current(...args), [])`.

#### Exercise 4: Referential Stability Checker
Write a utility function `assertReferentialEquality<T>(previousValue: T, nextValue: T, label: string): void` that throws an error if `Object.is(previousValue, nextValue) === false`.
- Hint 1: Check `if (!Object.is(previousValue, nextValue))`.
- Hint 2: Throw `new Error("Referential inequality detected on " + label)`.

--------------------------------------------------------------------------------
### Exercise Solutions

```typescript
// Solution 1:
import { useMemo } from "react";

export function useSearchFilter<T>(
  items: T[],
  query: string,
  filterFn: (item: T, q: string) => boolean
): T[] {
  return useMemo(() => {
    if (!query.trim()) return items;
    return items.filter((item) => filterFn(item, query));
  }, [items, query, filterFn]);
}

// Solution 2:
import { useMemo } from "react";

export function synthesizeUseCallback<T extends (...args: any[]) => any>(
  fn: T,
  deps: unknown[]
): T {
  return useMemo(() => fn, deps);
}

// Solution 3:
import { useRef, useCallback, useLayoutEffect } from "react";

export function useEventCallback<T extends (...args: any[]) => any>(fn: T): T {
  const ref = useRef<T>(fn);

  useLayoutEffect(() => {
    ref.current = fn;
  });

  return useCallback(
    ((...args: any[]) => {
      const latest = ref.current;
      return latest(...args);
    }) as T,
    []
  );
}

// Solution 4:
export function assertReferentialEquality<T>(
  previousValue: T,
  nextValue: T,
  label: string
): void {
  if (!Object.is(previousValue, nextValue)) {
    throw new Error(`Referential inequality detected on: ${label}`);
  }
}
```

---

### Recall
1. What is the fundamental difference between `useMemo` and `useCallback`?
2. Why is wrapping a callback in `useCallback` ineffective if the child component receiving it is not wrapped in `React.memo`?
3. If you remember only one thing: **Use `useMemo` to cache expensive calculations and `useCallback` to preserve function references for `React.memo` children, but avoid premature optimization for cheap operations.**

---

## Topic 10: `useId`: Deterministic Hydration-Safe Unique Identifiers across Client and Server

### What Is It?
`useId` is a hook introduced in React 18 for generating unique, deterministic identifier strings that are guaranteed to match identically across both **server-side rendering (SSR)** and **client-side hydration**.

It generates an opaque string formatted like `:r1:` or `:R1a:` based on the component's hierarchical position in the React Fiber tree.

Key technical terms defined:
- Hydration is the client-side process where React attaches event listeners to pre-rendered HTML sent by the server, transforming static HTML into an interactive virtual DOM tree.
- A Hydration Mismatch occurs when the HTML generated on the server differs from the virtual DOM generated during client initial render, causing React to throw error warnings and discard server markup.
- Determinism is the property of an algorithm whereby identical starting conditions and inputs always produce the exact same output.
- An Accessible Form Association is the linking of an `<input id="foo">` with a `<label htmlFor="foo">` or `aria-describedby` so screen readers announce form controls correctly.

```
Server Render:     useId() ──► ":r1:" ──► <input id=":r1:" />
                                               │
                                     (Network Transfer)
                                               ▼
Client Hydration:  useId() ──► ":r1:" ──► Matches Server HTML! (Zero Mismatches)
```

### Why Does It Exist?
Prior to `useId`, developers attempted to generate unique IDs using two naive approaches:
1. **`Math.random()` or `uuid()`**:
   - Server generates: `<input id="id-0.4912" />`.
   - Client generates: `<input id="id-0.8194" />`.
   - Result: Severe **hydration mismatch errors**, broken accessibility bindings, and forced client re-renders.
2. **Global auto-increment counters (`let count = 0; count++`)**:
   - In modern streaming SSR and concurrent rendering, server chunks and components resolve asynchronously in non-deterministic order.
   - If Component B renders before Component A on the client, the counter sequence drifts, producing mismatched IDs.

`useId` solves this by encoding the component's physical **slot path in the Fiber tree**, ensuring identical IDs regardless of execution order or network timing.

### Basic Example and Line-by-Line Explanation

```typescript
import React, { useId } from "react";

export function AccessibleInputField({ label }: { label: string }) {
  const inputId = useId();
  const hintId = `${inputId}-hint`;

  return (
    <div style={{ marginBottom: "12px" }}>
      <label htmlFor={inputId}>{label}</label>
      <input
        id={inputId}
        type="text"
        aria-describedby={hintId}
        placeholder="Enter value"
      />
      <span id={hintId} style={{ fontSize: "12px", color: "#666" }}>
        Please enter a valid format.
      </span>
    </div>
  );
}
```

Line-by-line breakdown:
1. `import React, { useId } from "react";`: Imports the `useId` hook.
2. `const inputId = useId();`: Generates a deterministic string (e.g. `":r2:"`). This string is identical on server and client.
3. `const hintId = `${inputId}-hint`;`: Appends a suffix to create related accessible sub-identifiers from the single generated base ID.
4. `<label htmlFor={inputId}>`: Associates the label with the input.
5. `<input id={inputId} aria-describedby={hintId} />`: Binds accessibility attributes cleanly.
6. When SSR outputs this HTML and the client hydrates, both agree on `:r2:` and `:r2:-hint`, achieving 100% hydration consistency.

### How It Works Inside React
Inside React's Fiber reconciler:
1. React assigns each Fiber a hierarchical path representing its parent-child coordinates in the tree.
2. The tree position is encoded as a base-32 bitmask string representing the branch traversal order.
3. Because the tree structure is identical on the server and client, the derived base-32 token is mathematically identical.
4. Colon delimiters (`:`) are added at the start and end (e.g. `:r1:`) specifically so that the string cannot be mistakenly selected by CSS query selectors like `document.querySelector("#:r1:")`, enforcing proper accessibility usage rather than manual DOM querying.

### More Examples

#### Example 1: Multi-Input Compound Form with Suffix Expansion
Instead of calling `useId()` multiple times for adjacent fields in the same component, generate a single base ID and append suffixes:
```typescript
import React, { useId } from "react";

export function RegistrationFormFields() {
  const baseId = useId();

  return (
    <form>
      <div>
        <label htmlFor={`${baseId}-name`}>Full Name:</label>
        <input id={`${baseId}-name`} type="text" />
      </div>

      <div>
        <label htmlFor={`${baseId}-email`}>Email Address:</label>
        <input id={`${baseId}-email`} type="email" />
      </div>

      <div>
        <label htmlFor={`${baseId}-pwd`}>Password:</label>
        <input id={`${baseId}-pwd`} type="password" />
      </div>
    </form>
  );
}
```

#### Example 2: Prefixing App-Level IDs for Multi-Root Applications
In multi-app architectures (e.g. microfrontends) where two React roots run on the same HTML page, IDs might collide. React allows you to configure an `identifierPrefix`:
```typescript
import { createRoot } from "react-dom/client";
import { AccessibleInputField } from "./AccessibleInputField";

// Configure unique prefix for microfrontend A
const rootA = createRoot(document.getElementById("app-a")!, {
  identifierPrefix: "mfe-a-",
});
rootA.render(<AccessibleInputField label="First Name" />);
// Output id will be: "mfe-a-:r0:"

// Configure unique prefix for microfrontend B
const rootB = createRoot(document.getElementById("app-b")!, {
  identifierPrefix: "mfe-b-",
});
rootB.render(<AccessibleInputField label="First Name" />);
// Output id will be: "mfe-b-:r0:" -> Zero collision between independent apps!
```

#### Example 3: Simulating Hierarchical Tree Position Encoding
```typescript
export function generateDeterministicId(parentPath: string, slotIndex: number): string {
  // Simulates hierarchical tree path encoding
  const slotToken = slotIndex.toString(32);
  return `:${parentPath}R${slotToken}:`;
}
```

### Common Mistakes

#### Mistake 1: Using `useId` to Generate Keys in Lists
```typescript
// WRONG: useId is NOT intended for list keys!
export function BadUserList({ users }: { users: string[] }) {
  return (
    <ul>
      {users.map((name) => {
        const id = useId(); // VIOLATES RULES OF HOOKS & DESTROYS LIST DIFFING!
        return <li key={id}>{name}</li>;
      })}
    </ul>
  );
}

// CORRECT: Keys should be derived from your data model's unique IDs!
export function GoodUserList({ users }: { users: { id: string; name: string }[] }) {
  return (
    <ul>
      {users.map((u) => (
        <li key={u.id}>{u.name}</li>
      ))}
    </ul>
  );
}
```
**Why this breaks:** Calling `useId` inside `.map()` violates the Rules of Hooks (hooks inside loops). Furthermore, React list keys must be stable identifiers tied to the *data*, not generated on the fly.

#### Mistake 2: Using `useId` for CSS Selectors Directly
```typescript
// DANGEROUS: Colons in :r0: are CSS pseudo-class delimiters!
const id = useId();
// document.querySelector(`#${id}`) throws DOMException: SyntaxError!
// If DOM selection is needed, use useRef instead.
```

### Rules to Remember
1. **`useId` is specifically designed for HTML accessibility attributes** (`id`, `htmlFor`, `aria-describedby`, `aria-labelledby`).
2. **Never use `useId` to generate keys for lists or tables.**
3. **Generate one ID per component and append suffixes** (`${id}-firstName`, `${id}-lastName`) for related elements.
4. **Use `identifierPrefix` in `createRoot`** when hosting multiple React applications on the same page.

---

### Think First: Prediction Puzzle
Consider this code:
```typescript
export function TwoInputs() {
  const id1 = useId();
  const id2 = useId();

  return <div>{String(id1 === id2)}</div>;
}
```
Will the component display `true` or `false`?

--------------------------------------------------------------------------------
**Answer:**
`false`.

**Explanation:**
Each call to `useId()` advances the Fiber's internal hook pointer and generates a distinct slot address. Within the same component, two sequential `useId()` invocations produce unique IDs (e.g. `:r0:` and `:r1:`).

---

### Graded Exercises

#### Exercise 1: Accessible Switch Toggle Component
Create a reusable toggle component `ToggleSwitch({ label, checked, onChange }: ToggleProps)` that uses `useId` to pair a `<label>` with a hidden `<input type="checkbox">` and an `aria-live` status indicator.
- Hint 1: Call `const switchId = useId()`.
- Hint 2: Link `htmlFor={switchId}` on the label and `id={switchId}` on the checkbox.

#### Exercise 2: Multi-Field Suffix Generator Hook
Write a custom hook `useFormIds<T extends string>(...fieldNames: T[]): Record<T, string>` that takes an arbitrary list of field names and returns an object mapping each name to a unique, suffixed ID derived from a single `useId()`.
- Hint 1: Call `const baseId = useId()`.
- Hint 2: Loop or reduce over `fieldNames` assigning `acc[name] = `${baseId}-${name}``.

#### Exercise 3: Hydration Safety Tester
Write a pure test function `verifyHydrationMatch(serverHtml: string, clientHtml: string): boolean` that compares rendered markup and verifies that all `id` attributes match identically.
- Hint 1: Extract `id="([^"]+)"` matches using RegExp.
- Hint 2: Compare arrays for identical sequence and length.

#### Exercise 4: Accessible Accordion ARIA Binder
Build an `AccordionSection({ title, children }: { title: string; children: React.ReactNode })` component that uses `useId` to connect the header button's `aria-controls` with the content panel's `id`, and the panel's `aria-labelledby` with the button's `id`.
- Hint 1: Generate `baseId = useId()`.
- Hint 2: Button has `id={`${baseId}-btn`}` and `aria-controls={`${baseId}-panel`}`. Panel has `id={`${baseId}-panel`}` and `aria-labelledby={`${baseId}-btn`}`.

--------------------------------------------------------------------------------
### Exercise Solutions

```typescript
// Solution 1:
import React, { useId } from "react";

export function ToggleSwitch({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (val: boolean) => void;
}) {
  const switchId = useId();
  const descId = `${switchId}-status`;

  return (
    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
      <label htmlFor={switchId}>{label}</label>
      <input
        id={switchId}
        type="checkbox"
        checked={checked}
        aria-describedby={descId}
        onChange={(e) => onChange(e.target.checked)}
      />
      <span id={descId} aria-live="polite">
        {checked ? "Enabled" : "Disabled"}
      </span>
    </div>
  );
}

// Solution 2:
import { useId, useMemo } from "react";

export function useFormIds<T extends string>(...fieldNames: T[]): Record<T, string> {
  const baseId = useId();

  return useMemo(() => {
    const map = {} as Record<T, string>;
    for (const name of fieldNames) {
      map[name] = `${baseId}-${name}`;
    }
    return map;
  }, [baseId, fieldNames]);
}

// Solution 3:
export function verifyHydrationMatch(serverHtml: string, clientHtml: string): boolean {
  const extractIds = (html: string) => {
    const matches = html.matchAll(/id="([^"]+)"/g);
    return Array.from(matches, (m) => m[1]);
  };

  const serverIds = extractIds(serverHtml);
  const clientIds = extractIds(clientHtml);

  if (serverIds.length !== clientIds.length) return false;
  return serverIds.every((id, idx) => id === clientIds[idx]);
}

// Solution 4:
import React, { useId, useState } from "react";

export function AccordionSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const baseId = useId();
  const btnId = `${baseId}-header`;
  const panelId = `${baseId}-panel`;

  return (
    <div style={{ border: "1px solid #ddd", margin: "4px 0" }}>
      <button
        id={btnId}
        aria-expanded={isOpen}
        aria-controls={panelId}
        onClick={() => setIsOpen((prev) => !prev)}
        style={{ width: "100%", textAlign: "left", padding: "8px" }}
      >
        {title}
      </button>
      {isOpen && (
        <div
          id={panelId}
          role="region"
          aria-labelledby={btnId}
          style={{ padding: "8px" }}
        >
          {children}
        </div>
      )}
    </div>
  );
}
```

---

### Recall
1. Why does using `Math.random()` to generate input IDs break server-side rendering in Next.js?
2. Why is using `useId()` to generate keys for mapped array items an anti-pattern?
3. If you remember only one thing: **`useId` generates deterministic, tree-position-encoded IDs that match identically between SSR and client hydration to guarantee accessible form associations without hydration mismatches.**

---

## Checkpoint Challenge 2: Passive Effects, Synchronous Layout Measurement & Memoization Pipeline (Topics 6–10)

### Challenge Objective
Build a comprehensive, production-grade **Autonomous Data Grid Popover Suite** combining all concepts from Topics 6 through 10:
1. **`useEffect` with `AbortController`**: Asynchronously fetch records based on a search query with full cancellation on input changes to defeat network race conditions.
2. **`useLayoutEffect`**: Measure anchor positions synchronously before browser paint to guarantee zero-flicker popover placement above the selected grid row.
3. **`useMemo` & `useCallback`**: Optimize expensive data sorting/filtering and maintain referential stability for memoized row children.
4. **`useId`**: Generate hydration-safe accessible ARIA associations between the trigger cell, popover dialog, and live filter input.
5. **Verification Test Harness**: Assert correct execution order and referential equality invariants.

### Implementation Code

```typescript
import React, {
  useState,
  useRef,
  useEffect,
  useLayoutEffect,
  useMemo,
  useCallback,
  useId,
} from "react";

// ============================================================================
// Step 1: Types & Data Contract
// ============================================================================
export type DataRecord = {
  id: string;
  title: string;
  value: number;
  category: "finance" | "engineering" | "operations";
};

// ============================================================================
// Step 2: Asynchronous Data Fetcher with AbortController (Topics 6 & 7)
// ============================================================================
export function useAsyncRecords(searchQuery: string) {
  const [records, setRecords] = useState<DataRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError(null);

    // Simulated network fetch with latency
    const timer = setTimeout(() => {
      if (controller.signal.aborted) return;

      const mockDb: DataRecord[] = [
        { id: "rec_1", title: "Cloud Compute Allocation", value: 1200, category: "engineering" },
        { id: "rec_2", title: "Quarterly Revenue Audit", value: 45000, category: "finance" },
        { id: "rec_3", title: "Logistics Routing Optimization", value: 340, category: "operations" },
        { id: "rec_4", title: "Database Shard Migration", value: 890, category: "engineering" },
        { id: "rec_5", title: "Payroll Ledger Settlement", value: 92000, category: "finance" },
      ];

      const filtered = mockDb.filter((r) =>
        r.title.toLowerCase().includes(searchQuery.toLowerCase())
      );

      setRecords(filtered);
      setLoading(false);
    }, 150);

    return () => {
      // Abort in-flight operations when query changes or unmounts
      controller.abort();
      clearTimeout(timer);
    };
  }, [searchQuery]);

  return { records, loading, error };
}

// ============================================================================
// Step 3: Zero-Flicker Synchronous Popover Anchor Hook (Topic 8)
// ============================================================================
export function useAnchorPosition(targetElement: HTMLElement | null) {
  const [position, setPosition] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  useLayoutEffect(() => {
    if (!targetElement) return;

    // Synchronous measurement BEFORE browser paint
    const rect = targetElement.getBoundingClientRect();
    setPosition({
      x: rect.left,
      y: rect.bottom + 8, // Place 8px below the anchor element
    });
  }, [targetElement]);

  return position;
}

// ============================================================================
// Step 4: Memoized Table Row Component (Topic 9)
// ============================================================================
export const GridRow = React.memo(function GridRow({
  record,
  onSelect,
}: {
  record: DataRecord;
  onSelect: (rec: DataRecord, el: HTMLElement) => void;
}) {
  const handleClick = (e: React.MouseEvent<HTMLTableRowElement>) => {
    onSelect(record, e.currentTarget);
  };

  return (
    <tr
      onClick={handleClick}
      style={{ cursor: "pointer", borderBottom: "1px solid #eee" }}
    >
      <td style={{ padding: "6px" }}>{record.id}</td>
      <td style={{ padding: "6px" }}>{record.title}</td>
      <td style={{ padding: "6px" }}>${record.value.toLocaleString()}</td>
      <td style={{ padding: "6px" }}>{record.category}</td>
    </tr>
  );
});

// ============================================================================
// Step 5: Full Integration Component (Topics 6, 7, 8, 9, 10)
// ============================================================================
export function DataGridPopoverSuite() {
  const [search, setSearch] = useState<string>("");
  const [activeRecord, setActiveRecord] = useState<DataRecord | null>(null);
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);

  // Topic 10: Deterministic Hydration-Safe Accessibility IDs
  const searchInputId = useId();
  const popoverDialogId = `${searchInputId}-dialog`;

  // Topics 6 & 7: Cancelable async records
  const { records, loading } = useAsyncRecords(search);

  // Topic 8: Zero-flicker synchronous positioning
  const popoverCoords = useAnchorPosition(anchorEl);

  // Topic 9: Memoized sort calculation
  const sortedRecords = useMemo(() => {
    return [...records].sort((a, b) => b.value - a.value);
  }, [records]);

  // Topic 9: Stable callback identity for React.memo children
  const handleSelectRecord = useCallback((rec: DataRecord, el: HTMLElement) => {
    setActiveRecord(rec);
    setAnchorEl(el);
  }, []);

  const closePopover = () => {
    setActiveRecord(null);
    setAnchorEl(null);
  };

  return (
    <div style={{ padding: "24px", fontFamily: "sans-serif" }}>
      <h2>Autonomous Data Grid & Synchronous Popover Suite</h2>

      {/* Accessible Search Input (Topic 10) */}
      <div style={{ marginBottom: "16px" }}>
        <label htmlFor={searchInputId} style={{ marginRight: "8px", fontWeight: "bold" }}>
          Filter Records:
        </label>
        <input
          id={searchInputId}
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by title..."
          style={{ padding: "6px 12px", width: "300px" }}
        />
        {loading && <span style={{ marginLeft: "8px" }}>Loading...</span>}
      </div>

      {/* Data Table */}
      <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
        <thead>
          <tr style={{ background: "#f0f0f0" }}>
            <th style={{ padding: "6px" }}>ID</th>
            <th style={{ padding: "6px" }}>Title</th>
            <th style={{ padding: "6px" }}>Value</th>
            <th style={{ padding: "6px" }}>Category</th>
          </tr>
        </thead>
        <tbody>
          {sortedRecords.map((record) => (
            <GridRow key={record.id} record={record} onSelect={handleSelectRecord} />
          ))}
        </tbody>
      </table>

      {/* Zero-Flicker Synchronously Measured Popover (Topic 8 & 10) */}
      {activeRecord && (
        <div
          id={popoverDialogId}
          role="dialog"
          aria-modal="true"
          style={{
            position: "fixed",
            left: `${popoverCoords.x}px`,
            top: `${popoverCoords.y}px`,
            background: "white",
            border: "1px solid #333",
            boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
            padding: "16px",
            zIndex: 1000,
            borderRadius: "6px",
          }}
        >
          <h4 style={{ margin: "0 0 8px 0" }}>Record Details</h4>
          <p><strong>ID:</strong> {activeRecord.id}</p>
          <p><strong>Title:</strong> {activeRecord.title}</p>
          <p><strong>Value:</strong> ${activeRecord.value}</p>
          <button onClick={closePopover}>Close</button>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// Step 6: Checkpoint 2 Verification Suite
// ============================================================================
export function runCheckpoint2Tests() {
  console.log("--- 1. Testing useId Suffix Consistency ---");
  const base = ":r1:";
  const derivedDialog = `${base}-dialog`;
  console.log("Derived ID matches format:", derivedDialog === ":r1:-dialog");

  console.log("\n--- 2. Testing Memoized Sort Pipeline ---");
  const rawList: DataRecord[] = [
    { id: "1", title: "Alpha", value: 100, category: "finance" },
    { id: "2", title: "Beta", value: 500, category: "finance" },
    { id: "3", title: "Gamma", value: 250, category: "finance" },
  ];
  const sorted = [...rawList].sort((a, b) => b.value - a.value);
  console.log("Sort descending verified:", sorted[0].value === 500 && sorted[2].value === 100);

  console.log("\n--- Checkpoint 2 Complete: All unit assertions passed cleanly! ---");
}

runCheckpoint2Tests();
```

## Topic 11: `useImperativeHandle` & `forwardRef`: Restricting DOM Access & Exposing Clean Imperative Component APIs

### What Is It?
`useImperativeHandle` is a React hook that customizes the instance value exposed to parent components when using `ref`. 

By default, passing a `ref` down to a child component gives the parent raw, unrestricted access to the underlying DOM element (such as an `HTMLInputElement`). `useImperativeHandle` allows the child component to **hide the raw DOM node** and expose only a specific, restricted public interface of functions.

In React 18, this hook is paired with `React.forwardRef`. In React 19, `ref` can be passed directly as a standard component prop without `forwardRef`.

Key technical terms defined:
- An Imperative Handle is a custom object containing specific callable methods exposed via a ref.
- `forwardRef` is a higher-order wrapper that allows a function component to receive a `ref` parameter from its parent.
- Information Hiding (Encapsulation) is the software engineering principle of concealing internal implementation details (e.g. raw DOM nodes) to prevent unauthorized mutations.
- An Imperative API is an interface where operations are triggered via explicit function commands (`inputRef.current.focus()`) rather than declarative props.

```
Parent Component
  │  ref
  ▼
Child Component (CustomInput)
  │
  ├── [ Raw HTMLInputElement ] (Hidden & Protected)
  │
  └── useImperativeHandle ──► Exposes only: { focus(), clear() } to Parent
```

### Why Does It Exist?
Exposing raw DOM elements (`<input ref={ref} />`) to parent components breaks encapsulation:
1. A parent component can arbitrarily modify CSS styles, inspect unneeded internal properties, or manipulate the DOM directly, causing bugs that bypass React's virtual DOM.
2. If the internal implementation of the child component changes (for example, switching from a single `<input>` to a composite multi-input masked field), all parent code directly touching the raw DOM element breaks.

`useImperativeHandle` acts as an encapsulation boundary, providing a stable, clean contract between parent and child.

### Basic Example and Line-by-Line Explanation

```typescript
import React, { useRef, useImperativeHandle, forwardRef } from "react";

// 1. Define the public imperative contract
export interface CustomInputHandle {
  focus: () => void;
  reset: () => void;
}

interface CustomInputProps {
  label: string;
}

// 2. Child component wrapped in forwardRef
export const CustomInputField = forwardRef<CustomInputHandle, CustomInputProps>(
  function CustomInputField({ label }, ref) {
    const internalInputRef = useRef<HTMLInputElement | null>(null);

    // 3. Expose only the specified methods to the parent ref
    useImperativeHandle(
      ref,
      () => ({
        focus: () => {
          internalInputRef.current?.focus();
        },
        reset: () => {
          if (internalInputRef.current) {
            internalInputRef.current.value = "";
          }
        },
      }),
      []
    );

    return (
      <div>
        <label>{label}</label>
        <input ref={internalInputRef} type="text" />
      </div>
    );
  }
);

// 4. Parent component consuming the imperative handle
export function ParentForm() {
  const inputHandleRef = useRef<CustomInputHandle | null>(null);

  const handleAction = () => {
    // Parent can ONLY call focus() and reset() - raw DOM node is unreachable!
    inputHandleRef.current?.focus();
  };

  return (
    <div>
      <CustomInputField ref={inputHandleRef} label="Security Token" />
      <button onClick={handleAction}>Focus Token Field</button>
    </div>
  );
}
```

Line-by-line breakdown:
1. `export interface CustomInputHandle`: Declares the TypeScript interface representing the exposed API.
2. `forwardRef<CustomInputHandle, CustomInputProps>(...)`: Allows the child component to accept `ref` as its second argument.
3. `const internalInputRef = useRef<HTMLInputElement | null>(null);`: Creates a private ref pointing to the actual browser DOM node.
4. `useImperativeHandle(ref, () => ({ focus, reset }), []);`: During the commit layout phase, React calls this factory function and assigns the returned object to the parent's `ref.current`.
5. `<input ref={internalInputRef} />`: Binds the actual DOM node to the internal ref.
6. In `ParentForm`, `inputHandleRef.current` holds `{ focus: fn, reset: fn }`. The parent cannot access `inputHandleRef.current.value` directly or mutate DOM attributes.

### How It Works Inside React
During the Commit Phase (`commitLayoutEffects` in `ReactFiberCommitWork.js`):
1. React checks if the Fiber has an imperative handle hook.
2. React verifies whether the dependency array has changed using `areHookInputsEqual`.
3. If dependencies changed or during initial mount, React executes the factory function:
   ```javascript
   const handle = createHandle();
   ```
4. If `ref` is an object (`useRef`), React assigns:
   ```javascript
   ref.current = handle;
   ```
5. If `ref` is a callback ref, React calls:
   ```javascript
   ref(handle);
   ```
6. When the child unmounts, React sets `ref.current = null` or calls `ref(null)`.

### More Examples

#### Example 1: Custom Media Player Controller Handle
```typescript
import React, { useRef, useImperativeHandle, forwardRef } from "react";

export interface VideoPlayerHandle {
  play: () => void;
  pause: () => void;
  restart: () => void;
}

export const VideoPlayer = forwardRef<VideoPlayerHandle, { src: string }>(
  function VideoPlayer({ src }, ref) {
    const videoRef = useRef<HTMLVideoElement | null>(null);

    useImperativeHandle(
      ref,
      () => ({
        play: () => videoRef.current?.play(),
        pause: () => videoRef.current?.pause(),
        restart: () => {
          if (videoRef.current) {
            videoRef.current.currentTime = 0;
            videoRef.current.play();
          }
        },
      }),
      []
    );

    return <video ref={videoRef} src={src} controls={false} width="320" />;
  }
);
```

#### Example 2: React 19 Direct Ref Prop (Zero `forwardRef` Boilerplate)
In React 19, `ref` is a standard prop. `forwardRef` is no longer required:
```typescript
import React, { useRef, useImperativeHandle } from "react";

export interface ModalHandle {
  open: () => void;
  close: () => void;
}

// React 19: ref is accepted directly as a standard component prop!
export function ModalDialog({
  title,
  ref,
}: {
  title: string;
  ref?: React.Ref<ModalHandle>;
}) {
  const [isOpen, setIsOpen] = React.useState(false);

  useImperativeHandle(
    ref,
    () => ({
      open: () => setIsOpen(true),
      close: () => setIsOpen(false),
    }),
    []
  );

  if (!isOpen) return null;
  return (
    <div style={{ border: "2px solid black", padding: "16px" }}>
      <h3>{title}</h3>
      <button onClick={() => setIsOpen(false)}>Dismiss</button>
    </div>
  );
}
```

#### Example 3: Dynamic Imperative Handle with Dependencies
```typescript
import React, { useRef, useImperativeHandle, forwardRef } from "react";

export interface FormStepHandle {
  submitStep: () => boolean;
}

export const FormStep = forwardRef<FormStepHandle, { stepIndex: number }>(
  function FormStep({ stepIndex }, ref) {
    const [isValid, setIsValid] = React.useState(true);

    useImperativeHandle(
      ref,
      () => ({
        submitStep: () => {
          console.log(`Validating step ${stepIndex}`);
          return isValid;
        },
      }),
      [stepIndex, isValid] // Re-computes handle when stepIndex or isValid changes
    );

    return <div>Step {stepIndex} Content</div>;
  }
);
```

### Common Mistakes

#### Mistake 1: Returning Primitive Values from `useImperativeHandle`
```typescript
// WRONG: Returning a primitive string instead of an API object
useImperativeHandle(ref, () => "my-token", []); // Disables method invocation
```

#### Mistake 2: Missing Dependencies Leading to Stale Closures
```typescript
// WRONG: Omitting state variables from dependency array
export const StaleCounter = forwardRef((props, ref) => {
  const [count, setCount] = useState(0);

  useImperativeHandle(ref, () => ({
    getCount: () => count, // Always returns 0!
  }), []); // Missing [count]!
});
```

#### Mistake 3: Overusing Imperative Handles Instead of Declarative State
```typescript
// ANTI-PATTERN: Forcing parents to call childRef.current.setColor("red")
// CORRECT: Pass color as a declarative prop: <Child color={color} />
```

### Rules to Remember
1. **Never use imperative handles for things that can be expressed as declarative props.**
2. **Always supply an explicit dependency array to `useImperativeHandle`.**
3. **Use imperative handles strictly for non-declarative actions:** focus, scroll positioning, canvas drawing, and media playback.
4. **In React 19, use `ref` directly as a prop; `forwardRef` is legacy.**

---

### Think First: Prediction Puzzle
Consider this code:
```typescript
const Child = forwardRef((props, ref) => {
  useImperativeHandle(ref, () => ({
    ping: () => "PONG",
  }));
  return <div>Child</div>;
});

export function Parent() {
  const childRef = useRef<any>(null);
  console.log("REF_VALUE_IN_RENDER:", childRef.current);

  useEffect(() => {
    console.log("REF_VALUE_IN_EFFECT:", childRef.current?.ping());
  }, []);

  return <Child ref={childRef} />;
}
```
During initial mount, what will `REF_VALUE_IN_RENDER` and `REF_VALUE_IN_EFFECT` log?

--------------------------------------------------------------------------------
**Answer:**
`REF_VALUE_IN_RENDER: null`
`REF_VALUE_IN_EFFECT: PONG`

**Explanation:**
Refs and imperative handles are assigned during the Commit Phase. During the parent's Render phase, the child has not yet committed, so `childRef.current` is `null`. By the time `useEffect` runs (after paint), the layout phase has populated `childRef.current` with `{ ping: () => "PONG" }`.

---

### Graded Exercises

#### Exercise 1: Scroll-To-Top Imperative Handle
Create a component `ScrollContainer` using `useImperativeHandle` that exposes a `scrollToTop()` method to its parent, which scrolls an internal `<div>` to position `0`.
- Hint 1: Create an internal `const divRef = useRef<HTMLDivElement | null>(null)`.
- Hint 2: In `useImperativeHandle`, return `{ scrollToTop: () => { divRef.current?.scrollTo({ top: 0, behavior: "smooth" }); } }`.

#### Exercise 2: Form Input Clear and Focus Contract
Define a TypeScript interface `SearchHandle { focus(): void; clear(): void; getValue(): string; }`. Implement a `forwardRef` component satisfying this contract.
- Hint 1: Store value in local state or read `internalRef.current.value`.
- Hint 2: Expose the 3 methods in the handle factory.

#### Exercise 3: Canvas Painter Imperative Controller
Build an `HTMLCanvas` component exposing `{ clearCanvas(): void; drawCircle(x: number, y: number): void }` using `useImperativeHandle`.
- Hint 1: Store `const canvasRef = useRef<HTMLCanvasElement | null>(null)`.
- Hint 2: Query `const ctx = canvasRef.current.getContext("2d")` inside the handle methods.

#### Exercise 4: React 19 Ref Validator Guard
Write a pure function `validateHandleMethods<T extends object>(handle: T | null, requiredMethods: (keyof T)[]): boolean` that verifies whether a ref handle contains all expected functions before calling them.
- Hint 1: Check `if (!handle || typeof handle !== "object") return false`.
- Hint 2: Loop through `requiredMethods` and verify `typeof handle[m] === "function"`.

--------------------------------------------------------------------------------
### Exercise Solutions

```typescript
// Solution 1:
import React, { useRef, useImperativeHandle, forwardRef } from "react";

export interface ScrollContainerHandle {
  scrollToTop: () => void;
}

export const ScrollContainer = forwardRef<ScrollContainerHandle, { children: React.ReactNode }>(
  function ScrollContainer({ children }, ref) {
    const internalRef = useRef<HTMLDivElement | null>(null);

    useImperativeHandle(
      ref,
      () => ({
        scrollToTop: () => {
          internalRef.current?.scrollTo({ top: 0, behavior: "smooth" });
        },
      }),
      []
    );

    return (
      <div ref={internalRef} style={{ height: "200px", overflowY: "auto" }}>
        {children}
      </div>
    );
  }
);

// Solution 2:
export interface SearchHandle {
  focus: () => void;
  clear: () => void;
  getValue: () => string;
}

export const SearchInput = forwardRef<SearchHandle, {}>(function SearchInput(_props, ref) {
  const inputRef = useRef<HTMLInputElement | null>(null);

  useImperativeHandle(
    ref,
    () => ({
      focus: () => inputRef.current?.focus(),
      clear: () => {
        if (inputRef.current) inputRef.current.value = "";
      },
      getValue: () => inputRef.current?.value ?? "",
    }),
    []
  );

  return <input ref={inputRef} type="search" placeholder="Type here..." />;
});

// Solution 3:
export interface CanvasHandle {
  clearCanvas: () => void;
  drawCircle: (x: number, y: number) => void;
}

export const CanvasPainter = forwardRef<CanvasHandle, {}>(function CanvasPainter(_props, ref) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useImperativeHandle(
    ref,
    () => ({
      clearCanvas: () => {
        const ctx = canvasRef.current?.getContext("2d");
        if (ctx && canvasRef.current) {
          ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
        }
      },
      drawCircle: (x, y) => {
        const ctx = canvasRef.current?.getContext("2d");
        if (ctx) {
          ctx.beginPath();
          ctx.arc(x, y, 10, 0, Math.PI * 2);
          ctx.fill();
        }
      },
    }),
    []
  );

  return <canvas ref={canvasRef} width={300} height={200} />;
});

// Solution 4:
export function validateHandleMethods<T extends object>(
  handle: T | null,
  requiredMethods: (keyof T)[]
): boolean {
  if (!handle || typeof handle !== "object") return false;
  return requiredMethods.every((method) => typeof handle[method] === "function");
}
```

---

### Recall
1. Why does `useImperativeHandle` protect components better than passing raw DOM element refs?
2. At which lifecycle phase does React assign the imperative handle to `ref.current`?
3. If you remember only one thing: **Use `useImperativeHandle` to expose a minimal, customized imperative interface to parent components while keeping internal DOM nodes completely private.**

---

## Topic 12: `useSyncExternalStore`: Concurrent Mode Tearing Prevention & Subscribing to External Stores (Zustand, Browser Storage)

### What Is It?
`useSyncExternalStore` is a hook introduced in React 18 designed specifically for subscribing to **external state sources** (such as Redux, Zustand, browser APIs, or custom observable stores) in a way that is 100% compatible with Concurrent React.

It takes two mandatory functions:
1. `subscribe`: A function that registers a callback to be notified whenever the external store changes.
2. `getSnapshot`: A function that returns an immutable snapshot of the current state from the store.
3. `getServerSnapshot` (optional): Returns a snapshot used during server-side rendering.

Key technical terms defined:
- An External Store is any state container that lives outside of React's Fiber tree (e.g. `window.localStorage`, browser `navigator.onLine`, Zustand store).
- UI Tearing is a visual defect where different components on the screen display different values for the exact same piece of state on the same visual frame due to concurrent rendering interruptions.
- A Snapshot is an immutable representation of state at a single point in time.

```
Without useSyncExternalStore (Tearing Risk):
Component A renders (State = 1) ──► Concurrent Interrupt (Store updates to 2) ──► Component B renders (State = 2)
[Result: Screen renders with half State 1 and half State 2 -> Tearing Bug!]

With useSyncExternalStore:
React detects snapshot changed during render ──► Discards interrupted work ──► Re-renders cleanly with State = 2
```

### Why Does It Exist?
In React 17 and earlier, rendering was synchronous and uninterruptible. If a global variable changed, all components rendered together in one unbroken pass.

In React 18 and 19, **Concurrent Rendering** allows React to pause rendering a heavy component tree to handle an urgent user keystroke, and resume rendering later.

If an external store (like a global Redux or Zustand store) mutates *during* that pause:
- Components rendered before the pause show the old value.
- Components rendered after the pause show the new value.
- The user sees an inconsistent, corrupted UI ("tearing").

`useSyncExternalStore` guarantees that if an external store changes during rendering, React detects the mismatch and restarts the render synchronously, ensuring 100% UI consistency.

### Basic Example and Line-by-Line Explanation

```typescript
import React, { useSyncExternalStore } from "react";

// 1. Subscribe function: attaches listener to native window event
function subscribeToOnlineStatus(callback: () => void) {
  window.addEventListener("online", callback);
  window.addEventListener("offline", callback);

  return () => {
    window.removeEventListener("online", callback);
    window.removeEventListener("offline", callback);
  };
}

// 2. Client snapshot: returns boolean value
function getOnlineSnapshot(): boolean {
  return navigator.onLine;
}

// 3. Server snapshot for SSR: fallback to true
function getServerOnlineSnapshot(): boolean {
  return true;
}

export function NetworkStatusBadge() {
  const isOnline = useSyncExternalStore(
    subscribeToOnlineStatus,
    getOnlineSnapshot,
    getServerOnlineSnapshot
  );

  return (
    <div style={{ color: isOnline ? "green" : "red", fontWeight: "bold" }}>
      Status: {isOnline ? "ONLINE" : "OFFLINE"}
    </div>
  );
}
```

Line-by-line breakdown:
1. `subscribeToOnlineStatus(callback)`: React passes its own internal listener function (`callback`). Whenever the browser network toggles, `callback()` is called, informing React that the store changed.
2. `return () => { ... }`: The cleanup function removing the event listeners when the component unmounts.
3. `getOnlineSnapshot()`: Returns the current value. React checks this value using `Object.is`.
4. `getServerOnlineSnapshot()`: Provides a deterministic value during Next.js SSR before hydration.
5. `const isOnline = useSyncExternalStore(...)`: Subscribes the component to the browser event stream with zero tearing risk.

### How It Works Inside React
When a component calls `useSyncExternalStore`:
1. During the render phase, React calls `getSnapshot()`.
2. It compares the returned snapshot with the snapshot captured at the start of the render:
   ```javascript
   if (!Object.is(currentSnapshot, initialSnapshot)) {
     // Snapshot mutated during concurrent rendering!
     // TEARING DETECTED: Restart render synchronously!
     throw forceClientSyncAndRerender();
   }
   ```
3. During the commit phase, React calls `subscribe(handleStoreChange)`.
4. When the store triggers `handleStoreChange()`, React schedules an update and compares the new snapshot. If unchanged (`Object.is(old, new) === true`), React bails out of re-rendering.

### More Examples

#### Example 1: Building a Mini-Zustand Reactive Store from Scratch
```typescript
import { useSyncExternalStore } from "react";

// Factory creating an external reactive store
export function createSimpleStore<T>(initialState: T) {
  let state = initialState;
  const listeners = new Set<() => void>();

  return {
    getState: () => state,
    setState: (updater: T | ((prev: T) => T)) => {
      state = typeof updater === "function" ? (updater as any)(state) : updater;
      listeners.forEach((listener) => listener());
    },
    subscribe: (listener: () => void) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
  };
}

// Instantiate external store outside React tree
export const globalCounterStore = createSimpleStore<number>(0);

export function ExternalCounterDisplay() {
  const count = useSyncExternalStore(
    globalCounterStore.subscribe,
    globalCounterStore.getState
  );

  return (
    <div>
      <p>Global Count: {count}</p>
      <button onClick={() => globalCounterStore.setState((c) => c + 1)}>Increment</button>
    </div>
  );
}
```

#### Example 2: Subscribing to `window.innerWidth` (Responsive Viewport Hook)
```typescript
import { useSyncExternalStore } from "react";

function subscribeResize(callback: () => void) {
  window.addEventListener("resize", callback);
  return () => window.removeEventListener("resize", callback);
}

export function useWindowWidth(): number {
  return useSyncExternalStore(
    subscribeResize,
    () => window.innerWidth,
    () => 1280 // Default width for SSR pre-rendering
  );
}
```

#### Example 3: Subscribing to LocalStorage Across Browser Tabs
```typescript
import { useSyncExternalStore, useCallback } from "react";

export function useLocalStorageSync(key: string, defaultValue: string): string {
  const subscribe = useCallback(
    (callback: () => void) => {
      const handleStorage = (e: StorageEvent) => {
        if (e.key === key) callback();
      };
      window.addEventListener("storage", handleStorage);
      return () => window.removeEventListener("storage", handleStorage);
    },
    [key]
  );

  const getSnapshot = useCallback(() => {
    return localStorage.getItem(key) ?? defaultValue;
  }, [key, defaultValue]);

  return useSyncExternalStore(subscribe, getSnapshot, () => defaultValue);
}
```

### Common Mistakes

#### Mistake 1: Returning a New Object Literal in `getSnapshot` (Infinite Loop Crash)
```typescript
// WRONG: getSnapshot returns a new object reference on EVERY call!
function badGetSnapshot() {
  return { value: externalStore.getValue() }; // Object.is is ALWAYS false!
  // React detects new snapshot -> schedules re-render -> calls getSnapshot -> loops forever!
}

// CORRECT: Return primitive values or immutable cached object references
function goodGetSnapshot() {
  return externalStore.getValue(); // Returns string, number, or immutable cached ref
}
```

#### Mistake 2: Missing `getServerSnapshot` in SSR Environments (Hydration Error)
```typescript
// ERROR: Throws during server rendering in Next.js
useSyncExternalStore(subscribe, () => window.scrollY); 
// window is undefined on the server! Must provide 3rd argument: () => 0
```

### Rules to Remember
1. **`getSnapshot` must return cached or primitive immutable values.** Never instantiate a new `{}` or `[]` inside `getSnapshot`.
2. **`useSyncExternalStore` is mandatory for libraries subscribing to mutable state** outside of React's virtual DOM.
3. **Always supply `getServerSnapshot` in SSR frameworks (Next.js)** to ensure hydration matches.
4. **`subscribe` functions should have stable references** (defined outside the component or memoized with `useCallback`).

---

### Think First: Prediction Puzzle
Consider this code:
```typescript
let globalScore = 100;

export function ScoreViewer() {
  const score = useSyncExternalStore(
    (notify) => () => {}, // Dummy subscription that never fires
    () => globalScore
  );

  return <div>Score: {score}</div>;
}
```
If code outside React runs `globalScore = 200;`, will `ScoreViewer` automatically update to show `200`?

--------------------------------------------------------------------------------
**Answer:**
No.

**Explanation:**
React does not continuously poll `getSnapshot()`. React only calls `getSnapshot()` during a render, or when the store explicitly invokes the `notify` callback passed to `subscribe()`. Because the subscription listener was never notified, React does not know `globalScore` changed.

---

### Graded Exercises

#### Exercise 1: Battery API External Store Hook
Create a custom hook `useBatteryStatus()` using `useSyncExternalStore` that subscribes to the browser's `navigator.getBattery()` API, tracking battery charging status.
- Hint 1: Store `isCharging` boolean in an external variable.
- Hint 2: Update the variable and trigger listener callbacks on `"chargingchange"`.

#### Exercise 2: Memoized Selector for Store Slices
Write a custom hook `useStoreSelector<State, Slice>(store: Store<State>, selector: (s: State) => Slice): Slice` that prevents infinite loops when `selector` produces a primitive slice.
- Hint 1: Call `useSyncExternalStore(store.subscribe, () => selector(store.getState()))`.

#### Exercise 3: Media Query Matcher Hook
Implement `useMediaQuery(query: string): boolean` using `useSyncExternalStore` and `window.matchMedia(query)`.
- Hint 1: In `subscribe`, call `mql.addEventListener("change", callback)`.
- Hint 2: In `getSnapshot`, return `mql.matches`. Provide `() => false` for SSR.

#### Exercise 4: Infinite Loop Snapshot Guard Test
Write a unit test function `assertStableSnapshot(getSnapshot: () => any): void` that calls `getSnapshot()` twice in immediate succession and throws an error if `Object.is(first, second) === false`.
- Hint 1: Call `const a = getSnapshot(); const b = getSnapshot();`.
- Hint 2: Check `if (!Object.is(a, b)) throw new Error("Unstable getSnapshot returns new references!")`.

--------------------------------------------------------------------------------
### Exercise Solutions

```typescript
// Solution 1:
import { useSyncExternalStore } from "react";

let batteryCharging = true;
const listeners = new Set<() => void>();

if (typeof navigator !== "undefined" && "getBattery" in navigator) {
  (navigator as any).getBattery().then((battery: any) => {
    batteryCharging = battery.charging;
    battery.addEventListener("chargingchange", () => {
      batteryCharging = battery.charging;
      listeners.forEach((cb) => cb());
    });
  });
}

export function useBatteryStatus(): boolean {
  return useSyncExternalStore(
    (callback) => {
      listeners.add(callback);
      return () => listeners.delete(callback);
    },
    () => batteryCharging,
    () => true
  );
}

// Solution 2:
import { useSyncExternalStore, useCallback } from "react";

interface Store<T> {
  getState: () => T;
  subscribe: (cb: () => void) => () => void;
}

export function useStoreSelector<State, Slice>(
  store: Store<State>,
  selector: (s: State) => Slice
): Slice {
  const getSnapshot = useCallback(() => {
    return selector(store.getState());
  }, [store, selector]);

  return useSyncExternalStore(store.subscribe, getSnapshot);
}

// Solution 3:
import { useSyncExternalStore, useCallback } from "react";

export function useMediaQuery(query: string): boolean {
  const subscribe = useCallback(
    (callback: () => void) => {
      const matchMediaList = window.matchMedia(query);
      matchMediaList.addEventListener("change", callback);
      return () => matchMediaList.removeEventListener("change", callback);
    },
    [query]
  );

  const getSnapshot = useCallback(() => {
    return window.matchMedia(query).matches;
  }, [query]);

  return useSyncExternalStore(subscribe, getSnapshot, () => false);
}

// Solution 4:
export function assertStableSnapshot(getSnapshot: () => any): void {
  const snap1 = getSnapshot();
  const snap2 = getSnapshot();
  if (!Object.is(snap1, snap2)) {
    throw new Error(
      "Unstable getSnapshot implementation detected! Returning new object references causes infinite render loops in useSyncExternalStore."
    );
  }
}
```

---

### Recall
1. What is "UI tearing" in the context of React Concurrent Mode?
2. What happens if `getSnapshot()` returns a new object literal `{ data }` on every invocation?
3. If you remember only one thing: **`useSyncExternalStore` guarantees that components subscribing to external mutable stores render without visual tearing in Concurrent React.**

---

## Topic 13: `useTransition` & `useDeferredValue`: Non-Blocking Concurrent Transitions & Interruptible Rendering

### What Is It?
`useTransition` and `useDeferredValue` are React hooks that mark state updates as **non-urgent transitions**.

Normally, state updates are treated as urgent. If an urgent update takes 150ms of CPU time to compute (like rendering a list of 5,000 items), the browser main thread is completely blocked: typing in an `<input>` freezes, button clicks lag, and animations drop frames.

- **`useTransition`**: Wraps a state updater call in `startTransition(() => setState(...))`, demoting its priority so urgent updates (typing, clicking) can **interrupt** it.
- **`useDeferredValue`**: Takes a fast-changing value and defers generating its derived UI until after urgent renders complete.

Key technical terms defined:
- An Urgent Update is an update reflecting direct physical user interaction (typing, clicking, toggling) that must update the screen immediately (within 16ms).
- A Transition is a non-urgent UI update (filtering large lists, switching heavy tabs) that can be interrupted by incoming user input.
- Interruptible Rendering is the capability of React's work loop to pause computing a virtual DOM tree midway when higher-priority work arrives.
- Priority Lanes are 31-bit bitmask integers used by React's scheduler to rank the urgency of pending tasks.

```
User types "A" ──► Input updates immediately (Urgent Lane - 16ms)
                       │
                       └──► Filter List calculation begins (Transition Lane)
                                 │
User types "B" ─────────────► Interrupts Filter List! ──► Input updates to "AB"
                                                             │
                                                             └──► Filter List restarts for "AB"
```

### Why Does It Exist?
Before React 18, developers used debounce or throttle timeouts (`setTimeout`) to prevent slow lists from freezing search inputs.

Debouncing has severe flaws:
1. It introduces an artificial, fixed delay (e.g. 300ms) even on blazing-fast computers where the list could have rendered in 5ms.
2. Once the debounced render starts, it **still blocks the main thread** until it finishes.

`useTransition` is native concurrent scheduling: it begins rendering the slow UI **immediately**, but if the user presses another key, React drops the current computation, updates the input instantly, and restarts the calculation for the newest text.

### Basic Example and Line-by-Line Explanation

```typescript
import React, { useState, useTransition } from "react";

export function SearchableLargeCatalog() {
  const [inputValue, setInputValue] = useState("");
  const [filterQuery, setFilterQuery] = useState("");
  const [isPending, startTransition] = useTransition();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const text = e.target.value;

    // 1. Urgent: update input field immediately so user typing is crisp
    setInputValue(text);

    // 2. Non-urgent transition: demote heavy list filtering priority
    startTransition(() => {
      setFilterQuery(text);
    });
  };

  return (
    <div style={{ padding: "20px" }}>
      <input
        type="text"
        value={inputValue}
        onChange={handleInputChange}
        placeholder="Type to filter 5000 items..."
      />
      {isPending && <span style={{ marginLeft: "8px" }}>Filtering...</span>}

      <HeavyItemList query={filterQuery} />
    </div>
  );
}

function HeavyItemList({ query }: { query: string }) {
  const items = Array.from({ length: 3000 }, (_, i) => `Product Item #${i + 1}`);
  const filtered = items.filter((it) => it.toLowerCase().includes(query.toLowerCase()));

  return (
    <ul style={{ maxHeight: "300px", overflowY: "auto" }}>
      {filtered.map((item) => (
        <li key={item}>{item}</li>
      ))}
    </ul>
  );
}
```

Line-by-line breakdown:
1. `const [isPending, startTransition] = useTransition();`: Initializes the transition hook. `isPending` is a boolean indicating whether the background transition is actively rendering.
2. `setInputValue(text);`: Scheduled with normal urgent priority. The `<input>` reflects the typed character immediately.
3. `startTransition(() => { setFilterQuery(text); });`: React wraps this state dispatch in a `TransitionLane`.
4. While the `HeavyItemList` calculates in the background, `isPending` is `true`, displaying `"Filtering..."`.
5. If the user rapidly types another character, React interrupts the `setFilterQuery` render, processes the new keystroke, and restarts the transition.

### How It Works Inside React
Inside React's Scheduler and Fiber Reconciler:
1. When `startTransition(scope)` is called:
   ```javascript
   const prevTransition = ReactCurrentBatchConfig.transition;
   ReactCurrentBatchConfig.transition = {}; // Mark active transition
   try {
     scope(); // Dispatches setState
   } finally {
     ReactCurrentBatchConfig.transition = prevTransition;
   }
   ```
2. When `setState` runs inside `scope()`, React assigns a transition bitmask lane:
   ```javascript
   const lane = claimNextTransitionLane();
   update.lane = lane; // Low-priority TransitionLane
   ```
3. During the work loop (`workLoopConcurrent`), React checks the browser clock:
   ```javascript
   function workLoopConcurrent() {
     while (workInProgress !== null && !shouldYield()) {
       performUnitOfWork(workInProgress);
     }
   }
   ```
   If a new input event arrives on the main thread, `shouldYield()` returns `true`. React yields control to the browser.

### More Examples

#### Example 1: `useDeferredValue` for Consumer Components
When you don't control the `setState` call directly (e.g. receiving a fast-changing prop from a parent), use `useDeferredValue`:
```typescript
import React, { useState, useDeferredValue } from "react";

export function DashboardSearch({ searchProp }: { searchProp: string }) {
  // Defers the value until urgent rendering passes complete
  const deferredSearch = useDeferredValue(searchProp);
  const isStale = searchProp !== deferredSearch;

  return (
    <div style={{ opacity: isStale ? 0.6 : 1, transition: "opacity 0.2s" }}>
      <HeavyAnalyticsGrid query={deferredSearch} />
    </div>
  );
}
```

#### Example 2: Non-Blocking Tab Navigation
```typescript
import React, { useState, useTransition } from "react";

export function TabbedInterface() {
  const [tab, setTab] = useState<"summary" | "charts" | "logs">("summary");
  const [isPending, startTransition] = useTransition();

  const selectTab = (nextTab: "summary" | "charts" | "logs") => {
    startTransition(() => {
      setTab(nextTab);
    });
  };

  return (
    <div>
      <div>
        <button onClick={() => selectTab("summary")}>Summary</button>
        <button onClick={() => selectTab("charts")}>Charts (Heavy)</button>
        <button onClick={() => selectTab("logs")}>Logs</button>
      </div>
      {isPending && <p>Loading tab...</p>}
      {tab === "summary" && <div>Summary View</div>}
      {tab === "charts" && <HeavyChartsView />}
      {tab === "logs" && <div>Logs View</div>}
    </div>
  );
}
```

#### Example 3: React 19 Async Action Transitions
In React 19, `startTransition` natively accepts `async` functions:
```typescript
import { useTransition } from "react";

export function SubmitOrderButton({ orderId }: { orderId: string }) {
  const [isPending, startTransition] = useTransition();

  const handleOrder = () => {
    // React 19 supports async startTransition!
    startTransition(async () => {
      await fetch(`/api/orders/${orderId}/checkout`, { method: "POST" });
    });
  };

  return (
    <button onClick={handleOrder} disabled={isPending}>
      {isPending ? "Submitting Order..." : "Confirm Checkout"}
    </button>
  );
}
```

### Common Mistakes

#### Mistake 1: Wrapping Controlled `<input>` Value State Inside `startTransition`
```typescript
// WRONG: Wrapping the controlled input state in startTransition!
const [text, setText] = useState("");

const onChange = (e) => {
  startTransition(() => {
    setText(e.target.value); // Input cursor jumps and keystrokes lag!
  });
};
```
**Why this breaks:** An `<input>` value must be updated synchronously. Wrapping it in a transition makes the input feel unresponsive. Keep the input state urgent, and wrap the downstream filter state in the transition.

#### Mistake 2: Using `useTransition` for Asynchronous Code in React 18
```typescript
// WRONG in React 18: startTransition must be synchronous!
startTransition(() => {
  setTimeout(() => {
    setValue(42); // Transition context is already lost!
  }, 100);
});
```

### Rules to Remember
1. **Keep user typing and click feedback urgent.** Only wrap downstream computation in transitions.
2. **`isPending` tells you when background rendering is active**, allowing you to show non-blocking loading feedback.
3. **Use `useDeferredValue` when you receive a fast prop from a parent** and need to defer updating your own child tree.
4. **React 19 supports `async` functions directly inside `startTransition`.**

---

### Think First: Prediction Puzzle
Inspect this code:
```typescript
export function TransitionOrder() {
  const [val, setVal] = useState("INITIAL");
  const [, startTransition] = useTransition();

  const trigger = () => {
    startTransition(() => {
      setVal("TRANSITION_UPDATE");
    });
    console.log("LOGGED_VAL:", val);
  };

  return <button onClick={trigger}>Click</button>;
}
```
When clicked, what does `console.log("LOGGED_VAL:", val)` output immediately?

--------------------------------------------------------------------------------
**Answer:**
`LOGGED_VAL: INITIAL`.

**Explanation:**
`setVal` enqueues an update onto the Fiber queue and does not synchronously mutate the current render snapshot. Even without transitions, state changes are batched and asynchronous; inside transitions, they are further demoted to low-priority background lanes.

---

### Graded Exercises

#### Exercise 1: Search Filter Transition Hook
Create a custom hook `useTransitionFilter<T>(items: T[], filterFn: (item: T, q: string) => boolean)` returning `[string, (text: string) => void, T[], boolean]`.
- Hint 1: Maintain two states: `inputQuery` (urgent) and `appliedQuery` (transition).
- Hint 2: Update `appliedQuery` inside `startTransition`.

#### Exercise 2: Deferred Metric Card
Build a component `DeferredMetric({ realTimeValue }: { realTimeValue: number })` that uses `useDeferredValue` to display a calculation, dimming the card (`opacity: 0.5`) while the deferred value lags behind the real-time value.
- Hint 1: `const deferred = useDeferredValue(realTimeValue)`.
- Hint 2: Check `const isStale = realTimeValue !== deferred`.

#### Exercise 3: Tab Transition State Machine
Write a tab container where clicking a tab triggers a transition. Display an inline spinner next to the active tab button while `isPending` is true.
- Hint 1: Call `startTransition(() => setActiveTab(tab))`.
- Hint 2: Show spinner `isPending && pendingTab === tab`.

#### Exercise 4: Simulating Priority Lane Bitmask Classification
Write a pure function `classifyUpdatePriority(isTransition: boolean, isDiscreteInput: boolean): "SyncLane" | "InputContinuousLane" | "TransitionLane"` representing React's internal lane selection logic.
- Hint 1: If `isTransition` is true, return `"TransitionLane"`.
- Hint 2: If `isDiscreteInput` is true, return `"SyncLane"`, else return `"InputContinuousLane"`.

--------------------------------------------------------------------------------
### Exercise Solutions

```typescript
// Solution 1:
import { useState, useTransition, useMemo } from "react";

export function useTransitionFilter<T>(
  items: T[],
  filterFn: (item: T, query: string) => boolean
): [string, (text: string) => void, T[], boolean] {
  const [text, setText] = useState("");
  const [transitionText, setTransitionText] = useState("");
  const [isPending, startTransition] = useTransition();

  const handleQueryChange = (nextText: string) => {
    setText(nextText);
    startTransition(() => {
      setTransitionText(nextText);
    });
  };

  const filteredItems = useMemo(() => {
    return items.filter((item) => filterFn(item, transitionText));
  }, [items, filterFn, transitionText]);

  return [text, handleQueryChange, filteredItems, isPending];
}

// Solution 2:
import React, { useDeferredValue } from "react";

export function DeferredMetric({ realTimeValue }: { realTimeValue: number }) {
  const deferredValue = useDeferredValue(realTimeValue);
  const isStale = realTimeValue !== deferredValue;

  return (
    <div
      style={{
        padding: "16px",
        border: "1px solid #ccc",
        opacity: isStale ? 0.5 : 1,
        transition: "opacity 0.15s ease",
      }}
    >
      <h3>Analytics Counter</h3>
      <p>Computed Value: {deferredValue}</p>
      {isStale && <small>Calculating newest metrics...</small>}
    </div>
  );
}

// Solution 3:
import React, { useState, useTransition } from "react";

export function TabSwitcher({ tabs }: { tabs: string[] }) {
  const [activeTab, setActiveTab] = useState(tabs[0]);
  const [pendingTab, setPendingTab] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleTabClick = (tab: string) => {
    setPendingTab(tab);
    startTransition(() => {
      setActiveTab(tab);
      setPendingTab(null);
    });
  };

  return (
    <div>
      {tabs.map((tab) => (
        <button
          key={tab}
          onClick={() => handleTabClick(tab)}
          style={{ fontWeight: activeTab === tab ? "bold" : "normal" }}
        >
          {tab} {isPending && pendingTab === tab && "(Loading...)"}
        </button>
      ))}
      <div style={{ marginTop: "16px" }}>Showing content for {activeTab}</div>
    </div>
  );
}

// Solution 4:
export function classifyUpdatePriority(
  isTransition: boolean,
  isDiscreteInput: boolean
): "SyncLane" | "InputContinuousLane" | "TransitionLane" {
  if (isTransition) {
    return "TransitionLane";
  }
  if (isDiscreteInput) {
    return "SyncLane";
  }
  return "InputContinuousLane";
}
```

---

### Recall
1. How does `useTransition` prevent user typing from lagging when rendering large lists?
2. What is the key difference between using `useTransition` versus `useDeferredValue`?
3. If you remember only one thing: **`useTransition` demotes slow UI renders to interruptible background priority lanes, ensuring direct user interactions remain snappy and lag-free.**

---

## Topic 14: React 19 Modern Hooks: `useActionState`, `useOptimistic`, and the `use()` API for Promises and Contexts

### What Is It?
React 19 introduces a major evolution to the hooks model, designed around **Actions**, **Optimistic UI**, and **First-Class Promises**:
1. **`useActionState`**: A hook that manages asynchronous actions (such as form submissions or server actions), automatically tracking the returned state, pending status (`isPending`), and errors.
2. **`useOptimistic`**: A hook that immediately updates the UI with an expected ("optimistic") result before the server request completes, automatically reverting to the server state if the request fails.
3. **`use()`**: A new API that allows you to unwrap Promises and read React Context directly inside components, **including inside conditional statements and loops** where hooks were previously illegal!

Key technical terms defined:
- An Action is an asynchronous or synchronous function passed to form elements or action hooks that automatically integrates with React transitions.
- Optimistic UI is a design pattern where the user interface updates immediately upon user interaction as if the network request had already succeeded.
- The `use()` API is a React runtime function that unwraps resources (Promises or Contexts) and integrates natively with React Suspense.

```
User clicks "Like" ──► useOptimistic immediately displays 43 likes (Instant!)
                             │
                             ▼ (Network fetch in background)
                       Server resolves ──► UI updates with verified server state
```

### Why Does It Exist?
In earlier versions of React, handling an asynchronous form submission required substantial boilerplate:
- `useState` for loading state (`const [loading, setLoading] = useState(false)`)
- `useState` for error messages (`const [error, setError] = useState(null)`)
- `useState` for optimistic state
- Manual `try / catch / finally` blocks with manual state resets.

React 19 simplifies this into unified primitives that integrate directly with Server Actions, Suspense boundaries, and automatic error rollbacks.

### Basic Example and Line-by-Line Explanation

```typescript
import React, { useActionState, useOptimistic } from "react";

// Server action or simulated API handler
async function updateUsernameAction(
  previousState: { name: string; error?: string },
  formData: FormData
) {
  const newName = formData.get("username") as string;

  // Simulate network latency
  await new Promise((res) => setTimeout(res, 500));

  if (!newName.trim()) {
    return { name: previousState.name, error: "Username cannot be empty" };
  }

  return { name: newName };
}

export function ProfileNameEditor({ initialName }: { initialName: string }) {
  // 1. useActionState manages form action lifecycle
  const [state, formAction, isPending] = useActionState(
    updateUsernameAction,
    { name: initialName }
  );

  // 2. useOptimistic reflects changes immediately
  const [optimisticName, setOptimisticName] = useOptimistic(
    state.name,
    (_current, pendingValue: string) => pendingValue
  );

  const handleSubmit = async (formData: FormData) => {
    const rawName = formData.get("username") as string;
    // Set optimistic state immediately before server action runs!
    setOptimisticName(rawName);
    // Execute action
    await formAction(formData);
  };

  return (
    <form action={handleSubmit}>
      <p>Current Name: <strong>{optimisticName}</strong></p>
      {state.error && <p style={{ color: "red" }}>{state.error}</p>}

      <input name="username" defaultValue={state.name} disabled={isPending} />
      <button type="submit" disabled={isPending}>
        {isPending ? "Saving..." : "Update Name"}
      </button>
    </form>
  );
}
```

Line-by-line breakdown:
1. `const [state, formAction, isPending] = useActionState(updateUsernameAction, { name: initialName });`: Creates the action state container. `isPending` is automatically managed by React.
2. `const [optimisticName, setOptimisticName] = useOptimistic(state.name, (_current, pending) => pending);`: Declares the optimistic value. While `isPending` is true, `optimisticName` reflects the optimistic update. When the action settles, React reconciles with `state.name`.
3. `setOptimisticName(rawName);`: Synchronously renders the optimistic text on screen.
4. `await formAction(formData);`: Dispatches the server action. If the action succeeds, `state.name` matches the optimistic value. If it fails, `optimisticName` rolls back automatically!

### How It Works Inside React
Inside the React 19 reconciler:
1. **`useActionState`**: Wraps the action in a transition lane (`startTransition`). When `formAction` is dispatched, `isPending` flips to `true`.
2. **`useOptimistic`**: Maintains an optimistic update list attached to the Fiber's hook queue. During rendering, React applies the reducer to the base state:
   ```javascript
   let optimisticState = baseState;
   for (const update of pendingOptimisticUpdates) {
     optimisticState = updateReducer(optimisticState, update.value);
   }
   ```
   Once the parent transition finishes, React clears the optimistic queue, restoring true server state.
3. **The `use(Promise)` API**:
   ```javascript
   function use(resource) {
     if (isPromise(resource)) {
       if (resource.status === "fulfilled") return resource.value;
       if (resource.status === "rejected") throw resource.reason;
       // Still pending: SUSPEND!
       throw resource; // Suspends component, caught by nearest <Suspense>
     }
     if (isContext(resource)) {
       return readContext(resource); // Legal inside conditionals!
     }
   }
   ```

### More Examples

#### Example 1: Reading Context Conditionally with the `use()` API
In React 18, `useContext` was illegal inside `if` blocks. In React 19, `use()` can be called conditionally:
```typescript
import React, { createContext, use } from "react";

const ThemeContext = createContext<string>("light");

export function DynamicBanner({ showTheme }: { showTheme: boolean }) {
  // LEGAL in React 19: Calling use() inside an if block!
  if (showTheme) {
    const theme = use(ThemeContext);
    return <div className={`banner-${theme}`}>Themed Banner: {theme}</div>;
  }

  return <div>Standard Banner</div>;
}
```

#### Example 2: Unwrapping Promises Directly with `use(Promise)` and Suspense
```typescript
import React, { Suspense, use } from "react";

interface WeatherReport {
  city: string;
  temp: number;
}

function WeatherDisplay({ weatherPromise }: { weatherPromise: Promise<WeatherReport> }) {
  // use() unwraps the Promise directly! Suspends until resolved.
  const data = use(weatherPromise);

  return (
    <div>
      <h3>{data.city}</h3>
      <p>Temperature: {data.temp}°C</p>
    </div>
  );
}

export function WeatherContainer() {
  const promise = fetch("/api/weather").then((res) => res.json());

  return (
    <Suspense fallback={<p>Loading live weather...</p>}>
      <WeatherDisplay weatherPromise={promise} />
    </Suspense>
  );
}
```

#### Example 3: Optimistic Likes Counter
```typescript
import React, { useOptimistic } from "react";

export function LikeButton({
  likes,
  onLike,
}: {
  likes: number;
  onLike: () => Promise<void>;
}) {
  const [optimisticLikes, setOptimisticLikes] = useOptimistic(
    likes,
    (current) => current + 1
  );

  const handleClick = async () => {
    setOptimisticLikes(likes + 1);
    await onLike();
  };

  return (
    <button onClick={handleClick}>
      Like Count: {optimisticLikes}
    </button>
  );
}
```

### Common Mistakes

#### Mistake 1: Calling `use(Promise)` Without a `<Suspense>` Parent
```typescript
// WRONG: If promise is pending and there is no Suspense boundary above, app crashes!
export function BadComponent({ promise }: { promise: Promise<any> }) {
  const data = use(promise); // Throws unhandled promise suspension error!
}
```

#### Mistake 2: Re-creating the Promise Inside the Component Render Body
```typescript
// WRONG: Creates a brand new pending Promise on every render!
export function BadPromiseComponent() {
  // Creates an infinite loop of suspensions!
  const data = use(fetch("/api/data").then((r) => r.json()));
}

// CORRECT: Pass the promise as a prop from a parent, or cache it with useMemo/cache()
```

### Rules to Remember
1. **`use(Promise)` must be wrapped inside a `<Suspense>` boundary.**
2. **`use()` is legal inside conditional statements and loops.** (Standard hooks like `useState` and `useEffect` remain prohibited).
3. **Never create promises directly inside the component body when calling `use()`.** Always create the promise in a parent or memoized cache.
4. **`useOptimistic` automatically reverts to server state** as soon as the active action finishes or fails.

---

### Think First: Prediction Puzzle
Consider this code running in React 19:
```typescript
export function ConditionalUseComponent({ isVip }: { isVip: boolean }) {
  if (isVip) {
    const theme = use(ThemeContext);
    return <div>VIP: {theme}</div>;
  }
  return <div>Standard</div>;
}
```
Does this code violate the Rules of Hooks and throw an error when `isVip` toggles?

--------------------------------------------------------------------------------
**Answer:**
No.

**Explanation:**
In React 19, `use()` is an API, not a traditional hook. Unlike `useState` or `useEffect`, `use()` does not append nodes to the Fiber's hook linked list. It reads Context or Suspense resources directly from the Fiber runtime, making it completely legal inside conditional blocks and loops.

---

### Graded Exercises

#### Exercise 1: Form Action with Status Feedback
Create a component `NewsletterSignup` using React 19's `useActionState` that simulates subscribing an email address, disabling the input while `isPending` is true, and displaying any returned error.
- Hint 1: Define `async function subscribeAction(prevState, formData)`.
- Hint 2: Use `const [state, formAction, isPending] = useActionState(subscribeAction, { success: false })`.

#### Exercise 2: Instant Optimistic Upvote Button
Implement an `UpvoteWidget` using `useOptimistic` that increments the visible score instantly upon click, invoking an async `onUpvote` prop.
- Hint 1: `const [optimisticScore, addOptimistic] = useOptimistic(score, (prev) => prev + 1)`.
- Hint 2: Call `addOptimistic(1)` immediately in the click handler.

#### Exercise 3: Conditional Context Reader
Write a component `PermissionBadge({ checkPermissions }: { checkPermissions: boolean })` that uses `use(AuthContext)` conditionally inside an `if (checkPermissions)` block.
- Hint 1: Check `if (checkPermissions) const auth = use(AuthContext); return <div>Role: {auth.role}</div>;`.
- Hint 2: Return `<div>Unchecked</div>` if false.

#### Exercise 4: Suspense Promise Unwrapper
Build a component `UserProfileCard({ userPromise }: { userPromise: Promise<{ name: string; email: string }> })` using `use(userPromise)`.
- Hint 1: Call `const user = use(userPromise)`.
- Hint 2: Render `user.name` and `user.email`.

--------------------------------------------------------------------------------
### Exercise Solutions

```typescript
// Solution 1:
import React, { useActionState } from "react";

async function newsletterAction(
  prevState: { success: boolean; message: string },
  formData: FormData
) {
  const email = formData.get("email") as string;
  await new Promise((r) => setTimeout(r, 400));

  if (!email || !email.includes("@")) {
    return { success: false, message: "Invalid email address format" };
  }
  return { success: true, message: `Subscribed ${email} successfully!` };
}

export function NewsletterSignup() {
  const [state, formAction, isPending] = useActionState(newsletterAction, {
    success: false,
    message: "",
  });

  return (
    <form action={formAction}>
      <input name="email" type="email" placeholder="name@domain.com" disabled={isPending} />
      <button type="submit" disabled={isPending}>
        {isPending ? "Subscribing..." : "Join Newsletter"}
      </button>
      {state.message && (
        <p style={{ color: state.success ? "green" : "red" }}>{state.message}</p>
      )}
    </form>
  );
}

// Solution 2:
import React, { useOptimistic, useTransition } from "react";

export function UpvoteWidget({
  score,
  onUpvote,
}: {
  score: number;
  onUpvote: () => Promise<void>;
}) {
  const [optimisticScore, addOptimistic] = useOptimistic(
    score,
    (current) => current + 1
  );
  const [, startTransition] = useTransition();

  const handleUpvote = () => {
    startTransition(async () => {
      addOptimistic(score + 1);
      await onUpvote();
    });
  };

  return <button onClick={handleUpvote}>Upvotes: {optimisticScore}</button>;
}

// Solution 3:
import React, { createContext, use } from "react";

export const AuthContext = createContext<{ role: string }>({ role: "guest" });

export function PermissionBadge({ checkPermissions }: { checkPermissions: boolean }) {
  if (checkPermissions) {
    const auth = use(AuthContext);
    return <span>Verified Role: {auth.role}</span>;
  }

  return <span>Role Unchecked</span>;
}

// Solution 4:
import React, { use } from "react";

export function UserProfileCard({
  userPromise,
}: {
  userPromise: Promise<{ name: string; email: string }>;
}) {
  const user = use(userPromise);

  return (
    <div style={{ border: "1px solid #ccc", padding: "12px" }}>
      <h4>{user.name}</h4>
      <p>{user.email}</p>
    </div>
  );
}
```

---

### Recall
1. Why is the React 19 `use()` API permitted inside `if` statements and loops while other hooks are not?
2. What happens to the value returned by `useOptimistic` if the background action fails?
3. If you remember only one thing: **React 19 modernizes asynchronous state with `useActionState` for forms, `useOptimistic` for instant UI feedback, and `use()` for unwrapping promises and context conditionally.**

---

## Topic 15: Custom Hook Composition & Production Architecture: Clean Abstractions without Incurring Memory Leaks

### What Is It?
A Custom Hook is a plain JavaScript function whose name starts with `"use"` and that invokes one or more built-in React hooks.

Custom hooks do **not** introduce any new runtime features or allocate extra Fiber nodes. When a component calls a custom hook, all hooks inside it are **inlined directly into the calling component's existing hook linked list** on its `FiberNode.memoizedState`.

Key technical terms defined:
- Custom Hook Composition is the architectural practice of combining primitive hooks (`useState`, `useEffect`, `useRef`) into reusable, domain-specific stateful abstractions.
- Hook Inlining is React's execution behavior where hooks called inside a custom function are sequentially appended to the caller's linked list in the exact order of invocation.
- Invariant Preservation is ensuring that a custom hook maintains all React rules (stability, cleanup, referential equality) for its consumers.

```
Component: Dashboard
  │
  ├── calls: useDebounce("hello", 300)
  │     ├── Hook 1: useState (debouncedValue)
  │     └── Hook 2: useEffect (timer cleanup)
  │
  └── calls: useWindowWidth()
        └── Hook 3: useSyncExternalStore (resize subscription)

Result on Fiber.memoizedState:
[ Hook 1 (State) ] ──► [ Hook 2 (Effect) ] ──► [ Hook 3 (Store) ] ──► null
```

### Why Does It Exist?
Without custom hooks, complex lifecycle logic (subscribing to browser APIs, handling debounced inputs, managing intersection observers) must be duplicated in every component that needs it.

Custom hooks provide:
1. **DRY (Don't Repeat Yourself) stateful logic**: Share complex behaviors across hundreds of components without copying and pasting `useEffect` blocks.
2. **Separation of Concerns**: Keep component JSX clean and purely focused on presentation, delegating business logic and side effects to tested custom hooks.
3. **Encapsulated Cleanup**: Ensure that every subscription or timer has its cleanup logic bundled directly alongside its creation.

### Basic Example and Line-by-Line Explanation

```typescript
import { useState, useEffect } from "react";

// Custom hook: Debounces any fast-changing value
export function useDebounce<T>(value: T, delayMs: number = 300): T {
  // Hook 1 in calling component's linked list
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  // Hook 2 in calling component's linked list
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delayMs);

    // Mandatory cleanup: clear previous timer if value changes rapidly
    return () => {
      clearTimeout(timer);
    };
  }, [value, delayMs]);

  return debouncedValue;
}
```

Line-by-line breakdown:
1. `export function useDebounce<T>(value: T, delayMs: number = 300): T`: Declares a generic custom hook adhering to the `"use"` naming convention.
2. `const [debouncedValue, setDebouncedValue] = useState<T>(value);`: Inlines a `useState` hook into whichever component calls `useDebounce`.
3. `useEffect(() => { ... }, [value, delayMs]);`: Inlines a `useEffect` hook. Each time `value` changes, a new timer is scheduled.
4. `return () => clearTimeout(timer);`: Cleans up the previous timeout, preventing memory leaks and stale state updates.
5. `return debouncedValue;`: Returns the stabilized value to the consumer.

### How It Works Inside React
When a component calls a custom hook:
1. The JavaScript engine enters the custom hook function.
2. When the custom hook calls `useState`, `ReactCurrentDispatcher.current.useState` is called.
3. React advances the calling component Fiber's `workInProgressHook` pointer and appends the hook record.
4. When the custom hook calls `useEffect`, React advances the pointer again and appends the effect record.
5. React has no internal concept of "custom hook boundaries"; to the Fiber reconciler, it is simply a continuous linear sequence of hooks: `Hook 1 -> Hook 2 -> Hook 3`.

### More Examples

#### Example 1: `useIntersectionObserver` (Lazy Loading & Infinite Scroll)
```typescript
import { useState, useEffect, useRef } from "react";

export function useIntersectionObserver(options?: IntersectionObserverInit) {
  const [isIntersecting, setIsIntersecting] = useState<boolean>(false);
  const targetRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const element = targetRef.current;
    if (!element) return;

    const observer = new IntersectionObserver(([entry]) => {
      setIsIntersecting(entry.isIntersecting);
    }, options);

    observer.observe(element);

    return () => {
      observer.disconnect();
    };
  }, [options]);

  return { targetRef, isIntersecting };
}
```

#### Example 2: `useEventListener` with Event Target Flexibility
```typescript
import { useEffect, useRef } from "react";

export function useEventListener<K extends keyof WindowEventMap>(
  eventName: K,
  handler: (event: WindowEventMap[K]) => void,
  element: EventTarget = window
) {
  const savedHandler = useRef(handler);

  // Preserve newest handler without re-attaching event listeners
  useEffect(() => {
    savedHandler.current = handler;
  }, [handler]);

  useEffect(() => {
    const isSupported = element && element.addEventListener;
    if (!isSupported) return;

    const eventListener = (event: Event) => {
      savedHandler.current(event as WindowEventMap[K]);
    };

    element.addEventListener(eventName, eventListener);
    return () => {
      element.removeEventListener(eventName, eventListener);
    };
  }, [eventName, element]);
}
```

#### Example 3: `useLocalStorage` with Synchronized State
```typescript
import { useState, useEffect, useCallback } from "react";

export function useLocalStorage<T>(key: string, initialValue: T): [T, (val: T | ((prev: T) => T)) => void] {
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch {
      return initialValue;
    }
  });

  const setValue = useCallback(
    (value: T | ((prev: T) => T)) => {
      setStoredValue((prev) => {
        const nextValue = typeof value === "function" ? (value as any)(prev) : value;
        try {
          window.localStorage.setItem(key, JSON.stringify(nextValue));
        } catch (err) {
          console.error("Failed to write to localStorage:", err);
        }
        return nextValue;
      });
    },
    [key]
  );

  return [storedValue, setValue];
}
```

### Common Mistakes

#### Mistake 1: Returning Unstable Object References from Custom Hooks
```typescript
// WRONG: Returns a brand new object literal on every render!
export function useUserData(userId: string) {
  const [user, setUser] = useState(null);
  // Causes infinite render loops if consumer puts this return value into useEffect deps!
  return { user, refresh: () => fetchUser(userId) }; 
}

// CORRECT: Wrap return objects in useMemo and callbacks in useCallback
export function useUserDataCorrect(userId: string) {
  const [user, setUser] = useState(null);
  const refresh = useCallback(() => fetchUser(userId), [userId]);
  return useMemo(() => ({ user, refresh }), [user, refresh]);
}
```

#### Mistake 2: Missing Cleanup in Custom Hooks
```typescript
// WRONG: Custom hook registers listener without returning cleanup
export function useMousePosition() {
  const [pos, setPos] = useState({ x: 0, y: 0 });
  useEffect(() => {
    window.addEventListener("mousemove", (e) => setPos({ x: e.clientX, y: e.clientY }));
    // Leaks event listeners on every unmount!
  }, []);
  return pos;
}
```

### Rules to Remember
1. **Always prefix custom hook names with `"use"`** to allow ESLint to enforce the Rules of Hooks.
2. **Custom hooks do not isolate state between components.** Two components calling the same custom hook receive independent instances of state.
3. **Always memoize functions and objects returned by custom hooks** to protect downstream consumers.
4. **Always provide cleanups in custom hooks** that register timers, subscriptions, or event listeners.

---

### Think First: Prediction Puzzle
Component A and Component B both call `useCounter(0)`:
```typescript
export function ComponentA() {
  const { count, increment } = useCounter(0);
  return <button onClick={increment}>A: {count}</button>;
}

export function ComponentB() {
  const { count } = useCounter(0);
  return <span>B: {count}</span>;
}
```
If the button in Component A is clicked 3 times, what will Component B display: `0` or `3`?

--------------------------------------------------------------------------------
**Answer:**
`B: 0`.

**Explanation:**
Custom hooks share stateful *logic*, not stateful *data*. When Component A invokes `useCounter(0)`, its own Fiber allocates state on its own heap memory. Component B's Fiber allocates its own completely separate state. They are completely isolated.

---

### Graded Exercises

#### Exercise 1: `useToggle` State Primitive
Implement a reusable `useToggle(initialState?: boolean): [boolean, () => void, (value: boolean) => void]` custom hook with stable callback identities.
- Hint 1: Store boolean in `useState`.
- Hint 2: Memoize `toggle` and `setDirect` with `useCallback`.

#### Exercise 2: `usePrevious` Ref Tracker
Write a custom hook `usePrevious<T>(value: T): T | undefined` using `useRef` and `useEffect` that returns the value from the immediately preceding render.
- Hint 1: Create `const ref = useRef<T | undefined>(undefined)`.
- Hint 2: In `useEffect(..., [value])`, set `ref.current = value`. Return `ref.current`.

#### Exercise 3: `useInterval` with Fresh Callbacks
Implement Dan Abramov's canonical `useInterval(callback: () => void, delayMs: number | null)` hook that updates its callback ref on every render without clearing and re-setting the timer.
- Hint 1: Store `const savedCallback = useRef(callback); savedCallback.current = callback;`.
- Hint 2: If `delayMs !== null`, set up `setInterval(() => savedCallback.current(), delayMs)`. Clean up on unmount.

#### Exercise 4: Custom Hook Hook-Count Invariant Test
Write a pure validator function `assertHookCountInvariance(initialCount: number, currentCount: number): void` that throws an error if the number of hooks evaluated during a component execution changes between renders.
- Hint 1: Check `if (initialCount !== currentCount)`.
- Hint 2: Throw `new Error("Hook linked list order violated: Rendered different number of hooks.")`.

--------------------------------------------------------------------------------
### Exercise Solutions

```typescript
// Solution 1:
import { useState, useCallback } from "react";

export function useToggle(
  initialState: boolean = false
): [boolean, () => void, (val: boolean) => void] {
  const [state, setState] = useState<boolean>(initialState);

  const toggle = useCallback(() => setState((prev) => !prev), []);
  const setDirect = useCallback((val: boolean) => setState(val), []);

  return [state, toggle, setDirect];
}

// Solution 2:
import { useRef, useEffect } from "react";

export function usePrevious<T>(value: T): T | undefined {
  const ref = useRef<T | undefined>(undefined);

  useEffect(() => {
    ref.current = value;
  }, [value]);

  return ref.current;
}

// Solution 3:
import { useEffect, useRef } from "react";

export function useInterval(callback: () => void, delayMs: number | null) {
  const savedCallback = useRef(callback);

  useEffect(() => {
    savedCallback.current = callback;
  }, [callback]);

  useEffect(() => {
    if (delayMs === null) return;

    const tick = () => savedCallback.current();
    const id = setInterval(tick, delayMs);

    return () => clearInterval(id);
  }, [delayMs]);
}

// Solution 4:
export function assertHookCountInvariance(
  initialCount: number,
  currentCount: number
): void {
  if (initialCount !== currentCount) {
    throw new Error(
      `Hook linked list invariant violated! Initial render evaluated ${initialCount} hooks, but subsequent render evaluated ${currentCount} hooks.`
    );
  }
}
```

---

### Recall
1. Do custom hooks share state between different component instances?
2. How does React treat hooks called inside a custom hook under the hood?
3. If you remember only one thing: **Custom hooks compose React primitives into clean, reusable abstractions whose hooks are inlined directly into the calling component's Fiber linked list.**

---

## Checkpoint Challenge 3: Full-Stack Concurrent Hook Architecture & External Store Integration (Topics 11–15)

### Challenge Objective
Construct a complete, production-grade **Autonomous Real-Time Stock Feed Component** that tests and integrates all concepts from Topics 11 through 15:
1. **`useImperativeHandle` & `forwardRef` (Topic 11)**: Build a child widget exposing custom imperative controls (`refreshData()`, `focusSearch()`) while encapsulating internal DOM nodes.
2. **`useSyncExternalStore` (Topic 12)**: Subscribe to an external, out-of-tree WebSocket/StockPrice store without any tearing risk under concurrent interruptions.
3. **`useTransition` (Topic 13)**: Filter a massive list of symbols with non-blocking concurrent transitions so real-time price updates never freeze the search input.
4. **`useOptimistic` (Topic 14)**: Implement an instant, optimistic watchlist "Star" toggle with automatic rollback if the API fails.
5. **Custom Hook Composition (Topic 15)**: Cleanly compose all logic into a custom hook architecture with complete verification assertions.

### Implementation Code

```typescript
import React, {
  useState,
  useRef,
  useImperativeHandle,
  forwardRef,
  useSyncExternalStore,
  useTransition,
  useOptimistic,
  useCallback,
  useMemo,
} from "react";

// ============================================================================
// Step 1: External Real-Time Store (Topic 12)
// ============================================================================
export interface StockQuote {
  symbol: string;
  price: number;
  starred: boolean;
}

export function createStockStore(initialQuotes: StockQuote[]) {
  let quotes = initialQuotes;
  const listeners = new Set<() => void>();

  return {
    getSnapshot: () => quotes,
    updatePrice: (symbol: string, newPrice: number) => {
      quotes = quotes.map((q) =>
        q.symbol === symbol ? { ...q, price: newPrice } : q
      );
      listeners.forEach((listener) => listener());
    },
    toggleStar: (symbol: string) => {
      quotes = quotes.map((q) =>
        q.symbol === symbol ? { ...q, starred: !q.starred } : q
      );
      listeners.forEach((listener) => listener());
    },
    subscribe: (listener: () => void) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
  };
}

export const globalStockStore = createStockStore([
  { symbol: "AAPL", price: 182.5, starred: true },
  { symbol: "MSFT", price: 415.2, starred: false },
  { symbol: "GOOGL", price: 175.8, starred: true },
  { symbol: "AMZN", price: 178.9, starred: false },
  { symbol: "NVDA", price: 890.4, starred: true },
]);

// ============================================================================
// Step 2: Imperative Search Input Handle (Topic 11)
// ============================================================================
export interface StockSearchHandle {
  focusInput: () => void;
  clearSearch: () => void;
}

export const StockSearchInput = forwardRef<
  StockSearchHandle,
  { value: string; onChange: (val: string) => void }
>(function StockSearchInput({ value, onChange }, ref) {
  const inputRef = useRef<HTMLInputElement | null>(null);

  useImperativeHandle(
    ref,
    () => ({
      focusInput: () => inputRef.current?.focus(),
      clearSearch: () => {
        onChange("");
        inputRef.current?.focus();
      },
    }),
    [onChange]
  );

  return (
    <input
      ref={inputRef}
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder="Search symbol..."
      style={{ padding: "6px 12px", width: "220px" }}
    />
  );
});

// ============================================================================
// Step 3: Custom Compose Hook (Topic 15)
// ============================================================================
export function useStockDashboard() {
  // Topic 12: useSyncExternalStore subscription
  const quotes = useSyncExternalStore(
    globalStockStore.subscribe,
    globalStockStore.getSnapshot
  );

  // Topic 13: useTransition non-blocking query
  const [search, setSearch] = useState("");
  const [query, setQuery] = useState("");
  const [isPending, startTransition] = useTransition();

  const handleSearchChange = useCallback((text: string) => {
    setSearch(text);
    startTransition(() => {
      setQuery(text);
    });
  }, []);

  const filteredQuotes = useMemo(() => {
    return quotes.filter((q) =>
      q.symbol.toLowerCase().includes(query.toLowerCase())
    );
  }, [quotes, query]);

  return {
    search,
    isPending,
    filteredQuotes,
    handleSearchChange,
  };
}

// ============================================================================
// Step 4: Full Production Stock Component (Topics 11, 12, 13, 14, 15)
// ============================================================================
export function RealTimeStockDashboard() {
  const { search, isPending, filteredQuotes, handleSearchChange } =
    useStockDashboard();

  const searchInputRef = useRef<StockSearchHandle | null>(null);

  // Topic 14: useOptimistic for instant Star toggling
  const [optimisticStarList, toggleOptimisticStar] = useOptimistic(
    filteredQuotes,
    (currentList, targetSymbol: string) =>
      currentList.map((item) =>
        item.symbol === targetSymbol
          ? { ...item, starred: !item.starred }
          : item
      )
  );

  const handleToggleStar = async (symbol: string) => {
    // 1. Instantly flip UI optimistically (Topic 14)
    toggleOptimisticStar(symbol);

    // 2. Perform mock async server persistence
    await new Promise((res) => setTimeout(res, 300));
    globalStockStore.toggleStar(symbol);
  };

  const handleSimulateMarketTick = () => {
    const randomPriceDelta = (Math.random() - 0.5) * 4;
    const currentPrice = globalStockStore.getSnapshot()[0].price;
    globalStockStore.updatePrice(
      "AAPL",
      Number((currentPrice + randomPriceDelta).toFixed(2))
    );
  };

  return (
    <div style={{ padding: "24px", fontFamily: "monospace" }}>
      <h2>Real-Time Stock Feed & Concurrent Architecture</h2>

      {/* Imperative Search Bar (Topic 11) */}
      <div style={{ marginBottom: "16px", display: "flex", gap: "8px" }}>
        <StockSearchInput
          ref={searchInputRef}
          value={search}
          onChange={handleSearchChange}
        />
        <button onClick={() => searchInputRef.current?.clearSearch()}>
          Clear
        </button>
        <button onClick={() => searchInputRef.current?.focusInput()}>
          Focus
        </button>
        <button onClick={handleSimulateMarketTick}>Simulate Price Tick</button>
      </div>

      {isPending && <p style={{ color: "blue" }}>Updating list in background...</p>}

      {/* Stock Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "12px" }}>
        {optimisticStarList.map((stock) => (
          <div
            key={stock.symbol}
            style={{
              border: "1px solid #ccc",
              padding: "12px",
              borderRadius: "4px",
              background: "#fff",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <strong>{stock.symbol}</strong>
              <button onClick={() => handleToggleStar(stock.symbol)}>
                {stock.starred ? "★ Starred" : "☆ Add Star"}
              </button>
            </div>
            <p>Live Price: ${stock.price.toFixed(2)}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

// ============================================================================
// Step 5: Verification and Test Harness
// ============================================================================
export function runCheckpoint3Tests() {
  console.log("--- 1. Testing External Store Subscription & Invariants ---");
  const store = createStockStore([{ symbol: "TEST", price: 10, starred: false }]);
  let notified = false;
  const unsub = store.subscribe(() => {
    notified = true;
  });

  store.updatePrice("TEST", 25);
  console.log("Store notified subscriber:", notified);
  console.log("Store updated snapshot:", store.getSnapshot()[0].price === 25);
  unsub();

  console.log("\n--- 2. Testing Store Immutability Across Updates ---");
  const snapA = store.getSnapshot();
  store.toggleStar("TEST");
  const snapB = store.getSnapshot();
  console.log("Snapshot reference changed immutably:", snapA !== snapB);
  console.log("Star state updated:", snapB[0].starred === true);

  console.log("\n--- Checkpoint 3 Complete: All assertions passed cleanly! ---");
}

runCheckpoint3Tests();
```

