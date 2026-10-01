# MODULE REACT-03 — HOOKS INTERNALS & EXECUTION MODEL
## Singly-Linked Lists, Dispatcher Polymorphism & Stale Closure Mechanics

---

# 01. WHERE DOES HOOK STATE ACTUALLY LIVE?

### What is it?
Functional components in JavaScript are plain functions that execute and return JSX. When a function finishes running, its local variables are normally cleaned up from the call stack.

In React, hook state does **NOT** live inside the component function. It lives in a **singly-linked list of Hook objects** stored directly on the Fiber node's `memoizedState` property in heap memory.

```javascript
// A single Hook record in React runtime
function Hook() {
  this.memoizedState = null; // The stored state, effect, ref, or memoized value
  this.baseState = null;     // Base state before pending updates
  this.baseQueue = null;     // Unprocessed updates from previous renders
  this.queue = null;         // UpdateQueue for incoming setState dispatches
  this.next = null;          // Pointer to the NEXT Hook in this component
}
```

```text
FiberNode (for MyComponent)
    │
    └── memoizedState ──► Hook 1 (useState: count)
                            │ next
                            ▼
                          Hook 2 (useEffect: log)
                            │ next
                            ▼
                          Hook 3 (useRef: inputRef) ──► next: null
```

---

### Why does it exist?
Before React 16.8, stateful logic required class components (`class Button extends React.Component`) because class instances (`this.state`) persist in heap memory between method calls.

Hooks allow functional components to remain pure JavaScript functions while borrowing state from the component's underlying Fiber node.

---

# 02. DISPATCHER POLYMORPHISM: MOUNT VS UPDATE

React switches the implementation of `useState`, `useEffect`, and other hooks depending on whether a component is rendering for the first time (**mount**) or subsequent times (**update**).

This is implemented using a global dispatcher pointer:

```javascript
// React maintains an active dispatcher reference:
const ReactCurrentDispatcher = {
  current: null
};

// During first mount:
ReactCurrentDispatcher.current = HooksDispatcherOnMount;

// During re-render updates:
ReactCurrentDispatcher.current = HooksDispatcherOnUpdate;
```

### Mount Phase (`HooksDispatcherOnMount`):
1. Calling `useState(initialValue)` creates a new `Hook` object.
2. The initial value is computed and written to `hook.memoizedState`.
3. The new Hook is appended to the end of the Fiber's linked list using `workInProgressHook.next = newHook`.
4. A bound dispatch function is returned: `[hook.memoizedState, dispatchSetState.bind(null, fiber, queue)]`.

### Update Phase (`HooksDispatcherOnUpdate`):
1. Calling `useState(initialValue)` does **NOT** look at `initialValue`.
2. React advances its pointer: `workInProgressHook = currentHook.next`.
3. It takes the pending updates from `hook.queue`, processes them in order, and produces the new state.
4. It writes the result to `hook.memoizedState` and returns `[newMemoizedState, existingDispatch]`.

---

# 03. HOW DIFFERENT HOOKS STORE DATA

Every React hook stores its data differently inside `hook.memoizedState`:

```text
┌──────────────────┬────────────────────────────────────────────────────────────┐
│ Hook             │ Content of hook.memoizedState                              │
├──────────────────┼────────────────────────────────────────────────────────────┤
│ useState         │ Stored state value (e.g., number, string, object)          │
│ useReducer       │ Stored reduced state value                                 │
│ useRef           │ Object containing `{ current: initialValue }`              │
│ useMemo          │ Tuple array: `[computedValue, dependenciesArray]`          │
│ useCallback      │ Tuple array: `[callbackFunction, dependenciesArray]`       │
│ useEffect        │ Effect object containing `{ tag, create, destroy, deps }`  │
│ useLayoutEffect  │ Effect object with layout commit tag                       │
└──────────────────┴────────────────────────────────────────────────────────────┘
```

### `useRef` Internals:
`useRef` is the simplest hook in React:
```javascript
function mountRef(initialValue) {
  const hook = mountWorkInProgressHook();
  const ref = { current: initialValue };
  hook.memoizedState = ref;
  return ref;
}

function updateRef() {
  const hook = updateWorkInProgressHook();
  return hook.memoizedState; // Returns the EXACT same object reference!
}
```
Because `hook.memoizedState` returns the exact same object reference on every render, changing `ref.current = 42` mutates the property without scheduling a re-render.

---

# 04. WHY THE "RULES OF HOOKS" ARE MANDATORY

React does **NOT** identify hooks by name, string key, or type. It identifies hooks strictly by their **numerical index in the linked list**.

### What happens if you put a hook inside an `if` statement?

```javascript
// WRONG: CONDITIONAL HOOK
function UserProfile({ isPremium }) {
  const [name, setName] = useState('Alex'); // Hook 1

  if (isPremium) {
    const [reward, setReward] = useState(100); // Hook 2 (Only if premium!)
  }

  const [theme, setTheme] = useState('dark'); // Hook 3? Or Hook 2?
}
```

### Trace the Runtime Bug:
1. **On Mount (`isPremium = true`)**:
   - Hook 1 -> `name` (`'Alex'`)
   - Hook 2 -> `reward` (`100`)
   - Hook 3 -> `theme` (`'dark'`)
2. **On Re-render (`isPremium = false`)**:
   - Call 1 (`useState('Alex')`): React reads Hook 1 -> gets `'Alex'`. Correct.
   - The `if` condition is skipped!
   - Call 2 (`useState('dark')`): React reads Hook 2!
   - Hook 2 in the Fiber list is `reward` with value `100`!
   - React assigns `100` to `theme`!
   - All subsequent hooks read data from the wrong pointer. State is permanently corrupted.

This is why hooks must always be called at the top level of a component, unconditionally.

---

# 05. STALE CLOSURES IN REACT HOOKS

A **stale closure** occurs when an asynchronous function or event handler captures a variable from an old render cycle and continues reading that outdated value.

```javascript
function Counter() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      // Bug: `count` is captured from the initial render (0)
      setCount(count + 1);
    }, 1000);

    return () => clearInterval(timer);
  }, []); // Empty deps: effect runs only once

  return <h1>{count}</h1>;
}
```

Output:
The counter displays `1` after one second, and then **stays at 1 forever**.

Why:
- The callback passed to `setInterval` was created during render 0, when `count` was `0`.
- The closure retains a heap pointer to that lexical scope where `count === 0`.
- Every second, `setInterval` runs `setCount(0 + 1)`. It repeatedly sets state to `1`.

### The Solution: Functional Updates
Instead of passing a raw value to `setState`, pass an updater function:
```javascript
setCount(prevCount => prevCount + 1);
```
When using an updater function, React does not read from the closure. It reads the latest state directly from `hook.queue.pending` at the moment of execution.

---

# 06. RULES TO REMEMBER

1. Hook state lives in a singly-linked list on the Fiber node's `memoizedState`.
2. Hooks are identified strictly by their order of execution; never call hooks inside conditions, loops, or nested functions.
3. React uses two distinct dispatchers: `HooksDispatcherOnMount` for first render and `HooksDispatcherOnUpdate` for re-renders.
4. `useRef` simply stores an object `{ current: initialValue }` on `hook.memoizedState`.
5. Pass functional updaters (`setState(prev => ... )`) to prevent stale closures in async effects.

---

# 07. EXERCISES

#### Question 1 (Predict the output)
What will be logged to the console?
```javascript
function Component() {
  const [value, setValue] = useState(1);

  const handleClick = () => {
    setValue(value + 1);
    setValue(value + 1);
    setValue(value + 1);
  };

  console.log("Rendered with:", value);
  return <button onClick={handleClick}>Click</button>;
}
```

#### Question 2 (Find and fix the bug)
The following custom hook causes a stale closure bug where `savedCallback` is never updated. Fix it.
```javascript
function useInterval(callback, delay) {
  const savedCallback = useRef();

  useEffect(() => {
    savedCallback.current = callback;
  }, []); // <-- Bug here

  useEffect(() => {
    const id = setInterval(() => savedCallback.current(), delay);
    return () => clearInterval(id);
  }, [delay]);
}
```

#### Question 3 (Write code from scratch)
Write a minimal pure JavaScript model of `useState` that supports a linked list of 2 state hooks across 3 render cycles.

#### Question 4 (Explain in your own words)
Explain the difference between `useEffect` and `useLayoutEffect` in terms of the browser event loop and DOM painting.

---

# 08. SOLUTIONS

#### Solution for Question 1
Answer:
When clicked, the component logs:
`Rendered with: 2`
Explanation:
In the click handler, `value` is `1`. Each call executes `setValue(1 + 1)`. In React 18+, automatic batching bundles all three updates together. Since all three updates set the value to `2`, the next render receives `2`, not `4`.

---

#### Solution for Question 2
Corrected code:
```javascript
function useInterval(callback, delay) {
  const savedCallback = useRef(callback);

  // Update ref on every render cycle without restarting timer:
  useEffect(() => {
    savedCallback.current = callback;
  });

  useEffect(() => {
    if (delay !== null) {
      const id = setInterval(() => savedCallback.current(), delay);
      return () => clearInterval(id);
    }
  }, [delay]);
}
```

---

#### Solution for Question 3
Code:
```javascript
let workInProgressHook = null;
const fiber = { memoizedState: null };
let isMount = true;

function useState(initialValue) {
  let hook;
  if (isMount) {
    hook = { memoizedState: initialValue, next: null };
    if (!fiber.memoizedState) {
      fiber.memoizedState = hook;
    } else {
      workInProgressHook.next = hook;
    }
    workInProgressHook = hook;
  } else {
    hook = workInProgressHook;
    workInProgressHook = workInProgressHook.next;
  }

  const setState = (newValue) => {
    hook.memoizedState = typeof newValue === 'function' ? newValue(hook.memoizedState) : newValue;
  };

  return [hook.memoizedState, setState];
}
```

---

#### Solution for Question 4
Explanation:
`useLayoutEffect` runs synchronously in the Commit Phase immediately after React mutates the DOM, **before** the browser paints pixels to the screen. It blocks the browser from painting until its code finishes, making it ideal for reading layout measurements (such as `getBoundingClientRect`) and mutating the DOM without flickering.
`useEffect` runs asynchronously after the Commit Phase and **after** the browser has painted the screen. It is scheduled via a macrotask/scheduler message so it does not block the browser's visual update.

---

# 09. RECALL

1. On which property of a Fiber node is the hooks linked list stored?
2. Why does calling `setCount(prev => prev + 1)` avoid stale closure bugs?
3. Which effect hook runs synchronously before the browser paints: `useEffect` or `useLayoutEffect`?

---

### If you remember only one thing:
React hooks are indexed by their sequential position in a singly-linked list attached to the Fiber node, which is why hook call order must remain identical across all renders.
